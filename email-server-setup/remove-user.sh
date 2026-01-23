#!/bin/bash

################################################################################
# Remove Email Account Script
# Usage: ./remove-user.sh user@ementech.co.ke
################################################################################

set -e

# Configuration
DOMAIN="ementech.co.ke"
DB_NAME="mailserver_db"
DB_USER="mailserver"
DB_PASS=$(grep "Database Password:" /root/.mail-db-credentials.txt | awk '{print $3}')
STORAGE_DIR="/var/mail/vhosts"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Check if email is provided
if [[ -z "$1" ]]; then
    echo "Usage: $0 user@ementech.co.ke"
    echo "Example: $0 john@ementech.co.ke"
    exit 1
fi

EMAIL=$1
USER_ID=$(echo $EMAIL | cut -d@ -f1)

# Validate domain
if [[ $EMAIL != *@$DOMAIN ]]; then
    echo -e "${RED}Error: Email must be @$DOMAIN${NC}"
    exit 1
fi

# Confirm deletion
read -p "Are you sure you want to delete $EMAIL and all their emails? (yes/no): " confirm
if [[ $confirm != "yes" ]]; then
    echo "Aborted."
    exit 0
fi

# Remove from database
sudo -u postgres psql $DB_NAME <<EOF
DELETE FROM users WHERE email = '$EMAIL';
EOF

# Archive mail directory (don't delete immediately)
BACKUP_DIR="/backup/deleted-mail"
mkdir -p $BACKUP_DIR
mv $STORAGE_DIR/$DOMAIN/$USER_ID $BACKUP_DIR/$USER_ID-$(date +%Y%m%d)

echo -e "${GREEN}Email account removed successfully!${NC}"
echo "Email data archived to: $BACKUP_DIR/$USER_ID-$(date +%Y%m%d)"
