# EmenTech Email System - Deployment Guide

## Table of Contents
1. [System Requirements](#system-requirements)
2. [Prerequisites](#prerequisites)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [Running the Application](#running-the-application)
6. [API Documentation](#api-documentation)
7. [Testing](#testing)
8. [Production Deployment](#production-deployment)
9. [Troubleshooting](#troubleshooting)
10. [Maintenance](#maintenance)

---

## System Requirements

### Minimum Requirements
- **CPU**: 2 cores
- **RAM**: 4GB
- **Storage**: 20GB
- **OS**: Linux (Ubuntu 20.04+ recommended), macOS, or Windows with WSL2

### Recommended Requirements
- **CPU**: 4+ cores
- **RAM**: 8GB+
- **Storage**: 50GB+ SSD
- **OS**: Ubuntu 22.04 LTS

---

## Prerequisites

### 1. Node.js and npm
```bash
# Check installation
node --version  # Should be v18.0.0 or higher
npm --version   # Should be v9.0.0 or higher

# Install on Ubuntu
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install on macOS
brew install node
```

### 2. MongoDB
```bash
# Install on Ubuntu
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Verify installation
mongosh --version
```

### 3. Git
```bash
# Ubuntu/Debian
sudo apt-get install git

# macOS
brew install git
```

---

## Installation

### 1. Clone the Repository
```bash
cd /media/munen/muneneENT/ementech/ementech-website
```

### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Verify installation
npm list --depth=0
```

### 3. Frontend Setup
```bash
# Navigate to frontend directory
cd /media/munen/muneneENT/ementech/ementech-website

# Install dependencies
npm install

# Verify installation
npm list --depth=0
```

---

## Configuration

### 1. Environment Variables

Create a `.env` file in the backend directory:

```bash
cd /media/munen/muneneENT/ementech/ementech-website/backend
cp .env.example .env  # If example exists, or create manually
```

Edit `.env` with your configuration:

```env
# Server Configuration
NODE_ENV=development
PORT=5001
CLIENT_URL=http://localhost:5173

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/ementech

# JWT Authentication
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d

# Email Configuration (SMTP)
SMTP_HOST=mail.ementech.co.ke
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=admin@ementech.co.ke
SMTP_PASS=your_secure_password

# IMAP Configuration
IMAP_HOST=mail.ementech.co.ke
IMAP_PORT=993
IMAP_USER=admin@ementech.co.ke
IMAP_PASS=your_secure_password

# Email Server Configuration
EMAIL_DOMAIN=ementech.co.ke
EMAIL_FROM=noreply@ementech.co.ke
EMAIL_FROM_NAME=EmenTech

# CORS
CORS_ORIGIN=http://localhost:5173
```

### 2. Security Configuration

**Generate Secure JWT Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Update `.env` with generated secret:**
```env
JWT_SECRET=<generated_secret_here>
```

### 3. Email Server Configuration

Ensure your Postfix/Dovecot email server is configured and accessible:

```bash
# Test SMTP connection
telnet mail.ementech.co.ke 587

# Test IMAP connection
telnet mail.ementech.co.ke 993
```

---

## Running the Application

### Development Mode

**Terminal 1 - Backend:**
```bash
cd /media/munen/muneneENT/ementech/ementech-website/backend
npm run dev

# Expected output:
# ╔═══════════════════════════════════════╗
# ║   🚀 EmenTech Backend Server         ║
# ╠═══════════════════════════════════════╣
# ║  Environment: development             ║
# ║  Port: 5001                           ║
# ║  URL: http://localhost:5001           ║
# ╚═══════════════════════════════════════╝
# ✅ Socket.IO initialized
# 📧 Email system ready
```

**Terminal 2 - Frontend:**
```bash
cd /media/munen/muneneENT/ementech/ementech-website
npm run dev

# Expected output:
# ➜  Local:   http://localhost:5173/
# ➜  Network: http://192.168.1.x:5173/
```

### Production Mode

**Build Frontend:**
```bash
cd /media/munen/muneneENT/ementech/ementech-website
npm run build

# Output will be in: dist/
```

**Start Backend:**
```bash
cd /media/munen/muneneENT/ementech/ementech-website/backend
NODE_ENV=production npm start

# Or use PM2 (recommended)
npm install -g pm2
pm2 start src/server.js --name ementech-backend
pm2 save
pm2 startup
```

---

## API Documentation

### Base URL
```
Development: http://localhost:5001/api
Production: https://ementech.co.ke/api
```

### Authentication

All email endpoints require JWT authentication:

```bash
# Register new user
POST /api/auth/register
Body: {
  "name": "John Doe",
  "email": "john@ementech.co.ke",
  "password": "SecurePass123!",
  "role": "admin",
  "department": "engineering"
}

# Login
POST /api/auth/login
Body: {
  "email": "john@ementech.co.ke",
  "password": "SecurePass123!"
}

# Response includes JWT token:
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": { "user": {...} }
}

# Use token in subsequent requests:
Authorization: Bearer <token>
```

### Email Endpoints

#### 1. Fetch Emails
```http
GET /api/email?folder=INBOX
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": [
    {
      "_id": "67890abcdef",
      "messageId": "<message-id@ementech.co.ke>",
      "from": { "name": "Sender", "address": "sender@example.com" },
      "to": [{ "name": "Recipient", "address": "recipient@ementech.co.ke" }],
      "subject": "Email Subject",
      "body": "Email content...",
      "htmlBody": "<p>HTML content...</p>",
      "folder": "INBOX",
      "read": false,
      "flagged": false,
      "labels": ["important", "work"],
      "attachments": [],
      "receivedAt": "2025-01-19T10:30:00.000Z"
    }
  ]
}
```

#### 2. Sync Emails from IMAP
```http
POST /api/email/sync/INBOX
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "synced": 15,
    "failed": 0,
    "emails": [...]
  }
}
```

#### 3. Get Single Email
```http
GET /api/email/:emailId
Authorization: Bearer <token>
```

#### 4. Send Email
```http
POST /api/email/send
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "to": ["recipient@example.com"],
  "cc": ["cc@example.com"],
  "bcc": ["bcc@example.com"],
  "subject": "Test Email",
  "text": "Plain text body",
  "html": "<h1>HTML body</h1>",
  "attachments": [
    {
      "filename": "document.pdf",
      "contentType": "application/pdf",
      "content": "base64_encoded_content"
    }
  ]
}
```

#### 5. Mark as Read/Unread
```http
PUT /api/email/:emailId/read
Authorization: Bearer <token>
Body: { "read": true }

# Mark multiple
PUT /api/email/multiple/read
Body: {
  "emailIds": ["id1", "id2"],
  "read": true
}
```

#### 6. Toggle Star/Flag
```http
PUT /api/email/:emailId/flag
Authorization: Bearer <token>

# Toggle multiple
PUT /api/email/multiple/flag
Body: { "emailIds": ["id1", "id2"] }
```

#### 7. Move to Folder
```http
PUT /api/email/multiple/folder
Authorization: Bearer <token>
Body: {
  "emailIds": ["id1", "id2"],
  "folderId": "Archive"
}
```

#### 8. Delete Email
```http
DELETE /api/email/:emailId
Authorization: Bearer <token>

# Delete multiple
DELETE /api/email/multiple
Body: { "emailIds": ["id1", "id2"] }
```

#### 9. Search Emails
```http
GET /api/email/search?q=keyword&folder=INBOX
Authorization: Bearer <token>
```

#### 10. Get Folders
```http
GET /api/email/folders
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": [
    { "_id": "INBOX", "name": "Inbox", "unreadCount": 5 },
    { "_id": "Sent", "name": "Sent", "unreadCount": 0 },
    { "_id": "Drafts", "name": "Drafts", "unreadCount": 0 },
    { "_id": "Trash", "name": "Trash", "unreadCount": 0 },
    { "_id": "Archive", "name": "Archive", "unreadCount": 0 }
  ]
}
```

#### 11. Get Unread Count
```http
GET /api/email/unread/INBOX
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": { "count": 5 }
}
```

#### 12. Labels Management
```http
# Get all labels
GET /api/email/labels

