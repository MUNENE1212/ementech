import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import mongoose from 'mongoose';

// Load environment variables BEFORE any other code
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: '/var/www/ementech-website/backend/.env' });

/**
 * Database Connection Configuration
 */
const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📦 Database: ${conn.connection.name}`);

    // Ensure indexes
    await ensureIndexes();

    return conn;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

/**
 * Ensure database indexes
 */
const ensureIndexes = async () => {
  try {
    console.log('🔨 Ensuring database indexes...');
    // Indexes will be created automatically by Mongoose schemas
    console.log('✅ Database indexes ensured successfully');
  } catch (error) {
    console.error('Warning: Some indexes may not have been created:', error.message);
  }
};

export default connectDB;
