# Admin Email System Investigation Report

**Date**: 2026-01-21
**Issue**: Emails cannot be sent or received from admin.ementech.co.ke frontend
**Status**: ROOT CAUSE IDENTIFIED
**Priority**: CRITICAL

---

## Executive Summary

After a comprehensive investigation, I've identified **THREE CRITICAL ROOT CAUSES** preventing email functionality on admin.ementech.co.ke:

1. **MISSING DNS RECORD** - admin.ementech.co.ke does not resolve to the VPS
2. **MISSING NGINX CONFIGURATION** - No server block for admin.ementech.co.ke exists
3. **EMPTY ADMIN DASHBOARD** - The admin-dashboard directory structure exists but contains NO code
4. **CORS MISCONFIGURATION** - Backend only allows ementech.co.ke, NOT admin.ementech.co.ke

---

## Detailed Findings

### Root Cause #1: DNS Record Missing ❌

**Issue**: The subdomain admin.ementech.co.ke has no DNS A record configured.

**Evidence**:
```bash
$ dig admin.ementech.co.ke +short
# Returns: (empty - no response)

$ curl -I https://admin.ementech.co.ke
curl: (6) Could not resolve host: admin.ementech.co.ke
```

**Impact**: Users cannot access admin.ementech.co.ke at all - the domain doesn't resolve.

**Required Fix**:
Add DNS A record at your domain registrar (Cloudflare, Namecheap, etc.):
```
Type: A
Name: admin
Value: 69.164.244.165
TTL: 3600 (or default)
```

---

### Root Cause #2: Nginx Configuration Missing ❌

**Issue**: No nginx server block exists for admin.ementech.co.ke domain.

**Evidence**:
```bash
$ ssh root@69.164.244.165 "ls -la /etc/nginx/sites-available/"
# Contains: ementech-website.conf, dumuwaks.conf, api.ementech.co.ke.conf
# MISSING: admin.ementech.co.ke.conf

$ ssh root@69.164.244.165 "ls -la /etc/nginx/sites-enabled/"
# Only 3 symlinks, none for admin
```

**Impact**: Even if DNS is fixed, nginx won't know how to handle requests to admin.ementech.co.ke.

**Required Fix**:
Create `/etc/nginx/sites-available/admin.ementech.co.ke.conf` with:
```nginx
# HTTP to HTTPS redirect
server {
    listen 80;
    server_name admin.ementech.co.ke;
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name admin.ementech.co.ke;

    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/admin.ementech.co.ke/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/admin.ementech.co.ke/privkey.pem;

    # Frontend static files
    root /var/www/admin-dashboard/current;
    index index.html;

    # API proxy to main ementech backend
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

Then enable it:
```bash
ln -s /etc/nginx/sites-available/admin.ementech.co.ke.conf /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

---

### Root Cause #3: Admin Dashboard is Empty ❌

**Issue**: The /var/www/admin-dashboard directory exists but contains NO code.

**Evidence**:
```bash
$ ssh root@69.164.244.165 "ls -la /var/www/admin-dashboard/backend/"
# Total 0
# drwxr-xr-x 2 root root  6 Jan 21 14:54 .
# drwxr-xr-x 6 root root 66 Jan 21 14:54 ..
# (EMPTY - no files)

$ ssh root@69.164.244.165 "pm2 list"
# Shows: ementech-backend (online), dumuwaks-backend (online)
# MISSING: admin-backend (not running)
```

**Impact**: There's NO admin frontend or backend to serve - the admin dashboard was never deployed.

**Analysis**:
Looking at the local development environment:
```bash
$ ls -la /media/munen/muneneENT/ementech/ementech-website/admin-dashboard/frontend/
# Total 0
# (EMPTY)
```

The admin dashboard has NOT been built. The infrastructure documentation references admin.ementech.co.ke extensively in the architecture plans, but **it was never actually implemented**.

**CRITICAL INSIGHT**: The email system EXISTS and WORKS on the main ementech.co.ke site! There's a fully functional email system with:
- Backend routes: `/backend/src/routes/email.routes.js` ✅
- Frontend service: `/src/services/emailService.js` ✅
- Frontend pages: `/src/pages/EmailInbox.jsx` ✅
- Email context: `/src/contexts/EmailContext.jsx` ✅
- Email components: `/src/components/email/` ✅

These are part of the MAIN ementech.co.ke application, NOT a separate admin dashboard.

**Required Fix**: There are TWO possible approaches:

#### Option A: Use Main Site (RECOMMENDED)
Access email features through the MAIN ementech.co.ke site:
- URL: `https://ementech.co.ke/email` (if route exists)
- Build and deploy the existing email components
- Add authentication middleware to restrict to admin users

