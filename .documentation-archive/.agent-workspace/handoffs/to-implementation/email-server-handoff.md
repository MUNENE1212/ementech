# Email Server Implementation Handoff

**Project**: EmenTech Email Server
**Date**: 2026-01-19
**From**: Architecture Agent
**To**: Implementation Team
**Status**: Ready for Implementation

---

## 1. Executive Summary

This document provides a comprehensive handoff for implementing a production-ready email server for EmenTech Technologies. The architecture is designed for a 2GB RAM VPS with 5 initial users, scaling to 100+ users.

**Key Highlights**:
- **Timeline**: 5 days (1 week)
- **Technology Stack**: Postfix, Dovecot, SQLite, Roundcube, Rspamd
- **Resource Usage**: ~180-500MB RAM (within 2GB budget)
- **Cost**: $15-25/month (vs $30-60/month for Google Workspace)
- **Scalability**: Path to 100 users, then dedicated server

---

## 2. Architecture Overview

### 2.1 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          INTERNET / CLOUD                                   │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │
                                      │ DNS: MX, SPF, DKIM, DMARC records
                                      │
┌─────────────────────────────────────▼───────────────────────────────────────┐
│                          DNS CLOUD FLAYER (Optional)                        │
│                  - DNS records for ementech.co.ke                            │
│                  - SPF: "v=spf1 mx a ip4:69.164.244.165 -all"                │
│                  - DKIM: ementech1._domainkey.ementech.co.ke                 │
│                  - DMARC: "_dmarc.ementech.co.ke p=reject"                   │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │
                                      │ Ports: 25, 587, 465, 993, 995, 80, 443
                                      │
┌─────────────────────────────────────▼───────────────────────────────────────┐
│                      FIREWALL LAYER (ufw)                                    │
│                    ┌──────────────────────┐                                  │
│                    │   Port Rules:        │                                  │
│                    │   - 25: SMTP (in/out)│                                  │
│                    │   - 587: Submission   │                                  │
│                    │   - 993: IMAPS       │                                  │
│                    │   - 995: POP3S       │                                  │
│                    │   - 443: HTTPS       │                                  │
│                    └──────────────────────┘                                  │
│                    ┌──────────────────────┐                                  │
│                    │   Rate Limiting:     │                                  │
│                    │   - SMTP: 10/min     │                                  │
│                    │   - SSH: 6 attempts  │                                  │
│                    └──────────────────────┘                                  │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    │                 │                 │
                    │                 │                 │
┌───────────────────▼───┐  ┌────────▼────────┐  ┌───────▼────────┐
│   SMTP (Port 25)      │  │ IMAPS (993)     │  │ HTTPS (443)    │
│   Submission (587)    │  │ POP3S (995)     │  │ HTTP (80)      │
└───────────────────┬───┘  └────────┬────────┘  └───────┬────────┘
                    │                │                   │
┌───────────────────▼────────────────▼───────────────────▼───────────────────┐
│                         POSTFIX (MTA)                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  - SMTP server (inbound/outbound)                                  │   │
│  │  - TLS encryption (mandatory on 587, opportunistic on 25)         │   │
│  │  - SASL authentication (via Dovecot)                               │   │
│  │  - Virtual user support (SQLite)                                   │   │
│  │  - Queue management                                                │   │
│  │  - DKIM signing (via OpenDKIM)                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────┬───────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        │                 │                 │
┌───────▼─────────┐  ┌───▼──────────┐  ┌──▼──────────────┐
│   DOVECOT       │  │  OpenDKIM    │  │  Rspamd         │
│   (MDA/LDA)     │  │  (DKIM sign) │  │  (Spam Filter)  │
├─────────────────┤  └─────────────┘  └─────────────────┤
│  - IMAP server  │                                      │
│  - POP3 server  │         ┌──────────────────────────┐ │
│  - SASL auth    │         │  Rspamd Components:      │ │
│  - Maildir      │         │  - Spam scanning         │ │
│  - Sieve        │         │  - DKIM validation       │ │
│  - Quota        │         │  - SPF validation        │ │
└───────┬─────────┘         │  - DMARC validation      │ │
        │                   │  - Greylisting           │ │
        │                   │  - Redis caching         │ │
        │                   └──────────────────────────┘ │
        │                                              │
        └──────────────────┬───────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
