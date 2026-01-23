# EmenTech Email Server Architecture

**Version**: 1.0
**Date**: 2026-01-19
**Architect**: System Architecture Agent
**Status**: Design Complete

## Executive Summary

This document outlines a production-ready email server architecture for EmenTech Technologies (ementech.co.k) deployed on a single VPS with 2GB RAM. The architecture prioritizes security, resource efficiency, and seamless integration with existing services while providing professional email capabilities for 5+ users.

---

## 1. System Architecture Overview

### 1.1 Architecture Pattern

**Pattern**: Modular Monolith with Virtual User Management
**Justification**: Single VPS constraint requires co-located services with clear separation of concerns. Virtual users allow easy scaling without system user overhead.

### 1.2 Component Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     EXTERNAL INTERNET                           │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               │ Ports: 25, 587, 465, 143, 993, 110, 995
                               │
┌──────────────────────────────▼──────────────────────────────────┐
│                    FIREWALL (ufw)                                │
│                    + Fail2ban                                   │
└──────────────────────────────┬──────────────────────────────────┘
                               │
    ┌──────────────────────────┼──────────────────────────┐
    │                          │                          │
    │                          │                          │
┌───▼─────┐          ┌────────▼─────────┐        ┌───────▼──────┐
│   SMTP  │          │  IMAPS/POP3S     │        │   HTTP/HTTPS  │
│  :25    │          │   :993/:995      │        │    :80/:443   │
└───┬─────┘          └────────┬─────────┘        └───────┬──────┘
    │                          │                          │
┌───▼──────────────────────────▼──────────────────────────▼──────┐
│                    POSTFIX (MTA)                               │
│  - SMTP inbound/outbound                                        │
│  - TLS encryption                                               │
│  - SASL authentication                                          │
│  - Virtual user support                                         │
└───┬────────────────────────────────────────────────────────────┘
    │
    │ (local delivery)
    │
┌───▼────────────────────────────────────────────────────────────┐
│                    DOVECOT (MDA/LDA)                           │
│  - IMAP/POP3 server                                             │
│  - SASL authentication provider                                 │
│  - Maildir storage                                              │
│  - Quota management                                             │
│  - Sieve filtering                                              │
└───┬────────────────────────────────────────────────────────────┘
    │
    │ (authentication)
    │
┌───▼────────────────────────────────────────────────────────────┐
│              VIRTUAL USER DATABASE (SQLite)                     │
│  - User accounts                                                │
│  - Aliases/forwarding                                           │
│  - Domains                                                      │
└───┬────────────────────────────────────────────────────────────┘
    │
    │ (storage)
    │
┌───▼────────────────────────────────────────────────────────────┐
│               MAILDIR STORAGE                                   │
│  /var/vmail/ementech.co.ke/username/                           │
│  - cur/, new/, tmp/                                             │
│  - Per-user quotas                                              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    SECURITY LAYER                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   SpamAssassin│  │   Rspamd     │  │   ClamAV     │         │
│  │   (optional)  │  │   (recommended)│  │   (optional) │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    WEBMAIL ACCESS                               │
│                    Roundcube via nginx                          │
│              webmail.ementech.co.ke                             │
└─────────────────────────────────────────────────────────────────┘
```

### 1.3 Software Stack Recommendation

#### Core Components

**MTA: Postfix 3.7+**
- **Why Postfix over Exim**:
  - More secure by default (modular architecture, doesn't run as root)
  - Better documentation and community support
  - Easier virtual user configuration
  - Better performance with low memory
  - Native integration with Dovecot SASL
  - Widespread adoption means better troubleshooting resources

**MDA: Dovecot 2.3+**
- **Why Dovecot over Courier**:
  - Superior IMAP/POP3 implementation
  - Better performance and lower memory footprint
  - Excellent Sieve support for server-side filtering
  - Built-in SASL authentication (can serve Postfix)
  - Superior mailbox format support (Maildir++)
  - Active development and security track record

**Database: SQLite 3**
- **Why SQLite over MySQL/PostgreSQL**:
  - Zero memory overhead (separate daemon not needed)
  - Sufficient for 5-100 email accounts
  - Simple backup (single file)
  - Fast for read-heavy workloads
  - Easy migration path to MySQL/PostgreSQL if needed
  - Atomic transactions prevent data corruption

**Webmail: Roundcube 1.6+**
- **Why Roundcube over Rainloop**:
  - More mature and feature-rich
  - Better mobile responsiveness
  - Larger plugin ecosystem
  - Active security maintenance
  - Better integration with Dovecot managesieve
  - Professional appearance matching corporate branding

#### Security Components

**Spam Filtering: Rspamd 3.x**
- **Why Rspamd over SpamAssassin**:
  - 10x lower memory footprint (~50MB vs ~500MB)
  - Faster scanning (C vs Perl)
  - Better modern spam detection (machine learning)
  - Built-in DKIM/DMARC/SPF validation
  - Redis caching for performance
  - Integrated web UI for management

**Anti-Virus: ClamAV (Optional)**
- **Trade-off**: Uses ~200-400MB RAM
- **Recommendation**: Skip for 2GB VPS, rely on Rspamd's malware detection
- **Alternative**: Use ClamAV only for on-demand scans during low-traffic periods

**Firewall: Uncomplicated Firewall (ufw)**
- Simple, effective, Ubuntu-native
- Easy to script and automate

**Brute-force Protection: Fail2ban**
- Protects SMTP, IMAP, POP3, SSH
- Integrates with ufw
- Low memory footprint

**TLS/SSL: Let's Encrypt (certbot)**
- Free, automated certificates
- Wildcard certificate for *.ementech.co.ke
- Auto-renewal

---

## 2. Security Architecture

### 2.1 Network Security Zones

```
┌──────────────────────────────────────────────────────────────┐
│                    UNTRUSTED ZONE                             │
│                    (Internet)                                 │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     │ Filtered by firewall rules
                     │
┌────────────────────▼─────────────────────────────────────────┐
│                    DMZ ZONE                                   │
│                    Public Services:                           │
│                    - SMTP (25, 587, 465)                      │
│                    - HTTP/HTTPS (80, 443)                     │
│                    Protected by:                              │
│                    - ufw rate limiting                        │
│                    - fail2ban                                 │
│                    - TLS enforcement                          │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     │ Authenticated access only
                     │
┌────────────────────▼─────────────────────────────────────────┐
│                    TRUSTED ZONE                               │
│                    Internal Services:                         │
│                    - IMAPS (993), POP3S (995)                 │
│                    - Mail storage                             │
│                    - Database                                 │
│                    Protected by:                              │
│                    - Strong authentication                    │
│                    - chroot jails                             │
│                    - File permissions                         │
└──────────────────────────────────────────────────────────────┘
```

### 2.2 Firewall Rules (ufw)

**Default Policy**:
```bash
ufw default deny incoming
ufw default allow outgoing
```

**Allowed Services**:
```bash
# SSH (rate limited)
ufw limit 22/tcp

# Web server (existing)
ufw allow 80/tcp
ufw allow 443/tcp

# Email services
# SMTP (inbound/outbound)
ufw allow 25/tcp    # SMTP server-to-server
ufw allow 587/tcp   # SMTP submission (TLS)
ufw allow 465/tcp   # SMTPS (legacy, optional)

# IMAP/POP3 (encrypted only)
ufw allow 993/tcp   # IMAPS
ufw allow 995/tcp   # POP3S

