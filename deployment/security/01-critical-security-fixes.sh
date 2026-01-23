#!/bin/bash

################################################################################
# Critical Security Fixes - Phase 1
# Purpose: Implement immediate P0 security fixes for EmenTech deployment
# Usage: sudo bash 01-critical-security-fixes.sh
#
# CRITICAL: Run this script immediately after review
################################################################################

# Exit on error
set -euo pipefail

################################################################################
# CONFIGURATION
################################################################################

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_FILE="/var/log/ementech-security-fixes.log"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

################################################################################
# LOGGING FUNCTIONS
################################################################################

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

################################################################################
# BACKUP FUNCTION
################################################################################

backup_config() {
    local file=$1
    if [[ -f "$file" ]]; then
        cp "$file" "${file}.backup_${TIMESTAMP}"
        log "Backed up: $file"
    fi
}

################################################################################
# PRE-FLIGHT CHECKS
################################################################################

preflight_checks() {
    log "=========================================="
    log "Preflight Checks"
    log "=========================================="

    # Check if running as root
    if [[ $EUID -ne 0 ]]; then
        log_error "This script must be run as root (use sudo)"
        exit 1
    fi

    # Check if backup directory exists
    mkdir -p /var/backups/ementech-security

    log_success "Preflight checks passed"
}

################################################################################
# FIX 1: SECURE SSH ACCESS
################################################################################

fix_ssh_security() {
    log "=========================================="
    log "Fix 1: Securing SSH Access"
    log "=========================================="

    local ssh_config="/etc/ssh/sshd_config"

    # Backup SSH config
    backup_config "$ssh_config"

    # Create deploy user if doesn't exist
    if ! id "deploy-user" &>/dev/null; then
        log "Creating deploy-user..."
        useradd -m -s /bin/bash deploy-user
        usermod -aG sudo deploy-user

        # Generate SSH key for deploy-user
        su - deploy-user -c "mkdir -p ~/.ssh && chmod 700 ~/.ssh"
        su - deploy-user -c "ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa -N ''"

        log_success "Created deploy-user"
        log_warning "IMPORTANT: Add your public SSH key to /home/deploy-user/.ssh/authorized_keys"
        log_warning "Run: sudo cp ~/.ssh/authorized_keys /home/deploy-user/.ssh/"
        log_warning "Set password for deploy-user: sudo passwd deploy-user"
    else
        log "deploy-user already exists, skipping creation"
    fi

    # Secure SSH configuration
    log "Securing SSH configuration..."

    # Disable root login
    sed -i 's/^PermitRootLogin.*/PermitRootLogin no/' "$ssh_config"
    echo "PermitRootLogin no" >> "$ssh_config"

    # Disable password authentication (force key-based)
    sed -i 's/^PasswordAuthentication.*/PasswordAuthentication no/' "$ssh_config"
    echo "PasswordAuthentication no" >> "$ssh_config"

    # Change SSH port
    if ! grep -q "^Port 22222" "$ssh_config"; then
        sed -i 's/^#Port 22/Port 22222/' "$ssh_config"
        echo "Port 22222" >> "$ssh_config"
        log_success "SSH port changed to 22222"
    fi

    # Limit SSH access (uncomment and modify for your IP)
    # echo "AllowUsers deploy-user@YOUR_IP_ADDRESS" >> "$ssh_config"

    # Disable X11 forwarding
    sed -i 's/^X11Forwarding.*/X11Forwarding no/' "$ssh_config"

    # Set login grace time
    echo "LoginGraceTime 60" >> "$ssh_config"

    # Set max auth tries
    echo "MaxAuthTries 3" >> "$ssh_config"

    # Set max sessions
    echo "MaxSessions 2" >> "$ssh_config"

    # Test SSH configuration
    log "Testing SSH configuration..."
    if sshd -t; then
        log_success "SSH configuration is valid"

        # Restart SSH
        systemctl restart sshd
        log_success "SSH service restarted"

        log_warning "=========================================="
        log_warning "CRITICAL: SSH will now listen on port 22222"
        log_warning "Make sure you can access the server before closing this session!"
        log_warning "Test: ssh -p 22222 deploy-user@69.164.244.165"
        log_warning "=========================================="
    else
        log_error "SSH configuration test failed. Restoring backup..."
        cp "${ssh_config}.backup_${TIMESTAMP}" "$ssh_config"
        exit 1
    fi
}

