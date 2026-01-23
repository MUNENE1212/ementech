# Resource Monitoring Guide

## Overview

This guide provides comprehensive monitoring procedures for the EmenTech email server deployment. Given the current system constraints (90% disk utilization, 95% swap usage), careful monitoring is essential.

## Current System Baseline

**System Resources (Pre-Deployment):**
- **RAM:** 31GB total, 21GB used, 2.4GB free, 9.8GB available (including cache)
- **Swap:** 8GB total, 7.6GB used (95% utilization)
- **Disk (/):** 190GB total, 161GB used, 20GB free (90% utilization)
- **CPU Load:** 1.01, 1.54, 1.51 (1-minute, 5-minute, 15-minute averages)
- **Uptime:** 6 days, 11 hours

**Running Services:**
- nginx 1.24.0
- PostgreSQL 16
- Node.js v22.15.0

**Expected Additions (Email Server):**
- RAM: +400-600MB
- Disk: +500MB initial + mail storage
- CPU: +Minimal for mail processing

---

## 1. Resource Metrics to Monitor

### 1.1 RAM Monitoring

**Why Monitor RAM:**
- Email services (Postfix, Dovecot, PostgreSQL, rspamd) consume significant RAM
- Current free RAM is only 2.4GB (before swap)
- Swap is already at 95% utilization
- Insufficient RAM causes service crashes and email loss

**Metrics to Track:**
- Total RAM usage percentage
- Free RAM (excluding cache/buffers)
- Swap usage percentage
- Per-process RAM usage

**Monitoring Commands:**
```bash
# Quick overview
free -h

# Detailed RAM usage
free -m

# RAM usage by process
ps aux --sort=-%mem | head -20

# Top 10 RAM consumers
ps -eo pid,ppid,cmd,%mem,%cpu --sort=-%mem | head -11

# Continuous monitoring
watch -n 5 'free -h'

# Historical data
sar -r 1 10
```

**Alert Thresholds:**
- ⚠️ WARNING: RAM usage > 75%
- 🚨 CRITICAL: RAM usage > 85%
- ☢️ EMERGENCY: RAM usage > 90% or swap > 95%

**What to Do When Alert Triggers:**
```bash
# 1. Identify RAM consumers
ps aux --sort=-%mem | head -20

# 2. Restart heavy services (if safe)
systemctl restart rspamd  # Frees ~100-200MB

# 3. Clear page cache
sync; echo 3 > /proc/sys/vm/drop_caches

# 4. If still critical, scale up VPS
```

### 1.2 Disk Space Monitoring

**Why Monitor Disk Space:**
- Current usage: 90% (only 20GB free)
- Email storage grows continuously
- Logs accumulate rapidly
- Mail queue can fill disk if stuck
- <5% free space causes service failures

**Metrics to Track:**
- Total disk usage percentage
- Free space in GB
- Mail storage size (/var/mail/vhosts/)
- Log file sizes (/var/log/)
- Database size (/var/lib/postgresql/)
- Mail queue size

**Monitoring Commands:**
```bash
# Overall disk usage
df -h

# Monitor root partition specifically
df -h /

# Find large files (>100MB)
find / -type f -size +100M -exec ls -lh {} \; 2>/dev/null

# Directory sizes
du -sh /var/mail/* /var/log/* /var/lib/postgresql/*

# Mail queue size in messages
mailq | tail -n1

# Mail queue size in bytes
sudo du -sh /var/spool/postfix/*

# Database size
sudo -u postgres psql -c "SELECT pg_size_pretty(pg_database_size('mailserver'));"

# Continuous monitoring
watch -n 60 'df -h / && echo "---" && sudo du -sh /var/mail'
```

**Alert Thresholds:**
- ⚠️ WARNING: Disk usage > 85%
- 🚨 CRITICAL: Disk usage > 90%
- ☢️ EMERGENCY: Disk usage > 95% or <5GB free

**What to Do When Alert Triggers:**
```bash
# 1. Clean package cache
apt clean
apt autoclean

# 2. Remove old logs
journalctl --vacuum-time=7d
rm -f /var/log/*.gz

# 3. Clean mail queue (stuck emails only)
postsuper -d ALL  # ⚠️ Deletes ALL queued emails
postsuper -d ALL deferred  # Safer: only deferred

# 4. Compress old mail
find /var/mail/vhosts/ -name "*.eml" -mtime +365 -exec gzip {} \;

# 5. Archive old databases
sudo -u postgres pg_dump mailserver | gzip > mailserver-backup-$(date +%Y%m%d).sql.gz
```

