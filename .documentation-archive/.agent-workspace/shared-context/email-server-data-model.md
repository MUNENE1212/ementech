# Email Server Data Model and Database Schema

**Version**: 1.0
**Date**: 2026-01-19
**Related**: email-server-architecture.md

## 1. Database Schema

### 1.1 Virtual Mailboxes Database (SQLite)

**Database File**: `/etc/postfix/virtual_mailboxes.db`

**Schema Design**:
```
virtual_mailboxes.db
├── users table          # Email accounts
├── aliases table        # Email aliases/forwarding
├── domains table        # Virtual domains
└── quota table          # Quota usage tracking (optional)
```

### 1.2 Table Definitions

#### Table: users

Stores individual email account information.

```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,           -- Full email address (user@domain)
    password TEXT NOT NULL,               -- Encrypted password (SHA512-CRYPT)
    name TEXT,                            -- Display name
    domain TEXT NOT NULL,                 -- Domain part (ementech.co.ke)
    user TEXT NOT NULL,                   -- Username part (before @)
    home TEXT NOT NULL,                   -- Home directory (/var/vmail/domain/user)
    maildir TEXT NOT NULL,                -- Maildir path (domain/user/)
    quota INTEGER DEFAULT 2048000000,     -- Quota in bytes (default: 2GB)
    quota_used INTEGER DEFAULT 0,         -- Current usage in bytes
    active INTEGER DEFAULT 1,             -- Account status (1=active, 0=disabled)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,                 -- Last successful login
    FOREIGN KEY (domain) REFERENCES domains(domain)
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_domain ON users(domain);
CREATE INDEX idx_users_active ON users(active);
```

**Initial Data**:
```sql
INSERT INTO users (email, password, name, domain, user, home, maildir, quota) VALUES
('ceo@ementech.co.ke', '{SHA512-CRYPT}$6$rounds=5000$hash...', 'CEO', 'ementech.co.ke', 'ceo', '/var/vmail/ementech.co.ke/ceo', 'ementech.co.ke/ceo/', 2147483648),
('info@ementech.co.ke', '{SHA512-CRYPT}$6$rounds=5000$hash...', 'Info', 'ementech.co.ke', 'info', '/var/vmail/ementech.co.ke/info', 'ementech.co.ke/info/', 2147483648),
('support@ementech.co.ke', '{SHA512-CRYPT}$6$rounds=5000$hash...', 'Support', 'ementech.co.ke', 'support', '/var/vmail/ementech.co.ke/support', 'ementech.co.ke/support/', 2147483648),
('admin@ementech.co.ke', '{SHA512-CRYPT}$6$rounds=5000$hash...', 'Admin', 'ementech.co.ke', 'admin', '/var/vmail/ementech.co.ke/admin', 'ementech.co.ke/admin/', 2147483648),
('tech@ementech.co.ke', '{SHA512-CRYPT}$6$rounds=5000$hash...', 'Tech', 'ementech.co.ke', 'tech', '/var/vmail/ementech.co.ke/tech', 'ementech.co.ke/tech/', 2147483648);
```

#### Table: aliases

Stores email aliases and forwarding rules.

```sql
CREATE TABLE aliases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source TEXT NOT NULL UNIQUE,          -- Source email (alias@domain)
    destination TEXT NOT NULL,            -- Destination (user@domain or external)
    domain TEXT NOT NULL,                 -- Domain part
    active INTEGER DEFAULT 1,             -- Alias status (1=active, 0=disabled)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (domain) REFERENCES domains(domain)
);

CREATE INDEX idx_aliases_source ON aliases(source);
CREATE INDEX idx_aliases_domain ON aliases(domain);
```

