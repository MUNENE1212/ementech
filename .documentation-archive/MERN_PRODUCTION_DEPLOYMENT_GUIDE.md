# MERN Stack Production Deployment Guide
## Complete VPS Deployment Best Practices for MongoDB, Express.js, React, Node.js

**Last Updated:** January 18, 2026

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Environment Configuration](#1-environment-configuration)
3. [Database Configuration](#2-database-configuration)
4. [Backend Production Setup](#3-backend-production-setup)
5. [Frontend Production Build](#4-frontend-production-build)
6. [WebSocket (Socket.io) Configuration](#6-websocket-socketio-configuration)
7. [File Upload & Media Storage](#7-file-upload--media-storage)
8. [Payment Integration](#8-payment-integration-mpesa--stripe)
9. [Monitoring & Logging](#9-monitoring--logging)
10. [Security Hardening](#10-security-hardening)
11. [Deployment Strategy](#11-deployment-strategy)
12. [Deployment Checklist](#12-deployment-checklist)
13. [Common Production Issues & Solutions](#13-common-production-issues--solutions)
14. [Performance Optimization](#14-performance-optimization)

---

## Executive Summary

This guide provides **production-ready best practices** for deploying a full-stack MERN application with real-time features (Socket.io), file uploads, JWT authentication, and payment integrations (Stripe & M-Pesa) on a VPS.

**Key Recommendations:**
- **MongoDB Atlas** for production (managed service with automated backups)
- **PM2 Cluster Mode** for zero-downtime deployments
- **nginx** as reverse proxy with rate limiting and SSL
- **Cloudinary** for file uploads and CDN
- **Sentry** or **Honeybadger** for error tracking
- **Strict environment variable validation** at startup
- **Blue-green deployment strategy** for zero downtime

---

## 1. Environment Configuration

### 1.1 Production .env File Setup

**Create separate environment files for each stage:**

```bash
# Directory structure
/project-root
  ├── .env.example           # Template for developers
  ├── .env.development       # Local development
  ├── .env.staging           # Staging environment
  ├── .env.production        # Production (NEVER commit)
  └── config/
      ├── env.validation.ts  # Environment validation
      └── env.ts            # Environment loading logic
```

**Production .env.example Template:**

```bash
# ===========================
# APPLICATION CONFIG
# ===========================
NODE_ENV=production
PORT=5000
APP_NAME=ementech-app
APP_URL=https://ementech.com
API_URL=https://api.ementech.com

# ===========================
# DATABASE CONFIG
# ===========================
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ementech?retryWrites=true&w=majority
DB_NAME=ementech_production

# Connection Pool Settings
DB_MAX_POOL_SIZE=10
DB_MIN_POOL_SIZE=2
DB_SOCKET_TIMEOUT_MS=45000
DB_CONNECT_TIMEOUT_MS=10000
DB_SERVER_SELECTION_TIMEOUT_MS=5000

# ===========================
# JWT AUTHENTICATION
# ===========================
JWT_ACCESS_SECRET=your_super_secure_random_min_256_bit_secret_key_here
JWT_REFRESH_SECRET=your_different_super_secure_random_secret_key_here
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
JWT_ALGORITHM=RS256  # Use RS256 for production

# ===========================
# CORS CONFIGURATION
# ===========================
ALLOWED_ORIGINS=https://ementech.com,https://www.ementech.com
ALLOWED_METHODS=GET,POST,PUT,DELETE,PATCH
ALLOWED_CREDENTIALS=true

# ===========================
# CLOUDINARY CONFIG
# ===========================
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_UPLOAD_PRESET=signed_uploads
CLOUDINARY_FOLDER=ementech/production

# ===========================
# STRIPE PAYMENT
# ===========================
STRIPE_SECRET_KEY=sk_live_your_secret_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_ENDPOINT_SECRET=whsec_your_endpoint_secret

# ===========================
# M-PESA PAYMENT
# ===========================
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_PASSKEY=your_passkey
MPESA_SHORTCODE=174379
MPESA_CALLBACK_URL=https://api.ementech.com/mpesa/callback
MPESA_ENVIRONMENT=production

# ===========================
# SOCKET.IO CONFIG
# ===========================
SOCKET_PORT=5001
SOCKET_PATH=/socket.io
SOCKET_CORS_ORIGINS=https://ementech.com

# ===========================
# EMAIL SERVICE (Optional)
# ===========================
EMAIL_SERVICE=sendgrid
EMAIL_API_KEY=SG.your_api_key
EMAIL_FROM=noreply@ementech.com

# ===========================
# RATE LIMITING
# ===========================
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_AUTH_WINDOW_MS=900000
RATE_LIMIT_AUTH_MAX=5

# ===========================
# LOGGING & MONITORING
# ===========================
LOG_LEVEL=info
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
NODE_OPTIONS=--max-old-space-size=2048

# ===========================
# REDIS (Optional - for sessions/cache)
# ===========================
REDIS_URL=redis://username:password@redis-server:6379
REDIS_PASSWORD=your_redis_password
```

### 1.2 Environment Variable Validation

**Install validation library:**
```bash
npm install dotenv zod
npm install --save-dev @types/node
```

**Create `config/env.validation.ts`:**

```typescript
import { z } from 'zod';

// Define validation schema
const envSchema = z.object({
  // Application
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('production'),
  PORT: z.string().transform(Number).default('5000'),
  APP_URL: z.url().optional(),
  API_URL: z.url().optional(),

  // Database
  MONGODB_URI: z.string().min(1),
  DB_NAME: z.string().min(1),
  DB_MAX_POOL_SIZE: z.string().transform(Number).default('10'),
  DB_MIN_POOL_SIZE: z.string().transform(Number).default('2'),

  // JWT
  JWT_ACCESS_SECRET: z.string().min(32), // At least 256 bits
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),

  // CORS
  ALLOWED_ORIGINS: z.string().transform(val => val.split(',')),

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),

  // Stripe
  STRIPE_SECRET_KEY: z.string().startsWith('sk_live_').or(z.string().startsWith('sk_test_')),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),

  // M-Pesa
  MPESA_CONSUMER_KEY: z.string().min(1),
  MPESA_CONSUMER_SECRET: z.string().min(1),
  MPESA_CALLBACK_URL: z.url(),

  // Sentry
  SENTRY_DSN: z.string().url().optional(),
});

// Validate and export
export function validateEnv() {
  try {
    const env = envSchema.parse({
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      APP_URL: process.env.APP_URL,
      API_URL: process.env.API_URL,
      MONGODB_URI: process.env.MONGODB_URI,
      DB_NAME: process.env.DB_NAME,
      DB_MAX_POOL_SIZE: process.env.DB_MAX_POOL_SIZE,
      DB_MIN_POOL_SIZE: process.env.DB_MIN_POOL_SIZE,
      JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
      JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
      JWT_ACCESS_EXPIRY: process.env.JWT_ACCESS_EXPIRY,
      JWT_REFRESH_EXPIRY: process.env.JWT_REFRESH_EXPIRY,
      ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
      CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
      CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
      CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
      MPESA_CONSUMER_KEY: process.env.MPESA_CONSUMER_KEY,
      MPESA_CONSUMER_SECRET: process.env.MPESA_CONSUMER_SECRET,
      MPESA_CALLBACK_URL: process.env.MPESA_CALLBACK_URL,
      SENTRY_DSN: process.env.SENTRY_DSN,
    });

    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('\n');
      console.error('❌ Invalid environment variables:\n', missingVars);
      throw new Error(`Environment validation failed:\n${missingVars}`);
    }
    throw error;
  }
}

// Export validated config
export const env = validateEnv();
```

**Usage in `app.ts` or `server.ts`:**

```typescript
import dotenv from 'dotenv';
import { env } from './config/env.validation';

// Load environment variables BEFORE importing other modules
dotenv.config({ path: `.env.${process.env.NODE_ENV || 'production'}` });

// Now you can use validated environment variables
const PORT = env.PORT;
const MONGODB_URI = env.MONGODB_URI;

console.log(`✅ Environment validated for: ${env.NODE_ENV}`);
```

### 1.3 Security Best Practices for Secrets Management

**Best Practices:**

1. **Never commit .env files** - Add to `.gitignore`:
```gitignore
# Environment files
.env
.env.local
.env.*.local
.env.production
.env.staging

# Keep example files
!.env.example
```

2. **Use strong, randomly generated secrets:**
```bash
# Generate 256-bit secrets (64 hex characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or use OpenSSL
openssl rand -hex 32
```

3. **Set proper file permissions:**
```bash
chmod 600 .env.production  # Owner read/write only
chmod 400 .env.production  # Owner read only (after load)
```

4. **Use environment-specific secrets:**
   - Development and Production must use different secrets
   - Rotate secrets periodically (every 90 days)

5. **Server environment variables (preferred for production):**
```bash
# Instead of .env file, set directly on server
export JWT_ACCESS_SECRET="your_secret_here"
export MONGODB_URI="mongodb://..."

# Or use systemd service file (see PM2 section below)
```

6. **Use secrets management services for enterprise:**
   - AWS Secrets Manager
   - Azure Key Vault
   - HashiCorp Vault

---

## 2. Database Configuration

### 2.1 MongoDB: Atlas vs Self-Hosted

**Recommendation: Use MongoDB Atlas for Production**

| Feature | MongoDB Atlas | Self-Hosted |
|---------|---------------|-------------|
| **Setup Time** | 5 minutes | 2-4 hours |
| **Backups** | Automated (continuous & snapshots) | Manual setup required |
| **High Availability** | Built-in replica sets | Manual configuration |
| **Security** | Automated patching | Manual maintenance |
| **Scaling** | Auto-scaling | Manual sharding/vertical scaling |
| **Monitoring** | Built-in metrics & alerts | Third-party tools required |
| **Cost** | Free tier (512MB) / Paid from $9/mo | VPS cost only (but hidden ops cost) |
| **Performance** | Optimized cloud infrastructure | Depends on VPS specs |

**Sources:**
- [MongoDB Atlas vs Self-Hosted: Complete Comparison](https://thedbadmin.com/blog/mongodb-atlas-vs-self-hosted-comparison) - Updated Jan 2025
- [5 Cheap Ways to Host MongoDB in 2025](https://sliplane.io/blog/5-cheap-ways-to-host-mongodb)

**When to Self-Host:**
- Cost-sensitive projects with predictable, low traffic
- Strict data residency requirements
- Need for custom MongoDB configuration
- Existing MongoDB expertise in team

### 2.2 MongoDB Atlas Production Setup

**1. Create Atlas Cluster:**
- Choose cluster tier (M10+ for production, includes backups)
- Select region closest to your users
- Enable cluster tier auto-scaling (optional)
- Set up VPC peering if using same cloud provider

**2. Configure Network Access:**
- Whitelist your VPS IP address (not 0.0.0.0/0)
- Use IP whitelist or VPC peering
- Enable private endpoints for enhanced security

**3. Database Access:**
- Create database user with **readWrite** role (not admin)
- Use SCRAM-SHA-256 authentication
- Enforce strong password policy
- Certificate-based authentication for enterprise

**4. Enable Backups:**
- Continuous backups (point-in-time recovery)
- Daily snapshots (retention policy: 7-90 days)
- Cross-region backup replication (disaster recovery)

**5. Set Up Alerts:**
- High CPU/Memory usage
- Storage capacity warnings
- Connection pool exhaustion
- Replication lag

### 2.3 Connection Pooling Configuration

**MongoDB connection options for production:**

```typescript
import { MongoClient } from 'mongodb';

const options = {
  // Connection pool settings
  maxPoolSize: 10,           // Maximum connections in pool
  minPoolSize: 2,            // Minimum connections to maintain
  maxIdleTimeMS: 60000,      // Close idle connections after 60s

  // Timeout settings
  connectTimeoutMS: 10000,   // 10 seconds
  socketTimeoutMS: 45000,    // 45 seconds (for long queries)
  serverSelectionTimeoutMS: 5000,

  // Retry logic
  retryWrites: true,         // Retry failed writes
  retryReads: true,

  // Performance
  compressors: 'zlib',       // Enable compression

  // SSL (required for Atlas)
  tls: true,
  tlsAllowInvalidCertificates: false,
};

// Connection string example
const uri = 'mongodb+srv://user:pass@cluster.mongodb.net/ementech?retryWrites=true&w=majority';
```

**Mongoose configuration:**

```typescript
import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const opts = {
      maxPoolSize: 10,
      minPoolSize: 2,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 5000,
      retryWrites: true,
      retryReads: true,
    };

    await mongoose.connect(process.env.MONGODB_URI!, opts);

    console.log('✅ MongoDB Connected Successfully');
    console.log(`📊 Database: ${mongoose.connection.name}`);
    console.log(`🔌 Pool Size: ${mongoose.connection.client.options.maxPoolSize}`);

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });

  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

export default connectDB;
```

### 2.4 Index Creation and Management

**Best Practices:**

1. **Create indexes for frequently queried fields:**
```typescript
// User model
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ username: 1 }, { unique: true });
userSchema.index({ createdAt: -1 });

// Product model
productSchema.index({ name: 'text', description: 'text' }); // Text search
productSchema.index({ category: 1, price: 1 }); // Compound index
productSchema.index({ createdAt: -1 });
```

2. **Use MongoDB Atlas Index Recommendations:**
- Atlas analyzes slow queries automatically
- Suggests indexes in Performance Advisor
- Deploy with one click

3. **Create indexes in code before server starts:**
```typescript
import mongoose from 'mongoose';

const ensureIndexes = async () => {
  try {
    await User.ensureIndexes();
    await Product.ensureIndexes();
    await Order.ensureIndexes();

    console.log('✅ Database indexes ensured');
  } catch (error) {
    console.error('❌ Error creating indexes:', error);
  }
};

// Call in app initialization
await ensureIndexes();
```

4. **Monitor index usage:**
```javascript
// Check if indexes are being used
db.users.aggregate([
  { $indexStats: {} }
])

// Find missing indexes (Atlas does this automatically)
```

### 2.5 Backup Strategies

**MongoDB Atlas Backups:**

1. **Continuous Backups:**
- Point-in-time recovery (PITR)
- Restore to any second within retention window
- Included in M10+ tiers

2. **Snapshot Backups:**
- Daily snapshots
- Retention policy: 7-90 days
- Manual snapshots before major changes

3. **Manual Backup with mongodump (for self-hosted or local backup):**
```bash
# Backup entire database
mongodump --uri="mongodb+srv://user:pass@cluster/db" --out=/backups/$(date +%Y%m%d)

# Backup specific collection
mongodump --uri="mongodb+srv://user:pass@cluster/db" --collection=users --out=/backups

# Compress backup
tar -czf backup-$(date +%Y%m%d).tar.gz /backups/
```

4. **Automated Backup Script:**
```bash
#!/bin/bash
# backup-mongo.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/mongodb"
RETENTION_DAYS=7

# Create backup
mongodump --uri="$MONGODB_URI" --out="$BACKUP_DIR/$DATE"

# Compress
tar -czf "$BACKUP_DIR/backup_$DATE.tar.gz" "$BACKUP_DIR/$DATE"
rm -rf "$BACKUP_DIR/$DATE"

# Delete old backups
find "$BACKUP_DIR" -name "backup_*.tar.gz" -mtime +$RETENTION_DAYS -delete

echo "✅ Backup completed: backup_$DATE.tar.gz"
```

5. **Test Backup Restoration Regularly:**
```bash
# Test restore to staging database
mongorestore --uri="mongodb://staging-db" --drop /backups/backup_file/
```

**Sources:**
- [MongoDB Performance Best Practices: Indexing](https://www.mongodb.com/company/blog/performance-best-practices-indexing)
- [MongoDB Optimization 2025: 9 Tips](https://simplelogic-it.com/mongodb-optimization-2025/)

---

## 3. Backend Production Setup

### 3.1 PM2 Configuration

**Install PM2 globally:**
```bash
npm install -g pm2
```

**Create `ecosystem.config.js`:**

```javascript
module.exports = {
  apps: [
    {
      name: 'ementech-api',
      script: './dist/server.js',  // Built TypeScript file
      instances: 'max',             // Use all CPU cores (cluster mode)
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,                 // Don't watch in production
      max_memory_restart: '1G',     // Restart if exceeds 1GB
      env: {
        NODE_ENV: 'development',
        PORT: 5000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
    },
    {
      name: 'ementech-socket',
      script: './dist/socket.js',
      instances: 2,                 // Fewer instances for Socket.io
      exec_mode: 'cluster',
      env_production: {
        NODE_ENV: 'production',
        PORT: 5001,
      },
    },
  ],
  deploy: {
    production: {
      user: 'node',
      host: 'your-vps-ip',
      ref: 'origin/main',
      repo: 'git@github.com:your-username/ementech-backend.git',
      path: '/var/www/ementech-backend',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
    },
  },
};
```

**Advanced PM2 with God Daemon:**

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'ementech-api',
      script: './dist/server.js',
      instances: 4,  // Or 'max' for all CPUs
      exec_mode: 'cluster',

      // Advanced options
      node_args: '--max-old-space-size=2048',  // Increase memory

      // Health check
      health_check_grace_period: 5000,

      // Environment variables
      env_file: '.env.production',

      // Logging
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
    }
  ],

  // Logging configuration
  logging: {
    appenders: {
      file: {
        type: 'file',
        filename: './logs/combined.log',
        maxLogSize: 10485760,  // 10MB
        backups: 5,
        compress: true,
      },
    },
  },
};
```

**PM2 Commands:**

```bash
# Start application
pm2 start ecosystem.config.js --env production

# Save process list (auto-start on server reboot)
pm2 save

# Generate startup script
pm2 startup
# Follow the instructions (copy-paste the output)

# Common commands
pm2 list                           # List all processes
pm2 logs ementech-api              # View logs
pm2 logs ementech-api --lines 100  # Last 100 lines
pm2 monit                          # Real-time monitoring dashboard
pm2 restart ementech-api           # Restart specific app
pm2 restart all                    # Restart all apps
pm2 reload ementech-api            # Zero-downtime reload (cluster mode)
pm2 stop ementech-api              # Stop app
pm2 delete ementech-api            # Remove from PM2

# Cluster management
pm2 scale ementech-api 4           # Scale to 4 instances

# Monitoring
pm2 show ementech-api              # Detailed info
pm2 info ementech-api              # Process info

# Flush logs
pm2 flush                          # Clear all logs

# Reset restart count
pm2 reset ementech-api
```

**Sources:**
- [PM2 Cluster Mode Documentation](https://pm2.keymetrics.io/docs/usage/cluster-mode/)
- [PM2 Ecosystem File Reference](https://pm2.io/docs/runtime/reference/ecosystem-file/)
- [Node.js Clustering using PM2](https://blogs.halodoc.io/nodejs-clustering-using-pm2/)

### 3.2 Cluster Mode for Multi-Core Utilization

**Understanding Cluster Mode:**

```typescript
// PM2 handles this automatically with exec_mode: 'cluster'
// But you can also manually implement:

import cluster from 'cluster';
import os from 'os';

if (cluster.isPrimary) {
  const numCPUs = os.cpus().length;

  console.log(`Master ${process.pid} is running`);
  console.log(`Forking ${numCPUs} workers...`);

  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died. Restarting...`);
    cluster.fork();
  });
} else {
  // Workers can share any TCP connection
  // Express app runs here
  console.log(`Worker ${process.pid} started`);

  // Start your server
  require('./server');
}
```

**Benefits of Cluster Mode:**
- Utilizes all CPU cores
- Improved performance (2-4x faster for CPU-intensive tasks)
- Zero-downtime reloads (restart workers one by one)
- Automatic restart on crash

**Important Considerations:**
- **Stateless applications only** - Don't use if storing local state
- Socket.io requires sticky sessions (see Section 6)
- Increase connection pool size: `maxPoolSize = instances × 10`

### 3.3 Graceful Shutdown Handling

**Implement graceful shutdown in Express:**

```typescript
import http from 'http';
import mongoose from 'mongoose';

const server = http.createServer(app);

let isShuttingDown = false;

// Graceful shutdown handler
const gracefulShutdown = async (signal: string) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`\n⚠️  ${signal} received. Starting graceful shutdown...`);

  // Stop accepting new connections
  server.close(() => {
    console.log('✅ HTTP server closed');
  });

  // Close database connections
  try {
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
  } catch (err) {
    console.error('❌ Error closing MongoDB:', err);
  }

  // Close other connections (Redis, Socket.io, etc.)
  // await redisClient.quit();
  // await io.close();

  console.log('✅ Graceful shutdown completed');
  process.exit(0);
};

// Force shutdown after 10 seconds
setTimeout(() => {
  console.error('⏰ Forced shutdown after timeout');
  process.exit(1);
}, 10000);

// Listen for shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Process ID: ${process.pid}`);
  console.log(`🧵 Cluster mode: ${process.env.NODE_ENV === 'production'}`);
});
```

**PM2 Graceful Shutdown Configuration:**

```javascript
// In ecosystem.config.js
{
  name: 'ementech-api',
  kill_timeout: 5000,      // Wait 5s before force kill
  wait_ready: true,        // Wait for app.ready()
  listen_timeout: 10000,   // Wait for server to listen
}

// In your app, signal PM2 that app is ready
process.send('ready');
```

### 3.4 Log Management and Monitoring

**Winston Logger Configuration:**

```typescript
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    // Console logging
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),

    // Error log file (rotating)
    new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: '14d',  // Keep for 14 days
    }),

    // Combined log file (rotating)
    new DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
    }),
  ],

  // Handle exceptions and rejections
  exceptionHandlers: [
    new DailyRotateFile({
      filename: 'logs/exceptions-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
    }),
  ],
  rejectionHandlers: [
    new DailyRotateFile({
      filename: 'logs/rejections-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
    }),
  ],
});

export default logger;
```

**PM2 Log Management:**

```bash
# Install PM2 log rotation module
pm2 install pm2-logrotate

# Configure log rotation
pm2 set pm2-logrotate:max_size 10M      # Rotate when file > 10MB
pm2 set pm2-logrotate:retain 7          # Keep for 7 days
pm2 set pm2-logrotate:compress true     # Compress rotated logs

# View logs
pm2 logs --json  | grep 'error'  # Filter errors
pm2 logs --raw                 # Disable log coloring
```

### 3.5 API Rate Limiting in Production

**Express Rate Limit Configuration:**

```typescript
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';

// General API rate limiter
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,                   // 100 requests per window
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,      // Return rate limit info in headers
  legacyHeaders: false,

  // Redis store for production (shared across cluster instances)
  store: process.env.NODE_ENV === 'production'
    ? new RedisStore({
        client: new Redis(process.env.REDIS_URL),
        prefix: 'rate_limit:',
      })
    : undefined,  // Memory store for development

  // Skip rate limiting for certain routes
  skip: (req) => {
    return req.path.startsWith('/health') || req.path.startsWith('/public');
  },

  // Custom key generator (per user or per IP)
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  },
});

// Stricter rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 5,                     // 5 attempts
  skipSuccessfulRequests: true,  // Don't count successful logins
  message: 'Too many login attempts, please try again later.',
});

