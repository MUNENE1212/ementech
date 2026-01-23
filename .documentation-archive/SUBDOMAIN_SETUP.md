# Subdomain Deployment Guide

## Architecture

Using subdomains for complete separation:
- **ementech.mydomain.com** → Ementech corporate website
- **greenrent.mydomain.com** → Green Rent application
- **smartbiz.mydomain.com** → SmartBiz application
- **baitech.co.ke** → Already live (no changes needed)

## Advantages of Subdomains

✅ **No CORS issues** - Each app is on its own domain
✅ **Clean separation** - Apps don't interfere with each other
✅ **Independent SSL** - Each can have own certificate (or use wildcard)
✅ **Simpler routing** - No path conflicts
✅ **Better isolation** - Security and performance benefits

## DNS Configuration

### Step 1: Add DNS Records

Go to your domain registrar (where you bought mydomain.com) and add these **A Records**:

```
Type: A
Name: ementech
Value: your-vps-ip-address
TTL: 3600

Type: A
Name: greenrent
Value: your-vps-ip-address
TTL: 3600

Type: A
Name: smartbiz
Value: your-vps-ip-address
TTL: 3600
```

Or if using **CNAME** (if you have ementech.mydomain.com already pointing):
```
Type: CNAME
Name: greenrent
Value: ementech.mydomain.com

Type: CNAME
Name: smartbiz
Value: ementech.mydomain.com
```

**Wait time**: DNS can take 5-30 minutes to propagate

### Verify DNS

```bash
# Check if DNS is working
nslookup ementech.mydomain.com
nslookup greenrent.mydomain.com
nslookup smartbiz.mydomain.com

# Or
dig ementech.mydomain.com
dig greenrent.mydomain.com
```

## Nginx Configuration

### Option A: Separate Server Blocks (Recommended)

Create three separate nginx config files:

#### 1. Ementech Website Config

```bash
sudo nano /etc/nginx/sites-available/ementech
```

```nginx
server {
    listen 80;
    server_name ementech.mydomain.com;

    # Serve static files
    root /home/munen/website/ementech/dist;
    try_files $uri $uri/ /index.html;
    index index.html;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
}
```

#### 2. Green Rent Config

```bash
sudo nano /etc/nginx/sites-available/greenrent
```

```nginx
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
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
}
```

#### 3. SmartBiz Config

```bash
sudo nano /etc/nginx/sites-available/smartbiz
```

```nginx
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
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
}
```

### Enable All Sites

```bash
# Enable ementech
sudo ln -s /etc/nginx/sites-available/ementech /etc/nginx/sites-enabled/

# Enable greenrent
sudo ln -s /etc/nginx/sites-available/greenrent /etc/nginx/sites-enabled/

# Enable smartbiz
sudo ln -s /etc/nginx/sites-available/smartbiz /etc/nginx/sites-enabled/

# Remove default
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
```

## Application Configuration

With subdomains, **NO CORS configuration needed**! Each app is on its own domain.

### Green Rent Configuration

**Backend (.env):**
```bash
PORT=3001
NODE_ENV=production

# Database
MONGODB_URI=mongodb://localhost:27017/green_rent

# Frontend URL (for cookies, etc.)
FRONTEND_URL=https://greenrent.mydomain.com

# No CORS needed - same domain!
```

**Frontend (API configuration):**
```javascript
const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://greenrent.mydomain.com/api'
  : 'http://localhost:3001/api';
```

### SmartBiz Configuration

**Backend (.env):**
```bash
PORT=3002
NODE_ENV=production

# Database
DATABASE_URL=postgresql://smartbiz:password@localhost:5432/smartbiz

# Frontend URL
FRONTEND_URL=https://smartbiz.mydomain.com
```

**Frontend (API configuration):**
```javascript
const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://smartbiz.mydomain.com/api'
  : 'http://localhost:3002/api';
```

### Ementech Website

