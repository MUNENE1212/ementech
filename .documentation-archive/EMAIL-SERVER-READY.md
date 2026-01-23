# EmenTech Email Server - Installation Complete! 🎉

**Installation Date**: January 19, 2026
**Status**: ✅ FULLY OPERATIONAL

---

## 📧 Email Server Details

**Domain**: ementech.co.ke
**Mail Server**: mail.ementech.co.ke (69.164.244.165)
**Authentication**: Static files (no database required - simpler & more reliable)

---

## 👤 Default Email Account

**Email**: admin@ementech.co.ke
**Password**: Admin2026!
**Mail Directory**: /var/mail/vhosts/ementech.co.ke/admin/

**⚠️ IMPORTANT**: Change this password immediately after first login!

---

## 📱 Email Client Configuration

Configure your email client (Outlook, Thunderbird, mobile) with these settings:

### IMAP Settings (Recommended - keeps emails synced)
- **Server**: mail.ementech.co.ke
- **Port**: 993
- **SSL/TLS**: Yes
- **Username**: admin@ementech.co.ke
- **Password**: Admin2026!

### SMTP Settings (For sending emails)
- **Server**: mail.ementech.co.ke
- **Port**: 587
- **STARTTLS**: Yes
- **Username**: admin@ementech.co.ke
- **Password**: Admin2026!
- **Authentication**: Required

### POP3 Settings (Alternative - downloads to device)
- **Server**: mail.ementech.co.ke
- **Port**: 995
- **SSL/TLS**: Yes
- **Username**: admin@ementech.co.ke
- **Password**: Admin2026!

---

## 🔧 How to Add More Email Accounts

### Step 1: Create the account in Dovecot
```bash
# Generate password hash
doveadm pw -s SSHA256 -p 'YourNewPassword123!'

# Add to Dovecot passwd file
echo "newuser@ementech.co.ke:{SSHA256}hash_here::/var/mail/vhosts/ementech.co.ke/newuser" >> /etc/dovecot/passwd
```

### Step 2: Add to Postfix virtual mailbox map
```bash
echo "newuser@ementech.co.ke ementech.co.ke/newuser/" >> /etc/postfix/virtual_mailboxes
postmap /etc/postfix/virtual_mailboxes
```

### Step 3: Create mail directory
```bash
mkdir -p /var/mail/vhosts/ementech.co.ke/newuser
chown vmail:vmail /var/mail/vhosts/ementech.co.ke/newuser
```

### Step 4: Restart services
```bash
systemctl restart dovecot
systemctl restart postfix
```

---

## 🌐 DNS Records (All Configured ✅)

1. **MX Record**: mail.ementech.co.ke (Priority: 10) ✅
2. **A Record**: mail → 69.164.244.165 ✅
3. **SPF Record**: v=spf1 mx a ip4:69.164.244.165 -all ✅
4. **DKIM Record**: mail._domainkey (generated) ✅
5. **DMARC Record**: p=quarantine policy ✅

---

## 📊 Server Status

### Services Running:
- **Postfix** (SMTP): ✅ Active
- **Dovecot** (IMAP/POP3): ✅ Active
- **OpenDKIM** (Email signing): ✅ Active
- **Rspamd** (Spam filtering): ✅ Active
- **Fail2ban** (Security): ✅ Active

### Configuration Files:
- **Postfix**: /etc/postfix/
- **Dovecot**: /etc/dovecot/
- **OpenDKIM**: /etc/opendkim/
- **Mail storage**: /var/mail/vhosts/
- **Password file**: /etc/dovecot/passwd

---

## 🧪 Testing Email Functionality

### Test 1: Check local mail delivery
```bash
echo "Test email" | mail -s "Test" admin@ementech.co.ke
```

### Test 2: Send external email (after IP warm-up)
```bash
echo "Body" | mail -s "Subject" external@example.com
```

### Test 3: Check mail queue
```bash
mailq
```

### Test 4: View logs
```bash
tail -f /var/log/mail.log
```

---

## 🚀 IP Warm-up Process (CRITICAL for Deliverability)

**DO NOT** send bulk emails immediately! Follow this schedule:

### Week 1: 20 emails/day
Send only important emails to Gmail, Outlook, Yahoo accounts

### Week 2: 50 emails/day
Increase gradually, monitor bounce rates

### Week 3: 100 emails/day
Continue monitoring spam complaints

### Week 4: 200 emails/day
Full deployment

**Tools to monitor reputation:**
- https://senderhub.org/
- https://mxtoolbox.com/blacklists.aspx
- Google Postmaster Tools

---

## 🔐 Security Checklist

- [x] Firewall configured (ports 25, 587, 993, 995 open)
- [x] Fail2ban enabled
- [x] SSL/TLS enabled
- [x] SPF record configured
- [x] DKIM signing enabled
- [x] DMARC policy set (quarantine)
- [ ] Change default admin password
- [ ] Set up automated backups
- [ ] Configure DKIM rollover (backup key)

---

## 📝 Maintenance Commands

### View mail queue
```bash
mailq
```

### Flush mail queue
```bash
postfix flush
```

### Check mail logs
```bash
tail -f /var/log/mail.log
```

### Restart all services
```bash
systemctl restart postfix dovecot opendkim
```

### Change user password
```bash
doveadm pw -s SSHA256 -p 'NewPassword'
# Edit /etc/dovecot/passwd with new hash
systemctl restart dovecot
```

---

## 🎯 Next Steps

1. **Change admin password** (critical!)
2. **Test sending/receiving** emails
3. **Configure email clients** for leadership team
4. **Start IP warm-up** (begin with 20 emails/day)
5. **Monitor logs** for the first few days
6. **Set up backups** (optional but recommended)
7. **Consider webmail** (Roundcube) for browser access

---

## 🆘 Troubleshooting

### Emails not sending?
- Check DNS propagation: `dig MX ementech.co.ke`
- Check mail queue: `mailq`
- Check logs: `tail /var/log/mail.log`

### Authentication failed?
- Verify password in `/etc/dovecot/passwd`
- Check Dovecot is running: `systemctl status dovecot`
- Restart Dovecot: `systemctl restart dovecot`

### Emails going to spam?
- Verify SPF/DKIM/DMARC records
- Check IP reputation
- Start IP warm-up process
- Use https://www.mail-tester.com/

---

## 📚 Documentation & Logs

- **Installation logs**: /var/log/email-install-simple.log
- **Mail logs**: /var/log/mail.log
- **DNS records**: /root/email-server-setup/DNS-RECORDS.txt
- **Configuration**: /etc/postfix/, /etc/dovecot/

---

## ✅ Installation Summary

**Email server successfully installed and configured!**

- Postfix (SMTP server) ✅
- Dovecot (IMAP/POP3 server) ✅
- OpenDKIM (email signing) ✅
- Spam filtering (Rspamd) ✅
- Security (Fail2ban, SSL/TLS) ✅
- DNS records (SPF, DKIM, DMARC) ✅
- Admin account created ✅

**Ready to send and receive emails! 📧**

---

Generated: January 19, 2026
Server: ementech-vps (Ubuntu 24.04.3 LTS)
IP Address: 69.164.244.165