# Note: 143 (IMAP) and 110 (POP3) NOT allowed - enforce TLS
```

**Rate Limiting Rules**:
```bash
# SMTP rate limiting to prevent abuse
ufw route allow proto tcp from any to any port 25 limit 10/minute
```

### 2.3 Transport Security

**TLS Configuration Strategy**:

1. **Certificate**: Let's Encrypt wildcard cert
   - `*.ementech.co.ke`
   - Covers: mail.ementech.co.ke, webmail.ementech.co.ke
   - Auto-renewal via certbot

2. **Postfix TLS**:
   - Opportunistic TLS for inbound (accept if offered)
   - Mandatory TLS for outbound (enforce when possible)
   - Mandatory TLS for authentication (ports 587, 465)
   - Strong ciphers only: TLSv1.2+, TLSv1.3

3. **Dovecot TLS**:
   - Mandatory TLS for IMAP/POP3 (no plain text)
   - Strong ciphers: TLSv1.2+, TLSv1.3
   - Perfect Forward Secrecy (PFS)

4. **Configuration Parameters**:
   ```bash
   # Postfix main.cf
   smtpd_tls_security_level = may
   smtpd_tls_protocols = !SSLv2, !SSLv3, !TLSv1, !TLSv1.1
   smtpd_tls_mandatory_protocols = !SSLv2, !SSLv3, !TLSv1, !TLSv1.1
   smtpd_tls_cipherlist = ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256...
   smtpd_tls_exclude_cipher = aNULL, eNULL, EXPORT, DES, RC4, MD5
   tls_preempt_cipherlist = yes

   # Dovecot conf.d/10-ssl.conf
   ssl = required
   ssl_min_protocol = TLSv1.2
   ssl_cipher_list = ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256...
   ssl_prefer_server_ciphers = no
   ```

### 2.4 Authentication Security

**SASL Mechanism**:
- **Primary**: Dovecot SASL with CRAM-MD5 or DIGEST-MD5
- **Fallback**: PLAIN over TLS only
- **Rejected**: PLAIN without TLS, LOGIN, ANONYMOUS

**Password Policy**:
- Minimum length: 12 characters
- Complexity: Upper + lower + digit + special
- Hashing: SHA512-CRYPT with salt
- Aging: Force change every 90 days (optional)
- Lockout: 5 failed attempts = 15min lockout

**SASL Configuration**:
```dovecot
# Dovecot conf.d/10-auth.conf
auth_mechanisms = CRAM-MD5 DIGEST-MD5 PLAIN
disable_plaintext_auth = yes
```

### 2.5 Email Authentication (SPF/DKIM/DMARC)

**SPF (Sender Policy Framework)**:
```
ementech.co.ke.  IN  TXT  "v=spf1 mx a ip4:69.164.244.165 -all"
```
- Authorizes server IP 69.164.244.165
- Hard fail (-all) for unauthorized senders

**DKIM (DomainKeys Identified Mail)**:
- Selector: `ementech1`
- Key size: RSA 2048-bit
- Signing domain: ementech.co.ke
- Configuration:
  ```
  ementech1._domainkey.ementech.co.ke.  IN  TXT  "v=DKIM1; k=rsa; p=<public-key>"
  ```

**DMARC (Domain-based Message Authentication)**:
```
_dmarc.ementech.co.ke.  IN  TXT  "v=DMARC1; p=reject; rua=mailto:dmarc@ementech.co.ke; ruf=mailto:dmarc@ementech.co.ke; aspf=s; adkim=s; pct=100; ri=86400"
```
- Policy: Reject (p=reject)
- Reports sent to dmarc@ementech.co.ke
- Strict alignment (aspf=s, adkim=s)
- 100% enforcement

### 2.6 Isolation Strategy

**User Isolation**:
- Virtual users (no system accounts)
- chroot for Postfix SMTP
- Separate mail storage: `/var/vmail`
- File permissions: 0700 on maildirs, owned by vmail:vmail (uid:gid 5000:5000)

**Process Isolation**:
- Postfix: Runs in chroot `/var/spool/postfix`
- Dovecot: Runs as vmail user, not root
- Databases: Read-only access for authentication

**File Permissions**:
```
/var/vmail/          0700  vmail:vmail
/var/vmail/ementech.co.ke/    0700  vmail:vmail
/var/vmail/ementech.co.ke/user/   0700  vmail:vmail
```

---

## 3. Resource Management (2GB RAM Constraint)

### 3.1 Memory Allocation Budget

**Total Available**: 2GB (2048MB)
**Existing Usage**: ~700MB (nginx, Node.js, MongoDB)
**Available for Mail**: ~1.3GB (1300MB)

**Allocation Strategy**:

| Component       | Base RAM | Peak RAM | Priority | Notes |
|-----------------|----------|----------|----------|-------|
| **Postfix**     | 30MB     | 100MB    | Critical | MTA, core service |
| **Dovecot**     | 50MB     | 200MB    | Critical | MDA/IMAP/POP3 |
| **Rspamd**      | 50MB     | 150MB    | High     | Spam filtering |
| **Redis**       | 20MB     | 50MB     | High     | Rspamd cache |
| **Roundcube**   | 30MB     | 80MB     | Medium   | Webmail PHP |
| **nginx**       | 0MB      | 20MB     | Low      | Shared, existing |
| **ClamAV**      | -        | 300MB    | Optional | Skip initially |
| **SpamAssassin**| -        | 500MB    | Optional | Skip initially |
| **OS + Buffer** | 200MB    | 400MB    | Critical | System overhead |
| **Total**       | ~380MB   | ~1000MB  | -        | Within budget |

**Memory Optimization**:
1. Use Rspamd instead of SpamAssassin (saves ~450MB)
2. Skip ClamAV initially (saves ~300MB)
3. Enable swap (2GB) for burst scenarios
4. Process limits in Postfix/Dovecot
5. Queue management limits

### 3.2 Process Limits

**Postfix (/etc/postfix/main.cf)**:
```bash
# Limit concurrent processes
default_process_limit = 100
smtpd_client_connection_count_limit = 10
smtpd_client_connection_rate_limit = 30
smtpd_client_message_rate_limit = 50

# Queue limits
message_size_limit = 25600000  # 25MB max email
mailbox_size_limit = 1000000000  # 1GB per mailbox
queue_minfree = 200000000  # 200MB free space required
```

**Dovecot (/etc/dovecot/conf.d/10-master.conf)**:
```bash
# Limit concurrent connections
service imap-login {
  service_count = 0  # Create new process per connection
  process_min_avail = 2
  vsz_limit = 256M  # Max memory per process
}

service pop3-login {
  service_count = 0
  process_min_avail = 1
  vsz_limit = 256M
}

default_process_limit = 100
default_vsz_limit = 512M
```

**Rspamd (/etc/rspamd/rspamd.conf)**:
```bash
worker {
    count = 1;
    max_requests = 1000;
    relay = false;
    timeout = 120s;
}
```

### 3.3 Queue Management

**Postfix Queue Strategy**:
- Location: `/var/spool/postfix`
- Max queue size: 5GB (disk permitting)
- Queue lifetime: 5 days
- Deferred retry: exponential backoff

**Queue Monitoring**:
```bash
# Check queue size
mailq | tail -n 1
# Expected: empty or <10 messages during normal operation

# Emergency: flush queue
postqueue -f
```

**Resource Protection**:
```bash
# Postfix main.cf
queue_run_delay = 300s       # Check queue every 5 min
minimal_backoff_time = 300s  # Initial retry after 5 min
maximal_backoff_time = 4000s # Max retry interval ~1 hour
maximal_queue_lifetime = 5d  # 5 days then bounce
bounce_queue_lifetime = 5d   # 5 days for bounces
```

### 3.4 Backup Strategy

**What to Backup**:
1. **Mail storage**: `/var/vmail` (critical)
2. **Database**: `/etc/postfix/virtual_mailboxes.db` (SQLite)
3. **Configuration**: `/etc/postfix`, `/etc/dovecot`
4. **SSL certificates**: `/etc/letsencrypt`
5. **DKIM keys**: `/etc/postfix/dkim`

**Backup Schedule**:

| Backup Type | Frequency | Retention | Location | Method |
|-------------|-----------|-----------|----------|--------|
| **Mail storage** | Daily | 30 days | Remote | rsync + incremental |
| **Database** | Daily | 90 days | Remote | SQLite dump |
| **Configuration** | On change | 365 days | Remote | git + rsync |
| **SSL certs** | On change | 90 days | Remote | tar + gzip |

**Backup Script** (daily cron at 2 AM):
```bash
#!/bin/bash
# /usr/local/bin/backup-mail.sh

