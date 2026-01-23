# Email Server Fixes - Step by Step

## Issues Found:

### 1. **Postfix Submission Port (587) Not Enabled** 🔴 CRITICAL
- **Problem:** The submission service in `/etc/postfix/master.cf` is commented out
- **Impact:** Cannot send emails via SMTP on port 587
- **Fix:** Uncomment and configure submission service

### 2. **Possible Password Mismatch** 🟡 MODERATE
- **Problem:** The password hash in `/etc/dovecot/passwd` might not match "Admin2026!"
- **Impact:** IMAP authentication failures
- **Fix:** Regenerate password hash and update file

## Step-by-Step Fixes:

### Step 1: Enable Postfix Submission (Port 587)

Edit `/etc/postfix/master.cf` and uncomment the submission lines:

```bash
submission inet n       -       y       -       -       smtpd
  -o syslog_name=postfix/submission
  -o smtpd_tls_security_level=encrypt
  -o smtpd_sasl_auth_enable=yes
  -o smtpd_tls_auth_only=yes
  -o smtpd_reject_unlisted_recipient=no
  -o smtpd_recipient_restrictions=permit_sasl_authenticated,reject
  -o milter_macro_daemon_name=ORIGINATING
```

### Step 2: Verify/Update Dovecot Password

Generate new password hash:
```bash
doveadm pw -s SSHA256 -p 'Admin2026!'
```

Update `/etc/dovecot/passwd` with new hash:
```
admin@ementech.co.ke:{SSHA256}NEW_HASH::/var/mail/vhosts/ementech.co.ke/admin
```

### Step 3: Restart Services

```bash
systemctl restart postfix
systemctl restart dovecot
```

### Step 4: Verify Ports are Listening

```bash
netstat -tlnp | grep -E "(25|587|993)"
```

Expected output:
```
tcp    0    0.0.0.0:25     LISTEN  .../master
tcp    0    0.0.0.0:587    LISTEN  .../master
tcp    0    0.0.0.0:993    LISTEN  .../dovecot
```

### Step 5: Test Authentication

Test IMAP authentication:
```bash
openssl s_client -connect localhost:993 -crlf
# Then type: 1 login admin@ementech.co.ke Admin2026!
```

Test SMTP authentication:
```bash
openssl s_client -connect localhost:587 -starttls smtp -crlf
# Then test AUTH PLAIN
```