// Apply to routes
app.use('/api/', generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
```

### 3.6 CORS Configuration for Production

**Production CORS Setup:**

```typescript
import cors from 'cors';

// Parse allowed origins from env
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  'https://ementech.com',
  'https://www.ementech.com',
];

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },

  credentials: true,        // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],

  // Cache preflight response for 1 hour
  maxAge: 60 * 60,

  // Expose custom headers to browser
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
};

app.use(cors(corsOptions));

// Handle CORS errors
app.use((err: any, req: any, res: any, next: any) => {
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'CORS not allowed' });
  }
  next();
});
```

**Sources:**
- [Express.js Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Snyk: Security Implications of CORS](https://snyk.io/blog/security-implications-cors-node-js/)

---

## 4. Frontend Production Build

### 4.1 Vite Build Optimization

**Update `vite.config.ts` for production:**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import viteCompression from 'vite-plugin-compression';

export default defineConfig({
  plugins: [
    react(),

    // Gzip compression
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 10240,  // Only compress files > 10KB
    }),

    // Brotli compression (better than gzip)
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 10240,
    }),

    // Bundle analyzer
    visualizer({
      open: false,
      gzipSize: true,
      brotliSize: true,
      filename: 'dist/stats.html',
    }),
  ],

  build: {
    outDir: 'dist',
    sourcemap: false,  // Don't expose source maps in production

    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,    // Remove console.log in production
        drop_debugger: true,
        pure_funcs: ['console.log'],
      },
    },

    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor code
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'animation': ['framer-motion'],
          'icons': ['lucide-react', 'react-icons'],
          'email': ['@emailjs/browser'],
        },

        // Hash file names for cache busting
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },

    chunkSizeWarningLimit: 1000,  // 1MB warning limit

    // Target modern browsers
    target: 'es2015',
  },

  // Optimize dependency pre-bundling
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
});
```

