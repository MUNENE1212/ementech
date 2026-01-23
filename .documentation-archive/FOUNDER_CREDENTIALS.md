# EmenTech Founder Credentials

**IMPORTANT: KEEP THIS FILE SECURE AND CHANGE PASSWORDS AFTER FIRST LOGIN!**

---

## Founder Accounts

### 1. Munene (Founder & CEO)
- **Email:** `munene@ementech.co.ke`
- **Password:** `EmenTech2026!Munene`
- **Role:** Admin
- **Department:** Leadership
- **Login URL:** https://ementech.co.ke/login
- **Status:** ✅ Created

---

### 2. Co-founder
- **Email:** `founder2@ementech.co.ke`
- **Password:** `EmenTech2026!Founder2`
- **Role:** Admin
- **Department:** Leadership
- **Login URL:** https://ementech.co.ke/login
- **Status:** ✅ Created

---

### 3. CTO (Chief Technology Officer)
- **Email:** `cto@ementech.co.ke`
- **Password:** `EmenTech2026!CTO`
- **Role:** Admin
- **Department:** Engineering
- **Login URL:** https://ementech.co.ke/login
- **Status:** ✅ Created

---

## Email Server Configuration

Email accounts need to be created on the mail server at `69.164.244.165`.

### Email Server Details:
- **IMAP Host:** mail.ementech.co.ke
- **IMAP Port:** 993
- **SMTP Host:** mail.ementech.co.ke
- **SMTP Port:** 587
- **Security:** TLS/STARTTLS

### Create Email Accounts on Mail Server:

SSH into the mail server and run these commands:

```bash
# SSH to mail server
ssh root@69.164.244.165

# Add system users for email accounts
useradd -m -s /bin/bash munene
useradd -m -s /bin/bash founder2
useradd -m -s /bin/bash cto

# Set passwords (use the same passwords as above)
echo "munene:EmenTech2026!Munene" | chpasswd
echo "founder2:EmenTech2026!Founder2" | chpasswd
echo "cto:EmenTech2026!CTO" | chpasswd

# Configure Dovecot mailboxes
doveadm mailbox create -u munene@ementech.co.ke INBOX
doveadm mailbox create -u founder2@ementech.co.ke INBOX
doveadm mailbox create -u cto@ementech.co.ke INBOX

# Create default folders for each account
for user in munene founder2 cto; do
  for folder in Sent Drafts Trash Spam Archive; do
    doveadm mailbox create -u ${user}@ementech.co.ke $folder
  done
done
```

---

## Next Steps

### 1. Change Passwords (CRITICAL)
After first login, all founders should:
- Log in to their account
- Go to Profile page
- Change their password immediately
- Use a strong, unique password

### 2. Configure Email in Application
Once email accounts are created on the server:
1. Log in as founder
2. Navigate to Email section
3. Add email account with IMAP/SMTP settings
4. Verify email sync works

### 3. Update Profile Information
Each founder should:
- Add their full name
- Update department if needed
- Add profile picture
- Set notification preferences

---

## Security Notes

⚠️ **IMPORTANT SECURITY REMINDERS:**

1. **This file contains sensitive credentials** - Store securely
2. **Change passwords immediately** after first login
3. **Use strong, unique passwords** for each account
4. **Enable 2FA** if implemented in the future
5. **Never share credentials** via email or chat
6. **Delete this file** after all accounts are set up

---

## Admin Features

As admin users, founders have access to:

- ✅ User management (create, edit, delete users)
- ✅ Email management (view, send, manage emails)
- ✅ Content management (posts, pages, media)
- ✅ Lead management (view and manage leads)
- ✅ Analytics and reports
- ✅ System settings
- ✅ Role and permission management

---

## Troubleshooting

### Login Issues
If you can't log in:
1. Check email is correct
2. Verify password is correct
3. Clear browser cache and cookies
4. Try incognito/private mode
5. Contact system admin

### Email Issues
If email doesn't work:
1. Verify email account created on mail server
2. Check IMAP/SMTP settings
3. Test connectivity to mail.ementech.co.ke
4. Check firewall rules
5. Review mail server logs

### Password Reset
If password is forgotten:
1. Contact another admin founder
2. Request password reset via MongoDB
3. Or use recovery flow if implemented

---

## Contact Information

For technical support:
- **System Admin:** cto@ementech.co.ke
- **Mail Server:** 69.164.244.165
- **Documentation:** See `/backend/README.md`

---

**Generated:** 2026-01-20
**Version:** 1.0.0
**Environment:** Production
