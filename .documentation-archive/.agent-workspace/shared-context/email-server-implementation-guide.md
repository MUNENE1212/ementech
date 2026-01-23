# Email Server Implementation Guide

**Version**: 1.0
**Date**: 2026-01-19
**Target Environment**: Ubuntu 24.04 LTS, 2GB RAM VPS
**Related**: email-server-architecture.md, email-server-data-model.md

## Table of Contents
1. Pre-Installation Checklist
2. Phase 1: Core Components Installation
3. Phase 2: Security Configuration
4. Phase 3: Webmail Installation
5. Phase 4: Email Authentication Setup
6. Phase 5: Monitoring and Backup
7. Testing Procedures
8. Troubleshooting

---

## 1. Pre-Installation Checklist

### 1.1 System Requirements

Verify VPS specifications:
```bash
# Check OS version
lsb_release -a
# Expected: Ubuntu 24.04 LTS

# Check RAM
free -h
# Expected: Total ~2GB

# Check disk space
df -h /
# Expected: At least 10GB free

# Check existing services
systemctl list-units --type=service --state=running | grep -E 'nginx|mongo|node'
```

### 1.2 DNS Preparation

Before starting, ensure these DNS records exist (or are ready to add):

```
# Required Records
mail.ementech.co.ke.          IN  A   69.164.244.165
webmail.ementech.co.ke.       IN  A   69.164.244.165
ementech.co.ke.               IN  MX  10  mail.ementech.co.ke.

# TXT Records (add after installation)
ementech.co.ke.               IN  TXT  "v=spf1 mx a ip4:69.164.244.165 -all"
_dmarc.ementech.co.ke.        IN  TXT  "v=DMARC1; p=reject; rua=mailto:dmarc@ementech.co.ke; aspf=s; adkim=s; pct=100"
```

### 1.3 SSL Certificate

Verify existing wildcard certificate:
```bash
ls -la /etc/letsencrypt/live/ementech.co.ke/
# Should show: fullchain.pem, privkey.pem, chain.pem
```

### 1.4 Backup Existing Configuration

```bash
# Backup nginx
sudo cp -r /etc/nginx /etc/nginx.backup.$(date +%Y%m%d)

# Backup existing services
sudo systemctl list-units --type=service > /tmp/services-before.txt
```

### 1.5 Create Installation Directory

```bash
sudo mkdir -p /tmp/email-install
cd /tmp/email-install
```

---

## 2. Phase 1: Core Components Installation (Day 1)

### 2.1 Update System and Install Dependencies

```bash
# Update package lists
sudo apt update

# Upgrade existing packages
sudo apt upgrade -y

# Install dependencies
sudo apt install -y \
    sqlite3 \
    openssl \
    gnupg \
    curl \
    wget \
    git \
    build-essential \
    python3 \
    python3-pip \
    ufw \
    fail2ban \
    rsyslog
```

### 2.2 Create Virtual Mail User

```bash
# Create vmail system user (uid:gid 5000:5000)
sudo groupadd -g 5000 vmail
sudo useradd -g vmail -u 5000 vmail -d /var/vmail -m -s /usr/sbin/nologin

# Verify creation
id vmail
# Expected output: uid=5000(vmail) gid=5000(vmail) groups=5000(vmail)

# Create mail directory structure
sudo mkdir -p /var/vmail
sudo chown -R vmail:vmail /var/vmail
sudo chmod 0700 /var/vmail
```

### 2.3 Install and Configure SQLite Database

```bash
# Create database directory
sudo mkdir -p /etc/postfix

# Create database
sudo sqlite3 /etc/postfix/virtual_mailboxes.db <<'EOF'
-- Domains table
CREATE TABLE domains (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    domain TEXT NOT NULL UNIQUE,
    active INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT
);

-- Users table
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    name TEXT,
    domain TEXT NOT NULL,
    user TEXT NOT NULL,
    home TEXT NOT NULL,
    maildir TEXT NOT NULL,
    quota INTEGER DEFAULT 2147483648,
    quota_used INTEGER DEFAULT 0,
    active INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    FOREIGN KEY (domain) REFERENCES domains(domain)
);

-- Aliases table
CREATE TABLE aliases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source TEXT NOT NULL UNIQUE,
    destination TEXT NOT NULL,
    domain TEXT NOT NULL,
    active INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (domain) REFERENCES domains(domain)
);

-- Senders table (for DKIM)
CREATE TABLE senders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    domain TEXT NOT NULL,
    dkim_selector TEXT,
    dkim_key_path TEXT,
    active INTEGER DEFAULT 1,
    FOREIGN KEY (domain) REFERENCES domains(domain)
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_domain ON users(domain);
CREATE INDEX idx_users_active ON users(active);
CREATE INDEX idx_aliases_source ON aliases(source);
CREATE INDEX idx_aliases_domain ON aliases(domain);
CREATE INDEX idx_domains_domain ON domains(domain);
EOF

# Set permissions
sudo chmod 640 /etc/postfix/virtual_mailboxes.db
sudo chown root:postfix /etc/postfix/virtual_mailboxes.db
```

### 2.4 Install Postfix