**Disk Cleanup Script:**
```bash
#!/bin/bash
# /usr/local/bin/cleanup-disk.sh

LOG_FILE="/var/log/disk-cleanup.log"
echo "[$(date)] Starting disk cleanup" >> $LOG_FILE

# Clean package cache
echo "[$(date)] Cleaning apt cache" >> $LOG_FILE
apt clean 2>&1 >> $LOG_FILE
apt autoclean 2>&1 >> $LOG_FILE

# Clean old journal logs
echo "[$(date)] Cleaning journal logs" >> $LOG_FILE
journalctl --vacuum-time=7d 2>&1 >> $LOG_FILE

# Clean compressed logs
echo "[$(date)] Removing old compressed logs" >> $LOG_FILE
find /var/log -name "*.gz" -mtime +30 -delete 2>&1 >> $LOG_FILE

# Clean temporary files
echo "[$(date)] Cleaning temp files" >> $LOG_FILE
rm -rf /tmp/* 2>&1 >> $LOG_FILE

# Clean old mail queue (deferred only, >7 days old)
echo "[$(date)] Cleaning old deferred mail" >> $LOG_FILE
find /var/spool/postfix/deferred -type f -mtime +7 -delete 2>&1 >> $LOG_FILE

# Report disk usage after cleanup
echo "[$(date)] Disk usage after cleanup:" >> $LOG_FILE
df -h >> $LOG_FILE

echo "[$(date)] Cleanup complete" >> $LOG_FILE
```

**Automate Cleanup (Cron):**
```bash
# Run daily at 3 AM
0 3 * * * /usr/local/bin/cleanup-disk.sh
```

### 1.3 CPU Monitoring

**Why Monitor CPU:**
- Spam processing (rspamd) can be CPU intensive
- Mail queue processing spikes CPU
- High CPU slows web applications
- Sustained high CPU indicates problems

**Metrics to Track:**
- Load average (1, 5, 15 minutes)
- CPU usage percentage
- CPU usage by process
- I/O wait percentage

**Monitoring Commands:**
```bash
# Load average
uptime

# CPU usage
top -bn1 | grep "Cpu(s)"

# Per-process CPU usage
ps aux --sort=-%cpu | head -20

# Continuous monitoring
watch -n 5 'uptime'

# Historical data
sar -u 1 10

# I/O wait
iostat -x 1 5
```

**Alert Thresholds:**
- ⚠️ WARNING: Load average > number of CPU cores sustained for 5 minutes
- 🚨 CRITICAL: Load average > 2x CPU cores sustained for 10 minutes
- ☢️ EMERGENCY: Load average > 4x CPU cores sustained for 15 minutes

**What to Do When Alert Triggers:**
```bash
# 1. Identify CPU consumers
ps aux --sort=-%cpu | head -20

# 2. Check if spam filtering is overloaded
systemctl status rspamd
tail -f /var/log/rspamd/rspamd.log

# 3. Temporarily disable spam learning
# Edit /etc/rspamd/local.d/classifier-bayes.conf
# Set "learn" to false
systemctl reload rspamd

# 4. Restart heavy services
systemctl restart rspamd

# 5. Scale up VPS if needed
```

### 1.4 I/O Monitoring

**Why Monitor I/O:**
- Email servers are I/O intensive
- Mail delivery involves many small file operations
- Database operations add I/O load
- High I/O wait slows entire system

**Metrics to Track:**
- Disk I/O wait percentage
- Disk read/write rates
- I/O queue depth
- I/O operations per second (IOPS)

**Monitoring Commands:**
```bash
# I/O statistics
iostat -x 1 5

# Extended I/O stats
iostat -x -k 5

# Disk usage by process
iotop -o -b -n 3

# Continuous I/O monitoring
watch -n 2 'iostat -x 1 2'
```

**Alert Thresholds:**
- ⚠️ WARNING: I/O wait > 20% sustained
- 🚨 CRITICAL: I/O wait > 40% sustained
- ☢️ EMERGENCY: I/O wait > 60% sustained

