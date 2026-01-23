# EmenTech Email Server - Operations Plan Index

## Overview

This directory contains a comprehensive deployment and operations plan for the EmenTech self-hosted email server.

**Current System Status:**
- **Disk Usage:** 90% (161GB/190GB used) ⚠️ CRITICAL - Clean up required
- **Swap Usage:** 95% (7.6GB/8GB used) ⚠️ WARNING - Consider adding RAM
- **RAM Usage:** 67% (21GB/31GB used)
- **Existing Services:** nginx, PostgreSQL 16, Node.js
- **Websites:** ementech.co.ke, app.ementech.co.ke

---

## Document Structure

### 📋 [00-Deployment-Summary.md](00-deployment-summary.md)
**Purpose:** Executive summary and quick start guide
**Sections:**
- Document overview
- System status and warnings
- Quick start guide
- Critical success factors
- Common mistakes to avoid
- Escalation path
- Maintenance schedule
- Performance baselines
- Quick reference commands

**Read First:** Start here for complete overview

---

### ✅ [01-Pre-Deployment-Checklist.md](01-pre-deployment-checklist.md)
**Purpose:** Ensure all prerequisites are met before installation
**Time Required:** 2-4 hours
**Items:** 50+ checklist items organized by category

**Key Sections:**
1. System Backup Verification
2. DNS Configuration Access
3. SSL Certificate Management
4. Disk Space Verification (with cleanup commands)
5. Current Services Documentation
6. Rollback Planning
7. Maintenance Window Scheduling
8. Resource Requirements Assessment
9. Monitoring Setup Preparation
10. Testing Strategy Definition
11. Security Preparation
12. Compliance Verification
13. Final Go/No-Go Decision

**Critical Warnings:**
- ⚠️ Disk space at 90% - Clean up or add storage BEFORE deployment
- ⚠️ Swap usage at 95% - Monitor closely
- ⚠️ Production system - Complete full backup first

**When to Use:** Before starting any installation work

---

### 🚀 [02-Deployment-Strategy.md](02-deployment-strategy.md)
**Purpose:** Phased, zero-downtime deployment approach
**Time Required:** 5-7 hours (over 2-4 weeks)

**Deployment Phases:**
- **Phase 0:** Pre-Deployment (Day -1, 2-4 hours)
- **Phase 1:** Preparation (Day 0, 30 min, ZERO RISK)
- **Phase 2:** Core Installation (Day 0, 2 hours, LOW RISK)
- **Phase 3:** DNS Configuration (Day 0, 30 min, NO RISK)
- **Phase 4:** Service Activation (Day 2, 2 hours, MEDIUM RISK)
- **Phase 5:** Full Integration (Day 2, 1 hour, MONITORED)
- **Weeks 1-4:** Gradual production rollout

**Key Sections:**
1. Zero-downtime strategy
2. Service isolation approach
3. Rollback triggers and procedures
4. Real-time monitoring dashboard
5. Testing procedures (sandbox and production)
6. Communication plan templates
7. Risk register
8. Success criteria

**When to Use:** During deployment execution

---

### 📊 [03-Resource-Monitoring-Guide.md](03-resource-monitoring-guide.md)
**Purpose:** Comprehensive monitoring procedures for operations
**Setup Time:** 1-2 hours

**Metrics Monitored:**
- **System Resources:** RAM, disk, CPU, I/O
- **Service Health:** Postfix, Dovecot, PostgreSQL, rspamd, Roundcube
- **Security:** Authentication failures, spam attacks, blacklisting
- **Email Operations:** Mail queue, deliverability, spam filtering

**Monitoring Tools:**
- Built-in: free, df, mailq, systemctl, journalctl
- Packages: Monit, Logwatch, fail2ban, iotop
- Custom Scripts: Resource monitor, queue monitor, blacklist checker
- Online Tools: MX Toolbox, Mail-Tester, DKIM Validator

**Alert Thresholds:**
| Metric | Warning | Critical | Emergency |
|--------|---------|----------|-----------|
| RAM Usage | >75% | >85% | >90% |
| Disk Usage | >85% | >90% | >95% |
| Mail Queue | >50 | >100 | >500 |
| Auth Failures | >10/IP/hr | >50/IP/hr | >100/IP/hr |

