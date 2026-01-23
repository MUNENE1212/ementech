# Ementech Email Server - Quick Start Guide

## Overview

This package contains a complete, production-ready email server setup for ementech.co.ke domain using Postfix, Dovecot, Roundcube, rspamd, and OpenDKIM.

**System Requirements:**
- Ubuntu 24.04 LTS (tested on kernel 6.8.0-53)
- 2GB RAM minimum (1.2GB available required)
- 10GB free disk space
- Root SSH access

**Software Stack:**
- **SMTP:** Postfix with SASL authentication
- **IMAP/POP3:** Dovecot with virtual users
- **Webmail:** Roundcube with PHP/SQLite
- **Spam Filtering:** rspamd (lightweight) + SpamAssassin
- **DKIM Signing:** OpenDKIM
- **Database:** PostgreSQL for virtual user management
- **SSL/TLS:** Let's Encrypt certificates
- **Security:** Fail2ban for brute-force protection

## Files Included

### Installation & Configuration
- `install.sh` - **Main automated installation script** (RUN THIS FIRST)
- `setup-guide.md` - Complete step-by-step setup guide (manual installation)
- `README.md` - This file

### Management Scripts
- `add-user.sh` - Add new email accounts
- `remove-user.sh` - Remove email accounts
- `change-password.sh` - Change email passwords
- `check-mail-queue.sh` - Check mail queue status
- `test-email.sh` - Send test emails
- `diagnose.sh` - Full server diagnostic check

## Quick Start (Automated Installation)

### Step 1: Upload Files to Server

```bash
# From your local machine, upload the email-server-setup directory
scp -r email-server-setup/ root@69.164.244.165:/root/
```

### Step 2: SSH into Server

```bash
ssh root@69.164.244.165
cd /root/email-server-setup
```

### Step 3: Run Installation

```bash
# Make scripts executable
chmod +x *.sh

# Run automated installation (takes 15-20 minutes)
./install.sh
```

**The script will:**
1. Update system packages
2. Install PostgreSQL database
3. Install and configure Postfix (SMTP)
4. Install and configure Dovecot (IMAP/POP3)
5. Generate SSL certificates with Let's Encrypt
6. Configure DKIM signing
7. Set up rspamd for spam filtering
8. Install Roundcube webmail
9. Configure firewall rules
10. Set up Fail2ban protection
11. Create 5 email accounts with strong passwords
12. Create backup script
13. Test all services

### Step 4: Add DNS Records

After installation completes, add these DNS records to your domain registrar:

```
# MX Records
ementech.co.ke.          IN MX 10 mail.ementech.co.ke.
mail.ementech.co.ke.     IN A 69.164.244.165

# A Records
mail.ementech.co.ke.     IN A 69.164.244.165
smtp.ementech.co.ke.     IN A 69.164.244.165
imap.ementech.co.ke.     IN A 69.164.244.165

# SPF Record
ementech.co.ke.          IN TXT "v=spf1 mx a ip4:69.164.244.165 ~all"

# DKIM Record (check /root/.dkim-dns-record.txt for exact value)
# Example: default._domainkey.ementech.co.ke IN TXT "v=DKIM1; k=rsa; p=..."

# DMARC Record
_dmarc.ementech.co.ke.   IN TXT "v=DMARC1; p=quarantine; rua=mailto:admin@ementech.co.ke; ruf=mailto:admin@ementech.co.ke; sp=none; aspf=s; adkim=s"
```

**Get DKIM record:**
```bash
cat /root/.dkim-dns-record.txt
```

**Get all DNS records:**
```bash
cat /root/dns-records.txt
```

### Step 5: Wait for DNS Propagation

DNS records can take 1-24 hours to propagate. Verify with:

```bash
# Check MX record
dig +short MX ementech.co.ke

# Check SPF record
dig +short TXT ementech.co.ke

# Check DKIM record
dig +short TXT default._domainkey.ementech.co.ke

# Check DMARC record
dig +short TXT _dmarc.ementech.co.ke
```

### Step 6: Test Email Server

```bash
# Run diagnostic check
./diagnose.sh

# Send test email to external address
./test-email.sh your-email@gmail.com

# Check mail queue
./check-mail-queue.sh

# View logs
tail -f /var/log/mail.log
```

### Step 7: Access Webmail

Open browser: **https://mail.ementech.co.ke**

Login credentials are saved in `/root/.email-credentials.txt`

```bash
cat /root/.email-credentials.txt
```

## Email Account Management

### Add New User

```bash
./add-user.sh john@ementech.co.ke

# Or specify password:
./add-user.sh john@ementech.co.ke "MySecurePassword123!"
```

