# Incident Response Runbooks

## Overview

This document provides step-by-step procedures for responding to common email server emergencies. Each runbook includes symptoms, diagnosis, resolution, and prevention strategies.

## Emergency Contact Information

**Primary On-Call:** _________________________ Phone: _________________________
**Secondary On-Call:** _________________________ Phone: _________________________
**Escalation Manager:** _________________________ Phone: _________________________
**VPS Provider Support:** _________________________ Phone: _________________________

---

## Runbook 1: Mail Queue Stuck

### Severity: High
### Response Time: <15 minutes

### Symptoms
- Emails not being delivered
- Queue size growing continuously
- Users complaining of missing emails
- `mailq` shows many deferred messages

### Diagnosis

**Step 1: Check Queue Status**
```bash
# View mail queue
mailq

# Check queue size
mailq | tail -n1

# View deferred messages
mailq | grep -A 5 "Deferred"

# Check queue age
find /var/spool/postfix/deferred -type f -mtime +1 | wc -l
```

**Step 2: Check Postfix Status**
```bash
# Is Postfix running?
systemctl status postfix

# Check for errors
tail -50 /var/log/mail.log | grep postfix
```

**Step 3: Identify Blockage**
```bash
# Check for network issues
ping -c 3 gmail.com
telnet gmail.com 25

# Check for DNS issues
dig mx gmail.com

# Check disk space
df -h /
```

### Resolution

**Option 1: Flush Queue (First Attempt)**
```bash
# Force immediate delivery attempt
postqueue -f

# Wait 2 minutes and check queue
sleep 120
mailq
```

**Option 2: Requeue Messages**
```bash
# Requeue all deferred messages
postsuper -r ALL

# Flush queue
postqueue -f
```

**Option 3: Delete Stuck Messages (Last Resort)**
```bash
# Delete specific message
postsuper -d MESSAGE_ID

# Delete all deferred messages older than 7 days
find /var/spool/postfix/deferred -type f -mtime +7 -delete

# Delete ALL deferred messages (DANGEROUS)
postsuper -d ALL deferred
```

**Option 4: Fix Network/DNS Issues**
```bash
# Restart DNS resolver
systemctl restart systemd-resolved

# Flush Postfix cache
postfix flush
```

### Verification
```bash
# Send test email
echo "Test" | mail -s "Queue test" test@example.com

# Monitor queue
watch -n 10 'mailq | tail -n1'

# Check delivery in logs
tail -f /var/log/mail.log | grep "status=sent"
```

### Prevention
- Configure proper queue lifetime limits
- Monitor queue size regularly
- Set up alerts for queue growth
- Maintain adequate disk space
- Ensure stable network connectivity

---

## Runbook 2: Server Being Used as Spam Relay

### Severity: CRITICAL
### Response Time: <5 minutes

### Symptoms
- Blacklisting on spam databases
- Sudden bandwidth spike
- Mail queue full of unknown messages
- High CPU usage
- Complaints from recipients

### Diagnosis

**Step 1: Check Queue Content**
```bash
# View mail queue
mailq | head -50

# Check sender addresses
mailq | grep "from=" | awk '{print $7}' | sort | uniq -c | sort -rn | head -20

# Check recipient addresses
mailq | grep "to=" | awk '{print $8}' | sort | uniq -c | sort -rn | head -20
```

**Step 2: Check Authentication**
```bash
# Check for successful authentications
grep "sasl_method=LOGIN" /var/log/mail.log | tail -50

# Check authenticated senders
grep "sasl_username=" /var/log/mail.log | awk '{print $7}' | sort | uniq -c | sort -rn | head -20
```

**Step 3: Check Open Relay**
```bash
# Test from external machine
telnet mail.ementech.co.ke 25
ehlo test.com
mail from: <test@external.com>
rcpt to: <victim@external.com>
data
test
.
# If accepted, you're an open relay!
```

### Immediate Action (Stop the Bleeding)

**Step 1: Stop Postfix Immediately**
```bash
systemctl stop postfix
```

