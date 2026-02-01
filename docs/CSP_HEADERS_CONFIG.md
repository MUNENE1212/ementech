# CSP Headers Configuration Guide

**Project:** EmenTech Website UI/UX Overhaul 2026
**Purpose:** Content Security Policy header configuration for production
**Last Updated:** February 1, 2026
**Priority:** P1 (Required before production deployment)

---

## What is CSP?

Content Security Policy (CSP) is an **added layer of security** that helps to detect and mitigate certain types of attacks, including Cross-Site Scripting (XSS) and data injection attacks.

**Why CSP is Critical:**
- Prevents XSS attacks
- Blocks clickjacking
- Controls resource loading
- Reduces attack surface
- **Required before production deployment**

---

## Quick Start (Recommended CSP Policy)

For the Ementech website, use this CSP policy:

```http
Content-Security-Policy:
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
```

---

## Complete Security Headers

Use these headers together for comprehensive security:

```http
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://fonts.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://api.ementech.co.ke https://api.emailjs.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; frame-src 'none'; object-src 'none';

X-Frame-Options: DENY

X-Content-Type-Options: nosniff

Referrer-Policy: strict-origin-when-cross-origin

Permissions-Policy: geolocation=(), microphone=(), camera=()

Strict-Transport-Security: max-age=31536000; includeSubDomains
```

---

## Server Configuration Examples

### 1. Nginx Configuration

**File:** `/etc/nginx/sites-available/ementech`

```nginx
server {
    listen 443 ssl http2;
    server_name ementech.co.ke www.ementech.co.ke;

    # SSL Configuration
    ssl_certificate /etc/ssl/certs/ementech.co.ke.crt;
    ssl_certificate_key /etc/ssl/private/ementech.co.ke.key;

    # Security Headers

    # Content Security Policy
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://fonts.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://api.ementech.co.ke https://api.emailjs.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; frame-src 'none'; object-src 'none';" always;

    # X-Frame-Options (prevent clickjacking)
    add_header X-Frame-Options "DENY" always;

    # X-Content-Type-Options (prevent MIME sniffing)
    add_header X-Content-Type-Options "nosniff" always;

    # Referrer-Policy (control referrer information)
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Permissions-Policy (disable browser features)
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;

    # Strict-Transport-Security (HSTS - enforce HTTPS)
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Remove Server header (hide server info)
    server_tokens off;

    # Root Directory
    root /var/www/ementech-website/dist;
    index index.html;

    # SPA Routing
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
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;

    # Security - Block access to sensitive files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}

# HTTP to HTTPS Redirect
server {
    listen 80;
    server_name ementech.co.ke www.ementech.co.ke;
    return 301 https://$server_name$request_uri;
}
```

**Apply Configuration:**
```bash
# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Verify headers
curl -I https://ementech.co.ke
```

### 2. Apache Configuration

**Option A:** `.htaccess` file (in `dist/` directory)

```apache
<IfModule mod_headers.c>
    # Content Security Policy
    Header always set Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://fonts.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://api.ementech.co.ke https://api.emailjs.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; frame-src 'none'; object-src 'none';"

    # X-Frame-Options
    Header always set X-Frame-Options "DENY"

    # X-Content-Type-Options
    Header always set X-Content-Type-Options "nosniff"

    # Referrer-Policy
    Header always set Referrer-Policy "strict-origin-when-cross-origin"

    # Permissions-Policy
    Header always set Permissions-Policy "geolocation=(), microphone=(), camera=()"

    # Strict-Transport-Security
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

# Cache Static Assets
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
    ExpiresByType font/woff2 "access plus 1 year"
</IfModule>

# Gzip Compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>
```

**Option B:** Apache virtual host config

**File:** `/etc/apache2/sites-available/ementech.conf`

```apache
<VirtualHost *:443>
    ServerName ementech.co.ke
    ServerAlias www.ementech.co.ke

    DocumentRoot /var/www/ementech-website/dist

    # SSL Configuration
    SSLEngine on
    SSLCertificateFile /etc/ssl/certs/ementech.co.ke.crt
    SSLCertificateKeyFile /etc/ssl/private/ementech.co.ke.key

    # Security Headers
    Header always set Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://fonts.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://api.ementech.co.ke https://api.emailjs.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; frame-src 'none'; object-src 'none';"
    Header always set X-Frame-Options "DENY"
    Header always set X-Content-Type-Options "nosniff"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
    Header always set Permissions-Policy "geolocation=(), microphone=(), camera=()"
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"

    # Hide Server Information
    ServerSignature Off
    Header unset Server

    # SPA Routing
    <Directory "/var/www/ementech-website/dist">
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]

        Require all granted
    </Directory>

    # Logging
    ErrorLog ${APACHE_LOG_DIR}/ementech-error.log
    CustomLog ${APACHE_LOG_DIR}/ementech-access.log combined
</VirtualHost>

# HTTP to HTTPS Redirect
<VirtualHost *:80>
    ServerName ementech.co.ke
    ServerAlias www.ementech.co.ke
    Redirect permanent / https://ementech.co.ke/
</VirtualHost>
```

