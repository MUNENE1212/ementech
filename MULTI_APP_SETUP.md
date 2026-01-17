# Complete Multi-App Nginx Configuration Guide

## Overview

Your VPS will serve multiple apps through Nginx:
- **Main site**: `/` → Ementech website (static files)
- **Green Rent**: `/green_rent` → Port 3001
- **SmartBiz**: `/smartbiz` → Port 3002
- **BAITECH**: `/baitech` → Port 3003
- **Dumu Waks**: `/dumuwaks` → External redirect

## Step 1: Configure Each App's Port & Environment

### Green Rent Configuration

```bash
cd ~/website/green_rent  # or wherever green_rent is

# Create/update .env file
cat > .env << 'EOF'
# Server
PORT=3001
NODE_ENV=production

# Database
MONGODB_URI=mongodb://localhost:27017/green_rent

# CORS - Allow your domain
FRONTEND_URL=https://yourdomain.com
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# API URL (for frontend)
API_URL=https://yourdomain.com/green_rent/api
EOF

# Update backend to use PORT from env
# In your main server file (app.js or index.js):
const PORT = process.env.PORT || 3001;

# Update CORS configuration
# Add this to your backend:
const cors = require('cors');

app.use(cors({
  origin: [
    'https://yourdomain.com',
    'https://www.yourdomain.com',
    'http://localhost:3000',
    'http://localhost:3001'
  ],
  credentials: true
}));

// Or with Express CORS:
app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = [
      'https://yourdomain.com',
      'https://www.yourdomain.com'
    ];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed'));
    }
  },
  credentials: true
}));
```

### SmartBiz Configuration

```bash
cd ~/website/smartbiz/smartbiz-v2  # or wherever smartbiz is

# Create/update .env file
cat > .env << 'EOF'
# Server
PORT=3002
NODE_ENV=production

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/smartbiz

# CORS
FRONTEND_URL=https://yourdomain.com
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# API URL
API_URL=https://yourdomain.com/smartbiz/api
EOF

# Update backend CORS (same as Green Rent above)
# Use PORT=3002
```

### BAITECH Configuration

```bash
cd ~/website/newbaitech  # or wherever baitech is

# Next.js uses next.config.js for rewrites
cat > next.config.ts << 'EOF'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  env: {
    NEXT_PUBLIC_API_URL: 'https://yourdomain.com/baitech/api',
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ];
  },
}

export default nextConfig
EOF

# Create .env.local
cat > .env.local << 'EOF'
# Database
MONGODB_URI=mongodb://localhost:27017/baitech

# Next.js
PORT=3003
NODE_ENV=production

# CORS is handled by Next.js automatically
NEXT_PUBLIC_URL=https://yourdomain.com/baitech
EOF

# Build Next.js app
pnpm run build
```

## Step 2: Update Frontend API Calls

For each app, update API calls to use the new nginx paths:

### Green Rent Frontend

```javascript
// In your React frontend, update API base URL:
const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://yourdomain.com/green_rent/api'
  : 'http://localhost:3001/api';

// Example API call:
fetch(`${API_BASE_URL}/properties`)
  .then(res => res.json())
  .then(data => console.log(data));
```

### SmartBiz Frontend

```javascript
// Update API base URL:
const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://yourdomain.com/smartbiz/api'
  : 'http://localhost:3002/api';
```

### BAITECH (Next.js)

```javascript
// Already configured via next.config.ts
// Use fetch('/api/endpoint') - Next.js handles it
```

## Step 3: Complete Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/ementech
```

Paste this complete config:

```nginx
# Rate limiting zone
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

# Upstream servers
upstream green_rent_backend {
    server localhost:3001;
}

upstream smartbiz_backend {
    server localhost:3002;
}