DATE=$(date +%Y%m%d)
BACKUP_DIR="/backup/mail"
REMOTE="user@backup-server:/backup/ementech/mail"

# Mail storage (incremental)
rsync -av --delete /var/vmail/ $BACKUP_DIR/vmail-$DATE/

# Database
cp /etc/postfix/virtual_mailboxes.db $BACKUP_DIR/virtual_mailboxes-$DATE.db

# Configuration
tar -czf $BACKUP_DIR/config-$DATE.tar.gz /etc/postfix /etc/dovecot

# Transfer to remote
rsync -av --delete $BACKUP_DIR/ $REMOTE

# Cleanup old backups
find $BACKUP_DIR -type d -mtime +30 -exec rm -rf {} \;
```

**Storage Location**:
- Local: `/backup/mail` (on same VPS, temporary)
- Remote: Off-site server or cloud storage (recommended)
- Alternative: Rclone to cloud (Wasabi, Backblaze B2)

---

## 4. Integration Points

### 4.1 nginx Integration

**Webmail Virtual Host**:
```nginx
# /etc/nginx/sites-available/webmail.ementech.co.ke

server {
    listen 80;
    listen [::]:80;
    server_name webmail.ementech.co.ke;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name webmail.ementech.co.ke;

    # SSL certificate (existing wildcard)
    ssl_certificate /etc/letsencrypt/live/ementech.co.ke/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ementech.co.ke/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Roundcube webmail
    root /var/www/roundcube;
    index index.php index.html;

    # PHP-FPM
    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/run/php/php8.3-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logging
    access_log /var/log/nginx/webmail.ementech.co.ke-access.log;
    error_log /var/log/nginx/webmail.ementech.co.ke-error.log;
}
```

**Mail Server Autoconfig** (optional):
```nginx
# /etc/nginx/sites-available/autoconfig.ementech.co.ke

server {
    listen 443 ssl http2;
    server_name autoconfig.ementech.co.ke;

    # Serve mail autoconfig for Thunderbird, Outlook, etc.
    location /mail/config-v1.1.xml {
        default_type application/xml;
        alias /var/www/autoconfig/config-v1.1.xml;
    }
}
```

### 4.2 SSL Certificate Management

**Existing Certificate**: Wildcard for `*.ementech.co.ke`
**Coverage**:
- ementech.co.ke (existing)
- app.ementech.co.ke (existing)
- webmail.ementech.co.ke (new)
- mail.ementech.co.ke (new, optional)
- autoconfig.ementech.co.ke (new, optional)

**Certificate Renewal** (automated via certbot):
```bash
# Cert already configured for auto-renewal
# Verify renewal timer
systemctl list-timers | grep certbot

# Manual renewal test
certbot renew --dry-run
```

**Postfix/Dovecot Certificate Paths**:
```bash
# Postfix main.cf
smtpd_tls_cert_file = /etc/letsencrypt/live/ementech.co.ke/fullchain.pem
smtpd_tls_key_file = /etc/letsencrypt/live/ementech.co.ke/privkey.pem

# Dovecot 10-ssl.conf
ssl_cert = </etc/letsencrypt/live/ementech.co.ke/fullchain.pem
ssl_key = </etc/letsencrypt/live/ementech.co.ke/privkey.pem
```

### 4.3 Monitoring Integration

**Log Aggregation**:
- **Existing logs**: `/var/log/nginx/`, `/var/log/pm2/`
- **Mail logs**: `/var/log/mail.log`, `/var/log/mail.err`

**Centralized logging** (rsyslog):
```bash
# /etc/rsyslog.d/mail.conf
if $programname == 'postfix' or $programname == 'dovecot' then {
    *.* /var/log/mail.log
    & stop
}
```

**Monitoring tools**:
1. **Basic**: Logwatch daily email reports
2. **Intermediate**: Munin (resource graphs)
3. **Advanced**: Prometheus + Grafana (future)

**Critical metrics**:
- Queue size (mailq)
- Disk usage (/var/vmail, /var/spool/postfix)
- Memory usage (Postfix, Dovecot, Rspamd)
- Connection counts (SMTP, IMAP)
- Spam ratio (Rspamd stats)

**Logwatch configuration**:
```bash
# Daily email to admin@ementech.co.ke
echo "admin@ementech.co.ke" > /etc/cron.daily/00logwatch
```

### 4.4 Alerting Strategy

**Alert Channels**:
1. **Email**: admin@ementech.co.ke (immediate alerts)
2. **SMS**: Future (Twilio integration)
3. **Slack**: Future (webhook)

**Alert Conditions**:
| Condition | Threshold | Action | Priority |
|-----------|-----------|--------|----------|
| Queue full | >1000 messages | Email alert | High |
| Disk full | >90% /var/vmail | Email alert | Critical |
| Service down | Postfix/Dovecot stopped | Email alert | Critical |
| High spam | >50% spam ratio | Email alert | Medium |
| Brute force | >100 fail2ban bans/day | Email alert | High |

**Alerting script** (cron every 5 min):
```bash
#!/bin/bash
# /usr/local/bin/check-mail-system.sh

# Check queue
QUEUE_SIZE=$(mailq | tail -n 1 | awk '{print $5}')
if [ "$QUEUE_SIZE" -gt 1000 ]; then
    echo "Mail queue full: $QUEUE_SIZE messages" | mail -s "Mail Alert" admin@ementech.co.ke
fi

# Check services
if ! systemctl is-active --quiet postfix; then
    echo "Postfix is down!" | mail -s "Critical: Postfix down" admin@ementech.co.ke
fi

if ! systemctl is-active --quiet dovecot; then
    echo "Dovecot is down!" | mail -s "Critical: Dovecot down" admin@ementech.co.ke
fi

# Check disk space
DISK_USAGE=$(df /var/vmail | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 90 ]; then
    echo "Mail storage at ${DISK_USAGE}% capacity" | mail -s "Critical: Disk full" admin@ementech.co.ke
fi
```

---

## 5. Scalability Roadmap

### 5.1 User Scaling Strategy

**Phase 1: Current (5 users)**
- Single VPS with virtual users
- SQLite database
- Maildir storage on local disk
- Single backup location

**Phase 2: Growth (10-25 users)**
- Add: MySQL/MariaDB for user management
- Add: Secondary disk for mail storage
- Add: Automated backup to cloud (Wasabi)
- Optimize: Tune Postfix/Dovecot for higher concurrency

**Phase 3: Expansion (25-100 users)**
- Upgrade: VPS to 4GB RAM
- Add: SpamAssassin + ClamAV (now feasible with 4GB)
- Add: Redis for caching (Rspamd, Roundcube sessions)
- Add: Monitoring dashboard (Grafana)
- Consider: Dedicated mail server

**Phase 4: Enterprise (100+ users)**
- Migrate: Dedicated mail server or VPS
- Add: Load balancer (HAProxy)
- Add: Mail storage cluster (NFS/GlusterFS)
- Add: High availability (replication)
- Add: Archiving solution (Mailarchiva)

**Migration Triggers**:
| Metric | Threshold | Action |
|--------|-----------|--------|
| RAM usage | >85% sustained | Upgrade VPS |
| Disk usage | >80% /var/vmail | Add storage/migrate |
| Queue delays | >30min delivery | Upgrade CPU |
| User count | >50 accounts | Plan dedicated server |

### 5.2 Storage Scaling

**Current Storage**: 29GB free
**Per-user average**: 500MB - 2GB
**Current capacity**: 15-58 users (depending on usage)

**Expansion Options**:

1. **Add Volumes** (same VPS):
   ```bash
   # Add additional disk partition
   # Mount as /var/vmail2
   # Use LVM for future flexibility
   ```

2. **Move to Dedicated Mail Server**:
   - Better storage options (SSD, RAID)
   - Separate resource pools
   - Better isolation

3. **Cloud Storage** (advanced):
   - S3-compatible storage (MinIO)
   - Hot/cold storage tiers
   - Geographic distribution

**Storage Optimization**:
```dovecot
# Enable compression for old emails
mail_plugins = $mail_plugins zlib