# Create label
POST /api/email/labels
Body: { "name": "Important", "color": "#ff0000" }

# Add label to emails
PUT /api/email/labels/:labelId
Body: { "emailIds": ["id1", "id2"] }

# Remove label from emails
DELETE /api/email/labels/:labelId
Body: { "emailIds": ["id1", "id2"] }
```

#### 13. Contacts Management
```http
# Get all contacts
GET /api/email/contacts

# Create contact
POST /api/email/contacts
Body: {
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "company": "Example Inc"
}
```

### Health Check
```http
GET /api/health

Response:
{
  "status": "healthy",
  "timestamp": "2025-01-19T15:30:00.000Z",
  "uptime": 3600,
  "environment": "development"
}
```

---

## Testing

### 1. Backend Health Check
```bash
curl http://localhost:5001/api/health

# Expected:
# {"status":"healthy","timestamp":"2025-01-19T...","uptime":123,"environment":"development"}
```

### 2. Test Authentication
```bash
# Register admin user
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@ementech.co.ke",
    "password": "Admin2026!",
    "role": "admin",
    "department": "leadership"
  }'

# Login
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@ementech.co.ke",
    "password": "Admin2026!"
  }'

# Save the token from response
export TOKEN="<jwt_token_from_login>"
```

### 3. Test Email Endpoints
```bash
# Fetch emails
curl http://localhost:5001/api/email?folder=INBOX \
  -H "Authorization: Bearer $TOKEN"