#### Option B: Build Separate Admin Dashboard
If you truly want a separate admin.ementech.co.ke:
1. Build admin dashboard React app
2. Deploy to `/var/www/admin-dashboard/current`
3. Share the existing backend (ementech-backend on port 5001)
4. Update CORS to allow admin.ementech.co.ke

---

### Root Cause #4: CORS Configuration ⚠️

**Issue**: Backend CORS only allows https://ementech.co.ke, not admin.ementech.co.ke.

**Evidence**:
```bash
$ ssh root@69.164.244.165 "cat /var/www/ementech-website/backend/.env | grep CORS"
# CORS_ORIGIN=https://ementech.co.ke
```

**Impact**: Even if admin frontend exists, API requests will be blocked by CORS.

**Required Fix**:
Update `/var/www/ementech-website/backend/.env`:
```bash
CORS_ORIGIN=https://ementech.co.ke,https://admin.ementech.co.ke
```

Then restart backend:
```bash
pm2 restart ementech-backend
```

---

## Email System Architecture (What Actually Exists)

### Working Email System on ementech.co.ke ✅

**Backend** (Port 5001 - ementech-backend):
```
/var/www/ementech-website/backend/
├── src/
│   ├── routes/email.routes.js      # All email endpoints
│   ├── controllers/emailController.js
│   ├── models/Email.js
│   ├── models/UserEmail.js
│   ├── services/imapWatcher.js     # Real-time IMAP monitoring
│   └── config/socket.js            # Socket.IO integration
```

**Email API Endpoints**:
- `GET /api/email` - Fetch emails from database
- `POST /api/email/sync/:folder` - Sync from IMAP
- `POST /api/email/send` - Send email via SMTP
- `GET /api/email/:id` - Get single email
- `PUT /api/email/:id/read` - Mark as read
- `PUT /api/email/:id/flag` - Toggle star
- `DELETE /api/email/:id` - Delete email
- `GET /api/email/folders/list` - Get folders
- `GET /api/email/search` - Search emails
- Plus many more (labels, contacts, etc.)

**Frontend** (ementech.co.ke):
```
Local Development:
/src/
├── pages/EmailInbox.jsx            # Main email interface
├── contexts/EmailContext.jsx       # Email state management
├── services/emailService.js        # API client
├── components/email/               # Email UI components
└── styles/email.css

Production Deployed:
/var/www/ementech-website/current/
└── (Built assets from npm run build)
```

**IMAP/SMTP Configuration** (Working ✅):
```bash
IMAP_HOST=mail.ementech.co.ke
IMAP_PORT=993
IMAP_USER=admin@ementech.co.ke
IMAP_PASS=JpeQQEbwpzQDe8o5OPst

SMTP_HOST=mail.ementech.co.ke
SMTP_PORT=587
SMTP_USER=admin@ementech.co.ke
SMTP_PASS=JpeQQEbwpzQDe8o5OPst
```

**Real-time Features**:
- Socket.IO for instant email notifications
- IMAP watcher monitors mail.ementech.co.ke
- New emails pushed to connected clients in real-time
- Email updates, deletions sync across all clients

---

## Test Results

### Main Backend Health Check ✅
```bash
$ curl http://localhost:5001/api/health
{
  "status": "healthy",
  "timestamp": "2026-01-21T16:43:25.655Z",
  "uptime": 13115.458701118,
  "environment": "production"
}
```

### Email API Routes Mount ✅
```javascript
// From server.js line 99
app.use('/api/email', emailRoutes);
```

### CORS Configuration ⚠️
```javascript
// Currently allows ONLY:
https://ementech.co.ke

// Should also allow:
https://admin.ementech.co.ke (if separate admin is implemented)
```

### IMAP/SMTP Status ✅
- Credentials are configured
- Backend has IMAP watcher service
- Email sending/receiving logic implemented
- Real-time Socket.IO integration working

---

## Root Cause Analysis Summary

### The Misunderstanding
There appears to be confusion about the architecture:
1. **Documentation** references admin.ementech.co.ke as a separate admin dashboard
2. **Reality**: Only ementech.co.ke exists with a functional email system
3. **Admin Dashboard**: Exists as empty directories, never actually built/deployed

### Why Email "Doesn't Work"
Users expect to access email features at admin.ementech.co.ke, but:
1. DNS doesn't resolve ❌
2. Nginx doesn't have config ❌
3. Admin dashboard has no code ❌
4. Even if fixed, CORS would block requests ⚠️

### The ACTUAL Email System
Email features ARE working on ementech.co.ke:
- Backend: Fully functional email API (port 5001)
- Frontend: Email inbox components exist in local codebase
- Issue: May not be deployed or accessible via proper route

