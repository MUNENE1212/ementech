# VPS Deployment Guide - Ementech Website UI/UX 2026

## 🚀 Complete VPS Deployment Instructions

This guide provides step-by-step instructions for deploying your transformed Ementech website to your VPS.

---

## 📋 Pre-Deployment Checklist

### Local (Before Pushing to GitHub)
- [ ] All changes committed locally
- [ ] Git tag created (v2.0.0-uiux-overhaul-2026)
- [ ] Production build tested locally: `npm run build`
- [ ] Preview tested: `npm run preview`
- [ ] Environment variables ready (see `.env.example`)

### GitHub (Before Deploying to VPS)
- [ ] Code pushed to GitHub
- [] All sensitive data in `.gitignore`
- [ ] No credentials in code
- [ ] Release created on GitHub (optional but recommended)

### VPS Requirements
- [ ] SSH access to VPS
- [ ] Node.js 18+ installed
- [ ] Nginx or Apache installed
- [ ] Domain configured pointing to VPS
- [ ] SSL certificate (Let's Encrypt recommended)

---

## 🔄 Step 1: Push to GitHub Safely

### 1.1 Review What Will Be Pushed

```bash
# Check current branch
git branch

# Check status
git status

# Review recent commits
git log --oneline -5

# Check tag was created
git tag -l
```

### 1.2 Push to GitHub

```bash
# Push main branch
git push origin main

# Push tags
git push origin --tags

# Or push everything at once
git push origin main --tags
```

### 1.3 Verify on GitHub

1. Go to your repository on GitHub
2. Verify all commits are visible
3. Check the v2.0.0-uiux-overhaul-2026 tag exists
4. Optionally create a GitHub Release from the tag

---

## 🖥️ Step 2: VPS Deployment

### 2.1 Connect to Your VPS

```bash
# SSH into your VPS
ssh user@your-vps-ip-address

# Or use SSH key
ssh -i ~/.ssh/your-key.pem user@your-vps-ip-address
```

### 2.2 Navigate to Your Website Directory

```bash
# Go to your web directory
cd /var/www/ementech-website

# Or wherever your site is hosted
```

### 2.3 Backup Current Version (IMPORTANT!)

```bash
# Create backup directory
mkdir -p backups
backup_date=$(date +%Y%m%d_%H%M%S)

# Backup current deployment
cp -r dist backups/dist_backup_$backup_date
cp -r .env backups/.env_backup_$backup_date

# Verify backup
ls -lh backups/
```

### 2.4 Pull Latest Changes from GitHub

```bash
# Pull latest code
git pull origin main

# Or if you prefer to clone fresh (first time):
# git clone https://github.com/yourusername/ementech-website.git .
```

### 2.5 Install Dependencies

```bash
# Install/update dependencies
npm ci

# Or if npm ci fails:
npm install
```

### 2.6 Configure Environment Variables

```bash
# Copy example env file
cp .env.example .env

# Edit with your actual values
nano .env
```

**Required Environment Variables:**

```env
# EmailJS Configuration (REQUIRED for contact form)
VITE_EMAILJS_SERVICE_ID=your_actual_service_id
VITE_EMAILJS_TEMPLATE_ID=your_actual_template_id
VITE_EMAILJS_PUBLIC_KEY=your_actual_public_key

# API Configuration (if applicable)
VITE_API_URL=https://api.ementech.co.ke

# Other configuration
VITE_SITE_URL=https://ementech.co.ke
```

**Get EmailJS Credentials:**
1. Go to https://www.emailjs.com/
2. Create account or sign in
3. Create a new service (e.g., "Gmail", "Outlook")
4. Create an email template
5. Copy Service ID, Template ID, and Public Key to `.env`

### 2.7 Build for Production

```bash
# Build production bundle
npm run build

# Verify build succeeded
ls -lh dist/

# Check bundle size
du -sh dist/
```

**Expected output:** ~118 KB (gzipped)

### 2.8 Configure Web Server

#### Option A: Nginx (Recommended)

```bash
# Edit Nginx config
sudo nano /etc/nginx/sites-available/ementech
```

**Nginx Configuration:**

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name ementech.co.ke www.ementech.co.ke;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ementech.co.ke www.ementech.co.ke;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/ementech.co.ke/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ementech.co.ke/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Root directory
    root /var/www/ementech-website/dist;
    index index.html;

    # Security Headers (CRITICAL)
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://fonts.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://api.ementech.co.ke https://api.emailjs.com; frame-ancestors 'none';" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;

    # Gzip Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    gzip_min_length 1000;

    # SPA Routing (Handle React Router)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache Static Assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security: Deny access to sensitive files
    location ~ /\. {
        deny all;
    }

    location ~ /\.env {
        deny all;
    }
}
```

**Enable Nginx Config:**

```bash
# Create symbolic link if not exists
sudo ln -s /etc/nginx/sites-available/ementech /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# Check Nginx status
sudo systemctl status nginx
```

#### Option B: Apache (Alternative)

```bash
# Edit Apache config
sudo nano /etc/apache2/sites-available/ementech.conf
```

**Apache Configuration:**

```apache
<VirtualHost *:80>
    ServerName ementech.co.ke
    Redirect permanent / https://ementech.co.ke/
