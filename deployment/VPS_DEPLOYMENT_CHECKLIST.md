# VPS Deployment Checklist

Complete step-by-step guide for deploying Ementech projects to Interserver VPS.

## Table of Contents
1. [Pre-Deployment Preparation](#pre-deployment-preparation)
2. [VPS Initial Setup](#vps-initial-setup)
3. [DNS Configuration](#dns-configuration)
4. [SSL Certificate Setup](#ssl-certificate-setup)
5. [Application Deployment](#application-deployment)
6. [Testing Procedures](#testing-procedures)
7. [Monitoring Setup](#monitoring-setup)
8. [Rollback Procedures](#rollback-procedures)

---

## Pre-Deployment Preparation

### Checklist Items

- [ ] **VPS Access**
  - [ ] VPS IP address obtained from Interserver
  - [ ] Root SSH access tested
  - [ ] SSH key authentication configured (recommended)

- [ ] **Domain Configuration**
  - [ ] Domain `ementech.co.ke` registered and accessible
  - [ ] DNS provider access ready
  - [ ] Admin email configured (for SSL certificates)

- [ ] **Local Development Environment**
  - [ ] All projects committed to Git
  - [ ] No `.env` files with actual secrets in repository
  - [ ] All dependencies tested locally
  - [ ] Build process tested successfully

- [ ] **Required Information**
  - [ ] VPS IP address: `_____________`
  - [ ] Domain: `ementech.co.ke`
  - [ ] Subdomains: `app.ementech.co.ke`, `api.ementech.co.ke`
  - [ ] Admin email: `admin@ementech.co.ke`
  - [ ] Deployment user password (generated during setup)

---

## VPS Initial Setup

### Step 1: Connect to VPS

```bash
# Connect via SSH
ssh root@YOUR_VPS_IP

# Or using SSH key
ssh -i /path/to/key root@YOUR_VPS_IP
```

### Step 2: Run Setup Script

```bash
# Download and run the setup script
cd /root
wget https://raw.githubusercontent.com/your-repo/ementech-website/main/deployment/setup-vps.sh
chmod +x setup-vps.sh

# Run full setup
sudo bash setup-vps.sh

# Or with options
sudo bash setup-vps.sh --skip-ssl  # Skip SSL, configure later
```

### What Gets Installed

- [x] Node.js 20.x
- [x] npm and PM2
- [x] MongoDB 7.0
- [x] Redis
- [x] nginx web server
- [x] SSL certificates (Let's Encrypt)
- [x] Firewall (UFW)
- [x] Deployment user (node-user)
- [x] Directory structure
- [x] Log rotation

### Step 3: Verify Installation

```bash
# Check Node.js
node --version  # Should be v20.x.x

# Check npm
npm --version

# Check PM2
pm2 --version

# Check MongoDB
systemctl status mongod

# Check Redis
systemctl status redis-server

# Check nginx
systemctl status nginx

# Check firewall
ufw status
```

### Step 4: Save Important Information

```bash
# View deployment user credentials (if generated)
cat /root/setup-credentials.txt

# Save these securely:
# - node-user password: _____________
# - MongoDB connection string
# - Redis connection details
```

---

## DNS Configuration

### Configure DNS Records

Add the following records at your DNS provider:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | YOUR_VPS_IP | 3600 |
| A | www | YOUR_VPS_IP | 3600 |
| A | app | YOUR_VPS_IP | 3600 |
| A | api | YOUR_VPS_IP | 3600 |

### Verify DNS Propagation

```bash
# Check DNS records
dig ementech.co.ke +short
dig app.ementech.co.ke +short
dig api.ementech.co.ke +short

# Or use online tool: https://dnschecker.org/
```

**Note:** DNS propagation can take 1-48 hours. Usually completes within a few hours.

---

## SSL Certificate Setup

### Option 1: Automatic (During VPS Setup)

SSL certificates are automatically installed if DNS is already configured:

```bash
sudo bash setup-vps.sh
```

### Option 2: Manual Installation

If DNS wasn't configured during VPS setup:

```bash
# Install Certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Install certificate for main domain
sudo certbot --nginx -d ementech.co.ke -d www.ementech.co.ke

# Install certificate for app subdomain
sudo certbot --nginx -d app.ementech.co.ke

# Install certificate for API subdomain
sudo certbot --nginx -d api.ementech.co.ke

# Test auto-renewal
sudo certbot renew --dry-run
```

### Verify SSL Certificates

```bash
# Check certificate status
sudo certbot certificates

# Test HTTPS
curl -I https://ementech.co.ke
curl -I https://app.ementech.co.ke
curl -I https://api.ementech.co.ke
```

---

## Application Deployment

### Deploy Ementech Corporate Website

```bash
# On your local machine
cd /media/munen/muneneENT/ementech/ementech-website/deployment

# Set VPS environment variables
export VPS_HOST="ementech.co.ke"
export VPS_USER="root"

# Run deployment
./deploy-ementech.sh

# Or dry run first
./deploy-ementech.sh --dry-run
```

### Deploy Dumu Waks Application

#### 1. Prepare Backend Environment

```bash
# On VPS
ssh root@ementech.co.ke

# Create production environment file
cd /var/www/dumuwaks-backend
nano .env

# Fill in values from .env.production.template
# See: Environment Configuration section below
```

#### 2. Deploy Backend and Frontend

```bash
# On your local machine
cd /media/munen/muneneENT/ementech/ementech-website/deployment

# Set VPS environment variables
export VPS_HOST="ementech.co.ke"
export VPS_USER="root"

# Run deployment
./deploy-dumuwaks.sh

# Or deploy only backend
./deploy-dumuwaks.sh --backend-only

# Or deploy only frontend
./deploy-dumuwaks.sh --frontend-only
```

#### 3. Start PM2 Processes

```bash
# On VPS
ssh root@ementech.co.ke

# Start backend
cd /var/www/dumuwaks-backend/current
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup
```

### Deploy All Applications

```bash
# On your local machine
cd /media/munen/muneneENT/ementech/ementech-website/deployment

# Deploy everything
./deploy-all.sh

# Or dry run
./deploy-all.sh --dry-run
```

---

## Environment Configuration

### Backend Environment Variables

Edit `/var/www/dumuwaks-backend/current/.env`:

```bash
# Required variables (must be filled)
MONGODB_URI=mongodb://localhost:27017/dumuwaks
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@ementech.co.ke

# SMS (Africa's Talking)
AT_USERNAME=your-username
AT_API_KEY=your-api-key

# Payment (M-Pesa)
MPESA_CONSUMER_KEY=your-consumer-key
MPESA_CONSUMER_SECRET=your-consumer-secret
MPESA_PASSKEY=your-passkey
MPESA_SHORTCODE=174379
MPESA_CALLBACK_URL=https://api.ementech.co.ke/api/v1/payments/mpesa/callback
```

### Generate Secure Secrets

```bash
# Generate JWT secrets
openssl rand -base64 32

# Generate session secret
openssl rand -base64 32
```

---

## Testing Procedures

### Test Corporate Website

```bash
# HTTP status
curl -I https://ementech.co.ke
curl -I https://www.ementech.co.ke

# Test from browser
# Open: https://ementech.co.ke
# Verify: All pages load correctly
```

### Test Dumu Waks Frontend

```bash
# HTTP status
curl -I https://app.ementech.co.ke

# Test from browser
# Open: https://app.ementech.co.ke
# Verify: Login page loads
# Verify: Can navigate to different sections
```

### Test Backend API

```bash
# Health check
curl https://api.ementech.co.ke/health

# API endpoint test
curl https://api.ementech.co.ke/api/v1/test

# WebSocket test (if applicable)
# Use browser console or WebSocket client
```

### Test SSL Certificates

```bash
# Check SSL certificate
openssl s_client -connect ementech.co.ke:443 -servername ementech.co.ke

# SSL rating
# Visit: https://www.ssllabs.com/ssltest/
```

### Test Database Connections

```bash
# On VPS
mongosh --eval "db.adminCommand('ping')"

# Check MongoDB status
systemctl status mongod

# Check Redis
redis-cli ping
```

### Test PM2 Processes

```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs

# Monitor
pm2 monit
```

---

## Monitoring Setup

### Install Monitoring

```bash
# On VPS
cd /root
wget https://raw.githubusercontent.com/your-repo/main/deployment/setup-monitoring.sh
chmod +x setup-monitoring.sh

# Run monitoring setup
sudo bash setup-monitoring.sh
```

### Monitoring Commands

```bash
# View system status
monitor-status

# View aggregated logs
view-logs

# PM2 monitoring
pm2 monit

# PM2 logs
pm2 logs

# nginx status
systemctl status nginx

# Check disk space
df -h

# Check memory
free -h

# Check CPU
top -bn1 | grep "Cpu(s)"
```

### Access Monitoring Dashboard

- **System Status**: SSH to VPS and run `monitor-status`
- **PM2 Dashboard**: `pm2 monit`
- **Uptime Page**: https://ementech.co.ke/status

---

## Rollback Procedures

### Rollback Corporate Website

```bash
# On VPS
ssh root@ementech.co.ke

# List releases
ls -la /var/www/ementech-website/releases/

# Switch to previous release
ln -sfn /var/www/ementech-website/releases/PREVIOUS_TIMESTAMP /var/www/ementech-website/current

# Reload nginx
systemctl reload nginx
```

### Rollback Dumu Waks Frontend

```bash
# On VPS
ssh root@ementech.co.ke

# List releases
ls -la /var/www/dumuwaks-frontend/releases/

# Switch to previous release
ln -sfn /var/www/dumuwaks-frontend/releases/PREVIOUS_TIMESTAMP /var/www/dumuwaks-frontend/current

# Reload nginx
systemctl reload nginx
```

### Rollback Backend

```bash
# On VPS
ssh root@ementech.co.ke

# List releases
ls -la /var/www/dumuwaks-backend/releases/

# Switch to previous release
cd /var/www/dumuwaks-backend/releases/PREVIOUS_TIMESTAMP
pm2 restart ecosystem.config.js --env production

# Update current symlink
ln -sfn /var/www/dumuwaks-backend/releases/PREVIOUS_TIMESTAMP /var/www/dumuwaks-backend/current
```

### Emergency Rollback Script

```bash
#!/bin/bash
# emergency-rollback.sh

echo "Select application to rollback:"
echo "1) Ementech Website"
echo "2) Dumu Waks Frontend"
echo "3) Dumu Waks Backend"
read -p "Choice: " choice

case $choice in
    1)
        ls -lt /var/www/ementech-website/releases/ | head -5
        read -p "Enter release timestamp: " timestamp
        ln -sfn "/var/www/ementech-website/releases/$timestamp" /var/www/ementech-website/current
        systemctl reload nginx
        ;;
    2)
        ls -lt /var/www/dumuwaks-frontend/releases/ | head -5
        read -p "Enter release timestamp: " timestamp
        ln -sfn "/var/www/dumuwaks-frontend/releases/$timestamp" /var/www/dumuwaks-frontend/current
        systemctl reload nginx
        ;;
    3)
        ls -lt /var/www/dumuwaks-backend/releases/ | head -5
        read -p "Enter release timestamp: " timestamp
        ln -sfn "/var/www/dumuwaks-backend/releases/$timestamp" /var/www/dumuwaks-backend/current
        cd /var/www/dumuwaks-backend/current
        pm2 restart ecosystem.config.js --env production
        ;;
esac

echo "Rollback complete"
```

---

## Troubleshooting

### Common Issues

Refer to `DEPLOYMENT_TROUBLESHOOTING.md` for detailed troubleshooting guide.

### Quick Fixes

```bash
# Restart nginx
sudo systemctl restart nginx

# Restart PM2
pm2 restart all

# Restart MongoDB
sudo systemctl restart mongod

# Restart Redis
sudo systemctl restart redis-server

# Clear PM2 cache
pm2 flush
pm2 reload all

# Check nginx error logs
sudo tail -f /var/log/nginx/error.log

# Check PM2 logs
pm2 logs --err
```

---

## Post-Deployment Tasks

- [ ] Configure backup strategy
- [ ] Setup automated backups
- [ ] Configure email alerts
- [ ] Test payment gateways
- [ ] Load test applications
- [ ] Configure CDN (optional)
- [ ] Setup analytics
- [ ] Document API endpoints
- [ ] Train team on deployment process

---

## Maintenance Schedule

### Daily
- Check application status
- Review error logs
- Monitor resource usage

### Weekly
- Review security updates
- Check disk space
- Review PM2 logs

### Monthly
- Update dependencies
- Review and rotate logs
- Test backup restoration
- SSL certificate check

### Quarterly
- Security audit
- Performance review
- Update Node.js version
- Database maintenance

---

## Support Contacts

- **VPS Provider**: Interserver
- **Domain Registrar**: [Your Registrar]
- **DNS Provider**: [Your DNS Provider]

---

## Appendix

### Useful Commands Reference

```bash
# SSH to VPS
ssh root@ementech.co.ke

# Check system resources
htop

# View PM2 status
pm2 status

# View nginx status
systemctl status nginx

# View logs
journalctl -f

# Restart services
systemctl restart nginx
pm2 restart all

# Check disk space
df -h

# Check memory
free -h

# View system uptime
uptime
```

### File Locations Reference

- **Ementech Website**: `/var/www/ementech-website/current/`
- **Dumu Waks Frontend**: `/var/www/dumuwaks-frontend/current/`
- **Dumu Waks Backend**: `/var/www/dumuwaks-backend/current/`
- **nginx configs**: `/etc/nginx/sites-available/`
- **PM2 logs**: `/var/log/pm2/`
- **Application logs**: `/var/log/apps/`
- **nginx logs**: `/var/log/nginx/`
- **MongoDB data**: `/var/lib/mongodb/`
- **Redis data**: `/var/lib/redis/`

---

**Last Updated**: 2025-01-18
**Version**: 1.0