**Example Data**:
```sql
-- Catch-all alias (optional - use with caution)
INSERT INTO aliases (source, destination, domain) VALUES
('@ementech.co.ke', 'admin@ementech.co.ke', 'ementech.co.ke');

-- Department aliases
INSERT INTO aliases (source, destination, domain) VALUES
('sales@ementech.co.ke', 'ceo@ementech.co.ke,info@ementech.co.ke', 'ementech.co.ke'),
('accounts@ementech.co.ke', 'admin@ementech.co.ke', 'ementech.co.ke'),
('hostmaster@ementech.co.ke', 'tech@ementech.co.ke', 'ementech.co.ke'),
('webmaster@ementech.co.ke', 'tech@ementech.co.ke', 'ementech.co.ke'),
('postmaster@ementech.co.ke', 'admin@ementech.co.ke', 'ementech.co.ke'),
('abuse@ementech.co.ke', 'admin@ementech.co.ke', 'ementech.co.ke'),
('dmarc@ementech.co.ke', 'admin@ementech.co.ke', 'ementech.co.ke');
```

#### Table: domains

Stores virtual domains hosted on the server.

```sql
CREATE TABLE domains (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    domain TEXT NOT NULL UNIQUE,          -- Domain name
    active INTEGER DEFAULT 1,             -- Domain status (1=active, 0=disabled)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT                      -- Optional description
);

CREATE INDEX idx_domains_domain ON domains(domain);
```

**Initial Data**:
```sql
INSERT INTO domains (domain, active, description) VALUES
('ementech.co.ke', 1, 'EmenTech Technologies primary domain');
```

#### Table: senders (Optional)

For DKIM signing and sender verification.

```sql
CREATE TABLE senders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,           -- Sender email
    domain TEXT NOT NULL,                 -- Domain
    dkim_selector TEXT,                   -- DKIM selector (e.g., 'ementech1')
    dkim_key_path TEXT,                   -- Path to DKIM private key
    active INTEGER DEFAULT 1,
    FOREIGN KEY (domain) REFERENCES domains(domain)
);
```

**Initial Data**:
```sql
INSERT INTO senders (email, domain, dkim_selector, dkim_key_path, active) VALUES
('@ementech.co.ke', 'ementech.co.ke', 'ementech1', '/etc/postfix/dkim/ementech.co.ke.private', 1);
```

---

## 2. Postfix Virtual Mail Maps

### 2.1 Virtual Domains Map

**File**: `/etc/postfix/sql/virtual_domains.cf`

```bash
user = postfix
password = <database_password>
hosts = 127.0.0.1
dbname = /etc/postfix/virtual_mailboxes.db
query = SELECT 1 FROM domains WHERE domain='%s' AND active=1
```

### 2.2 Virtual Mailboxes Map

**File**: `/etc/postfix/sql/virtual_mailboxes.cf`

```bash
user = postfix
password = <database_password>
hosts = 127.0.0.1
dbname = /etc/postfix/virtual_mailboxes.db
query = SELECT maildir FROM users WHERE email='%s' AND active=1
```

### 2.3 Virtual Aliases Map

**File**: `/etc/postfix/sql/virtual_aliases.cf`

```bash
user = postfix
password = <database_password>
hosts = 127.0.0.1
dbname = /etc/postfix/virtual_mailboxes.db
query = SELECT destination FROM aliases WHERE source='%s' AND active=1
```

---

## 3. Dovecot SQL Configuration

### 3.1 User Database Query

**File**: `/etc/dovecot/conf.d/auth-sql.conf.ext`

```bash
driver = sql
connect = host=127.0.0.1 dbname=/etc/postfix/virtual_mailboxes.db
default_pass_scheme = SHA512-CRYPT

# User lookup
user_query = \
    SELECT email, home, \
    'maildir:/var/vmail/%d/%n' AS mail, \
    5000 AS uid, 5000 AS gid, \
    concat('dict:User quota::proxy::sql:', email) AS quota \
    FROM users \
    WHERE email = '%u' AND active = '1'

# Password lookup
password_query = \
    SELECT email, user, domain, password, \
    '/var/vmail/%d/%n' AS userdb_home, \
    'maildir:/var/vmail/%d/%n' AS userdb_mail, \
    5000 AS userdb_uid, 5000 AS userdb_gid \
    FROM users \
    WHERE email = '%u' AND active = '1'
```

