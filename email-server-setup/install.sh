#!/bin/bash

################################################################################
# Ementech Email Server Auto-Setup Script
# Version: 1.0
# Date: 2025-01-19
################################################################################

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration variables
DOMAIN="ementech.co.ke"
HOSTNAME="ementech-vps.ementech.co.ke"
IP="69.164.244.165"
DB_NAME="mailserver_db"
DB_USER="mailserver"
DB_PASS=$(openssl rand -base64 32)
MAIL_USER="vmail"
MAIL_UID=150
MAIL_GID=150
STORAGE_DIR="/var/mail/vhosts"

# Email accounts
declare -A EMAIL_ACCOUNTS=(
    ["ceo"]="CEO@ementech.co.ke"
    ["info"]="info@ementech.co.ke"
    ["support"]="support@ementech.co.ke"
    ["admin"]="admin@ementech.co.ke"
    ["tech"]="tech@ementech.co.ke"
)

################################################################################
# Helper Functions
################################################################################

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "This script must be run as root"
        exit 1
    fi
}

check_system() {
    log_info "Checking system requirements..."

    # Check OS
    if ! grep -q "Ubuntu 24.04" /etc/os-release; then
        log_warning "This script is designed for Ubuntu 24.04. Proceed with caution."
    fi

    # Check RAM
    TOTAL_RAM=$(free -m | awk '/^Mem:/{print $2}')
    if [[ $TOTAL_RAM -lt 1024 ]]; then
        log_error "Minimum 1GB RAM required. You have ${TOTAL_RAM}MB"
        exit 1
    fi

    # Check disk space
    DISK_AVAIL=$(df -BG / | awk 'NR==2{print $4}' | sed 's/G//')
    if [[ $DISK_AVAIL -lt 10 ]]; then
        log_error "Minimum 10GB free disk space required. You have ${DISK_AVAIL}GB"
        exit 1
    fi

    log_success "System requirements met"
}

################################################################################
# Phase 1: System Preparation
################################################################################

phase1_system_prep() {
    log_info "=== Phase 1: System Preparation ==="

    # Set hostname
    log_info "Setting hostname..."
    hostnamectl set-hostname $HOSTNAME
    echo "$HOSTNAME" > /etc/hostname
    echo "$IP $HOSTNAME ementech-vps" >> /etc/hosts

    # Configure mailname
    log_info "Configuring mailname..."
    echo "$DOMAIN" > /etc/mailname

    # Update system
    log_info "Updating system packages..."
    apt update && apt upgrade -y
    apt install -y curl wget git vim htop net-tools apt-transport-https

    log_success "Phase 1 completed"
}

################################################################################
# Phase 2: Install Database
################################################################################

phase2_install_db() {
    log_info "=== Phase 2: Installing PostgreSQL ==="

    apt install -y postgresql postgresql-contrib
    systemctl start postgresql
    systemctl enable postgresql

    # Create database and user
    log_info "Creating database and user..."
    sudo -u postgres psql <<EOF
CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';
CREATE DATABASE $DB_NAME OWNER $DB_USER;
\c $DB_NAME
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $DB_USER;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $DB_USER;
EOF

    # Save credentials
    log_info "Saving database credentials..."
    cat > /root/.mail-db-credentials.txt <<EOF
Database Name: $DB_NAME
Database User: $DB_USER
Database Password: $DB_PASS

Date Created: $(date)
EOF
    chmod 600 /root/.mail-db-credentials.txt

    log_success "Phase 2 completed"
}

################################################################################
# Phase 3: Install Mail Software
################################################################################

phase3_install_mail() {
    log_info "=== Phase 3: Installing Mail Software ==="

    # Preseed Postfix configuration
    log_info "Preseeding Postfix configuration..."
    debconf-set-selections <<EOF
postfix postfix/main_mailer_type select Internet Site
postfix postfix/mailname string $DOMAIN
postfix postfix/tls_level string medium
EOF

    # Install packages
    log_info "Installing Postfix and Dovecot..."
    DEBIAN_PRIORITY=low apt install -y \
        postfix \
        postfix-pgsql \
        dovecot-core \
        dovecot-imapd \
        dovecot-pop3d \
        dovecot-pgsql \
        dovecot-sieve \
        dovecot-lmtpd \
        dovecot-managesieved \
        sasl2-bin \
        libsasl2-modules

    log_info "Installing additional packages..."
    apt install -y \
        opendkim \
        opendkim-tools \
        opendmarc \
        spamassassin \
        rspamd \
        redis-server \
        fail2ban \
        certbot \
        python3-certbot-nginx

    log_success "Phase 3 completed"
}

