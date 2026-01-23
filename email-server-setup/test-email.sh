#!/bin/bash

################################################################################
# Test Email Sending Script
# Usage: ./test-email.sh recipient@example.com
################################################################################

set -e

# Configuration
SENDER="admin@ementech.co.ke"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if recipient is provided
if [[ -z "$1" ]]; then
    echo "Usage: $0 recipient@example.com"
    echo "Example: $0 test@gmail.com"
    exit 1
fi

RECIPIENT=$1

echo -e "${BLUE}=== Testing Email Sending ===${NC}\n"
echo "From: $SENDER"
echo "To: $RECIPIENT"
echo ""

# Send test email
echo -e "${YELLOW}Sending test email...${NC}"

cat <<EOF | /usr/sbin/sendmail -i -t
From: $SENDER
To: $RECIPIENT
Subject: Test Email from Ementech Mail Server
Date: $(date -R)
MIME-Version: 1.0
Content-Type: text/plain; charset=UTF-8

This is a test email from the Ementech mail server.

If you receive this email, your mail server is working correctly!

Server Information:
- Domain: ementech.co.ke
- IP: 69.164.244.165
- Sent: $(date)

Please check the following headers:
- Authentication-Results
- DKIM-Signature
- Received-SPF

--
Ementech Mail Server
https://ementech.co.ke
EOF

if [[ $? -eq 0 ]]; then
    echo -e "${GREEN}Test email sent successfully!${NC}\n"
    echo "Please check $RECIPIENT for the email."
    echo "Also check spam/junk folder."
    echo ""
    echo "Monitor logs with:"
    echo "  tail -f /var/log/mail.log"
else
    echo -e "${RED}Failed to send test email${NC}\n"
    echo "Check logs for errors:"
    echo "  tail -f /var/log/mail.log"
    exit 1
fi
