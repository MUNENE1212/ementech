# Nginx Configuration Files Archive

This directory contains complete, production-ready nginx configuration files for deploying multiple applications on a single Interserver VPS.

## Configuration Files

### 1. Main Nginx Configuration
**File:** `nginx-main.conf`

Usage: Copy to `/etc/nginx/nginx.conf`

Main nginx configuration with:
- Worker process optimization
- HTTP/2 support
- SSL/TLS hardening
- Gzip compression
- Security settings
- Logging configuration

### 2. Ementech Website (Main Corporate)
**File:** `ementech-website.conf`

Usage: Copy to `/etc/nginx/sites-available/ementech-website.conf`

Configuration for ementech.co.ke and www.ementech.co.ke:
- HTTP to HTTPS redirect
- Static React build serving
- React Router support
- Security headers
- Rate limiting (10 req/s)
- Asset caching

### 3. Dumu Waks Frontend (React SPA)
**File:** `dumuwaks-frontend.conf`

Usage: Copy to `/etc/nginx/sites-available/dumuwaks-frontend.conf`

Configuration for app.ementech.co.ke:
- HTTP to HTTPS redirect
- React SPA with client-side routing
- API proxy to localhost:5000
- WebSocket support for Socket.io
- Rate limiting (20 req/s)
- Asset caching

### 4. Dumu Waks Backend (API Only)
**File:** `dumuwaks-backend.conf`

Usage: Copy to `/etc/nginx/sites-available/dumuwaks-backend.conf`

Configuration for api.ementech.co.ke (optional):
- HTTP to HTTPS redirect
- API-only reverse proxy
- CORS headers
- WebSocket support
- Stricter rate limiting (10 req/s)
- Preflight request handling

### 5. PM2 Ecosystem File
**File:** `ecosystem.config.js`

Usage: Copy to `/var/www/ecosystem.config.js`

PM2 configuration for managing Node.js applications:
- Dumu Waks backend (port 5000)
- Auto-restart settings
- Log management
- Process monitoring

### 6. Log Rotation Configuration
**File:** `logrotate-nginx`

Usage: Copy to `/etc/logrotate.d/nginx`

Automatic log rotation for nginx:
- Daily rotation
- 14-day retention
- Gzip compression

## Installation Steps

### Step 1: Install Prerequisites
```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx
```

### Step 2: Copy Configuration Files
```bash
# Main nginx configuration
sudo cp nginx-main.conf /etc/nginx/nginx.conf

# Server blocks
sudo cp ementech-website.conf /etc/nginx/sites-available/
sudo cp dumuwaks-frontend.conf /etc/nginx/sites-available/
sudo cp dumuwaks-backend.conf /etc/nginx/sites-available/

# Log rotation
sudo cp logrotate-nginx /etc/logrotate.d/nginx
```

### Step 3: Enable Server Blocks
```bash
# Create symbolic links
sudo ln -s /etc/nginx/sites-available/ementech-website.conf /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/dumuwaks-frontend.conf /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/dumuwaks-backend.conf /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default
```

### Step 4: Generate SSL Certificates
```bash
# Main domain
sudo certbot --nginx -d ementech.co.ke -d www.ementech.co.ke

# App subdomain
sudo certbot --nginx -d app.ementech.co.ke

# API subdomain (if using)
sudo certbot --nginx -d api.ementech.co.ke
```

### Step 5: Generate DH Parameters
```bash
sudo mkdir -p /etc/nginx/ssl
sudo openssl dhparam -out /etc/nginx/ssl/dhparam.pem 4096
sudo chmod 600 /etc/nginx/ssl/dhparam.pem
```

### Step 6: Create Log Directories
```bash
sudo mkdir -p /var/log/pm2
sudo chown $USER:$USER /var/log/pm2
```

### Step 7: Test Configuration
```bash
# Test nginx syntax
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

### Step 8: Deploy PM2 Applications
```bash
# Copy ecosystem file
sudo cp ecosystem.config.js /var/www/

# Start applications
pm2 start /var/www/ecosystem.config.js

# Save PM2 configuration
pm2 save
pm2 startup
```

### Step 9: Configure Firewall
```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### Step 10: Verify Deployment
```bash
# Check nginx status
sudo systemctl status nginx

# Check PM2 status
pm2 status

# Test websites
curl -I https://ementech.co.ke
curl -I https://app.ementech.co.ke
curl -I https://api.ementech.co.ke
```

## File Locations Reference