################################################################################
# Phase 4: Database Schema
################################################################################

phase4_db_schema() {
    log_info "=== Phase 4: Creating Database Schema ==="

    sudo -u postgres psql $DB_NAME <<EOF
-- Domain table
CREATE TABLE IF NOT EXISTS domains (
    id SERIAL PRIMARY KEY,
    domain VARCHAR(255) NOT NULL UNIQUE
);

-- Email accounts
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(128) NOT NULL UNIQUE,
    domain_id INTEGER NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    quota BIGINT DEFAULT 1073741824,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Email aliases
CREATE TABLE IF NOT EXISTS aliases (
    id SERIAL PRIMARY KEY,
    domain_id INTEGER NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
    source VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(domain_id, source)
);

-- Insert domain
INSERT INTO domains (domain) VALUES ('$DOMAIN')
ON CONFLICT (domain) DO NOTHING;
EOF

    log_success "Phase 4 completed"
}

################################################################################
# Phase 5: Create Virtual Mail User
################################################################################

phase5_virtual_user() {
    log_info "=== Phase 5: Creating Virtual Mail User ==="

    # Create group and user
    if ! grep -q "^$MAIL_USER:" /etc/group; then
        groupadd -g $MAIL_GID $MAIL_USER
        useradd -g $MAIL_USER -u $MAIL_UID $MAIL_USER -d $STORAGE_DIR -s /usr/sbin/nologin
    fi

    # Create mail directory
    mkdir -p $STORAGE_DIR/$DOMAIN
    chown -R $MAIL_USER:$MAIL_USER $STORAGE_DIR
    chmod -R 770 $STORAGE_DIR

    log_success "Phase 5 completed"
}

################################################################################
# Phase 6: Configure Postfix
################################################################################

