# EmenTech Email Server - Deployment & Operations Plan Summary

## Document Overview

This comprehensive deployment and operations plan provides everything needed to successfully deploy, operate, and maintain a self-hosted email server for EmenTech.

**Current System Status:**
- **Platform:** Ubuntu Linux (Development/Testing)
- **RAM:** 31GB total (21GB used, 2.4GB free, 9.8GB available with cache)
- **Swap:** 8GB total (7.6GB used - 95% utilization) ⚠️
- **Disk (/):** 190GB total (161GB used, 20GB free - 90% utilization) ⚠️
- **Existing Services:** nginx 1.24.0, PostgreSQL 16, Node.js v22.15.0
- **Hosting:** ementech.co.ke, app.ementech.co.ke (DumuWaks marketplace)

**Critical Warnings:**
1. ⚠️ Disk space at 90% - Clean up or add storage BEFORE deployment
2. ⚠️ Swap usage at 95% - Add RAM or optimize current usage
3. ⚠️ Production system - One mistake can take down live sites
4. ⚠️ Email reputation at risk - Misconfiguration can cause blacklisting

---

## Document Structure

This operations plan consists of 5 comprehensive documents:

### 1. Pre-Deployment Checklist
**File:** `01-pre-deployment-checklist.md`

**Purpose:** Ensure all prerequisites are met before starting installation.

**Key Sections:**
- System backup verification
- DNS configuration access
- SSL certificate management
- Disk space verification (with cleanup commands)
- Current services documentation
- Rollback planning
- Maintenance window scheduling
- Resource requirements assessment
- Monitoring setup preparation
- Testing strategy definition
- Security preparation
- Compliance verification

**Critical Items:**
- Full system backup completed and verified
- Minimum 5GB free disk space (currently 20GB - adequate but tight)
- DNS provider access confirmed
- SSL certificates ready for mail.ementech.co.ke
- Rollback procedure documented and tested

**Time Required:** 2-4 hours

---

### 2. Deployment Strategy
**File:** `02-deployment-strategy.md`

**Purpose:** Provide phased, zero-downtime deployment approach.

**Key Sections:**
- Phased rollout strategy (5 phases over 2-4 weeks)
- Zero-downtime procedures
- Service migration approach (gradual cutover)
- Testing strategy (sandbox + production)
- Detailed deployment timeline (5-7 hours)
- Monitoring during deployment
- Rollback decision tree
- Post-deployment verification
- Communication plan
- Risk register
- Success criteria

**Deployment Timeline:**

**Day -1: Pre-Deployment (2-4 hours)**
- Complete pre-deployment checklist
- Full system backup
- Stakeholder notification

**Day 0: Installation (2-3 hours)**
- Phase 1: Preparation (30 min) - Install dependencies
- Phase 2: Core Installation (2 hours) - Postfix, Dovecot, rspamd
- Phase 3: DNS Configuration (30 min) - Add DNS records

**Day 1-2: DNS Propagation (24-48 hours)**
- Wait for DNS propagation
- Verify DNS records

**Day 2: Service Activation (2 hours)**
- Phase 4: Service Activation - Start services, test functionality
- Phase 5: Full Integration - Enable all features

**Week 1-4: Gradual Rollout**
- Week 1: Internal testing
- Week 2: External testing and pilot users
- Week 3: Limited production rollout
- Week 4: Full production cutover

**Critical Success Factors:**
- All existing services remain operational
- Zero email data loss
- SPF/DKIM/DMARC passing
- No blacklistings
- Monitoring and alerts active

---

### 3. Resource Monitoring Guide
**File:** `03-resource-monitoring-guide.md`

**Purpose:** Comprehensive monitoring procedures for email server operations.

**Key Metrics Monitored:**

**System Resources:**
- RAM usage (alert if >80%)
- Disk space (alert if >90% or <10GB free)
- CPU load (alert if >cores sustained)
- I/O wait (alert if >20% sustained)

**Service Health:**
- Postfix status and mail queue (alert if >100 messages)
- Dovecot connections and authentication
- PostgreSQL database size and performance
- rspamd spam filtering accuracy
- Roundcube webmail availability

