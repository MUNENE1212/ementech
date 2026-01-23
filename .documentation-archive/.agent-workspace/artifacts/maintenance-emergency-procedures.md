EmenTech Email Server - Maintenance & Emergency Procedures
==========================================================

Purpose: Daily, weekly, and monthly maintenance procedures plus emergency response
Date: 2025-01-19
Server: ementech-mail.ementech.co.ke (69.164.244.165)

TABLE OF CONTENTS
=================
1. Daily Maintenance Checklist
2. Weekly Maintenance Checklist
3. Monthly Maintenance Checklist
4. Quarterly Maintenance Checklist
5. Emergency Procedures
6. Troubleshooting Guide
7. Backup & Restore Procedures
8. Monitoring & Alerts
9. Security Maintenance
10. Performance Tuning

1. DAILY MAINTENANCE CHECKLIST
==============================

Time Required: 5-10 minutes
Best Time: Morning (9 AM local time)

Automated Tasks (run via cron):
- [ ] Backup runs at 2 AM (verify in morning)
- [ ] Disk space check runs every hour
- [ ] Service check runs every 5 minutes
- [ ] Mail queue check runs every 15 minutes

Manual Tasks:

Check Server Status
-------------------
```bash
# Run status dashboard
/root/mail-server-status.sh

# Expected output:
# - All services: Running
# - Memory: < 1.5GB
# - Disk: < 80%
# - Mail queue: empty or < 100 messages
```

Check Mail Queue
----------------
```bash
# Check queue
mailq

# Or with details
sudo postqueue -p

# Expected: Mail queue is empty (0 messages)
# If > 100 messages, investigate
```

Check Logs for Errors
---------------------
```bash
# Check recent mail errors
sudo tail -100 /var/log/mail.log | grep -i error

# Check Dovecot errors
sudo tail -100 /var/log/dovecot.log | grep -i error

# Check Rspamd errors
sudo tail -100 /var/log/rspamd/rspamd.log | grep -i error

# Expected: No errors in last 24 hours
```

Check Backup Success
--------------------
```bash
# Verify backup exists
ls -lh /backup/mail-server/mail-server-$(date +%Y%m%d)*.tar.gz

# Expected: Backup file exists and is > 100MB
```

Review Spam Filter Performance
-------------------------------
```bash
# Check Rspamd statistics
sudo rspamc stat

# Or view web UI: https://mail.ementech.co.ke:11334
# Login with password from /etc/rspamd/local.d/worker-controller.inc

# Expected:
# - Spam messages: Being detected
# - Ham messages: Not being marked as spam
# - Action scores: Appropriate
```

Daily Maintenance Log Template
-------------------------------
```markdown
Date: YYYY-MM-DD
Administrator: [Name]

Server Status: [OK/WARNING/CRITICAL]
Services: [All running / List issues]
Mail Queue: [Empty / Count]
Disk Usage: [XX%]
Memory Usage: [XX%]

Issues Found:
- [None / Describe issues]

Actions Taken:
- [None / Describe actions]

Pending Tasks:
- [None / List tasks]

Notes:
[Any additional notes]
```

2. WEEKLY MAINTENANCE CHECKLIST
===============================

Time Required: 30-45 minutes
Best Time: Sunday morning

Monday-Friday: Daily tasks (above)
Saturday: No maintenance (unless emergency)
Sunday: Weekly maintenance (below)

Review Mail Queue
-----------------
```bash
# Check for stuck messages
sudo postqueue -p | grep "^[A-F0-9]"

# If queue > 100 messages, investigate:
# Check: Why are messages stuck?
# Check: Are recipients valid?
# Check: Is network connection ok?
```

Review System Logs
------------------
```bash
# Check authentication failures
sudo tail -1000 /var/log/auth.log | grep "Failed password"

# Check Fail2ban bans
sudo fail2ban-client status
sudo fail2ban-client status postfix-sasl
sudo fail2ban-client status dovecot

# Expected: Some bans (normal), but not excessive
# If > 50 bans/week, consider investigating
```

Review Disk Space Trends
------------------------
```bash
# Check current usage
df -h /var/mail

# Check growth over past week
du -sh /var/mail/vhosts/* | sort -hr

# Expected: Growth < 1GB per week
# If > 2GB/week, investigate large mailboxes
```