```bash
# Install Postfix (non-interactive)
sudo DEBIAN_FRONTEND=noninteractive apt install -y postfix postfix-sqlite3

# During installation, select "Internet Site" when prompted
# System mail name: ementech.co.ke

# Alternative: reconfigure after installation
sudo dpkg-reconfigure postfix
```

### 2.5 Configure Postfix

**Backup original config**:
```bash
sudo cp /etc/postfix/main.cf /etc/postfix/main.cf.orig
```

**Create SQL configurations directory**:
```bash
sudo mkdir -p /etc/postfix/sql
```

**Create virtual domains map** (`/etc/postfix/sql/virtual_domains.cf`):
```bash
sudo tee /etc/postfix/sql/virtual_domains.cf <<EOF
user = postfix
password =
hosts = 127.0.0.1
dbname = /etc/postfix/virtual_mailboxes.db
query = SELECT 1 FROM domains WHERE domain='%s' AND active=1
EOF
```

**Create virtual mailboxes map** (`/etc/postfix/sql/virtual_mailboxes.cf`):
```bash
sudo tee /etc/postfix/sql/virtual_mailboxes.cf <<EOF
user = postfix
password =
hosts = 127.0.0.1
dbname = /etc/postfix/virtual_mailboxes.db
query = SELECT maildir FROM users WHERE email='%s' AND active=1
EOF
```

**Create virtual aliases map** (`/etc/postfix/sql/virtual_aliases.cf`):
```bash
sudo tee /etc/postfix/sql/virtual_aliases.cf <<EOF
user = postfix
password =
hosts = 127.0.0.1
dbname = /etc/postfix/virtual_mailboxes.db
query = SELECT destination FROM aliases WHERE source='%s' AND active=1
EOF
```

**Set permissions**:
```bash
sudo chmod 640 /etc/postfix/sql/*.cf
sudo chown root:postfix /etc/postfix/sql/*.cf
```

**Configure main.cf** (`/etc/postfix/main.cf`):
```bash
sudo tee -a /etc/postfix/main.cf <<EOF

# Virtual domains
virtual_mailbox_domains = sqlite:/etc/postfix/sql/virtual_domains.cf
virtual_mailbox_maps = sqlite:/etc/postfix/sql/virtual_mailboxes.cf
virtual_alias_maps = sqlite:/etc/postfix/sql/virtual_aliases.cf

# Mail delivery
virtual_transport = dovecot
dovecot_destination_recipient_limit = 1

# Mailbox settings
virtual_mailbox_base = /var/vmail
virtual_uid_maps = static:5000
virtual_gid_maps = static:5000

# TLS parameters
smtpd_tls_cert_file=/etc/letsencrypt/live/ementech.co.ke/fullchain.pem
smtpd_tls_key_file=/etc/letsencrypt/live/ementech.co.ke/privkey.pem
smtpd_tls_security_level=may
smtpd_tls_protocols=!SSLv2,!SSLv3,!TLSv1,!TLSv1.1
smtpd_tls_mandatory_protocols=!SSLv2,!SSLv3,!TLSv1,!TLSv1.1
smtpd_tls_cipherlist = ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384
smtpd_tls_exclude_cipher = aNULL, eNULL, EXPORT, DES, RC4, MD5
tls_preempt_cipherlist = yes

# SASL authentication
smtpd_sasl_type = dovecot
smtpd_sasl_path = private/auth
smtpd_sasl_auth_enable = yes
broken_sasl_auth_clients = yes

# Message size limits
message_size_limit = 25600000  # 25MB
mailbox_size_limit = 1000000000  # 1GB
virtual_mailbox_limit = 1000000000

# Client restrictions
smtpd_client_connection_count_limit = 10
smtpd_client_connection_rate_limit = 30
smtpd_client_message_rate_limit = 50

# Network settings
inet_protocols = all
inet_interfaces = all

# Hostname
myhostname = mail.ementech.co.ke
mydomain = ementech.co.ke
myorigin = $mydomain

# SASL
smtpd_sasl_auth_enable = yes
smtpd_sasl_type = dovecot
smtpd_sasl_path = private/auth
smtpd_sasl_security_options = noanonymous, noplaintext
smtpd_sasl_tls_security_options = noanonymous

# Restrictions
smtpd_recipient_restrictions =
    permit_sasl_authenticated,
    permit_mynetworks,
    reject_unauth_destination,
    reject_invalid_hostname,
    reject_non_fqdn_hostname,
    reject_non_fqdn_sender,
    reject_non_fqdn_recipient,
    reject_unknown_sender_domain,
    reject_unknown_recipient_domain

# Milter configuration (for Rspamd - add later)
# smtpd_milters = inet:localhost:11332
# non_smtpd_milters = inet:localhost:11332
# milter_protocol = 6
# milter_default_action = accept
EOF
```