phase6_postfix_config() {
    log_info "=== Phase 6: Configuring Postfix ==="

    # Backup original config
    cp /etc/postfix/main.cf /etc/postfix/main.cf.backup.$(date +%Y%m%d)

    # Create main.cf
    cat > /etc/postfix/main.cf <<'EOF'
# Basic settings
smtpd_banner = $myhostname ESMTP $mail_name (Ubuntu)
biff = no
append_dot_mydomain = no
readme_directory = no

# TLS parameters
smtpd_tls_cert_file = /etc/letsencrypt/live/mail.ementech.co.ke/fullchain.pem
smtpd_tls_key_file = /etc/letsencrypt/live/mail.ementech.co.ke/privkey.pem
smtpd_tls_security_level = may
smtpd_tls_protocols = !SSLv2, !SSLv3, !TLSv1, !TLSv1.1
smtpd_tls_mandatory_protocols = !SSLv2, !SSLv3, !TLSv1, !TLSv1.1
smtpd_tls_session_cache_database = btree:${data_directory}/smtpd_scache
smtp_tls_session_cache_database = btree:${data_directory}/smtp_scache
smtp_tls_security_level = may
smtp_tls_protocols = !SSLv2, !SSLv3, !TLSv1, !TLSv1.1
smtp_tls_mandatory_protocols = !SSLv2, !SSLv3, !TLSv1, !TLSv1.1

# SASL authentication
smtpd_sasl_auth_enable = yes
smtpd_sasl_type = dovecot
smtpd_sasl_path = private/auth
smtpd_sasl_security_options = noanonymous, noplaintext
smtpd_sasl_tls_security_options = noanonymous

# Virtual mail settings
virtual_mailbox_domains = pgsql:/etc/postfix/pgsql-virtual-mailbox-domains.cf
virtual_mailbox_maps = pgsql:/etc/postfix/pgsql-virtual-mailbox-maps.cf
virtual_alias_maps = pgsql:/etc/postfix/pgsql-virtual-alias-maps.cf
virtual_transport = lmtp:unix:private/dovecot-lmtp

# Local settings
myhostname = ementech-vps.ementech.co.ke
mydomain = ementech.co.ke
myorigin = $mydomain
mydestination = localhost.$mydomain, localhost
relayhost =
mynetworks = 127.0.0.0/8 [::ffff:127.0.0.0]/104 [::1]/128
mailbox_size_limit = 0
recipient_delimiter = +
inet_interfaces = all
inet_protocols = all

# Message size limit (50MB)
message_size_limit = 52428800

# Restrictions
smtpd_helo_required = yes
smtpd_helo_restrictions =
    permit_mynetworks,
    permit_sasl_authenticated,
    reject_invalid_helo_hostname,
    reject_non_fqdn_helo_hostname

smtpd_sender_restrictions =
    permit_mynetworks,
    permit_sasl_authenticated,
    reject_non_fqdn_sender,
    reject_sender_login_mismatch

smtpd_recipient_restrictions =
    permit_mynetworks,
    permit_sasl_authenticated,
    reject_non_fqdn_recipient,
    reject_unknown_recipient_domain,
    reject_unauth_destination,
    check_policy_service inet:127.0.0.1:65265

# DKIM
milter_protocol = 6
milter_default_action = accept
smtpd_milters = inet:localhost:8891 inet:localhost:54321
non_smtpd_milters = inet:localhost:8891 inet:localhost:54321
EOF

    # Create PostgreSQL map files
    cat > /etc/postfix/pgsql-virtual-mailbox-domains.cf <<EOF
user = $DB_USER
password = $DB_PASS
hosts = 127.0.0.1
dbname = $DB_NAME
query = SELECT 1 FROM domains WHERE domain='%s'
EOF

    cat > /etc/postfix/pgsql-virtual-mailbox-maps.cf <<EOF
user = $DB_USER
password = $DB_PASS
hosts = 127.0.0.1
dbname = $DB_NAME
query = SELECT 1 FROM users WHERE email='%s'
EOF

    cat > /etc/postfix/pgsql-virtual-alias-maps.cf <<EOF
user = $DB_USER
password = $DB_PASS
hosts = 127.0.0.1
dbname = $DB_NAME
query = SELECT destination FROM aliases WHERE source='%s' AND active = true
EOF

    # Update master.cf
    cat >> /etc/postfix/master.cf <<'EOF'

# Submission port (587)
submission inet n       -       y       -       -       smtpd
  -o syslog_name=postfix/submission
  -o smtpd_tls_security_level=encrypt
  -o smtpd_sasl_auth_enable=yes
  -o smtpd_tls_auth_only=yes
  -o smtpd_client_restrictions=permit_sasl_authenticated,reject
  -o milter_macro_daemon_name=ORIGINATING

# SMTPS port (465)
smtps     inet  n       -       y       -       -       smtpd
  -o syslog_name=postfix/smtps
  -o smtpd_tls_wrappermode=yes
  -o smtpd_sasl_auth_enable=yes
  -o smtpd_reject_unlisted_recipient=no
  -o smtpd_client_restrictions=permit_sasl_authenticated,reject
  -o milter_macro_daemon_name=ORIGINATING
EOF

    log_success "Phase 6 completed"
}

################################################################################
# Phase 7: Configure Dovecot
################################################################################