```bash
cd ~/website/ementech
pnpm run build

# No special config needed - just static files
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
      args: 'server.js',
      instances: 1,
      autorestart: true,
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
      args: 'server.js',
      instances: 1,
      autorestart: true,
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

Start with PM2:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## SSL Certificates

### Option A: Individual Certificates (Easiest)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get certificate for each subdomain
sudo certbot --nginx -d ementech.mydomain.com
sudo certbot --nginx -d greenrent.mydomain.com
sudo certbot --nginx -d smartbiz.mydomain.com
```

### Option B: Wildcard Certificate (Advanced)

Covers all subdomains:
```bash
sudo certbot certonly --manual -d "*.mydomain.com" -d "mydomain.com"
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

Add A records at your domain registrar (see DNS Configuration above)

### Step 3: Configure Nginx

Create the three server blocks as shown above

### Step 4: Start Backend Apps

```bash
pm2 start ecosystem.config.js
pm2 status
```

### Step 5: Test Each Subdomain

```bash
# Test ementech
curl http://ementech.mydomain.com

# Test greenrent
curl http://greenrent.mydomain.com

# Test smartbiz
curl http://smartbiz.mydomain.com
```

### Step 6: Add SSL

```bash
sudo certbot --nginx -d ementech.mydomain.com
sudo certbot --nginx -d greenrent.mydomain.com
sudo certbot --nginx -d smartbiz.mydomain.com
```

## Verification

```bash
# Check DNS
nslookup ementech.mydomain.com
nslookup greenrent.mydomain.com
nslookup smartbiz.mydomain.com

# Check nginx
sudo nginx -t
sudo systemctl status nginx

# Check PM2
pm2 status

# Test SSL
curl -I https://ementech.mydomain.com
curl -I https://greenrent.mydomain.com
curl -I https://smartbiz.mydomain.com
```

## Benefits You'll Get

### No CORS Configuration Needed!

```javascript
// Backend - Simple!
app.use(cors());  // Default allows same origin

// Frontend - Simple!
const API_URL = 'https://greenrent.mydomain.com/api';
```

### Clean URLs

- Ementech: `https://ementech.mydomain.com`
- Green Rent: `https://greenrent.mydomain.com`
- SmartBiz: `https://smartbiz.mydomain.com`

### Independent Deployments

Update one app without affecting others

## Troubleshooting

### DNS Not Propagating

```bash
# Check DNS propagation
dig ementech.mydomain.com
nslookup ementech.mydomain.com

# Can take up to 48 hours, usually 5-30 minutes
```

### Subdomain Not Accessible

```bash
# Check nginx config
sudo nginx -t

# Check sites are enabled
ls -la /etc/nginx/sites-enabled/

# Check nginx logs
sudo tail -f /var/log/nginx/error.log
```

### SSL Certificate Issues

```bash
# Check certificate
sudo certbot certificates

# Renew manually
sudo certbot renew

# Force renew
sudo certbot renew --force-renewal
```

## Maintenance

### Update an App

```bash
cd ~/website/app-name
git pull
npm install
npm run build
pm2 restart app-name
```

### Update Nginx Config

```bash
sudo nano /etc/nginx/sites-available/sitename
sudo nginx -t
sudo systemctl reload nginx
```

## File Structure

```
/home/munen/website/
├── ementech/
│   └── dist/                    → ementech.mydomain.com
├── green_rent/
│   ├── backend/                 → Port 3001
│   └── frontend/dist/           → greenrent.mydomain.com
└── smartbiz/
    ├── backend/                 → Port 3002
    └── frontend/dist/           → smartbiz.mydomain.com
```

## Summary

With subdomains:
- ✅ **No CORS headaches**
- ✅ **Clean architecture**
- ✅ **Independent SSL certificates**
- ✅ **Easy to scale**
- ✅ **Professional appearance**

Your apps will be at:
- **ementech.mydomain.com** - Corporate site
- **greenrent.mydomain.com** - Green Rent app
- **smartbiz.mydomain.com** - SmartBiz app
- **baitech.co.ke** - Already live (unchanged)
