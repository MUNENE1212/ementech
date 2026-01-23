/**
 * Test Script: Sync Emails from IMAP
 * Fetches emails from the mail server
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Imap from 'imap';
import { simpleParser } from 'mailparser';
import User from './src/models/User.js';
import UserEmail from './src/models/UserEmail.js';
import Email from './src/models/Email.js';

dotenv.config();

/**
 * Sync emails from IMAP server
 */
const syncEmails = async () => {
  try {
    console.log('╔══════════════════════════════════════════════╗');
    console.log('║   📧 Testing Email Sync (IMAP)             ║');
    console.log('╚══════════════════════════════════════════════╝\n');

    // Connect to MongoDB
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ementech');
    console.log('✅ Connected to MongoDB\n');

    // Get admin user
    console.log('👤 Looking up admin user...');
    const adminUser = await User.findOne({ email: 'admin@ementech.co.ke' });
    if (!adminUser) {
      throw new Error('Admin user not found!');
    }
    console.log(`✅ Found admin user: ${adminUser.name}\n`);

    // Get email account
    console.log('📧 Looking up email account...');
    const emailAccount = await UserEmail.findOne({
      user: adminUser._id,
      email: 'admin@ementech.co.ke'
    });
    if (!emailAccount) {
      throw new Error('Email account not found!');
    }
    console.log(`✅ Found email account: ${emailAccount.email}\n`);

    // Create IMAP connection
    console.log('🔄 Connecting to IMAP server...');
    const imap = new Imap({
      host: emailAccount.imap.host,
      port: emailAccount.imap.port,
      tls: emailAccount.imap.tls,
      user: emailAccount.imap.username,
      password: emailAccount.decrypt(emailAccount.imap.password),
      tlsOptions: { rejectUnauthorized: false }
    });

    let syncedCount = 0;
    let existingCount = 0;

    imap.once('ready', () => {
      console.log('✅ IMAP connection established\n');

      imap.openBox('INBOX', false, (err, box) => {
        if (err) {
          console.error('❌ Error opening INBOX:', err.message);
          imap.end();
          throw err;
        }

        console.log(`📬 INBOX opened`);
        console.log(`   Total messages: ${box.messages.total}`);
        console.log(`   Unread messages: ${box.messages.unseen}\n`);

        if (box.messages.total === 0) {
          console.log('📭 No emails in INBOX (mailbox is empty)');
          imap.end();
          return;
        }

        // Fetch recent emails (last 10)
        const fetch = imap.fetch(box.messages.total + 1 - Math.min(10, box.messages.total), {
          bodies: '',
          markSeen: false
        });

        console.log('📥 Fetching recent emails...\n');

        fetch.on('message', (msg, seqno) => {
          let buffer = '';

          msg.on('body', (stream) => {
            stream.on('data', (chunk) => {
              buffer += chunk.toString('utf8');
            });

            stream.once('end', async () => {
              try {
                const parsed = await simpleParser(buffer);

                // Check if email already exists
                const existingEmail = await Email.findOne({
                  user: adminUser._id,
                  messageId: parsed.messageId
                });

                if (existingEmail) {
                  existingCount++;
                  console.log(`   ℹ️  [${seqno}] Already in DB: ${parsed.subject || '(No Subject)'}`);
                } else {
                  // Create new email
                  const email = await Email.create({
                    user: adminUser._id,
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
                    subject: parsed.subject || '(No Subject)',
                    textBody: parsed.text,
                    htmlBody: parsed.html,
                    date: parsed.date,
                    sentDate: parsed.date,
                    hasAttachments: parsed.attachments && parsed.attachments.length > 0
                  });

                  syncedCount++;
                  console.log(`   ✅ [${seqno}] NEW: ${parsed.subject || '(No Subject)'}`);
                  console.log(`      From: ${parsed.from?.value[0]?.address || 'Unknown'}`);
                  console.log(`      Date: ${parsed.date?.toLocaleString()}\n`);
                }
              } catch (error) {
                console.error(`   ❌ Error parsing email ${seqno}:`, error.message);
              }
            });
          });
        });

        fetch.once('error', (err) => {
          console.error('❌ Fetch error:', err.message);
          imap.end();
        });

        fetch.once('end', async () => {
          imap.end();

          console.log('╔══════════════════════════════════════════════╗');
          console.log('║   ✅ Email Sync Completed!                 ║');
          console.log('╚══════════════════════════════════════════════╝\n');

          console.log('📊 Sync Summary:');
          console.log(`   New emails synced: ${syncedCount}`);
          console.log(`   Already in database: ${existingCount}`);
          console.log(`   Total emails in INBOX: ${box.messages.total}\n`);

          if (syncedCount > 0) {
            console.log('✅ New emails have been added to the database!\n');
          }

          console.log('🔍 View emails in MongoDB:');
          console.log(`   db.emails.find({user: ObjectId("${adminUser._id}")}).count()\n`);
        });
      });
    });

    imap.once('error', async (err) => {
      console.error('\n❌ IMAP error:', err.message);
      process.exit(1);
    });

    imap.connect();

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

// Run the sync
syncEmails();