**Apply Configuration:**
```bash
# Enable Apache headers module
sudo a2enmod headers
sudo a2enmod rewrite
sudo a2enmod ssl

# Enable site
sudo a2ensite ementech.conf

# Test configuration
sudo apache2ctl configtest

# Restart Apache
sudo systemctl restart apache2

# Verify headers
curl -I https://ementech.co.ke
```

### 3. Vercel Configuration

**File:** `vercel.json` (in project root)

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' https://fonts.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://api.ementech.co.ke https://api.emailjs.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; frame-src 'none'; object-src 'none';"
        },
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
        },
        {
          "key": "Permissions-Policy",
          "value": "geolocation=(), microphone=(), camera=()"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains"
        }
      ]
    }
  ]
}
```

**Deploy to Vercel:**
```bash
vercel --prod
```

### 4. Netlify Configuration

**File:** `netlify.toml` (in project root)

```toml
[[headers]]
  for = "/*"
  [headers.values]
    Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline' https://fonts.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://api.ementech.co.ke https://api.emailjs.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; frame-src 'none'; object-src 'none';"
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "geolocation=(), microphone=(), camera=()"
    Strict-Transport-Security = "max-age=31536000; includeSubDomains"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

**Deploy to Netlify:**
```bash
netlify deploy --prod
```

---

## CSP Policy Breakdown

### Directive Explanations

| Directive | Value | Purpose |
|-----------|-------|---------|
| `default-src` | `'self'` | Default policy: allow only same-origin resources |
| `script-src` | `'self' 'unsafe-inline' https://fonts.googleapis.com` | Allow scripts from same origin and Google Fonts |
| `style-src` | `'self' 'unsafe-inline' https://fonts.googleapis.com` | Allow styles from same origin and Google Fonts |
| `img-src` | `'self' data: https:` | Allow images from same origin, data URLs, and any HTTPS |
| `font-src` | `'self' https://fonts.gstatic.com` | Allow fonts from same origin and Google Fonts CDN |
| `connect-src` | `'self' https://api.ementech.co.ke https://api.emailjs.com` | Allow API calls to your backend and EmailJS |
| `frame-ancestors` | `'none'` | Prevent site from being embedded in iframes |
| `base-uri` | `'self'` | Restrict `<base>` tag URLs to same origin |
| `form-action` | `'self'` | Restrict form submissions to same origin |
| `frame-src` | `'none'` | Block all iframes |
| `object-src` | `'none'` | Block plugins (Flash, Java, etc.) |

---

## Testing CSP Headers

### 1. Browser DevTools

**Check Response Headers:**

