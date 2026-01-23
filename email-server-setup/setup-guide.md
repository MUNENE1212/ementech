# Ementech Email Server Setup Guide

## Overview
Complete self-hosted email server setup for ementech.co.ke domain using Postfix, Dovecot, and Roundcube webmail.

## System Requirements
- **VPS:** 69.164.244.165
- **OS:** Ubuntu 24.04.3 LTS
- **RAM:** 2GB (1.2GB available)
- **Disk:** 29GB available
- **Domain:** ementech.co.ke

## Email Accounts (5 users)
1. CEO@ementech.co.ke - Leadership
2. info@ementech.co.ke - General inquiries
3. support@ementech.co.ke - Customer support
4. admin@ementech.co.ke - System administration
5. tech@ementech.co.ke - Technical team

## Architecture

### Software Components
- **Postfix:** SMTP server for sending emails
- **Dovecot:** IMAP/POP3 server for receiving emails
- **Roundcube:** Webmail interface
- **SpamAssassin:** Spam filtering
- **rspamd:** Advanced spam filtering (lighter than SpamAssassin)
- **PostgreSQL:** User database
- **Let's Encrypt:** SSL/TLS certificates

### Ports Required
- **25:** SMTP (receiving emails from other servers)
- **587:** SMTP submission (authenticated sending)
- **465:** SMTPS (SMTP over SSL)
- **143:** IMAP (authenticated reading)
- **993:** IMAPS (IMAP over SSL)
- **110:** POP3 (authenticated downloading)
- **995:** POP3S (POP3 over SSL)
- **80/443:** Webmail interface

## Phase 1: System Preparation

### 1.1 Set Hostname
```bash
hostnamectl set-hostname ementech-vps.ementech.co.ke
echo "ementech-vps.ementech.co.ke" > /etc/hostname
echo "69.164.244.165 ementech-vps.ementech.co.ke ementech-vps" >> /etc/hosts
```

### 1.2 Configure Mailname
```bash
echo "ementech.co.ke" > /etc/mailname
```

### 1.3 Update System
```bash
apt update && apt upgrade -y
apt install -y curl wget git vim htop net-tools
```

## Phase 2: DNS Records Configuration

### Add these records to your domain registrar (ementech.co.ke):

```
# MX Records (Priority 10 for primary)
ementech.co.ke.          IN MX 10 mail.ementech.co.ke.
mail.ementech.co.ke.     IN A 69.164.244.165

# A Records for mail subdomains
mail.ementech.co.ke.     IN A 69.164.244.165
smtp.ementech.co.ke.     IN A 69.164.244.165
imap.ementech.co.ke.     IN A 69.164.244.165

# SPF Record ( TXT)
ementech.co.ke.          IN TXT "v=spf1 mx a ip4:69.164.244.165 ~all"

# DKIM Record (will be generated after installation)
# Default._domainkey.ementech.co.ke. IN TXT "v=DKIM1; k=rsa; p=<YOUR_PUBLIC_KEY>"

# DMARC Record
_dmarc.ementech.co.ke.   IN TXT "v=DMARC1; p=quarantine; rua=mailto:admin@ementech.co.ke; ruf=mailto:admin@ementech.co.ke; sp=none; aspf=s; adkim=s"

# SRV Records (optional but recommended)
_submission._tcp.ementech.co.ke. IN SRV 0 0 587 mail.ementech.co.ke.
_imaps._tcp.ementech.co.ke.     IN SRV 0 0 993 mail.ementech.co.ke.
_pop3s._tcp.ementech.co.ke.     IN SRV 0 0 995 mail.ementech.co.ke.
```

**Note:** Replace `<YOUR_PUBLIC_KEY>` with the actual DKIM public key after installation.

## Phase 3: Install Core Mail Software

### 3.1 Install PostgreSQL for Virtual Users
```bash
apt install -y postgresql postgresql-contrib
systemctl start postgresql
systemctl enable postgresql
```

### 3.2 Create Database and User
```bash
sudo -u postgres psql <<EOF
CREATE USER mailserver WITH PASSWORD 'secure_password_here';
CREATE DATABASE mailserver_db OWNER mailserver;
\c mailserver_db
-- Core tables will be created by setup script
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO mailserver;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO mailserver;
EOF
```