### 3.2 Quota Configuration

**File**: `/etc/dovecot/conf.d/quota.conf`

```bash
quota = dict:User quota::proxy::sql:%u

plugin {
    quota_rule = *:storage=2G
    quota_rule2 = Trash:storage=500M
    quota_warning = storage=95%% quota-warning 95 %u
    quota_warning2 = storage=80%% quota-warning 80 %u
}

service quota-warning {
    executable = script /usr/local/bin/quota-warning.sh
    user = vmail
    unix_listener quota-warning {
        user = vmail
    }
}
```

**Quota warning script** (`/usr/local/bin/quota-warning.sh`):
```bash
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
```

---

## 4. Maildir Structure

### 4.1 Directory Layout

```
/var/vmail/
└── ementech.co.ke/
    └── username/
        ├── cur/                    # Current (read) emails
        │   ├── 1609459200.M123456P12345.hostname,S=1234,W=2345:2,S
        │   └── 1609459300.M123457P12346.hostname,S=5678,W=6789:2,RS
        ├── new/                    # New (unread) emails
        │   └── 1609459400.M123458P12347.hostname,S=9012,W=10123:2,
        ├── tmp/                    # Temporary storage (delivering)
        ├── dovecot-uidlist         # Dovecot UID list
        ├── dovecot.index           # Dovecot index
        ├── dovecot.index.log       # Index log
        ├── dovecot-keywords        # Keywords/labels
        ├── dovecot-uidvalidity     # UID validity
        ├── maildirsize             # Quota information
        └── subscriptions           # Subscribed folders
```

### 4.2 Maildir Filename Format

**Format**: `{timestamp}.{unique}.{hostname},{flags},{size},:{info}`

**Flags**:
- `S` = Seen (read)
- `R` = Replied
- `F` = Flagged
- `T` = Trashed (deleted)
- `D` = Draft

**Example**: `1609459200.M123456P12345.hostname,S=1234,W=2345:2,S`
- `1609459200` = Unix timestamp
- `M123456P12345` = Unique identifier (Microseconds + PID)
- `hostname` = Server hostname
- `S=1234` = Message size (1234 bytes)
- `W=2345` = Virtual size (2345 bytes)
- `2,` = Maildir version
- `S` = Seen flag

---

## 5. User Management Scripts

### 5.1 Add User Script

**File**: `/usr/local/bin/add-mail-user.sh`

```bash
#!/bin/bash
# Usage: ./add-mail-user.sh email@domain.com "Display Name" [password]

if [ $# -lt 2 ]; then
    echo "Usage: $0 email@domain.com 'Display Name' [password]"
    exit 1
fi

EMAIL=$1
NAME=$2
DOMAIN=${EMAIL#*@}
USER=${EMAIL%@*}

# Generate password if not provided
if [ -z "$3" ]; then
    PASSWORD=$(openssl rand -base64 12)
    echo "Generated password: $PASSWORD"
else
    PASSWORD=$3
fi

# Generate password hash (SHA512-CRYPT)
HASH=$(doveadm pw -s SHA512-CRYPT -p "$PASSWORD")

# Create maildir
MAILDIR="/var/vmail/$DOMAIN/$USER"
mkdir -p "$MAILDIR"
mkdir -p "$MAILDIR/cur" "$MAILDIR/new" "$MAILDIR/tmp"
chown -R vmail:vmail "/var/vmail/$DOMAIN"

# Add to database
sqlite3 /etc/postfix/virtual_mailboxes.db <<EOF
INSERT INTO users (email, password, name, domain, user, home, maildir, quota)
VALUES ('$EMAIL', '$HASH', '$NAME', '$DOMAIN', '$USER',
        '/var/vmail/$DOMAIN/$USER', '$DOMAIN/$USER/', 2147483648);
EOF

echo "User $EMAIL created successfully"
echo "Maildir: $MAILDIR"
```

### 5.2 Delete User Script

**File**: `/usr/local/bin/delete-mail-user.sh`

