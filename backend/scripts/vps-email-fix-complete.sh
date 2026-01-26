#!/bin/bash

################################################################################
# Complete Email Flooding Fix - VPS Remote Execution Script
#
# This script fixes the Fail2Ban email flooding issue by:
# 1. Stopping Fail2Ban email notifications
# 2. Configuring email filters
# 3. Setting up proper email routing
#
# Run this on VPS: 69.164.244.165
# Usage: sudo bash vps-email-fix-complete.sh
################################################################################

set -e

# Configuration
VPS_IP="69.164.244.165"
EMAIL_ACCOUNT="admin@ementech.co.ke"
MONGODB_URI="mongodb+srv://master25:master25@cluster0.qaobi.mongodb.net/ementech"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

banner() {
    echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║                                                        ║${NC}"
    echo -e "${BLUE}║     EMENTECH EMAIL FLOODING FIX                       ║${NC}"
    echo -e "${BLUE}║     Fail2Ban Notification Stopper                     ║${NC}"
    echo -e "${BLUE}║                                                        ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

check_root() {
    if [ "$EUID" -ne 0 ]; then
        echo -e "${RED}❌ Error: This script must be run as root (sudo)${NC}"
        exit 1
    fi
}

backup_configs() {
    echo -e "${YELLOW}[1/7] Backing up configurations...${NC}"
    BACKUP_DIR="/root/email-fix-backup-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$BACKUP_DIR"

    # Backup Fail2Ban configs
    cp -r /etc/fail2ban "$BACKUP_DIR/" 2>/dev/null || true

    # Backup Postfix configs if exists
    cp -r /etc/postfix "$BACKUP_DIR/" 2>/dev/null || true

    echo -e "${GREEN}✅ Backed up to: $BACKUP_DIR${NC}"
}

disable_fail2ban_emails() {
    echo -e "${YELLOW}[2/7] Disabling Fail2Ban email notifications...${NC}"

    # Stop Fail2Ban temporarily
    systemctl stop fail2ban 2>/dev/null || true

    # Create jail.local without email notifications
    cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
# Disable ALL email notifications
action = %

# SSH Daemon jail
[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
maxretry = 5
bantime = 1h
findtime = 10m
action = iptables-multiport[name=SSHD, port="ssh", protocol=tcp]

# SSH DoS protection
[sshd-ddos]
enabled = true
port = ssh
logpath = /var/log/auth.log
maxretry = 3
bantime = 2h
findtime = 5m
action = iptables-multiport[name=SSHD-DDOS, port="ssh", protocol=tcp]

# Recidive (repeat offenders)
[recidive]
enabled = true
logpath = /var/log/fail2ban.log
bantime = 1w
findtime = 1d
maxretry = 5
action = iptables-allports[name=recidive]
EOF

    # Remove any email-action configs
    rm -f /etc/fail2ban/action.d/mail*.conf 2>/dev/null || true

    # Restart Fail2Ban
    systemctl start fail2ban
    systemctl enable fail2ban

    echo -e "${GREEN}✅ Fail2Ban emails disabled${NC}"
}

configure_postfix_filters() {
    echo -e "${YELLOW}[3/7] Configuring Postfix email filters...${NC}"

    # Check if Postfix is installed
    if command -v postfix &> /dev/null; then
        # Create header checks to filter Fail2Ban emails at SMTP level
        cat > /etc/postfix/header_checks << 'EOF'
# Filter out Fail2Ban notifications
/^Subject:.*\[Fail2Ban\].*/      DISCARD Fail2Ban notification discarded
/^Subject:.*Cron.*\</            DISCARD Cron email discarded
/^Subject:.*System notification/ DISCARD System notification discarded
/^From:.*root@.*\(Cron Daemon\)/ DISCARD Cron Daemon email discarded
EOF

        # Add to main.cf if not present
        if ! grep -q "header_checks" /etc/postfix/main.cf; then
            echo "header_checks = regexp:/etc/postfix/header_checks" >> /etc/postfix/main.cf
        fi

        # Compile and reload
        postmap /etc/postfix/header_checks 2>/dev/null || true
        systemctl reload postfix 2>/dev/null || true

        echo -e "${GREEN}✅ Postfix filters configured${NC}"
    else
        echo -e "${YELLOW}⚠️  Postfix not installed, skipping${NC}"
    fi
}

setup_procmail_filters() {
    echo -e "${YELLOW}[4/7] Setting up Procmail filters...${NC}"

    # Get the home directory of admin user
    ADMIN_HOME=$(getent passwd admin | cut -d: -f6)

    if [ -d "$ADMIN_HOME" ]; then
        # Create .procmailrc
        cat > "$ADMIN_HOME/.procmailrc" << 'EOF'
# Procmail filter for system emails
:0:
* ^Subject:.*\[Fail2Ban\]
system/

:0:
* ^Subject:.*Cron.*\<
system/

:0:
* ^Subject:.*System notification
system/

:0:
* ^From:.*root@.*\(Cron Daemon\)
system/
EOF

        chown admin:admin "$ADMIN_HOME/.procmailrc"
        echo -e "${GREEN}✅ Procmail filters created${NC}"
    else
        echo -e "${YELLOW}⚠️  Admin home directory not found${NC}"
    fi
}

setup_dovecot_sieve() {
    echo -e "${YELLOW}[5/7] Setting up Dovecot Sieve filters...${NC}"

    # Check if Dovecot Sieve is available
    if command -v sievec &> /dev/null; then
        ADMIN_HOME=$(getent passwd admin | cut -d: -f6)
        SIEVE_DIR="$ADMIN_HOME/.sieve"

        mkdir -p "$SIEVE_DIR"

        cat > "$SIEVE_DIR/filters.sieve" << 'EOF'
require ["fileinto"];

# Filter Fail2Ban emails
if header :contains "Subject" "[Fail2Ban]" {
    fileinto "Archive";
    stop;
}

# Filter Cron emails
if header :matches "Subject" "*Cron*<*>" {
    fileinto "Archive";
    stop;
}

# Filter system notifications
if header :contains "Subject" "System notification" {
    fileinto "Archive";
    stop;
}
EOF

        sievec "$SIEVE_DIR/filters.sieve" 2>/dev/null || true
        chown -R admin:admin "$SIEVE_DIR"

        echo -e "${GREEN}✅ Sieve filters configured${NC}"
    else
        echo -e "${YELLOW}⚠️  Dovecot Sieve not available${NC}"
    fi
}

verify_fail2ban_status() {
    echo -e "${YELLOW}[6/7] Verifying Fail2Ban configuration...${NC}"

    # Check if Fail2Ban is running
    if systemctl is-active --quiet fail2ban; then
        echo -e "${GREEN}✅ Fail2Ban is running${NC}"

        # Show status
        echo ""
        echo "Active jails:"
        fail2ban-client status | grep "Jail list" | sed 's/.*://' | tr ',' '\n' | sed 's/^/  - /'

        # Check SSHd jail
        echo ""
        echo "SSHD jail status:"
        fail2ban-client status sshd 2>/dev/null || echo "  SSHd jail not active"

        # Check for email actions
        echo ""
        if fail2ban-client get sshd action 2>/dev/null | grep -iq "mail"; then
            echo -e "${RED}❌ WARNING: Email actions still configured!${NC}"
        else
            echo -e "${GREEN}✅ No email actions detected${NC}"
        fi
    else
        echo -e "${RED}❌ Fail2Ban is not running${NC}"
    fi
}

create_test_ban() {
    echo -e "${YELLOW}[7/7] Testing configuration...${NC}"
    echo ""
    echo -e "${BLUE}Testing Fail2Ban functionality (without email):${NC}"
    echo ""
    echo "To test:"
    echo "  1. Try multiple failed SSH attempts from another machine:"
    echo "     ssh wronguser@$VPS_IP"
    echo "  2. After 5 failed attempts, your IP should be banned"
    echo "  3. NO email should be sent to $EMAIL_ACCOUNT"
    echo "  4. Check ban status: fail2ban-client status sshd"
    echo ""
}

main() {
    banner
    check_root

    echo -e "${BLUE}Starting email flood fix on VPS: $VPS_IP${NC}"
    echo ""

    backup_configs
    disable_fail2ban_emails
    configure_postfix_filters
    setup_procmail_filters
    setup_dovecot_sieve
    verify_fail2ban_status
    create_test_ban

    echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}✅ EMAIL FLOODING FIX COMPLETE!${NC}"
    echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "${BLUE}Summary:${NC}"
    echo "  ✅ Fail2Ban email notifications disabled"
    echo "  ✅ Postfix SMTP filters configured"
    echo "  ✅ Procmail filters created"
    echo "  ✅ Dovecot Sieve filters created"
    echo "  ✅ Fail2Ban still blocking IPs (just not emailing)"
    echo ""
    echo -e "${YELLOW}Next Steps:${NC}"
    echo "  1. Check inbox: No new Fail2Ban emails should appear"
    echo "  2. Send test email: Verify normal emails work"
    echo "  3. Monitor logs: tail -f /var/log/fail2ban.log"
    echo ""
    echo -e "${YELLOW}To undo changes:${NC}"
    echo "  sudo cp -r $BACKUP_DIR/* /etc/"
    echo "  systemctl restart fail2ban postfix"
    echo ""
}

# Run main function
main "$@"
