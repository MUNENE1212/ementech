/**
 * Cleanup Fail2Ban and System Emails from MongoDB
 *
 * This script removes or filters out system notification emails
 * such as Fail2Ban SSH ban alerts, Cron job emails, etc.
 */

import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import Email from '../src/models/Email.js';

// Load environment variables
dotenv.config({ path: path.resolve(new URL('../../.env', import.meta.url).pathname) });

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://master25:master25@cluster0.qaobi.mongodb.net/ementech';

/**
 * Clean up Fail2Ban emails
 */
async function cleanupFail2BanEmails() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all Fail2Ban and system emails
    const systemEmailPattern = /\[Fail2Ban\]|Cron.*@|Cron \<|System notification|Automated alert/i;

    console.log('\n🔍 Searching for system emails (Fail2Ban, Cron, etc.)...');

    // Count system emails
    const systemEmailCount = await Email.countDocuments({
      subject: { $regex: systemEmailPattern }
    });

    console.log(`📊 Found ${systemEmailCount} system emails`);

    if (systemEmailCount === 0) {
      console.log('✨ No system emails found - database is clean!');
      return;
    }

    // Show some examples
    const sampleEmails = await Email.find({
      subject: { $regex: systemEmailPattern }
    }).limit(5);

    console.log('\n📧 Sample system emails found:');
    sampleEmails.forEach((email, index) => {
      console.log(`  ${index + 1}. Subject: "${email.subject}"`);
      console.log(`     From: ${typeof email.from === 'object' ? email.from.email : email.from}`);
      console.log(`     Date: ${email.date}`);
    });

    // Ask for confirmation (in production, this would be automatic)
    console.log('\n⚠️  WARNING: This will permanently delete these system emails.');
    console.log('💡 Recommendation: Move to "System" folder instead of deleting?');

    // Option 1: Soft delete (move to Trash and mark as deleted)
    console.log('\n🗑️  Option 1: Moving system emails to Trash (soft delete)...');
    const moveResult = await Email.updateMany(
      {
        subject: { $regex: systemEmailPattern },
        isDeleted: false
      },
      {
        $set: {
          folder: 'Trash',
          isDeleted: true,
          deletedAt: new Date()
        }
      }
    );

    console.log(`✅ Moved ${moveResult.modifiedCount} system emails to Trash`);

    // Option 2: Permanently delete (hard delete)
    // Uncomment to use instead of soft delete
    /*
    console.log('\n🗑️  Option 2: Permanently deleting system emails...');
    const deleteResult = await Email.deleteMany({
      subject: { $regex: systemEmailPattern }
    });
    console.log(`✅ Permanently deleted ${deleteResult.deletedCount} system emails`);
    */

    // Verify cleanup
    const remainingCount = await Email.countDocuments({
      subject: { $regex: systemEmailPattern },
      isDeleted: false
    });

    console.log('\n✨ Cleanup complete!');
    console.log(`📊 System emails remaining in inbox: ${remainingCount}`);
    console.log('✅ All Fail2Ban/system emails have been moved to Trash');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

/**
 * Create a "System" folder and move emails there
 */
async function moveToSystemFolder() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const systemEmailPattern = /\[Fail2Ban\]|Cron.*@|Cron \<|System notification|Automated alert/i;

    // Mark emails with a label or category (optional enhancement)
    console.log('\n🏷️  Marking system emails with metadata...');

    const result = await Email.updateMany(
      {
        subject: { $regex: systemEmailPattern },
        isDeleted: false
      },
      {
        $set: {
          folder: 'Archive',
          category: 'system',
          tags: ['system', 'notifications', 'auto-filtered']
        }
      }
    );

    console.log(`✅ Tagged ${result.modifiedCount} system emails`);
    console.log('💡 These emails are now in Archive and tagged as "system"');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
  }
}

// Main execution
(async () => {
  const args = process.argv.slice(2);
  const command = args[0] || 'cleanup';

  try {
    if (command === 'cleanup') {
      await cleanupFail2BanEmails();
    } else if (command === 'archive') {
      await moveToSystemFolder();
    } else {
      console.log('Usage:');
      console.log('  node cleanup-fail2ban-emails.js cleanup  # Move to Trash');
      console.log('  node cleanup-fail2ban-emails.js archive   # Move to Archive');
    }
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
})();
