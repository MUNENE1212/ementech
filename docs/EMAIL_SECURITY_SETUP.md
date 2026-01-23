# Email Security Setup Guide

This guide covers the email security configuration for the EmenTech marketing platform, including TLS encryption, DKIM signing, SPF, DMARC, and troubleshooting delivery issues.

## Table of Contents

1. [Current Configuration](#current-configuration)
2. [TLS/STARTTLS Encryption](#tlsstarttls-encryption)
3. [DNS Records Setup](#dns-records-setup)
4. [DKIM Signing](#dkim-signing)
5. [Troubleshooting 451 Errors](#troubleshooting-451-errors)
6. [Running Diagnostics](#running-diagnostics)
7. [Mail Server Configuration](#mail-server-configuration)

---

## Current Configuration

### SMTP Settings
```
Host: mail.ementech.co.ke
Port: 587 (STARTTLS)
Encryption: TLS 1.2+
Authentication: Username/Password
```

### IMAP Settings
```
Host: mail.ementech.co.ke
Port: 993 (Implicit TLS)
Encryption: TLS 1.2+
```

---

## TLS/STARTTLS Encryption

The system uses secure TLS configuration with the following settings:

### Supported TLS Versions
- Minimum: TLS 1.2
- Recommended: TLS 1.3

### Cipher Suites (Priority Order)
1. ECDHE-ECDSA-AES256-GCM-SHA384
2. ECDHE-RSA-AES256-GCM-SHA384
3. ECDHE-ECDSA-CHACHA20-POLY1305
4. ECDHE-RSA-CHACHA20-POLY1305
5. ECDHE-ECDSA-AES128-GCM-SHA256
6. ECDHE-RSA-AES128-GCM-SHA256

### Port Configuration
- **Port 587**: Uses STARTTLS (upgrade plain connection to encrypted)
- **Port 465**: Uses implicit TLS (encrypted from start)
- **Port 993**: IMAP with implicit TLS

---

## DNS Records Setup

### 1. SPF Record (Sender Policy Framework)

SPF tells receiving servers which servers are authorized to send email for your domain.

**Add this TXT record to your DNS:**

```
Name: ementech.co.ke (or @)
Type: TXT
Value: v=spf1 a mx ip4:YOUR_SERVER_IP include:_spf.google.com ~all
```

**Explanation:**
- `v=spf1` - SPF version
- `a` - Allow domain's A record IP
- `mx` - Allow domain's MX record servers
- `ip4:YOUR_SERVER_IP` - Replace with your mail server's IP
- `include:_spf.google.com` - If using Gmail for some sending
- `~all` - Soft fail for others (use `-all` for hard fail)

### 2. DKIM Record (DomainKeys Identified Mail)

DKIM signs outgoing emails to prove they haven't been tampered with.

**Step 1: Generate DKIM keys**
```bash
cd backend
node scripts/email-diagnostics.js --generate-dkim
```

**Step 2: Add the TXT record to DNS**
```
Name: default._domainkey.ementech.co.ke
Type: TXT
Value: v=DKIM1; k=rsa; p=YOUR_PUBLIC_KEY_HERE
```

**Step 3: Add private key to .env**
```
DKIM_SELECTOR=default
DKIM_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
```

### 3. DMARC Record (Domain-based Message Authentication)

DMARC tells receivers what to do with emails that fail SPF/DKIM checks.

**Add this TXT record:**
```
Name: _dmarc.ementech.co.ke
Type: TXT
Value: v=DMARC1; p=quarantine; rua=mailto:dmarc-reports@ementech.co.ke; pct=100
```

**Policy options:**
- `p=none` - Monitor only (start here)
- `p=quarantine` - Send to spam folder
- `p=reject` - Reject completely

### 4. MX Records (Mail Exchange)

MX records tell other servers where to deliver mail for your domain.

```
Name: ementech.co.ke
Type: MX
Priority: 10
Value: mail.ementech.co.ke
```

---

## DKIM Signing

### Enabling DKIM in Production

1. Generate DKIM key pair:
   ```bash
   node scripts/email-diagnostics.js --generate-dkim
   ```

2. Add the DNS TXT record as shown in output

3. Add to your `.env`:
   ```
   DKIM_SELECTOR=default
   DKIM_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBg...\n-----END PRIVATE KEY-----"
   ```

4. Restart the application

### Verifying DKIM

```bash
node scripts/email-diagnostics.js --dkim
```

---

## Troubleshooting 451 Errors

### Error: "451 4.3.5 : Recipient address rejected: Server configuration problem"

This error means the **receiving** mail server (mail.ementech.co.ke) has a configuration issue. The sender is correct, but the destination mailbox isn't properly set up.

### Common Causes & Fixes

#### 1. Virtual Mailbox Not Configured

**Check Postfix virtual mailbox configuration:**

```bash
# SSH into mail server
ssh root@mail.ementech.co.ke

# Check virtual mailbox domains
cat /etc/postfix/main.cf | grep virtual_mailbox
```

**Expected configuration in `/etc/postfix/main.cf`:**
```
virtual_mailbox_domains = ementech.co.ke
virtual_mailbox_base = /var/mail/vhosts
virtual_mailbox_maps = hash:/etc/postfix/vmailbox
virtual_uid_maps = static:5000
virtual_gid_maps = static:5000
```

#### 2. Mailbox Entry Missing

**Check if mailbox exists in virtual mailbox file:**

```bash
cat /etc/postfix/vmailbox | grep admin@ementech.co.ke
```

**Add missing mailbox:**
```bash
echo "admin@ementech.co.ke    ementech.co.ke/admin/" >> /etc/postfix/vmailbox
postmap /etc/postfix/vmailbox
systemctl reload postfix
```

#### 3. Dovecot User Not Created

**Check if Dovecot knows the user:**
```bash
doveadm user admin@ementech.co.ke
```

**If user doesn't exist, create it:**
```bash
# For system users:
doveadm user add admin@ementech.co.ke

# For virtual users in database, add to the virtual_users table
```

#### 4. Directory Permissions

**Check mailbox directory exists and has correct permissions:**
```bash
ls -la /var/mail/vhosts/ementech.co.ke/admin/
```

**Create and set permissions if missing:**
```bash
mkdir -p /var/mail/vhosts/ementech.co.ke/admin
chown -R vmail:vmail /var/mail/vhosts/ementech.co.ke/
chmod -R 700 /var/mail/vhosts/ementech.co.ke/
```

#### 5. Check Mail Logs

```bash
# Real-time log monitoring
tail -f /var/log/mail.log

# Or check recent errors
grep "451" /var/log/mail.log | tail -20
```

### Quick Fix Checklist

1. [ ] Virtual domain is in `virtual_mailbox_domains`
2. [ ] Mailbox entry exists in `/etc/postfix/vmailbox`
3. [ ] `postmap /etc/postfix/vmailbox` has been run
4. [ ] Dovecot user exists
5. [ ] Mailbox directory exists with correct permissions (vmail:vmail)
6. [ ] Postfix has been reloaded: `systemctl reload postfix`

---

## Running Diagnostics

### Full Diagnostics

```bash
cd backend
node scripts/email-diagnostics.js
```

This runs:
- DNS security audit (SPF, DKIM, DMARC, MX)
- SMTP connection tests
- Mailbox receiving capability check

### Individual Tests

```bash
# DNS/Security audit only
node scripts/email-diagnostics.js --audit

# SMTP diagnostics only
node scripts/email-diagnostics.js --smtp

# Test sending to external address
node scripts/email-diagnostics.js --test-send user@gmail.com

# Test mailbox receiving
node scripts/email-diagnostics.js --mailbox admin@ementech.co.ke

# Generate new DKIM keys
node scripts/email-diagnostics.js --generate-dkim

# Check individual DNS records
node scripts/email-diagnostics.js --spf
node scripts/email-diagnostics.js --dkim
node scripts/email-diagnostics.js --dmarc
node scripts/email-diagnostics.js --mx
```

---

## Mail Server Configuration

### Postfix Configuration Reference

**`/etc/postfix/main.cf` key settings:**

```conf
# Basic settings
myhostname = mail.ementech.co.ke
mydomain = ementech.co.ke
myorigin = $mydomain

# Virtual mailbox configuration
virtual_mailbox_domains = ementech.co.ke
virtual_mailbox_base = /var/mail/vhosts
virtual_mailbox_maps = hash:/etc/postfix/vmailbox
virtual_uid_maps = static:5000
virtual_gid_maps = static:5000
virtual_alias_maps = hash:/etc/postfix/virtual

# TLS Configuration
smtpd_tls_cert_file = /etc/ssl/certs/mail.ementech.co.ke.crt
smtpd_tls_key_file = /etc/ssl/private/mail.ementech.co.ke.key
smtpd_use_tls = yes
smtpd_tls_security_level = may
smtpd_tls_protocols = !SSLv2, !SSLv3, !TLSv1, !TLSv1.1
smtpd_tls_mandatory_protocols = !SSLv2, !SSLv3, !TLSv1, !TLSv1.1

# Submission port (587)
submission inet n       -       y       -       -       smtpd
  -o syslog_name=postfix/submission
  -o smtpd_tls_security_level=encrypt
  -o smtpd_sasl_auth_enable=yes
  -o smtpd_client_restrictions=permit_sasl_authenticated,reject
```

### Dovecot Configuration Reference

**`/etc/dovecot/dovecot.conf` key settings:**

```conf
protocols = imap lmtp

ssl = required
ssl_cert = </etc/ssl/certs/mail.ementech.co.ke.crt
ssl_key = </etc/ssl/private/mail.ementech.co.ke.key
ssl_min_protocol = TLSv1.2

mail_location = maildir:/var/mail/vhosts/%d/%n
mail_privileged_group = mail

# Authentication
auth_mechanisms = plain login

passdb {
  driver = pam
}

userdb {
  driver = passwd
}
```

---

## Security Checklist

- [ ] TLS 1.2+ enforced for all connections
- [ ] STARTTLS required on port 587
- [ ] SPF record configured
- [ ] DKIM signing enabled
- [ ] DMARC policy set (at least `p=quarantine`)
- [ ] Certificate is valid and not expired
- [ ] Strong ciphers only (no RC4, DES, etc.)
- [ ] Authentication required for sending
- [ ] Rate limiting configured
- [ ] Bounce/complaint handling in place

---

## Support

For additional help:
1. Run diagnostics: `node scripts/email-diagnostics.js`
2. Check mail logs: `tail -f /var/log/mail.log`
3. Test with external tool: [mail-tester.com](https://www.mail-tester.com)
