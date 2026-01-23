# Nginx API Proxy Configuration - Fixed and Ready

## Summary

I've successfully fixed the nginx configuration issues and created a comprehensive setup for your Ementech website with API proxy support. Here's what has been done:

## What Was Fixed

1. **Updated nginx configuration** with proper API proxy to backend (port 5001)
2. **Added CORS headers** in nginx for cross-origin requests
3. **Updated Content-Security-Policy** to allow WebSocket connections (wss:)
4. **Created automated setup script** for easy deployment
5. **Created comprehensive test script** to validate the configuration

## Files Created/Modified

### Configuration Files
- `/media/munen/muneneENT/ementech/ementech-website/deployment/ementech-website.conf`
  - Updated with `/api/` location block to proxy requests to backend on port 5001
  - Added CORS headers
  - Added proper proxy headers for backend communication

### Scripts Created
1. **setup-nginx-api-proxy.sh** - Automated setup script
   - Generates dhparam.pem for SSL
   - Deploys nginx configuration
   - Tests and restarts nginx
   - Verifies endpoints

2. **test-nginx-setup.sh** - Comprehensive testing script
   - Tests backend connectivity
   - Tests nginx configuration
   - Tests API proxy functionality
   - Tests CORS headers
   - Tests security headers

### Documentation Created
1. **NGINX_API_PROXY_SETUP.md** - Comprehensive quick reference guide
   - Step-by-step setup instructions
   - Troubleshooting guide
   - Common commands
   - Security checklist

## Deployment Instructions

### Step 1: Run the Setup Script

SSH into your VPS and run:

```bash
cd /media/munen/muneneENT/ementech/ementech-website/deployment
sudo ./setup-nginx-api-proxy.sh
```

This script will:
- Check prerequisites
- Generate dhparam.pem (takes 1-2 minutes)
- Deploy the nginx configuration
- Test the configuration
- Restart nginx
- Run health checks

### Step 2: Verify SSL Certificates

If you don't have SSL certificates yet, obtain them:

```bash
sudo certbot --nginx -d ementech.co.ke -d www.ementech.co.ke
```

### Step 3: Test the Configuration

Run the comprehensive test script:

```bash
cd /media/munen/muneneENT/ementech/ementech-website/deployment
sudo ./test-nginx-setup.sh
```

### Step 4: Verify API Endpoint Works

```bash
# Test backend directly
curl http://localhost:5001/api/health

# Test through nginx (local)
curl http://localhost/api/health

# Test through nginx (external HTTPS)
curl https://ementech.co.ke/api/health
```

Expected JSON response:
```json
{"status":"ok","timestamp":"2026-01-20T..."}
```

## What the Configuration Does

### Architecture
```
Browser (HTTPS)
    ↓
Nginx (Port 443, SSL termination)
    ↓
    ├─→ / (Static React files)
    └─→ /api/ → Backend (localhost:5001)
```

### Key Features

1. **HTTP to HTTPS Redirect**
   - All HTTP traffic automatically redirected to HTTPS

2. **API Reverse Proxy**
   - `/api/*` requests proxied to `http://localhost:5001`
   - Proper headers forwarding (Host, X-Real-IP, X-Forwarded-For, etc.)
   - WebSocket support (Upgrade header)

3. **CORS Configuration**
   - Allows requests from `https://ementech.co.ke`
   - Supports GET, POST, PUT, DELETE, OPTIONS methods
   - Handles preflight OPTIONS requests

4. **Security Headers**
   - HSTS (HTTP Strict Transport Security)
   - X-Frame-Options: SAMEORIGIN
   - X-Content-Type-Options: nosniff
   - Content-Security-Policy
   - Permissions-Policy

5. **Rate Limiting**
   - 10 req/s for frontend (burst 20)
   - Higher limits for API (burst 50)

6. **Static Asset Caching**
   - 1 year for JS, CSS, images, fonts
   - 1 hour for HTML files

7. **Gzip Compression**
   - Enabled for text, JSON, fonts, SVG

## Troubleshooting

### If Nginx Won't Start