# Get folders
curl http://localhost:5001/api/email/folders \
  -H "Authorization: Bearer $TOKEN"

# Send test email
curl -X POST http://localhost:5001/api/email/send \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": ["test@example.com"],
    "subject": "Test Email",
    "text": "This is a test email"
  }'
```

### 4. Test Socket.IO Connection

Access the frontend at `http://localhost:5173/email` and open browser console:

```javascript
// Check socket connection
// Should see: ✅ User connected: admin@ementech.co.ke
```

---

## Production Deployment

### 1. Using PM2 (Recommended)

**Install PM2:**
```bash
npm install -g pm2
```

**Create ecosystem file:**
```bash
cd /media/munen/muneneNT/ementech/ementech-website/backend
```

Create `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'ementech-backend',
    script: './src/server.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
```

**Start with PM2:**
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

**PM2 Commands:**
```bash
pm2 list                 # List all processes
pm2 logs ementech-backend # View logs
pm2 monit                # Monitor processes
pm2 restart ementech-backend
pm2 stop ementech-backend
pm2 delete ementech-backend
```

### 2. Nginx Reverse Proxy

**Install Nginx:**
```bash
sudo apt-get install nginx
```

**Create configuration:**
```bash
sudo nano /etc/nginx/sites-available/ementech
```

```nginx
# Upstream for backend
upstream ementech_backend {
    server localhost:5001;
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name ementech.co.ke www.ementech.co.ke;
    return 301 https://$server_name$request_uri;
}

# Main server block
server {
    listen 443 ssl http2;
    server_name ementech.co.ke www.ementech.co.ke;

    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/ementech.co.ke/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ementech.co.ke/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Frontend
    location / {
        root /var/www/ementech/dist;
        try_files $uri $uri/ /index.html;

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API
    location /api/ {
        proxy_pass http://ementech_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Socket.IO
    location /socket.io/ {
        proxy_pass http://ementech_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Enable site:**
```bash
sudo ln -s /etc/nginx/sites-available/ementech /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 3. SSL Certificate with Let's Encrypt

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d ementech.co.ke -d www.ementech.co.ke

