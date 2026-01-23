# Nginx API Proxy Fix - Deliverables Summary

## Problem Statement

The EmenTech backend was running successfully on port 5001, but the nginx reverse proxy configuration was broken. Multiple conflicting config files existed, and nginx wouldn't start properly. The API endpoint `https://ementech.co.ke/api/health` needed to return JSON instead of HTML, and CORS needed to be configured correctly.

## Solution Overview

A complete nginx configuration overhaul has been prepared with:
- Proper API reverse proxy to backend (port 5001)
- CORS headers configuration
- SSL/TLS security hardening
- Comprehensive automation scripts
- Detailed documentation

## Deliverables

### 1. Updated Nginx Configuration
**File**: `/media/munen/muneneENT/ementech/ementech-website/deployment/ementech-website.conf`

**Key Changes**:
- Added `/api/` location block to proxy requests to `http://localhost:5001`
- Configured proper proxy headers (Host, X-Real-IP, X-Forwarded-For, etc.)
- Added CORS headers for cross-origin API requests
- Updated Content-Security-Policy to allow WebSocket connections (wss:)
- Configured timeout and buffering settings
- Added rate limiting for API endpoints (higher than frontend)
- Disabled caching for API requests

**Features**:
- HTTP to HTTPS automatic redirect
- SSL/TLS with modern protocols (TLSv1.2, TLSv1.3)
- Security headers (HSTS, X-Frame-Options, CSP, etc.)
- Static asset caching (1 year for JS/CSS/images)
- Gzip compression
- Rate limiting
- Health check endpoints

### 2. Automated Setup Script
**File**: `/media/munen/muneneENT/ementech/ementech-website/deployment/setup-nginx-api-proxy.sh`
**Executable**: Yes (chmod +x)

**Functions**:
- Checks prerequisites (nginx, directories, etc.)
- Creates SSL directory (`/etc/nginx/ssl/`)
- Generates dhparam.pem for perfect forward secrecy (2048-bit)
- Backs up existing nginx configuration
- Deploys new configuration file
- Creates symlinks in sites-enabled/
- Removes default site if enabled
- Tests nginx configuration syntax
- Restarts nginx service
- Verifies backend connectivity
- Checks SSL certificates
- Tests API endpoints

**Usage**:
```bash
cd /media/munen/muneneENT/ementech/ementech-website/deployment
sudo ./setup-nginx-api-proxy.sh
```

### 3. Comprehensive Test Script
**File**: `/media/munen/muneneENT/ementech/ementech-website/deployment/test-nginx-setup.sh`
**Executable**: Yes (chmod +x)

**Tests Performed** (15 total):
1. Backend listening on port 5001
2. Backend health endpoint (direct)
3. PM2 backend process status
4. Nginx service status
5. Nginx configuration syntax
6. Ementech site enabled in nginx
7. SSL certificate validity and expiration
8. dhparam.pem existence
9. Nginx health endpoint
10. Nginx API proxy functionality
11. API response is valid JSON
12. CORS headers present
13. Security headers configured
14. Rate limiting configured
15. HTTP to HTTPS redirect (manual check)

**Usage**:
```bash
cd /media/munen/muneneENT/ementech/ementech-website/deployment
sudo ./test-nginx-setup.sh
```

**Output**:
- Color-coded results (PASS/WARN/FAIL)
- Detailed error messages
- Test summary with counts
- Appropriate exit codes

### 4. Quick Reference Guide
**File**: `/media/munen/muneneENT/ementech/ementech-website/deployment/NGINX_API_PROXY_SETUP.md`

**Contents**:
- Architecture diagram
- Prerequisites checklist
- Step-by-step setup instructions
- Configuration file explanations
- Troubleshooting section (common issues and solutions)
- SSL certificate management
- API debugging steps
- CORS issue resolution
- Rate limiting configuration
- Performance optimization tips
- Security checklist
- Monitoring and logging
- Backup and restore procedures
- Common commands reference
- File locations