**Configure master.cf** (edit with caution):
```bash
sudo sed -i 's/^submission/submission inet n       -       y       -       -       smtpd\n  -o syslog_name=postfix\/submission\n  -o smtpd_tls_security_level=encrypt\n  -o smtpd_sasl_auth_enable=yes\n  -o smtpd_tls_auth_only=yes\n  -o smtpd_reject_unlisted_recipient=no\n  -o smtpd_client_restrictions=$mua_client_restrictions\n  -o smtpd_helo_restrictions=$mua_helo_restrictions\n  -o smtpd_sender_restrictions=$mua_sender_restrictions\n  -o smtpd_recipient_restrictions=\n  -o smtpd_relay_restrictions=permit_sasl_authenticated,reject\n  -o milter_macro_daemon_name=ORIGINATING/' /etc/postfix/master.cf

# Enable smtps (legacy)
sudo sed -i 's/^smtps/#smtps/' /etc/postfix/master.cf
sudo tee -a /etc/postfix/master.cf <<EOF
smtps     inet  n       -       y       -       -       smtpd
  -o syslog_name=postfix/smtps
  -o smtpd_tls_wrappermode=yes
  -o smtpd_sasl_auth_enable=yes
  -o smtpd_reject_unlisted_recipient=no
  -o smtpd_client_restrictions=$mua_client_restrictions
  -o smtpd_helo_restrictions=$mua_helo_restrictions
  -o smtpd_sender_restrictions=$mua_sender_restrictions
  -o smtpd_recipient_restrictions=
  -o smtpd_relay_restrictions=permit_sasl_authenticated,reject
  -o milter_macro_daemon_name=ORIGINATING
EOF
```

**Test Postfix configuration**:
```bash
sudo postfix check
# Expected: No errors

# Verify Postfix is listening on port 25
sudo ss -tlnp | grep :25
```

**Restart Postfix**:
```bash
sudo systemctl restart postfix
sudo systemctl enable postfix
sudo systemctl status postfix
```

### 2.6 Install Dovecot

```bash
# Install Dovecot
sudo apt install -y dovecot-core dovecot-imapd dovecot-pop3d dovecot-lmtpd dovecot-sqlite3

# Verify installation
dovecot --version
# Expected: Dovecot 2.3.x
```

### 2.7 Configure Dovecot

**Backup original config**:
```bash
sudo cp /etc/dovecot/dovecot.conf /etc/dovecot/dovecot.conf.orig
```

**Configure dovecot.conf**:
```bash
sudo tee /etc/dovecot/dovecot.conf <<EOF
# Dovecot configuration
protocols = imap pop3 lmtp sieve
base_dir = /var/run/dovecot/
instance_name = dovecot

# Logging
log_path = /var/log/dovecot.log
info_log_path = /var/log/dovecot-info.log
debug_log_path = /var/log/dovecot-debug.log

# SSL
ssl = required
ssl_cert = </etc/letsencrypt/live/ementech.co.ke/fullchain.pem
ssl_key = </etc/letsencrypt/live/ementech.co.ke/privkey.pem
ssl_min_protocol = TLSv1.2
ssl_cipher_list = ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384
ssl_prefer_server_ciphers = no

# Disable plaintext auth
disable_plaintext_auth = yes
auth_mechanisms = CRAM-MD5 DIGEST-MD5 PLAIN

# Mail location
mail_location = maildir:/var/vmail/%d/%n

# Namespaces
namespace inbox {
  inbox = yes
  location =
  mailbox Drafts {
    special_use = \Drafts
  }
  mailbox Junk {
    special_use = \Junk
  }
  mailbox Trash {
    special_use = \Trash
  }
  mailbox Sent {
    special_use = \Sent
  }
  mailbox "Sent Messages" {
    special_use = \Sent
  }
}

# Service configuration
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

# Passdb
passdb {
  driver = sql
  args = /etc/dovecot/sql/dovecot-sql.conf.ext
}

# Userdb
userdb {
  driver = sql
  args = /etc/dovecot/sql/dovecot-sql.conf.ext
}

# Plugins
plugin {
  quota = dict:User quota::proxy::sql:%u
  quota_rule = *:storage=2G
  quota_rule2 = Trash:storage=500M
  quota_warning = storage=95%% quota-warning 95 %u
  quota_warning2 = storage=80%% quota-warning 80 %u
  sieve = /var/vmail/%d/%n/.sieve
}
EOF
```

**Create SQL config**:
```bash
sudo mkdir -p /etc/dovecot/sql

sudo tee /etc/dovecot/sql/dovecot-sql.conf.ext <<EOF
driver = sqlite
connect = /etc/postfix/virtual_mailboxes.db
default_pass_scheme = SHA512-CRYPT

# Password query
password_query = \
    SELECT email as user, password, \
    '/var/vmail/%d/%n' AS userdb_home, \
    'maildir:/var/vmail/%d/%n' AS userdb_mail, \
    5000 AS userdb_uid, 5000 AS userdb_gid \
    FROM users \
    WHERE email = '%u' AND active = '1'

# User query
user_query = \
    SELECT email, '/var/vmail/%d/%n' AS home, \
    'maildir:/var/vmail/%d/%n' AS mail, \
    5000 AS uid, 5000 AS gid, \
    '*:storage=2G' AS quota_rule \
    FROM users \
    WHERE email = '%u' AND active = '1'
EOF

sudo chmod 640 /etc/dovecot/sql/dovecot-sql.conf.ext
sudo chown root:dovecot /etc/dovecot/sql/dovecot-sql.conf.ext
```