**Install required plugins:**

```bash
npm install --save-dev vite-plugin-compression rollup-plugin-visualizer vite-plugin-pwa
```

### 4.2 Environment Variable Handling in Vite

**Create `.env.production`:**

```bash
# Vite requires VITE_ prefix for client-side variables
VITE_API_URL=https://api.ementech.com
VITE_APP_URL=https://ementech.com
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_key
VITE_ENABLE_ANALYTICS=true
```

**Usage in React components:**

```typescript
// Access in code
const API_URL = import.meta.env.VITE_API_URL;

// TypeScript support
interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_APP_URL: string;
  readonly VITE_STRIPE_PUBLISHABLE_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Example API call
const fetchData = async () => {
  const response = await fetch(`${import.meta.env.VITE_API_URL}/users`);
  return response.json();
};
```

**Environment validation:**

```typescript
// src/config/env.ts
const requiredEnvVars = [
  'VITE_API_URL',
  'VITE_APP_URL',
  'VITE_STRIPE_PUBLISHABLE_KEY',
] as const;

type EnvVar = typeof requiredEnvVars[number];

const validateEnv = () => {
  const missing: EnvVar[] = [];

  requiredEnvVars.forEach((varName) => {
    if (!import.meta.env[varName]) {
      missing.push(varName);
    }
  });

  if (missing.length > 0) {
    throw new Error(`Missing required env vars: ${missing.join(', ')}`);
  }
};

validateEnv();

export const config = {
  apiUrl: import.meta.env.VITE_API_URL!,
  appUrl: import.meta.env.VITE_APP_URL!,
  stripeKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY!,
};
```

### 4.3 API URL Configuration for Production

**Axios instance with base URL:**

```typescript
// src/utils/api.ts
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### 4.4 Static Asset Optimization

**Image Optimization:**

```typescript
// Use vite-imagetools plugin
npm install --save-dev vite-imagetools

// vite.config.ts
import { imagetools } from 'vite-imagetools';

export default defineConfig({
  plugins: [
    imagetools({
      forceAVIF: true,
      includeThreshold: 10240,  // Only optimize > 10KB
    }),
  ],
});
```

**Font Optimization:**

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          const name = assetInfo.name || '';
          if (/\.(woff|woff2|ttf|otf)$/.test(name)) {
            return 'assets/fonts/[name]-[hash][extname]';
          }
          return 'assets/[ext]/[name]-[hash][extname]';
        },
      },
    },
  },
});
```