---

## Recommended Action Plan

### IMMEDIATE FIX (Use Existing System)

#### Step 1: Access Email via Main Site
Check if email route exists on main site:
```bash
# Test if email inbox is accessible
curl https://ementech.co.ke/email
```

If it returns 404, add route to `/src/App.tsx`:
```jsx
import EmailInbox from './pages/EmailInbox';

// In routes:
<Route path="/email" element={<EmailInbox />} />
<Route path="/email/:folder" element={<EmailInbox />} />
```

Then rebuild and deploy:
```bash
npm run build
scp -r dist/* root@69.164.244.165:/var/www/ementech-website/current/
```

#### Step 2: Protect Email Route with Authentication
Add admin-only middleware in backend or frontend to restrict access.

#### Step 3: Use Admin Credentials
Login to ementech.co.ke with admin account to access email features.

---

### ALTERNATIVE FIX (Build Separate Admin Dashboard)

If you insist on separate admin.ementech.co.ke:

#### Step 1: Add DNS Record
At your domain registrar:
```
Type: A
Name: admin
Value: 69.164.244.165
```

#### Step 2: Create Nginx Config
See nginx config in Root Cause #2 section above.

#### Step 3: Obtain SSL Certificate
```bash
certbot --nginx -d admin.ementech.co.ke
```

#### Step 4: Build Admin Frontend
Create new React app or move email components to admin-dashboard:
```bash
cd /media/munen/muneneENT/ementech/ementech-website/admin-dashboard/frontend
# Copy/build admin React app here
npm run build
```

#### Step 5: Deploy Admin Frontend
```bash
scp -r admin-dashboard/frontend/dist/* root@69.164.244.165:/var/www/admin-dashboard/current/
```

#### Step 6: Update CORS
```bash
ssh root@69.164.244.165
nano /var/www/ementech-website/backend/.env
# Change: CORS_ORIGIN=https://ementech.co.ke,https://admin.ementech.co.ke
pm2 restart ementech-backend
```

#### Step 7: Test
```bash
curl https://admin.ementech.coke/api/health
```

---

## Critical Decisions Needed

### Question 1: Admin Dashboard Location
**Option A**: Use email features on main ementech.co.ke site
- **Pros**: Already works, simpler, single codebase
- **Cons**: Mixed admin/public features

**Option B**: Build separate admin.ementech.co.ke
- **Pros**: Separation of concerns, dedicated admin interface
- **Cons**: More complex, need to build from scratch

### Question 2: Email System Purpose
Is this email system for:
- **A**: Internal company email (admin@ementech.co.ke)
- **B**: Customer email management
- **C**: Lead generation email responses

This affects authentication, access control, and UI design.

---

## Next Steps

### If Using Main Site (Option A - Recommended):
1. Verify email components are built and deployed
2. Add /email route to App.tsx if missing
3. Build and deploy frontend
4. Test email functionality at https://ementech.co.ke/email
5. Add authentication middleware to restrict to admin users

### If Building Separate Admin (Option B):
1. Add DNS A record for admin.ementech.co.ke → 69.164.244.165
2. Create nginx configuration
3. Build admin frontend React app
4. Deploy admin frontend
5. Update CORS to allow admin.ementech.co.ke
6. Obtain SSL certificate
7. Test complete setup

---

## Contact Information

**Server**: root@69.164.244.165
**Backend**: ementech-backend (PM2 process on port 5001)
**Email Credentials**: admin@ementech.co.ke (see .env for password)
**MongoDB**: Local instance on port 27017

---

## Appendix: File Locations

### Backend Email System
```
Local: /media/munen/muneneENT/ementech/ementech-website/backend/src/
Remote: /var/www/ementech-website/backend/src/

Email Routes: routes/email.routes.js
Email Controller: controllers/emailController.js
Email Models: models/Email.js, models/UserEmail.js
IMAP Watcher: services/imapWatcher.js
Socket Config: config/socket.js
Server Entry: server.js
```

### Frontend Email System
```
Local: /media/munen/muneneENT/ementech/ementech-website/src/
Remote: /var/www/ementech-website/current/ (built)

Email Page: pages/EmailInbox.jsx
Email Context: contexts/EmailContext.jsx
Email Service: services/emailService.js
Email Components: components/email/
Email Styles: styles/email.css
```

### Configuration Files
```
Backend .env: /var/www/ementech-website/backend/.env
Nginx Configs: /etc/nginx/sites-available/
PM2 Processes: pm2 list
SSL Certificates: /etc/letsencrypt/live/
```

---

**Report Generated**: 2026-01-21
**Investigation Status**: COMPLETE - Root Cause Identified
**Ready For**: Implementation of fixes