phase7_dovecot_config() {
    log_info "=== Phase 7: Configuring Dovecot ==="

    # Backup original configs
    cp /etc/dovecot/dovecot.conf /etc/dovecot/dovecot.conf.backup

    # Create main dovecot.conf
    cat > /etc/dovecot/dovecot.conf <<'EOF'
protocols = imap pop3 lmtp sieve
base_dir = /var/run/dovecot/
instance_name = dovecot

# Logging
log_path = /var/log/dovecot.log
info_log_path = /var/log/dovecot-info.log
debug_log_path = /var/log/dovecot-debug.log
log_timestamp = "%Y-%m-%d %H:%M:%S "
log_formatter = text

# SSL
ssl = required
ssl_cert = </etc/letsencrypt/live/mail.ementech.co.ke/fullchain.pem
ssl_key = </etc/letsencrypt/live/mail.ementech.co.ke/privkey.pem
ssl_min_protocol = TLSv1.2
ssl_cipher_list = ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384
ssl_prefer_server_ciphers = yes

# Disable plaintext auth unless SSL/TLS
disable_plaintext_auth = yes
auth_mechanisms = PLAIN LOGIN

# Include configs
!include conf.d/10-mail.conf
!include conf.d/10-auth.conf
!include conf.d/10-master.conf
!include conf.d/10-ssl.conf
!include conf.d/15-lda.conf
!include conf.d/20-imap.conf
!include conf.d/20-pop3.conf
!include conf.d/20-lmtp.conf
!include conf.d/90-sieve.conf
!include conf.d/90-quota.conf
!include conf.d/sql.conf
EOF

    # Create 10-mail.conf
    cat > /etc/dovecot/conf.d/10-mail.conf <<EOF
mail_location = maildir:$STORAGE_DIR/%d/%n
mail_privileged_group = vmail

namespace {
  type = private
  separator = /
  prefix =
  inbox = yes
}

maildir_stat_shared_dirs = yes
first_valid_uid = $MAIL_UID
last_valid_uid = $MAIL_UID
first_valid_gid = $MAIL_GID
last_valid_gid = $MAIL_GID
EOF

    # Create 10-auth.conf
    cat > /etc/dovecot/conf.d/10-auth.conf <<'EOF'
disable_plaintext_auth = yes
auth_mechanisms = plain login

!include auth-deny.conf.ext
!include auth-master.conf.ext
!include auth-sql.conf.ext
EOF

    # Create auth-sql.conf.ext
    cat > /etc/dovecot/conf.d/auth-sql.conf.ext <<'EOF'
passdb {
  driver = sql
  args = /etc/dovecot/dovecot-sql.conf.ext
}

userdb {
  driver = sql
  args = /etc/dovecot/dovecot-sql.conf.ext
}
EOF

    # Create dovecot-sql.conf.ext
    cat > /etc/dovecot/dovecot-sql.conf.ext <<EOF
driver = pgsql
connect = host=127.0.0.1 dbname=$DB_NAME user=$DB_USER password=$DB_PASS

password_query = \
  SELECT email as user, password FROM users WHERE email = '%u'

user_query = \
  SELECT email as user, \
  '$STORAGE_DIR/%d/%n' as home, \
  'maildir:$STORAGE_DIR/%d/%n' as mail, \
  $MAIL_UID as uid, \
  $MAIL_GID as gid, \
  '*:storage=%G' as quota_rule

iterate_query = \
  SELECT email as user FROM users
EOF

    chmod 640 /etc/dovecot/dovecot-sql.conf.ext
    chown root:dovecot /etc/dovecot/dovecot-sql.conf.ext

    # Create 10-master.conf
    cat > /etc/dovecot/conf.d/10-master.conf <<'EOF'
service imap-login {
  inet_listener imap {
    port = 0
  }
  inet_listener imaps {
    port = 993
    ssl = yes
  }
}

service pop3-login {
  inet_listener pop3 {
    port = 0
  }
  inet_listener pop3s {
    port = 995
    ssl = yes
  }
}

service lmtp {
  unix_listener /var/spool/postfix/private/dovecot-lmtp {
    mode = 0600
    user = postfix
    group = postfix
  }
}

service auth {
  unix_listener /var/spool/postfix/private/auth {
    mode = 0666
    user = postfix
    group = postfix
  }

  unix_listener auth-userdb {
    mode = 0600
    user = vmail
    group = vmail
  }

  user = dovecot
}

service auth-worker {
  user = vmail
}

service dict {
  unix_listener dict {
    mode = 0600
    user = vmail
    group = vmail
  }
}
EOF

    # Create 15-lda.conf
    cat > /etc/dovecot/conf.d/15-lda.conf <<EOF
protocol lda {
  mail_plugins = \$mail_plugins sieve
  postmaster_address = postmaster@$DOMAIN
  hostname = $DOMAIN
  sendmail_path = /usr/sbin/sendmail
  lda_mailbox_autocreate = yes
}
EOF

    log_success "Phase 7 completed"
}

################################################################################
# Phase 8: SSL Certificates
################################################################################

