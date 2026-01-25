import Imap from 'imap';
import { simpleParser } from 'mailparser';
import nodemailer from 'nodemailer';
import Email from '../models/Email.js';
import Folder from '../models/Folder.js';
import Label from '../models/Label.js';
import Contact from '../models/Contact.js';
import UserEmail from '../models/UserEmail.js';
import {
  sendNewEmail,
  sendEmailReadStatus,
  sendEmailSent,
  sendEmailFlagged,
  sendEmailMoved,
  sendEmailDeleted
} from '../config/socket.js';

/**
 * Email Controller
 * Handles all email operations
 */

// ===== IMAP CONNECTION =====

/**
 * Create IMAP connection
 */
const createImapConnection = (emailAccount) => {
  return new Imap({
    host: emailAccount.imap.host,
    port: emailAccount.imap.port,
    tls: emailAccount.imap.tls,
    user: emailAccount.imap.username,
    password: emailAccount.decrypt(emailAccount.imap.password),
    tlsOptions: { rejectUnauthorized: false }
  });
};

// ===== FETCH EMAILS =====

/**
 * Fetch emails from database
 */
const fetchEmails = async (req, res) => {
  try {
    const { folder = 'INBOX', limit = 50, skip = 0 } = req.query;
    const userId = req.user.id;
    const folderUpper = folder.toUpperCase();

    // Get user's primary email account
    const emailAccount = await UserEmail.getPrimaryEmail(userId);
    if (!emailAccount) {
      return res.status(404).json({
        success: false,
        message: 'No email account configured'
      });
    }

    let query = {
      user: userId,
      isDeleted: false
    };

    // For STARRED, fetch flagged emails instead of by folder
    if (folderUpper === 'STARRED') {
      query.isFlagged = true;
    } else {
      // For regular folders, use case-insensitive folder matching
      // Database has "Sent" but frontend sends "SENT"
      query.folder = new RegExp(`^${folder}$`, 'i');
    }

    const emails = await Email.find(query)
      .sort({ date: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .populate('labels', 'name color');

    res.status(200).json({
      success: true,
      count: emails.length,
      data: emails
    });
  } catch (error) {
    console.error('Error fetching emails:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch emails',
      error: error.message
    });
  }
};

/**
 * Sync emails from IMAP server or database
 */
const syncEmails = async (req, res) => {
  try {
    const { folder = 'INBOX' } = req.params;
    const userId = req.user.id;

    // Get user's primary email account
    const emailAccount = await UserEmail.getPrimaryEmail(userId);
    if (!emailAccount) {
      return res.status(404).json({
        success: false,
        message: 'No email account configured'
      });
    }

    const folderUpper = folder.toUpperCase();

    // For Starred folder, return flagged emails from database
    if (folderUpper === 'STARRED') {
      const emails = await Email.find({
        user: userId,
        isFlagged: true,
        isDeleted: false
      }).sort({ date: -1 });

      return res.status(200).json({
        success: true,
        message: 'Starred emails retrieved',
        syncedCount: emails.length,
        data: emails
      });
    }

    // For folders that don't exist on IMAP (Sent, Drafts, Trash, Archive), return from database
    // These are managed by our application when sending/saving emails
    if (!['INBOX'].includes(folderUpper)) {
      const emails = await Email.find({
        user: userId,
        folder: folderUpper,
        isDeleted: false
      }).sort({ date: -1 }).limit(100);

      return res.status(200).json({
        success: true,
        message: `${folder} emails retrieved from database`,
        syncedCount: emails.length,
        data: emails
      });
    }

    // Only INBOX syncs from IMAP server
    emailAccount.syncStatus = 'syncing';
    await emailAccount.save();

    const imap = createImapConnection(emailAccount);
    let syncedCount = 0;

    imap.once('ready', () => {
      imap.openBox(folder, false, (err, box) => {
        if (err) {
          imap.end();
          return res.status(500).json({
            success: false,
            message: 'Failed to open mailbox',
            error: err.message
          });
        }

        // Fetch recent emails - get last 100 emails
        const fetch = imap.fetch('1:*', ['body', 'peeks']);
        let emailCount = 0;
        const maxEmails = 100;

        fetch.on('message', (msg, seqno) => {
          if (emailCount >= maxEmails) return;
          emailCount++;

          let buffer = '';

          msg.on('body', (stream, info) => {
            stream.on('data', (chunk) => {
              buffer += chunk.toString('utf8');
            });

            stream.once('end', async () => {
              try {
                const parsed = await simpleParser(buffer);

                // Check if email already exists
                const existingEmail = await Email.findOne({
                  user: userId,
                  messageId: parsed.messageId
                });

                if (!existingEmail) {
                  // Create new email
                  const email = await Email.create({
                    user: userId,
                    emailAccount: emailAccount._id,
                    messageId: parsed.messageId,
                    uid: seqno,
                    folder: folderUpper,
                    from: {
                      name: parsed.from?.value?.[0]?.name || parsed.from?.from?.text || '',
                      email: parsed.from?.value?.[0]?.address || parsed.from?.from?.text || ''
                    },
                    to: parsed.to?.value?.map(addr => ({
                      name: addr?.name || '',
                      email: addr?.address || ''
                    })) || [],
                    cc: parsed.cc?.value?.map(addr => ({
                      name: addr?.name || '',
                      email: addr?.address || ''
                    })) || [],
                    subject: parsed.subject || '(No Subject)',
                    textBody: parsed.text,
                    htmlBody: parsed.html,
                    date: parsed.date || new Date(),
                    sentDate: parsed.date || new Date(),
                    hasAttachments: parsed.attachments && parsed.attachments.length > 0,
                    attachments: parsed.attachments?.map(att => ({
                      filename: att?.filename,
                      contentType: att?.contentType,
                      size: att?.size,
                      contentId: att?.contentId,
                      cid: att?.cid
                    })) || [],
                    inReplyTo: parsed.inReplyTo,
                    references: parsed.references || []
                  });

                  syncedCount++;

                  // Emit real-time notification
                  sendNewEmail(userId, email);

                  // Update or create contact
                  const fromEmail = parsed.from?.value?.[0]?.address || parsed.from?.from?.text || '';
                  const fromName = parsed.from?.value?.[0]?.name || parsed.from?.from?.text || fromEmail;

                  if (fromEmail) {
                    let contact = await Contact.findOne({
                      user: userId,
                      email: fromEmail
                    });

                    if (!contact) {
                      contact = await Contact.create({
                        user: userId,
                        name: fromName,
                        email: fromEmail
                      });
                    } else {
                      await contact.incrementFrequency();
                    }
                  }
                }
              } catch (error) {
                console.error('Error parsing email:', error);
              }
            });
          });
        });

        fetch.once('error', (err) => {
          console.error('Fetch error:', err);
          imap.end();
        });

        fetch.once('end', async () => {
          imap.end();

          // Update email account sync status
          emailAccount.syncStatus = 'success';
          emailAccount.lastSyncedAt = new Date();
          emailAccount.syncError = null;
          await emailAccount.save();

          // Update folder counts
          const folderDoc = await Folder.findOne({ user: userId, name: folder });
          if (folderDoc) {
            await folderDoc.updateCounts();
          }

          res.status(200).json({
            success: true,
            message: 'Emails synced successfully',
            syncedCount: syncedCount
          });
        });
      });
    });

    imap.once('error', async (err) => {
      console.error('IMAP error:', err);

      // Update email account sync status
      emailAccount.syncStatus = 'error';
      emailAccount.syncError = err.message;
      await emailAccount.save();

      res.status(500).json({
        success: false,
        message: 'IMAP connection error',
        error: err.message
      });
    });

    imap.connect();
  } catch (error) {
    console.error('Error syncing emails:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync emails',
      error: error.message
    });
  }
};