```bash
#!/bin/bash
# Usage: ./delete-mail-user.sh email@domain.com

if [ $# -lt 1 ]; then
    echo "Usage: $0 email@domain.com"
    exit 1
fi

EMAIL=$1
DOMAIN=${EMAIL#*@}
USER=${EMAIL%@*}

# Backup maildir
BACKUP_DIR="/backup/mail/deleted-$(date +%Y%m%d)"
mkdir -p "$BACKUP_DIR"
if [ -d "/var/vmail/$DOMAIN/$USER" ]; then
    mv "/var/vmail/$DOMAIN/$USER" "$BACKUP_DIR/"
fi

# Remove from database
sqlite3 /etc/postfix/virtual_mailboxes.db "DELETE FROM users WHERE email='$EMAIL';"

echo "User $EMAIL deleted successfully"
echo "Backup saved to: $BACKUP_DIR"
```

### 5.3 Change Password Script

**File**: `/usr/local/bin/change-mail-password.sh`

```bash
#!/bin/bash
# Usage: ./change-mail-password.sh email@domain.com new_password

if [ $# -lt 2 ]; then
    echo "Usage: $0 email@domain.com new_password"
    exit 1
fi

EMAIL=$1
PASSWORD=$2

# Generate password hash
HASH=$(doveadm pw -s SHA512-CRYPT -p "$PASSWORD")

# Update database
sqlite3 /etc/postfix/virtual_mailboxes.db "UPDATE users SET password='$HASH' WHERE email='$EMAIL';"

echo "Password updated for $EMAIL"
```

### 5.4 List Users Script

**File**: `/usr/local/bin/list-mail-users.sh`

```bash
#!/bin/bash

sqlite3 -header -column /etc/postfix/virtual_mailboxes.db <<EOF
SELECT email, name, domain, active,
       datetime(created_at) AS created,
       datetime(last_login) AS last_login
FROM users
ORDER BY domain, user;
EOF
```

### 5.5 Add Alias Script

**File**: `/usr/local/bin/add-mail-alias.sh`

```bash
#!/bin/bash
# Usage: ./add-mail-alias.sh alias@domain.com destination@domain.com

if [ $# -lt 2 ]; then
    echo "Usage: $0 alias@domain.com destination@domain.com"
    exit 1
fi

SOURCE=$1
DESTINATION=$2
DOMAIN=${SOURCE#*@}

# Add to database
sqlite3 /etc/postfix/virtual_mailboxes.db <<EOF
INSERT INTO aliases (source, destination, domain)
VALUES ('$SOURCE', '$DESTINATION', '$DOMAIN');
EOF

echo "Alias $SOURCE -> $DESTINATION created successfully"
```

---

## 6. Migration from System Users to Virtual Users

### 6.1 Migration Strategy

If transitioning from system users to virtual users:

```bash
#!/bin/bash
# /usr/local/bin/migrate-to-virtual-users.sh

SYSTEM_USERS=("user1" "user2" "user3")
DOMAIN="ementech.co.ke"

for USER in "${SYSTEM_USERS[@]}"; do
    EMAIL="$USER@$DOMAIN"

    # Extract system user info
    HOME_DIR=$(getent passwd "$USER" | cut -d: -f6)
    GECOS=$(getent passwd "$USER" | cut -d: -f5)

    # Copy existing mail
    if [ -d "$HOME_DIR/Maildir" ]; then
        cp -r "$HOME_DIR/Maildir" "/var/vmail/$DOMAIN/$USER/"
        chown -R vmail:vmail "/var/vmail/$DOMAIN/$USER"
    fi

    # Generate password hash (use existing system password)
    # Note: Requires manual password reset or hash extraction

    echo "Migrated $USER to $EMAIL"
    echo "Please set new password using: change-mail-password.sh $EMAIL <new_password>"
done
```

---

## 7. Backup and Restore Procedures

### 7.1 Database Backup

**Script**: `/usr/local/bin/backup-mail-db.sh`

