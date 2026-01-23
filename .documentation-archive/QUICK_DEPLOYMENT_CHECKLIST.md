# EmenTech Website - Quick Deployment Checklist

**Date:** January 20, 2026
**Status:** Ready for Production
**Version:** 1.0.0

---

## Pre-Deployment Checklist

### 1. Security Actions (CRITICAL) ⚠️

- [ ] **Change all founder passwords immediately**
  - Munene: munene@ementech.co.ke
  - Co-founder: founder2@ementech.co.ke
  - CTO: cto@ementech.co.ke
  - Go to `/settings` → Security tab → Change password

- [ ] **Delete FOUNDER_CREDENTIALS.md** after passwords changed
- [ ] **Generate new JWT_SECRET** for production (minimum 32 characters)
- [ ] **Verify all environment variables** are set correctly
- [ ] **Ensure .env file is NOT** committed to git

### 2. Email Server Setup

- [ ] Create email accounts on mail server (69.164.244.165)
  ```bash
  ssh root@69.164.244.165
  useradd -m -s /bin/bash munene
  useradd -m -s /bin/bash founder2
  useradd -m -s /bin/bash cto
  echo "munene:EmenTech2026!Munene" | chpasswd
  echo "founder2:EmenTech2026!Founder2" | chpasswd
  echo "cto:EmenTech2026!CTO" | chpasswd
  ```

- [ ] Configure Dovecot mailboxes
  ```bash
  doveadm mailbox create -u munene@ementech.co.ke INBOX
  doveadm mailbox create -u founder2@ementech.co.ke INBOX
  doveadm mailbox create -u cto@ementech.co.ke INBOX
  ```

- [ ] Create default folders (Sent, Drafts, Trash, Spam, Archive)

### 3. Database Setup

- [ ] MongoDB installed and running
  ```bash
  systemctl status mongod
  ```

- [ ] Create database and user (if needed)
  ```bash
  mongosh
  use ementech
  db.createUser({
    user: "ementech",
    pwd: "secure-password",
    roles: ["readWrite"]
  })
  ```

- [ ] Verify founder accounts exist
  ```bash
  mongosh ementech
  db.users.find({email: {$in: ["munene@ementech.co.ke", "founder2@ementech.co.ke", "cto@ementech.co.ke"]}})
  ```

### 4. Domain & DNS Configuration

- [ ] Domain ementech.co.ke pointing to VPS IP
- [ ] A record configured: `ementech.co.ke → VPS_IP`
- [ ] CNAME configured: `www.ementech.co.ke → ementech.co.ke`
- [ ] MX records configured for email
- [ ] DNS propagation complete (use: `dig ementech.co.ke`)

---

## Deployment Steps

### Step 1: Deploy Backend

```bash
# Navigate to backend directory
cd /var/www/ementech-backend/backend

# Install production dependencies
npm install --production

# Create .env file with production values
cat > .env << 'EOF'
MONGODB_URI=mongodb://localhost:27017/ementech
JWT_SECRET=<generate-strong-secret-min-32-chars>
OPENAI_API_KEY=<your-openai-api-key>
NODE_ENV=production
PORT=5001
CLIENT_URL=https://ementech.co.ke
CORS_ORIGIN=https://ementech.co.ke

IMAP_HOST=mail.ementech.co.ke
IMAP_PORT=993
IMAP_USER=admin@ementech.co.ke
IMAP_PASS=<your-email-password>
SMTP_HOST=mail.ementech.co.ke
SMTP_PORT=587
SMTP_USER=admin@ementech.co.ke
SMTP_PASS=<your-email-password>

EMAIL_DOMAIN=ementech.co.ke
EMAIL_FROM=noreply@ementech.co.ke
EMAIL_FROM_NAME=EmenTech
EOF

# Start with PM2
pm2 start src/server.js --name ementech-backend
pm2 save
pm2 startup
```

### Step 2: Deploy Frontend

```bash
# Navigate to frontend directory
cd /var/www/ementech-frontend

# Install dependencies
npm install

# Build for production
npm run build

# Verify build output
ls -la dist/
```

### Step 3: Configure Nginx

```bash
# Create Nginx configuration
cat > /etc/nginx/sites-available/ementech.co.ke << 'EOF'
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
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        root /var/www/ementech-frontend/dist;
        try_files $uri $uri/ /index.html;

        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    location /api/ {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /socket.io/ {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Enable site
ln -s /etc/nginx/sites-available/ementech.co.ke /etc/nginx/sites-enabled/

# Test configuration
nginx -t

# Restart Nginx
systemctl restart nginx
```

### Step 4: SSL Certificate

```bash
# Install Certbot
apt install -y certbot python3-certbot-nginx

# Obtain certificate
certbot --nginx -d ementech.co.ke -d www.ementech.co.ke

# Choose to redirect HTTP to HTTPS when prompted
```

### Step 5: Firewall Configuration

```bash
# Configure UFW
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable

# Verify
ufw status
```