**What to Do When Alert Triggers:**
```bash
# 1. Identify I/O consumers
iotop -o -b -n 3

# 2. Reduce I/O load
# - Disable mail indexing temporarily
# - Reduce log verbosity
# - Compress old mail to reduce random reads

# 3. Optimize Dovecot I/O
# Edit /etc/dovecot/conf.d/10-master.conf
# Set mail_max_userip_connections = 10
systemctl reload dovecot

# 4. Consider moving to SSD storage
```

---

## 2. Service Health Monitoring

### 2.1 Postfix Monitoring

**Service Status:**
```bash
# Check if Postfix is running
systemctl status postfix

# Check Postfix configuration
postfix check

# View Postfix errors
tail -f /var/log/mail.log | grep postfix
```

**Mail Queue Monitoring:**
```bash
# View mail queue
mailq

# View queue summary
mailq | tail -n1

# Count messages in queue
mailq | tail -n1 | awk '{print $5}'

# View deferred messages
mailq | grep -A 10 "Deferred"

# View active queue
postqueue -p

# Flush queue (force delivery attempt)
postqueue -f

# Delete specific message from queue
postsuper -d MESSAGE_ID

# Delete all deferred messages
postsuper -d ALL deferred

# Delete all messages (DANGEROUS)
postsuper -d ALL
```

**Queue Size Alerts:**
- ⚠️ WARNING: Queue > 50 messages
- 🚨 CRITICAL: Queue > 100 messages
- ☢️ EMERGENCY: Queue > 500 messages

**Queue Stuck Detection:**
```bash
# Check if queue is growing
watch -n 60 'mailq | tail -n1'

# Check deferred message age
find /var/spool/postfix/deferred -type f -mtime +1

# If many old deferred messages exist, queue is stuck
```

**Postfix Metrics:**
- Messages delivered per minute
- Messages deferred per minute
- Messages bounced per minute
- Average queue processing time

**Monitoring Script:**
```bash
#!/bin/bash
# /usr/local/bin/monitor-postfix.sh

QUEUE_SIZE=$(mailq | tail -n1 | awk '{print $5}')
DEFERRED_COUNT=$(mailq | grep -c "Deferred")

if [ ! -z "$QUEUE_SIZE" ] && [ $QUEUE_SIZE -gt 100 ]; then
    echo "WARNING: Mail queue size: $QUEUE_SIZE"
    echo "Deferred messages: $DEFERRED_COUNT"
    # Send alert
    echo "Mail queue critical: $QUEUE_SIZE messages" | mail -s "Postfix Alert" admin@ementech.co.ke
fi

# Check for Postfix errors
ERROR_COUNT=$(grep -c "postfix.*error" /var/log/mail.log 2>/dev/null || echo 0)
if [ $ERROR_COUNT -gt 10 ]; then
    echo "CRITICAL: $ERROR_COUNT Postfix errors in last hour"
    tail -100 /var/log/mail.log | grep postfix
fi
```

### 2.2 Dovecot Monitoring

**Service Status:**
```bash
# Check if Dovecot is running
systemctl status dovecot

# Check Dovecot configuration
doveconf -n

# View Dovecot errors
tail -f /var/log/mail.log | grep dovecot

# Check active IMAP connections
doveadm who

# Check mailbox sizes
doveadm quota recalc -A
```

**IMAP Connection Monitoring:**
```bash
# Active connections
ss -tnp | grep :143 | wc -l

# Secure IMAP connections
ss -tnp | grep :993 | wc -l

# Total authenticated users
doveadm who | wc -l
```

**Connection Alerts:**
- ⚠️ WARNING: >50 concurrent IMAP connections
- 🚨 CRITICAL: >100 concurrent IMAP connections

**Authentication Failures:**
```bash
# Count failed authentications
grep "dovecot.*authentication failed" /var/log/mail.log | wc -l

# Real-time monitoring
tail -f /var/log/mail.log | grep --line-buffered "authentication failed"

# Check for brute force attempts
grep "dovecot.*authentication failed" /var/log/mail.log | awk '{print $7}' | sort | uniq -c | sort -rn | head -20
```

**Mailbox Size Monitoring:**
```bash
# Check all mailbox sizes
doveadm -f flow quota get -A

# Find large mailboxes
doveadm -f flow quota get -A | awk '{if ($2 > 1000000000) print}'

# Report on largest mailboxes
doveadm -f flow quota get -A | sort -k2 -rn | head -10
```