### 3.3 Install Postfix and Dovecot
```bash
# Install packages
DEBIAN_PRIORITY=low apt install -y postfix postfix-pgsql dovecot-core dovecot-imapd dovecot-pop3d dovecot-pgsql dovecot-sieve dovecot-lmtpd dovecot-managesieved

# Select "Internet Site" during Postfix installation
# System mail name: ementech.co.ke
```

### 3.4 Install Additional Packages
```bash
apt install -y opendkim opendkim-tools opendmarc spamassassin rspamd fail2ban certbot python3-certbot-nginx
```

## Phase 4: Database Schema Setup

### Create SQL setup script `/tmp/mail_db_setup.sql`:

```sql
-- Domain table
CREATE TABLE domains (
    id SERIAL PRIMARY KEY,
    domain VARCHAR(255) NOT NULL UNIQUE
);

-- Email accounts
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(128) NOT NULL UNIQUE,
    domain_id INTEGER NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    quota BIGINT DEFAULT 1073741824, -- 1GB default
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Email aliases/forwarding
CREATE TABLE aliases (
    id SERIAL PRIMARY KEY,
    domain_id INTEGER NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
    source VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(domain_id, source)
);

-- Insert domain
INSERT INTO domains (domain) VALUES ('ementech.co.ke');
```

Apply the schema:
```bash
sudo -u postgres psql mailserver_db < /tmp/mail_db_setup.sql
```

## Phase 5: Postfix Configuration

### 5.1 Main Configuration (`/etc/postfix/main.cf`)

```bash
# Backup original
cp /etc/postfix/main.cf /etc/postfix/main.cf.backup

# Create new main.cf
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

# Virtual transport
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
```

### 5.2 PostgreSQL Map Files

Create `/etc/postfix/pgsql-virtual-mailbox-domains.cf`:
```bash
cat > /etc/postfix/pgsql-virtual-mailbox-domains.cf <<'EOF'
user = mailserver
password = secure_password_here
hosts = 127.0.0.1
dbname = mailserver_db
query = SELECT 1 FROM domains WHERE domain='%s'
EOF
```

Create `/etc/postfix/pgsql-virtual-mailbox-maps.cf`:
```bash
cat > /etc/postfix/pgsql-virtual-mailbox-maps.cf <<'EOF'
user = mailserver
password = secure_password_here
hosts = 127.0.0.1
dbname = mailserver_db
query = SELECT 1 FROM users WHERE email='%s'
EOF
```

Create `/etc/postfix/pgsql-virtual-alias-maps.cf`:
```bash
cat > /etc/postfix/pgsql-virtual-alias-maps.cf <<'EOF'
user = mailserver
password = secure_password_here
hosts = 127.0.0.1
dbname = mailserver_db
query = SELECT destination FROM aliases WHERE source='%s' AND active = true
EOF
```

### 5.3 Master Configuration (`/etc/postfix/master.cf`)

```bash
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
```

## Phase 6: Dovecot Configuration

### 6.1 Main Configuration (`/etc/dovecot/dovecot.conf`)

```bash
cat > /etc/dovecot/dovecot.conf <<'EOF'
# Default settings
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

# Namespaces
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

# SQL configuration
!include conf.d/sql.conf
EOF
```

### 6.2 Mail Configuration (`/etc/dovecot/conf.d/10-mail.conf`)

```bash
cat > /etc/dovecot/conf.d/10-mail.conf <<'EOF'
mail_location = maildir:/var/mail/vhosts/%d/%n
mail_privileged_group = vmail

# Namespace setup
namespace {
  type = private
  separator = /
  prefix =
  inbox = yes
}

# Mailbox directories
maildir_stat_shared_dirs = yes

# Permissions
first_valid_uid = 150
last_valid_uid = 150
first_valid_gid = 150
last_valid_gid = 150
EOF
```

### 6.3 Authentication Configuration (`/etc/dovecot/conf.d/10-auth.conf`)