phase8_ssl_certs() {
    log_info "=== Phase 8: Obtaining SSL Certificates ==="

    # Create webroot for ACME challenge
    mkdir -p /var/www/html
    chown -R www-data:www-data /var/www/html

    # Obtain certificate
    log_info "Requesting SSL certificate for mail.$DOMAIN..."
    certbot certonly --webroot \
        -w /var/www/html \
        --email admin@$DOMAIN \
        --agree-tos \
        --no-eff-email \
        -d mail.$DOMAIN \
        --non-interactive

    if [[ $? -eq 0 ]]; then
        log_success "SSL certificate obtained successfully"
    else
        log_error "Failed to obtain SSL certificate. Please run manually:"
        echo "certbot certonly --webroot -w /var/www/html --email admin@$DOMAIN --agree-tos -d mail.$DOMAIN"
        exit 1
    fi

    log_success "Phase 8 completed"
}

################################################################################
# Phase 9: DKIM Configuration
################################################################################

phase9_dkim_config() {
    log_info "=== Phase 9: Configuring DKIM ==="

    # Create DKIM directory
    mkdir -p /etc/opendkim/keys/$DOMAIN
    cd /etc/opendkim/keys/$DOMAIN

    # Generate keys
    log_info "Generating DKIM keys..."
    opendkim-genkey -s mail -d $DOMAIN
    mv mail.private default.private
    mv mail.txt default.txt

    # Set permissions
    chown -R opendkim:opendkim /etc/opendkim
    chmod 600 /etc/opendkim/keys/$DOMAIN/default.private
    chmod 644 /etc/opendkim/keys/$DOMAIN/default.txt

    # Configure OpenDKIM
    cat > /etc/opendkim.conf <<'EOF'
Syslog                  yes
SyslogSuccess           yes
LogWhy                  yes
Canonicalization        relaxed/simple
Mode                    sv
SignTable               refile:/etc/opendkim/signing.table
KeyTable                /etc/opendkim/key.table
SigningTable            refile:/etc/opendkim/signing.table
ExternalIgnoreList      /etc/opendkim/trusted.hosts
InternalHosts           /etc/opendkim/trusted.hosts
IgnoreMailFrom          /etc/opendkim/trusted.hosts
Socket                  inet:8891@localhost
PidFile                 /var/run/opendkim/opendkim.pid
UMask                   022
UserID                  opendkim:opendkim
TemporaryDirectory      /var/tmp
EOF

    # Create signing table
    cat > /etc/opendkim/signing.table <<EOF
*@$DOMAIN default._domainkey.$DOMAIN
EOF

    cat > /etc/opendkim/key.table <<EOF
default._domainkey.$DOMAIN $DOMAIN:default:/etc/opendkim/keys/$DOMAIN/default.private
EOF

    cat > /etc/opendkim/trusted.hosts <<EOF
127.0.0.1
localhost
*.$DOMAIN
EOF

    # Add opendkim to postfix group
    adduser postfix opendkim

    # Save DKIM DNS record
    DKIM_RECORD=$(cat /etc/opendkim/keys/$DOMAIN/default.txt | grep -v ';' | tr -d '\n' | sed 's/\s*/ /g' | sed 's/" "/"/g')
    log_info "DKIM DNS Record to add:"
    echo "$DKIM_RECORD"
    echo "mail._domainkey.$DOMAIN IN TXT $DKIM_RECORD" > /root/.dkim-dns-record.txt

    log_success "Phase 9 completed"
}

################################################################################
# Phase 10: Configure rspamd
################################################################################

phase10_rspamd_config() {
    log_info "=== Phase 10: Configuring rspamd ==="

    systemctl enable redis-server
    systemctl start redis-server

    # Configure rspamd proxy
    mkdir -p /etc/rspamd/local.d
    cat > /etc/rspamd/local.d/worker-proxy.inc <<'EOF'
bind_socket = "127.0.0.1:65265";
milter = yes;
timeout = 120s;
EOF

    # Configure DKIM signing
    cat > /etc/rspamd/local.d/dkim_signing.conf <<EOF
domain {
  $DOMAIN {
    path = "/etc/opendkim/keys/$DOMAIN/default.private";
    selector = "default";
  }
}
selector_map = "/etc/rspamd/dkim_selectors.map";
EOF

    # Configure spam actions
    cat > /etc/rspamd/local.d/actions.conf <<'EOF'
subject = "SPAM: %s";
greylist = 4;
reject = 15;
rewrite_subject = 6;
EOF

    systemctl enable rspamd
    systemctl start rspamd

    log_success "Phase 10 completed"
}

################################################################################
# Phase 11: Firewall Configuration
################################################################################