┌───────▼────────┐  ┌──────▼───────┐  ┌──────▼──────────┐
│  SQLite DB     │  │  Redis       │  │  Maildir Storage│
│  (Virtual User)│  │  (Cache)     │  │  /var/vmail/    │
├────────────────┤  └──────────────┘  │  - ementech.co.ke/
│  - users       │                     │    - ceo/       │
│  - aliases     │                     │    - info/      │
│  - domains     │                     │    - support/   │
│  - senders     │                     │    - admin/     │
└────────────────┘                     │    - tech/      │
                                       └─────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                         WEBMAIL ACCESS LAYER                                │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  User Browser -> https://webmail.ementech.co.ke                     │   │
│  │       ↓                                                             │   │
│  │  nginx (reverse proxy) -> PHP-FPM                                   │   │
│  │       ↓                                                             │   │
│  │  Roundcube (webmail application)                                    │   │
│  │       ├─→ IMAPS (Dovecot) - Read/manage emails                     │   │
│  │       └─→ SMTP (Postfix) - Send emails                             │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                        MONITORING & MANAGEMENT                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────────┐           │
│  │  Logwatch       │  │  fail2ban       │  │  Backup Scripts  │           │
│  │  (Daily reports)│  │  (Brute-force)  │  │  (Daily backups) │           │
│  └─────────────────┘  └─────────────────┘  └──────────────────┘           │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Email Flow Diagrams

**Incoming Email Flow**:
```
[Sender]
    ↓ SMTP (port 25)
[Firewall + fail2ban]
    ↓ (rate limited)
[Rspamd: Spam check]
    ↓ (if spam: tag/deliver to Junk)
[Postfix: Receive]
    ↓ (lookup recipient)
[SQLite: Virtual user query]
    ↓ (get maildir path)
[Dovecot: Local delivery]
    ↓ (Maildir format)
[Maildir: /var/vmail/domain/user/new/]
    ↓
[User access via IMAPS/Webmail]
```

**Outgoing Email Flow**:
```
[User: Webmail/Email Client]
    ↓ SMTP (port 587, TLS)
[Firewall + fail2ban]
    ↓ (authenticated)
[Postfix: Receive]
    ↓ (SASL auth via Dovecot)
[Dovecot: Authenticate user]
    ↓ (check credentials)
[SQLite: User lookup]
    ↓ (if valid: proceed)
[Rspamd: Spam/malware scan]
    ↓ (add headers)
[OpenDKIM: Sign with DKIM]
    ↓ (add signature)
[Postfix: Deliver]
    ↓
[Recipient Mail Server]
```

**Webmail Access Flow**:
```
[User Browser]
    ↓ HTTPS (port 443)
[nginx: Reverse proxy]
    ↓ (proxy to PHP-FPM)
[PHP-FPM: Execute Roundcube]
    ↓
[Roundcube: Web interface]
    ├─→ IMAPS (Dovecot: Read emails)
    └─→ SMTP (Postfix: Send emails)
```

---

## 3. Technology Stack Summary

### 3.1 Core Components

| Component | Technology | Version | Purpose | RAM |
|-----------|-----------|---------|---------|-----|
| **MTA** | Postfix | 3.7+ | Mail transfer agent | 30-100MB |
| **MDA** | Dovecot | 2.3+ | Mail delivery agent | 50-200MB |
| **Database** | SQLite | 3 | Virtual user storage | 0MB |
| **Webmail** | Roundcube | 1.6+ | Web interface | 30-80MB |
| **Spam Filter** | Rspamd | 3.x | Spam/malware filtering | 50MB |
| **Cache** | Redis | 7.x | Rspamd cache | 20-50MB |
| **Web Server** | nginx | 1.24+ | Reverse proxy | 0-20MB |
| **Firewall** | ufw | - | Packet filtering | Minimal |
| **Brute-force Protection** | fail2ban | - | Ban attackers | Minimal |
| **DKIM** | OpenDKIM | 2.11+ | Email signing | Minimal |
| **TLS** | Let's Encrypt | - | SSL certificates | Minimal |

**Total RAM Usage**: ~180-500MB (well within 2GB budget)

### 3.2 Software Justification

See **email-server-tech-decisions.md** for detailed analysis of:
- Why Postfix over Exim/Sendmail
- Why Dovecot over Courier
- Why SQLite over MySQL/PostgreSQL
- Why Roundcube over Rainloop
- Why Rspamd over SpamAssassin
- Why skip ClamAV initially

---

## 4. Data Model

### 4.1 Database Schema

**Database**: SQLite (`/etc/postfix/virtual_mailboxes.db`)