```bash
cat > /etc/dovecot/conf.d/10-auth.conf <<'EOF'
disable_plaintext_auth = yes
auth_mechanisms = plain login

!include auth-deny.conf.ext
!include auth-master.conf.ext

!include auth-sql.conf.ext
EOF
```

### 6.4 SQL Authentication (`/etc/dovecot/conf.d/auth-sql.conf.ext`)

```bash
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
```

### 6.5 SQL Configuration (`/etc/dovecot/dovecot-sql.conf.ext`)

```bash
cat > /etc/dovecot/dovecot-sql.conf.ext <<'EOF'
driver = pgsql
connect = host=127.0.0.1 dbname=mailserver_db user=mailserver password=secure_password_here

# Password query
password_query = \
  SELECT email as user, password FROM users WHERE email = '%u'

# User query
user_query = \
  SELECT email as user, \
  '/var/mail/vhosts/%d/%n' as home, \
  'maildir:/var/mail/vhosts/%d/%n' as mail, \
  150 as uid, \
  150 as gid, \
  '*:storage=%G' as quota_rule

# Iterate query
iterate_query = \
  SELECT email as user FROM users
EOF

chmod 640 /etc/dovecot/dovecot-sql.conf.ext
chown root:dovecot /etc/dovecot/dovecot-sql.conf.ext
```

### 6.6 Master Configuration (`/etc/dovecot/conf.d/10-master.conf`)

```bash
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
```

### 6.7 LDA Configuration (`/etc/dovecot/conf.d/15-lda.conf`)

```bash
cat > /etc/dovecot/conf.d/15-lda.conf <<'EOF'
protocol lda {
  mail_plugins = $mail_plugins sieve
  postmaster_address = postmaster@ementech.co.ke
  hostname = ementech.co.ke
  sendmail_path = /usr/sbin/sendmail
  lda_mailbox_autocreate = yes
}
EOF
```

## Phase 7: Create Virtual Mail User

```bash
# Create system user for virtual mail
groupadd -g 150 vmail
useradd -g vmail -u 150 vmail -d /var/mail -s /usr/sbin/nologin
mkdir -p /var/mail/vhosts/ementech.co.ke
chown -R vmail:vmail /var/mail
chmod -R 770 /var/mail
```

## Phase 8: DKIM Configuration

### 8.1 Generate DKIM Keys

```bash
mkdir -p /etc/opendkim/keys/ementech.co.ke
cd /etc/opendkim/keys/ementech.co.ke
opendkim-genkey -s mail -d ementech.co.ke
mv mail.private default.private
mv mail.txt default.txt

# Set permissions
chown -R opendkim:opendkim /etc/opendkim
chmod 600 /etc/opendkim/keys/ementech.co.ke/default.private
chmod 644 /etc/opendkim/keys/ementech.co.ke/default.txt
```

### 8.2 Configure OpenDKIM (`/etc/opendkim.conf`)

```bash
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
```

### 8.3 Create Signing Table

```bash
cat > /etc/opendkim/signing.table <<'EOF'
*@ementech.co.ke default._domainkey.ementech.co.ke
EOF

cat > /etc/opendkim/key.table <<'EOF'
default._domainkey.ementech.co.ke ementech.co.ke:default:/etc/opendkim/keys/ementech.co.ke/default.private
EOF

cat > /etc/opendkim/trusted.hosts <<'EOF'
127.0.0.1
localhost
*.ementech.co.ke
EOF
```

### 8.4 Get DKIM DNS Record

```bash
cat /etc/opendkim/keys/ementech.co.ke/default.txt
```

This will output something like:
```
mail._domainkey IN TXT "v=DKIM1; k=rsa; p=MIGfMA0GCQ...<long key>...IDAQAB"
```

Add this as a TXT record at `default._domainkey.ementech.co.ke`

## Phase 9: Configure rspamd (Lightweight Spam Filtering)

### 9.1 Install rspamd

```bash
apt install -y rspamd redis-server
systemctl enable redis-server
systemctl start redis-server
```

### 9.2 Configure rspamd to work with Postfix