upstream baitech_backend {
    server localhost:3003;
}

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Main Ementech Website
    location / {
        root /home/munen/website/ementech/dist;
        try_files $uri $uri/ /index.html;
        index index.html;

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Green Rent Application
    location /green_rent {
        proxy_pass http://green_rent_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # CORS headers
        add_header 'Access-Control-Allow-Origin' 'https://yourdomain.com' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;
        add_header 'Access-Control-Expose-Headers' 'Content-Length,Content-Range' always;

        # Handle OPTIONS
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' 'https://yourdomain.com';
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS';
            add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization';
            add_header 'Access-Control-Max-Age' 1728000;
            add_header 'Content-Type' 'text/plain; charset=utf-8';
            add_header 'Content-Length' 0;
            return 204;
        }
    }

    # SmartBiz Application
    location /smartbiz {
        proxy_pass http://smartbiz_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # CORS headers
        add_header 'Access-Control-Allow-Origin' 'https://yourdomain.com' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;

        # Handle OPTIONS
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' 'https://yourdomain.com';
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS';
            add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization';
            add_header 'Access-Control-Max-Age' 1728000;
            add_header 'Content-Type' 'text/plain; charset=utf-8';
            add_header 'Content-Length' 0;
            return 204;
        }
    }

    # BAITECH Application
    location /baitech {
        proxy_pass http://baitech_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # CORS headers
        add_header 'Access-Control-Allow-Origin' 'https://yourdomain.com' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;

        # Handle OPTIONS
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' 'https://yourdomain.com';
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS';
            add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization';
            add_header 'Access-Control-Max-Age' 1728000;
            add_header 'Content-Type' 'text/plain; charset=utf-8';
            add_header 'Content-Length' 0;
            return 204;
        }
    }

    # Dumu Waks - External Redirect
    location /dumuwaks {
        return 301 https://ementech-frontend.onrender.com;
    }

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/rss+xml
        font/truetype
        font/opentype
        application/vnd.ms-fontobject
        image/svg+xml;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
}
```

## Step 4: Start All Apps with Process Manager

### Install PM2 (Process Manager)

```bash
# Install PM2 globally
sudo npm install -g pm2

# Or with pnpm
pnpm add -g pm2
```

### Create PM2 Ecosystem File

```bash
cd ~
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'green-rent',
      cwd: '/home/munen/website/green_rent',
      script: 'node',
      args: 'server.js',  // or 'index.js' or 'app.js' - check your project
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      }
    },
    {
      name: 'smartbiz',
      cwd: '/home/munen/website/smartbiz/smartbiz-v2',
      script: 'node',
      args: 'server.js',  // check your project
      env: {
        NODE_ENV: 'production',
        PORT: 3002
      }
    },
    {
      name: 'baitech',
      cwd: '/home/munen/website/newbaitech',
      script: 'node',
      args: 'node_modules/.bin/next',
      args: 'start -p 3003',
      env: {
        NODE_ENV: 'production',
        PORT: 3003
      }
    }
  ]
};
EOF
```

### Start All Apps with PM2

```bash
# Start all apps
pm2 start ecosystem.config.js

# Save PM2 config
pm2 save

# Setup PM2 to start on reboot
pm2 startup
# Follow the command it outputs (copy and paste it)

# Check status
pm2 status

# View logs
pm2 logs

# Monitor
pm2 monit
```

## Step 5: Configure Database Servers

### MongoDB Setup (if needed)

```bash
# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update
sudo apt install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Verify
sudo systemctl status mongod

# Create databases (they're created automatically)
```

### PostgreSQL Setup (if needed)

```bash
# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create databases
sudo -u postgres psql
CREATE DATABASE smartbiz;
CREATE USER smartbiz_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE smartbiz TO smartbiz_user;
\q
```

## Step 6: Test Everything

```bash
# Test each app is running
curl http://localhost:3001
curl http://localhost:3002
curl http://localhost:3003

# Check PM2 status
pm2 status

# Check nginx config
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx

# Test in browser
# https://yourdomain.com
# https://yourdomain.com/green_rent
# https://yourdomain.com/smartbiz
# https://yourdomain.com/baitech
```

## Step 7: SSL Certificate

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

## Common Issues & Solutions

### CORS Errors

**Problem**: Frontend can't access backend API
**Solution**:
1. Check nginx CORS headers are set
2. Check backend CORS allows your domain
3. Check frontend uses correct API URL

### 502 Bad Gateway

**Problem**: App not running on expected port
**Solution**:
```bash
pm2 status
pm2 logs app-name
# Check PORT in .env file matches nginx config
```

### 404 Not Found

**Problem**: Route not found
**Solution**:
- Check location path in nginx matches your intended path
- Check backend routes don't include prefix (e.g., `/api/properties` not `/green_rent/api/properties`)

### Proxy Issues

**Problem**: Static files not loading
**Solution**: Ensure nginx handles static files, not the backend app

## Maintenance Commands

```bash
# Update an app
cd ~/website/app-name
git pull
pnpm install
pnpm run build
pm2 restart app-name

# Update nginx config
sudo nano /etc/nginx/sites-available/ementech
sudo nginx -t
sudo systemctl reload nginx

# View logs
pm2 logs
sudo tail -f /var/log/nginx/error.log

# Restart everything
pm2 restart all
sudo systemctl restart nginx
```

## Summary

Your setup will be:
- **Ementech Website**: Static files served by nginx
- **Green Rent**: Port 3001, accessed via `/green_rent`
- **SmartBiz**: Port 3002, accessed via `/smartbiz`
- **BAITECH**: Port 3003, accessed via `/baitech`
- **Dumu Waks**: Redirected to external URL

All with proper CORS, SSL, and process management!