phase11_firewall() {
    log_info "=== Phase 11: Configuring Firewall ==="

    # Allow email ports
    ufw allow 25/tcp comment 'SMTP'
    ufw allow 587/tcp comment 'SMTP Submission'
    ufw allow 465/tcp comment 'SMTPS'
    ufw allow 143/tcp comment 'IMAP'
    ufw allow 993/tcp comment 'IMAPS'
    ufw allow 110/tcp comment 'POP3'
    ufw allow 995/tcp comment 'POP3S'

    ufw reload

    log_success "Phase 11 completed"
}

################################################################################
# Phase 12: Configure Fail2Ban
################################################################################

phase12_fail2ban() {
    log_info "=== Phase 12: Configuring Fail2Ban ==="

    # Create jail.local for email services
    cat > /etc/fail2ban/jail.local <<'EOF'
[postfix]
enabled = true
port = smtp,ssmtp,submission
logpath = /var/log/mail.log
maxretry = 5
bantime = 3600

[dovecot]
enabled = true
port = imap,imaps,pop3,pop3s
logpath = /var/log/dovecot.log
maxretry = 5
bantime = 3600

[sasl]
enabled = true
port = smtp,ssmtp,submission,imap2,imaps,pop3,pop3s
logpath = /var/log/mail.log
maxretry = 5
bantime = 3600
EOF

    systemctl enable fail2ban
    systemctl restart fail2ban

    log_success "Phase 12 completed"
}

################################################################################
# Phase 13: Start Services
################################################################################

phase13_start_services() {
    log_info "=== Phase 13: Starting Services ==="

    # Restart all services
    systemctl restart postfix
    systemctl restart dovecot
    systemctl restart opendkim
    systemctl restart rspamd

    # Enable services
    systemctl enable postfix
    systemctl enable dovecot
    systemctl enable opendkim
    systemctl enable rspamd

    # Check status
    log_info "Checking service status..."
    systemctl is-active postfix && log_success "Postfix is running" || log_error "Postfix failed to start"
    systemctl is-active dovecot && log_success "Dovecot is running" || log_error "Dovecot failed to start"
    systemctl is-active opendkim && log_success "OpenDKIM is running" || log_error "OpenDKIM failed to start"
    systemctl is-active rspamd && log_success "rspamd is running" || log_error "rspamd failed to start"

    log_success "Phase 13 completed"
}

################################################################################
# Phase 14: Install Roundcube
################################################################################

phase14_roundcube() {
    log_info "=== Phase 14: Installing Roundcube Webmail ==="

    # Install Roundcube
    DEBIAN_FRONTEND=noninteractive apt install -y \
        roundcube \
        roundcube-core \
        roundcube-sqlite3 \
        roundcube-plugins \
        php-php-sqlite3 \
        php-intl \
        php-gd \
        php-xml \
        php-mbstring \
        php-curl

    # Configure Roundcube
    cat >> /etc/roundcube/config.inc.php <<EOF
\$config['default_host'] = 'tls://mail.$DOMAIN';
\$config['smtp_server'] = 'tls://mail.$DOMAIN';
\$config['smtp_port'] = 587;
\$config['smtp_user'] = '%u';
\$config['smtp_pass'] = '%p';
\$config['force_https'] = true;
\$config['plugins'] = ['archive', 'zipdownload', 'markasjunk', 'newmail_notifier', 'emoticons'];
EOF

    # Configure Nginx
    cat > /etc/nginx/sites-available/mail.$DOMAIN <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name mail.$DOMAIN;

    # Redirect to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name mail.$DOMAIN;

    root /var/lib/roundcube;
    index index.php index.html;

    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/mail.$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/mail.$DOMAIN/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-Frame-Options SAMEORIGIN always;

    # Logs
    access_log /var/log/nginx/mail.$DOMAIN-access.log;
    error_log /var/log/nginx/mail.$DOMAIN-error.log;

    # Roundcube configuration
    location / {
        try_files \$uri \$uri/ /index.php?\$args;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/run/php/php-fpm.sock;
        fastcgi_param SCRIPT_FILENAME \$document_root\$fastcgi_script_name;
        include fastcgi_params;
    }

    # Deny access to config and temp directories
    location ~ /\. {
        deny all;
    }
    location ~ /(config|temp|logs)/ {
        deny all;
    }

    # Client body size limit (for attachments)
    client_max_body_size 50M;
}
EOF

    # Enable site
    ln -sf /etc/nginx/sites-available/mail.$DOMAIN /etc/nginx/sites-enabled/

    # Test and reload nginx
    nginx -t && systemctl reload nginx

    log_success "Phase 14 completed"
}