Edit `/etc/rspamd/local.d/worker-proxy.inc`:
```bash
cat > /etc/rspamd/local.d/worker-proxy.inc <<'EOF'
bind_socket = "127.0.0.1:65265";
milter = yes;
timeout = 120s;
EOF
```

### 9.3 Configure dkim-signing module

```bash
cat > /etc/rspamd/local.d/dkim_signing.conf <<'EOF'
domain {
  ementech.co.ke {
    path = "/etc/opendkim/keys/ementech.co.ke/default.private";
    selector = "default";
  }
}
selector_map = "/etc/rspamd/dkim_selectors.map";
EOF
```

### 9.4 Configure spam score limits

```bash
cat > /etc/rspamd/local.d/actions.conf <<'EOF'
subject = "SPAM: %s";
greylist = 4;
reject = 15;
rewrite_subject = 6;
EOF
```

Enable and start rspamd:
```bash
systemctl enable rspamd
systemctl start rspamd
```

## Phase 10: SSL Certificates

### 10.1 Create Nginx Configuration for ACME Challenge

```bash
mkdir -p /var/www/html/mail.ementech.co.ke
```

### 10.2 Obtain Certificates

```bash
# Obtain certificate for mail.ementech.co.ke
certbot certonly --webroot -w /var/www/html --email admin@ementech.co.ke --agree-tos --no-eff-email -d mail.ementech.co.ke
```

The certificates will be stored at:
- `/etc/letsencrypt/live/mail.ementech.co.ke/fullchain.pem`
- `/etc/letsencrypt/live/mail.ementech.co.ke/privkey.pem`

## Phase 11: Firewall Configuration

```bash
# Allow email ports
ufw allow 25/tcp    comment 'SMTP'
ufw allow 587/tcp   comment 'SMTP Submission'
ufw allow 465/tcp   comment 'SMTPS'
ufw allow 143/tcp   comment 'IMAP'
ufw allow 993/tcp   comment 'IMAPS'
ufw allow 110/tcp   comment 'POP3'
ufw allow 995/tcp   comment 'POP3S'

# Reload firewall
ufw reload
ufw status numbered
```

## Phase 12: Create Email Accounts

### 12.1 Generate Password Hashes

```bash
# Install doveadm
apt install -y dovecot-core

# Generate password hashes for each user
# Replace PASSWORD with actual strong passwords
doveadm pw -s SHA512-CRYPT -p "STRONG_PASSWORD_1"  # CEO
doveadm pw -s SHA512-CRYPT -p "STRONG_PASSWORD_2"  # info
doveadm pw -s SHA512-CRYPT -p "STRONG_PASSWORD_3"  # support
doveadm pw -s SHA512-CRYPT -p "STRONG_PASSWORD_4"  # admin
doveadm pw -s SHA512-CRYPT -p "STRONG_PASSWORD_5"  # tech
```

### 12.2 Insert Users into Database

```bash
# Create SQL file with user inserts
cat > /tmp/create_users.sql <<'EOF'
-- CEO account
INSERT INTO users (user_id, domain_id, password, email) VALUES
('ceo', 1, 'SHA512_HASH_1', 'ceo@ementech.co.ke');

-- info account
INSERT INTO users (user_id, domain_id, password, email) VALUES
('info', 1, 'SHA512_HASH_2', 'info@ementech.co.ke');

-- support account
INSERT INTO users (user_id, domain_id, password, email) VALUES
('support', 1, 'SHA512_HASH_3', 'support@ementech.co.ke');

-- admin account
INSERT INTO users (user_id, domain_id, password, email) VALUES
('admin', 1, 'SHA512_HASH_4', 'admin@ementech.co.ke');

-- tech account
INSERT INTO users (user_id, domain_id, password, email) VALUES
('tech', 1, 'SHA512_HASH_5', 'tech@ementech.co.ke');

-- Alias: postmaster -> admin
INSERT INTO aliases (domain_id, source, destination) VALUES
(1, 'postmaster@ementech.co.ke', 'admin@ementech.co.ke');

-- Alias: abuse -> admin
INSERT INTO aliases (domain_id, source, destination) VALUES
(1, 'abuse@ementech.co.ke', 'admin@ementech.co.ke');

-- Alias: webmaster -> tech
INSERT INTO aliases (domain_id, source, destination) VALUES
(1, 'webmaster@ementech.co.ke', 'tech@ementech.co.ke');
EOF

# Apply to database
sudo -u postgres psql mailserver_db < /tmp/create_users.sql
```

