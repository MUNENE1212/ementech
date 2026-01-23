# Automation Scripts for Multi-Application Deployment

**Purpose**: Collection of automation scripts for deployment, monitoring, backup, and maintenance
**Last Updated**: 2026-01-21
**Status**: Ready for Implementation

---

## Table of Contents

1. [Deployment Scripts](#deployment-scripts)
2. [Backup Scripts](#backup-scripts)
3. [Monitoring Scripts](#monitoring-scripts)
4. [Maintenance Scripts](#maintenance-scripts)
5. [Utility Scripts](#utility-scripts)
6. [Cron Jobs](#cron-jobs)

---

## Deployment Scripts

### Zero-Downtime Deployment Script

**File**: `/var/www/shared/scripts/deploy.sh`

```bash
#!/bin/bash
################################################################################
# Zero-Downtime Deployment Script for Multi-Application VPS
# Usage: ./deploy.sh <app-name> <source-directory>
################################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}→ $1${NC}"
}

# Check arguments
if [ $# -lt 2 ]; then
    echo "Usage: $0 <app-name> <source-directory>"
    echo ""
    echo "Example:"
    echo "  $0 ementech-website ./dist"
    echo "  $0 dumuwaks ./dist"
    echo "  $0 admin-dashboard ./dist"
    exit 1
fi

APP_NAME=$1
SOURCE_DIR=$2
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# Configuration
APP_DIR="/var/www/$APP_NAME"
RELEASE_DIR="$APP_DIR/releases/$TIMESTAMP"
CURRENT_LINK="$APP_DIR/current"
BACKUP_DIR="$APP_DIR/releases/backup-$TIMESTAMP"

# Validation
if [ ! -d "$SOURCE_DIR" ]; then
    print_error "Source directory does not exist: $SOURCE_DIR"
    exit 1
fi

if [ ! -d "$APP_DIR" ]; then
    print_error "Application directory does not exist: $APP_DIR"
    exit 1
fi

print_info "Starting deployment of $APP_NAME..."

# Create release directory
print_info "Creating release directory..."
mkdir -p "$RELEASE_DIR"

# Copy files
print_info "Copying files from $SOURCE_DIR..."
cp -r "$SOURCE_DIR"/* "$RELEASE_DIR/"

# Set permissions
print_info "Setting permissions..."
chown -R www-data:www-data "$RELEASE_DIR"
chmod -R 755 "$RELEASE_DIR"

# Backup current release if exists
if [ -L "$CURRENT_LINK" ]; then
    print_info "Backing up current release..."
    CURRENT_TARGET=$(readlink -f "$CURRENT_LINK")
    if [ -d "$CURRENT_TARGET" ]; then
        cp -r "$CURRENT_TARGET" "$BACKUP_DIR"
    fi
fi

# Atomic switch
print_info "Switching to new release..."
ln -sfn "$RELEASE_DIR" "$CURRENT_LINK"

# Restart backend if exists
if [ -d "$APP_DIR/backend" ]; then
    print_info "Restarting backend..."
    pm2 restart "${APP_NAME}-backend" || print_error "Failed to restart backend"
fi

# Reload nginx
print_info "Reloading nginx..."
nginx -t && systemctl reload nginx || print_error "Failed to reload nginx"

# Health check
print_info "Performing health check..."
sleep 3
if curl -f http://localhost/api/health > /dev/null 2>&1; then
    print_success "Health check passed"
else
    print_error "Health check failed - rolling back..."
    if [ -d "$BACKUP_DIR" ]; then
        ln -sfn "$BACKUP_DIR" "$CURRENT_LINK"
        pm2 restart "${APP_NAME}-backend"
        systemctl reload nginx
        print_info "Rolled back to previous version"
    fi
    exit 1
fi

# Cleanup old releases (keep last 5)
print_info "Cleaning up old releases..."
find "$APP_DIR/releases" -maxdepth 1 -type d -name "20*" | sort -r | tail -n +6 | xargs -r rm -rf

print_success "Deployment completed successfully!"
echo "Release: $TIMESTAMP"
echo "Location: $RELEASE_DIR"

# Log deployment
echo "$(date '+%Y-%m-%d %H:%M:%S') - $APP_NAME - $TIMESTAMP" >> /var/log/applications/deployments.log
```

### Deploy All Applications

**File**: `/var/www/shared/scripts/deploy-all.sh`

```bash
#!/bin/bash
################################################################################
# Deploy all applications
################################################################################

set -e

echo "Deploying all applications..."

# Deploy Ementech
if [ -d "./ementech-website/dist" ]; then
    ./deploy.sh ementech-website ./ementech-website/dist
fi

# Deploy Dumuwaks
if [ -d "./dumuwaks/dist" ]; then
    ./deploy.sh dumuwaks ./dumuwaks/dist
fi

# Deploy Admin
if [ -d "./admin-dashboard/dist" ]; then
    ./deploy.sh admin-dashboard ./admin-dashboard/dist
fi

echo "All applications deployed successfully!"
```

---

## Backup Scripts

### Comprehensive Backup Script

**File**: `/var/www/shared/scripts/backup.sh`

```bash
#!/bin/bash
################################################################################
# Comprehensive Backup Script
# Backs up MongoDB, uploads, configurations, and SSL certificates
################################################################################

set -e

# Configuration
BACKUP_ROOT="/var/www/shared/backups"
DATE=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="$BACKUP_ROOT/$DATE"
RETENTION_DAYS=30

# Create backup directory
mkdir -p "$BACKUP_DIR"

echo "Starting backup: $DATE"

# Backup MongoDB databases
echo "Backing up MongoDB databases..."
mkdir -p "$BACKUP_DIR/mongodb"

# Ementech database
if [ -n "$EMENTECH_MONGODB_URI" ]; then
    mongodump --uri="$EMENTECH_MONGODB_URI" --out="$BACKUP_DIR/mongodb/ementech"
fi

# Dumuwaks database
if [ -n "$DUMUWAKS_MONGODB_URI" ]; then
    mongodump --uri="$DUMUWAKS_MONGODB_URI" --out="$BACKUP_DIR/mongodb/dumuwaks"
fi

# Admin database
if [ -n "$ADMIN_MONGODB_URI" ]; then
    mongodump --uri="$ADMIN_MONGODB_URI" --out="$BACKUP_DIR/mongodb/admin"
fi

# Backup user uploads
echo "Backing up user uploads..."
mkdir -p "$BACKUP_DIR/uploads"

for app in ementech-website dumuwaks admin-dashboard; do
    if [ -d "/var/www/$app/shared/uploads" ]; then
        tar -czf "$BACKUP_DIR/uploads/${app}.tar.gz" -C "/var/www/$app/shared" uploads/
    fi
done

# Backup configurations
echo "Backing up configurations..."
mkdir -p "$BACKUP_DIR/configs"

tar -czf "$BACKUP_DIR/configs/nginx.tar.gz" /etc/nginx

for app in ementech-website dumuwaks admin-dashboard; do
    if [ -f "/var/www/$app/backend/.env" ]; then
        cp "/var/www/$app/backend/.env" "$BACKUP_DIR/configs/${app}.env"
    fi
done

cp -r /var/www/shared/pm2 "$BACKUP_DIR/configs/"

# Backup PM2 process list
echo "Backing up PM2 process list..."
pm2 save --force
cp ~/.pm2/dump.pm2 "$BACKUP_DIR/pm2-dump.pm2"

# Backup SSL certificates
echo "Backing up SSL certificates..."
mkdir -p "$BACKUP_DIR/ssl"
cp -r /etc/letsencrypt "$BACKUP_DIR/ssl/"

# Create backup manifest
echo "Backup created: $DATE" > "$BACKUP_DIR/MANIFEST.txt"
echo "Contents:" >> "$BACKUP_DIR/MANIFEST.txt"
find "$BACKUP_DIR" -type f -o -type d | sort >> "$BACKUP_DIR/MANIFEST.txt"

# Compress backup
echo "Compressing backup..."
cd "$BACKUP_ROOT"
tar -czf "${DATE}.tar.gz" "$DATE"
rm -rf "$DATE"

# Upload to off-site storage (optional - configure as needed)
# aws s3 sync "${DATE}.tar.gz" s3://ementech-backups/
# rclone copy "${DATE}.tar.gz" remote:backups/

# Cleanup old backups
echo "Cleaning up old backups (older than $RETENTION_DAYS days)..."
find "$BACKUP_ROOT" -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup completed: ${DATE}.tar.gz"

# Log backup
echo "$(date '+%Y-%m-%d %H:%M:%S') - Backup completed: ${DATE}.tar.gz" >> /var/log/applications/backup.log
```

### Database Backup Script

**File**: `/var/www/shared/scripts/backup-db.sh`

```bash
#!/bin/bash
################################################################################
# MongoDB Backup Script (MongoDB Atlas)
# Note: Atlas has automated backups, this is for additional redundancy
################################################################################

set -e

BACKUP_DIR="/var/www/shared/backups/mongodb"
DATE=$(date +%Y%m%d-%H%M%S)
RETENTION_DAYS=7

mkdir -p "$BACKUP_DIR"

# Backup each database
databases=(
    "ementech:$EMENTECH_MONGODB_URI"
    "dumuwaks:$DUMUWAKS_MONGODB_URI"
    "admin:$ADMIN_MONGODB_URI"
)

for db_info in "${databases[@]}"; do
    IFS=':' read -r name uri <<< "$db_info"

    if [ -n "$uri" ]; then
        echo "Backing up $name database..."
        mongodump --uri="$uri" --out="$BACKUP_DIR/${name}-${DATE}"
        tar -czf "$BACKUP_DIR/${name}-${DATE}.tar.gz" -C "$BACKUP_DIR" "${name}-${DATE}"
        rm -rf "$BACKUP_DIR/${name}-${DATE}"
    fi
done

# Cleanup old backups
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete

echo "Database backup completed: $DATE"
```

---

## Monitoring Scripts

### Health Check Script

**File**: `/var/www/shared/scripts/health-check.sh`

```bash
#!/bin/bash
################################################################################
# Health Check Script for All Applications
# Checks application health and restarts if needed
################################################################################

# Configuration
ALERT_EMAIL="admin@ementech.co.ke"
LOG_FILE="/var/log/applications/health-check.log"

# Function to log
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
}

# Function to send alert
send_alert() {
    local subject="Alert: $1"
    local message="$2"

    # Send email (configure mail service first)
    # echo "$message" | mail -s "$subject" "$ALERT_EMAIL"

    # Or use webhook (Slack, Discord, etc.)
    # curl -X POST -H 'Content-type: application/json' \
    #   --data "{\"text\":\"$message\"}" \
    #   YOUR_WEBHOOK_URL

    log "ALERT: $subject - $message"
}

# Health check endpoints
declare -A APPS=(
    ["ementech-backend"]="5001:https://ementech.co.ke/api/health"
    ["dumuwaks-backend"]="5000:https://dumuwaks.ementech.co.ke/api/health"
    ["admin-backend"]="3001:https://admin.ementech.co.ke/api/health"
)

failed_apps=()

for app in "${!APPS[@]}"; do
    IFS=':' read -r port url <<< "${APPS[$app]}"

    # Check if process is running
    if ! pm2 describe "$app" > /dev/null 2>&1; then
        log "$app - Process not found"
        failed_apps+=("$app")
        continue
    fi

    # Check HTTP health endpoint
    if curl -f -s --max-time 10 "$url" > /dev/null 2>&1; then
        log "$app - Healthy"
    else
        log "$app - Unhealthy - Restarting..."
        pm2 restart "$app"

        # Wait for restart
        sleep 10

        # Check again
        if curl -f -s --max-time 10 "$url" > /dev/null 2>&1; then
            log "$app - Recovered after restart"
        else
            log "$app - Still unhealthy after restart"
            failed_apps+=("$app")
            send_alert "$app health check failed" "Application $app failed health check and could not recover automatically."
        fi
    fi
done

# Summary
if [ ${#failed_apps[@]} -eq 0 ]; then
    log "All applications healthy"
    exit 0
else
    log "Failed applications: ${failed_apps[*]}"
    exit 1
fi
```

### System Resource Monitoring

**File**: `/var/www/shared/scripts/resource-monitor.sh`

```bash
#!/bin/bash
################################################################################
# System Resource Monitoring Script
# Monitors CPU, RAM, Disk, and sends alerts if thresholds exceeded
################################################################################

# Configuration
CPU_THRESHOLD=80
RAM_THRESHOLD=85
DISK_THRESHOLD=90
ALERT_EMAIL="admin@ementech.co.ke"
LOG_FILE="/var/log/applications/resource-monitor.log"

# Function to log
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
}

# Function to send alert
send_alert() {
    log "ALERT: $1"
    # Send email or webhook
}

# Check CPU usage
cpu_usage=$(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1}')
cpu_int=${cpu_usage%.*}

if [ $cpu_int -gt $CPU_THRESHOLD ]; then
    log "CPU usage high: ${cpu_usage}%"
    send_alert "High CPU usage: ${cpu_usage}%"
fi

# Check RAM usage
ram_usage=$(free | grep Mem | awk '{print ($3/$2) * 100.0}')
ram_int=${ram_usage%.*}

if [ $ram_int -gt $RAM_THRESHOLD ]; then
    log "RAM usage high: ${ram_usage}%"
    send_alert "High RAM usage: ${ram_usage}%"
fi

# Check disk usage
disk_usage=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')

if [ $disk_usage -gt $DISK_THRESHOLD ]; then
    log "Disk usage high: ${disk_usage}%"
    send_alert "High disk usage: ${disk_usage}%"
fi

# Check PM2 processes
pm2_running=$(pm2 list | grep -c "online")
pm2_total=$(pm2 list | wc -l)

log "Resources: CPU ${cpu_usage}%, RAM ${ram_usage}%, Disk ${disk_usage}%, PM2 ${pm2_running}/${pm2_total} running"
```

---

## Maintenance Scripts

### Log Cleanup Script

**File**: `/var/www/shared/scripts/cleanup-logs.sh`

```bash
#!/bin/bash
################################################################################
# Log Cleanup Script
# Removes old logs and compresses large log files
################################################################################

# Configuration
LOG_DIRS=(
    "/var/log/pm2"
    "/var/log/nginx"
    "/var/log/applications"
)
RETENTION_DAYS=30
COMPRESS_SIZE=100M  # Compress logs larger than 100MB

echo "Starting log cleanup..."

for dir in "${LOG_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        echo "Processing $dir..."

        # Remove old logs
        find "$dir" -name "*.log" -mtime +$RETENTION_DAYS -delete

        # Compress large logs
        find "$dir" -name "*.log" -size +$COMPRESS_SIZE -exec gzip {} \;

        # Remove old compressed logs
        find "$dir" -name "*.gz" -mtime +$RETENTION_DAYS -delete
    fi
done

# Reload PM2 logs
pm2 reloadLogs

echo "Log cleanup completed"
```

### System Update Script

**File**: `/var/www/shared/scripts/system-update.sh`

```bash
#!/bin/bash
################################################################################
# System Update Script
# Updates system packages and Node.js dependencies
################################################################################

set -e

echo "Starting system update..."

# Update package list
echo "Updating package list..."
apt update

# Upgrade packages (safe upgrades only)
echo "Upgrading packages..."
apt upgrade -y

# Update PM2
echo "Updating PM2..."
pm2 update

# Update npm packages for each application
for app_dir in /var/www/*/backend; do
    if [ -d "$app_dir" ] && [ -f "$app_dir/package.json" ]; then
        echo "Updating packages in $app_dir..."
        cd "$app_dir"
        npm update
        pm2 restart "$(basename $(dirname $app_dir))-backend"
    fi
done

# Clean package cache
echo "Cleaning package cache..."
apt autoremove -y
apt autoclean

echo "System update completed"

# Log update
echo "$(date '+%Y-%m-%d %H:%M:%S') - System update completed" >> /var/log/applications/updates.log
```

---

## Utility Scripts

### SSL Certificate Renewal

**File**: `/var/www/shared/scripts/ssl-renew.sh`

```bash
#!/bin/bash
################################################################################
# SSL Certificate Renewal Script
# Renews Let's Encrypt certificates and reloads nginx
################################################################################

echo "Checking SSL certificates..."

# Renew certificates
certbot renew --quiet

# Reload nginx if certificates were renewed
if [ $? -eq 0 ]; then
    echo "Reloading nginx..."
    systemctl reload nginx
    echo "SSL certificates renewed successfully"
else
    echo "SSL certificate renewal failed"
    exit 1
fi
```

### Database Connection Test

**File**: `/var/www/shared/scripts/test-db-connection.sh`

```bash
#!/bin/bash
################################################################################
# Database Connection Test Script
# Tests MongoDB Atlas connectivity
################################################################################

# Configuration
URIS=(
    "$EMENTECH_MONGODB_URI"
    "$DUMUWAKS_MONGODB_URI"
    "$ADMIN_MONGODB_URI"
)

for uri in "${URIS[@]}"; do
    if [ -n "$uri" ]; then
        echo "Testing connection to: $uri"
        if mongosh "$uri" --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
            echo "✓ Connection successful"
        else
            echo "✗ Connection failed"
            exit 1
        fi
    fi
done

echo "All database connections successful"
```

### Port Availability Check

**File**: `/var/www/shared/scripts/check-ports.sh`

```bash
#!/bin/bash
################################################################################
# Port Availability Check Script
# Checks if required ports are available
################################################################################

PORTS=(5000 5001 3001)

for port in "${PORTS[@]}"; do
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "Port $port is in use by:"
        lsof -i :$port
    else
        echo "Port $port is available"
    fi
done
```

---

## Cron Jobs

**File**: `/etc/cron.d/ementech-apps`

```bash
################################################################################
# Cron Jobs for EmenTech Multi-Application VPS
################################################################################

# Health check every 5 minutes
*/5 * * * * root /var/www/shared/scripts/health-check.sh

# Resource monitoring every hour
0 * * * * root /var/www/shared/scripts/resource-monitor.sh

# Backup daily at 2 AM
0 2 * * * root /var/www/shared/scripts/backup.sh

# Database backup daily at 3 AM
0 3 * * * root /var/www/shared/scripts/backup-db.sh

# Log cleanup weekly on Sunday at 4 AM
0 4 * * 0 root /var/www/shared/scripts/cleanup-logs.sh

# SSL certificate renewal check daily at 5 AM
0 5 * * * root /var/www/shared/scripts/ssl-renew.sh

# System update weekly on Sunday at 3 AM
0 3 * * 0 root /var/www/shared/scripts/system-update.sh
```

---

## Script Installation

```bash
# Make all scripts executable
chmod +x /var/www/shared/scripts/*.sh

# Create log directories
mkdir -p /var/log/applications
chmod 775 /var/log/applications

# Create backup directories
mkdir -p /var/www/shared/backups
chmod 750 /var/www/shared/backups

# Install cron jobs
cp /var/www/shared/scripts/cron-jobs /etc/cron.d/ementech-apps
chmod 644 /etc/cron.d/ementech-apps

# Reload cron
systemctl reload cron

# Test scripts
/var/www/shared/scripts/health-check.sh
/var/www/shared/scripts/test-db-connection.sh
```

---

**Status**: ✅ Ready for Implementation
**Priority**: High
**Dependencies**: None (standalone scripts)