```
/etc/nginx/
├── nginx.conf                          # Main configuration
├── ssl/
│   └── dhparam.pem                     # Diffie-Hellman parameters
├── sites-available/
│   ├── ementech-website.conf           # Main website config
│   ├── dumuwaks-frontend.conf          # Frontend app config
│   └── dumuwaks-backend.conf           # Backend API config
└── sites-enabled/
    ├── ementech-website.conf -> ../sites-available/ementech-website.conf
    ├── dumuwaks-frontend.conf -> ../sites-available/dumuwaks-frontend.conf
    └── dumuwaks-backend.conf -> ../sites-available/dumuwaks-backend.conf

/etc/letsencrypt/live/
├── ementech.co.ke/
│   ├── fullchain.pem
│   ├── privkey.pem
│   └── chain.pem
├── app.ementech.co.ke/
│   ├── fullchain.pem
│   ├── privkey.pem
│   └── chain.pem
└── api.ementech.co.ke/
    ├── fullchain.pem
    ├── privkey.pem
    └── chain.pem

/var/www/
├── ecosystem.config.js                 # PM2 configuration
├── ementech-website/
│   └── current/dist/                   # Static React build
├── dumuwaks-frontend/
│   └── current/dist/                   # React SPA build
└── dumuwaks-backend/
    └── current/                        # Node.js backend

/var/log/
├── nginx/
│   ├── access.log
│   ├── error.log
│   ├── ementech-website-access.log
│   ├── ementech-website-error.log
│   ├── dumuwaks-frontend-access.log
│   ├── dumuwaks-frontend-error.log
│   ├── dumuwaks-backend-access.log
│   └── dumuwaks-backend-error.log
└── pm2/
    ├── dumuwaks-backend-error.log
    └── dumuwaks-backend-out.log
```

## Common Commands

```bash
# Nginx
sudo nginx -t                    # Test configuration
sudo systemctl reload nginx      # Apply changes
sudo systemctl restart nginx     # Restart service
sudo systemctl status nginx      # Check status

# PM2
pm2 start ecosystem.config.js    # Start all apps
pm2 restart all                  # Restart apps
pm2 reload all                   # Zero-downtime reload
pm2 status                       # View status
pm2 logs                         # View logs
pm2 save                         # Save process list

# SSL
sudo certbot certificates        # List certificates
sudo certbot renew               # Renew manually
sudo certbot renew --dry-run     # Test renewal

# Logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
pm2 logs
```

## Troubleshooting

### 502 Bad Gateway
- Check PM2 status: `pm2 status`
- Check backend logs: `pm2 logs dumuwaks-backend`
- Verify backend port is correct (5000)

### 404 on React Routes
- Verify `try_files` is configured in server block
- Check if build files exist in `/var/www/*/current/dist/`

### SSL Errors
- Check certificate paths in nginx config
- Renew certificate: `sudo certbot renew`
- Verify certificate exists: `ls /etc/letsencrypt/live/`

### WebSocket Connection Failures
- Ensure WebSocket headers are set
- Check proxy timeouts (should be 7d for WebSocket)
- Verify backend supports WebSocket

## Security Checklist

- [ ] SSL certificates installed and auto-renewal configured
- [ ] Firewall configured (ports 80, 443 only)
- [ ] Security headers enabled (HSTS, CSP, X-Frame-Options)
- [ ] Rate limiting configured per application
- [ ] HTTP to HTTPS redirects active
- [ ] Server tokens disabled
- [ ] Strong DH parameters generated (4096-bit)
- [ ] Regular updates configured
- [ ] Log rotation enabled
- [ ] PM2 auto-restart configured

## Performance Checklist

- [ ] HTTP/2 enabled
- [ ] Gzip compression enabled
- [ ] Static asset caching configured
- [ ] Worker processes set to 'auto'
- [ ] Keep-alive connections enabled
- [ ] Client buffer sizes optimized
- [ ] PM2 cluster mode (if needed)
- [ ] Log rotation configured

## Maintenance

### Daily
- Check application status: `pm2 status`
- Review error logs: `sudo tail -50 /var/log/nginx/error.log`

### Weekly
- Check SSL expiry: `sudo certbot certificates`
- Review disk usage: `df -h`
- Check for updates: `sudo apt update`

### Monthly
- Update system: `sudo apt upgrade -y`
- Renew SSL: `sudo certbot renew`
- Backup configs: See NGINX_REVERSE_PROXY_GUIDE.md

## Support

For detailed documentation, see: `NGINX_REVERSE_PROXY_GUIDE.md`

Official documentation:
- [Nginx Docs](https://nginx.org/en/docs/)
- [PM2 Docs](https://pm2.keymetrics.io/docs/)
- [Certbot Docs](https://certbot.eff.org/docs/)

---

**Last Updated:** January 18, 2026
