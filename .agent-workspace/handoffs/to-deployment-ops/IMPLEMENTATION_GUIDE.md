# Multi-Application VPS Infrastructure - Implementation Guide

**Document Version**: 1.0
**Last Updated**: 2026-01-21
**Target Audience**: Deployment Operations Agent
**Estimated Completion Time**: 6-8 hours

---

## Executive Summary

This guide provides step-by-step instructions for implementing a multi-application infrastructure on the EmenTech VPS (69.164.244.165). The infrastructure will host three applications:

1. **EmenTech Website** (ementech.co.ke) - Corporate site with email system
2. **Dumuwaks** (dumuwaks.ementech.co.ke) - Job marketplace
3. **Admin Dashboard** (admin.ementech.co.ke) - Monitoring interface

---

## Pre-Implementation Checklist

### Current VPS Status

- [x] VPS is operational (Ubuntu 22.04)
- [x] Ementech website is deployed and running
- [x] MongoDB Atlas is configured
- [x] Basic nginx is configured
- [x] PM2 is installed and running ementech-backend

### Required Access

- [ ] Root SSH access to VPS (root@69.164.244.165)
- [ ] Domain management access (ementech.co.ke DNS)
- [ ] MongoDB Atlas credentials
- [ ] Email server credentials (mail.ementech.co.ke)

### Risk Assessment

**High Risk Operations**:
- Modifying nginx configuration (may break live site)
- Updating SSL certificates
- Restarting PM2 processes
- Database migrations

**Mitigation Strategy**:
- Perform all operations during low-traffic hours
- Create backups before major changes
- Test configuration changes in staging
- Have rollback procedures ready

---

## Implementation Phases

### Phase 1: Infrastructure Preparation (1 hour)

#### 1.1 System Update

```bash
# Connect to VPS
ssh root@69.164.244.165

# Update system packages
apt update && apt upgrade -y

# Install required packages
apt install -y nginx certbot python3-certbot-nginx ufw fail2ban curl git htop net-tools

# Verify installations
nginx -v
certbot --version
pm2 --version
```

#### 1.2 Create Directory Structure

```bash
# Create shared directories
mkdir -p /var/www/shared/{scripts,backups,pm2}
mkdir -p /var/log/applications/{ementech,dumuwaks,admin}
mkdir -p /var/log/pm2

# Set permissions
chown -R root:root /var/www/shared
chmod -R 755 /var/www/shared

chown -R www-data:www-data /var/log/applications
chmod -R 775 /var/log/applications

chown -R root:root /var/log/pm2
chmod -R 755 /var/log/pm2

# Verify structure
tree -L 2 /var/www/
```

#### 1.3 Create Application Directories

```bash
# Dumuwaks directory structure
mkdir -p /var/www/dumuwaks/{backend,frontend,current,releases,shared/uploads}
mkdir -p /var/www/dumuwaks/backend/{src,tests,logs}

# Admin dashboard directory structure
mkdir -p /var/www/admin-dashboard/{backend,frontend,current,releases,shared}
mkdir -p /var/www/admin-dashboard/backend/{src,tests,logs}

# Set permissions
chown -R root:root /var/www/dumuwaks
chown -R root:root /var/www/admin-dashboard
chmod -R 755 /var/www/dumuwaks
chmod -R 755 /var/www/admin-dashboard

chown -R www-data:www-data /var/www/dumuwaks/shared/uploads
chown -R www-data:www-data /var/www/admin-dashboard/shared/uploads
```

---

### Phase 2: Security Hardening (1.5 hours)

#### 2.1 Configure Firewall (UFW)

```bash
# Reset UFW to defaults
ufw --force reset

# Set default policies
ufw default deny incoming
ufw default allow outgoing

# Allow SSH (rate limited)
ufw limit 22/tcp

# Allow HTTP/HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Enable firewall
ufw --force enable

# Check status
ufw status numbered
```

#### 2.2 Configure Fail2ban

```bash
# Create jail configuration
cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5
destemail = admin@ementech.co.ke
action = %(action_mwl)s

[sshd]
enabled = true
port = 22
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 7200

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 10
EOF

# Restart Fail2ban
systemctl restart fail2ban
systemctl enable fail2ban

# Check status
fail2ban-client status
```

#### 2.3 SSH Hardening

```bash
# Backup SSH config
cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup

# Edit SSH config
cat > /etc/ssh/sshd_config << 'EOF'
Port 22
Protocol 2
PermitRootLogin yes  # Keep enabled for now, change after creating deploy user
PasswordAuthentication yes
PubkeyAuthentication yes
PermitEmptyPasswords no
X11Forwarding no
MaxAuthTries 3
ClientAliveInterval 300
ClientAliveCountMax 2
EOF

# Restart SSH
systemctl restart sshd

# TEST: Open new SSH session before closing current one
```

