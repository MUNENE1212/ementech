# Ementech + 2 Apps Deployment Guide

## Overview

Deploying on your VPS:
- **Ementech Website**: Main site at `/`
- **Green Rent**: `/green_rent` → Port 3001
- **SmartBiz**: `/smartbiz` → Port 3002
- **BAITECH**: Already live at baitech.co.ke (redirect or separate)

## Part 1: Green Rent Configuration

### Backend Setup

```bash
cd ~/website/green_rent  # Adjust path to your location

# Update .env
cat > .env << 'EOF'
# Server Configuration
PORT=3001
NODE_ENV=production

# Database
MONGODB_URI=mongodb://localhost:27017/green_rent

# CORS - Critical for nginx
FRONTEND_URL=https://yourdomain.com
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# API Configuration
API_URL=https://yourdomain.com/green_rent/api
EOF
```

### Update Backend CORS (Green Rent)

Find your main server file (likely `server.js`, `app.js`, or `index.js`):

```javascript
// Add CORS configuration
const cors = require('cors');

// BEFORE your routes, add:
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      'https://yourdomain.com',
      'https://www.yourdomain.com',
      'http://localhost:3000',
      'http://localhost:3001'
    ];

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Handle preflight requests
app.options('*', cors());
```

### Frontend Setup (Green Rent)

Update API base URL in your React frontend:

```javascript
// src/config/api.js or similar
const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://yourdomain.com/green_rent/api'
  : 'http://localhost:3001/api';

export default API_BASE_URL;

// Usage in components:
import API_BASE_URL from './config/api';

fetch(`${API_BASE_URL}/properties`)
  .then(res => res.json())
  .then(data => console.log(data));
```

## Part 2: SmartBiz Configuration

### Backend Setup

```bash
cd ~/website/smartbiz/smartbiz-v2  # Adjust path

# Update .env
cat > .env << 'EOF'
# Server Configuration
PORT=3002
NODE_ENV=production

# Database
DATABASE_URL=postgresql://smartbiz:password@localhost:5432/smartbiz

# CORS Configuration
FRONTEND_URL=https://yourdomain.com
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# API Configuration
API_URL=https://yourdomain.com/smartbiz/api
EOF
```

### Update Backend CORS (SmartBiz)

Same CORS configuration as Green Rent:

```javascript
const cors = require('cors');

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      'https://yourdomain.com',
      'https://www.yourdomain.com',
      'http://localhost:3000',
      'http://localhost:3002'
    ];

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.options('*', cors());
```

### Frontend Setup (SmartBiz)

```javascript
// src/config/api.js
const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://yourdomain.com/smartbiz/api'
  : 'http://localhost:3002/api';

export default API_BASE_URL;
```

## Part 3: Complete Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/ementech
```

Paste this configuration:

```nginx
# Upstream servers (backend apps)
upstream green_rent_backend {
    server localhost:3001;
    keepalive 64;
}

upstream smartbiz_backend {
    server localhost:3002;
    keepalive 64;
}

# Main server block
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # =====================================================
    # MAIN EMENTECH WEBSITE (Static Files)
    # =====================================================
    location / {
        root /home/munen/website/ementech/dist;
        try_files $uri $uri/ /index.html;
        index index.html;

        # Cache static assets aggressively
        location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|webp)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            access_log off;
        }

        # Cache HTML files for shorter time
        location ~* \.html$ {
            expires 1h;
            add_header Cache-Control "public, must-revalidate";
        }
    }

    # =====================================================
    # GREEN RENT APPLICATION
    # =====================================================
    location /green_rent {
        # Proxy to backend
        proxy_pass http://green_rent_backend;

        # WebSocket support (if needed)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';

        # Standard proxy headers
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # CORS headers (for preflight)
        add_header 'Access-Control-Allow-Origin' 'https://yourdomain.com' always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;

        # Handle OPTIONS preflight requests
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' 'https://yourdomain.com';
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS';
            add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization';
            add_header 'Access-Control-Max-Age' 1728000;
            add_header 'Content-Type' 'text/plain; charset=utf-8';
            add_header 'Content-Length' 0;
            return 204;
        }

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # =====================================================
    # SMARTBIZ APPLICATION
    # =====================================================
    location /smartbiz {
        # Proxy to backend
        proxy_pass http://smartbiz_backend;

        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';

        # Standard proxy headers
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # CORS headers
        add_header 'Access-Control-Allow-Origin' 'https://yourdomain.com' always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;

        # Handle OPTIONS preflight
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' 'https://yourdomain.com';
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS';
            add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization';
            add_header 'Access-Control-Max-Age' 1728000;
            add_header 'Content-Type' 'text/plain; charset=utf-8';
            add_header 'Content-Length' 0;
            return 204;
        }

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # =====================================================
    # BAITECH - Redirect to Live Site
    # =====================================================
    location /baitech {
        return 301 https://baitech.co.ke;
    }

    # =====================================================
    # DUMU WAKS - Redirect to Live Site
    # =====================================================
    location /dumuwaks {
        return 301 https://ementech-frontend.onrender.com;
    }

    # =====================================================
    # GLOBAL SETTINGS
    # =====================================================
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
        font/truetype
        font/opentype
        application/vnd.ms-fontobject
        image/svg+xml;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
