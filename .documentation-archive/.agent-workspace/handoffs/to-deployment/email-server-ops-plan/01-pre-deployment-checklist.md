# Pre-Deployment Checklist

## Overview
This checklist MUST be completed BEFORE starting the email server installation on the EmenTech VPS. The VPS currently hosts:
- ementech.co.ke (corporate website)
- app.ementech.co.ke (DumuWaks marketplace)

## System Information
- **VPS Platform**: Local Ubuntu system (development/testing environment)
- **OS**: Linux 6.14.0-37-generic
- **Current RAM**: 31GB total (21GB used, 2.4GB free, 9.8GB available)
- **Swap**: 8GB total (7.6GB used, 388MB free)
- **Disk (/)**: 190GB total (161GB used, 20GB free - 90% utilization)
- **Current Services**: nginx 1.24.0, PostgreSQL 16, Node.js v22.15.0
- **System Uptime**: 6 days, 11 hours

## Pre-Deployment Verification

### 1. System Backup
- [ ] **Full system backup completed**
  - [ ] Document root backed up (/var/www/html)
  - [ ] nginx configuration backed up (/etc/nginx/)
  - [ ] PostgreSQL databases backed up
  - [ ] PM2 process list exported (`pm2 save`)
  - [ ] SSL certificates backed up (/etc/letsencrypt/)
  - [ ] Backup stored in off-site location

- [ ] **Backup verified**
  - [ ] Backup integrity checked
  - [ ] Test restore performed on non-production system
  - [ ] Backup completion time logged

### 2. DNS Configuration Access
- [ ] **DNS provider access confirmed**
  - [ ] Login credentials for DNS provider (record them securely)
  - [ ] Current DNS records documented (A, MX, TXT, CNAME)
  - [ ] DNS TTL verified (should be 300-3600 seconds for changes)
  - [ ] Propagation time planned (24-48 hours recommended)

- [ ] **Required DNS records ready**
  - [ ] MX record: mail.ementech.co.ke (priority 10)
  - [ ] A record: mail.ementech.co.ke → VPS IP
  - [ ] TXT record: SPF (v=spf1 mx ~all)
  - [ ] TXT record: DKIM (generated during installation)
  - [ ] TXT record: DMARC (_dmarc.ementech.co.ke)

### 3. SSL/TLS Certificates
- [ ] **Certificate management verified**
  - [ ] Certbot installed and accessible
  - [ ] Certificate renewal timer checked
  - [ ] Current certificate expiration date logged
  - [ ] Wildcard certificate or SAN certificate available for:
    - [ ] mail.ementech.co.ke
    - [ ] webmail.ementech.co.ke (if using Roundcube)
  - [ ] Certificate chain完整性 verified

### 4. Disk Space Verification
- [ ] **Current disk space adequate**
  - [ ] Root partition (/): 20GB free (WARNING: Only 10% remaining)
  - [ ] Minimum 5GB free space required for email installation
  - [ ] Projected mail storage calculated (see formula below)

- [ ] **Disk cleanup performed (if needed)**
  - [ ] Old log files rotated/compressed
  - [ ] Package cache cleaned (`apt clean`)
  - [ ] Temporary files removed
  - [ ] Unneeded packages removed

- [ ] **Mail storage projection**
  - [ ] Number of email accounts: _____
  - [ ] Estimated emails per account per day: _____
  - [ ] Average email size (with attachments): _____ KB
  - [ ] Projected monthly growth: _____ GB
  - [ ] Recommended storage allocation: _____ GB

**⚠️ CRITICAL**: Current disk usage is at 90%. Consider adding additional storage or cleaning up BEFORE deployment.

### 5. Current Services Documentation
- [ ] **nginx configuration documented**
  - [ ] Virtual host files documented
  - [ ] SSL configuration documented
  - [ ] Reverse proxy rules documented
  - [ ] Custom configurations noted

- [ ] **PM2 applications documented**
  - [ ] Application list exported (`pm2 list`)
  - [ ] Startup script documented
  - [ ] Environment variables documented
  - [ ] Application dependencies documented

- [ ] **PostgreSQL databases documented**
  - [ ] Database list exported
  - [ ] Database sizes logged
  - [ ] Backup locations documented
  - [ ] Connection credentials secured