```bash
#!/bin/bash
# Backup mail database

BACKUP_DIR="/backup/mail/db"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p "$BACKUP_DIR"

# Backup database
cp /etc/postfix/virtual_mailboxes.db "$BACKUP_DIR/virtual_mailboxes_$DATE.db"

# Keep last 30 backups
find "$BACKUP_DIR" -name "virtual_mailboxes_*.db" -mtime +30 -delete

echo "Database backed up to: $BACKUP_DIR/virtual_mailboxes_$DATE.db"
```

### 7.2 Database Restore

```bash
#!/bin/bash
# Restore mail database
# Usage: ./restore-mail-db.sh YYYYMMDD_HHMMSS

if [ $# -lt 1 ]; then
    echo "Usage: $0 YYYYMMDD_HHMMSS"
    exit 1
fi

BACKUP_FILE="/backup/mail/db/virtual_mailboxes_$1.db"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "Backup not found: $BACKUP_FILE"
    exit 1
fi

# Stop services
systemctl stop postfix dovecot

# Restore database
cp "$BACKUP_FILE" /etc/postfix/virtual_mailboxes.db
chmod 640 /etc/postfix/virtual_mailboxes.db
chown root:postfix /etc/postfix/virtual_mailboxes.db

# Start services
systemctl start postfix dovecot

echo "Database restored from: $BACKUP_FILE"
```

---

## 8. Maintenance Scripts

### 8.1 Cleanup Script

**File**: `/usr/local/bin/cleanup-mail.sh`

```bash
#!/bin/bash
# Cleanup old emails from trash folders

MAILDIR_BASE="/var/vmail"
DAYS=30

find "$MAILDIR_BASE" -type f -path "*/Trash/cur/*" -mtime +$DAYS -delete
find "$MAILDIR_BASE" -type f -path "*/Trash/new/*" -mtime +$DAYS -delete

echo "Cleaned up emails older than $DAYS days from Trash folders"
```

### 8.2 Quota Report Script

**File**: `/usr/local/bin/quota-report.sh`

```bash
#!/bin/bash
# Generate quota usage report

sqlite3 -header -column /etc/postfix/virtual_mailboxes.db <<EOF
SELECT email,
       printf("%.2f MB", quota_used / 1048576.0) AS used_mb,
       printf("%.2f MB", quota / 1048576.0) AS total_mb,
       printf("%.1f%%", (quota_used * 100.0) / quota) AS percentage
FROM users
WHERE active = 1
ORDER BY (quota_used * 100.0) / quota DESC;
EOF
```

---

## 9. Testing Procedures

### 9.1 Database Queries

**Test user lookup**:
```bash
sqlite3 /etc/postfix/virtual_mailboxes.db "SELECT * FROM users WHERE email='ceo@ementech.co.ke';"
```

**Test alias lookup**:
```bash
sqlite3 /etc/postfix/virtual_mailboxes.db "SELECT * FROM aliases WHERE source='info@ementech.co.ke';"
```

**Test domain lookup**:
```bash
sqlite3 /etc/postfix/virtual_mailboxes.db "SELECT * FROM domains WHERE domain='ementech.co.ke';"
```

### 9.2 Postfix Testing

**Test virtual mailbox lookup**:
```bash
postmap -q "ceo@ementech.co.ke" sqlite:/etc/postfix/sql/virtual_mailboxes.cf
```

**Test virtual alias lookup**:
```bash
postmap -q "info@ementech.co.ke" sqlite:/etc/postfix/sql/virtual_aliases.cf
```

**Test domain lookup**:
```bash
postmap -q "ementech.co.ke" sqlite:/etc/postfix/sql/virtual_domains.cf
```

### 9.3 Dovecot Testing

**Test authentication**:
```bash
dovecot auth test ceo@ementech.co.ke password123
```

**Test user lookup**:
```bash
dovecot user ceo@ementech.co.ke
```

---

## 10. Security Considerations

### 10.1 File Permissions

