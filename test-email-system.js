/**
 * Email System Test Script
 * Tests IMAP connection, SMTP connection, and basic email operations
 */

import Imap from 'imap';
import nodemailer from 'nodemailer';
import { simpleParser } from 'mailparser';
import dotenv from 'dotenv';

dotenv.config();

// Test configuration
const imapConfig = {
  host: process.env.IMAP_HOST || 'mail.ementech.co.ke',
  port: parseInt(process.env.IMAP_PORT) || 993,
  tls: true,
  user: process.env.IMAP_USER || 'admin@ementech.co.ke',
  password: process.env.IMAP_PASS || 'Admin2026!',
  tlsOptions: { rejectUnauthorized: false }
};

const smtpConfig = {
  host: process.env.SMTP_HOST || 'mail.ementech.co.ke',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || 'admin@ementech.co.ke',
    pass: process.env.SMTP_PASS || 'Admin2026!'
  }
};

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Test 1: IMAP Connection
async function testImapConnection() {
  log('\n=== TEST 1: IMAP Connection ===', 'blue');

  return new Promise((resolve, reject) => {
    const imap = new Imap(imapConfig);

    imap.once('ready', () => {
      log('✅ IMAP connection successful!', 'green');

      imap.openBox('INBOX', false, (err, box) => {
        if (err) {
          log(`❌ Error opening INBOX: ${err.message}`, 'red');
          imap.end();
          return reject(err);
        }

        log(`✅ INBOX opened successfully`, 'green');
        log(`   Total messages: ${box.messages.total}`, 'yellow');
        log(`   Unread messages: ${box.messages.unseen}`, 'yellow');

        imap.end();
        resolve({ success: true, total: box.messages.total, unseen: box.messages.unseen });
      });
    });

    imap.once('error', (err) => {
      log(`❌ IMAP connection failed: ${err.message}`, 'red');
      reject(err);
    });

    imap.connect();
  });
}

// Test 2: SMTP Connection
async function testSmtpConnection() {
  log('\n=== TEST 2: SMTP Connection ===', 'blue');

  try {
    const transporter = nodemailer.createTransporter(smtpConfig);

    await transporter.verify();
    log('✅ SMTP connection successful!', 'green');

    const info = await transporter.sendMail({
      from: `"Test Sender" <${smtpConfig.auth.user}>`,
      to: smtpConfig.auth.user,
      subject: 'Test Email from EmenTech System',
      text: 'This is a test email to verify SMTP functionality.',
      html: '<p>This is a test email to verify SMTP functionality.</p>'
    });

    log(`✅ Test email sent successfully!`, 'green');
    log(`   Message ID: ${info.messageId}`, 'yellow');

    return { success: true, messageId: info.messageId };
  } catch (error) {
    log(`❌ SMTP test failed: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

// Test 3: Fetch Recent Emails
async function testFetchEmails() {
  log('\n=== TEST 3: Fetch Recent Emails ===', 'blue');

  return new Promise((resolve, reject) => {
    const imap = new Imap(imapConfig);

    imap.once('ready', () => {
      imap.openBox('INBOX', false, (err, box) => {
        if (err) {
          log(`❌ Error opening INBOX: ${err.message}`, 'red');
          imap.end();
          return reject(err);
        }

        // Fetch last 5 emails
        const fetch = imap.fetch(box.messages.total + 1 - Math.min(5, box.messages.total), {
          bodies: '',
          markSeen: false
        });

        let emails = [];

        fetch.on('message', (msg, seqno) => {
          let buffer = '';

          msg.on('body', (stream) => {
            stream.on('data', (chunk) => {
              buffer += chunk.toString('utf8');
            });

            stream.once('end', async () => {
              try {
                const parsed = await simpleParser(buffer);
                emails.push({
                  seqno,
                  from: parsed.from?.text || 'Unknown',
                  to: parsed.to?.text || 'Unknown',
                  subject: parsed.subject || '(No Subject)',
                  date: parsed.date
                });
              } catch (error) {
                log(`   Error parsing email: ${error.message}`, 'yellow');
              }
            });
          });
        });

        fetch.once('error', (err) => {
          log(`❌ Fetch error: ${err.message}`, 'red');
          imap.end();
          reject(err);
        });

        fetch.once('end', () => {
          imap.end();

          if (emails.length > 0) {
            log(`✅ Successfully fetched ${emails.length} recent emails:`, 'green');
            emails.forEach((email, index) => {
              log(`   ${index + 1}. ${email.subject}`, 'yellow');
              log(`      From: ${email.from}`, 'yellow');
            });
            resolve({ success: true, count: emails.length, emails });
          } else {
            log('⚠️  No emails found in INBOX', 'yellow');
            resolve({ success: true, count: 0, emails: [] });
          }
        });
      });
    });

    imap.once('error', (err) => {
      log(`❌ IMAP connection failed: ${err.message}`, 'red');
      reject(err);
    });

    imap.connect();
  });
}

// Main test runner
async function runTests() {
  log('╔═══════════════════════════════════════╗', 'blue');
  log('║   EmenTech Email System Test         ║', 'blue');
  log('╚═══════════════════════════════════════╝', 'blue');

  log('\nConfiguration:', 'yellow');
  log(`   IMAP: ${imapConfig.host}:${imapConfig.port}`, 'yellow');
  log(`   SMTP: ${smtpConfig.host}:${smtpConfig.port}`, 'yellow');
  log(`   User: ${imapConfig.user}`, 'yellow');

  const results = {
    imap: { success: false },
    smtp: { success: false },
    fetch: { success: false }
  };

  // Run tests
  try {
    results.imap = await testImapConnection();
  } catch (error) {
    results.imap = { success: false, error: error.message };
  }

  try {
    results.smtp = await testSmtpConnection();
  } catch (error) {
    results.smtp = { success: false, error: error.message };
  }

  try {
    results.fetch = await testFetchEmails();
  } catch (error) {
    results.fetch = { success: false, error: error.message };
  }

  // Summary
  log('\n═══════════════════════════════════════', 'blue');
  log('TEST SUMMARY', 'blue');
  log('═══════════════════════════════════════', 'blue');

  log(`\n1. IMAP Connection:`, results.imap.success ? 'green' : 'red');
  log(`   Status: ${results.imap.success ? '✅ PASS' : '❌ FAIL'}`, results.imap.success ? 'green' : 'red');

  log(`\n2. SMTP Connection:`, results.smtp.success ? 'green' : 'red');
  log(`   Status: ${results.smtp.success ? '✅ PASS' : '❌ FAIL'}`, results.smtp.success ? 'green' : 'red');

  log(`\n3. Email Fetching:`, results.fetch.success ? 'green' : 'red');
  log(`   Status: ${results.fetch.success ? '✅ PASS' : '❌ FAIL'}`, results.fetch.success ? 'green' : 'red');

  // Overall result
  const allPassed = results.imap.success && results.smtp.success && results.fetch.success;

  log('\n═══════════════════════════════════════', 'blue');
  if (allPassed) {
    log('OVERALL: ✅ ALL TESTS PASSED', 'green');
    log('\nYour email system is fully operational!', 'green');
  } else {
    log('OVERALL: ⚠️  SOME TESTS FAILED', 'yellow');
    log('\nPlease check the failed tests above.', 'yellow');
  }
  log('═══════════════════════════════════════\n', 'blue');

  process.exit(allPassed ? 0 : 1);
}

// Run the tests
runTests().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
