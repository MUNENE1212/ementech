# Ementech Deployment Configurations

Complete deployment configurations and automation scripts for Ementech projects on Interserver VPS.

## Overview

This directory contains production-ready deployment configurations for:

1. **ementech-website** - Corporate website (ementech.co.ke)
2. **dumuwaks-frontend** - Frontend application (app.ementech.co.ke)
3. **dumuwaks-backend** - Backend API (api.ementech.co.ke)

## Quick Start

### 1. Initial VPS Setup

```bash
# On your VPS (as root)
wget https://raw.githubusercontent.com/your-repo/main/deployment/setup-vps.sh
chmod +x setup-vps.sh
sudo bash setup-vps.sh
```

### 2. Deploy Applications

```bash
# On your local machine
cd deployment

# Deploy all applications
./deploy-all.sh

# Or deploy individually
./deploy-ementech.sh      # Corporate website
./deploy-dumuwaks.sh       # Full stack app
```

### 3. Setup Monitoring

```bash
# On your VPS
wget https://raw.githubusercontent.com/your-repo/main/deployment/setup-monitoring.sh
chmod +x setup-monitoring.sh
sudo bash setup-monitoring.sh
```

## File Structure

```
deployment/
├── README.md                            # This file
├── DEPLOYMENT_SUMMARY.md                # Complete summary of all deliverables
│
├── setup-vps.sh                         # VPS initialization script
├── setup-monitoring.sh                  # Monitoring setup script
│
├── deploy-ementech.sh                   # Deploy corporate website
├── deploy-dumuwaks.sh                   # Deploy dumuwaks app
├── deploy-all.sh                        # Deploy all applications
│
├── ecosystem.ementech.config.js         # PM2 config for website
├── ecosystem.config.js                  # PM2 config for backend
│
├── ementech-website.conf                # nginx config for main site
├── dumuwaks-frontend.conf               # nginx config for app
├── dumuwaks-backend.conf                # nginx config for API
│
├── .env.production.template             # Environment templates
│   ├── backend/.env.production.template
│   ├── frontend/.env.production.template
│   └── website/.env.production.template
│
├── VPS_DEPLOYMENT_CHECKLIST.md          # Step-by-step deployment guide
├── DEPLOYMENT_TROUBLESHOOTING.md        # Common issues and solutions
└── DEPLOYMENT_DELIVERABLES.md           # Complete list of deliverables
```

## Configuration Files

### PM2 Ecosystem Files

**For Ementech Website:**
- Location: `/var/www/ecosystem.ementech.config.js`
- Serves static React build using `serve` package
- Port: 3001
- Auto-restart enabled

**For Dumu Waks Backend:**
- Location: `/var/www/ecosystem.config.js`
- Runs Node.js/Express API
- Port: 5000
- Cluster mode (all CPU cores)
- Zero-downtime reloads

### nginx Configurations

**ementech-website.conf**
- Domains: ementech.co.ke, www.ementech.co.ke
- Serves static files from `/var/www/ementech-website/current/dist`
- SSL/TLS enabled
- Security headers configured
- HTTP to HTTPS redirect

**dumuwaks-frontend.conf**
- Domain: app.ementech.co.ke
- Serves React SPA
- API proxy to backend
- WebSocket support for Socket.io
- Higher rate limits for app usage

**dumuwaks-backend.conf** (Optional)
- Domain: api.ementech.co.ke
- Direct API access
- CORS configured for app.ementech.co.ke
- WebSocket support
- Stricter rate limiting

## Deployment Scripts

### deploy-ementech.sh

Deploys the corporate website to production.

**Features:**
- Builds React application
- Uploads to VPS via rsync
- Zero-downtime deployment (symlink switch)
- Keeps last 5 releases
- Automatic rollback capability
- Health checks

**Usage:**
```bash
./deploy-ementech.sh [--dry-run] [--skip-build]
```

### deploy-dumuwaks.sh

Deploys both frontend and backend of Dumu Waks application.

**Features:**
- Builds frontend and backend
- Installs backend dependencies
- Restarts PM2 processes
- Database migrations (if needed)
- Keeps last 5 releases
- Health checks

**Usage:**
```bash
./deploy-dumuwaks.sh [--dry-run] [--skip-build] [--frontend-only] [--backend-only]
```

### deploy-all.sh

Master deployment script that deploys all applications.

**Features:**
- Deploys all projects in sequence
- Error handling and rollback
- Status reporting
- Can skip specific deployments

**Usage:**
```bash
./deploy-all.sh [--dry-run] [--skip-website] [--skip-dumuwaks]
```

### setup-vps.sh

Initializes a fresh Ubuntu VPS with all required software.