Review Email Deliverability
----------------------------
```bash
# Send test email to mail-tester.com
# Get score at: https://www.mail-tester.com/

# Expected: Score 8/10 or higher
# If < 8/10, investigate SPF/DKIM/DMARC issues

# Check DNS records
dig +short MX ementech.co.ke
dig +short TXT ementech.co.ke
dig +short TXT _dmarc.ementech.co.ke
```

Review Spam Filter Effectiveness
---------------------------------
```bash
# Access Rspamd web UI
# https://mail.ementech.co.ke:11334

# Review:
# - False positives (legitimate email marked as spam)
# - False negatives (spam not caught)
# - Adjust spam score thresholds if needed

# Check spam folders in webmail
# Login to each account, check Spam folder
# Move false positives to Inbox
# This trains the spam filter
```

Clean Up Temporary Files
-------------------------
```bash
# Clean old logs
sudo journalctl --vacuum-time=30d

# Clean temp files
sudo rm -rf /tmp/*
sudo rm -rf /var/tmp/*

# Clean Postfix deferred queue (if > 7 days old)
sudo postsuper -d ALL deferred
```

Test Backup Restore
-------------------
```bash
# Note: Don't restore to production!
# Test on non-production system or:
# Copy backup to temp location first

sudo cp /backup/mail-server/mail-server-YYYYMMDD.tar.gz /tmp/
cd /tmp
tar -xzf mail-server-YYYYMMDD.tar.gz
# Verify contents are complete
rm -rf /tmp/*

# Expected: Backup extracts without errors, contains all files
```

Weekly Maintenance Log Template
--------------------------------
```markdown
Week: YYYY-MM-DD to YYYY-MM-DD
Administrator: [Name]

Mail Queue Analysis:
- Average queue size: [Number]
- Stuck messages: [Number/None]
- Actions taken: [None/Describe]

Security Review:
- Failed login attempts: [Number]
- Fail2ban bans: [Number]
- IP addresses banned: [List if many]

Deliverability:
- Mail-tester score: [X/10]
- SPF status: [Pass/Fail]
- DKIM status: [Pass/Fail]
- DMARC status: [Pass/Fail]

Spam Filter:
- False positives: [Number]
- False negatives: [Number]
- Adjustments made: [None/Describe]

Disk Usage:
- Current: [XX%]
- Growth this week: [XX GB]
- Projection: [OK/Concern]

Backup Status:
- Backup successful: [Yes/No]
- Restore tested: [Yes/No]
- Backup size: [XX GB]

Issues Found:
[None or describe]

Actions Taken:
[None or describe]

Next Week's Tasks:
[List tasks]
```

3. MONTHLY MAINTENANCE CHECKLIST
================================

Time Required: 1-2 hours
Best Time: 1st of month

Week 1-4: Daily and weekly tasks (above)
End of month: Monthly maintenance (below)

Review and Update Documentation
--------------------------------
```bash
# Check if documentation is current
cat /root/mail-server-documentation.md

# Update if:
# - Configuration changed
# - New procedures added
# - Contact information changed
# - Software versions updated
```

Check SSL Certificate Expiry
-----------------------------
```bash
# Check all certificates
sudo certbot certificates

# Expected: All certificates valid for > 30 days
# If expiring soon, renew:
sudo certbot renew --force-renewal
```

Review and Update System Packages
----------------------------------
```bash
# Check for updates
sudo apt-get update

# List available updates
apt list --upgradable

# Review security updates
sudo unattended-upgrade --dry-run -d

# Install updates (after testing on non-production!)
sudo apt-get upgrade -y

# Reboot if kernel updated
sudo reboot
```

Review Email Account Usage
---------------------------
```bash
# Check mailbox sizes
sudo du -sh /var/mail/vhosts/*/* | sort -hr

# List accounts by size
sudo du -sh /var/mail/vhosts/ementech.co.ke/* | sort -hr

# Check quota usage in database
sudo -u postgres psql mailserver_db -c "SELECT email, quota/1024/1024/1024 as quota_gb FROM users;"

# Expected: All accounts < 90% of quota
# If > 90%, notify user to clean up
```

Clean Spam Folders
-------------------
```bash
# Option 1: Via webmail (GUI)
# Login to each account, empty Spam folder

# Option 2: Via command line (CAUTION!)
# This permanently deletes spam!
# Only do this if users don't need spam

# Find spam in Dovecot format
find /var/mail/vhosts -type d -name ".Junk" -o -name ".Spam"

# DO NOT delete without user approval!
# Instead, send reminder to users to clean spam
```