### 5. Deployment Instructions
**File**: `/media/munen/muneneENT/ementech/ementech-website/deployment/NGINX_FIX_INSTRUCTIONS.md`

**Contents**:
- Summary of what was fixed
- Step-by-step deployment instructions
- What the configuration does (explained)
- Manual verification steps
- Quick commands reference
- Important notes and warnings

## Technical Specifications

### Architecture
```
Internet (HTTPS)
    ↓
Nginx (Port 443)
    ├─→ SSL/TLS Termination
    ├─→ Security Headers
    ├─→ Rate Limiting
    └─→ Request Routing
        ↓
    ├─→ / → React Frontend (Static files in /var/www/ementech-website/current/dist)
    └─→ /api/ → Backend API (localhost:5001)
```

### API Proxy Configuration

**Location**: `/api/`

**Proxy Target**: `http://localhost:5001`

**Headers Forwarded**:
- Host
- Upgrade (for WebSocket support)
- X-Real-IP
- X-Forwarded-For
- X-Forwarded-Proto
- X-Forwarded-Host
- X-Forwarded-Port

**CORS Configuration**:
- Allow-Origin: `https://ementech.co.ke`
- Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
- Allow-Headers: Origin, X-Requested-With, Content-Type, Accept, Authorization
- Allow-Credentials: true
- Preflight OPTIONS handling: returns 204

**Rate Limiting**:
- Zone: ementech_limit (10MB)
- Rate: 10 req/s
- Burst: 50 requests
- Connections: 20 per IP

**Timeouts**:
- Connect: 60s
- Send: 60s
- Read: 60s

**Buffering**:
- Enabled: Yes
- Buffer size: 4k
- Buffers: 8 x 4k
- Busy buffers: 8k

**Caching**:
- Disabled for API requests
- Cache-Control: no-cache, no-store, must-revalidate

## Security Features

1. **SSL/TLS Configuration**
   - Protocols: TLSv1.2, TLSv1.3
   - Strong cipher suite
   - Perfect Forward Secrecy (dhparam.pem)
   - Session cache: 50MB shared

2. **Security Headers**
   - Strict-Transport-Security (max-age=31536000)
   - X-Frame-Options: SAMEORIGIN
   - X-Content-Type-Options: nosniff
   - X-XSS-Protection: 1; mode=block
   - Content-Security-Policy
   - Referrer-Policy: strict-origin-when-cross-origin
   - Permissions-Policy: geolocation=(), microphone=(), camera=()

3. **Access Control**
   - Hidden files denied (/.)
   - Sensitive files denied (.env, .git, etc.)
   - Rate limiting per IP

4. **Operational Security**
   - Only localhost can access backend directly
   - API only accessible through nginx proxy
   - Logs for access and errors

## Performance Features

1. **HTTP/2** enabled for faster loading
2. **Gzip compression** for text-based content
3. **Static asset caching** (1 year for immutable assets)
4. **Connection keep-alive** for reduced latency
5. **Worker processes** set to auto

## Monitoring & Logging

### Log Files
- Access log: `/var/log/nginx/ementech-website-access.log`
- Error log: `/var/log/nginx/ementech-website-error.log`
- Nginx access: `/var/log/nginx/access.log`
- Nginx error: `/var/log/nginx/error.log`

### Health Check Endpoints
- Frontend: `http://localhost/health` (returns "OK")
- API: `http://localhost:5001/api/health` (returns JSON)
- API via nginx: `http://localhost/api/health` (proxied)

### PM2 Backend
- Process name: `ementech-backend`
- Port: 5001
- Check status: `pm2 status`
- View logs: `pm2 logs ementech-backend`

## Deployment Checklist