### 6. Network and Firewall
- [ ] **Firewall rules documented**
  - [ ] Current UFW rules exported (`ufw status numbered`)
  - [ ] Required email ports identified:
    - [ ] Port 25 (SMTP) - REQUIRED
    - [ ] Port 587 (Submission) - REQUIRED
    - [ ] Port 465 (SMTPS) - Optional but recommended
    - [ ] Port 143 (IMAP) - Optional
    - [ ] Port 993 (IMAPS) - REQUIRED
    - [ ] Port 110 (POP3) - Optional
    - [ ] Port 995 (POP3S) - Optional
  - [ ] ISP blocking checked (port 25 often blocked by residential ISPs)

- [ ] **Network connectivity verified**
  - [ ] Outbound port 25 connectivity tested
  - [ ] Inbound ports accessible (use `canyouseeme.org` or similar)
  - [ ] VPS provider's email policy reviewed

### 7. Rollback Planning
- [ ] **Rollback procedure documented**
  - [ ] System restore procedure written
  - [ ] Configuration file revert procedure documented
  - [ ] DNS revert procedure documented
  - [ ] Service restart order documented

- [ ] **Rollback triggers defined**
  - [ ] Service failure criteria defined
  - [ ] Performance degradation thresholds set
  - [ ] Security incident triggers identified

- [ ] **Rollback test performed**
  - [ ] Test restore performed on staging system
  - [ ] Restore time measured and documented
  - [ ] Rollback decision tree created

### 8. Maintenance Window Planning
- [ ] **Stakeholders notified**
  - [ ] EmenTech team notified
  - [ ] DumuWaks users notified (if applicable)
  - [ ] Maintenance window communicated (date/time)
  - [ ] Expected downtime communicated

- [ ] **Maintenance window scheduled**
  - [ ] Date: __________________
  - [ ] Time: __________________ (Timezone: _____)
  - [ ] Duration: _____ hours
  - [ ] Low-traffic period confirmed
  - [ ] On-call personnel assigned

- [ ] **Communication channels prepared**
  - [ ] Status page URL: __________________
  - [ ] Emergency contact: __________________
  - [ ] Update frequency defined (every 30 minutes?)

### 9. Resource Requirements
- [ ] **RAM requirements met**
  - [ ] Current free RAM: 2.4GB (before swap)
  - [ ] Available RAM: 9.8GB (including cache/buffer)
  - [ ] Email server RAM needed: 400-600MB
  - [ ] RAM buffer available: YES/NO
  - [ ] Swap configuration adequate (current: 7.6GB/8GB used - ⚠️ HIGH)

- [ ] **CPU requirements met**
  - [ ] Current load average: 1.01, 1.54, 1.51
  - [ ] CPU cores available: _____
  - [ ] Email processing CPU impact: LOW
  - [ ] CPU headroom available: YES/NO

- [ ] **I/O requirements met**
  - [ ] Disk I/O baseline measured
  - [ ] Email I/O impact estimated
  - [ ] I/O capacity adequate: YES/NO

**⚠️ WARNING**: Swap usage is at 95% (7.6GB/8GB used). Monitor closely during deployment.

### 10. Security Preparation
- [ ] **Security tools ready**
  - [ ] Fail2ban installation planned
  - [ ] UFW firewall configured
  - [ ] SSH hardening completed
  - [ ] Root login disabled via SSH

- [ ] **Security policy defined**
  - [ ] Password policy document created
  - [ ] Account creation procedure documented
  - [ ] Access control list defined
  - [ ] Incident response team identified

### 11. Monitoring Setup
- [ ] **Monitoring tools selected**
  - [ ] Logwatch or logcheck chosen
  - [ ] Monit or systemd monitoring chosen
  - [ ] Mail queue monitoring script ready
  - [ ] Resource monitoring tool configured

- [ ] **Alert destinations configured**
  - [ ] Administrator email: __________________
  - [ ] SMS/phone for critical alerts: __________________
  - [ ] Slack/Teams webhook (if applicable): __________________
  - [ ] Alert escalation path defined

### 12. Testing Strategy
- [ ] **Test accounts prepared**
  - [ ] Test email accounts created
  - [ ] Test email list prepared
  - [ ] External test contacts identified