### 12.3 Create Mail Directories

```bash
for user in ceo info support admin tech; do
  mkdir -p /var/mail/vhosts/ementech.co.ke/$user
  chown -R vmail:vmail /var/mail/vhosts/ementech.co.ke/$user
  chmod -R 770 /var/mail/vhosts/ementech.co.ke/$user
done
```

## Phase 13: Roundcube Webmail Installation

### 13.1 Install Dependencies

```bash
apt install -y roundcube roundcube-core roundcube-sqlite3 roundcube-plugins php-php-sqlite3
```

During installation:
- Select "sqlite3" as database type
- Configure database for roundcube: Yes
- Application password: (auto-generated)

### 13.2 Configure Roundcube

Edit `/etc/roundcube/config.inc.php`:
```bash
# Add to config.inc.php
echo "\$config['default_host'] = 'tls://mail.ementech.co.ke';" >> /etc/roundcube/config.inc.php
echo "\$config['smtp_server'] = 'tls://mail.ementech.co.ke';" >> /etc/roundcube/config.inc.php
echo "\$config['smtp_port'] = 587;" >> /etc/roundcube/config.inc.php
echo "\$config['smtp_user'] = '%u';" >> /etc/roundcube/config.inc.php
echo "\$config['smtp_pass'] = '%p';" >> /etc/roundcube/config.inc.php
echo "\$config['force_https'] = true;" >> /etc/roundcube/config.inc.php
echo "\$config['plugins'] = ['archive', 'zipdownload', 'markasjunk', 'newmail_notifier', 'emoticons');" >> /etc/roundcube/config.inc.php
```

### 13.3 Configure Nginx for Roundcube

```bash
cat > /etc/nginx/sites-available/mail.ementech.co.ke <<'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name mail.ementech.co.ke;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name mail.ementech.co.ke;

    root /var/lib/roundcube;
    index index.php index.html;

    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/mail.ementech.co.ke/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/mail.ementech.co.ke/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-Frame-Options SAMEORIGIN always;

    # Logs
    access_log /var/log/nginx/mail.ementech.co.ke-access.log;
    error_log /var/log/nginx/mail.ementech.co.ke-error.log;

    # Roundcube configuration
    location / {
        try_files $uri $uri/ /index.php?$args;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/run/php/php-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
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
ln -s /etc/nginx/sites-available/mail.ementech.co.ke /etc/nginx/sites-enabled/

# Test nginx configuration
nginx -t

# Reload nginx
systemctl reload nginx
```

## Phase 14: Services Restart and Verification

```bash
# Restart all services
systemctl restart postfix
systemctl restart dovecot
systemctl restart opendkim
systemctl restart rspamd
systemctl restart nginx

# Enable services to start on boot
systemctl enable postfix
systemctl enable dovecot
systemctl enable opendkim
systemctl enable rspamd

# Check service status
systemctl status postfix --no-pager
systemctl status dovecot --no-pager
systemctl status opendkim --no-pager
systemctl status rspamd --no-pager
```

## Phase 15: Testing and Verification

### 15.1 Test DNS Resolution

```bash
# Test MX record
dig +short MX ementech.co.ke

# Test SPF record
dig +short TXT ementech.co.ke

# Test DKIM record
dig +short TXT default._domainkey.ementech.co.ke

# Test DMARC record
dig +short TXT _dmarc.ementech.co.ke
```

### 15.2 Test SMTP (Port 25)

```bash
telnet localhost 25
# Should see: 220 ementech-vps.ementech.co.ke ESMTP Postfix
# Type: quit
```

### 15.3 Test SMTP Submission (Port 587)

```bash
telnet localhost 587
# Should see: 220 ementech-vps.ementech.co.ke ESMTP Postfix
# Type: quit
```

### 15.4 Test IMAP (Port 993)

