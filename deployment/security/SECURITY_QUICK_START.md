# Enterprise Security Implementation - Quick Start Guide

## Overview
This guide provides step-by-step instructions to implement enterprise-grade security for the EmenTech website deployment.

## Prerequisites
- Root or sudo access to VPS (69.164.244.165)
- Local machine with SSH client
- Your public SSH key ready

---

## Phase 1: Critical Security Fixes (Do Immediately!)

### Step 1: Change Exposed Email Credentials
**TIME:** 5 minutes | **PRIORITY:** CRITICAL

```bash
# Log into your email server admin panel
# Change the password for admin@ementech.co.ke
# Update the password in: /var/www/ementech-website/backend/.env
# Restart backend: pm2 restart all
```

---

### Step 2: Run Critical Security Fixes Script
**TIME:** 30 minutes | **PRIORITY:** CRITICAL

```bash
# On your local machine, copy script to VPS
scp deployment/security/01-critical-security-fixes.sh root@69.164.244.165:/root/

# SSH into VPS
ssh root@69.164.244.165

# Navigate to script location
cd /root

# Make script executable
chmod +x 01-critical-security-fixes.sh

# Run the script
sudo bash 01-critical-security-fixes.sh
```

**What this does:**
- Creates deploy-user with SSH keys
- Changes SSH port to 22222
- Disables root SSH login
- Configures firewall properly
- Enables MongoDB authentication
- Installs Fail2ban
- Sets up basic monitoring
- Generates secure secrets

**CRITICAL: Before closing SSH session:**
```bash
# Test SSH access on new port
# On your LOCAL machine (new terminal):
ssh -p 22222 deploy-user@69.164.244.165

# If successful, you can close the root SSH session
# If NOT successful, restore from backup!
```

---

### Step 3: Update Application Credentials
**TIME:** 15 minutes | **PRIORITY:** CRITICAL

After running the security script, update your application with new credentials:

```bash
# On VPS, view new MongoDB credentials
sudo cat /root/.mongodb_credentials

# View new JWT secret
sudo cat /var/www/.secrets/jwt_secret.txt

# Update backend .env file
sudo nano /var/www/ementech-website/backend/.env

# Update these variables:
# MONGODB_URI=mongodb://admin:NEW_PASSWORD@localhost:27017/ementech?authSource=admin
# JWT_SECRET=NEW_JWT_SECRET

# Restart backend
pm2 restart all
```

---

### Step 4: Setup Automated Backups
**TIME:** 20 minutes | **PRIORITY:** CRITICAL

```bash
# Copy script to VPS
scp deployment/security/02-backup-implementation.sh root@69.164.244.165:/root/

# SSH to VPS (use deploy-user and port 22222)
ssh -p 22222 deploy-user@69.164.244.165

# Switch to root
sudo su -

# Run backup setup
bash /root/02-backup-implementation.sh

# Test backup manually
/usr/local/bin/backup-mongodb-daily.sh

# Verify backup was created
ls -lh /var/backups/mongodb/daily/
```

---

## Phase 2: High Priority Security (This Week)

### Step 5: Install and Configure WAF
**TIME:** 1 hour | **PRIORITY:** HIGH

```bash
# On VPS
sudo apt-get update
sudo apt-get install libmodsecurity3 modsecurity-crs

# Enable in nginx
sudo apt-get install libnginx-mod-security

# Configure (see full assessment guide)
sudo nano /etc/nginx/modsecurity.conf
```

---

### Step 6: Setup Centralized Logging
**TIME:** 2 hours | **PRIORITY:** HIGH

Options:
- **ELK Stack** (free, self-hosted)
- **Datadog** ($15/host/month)
- **CloudWatch** (if using AWS)

See full assessment guide for detailed instructions.

---

### Step 7: Enhance SSL/TLS Configuration
**TIME:** 30 minutes | **PRIORITY:** HIGH

```bash
# Generate stronger DH parameters
sudo openssl dhparam -out /etc/nginx/ssl/dhparam.pem 4096

# Update nginx config with OCSP stapling
sudo nano /etc/nginx/sites-available/ementech-website.conf

# Add these lines:
ssl_stapling on;
ssl_stapling_verify on;
ssl_trusted_certificate /etc/letsencrypt/live/ementech.co.ke/chain.pem;
resolver 8.8.8.8 8.8.4.4 valid=300s;

# Test and reload
sudo nginx -t
sudo systemctl reload nginx

# Test SSL rating
# Visit: https://www.ssllabs.com/ssltest/
```

---

## Phase 3: Monitoring and Maintenance (Ongoing)