**Step 2: Analyze the Breach**
```bash
# Check recent authentications
grep "sasl_username=" /var/log/mail.log | tail -100 > /tmp/auth-log.txt

# Identify compromised accounts
cat /tmp/auth-log.txt | awk -F= '{print $2}' | awk '{print $1}' | sort | uniq -c | sort -rn

# Check source IPs
grep "sasl_method=LOGIN" /var/log/mail.log | awk '{print $6}' | sort | uniq -c | sort -rn | head -20
```

**Step 3: Block Attacking IPs**
```bash
# Block top offending IPs
ufw deny from ATTACKER_IP

# Or use fail2ban
fail2ban-client set postfix-sasl banip ATTACKER_IP
```

**Step 4: Change Compromised Passwords**
```bash
# Change password for compromised user
doveadm pw -u COMPROMISED_USER -p NEW_STRONG_PASSWORD

# Or in database
sudo -u postgres psql -d mailserver
UPDATE users SET password = 'NEW_HASH' WHERE username = 'COMPROMISED_USER';
```

**Step 5: Secure the Server**
```bash
# Verify Postfix configuration
postconf -n | grep -E "(smtpd_relay_restrictions|smtpd_recipient_restrictions)"

# Should include:
# smtpd_relay_restrictions = permit_mynetworks, permit_sasl_authenticated, defer_unauth_destination

# Check for unauthorized relay networks
postconf relay_networks
postconf mynetworks
```

### Long-Term Fix

**Step 1: Implement Rate Limiting**
```bash
# Edit /etc/postfix/main.cf
smtpd_client_connection_count_limit = 10
smtpd_client_connection_rate_limit = 30
smtpd_client_message_rate_limit = 50

# Apply changes
postfix reload
```

**Step 2: Enable Strict Authentication**
```bash
# Edit /etc/postfix/main.cf
smtpd_sasl_auth_enable = yes
smtpd_sasl_type = dovecot
smtpd_sasl_path = private/auth
smtpd_sasl_security_options = noanonymous, noplaintext
smtpd_sasl_tls_security_options = noanonymous

# Apply changes
postfix reload
```

**Step 3: Configure Recipient Limits**
```bash
# Edit /etc/postfix/main.cf
smtpd_recipient_limit = 100

# Apply changes
postfix reload
```

**Step 4: Enable Smtpd Restrictions**
```bash
# Edit /etc/postfix/main.cf
smtpd_helo_required = yes
smtpd_helo_restrictions = permit_mynetworks, permit_sasl_authenticated, reject_invalid_helo_hostname, reject_non_fqdn_helo_hostname
smtpd_sender_restrictions = permit_mynetworks, permit_sasl_authenticated, reject_non_fqdn_sender, reject_sender_login_mismatch

# Apply changes
postfix reload
```

**Step 5: Restart Postfix**
```bash
systemctl start postfix
```

### Verification
```bash
# Test for open relay again (from external machine)
telnet mail.ementech.co.ke 25
# Should reject relay attempts

# Monitor queue
watch -n 10 'mailq | tail -n1'

# Check for spam patterns
tail -f /var/log/mail.log | grep -E "(sasl_method|relay=)"
```

### Delisting (If Blacklisted)
1. Identify which blacklists you're on: https://mxtoolbox.com/blacklists.aspx
2. Visit each blacklist's website
3. Follow their delisting procedure
4. Wait 24-48 hours for removal
5. Verify delisting: Check from external tools

### Prevention
- Never run as open relay
- Require TLS for authentication
- Implement rate limiting
- Use fail2ban for brute force protection
- Monitor queue size and growth rate
- Regular security audits
- Strong password policy

---

## Runbook 3: Disk Space Full

### Severity: CRITICAL
### Response Time: <10 minutes

### Symptoms
- Emails bouncing with "no space left" error
- Services failing to start
- Database connection errors
- Cannot write logs
- `df -h` shows 100% usage

### Diagnosis