```bash
telnet localhost 993
# Should see encrypted connection (gibberish)
# Press Ctrl+] then 'quit'
```

### 15.5 Test Email Delivery

Send test email from command line:
```bash
echo "Test email body" | mail -s "Test Subject" admin@ementech.co.ke
```

Check mail logs:
```bash
tail -f /var/log/mail.log
tail -f /var/log/dovecot.log
```

### 15.6 Test Webmail Access

Open browser: https://mail.ementech.co.ke

Login with:
- Email: admin@ementech.co.ke
- Password: [your_password]

Send test email to external account (Gmail, Outlook).

### 15.7 Check Email Headers

When you receive test email, check headers for:
```
X-Spam-Status
Authentication-Results
DKIM-Signature
Received-SPF
```

## Phase 16: Monitoring and Maintenance

### 16.1 Install Monitoring Tools

```bash
# Install logwatch
apt install -y logwatch

# Configure logwatch
echo "Range = yesterday" > /etc/cron.daily/00logwatch
echo "Detail = high" >> /etc/cron.daily/00logwatch
echo "MailTo = admin@ementech.co.ke" >> /etc/cron.daily/00logwatch
```

### 16.2 Configure Log Rotation

```bash
cat > /etc/logrotate.d/mail-server <<'EOF'
/var/log/mail.log /var/log/mail.err /var/log/mail.info {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    sharedscripts
    postrotate
        systemctl reload postfix >/dev/null 2>&1 || true
        systemctl reload dovecot >/dev/null 2>&1 || true
    endscript
}
EOF
```

### 16.3 Backup Script

```bash
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

# Add to cron (daily at 2 AM)
echo "0 2 * * * root /usr/local/bin/backup-mail.sh" > /etc/cron.d/mail-backup
```

### 16.4 Performance Monitoring

```bash
# Install tools
apt install -y htop iotop

# Monitor mail queue size
alias mailq='mailq | tail -n 1'

# Check connection counts
alias mailconn="ss -ant | grep -E ':25|:587|:993' | wc -l"
```

## Troubleshooting Guide

### Common Issues

#### 1. Emails not sending

Check logs:
```bash
tail -f /var/log/mail.log
```

Common causes:
- SPF/DKIM records missing
- Port 25 blocked by ISP
- Firewall blocking connections
- Invalid recipient address

#### 2. Authentication failures

Check Dovecot logs:
```bash
tail -f /var/log/dovecot.log
```

Verify password hash format:
```bash
sudo -u postgres psql mailserver_db -c "SELECT email, password FROM users WHERE email='admin@ementech.co.ke';"
```

#### 3. High memory usage

With 2GB RAM, monitor usage:
```bash
free -h
ps aux --sort=-%mem | head -10
```

Consider disabling ClamAV if memory issues persist.

#### 4. Spam folder issues

Check rspamd scores:
```bash
grep "score=" /var/log/mail.log | tail -20
```

Adjust spam scores in `/etc/rspamd/local.d/actions.conf`

#### 5. Certificate renewal

Let's Encrypt certificates auto-renew, but verify:
```bash
certbot renew --dry-run
```

Add to crontab:
```bash
echo "0 0 * * * root certbot renew --quiet --post-hook 'systemctl reload postfix dovecot nginx'" > /etc/cron.d/certbot-renew
```

### Log Locations

- **Postfix:** `/var/log/mail.log`
- **Dovecot:** `/var/log/dovecot.log`, `/var/log/dovecot-info.log`
- **OpenDKIM:** `/var/log/syslog` (grep opendkim)
- **rspamd:** `/var/log/rspamd/rspamd.log`
- **Nginx:** `/var/log/nginx/mail.ementech.co.ke-*.log`
- **Roundcube:** `/var/log/roundcube/errors`

### Useful Commands

```bash
# View mail queue
postqueue -p

# Flush mail queue
postqueue -f

# Remove all mail from queue
postsuper -d ALL

# Check what's in queue
mailq

# Test Postfix configuration
postfix check

# Test Dovecot configuration
doveconf -n

# Reload configs without restart
postfix reload
dovecot reload

# Check if ports are listening
ss -tlnp | grep -E ':25|:587|:993|:995'

# Check authentication
doveadm auth test -x service=imap admin@ementech.co.ke

# Check user's mailbox
doveadm mailbox list -u admin@ementech.co.ke

# View detailed connection info
doveadm log find
```