**Dovecot Metrics:**
- Active IMAP connections
- IMAP operations per second
- Authentication success rate
- Average IMAP response time
- Disk I/O per user

### 2.3 PostgreSQL Monitoring

**Service Status:**
```bash
# Check if PostgreSQL is running
systemctl status postgresql

# Check database connections
sudo -u postgres psql -c "SELECT count(*) FROM pg_stat_activity;"

# Check database size
sudo -u postgres psql -c "SELECT pg_database.datname, pg_size_pretty(pg_database_size(pg_database.datname)) FROM pg_database;"

# Check active queries
sudo -u postgres psql -c "SELECT pid, now() - query_start as duration, query FROM pg_stat_activity WHERE state = 'active';"

# Check table sizes
sudo -u postgres psql -d mailserver -c "SELECT schemaname,tablename,pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size FROM pg_tables WHERE schemaname = 'public' ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;"
```

**Database Size Alerts:**
- ⚠️ WARNING: Database > 5GB
- 🚨 CRITICAL: Database > 10GB

**Connection Alerts:**
- ⚠️ WARNING: >80% of max_connections used
- 🚨 CRITICAL: >90% of max_connections used

**Query Performance:**
```bash
# Check slow queries
sudo -u postgres psql -d mailserver -c "SELECT query, mean_exec_time, calls FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;"

# Check table bloat
sudo -u postgres psql -d mailserver -c "SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) FROM pg_tables ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC LIMIT 10;"
```

**Database Maintenance:**
```bash
# Vacuum and analyze
sudo -u postgres psql -d mailserver -c "VACUUM ANALYZE;"

# Reindex database
sudo -u postgres psql -d mailserver -c "REINDEX DATABASE mailserver;"

# Check database corruption
sudo -u postgres psql -d mailserver -c "SELECT * FROM pg_stat_database WHERE datname = 'mailserver';"
```

### 2.4 rspamd Monitoring

**Service Status:**
```bash
# Check if rspamd is running
systemctl status rspamd

# Check rspamd configuration
rspamadm configdump

# View rspamd errors
tail -f /var/log/rspamd/rspamd.log

# Check rspamd statistics
rspamc stat
```

**Spam Filtering Metrics:**
```bash
# Overall statistics
rspamc stat

# Scan a test email
echo "Subject: Test" | rspamc -h localhost:11333 -p mail

# Check spam actions
tail -f /var/log/rspamd/rspamd.log | grep "action"
```

**Spam Detection Alerts:**
- ⚠️ WARNING: Spam rate > 50% of incoming emails
- 🚨 CRITICAL: Spam rate > 80% of incoming emails
- ☢️ EMERGENCY: rspamd service down

**Spam Filter Accuracy:**
- False positive rate (legitimate email marked as spam)
- False negative rate (spam not caught)
- Average spam score
- Reject vs soft reject vs add header rates

**rspamd Performance:**
```bash
# Check scan time
rspamc stat | grep "scan time"

# Check memory usage
ps aux | grep rspamd

# Check CPU usage
top -bn1 | grep rspamd
```

### 2.5 Roundcube Monitoring

**Service Status:**
```bash
# Check if Roundcube is accessible
curl -I http://localhost:8080

# Check Roundcube errors
tail -f /var/log/roundcube/errors.log

# Check nginx access logs
tail -f /var/log/nginx/access.log | grep webmail
```

**Webmail Usage Metrics:**
- Active user sessions
- Page load time
- Login success rate
- Database query performance

**Webmail Performance Alerts:**
- ⚠️ WARNING: Page load time > 3 seconds
- 🚨 CRITICAL: Page load time > 10 seconds
- ☢️ EMERGENCY: Service unreachable

---

## 3. Security Monitoring

### 3.1 Authentication Failures

**Why Monitor:**
- Detect brute force attacks early
- Identify compromised accounts
- Prevent unauthorized access

**Monitoring Commands:**
```bash
# Count failed SMTP authentications
grep "SASL LOGIN authentication failed" /var/log/mail.log | wc -l

# Count failed IMAP authentications
grep "dovecot.*authentication failed" /var/log/mail.log | wc -l

# Top failed IPs
grep "authentication failed" /var/log/mail.log | awk '{print $7}' | sort | uniq -c | sort -rn | head -20

# Real-time monitoring
tail -f /var/log/mail.log | grep --line-buffered "authentication failed"
```