**Step 1: Check Disk Usage**
```bash
# Overall disk usage
df -h

# Identify large directories
du -sh /* 2>/dev/null | sort -rh | head -20

# Check mail storage
du -sh /var/mail/*

# Check database size
du -sh /var/lib/postgresql/*

# Check log sizes
du -sh /var/log/*
```

**Step 2: Find Large Files**
```bash
# Find files >100MB
find / -type f -size +100M -exec ls -lh {} \; 2>/dev/null

# Find old log files
find /var/log -name "*.gz" -mtime +30

# Check deleted files still holding space
lsof +L1
```

**Step 3: Check Inode Usage**
```bash
# Check if inodes are exhausted
df -i /

# Find directories with many files
for i in /*; do echo $i; find $i -xdev | wc -l; done | sort -k2 -rn | head -20
```

### Immediate Action

**Step 1: Emergency Cleanup**
```bash
# Clean package cache
apt clean
apt autoclean

# Remove old logs
journalctl --vacuum-time=7d
rm -f /var/log/*.gz
rm -f /var/log/*.[0-9]

# Clean temporary files
rm -rf /tmp/*
rm -rf /var/tmp/*

# Check disk space now
df -h /
```

**Step 2: Mail Queue Cleanup**
```bash
# Check queue size
du -sh /var/spool/postfix/*

# Delete all deferred messages
postsuper -d ALL deferred

# Or delete old deferred messages
find /var/spool/postfix/deferred -type f -mtime +7 -delete

# Check disk space again
df -h /
```

**Step 3: Archive Old Mail**
```bash
# Find and compress old email
find /var/mail/vhosts/ -name "*.eml" -mtime +365 -exec gzip {} \;

# Archive entire old account
tar -czf /backup/archive-$(date +%Y%m%d).tar.gz /var/mail/vhosts/old-domain/

# Remove archived mail
rm -rf /var/mail/vhosts/old-domain/
```

**Step 4: Database Cleanup**
```bash
# Vacuum database
sudo -u postgres psql -d mailserver -c "VACUUM FULL;"

# Reindex database
sudo -u postgres psql -d mailserver -c "REINDEX DATABASE mailserver;"

# Archive old data (adjust as needed)
# sudo -u postgres psql -d mailserver -c "DELETE FROM mails WHERE date < NOW() - INTERVAL '1 year';"
```

### Long-Term Solutions

**Option 1: Add Storage**
```bash
# Add new disk to system
# Partition and format
# Mount at /var/mail or /backup
# Update /etc/fstab
```

**Option 2: Implement Automated Cleanup**
```bash
# Create cleanup script at /usr/local/bin/cleanup-disk.sh
# (See Resource Monitoring Guide for full script)

# Schedule daily cleanup
crontab -e
# Add: 0 3 * * * /usr/local/bin/cleanup-disk.sh
```

**Option 3: Implement Mail Quotas**
```bash
# Edit /etc/dovecot/conf.d/90-quota.conf
quota = maildir:User quota
quota_rule = *:storage=1G
quota_rule2 = Trash:storage=100M

# Apply changes
systemctl reload dovecot
```

**Option 4: Implement Log Rotation**
```bash
# Ensure logrotate is configured
cat /etc/logrotate.conf
cat /etc/logrotate.d/*

# Test logrotate
logrotate -d /etc/logrotate.conf
```

### Verification
```bash
# Check disk space is adequate
df -h /

# Send test email
echo "Test" | mail -s "Disk test" test@example.com

# Monitor for 24 hours
watch -n 3600 'df -h /'
```

### Prevention
- Implement automated daily cleanup
- Set up disk space alerts (<10% free)
- Implement mail quotas
- Archive old mail regularly
- Monitor disk growth trends
- Plan for storage expansion

---

## Runbook 4: SSL Certificate Expiring

### Severity: High
### Response Time: <24 hours

### Symptoms
- TLS warnings when connecting
- Email clients unable to authenticate
- "Certificate expired" errors
- Security warnings in browsers

### Diagnosis

