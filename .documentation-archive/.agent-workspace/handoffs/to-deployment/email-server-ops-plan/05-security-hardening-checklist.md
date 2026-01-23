# Email Server Security Hardening Checklist

## Overview

This checklist provides comprehensive security measures for the EmenTech email server. Each item should be completed and verified before putting the server into production.

**Total Security Items:** 50
**Target Score:** 50/50 (100%)
**Minimum Acceptable:** 45/50 (90%)

Track progress: ☐ = Not started, ☑ = In progress, ✓ = Complete

---

## 1. Firewall Configuration (12 items)

### Basic Firewall Setup
- [ ] UFW installed and enabled
  ```bash
  apt install ufw && ufw enable
  ```
  **Verify:** `ufw status verbose` shows "Status: active"

- [ ] Default deny incoming, allow outgoing
  ```bash
  ufw default deny incoming
  ufw default allow outgoing
  ```

- [ ] SSH allowed (if needed)
  ```bash
  ufw allow 22/tcp
  ```

- [ ] HTTP/HTTPS allowed for webmail
  ```bash
  ufw allow 80/tcp && ufw allow 443/tcp
  ```

- [ ] SMTP (25) allowed
  ```bash
  ufw allow 25/tcp
  ```

- [ ] SMTP Submission (587) allowed
  ```bash
  ufw allow 587/tcp
  ```

- [ ] SMTPS (465) allowed (recommended)
  ```bash
  ufw allow 465/tcp
  ```

- [ ] IMAPS (993) allowed
  ```bash
  ufw allow 993/tcp
  ```

- [ ] IMAP (143) allowed (optional)
  ```bash
  ufw allow 143/tcp
  ```

- [ ] POP3S (995) allowed (optional)
  ```bash
  ufw allow 995/tcp
  ```

- [ ] POP3 (110) allowed (optional)
  ```bash
  ufw allow 110/tcp
  ```

- [ ] Rate limiting configured
  ```bash
  ufw limit 22/tcp && ufw limit 25/tcp && ufw limit 587/tcp
  ```

---

## 2. SSL/TLS Hardening (8 items)

### Certificate Configuration
- [ ] Let's Encrypt certificate obtained
  ```bash
  certbot --nginx -d mail.ementech.co.ke -d webmail.ementech.co.ke
  ```
  **Verify:** `certbot certificates` shows valid cert

- [ ] Auto-renewal configured
  ```bash
  systemctl enable certbot.timer && systemctl start certbot.timer
  ```

### TLS Configuration
- [ ] Postfix TLS 1.2+ only
  ```bash
  # /etc/postfix/main.cf:
  smtpd_tls_protocols = !SSLv2, !SSLv3, !TLSv1, !TLSv1.1
  smtpd_tls_mandatory_protocols = !SSLv2, !SSLv3, !TLSv1, !TLSv1.1
  ```

- [ ] Postfix strong ciphers
  ```bash
  smtpd_tls_ciphers = medium:null
  smtpd_tls_mandatory_ciphers = high
  smtpd_tls_exclude_ciphers = RC4, aNULL
  ```

- [ ] Dovecot TLS 1.2+ only
  ```bash
  # /etc/dovecot/conf.d/10-ssl.conf:
  ssl_protocols = !SSLv3 !TLSv1 !TLSv1.1
  ssl_min_protocol = TLSv1.2
  ```

- [ ] Dovecot strong ciphers
  ```bash
  ssl_cipher_list = ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384
  ssl_prefer_server_ciphers = yes
  ```

- [ ] Plain text auth disabled
  ```bash
  # /etc/dovecot/conf.d/10-auth.conf:
  disable_plaintext_auth = yes
  ```

- [ ] TLS required for SMTP auth
  ```bash
  # /etc/postfix/main.cf:
  smtpd_tls_auth_only = yes
  ```

---

## 3. Intrusion Prevention (5 items)

### Fail2ban Configuration
- [ ] Fail2ban installed
  ```bash
  apt install fail2ban && systemctl enable fail2ban
  ```

- [ ] Postfix-SASL jail configured
  ```bash
  # /etc/fail2ban/jail.d/custom.conf:
  [postfix-sasl]
  enabled = true
  maxretry = 5
  findtime = 600
  bantime = 3600
  ```
  **Verify:** `fail2ban-client status postfix-sasl`

- [ ] Dovecot jail configured
  ```bash
  [dovecot]
  enabled = true
  maxretry = 5
  findtime = 600
  bantime = 3600
  ```
  **Verify:** `fail2ban-client status dovecot`

- [ ] Recidive jail for repeat offenders
  ```bash
  [recidive]
  enabled = true
  bantime = 86400  # 24 hours
  findtime = 86400
  maxretry = 3
  ```

- [ ] Email alerts configured
  ```bash
  # /etc/fail2ban/jail.local:
  destemail = admin@ementech.co.ke
  action = %(action_mwl)s
  ```

---

## 4. Authentication Security (4 items)

### Password Policy
- [ ] Strong password requirements
  - Minimum 12 characters
  - Requires uppercase, lowercase, numbers, special chars
  - Cannot reuse last 10 passwords

- [ ] Password expiration configured
  ```bash
  # Force password change every 90 days
  PASS_MAX_DAYS 90  # /etc/login.defs
  ```

- [ ] Account lockout after failed attempts
  ```bash
  # Lock after 10 failed attempts for 30 minutes
  ```

- [ ] Two-factor authentication evaluated
  - [ ] Implemented: Yes/No
  - [ ] Alternative controls documented

---

## 5. Relay Prevention (5 items)