### 4.5 PWA Service Worker Configuration

**Install PWA plugin:**

```bash
npm install --save-dev vite-plugin-pwa workbox-precaching
```

**Configure PWA in `vite.config.ts`:**

```typescript
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',  // Auto-update service worker

      includeAssets: [
        'favicon.ico',
        'robots.txt',
        'icons/*.png',
        'fonts/*.woff2',
      ],

      manifest: {
        name: 'Ementech Solutions',
        short_name: 'Ementech',
        description: 'Your trusted tech solutions partner',
        theme_color: '#0f172a',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },

      workbox: {
        globPatterns: [
          '**/*.{js,css,html,ico,png,svg,woff2}',
        ],

        // Runtime caching for API calls
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.ementech\.com\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24,  // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30,  // 30 days
              },
            },
          },
        ],

        // Precache critical assets
        navigateFallback: '/index.html',
      },

      devOptions: {
        enabled: false,  // Disable PWA in development
      },
    }),
  ],
});
```

**Register service worker in `src/main.tsx`:**

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Register service worker
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('✅ Service Worker registered:', registration);

        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New content available
                if (confirm('New version available. Reload now?')) {
                  window.location.reload();
                }
              }
            });
          }
        });
      })
      .catch((error) => {
        console.error('❌ Service Worker registration failed:', error);
      });
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

---

## 6. WebSocket (Socket.io) Configuration

### 6.1 Production WebSocket Setup Through nginx

**Socket.io Server Configuration:**

```typescript
// socket.ts
import { Server } from 'socket.io';
import { createServer } from 'http';
import cors from 'cors';

const httpServer = createServer();
const PORT = process.env.SOCKET_PORT || 5001;

const io = new Server(httpServer, {
  cors: {
    origin: process.env.SOCKET_CORS_ORIGINS?.split(',') || [
      'https://ementech.com',
    ],
    methods: ['GET', 'POST'],
    credentials: true,
  },

  // Production optimizations
  pingTimeout: 60000,      // 60 seconds
  pingInterval: 25000,     // 25 seconds

  // Transport configuration
  transports: ['websocket', 'polling'],

  // Reduce memory usage
  maxHttpBufferSize: 1e6,  // 1MB

  // Rate limiting
  firewall: true,
});

// Authentication middleware
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error('Authentication error'));
  }

  try {
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET!);
    socket.data.user = decoded;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

// Connection handler
io.on('connection', (socket) => {
  const userId = socket.data.user.id;

  console.log(`✅ User connected: ${userId}`);

  // Join user-specific room
  socket.join(`user:${userId}`);

  socket.on('disconnect', () => {
    console.log(`❌ User disconnected: ${userId}`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`🔌 Socket.io server running on port ${PORT}`);
});

export { io };
```

### 6.2 Sticky Session Requirements

**Why Sticky Sessions are Required:**

Socket.io with multiple workers (PM2 cluster mode) requires sticky sessions to ensure all requests from the same client go to the same worker.

**nginx Configuration for Sticky Sessions:**

```nginx
# /etc/nginx/sites-available/ementech

upstream socket_io_backend {
    ip_hash;  # Enable sticky sessions based on IP

    server 127.0.0.1:5001;  # Socket.io server
    server 127.0.0.1:5002;  # Additional instance if scaled
}

server {
    listen 443 ssl http2;
    server_name socket.ementech.com;

    ssl_certificate /etc/letsencrypt/live/ementech.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ementech.com/privkey.pem;

    location / {
        include proxy_params;
        proxy_pass http://socket_io_backend;

        # WebSocket-specific headers
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Timeouts for WebSocket connections
        proxy_connect_timeout 7d;
        proxy_send_timeout 7d;
        proxy_read_timeout 7d;
    }
}
```

**Alternative: Using nginx with least_conn and cookie-based stickiness:**

```nginx
upstream socket_io_backend {
    least_conn;

    server 127.0.0.1:5001;
    server 127.0.0.1:5002;

    # Sticky session via cookie
    sticky cookie srv_id expires=1h domain=.ementech.com path=/;
}
```

### 6.3 Scaling Considerations

**For Socket.io Scaling:**

1. **Redis Adapter for Multi-Server:**
```typescript
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

const pubClient = createClient({ url: process.env.REDIS_URL });
const subClient = pubClient.duplicate();

await Promise.all([
  pubClient.connect(),
  subClient.connect(),
]);

io.adapter(createAdapter(pubClient, subClient));
```

2. **Load Balancing:**
- Use nginx with sticky sessions
- Or use Application Load Balancer with session affinity

3. **Number of Instances:**
- Start with 2-3 instances
- Monitor CPU/memory usage
- Scale based on concurrent connections (typical: 1000-5000 connections per instance)

### 6.4 Fallback Mechanisms

**Implement transport fallback:**

```typescript
const io = new Server(httpServer, {
  transports: ['websocket', 'polling'],  // Try websocket first, fallback to polling

  // Auto-reconnect configuration
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
});
```

**Client-side reconnection:**

```typescript
// client.ts
import { io } from 'socket.io-client';

const socket = io('https://socket.ementech.com', {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 10,
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error);

  // Fallback to polling if websocket fails
  if (socket.io.opts.transports[0] !== 'polling') {
    console.log('⚠️  WebSocket failed, falling back to polling');
    socket.io.opts.transports = ['polling', 'websocket'];
  }
});
```

---

## 7. File Upload & Media Storage

### 7.1 Production Cloudinary Configuration

**Cloudinary Setup:**

```typescript
// src/config/cloudinary.ts
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,  // Use HTTPS
});

export default cloudinary;
```

**Upload Handler with Security:**

```typescript
// src/services/upload.ts
import cloudinary from '../config/cloudinary';
import { UploadApiOptions } from 'cloudinary';

interface UploadResult {
  url: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

export const uploadImage = async (
  file: string | Buffer,
  options?: Partial<UploadApiOptions>
): Promise<UploadResult> => {
  const uploadOptions: UploadApiOptions = {
    folder: process.env.CLOUDINARY_FOLDER || 'ementech/production',
    resource_type: 'image',

    // Transformations
    transformation: [
      { quality: 'auto', fetch_format: 'auto' },  // Optimize quality
      { width: 2000, height: 2000, crop: 'limit' },  // Max dimensions
    ],

    // Security
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    max_file_size: 5 * 1024 * 1024,  // 5MB

    // overwrite: true,
    // invalidate: true,  // Clear CDN cache

    ...options,
  };

  try {
    const result = await cloudinary.uploader.upload(file, uploadOptions);

    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload image');
  }
};

export const deleteImage = async (publicId: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId);
    console.log(`✅ Deleted image: ${publicId}`);
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw new Error('Failed to delete image');
  }
};

// Batch delete
export const deleteImages = async (publicIds: string[]): Promise<void> => {
  try {
    await cloudinary.api.delete_resources(publicIds);
    console.log(`✅ Deleted ${publicIds.length} images`);
  } catch (error) {
    console.error('Cloudinary batch delete error:', error);
    throw new Error('Failed to delete images');
  }
};
```

**Express Route for Upload:**

```typescript
import multer from 'multer';
import { uploadImage, deleteImage } from '../services/upload';

// Memory storage (buffer) for Cloudinary upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,  // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF allowed.'));
    }
  },
});

// Single upload
router.post('/upload', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const result = await uploadImage(req.file.buffer, {
      public_id: `${req.user.id}_${Date.now()}`,  // Unique ID
    });

    res.json({
      url: result.url,
      publicId: result.publicId,
      width: result.width,
      height: result.height,
    });
  } catch (error) {
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Multiple upload
router.post('/upload/multiple', authMiddleware, upload.array('images', 5), async (req, res) => {
  try {
    if (!req.files || !Array.isArray(req.files)) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const uploads = await Promise.all(
      (req.files as Express.Multer.File[]).map(file =>
        uploadImage(file.buffer, {
          public_id: `${req.user.id}_${Date.now()}_${Math.random()}`,
        })
      )
    );

    res.json(uploads);
  } catch (error) {
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Delete image
router.delete('/image/:publicId', authMiddleware, async (req, res) => {
  try {
    const { publicId } = req.params;

    // Verify ownership
    const image = await Image.findOne({ publicId, uploadedBy: req.user.id });
    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    await deleteImage(publicId);
    await Image.deleteOne({ publicId });

    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Delete failed' });
  }
});
```

### 7.2 Upload Limits and Security

**File Size Limits:**

```typescript
// In upload route
const upload = multer({
  limits: {
    fileSize: 5 * 1024 * 1024,  // 5MB per file
    files: 5,                    // Max 5 files
  },
});

// Or in Cloudinary
max_file_size: 5242880,  // 5MB in bytes
```

**File Type Validation:**

```typescript
// File filter in multer
fileFilter: (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

  // Check MIME type
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error('Invalid file type'));
  }

  // Check file extension
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
  const fileExtension = file.originalname.toLowerCase().match(/\.[^.]+$/)?.[0];

  if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
    return cb(new Error('Invalid file extension'));
  }

  cb(null, true);
},
```

**Malware Scanning (optional - enterprise):**