# Compress emails older than 30 days
zlib_save_level = 6
zlib_save = gz
```

### 5.3 Performance Scaling

**Bottleneck Identification**:
1. **CPU**: Spam filtering (Rspamd scales with CPU)
2. **RAM**: Concurrent IMAP connections
3. **Disk I/O**: Maildir operations
4. **Network**: Bandwidth for attachments

**Scaling Solutions**:

| Bottleneck | Solution | When to Apply |
|------------|----------|---------------|
| CPU | Upgrade VPS (2→4 cores) | >50 users |
| RAM | Upgrade VPS (2GB→4GB) | >25 users |
| Disk I/O | Add SSD, use RAID | >50 users |
| Network | Upgrade bandwidth | Large attachments |

**Caching Strategy**:
```bash
# Dovecot caching
mail_cache_min_mail_count = 10
mail_cache_fields = flags, date.sent, date.received, size, save.date

# Rspamd Redis caching
# Cache spam check results for 1 hour
```

### 5.4 Backup Scaling

**Phase 1: Current** (5 users, ~5GB mail storage)
- Daily incremental backups
- Retention: 30 days
- Location: Remote server

**Phase 2: Growth** (25 users, ~25GB)
- Daily incremental, weekly full
- Retention: 90 days
- Location: Cloud storage (Wasabi ~$5/TB)

**Phase 3: Enterprise** (100+ users, ~200GB)
- Continuous backup (rsync inotify)
- Retention: 1 year (compliance)
- Location: Multi-region cloud
- Archival: Cold storage (Glacier)

**Backup Architecture**:
```
Primary VPS
    │
    ├─→ Daily Backup (rsync)
    │       │
    │       └─→ Remote Server (hot standby)
    │
    └─→ Weekly Full (rclone)
            │
            └─→ Cloud Storage (Wasabi/B2)
                    │
                    └─→ Long-term Archive (Glacier)
```

---

## 6. High Availability (Optional)

### 6.1 MX Record Strategy

**Current Setup**:
```
ementech.co.ke.  IN  MX  10  mail.ementech.co.ke.
```

**Recommended HA Setup**:
```
ementech.co.ke.  IN  MX  10  mail.ementech.co.ke.
ementech.co.ke.  IN  MX  20  backup-mail.example.com.
```

**Secondary MX Options**:
1. **Free backup MX services**:
   - MXLayer (free tier)
   - MailCow backup MX
   - Self-hosted on another VPS

2. **Paid backup MX services**:
   - No-IP Backup MX
   - DNS Made Easy

**Trade-off**: For 5 users, single MX is acceptable. Backup MX provides redundancy but adds complexity.

### 6.2 Failover Strategy

**Scenario**: Primary VPS goes down

**Immediate Impact**:
- Incoming email: Queued at sender (retry 2-5 days)
- Outgoing email: Fail until server restored
- Webmail: Unavailable
- IMAP/POP3: Unavailable

**Recovery Time Objective (RTO)**: 4 hours
**Recovery Point Objective (RPO)**: 24 hours (daily backup)

**Failover Plan**:
1. **Quick fix**: Reboot VPS (via Linode console)
2. **Restore**: VPS snapshot restore (1 hour)
3. **Full restore**: From backup (4 hours)

**Future HA Implementation**:
- Secondary VPS (synced via rsync)
- Floating IP (failover IP)
- Monitoring with automatic failover (Pacemaker)
- Estimated cost: +$10-20/month

### 6.3 Disaster Recovery

**Backup Locations**:
1. **Primary**: Off-site server (different provider)
2. **Secondary**: Cloud storage (Wasabi)
3. **Tertiary**: Local download (monthly)

**Recovery Procedures**:

**Scenario 1: Email Data Loss**
```bash
# Restore from backup
rsync -av backup-server:/backup/ementech/mail/vmail-YYYYMMDD/ /var/vmail/

# Verify permissions
chown -R vmail:vmail /var/vmail
find /var/vmail -type d -exec chmod 0700 {} \;
```

**Scenario 2: Configuration Loss**
```bash
# Extract config backup
tar -xzf config-YYYYMMDD.tar.gz -C /

# Restart services
systemctl restart postfix dovecot
```

**Scenario 3: Complete VPS Loss**
```bash
# 1. Create new VPS
# 2. Install OS (Ubuntu 24.04)
# 3. Restore configuration (from backup or git)
# 4. Restore mail storage (from backup)
# 5. Update DNS if IP changed
# 6. Test email flow
```

---

## 7. Implementation Plan

### 7.1 Pre-Implementation Checklist

- [ ] Verify VPS resources (2GB RAM, 29GB disk free)
- [ ] DNS access for ementech.co.ke
- [ ] SSL certificate (wildcard *.ementech.co.ke)
- [ ] Backup destination configured
- [ ] Test email accounts list (5 users)
- [ ] Emergency rollback plan documented

### 7.2 Installation Order

**Phase 1: Core Components (Day 1)**
1. Install system dependencies
2. Create virtual mail user (vmail)
3. Install and configure SQLite database
4. Install and configure Postfix
5. Install and configure Dovecot
6. Test basic email flow (local delivery)

**Phase 2: Security & Integration (Day 2)**
1. Configure TLS/SSL certificates
2. Install and configure Rspamd
3. Configure firewall (ufw)
4. Install and configure fail2ban
5. Test email flow (external delivery)

**Phase 3: Webmail & Finalization (Day 3)**
1. Install PHP and PHP-FPM
2. Install and configure Roundcube
3. Configure nginx webmail virtual host
4. Configure SPF/DKIM/DMARC
5. Test end-to-end with webmail
6. Configure backups

**Phase 4: Monitoring & Optimization (Day 4)**
1. Set up logwatch
2. Configure monitoring alerts
3. Performance tuning
4. Document procedures
5. Train users

### 7.3 Testing Strategy

**Unit Testing**:
- Postfix: Send/receive local mail
- Dovecot: Authenticate with test account
- Rspamd: Spam filtering with GTUBE
- Roundcube: Login, compose, send

**Integration Testing**:
- External email: Send to Gmail, receive from Gmail
- Webmail: Full workflow (login, read, compose, attach)
- Mobile: Test with iOS/Android mail client
- Autodiscovery: Test with Thunderbird/Outlook

**Load Testing**:
- Concurrent connections: 10 IMAP clients
- Email volume: 100 messages in 10 minutes
- Large attachments: 20MB file
- Spam filter: 100 spam messages

### 7.4 Rollback Plan

**If critical failure occurs**:
1. Stop mail services: `systemctl stop postfix dovecot`
2. Restore DNS to previous state (remove MX records)
3. Restore from backup: `/var/vmail`, `/etc/postfix`, `/etc/dovecot`
4. Restart services: `systemctl start postfix dovecot`
5. Verify email flow
6. Document failure and root cause

**Rollback Triggers**:
- Service won't start
- Email delivery fails
- Webmail inaccessible
- Security breach detected
- Performance degradation >50%

---

## 8. Filesystem Layout

### 8.1 Directory Structure

```
/etc/postfix/                    # Postfix configuration
├── main.cf                      # Main configuration
├── master.cf                    # Service definitions
├── virtual_mailboxes.db         # SQLite database
├── virtual_alias_maps.db        # Aliases database
├── dkim/
│   ├── ementech.co.ke.private  # DKIM private key
│   └── ementech.co.ke.txt      # DKIM DNS record
└── ssl/                         # Certificate symlinks

/etc/dovecot/                    # Dovecot configuration
├── dovecot.conf                 # Main configuration
├── conf.d/
│   ├── 10-auth.conf            # Authentication
│   ├── 10-mail.conf            # Mailbox settings
│   ├── 10-master.conf          # Process limits
│   └── 10-ssl.conf             # TLS settings
└── private/

