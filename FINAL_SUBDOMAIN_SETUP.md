# Final Subdomain Deployment Guide

## Architecture

- **mydomain.com** → Ementech corporate website (main domain)
- **greenrent.mydomain.com** → Green Rent application
- **smartbiz.mydomain.com** → SmartBiz application
- **baitech.co.ke** → Already live (no changes)

## DNS Configuration

Add these records at your domain registrar:

### Option A: A Records (Recommended)

```
Type: A    Name: @           Value: your-vps-ip    (for mydomain.com)
Type: A    Name: greenrent   Value: your-vps-ip
Type: A    Name: smartbiz    Value: your-vps-ip
```

### Option B: CNAME (if @ already points elsewhere)

```
Type: CNAME    Name: greenrent   Value: mydomain.com
Type: CNAME    Name: smartbiz    Value: mydomain.com
```

## Nginx Configuration

### 1. Ementech Website (Main Domain)

```bash
sudo nano /etc/nginx/sites-available/ementech-main
```

```nginx
# Ementech Corporate Website - Main Domain
server {
    listen 80;
    server_name mydomain.com www.mydomain.com;

    # Serve static files
    root /home/munen/website/ementech/dist;
    try_files $uri $uri/ /index.html;
    index index.html;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|webp)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Cache HTML files
    location ~* \.html$ {
        expires 1h;
        add_header Cache-Control "public, must-revalidate";
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_min_length 256;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/x-javascript
        application/xml
        application/xml+rss
        application/rss+xml
        image/svg+xml;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
```

### 2. Green Rent Subdomain

```bash
sudo nano /etc/nginx/sites-available/greenrent
```

```nginx
# Green Rent Application
server {
    listen 80;
    server_name greenrent.mydomain.com;

    # Serve frontend static files
    root /home/munen/website/green_rent/frontend/dist;
    try_files $uri $uri/ /index.html;
    index index.html;

    # API proxy to backend
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
}
```

### 3. SmartBiz Subdomain

```bash
sudo nano /etc/nginx/sites-available/smartbiz
```

```nginx
# SmartBiz Application
server {
    listen 80;
    server_name smartbiz.mydomain.com;

    # Serve frontend static files
    root /home/munen/website/smartbiz/smartbiz-v2/frontend/dist;
    try_files $uri $uri/ /index.html;
    index index.html;

    # API proxy to backend
    location /api {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
}
```

## Enable All Sites

```bash
# Enable main site
sudo ln -s /etc/nginx/sites-available/ementech-main /etc/nginx/sites-enabled/ementech-main

# Enable greenrent
sudo ln -s /etc/nginx/sites-available/greenrent /etc/nginx/sites-enabled/greenrent

# Enable smartbiz
sudo ln -s /etc/nginx/sites-available/smartbiz /etc/nginx/sites-enabled/smartbiz

# Remove default site
sudo rm -f /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
```

## Application Configuration

### Ementech Website (Main Domain)

No special configuration needed - it's static files!

```bash
cd ~/website/ementech
pnpm run build

# Output: dist/ folder
# Served by nginx at: mydomain.com
```

### Green Rent Configuration

**Backend .env:**
```bash
PORT=3001
NODE_ENV=production
MONGODB_URI=mongodb://localhost:27017/green_rent
FRONTEND_URL=https://greenrent.mydomain.com
```

**Frontend API config:**
```javascript
const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://greenrent.mydomain.com/api'
  : 'http://localhost:3001/api';
```

**Backend CORS** (can be minimal since same domain):
```javascript
app.use(cors());
```

### SmartBiz Configuration

**Backend .env:**
```bash
PORT=3002
NODE_ENV=production
DATABASE_URL=postgresql://smartbiz:password@localhost:5432/smartbiz
FRONTEND_URL=https://smartbiz.mydomain.com
```

**Frontend API config:**
```javascript
const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://smartbiz.mydomain.com/api'
  : 'http://localhost:3002/api';
```