### Postfix Configuration
- [ ] mynetworks restricted to localhost
  ```bash
  # /etc/postfix/main.cf:
  mynetworks = 127.0.0.0/8 [::ffff:127.0.0.0]/104 [::1]/128
  ```

- [ ] Relay restrictions configured
  ```bash
  smtpd_relay_restrictions =
      permit_mynetworks,
      permit_sasl_authenticated,
      defer_unauth_destination
  ```

- [ ] Recipient restrictions configured
  ```bash
  smtpd_recipient_restrictions =
      permit_mynetworks,
      permit_sasl_authenticated,
      reject_non_fqdn_recipient,
      reject_unknown_recipient_domain,
      reject_unauth_destination
  ```

- [ ] HELO/EHLO restrictions configured
  ```bash
  smtpd_helo_required = yes
  smtpd_helo_restrictions =
      permit_mynetworks,
      permit_sasl_authenticated,
      reject_invalid_helo_hostname,
      reject_non_fqdn_helo_hostname
  ```

- [ ] Open relay tested and verified secure
  ```bash
  # Test from external machine - must reject relay attempts
  # Use: https://mxtoolbox.com/diagnostic.aspx
  ```

---

## 6. Email Security (6 items)

### SPF/DKIM/DMARC
- [ ] SPF record published
  ```
  TXT: v=spf1 mx ~all
  ```
  **Verify:** `dig TXT ementech.co.ke`

- [ ] DKIM keys generated and configured
  ```bash
  rspamadm dkim_keygen -d ementech.co.ke -s default -b 2048
  ```
  **Verify:** `/var/lib/rspamd/dkim/` contains keys

- [ ] DKIM public key in DNS
  ```
  TXT: default._domainkey.ementech.co.ke
  v=DKIM1; k=rsa; p=PUBLIC_KEY
  ```
  **Verify:** `dig TXT default._domainkey.ementech.co.ke`

- [ ] DMARC record published
  ```
  TXT: _dmarc.ementech.co.ke
  v=DMARC1; p=none; rua=mailto:dmarc@ementech.co.ke; pct=100
  ```
  **Verify:** `dig TXT _dmarc.ementech.co.ke`

- [ ] DKIM signing working
  ```bash
  # Send test email and check headers for DKIM-Signature
  # Validate: https://dkimvalidator.com/
  ```

- [ ] DMARC reports being received
  ```bash
  # Check dmarc@ementech.co.ke for reports
  ```

---

## 7. Anti-Spam Configuration (3 items)

### rspamd Setup
- [ ] rspamd installed and running
  ```bash
  apt install rspamd redis-server
  systemctl enable rspamd redis-server
  ```
  **Verify:** `systemctl status rspamd`

- [ ] Spam threshold configured
  ```bash
  # /etc/rspamd/local.d/actions.conf:
  threshold = 8.0;
  subject = "*** SPAM ***";
  ```

- [ ] Spam filter tested
  ```bash
  # GTUBE test (should be marked as spam):
  echo "XJS*C4JDBQADN1.NSBN3*2IDNEN*GTUBE-STANDARD-ANTI-UBE-TEST-EMAIL*C.34X" | mail -s "GTUBE" test@ementech.co.ke
  ```

---

## 8. Log Security (4 items)

### Log Configuration
- [ ] Log files have secure permissions
  ```bash
  chmod 640 /var/log/mail.log
  chown root:adm /var/log/mail.log
  ```

- [ ] Log rotation configured
  ```bash
  # /etc/logrotate.d/mail: daily rotation, keep 30 days
  ```

- [ ] Logwatch configured
  ```bash
  apt install logwatch
  # /usr/share/logwatch/default.conf/logwatch.conf:
  MailTo = admin@ementech.co.ke
  ```
  **Verify:** Daily reports received

- [ ] Automated security alerts configured
  ```bash
  # For authentication failures, spam attacks, etc.
  ```

---

## 9. System Hardening (3 items)

### OS Security
- [ ] All packages updated
  ```bash
  apt update && apt upgrade -y && apt autoremove -y
  ```

- [ ] Unattended upgrades configured
  ```bash
  apt install unattended-upgrades
  dpkg-reconfigure -plow unattended-upgrades
  ```

- [ ] Unnecessary services disabled
  ```bash
  # Review: systemctl list-unit-files --type=service
  # Disable unused services
  ```

---

## 10. Security Testing (3 items)

### Vulnerability Assessment
- [ ] SSL Labs test completed
  - Visit: https://www.ssllabs.com/ssltest/
  - Target: Grade A or A+

- [ ] Email security test completed
  - Visit: https://www.mail-tester.com/
  - Target: 9/10 or 10/10

- [ ] Security scan completed
  ```bash
  nmap -sV mail.ementech.co.ke
  # Review and address any critical vulnerabilities
  ```

---

## Scoring and Summary

**Completed Items:** _____ / 50

**Security Score:** _____%

**Security Grade:**
- **100% (50/50):** Excellent - Best practices
- **95-99% (47-49):** Very Good - Minor improvements
- **90-94% (45-46):** Good - Meets requirements
- **80-89% (40-44):** Fair - Needs improvement
- **<80% (<40):** Poor - Security risks present

**Critical Items (Must Complete):**
- [ ] Firewall configured (all ports)
- [ ] SSL/TLS 1.2+ only
- [ ] Not an open relay
- [ ] Fail2ban configured
- [ ] SPF/DKIM/DMARC configured

**Next Review Date:** __________________
**Reviewed By:** __________________
**Approved By:** __________________