**Alert Thresholds:**
- ⚠️ WARNING: >10 failed attempts from single IP in 1 hour
- 🚨 CRITICAL: >50 failed attempts from single IP in 1 hour
- ☢️ EMERGENCY: >100 failed attempts from single IP in 1 hour

**Automated Response:**
```bash
# Use fail2ban to block attackers
# Configure /etc/fail2ban/jail.local

[postfix-sasl]
enabled = true
port = smtp,ssmtp,submission,imap2,imap3,imaps,pop3,pop3s
filter = postfix-sasl
logpath = /var/log/mail.log
maxretry = 5
findtime = 600
bantime = 3600

[dovecot]
enabled = true
port = smtp,ssmtp,submission,imap2,imap3,imaps,pop3,pop3s
filter = dovecot
logpath = /var/log/mail.log
maxretry = 5
findtime = 600
bantime = 3600
```

### 3.2 Spam Attack Detection

**Why Monitor:**
- Spam attacks can fill disk quickly
- Can damage IP reputation
- Can get you blacklisted

**Monitoring Commands:**
```bash
# Check mail queue growth rate
watch -n 60 'mailq | tail -n1'

# Check for spam patterns
grep -E "(X-Spam.*YES|GTUBE)" /var/log/mail.log | wc -l

# Check recipients with high mail volume
grep "to=<" /var/log/mail.log | awk '{print $7}' | sort | uniq -c | sort -rn | head -20

# Check sender domains
grep "from=<" /var/log/mail.log | awk -F@ '{print $2}' | awk -F> '{print $1}' | sort | uniq -c | sort -rn | head -20
```

**Alert Thresholds:**
- ⚠️ WARNING: Queue growing by >10 messages/minute
- 🚨 CRITICAL: Queue growing by >50 messages/minute
- ☢️ EMERGENCY: Queue growing by >100 messages/minute

**Response to Spam Attack:**
```bash
# 1. Stop accepting new mail
postfix stop

# 2. Analyze the attack
# Check sender IPs
grep "from=" /var/log/mail.log | awk '{print $7}' | sort | uniq -c | sort -rn | head -20

# Check recipient addresses
grep "to=" /var/log/mail.log | awk '{print $8}' | sort | uniq -c | sort -rn | head -20

# 3. Block attacking IPs in firewall
ufw deny from ATTACKER_IP

# 4. Clean queue
postsuper -d ALL

# 5. Restart Postfix with stricter limits
# Edit /etc/postfix/main.cf
# smtpd_client_connection_count_limit = 5
# smtpd_client_connection_rate_limit = 10
# smtpd_client_message_rate_limit = 20

postfix start
```

### 3.3 Blacklist Monitoring

**Why Monitor:**
- Being blacklisted blocks all email
- Immediate impact on deliverability
- Requires urgent action

**Manual Checks:**
```bash
# Check common blacklists
# Use online tools:
# - https://mxtoolbox.com/blacklists.aspx
# - https://www.dnsbl.info/
# - https://www.spamhaus.org/

# Check your IP reputation
# Substitute your server's IP address
dig +short 192.0.2.1.zen.spamhaus.org

# If result is 127.0.0.2-10, you're listed
```

**Automated Monitoring Script:**
```bash
#!/bin/bash
# /usr/local/bin/check-blacklists.sh

SERVER_IP=$(curl -s ifconfig.me)
ALERT_EMAIL="admin@ementech.co.ke"
BLACKLISTS=(
    "zen.spamhaus.org"
    "bl.spamcop.net"
    "dnsbl-1.uceprotect.net"
)

for blacklist in "${BLACKLISTS[@]}"; do
    RESULT=$(dig +short $SERVER_IP.$blacklist)
    if [ ! -z "$RESULT" ]; then
        echo "BLACKLISTED: $blacklist - $RESULT"
        echo "Server $SERVER_IP is listed on $blacklist" | mail -s "Blacklist Alert" $ALERT_EMAIL
    fi
done
```

**Schedule:**
```bash
# Check daily at 6 AM
0 6 * * * /usr/local/bin/check-blacklists.sh
```

**Delisting Procedures:**
1. Identify which blacklist you're on
2. Visit their website
3. Follow their delisting process
4. Fix the issue that caused listing
5. Request removal
6. Wait 24-48 hours for removal

---

## 4. Automated Monitoring Setup

### 4.1 Monit Configuration