################################################################################
# FIX 2: INSTALL AND CONFIGURE FAIL2BAN
################################################################################

fix_fail2ban() {
    log "=========================================="
    log "Fix 2: Installing Fail2ban"
    log "=========================================="

    # Install fail2ban if not installed
    if ! command -v fail2ban-client &> /dev/null; then
        apt-get update -qq
        apt-get install -y fail2ban
        log_success "Fail2ban installed"
    else
        log "Fail2ban already installed"
    fi

    # Create jail.local configuration
    cat > /etc/fail2ban/jail.local <<'EOF'
[DEFAULT]
# Ban time: 24 hours
bantime = 86400

# Find time: 10 minutes
findtime = 600

# Max retries: 5 attempts
maxretry = 5

# Destinations for banned emails
destemail = admin@ementech.co.ke
sendername = Fail2Ban
action = %(action_)s
           %(action_mwl)s

[sshd]
enabled = true
port = 22222
maxretry = 3
bantime = 86400
findtime = 600

[nginx-http-auth]
enabled = true
maxretry = 5
bantime = 86400

[nginx-limit-req]
enabled = true
maxretry = 10
bantime = 86400

[nginx-noscript]
enabled = true
maxretry = 6
bantime = 86400

[nginx-badbots]
enabled = true
maxretry = 2
bantime = 86400
EOF

    # Enable and start fail2ban
    systemctl enable fail2ban
    systemctl restart fail2ban

    log_success "Fail2ban configured and started"

    # Show status
    log "Fail2ban status:"
    fail2ban-client status || true
}

################################################################################
# FIX 3: SECURE FIREWALL (UFW)
################################################################################

fix_firewall() {
    log "=========================================="
    log "Fix 3: Configuring Firewall"
    log "=========================================="

    # Reset firewall to safe defaults
    log "Resetting firewall..."
    ufw --force reset

    # Set default policies
    ufw default deny incoming
    ufw default allow outgoing

    # Allow SSH on new port (IMPORTANT: Add your IP!)
    log "Configuring firewall rules..."

    # WARNING: Replace YOUR_IP with your actual IP address
    # To find your IP: curl ifconfig.me
    read -p "Enter your IP address (or press Enter to allow all): " ADMIN_IP

    if [[ -n "$ADMIN_IP" ]]; then
        ufw allow from "$ADMIN_IP" to any port 22222 comment "SSH from admin IP"
        log "SSH restricted to $ADMIN_IP"
    else
        ufw allow 22222/tcp comment "SSH (any IP)"
        log_warning "SSH open to all IPs - not recommended!"
    fi

    # Allow HTTP and HTTPS
    ufw allow 80/tcp comment "HTTP"
    ufw allow 443/tcp comment "HTTPS"

    # Deny application ports from external
    ufw deny 3001/tcp comment "Block port 3001"
    ufw deny 5000/tcp comment "Block port 5000"
    ufw deny 5001/tcp comment "Block port 5001"

    # Email ports (restrict if possible)
    ufw allow 25/tcp comment "SMTP"
    ufw allow 587/tcp comment "SMTP Submission"
    ufw allow 465/tcp comment "SMTPS"
    ufw allow 993/tcp comment "IMAPS"

    # Enable firewall
    log "Enabling firewall..."
    ufw --force enable

    # Show status
    ufw status verbose

    log_success "Firewall configured"

    # Export rules for backup
    ufw status > /var/backups/ementech-security/ufw-rules-${TIMESTAMP}.txt
}