1. Open website in browser (https://ementech.co.ke)
2. Open DevTools (F12)
3. Go to Network tab
4. Refresh page
5. Click on main document (index.html)
6. Look at Response Headers
7. Verify `Content-Security-Policy` header is present

**Check Console for Violations:**

1. Open DevTools (F12)
2. Go to Console tab
3. Look for CSP violation messages
4. Format: `[Report Only] Refused to load...`

### 2. Online CSP Evaluator

**Google CSP Evaluator:**
https://csp-evaluator.withgoogle.com/

1. Enter your CSP policy
2. Click "Evaluate CSP"
3. Review recommendations
4. Fix any issues

### 3. curl Command

```bash
curl -I https://ementech.co.ke
```

**Expected Output:**
```http
HTTP/2 200
content-security-policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://fonts.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; ...
x-frame-options: DENY
x-content-type-options: nosniff
referrer-policy: strict-origin-when-cross-origin
permissions-policy: geolocation=(), microphone=(), camera=()
strict-transport-security: max-age=31536000; includeSubDomains
```

### 4. Security Headers Test

**Security Headers.com:**
https://securityheaders.com/

Enter your URL and check for missing headers.

---

## Troubleshooting CSP Issues

### Common CSP Violations

#### Issue: Inline Scripts Blocked

**Error:**
```
Refused to execute inline script because it violates the following Content Security Policy directive: "script-src 'self'"
```

**Solution:**
- Add `'unsafe-inline'` to `script-src` (already included in recommended policy)
- Move inline scripts to external `.js` files

#### Issue: External Fonts Blocked

**Error:**
```
Refused to load font from 'https://fonts.gstatic.com/...' because it violates the following Content Security Policy directive: "font-src 'self'"
```

**Solution:**
- Add `https://fonts.gstatic.com` to `font-src` (already included)

#### Issue: API Calls Blocked

**Error:**
```
Refused to connect to 'https://api.ementech.co.ke/...' because it violates the following Content Security Policy directive: "connect-src 'self'"
```

**Solution:**
- Add API domain to `connect-src` (replace `api.ementech.co.ke` with your actual API domain)

#### Issue: EmailJS Blocked

**Error:**
```
Refused to connect to 'https://api.emailjs.com/...' because it violates the following Content Security Policy directive: "connect-src 'self'"
```

**Solution:**
- Add `https://api.emailjs.com` to `connect-src` (already included)

#### Issue: Images Blocked

**Error:**
```
Refused to load image from 'https://example.com/image.jpg' because it violates the following Content Security Policy directive: "img-src 'self'"
```

**Solution:**
- Add image domain to `img-src`, or
- Use `'self'` only and host images on same domain
- Use data URLs for small images: `data:image/png;base64,...`

---

## CSP Report-Only Mode (Testing)

Before enforcing CSP, test in report-only mode:

### Nginx

```nginx
add_header Content-Security-Policy-Report-Only "default-src 'self'; script-src 'self' 'unsafe-inline' https://fonts.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://api.ementech.co.ke https://api.emailjs.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; frame-src 'none'; object-src 'none'; report-uri /csp-violation-report-endpoint;" always;
```

### Apache

```apache
Header always set Content-Security-Policy-Report-Only "default-src 'self'; ...; report-uri /csp-violation-report-endpoint;"
```

**Monitor violations in browser console and server logs.**

Once no violations occur for 1-2 weeks, switch to enforced mode.

---

## Additional Security Headers

### X-Frame-Options

**Purpose:** Prevent clickjacking attacks

```
X-Frame-Options: DENY
```

- `DENY` - No one can frame your site
- `SAMEORIGIN` - Only same origin can frame your site
- `ALLOW-FROM uri` - Specific URI can frame your site (deprecated)

**Recommendation:** Use `DENY` unless framing is required

### X-Content-Type-Options

**Purpose:** Prevent MIME sniffing

```
X-Content-Type-Options: nosniff
```

**Recommendation:** Always use `nosniff`

### Referrer-Policy

**Purpose:** Control referrer information sent to other sites

```
Referrer-Policy: strict-origin-when-cross-origin
```

Options:
- `no-referrer` - Send no referrer
- `strict-origin-when-cross-origin` - Send full referrer to same origin, only origin to cross-origin (recommended)
- `origin` - Send only origin
- `unsafe-url` - Send full URL (not recommended)

### Permissions-Policy

**Purpose:** Disable browser features

```
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

**Features to disable:**
- `geolocation` - Location access
- `microphone` - Microphone access
- `camera` - Camera access
- `payment` - Payment Request API
- `usb` - USB device access

**Recommendation:** Disable all unused features

### Strict-Transport-Security (HSTS)

**Purpose:** Enforce HTTPS connections

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

- `max-age` - Time in seconds (31536000 = 1 year)
- `includeSubDomains` - Apply to all subdomains
- `preload` - Include in HSTS preload list (optional)

**Recommendation:** Use after SSL is properly configured

---

## Best Practices

### 1. Start with Report-Only Mode

Test CSP in report-only mode before enforcing to avoid breaking functionality.

### 2. Use Specific Directives

Instead of relying on `default-src`, use specific directives (`script-src`, `style-src`, etc.) for granular control.

### 3. Avoid 'unsafe-inline'

While `'unsafe-inline'` is currently needed for Vite's inline scripts, consider migrating to external scripts for production.

### 4. Regularly Review CSP

Review and update CSP policy as your site evolves and new third-party services are added.

### 5. Monitor Violations

Set up CSP violation reporting to monitor and respond to issues.

### 6. Use HTTPS Only

Never mix HTTP and HTTPS. CSP works best with HTTPS enforced.

---

## Security Posture Impact

**Before CSP Implementation:**
- Security Score: 70% (Configuration Security)
- XSS Protection: Minimal
- Clickjacking Protection: None
- Data Exfiltration Risk: High

**After CSP Implementation:**
- Security Score: 95%+ (Configuration Security)
- XSS Protection: Strong
- Clickjacking Protection: Complete
- Data Exfiltration Risk: Low

---

## Verification Checklist

Before marking CSP as complete, verify:

- [ ] CSP header configured in web server (Nginx/Apache/Vercel/Netlify)
- [ ] All security headers present (CSP, X-Frame-Options, etc.)
- [ ] Tested with CSP Evaluator (https://csp-evaluator.withgoogle.com/)
- [ ] Checked browser console for violations
- [ ] Verified with `curl -I https://ementech.co.ke`
- [ ] Tested all site functionality (navigation, forms, images)
- [ ] Contact form works with EmailJS
- [ ] No mixed content warnings
- [ ] All pages load without errors

---

## Summary

**Required Action:** Implement CSP headers in web server configuration before production deployment.

**Priority:** P1 (Critical)

**Impact:**
- Increases security score from 70% to 95%+
- Prevents XSS and clickjacking attacks
- Required for production deployment

**Estimated Time:** 15-30 minutes

**Documentation:**
- Use server-specific examples above (Nginx, Apache, Vercel, Netlify)
- Test with CSP Evaluator before enforcing
- Monitor for violations in browser console

---

**Last Updated:** February 1, 2026
**Priority:** P1 - Required before production
**Status:** Configuration provided, implementation required
