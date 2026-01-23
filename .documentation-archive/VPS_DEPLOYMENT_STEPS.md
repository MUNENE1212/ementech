# Ementech Website - VPS Deployment Guide

## Prerequisites

- Ubuntu/Debian VPS with root or sudo access
- Domain name pointed to your VPS IP
- Nginx installed

## Step 1: Install pnpm on VPS

```bash
# SSH into your VPS
ssh user@your-vps-ip

# Install pnpm globally
curl -fsSL https://get.pnpm.io/install.sh | sh -

# Or using npm
npm install -g pnpm

# Verify installation
pnpm --version

# Add pnpm to PATH (if needed)
export PATH="$PNPM_HOME:$PATH"
echo 'export PATH="$PNPM_HOME:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

## Step 2: Clone Repository

```bash
# Navigate to web directory
cd /var/www

# Clone the repository
sudo git clone git@github.com:MUNENE1212/ementech.git ementech

# Set ownership
sudo chown -R $USER:$USER /var/www/ementech
```

## Step 3: Install Dependencies & Build

```bash
cd /var/www/ementech

# Install dependencies with pnpm
pnpm install

# Build for production
pnpm run build

# The dist/ folder contains the production files
ls -la dist/
```

## Step 4: Configure Nginx

### Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/ementech
```

Add this configuration:

```nginx
# Main Ementech Website
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Ementech Website (Main)
    location / {
        root /var/www/ementech/dist;
        try_files $uri $uri/ /index.html;
        index index.html;

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Green Rent Project
    location /green_rent {
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

    # SmartBiz Project
    location /smartbiz {
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

    # Dumu Waks (external link)
    location /dumuwaks {
        return 301 https://ementech-frontend.onrender.com;
    }

    # BAITECH Project
    location /baitech {
        proxy_pass http://localhost:3003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/rss+xml font/truetype font/opentype application/vnd.ms-fontobject image/svg+xml;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
}
```

### Enable Site

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/ementech /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# If test passes, restart Nginx
sudo systemctl restart nginx
```

## Step 5: Set Up SSL Certificate

```bash
# Install Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx -y

# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Follow prompts - choose to redirect HTTP to HTTPS
```

Auto-renewal is configured automatically.

## Step 6: Set Permissions

```bash
# Set proper ownership
sudo chown -R www-data:www-data /var/www/ementech/dist

# Set proper permissions
sudo chmod -R 755 /var/www/ementech/dist
```

## Step 7: Configure Firewall

```bash
# Allow HTTP and HTTPS
sudo ufw allow 'Nginx Full'

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

## Step 8: Verify Deployment

```bash
# Check Nginx status
sudo systemctl status nginx

# Check error logs if needed
sudo tail -f /var/log/nginx/error.log

# Test in browser
# Visit: http://yourdomain.com
```

## Update Process

When you need to update the website:

```bash
cd /var/www/ementech

# Pull latest changes
git pull origin main

# Install new dependencies (if any)
pnpm install

# Build
pnpm run build

# Files update immediately, no need to restart Nginx
```

## Troubleshooting

### 502 Bad Gateway

Check if your backend services are running:
```bash
sudo netstat -tlnp | grep :3001
sudo netstat -tlnp | grep :3002
```

### Permission Denied

```bash
sudo chown -R www-data:www-data /var/www/ementech/dist
sudo chmod -R 755 /var/www/ementech/dist
```

### Build Errors

```bash
# Clear pnpm cache
pnpm store prune

# Reinstall
pnpm install

# Build again
pnpm run build
```

### Nginx Won't Start

```bash
# Check syntax
sudo nginx -t

# Check error log
sudo tail -f /var/log/nginx/error.log

# Restart
sudo systemctl restart nginx
```

## Disk Space Management

With pnpm, your website uses minimal space:

```bash
# Check disk usage
du -sh /var/www/ementech
du -sh /var/www/ementech/node_modules

# Should be ~500MB for node_modules (vs 1.3GB with npm)
```

## Performance Optimization

Already configured:
- ✅ Gzip compression
- ✅ Browser caching (1 year for static assets)
- ✅ HTTP/2 (enabled with SSL)
- ✅ Security headers
- ✅ Optimized bundle size

## Monitoring

### Check Nginx Access Logs

```bash
sudo tail -f /var/log/nginx/access.log
```

### Check Error Logs

```bash
sudo tail -f /var/log/nginx/error.log
```

### Restart Services

```bash
# Restart Nginx
sudo systemctl restart nginx

# Reload Nginx (no downtime)
sudo systemctl reload nginx
```

## Backup

```bash
# Backup website files
sudo tar -czf ementech-backup-$(date +%Y%m%d).tar.gz /var/www/ementech/dist

# Backup Nginx config
sudo cp /etc/nginx/sites-available/ementech ~/ementech-nginx-backup-$(date +%Y%m%d)
```

## Success!

Your Ementech website is now live at:
- **http://yourdomain.com** (will redirect to HTTPS)
- **https://yourdomain.com**

With product routes:
- **https://yourdomain.com/green_rent** → Green Rent Project
- **https://yourdomain.com/smartbiz** → SmartBiz Project
- **https://yourdomain.com/baitech** → BAITECH Project
- **https://yourdomain.com/dumuwaks** → Redirects to live Dumu Waks

## Next Steps

1. Configure EmailJS in `src/components/sections/Contact.tsx`
2. Update contact details (phone, WhatsApp, email)
3. Test all product links
4. Set up monitoring
5. Configure Google Analytics

## Need Help?

Check these files:
- `DEPLOYMENT.md` - Detailed deployment guide
- `PNPM_GUIDE.md` - pnpm usage guide
- `QUICKSTART.md` - Quick start guide
- `PROJECTS_GUIDE.md` - Complete portfolio overview