**Create quota warning service** (`/etc/dovecot/conf.d/90-quota.conf`):
```bash
sudo tee /etc/dovecot/conf.d/90-quota.conf <<EOF
plugin {
  quota = dict:User quota::proxy::sql:%u
  quota_rule = *:storage=2G
  quota_rule2 = Trash:storage=500M
}

service quota-warning {
  executable = script /usr/local/bin/quota-warning.sh
  user = vmail
  unix_listener quota-warning {
    user = vmail
  }
}
EOF
```

**Create quota warning script**:
```bash
sudo tee /usr/local/bin/quota-warning.sh <<'EOF'
#!/bin/bash
PERCENT=$1
USER=$2

cat << EOF | /usr/lib/dovecot/deliver -d $USER
From: postmaster@ementech.co.ke
Subject: Quota Warning
To: $USER
Date: $(date -R)

Your mailbox is now $PERCENT% full. Please clean up your mailbox or
contact support@ementech.co.ke if you need assistance.

--
EmenTech Mail System
EOF
EOF

sudo chmod +x /usr/local/bin/quota-warning.sh
sudo chown vmail:vmail /usr/local/bin/quota-warning.sh
```

**Test Dovecot configuration**:
```bash
sudo dovecot -n
# Expected: No errors

# Verify Dovecot is listening on ports 993, 995
sudo ss -tlnp | grep dovecot
```

**Restart Dovecot**:
```bash
sudo systemctl restart dovecot
sudo systemctl enable dovecot
sudo systemctl status dovecot
```

### 2.8 Create Initial Users

**Generate passwords**:
```bash
# Generate password hashes for initial users
# You'll be prompted to enter passwords for each user

sudo tee /tmp/create-users.sh <<'EOF'
#!/bin/bash

DB="/etc/postfix/virtual_mailboxes.db"
DOMAIN="ementech.co.ke"

# Users array
declare -A USERS=(
    ["ceo"]="CEO"
    ["info"]="Info Desk"
    ["support"]="Support Team"
    ["admin"]="Administrator"
    ["tech"]="Technical Support"
)

for USER in "${!USERS[@]}"; do
    EMAIL="$USER@$DOMAIN"
    NAME="${USERS[$USER]}"

    echo "Creating user: $EMAIL"
    echo "Enter password:"
    read -s PASSWORD

    # Generate password hash
    HASH=$(doveadm pw -s SHA512-CRYPT -p "$PASSWORD")

    # Create maildir
    MAILDIR="/var/vmail/$DOMAIN/$USER"
    sudo mkdir -p "$MAILDIR"
    sudo mkdir -p "$MAILDIR/cur" "$MAILDIR/new" "$MAILDIR/tmp"
    sudo chown -R vmail:vmail "/var/vmail/$DOMAIN"

    # Add to database
    sudo sqlite3 "$DB" <<SQL
INSERT INTO users (email, password, name, domain, user, home, maildir, quota)
VALUES ('$EMAIL', '$HASH', '$NAME', '$DOMAIN', '$USER',
        '/var/vmail/$DOMAIN/$USER', '$DOMAIN/$USER/', 2147483648);
SQL

    echo "User $EMAIL created"
    echo ""
done
EOF

chmod +x /tmp/create-users.sh
sudo /tmp/create-users.sh
```

**Verify users**:
```bash
sudo sqlite3 /etc/postfix/virtual_mailboxes.db "SELECT email, name, active FROM users;"
```

### 2.9 Test Basic Email Flow

**Test local delivery**:
```bash
echo "Test email" | mail -s "Test" ceo@ementech.co.ke

# Check if email was delivered
ls -la /var/vmail/ementech.co.ke/ceo/new/
```

**Test Postfix queue**:
```bash
sudo mailq
```

**Check logs**:
```bash
sudo tail -f /var/log/mail.log
```

---

## 3. Phase 2: Security Configuration (Day 2)

### 3.1 Configure Firewall (ufw)

```bash
# Reset to defaults
sudo ufw --force reset
sudo ufw default deny incoming
sudo ufw default allow outgoing

# SSH (rate limited)
sudo ufw limit 22/tcp comment 'SSH rate limit'

# Web (existing)
sudo ufw allow 80/tcp comment 'HTTP'
sudo ufw allow 443/tcp comment 'HTTPS'

# Email services
sudo ufw allow 25/tcp comment 'SMTP server-to-server'
sudo ufw allow 587/tcp comment 'SMTP submission (TLS)'
sudo ufw allow 465/tcp comment 'SMTPS (legacy)'
sudo ufw allow 993/tcp comment 'IMAPS (encrypted IMAP)'
sudo ufw allow 995/tcp comment 'POP3S (encrypted POP3)'

# SMTP rate limiting
sudo ufw route allow proto tcp from any to any port 25 limit 10/minute comment 'SMTP rate limit'

# Enable
sudo ufw enable
sudo ufw status verbose
```

### 3.2 Install and Configure Fail2ban

