import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import User from './src/models/User.js';
import UserEmail from './src/models/UserEmail.js';
import Email from './src/models/Email.js';
import Imap from 'imap';
import { simpleParser } from 'mailparser';

const syncEmails = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Get admin user
    const admin = await User.findOne({ email: 'admin@ementech.co.ke' });
    if (!admin) {
      console.log('❌ Admin user not found');
      process.exit(1);
    }

    // Get email account
    const emailAccount = await UserEmail.getPrimaryEmail(admin._id);
    if (!emailAccount) {
      console.log('❌ No email account configured');
      process.exit(1);
    }

    console.log('=== EMAIL ACCOUNT ===');
    console.log('Email:', emailAccount.email);
    console.log('IMAP Host:', emailAccount.imap.host);
    console.log('IMAP Port:', emailAccount.imap.port);
    console.log('');

    // Create IMAP connection
    const imap = new Imap({
      host: emailAccount.imap.host,
      port: emailAccount.imap.port,
      tls: emailAccount.imap.tls,
      user: emailAccount.imap.username,
      password: emailAccount.decrypt(emailAccount.imap.password),
      tlsOptions: { rejectUnauthorized: false }
    });

    let syncedCount = 0;
    let totalMessages = 0;

    imap.once('ready', () => {
      console.log('✅ Connected to IMAP server');

      imap.openBox('INBOX', false, (err, box) => {
        if (err) {
          console.error('❌ Error opening INBOX:', err.message);
          imap.end();
          return;
        }

        console.log('\n=== INBOX ===');
        console.log('Total messages:', box.messages.total);
        console.log('Unseen messages:', box.messages.unseen);
        console.log('');

        totalMessages = box.messages.total;

        if (totalMessages === 0) {
          console.log('⚠️ No messages in INBOX');
          imap.end();
          return;
        }

        // Fetch all messages
        const fetch = imap.fetch(box.messages.total + 1 - Math.min(50, box.messages.total), {
          bodies: '',
          markSeen: false
        });

        fetch.on('message', (msg, seqno) => {
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
                  user: admin._id,
                  messageId: parsed.messageId
                });

                if (!existingEmail) {
                  // Create new email
                  const email = await Email.create({
                    user: admin._id,
                    emailAccount: emailAccount._id,
                    messageId: parsed.messageId,
                    uid: seqno,
                    folder: 'INBOX',
                    from: {
                      name: parsed.from?.value[0]?.name || '',
                      email: parsed.from?.value[0]?.address || ''
                    },
                    to: parsed.to?.value.map(addr => ({
                      name: addr.name || '',
                      email: addr.address || ''
                    })) || [],
                    cc: parsed.cc?.value.map(addr => ({
                      name: addr.name || '',
                      email: addr.address || ''
                    })) || [],
                    subject: parsed.subject || '(No Subject)',
                    textBody: parsed.text,
                    htmlBody: parsed.html,
                    date: parsed.date,
                    sentDate: parsed.date,
                    hasAttachments: parsed.attachments && parsed.attachments.length > 0,
                    attachments: parsed.attachments?.map(att => ({
                      filename: att.filename,
                      contentType: att.contentType,
                      size: att.size,
                      contentId: att.contentId,
                      cid: att.cid
                    })) || [],
                    inReplyTo: parsed.inReplyTo,
                    references: parsed.references || []
                  });

                  syncedCount++;
                  console.log(`✅ Synced: ${parsed.subject || '(No Subject)'}`);
                } else {
                  console.log(`⏭️ Skipped: ${parsed.subject || '(No Subject)'} (already exists)`);
                }
              } catch (error) {
                console.error('❌ Error parsing email:', error.message);
              }
            });
          });
        });

        fetch.once('error', (err) => {
          console.error('❌ Fetch error:', err);
          imap.end();
        });

        fetch.once('end', async () => {
          imap.end();

          console.log('\n=== SYNC SUMMARY ===');
          console.log('Total messages in INBOX:', totalMessages);
          console.log('New emails synced:', syncedCount);
          console.log('Already in database:', totalMessages - syncedCount);

          // Update email account sync status
          emailAccount.syncStatus = 'success';
          emailAccount.lastSyncedAt = new Date();
          await emailAccount.save();

          await mongoose.connection.close();
        });
      });
    });

    imap.once('error', (err) => {
      console.error('❌ IMAP error:', err.message);
      process.exit(1);
    });

    imap.connect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

syncEmails();