</VirtualHost>

<VirtualHost *:443>
    ServerName ementech.co.ke
    DocumentRoot /var/www/ementech-website/dist

    SSLEngine on
    SSCertificateFile /etc/letsencrypt/live/ementech.co.ke/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/ementech.co.ke/privkey.pem

    # Security Headers
    Header always set Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://fonts.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://api.ementech.co.ke https://api.emailjs.com; frame-ancestors 'none';"
    Header always set X-Frame-Options "DENY"
    Header always set X-Content-Type-Options "nosniff"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"

    # SPA Routing
    <Directory "/var/www/ementech-website/dist">
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>

    # Cache Static Assets
    <LocationMatch "\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$">
        ExpiresActive On
        ExpiresDefault "access plus 1 year"
        Header append Cache-Control "public, immutable"
    </LocationMatch>
</VirtualHost>
```

**Enable Apache Config:**

```bash
# Enable site
sudo a2ensite ementech.conf

# Enable required modules
sudo a2enmod rewrite
sudo a2enmod headers
sudo a2enmod expires
sudo a2enmod ssl

# Test configuration
sudo apache2ctl configtest

# Reload Apache
sudo systemctl reload apache2

# Check Apache status
sudo systemctl status apache2
```

### 2.9 Set Up SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Or for Apache:
# sudo apt install certbot python3-certbot-apache

# Obtain SSL certificate
sudo certbot --nginx -d ementech.co.ke -d www.ementech.co.ke

# Or for Apache:
# sudo certbot --apache -d ementech.co.ke -d www.ementech.co.ke

# Test auto-renewal
sudo certbot renew --dry-run
```

### 2.10 Set Permissions

```bash
# Set proper ownership
sudo chown -R www-data:www-data /var/www/ementech-website

# Set proper permissions
sudo chmod -R 755 /var/www/ementech-website
sudo chmod 600 /var/www/ementech-website/.env

# Verify
ls -la /var/www/ementech-website/
```

---

## ✅ Step 3: Verify Deployment

### 3.1 Check Website in Browser

1. Open https://ementech.co.ke
2. Verify homepage loads
3. Check all pages work (Home, About, Services, Products, Contact)
4. Test mobile view (use browser devtools or mobile device)
5. Test navigation
6. Verify SSL certificate (padlock icon)

### 3.2 Test Contact Form

1. Go to Contact page
2. Fill out the form
3. Submit
4. Verify email is received (check EmailJS dashboard)
5. Check form validation works

### 3.3 Run Lighthouse Audit

1. Open Chrome DevTools (F12)
2. Go to Lighthouse tab
3. Run audit
4. Verify scores:
   - Performance: >= 90
   - Accessibility: >= 90
   - Best Practices: >= 90
   - SEO: >= 90

### 3.4 Check Security Headers

1. Open Chrome DevTools (F12)
2. Go to Network tab
3. Refresh page
4. Click on main request
5. Check Response Headers for security headers:
   - Content-Security-Policy
   - X-Frame-Options
   - X-Content-Type-Options
   - Strict-Transport-Security

### 3.5 Verify Console for Errors

1. Open Chrome DevTools (F12)
2. Go to Console tab
3. Check for any errors or warnings
4. Should see 0 errors

---

## 🔄 Step 4: Update Future Deployments

### Quick Update Process