**Tables**:
- **users**: Email accounts (email, password, name, quota)
- **aliases**: Email forwarding (source → destination)
- **domains**: Virtual domains (domain, active)
- **senders**: DKIM signing configuration

**Example Data**:
```sql
-- Users
INSERT INTO users (email, password, name, domain, user, home, maildir, quota) VALUES
('ceo@ementech.co.ke', '$6$rounds=5000$hash...', 'CEO', 'ementech.co.ke', 'ceo',
 '/var/vmail/ementech.co.ke/ceo', 'ementech.co.ke/ceo/', 2147483648);

-- Aliases
INSERT INTO aliases (source, destination, domain) VALUES
('sales@ementech.co.ke', 'ceo@ementech.co.ke,info@ementech.co.ke', 'ementech.co.ke');
```

See **email-server-data-model.md** for complete schema and SQL scripts.

### 4.2 Maildir Structure

```
/var/vmail/
└── ementech.co.ke/
    └── username/
        ├── cur/        # Read emails
        ├── new/        # Unread emails
        ├── tmp/        # Temporary storage
        ├── dovecot*    # Dovecot index files
        └── maildirsize # Quota information
```

---

## 5. Implementation Plan

### 5.1 Timeline Overview

| Phase | Duration | Tasks | Deliverable |
|-------|----------|-------|-------------|
| **Phase 1** | Day 1 | Core components installation | Working Postfix + Dovecot |
| **Phase 2** | Day 2 | Security configuration | TLS, Rspamd, firewall |
| **Phase 3** | Day 3 | Webmail installation | Roundcube working |
| **Phase 4** | Day 4 | Email authentication | SPF, DKIM, DMARC configured |
| **Phase 5** | Day 5 | Monitoring and backup | Monitoring scripts, backups |

**Total Timeline**: 5 business days (1 week)

### 5.2 Detailed Implementation Steps

See **email-server-implementation-guide.md** for complete step-by-step instructions:

**Phase 1: Core Components (Day 1)**
1. Install dependencies
2. Create virtual mail user
3. Initialize SQLite database
4. Install and configure Postfix
5. Install and configure Dovecot
6. Create initial users
7. Test basic email flow

**Phase 2: Security (Day 2)**
1. Configure firewall (ufw)
2. Install and configure fail2ban
3. Install and configure Rspamd
4. Configure TLS/SSL
5. Test security controls

**Phase 3: Webmail (Day 3)**
1. Install PHP and PHP-FPM
2. Download and install Roundcube
3. Configure Roundcube
4. Configure nginx virtual host
5. Test webmail access

**Phase 4: Email Authentication (Day 4)**
1. Configure SPF (DNS TXT record)
2. Generate and configure DKIM keys
3. Configure DMARC (DNS TXT record)
4. Test email authentication

**Phase 5: Monitoring (Day 5)**
1. Install Logwatch
2. Configure monitoring scripts
3. Configure backup scripts
4. Create user management scripts
5. Final testing and documentation

### 5.3 Pre-Implementation Checklist

- [ ] Verify VPS has 2GB RAM and 29GB disk free
- [ ] Verify existing services (nginx, Node.js) are running
- [ ] Verify wildcard SSL certificate exists
- [ ] Plan DNS changes (A records, MX, SPF, DKIM, DMARC)
- [ ] Backup existing configuration
- [ ] Schedule maintenance window (optional, no downtime expected)
- [ ] Prepare user passwords for 5 accounts
- [ ] Set up backup destination (remote server or cloud)

---

## 6. Network Configuration

### 6.1 Port Allocation

| Port | Protocol | Service | Direction | Purpose |
|------|----------|---------|-----------|---------|
| 25 | TCP | SMTP | Inbound/Outbound | Server-to-server email |
| 587 | TCP | SMTP | Inbound/Outbound | Mail submission (TLS) |
| 465 | TCP | SMTPS | Inbound/Outbound | Legacy SMTP (TLS) |
| 993 | TCP | IMAPS | Inbound | Encrypted IMAP |
| 995 | TCP | POP3S | Inbound | Encrypted POP3 |
| 80 | TCP | HTTP | Inbound | Webmail redirect |
| 443 | TCP | HTTPS | Inbound | Webmail interface |
| 11334 | TCP | HTTP | Local only | Rspamd controller |
| 6379 | TCP | Redis | Local only | Rspamd cache |

### 6.2 Firewall Rules

