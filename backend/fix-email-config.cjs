const mongoose = require('mongoose');
require('dotenv').config();

async function fixEmailConfig() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const admin = await mongoose.connection.db.collection('users')
      .findOne({ email: 'admin@ementech.co.ke' });

    if (!admin) {
      console.error('❌ Admin user not found!');
      process.exit(1);
    }

    console.log('👤 Admin User:', admin._id.toString());
    console.log('   Email:', admin.email);

    const result = await mongoose.connection.db.collection('useremails')
      .updateOne(
        { email: 'admin@ementech.co.ke' },
        {
          $set: {
            imapHost: 'mail.ementech.co.ke',
            imapPort: 993,
            smtpHost: 'mail.ementech.co.ke',
            smtpPort: 587,
            user: admin._id
          }
        }
      );

    console.log('\n✅ Updated email account:', result.modifiedCount, 'document');

    // Verify
    const emailAccount = await mongoose.connection.db.collection('useremails')
      .findOne({ email: 'admin@ementech.co.ke' });

    console.log('\n📧 Email Account Configuration:');
    console.log('   Email:', emailAccount.email);
    console.log('   User ID:', emailAccount.user.toString());
    console.log('   IMAP:', emailAccount.imapHost + ':' + emailAccount.imapPort);
    console.log('   SMTP:', emailAccount.smtpHost + ':' + emailAccount.smtpPort);

    console.log('\n✅ Email account configuration complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

fixEmailConfig();
