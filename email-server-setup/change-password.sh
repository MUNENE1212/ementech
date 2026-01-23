#!/bin/bash

################################################################################
# Change Email Password Script
# Usage: ./change-password.sh user@ementech.co.ke [new-password]
################################################################################

set -e

# Configuration
DOMAIN="ementech.co.ke"
DB_NAME="mailserver_db"
DB_USER="mailserver"
DB_PASS=$(grep "Database Password:" /root/.mail-db-credentials.txt | awk '{print $3}')

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if email is provided
if [[ -z "$1" ]]; then
    echo "Usage: $0 user@ementech.co.ke [new-password]"
    echo "Example: $0 john@ementech.co.ke newsecurepassword"
    exit 1
fi

EMAIL=$1

# Validate domain
if [[ $EMAIL != *@$DOMAIN ]]; then
    echo -e "${RED}Error: Email must be @$DOMAIN${NC}"
    exit 1
fi

# Generate password if not provided
if [[ -z "$2" ]]; then
    NEW_PASSWORD=$(openssl rand -base64 16)
    echo -e "${YELLOW}Generated password: $NEW_PASSWORD${NC}"
else
    NEW_PASSWORD=$2
fi

# Generate password hash
PASSWORD_HASH=$(doveadm pw -s SHA512-CRYPT -p "$NEW_PASSWORD")

# Update database
sudo -u postgres psql $DB_NAME <<EOF
UPDATE users SET password = '$PASSWORD_HASH' WHERE email = '$EMAIL';
EOF

# Update credentials file
sed -i "/^$EMAIL:/d" /root/.email-credentials.txt
echo "$EMAIL:$NEW_PASSWORD" >> /root/.email-credentials.txt

echo -e "${GREEN}Password changed successfully!${NC}"
echo "Email: $EMAIL"
echo "New Password: $NEW_PASSWORD"