### Remove User

```bash
./remove-user.sh john@ementech.co.ke
```

### Change Password

```bash
./change-password.sh john@ementech.co.ke

# Or specify new password:
./change-password.sh john@ementech.co.ke "NewPassword456!"
```

### List All Users

```bash
sudo -u postgres psql mailserver_db -c "SELECT email, active FROM users;"
```

## Server Monitoring

### Check Server Status

```bash
# Full diagnostic
./diagnose.sh

# Service status
systemctl status postfix dovecot opendkim rspamd

# Check ports
ss -tlnp | grep -E ':25|:587|:993'

# Check mail queue
mailq

# Check recent errors
tail -50 /var/log/mail.log | grep -i error
```

### Monitor Logs

```bash
# Postfix (SMTP)
tail -f /var/log/mail.log

# Dovecot (IMAP/POP3)
tail -f /var/log/dovecot.log

# Nginx (Webmail)
tail -f /var/log/nginx/mail.ementech.co.ke-error.log

# rspamd (Spam filter)
tail -f /var/log/rspamd/rspamd.log

# All mail-related logs
tail -f /var/log/mail.log /var/log/dovecot.log
```

### Check Mail Queue

```bash
# View queue
mailq

# Check queue status
./check-mail-queue.sh

# Flush queue (send immediately)
postfix flush

# Remove all deferred messages
postsuper -D deferred

# Remove specific message
postsuper -d MESSAGE_ID
```

## Email Client Configuration

Users can configure email clients (Outlook, Thunderbird, mobile) with:

### IMAP (Recommended)
- **Server:** mail.ementech.co.ke
- **Port:** 993 (SSL/TLS)
- **Username:** Full email address (e.g., ceo@ementech.co.ke)
- **Password:** Your email password
- **Authentication:** Normal password
- **Connection Security:** SSL/TLS

### SMTP (Sending)
- **Server:** mail.ementech.co.ke
- **Port:** 587 (STARTTLS) or 465 (SSL/TLS)
- **Username:** Full email address
- **Password:** Your email password
- **Authentication:** Normal password
- **Connection Security:** SSL/TLS

### POP3 (Alternative)
- **Server:** mail.ementech.co.ke
- **Port:** 995 (SSL/TLS)
- **Username:** Full email address
- **Password:** Your email password
- **Authentication:** Normal password
- **Connection Security:** SSL/TLS

## Testing Email Deliverability

### Test to Major Providers

```bash
# Send test to Gmail
./test-email.sh your-gmail@gmail.com

# Send test to Outlook
./test-email.sh your-outlook@outlook.com

# Send test to Yahoo
./test-email.sh your-yahoo@yahoo.com
```

### Check Email Headers

When you receive test emails, check for:
- `Authentication-Results:` - SPF/DKIM results
- `DKIM-Signature:` - DKIM signature present
- `Received-SPF:` - SPF pass/fail
- `X-Spam-Status:` - Spam score

### Use Online Testing Tools

- **Mail Tester:** https://www.mail-tester.com/ (send email to their address)
- **MXToolbox:** https://mxtoolbox.com/ (check blacklists, DNS)
- **DMARC Analyzer:** https://www.dmarcanalyzer.com/

## Troubleshooting

### Emails Not Sending

1. **Check DNS records:**
   ```bash
   dig +short MX ementech.co.ke
   dig +short TXT ementech.co.ke  # SPF
   dig +short TXT default._domainkey.ementech.co.ke  # DKIM
   ```

2. **Check mail logs:**
   ```bash
   tail -50 /var/log/mail.log
   ```

3. **Test Postfix:**
   ```bash
   postfix check
   ```

4. **Check if port 25 is open:**
   ```bash
   ss -tlnp | grep :25
   ```

### Authentication Failures

1. **Check Dovecot logs:**
   ```bash
   tail -50 /var/log/dovecot.log
   ```

2. **Test authentication:**
   ```bash
   doveadm auth test admin@ementech.co.ke
   ```

3. **Verify user in database:**
   ```bash
   sudo -u postgres psql mailserver_db -c "SELECT email FROM users WHERE email='admin@ementech.co.ke';"
   ```

### High Memory Usage

With 2GB RAM, you may experience memory pressure. Solutions:

1. **Check memory usage:**
   ```bash
   free -h
   ps aux --sort=-%mem | head -10
   ```

2. **Reduce Postfix processes:**
   ```bash
   postconf -e default_process_limit=5
   systemctl reload postfix
   ```

3. **Skip ClamAV if needed** (resource intensive):
   ```bash
   systemctl stop clamav-daemon
   systemctl disable clamav-daemon
   ```