Review Performance Metrics
---------------------------
```bash
# Check average load
uptime | awk -F'load average:' '{print $2}'

# Check memory usage trend
free -h | grep Mem

# Check disk I/O
iostat -x 1 5

# Check network I/O
iftop  # (if installed)

# Expected:
# - Load average: < 2.0
# - Memory: < 80%
# - Disk: < 80%
# - No I/O bottlenecks
```

Test Disaster Recovery
-----------------------
```bash
# Full disaster recovery test (simulate server failure)
# DO NOT do this on production server!
# Use test/staging environment

# Steps:
# 1. Spin up test VPS
# 2. Install Ubuntu 24.04
# 3. Restore from backup
# 4. Test all services
# 5. Verify email functionality
# 6. Document any issues

# Time required: 2-4 hours
# Frequency: Quarterly or after major changes
```

Review Security Logs
--------------------
```bash
# Check for intrusion attempts
sudo tail -5000 /var/log/auth.log | grep -i "failed\|invalid"

# Check for brute force attacks
sudo grep "Failed password" /var/log/auth.log | awk '{print $11}' | sort | uniq -c | sort -nr | head -10

# Check Fail2ban effectiveness
sudo fail2ban-client status | grep "Jail list"
sudo fail2ban-client status postfix-sasl
sudo fail2ban-client status dovecot

# Expected:
# - Some failed logins (normal)
# - Top attackers are banned by Fail2ban
# - No successful unauthorized logins
```

Review Spam Statistics
-----------------------
```bash
# Access Rspamd web UI
# https://mail.ementech.co.ke:11334

# Review monthly statistics:
# - Total messages processed
# - Spam percentage
# - Ham percentage
# - False positive rate
# - False negative rate

# Generate report
sudo rspamc stat > /tmp/spam-stats-$(date +%Y%m).txt
```

Monthly Maintenance Log Template
---------------------------------
```markdown
Month: YYYY-MM
Administrator: [Name]

System Updates:
- Packages updated: [Yes/No]
- Kernel updated: [Yes/No]
- Server rebooted: [Yes/No]
- Security updates: [Count]

SSL Certificates:
- Expiry check: [All OK / List certificates expiring]
- Renewals performed: [None/Describe]

Email Accounts:
- Total accounts: [5]
- Accounts over quota: [Number/None]
- Large mailboxes: [List if > 1GB]

Disk Usage:
- Start of month: [XX%]
- End of month: [XX%]
- Growth: [XX GB]
- Projection for next month: [OK/Concern]

Performance:
- Average load: [X.XX]
- Memory usage: [XX%]
- Disk I/O: [OK/Slow]
- Network I/O: [OK/Slow]

Security:
- Failed logins: [Number]
- Attack attempts: [Number]
- Fail2ban bans: [Number]
- Security incidents: [None/Describe]

Spam Filter:
- Messages processed: [Number]
- Spam percentage: [XX%]
- False positives: [Number]
- False negatives: [Number]
- Adjustments made: [None/Describe]

Backups:
- Backups successful: [XX/XX]
- Backup size: [XX GB]
- Restore tested: [Yes/No]
- Off-site backup: [Yes/No]

Disaster Recovery:
- DR test performed: [Yes/No]
- DR test results: [Pass/Fail]
- Issues found: [None/Describe]

Documentation:
- Documentation updated: [Yes/No]
- Changes made: [None/Describe]

Issues Found:
[None or describe in detail]

Actions Taken:
[Describe all actions taken]

Recommendations:
[None or list recommendations]

Next Month's Tasks:
[List tasks]
```

4. QUARTERLY MAINTENANCE CHECKLIST
==================================

Time Required: 3-4 hours
Best Time: Start of quarter (Jan, Apr, Jul, Oct)

Monthly 1-3: Daily, weekly, monthly tasks
End of quarter: Quarterly maintenance (below)