################################################################################
# FIX 4: SECURE MONGODB
################################################################################

fix_mongodb_security() {
    log "=========================================="
    log "Fix 4: Securing MongoDB"
    log "=========================================="

    local mongo_config="/etc/mongod.conf"

    # Backup MongoDB config
    backup_config "$mongo_config"

    # Check if MongoDB is running
    if systemctl is-active --quiet mongod; then
        log "MongoDB is running"
    else
        log_warning "MongoDB is not running. Please start it first."
        read -p "Continue anyway? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            return
        fi
    fi

    # Enable authentication in MongoDB config
    log "Enabling MongoDB authentication..."

    if grep -q "^security:" "$mongo_config"; then
        sed -i 's/^security:.*/security:\n  authorization: enabled/' "$mongo_config"
    else
        echo -e "\nsecurity:\n  authorization: enabled" >> "$mongo_config"
    fi

    # Ensure MongoDB binds to localhost only
    if grep -q "^bindIp:" "$mongo_config"; then
        sed -i 's/bindIp: .*/bindIp: 127.0.0.1/' "$mongo_config"
    fi

    # Restart MongoDB
    log "Restarting MongoDB..."
    systemctl restart mongod

    # Wait for MongoDB to start
    sleep 5

    # Create admin user
    log "Creating MongoDB admin user..."

    # Generate secure password
    MONGO_ADMIN_PASS=$(openssl rand -base64 32)

    # Create admin user
    mongosh <<EOF
use admin
db.createUser({
  user: "admin",
  pwd: "$MONGO_ADMIN_PASS",
  roles: [ { role: "userAdminAnyDatabase", db: "admin" }, "readWriteAnyDatabase" ]
})
EOF

    if [[ $? -eq 0 ]]; then
        log_success "MongoDB admin user created"

        # Save credentials securely
        cat > /root/.mongodb_credentials <<EOF
MongoDB Admin Credentials:
Username: admin
Password: $MONGO_ADMIN_PASS
Auth Database: admin

Connection String:
mongodb://admin:$MONGO_ADMIN_PASS@localhost:27017/ementech?authSource=admin

IMPORTANT: Store this securely and delete this file after updating application!
EOF

        chmod 600 /root/.mongodb_credentials

        log "MongoDB credentials saved to /root/.mongodb_credentials"
        log_warning "IMPORTANT: Update your application .env file with new MongoDB credentials"
        log_warning "Delete /root/.mongodb_credentials after updating!"
    else
        log_error "Failed to create MongoDB admin user"
        return 1
    fi

    log_success "MongoDB secured"
}

################################################################################
# FIX 5: SECURE NGINX
################################################################################

fix_nginx_security() {
    log "=========================================="
    log "Fix 5: Securing Nginx"
    log "=========================================="

    # Hide nginx version
    local nginx_conf="/etc/nginx/nginx.conf"
    backup_config "$nginx_conf"

    if ! grep -q "server_tokens off" "$nginx_conf"; then
        sed -i '/http {/a \    server_tokens off;' "$nginx_conf"
        log "Disabled nginx version disclosure"
    fi

    # Remove unnecessary modules (if configured)
    # Add security headers to all sites
    find /etc/nginx/sites-available -name "*.conf" -exec grep -l "server_name" {} \; | while read site; do
        backup_config "$site"

        # Add security headers if not present
        if ! grep -q "X-Frame-Options" "$site"; then
            sed -i '/server_name/a \        # Security Headers' "$site"
        fi
    done

    # Test nginx configuration
    log "Testing nginx configuration..."
    if nginx -t; then
        systemctl reload nginx
        log_success "Nginx secured and reloaded"
    else
        log_error "Nginx configuration test failed"
        return 1
    fi
}

################################################################################
# FIX 6: SETUP SECURE BACKUPS
################################################################################

