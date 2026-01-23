# Self-Hosting Email for Small Businesses: Comprehensive Research Report (2025)

**Prepared for:** Ementech Technologies (ementech.co.ke)
**Date:** January 19, 2025
**Target Environment:** 2GB RAM VPS with existing nginx and Node.js services
**Expected Users:** 1-5 email accounts

---

## Executive Summary

Self-hosting email in 2025 remains viable for small businesses but requires careful planning, security configuration, and ongoing maintenance. Based on extensive research, the **recommended stack** for a 2GB RAM VPS is:

- **MTA:** Postfix (secure, modular, excellent performance)
- **IMAP/POP3:** Dovecot (industry standard, low resource usage)
- **Spam Filtering:** Rspamd (modern, efficient, superior to SpamAssassin)
- **Virus Scanning:** ClamAV (optional due to resource constraints)
- **Webmail:** SnappyMail (lightweight, active development)
- **Database:** SQLite (minimal overhead for <10 users)
- **Web Administration:** Modoboa or Postfixadmin

**Critical Success Factors:**
1. Proper DNS configuration (SPF, DKIM, DMARC) - NON-NEGOTIABLE
2. IP warm-up strategy (2-4 weeks for full deliverability)
3. Regular monitoring and maintenance
4. Automated backup strategy
5. Security-first configuration

**Estimated Resource Usage:**
- Base email services: ~400-600MB RAM
- With spam filtering: ~600-900MB RAM
- With ClamAV: ~800MB-1.2GB RAM (tight on 2GB VPS)
- Recommended: Skip ClamAV or use external filtering service

---

## Table of Contents