```typescript
// Use Cloudinary's auto-moderation
uploadImage(file, {
  moderation: 'aws_rek',  // Use Amazon Rekognition
  // or
  moderation: 'google_video_intelligence',
});
```

### 7.3 CDN Setup for Static Assets

**Cloudinary Built-in CDN:**
- Automatic with Cloudinary URLs
- Global edge locations
- Image optimization on-the-fly

**URL Transformations:**

```typescript
// Responsive images
const imageUrl = cloudinary.url('public_id', {
  transformation: [
    { width: 'auto', dpr: 'auto', crop: 'scale', fetch_format: 'auto' },
  ],
});

// Crop and resize
const thumbnailUrl = cloudinary.url('public_id', {
  width: 300,
  height: 300,
  crop: 'thumb',
  gravity: 'face',
});

// Format conversion
const webpUrl = cloudinary.url('public_id', {
  fetch_format: 'webp',
  quality: 'auto',
});
```

**Using nginx for Static Assets:**

```nginx
# Cache static assets served by nginx
location ~* \.(jpg|jpeg|png|gif|webp|svg|ico|css|js|woff|woff2)$ {
  expires 1y;
  add_header Cache-Control "public, immutable";
  access_log off;
}

# Enable gzip compression
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;
gzip_min_length 1000;
```

### 7.4 Alternative: Local File Management with nginx

**If not using Cloudinary:**

```typescript
import fs from 'fs/promises';
import path from 'path';

const UPLOAD_DIR = path.join(__dirname, '../../uploads');

// Ensure upload directory exists
await fs.mkdir(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}_${Math.random().toString(36).substring(7)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });
```

**nginx Configuration for Local Files:**

```nginx
server {
    location /uploads {
        alias /var/www/ementech-backend/uploads;

        # Security
        disable_symlinks if_not_owner;

        # Caching
        expires 30d;
        add_header Cache-Control "public";

        # Gzip
        gzip_static on;
    }
}
```

**Sources:**
- [Cloudinary Upload Presets Documentation](https://cloudinary.com/documentation/upload_presets)
- [Cloudinary Secure Media Uploads for React](https://medium.com/@sameertrivedi1234/a-beginners-guide-to-media-uploads-for-react-apps-signed-uploads-with-react-cloudinary-4af4625225fe)

---

## 8. Payment Integration (M-Pesa & Stripe)

### 8.1 Production M-Pesa Configuration

**M-Pesa Service:**

```typescript
// src/services/mpesa.ts
import axios from 'axios';
import crypto from 'crypto';

const MPESA_BASE_URL = process.env.MPESA_ENVIRONMENT === 'production'
  ? 'https://api.safaricom.co.ke'
  : 'https://sandbox.safaricom.co.ke';

const MPESA_SHORTCODE = process.env.MPESA_SHORTCODE!;
const MPESA_CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY!;
const MPESA_CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET!;
const MPESA_PASSKEY = process.env.MPESA_PASSKEY!;
const MPESA_CALLBACK_URL = process.env.MPESA_CALLBACK_URL!;

// Generate OAuth token
const generateToken = async (): Promise<string> => {
  const auth = Buffer.from(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`).toString('base64');

  const response = await axios.get(
    `${MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
    {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    }
  );

  return response.data.access_token;
};

// Generate password for STK Push
const generatePassword = (timestamp: string): string => {
  const passwordStr = `${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`;
  return Buffer.from(passwordStr).toString('base64');
};

// STK Push (Lipa Na M-Pesa Online)
export const initiateSTKPush = async (phoneNumber: string, amount: number, orderId: string) => {
  try {
    const token = await generateToken();
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
    const password = generatePassword(timestamp);

    const payload = {
      BusinessShortCode: MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: amount,
      PartyA: phoneNumber,  // Phone number to pay
      PartyB: MPESA_SHORTCODE,  // Shortcode
      PhoneNumber: phoneNumber,
      CallBackURL: `${MPESA_CALLBACK_URL}?orderId=${orderId}`,
      AccountReference: orderId,
      TransactionDesc: `Payment for order ${orderId}`,
    };

    const response = await axios.post(
      `${MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return {
      success: true,
      merchantRequestID: response.data.MerchantRequestID,
      checkoutRequestID: response.data.CheckoutRequestID,
      responseCode: response.data.ResponseCode,
    };
  } catch (error) {
    console.error('M-Pesa STK Push error:', error);
    throw new Error('Failed to initiate payment');
  }
};

// Callback handler
export const handleCallback = async (callbackData: any, orderId: string) => {
  const resultCode = callbackData.Body.stkCallback.ResultCode;

  if (resultCode === '0') {
    // Success
    const metadata = callbackData.Body.stkCallback.CallbackMetadata;
    const amount = metadata.Item.find((i: any) => i.Name === 'Amount')?.Value;
    const mpesaReceipt = metadata.Item.find((i: any) => i.Name === 'M-Pesa Receipt Number')?.Value;
    const transactionDate = metadata.Item.find((i: any) => i.Name === 'Transaction Date')?.Value;
    const phoneNumber = metadata.Item.find((i: any) => i.Name === 'PhoneNumber')?.Value;

    // Update order in database
    await Order.findByIdAndUpdate(orderId, {
      paymentStatus: 'paid',
      paymentMethod: 'mpesa',
      paymentDetails: {
        mpesaReceipt,
        amount,
        transactionDate,
        phoneNumber,
      },
    });

    return { success: true };
  } else {
    // Failed
    await Order.findByIdAndUpdate(orderId, {
      paymentStatus: 'failed',
      paymentDetails: {
        resultCode,
        resultDesc: callbackData.Body.stkCallback.ResultDesc,
      },
    });

    return { success: false, error: callbackData.Body.stkCallback.ResultDesc };
  }
};
```

**Express Routes:**

```typescript
router.post('/mpesa/initiate', authMiddleware, async (req, res) => {
  try {
    const { phoneNumber, amount } = req.body;

    if (!phoneNumber || !amount) {
      return res.status(400).json({ error: 'Phone number and amount required' });
    }

    // Create pending order
    const order = await Order.create({
      user: req.user.id,
      amount,
      paymentStatus: 'pending',
      paymentMethod: 'mpesa',
    });

    // Initiate STK Push
    const result = await initiateSTKPush(phoneNumber, amount, order.id);

    res.json({
      message: 'Payment initiated. Please check your phone.',
      checkoutRequestID: result.checkoutRequestID,
      orderId: order.id,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to initiate payment' });
  }
});

// M-Pesa callback (no auth required)
router.post('/mpesa/callback', async (req, res) => {
  try {
    const { Body } = req.body;
    const orderId = req.query.orderId as string;

    await handleCallback(Body, orderId);

    res.json({ ResultCode: 0, ResultDesc: 'Success' });
  } catch (error) {
    console.error('M-Pesa callback error:', error);
    res.json({ ResultCode: 1, ResultDesc: 'Failed' });
  }
});
```

### 8.2 M-Pesa Webhook Security

**Validate Callback Requests:**

```typescript
import crypto from 'crypto';

// Verify M-Pesa callback signature
const validateCallbackSignature = (payload: any, signature: string): boolean => {
  const secret = process.env.MPESA_CALLBACK_SECRET!;

  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(payload));
  const digest = hmac.digest('base64');

  return digest === signature;
};

// In callback route
router.post('/mpesa/callback', (req, res) => {
  const signature = req.headers['x_mpesa_signature'] as string;

  if (!signature || !validateCallbackSignature(req.body, signature)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // Process callback
  // ...
});
```

**Additional Security Measures:**

1. **Whitelist M-Pesa IPs:**
```typescript
const MPESA_IPS = ['196.201.214.200', '196.201.214.206'];

const mpesaIpMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const clientIp = req.ip;

  if (MPESA_IPS.includes(clientIp)) {
    next();
  } else {
    res.status(403).json({ error: 'Forbidden' });
  }
};

router.post('/mpesa/callback', mpesaIpMiddleware, callbackHandler);
```

2. **HTTPS Only:**
- Callback URL must use HTTPS
- Use TLS 1.2 or higher

### 8.3 Stripe Production Integration

**Stripe Configuration:**

```typescript
// src/config/stripe.ts
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27',  // Use latest API version
  typescript: true,
});

export default stripe;
```

**Create Payment Intent:**

```typescript
import stripe from '../config/stripe';

export const createPaymentIntent = async (amount: number, orderId: string) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100,  // Convert to cents
      currency: 'usd',
      metadata: {
        orderId,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  } catch (error) {
    console.error('Stripe payment intent error:', error);
    throw new Error('Failed to create payment intent');
  }
};

