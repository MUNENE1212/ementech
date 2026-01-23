# Email Server Deployment Strategy

## Executive Summary

This document outlines the deployment strategy for installing a self-hosted email server on an existing production VPS that currently hosts:
- ementech.co.ke (corporate website)
- app.ementech.co.ke (DumuWaks marketplace)

**Critical Constraints:**
- Production system with live services
- Limited disk space (90% utilized)
- High swap usage (95% utilized)
- No tolerance for extended downtime

**Deployment Goal:** Zero-downtime installation with complete rollback capability

---

## 1. Deployment Approach: Phased Rollout

### Why Phased Rollout?

Given the production environment, we'll use a **phased rollout with sandbox testing** approach:

✅ **Pros:**
- Minimal risk to existing services
- Easy rollback at each phase
- Incremental testing reduces surprise failures
- Better resource monitoring

❌ **Cons (alternatives considered):**
- Big bang deployment: Too risky for production
- Blue-green deployment: Not feasible (single VPS)
- Separate staging server: Not cost-effective for small deployment

---

## 2. Zero-Downtime Strategy

### 2.1 Service Isolation Approach

```
Phase 1: Preparation (ZERO RISK)
├── Backup all configurations
├── Install dependencies (PostgreSQL, etc.)
├── Configure firewall rules
└── Set up monitoring baseline

Phase 2: Core Installation (LOW RISK)
├── Install Postfix (with config only, no activation)
├── Install Dovecot (with config only, no activation)
├── Install rspamd (with config only, no activation)
└── Test configurations without starting services

Phase 3: DNS Pre-Configuration (NO RISK)
├── Add DNS records (low TTL)
├── Verify DNS propagation
└── Test DNS resolution

Phase 4: Service Activation (MEDIUM RISK)
├── Activate Postfix (port 25 only)
├── Test SMTP authentication
├── Activate Dovecot (IMAPS only)
├── Test IMAP authentication
└── Activate Roundcube webmail

Phase 5: Full Integration (MONITORED)
├── Activate all email ports
├── Configure spam filtering
├── Enable DKIM signing
└── Begin production email flow
```

### 2.2 Maintaining Existing Services

**nginx Configuration:**
- Continue serving existing sites on port 80/443
- Add new location blocks for webmail:
  ```nginx
  location /webmail {
      proxy_pass http://localhost:8080;  # Roundcube
  }
  ```
- No changes to existing virtual hosts

**PostgreSQL:**
- Create separate database for mail server
- Use different database user
- No impact on existing databases

**System Resources:**
- Monitor RAM usage continuously
- Set up alerts for >80% usage
- Prepare to restart services if needed

### 2.3 Rollback Triggers

At any phase, rollback if:
- RAM usage exceeds 90% for >5 minutes
- Any existing service becomes unresponsive
- Disk space drops below 5GB
- Load average exceeds 5.0 for >10 minutes
- Any existing website returns 5xx errors
- Unexpected service failures occur

---

## 3. Service Migration Approach

### Decision: Gradual Cutover with Parallel Testing

**Why not Big Bang?**
- Too risky for production system
- Difficult to isolate problems
- Extended downtime if issues occur

**Gradual Cutover Process:**

```
Week 1: Installation and Internal Testing
├── Install email server components
├── Configure with test domain (test.ementech.co.ke)
├── Internal testing only (no production traffic)
└── Verify all configurations

Week 2: DNS Configuration and External Testing
├── Add DNS records for mail.ementech.co.ke
├── Wait for propagation (24-48 hours)
├── Create 2-3 pilot accounts
├── Test sending/receiving from external accounts
└── Verify spam filtering works

Week 3: Limited Production Rollout
├── Add 5-10 power user accounts
├── Monitor closely for issues
├── Gather user feedback
└── Fix any discovered issues

Week 4: Full Production Cutover
├── Migrate remaining accounts
├── Remove old email service (if applicable)
└── Full production use
```

### Pilot User Selection Criteria

Select pilot users who:
- Are technically savvy
- Have low email volume initially
- Understand this is a test period
- Can provide detailed feedback
- Have backup email access

---

## 4. Testing Strategy

### 4.1 Sandbox Testing vs Production Testing

