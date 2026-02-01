# Production Deployment Guide

**Project:** EmenTech Website UI/UX Overhaul 2026
**Purpose:** Guide for deploying to production hosting
**Last Updated:** February 1, 2026

---

## Table of Contents

1. [Pre-Deployment Checklist](#1-pre-deployment-checklist)
2. [Environment Configuration](#2-environment-configuration)
3. [Build Process](#3-build-process)
4. [CSP Header Configuration](#4-csp-header-configuration)
5. [Deployment to Hosting Platforms](#5-deployment-to-hosting-platforms)
6. [Post-Deployment Verification](#6-post-deployment-verification)
7. [Monitoring and Maintenance](#7-monitoring-and-maintenance)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. Pre-Deployment Checklist

### 1.1 Code Quality

- [ ] TypeScript compilation successful (0 errors)
- [ ] ESLint passes (0 errors in src/)
- [ ] Production build successful
- [ ] Bundle size verified (< 500 KB)
- [ ] All tests passing
- [ ] No console.log statements in production code

### 1.2 Security

- [ ] EmailJS credentials configured
- [ ] CSP headers configured (see [Section 4](#4-csp-header-configuration))
- [ ] .env files added to .gitignore
- [ ] No hardcoded secrets in code
- [ ] Dependency audit clean (0 vulnerabilities)

### 1.3 Environment Variables

- [ ] `VITE_API_URL` set to production API endpoint
- [ ] `VITE_EMAILJS_SERVICE_ID` configured
- [ ] `VITE_EMAILJS_TEMPLATE_ID` configured
- [ ] `VITE_EMAILJS_PUBLIC_KEY` configured

### 1.4 DNS and SSL

- [ ] Domain configured (e.g., ementech.co.ke)
- [ ] SSL certificate installed (Let's Encrypt or commercial)
- [ ] HTTPS redirect configured
- [ ] DNS propagated

---

## 2. Environment Configuration

### 2.1 Create Production Environment File

Create `.env.production` in the project root:

```env
# API Configuration
VITE_API_URL=https://api.ementech.co.ke/api

# EmailJS Configuration (for contact form)
# Get your credentials from https://www.emailjs.com/
VITE_EMAILJS_SERVICE_ID=your_service_id
VITE_EMAILJS_TEMPLATE_ID=your_template_id
VITE_EMAILJS_PUBLIC_KEY=your_public_key
```

**Important:**
- Never commit `.env.production` to Git
- Use strong, unique credentials
- Rotate credentials regularly

### 2.2 EmailJS Setup

1. **Create EmailJS Account**
   - Go to https://www.emailjs.com/
   - Sign up for free account

2. **Create Email Service**
   - Add your email service (Gmail, Outlook, etc.)
   - Verify your email address

3. **Create Email Template**
   - Create a new template
   - Use these variables in your template:
     ```
     {{to_name}} - Recipient name
     {{from_name}} - Sender name
     {{message}} - Message content
     {{reply_to}} - Sender email
     ```

4. **Get Your Credentials**
   - Service ID: From your email service
   - Template ID: From your email template
   - Public Key: From your account settings

5. **Add to .env.production**
   ```env
   VITE_EMAILJS_SERVICE_ID=your_actual_service_id
   VITE_EMAILJS_TEMPLATE_ID=your_actual_template_id
   VITE_EMAILJS_PUBLIC_KEY=your_actual_public_key
   ```

6. **Test Contact Form**
   - Build the project: `npm run build`
   - Preview locally: `npm run preview`
   - Test the contact form at http://localhost:4173/contact

---

## 3. Build Process

### 3.1 Install Dependencies

```bash
npm install
```

### 3.2 Run Production Build

```bash
npm run build
```

**Expected Output:**
```
vite v7.3.1 building client environment for production...
transforming...
✓ 2560 modules transformed.
rendering chunks...
computing gzip size...
dist/assets/index-Bkvz-yfK.js    374.15 KB │ gzip: 118.35 KB
dist/assets/index-CA9vwMX_.css    70.34 KB │ gzip:  15.54 KB
✓ built in 10.65s
```

### 3.3 Verify Build Output

Check the `dist/` directory:

```bash
ls -lh dist/
```

**Expected files:**
- `dist/index.html` - Entry HTML file
- `dist/assets/*.js` - JavaScript bundles
- `dist/assets/*.css` - CSS bundles
- `dist/assets/*.woff2` - Font files

### 3.4 Test Build Locally

```bash
npm run preview
```

Access at http://localhost:4173

**Verify:**
- Homepage loads
- All navigation works
- Contact form renders
- No console errors
- Responsive design works

---

## 4. CSP Header Configuration

**Why CSP Headers Matter:**

Content Security Policy (CSP) headers are **critical for production security**. They prevent XSS attacks, clickjacking, and data exfiltration.

**Priority:** P1 (Required before production)

### 4.1 CSP Header for Nginx

Add to your Nginx server block:

```nginx
server {
    listen 443 ssl http2;
    server_name ementech.co.ke;

    # SSL Configuration
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;

    # Root directory
    root /var/www/ementech-website/dist;
    index index.html;

    # Content Security Policy
    add_header Content-Security-Policy "
        default-src 'self';
        script-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
        style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
        img-src 'self' data: https:;
        font-src 'self' https://fonts.gstatic.com;
        connect-src 'self' https://api.ementech.co.ke https://api.emailjs.com;
        frame-ancestors 'none';
        base-uri 'self';
        form-action 'self';
        frame-src 'none';
        object-src 'none';
    " always;

    # Additional Security Headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Try Files (SPA routing)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache Static Assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2|woff)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

### 4.2 CSP Header for Apache

Add to `.htaccess` or Apache config:

```apache
<IfModule mod_headers.c>
    # Content Security Policy
    Header always set Content-Security-Policy "
        default-src 'self';
        script-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
        style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
        img-src 'self' data: https:;
        font-src 'self' https://fonts.gstatic.com;
        connect-src 'self' https://api.ementech.co.ke https://api.emailjs.com;
        frame-ancestors 'none';
        base-uri 'self';
        form-action 'self';
        frame-src 'none';
        object-src 'none';
    "

    # Additional Security Headers
    Header always set X-Frame-Options "DENY"
    Header always set X-Content-Type-Options "nosniff"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
    Header always set Permissions-Policy "geolocation=(), microphone=(), camera=()"
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
</IfModule>

# SPA Routing
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    RewriteRule ^index\.html$ - [L]
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . /index.html [L]
</IfModule>
```

### 4.3 Testing CSP Headers

Before production deployment, test your CSP policy:

1. **CSP Evaluator:** https://csp-evaluator.withgoogle.com/

2. **Browser DevTools:**
   - Open DevTools (F12)
   - Go to Console tab
   - Look for CSP violations

3. **Test URL:** https://ementech.co.ke (after deployment)

**Common CSP Issues:**
- Inline scripts blocked → Use 'unsafe-inline' (already included)
- External fonts blocked → Add to `font-src` (already included)
- API requests blocked → Add to `connect-src` (update with your API domain)

### 4.4 CSP Report-Only Mode (Optional)

For testing without blocking:

```http
Content-Security-Policy-Report-Only: same policy as above
```

Add reporting endpoint:
```http
report-uri /csp-violation-report-endpoint
report-to csp-report-endpoint
```

---

## 5. Deployment to Hosting Platforms

### 5.1 Vercel (Recommended)

**Why Vercel?**
- Zero-config deployment
- Automatic HTTPS
- Global CDN
- Preview deployments
- Free tier available

**Deployment Steps:**

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   # From project root
   vercel --prod
   ```

4. **Configure Environment Variables**
   - Go to Vercel dashboard
   - Project Settings → Environment Variables
   - Add:
     - `VITE_API_URL`
     - `VITE_EMAILJS_SERVICE_ID`
     - `VITE_EMAILJS_TEMPLATE_ID`
     - `VITE_EMAILJS_PUBLIC_KEY`

5. **Custom Domain (Optional)**
   - Vercel dashboard → Domains
   - Add `ementech.co.ke`
   - Update DNS records

**Note:** Vercel automatically handles security headers. Add custom headers in `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ]
}
```

### 5.2 Netlify

**Deployment Steps:**

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login**
   ```bash
   netlify login
   ```

3. **Deploy**
   ```bash
   netlify deploy --prod
   ```

4. **Configure Environment Variables**
   - Netlify dashboard → Site Settings → Environment Variables
   - Add all required variables

5. **Custom Headers** (`netlify.toml`):
   ```toml
   [[headers]]
     for = "/*"
     [headers.values]
       X-Frame-Options = "DENY"
       X-Content-Type-Options = "nosniff"
       Referrer-Policy = "strict-origin-when-cross-origin"
       Permissions-Policy = "geolocation=(), microphone=(), camera=()"
   ```

### 5.3 AWS S3 + CloudFront

**Deployment Steps:**

1. **Build Project**
   ```bash
   npm run build
   ```

2. **Upload to S3**
   ```bash
   aws s3 sync dist/ s3://your-bucket-name --delete
   ```

3. **Configure CloudFront**
   - Origin: S3 bucket
   - Cache behavior: Forward all headers
   - SSL/TLS: Only viewer HTTPS

4. **Lambda@Edge for Headers**
   - Create Lambda@Edge function for security headers
   - Associate with CloudFront distribution

5. **Route53**
   - Add A record pointing to CloudFront distribution

### 5.4 Traditional VPS (Nginx/Apache)

**Deployment Steps:**

1. **Build Project**
   ```bash
   npm run build
   ```

2. **Upload to Server**
   ```bash
   scp -r dist/* user@server:/var/www/ementech-website/
   ```

3. **Configure Nginx** (see [Section 4.1](#41-csp-header-for-nginx))

4. **Restart Nginx**
   ```bash
   sudo systemctl restart nginx
   ```

5. **Configure SSL** (Let's Encrypt)
   ```bash
   sudo certbot --nginx -d ementech.co.ke
   ```

---

## 6. Post-Deployment Verification

### 6.1 Immediate Checks

**URL:** https://ementech.co.ke

- [ ] Homepage loads without errors
- [ ] All navigation links work
- [ ] Mobile menu functional
- [ ] Contact form renders
- [ ] No console errors (check DevTools)
- [ ] HTTPS works correctly
- [ ] SSL certificate valid

### 6.2 Security Verification

- [ ] CSP headers active (check DevTools → Network → Response Headers)
- [ ] X-Frame-Options: DENY
- [ ] X-Content-Type-Options: nosniff
- [ ] Referrer-Policy present
- [ ] Strict-Transport-Security present
- [ ] No mixed content warnings

### 6.3 Performance Verification

Run Lighthouse audit:

1. Open Chrome DevTools (F12)
2. Lighthouse tab
3. Run audit
4. Verify scores:

| Metric | Target | Pass/Fail |
|--------|--------|-----------|
| Performance | > 90 | [ ] |
| Accessibility | > 90 | [ ] |
| Best Practices | > 90 | [ ] |
| SEO | > 90 | [ ] |

### 6.4 Functionality Testing

- [ ] Contact form submits successfully
- [ ] All pages accessible
- [ ] Images load correctly
- [ ] Responsive on mobile (test on actual device)
- [ ] Keyboard navigation works
- [ ] Animations smooth

### 6.5 Cross-Browser Testing

Test on:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest, if on Mac)
- [ ] Edge (latest)

---

## 7. Monitoring and Maintenance

### 7.1 Error Tracking

**Recommended Tools:**
- Sentry (https://sentry.io/)
- LogRocket (https://logrocket.com/)
- Rollbar (https://rollbar.com/)

**Sentry Setup:**
```bash
npm install @sentry/react
```

Add to `src/main.tsx`:
```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: "production",
  tracesSampleRate: 1.0,
});
```

### 7.2 Analytics

**Recommended Tools:**
- Google Analytics 4
- Plausible (privacy-friendly)
- Fathom Analytics

### 7.3 Uptime Monitoring

**Recommended Tools:**
- UptimeRobot (free)
- Pingdom
- StatusCake

### 7.4 Performance Monitoring

**Recommended Tools:**
- Google PageSpeed Insights
- WebPageTest
- Lighthouse CI

### 7.5 Security Monitoring

**Monthly Tasks:**
- [ ] Run `npm audit` for vulnerabilities
- [ ] Check CSP violation reports
- [ ] Review SSL certificate expiration
- [ ] Update dependencies: `npm update`

### 7.6 Backup Strategy

**Back up:**
- Database (if applicable)
- Environment variables
- SSL certificates
- Configuration files

---

## 8. Troubleshooting

### 8.1 Build Errors

**Issue:** Build fails with TypeScript errors

**Solution:**
```bash
# Check TypeScript errors
npx tsc --noEmit

# Fix errors
# Then rebuild
npm run build
```

**Issue:** Build fails with ESLint errors

**Solution:**
```bash
# Check ESLint errors
npm run lint

# Fix automatically
npm run lint -- --fix
```

### 8.2 Deployment Errors

**Issue:** 404 errors on routes

**Solution:** Configure SPA routing (see Nginx/Apache configs in Section 4)

**Issue:** CORS errors

**Solution:** Configure CORS on API server:

```javascript
// Express example
app.use(cors({
  origin: 'https://ementech.co.ke',
  credentials: true
}));
```

**Issue:** Environment variables not working

**Solution:**
- Verify variables are prefixed with `VITE_`
- Rebuild after changing `.env.production`
- Clear build cache: `rm -rf dist && npm run build`

### 8.3 Post-Deployment Issues

**Issue:** Contact form not working

**Solution:**
1. Check browser console for errors
2. Verify EmailJS credentials in `.env.production`
3. Check EmailJS dashboard for service status
4. Verify CSP headers allow `connect-src` to EmailJS API

**Issue:** CSP violations in console

**Solution:**
1. Check DevTools → Console for CSP violations
2. Update CSP policy to allow blocked resources
3. Test with CSP Evaluator: https://csp-evaluator.withgoogle.com/

**Issue:** Images not loading

**Solution:**
1. Check CSP `img-src` directive
2. Verify image paths
3. Check browser console for errors

**Issue:** Poor Lighthouse scores

**Solution:**
1. Performance: Optimize images, reduce bundle size
2. Accessibility: Check ARIA labels, color contrast
3. SEO: Add meta tags, structured data

---

## 9. Rollback Plan

If critical issues occur:

### Quick Rollback

**Vercel/Netlify:**
```bash
# List deployments
vercel ls

# Rollback to previous deployment
vercel rollback [deployment-url]
```

**VPS:**
```bash
# Restore previous backup
sudo cp -r /var/www/backup/ementech-website/* /var/www/ementech-website/
sudo systemctl restart nginx
```

### Database Rollback (if applicable)

```bash
# PostgreSQL
pg_restore -d ementech_db backup.sql

# MongoDB
mongorestore --db ementech_db backup/
```

---

## 10. Success Criteria

Deployment is successful when:

- [ ] Homepage loads at https://ementech.co.ke
- [ ] All pages accessible without errors
- [ ] HTTPS works with valid SSL
- [ ] Security headers configured (CSP, X-Frame-Options, etc.)
- [ ] Contact form functional
- [ ] Lighthouse scores > 90
- [ ] Console errors = 0
- [ ] Mobile responsive working
- [ ] Cross-browser compatible
- [ ] Monitoring configured

---

## 11. Support and Resources

### Documentation

- **Quick Start:** `LOCAL_DEV_QUICK_START.md`
- **Deployment Report:** `DEPLOYMENT_REPORT_20260201.md`
- **CSP Configuration:** `CSP_HEADERS_CONFIG.md`
- **Security Report:** `SECURITY_AUDIT_REPORT_20260201.md`

### External Resources

- **Vite Deployment:** https://vitejs.dev/guide/build.html
- **React Deployment:** https://react.dev/learn/deploying-react-apps
- **CSP Guide:** https://content-security-policy.com/
- **EmailJS Docs:** https://www.emailjs.com/docs/

---

## 12. Summary

**To deploy to production:**

1. Configure environment variables (`.env.production`)
2. Build project: `npm run build`
3. Configure CSP headers (Nginx/Apache)
4. Deploy `dist/` to hosting platform
5. Test all functionality
6. Configure monitoring

**Production URL:** https://ementech.co.ke

**Good luck with your deployment!** 🚀

---

**Last Updated:** February 1, 2026
**Version:** 1.0.0
**Status:** Production Ready