// ===== GET SINGLE EMAIL =====

/**
 * Get single email by ID
 */
const getEmail = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const email = await Email.findOne({
      _id: id,
      user: userId,
      isDeleted: false
    }).populate('labels', 'name color');

    if (!email) {
      return res.status(404).json({
        success: false,
        message: 'Email not found'
      });
    }

    res.status(200).json({
      success: true,
      data: email
    });
  } catch (error) {
    console.error('Error fetching email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch email',
      error: error.message
    });
  }
};

// ===== SEND EMAIL =====

/**
 * Send email via SMTP
 */
const sendEmail = async (req, res) => {
  try {
    const { to, cc, bcc, subject, textBody, htmlBody, attachments, replyTo } = req.body;
    const userId = req.user.id;

    // Get user's primary email account
    const emailAccount = await UserEmail.getPrimaryEmail(userId);
    if (!emailAccount) {
      return res.status(404).json({
        success: false,
        message: 'No email account configured'
      });
    }

    // Create SMTP transporter
    const transporter = nodemailer.createTransport({
      host: emailAccount.smtp.host,
      port: emailAccount.smtp.port,
      secure: emailAccount.smtp.secure,
      auth: {
        user: emailAccount.smtp.username,
        pass: emailAccount.decrypt(emailAccount.smtp.password)
      }
    });

    // Prepare email data
    const mailOptions = {
      from: `"${emailAccount.displayName || emailAccount.email}" <${emailAccount.email}>`,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject: subject || '(No Subject)'
    };

    if (cc) mailOptions.cc = Array.isArray(cc) ? cc.join(', ') : cc;
    if (bcc) mailOptions.bcc = Array.isArray(bcc) ? bcc.join(', ') : bcc;
    if (htmlBody) {
      mailOptions.html = htmlBody;
    } else {
      mailOptions.text = textBody || '';
    }
    if (attachments && attachments.length > 0) {
      mailOptions.attachments = attachments;
    }
    if (replyTo) {
      mailOptions.replyTo = replyTo;
    } else if (emailAccount.replyTo) {
      mailOptions.replyTo = emailAccount.replyTo;
    }

    // Send email
    const info = await transporter.sendMail(mailOptions);

    // Save sent email to database
    const sentEmail = await Email.create({
      user: userId,
      emailAccount: emailAccount._id,
      messageId: info.messageId,
      uid: Date.now(),
      folder: 'Sent',
      from: {
        name: emailAccount.displayName || emailAccount.email,
        email: emailAccount.email
      },
      to: Array.isArray(to) ? to.map(email => ({ email })) : [{ email: to }],
      cc: cc ? (Array.isArray(cc) ? cc.map(email => ({ email })) : [{ email: cc }]) : [],
      subject: subject || '(No Subject)',
      textBody: textBody,
      htmlBody: htmlBody,
      date: new Date(),
      sentDate: new Date(),
      hasAttachments: attachments && attachments.length > 0,
      attachments: attachments || []
    });

    // Update contacts
    const allRecipients = [
      ...(Array.isArray(to) ? to : [to]),
      ...(cc ? (Array.isArray(cc) ? cc : [cc]) : []),
      ...(bcc ? (Array.isArray(bcc) ? bcc : [bcc]) : [])
    ];

    for (const recipient of allRecipients) {
      let contact = await Contact.findOne({
        user: userId,
        email: recipient
      });

      if (!contact) {
        contact = await Contact.create({
          user: userId,
          name: recipient,
          email: recipient
        });
      } else {
        await contact.incrementFrequency();
      }
    }

    // Emit real-time notification
    sendEmailSent(userId, sentEmail);

    res.status(200).json({
      success: true,
      message: 'Email sent successfully',
      data: {
        messageId: info.messageId,
        email: sentEmail
      }
    });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send email',
      error: error.message
    });
  }
};