**Sandbox Testing (Recommended - Phase 1-2):**
- Use local testing tools before going live
- No external traffic accepted
- Test authentication locally
- Verify configuration syntax

**Production Testing (Required - Phase 3-4):**
- Test with real external email servers
- Verify DNS records are publicly accessible
- Test spam filtering with real emails
- Validate TLS certificates from external sources

### 4.2 Testing Checklist

#### Pre-Activation Tests (Sandbox)
```bash
# Test Postfix configuration
sudo postfix check

# Test Dovecot configuration
sudo doveconf -n

# Test syntax of all config files
sudo postfix -n
sudo doveconf -n > /tmp/dovecot-test.conf

# Test database connectivity
psql -h localhost -U mailuser -d mailserver

# Test local authentication
testsaslauthd -u testuser -p testpass -s smtp
```

#### Post-Activation Tests (Production)
```bash
# Test SMTP connection
telnet localhost 25
ehlo test.com
mail from: <test@ementech.co.ke>
rcpt to: <external@example.com>
data
Subject: Test email
This is a test email.
.

# Test IMAP connection
telnet localhost 993
a1 LOGIN testuser testpass
a2 LIST "" *
a3 SELECT INBOX
a4 LOGOUT

# Test DNS records
dig mail.ementech.co.ke
dig MX ementech.co.ke
dig TXT ementech.co.ke
dig TXT _dmarc.ementech.co.ke

# Test SPF
dig TXT ementech.co.ke | grep spf

# Test DKIM
nslookup -q=TXT default._domainkey.ementech.co.ke

# Test SSL/TLS
openssl s_client -connect mail.ementech.co.ke:587 -starttls smtp
openssl s_client -connect mail.ementech.co.ke:993

# Test email sending
echo "Test email body" | mail -s "Test subject" external@example.com

# Test spam filtering
echo "XJS*C4JDBQADN1.NSBN3*2IDNEN*GTUBE-STANDARD-ANTI-UBE-TEST-EMAIL*C.34X" | mail -s "Spam test" test@ementech.co.ke
```

#### External Validation Tools
- **MX Toolbox**: https://mxtoolbox.com/
- **Mail-Tester**: https://www.mail-tester.com/
- **DKIM Validator**: https://dkimvalidator.com/
- **Spamhaus**: Check if IP is blacklisted
- **SSL Labs**: https://www.ssllabs.com/ssltest/

---

## 5. Deployment Timeline and Duration

### Detailed Phase Breakdown

#### Phase 0: Pre-Deployment (Day -1 to Day 0)
**Duration: 2-4 hours**
**Risk Level: ZERO**

| Task | Duration | Owner |
|------|----------|-------|
| Complete pre-deployment checklist | 30 min | Deployment Lead |
| Full system backup | 45 min | SysAdmin |
| Disk cleanup (if needed) | 30 min | SysAdmin |
| Stakeholder notification | 15 min | Project Manager |
| Maintenance window confirmation | 15 min | All |

**Deliverables:**
- Completed checklist
- Verified backups
- Clean system with >10GB free
- Notified stakeholders

#### Phase 1: Preparation (Day 0 - T+0:30)
**Duration: 30 minutes**
**Risk Level: ZERO**
**Rollback Time: 5 minutes**

| Task | Duration | Command |
|------|----------|---------|
| Update package index | 2 min | `apt update` |
| Install dependencies | 10 min | `apt install ...` |
| Create mail user | 2 min | `adduser ...` |
| Configure firewall | 5 min | `ufw allow ...` |
| Set up monitoring baseline | 5 min | `monit ...` |
| Verify no service disruption | 5 min | `systemctl status` |

**Rollback Procedure:**
```bash
# Stop any started services
systemctl stop postfix dovecot

# Remove packages
apt remove --purge postfix dovecot-core

# Restore firewall
ufw disable
ufw reset
ufw enable
ufw reload
```

#### Phase 2: Core Installation (T+0:30 to T+2:30)
**Duration: 2 hours**
**Risk Level: LOW**
**Rollback Time: 15 minutes**

