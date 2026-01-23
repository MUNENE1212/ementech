# Quick Start Guide - Ementech Deployment

**🚀 Get your applications deployed in minutes!**

---

## Pre-Deployment Checklist

Before starting, ensure you have:

- [ ] VPS access (root SSH credentials)
- [ ] Domain access (ementech.co.ke)
- [ ] All environment variables ready
- [ ] Git repositories updated

---

## Step 1: Initial VPS Setup (15 minutes)

```bash
# SSH into your VPS
ssh root@YOUR_VPS_IP

# Download and run setup script
cd /root
curl -o setup-vps.sh https://raw.githubusercontent.com/your-repo/ementech-website/main/deployment/setup-vps.sh
chmod +x setup-vps.sh
sudo bash setup-vps.sh

# Save the deployment user password that's generated!
```

**What this does:**
- Installs Node.js, MongoDB, Redis, nginx
- Configures SSL certificates
- Sets up firewall
- Creates deployment user
- Configures all directories

---

## Step 2: Configure DNS (5 minutes)

Add these DNS records at your DNS provider:

| Type | Name | Value |
|------|------|-------|
| A | @ | YOUR_VPS_IP |
| A | www | YOUR_VPS_IP |
| A | app | YOUR_VPS_IP |
| A | api | YOUR_VPS_IP |

**Wait for DNS propagation** (usually 1-2 hours)

---

## Step 3: Configure Environment Variables (10 minutes)

```bash
# SSH to VPS
ssh root@ementech.co.ke

# Configure backend environment
cd /var/www/dumuwaks-backend
nano .env

# Fill in required variables:
# - MONGODB_URI
# - JWT_SECRET (generate with: openssl rand -base64 32)
# - CLOUDINARY credentials
# - SMTP settings
# - Payment gateways
```

---

## Step 4: Deploy Applications (10 minutes)

```bash
# On your local machine
cd /media/munen/muneneENT/ementech/ementech-website/deployment

# Test deployment (dry run)
./deploy-all.sh --dry-run

# Deploy for real
./deploy-all.sh
```

**This will:**
- Build all applications
- Upload to VPS
- Configure nginx
- Start PM2 processes
- Run health checks

---

## Step 5: Setup Monitoring (5 minutes)

```bash
# On VPS
ssh root@ementech.co.ke

cd /root
curl -o setup-monitoring.sh https://raw.githubusercontent.com/your-repo/main/deployment/setup-monitoring.sh
chmod +x setup-monitoring.sh
sudo bash setup-monitoring.sh
```

---

## Step 6: Test Everything

```bash
# Test all applications
curl https://ementech.co.ke/health
curl https://app.ementech.co.ke/health
curl https://api.ementech.co.ke/health

# Check PM2 status
pm2 status

# Check nginx status
systemctl status nginx

# View monitoring dashboard
monitor-status
```

---

## Common Commands

### Check Status
```bash
pm2 status                    # PM2 processes
systemctl status nginx        # nginx status
systemctl status mongod       # MongoDB status
```

### View Logs
```bash
pm2 logs                      # Application logs
pm2 logs --err                # Error logs only
tail -f /var/log/nginx/error.log  # nginx logs
```

### Restart Services
```bash
pm2 restart all               # Restart all apps
systemctl restart nginx       # Restart nginx
pm2 reload all                # Zero-downtime reload
```

### Deploy Updates
```bash
# Deploy all
./deploy-all.sh

# Deploy specific app
./deploy-ementech.sh
./deploy-dumuwaks.sh --backend-only
```

---

## Troubleshooting

### Issue: 502 Bad Gateway
```bash
# Check if backend is running
pm2 status
pm2 restart all
```

### Issue: SSL Certificate Error
```bash
# Renew certificates
sudo certbot renew --force-renewal
sudo systemctl reload nginx
```

### Issue: Database Connection Error
```bash
# Check MongoDB
systemctl status mongod
sudo systemctl restart mongod
```

### Issue: PM2 Won't Start
```bash
pm2 kill
pm2 resurrect
```

---

## Access Points

After deployment, your applications will be available at:

- **Corporate Website:** https://ementech.co.ke
- **Dumu Waks App:** https://app.ementech.co.ke
- **Backend API:** https://api.ementech.co.ke
- **Monitoring Status:** https://ementech.co.ke/status
- **API Documentation:** https://api.ementech.co.ke/api-docs

---

## Next Steps

1. ✅ Test all applications thoroughly
2. ✅ Configure payment gateways
3. ✅ Setup backup strategy
4. ✅ Configure email alerts
5. ✅ Load test applications
6. ✅ Document API endpoints

---

## Need Help?

- 📖 Full Documentation: See `README.md`
- ✅ Deployment Checklist: See `VPS_DEPLOYMENT_CHECKLIST.md`
- 🔧 Troubleshooting: See `DEPLOYMENT_TROUBLESHOOTING.md`
- 📋 All Deliverables: See `DEPLOYMENT_DELIVERABLES.md`

---

**Total Time:** ~45 minutes for complete deployment

**Last Updated:** 2025-01-18