**When to Use:**
- Setup: Before going live
- Daily: System health checks
- Troubleshooting: Diagnose issues

---

### 🚨 [04-Incident-Response-Runbooks.md](04-incident-response-runbooks.md)
**Purpose:** Step-by-step procedures for handling emergencies
**6 Critical Runbooks Included:**

1. **Mail Queue Stuck** (Severity: High, Response: <15 min)
   - Diagnosis and resolution procedures
   - Queue flush and cleanup commands
   - Prevention strategies

2. **Server Used as Spam Relay** (Severity: CRITICAL, Response: <5 min)
   - Immediate action to stop spam
   - Analysis and breach containment
   - Long-term prevention
   - Delisting procedures

3. **Disk Space Full** (Severity: CRITICAL, Response: <10 min)
   - Emergency cleanup commands
   - Mail queue management
   - Long-term solutions

4. **SSL Certificate Expiring** (Severity: High, Response: <24 hr)
   - Manual and auto-renewal procedures
   - Expiration alert setup
   - Prevention strategies

5. **Database Corruption** (Severity: CRITICAL, Response: <15 min)
   - Database recovery procedures
   - Backup and restore operations
   - Prevention measures

6. **Successful Brute Force Attack** (Severity: HIGH, Response: <10 min)
   - Account lockdown procedures
   - Attack analysis and containment
   - Long-term security hardening

**When to Use:** During system emergencies

---

### 🔒 [05-Security-Hardening-Checklist.md](05-security-hardening-checklist.md)
**Purpose:** 50-item security checklist for comprehensive protection
**Time Required:** 3-4 hours
**Target Score:** 50/50 (100%)

**10 Security Categories:**
1. **Firewall Configuration** (12 items) - UFW, ports, rate limiting
2. **SSL/TLS Hardening** (8 items) - TLS 1.2+, strong ciphers, PFS
3. **Intrusion Prevention** (5 items) - Fail2ban, jails, alerts
4. **Authentication Security** (4 items) - Passwords, expiration, 2FA
5. **Relay Prevention** (5 items) - Postfix restrictions, open relay testing
6. **Email Security** (6 items) - SPF, DKIM, DMARC configuration
7. **Anti-Spam Configuration** (3 items) - rspamd setup and tuning
8. **Log Security** (4 items) - Permissions, rotation, monitoring
9. **System Hardening** (3 items) - Updates, services, automation
10. **Security Testing** (3 items) - SSL Labs, mail tests, scans

**Scoring:**
- **100% (50/50):** Excellent - Best practices implemented
- **95-99% (47-49):** Very Good - Minor improvements possible
- **90-94% (45-46):** Good - Meets minimum requirements
- **<90%:** Improvement needed before production

**Critical Must-Have Items:**
- Firewall configured
- TLS 1.2+ only
- Not an open relay
- Fail2ban configured
- SPF/DKIM/DMARC configured

**When to Use:**
- Before deployment: Complete entire checklist
- Monthly: Review and update security measures
- After incidents: Verify security controls

---

## Quick Start Guide

### For First-Time Deployment

**Step 1: Read the Summary** (15 minutes)
```bash
cd /media/munen/muneneENT/ementech/ementech-website/.agent-workspace/handoffs/to-deployment/email-server-ops-plan/
cat 00-deployment-Summary.md
```

**Step 2: Complete Pre-Deployment Checklist** (2-4 hours)
- Open `01-pre-deployment-checklist.md`
- Go through each item systematically
- Mark items as complete with ☑
- **Do NOT skip any items**

**Step 3: Execute Deployment Strategy** (5-7 hours over 2-4 weeks)
- Open `02-deployment-strategy.md`
- Follow each phase in order
- Complete all verification steps
- Do not skip phases

**Step 4: Set Up Monitoring** (1-2 hours)
- Open `03-resource-monitoring-guide.md`
- Install monitoring tools (Monit, Logwatch, fail2ban)
- Configure custom monitoring scripts
- Test all alerts