**Step 1: Check Certificate Expiration**
```bash
# Check all certificates
certbot certificates

# Check specific certificate
openssl x509 -in /etc/letsencrypt/live/mail.ementech.co.ke/cert.pem -noout -dates

# Check expiration date
openssl x509 -in /etc/letsencrypt/live/mail.ementech.co.ke/cert.pem -noout -enddate
```

**Step 2: Verify Auto-Renewal**
```bash
# Check certbot timer
systemctl status certbot.timer

# Check renewal configuration
cat /etc/letsencrypt/renewal/mail.ementech.co.ke.conf

# Test renewal (dry run)
certbot renew --dry-run
```

### Resolution

**Option 1: Manual Renewal**
```bash
# Renew certificate
certbot renew

# If successful, reload services
systemctl reload postfix
systemctl reload dovecot
systemctl reload nginx

# Verify new certificate
openssl s_client -connect mail.ementech.co.ke:993 -showcerts
```

**Option 2: Force Renewal**
```bash
# Force renewal (even if not due)
certbot renew --force-renewal

# Reload services
systemctl reload postfix dovecot nginx
```

**Option 3: Reissue Certificate**
```bash
# Reissue certificate
certbot certonly --force-renewal -d mail.ementech.co.ke -d webmail.ementech.co.ke

# If prompted, choose "nginx" or "standalone"

# Update services to use new certificate
systemctl reload postfix dovecot nginx
```

### Configuration Fix (Prevent Future Issues)

**Step 1: Verify Auto-Renewal**
```bash
# Enable certbot timer
systemctl enable certbot.timer
systemctl start certbot.timer

# Verify it's active
systemctl list-timers | grep certbot
```

**Step 2: Configure Renewal Hooks**
```bash
# Edit /etc/letsencrypt/cli.ini
# Add:
deploy-hook = systemctl reload postfix dovecot nginx
```

**Step 3: Test Auto-Renewal**
```bash
# Test renewal process
certbot renew --post-hook "systemctl reload postfix dovecot nginx"
```

**Step 4: Set Up Expiration Alerts**
```bash
# Create script /usr/local/bin/check-cert-expiry.sh
#!/bin/bash
CERT="/etc/letsencrypt/live/mail.ementech.co.ke/cert.pem"
ALERT_EMAIL="admin@ementech.co.ke"
DAYS=30

EXPIRY=$(openssl x509 -in $CERT -noout -enddate | cut -d= -f2)
EXPIRY_EPOCH=$(date -d "$EXPIRY" +%s)
NOW_EPOCH=$(date +%s)
DAYS_LEFT=$(( ($EXPIRY_EPOCH - $NOW_EPOCH) / 86400 ))

if [ $DAYS_LEFT -lt $DAYS ]; then
    echo "Certificate expires in $DAYS_LEFT days ($EXPIRY)" | \
        mail -s "SSL Certificate Expiring Soon" $ALERT_EMAIL
fi

# Schedule daily check
crontab -e
# Add: 0 8 * * * /usr/local/bin/check-cert-expiry.sh
```

### Verification
```bash
# Check certificate is valid
openssl s_client -connect mail.ementech.co.ke:587 -starttls smtp

# Test IMAPS
openssl s_client -connect mail.ementech.co.ke:993

# Send test email with TLS
echo "Test" | mail -s "TLS test" test@example.com
```

### Prevention
- Enable auto-renewal
- Set up expiration alerts (30 days before)
- Monitor certificate status weekly
- Keep certbot updated
- Document certificate locations
- Test renewal process monthly

---

## Runbook 5: Database Corruption

### Severity: CRITICAL
### Response Time: <15 minutes

### Symptoms
- Authentication failures
- Missing emails
- Application errors
- Database connection refused
- "Database is corrupted" errors

### Diagnosis

**Step 1: Check Database Status**
```bash
# Is PostgreSQL running?
systemctl status postgresql

# Can you connect?
sudo -u postgres psql -d mailserver -c "SELECT 1;"

# Check database size
sudo -u postgres psql -c "SELECT pg_database.datname, pg_size_pretty(pg_database_size(pg_database.datname)) FROM pg_database;"
```