Full Security Audit
-------------------
```bash
# Run comprehensive security scan

# 1. Check for open ports
nmap -sV mail.ementech.co.ke

# 2. Check SSL configuration
curl https://www.ssllabs.com/ssltest/analyze.html?d=mail.ementech.co.ke

# 3. Check for email vulnerabilities
curl https://mxtoolbox.com/diagnostic.aspx

# 4. Check if IP is blacklisted
curl https://mxtoolbox.com/blacklists.aspx

# 5. Run rootkit check
sudo rkhunter --check --sk

# Expected:
# - Only necessary ports open (25, 587, 465, 993, 995, 443)
# - SSL Labs grade: A or higher
# - No email vulnerabilities
# - Not on any blacklists
# - No rootkits detected
```

Performance Optimization Review
--------------------------------
```bash
# Review and optimize configurations

# Check Postfix performance
sudo postconf -n | grep -E "size|limit|process"
sudo postsuper -s | head -20

# Check Dovecot performance
sudo doveadm -n | grep -E "process_limit|client_limit"
sudo doveadm kick

# Check database performance
sudo -u postgres psql -c "SELECT * FROM pg_stat_activity;"

# Optimize if needed:
# - Adjust Postfix queue limits
# - Adjust Dovecot connection limits
# - Optimize PostgreSQL queries
# - Add indexes to database
```

Capacity Planning
-----------------
```bash
# Review trends and plan for future growth

# Disk usage trend
df -h /var/mail
# Calculate: Growth per month × 6 months = Future need

# Memory usage trend
free -h
# Plan for: Add RAM if consistently > 80%

# Email volume growth
sudo tail -10000 /var/log/mail.log | grep -c "postfix/qmgr"
# Plan for: Upgrade hardware if volume doubles

# User growth
# Current: 5 users
# Plan for: Add more users if business grows

# Recommendations:
# - Add disk space before reaching 80%
# - Add RAM before reaching 80%
# - Consider high availability if critical
```

Review and Update Security Policies
------------------------------------
```bash
# Review all security settings

# Firewall rules
sudo ufw status numbered
# Question: Are all rules still needed?

# Fail2ban configuration
sudo fail2ban-client status
# Question: Are ban times appropriate?

# Password policy
# Question: Should passwords be rotated?
# Question: Should complexity be increased?

# Access control
# Question: Who has SSH access?
# Question: Who has database access?

# Update policies if needed
```

Business Continuity Planning
-----------------------------
```bash
# Review and update BCP

# Disaster recovery procedures
# - Are they current?
# - Were they tested?
# - Did they work?

# Contact information
# - Is it current?
# - Are emergency contacts correct?

# Escalation procedures
# - Are they clear?
# - Do staff understand them?

# Service level agreements
# - Are they being met?
# - Do they need updating?

# Update BCP documentation
```

Software Version Review
------------------------
```bash
# Check current versions
postconf mail_version
dovecot --version
rspamd --version
psql --version
nginx -v

# Check for new versions
# Visit:
# - http://www.postfix.org/
# - https://wiki.dovecot.org/
# - https://rspamd.com/
# - https://www.postgresql.org/

# Plan upgrades:
# - Review release notes
# - Test in staging
# - Schedule downtime window
# - Create backup before upgrade
# - Document procedures
```

Vendor and Contract Review
---------------------------
```bash
# Review all vendors and contracts

# VPS Provider
# - Review pricing and features
# - Check if better plans available
# - Review support SLA

# Domain Registrar
# - Verify domain is locked
# - Verify whois privacy enabled
# - Check expiry date

# Backup Storage (if off-site)
# - Review pricing
# - Check retention policy
# - Verify restore works

# Monitoring Service (if using)
# - Review alerts
# - Check if features adequate
# - Review pricing

# Renew/terminate contracts as needed
```