### Daily Checks
```bash
# Check system status
sudo ufw status
sudo fail2ban-client status
pm2 status

# Check disk space
df -h

# Check logs
sudo tail -50 /var/log/nginx/error.log
pm2 logs --err
```

### Weekly Tasks
```bash
# Review failed SSH attempts
sudo grep "Failed password" /var/log/auth.log | wc -l

# Check backup logs
sudo tail -50 /var/log/mongodb-backup.log

# Review security updates
sudo apt list --upgradable

# Check for unauthorized file changes
find /var/www -mtime -7 -ls
```

### Monthly Tasks
```bash
# Update system
sudo apt-get update && sudo apt-get upgrade

# Rotate secrets (optional but recommended)
openssl rand -base64 64 > /var/www/.secrets/jwt_secret.txt

# Test backup restoration
/usr/local/bin/test-backup-restoration.sh

# Review and clean logs
sudo journalctl --vacuum-time=30d
```

---

## Emergency Procedures

### If Locked Out of SSH
```bash
# If you can't access via deploy-user on port 22222
# You may need VPS provider's console to access

# Via VPS provider console:
sudo -i
usermod -aG sudo deploy-user
# Check SSH config: /etc/ssh/sshd_config
# Restore from backup if needed
```

### If Website is Down
```bash
# Check services
sudo systemctl status nginx
pm2 status
sudo systemctl status mongod

# Restart if needed
sudo systemctl restart nginx
pm2 restart all
sudo systemctl restart mongod

# Check logs
sudo tail -f /var/log/nginx/error.log
pm2 logs
```

### If Security Incident Detected
```bash
# 1. Isolate systems
sudo ufw default deny incoming

# 2. Preserve evidence
sudo cp /var/log/auth.log /root/auth.log.incident
sudo cp /var/log/nginx/*.log /root/

# 3. Check for unauthorized access
sudo last
sudo who
sudo w

# 4. Review recent changes
grep "COMMAND" /var/log/auth.log | tail -50

# 5. Contact security team
# Document everything
# Do not make changes until instructed
```

---

## Security Checklist

### Immediate (First 24 Hours)
- [ ] Change exposed email passwords
- [ ] Run critical security fixes script
- [ ] Test SSH access on new port
- [ ] Update application credentials
- [ ] Setup automated backups
- [ ] Test backup restoration

### This Week
- [ ] Install WAF
- [ ] Setup centralized logging
- [ ] Configure SSL monitoring
- [ ] Implement rate limiting improvements
- [ ] Setup security monitoring alerts

### This Month
- [ ] Penetration test
- [ ] Security audit
- [ ] Team training
- [ ] Implement disaster recovery plan
- [ ] Setup monitoring dashboards

---

## Useful Commands Reference

```bash
# System status
sudo systemctl status nginx mongod redis-server fail2ban
pm2 status
sudo ufw status

# Security monitoring
sudo fail2ban-client status sshd
sudo tail -f /var/log/auth.log
sudo tail -f /var/log/nginx/error.log

# Backup operations
/usr/local/bin/backup-mongodb-daily.sh
ls -lh /var/backups/mongodb/daily/
/usr/local/bin/test-backup-restoration.sh

# Log management
sudo journalctl -f
pm2 logs
sudo tail -50 /var/log/nginx/access.log

# Security checks
sudo netstat -tulpn
sudo lsof -i :22222
sudo find /var/www -perm -o+w -type f
```

---

## Support Resources

**Documentation:**
- Full Security Assessment: `/deployment/ENTERPRISE_SECURITY_ASSESSMENT.md`
- Troubleshooting Guide: `/deployment/DEPLOYMENT_TROUBLESHOOTING.md`
- VPS Deployment Checklist: `/deployment/VPS_DEPLOYMENT_CHECKLIST.md`

**External Resources:**
- SSL Labs Test: https://www.ssllabs.com/ssltest/
- Security Headers: https://securityheaders.com/
- Mozilla SSL Config: https://ssl-config.mozilla.org/
- OWASP Top 10: https://owasp.org/www-project-top-ten/

---

## Important Reminders

1. **Always test changes in non-production first**
2. **Never close your SSH session until you've verified the new one works**
3. **Keep backups encrypted and test them regularly**
4. **Monitor logs daily for suspicious activity**
5. **Keep software updated**
6. **Use strong, unique passwords**
7. **Enable 2FA wherever possible**
8. **Document all procedures**
9. **Have a disaster recovery plan**
10. **Train your team on security practices**

---

**Last Updated:** 2026-01-20
**Next Review:** 2026-02-20

For questions or issues, refer to the full security assessment document or consult with a security professional.
