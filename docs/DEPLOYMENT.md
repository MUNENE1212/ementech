# Deployment Guide

## Server Access

```bash
ssh root@69.164.244.165
```

---

## Directory Structure

```
/var/www/
├── ementech-website/
│   ├── backend/           # Backend API (PM2: ementech-backend)
│   │   ├── src/server.js  # Entry point
│   │   ├── ecosystem.config.cjs
│   │   └── .env
│   └── current/           # Frontend build (Nginx)
├── admin-ementech/
│   └── current/           # Admin frontend
└── shared/
    └── scripts/           # Health checks, monitoring
```

---

## Deployment Commands

### Frontend Deployment

```bash
# 1. Build locally
npm run build

# 2. Upload to VPS
scp -r dist/* root@69.164.244.165:/var/www/ementech-website/current/

# 3. Reload Nginx
ssh root@69.164.244.165 "systemctl reload nginx"
```

### Backend Deployment

```bash
# SSH into server
ssh root@69.164.244.165

# Navigate to backend
cd /var/www/ementech-website/backend

# Pull changes (if using git)
git pull origin main

# Install dependencies
npm install

# Restart PM2
pm2 restart ementech-backend
```

### Full Deployment Script

```bash
#!/bin/bash
npm run build
scp -r dist/* root@69.164.244.165:/var/www/ementech-website/current/
ssh root@69.164.244.165 "cd /var/www/ementech-website/backend && pm2 restart ementech-backend && systemctl reload nginx"
echo "Deployed: https://ementech.co.ke"
```

---

## PM2 Management

```bash
pm2 list                     # List processes
pm2 logs ementech-backend    # View logs
pm2 restart ementech-backend # Restart
pm2 monit                    # Real-time monitor
pm2 show ementech-backend    # Process details
```

### Ecosystem Config

Location: `/var/www/ementech-website/backend/ecosystem.config.cjs`

```javascript
module.exports = {
  apps: [{
    name: 'ementech-backend',
    script: 'src/server.js',
    node_args: '--max-old-space-size=256',
    max_memory_restart: '300M',
    env: { NODE_ENV: 'production', PORT: 5001 }
  }]
};
```

---

## Nginx Configuration

Location: `/etc/nginx/sites-enabled/ementech.co.ke.conf`

```nginx
server {
    listen 443 ssl http2;
    server_name ementech.co.ke www.ementech.co.ke;

    ssl_certificate /etc/letsencrypt/live/ementech.co.ke/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ementech.co.ke/privkey.pem;

    root /var/www/ementech-website/current;
    index index.html;

    location /api/ {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /socket.io/ {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## SSL Certificates

Provider: Let's Encrypt (auto-renewal via Certbot)

```bash
certbot certificates          # List certificates
certbot renew --dry-run       # Test renewal
certbot renew                 # Force renewal
```

| Domain | Expiry |
|--------|--------|
| ementech.co.ke | April 18, 2026 |
| admin.ementech.co.ke | April 25, 2026 |
| api.ementech.co.ke | April 21, 2026 |
| mail.ementech.co.ke | April 21, 2026 |

---

## Environment Variables

Location: `/var/www/ementech-website/backend/.env`

```bash
PORT=5001
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
CORS_ORIGIN=https://ementech.co.ke,https://www.ementech.co.ke,https://admin.ementech.co.ke

# JWT
JWT_SECRET=<secure-secret>

# Email
IMAP_HOST=mail.ementech.co.ke
IMAP_PORT=993
IMAP_USER=admin@ementech.co.ke
IMAP_PASS=<password>
SMTP_HOST=mail.ementech.co.ke
SMTP_PORT=587
SMTP_USER=admin@ementech.co.ke
SMTP_PASS=<password>

# Sync credentials
SYNC_ADMIN_EMAIL=admin@ementech.co.ke
SYNC_ADMIN_PASSWORD=<password>
```

---

## Backups

Automated daily at 2:00 AM via `/usr/local/bin/ementech-backup.sh`

Backup location: `/var/backups/ementech/`

| Component | Retention |
|-----------|-----------|
| Mail directories | 7 daily, 4 weekly |
| PostgreSQL | 7 daily, 4 weekly |
| Configs | 7 daily, 4 weekly |

---

## Health Checks

```bash
# Backend health
curl https://ementech.co.ke/api/health

# Service status
systemctl status nginx postfix dovecot redis postgresql@16-main

# PM2 status
pm2 list
```

---

## Troubleshooting

### Backend not starting
```bash
pm2 logs ementech-backend --lines 100
# Check for: MongoDB connection, port conflicts, missing env vars
```

### Frontend not loading
```bash
nginx -t                  # Test config
systemctl status nginx    # Check status
ls -la /var/www/ementech-website/current  # Verify files
```

### Email issues
```bash
tail -f /var/log/mail.log           # Mail logs
postqueue -p                        # Check mail queue
openssl s_client -connect mail.ementech.co.ke:993  # Test IMAP
```

### SSL issues
```bash
certbot certificates    # Check status
certbot renew           # Renew if needed
```
