import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import User from './src/models/User.js';
import UserEmail from './src/models/UserEmail.js';
import Email from './src/models/Email.js';

const checkDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Get admin user
    const admin = await User.findOne({ email: 'admin@ementech.co.ke' });
    if (admin) {
      console.log('=== ADMIN USER ===');
      console.log('ID:', admin._id);
      console.log('Email:', admin.email);
      console.log('Name:', admin.name);
      console.log('');
    }

    // Check email accounts
    console.log('=== EMAIL ACCOUNTS ===');
    const userEmailCount = await UserEmail.countDocuments();
    console.log('Total email accounts:', userEmailCount);

    if (userEmailCount > 0) {
      const userEmails = await UserEmail.find({})
        .select('email displayName isPrimary imap.host imap.username')
        .lean();

      userEmails.forEach((account, index) => {
        console.log(`\nAccount ${index + 1}:`);
        console.log('  Email:', account.email);
        console.log('  Display Name:', account.displayName || 'None');
        console.log('  Primary:', account.isPrimary);
        console.log('  IMAP Host:', account.imap.host);
        console.log('  IMAP Username:', account.imap.username);
      });
    } else {
      console.log('❌ NO EMAIL ACCOUNTS CONFIGURED');
    }
    console.log('');

    // Check emails
    console.log('=== EMAILS IN DATABASE ===');
    const emailCount = await Email.countDocuments();
    console.log('Total emails:', emailCount);

    if (emailCount > 0) {
      const emails = await Email.find({})
        .select('subject from.email folder date')
        .sort({ date: -1 })
        .limit(10)
        .lean();

      console.log('\nRecent emails:');
      emails.forEach((email, index) => {
        console.log(`\n${index + 1}. ${email.subject || '(No Subject)'}`);
        console.log('   From:', email.from.email);
        console.log('   Folder:', email.folder);
        console.log('   Date:', new Date(email.date).toLocaleString());
      });
    } else {
      console.log('❌ NO EMAILS IN DATABASE');
    }
    console.log('');

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

checkDatabase();