1. **Check configuration syntax:**
   ```bash
   sudo nginx -t
   ```

2. **Check error logs:**
   ```bash
   sudo tail -f /var/log/nginx/error.log
   sudo tail -f /var/log/nginx/ementech-website-error.log
   ```

3. **Check if port 443 is available:**
   ```bash
   sudo netstat -tulpn | grep :443
   ```

### If SSL Certificates Are Missing

The nginx configuration requires SSL certificates at:
- `/etc/letsencrypt/live/ementech.co.ke/fullchain.pem`
- `/etc/letsencrypt/live/ementech.co.ke/privkey.pem`

To obtain them:
```bash
sudo certbot --nginx -d ementech.co.ke -d www.ementech.co.ke
```

### If API Returns HTML Instead of JSON

This usually means nginx is serving the React app instead of proxying to the backend.

Check:
1. Backend is running: `pm2 status`
2. Backend is accessible: `curl http://localhost:5001/api/health`
3. Nginx config has `/api/` location block
4. Location block comes *before* the `/` location block

### If CORS Errors Occur

1. Check if CORS headers are present:
   ```bash
   curl -I http://localhost/api/health
   ```

2. Look for `Access-Control-Allow-Origin` header

3. If backend also adds CORS headers, remove them from nginx to avoid duplicates

## Manual Verification Steps

### 1. Backend Health Check
```bash
curl http://localhost:5001/api/health
```
Expected: JSON response with status "ok"

### 2. Nginx Health Check
```bash
curl http://localhost/health
```
Expected: "OK"

### 3. API Proxy Test (Local)
```bash
curl http://localhost/api/health
```
Expected: Same JSON response as direct backend call

### 4. API Proxy Test (External)
```bash
curl https://ementech.co.ke/api/health
```
Expected: Same JSON response with proper headers

### 5. CORS Headers Check
```bash
curl -I https://ementech.co.ke/api/health
```
Expected: CORS headers in response

## Configuration File Locations

- **Source**: `/media/munen/muneneENT/ementech/ementech-website/deployment/ementech-website.conf`
- **Deployed to**: `/etc/nginx/sites-available/ementech-website.conf`
- **Symlinked to**: `/etc/nginx/sites-enabled/ementech-website.conf`
- **SSL certificates**: `/etc/letsencrypt/live/ementech.co.ke/`
- **SSL dhparam**: `/etc/nginx/ssl/dhparam.pem`
- **Nginx logs**: `/var/log/nginx/ementech-website-{access,error}.log`

## Next Steps

1. **Run the setup script** on the VPS
2. **Verify SSL certificates** are installed
3. **Run the test script** to validate everything
4. **Test the API endpoint** from an external browser
5. **Monitor logs** for any issues:
   ```bash
   sudo tail -f /var/log/nginx/ementech-website-error.log
   ```

## Important Notes

- The backend must be running on port 5001 before nginx starts (or nginx will show 502 Bad Gateway)
- SSL certificates are required for HTTPS to work
- The configuration assumes the React build is at `/var/www/ementech-website/current/dist`
- PM2 process name should be `ementech-backend`

## Support and Documentation

For detailed information, see:
- **Setup Guide**: `/media/munen/muneneENT/ementech/ementech-website/deployment/NGINX_API_PROXY_SETUP.md`
- **Setup Script**: `setup-nginx-api-proxy.sh`
- **Test Script**: `test-nginx-setup.sh`

## Quick Commands Reference

```bash
# Check nginx status
sudo systemctl status nginx

# Restart nginx
sudo systemctl restart nginx

# Test nginx config
sudo nginx -t

# Check backend status
pm2 status

# View backend logs
pm2 logs ementech-backend

# View nginx logs
sudo tail -f /var/log/nginx/ementech-website-error.log

# Test API endpoint
curl https://ementech.co.ke/api/health
```

---

**Configuration prepared**: 2026-01-20
**VPS**: 69.164.244.165
**Domain**: ementech.co.ke
**Backend port**: 5001
**Status**: Ready for deployment