1. [Software Stack Analysis](#1-software-stack-analysis)
2. [Security & Deliverability](#2-security--deliverability-critical)
3. [VPS Resource Optimization](#3-vps-resource-optimization)
4. [2025 Best Practices](#4-2025-best-practices)
5. [Common Pitfalls & Solutions](#5-common-pitfalls--solutions)
6. [Deliverability Optimization](#6-deliverability-optimization)
7. [Implementation Checklist](#7-implementation-checklist)
8. [DNS Configuration Templates](#8-dns-configuration-templates)
9. [Troubleshooting Guide](#9-troubleshooting-guide)
10. [Monitoring & Maintenance](#10-monitoring--maintenance)

---

## 1. Software Stack Analysis

### 1.1 Mail Transfer Agent (MTA) Comparison

#### **Postfix** ⭐ RECOMMENDED

**Strengths:**
- **Security:** Excellent track record, modular design with privilege separation
- **Performance:** Efficient queue management, good concurrency handling
- **Flexibility:** Highly configurable, extensive documentation
- **Community:** Largest community, regular security updates
- **Compatibility:** Works seamlessly with Dovecot, Rspamd, etc.

**Best Configuration for 2GB RAM:**
```bash
# /etc/postfix/main.cf - Key optimizations
queue_minfree = 100000000           # 100MB free space required
message_size_limit = 25600000       # 25MB max message size
mailbox_size_limit = 1000000000     # 1GB per mailbox
smtpd_client_connection_count_limit = 10
smtpd_client_connection_rate_limit = 30
default_process_limit = 100
```

**Resource Usage:** ~50-100MB RAM base, scales with queue size

---

#### **Exim**

**Strengths:**
- Highly flexible ACL system for complex routing
- Excellent built-in filtering capabilities
- Default MTA for Debian/Ubuntu

**Weaknesses for Small VPS:**
- More complex configuration
- Slightly higher memory usage
- Steeper learning curve

**Verdict:** Choose Exim only if you need its advanced filtering/routing capabilities

---

#### **Qmail / Netqmail**

**Status:** Legacy - NOT RECOMMENDED for new deployments

**Issues:**
- Inactive core development (only through forks)
- Lacks modern features (DKIM signing requires patches)
- Limited community support
- Non-standard configuration

**Verdict:** Avoid for new installations in 2025

---

### MTA Comparison Table

| Feature | Postfix | Exim | Qmail |
|---------|---------|------|-------|
| **Active Development** | ✅ Excellent | ✅ Good | ❌ Minimal |
| **Security Record** | ✅ Excellent | ✅ Good | ⚠️ Dated |
| **Performance** | ✅ Excellent | ✅ Good | ✅ Good |
| **Memory Usage** | ✅ Low (~50-100MB) | ⚠️ Medium (~80-150MB) | ✅ Low (~40-80MB) |
| **Configuration Ease** | ✅ Good | ⚠️ Complex | ⚠️ Non-standard |
| **Community Support** | ✅ Excellent | ✅ Good | ❌ Limited |
| **DKIM Support** | ✅ Native (via milter) | ✅ Native | ❌ Requires patches |
| **Documentation** | ✅ Extensive | ✅ Good | ⚠️ Outdated |
| **2025 Recommendation** | ⭐ **CHOSEN** | ✅ Alternative | ❌ Avoid |

---

### 1.2 IMAP/POP3 Server Comparison

#### **Dovecot** ⭐ RECOMMENDED

**Strengths:**
- **Performance:** Highly efficient, handles thousands of concurrent connections
- **Scalability:** Excellent from single user to enterprise deployments
- **Features:** Modern IMAP4rev1, POP3, Sieve scripting, full-text search
- **Security:** Strong SSL/TLS support, multiple authentication mechanisms
- **Management:** Easy virtual user configuration, excellent tools

**Best Configuration for 2GB RAM:**
```bash
# /etc/dovecot/conf.d/10-master.conf - Process limits
service imap-login {
  service_count = 0           # Create new process per connection
  process_min_avail = 2       # Pre-create 2 processes
  vsz_limit = 256M            # Per-process memory limit
}

service pop3-login {
  service_count = 0
  process_min_avail = 1
  vsz_limit = 256M
}

service imap {
  process_limit = 50          # Max concurrent IMAP processes
  vsz_limit = 512M
}

service pop3 {
  process_limit = 20
  vsz_limit = 256M
}

# /etc/dovecot/conf.d/20-imap.conf - Protocol optimizations
protocol imap {
  mail_plugins = $mail_plugins quota imap_quota
  imap_max_line_length = 64k
  imap_idle_timeout = 29 mins     # Save resources
}
```

**Resource Usage:** ~100-200MB RAM for 5 users

---

#### **Courier IMAP**

**Status:** Legacy - NOT RECOMMENDED

**Weaknesses:**
- Less active development
- Inferior performance at scale
- Less efficient memory usage
- Fewer modern features

**Verdict:** Dovecot is superior in every metric for 2025

---

### IMAP Server Comparison Table

| Feature | Dovecot | Courier IMAP |
|---------|---------|--------------|
| **Active Development** | ✅ Excellent | ⚠️ Minimal |
| **Performance** | ✅ Superior | ⚠️ Good |
| **Concurrency** | ✅ Excellent | ⚠️ Limited |
| **Memory Efficiency** | ✅ Excellent | ⚠️ Good |
| **Sieve Support** | ✅ Native | ❌ Limited |
| **Full-Text Search** | ✅ Excellent FTS | ⚠️ Basic |
| **Virtual Users** | ✅ Excellent | ✅ Good |
| **Documentation** | ✅ Extensive | ⚠️ Outdated |
| **Community** | ✅ Largest | ⚠️ Small |
| **2025 Recommendation** | ⭐ **CHOSEN** | ❌ Avoid |

---

### 1.3 Spam Filtering Solutions

#### **Rspamd** ⭐ RECOMMENDED

**Strengths:**
- **Modern Architecture:** Event-driven, written in C for performance
- **Efficiency:** Significantly lower CPU/memory than SpamAssassin
- **Features:**
  - Built-in DKIM/DMARC/ARC verification
  - Machine learning algorithms
  - Redis integration for caching
  - HTTP API for management
  - Greylisting and rate limiting
- **Integration:** Excellent Postfix integration via milter protocol

**Performance for 2GB RAM:**
- Base usage: ~100-200MB RAM
- With Redis: +50MB RAM
- CPU usage: Minimal on modern VPS

**Configuration Highlight:**
```bash
# /etc/rspamd/rspamd.conf - Memory optimization
worker "normal" {
  count = 1;                    # Single worker for small VPS
  max_requests = 1000;          # Restart after 1000 requests
  relay = "no";                 # Don't relay for others
}

worker "controller" {
  count = 1;
  password = "your-password";   # For web interface
}

# Disable expensive features for small VPS
options {
  dns {
    nameserver = ["1.1.1.1", "1.0.0.1"];
    retransmits = 2;
    timeout = 1s;
  }
}
```

---

#### **SpamAssassin**

**Status:** Still viable but less efficient

**Strengths:**
- Mature, battle-tested
- Extensive rule ecosystem
- Wide community support

**Weaknesses for Small VPS:**
- Perl-based (higher memory)
- Slower processing
- Requires Amavis wrapper (adds overhead)
- ~300-500MB RAM typical usage

**Verdict:** Use Rspamd unless you have specific SpamAssassin requirements

---

### Spam Filter Comparison Table

| Feature | Rspamd | SpamAssassin |
|---------|--------|--------------|
| **Architecture** | ✅ Modern C | ⚠️ Perl |
| **Memory Usage** | ✅ 100-200MB | ⚠️ 300-500MB |
| **CPU Efficiency** | ✅ Excellent | ⚠️ Moderate |
| **DKIM/DMARC** | ✅ Built-in | ⚠️ Requires plugins |
| **Learning** | ✅ Modern ML | ✅ Bayesian |
| **Speed** | ✅ Fast | ⚠️ Slower |
| **Web Interface** | ✅ Excellent | ⚠️ Basic |
| **Active Development** | ✅ Very Active | ⚠️ Maintenance |
| **Setup Complexity** | ⚠️ Moderate | ⚠️ Complex (with Amavis) |
| **2025 Recommendation** | ⭐ **CHOSEN** | ⚠️ Alternative |

---

### 1.4 Virus Scanning Options

#### **ClamAV**

**Resource Impact:**
- RAM: ~200-400MB for signature database
- CPU: High during scanning
- Disk: ~300MB for signatures (updates regularly)

**Assessment for 2GB VPS:**
- ❌ **Too resource-intensive** with full spam filtering
- Consider alternatives:
  - **External filtering:** Use service like MailChannels, SpamExperts
  - **Skip:** For 1-5 users with good security practices
  - **Essential only:** If receiving email from unknown sources regularly

**Recommendation:** Skip ClamAV for small deployment, rely on Rspamd's heuristic scanning

---

### 1.5 Webmail Interfaces

#### **SnappyMail** ⭐ RECOMMENDED

**Strengths:**
- **Lightweight:** Minimal resource usage (~50-100MB PHP)
- **Modern UI:** Responsive, mobile-friendly
- **Active Development:** Regular security updates
- **Easy Setup:** SQLite database, simple configuration
- **Features:**
  - IMAP support
  - Sieve filters
  - Multiple identities
  - PGP encryption (plugin)
  - Contacts management

**Why SnappyMail over Rainloop:**
- Rainloop development has stalled
- SnappyMail is active fork with security fixes
- Better maintained for 2025

---

#### **Roundcube**

**Strengths:**
- Most mature webmail
- Extensive plugin ecosystem
- Highly customizable

**Weaknesses for Small VPS:**
- Higher memory usage (~150-250MB)
- More complex setup
- Overkill for 1-5 users

**Verdict:** Choose Roundcube only if you need specific plugins

---

#### **Afterlogic WebMail**

**Status:** Commercial (free edition limited)
- Free edition limited to 10 users
- Good UI but less popular
- Consider only if you need specific Pro features

---

### Webmail Comparison Table

| Feature | SnappyMail | Roundcube | Rainloop |
|---------|------------|-----------|----------|
| **Active Development** | ✅ Excellent | ✅ Good | ❌ Stalled |
| **Resource Usage** | ✅ Low (50-100MB) | ⚠️ Medium (150-250MB) | ✅ Low (50-100MB) |
| **UI/UX** | ✅ Modern | ✅ Classic | ✅ Modern |
| **Plugin Ecosystem** | ⚠️ Growing | ✅ Extensive | ⚠️ Limited |
| **Setup Complexity** | ✅ Simple | ⚠️ Moderate | ✅ Simple |
| **Mobile Support** | ✅ Responsive | ✅ Responsive | ✅ Responsive |
| **Security Updates** | ✅ Active | ✅ Active | ❌ Infrequent |
| **Database** | ✅ SQLite | ⚠️ MySQL/PG/SQLite | ✅ SQLite |
| **PGP Support** | ✅ Plugin | ✅ Plugin | ❌ No |
| **2025 Recommendation** | ⭐ **CHOSEN** | ✅ Alternative | ❌ Avoid |

---

### 1.6 Database Backends

#### **SQLite** ⭐ RECOMMENDED for <10 users

**Advantages:**
- Zero configuration
- Minimal overhead (~2-5MB per database)
- No separate database process
- Easy backup (single file)
- Sufficient performance for 5 users

**Use Cases:**
- Virtual user accounts
- Webmail configuration
- Quota tracking
- Sieve scripts storage

---

#### **PostgreSQL / MySQL**

**When to Use:**
- Scaling beyond 10-20 users
- Need concurrent writes
- Complex queries
- Integration with existing database infrastructure

**Overhead for 2GB VPS:**
- MySQL: ~150-300MB RAM (tuned)
- PostgreSQL: ~100-200MB RAM (tuned)

**Verdict:** Stick with SQLite for 1-5 users

---

### Database Comparison Table

| Factor | SQLite | PostgreSQL | MySQL |
|--------|--------|------------|-------|
| **Resource Usage** | ✅ Minimal (~5MB) | ⚠️ Medium (100-200MB) | ⚠️ Medium (150-300MB) |
| **Performance (<10 users)** | ✅ Excellent | ✅ Excellent | ✅ Excellent |
| **Concurrent Writes** | ⚠️ Limited | ✅ Excellent | ✅ Excellent |
| **Setup Complexity** | ✅ Zero | ⚠️ Moderate | ⚠️ Moderate |
| **Backup** | ✅ File copy | ⚠️ Dump required | ⚠️ Dump required |
| **Best For** | 1-10 users | 20+ users | 20+ users |
| **2025 Recommendation** | ⭐ **CHOSEN** | ⚠️ Scale later | ⚠️ Scale later |

---

## 2. Security & Deliverability (CRITICAL)

### 2.1 Email Authentication - The Foundation

Email authentication is **NON-NEGOTIABLE** in 2025. Without proper SPF, DKIM, and DMARC, your emails will be rejected or marked as spam by major providers.

---

#### **SPF (Sender Policy Framework)**

**Purpose:** Authorizes which IP addresses/domains can send email for your domain

**Best Practices for 2025:**
- **Strict policy:** Use `-all` (fail) once confirmed
- **Limit lookups:** Max 10 DNS lookups (per RFC)
- **Include strategically:** Don't nest too many includes
- **Keep under 255 bytes:** Per TXT record limit

**Example SPF Record for ementech.co.ke:**
```dns
ementech.co.ke.  IN  TXT  "v=spf1 ip4:YOUR.VPS.IP -all"
```

**SPF Record Breakdown:**
- `v=spf1`: SPF version 1
- `ip4:YOUR.VPS.IP`: Authorizes your VPS IP
- `-all`: Fail all other senders (strict policy)

**Validation Tools:**
- https://mxtoolbox.com/spf.aspx
- https://www.kitterman.com/spf/validate.html

**Common SPF Mechanisms:**
| Mechanism | Meaning | Use When |
|-----------|---------|----------|
| `ip4:1.2.3.4` | Authorize specific IPv4 | Single IP server |
| `ip6:2001:db8::1` | Authorize specific IPv6 | IPv6-enabled |
| `a` | Authorize domain's A record | Domain points to server |
| `mx` | Authorize MX records | Mail server same as MX |
| `include:example.com` | Include another domain's SPF | Using third-party service |
| `~all` | Softfail (mark but accept) | Testing phase |
| `-all` | Fail (reject) | Production - RECOMMENDED |
| `+all` | Allow all | NEVER USE (no security) |

---

#### **DKIM (DomainKeys Identified Mail)**

**Purpose:** Cryptographic signature proving email wasn't tampered with

**Best Practices for 2025:**
- **Key length:** Minimum 2048-bit RSA (1024-bit being deprecated)
- **Hash algorithm:** SHA-256 or higher
- **Multiple selectors:** Use different selectors for different services
- **Rotation:** Rotate keys every 6-12 months
- **Monitoring:** Check DMARC reports for failures

**Generating DKIM Keys:**
```bash
# Generate 2048-bit RSA key
openssl genrsa -out private.key 2048

# Extract public key
openssl rsa -in private.key -pubout -out public.key

# OR use rspamd tools
rspamadm dkim_keygen -d ementech.co.ke -s default -b 2048
```

**DNS Record Example:**
```dns
default._domainkey.ementech.co.ke.  IN  TXT  "v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA..."
```

**DKIM Selector Strategy:**
```
default._domainkey.ementech.co.ke   # Main server
newsletter._domainkey.ementech.co.ke # Newsletter service
transactional._domainkey.ementech.co.ke # Transactional emails
```

**Postfix DKIM Configuration (via rspamd):**
```bash
# /etc/rspamd/local.d/dkim_signing.conf
domain {
  ementech.co.ke {
    path = "/var/lib/rspamd/dkim/$domain.$selector.key";
    selector = "default";
  }
}

selector_map = "/etc/rspamd/dkim_selectors.map";
```

---

#### **DMARC (Domain-based Message Authentication)**

**Purpose:** Tells receivers what to do with emails failing SPF/DKIM checks

**Best Practices for 2025:**
- **Start at p=none:** Monitor for 1-2 weeks first
- **Progress to p=quarantine:** After confirming SPF/DKIM work
- **End at p=reject:** Maximum protection
- **Always include reports:** Critical for troubleshooting
- **Use rua and ruf:** Aggregate and forensic reports

**DMARC Record Example:**
```dns
_15.ementech.co.ke.  IN  TXT  "v=DMARC1; p=none; rua=mailto:dmarc@ementech.co.ke; ruf=mailto:dmarc@ementech.co.ke; sp=none; aspf=r; adkim=r; pct=100; rf=afrf; ri=86400"
```

**DMARC Tags Explained:**
| Tag | Value | Meaning |
|-----|-------|---------|
| `v` | DMARC1 | Protocol version |
| `p` | none/quarantine/reject | Policy for failed emails |
| `rua` | mailto:dmarc@example.com | Aggregate reports (daily XML) |
| `ruf` | mailto:dmarc@example.com | Forensic reports (immediate) |
| `sp` | none/quarantine/reject | Policy for subdomains |
| `aspf` | r/s | SPF alignment (relaxed/strict) |
| `adkim` | r/s | DKIM alignment (relaxed/strict) |
| `pct` | 0-100 | Percentage of emails to apply policy |
| `rf` | afrf | Report format |
| `ri` | 86400 | Report interval (seconds) |

**DMARC Rollout Strategy:**
```
Week 1-2:   p=none (monitoring only)
Week 3-4:   p=quarantine (spam folder)
Week 5+:    p=reject (bounce failed emails)
```

**DMARC Report Analyzers:**
- https://dmarcian.com/ (excellent free tier)
- https://www.postmarkapp.com/dmarc (free checker)
- https://mxtoolbox.com/dmarc.aspx (basic)

---

### 2.2 TLS/SSL Configuration

#### **Certificate Management**

**Best Practices:**
- **Let's Encrypt:** FREE, automated certificates
- **Certbot:** Automated renewal
- **Wildcard certs:** If hosting multiple subdomains
- **Force TLS:** Require TLS for SMTP submission

**Installing Certbot:**
```bash
# Ubuntu/Debian
apt install certbot

# Generate certificate for mail.ementech.co.ke
certbot certonly --standalone -d mail.ementech.co.ke
```

**Postfix TLS Configuration:**
```bash
# /etc/postfix/main.cf
# Enable TLS for incoming
smtpd_tls_security_level = may
smtpd_tls_cert_file = /etc/letsencrypt/live/mail.ementech.co.ke/fullchain.pem
smtpd_tls_key_file = /etc/letsencrypt/live/mail.ementech.co.ke/privkey.pem
smtpd_tls_protocols = !SSLv2, !SSLv3, !TLSv1, !TLSv1.1
smtpd_tls_ciphers = medium
smtpd_tls_mandatory_protocols = !SSLv2, !SSLv3, !TLSv1, !TLSv1.1
smtpd_tls_mandatory_ciphers = high
smtpd_tls_received_header = yes

# Enable TLS for outgoing
smtp_tls_security_level = may
smtp_tls_protocols = !SSLv2, !SSLv3, !TLSv1, !TLSv1.1
smtp_tls_ciphers = medium
smtp_tls_session_cache_database = btree:${data_directory}/smtp_scache

# Require TLS for authentication
smtpd_sasl_auth_enable = yes
smtpd_tls_auth_only = yes
```

**Dovecot TLS Configuration:**
```bash
# /etc/dovecot/conf.d/10-ssl.conf
ssl = required
ssl_cert = </etc/letsencrypt/live/mail.ementech.co.ke/fullchain.pem
ssl_key = </etc/letsencrypt/live/mail.ementech.co.ke/privkey.pem
ssl_min_protocol = TLSv1.2
ssl_cipher_list = ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384
ssl_prefer_server_ciphers = yes
```

**Cipher Suites (2025 Best):**
- Prioritize ECDHE over DHE (better performance)
- Prefer GCM over CBC (authenticated encryption)
- Require TLSv1.2+ minimum
- Disable: SSLv2, SSLv3, TLSv1.0, TLSv1.1

**Automated Renewal:**
```bash
# Certbot creates systemd timer automatically
# Verify with:
systemctl status certbot.timer

# Test renewal:
certbot renew --dry-run
```

---

#### **Forced TLS for Specific Domains**

**Configure Postfix to require TLS for specific recipients:**
```bash
# /etc/postfix/main.cf
smtp_tls_policy_maps = hash:/etc/postfix/tls_policy

# /etc/postfix/tls_policy
gmail.com encrypt
outlook.com encrypt
yahoo.com encrypt
```

---

### 2.3 Spam Filtering Configuration

#### **Rspamd Configuration**

**Basic Setup:**
```bash
# /etc/rspamd/local.d/options.inc
contacts {
  maximum_tld_distance = 2;
}

dns {
  nameserver = ["1.1.1.1", "1.0.0.1"];
  timeout = 1s;
  retransmits = 2;
}

# Enable required modules
options {
  history_file = "/var/lib/rspamd/rspamd.history";
  pidfile = "/run/rspamd/rspamd.pid";
}
```

**Actions Configuration:**
```bash
# /etc/rspamd/local.d/actions.conf
subject = "*** SPAM *** ";

rewrite_subject {
  subject = "*** SPAM *** ";
}

actions {
  reject = 15;            # Reject with score > 15
  add_header = 8;         # Add header with score > 8
  greylist = 4;           # Greylist with score > 4
  "no action" = 0;        # No action below 4
}

greylist {
  expire = 1d;            # Expire entries after 1 day
  action = "greylist";
}
```

**Postfix Integration:**
```bash
# /etc/postfix/main.cf
smtpd_milters = inet:127.0.0.1:11332
non_smtpd_milters = inet:127.0.0.1:11332
milter_protocol = 6
milter_default_action = accept
```

**Training Rspamd:**
```bash
# Move spam to Junk folder (Dovecot Sieve)
# Train from Spam folder:
rspamc learn_spam --mime /path/to/spam.eml

# Train from Inbox:
rspamc learn_ham --mime /path/to/ham.eml

# Web UI available at:
https://mail.ementech.co.ke/rspamd
```

---

### 2.4 Rate Limiting & Abuse Prevention

#### **Postfix Rate Limiting**

```bash
# /etc/postfix/main.cf

# Limit recipients per message
smtpd_recipient_limit = 50

# Limit recipients per connection
smtpd_recipient_overshoot_limit = 10

# Limit connection rate from client
smtpd_client_connection_count_limit = 10
smtpd_client_connection_rate_limit = 30

# Limit message size
message_size_limit = 25600000  # 25MB

# Limit queue lifetime
maximal_queue_lifetime = 1d
bounce_queue_lifetime = 1d

# /etc/postfix/main.cf - Anvil rate limiting
smtpd_client_connection_rate_limit = 30
smtpd_client_message_rate_limit = 100
smtpd_client_recipient_rate_limit = 150

# Use postscreen for connection screening
postscreen_dnsbl_threshold = 3
postscreen_dnsbl_action = enforce
postscreen_greet_action = enforce
postscreen_blacklist_action = enforce
```

---

#### **Rspamd Rate Limiting**

```bash
# /etc/rspamd/local.d/ratelimit.conf
limits {
  # Limit to 100 emails per minute per user
  user {
    bucket = 100;
    rate = "1m";
    burst = 50;
  }

  # Limit to 200 emails per hour per IP
  ip {
    bucket = 200;
    rate = "60m";
    burst = 100;
  }

  # Limit to 500 emails per day per domain
  to {
    bucket = 500;
    rate = "1d";
    burst = 200;
  }
}

# Whitelisted senders
whitelisted {
  user@ementech.co.ke = true;
}
```

---

### 2.5 Reputation Management

#### **Building IP Reputation**

**Phase 1: Preparation (Before sending)**
1. **Reverse DNS (PTR):** CRITICAL - Must resolve to hostname
   ```dns
   # VPS provider control panel or request from host
   1.2.3.4 -> mail.ementech.co.ke
   ```

2. **Forward-confirmed reverse DNS:** Ensure IP → hostname → IP match
3. **Remove from blacklists:** Check all major DNSBLs
4. **Static IP:** Ensure IP won't change

**Phase 2: DNS Configuration**
1. **SPF record** (see section 2.1)
2. **DKIM setup** (see section 2.1)
3. **DMARC at p=none** (monitor for 1-2 weeks)
4. **A/AAAA records:** Point mail.ementech.co.ke to VPS IP

**Phase 3: Warm-up Strategy (Weeks 1-4)**

```
Week 1:  50-100 emails/day (highly engaged recipients only)
Week 2:  150-200 emails/day
Week 3:  300-400 emails/day
Week 4:  500-600 emails/day
Week 5+: Gradual increase to target volume

Rules:
- Send to engaged recipients (opens/clicks)
- Maintain <0.1% spam complaint rate
- Maintain <1% bounce rate
- Monitor deliverability daily
```

**Phase 4: Monitoring & Adjustment**
1. **Google Postmaster Tools:** https://postmaster.google.com
2. **Microsoft SNDS:** https://sendersupport.olc.protection.outlook.com
3. **Feedback loops:** Register with major ISPs
4. **Blacklist monitoring:** Regular DNSBL checks

---

#### **Avoiding Blacklists**

**Common Reasons for Listing:**
1. **Open relay:** Ensure server is not open relay
2. **Spam trap hits:** Never buy email lists
3. **High bounce rates:** Clean invalid addresses promptly
4. **Spam complaints:** Honor unsubscribe immediately
5. **Poor list hygiene:** Regular validation
6. **Sudden volume spikes:** Adhere to warm-up schedule

**Checking Blacklists:**
```bash
# Multi-RBL check
# Online: https://mxtoolbox.com/blacklists.aspx

# Manual check script
#!/bin/bash
IP="1.2.3.4"
DNSBLS=(
  "zen.spamhaus.org"
  "bl.spamcop.net"
  "dnsbl-1.uceprotect.net"
  "b.barracudacentral.org"
  "bl.mailabuse.org"
)

for dnsbl in "${DNSBLS[@]}"; do
  if host -W 1 ${IP%.*.*.*}.$dnsbl > /dev/null 2>&1; then
    echo "LISTED on $dnsbl"
  else
    echo "CLEAN on $dnsbl"
  fi
done
```

---

### 2.6 Open Relay Prevention

**Critical Security Checks:**

```bash
# Test for open relay
telnet mail.ementech.co.ke 25

# Should NOT allow relay without authentication:
MAIL FROM:<test@example.com>
RCPT TO:<external@example.org>  # Should be rejected
```

**Postfix Anti-Relay Configuration:**
```bash
# /etc/postfix/main.cf

# Require local delivery for unauthenticated
smtpd_relay_restrictions =
    permit_mynetworks
    permit_sasl_authenticated
    defer_unauth_destination

# Reject invalid recipients
smtpd_recipient_restrictions =
    permit_mynetworks
    permit_sasl_authenticated
    reject_non_fqdn_recipient
    reject_unknown_recipient_domain
    reject_unauth_destination

# Define networks
mynetworks = 127.0.0.0/8 [::ffff:127.0.0.0]/104 [::1]/128
```

---

### 2.7 Security Checklist

**Pre-Deployment Checklist:**

- [ ] SPF record configured and validated
- [ ] DKIM keys generated (2048-bit minimum)
- [ ] DKIM selector added to DNS
- [ ] DMARC policy at p=none (monitoring)
- [ ] TLS certificates installed (Let's Encrypt)
- [ ] SMTP Auth requires TLS
- [ ] IMAP/POP3 require SSL/TLS
- [ ] Firewall configured (ports 25, 587, 993, 993 only)
- [ ] Rspamd configured and enabled
- [ ] Rate limiting configured
- [ ] Not an open relay (tested)
- [ ] PTR record configured
- [ ] Backup strategy in place
- [ ] Monitoring configured
- [ ] Fail2ban installed for brute-force protection

**Weekly Maintenance:**

- [ ] Check mail queue: `mailq`
- [ ] Review logs: `tail -f /var/log/mail.log`
- [ ] Check disk space: `df -h`
- [ ] Review DMARC reports
- [ ] Test deliverability to Gmail/Outlook
- [ ] Update blacklist status
- [ ] Review spam folder for false positives
- [ ] Backup email data

---

## 3. VPS Resource Optimization

### 3.1 Memory Management for 2GB RAM

#### **Complete Resource Usage Estimate**

| Service | Min RAM | Max RAM | Notes |
|---------|---------|---------|-------|
| **Base OS** | 100MB | 200MB | Ubuntu/Debian minimal |
| **Nginx** | 50MB | 100MB | Existing web server |
| **Node.js Apps** | 200MB | 500MB | Existing applications |
| **Postfix** | 50MB | 100MB | MTA |
| **Dovecot** | 100MB | 200MB | IMAP/POP3 for 5 users |
| **Rspamd** | 100MB | 200MB | Spam filtering |
| **SQLite** | 5MB | 10MB | Virtual user database |
| **SnappyMail** | 50MB | 100MB | Webmail (PHP-FPM) |
| **ClamAV** | 200MB | 400MB | Virus scanning |
| **Total (with ClamAV)** | ~855MB | ~1,610MB | **Tight on 2GB** |
| **Total (without ClamAV)** | ~655MB | ~1,210MB | **Comfortable** |

**Recommendation:** Skip ClamAV to maintain buffer for peaks

---

#### **Memory Optimization Techniques**

**1. Configure PHP-FPM for SnappyMail:**
```bash
# /etc/php/8.3/fpm/pool.d/www.conf
pm = dynamic
pm.max_children = 5
pm.start_servers = 2
pm.min_spare_servers = 1
pm.max_spare_servers = 3
pm.max_requests = 200

# Limit per-process memory
php_admin_value[memory_limit] = 128M
```

**2. Optimize Dovecot Processes:**
```bash
# /etc/dovecot/conf.d/10-master.conf
# Limit per-process memory
service imap {
  vsz_limit = 256M
}

# Reduce idle timeouts
protocol imap {
  imap_idle_timeout = 29 mins
  imap_client_workarounds = delay-newmail
}
```

**3. Postfix Queue Management:**
```bash
# /etc/postfix/main.cf
# Limit concurrent processes
default_process_limit = 50
smtpd_client_connection_count_limit = 10

# Queue lifetime (don't keep bad email too long)
maximal_queue_lifetime = 1d
bounce_queue_lifetime = 1d
```

**4. Rspamd Memory Optimization:**
```bash
# /etc/rspamd/local.d/worker-normal.inc
.include(try=true; priority=1) "$LOCAL_CONFDIR/local.d/worker-normal.inc"
.include(try=true; priority=10) "$LOCAL_CONFDIR/override.d/worker-normal.inc"

# Single worker for small VPS
worker "normal" {
  count = 1;
  max_requests = 1000;
}
```

---

#### **Swap Configuration**

**Add 2GB Swap:**
```bash
# Create swap file
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile

# Make permanent
echo '/swapfile none swap sw 0 0' >> /etc/fstab

# Configure swappiness (reduce swap usage)
sysctl vm.swappiness=10
echo 'vm.swappiness=10' >> /etc/sysctl.conf

# Verify
free -h
```

---

#### **Monitoring Memory Usage**

```bash
# Real-time monitoring
htop

# Check process memory
ps aux --sort=-%mem | head

# Find memory leaks
watch -n 5 'free -m'

# Email service memory
systemctl status postfix dovecot rspamd
ps aux | grep -E 'postfix|dovecot|rspamd' | awk '{print $2, $4, $11}'
```

---

### 3.2 Disk I/O Optimization

#### **Maildir vs Mbox**

**Maildir** ⭐ RECOMMENDED

**Advantages:**
- **No file locking:** Each email is separate file
- **Concurrent access:** Multiple IMAP connections safe
- **Incremental backups:** Only new files
- **Parallels:** No corruption risk from crashes
- **Performance:** Better for modern filesystems

**Format:**
```
/home/user/Maildir/
  cur/          # Current/read emails
  new/          # New/unread emails
  tmp/          # Temporary files
  dovecot.index # Index files
  dovecot-uidlist
```

**Postfix Configuration:**
```bash
# /etc/postfix/main.cf
home_mailbox = Maildir/
```

**Dovecot Configuration:**
```bash
# /etc/dovecot/conf.d/10-mail.conf
mail_location = maildir:~/Maildir

# Index optimization
maildir_stat_dirs = yes
maildir_copy_with_hardlinks = yes
```

---

#### **SSD Optimization**

**If using SSD (recommended):**

```bash
# Mount options in /etc/fstab
/dev/sda1  /  ext4  defaults,noatime,discard  0  1

# Tune filesystem for mail
tune2fs -o journal_data_writeback /dev/sda1

# Reduce I/O with Dovecot
# /etc/dovecot/conf.d/10-mail.conf
mail_fsync = optimized           # Flush less frequently
maildir_stat_dirs = yes         # Cache directory stats
maildir_copy_preserve_filename = yes
mmap_disable = no               # Enable mmap for speed
```

---

#### **Storage Requirements**

**Per User Estimates:**

| Usage | Emails | Attachments | Total/Year |
|-------|--------|-------------|------------|
| Light | 2,000 | ~50MB | ~250MB |
| Medium | 10,000 | ~500MB | ~1.5GB |
| Heavy | 50,000 | ~2GB | ~6GB |

**5 Users (Medium Usage):**
- Year 1: ~7.5GB
- Year 2: ~15GB
- Year 3: ~22.5GB

**Recommendation:** Start with 20GB partition, monitor growth

**Disk Usage Monitoring:**
```bash
# Check current usage
du -sh /var/mail/* /home/*/Maildir

# Find large mailboxes
find /home/*/Maildir -type f -size +10M -exec ls -lh {} \;

# Quota enforcement
# /etc/dovecot/conf.d/90-quota.conf
plugin {
  quota = maildir:User quota
  quota_rule = *:storage=5G     # 5GB per user
  quota_rule2 = Trash:storage=1G # 1GB for trash
  quota_warning = storage=95%% quota-warning 95 %u
  quota_warning2 = storage=80%% quota-warning 80 %u
}
```

---

### 3.3 CPU Usage Optimization

#### **Spam Filtering Impact**

**Rspamd CPU Usage:**
- Idle: <1% CPU
- Scanning 100 emails/day: <5% CPU
- Scanning 1000 emails/day: ~10-15% CPU

**Optimization:**
```bash
# Greylisting reduces spam scanning load
# /etc/rspamd/local.d/greylist.conf
greylist {
  expire = 1d;
  action = "greylist";
  max_data_len = 10240;      # Skip greylist for small emails
}
```

---

#### **Encryption Overhead**

**TLS/SSL Impact:**
- Modern CPUs handle AES-NI in hardware
- Negligible performance impact
- TLSv1.3 faster than TLSv1.2

**Recommendation:** Don't disable TLS for performance

---

#### **Postfix SMTP Limits**

```bash
# /etc/postfix/main.cf
# Limit SMTP processes to control CPU
smtpd_client_connection_count_limit = 10
smtpd_client_connection_rate_limit = 30

# Queue management
initial_destination_concurrency = 5
default_destination_concurrency_limit = 20
default_destination_recipient_limit = 50
```

---

### 3.4 Complete Optimized Configuration

**Summary for 2GB VPS:**

```
SERVICES:
✅ Postfix (MTA)
✅ Dovecot (IMAP/POP3)
✅ Rspamd (Spam filtering)
✅ SnappyMail (Webmail)
✅ SQLite (Database)
✅ Let's Encrypt (TLS)
❌ ClamAV (Skip - too resource intensive)
❌ SpamAssassin (Use Rspamd instead)
❌ Amavis (Use Rspamd milter instead)

EXPECTED USAGE:
- Base RAM: ~655MB
- Peak RAM: ~1,210MB
- Available: ~790MB buffer
- Comfortable margin: YES
```

---

## 4. 2025 Best Practices

### 4.1 IPv6 Support

#### **Current Status (2025)**

**Good News:**
- Email servers MUST support IPv6 by RFC
- Major providers (Gmail, Outlook) send via IPv6
- Can improve deliverability (separate reputation)

**Challenges:**
- DNSBL support for IPv6 is limited
- Some older systems don't support IPv6
- Dual-stack management complexity

---

#### **IPv6 Configuration**

**Postfix IPv6:**
```bash
# /etc/postfix/main.cf
inet_protocols = all           # Enable both IPv4 and IPv6
inet_interfaces = all
smtp_bind_address6 = ::1

# Or limit to IPv4 only if needed
# inet_protocols = ipv4
```

**Dovecot IPv6:**
```bash
# /etc/dovecot/conf.d/10-master.conf
service imap-login {
  inet_listener imap {
    address = *, ::            # Listen on IPv4 and IPv6
    port = 143
  }
  inet_listener imaps {
    address = *, ::
    port = 993
    ssl = yes
  }
}
```

**SPF with IPv6:**
```dns
# Include both A and AAAA records
ementech.co.ke.  IN  TXT  "v=spf1 ip4:1.2.3.4 ip6:2001:db8::1 -all"
```

**Recommendation:** Enable IPv6 but maintain IPv4 primary

---

### 4.2 Modern Email Protocols

#### **MTA-STS (SMTP Mail Transfer Agent Strict Transport Security)**

**Purpose:** Enforce TLS for receiving email from specific domains

**DNS Record:**
```dns
_smtp._tls.ementech.co.ke.  IN  TXT  "v=STSv1; id=2025011901;"
```

**Policy File (HTTPS):**
```
# https://mail.ementech.co.ke/.well-known/mta-sts.txt
version: STSv1
mode: enforce
max_age: 604800
mx: mail.ementech.co.ke
```

**Modes:**
- `none`: Monitoring only
- `testing`: Report failures but accept
- `enforce`: Reject non-TLS connections

---

#### **SMTP TLS Reporting**

**Purpose:** Receive reports on TLS failures

**DNS Record:**
```dns
_smtp._tls.ementech.co.ke.  IN  TXT  "v=TLSRPTv1; rua=mailto:tls-reports@ementech.co.ke"
```

**Report Analysis:**
- Monitor report emails for TLS failures
- Identify misconfigured sending servers
- Improve overall email security

---

#### **STARTTLS**

**Always Available:**
```bash
# /etc/postfix/main.cf
smtpd_tls_security_level = may      # Opportunistic TLS
smtp_tls_security_level = may
```

**Enforced for Specific Domains:**
```bash
# /etc/postfix/tls_policy
gmail.com encrypt
outlook.com encrypt
protonmail.com encrypt
```

---

### 4.3 Backup Strategies

#### **Email Backup Best Practices**

**3-2-1 Rule:**
- **3 copies** of data (production + 2 backups)
- **2 different media** (disk + cloud/offsite)
- **1 offsite backup** (different location)

---

#### **Backup Script**

```bash
#!/bin/bash
# /usr/local/bin/backup-email.sh

BACKUP_DIR="/backup/email"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Create backup directory
mkdir -p "$BACKUP_DIR/$DATE"

# Backup email data
rsync -av /home/*/Maildir/ "$BACKUP_DIR/$DATE/maildir/"

# Backup SQLite databases
cp /var/lib/postfix/virtual.db "$BACKUP_DIR/$DATE/"
cp /etc/dovecot/users.db "$BACKUP_DIR/$DATE/" 2>/dev/null || true

# Backup configurations
tar -czf "$BACKUP_DIR/$DATE/configs.tar.gz" /etc/postfix /etc/dovecot /etc/rspamd

# Compress
tar -czf "$BACKUP_DIR/email-$DATE.tar.gz" -C "$BACKUP_DIR" "$DATE"
rm -rf "$BACKUP_DIR/$DATE"

# Delete old backups
find "$BACKUP_DIR" -name "email-*.tar.gz" -mtime +$RETENTION_DAYS -delete

# Upload to offsite (example: rclone to S3)
# rclone copy "$BACKUP_DIR/email-$DATE.tar.gz" remote:backups/email/

echo "Backup completed: email-$DATE.tar.gz"
```

**Schedule:**
```bash
# Add to crontab
crontab -e

# Daily backup at 2 AM
0 2 * * * /usr/local/bin/backup-email.sh >> /var/log/email-backup.log 2>&1
```

---

#### **Disaster Recovery**

**Restore from Backup:**
```bash
# Stop email services
systemctl stop postfix dovecot

# Restore maildir
tar -xzf /backup/email/email-20250119_020000.tar.gz -C /home/user/

# Restore databases
cp /backup/email/20250119/virtual.db /var/lib/postfix/
cp /backup/email/20250119/users.db /etc/dovecot/

# Restore configs
tar -xzf /backup/email/20250119/configs.tar.gz -C /

# Start services
systemctl start postfix dovecot
```

**Critical Files to Backup:**
- `/home/*/Maildir/` (email data)
- `/etc/postfix/` (configuration)
- `/etc/dovecot/` (configuration)
- `/etc/rspamd/` (configuration and learned data)
- `/var/lib/rspamd/` (Bayesian data)
- `/var/lib/postfix/virtual.db` (user database)
- SSL certificates (or backup entire `/etc/letsencrypt/`)

---

### 4.4 Monitoring & Alerting

#### **Key Metrics to Monitor**

1. **Service Health:**
   - Postfix running
   - Dovecot running
   - Rspamd running
   - Disk space >20% free
   - RAM <90% used

2. **Mail Queue:**
   - Queue size <100 emails
   - Queue age <1 hour
   - No frozen messages

3. **Deliverability:**
   - SPF/DKIM/DMARC passing
   - Not on blacklists
   - Test emails to Gmail/Outlook successful

4. **Resource Usage:**
   - CPU <80%
   - RAM <90%
   - Disk I/O normal

---

#### **Monitoring Tools**

**Option 1: Simple Shell Script**
```bash
#!/bin/bash
# /usr/local/bin/check-email-health.sh

# Check services
if ! systemctl is-active --quiet postfix; then
  echo "CRITICAL: Postfix not running" | mail -s "Email Alert" admin@ementech.co.ke
fi

if ! systemctl is-active --quiet dovecot; then
  echo "CRITICAL: Dovecot not running" | mail -s "Email Alert" admin@ementech.co.ke
fi

# Check mail queue
QUEUE_SIZE=$(mailq | grep -c "^[0-9A-Z]")
if [ "$QUEUE_SIZE" -gt 100 ]; then
  echo "WARNING: Mail queue has $QUEUE_SIZE messages" | mail -s "Email Alert" admin@ementech.co.ke
fi

# Check disk space
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 90 ]; then
  echo "CRITICAL: Disk at ${DISK_USAGE}%" | mail -s "Email Alert" admin@ementech.co.ke
fi
```

**Schedule:**
```bash
# Run every 15 minutes
*/15 * * * * /usr/local/bin/check-email-health.sh
```

---

**Option 2: Monit**
```bash
# /etc/monit/monitrc
check process postfix with pidfile /var/spool/postfix/pid/master.pid
  start program = "/bin/systemctl start postfix"
  stop program = "/bin/systemctl stop postfix"
  if failed host localhost port 25 protocol smtp for 3 cycles then restart
  if 5 restarts within 5 cycles then timeout

check process dovecot with pidfile /run/dovecot/master.pid
  start program = "/bin/systemctl start dovecot"
  stop program = "/bin/systemctl stop dovecot"
  if failed host localhost port 993 type tcpssl protocol imap for 3 cycles then restart
  if 5 restarts within 5 cycles then timeout

check filesystem mail with path /home
  if space usage > 90% then alert
```

---

**Option 3: Prometheus + Grafana (Advanced)**

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'postfix'
    static_configs:
      - targets: ['localhost:9154']

  - job_name: 'dovecot'
    static_configs:
      - targets: ['localhost:9900']

  - job_name: 'node'
    static_configs:
      - targets: ['localhost:9100']
```

---

#### **Queue Management**

**View Queue:**
```bash
# Show queue
mailq

# Show queue by sender
mailq | grep `hostname`

# Show detailed queue
postqueue -p
```

**Delete from Queue:**
```bash
# Delete specific message
postsuper -d MESSAGE_ID

# Delete all deferred
postsuper -d ALL deferred

# Delete all mail (careful!)
postsuper -d ALL
```

**Flush Queue:**
```bash
# Attempt immediate delivery
postqueue -f

# Requeue deferred messages
postsuper -r ALL deferred
```

---

### 4.5 Maintenance Windows

#### **Update Strategy**

**Weekly:**
- Check for security updates
- Review logs
- Test backup restore
- Monitor queue

**Monthly:**
- Apply OS security updates
- Review and rotate DKIM keys (quarterly)
- Check blacklist status
- Review DMARC reports

**Quarterly:**
- Full system updates
- Review and update documentation
- Capacity planning
- Disaster recovery test

---

#### **Zero-Downtime Updates**

**Process:**
```bash
# 1. Check current state
systemctl status postfix dovecot
mailq

# 2. Stop incoming mail (accept locally only)
postfix stop

# 3. Wait for queue to drain
postqueue -f
sleep 60

# 4. Apply updates
apt update && apt upgrade postfix dovecot-core rspamd

# 5. Test configuration
postfix check
dovecot -a

# 6. Start services
postfix start
systemctl start dovecot

# 7. Verify
tail -f /var/log/mail.log
mailq
```

---

## 5. Common Pitfalls & Solutions

### 5.1 Email Going to Spam

#### **Top Reasons and Solutions**

**1. Missing SPF/DKIM/DMARC**
- **Symptom:** Emails to spam folder
- **Test:** https://www.mail-tester.com
- **Solution:** Configure all three (Section 2.1)

---

**2. Poor IP Reputation**
- **Symptom:** New server, emails rejected
- **Solution:** Follow warm-up strategy (Section 6.1)

---

**3. Missing PTR Record**
- **Symptom:** Rejected by many servers
- **Check:**
  ```bash
  dig -x YOUR.VPS.IP +short
  ```
- **Solution:** Request from VPS provider

---

**4. Spammy Content**
- **Symptom:** Some emails spam, some not
- **Triggers:**
  - ALL CAPS SUBJECT
  - Excessive exclamation marks!!!
  - Words: "FREE", "WIN", "URGENT"
  - Missing plain text version
  - Large images with little text
- **Solution:**
  - Write professional emails
  - Always include plain text alternative
  - Avoid spam trigger words
  - Test content before sending

---

**5. Shared IP Blacklisted**
- **Symptom:** Never sent email but already blacklisted
- **Check:**
  ```bash
  # Use online tools
  https://mxtoolbox.com/blacklists.aspx
  ```
- **Solution:**
  - Request new IP from VPS provider
  - Use dedicated email hosting

---

**6. Missing FQDN Hostname**
- **Symptom:** "Helo command rejected"
- **Check:**
  ```bash
  hostname -f
  ```
- **Solution:**
  ```bash
  hostnamectl set-hostname mail.ementech.co.ke
  # Add to /etc/hosts
  127.0.1.1 mail.ementech.co.ke mail
  ```

---

### 5.2 Mail Queue Bottlenecks

#### **Detection**

```bash
# Check queue size
mailq | tail -1

# Find frozen messages
mailq | grep "frozen"

# Check for deferrals
grep "deferred" /var/log/mail.log | tail -20
```

---

#### **Common Causes**

**1. DNS Issues**
```bash
# Check DNS resolution
dig gmail.com MX
dig outlook.com MX

# Test from Postfix
smtpd_dns_reply_filter =
```

**2. Greylisting Delays**
- Normal behavior, email retries within 15-30 minutes
- Not an issue if queue drains

**3. Recipient Rate Limiting**
- Many servers limit incoming email
- Reduce sending rate (Section 2.6)

**4. Authentication Failures**
```bash
# Check logs
grep "SASL" /var/log/mail.log
grep "authentication" /var/log/mail.log
```

---

#### **Resolution**

```bash
# Flush queue
postqueue -f

# Requeue old messages
postsuper -r ALL

# Delete specific deferred message
postsuper -d MESSAGE_ID

# Increase logging temporarily
echo "debug_peer_list = gmail.com" >> /etc/postfix/main.cf
postfix reload
# Check logs
tail -f /var/log/mail.log
# Remove when done
```

---

### 5.3 Database Corruption

#### **Prevention**

```bash
# Regular SQLite integrity checks
sqlite3 /var/lib/postfix/virtual.db "PRAGMA integrity_check;"

# Backup before changes
cp /var/lib/postfix/virtual.db /var/lib/postfix/virtual.db.backup
```

---

#### **Recovery**

```bash
# SQLite recovery
sqlite3 /var/lib/postfix/virtual.db ".dump" > dump.sql
sqlite3 /var/lib/postfix/virtual-new.db < dump.sql
mv /var/lib/postfix/virtual-new.db /var/lib/postfix/virtual.db

# Postfix map regeneration
postmap /etc/postfix/virtual
postfix reload
```

---

#### **Postfix Virtual Mailbox Database**

**Rebuild from scratch:**
```bash
# /etc/postfix/virtual
# user@ementech.co.ke  ementech.co.ke/user
# admin@ementech.co.ke  ementech.co.ke/admin

postmap /etc/postfix/virtual
postmap hash:/etc/postfix/virtual
postfix reload
```

---

### 5.4 SSL Certificate Renewal

#### **Automated Renewal (Certbot)**

```bash
# Test renewal
certbot renew --dry-run

# Manual renewal
certbot renew

# Force renewal
certbot renew --force-renewal

# Restart services after renewal
certbot renew --post-hook "systemctl restart postfix dovecot"
```

---

#### **Troubleshooting**

**Port 80 Already in Use:**
```bash
# Stop nginx temporarily
systemctl stop nginx
certbot certonly --standalone -d mail.ementech.co.ke
systemctl start nginx
```

**Validation Failures:**
```bash
# Check DNS propagation
dig mail.ementech.co.ke

# Check firewall
ufw status
# Ensure ports 80 and 443 open
```

**Permission Issues:**
```bash
# Fix Postfix/Dovecot permissions
chown root:postfix /etc/letsencrypt/live/
chmod 750 /etc/letsencrypt/live/
chmod 640 /etc/letsencrypt/live/mail.ementech.co.ke/privkey.pem
```

---

### 5.5 High Memory Usage

#### **Symptoms**

- OOM killer kills processes
- Services stop unexpectedly
- System swapping heavily

---

#### **Diagnosis**

```bash
# Check memory
free -h

# Find large processes
ps aux --sort=-%mem | head -10

# Check for memory leaks
watch -n 5 'ps aux | grep -E "postfix|dovecot|rspamd" | awk "{sum+=\$4} END {print sum}"'
```

---

#### **Solutions**

**1. Reduce Dovecot Processes:**
```bash
# /etc/dovecot/conf.d/10-master.conf
service imap {
  process_limit = 20  # Reduce from 50
}
```

**2. Disable ClamAV:**
```bash
systemctl stop clamav-daemon
systemctl disable clamav-daemon
# Configure Postfix/Dovecot to not use ClamAV
```

**3. Add Swap:**
```bash
# If swap doesn't exist
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
```

**4. Restart bloated services:**
```bash
systemctl restart rspamd
systemctl restart dovecot
```

---

### 5.6 Authentication Issues

#### **SASL Authentication Failures**

```bash
# Check logs
tail -f /var/log/mail.log | grep -i sasl

# Common error: "no mechanism available"
# Install SASL libraries
apt install libsasl2-modules

# Verify SASL available
saslfinger -s
```

---

#### **Dovecot Authentication**

```bash
# Test authentication
doveadm auth test user@ementech.co.ke password

# Check user database
sqlite3 /etc/dovecot/users.db "SELECT * FROM users;"

# Reset password
# For SHA512-CRYPT:
doveadm pw -s SHA512-CRYPT
# Update database with hashed password
```

---

### 5.7 DNS Propagation Delays

#### **Symptoms**

- SPF/DKIM/DMARC not working immediately
- Inconsistent behavior

---

#### **Solution**

- **TTL:** Set TTL to 300 seconds (5 minutes) during initial setup
- **Propagation:** Can take up to 48 hours globally
- **Testing:** Use multiple DNS servers:
  ```bash
  dig @1.1.1.1 ementech.co.ke TXT
  dig @8.8.8.8 ementech.co.ke TXT
  dig @208.67.222.222 ementech.co.ke TXT
  ```

---

## 6. Deliverability Optimization

### 6.1 IP Warm-up Strategy

#### **Week-by-Week Plan**

**Pre-Warm-up Preparation:**
1. Configure all DNS records (SPF, DKIM, DMARC)
2. Set up PTR record
3. Verify not on blacklists
4. Configure proper hostname (FQDN)
5. Test with https://www.mail-tester.com

---

**Week 1: Foundation (50-100 emails/day)**
- Send ONLY to highly engaged recipients
- Personal, 1-to-1 emails
- Avoid marketing emails
- Check spam folders daily
- Monitor:
  - Open rates >80%
  - Reply rates >30%
  - Zero spam complaints

---

**Week 2: Gradual Increase (150-200 emails/day)**
- Add slightly less engaged recipients
- Start including some business updates
- Maintain high engagement focus
- Continue daily monitoring

---

**Week 3: Expansion (300-400 emails/day)**
- Include newsletter-style content
- Still prioritize engagement
- Test with Gmail/Outlook recipients
- Verify delivery to spam folder vs inbox

---

**Week 4: Near Target (500-600 emails/day)**
- Include broader audience
- Test different email types (transactional, marketing)
- Continue monitoring deliverability
- Adjust DMARC to p=quarantine

---

**Week 5+: Target Volume**
- Gradual increase to desired volume
- Monitor deliverability metrics
- Adjust as needed
- Move DMARC to p=reject after 2 weeks clean

---

#### **Warm-up Best Practices**

**DO:**
- Start with best subscribers first
- Monitor every metric daily
- Honor opt-outs immediately
- Use double opt-in for new signups
- Include unsubscribe link in ALL emails
- Keep spam complaints <0.1%

**DON'T:**
- Send to purchased lists
- Send to old/dormant lists
- Blast all emails at once
- Ignore spam complaints
- Skip warm-up (major mistake!)
- Send from multiple IPs simultaneously

---

### 6.2 Feedback Loops

#### **Gmail Postmaster Tools**

**Register:**
1. Go to https://postmaster.google.com
2. Verify domain ownership
3. Add domain
4. Monitor data:
   - IP reputation
   - Delivery errors
   - Spam rate
   - Domain reputation

---

#### **Microsoft SNDS (Sender Network Data Service)**

**Register:**
1. Go to https://sendersupport.olc.protection.outlook.com
2. Request access
3. Verify IP ownership
4. Monitor:
   - Complaint rate
   - Trap hits
   - Reputation score

---

#### **Other ISP Feedback Loops**

**Major providers offering FBL:**
- Yahoo: https://sender.yahoo.net/
- Comcast: https://feedback.comcast.net/
- AOL: https://postmaster.aol.com/

**Setup:**
- Register with each ISP
- Provide abuse mailbox (abuse@ementech.co.ke)
- Automate complaint processing
- Remove complainers immediately

---

### 6.3 Content Filtering

#### **Avoiding Spam Triggers**

**Subject Lines:**
- ❌ "FREE offer inside!!!"
- ❌ "URGENT: Act now!!!"
- ✅ "Q1 Product Updates from Ementech"
- ✅ "Your invoice #12345 is attached"

---

**Body Content:**
- ❌ Excessive exclamation marks
- ❌ ALL CAPS words
- ❌ "Click here now" links
- ❌ Image-heavy with little text
- ✅ Professional tone
- ✅ Plain text + HTML version
- ✅ Clear, descriptive language
- ✅ Unsubscribe link prominent

---

**HTML Best Practices:**
```html
<!-- GOOD: Balanced text and images -->
<html>
<body>
  <p>Dear John,</p>
  <p>Thank you for your recent purchase...</p>
  <p>[Detailed text explaining the message]</p>
  <img src="logo.png" alt="Ementech Logo">
  <p>Best regards,<br>The Ementech Team</p>

  <!-- Unsubscribe -->
  <p><small>To unsubscribe, <a href="https://ementech.co.ke/unsubscribe">click here</a></small></p>
</body>
</html>
```

---

#### **Spam Score Testing**

**Before Sending:**
1. Use Mail-Tester: https://www.mail-tester.com
2. Send test email to: check-auth@verifier.port25.com
3. Review results
4. Fix issues
5. Test again
6. Repeat until score 9+/10

---

### 6.4 Volume Guidelines

#### **Safe Sending Limits (New IP)**

| Week | Daily Limit | Hourly Limit |
|------|-------------|--------------|
| 1 | 50-100 | 10-20 |
| 2 | 150-200 | 30-40 |
| 3 | 300-400 | 60-80 |
| 4 | 500-600 | 100-120 |
| 5+ | Gradual increase | Gradual increase |

**Maximum sustained (after warm-up):**
- Personal email: ~500/day
- Business mixed: ~2,000/day
- Marketing only: ~5,000/day (with excellent engagement)

---

#### **Volume Spikes**

**Sudden increases cause reputation damage**

**Planning known spikes:**
1. Notify recipients in advance
2. Ramp up gradually over 2-3 days
3. Monitor deliverability closely
4. Pause if issues detected
5. Resume at lower rate

---

### 6.5 Engagement Monitoring

#### **Key Metrics**

**Positive Signals:**
- Open rate >30%
- Click rate >5%
- Reply rate >10%
- Forward rate >2%
- "Not spam" clicks

**Negative Signals:**
- Spam complaints >0.1%
- Unsubscribe rate >1%
- Delete without open >50%
- Mark as spam >0.05%

---

#### **List Hygiene**

**Regular Cleaning:**
```sql
-- Find inactive users (no opens in 6 months)
SELECT email FROM subscribers
WHERE last_open < DATE_SUB(NOW(), INTERVAL 6 MONTH);

-- Find hard bounces
SELECT email FROM bounces WHERE type = 'hard';

-- Remove or re-engage
```

**Re-engagement Campaign:**
1. Send "We miss you" email
2. Offer incentive to confirm interest
3. Remove non-responders after 2 attempts
4. Keep list healthy and engaged

---

## 7. Implementation Checklist

### 7.1 Pre-Installation

**Planning:**
- [ ] Confirm VPS has at least 2GB RAM
- [ ] Verify disk space (minimum 20GB)
- [ ] Plan domain structure (mail.ementech.co.ke)
- [ ] Reserve time for warm-up (4 weeks)
- [ ] Prepare backup strategy
- [ ] Document existing services and ports

**DNS Preparation:**
- [ ] Point A record: mail.ementech.co.ke → VPS IP
- [ ] Request PTR record from VPS provider
- [ ] Plan SPF record
- [ ] Plan DKIM selector
- [ ] Plan DMARC policy (start at p=none)
- [ ] Set TTL to 300 for initial setup

---

### 7.2 Installation Phase

**System Setup:**
```bash
# Update system
apt update && apt upgrade -y

# Set hostname
hostnamectl set-hostname mail.ementech.co.ke

# Add to /etc/hosts
echo "127.0.1.1 mail.ementech.co.ke mail" >> /etc/hosts

# Set timezone
timedatectl set-timezone Africa/Nairobi
```

---

**Install Packages:**
```bash
# Install core components
apt install -y postfix dovecot-core dovecot-imapd dovecot-pop3d dovecot-sieve dovecot-lmtpd

# Install spam filtering
apt install -y rspamd redis-server

# Install webmail
apt install -y php php-fpm php-sqlite3 php-json php-mbstring php-xml

# Install SSL certificates
apt install -y certbot

# Install utilities
apt install -y net-tools rsyslog fail2ban
```

---

**Postfix Configuration:**
```bash
# /etc/postfix/main.cf - Key settings
myhostname = mail.ementech.co.ke
mydomain = ementech.co.ke
myorigin = $mydomain
inet_interfaces = all
inet_protocols = all
mydestination = $myhostname, localhost.$mydomain, localhost
home_mailbox = Maildir/
smtpd_sasl_auth_enable = yes
smtpd_sasl_type = dovecot
smtpd_sasl_path = private/auth
smtpd_relay_restrictions = permit_mynetworks permit_sasl_authenticated defer_unauth_destination
```

---

**Dovecot Configuration:**
```bash
# /etc/dovecot/conf.d/10-mail.conf
mail_location = maildir:~/Maildir

# /etc/dovecot/conf.d/10-auth.conf
disable_plaintext_auth = yes
auth_mechanisms = plain login

# /etc/dovecot/conf.d/10-master.conf (Postfix SASL)
service auth {
  unix_listener /var/spool/postfix/private/auth {
    mode = 0660
    user = postfix
    group = postfix
  }
}
```

---

**Rspamd Configuration:**
```bash
# Enable and start
systemctl enable rspamd redis-server
systemctl start rspamd redis-server

# Configure Postfix milter
# /etc/postfix/main.cf
smtpd_milters = inet:127.0.0.1:11332
non_smtpd_milters = inet:127.0.0.1:11332
```

---

**SSL Certificates:**
```bash
# Stop nginx if port 80 in use
systemctl stop nginx

# Get certificate
certbot certonly --standalone -d mail.ementech.co.ke

# Start nginx
systemctl start nginx

# Configure TLS (see Section 2.2)
```

---

**Create First User:**
```bash
# Create system user
useradd -m -s /bin/bash john

# Set password
passwd john

# Or use virtual users with SQLite (see documentation)
```

---

### 7.3 Testing Phase

**Local Tests:**
```bash
# Test SMTP
telnet localhost 25
EHLO mail.ementech.co.ke
QUIT

# Test IMAP
telnet localhost 143
a1 LOGIN john password
a2 LIST "" *
a3 LOGOUT
```

---

**Remote Tests:**
```bash
# Test from external machine
telnet mail.ementech.co.ke 25
telnet mail.ementech.co.ke 587
openssl s_client -connect mail.ementech.co.ke:993

# Send test email
echo "Test body" | mail -s "Test subject" test@example.com
```

---

**Deliverability Tests:**
1. Send to Gmail account - check spam folder
2. Send to Outlook account - check spam folder
3. Use Mail-Tester: https://www.mail-tester.com
4. Check Port25 verifier: check-auth@verifier.port25.com

---

**Security Tests:**
```bash
# Check for open relay (from external IP)
telnet mail.ementech.co.ke 25
EHLO test.com
MAIL FROM:<spam@test.com>
RCPT TO:<victim@gmail.com>  # Should be rejected

# Test SSL
nmap --script ssl-enum-ciphers -p 25,587,993,993 mail.ementech.co.ke

# Test authentication
doveadm auth test john password
```

---

### 7.4 DNS Configuration

**Complete DNS Records:**
```dns
; A records
mail.ementech.co.ke.      IN  A       YOUR.VPS.IP

; MX records
ementech.co.ke.           IN  MX  10  mail.ementech.co.ke.

; TXT records (SPF)
ementech.co.ke.           IN  TXT     "v=spf1 ip4:YOUR.VPS.IP -all"

; DKIM
default._domainkey.ementech.co.ke.  IN  TXT  "v=DKIM1; k=rsa; p=YOUR_PUBLIC_KEY"

; DMARC
_15.ementech.co.ke.       IN  TXT     "v=DMARC1; p=none; rua=mailto:dmarc@ementech.co.ke; ruf=mailto:dmarc@ementech.co.ke; aspf=r; adkim=r"

; MTA-STS
_smtp._tls.ementech.co.ke.  IN  TXT  "v=STSv1; id=2025011901;"

; TLS reporting
_smtp._tls.ementech.co.ke.  IN  TXT  "v=TLSRPTv1; rua=mailto:tls-reports@ementech.co.ke"

; PTR (request from VPS provider)
YOUR.VPS.IP               IN  PTR     mail.ementech.co.ke.
```

---

### 7.5 Post-Deployment

**Monitoring Setup:**
```bash
# Install monitoring script
nano /usr/local/bin/check-email-health.sh
chmod +x /usr/local/bin/check-email-health.sh

# Add to crontab
crontab -e
*/15 * * * * /usr/local/bin/check-email-health.sh
```

---

**Backup Setup:**
```bash
# Create backup script
nano /usr/local/bin/backup-email.sh
chmod +x /usr/local/bin/backup-email.sh

# Add to crontab
0 2 * * * /usr/local/bin/backup-email.sh
```

---

**Documentation:**
- [ ] Document all passwords and credentials
- [ ] Document configuration file locations
- [ ] Document restore procedures
- [ ] Create runbook for common issues
- [ ] Document contact information for:
  - VPS provider
  - Domain registrar
  - Email users

---

## 8. DNS Configuration Templates

### 8.1 Complete DNS for ementech.co.ke

#### **Production Records**

```dns
; ================================
; Email Infrastructure
; ================================

; A Record - Mail Server
mail.ementech.co.ke.      IN  A       1.2.3.4
                          IN  AAAA    2001:db8::1

; MX Records (priority order matters)
ementech.co.ke.           IN  MX  10  mail.ementech.co.ke.

; ================================
; Email Authentication
; ================================

; SPF - Authorize sending IPs
ementech.co.ke.           IN  TXT     "v=spf1 ip4:1.2.3.4 ip6:2001:db8::1 -all"
www.ementech.co.ke.       IN  TXT     "v=spf1 ip4:1.2.3.4 ip6:2001:db8::1 -all"

; DKIM - Email signing (replace p= with actual key)
default._domainkey.ementech.co.ke.  IN  TXT  "v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA..."

; Additional selectors for different services
newsletter._domainkey.ementech.co.ke.  IN  TXT  "v=DKIM1; k=rsa; p=..."

; DMARC - Policy and reporting
_15.ementech.co.ke.       IN  TXT     "v=DMARC1; p=none; rua=mailto:dmarc@ementech.co.ke; ruf=mailto:dmarc@ementech.co.ke; sp=none; aspf=r; adkim=r; pct=100; rf=afrf; ri=86400"

; ================================
; Modern Email Security (2025)
; ================================

; MTA-STS - TLS enforcement policy
_smtp._tls.ementech.co.ke.  IN  TXT  "v=STSv1; id=2025011901;"

; TLS Reporting - Failure reports
_smtp._tls.ementech.co.ke.  IN  TXT  "v=TLSRPTv1; rua=mailto:tls-reports@ementech.co.ke"

; ================================
; SRV Records (Optional but recommended)
; ================================

; Submission (587)
_submission._tcp.ementech.co.ke.  IN  SRV  0 1 587 mail.ementech.co.ke.

; IMAPS (993)
_imaps._tcp.ementech.co.ke.     IN  SRV  0 1 993 mail.ementech.co.ke.

; POP3S (995)
_pop3s._tcp.ementech.co.ke.     IN  SRV  0 1 995 mail.ementech.co.ke.

; ================================
; Documentation (Helpful for humans)
; ================================

; Auto-discovery for email clients
autoconfig.ementech.co.ke.  IN  CNAME  mail.ementech.co.ke.
autodiscover.ementech.co.ke. IN  CNAME  mail.ementech.co.ke.
```

---

### 8.2 Testing DNS Records

#### **Verification Commands**

```bash
# Test A record
dig mail.ementech.co.ke A +short

# Test MX record
dig ementech.co.ke MX +short

# Test SPF
dig ementech.co.ke TXT +short | grep spf

# Test DKIM
dig default._domainkey.ementech.co.ke TXT +short

# Test DMARC
dig _15.ementech.co.ke TXT +short

# Test PTR (from mail server)
dig -x 1.2.3.4 +short

# Test MTA-STS
dig _smtp._tls.ementech.co.ke TXT +short

# Complete DNS report
# Online: https://mxtoolbox.com/DNSLookup.aspx
# Online: https://www.whatsmydns.net/
```

---

#### **Online Testing Tools**

1. **Mail-Tester:** https://www.mail-tester.com
2. **MXToolbox:** https://mxtoolbox.com/
3. **Port25:** check-auth@verifier.port25.com
4. **DMARC Analyzer:** https://dmarcian.com/
5. **Gmail Postmaster:** https://postmaster.google.com
6. **Microsoft SNDS:** https://sendersupport.olc.protection.outlook.com

---

## 9. Troubleshooting Guide

### 9.1 Common Issues & Solutions

#### **Issue: Emails not sending**

**Symptoms:**
- Queued emails not delivering
- Connection timeouts

**Diagnosis:**
```bash
# Check queue
mailq

# Check logs
tail -f /var/log/mail.log

# Test DNS
dig gmail.com MX
```

**Solutions:**
1. **DNS issues:**
   - Verify DNS resolution working
   - Check /etc/resolv.conf
   - Try alternative DNS: `echo "nameserver 1.1.1.1" >> /etc/resolv.conf`

2. **Firewall blocking:**
   ```bash
   # Check firewall
   ufw status

   # Allow SMTP
   ufw allow 25/tcp
   ufw allow 587/tcp
   ```

3. **Port 25 blocked by VPS provider:**
   - Contact provider to unblock
   - Use SMTP relay service as alternative

---

#### **Issue: Cannot receive email**

**Symptoms:**
- Senders get bounce messages
- Email doesn't appear in mailbox

**Diagnosis:**
```bash
# Check Postfix receiving mail
netstat -tulpn | grep :25

# Test from external
telnet mail.ementech.co.ke 25

# Check mailbox exists
ls /home/user/Maildir/new/
```

**Solutions:**
1. **MX records incorrect:**
   - Verify MX records point to correct IP
   - Check DNS propagation: `dig ementech.co.ke MX`

2. **Mailbox doesn't exist:**
   ```bash
   # Create mailbox
   mkdir -p /home/user/Maildir/{cur,new,tmp}
   chown -R user:user /home/user/Maildir
   ```

3. **Postfix not listening:**
   ```bash
   systemctl status postfix
   postfix check
   systemctl restart postfix
   ```

---

#### **Issue: Authentication failures**

**Symptoms:**
- "SASL authentication failed"
- "Invalid credentials"

**Diagnosis:**
```bash
# Check logs
tail -f /var/log/mail.log | grep -i sasl

# Test authentication
doveadm auth test user@ementech.co.ke password

# Check SASL available
saslfinger -s
```

**Solutions:**
1. **Wrong password:**
   ```bash
   # Reset password
   passwd user
   ```

2. **SASL not configured:**
   ```bash
   # Install SASL
   apt install libsasl2-modules

   # Configure Postfix
   smtpd_sasl_auth_enable = yes
   smtpd_sasl_type = dovecot
   smtpd_sasl_path = private/auth
   ```

3. **Socket permissions:**
   ```bash
   # Check Postfix-Dovecot socket
   ls -l /var/spool/postfix/private/auth

   # Fix if wrong
   chown postfix:postfix /var/spool/postfix/private/auth
   chmod 660 /var/spool/postfix/private/auth
   ```

---

#### **Issue: Email going to spam**

**Symptoms:**
- Recipients find email in spam folder
- Mail-Tester score <7

**Diagnosis:**
1. Test with Mail-Tester: https://www.mail-tester.com
2. Check SPF/DKIM/DMARC:
   ```bash
   dig ementech.co.ke TXT
   dig default._domainkey.ementech.co.ke TXT
   dig _15.ementech.co.ke TXT
   ```

**Solutions:**
1. **Missing SPF:**
   - Add SPF record to DNS
   - Wait for propagation (up to 48 hours)

2. **DKIM failing:**
   ```bash
   # Generate keys
   rspamadm dkim_keygen -d ementech.co.ke -s default -b 2048

   # Add to DNS
   # Test
   rspamadm dkim_verify < /path/to/email.eml
   ```

3. **DMARC not configured:**
   - Add DMARC record
   - Start at p=none for monitoring

4. **Poor IP reputation:**
   - Follow warm-up strategy (Section 6.1)
   - Check blacklists

5. **Content issues:**
   - Avoid spam trigger words
   - Include plain text version
   - Test content before sending

---

#### **Issue: High resource usage**

**Symptoms:**
- System slow
- OOM killer killing processes
- Services stop unexpectedly

**Diagnosis:**
```bash
# Check memory
free -h

# Find large processes
ps aux --sort=-%mem | head -10

# Check for memory leaks
watch -n 5 'ps aux | grep -E "dovecot|rspamd" | awk "{sum+=\$4} END {print sum}"'
```

**Solutions:**
1. **Reduce Dovecot processes:**
   ```bash
   # /etc/dovecot/conf.d/10-master.conf
   service imap {
     process_limit = 20
     vsz_limit = 256M
   }
   ```

2. **Disable ClamAV:**
   ```bash
   systemctl stop clamav-daemon
   systemctl disable clamav-daemon
   ```

3. **Add swap:**
   ```bash
   fallocate -l 2G /swapfile
   chmod 600 /swapfile
   mkswap /swapfile
   swapon /swapfile
   echo '/swapfile none swap sw 0 0' >> /etc/fstab
   ```

4. **Restart bloated services:**
   ```bash
   systemctl restart rspamd dovecot
   ```

---

#### **Issue: Mail queue growing**

**Symptoms:**
- Queue size increasing
- Emails not delivering

**Diagnosis:**
```bash
# Check queue
mailq

# Find frozen messages
mailq | grep frozen

# Check for errors
tail -f /var/log/mail.log
```

**Solutions:**
1. **Flush queue:**
   ```bash
   postqueue -f
   ```

2. **Remove specific message:**
   ```bash
   postsuper -d MESSAGE_ID
   ```

3. **Remove all deferred:**
   ```bash
   postsuper -d ALL deferred
   ```

4. **Requeue old messages:**
   ```bash
   postsuper -r ALL deferred
   ```

5. **Check for DNS issues:**
   ```bash
   # Test DNS resolution
   dig gmail.com MX
   ```

---

### 9.2 Log Analysis

#### **Key Log Locations**

```bash
# Main mail log
tail -f /var/log/mail.log

# Postfix specific
tail -f /var/log/postfix/mail.log

# Dovecot specific
tail -f /var/log/dovecot.log

# Rspamd log
tail -f /var/log/rspamd/rspamd.log

# System log
journalctl -u postfix -u dovecot -u rspamd -f
```

---

#### **Common Log Patterns**

**Successful delivery:**
```
postfix/qmgr: D12345: from=<sender@example.com>, size=1234, nrcpt=1
postfix/smtp: D12345: to=<recipient@gmail.com>, relay=gmail-smtp-in.l.google.com, status=sent (250 2.0.0 OK)
```

**Deferred (temporary failure):**
```
postfix/smtp: D12345: to=<recipient@example.com>, relay=example.com, status=deferred (connect to example.com[1.2.3.4]:25: Connection timed out)
```

**Bounced (permanent failure):**
```
postfix/smtp: D12345: to=<recipient@example.com>, relay=example.com, status=bounced (550 5.1.1 <recipient@example.com>: Recipient address rejected)
```

**Authentication failure:**
```
dovecot: auth: passwd-file(user@example.com): unknown user
postfix/smtpd: warning: unknown[1.2.3.4]: SASL LOGIN authentication failed: authentication failure
```

**Spam detected:**
```
rspamd: <message-id>: spam: true [+], score: 15.00
```

---

#### **Log Analysis Tools**

**Quick stats:**
```bash
# Count emails by sender
grep "from=" /var/log/mail.log | awk '{print $7}' | sort | uniq -c | sort -rn

# Count deferred emails
grep "status=deferred" /var/log/mail.log | wc -l

# Find authentication failures
grep "authentication failed" /var/log/mail.log | tail -20

# Find spam detection
grep "spam: true" /var/log/rspamd/rspamd.log | tail -20
```

---

## 10. Monitoring & Maintenance

### 10.1 Daily Checks

**Quick Daily Script:**
```bash
#!/bin/bash
# /usr/local/bin/daily-email-check.sh

echo "=== Email Server Daily Check ==="
echo "Date: $(date)"
echo ""

# Service status
echo "Service Status:"
systemctl is-active postfix && echo "  Postfix: Running" || echo "  Postfix: FAILED"
systemctl is-active dovecot && echo "  Dovecot: Running" || echo "  Dovecot: FAILED"
systemctl is-active rspamd && echo "  Rspamd: Running" || echo "  Rspamd: FAILED"
echo ""

# Queue status
echo "Mail Queue:"
QUEUE_SIZE=$(mailq | grep -c "^[0-9A-Z]")
echo "  Messages in queue: $QUEUE_SIZE"
if [ "$QUEUE_SIZE" -gt 50 ]; then
  echo "  WARNING: Large queue detected"
fi
echo ""

# Disk space
echo "Disk Space:"
df -h / | tail -1 | awk '{print "  Used: "$3" / "$2" ("$5")"}'
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 90 ]; then
  echo "  CRITICAL: Disk nearly full"
fi
echo ""

# Memory
echo "Memory Usage:"
free -h | grep Mem | awk '{print "  Used: "$3" / "$2}'
echo ""

# Recent errors
echo "Recent Errors (last 24h):"
grep -i "error\|fail\|critical" /var/log/mail.log -s $(date -d 'yesterday' +%s) | tail -5
echo ""

echo "=== End of Check ==="
```

**Schedule:**
```bash
# Run daily at 9 AM
0 9 * * * /usr/local/bin/daily-email-check.sh | mail -s "Daily Email Check" admin@ementech.co.ke
```

---

### 10.2 Weekly Maintenance

**Weekly Script:**
```bash
#!/bin/bash
# /usr/local/bin/weekly-email-maintenance.sh

echo "=== Weekly Email Maintenance ==="
echo "Date: $(date)"
echo ""

# Check for updates
echo "Checking for package updates..."
apt list --upgradable 2>/dev/null | grep -E "postfix|dovecot|rspamd"

# Check blacklist status
echo ""
echo "Blacklist Check:"
# Add your blacklist checking script here

# Review queue for stuck messages
echo ""
echo "Stuck Messages (>1 day):"
find /var/spool/postfix/deferred -type f -mtime +1 | wc -l

# Review log summary
echo ""
echo "Weekly Summary:"
echo "  Total emails sent: $(grep 'status=sent' /var/log/mail.log -s $(date -d '7 days ago' +%s) | wc -l)"
echo "  Total emails deferred: $(grep 'status=deferred' /var/log/mail.log -s $(date -d '7 days ago' +%s) | wc -l)"
echo "  Total emails bounced: $(grep 'status=bounced' /var/log/mail.log -s $(date -d '7 days ago' +%s) | wc -l)"

echo ""
echo "=== Maintenance Complete ==="
```

**Schedule:**
```bash
# Run every Sunday at 3 AM
0 3 * * 0 /usr/local/bin/weekly-email-maintenance.sh | mail -s "Weekly Email Maintenance" admin@ementech.co.ke
```

---

### 10.3 Monthly Tasks

**Monthly Checklist:**

- [ ] Review and apply security updates
- [ ] Check backup integrity (test restore)
- [ ] Review DMARC reports
- [ ] Update documentation
- [ ] Review and update SPF/DKIM if needed
- [ ] Review blacklist status thoroughly
- [ ] Test disaster recovery procedure
- [ ] Review disk usage trends
- [ ] Review user mailbox sizes
- [ ] Clean up old logs

---

### 10.4 Quarterly Tasks

**Quarterly Checklist:**

- [ ] Rotate DKIM keys (generate new, update DNS, remove old after 2 weeks)
- [ ] Full system upgrade
- [ ] Security audit
- [ ] Performance review
- [ ] Capacity planning
- [ ] Review and update runbook
- [ ] Test all monitoring and alerting
- [ ] Review and optimize configurations
- [ ] Update SSL certificates if needed (though Let's Encrypt auto-renews)

---

## 11. Recommended Resources

### 11.1 Official Documentation

**Postfix:**
- Website: http://www.postfix.org/
- Documentation: http://www.postfix.org/documentation.html
- Configuration: http://www.postfix.org/postconf.5.html

**Dovecot:**
- Website: https://www.dovecot.org/
- Wiki: https://wiki.dovecot.org/
- Configuration: https://wiki.dovecot.org/ConfigReference

**Rspamd:**
- Website: https://rspamd.com/
- Documentation: https://rspamd.com/doc/
- GitHub: https://github.com/rspamd/rspamd

**Let's Encrypt:**
- Website: https://letsencrypt.org/
- Documentation: https://letsencrypt.org/docs/
- Certbot: https://certbot.eff.org/

---

### 11.2 Testing & Verification Tools

**Email Testing:**
- Mail-Tester: https://www.mail-tester.com
- Port25 Verifier: check-auth@verifier.port25.com
- Mail-Gen: https://www.mail-gen.com/
- IsNotSpam: http://isnotspam.com/

**DNS Testing:**
- MXToolbox: https://mxtoolbox.com/
- DNSChecker: https://www.dnschecker.org/
- WhatsMyDNS: https://www.whatsmydns.net/
- IntoDNS: https://intodns.com/

**SSL/TLS Testing:**
- SSL Labs: https://www.ssllabs.com/ssltest/
- CheckTLS: https://www.checktls.com/
- CryptoReport: https://cryptoreport.zscaler.com/

**Deliverability:**
- Gmail Postmaster: https://postmaster.google.com
- Microsoft SNDS: https://sendersupport.olc.protection.outlook.com
- DMARC Analyzer: https://dmarcian.com/

---

### 11.3 Communities & Forums

**Official Support:**
- Postfix Users Mailing List: http://www.postfix.org/lists.html
- Dovecot Mailing List: https://www.dovecot.org/mailinglists.html
- Rspamd GitHub: https://github.com/rspamd/rspamd/issues

**Community Forums:**
- Server Fault: https://serverfault.com/
- Unix & Linux: https://unix.stackexchange.com/
- Reddit: https://www.reddit.com/r/selfhosted/
- Mailu Discourse: https://mailu.io/ (similar project, good info)

---

### 11.4 Books & Guides

**Recommended Reading:**
- "The Book of Postfix" (Ralf Hildebrandt, Patrick Koetter)
- "Dovecot: POP3/IMAP Server for Linux" (Tim Bizarro)
- "Email Architecture" (O'Reilly)
- Postfix Architecture Overview: http://www.postfix.org/BASIC_CONFIGURATION_README.html

**Online Tutorials:**
- DigitalOcean Email Tutorials: https://www.digitalocean.com/community/tags/email
- Linode Email Guides: https://www.linode.com/docs/guides/email/
- Hetzner Email Setup: https://community.hetzner.com/tutorials/install-postfix-dovecot

---

## 12. Final Recommendations

### 12.1 Recommended Software Stack

**For Ementech Technologies (ementech.co.ke):**

```
CORE SERVICES:
├── Postfix (MTA)
├── Dovecot (IMAP/POP3)
├── Rspamd (Spam filtering)
├── SQLite (User database)
├── SnappyMail (Webmail)
└── Let's Encrypt (SSL/TLS)

WEB ADMINISTRATION:
└── Modoboa (User management) OR Postfixadmin

NOT RECOMMENDED FOR 2GB VPS:
├── ClamAV (Too resource intensive)
├── SpamAssassin (Use Rspamd instead)
└── MySQL/PostgreSQL (Use SQLite for <10 users)
```

**Justification:**
- **Postfix:** Industry standard, excellent security, active development
- **Dovecot:** Best IMAP server, efficient, feature-rich
- **Rspamd:** Modern, efficient, superior to SpamAssassin
- **SQLite:** Minimal overhead for 5 users
- **SnappyMail:** Lightweight, modern, active development
- **Skip ClamAV:** Saves 200-400MB RAM, Rspamd sufficient

---

### 12.2 Expected Resource Usage

**With Recommended Stack:**
```
Total RAM Available: 2,048 MB (2GB)

Base System:          150 MB
Existing Nginx:        50 MB
Existing Node.js:    250 MB
Postfix:              80 MB
Dovecot:             150 MB
Rspamd:              150 MB
SnappyMail:          100 MB
SQLite:               10 MB
------------------------------------------
Total Used:          940 MB
Available Buffer:  1,108 MB

Comfortable margin: YES (54% buffer)
Peak capacity:      Excellent
Swap requirement:   Optional (2GB recommended)
```

**Disk Usage (5 users, medium usage):**
```
Year 1:  ~7.5 GB
Year 2: ~15 GB
Year 3: ~22.5 GB

Recommended: Start with 20 GB partition
```

---

### 12.3 Implementation Timeline

**Week 1: Planning & Preparation**
- Day 1-2: Review this guide, prepare DNS
- Day 3: Order VPS with correct specs
- Day 4-5: Configure DNS records
- Day 6-7: Request PTR record, verify DNS

**Week 2: Installation & Testing**
- Day 1-2: Install core software (Postfix, Dovecot, Rspamd)
- Day 3: Configure SSL certificates
- Day 4: Create test accounts
- Day 5-6: Test sending/receiving internally
- Day 7: Test deliverability to Gmail/Outlook

**Week 3: Webmail & Final Configuration**
- Day 1-2: Install and configure SnappyMail
- Day 3: Set up Modoboa or Postfixadmin
- Day 4: Configure backups
- Day 5: Set up monitoring
- Day 6: Document configurations
- Day 7: Final testing

**Week 4-7: IP Warm-up**
- Follow warm-up strategy (Section 6.1)
- Monitor deliverability daily
- Adjust based on feedback

**Week 8+: Production**
- Move DMARC from p=none to p=quarantine
- Continue monitoring
- Monthly maintenance

---

### 12.4 Cost Estimate

**Monthly Operating Costs:**

| Service | Estimated Cost |
|---------|----------------|
| **VPS (2GB RAM)** | $10-20/month |
| Domain (ementech.co.ke) | $10-15/year (~$1/month) |
| Backup storage (optional) | $0-5/month |
| Spam filtering service (optional) | $0-20/month |
| **Total (self-hosted)** | **$11-26/month** |

**Comparison with alternatives:**
- Google Workspace: $6-12/user/month = $30-60/month for 5 users
- Microsoft 365: $6-25/user/month = $30-125/month for 5 users
- Professional email hosting: $2-10/user/month = $10-50/month for 5 users

**Savings:** Self-hosting saves $19-134/month compared to alternatives

**Trade-offs:**
- ✅ Cost savings
- ✅ Full control
- ✅ Privacy
- ⚠️ Requires maintenance
- ⚠️ Deliverability responsibility
- ⚠️ Security responsibility

---

### 12.5 Success Criteria

**Your email server is successful when:**

- [ ] Emails reach Gmail inbox (not spam) consistently
- [ ] Emails reach Outlook inbox (not spam) consistently
- [ ] Mail-Tester score ≥9/10
- [ ] SPF/DKIM/DMARC all passing
- [ ] No blacklisted IPs
- [ ] Spam folder contains actual spam
- [ ] Legitimate emails in inbox
- [ ] Webmail works on mobile devices
- [ ] Backups automated and tested
- [ ] Monitoring configured and working
- [ ] Documentation complete
- [ ] Users trained

---

## Conclusion

Self-hosting email for a small business in 2025 is **absolutely viable** with the right approach:

**Critical Success Factors:**
1. ✅ **Proper DNS configuration** (SPF, DKIM, DMARC) - Non-negotiable
2. ✅ **IP warm-up strategy** - Essential for new IPs
3. ✅ **Regular maintenance** - Weekly monitoring required
4. ✅ **Security-first** - TLS, firewalls, fail2ban
5. ✅ **Monitoring** - Know when problems occur

**Recommended Stack for 2GB VPS:**
- Postfix + Dovecot + Rspamd + SnappyMail + SQLite
- Skip ClamAV (too resource-heavy)
- Use Let's Encrypt for SSL

**Expected Resource Usage:**
- ~940MB RAM used (46% of 2GB)
- Comfortable 54% buffer for peaks
- Excellent performance for 5 users

**Timeline to Full Production:**
- 3 weeks for setup and testing
- 4 weeks for IP warm-up
- 7 weeks total to full deliverability

**Cost:**
- $11-26/month vs $30-125/month for alternatives
- Saves $19-134/month
- Requires time investment for maintenance

**Final Recommendation:**

For Ementech Technologies with 1-5 email accounts, self-hosting is **recommended** if you:
- Have technical skills to maintain it
- Can commit 2-4 hours/month for maintenance
- Understand deliverability is your responsibility
- Value privacy and control over cost savings

Consider professional email hosting if you:
- Lack technical skills or time
- Need guaranteed uptime
- Want zero maintenance
- Prefer predictable support costs

**Next Steps:**
1. Review this document thoroughly
2. Complete the implementation checklist (Section 7)
3. Start with DNS configuration
4. Follow the installation timeline
5. Monitor closely during warm-up period

Good luck with your self-hosted email journey!

---

**Document Version:** 1.0
**Last Updated:** January 19, 2025
**Prepared by:** Claude Code (Anthropic)
**Research Methodology:** Best practices, official documentation, industry standards as of January 2025

---

## Appendix A: Quick Reference Commands

```bash
# Service Management
systemctl status postfix dovecot rspamd
systemctl restart postfix dovecot rspamd

# Queue Management
mailq                              # View queue
postqueue -f                       # Flush queue
postsuper -d ALL                   # Delete all queued mail
postsuper -d ALL deferred          # Delete all deferred

# Testing
telnet localhost 25                # Test SMTP
openssl s_client -connect localhost:993  # Test IMAPS
doveadm auth test user@domain.com  # Test authentication

# Logs
tail -f /var/log/mail.log          # Follow main log
tail -f /var/log/mail.log | grep sasl  # Follow auth logs

# DNS Testing
dig domain.com MX                  # Test MX record
dig domain.com TXT                 # Test TXT/SPF
dig _15.domain.com TXT             # Test DMARC

# Backup
rsync -av /home/user/Maildir/ /backup/
tar -czf email-backup.tar.gz /home/*/Maildir/

# Monitoring
free -h                            # Check memory
df -h                              # Check disk
ps aux --sort=-%mem | head         # Find memory hogs
```

---

## Appendix B: Common Ports Reference

| Port | Protocol | Purpose | Encrypted |
|------|----------|---------|-----------|
| 25 | SMTP | Incoming mail | No (STARTTLS optional) |
| 587 | SMTP | Submission (outgoing) | Yes (STARTTLS) |
| 465 | SMTPS | Submission (legacy) | Yes (SSL/TLS) |
| 143 | IMAP | Email retrieval | No (STARTTLS optional) |
| 993 | IMAPS | Email retrieval | Yes (SSL/TLS) |
| 110 | POP3 | Email retrieval | No (STARTTLS optional) |
| 995 | POP3S | Email retrieval | Yes (SSL/TLS) |
| 4190 | Sieve | Mail filtering | Yes (STARTTLS) |

**Firewall Configuration:**
```bash
ufw allow 25/tcp    # SMTP (required for receiving)
ufw allow 587/tcp   # Submission (for sending)
ufw allow 993/tcp   # IMAPS (for webmail/clients)
ufw allow 80/tcp    # HTTP (for Let's Encrypt)
ufw allow 443/tcp   # HTTPS (for webmail)
```

---

## Appendix C: Security Best Practices Summary

1. ✅ Require TLS for authentication (`smtpd_tls_auth_only = yes`)
2. ✅ Use strong passwords (minimum 12 characters, mixed case, numbers, symbols)
3. ✅ Enable fail2ban for brute-force protection
4. ✅ Regular security updates (`apt update && apt upgrade`)
5. ✅ Monitor logs for suspicious activity
6. ✅ Implement rate limiting (prevent spamming)
7. ✅ Use SPF, DKIM, DMARC (required in 2025)
8. ✅ Regular backups (automated, tested)
9. ✅ Principle of least privilege for user accounts
10. ✅ Disable unused services and ports

---

**END OF REPORT**
