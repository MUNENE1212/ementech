import dotenv from 'dotenv';
dotenv.config();

import connectDB from './src/config/database.js';
import User from './src/models/User.js';

async function createUsers() {
  try {
    await connectDB();
    console.log('✅ Connected to database');

    // Check if admin user exists
    let admin = await User.findOne({ email: 'admin@ementech.co.ke' });
    if (!admin) {
      admin = await User.create({
        name: 'Admin User',
        email: 'admin@ementech.co.ke',
        password: 'Admin2026!',
        phoneNumber: '+254700000001',
        role: 'admin',
        department: 'leadership',
        isActive: true
      });
      console.log('✅ Created admin user:', admin.name, '|', admin.email);
    } else {
      console.log('ℹ️  Admin user already exists:', admin.name, '|', admin.email);
    }

    // Check if bot user exists
    let bot = await User.findOne({ email: 'bot@ementech.co.ke' });
    if (!bot) {
      bot = await User.create({
        name: 'EmenTech AI Bot',
        email: 'bot@ementech.co.ke',
        password: 'bot_pass_' + Date.now(),
        phoneNumber: '+254700000002',
        role: 'admin',
        department: 'engineering',
        isActive: true
      });
      console.log('✅ Created bot user:', bot.name, '|', bot.email);
    } else {
      console.log('ℹ️  Bot user already exists:', bot.name, '|', bot.email);
    }

    // Count total users
    const count = await User.countDocuments();
    console.log('✅ Total users in database:', count);

    // List all users
    const allUsers = await User.find({}, { name: 1, email: 1, role: 1, isActive: 1 });
    console.log('\n📋 All users:');
    allUsers.forEach(u => {
      console.log('  -', u.name, '|', u.email, '|', u.role, '| Active:', u.isActive);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createUsers();
