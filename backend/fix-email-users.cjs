const mongoose = require('mongoose');
require('dotenv').config();

async function fixEmailUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const admin = await mongoose.connection.db.collection('users')
      .findOne({ email: 'admin@ementech.co.ke' });

    if (!admin) {
      console.error('❌ Admin user not found!');
      process.exit(1);
    }

    console.log('👤 Admin User ID:', admin._id.toString());

    // Check how many emails need updating
    const emailsWithoutUser = await mongoose.connection.db.collection('emails')
      .countDocuments({ userId: { $exists: false } });

    console.log('📧 Emails without userId:', emailsWithoutUser);

    if (emailsWithoutUser === 0) {
      console.log('✅ All emails already have userId. No update needed.');
      process.exit(0);
    }

    const result = await mongoose.connection.db.collection('emails')
      .updateMany(
        { userId: { $exists: false } },
        { $set: { userId: admin._id } }
      );

    console.log('\n✅ Updated emails:', result.modifiedCount, 'documents');

    // Verify
    const remaining = await mongoose.connection.db.collection('emails')
      .countDocuments({ userId: { $exists: false } });

    console.log('📧 Emails remaining without userId:', remaining);

    // Show sample of updated emails
    console.log('\n📋 Sample of updated emails:');
    const sampleEmails = await mongoose.connection.db.collection('emails')
      .find({ userId: admin._id })
      .limit(3)
      .toArray();

    sampleEmails.forEach(email => {
      console.log('   -', email.subject, '(', email.folder, ')');
    });

    console.log('\n✅ Email user associations complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

fixEmailUsers();