**Install Monit:**
```bash
apt install monit
```

**Configure Monit (/etc/monit/monitrc):**
```conf
set daemon 60  # Check every 60 seconds
set log /var/log/monit.log
set idfile /var/lib/monit/id
set statefile /var/lib/monit/state

# Email alerts
set mailserver localhost
set alert admin@ementech.co.ke  # Receive all alerts

# System monitoring
check system $HOST
    if loadavg (1min) > 4 then alert
    if loadavg (5min) > 3 then alert
    if memory usage > 85% then alert
    if swap usage > 80% then alert
    if cpu usage (user) > 80% for 2 cycles then alert
    if cpu usage (system) > 60% for 2 cycles then alert

# Disk monitoring
check filesystem rootfs with path /
    if space usage > 90% then alert
    if space usage > 95% then exec "/usr/local/bin/cleanup-disk.sh"
    if inode usage > 90% then alert

# Postfix monitoring
check process postfix with pidfile /var/spool/postfix/pid/master.pid
    start program = "/bin/systemctl start postfix"
    stop program = "/bin/systemctl stop postfix"
    if failed port 25 protocol smtp then alert
    if failed port 587 protocol smtp then alert
    if 5 restarts within 5 cycles then timeout

# Dovecot monitoring
check process dovecot with pidfile /run/dovecot/master.pid
    start program = "/bin/systemctl start dovecot"
    stop program = "/bin/systemctl stop dovecot"
    if failed port 143 protocol imap then alert
    if failed port 993 protocol imaps then alert
    if 5 restarts within 5 cycles then timeout

# PostgreSQL monitoring
check process postgresql with pidfile /var/run/postgresql/16-main.pid
    start program = "/bin/systemctl start postgresql"
    stop program = "/bin/systemctl stop postgresql"
    if failed port 5432 protocol pgsql then alert
    if 5 restarts within 5 cycles then timeout

# rspamd monitoring
check process rspamd with pidfile /run/rspamd/pid
    start program = "/bin/systemctl start rspamd"
    stop program = "/bin/systemctl stop rspamd"
    if failed port 11333 then alert
    if 5 restarts within 5 cycles then timeout

# nginx monitoring
check process nginx with pidfile /run/nginx.pid
    start program = "/bin/systemctl start nginx"
    stop program = "/bin/systemctl stop nginx"
    if failed port 80 protocol http then alert
    if failed port 443 protocol https then alert
    if 5 restarts within 5 cycles then timeout
```

**Start Monit:**
```bash
systemctl enable monit
systemctl start monit
monit status
```

### 4.2 Logwatch Configuration

**Install Logwatch:**
```bash
apt install logwatch
```

**Configure Logwatch (/usr/share/logwatch/default.conf/logwatch.conf):**
```conf
LogDir = /var/log
TmpDir = /var/cache/logwatch
MailTo = admin@ementech.co.ke
Range = yesterday
Detail = Med
Service = All
# Exclude less important services
Service = "-zz-disk_space"
Service = "-postfix"
```

**Schedule Daily Reports:**
```bash
# Run daily at 7 AM
0 7 * * * /usr/sbin/logwatch --output mail --mailto admin@ementech.co.ke
```

### 4.3 Custom Monitoring Scripts

**Email Queue Monitor:**
```bash
#!/bin/bash
# /usr/local/bin/monitor-mail-queue.sh

ALERT_EMAIL="admin@ementech.co.ke"
LOG_FILE="/var/log/mail-queue-monitor.log"

QUEUE_SIZE=$(mailq | tail -n1 | awk '{print $5}')
QUEUE_DEFERRED=$(mailq | grep -c "Deferred")

echo "[$(date)] Queue size: $QUEUE_SIZE, Deferred: $QUEUE_DEFERRED" >> $LOG_FILE

if [ ! -z "$QUEUE_SIZE" ] && [ $QUEUE_SIZE -gt 100 ]; then
    echo "WARNING: Mail queue size critical: $QUEUE_SIZE" >> $LOG_FILE
    echo "Mail queue critical: $QUEUE_SIZE messages ($QUEUE_DEFERRED deferred)" | \
        mail -s "Mail Queue Alert" $ALERT_EMAIL
fi
```

