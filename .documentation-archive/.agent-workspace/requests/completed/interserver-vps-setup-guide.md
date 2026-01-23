# Comprehensive Interserver VPS Setup Guide for Node.js/MERN Applications

**Last Updated:** 2026-01-18
**Target Audience:** Developers deploying Ementech website (MERN stack) on Interserver VPS
**Document Type:** Production Deployment Guide

---

## Executive Summary

Interserver VPS offers an excellent balance of affordability ($6/month per slice) and performance for hosting MERN stack applications. Each slice provides 1 CPU core, 2GB RAM, 30GB SSD storage, and 1TB bandwidth. For the Ementech website, **2 slices (2 cores, 4GB RAM, $12/month)** is the recommended starting point, with the ability to scale vertically by adding slices or horizontally through load balancing. Interserver provides built-in DDoS protection (1Tbps+), InterShield firewall with machine-learning rules, and price lock guarantees making it a solid choice for production deployments.

**Key Recommendation:** Start with 2 slices ($12/month) running Ubuntu 22.04 LTS with Node.js 20.x LTS, MongoDB (local or Atlas), Redis for caching, Nginx as reverse proxy, PM2 for process management, and Let's Encrypt SSL certificates.

---

## Table of Contents

1. [Interserver VPS Basics](#1-interserver-vps-basics)
2. [Initial Server Setup](#2-initial-server-setup)
3. [Security Configuration](#3-security-configuration)
4. [Domain & DNS Integration](#4-domain--dns-integration)
5. [Performance Optimization](#5-performance-optimization)
6. [Monitoring & Maintenance](#6-monitoring--maintenance)
7. [Backup & Recovery](#7-backup--recovery)
8. [Scaling Considerations](#8-scaling-considerations)
9. [Cost & Resource Management](#9-cost--resource-management)
10. [Common Issues & Solutions](#10-common-issues--solutions)
11. [Step-by-Step Deployment Guide](#11-step-by-step-deployment-guide)

---

## 1. Interserver VPS Basics

### 1.1 Interserver VPS Control Panel

Interserver VPS uses a **custom control panel** (not cPanel) for VPS management. Key features:

- **VPS Control Panel URL:** https://my.interserver.net/vps
- **Features:**
  - Server reboot, shutdown, start/stop
  - VNC/Console access for emergency management
  - OS reinstallation
  - Resource usage graphs (CPU, RAM, disk, network)
  - Backup management
  - Slice scaling (add/remove resources)
  - DNS management
  - IP address management

### 1.2 OS Selection and Initial Server Setup

**Recommended OS: Ubuntu 22.04 LTS (Long Term Support)**

**Why Ubuntu 22.04 LTS:**
- Supported until 2027
- Extensive community support
- Latest Node.js versions supported
- MongoDB officially supported
- Package availability (apt) excellent

**OS Selection Steps:**
1. Login to Interserver VPS control panel
2. Click "Order VPS" or manage existing VPS
3. Under "Operating System," select "Ubuntu 22.04 LTS 64-bit"
4. Choose slice quantity (start with 2 slices)
5. Complete order/reinstall

**Alternative OS Options:**
- Ubuntu 20.04 LTS (supported until 2025)
- Debian 11/12 (more minimal, excellent for production)
- CentOS 7/8 (less recommended since CentOS Stream changes)

### 1.3 Access Methods

**Primary: SSH (Secure Shell)**

```bash
# From your local machine
ssh root@your_vps_ip_address

# Example:
ssh root@123.456.789.012
```

**Initial SSH Connection:**
1. Check your email for root password
2. Login as root first time
3. Change root password immediately:
```bash
passwd
```

**Alternative Access Methods:**
- **VNC Console:** Through Interserver control panel (emergency access)
- **Serial Console:** Available in VPS control panel

### 1.4 Resource Allocation and Limits

**Interserver Slice System:**

| Slices | CPU Cores | RAM | Storage | Bandwidth | Price/Month |
|--------|-----------|-----|---------|-----------|-------------|
| 1      | 1 core    | 2GB | 30GB SSD| 1TB       | $6.00       |
| 2      | 2 cores   | 4GB | 60GB SSD| 2TB       | $12.00      |
| 3      | 3 cores   | 6GB | 90GB SSD| 3TB       | $18.00      |
| 4      | 4 cores   | 8GB | 120GB SSD| 4TB      | $24.00      |
| 8      | 8 cores   | 16GB| 240GB SSD| 8TB      | $48.00      |

**Resource Limits:**
- **CPU:** Fair sharing per core (no hard throttling)
- **RAM:** Dedicated allocation (no burst)
- **Storage:** SSD with IOPS limits (approximately 3000 IOPS)
- **Network:** 1Gbps connection port
- **Bandwidth:** 1TB per slice (overages: $1/TB)

### 1.5 Backup Options and Configurations

**Interserver Backup Solutions:**

1. **Standard KVM Backups:**
   - **Cost:** Included free with VPS
   - **Storage:** Off-site backup storage
   - **Retention:** Daily backups kept for X days
   - **Management:** Through VPS control panel
   - **Access:** Restore through control panel or support ticket

2. **Snapshot Backups (New System - MinIO):**
   - **Technology:** Migrated from Swift to MinIO object storage
   - **Cost:** Additional fee
   - **Use Case:** Point-in-time snapshots before major changes
   - **Creation:** Manual through control panel or API

3. **R1Soft Backups (Premium):**
   - **Cost:** Additional monthly fee
   - **Features:** Continuous data protection
   - **Retention:** Configurable retention policies
   - **Restoration:** File-level or full server restores

**Backup Configuration Tips:**
- Schedule automated daily backups during low-traffic hours
- Keep off-site backups of critical data
- Test restoration process monthly
- Backup database separately (mongodump)

---

## 2. Initial Server Setup

### 2.1 System Update and Initial Configuration

**Step 1: Update System Packages**

```bash
# Update package list
apt update

# Upgrade installed packages
apt upgrade -y

# Install essential tools
apt install -y curl wget git vim htop net-tools software-properties-common apt-transport-https ca-certificates gnupg lsb-release
```

**Step 2: Set Timezone**

```bash
# Set timezone to your local time
timedatectl set-timezone Africa/Nairobi

# Or list available timezones
timedatectl list-timezones
```

**Step 3: Configure Hostname**

```bash
# Set hostname
hostnamectl set-hostname ementech-vps

# Edit hosts file
vim /etc/hosts
# Add: 123.456.789.012 ementech-vps ementech.co.ke
```

**Step 4: Create Swap File (Critical for 2-4GB RAM servers)**

```bash
# Check if swap exists
free -h

# Create 2GB swap file
fallocate -l 2G /swapfile

# Secure swap file
chmod 600 /swapfile

# Mark as swap space
mkswap /swapfile

# Enable swap
swapon /swapfile

# Make swap permanent
echo '/swapfile none swap sw 0 0' | tee -a /etc/fstab

# Verify swap is active
free -h
```

### 2.2 Installing Node.js

**Recommended: Node.js 20.x LTS (Latest LTS)**

**Method 1: Using NodeSource Repository (Recommended)**

```bash
# Add NodeSource repository for Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -

# Install Node.js and npm
apt install -y nodejs

# Verify installation
node -v  # Should show v20.x.x
npm -v
```

**Method 2: Using NVM (For Development Environments)**

```bash
# Install NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Load NVM
source ~/.bashrc

# Install Node.js 20 LTS
nvm install --lts

# Set default version
nvm use lts/*
nvm alias default lts/*

# Verify
node -v
```

**Method 3: Binary Installation (Interserver Method)**

```bash
# Download Node.js binary
cd /usr/local/src
wget https://nodejs.org/dist/v20.11.0/node-v20.11.0-linux-x64.tar.xz

# Extract
tar -xvf node-v20.11.0-linux-x64.tar.xz

# Install
mv node-v20.11.0-linux-x64 /opt/nodejs

# Create symlinks
ln -sf /opt/nodejs/bin/node /usr/bin/node
ln -sf /opt/nodejs/bin/npm /usr/bin/npm

# Verify
node -v
npm -v
```

**Global Packages:**

```bash
# Install PM2 globally
npm install -g pm2

# Install useful development tools
npm install -g nodemon
```

### 2.3 MongoDB Installation

**Option 1: MongoDB Atlas (Cloud-Hosted - Recommended)**

**Advantages:**
- No local database management overhead
- Automated backups
- Global distribution
- Free tier available (512MB)

**Setup:**
1. Sign up at https://www.mongodb.com/cloud/atlas
2. Create free cluster
3. Configure whitelist (your VPS IP address)
4. Create database user
5. Get connection string
6. Update application .env with MongoDB Atlas connection string

**Option 2: Local MongoDB Installation**

```bash
# Import MongoDB public key
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | apt-key add -

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Update package list
apt update

# Install MongoDB
apt install -y mongodb-org

# Start MongoDB service
systemctl start mongod
systemctl enable mongod

# Verify installation
mongod --version
systemctl status mongod
```

**MongoDB Security:**

```bash
# Enable authentication
vim /etc/mongod.conf

# Add/modify:
security:
  authorization: enabled

# Restart MongoDB
systemctl restart mongod

# Create admin user
mongosh
use admin
db.createUser({
  user: "admin",
  pwd: "strong_password_here",
  roles: [ { role: "userAdminAnyDatabase", db: "admin" } ]
})

# Create application database user
use ementech
db.createUser({
  user: "ementech_user",
  pwd: "another_strong_password",
  roles: [ { role: "readWrite", db: "ementech" } ]
})
```

### 2.4 Redis Installation (For Caching/Sessions)

```bash
# Add Redis repository
add-apt-repository ppa:redislabs/redis -y

# Update package list
apt update

# Install Redis
apt install -y redis-server

# Configure Redis
vim /etc/redis/redis.conf

# Key configurations:
# bind 127.0.0.1 ::1  # Listen only on localhost
# requirepass your_redis_password  # Set password
# maxmemory 256mb  # Limit memory usage
# maxmemory-policy allkeys-lru  # Eviction policy

# Restart Redis
systemctl restart redis-server
systemctl enable redis-server

# Test Redis
redis-cli
AUTH your_redis_password
PING  # Should return PONG
```

### 2.5 Nginx Installation and Configuration

**Installation:**

```bash
# Install Nginx
apt install -y nginx

# Start and enable Nginx
systemctl start nginx
systemctl enable nginx

# Check status
systemctl status nginx

# Test (access http://your_vps_ip)
```

**Basic Configuration for Node.js App:**

```bash
# Create site configuration
vim /etc/nginx/sites-available/ementech

# Add configuration:
server {
    listen 80;
    server_name ementech.co.ke www.ementech.co.ke;

    location / {
        proxy_pass http://localhost:3000;  # Your Node.js app port
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static files caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# Enable site
ln -s /etc/nginx/sites-available/ementech /etc/nginx/sites-enabled/

# Remove default site
rm /etc/nginx/sites-enabled/default

# Test configuration
nginx -t

# Reload Nginx
systemctl reload nginx
```

### 2.6 PM2 Installation and Configuration

```bash
# Install PM2 globally
npm install -g pm2

# Create PM2 ecosystem file
pm2 init

# Edit ecosystem.config.js
vim ecosystem.config.js

# Configure:
module.exports = {
  apps: [{
    name: 'ementech-api',
    script: './server/index.js',  # Adjust to your entry point
    instances: 2,  # Use 2 instances for 2 CPU cores
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '1G'
  }]
};

# Start application in development
pm2 start ecosystem.config.js --env development

# Start application in production
pm2 start ecosystem.config.js --env production

# Save PM2 process list
pm2 save

# Setup PM2 startup script
pm2 startup
# Run the command output by pm2 startup

# Common PM2 commands
pm2 list           # List all processes
pm2 logs           # View logs
pm2 monit          # Monitor resources
pm2 restart all    # Restart all apps
pm2 reload all     # Zero-downtime reload
pm2 stop all       # Stop all apps
pm2 delete all     # Remove all apps
```

---

## 3. Security Configuration

### 3.1 Firewall Setup (UFW - Uncomplicated Firewall)

**Enable and Configure UFW:**

```bash
# Install UFW
apt install -y ufw

# Default policies
ufw default deny incoming
ufw default allow outgoing

# Allow SSH (CRITICAL - Do this first!)
ufw allow ssh
# Or specify custom SSH port:
# ufw allow 2222/tcp

# Allow HTTP and HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Allow Node.js app port (if accessed directly)
# ufw allow 3000/tcp

# Allow Redis (if accessing remotely, not recommended)
# ufw allow 6379/tcp

# Allow MongoDB (if accessing remotely, not recommended)
# ufw allow 27017/tcp

# Enable firewall
ufw enable

# Check status
ufw status verbose

# View numbered rules
ufw status numbered
```

**Delete Rules:**

```bash
# Delete by number
ufw status numbered
ufw delete [number]
```

### 3.2 SSH Hardening

**Edit SSH Configuration:**

```bash
# Backup original config
cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup

# Edit SSH config
vim /etc/ssh/sshd_config

# Key changes:
# Port 2222  # Change from default 22
# PermitRootLogin no  # Disable root login
# PasswordAuthentication no  # Disable password auth (use SSH keys only)
# PubkeyAuthentication yes
# Protocol 2
# X11Forwarding no
# MaxAuthTries 3
# ClientAliveInterval 300
# ClientAliveCountMax 2
# AllowUsers [your_username]
```

**Create Non-Root User:**

```bash
# Create new user
adduser ementech

# Add to sudo group
usermod -aG sudo ementech

# Switch to new user
su - ementech

# Setup SSH keys for new user
mkdir -p ~/.ssh
chmod 700 ~/.ssh
vim ~/.ssh/authorized_keys
# Paste your public SSH key
chmod 600 ~/.ssh/authorized_keys

# Exit back to root
exit

# Restart SSH service
systemctl restart sshd

# TEST: Open new SSH session before closing current one!
ssh ementech@your_vps_ip -p 2222
```

### 3.3 Fail2Ban Setup

**Installation:**

```bash
# Install Fail2Ban
apt install -y fail2ban

# Create local configuration
cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local

# Edit configuration
vim /etc/fail2ban/jail.local

# Key settings:
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5
destemail = admin@ementech.co.ke
sender = fail2ban@ementech.co.ke
action = %(action_mwl)s

[sshd]
enabled = true
port = ssh,2222
logpath = /var/log/auth.log
maxretry = 3

[nginx-http-auth]
enabled = true

[nginx-noscript]
enabled = true

[nginx-badbots]
enabled = true

[nginx-noproxy]
enabled = true
```

**Start Fail2Ban:**

```bash
# Start service
systemctl start fail2ban
systemctl enable fail2ban

# Check status
fail2ban-client status

# Check specific jail status
fail2ban-client status sshd

# Unban IP if needed
fail2ban-client set sshd unbanip 123.456.789.012
```

### 3.4 DDoS Protection

**Interserver Built-in Protection:**
- **1Tbps+ DDoS protection** included free
- **InterShield firewall** with machine-learning rules
- Automatically filters malicious traffic

**Nginx Rate Limiting (Additional Layer):**

```bash
# Edit nginx config
vim /etc/nginx/nginx.conf

# Add in http block:
http {
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=general_limit:10m rate=30r/s;

    # Connection limiting
    limit_conn_zone $binary_remote_addr zone=conn_limit:10m;

    # ...
}

# In site config:
server {
    # Apply rate limiting to API
    location /api/ {
        limit_req zone=api_limit burst=20 nodelay;
        limit_conn conn_limit 10;
        proxy_pass http://localhost:3000;
    }

    # General rate limiting
    location / {
        limit_req zone=general_limit burst=50 nodelay;
        limit_conn conn_limit 20;
        proxy_pass http://localhost:3000;
    }
}

# Reload Nginx
systemctl reload nginx
```

### 3.5 Security Best Practices

**System Hardening:**

```bash
# Disable unused services
systemctl disable postfix  # If not using email

# Install security updates automatically
apt install -y unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades

# Configure automatic updates
vim /etc/apt/apt.conf.d/50unattended-upgrades

# Key settings:
Unattended-Upgrade::Automatic-Reboot "false";
Unattended-Upgrade::Remove-Unused-Kernel-Packages "true";
Unattended-Upgrade::Remove-Unused-Dependencies "true";
Unattended-Upgrade::Automatic-Reboot-Time "02:00";
```

**File Permissions:**

```bash
# Set proper ownership
chown -R ementech:ementech /var/www/ementech

# Restrict sensitive files
chmod 600 .env
chmod 700 ~/.ssh

# Prevent directory listing
# In Nginx config:
location / {
    autoindex off;
}
```

**Environment Variables Security:**

```bash
# Use .env files (never commit to git)
# In production:
vim /var/www/ementech/.env

MONGODB_URI=mongodb://localhost:27017/ementech
REDIS_URL=redis://127.0.0.1:6379
JWT_SECRET=your_super_secret_jwt_key_here
SESSION_SECRET=another_secret_key_here
NODE_ENV=production

# Secure .env file
chmod 600 /var/www/ementech/.env
chown ementech:ementech /var/www/ementech/.env
```

---

## 4. Domain & DNS Integration

### 4.1 Pointing Domain to Interserver VPS

**Step 1: Find Interserver Nameservers**

Option A: **Use Interserver's Nameservers**
- ns1.interserver.net
- ns2.interserver.net

Option B: **Use Custom Nameservers (Advanced)**
- Set up your own nameservers on VPS (ns1.ementech.co.ke, ns2.ementech.co.ke)

**Step 2: Update Nameservers at Domain Registrar**

1. Login to your domain registrar (where you bought ementech.co.ke)
2. Find DNS/Nameserver settings
3. Replace existing nameservers with Interserver's:
   - ns1.interserver.net
   - ns2.interserver.net
4. Save changes

**Step 3: Wait for DNS Propagation**
- Typically 2-48 hours worldwide
- Check propagation: https://dnschecker.org/

### 4.2 DNS Management Through Interserver Control Panel

**Option 1: Use Interserver DNS (Recommended)**

1. Login to Interserver control panel
2. Navigate to "DNS" section
3. Add domain: ementech.co.ke
4. Add DNS records:

```
Type: A
Name: @
Value: your_vps_ip_address
TTL: 14400

Type: A
Name: www
Value: your_vps_ip_address
TTL: 14400

Type: CNAME
Name: api
Value: ementech.co.ke
TTL: 14400
```

**Option 2: Use Cloudflare (Free DNS + CDN + Security)**

1. Sign up at Cloudflare.com
2. Add your domain
3. Point nameservers to Cloudflare
4. Add DNS records pointing to VPS IP
5. Enable "Proxy" (orange cloud) for CDN + DDoS protection
6. Configure page rules, caching, security settings

### 4.3 SSL/TLS Certificate Installation (Let's Encrypt)

**Install Certbot:**

```bash
# Install Certbot and Nginx plugin
apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate
certbot --nginx -d ementech.co.ke -d www.ementech.co.ke

# Follow prompts:
# - Enter email address
# - Agree to Terms of Service
# - Choose whether to redirect HTTP to HTTPS (recommended: option 2)
```

**Auto-Renewal:**

```bash
# Test auto-renewal
certbot renew --dry-run

# Check renewal timer
systemctl list-timers | grep certbot

# Renewal is configured automatically in:
# /etc/cron.d/certbot
# /etc/systemd/system/timers.target.wants/certbot.timer
```

**Manual Nginx SSL Configuration (if needed):**

```bash
# Edit site configuration
vim /etc/nginx/sites-available/ementech

server {
    listen 80;
    server_name ementech.co.ke www.ementech.co.ke;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ementech.co.ke www.ementech.co.ke;

    ssl_certificate /etc/letsencrypt/live/ementech.co.ke/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ementech.co.ke/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    location / {
        proxy_pass http://localhost:3000;
        # ... rest of proxy configuration
    }
}

# Test and reload
nginx -t
systemctl reload nginx
```

---

## 5. Performance Optimization

### 5.1 Server Resource Optimization

**Kernel Parameter Tuning:**

```bash
# Edit sysctl configuration
vim /etc/sysctl.conf

# Add optimizations:
# Network performance
net.core.rmem_max = 16777216
net.core.wmem_max = 16777216
net.ipv4.tcp_rmem = 4096 87380 16777216
net.ipv4.tcp_wmem = 4096 65536 16777216
net.ipv4.tcp_window_scaling = 1
net.ipv4.tcp_fin_timeout = 30
net.ipv4.tcp_keepalive_time = 120
net.ipv4.tcp_max_syn_backlog = 4096

# File descriptors
fs.file-max = 65535

# Apply changes
sysctl -p
```

**Increase File Limits:**

```bash
# Edit limits configuration
vim /etc/security/limits.conf

# Add:
* soft nofile 65535
* hard nofile 65535
* soft nproc 65535
* hard nproc 65535

# Edit systemd configuration
vim /etc/systemd/system.conf

# Uncomment and modify:
DefaultLimitNOFILE=65535
DefaultLimitNPROC=65535

# Reload systemd
systemctl daemon-reexec
```

### 5.2 Memory Management for Node.js

**PM2 Memory Configuration:**

```javascript
// In ecosystem.config.js
module.exports = {
  apps: [{
    name: 'ementech-api',
    script: './server/index.js',
    max_memory_restart: '1G',  // Restart if using >1GB
    node_args: '--max-old-space-size=1024',  // V8 heap size
  }]
};
```

**MongoDB Memory Management:**

```bash
# Edit MongoDB config
vim /etc/mongod.conf

# Add (use 50% of available RAM):
storage:
  wiredTiger:
    engineConfig:
      cacheSizeGB: 2  # For 4GB server

# Restart MongoDB
systemctl restart mongod
```

### 5.3 Swap File Configuration

**Optimize Swap Usage (Swappiness):**

```bash
# Check current swappiness (default is 60)
cat /proc/sys/vm/swappiness

# Set swappiness to 10 (use swap only when necessary)
sysctl vm.swappiness=10

# Make permanent
vim /etc/sysctl.conf
# Add: vm.swappiness=10

# Verify
sysctl -p
```

**Swap File Already Created:** 2GB swap file created in section 2.1

### 5.4 CPU Optimization

**PM2 Cluster Mode:**

```javascript
// In ecosystem.config.js
module.exports = {
  apps: [{
    name: 'ementech-api',
    script: './server/index.js',
    instances: 2,  // Match number of CPU cores
    exec_mode: 'cluster',
  }]
};
```

**CPU Pinning (Advanced):**

```bash
# Install taskset
apt install -y util-linux

# Pin PM2 processes to specific CPUs
taskset -c 0,1 pm2 start ecosystem.config.js
```

### 5.5 Disk I/O Optimization

**SSD Optimization:**

```bash
# Check disk I/O scheduler
cat /sys/block/sda/queue/scheduler

# Set to noop or deadline for SSD
echo noop > /sys/block/sda/queue/scheduler
# Or
echo deadline > /sys/block/sda/queue/scheduler

# Make permanent by adding to /etc/rc.local
```

**MongoDB I/O:**

```bash
# Ensure MongoDB journal is on SSD
vim /etc/mongod.conf

storage:
  journal:
    enabled: true
  dbPath: /var/lib/mongodb
```

### 5.6 Nginx Optimization

**Nginx Performance Tuning:**

```bash
# Edit nginx main config
vim /etc/nginx/nginx.conf

user www-data;
worker_processes auto;  # Match CPU cores
worker_rlimit_nofile 65535;

events {
    worker_connections 4096;
    use epoll;
    multi_accept on;
}

http {
    # Basic optimizations
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 20M;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/rss+xml font/truetype font/opentype application/vnd.ms-fontobject image/svg+xml;

    # Caching
    proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=ementech_cache:10m max_size=1g inactive=60m use_temp_path=off;

    # ...
}
```

**Create cache directory:**

```bash
mkdir -p /var/cache/nginx
chown -R www-data:www-data /var/cache/nginx
```

---

## 6. Monitoring & Maintenance

### 6.1 Interserver Monitoring Tools

**Built-in Monitoring:**
- **VPS Control Panel:** Real-time graphs for CPU, RAM, disk, network
- **Email Alerts:** Configurable thresholds for resource usage
- **Bandwidth Monitoring:** Track transfer usage

### 6.2 System Monitoring Tools

**Install Monitoring Tools:**

```bash
# Install htop (interactive process viewer)
apt install -y htop

# Install atop (advanced monitoring)
apt install -y atop
systemctl enable atop
systemctl start atop

# Install glances (web-based monitoring)
apt install -y glances

# Install sysstat (performance monitoring tools)
apt install -y sysstat
systemctl enable sysstat
systemctl start sysstat

# Install netdata (comprehensive monitoring)
bash <(curl -Ss https://my-netdata.io/kickstart.sh)
# Access at: http://your_vps_ip:19999
```

**Manual Monitoring Commands:**

```bash
# CPU usage
top
htop
grep 'cpu ' /proc/stat

# Memory usage
free -h
cat /proc/meminfo

# Disk usage
df -h
du -sh /var/log/*
du -sh /var/www/*

# Network monitoring
nethogs
iftop
ip -s link

# Process monitoring
ps aux
pstree
```

### 6.3 Log File Locations and Management

**Important Log Files:**

```
/var/log/auth.log           # SSH and authentication
/var/log/syslog            # System logs
/var/log/nginx/            # Nginx logs
  - access.log
  - error.log
/var/log/mongodb/          # MongoDB logs
  - mongod.log
/var/log/redis/            # Redis logs
/var/log/pm2/              # PM2 logs (configured in ecosystem.config.js)
/home/ementech/.pm2/logs/  # PM2 process logs
```

**Log Rotation Configuration:**

```bash
# Edit logrotate configuration
vim /etc/logrotate.conf

# Add custom application logs
vim /etc/logrotate.d/ementech

/var/www/ementech/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 ementech ementech
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}

# Test log rotation
logrotate -d /etc/logrotate.conf
```

**Viewing Logs:**

```bash
# View PM2 logs
pm2 logs

# View Nginx access logs
tail -f /var/log/nginx/access.log

# View system logs
journalctl -f

# View authentication logs
tail -f /var/log/auth.log

# Search logs
grep "error" /var/log/nginx/error.log
grep "Failed" /var/log/auth.log
```

### 6.4 Resource Usage Monitoring

**Set Up Automated Monitoring with PM2:**

```bash
# Install PM2 monitoring
pm2 install pm2-logrotate

# Configure log rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
```

**Keymetrics Monitoring (Optional):**

```bash
# Link to Keymetrics monitoring service
pm2 link <public_key> <secret_key>

# Or sign up at https://app.keymetrics.io/
```

### 6.5 Email Alerts and Notifications

**Configure Email Alerts:**

```bash
# Install mailutils
apt install -y mailutils

# Test email
echo "Test email from VPS" | mail -s "VPS Test" admin@ementech.co.ke

# Setup cron job for resource alerts
crontab -e

# Add alert script:
*/5 * * * * /home/ementech/scripts/check-resources.sh
```

**Resource Alert Script:**

```bash
# Create script directory
mkdir -p /home/ementech/scripts

# Create alert script
vim /home/ementech/scripts/check-resources.sh

#!/bin/bash
CPU=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
MEM=$(free | grep Mem | awk '{print ($3/$2) * 100.0}')
DISK=$(df -h / | awk 'NR==2 {print $5}' | cut -d'%' -f1)

if (( $(echo "$CPU > 80" | bc -l) )); then
    echo "CPU usage is ${CPU}%" | mail -s "ALERT: High CPU Usage" admin@ementech.co.ke
fi

if (( $(echo "$MEM > 80" | bc -l) )); then
    echo "Memory usage is ${MEM}%" | mail -s "ALERT: High Memory Usage" admin@ementech.co.ke
fi

if [ $DISK -gt 80 ]; then
    echo "Disk usage is ${DISK}%" | mail -s "ALERT: High Disk Usage" admin@ementech.co.ke
fi

# Make executable
chmod +x /home/ementech/scripts/check-resources.sh
```

---

## 7. Backup & Recovery

### 7.1 Interserver Backup Solutions

**Standard KVM Backups:**

1. Login to Interserver VPS control panel
2. Navigate to "Backups" section
3. Schedule automated backups
4. Set backup frequency (daily recommended)
5. Choose retention period

**Manual Backup Creation:**

```bash
# Create backup before major changes
# Through control panel: VPS → Backups → Create Backup
```

### 7.2 Application Backup Strategy

**Database Backup Automation:**

```bash
# Create backup script
vim /home/ementech/scripts/backup-mongodb.sh

#!/bin/bash
BACKUP_DIR="/home/ementech/backups/mongodb"
DATE=$(date +%Y%m%d_%H%M%S)
MONGO_DB="ementech"
MONGO_USER="ementech_user"
MONGO_PASS="your_password"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup MongoDB
mongodump --db $MONGO_DB --username $MONGO_USER --password $MONGO_PASS --out $BACKUP_DIR/backup_$DATE

# Compress backup
tar -czf $BACKUP_DIR/backup_$DATE.tar.gz $BACKUP_DIR/backup_$DATE
rm -rf $BACKUP_DIR/backup_$DATE

# Delete backups older than 7 days
find $BACKUP_DIR -name "backup_*.tar.gz" -mtime +7 -delete

echo "MongoDB backup completed: backup_$DATE.tar.gz"

# Make executable
chmod +x /home/ementech/scripts/backup-mongodb.sh
```

**Add to Cron:**

```bash
# Edit crontab
crontab -e

# Add daily MongoDB backup at 2 AM
0 2 * * * /home/ementech/scripts/backup-mongodb.sh >> /home/ementech/logs/backup.log 2>&1
```

**Application Files Backup:**

```bash
# Create backup script
vim /home/ementech/scripts/backup-app.sh

#!/bin/bash
BACKUP_DIR="/home/ementech/backups/app"
SOURCE_DIR="/var/www/ementech"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup application files
tar -czf $BACKUP_DIR/app_backup_$DATE.tar.gz $SOURCE_DIR

# Delete backups older than 7 days
find $BACKUP_DIR -name "app_backup_*.tar.gz" -mtime +7 -delete

echo "Application backup completed: app_backup_$DATE.tar.gz"

# Make executable
chmod +x /home/ementech/scripts/backup-app.sh
```

**Off-site Backup (to Cloud Storage):**

```bash
# Install rclone for cloud storage backup
curl https://rclone.org/install.sh | bash

# Configure rclone
rclone config

# Create backup script
vim /home/ementech/scripts/backup-offsite.sh

#!/bin/bash
BACKUP_DIR="/home/ementech/backups"
DATE=$(date +%Y%m%d)

# Backup MongoDB
/home/ementech/scripts/backup-mongodb.sh

# Backup application
/home/ementech/scripts/backup-app.sh

# Upload to cloud storage (Google Drive, S3, etc.)
rclone sync $BACKUP_DIR remote:ementech-backups/$DATE --progress

# Make executable
chmod +x /home/ementech/scripts/backup-offsite.sh
```

### 7.3 Disaster Recovery Procedures

**Server Restoration from Interserver Backup:**

1. Login to Interserver VPS control panel
2. Navigate to "Backups"
3. Select backup date
4. Click "Restore"
5. Confirm restoration
6. Wait for restoration to complete
7. Verify services are running

**Manual Application Restoration:**

```bash
# Restore application files
cd /var/www/
tar -xzf /home/ementech/backups/app/app_backup_YYYYMMDD_HHMMSS.tar.gz

# Restore MongoDB
mongorestore --db ementech /home/ementech/backups/mongodb/backup_YYYYMMDD_HHMMSS/ementech/

# Restart services
pm2 restart all
systemctl restart nginx
systemctl restart redis-server
```

**Emergency Recovery Checklist:**

1. [ ] Assess damage and identify root cause
2. [ ] Restore from latest clean backup
3. [ ] Update application dependencies (npm install)
4. [ ] Restore environment variables (.env)
5. [ ] Restart services (PM2, Nginx, MongoDB, Redis)
6. [ ] Verify DNS pointing correctly
7. [ ] Check SSL certificates are valid
8. [ ] Test application functionality
9. [ ] Monitor logs for errors
10. [ ] Document incident and prevention measures

---

## 8. Scaling Considerations

### 8.1 When to Upgrade VPS Resources

**Indicators You Need More Resources:**

- **CPU:** Consistently >80% usage during normal traffic
- **Memory:** Swap usage increasing, OOM errors in logs
- **Disk:** <20% free space remaining
- **Response Time:** Application consistently slow (>2s response)
- **Database:** MongoDB queries slow due to memory constraints

**Monitoring Commands:**

```bash
# Check CPU
top -bn1 | grep "Cpu(s)"

# Check memory
free -h

# Check disk
df -h

# Check load average
uptime

# Monitor over time
htop
```

### 8.2 Vertical Scaling (Adding Slices)

**How to Scale on Interserver:**

1. Login to Interserver VPS control panel
2. Navigate to your VPS
3. Click "Add Slice"
4. Confirm upgrade
5. Resources added instantly (no downtime)

**Cost vs. Resources:**

| Slices | CPU | RAM | Price | Applications |
|--------|-----|-----|-------|--------------|
| 1      | 1   | 2GB | $6/mo | Dev/testing only |
| 2      | 2   | 4GB | $12/mo | Small production |
| 3      | 3   | 6GB | $18/mo | Medium production |
| 4      | 4   | 8GB | $24/mo | Growing application |
| 8      | 8   | 16GB| $48/mo | High-traffic app |

**Post-Scaling Configuration:**

```bash
# After adding slices, update PM2 cluster mode
vim /var/www/ementech/ecosystem.config.js

# Update instances to match new CPU cores
instances: 4  # For 4 slices

# Reload PM2
pm2 reload ecosystem.config.js --env production
```

### 8.3 Horizontal Scaling Options

**Option 1: Load Balancer + Multiple VPS**

```
                    Load Balancer
                          |
          +---------------+---------------+
          |                               |
     VPS Instance 1                  VPS Instance 2
  (2 slices, $12/mo)              (2 slices, $12/mo)
          |                               |
       MongoDB (Shared/Atlas)
```

**Nginx Load Balancer Configuration:**

```bash
# Create load balancer config
vim /etc/nginx/conf.d/load-balancer.conf

upstream ementech_backend {
    least_conn;
    server vps1_ip_address:3000;
    server vps2_ip_address:3000;
}

server {
    listen 80;
    server_name ementech.co.ke www.ementech.co.ke;

    location / {
        proxy_pass http://ementech_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

**Option 2: Microservices Architecture**

- Separate API server VPS
- Separate frontend hosting (Netlify, Vercel, Cloudflare Pages)
- Shared MongoDB Atlas cluster

### 8.4 Database Scaling

**MongoDB Atlas Scaling:**
1. Start with free tier (M0 - 512MB)
2. Upgrade to M2/M5 when needed
3. Scale to M10+ (dedicated cluster) for production

**Local MongoDB Scaling:**
- Add more RAM (MongoDB benefits from memory)
- Enable sharding for large datasets
- Implement read replicas

---

## 9. Cost & Resource Management

### 9.1 Interserver Pricing Tiers (2025)

**Slice Pricing:**
- **Linux VPS:** $6.00 per slice/month
- **Windows VPS:** $10.00 per slice/month
- **Price Lock:** Guaranteed - no renewal price increases

**Recommended Configurations:**

| Use Case | Slices | Monthly Cost | Annual Cost |
|----------|--------|--------------|-------------|
| Development | 1 | $6.00 | $72.00 |
| Small Production | 2 | $12.00 | $144.00 |
| Medium Production | 3 | $18.00 | $216.00 |
| Growing App | 4 | $24.00 | $288.00 |
| High Traffic | 8 | $48.00 | $576.00 |

### 9.2 Resource Requirements for MERN Stack

**Minimum Requirements:**
- **RAM:** 2GB (bare minimum)
- **CPU:** 1 core (slow performance)
- **Storage:** 20GB
- **Cost:** $6/month (1 slice)

**Recommended for Production:**
- **RAM:** 4GB
- **CPU:** 2 cores
- **Storage:** 60GB
- **Cost:** $12/month (2 slices)

**Optimal for Growing Applications:**
- **RAM:** 6-8GB
- **CPU:** 3-4 cores
- **Storage:** 90-120GB
- **Cost:** $18-24/month (3-4 slices)

**Resource Breakdown by Component:**

| Component | RAM Usage | CPU Usage | Disk Usage |
|-----------|-----------|-----------|------------|
| Ubuntu OS | 500MB | Low | 5GB |
| Node.js API | 500MB-1GB | Medium | 2GB |
| MongoDB | 1-2GB | Low-Medium | 5GB+ |
| Redis | 100MB | Low | 1GB |
| Nginx | 50MB | Low | 100MB |
| PM2 | 50MB | Low | Negligible |
| Logs | Variable | N/A | 1-5GB |
| **Total** | **2.5-4GB** | **Medium** | **15-20GB** |

### 9.3 Optimizing Costs

**Cost Optimization Strategies:**

1. **Use MongoDB Atlas Free Tier**
   - Saves 1-2GB RAM
   - Saves $6/month (1 slice)
   - Better performance and backups

2. **Enable Compression**
   - Nginx gzip compression
   - Reduce bandwidth usage

3. **CDN for Static Assets**
   - Use Cloudflare (free)
   - Reduce bandwidth costs
   - Improve performance

4. **Optimize Images**
   - Use WebP format
   - Lazy loading
   - Responsive images

5. **Database Optimization**
   - Create indexes
   - Optimize queries
   - Reduce memory usage

6. **Log Rotation**
   - Prevent disk space issues
   - Reduce I/O overhead

7. **Caching Strategy**
   - Redis for session storage
   - Nginx caching for static files
   - Reduce database queries

**Estimated Monthly Cost Breakdown:**

| Service | Provider | Cost |
|---------|----------|------|
| VPS (2 slices) | Interserver | $12.00 |
| Domain | Registrar | $10-15/year (~$1/mo) |
| MongoDB Atlas | Free/Pro Tier | $0-57 |
| SSL Certificate | Let's Encrypt | FREE |
| CDN | Cloudflare | FREE |
| Monitoring | Netdata/PM2 | FREE |
| **Total (Minimum)** | | **~$13/month** |
| **Total (with Atlas M10)** | | **~$70/month** |

### 9.4 Bandwidth Considerations

**Interserver Bandwidth:**
- **Included:** 1TB per slice
- **Overage:** $1 per TB
- **Measurement:** Both incoming and outgoing

**Bandwidth Optimization:**

```bash
# Enable Nginx compression
vim /etc/nginx/nginx.conf

gzip on;
gzip_vary on;
gzip_proxied any;
gzip_comp_level 6;
gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss;

# Cache static files
location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# Enable browser caching
location / {
    proxy_pass http://localhost:3000;
    proxy_cache ementech_cache;
    proxy_cache_valid 200 60m;
    proxy_cache_bypass $http_upgrade;
}
```

**Estimated Bandwidth Usage:**

| Traffic | Pages/Day | Avg Page Size | Monthly Bandwidth |
|---------|-----------|---------------|-------------------|
| Low | 1,000 | 2MB | 60GB |
| Medium | 10,000 | 2MB | 600GB |
| High | 50,000 | 2MB | 3TB |
| Very High | 100,000 | 2MB | 6TB |

**With CDN and Compression:**
- Reduce bandwidth by 60-80%
- 50,000 pages/day → ~600GB-1TB

---

## 10. Common Issues & Solutions

### 10.1 Known Interserver Limitations

**Issue 1: Uptime Concerns**
- **Problem:** Some users report occasional uptime issues
- **Solution:**
  - Use MongoDB Atlas with automatic failover
  - Implement application-level error handling
  - Set up monitoring and alerting

**Issue 2: Slow Support Response**
- **Problem:** Support can be slow to respond
- **Solution:**
  - Document everything yourself
  - Have backup plans
  - Use community resources
  - Consider managed support for 4+ slices

**Issue 3: Resource Contention**
- **Problem:** Noisy neighbors on shared VPS
- **Solution:**
  - Upgrade to dedicated VPS slices
  - Monitor resource usage closely
  - Implement caching to reduce load

### 10.2 Troubleshooting Common Problems

**Problem: Node.js Application Won't Start**

```bash
# Check if running
pm2 list

# Check logs
pm2 logs

# Check if port is in use
netstat -tulpn | grep :3000

# Restart application
pm2 restart all

# Check Node.js version
node -v

# Check application dependencies
cd /var/www/ementech
npm install
```

**Problem: Database Connection Failed**

```bash
# Check if MongoDB is running
systemctl status mongod

# Check MongoDB logs
tail -f /var/log/mongodb/mongod.log

# Test connection
mongosh mongodb://localhost:27017/ementech

# Check authentication
vim /var/www/ementech/.env

# Restart MongoDB
systemctl restart mongod
```

**Problem: Nginx 502 Bad Gateway**

```bash
# Check if Node.js app is running
pm2 list

# Check Nginx error logs
tail -f /var/log/nginx/error.log

# Verify Nginx configuration
nginx -t

# Check if port is correct
netstat -tulpn | grep :3000

# Restart Nginx
systemctl restart nginx
```

**Problem: Out of Memory (OOM) Errors**

```bash
# Check memory usage
free -h

# Check swap usage
swapon --show

# Increase swap (if needed)
fallocate -l 4G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile

# Restart PM2 with memory limits
pm2 delete all
pm2 start ecosystem.config.js --env production

# Reduce PM2 memory limit in ecosystem.config.js
max_memory_restart: '512M'
```

**Problem: SSL Certificate Errors**

```bash
# Check certificate expiration
certbot certificates

# Renew manually
certbot renew

# Check Nginx SSL configuration
nginx -t

# Reload Nginx
systemctl reload nginx

# Force renew
certbot renew --force-renewal
```

**Problem: High CPU Usage**

```bash
# Identify process using CPU
top -bn1 | head -20

# Check PM2 processes
pm2 monit

# Check number of instances
pm2 list

# Reduce instances if needed
vim ecosystem.config.js
instances: 1  # Reduce from 2

pm2 reload ecosystem.config.js
```

**Problem: Disk Space Full**

```bash
# Check disk usage
df -h

# Find large files
du -sh /var/log/*
du -sh /home/ementech/*

# Clean old logs
journalctl --vacuum-time=7d

# Clean PM2 logs
pm2 flush

# Clean package cache
npm cache clean --force

# Find and remove large log files
find /var/log -type f -size +100M
```

### 10.3 Support Options and Response Times

**Interserver Support:**

1. **Ticket System:**
   - Available 24/7
   - Response time: 1-6 hours (varies)
   - Best for: Complex technical issues

2. **Live Chat:**
   - Available on website
   - Response time: Immediate to 30 minutes
   - Best for: Quick questions

3. **Phone Support:**
   - Available during business hours
   - Best for: Urgent issues

4. **Knowledge Base:**
   - https://www.interserver.net/tips/
   - Comprehensive tutorials
   - Updated regularly

5. **Community Forums:**
   - Community support
   - Good for common issues

**When to Escalate:**
- VPS down for >1 hour
- Data loss
- Security breach
- Network connectivity issues
- Hardware failures

### 10.4 Community Resources

**Interserver Resources:**
- **Knowledge Base:** https://www.interserver.net/tips/
- **FAQ:** https://www.interserver.net/vps/faq.html
- **Blog:** https://www.interserver.net/blog/
- **YouTube Channel:** Video tutorials

**External Resources:**
- **DigitalOcean Tutorials:** Excellent general Linux/VPS guides
- **PM2 Documentation:** https://pm2.keymetrics.io/docs/
- **Nginx Documentation:** https://nginx.org/en/docs/
- **MongoDB University:** Free training courses

---

## 11. Step-by-Step Deployment Guide

### 11.1 Initial Server Setup (First-Time)

**Step 1: Access Your VPS**

```bash
# SSH into your VPS as root
ssh root@your_vps_ip_address

# Change root password
passwd
```

**Step 2: Update System**

```bash
# Update package list and upgrade
apt update && apt upgrade -y

# Install essential tools
apt install -y curl wget git vim htop net-tools software-properties-common build-essential
```

**Step 3: Set Timezone and Hostname**

```bash
# Set timezone
timedatectl set-timezone Africa/Nairobi

# Set hostname
hostnamectl set-hostname ementech-vps
echo "127.0.0.1 ementech-vps" >> /etc/hosts
```

**Step 4: Create Swap File**

```bash
# Create 2GB swap
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
sysctl vm.swappiness=10
echo 'vm.swappiness=10' >> /etc/sysctl.conf
```

### 11.2 Security Setup

**Step 5: Create Non-Root User**

```bash
# Create user
adduser ementech
usermod -aG sudo ementech

# Setup SSH keys for new user
su - ementech
mkdir -p ~/.ssh
chmod 700 ~/.ssh
vim ~/.ssh/authorized_keys
# Paste your public SSH key
chmod 600 ~/.ssh/authorized_keys
exit
```

**Step 6: Configure SSH**

```bash
# Backup SSH config
cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup

# Edit SSH config
vim /etc/ssh/sshd_config

# Change these settings:
Port 2222
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes

# Restart SSH
systemctl restart sshd

# TEST: Open new session before closing current one!
ssh ementech@your_vps_ip -p 2222
```

**Step 7: Setup Firewall**

```bash
# Install and configure UFW
apt install -y ufw
ufw default deny incoming
ufw default allow outgoing
ufw allow 2222/tcp  # Custom SSH port
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable
ufw status
```

### 11.3 Install Stack Components

**Step 8: Install Node.js**

```bash
# Add NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Verify installation
node -v
npm -v

# Install PM2 globally
npm install -g pm2
```

**Step 9: Install MongoDB (Optional - Skip if using Atlas)**

```bash
# Import MongoDB key
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | apt-key add -

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Install MongoDB
apt update
apt install -y mongodb-org

# Start MongoDB
systemctl start mongod
systemctl enable mongod
```

**Step 10: Install Redis**

```bash
# Install Redis
apt install -y redis-server

# Configure Redis
vim /etc/redis/redis.conf

# Set password:
requirepass your_strong_redis_password

# Restart Redis
systemctl restart redis-server
systemctl enable redis-server
```

**Step 11: Install Nginx**

```bash
# Install Nginx
apt install -y nginx

# Start Nginx
systemctl start nginx
systemctl enable nginx

# Test (access http://your_vps_ip)
```

### 11.4 Deploy Application

**Step 12: Clone Application**

```bash
# Switch to application user
su - ementech

# Clone repository
cd /var/www
git clone https://github.com/yourusername/ementech-website.git
cd ementech-website

# Or upload via SCP (from local machine):
# scp -P 2222 -r /path/to/local/project ementech@your_vps_ip:/var/www/ementech
```

**Step 13: Install Dependencies**

```bash
# Install Node.js dependencies
cd /var/www/ementech-website
npm ci --only=production

# Or if using yarn:
# yarn install --production
```

**Step 14: Configure Environment Variables**

```bash
# Create .env file
vim /var/www/ementech-website/.env

# Add environment variables:
NODE_ENV=production
PORT=3000

# Database (if using MongoDB Atlas)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ementech

# Or local MongoDB
# MONGODB_URI=mongodb://localhost:27017/ementech

# Redis
REDIS_URL=redis://127.0.0.1:6379

# JWT secrets
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=7d

# Other secrets
SESSION_SECRET=another_secret_key_here

# Secure .env file
chmod 600 .env
```

**Step 15: Build Frontend (if applicable)**

```bash
# Build React app (if separate)
cd /var/www/ementech-website/client
npm run build

# Or if using Next.js/Nuxt, build accordingly
```

### 11.6 Configure Nginx

**Step 17: Configure Nginx Reverse Proxy**

```bash
# Create Nginx site configuration
sudo vim /etc/nginx/sites-available/ementech

# Add configuration:
server {
    listen 80;
    server_name ementech.co.ke www.ementech.co.ke;

    # Redirect to HTTPS (after SSL is installed)
    # return 301 https://$server_name$request_uri;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static files with caching
    location /static/ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/ementech /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### 11.7 Setup SSL Certificate

**Step 18: Install Let's Encrypt SSL**

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d ementech.co.ke -d www.ementech.co.ke

# Follow prompts:
# - Enter email
# - Agree to terms
# - Choose redirect option (2: Redirect HTTP to HTTPS)

# Verify auto-renewal
sudo certbot renew --dry-run
```

### 11.8 Setup Monitoring and Logging

**Step 19: Configure PM2 Logging**

```bash
# Install PM2 log rotation
pm2 install pm2-logrotate

# Configure log rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
```

**Step 20: Setup Log Rotation**

```bash
# Create logrotate config
sudo vim /etc/logrotate.d/ementech

/var/www/ementech-website/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 ementech ementech
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

**Step 21: Install Monitoring Tools**

```bash
# Install monitoring tools
sudo apt install -y htop glances

# Install Netdata (optional, comprehensive monitoring)
bash <(curl -Ss https://my-netdata.io/kickstart.sh)

# Access Netdata at: http://your_vps_ip:19999
```

### 11.9 Setup Backups

**Step 22: Create Backup Scripts**

```bash
# Create backup directory
mkdir -p /home/ementech/backups/mongodb
mkdir -p /home/ementech/backups/app
mkdir -p /home/ementech/scripts

# Create MongoDB backup script
vim /home/ementech/scripts/backup-mongodb.sh

#!/bin/bash
BACKUP_DIR="/home/ementech/backups/mongodb"
DATE=$(date +%Y%m%d_%H%M%S)
mongodump --db ementech --out $BACKUP_DIR/backup_$DATE
tar -czf $BACKUP_DIR/backup_$DATE.tar.gz $BACKUP_DIR/backup_$DATE
rm -rf $BACKUP_DIR/backup_$DATE
find $BACKUP_DIR -name "backup_*.tar.gz" -mtime +7 -delete

# Make executable
chmod +x /home/ementech/scripts/backup-mongodb.sh

# Add to crontab
crontab -e
# Add: 0 2 * * * /home/ementech/scripts/backup-mongodb.sh
```

### 11.10 Final Verification

**Step 23: Verify Everything is Running**

```bash
# Check PM2 processes
pm2 list
pm2 logs

# Check Nginx
sudo systemctl status nginx

# Check MongoDB (if local)
sudo systemctl status mongod

# Check Redis
sudo systemctl status redis-server

# Check firewall status
sudo ufw status

# Test website
curl -I http://ementech.co.ke
curl -I https://ementech.co.ke
```

**Step 24: Save PM2 Configuration**

```bash
# Save PM2 process list
pm2 save

# Setup PM2 startup script
pm2 startup
# Run the command output by pm2 startup
```

**Step 25: Security Final Check**

```bash
# Verify root login disabled
grep "PermitRootLogin" /etc/ssh/sshd_config

# Verify password authentication disabled
grep "PasswordAuthentication" /etc/ssh/sshd_config

# Verify firewall is active
sudo ufw status

# Verify fail2ban is running
sudo systemctl status fail2ban
```

---

## 12. Comparison with Other VPS Providers

### 12.1 Interserver vs. Competitors

**Interserver VPS ($6/slice):**

| Feature | Interserver | DigitalOcean | Linode | Vultr |
|---------|-------------|--------------|--------|-------|
| **Starting Price** | $6/mo (2GB RAM) | $6/mo (1GB RAM) | $5/mo (1GB RAM) | $6/mo (1GB RAM) |
| **Price Lock** | ✅ Yes | ❌ No | ❌ No | ❌ No |
| **DDoS Protection** | ✅ Free (1Tbps) | ✅ Free | ✅ Free | ✅ Free |
| **Backups** | ✅ Free | ❌ $1-2/mo | ❌ $2-5/mo | ❌ Extra |
| **Bandwidth** | 1TB/slice | 1TB/mo | 1TB/mo | 1TB/mo |
| **CPU Cores** | 1 core/slice | 1 core | 1 core | 1 core |
| **Storage** | 30GB SSD/slice | 25GB SSD | 25GB SSD | 25GB SSD |
| **Support** | 24/7 | 24/7 | 24/7 | 24/7 |
| **Uptime SLA** | 99.9% | 99.99% | 99.99% | 99.99% |

**Key Advantages of Interserver:**
- **Price Lock Guarantee:** No renewal price increases
- **Free Backups:** Included with VPS
- **More Resources:** 2GB RAM vs 1GB for same price
- **InterShield Security:** Advanced firewall protection

**Disadvantages:**
- **Uptime:** Slightly lower than premium providers
- **Support Speed:** Can be slower than competitors
- **Feature Set:** Fewer bells and whistles

### 12.2 When to Choose Interserver

**Choose Interserver if:**
- Budget-conscious ($12-24/month range)
- Want price lock guarantee
- Need free backups
- Running small to medium MERN applications
- Comfortable with self-management

**Consider Alternatives if:**
- Need 99.99% uptime guarantee (critical applications)
- Require premium support
- Need advanced features (Kubernetes, load balancers)
- Willing to pay premium for reliability

**Recommended Alternatives:**
- **DigitalOcean:** Best balance of features and price
- **Linode:** Excellent performance and documentation
- **Vultr:** Good variety of server locations
- **AWS Lightsail:** Good for AWS ecosystem integration

---

## 13. Quick Reference Commands

### 13.1 Server Management

```bash
# System update
apt update && apt upgrade -y

# Reboot server
reboot

# Check disk space
df -h

# Check memory
free -h

# Check CPU
top -bn1 | head -20

# Check running processes
ps aux

# View system logs
journalctl -f
tail -f /var/log/syslog
```

### 13.2 Application Management

```bash
# Start application
pm2 start ecosystem.config.js --env production

# Stop application
pm2 stop all

# Restart application
pm2 restart all

# Reload (zero-downtime)
pm2 reload all

# View logs
pm2 logs

# Monitor resources
pm2 monit

# List processes
pm2 list

# Flush logs
pm2 flush

# Save process list
pm2 save
```

### 13.3 Database Management

```bash
# MongoDB backup
mongodump --db ementech --out /backup/location

# MongoDB restore
mongorestore --db ementech /backup/location/ementech

# MongoDB shell
mongosh

# Redis CLI
redis-cli
AUTH password
PING
```

### 13.4 Nginx Management

```bash
# Test configuration
nginx -t

# Reload Nginx
systemctl reload nginx

# Restart Nginx
systemctl restart nginx

# View error logs
tail -f /var/log/nginx/error.log

# View access logs
tail -f /var/log/nginx/access.log
```

### 13.5 Security Management

```bash
# Check firewall status
ufw status

# Ban IP with Fail2Ban
fail2ban-client set sshd banip 123.456.789.012

# Unban IP
fail2ban-client set sshd unbanip 123.456.789.012

# View Fail2Ban status
fail2ban-client status

# View authenticated users
w
who
```

---

## 14. Post-Deployment Checklist

### 14.1 Immediately After Deployment

- [ ] Application accessible via domain
- [ ] HTTPS working correctly
- [ ] SSL certificate valid
- [ ] Database connectivity working
- [ ] All API endpoints responding
- [ ] Static assets loading correctly
- [ ] No errors in application logs
- [ ] PM2 processes running in cluster mode
- [ ] Nginx proxy configured correctly
- [ ] Firewall rules active
- [ ] SSH access working with non-root user
- [ ] Root login disabled
- [ ] Password authentication disabled

### 14.2 Within First Week

- [ ] Monitor CPU/memory usage patterns
- [ ] Check logs daily for errors
- [ ] Test backup restoration
- [ ] Verify SSL auto-renewal setup
- [ ] Load test application
- [ ] Setup monitoring alerts
- [ ] Configure cron jobs
- [ ] Document all passwords and credentials
- [ ] Create disaster recovery plan

### 14.3 Ongoing Maintenance

- [ ] Weekly: Review logs for anomalies
- [ ] Weekly: Check disk space usage
- [ ] Weekly: Verify backup completion
- [ ] Monthly: Update system packages
- [ ] Monthly: Review and rotate secrets
- [ ] Monthly: Test restoration process
- [ ] Quarterly: Review resource usage
- [ ] Quarterly: Security audit
- [ ] Annually: SSL certificate review (if not auto-renewed)

---

## 15. Resources and Documentation

### 15.1 Official Interserver Resources

- **Interserver Tips (Knowledge Base):** https://www.interserver.net/tips/
- **VPS Control Panel:** https://my.interserver.net/vps
- **VPS FAQ:** https://www.interserver.net/vps/faq.html
- **Interserver Blog:** https://www.interserver.net/blog/

### 15.2 Technology Documentation

- **Node.js:** https://nodejs.org/docs/
- **PM2:** https://pm2.keymetrics.io/docs/
- **MongoDB:** https://docs.mongodb.com/
- **Redis:** https://redis.io/documentation
- **Nginx:** https://nginx.org/en/docs/
- **Ubuntu:** https://ubuntu.com/server/docs
- **Let's Encrypt:** https://letsencrypt.org/docs/

### 15.3 External Learning Resources

- **DigitalOcean Tutorials:** https://www.digitalocean.com/community/tutorials
- **How To Forge:** https://www.howtoforge.com/
- **Linux Handbook:** https://linuxhandbook.com/
- **Dev.to:** https://dev.to/t/sysadmin

---

## Appendix A: Configuration File Templates

### A.1 PM2 Ecosystem File

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'ementech-api',
    script: './server/index.js',
    cwd: '/var/www/ementech-website',
    instances: 2,
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    node_args: '--max-old-space-size=1024'
  }]
};
```

### A.2 Nginx Configuration with SSL

```nginx
server {
    listen 80;
    server_name ementech.co.ke www.ementech.co.ke;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ementech.co.ke www.ementech.co.ke;

    ssl_certificate /etc/letsencrypt/live/ementech.co.ke/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ementech.co.ke/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Rate limiting
    limit_req zone=general_limit burst=50 nodelay;
    limit_conn conn_limit 20;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static files caching
    location /static/ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/rss+xml font/truetype font/opentype application/vnd.ms-fontobject image/svg+xml;
}
```

### A.3 Environment Variables Template

```bash
# .env
NODE_ENV=production
PORT=3000

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ementech

# Redis
REDIS_URL=redis://127.0.0.1:6379
REDIS_PASSWORD=your_redis_password

# Authentication
JWT_SECRET=your_super_secret_jwt_key_here_change_this
JWT_EXPIRE=7d
SESSION_SECRET=another_secret_key_here_change_this

# Email (if using)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Application
APP_NAME=Ementech
APP_URL=https://ementech.co.ke
APP_EMAIL=admin@ementech.co.ke

# Logging
LOG_LEVEL=info

# Feature Flags
ENABLE_CACHING=true
ENABLE_RATE_LIMITING=true
```

---

## Sources and References

### Primary Sources (Interserver Official)

1. **[Setting Up Your New Server - Interserver Tutorial](https://www.interserver.net/blog/setting-up-your-new-server-an-interserver-tutorial/)** - Covers control panels, backups, and automated setup

2. **[How to install Node.js and NPM on Ubuntu](https://www.interserver.net/tips/kb/how-to-install-node-js-and-npm-on-ubuntu/)** - Official Interserver Node.js installation guide

3. **[How to Deploy Node.js Applications with Nginx](https://www.interserver.net/tips/kb/how-to-deploy-node-js-applications-with-nginx/)** - Complete deployment guide with Nginx reverse proxy setup

4. **[Hardening SSH Access on Ubuntu VPS](https://www.interserver.net/tips/kb/hardening-ssh-access-on-ubuntu-vps-the-ultimate-guide/)** - SSH security best practices

5. **[Standard VPS Backups How-To](https://www.interserver.net/tips/kb/standard-kvm-backups-how-to/)** - Updated November 2025, covers MinIO object storage

6. **[Secure Nginx Server with Let's Encrypt on Ubuntu](https://www.interserver.net/tips/kb/secure-nginx-lets-encrypt-ubuntu/)** - SSL certificate installation guide

7. **[Securing Nginx with SSL/TLS on Ubuntu](https://www.interserver.net/tips/kb/securing-nginx-ssl-tls-ubuntu-tips/)** - Updated July 2025

8. **[How to Monitor System Resources and Performance in Linux](https://www.interserver.net/tips/kb/how-to-monitor-system-resources-and-performance-in-linux/)** - Published November 2025

9. **[How to Install 'atop' to Monitor Real-Time System Performance](https://www.interserver.net/tips/kb/how-to-install-atop-to-monitor-real-time-system-performance/)** - Published October 2025

10. **[Building a System Health Monitoring Dashboard with Shell Scripts](https://www.interserver.net/tips/kb/building-a-system-health-monitoring-dashboard-with-shell-scripts/)** - Published December 2025

11. **[Server Hardware Firewall Rules (ACL)](https://www.interserver.net/tips/kb/server-hardware-firewall-rules-acl/)** - Hardware firewall configuration

### Secondary Sources (High-Quality Third-Party)

12. **[DigitalOcean - Node.js Production Setup](https://www.digitalocean.com/community/tutorials/how-to-set-up-a-node-js-application-for-production-on-ubuntu-20-04)** - Comprehensive production setup guide

13. **[GitHub - Server Setup Steps (Ubuntu)](https://github.com/dr5hn/server-setup)** - Complete automation scripts for Ubuntu server setup

14. **[How To Secure Nginx with Let's Encrypt on Ubuntu](https://www.digitalocean.com/community/tutorials/how-to-secure-nginx-with-let-s-encrypt-on-ubuntu-20-04)** - Updated August 2025

15. **[How to Set Up a Firewall with UFW on Ubuntu](https://www.digitalocean.com/community/tutorials/how-to-set-up-a-firewall-with-ufw-on-ubuntu)** - UFW configuration guide

16. **[PM2 Documentation](https://pm2.keymetrics.io/docs/)** - Official PM2 process manager documentation

17. **[MongoDB Documentation](https://docs.mongodb.com/)** - Official MongoDB database documentation

### Pricing and Comparison Sources

18. **[InterServer VPS Pricing Guide](https://blog.gettopdiscounts.com/interserver-vps-hosting-plans/)** - Updated pricing tiers and slice information

19. **[InterServer Review 2025](https://www.hostingadvice.com/how-to/interserver-vps-review/)** - Comprehensive review with feature comparison

### Performance and Optimization Sources

20. **[How Smart Swap Memory Scaling Boosts VPS Performance](https://medium.com/serveravatar/how-smart-swap-memory-scaling-boosts-vps-performance-dramatically-340fc90db906)** - Swap memory optimization

21. **[Complete Linux Server Setup Guide for Production](https://medium.com/@muhammed-rizin/complete-linux-server-setup-guide-for-production-nginx-node-pm2-mongodb-python-fastapi-ssl-2feccf84ea50)** - Production server configuration

22. **[Forward Email - Optimize Node.js Performance Production](https://forwardemail.net/en/blog/docs/optimize-nodejs-performance-production-monitoring-pm2-health-checks)** - Node.js production optimization

23. **[Node.js 24 Performance Improvements](https://metadesignsolutions.com/node-js-24-everything-you-need-to-know-in-2025/)** - Latest Node.js performance features

### Security Sources

24. **[How to Secure and Harden SSH](https://www.interserver.net/tips/kb/how-to-secure-and-harden-ssh/)** - SSH security improvements

25. **[Firewall and Security Archives](https://www.interserver.net/tips/knb-category/security/)** - Interserver security articles collection

### Monitoring Sources

26. **[View and Manage System Logs Using journalctl](https://www.interserver.net/tips/kb/how-to-view-and-manage-system-logs-using-journalctl-in-linux/)** - Published June 2025

27. **[Optimize System Performance](https://www.interserver.net/tips/kb/how-to-optimize-system-performance/)** - Published November 2025

### MERN Stack Resources

28. **[How to Deploy a MERN Application on Ubuntu](https://help.clouding.io/hc/en-us/articles/4406038904082-How-to-Deploy-a-MERN-MongoDB-Express-React-and-Node-js-Application-on-Ubuntu-20-04-LTS)** - MERN-specific deployment guide

29. **[Setup Node.js + MongoDB + PM2 Production Server](https://gist.github.com/jonkristian/86c2f240d4910bb72790900eac3ca191)** - Quick setup commands

---

**Document Status:** Complete
**Version:** 1.0
**Last Review:** 2026-01-18
**Next Review:** 2026-07-18 or when major stack changes occur

---

**Questions or Issues?**

If you encounter issues not covered in this guide, please refer to:
1. Interserver Knowledge Base: https://www.interserver.net/tips/
2. Interserver Support: Submit ticket through control panel
3. Community forums: Stack Overflow, Reddit, etc.

**Remember:** Always test backup restoration procedures and keep documentation up to date as your application evolves.