# Auto-renewal (already configured)
sudo certbot renew --dry-run
```

### 4. Firewall Configuration

```bash
# Configure UFW
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

### 5. MongoDB Security

**Enable Authentication:**
```bash
# Edit MongoDB config
sudo nano /etc/mongod.conf

# Add:
security:
  authorization: enabled

# Restart MongoDB
sudo systemctl restart mongod
```

**Create admin user:**
```bash
mongosh
```

```javascript
use admin
db.createUser({
  user: "admin",
  pwd: "YourSecurePassword123!",
  roles: [ { role: "userAdminAnyDatabase", db: "admin" } ]
})

use ementech
db.createUser({
  user: "ementech_user",
  pwd: "YourSecurePassword123!",
  roles: [ { role: "readWrite", db: "ementech" } ]
})
exit()
```

**Update `.env`:**
```env
MONGODB_URI=mongodb://ementech_user:YourSecurePassword123!@localhost:27017/ementech
```

### 6. Build and Deploy Frontend

```bash
cd /media/munen/muneneENT/ementech/ementech-website

# Update API URL for production
# Create .env.production
echo "VITE_API_URL=https://ementech.co.ke/api" > .env.production

# Build
npm run build

# Deploy to web server
sudo cp -r dist/* /var/www/ementech/
sudo chown -R www-data:www-data /var/www/ementech
```

---

## Troubleshooting

### 1. Backend Won't Start

**Issue:** Port already in use
```bash
# Find process using port 5001
lsof -i :5001

# Kill process
kill -9 <PID>

# Or use different port
PORT=5002 npm start
```

**Issue:** MongoDB connection failed
```bash
# Check MongoDB status
sudo systemctl status mongod

# Start MongoDB
sudo systemctl start mongod

# Check logs
sudo tail -f /var/log/mongodb/mongod.log

# Test connection
mongosh mongodb://localhost:27017/ementech
```

**Issue:** Module not found errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### 2. Email Issues

**Issue:** IMAP connection failed
```bash
# Test IMAP connection
telnet mail.ementech.co.ke 993

# Check credentials in .env
# Verify firewall allows port 993
```

**Issue:** SMTP sending failed
```bash
# Test SMTP connection
telnet mail.ementech.co.ke 587

# Check SMTP configuration
# Verify credentials and permissions
```

### 3. Socket.IO Issues

**Issue:** Socket connection failed
- Verify JWT token is valid
- Check CORS settings in `src/server.js`
- Ensure Socket.IO client is using correct URL

**Issue:** Real-time updates not working
```bash
# Check Socket.IO logs
pm2 logs ementech-backend

# Verify client is connected
# Browser console: socket.connected should be true
```

### 4. Frontend Issues

**Issue:** API calls failing
- Check CORS configuration
- Verify JWT token is being sent
- Check network tab in browser DevTools

**Issue:** Build errors
```bash
# Clear cache
rm -rf node_modules/.vite
npm run dev
```

### 5. Performance Issues

**Enable MongoDB indexing:**
```bash
mongosh ementech
```

```javascript
db.emails.createIndex({ folder: 1, receivedAt: -1 })
db.emails.createIndex({ "from.address": 1 })
db.emails.createIndex({ subject: "text", body: "text" })
db.users.createIndex({ email: 1 }, { unique: true })
```

**Monitor system resources:**
```bash
pm2 monit
htop
```

---

## Maintenance

### 1. Database Backup

**Automated backup script:**
```bash
#!/bin/bash
# /usr/local/bin/backup-ementech.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/ementech"
mkdir -p $BACKUP_DIR

# Backup MongoDB
mongodump --uri="mongodb://localhost:27017/ementech" --out=$BACKUP_DIR/mongodb_$DATE

# Compress
tar -czf $BACKUP_DIR/ementech_backup_$DATE.tar.gz $BACKUP_DIR/mongodb_$DATE
rm -rf $BACKUP_DIR/mongodb_$DATE

# Keep only last 7 days
find $BACKUP_DIR -name "ementech_backup_*.tar.gz" -mtime +7 -delete
```