```

## Part 4: PM2 Configuration

```bash
cd ~
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'green-rent',
      cwd: '/home/munen/website/green_rent',
      script: 'node',
      args: 'server.js',  // Change to your entry file: app.js, index.js, etc.
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
      args: 'server.js',  // Change to your entry file
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

## Part 5: Deployment Steps

### Step 1: Install Dependencies

```bash
# Green Rent
cd ~/website/green_rent
npm install  # or pnpm install

# SmartBiz
cd ~/website/smartbiz/smartbiz-v2
npm install  # or pnpm install
```

### Step 2: Build Frontends

```bash
# Green Rent frontend
cd ~/website/green_rent/frontend
npm run build

# SmartBiz frontend
cd ~/website/smartbiz/smartbiz-v2/frontend
npm run build
```

### Step 3: Start Backend Apps with PM2

```bash
# Install PM2
sudo npm install -g pm2

# Start apps
cd ~
pm2 start ecosystem.config.js

# Check status
pm2 status

# View logs
pm2 logs

# Save configuration
pm2 save

# Setup startup script
pm2 startup
# Copy and paste the command it outputs
```

### Step 4: Configure Nginx

```bash
# Copy the nginx config above to:
sudo nano /etc/nginx/sites-available/ementech

# Create symlink
sudo ln -s /etc/nginx/sites-available/ementech /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
```

### Step 5: Test Everything

```bash
# Test backend apps directly
curl http://localhost:3001
curl http://localhost:3002

# Check PM2
pm2 status

# Test nginx
sudo systemctl status nginx

# Test in browser
# https://yourdomain.com
# https://yourdomain.com/green_rent
# https://yourdomain.com/smartbiz
# https://yourdomain.com/baitech (should redirect)
```

## Part 6: SSL Certificate

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Follow prompts - choose redirect to HTTPS

# Test auto-renewal
sudo certbot renew --dry-run
```

## Troubleshooting

### Issue: CORS Errors

**Symptoms**: Browser console shows CORS errors
**Solution**:
1. Check backend CORS allows your domain
2. Check nginx CORS headers are set
3. Clear browser cache
4. Check frontend uses correct API URL

### Issue: 502 Bad Gateway

**Symptoms**: Can't reach backend
**Solution**:
```bash
pm2 status
pm2 logs green-rent
pm2 logs smartbiz
# Check PORT in .env matches nginx upstream
```

### Issue: 404 on API Routes

**Symptoms**: API calls return 404
**Solution**:
- Frontend: Use `/green_rent/api/endpoint`
- Backend: Routes should be `/api/endpoint` (not `/green_rent/api/endpoint`)

### Issue: Static Files Not Loading

**Symptoms**: CSS/JS not loading
**Solution**:
- Check nginx root path is correct
- Check file permissions: `chmod -R 755`
- Check nginx error logs: `sudo tail -f /var/log/nginx/error.log`

## Maintenance

### Update an App

```bash
cd ~/website/app-name
git pull origin main
npm install
npm run build  # if has frontend
pm2 restart app-name
```

### Update Nginx Config

```bash
sudo nano /etc/nginx/sites-available/ementech
sudo nginx -t
sudo systemctl reload nginx
```

### View Logs

```bash
# PM2 logs
pm2 logs

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## Summary

**Your Setup:**
- Main site: `https://yourdomain.com/`
- Green Rent: `https://yourdomain.com/green_rent`
- SmartBiz: `https://yourdomain.com/smartbiz`
- BAITECH: Redirects to `https://baitech.co.ke`
- Dumu Waks: Redirects to live site

**Key Points:**
- Each app runs on unique port (3001, 3002)
- CORS configured in backend AND nginx
- PM2 manages backend processes
- Nginx handles routing and SSL
- All apps accessible via single domain
