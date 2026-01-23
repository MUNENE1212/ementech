# Phase 2 Execution Plan - Complete VPS Setup Roadmap

**Phase:** 2 - Interserver VPS Setup
**Start Date:** January 18, 2026 (Ready to execute upon user approval)
**Estimated Duration:** 5-8 hours spread over 1-2 days
**Purpose:** Orchestrate complete VPS setup from scratch to production-ready deployment

---

## Executive Summary

This document provides the complete execution plan for Phase 2: VPS Setup. It outlines the entire process from initial VPS access through final deployment, including timelines, dependencies, and checkpoints.

**What Phase 2 Accomplishes:**
1. VPS initialization and security hardening
2. Installation and configuration of all required software
3. DNS configuration and SSL certificate setup
4. Deployment of all three applications
5. Monitoring and logging setup
6. Testing and verification

**Key Success Factors:**
- DNS propagation requires 24-48 hours (main bottleneck)
- All other tasks can be completed in 4-6 hours
- Parallel execution possible for some tasks
- Clear checkpoints to verify each stage

---

## Table of Contents

1. [Phase Overview](#phase-overview)
2. [Execution Timeline](#execution-timeline)
3. [Stage 1: Pre-Setup Preparation](#stage-1-pre-setup-preparation)
4. [Stage 2: VPS Initialization](#stage-2-vps-initialization)
5. [Stage 3: Software Installation](#stage-3-software-installation)
6. [Stage 4: DNS Configuration](#stage-4-dns-configuration)
7. [Stage 5: SSL Certificate Setup](#stage-5-ssl-certificate-setup)
8. [Stage 6: Application Deployment](#stage-6-application-deployment)
9. [Stage 7: Testing & Verification](#stage-7-testing--verification)
10. [Stage 8: Monitoring Setup](#stage-8-monitoring-setup)
11. [Stage 9: Finalization](#stage-9-finalization)
12. [Critical Dependencies](#critical-dependencies)
13. [Rollback Procedures](#rollback-procedures)
14. [Success Criteria](#success-criteria)

---

## Phase Overview

### Objectives

**Primary Objective:** Configure a production-ready Interserver VPS to host three Ementech applications with high availability, security, and performance.

**Secondary Objectives:**
- Establish repeatable deployment processes
- Implement comprehensive monitoring and logging
- Create disaster recovery procedures
- Document all configurations for future maintenance

### Scope

**In Scope:**
- VPS setup and hardening (Ubuntu 22.04 LTS)
- Installation of Node.js 20.x, MongoDB 7.0, Redis, nginx
- Configuration of PM2 for process management
- SSL certificate setup with Let's Encrypt
- Deployment of ementech-website, dumuwaks-frontend, dumuwaks-backend
- Basic monitoring and logging setup

**Out of Scope:**
- Application code development
- Third-party service account creation (Cloudinary, etc.)
- Advanced monitoring (Sentry, DataDog) - optional
- Load balancer setup - future phase
- CDN configuration - optional enhancement

### Assumptions

1. **User has VPS access credentials** (IP address, root password/SSH key)
2. **User has domain registrar access** for DNS configuration
3. **User has admin email address** for SSL certificates
4. **Applications are locally tested** and builds work
5. **User has allocated 5-8 hours** spread over 1-2 days (mainly waiting for DNS)
6. **Basic Linux command-line knowledge** or willingness to learn

---

## Execution Timeline

### Overall Timeline

```
Day 1 (4-6 hours active work):
├── Pre-Setup Verification:          30 minutes
├── VPS Access & Security:           1 hour
├── Software Installation:           2 hours
├── DNS Configuration:               5 minutes
└── Wait for DNS Propagation:        24-48 hours (passive waiting)

Day 2 (1-2 hours active work):
├── SSL Certificate Setup:           30 minutes (after DNS propagates)
├── Application Deployment:          1-2 hours
├── Testing & Verification:          1 hour
└── Monitoring Setup:                30 minutes
```

### Gantt Chart

```
Task                    Day 1                  Day 2
                 0  1  2  3  4  5  6    0  1  2  3  4  5  6
Pre-Setup        ████
VPS Init            ████
Software              ████████████
DNS Config                     ██████
DNS Propagation              ████████████████████████████
SSL Cert                                              ████
Deployment                                                ████████████
Testing                                                       ████████
Monitor                                                            ████
```

---

## Stage 1: Pre-Setup Preparation

**Duration:** 30 minutes
**Prerequisites:** None
**Deliverable:** All prerequisites verified, ready to begin VPS setup

### Task 1.1: Verify VPS Access (10 minutes)

**Steps:**
1. Locate VPS IP address from Interserver control panel
2. Test SSH connection: `ssh root@YOUR_VPS_IP`
3. Verify OS version: `lsb_release -a`
4. Check system resources: `free -h`, `lscpu`, `df -h`

**Success Criteria:**
- [ ] Can SSH into VPS as root
- [ ] OS is Ubuntu 22.04 LTS (or acceptable alternative)
- [ ] Resources meet minimum requirements (2GB RAM, 1 CPU core, 25GB storage)

**Rollback:** If VPS access fails, contact Interserver support

---

### Task 1.2: Gather Required Information (10 minutes)

**Steps:**
1. Confirm domain access (can log into DNS provider)
2. Verify admin email address (for SSL certificates)
3. Locate deployment scripts in `/deployment/` directory
4. Review `VPS_PREREQUISITES.md` checklist

**Success Criteria:**
- [ ] All items in `PRE_DEPLOYMENT_CHECKLIST.md` Part 1-2 verified
- [ ] Domain registrar access confirmed
- [ ] Admin email address confirmed

**Rollback:** Resolve missing information before proceeding

---

### Task 1.3: Final Go/No-Go Decision (10 minutes)

**Steps:**
1. Review all prerequisites in `PRE_DEPLOYMENT_CHECKLIST.md`
2. Ensure all CRITICAL items checked
3. Confirm sufficient time allocated (5-8 hours)
4. Make final GO/NO-GO decision

**Success Criteria:**
- [ ] All critical prerequisites verified
- [ ] Decision made to proceed

**Rollback:** If NO-GO, document blocking issues and create action plan

---

## Stage 2: VPS Initialization

**Duration:** 1 hour
**Prerequisites:** Stage 1 complete
**Deliverable:** VPS secured, updated, and ready for software installation

### Task 2.1: Initial Server Hardening (30 minutes)

**Steps:**
1. Update system packages: `apt-get update && apt-get upgrade -y`
2. Set hostname: `hostnamectl set-hostname ementech-vps`
3. Set timezone: `timedatectl set-timezone Africa/Nairobi`
4. Configure SSH security (optional: disable password auth, change port)
5. Install fail2ban: `apt-get install -y fail2ban`

**Success Criteria:**
- [ ] System packages updated
- [ ] Hostname set
- [ ] Timezone correct
- [ ] Fail2ban running

**Rollback:** If SSH locked out, access via Interserver VNC console and revert SSH config

**Checkpoint:** Verify can still SSH after security changes

---

### Task 2.2: Install Essential Utilities (30 minutes)

**Steps:**
1. Install basic tools: `curl`, `wget`, `git`, `build-essential`, `ufw`, etc.
2. Configure fail2ban for SSH protection
3. Verify installations

**Success Criteria:**
- [ ] All essential tools installed
- [ ] Git working: `git --version`
- [ ] Fail2ban active: `systemctl status fail2ban`

**Rollback:** Reinstall failed packages if needed

**Checkpoint:** `systemctl status fail2ban` shows "active (running)"

---

## Stage 3: Software Installation

**Duration:** 2 hours
**Prerequisites:** Stage 2 complete
**Deliverable:** All required software installed and configured

### Task 3.1: Node.js & PM2 Installation (20 minutes)

**Steps:**
1. Add NodeSource repository for Node.js 20.x
2. Install Node.js: `apt-get install -y nodejs`
3. Verify: `node --version`, `npm --version`
4. Install PM2 globally: `npm install -g pm2`
5. Install serve globally: `npm install -g serve`

**Success Criteria:**
- [ ] Node.js v20.x.x installed
- [ ] npm working
- [ ] PM2 installed: `pm2 --version`

**Rollback:** Remove and reinstall if wrong version

**Checkpoint:** `node --version` returns v20.x.x

---

### Task 3.2: MongoDB Installation (30 minutes)

**Steps:**
1. Import MongoDB public key
2. Add MongoDB repository
3. Install MongoDB 7.0: `apt-get install -y mongodb-org`
4. Start MongoDB: `systemctl start mongod`
5. Enable MongoDB: `systemctl enable mongod`
6. Test connection: `mongosh --eval "db.adminCommand('ping')"`

**Success Criteria:**
- [ ] MongoDB installed and running
- [ ] Connection test successful
- [ ] Returns `{ ok: 1 }`

**Rollback:** Check logs at `/var/log/mongodb/mongod.log`, fix issues, retry

**Checkpoint:** `systemctl status mongod` shows "active (running)"

---

### Task 3.3: Redis Installation (15 minutes)

**Steps:**
1. Install Redis: `apt-get install -y redis-server`
2. Configure for systemd: `sed -i 's/supervised no/supervised systemd/' /etc/redis/redis.conf`
3. Start Redis: `systemctl start redis-server`
4. Enable Redis: `systemctl enable redis-server`
5. Test: `redis-cli ping` (should return PONG)

**Success Criteria:**
- [ ] Redis installed and running
- [ ] Responds to ping command

**Rollback:** Check configuration, restart service

**Checkpoint:** `systemctl status redis-server` shows "active (running)"

---

### Task 3.4: Nginx Installation (25 minutes)

**Steps:**
1. Install nginx: `apt-get install -y nginx`
2. Start nginx: `systemctl start nginx`
3. Enable nginx: `systemctl enable nginx`
4. Generate DH parameters: `openssl dhparam -out /etc/nginx/ssl/dhparam.pem 2048`
5. Configure main nginx settings (optimize for performance)
6. Test configuration: `nginx -t`

**Success Criteria:**
- [ ] nginx installed and running
- [ ] Configuration test passes
- [ ] Can access http://VPS_IP (nginx welcome page)

**Rollback:** Revert configuration changes if test fails

**Checkpoint:** `curl http://localhost` returns nginx welcome page

---

### Task 3.5: Firewall Configuration (10 minutes)

**Steps:**
1. Allow SSH: `ufw allow 22/tcp`
2. Allow HTTP: `ufw allow 80/tcp`
3. Allow HTTPS: `ufw allow 443/tcp`
4. Enable firewall: `ufw --force enable`
5. Check status: `ufw status verbose`

**Success Criteria:**
- [ ] Firewall active
- [ ] SSH, HTTP, HTTPS allowed
- [ ] Can still access VPS

**Rollback:** If locked out, access via Interserver VNC console

**Checkpoint:** `ufw status` shows all required ports allowed

---

### Task 3.6: Create Deployment User (10 minutes)

**Steps:**
1. Create user: `useradd -m -s /bin/bash node-user`
2. Set password: `passwd node-user`
3. Add to sudo group: `usermod -aG sudo node-user`
4. Configure passwordless sudo for specific commands
5. Create deployment directories: `/var/www/ementech-website`, etc.
6. Set permissions: `chown -R node-user:node-user /var/www`

**Success Criteria:**
- [ ] node-user created
- [ ] Can SSH as node-user
- [ ] Has sudo access for deployment commands
- [ ] Directory structure created

**Rollback:** Delete user and recreate if issues

**Checkpoint:** Can `su - node-user` and access deployment directories

---

### Task 3.7: PM2 Startup Configuration (10 minutes)

**Steps:**
1. Switch to node-user: `su - node-user`
2. Initialize PM2: `pm2 startup systemd`
3. Run generated command (copy output and execute)
4. Save PM2 config: `pm2 save`
5. Exit back to root: `exit`

**Success Criteria:**
- [ ] PM2 startup script installed
- [ ] PM2 will start processes on boot

**Rollback:** Revert systemd service if issues

**Checkpoint:** `systemctl status pm2-root` shows enabled

---

## Stage 4: DNS Configuration

**Duration:** 5 minutes active + 24-48 hours waiting
**Prerequisites:** Stage 3 complete
**Deliverable:** DNS records configured, propagation in progress

### Task 4.1: Configure DNS Records (5 minutes)

**Steps:**
1. Log into DNS provider control panel
2. Add A records:
   - `@` → `YOUR_VPS_IP`
   - `www` → `YOUR_VPS_IP`
   - `app` → `YOUR_VPS_IP`
   - `api` → `YOUR_VPS_IP`
3. Save changes
4. Verify with `dig ementech.co.ke +short` (should return VPS IP eventually)

**Success Criteria:**
- [ ] All A records created
- [ ] DNS records visible in public DNS

**Rollback:** Fix typos in DNS records if misconfigured

**Checkpoint:** `dig ementech.co.ke +short` returns YOUR_VPS_IP

**Note:** DNS propagation takes 24-48 hours. Can proceed to Stage 5 but must wait for propagation before SSL installation.

---

## Stage 5: SSL Certificate Setup

**Duration:** 30 minutes (can only start after DNS propagates)
**Prerequisites:** Stage 4 complete (DNS propagated)
**Deliverable:** SSL certificates installed and auto-renewal configured

### Task 5.1: Install Certbot (5 minutes)

**Steps:**
1. Install Certbot: `apt-get install -y certbot python3-certbot-nginx`
2. Verify: `certbot --version`

**Success Criteria:**
- [ ] Certbot installed

**Rollback:** Reinstall if installation fails

---

### Task 5.2: Install SSL Certificates (20 minutes)

**Steps:**
1. **Verify DNS propagated first:**
   ```bash
   dig ementech.co.ke +short  # Should return YOUR_VPS_IP
   ```
2. Install certificate for main domain:
   ```bash
   certbot --nginx -d ementech.co.ke -d www.ementech.co.ke \
       --non-interactive --agree-tos --email admin@ementech.co.ke --redirect
   ```
3. Install certificate for app subdomain:
   ```bash
   certbot --nginx -d app.ementech.co.ke \
       --non-interactive --agree-tos --email admin@ementech.co.ke --redirect
   ```
4. Install certificate for API subdomain:
   ```bash
   certbot --nginx -d api.ementech.co.ke \
       --non-interactive --agree-tos --email admin@ementech.co.ke --redirect
   ```

**Success Criteria:**
- [ ] Certificates installed for all domains
- [ ] HTTPS works: `curl -I https://ementech.co.ke`
- [ ] HTTP redirects to HTTPS

**Rollback:** If fails, check DNS propagation, fix DNS issues, retry

**Checkpoint:** `certbot certificates` shows all certificates

---

### Task 5.3: Configure Auto-Renewal (5 minutes)

**Steps:**
1. Test renewal: `certbot renew --dry-run`
2. Enable timer: `systemctl enable certbot.timer`
3. Start timer: `systemctl start certbot.timer`
4. Check status: `systemctl status certbot.timer`

**Success Criteria:**
- [ ] Auto-renewal enabled
- [ ] Dry run successful

**Rollback:** Manually renew certificates if auto-renewal fails

**Checkpoint:** `systemctl status certbot.timer` shows active

---

## Stage 6: Application Deployment

**Duration:** 1-2 hours
**Prerequisites:** Stages 1-5 complete
**Deliverable:** All three applications deployed and running

### Task 6.1: Deploy ementech-website (30 minutes)

**Steps:**
1. Run deployment script: `./deploy-ementech.sh`
2. Or manually:
   - Copy build to VPS
   - Extract to `/var/www/ementech-website/current`
   - Configure nginx server block
   - Test nginx config: `nginx -t`
   - Reload nginx: `systemctl reload nginx`
3. Test: `curl -I https://ementech.co.ke`

**Success Criteria:**
- [ ] Site accessible at https://ementech.co.ke
- [ ] All pages load correctly
- [ ] HTTP redirects to HTTPS

**Rollback:** Switch to previous release if deployment fails

**Checkpoint:** Browser shows ementech website

---

### Task 6.2: Deploy dumuwaks-frontend (30 minutes)

**Steps:**
1. Run deployment script: `./deploy-dumuwaks.sh --frontend-only`
2. Or manually:
   - Copy build to VPS
   - Extract to `/var/www/dumuwaks-frontend/current`
   - Configure nginx server block for app.ementech.co.ke
   - Test nginx config: `nginx -t`
   - Reload nginx: `systemctl reload nginx`
3. Test: `curl -I https://app.ementech.co.ke`

**Success Criteria:**
- [ ] Frontend accessible at https://app.ementech.co.ke
- [ ] React Router working (no 404s on refresh)
- [ ] API calls configured correctly

**Rollback:** Switch to previous release if deployment fails

**Checkpoint:** Browser shows dumuwaks frontend

---

### Task 6.3: Deploy dumuwaks-backend (30-60 minutes)

**Steps:**
1. Create production environment file: `/var/www/dumuwaks-backend/current/.env`
2. Fill in all required variables (refer to `.env.production.template`)
3. Run deployment script: `./deploy-dumuwaks.sh --backend-only`
4. Or manually:
   - Copy code to VPS
   - Extract to `/var/www/dumuwaks-backend/current`
   - Install dependencies: `npm ci --production`
   - Start with PM2: `pm2 start ecosystem.config.js --env production`
   - Save PM2: `pm2 save`
5. Configure nginx server block for api.ementech.co.ke
6. Test: `curl https://api.ementech.co.ke/health`

**Success Criteria:**
- [ ] Backend running: `pm2 list` shows online
- [ ] API accessible at https://api.ementech.co.ke
- [ ] Health check endpoint responds
- [ ] Database connection working

**Rollback:** Switch to previous release, restart PM2

**Checkpoint:** `pm2 list` shows backend process online

---

## Stage 7: Testing & Verification

**Duration:** 1 hour
**Prerequisites:** Stage 6 complete
**Deliverable:** All applications tested and verified working

### Task 7.1: Functionality Testing (30 minutes)

**Test ementech-website:**
```bash
# Test HTTPS
curl -I https://ementech.co.ke
# Should return HTTP/2 200

# Test all pages (manual browser test)
# - https://ementech.co.ke/
# - https://ementech.co.ke/products
# - https://ementech.co.ke/services
# - https://ementech.co.ke/about
# - https://ementech.co.ke/contact
```

**Test dumuwaks-frontend:**
```bash
# Test HTTPS
curl -I https://app.ementech.co.ke
# Should return HTTP/2 200

# Manual browser test
# - Load login page
# - Navigate to different sections
# - Test responsive design
```

**Test dumuwaks-backend:**
```bash
# Test health endpoint
curl https://api.ementech.co.ke/health
# Should return healthy status

# Test API endpoints (if authentication allows)
# Test database connection
# Test Socket.IO (if implemented)
```

**Success Criteria:**
- [ ] All sites accessible via HTTPS
- [ ] No browser console errors
- [ ] All functionality works

---

### Task 7.2: Performance Testing (15 minutes)

**Steps:**
1. Check page load times (browser DevTools)
2. Test with multiple concurrent users
3. Monitor VPS resources: `htop`, `pm2 monit`
4. Check nginx logs: `tail -f /var/log/nginx/access.log`

**Success Criteria:**
- [ ] Page load times < 3 seconds
- [ ] VPS resources not exhausted
- [ ] No significant errors in logs

---

### Task 7.3: Security Testing (15 minutes)

**Steps:**
1. Test SSL: https://www.ssllabs.com/ssltest/
2. Check for security headers: `curl -I https://ementech.co.ke`
3. Verify firewall: `ufw status`
4. Check for open ports: `nmap YOUR_VPS_IP` (from local machine)

**Success Criteria:**
- [ ] SSL grade A or better
- [ ] Security headers present
- [ ] Only ports 22, 80, 443 open
- [ ] No obvious security vulnerabilities

---

## Stage 8: Monitoring Setup

**Duration:** 30 minutes
**Prerequisites:** Stage 7 complete
**Deliverable:** Monitoring and logging configured

### Task 8.1: Configure Log Rotation (15 minutes)

**Steps:**
1. Configure PM2 log rotation: `pm2 install pm2-logrotate`
2. Set retention: `pm2 set pm2-logrotate:retain 7`
3. Configure system log rotation (already in setup script)
4. Test: `logrotate -d /etc/logrotate.d/pm2`

**Success Criteria:**
- [ ] Log rotation configured for all services
- [ ] Old logs will be compressed and deleted

---

### Task 8.2: Setup Basic Monitoring (15 minutes)

**Steps:**
1. Create health check script (see `STEP_BY_STEP_SETUP.md`)
2. Add to crontab for periodic checks
3. Configure PM2 monitoring: `pm2 install pm2-logrotate`
4. Optional: Install Sentry or other monitoring service

**Success Criteria:**
- [ ] Health checks configured
- [ ] PM2 monitoring active
- [ ] Logs being collected

---

## Stage 9: Finalization

**Duration:** 30 minutes
**Prerequisites:** All previous stages complete
**Deliverable:** VPS fully operational and documented

### Task 9.1: Save Important Information (15 minutes)

**Steps:**
1. Create `/root/vps-credentials.txt` with all important info
2. Secure the file: `chmod 600 /root/vps-credentials.txt`
3. Copy information off VPS to secure location
4. Delete credentials file from VPS after copying

**Success Criteria:**
- [ ] All credentials documented
- [ ] Information backed up securely
- [ ] Credentials removed from VPS

---

### Task 9.2: Final System Verification (10 minutes)

**Steps:**
1. Check all services: `systemctl status mongod redis-server nginx pm2-root`
2. Check PM2 processes: `pm2 list`
3. Check disk space: `df -h`
4. Check memory: `free -h`
5. Test all sites one more time

**Success Criteria:**
- [ ] All services running
- [ ] Sufficient free resources
- [ ] All sites accessible

---

### Task 9.3: Create Deployment Documentation (5 minutes)

**Steps:**
1. Document any deviations from standard setup
2. Note any custom configurations
3. Document troubleshooting steps taken
4. Save to `/root/deployment-notes.txt`

**Success Criteria:**
- [ ] Deployment documented
- [ ] Notes saved for future reference

---

## Critical Dependencies

### Must Complete in Order

1. **Stage 1 (Pre-Setup)** MUST be first
2. **Stage 2 (VPS Init)** depends on Stage 1
3. **Stage 3 (Software Install)** depends on Stage 2
4. **Stage 4 (DNS Config)** can happen anytime after Stage 2
5. **Stage 5 (SSL Certs)** MUST wait for Stage 4 DNS propagation
6. **Stage 6 (Deployment)** depends on Stages 3 and 5
7. **Stage 7 (Testing)** depends on Stage 6
8. **Stages 8-9 (Finalize)** depend on Stage 7

### Can Happen in Parallel

- **DNS Configuration** (Stage 4) can happen during Stage 3
- **Waiting for DNS propagation** is passive time
- **Application testing** can happen incrementally

### Blocking Items

**DNS Propagation** is the main blocker:
- Cannot install SSL certificates until DNS propagates
- Can continue with most other work during waiting period
- Typically takes 1-48 hours (usually 2-6 hours)

---

## Rollback Procedures

### If VPS Setup Fails

**During Stage 2-3 (Software Installation):**
- Identify failed component
- Check logs for errors
- Reinstall failed component
- If unrecoverable: rebuild VPS from scratch (Interserver allows this)

**During Stage 6 (Application Deployment):**
- Switch to previous release:
  ```bash
  ln -sfn /var/www/app/releases/PREVIOUS_TIMESTAMP /var/www/app/current
  pm2 restart app
  ```
- If deployment script fails: manually deploy
- If critical bug: fix in development, rebuild, redeploy

**If SSL Certificate Fails:**
- Check DNS propagation: `dig ementech.co.ke +short`
- Check firewall: ensure port 80 open
- Retry certificate installation
- If still fails: use temporary self-signed certificate (not recommended for production)

---

## Success Criteria

### Phase 2 Complete When:

**Technical Criteria:**
- [x] All software installed and running (Node.js, MongoDB, Redis, nginx, PM2)
- [x] All three applications deployed and accessible
- [x] SSL certificates installed and working
- [x] Firewall configured and active
- [x] All services start on boot
- [x] Log rotation configured
- [x] Basic monitoring in place

**Functional Criteria:**
- [x] ementech.co.ke accessible and functional
- [x] app.ementech.co.ke accessible and functional
- [x] api.ementech.co.ke accessible and functional
- [x] All HTTP traffic redirects to HTTPS
- [x] No browser console errors
- [x] Page load times acceptable (< 3 seconds)

**Operational Criteria:**
- [x] Documentation complete
- [x] Credentials securely stored
- [x] Rollback procedures tested
- [x] Team trained on basic operations

---

## Post-Phase 2 Next Steps

**After Phase 2 Complete:**

1. **Monitor for 24-48 hours**
   - Check error logs regularly
   - Monitor resource usage
   - Test from different geographic locations

2. **Optimize as Needed**
   - Add caching if slow
   - Scale VPS if resources exhausted
   - Tune database queries

3. **Plan for Enhancements**
   - Advanced monitoring (Sentry, DataDog)
   - CDN setup (Cloudflare)
   - Database backups to remote storage
   - Load balancing for high availability

---

## Document Version

**Version:** 1.0
**Last Updated:** January 18, 2026
**Maintained By:** Ementech Deployment Team

**For Questions:**
- Review specific stage documentation
- Consult troubleshooting guide
- Create escalation ticket if needed

---

**Ready to Execute!** Once user provides VPS credentials and confirms prerequisites, this plan can be executed start to finish.