**Step 2: Check Database Logs**
```bash
# Check PostgreSQL logs
tail -100 /var/log/postgresql/postgresql-16-main.log

# Look for errors
grep -i "error\|corruption\|fatal" /var/log/postgresql/postgresql-16-main.log | tail -20
```

**Step 3: Check for Corruption**
```bash
# Check database integrity
sudo -u postgres psql -d mailserver -c "VACUUM FULL VERBOSE;"

# Check specific tables
sudo -u postgres psql -d mailserver -c "SELECT * FROM pg_stat_database WHERE datname = 'mailserver';"
```

### Immediate Action

**Step 1: Emergency Backup**
```bash
# Backup current state (even if corrupted)
sudo -u postgres pg_dumpall > /tmp/emergency-backup-$(date +%Y%m%d-%H%M%S).sql

# Copy to remote location
scp /tmp/emergency-backup-*.sql user@backup-server:/backup/
```

**Step 2: Attempt Recovery**
```bash
# Stop PostgreSQL
systemctl stop postgresql

# Check for table corruption
# Start in single-user mode for recovery
sudo -u postgres postgres --single -D /var/lib/postgresql/16/main -c log_connections=on mailserver <<EOF
REINDEX DATABASE mailserver;
EOF

# Or use pg_resetwal (DANGEROUS - last resort)
# sudo -u postgres pg_resetwal /var/lib/postgresql/16/main/

# Start PostgreSQL
systemctl start postgresql
```

**Step 3: Verify Recovery**
```bash
# Test connection
sudo -u postgres psql -d mailserver -c "SELECT 1;"

# Check data integrity
sudo -u postgres psql -d mailserver -c "SELECT COUNT(*) FROM users;"

# Test authentication
doveadm auth test testuser testpass
```

**Step 4: Restore from Backup (If Recovery Fails)**
```bash
# Stop PostgreSQL
systemctl stop postgresql

# Drop corrupted database
sudo -u postgres psql -c "DROP DATABASE mailserver;"

# Restore from backup
sudo -u postgres psql < /backup/mailserver-backup-YYYYMMDD.sql

# Or restore specific table
sudo -u postgres psql mailserver < /backup/users-table-backup.sql

# Start PostgreSQL
systemctl start postgresql
```

### Long-Term Solution

**Step 1: Implement Regular Backups**
```bash
# Create backup script /usr/local/bin/backup-postgres.sh
#!/bin/bash
BACKUP_DIR="/backup/postgres"
DATE=$(date +%Y%m%d-%H%M%S)

mkdir -p $BACKUP_DIR
sudo -u postgres pg_dump mailserver | gzip > $BACKUP_DIR/mailserver-$DATE.sql.gz

# Keep last 7 days
find $BACKUP_DIR -name "mailserver-*.sql.gz" -mtime +7 -delete

# Schedule daily backup at 2 AM
crontab -e
# Add: 0 2 * * * /usr/local/bin/backup-postgres.sh
```

**Step 2: Implement Replication (Optional)**
```bash
# Set up hot standby server
# Configure streaming replication
# This is beyond scope of this runbook
# Refer to PostgreSQL documentation
```

**Step 3: Regular Integrity Checks**
```bash
# Schedule weekly checks
crontab -e
# Add: 0 3 * * 0 sudo -u postgres psql -d mailserver -c "VACUUM FULL ANALYZE;"
```

### Verification
```bash
# Test authentication
doveadm auth test testuser testpass

# Send test email
echo "Test" | mail -s "DB test" test@example.com

# Check logs for errors
tail -f /var/log/mail.log | grep -i "error\|warning"
```

### Prevention
- Daily automated backups
- Weekly integrity checks
- Monitor disk space (corruption often due to disk full)
- Use UPS for power protection
- Keep PostgreSQL updated
- Monitor database size growth
- Test restore procedures monthly

---

## Runbook 6: Successful Brute Force Attack

### Severity: HIGH
### Response Time: <10 minutes