```bash
# Install Fail2ban
sudo apt install -y fail2ban

# Create local configuration
sudo tee /etc/fail2ban/jail.local <<EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5
destemail = admin@ementech.co.ke
sendername = Fail2Ban
action = %(action_mwl)s

[sshd]
enabled = true
port = 22

[postfix-sasl]
enabled = true
port = smtp,465,587
logpath = /var/log/mail.log

[dovecot]
enabled = true
port = imap,imaps,pop3,pop3s
logpath = /var/log/mail.log

[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/*error.log
EOF

# Start Fail2ban
sudo systemctl restart fail2ban
sudo systemctl enable fail2ban
sudo fail2ban-client status
```

### 3.3 Install Rspamd (Spam Filtering)

```bash
# Add Rspamd repository
sudo apt install -y lsb-release curl gpg
sudo curl -fsSL https://rspamd.com/apt-stable/gpg.key | sudo gpg --dearmor -o /usr/share/keyrings/rspamd.gpg

echo "deb [signed-by=/usr/share/keyrings/rspamd.gpg] http://rspamd.com/apt-stable/ $(lsb_release -cs) main" | \
    sudo tee /etc/apt/sources.list.d/rspamd.list

# Update and install
sudo apt update
sudo apt install -y rspamd redis-server

# Configure Rspamd
sudo tee -a /etc/rspamd/local.d/options.inc <<EOF
# Rspamd configuration
dns {
  nameserver = ["127.0.0.1"];
}
EOF

# Configure worker
sudo tee /etc/rspamd/local.d/worker-normal.inc <<EOF
worker {
    count = 1;
    max_requests = 1000;
}
EOF

# Configure milter
sudo tee /etc/rspamd/local.d/milter.conf <<EOF
bind_socket = "localhost:11332";
milter = yes;
max_requests = 1000;
timeout = 120s;
EOF

# Enable Rspamd
sudo systemctl enable rspamd redis-server
sudo systemctl start rspamd redis-server
sudo systemctl status rspamd
```

**Configure Postfix to use Rspamd**:
```bash
# Add to main.cf
sudo tee -a /etc/postfix/main.cf <<EOF

# Rspamd milter
smtpd_milters = inet:localhost:11332
non_smtpd_milters = inet:localhost:11332
milter_protocol = 6
milter_default_action = accept
EOF

# Restart Postfix
sudo systemctl restart postfix
```

### 3.4 Configure TLS

**Verify certificate ownership**:
```bash
sudo ls -la /etc/letsencrypt/live/ementech.co.ke/
```

**Test TLS configuration**:
```bash
# Test SMTP TLS
openssl s_client -connect localhost:25 -starttls smtp

# Test IMAPS
openssl s_client -connect localhost:993

# Test certificate
sudo openssl x509 -in /etc/letsencrypt/live/ementech.co.ke/fullchain.pem -text -noout
```

---

## 4. Phase 3: Webmail Installation (Day 3)

### 4.1 Install PHP and PHP-FPM

```bash
# Install PHP 8.3
sudo apt install -y php8.3-fpm php8.3 php8.3-common php8.3-mysql php8.3-xml php8.3-curl php8.3-gd php8.3-imagick php8.3-cli php8.3-imap php8.3-intl php8.3-json php8.3-mbstring php8.3-mysql php8.3-pspell php8.3-sqlite3 php8.3-tidy php8.3-xmlrpc php8.3-xsl php8.3-zip

# Verify PHP version
php -v
```

### 4.2 Download and Install Roundcube

```bash
# Download Roundcube
cd /tmp
wget https://github.com/roundcube/roundcubemail/releases/download/1.6.7/roundcubemail-1.6.7-complete.tar.gz

# Extract
tar -xzf roundcubemail-1.6.7-complete.tar.gz
sudo mv roundcubemail-1.6.7 /var/www/roundcube

# Set permissions
sudo chown -R www-data:www-data /var/www/roundcube
sudo chmod -R 755 /var/www/roundcube
```

### 4.3 Configure Roundcube

```bash
# Create database
sudo mkdir -p /var/www/roundcube/db
sudo chown www-data:www-data /var/www/roundcube/db

# Copy sample config
sudo cp /var/www/roundcube/config/config.inc.php.sample /var/www/roundcube/config/config.inc.php

# Edit config (minimal)
sudo sed -i "s/\$config\['db_dsnw'\] = '.*';/\$config['db_dsnw'] = 'sqlite:////var\/www\/roundcube\/db\/roundcube.db';/" /var/www/roundcube/config/config.inc.php

sudo sed -i "s/\$config\['default_host'\] = '.*';/\$config['default_host'] = 'ssl:\/\/localhost';/" /var/www/roundcube/config/config.inc.php

sudo sed -i "s/\$config\['smtp_server'\] = '.*';/\$config['smtp_server'] = 'tls:\/\/localhost';/" /var/www/roundcube/config/config.inc.php

sudo sed -i "s/\$config\['smtp_port'\] = 587;/\$config['smtp_port'] = 587;/" /var/www/roundcube/config/config.inc.php

sudo sed -i "s/\$config\['des_key'\] = '.*';/\$config['des_key'] = '$(openssl rand -base64 24)';/" /var/www/roundcube/config/config.inc.php

# Set product name
sudo sed -i "s/\$config\['product_name'\] = '.*';/\$config['product_name'] = 'EmenTech Webmail';/" /var/www/roundcube/config/config.inc.php

# Enable plugins (carddav, etc.)
sudo sed -i "s/\$config\['plugins'\] = \[.*\];/\$config['plugins'] = ['archive', 'zipdownload', 'markasjunk', 'newmail_notifier'];/" /var/www/roundcube/config/config.inc.php
```