```bash
# Allowed ports
ufw allow 22/tcp    # SSH (rate limited)
ufw allow 25/tcp    # SMTP
ufw allow 587/tcp   # SMTP submission
ufw allow 465/tcp   # SMTPS
ufw allow 993/tcp   # IMAPS
ufw allow 995/tcp   # POP3S
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS

# SMTP rate limiting
ufw route allow proto tcp from any to any port 25 limit 10/minute
```

### 6.3 DNS Configuration

**Required DNS Records**:

```
; A Records
mail.ementech.co.ke.          IN  A   69.164.244.165
webmail.ementech.co.ke.       IN  A   69.164.244.165

; MX Record
ementech.co.ke.               IN  MX  10  mail.ementech.co.ke.

; TXT Records
ementech.co.ke.               IN  TXT  "v=spf1 mx a ip4:69.164.244.165 -all"

; DMARC
_dmarc.ementech.co.ke.        IN  TXT  "v=DMARC1; p=reject; rua=mailto:dmarc@ementech.co.ke; aspf=s; adkim=s; pct=100"

; DKIM (after key generation)
ementech1._domainkey.ementech.co.ke.  IN  TXT  "v=DKIM1; k=rsa; p=<public-key>"
```

---

## 7. Security Architecture

### 7.1 Security Layers

1. **Network Security**: ufw firewall + fail2ban
2. **Transport Security**: TLS/SSL (mandatory on 587, 993, 995)
3. **Authentication Security**: SASL (CRAM-MD5, DIGEST-MD5)
4. **Email Authentication**: SPF, DKIM, DMARC
5. **Content Security**: Rspamd spam/malware filtering
6. **Isolation**: Virtual users, chroot jails

### 7.2 SSL/TLS Configuration

**Certificate**: Let's Encrypt wildcard (`*.ementech.co.ke`)
**Protocols**: TLSv1.2, TLSv1.3 only
**Ciphers**: ECDHE-ECDSA-AES128-GCM-SHA256, ECDHE-RSA-AES128-GCM-SHA256
**Forward Secrecy**: Enabled

### 7.3 Email Authentication

- **SPF**: Authorizes server IP 69.164.244.165
- **DKIM**: Signs all outbound emails
- **DMARC**: Reject policy with reporting

---

## 8. Backup Strategy

### 8.1 Backup Components

**What to Backup**:
1. **Mail storage**: `/var/vmail` (critical)
2. **Database**: `/etc/postfix/virtual_mailboxes.db`
3. **Configuration**: `/etc/postfix`, `/etc/dovecot`
4. **SSL certificates**: `/etc/letsencrypt`
5. **DKIM keys**: `/etc/postfix/dkim`

### 8.2 Backup Schedule

| Backup Type | Frequency | Retention | Location |
|-------------|-----------|-----------|----------|
| Mail storage | Daily | 30 days | Remote server |
| Database | Daily | 90 days | Remote server |
| Configuration | On change | 365 days | Remote server |

**Backup script**: `/usr/local/bin/backup-mail.sh` (runs daily at 2 AM)

### 8.3 Restore Procedures

See **email-server-implementation-guide.md** Section 8 for detailed restore procedures.

---

## 9. Monitoring and Alerting

### 9.1 Monitoring Components

**Logwatch**: Daily email reports to admin@ementech.co.ke
**Custom monitoring script**: Checks queue, disk, RAM, services (runs every 5 min)

### 9.2 Alert Conditions

| Condition | Threshold | Action |
|-----------|-----------|--------|
| Queue full | >1000 messages | Email alert |
| Disk full | >90% /var/vmail | Email alert |
| Service down | Postfix/Dovecot stopped | Email alert |
| High spam | >50% spam ratio | Email alert |
| Brute force | >100 fail2ban bans/day | Email alert |

---

## 10. Testing Procedures

### 10.1 Unit Tests

- Postfix: Send/receive local mail
- Dovecot: Authenticate with test account
- Rspamd: Spam filter with GTUBE
- Roundcube: Login, compose, send

### 10.2 Integration Tests

- External email: Send to Gmail, receive from Gmail
- Webmail: Full workflow (login, read, compose, attach)
- Mobile: Test with iOS/Android mail client
- Autodiscovery: Test with Thunderbird/Outlook

### 10.3 Security Tests

- TLS: Test with openssl s_client
- Authentication: Test SASL mechanisms
- Spam filter: Send GTUBE test
- Email auth: Verify SPF/DKIM/DMARC

See **email-server-implementation-guide.md** Section 7 for detailed test procedures.

