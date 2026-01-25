# EmenTech Deployment Guide

**Last Updated**: 2026-01-20
**Status**: Production Live
**URL**: https://ementech.co.ke

---

## Quick Reference

### Server Details
- **VPS**: Ubuntu Linux 6.14.0-37-generic
- **IP**: 69.164.244.165
- **SSH**: `ssh root@69.164.244.165`
- **Domain**: ementech.co.ke, www.ementech.co.ke

### Running Services
```
PM2 Processes:
├── ementech-backend (PID: 1640) - Port 5001
└── dumuwaks-backend (PID: 1637) - Separate project

Nginx:
├── HTTPS (443) - Frontend + API proxy
└── HTTP (80) - Redirects to HTTPS

MongoDB:
└── Connection via MONGODB_URI
```

---

## Deployment Structure

### Directory Layout
```
/var/www/
├── ementech-website/
│   ├── backend/               # Backend application
│   │   ├── src/
│   │   ├── node_modules/
│   │   ├── package.json
│   │   └── .env              # Environment variables
│   ├── current/               # Frontend build output
│   │   ├── index.html
│   │   └── assets/
│   ├── frontend/              # Previous builds
│   └── releases/              # Deployment history
│
└── dumuwaks-backend/          # Separate project
```

### Backend Configuration
**Location**: `/var/www/ementech-website/backend`

**PM2 App Name**: `ementech-backend`

**Entry Point**: `src/server.js`

**Port**: 5001

**Environment Variables** (`.env`):
```bash
PORT=5001
NODE_ENV=production
MONGODB_URI=mongodb://...
CORS_ORIGIN=https://ementech.co.ke,https://www.ementech.co.ke
JWT_SECRET=...
JWT_EXPIRE=7d

# Email IMAP
IMAP_HOST=...
IMAP_PORT=993
IMAP_USER=...
IMAP_PASSWORD=...

# Email SMTP
SMTP_HOST=...
SMTP_PORT=587
SMTP_USER=...
SMTP_PASSWORD=...
```

### Frontend Configuration
**Location**: `/var/www/ementech-website/current`

**Served By**: Nginx (static files)

**Build Command**: `npm run build`

**Output**: `dist/` → copied to `/var/www/ementech-website/current`

**Vite Config** (vite.config.ts):
```typescript
export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:5001',
      '/socket.io': {
        target: 'http://localhost:5001',
        ws: true
      }
    }
  }
})
```

---

## Nginx Configuration

### Site Configuration
**File**: `/etc/nginx/sites-available/ementech.conf`

**Symlink**: `/etc/nginx/sites-enabled/ementech.conf`

### Configuration Content
```nginx
# HTTP to HTTPS redirect
server {
    listen 80;
    server_name ementech.co.ke www.ementech.co.ke;
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name ementech.co.ke www.ementech.co.ke;

    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/ementech.co.ke/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ementech.co.ke/privkey.pem;

    # Frontend static files
    root /var/www/ementech-website/current;
    index index.html;

    # API proxy
    location /api/ {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Socket.IO proxy (WebSocket)
    location /socket.io/ {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Frontend fallback
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### SSL Certificates
**Provider**: Let's Encrypt

**Certificate Path**: `/etc/letsencrypt/live/ementech.co.ke/`

**Renewal**: Certbot auto-renews (cron job)

---

## Deployment Process

### Initial Deployment (Already Done)
1. **Server Setup**
   - Ubuntu server provisioned
   - User accounts created
   - Firewall configured (ports 22, 80, 443, 5001)
   - MongoDB installed/configured

2. **Nginx Setup**
   - Nginx installed
   - SSL certificates obtained (certbot)
   - Site configuration created
   - Symlinked to sites-enabled

3. **Backend Deployment**
   - Code uploaded to `/var/www/ementech-website/backend`
   - Dependencies installed: `npm install`
   - Environment variables configured: `.env`
   - PM2 process started: `pm2 start ementech-backend`

4. **Frontend Deployment**
   - Code built locally: `npm run build`
   - Build output uploaded to `/var/www/ementech-website/current`
   - Nginx reloaded: `systemctl reload nginx`

### Updating Frontend
```bash
# Local machine
cd /media/munen/muneneENT/ementech/ementech-website
npm run build

# Upload to VPS
ssh root@69.164.244.165
cd /var/www/ementech-website
mkdir -p releases/$(date +%Y%m%d-%H%M%S)
cp -r current releases/$(date +%Y%m%d-%H%M%S)/