**Security Monitoring:**
- Authentication failures (alert if >10/IP/hour)
- Spam attacks (alert if queue growing >10/min)
- Blacklist status (daily checks)
- Intrusion attempts

**Monitoring Tools:**
- Built-in: free, df, mailq, systemctl, journalctl
- Packages: Monit, Logwatch, fail2ban, iotop
- Custom scripts: Resource monitor, queue monitor, blacklist checker
- Online tools: MX Toolbox, Mail-Tester, DKIM Validator

**Alert Thresholds:**
| Metric | Warning | Critical | Emergency |
|--------|---------|----------|-----------|
| RAM Usage | >75% | >85% | >90% |
| Disk Usage | >85% | >90% | >95% |
| Mail Queue | >50 | >100 | >500 |
| Auth Failures | >10/IP/hr | >50/IP/hr | >100/IP/hr |

**Automation:**
- Monit for process monitoring (60-second intervals)
- Logwatch for daily log analysis
- Custom scripts for specific metrics
- Cron jobs for scheduled checks (every 5-10 minutes)

---

### 4. Incident Response Runbooks
**File:** `04-incident-response-runbooks.md`

**Purpose:** Step-by-step procedures for handling common emergencies.

**6 Critical Runbooks:**

**1. Mail Queue Stuck (Severity: High, Response: <15 min)**
- Symptoms: Emails not delivered, queue growing
- Diagnosis: Check queue status, Postfix status, network/DNS
- Resolution: Flush queue, requeue messages, delete stuck messages
- Prevention: Monitor queue size, maintain disk space, stable network

**2. Server Being Used as Spam Relay (Severity: CRITICAL, Response: <5 min)**
- Symptoms: Blacklisting, bandwidth spike, queue full of spam
- Diagnosis: Check queue content, authentication logs, test for open relay
- Immediate Action: Stop Postfix, analyze breach, block IPs, change passwords
- Long-term Fix: Rate limiting, strict authentication, recipient limits
- Prevention: Never run as open relay, require TLS, fail2ban

**3. Disk Space Full (Severity: CRITICAL, Response: <10 min)**
- Symptoms: Emails bouncing, services failing
- Diagnosis: Check disk usage, find large files, check inodes
- Immediate Action: Clean packages, logs, temp files, mail queue
- Long-term Solution: Add storage, automated cleanup, mail quotas, log rotation
- Prevention: Daily cleanup script, disk space alerts, quotas

**4. SSL Certificate Expiring (Severity: High, Response: <24 hr)**
- Symptoms: TLS warnings, authentication failures
- Diagnosis: Check certificate expiration, test auto-renewal
- Resolution: Manual renewal, force renewal, reissue certificate
- Prevention: Enable auto-renewal, expiration alerts (30 days before)

**5. Database Corruption (Severity: CRITICAL, Response: <15 min)**
- Symptoms: Authentication failures, missing emails
- Diagnosis: Check PostgreSQL status, logs, run integrity checks
- Immediate Action: Emergency backup, attempt recovery, restore from backup
- Long-term Solution: Daily backups, replication, integrity checks
- Prevention: Daily backups, disk space monitoring, UPS protection

**6. Successful Brute Force Attack (Severity: HIGH, Response: <10 min)**
- Symptoms: Many failed attempts, account accessed without authorization
- Diagnosis: Check authentication logs, identify scope (accounts, IPs, emails sent)
- Immediate Action: Lock accounts, block IPs, review activity, notify stakeholders
- Long-term Remediation: 2FA evaluation, audit all accounts, password policy
- Prevention: Strong passwords (12+ chars), fail2ban, rate limiting, security audits

**Incident Response Flow:**
1. Incident detected
2. Assess severity (P1: <15min, P2: <1hr, P3: <4hr, P4: <24hr)
3. Execute emergency runbook
4. Resolve or escalate
5. Document incident
6. Update procedures to prevent recurrence

---

### 5. Security Hardening Checklist
**File:** `05-security-hardening-checklist.md`

**Purpose:** 50-item security checklist for comprehensive server protection.