### 4.4 Initialize Roundcube Database

```bash
cd /var/www/roundcube/bin

# Initialize database
sudo -u www-data php initdb.sh --dir=SQL

# Or manually
sudo -u www-data php /var/www/roundcube/bin/updatedb.sh --dir=SQL --package=roundcube
```

### 4.5 Configure nginx for Webmail

```bash
# Create webmail virtual host
sudo tee /etc/nginx/sites-available/webmail.ementech.co.ke <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name webmail.ementech.co.ke;

    # Redirect to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name webmail.ementech.co.ke;
    root /var/www/roundcube;
    index index.php index.html;

    # SSL certificate
    ssl_certificate /etc/letsencrypt/live/ementech.co.ke/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ementech.co.ke/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # PHP-FPM
    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/run/php/php8.3-fpm.sock;
        fastcgi_param SCRIPT_FILENAME \$document_root\$fastcgi_script_name;
        include fastcgi_params;
    }

    # Deny access to config and temp directories
    location ~ ^/(config|temp|logs)/ {
        deny all;
    }

    # Logging
    access_log /var/log/nginx/webmail.ementech.co.ke-access.log;
    error_log /var/log/nginx/webmail.ementech.co.ke-error.log;
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/webmail.ementech.co.ke /etc/nginx/sites-enabled/

# Test nginx config
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

### 4.6 Access Webmail

```bash
# Test access
curl -I https://webmail.ementech.co.ke

# Open in browser
# https://webmail.ementech.co.ke
```

**Login with**: ceo@ementech.co.ke (password set during user creation)

---

## 5. Phase 4: Email Authentication Setup (Day 4)

### 5.1 Configure SPF

**Add DNS TXT record**:
``ementech.co.ke.  IN  TXT  "v=spf1 mx a ip4:69.164.244.165 -all"```

**Verify SPF**:
```bash
# Check SPF record
dig ementech.co.ke TXT

# Test SPF
# Send email to check-auth@verifier.port25.com
# You'll receive a report
```

### 5.2 Configure DKIM

**Install OpenDKIM**:
```bash
sudo apt install -y opendkim opendkim-tools
```

**Generate DKIM keys**:
```bash
sudo mkdir -p /etc/postfix/dkim
cd /etc/postfix/dkim

# Generate key for ementech.co.ke
sudo opendkim-genkey -b 2048 -d ementech.co.ke -s ementech1 -r

# Set permissions
sudo chown opendkim:opendkim /etc/postfix/dkim/*
sudo chmod 600 /etc/postfix/dkim/*.private
sudo chmod 644 /etc/postfix/dkim/*.txt
```

**View DKIM public key**:
```bash
sudo cat /etc/postfix/dkim/ementech1.txt

# Output will be something like:
# ementech1._domainkey IN TXT "v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQ..."
```

**Add DNS TXT record** (use the key from above):
``ementech1._domainkey.ementech.co.ke.  IN  TXT  "v=DKIM1; k=rsa; p=<public-key>"``

**Configure OpenDKIM** (`/etc/opendkim.conf`):
```bash
sudo tee /etc/opendkim.conf <<EOF
Syslog                  yes
SyslogSuccess           yes
LogWhy                  yes
Canonicalization        relaxed/simple
Mode                    sv
PidFile                 /var/run/opendkim/opendkim.pid
Socket                  inet:12301@localhost
Umask                   022
UserID                  opendkim:opendkim

KeyTable                /etc/opendkim/key.table
SigningTable            refile:/etc/opendkim/signing.table
ExternalIgnoreList      /etc/opendkim/trusted.hosts
InternalHosts           /etc/opendkim/trusted.hosts
EOF
```

**Create key table** (`/etc/opendkim/key.table`):
```bash
sudo tee /etc/opendkim/key.table <<EOF
ementech1._domainkey.ementech.co.ke ementech.co.ke:ementech1:/etc/postfix/dkim/ementech1.private
EOF
```

**Create signing table** (`/etc/opendkim/signing.table`):
```bash
sudo tee /etc/opendkim/signing.table <<EOF
*@ementech.co.ke ementech1._domainkey.ementech.co.ke
EOF
```

**Create trusted hosts** (`/etc/opendkim/trusted.hosts`):
```bash
sudo tee /etc/opendkim/trusted.hosts <<EOF
127.0.0.1
localhost
*.ementech.co.ke
EOF
```

**Configure Postfix to use OpenDKIM** (`/etc/postfix/main.cf`):
```bash
sudo tee -a /etc/postfix/main.cf <<EOF

# OpenDKIM
milter_protocol = 6
milter_default_action = accept
smtpd_milters = inet:localhost:12301,inet:localhost:11332
non_smtpd_milters = inet:localhost:12301,inet:localhost:11332
EOF
```

**Restart services**:
```bash
sudo systemctl restart opendkim postfix
sudo systemctl enable opendkim
```

