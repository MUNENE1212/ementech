# EmenTech Email Server Implementation

**Status:** Ready for Implementation
**Version:** 1.0
**Date:** January 19, 2025
**Estimated Time:** 4-6 hours

## Overview

Complete, production-ready email server implementation guide for EmenTech (ementech.co.ke). This guide provides step-by-step instructions to deploy a full-featured email system with spam filtering, webmail, security hardening, monitoring, and automated backups.

## What's Included

### 1. Implementation Guide (40,000+ words)
**File:** `.agent-workspace/artifacts/email-server-implementation-guide.md`

16 detailed phases covering:
- System preparation and software installation
- Database setup (PostgreSQL)
- Postfix (SMTP) configuration
- Dovecot (IMAP/POP3) configuration
- SSL/TLS certificates (Let's Encrypt)
- DNS configuration
- Spam filtering (Rspamd with DKIM)
- Webmail (Roundcube)
- Email account creation (5 accounts)
- Comprehensive testing
- Security hardening (Fail2ban, firewall)
- Monitoring and alerts
- Automated backups
- Documentation and handoff

### 2. DNS Records Guide
**File:** `.agent-workspace/artifacts/dns-records.txt`

Complete DNS configuration:
- A, MX, SPF, DKIM, DMARC records
- Step-by-step instructions for major registrars
- Verification commands
- Troubleshooting guide

### 3. Testing Procedures
**File:** `.agent-workspace/artifacts/testing-procedures.md`

Comprehensive test suite:
- 10 major test categories
- Automated testing script included
- Online verification tools
- Pass/fail criteria

### 4. Maintenance & Emergency Procedures
**File:** `.agent-workspace/artifacts/maintenance-emergency-procedures.md`

Ongoing operations:
- Daily, weekly, monthly, quarterly checklists
- 6 emergency scenarios with resolution steps
- Backup and restore procedures
- Security and performance tuning

### 5. Executive Summary
**File:** `.agent-workspace/shared-context/email-server-project-summary.md`

Project overview:
- Technical specifications
- Timeline and resource requirements
- Risk assessment
- Success criteria

## Quick Start

### Prerequisites
- Ubuntu 24.04 LTS VPS (2GB RAM, 20GB disk)
- Root or sudo access
- Domain registrar access
- 4-6 hours available

### Before You Begin

1. **Read the Executive Summary**
   ```bash
   cat .agent-workspace/shared-context/email-server-project-summary.md
   ```

2. **Review the Implementation Guide**
   ```bash
   cat .agent-workspace/artifacts/email-server-implementation-guide.md
   ```

3. **Prepare DNS Records**
   ```bash
   cat .agent-workspace/artifacts/dns-records.txt
   ```

4. **Schedule Implementation Window**
   - Allow 4-6 hours
   - Consider email outage (if replacing existing system)
   - Have emergency contacts ready

### Implementation Steps

Follow the 16-phase guide in order:
```bash
# View the guide
less .agent-workspace/artifacts/email-server-implementation-guide.md

# Or open in your favorite editor
nano .agent-workspace/artifacts/email-server-implementation-guide.md
```

Each phase includes:
- Prerequisites check
- Exact commands to run
- Configuration files
- Verification steps
- Troubleshooting
- Rollback instructions

### Testing

After implementation:
```bash
# Run automated tests
sudo /usr/local/bin/test-mail-server.sh

# Follow full test suite
cat .agent-workspace/artifacts/testing-procedures.md
```

## Email Accounts

5 accounts will be created:

1. **ceo@ementech.co.ke** - CEO/Founder (2GB quota)
2. **info@ementech.co.ke** - General inquiries (1GB quota)
3. **support@ementech.co.ke** - Customer support (1GB quota)
4. **admin@ementech.co.ke** - System admin (2GB quota)
5. **tech@ementech.co.ke** - Technical team (1GB quota)

Passwords will be generated during implementation and stored in `/root/email-accounts.txt`

## Key Features

### Security
- TLS 1.2+ encryption
- Perfect Forward Secrecy
- SPF, DKIM, DMARC implementation
- Fail2ban intrusion prevention
- Rate limiting
- chroot jails

### Performance
- Optimized for 2GB RAM
- Disabled unnecessary plugins
- Connection limits
- PostgreSQL tuning
- Redis caching

### Reliability
- Automated daily backups
- SSL auto-renewal
- Monitoring and alerts
- Log rotation
- Disaster recovery procedures

## Support Resources

### Documentation
- Implementation Guide: `.agent-workspace/artifacts/email-server-implementation-guide.md`
- DNS Records: `.agent-workspace/artifacts/dns-records.txt`
- Testing: `.agent-workspace/artifacts/testing-procedures.md`
- Maintenance: `.agent-workspace/artifacts/maintenance-emergency-procedures.md`

### Quick Reference
After implementation, use:
```bash
# Server status dashboard
/root/mail-server-status.sh

# Quick reference guide
cat /root/mail-server-quickref.txt

# Full documentation
cat /root/mail-server-documentation.md
```

### Emergency Procedures
For emergencies, see:
```bash
cat .agent-workspace/artifacts/maintenance-emergency-procedures.md
```

Sections include:
- Server being used as spam relay
- Disk space full
- Email queue stuck
- SSL certificate expired
- Database corruption
- Complete system failure

## Architecture

```
Internet (Port 25, 587, 465, 993, 995, 443)
    ↓
Firewall (UFW + Fail2ban)
    ↓
Nginx (443) → Webmail (Roundcube)
    ↓
Postfix (25, 587, 465) ← Rspamd (Spam Filter)
    ↓
Dovecot (993, 995) ← PostgreSQL (Authentication)
    ↓
Mail Storage (/var/mail/vhosts/)
```

## Security Best Practices

This implementation follows industry best practices:

1. **Strong Authentication**
   - SHA512-CRYPT passwords
   - SASL authentication required
   - Rate limiting

2. **Encryption**
   - TLS 1.2+ only
   - Strong cipher suites
   - Perfect Forward Secrecy
   - SSL auto-renewal

3. **Network Security**
   - Firewall configured
   - Only necessary ports open
   - Fail2ban active
   - chroot jails

4. **Spam Prevention**
   - SPF (Sender Policy Framework)
   - DKIM (DomainKeys Identified Mail)
   - DMARC (Domain-based Message Authentication)
   - Rspamd filtering

## Maintenance Requirements

### Daily (5-10 minutes)
- Check server status
- Verify mail queue is empty
- Review logs for errors
- Check backup completed

### Weekly (30-45 minutes)
- Review mail queue analysis
- Check security logs
- Review spam filter effectiveness
- Test email deliverability

### Monthly (1-2 hours)
- Check SSL certificate expiry
- Review and update packages
- Review email account usage
- Test backup restore
- Review performance metrics

### Quarterly (3-4 hours)
- Full security audit
- Performance optimization review
- Capacity planning
- Business continuity planning

## Troubleshooting

### Common Issues

**Email not sending/receiving:**
```bash
# Check services
systemctl status postfix dovecot

# Check queue
mailq

# Check logs
tail -f /var/log/mail.log
```

**Authentication failures:**
```bash
# Test authentication
doveadm auth test user@ementech.co.ke password

# Check logs
tail -f /var/log/dovecot.log
```

**Spam filtering issues:**
```bash
# Check Rspamd status
rspamc stat

# Access web UI
https://mail.ementech.co.ke:11334
```

**Performance issues:**
```bash
# Check status
/root/mail-server-status.sh

# Check resources
free -h
df -h
uptime
```

## Cost Estimate

### One-Time Costs
- Implementation time: 4-6 hours

### Monthly Recurring Costs
- VPS hosting: [Your current cost]
- Domain: [Your current cost]
- SSL certificates: FREE (Let's Encrypt)
- Backup storage: $0-10 (if off-site)

## Timeline

- **Phase 1-3:** System setup (1 hour)
- **Phase 4-6:** Mail server configuration (1.5 hours)
- **Phase 7-9:** Security and spam filtering (1 hour)
- **Phase 10-12:** Webmail and testing (1.5 hours)
- **Phase 13-16:** Hardening, monitoring, handoff (1 hour)

**Total:** 4-6 hours

## Success Criteria

Implementation is successful when:
- [ ] All 5 email accounts created and working
- [ ] DNS records configured and propagated
- [ ] SPF, DKIM, DMARC all passing
- [ ] SSL certificates installed
- [ ] Webmail accessible and functional
- [ ] All tests passing
- [ ] Backups automated
- [ ] Monitoring active
- [ ] Staff trained
- [ ] Documentation complete

## Next Steps

1. **Review all documentation** (1 hour)
2. **Schedule implementation window** (4-6 hours)
3. **Backup existing server** (if applicable)
4. **Follow implementation guide** (4-6 hours)
5. **Test thoroughly** (1-2 hours)
6. **Train staff** (1 hour)
7. **Monitor closely** (first week)

## Contact

**Project Director:** Claude (AI Assistant)
**Date:** January 19, 2025
**Version:** 1.0

**Server:** ementech-mail.ementech.co.ke
**IP:** 69.164.244.165
**Domain:** ementech.co.ke

## License

This implementation guide is proprietary to EmenTech. All rights reserved.

---

**Status:** Ready for Implementation
**Last Updated:** 2025-01-19
**Document Version:** 1.0