### SSL Certificate Issues

1. **Check certificate expiry:**
   ```bash
   certbot certificates
   ```

2. **Renew manually:**
   ```bash
   certbot renew --force-renewal
   systemctl reload postfix dovecot nginx
   ```

3. **Check auto-renewal:**
   ```bash
   certbot renew --dry-run
   ```

### Spam Folder Issues

1. **Check spam score:**
   ```bash
   grep "score=" /var/log/mail.log | tail -20
   ```

2. **Adjust spam threshold:**
   Edit `/etc/rspamd/local.d/actions.conf`
   ```
   reject = 20;  # Increase to be less strict
   ```

3. **Check rspamd:**
   ```bash
   rspamc stat
   ```

## Security Best Practices

### 1. Keep Software Updated

```bash
# Update weekly
apt update && apt upgrade -y
```

### 2. Monitor Logs Daily

```bash
# Check for suspicious activity
tail -100 /var/log/mail.log | grep -i "error\|warning\|fatal"

# Check authentication failures
grep "authentication failure" /var/log/dovecot.log | tail -20
```

### 3. Check Fail2Ban

```bash
# Check banned IPs
fail2ban-client status postfix

# Unban an IP
fail2ban-client set postfix unbanip IP_ADDRESS
```

### 4. Regular Backups

Backups run automatically daily at 2 AM. Verify:

```bash
# Check backup directory
ls -lh /backup/mail/

# Manual backup
/usr/local/bin/backup-mail.sh

# Test restore (to different location)
tar xzf /backup/mail/mail-config-YYYYMMDD_HHMMSS.tar.gz -C /tmp/test-restore
```

### 5. Change Passwords Regularly

```bash
# For email accounts
./change-password.sh user@ementech.co.ke

# For database (advanced)
sudo -u postgres psql -c "ALTER USER mailserver WITH PASSWORD 'new_strong_password';"
# Then update /etc/postfix/pgsql-*.cf and /etc/dovecot/dovecot-sql.conf.ext
```

## Maintenance Schedule

### Daily
- [ ] Check mail queue: `mailq`
- [ ] Check logs for errors: `tail -50 /var/log/mail.log`
- [ ] Monitor disk space: `df -h`
- [ ] Check memory: `free -h`

### Weekly
- [ ] Review spam filter effectiveness
- [ ] Check for bounced emails
- [ ] Verify backup completion
- [ ] Review system logs

### Monthly
- [ ] Test email sending to major providers
- [ ] Update system packages
- [ ] Review and clean spam folders
- [ ] Check SSL certificate expiry
- [ ] Test restoration from backup

### Quarterly
- [ ] Review and update spam filter rules
- [ ] Audit email accounts
- [ ] Check IP reputation at https://mxtoolbox.com
- [ ] Review security settings
- [ ] Performance tuning

## IP Warm-up Process

**Important:** New email servers often have poor IP reputation. Follow this warm-up schedule:

### Week 1
- Send **20-50 emails per day**
- Focus on engaged users who will open emails
- Monitor bounce rates closely

### Week 2
- Send **50-100 emails per day**
- Increase volume gradually

### Week 3
- Send **100-200 emails per day**
- Continue monitoring

### Week 4
- Send **200-500 emails per day**
- Normal operations

**Tips:**
- Start with personal emails to known contacts
- Avoid bulk mailing initially
- Ask users to add you to their contacts
- Monitor spam reports carefully
- Use double opt-in for newsletters

## Advanced Configuration

### Add Email Alias

```bash
# Create alias: sales@ementech.co.ke -> info@ementech.co.ke
sudo -u postgres psql mailserver_db <<EOF
INSERT INTO aliases (domain_id, source, destination)
SELECT 1, 'sales@ementech.co.ke', 'info@ementech.co.ke';
EOF
```

### Set Email Quota

```bash
# Set 5GB quota for user
sudo -u postgres psql mailserver_db <<EOF
UPDATE users SET quota = 5368709120 WHERE email = 'user@ementech.co.ke';
EOF
```

### View User Statistics

```bash
# Check mailbox size
du -sh /var/mail/vhosts/ementech.co.ke/user

# Check all mailboxes
du -sh /var/mail/vhosts/ementech.co.ke/*

# Database stats
sudo -u postgres psql mailserver_db <<EOF
SELECT
    email,
    pg_size_pretty(quota) as quota,
    active,
    created_at
FROM users;
EOF
```

## Emergency Procedures

### Server Compromised

