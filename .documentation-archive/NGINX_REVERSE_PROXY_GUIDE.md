# Comprehensive Nginx Reverse Proxy Configuration for Multi-Application VPS Deployment

**Last Updated:** January 18, 2026

## Executive Summary

This guide provides complete nginx configuration for hosting multiple applications on a single Interserver VPS with proper SSL/TLS, security hardening, performance optimization, and process management using PM2. The setup supports:

- **ementech.co.ke** (Main corporate website - Static React build)
- **www.ementech.co.ke** (Main corporate website - Static React build)
- **app.ementech.co.ke** (Dumu Waks fullstack application - React SPA + Node.js backend)
- **api.ementech.co.ke** (Backend API - optional separate subdomain)

**Key Recommendations:**
- Use Let's Encrypt with individual certificates for each domain (easier than wildcard for this setup)
- Implement per-domain rate limiting for DDoS protection
- Enable HTTP/2 with modern TLS 1.3 protocols
- Configure PM2 for automatic process management
- Use separate log files for each application for easier debugging

---

## Table of Contents

1. [System Architecture Overview](#system-architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Domain & DNS Configuration](#domain--dns-configuration)
4. [Application Deployment Structure](#application-deployment-structure)
5. [Nginx Installation & Basic Configuration](#nginx-installation--basic-configuration)
6. [SSL/TLS Configuration with Let's Encrypt](#ssltls-configuration-with-lets-encrypt)
7. [Server Block Configurations](#server-block-configurations)
8. [PM2 Ecosystem Configuration](#pm2-ecosystem-configuration)
9. [Performance Optimization](#performance-optimization)
10. [Security Hardening](#security-hardening)
11. [Firewall Configuration](#firewall-configuration)
12. [Monitoring & Log Management](#monitoring--log-management)
13. [Testing & Verification](#testing--verification)
14. [Troubleshooting](#troubleshooting)
15. [Maintenance & Updates](#maintenance--updates)

---

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Internet (Cloudflare DNS)               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Interserver VPS (Ubuntu)                   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Nginx (Port 80/443)                      │   │
│  │  - SSL Termination                                    │   │
│  │  - Reverse Proxy                                      │   │
│  │  - Static File Serving                                │   │
│  │  - Security Headers & Rate Limiting                   │   │
│  └──────────────────────────────────────────────────────┘   │
│                              │                                │
│          ┌───────────────────┼───────────────────┐           │
│          ▼                   ▼                   ▼           │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐     │
│  │   ementech   │   │  dumuwaks    │   │  dumuwaks    │     │
│  │   -website   │   │  -frontend   │   │  -backend    │     │
│  │  (Port 3000) │   │  (Port 3001) │   │  (Port 5000) │     │
│  │              │   │              │   │              │     │
│  │   Static     │   │   React SPA  │   │  Node.js     │     │
│  │   React      │   │              │   │  Express API │     │
│  └──────────────┘   └──────────────┘   └──────────────┘     │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              PM2 Process Manager                      │   │
│  │  - Auto-restart on failure                            │   │
│  │  - Log management                                     │   │
│  │  - Cluster mode (optional)                            │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Prerequisites

### System Requirements
- **VPS:** Interserver VPS with Ubuntu 20.04/22.04 or 24.04
- **RAM:** Minimum 2GB (4GB recommended for multiple Node.js apps)
- **Storage:** 20GB+ SSD
- **CPU:** 2+ cores

### Software Requirements
- **Node.js:** v18 LTS or v20 LTS
- **PM2:** Latest version
- **Nginx:** Latest stable version
- **Certbot:** For Let's Encrypt SSL certificates
- **Git:** For deployment

### Before You Begin
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install -y curl wget git build-essential

# Install Node.js (using NodeSource)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx

# Install Certbot
sudo apt install -y certbot python3-certbot-nginx
```

---

## Domain & DNS Configuration

### DNS Records (Configure at Your DNS Provider)

```
Type    Name                    Value                           TTL
----    ----                    -----                           ----
A       @                       YOUR_VPS_PUBLIC_IP              3600
A       www                     YOUR_VPS_PUBLIC_IP              3600
A       app                     YOUR_VPS_PUBLIC_IP              3600
A       api                     YOUR_VPS_PUBLIC_IP              3600
```

**Note:** If using Cloudflare (recommended):
- Enable **Proxy** (orange cloud) for DDoS protection
- Configure **Page Rules** if needed for caching
- Set up **SSL/TLS** to "Full (strict)" mode

### Verify DNS Propagation
```bash
# Check if DNS records are pointing to your VPS
dig ementech.co.ke +short
dig www.ementech.co.ke +short
dig app.ementech.co.ke +short
dig api.ementech.co.ke +short

# Or using nslookup
nslookup ementech.co.ke
nslookup app.ementech.co.ke
```

---

## Application Deployment Structure

### Directory Structure
```bash
/var/www/
├── ementech-website/          # Main corporate website
│   ├── current/               # Symlink to active release
│   ├── releases/              # Deployment history
│   └── shared/                # Shared files/logs
├── dumuwaks-frontend/         # Dumu Waks React frontend
│   ├── current/
│   ├── releases/
│   └── shared/
└── dumuwaks-backend/          # Dumu Waks Node.js backend
    ├── current/
    ├── releases/
    └── shared/
```

### Deployment Commands (Example)
```bash
# For ementech-website (static build)
cd /var/www/ementech-website/current
npm install
npm run build
# Built files will be in ./dist

# For dumuwaks-frontend (React SPA)
cd /var/www/dumuwaks-frontend/current
npm install
npm run build
# Built files will be in ./dist

# For dumuwaks-backend (Node.js API)
cd /var/www/dumuwaks-backend/current
npm install --production
# Application runs with PM2
```

---

## Nginx Installation & Basic Configuration

### Main Nginx Configuration
**File:** `/etc/nginx/nginx.conf`

```nginx
# /etc/nginx/nginx.conf

user www-data;
worker_processes auto;
pid /run/nginx.pid;
include /etc/nginx/modules-enabled/*.conf;

events {
    worker_connections 2048;
    use epoll;
    multi_accept on;
}

http {
    ##
    # Basic Settings
    ##
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    server_tokens off;

    # Increase buffer sizes for large requests
    client_body_buffer_size 128k;
    client_max_body_size 20M;
    client_header_buffer_size 1k;
    large_client_header_buffers 4 16k;

    ##
    # SSL Settings
    ##
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384';
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;
    ssl_stapling on;
    ssl_stapling_verify on;

    ##
    # Logging Settings
    ##
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log warn;

    ##
    # Gzip Compression
    ##
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript
               application/json application/javascript application/xml+rss
               application/rss+xml font/truetype font/opentype
               application/vnd.ms-fontobject image/svg+xml;
    gzip_disable "msie6";

    ##
    # Virtual Host Configs
    ##
    include /etc/nginx/conf.d/*.conf;
    include /etc/nginx/sites-enabled/*;
}
```

---

## SSL/TLS Configuration with Let's Encrypt

### Option 1: Individual Certificates (Recommended for this setup)

#### Certificate for Main Domain
```bash
# Obtain certificate for ementech.co.ke and www.ementech.co.ke
sudo certbot --nginx -d ementech.co.ke -d www.ementech.co.ke

# Certificate location
# /etc/letsencrypt/live/ementech.co.ke/fullchain.pem
# /etc/letsencrypt/live/ementech.co.ke/privkey.pem
```

#### Certificate for App Subdomain
```bash
# Obtain certificate for app.ementech.co.ke
sudo certbot --nginx -d app.ementech.co.ke

# Certificate location
# /etc/letsencrypt/live/app.ementech.co.ke/fullchain.pem
# /etc/letsencrypt/live/app.ementech.co.ke/privkey.pem
```

#### Certificate for API Subdomain (Optional)
```bash
# If using separate api.ementech.co.ke subdomain
sudo certbot --nginx -d api.ementech.co.ke

# Certificate location
# /etc/letsencrypt/live/api.ementech.co.ke/fullchain.pem
# /etc/letsencrypt/live/api.ementech.co.ke/privkey.pem
```

### Option 2: Wildcard Certificate (Alternative)

**Note:** Wildcard certificates require DNS validation, which needs manual intervention or DNS API access.

```bash
# Example for Cloudflare DNS
sudo apt install python3-certbot-dns-cloudflare

# Create Cloudflare API token configuration
sudo mkdir -p /secrets
sudo chmod 700 /secrets
cat > /secrets/cloudflare.ini << EOF
dns_cloudflare_api_token = YOUR_CLOUDFLARE_API_TOKEN
EOF
sudo chmod 400 /secrets/cloudflare.ini

# Obtain wildcard certificate
sudo certbot certonly --dns-cloudflare --dns-cloudflare-credentials /secrets/cloudflare.ini \
  -d "ementech.co.ke" -d "*.ementech.co.ke"
```

### Auto-Renewal Verification
```bash
# Check if renewal timer is active
sudo systemctl status certbot.timer

# Test renewal process
sudo certbot renew --dry-run

# View renewal configuration
sudo cat /etc/letsencrypt/renewal/ementech.co.ke.conf

# Renewal runs automatically twice daily
# Certificates are renewed if within 30 days of expiration
```

### Manual Renewal Command (if needed)
```bash
# Renew all certificates
sudo certbot renew

# Renew and reload nginx
sudo certbot renew --post-hook "systemctl reload nginx"
```

---

## Server Block Configurations

### 1. Ementech Main Website (Static React Build)

**File:** `/etc/nginx/sites-available/ementech-website.conf`

```nginx
# HTTP to HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name ementech.co.ke www.ementech.co.ke;

    # Redirect all HTTP requests to HTTPS
    return 301 https://$server_name$request_uri;
}

# HTTPS server block
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ementech.co.ke www.ementech.co.ke;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/ementech.co.ke/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ementech.co.ke/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/ementech.co.ke/chain.pem;
    ssl_dhparam /etc/nginx/ssl/dhparam.pem;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:; font-src 'self' data: https:; connect-src 'self' https:; frame-ancestors 'self';" always;

    # Logging
    access_log /var/log/nginx/ementech-website-access.log main;
    error_log /var/log/nginx/ementech-website-error.log warn;

    # Root directory (static React build)
    root /var/www/ementech-website/current/dist;
    index index.html;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=ementech_limit:10m rate=10r/s;
    limit_conn_zone $binary_remote_addr zone=ementech_conn:10m;

    # Main location block
    location / {
        # Apply rate limiting
        limit_req zone=ementech_limit burst=20 nodelay;
        limit_conn ementech_conn 10;

        # Try to serve file directly, fallback to index.html for React Router
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Deny access to hidden files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}
```

### 2. Dumu Waks Frontend (React SPA)

**File:** `/etc/nginx/sites-available/dumuwaks-frontend.conf`

```nginx
# HTTP to HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name app.ementech.co.ke;

    return 301 https://$server_name$request_uri;
}

# HTTPS server block
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name app.ementech.co.ke;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/app.ementech.co.ke/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.ementech.co.ke/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/app.ementech.co.ke/chain.pem;
    ssl_dhparam /etc/nginx/ssl/dhparam.pem;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Logging
    access_log /var/log/nginx/dumuwaks-frontend-access.log main;
    error_log /var/log/nginx/dumuwaks-frontend-error.log warn;

    # Root directory (React SPA build)
    root /var/www/dumuwaks-frontend/current/dist;
    index index.html;

    # Rate limiting (higher limits for app usage)
    limit_req_zone $binary_remote_addr zone=app_limit:10m rate=20r/s;
    limit_conn_zone $binary_remote_addr zone=app_conn:10m;

    # Main location block
    location / {
        limit_req zone=app_limit burst=40 nodelay;
        limit_conn app_conn 20;

        # Try to serve file directly, fallback to index.html for React Router
        try_files $uri $uri/ /index.html;
    }

    # API proxy to backend
    location /api/ {
        limit_req zone=app_limit burst=40 nodelay;

        # Proxy to backend
        proxy_pass http://localhost:5000;

        # Proxy headers
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # WebSocket support for Socket.io
    location /socket.io/ {
        limit_req zone=app_limit burst=40 nodelay;

        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;

        # WebSocket headers
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket timeouts
        proxy_connect_timeout 7d;
        proxy_send_timeout 7d;
        proxy_read_timeout 7d;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Deny access to hidden files
    location ~ /\. {
        deny all;
    }
}
```

### 3. Dumu Waks Backend API (Standalone - Optional)

**File:** `/etc/nginx/sites-available/dumuwaks-backend.conf`

```nginx
# HTTP to HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name api.ementech.co.ke;

    return 301 https://$server_name$request_uri;
}

# HTTPS server block
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.ementech.co.ke;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/api.ementech.co.ke/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.ementech.co.ke/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/api.ementech.co.ke/chain.pem;
    ssl_dhparam /etc/nginx/ssl/dhparam.pem;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # CORS Headers (configure based on your needs)
    add_header Access-Control-Allow-Origin "https://app.ementech.co.ke" always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization" always;
    add_header Access-Control-Allow-Credentials "true" always;

    # Logging
    access_log /var/log/nginx/dumuwaks-backend-access.log main;
    error_log /var/log/nginx/dumuwaks-backend-error.log warn;

    # Rate limiting (stricter for API)
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_conn_zone $binary_remote_addr zone=api_conn:10m;

    # Handle preflight requests
    if ($request_method = 'OPTIONS') {
        add_header Access-Control-Allow-Origin "https://app.ementech.co.ke";
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
        add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization";
        add_header Access-Control-Max-Age 1728000;
        add_header Content-Type 'text/plain charset=UTF-8';
        add_header Content-Length 0;
        return 204;
    }

    # API proxy to backend
    location / {
        limit_req zone=api_limit burst=20 nodelay;
        limit_conn api_conn 10;

        # Proxy to backend
        proxy_pass http://localhost:5000;

        # Proxy headers
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Buffer settings
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
        proxy_busy_buffers_size 8k;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # WebSocket support for Socket.io
    location /socket.io/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;

        # WebSocket headers
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket timeouts
        proxy_connect_timeout 7d;
        proxy_send_timeout 7d;
        proxy_read_timeout 7d;
    }
}
```

### Enable Server Blocks
```bash
# Create symbolic links to enable sites
sudo ln -s /etc/nginx/sites-available/ementech-website.conf /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/dumuwaks-frontend.conf /etc/nginx/sites-enabled/

# Only if using separate API subdomain
sudo ln -s /etc/nginx/sites-available/dumuwaks-backend.conf /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test nginx configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

### Generate Strong DH Parameters
```bash
# Create SSL directory
sudo mkdir -p /etc/nginx/ssl

# Generate DH parameters (this takes time)
sudo openssl dhparam -out /etc/nginx/ssl/dhparam.pem 4096

# Set permissions
sudo chmod 600 /etc/nginx/ssl/dhparam.pem
```

---

## PM2 Ecosystem Configuration

### PM2 Ecosystem File
**File:** `/var/www/ecosystem.config.js`

```javascript
// /var/www/ecosystem.config.js

module.exports = {
  apps: [
    // Dumu Waks Backend
    {
      name: 'dumuwaks-backend',
      script: './server/index.js',
      cwd: '/var/www/dumuwaks-backend/current',
      instances: 1, // Use 'max' for cluster mode
      exec_mode: 'fork', // Use 'cluster' for multiple instances
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      error_file: '/var/log/pm2/dumuwaks-backend-error.log',
      out_file: '/var/log/pm2/dumuwaks-backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      min_uptime: '10s',
      max_restarts: 10
    }
  ],
  deploy: {
    production: {
      user: 'node-user',
      host: 'ementech.co.ke',
      ref: 'origin/main',
      repo: 'git@github.com:your-username/your-repo.git',
      path: '/var/www/dumuwaks-backend',
      'post-deploy': 'npm install --production && pm2 reload ecosystem.config.js --env production'
    }
  }
};
```

### PM2 Commands
```bash
# Create log directory
sudo mkdir -p /var/log/pm2
sudo chown $USER:$USER /var/log/pm2

# Start applications
pm2 start /var/www/ecosystem.config.js

# Save PM2 process list
pm2 save

# Setup PM2 to start on system boot
pm2 startup
# Follow the instructions shown

# View status
pm2 status

# View logs
pm2 logs

# Monitor applications
pm2 monit

# Restart application
pm2 restart dumuwaks-backend

# Stop application
pm2 stop dumuwaks-backend

# Delete application
pm2 delete dumuwaks-backend

# Reload (zero-downtime reload)
pm2 reload dumuwaks-backend
```

---

## Performance Optimization

### 1. HTTP/2 Configuration

HTTP/2 is enabled with the `http2` directive in the listen directive:

```nginx
listen 443 ssl http2;
```

**Benefits:**
- Multiplexing: Multiple requests over single connection
- Server push: Proactively send resources to client
- Header compression: Reduced overhead
- Binary protocol: More efficient parsing

### 2. Gzip Compression

Already configured in main nginx.conf. Test with:
```bash
curl -H "Accept-Encoding: gzip" -I https://ementech.co.ke
```

### 3. Brotli Compression (Optional, Better than Gzip)

**Install Brotli module:**
```bash
sudo apt install -y libnginx-mod-http-brotli
```

**Add to nginx.conf:**
```nginx
http {
    # Brotli Compression
    brotli on;
    brotli_comp_level 6;
    brotli_types text/plain text/css text/xml text/javascript
               application/json application/javascript application/xml+rss
               application/rss+xml font/truetype font/opentype
               application/vnd.ms-fontobject image/svg+xml;
}
```

### 4. Caching Configuration

#### Browser Caching
```nginx
# Static assets - long cache
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# HTML files - shorter cache
location ~* \.html$ {
    expires 1h;
    add_header Cache-Control "public, must-revalidate";
}
```

#### Nginx FastCGI Cache (for dynamic content)
```nginx
# Add to http block in nginx.conf
fastcgi_cache_path /var/cache/nginx/fastcgi levels=1:2 keys_zone=fastcgi_cache:100m inactive=60m max_size=1g;
fastcgi_cache_key "$scheme$request_method$host$request_uri";
```

### 5. Worker Process Optimization

```nginx
# In /etc/nginx/nginx.conf
worker_processes auto; # Matches number of CPU cores
worker_connections 2048; # Increase if needed
multi_accept on; # Accept multiple connections at once
```

### 6. Buffer Optimization

```nginx
# In /etc/nginx/nginx.conf
client_body_buffer_size 128k;
client_max_body_size 20M;
client_header_buffer_size 1k;
large_client_header_buffers 4 16k;

# For proxy locations
proxy_buffering on;
proxy_buffer_size 4k;
proxy_buffers 8 4k;
proxy_busy_buffers_size 8k;
```

### 7. Keep-Alive Configuration

```nginx
# In /etc/nginx/nginx.conf
keepalive_timeout 65;
keepalive_requests 100;

# For upstream connections
upstream backend {
    server localhost:5000;
    keepalive 32;
}
```

---

## Security Hardening

### 1. Rate Limiting

Per-application rate limiting is already configured in server blocks above.

**Test rate limiting:**
```bash
# Send 100 requests quickly
for i in {1..100}; do curl https://ementech.co.ke; done
```

### 2. IP Whitelisting/Blacklisting

```nginx
# Add to server block or http context

# Whitelist specific IPs
allow 192.168.1.0/24;
allow 10.0.0.0/8;
deny all;

# Blacklist specific IPs
deny 1.2.3.4;
deny 5.6.7.0/24;
allow all;
```

### 3. Security Headers

All security headers are included in server blocks above. Test with:
```bash
curl -I https://ementech.co.ke | grep -E "Strict|X-Frame|X-Content|X-XSS|Referrer|Content-Security"
```

### 4. Prevent Common Attacks

#### SQL Injection Protection
```nginx
# Add to server block
location ~* "(eval\()" {
    deny all;
}
```

#### XSS Protection
```nginx
# Add to server block
location ~* "<script|javascript:" {
    deny all;
}
```

#### File Upload Protection
```nginx
# Limit upload size
client_max_body_size 20M;

# Prevent execution of uploaded files
location ~* \.(php|jsp|cgi|asp|sh|pl)$ {
    deny all;
}
```

### 5. DDoS Protection

```nginx
# Add to http block in nginx.conf
limit_req_zone $binary_remote_addr zone=general_limit:10m rate=10r/s;
limit_conn_zone $binary_remote_addr zone=general_conn:10m;

# Apply to server blocks
limit_req zone=general_limit burst=20 nodelay;
limit_conn general_conn 10;
```

### 6. Fail2Ban Integration (Advanced)

```bash
# Install Fail2Ban
sudo apt install fail2ban

# Create nginx filter
sudo nano /etc/fail2ban/filter.d/nginx-reqlimit.conf

# Content:
[Definition]
failregex = limiting requests, excess:.* by zone.*client: <HOST>
ignoreregex =
```

---

## Firewall Configuration

### UFW (Uncomplicated Firewall)

```bash
# Allow SSH
sudo ufw allow OpenSSH

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status verbose
```

### IPTables (Alternative)

```bash
# Allow established connections
sudo iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT

# Allow SSH
sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT

# Allow HTTP/HTTPS
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT

# Allow localhost
sudo iptables -A INPUT -i lo -j ACCEPT

# Drop everything else
sudo iptables -A INPUT -j DROP

# Save rules
sudo iptables-save > /etc/iptables/rules.v4
```

### InterServer VPS Security Panel

If InterServer provides a security panel:
1. Login to InterServer control panel
2. Navigate to firewall/security settings
3. Allow ports: 22 (SSH), 80 (HTTP), 443 (HTTPS)
4. Block all other ports
5. Enable DDoS protection if available

---

## Monitoring & Log Management

### 1. Log Rotation

**File:** `/etc/logrotate.d/nginx`

```
/var/log/nginx/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
    sharedscripts
    prerotate
        if [ -d /etc/logrotate.d/httpd-prerotate ]; then \
            run-parts /etc/logrotate.d/httpd-prerotate; \
        fi
    endscript
    postrotate
        invoke-rc.d nginx rotate >/dev/null 2>&1 || true
    endscript
}
```

### 2. PM2 Log Rotation

```bash
# Install PM2 log rotation module
pm2 install pm2-logrotate

# Configure
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
```

### 3. Log Monitoring

```bash
# View nginx error logs
sudo tail -f /var/log/nginx/error.log

# View specific application logs
sudo tail -f /var/log/nginx/ementech-website-error.log

# View PM2 logs
pm2 logs

# Search logs for errors
grep "error" /var/log/nginx/error.log

# View real-time access logs
sudo tail -f /var/log/nginx/access.log
```

### 4. Monitoring Tools

**Install Node.js monitoring:**
```bash
pm2 install pm2-server-monit
```

**Basic monitoring commands:**
```bash
# System resources
htop

# Nginx status
sudo systemctl status nginx

# PM2 status
pm2 status

# Check disk usage
df -h

# Check memory usage
free -m
```

---

## Testing & Verification

### 1. Nginx Configuration Test
```bash
# Test nginx configuration
sudo nginx -t

# Expected output:
# nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### 2. SSL Certificate Test
```bash
# Check SSL certificate
openssl s_client -connect ementech.co.ke:443 -servername ementech.co.uk

# Online SSL test: https://www.ssllabs.com/ssltest/
```

### 3. HTTP/2 Test
```bash
# Check if HTTP/2 is enabled
nghttp -nv https://ementech.co.ke

# Or online: https://tools.keycdn.com/http2-test
```

### 4. Security Headers Test
```bash
# Check security headers
curl -I https://ementech.co.ke

# Online test: https://securityheaders.com/
```

### 5. Performance Test
```bash
# Using Apache Bench
sudo apt install apache2-utils
ab -n 100 -c 10 https://ementech.co.ke/

# Online test: https://tools.pingdom.com/
```

### 6. React Router Test
```bash
# Test direct route access
curl -I https://app.ementech.co.ke/dashboard
curl -I https://app.ementech.co.ke/profile
# Should return 200 OK, not 404
```

### 7. WebSocket Test
```bash
# Test WebSocket connection
wscat -c wss://app.ementech.co.ke/socket.io/

# Install wscat if needed
sudo npm install -g wscat
```

### 8. DNS Resolution Test
```bash
# Check if domains resolve correctly
dig ementech.co.ke +short
dig www.ementech.co.ke +short
dig app.ementech.co.ke +short
dig api.ementech.co.ke +short
```

---

## Troubleshooting

### Common Issues and Solutions

#### 1. 502 Bad Gateway
**Problem:** Nginx can't connect to backend
**Solutions:**
- Check if PM2 application is running: `pm2 status`
- Check if backend port is correct (5000)
- Check backend logs: `pm2 logs dumuwaks-backend`
- Verify firewall allows localhost connections

#### 2. 404 Not Found on React Routes
**Problem:** Refreshing a React route shows 404
**Solution:** Ensure `try_files` is configured correctly:
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

#### 3. SSL Certificate Errors
**Problem:** Browser shows SSL warning
**Solutions:**
- Check certificate path in nginx config
- Renew certificate: `sudo certbot renew`
- Verify certificate exists: `ls -la /etc/letsencrypt/live/`

#### 4. WebSocket Connection Fails
**Problem:** Socket.io can't connect
**Solutions:**
- Ensure WebSocket headers are set correctly
- Check if backend supports WebSocket
- Increase proxy timeouts for WebSocket
- Verify no firewall blocking WebSocket

#### 5. Rate Limiting Too Aggressive
**Problem:** Legitimate users blocked
**Solution:** Adjust rate limits:
```nginx
limit_req zone=app_limit burst=60 nodelay;
```

#### 6. High Memory Usage
**Problem:** Nginx or Node.js using too much memory
**Solutions:**
- Adjust `worker_processes` in nginx.conf
- Limit PM2 app memory: `max_memory_restart: '1G'`
- Enable swap space if needed

#### 7. Nginx Won't Start
**Problem:** Nginx fails to start
**Solutions:**
```bash
# Check syntax errors
sudo nginx -t

# View error logs
sudo journalctl -u nginx -n 50

# Check if port is already in use
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :443
```

#### 8. Permission Denied Errors
**Problem:** Nginx can't read files
**Solutions:**
```bash
# Check file permissions
ls -la /var/www/ementech-website/current/dist

# Fix permissions
sudo chown -R www-data:www-data /var/www/
sudo chmod -R 755 /var/www/
```

### Diagnostic Commands

```bash
# Check nginx status
sudo systemctl status nginx

# Restart nginx
sudo systemctl restart nginx

# Reload nginx (zero downtime)
sudo systemctl reload nginx

# Check PM2 status
pm2 status

# Check system resources
htop

# View recent logs
sudo journalctl -xe

# Check port bindings
sudo netstat -tulpn

# Check DNS resolution
nslookup ementech.co.ke

# Test from local machine
curl -I https://ementech.co.ke
```

---

## Maintenance & Updates

### Daily Tasks
```bash
# Check application status
pm2 status

# Check nginx status
sudo systemctl status nginx

# Review error logs
sudo tail -50 /var/log/nginx/error.log
```

### Weekly Tasks
```bash
# Check SSL certificate expiry
sudo certbot certificates

# Check disk usage
df -h

# Check for security updates
sudo apt update
sudo apt list --upgradable

# Review PM2 logs
pm2 logs --lines 100
```

### Monthly Tasks
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Renew SSL certificates manually (if needed)
sudo certbot renew --post-hook "systemctl reload nginx"

# Clean old logs
sudo find /var/log -name "*.gz" -mtime +30 -delete

# Backup nginx configuration
sudo tar -czf nginx-backup-$(date +%Y%m%d).tar.gz /etc/nginx/

# Review and optimize configuration
sudo nginx -t
```

### Backup Strategy

**Configuration Backup:**
```bash
#!/bin/bash
# backup-configs.sh
DATE=$(date +%Y%m%d)
BACKUP_DIR="/backups/configs"

mkdir -p $BACKUP_DIR

# Backup nginx configs
sudo tar -czf $BACKUP_DIR/nginx-$DATE.tar.gz /etc/nginx/

# Backup PM2 configs
tar -czf $BACKUP_DIR/pm2-$DATE.tar.gz ~/.pm2/

# Backup Let's Encrypt
sudo tar -czf $BACKUP_DIR/letsencrypt-$DATE.tar.gz /etc/letsencrypt/

# Keep last 30 days
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
```

### Update Process

**Update Nginx:**
```bash
sudo apt update
sudo apt install --only-upgrade nginx
sudo nginx -t
sudo systemctl reload nginx
```

**Update Node.js:**
```bash
# Check current version
node -v

# Update using NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Restart PM2 applications
pm2 restart all
```

**Update PM2:**
```bash
sudo npm install -g pm2@latest
pm2 update
```

---

## Additional Resources

### Official Documentation
- [Nginx Official Documentation](https://nginx.org/en/docs/)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Certbot Documentation](https://certbot.eff.org/docs/)

### Testing Tools
- [SSL Labs Server Test](https://www.ssllabs.com/ssltest/)
- [Security Headers Analyzer](https://securityheaders.com/)
- [HTTP/2 Test](https://tools.keycdn.com/http2-test)
- [WebPageTest](https://www.webpagetest.org/)
- [GTmetrix](https://gtmetrix.com/)

### Configuration Examples
- [Nginx Reverse Proxy Examples](https://www.nginx.com/resources/wiki/start/topics/examples/reverseproxycachingexample/)
- [PM2 Ecosystem File Examples](https://pm2.keymetrics.io/docs/usage/application-declaration/)
- [Let's Encrypt Community](https://community.letsencrypt.org/)

### Performance Tuning
- [Nginx Performance Tuning](https://www.nginx.com/blog/tuning-nginx/)
- [PM2 Performance Optimization](https://pm2.keymetrics.io/docs/usage/cluster-mode/)
- [Node.js Performance Best Practices](https://nodejs.org/en/docs/guides/simple-profiling/)

### Security Resources
- [OWASP Nginx Security](https://cheatsheetseries.owasp.org/cheatsheets/Nginx_Hardening_Cheat_Sheet.html)
- [Mozilla SSL Configuration Generator](https://ssl-config.mozilla.org/)
- [CSP Evaluator](https://csp-evaluator.withgoogle.com/)

---

## Quick Reference Commands

```bash
# Nginx
sudo nginx -t                    # Test configuration
sudo systemctl reload nginx      # Reload config
sudo systemctl restart nginx     # Restart service
sudo systemctl status nginx      # Check status

# PM2
pm2 start ecosystem.config.js    # Start apps
pm2 restart all                  # Restart apps
pm2 reload all                   # Zero-downtime reload
pm2 status                       # Check status
pm2 logs                         # View logs
pm2 monit                        # Monitor
pm2 save                         # Save process list
pm2 startup                      # Start on boot

# SSL/Certificates
sudo certbot certificates        # List certificates
sudo certbot renew               # Renew certificates
sudo certbot renew --dry-run     # Test renewal

# Logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
pm2 logs

# Firewall
sudo ufw status                  # Check status
sudo ufw allow 80/tcp           # Allow HTTP
sudo ufw allow 443/tcp          # Allow HTTPS
```

---

## Conclusion

This comprehensive guide provides a production-ready nginx configuration for hosting multiple applications on a single Interserver VPS. The setup includes:

- **Multiple domain/subdomain support** with proper routing
- **SSL/TLS encryption** with automatic certificate renewal
- **Security hardening** with rate limiting, security headers, and DDoS protection
- **Performance optimization** with HTTP/2, compression, and caching
- **Process management** with PM2 for automatic restarts
- **Monitoring and logging** for easy troubleshooting

**Next Steps:**
1. Deploy applications to `/var/www/` directories
2. Configure DNS records to point to your VPS
3. Obtain SSL certificates with Certbot
4. Enable server blocks in nginx
5. Start applications with PM2
6. Test all functionality
7. Monitor and maintain regularly

**Support:**
If you encounter issues, refer to the troubleshooting section or consult the official documentation links provided.

---

**Last Updated:** January 18, 2026