// Route
router.post('/stripe/create-intent', authMiddleware, async (req, res) => {
  try {
    const { amount } = req.body;

    const order = await Order.create({
      user: req.user.id,
      amount,
      paymentStatus: 'pending',
      paymentMethod: 'stripe',
    });

    const result = await createPaymentIntent(amount, order.id);

    res.json({
      clientSecret: result.clientSecret,
      paymentIntentId: result.paymentIntentId,
      orderId: order.id,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});
```

### 8.4 Stripe Webhook Security

**Webhook Handler:**

```typescript
import stripe from '../config/stripe';
import crypto from 'crypto';

// Verify webhook signature
export const constructStripeEvent = (payload: Buffer, signature: string) => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  try {
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret
    );

    return event;
  } catch (err) {
    throw new Error('Invalid webhook signature');
  }
};

// Webhook route
router.post('/stripe/webhook', async (req, res) => {
  const signature = req.headers['stripe-signature'] as string;

  try {
    const event = constructStripeEvent(req.body, signature);

    // Handle event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentSuccess(paymentIntent);
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object as Stripe.PaymentIntent;
        await handlePaymentFailure(failedPayment);
        break;

      case 'charge.refunded':
        const charge = event.data.object as Stripe.Charge;
        await handleRefund(charge);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(400).json({ error: 'Webhook signature verification failed' });
  }
});

const handlePaymentSuccess = async (paymentIntent: Stripe.PaymentIntent) => {
  const orderId = paymentIntent.metadata.orderId;

  await Order.findByIdAndUpdate(orderId, {
    paymentStatus: 'paid',
    paymentDetails: {
      stripePaymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount / 100,  // Convert back to dollars
    },
  });

  console.log(`✅ Payment succeeded for order: ${orderId}`);
};

const handlePaymentFailure = async (paymentIntent: Stripe.PaymentIntent) => {
  const orderId = paymentIntent.metadata.orderId;

  await Order.findByIdAndUpdate(orderId, {
    paymentStatus: 'failed',
    paymentDetails: {
      error: paymentIntent.last_payment_error?.message,
    },
  });

  console.log(`❌ Payment failed for order: ${orderId}`);
};
```

**Important Webhook Security Practices:**

1. **Always verify signatures** - Never skip this step
2. **Use different webhook secrets** for test and live modes
3. **Handle webhooks idempotently** - Same event may be delivered multiple times
4. **HTTPS only** - Webhook endpoint must use HTTPS
5. **Return 200 quickly** - Acknowledge receipt, then process asynchronously

**Sources:**
- [Stripe Webhook Signature Verification](https://docs.stripe.com/webhooks/signature)
- [M-Pesa Integration Complete Guide](https://webpinn.com/mpesa-integration-guide-kenya/)
- [Secure M-Pesa Webhooks](https://zama.co.ke/blog/m-pesa-integration-website/)

---

## 9. Monitoring & Logging

### 9.1 Application Monitoring Solutions

**Top Monitoring Tools for 2024-2025:**

| Tool | Best For | Pricing | Features |
|------|----------|---------|----------|
| **Sentry** | Error tracking | Free - $26/mo | Real-time error tracking, release tracking |
| **Honeybadger** | Full-stack | Free - $79/mo | Error + uptime + cron monitoring |
| **SigNoz** | Open-source APM | Free - $48/mo | Metrics, traces, logs (all-in-one) |
| **New Relic** | Enterprise | From $50/mo | Full observability platform |
| **DataDog** | Enterprise | From $15/host | Comprehensive monitoring |

**Recommendation: Use Sentry (free tier) or Honeybadger**

**Sources:**
- [8 Best Sentry Alternatives](https://instatus.com/blog/sentry-alternatives)
- [Honeybadger for Node.js](https://www.honeybadger.io/for/node/)

### 9.2 Sentry Setup

**Install Sentry:**

```bash
npm install @sentry/node
```

**Configure Sentry:**

```typescript
// src/config/sentry.ts
import * as Sentry from '@sentry/node';

if (process.env.NODE_ENV === 'production') {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,

    // Set traces sample rate to 1.0 to capture 100% of transactions
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,

    // Capture replay sessions
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    // Before send filter
    beforeSend(event, hint) {
      // Filter out sensitive data
      if (event.request) {
        delete event.request.cookies;
        delete event.request.headers;
      }

      // Filter out specific errors
      if (event.exception?.values?.[0]?.type === 'UnauthorizedError') {
        return null;  // Don't send 401 errors
      }

      return event;
    },

    // Integrations
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Express({ app }),
      new Sentry.Integrations.Mongo(),
    ],
  });

  console.log('✅ Sentry initialized');
}

export { Sentry };
```

**Express Integration:**

```typescript
import express from 'express';
import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';

const app = express();

// Sentry request handler
app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());

// Your routes
app.get('/', (req, res) => {
  res.send('Hello World');
});

// Sentry error handler (must be before other error handlers)
app.use(Sentry.Handlers.errorHandler());

// Optional error handler
app.use((err, req, res, next) => {
  res.status(500).json({ error: 'Something went wrong' });
});
```

### 9.3 Performance Monitoring

**Custom Performance Metrics:**

```typescript
import { performance } from 'perf_hooks';

// Response time middleware
app.use((req, res, next) => {
  const start = performance.now();

  res.on('finish', () => {
    const duration = performance.now() - start;

    // Log slow requests
    if (duration > 1000) {
      console.warn(`⚠️  Slow request: ${req.method} ${req.path} - ${duration.toFixed(2)}ms`);
    }

    // Send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      // metrics.send('response_time', duration);
    }
  });

  next();
});
```

**Database Query Monitoring:**

```typescript
import mongoose from 'mongoose';

// Enable query logging in development
if (process.env.NODE_ENV === 'development') {
  mongoose.set('debug', (collectionName, method, query, doc) => {
    console.log(`🔍 MongoDB Query: ${collectionName}.${method}`, JSON.stringify(query));
  });
}

// Monitor slow queries in production
mongoose.connection.on('query', (query) => {
  if (query.duration > 1000) {
    console.warn(`⚠️  Slow MongoDB query: ${query.duration}ms`, query);
  }
});
```

### 9.4 Log Aggregation

**Centralized Logging:**

```bash
# Install Winston transports for external services
npm install winston winston-daily-rotate-file
# Optional: Add log aggregation
npm install @elastic/elasticsearch  # For ELK stack
# or
npm install @google-cloud/logging   # For Google Cloud Logging
# or
npm install @datadog/winston        # For DataDog
```

**Elasticsearch Log Transport:**

```typescript
import { Client } from '@elastic/elasticsearch';
import WinstonElasticsearch from 'winston-elasticsearch';

const esTransport = new WinstonElasticsearch({
  level: 'info',
  clientOpts: {
    node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
  },
  index: 'ementech-logs',
});

logger.add(esTransport);
```

### 9.5 Uptime Monitoring

**Health Check Endpoint:**

```typescript
router.get('/health', async (req, res) => {
  const health = {
    uptime: process.uptime(),
    timestamp: Date.now(),
    status: 'healthy',
    checks: {
      database: 'unknown',
      redis: 'unknown',
      external: 'unknown',
    },
  };

  try {
    // Check MongoDB
    await mongoose.connection.db.admin().ping();
    health.checks.database = 'healthy';
  } catch (error) {
    health.status = 'unhealthy';
    health.checks.database = 'unhealthy';
  }

  try {
    // Check Redis (if using)
    await redisClient.ping();
    health.checks.redis = 'healthy';
  } catch (error) {
    health.status = 'unhealthy';
    health.checks.redis = 'unhealthy';
  }

  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});
```

**External Monitoring Services:**

- **UptimeRobot** - Free for 50 monitors, 5-minute intervals
- **Pingdom** - From $10/mo, 1-minute intervals
- **StatusCake** - Free tier available
- **Better Uptime** - Free, includes status pages

---

## 10. Security Hardening

### 10.1 JWT Token Security in Production

**Implementation Best Practices:**

```typescript
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// Use RS256 (asymmetric) in production
// Generate keys:
// openssl genrsa -out private.pem 2048
// openssl rsa -in private.pem -pubout -out public.pem

const privateKey = process.env.JWT_PRIVATE_KEY || '';
const publicKey = process.env.JWT_PUBLIC_KEY || '';

// Generate tokens
export const generateTokens = (userId: string) => {
  const payload = {
    userId,
    iat: Math.floor(Date.now() / 1000),
  };

  const accessToken = jwt.sign(payload, privateKey, {
    algorithm: 'RS256',
    expiresIn: '15m',
  });

  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET!,
    {
      expiresIn: '7d',
    }
  );

  return { accessToken, refreshToken };
};

// Verify access token
export const verifyAccessToken = (token: string) => {
  try {
    return jwt.verify(token, publicKey, { algorithms: ['RS256'] });
  } catch (error) {
    throw new Error('Invalid access token');
  }
};

// Verify refresh token
export const verifyRefreshToken = (token: string) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET!);
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
};
```

**Token Storage Best Practices:**

```typescript
// Use httpOnly cookies (NOT localStorage)
res.cookie('accessToken', accessToken, {
  httpOnly: true,
  secure: true,      // HTTPS only
  sameSite: 'strict',
  maxAge: 15 * 60 * 1000,  // 15 minutes
  path: '/',
});

res.cookie('refreshToken', refreshToken, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 days
  path: '/api/auth/refresh',
});
```

**Sources:**
- [JWT Authentication Best Practices](https://blog.logrocket.com/jwt-authentication-best-practices/)
- [5 JWT Best Practices for Node.js](https://medium.com/deno-the-complete-reference/5-jwt-authentication-best-practices-for-node-js-apps-f1aaceda3f81)

### 10.2 Rate Limiting Per IP/User

**Advanced Rate Limiting:**

```typescript
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';