################################################################################
# Phase 15: Create Email Accounts
################################################################################

phase15_create_accounts() {
    log_info "=== Phase 15: Creating Email Accounts ==="

    for user_id in "${!EMAIL_ACCOUNTS[@]}"; do
        email="${EMAIL_ACCOUNTS[$user_id]}"

        # Generate random password
        password=$(openssl rand -base64 16)
        password_hash=$(doveadm pw -s SHA512-CRYPT -p "$password")

        # Insert into database
        sudo -u postgres psql $DB_NAME <<EOF
INSERT INTO users (user_id, domain_id, password, email)
SELECT '$user_id', id, '$password_hash', '$email'
FROM domains WHERE domain = '$DOMAIN'
ON CONFLICT (email) DO NOTHING;
EOF

        # Create mail directory
        mkdir -p $STORAGE_DIR/$DOMAIN/$user_id
        chown -R $MAIL_USER:$MAIL_USER $STORAGE_DIR/$DOMAIN/$user_id
        chmod -R 770 $STORAGE_DIR/$DOMAIN/$user_id

        # Save credentials
        echo "$email:$password" >> /root/.email-credentials.txt

        log_success "Created email account: $email"
    done

    # Create aliases
    sudo -u postgres psql $DB_NAME <<EOF
INSERT INTO aliases (domain_id, source, destination) VALUES
(1, 'postmaster@$DOMAIN', 'admin@$DOMAIN'),
(1, 'abuse@$DOMAIN', 'admin@$DOMAIN'),
(1, 'webmaster@$DOMAIN', 'tech@$DOMAIN')
ON CONFLICT DO NOTHING;
EOF

    # Secure credentials file
    chmod 600 /root/.email-credentials.txt

    log_success "Phase 15 completed"
}

################################################################################
# Phase 16: Generate DNS Records
################################################################################

phase16_dns_records() {
    log_info "=== Phase 16: Generating DNS Records ==="

    cat > /root/dns-records.txt <<EOF
# DNS Records for $DOMAIN
# Add these to your domain registrar

# MX Records (Priority 10 for primary)
$DOMAIN.          IN MX 10 mail.$DOMAIN.
mail.$DOMAIN.     IN A $IP

# A Records for mail subdomains
mail.$DOMAIN.     IN A $IP
smtp.$DOMAIN.     IN A $IP
imap.$DOMAIN.     IN A $IP

# SPF Record (TXT)
$DOMAIN.          IN TXT "v=spf1 mx a ip4:$IP ~all"

# DKIM Record
$(cat /etc/opendkim/keys/$DOMAIN/default.txt)

# DMARC Record
_dmarc.$DOMAIN.   IN TXT "v=DMARC1; p=quarantine; rua=mailto:admin@$DOMAIN; ruf=mailto:admin@$DOMAIN; sp=none; aspf=s; adkim=s"

# SRV Records (optional but recommended)
_submission._tcp.$DOMAIN. IN SRV 0 0 587 mail.$DOMAIN.
_imaps._tcp.$DOMAIN.     IN SRV 0 0 993 mail.$DOMAIN.
_pop3s._tcp.$DOMAIN.     IN SRV 0 0 995 mail.$DOMAIN.
EOF

    log_success "DNS records saved to /root/dns-records.txt"
    log_info "Phase 16 completed"
}

################################################################################
# Phase 17: Create Backup Script
################################################################################

phase17_backup_script() {
    log_info "=== Phase 17: Creating Backup Script ==="

    cat > /usr/local/bin/backup-mail.sh <<'EOF'
#!/bin/bash
BACKUP_DIR="/backup/mail"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Backup configs
tar czf $BACKUP_DIR/mail-config-$DATE.tar.gz \
    /etc/postfix \
    /etc/dovecot \
    /etc/opendkim \
    /etc/rspamd \
    /etc/nginx/sites-available/mail.ementech.co.ke

# Backup database
sudo -u postgres pg_dump mailserver_db | gzip > $BACKUP_DIR/mail-db-$DATE.sql.gz

# Backup mail data
tar czf $BACKUP_DIR/mail-data-$DATE.tar.gz /var/mail/vhosts

# Keep last 30 days
find $BACKUP_DIR -mtime +30 -delete

echo "Backup completed: $DATE"
EOF

    chmod +x /usr/local/bin/backup-mail.sh

    # Add to cron
    echo "0 2 * * * root /usr/local/bin/backup-mail.sh" > /etc/cron.d/mail-backup

    log_success "Phase 17 completed"
}