---

## 11. User Management

### 11.1 Initial Users

| Email | Name | Password | Quota |
|-------|------|----------|-------|
| ceo@ementech.co.ke | CEO | [Set during install] | 2GB |
| info@ementech.co.ke | Info Desk | [Set during install] | 2GB |
| support@ementech.co.ke | Support Team | [Set during install] | 2GB |
| admin@ementech.co.ke | Administrator | [Set during install] | 2GB |
| tech@ementech.co.ke | Technical Support | [Set during install] | 2GB |

### 11.2 Management Scripts

All scripts located in `/usr/local/bin/`:

- `add-mail-user.sh`: Add new email user
- `delete-mail-user.sh`: Delete user (with backup)
- `change-mail-password.sh`: Change user password
- `list-mail-users.sh`: List all users
- `add-mail-alias.sh`: Add email alias/forwarding

See **email-server-data-model.md** Section 5 for script details.

---

## 12. Risk Mitigation

### 12.1 Identified Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| VPS runs out of RAM | Medium | High | Monitor, configure limits |
| Spam flood | High | Medium | Rate limiting, Rspamd |
| Brute force attack | High | Medium | fail2ban, strong passwords |
| Disk space exhaustion | Medium | High | Monitor, quotas |
| Data loss | Low | Critical | Daily backups |
| Security breach | Low | Critical | TLS, SPF, DKIM, DMARC |

### 12.2 Rollback Plan

If critical failure occurs:
1. Stop mail services
2. Restore DNS to previous state
3. Restore from backup
4. Verify email flow
5. Document and investigate

---

## 13. Scalability Roadmap

### 13.1 Growth Stages

**Stage 1: Current (0-6 months, 5-10 users)**
- Single VPS, 2GB RAM
- SQLite database
- Rspamd only (no ClamAV)

**Stage 2: Growth (6-18 months, 10-25 users)**
- Upgrade to 4GB RAM VPS
- Add MySQL
- Add ClamAV
- Add Redis

**Stage 3: Expansion (18-36 months, 25-100 users)**
- Dedicated mail server (4-8GB RAM)
- High availability setup
- Archiving solution

### 13.2 Upgrade Triggers

| Metric | Current | Warning | Critical | Action |
|--------|---------|---------|----------|--------|
| RAM usage | 25% | 85% | 95% | Add swap/upgrade |
| Disk usage | 35% | 70% | 85% | Add storage |
| User count | 5 | 25 | 50 | Plan upgrade |

---

## 14. Documentation

### 14.1 Architecture Documents

- **email-server-architecture.md**: Complete system design (this handoff)
- **email-server-tech-decisions.md**: Technology choices with trade-off analysis
- **email-server-data-model.md**: Database schema and user management
- **email-server-implementation-guide.md**: Step-by-step installation guide

### 14.2 End-User Documentation

**To be created**:
1. **User Guide**: How to access webmail, configure email clients
2. **Admin Guide**: How to manage users, monitor system
3. **Troubleshooting Guide**: Common issues and solutions

---

## 15. Post-Implementation Checklist

### 15.1 Immediate (After Installation)

