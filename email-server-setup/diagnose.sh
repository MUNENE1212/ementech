#!/bin/bash

################################################################################
# Email Server Diagnostic Script
# Usage: ./diagnose.sh
################################################################################

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}         EMENTECH EMAIL SERVER DIAGNOSTIC TOOL${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

################################################################################
# 1. Service Status
################################################################################

echo -e "${BLUE}[1] Service Status${NC}"
echo "────────────────────────────────────────────────────────────────────────"

services=("postfix" "dovecot" "opendkim" "rspamd" "nginx" "postgresql")

for service in "${services[@]}"; do
    if systemctl is-active --quiet $service; then
        echo -e "  ${GREEN}✓${NC} $service is running"
    else
        echo -e "  ${RED}✗${NC} $service is NOT running"
    fi
done

echo ""

################################################################################
# 2. Port Listening
################################################################################

echo -e "${BLUE}[2] Port Listening Status${NC}"
echo "────────────────────────────────────────────────────────────────────────"

ports=(
    "25:SMTP"
    "587:SMTP Submission"
    "465:SMTPS"
    "143:IMAP"
    "993:IMAPS"
    "110:POP3"
    "995:POP3S"
    "80:HTTP"
    "443:HTTPS"
)

for port_info in "${ports[@]}"; do
    port=$(echo $port_info | cut -d: -f1)
    name=$(echo $port_info | cut -d: -f2)

    if ss -tlnp 2>/dev/null | grep -q ":$port "; then
        echo -e "  ${GREEN}✓${NC} Port $port ($name) is listening"
    else
        echo -e "  ${RED}✗${NC} Port $port ($name) is NOT listening"
    fi
done

echo ""

################################################################################
# 3. Disk Space
################################################################################

echo -e "${BLUE}[3] Disk Space${NC}"
echo "────────────────────────────────────────────────────────────────────────"

disk_usage=$(df -h / | awk 'NR==2{print $5 " used, " $4 " available"}')
mail_size=$(du -sh /var/mail/vhosts 2>/dev/null | awk '{print $1}')
db_size=$(sudo -u postgres psql -t -c "SELECT pg_size_pretty(pg_database_size('mailserver_db'));" 2>/dev/null | xargs)

echo "  Root partition: $disk_usage"
echo "  Mail storage: ${mail_size:-N/A}"
echo "  Database size: ${db_size:-N/A}"

echo ""

################################################################################
# 4. Memory Usage
################################################################################

echo -e "${BLUE}[4] Memory Usage${NC}"
echo "────────────────────────────────────────────────────────────────────────"

free -h | grep -E "Mem:|Swap:" | awk '{
    if ($1 == "Mem:") {
        used_percent = int(($3/$2)*100)
        if (used_percent < 70) color = "\033[0;32m"
        else if (used_percent < 90) color = "\033[1;33m"
        else color = "\033[0;31m"
        printf "  Memory: %s/%s (%s%s%%%s)\n", $3, $2, color, used_percent, "\033[0m"
    } else {
        printf "  Swap: %s/%s\n", $3, $2
    }
}'

echo ""

################################################################################
# 5. Mail Queue
################################################################################

echo -e "${BLUE}[5] Mail Queue${NC}"
echo "────────────────────────────────────────────────────────────────────────"

queue_count=$(mailq | grep -c "^[A-Z0-9]")
deferred_count=$(mailq | grep -c "^[A-Z0-9].*\*" || true)

echo "  Total messages in queue: $queue_count"
echo "  Deferred messages: $deferred_count"

if [[ $queue_count -gt 0 ]]; then
    echo ""
    echo "  ${YELLOW}Queue contents:${NC}"
    mailq | head -10
fi

echo ""

################################################################################
# 6. Recent Errors
################################################################################

echo -e "${BLUE}[6] Recent Errors (Last 10)${NC}"
echo "────────────────────────────────────────────────────────────────────────"

if [[ -f /var/log/mail.log ]]; then
    error_count=$(grep -i "error\|warning\|fatal" /var/log/mail.log | tail -10 | wc -l)
    if [[ $error_count -gt 0 ]]; then
        grep -i "error\|warning\|fatal" /var/log/mail.log | tail -10 | while read line; do
            echo "  ${RED}✗${NC} $line"
        done
    else
        echo "  ${GREEN}No recent errors found${NC}"
    fi
else
    echo "  ${YELLOW}Mail log not found${NC}"
fi

echo ""

################################################################################
# 7. SSL Certificate
################################################################################

echo -e "${BLUE}[7] SSL Certificate Status${NC}"
echo "────────────────────────────────────────────────────────────────────────"

