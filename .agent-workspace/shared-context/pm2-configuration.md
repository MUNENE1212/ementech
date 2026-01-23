# PM2 Multi-Application Process Management

**Purpose**: Complete PM2 configuration for managing all Node.js applications on the VPS
**Last Updated**: 2026-01-21
**Status**: Ready for Implementation

---

## Table of Contents

1. [PM2 Ecosystem Configuration](#pm2-ecosystem-configuration)
2. [Individual App Configurations](#individual-app-configurations)
3. [PM2 Startup and Systemd](#pm2-startup-and-systemd)
4. [Monitoring and Logging](#monitoring-and-logging)
5. [Cluster Mode (Optional)](#cluster-mode-optional)
6. [Implementation Steps](#implementation-steps)

---

## PM2 Ecosystem Configuration

### Complete Ecosystem File

**File**: `/var/www/shared/pm2/ecosystem.config.js`

```javascript
/**
 * PM2 Ecosystem Configuration
 * Multi-application process management for Ementech VPS
 */

module.exports = {
  apps: [
    // Ementech Backend
    {
      name: 'ementech-backend',
      script: './src/server.js',
      cwd: '/var/www/ementech-website/backend',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 5001
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 5001
      },
      error_file: '/var/log/pm2/ementech-backend-error.log',
      out_file: '/var/log/pm2/ementech-backend-out.log',
      log_file: '/var/log/pm2/ementech-backend-combined.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
      kill_timeout: 5000,
      listen_timeout: 10000,
      shutdown_with_message: true,
      source_map_support: true,
      instance_var: 'INSTANCE_ID',
      automation: false,
      treekill: true,
      windowsHide: true
    },

    // Dumuwaks Backend
    {
      name: 'dumuwaks-backend',
      script: './src/server.js',
      cwd: '/var/www/dumuwaks/backend',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 5000
      },
      error_file: '/var/log/pm2/dumuwaks-backend-error.log',
      out_file: '/var/log/pm2/dumuwaks-backend-out.log',
      log_file: '/var/log/pm2/dumuwaks-backend-combined.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
      kill_timeout: 5000,
      listen_timeout: 10000,
      shutdown_with_message: true,
      source_map_support: true,
      instance_var: 'INSTANCE_ID',
      treekill: true,
      windowsHide: true
    },

    // Admin Dashboard Backend
    {
      name: 'admin-backend',
      script: './src/server.js',
      cwd: '/var/www/admin-dashboard/backend',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3001
      },
      error_file: '/var/log/pm2/admin-backend-error.log',
      out_file: '/var/log/pm2/admin-backend-out.log',
      log_file: '/var/log/pm2/admin-backend-combined.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
      kill_timeout: 5000,
      listen_timeout: 10000,
      shutdown_with_message: true,
      source_map_support: true,
      instance_var: 'INSTANCE_ID',
      treekill: true,
      windowsHide: true
    }
  ],

  /**
   * Deployment Configuration (Optional)
   * Enable if using PM2 deploy feature
   */
  deploy: {
    production: {
      user: 'deployer',
      host: '69.164.244.165',
      ref: 'origin/main',
      repo: 'git@github.com:ementech/ementech-website.git',
      path: '/var/www/ementech-website',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production'
    }
  }
};
```

---

## Individual App Configurations

### Ementech Backend Only

**File**: `/var/www/ementech-website/backend/ecosystem.config.js`

```javascript
module.exports = {
  apps: [{
    name: 'ementech-backend',
    script: './src/server.js',
    cwd: '/var/www/ementech-website/backend',
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5001
    },
    error_file: '/var/log/pm2/ementech-backend-error.log',
    out_file: '/var/log/pm2/ementech-backend-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    min_uptime: '10s',
    max_restarts: 10
  }]
};
```

### Dumuwaks Backend Only

**File**: `/var/www/dumuwaks/backend/ecosystem.config.js`

```javascript
module.exports = {
  apps: [{
    name: 'dumuwaks-backend',
    script: './src/server.js',
    cwd: '/var/www/dumuwaks/backend',
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: '/var/log/pm2/dumuwaks-backend-error.log',
    out_file: '/var/log/pm2/dumuwaks-backend-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    min_uptime: '10s',
    max_restarts: 10
  }]
};
```

### Admin Backend Only

**File**: `/var/www/admin-dashboard/backend/ecosystem.config.js`

```javascript
module.exports = {
  apps: [{
    name: 'admin-backend',
    script: './src/server.js',
    cwd: '/var/www/admin-dashboard/backend',
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    max_memory_restart: '512M',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: '/var/log/pm2/admin-backend-error.log',
    out_file: '/var/log/pm2/admin-backend-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    min_uptime: '10s',
    max_restarts: 10
  }]
};
```

---

## PM2 Startup and Systemd

### Systemd Service Configuration

**Generate Startup Script**:
```bash
pm2 startup systemd
```

**Output** (copy and run the command):
```bash
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u root --hp /root
```

**Manual Systemd Service** (if needed):

**File**: `/etc/systemd/system/pm2-root.service`

```ini
[Unit]
Description=PM2 process manager
Documentation=https://pm2.keymetrics.io/
After=network.target

[Service]
Type=forking
User=root
LimitNOFILE=infinity
LimitNPROC=infinity
LimitCORE=infinity
Environment=PATH=/usr/bin:/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin
Environment=PM2_HOME=/root/.pm2
PIDFile=/root/.pm2/pm2.pid
Restart=on-failure

ExecStart=/usr/lib/node_modules/pm2/bin/pm2 resurrect
ExecReload=/usr/lib/node_modules/pm2/bin/pm2 reload all
ExecStop=/usr/lib/node_modules/pm2/bin/pm2 kill

[Install]
WantedBy=multi-user.target
```

**Enable and Start**:
```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable PM2 on boot
sudo systemctl enable pm2-root

# Check status
sudo systemctl status pm2-root

# Start PM2
sudo systemctl start pm2-root

# Stop PM2
sudo systemctl stop pm2-root

# Restart PM2
sudo systemctl restart pm2-root
```

---

## Monitoring and Logging

### Log Management

**Create Log Directories**:
```bash
# Create PM2 log directory
sudo mkdir -p /var/log/pm2

# Create application log directories
sudo mkdir -p /var/log/applications/ementech
sudo mkdir -p /var/log/applications/dumuwaks
sudo mkdir -p /var/log/applications/admin

# Set ownership
sudo chown -R root:root /var/log/pm2
sudo chmod -R 755 /var/log/pm2

sudo chown -R www-data:www-data /var/log/applications
sudo chmod -R 775 /var/log/applications
```

### PM2 Log Commands

```bash
# View all logs
pm2 logs

# View specific app logs
pm2 logs ementech-backend
pm2 logs dumuwaks-backend
pm2 logs admin-backend

# View last N lines
pm2 logs ementech-backend --lines 100

# View only errors
pm2 logs ementech-backend --err

# View only standard output
pm2 logs ementech-backend --out

# Clear logs
pm2 flush

# Reload logs (rotate)
pm2 reloadLogs
```

### Log Rotation Configuration

**Install PM2 Log Rotation Module**:
```bash
pm2 install pm2-logrotate
```

**Configure**:
```bash
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 14
pm2 set pm2-logrotate:compress true
pm2 set pm2-logrotate:rotateInterval '0 0 * * *'  # Daily at midnight
```

**Manual Configuration** (alternative):

**File**: `/etc/logrotate.d/pm2`

```
/var/log/pm2/*.log
{
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    create 0640 root root
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

---

## Cluster Mode (Optional)

### When to Use Cluster Mode

**Benefits**:
- Utilize multiple CPU cores
- Zero-downtime reloads
- Improved performance for CPU-intensive tasks

**Considerations**:
- More complex state management
- Memory usage increases per instance
- Socket.IO requires sticky sessions

### Cluster Configuration

**Single Application in Cluster Mode**:
```javascript
module.exports = {
  apps: [{
    name: 'ementech-backend',
    script: './src/server.js',
    instances: 'max',  // Or specify number: 2, 4, etc.
    exec_mode: 'cluster',
    autorestart: true,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5001
    }
  }]
};
```

**Sticky Sessions for Socket.IO** (required for cluster mode):

**Nginx Configuration**:
```nginx
upstream ementech_backend {
    ip_hash;  # Sticky sessions based on IP
    server 127.0.0.1:5001;
}

server {
    location /api/ {
        proxy_pass http://ementech_backend;
        # ... other proxy settings
    }
}
```

---

## Implementation Steps

### 1. Install PM2 Globally

```bash
# Install PM2
sudo npm install -g pm2

# Verify installation
pm2 --version

# Update to latest version
pm2 update
```

### 2. Create Directory Structure

```bash
# Create shared PM2 directory
sudo mkdir -p /var/www/shared/pm2

# Create log directories
sudo mkdir -p /var/log/pm2
sudo mkdir -p /var/log/applications/{ementech,dumuwaks,admin}

# Set permissions
sudo chown -R root:root /var/www/shared
sudo chmod -R 755 /var/www/shared

sudo chown -R root:root /var/log/pm2
sudo chmod -R 755 /var/log/pm2

sudo chown -R www-data:www-data /var/log/applications
sudo chmod -R 775 /var/log/applications
```

### 3. Copy Ecosystem Files

```bash
# Copy master ecosystem file
sudo cp ecosystem.config.js /var/www/shared/pm2/ecosystem.config.js

# Copy individual ecosystem files
sudo cp /var/www/ementech-website/backend/ecosystem.config.js /var/www/ementech-website/backend/
sudo cp /var/www/dumuwaks/backend/ecosystem.config.js /var/www/dumuwaks/backend/
sudo cp /var/www/admin-dashboard/backend/ecosystem.config.js /var/www/admin-dashboard/backend/
```

### 4. Start Applications

```bash
# Start all applications using ecosystem file
pm2 start /var/www/shared/pm2/ecosystem.config.js

# OR start individually
pm2 start /var/www/ementech-website/backend/ecosystem.config.js
pm2 start /var/www/dumuwaks/backend/ecosystem.config.js
pm2 start /var/www/admin-dashboard/backend/ecosystem.config.js

# Verify processes
pm2 list
pm2 status
```

### 5. Configure PM2 Startup

```bash
# Generate startup script
pm2 startup systemd

# Copy and run the output command (example):
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u root --hp /root

# Save current process list
pm2 save

# Verify systemd service
systemctl status pm2-root
```

### 6. Install Log Rotation

```bash
# Install pm2-logrotate module
pm2 install pm2-logrotate

# Configure
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 14
pm2 set pm2-logrotate:compress true
pm2 set pm2-logrotate:dateFormat YYYY-MM-DD_HH-mm-ss
```

### 7. Configure Logrotate (Alternative)

```bash
# Create logrotate configuration
sudo nano /etc/logrotate.d/pm2-apps
```

Content:
```
/var/log/pm2/*.log
/var/log/applications/*/*.log
{
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    create 0640 root root
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

### 8. Verify Configuration

```bash
# Check process status
pm2 list
pm2 show ementech-backend
pm2 show dumuwaks-backend
pm2 show admin-backend

# Check logs
pm2 logs --lines 50

# Monitor in real-time
pm2 monit

# Check resource usage
pm2 info ementech-backend

# Test health endpoints
curl http://localhost:5001/api/health
curl http://localhost:5000/api/health
curl http://localhost:3001/api/health
```

### 9. Create Helper Scripts

**Start All Applications** (`/var/www/shared/scripts/start-all.sh`):
```bash
#!/bin/bash
echo "Starting all applications..."
pm2 start /var/www/shared/pm2/ecosystem.config.js
pm2 save
echo "All applications started"
pm2 list
```

**Stop All Applications** (`/var/www/shared/scripts/stop-all.sh`):
```bash
#!/bin/bash
echo "Stopping all applications..."
pm2 stop all
echo "All applications stopped"
```

**Restart All Applications** (`/var/www/shared/scripts/restart-all.sh`):
```bash
#!/bin/bash
echo "Restarting all applications..."
pm2 restart all
echo "All applications restarted"
pm2 list
```

**Make scripts executable**:
```bash
chmod +x /var/www/shared/scripts/*.sh
```

---

## PM2 Monitoring Dashboard

### PM2 Plus (Optional Cloud Monitoring)

```bash
# Link to PM2 Plus (free tier available)
pm2 link <public-key> <secret-key>

# Real-time monitoring at https://app.pm2.io/
```

### Local Monitoring

```bash
# Real-time monitoring
pm2 monit

# View detailed information
pm2 show ementech-backend

# Check logs
pm2 logs

# Custom metrics (if implemented in apps)
pm2 show ementech-backend | grep -A 10 "metadata"
```

---

## Troubleshooting

### Common Issues

**1. Application Not Starting**
```bash
# Check logs
pm2 logs ementech-backend --err

# Check port availability
sudo netstat -tlnp | grep -E '(5000|5001|3001)'

# Verify configuration
pm2 show ementech-backend

# Test run manually
cd /var/www/ementech-website/backend
node src/server.js
```

**2. High Memory Usage**
```bash
# Check memory usage
pm2 monit

# Restart specific app
pm2 restart ementech-backend

# Update max_memory_restart in ecosystem config
max_memory_restart: '512M'  # Lower threshold
```

**3. Application Crashing**
```bash
# Check error logs
pm2 logs ementech-backend --err --lines 100

# Increase max_restarts temporarily
pm2 reset ementech-backend

# Check for unhandled exceptions
# Add error handling in application code
```

**4. PM2 Not Starting on Boot**
```bash
# Check systemd service
systemctl status pm2-root

# Manual start
pm2 resurrect

# Save process list again
pm2 save

# Verify startup script
pm2 startup systemd
```

**5. Socket.IO Issues with Cluster Mode**
```bash
# Ensure sticky sessions are configured in nginx
# Check ip_hash directive in upstream block

# Or use fork mode instead of cluster mode
exec_mode: 'fork'
instances: 1
```

---

## Maintenance Commands

```bash
# Update PM2
npm update -g pm2
pm2 update

# Reload applications (zero-downtime)
pm2 reload all

# Reset restart count
pm2 reset all

# Flush all logs
pm2 flush

# Save current process list
pm2 save

# Remove stopped applications
pm2 purge

# Update PM2 startup
pm2 unstartup systemd
pm2 startup systemd
```

---

**Configuration Status**: ✅ Ready for Implementation
**Priority**: Critical
**Dependencies**: Node.js applications must be built and deployed before starting PM2 processes