---

## Post-Deployment Verification

### Test Backend

```bash
# Check PM2 status
pm2 status

# Check health endpoint
curl https://ementech.co.ke/api/health

# Expected response:
# {"status":"healthy","timestamp":"...","uptime":...,"environment":"production"}
```

### Test Frontend

```bash
# Check website loads
curl -I https://ementech.co.ke

# Expected: HTTP/2 200

# Test in browser
# 1. Visit https://ementech.co.ke
# 2. Verify homepage loads
# 3. Check all navigation links work
# 4. Verify responsive design on mobile
```

### Test Authentication

- [ ] Visit https://ementech.co.ke/login
- [ ] Login with founder credentials
- [ ] Verify redirect to /email
- [ ] Test protected routes
- [ ] Change password in Settings → Security

### Test Email System

- [ ] Navigate to /email
- [ ] View INBOX
- [ ] Compose new email
- [ ] Send test email
- [ ] Verify email received

### Test Chatbot

- [ ] Click floating green chat button
- [ ] Verify chat window opens
- [ ] Send test message
- [ ] Verify response (if OpenAI key valid)

### Test Lead Capture

- [ ] Fill out newsletter signup form
- [ ] Submit contact form
- [ ] Verify leads appear in database
  ```bash
  mongosh ementech
  db.leads.find().sort({createdAt: -1}).limit(5)
  ```

---

## Monitoring & Maintenance

### Daily Checks

```bash
# Check server status
pm2 status
systemctl status nginx
systemctl status mongod

# Check logs (if issues)
pm2 logs ementech-backend --lines 50
tail -f /var/log/nginx/error.log
```

### Weekly Maintenance

```bash
# Update dependencies
cd /var/www/ementech-backend && npm update
cd /var/www/ementech-frontend && npm update

# Check for security vulnerabilities
npm audit

# Rotate logs
pm2 flush

# Backup database
mongodump --uri="mongodb://localhost:27017/ementech" --out=/backup/$(date +%Y%m%d)
```

### Monthly Maintenance

```bash
# Review and clean old backups
find /backup -mtime +30 -delete

# Check disk space
df -h

# Check memory usage
free -h

# Review analytics dashboard
```

---

## Troubleshooting Quick Reference

### Backend won't start

```bash
# Check logs
pm2 logs ementech-backend --lines 100

# Common issues:
# 1. Port 5001 in use
lsof -i :5001
kill -9 <PID>

# 2. MongoDB not running
systemctl start mongod

# 3. Missing .env variables
cat .env
```

### Frontend build fails

```bash
# Clear cache and reinstall
rm -rf node_modules dist
npm install
npm run build
```

### Can't login

```bash
# Check user exists in database
mongosh ementech
db.users.find({email: "munene@ementech.co.ke"})

# Reset password if needed
db.users.updateOne(
  {email: "munene@ementech.co.ke"},
  {$set: {password: "<new-hashed-password>"}}
)
```

### Email not working

```bash
# Test IMAP connection
telnet mail.ementech.co.ke 993

# Test SMTP connection
telnet mail.ementech.co.ke 587

# Check email configuration
cat .env | grep -E "IMAP|SMTP"
```

### Website slow

```bash
# Check server resources
pm2 monit

# Restart services
pm2 restart all
systemctl restart nginx

# Check Nginx access logs for patterns
tail -f /var/log/nginx/access.log
```

---

## Emergency Contacts

**Technical Issues:**
- System Admin: cto@ementech.co.ke
- Documentation: See FINAL_MASTERPIECE_REPORT.md

**Useful Resources:**
- MongoDB Docs: https://docs.mongodb.com/
- Express Docs: https://expressjs.com/
- React Docs: https://react.dev/
- Socket.IO Docs: https://socket.io/docs/
- Nginx Docs: https://nginx.org/en/docs/

---

## Success Criteria

Deployment is successful when:

- [✓] Backend runs without errors (PM2 status: online)
- [✓] Frontend builds and loads in browser
- [✓] All pages accessible and working
- [✓] Founder login works
- [✓] Password change works
- [✓] Email system functional
- [✓] Chatbot displays correctly
- [✓] Lead capture forms work
- [✓] HTTPS enabled with valid SSL
- [✓] No console errors in browser
- [✓] Server resources stable

---

## Final Notes

**The EmenTech website is production-ready and can be deployed immediately.**

**Estimated Deployment Time:** 30-60 minutes

**Priority After Launch:**
1. Change all founder passwords (CRITICAL!)
2. Set up database backups
3. Monitor server metrics for 24 hours
4. Test all features with real users
5. Set up analytics tracking

**Good luck with the launch! 🚀**

---

*This checklist complements the comprehensive FINAL_MASTERPIECE_REPORT.md*
*For detailed documentation, refer to the main report.*

---

**Last Updated:** January 20, 2026
**Version:** 1.0.0
**Status:** Ready for Production ✅
