import Imap from 'imap';
import { simpleParser } from 'mailparser';
import User from '../models/User.js';
import UserEmail from '../models/UserEmail.js';
import Email from '../models/Email.js';
import { sendNewEmail } from '../config/socket.js';

/**
 * IMAP Watcher Service
 * Monitors email accounts in real-time using IMAP IDLE or polling
 * Pushes new emails to clients via Socket.IO
 */

class IMAPWatcher {
  constructor() {
    this.watchers = new Map(); // userId -> Imap connection
    this.syncIntervals = new Map(); // userId -> interval ID
    this.pollingActive = new Map(); // userId -> boolean (is polling in progress)
  }

  /**
   * Start watching a user's email account
   */
  async startWatching(userId) {
    try {
      // Stop existing watcher if any
      await this.stopWatching(userId);

      // Get user's primary email account
      const emailAccount = await UserEmail.getPrimaryEmail(userId);
      if (!emailAccount) {
        return;
      }

      // Try IMAP IDLE first (for real-time push)
      const idleSupported = await this.tryIDLE(userId, emailAccount);

      // Fall back to polling if IDLE not supported
      if (!idleSupported) {
        this.startPolling(userId, emailAccount);
      }
    } catch (error) {
      console.error(`❌ Error starting watcher for user ${userId}:`, error.message);
    }
  }

  /**
   * Try to use IMAP IDLE for real-time notifications
   */
  async tryIDLE(userId, emailAccount) {
    return new Promise((resolve) => {
      const imap = new Imap({
        host: emailAccount.imap.host,
        port: emailAccount.imap.port,
        tls: emailAccount.imap.tls,
        user: emailAccount.imap.username,
        password: emailAccount.decrypt(emailAccount.imap.password),
        tlsOptions: { rejectUnauthorized: false }
      });

      let idleSupported = false;
      let lastUid = 0;

      imap.once('ready', () => {
        imap.openBox('INBOX', false, (err, box) => {
          if (err) {
            console.error('Error opening INBOX:', err.message);
            imap.end();
            resolve(false);
            return;
          }

          // Get highest UID
          lastUid = box.uidnext - 1;

          // Check if IDLE is supported
          if (box.capabilities && box.capabilities.includes('IDLE')) {
            idleSupported = true;

            // Watch for new messages
            imap.on('update', (seqno, info) => {
              if (info && info.uid > lastUid) {
                this.fetchNewEmails(userId, emailAccount, imap, lastUid, box);
                lastUid = info.uid;
              }
            });

            // Start IDLE mode
            imap.idle();

            // Re-enter IDLE after timeout (keep-alive)
            const idleRefresh = setInterval(() => {
              if (imap.state === 'authenticated') {
                imap.idle();
              } else {
                clearInterval(idleRefresh);
              }
            }, 5 * 60 * 1000); // Every 5 minutes

            this.watchers.set(userId, { imap, type: 'IDLE', interval: idleRefresh });
            resolve(true);
          } else {
            imap.end();
            resolve(false);
          }
        });
      });

      imap.once('error', (err) => {
        console.error(`IMAP error for ${emailAccount.email}:`, err.message);
        imap.end();
        resolve(false);
      });

      imap.once('end', () => {
        if (this.watchers.has(userId)) {
          const watcher = this.watchers.get(userId);
          if (watcher.interval) {
            clearInterval(watcher.interval);
          }
          this.watchers.delete(userId);
        }
      });

      imap.connect();
    });
  }

