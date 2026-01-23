# Multi-Application VPS Infrastructure Architecture

**Document Version**: 1.0
**Last Updated**: 2026-01-21
**Author**: Architecture Agent
**Status**: Design Complete - Ready for Implementation

---

## Executive Summary

This document defines the comprehensive infrastructure architecture for hosting multiple production applications on a single Ubuntu 22.04 VPS (IP: 69.164.244.165). The architecture supports secure multi-tenancy, isolated application environments, centralized monitoring, and automated deployment capabilities.

### Hosted Applications

1. **EmenTech Website** (ementech.co.ke)
   - Corporate website with IMAP email system
   - Frontend: React 19 + Vite
   - Backend: Node.js + Express (Port 5001)
   - Database: MongoDB Atlas (cloud)
   - Status: ✅ Production Deployed

2. **Dumuwaks** (dumuwaks.ementech.co.ke)
   - Kenyan Job Marketplace
   - Frontend: React 18 + TypeScript
   - Backend: Node.js + Express (Port 5000)
   - Database: MongoDB Atlas (cloud)
   - Status: 🚧 Backend Deployed, Frontend Pending

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Directory Structure](#directory-structure)
3. [Network Architecture](#network-architecture)
4. [Application Configuration](#application-configuration)
5. [SSL Certificate Management](#ssl-certificate-management)
6. [Process Management (PM2)](#process-management-pm2)
7. [Security Hardening](#security-hardening)
8. [Monitoring & Logging](#monitoring--logging)
9. [Backup Strategy](#backup-strategy)
10. [Deployment Automation](#deployment-automation)
11. [Scaling Considerations](#scaling-considerations)
12. [Disaster Recovery](#disaster-recovery)

---

## Architecture Overview

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Internet/Cloud                           │
└────────────────────────────┬────────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │   DNS (Cloud)   │
                    │  - ementech.co.ke
                    │  - dumuwaks.ementech.co.ke
                    └────────┬────────┘
                             │
                    ┌────────▼───────────────────────────┐
                    │         VPS (69.164.244.165)       │
                    │         Ubuntu 22.04 LTS           │
                    │         mail.ementech.co.ke        │
                    └────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌───────▼────────┐   ┌────────▼─────────┐   ┌──────▼───────┐
│  UFW Firewall  │   │     Nginx        │   │   Fail2ban   │
│  (Port 22,80,  │   │  Reverse Proxy   │   │   (SSH/HTTP) │
│   443,5000,    │   │  - SSL Termination│   │              │
│   5001,3001)   │   │  - Load Balancing│   │              │
└────────────────┘   └────────┬─────────┘   └──────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌───────▼───────────┐ ┌───────▼──────────┐ ┌──────▼──────────┐
│   Ementech Site   │ │   Dumuwaks App   │ │  Admin Dashboard│
│   (ementech.co.ke)│ │  (dumuwaks.      │ │  (admin.        │
│                   │ │   ementech.co.ke)│ │   ementech.co.ke)│
├───────────────────┤ ├──────────────────┤ ├─────────────────┤
│ Frontend: React   │ │ Frontend: React  │ │ Frontend: React │
│ Build: /var/www/  │ │ Build: /var/www/ │ │ Build: /var/www/│
│ ementech/current  │ │ dumuwaks/current │ │ admin/current   │
├───────────────────┤ ├──────────────────┤ ├─────────────────┤
│ Backend: Node.js  │ │ Backend: Node.js │ │ Backend: Node.js│
│ Port: 5001        │ │ Port: 5000       │ │ Port: 3001      │
│ PM2: ementech-    │ │ PM2: dumuwaks-   │ │ PM2: admin-     │
│      backend      │ │      backend     │ │      backend    │
├───────────────────┤ ├──────────────────┤ ├─────────────────┤
│ Socket.IO: Real-  │ │ Socket.IO: Jobs  │ │ Socket.IO:      │
│      time Email   │ │      & Booking   │ │ Monitoring      │
└─────────┬─────────┘ └─────────┬────────┘ └────────┬────────┘
          │                     │                     │
          └─────────────────────┼─────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │   MongoDB Atlas     │
                    │   (Cloud Database)  │
                    │   - Shared Cluster  │
                    │   - Database per    │
                    │     application     │
                    └─────────────────────┘
```

### Architecture Principles

1. **Isolation**: Each application has its own directory structure, configuration, and PM2 process
2. **Security**: Centralized SSL, firewall rules, rate limiting, and authentication
3. **Scalability**: Architecture supports horizontal scaling when needed
4. **Maintainability**: Standardized deployment patterns and monitoring
5. **Observability**: Centralized logging, health checks, and metrics

---

## Directory Structure

### Standardized Application Layout

```
/var/www/
├── ementech-website/              # Ementech Corporate Website
│   ├── backend/                   # Backend application
│   │   ├── src/                   # Source code
│   │   ├── tests/                 # Test files
│   │   ├── logs/                  # Application logs
│   │   ├── uploads/               # User uploads (if any)
│   │   ├── .env                   # Environment variables
│   │   ├── package.json
│   │   └── ecosystem.config.js    # PM2 configuration
│   ├── current/                   # Frontend build (served by nginx)
│   │   ├── index.html
│   │   └── assets/
│   ├── frontend/                  # Source code (local only)
│   ├── releases/                  # Deployment history
│   │   ├── 20260121-120000/
│   │   └── 20260120-150000/
│   └── shared/                    # Shared assets
│       └── uploads/
│
├── dumuwaks/                      # Dumuwaks Job Marketplace
│   ├── backend/                   # Backend application
│   │   ├── src/
│   │   ├── tests/
│   │   ├── logs/
│   │   ├── uploads/               # Job images, documents
│   │   ├── .env
│   │   ├── package.json
│   │   └── ecosystem.config.js
│   ├── current/                   # Frontend build
│   │   ├── index.html
│   │   └── assets/
│   ├── frontend/                  # Source code (local only)
│   ├── releases/
│   └── shared/
│       └── uploads/
│
├── admin-dashboard/               # Admin Monitoring Dashboard
│   ├── backend/
│   │   ├── src/
│   │   ├── logs/
│   │   ├── .env
│   │   ├── package.json
│   │   └── ecosystem.config.js
│   ├── current/
│   ├── frontend/
│   └── releases/
│
└── shared/                        # Shared resources
    ├── scripts/                   # Common deployment scripts
    │   ├── deploy.sh
    │   ├── backup.sh
    │   ├── health-check.sh
    │   └── ssl-renew.sh
    ├── logs/                      # Centralized logs
    │   ├── nginx/
    │   ├── pm2/
    │   └── system/
    ├── backups/                   # Backup storage
    │   ├── mongodb/
    │   ├── files/
    │   └── configs/
    └── ssl/                       # SSL certificates (symlinks)
        └── letsencrypt/
```

### Directory Permissions

```bash
# Application directories
/var/www/*/          # owner: www-data, group: www-data, 755
/var/www/*/backend/  # owner: deployer, group: www-data, 750
/var/www/*/current/  # owner: www-data, group: www-data, 755
/var/www/*/logs/     # owner: deployer, group: www-data, 770
/var/www/*/uploads/  # owner: www-data, group: www-data, 775
/var/www/shared/     # owner: root, group: www-data, 750
```

---

## Network Architecture

### Port Allocation

| Port | Service        | Application        | Purpose                           |
|------|----------------|--------------------|-----------------------------------|
| 22   | SSH            | System             | Secure remote access              |
| 80   | HTTP           | Nginx              | Redirect to HTTPS                 |
| 443  | HTTPS          | Nginx              | Main web traffic                  |
| 5000 | Node.js API    | Dumuwaks Backend   | Dumuwaks REST API                 |
| 5001 | Node.js API    | Ementech Backend   | Ementech REST API                 |
| 3001 | Node.js API    | Admin Backend      | Admin Dashboard API               |
| 27017| MongoDB        | (Not exposed)      | Cloud only, no local exposure     |

### DNS Configuration

**Primary Domain**: ementech.co.ke

**Subdomains**:
```
ementech.co.ke              → 69.164.244.165 (A record)
www.ementech.co.ke          → 69.164.244.165 (CNAME to ementech.co.ke)
dumuwaks.ementech.co.ke     → 69.164.244.165 (A record)
app.dumuwaks.ementech.co.ke → 69.164.244.165 (CNAME to dumuwaks.ementech.co.ke)
api.dumuwaks.ementech.co.ke → 69.164.244.165 (CNAME to dumuwaks.ementech.co.ke)
admin.ementech.co.ke        → 69.164.244.165 (A record)
mail.ementech.co.ke        → 69.164.244.165 (A record - VPS hostname)
```

### Nginx Multi-Domain Configuration

**Structure**:
```
/etc/nginx/
├── nginx.conf                      # Main configuration
├── conf.d/
│   ├── security.conf               # Security headers
│   ├── rate-limit.conf             # Rate limiting rules
│   └── ssl.conf                    # SSL configuration
└── sites-available/
    ├── ementech.co.ke.conf         # Ementech website
    ├── dumuwaks.ementech.co.ke.conf # Dumuwaks app
    └── admin.ementech.co.ke.conf   # Admin dashboard
```

---

## Application Configuration

### Ementech Website Configuration

**Domain**: https://ementech.co.ke

**Frontend**:
- Build output: `/var/www/ementech-website/current`
- Served by: Nginx (static files)
- Technology: React 19 + Vite
- Build command: `npm run build`

**Backend**:
- Location: `/var/www/ementech-website/backend`
- Port: 5001
- PM2 name: `ementech-backend`
- Technology: Node.js + Express + Socket.IO
- Health check: `https://ementech.co.ke/api/health`

**Environment Variables** (`.env`):
```bash
PORT=5001
NODE_ENV=production
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/ementech?retryWrites=true&w=majority
CORS_ORIGIN=https://ementech.co.ke,https://www.ementech.co.ke
JWT_SECRET=<strong-secret-key>
JWT_EXPIRE=7d

# IMAP Email
IMAP_HOST=mail.ementech.co.ke
IMAP_PORT=993
IMAP_USER=info@ementech.co.ke
IMAP_PASSWORD=<email-password>
IMAP_TLS=true

# SMTP Email
SMTP_HOST=mail.ementech.co.ke
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=info@ementech.co.ke
SMTP_PASSWORD=<email-password>

# OpenAI (Optional)
OPENAI_API_KEY=<optional-api-key>
```

### Dumuwaks Application Configuration

**Domain**: https://dumuwaks.ementech.co.ke

**Frontend**:
- Build output: `/var/www/dumuwaks/current`
- Served by: Nginx (static files)
- Technology: React 18 + TypeScript
- Build command: `npm run build`

**Backend**:
- Location: `/var/www/dumuwaks/backend`
- Port: 5000
- PM2 name: `dumuwaks-backend`
- Technology: Node.js + Express + Socket.IO
- Health check: `https://dumuwaks.ementech.co.ke/api/health`

**Environment Variables** (`.env`):
```bash
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/dumuwaks?retryWrites=true&w=majority
CORS_ORIGIN=https://dumuwaks.ementech.co.ke,https://app.dumuwaks.ementech.co.ke
JWT_SECRET=<strong-secret-key>
JWT_EXPIRE=7d

# M-Pesa Integration
MPESA_CONSUMER_KEY=<mpesa-key>
MPESA_CONSUMER_SECRET=<mpesa-secret>
MPESA_PASSKEY=<mpesa-passkey>
MPESA_SHORTCODE=<shortcode>

# SMTP (Transactional emails)
SMTP_HOST=mail.ementech.co.ke
SMTP_PORT=587
SMTP_USER=noreply@dumuwaks.co.ke
SMTP_PASSWORD=<email-password>
```

### Admin Dashboard Configuration

**Domain**: https://admin.ementech.co.ke

**Frontend**:
- Build output: `/var/www/admin-dashboard/current`
- Served by: Nginx (static files)
- Technology: React 18 + TypeScript
- Build command: `npm run build`

**Backend**:
- Location: `/var/www/admin-dashboard/backend`
- Port: 3001
- PM2 name: `admin-backend`
- Technology: Node.js + Express + Socket.IO
- Health check: `https://admin.ementech.co.ke/api/health`

**Environment Variables** (`.env`):
```bash
PORT=3001
NODE_ENV=production
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/admin?retryWrites=true&w=majority
CORS_ORIGIN=https://admin.ementech.co.ke
JWT_SECRET=<strong-secret-key>
JWT_EXPIRE=24h

# Monitoring credentials
MONITORING_USER=admin
MONITORING_PASSWORD=<strong-password>
```

---

## SSL Certificate Management

### SSL Strategy

**Provider**: Let's Encrypt (Certbot)

**Certificate Types**:
1. **Multi-Domain Certificate** (SAN certificate)
   - Covers: ementech.co.ke, www.ementech.co.ke, mail.ementech.co.ke
   - Path: `/etc/letsencrypt/live/ementech.co.ke/`

2. **Wildcard Certificate** (Future consideration)
   - Covers: *.ementech.co.ke
   - Useful if many subdomains are needed

### Certificate Acquisition

**Initial Certificate** (already obtained for ementech.co.ke):
```bash
# Standard certificate
certbot --nginx -d ementech.co.ke -d www.ementech.co.ke

# Dumuwaks subdomain
certbot --nginx -d dumuwaks.ementech.co.ke

# Admin subdomain
certbot --nginx -d admin.ementech.co.ke
```

**Alternative: Single Certificate with Multiple SANs**:
```bash
certbot --nginx \
  -d ementech.co.ke \
  -d www.ementech.co.ke \
  -d mail.ementech.co.ke \
  -d dumuwaks.ementech.co.ke \
  -d app.dumuwaks.ementech.co.ke \
  -d api.dumuwaks.ementech.co.ke \
  -d admin.ementech.co.ke
```

### Auto-Renewal Configuration

**Cron Job** (automatic):
```bash
# /etc/cron.d/certbot
0 */12 * * * root test -x /usr/bin/certbot -a ! -d /run/systemd/system && perl -e 'sleep int(rand(3600))' && certbot -q renew --deploy-hook "systemctl reload nginx"
```

**Manual Renewal**:
```bash
certbot renew --dry-run  # Test renewal
certbot renew            # Force renewal
systemctl reload nginx
```

### SSL Configuration

**File**: `/etc/nginx/conf.d/ssl.conf`
```nginx
# SSL Configuration
ssl_session_timeout 1d;
ssl_session_cache shared:SSL:50m;
ssl_session_tickets off;

# Modern SSL configuration
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
ssl_prefer_server_ciphers off;

# OCSP Stapling
ssl_stapling on;
ssl_stapling_verify on;

# Trusted certificates
ssl_trusted_certificate /etc/letsencrypt/live/ementech.co.ke/chain.pem;

resolver 8.8.8.8 8.8.4.4 valid=300s;
resolver_timeout 5s;
```

---

## Process Management (PM2)

### PM2 Ecosystem Configuration

**File**: `/var/www/shared/pm2/ecosystem.config.js`
```javascript
module.exports = {
  apps: [
    {
      name: 'ementech-backend',
      script: './src/server.js',
      cwd: '/var/www/ementech-website/backend',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 5001
      },
      error_file: '/var/log/pm2/ementech-backend-error.log',
      out_file: '/var/log/pm2/ementech-backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000
    },
    {
      name: 'dumuwaks-backend',
      script: './src/server.js',
      cwd: '/var/www/dumuwaks/backend',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      error_file: '/var/log/pm2/dumuwaks-backend-error.log',
      out_file: '/var/log/pm2/dumuwaks-backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000
    },
    {
      name: 'admin-backend',
      script: './src/server.js',
      cwd: '/var/www/admin-dashboard/backend',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: '/var/log/pm2/admin-backend-error.log',
      out_file: '/var/log/pm2/admin-backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000
    }
  ]
};
```

### PM2 Commands

**Startup & Management**:
```bash
# Start all applications
pm2 start /var/www/shared/pm2/ecosystem.config.js

# Start specific application
pm2 start ecosystem.config.js --only ementech-backend

# Restart applications
pm2 restart all
pm2 restart ementech-backend

# Stop applications
pm2 stop all
pm2 stop dumuwaks-backend

# Delete from PM2
pm2 delete all

# Monitor
pm2 monit

# View logs
pm2 logs
pm2 logs ementech-backend --lines 100
pm2 logs dumuwaks-backend --err

# List processes
pm2 list
pm2 show ementech-backend
```

**Systemd Integration**:
```bash
# Save current process list
pm2 save

# Generate startup script
pm2 startup systemd
# (copy and paste the output command)

# Enable PM2 on boot
systemctl enable pm2-root

# Check status
systemctl status pm2-root
```

---

## Security Hardening

### Firewall Configuration (UFW)

**Rules**:
```bash
# Reset UFW to defaults
ufw --force reset

# Default policies
ufw default deny incoming
ufw default allow outgoing

# Allow SSH (rate limited)
ufw limit 22/tcp

# Allow HTTP/HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Allow application ports (local only, not exposed to internet)
# Commented out - these are proxied through nginx
# ufw allow 5000/tcp
# ufw allow 5001/tcp
# ufw allow 3001/tcp

# Enable firewall
ufw --force enable

# Check status
ufw status numbered
```

**UFW Application Config**:
```bash
# /etc/ufw/applications.d/ementech-server
[EmenTech]
title=EmenTech Multi-App Server
description=Web server with multiple Node.js applications
ports=80/tcp|443/tcp
```

### Fail2Ban Configuration

**SSH Protection** (`/etc/fail2ban/jail.local`):
```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5
destemail = admin@ementech.co.ke
sendername = Fail2Ban
action = %(action_mwl)s

[sshd]
enabled = true
port = 22
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 7200

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 10
```

### Security Headers

**File**: `/etc/nginx/conf.d/security.conf`
```nginx
# Security Headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline' 'unsafe-eval'" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

# Remove server version
server_tokens off;

# Hide nginx version
more_clear_headers Server;
```

### Rate Limiting

**File**: `/etc/nginx/conf.d/rate-limit.conf`
```nginx
# Rate limiting zones
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=login_limit:10m rate=5r/m;
limit_req_zone $binary_remote_addr zone=upload_limit:10m rate=2r/s;

limit_conn_zone $binary_remote_addr zone=conn_limit:10m;

# Apply to API routes
limit_req zone=api_limit burst=20 nodelay;
limit_conn conn_limit 10;
```

### SSH Hardening

**File**: `/etc/ssh/sshd_config`
```bash
# Disable root login
PermitRootLogin no

# Disable password authentication (use keys only)
PasswordAuthentication no
PubkeyAuthentication yes

# Disable empty passwords
PermitEmptyPasswords no

# Limit users
AllowUsers deployer

# Change default port (optional)
Port 2222

# Restart SSH
systemctl restart sshd
```

---

## Monitoring & Logging

### Centralized Logging Structure

```
/var/log/
├── nginx/
│   ├── access.log              # All access logs
│   ├── error.log               # All error logs
│   ├── ementech.access.log     # Ementech specific
│   ├── ementech.error.log
│   ├── dumuwaks.access.log     # Dumuwaks specific
│   ├── dumuwaks.error.log
│   └── admin.access.log        # Admin specific
├── pm2/
│   ├── ementech-backend-error.log
│   ├── ementech-backend-out.log
│   ├── dumuwaks-backend-error.log
│   ├── dumuwaks-backend-out.log
│   └── combined.log
└── applications/
    ├── ementech/
    │   ├── app.log
    │   ├── email-sync.log
    │   └── errors.log
    ├── dumuwaks/
    │   ├── app.log
    │   ├── payments.log
    │   └── errors.log
    └── admin/
        ├── app.log
        └── monitoring.log
```

### Log Rotation

**File**: `/etc/logrotate.d/ementech-apps`
```
/var/log/pm2/*.log
/var/log/applications/*/*.log
{
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}

/var/log/nginx/*.log
{
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    create 0640 www-data adm
    sharedscripts
    postrotate
        [ -f /var/run/nginx.pid ] && kill -USR1 `cat /var/run/nginx.pid`
    endscript
}
```

### Application Monitoring

**Health Check Endpoints**:

Each backend should implement:
```javascript
// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    memory: process.memoryUsage(),
    version: require('./package.json').version
  });
});
```

**Monitoring Script** (`/var/www/shared/scripts/health-check.sh`):
```bash
#!/bin/bash
# Health check script for all applications

APPS=(
  "ementech-backend:5001"
  "dumuwaks-backend:5000"
  "admin-backend:3001"
)

for app in "${APPS[@]}"; do
  name="${app%%:*}"
  port="${app##*:}"

  if curl -f http://localhost:$port/api/health > /dev/null 2>&1; then
    echo "✅ $name is healthy"
  else
    echo "❌ $name is unhealthy - restarting..."
    pm2 restart $name
    # Send alert (email, Slack, etc.)
  fi
done
```

**Cron Job** (every 5 minutes):
```bash
*/5 * * * * /var/www/shared/scripts/health-check.sh >> /var/log/applications/health-check.log 2>&1
```

### Metrics Collection

**PM2 Plus** (Optional):
```bash
pm2 link <public-key> <secret-key>
```

**Custom Metrics** (implement in each app):
```javascript
// Express middleware for metrics
app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(JSON.stringify({
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: duration,
      timestamp: new Date().toISOString()
    }));
  });

  next();
});
```

---

## Backup Strategy

### Backup Schedule

**Daily Backups**:
- MongoDB databases (automated backups via Atlas)
- Application configuration files
- Environment variables (encrypted)
- SSL certificates

**Weekly Backups**:
- User uploads (images, documents)
- Log files
- Release archives

**Monthly Backups**:
- Complete VPS snapshot (via VPS provider)
- Off-site backup to cloud storage (S3, Wasabi)

### Backup Automation

**Script**: `/var/www/shared/scripts/backup.sh`
```bash
#!/bin/bash
# Comprehensive backup script

BACKUP_DIR="/var/www/shared/backups"
DATE=$(date +%Y%m%d-%H%M%S)
RETENTION_DAYS=30

# Create backup directory
mkdir -p "$BACKUP_DIR/$DATE"

# Backup MongoDB databases
mongodump --uri="$MONGODB_URI" --out="$BACKUP_DIR/$DATE/mongodb"

# Backup application files
tar -czf "$BACKUP_DIR/$DATE/uploads.tar.gz" /var/www/*/shared/uploads

# Backup configurations
tar -czf "$BACKUP_DIR/$DATE/configs.tar.gz" \
  /etc/nginx \
  /var/www/*/backend/.env \
  /var/www/shared/pm2

# Backup PM2 process list
pm2 save --force
cp ~/.pm2/dump.pm2 "$BACKUP_DIR/$DATE/pm2-dump.pm2"

# Encrypt sensitive backups
gpg --encrypt --recipient admin@ementech.co.ke "$BACKUP_DIR/$DATE/configs.tar.gz"

# Upload to off-site storage (optional)
# aws s3 sync "$BACKUP_DIR/$DATE" s3://ementech-backups/$DATE

# Clean old backups
find "$BACKUP_DIR" -type d -mtime +$RETENTION_DAYS -exec rm -rf {} \;

echo "Backup completed: $DATE"
```

**Cron Job** (daily at 2 AM):
```bash
0 2 * * * /var/www/shared/scripts/backup.sh >> /var/log/applications/backup.log 2>&1
```

### MongoDB Atlas Backup

**Atlas Configuration** (recommended):
- Enable automated backups (daily)
- Point-in-time recovery (72 hours)
- Continuous cloud backup (snapshot every 4 hours)
- Retention: 7 days (free tier), 30 days (paid)

**Manual Backup**:
```bash
mongodump --uri="mongodb+srv://user:pass@cluster.mongodb.net/ementech" --out=/backups/mongodb
mongodump --uri="mongodb+srv://user:pass@cluster.mongodb.net/dumuwaks" --out=/backups/mongodb
```

---

## Deployment Automation

### Zero-Downtime Deployment Strategy

**Process**:
1. Build new version locally
2. Upload to new release directory
3. Test new version
4. Switch symlink atomically
5. Reload nginx
6. Monitor for errors
7. Rollback if needed

**Deployment Script**: `/var/www/shared/scripts/deploy.sh`
```bash
#!/bin/bash
# Generic deployment script for all applications

set -e

APP_NAME=$1
BUILD_DIR=$2

if [ -z "$APP_NAME" ] || [ -z "$BUILD_DIR" ]; then
  echo "Usage: $0 <app-name> <build-dir>"
  exit 1
fi

APP_DIR="/var/www/$APP_NAME"
RELEASE_DIR="$APP_DIR/releases/$(date +%Y%m%d-%H%M%S)"
CURRENT_DIR="$APP_DIR/current"

echo "Deploying $APP_NAME..."

# Create release directory
mkdir -p "$RELEASE_DIR"

# Copy files
echo "Copying files..."
cp -r "$BUILD_DIR"/* "$RELEASE_DIR/"

# Set permissions
chown -R www-data:www-data "$RELEASE_DIR"
chmod -R 755 "$RELEASE_DIR"

# Update current symlink
echo "Updating symlink..."
ln -sfn "$RELEASE_DIR" "$CURRENT_DIR"

# Restart backend if exists
if [ -d "$APP_DIR/backend" ]; then
  echo "Restarting backend..."
  pm2 restart "${APP_NAME}-backend"
fi

# Reload nginx
echo "Reloading nginx..."
nginx -t && systemctl reload nginx

echo "Deployment complete!"

# Cleanup old releases (keep last 5)
find "$APP_DIR/releases" -type d -name "20*" | sort -r | tail -n +6 | xargs rm -rf
```

**Usage**:
```bash
./deploy.sh ementech-website ./dist
./deploy.sh dumuwaks ./dist
./deploy.sh admin-dashboard ./dist
```

### Environment Management

**Environment Template**: `/var/www/shared/templates/.env.template`
```bash
# Copy to new application
cp /var/www/shared/templates/.env.template /var/www/$APP_NAME/backend/.env

# Edit with secure values
nano /var/www/$APP_NAME/backend/.env

# Secure permissions
chmod 640 /var/www/$APP_NAME/backend/.env
chown deployer:www-data /var/www/$APP_NAME/backend/.env
```

### Git-Based Deployment (Optional)

**Setup**:
```bash
# On VPS
cd /var/www/ementech-website/backend
git init
git remote add origin https://github.com/your-repo/backend.git
git pull origin main

# Deploy
git pull origin main
npm install --production
pm2 restart ementech-backend
```

---

## Scaling Considerations

### Vertical Scaling (Current VPS)

**Current Resources**:
- CPU: [Check current]
- RAM: [Check current]
- Storage: [Check current]

**Recommendations**:
- Minimum: 2 CPU cores, 4GB RAM
- Recommended: 4 CPU cores, 8GB RAM
- Storage: 50GB+ SSD

### Horizontal Scaling (Future)

**When to Scale**:
- CPU usage > 80% sustained
- RAM usage > 85% sustained
- Response time > 2s average
- Database connection pool exhausted

**Scaling Options**:

1. **Load Balancer + Multiple VPS**:
   ```
   VPS 1 (Load Balancer) → Nginx reverse proxy
                            ├─→ VPS 2 (EmenTech)
                            ├─→ VPS 3 (Dumuwaks)
                            └─→ VPS 4 (Admin)
   ```

2. **Database Sharding**:
   - Separate MongoDB clusters per application
   - Read replicas for improved performance

3. **CDN for Static Assets**:
   - CloudFlare, AWS CloudFront
   - Serve images, CSS, JS from CDN

4. **Caching Layer**:
   - Redis for session storage
   - Memcached for query caching

### Caching Strategy

**Redis Setup** (optional):
```bash
# Install Redis
apt install redis-server

# Configure
vim /etc/redis/redis.conf
# bind 127.0.0.1
# requirepass <strong-password>

# Start
systemctl start redis-server
systemctl enable redis-server
```

**Application Integration**:
```javascript
const redis = require('redis');
const client = redis.createClient({
  host: 'localhost',
  port: 6379,
  password: process.env.REDIS_PASSWORD
});

// Cache middleware
app.use(async (req, res, next) => {
  const key = req.originalUrl;
  const cached = await client.get(key);

  if (cached) {
    return res.send(JSON.parse(cached));
  }

  res.sendResponse = res.send;
  res.send = (body) => {
    client.set(key, JSON.stringify(body), 'EX', 300); // 5 min
    res.sendResponse(body);
  };

  next();
});
```

---

## Disaster Recovery

### Recovery Procedures

**1. Application Crash**:
```bash
# Check PM2 status
pm2 list

# Restart if stopped
pm2 restart all

# Check logs
pm2 logs --lines 100
```

**2. Nginx Failure**:
```bash
# Check status
systemctl status nginx

# Restart
systemctl restart nginx

# Check configuration
nginx -t

# View logs
tail -f /var/log/nginx/error.log
```

**3. Database Connection Lost**:
```bash
# Check MongoDB Atlas status
# https://cloud.mongodb.com/

# Test connection from VPS
mongosh "mongodb+srv://cluster.mongodb.net/ementech"

# Restart applications
pm2 restart all
```

**4. SSL Certificate Expired**:
```bash
# Renew certificate
certbot renew

# Reload nginx
systemctl reload nginx
```

**5. Full VPS Recovery**:
1. Provision new VPS
2. Install dependencies (Node.js, Nginx, PM2)
3. Restore SSL certificates from backup
4. Restore application files from backup
5. Restore MongoDB from Atlas backup
6. Update DNS records
7. Test all applications
8. Switch traffic to new VPS

### RTO/RPO Targets

**Recovery Time Objective (RTO)**:
- Application restart: 5 minutes
- Database failover: 15 minutes
- Full VPS recovery: 2 hours

**Recovery Point Objective (RPO)**:
- Data loss tolerance: 5 minutes (for non-critical data)
- Critical transactions: Real-time (via Atlas)
- User uploads: 24 hours (daily backup)

---

## Next Steps

For implementation, proceed to:
1. [Deployment Operations Guide](.agent-workspace/handoffs/to-deployment-ops/)
2. [Security Hardening Checklist](SECURITY_HARDENING.md)
3. [Monitoring Setup Guide](MONITORING_SETUP.md)
4. [Troubleshooting Guide](TROUBLESHOOTING.md)

---

**Document Status**: ✅ Architecture Design Complete
**Ready For**: Implementation by Deployment-Operations Agent
**Priority**: High
**Estimated Implementation Time**: 4-6 hours