**Installs:**
- Node.js 20.x
- MongoDB 7.0
- Redis
- nginx
- PM2
- SSL certificates (Let's Encrypt)
- Firewall (UFW)
- Deployment user (node-user)
- Directory structure
- Log rotation

**Usage:**
```bash
sudo bash setup-vps.sh [--skip-firewall] [--skip-ssl] [--skip-mongodb]
```

### setup-monitoring.sh

Configures monitoring, logging, and alerting.

**Sets up:**
- System monitoring tools
- PM2 monitoring
- Automated health checks
- Email alerts
- Log aggregation
- Uptime monitoring
- Cron jobs for periodic checks

**Usage:**
```bash
sudo bash setup-monitoring.sh [--skip-pm2-plus] [--skip-email]
```

## Environment Configuration

### Backend Environment Variables

Required variables for `.env`:

```bash
# Database
MONGODB_URI=mongodb://localhost:27017/dumuwaks

# Security
JWT_SECRET=[Generate with: openssl rand -base64 32]
JWT_REFRESH_SECRET=[Generate different secret]

# Media Storage
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# SMS (optional)
AT_USERNAME=your-username
AT_API_KEY=your-api-key

# Payment (optional)
MPESA_CONSUMER_KEY=your-consumer-key
MPESA_CONSUMER_SECRET=your-consumer-secret
MPESA_PASSKEY=your-passkey
```

See `.env.production.template` files for complete lists.

## Deployment Workflow

### First-Time Deployment

1. **Setup VPS**
   ```bash
   ssh root@your-vps-ip
   sudo bash setup-vps.sh
   ```

2. **Configure DNS**
   - Add A records for all domains/subdomains
   - Wait for DNS propagation (1-48 hours)

3. **Setup SSL Certificates**
   ```bash
   sudo certbot --nginx -d ementech.co.ke -d www.ementech.co.ke
   sudo certbot --nginx -d app.ementech.co.ke
   sudo certbot --nginx -d api.ementech.co.ke
   ```

4. **Configure Backend Environment**
   ```bash
   ssh root@ementech.co.ke
   cd /var/www/dumuwaks-backend
   nano .env
   # Add your environment variables
   ```

5. **Deploy Applications**
   ```bash
   # On local machine
   cd deployment
   ./deploy-all.sh
   ```

6. **Setup Monitoring**
   ```bash
   ssh root@ementech.co.ke
   sudo bash setup-monitoring.sh
   ```

### Regular Deployment

1. **Make changes** to your code
2. **Test locally**
3. **Commit changes** to Git
4. **Run deployment script**
   ```bash
   ./deploy-ementech.sh          # For website
   ./deploy-dumuwaks.sh           # For dumuwaks
   ./deploy-all.sh                # For everything
   ```

### Rollback Procedure

If deployment fails:

```bash
# On VPS
ssh root@ementech.co.ke

# List releases
ls -la /var/www/ementech-website/releases/

# Switch to previous release
ln -sfn /var/www/ementech-website/releases/TIMESTAMP /var/www/ementech-website/current

# Reload nginx
systemctl reload nginx

# For backend
cd /var/www/dumuwaks-backend/releases/TIMESTAMP
pm2 restart ecosystem.config.js
```

## Monitoring

### System Monitoring

```bash
# System status dashboard
monitor-status

# View logs
view-logs

# PM2 monitoring
pm2 monit

# PM2 logs
pm2 logs
```

### Health Check URLs

- Corporate Website: https://ementech.co.ke/health
- Dumu Waks Frontend: https://app.ementech.co.ke/health
- Backend API: https://api.ementech.co.ke/health
- Monitoring Status: https://ementech.co.ke/status

### Log Locations

- PM2 logs: `/var/log/pm2/`
- nginx logs: `/var/log/nginx/`
- Application logs: `/var/log/apps/`
- MongoDB logs: `/var/log/mongodb/mongod.log`
- System logs: `journalctl -f`

## Security Best Practices

1. **Never commit `.env` files** with actual secrets
2. **Use strong passwords** for all services
3. **Keep software updated**
4. **Enable firewall** (UFW)
5. **Use fail2ban** for SSH protection
6. **Rotate secrets** periodically
7. **Monitor logs** for suspicious activity
8. **Backup regularly**

## Troubleshooting

See `DEPLOYMENT_TROUBLESHOOTING.md` for detailed troubleshooting guide.

### Common Issues

**PM2 won't start:**
```bash
pm2 kill
pm2 resurrect
```

**nginx 502 error:**
```bash
pm2 status  # Check if backend is running
pm2 restart all
```

**SSL certificate error:**
```bash
sudo certbot renew --force-renewal
sudo systemctl reload nginx
```

**Database connection error:**
```bash
systemctl status mongod
sudo systemctl restart mongod
```

## Maintenance

### Daily Tasks

- Check application status
- Review error logs
- Monitor resource usage

### Weekly Tasks

- Review security updates
- Check disk space
- Review PM2 logs

### Monthly Tasks

- Update dependencies
- Test backup restoration
- SSL certificate check
- Performance review

## Support

For issues or questions:

1. Check `DEPLOYMENT_TROUBLESHOOTING.md`
2. Check logs: `pm2 logs`, `journalctl -f`
3. Review `VPS_DEPLOYMENT_CHECKLIST.md`
4. Contact support with diagnostic information

## Version History

- **1.0** (2025-01-18) - Initial deployment configurations

## Contributing

When updating deployment configurations:

1. Test changes on staging environment first
2. Update this README
3. Document any breaking changes
4. Update version number

## License

Proprietary - Ementech Internal Use Only

---

**Last Updated:** 2025-01-18
**Maintained By:** Ementech Development Team
