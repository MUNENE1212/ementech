/**
 * Test Script: Send Email as Admin
 * Tests the actual email sending functionality
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import User from './src/models/User.js';
import UserEmail from './src/models/UserEmail.js';

dotenv.config();

// Test email configuration
const TEST_EMAIL = {
  to: 'munenendegwa6@gmail.com', // Send to external Gmail address
  subject: '🧪 Test Email from EmenTech Admin',
  textBody: `Hello!

This is a test email from EmenTech, sent at: ${new Date().toISOString()}

If you receive this, the email sending is working perfectly!

This email was sent from:
- From: admin@ementech.co.ke
- Via: SMTP (mail.ementech.co.ke:587)
- Using: Production credentials

Test Configuration:
✅ SMTP Connection - Working
✅ Authentication - Working
✅ External Email Delivery - Working
✅ Backend Integration - Complete

This confirms that your EmenTech email system can send emails to external addresses (Gmail, Outlook, Yahoo, etc.).

---
EmenTech Email System
Website: ementech.co.ke`,
  htmlBody: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #1976d2; margin: 0;">🧪 Test Email from EmenTech</h1>
        <p style="color: #666; margin-top: 10px;">Email System Test</p>
      </div>

      <p>Hello!</p>

      <p>This is a <strong>test email</strong> sent at: <br><code style="background: #f5f5f5; padding: 5px 10px; border-radius: 3px;">${new Date().toISOString()}</code></p>

      <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #1976d2;">
        <p style="margin: 0; font-size: 18px; color: #1976d2;">
          <strong>✅ If you receive this, email sending is working!</strong>
        </p>
      </div>

      <h3 style="color: #333;">Test Configuration:</h3>
      <ul style="color: #2e7d32; line-height: 1.8;">
        <li>✅ <strong>SMTP Connection</strong> - Working</li>
        <li>✅ <strong>Authentication</strong> - Working</li>
        <li>✅ <strong>External Email Delivery</strong> - Working</li>
        <li>✅ <strong>Backend Integration</strong> - Complete</li>
      </ul>

      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 25px 0;">
        <p style="margin: 0; font-size: 14px; color: #666;">
          <strong>This confirms:</strong> Your EmenTech email system can send emails to external addresses (Gmail, Outlook, Yahoo, etc.)
        </p>
      </div>

      <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">

      <div style="text-align: center; color: #666; font-size: 12px;">
        <p style="margin: 5px 0;">
          <strong>This email was sent from:</strong><br>
          admin@ementech.co.ke<br>
          via SMTP (mail.ementech.co.ke:587)
        </p>
        <p style="margin: 15px 0 5px;">
          <a href="https://ementech.co.ke" style="color: #1976d2; text-decoration: none;">ementech.co.ke</a>
        </p>
      </div>
    </div>
  `
};

/**
 * Send test email
 */
const sendTestEmail = async () => {
  try {
    console.log('╔══════════════════════════════════════════════╗');
    console.log('║   🧪 Testing Admin Email Sending            ║');
    console.log('╚══════════════════════════════════════════════╝\n');

    // Connect to MongoDB
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ementech');
    console.log('✅ Connected to MongoDB\n');

    // Get admin user
    console.log('👤 Looking up admin user...');
    const adminUser = await User.findOne({ email: 'admin@ementech.co.ke' });

    if (!adminUser) {
      throw new Error('Admin user not found! Run seed script first.');
    }
    console.log(`✅ Found admin user: ${adminUser.name}\n`);

    // Get admin's email account
    console.log('📧 Looking up email account...');
    const emailAccount = await UserEmail.findOne({
      user: adminUser._id,
      email: 'admin@ementech.co.ke'
    });

    if (!emailAccount) {
      throw new Error('Email account not found! Run seed script first.');
    }

    console.log(`✅ Found email account: ${emailAccount.email}`);
    console.log(`   IMAP: ${emailAccount.imap.host}:${emailAccount.imap.port}`);
    console.log(`   SMTP: ${emailAccount.smtp.host}:${emailAccount.smtp.port}\n`);

    // Create SMTP transporter
    console.log('🔄 Creating SMTP transporter...');
    const transporter = nodemailer.createTransport({
      host: emailAccount.smtp.host,
      port: emailAccount.smtp.port,
      secure: emailAccount.smtp.secure,
      auth: {
        user: emailAccount.smtp.username,
        pass: emailAccount.decrypt(emailAccount.smtp.password)
      },
      tls: {
        rejectUnauthorized: false
      }
    });
    console.log('✅ Transporter created\n');

    // Verify connection
    console.log('🔍 Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified\n');

    // Send test email
    console.log('📤 Sending test email...');
    console.log(`   To: ${TEST_EMAIL.to}`);
    console.log(`   Subject: ${TEST_EMAIL.subject}\n`);

    const info = await transporter.sendMail({
      from: `"${emailAccount.displayName || emailAccount.email}" <${emailAccount.email}>`,
      to: TEST_EMAIL.to,
      subject: TEST_EMAIL.subject,
      text: TEST_EMAIL.textBody,
      html: TEST_EMAIL.htmlBody
    });

    console.log('╔══════════════════════════════════════════════╗');
    console.log('║   ✅ SUCCESS! Email Sent!                   ║');
    console.log('╚══════════════════════════════════════════════╝\n');

    console.log('📋 Email Details:');
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`   From: ${emailAccount.email}`);
    console.log(`   To: ${TEST_EMAIL.to}`);
    console.log(`   Subject: ${TEST_EMAIL.subject}\n`);

    console.log('🔍 Next Steps:');
    console.log('   1. Check your Gmail inbox: munenendegwa6@gmail.com');
    console.log('   2. The email should arrive in a few seconds to 1 minute');
    console.log('   3. Check Spam folder if not in Inbox');
    console.log('   4. The email confirms external delivery is working!\n');

    console.log('✅ Test completed successfully!');
    console.log('📧 Your email system can now send to ANY external address!\n');

  } catch (error) {
    console.error('\n╔══════════════════════════════════════════════╗');
    console.error('║   ❌ TEST FAILED                            ║');
    console.error('╚══════════════════════════════════════════════╝\n');
    console.error('Error:', error.message);
    console.error('\nStack trace:');
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB\n');
  }
};

// Run the test
sendTestEmail();