Quarterly Maintenance Log Template
-----------------------------------
```markdown
Quarter: YYYY-QX
Administrator: [Name]

Security Audit:
- SSL Labs grade: [A/A+/B/C]
- Open ports: [List]
- Vulnerabilities: [None/Describe]
- Blacklist status: [Clean/List blacklists]
- Rootkit check: [Clean/Infected]
- Overall security: [Good/Fair/Poor]

Performance Review:
- Postfix optimization: [None/Describe]
- Dovecot optimization: [None/Describe]
- Database optimization: [None/Describe]
- Overall performance: [Good/Fair/Poor]

Capacity Planning:
- Disk usage trend: [XX GB/month]
- Memory usage trend: [XX%]
- Email volume trend: [Increase/Decrease/Stable]
- Current capacity: [Adequate/Limited]
- Recommendations: [None/Describe]

Security Policies:
- Firewall rules reviewed: [Yes/No]
- Fail2ban reviewed: [Yes/No]
- Password policy reviewed: [Yes/No]
- Access control reviewed: [Yes/No]
- Changes made: [None/Describe]

Business Continuity:
- DR procedures tested: [Yes/No]
- Contact info updated: [Yes/No]
- Escalation procedures reviewed: [Yes/No]
- SLA review: [Met/Not met]
- BCP updated: [Yes/No]

Software Versions:
- Postfix: [X.X.X]
- Dovecot: [X.X.X]
- Rspamd: [X.X.X]
- PostgreSQL: [X.X.X]
- Upgrades needed: [None/List]

Vendors/Contracts:
- VPS provider: [Name, Plan, Cost]
- Domain registrar: [Name, Expiry]
- Backup storage: [Name, Plan]
- Monitoring: [Name, Plan]
- Contracts renewed: [None/Describe]

Recommendations:
[None or list recommendations]

Next Quarter's Tasks:
[List tasks]
```

5. EMERGENCY PROCEDURES
========================

Severity Levels
---------------
**P1 - Critical (Immediate Action Required)**
- Complete email outage
- Server compromise/security breach
- Data loss/corruption
- Server being used as spam relay
- Complete system failure

**P2 - High (Action Within 1 Hour)**
- Email delivery failures
- Service down (Postfix, Dovecot, etc.)
- Disk space full
- High spam rate (server blacklisted)

**P3 - Medium (Action Within 4 Hours)**
- Performance degradation
- High queue (> 1000 messages)
- Some users unable to send/receive
- Security vulnerabilities found

**P4 - Low (Action Within 24 Hours)**
- Minor performance issues
- Occasional delivery failures
- Minor security findings
- Documentation updates

EMERGENCY PROCEDURE 1: Server Being Used as Spam Relay
======================================================
Symptoms:
- High mail queue (> 1000 messages)
- Blacklisted on multiple DNSBLs
- High bandwidth usage
- Network slow
- External complaints

Immediate Actions:
```bash
# 1. STOP POSTFIX NOW
sudo systemctl stop postfix

# 2. Check if open relay
# Visit: http://www.mail-abuse.com/analyzer.html
# Or: telnet mail.ementech.co.ke 25
# (try to relay without authentication)

# 3. Review logs for spam
sudo tail -1000 /var/log/mail.log | grep -i "sasl_method="
# Look for authenticated spam

# 4. Check for compromised accounts
sudo -u postgres psql mailserver_db -c "SELECT email, last_login FROM users;"

# 5. Check mail queue
sudo postqueue -p | head -50

# 6. Find spam source
# In queue output, look for:
# - Same sender sending to many recipients
# - Unusual send times (e.g., 3 AM)
# - Large number of messages from one account
```

Resolution:
```bash
# If open relay:
# 1. Fix /etc/postfix/main.cf
#    Ensure these settings are correct:
#    smtpd_recipient_restrictions = ... reject_unauth_destination
#    smtpd_relay_restrictions = ... permit_mynetworks, permit_sasl_authenticated, reject_unauth_destination

# If compromised account:
# 1. Change password immediately
sudo -u postgres psql mailserver_db -c "UPDATE users SET password='{SHA512-CRYPT}$6$...' WHERE email='compromised@ementech.co.ke';"

# 2. Check for suspicious logins
sudo tail -1000 /var/log/dovecot.log | grep compromised@ementech.co.ke

# 3. Notify user
# Send email to alternate contact method

# Clear spam queue
sudo postsuper -d ALL

# 9. Remove from blacklists
# Visit each blacklist and request removal:
# - https://www.spamhaus.org/
# - https://www.spamcop.net/
# - https://www Barracudacentral.org/

# 10. Start Postfix
sudo systemctl start postfix

# 11. Monitor closely
sudo tail -f /var/log/mail.log
```

Prevention:
```bash
# 1. Enable rate limiting
# In /etc/postfix/main.cf:
smtpd_client_message_rate_limit = 50
smtpd_client_recipient_rate_limit = 50

# 2. Enable postscreen
# In /etc/postfix/main.cf:
postscreen_dnsbl_threshold = 3
postscreen_dnsbl_action = enforce

# 3. Monitor queue more frequently
# Add to cron: */5 * * * * /usr/local/bin/check-mail-queue.sh

# 4. Regular security audits
# Run quarterly
```