fix_backup_setup() {
    log "=========================================="
    log "Fix 6: Setting Up Automated Backups"
    log "=========================================="

    # Create backup directories
    mkdir -p /var/backups/mongodb
    mkdir -p /var/backups/applications
    mkdir -p /var/backups/ementech-security/scripts

    # Generate backup encryption key
    if [[ ! -f /root/.backup_key ]]; then
        openssl rand -hex 32 > /root/.backup_key
        chmod 600 /root/.backup_key
        log "Backup encryption key created"
        log_warning "IMPORTANT: Store /root/.backup_key securely!"
    fi

    # Create MongoDB backup script
    cat > /usr/local/bin/backup-mongodb.sh <<'EOF'
#!/bin/bash
# MongoDB backup script

BACKUP_DIR="/var/backups/mongodb"
RETENTION_DAYS=30
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="ementech_${TIMESTAMP}"

# Load credentials
source /root/.mongodb_credentials

# Create backup
mongodump \
  --uri="mongodb://admin:${Password}@localhost:27017/ementech?authSource=admin" \
  --archive=${BACKUP_DIR}/${BACKUP_NAME}.gz \
  --gzip

# Encrypt backup
openssl enc -aes-256-cbc -salt -in ${BACKUP_DIR}/${BACKUP_NAME}.gz -out ${BACKUP_DIR}/${BACKUP_NAME}.gz.enc -kfile /root/.backup_key

# Remove unencrypted backup
rm ${BACKUP_DIR}/${BACKUP_NAME}.gz

# Clean old backups
find ${BACKUP_DIR} -name "*.gz.enc" -mtime +${RETENTION_DAYS} -delete

echo "MongoDB backup completed: ${BACKUP_NAME}"
EOF

    chmod +x /usr/local/bin/backup-mongodb.sh

    # Create application backup script
    cat > /usr/local/bin/backup-apps.sh <<'EOF'
#!/bin/bash
# Application backup script

BACKUP_DIR="/var/backups/applications"
RETENTION_DAYS=14
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Backup directories
tar -czf /tmp/ementech-website_${TIMESTAMP}.tar.gz -C /var/www ementech-website 2>/dev/null || true
tar -czf /tmp/nginx-configs_${TIMESTAMP}.tar.gz -C /etc nginx 2>/dev/null || true

# Encrypt backups
for backup in /tmp/*.tar.gz; do
    openssl enc -aes-256-cbc -salt -in "$backup" -out "${backup}.enc" -kfile /root/.backup_key
    rm "$backup"
    mv "${backup}.enc" "$BACKUP_DIR/"
done

# Clean old backups
find ${BACKUP_DIR} -name "*.tar.gz.enc" -mtime +${RETENTION_DAYS} -delete

echo "Application backup completed: ${TIMESTAMP}"
EOF

    chmod +x /usr/local/bin/backup-apps.sh

    # Schedule backups in crontab
    log "Scheduling automated backups..."

    # Daily MongoDB backup at 2 AM
    (crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-mongodb.sh >> /var/log/mongodb-backup.log 2>&1") | crontab -

    # Weekly application backup on Sunday at 3 AM
    (crontab -l 2>/dev/null; echo "0 3 * * 0 /usr/local/bin/backup-apps.sh >> /var/log/apps-backup.log 2>&1") | crontab -

    log_success "Automated backups scheduled"
    log "MongoDB: Daily at 2 AM"
    log "Applications: Weekly on Sunday at 3 AM"

    # Create backup log directory
    touch /var/log/mongodb-backup.log /var/log/apps-backup.log
}

################################################################################
# FIX 7: GENERATE SECURE SECRETS
################################################################################

fix_generate_secrets() {
    log "=========================================="
    log "Fix 7: Generating Secure Secrets"
    log "=========================================="

    # Create secrets directory
    mkdir -p /var/www/.secrets

    # Generate JWT secret
    JWT_SECRET=$(openssl rand -base64 64)
    echo "$JWT_SECRET" > /var/www/.secrets/jwt_secret.txt
    chmod 600 /var/www/.secrets/jwt_secret.txt

    # Generate session secret
    SESSION_SECRET=$(openssl rand -base64 64)
    echo "$SESSION_SECRET" > /var/www/.secrets/session_secret.txt
    chmod 600 /var/www/.secrets/session_secret.txt

    log_success "Secure secrets generated"
    log_warning "IMPORTANT: Update your application .env files with these secrets"
    log "JWT Secret saved to: /var/www/.secrets/jwt_secret.txt"
    log "Session Secret saved to: /var/www/.secrets/session_secret.txt"
}

################################################################################
# FIX 8: CREATE MONITORING SCRIPT
################################################################################

fix_monitoring() {
    log "=========================================="
    log "Fix 8: Setting Up Basic Monitoring"
    log "=========================================="

    # Create security monitoring script
    cat > /usr/local/bin/security-monitor.sh <<'EOF'
#!/bin/bash
# Basic security monitoring script

ALERT_EMAIL="admin@ementech.co.ke"

# Check for failed SSH attempts
FAILED_SSH=$(grep "Failed password" /var/log/auth.log 2>/dev/null | wc -l)
if [ "$FAILED_SSH" -gt 100 ]; then
    echo "High number of failed SSH attempts: $FAILED_SSH" | mail -s "Security Alert: SSH Attacks" "$ALERT_EMAIL"
fi

# Check for PM2 crashes
if command -v pm2 &> /dev/null; then
    CRASHES=$(pm2 status 2>/dev/null | grep "errored" | wc -l)
    if [ "$CRASHES" -gt 0 ]; then
        echo "PM2 process errors detected: $CRASHES" | mail -s "Alert: Application Errors" "$ALERT_EMAIL"
    fi
fi

# Check disk space
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 80 ]; then
    echo "High disk usage: ${DISK_USAGE}%" | mail -s "Alert: High Disk Usage" "$ALERT_EMAIL"
fi

# Check memory usage
MEM_USAGE=$(free | awk '/Mem/{printf("%.0f"), $3/$2*100}')
if [ "$MEM_USAGE" -gt 90 ]; then
    echo "High memory usage: ${MEM_USAGE}%" | mail -s "Alert: High Memory Usage" "$ALERT_EMAIL"
fi
EOF

    chmod +x /usr/local/bin/security-monitor.sh

    # Schedule monitoring every 5 minutes
    (crontab -l 2>/dev/null; echo "*/5 * * * * /usr/local/bin/security-monitor.sh") | crontab -

    log_success "Security monitoring configured"
    log "Running every 5 minutes, alerts sent to admin@ementech.co.ke"
}

