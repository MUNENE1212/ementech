# Nginx API Proxy Setup - Quick Reference Guide

## Overview

This guide provides step-by-step instructions for setting up and troubleshooting the nginx reverse proxy configuration for Ementech's website and API.

## Architecture

```
Internet (HTTPS)
    ↓
Nginx (443) → SSL Termination
    ↓
    ├─→ / → React Frontend (Static files)
    └─→ /api/ → Backend API (Port 5001)
```

## Prerequisites

1. **Backend running on port 5001** (PM2 process: ementech-backend)
2. **SSL certificates** from Let's Encrypt for ementech.co.ke
3. **Nginx installed** on the VPS
4. **Root/sudo access** to modify nginx configuration

## Quick Setup

### 1. Run the Setup Script

```bash
cd /media/munen/muneneENT/ementech/ementech-website/deployment
sudo ./setup-nginx-api-proxy.sh
```

This script will:
- Generate dhparam.pem for SSL security
- Deploy the nginx configuration
- Test the configuration
- Restart nginx
- Verify endpoints

### 2. Verify SSL Certificates

If SSL certificates don't exist, obtain them:

```bash
sudo certbot --nginx -d ementech.co.ke -d www.ementech.co.ke
```

### 3. Test the Configuration

```bash
# Test nginx configuration syntax
sudo nginx -t

# Check nginx status
sudo systemctl status nginx

# Test backend directly
curl http://localhost:5001/api/health

# Test API through nginx (HTTP)
curl http://localhost/api/health

# Test API through nginx (HTTPS)
curl https://ementech.co.ke/api/health
```

## Configuration Files

### Main Configuration
- **Location**: `/etc/nginx/sites-available/ementech-website.conf`
- **Source**: `/media/munen/muneneENT/ementech/ementech-website/deployment/ementech-website.conf`

### Key Features

1. **HTTP to HTTPS redirect**
   - All HTTP requests automatically redirected to HTTPS

2. **API Proxy Location Block**
   ```nginx
   location /api/ {
       proxy_pass http://localhost:5001;
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
       # ... additional headers
   }
   ```

3. **CORS Headers**
   - Added in nginx for backend API calls
   - Allows: GET, POST, PUT, DELETE, OPTIONS
   - Supports credentials and authorization headers

4. **Security Headers**
   - HSTS (HTTP Strict Transport Security)
   - X-Frame-Options, X-Content-Type-Options
   - Content-Security-Policy

5. **Rate Limiting**
   - 10 requests/second for frontend
   - Higher limits for API endpoints

6. **Static Asset Caching**
   - 1 year for JS, CSS, images, fonts
   - 1 hour for HTML files

## Troubleshooting

### Nginx Won't Start

#### 1. Check Configuration Syntax
```bash
sudo nginx -t
```

#### 2. Check Error Logs
```bash
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/ementech-website-error.log
```

#### 3. Check for Port Conflicts
```bash
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :443
sudo netstat -tulpn | grep :5001
```

### SSL Certificate Issues

#### 1. Check Certificate Status
```bash
sudo certbot certificates
```

#### 2. Renew Certificates
```bash
sudo certbot renew
sudo systemctl reload nginx
```

#### 3. Obtain New Certificates
```bash
sudo certbot --nginx -d ementech.co.ke -d www.ementech.co.ke
```

### API Not Responding

#### 1. Check Backend Status
```bash
pm2 status
pm2 logs ementech-backend
```

#### 2. Test Backend Directly
```bash
curl http://localhost:5001/api/health
```

Expected response:
```json
{"status":"ok","timestamp":"2026-01-20..."}
```

#### 3. Check Nginx Proxy
```bash
# Test through nginx
curl -v http://localhost/api/health

# Test from external
curl -v https://ementech.co.ke/api/health
```

#### 4. Verify Backend is Listening
```bash
sudo netstat -tulpn | grep :5001
```

Expected output:
```
tcp        0      0 127.0.0.1:5001          0.0.0.0:*               LISTEN      12345/node
```

### CORS Issues

If you see CORS errors in the browser:

1. **Check if CORS is enabled in backend**
   - The nginx config adds CORS headers
   - Backend should also handle CORS or not duplicate headers

2. **Test CORS Preflight**
   ```bash
   curl -X OPTIONS -H "Origin: https://ementech.co.ke" \
        -H "Access-Control-Request-Method: GET" \
        -v https://ementech.co.ke/api/health
   ```

3. **Verify Headers**
   ```bash
   curl -I https://ementech.co.ke/api/health
   ```

### Rate Limiting Issues

If you're getting rate limited:

1. **Check rate limit logs**
   ```bash
   sudo grep "limiting" /var/log/nginx/ementech-website-error.log
   ```

2. **Adjust limits in config**
   - Edit `/etc/nginx/sites-available/ementech-website.conf`
   - Modify `limit_req_zone` and `limit_conn_zone` values
   - Reload nginx: `sudo systemctl reload nginx`

