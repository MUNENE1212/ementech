# Quick Fix Guide: Admin Email System

## Root Cause Summary
Email doesn't work on admin.ementech.co.ke because:
1. **DNS record missing** - admin.ementech.co.ke doesn't resolve
2. **No nginx config** - No server block for admin.ementech.co.ke
3. **Empty admin dashboard** - Admin directory exists but has NO code
4. **CORS blocks requests** - Backend only allows ementech.co.ke

**CRITICAL FINDING**: The email system EXISTS and WORKS on the main ementech.co.ke site! There's no need for a separate admin dashboard.

---

## RECOMMENDED SOLUTION (Fastest Path)

### Access Email via Main Site

The email system is already built and working on ementech.co.ke. You just need to deploy it.

#### Step 1: Check if Email Route Exists
```bash
curl https://ementech.co.ke/email
```

#### Step 2: If 404, Add Email Route to App.tsx

Edit `/media/munen/muneneENT/ementech/ementech-website/src/App.tsx`:

```jsx
// Import email page
import EmailInbox from './pages/EmailInbox';

// In your routes configuration:
<Route path="/email" element={<EmailInbox />} />
<Route path="/email/:folder" element={<EmailInbox />} />
```

#### Step 3: Build and Deploy
```bash
# Local machine
cd /media/munen/muneneNT/ementech/ementech-website
npm run build

# Deploy to VPS
scp -r dist/* root@69.164.244.165:/var/www/ementech-website/current/
```

#### Step 4: Access Email
Go to: `https://ementech.co.ke/email`

Login with admin credentials to access the email system.

---

## ALTERNATIVE SOLUTION (Separate Admin Dashboard)

If you really want admin.ementech.co.ke as a separate site:

### Step 1: Add DNS Record
At your domain registrar (Cloudflare, GoDaddy, etc.):

```
Type: A
Host/Name: admin
Value: 69.164.244.165
TTL: 3600
```

Wait 5-30 minutes for DNS propagation.

### Step 2: Create Nginx Configuration

SSH to VPS:
```bash
ssh root@69.164.244.165
```

Create config file:
```bash
nano /etc/nginx/sites-available/admin.ementech.co.ke.conf
```