**Add to crontab:**
```bash
crontab -e

# Daily backup at 2 AM
0 2 * * * /usr/local/bin/backup-ementech.sh
```

### 2. Log Rotation

**Create logrotate config:**
```bash
sudo nano /etc/logrotate.d/ementech
```

```
/media/munen/muneneENT/ementech/ementech-website/backend/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        pm2 reload ementech-backend
    endscript
}
```

### 3. Updates

**Update dependencies:**
```bash
cd /media/munen/muneneENT/ementech/ementech-website/backend

# Check for updates
npm outdated

# Update packages
npm update

# Test before deploying
npm run test
```

### 4. Monitoring

**Install monitoring tools:**
```bash
# PM2 monitoring
pm2 install pm2-logrotate

# System monitoring (optional)
sudo apt-get install htop iotop
```

---

## Quick Reference

### Essential Commands

```bash
# Start development servers
cd /media/munen/muneneENT/ementech/ementech-website/backend && npm run dev &
cd /media/munen/muneneENT/ementech/ementech-website && npm run dev &

# Start production
cd /media/munen/muneneENT/ementech/ementech-website/backend
pm2 start ecosystem.config.js

# Check logs
pm2 logs ementech-backend

# Restart
pm2 restart ementech-backend

# Database operations
mongosh ementech
db.emails.countDocuments()
db.users.find()

# Test API
curl http://localhost:5001/api/health
```

### File Structure

```
ementech-website/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js       # MongoDB connection
│   │   │   └── socket.js         # Socket.IO handlers
│   │   ├── controllers/
│   │   │   └── emailController.js # Email business logic
│   │   ├── middleware/
│   │   │   └── auth.js           # JWT authentication
│   │   ├── models/
│   │   │   ├── User.js           # User model
│   │   │   ├── Email.js          # Email model
│   │   │   ├── Folder.js         # Folder model
│   │   │   └── Label.js          # Label model
│   │   ├── routes/
│   │   │   ├── email.routes.js   # Email API endpoints
│   │   │   └── auth.routes.js    # Auth endpoints
│   │   └── server.js             # Express server
│   ├── .env                      # Environment variables
│   ├── package.json
│   └── ecosystem.config.js       # PM2 config
├── src/
│   ├── components/
│   │   └── email/                # Email components
│   ├── contexts/
│   │   └── EmailContext.jsx      # Email state management
│   ├── pages/
│   │   └── EmailInbox.jsx        # Email inbox page
│   ├── services/
│   │   └── emailService.js       # API client
│   └── App.tsx                   # React Router
└── package.json
```

### API Endpoint Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/email` | Fetch emails |
| POST | `/api/email/sync/:folder` | Sync from IMAP |
| GET | `/api/email/:id` | Get single email |
| POST | `/api/email/send` | Send email |
| PUT | `/api/email/:id/read` | Mark read/unread |
| PUT | `/api/email/:id/flag` | Toggle star |
| DELETE | `/api/email/:id` | Delete email |
| GET | `/api/email/folders` | Get folders |
| GET | `/api/email/search` | Search emails |

---

## Support

For issues or questions:
- Email: support@ementech.co.ke
- Documentation: This guide
- Logs: Check PM2 logs and application logs

---

## Changelog

### v1.0.0 (2025-01-19)
- Initial production deployment
- Complete email system with IMAP/SMTP integration
- Real-time updates with Socket.IO
- JWT authentication with role-based access
- Full CRUD operations for emails, folders, labels, and contacts
- 18 API endpoints
- Production-ready with PM2, Nginx, and SSL

---

**Last Updated:** 2025-01-19
**Version:** 1.0.0
**Status:** Production Ready