### Symptoms
- Many failed authentication attempts in logs
- Account has been accessed without authorization
- Spam being sent from authenticated account
- Password no longer works
- User reports suspicious activity

### Diagnosis

**Step 1: Confirm Breach**
```bash
# Check authentication failures
grep "authentication failed" /var/log/mail.log | wc -l

# Check successful authentications from suspicious IPs
grep "sasl_method=LOGIN" /var/log/mail.log | awk '{print $6, $7}' | sort | uniq -c | sort -rn | head -20

# Check for recent successful logins from unknown IPs
grep "sasl_username=COMPROMISED_USER" /var/log/mail.log | tail -50

# Check for spam being sent
grep "sasl_username=COMPROMISED_USER" /var/log/mail.log | grep "sasl_method=LOGIN" | tail -20
```

**Step 2: Identify Scope**
```bash
# Which accounts were accessed?
grep "sasl_username=" /var/log/mail.log | awk -F= '{print $2}' | awk '{print $1}' | sort | uniq

# From which IPs?
grep "sasl_method=LOGIN" /var/log/mail.log | awk '{print $6}' | sort | uniq -c | sort -rn | head -20

# What was sent?
grep "sasl_username=COMPROMISED_USER" /var/log/mail.log | grep "sasl_method=LOGIN" | awk '{print $8}' | head -20
```

### Immediate Action

**Step 1: Lock Compromised Accounts**
```bash
# Lock user account
doveadm auth test COMPROMISED_USER ANY_PASSWORD
# If returns "auth failed", proceed

# Change password
doveadm pw -u COMPROMISED_USER -p NEW_SECURE_PASSWORD

# Or disable account
# Edit /etc/dovecot/conf.d/auth-sql.conf.ext
# Add: WHERE enabled = '1'
# Then in database: UPDATE users SET enabled = '0' WHERE username = 'COMPROMISED_USER';
```

**Step 2: Block Attacking IPs**
```bash
# Add to firewall
ufw deny from ATTACKER_IP

# Or use fail2ban
fail2ban-client set dovecot banip ATTACKER_IP
fail2ban-client set postfix-sasl banip ATTACKER_IP
```

**Step 3: Review Email Activity**
```bash
# Check sent emails
grep "sasl_username=COMPROMISED_USER" /var/log/mail.log | grep "sasl_method=LOGIN"

# Count how many were sent
grep "sasl_username=COMPROMISED_USER" /var/log/mail.log | grep "sasl_method=LOGIN" | wc -l

# Check for spam complaints
# Search online for your IP on blacklists
```

**Step 4: Notify Stakeholders**
```bash
# Send notification to user
echo "Your email account was compromised and has been secured. Please change your password immediately." | \
    mail -s "Account Security Alert" user@ementech.co.ke

# Document the incident
# Create incident report
```

**Step 5: Strengthen Security**
```bash
# Review fail2ban configuration
vi /etc/fail2ban/jail.local

# Reduce ban time for regular users (but not for attackers)
# Increase maxretry for SASL

# Restart fail2ban
systemctl restart fail2ban
```

### Long-Term Remediation

**Step 1: Implement 2FA (If Available)**
```bash
# Consider implementing application-specific passwords
# Or integrate with external authentication provider
```

**Step 2: Audit All Accounts**
```bash
# Review all email accounts
sudo -u postgres psql -d mailserver -c "SELECT username, created, last_login FROM users;"

# Identify inactive accounts
sudo -u postgres psql -d mailserver -c "SELECT username FROM users WHERE last_login < NOW() - INTERVAL '90 days';"

# Disable or remove unused accounts
```

**Step 3: Implement Password Policy**
```bash
# Configure password requirements in Dovecot
# Edit /etc/dovecot/conf.d/auth-sql.conf.ext

# Require strong passwords
# Minimum 12 characters
# Require uppercase, lowercase, numbers, special characters
# Force password change every 90 days
```

