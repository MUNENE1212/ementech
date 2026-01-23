#!/usr/bin/env node
/**
 * Email Diagnostics Script
 *
 * Run this script to diagnose email delivery issues including:
 * - SMTP connection and authentication
 * - TLS/STARTTLS configuration
 * - DNS records (SPF, DKIM, DMARC, MX)
 * - Mailbox receiving capability
 *
 * Usage:
 *   node scripts/email-diagnostics.js
 *   node scripts/email-diagnostics.js --audit
 *   node scripts/email-diagnostics.js --smtp
 *   node scripts/email-diagnostics.js --test-send user@example.com
 *   node scripts/email-diagnostics.js --generate-dkim
 *
 * @version 1.0.0
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import {
  runSecurityAudit,
  diagnoseSMTP,
  testMailboxReceiving,
  generateDKIMKeyPair,
  validateSPF,
  validateDKIM,
  validateDMARC,
  validateMX,
} from '../src/services/emailSecurityService.js';

const EMAIL_DOMAIN = process.env.EMAIL_DOMAIN || 'ementech.co.ke';

// ============================================================================
// BANNER
// ============================================================================

function printBanner() {
  console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║                    📧 EmenTech Email Diagnostics 📧                        ║
╠═══════════════════════════════════════════════════════════════════════════╣
║  Domain: ${EMAIL_DOMAIN.padEnd(62)}║
║  SMTP:   ${(process.env.SMTP_HOST || 'mail.ementech.co.ke').padEnd(62)}║
║  Port:   ${(process.env.SMTP_PORT || '587').padEnd(62)}║
╚═══════════════════════════════════════════════════════════════════════════╝
`);
}

// ============================================================================
// TEST FUNCTIONS
// ============================================================================

async function runFullDiagnostics() {
  printBanner();

  console.log('Running full email diagnostics...\n');
  console.log('═══════════════════════════════════════════════════════════════════════════\n');

  // Step 1: DNS/Security Audit
  console.log('📋 Step 1: DNS & Security Audit');
  console.log('─────────────────────────────────────────────────────────────────────────────\n');
  await runSecurityAudit(EMAIL_DOMAIN);

  // Step 2: SMTP Diagnostics
  console.log('\n📋 Step 2: SMTP Connection Diagnostics');
  console.log('─────────────────────────────────────────────────────────────────────────────\n');
  await diagnoseSMTP();

  // Step 3: Mailbox Receiving (for the configured admin email)
  const adminEmail = process.env.SMTP_USER || `admin@${EMAIL_DOMAIN}`;
  console.log('\n📋 Step 3: Mailbox Receiving Capability');
  console.log('─────────────────────────────────────────────────────────────────────────────\n');
  await testMailboxReceiving(adminEmail);

  // Summary
  console.log('\n═══════════════════════════════════════════════════════════════════════════');
  console.log('📋 DIAGNOSTICS COMPLETE');
  console.log('═══════════════════════════════════════════════════════════════════════════\n');

  console.log('Next Steps:');
  console.log('1. If DNS records are missing, add them to your domain registrar');
  console.log('2. If SMTP connection fails, check firewall and server configuration');
  console.log('3. For 451 4.3.5 errors, check Postfix/Dovecot configuration on mail server');
  console.log('4. Generate DKIM keys with: node scripts/email-diagnostics.js --generate-dkim');
  console.log('');
}

async function testSendEmail(recipient) {
  printBanner();

  console.log(`📤 Sending test email to: ${recipient}\n`);

  const nodemailer = await import('nodemailer');

  const transporter = nodemailer.default.createTransport({
    host: process.env.SMTP_HOST || 'mail.ementech.co.ke',
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    requireTLS: true,
    tls: {
      minVersion: 'TLSv1.2',
      rejectUnauthorized: false, // For testing
    },
    debug: true,
    logger: true,
  });

  try {
    console.log('Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified\n');

    console.log('Sending test email...');
    const result = await transporter.sendMail({
      from: `"EmenTech Test" <${process.env.SMTP_USER}>`,
      to: recipient,
      subject: `Email Test - ${new Date().toISOString()}`,
      text: `This is a test email from EmenTech email diagnostics.

Sent at: ${new Date().toISOString()}
From server: ${process.env.SMTP_HOST}
`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #667eea;">📧 EmenTech Email Test</h2>
          <p>This is a test email from the EmenTech email diagnostics tool.</p>
          <table style="border-collapse: collapse; margin-top: 20px;">
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>Sent at:</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${new Date().toISOString()}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>SMTP Server:</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${process.env.SMTP_HOST}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>From:</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${process.env.SMTP_USER}</td>
            </tr>
          </table>
        </div>
      `,
    });

    console.log('\n✅ Test email sent successfully!');
    console.log(`   Message ID: ${result.messageId}`);
    console.log(`   Response: ${result.response}`);
    console.log(`\nCheck ${recipient} inbox for the test email.`);

  } catch (error) {
    console.error('\n❌ Failed to send test email:');
    console.error(`   Error: ${error.message}`);
    if (error.responseCode) {
      console.error(`   SMTP Code: ${error.responseCode}`);
    }
    if (error.response) {
      console.error(`   Response: ${error.response}`);
    }

    // Provide specific guidance for common errors
    console.log('\n💡 Troubleshooting:');
    if (error.responseCode === 451) {
      console.log('   451 = Server configuration problem');
      console.log('   Check: Postfix main.cf, virtual_mailbox_domains, virtual_mailbox_maps');
    } else if (error.responseCode === 550) {
      console.log('   550 = Recipient address rejected');
      console.log('   Check: Mailbox exists, domain is configured');
    } else if (error.responseCode === 553) {
      console.log('   553 = Sender address rejected');
      console.log('   Check: From address matches authenticated user');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('   Connection refused - check firewall and SMTP port');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('   Connection timeout - check network and server availability');
    }
  }
}

// ============================================================================
// CLI
// ============================================================================

const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case '--audit':
  case '-a':
    runSecurityAudit(EMAIL_DOMAIN);
    break;

  case '--smtp':
  case '-s':
    diagnoseSMTP();
    break;

  case '--test-send':
  case '-t':
    const recipient = args[1];
    if (!recipient) {
      console.error('Error: Please provide a recipient email address');
      console.log('Usage: node scripts/email-diagnostics.js --test-send user@example.com');
      process.exit(1);
    }
    testSendEmail(recipient);
    break;

  case '--mailbox':
  case '-m':
    const email = args[1] || process.env.SMTP_USER;
    testMailboxReceiving(email);
    break;

  case '--generate-dkim':
  case '-g':
    generateDKIMKeyPair();
    break;

  case '--spf':
    validateSPF(EMAIL_DOMAIN).then(console.log);
    break;

  case '--dkim':
    validateDKIM(EMAIL_DOMAIN).then(console.log);
    break;

  case '--dmarc':
    validateDMARC(EMAIL_DOMAIN).then(console.log);
    break;

  case '--mx':
    validateMX(EMAIL_DOMAIN).then(console.log);
    break;

  case '--help':
  case '-h':
    printBanner();
    console.log(`
Usage: node scripts/email-diagnostics.js [command]

Commands:
  (no args)        Run full diagnostics
  --audit, -a      Run DNS/security audit only
  --smtp, -s       Run SMTP diagnostics only
  --test-send, -t  Send test email (requires recipient address)
  --mailbox, -m    Test mailbox receiving capability
  --generate-dkim  Generate new DKIM key pair
  --spf            Check SPF record
  --dkim           Check DKIM record
  --dmarc          Check DMARC record
  --mx             Check MX records
  --help, -h       Show this help

Examples:
  node scripts/email-diagnostics.js
  node scripts/email-diagnostics.js --test-send user@gmail.com
  node scripts/email-diagnostics.js --generate-dkim
`);
    break;

  default:
    runFullDiagnostics();
}
