#!/bin/bash

################################################################################
# Check Mail Queue Status Script
################################################################################

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=== Mail Queue Status ===${NC}\n"

# Check queue
QUEUE_SIZE=$(mailq | grep -c "^[A-Z0-9]")
QUEUE_OUTPUT=$(mailq)

echo -e "${YELLOW}Queue Size:${NC} $QUEUE_SIZE messages\n"

if [[ $QUEUE_SIZE -gt 0 ]]; then
    echo -e "${YELLOW}Queue Contents:${NC}"
    echo "$QUEUE_OUTPUT"
    echo ""
fi

# Check recent mail activity
echo -e "${BLUE}=== Recent Mail Activity (Last 20 Lines) ===${NC}\n"
tail -20 /var/log/mail.log | grep -E "postfix|smtpd|qmgr"

echo ""
echo -e "${BLUE}=== Queue Statistics ===${NC}\n"
echo "Active: $(mailq | grep -c "^\*")"
echo "Deferred: $(mailq | grep -c "^[A-Z0-9]" | xargs)"
echo "Bounce: $(mailq | grep -c "bounce")"

echo ""
echo -e "${BLUE}=== Connection Status ===${NC}\n"
ss -tn | grep -E ':25 |:587 |:465 ' | wc -l | xargs echo "Active SMTP connections:"
ss -tn | grep -E ':143 |:993 ' | wc -l | xargs echo "Active IMAP connections:"