**Resource Usage Monitor:**
```bash
#!/bin/bash
# /usr/local/bin/monitor-resources.sh

ALERT_EMAIL="admin@ementech.co.ke"
LOG_FILE="/var/log/resource-monitor.log"

# Check RAM
RAM_USAGE=$(free | awk '/Mem/{printf("%.0f", $3/$2*100)}')
if [ $RAM_USAGE -gt 85 ]; then
    echo "[$(date)] CRITICAL: RAM usage at ${RAM_USAGE}%" >> $LOG_FILE
    free -h >> $LOG_FILE
    echo "RAM usage critical: ${RAM_USAGE}%" | mail -s "Resource Alert" $ALERT_EMAIL
fi

# Check disk
DISK_FREE=$(df -h / | awk 'NR==2 {print $4}' | sed 's/G//')
if [ $(echo "$DISK_FREE < 10" | bc) -eq 1 ]; then
    echo "[$(date)] CRITICAL: Only ${DISK_FREE}GB free" >> $LOG_FILE
    df -h >> $LOG_FILE
    echo "Disk space critical: ${DISK_FREE}GB free" | mail -s "Resource Alert" $ALERT_EMAIL
fi
```

**Complete Monitoring Script:**
```bash
#!/bin/bash
# /usr/local/bin/monitor-all.sh

ALERT_EMAIL="admin@ementech.co.ke"
LOCK_FILE="/tmp/monitor-all.lock"

# Prevent concurrent execution
if [ -f "$LOCK_FILE" ]; then
    echo "Monitor already running"
    exit 1
fi
touch "$LOCK_FILE"

# Run all monitors
/usr/local/bin/monitor-resources.sh
/usr/local/bin/monitor-mail-queue.sh
/usr/local/bin/check-blacklists.sh

# Remove lock
rm -f "$LOCK_FILE"
```

**Schedule in Crontab:**
```bash
# Run every 5 minutes
*/5 * * * * /usr/local/bin/monitor-all.sh

# Run queue monitor every minute
* * * * * /usr/local/bin/monitor-mail-queue.sh

# Run resource monitor every 10 minutes
*/10 * * * * /usr/local/bin/monitor-resources.sh

# Run blacklist check daily at 6 AM
0 6 * * * /usr/local/bin/check-blacklists.sh

# Run disk cleanup daily at 3 AM
0 3 * * * /usr/local/bin/cleanup-disk.sh
```

---

## 5. Monitoring Dashboard

### 5.1 Quick Health Check Script

```bash
#!/bin/bash
# /usr/local/bin/health-check.sh

echo "=== EmenTech Email Server Health Check ==="
echo "Date: $(date)"
echo ""

echo "=== System Resources ==="
free -h
echo ""
df -h /
echo ""
uptime
echo ""

echo "=== Service Status ==="
for service in postfix dovecot postgresql rspamd nginx; do
    STATUS=$(systemctl is-active $service)
    echo "$service: $STATUS"
done
echo ""

echo "=== Mail Queue ==="
mailq | tail -n1
echo ""

echo "=== Recent Errors ==="
echo "Postfix:"
tail -20 /var/log/mail.log | grep -i "error\|warning" | grep postfix | tail -5
echo ""
echo "Dovecot:"
tail -20 /var/log/mail.log | grep -i "error\|warning" | grep dovecot | tail -5
echo ""

echo "=== Authentication Failures (Last Hour) ==="
grep "$(date +%Y-%m-%d.%H)" /var/log/mail.log | grep "authentication failed" | wc -l
echo ""

echo "=== Blacklist Status ==="
/usr/local/bin/check-blacklists.sh 2>/dev/null || echo "Check script not found"
echo ""

echo "=== Backup Status ==="
ls -lh /backup/ 2>/dev/null | tail -5 || echo "No backup directory found"
```

### 5.2 Real-Time Monitoring Dashboard