1. **Disconnect from network**
2. **Change all email passwords**
3. **Review logs for intrusion**
4. **Restore from clean backup**
5. **Reinstall OS if necessary**
6. **Rotate DKIM keys**
7. **Review DNS records**

### Mail Queue Stuck

```bash
# Requeue all
postsuper -r ALL

# Force flush
postqueue -f

# Delete all deferred
postsuper -D deferred

# Delete specific message
postsuper -d MESSAGE_ID
```

### High Load

```bash
# Check processes
top

# Check connections
ss -s

# Reduce load
postconf -e default_process_limit=3
systemctl reload postfix
```

## Support and Resources

### Internal Files
- `/root/.email-credentials.txt` - Email account passwords
- `/root/.mail-db-credentials.txt` - Database credentials
- `/root/dns-records.txt` - All DNS records
- `/root/.dkim-dns-record.txt` - DKIM DNS record
- `/var/log/mail.log` - Main mail log
- `/var/log/dovecot.log` - IMAP/POP3 log

### Online Resources
- **Postfix Docs:** http://www.postfix.org/documentation.html
- **Dovecot Docs:** https://wiki.dovecot.org/
- **Roundcube Docs:** https://roundcube.net/documentation/
- **rspamd Docs:** https://rspamd.com/doc/

### Testing Tools
- **Mail Tester:** https://www.mail-tester.com/
- **MXToolbox:** https://mxtoolbox.com/
- **SSL Labs:** https://www.ssllabs.com/ssltest/
- **DNS Checker:** https://www.whatsmydns.net/

## Important Warnings

### Security Risks
- Email servers are prime targets for attackers
- Keep all software updated
- Use strong, unique passwords (min 16 chars)
- Monitor logs daily
- Enable fail2ban

### Deliverability Challenges
- New servers are often flagged as spam
- Warming up takes 2-4 weeks
- Monitor IP reputation
- Start with low sending volumes
- Ask users to whitelist your domain

### Resource Constraints
- 2GB RAM is minimal
- Monitor memory usage closely
- Consider disabling ClamAV if needed
- Optimize PostgreSQL settings
- Use rspamd instead of SpamAssassin

### Maintenance Burden
- Email servers require constant attention
- Check spam filters regularly
- Review bounce logs
- Update DNS records if IP changes
- Test backups monthly

## Quick Reference

### Essential Commands

```bash
# Diagnostics
./diagnose.sh                              # Full system check
./check-mail-queue.sh                      # Check mail queue

# User Management
./add-user.sh user@ementech.co.ke          # Add user
./remove-user.sh user@ementech.co.ke       # Remove user
./change-password.sh user@ementech.co.ke   # Change password

# Testing
./test-email.sh recipient@example.com      # Send test email
mailq                                      # View queue
tail -f /var/log/mail.log                  # Watch logs

# Service Management
systemctl status postfix dovecot           # Check services
systemctl restart postfix                  # Restart service
postfix reload                             # Reload config
```

### Important Paths

| Component | Path |
|-----------|------|
| Postfix config | /etc/postfix/ |
| Dovecot config | /etc/dovecot/ |
| DKIM keys | /etc/opendkim/ |
| Webmail | /var/lib/roundcube/ |
| Mail storage | /var/mail/vhosts/ |
| SSL certs | /etc/letsencrypt/live/mail.ementech.co.ke/ |
| Logs | /var/log/mail.log, /var/log/dovecot.log |

### Default Email Accounts

After installation, these accounts are created:

1. **ceo@ementech.co.ke** - CEO/Leadership
2. **info@ementech.co.ke** - General inquiries
3. **support@ementech.co.ke** - Customer support
4. **admin@ementech.co.ke** - System administration
5. **tech@ementech.co.ke** - Technical team

Plus aliases:
- **postmaster@** → admin@
- **abuse@** → admin@
- **webmaster@** → tech@

Passwords are saved in `/root/.email-credentials.txt`

---

## Installation Verification Checklist

After installation, verify:

- [ ] All services running: `systemctl status postfix dovecot opendkim rspamd`
- [ ] Ports listening: `ss -tlnp | grep -E ':25|:587|:993'`
- [ ] SSL certificate valid: `certbot certificates`
- [ ] DNS records added (MX, SPF, DKIM, DMARC)
- [ ] Email accounts created in database
- [ ] Webmail accessible at https://mail.ementech.co.ke
- [ ] Test email sent successfully
- [ ] Backups configured: `ls /backup/mail/`
- [ ] Fail2ban active: `systemctl status fail2ban`

**Last Updated:** 2025-01-19
**Version:** 1.0

For questions or issues, check logs or run `./diagnose.sh`