Paste this content:
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

    # SSL certificates (get these in Step 4)
    ssl_certificate /etc/letsencrypt/live/admin.ementech.co.ke/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/admin.ementech.co.ke/privkey.pem;

    # Frontend static files
    root /var/www/admin-dashboard/current;
    index index.html;

    # API proxy to main backend
    location /api/ {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Socket.IO proxy for real-time email
    location /socket.io/ {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Frontend fallback for SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### Step 3: Enable Site
```bash
# Create symlink
ln -s /etc/nginx/sites-available/admin.ementech.co.ke.conf /etc/nginx/sites-enabled/

# Test nginx config
nginx -t

# If test passes, reload nginx
systemctl reload nginx
```

### Step 4: Obtain SSL Certificate
```bash
# Stop nginx temporarily
systemctl stop nginx

# Get certificate
certbot certonly --standalone -d admin.ementech.co.ke

# Start nginx
systemctl start nginx
```

### Step 5: Build Admin Frontend

**Option A**: Copy existing email components to admin-dashboard
```bash
# On local machine
cd /media/munen/muneneNT/ementech/ementech-website/admin-dashboard/frontend

# Copy email components from main site
cp -r ../src/pages/EmailInbox.jsx .
cp -r ../src/contexts/EmailContext.jsx .
cp -r ../src/services/emailService.js .
cp -r ../src/components/email .

# Or create a new React app with email components
# Build the admin dashboard
npm run build
```

**Option B**: Build from scratch
```bash
cd /media/munen/muneneNT/ementech/ementech-website/admin-dashboard/frontend
npm create vite@latest . -- --template react-ts
npm install
# Build your admin dashboard
npm run build
```

### Step 6: Deploy Admin Frontend
```bash
# Upload built files to VPS
scp -r admin-dashboard/frontend/dist/* root@69.164.244.165:/var/www/admin-dashboard/current/

# Set permissions
ssh root@69.164.244.165 "chown -R www-data:www-data /var/www/admin-dashboard/current"
```

### Step 7: Update CORS

SSH to VPS and update backend environment:
```bash
ssh root@69.164.244.165
nano /var/www/ementech-website/backend/.env
```

Find this line:
```bash
CORS_ORIGIN=https://ementech.co.ke
```

Change to:
```bash
CORS_ORIGIN=https://ementech.co.ke,https://admin.ementech.co.ke
```

Restart backend:
```bash
pm2 restart ementech-backend
```

### Step 8: Test
```bash
# Test domain resolves
dig admin.ementech.co.ke +short

# Test HTTPS
curl -I https://admin.ementech.co.ke

# Test API
curl https://admin.ementech.co.ke/api/health

# Test in browser
# Open https://admin.ementech.co.ke
```

---

## Verification Commands

### Check DNS
```bash
dig admin.ementech.co.ke +short
# Should return: 69.164.244.165
```

### Check Nginx
```bash
nginx -t
# Should return: syntax is ok

ls /etc/nginx/sites-enabled/ | grep admin
# Should show: admin.ementech.co.ke.conf
```

### Check SSL
```bash
ls /etc/letsencrypt/live/ | grep admin
# Should show: admin.ementech.co.ke
```

### Check Backend CORS
```bash
ssh root@69.164.244.165 "cat /var/www/ementech-website/backend/.env | grep CORS"
# Should show both domains
```

### Check PM2
```bash
ssh root@69.164.244.165 "pm2 list"
# Should show: ementech-backend (online)
```

---

## Email System Credentials

**IMAP Settings** (for receiving):
```
Host: mail.ementech.co.ke
Port: 993
User: admin@ementech.co.ke
Password: JpeQQEbwpzQDe8o5OPst
TLS: Yes
```

**SMTP Settings** (for sending):
```
Host: mail.ementech.co.ke
Port: 587
Secure: No (STARTTLS)
User: admin@ementech.co.ke
Password: JpeQQEbwpzQDe8o5OPst
```

---

## Troubleshooting

### DNS Not Resolving
```bash
# Check propagation
dig admin.ementech.co.ke

# If empty, wait 5-30 minutes
# Check DNS at registrar
# Verify A record points to 69.164.244.165
```

### Nginx 502 Bad Gateway
```bash
# Check if backend is running
pm2 list

# Check backend port
curl http://localhost:5001/api/health

# Check nginx error log
tail -f /var/log/nginx/error.log
```

### CORS Errors
```bash
# Check CORS origin
ssh root@69.164.244.165 "cat /var/www/ementech-website/backend/.env | grep CORS"

# Should have both domains:
# CORS_ORIGIN=https://ementech.co.ke,https://admin.ementech.co.ke

# Restart backend after changes
pm2 restart ementech-backend
```

### SSL Certificate Issues
```bash
# Check certificate exists
ls /etc/letsencrypt/live/admin.ementech.co.ke/

# If missing, obtain certificate
certbot --nginx -d admin.ementech.co.ke

# Check certificate expiration
certbot certificates
```

### Email Not Syncing
```bash
# Check IMAP credentials
ssh root@69.164.244.165 "cat /var/www/ementech-website/backend/.env | grep IMAP"

# Test IMAP connection (from VPS)
openssl s_client -connect mail.ementech.co.ke:993 -crlf

# Check backend logs
pm2 logs ementech-backend --lines 50
```

---

## Decision Matrix

| Factor | Main Site (ementech.co.ke/email) | Separate Admin (admin.ementech.co.ke) |
|--------|----------------------------------|----------------------------------------|
| **Time to Deploy** | 15-30 minutes | 2-4 hours |
| **Complexity** | Low (just deploy) | High (DNS, nginx, SSL, build) |
| **Maintenance** | Single codebase | Multiple deployments |
| **Cost** | None (uses existing) | None (same server) |
| **Security** | Add auth middleware | Separate admin interface |
| **Recommendation** | ✅ **RECOMMENDED** | Only if really needed |

---

## Recommended Action

**Go with Option A** - Use main site:
1. Email system already exists and is working
2. Just need to deploy frontend components
3. Add authentication to protect /email route
4. Simpler, faster, less to maintain

The architecture documentation references admin.ementech.co.ke, but it was never actually built. The email features are part of the main ementech.co.ke application.

---

**For detailed investigation findings, see**: `ADMIN_EMAIL_INVESTIGATION_REPORT.md`