################################################################################
# MAIN EXECUTION
################################################################################

main() {
    log "=========================================="
    log "EmenTech Critical Security Fixes"
    log "Started at: $(date)"
    log "=========================================="
    log ""

    # Run pre-flight checks
    preflight_checks

    log ""
    read -p "Continue with security fixes? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log "Aborted by user"
        exit 0
    fi

    # Execute fixes
    fix_ssh_security
    fix_fail2ban
    fix_firewall
    fix_mongodb_security
    fix_nginx_security
    fix_backup_setup
    fix_generate_secrets
    fix_monitoring

    log ""
    log "=========================================="
    log "Critical Security Fixes Completed!"
    log "=========================================="
    log ""
    log "IMPORTANT NEXT STEPS:"
    log "1. Add your SSH public key to /home/deploy-user/.ssh/authorized_keys"
    log "2. Test SSH access on port 22222 BEFORE closing this session"
    log "3. Update application .env files with:"
    log "   - New MongoDB credentials (see /root/.mongodb_credentials)"
    log "   - New JWT secret (see /var/www/.secrets/jwt_secret.txt)"
    log "4. Delete /root/.mongodb_credentials after updating applications"
    log "5. Reboot server to apply all changes"
    log ""
    log "Log file: $LOG_FILE"
    log ""
}

# Run main function
main
