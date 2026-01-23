# EmenTech Email Server Implementation Guide
## Production-Ready Deployment for Ubuntu 24.04 LTS

**Version:** 1.0
**Date:** 2025-01-19
**Target:** Ubuntu 24.04 LTS
**Domain:** ementech.co.ke
**IP Address:** 69.164.244.165
**Email Accounts:** 5 (CEO, info, support, admin, tech)
**Estimated Completion Time:** 4-6 hours
**Difficulty:** Advanced

---

## Table of Contents

1. [System Preparation](#phase-1-system-preparation)
2. [Software Installation](#phase-2-software-installation)
3. [Database Setup](#phase-3-database-setup)
4. [Postfix Configuration](#phase-4-postfix-configuration)
5. [Dovecot Configuration](#phase-5-dovecot-configuration)
6. [Authentication Setup](#phase-6-authentication-setup)
7. [SSL Certificates](#phase-7-ssl-certificates)
8. [DNS Configuration](#phase-8-dns-configuration)
9. [Spam Filtering](#phase-9-spam-filtering)
10. [Webmail Setup](#phase-10-webmail-setup)
11. [Email Account Creation](#phase-11-email-account-creation)
12. [Testing & Verification](#phase-12-testing--verification)
13. [Security Hardening](#phase-13-security-hardening)
14. [Monitoring Setup](#phase-14-monitoring-setup)
15. [Backup Configuration](#phase-15-backup-configuration)
16. [Documentation & Handoff](#phase-16-documentation--handoff)

---

## Prerequisites

Before starting this implementation, ensure you have:

- [ ] Root or sudo access to the VPS
- [ ] Domain registrar access (to add DNS records)
- [ ] 2GB RAM VPS with Ubuntu 24.04 LTS installed
- [ ] At least 20GB free disk space
- [ ] Basic knowledge of Linux command line
- [ ] Backup of any existing data on the server

---

## Phase 1: System Preparation

**Estimated Time:** 15-20 minutes
**Goal:** Prepare the system with proper hostname, firewall, and base configuration

### 1.1 Prerequisites Check

```bash
# Verify Ubuntu version
lsb_release -a

# Check available memory
free -h

# Check disk space
df -h

# Verify you have sudo access
sudo whoami
```

**Expected Output:**
- Ubuntu 24.04 LTS
- At least 1.8GB RAM available
- At least 20GB disk space free

### 1.2 Set System Hostname

```bash
# Set the hostname
sudo hostnamectl set-hostname ementech-mail

# Verify hostname
hostname
hostnamectl status
```

### 1.3 Update /etc/hosts

```bash
# Backup the file
sudo cp /etc/hosts /etc/hosts.backup

# Edit hosts file
sudo nano /etc/hosts
```

**Add/modify these lines in /etc/hosts:**
```hosts
127.0.0.1       localhost
69.164.244.165  ementech-mail.ementech.co.ke ementech-mail
127.0.1.1       ementech-mail

# IPv6 (if applicable)
::1             localhost ip6-localhost ip6-loopback
```

### 1.4 Update System Packages

```bash
# Update package lists and upgrade system
sudo apt-get update && sudo apt-get upgrade -y

# Install essential tools
sudo apt-get install -y curl wget git vim htop net-tools
```

### 1.5 Configure Firewall (UFW)

```bash
# Allow SSH (CRITICAL - do this first!)
sudo ufw allow 22/tcp

# Allow email ports
sudo ufw allow 25/tcp    comment 'SMTP'
sudo ufw allow 587/tcp   comment 'SMTP Submission'
sudo ufw allow 465/tcp   comment 'SMTPS'
sudo ufw allow 143/tcp   comment 'IMAP'
sudo ufw allow 993/tcp   comment 'IMAPS'
sudo ufw allow 110/tcp   comment 'POP3'
sudo ufw allow 995/tcp   comment 'POP3S'

# Allow web traffic (for webmail)
sudo ufw allow 80/tcp    comment 'HTTP'
sudo ufw allow 443/tcp   comment 'HTTPS'

# Enable firewall
sudo ufw --force enable

# Check status
sudo ufw status numbered
```

**Verification:**
```bash
# Verify firewall is active
sudo ufw status | grep "Status"

# Verify all required ports are allowed
sudo ufw status | grep -E "25|587|465|143|993"
```

**Troubleshooting:**
- If you get locked out, access via Linode/AWS/DigitalOcean console
- Check firewall logs: `sudo tail -f /var/log/ufw.log`

**Rollback:**
```bash
# Disable firewall
sudo ufw disable

# Restore original configuration
sudo cp /etc/hosts.backup /etc/hosts
sudo hostnamectl set-hostname localhost
```

---

## Phase 2: Software Installation

**Estimated Time:** 20-30 minutes
**Goal:** Install all required software packages

### 2.1 Prerequisites Check

```bash
# Check if port 25 is open (required for email)
sudo netstat -tuln | grep -E ":25 "

# Check if any mail server is already installed
dpkg -l | grep -E "postfix|dovecot|sendmail"
```

**Expected Output:**
- Port 25 should not be in use
- No mail server should be installed

### 2.2 Install Postfix

```bash
# Set installation to non-interactive
export DEBIAN_FRONTEND=noninteractive

# Install Postfix
sudo apt-get install -y postfix

# During installation, select:
# - Internet Site
# - System mail name: ementech.co.ke
```

**If you need to reconfigure Postfix:**
```bash
sudo dpkg-reconfigure postfix
```

### 2.3 Install Dovecot

```bash
# Install Dovecot core and required packages
sudo apt-get install -y dovecot-core dovecot-imapd dovecot-pop3d dovecot-lmtpd dovecot-auth-lua
```

### 2.4 Install PostgreSQL

```bash
# Install PostgreSQL server
sudo apt-get install -y postgresql postgresql-contrib

# Install PostgreSQL development libraries (for Postfix compilation)
sudo apt-get install -y libpq-dev
```

### 2.5 Install Rspamd (Spam Filtering)

```bash
# Add Rspamd repository
sudo apt-get install -y lsb-release wget

# Install Rspamd
sudo apt-get install -y rspamd redis-server
```

### 2.6 Install ClamAV (Antivirus)

```bash
# Install ClamAV
sudo apt-get install -y clamav clamav-daemon

# Update virus definitions (this can take 5-10 minutes)
sudo systemctl stop clamav-freshclam
sudo freshclam
sudo systemctl start clamav-freshclam
```

### 2.7 Install Additional Tools

```bash
# Install SSL certificate tool
sudo apt-get install -y certbot

# Install web server (for webmail and Let's Encrypt)
sudo apt-get install -y nginx

# Install PHP and dependencies for Roundcube
sudo apt-get install -y php-fpm php-intl php-json php-xml php-mbstring php-mysql php-pgsql php-sqlite3 php-curl php-zip php-gd php-pspell

# Install Roundcube webmail
sudo apt-get install -y roundcube roundcube-core roundcube-plugins roundcube-plugins-extra

# Install testing tools
sudo apt-get install -y swaks telnet netcat-openbsd
```

**Verification:**
```bash
# Check Postfix version
postconf mail_version

# Check Dovecot version
dovecot --version

# Check PostgreSQL version
psql --version

# Check Rspamd version
rspamd --version

# Check ClamAV version
clamdscan --version

# Check all services are installed
dpkg -l | grep -E "postfix|dovecot|postgresql|rspamd|clamav|roundcube"
```

**Troubleshooting:**
- If Postfix fails to install, check for conflicting mail servers: `dpkg -l | grep mail`
- If ClamAV update fails, run manually: `sudo freshclam`
- Check installation logs: `sudo tail -f /var/log/apt/history.log`

**Rollback:**
```bash
# Remove all installed packages
sudo apt-get remove --purge -y postfix dovecot-core dovecot-imapd dovecot-pop3d postgresql rspamd clamav clamav-daemon roundcube nginx certbot php-fpm

# Autoremove dependencies
sudo apt-get autoremove -y

# Clean package cache
sudo apt-get clean
```

---

## Phase 3: Database Setup

**Estimated Time:** 15-20 minutes
**Goal:** Configure PostgreSQL database for email accounts

### 3.1 Prerequisites Check

```bash
# Verify PostgreSQL is running
sudo systemctl status postgresql

# Check PostgreSQL version
psql --version
```

### 3.2 Create Database and User

```bash
# Switch to postgres user
sudo -u postgres psql

# Run these SQL commands in the psql shell:
```

**SQL Commands:**
```sql
-- Create database user
CREATE USER mailserver WITH PASSWORD 'CHANGE_THIS_STRONG_PASSWORD_123!';

-- Create database
CREATE DATABASE mailserver_db OWNER mailserver;

-- Connect to the database
\c mailserver_db

-- Create domains table
CREATE TABLE domains (
    id SERIAL PRIMARY KEY,
    domain VARCHAR(255) NOT NULL UNIQUE,
    enabled BOOLEAN DEFAULT TRUE
);

-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL UNIQUE,
    domain_id INTEGER REFERENCES domains(id) ON DELETE CASCADE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    enabled BOOLEAN DEFAULT TRUE,
    quota INTEGER DEFAULT 1073741824, -- 1GB default
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create aliases table
CREATE TABLE aliases (
    id SERIAL PRIMARY KEY,
    domain_id INTEGER REFERENCES domains(id) ON DELETE CASCADE,
    source VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    enabled BOOLEAN DEFAULT TRUE
);

-- Grant privileges
GRANT SELECT, INSERT, UPDATE, DELETE ON domains, users, aliases TO mailserver;
GRANT USAGE, SELECT ON SEQUENCE domains_id_seq TO mailserver;
GRANT USAGE, SELECT ON SEQUENCE users_id_seq TO mailserver;
GRANT USAGE, SELECT ON SEQUENCE aliases_id_seq TO mailserver;

-- Exit psql
\q
```

### 3.3 Insert Initial Domain

```bash
sudo -u postgres psql mailserver_db
```

**SQL Commands:**
```sql
-- Insert ementech.co.ke domain
INSERT INTO domains (domain) VALUES ('ementech.co.ke');

-- Verify
SELECT * FROM domains;

-- Exit
\q
```

### 3.4 Configure PostgreSQL Authentication

```bash
# Edit pg_hba.conf
sudo nano /etc/postgresql/16/main/pg_hba.conf
```

**Add this line at the end (before any IPv6 lines):**
```conf
# Local mailserver access
local   mailserver_db   mailserver                             md5
host    mailserver_db   mailserver   127.0.0.1/32            md5
```

**Restart PostgreSQL:**
```bash
sudo systemctl restart postgresql
```

**Verification:**
```bash
# Test connection
sudo -u mailserver psql -h localhost mailserver_db

# You should be able to connect without password (local trust)
# If asked for password, use the one you created above

# Inside psql, run:
\dt

# Expected output: Should show domains, users, aliases tables

# Exit
\q
```

**Troubleshooting:**
- If connection fails, check PostgreSQL logs: `sudo tail -f /var/log/postgresql/postgresql-16-main.log`
- Verify pg_hba.conf changes: `sudo cat /etc/postgresql/16/main/pg_hba.conf | grep mailserver`

**Rollback:**
```bash
# Drop database and user
sudo -u postgres psql -c "DROP DATABASE mailserver_db;"
sudo -u postgres psql -c "DROP USER mailserver;"

# Restore original pg_hba.conf
sudo cp /etc/postgresql/16/main/pg_hba.conf.backup /etc/postgresql/16/main/pg_hba.conf
sudo systemctl restart postgresql
```

---

## Phase 4: Postfix Configuration

**Estimated Time:** 30-40 minutes
**Goal:** Configure Postfix as MTA with virtual domains and PostgreSQL backend

### 4.1 Prerequisites Check

```bash
# Check Postfix is running
sudo systemctl status postfix

# Check current configuration
postconf -n
```

### 4.2 Install Postfix PostgreSQL Modules

```bash
# Install postfix-pgsql for PostgreSQL integration
sudo apt-get install -y postfix-pgsql

# Verify module is loaded
postconf -m | grep pgsql
```

### 4.3 Configure main.cf

```bash
# Backup original configuration
sudo cp /etc/postfix/main.cf /etc/postfix/main.cf.backup

# Edit main configuration
sudo nano /etc/postfix/main.cf
```

**Complete /etc/postfix/main.cf:**
```conf
# Debian/Ubuntu defaults
smtpd_banner = $myhostname ESMTP $mail_name (Ubuntu)
biff = no
append_dot_mydomain = no
readme_directory = no

# TLS parameters
smtpd_tls_cert_file = /etc/ssl/certs/ssl-cert-snakeoil.pem
smtpd_tls_key_file = /etc/ssl/private/ssl-cert-snakeoil.key
smtpd_tls_security_level = may
smtpd_tls_protocols = !SSLv2, !SSLv3, !TLSv1, !TLSv1.1
smtpd_tls_mandatory_protocols = !SSLv2, !SSLv3, !TLSv1, !TLSv1.1
smtp_tls_security_level = may
smtp_tls_protocols = !SSLv2, !SSLv3, !TLSv1, !TLSv1.1
smtp_tls_mandatory_protocols = !SSLv2, !SSLv3, !TLSv1, !TLSv1.1
smtp_tls_session_cache_database = btree:${data_directory}/smtp_scache
smtpd_tls_session_cache_database = btree:${data_directory}/smtpd_scache

# Perfect Forward Secrecy
smtpd_tls_eecdh_grade = strong
tls_preempt_cipherlist = yes
tls_high_cipherlist = ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:DHE-DSS-AES128-GCM-SHA256:kEDH+AESGCM:ECDHE-RSA-AES128-SHA256:ECDHE-ECDSA-AES128-SHA256:ECDHE-RSA-AES128-SHA:ECDHE-ECDSA-AES128-SHA:ECDHE-RSA-AES256-SHA384:ECDHE-ECDSA-AES256-SHA384:ECDHE-RSA-AES256-SHA:ECDHE-ECDSA-AES256-SHA:DHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA:DHE-DSS-AES128-SHA256:DHE-RSA-AES256-SHA256:DHE-DSS-AES256-SHA:DHE-RSA-AES256-SHA:!aNULL:!eNULL:!EXPORT:!DES:!RC4:!3DES:!MD5:!PSK

# Basic settings
myhostname = ementech-mail.ementech.co.ke
mydomain = ementech.co.ke
myorigin = $mydomain
mydestination = localhost.$mydomain, localhost
relayhost =
mynetworks = 127.0.0.0/8 [::ffff:127.0.0.0]/104 [::1]/128
mailbox_size_limit = 0
recipient_delimiter = +
inet_interfaces = all
inet_protocols = all

# Virtual domains
virtual_mailbox_domains = pgsql:/etc/postfix/pgsql/virtual_domains_maps.cf
virtual_mailbox_maps = pgsql:/etc/postfix/pgsql/virtual_mailbox_maps.cf
virtual_alias_maps = pgsql:/etc/postfix/pgsql/virtual_alias_maps.cf

# Virtual delivery
virtual_transport = lmtp:unix:private/dovecot-lmtp
virtual_mailbox_base = /var/mail/vhosts
virtual_uid_maps = static:5000
virtual_gid_maps = static:5000

# Message size limits (20MB)
message_size_limit = 20971520
mailbox_size_limit = 1073741824

# SASL authentication
smtpd_sasl_type = dovecot
smtpd_sasl_path = private/auth
smtpd_sasl_auth_enable = yes
broken_sasl_auth_clients = yes
smtpd_sasl_security_options = noanonymous, noplaintext
smtpd_sasl_tls_security_options = noanonymous

# Restrictions
smtpd_helo_required = yes
smtpd_helo_restrictions =
    permit_mynetworks,
    permit_sasl_authenticated,
    reject_invalid_helo_hostname,
    reject_non_fqdn_helo_hostname

smtpd_recipient_restrictions =
    permit_mynetworks,
    permit_sasl_authenticated,
    reject_non_fqdn_recipient,
    reject_unknown_recipient_domain,
    reject_unauth_destination,
    check_policy_service inet:127.0.0.1:11333

smtpd_sender_restrictions =
    permit_mynetworks,
    permit_sasl_authenticated,
    reject_non_fqdn_sender,
    reject_unknown_sender_domain

smtpd_data_restrictions =
    permit_mynetworks,
    permit_sasl_authenticated,
    reject_unauth_pipelining

# Rate limiting (optional)
smtpd_client_connection_count_limit = 10
smtpd_client_connection_rate_limit = 30
smtpd_client_message_rate_limit = 100

# Rspamd integration
smtpd_milters = inet:127.0.0.1:11332
non_smtpd_milters = inet:127.0.0.1:11332
milter_protocol = 6
milter_default_action = accept

# Queue settings
queue_directory = /var/spool/postfix
max_queue_lifetime = 5d
minimal_backoff_time = 1000s
maximal_backoff_time = 4000s

# Logs
maillog_file = /var/log/mail.log
syslog_name = postfix
```

### 4.4 Configure master.cf

```bash
# Backup original
sudo cp /etc/postfix/master.cf /etc/postfix/master.cf.backup

# Edit master.cf
sudo nano /etc/postfix/master.cf
```

**Add/modify these services in /etc/postfix/master.cf:**
```conf
# SMTP (Port 25) - Incoming mail
smtp      inet  n       -       y       -       -       smtpd
  -o syslog_name=postfix/smtp
  -o smtpd_tls_security_level=may
  -o smtpd_sasl_auth_enable=no
  -o smtpd_client_restrictions=permit_mynetworks,permit_sasl_authenticated,reject
  -o smtpd_helo_restrictions=
  -o smtpd_sender_restrictions=
  -o smtpd_recipient_restrictions=permit_mynetworks,permit_sasl_authenticated,reject_unauth_destination

# Submission (Port 587) - Client auth
submission inet n       -       y       -       -       smtpd
  -o syslog_name=postfix/submission
  -o smtpd_tls_security_level=encrypt
  -o smtpd_sasl_auth_enable=yes
  -o smtpd_tls_auth_only=yes
  -o smtpd_client_restrictions=permit_mynetworks,permit_sasl_authenticated,reject
  -o smtpd_sender_restrictions=
  -o smtpd_recipient_restrictions=permit_mynetworks,permit_sasl_authenticated,reject_unauth_destination
  -o milter_macro_daemon_name=ORIGINATING

# SMTPS (Port 465) - Legacy SSL
smtps     inet  n       -       y       -       -       smtpd
  -o syslog_name=postfix/smtps
  -o smtpd_tls_wrappermode=yes
  -o smtpd_sasl_auth_enable=yes
  -o smtpd_client_restrictions=permit_mynetworks,permit_sasl_authenticated,reject
  -o smtpd_sender_restrictions=
  -o smtpd_recipient_restrictions=permit_mynetworks,permit_sasl_authenticated,reject_unauth_destination
  -o milter_macro_daemon_name=ORIGINATING

# Pickup (local mail)
pickup    unix  n       -       y       60      1       pickup
  -o content_filter=
  -o receive_override_options=no_header_body_checks

# Cleanup
cleanup   unix  n       -       y       -       0       cleanup
  -o mime_header_checks=
  -o nested_header_checks=
  -o body_checks=
  -o header_checks=

# Qmgr
qmgr      unix  n       -       n       300     1       qmgr
tlsmgr    unix  -       -       y       1000?   1       tlsmgr
rewrite   unix  -       -       y       -       -       trivial-rewrite
bounce    unix  -       -       y       -       0       bounce
defer     unix  -       -       y       -       0       bounce
trace     unix  -       -       y       -       0       bounce
verify    unix  -       -       y       -       1       verify
flush     unix  n       -       y       1000?   0       flush
proxymap  unix  -       -       n       -       -       proxymap
proxywrite unix -       -       n       1       -       proxymap
smtp      unix  -       -       y       -       -       smtp
relay     unix  -       -       y       -       -       smtp
showq     unix  n       -       y       -       -       showq
error     unix  -       -       y       -       -       error
retry     unix  -       -       y       -       -       error
discard   unix  -       -       y       -       -       discard
local     unix  -       n       n       -       -       local
virtual   unix  -       n       y       -       -       virtual
lmtp      unix  -       -       y       -       -       lmtp
anvil     unix  -       -       y       -       1       anvil
scache    unix  -       -       y       -       1       scache

# Maildrop
maildrop  unix  -       n       n       -       -       pipe
  flags=DRhu user=vmail argv=/usr/bin/maildrop -d ${recipient}

# Uucp
uucp      unix  -       n       n       -       -       pipe
  flags=F user=nuucp argv=uux -r -n -z -a$sender - $nexthop!rmail ($recipient)

# Other
ifmail    unix  -       n       n       -       -       pipe
  flags=F user=ftn argv=/usr/lib/ifmail/ifmail -r $nexthop ($recipient)
bsmtp     unix  -       n       n       -       -       pipe
  flags=Fq. user=bsmtp argv=/usr/lib/bsmtp/bsmtp -t$nexthop -f$sender $recipient
scalemail-backend unix  -   n   n   -   2   pipe
  flags=R user=scalemail argv=/usr/lib/scalemail/bin/scalemail-store ${nexthop} ${user} ${extension}
mailman   unix  -       n       n       -       -       pipe
  flags=FR user=list argv=/usr/lib/mailman/bin/postfix-to-mailman.py
  ${nexthop} ${user}
```

### 4.5 Create PostgreSQL Map Files

```bash
# Create directory for PostgreSQL maps
sudo mkdir -p /etc/postfix/pgsql

# Set proper permissions
sudo chmod 750 /etc/postfix/pgsql
sudo chown root:postfix /etc/postfix/pgsql
```

**Create /etc/postfix/pgsql/virtual_domains_maps.cf:**
```bash
sudo nano /etc/postfix/pgsql/virtual_domains_maps.cf
```
```conf
user = mailserver
password = CHANGE_THIS_STRONG_PASSWORD_123!
hosts = 127.0.0.1
dbname = mailserver_db
query = SELECT 1 FROM domains WHERE domain='%s' AND enabled=true;
```

**Create /etc/postfix/pgsql/virtual_mailbox_maps.cf:**
```bash
sudo nano /etc/postfix/pgsql/virtual_mailbox_maps.cf
```
```conf
user = mailserver
password = CHANGE_THIS_STRONG_PASSWORD_123!
hosts = 127.0.0.1
dbname = mailserver_db
query = SELECT 1 FROM users WHERE email='%s' AND enabled=true;
```

**Create /etc/postfix/pgsql/virtual_alias_maps.cf:**
```bash
sudo nano /etc/postfix/pgsql/virtual_alias_maps.cf
```
```conf
user = mailserver
password = CHANGE_THIS_STRONG_PASSWORD_123!
hosts = 127.0.0.1
dbname = mailserver_db
query = SELECT destination FROM aliases WHERE source='%s' AND enabled=true;
```

**Secure the map files:**
```bash
sudo chmod 640 /etc/postfix/pgsql/*.cf
sudo chown root:postfix /etc/postfix/pgsql/*.cf
```

### 4.6 Create Virtual Mail Directory

```bash
# Create vmail user
sudo groupadd -g 5000 vmail
sudo useradd -g vmail -u 5000 vmail -d /var/mail/vhosts -m

# Create mail directory
sudo mkdir -p /var/mail/vhosts

# Set ownership
sudo chown -R vmail:vmail /var/mail/vhosts
sudo chmod 770 /var/mail/vhosts
```

**Verification:**
```bash
# Check Postfix syntax
sudo postfix check

# Check configuration
postconf -n | grep -E "virtual|smtpd|tls"

# Test database connection
postmap -q ementech.co.ke pgsql:/etc/postfix/pgsql/virtual_domains_maps.cf

# Reload Postfix
sudo systemctl reload postfix

# Check status
sudo systemctl status postfix
```

**Expected Output:**
- Postfix check should return no errors
- postmap command should return "1" (domain exists)
- Postfix status should show "active (running)"

**Troubleshooting:**
- Check Postfix logs: `sudo tail -f /var/log/mail.log`
- Check for syntax errors: `sudo postfix check`
- Test database query manually: `sudo -u mailserver psql mailserver_db -c "SELECT 1 FROM domains WHERE domain='ementech.co.ke';"`
- Verify file permissions: `ls -la /etc/postfix/pgsql/`

**Rollback:**
```bash
# Stop Postfix
sudo systemctl stop postfix

# Restore backups
sudo cp /etc/postfix/main.cf.backup /etc/postfix/main.cf
sudo cp /etc/postfix/master.cf.backup /etc/postfix/master.cf

# Remove virtual mail directory
sudo userdel vmail
sudo rm -rf /var/mail/vhosts

# Restart Postfix
sudo systemctl start postfix
```

---

## Phase 5: Dovecot Configuration

**Estimated Time:** 30-40 minutes
**Goal:** Configure Dovecot as IMAP/POP3 server with PostgreSQL backend

### 5.1 Prerequisites Check

```bash
# Check Dovecot version
dovecot --version

# Check if Dovecot is running
sudo systemctl status dovecot
```

### 5.2 Configure dovecot.conf

```bash
# Backup original
sudo cp /etc/dovecot/dovecot.conf /etc/dovecot/dovecot.conf.backup

# Edit configuration
sudo nano /etc/dovecot/dovecot.conf
```

**Complete /etc/dovecot/dovecot.conf:**
```conf
# Dovecot configuration
# Basic settings
protocols = imap pop3 lmtp submission
base_dir = /var/run/dovecot/
instance_name = dovecot

# Logging
log_path = /var/log/dovecot.log
info_log_path = /var/log/dovecot-info.log
debug_log_path = /var/log/dovecot-debug.log
log_timestamp = "%Y-%m-%d %H:%M:%S "
log_indent = "  "
disable_plaintext_auth = yes
auth_username_format = %Lu

# SSL/TLS
ssl = required
ssl_cert = </etc/ssl/certs/ssl-cert-snakeoil.pem
ssl_key = </etc/ssl/private/ssl-cert-snakeoil.key
ssl_min_protocol = TLSv1.2
ssl_cipher_list = ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:DHE-DSS-AES128-GCM-SHA256:kEDH+AESGCM:ECDHE-RSA-AES128-SHA256:ECDHE-ECDSA-AES128-SHA256:ECDHE-RSA-AES128-SHA:ECDHE-ECDSA-AES128-SHA:ECDHE-RSA-AES256-SHA384:ECDHE-ECDSA-AES256-SHA384:ECDHE-RSA-AES256-SHA:ECDHE-ECDSA-AES256-SHA:DHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA:DHE-DSS-AES128-SHA256:DHE-RSA-AES256-SHA256:DHE-DSS-AES256-SHA:DHE-RSA-AES256-SHA:!aNULL:!eNULL:!EXPORT:!DES:!RC4:!3DES:!MD5:!PSK
ssl_prefer_server_ciphers = yes
ssl_options = no_compression no_ticket

# Mail locations
mail_location = maildir:/var/mail/vhosts/%d/%n
mail_privileged_group = vmail
mail_uid = vmail
mail_gid = vmail
mail_plugins = quota

# Namespaces
namespace inbox {
  inbox = yes
  location =
  mailbox Drafts {
    special_use = \Drafts
    auto = subscribe
  }
  mailbox Junk {
    special_use = \Junk
    auto = subscribe
  }
  mailbox Trash {
    special_use = \Trash
    auto = subscribe
  }
  mailbox Sent {
    special_use = \Sent
    auto = subscribe
  }
  mailbox Archive {
    special_use = \Archive
  }
}

# Authentication
auth_mechanisms = PLAIN LOGIN
auth_debug = no
auth_debug_passwords = no
auth_verbose = no
auth_default_realm = ementech.co.ke

# Password policy
auth_password_regex = .{8,}

# Service configuration
service imap-login {
  inet_listener imap {
    port = 0
  }
  inet_listener imaps {
    port = 993
    ssl = yes
  }
  service_count = 1
  process_min_avail = 2
  vsz_limit = 256M
}

service pop3-login {
  inet_listener pop3 {
    port = 0
  }
  inet_listener pop3s {
    port = 995
    ssl = yes
  }
  service_count = 1
  process_min_avail = 1
  vsz_limit = 128M
}

service lmtp {
  unix_listener /var/spool/postfix/private/dovecot-lmtp {
    mode = 0600
    user = postfix
    group = postfix
  }
  user = vmail
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

# Plugin settings
plugin {
  quota = maildir:User quota
  quota_rule = *:storage=1G
  quota_rule2 = Trash:storage=100M
  quota_rule3 = Junk:storage=100M
  quota_warning = storage=95%% quota-warning 95 %u
  quota_warning2 = storage=80%% quota-warning 80 %u

  # Sieve
  sieve = ~/.dovecot.sieve
  sieve_dir = ~/sieve
}

# Quota warning service
service quota-warning {
  executable = script /usr/local/bin/quota-warning.sh
  user = vmail
  unix_listener quota-warning {
    user = vmail
  }
}

# LDA settings
lda_mailbox_autocreate = yes
lda_mailbox_autosubscribe = yes
lda_quota_warning = storage=95%% quota-warning 95 %u

# Protocol settings
protocol imap {
  imap_client_workarounds = tb-extra-mailbox-sep
  imap_idle_notify_interval = 29 mins
  mail_plugins = quota imap_quota
}

protocol pop3 {
  pop3_client_workarounds = outlook-no-nuls oe-ns-eoh
  pop3_uidl_format = %08Xu%08Xv
  mail_plugins = quota
}

protocol lda {
  mail_plugins = quota sieve
  postmaster_address = postmaster@ementech.co.ke
  hostname = ementech-mail.ementech.co.ke
  sendmail_path = /usr/sbin/sendmail
  lda_mailbox_autocreate = yes
  lda_mailbox_autosubscribe = yes
}

protocol lmtp {
  mail_plugins = quota sieve
}

# Disable unneeded plugins (performance optimization for 2GB RAM)
disable_plaintext_auth = yes
mail_plugins = $mail_plugins quota
```

### 5.3 Configure PostgreSQL Authentication

```bash
# Create conf.d directory if it doesn't exist
sudo mkdir -p /etc/dovecot/conf.d

# Edit SQL configuration
sudo nano /etc/dovecot/conf.d/auth-sql.conf.ext
```

**Complete /etc/dovecot/conf.d/auth-sql.conf.ext:**
```conf
# SQL authentication
passdb {
  driver = sql
  args = /etc/dovecot/dovecot-sql.conf.ext
}

userdb {
  driver = sql
  args = /etc/dovecot/dovecot-sql.conf.ext
}

# Prefetch userdb (performance optimization)
userdb {
  driver = prefetch
}
```

### 5.4 Create SQL Configuration

```bash
sudo nano /etc/dovecot/dovecot-sql.conf.ext
```

**Complete /etc/dovecot/dovecot-sql.conf.ext:**
```conf
# Dovecot SQL configuration
driver = pgsql

# Database connection
connect = host=127.0.0.1 dbname=mailserver_db user=mailserver password=CHANGE_THIS_STRONG_PASSWORD_123!

# Default password scheme
default_pass_scheme = SHA512-CRYPT

# Password query
password_query = \
  SELECT email as user, password FROM users WHERE email = '%u' AND enabled = true

# User query
user_query = \
  SELECT '/var/mail/vhosts/%d/%n' as home, \
         'maildir:/var/mail/vhosts/%d/%n' as mail, \
         5000 AS uid, \
         5000 AS gid, \
         '*:storage=1G' as quota_rule \
  FROM users WHERE email = '%u' AND enabled = true

# Iterate query (for all users)
iterate_query = \
  SELECT email as user \
  FROM users WHERE enabled = true
```

**Secure the file:**
```bash
sudo chmod 640 /etc/dovecot/dovecot-sql.conf.ext
sudo chown root:dovecot /etc/dovecot/dovecot-sql.conf.ext
```

### 5.5 Create Quota Warning Script

```bash
sudo nano /usr/local/bin/quota-warning.sh
```

**Complete script:**
```bash
#!/bin/bash
# Quota warning script
PERCENT="${1}"
USER="${2}"

cat << EOF | /usr/lib/dovecot/dovecot-lda -d $USER -o "plugin/quota=maildir:User quota:noenforcing"
From: postmaster@ementech.co.ke
Subject: Quota Warning - Mailbox is ${PERCENT}% full
Content-Type: text/plain; charset=utf-8

Your email mailbox is now ${PERCENT}% full.

Please clean up your mailbox by deleting old emails or emptying the Trash folder.

If you need assistance, please contact admin@ementech.co.ke.

---
This is an automated message. Please do not reply.
EOF
```

**Make it executable:**
```bash
sudo chmod +x /usr/local/bin/quota-warning.sh
sudo chown vmail:vmail /usr/local/bin/quota-warning.sh
```

**Verification:**
```bash
# Check Dovecot configuration
sudo doveconf -n

# Check for errors
sudo doveconf -n | less

# Restart Dovecot
sudo systemctl restart dovecot

# Check status
sudo systemctl status dovecot

# Check all sockets are created
ls -la /var/spool/postfix/private/ | grep dovecot

# Check listening ports
sudo netstat -tulpn | grep dovecot
```

**Expected Output:**
- doveconf shows no errors
- Status shows "active (running)"
- Sockets exist: auth, dovecot-lmtp
- Ports 993, 995 are listening

**Troubleshooting:**
- Check Dovecot logs: `sudo tail -f /var/log/dovecot.log`
- Check for configuration errors: `sudo doveconf -n`
- Test SQL connection: `sudo -u mailserver psql mailserver_db -c "SELECT email FROM users;"`
- Verify file permissions: `ls -la /etc/dovecot/dovecot-sql.conf.ext`
- Check authentication: `doveadm auth test ceo@ementech.co.ke PASSWORD`

**Rollback:**
```bash
# Stop Dovecot
sudo systemctl stop dovecot

# Restore backups
sudo cp /etc/dovecot/dovecot.conf.backup /etc/dovecot/dovecot.conf

# Remove custom configs
sudo rm -f /etc/dovecot/dovecot-sql.conf.ext
sudo rm -f /usr/local/bin/quota-warning.sh

# Restart Dovecot
sudo systemctl start dovecot
```

---

## Phase 6: Authentication Setup

**Estimated Time:** 10-15 minutes
**Goal:** Test and verify authentication between Postfix and Dovecot

### 6.1 Prerequisites Check

```bash
# Verify both services are running
sudo systemctl status postfix
sudo systemctl status dovecot

# Check sockets exist
ls -la /var/spool/postfix/private/auth
ls -la /var/spool/postfix/private/dovecot-lmtp
```

### 6.2 Create Test User

```bash
# Connect to database
sudo -u postgres psql mailserver_db
```

**SQL Commands:**
```sql
-- Get domain ID
SELECT id FROM domains WHERE domain='ementech.co.ke';

-- Insert test user (replace DOMAIN_ID with actual ID from above)
INSERT INTO users (user_id, domain_id, password, email, quota) VALUES
('ceo', 1, '{SHA512-CRYPT}$6$rounds=500000$randomstring', 'ceo@ementech.co.ke', 1073741824);

-- Exit
\q
```

**Generate password hash:**
```bash
# Install mkpasswd if not available
sudo apt-get install -y whois

# Generate SHA512 password hash
mkpasswd -m sha-512 'YourStrongPassword123!'
```

**Update user with proper hash:**
```bash
sudo -u postgres psql mailserver_db
```
```sql
-- Update user with proper hash (replace HASH with output from mkpasswd)
UPDATE users SET password='{SHA512-CRYPT}$6$rounds=500000$...' WHERE email='ceo@ementech.co.ke';

-- Verify
SELECT email, enabled FROM users;

-- Exit
\q
```

### 6.3 Test Authentication

```bash
# Test Dovecot authentication
doveadm auth test ceo@ementech.co.ke YourStrongPassword123!

# Expected output: pass authenticated
```

### 6.4 Test LMTP Connection

```bash
# Test LMTP socket connection
sudo nc -U /var/spool/postfix/private/dovecot-lmtp

# Type (should get LMTP greeting):
220 ementech-mail.ementech.co.ke Dovecot ready.

# Press Ctrl+D to exit
```

### 6.5 Configure Postfix to Use Dovecot SASL

```bash
# Verify Postfix configuration
postconf smtpd_sasl_type
postconf smtpd_sasl_path

# Expected output:
# smtpd_sasl_type = dovecot
# smtpd_sasl_path = private/auth
```

**Verification:**
```bash
# Reload both services
sudo systemctl reload postfix
sudo systemctl reload dovecot

# Check logs for errors
sudo tail -20 /var/log/mail.log
sudo tail -20 /var/log/dovecot.log

# Test authentication via telnet
telnet localhost 25
```

**Telnet test:**
```
# After connecting, type:
EHLO test.com

# Look for: 250-AUTH PLAIN LOGIN
# If present, authentication is available

# Press Ctrl+] then type: quit
```

**Troubleshooting:**
- If authentication fails, check Dovecot auth logs: `sudo tail -f /var/log/dovecot.log | grep auth`
- Verify SQL connection: `sudo -u mailserver psql mailserver_db -c "SELECT * FROM users;"`
- Check Postfix SASL config: `postconf | grep sasl`
- Test with verbose logging: Add `auth_debug = yes` to dovecot.conf temporarily

**Rollback:**
```bash
# Remove test user
sudo -u postgres psql mailserver_db -c "DELETE FROM users WHERE email='ceo@ementech.co.ke';"

# Disable auth_debug in dovecot.conf if enabled
sudo sed -i 's/auth_debug = yes/auth_debug = no/' /etc/dovecot/dovecot.conf

# Reload services
sudo systemctl reload dovecot
```

---

## Phase 7: SSL Certificates

**Estimated Time:** 15-20 minutes
**Goal:** Install and configure Let's Encrypt SSL certificates

### 7.1 Prerequisites Check

```bash
# Verify domain DNS is pointing to this server
dig +short ementech.co.ke
dig +short mail.ementech.co.ke

# Check if certbot is installed
certbot --version

# Verify nginx is running (required for HTTP-01 challenge)
sudo systemctl status nginx
```

### 7.2 Configure Nginx for ACME Challenge

```bash
# Create nginx configuration for HTTP challenge
sudo nano /etc/nginx/sites-available/mail.ementech.co.ke
```

**Complete nginx configuration:**
```nginx
server {
    listen 80;
    server_name mail.ementech.co.ke ementech-mail.ementech.co.ke;

    # ACME challenge location
    location /.well-known/acme-challenge/ {
        root /var/www/html;
        try_files $uri =404;
    }

    # Redirect to HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}
```

**Enable site:**
```bash
# Create symlink
sudo ln -s /etc/nginx/sites-available/mail.ementech.co.ke /etc/nginx/sites-enabled/

# Test nginx configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

### 7.3 Obtain SSL Certificates

```bash
# Create webroot directory
sudo mkdir -p /var/www/html

# Set permissions
sudo chown -R www-data:www-data /var/www/html
sudo chmod -R 755 /var/www/html

# Obtain certificate for mail subdomain
sudo certbot certonly --webroot -w /var/www/html \
  -d mail.ementech.co.ke \
  --email admin@ementech.co.ke \
  --agree-tos \
  --non-interactive \
  --rsa-key-size 4096 \
  --keep-until-expiring

# Obtain certificate for primary domain (for DKIM/DMARC)
sudo certbot certonly --webroot -w /var/www/html \
  -d ementech.co.ke \
  --email admin@ementech.co.ke \
  --agree-tos \
  --non-interactive \
  --rsa-key-size 4096 \
  --keep-until-expiring
```

**Alternative: If webroot fails, use standalone:**
```bash
# Stop nginx temporarily
sudo systemctl stop nginx

# Obtain certificate
sudo certbot certonly --standalone \
  -d mail.ementech.co.ke \
  -d ementech.co.ke \
  --email admin@ementech.co.ke \
  --agree-tos \
  --non-interactive \
  --rsa-key-size 4096

# Start nginx
sudo systemctl start nginx
```

### 7.4 Configure Postfix to Use SSL

```bash
# Edit main.cf
sudo nano /etc/postfix/main.cf
```

**Update these lines:**
```conf
# TLS parameters
smtpd_tls_cert_file = /etc/letsencrypt/live/mail.ementech.co.ke/fullchain.pem
smtpd_tls_key_file = /etc/letsencrypt/live/mail.ementech.co.ke/privkey.pem
smtpd_tls_CAfile = /etc/letsencrypt/live/mail.ementech.co.ke/chain.pem
smtp_tls_CAfile = /etc/letsencrypt/live/mail.ementech.co.ke/chain.pem
```

### 7.5 Configure Dovecot to Use SSL

```bash
# Edit dovecot.conf
sudo nano /etc/dovecot/dovecot.conf
```

**Update these lines:**
```conf
# SSL/TLS
ssl = required
ssl_cert = </etc/letsencrypt/live/mail.ementech.co.ke/fullchain.pem
ssl_key = </etc/letsencrypt/live/mail.ementech.co.ke/privkey.pem
```

### 7.6 Set Up Certificate Auto-Renewal

```bash
# Test renewal
sudo certbot renew --dry-run

# Verify certbot timer is active
sudo systemctl status certbot.timer

# If not active, enable it
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

### 7.7 Configure Postfix/Dovecot Reload After Renewal

```bash
# Create renewal hook
sudo nano /etc/letsencrypt/renewal-hooks/post/reload-mail-services.sh
```

**Complete script:**
```bash
#!/bin/bash
# Reload mail services after certificate renewal

echo "Reloading Postfix..."
systemctl reload postfix

echo "Reloading Dovecot..."
systemctl reload dovecot

echo "Mail services reloaded successfully at $(date)" >> /var/log/mail-renewal.log
```

**Make executable:**
```bash
sudo chmod +x /etc/letsencrypt/renewal-hooks/post/reload-mail-services.sh
```

**Verification:**
```bash
# Verify certificate files exist
ls -la /etc/letsencrypt/live/mail.ementech.co.ke/

# Check certificate details
sudo openssl x509 -in /etc/letsencrypt/live/mail.ementech.co.ke/fullchain.pem -text -noout | grep -E "Subject:|Not After"

# Verify Postfix is using new certificate
sudo postfix reload
sudo netstat -tulpn | grep :25

# Verify Dovecot is using new certificate
sudo systemctl reload dovecot
sudo openssl s_client -connect localhost:993 -servername mail.ementech.co.ke < /dev/null | grep -E "subject|issuer"

# Test SMTP TLS
openssl s_client -connect localhost:587 -starttls smtp -crlf

# Test IMAPS
openssl s_client -connect localhost:993 -crlf
```

**Expected Output:**
- Certificate files exist with fullchain.pem, privkey.pem, chain.pem
- Certificate subject shows mail.ementech.co.ke
- Certificate is valid for 90 days
- TLS connections succeed without errors

**Troubleshooting:**
- If certbot fails, check nginx logs: `sudo tail -f /var/log/nginx/error.log`
- If renewal fails, run manually: `sudo certbot renew`
- Check certificate permissions: `ls -la /etc/letsencrypt/live/`
- Verify domain DNS: `dig +short mail.ementech.co.ke`
- Test certificate: `https://www.sslshopper.com/ssl-checker.html`

**Rollback:**
```bash
# Revoke certificate (if needed)
sudo certbot revoke --cert-path /etc/letsencrypt/live/mail.ementech.co.ke/cert.pem

# Delete certificate
sudo certbot delete --cert-name mail.ementech.co.ke

# Restore self-signed certificates in Postfix
sudo sed -i 's|smtpd_tls_cert_file = /etc/letsencrypt/.*|smtpd_tls_cert_file = /etc/ssl/certs/ssl-cert-snakeoil.pem|' /etc/postfix/main.cf
sudo sed -i 's|smtpd_tls_key_file = /etc/letsencrypt/.*|smtpd_tls_key_file = /etc/ssl/private/ssl-cert-snakeoil.key|' /etc/postfix/main.cf

# Restore self-signed certificates in Dovecot
sudo sed -i 's|ssl_cert = </etc/letsencrypt/.*|ssl_cert = </etc/ssl/certs/ssl-cert-snakeoil.pem|' /etc/dovecot/dovecot.conf
sudo sed -i 's|ssl_key = </etc/letsencrypt/.*|ssl_key = </etc/ssl/private/ssl-cert-snakeoil.key|' /etc/dovecot/dovecot.conf

# Reload services
sudo systemctl reload postfix dovecot
```

---

## Phase 8: DNS Configuration

**Estimated Time:** 30-45 minutes (includes DNS propagation time)
**Goal:** Configure DNS records for email server

### 8.1 Prerequisites Check

```bash
# Check current DNS records
dig +short ementech.co.ke ANY
dig +short mail.ementech.co.ke A

# Check if DNS is already configured
dig +short MX ementech.co.ke
```

### 8.2 DNS Records to Add

**Complete DNS Configuration:**

```
; A Records
ementech.co.ke.              IN A     69.164.244.165
mail.ementech.co.ke.         IN A     69.164.244.165
smtp.ementech.co.ke.         IN A     69.164.244.165
imap.ementech.co.ke.         IN A     69.164.244.165
pop.ementech.co.ke.          IN A     69.164.244.165

; MX Records
ementech.co.ke.              IN MX 10 mail.ementech.co.ke.

; TXT Records (SPF)
ementech.co.ke.              IN TXT "v=spf1 mx a ip4:69.164.244.165 -all"

; DKIM (will be generated in Phase 9)
default._domainkey.ementech.co.ke. IN TXT "v=DKIM1; k=rsa; p=<YOUR_PUBLIC_KEY>"

; DMARC
_dmarc.ementech.co.ke.       IN TXT "v=DMARC1; p=quarantine; rua=mailto:admin@ementech.co.ke; ruf=mailto:admin@ementech.co.ke; sp=none; aspf=s; adkim=s; rf=afrf; pct=100; ri=86400"

; SRV Records (optional but recommended)
_submission._tcp.ementech.co.ke. IN SRV 0 1 587 mail.ementech.co.ke.
_submissions._tcp.ementech.co.ke. IN SRV 0 1 465 mail.ementech.co.ke.
_imaps._tcp.ementech.co.ke. IN SRV 0 1 993 mail.ementech.co.ke.
_pop3s._tcp.ementech.co.ke. IN SRV 0 1 995 mail.ementech.co.ke.

; PTR Record (configure at your VPS provider, not registrar)
; 165.244.164.69.in-addr.arpa. IN PTR mail.ementech.co.ke.
```

### 8.3 Add DNS Records at Registrar

**Steps:**
1. Log in to your domain registrar (where ementech.co.ke is registered)
2. Navigate to DNS Management or DNS Settings
3. Add each record from the list above
4. Save changes

**Example for popular registrars:**

**Namecheap:**
- Go to Domain List → Advanced DNS → Add New Record
- Select type (A, MX, TXT, etc.)
- Enter host and value
- Click Save All Changes

**GoDaddy:**
- Go to My Products → DNS Management → Add
- Select type
- Enter host and value
- Click Save

**Cloudflare:**
- Go to DNS → Add Record
- Select type
- Enter name and content
- Click Add

### 8.4 Verify DNS Propagation

```bash
# Check A records
dig +short mail.ementech.co.ke A
dig +short smtp.ementech.co.ke A

# Check MX record
dig +short MX ementech.co.ke

# Check SPF record
dig +short TXT ementech.co.ke

# Check DMARC record
dig +short TXT _dmarc.ementech.co.ke

# Check SRV records
dig +short SRV _submission._tcp.ementech.co.ke
dig +short SRV _imaps._tcp.ementech.co.ke

# Check from external DNS servers
dig @8.8.8.8 +short MX ementech.co.ke
dig @1.1.1.1 +short TXT ementech.co.ke
```

**Expected Output:**
```
# A records
69.164.244.165

# MX record
10 mail.ementech.co.ke.

# SPF record
"v=spf1 mx a ip4:69.164.244.165 -all"

# DMARC record
"v=DMARC1; p=quarantine; rua=mailto:admin@ementech.co.ke; ruf=mailto:admin@ementech.co.ke; sp=none; aspf=s; adkim=s"
```

### 8.5 DNS Record Explanations

**A Records:**
- Point subdomains (mail, smtp, imap) to your VPS IP
- Required for clients to find your mail server

**MX Record:**
- Tells other mail servers where to deliver email
- Priority 10 (lower = higher priority)
- Must point to A record

**SPF (Sender Policy Framework):**
- Prevents spam spoofing
- `v=spf1` - SPF version 1
- `mx a` - Allow MX records and A record to send
- `ip4:69.164.244.165` - Allow this IP to send
- `-all` - Reject all others (hard fail)

**DMARC:**
- Email authentication policy
- `p=quarantine` - Quarantine failed emails (start with this, change to reject later)
- `rua` - Send aggregate reports to admin
- `ruf` - Send forensic reports to admin
- `sp=none` - No policy for subdomains
- `aspf=s` - Strict SPF alignment
- `adkim=s` - Strict DKIM alignment

**SRV Records (optional):**
- Help email clients autoconfigure
- Not required but recommended

### 8.6 PTR Record (Reverse DNS)

**Configure at your VPS provider:**
1. Log in to Linode/DigitalOcean/AWS
2. Find your VPS instance
3. Look for Networking or DNS settings
4. Add PTR record: `165.244.164.69.in-addr.arpa. → mail.ementech.co.ke.`
5. Note: You can only set PTR if you control the IP address

**Verification:**
```bash
# Check PTR record
dig -x 69.164.244.165 +short

# Expected output:
# mail.ementech.co.ke.
```

**Verification:**
```bash
# Test DNS from external servers
dig +short MX ementech.co.ke @8.8.8.8
dig +short TXT ementech.co.ke @1.1.1.1

# Check all records
dig ementech.co.ke ANY +noall +answer

# Use online tools
# - https://www.whatsmydns.net/
# - https://mxtoolbox.com/
# - https://www.dmarcanalyzer.com/dmarc/dmarc-check
```

**Expected Output:**
- All records resolve correctly
- No NXDOMAIN errors
- Propagation completes within 1-24 hours

**Troubleshooting:**
- If records don't appear, wait 15-30 minutes for DNS propagation
- Check for typos in DNS records
- Verify records are saved at registrar
- Use DNS checker tools: https://www.whatsmydns.net/
- If SPF/DKIM/DMARC fail, use: https://mxtoolbox.com/deliverability

**Rollback:**
```bash
# Remove DNS records from registrar's control panel
# Keep A records pointing to server
# Remove MX, TXT, SRV records
# Wait for propagation (1-24 hours)
```

---

## Phase 9: Spam Filtering

**Estimated Time:** 25-30 minutes
**Goal:** Configure Rspamd for spam filtering and DKIM signing

### 9.1 Prerequisites Check

```bash
# Check Rspamd status
sudo systemctl status rspamd

# Check Redis status (required for Rspamd)
sudo systemctl status redis-server

# Verify Rspamd is listening
sudo netstat -tulpn | grep rspamd
```

### 9.2 Configure Rspamd

```bash
# Backup original configuration
sudo cp -r /etc/rspamd /etc/rspamd.backup

# Create override directory
sudo mkdir -p /etc/rspamd/override.d
```

### 9.3 Configure DKIM Signing

```bash
# Generate DKIM keys
sudo rspamadm dkim_keygen -d ementech.co.ke -s default -k 2048 > /tmp/dkim.key

# Move to Rspamd directory
sudo mv /tmp/dkim.key /var/lib/rspamd/dkim/ementech.co.ke.default.key

# Set permissions
sudo chown _rspamd:_rspamd /var/lib/rspamd/dkim/ementech.co.ke.default.key
sudo chmod 640 /var/lib/rspamd/dkim/ementech.co.ke.default.key

# Extract public key
sudo rspamadm dkim_keygen -d ementech.co.ke -s default -k 2048 | grep "p=" | sed 's/p=//; s/"//g' | tr -d '\n'
```

**Create DKIM configuration:**
```bash
sudo nano /etc/rspamd/local.d/dkim_signing.conf
```

**Complete configuration:**
```conf
# DKIM signing configuration
enabled = true;
sign_local = true;
use_http_headers = true;
sign_authenticated = true;
domain {
  ementech.co.ke {
    path = "/var/lib/rspamd/dkim/$domain.$selector.key";
    selector = "default";
  }
}
selector_map = "/etc/rspamd/dkim_selectors.map";
```

### 9.4 Configure Rspamd Actions

```bash
sudo nano /etc/rspamd/local.d/actions.conf
```

**Complete configuration:**
```conf
# Spam score actions
actions {
  reject = 15;            # Reject spam with score >= 15
  add_header = 6;         # Add header for score >= 6
  greylist = 4;           # Greylist for score >= 4
  subject = "SPAM: ";     # Prefix subject for score >= 4 (optional)
}
```

### 9.5 Configure Redis (for Greylisting and Statistics)

```bash
# Edit Redis configuration
sudo nano /etc/redis/redis.conf
```

**Add/modify these lines:**
```conf
# Memory limit (optimize for 2GB RAM)
maxmemory 256mb
maxmemory-policy allkeys-lru

# Persistence
save 900 1
save 300 10
save 60 10000
```

**Restart Redis:**
```bash
sudo systemctl restart redis-server
```

### 9.6 Configure Rspamd Worker

```bash
sudo nano /etc/rspamd/local.d/worker-controller.inc
```

**Complete configuration:**
```conf
# Rspamd controller worker
count = 1;
password = "CHANGE_THIS_STRONG_PASSWORD_123!";
secure_ip = "127.0.0.1";
static_dir = "${WWWDIR}";
```

### 9.7 Enable Rspamd Modules

```bash
sudo nano /etc/rspamd/local.d/options.inc
```

**Complete configuration:**
```conf
# Rspamd options
dns {
  nameserver = ["8.8.8.8", "8.8.4.4"];
}
replies = 1;
history {
  rows = 1000;
}
```

### 9.8 Configure Postfix to Use Rspamd

```bash
# Edit master.cf
sudo nano /etc/postfix/master.cf
```

**Add Rspamd milter (should already be there from Phase 4):**
```conf
smtpd_milters = inet:127.0.0.1:11332
non_smtpd_milters = inet:127.0.0.1:11332
```

### 9.9 Add DKIM Public Key to DNS

**Extract public key:**
```bash
sudo rspamadm dkim_keygen -d ementech.co.ke -s default -k 2048 | grep -A1 "default._domainkey"
```

**Add this DNS record:**
```
default._domainkey.ementech.co.ke. IN TXT "v=DKIM1; k=rsa; p=<YOUR_PUBLIC_KEY>"
```

**Replace `<YOUR_PUBLIC_KEY>` with the output from the command above (the part after `p=`).**

### 9.10 Restart Services

```bash
# Restart Rspamd
sudo systemctl restart rspamd

# Restart Postfix
sudo systemctl restart postfix

# Check all services are running
sudo systemctl status rspamd redis-server postfix
```

**Verification:**
```bash
# Check Rspamd is working
sudo rspamc stat

# Test DKIM signing (send test email)
echo "Test email" | mail -s "DKIM test" ceo@ementech.co.ke

# Check email headers for DKIM-Signature
sudo tail -100 /var/log/mail.log | grep dkim

# Test spam filtering
echo -e "Subject: Test spam\n\nXJS*C4JDBQADN1.NSBN3*2IDNEN*GTUBE-STANDARD-ANTI-UBE-TEST-EMAIL*C.34X" | sendmail ceo@ementech.co.ke

# Check if spam is detected
sudo tail -f /var/log/mail.log | grep -i spam
```

**Expected Output:**
- Rspamd shows "OK" status
- Emails have DKIM-Signature header
- GTUBE spam test is detected and scored high

**Troubleshooting:**
- Check Rspamd logs: `sudo tail -f /var/log/rspamd/rspamd.log`
- Test DKIM key: `sudo rspamadm dkim_keygen -d ementech.co.ke -s default`
- Verify milter connection: `sudo netstat -tulpn | grep 11332`
- Check Redis: `redis-cli ping` (should return PONG)
- Use web interface: https://mail.ementech.co.ke:11334 (requires password)

**Rollback:**
```bash
# Disable Rspamd milter in Postfix
sudo postconf -e "smtpd_milters = "
sudo postconf -e "non_smtpd_milters = "
sudo systemctl reload postfix

# Restore Rspamd config
sudo cp -r /etc/rspamd.backup/* /etc/rspamd/
sudo systemctl restart rspamd
```

---

## Phase 10: Webmail Setup

**Estimated Time:** 20-30 minutes
**Goal:** Configure Roundcube webmail interface

### 10.1 Prerequisites Check

```bash
# Check Roundcube is installed
dpkg -l | grep roundcube

# Check PHP version
php --version

# Check nginx status
sudo systemctl status nginx
```

### 10.2 Configure Roundcube Database

```bash
# Configure Roundcube with PostgreSQL
sudo nano /etc/roundcube/config.inc.php
```

**Update these lines:**
```php
<?php
// Database configuration
$config['db_dsnw'] = 'pgsql://roundcube:CHANGE_THIS_PASSWORD@localhost/roundcubemail';

// Domain
$config['mail_domain'] = 'ementech.co.ke';

// Default host
$config['default_host'] = 'tls://mail.ementech.co.ke';

// SMTP server
$config['smtp_server'] = 'tls://mail.ementech.co.ke';
$config['smtp_port'] = 587;

// SMTP user (use current user)
$config['smtp_user'] = '%u';
$config['smtp_pass'] = '%p';

// IMAP options
$config['imap_host'] = 'ssl://mail.ementech.co.ke';
$config['imap_port'] = 993;

// Product name
$config['product_name'] = 'EmenTech Webmail';

// Skin
$config['skin'] = 'elastic';

// Plugins
$config['plugins'] = ['archive', 'zipdownload', 'managesieve', 'markasjunk'];

// Language
$config['language'] = en_US;

// Enable spell checking
$config['enable_spellcheck'] = true;

// Compose HTML emails
$config['html_editor'] = true;
```

### 10.3 Create Roundcube PostgreSQL Database

```bash
# Create database and user
sudo -u postgres psql
```

**SQL Commands:**
```sql
-- Create user
CREATE USER roundcube WITH PASSWORD 'CHANGE_THIS_PASSWORD';

-- Create database
CREATE DATABASE roundcubemail OWNER roundcube;

-- Import Roundcube schema
\i /usr/share/roundcube/SQL/postgres.initial.sql

-- Exit
\q
```

### 10.4 Configure Nginx for Roundcube

```bash
# Create nginx configuration
sudo nano /etc/nginx/sites-available/webmail.ementech.co.ke
```

**Complete nginx configuration:**
```nginx
server {
    listen 80;
    server_name webmail.ementech.co.ke;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name webmail.ementech.co.ke;

    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/ementech.co.ke/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ementech.co.ke/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

    # Security headers
    add_header X-Content-Type-Options nosniff always;
    add_header X-Frame-Options SAMEORIGIN always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Root directory
    root /var/lib/roundcube;

    index index.php index.html;

    # Logging
    access_log /var/log/nginx/webmail-access.log;
    error_log /var/log/nginx/webmail-error.log;

    # Client max size (for attachments)
    client_max_body_size 20M;

    location / {
        try_files $uri $uri/ /index.php?$args;
    }

    # PHP-FPM
    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }

    # Deny access to config files
    location ~ /config/ {
        deny all;
    }

    # Deny access to temp files
    location ~ /temp/ {
        deny all;
    }

    # Deny access to logs
    location ~ /logs/ {
        deny all;
    }
}
```

### 10.5 Enable Roundcube Site

```bash
# Create symlink
sudo ln -s /etc/nginx/sites-available/webmail.ementech.co.ke /etc/nginx/sites-enabled/

# Test nginx configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

### 10.6 Obtain SSL Certificate for Webmail

```bash
# Stop nginx temporarily
sudo systemctl stop nginx

# Obtain certificate
sudo certbot certonly --standalone \
  -d webmail.ementech.co.ke \
  --email admin@ementech.co.ke \
  --agree-tos \
  --non-interactive \
  --rsa-key-size 4096

# Start nginx
sudo systemctl start nginx
```

### 10.7 Configure PHP Settings

```bash
# Edit php.ini
sudo nano /etc/php/8.3/fpm/php.ini
```

**Update these settings:**
```ini
; File uploads
upload_max_filesize = 20M
post_max_size = 20M
memory_limit = 256M

; Performance (optimize for 2GB RAM)
max_execution_time = 300
max_input_time = 300

; Security
expose_php = Off
display_errors = Off
log_errors = On
```

**Restart PHP-FPM:**
```bash
sudo systemctl restart php8.3-fpm
```

### 10.8 Set Proper Permissions

```bash
# Set ownership
sudo chown -R www-data:www-data /var/lib/roundcube
sudo chown -R www-data:www-data /etc/roundcube

# Set permissions
sudo chmod -R 755 /var/lib/roundcube
sudo chmod -R 750 /etc/roundcube
```

### 10.9 Add DNS Record for Webmail

**Add this DNS record at your registrar:**
```
webmail.ementech.co.ke. IN A 69.164.244.165
```

**Verification:**
```bash
# Check DNS propagation
dig +short webmail.ementech.co.ke

# Test webmail access
curl -I https://webmail.ementech.co.ke

# Access in browser
# https://webmail.ementech.co.ke

# Login with test account
# Username: ceo@ementech.co.ke
# Password: [your password]

# Test sending email
# Test receiving email
```

**Expected Output:**
- Webmail loads in browser
- Can login with email account
- Can send and receive emails
- No errors in nginx or PHP logs

**Troubleshooting:**
- Check nginx logs: `sudo tail -f /var/log/nginx/webmail-error.log`
- Check PHP logs: `sudo tail -f /var/log/php8.3-fpm.log`
- Check Roundcube logs: `sudo tail -f /var/log/roundcube/errors`
- Verify permissions: `ls -la /var/lib/roundcube`
- Test database connection: `sudo -u roundcube psql roundcubemail -c "SELECT 1;"`
- Check PHP-FPM is running: `sudo systemctl status php8.3-fpm`

**Rollback:**
```bash
# Remove nginx configuration
sudo rm /etc/nginx/sites-enabled/webmail.ementech.co.ke
sudo systemctl reload nginx

# Remove DNS record
# (at your registrar)

# Remove Roundcube
sudo apt-get remove --purge -y roundcube roundcube-core roundcube-plugins

# Drop database
sudo -u postgres psql -c "DROP DATABASE roundcubemail;"
sudo -u postgres psql -c "DROP USER roundcube;"
```

---

## Phase 11: Email Account Creation

**Estimated Time:** 20-25 minutes
**Goal:** Create all 5 email accounts

### 11.1 Prerequisites Check

```bash
# Verify database is accessible
sudo -u postgres psql mailserver_db -c "SELECT * FROM domains;"

# Check domain ID
sudo -u postgres psql mailserver_db -c "SELECT id, domain FROM domains;"
```

### 11.2 Generate Strong Passwords

```bash
# Install password generator
sudo apt-get install -y pwgen

# Generate 5 strong passwords
pwgen -s 16 5
```

**Save these passwords securely!**

Example output:
```
x8K2mP9vL3wR6nT1
Q4jW7fY2hN9pB5cZ
a3D6gJ9kM2sP5tV8
b1E4hL7oK0nS6uY9
c2F5iM8pQ3vT7wX0
```

### 11.3 Create Email Accounts

```bash
# Connect to database
sudo -u postgres psql mailserver_db
```

**SQL Commands to create all accounts:**
```sql
-- Get domain ID first
\echo 'Domain ID:'
SELECT id FROM domains WHERE domain='ementech.co.ke';

-- Create CEO account (replace DOMAIN_ID with actual ID, usually 1)
INSERT INTO users (user_id, domain_id, password, email, quota) VALUES
('ceo', 1, '{SHA512-CRYPT}$6$rounds=500000$hash_here', 'ceo@ementech.co.ke', 2147483648);

-- Create info account
INSERT INTO users (user_id, domain_id, password, email, quota) VALUES
('info', 1, '{SHA512-CRYPT}$6$rounds=500000$hash_here', 'info@ementech.co.ke', 1073741824);

-- Create support account
INSERT INTO users (user_id, domain_id, password, email, quota) VALUES
('support', 1, '{SHA512-CRYPT}$6$rounds=500000$hash_here', 'support@ementech.co.ke', 1073741824);

-- Create admin account
INSERT INTO users (user_id, domain_id, password, email, quota) VALUES
('admin', 1, '{SHA512-CRYPT}$6$rounds=500000$hash_here', 'admin@ementech.co.ke', 2147483648);

-- Create tech account
INSERT INTO users (user_id, domain_id, password, email, quota) VALUES
('tech', 1, '{SHA512-CRYPT}$6$rounds=500000$hash_here', 'tech@ementech.co.ke', 1073741824);

-- Verify all accounts
SELECT user_id, email, enabled, quota/1024/1024/1024 as quota_gb FROM users;

-- Exit
\q
```

### 11.4 Generate Password Hashes

```bash
# Generate hash for CEO (replace with your password)
mkpasswd -m sha-512 'CEO_PASSWORD_HERE'

# Generate hash for info
mkpasswd -m sha-512 'INFO_PASSWORD_HERE'

# Generate hash for support
mkpasswd -m sha-512 'SUPPORT_PASSWORD_HERE'

# Generate hash for admin
mkpasswd -m sha-512 'ADMIN_PASSWORD_HERE'

# Generate hash for tech
mkpasswd -m sha-512 'TECH_PASSWORD_HERE'
```

**Copy the hashes and update the SQL INSERT statements above.**

### 11.5 Create Mail Directories

```bash
# Create domain directory
sudo mkdir -p /var/mail/vhosts/ementech.co.ke

# Create user mail directories
sudo mkdir -p /var/mail/vhosts/ementech.co.ke/{ceo,info,support,admin,tech}

# Set ownership
sudo chown -R vmail:vmail /var/mail/vhosts/ementech.co.ke

# Set permissions
sudo chmod -R 770 /var/mail/vhosts/ementech.co.ke

# Verify
ls -la /var/mail/vhosts/ementech.co.ke/
```

### 11.6 Create Aliases (Optional)

```bash
# Connect to database
sudo -u postgres psql mailserver_db
```

**SQL Commands for useful aliases:**
```sql
-- Create aliases (get domain ID first)
SELECT id FROM domains WHERE domain='ementech.co.ke';

-- Postmaster to admin
INSERT INTO aliases (domain_id, source, destination) VALUES
(1, 'postmaster@ementech.co.ke', 'admin@ementech.co.ke');

-- Abuse to admin
INSERT INTO aliases (domain_id, source, destination) VALUES
(1, 'abuse@ementech.co.ke', 'admin@ementech.co.ke');

-- Webmaster to tech
INSERT INTO aliases (domain_id, source, destination) VALUES
(1, 'webmaster@ementech.co.ke', 'tech@ementech.co.ke');

-- Verify aliases
SELECT * FROM aliases;

-- Exit
\q
```

### 11.7 Create System Aliases

```bash
# Edit /etc/aliases
sudo nano /etc/aliases
```

**Add/modify these aliases:**
```
# System aliases
postmaster: admin@ementech.co.ke
abuse: admin@ementech.co.ke
webmaster: tech@ementech.co.ke
root: admin@ementech.co.ke
```

**Rebuild aliases:**
```bash
sudo newaliases
```

### 11.8 Test Account Creation

```bash
# Test authentication for each account
doveadm auth test ceo@ementech.co.ke PASSWORD
doveadm auth test info@ementech.co.ke PASSWORD
doveadm auth test support@ementech.co.ke PASSWORD
doveadm auth test admin@ementech.co.ke PASSWORD
doveadm auth test tech@ementech.co.ke PASSWORD

# Expected output: pass authenticated
```

### 11.9 Create Account Documentation

**Create a secure file with all account details:**
```bash
# Create file
nano /root/email-accounts.txt
```

**Content:**
```
EmenTech Email Accounts
Created: 2025-01-19
Server: ementech-mail.ementech.co.ke

CEO Account:
Email: ceo@ementech.co.ke
Password: [GENERATED_PASSWORD]
Quota: 2GB
IMAP: mail.ementech.co.ke:993 (SSL)
SMTP: mail.ementech.co.ke:587 (STARTTLS)
Webmail: https://webmail.ementech.co.ke

Info Account:
Email: info@ementech.co.ke
Password: [GENERATED_PASSWORD]
Quota: 1GB
[Same server settings]

Support Account:
Email: support@ementech.co.ke
Password: [GENERATED_PASSWORD]
Quota: 1GB
[Same server settings]

Admin Account:
Email: admin@ementech.co.ke
Password: [GENERATED_PASSWORD]
Quota: 2GB
[Same server settings]

Tech Account:
Email: tech@ementech.co.ke
Password: [GENERATED_PASSWORD]
Quota: 1GB
[Same server settings]

---

Database Access:
Database: mailserver_db
User: mailserver
Password: [DB_PASSWORD]

PostgreSQL: psql -h localhost mailserver_db mailserver

DKIM Selector: default
DKIM Key: /var/lib/rspamd/dkim/ementech.co.ke.default.key

SSL Certificates:
Location: /etc/letsencrypt/live/mail.ementech.co.ke/
Auto-renewal: Enabled (certbot timer)

Service Commands:
systemctl status postfix
systemctl status dovecot
systemctl status rspamd

Log Files:
/var/log/mail.log
/var/log/dovecot.log
/var/log/rspamd/rspamd.log
```

**Secure the file:**
```bash
sudo chmod 600 /root/email-accounts.txt
```

**Verification:**
```bash
# Verify all accounts in database
sudo -u postgres psql mailserver_db -c "SELECT user_id, email, enabled, quota/1024/1024/1024 as quota_gb FROM users;"

# Verify mail directories exist
ls -la /var/mail/vhosts/ementech.co.ke/

# Test login to webmail for each account
# https://webmail.ementech.co.ke

# Send test email from one account to another
echo "Test email from CEO to Info" | mail -s "Test" info@ementech.co.ke

# Check email was received
sudo tail -f /var/log/mail.log
```

**Expected Output:**
- All 5 accounts exist in database
- All mail directories exist
- All accounts can authenticate
- Emails can be sent between accounts
- Webmail login works for all accounts

**Troubleshooting:**
- If authentication fails, verify password hashes: `SELECT email, password FROM users;`
- Check Dovecot auth logs: `sudo tail -f /var/log/dovecot.log | grep auth`
- Test SQL connection: `sudo -u mailserver psql mailserver_db`
- Verify file permissions: `ls -la /var/mail/vhosts/`

**Rollback:**
```bash
# Delete all accounts
sudo -u postgres psql mailserver_db -c "DELETE FROM users WHERE domain_id=1;"
sudo -u postgres psql mailserver_db -c "DELETE FROM aliases WHERE domain_id=1;"

# Remove mail directories
sudo rm -rf /var/mail/vhosts/ementech.co.ke
```

---

## Phase 12: Testing & Verification

**Estimated Time:** 30-40 minutes
**Goal:** Comprehensive testing of all email server components

### 12.1 Prerequisites Check

```bash
# Verify all services are running
sudo systemctl status postfix dovecot rspamd redis-server nginx

# Check ports are listening
sudo netstat -tulpn | grep -E "25|587|465|143|993|995"
```

### 12.2 Test DNS Records

```bash
# Test all DNS records
echo "Testing A records..."
dig +short mail.ementech.co.ke A
dig +short smtp.ementech.co.ke A
dig +short imap.ementech.co.ke A

echo "Testing MX record..."
dig +short MX ementech.co.ke

echo "Testing SPF record..."
dig +short TXT ementech.co.ke | grep spf

echo "Testing DMARC record..."
dig +short TXT _dmarc.ementech.co.ke

echo "Testing DKIM record..."
dig +short TXT default._domainkey.ementech.co.ke

echo "Testing PTR record..."
dig -x 69.164.244.165 +short
```

**Expected Output:**
```
Testing A records...
69.164.244.165
69.164.244.165
69.164.244.165

Testing MX record...
10 mail.ementech.co.ke.

Testing SPF record...
"v=spf1 mx a ip4:69.164.244.165 -all"

Testing DMARC record...
"v=DMARC1; p=quarantine; rua=mailto:admin@ementech.co.ke; ..."

Testing DKIM record...
"v=DKIM1; k=rsa; p=..."

Testing PTR record...
mail.ementech.co.ke.
```

### 12.3 Test SMTP (Port 25)

```bash
# Test incoming mail
telnet localhost 25
```

**Expected conversation:**
```
Trying 127.0.0.1...
Connected to localhost.
Escape character is '^]'.
220 ementech-mail.ementech.co.ke ESMTP Postfix (Ubuntu)

EHLO test.com
250-ementech-mail.ementech.co.ke
250-PIPELINING
250-SIZE 20971520
250-VRFY
250-ETRN
250-STARTTLS
250-ENHANCEDSTATUSCODES
250-8BITMIME
250 DSN

MAIL FROM:<test@example.com>
250 2.1.0 Ok

RCPT TO:<ceo@ementech.co.ke>
250 2.1.5 Ok

DATA
354 End data with <CR><LF>.<CR><LF>

Subject: Test email
From: test@example.com
To: ceo@ementech.co.ke

This is a test email.
.
250 2.0.0 Ok: queued as XXXXX

QUIT
221 2.0.0 Bye
Connection closed by foreign host.
```

### 12.4 Test SMTP Submission (Port 587)

```bash
# Test authenticated SMTP
swaks --to ceo@ementech.co.ke \
  --from info@ementech.co.ke \
  --server mail.ementech.co.ke:587 \
  --auth \
  --auth-user info@ementech.co.ke \
  --auth-password [PASSWORD] \
  --tls
```

**Expected Output:**
```
=== Trying mail.ementech.co.ke:587 ===
=== Connected to mail.ementech.co.ke. ===
<-  220 ementech-mail.ementech.co.ke ESMTP Postfix (Ubuntu)
 -> EHLO server.example.com
<-  250-ementech-mail.ementech.co.ke
<-  250-PIPELINING
<-  250-SIZE 20971520
<-  250-VRFY
<-  250-ETRN
<-  250-STARTTLS
<-  250-AUTH PLAIN LOGIN
<-  250-ENHANCEDSTATUSCODES
<-  250-8BITMIME
<-  250 DSN
 -> STARTTLS
<-  220 2.0.0 Ready to start TLS
=== TLS started with cipher TLSv1.3:TLS_AES_256_GCM_SHA384 ===
 -> EHLO server.example.com
<-  250-ementech-mail.ementech.co.ke
<-  250-PIPELINING
<-  250-SIZE 20971520
<-  250-VRFY
<-  250-ETRN
<-  250-AUTH PLAIN LOGIN
<-  250-ENHANCEDSTATUSCODES
<-  250-8BITMIME
<-  250 DSN
 -> AUTH PLAIN [BASE64_AUTH]
<-  235 2.7.0 Authentication successful
 -> MAIL FROM:<info@ementech.co.ke>
<-  250 2.1.0 Ok
 -> RCPT TO:<ceo@ementech.co.ke>
<-  250 2.1.5 Ok
 -> DATA
<-  354 End data with <CR><LF>.<CR><LF>
 -> From: info@ementech.co.ke
 -> To: ceo@ementech.co.ke
 -> Subject: test Mon, 19 Jan 2025 12:00:00 +0000
 -> Date: Mon, 19 Jan 2025 12:00:00 +0000
 ->
 -> This is a test mailing
 ->
 ->
 -> .
<-  250 2.0.0 Ok: queued as XXXXX
 -> QUIT
<-  221 2.0.0 Bye
=== Connection closed with remote host. ===
```

### 12.5 Test IMAP (Port 993)

```bash
# Test IMAP over SSL
openssl s_client -connect mail.ementech.co.ke:993 -crlf
```

**Expected conversation:**
```
CONNECTED(00000003)
...
* OK [CAPABILITY IMAP4rev1 SASL-IR LOGIN-REFERRALS ID ENABLE IDLE NAMESPACE LITERAL+ STARTTLS AUTH=PLAIN AUTH=LOGIN] Dovecot ready.

a001 LOGIN ceo@ementech.co.ke [PASSWORD]
a001 OK [CAPABILITY IMAP4rev1 SASL-IR LOGIN-REFERRALS ID ENABLE IDLE SORT SORT=DISPLAY THREAD=REFERENCES THREAD=REFS MULTIAPPEND BINARY CATENATE UNSELECT SEARCH=FUZZY SCAN SNIPPET=FUZZY STATUS=SIZE CONDSTORE QUOTA LIST-EXTENDED LIST-STATUS MOVE SPECIAL-USE CHILDREN ESEARCH ESORT SEARCHRES WITHIN CONTEXT=SEARCH PREVIEW=BODY] Logged in

a001 LIST "" "*"
* LIST (\HasNoChildren) "." INBOX
a001 OK LIST completed

a002 SELECT INBOX
* FLAGS (\Answered \Flagged \Deleted \Seen \Draft)
* OK [PERMANENTFLAGS (\Answered \Flagged \Deleted \Seen \Draft \*)] Flags permitted.
* OK [UNSEEN 0] First unseen.
* OK [UIDVALIDITY 1234567890] UIDs valid
* 1 EXISTS
* 1 RECENT
* OK [UIDNEXT 1] Predicted next UID
a002 OK [READ-WRITE] Select completed (0.001 secs).

a003 LOGOUT
* BYE Logging out
a003 OK Logout completed.
```

### 12.6 Test Spam Filtering

```bash
# Send GTUBE test spam
echo -e "Subject: Test spam\n\nXJS*C4JDBQADN1.NSBN3*2IDNEN*GTUBE-STANDARD-ANTI-UBE-TEST-EMAIL*C.34X" | sendmail ceo@ementech.co.ke

# Check if spam is detected
sudo tail -f /var/log/mail.log | grep -i spam
sudo tail -f /var/log/rspamd/rspamd.log | grep -i spam
```

**Expected Output:**
```
# Email should be flagged as spam
# Score should be high (1000+)
# Header should be added or email rejected
```

### 12.7 Test DKIM Signing

```bash
# Send test email
echo "Test DKIM signing" | mail -s "DKIM Test" ceo@ementech.co.ke

# Check email headers
sudo tail -100 /var/log/mail.log | grep dkim

# View email headers
# In webmail, view message source
# Should see: DKIM-Signature: v=1; a=rsa-sha256; c=relaxed/relaxed; d=ementech.co.ke; s=default; ...
```

### 12.8 Test Webmail

```bash
# Access webmail in browser
# https://webmail.ementech.co.ke

# Test login for each account:
# - ceo@ementech.co.ke
# - info@ementech.co.ke
# - support@ementech.co.ke
# - admin@ementech.co.ke
# - tech@ementech.co.ke

# Test sending email from webmail
# Test receiving email in webmail
# Test folder creation (Drafts, Sent, Trash)
# Test attachment upload
```

### 12.9 Test Email Deliverability

```bash
# Send test email to external address
echo "Test email to Gmail" | mail -s "Deliverability Test" your-email@gmail.com

# Check if received in Spam folder
# Check headers for SPF/DKIM/DMARC results

# Use online tools:
# https://www.mail-tester.com/
# https://mxtoolbox.com/deliverability
```

**Check Gmail headers for:**
```
Received-SPF: pass (google.com: domain of ceo@ementech.co.ke designates 69.164.244.165 as permitted sender)
Authentication-Results: mx.google.com;
  dkim=pass header.i=@ementech.co.ke;
  spf=pass (google.com: domain of ceo@ementech.co.ke designates 69.164.244.165 as permitted sender);
  dmarc=pass (p=QUARANTINE sp=QUARANTINE dis=NONE) header.from=ementech.co.ke
```

### 12.10 Performance Testing

```bash
# Check memory usage
free -h

# Check disk usage
df -h /var/mail/vhosts

# Check Postfix queue
sudo postqueue -p

# Check mail queue size
sudo find /var/spool/postfix -type f | wc -l

# Test concurrent connections
for i in {1..10}; do
  doveadm auth test ceo@ementech.co.ke [PASSWORD] &
done
wait
```

**Expected Results:**
- Memory usage should be < 1.5GB
- Disk usage should be minimal
- No stuck emails in queue
- All authentication tests pass

### 12.11 Online Verification Tools

**Use these tools to verify your server:**

1. **MXToolbox:**
   - https://mxtoolbox.com/diagnostic.aspx
   - Check: MX, SPF, DKIM, DMARC, SMTP, PTR

2. **Mail-Tester:**
   - https://www.mail-tester.com/
   - Send test email and get score
   - Aim for 8/10 or higher

3. **DNSlytics:**
   - https://dnslytics.com/
   - Check DNS propagation

4. **SSL Labs:**
   - https://www.ssllabs.com/ssltest/
   - Test SSL configuration
   - Aim for A+ grade

5. **CheckTLS:**
   - https://www.checktls.com/
   - Test email encryption

**Verification Checklist:**
- [ ] All DNS records are correct and propagated
- [ ] SMTP (25) accepts incoming mail
- [ ] SMTP Submission (587) requires authentication
- [ ] IMAPS (993) works with SSL/TLS
- [ ] Webmail is accessible via HTTPS
- [ ] All 5 accounts can login
- [ ] Emails can be sent between accounts
- [ ] Emails can be sent to external addresses
- [ ] Emails from external addresses are received
- [ ] DKIM signing is working
- [ ] SPF passes
- [ ] DMARC passes
- [ ] Spam filtering detects spam
- [ ] SSL/TLS is properly configured
- [ ] No errors in logs

**Troubleshooting:**
- Check logs: `sudo tail -f /var/log/mail.log`
- Check all services: `sudo systemctl status postfix dovecot rspamd`
- Test DNS: `dig +short MX ementech.co.ke`
- Test authentication: `doveadm auth test ceo@ementech.co.ke PASSWORD`
- Verify SSL: `openssl s_client -connect mail.ementech.co.ke:993`

**No rollback needed - this is a testing phase**

---

## Phase 13: Security Hardening

**Estimated Time:** 20-30 minutes
**Goal:** Implement security measures and protection

### 13.1 Prerequisites Check

```bash
# Check current firewall status
sudo ufw status numbered

# Check for open ports
sudo netstat -tulpn | grep LISTEN

# Check failed login attempts
sudo tail -100 /var/log/auth.log | grep "Failed password"
```

### 13.2 Configure Fail2ban

```bash
# Install Fail2ban
sudo apt-get install -y fail2ban

# Create local configuration
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local

# Edit configuration
sudo nano /etc/fail2ban/jail.local
```

**Add/modify these jails:**
```conf
[DEFAULT]
bantime = 1h
findtime = 10m
maxretry = 5
destemail = admin@ementech.co.ke
sendername = Fail2Ban
action = %(action_mwl)s

[sshd]
enabled = true
port = 22
maxretry = 3
bantime = 24h

[postfix-sasl]
enabled = true
port = smtp,465,587,submission
logpath = /var/log/mail.log
maxretry = 5
bantime = 1h

[dovecot]
enabled = true
port = pop3,pop3s,imap,imaps,submission,465,sieve
logpath = /var/log/dovecot.log
maxretry = 5
bantime = 1h

[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/webmail-error.log
maxretry = 5
bantime = 1h

[nginx-limit-req]
enabled = true
port = http,https
logpath = /var/log/nginx/webmail-error.log
maxretry = 10
bantime = 10m

[roundcube-auth]
enabled = true
port = http,https
logpath = /var/log/roundcube/errors
maxretry = 5
bantime = 1h
```

**Start Fail2ban:**
```bash
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Check status
sudo fail2ban-client status
sudo fail2ban-client status postfix-sasl
sudo fail2ban-client status dovecot
```

### 13.3 Configure Postfix Rate Limiting

```bash
# Edit main.cf
sudo nano /etc/postfix/main.cf
```

**Add these rate limiting settings:**
```conf
# Rate limiting
smtpd_client_connection_count_limit = 10
smtpd_client_connection_rate_limit = 30
smtpd_client_message_rate_limit = 100
smtpd_client_recipient_rate_limit = 50

# Anvil rate limiting
anvil_rate_time_unit = 60s
anvil_status_update_time = 600s
```

### 13.4 Configure Postscreen (Postgrey Alternative)

```bash
# Edit main.cf
sudo nano /etc/postfix/main.cf
```

**Add postscreen configuration:**
```conf
# Postscreen (greylisting)
postscreen_dnsbl_threshold = 3
postscreen_dnsbl_sites = zen.spamhaus.org*3
                          bl.spamcop.net*2
                          b.barracudacentral.org*2
postscreen_dnsbl_action = enforce
postscreen_greet_action = enforce
postscreen_bare_newline_action = enforce
```

**Edit master.cf:**
```bash
sudo nano /etc/postfix/master.cf
```

**Add postscreen service:**
```conf
# Postscreen
postscreen   unix  -       -       y       -       1       postscreen
smtpd        pass  -       -       y       -       -       smtpd
dnsblog      unix  -       -       y       -       1       dnsblog
tlsproxy     unix  -       -       y       -       1       tlsproxy
```

### 13.5 Configure Dovecot Security

```bash
# Edit dovecot.conf
sudo nano /etc/dovecot/dovecot.conf
```

**Add security settings:**
```conf
# Authentication security
auth_mechanisms = PLAIN LOGIN
auth_username_format = %Lu

# Disable insecure authentication
disable_plaintext_auth = yes

# Rate limiting
mail_max_userip_connections = 30
imap_max_line_length = 64k

# Process limits
default_process_limit = 100
default_client_limit = 1000

# Disable unneeded plugins
mail_plugins = quota imap_quota
protocol imap {
  mail_plugins = quota imap_quota
}
protocol pop3 {
  mail_plugins = quota
}
```

### 13.6 Secure SSH Access

```bash
# Edit SSH configuration
sudo nano /etc/ssh/sshd_config
```

**Add/modify these settings:**
```conf
# Security settings
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
Protocol 2
MaxAuthTries 3
LoginGraceTime 60
ClientAliveInterval 300
ClientAliveCountMax 2

# Allow only specific users (optional)
AllowUsers munene
```

**Restart SSH:**
```bash
sudo systemctl restart sshd

# IMPORTANT: Make sure you have SSH key access before closing your session!
```

### 13.7 Configure Kernel Security Parameters

```bash
# Edit sysctl.conf
sudo nano /etc/sysctl.conf
```

**Add these security settings:**
```conf
# Network security
net.ipv4.ip_forward = 0
net.ipv4.conf.all.send_redirects = 0
net.ipv4.conf.default.send_redirects = 0
net.ipv4.conf.all.accept_source_route = 0
net.ipv4.conf.default.accept_source_route = 0
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.default.accept_redirects = 0
net.ipv4.conf.all.secure_redirects = 0
net.ipv4.conf.default.secure_redirects = 0
net.ipv4.icmp_echo_ignore_broadcasts = 1
net.ipv4.icmp_ignore_bogus_error_responses = 1
net.ipv4.conf.all.rp_filter = 1
net.ipv4.conf.default.rp_filter = 1
net.ipv4.tcp_syncookies = 1

# Improve system performance
net.core.somaxconn = 1024
net.ipv4.tcp_max_syn_backlog = 2048
vm.swappiness = 10
```

**Apply settings:**
```bash
sudo sysctl -p
```

### 13.8 Install and Configure Rootkit Hunter

```bash
# Install rkhunter
sudo apt-get install -y rkhunter

# Update rkhunter
sudo rkhunter --update
sudo rkhunter --propupd

# Run initial scan
sudo rkhunter --check --sk

# Configure email alerts
sudo nano /etc/rkhunter.conf
```

**Update these settings:**
```conf
# Email settings
MAIL-ON-WARNING="admin@ementech.co.ke"
MAIL_CMD=mail
```

### 13.9 Configure Log Rotation

```bash
# Create logrotate config for mail logs
sudo nano /etc/logrotate.d/mail
```

**Complete configuration:**
```
/var/log/mail.log
/var/log/mail.err
/var/log/mail.info
{
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 0640 syslog adm
    sharedscripts
    postrotate
        systemctl reload postfix > /dev/null 2>&1 || true
        systemctl reload dovecot > /dev/null 2>&1 || true
    endscript
}

/var/log/dovecot.log
/var/log/dovecot-info.log
{
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 0640 root root
    sharedscripts
    postrotate
        systemctl reload dovecot > /dev/null 2>&1 || true
    endscript
}
```

**Verification:**
```bash
# Check Fail2ban is running
sudo fail2ban-client status

# Check Fail2ban bans
sudo fail2ban-client status postfix-sasl

# Check all services are still running
sudo systemctl status postfix dovecot rspamd fail2ban

# Check firewall
sudo ufw status numbered

# Test a failed login (should be banned after 5 attempts)
doveadm auth test ceo@ementech.co.ke wrongpassword
# Repeat 5 times, then check:
sudo fail2ban-client status dovecot
```

**Expected Output:**
- Fail2ban shows banned IPs
- All services still running
- Firewall is active
- No errors in logs

**Troubleshooting:**
- Check Fail2ban logs: `sudo tail -f /var/log/fail2ban.log`
- Unban IP if needed: `sudo fail2ban-client set dovecot unbanip IP_ADDRESS`
- Check iptables: `sudo iptables -L -n -v | grep f2b`
- Verify SSH access before disabling password authentication

**Rollback:**
```bash
# Stop Fail2ban
sudo systemctl stop fail2ban

# Disable postscreen in Postfix
sudo postconf -e "postscreen_dnsbl_action = ignore"
sudo postconf -e "postscreen_greet_action = ignore"
sudo postconf -e "postscreen_bare_newline_action = ignore"

# Restore SSH config
sudo sed -i 's/PasswordAuthentication no/PasswordAuthentication yes/' /etc/ssh/sshd_config
sudo sed -i 's/PermitRootLogin no/PermitRootLogin yes/' /etc/ssh/sshd_config

# Reload services
sudo systemctl reload postfix sshd
```

---

## Phase 14: Monitoring Setup

**Estimated Time:** 20-25 minutes
**Goal:** Set up monitoring and alerting for email server

### 14.1 Prerequisites Check

```bash
# Check disk space
df -h

# Check memory
free -h

# Check if monitoring tools are installed
which htop iotop
```

### 14.2 Install Monitoring Tools

```bash
# Install monitoring tools
sudo apt-get install -y htop iotop sysstat mailutils

# Enable sysstat
sudo systemctl enable sysstat
sudo systemctl start sysstat
```

### 14.3 Configure Mail Queue Monitoring Script

```bash
# Create monitoring script
sudo nano /usr/local/bin/check-mail-queue.sh
```

**Complete script:**
```bash
#!/bin/bash
# Mail queue monitoring script

THRESHOLD=100
QUEUE=$(mailq | grep -c "^[A-F0-9]")

if [ $QUEUE -gt $THRESHOLD ]; then
    echo "WARNING: Mail queue has $QUEUE messages (threshold: $THRESHOLD)" | \
        mail -s "Mail Queue Alert: $QUEUE messages" admin@ementech.co.ke
fi
```

**Make executable:**
```bash
sudo chmod +x /usr/local/bin/check-mail-queue.sh
```

### 14.4 Configure Disk Space Monitoring

```bash
# Create monitoring script
sudo nano /usr/local/bin/check-disk-space.sh
```

**Complete script:**
```bash
#!/bin/bash
# Disk space monitoring script

THRESHOLD=80
DISK_USAGE=$(df -h /var/mail | awk 'NR==2 {print $5}' | sed 's/%//')

if [ $DISK_USAGE -gt $THRESHOLD ]; then
    echo "WARNING: Mail disk usage is at ${DISK_USAGE}% (threshold: ${THRESHOLD}%)" | \
        mail -s "Disk Space Alert: ${DISK_USAGE}% used" admin@ementech.co.ke
fi
```

**Make executable:**
```bash
sudo chmod +x /usr/local/bin/check-disk-space.sh
```

### 14.5 Configure Service Monitoring

```bash
# Create monitoring script
sudo nano /usr/local/bin/check-mail-services.sh
```

**Complete script:**
```bash
#!/bin/bash
# Service monitoring script

SERVICES="postfix dovecot rspamd nginx php8.3-fpm"
FAILED=""

for SERVICE in $SERVICES; do
    if ! systemctl is-active --quiet $SERVICE; then
        FAILED="$FAILED $SERVICE"
    fi
done

if [ ! -z "$FAILED" ]; then
    echo "WARNING: The following services are not running:$FAILED" | \
        mail -s "Service Alert: Services down" admin@ementech.co.ke

    # Attempt to restart failed services
    for SERVICE in $FAILED; do
        systemctl restart $SERVICE
    done
fi
```

**Make executable:**
```bash
sudo chmod +x /usr/local/bin/check-mail-services.sh
```

### 14.6 Configure Cron Jobs

```bash
# Add monitoring cron jobs
sudo crontab -e
```

**Add these cron jobs:**
```
# Check mail queue every 15 minutes
*/15 * * * * /usr/local/bin/check-mail-queue.sh

# Check disk space every hour
0 * * * * /usr/local/bin/check-disk-space.sh

# Check services every 5 minutes
*/5 * * * * /usr/local/bin/check-mail-services.sh

# Daily system health check at 6 AM
0 6 * * * /usr/bin/uptime | mail -s "Daily Uptime Report" admin@ementech.co.ke
```

### 14.7 Configure Logwatch

```bash
# Install logwatch
sudo apt-get install -y logwatch

# Configure logwatch
sudo nano /etc/cron.daily/00logwatch
```

**Edit configuration:**
```bash
# Add recipient address at the top
/usr/sbin/logwatch --output mail --mailto admin@ementech.co.ke --detail high
```

### 14.8 Configure Grafana/Prometheus (Optional)

**For advanced monitoring (optional, requires more RAM):**

```bash
# Install Prometheus node_exporter
sudo apt-get install -y prometheus-node-exporter

# Enable and start
sudo systemctl enable prometheus-node-exporter
sudo systemctl start prometheus-node-exporter

# Access metrics
# http://69.164.244.165:9100/metrics
```

### 14.9 Create Monitoring Dashboard

```bash
# Create dashboard file
sudo nano /root/mail-server-status.sh
```

**Complete script:**
```bash
#!/bin/bash
# Mail server status dashboard

clear
echo "=========================================="
echo "EmenTech Mail Server Status"
echo "=========================================="
date
echo ""

# System status
echo "--- System Status ---"
echo "Uptime: $(uptime)"
echo "Memory: $(free -h | grep Mem | awk '{print $3 "/" $2}')"
echo "Disk: $(df -h /var/mail | awk 'NR==2 {print $3 "/" $2 " (" $5 ")"}')"
echo ""

# Service status
echo "--- Service Status ---"
for SERVICE in postfix dovecot rspamd nginx fail2ban; do
    STATUS=$(systemctl is-active $SERVICE)
    echo -n "$SERVICE: "
    if [ "$STATUS" = "active" ]; then
        echo -e "\033[0;32mRunning\033[0m"
    else
        echo -e "\033[0;31mStopped\033[0m"
    fi
done
echo ""

# Mail queue
echo "--- Mail Queue ---"
mailq | tail -1
echo ""

# Recent errors
echo "--- Recent Mail Errors ---"
sudo tail -10 /var/log/mail.log | grep -i error
echo ""

# Failed login attempts
echo "--- Recent Failed Logins ---"
sudo tail -20 /var/log/auth.log | grep "Failed password" | tail -5
echo ""

echo "=========================================="
```

**Make executable:**
```bash
sudo chmod +x /root/mail-server-status.sh
```

**Run dashboard:**
```bash
/root/mail-server-status.sh
```

**Verification:**
```bash
# Test monitoring scripts
sudo /usr/local/bin/check-mail-queue.sh
sudo /usr/local/bin/check-disk-space.sh
sudo /usr/local/bin/check-mail-services.sh

# Check cron jobs
sudo crontab -l

# Run dashboard
/root/mail-server-status.sh

# Test logwatch
sudo logwatch --output stdout --detail high | less
```

**Expected Output:**
- All scripts run without errors
- Cron jobs are scheduled
- Dashboard displays server status
- Logwatch generates reports

**Troubleshooting:**
- Check mail logs: `sudo tail -f /var/log/mail.log`
- Verify cron is running: `sudo systemctl status cron`
- Test email delivery: `echo "test" | mail -s "test" admin@ementech.co.ke`
- Check script permissions: `ls -la /usr/local/bin/check-*.sh`

**Rollback:**
```bash
# Remove cron jobs
sudo crontab -e
# (delete the monitoring entries)

# Remove monitoring scripts
sudo rm -f /usr/local/bin/check-*.sh
sudo rm -f /root/mail-server-status.sh

# Uninstall monitoring tools
sudo apt-get remove --purge -y logwatch prometheus-node-exporter
```

---

## Phase 15: Backup Configuration

**Estimated Time:** 25-30 minutes
**Goal:** Set up automated backup system

### 15.1 Prerequisites Check

```bash
# Check available disk space
df -h

# Create backup directory
sudo mkdir -p /backup/mail-server
sudo chown root:root /backup/mail-server
sudo chmod 700 /backup/mail-server
```

### 15.2 Create Backup Script

```bash
# Create backup script
sudo nano /usr/local/bin/backup-mail-server.sh
```

**Complete script:**
```bash
#!/bin/bash
# Mail server backup script

# Configuration
BACKUP_DIR="/backup/mail-server"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Create backup directory
mkdir -p $BACKUP_DIR/$DATE

# Backup PostgreSQL database
echo "Backing up PostgreSQL database..."
sudo -u postgres pg_dump mailserver_db > $BACKUP_DIR/$DATE/mailserver_db.sql
sudo -u postgres pg_dump roundcubemail > $BACKUP_DIR/$DATE/roundcubemail.sql

# Backup mail directories
echo "Backing up mail directories..."
tar -czf $BACKUP_DIR/$DATE/mail-vhosts.tar.gz -C /var/mail vhosts

# Backup configurations
echo "Backing up configurations..."
tar -czf $BACKUP_DIR/$DATE/configs.tar.gz \
    /etc/postfix \
    /etc/dovecot \
    /etc/rspamd \
    /etc/nginx \
    /etc/roundcube \
    /etc/fail2ban

# Backup SSL certificates
echo "Backing up SSL certificates..."
tar -czf $BACKUP_DIR/$DATE/ssl-certs.tar.gz -C /etc letsencrypt

# Backup DKIM keys
echo "Backing up DKIM keys..."
tar -czf $BACKUP_DIR/$DATE/dkim-keys.tar.gz -C /var/lib/rspamd dkim

# Create checksum
echo "Creating checksums..."
cd $BACKUP_DIR/$DATE
sha256sum *.sql *.tar.gz > checksum.txt
cd -

# Compress entire backup
echo "Compressing backup..."
tar -czf $BACKUP_DIR/mail-server-$DATE.tar.gz -C $BACKUP_DIR $DATE
rm -rf $BACKUP_DIR/$DATE

# Set permissions
chmod 600 $BACKUP_DIR/mail-server-$DATE.tar.gz

# Remove old backups
echo "Removing old backups (older than $RETENTION_DAYS days)..."
find $BACKUP_DIR -name "mail-server-*.tar.gz" -mtime +$RETENTION_DAYS -delete

# Send notification
echo "Backup completed: mail-server-$DATE.tar.gz" | \
    mail -s "Mail Server Backup Completed" admin@ementech.co.ke

echo "Backup completed: $BACKUP_DIR/mail-server-$DATE.tar.gz"
```

**Make executable:**
```bash
sudo chmod +x /usr/local/bin/backup-mail-server.sh
```

### 15.3 Create Restore Script

```bash
# Create restore script
sudo nano /usr/local/bin/restore-mail-server.sh
```

**Complete script:**
```bash
#!/bin/bash
# Mail server restore script

if [ -z "$1" ]; then
    echo "Usage: $0 <backup-file.tar.gz>"
    echo "Example: $0 /backup/mail-server/mail-server-20250119_060000.tar.gz"
    exit 1
fi

BACKUP_FILE=$1
RESTORE_DIR=/tmp/mail-server-restore

# Verify backup file
if [ ! -f "$BACKUP_FILE" ]; then
    echo "Error: Backup file not found: $BACKUP_FILE"
    exit 1
fi

# Extract backup
echo "Extracting backup..."
mkdir -p $RESTORE_DIR
tar -xzf $BACKUP_FILE -C $RESTORE_DIR

BACKUP_DATE=$(ls $RESTORE_DIR | head -1)
BACKUP_PATH=$RESTORE_DIR/$BACKUP_DATE

# Verify checksums
echo "Verifying checksums..."
cd $BACKUP_PATH
sha256sum -c checksum.txt
if [ $? -ne 0 ]; then
    echo "Error: Checksum verification failed!"
    exit 1
fi
cd -

# Stop services
echo "Stopping services..."
systemctl stop postfix dovecot rspamd nginx

# Restore databases
echo "Restoring databases..."
sudo -u postgres psql -c "DROP DATABASE IF EXISTS mailserver_db;"
sudo -u postgres psql -c "DROP DATABASE IF EXISTS roundcubemail;"
sudo -u postgres psql -c "CREATE DATABASE mailserver_db OWNER mailserver;"
sudo -u postgres psql -c "CREATE DATABASE roundcubemail OWNER roundcube;"
sudo -u postgres psql mailserver_db < $BACKUP_PATH/mailserver_db.sql
sudo -u postgres psql roundcubemail < $BACKUP_PATH/roundcubemail.sql

# Restore mail directories
echo "Restoring mail directories..."
tar -xzf $BACKUP_PATH/mail-vhosts.tar.gz -C /var/mail

# Restore configurations
echo "Restoring configurations..."
tar -xzf $BACKUP_PATH/configs.tar.gz -C /

# Restore SSL certificates
echo "Restoring SSL certificates..."
tar -xzf $BACKUP_PATH/ssl-certs.tar.gz -C /

# Restore DKIM keys
echo "Restoring DKIM keys..."
tar -xzf $BACKUP_PATH/dkim-keys.tar.gz -C /

# Start services
echo "Starting services..."
systemctl start postfix dovecot rspamd nginx

# Cleanup
rm -rf $RESTORE_DIR

echo "Restore completed successfully!"
echo "Please verify all services are working correctly."
```

**Make executable:**
```bash
sudo chmod +x /usr/local/bin/restore-mail-server.sh
```

### 15.4 Configure Automated Backups

```bash
# Add backup cron job
sudo crontab -e
```

**Add this cron job:**
```
# Daily backup at 2 AM
0 2 * * * /usr/local/bin/backup-mail-server.sh

# Weekly backup on Sunday at 3 AM
0 3 * * 0 /usr/local/bin/backup-mail-server.sh
```

### 15.5 Configure Remote Backup (Optional)

**For off-site backups (e.g., S3, rsync to another server):**

```bash
# Create remote backup script
sudo nano /usr/local/bin/backup-remote.sh
```

**Example script for rsync:**
```bash
#!/bin/bash
# Remote backup script

REMOTE_SERVER="backup.example.com"
REMOTE_USER="backup"
REMOTE_DIR="/backups/ementech-mail"
LOCAL_DIR="/backup/mail-server"

# Sync to remote server
rsync -avz --delete \
    -e "ssh -i /root/.ssh/backup-key" \
    $LOCAL_DIR/ \
    $REMOTE_USER@$REMOTE_SERVER:$REMOTE_DIR/

# Send notification
if [ $? -eq 0 ]; then
    echo "Remote backup completed successfully" | \
        mail -s "Remote Backup Success" admin@ementech.co.ke
else
    echo "Remote backup failed!" | \
        mail -s "Remote Backup FAILED" admin@ementech.co.ke
fi
```

### 15.6 Test Backup and Restore

```bash
# Run backup
sudo /usr/local/bin/backup-mail-server.sh

# Verify backup exists
ls -lh /backup/mail-server/

# Test restore (WARNING: This will overwrite current data!)
# Uncomment to test:
# sudo /usr/local/bin/restore-mail-server.sh /backup/mail-server/mail-server-YYYYMMDD_HHMMSS.tar.gz

# Verify services are running
sudo systemctl status postfix dovecot rspamd
```

### 15.7 Create Backup Documentation

```bash
# Create backup documentation
sudo nano /backup/README.txt
```

**Complete documentation:**
```
EmenTech Mail Server Backup Documentation
==========================================

Backup Location: /backup/mail-server/
Retention: 30 days
Schedule: Daily at 2 AM

Backup Contents:
- PostgreSQL databases (mailserver_db, roundcubemail)
- Mail directories (/var/mail/vhosts)
- Configurations (Postfix, Dovecot, Rspamd, Nginx, Roundcube)
- SSL certificates (Let's Encrypt)
- DKIM keys

Restore Procedure:
1. Stop services: systemctl stop postfix dovecot rspamd nginx
2. Run restore: /usr/local/bin/restore-mail-server.sh <backup-file>
3. Verify services: systemctl status postfix dovecot rspamd
4. Test email functionality

Backup Scripts:
- /usr/local/bin/backup-mail-server.sh (backup)
- /usr/local/bin/restore-mail-server.sh (restore)
- /usr/local/bin/backup-remote.sh (remote backup)

Recent Backups:
"""
sudo /bin/ls -lh /backup/mail-server/ | tail -10 >> /backup/README.txt
```

**Verification:**
```bash
# Test backup
sudo /usr/local/bin/backup-mail-server.sh

# Verify backup file
sudo tar -tzf /backup/mail-server/mail-server-*.tar.gz | head -20

# Check backup size
du -sh /backup/mail-server/*

# Verify checksums
sudo tar -xzf /backup/mail-server/mail-server-*.tar.gz -C /tmp
cd /tmp/*/ && sha256sum -c checksum.txt
cd - && rm -rf /tmp/*

# Check cron job
sudo crontab -l | grep backup
```

**Expected Output:**
- Backup file created successfully
- Checksums are valid
- Backup contains all necessary files
- Cron job is scheduled
- Backup size is reasonable (few MB to few GB depending on email volume)

**Troubleshooting:**
- Check disk space: `df -h /backup`
- Check backup logs: `sudo journalctl -u backup-mail-server`
- Test database dump manually: `sudo -u postgres pg_dump mailserver_db > test.sql`
- Verify backup permissions: `ls -la /backup/mail-server/`

**Rollback:**
```bash
# Remove backup scripts
sudo rm -f /usr/local/bin/backup-*.sh
sudo rm -f /usr/local/bin/restore-*.sh

# Remove cron jobs
sudo crontab -e
# (delete backup entries)

# Remove backup directory
sudo rm -rf /backup/mail-server
```

---

## Phase 16: Documentation & Handoff

**Estimated Time:** 30-40 minutes
**Goal:** Create comprehensive documentation and handoff materials

### 16.1 Create Complete System Documentation

```bash
# Create main documentation file
sudo nano /root/mail-server-documentation.md
```

**Complete documentation:**
```markdown
# EmenTech Mail Server Documentation

## Server Information

- **Hostname:** ementech-mail.ementech.co.ke
- **IP Address:** 69.164.244.165
- **Domain:** ementech.co.ke
- **OS:** Ubuntu 24.04 LTS
- **Installation Date:** 2025-01-19

## Email Accounts

1. **ceo@ementech.co.ke** (2GB quota)
2. **info@ementech.co.ke** (1GB quota)
3. **support@ementech.co.ke** (1GB quota)
4. **admin@ementech.co.ke** (2GB quota)
5. **tech@ementech.co.ke** (1GB quota)

*Passwords are stored in /root/email-accounts.txt*

## Services

- **Postfix:** SMTP server (ports 25, 587, 465)
- **Dovecot:** IMAP/POP3 server (ports 143, 993, 110, 995)
- **Rspamd:** Spam filtering
- **Roundcube:** Webmail (https://webmail.ementech.co.ke)
- **Nginx:** Web server
- **PostgreSQL:** Database server
- **Fail2ban:** Intrusion prevention

## DNS Records

### A Records
```
mail.ementech.co.ke         A  69.164.244.165
smtp.ementech.co.ke         A  69.164.244.165
imap.ementech.co.ke         A  69.164.244.165
webmail.ementech.co.ke      A  69.164.244.165
```

### MX Record
```
ementech.co.ke              MX 10 mail.ementech.co.ke
```

### TXT Records
```
ementech.co.ke              TXT "v=spf1 mx a ip4:69.164.244.165 -all"
_dmarc.ementech.co.ke       TXT "v=DMARC1; p=quarantine; rua=mailto:admin@ementech.co.ke; ..."
default._domainkey          TXT "v=DKIM1; k=rsa; p=..."
```

## Configuration Files

### Postfix
- Main config: `/etc/postfix/main.cf`
- Master config: `/etc/postfix/master.cf`
- SQL maps: `/etc/postfix/pgsql/*.cf`

### Dovecot
- Main config: `/etc/dovecot/dovecot.conf`
- SQL config: `/etc/dovecot/dovecot-sql.conf.ext`
- Auth config: `/etc/dovecot/conf.d/auth-sql.conf.ext`

### Rspamd
- Main config: `/etc/rspamd/rspamd.conf`
- Local overrides: `/etc/rspamd/local.d/`
- DKIM keys: `/var/lib/rspamd/dkim/`

### Other
- Nginx: `/etc/nginx/sites-available/`
- Roundcube: `/etc/roundcube/config.inc.php`
- Fail2ban: `/etc/fail2ban/jail.local`

## Database Access

```bash
# Connect to mail database
sudo -u postgres psql mailserver_db

# Connect to Roundcube database
sudo -u postgres psql roundcubemail

# Database user: mailserver
# Database password: [check /root/email-accounts.txt]
```

## Service Management

### Start/Stop Services
```bash
# Postfix
sudo systemctl start|stop|restart|reload postfix

# Dovecot
sudo systemctl start|stop|restart|reload dovecot

# Rspamd
sudo systemctl start|stop|restart rspamd

# All mail services
sudo systemctl restart postfix dovecot rspamd nginx
```

### Check Service Status
```bash
sudo systemctl status postfix dovecot rspamd nginx fail2ban
```

## Maintenance Tasks

### Daily
- Check mail queue: `mailq` or `sudo postqueue -p`
- Check logs: `sudo tail -100 /var/log/mail.log`
- Check disk space: `df -h /var/mail`
- Check service status: `/root/mail-server-status.sh`

### Weekly
- Review spam filtering: Check Rspamd web UI (https://mail.ementech.co.ke:11334)
- Check Fail2ban bans: `sudo fail2ban-client status`
- Review email deliverability: Use mail-tester.com
- Clean spam folders: Manually via webmail

### Monthly
- Review backup logs: `ls -lh /backup/mail-server/`
- Test restore procedure: Test on non-production system
- Review security logs: `sudo tail -1000 /var/log/auth.log`
- Check SSL certificate expiry: `sudo certbot certificates`
- Update system: `sudo apt-get update && sudo apt-get upgrade`

## Troubleshooting

### Mail Queue Issues
```bash
# Check queue
sudo postqueue -p

# Flush queue
sudo postqueue -f

# Remove specific email
sudo postsuper -d QUEUE_ID

# Remove all emails
sudo postsuper -d ALL
```

### Authentication Failures
```bash
# Check Dovecot auth logs
sudo tail -f /var/log/dovecot.log | grep auth

# Test authentication
doveadm auth test user@ementech.co.ke password
```

### Spam Issues
```bash
# Check Rspamd status
sudo rspamc stat

# Check spam score
echo "test" | mail -s "test" user@ementech.co.ke
sudo tail -f /var/log/mail.log | grep spam
```

### High Disk Usage
```bash
# Check largest mailboxes
sudo du -sh /var/mail/vhosts/* | sort -hr

# Check log size
sudo du -sh /var/log/* | sort -hr

# Clean old logs
sudo journalctl --vacuum-time=30d
```

## Security

### Firewall Rules
```bash
# View rules
sudo ufw status numbered

# Add rule
sudo ufw allow PORT/tcp

# Remove rule
sudo ufw delete NUM
```

### Fail2ban
```bash
# Check banned IPs
sudo fail2ban-client status postfix-sasl

# Unban IP
sudo fail2ban-client set postfix-sasl unbanip IP_ADDRESS
```

### SSL Certificates
```bash
# Check expiry
sudo certbot certificates

# Renew manually
sudo certbot renew

# Force renewal
sudo certbot renew --force-renewal
```

## Backups

### Location
- Local: `/backup/mail-server/`
- Retention: 30 days

### Manual Backup
```bash
sudo /usr/local/bin/backup-mail-server.sh
```

### Manual Restore
```bash
sudo /usr/local/bin/restore-mail-server.sh /backup/mail-server/mail-server-YYYYMMDD_HHMMSS.tar.gz
```

## Monitoring

### Check Dashboard
```bash
/root/mail-server-status.sh
```

### View Logs
```bash
# Mail logs
sudo tail -f /var/log/mail.log

# Dovecot logs
sudo tail -f /var/log/dovecot.log

# Rspamd logs
sudo tail -f /var/log/rspamd/rspamd.log

# System logs
sudo journalctl -f
```

## Contact Information

- **System Admin:** admin@ementech.co.ke
- **Documentation:** /root/mail-server-documentation.md
- **Account Details:** /root/email-accounts.txt

## Emergency Procedures

### Server is being used as spam relay
1. Stop Postfix: `sudo systemctl stop postfix`
2. Check open relay: http://www.mail-abuse.com/analyzer.html
3. Review logs: `sudo tail -1000 /var/log/mail.log`
4. Fix configuration in `/etc/postfix/main.cf`
5. Restart Postfix: `sudo systemctl start postfix`

### Disk space is full
1. Check usage: `df -h`
2. Clean mail queue: `sudo postsuper -d ALL`
3. Clean logs: `sudo journalctl --vacuum-time=7d`
4. Delete spam: Via webmail
5. Add more disk space if needed

### SSL certificate expired
1. Renew: `sudo certbot renew --force-renewal`
2. Reload services: `sudo systemctl reload postfix dovecot nginx`
3. Verify: `openssl s_client -connect mail.ementech.co.ke:443`

### Database corruption
1. Stop services: `sudo systemctl stop postfix dovecot`
2. Check database: `sudo -u postgres psql mailserver_db`
3. If corrupted, restore from backup
4. Restart services: `sudo systemctl start postfix dovecot`

## Useful Commands

### Test Email Sending
```bash
echo "Test email" | mail -s "Test" user@ementech.co.ke
```

### Check Mail Queue Size
```bash
mailq | tail -1
```

### View Active IMAP Connections
```bash
sudo doveadm whois
```

### Check SPF/DKIM/DMARC
```bash
dig +short TXT ementech.co.ke
dig +short TXT _dmarc.ementech.co.ke
dig +short TXT default._domainkey.ementech.co.ke
```

### Test SMTP
```bash
swaks --to user@ementech.co.ke --from test@example.com --server localhost
```

### Test IMAP
```bash
openssl s_client -connect mail.ementech.co.ke:993 -crlf
```

## External Resources

- Postfix docs: http://www.postfix.org/documentation.html
- Dovecot docs: https://wiki.dovecot.org/
- Rspamd docs: https://rspamd.com/doc/
- Roundcube docs: https://roundcube.net/about/documentation/

## Last Updated

2025-01-19
```

### 16.2 Create Quick Reference Guide

```bash
# Create quick reference
sudo nano /root/mail-server-quickref.txt
```

**Complete quick reference:**
```
EmenTech Mail Server - Quick Reference
=======================================

EMERGENCY COMMANDS
------------------
Stop all mail services:  systemctl stop postfix dovecot rspamd
Start all mail services:  systemctl start postfix dovecot rspamd
Restart all:              systemctl restart postfix dovecot rspamd nginx

Check mail queue:         mailq
Flush mail queue:         sudo postqueue -f
Check status:             /root/mail-server-status.sh

COMMON TASKS
------------
Add email account:    See Phase 11 in implementation guide
Change password:      Update database with new SHA512 hash
Check logs:           sudo tail -f /var/log/mail.log
Unban IP:             sudo fail2ban-client set dovecot unbanip IP

BACKUP
------
Manual backup:    sudo /usr/local/bin/backup-mail-server.sh
Manual restore:   sudo /usr/local/bin/restore-mail-server.sh <backup-file>
Backup location:  /backup/mail-server/

ACCOUNT DETAILS
---------------
Stored in: /root/email-accounts.txt
Contains: Passwords, database credentials, SSL info

CONFIGURATION FILES
-------------------
Postfix:   /etc/postfix/main.cf
Dovecot:   /etc/dovecot/dovecot.conf
Rspamd:    /etc/rspamd/
Nginx:     /etc/nginx/

SERVICE PORTS
-------------
SMTP:      25, 587, 465
IMAP:      143, 993
POP3:      110, 995
Webmail:   443

DNS RECORDS
-----------
MX:  mail.ementech.co.ke
SPF: v=spf1 mx a ip4:69.164.244.165 -all
DMARC: v=DMARC1; p=quarantine; ...

TROUBLESHOOTING
--------------
Auth failed:    Check Dovecot logs
Email stuck:    Check Postfix queue
Spam issues:    Check Rspamd status
Full disk:      Clean logs and queue

CONTACT
--------
Admin: admin@ementech.co.ke
Full docs: /root/mail-server-documentation.md
```

### 16.3 Create Maintenance Schedule

```bash
# Create maintenance schedule
sudo nano /root/maintenance-schedule.md
```

**Complete schedule:**
```markdown
# Mail Server Maintenance Schedule

## Daily Tasks (automated)
- [x] Backup at 2 AM
- [x] Check mail queue every 15 minutes
- [x] Check disk space every hour
- [x] Check services every 5 minutes
- [x] Log rotation

## Weekly Tasks (every Sunday)
- [ ] Review mail queue (should be empty)
- [ ] Check spam filter effectiveness
- [ ] Review Fail2ban bans
- [ ] Test email deliverability
- [ ] Review system logs for errors

## Monthly Tasks (1st of month)
- [ ] Test backup restore procedure
- [ ] Review and update documentation
- [ ] Check SSL certificate expiry
- [ ] Review and clean spam folders
- [ ] Review security logs
- [ ] Monitor disk space trends

## Quarterly Tasks
- [ ] Full security audit
- [ ] Review and update spam filter rules
- [ ] Performance optimization review
- [ ] Review email account usage
- [ ] Update system packages

## Annual Tasks
- [ ] Full disaster recovery test
- [ ] Review and update security policies
- [ ] Evaluate new software versions
- [ ] Review backup retention policy
- [ ] Capacity planning

## Emergency Contacts
- System Administrator: admin@ementech.co.ke
- VPS Provider: [Your provider]
- Domain Registrar: [Your registrar]

## Escalation Procedures
1. Email down for > 5 minutes: Check service status
2. Email down for > 30 minutes: Restart all services
3. Email down for > 2 hours: Restore from backup
4. Complete system failure: Contact VPS provider
```

### 16.4 Create Handoff Checklist

```bash
# Create handoff checklist
sudo nano /root/handoff-checklist.md
```

**Complete checklist:**
```markdown
# Mail Server Handoff Checklist

## Pre-Handoff Verification

### DNS Configuration
- [ ] All A records propagate (mail, smtp, imap, webmail)
- [ ] MX record is correct
- [ ] SPF record passes
- [ ] DKIM record is added and verified
- [ ] DMARC record is added
- [ ] PTR record is configured

### Email Accounts
- [ ] All 5 accounts created
- [ ] All passwords are secure and documented
- [ ] All accounts can send email
- [ ] All accounts can receive email
- [ ] All accounts can login to webmail
- [ ] Aliases are working (postmaster, abuse, etc.)

### Services
- [ ] Postfix is running and accepting connections
- [ ] Dovecot is running and serving mail
- [ ] Rspamd is filtering spam
- [ ] Nginx is serving webmail
- [ ] PostgreSQL is storing data
- [ ] Fail2ban is protecting services

### Security
- [ ] SSL/TLS certificates are installed
- [ ] Firewall rules are configured
- [ ] Fail2ban jails are active
- [ ] Password authentication is disabled for SSH
- [ ] Only strong ciphers are enabled
- [ ] Postfix is not an open relay

### Testing
- [ ] Send test email internally
- [ ] Send test email externally (Gmail, Outlook)
- [ ] Receive test email from external source
- [ ] Check SPF/DKIM/DMARC pass
- [ ] Test spam filtering
- [ ] Test webmail functionality
- [ ] Test email client configuration (Thunderbird, etc.)

### Backups
- [ ] Backup script is configured
- [ ] Automated backups are scheduled
- [ ] Backup has been tested
- [ ] Restore procedure has been tested
- [ ] Backup location is documented
- [ ] Backup retention policy is set

### Monitoring
- [ ] Monitoring scripts are configured
- [ ] Automated checks are scheduled
- [ ] Dashboard is working
- [ ] Alert emails are configured
- [ ] Logwatch is configured

### Documentation
- [ ] System documentation is complete
- [ ] Quick reference guide is created
- [ ] Maintenance schedule is defined
- [ ] Emergency procedures are documented
- [ ] Account details are secured
- [ ] Configuration files are documented

## Handoff Materials

### Files Provided
1. `/root/mail-server-documentation.md` - Complete documentation
2. `/root/mail-server-quickref.txt` - Quick reference guide
3. `/root/maintenance-schedule.md` - Maintenance procedures
4. `/root/handoff-checklist.md` - This checklist
5. `/root/email-accounts.txt` - Account passwords (secure)
6. `.agent-workspace/artifacts/email-server-implementation-guide.md` - Implementation guide

### Credentials Provided
1. Email account passwords (in /root/email-accounts.txt)
2. Database credentials (in /root/email-accounts.txt)
3. SSH access details
4. VPS control panel access
5. Domain registrar access

### Access Information
1. SSH: `ssh munene@69.164.244.165`
2. Webmail: `https://webmail.ementech.co.ke`
3. Rspamd UI: `https://mail.ementech.co.ke:11334`
4. Postfix Admin: None (using database directly)

## Post-Handoff Support

### First Week
- Daily check-ins
- Monitor email deliverability
- Adjust spam filter settings
- Fix any issues that arise

### First Month
- Weekly check-ins
- Review system performance
- Update documentation as needed
- Provide additional training if needed

### Ongoing
- Monthly maintenance
- Emergency support as needed
- Documentation updates
- Security updates

## Training Provided

### System Administrator Training
- [ ] Service management (start/stop/restart)
- [ ] Log analysis and troubleshooting
- [ ] Email account management
- [ ] Backup and restore procedures
- [ ] Security monitoring
- [ ] Performance tuning

### User Training
- [ ] Webmail usage
- [ ] Email client configuration (Thunderbird, Outlook)
- [ ] Spam management
- [ ] Folder management
- [ ] Password security

## Known Issues and Limitations

### Current Issues
- None (as of 2025-01-19)

### Limitations
- 2GB RAM limits concurrent connections
- Single server (no HA/failover)
- Backup storage is on same server (should be off-site)

### Future Improvements
- Add off-site backup (S3, rsync)
- Implement high availability (second server)
- Add web-based admin panel (Postfixadmin)
- Implement email archiving
- Add virus scanning (ClamAV integration)

## Sign-off

### Handoff Completed By
Name: [Your Name]
Date: 2025-01-19
Signature: ________________

### Received By
Name: ________________
Date: ________________
Signature: ________________

### Approved By
Name: ________________
Date: ________________
Signature: ________________
```

### 16.5 Final Verification

```bash
# Run final status check
/root/mail-server-status.sh

# Verify all documentation exists
ls -lh /root/*.md /root/*.txt

# Test all services
sudo systemctl status postfix dovecot rspamd nginx fail2ban

# Send test email
echo "Final verification test - mail server is operational" | mail -s "Mail Server Handoff Complete" admin@ementech.co.ke

# Check logs
sudo tail -50 /var/log/mail.log
```

**Verification Checklist:**
- [ ] All services running
- [ ] All documentation created
- [ ] All accounts working
- [ ] Backups configured
- [ ] Monitoring active
- [ ] Security hardening complete
- [ ] Handoff materials ready
- [ ] Test email sent successfully

**Final Output:**
```
==========================================
EmenTech Mail Server Status
==========================================
Date: [Current date/time]

--- System Status ---
Uptime: [Uptime information]
Memory: [Memory usage]
Disk: [Disk usage]

--- Service Status ---
postfix: Running
dovecot: Running
rspamd: Running
nginx: Running
fail2ban: Running

--- Mail Queue ---
Mail queue is empty

--- Recent Errors ---
[No errors should be shown]

--- Recent Failed Logins ---
[No failed logins should be shown]

==========================================
```

**Troubleshooting:**
- If any service is not running, restart it
- If errors are shown in logs, investigate and fix
- If test email fails, check configuration
- If documentation is missing, create it

**No rollback needed - this is documentation phase**

---

## Congratulations!

Your EmenTech email server is now fully operational and production-ready!

### What's Next?

1. **Test thoroughly** - Send/receive emails with external accounts
2. **Monitor closely** - Check logs and service status daily for first week
3. **Update DNS** - Add all DNS records at your registrar
4. **Warm up IP** - Start with low volume, gradually increase
5. **Monitor reputation** - Use tools like mail-tester.com

### Support and Resources

- **Documentation:** `/root/mail-server-documentation.md`
- **Quick Reference:** `/root/mail-server-quickref.txt`
- **Implementation Guide:** `.agent-workspace/artifacts/email-server-implementation-guide.md`
- **Logs:** `/var/log/mail.log`, `/var/log/dovecot.log`

### Emergency Contact

For immediate issues, check:
- Emergency procedures in documentation
- Troubleshooting section in this guide
- Service status: `/root/mail-server-status.sh`

---

**Implementation Guide Version:** 1.0
**Last Updated:** 2025-01-19
**Status:** Complete and Ready for Execution
