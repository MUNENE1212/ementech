# Admin Dashboard - Deployment Guide

## Overview

This document provides step-by-step instructions for deploying the EmenTech Admin Dashboard to production.

---

## Prerequisites

### Server Requirements

- **VPS**: Ubuntu 22.04 LTS
- **RAM**: Minimum 4GB (8GB recommended)
- **Disk**: Minimum 80GB SSD
- **CPU**: Minimum 2 cores
- **Node.js**: 20.x LTS
- **MongoDB**: Atlas cluster or local installation
- **Redis**: Local or cloud instance

### Software Installed

```bash
# Check versions
node --version  # v20.x
npm --version   # 10.x
pm2 --version   # 5.x
nginx -v        # Latest
```

---

## Deployment Steps

### Step 1: Domain Configuration

**1.1 Create DNS Record**:

```
Type: A
Name: admin
Value: 69.164.244.165
TTL: 3600
```

**1.2 Verify DNS Propagation**:

```bash
dig admin.ementech.co.ke
```

Wait for DNS to propagate (can take up to 24 hours)

---

### Step 2: SSL Certificate

**2.1 Install Certbot**:

```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx
```

**2.2 Obtain Certificate**:

```bash
sudo certbot --nginx -d admin.ementech.co.ke
```

Follow the prompts:
- Enter email address
- Agree to terms
- Choose redirect to HTTPS

**2.3 Verify Auto-Renewal**:

```bash
sudo certbot renew --dry-run
```

Certificate will auto-renew every 90 days.

---

### Step 3: Nginx Configuration

**3.1 Create Nginx Config**:

```bash
sudo nano /etc/nginx/sites-available/admin-dashboard
```

**3.2 Add Configuration**:

```nginx
# Admin Dashboard Backend
upstream admin_backend {
    server localhost:5050;
}

# Admin Dashboard Frontend
upstream admin_frontend {
    server localhost:3000;
}

# HTTP to HTTPS redirect
server {
    listen 80;
    server_name admin.ementech.co.ke;
    return 301 https://$server_name$request_uri;
}

# HTTPS Server
server {
    listen 443 ssl http2;
    server_name admin.ementech.co.ke;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/admin.ementech.co.ke/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/admin.ementech.co.ke/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Logging
    access_log /var/log/nginx/admin-dashboard-access.log;
    error_log /var/log/nginx/admin-dashboard-error.log;

    # Frontend (Next.js)
    location / {
        proxy_pass http://admin_frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api/ {
        proxy_pass http://admin_backend;
        proxy_http_version 1.1;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Socket.IO
    location /socket.io/ {
        proxy_pass http://admin_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**3.3 Enable Site**:

```bash
sudo ln -s /etc/nginx/sites-available/admin-dashboard /etc/nginx/sites-enabled/
```

**3.4 Test Configuration**:

```bash
sudo nginx -t
```

**3.5 Restart Nginx**:

```bash
sudo systemctl restart nginx
```

---

### Step 4: Backend Deployment

**4.1 Clone Repository**:

```bash
cd /var/www
sudo mkdir admin-dashboard
sudo chown $USER:$USER admin-dashboard
cd admin-dashboard
git clone <repo-url> backend
```

**4.2 Install Dependencies**:

```bash
cd backend
npm ci --production
```

**4.3 Environment Configuration**:

```bash
cp .env.example .env
nano .env
```

**Add Configuration**:
```env
NODE_ENV=production
PORT=5050

# MongoDB
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/admin-dashboard

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-password

# JWT
JWT_SECRET=your-super-secret-key-min-32-chars
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=https://admin.ementech.co.ke

# Email
SMTP_HOST=smtp.ementech.co.ke
SMTP_PORT=587
SMTP_USER=alerts@ementech.co.ke
SMTP_PASS=your-password