// ===== MARK AS READ =====

/**
 * Mark email as read/unread
 */
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const { isRead = true } = req.body;
    const userId = req.user.id;

    const email = await Email.findOne({
      _id: id,
      user: userId,
      isDeleted: false
    });

    if (!email) {
      return res.status(404).json({
        success: false,
        message: 'Email not found'
      });
    }

    email.isRead = isRead;
    await email.save();

    // Emit real-time notification
    sendEmailReadStatus(userId, {
      emailId: email._id,
      isRead: email.isRead
    });

    res.status(200).json({
      success: true,
      message: `Email marked as ${isRead ? 'read' : 'unread'}`,
      data: email
    });
  } catch (error) {
    console.error('Error marking email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark email',
      error: error.message
    });
  }
};

// ===== MARK MULTIPLE AS READ =====

/**
 * Mark multiple emails as read/unread
 */
const markMultipleAsRead = async (req, res) => {
  try {
    const { emailIds, isRead = true } = req.body;
    const userId = req.user.id;

    const result = await Email.updateMany(
      {
        _id: { $in: emailIds },
        user: userId,
        isDeleted: false
      },
      { isRead: isRead }
    );

    // Emit real-time notification
    sendEmailReadStatus(userId, {
      emailIds: emailIds,
      isRead: isRead
    });

    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} emails marked as ${isRead ? 'read' : 'unread'}`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error marking emails:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark emails',
      error: error.message
    });
  }
};

// ===== TOGGLE FLAG =====

/**
 * Toggle flagged status
 */
const toggleFlag = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const email = await Email.findOne({
      _id: id,
      user: userId,
      isDeleted: false
    });

    if (!email) {
      return res.status(404).json({
        success: false,
        message: 'Email not found'
      });
    }

    await email.toggleFlag();

    // Emit real-time notification
    sendEmailFlagged(userId, {
      emailId: email._id,
      isFlagged: email.isFlagged
    });

    res.status(200).json({
      success: true,
      message: `Email ${email.isFlagged ? 'flagged' : 'unflagged'}`,
      data: email
    });
  } catch (error) {
    console.error('Error toggling flag:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle flag',
      error: error.message
    });
  }
};

// ===== MOVE TO FOLDER =====

/**
 * Move email to folder
 */
const moveToFolder = async (req, res) => {
  try {
    const { id } = req.params;
    const { folder } = req.body;
    const userId = req.user.id;

    if (!folder) {
      return res.status(400).json({
        success: false,
        message: 'Folder is required'
      });
    }

    const email = await Email.findOne({
      _id: id,
      user: userId,
      isDeleted: false
    });

    if (!email) {
      return res.status(404).json({
        success: false,
        message: 'Email not found'
      });
    }

    await email.moveToFolder(folder);

    // Emit real-time notification
    sendEmailMoved(userId, {
      emailId: email._id,
      folder: email.folder
    });

    res.status(200).json({
      success: true,
      message: `Email moved to ${email.folder}`,
      data: email
    });
  } catch (error) {
    console.error('Error moving email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to move email',
      error: error.message
    });
  }
};

// ===== DELETE EMAIL =====

/**
 * Delete email (soft delete)
 */
const deleteEmail = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const email = await Email.findOne({
      _id: id,
      user: userId,
      isDeleted: false
    });

    if (!email) {
      return res.status(404).json({
        success: false,
        message: 'Email not found'
      });
    }

    await email.softDelete();

    // Emit real-time notification
    sendEmailDeleted(userId, {
      emailId: email._id,
      folder: email.folder
    });

    res.status(200).json({
      success: true,
      message: 'Email deleted successfully',
      data: email
    });
  } catch (error) {
    console.error('Error deleting email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete email',
      error: error.message
    });
  }
};

// ===== DELETE MULTIPLE =====

/**
 * Delete multiple emails
 */
const deleteMultipleEmails = async (req, res) => {
  try {
    const { emailIds } = req.body;
    const userId = req.user.id;

    const emails = await Email.find({
      _id: { $in: emailIds },
      user: userId,
      isDeleted: false
    });

    for (const email of emails) {
      await email.softDelete();
    }

    // Emit real-time notification
    sendEmailDeleted(userId, {
      emailIds: emailIds
    });

    res.status(200).json({
      success: true,
      message: `${emails.length} emails deleted successfully`,
      deletedCount: emails.length
    });
  } catch (error) {
    console.error('Error deleting emails:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete emails',
      error: error.message
    });
  }
};

// ===== SEARCH EMAILS =====

/**
 * Search emails
 */
const searchEmails = async (req, res) => {
  try {
    const { q, folder, limit = 50, skip = 0 } = req.query;
    const userId = req.user.id;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const options = {
      folder,
      limit: parseInt(limit),
      skip: parseInt(skip)
    };

    const emails = await Email.searchEmails(userId, q, options);

    res.status(200).json({
      success: true,
      count: emails.length,
      query: q,
      data: emails
    });
  } catch (error) {
    console.error('Error searching emails:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search emails',
      error: error.message
    });
  }
};

// ===== GET FOLDERS =====

/**
 * Get user's email folders
 */
const getFolders = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get system folders
    const systemFolders = Folder.getSystemFolders();

    // Get user's custom folders
    const userFolders = await Folder.getUserFolders(userId);

    // Combine and format
    const folders = systemFolders.map(folder => {
      const userFolder = userFolders.find(f => f.name === folder.name);
      return {
        ...folder,
        unreadCount: userFolder?.unreadCount || 0,
        totalCount: userFolder?.totalCount || 0
      };
    });

    // Add custom folders
    const customFolders = userFolders
      .filter(f => f.name === 'Custom')
      .map(f => ({
        name: f.customName,
        displayName: f.customName,
        icon: f.icon,
        color: f.color,
        unreadCount: f.unreadCount,
        totalCount: f.totalCount,
        isCustom: true
      }));

    res.status(200).json({
      success: true,
      data: [...folders, ...customFolders]
    });
  } catch (error) {
    console.error('Error fetching folders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch folders',
      error: error.message
    });
  }
};

// ===== GET UNREAD COUNT =====

/**
 * Get unread email count
 */
const getUnreadCount = async (req, res) => {
  try {
    const { folder = 'INBOX' } = req.query;
    const userId = req.user.id;

    const count = await Email.getUnreadCount(userId, folder);

    res.status(200).json({
      success: true,
      count: count
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unread count',
      error: error.message
    });
  }
};

// ===== GET LABELS =====

/**
 * Get user's labels
 */
const getLabels = async (req, res) => {
  try {
    const userId = req.user.id;

    const labels = await Label.getUserLabels(userId);

    res.status(200).json({
      success: true,
      data: labels
    });
  } catch (error) {
    console.error('Error fetching labels:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch labels',
      error: error.message
    });
  }
};

// ===== CREATE LABEL =====

/**
 * Create new label
 */
const createLabel = async (req, res) => {
  try {
    const { name, color, icon } = req.body;
    const userId = req.user.id;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Label name is required'
      });
    }

    const label = await Label.create({
      user: userId,
      name,
      color: color || '#1976d2',
      icon: icon || 'label'
    });

    res.status(201).json({
      success: true,
      message: 'Label created successfully',
      data: label
    });
  } catch (error) {
    console.error('Error creating label:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create label',
      error: error.message
    });
  }
};

// ===== ADD LABEL TO EMAIL =====

/**
 * Add label to email
 */
const addLabelToEmail = async (req, res) => {
  try {
    const { id, labelId } = req.params;
    const userId = req.user.id;

    const email = await Email.findOne({
      _id: id,
      user: userId,
      isDeleted: false
    });

    if (!email) {
      return res.status(404).json({
        success: false,
        message: 'Email not found'
      });
    }

    if (!email.labels.includes(labelId)) {
      email.labels.push(labelId);
      await email.save();
    }

    res.status(200).json({
      success: true,
      message: 'Label added to email',
      data: email
    });
  } catch (error) {
    console.error('Error adding label:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add label',
      error: error.message
    });
  }
};

// ===== REMOVE LABEL FROM EMAIL =====

/**
 * Remove label from email
 */
const removeLabelFromEmail = async (req, res) => {
  try {
    const { id, labelId } = req.params;
    const userId = req.user.id;

    const email = await Email.findOne({
      _id: id,
      user: userId,
      isDeleted: false
    });

    if (!email) {
      return res.status(404).json({
        success: false,
        message: 'Email not found'
      });
    }

    email.labels = email.labels.filter(label => label.toString() !== labelId);
    await email.save();

    res.status(200).json({
      success: true,
      message: 'Label removed from email',
      data: email
    });
  } catch (error) {
    console.error('Error removing label:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove label',
      error: error.message
    });
  }
};

// ===== GET CONTACTS =====

/**
 * Get user's contacts
 */
const getContacts = async (req, res) => {
  try {
    const { search } = req.query;
    const userId = req.user.id;

    let contacts;

    if (search) {
      contacts = await Contact.searchContacts(userId, search);
    } else {
      contacts = await Contact.find({
        user: userId,
        isDeleted: false
      }).sort({ frequencyScore: -1, name: 1 });
    }

    res.status(200).json({
      success: true,
      count: contacts.length,
      data: contacts
    });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contacts',
      error: error.message
    });
  }
};

// ===== CREATE CONTACT =====

/**
 * Create new contact
 */
const createContact = async (req, res) => {
  try {
    const { name, email, phone, company, notes } = req.body;
    const userId = req.user.id;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Name and email are required'
      });
    }

    const contact = await Contact.create({
      user: userId,
      name,
      email,
      phone,
      company,
      notes
    });

    res.status(201).json({
      success: true,
      message: 'Contact created successfully',
      data: contact
    });
  } catch (error) {
    console.error('Error creating contact:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create contact',
      error: error.message
    });
  }
};

export {
  fetchEmails,
  syncEmails,
  getEmail,
  sendEmail,
  markAsRead,
  markMultipleAsRead,
  toggleFlag,
  moveToFolder,
  deleteEmail,
  deleteMultipleEmails,
  searchEmails,
  getFolders,
  getUnreadCount,
  getLabels,
  createLabel,
  addLabelToEmail,
  removeLabelFromEmail,
  getContacts,
  createContact
};
