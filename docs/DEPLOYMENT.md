# Deployment Guide

## Server Access

```bash
ssh root@69.164.244.165
```

---

## Directory Structure

```
/var/www/
├── ementech-website/      # Main website deployment (frontend build + backend)
│   ├── backend/           # Backend API (PM2: ementech-backend)
│   │   ├── src/server.js  # Entry point
│   │   ├── ecosystem.config.cjs
│   │   └── .env
│   ├── index.html        # React app entry
│   ├── assets/           # Built JS/CSS
│   └── ...
├── admin-ementech/        # Admin dashboard
│   └── ...
└── shared/                # Shared scripts
    └── scripts/
```

**Important:** The nginx `root` points to `/var/www/ementech-website/` (not `current/` subdirectory).

---

## Deployment Commands

### Frontend Deployment

```bash
# 1. Build locally
npm run build

# 2. Upload to VPS (correct path)
rsync -av --delete dist/ root@69.164.244.165:/var/www/ementech-website/

# 3. Verify deployment
curl -s -o /dev/null -w '%{http_code}' https://ementech.co.ke/
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

**Main Config:** `/etc/nginx/sites-enabled/default`

```nginx
server {
    listen 80;
    server_name ementech.co.ke www.ementech.co.ke;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ementech.co.ke www.ementech.co.ke;

    ssl_certificate /etc/letsencrypt/live/ementech.co.ke/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ementech.co.ke/privkey.pem;

    # IMPORTANT: Root points to deployment directory, NOT current/
    root /var/www/ementech-website;
    index index.html;

    # API proxy
    location /api/ {
        proxy_pass http://[::1]:5001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Socket.IO proxy
    location /socket.io/ {
        proxy_pass http://[::1]:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Frontend SPA
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

**After config changes:**
```bash
nginx -t                    # Test configuration
systemctl reload nginx    # Apply changes
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

### Frontend not loading / 500 errors
```bash
# Check nginx config path (should be /var/www/ementech-website, NOT /var/www/ementech-website/current)
grep "root " /etc/nginx/sites-enabled/default

# Test and reload nginx
nginx -t && systemctl reload nginx

# Verify files are deployed
ls -la /var/www/ementech-website/

# Check nginx error logs
tail -30 /var/log/nginx/error.log
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
