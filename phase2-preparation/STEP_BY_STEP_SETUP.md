# Step-by-Step VPS Setup Guide

**Phase:** 2 - Interserver VPS Setup
**Date:** January 18, 2026
**Estimated Duration:** 2-4 hours (excluding DNS propagation)
**Purpose:** Complete idiot-proof guide for setting up VPS from scratch

---

## Executive Summary

This guide provides a detailed, step-by-step process for setting up your Interserver VPS to host all Ementech projects. Each step includes commands to run, verification checks, and troubleshooting tips.

**What This Guide Covers:**
1. Initial VPS access and security hardening
2. System updates and dependency installation
3. User creation and permissions
4. Firewall configuration
5. Installation of Node.js, MongoDB, Redis, nginx, PM2
6. SSL certificate setup with Let's Encrypt
7. Directory structure creation
8. Monitoring and logging setup

**Before You Begin:** Ensure you have completed all prerequisites listed in `VPS_PREREQUISITES.md`

---

## Table of Contents

1. [Pre-Setup Verification](#1-pre-setup-verification)
2. [Initial VPS Access](#2-initial-vps-access)
3. [Security Hardening](#3-security-hardening)
4. [System Update & Package Installation](#4-system-update--package-installation)
5. [Node.js & PM2 Setup](#5-nodejs--pm2-setup)
6. [MongoDB Installation](#6-mongodb-installation)
7. [Redis Installation](#7-redis-installation)
8. [Nginx Installation & Configuration](#8-nginx-installation--configuration)
9. [Firewall Configuration](#9-firewall-configuration)
10. [Deployment User Creation](#10-deployment-user-creation)
11. [Directory Structure Setup](#11-directory-structure-setup)
12. [SSL Certificate Installation](#12-ssl-certificate-installation)
13. [PM2 Configuration](#13-pm2-configuration)
14. [Log Rotation Setup](#14-log-rotation-setup)
15. [System Optimization](#15-system-optimization)
16. [Final Verification](#16-final-verification)
17. [Post-Setup Tasks](#17-post-setup-tasks)

---

## 1. Pre-Setup Verification

### Checklist Before Starting

**Ensure you have:**
- [ ] VPS IP address
- [ ] Root password or SSH private key
- [ ] SSH client installed (Linux/Mac: built-in, Windows: PowerShell or PuTTY)
- [ ] Domain access ready (for DNS configuration later)
- [ ] Admin email address (for SSL certificates)
- [ ] 2-4 hours of uninterrupted time

### Test SSH Connection

**Before running setup, verify you can connect:**

```bash
# Replace with your actual VPS IP
ssh root@YOUR_VPS_IP

# Or using SSH key
ssh -i /path/to/private-key root@YOUR_VPS_IP
```

**Expected Result:**
- Prompt for password (or successful login with SSH key)
- Welcome message from Interserver
- Root shell access (`root@vps:~#` prompt)

**If Connection Fails:**
- **"Connection refused"**: VPS might still be provisioning. Wait 5-10 minutes.
- **"Permission denied"**: Wrong password or SSH key. Check Interserver control panel.
- **"Host key verification failed"**: VPS was rebuilt. Remove old key with `ssh-keygen -R YOUR_VPS_IP`

**Once Connected, Proceed to Step 2**

---

## 2. Initial VPS Access

### Step 2.1: Connect to VPS

```bash
# Connect to your VPS
ssh root@YOUR_VPS_IP

# You'll see output like:
# Welcome to Ubuntu 22.04.3 LTS (GNU/Linux 5.15.0-76-generic x86_64)
# ...
# root@vps:~#
```

### Step 2.2: Verify Operating System

```bash
# Check OS version
lsb_release -a

# Expected output:
# Distributor ID: Ubuntu
# Description:    Ubuntu 22.04.3 LTS
# Release:        22.04
# Codename:       jammy
```

**If NOT Ubuntu 22.04 LTS:**
- Ubuntu 20.04 LTS: Scripts will work, but consider upgrading
- Ubuntu 24.04 LTS: Scripts should work, but report any issues
- Other distributions: DO NOT proceed. Contact deployment team.

### Step 2.3: Check System Resources

```bash
# Check RAM
free -h

# Expected output for 2 slices:
#               total        used        free      shared  buff/cache   available
# Mem:           3.8Gi       350Mi       3.2Gi       1.0Mi       350Mi       3.3Gi

# Check CPU
lscpu | grep "^CPU(s)"

# Expected output for 2 slices:
# CPU(s):              2

# Check Storage
df -h

# Expected output for 2 slices:
# Filesystem      Size  Used Avail Use% Mounted on
# /dev/root        48G  5.0G   42G  11% /
```

**If resources don't match your plan:**
- You may have been allocated a different plan
- Check Interserver control panel to verify slice allocation
- Contact Interserver support if incorrect

---

## 3. Security Hardening

### Step 3.1: Update System Packages

```bash
# Set non-interactive mode (prevents configuration prompts)
export DEBIAN_FRONTEND=noninteractive

# Update package list
apt-get update

# Upgrade installed packages
apt-get upgrade -y

# Remove unnecessary packages
apt-get autoremove -y

# Clean package cache
apt-get autoclean -y
```

**Time Required:** 5-10 minutes

**Verification:**
```bash
# No errors should appear
# Last line should show something like:
# 0 upgraded, 0 newly installed, 0 to remove and 0 not upgraded.
```

---

### Step 3.2: Set Hostname

```bash
# Set hostname
hostnamectl set-hostname ementech-vps

# Verify hostname
hostname

# Expected output:
# ementech-vps
```

---

### Step 3.3: Set Timezone

```bash
# Set timezone to Africa/Nairobi (Kenya)
timedatectl set-timezone Africa/Nairobi

# Verify timezone
timedatectl

# Expected output includes:
# Time zone: Africa/Nairobi (EAT, +0300)
```

---

### Step 3.4: Configure SSH Security

**IMPORTANT:** Before changing SSH config, ensure you have SSH key set up or you'll be locked out.

```bash
# Edit SSH configuration
nano /etc/ssh/sshd_config
```

**Change these settings:**

```ssh
# Find and modify these lines:

# Disable root login with password (ONLY if you have SSH key working)
PermitRootLogin prohibit-password

# OR if you don't have SSH key yet, keep:
# PermitRootLogin yes

# Disable password authentication (ONLY if you have SSH key)
PasswordAuthentication no

# Change default port (optional, adds security through obscurity)
# Port 22  ->  Port 2222  (or any high port)

# Limit login attempts
MaxAuthTries 3
```

**Save and Exit:** Press `Ctrl+X`, then `Y`, then `Enter`

**Restart SSH:**
```bash
systemctl restart sshd

# DON'T CLOSE YOUR CURRENT SESSION YET!
# Open a NEW terminal window and test SSH connection:
# ssh root@YOUR_VPS_IP

# If new connection works, close original session
# If new connection fails, revert changes in original session
```

---

### Step 3.5: Create SSH Key for Deployment User (Optional but Recommended)

**If you want to use SSH keys instead of passwords:**

```bash
# Generate SSH key pair on your LOCAL machine (not VPS)
# Run this on your local computer:

ssh-keygen -t ed25519 -a 100 -f ~/.ssh/ementech_vps -C "ementech-vps"

# Copy public key to VPS
ssh-copy-id -i ~/.ssh/ementech_vps.pub root@YOUR_VPS_IP

# Test key-based login
ssh -i ~/.ssh/ementech_vps root@YOUR_VPS_IP

# If successful, you can disable password authentication in Step 3.4
```

---

## 4. System Update & Package Installation

### Step 4.1: Install Essential Utilities

```bash
# Install basic tools
apt-get install -y \
    curl \
    wget \
    git \
    unzip \
    build-essential \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release \
    ufw \
    fail2ban \
    htop \
    nano \
    vim \
    tree \
    net-tools \
    rsync \
    zip \
    jq
```

**Time Required:** 3-5 minutes

**What These Do:**
- `curl`, `wget`: Download files from internet
- `git`: Version control (for deployment)
- `build-essential`: Compiling software from source
- `ufw`: Firewall management
- `fail2ban`: Intrusion prevention
- `htop`: Process monitoring
- `tree`: Directory visualization
- `jq`: JSON parsing (for API calls)

**Verification:**
```bash
# Check git version
git --version
# Expected: git version 2.x.x

# Check curl
curl --version
# Expected: curl 7.x.x
```

---

### Step 4.2: Configure Fail2Ban

**Fail2Ban bans IP addresses that make too many failed login attempts.**

```bash
# Install fail2ban (already installed in Step 4.1, just configure)

# Copy default configuration
cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local

# Edit configuration
nano /etc/fail2ban/jail.local
```

**Find and modify these settings:**

```ini
[DEFAULT]
# Ban IP for 1 hour
bantime = 3600

# Find failures within 10 minutes
findtime = 600

# Ban after 3 failures
maxretry = 3

[sshd]
enabled = true
port = ssh
# Or custom port if you changed it in Step 3.4
# port = 2222
```

**Save and Exit:** `Ctrl+X`, `Y`, `Enter`

**Enable and Start Fail2Ban:**
```bash
systemctl enable fail2ban
systemctl start fail2ban

# Check status
systemctl status fail2ban

# Expected output includes:
# Active: active (running)
```

---

## 5. Node.js & PM2 Setup

### Step 5.1: Install Node.js 20.x LTS

```bash
# Add NodeSource repository for Node.js 20.x
curl -fsSL "https://deb.nodesource.com/setup_20.x" | bash -

# Install Node.js
apt-get install -y nodejs

# Verify installation
node --version
# Expected: v20.x.x

npm --version
# Expected: 10.x.x
```

**Time Required:** 2-3 minutes

---

### Step 5.2: Configure npm for Global Packages

```bash
# Create directory for global packages
mkdir -p /usr/local/lib/node_modules/global

# Configure npm to use this directory
npm config set prefix '/usr/local/lib/node_modules/global'

# Add to PATH (for all users)
echo 'export PATH=/usr/local/lib/node_modules/global/bin:$PATH' >> /etc/profile

# Reload PATH
source /etc/profile
```

---

### Step 5.3: Install PM2 Globally

```bash
# Install PM2 process manager
npm install -g pm2

# Verify PM2 installation
pm2 --version
# Expected: 5.x.x or higher

# Install serve (for serving static React builds)
npm install -g serve

# Verify serve installation
serve --version
# Expected: 14.x.x or higher
```

**What These Do:**
- `pm2`: Process manager for Node.js applications (auto-restart, clustering, logging)
- `serve`: Lightweight static file server (for React builds)

---

## 6. MongoDB Installation

### Step 6.1: Import MongoDB Public Key

```bash
# Import MongoDB 7.0 GPG key
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
    gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
```

---

### Step 6.2: Add MongoDB Repository

```bash
# Add MongoDB repository to sources list
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] \
    https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | \
    tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Update package list
apt-get update
```

---

### Step 6.3: Install MongoDB

```bash
# Install MongoDB
apt-get install -y mongodb-org

# Start MongoDB
systemctl start mongod

# Enable MongoDB to start on boot
systemctl enable mongod

# Verify MongoDB is running
systemctl status mongod

# Expected output includes:
# Active: active (running)
```

**Time Required:** 3-5 minutes

---

### Step 6.4: Verify MongoDB Installation

```bash
# Test MongoDB connection
mongosh --eval "db.adminCommand('ping')"

# Expected output:
# { ok: 1 }

# Check MongoDB version
mongosh --eval "db.version()"
# Expected: 7.0.x or higher

# Create admin user (optional but recommended for production)
mongosh

# In MongoDB shell:
use admin
db.createUser({
  user: "admin",
  pwd: "YOUR_SECURE_PASSWORD",  # Replace with strong password
  roles: [ { role: "userAdminAnyDatabase", db: "admin" } ]
})
exit
```

**IMPORTANT:** Save the MongoDB admin password securely!

---

## 7. Redis Installation

### Step 7.1: Install Redis

```bash
# Install Redis server
apt-get install -y redis-server

# Configure Redis to use systemd supervision
sed -i 's/supervised no/supervised systemd/' /etc/redis/redis.conf
```

---

### Step 7.2: Start Redis

```bash
# Start Redis
systemctl start redis-server

# Enable Redis to start on boot
systemctl enable redis-server

# Verify Redis is running
systemctl status redis-server

# Expected output includes:
# Active: active (running)
```

**Time Required:** 1-2 minutes

---

### Step 7.3: Test Redis

```bash
# Test Redis connection
redis-cli ping

# Expected output:
# PONG

# Test set/get
redis-cli set test "Hello World"
redis-cli get test

# Expected output:
# "Hello World"
```

**Note:** Redis will be used for session storage and caching (optional but recommended).

---

## 8. Nginx Installation & Configuration

### Step 8.1: Install Nginx

```bash
# Install nginx
apt-get install -y nginx

# Start nginx
systemctl start nginx

# Enable nginx to start on boot
systemctl enable nginx

# Verify nginx is running
systemctl status nginx

# Expected output includes:
# Active: active (running)
```

**Time Required:** 2 minutes

---

### Step 8.2: Generate Diffie-Hellman Parameters (For SSL)

**This improves SSL security but takes time to generate.**

```bash
# Create SSL directory
mkdir -p /etc/nginx/ssl

# Generate DH parameters (this takes 5-10 minutes)
openssl dhparam -out /etc/nginx/ssl/dhparam.pem 2048

# Progress indicator:
# ........+..................
# (this is normal, be patient)
```

**Time Required:** 5-10 minutes

**Verification:**
```bash
# Check file was created
ls -lh /etc/nginx/ssl/dhparam.pem

# Expected output:
# -rw-r--r-- 1 root root 424 Jan 18 12:34 /etc/nginx/ssl/dhparam.pem
```

---

### Step 8.3: Test Nginx

```bash
# Test nginx configuration
nginx -t

# Expected output:
# nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
# nginx: configuration file /etc/nginx/nginx.conf test is successful

# Test nginx is serving
curl http://localhost

# Expected output: HTML page (nginx welcome page)
```

---

### Step 8.4: Configure Main Nginx Settings

```bash
# Backup original configuration
cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup

# Edit main configuration
nano /etc/nginx/nginx.conf
```

**Add/modify these settings:**

```nginx
user www-data;
worker_processes auto;
pid /run/nginx.pid;
include /etc/nginx/modules-enabled/*.conf;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    ##
    # Basic Settings
    ##
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    server_tokens off;

    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    ##
    # SSL Settings
    ##
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_dhparam /etc/nginx/ssl/dhparam.pem;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    ##
    # Logging Settings
    ##
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;

    ##
    # Gzip Compression
    ##
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss;

    ##
    # Virtual Host Configs
    ##
    include /etc/nginx/conf.d/*.conf;
    include /etc/nginx/sites-enabled/*;
}
```

**Save and Exit:** `Ctrl+X`, `Y`, `Enter`

**Test Configuration:**
```bash
nginx -t
# Should show "syntax is ok"

# Reload nginx
systemctl reload nginx
```

---

## 9. Firewall Configuration

### Step 9.1: Configure UFW (Uncomplicated Firewall)

```bash
# Allow SSH (CRITICAL - do this first!)
ufw allow 22/tcp

# Allow HTTP and HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Allow custom SSH port if you changed it in Step 3.4
# ufw allow 2222/tcp

# (Optional) Allow Node.js apps directly if not using nginx only
# ufw allow 3000/tcp
# ufw allow 3001/tcp
# ufw allow 5000/tcp

# (Optional) Allow MongoDB only if you need remote access (NOT recommended)
# ufw allow from YOUR_IP_ADDRESS to any port 27017

# Enable firewall
ufw --force enable

# Check firewall status
ufw status verbose

# Expected output:
# Status: active
#
# To                         Action      From
# --                         ------      ----
# 22/tcp                     ALLOW IN    Anywhere
# 80/tcp                     ALLOW IN    Anywhere
# 443/tcp                    ALLOW IN    Anywhere
```

**WARNING:** Ensure SSH is allowed before enabling firewall, or you'll be locked out!

---

### Step 9.2: Verify Firewall

```bash
# Check firewall is active
ufw status

# Expected: Status: active

# Test that you can still access services
curl http://localhost
# Should work

# From your local machine, test:
# curl http://YOUR_VPS_IP
# Should work (port 80 is open)
```

---

## 10. Deployment User Creation

### Step 10.1: Create Deployment User

```bash
# Create user named "node-user"
useradd -m -s /bin/bash node-user

# Set password (generate secure password)
passwd node-user

# Enter and confirm a strong password
# Example: kJ8#mP2$vL9@qX5

# Add user to sudo group
usermod -aG sudo node-user

# Verify user was created
id node-user

# Expected output:
# uid=1001(node-user) gid=1001(node-user) groups=1001(node-user),27(sudo)
```

---

### Step 10.2: Configure Sudo for Deployment User

```bash
# Create sudoers file for node-user
nano /etc/sudoers.d/node-user
```

**Add this line:**

```
node-user ALL=(ALL) NOPASSWD: /usr/bin/npm, /usr/bin/pm2, /usr/bin/serve, /usr/bin/systemctl reload nginx, /usr/sbin/nginx
```

**Save and Exit:** `Ctrl+X`, `Y`, `Enter`

**Set Permissions:**
```bash
chmod 0440 /etc/sudoers.d/node-user

# Verify sudoers file syntax
visudo -c

# Expected output:
# /etc/sudoers.d/node-user: parsed OK
```

**What This Does:** Allows node-user to run specific commands without password (needed for deployment scripts)

---

## 11. Directory Structure Setup

### Step 11.1: Create Application Directories

```bash
# Create main deployment directories
mkdir -p /var/www/ementech-website/{current,releases,shared}
mkdir -p /var/www/dumuwaks-frontend/{current,releases,shared}
mkdir -p /var/www/dumuwaks-backend/{current,releases,shared}

# Create log directories
mkdir -p /var/log/pm2
mkdir -p /var/log/apps

# Create upload directories
mkdir -p /var/www/uploads
mkdir -p /var/www/dumuwaks-backend/uploads

# Verify directory structure
tree /var/www -L 2

# Expected output shows:
# /var/www/
# ├── dumuwaks-backend/
# │   ├── current
# │   ├── releases
# │   └── shared
# ├── dumuwaks-frontend/
# │   ├── current
# │   ├── releases
# │   └── shared
# ├── ementech-website/
# │   ├── current
# │   ├── releases
# │   └── shared
# └── uploads
```

---

### Step 11.2: Set Directory Permissions

```bash
# Set ownership to node-user
chown -R node-user:node-user /var/www

# Also set www-data ownership (for nginx)
chown -R www-data:www-data /var/www

# Set permissions
chmod -R 775 /var/www

# Verify permissions
ls -la /var/www

# Expected output shows node-user and www-data as owners
```

---

## 12. SSL Certificate Installation

### Step 12.1: Install Certbot

```bash
# Install Certbot and nginx plugin
apt-get install -y certbot python3-certbot-nginx

# Verify installation
certbot --version
# Expected: certbot 2.x.x or higher
```

---

### Step 12.2: Configure DNS Records

**BEFORE installing SSL certificates, you must configure DNS:**

```
Add these A records at your DNS provider:

Type    Name                    Value              TTL
----    ----                    -----              ---
A       @                       YOUR_VPS_IP        3600
A       www                     YOUR_VPS_IP        3600
A       app                     YOUR_VPS_IP        3600
A       api                     YOUR_VPS_IP        3600
```

**How to Add DNS Records:**
1. Log into your DNS provider (e.g., Cloudflare, Namecheap)
2. Find DNS management section
3. Add A records as shown above
4. Save changes

**Verify DNS Propagation:**
```bash
# From your local machine (not VPS):
dig ementech.co.ke +short
# Expected output: YOUR_VPS_IP

dig app.ementech.co.ke +short
# Expected output: YOUR_VPS_IP

dig api.ementech.co.ke +short
# Expected output: YOUR_VPS_IP
```

**Note:** DNS propagation can take 1-48 hours. Usually completes within a few hours.

---

### Step 12.3: Install SSL Certificates

**IMPORTANT:** Only run this after DNS records have propagated!

```bash
# Install certificate for main domain
certbot --nginx -d ementech.co.ke -d www.ementech.co.ke \
    --non-interactive --agree-tos --email admin@ementech.co.ke --redirect

# Expected output:
# Successfully received certificate.
# Congratulations! You have successfully enabled https://ementech.co.ke
```

**If DNS hasn't propagated yet, you'll get an error:**
```
Certbot failed to authenticate some domains
```

**Solution:** Wait for DNS propagation (check with `dig` command above), then retry.

---

### Step 12.4: Install Certificates for Subdomains

```bash
# Install certificate for app subdomain
certbot --nginx -d app.ementech.co.ke \
    --non-interactive --agree-tos --email admin@ementech.co.ke --redirect

# Install certificate for api subdomain
certbot --nginx -d api.ementech.co.ke \
    --non-interactive --agree-tos --email admin@ementech.co.ke --redirect
```

---

### Step 12.5: Verify SSL Certificates

```bash
# Check installed certificates
certbot certificates

# Expected output shows certificates for:
# - ementech.co.ke
# - app.ementech.co.ke
# - api.ementech.co.ke

# Test HTTPS from your local machine
curl -I https://ementech.co.ke

# Expected output includes:
# HTTP/2 200
# server: nginx
```

---

### Step 12.6: Setup Auto-Renewal

```bash
# Test auto-renewal (dry run)
certbot renew --dry-run

# Expected output:
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
# renewing certificates...
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

# Enable auto-renewal timer
systemctl enable certbot.timer
systemctl start certbot.timer

# Check timer status
systemctl status certbot.timer

# Expected output:
# Active: active (running)
```

**What This Does:** Certificates will automatically renew 30 days before expiration.

---

## 13. PM2 Configuration

### Step 13.1: Configure PM2 Startup

```bash
# Switch to node-user
su - node-user

# Initialize PM2 startup script
pm2 startup systemd

# Expected output:
# [PM2] Init System found: systemd
# ...
# [PM2] To setup the Startup Script, copy/paste the following command:
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -hp /home/node-user --service-name pm2-root

# Copy and run the command shown above (it will be different)
# Example:
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -hp /home/node-user --service-name pm2-root

# Expected output:
# Platform systemd
# Template ...
# Target path ...
# Command list ...
# ...
# [PM2] Writing init configuration in /etc/systemd/system/pm2-root.service
# [PM2] Making script booting at startup.
# [PM2] -systemd- Using the command:
#      systemctl enable pm2-root
# [PM2] Done.
```

---

### Step 13.2: Save PM2 Configuration

```bash
# Save current PM2 process list (empty for now)
pm2 save

# Expected output:
# [PM2] Dumping process list
```

**What This Does:** PM2 will automatically restart all processes on system reboot.

---

### Step 13.3: Exit Back to Root

```bash
# Exit back to root user
exit

# Verify you're root
whoami
# Expected: root
```

---

## 14. Log Rotation Setup

### Step 14.1: Configure PM2 Log Rotation

```bash
# Install PM2 log rotation module (optional but recommended)
pm2 install pm2-logrotate

# Configure log rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true

# What this does:
# - Rotate logs when they reach 10MB
# - Keep logs for 7 days
# - Compress rotated logs
```

---

### Step 14.2: Configure System Log Rotation

```bash
# Create PM2 log rotation configuration
cat > /etc/logrotate.d/pm2 <<EOF
/var/log/pm2/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 node-user node-user
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
EOF

# Create application log rotation configuration
cat > /etc/logrotate.d/apps <<EOF
/var/log/apps/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
}
EOF

# Create nginx log rotation configuration
cat > /etc/logrotate.d/nginx-custom <<EOF
/var/log/nginx/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
    sharedscripts
    postrotate
        systemctl reload nginx >/dev/null 2>&1
    endscript
}
EOF

# Test log rotation configurations
logrotate -d /etc/logrotate.d/pm2
logrotate -d /etc/logrotate.d/apps
logrotate -d /etc/logrotate.d/nginx-custom

# Expected output for each:
# reading config file ...
# ...
# No errors
```

**What This Does:** Automatically rotate and compress logs to prevent disk filling.

---

## 15. System Optimization

### Step 15.1: Configure System Limits

```bash
# Create system limits configuration
cat > /etc/security/limits.d/node-app.conf <<EOF
* soft nofile 65536
* hard nofile 65536
* soft nproc 65536
* hard nproc 65536
EOF

# Verify limits were created
cat /etc/security/limits.d/node-app.conf

# Expected output shows the limits above
```

**What This Does:** Allows Node.js applications to handle many concurrent connections.

---

### Step 15.2: Optimize Kernel Parameters

```bash
# Add kernel optimization parameters
cat >> /etc/sysctl.conf <<EOF

# Optimization for Node.js applications
net.core.somaxconn = 65535
net.ipv4.tcp_max_syn_backlog = 8192
net.ipv4.tcp_tw_reuse = 1
net.ipv4.ip_local_port_range = 10240 65535
EOF

# Apply kernel parameters
sysctl -p

# Expected output shows the parameters being applied
```

**What This Does:** Improves network performance for high-traffic applications.

---

### Step 15.3: Disable IPv6 (If Not Used)

**Optional:** If you don't use IPv6, disabling it can simplify firewall rules.

```bash
# Disable IPv6
sysctl -w net.ipv6.conf.all.disable_ipv6=1
sysctl -w net.ipv6.conf.default.disable_ipv6=1

# Make it persistent
cat >> /etc/sysctl.conf <<EOF
net.ipv6.conf.all.disable_ipv6 = 1
net.ipv6.conf.default.disable_ipv6 = 1
EOF

# Apply changes
sysctl -p
```

---

## 16. Final Verification

### Step 16.1: Verify All Services Are Running

```bash
# Check Node.js
node --version
# Expected: v20.x.x

# Check PM2
pm2 list
# Expected: Empty list or online status

# Check MongoDB
systemctl status mongod | grep Active
# Expected: Active: active (running)

# Check Redis
systemctl status redis-server | grep Active
# Expected: Active: active (running)

# Check nginx
systemctl status nginx | grep Active
# Expected: Active: active (running)

# Check UFW
ufw status | grep Status
# Expected: Status: active

# Check Fail2Ban
systemctl status fail2ban | grep Active
# Expected: Active: active (running)
```

---

### Step 16.2: Verify Ports Are Listening

```bash
# Check listening ports
netstat -tlnp

# Expected output includes:
# Proto Local Address           Foreign Address         State       PID/Program name
# tcp        0.0.0.0:22              0.0.0.0:*               LISTEN      1234/sshd
# tcp        0.0.0.0:80              0.0.0.0:*               LISTEN      5678/nginx
# tcp        0.0.0.0:443             0.0.0.0:*               LISTEN      5678/nginx
# tcp        127.0.0.1:27017         0.0.0.0:*               LISTEN      9012/mongod
# tcp        127.0.0.1:6379          0.0.0.0:*               LISTEN      3456/redis-server
```

---

### Step 16.3: Test External Access

**From your local machine (not VPS):**

```bash
# Test HTTP (should redirect to HTTPS)
curl -I http://ementech.co.ke

# Expected output:
# HTTP/1.1 301 Moved Permanently
# Location: https://ementech.co.ke/

# Test HTTPS
curl -I https://ementech.co.ke

# Expected output:
# HTTP/2 200
# server: nginx
```

---

### Step 16.4: Check Disk Space

```bash
# Check disk usage
df -h

# Expected output (for 2 slices):
# Filesystem      Size  Used Avail Use% Mounted on
# /dev/root        48G  6.0G   40G  14% /

# Should have plenty of free space (> 30GB)
```

---

### Step 16.5: Check Memory Usage

```bash
# Check memory usage
free -h

# Expected output (for 2 slices):
#               total        used        free      shared  buff/cache   available
# Mem:           3.8Gi       1.2Gi       2.0Gi       1.0Mi       600Mi       2.4Gi

# Should have plenty of free memory (> 2GB)
```

---

## 17. Post-Setup Tasks

### Step 17.1: Save Important Information

**Create a file with all important credentials and settings:**

```bash
# Create credentials file (SECURE THIS FILE!)
nano /root/vps-credentials.txt
```

**Add this information:**

```
=== VPS CREDENTIALS ===
VPS IP: YOUR_VPS_IP
Root Password: YOUR_ROOT_PASSWORD (or SSH key location)
node-user Password: YOUR_NODE_USER_PASSWORD

=== MONGODB ===
MongoDB Version: 7.0
MongoDB Admin User: admin
MongoDB Admin Password: YOUR_MONGODB_PASSWORD
MongoDB Connection: mongodb://localhost:27017

=== REDIS ===
Redis Version: Latest
Redis Connection: redis://localhost:6379

=== SSL CERTIFICATES ===
Main Domain: ementech.co.ke
App Subdomain: app.ementech.co.ke
API Subdomain: api.ementech.co.ke
Certificate Expiry: Run 'certbot certificates' to check

=== SYSTEM ===
OS: Ubuntu 22.04 LTS
Timezone: Africa/Nairobi
SSH Port: 22 (or custom port if changed)
```

**Save and Exit:** `Ctrl+X`, `Y`, `Enter`

**Secure the file:**
```bash
chmod 600 /root/vps-credentials.txt

# IMPORTANT: Copy this file to a secure location off the VPS!
# Then delete it from VPS:
# rm /root/vps-credentials.txt
```

---

### Step 17.2: Create Reboot Script

**Optional:** Create a script to verify services after reboot.

```bash
# Create health check script
cat > /usr/local/bin/check-services.sh <<'EOF'
#!/bin/bash

echo "Checking VPS services..."

# Check MongoDB
if systemctl is-active --quiet mongod; then
    echo "✓ MongoDB is running"
else
    echo "✗ MongoDB is NOT running"
fi

# Check Redis
if systemctl is-active --quiet redis-server; then
    echo "✓ Redis is running"
else
    echo "✗ Redis is NOT running"
fi

# Check nginx
if systemctl is-active --quiet nginx; then
    echo "✓ nginx is running"
else
    echo "✗ nginx is NOT running"
fi

# Check PM2
if pm2 list | grep -q "online"; then
    echo "✓ PM2 processes are running"
else
    echo "✗ No PM2 processes running (expected before first deployment)"
fi

echo ""
echo "System uptime:"
uptime
EOF

# Make script executable
chmod +x /usr/local/bin/check-services.sh

# Test script
check-services.sh
```

---

### Step 17.3: Schedule Automatic Updates

**Optional:** Enable automatic security updates.

```bash
# Install unattended-upgrades
apt-get install -y unattended-upgrades

# Configure automatic security updates
dpkg-reconfigure -plow unattended-upgrades

# Select "Yes" when asked to automatically download and install stable updates
```

---

### Step 17.4: Reboot VPS

**Final step:** Reboot to ensure everything starts correctly.

```bash
# Reboot VPS
reboot

# Connection will be closed
```

**Wait 1-2 minutes for VPS to reboot.**

**Reconnect and verify:**
```bash
# Reconnect to VPS
ssh root@YOUR_VPS_IP

# Run health check
check-services.sh

# All services should show as running
```

---

## Troubleshooting

### Common Issues and Solutions

#### Issue: MongoDB won't start

```bash
# Check MongoDB logs
tail -n 50 /var/log/mongodb/mongod.log

# Common solution: Fix permissions
chown -R mongodb:mongodb /var/lib/mongodb
chown mongodb:mongodb /tmp/*.sock
systemctl restart mongod
```

---

#### Issue: nginx won't start

```bash
# Check nginx configuration
nginx -t

# Check error logs
tail -n 50 /var/log/nginx/error.log

# Common solution: Fix configuration syntax error
nano /etc/nginx/sites-enabled/YOUR_CONFIG_FILE
# Fix the error, then:
systemctl restart nginx
```

---

#### Issue: Can't connect via SSH

```bash
# From local machine, use verbose mode to debug
ssh -v root@YOUR_VPS_IP

# Common solutions:
# 1. Check IP address is correct
# 2. Check firewall is allowing SSH port
# 3. If you changed SSH port, use: ssh -p PORT root@YOUR_VPS_IP
# 4. If using SSH key, check key permissions: chmod 600 ~/.ssh/key_name
```

---

#### Issue: SSL certificate installation failed

```bash
# Check DNS propagation
dig ementech.co.ke +short
# Should return YOUR_VPS_IP

# If DNS hasn't propagated, wait and try again later

# Check nginx is running and port 80 is accessible
systemctl status nginx
ufw status

# Try manual certificate installation
certbot certonly --nginx -d ementech.co.ke -d www.ementech.co.ke
```

---

#### Issue: Out of memory errors

```bash
# Check memory usage
free -h

# If memory is consistently high (> 90%):
# 1. Add swap file (temporary solution)
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab

# 2. Consider upgrading VPS to more slices (permanent solution)
```

---

## Summary

**What Was Accomplished:**
- [x] System updated and secured
- [x] Node.js 20.x and PM2 installed
- [x] MongoDB 7.0 installed and configured
- [x] Redis installed and configured
- [x] nginx installed and optimized
- [x] Firewall configured (UFW)
- [x] SSL certificates installed (Let's Encrypt)
- [x] Deployment user created (node-user)
- [x] Directory structure created
- [x] Log rotation configured
- [x] System optimized for Node.js applications
- [x] All services verified running

**Next Steps:**
1. Deploy applications using deployment scripts
2. Configure nginx server blocks for each application
3. Test applications in production
4. Setup monitoring and alerts

**Estimated Time for Next Phase (Application Deployment):** 1-2 hours

---

## Document Version

**Version:** 1.0
**Last Updated:** January 18, 2026
**Maintained By:** Ementech Deployment Team

**For Questions or Issues:**
- Check `/deployment/DEPLOYMENT_TROUBLESHOOTING.md`
- Create ticket in `.agent-workspace/escalations/`

---

**Congratulations! Your VPS is now ready for application deployment!**