# Socket.IO
SOCKET_IO_CORS_ORIGIN=https://admin.ementech.co.ke
```

**4.4 Create PM2 Ecosystem File**:

```bash
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [
    {
      name: 'admin-dashboard-backend',
      script: './src/server.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5050
      },
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
      max_memory_restart: '1G'
    }
  ]
};
```

**4.5 Start Backend with PM2**:

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

**4.6 Verify Backend**:

```bash
curl http://localhost:5050/api/health
```

Should return:
```json
{"status":"healthy","timestamp":"..."}
```

---

### Step 5: Frontend Deployment

**5.1 Clone Repository**:

```bash
cd /var/www/admin-dashboard
git clone <repo-url> frontend
```

**5.2 Install Dependencies**:

```bash
cd frontend
npm ci
```

**5.3 Environment Configuration**:

```bash
cp .env.local.example .env.local
nano .env.local
```

**Add Configuration**:
```env
NEXT_PUBLIC_API_URL=https://admin.ementech.co.ke/api
NEXT_PUBLIC_SOCKET_URL=https://admin.ementech.co.ke
NEXT_PUBLIC_APP_NAME=EmenTech Admin
```

**5.4 Build Application**:

```bash
npm run build
```

**5.5 Create PM2 Config**:

```bash
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [
    {
      name: 'admin-dashboard-frontend',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      cwd: '/var/www/admin-dashboard/frontend',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss'
    }
  ]
};
```

**5.6 Start Frontend with PM2**:

```bash
pm2 start ecosystem.config.js
pm2 save
```

**5.7 Verify Frontend**:

```bash
curl http://localhost:3000
```

Should return HTML (Next.js page)

---

### Step 6: Database Setup

**6.1 MongoDB Atlas (Recommended)**:

1. Go to https://www.mongodb.com/cloud/atlas
2. Create free cluster (M0)
3. Create database user
4. Whitelist IP: 69.164.244.165
5. Get connection string
6. Add to `.env` file

**6.2 Create Indexes**:

```bash
# Connect to MongoDB
mongo "mongodb+srv://cluster.mongodb.net/admin-dashboard" --username admin

# Create indexes
use admin-dashboard
db.sites.createIndex({ domain: 1 }, { unique: true })
db.healthchecks.createIndex({ "metadata.siteId": 1, timestamp: -1 })
db.analytics.createIndex({ "metadata.siteId": 1, timestamp: -1 })
db.users.createIndex({ email: 1 }, { unique: true })
```

---

### Step 7: Redis Setup

**7.1 Install Redis**:

```bash
sudo apt update
sudo apt install redis-server
```

**7.2 Configure Redis**:

```bash
sudo nano /etc/redis/redis.conf
```

Set password:
```
requirepass your-redis-password
```

**7.3 Restart Redis**:

```bash
sudo systemctl restart redis
sudo systemctl enable redis
```

**7.4 Verify Redis**:

```bash
redis-cli
AUTH your-redis-password
PING
```

Should return: `PONG`

---

### Step 8: Background Workers

**8.1 Create Worker Script**:

```bash
cd /var/www/admin-dashboard/backend
mkdir workers
cd workers
nano health-check-worker.js
```

**8.2 Worker Code**:

```javascript
import '../../config/database.js';
import { healthCheckQueue } from '../lib/queue.js';

// Process health check jobs
healthCheckQueue.process('check-site', async (job) => {
  const { siteId } = job.data;
  // Health check logic here
  console.log(`Checking site: ${siteId}`);
});
```

**8.3 Start Worker with PM2**:

```bash
pm2 start workers/health-check-worker.js --name admin-worker
pm2 save
```

---

### Step 9: Initial Setup

**9.1 Create Admin User**:

```bash
# Access backend console
pm2 logs admin-dashboard-backend --lines 0

# Or use API directly
curl -X POST https://admin.ementech.co.ke/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@ementech.co.ke",
    "password": "SecurePass123!",
    "firstName": "Admin",
    "lastName": "User"
  }'
```

**9.2 Add Sites**:

```bash
curl -X POST https://admin.ementech.co.ke/api/sites \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "EmenTech",
    "domain": "ementech.co.ke",
    "url": "https://ementech.co.ke",
    "type": "website",
    "monitoring": {
      "enabled": true,
      "interval": 5
    }
  }'
```

---

### Step 10: Monitoring & Logs

**10.1 PM2 Monitoring**:

```bash
# View all processes
pm2 list

# Monitor logs
pm2 logs