**Step 5: Complete Security Hardening** (3-4 hours)
- Open `05-security-hardening-checklist.md`
- Complete all 50 security items
- Test security configurations
- Verify SPF/DKIM/DMARC

**Step 6: Train Team** (2-3 hours)
- Review `04-incident-response-runbooks.md`
- Train all administrators
- Document on-call procedures
- Test incident response

### For Ongoing Operations

**Daily (10 minutes):**
```bash
# Run health check
/usr/local/bin/health-check.sh

# Check mail queue
mailq

# Review errors
tail -100 /var/log/mail.log | grep -i "error\|warning"
```

**Weekly (30 minutes):**
- Review security logs
- Check blacklist status
- Test email functionality
- Review resource usage

**Monthly (1-2 hours):**
- Update software packages
- Review and update documentation
- Test backup restores
- Security audit
- Performance review

**Quarterly (4-8 hours):**
- Disaster recovery test
- Comprehensive security review
- Architecture review
- Team training
- Compliance audit

---

## Emergency Procedures

### If Something Goes Wrong

**1. Stay Calm and Assess**
- Read the appropriate runbook in `04-incident-response-runbooks.md`
- Identify the severity and response time required

**2. Execute the Runbook**
- Follow the step-by-step procedures
- Do not skip diagnosis steps
- Document all actions taken

**3. Communicate**
- Notify stakeholders if needed
- Provide status updates
- Escalate if overwhelmed

**4. Document and Learn**
- Complete incident report
- Update procedures to prevent recurrence
- Share lessons learned with team

### Critical Contacts

**Level 1 Issues** (Deployment agent can handle):
- Configuration errors
- Minor service issues
- Documentation questions

**Level 2 Issues** (Escalate immediately):
- System crashes
- Security breaches
- Data loss
- Blacklisting
- Performance issues

**Level 3 Issues** (EMERGENCY):
- Complete service outage
- Successful attack
- Data breach
- Legal/compliance issues

---

## Common Commands Reference

### System Status
```bash
# Overall health
free -h && df -h && uptime

# Service status
systemctl status postfix dovecot rspamd postgresql nginx

# Mail queue
mailq
```

### Security
```bash
# Check firewall
ufw status verbose

# Check fail2ban
fail2ban-client status

# Check SSL cert
certbot certificates

# Test DNS records
dig TXT ementech.co.ke
dig TXT default._domainkey.ementech.co.ke
dig TXT _dmarc.ementech.co.ke
```

### Testing
```bash
# SMTP connection test
telnet localhost 25

# IMAPS connection test
openssl s_client -connect mail.ementech.co.ke:993

# Send test email
echo "Test" | mail -s "Test Subject" test@example.com

# Test spam filter
echo "XJS*C4JDBQADN1.NSBN3*2IDNEN*GTUBE-STANDARD-ANTI-UBE-TEST-EMAIL*C.34X" | mail -s "Spam Test" test@ementech.co.ke
```

### Maintenance
```bash
# Clean disk space
apt clean && apt autoclean
journalctl --vacuum-time=7d

# Restart services
systemctl restart postfix dovecot rspamd

# Flush mail queue
postqueue -f

# View logs
tail -f /var/log/mail.log
```

### Backup
```bash
# Backup configurations
tar -czf email-configs-$(date +%Y%m%d).tar.gz /etc/postfix/ /etc/dovecot/ /etc/rspamd/

# Backup database
sudo -u postgres pg_dump mailserver > mailserver-$(date +%Y%m%d).sql

# Backup email storage
tar -czf mail-data-$(date +%Y%m%d).tar.gz /var/mail/
```

---

## File Locations Reference

### Configuration Files
- Postfix: `/etc/postfix/`
- Dovecot: `/etc/dovecot/`
- rspamd: `/etc/rspamd/`
- Roundcube: `/etc/roundcube/`
- nginx: `/etc/nginx/`
- PostgreSQL: `/etc/postgresql/16/main/`

### Data Files
- Email storage: `/var/mail/vhosts/`
- Mail queue: `/var/spool/postfix/`
- Database: `/var/lib/postgresql/16/main/`
- DKIM keys: `/var/lib/rspamd/dkim/`
- SSL certificates: `/etc/letsencrypt/live/mail.ementech.co.ke/`