## PM2 Configuration

```bash
cat > ~/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'green-rent',
      cwd: '/home/munen/website/green_rent',
      script: 'node',
      args: 'server.js',  // or index.js, app.js
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      }
    },
    {
      name: 'smartbiz',
      cwd: '/home/munen/website/smartbiz/smartbiz-v2',
      script: 'node',
      args: 'server.js',  // or index.js, app.js
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3002
      }
    }
  ]
};
EOF
```

## Deployment Steps

### Step 1: Build All Frontends

```bash
# Ementech website
cd ~/website/ementech
pnpm run build

# Green Rent frontend
cd ~/website/green_rent/frontend
npm run build

# SmartBiz frontend
cd ~/website/smartbiz/smartbiz-v2/frontend
npm run build
```

### Step 2: Configure DNS

At your domain registrar:
- Add A record for `@` pointing to your VPS IP
- Add A record for `greenrent` pointing to your VPS IP
- Add A record for `smartbiz` pointing to your VPS IP

### Step 3: Configure Nginx

Copy the nginx configs above and enable all sites

### Step 4: Start Backend Apps

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Step 5: Test All Sites

```bash
# Test main site
curl -I http://mydomain.com

# Test greenrent
curl -I http://greenrent.mydomain.com

# Test smartbiz
curl -I http://smartbiz.mydomain.com

# Check PM2
pm2 status

# Check nginx
sudo systemctl status nginx
```

### Step 6: Add SSL Certificates

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx -y

# Get certificates
sudo certbot --nginx -d mydomain.com -d www.mydomain.com
sudo certbot --nginx -d greenrent.mydomain.com
sudo certbot --nginx -d smartbiz.mydomain.com
```

## Final Structure

```
mydomain.com                  → Ementech corporate website
www.mydomain.com              → Ementech corporate website
greenrent.mydomain.com        → Green Rent app
smartbiz.mydomain.com         → SmartBiz app
baitech.co.ke                → Already live
```

## Verification Commands

```bash
# Check DNS
dig mydomain.com
dig greenrent.mydomain.com
dig smartbiz.mydomain.com

# Check nginx
sudo nginx -t
sudo systemctl status nginx

# Check PM2
pm2 status
pm2 logs

# Test all sites
curl -I https://mydomain.com
curl -I https://greenrent.mydomain.com
curl -I https://smartbiz.mydomain.com
```

## Benefits of This Setup

1. ✅ **Main domain** for corporate presence
2. ✅ **Subdomains** for each app
3. ✅ **No CORS issues** - Each app on its own domain
4. ✅ **Independent SSL** - Each has its own certificate
5. ✅ **Clean separation** - Apps don't interfere
6. ✅ **Professional** - Looks enterprise-grade

## Troubleshooting

### DNS Not Working

```bash
# Check DNS propagation
dig mydomain.com
dig greenrent.mydomain.com

# Can take 5-30 minutes to propagate
```

### Site Not Accessible

```bash
# Check nginx config
sudo nginx -t

# Check sites enabled
ls -la /etc/nginx/sites-enabled/

# Check nginx logs
sudo tail -f /var/log/nginx/error.log
```

### Backend Not Running

```bash
pm2 status
pm2 logs app-name
pm2 restart app-name
```

## Maintenance

### Update Ementech Website

```bash
cd ~/website/ementech
git pull
pnpm install
pnpm run build
# Updates immediately - no restart needed
```

### Update Green Rent

```bash
cd ~/website/green_rent
git pull
npm install
cd frontend
npm run build
pm2 restart green-rent
```

### Update SmartBiz

```bash
cd ~/website/smartbiz/smartbiz-v2
git pull
npm install
cd frontend
npm run build
pm2 restart smartbiz
```

## Summary

**Your complete setup:**
- Main domain for corporate website
- Subdomains for each application
- No CORS configuration needed
- Independent SSL certificates
- Clean, professional architecture

This is the **optimal setup** for your VPS! 🚀