---

### Phase 3: SSL Certificate Management (1 hour)

#### 3.1 Check Current Certificates

```bash
# Check existing certificates
certbot certificates

# Note current certificate details
```

#### 3.2 Obtain Multi-Domain Certificate

**Option A: Single Certificate with Multiple SANs (Recommended)**

```bash
# Obtain certificate for all domains
certbot --nginx \
  -d ementech.co.ke \
  -d www.ementech.co.ke \
  -d mail.ementech.co.ke \
  -d dumuwaks.ementech.co.ke \
  -d app.dumuwaks.ementech.co.ke \
  -d api.dumuwaks.ementech.co.ke \
  -d admin.ementech.co.ke \
  --email admin@ementech.co.ke \
  --agree-tos \
  --no-eff-email \
  --redirect
```

**Option B: Separate Certificates** (if Option A fails)

```bash
# Ementech certificate (already exists)
certbot --nginx -d ementech.co.ke -d www.ementech.co.ke

# Dumuwaks certificate
certbot --nginx -d dumuwaks.ementech.co.ke

# Admin certificate
certbot --nginx -d admin.ementech.co.ke
```

#### 3.3 Verify Auto-Renewal

```bash
# Test renewal
certbot renew --dry-run

# Check cron job
cat /etc/cron.d/certbot

# Manual renewal command (if needed)
certbot renew --deploy-hook "systemctl reload nginx"
```

---

### Phase 4: Nginx Multi-Domain Configuration (2 hours)

#### 4.1 Create Configuration Files

```bash
# Create conf.d directory
mkdir -p /etc/nginx/conf.d

# Create configuration files from templates
# (Use files from .agent-workspace/shared-context/nginx-configurations.md)

# Main nginx config
nano /etc/nginx/nginx.conf

# Security configuration
nano /etc/nginx/conf.d/security.conf

# SSL configuration
nano /etc/nginx/conf.d/ssl.conf

# Rate limiting
nano /etc/nginx/conf.d/rate-limit.conf
```

#### 4.2 Create Site Configurations

```bash
# Ementech site
nano /etc/nginx/sites-available/ementech.co.ke.conf

# Dumuwaks site
nano /etc/nginx/sites-available/dumuwaks.ementech.co.ke.conf

# Admin site
nano /etc/nginx/sites-available/admin.ementech.co.ke.conf
```

#### 4.3 Enable Sites

```bash
# Remove default site
rm -f /etc/nginx/sites-enabled/default

# Create symlinks
ln -s /etc/nginx/sites-available/ementech.co.ke.conf /etc/nginx/sites-enabled/
ln -s /etc/nginx/sites-available/dumuwaks.ementech.co.ke.conf /etc/nginx/sites-enabled/
ln -s /etc/nginx/sites-available/admin.ementech.co.ke.conf /etc/nginx/sites-enabled/

# Test configuration
nginx -t

# Expected output: nginx: configuration file /etc/nginx/nginx.conf test is successful
```

#### 4.4 Reload Nginx

```bash
# Test reload (graceful)
systemctl reload nginx

# If issues occur, full restart
systemctl restart nginx

# Check status
systemctl status nginx

# Verify listening ports
netstat -tlnp | grep nginx
```

---

### Phase 5: PM2 Multi-Application Configuration (1.5 hours)

#### 5.1 Create PM2 Ecosystem File

```bash
# Create shared PM2 directory
mkdir -p /var/www/shared/pm2

# Create ecosystem file
nano /var/www/shared/pm2/ecosystem.config.js

# (Use configuration from .agent-workspace/shared-context/pm2-configuration.md)
```

#### 5.2 Stop Current PM2 Processes

```bash
# List current processes
pm2 list

# Stop ementech-backend
pm2 stop ementech-backend

# Save current state
pm2 save
```

#### 5.3 Start All Applications

```bash
# Start using ecosystem file
pm2 start /var/www/shared/pm2/ecosystem.config.js

# Verify all processes
pm2 list

# Check logs
pm2 logs --lines 50

# Monitor
pm2 monit
```

#### 5.4 Configure PM2 Startup

```bash
# Generate startup script
pm2 startup systemd

# Copy and run the output command
# Example: sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u root --hp /root

# Save process list
pm2 save

# Verify systemd service
systemctl status pm2-root

# Enable on boot
systemctl enable pm2-root
```