**Verify DKIM signing**:
```bash
# Send test email
echo "DKIM test" | mail -s "DKIM test" ceo@ementech.co.ke

# Check headers
sudo tail -f /var/log/mail.log | grep -i dkim
```

### 5.3 Configure DMARC

**Add DNS TXT record**:
``_dmarc.ementech.co.ke.  IN  TXT  "v=DMARC1; p=reject; rua=mailto:dmarc@ementech.co.ke; ruf=mailto:dmarc@ementech.co.ke; aspf=s; adkim=s; pct=100; ri=86400"```

**Create dmarc@ementech.co.ke alias**:
```bash
sudo sqlite3 /etc/postfix/virtual_mailboxes.db "INSERT INTO aliases (source, destination, domain, active) VALUES ('dmarc@ementech.co.ke', 'admin@ementech.co.ke', 'ementech.co.ke', 1);"
```

**Verify DMARC**:
```bash
# Check DMARC record
dig _dmarc.ementech.co.ke TXT
```

---

## 6. Phase 5: Monitoring and Backup (Day 5)

### 6.1 Configure Logwatch

```bash
# Install Logwatch
sudo apt install -y logwatch

# Configure daily report
sudo tee /etc/cron.daily/00logwatch <<EOF
#!/bin/bash
/usr/sbin/logwatch --output mail --mailto admin@ementech.co.ke --detail high
EOF

sudo chmod +x /etc/cron.daily/00logwatch
```

### 6.2 Configure Monitoring Script

**Create monitoring script** (`/usr/local/bin/check-mail-system.sh`):
```bash
sudo tee /usr/local/bin/check-mail-system.sh <<'EOF'
#!/bin/bash

ALERT_EMAIL="admin@ementech.co.ke"
HOSTNAME=$(hostname)

# Check queue
QUEUE_SIZE=$(mailq | tail -n 1 | awk '{print $5}')
if [ -n "$QUEUE_SIZE" ] && [ "$QUEUE_SIZE" -gt 1000 ]; then
    echo "Mail queue full: $QUEUE_SIZE messages" | mail -s "[$HOSTNAME] Mail Alert: Queue full" $ALERT_EMAIL
fi

# Check services
if ! systemctl is-active --quiet postfix; then
    echo "Postfix is down!" | mail -s "[$HOSTNAME] Critical: Postfix down" $ALERT_EMAIL
fi

if ! systemctl is-active --quiet dovecot; then
    echo "Dovecot is down!" | mail -s "[$HOSTNAME] Critical: Dovecot down" $ALERT_EMAIL
fi

# Check disk space
DISK_USAGE=$(df /var/vmail | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 90 ]; then
    echo "Mail storage at ${DISK_USAGE}% capacity" | mail -s "[$HOSTNAME] Critical: Disk full" $ALERT_EMAIL
fi

# Check RAM usage
RAM_USAGE=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
if [ "$RAM_USAGE" -gt 90 ]; then
    echo "RAM usage at ${RAM_USAGE}%" | mail -s "[$HOSTNAME] Alert: High RAM usage" $ALERT_EMAIL
fi
EOF

sudo chmod +x /usr/local/bin/check-mail-system.sh
```

**Add to cron** (every 5 minutes):
```bash
(sudo crontab -l 2>/dev/null; echo "*/5 * * * * /usr/local/bin/check-mail-system.sh") | sudo crontab -
```

### 6.3 Configure Backup Script

**Create backup script** (`/usr/local/bin/backup-mail.sh`):
```bash
sudo tee /usr/local/bin/backup-mail.sh <<'EOF'
#!/bin/bash

DATE=$(date +%Y%m%d)
BACKUP_DIR="/backup/mail"
REMOTE_USER=""  # Set your remote user
REMOTE_HOST=""  # Set your remote host

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup database
cp /etc/postfix/virtual_mailboxes.db "$BACKUP_DIR/virtual_mailboxes-$DATE.db"

# Backup configuration
tar -czf "$BACKUP_DIR/config-$DATE.tar.gz" /etc/postfix /etc/dovecot

# Backup DKIM keys
tar -czf "$BACKUP_DIR/dkim-$DATE.tar.gz" /etc/postfix/dkim

# Keep last 30 days
find "$BACKUP_DIR" -name "*.db" -mtime +30 -delete
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +30 -delete

# Optional: Transfer to remote server
if [ -n "$REMOTE_HOST" ]; then
    rsync -av --delete "$BACKUP_DIR/" $REMOTE_USER@$REMOTE_HOST:/backup/ementech/mail/
fi

echo "Backup completed: $DATE"
EOF