## Common Commands

### Nginx Management
```bash
# Start/Stop/Restart
sudo systemctl start nginx
sudo systemctl stop nginx
sudo systemctl restart nginx
sudo systemctl reload nginx  # Reload config without downtime

# Enable/Disable on boot
sudo systemctl enable nginx
sudo systemctl disable nginx

# Check status
sudo systemctl status nginx
```

### Configuration Management
```bash
# Test configuration
sudo nginx -t

# View active configuration
sudo nginx -T

# Reload after changes
sudo systemctl reload nginx

# View logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/ementech-website-access.log
sudo tail -f /var/log/nginx/ementech-website-error.log
```

### Backend Management
```bash
# Start backend
pm2 start ementech-backend

# Stop backend
pm2 stop ementech-backend

# Restart backend
pm2 restart ementech-backend

# View logs
pm2 logs ementech-backend

# Check status
pm2 status
```

## Manual Configuration Steps

If the setup script fails, follow these manual steps:

### 1. Create SSL Directory and dhparam
```bash
sudo mkdir -p /etc/nginx/ssl
sudo openssl dhparam -out /etc/nginx/ssl/dhparam.pem 2048
sudo chmod 600 /etc/nginx/ssl/dhparam.pem
```

### 2. Deploy Configuration
```bash
sudo cp /media/munen/muneneENT/ementech/ementech-website/deployment/ementech-website.conf \
     /etc/nginx/sites-available/

sudo ln -s /etc/nginx/sites-available/ementech-website.conf \
           /etc/nginx/sites-enabled/

sudo rm -f /etc/nginx/sites-enabled/default
```

### 3. Test and Reload
```bash
sudo nginx -t
sudo systemctl restart nginx
```

### 4. Verify
```bash
curl http://localhost/api/health
curl https://ementech.co.ke/api/health
```

## Performance Optimization

### 1. Enable Nginx Caching (Optional)

Add to `http {}` block in `/etc/nginx/nginx.conf`:

```nginx
# Proxy cache configuration
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=100m inactive=60m;

# In location /api/ block, add:
proxy_cache api_cache;
proxy_cache_valid 200 5m;
proxy_cache_bypass $http_cache_control;
add_header X-Cache-Status $upstream_cache_status;
```

### 2. Enable Gzip Compression

Already enabled in the configuration for:
- Text files (HTML, CSS, JS, XML)
- JSON
- Fonts
- SVG images

### 3. HTTP/2

Already enabled in the configuration for better performance.

## Security Checklist

- [ ] SSL certificates are valid and not expired
- [ ] HTTPS redirect is working
- [ ] Security headers are present (use: `curl -I https://ementech.co.ke`)
- [ ] Rate limiting is configured
- [ ] Hidden files are denied access
- [ ] Sensitive files (.env, .git) are denied access
- [ ] Backend only listens on localhost (port 5001)
- [ ] Firewall allows ports 80, 443 only
- [ ] dhparam.pem exists for perfect forward secrecy

## Monitoring

### Log Locations
- Nginx access: `/var/log/nginx/ementech-website-access.log`
- Nginx error: `/var/log/nginx/ementech-website-error.log`
- Backend logs: `pm2 logs ementech-backend`

### Health Checks
```bash
# Nginx health endpoint
curl https://ementech.co.ke/health

# API health endpoint
curl https://ementech.co.ke/api/health

# Backend health directly
curl http://localhost:5001/api/health
```

## Backup and Restore

### Backup Configuration
```bash
sudo cp /etc/nginx/sites-available/ementech-website.conf \
        /etc/nginx/sites-available/ementech-website.conf.backup.$(date +%Y%m%d)
```

### Restore Configuration
```bash
sudo cp /etc/nginx/sites-available/ementech-website.conf.backup.YYYYMMDD \
        /etc/nginx/sites-available/ementech-website.conf
sudo systemctl reload nginx
```

## Getting Help

If you encounter issues:

1. Check the logs: `/var/log/nginx/ementech-website-error.log`
2. Verify backend is running: `pm2 status`
3. Test nginx configuration: `sudo nginx -t`
4. Check SSL certificates: `sudo certbot certificates`

## File Locations

- Nginx config source: `/media/munen/muneneENT/ementech/ementech-website/deployment/ementech-website.conf`
- Nginx setup script: `/media/munen/muneneENT/ementech/ementech-website/deployment/setup-nginx-api-proxy.sh`
- Active nginx config: `/etc/nginx/sites-available/ementech-website.conf`
- SSL certificates: `/etc/letsencrypt/live/ementech.co.ke/`
- SSL dhparam: `/etc/nginx/ssl/dhparam.pem`
- Nginx logs: `/var/log/nginx/`

---

**Last Updated**: 2026-01-20
**VPS**: 69.164.244.165
**Domain**: ementech.co.ke
**Backend Port**: 5001