### Log Files
- Mail logs: `/var/log/mail.log`
- Postfix: `/var/log/postfix/`
- Dovecot: `/var/log/dovecot.log`
- rspamd: `/var/log/rspamd/rspamd.log`
- Roundcube: `/var/log/roundcube/errors.log`
- System: `/var/log/syslog`

### Custom Scripts
- Monitoring scripts: `/usr/local/bin/monitor-*.sh`
- Health check: `/usr/local/bin/health-check.sh`
- Cleanup script: `/usr/local/bin/cleanup-disk.sh`
- Backup scripts: `/usr/local/bin/backup-*.sh`

---

## Success Criteria

Deployment is **SUCCESSFUL** when:

### System Health
- [ ] All services running (Postfix, Dovecot, PostgreSQL, rspamd, nginx)
- [ ] RAM usage <80%
- [ ] Disk space >5GB free
- [ ] Load average <2.0
- [ ] No errors in logs

### Functionality
- [ ] Can send email to external domains
- [ ] Can receive email from external domains
- [ ] Webmail accessible and functional
- [ ] IMAP/SMTP authentication working
- [ ] Spam filtering operational
- [ ] DKIM/SPF/DMARC passing

### Existing Services
- [ ] ementech.co.ke accessible
- [ ] app.ementech.co.ke accessible
- [ ] PostgreSQL databases intact
- [ ] No data loss
- [ ] No configuration corruption

### Monitoring & Security
- [ ] Logwatch configured and sending reports
- [ ] Monit configured and monitoring services
- [ ] Alerts tested and working
- [ ] Security hardening checklist complete (45+/50)
- [ ] Fail2ban active
- [ ] SPF/DKIM/DMARC configured and tested

### Documentation
- [ ] All configurations documented
- [ ] Runbooks reviewed and tested
- [ ] Passwords stored securely
- [ ] Architecture diagram created
- [ ] Change log updated

---

## Warnings and Critical Issues

### ⚠️ CRITICAL: Disk Space at 90%
**Current Status:** 161GB used of 190GB (20GB free)
**Required:** Minimum 5GB free space for deployment
**Action Required BEFORE deployment:**
```bash
# Clean up unnecessary files
apt clean && apt autoclean
journalctl --vacuum-time=7d
rm -f /var/log/*.gz

# Find and remove large files
find / -type f -size +100M -exec ls -lh {} \; 2>/dev/null

# Consider adding additional storage
```

### ⚠️ WARNING: Swap Usage at 95%
**Current Status:** 7.6GB used of 8GB total
**Action Required:**
- Monitor RAM usage closely during deployment
- Add more RAM if possible (email server needs ~400-600MB)
- Optimize current usage (restart heavy services if needed)

### ⚠️ PRODUCTION SYSTEM
**Current Status:** Live websites (ementech.co.ke, app.ementech.co.ke)
**Risk:** One mistake can take down live sites
**Requirements:**
- Complete full backup before starting
- Test rollback procedure
- Use phased deployment approach
- Have on-call team ready

### ⚠️ EMAIL REPUTATION RISK
**Risk:** Misconfiguration can cause blacklisting
**Prevention:**
- Complete security hardening checklist
- Test for open relay before going live
- Configure SPF/DKIM/DMARC correctly
- Monitor blacklist status daily

---

## Document Version

**Version:** 1.0
**Date:** January 19, 2026
**Status:** Production Ready
**Next Review:** After deployment completion

**All documents are immediately actionable and production-ready.**

---

## Need Help?

1. **Read the summary first:** `00-deployment-summary.md`
2. **Follow the checklist:** `01-pre-deployment-checklist.md`
3. **Execute the strategy:** `02-deployment-strategy.md`
4. **Set up monitoring:** `03-resource-monitoring-guide.md`
5. **Secure the system:** `05-security-hardening-checklist.md`
6. **Handle incidents:** `04-incident-response-runbooks.md`

**Good luck with your deployment! 🚀**