#### 5.5 Install PM2 Log Rotation

```bash
# Install log rotation module
pm2 install pm2-logrotate

# Configure
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 14
pm2 set pm2-logrotate:compress true
pm2 set pm2-logrotate:rotateInterval '0 0 * * *'
```

---

### Phase 6: DNS Configuration (30 minutes)

#### 6.1 Configure DNS Records

**Access your domain registrar** (e.g., GoDaddy, Namecheap) and add the following records:

```
Type    Name    Value                    TTL
A       @       69.164.244.165           3600
A       www     69.164.244.165           3600
A       mail    69.164.244.165           3600
A       dumuwaks 69.164.244.165          3600
CNAME   app     dumuwaks.ementech.co.ke  3600
CNAME   api     dumuwaks.ementech.co.ke  3600
A       admin   69.164.244.165           3600
```

#### 6.2 Verify DNS Propagation

```bash
# Check DNS records
dig ementech.co.ke
dig dumuwaks.ementech.co.ke
dig admin.ementech.co.ke

# Or use online tool: https://www.whatsmydns.net/
```

---

### Phase 7: Deployment Automation (1 hour)

#### 7.1 Create Automation Scripts

```bash
# Copy scripts from .agent-workspace/shared-context/automation-scripts.md

# Make scripts executable
chmod +x /var/www/shared/scripts/*.sh

# Test scripts
/var/www/shared/scripts/health-check.sh
/var/www/shared/scripts/test-db-connection.sh
```

#### 7.2 Configure Logrotate

```bash
# Create logrotate configuration
cat > /etc/logrotate.d/ementech-apps << 'EOF'
/var/log/pm2/*.log
/var/log/applications/*/*.log
{
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
EOF

# Test logrotate
logrotate -d /etc/logrotate.d/ementech-apps
```

#### 7.3 Setup Cron Jobs

```bash
# Create cron configuration
cat > /etc/cron.d/ementech-apps << 'EOF'
# Health check every 5 minutes
*/5 * * * * root /var/www/shared/scripts/health-check.sh >> /var/log/applications/health-check.log 2>&1

# Resource monitoring every hour
0 * * * * root /var/www/shared/scripts/resource-monitor.sh >> /var/log/applications/resource-monitor.log 2>&1

# Backup daily at 2 AM
0 2 * * * root /var/www/shared/scripts/backup.sh >> /var/log/applications/backup.log 2>&1

# Log cleanup weekly on Sunday at 4 AM
0 4 * * 0 root /var/www/shared/scripts/cleanup-logs.sh

# SSL certificate renewal check daily at 5 AM
0 5 * * * root /var/www/shared/scripts/ssl-renew.sh

# System update weekly on Sunday at 3 AM
0 3 * * 0 root /var/www/shared/scripts/system-update.sh
EOF

# Reload cron
systemctl reload cron
```

---

### Phase 8: Testing and Verification (1 hour)

#### 8.1 Application Health Checks

```bash
# Test Ementech
curl -I https://ementech.co.ke
curl https://ementech.co.ke/api/health

# Test Dumuwaks (frontend not yet deployed)
curl -I https://dumuwaks.ementech.co.ke
curl https://dumuwaks.ementech.co.ke/api/health

# Test Admin
curl -I https://admin.ementech.co.ke
curl https://admin.ementech.co.ke/api/health
```

#### 8.2 SSL Certificate Verification

```bash
# Check certificate details
certbot certificates

# Test SSL connection
openssl s_client -connect ementech.co.ke:443 -servername ementech.co.ke
openssl s_client -connect dumuwaks.ementech.co.ke:443 -servername dumuwaks.ementech.co.ke

# Online SSL checker: https://www.ssllabs.com/ssltest/
```

#### 8.3 Performance Testing

```bash
# Test response time
time curl -s https://ementech.co.ke > /dev/null

# Check nginx status
systemctl status nginx

# Check PM2 status
pm2 list

# Check system resources
htop
df -h
free -h
```

#### 8.4 Security Verification

```bash
# Check firewall status
ufw status

# Check Fail2ban status
fail2ban-client status

# Test SSH login (open new session)

# Check for open ports
nmap -sV localhost
```

---

## Rollback Procedures

### If Nginx Fails

```bash
# Check error log
tail -f /var/log/nginx/error.log

# Restore previous configuration
cp /etc/nginx/nginx.conf.backup /etc/nginx/nginx.conf

# Test configuration
nginx -t

# Restart nginx
systemctl restart nginx
```

### If SSL Certificate Fails