// Per-user rate limit
const createRateLimiter = (windowMs: number, max: number, keyPrefix: string) => {
  return rateLimit({
    store: process.env.REDIS_URL
      ? new RedisStore({
          client: redisClient,
          prefix: `rate_limit:${keyPrefix}:`,
        })
      : undefined,
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,

    // Key generator (per user or per IP)
    keyGenerator: (req) => {
      return (req as any).user?.id || req.ip;
    },

    // Skip successful login attempts
    skipSuccessfulRequests: true,

    // Custom handler
    handler: (req, res) => {
      res.status(429).json({
        error: 'Too many requests',
        retryAfter: Math.round(windowMs / 1000),
      });
    },
  });
};

// Apply different limits
app.use('/api/auth/login', createRateLimiter(15 * 60 * 1000, 5, 'auth'));
app.use('/api/', createRateLimiter(15 * 60 * 1000, 100, 'api'));
```

### 10.3 Input Validation and Sanitization

**Express Validator Setup:**

```bash
npm install express-validator
```

**Validation Middleware:**

```typescript
import { body, param, query, validationResult } from 'express-validator';

export const validate = (req: any, res: any, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Validation rules
export const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email address'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])/)
    .withMessage('Password must contain uppercase, lowercase, number, and special character'),
  body('username')
    .isLength({ min: 3, max: 30 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  validate,
];

// Sanitize input
import { sanitize } from 'express-validator';

export const sanitizeInput = [
  body('name').trim().escape(),
  body('description').trim(),
  body('email').normalizeEmail(),
];
```

**NoSQL Injection Prevention:**

```typescript
import mongoSanitize from 'express-mongo-sanitize';

app.use(mongoSanitize({
  replaceWith: '_',  // Replace $ and . with _
  onSanitize: ({ req, key }) => {
    console.warn(`⚠️  Sanitized ${key} in request`);
  },
}));
```

### 10.4 XSS Protection

**Helmet.js for Security Headers:**

```bash
npm install helmet
```

**Configure Helmet:**

```typescript
import helmet from 'helmet';

app.use(helmet());

// Content Security Policy
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https://res.cloudinary.com'],
      connectSrc: ["'self'", 'https://api.ementech.com'],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  })
);

// Additional headers
app.use(helmet.hsts({
  maxAge: 31536000,  // 1 year
  includeSubDomains: true,
  preload: true
}));

app.use(helmet.noSniff());
app.use(helmet.xssFilter());
app.use(helmet.referrerPolicy({ policy: 'no-referrer' }));
```

**XSS Prevention in User Input:**

```typescript
import DOMPurify from 'isomorphic-dompurify';

// Sanitize HTML input
const sanitizeHTML = (dirty: string) => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a'],
    ALLOWED_ATTR: ['href'],
  });
};

// In route
app.post('/comment', (req, res) => {
  const cleanContent = sanitizeHTML(req.body.content);

  // Save clean content to database
  Comment.create({ content: cleanContent });
});
```

### 10.5 CSRF Protection

**CSRF Token Implementation:**

```bash
npm install csurf
```

**CSRF Middleware:**

```typescript
import csrf from 'csurf';

const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
  },
});

// Generate CSRF token
app.get('/api/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Apply CSRF protection to state-changing routes
app.post('/api/*', csrfProtection, (req, res, next) => {
  next();
});
```

**Client-Side Implementation:**

```typescript
// Fetch CSRF token
const getCsrfToken = async () => {
  const response = await fetch('/api/csrf-token');
  const { csrfToken } = await response.json();
  return csrfToken;
};

// Make authenticated request
const makeRequest = async () => {
  const csrfToken = await getCsrfToken();

  const response = await fetch('/api/data', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken,
    },
    body: JSON.stringify({ data: 'value' }),
  });
};
```

### 10.6 Complete Security Hardening Checklist

**Security Checklist:**

- [ ] HTTPS enabled with valid SSL certificate (Let's Encrypt)
- [ ] httpOnly cookies for JWT tokens
- [ ] Secure flag on cookies (HTTPS only)
- [ ] SameSite=strict on cookies
- [ ] Helmet.js configured with CSP
- [ ] Rate limiting on all endpoints
- [ ] Input validation and sanitization
- [ ] SQL injection prevention (mongo-sanitize)
- [ ] XSS protection (DOMPurify)
- [ ] CSRF protection (csurf)
- [ ] Environment variables properly secured
- [ ] Dependencies regularly updated (`npm audit`)
- [ ] CORS properly configured (whitelist only)
- [ ] File upload validation (type, size)
- [ ] Webhook signature verification
- [ ] Strong password policy (bcrypt + salt)
- [ ] Account lockout after failed attempts
- [ ] Security headers set (Helmet.js)
- [ ] Request size limits
- [ ] Disabled x-powered-by header
- [ ] Logging and monitoring enabled
- [ ] Regular security audits
- [ ] Database connection encrypted (TLS)
- [ ] API authentication on all routes
- [ ] Error messages don't leak information

**Sources:**
- [Express.js Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Helmet.js Official Documentation](https://helmetjs.github.io/)
- [Node.js Security Best Practices](https://semaphore.io/blog/securing-nodejs)

---

## 11. Deployment Strategy

### 11.1 Zero-Downtime Deployment

**Using PM2 Cluster Mode:**

```bash
# Reload (zero-downtime restart)
pm2 reload ecosystem.config.js --env production

# This restarts workers one by one
```

**Blue-Green Deployment:**

```bash
# 1. Deploy to "green" environment
git clone https://github.com/user/repo.git /var/www/ementech-green
cd /var/www/ementech-green
npm install
npm run build

# 2. Start green environment
pm2 start ecosystem.config.js --env production --name ementech-green

# 3. Test green environment
curl https://green.ementech.com/health

# 4. Switch nginx to green
# Update nginx config to point to green
nginx -t && nginx -s reload

# 5. Stop blue environment (old version)
pm2 stop ementech-blue
```

**nginx Configuration for Blue-Green:**

```nginx
upstream backend_blue {
    server 127.0.0.1:5000;
}

upstream backend_green {
    server 127.0.0.1:5002;
}

server {
    # Change to backend_green to switch
    proxy_pass http://backend_blue;
}
```

**Sources:**
- [Zero-Downtime Deployments with PM2](https://medium.com/@mif05123/achieving-zero-downtime-deployments-in-node-js-with-pm2-and-blue-green-strategy-c82f152864a9)
- [Blue-Green Deployment Guide](https://semaphore.io/blog/blue-green-deployment-nodejs)

### 11.2 Database Migration Handling

**Migrate-Mongo for Migrations:**

```bash
npm install migrate-mongo
```

**Create Migration File:**

```javascript
// migrations/20250118000000-add-index.js
module.exports = {
  async up(db) {
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
  },

  async down(db) {
    await db.collection('users').dropIndex({ email: 1 });
  },
};
```

**Run Migrations:**

```bash
# Create migration
migrate-mongo create add-index

# Run migrations
migrate-mongo up

# Rollback
migrate-mongo down
```

### 11.3 Rollback Strategy

**Automated Rollback Script:**

```bash
#!/bin/bash
# rollback.sh

VERSION=$1

if [ -z "$VERSION" ]; then
  echo "Usage: ./rollback.sh <version>"
  exit 1
fi

echo "Rolling back to version: $VERSION"

# Checkout previous version
git checkout $VERSION

# Install dependencies
npm ci

# Build
npm run build

# Reload PM2 (zero-downtime)
pm2 reload ecosystem.config.js --env production

echo "✅ Rollback completed"
```

**Database Rollback:**

```bash
# Rollback last migration
migrate-mongo down

# Rollback specific migration
migrate-mongo down [migration-name]
```

---

## 12. Deployment Checklist

### Pre-Deployment

- [ ] Environment variables configured in `.env.production`
- [ ] All secrets properly generated and stored
- [ ] Database indexes created
- [ ] Database migrations tested
- [ ] SSL certificate installed and valid
- [ ] nginx configured and tested
- [ ] Firewall rules set (ufw)
- [ ] PM2 ecosystem file configured
- [ ] Log rotation enabled
- [ ] Monitoring services configured (Sentry, etc.)
- [ ] Backup strategy in place
- [ ] Rate limiting tested
- [ ] CORS configuration verified
- [ ] Payment webhooks configured with live endpoints
- [ ] Cloudinary folder structure created

### Deployment Steps

1. **Update server:**
```bash
ssh user@your-vps-ip

# Navigate to project
cd /var/www/ementech-backend

# Pull latest code
git pull origin main

# Install dependencies
npm ci --production

# Build TypeScript
npm run build

# Run migrations
npm run migrate

# Reload PM2 (zero-downtime)
pm2 reload ecosystem.config.js --env production
```

2. **Frontend deployment:**
```bash
# On local machine
npm run build

