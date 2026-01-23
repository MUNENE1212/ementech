#!/bin/bash

################################################################################
# Add Email Account Script
# Usage: ./add-user.sh user@ementech.co.ke [password]
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
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if email is provided
if [[ -z "$1" ]]; then
    echo "Usage: $0 user@ementech.co.ke [password]"
    echo "Example: $0 john@ementech.co.ke mysecurepassword"
    exit 1
fi

EMAIL=$1
USER_ID=$(echo $EMAIL | cut -d@ -f1)

# Validate domain
if [[ $EMAIL != *@$DOMAIN ]]; then
    echo -e "${RED}Error: Email must be @$DOMAIN${NC}"
    exit 1
fi

# Generate password if not provided
if [[ -z "$2" ]]; then
    PASSWORD=$(openssl rand -base64 16)
    echo -e "${YELLOW}Generated password: $PASSWORD${NC}"
else
    PASSWORD=$2
fi

# Generate password hash
PASSWORD_HASH=$(doveadm pw -s SHA512-CRYPT -p "$PASSWORD")

# Insert into database
sudo -u postgres psql $DB_NAME <<EOF
INSERT INTO users (user_id, domain_id, password, email)
SELECT '$USER_ID', id, '$PASSWORD_HASH', '$EMAIL'
FROM domains WHERE domain = '$DOMAIN';
EOF

# Create mail directory
mkdir -p $STORAGE_DIR/$DOMAIN/$USER_ID
chown -R vmail:vmail $STORAGE_DIR/$DOMAIN/$USER_ID
chmod -R 770 $STORAGE_DIR/$DOMAIN/$USER_ID

# Save credentials
echo "$EMAIL:$PASSWORD" >> /root/.email-credentials.txt

echo -e "${GREEN}Email account created successfully!${NC}"
echo "Email: $EMAIL"
echo "Password: $PASSWORD"