```bash
# SSH into VPS
ssh user@your-vps-ip

# Navigate to project
cd /var/www/ementech-website

# Backup current version
mkdir -p backups
cp -r dist backups/dist_backup_$(date +%Y%m%d_%H%M%S)

# Pull latest changes
git pull origin main

# Install dependencies (if package.json changed)
npm ci

# Build for production
npm run build

# Reload web server (if needed)
sudo systemctl reload nginx
# Or for Apache:
# sudo systemctl reload apache2

# Verify deployment
curl -I https://ementech.co.ke
```

---

## 📊 Monitoring & Maintenance

### Set Up Monitoring

```bash
# Install monitoring tools (optional)
sudo apt install htop

# Check disk space
df -h

# Check memory usage
free -h

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Or Apache logs:
# sudo tail -f /var/log/apache2/error.log
# sudo tail -f /var/log/apache2/access.log
```

### Regular Maintenance Tasks

**Weekly:**
- Check SSL certificate expiration
- Review error logs
- Monitor disk space

**Monthly:**
- Update dependencies: `npm update`
- Security audit: `npm audit`
- Backup database (if applicable)

**Quarterly:**
- Full security review
- Performance optimization review
- Update Node.js version

---

## 🐛 Troubleshooting

### Issue: Website Not Loading

```bash
# Check Nginx status
sudo systemctl status nginx

# Restart Nginx
sudo systemctl restart nginx

# Check Nginx error logs
sudo tail -50 /var/log/nginx/error.log

# Check if port 80/443 is listening
sudo netstat -tlnp | grep nginx
```

### Issue: Build Fails

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Try building again
npm run build

# Check build logs for errors
```

### Issue: Contact Form Not Working

```bash
# Check .env file has correct EmailJS credentials
cat .env | grep EMAILJS

# Verify EmailJS service is active
# Go to https://www.emailjs.com/ and check dashboard

# Check browser console for errors
# Open DevTools → Console
```

### Issue: CSP Headers Blocking Resources

```bash
# Check CSP violations in browser
# Chrome DevTools → Console → Look for CSP errors

# Update CSP in Nginx/Apache config
# Add missing domains to CSP policy

# Reload web server
sudo systemctl reload nginx
```

### Issue: Need to Rollback

```bash
# List backups
ls -lh backups/

# Restore from backup
cp -r backups/dist_backup_YYYYMMDD_HHMMSS/* dist/

# Reload web server
sudo systemctl reload nginx
```

---

## 📞 Support & Resources

### Documentation
- Complete Project Report: `docs/DEPLOYMENT_REPORT_20260201.md`
- Security Audit: `docs/SECURITY_AUDIT_REPORT_20260201.md`
- CSP Configuration: `docs/CSP_HEADERS_CONFIG.md`
- Local Development: `docs/LOCAL_DEV_QUICK_START.md`

### Useful Commands Reference

```bash
# SSH into VPS
ssh user@your-vps-ip

# Check Nginx status
sudo systemctl status nginx

# Restart Nginx
sudo systemctl restart nginx

# View Nginx logs
sudo tail -f /var/log/nginx/error.log

# Test Nginx config
sudo nginx -t

# Check SSL certificate
sudo certbot certificates

# Renew SSL manually
sudo certbot renew

# Check Node.js version
node --version

# Check npm version
npm --version

# View git log
git log --oneline -10
```

---

## ✅ Deployment Complete Checklist

- [ ] Code pushed to GitHub
- [ ] VPS backup created
- [ ] Latest code pulled on VPS
- [ ] Dependencies installed
- [ ] Environment variables configured
- [ ] Production build successful
- [ ] Web server configured (Nginx/Apache)
- [ ] SSL certificate active
- [ ] Security headers implemented
- [ ] Website accessible via HTTPS
- [ ] All pages tested
- [ ] Contact form working
- [ ] Lighthouse audit passed
- [ ] Console shows 0 errors
- [ ] Monitoring in place

---

**Deployment Status:** ✅ READY
**Last Updated:** February 1, 2026
**Version:** v2.0.0-uiux-overhaul-2026

---

**Need Help?** Refer to:
- Security Audit Report: `docs/SECURITY_AUDIT_REPORT_20260201.md`
- CSP Configuration: `docs/CSP_HEADERS_CONFIG.md`
- Deployment Report: `docs/DEPLOYMENT_REPORT_20260201.md`