# Upload to server
scp -r dist/* user@your-vps:/var/www/ementech-frontend/

# Or build on server
cd /var/www/ementech-frontend
git pull
npm ci
npm run build
```

3. **Verify deployment:**
```bash
# Check PM2 status
pm2 list
pm2 logs ementech-api --lines 50

# Check health endpoint
curl https://api.ementech.com/health

# Check nginx
sudo nginx -t
sudo systemctl status nginx
```

### Post-Deployment

- [ ] Smoke tests passed
- [ ] API endpoints responding
- [ ] Database connectivity verified
- [ ] WebSocket connections working
- [ ] Payment integrations tested (test mode)
- [ ] File uploads working
- [ ] Email notifications working
- [ ] Monitoring receiving data
- [ ] Logs show no errors
- [ ] Performance metrics baseline established
- [ ] Backup scheduled tasks verified
- [ ] SSL certificate not expiring soon

---

## 13. Common Production Issues & Solutions

### 13.1 PM2 Common Issues

**Issue: PM2 not starting on server reboot**

**Solution:**
```bash
# Save current processes
pm2 save

# Generate startup script
pm2 startup systemd
# Copy and run the output command

# Verify
systemctl status pm2-user
```

**Issue: High memory usage**

**Solution:**
```javascript
// ecosystem.config.js
{
  max_memory_restart: '1G',  // Restart if exceeds 1GB

  // Or increase Node.js memory
  node_args: '--max-old-space-size=2048',
}
```

**Issue: Cluster mode not utilizing all cores**

**Solution:**
```javascript
{
  instances: 'max',  // Use all available CPUs
  exec_mode: 'cluster',
}
```

### 13.2 MongoDB Connection Issues

**Issue: Connection pool exhausted**

**Solution:**
```typescript
// Increase pool size
maxPoolSize: 20,

// Add connection timeout
serverSelectionTimeoutMS: 5000,

// Monitor connection pool
mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected');
});
```

**Issue: Slow queries**

**Solution:**
```bash
# Enable slow query logging in Atlas
# Or manually
db.setProfilingLevel(1, { slowms: 1000 })

# Check explain plan
db.users.find({ email: 'test@example.com' }).explain('executionStats')

# Add missing index
db.users.createIndex({ email: 1 })
```

### 13.3 Socket.io Issues

**Issue: WebSocket connection drops**

**Solution:**
```typescript
const io = new Server(httpServer, {
  pingTimeout: 60000,
  pingInterval: 25000,

  // Client-side reconnection
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 10,
});
```

**Issue: Sticky sessions not working**

**Solution:**
```nginx
# Use ip_hash in nginx
upstream socket_io_backend {
    ip_hash;
    server 127.0.0.1:5001;
}
```

### 13.4 nginx Issues

**Issue: 502 Bad Gateway**

**Solution:**
```bash
# Check if backend is running
pm2 list

# Check nginx configuration
sudo nginx -t

# Check nginx error logs
sudo tail -f /var/log/nginx/error.log

# Restart nginx
sudo systemctl restart nginx
```

**Issue: 413 Request Entity Too Large (file uploads)**

**Solution:**
```nginx
# Increase max body size
client_max_body_size 10M;
```

### 13.5 SSL Issues

**Issue: SSL certificate expired**

**Solution:**
```bash
# Renew Let's Encrypt certificate
sudo certbot renew

# Reload nginx
sudo systemctl reload nginx
```

**Issue: Mixed content warnings**

**Solution:**
```javascript
// Ensure all assets use HTTPS
const APP_URL = 'https://ementech.com';  // Not http://
```

---

## 14. Performance Optimization

### 14.1 Frontend Optimization

**Code Splitting:**

```typescript
// Lazy load routes
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('./pages/Dashboard'));

<Suspense fallback={<Loading />}>
  <Dashboard />
</Suspense>
```

**Image Optimization:**

```typescript
// Use Cloudinary transformations
const optimizedImage = cloudinary.url('public_id', {
  fetch_format: 'auto',
  quality: 'auto',
  width: 800,
  crop: 'scale',
});
```

**Bundle Size Reduction:**

```bash
# Analyze bundle
npm run build -- --mode production
npx vite-bundle-visualizer

# Or use rollup-plugin-visualizer
```

### 14.2 Backend Optimization

**Database Query Optimization:**

```typescript
// Use lean() for faster queries
const users = await User.find({ active: true }).lean();

// Select only needed fields
const users = await User.find({}, { name: 1, email: 1 });

// Use pagination
const users = await User.find()
  .limit(20)
  .skip(page * 20);

// Use indexes
UserSchema.index({ email: 1 });
```

**Caching Strategy:**

```typescript
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 600 });  // 10 minutes

export const getCachedData = async (key: string, fetcher: () => Promise<any>) => {
  const cached = cache.get(key);
  if (cached) return cached;

  const data = await fetcher();
  cache.set(key, data);
  return data;
};
```

**Compression:**

```typescript
import compression from 'compression';

app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  threshold: 1024,  // Only compress if > 1KB
}));
```

### 14.3 nginx Optimization

**Enable Caching:**

```nginx
# Proxy cache
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=1g inactive=60m;

location /api/ {
    proxy_cache api_cache;
    proxy_cache_valid 200 5m;
    proxy_cache_use_stale error timeout updating;
}
```

**Enable HTTP/2:**

```nginx
server {
    listen 443 ssl http2;

    # ...
}
```

**Gzip Compression:**

```nginx
gzip on;
gzip_vary on;
gzip_proxied any;
gzip_comp_level 6;
gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/rss+xml font/truetype font/opentype application/vnd.ms-fontobject image/svg+xml;
```

---

## Conclusion

This comprehensive guide covers all aspects of deploying a MERN stack application to production on a VPS. Follow the best practices outlined here to ensure a secure, performant, and reliable production deployment.

**Key Takeaways:**

1. **Use MongoDB Atlas** for production databases
2. **PM2 Cluster Mode** for multi-core utilization and zero-downtime deployments
3. **nginx** as reverse proxy with SSL, rate limiting, and caching
4. **Environment variable validation** at startup
5. **Comprehensive monitoring** with Sentry or Honeybadger
6. **Security hardening** with Helmet.js, rate limiting, and input validation
7. **Blue-green deployment** strategy for zero downtime
8. **Regular backups** and tested rollback procedures
9. **Performance optimization** with caching, compression, and indexing
10. **Comprehensive logging** and error tracking

For additional help or questions, refer to the official documentation and resources linked throughout this guide.

---

## Sources

### MERN Deployment
- [VPS Deployment with Nginx and PM2](https://rmtjob.com/learn/vps-deployment)
- [Deploy MERN Stack on Ubuntu](https://medium.com/blockchain-research-lab-akgec/the-ultimate-beginners-guide-to-deploying-a-mern-stack-on-ubuntu-with-nginx-pm2-and-ssl-by-let-s-50d3d1c355ef)
- [Production-Ready Full Stack Apps with MERN](https://www.freecodecamp.org/news/how-to-build-production-ready-full-stack-apps-with-the-mern-stack/)

### Database
- [MongoDB Atlas vs Self-Hosted Comparison](https://thedbadmin.com/blog/mongodb-atlas-vs-self-hosted-comparison) (Jan 2025)
- [MongoDB Performance Best Practices: Indexing](https://www.mongodb.com/company/blog/performance-best-practices-indexing)
- [MongoDB Optimization 2025](https://simplelogic-it.com/mongodb-optimization-2025/)

### PM2 & Process Management
- [PM2 Cluster Mode Documentation](https://pm2.keymetrics.io/docs/usage/cluster-mode/)
- [PM2 Ecosystem File Reference](https://pm2.io/docs/runtime/reference/ecosystem-file/)
- [Deploying Node.js with PM2 in Production](https://medium.com/@a_farag/deploying-a-node-js-project-with-pm2-in-production-mode-fc0e794dc4aa)

### Security
- [JWT Authentication Best Practices](https://blog.logrocket.com/jwt-authentication-best-practices/)
- [Express.js Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Helmet.js Documentation](https://helmetjs.github.io/)
- [CORS Security Implications](https://snyk.io/blog/security-implications-cors-node-js/)

### File Uploads
- [Cloudinary Upload Presets](https://cloudinary.com/documentation/upload_presets)
- [Secure Media Uploads for React](https://medium.com/@sameertrivedi1234/a-beginners-guide-to-media-uploads-for-react-apps-signed-uploads-with-react-cloudinary-4af4625225fe)
- [Cloudinary CDN Integration](https://www.ioriver.io/questions/how-do-i-integrate-cloudinary-with-a-cdn-for-faster-image-delivery)

### Payment Integration
- [Stripe Webhook Verification](https://docs.stripe.com/webhooks/signature)
- [M-Pesa Integration Guide](https://webpinn.com/mpesa-integration-guide-kenya/)
- [Secure M-Pesa Webhooks](https://zama.co.ke/blog/m-pesa-integration-website/)

### Monitoring & Logging
- [Best Sentry Alternatives 2025](https://last9.io/blog/the-best-sentry-alternatives/)
- [Honeybadger for Node.js](https://www.honeybadger.io/for/node/)
- [NGINX Rate Limiting](https://blog.nginx.org/blog/rate-limiting-nginx)

### Deployment Strategy
- [Zero-Downtime with PM2 and Blue-Green](https://medium.com/@mif05123/achieving-zero-downtime-deployments-in-node-js-with-pm2-and-blue-green-strategy-c82f152864a9)
- [Blue-Green Deployment for Node.js](https://semaphore.io/blog/blue-green-deployment-nodejs)

---

**Document Version:** 1.0
**Last Updated:** January 18, 2026
**Maintained By:** Ementech Development Team