- [ ] Backend is running on port 5001 (`pm2 status`)
- [ ] Nginx is installed (`systemctl status nginx`)
- [ ] SSL certificates obtained (`certbot certificates`)
- [ ] Run setup script (`sudo ./setup-nginx-api-proxy.sh`)
- [ ] Verify configuration (`sudo nginx -t`)
- [ ] Test locally (`curl http://localhost/api/health`)
- [ ] Test externally (`curl https://ementech.co.ke/api/health`)
- [ ] Run test script (`sudo ./test-nginx-setup.sh`)
- [ ] Monitor logs for issues

## Rollback Procedure

If something goes wrong:

1. **Restore backup configuration**:
   ```bash
   sudo cp /etc/nginx/sites-available/ementech-website.conf.backup.YYYYMMDD \
           /etc/nginx/sites-available/ementech-website.conf
   sudo systemctl reload nginx
   ```

2. **Check logs**:
   ```bash
   sudo tail -f /var/log/nginx/ementech-website-error.log
   ```

3. **Verify backend**:
   ```bash
   pm2 status
   curl http://localhost:5001/api/health
   ```

## File Locations Summary

### Configuration Files
- Source: `/media/munen/muneneENT/ementech/ementech-website/deployment/ementech-website.conf`
- Active: `/etc/nginx/sites-available/ementech-website.conf`
- Symlink: `/etc/nginx/sites-enabled/ementech-website.conf`

### Scripts
- Setup: `/media/munen/muneneENT/ementech/ementech-website/deployment/setup-nginx-api-proxy.sh`
- Test: `/media/munen/muneneENT/ementech/ementech-website/deployment/test-nginx-setup.sh`

### Documentation
- Main Guide: `/media/munen/muneneENT/ementech/ementech-website/deployment/NGINX_API_PROXY_SETUP.md`
- Quick Start: `/media/munen/muneneENT/ementech/ementech-website/deployment/NGINX_FIX_INSTRUCTIONS.md`
- This Summary: `/media/munen/muneneENT/ementech/ementech-website/deployment/NGINX_DELIVERABLES.md`

### System Files
- SSL certificates: `/etc/letsencrypt/live/ementech.co.ke/`
- SSL dhparam: `/etc/nginx/ssl/dhparam.pem`
- Nginx logs: `/var/log/nginx/`

## Success Criteria

The setup is successful when:

1. ✅ Nginx starts without errors
2. ✅ SSL certificates are valid
3. ✅ `curl http://localhost:5001/api/health` returns JSON
4. ✅ `curl http://localhost/api/health` returns same JSON
5. ✅ `curl https://ementech.co.ke/api/health` returns same JSON
6. ✅ CORS headers are present in API responses
7. ✅ Security headers are present
8. ✅ Frontend loads at `https://ementech.co.ke`
9. ✅ All automated tests pass

## Support Resources

### Documentation
- Full setup guide: `NGINX_API_PROXY_SETUP.md`
- Quick start: `NGINX_FIX_INSTRUCTIONS.md`
- This summary: `NGINX_DELIVERABLES.md`

### Automation
- Setup script: `setup-nginx-api-proxy.sh`
- Test script: `test-nginx-setup.sh`

### Commands
- Test nginx: `sudo nginx -t`
- Restart nginx: `sudo systemctl restart nginx`
- Check backend: `pm2 status`
- View logs: `sudo tail -f /var/log/nginx/ementech-website-error.log`

## Next Steps

1. **Review the deliverables** listed above
2. **Run the setup script** on the VPS:
   ```bash
   cd /media/munen/muneneENT/ementech/ementech-website/deployment
   sudo ./setup-nginx-api-proxy.sh
   ```
3. **Run the test script** to verify everything:
   ```bash
   sudo ./test-nginx-setup.sh
   ```
4. **Test the API** from an external browser:
   ```
   https://ementech.co.ke/api/health
   ```
5. **Monitor logs** for the first few hours to ensure stability

---

**Prepared by**: Claude Code (DevOps/SRE Agent)
**Date**: 2026-01-20
**Status**: Ready for deployment
**VPS**: 69.164.244.165
**Domain**: ementech.co.ke
**Backend Port**: 5001