sudo chmod +x /usr/local/bin/backup-mail.sh
```

**Add to cron** (daily at 2 AM):
```bash
(sudo crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-mail.sh >> /var/log/mail-backup.log 2>&1") | sudo crontab -
```

### 6.4 Create User Management Scripts

See `email-server-data-model.md` section 5 for complete scripts:
- `/usr/local/bin/add-mail-user.sh`
- `/usr/local/bin/delete-mail-user.sh`
- `/usr/local/bin/change-mail-password.sh`
- `/usr/local/bin/list-mail-users.sh`
- `/usr/local/bin/add-mail-alias.sh`

---

## 7. Testing Procedures

### 7.1 Test SMTP

```bash
# Test SMTP (port 25)
telnet localhost 25
# Commands: EHLO localhost, MAIL FROM:, RCPT TO:, DATA, .

# Test SMTP submission (port 587)
openssl s_client -connect localhost:587 -starttls smtp -crlf
```

### 7.2 Test IMAP

```bash
# Test IMAPS (port 993)
openssl s_client -connect localhost:993

# Login test
doveadm auth test ceo@ementech.co.ke
```

### 7.3 Test Email Flow

**Send test email**:
```bash
echo "Test body" | mail -s "Test subject" ceo@ementech.co.ke
```

**Check delivery**:
```bash
# Check maildir
ls -la /var/vmail/ementech.co.ke/ceo/new/

# Check logs
sudo tail -f /var/log/mail.log
```

**External test**:
```bash
# Send to Gmail
echo "External test" | mail -s "Test to Gmail" your-email@gmail.com

# Receive from Gmail (send from Gmail to ceo@ementech.co.ke)
```

### 7.4 Test Webmail

1. Open https://webmail.ementech.co.ke
2. Login with ceo@ementech.co.ke
3. Compose and send email
4. Check inbox
5. Test attachments

### 7.5 Test Spam Filter

**Send GTUBE test** (should be marked as spam):
```bash
echo 'XJS*C4JDBQADN1.NSBN3*2IDNEN*GTUBE-STANDARD-ANTI-UBE-TEST-EMAIL*C.34X' | \
    mail -s "GTUBE" ceo@ementech.co.ke

# Check headers
sudo tail -f /var/log/mail.log | grep -i rspamd
```

### 7.6 Test Authentication

**SPF test**: Send to check-auth@verifier.port25.com
**DKIM test**: Check headers of sent email
**DMARC test**: Send to mailto:check-dmarc@eff.org

---

## 8. Troubleshooting

### 8.1 Service Issues

**Postfix won't start**:
```bash
sudo postfix check
sudo journalctl -u postfix -n 50
sudo tail -f /var/log/mail.log
```

**Dovecot won't start**:
```bash
sudo dovecot -n
sudo journalctl -u dovecot -n 50
sudo tail -f /var/log/mail.log | grep dovecot
```

**Rspamd issues**:
```bash
sudo systemctl status rspamd redis
sudo journalctl -u rspamd -n 50
sudo rspamc stat
```

### 8.2 Email Delivery Issues

**Email not received**:
```bash
# Check MX records
dig ementech.co.ke MX

# Check if listening
sudo ss -tlnp | grep :25

# Check logs
sudo tail -f /var/log/mail.log

# Check queue
sudo mailq
```

**Email not sending**:
```bash
# Check if authenticated
sudo tail -f /var/log/mail.log | grep sasl

# Check relay
sudo postconf | grep relay

# Test delivery
echo "test" | mail -s "test" external@example.com
```

### 8.3 Authentication Issues

**Password authentication fails**:
```bash
# Test password hash
doveadm pw -s SHA512-CRYPT -p "password" -t "$hash"

# Check database
sudo sqlite3 /etc/postfix/virtual_mailboxes.db "SELECT email, password FROM users WHERE email='ceo@ementech.co.ke';"

# Check Dovecot auth
sudo doveadm auth test ceo@ementech.co.ke password
```

### 8.4 Performance Issues

**High RAM usage**:
```bash
# Check memory
free -h

# Check processes
ps aux --sort=-%mem | head -20

# Tune Postfix/Dovecot limits
sudo nano /etc/postfix/main.cf
sudo nano /etc/dovecot/dovecot.conf
```

**Slow delivery**:
```bash
# Check queue processing
sudo postconf | grep queue

# Flush queue
sudo postqueue -f

# Check DNS
dig ementech.co.ke MX
```

### 8.5 Common Errors

**"Relay access denied"**: Authentication required, use port 587 with TLS
**"SASL authentication failed"**: Wrong password or SASL misconfigured
**"Certificate error"**: SSL certificate expired or misconfigured
**"Mailbox full"**: Quota exceeded, increase or clean up
**"Connection timed out"**: Firewall blocking, check ufw status

---

## 9. Post-Installation Checklist

- [ ] Postfix installed and running
- [ ] Dovecot installed and running
- [ ] Can send email locally
- [ ] Can receive email locally
- [ ] Can send email externally
- [ ] Can receive email externally
- [ ] TLS/SSL working (port 587, 993, 995)
- [ ] Webmail accessible
- [ ] Rspamd filtering spam
- [ ] SPF record configured
- [ ] DKIM signing working
- [ ] DMARC record configured
- [ ] Firewall configured
- [ ] Fail2ban running
- [ ] Backup script configured
- [ ] Monitoring script configured
- [ ] Logwatch configured
- [ ] Documentation complete

---

## 10. Next Steps

1. **User Training**: Train users on webmail and email client setup
2. **Documentation**: Create user guides and admin procedures
3. **Monitoring**: Review logs and alerts regularly
4. **Optimization**: Tune performance based on usage
5. **Scaling**: Plan for growth when needed

---

**Document Version**: 1.0
**Last Updated**: 2026-01-19
**Implementation Timeline**: 5 days (1 week)