**Step 4: Enhanced Monitoring**
```bash
# Set up alerts for brute force attempts
# Create /usr/local/bin/check-brute-force.sh
#!/bin/bash
ALERT_EMAIL="admin@ementech.co.ke"
FAIL_COUNT=$(grep "$(date +%Y-%m-%d)" /var/log/mail.log | grep "authentication failed" | wc -l)

if [ $FAIL_COUNT -gt 100 ]; then
    echo "High number of authentication failures: $FAIL_COUNT" | \
        mail -s "Brute Force Attack Detected" $ALERT_EMAIL
fi

# Schedule every hour
crontab -e
# Add: 0 * * * * /usr/local/bin/check-brute-force.sh
```

**Step 5: Review and Update fail2ban**
```bash
# Configure aggressive fail2ban
vi /etc/fail2ban/jail.local

[dovecot]
enabled = true
port = smtp,ssmtp,submission,imap2,imap3,imaps,pop3,pop3s
filter = dovecot
logpath = /var/log/mail.log
maxretry = 3
findtime = 300
bantime = 86400
destemail = admin@ementech.co.ke

[postfix-sasl]
enabled = true
port = smtp,ssmtp,submission,imap2,imap3,imaps,pop3,pop3s
filter = postfix-sasl
logpath = /var/log/mail.log
maxretry = 3
findtime = 300
bantime = 86400
destemail = admin@ementech.co.ke

systemctl restart fail2ban
```

### Verification
```bash
# Test authentication fails for blocked IP
# From blocked IP:
telnet mail.ementech.co.ke 25
# Should be refused

# Test authentication works for legitimate user
doveadm auth test legitimate_user correct_password

# Monitor for continued attacks
tail -f /var/log/mail.log | grep "authentication failed"
```

### Prevention
- Strong password policy (12+ characters, complexity)
- Enable fail2ban with aggressive settings
- Implement rate limiting
- Regular security audits
- User education on phishing
- Monitor for brute force patterns
- Consider 2FA implementation
- Regular password changes (every 90 days)

---

## Incident Response Flowchart

```
Incident Detected
    |
    v
Is system critical? (Email down, security breach, etc.)
    |
    +-- YES --> Execute emergency runbook immediately
    |             |
    |             v
    |          Issue resolved?
    |             |
    |             +-- NO --> Escalate to senior admin
    |             |
    |             +-- YES --> Document incident
    |
    +-- NO --> Can it wait until business hours?
                 |
                 +-- YES --> Schedule for maintenance window
                 |
                 +-- NO --> Execute runbook during off-peak
                              |
                              v
                          Document incident
                              |
                              v
                          Update procedures to prevent recurrence
                              |
                              v
                          Share lessons learned with team
```

---

## Incident Report Template

**Incident Report #:** _______
**Date:** __________________
**Time:** __________________
**Reporter:** __________________
**Severity:** ☐ Low ☐ Medium ☐ High ☐ Critical

**Description:** _________________________________________________

**Impact:**
- Users affected: _____
- Duration: _____
- Data loss: ☐ Yes ☐ No
- Services affected: _________________________

**Root Cause:** _________________________________________________

**Resolution:** _________________________________________________

**Prevention Actions:**
1. _________________________________
2. _________________________________
3. _________________________________

**Follow-Up Required:** ☐ Yes ☐ No
**If Yes, What:** _________________________________

**Approved By:** __________________
**Date:** __________________

---

## On-Call Procedures

**When On-Call:**
1. Carry phone 24/7
2. Respond to alerts within 15 minutes
3. Document all incidents
4. Escalate if overwhelmed
5. Hand off properly to next on-call

**Alert Priorities:**
- P1 (Critical): Respond immediately (<15 min)
- P2 (High): Respond within 1 hour
- P3 (Medium): Respond within 4 hours
- P4 (Low): Respond within 24 hours

**Escalation Path:**
1. Primary on-call
2. Secondary on-call (if no response in 30 min)
3. Engineering manager (if no response in 1 hour)
4. CTO (if critical and no response in 2 hours)

**Handoff Procedure:**
1. Review open incidents
2. Review system status
3. Review outstanding alerts
4. Document in shift log
5. Notify incoming on-call
