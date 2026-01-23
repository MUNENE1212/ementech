/**
 * Seed Script for Email Account
 * Creates a default email account for testing/production use
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';
import UserEmail from './src/models/UserEmail.js';
import Folder from './src/models/Folder.js';

dotenv.config();

// Email configuration from environment
const EMAIL_CONFIG = {
  email: process.env.IMAP_USER || 'admin@ementech.co.ke',
  displayName: 'EmenTech Admin',
  replyTo: null,

  imap: {
    host: process.env.IMAP_HOST || 'mail.ementech.co.ke',
    port: parseInt(process.env.IMAP_PORT) || 993,
    tls: true,
    username: process.env.IMAP_USER || 'admin@ementech.co.ke',
    password: process.env.IMAP_PASS || 'JpeQQEbwpzQDe8o5OPst'
  },

  smtp: {
    host: process.env.SMTP_HOST || 'mail.ementech.co.ke',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    username: process.env.SMTP_USER || 'admin@ementech.co.ke',
    password: process.env.SMTP_PASS || 'JpeQQEbwpzQDe8o5OPst'
  }
};

/**
 * Seed email account
 */
const seedEmailAccount = async () => {
  try {
    // Connect to MongoDB
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ementech');
    console.log('✅ Connected to MongoDB');

    // Check if admin user exists, if not create one
    let adminUser = await User.findOne({ email: 'admin@ementech.co.ke' });

    if (!adminUser) {
      console.log('📧 Creating admin user...');
      adminUser = await User.create({
        name: 'EmenTech Admin',
        email: 'admin@ementech.co.ke',
        password: 'Admin2026!', // Change this after first login!
        role: 'admin',
        isEmailVerified: true
      });
      console.log('✅ Admin user created');
    } else {
      console.log('✅ Admin user already exists');
    }

    // Check if email account already exists
    const existingAccount = await UserEmail.findOne({ email: EMAIL_CONFIG.email });

    if (existingAccount) {
      console.log('⚠️  Email account already exists');
      console.log('🔄 Updating email account configuration...');

      // Update the account with latest config (encrypting passwords)
      existingAccount.imap = EMAIL_CONFIG.imap;
      existingAccount.smtp = EMAIL_CONFIG.smtp;
      existingAccount.displayName = EMAIL_CONFIG.displayName;
      existingAccount.isPrimary = true;
      existingAccount.isActive = true;

      // Encrypt passwords
      existingAccount.setImapPassword(EMAIL_CONFIG.imap.password);
      existingAccount.setSmtpPassword(EMAIL_CONFIG.smtp.password);

      await existingAccount.save();

      console.log('✅ Email account updated');
    } else {
      console.log('📧 Creating email account...');

      // Create new email account
      const emailAccount = await UserEmail.create({
        user: adminUser._id,
        email: EMAIL_CONFIG.email,
        displayName: EMAIL_CONFIG.displayName,
        replyTo: EMAIL_CONFIG.replyTo,
        imap: {
          host: EMAIL_CONFIG.imap.host,
          port: EMAIL_CONFIG.imap.port,
          tls: EMAIL_CONFIG.imap.tls,
          username: EMAIL_CONFIG.imap.username,
          password: 'placeholder' // Will be encrypted below
        },
        smtp: {
          host: EMAIL_CONFIG.smtp.host,
          port: EMAIL_CONFIG.smtp.port,
          secure: EMAIL_CONFIG.smtp.secure,
          username: EMAIL_CONFIG.smtp.username,
          password: 'placeholder' // Will be encrypted below
        },
        isPrimary: true,
        isActive: true,
        autoSync: true,
        syncInterval: 5 // minutes
      });

      // Encrypt passwords using instance methods
      emailAccount.setImapPassword(EMAIL_CONFIG.imap.password);
      emailAccount.setSmtpPassword(EMAIL_CONFIG.smtp.password);
      await emailAccount.save();

      console.log('✅ Email account created');
      console.log(`   Email: ${emailAccount.email}`);
      console.log(`   IMAP: ${emailAccount.imap.host}:${emailAccount.imap.port}`);
      console.log(`   SMTP: ${emailAccount.smtp.host}:${emailAccount.smtp.port}`);
    }

    // Create default folders
    console.log('📁 Creating default folders...');

    const defaultFolders = [
      { name: 'INBOX', icon: 'inbox', color: '#1976d2' },
      { name: 'Sent', icon: 'send', color: '#388e3c' },
      { name: 'Drafts', icon: 'drafts', color: '#f57c00' },
      { name: 'Trash', icon: 'delete', color: '#d32f2f' },
      { name: 'Spam', icon: 'spam', color: '#7b1fa2' }
    ];

    for (const folderData of defaultFolders) {
      const existingFolder = await Folder.findOne({
        user: adminUser._id,
        name: folderData.name
      });

      if (!existingFolder) {
        await Folder.create({
          user: adminUser._id,
          ...folderData
        });
        console.log(`   ✅ Created ${folderData.name} folder`);
      } else {
        console.log(`   ℹ️  ${folderData.name} folder already exists`);
      }
    }

    console.log('\n✅ Seed completed successfully!');
    console.log('\n📋 Next Steps:');
    console.log('1. Change the admin user password after first login');
    console.log('2. Test the email system by syncing emails');
    console.log('3. Send a test email to verify SMTP is working');

  } catch (error) {
    console.error('❌ Error seeding email account:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
};

// Run the seed
seedEmailAccount();
