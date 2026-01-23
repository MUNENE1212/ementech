/**
 * Seed Script for Founder Accounts
 * Creates the 3 founder accounts with admin access
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './src/models/User.js';

dotenv.config();

// Founder accounts configuration
const FOUNDERS = [
  {
    name: 'Munene',
    email: 'munene@ementech.co.ke',
    password: 'EmenTech2026!Munene',
    role: 'admin',
    department: 'leadership',
    title: 'Founder & CEO'
  },
  {
    name: 'Co-founder',
    email: 'founder2@ementech.co.ke',
    password: 'EmenTech2026!Founder2',
    role: 'admin',
    department: 'leadership',
    title: 'Co-founder'
  },
  {
    name: 'CTO',
    email: 'cto@ementech.co.ke',
    password: 'EmenTech2026!CTO',
    role: 'admin',
    department: 'engineering',
    title: 'Chief Technology Officer'
  }
];

/**
 * Seed founder accounts
 */
const seedFounders = async () => {
  try {
    // Connect to MongoDB
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ementech');
    console.log('✅ Connected to MongoDB\n');

    const credentials = [];
    let createdCount = 0;
    let skippedCount = 0;

    // Process each founder
    for (const founder of FOUNDERS) {
      console.log(`📧 Processing ${founder.name} (${founder.email})...`);

      // Check if user already exists
      const existingUser = await User.findOne({ email: founder.email });

      if (existingUser) {
        console.log(`   ⚠️  User already exists - skipping creation`);
        console.log(`   ℹ️  Existing user: ${existingUser.name} (${existingUser.role})`);
        skippedCount++;

        // Still add to credentials file with existing password info
        credentials.push({
          ...founder,
          password: '(already exists, password unchanged)',
          status: 'existing'
        });
      } else {
        // Create new founder account
        const user = await User.create({
          name: founder.name,
          email: founder.email,
          password: founder.password,
          role: founder.role,
          department: founder.department,
          isActive: true
        });

        console.log(`   ✅ Created user account`);
        console.log(`   👤 Name: ${user.name}`);
        console.log(`   🔑 Role: ${user.role}`);
        console.log(`   🏢 Department: ${user.department}`);
        createdCount++;

        credentials.push({
          ...founder,
          status: 'created'
        });
      }

      console.log('');
    }

    // Summary
    console.log('═'.repeat(60));
    console.log('✅ SEED COMPLETED SUCCESSFULLY!');
    console.log('═'.repeat(60));
    console.log(`📊 Summary:`);
    console.log(`   ✅ Created: ${createdCount} accounts`);
    console.log(`   ℹ️  Skipped: ${skippedCount} accounts (already exist)`);
    console.log(`   📋 Total: ${FOUNDERS.length} founders`);
    console.log('\n');

    // Print credentials in a secure format
    console.log('═'.repeat(60));
    console.log('🔐 FOUNDER CREDENTIALS');
    console.log('═'.repeat(60));
    console.log('⚠️  SAVE THIS INFORMATION SECURELY!');
    console.log('⚠️  CHANGE PASSWORDS AFTER FIRST LOGIN!\n');

    credentials.forEach((cred, index) => {
      console.log(`📧 Founder ${index + 1}: ${cred.name}`);
      console.log(`   Email: ${cred.email}`);
      console.log(`   Password: ${cred.password}`);
      console.log(`   Role: ${cred.role}`);
      console.log(`   Department: ${cred.department}`);
      console.log(`   Title: ${cred.title}`);
      console.log(`   Status: ${cred.status}`);
      console.log('');
    });

    console.log('═'.repeat(60));
    console.log('\n📋 Next Steps:');
    console.log('1. Log in to each founder account at https://ementech.co.ke/login');
    console.log('2. Change passwords immediately after first login');
    console.log('3. Update profile information as needed');
    console.log('4. Create corresponding email accounts on the mail server');
    console.log('5. Test email functionality for each account');

  } catch (error) {
    console.error('❌ Error seeding founders:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
};

// Run the seed
seedFounders();