```bash
# Database files
/etc/postfix/virtual_mailboxes.db    0640  root:postfix
/etc/postfix/sql/*.cf                0640  root:postfix

# Mail storage
/var/vmail/                          0700  vmail:vmail
/var/vmail/*/                        0700  vmail:vmail
/var/vmail/*/*/                      0700  vmail:vmail

# Scripts
/usr/local/bin/*-mail-*.sh           0750  root:root
```

### 10.2 Database Security

**Protect against SQL injection**:
- Use parameterized queries in Postfix/Dovecot SQL configs
- Validate input in management scripts
- Limit database user permissions

**Database backup encryption**:
```bash
# Encrypt backup
gpg --symmetric --cipher-algo AES256 virtual_mailboxes.db

# Decrypt backup
gpg --decrypt virtual_mailboxes.db.gpg > virtual_mailboxes.db
```

### 10.3 Password Policy

**Generate strong password**:
```bash
# 16-character random password
openssl rand -base64 16

# Or with special characters
tr -dc 'A-Za-z0-9!#$%&()*+,-./:;<=>?@[\]^_`{|}~' </dev/urandom | head -c 16
```

**Password requirements**:
- Minimum 12 characters
- Must include: uppercase, lowercase, digit, special character
- No dictionary words
- No repeated patterns

---

## 11. Performance Optimization

### 11.1 Database Indexes

Existing indexes ensure fast lookups:
- `idx_users_email` - Fast email lookup (authentication)
- `idx_users_domain` - Fast domain queries
- `idx_users_active` - Fast active user filtering
- `idx_aliases_source` - Fast alias resolution
- `idx_aliases_domain` - Fast domain-based alias lookup

### 11.2 Query Optimization

**Analyze slow queries**:
```bash
# Enable query logging
echo ".log /var/log/sqlite.log" | sqlite3 /etc/postfix/virtual_mailboxes.db

# Analyze query plan
echo "EXPLAIN QUERY PLAN SELECT * FROM users WHERE email='ceo@ementech.co.ke';" | \
    sqlite3 /etc/postfix/virtual_mailboxes.db
```

**Vacuum database** (monthly):
```bash
sqlite3 /etc/postfix/virtual_mailboxes.db "VACUUM;"
```

### 11.3 Caching

**Postfix caching**:
```bash
# /etc/postfix/main.cf
virtual_mailbox_maps = proxy:sqlite:/etc/postfix/sql/virtual_mailboxes.cf
virtual_alias_maps = proxy:sqlite:/etc/postfix/sql/virtual_aliases.cf
```

**Dovecot auth cache**:
```bash
# /etc/dovecot/conf.d/auth.conf.ext
auth_cache_size = 10M
auth_cache_ttl = 1 hour
auth_cache_negative_ttl = 0
```

---

## 12. Monitoring Queries

### 12.1 User Count

```bash
sqlite3 /etc/postfix/virtual_mailboxes.db "SELECT COUNT(*) FROM users WHERE active=1;"
```

### 12.2 Domain Count

```bash
sqlite3 /etc/postfix/virtual_mailboxes.db "SELECT COUNT(*) FROM domains WHERE active=1;"
```

### 12.3 Alias Count

```bash
sqlite3 /etc/postfix/virtual_mailboxes.db "SELECT COUNT(*) FROM aliases WHERE active=1;"
```

### 12.4 Disk Usage by User

```bash
du -sh /var/vmail/*/* | sort -hr | head -20
```

### 12.5 Total Mail Storage

```bash
du -sh /var/vmail
```

---

## 13. Conclusion

This data model provides a flexible, scalable foundation for the EmenTech email system. Key features:

- **Virtual users**: Easy management without system accounts
- **SQLite**: Zero overhead, simple backups, easy migration
- **Maildir**: Standard format, excellent performance, easy access
- **Quota support**: Built-in quota tracking and warnings
- **Management scripts**: Automated user/alias management
- **Security**: Proper permissions, password hashing, SQL injection protection

**Next Steps**:
1. Initialize database with schema
2. Create initial users and aliases
3. Set up management scripts
4. Test user/alias operations
5. Configure backups

---

**Document Version**: 1.0
**Last Updated**: 2026-01-19