**Create /usr/local/bin/dashboard.sh:**
```bash
#!/bin/bash
# Display real-time monitoring dashboard

while true; do
    clear
    echo "=== EmenTech Email Server Monitor ==="
    echo "Last update: $(date)"
    echo "Press Ctrl+C to exit"
    echo ""

    echo "=== Resources ==="
    free -m | awk 'NR==2{printf "RAM: %sMB / %sMB (%.1f%%)\n", $3,$2,$3*100/$2}'
    df -h / | awk 'NR==2{printf "Disk: %s / %s (%s)\n", $3, $2, $5}'
    uptime | awk '{printf "Load: %s (1m), %s (5m), %s (15m)\n", $10, $11, $12}'
    echo ""

    echo "=== Services ==="
    systemctl is-active postfix >/dev/null && echo "Postfix: Running" || echo "Postfix: STOPPED"
    systemctl is-active dovecot >/dev/null && echo "Dovecot: Running" || echo "Dovecot: STOPPED"
    systemctl is-active postgresql >/dev/null && echo "PostgreSQL: Running" || echo "PostgreSQL: STOPPED"
    systemctl is-active rspamd >/dev/null && echo "rspamd: Running" || echo "rspamd: STOPPED"
    systemctl is-active nginx >/dev/null && echo "nginx: Running" || echo "nginx: STOPPED"
    echo ""

    echo "=== Mail Queue ==="
    QUEUE=$(mailq | tail -n1 | awk '{print $5}')
    echo "Queue size: ${QUEUE:-0} messages"
    echo ""

    echo "=== Recent Errors ==="
    tail -3 /var/log/mail.log | grep -i "error\|warning"
    echo ""

    echo "=== Active Connections ==="
    echo "SMTP (25): $(ss -tn | grep :25 | wc -l)"
    echo "SMTPS (465): $(ss -tn | grep :465 | wc -l)"
    echo "Submission (587): $(ss -tn | grep :587 | wc -l)"
    echo "IMAP (143): $(ss -tn | grep :143 | wc -l)"
    echo "IMAPS (993): $(ss -tn | grep :993 | wc -l)"
    echo ""

    sleep 5
done
```

**Usage:**
```bash
chmod +x /usr/local/bin/dashboard.sh
/usr/local/bin/dashboard.sh
```

---

## 6. Alert Threshold Summary

| Metric | Warning | Critical | Emergency | Action |
|--------|---------|----------|-----------|---------|
| RAM Usage | >75% | >85% | >90% | Clear cache, restart services, scale up |
| Swap Usage | >80% | >90% | >95% | Add RAM or increase swap size |
| Disk Usage | >85% | >90% | >95% | Run cleanup, archive old mail |
| Disk Free | <10GB | <5GB | <2GB | Urgent cleanup, add storage |
| Load Average | >cores | >2x cores | >4x cores | Identify process, scale up |
| I/O Wait | >20% | >40% | >60% | Optimize I/O, add SSD |
| Mail Queue | >50 | >100 | >500 | Flush queue, check for spam attack |
| SMTP Connections | >100 | >200 | >500 | Check for spam attack |
| IMAP Connections | >50 | >100 | >200 | Tune Dovecot, scale up |
| Authentication Failures | >10/IP/hr | >50/IP/hr | >100/IP/hr | Block IP via fail2ban |
| Spam Rate | >50% | >80% | >95% | Tune rspamd rules |
| Database Size | >5GB | >10GB | >20GB | Archive old data, cleanup |
| Failed Services | 1 restart | 2 restarts | 3+ restarts | Investigate logs, fix config |

---

## 7. Monitoring Tools Summary

**Built-in Tools:**
- `free` - RAM monitoring
- `df` - Disk space monitoring
- `uptime` - Load average
- `mailq` - Mail queue
- `systemctl` - Service status
- `journalctl` - Log viewing

**Package Tools:**
- `monit` - Process and resource monitoring
- `logwatch` - Log analysis and reporting
- `fail2ban` - Intrusion prevention
- `iotop` - I/O monitoring
- `htop` - Interactive process viewer

**Custom Scripts:**
- `/usr/local/bin/monitor-resources.sh`
- `/usr/local/bin/monitor-mail-queue.sh`
- `/usr/local/bin/check-blacklists.sh`
- `/usr/local/bin/cleanup-disk.sh`
- `/usr/local/bin/health-check.sh`
- `/usr/local/bin/dashboard.sh`

**Online Tools:**
- MX Toolbox - DNS and blacklist checks
- Mail-Tester - Email deliverability testing
- DKIM Validator - DKIM verification
- SSL Labs - SSL/TLS testing

---

## 8. Next Steps

1. Install monitoring tools (Monit, Logwatch, fail2ban)
2. Configure automated alerts
3. Set up cron jobs for monitoring scripts
4. Test all monitoring scripts
5. Create monitoring dashboard
6. Document baseline metrics
7. Train team on monitoring procedures
8. Establish on-call rotation