EMERGENCY PROCEDURE 2: Disk Space Full
======================================
Symptoms:
- Emails bounce with "no space left"
- Services fail to start
- Cannot write logs
- System slow or unresponsive

Immediate Actions:
```bash
# 1. Check disk usage
df -h

# 2. Find largest files
du -sh /var/mail/vhosts/*/* | sort -hr | head -20

# 3. Check mail queue size
sudo find /var/spool/postfix -type f | wc -l

# 4. Check log size
du -sh /var/log/*
```

Resolution:
```bash
# Option 1: Clean mail queue
sudo postsuper -d ALL deferred

# Option 2: Clean old logs
sudo journalctl --vacuum-time=7d
sudo rm /var/log/*.gz

# Option 3: Clean spam folders
# Via webmail: Empty spam folders for each account
# OR command line (CAUTION!):
# find /var/mail/vhosts -type d -name ".Junk" -exec rm -rf {} {} \;

# Option 4: Resize disk (if using VPS)
# Via VPS provider control panel
# Add more disk space

# Option 5: Move mail to another server
# If possible, migrate mailboxes to larger server
```

Prevention:
```bash
# 1. Setup monitoring alerts
# Already configured: /usr/local/bin/check-disk-space.sh
# Runs hourly, alerts at 80%

# 2. Regular cleanup
# Add to cron:
0 2 * * * find /var/mail/vhosts -type d -name ".Junk" -mtime +30 -exec rm -rf {} {} \;
0 3 * * * sudo journalctl --vacuum-time=30d

# 3. Quota enforcement
# Already configured: 1GB per account (except CEO/admin: 2GB)

# 4. Log rotation
# Already configured: /etc/logrotate.d/mail
```

EMERGENCY PROCEDURE 3: Email Queue Stuck
========================================
Symptoms:
- Emails not being delivered
- Queue growing (> 100 messages)
- Users complain of delayed email
- mailq shows many messages

Immediate Actions:
```bash
# 1. Check queue
sudo postqueue -p

# 2. Check queue status
sudo qshape deferred
sudo qshape active
sudo qshape incoming

# 3. Look for error patterns
sudo tail -100 /var/log/mail.log | grep -i "deferred\|bounced\|error"
```

Resolution:
```bash
# 1. Try to flush queue
sudo postqueue -f

# 2. If still stuck, examine specific message
sudo postcat -q QUEUE_ID

# 3. Check for common issues:
#    - DNS resolution problems
dig +short mx gmail.com

#    - Network connectivity
ping -c 3 gmail.com

#    - Firewall blocking
sudo ufw status

#    - Recipient server issues
#    Check error in mail log

# 4. Requeue messages
sudo postsuper -r ALL

# 5. If messages are undeliverable, delete
sudo postsuper -d deferred

# 6. Monitor
sudo tail -f /var/log/mail.log
```

Prevention:
```bash
# 1. Monitor queue size
# Already configured: /usr/local/bin/check-mail-queue.sh

# 2. Regular queue flush
# Add to cron: 0 * * * * sudo postqueue -f

# 3. DNS caching
# Install and configure dnsmasq for faster DNS resolution

# 4. Network monitoring
# Monitor network connectivity to major email providers
```

EMERGENCY PROCEDURE 4: SSL Certificate Expired
==============================================
Symptoms:
- Clients cannot connect
- SSL warnings in browser/webmail
- Email clients refuse to connect
- Logs show SSL errors

Immediate Actions:
```bash
# 1. Check certificate expiry
sudo certbot certificates

# 2. Check certificate files
ls -la /etc/letsencrypt/live/mail.ementech.co.ke/

# 3. Check which services use SSL
postconf | grep tls
dovecot | grep ssl
```

Resolution:
```bash
# 1. Renew certificate
sudo certbot renew --force-renewal

# 2. If renewal fails, obtain new certificate
sudo certbot certonly --standalone \
  -d mail.ementech.co.ke \
  --email admin@ementech.co.ke \
  --agree-tos \
  --non-interactive

# 3. Reload services
sudo systemctl reload postfix dovecot nginx

# 4. Verify new certificate
openssl s_client -connect mail.ementech.co.ke:993 -servername mail.ementech.co.ke < /dev/null | grep -i "subject\|not after"

# 5. Test connection
doveadm auth test user@ementech.co.ke PASSWORD
```