# From local machine (in project directory)
scp -r dist/* root@69.164.244.165:/var/www/ementech-website/current/

# On VPS - Verify and reload nginx
ssh root@69.164.244.165 "ls -la /var/www/ementech-website/current && systemctl reload nginx"
```

### Updating Backend
```bash
# Upload new code
ssh root@69.164.244.165
cd /var/www/ementech-website/backend

# Pull from git or upload files
git pull origin main  # if using git
# OR upload files manually

# Install dependencies
npm install

# Restart PM2 process
pm2 restart ementech-backend

# Check logs
pm2 logs ementech-backend --lines 50
```

### Full Deployment Script
```bash
#!/bin/bash
# deploy.sh

echo "Building frontend..."
npm run build

echo "Uploading frontend to VPS..."
scp -r dist/* root@69.164.244.165:/var/www/ementech-website/current/

echo "Restarting backend..."
ssh root@69.164.244.165 "cd /var/www/ementech-website/backend && pm2 restart ementech-backend"

echo "Reloading nginx..."
ssh root@69.164.244.165 "systemctl reload nginx"

echo "Deployment complete!"
echo "Check: https://ementech.co.ke"
```

---

## PM2 Management

### Commands
```bash
# List all processes
pm2 list

# Show ementech-backend details
pm2 show ementech-backend

# View logs
pm2 logs ementech-backend
pm2 logs ementech-backend --lines 100

# Restart
pm2 restart ementech-backend

# Stop
pm2 stop ementech-backend

# Start
pm2 start /var/www/ementech-website/backend/src/server.js --name ementech-backend

# Monitor
pm2 monit
```

### PM2 Ecosystem File (Optional)
Create `ecosystem.config.js` in backend directory:
```javascript
module.exports = {
  apps: [{
    name: 'ementech-backend',
    script: './src/server.js',
    cwd: '/var/www/ementech-website/backend',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5001
    },
    error_file: '/var/log/pm2/ementech-backend-error.log',
    out_file: '/var/log/pm2/ementech-backend-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss'
  }]
}
```

Use with: `pm2 start ecosystem.config.js`

---

## Monitoring & Logs

### Application Logs
**Backend PM2 Logs**:
```bash
pm2 logs ementech-backend
pm2 logs ementech-backend --err  # Errors only
pm2 logs ementech-backend --out  # Standard output
```

**Nginx Logs**:
```bash
# Access logs
tail -f /var/log/nginx/access.log

# Error logs
tail -f /var/log/nginx/error.log

# Site-specific logs
tail -f /var/log/nginx/ementech-access.log
tail -f /var/log/nginx/ementech-error.log
```

**System Logs**:
```bash
# System journal
journalctl -u nginx -f
journalctl -u pm2-root -f

# Authentication logs
tail -f /var/log/auth.log
```

### Health Checks
```bash
# Backend health endpoint
curl https://ementech.co.ke/api/health

# Expected response
{
  "status": "healthy",
  "timestamp": "2026-01-20T...",
  "uptime": 123456.789,
  "environment": "production"
}
```

---

## Troubleshooting

### Backend Issues

**Problem**: Backend not starting
```bash
# Check PM2 status
pm2 list

# Check logs
pm2 logs ementech-backend --lines 100

# Common issues:
# 1. MongoDB connection error → Check MONGODB_URI
# 2. Port already in use → Check if port 5001 is free
# 3. Missing env vars → Check .env file exists
```

**Problem**: Database connection failed
```bash
# Verify MongoDB is running
systemctl status mongod

# Test connection string
mongosh "mongodb://..."

# Check firewall
telnet mongodb-host 27017
```

**Problem**: Email sync not working
```bash
# Check IMAP credentials
# Test IMAP connection
openssl s_client -connect IMAP_HOST:993 -crlf

# Check email service logs
pm2 logs ementech-backend | grep -i email
```

### Frontend Issues

**Problem**: Site not loading
```bash
# Check nginx is running
systemctl status nginx

# Check nginx config syntax
nginx -t

# Reload nginx
systemctl reload nginx

# Check file permissions
ls -la /var/www/ementech-website/current
```

**Problem**: API calls failing
```bash
# Check CORS configuration
# Check backend is running
curl http://localhost:5001/api/health

# Check nginx proxy
curl https://ementech.co.ke/api/health
```

**Problem**: WebSocket/Socket.IO not connecting
```bash
# Check Socket.IO proxy in nginx config
# Verify upgrade headers are set
# Test WebSocket connection
wscat -c https://ementech.co.ke/socket.io/
```

### SSL Issues

**Problem**: SSL certificate expired
```bash
# Renew certificate
certbot renew

# Reload nginx
systemctl reload nginx

# Setup auto-renewal (cron)
certbot renew --dry-run
```

**Problem**: Mixed content warnings
```bash
# Ensure all resources use HTTPS
# Check console for mixed content errors
# Update any http:// to https://
```

---

## Security Checklist

### Implemented ✅
- SSL/TLS encryption (Let's Encrypt)
- Helmet.js security headers
- CORS configured for specific origins
- Rate limiting on all endpoints
- JWT authentication
- Password hashing (bcrypt)
- Input validation (express-validator)
- SQL injection prevention (MongoDB sanitization)
- XSS protection (React escaping + helmet)

### Recommended 🔒
- [ ] Configure firewall (ufw)
  ```bash
  ufw allow 22/tcp   # SSH
  ufw allow 80/tcp   # HTTP
  ufw allow 443/tcp  # HTTPS
  ufw enable
  ```

- [ ] Setup fail2ban for SSH protection
  ```bash
  apt install fail2ban
  systemctl enable fail2ban
  ```

- [ ] Regular security updates
  ```bash
  apt update && apt upgrade -y
  ```

- [ ] MongoDB authentication
  ```bash
  # Enable auth in /etc/mongod.conf
  security:
    authorization: enabled
  ```

- [ ] Environment variables security
  - Never commit `.env` files
  - Use strong secrets (JWT_SECRET)
  - Rotate passwords regularly

- [ ] Backup strategy
  - Automated MongoDB backups
  - Backup to offsite location
  - Test restoration process

---

## Maintenance Schedule

### Daily
- Monitor PM2 process status
- Check error logs
- Verify site uptime

### Weekly
- Review analytics
- Check disk space
- Review security logs

### Monthly
- Update dependencies (npm packages)
- MongoDB backup verification
- SSL certificate check (auto-renews)
- Performance review

### Quarterly
- Security audit
- Dependency vulnerability scan
- Database optimization
- Backup restoration test

---

## Contact & Support

**Development Team**: EmenTech
**Server Location**: VPS (69.164.244.165)
**Documentation**: ARCHITECTURE.md

**Emergency Contacts**:
- SSH Access: root@69.164.244.165
- PM2 Dashboard: `pm2 monit`
- Nginx Status: `systemctl status nginx`

---

**Based On**: Actual deployed configuration, not theory