  /**
   * Start polling as fallback (check for new emails every 30 seconds)
   */
  startPolling(userId, emailAccount) {
    const interval = setInterval(async () => {
      // Skip if a poll is already in progress
      if (this.pollingActive.get(userId)) {
        return;
      }

      try {
        this.pollingActive.set(userId, true);

        const imap = new Imap({
          host: emailAccount.imap.host,
          port: emailAccount.imap.port,
          tls: emailAccount.imap.tls,
          user: emailAccount.imap.username,
          password: emailAccount.decrypt(emailAccount.imap.password),
          tlsOptions: { rejectUnauthorized: false }
        });

        imap.once('ready', () => {
          imap.openBox('INBOX', false, async (err, box) => {
            if (err) {
              console.error('Error opening INBOX during polling:', err.message);
              this.pollingActive.set(userId, false);
              imap.end();
              return;
            }

            try {
              // Get latest UID from database
              const latestEmail = await Email.findOne({
                user: userId,
                folder: 'INBOX'
              }).sort({ uid: -1 });

              const lastUid = latestEmail?.uid || 0;
              const currentUid = box.uidnext - 1;

              if (currentUid > lastUid) {
                await this.fetchNewEmails(userId, emailAccount, imap, lastUid, box);
              }
            } catch (error) {
              console.error('Error in polling check:', error.message);
            } finally {
              this.pollingActive.set(userId, false);
              imap.end();
            }
          });
        });

        imap.once('error', (err) => {
          console.error(`Polling error for ${emailAccount.email}:`, err.message);
          this.pollingActive.set(userId, false);
        });

        imap.connect();
      } catch (error) {
        console.error(`Polling error:`, error.message);
        this.pollingActive.set(userId, false);
      }
    }, 30000); // Every 30 seconds

    this.syncIntervals.set(userId, interval);
  }

  /**
   * Fetch and process new emails
   */
  async fetchNewEmails(userId, emailAccount, imap, sinceUid, box) {
    // Fetch emails with UID > sinceUid
    const fetch = imap.fetch(`${sinceUid + 1}:*`, {
      bodies: '',
      markSeen: false
    });

    fetch.on('message', (msg, seqno) => {
      let buffer = '';
      let uid = null;

      msg.on('attributes', (attrs) => {
        uid = attrs.uid;
      });

      msg.on('body', (stream, info) => {
        stream.on('data', (chunk) => {
          buffer += chunk.toString('utf8');
        });

        stream.once('end', async () => {
          try {
            const parsed = await simpleParser(buffer);
            const messageId = parsed.messageId || `<${parsed.date?.getTime()}@ementech.co.ke>`;

            // Check if email already exists
            const existingEmail = await Email.findOne({
              user: userId,
              messageId: messageId
            });

            if (existingEmail) {
              // Email already exists, skip
            } else {
              // Create new email
              const email = await Email.create({
                user: userId,
                emailAccount: emailAccount._id,
                messageId: messageId,
                uid: uid || seqno,
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
                date: parsed.date || new Date(),
                sentDate: parsed.date,
                hasAttachments: parsed.attachments && parsed.attachments.length > 0,
                attachments: parsed.attachments?.map(att => ({
                  filename: att.filename,
                  contentType: att.contentType,
                  size: att.size
                })) || [],
                inReplyTo: parsed.inReplyTo,
                references: parsed.references || []
              });

              // Push to client via Socket.IO
              sendNewEmail(userId, email);
            }
          } catch (error) {
                console.error(`Error parsing email UID ${uid}:`, error.message);
              }
            });
          });
        });

    fetch.once('error', (err) => {
      console.error('Fetch error:', err.message);
    });
  }

  /**
   * Stop watching a user's email
   */
  async stopWatching(userId) {
    // Stop IMAP connection
    if (this.watchers.has(userId)) {
      const watcher = this.watchers.get(userId);
      if (watcher.imap) {
        watcher.imap.end();
      }
      if (watcher.interval) {
        clearInterval(watcher.interval);
      }
      this.watchers.delete(userId);
    }

    // Stop polling interval
    if (this.syncIntervals.has(userId)) {
      clearInterval(this.syncIntervals.get(userId));
      this.syncIntervals.delete(userId);
    }
  }

  /**
   * Stop all watchers
   */
  async stopAll() {
    for (const userId of this.watchers.keys()) {
      await this.stopWatching(userId);
    }
  }
}

// Singleton instance
const imapWatcher = new IMAPWatcher();

// Start watching for all active users on server start
const startAllWatchers = async () => {
  try {
    const users = await User.find({ isActive: true });

    for (const user of users) {
      await imapWatcher.startWatching(user._id);
    }
  } catch (error) {
    console.error('Error starting watchers:', error.message);
  }
};

export { imapWatcher, startAllWatchers };
export default imapWatcher;