- [ ] Postfix installed and running
- [ ] Dovecot installed and running
- [ ] Can send email locally
- [ ] Can receive email locally
- [ ] Can send email externally (to Gmail)
- [ ] Can receive email externally (from Gmail)
- [ ] TLS/SSL working (port 587, 993, 995)
- [ ] Webmail accessible (https://webmail.ementech.co.ke)
- [ ] Rspamd filtering spam (test with GTUBE)
- [ ] SPF record configured and verified
- [ ] DKIM signing working
- [ ] DMARC record configured and verified
- [ ] Firewall configured and verified
- [ ] fail2ban running and banning
- [ ] Backup script scheduled
- [ ] Monitoring script scheduled
- [ ] Logwatch configured
- [ ] All 5 users created and tested

### 15.2 Week 1 (After Implementation)

- [ ] Train users on webmail access
- [ ] Train users on email client configuration (Outlook, Thunderbird, mobile)
- [ ] Document user passwords
- [ ] Create admin procedures document
- [ ] Test disaster recovery (restore from backup)
- [ ] Review system performance
- [ ] Adjust spam filter settings

### 15.3 Month 1 (After Implementation)

- [ ] Review backup logs
- [ ] Review spam filter accuracy
- [ ] Review security logs (fail2ban)
- [ ] Optimize performance if needed
- [ ] Update documentation with lessons learned

---

## 16. Success Criteria

The implementation will be considered successful when:

1. **Functionality**:
   - All 5 users can send/receive email
   - Webmail is accessible and functional
   - Email clients (mobile/desktop) can connect

2. **Security**:
   - TLS is enforced for all protocols
   - SPF, DKIM, DMARC are configured and verified
   - fail2ban is banning brute-force attempts
   - Rspamd is filtering spam effectively

3. **Reliability**:
   - Services are stable (no crashes in first week)
   - Backups are running successfully
   - Monitoring is working (alerts received when needed)

4. **Performance**:
   - RAM usage <60% (1.2GB)
   - Disk usage <50% (15GB)
   - Email delivery <5 minutes
   - Webmail load time <3 seconds

5. **User Satisfaction**:
   - Users can access email independently
   - No major usability issues
   - Positive feedback on webmail interface

---

## 17. Support and Maintenance

### 17.1 Daily Tasks

- Monitor mail queue (mailq)
- Check logs for errors (/var/log/mail.log)
- Review fail2ban bans
- Verify backup completion

### 17.2 Weekly Tasks

- Review disk usage (/var/vmail)
- Review RAM usage (free -h)
- Review spam filter statistics (rspamc stat)
- Review user count and storage

### 17.3 Monthly Tasks

- Review and update spam filter rules
- Test backup restoration
- Review user accounts (remove unused)
- Clean up old emails from Trash
- Review security updates

### 17.4 Quarterly Tasks

- Full security audit
- Performance review and optimization
- User training refresher
- Disaster recovery test
- Review scaling needs

---

## 18. Next Steps

### 18.1 Immediate Actions

1. **Review architecture** (1 hour):
   - Read all architecture documents
   - Verify technology choices
   - Identify any concerns

2. **Schedule implementation** (15 min):
   - Set start date (Monday recommended)
   - Reserve 5 business days
   - Plan for testing time

3. **Prepare environment** (30 min):
   - Verify VPS resources
   - Check existing services
   - Backup current configuration
   - Plan DNS changes

4. **Begin implementation** (5 days):
   - Follow **email-server-implementation-guide.md**
   - Complete each phase
   - Test thoroughly

### 18.2 Questions or Concerns

If you have questions during implementation:
1. Review the architecture documents
2. Check the implementation guide
3. Consult official documentation (Postfix, Dovecot, etc.)
4. Search community forums (Postfix mailing list, Dovecot wiki)

---

## 19. Contact Information

**Architecture Team**: [Contact details]
**Implementation Team**: [Contact details]
**Emergency Contact**: [Contact details]

---

## 20. Appendix

### 20.1 Quick Reference

**Key Files**:
- Configuration: `/etc/postfix/main.cf`, `/etc/dovecot/dovecot.conf`
- Database: `/etc/postfix/virtual_mailboxes.db`
- Mail storage: `/var/vmail/`
- Logs: `/var/log/mail.log`
- Webmail: `/var/www/roundcube/`

**Key Commands**:
```bash
# Check queue
mailq

# Restart services
systemctl restart postfix dovecot

# View logs
tail -f /var/log/mail.log

# Test authentication
doveadm auth test user@domain.com

# Check spam stats
rspamc stat
```

### 20.2 Useful Resources

**Official Documentation**:
- Postfix: https://www.postfix.org/documentation.html
- Dovecot: https://wiki.dovecot.org/
- Roundcube: https://roundcube.net/documentation/
- Rspamd: https://rspamd.com/doc/

**Community Resources**:
- Postfix mailing list: https://www.postfix.org/lists.html
- Dovecot mailing list: https://dovecot.org/mailman/listinfo/dovecot
- Server Fault: https://serverfault.com/

---

## Conclusion

This architecture provides a production-ready, secure, and scalable email server for EmenTech Technologies. The design prioritizes:

- **Security**: TLS, SPF, DKIM, DMARC, fail2ban, Rspamd
- **Efficiency**: Low memory footprint (<25% of RAM)
- **Scalability**: Clear path from 5 to 100+ users
- **Reliability**: Proven technologies, backup strategy
- **Cost-effectiveness**: $15-25/month vs $30-60/month for cloud services

**Implementation Timeline**: 5 business days
**Expected Outcome**: Fully functional email system ready for production use

**Good luck with the implementation!**

---

**Document Version**: 1.0
**Date**: 2026-01-19
**Status**: Ready for Implementation
**Next Review**: After implementation (Day 5)