# Monitor metrics
pm2 monit
```

**10.2 Application Logs**:

```bash
# Backend logs
tail -f /var/www/admin-dashboard/backend/logs/out.log

# Frontend logs
tail -f /var/www/admin-dashboard/frontend/logs/out.log

# Nginx logs
tail -f /var/log/nginx/admin-dashboard-access.log
tail -f /var/log/nginx/admin-dashboard-error.log
```

**10.3 System Monitoring**:

```bash
# CPU, Memory
htop

# Disk usage
df -h

# Process monitoring
ps aux | grep node
```

---

## Update & Maintenance

### Update Application

**1. Pull Latest Code**:

```bash
cd /var/www/admin-dashboard/backend
git pull origin main
cd ../frontend
git pull origin main
```

**2. Install Dependencies**:

```bash
cd backend
npm ci --production
cd ../frontend
npm ci
npm run build
```

**3. Restart PM2**:

```bash
pm2 reload admin-dashboard-backend
pm2 reload admin-dashboard-frontend
```

### Backup Strategy

**Database Backup** (MongoDB Atlas):
- Enabled by default
- Daily snapshots
- Point-in-time recovery

**Code Backup**:
```bash
# Backup to remote server
rsync -avz /var/www/admin-dashboard/ user@backup-server:/backups/
```

**Configuration Backup**:
```bash
# Backup PM2 ecosystem
cp /var/www/admin-dashboard/backend/ecosystem.config.js ~/backups/

# Backup Nginx config
cp /etc/nginx/sites-available/admin-dashboard ~/backups/

# Backup environment files
cp /var/www/admin-dashboard/backend/.env ~/backups/
```

---

## Troubleshooting

### Common Issues

**1. Port Already in Use**:
```bash
# Find process using port
sudo lsof -i :5050

# Kill process
kill -9 <PID>

# Restart PM2
pm2 restart admin-dashboard-backend
```

**2. Database Connection Failed**:
- Check MongoDB URI in `.env`
- Verify IP whitelist in MongoDB Atlas
- Check network connectivity

**3. Redis Connection Failed**:
```bash
# Check Redis status
sudo systemctl status redis

# Test Redis connection
redis-cli -a your-password ping
```

**4. Nginx 502 Bad Gateway**:
- Check if backend is running: `pm2 list`
- Check backend logs: `pm2 logs admin-dashboard-backend`
- Verify port in Nginx config matches backend port

**5. SSL Certificate Error**:
```bash
# Renew manually
sudo certbot renew

# Reload Nginx
sudo systemctl reload nginx
```

---

## Security Checklist

- [ ] SSL certificate installed and valid
- [ ] Firewall configured (UFW)
- [ ] MongoDB password strong
- [ ] Redis password configured
- [ ] JWT secret is 32+ characters
- [ ] Environment files not in git
- [ ] PM2 runs as non-root user
- [ ] Automatic security updates enabled
- [ ] Regular backups configured
- [ ] Monitoring and alerting configured

---

## Performance Optimization

**1. Enable Nginx Caching**:

```nginx
# Add to server block
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=admin_cache:10m;

location /api/ {
    proxy_cache admin_cache;
    proxy_cache_valid 200 5m;
    proxy_pass http://admin_backend;
}
```

**2. Enable Gzip Compression**:

```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss;
```

**3. PM2 Cluster Mode**:

Already configured in `ecosystem.config.js` with 2 instances.

---

## Rollback Procedure

If deployment fails:

**1. Revert Git Changes**:
```bash
cd /var/www/admin-dashboard/backend
git reset --hard HEAD~1
cd ../frontend
git reset --hard HEAD~1
npm run build
```

**2. Restart PM2**:
```bash
pm2 reload all
```

**3. Restore from Backup**:
```bash
# Restore MongoDB (if needed)
mongorestore --uri="mongodb://..." /backups/mongodb/

# Restore files
rsync -avz user@backup-server:/backups/admin-dashboard/ /var/www/admin-dashboard/
```

---

**Document Version**: 1.0.0
**Last Updated**: 2025-01-20
**Author**: Architecture Team
**Status**: Complete - Ready for Production Deployment
