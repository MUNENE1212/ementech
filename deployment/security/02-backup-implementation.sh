#!/bin/bash

################################################################################
# Comprehensive Backup Implementation
# Purpose: Setup complete backup and disaster recovery system
# Usage: sudo bash 02-backup-implementation.sh
################################################################################

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="/var/log/ementech-backup-setup.log"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

################################################################################
# MONGODB BACKUP SYSTEM
################################################################################

setup_mongodb_backups() {
    log "Setting up MongoDB backup system..."

    mkdir -p /var/backups/mongodb/{hourly,daily,weekly}

    # Create hourly backup script
    cat > /usr/local/bin/backup-mongodb-hourly.sh <<'EOF'
#!/bin/bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/mongodb/hourly"
RETENTION_HOURS=48

source /root/.mongodb_credentials 2>/dev/null || true

mongodump \
  --uri="mongodb://admin:PASSWORD@localhost:27017/ementech?authSource=admin" \
  --archive=${BACKUP_DIR}/ementech_${TIMESTAMP}.gz \
  --gzip

# Keep only last 48 hours
find ${BACKUP_DIR} -name "*.gz" -mtime +2 -delete

echo "Hourly MongoDB backup completed: ${TIMESTAMP}"
EOF

    # Create daily backup script
    cat > /usr/local/bin/backup-mongodb-daily.sh <<'EOF'
#!/bin/bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/mongodb/daily"
RETENTION_DAYS=30

source /root/.mongodb_credentials 2>/dev/null || true

mongodump \
  --uri="mongodb://admin:PASSWORD@localhost:27017/ementech?authSource=admin" \
  --archive=${BACKUP_DIR}/ementech_${TIMESTAMP}.gz.enc \
  --gzip

# Encrypt
openssl enc -aes-256-cbc -salt -in ${BACKUP_DIR}/ementech_${TIMESTAMP}.gz -out ${BACKUP_DIR}/ementech_${TIMESTAMP}.gz.enc -kfile /root/.backup_key
rm ${BACKUP_DIR}/ementech_${TIMESTAMP}.gz

# Keep last 30 days
find ${BACKUP_DIR} -name "*.gz.enc" -mtime +30 -delete

echo "Daily MongoDB backup completed: ${TIMESTAMP}"
EOF

    # Create weekly full backup script
    cat > /usr/local/bin/backup-mongodb-weekly.sh <<'EOF'
#!/bin/bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/mongodb/weekly"
RETENTION_WEEKS=12

source /root/.mongodb_credentials 2>/dev/null || true

# Full backup with all databases
mongodump \
  --uri="mongodb://admin:PASSWORD@localhost:27017?authSource=admin" \
  --out=${BACKUP_DIR}/ementech_full_${TIMESTAMP} \
  --gzip

# Create archive
tar -czf /tmp/mongodb_weekly_${TIMESTAMP}.tar.gz -C ${BACKUP_DIR} ementech_full_${TIMESTAMP}

# Encrypt
openssl enc -aes-256-cbc -salt -in /tmp/mongodb_weekly_${TIMESTAMP}.tar.gz -out ${BACKUP_DIR}/mongodb_weekly_${TIMESTAMP}.tar.gz.enc -kfile /root/.backup_key
rm /tmp/mongodb_weekly_${TIMESTAMP}.tar.gz
rm -rf ${BACKUP_DIR}/ementech_full_${TIMESTAMP}

# Keep last 12 weeks
find ${BACKUP_DIR} -name "*.tar.gz.enc" -mtime +84 -delete

echo "Weekly MongoDB backup completed: ${TIMESTAMP}"
EOF

    chmod +x /usr/local/bin/backup-mongodb-{hourly,daily,weekly}.sh

    # Schedule backups
    (crontab -l 2>/dev/null; echo "0 * * * * /usr/local/bin/backup-mongodb-hourly.sh >> /var/log/mongodb-backup.log 2>&1") | crontab -
    (crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-mongodb-daily.sh >> /var/log/mongodb-backup.log 2>&1") | crontab -
    (crontab -l 2>/dev/null; echo "0 3 * * 0 /usr/local/bin/backup-mongodb-weekly.sh >> /var/log/mongodb-backup.log 2>&1") | crontab -

    log_success "MongoDB backup system configured"
}

################################################################################
# APPLICATION BACKUP SYSTEM
################################################################################

setup_application_backups() {
    log "Setting up application backup system..."

    mkdir -p /var/backups/applications/{daily,weekly}

    # Daily application backup
    cat > /usr/local/bin/backup-apps-daily.sh <<'EOF'
#!/bin/bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/applications/daily"
RETENTION_DAYS=14

# Backup Ementech website
tar -czf /tmp/ementech-website_${TIMESTAMP}.tar.gz -C /var/www ementech-website 2>/dev/null || true

# Backup backend
tar -czf /tmp/ementech-backend_${TIMESTAMP}.tar.gz -C /var/www/ementech-website backend 2>/dev/null || true

# Backup nginx configs
tar -czf /tmp/nginx-configs_${TIMESTAMP}.tar.gz -C /etc nginx 2>/dev/null || true

# Backup PM2 configs
tar -czf /tmp/pm2-configs_${TIMESTAMP}.tar.gz /var/www/.pm2 2>/dev/null || true

# Encrypt and move backups
for backup in /tmp/*.tar.gz; do
    if [[ -f "$backup" ]]; then
        openssl enc -aes-256-cbc -salt -in "$backup" -out "${backup}.enc" -kfile /root/.backup_key
        rm "$backup"
        mv "${backup}.enc" "$BACKUP_DIR/"
    fi
done

# Keep last 14 days
find ${BACKUP_DIR} -name "*.tar.gz.enc" -mtime +14 -delete

echo "Daily application backup completed: ${TIMESTAMP}"
EOF

    chmod +x /usr/local/bin/backup-apps-daily.sh

    # Schedule
    (crontab -l 2>/dev/null; echo "0 1 * * * /usr/local/bin/backup-apps-daily.sh >> /var/log/apps-backup.log 2>&1") | crontab -

    log_success "Application backup system configured"
}

################################################################################
# BACKUP VERIFICATION
################################################################################

setup_backup_verification() {
    log "Setting up backup verification..."

    cat > /usr/local/bin/verify-backups.sh <<'EOF'
#!/bin/bash
# Backup verification script

VERIFY_DATE=$(date +%Y%m%d)
VERIFY_LOG="/var/log/backup-verification-${VERIFY_DATE}.log"
ALERT_EMAIL="admin@ementech.co.ke"

echo "Backup Verification - ${VERIFY_DATE}" > ${VERIFY_LOG}
echo "========================================" >> ${VERIFY_LOG}

# Verify MongoDB backups
MONGO_HOURLY=$(find /var/backups/mongodb/hourly -name "*.gz" -mtime -1 | wc -l)
MONGO_DAILY=$(find /var/backups/mongodb/daily -name "*.gz.enc" -mtime -2 | wc -l)

echo "MongoDB Hourly Backups (last 24h): ${MONGO_HOURLY}" >> ${VERIFY_LOG}
echo "MongoDB Daily Backups (last 48h): ${MONGO_DAILY}" >> ${VERIFY_LOG}

# Verify application backups
APP_DAILY=$(find /var/backups/applications/daily -name "*.tar.gz.enc" -mtime -2 | wc -l)
echo "Application Daily Backups (last 48h): ${APP_DAILY}" >> ${VERIFY_LOG}

# Check for failures
if [[ $MONGO_DAILY -lt 1 ]] || [[ $APP_DAILY -lt 1 ]]; then
    echo "WARNING: Some backups are missing!" >> ${VERIFY_LOG}
    cat ${VERIFY_LOG} | mail -s "ALERT: Backup Verification Failed" ${ALERT_EMAIL}
else
    echo "All backups verified successfully" >> ${VERIFY_LOG}
fi

# Send email report
cat ${VERIFY_LOG} | mail -s "Daily Backup Verification Report" ${ALERT_EMAIL}
EOF

    chmod +x /usr/local/bin/verify-backups.sh

    # Schedule daily verification at 6 AM
    (crontab -l 2>/dev/null; echo "0 6 * * * /usr/local/bin/verify-backups.sh") | crontab -

    log_success "Backup verification configured"
}

################################################################################
# BACKUP RESTORATION TESTS
################################################################################

setup_restoration_tests() {
    log "Creating restoration test procedures..."

    cat > /usr/local/bin/test-backup-restoration.sh <<'EOF'
#!/bin/bash
# Monthly backup restoration test

TEST_DATE=$(date +%Y%m%d)
TEST_LOG="/var/log/restoration-test-${TEST_DATE}.log"

echo "Restoration Test - ${TEST_DATE}" > ${TEST_LOG}

# Test MongoDB restoration
echo "Testing MongoDB restoration..." >> ${TEST_LOG}
LATEST_BACKUP=$(ls -t /var/backups/mongodb/daily/*.gz.enc 2>/dev/null | head -1)

if [[ -n "$LATEST_BACKUP" ]]; then
    # Decrypt to temp location
    mkdir -p /tmp/restore_test
    openssl enc -aes-256-cbc -d -in "$LATEST_BACKUP" -out /tmp/restore_test/mongodb.gz -kfile /root/.backup_key

    # Test restore to test database
    mongorestore \
      --uri="mongodb://admin:PASSWORD@localhost:27017/ementech_test?authSource=admin" \
      --drop \
      --gzip \
      --archive=/tmp/restore_test/mongodb.gz \
      >> ${TEST_LOG} 2>&1

    if [[ $? -eq 0 ]]; then
        echo "MongoDB restoration test: SUCCESS" >> ${TEST_LOG}
    else
        echo "MongoDB restoration test: FAILED" >> ${TEST_LOG}
    fi

    # Cleanup
    rm -rf /tmp/restore_test
    mongosh --eval "db.getSiblingDB('ementech_test').dropDatabase()" > /dev/null 2>&1
else
    echo "No MongoDB backup found for testing" >> ${TEST_LOG}
fi

# Send report
cat ${TEST_LOG} | mail -s "Backup Restoration Test Report" admin@ementech.co.ke
EOF

    chmod +x /usr/local/bin/test-backup-restoration.sh

    # Schedule for first day of every month at 4 AM
    (crontab -l 2>/dev/null; echo "0 4 1 * * /usr/local/bin/test-backup-restoration.sh") | crontab -

    log_success "Restoration testing configured"
}

################################################################################
# REMOTE BACKUP SYNC (Optional)
################################################################################

setup_remote_sync() {
    log "Setting up remote backup sync..."

    read -p "Do you want to configure remote backup sync? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log "Remote backup sync skipped"
        return
    fi

    # Create rsync script for remote backup server
    cat > /usr/local/bin/sync-remote-backups.sh <<'EOF'
#!/bin/bash
# Sync backups to remote server

REMOTE_USER="backup-user"
REMOTE_HOST="backup-server.example.com"
REMOTE_DIR="/backups/ementech"

# Sync MongoDB backups
rsync -avz --delete -e "ssh -i /root/.ssh/backup_key" \
  /var/backups/mongodb/ \
  ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/mongodb/

# Sync application backups
rsync -avz --delete -e "ssh -i /root/.ssh/backup_key" \
  /var/backups/applications/ \
  ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/applications/

echo "Remote backup sync completed: $(date)" >> /var/log/remote-backup-sync.log
EOF

    chmod +x /usr/local/bin/sync-remote-backups.sh

    # Schedule sync every 6 hours
    (crontab -l 2>/dev/null; echo "0 */6 * * * /usr/local/bin/sync-remote-backups.sh") | crontab -

    log_success "Remote backup sync configured"
}

################################################################################
# MAIN EXECUTION
################################################################################

main() {
    log "=========================================="
    log "EmenTech Backup System Setup"
    log "Started at: $(date)"
    log "=========================================="
    log ""

    setup_mongodb_backups
    setup_application_backups
    setup_backup_verification
    setup_restoration_tests
    setup_remote_sync

    log ""
    log "=========================================="
    log "Backup System Setup Complete!"
    log "=========================================="
    log ""
    log "Backup Schedule:"
    log "  MongoDB Hourly: Every hour at :00"
    log "  MongoDB Daily: 2:00 AM daily"
    log "  MongoDB Weekly: 3:00 AM Sunday"
    log "  Applications Daily: 1:00 AM daily"
    log "  Verification: 6:00 AM daily"
    log "  Restoration Test: 4:00 AM, 1st of month"
    log "  Remote Sync: Every 6 hours"
    log ""
    log "Log files:"
    log "  - /var/log/mongodb-backup.log"
    log "  - /var/log/apps-backup.log"
    log "  - /var/log/remote-backup-sync.log"
    log ""
}

main