Prevention:
```bash
# 1. Auto-renewal is configured
# Check: systemctl status certbot.timer

# 2. Monitoring alert
# Add to monitoring: Check certificate expiry 30 days before

# 3. Manual check monthly
# Add to monthly checklist
```

EMERGENCY PROCEDURE 5: Database Corruption
==========================================
Symptoms:
- Cannot authenticate users
- Cannot access email
- Services failing to start
- Database errors in logs

Immediate Actions:
```bash
# 1. Stop all mail services
sudo systemctl stop postfix dovecot

# 2. Check database status
sudo -u postgres psql mailserver_db
# If connection fails, database is corrupted

# 3. Check PostgreSQL logs
sudo tail -100 /var/log/postgresql/postgresql-16-main.log
```

Resolution:
```bash
# 1. Try to recover database
sudo -u postgres psql -C
# This checks database integrity

# 2. If corrupted, restore from backup
# STOP: Do not proceed without backup verification!

# 3. Find latest backup
ls -lh /backup/mail-server/ | tail -5

# 4. Stop PostgreSQL
sudo systemctl stop postgresql

# 5. Rename corrupted database
sudo mv /var/lib/postgresql/16/main /var/lib/postgresql/16/main.corrupted

# 6. Create new data directory
sudo mkdir /var/lib/postgresql/16/main
sudo chown postgres:postgres /var/lib/postgresql/16/main

# 7. Initialize database
sudo /usr/lib/postgresql/16/bin/initdb -D /var/lib/postgresql/16/main

# 8. Start PostgreSQL
sudo systemctl start postgresql

# 9. Restore database
sudo -u postgres psql mailserver_db < /backup/mail-server/YYYYMMDD/mailserver_db.sql
sudo -u postgres psql roundcubemail < /backup/mail-server/YYYYMMDD/roundcubemail.sql

# 10. Verify restore
sudo -u postgres psql mailserver_db -c "SELECT * FROM users;"

# 11. Start services
sudo systemctl start postfix dovecot
```

Prevention:
```bash
# 1. Regular backups
# Already configured: Daily backups at 2 AM

# 2. Backup verification
# Add to monthly: Test restore on non-production system

# 3. Database monitoring
# Monitor database size and performance

# 4. PostgreSQL tuning
# Optimize for 2GB RAM:
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

EMERGENCY PROCEDURE 6: Complete System Failure
==============================================
Symptoms:
- Server completely down
- Cannot SSH into server
- No response to ping
- VPS provider shows server offline

Immediate Actions:
```bash
# 1. Contact VPS provider support
# Create emergency ticket

# 2. Check VPS control panel
# - Is server running?
# - Are there console errors?
# - Is network connectivity ok?

# 3. Try rescue mode
# Via VPS provider control panel, boot into rescue mode

# 4. Access via console
# Via VPS provider, access serial console
```

Resolution:
```bash
# 1. Boot into rescue mode

# 2. Mount disk
# (follow rescue mode instructions from VPS provider)

# 3. Check logs
# Look for errors in:
# - /var/log/syslog
# - /var/log/mail.log
# - dmesg

# 4. Identify issue
# Common causes:
# - Disk failure
# - Kernel panic
# - Corrupted filesystem
# - Out of memory

# 5. Fix issue
# Depends on root cause

# 6. Restore from backup if needed
# Follow: Emergency Procedure 5 (Database Corruption)

# 7. Reboot into normal mode
```

Prevention:
```bash
# 1. Off-site backups
# Configure remote backup to another server or cloud storage

# 2. High availability
# Consider setting up second server for failover

# 3. Monitoring
# Configure external monitoring (e.g., UptimeRobot, Pingdom)

# 4. Regular disaster recovery tests
# Test quarterly
```

EMERGENCY CONTACTS
==================
System Administrator: admin@ementech.co.ke
VPS Provider Support: [Your provider's support contact]
Domain Registrar: [Your registrar's contact]
Email: [Emergency email address for notifications]

ESCALATION PROCEDURES
=====================
1. **P1 Issues** (Critical): Contact immediately, page if necessary
2. **P2 Issues** (High): Contact within 15 minutes
3. **P3 Issues** (Medium): Contact within 1 hour
4. **P4 Issues** (Low): Email or contact next business day

DOCUMENTATION VERSION: 1.0
LAST UPDATED: 2025-01-19
STATUS: Ready for Production