## Security Checklist

- [ ] Strong passwords for all email accounts (min 16 chars with special chars)
- [ ] SSL certificates valid for all subdomains
- [ ] Firewall rules configured correctly
- [ ] Fail2ban enabled and configured
- [ ] DKIM signing working
- [ ] SPF, DMARC records published
- [ ] No plaintext authentication allowed
- [ ] Rate limiting configured in Postfix
- [ ] Regular backups configured
- [ ] Log monitoring in place
- [ ] System updated regularly: `apt update && apt upgrade -y`
- [ ] Unused services disabled
- [ ] Root login disabled via SSH (use key-based auth)

## Maintenance Tasks

### Daily
- Check mail queue: `mailq`
- Monitor logs: `tail -f /var/log/mail.log`
- Check disk space: `df -h`
- Check memory: `free -h`

### Weekly
- Review spam filter effectiveness
- Check for bounced emails
- Verify backup completion
- Review system logs for errors

### Monthly
- Test email sending to major providers
- Update system packages
- Review and clean spam folders
- Check SSL certificate expiry
- Test restoration from backup

### Quarterly
- Review and update spam filter rules
- Audit email accounts
- Check IP reputation (https://mxtoolbox.com)
- Review security settings
- Performance tuning

## Additional Resources

### DNS Propagation Check
- https://www.whatsmydns.net/
- https://dnschecker.org/

### Email Testing
- https://www.mail-tester.com/
- https://mxtoolbox.com/
- https://www.dmarcanalyzer.com/

### IP Reputation
- https://mxtoolbox.com/blacklists.aspx
- https://www.senderbase.org/

### SSL Testing
- https://www.ssllabs.com/ssltest/

## Important Notes

### Warnings

1. **Email Deliverability**: New servers are often flagged as spam. Warming up your IP takes 2-4 weeks.

2. **Resource Constraints**: With 2GB RAM, monitor memory closely. Consider:
   - Using rspamd instead of SpamAssassin (lighter)
   - Skipping ClamAV if memory issues
   - Optimizing PostgreSQL settings

3. **Security Risks**:
   - Email servers are prime targets
   - Keep all software updated
   - Monitor logs daily
   - Use strong, unique passwords
   - Enable fail2ban

4. **Maintenance**:
   - Email servers require constant attention
   - Check spam filters regularly
   - Review bounce logs
   - Update DNS records if IP changes

5. **Backup Critical**:
   - Back up configs and database daily
   - Test restoration monthly
   - Store backups offsite

### Performance Tips

```bash
# Reduce Postfix memory usage
postconf -e default_process_limit=10
postconf -e smtpd_client_connection_count_limit=3

# Reduce Dovecot memory usage
# Edit /etc/dovecot/conf.d/10-master.conf
# Reduce process limits and connection limits

# Tune PostgreSQL for 2GB RAM
# Edit /etc/postgresql/16/main/postgresql.conf
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 2621kB
min_wal_size = 1GB
max_wal_size = 4GB
```

## Emergency Procedures

### Server Compromised
1. Immediately disconnect from network
2. Change all email passwords
3. Review logs for intrusion
4. Restore from clean backup
5. Reinstall OS if necessary
6. Rotate DKIM keys
7. Review DNS records

### Mail Queue Stuck
```bash
# View queue
postqueue -p

# Requeue
postsuper -r ALL

# Delete specific message
postsuper -d MESSAGE_ID

# Delete all deferred
postsuper -D deferred

# Force flush
postqueue -f
```

### High Load
```bash
# Top processes
htop

# Check connections
ss -s

# Reduce load
postconf -e default_process_limit=5
systemctl reload postfix
```

## Contact Information

For issues or questions:
- Email: admin@ementech.co.ke
- Documentation: /usr/local/share/email-server-docs

---

**Document Version:** 1.0
**Last Updated:** 2025-01-19
**Maintained By:** Ementech IT Team