**10 Security Categories:**

**1. Firewall Configuration (12 items)**
- UFW enabled with default deny
- Email ports configured: 25, 587, 465, 143, 993, 110, 995
- Rate limiting on critical ports
- All other ports blocked

**2. SSL/TLS Hardening (8 items)**
- Let's Encrypt certificates
- TLS 1.2+ only (disable SSLv3, TLS 1.0/1.1)
- Strong cipher suites
- Perfect Forward Secrecy
- Plain text auth disabled

**3. Intrusion Prevention (5 items)**
- Fail2ban installed and configured
- Postfix-SASL jail (5 failures = 1 hour ban)
- Dovecot jail (5 failures = 1 hour ban)
- Recidive jail (repeat offenders = 24 hour ban)
- Email alerts for bans

**4. Authentication Security (4 items)**
- Strong password policy (12+ chars, complexity)
- Password expiration (90 days)
- Account lockout (10 failures)
- 2FA evaluated

**5. Relay Prevention (5 items)**
- mynetworks = localhost only
- Relay restrictions configured
- Recipient restrictions
- HELO/EHLO restrictions
- Open relay tested and verified secure

**6. Email Security (6 items)**
- SPF record published: v=spf1 mx ~all
- DKIM keys generated (2048-bit)
- DKIM public key in DNS
- DMARC record published
- DKIM signing tested and working
- DMARC reports being received

**7. Anti-Spam Configuration (3 items)**
- rspamd installed and running
- Spam threshold configured (score 8.0)
- Spam filter tested (GTUBE)

**8. Log Security (4 items)**
- Secure log permissions (640)
- Log rotation configured (30 days)
- Logwatch configured
- Automated security alerts

**9. System Hardening (3 items)**
- All packages updated
- Unattended upgrades configured
- Unnecessary services disabled

**10. Security Testing (3 items)**
- SSL Labs test (Grade A target)
- Email security test (9/10 or 10/10 target)
- Vulnerability scan completed

**Scoring:**
- **100% (50/50):** Excellent - Best practices implemented
- **95-99% (47-49):** Very Good - Minor improvements possible
- **90-94% (45-46):** Good - Meets minimum requirements
- **<90%:** Improvement needed before production

**Critical Must-Have Items:**
- [ ] Firewall configured (all ports)
- [ ] SSL/TLS 1.2+ only
- [ ] Not an open relay
- [ ] Fail2ban configured
- [ ] SPF/DKIM/DMARC configured

---

## Quick Start Guide

### Phase 1: Pre-Deployment (Day -1)

**1. Review All Documents** (30 minutes)
```bash
cd /media/munen/muneneENT/ementech/ementech-website/.agent-workspace/handoffs/to-deployment/email-server-ops-plan/
ls -la
# Read all 5 documents
```

**2. Complete Pre-Deployment Checklist** (1-2 hours)
```bash
# Open 01-pre-deployment-checklist.md
# Go through each item systematically
# Mark each item as complete
# Do NOT proceed until all items are complete
```

**3. System Backup** (30 minutes)
```bash
# Backup nginx config
tar -czf nginx-backup-$(date +%Y%m%d).tar.gz /etc/nginx/

# Backup PostgreSQL
sudo -u postgres pg_dumpall > postgres-backup-$(date +%Y%m%d).sql

# Backup SSL certificates
tar -czf letsencrypt-backup-$(date +%Y%m%d).tar.gz /etc/letsencrypt/

# Backup PM2 (if using)
pm2 save
cp -r ~/.pm2 ~/pm2-backup-$(date +%Y%m%d)

# Store backups off-site
scp -r *backup-* user@backup-server:/path/to/backup/
```

**4. Stakeholder Notification** (15 minutes)
- Send maintenance notice
- Schedule maintenance window
- Confirm on-call availability

### Phase 2: Deployment (Day 0-2)

**5. Follow Deployment Strategy** (5-7 hours)
```bash
# Open 02-deployment-strategy.md
# Follow each phase in order
# Complete Phase 1 (Preparation)
# Complete Phase 2 (Core Installation)
# Complete Phase 3 (DNS Configuration)
# Wait 24-48 hours for DNS propagation
# Complete Phase 4 (Service Activation)
# Complete Phase 5 (Full Integration)
```