/var/vmail/                      # Mail storage (0700 vmail:vmail)
└── ementech.co.ke/
    ├── ceo/
    │   ├── cur/                # Current emails
    │   ├── new/                # New emails
    │   └── tmp/                # Temporary storage
    ├── info/
    ├── support/
    ├── admin/
    └── tech/

/var/spool/postfix/              # Postfix queue
├── incoming/                    # Incoming mail queue
├── active/                      # Active queue
├── deferred/                    # Deferred queue
├── hold/                        # Held messages
└── corrupt/                     # Corrupted messages

/var/log/                        # Log files
├── mail.log                     # Main mail log
├── mail.err                     # Error log
├── mail.warn                    # Warning log
└── fail2ban.log                 # Fail2ban log

/var/www/                        # Web root
└── roundcube/                   # Roundcube webmail
    ├── public_html/
    ├── vendor/
    └── config/

/backup/mail/                    # Local backup staging
├── vmail-YYYYMMDD/
├── virtual_mailboxes-YYYYMMDD.db
└── config-YYYYMMDD.tar.gz

/run/                           # Runtime sockets
├── postfix/
│   └── public/
│       ├── pickup
│       └── flush
└── dovecot/
    ├── auth-userdb
    ├── master
    └── anvil
```

### 8.2 File Permissions

**Critical Security Permissions**:
```bash
# Mail storage
/var/vmail                          0700  vmail:vmail
/var/vmail/ementech.co.ke/          0700  vmail:vmail
/var/vmail/ementech.co.ke/*/        0700  vmail:vmail

# Configuration (root:root, 0644)
/etc/postfix/*                      0644  root:root
/etc/dovecot/*                      0644  root:root

# Database (root:root, 0640)
/etc/postfix/virtual_mailboxes.db   0640  root:postfix

# DKIM keys (root:root, 0600)
/etc/postfix/dkim/*.private         0600  root:root

# Logs (root:adm, 0640)
/var/log/mail*                      0640  root:adm
```

---

## 9. Network Port Allocation

### 9.1 Port Summary

| Port | Protocol | Service | Direction | Purpose | Security |
|------|----------|---------|-----------|---------|----------|
| **25** | TCP | SMTP | Inbound/Outbound | Server-to-server mail | Firewall + fail2ban |
| **587** | TCP | SMTP | Inbound/Outbound | Mail submission (TLS) | TLS required |
| **465** | TCP | SMTPS | Inbound/Outbound | Legacy SMTP (TLS) | TLS required |
| **143** | TCP | IMAP | (Disabled) | Plaintext IMAP | Blocked by firewall |
| **993** | TCP | IMAPS | Inbound | Encrypted IMAP | TLS required |
| **110** | TCP | POP3 | (Disabled) | Plaintext POP3 | Blocked by firewall |
| **995** | TCP | POP3S | Inbound | Encrypted POP3 | TLS required |
| **80** | TCP | HTTP | Inbound | Webmail redirect | Redirects to HTTPS |
| **443** | TCP | HTTPS | Inbound | Webmail interface | TLS required |
| **11334** | TCP | HTTP | Local only | Rspamd controller | Localhost only |
| **6379** | TCP | Redis | Local only | Rspamd cache | Localhost only |

### 9.2 Port Security Zones

```
┌────────────────────────────────────────────────────────┐
│                   PUBLIC ZONE                          │
│  Ports: 25, 587, 465, 993, 995, 80, 443               │
│  Protected by: ufw + fail2ban + TLS                   │
│  Monitored by: Rspamd, Postfix, Dovecot logs          │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│                   PRIVATE ZONE                         │
│  Ports: 11334 (Rspamd), 6379 (Redis), 3306 (DB)       │
│  Protected by: Localhost only, firewall blocks        │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│                   INTERNAL ZONE                        │
│  Services: Postfix-Dovecot socket                      │
│  Protected by: File permissions, socket isolation     │
└────────────────────────────────────────────────────────┘
```

### 9.3 Firewall Rule Set

**Complete ufw rules**:
```bash
# Reset to defaults
ufw --force reset
ufw default deny incoming
ufw default allow outgoing

# SSH (rate limit)
ufw limit 22/tcp comment 'SSH rate limit'

# Web (existing)
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'

# Email services
ufw allow 25/tcp comment 'SMTP server-to-server'
ufw allow 587/tcp comment 'SMTP submission (TLS)'
ufw allow 465/tcp comment 'SMTPS (legacy)'
ufw allow 993/tcp comment 'IMAPS (encrypted IMAP)'
ufw allow 995/tcp comment 'POP3S (encrypted POP3)'

# Rate limiting for SMTP
ufw route allow proto tcp from any to any port 25 limit 10/minute comment 'SMTP rate limit'

# Enable
ufw enable
ufw status verbose
```

---

## 10. Risk Assessment

### 10.1 Technical Risks

| Risk | Probability | Impact | Mitigation | Contingency |
|------|------------|--------|------------|-------------|
| **VPS runs out of RAM** | Medium | High | - Monitor RAM usage<br>- Configure process limits<br>- Enable swap | - Upgrade VPS<br>- Move heavy services off |
| **Disk space exhaustion** | Medium | High | - Monitor disk usage<br>- Set quotas<br>- Archive old emails | - Add disk volume<br>- Offload old emails to cloud |
| **Spam flood** | High | Medium | - Rate limiting<br>- Rspamd greylisting<br>- fail2ban | - Temporarily disable MX<br>- Use cloud filtering service |
| **Brute force attack** | High | Medium | - fail2ban<br>- Strong passwords<br>- Rate limiting | - Block attacker IP<br>- Enable Captcha (future) |
| **Configuration error** | Low | High | - Test in staging<br>- Version control<br>- Backup config | - Restore from git<br>- Revert to backup |
| **Data loss** | Low | Critical | - Daily backups<br>- Off-site storage<br>- RAID (future) | - Restore from backup<br>- Implement RAID |
| **Security breach** | Low | Critical | - TLS enforcement<br>- Regular updates<br>- Audit logs | - Incident response plan<br>- Forensic analysis |
| **Certificate expiry** | Low | High | - Auto-renewal<br>- Monitor expiry<br>- Backup certs | - Manual renewal<br>- Temporarily use self-signed |
| **DNS misconfiguration** | Low | High | - Test DNS changes<br>- Use DNS monitoring<br>- Backup DNS records | - Revert DNS changes<br>- Use emergency IP |
| **Service failure** | Medium | Medium | - Monitoring alerts<br>- Auto-restart (systemd)<br>- Redundant MX | - Restart service<br>- Restore from backup |

### 10.2 Operational Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| **User training gap** | High | Medium | - Create user documentation<br>- Conduct training session<br>- Provide quick reference |
| **Backup failure** | Low | Critical | - Test backups monthly<br>- Monitor backup jobs<br>- Multiple backup destinations |
| **Vendor lock-in** | Low | Medium | - Use open-source tools<br>- Standard formats (Maildir)<br>- Document migrations |
| **Scaling bottleneck** | Medium | Medium | - Monitor growth metrics<br>- Plan upgrades<br>- Document migration paths |
| **Compliance issues** | Low | High | - Enable audit logging<br>- Implement retention policies<br>- Legal review |

### 10.3 Risk Mitigation Timeline

**Immediate (Week 1)**:
- Configure fail2ban
- Set up monitoring alerts
- Test backups
- Document procedures

**Short-term (Month 1)**:
- Implement rate limiting
- Configure Rspamd tuning
- Conduct user training
- Set up logwatch

**Medium-term (Quarter 1)**:
- Review and optimize performance
- Test disaster recovery
- Implement spam filter tuning
- Security audit

**Long-term (Year 1)**:
- Plan scaling path
- Evaluate HA options
- Consider dedicated server
- Compliance review

---

## 11. Component Interaction Diagram

### 11.1 Email Flow Diagram

**Incoming Email Flow**:
```
[Sender]
    │ SMTP (port 25)
    ▼
[Firewall + fail2ban] → [Rspamd (spam check)]
    │
    ▼
[Postfix (SMTP)] ← [Dovecot SASL (auth)]
    │
    ▼ (virtual user lookup)
[SQLite Database]
    │
    ▼ (local delivery)
[Dovecot (LDA)] ← [Sieve (filtering)]
    │
    ▼ (Maildir format)
[Mail Storage: /var/vmail/domain/user/]
    │
    ▼ (IMAPS access)
[Client: Roundcube / Thunderbird / Mobile]
```

**Outgoing Email Flow**:
```
[Client: Roundcube / Thunderbird]
    │ SMTP (port 587, TLS)
    ▼
[Firewall + fail2ban]
    │
    ▼
[Postfix (SMTP)] ← [Dovecot SASL (auth)]
    │
    ▼ (spam/virus scan)
[Rspamd + ClamAV (optional)]
    │
    ▼ (DKIM signing)
[OpenDKIM]
    │
    ▼ (delivery)
[Recipient Server]
```

### 11.2 Authentication Flow

```
[Client]
    │ (username + password)
    ▼
[Dovecot Auth]
    │
    ├─→ [SQLite: SELECT password FROM users WHERE email = ?]
    │
    ├─→ [Verify: CRAM-MD5 / DIGEST-MD5 / PLAIN+TLS]
    │
    └─→ [Return: Success/Failure]
    │
    ▼
[Access Granted]
    │
    ├─→ [IMAP: Read emails]
    └─→ [SMTP: Send emails]
```

### 11.3 Webmail Architecture

```
[User Browser]
    │ HTTPS (port 443)
    ▼
[nginx] → [PHP-FPM]
    │
    ▼
[Roundcube (PHP)]
    │
    ├─→ [IMAPS: Dovecot (port 993)]
    │       └─→ [Read/Manage emails]
    │
    └─→ [SMTP: Postfix (port 587)]
            └─→ [Send emails]
```

---

## 12. Technology Decision Matrix

### 12.1 Software Component Comparison

#### MTA Selection

| Feature | Postfix ✓ | Exim ✗ | Sendmail ✗ |
|---------|-----------|--------|-----------|
| Security by default | Yes | No | No |
| Memory efficiency | Excellent | Good | Poor |
| Virtual user support | Excellent | Good | Poor |
| Documentation | Excellent | Good | Poor |
| Community support | Excellent | Good | Poor |
| Ease of configuration | Good | Fair | Poor |
| Performance | Excellent | Excellent | Good |

**Decision**: Postfix - Best balance of security, performance, and ease of use.

#### MDA Selection

| Feature | Dovecot ✓ | Courier ✗ |
|---------|----------|-----------|
| IMAP/POP3 support | Excellent | Good |
| Memory efficiency | Excellent | Good |
| SASL provider | Built-in | Separate |
| Sieve support | Excellent | Poor |
| Documentation | Excellent | Fair |
| Performance | Excellent | Good |
| Active development | Yes | Minimal |

**Decision**: Dovecot - Superior feature set, better performance, active development.

#### Database Selection

| Feature | SQLite ✓ | MySQL | PostgreSQL |
|---------|---------|-------|------------|
| Memory overhead | 0MB | ~100MB | ~150MB |
| Setup complexity | Minimal | Moderate | Moderate |
| Scalability | <100 users | Unlimited | Unlimited |
| Backup simplicity | File copy | Export/Import | Export/Import |
| Performance (read) | Excellent | Excellent | Excellent |
| Performance (write) | Good | Excellent | Excellent |

**Decision**: SQLite - Zero overhead, sufficient for 5-100 users, simple migration path.

#### Webmail Selection

| Feature | Roundcube ✓ | Rainloop | SnappyMail |
|---------|------------|----------|------------|
| Maturity | Excellent | Good | Good |
| Features | Extensive | Moderate | Moderate |
| Mobile support | Excellent | Good | Good |
| Plugin ecosystem | Extensive | Limited | Limited |
| Security track record | Excellent | Fair | Fair |
| PHP version | 8.3+ | 7.4+ | 7.4+ |

**Decision**: Roundcube - Most mature, feature-rich, secure, actively maintained.

#### Spam Filter Selection

| Feature | Rspamd ✓ | SpamAssassin ✗ |
|---------|---------|----------------|
| Memory usage | ~50MB | ~500MB |
| Scan speed | Fast | Slow |
| Modern spam detection | Excellent | Good |
| Machine learning | Built-in | Optional |
| DKIM/DMARC/SPF | Built-in | Optional |
| Web UI | Included | Separate |
| CPU usage | Low | High |
| Language | C | Perl |

**Decision**: Rspamd - 10x lower memory, faster, more modern, integrated features.

### 12.2 Technology Justification Summary

**Core Principle**: Right-sized for current needs, future-proof architecture.

**Chosen Stack**:
- **MTA**: Postfix (security, performance, community)
- **MDA**: Dovecot (features, efficiency, SASL)
- **Database**: SQLite (zero overhead, easy migration)
- **Webmail**: Roundcube (features, security, UX)
- **Spam Filter**: Rspamd (efficiency, modern)
- **Antivirus**: Skipped initially (resource constraint)
- **Firewall**: ufw (simplicity, Ubuntu-native)
- **Brute-force**: fail2ban (effective, lightweight)
- **TLS**: Let's Encrypt (free, automated)
- **Web Server**: nginx (existing, efficient)

**Trade-offs Made**:
1. **No ClamAV initially**: Saves ~300MB RAM, can add later with VPS upgrade
2. **SQLite vs MySQL**: Saves ~100MB RAM, easy migration path
3. **Single VPS vs Dedicated**: Cost savings, manageable for 5-50 users
4. **Rspamd vs SpamAssassin**: Saves ~450MB RAM, better performance

---

## 13. Integration Plan with Existing Services

### 13.1 Current Service Inventory

**Existing Services**:
- nginx (port 80, 443) - Running
- Node.js backend (port 3001) - Running
- MongoDB (port 27017) - Running
- PM2 process manager - Running
- SSL certificate: *.ementech.co.ke

**Resource Usage**:
- RAM: ~700MB used
- Disk: 11GB used, 29GB free
- CPU: Minimal

### 13.2 Integration Strategy

**Approach**: Coexist without disruption

**Steps**:

1. **Preserve existing configurations**
   ```bash
   # Backup nginx config
   cp -r /etc/nginx /etc/nginx.backup.$(date +%Y%m%d)

   # Backup existing services config
   cp /etc/pm2/pm2.config.js /etc/pm2/pm2.config.js.backup
   ```

2. **Add mail services alongside**
   - Install in parallel with existing services
   - Use separate ports (no conflicts)
   - Share nginx (add webmail virtual host)
   - Share SSL certificate (already wildcard)

3. **Test before DNS changes**
   - Configure everything first
   - Test with hosts file modification
   - Verify no conflicts with existing services
   - Then update DNS records

4. **Monitoring integration**
   - Add mail logs to existing logwatch
   - Add mail metrics to existing monitoring
   - Share alerting infrastructure

### 13.3 Potential Conflicts & Solutions

| Conflict | Solution |
|----------|----------|
| Port 80/443 conflict | nginx handles both existing and webmail via virtual hosts |
| SSL certificate | Use existing wildcard certificate |
| RAM usage | Monitor, tune processes, add swap if needed |
| Disk space | Monitor, mail storage separate from existing data |
| Log rotation | Configure separate log files, share logrotate |

### 13.4 Service Startup Order

**systemd dependencies**:
```bash
# Postfix depends on network
[Unit]
After=network-online.target
Wants=network-online.target

# Dovecot depends on Postfix (for SASL)
[Unit]
After=postfix.service
Requires=postfix.service

# nginx depends on Dovecot (for webmail)
[Unit]
After=dovecot.service
```

### 13.5 Shared Resources

**SSL Certificate**: Shared
- Path: `/etc/letsencrypt/live/ementech.co.ke/`
- Used by: nginx, Postfix, Dovecot
- Auto-renewal: certbot (already configured)

**Log Management**: Shared
- Location: `/var/log/`
- Rotation: logrotate (separate configs)
- Monitoring: logwatch (integrated)

**Monitoring**: Shared
- Existing: Node.js app monitoring
- New: Mail server monitoring
- Integration: Add to existing monitoring solution

---

## 14. Scaling Triggers and Roadmap

### 14.1 Growth Indicators

**Monitor These Metrics**:

| Metric | Current | Warning | Critical | Action |
|--------|---------|---------|----------|--------|
| **Users** | 5 | 25 | 50 | Plan upgrade |
| **RAM usage** | 70% | 85% | 95% | Add swap/upgrade |
| **Disk usage** | 35% | 70% | 85% | Add storage |
| **Queue size** | <10 | 100 | 1000 | Tune/upgrade |
| **IMAP connections** | <5 | 25 | 50 | Scale Dovecot |
| **Spam ratio** | <30% | 50% | 70% | Tune Rspamd |

### 14.2 Scaling Roadmap

**Stage 1: Current (0-6 months, 5-10 users)**
- Configuration: Single VPS, 2GB RAM, SQLite
- Services: Postfix, Dovecot, Rspamd, Roundcube
- Backup: Daily to remote server
- Cost: $10-20/month

**Stage 2: Growth (6-18 months, 10-25 users)**
- Configuration: Upgrade to 4GB RAM VPS
- Services: Add MySQL, ClamAV, Redis
- Backup: Daily + cloud storage
- Cost: $30-40/month

**Stage 3: Expansion (18-36 months, 25-100 users)**
- Configuration: Dedicated mail server (4-8GB RAM)
- Services: Add HA, load balancing, archiving
- Backup: Continuous + multi-region
- Cost: $60-100/month

**Stage 4: Enterprise (36+ months, 100+ users)**
- Configuration: Mail server cluster
- Services: High availability, DR site, archiving
- Backup: Real-time replication
- Cost: $200-500/month

### 14.3 Upgrade Triggers

**When to upgrade VPS**:
- Sustained RAM usage >85%
- Disk usage >80%
- Queue delays >30 minutes
- More than 25 users

**When to migrate to dedicated server**:
- More than 50 users
- Need high availability
- Compliance requirements
- Performance issues

**When to consider cloud email service**:
- More than 100 users
- Need advanced collaboration (calendar, docs)
- Compliance requirements (HIPAA, GDPR)
- Limited IT staff

---

## 15. Security Hardening Checklist

### 15.1 Pre-Deployment Security

- [ ] Change default root password
- [ ] Create separate mail admin user
- [ ] Disable password authentication for SSH (use keys)
- [ ] Configure fail2ban for SMTP/IMAP/SSH
- [ ] Set up firewall (ufw) with restrictive rules
- [ ] Disable unused services
- [ ] Enforce TLS for all email protocols
- [ ] Implement strong password policy (12+ characters)
- [ ] Configure SPF, DKIM, DMARC
- [ ] Set up automatic security updates
- [ ] Configure log monitoring and alerts
- [ ] Test security controls (penetration test)

### 15.2 Ongoing Security Maintenance

**Weekly**:
- Review fail2ban bans
- Check for security updates
- Review mail logs for anomalies

**Monthly**:
- Review user accounts (remove unused)
- Test backup restoration
- Review spam filtering accuracy
- Update spam filter rules

**Quarterly**:
- Security audit (review configs, logs)
- Performance review (optimize as needed)
- User training refresher
- DR test (restore from backup)

**Annually**:
- Full security assessment
- Architecture review (scaling needs)
- Technology refresh evaluation
- Compliance review (if applicable)

---

## 16. Troubleshooting Guide

### 16.1 Common Issues

**Issue 1: Emails not sending**
```bash
# Check queue
mailq

# Check logs
tail -f /var/log/mail.log

# Check if Postfix is running
systemctl status postfix

# Restart if needed
systemctl restart postfix
```

**Issue 2: Can't receive emails**
```bash
# Check MX records
dig ementech.co.ke MX

# Check firewall
ufw status

# Check if Postfix is listening
ss -tlnp | grep :25

# Check logs
tail -f /var/log/mail.log
```

**Issue 3: Webmail not accessible**
```bash
# Check nginx
systemctl status nginx

# Check nginx config
nginx -t

# Check PHP-FPM
systemctl status php8.3-fpm

# Check nginx logs
tail -f /var/log/nginx/webmail.ementech.co.ke-error.log
```

**Issue 4: Authentication fails**
```bash
# Check Dovecot auth
dovecot auth test

# Check database
sqlite3 /etc/postfix/virtual_mailboxes.db "SELECT * FROM users"

# Check Dovecot logs
tail -f /var/log/mail.log | grep dovecot
```

**Issue 5: High spam getting through**
```bash
# Check Rspamd stats
rspamc stat

# Test spam filter
echo 'XJS*C4JDBQADN1.NSBN3*2IDNEN*GTUBE-STANDARD-ANTI-UBE-TEST-EMAIL*C.34X' | mail -s "GTUBE" test@ementech.co.ke

# Tune Rspamd
# Edit /etc/rspamd/rspamd.conf
```

### 16.2 Emergency Procedures

**Emergency: Mail server down**
1. Check service status: `systemctl status postfix dovecot`
2. Check logs: `tail -f /var/log/mail.log`
3. Restart services: `systemctl restart postfix dovecot`
4. If failed, restore from backup
5. Alert users via alternative channel

**Emergency: Spam flood**
1. Temporarily disable MX record (set priority to 0)
2. Check fail2ban bans: `fail2ban-client status postfix`
3. Enable Rspamd greylisting
4. Clear queue if needed: `postsuper -d ALL`
5. Re-enable MX when resolved

**Emergency: Disk full**
1. Identify large files: `du -sh /var/vmail/* | sort -hr`
2. Archive old emails to backup
3. Clear queue: `postsuper -d ALL deferred`
4. Delete old logs: `logrotate -f /etc/logrotate.conf`
5. Alert users to clean mailboxes

---

## 17. User Documentation Structure

### 17.1 End-User Guides

**Quick Start Guide** (for all users):
1. How to access webmail
2. How to configure email client (Outlook, Thunderbird, mobile)
3. How to change password
4. How to create auto-reply
5. How to manage spam

**Advanced Features** (optional):
1. Email filters (Sieve)
2. Forwarding
3. Vacation/auto-reply
4. PGP encryption
5. Shared folders

### 17.2 Admin Documentation

**Maintenance Procedures**:
1. Adding/removing users
2. Managing aliases
3. Monitoring queue
4. Backup/restore procedures
5. Troubleshooting common issues

**Security Procedures**:
1. Reviewing fail2ban bans
2. Managing spam filter rules
3. Certificate renewal
4. Security audit checklist

### 17.3 Training Plan

**Day 1: Basic Usage**
- Webmail access and interface
- Compose, reply, forward
- Attachments
- Contacts management
- Calendar (if using plugins)

**Week 1: Security Awareness**
- Phishing recognition
- Spam management
- Password security
- Data protection

**Month 1: Advanced Features**
- Email filters
- Mobile setup
- Best practices

---

## 18. Cost-Benefit Analysis

### 18.1 Cost Breakdown

**Current Setup (Self-Hosted)**:
- VPS: $10-20/month (2GB RAM)
- Domain: Already owned
- SSL: Free (Let's Encrypt)
- Software: Free (open source)
- Backup destination: $5-10/month (Wasabi) or $0 (existing server)
- **Total: $15-30/month**

**Alternative: Google Workspace**:
- $6-12/user/month
- 5 users = $30-60/month
- **Total: $30-60/month**

**Alternative: Microsoft 365**:
- $6-12.50/user/month
- 5 users = $30-62.50/month
- **Total: $30-62.50/month**

### 18.2 ROI Analysis

**Break-even Point**: Self-hosted becomes cheaper after 2-3 months

**Cost Savings**: $15-45/month compared to cloud services

**Investment**:
- Setup time: 16-24 hours (admin time)
- Maintenance: 2-4 hours/month
- **Total time investment**: ~40 hours/year

**Benefits**:
- Full control over data
- No vendor lock-in
- Unlimited storage (within disk limits)
- Custom configurations
- Learning opportunity

**Trade-offs**:
- Requires technical expertise
- No built-in collaboration tools (calendar, docs)
- Responsible for security and backups
- Potential downtime risk

### 18.3 Recommendation

**For 5 users**: Self-hosted is cost-effective and provides full control

**For 10-25 users**: Self-hosted still cost-effective, consider upgrade to 4GB VPS

**For 25-50 users**: Evaluate dedicated server vs. cloud service (Google/Microsoft)

**For 50+ users**: Cloud service likely more cost-effective when considering admin time

---

## 19. Appendices

### 19.1 Configuration Templates

**Postfix main.cf (key settings)**:
```bash
# Network
smtpd_banner = $myhostname ESMTP $mail_name (Ubuntu)
biff = no
append_dot_mydomain = no
readme_directory = no

# TLS parameters
smtpd_tls_cert_file=/etc/letsencrypt/live/ementech.co.ke/fullchain.pem
smtpd_tls_key_file=/etc/letsencrypt/live/ementech.co.ke/privkey.pem
smtpd_tls_security_level=may
smtpd_tls_protocols=!SSLv2,!SSLv3,!TLSv1,!TLSv1.1
smtpd_tls_mandatory_protocols=!SSLv2,!SSLv3,!TLSv1,!TLSv1.1

# Virtual domains
virtual_mailbox_domains = sqlite:/etc/postfix/virtual_domains.cf
virtual_mailbox_maps = sqlite:/etc/postfix/virtual_mailboxes.cf
virtual_alias_maps = sqlite:/etc/postfix/virtual_aliases.cf

# Mail delivery
virtual_transport = dovecot
dovecot_destination_recipient_limit = 1

# Limits
message_size_limit = 25600000
mailbox_size_limit = 1000000000
smtpd_client_connection_count_limit = 10
smtpd_client_message_rate_limit = 50

# Spam filtering
smtpd_milters = inet:localhost:11332
non_smtpd_milters = inet:localhost:11332
milter_protocol = 6
milter_default_action = accept
```

**Dovecot 10-mail.conf**:
```bash
mail_location = maildir:/var/vmail/%d/%n
mail_privileged_group = vmail
mail_uid = vmail
mail_gid = vmail
first_valid_uid = 5000
last_valid_uid = 5000
first_valid_gid = 5000
last_valid_gid = 5000

# Quota
quota = maildir:User quota
quota_rule = *:storage=2G
quota_rule2 = Trash:storage=500M
quota_warning = storage=95%% quota-warning 95 %u
```

### 19.2 DNS Records Template

```
; A Records
mail.ementech.co.ke.          IN  A   69.164.244.165
webmail.ementech.co.ke.       IN  A   69.164.244.165
autoconfig.ementech.co.ke.    IN  A   69.164.244.165

; MX Records
ementech.co.ke.               IN  MX  10  mail.ementech.co.ke.

; TXT Records
ementech.co.ke.               IN  TXT  "v=spf1 mx a ip4:69.164.244.165 -all"
_dmarc.ementech.co.ke.        IN  TXT  "v=DMARC1; p=reject; rua=mailto:dmarc@ementech.co.ke; ruf=mailto:dmarc@ementech.co.ke; aspf=s; adkim=s; pct=100; ri=86400"

; DKIM Records
ementech1._domainkey.ementech.co.ke.  IN  TXT  "v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC..."

; SRV Records (for autodiscover)
_submission._tcp.ementech.co.ke.  IN  SRV  0 0 587 mail.ementech.co.ke.
_imaps._tcp.ementech.co.ke.       IN  SRV  0 0 993 mail.ementech.co.ke.
_pop3s._tcp.ementech.co.ke.       IN  SRV  0 0 995 mail.ementech.co.ke.
```

### 19.3 Useful Commands Reference

**Postfix**:
```bash
# View queue
mailq

# Flush queue
postqueue -f

# Delete all queued mail
postsuper -d ALL

# Delete deferred mail
postsuper -d ALL deferred

# Check config
postconf -n

# Test config
postfix check

# Reload config
postfix reload
```

**Dovecot**:
```bash
# Test authentication
dovecot auth test

# Check config
dovecot -n

# Reload config
dovecot reload

# Monitor connections
doveadm whois
```

**Rspamd**:
```bash
# View stats
rspamc stat

# Scan email
rspamc < sample-email.eml

# Learn spam
rspamc learn_spam < spam.eml

# Learn ham
rspamc learn_ham < ham.eml
```

**System**:
```bash
# Check mail logs
tail -f /var/log/mail.log

# Check service status
systemctl status postfix dovecot rspamd

# Restart services
systemctl restart postfix dovecot

# Check RAM usage
free -h

# Check disk usage
df -h /var/vmail

# Check network connections
ss -tlnp | grep -E '25|587|993|995'
```

### 19.4 Testing Procedures

**SMTP Test**:
```bash
telnet mail.ementech.co.ke 25
# Or
openssl s_client -connect mail.ementech.co.ke:587 -crlf
```

**IMAP Test**:
```bash
openssl s_client -connect mail.ementech.co.ke:993
```

**Email Flow Test**:
```bash
# Send test email
echo "Test body" | mail -s "Test subject" test@ementech.co.ke

# Check delivery
tail -f /var/log/mail.log

# Check mailbox
ls /var/vmail/ementech.co.ke/test/new/
```

**Spam Filter Test**:
```bash
echo 'XJS*C4JDBQADN1.NSBN3*2IDNEN*GTUBE-STANDARD-ANTI-UBE-TEST-EMAIL*C.34X' | mail -s "GTUBE" test@ementech.co.ke
```

### 19.5 Performance Tuning Parameters

**Postfix Tuning**:
```bash
# Concurrency
smtpd_client_connection_count_limit = 10
smtpd_client_connection_rate_limit = 30
smtpd_client_message_rate_limit = 50

# Queue
queue_run_delay = 300s
minimal_backoff_time = 300s
maximal_backoff_time = 4000s

# Resource
default_process_limit = 100
smtpd_client_connection_limit = 10
```

**Dovecot Tuning**:
```bash
# Process limits
default_process_limit = 100
default_vsz_limit = 512M

# Connections
mail_max_userip_connections = 10
client_limit = 20

# I/O
mail_nfs_index = no
mail_nfs_storage = no
mail_fsync = optimized
```

**Rspamd Tuning**:
```bash
# Workers
worker "normal" {
    count = 1;
    max_requests = 1000;
}

# Cache
cache {
    max_size = 1G;
}
```

---

## 20. Conclusion

This architecture provides a production-ready, secure, and scalable email server for EmenTech Technologies within the constraints of a 2GB VPS. The design prioritizes:

1. **Security**: TLS enforcement, spam filtering, brute-force protection
2. **Efficiency**: Low-memory footprint components (Rspamd, SQLite)
3. **Scalability**: Clear upgrade path from 5 to 100+ users
4. **Maintainability**: Standard tools, good documentation, monitoring
5. **Integration**: Seamless coexistence with existing services

**Key Success Factors**:
- Proper DNS configuration (SPF/DKIM/DMARC)
- Regular backups and testing
- Ongoing monitoring and maintenance
- User training and documentation

**Next Steps**:
1. Review and approve architecture
2. Set up staging environment for testing
3. Execute implementation plan
4. Conduct user training
5. Monitor and optimize

**Estimated Timeline**:
- Architecture review: 1 day
- Implementation: 3-4 days
- Testing: 1-2 days
- User training: 1 day
- **Total: 1 week**

---

**Document Version History**:
- v1.0 (2026-01-19): Initial architecture design

**Approvals**:
- [ ] CTO/Technical Lead
- [ ] Security Officer (if applicable)
- [ ] Management

**Contact**: For questions or clarifications, contact the system architecture team.
