# VPS Deployment Guide for Ementech Website

This guide covers deploying the Ementech corporate website to a VPS alongside existing projects.

## Prerequisites

- VPS with Ubuntu/Debian
- Root or sudo access
- Domain name configured
- Node.js 18+ installed
- Nginx installed

## Architecture Overview

The website will be deployed as the main domain with the following structure:

```
yourdomain.com/          → Ementech Website (this project)
yourdomain.com/green_rent  → Green Rent Project
yourdomain.com/smartbiz   → SmartBiz Project
```

## Step 1: Build the Application

On your local machine:

```bash
cd /media/munen/muneneENT/ementech/ementech-website

# Install dependencies
npm install

# Build for production
npm run build

# The dist folder will contain the production files
```

## Step 2: Upload to VPS

```bash
# Upload dist folder to VPS
scp -r dist/ user@your-vps-ip:/var/www/ementech

# Or use rsync
rsync -avz dist/ user@your-vps-ip:/var/www/ementech/
```

## Step 3: Configure Nginx

### Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/ementech
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Ementech Website (Main)
    location / {
        root /var/www/ementech;
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
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
```

### Enable the Site

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/ementech /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

## Step 4: Set Up SSL Certificate

```bash
# Install Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Certbot will automatically configure SSL
# Choose to redirect HTTP to HTTPS when prompted
```

Auto-renewal is configured automatically.

## Step 5: Set Permissions

```bash
# Set proper ownership
sudo chown -R www-data:www-data /var/www/ementech

# Set proper permissions
sudo chmod -R 755 /var/www/ementech
```

## Step 6: Configure Firewall

```bash
# Allow HTTP and HTTPS
sudo ufw allow 'Nginx Full'

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

## Step 7: Update Product Links

Make sure product links in `src/components/sections/Products.tsx` point to the correct paths:

```tsx
path: '/green_rent'   // Will route to yourdomain.com/green_rent
path: '/smartbiz'     // Will route to yourdomain.com/smartbiz
```

## Alternative: Deploy as Subdomains

If you prefer subdomains:

```
ementech.com         → Main website
greenrent.ementech.com → Green Rent
smartbiz.ementech.com  → SmartBiz
```

Create separate Nginx server blocks for each subdomain.

## Monitoring and Maintenance

### Check Nginx Logs

```bash
# Access log
sudo tail -f /var/log/nginx/access.log

# Error log
sudo tail -f /var/log/nginx/error.log
```

### Restart Services

```bash
# Restart Nginx
sudo systemctl restart nginx

# Reload Nginx (no downtime)
sudo systemctl reload nginx
```

## Performance Optimization

### Enable HTTP/2

The SSL configuration automatically enables HTTP/2.

### Enable Browser Caching

Already configured in the Nginx config above.

### Enable CDN (Optional)

Consider using a CDN like Cloudflare for:
- DDoS protection
- Global CDN
- SSL termination
- Caching

## Troubleshooting

### 502 Bad Error

Check if your backend services are running:
```bash
sudo netstat -tlnp | grep :3001
sudo netstat -tlnp | grep :3002
```

### Permission Denied

```bash
sudo chown -R www-data:www-data /var/www/ementech
sudo chmod -R 755 /var/www/ementech
```

### Nginx Won't Start

```bash
# Check syntax
sudo nginx -t

# Check error log
sudo tail -f /var/log/nginx/error.log
```

## Updates

To update the website:

```bash
# On local machine
npm run build

# Upload to VPS
scp -r dist/* user@your-vps-ip:/var/www/ementech/

# Files update immediately, no need to restart Nginx
```

## Backup

```bash
# Backup website files
sudo tar -czf ementech-backup-$(date +%Y%m%d).tar.gz /var/www/ementech

# Backup Nginx config
sudo cp /etc/nginx/sites-available/ementech ~/ementech-nginx-backup-$(date +%Y%m%d)
```

## Security Best Practices

1. Keep system updated: `sudo apt update && sudo apt upgrade`
2. Use strong passwords
3. Disable root SSH login
4. Configure firewall properly
5. Regular backups
6. Monitor logs regularly

## Conclusion

Your Ementech website is now deployed and accessible at your domain!

For issues or questions, contact the development team.