**6. Configure Monitoring** (30 minutes)
```bash
# Open 03-resource-monitoring-guide.md
# Install monitoring tools
apt install monit logwatch fail2ban

# Configure Monit
# Copy Monit config from guide
systemctl enable monit && systemctl start monit

# Configure Logwatch
# Copy Logwatch config from guide

# Set up custom monitoring scripts
# Copy scripts from guide to /usr/local/bin/
chmod +x /usr/local/bin/monitor-*.sh

# Configure cron jobs
crontab -e
# Add monitoring scripts from guide
```

**7. Security Hardening** (2-3 hours)
```bash
# Open 05-security-hardening-checklist.md
# Go through all 50 items
# Mark each item as complete
# Test security configurations
# Verify SPF/DKIM/DMARC
```

**8. Testing and Verification** (1-2 hours)
- Send test emails
- Verify SPF/DKIM/DMARC
- Test webmail
- Test spam filtering
- Verify SSL/TLS
- Check for open relay
- Run security tests

### Phase 3: Operations (Ongoing)

**9. Daily Monitoring** (10 minutes/day)
```bash
# Run health check
/usr/local/bin/health-check.sh

# Review logs
tail -100 /var/log/mail.log | grep -i "error\|warning"

# Check mail queue
mailq
```

**10. Weekly Maintenance** (30 minutes/week)
- Review security logs
- Check blacklist status
- Review spam filtering effectiveness
- Test email sending/receiving
- Review resource usage trends

**11. Incident Response** (As needed)
```bash
# Open 04-incident-response-runbooks.md
# Identify the issue
# Follow the appropriate runbook
# Document the incident
# Update procedures to prevent recurrence
```

---

## Critical Success Factors

### Technical Requirements
1. **Sufficient Resources:** Clean up disk space or add storage (currently at 90%)
2. **No Open Relay:** Critical to prevent blacklisting
3. **SPF/DKIM/DMARC:** Required for email deliverability
4. **SSL/TLS:** TLS 1.2+ only for security
5. **Fail2ban:** Essential for brute force protection

### Operational Requirements
1. **Monitoring:** Must be in place before going live
2. **Backups:** Automated daily backups
3. **Documentation:** Keep all docs up to date
4. **Training:** Admin and user training
5. **Testing:** Test thoroughly before production

### Risk Management
1. **Rollback Plan:** Must be tested and ready
2. **Gradual Rollout:** Pilot users before full migration
3. **Communication:** Keep stakeholders informed
4. **Monitoring:** Watch closely during rollout
5. **Support:** Have on-call team ready

---

## Common Mistakes to Avoid

1. **Skipping pre-deployment checks** - Can lead to disaster
2. **Not testing backups** - Useless if not tested
3. **Ignoring disk space warnings** - Causes service failures
4. **Running as open relay** - Will get blacklisted
5. **Weak passwords** - Security breach waiting to happen
6. **Not configuring SPF/DKIM/DMARC** - Email will be marked as spam
7. **Skipping security hardening** - Easy target for attackers
8. **No monitoring** - Problems detected too late
9. **Big bang deployment** - Too risky for production
10. **Poor documentation** - Makes troubleshooting impossible

---

## Escalation Path

**Level 1 Issues** (Can be handled by deployment agent):
- Configuration errors
- Minor service issues
- Documentation questions
- Routine maintenance

**Level 2 Issues** (Require escalation):
- System crashes
- Security breaches
- Data loss
- Blacklisting
- Performance issues

**Level 3 Issues** (Emergency):
- Complete service outage
- Successful attack
- Data breach
- Legal/compliance issues

**Escalation Contacts:**
- Deployment Lead: _________________________
- System Administrator: _________________________
- Security Team: _________________________
- Management: _________________________

---

## Maintenance Schedule

**Daily (10 minutes):**
- Run health check script
- Review error logs
- Check mail queue
- Monitor resource usage