################################################################################
# Phase 18: Testing
################################################################################

phase18_testing() {
    log_info "=== Phase 18: Testing Configuration ==="

    # Test Postfix
    log_info "Testing Postfix configuration..."
    postfix check && log_success "Postfix configuration is valid" || log_error "Postfix configuration has errors"

    # Test Dovecot
    log_info "Testing Dovecot configuration..."
    doveconf -n > /dev/null && log_success "Dovecot configuration is valid" || log_error "Dovecot configuration has errors"

    # Check if ports are listening
    log_info "Checking if email ports are listening..."
    for port in 25 587 143 993; do
        if ss -tlnp | grep -q ":$port "; then
            log_success "Port $port is listening"
        else
            log_error "Port $port is NOT listening"
        fi
    done

    # Test mail queue
    log_info "Testing mail queue..."
    mailq_output=$(mailq)
    if [[ $mailq_output == *"Mail queue is empty"* ]] || [[ $mailq_output == *"empty"* ]]; then
        log_success "Mail queue is empty (good)"
    else
        log_warning "Mail queue: $mailq_output"
    fi

    log_success "Phase 18 completed"
}

################################################################################
# Phase 19: Generate Summary
################################################################################

phase19_summary() {
    log_info "=== Installation Summary ==="

    cat <<EOF

═══════════════════════════════════════════════════════════════
           EMENTECH EMAIL SERVER INSTALLATION COMPLETE
═══════════════════════════════════════════════════════════════

Server Information:
  Domain: $DOMAIN
  Hostname: $HOSTNAME
  IP Address: $IP

Webmail Access:
  URL: https://mail.$DOMAIN

Email Accounts:
  See /root/.email-credentials.txt for passwords

Database Credentials:
  See /root/.mail-db-credentials.txt

DNS Records:
  See /root/dns-records.txt

DKIM Record:
  See /root/.dkim-dns-record.txt

Configuration Files:
  Postfix: /etc/postfix/
  Dovecot: /etc/dovecot/
  OpenDKIM: /etc/opendkim/
  rspamd: /etc/rspamd/
  Roundcube: /etc/roundcube/

Log Files:
  Postfix: /var/log/mail.log
  Dovecot: /var/log/dovecot.log
  OpenDKIM: /var/log/syslog
  rspamd: /var/log/rspamd/rspamd.log

Next Steps:
  1. Add DNS records to your domain registrar
  2. Wait for DNS propagation (1-24 hours)
  3. Test sending emails to external addresses
  4. Monitor logs for errors
  5. Set up email clients (Outlook, Thunderbird, etc.)

IMPORTANT WARNINGS:
  - Email deliverability will take 2-4 weeks to warm up
  - Monitor resources closely (2GB RAM is limited)
  - Check logs daily: tail -f /var/log/mail.log
  - Keep software updated regularly
  - Backups run daily at 2 AM

Documentation:
  Full setup guide: /root/email-server-setup-guide.md

═══════════════════════════════════════════════════════════════

EOF

    log_success "Installation completed successfully!"
}

################################################################################
# Main Installation Function
################################################################################

main() {
    log_info "Starting Ementech Email Server Installation..."
    log_info "This process will take approximately 15-20 minutes"

    # Check prerequisites
    check_root
    check_system

    # Run installation phases
    phase1_system_prep
    phase2_install_db
    phase3_install_mail
    phase4_db_schema
    phase5_virtual_user
    phase6_postfix_config
    phase7_dovecot_config
    phase8_ssl_certs
    phase9_dkim_config
    phase10_rspamd_config
    phase11_firewall
    phase12_fail2ban
    phase13_start_services
    phase14_roundcube
    phase15_create_accounts
    phase16_dns_records
    phase17_backup_script
    phase18_testing
    phase19_summary

    log_success "All phases completed successfully!"
}

# Run main function
main "$@"
