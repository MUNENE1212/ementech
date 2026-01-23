# Nginx Multi-Application Configuration

**Purpose**: Complete Nginx configuration for hosting multiple applications on a single VPS
**Last Updated**: 2026-01-21
**Status**: Ready for Implementation

---

## Table of Contents

1. [Main Nginx Configuration](#main-nginx-configuration)
2. [Security Configuration](#security-configuration)
3. [SSL Configuration](#ssl-configuration)
4. [Rate Limiting Configuration](#rate-limiting-configuration)
5. [Site-Specific Configurations](#site-specific-configurations)
6. [Implementation Steps](#implementation-steps)

---

## Main Nginx Configuration

**File**: `/etc/nginx/nginx.conf`

```nginx
user www-data;
worker_processes auto;
pid /run/nginx.pid;
error_log /var/log/nginx/error.log;

# Load dynamic modules
include /etc/nginx/modules-enabled/*.conf;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    ##
    # Basic Settings
    ##
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    server_tokens off;

    # Increase buffer sizes for large headers
    client_body_buffer_size 128k;
    client_max_body_size 10M;
    client_header_buffer_size 1k;
    large_client_header_buffers 4 4k;

    ##
    # MIME Types
    ##
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    ##
    # SSL Settings
    ##
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    ##
    # Logging Settings
    ##
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for" '
                    'rt=$request_time uct="$upstream_connect_time" '
                    'uht="$upstream_header_time" urt="$upstream_response_time"';

    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log warn;

    ##
    # Gzip Settings
    ##
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript
               application/json application/javascript application/xml+rss
               application/rss+xml font/truetype font/opentype
               application/vnd.ms-fontobject image/svg+xml;
    gzip_disable "msie6";

    ##
    # Virtual Host Configs
    ##
    include /etc/nginx/conf.d/*.conf;
    include /etc/nginx/sites-enabled/*;
}
```

---

## Security Configuration

**File**: `/etc/nginx/conf.d/security.conf`

```nginx
# Security Headers

# Prevent clickjacking
add_header X-Frame-Options "SAMEORIGIN" always;

# Prevent MIME type sniffing
add_header X-Content-Type-Options "nosniff" always;

# Enable XSS filter
add_header X-XSS-Protection "1; mode=block" always;

# Referrer policy
add_header Referrer-Policy "strict-origin-when-cross-origin" always;

# Content Security Policy (adjust based on your needs)
add_header Content-Security-Policy "default-src 'self' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:; font-src 'self' data: https:; connect-src 'self' https: wss:; frame-ancestors 'self';" always;

# HSTS (HTTP Strict Transport Security)
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

# Permissions Policy (formerly Feature-Policy)
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;

# Remove server version
server_tokens off;

# Hide Nginx version
more_clear_headers Server;
```

---

## SSL Configuration

**File**: `/etc/nginx/conf.d/ssl.conf`

```nginx
# SSL Configuration

# Session cache
ssl_session_cache shared:SSL:50m;
ssl_session_timeout 1d;
ssl_session_tickets off;

# Modern protocols
ssl_protocols TLSv1.2 TLSv1.3;

# Strong ciphers
ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384';
ssl_prefer_server_ciphers off;

# OCSP Stapling
ssl_stapling on;
ssl_stapling_verify on;

# DNS resolver for OCSP
resolver 8.8.8.8 8.8.4.4 valid=300s;
resolver_timeout 5s;

# Trusted certificate chain
ssl_trusted_certificate /etc/letsencrypt/live/ementech.co.ke/chain.pem;
```

---

## Rate Limiting Configuration

**File**: `/etc/nginx/conf.d/rate-limit.conf`

```nginx
# Rate Limiting Zones

# General API rate limit (10 requests per second)
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

# Authentication endpoints (5 requests per minute)
limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=5r/m;

# Upload endpoints (2 requests per second)
limit_req_zone $binary_remote_addr zone=upload_limit:10m rate=2r/s;

# Connection limit per IP (10 simultaneous connections)
limit_conn_zone $binary_remote_addr zone=conn_limit:10m;

# Burst allowance for normal traffic
limit_req_zone $binary_remote_addr zone=burst_limit:10m rate=20r/s;
```

---

## Site-Specific Configurations

### Ementech Website

**File**: `/etc/nginx/sites-available/ementech.co.ke.conf`

```nginx
# HTTP to HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name ementech.co.ke www.ementech.co.ke;

    # Redirect all HTTP requests to HTTPS
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ementech.co.ke www.ementech.co.ke;

    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/ementech.co.ke/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ementech.co.ke/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/ementech.co.ke/chain.pem;

    # Include security configurations
    include /etc/nginx/conf.d/security.conf;
    include /etc/nginx/conf.d/ssl.conf;

    # Logs
    access_log /var/log/nginx/ementech.access.log main;
    error_log /var/log/nginx/ementech.error.log warn;

    # Root directory for static files
    root /var/www/ementech-website/current;
    index index.html;

    # Client body size limit (for file uploads)
    client_max_body_size 10M;

    # API proxy configuration
    location /api/ {
        # Rate limiting
        limit_req zone=api_limit burst=20 nodelay;
        limit_conn conn_limit 10;

        # Proxy to backend
        proxy_pass http://localhost:5001;

        # Proxy headers
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # Buffering
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
        proxy_busy_buffers_size 8k;

        # Cache bypass for API requests
        proxy_cache_bypass $http_upgrade;
    }

    # Socket.IO proxy configuration (WebSocket)
    location /socket.io/ {
        # Proxy to backend
        proxy_pass http://localhost:5001;

        # WebSocket headers
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket timeouts
        proxy_connect_timeout 7d;
        proxy_send_timeout 7d;
        proxy_read_timeout 7d;

        # Disable buffering for WebSocket
        proxy_buffering off;
    }

    # Static assets caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    # Frontend fallback (SPA routing)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Deny access to hidden files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}
```

### Dumuwaks Application

**File**: `/etc/nginx/sites-available/dumuwaks.ementech.co.ke.conf`

```nginx
# HTTP to HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name dumuwaks.ementech.co.ke app.dumuwaks.ementech.co.ke api.dumuwaks.ementech.co.ke;

    # Redirect all HTTP requests to HTTPS
    return 301 https://dumuwaks.ementech.co.ke$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name dumuwaks.ementech.co.ke;

    # SSL certificates (using multi-domain certificate)
    ssl_certificate /etc/letsencrypt/live/ementech.co.ke/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ementech.co.ke/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/ementech.co.ke/chain.pem;

    # Include security configurations
    include /etc/nginx/conf.d/security.conf;
    include /etc/nginx/conf.d/ssl.conf;

    # Logs
    access_log /var/log/nginx/dumuwaks.access.log main;
    error_log /var/log/nginx/dumuwaks.error.log warn;

    # Root directory for static files
    root /var/www/dumuwaks/current;
    index index.html;

    # Client body size limit (for job images, documents)
    client_max_body_size 20M;

    # API proxy configuration
    location /api/ {
        # Rate limiting
        limit_req zone=api_limit burst=20 nodelay;
        limit_conn conn_limit 10;

        # Proxy to backend
        proxy_pass http://localhost:5000;

        # Proxy headers
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # Buffering
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
        proxy_busy_buffers_size 8k;

        # Cache bypass
        proxy_cache_bypass $http_upgrade;
    }

    # Socket.IO proxy for job booking notifications
    location /socket.io/ {
        # Proxy to backend
        proxy_pass http://localhost:5000;

        # WebSocket headers
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket timeouts
        proxy_connect_timeout 7d;
        proxy_send_timeout 7d;
        proxy_read_timeout 7d;

        # Disable buffering
        proxy_buffering off;
    }

    # File upload endpoint (larger limit)
    location /api/upload {
        # Rate limiting for uploads
        limit_req zone=upload_limit burst=5 nodelay;

        # Proxy to backend
        proxy_pass http://localhost:5000;

        # Proxy headers
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Content-Type $content_type;

        # Extended timeout for uploads
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;

        # Disable buffering for uploads
        proxy_buffering off;
        proxy_request_buffering off;
    }

    # Authentication endpoints (stricter rate limiting)
    location ~ ^/api/(auth|login|register) {
        # Stricter rate limiting for auth
        limit_req zone=auth_limit burst=5 nodelay;

        # Proxy to backend
        proxy_pass http://localhost:5000;

        # Proxy headers
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static assets caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # User-uploaded content
    location /uploads/ {
        alias /var/www/dumuwaks/shared/uploads/;
        expires 30d;
        add_header Cache-Control "public";
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    # Frontend fallback (SPA routing)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Deny access to hidden files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}
```

### Admin Dashboard

**File**: `/etc/nginx/sites-available/admin.ementech.co.ke.conf`

```nginx
# HTTP to HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name admin.ementech.co.ke;

    # Redirect all HTTP requests to HTTPS
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name admin.ementech.co.ke;

    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/ementech.co.ke/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ementech.co.ke/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/ementech.co.ke/chain.pem;

    # Include security configurations
    include /etc/nginx/conf.d/security.conf;
    include /etc/nginx/conf.d/ssl.conf;

    # Additional security for admin panel
    add_header X-Frame-Options "DENY" always;

    # Logs
    access_log /var/log/nginx/admin.access.log main;
    error_log /var/log/nginx/admin.error.log warn;

    # Root directory for static files
    root /var/www/admin-dashboard/current;
    index index.html;

    # Client body size limit
    client_max_body_size 10M;

    # API proxy configuration
    location /api/ {
        # Rate limiting
        limit_req zone=api_limit burst=10 nodelay;
        limit_conn conn_limit 5;

        # Proxy to backend
        proxy_pass http://localhost:3001;

        # Proxy headers
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # Buffering
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;

        # Cache bypass
        proxy_cache_bypass $http_upgrade;
    }

    # Socket.IO proxy for real-time monitoring
    location /socket.io/ {
        # Proxy to backend
        proxy_pass http://localhost:3001;

        # WebSocket headers
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket timeouts
        proxy_connect_timeout 7d;
        proxy_send_timeout 7d;
        proxy_read_timeout 7d;

        # Disable buffering
        proxy_buffering off;
    }

    # Static assets caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    # Frontend fallback (SPA routing)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Deny access to hidden files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }

    # Optional: IP whitelist for admin access
    # Uncomment and configure if needed
    # allow 192.168.1.0/24;
    # allow YOUR_IP_ADDRESS;
    # deny all;
}
```

---

## Implementation Steps

### 1. Create Configuration Files

```bash
# Create conf.d directory if it doesn't exist
sudo mkdir -p /etc/nginx/conf.d

# Create configuration files
sudo nano /etc/nginx/nginx.conf
sudo nano /etc/nginx/conf.d/security.conf
sudo nano /etc/nginx/conf.d/ssl.conf
sudo nano /etc/nginx/conf.d/rate-limit.conf
```

### 2. Create Site Configurations

```bash
# Create site-specific configurations
sudo nano /etc/nginx/sites-available/ementech.co.ke.conf
sudo nano /etc/nginx/sites-available/dumuwaks.ementech.co.ke.conf
sudo nano /etc/nginx/sites-available/admin.ementech.co.ke.conf
```

### 3. Enable Sites

```bash
# Remove default site (if exists)
sudo rm -f /etc/nginx/sites-enabled/default

# Create symlinks to enable sites
sudo ln -s /etc/nginx/sites-available/ementech.co.ke.conf /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/dumuwaks.ementech.co.ke.conf /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/admin.ementech.co.ke.conf /etc/nginx/sites-enabled/
```

### 4. Test Configuration

```bash
# Test nginx configuration syntax
sudo nginx -t

# Expected output:
# nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### 5. Obtain SSL Certificates

```bash
# Obtain certificates for all domains
sudo certbot --nginx -d ementech.co.ke -d www.ementech.co.ke
sudo certbot --nginx -d dumuwaks.ementech.co.ke
sudo certbot --nginx -d admin.ementech.co.ke

# Or obtain a single certificate for all domains (recommended)
sudo certbot --nginx \
  -d ementech.co.ke \
  -d www.ementech.co.ke \
  -d mail.ementech.co.ke \
  -d dumuwaks.ementech.co.ke \
  -d app.dumuwaks.ementech.co.ke \
  -d api.dumuwaks.ementech.co.ke \
  -d admin.ementech.co.ke
```

### 6. Create Log Directories

```bash
# Create application-specific log directories
sudo mkdir -p /var/log/applications/ementech
sudo mkdir -p /var/log/applications/dumuwaks
sudo mkdir -p /var/log/applications/admin
sudo chown -R www-data:www-data /var/log/applications
```

### 7. Restart Nginx

```bash
# Check nginx status
sudo systemctl status nginx

# Test reload (graceful restart)
sudo nginx -t && sudo systemctl reload nginx

# If issues occur, full restart
sudo systemctl restart nginx

# Enable nginx on boot
sudo systemctl enable nginx
```

### 8. Verify Configuration

```bash
# Check if nginx is listening on correct ports
sudo netstat -tlnp | grep nginx

# Test HTTP to HTTPS redirect
curl -I http://ementech.co.ke
curl -I http://dumuwaks.ementech.co.ke

# Test HTTPS access
curl -I https://ementech.co.ke
curl -I https://dumuwaks.ementech.co.ke

# Check SSL certificates
sudo certbot certificates

# Test API proxy
curl https://ementech.co.ke/api/health
curl https://dumuwaks.ementech.co.ke/api/health
curl https://admin.ementech.co.ke/api/health
```

### 9. Configure Log Rotation

```bash
# Create logrotate configuration for nginx logs
sudo nano /etc/logrotate.d/nginx-apps
```

Content:
```
/var/log/nginx/*/*.log
/var/log/applications/*/*.log
{
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    create 0640 www-data adm
    sharedscripts
    prerotate
        # Optional: Run custom script before rotation
    endscript
    postrotate
        [ -f /var/run/nginx.pid ] && kill -USR1 `cat /var/run/nginx.pid`
    endscript
}
```

### 10. Monitor Logs

```bash
# Watch access logs
sudo tail -f /var/log/nginx/ementech.access.log

# Watch error logs
sudo tail -f /var/log/nginx/ementech.error.log

# Check all nginx logs
sudo tail -f /var/log/nginx/*.log
```

---

## Troubleshooting

### Common Issues

**1. 502 Bad Gateway**
```bash
# Check if backend is running
pm2 list

# Check backend port
sudo netstat -tlnp | grep -E '(5000|5001|3001)'

# Check nginx error log
sudo tail -f /var/log/nginx/error.log
```

**2. SSL Certificate Error**
```bash
# Check certificate status
sudo certbot certificates

# Renew certificate
sudo certbot renew

# Reload nginx
sudo systemctl reload nginx
```

**3. Configuration Syntax Error**
```bash
# Test configuration
sudo nginx -t

# Check for syntax errors
# Fix reported errors and test again
```

**4. Permission Denied**
```bash
# Check file permissions
ls -la /var/www/ementech-website/current

# Fix permissions
sudo chown -R www-data:www-data /var/www/ementech-website/current
sudo chmod -R 755 /var/www/ementech-website/current
```

**5. WebSocket Not Working**
```bash
# Check Socket.IO proxy configuration
# Ensure upgrade headers are set correctly
# Verify nginx is not buffering WebSocket connections

# Check nginx error log for WebSocket issues
sudo tail -f /var/log/nginx/error.log | grep -i websocket
```

---

**Configuration Status**: ✅ Ready for Implementation
**Priority**: Critical
**Dependencies**: SSL certificates must be obtained before enabling HTTPS configurations