**Weekly (30 minutes):**
- Review security logs
- Check blacklist status
- Test email functionality
- Review spam filtering
- Resource usage trends

**Monthly (1-2 hours):**
- Update software packages
- Review and update documentation
- Test backup restores
- Security audit
- Performance review
- Capacity planning

**Quarterly (4-8 hours):**
- Disaster recovery test
- Security review and updates
- Architecture review
- Training for admins/users
- Compliance audit (if applicable)

---

## Performance Baselines

**Target Metrics:**
- Email processing rate: >100 emails/minute
- Queue processing time: <5 minutes
- IMAP response time: <1 second
- Webmail load time: <3 seconds
- Spam filter accuracy: >95%
- RAM usage: <80%
- Disk usage: <85%
- CPU load: <2.0 sustained

**Optimization Triggers:**
- Queue processing time >10 minutes
- IMAP timeouts increasing
- RAM usage >85% sustained
- CPU usage >80% sustained
- Disk usage >90%

---

## Contact Information

**Deployment Team:**
- Project Lead: _________________________
- System Administrator: _________________________
- Network Administrator: _________________________

**Support Contacts:**
- VPS Provider: _________________________
- DNS Provider: _________________________
- SSL Provider: Let's Encrypt (automated)

**Emergency Contacts:**
- On-Call Phone: _________________________
- Emergency Email: _________________________

---

## Next Steps

1. **Review all 5 documents** in this operations plan
2. **Complete pre-deployment checklist** (01-pre-deployment-checklist.md)
3. **Schedule deployment window** with stakeholders
4. **Prepare rollback plan** and test it
5. **Execute deployment** following strategy (02-deployment-strategy.md)
6. **Configure monitoring** (03-resource-monitoring-guide.md)
7. **Complete security hardening** (05-security-hardening-checklist.md)
8. **Train team** on incident response (04-incident-response-runbooks.md)
9. **Go live** with pilot users
10. **Monitor closely** for first 2 weeks

---

## Document Version History

**Version:** 1.0
**Date:** January 19, 2026
**Author:** Deployment Operations Agent
**Status:** Ready for Deployment

**Changes:**
- Initial version created
- Comprehensive deployment and operations plan developed
- All 5 core documents completed
- Reviewed for production readiness

**Next Review:** After deployment completion

---

## Appendix: Quick Reference Commands

### System Status
```bash
# Overall health
free -h && df -h && uptime

# Service status
systemctl status postfix dovecot rspamd postgresql nginx

# Mail queue
mailq

# Recent errors
tail -100 /var/log/mail.log | grep -i "error\|warning"
```

### Testing
```bash
# SMTP connection
telnet localhost 25

# IMAPS connection
openssl s_client -connect mail.ementech.co.ke:993

# Send test email
echo "Test" | mail -s "Test" test@example.com

# Test spam filter
echo "XJS*C4JDBQADN1.NSBN3*2IDNEN*GTUBE-STANDARD-ANTI-UBE-TEST-EMAIL*C.34X" | mail -s "Spam test" test@ementech.co.ke
```

### Security
```bash
# Check firewall
ufw status verbose

# Check fail2ban
fail2ban-client status

# Check SSL cert
certbot certificates

# Test SPF
dig TXT ementech.co.ke

# Test DKIM
dig TXT default._domainkey.ementech.co.ke

# Test DMARC
dig TXT _dmarc.ementech.co.ke

# Check for open relay
telnet mail.ementech.co.ke 25
```

### Maintenance
```bash
# Clean disk
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
# Backup configs
tar -czf email-configs-$(date +%Y%m%d).tar.gz /etc/postfix/ /etc/dovecot/ /etc/rspamd/

# Backup database
sudo -u postgres pg_dump mailserver > mailserver-$(date +%Y%m%d).sql

# Backup mail storage
tar -czf mail-data-$(date +%Y%m%d).tar.gz /var/mail/
```

---

**This operations plan is production-ready and immediately actionable. Follow it systematically for a successful email server deployment.**

**Last Updated:** January 19, 2026
**Document Status:** Complete and Ready for Deployment