| Task | Duration | Command |
|------|----------|---------|
| Install PostgreSQL | 10 min | `apt install postgresql` |
| Create mail database | 5 min | `psql -c "CREATE DATABASE..."` |
| Install Postfix | 15 min | `apt install postfix` |
| Configure Postfix | 20 min | Edit /etc/postfix/*.cf |
| Install Dovecot | 15 min | `apt install dovecot-core` |
| Configure Dovecot | 20 min | Edit /etc/dovecot/*.conf |
| Install rspamd | 15 min | `apt install rspamd` |
| Configure rspamd | 15 min | Edit /etc/rspamd/*.conf |
| Verify all configs | 5 min | `postfix check; doveconf -n` |

**Services NOT started yet** - only configuration installed

**Rollback Procedure:**
```bash
# Remove packages (configurations preserved)
apt remove --purge postfix dovecot-core rspamd

# Remove database
sudo -u postgres psql -c "DROP DATABASE mailserver;"

# Remove database user
sudo -u postgres psql -c "DROP USER mailuser;"
```

#### Phase 3: DNS Configuration (T+2:30 to T+3:00)
**Duration: 30 minutes**
**Risk Level: NO RISK**
**Rollback Time: 5 minutes**

| Task | Duration | Command |
|------|----------|---------|
| Add A record (mail.ementech.co.ke) | 5 min | DNS provider |
| Add MX record | 5 min | DNS provider |
| Add TXT record (SPF) | 5 min | DNS provider |
| Generate DKIM keys | 5 min | `rspamadm dkim_keygen...` |
| Add TXT record (DKIM) | 5 min | DNS provider |
| Add TXT record (DMARC) | 5 min | DNS provider |

**Wait 24-48 hours for DNS propagation** (no service disruption)

**Rollback Procedure:**
- Delete DNS records from DNS provider
- Propagation may take 24-48 hours

#### Phase 4: Service Activation (T+24:00 to T+26:00)
**Duration: 2 hours (Day 2)**
**Risk Level: MEDIUM**
**Rollback Time: 30 minutes**

| Task | Duration | Command |
|------|----------|---------|
| Verify DNS propagation | 10 min | `dig mail.ementech.co.ke` |
| Start Postfix (port 25 only) | 5 min | `systemctl start postfix` |
| Test SMTP authentication | 15 min | `telnet localhost 25` |
| Start Dovecot (IMAPS only) | 5 min | `systemctl start dovecot` |
| Test IMAP authentication | 15 min | `telnet localhost 993` |
| Create test accounts | 10 min | `adduser...` |
| Send test emails | 20 min | `mail -s "Test"...` |
| Verify mail delivery | 15 min | Check /var/mail/ |
| Check logs for errors | 10 min | `tail -f /var/log/mail.log` |
| Start rspamd | 5 min | `systemctl start rspamd` |
| Test spam filtering | 10 min | Send GTUBE email |

**Critical Monitoring:**
- RAM usage (alert if >80%)
- Disk space (alert if <5GB)
- Mail queue size (alert if >100)
- Log errors

**Rollback Procedure:**
```bash
# Stop services
systemctl stop postfix dovecot rspamd

# Remove from startup
systemctl disable postfix dovecot rspamd

# Remove DNS records (see Phase 3)

# Restore previous system state
# (Restores from backups taken in Phase 0)
```

#### Phase 5: Full Integration (T+26:00 to T+27:00)
**Duration: 1 hour**
**Risk Level: MONITORED**
**Rollback Time: 1 hour**

| Task | Duration | Command |
|------|----------|---------|
| Enable all email ports in firewall | 5 min | `ufw allow 587,465,143,993` |
| Install Roundcube webmail | 15 min | `apt install roundcube` |
| Configure nginx for webmail | 10 min | Edit nginx config |
| Test webmail access | 10 min | Browser test |
| Configure email clients | 15 min | Setup guides |
| Final monitoring verification | 5 min | Check all dashboards |

**Final Tests:**
- Send email from external account → mail.ementech.co.ke
- Send email from mail.ementech.co.ke → external account
- Test webmail login and send/receive
- Test spam filtering
- Verify DKIM signing (check headers)
- Verify SPF/DMARC (use online tools)

**Rollback Procedure:**
- Complete system restore from Phase 0 backups
- DNS record removal (24-48 hour propagation)
- Notify users of rollback

---

## 6. Monitoring During Deployment

### 6.1 Real-Time Monitoring Dashboard

Open these terminals during deployment:

**Terminal 1: Resource Monitoring**
```bash
watch -n 5 'free -h && echo "---" && df -h && echo "---" && uptime'
```

**Terminal 2: Service Monitoring**
```bash
watch -n 5 'systemctl status postfix dovecot rspamd postgresql nginx'
```

**Terminal 3: Log Monitoring**
```bash
tail -f /var/log/mail.log /var/log/syslog
```

**Terminal 4: Mail Queue Monitoring**
```bash
watch -n 10 'mailq | head -20'
```

**Terminal 5: Network Monitoring**
```bash
watch -n 5 'ss -tulpn | grep -E "(25|587|143|993)"'
```

### 6.2 Automated Monitoring Scripts

Create `/root/deployment-monitor.sh`:
```bash
#!/bin/bash
# Deployment monitoring script

ALERT_EMAIL="admin@ementech.co.ke"
LOG_FILE="/var/log/deployment-monitor.log"

check_ram() {
    RAM_USAGE=$(free | awk '/Mem/{printf("%.0f", $3/$2*100)}')
    if [ $RAM_USAGE -gt 80 ]; then
        echo "[$(date)] WARNING: RAM usage at ${RAM_USAGE}%" | tee -a $LOG_FILE
        # Send alert
        echo "RAM usage critical: ${RAM_USAGE}%" | mail -s "Deployment Alert" $ALERT_EMAIL
    fi
}

check_disk() {
    DISK_FREE=$(df -h / | awk 'NR==2 {print $4}' | sed 's/G//')
    if [ $(echo "$DISK_FREE < 5" | bc) -eq 1 ]; then
        echo "[$(date)] CRITICAL: Only ${DISK_FREE}GB free" | tee -a $LOG_FILE
        echo "Disk space critical: ${DISK_FREE}GB free" | mail -s "Deployment Alert" $ALERT_EMAIL
    fi
}

check_services() {
    for service in postfix dovecot rspamd nginx postgresql; do
        if ! systemctl is-active --quiet $service; then
            echo "[$(date)] ERROR: $service not running" | tee -a $LOG_FILE
            echo "Service $service failed!" | mail -s "Deployment Alert" $ALERT_EMAIL
        fi
    done
}

check_mail_queue() {
    QUEUE_SIZE=$(mailq | tail -n1 | awk '{print $5}')
    if [ ! -z "$QUEUE_SIZE" ] && [ $QUEUE_SIZE -gt 100 ]; then
        echo "[$(date)] WARNING: Mail queue size: $QUEUE_SIZE" | tee -a $LOG_FILE
    fi
}

# Run checks
check_ram
check_disk
check_services
check_mail_queue
```

Run every 5 minutes during deployment:
```bash
watch -n 300 /root/deployment-monitor.sh
```

---

## 7. Rollback Decision Tree

```
START DEPLOYPMENT
    |
    v
Phase Complete?
    |
    v
    YES → Monitor for 15 minutes
    |        |
    |        v
    |    Any alerts?
    |        |
    |        v
    |        NO → Continue to next phase
    |        |
    |        v
    |        YES → Can we fix it in 10 minutes?
    |                 |
    |                 v
    |                 YES → Attempt fix
    |                 |        |
    |                 |        v
    |                 |    Fixed?
    |                 |        |
    |                 |        v
    |                 |        YES → Continue phase
    |                 |        |
    |                 |        v
    |                 |        NO → ROLLBACK
    |                 |
    |                 v
    |                 NO → ROLLBACK
    |
    v
ROLLBACK
    |
    v
1. Stop all new services
2. Disable new services from startup
3. Remove DNS records (if applicable)
4. Verify existing services are working
5. Document what failed
6. Wait for stakeholder decision
    |
    v
Retry deployment? → YES → Fix issue → RETRY
    |
    v
    NO → Document lessons learned → END
```

---

## 8. Post-Deployment Verification

### 8.1 Immediate Verification (Within 1 hour)

- [ ] All services running: `systemctl status postfix dovecot rspamd`
- [ ] RAM usage acceptable: `free -h` (<80%)
- [ ] Disk space adequate: `df -h` (>5GB free)
- [ ] Mail queue empty: `mailq`
- [ ] No errors in logs: `tail -100 /var/log/mail.log`
- [ ] Existing websites accessible: Test ementech.co.ke and app.ementech.co.ke
- [ ] Database accessible: Test PostgreSQL connections
- [ ] nginx serving normally: Check all sites

### 8.2 Functional Verification (Within 4 hours)

- [ ] Send test email from external account → mail.ementech.co.ke
- [ ] Send test email from mail.ementech.co.ke → external account
- [ ] Send email with attachment (5MB)
- [ ] Test webmail login
- [ ] Test webmail send/receive
- [ ] Test IMAP connection (use Thunderbird or similar)
- [ ] Test SMTP authentication
- [ ] Test spam filter (send GTUBE email)
- [ ] Verify DKIM signing in email headers
- [ ] Verify SPF/DMARC pass (use mail-tester.com)
- [ ] Test email forwarding (if configured)
- [ ] Test vacation/auto-reply (if configured)

### 8.3 External Verification (Within 24 hours)

- [ ] Check MX records: https://mxtoolbox.com/
- [ ] Check blacklist status: https://mxtoolbox.com/blacklists.aspx
- [ ] Test email deliverability: https://www.mail-tester.com/
- [ ] Verify DKIM: https://dkimvalidator.com/
- [ ] Test SSL/TLS: https://www.ssllabs.com/ssltest/
- [ ] Check spam score: Send to spamcheck@appmaildev.com
- [ ] Verify reverse DNS (PTR record)
- [ ] Test from multiple external providers (Gmail, Outlook, Yahoo)

---

## 9. Communication Plan

### 9.1 Before Deployment (24 hours prior)

**To: All EmenTech Team Members**
**Subject: Scheduled Maintenance - Email Server Installation**

Dear Team,

This is to inform you that we will be installing a new email server on our VPS on [DATE] from [START TIME] to [END TIME] ([TIMEZONE]).

**Expected Impact:**
- ementech.co.ke: No disruption expected
- app.ementech.co.ke: No disruption expected
- Email services: Will be activated gradually over 2 weeks

**Maintenance Window:**
- Date: [DATE]
- Time: [START TIME] - [END TIME]
- Duration: Approximately 2 hours

**What to Expect:**
1. New email addresses will be created over the next 2 weeks
2. You'll receive login credentials via secure channel
3. Training documentation will be provided
4. Pilot testing will begin on [DATE]

**Questions?** Contact: [NAME] at [EMAIL/PHONE]

Thank you for your patience.

### 9.2 During Deployment (Every 30 minutes)

**Status Update Template:**

**Deployment Status Update - [TIME]**

**Phase:** [Current Phase]
**Status:** ☐ In Progress | ☐ Complete | ☐ Blocked | ☐ Rolled Back
**Progress:** [X]%

**Completed Tasks:**
- [Task 1]
- [Task 2]

**Current Task:** [Current activity]
**Next Up:** [Next task]

**Issues:** None / [Description]
**ETA to Next Phase:** [Time]

**System Status:**
- RAM: [Usage]%
- Disk: [Free]GB
- Services: [All running / Service name down]

### 9.3 After Deployment (Within 1 hour)

**To: All EmenTech Team Members**
**Subject: Email Server Installation Complete**

Dear Team,

The email server installation has been completed successfully!

**What's New:**
- New email addresses: @ementech.co.ke
- Webmail access: https://webmail.ementech.co.ke
- Mobile/Desktop setup: [Setup Guide Link]

**Next Steps:**
1. You'll receive your login credentials by [DATE]
2. Please complete the setup guide by [DATE]
3. Pilot testing begins [DATE]
4. Full migration [DATE]

**Need Help?**
- Documentation: [Wiki/Docs Link]
- Support: [Email/Phone]

**System Status:**
- All services: Operational
- Email sending/receiving: Functional
- Webmail: Accessible

Thank you!

### 9.4 Emergency Communications

**If Rollback Required:**

**To: All Stakeholders**
**Subject: URGENT: Email Server Rollback Initiated**

Due to [issue description], we are rolling back the email server installation.

**Current Impact:**
- Email services: Temporarily unavailable
- Websites: Not affected
- ETA to restoration: [Time]

We will provide updates every 30 minutes.

**Contact:** [Name] at [Phone]

---

## 10. Success Criteria

Deployment is considered **SUCCESSFUL** when:

1. **System Health:**
   - ☐ All services running (Postfix, Dovecot, PostgreSQL, rspamd, nginx)
   - ☐ RAM usage <80%
   - ☐ Disk space >5GB
   - ☐ Load average <2.0
   - ☐ No errors in logs

2. **Functionality:**
   - ☐ Can send email to external domains
   - ☐ Can receive email from external domains
   - ☐ Webmail accessible and functional
   - ☐ IMAP/SMTP authentication working
   - ☐ Spam filtering operational
   - ☐ DKIM/SPF/DMARC passing

3. **Existing Services:**
   - ☐ ementech.co.ke accessible
   - ☐ app.ementech.co.ke accessible
   - ☐ PostgreSQL databases intact
   - ☐ No data loss
   - ☐ No configuration corruption

4. **Monitoring:**
   - ☐ Logwatch configured
   - ☐ Monit configured
   - ☐ Alerts tested and working
   - ☐ Mail queue monitoring active
   - ☐ Resource monitoring active

5. **Documentation:**
   - ☐ Configuration documented
   - ☐ Runbooks created
   - ☐ Passwords stored securely
   - ☐ Architecture diagram created
   - ☐ Change log updated

6. **Security:**
   - ☐ Firewall configured correctly
   - ☐ Fail2ban active
   - ☐ SSL/TLS valid
   - ☐ Strong passwords enforced
   - ☐ No open relays

7. **Testing:**
   - ☐ Internal tests passed
   - ☐ External validation passed
   - ☐ Pilot users successful
   - ☐ No blacklistings
   - ☐ Deliverability >95%

---

## 11. Risk Register

| Risk | Probability | Impact | Mitigation | Contingency |
|------|-------------|--------|------------|-------------|
| Insufficient RAM | Medium | High | Monitor continuously, have cleanup scripts ready | Add swap or upgrade VPS |
| Disk space full | High | Critical | Clean up before deployment, monitor closely | Add storage or delete old logs |
| Port 25 blocked | Medium | High | Check with VPS provider beforehand | Use SMTP relay service |
| DNS issues | Low | Medium | Use low TTL initially | Manual DNS updates |
| Service conflicts | Low | High | Test in sandbox first | Rollback and fix configs |
| Blacklisting | Low | High | Configure SPF/DKIM/DMARC correctly | Request delisting |
| Data loss | Low | Critical | Full backups before starting | Restore from backup |
| Email reputation damage | Low | High | Gradual rollout, monitor closely | Use warm-up IP service |
| Performance degradation | Medium | Medium | Load testing beforehand | Scale up resources |
| Security breach | Low | Critical | Fail2ban, strong passwords | Immediate lockdown |

---

## 12. Deployment Command Reference

### Quick Reference Commands

```bash
# Installation Phase
apt update
apt install postfix dovecot-core dovecot-imapd dovecot-pop3d dovecot-lmtpd dovecot-auth-lua
apt install postgresql postgresql-contrib
apt install rspamd redis-server
apt install roundcube roundcube-core roundcube-sqlite3
apt install fail2ban

# Configuration Check
postfix check
doveconf -n
nginx -t

# Service Management
systemctl start postfix dovecot rspamd
systemctl enable postfix dovecot rspamd
systemctl status postfix dovecot rspamd

# Testing
mailq
tail -f /var/log/mail.log
telnet localhost 25
openssl s_client -connect localhost:993

# Monitoring
watch -n 5 'free -h && df -h'
systemctl status postfix dovecot rspamd nginx postgresql

# Rollback
systemctl stop postfix dovecot rspamd
systemctl disable postfix dovecot rspamd
apt remove --purge postfix dovecot-core rspamd
```

---

## 13. Next Steps After Deployment

1. **Day 1-3:** Monitor closely, fix any immediate issues
2. **Week 1:** Onboard pilot users, gather feedback
3. **Week 2:** Onboard remaining users, full production
4. **Week 3:** Optimize based on usage patterns
5. **Week 4:** Review and update documentation
6. **Month 2:** Performance review and capacity planning
7. **Quarter 1:** Disaster recovery test