- [ ] **Testing procedures documented**
  - [ ] SMTP send test procedure
  - [ ] IMAP/POP3 receive test procedure
  - [ ] Webmail login test procedure
  - [ ] Spam filter test procedure
  - [ ] DKIM/SPF/DMARC validation test procedure

### 13. Compliance and Legal
- [ ] **Legal requirements checked**
  - [ ] Data privacy compliance verified (GDPR, etc.)
  - [ ] Email retention policy defined
  - [ ] User consent mechanism prepared
  - [ ] Privacy policy updated

- [ ] **Email compliance**
  - [ ] CAN-SPAM compliance verified (if sending marketing emails)
  - [ ] unsubscribe mechanism prepared
  - [ ] Physical address included in email footer
  - [ ] Opt-in process documented

### 14. Documentation Preparation
- [ ] **Documentation templates ready**
  - [ ] System architecture diagram template
  - [ ] Configuration log template
  - [ ] Change log template
  - [ ] Incident report template

- [ ] **Knowledge base prepared**
  - [ ] Email server basics documented
  - [ ] Common procedures documented
  - [ ] Troubleshooting guide started
  - [ ] Vendor documentation links collected

### 15. Final Go/No-Go Decision
- [ ] **All checklist items completed**
- [ ] **Stakeholder approval obtained**
- [ ] **Risk assessment accepted**
- [ ] **Rollback plan tested**
- [ ] **Team availability confirmed**
- [ ] **Weather/current events checked** (no major disruptions expected)

---

## Sign-Off

**Deployment Lead**: _________________________ Date: __________

**System Owner**: _________________________ Date: __________

**Network Administrator**: _________________________ Date: __________

**Final Go/No-Go Decision**: ☐ GO  ☐ NO-GO

**Reason for No-Go**: _________________________________________________

---

## Quick Reference: Critical Commands

```bash
# Check disk space
df -h

# Check RAM usage
free -h

# Check current services
systemctl list-units --type=service --state=running

# Export firewall rules
ufw status numbered > /root/firewall-backup.txt

# Backup nginx config
tar -czf nginx-backup-$(date +%Y%m%d).tar.gz /etc/nginx/

# Backup PostgreSQL
pg_dumpall > postgres-backup-$(date +%Y%m%d).sql

# Export PM2 processes
pm2 list
pm2 save

# Check certificate expiration
certbot certificates

# Test DNS propagation
dig mail.ementech.co.ke
dig MX ementech.co.ke

# Test port connectivity
telnet mail.ementech.co.ke 25
```

## Disk Cleanup Commands (if needed)

```bash
# Clean package cache
sudo apt clean
sudo apt autoclean

# Remove unused packages
sudo apt autoremove

# Clean old logs
sudo journalctl --vacuum-time=7d

# Find large files (>100MB)
sudo find / -type f -size +100M -exec ls -lh {} \; 2>/dev/null

# Clean thumbnails
rm -rf ~/.cache/thumbnails/*
```

## Estimated Deployment Timeline

- Pre-deployment checks: 30 minutes
- Backup verification: 15 minutes
- DNS configuration: 15 minutes
- Email server installation: 2-3 hours
- Configuration and testing: 1-2 hours
- Monitoring setup: 30 minutes
- Documentation: 30 minutes
- Buffer time: 1 hour

**Total estimated time: 5-7 hours**

## Critical Warnings

1. ⚠️ **Disk space at 90%** - Clean up or add storage BEFORE deployment
2. ⚠️ **Swap usage at 95%** - Add RAM or optimize current usage
3. ⚠️ **Port 25 may be blocked** - Verify with VPS provider
4. ⚠️ **Production system** - One mistake can take down live sites
5. ⚠️ **Email reputation** - Misconfiguration can get you blacklisted

## Success Criteria

Deployment is considered successful when:
- [ ] All services are running (Postfix, Dovecot, PostgreSQL, rspamd)
- [ ] Test emails can be sent and received
- [ ] Webmail login is functional
- [ ] SPF/DKIM/DMARC records are valid
- [ ] No existing services are disrupted
- [ ] Monitoring and alerts are active
- [ ] Backup of new configuration completed
- [ ] Documentation updated