cert_file="/etc/letsencrypt/live/mail.ementech.co.ke/fullchain.pem"

if [[ -f $cert_file ]]; then
    expiry_date=$(openssl x509 -in $cert_file -noout -enddate | cut -d= -f2)
    expiry_epoch=$(date -d "$expiry_date" +%s)
    current_epoch=$(date +%s)
    days_left=$(( ($expiry_epoch - $current_epoch) / 86400 ))

    if [[ $days_left -gt 30 ]]; then
        echo -e "  ${GREEN}✓${NC} Certificate is valid"
        echo "  Expires in: $days_left days ($expiry_date)"
    elif [[ $days_left -gt 0 ]]; then
        echo -e "  ${YELLOW}⚠${NC} Certificate expiring soon"
        echo "  Expires in: $days_left days ($expiry_date)"
    else
        echo -e "  ${RED}✗${NC} Certificate has expired!"
    fi
else
    echo -e "  ${RED}✗${NC} Certificate not found"
fi

echo ""

################################################################################
# 8. DNS Resolution
################################################################################

echo -e "${BLUE}[8] DNS Resolution${NC}"
echo "────────────────────────────────────────────────────────────────────────"

# MX record
mx_record=$(dig +short MX ementech.co.ke 2>/dev/null)
if [[ -n "$mx_record" ]]; then
    echo -e "  ${GREEN}✓${NC} MX record: $mx_record"
else
    echo -e "  ${RED}✗${NC} MX record not found"
fi

# SPF record
spf_record=$(dig +short TXT ementech.co.ke 2>/dev/null | grep "v=spf1")
if [[ -n "$spf_record" ]]; then
    echo -e "  ${GREEN}✓${NC} SPF record: $spf_record"
else
    echo -e "  ${RED}✗${NC} SPF record not found"
fi

# DKIM record
dkim_record=$(dig +short TXT default._domainkey.ementech.co.ke 2>/dev/null)
if [[ -n "$dkim_record" ]]; then
    echo -e "  ${GREEN}✓${NC} DKIM record: $dkim_record"
else
    echo -e "  ${YELLOW}⚠${NC} DKIM record not found (may not be configured yet)"
fi

# DMARC record
dmarc_record=$(dig +short TXT _dmarc.ementech.co.ke 2>/dev/null)
if [[ -n "$dmarc_record" ]]; then
    echo -e "  ${GREEN}✓${NC} DMARC record: $dmarc_record"
else
    echo -e "  ${RED}✗${NC} DMARC record not found"
fi

echo ""

################################################################################
# 9. Database Connection
################################################################################

echo -e "${BLUE}[9] Database Connection${NC}"
echo "────────────────────────────────────────────────────────────────────────"

if sudo -u postgres psql mailserver_db -c "SELECT 1" &>/dev/null; then
    echo -e "  ${GREEN}✓${NC} Database connection successful"

    # Count users
    user_count=$(sudo -u postgres psql -t mailserver_db -c "SELECT COUNT(*) FROM users;" 2>/dev/null | xargs)
    echo "  Email accounts: $user_count"

    # Count aliases
    alias_count=$(sudo -u postgres psql -t mailserver_db -c "SELECT COUNT(*) FROM aliases;" 2>/dev/null | xargs)
    echo "  Email aliases: $alias_count"
else
    echo -e "  ${RED}✗${NC} Database connection failed"
fi

echo ""

################################################################################
# 10. Fail2Ban Status
################################################################################

echo -e "${BLUE}[10] Fail2Ban Status${NC}"
echo "────────────────────────────────────────────────────────────────────────"

if systemctl is-active --quiet fail2ban; then
    echo -e "  ${GREEN}✓${NC} Fail2Ban is running"

    banned_count=$(fail2ban-client status postfix 2>/dev/null | grep "Currently banned:" | awk '{print $3}')
    if [[ -n "$banned_count" ]]; then
        echo "  Currently banned IPs: $banned_count"
    fi
else
    echo -e "  ${YELLOW}⚠${NC} Fail2Ban is not running"
fi

echo ""

################################################################################
# Summary
################################################################################

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}                    DIAGNOSTIC COMPLETE${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo "For more details, check the logs:"
echo "  tail -f /var/log/mail.log          (Postfix)"
echo "  tail -f /var/log/dovecot.log       (Dovecot)"
echo "  tail -f /var/log/nginx/error.log   (Nginx)"
echo ""
echo "Useful commands:"
echo "  mailq                               (View mail queue)"
echo "  postfix flush                       (Flush mail queue)"
echo "  doveadm auth test user@ementech.co.ke  (Test authentication)"
echo ""