```bash
# Renew certificate
certbot renew

# Reload nginx
systemctl reload nginx

# If still failing, use HTTP only temporarily
# Comment out SSL lines in nginx config
```

### If PM2 Application Fails

```bash
# Check logs
pm2 logs <app-name> --err

# Restart application
pm2 restart <app-name>

# If still failing, revert to previous code
cd /var/www/<app>/releases
# Use previous release directory
ln -sfn /var/www/<app>/releases/<previous-timestamp> /var/www/<app>/current
```

### If Database Connection Fails

```bash
# Test MongoDB connection
mongosh "<mongodb-uri>"

# Check MongoDB Atlas status
# Visit: https://cloud.mongodb.com/

# Check network connectivity
telnet <mongodb-host> 27017

# Verify environment variables
cat /var/www/<app>/backend/.env
```

---

## Post-Implementation Tasks

### Immediate Tasks

- [ ] Monitor all applications for 24 hours
- [ ] Check logs regularly
- [ ] Verify automated backups are running
- [ ] Test email functionality (ementech.co.ke)
- [ ] Verify SSL certificates are auto-renewing

### First Week Tasks

- [ ] Review security logs
- [ ] Optimize nginx caching
- [ ] Fine-tune rate limiting
- [ ] Set up monitoring dashboards
- [ ] Document any issues and solutions

### First Month Tasks

- [ ] Security audit
- [ ] Performance review
- [ ] Backup restoration test
- [ ] Update documentation
- [ ] Plan scaling strategy if needed

---

## Monitoring and Maintenance

### Daily Checks

```bash
# Quick health check
pm2 list
systemctl status nginx
df -h
free -h
```

### Weekly Checks

```bash
# Review logs
tail -100 /var/log/nginx/error.log
pm2 logs --lines 100 --err

# Check disk usage
du -sh /var/log/*
du -sh /var/www/*/releases/*

# Check SSL certificates
certbot certificates
```

### Monthly Tasks

- [ ] Review and update dependencies
- [ ] Security updates
- [ ] Backup verification
- [ ] Performance review
- [ ] Capacity planning

---

## Troubleshooting Guide

### Common Issues and Solutions

**Issue**: 502 Bad Gateway
```bash
# Solution: Check if backend is running
pm2 list
pm2 restart <app-name>
```

**Issue**: SSL Certificate Error
```bash
# Solution: Renew certificate
certbot renew
systemctl reload nginx
```

**Issue**: High Memory Usage
```bash
# Solution: Restart application or adjust max_memory_restart
pm2 restart <app-name>
```

**Issue**: Database Connection Timeout
```bash
# Solution: Check MongoDB Atlas status and network connectivity
ping <mongodb-host>
telnet <mongodb-host> 27017
```

---

## Documentation References

- **Complete Architecture**: `/media/munen/muneneENT/ementech/ementech-website/.agent-workspace/shared-context/MULTI_APP_INFRASTRUCTURE_ARCHITECTURE.md`
- **Nginx Configuration**: `/media/munen/muneneENT/ementech/ementech-website/.agent-workspace/shared-context/nginx-configurations.md`
- **PM2 Configuration**: `/media/munen/muneneENT/ementech/ementech-website/.agent-workspace/shared-context/pm2-configuration.md`
- **Automation Scripts**: `/media/munen/muneneENT/ementech/ementech-website/.agent-workspace/shared-context/automation-scripts.md`

---

## Support Contacts

**Infrastructure Issues**: Architecture Agent
**Deployment Issues**: Deployment Operations Agent
**Application Issues**: Development Team

---

## Appendix

### A. Quick Command Reference

```bash
# PM2
pm2 list                          # List all processes
pm2 logs                          # View all logs
pm2 restart all                   # Restart all apps
pm2 monit                         # Real-time monitoring

# Nginx
nginx -t                          # Test configuration
systemctl reload nginx            # Reload config
systemctl restart nginx           # Restart nginx
tail -f /var/log/nginx/error.log  # View error log

# System
ufw status                        # Firewall status
htop                              # System resources
df -h                             # Disk usage
free -h                           # Memory usage
```

### B. Important File Locations

```
/var/www/shared/                  # Shared resources
/var/www/*/backend/.env           # Environment variables
/etc/nginx/                       # Nginx configuration
/etc/letsencrypt/                 # SSL certificates
/var/log/pm2/                     # PM2 logs
/var/log/nginx/                   # Nginx logs
/var/log/applications/            # Application logs
```

---

**Implementation Status**: Ready to Begin
**Priority**: Critical
**Risk Level**: Medium (mitigated with rollback procedures)
**Estimated Duration**: 6-8 hours
