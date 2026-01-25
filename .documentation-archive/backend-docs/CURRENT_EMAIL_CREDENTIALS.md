# 🔒 Email Server Credentials

## Production Credentials

**Last Updated:** January 19, 2026

---

### Connection Information

**IMAP (Incoming Mail):**
```
Host: mail.ementech.co.ke
Port: 993
SSL/TLS: Yes
Username: admin@ementech.co.ke
Password: JpeQQEbwpzQDe8o5OPst
```

**SMTP (Outgoing Mail):**
```
Host: mail.ementech.co.ke
Port: 587
STARTTLS: Yes
Username: admin@ementech.co.ke
Password: JpeQQEbwpzQDe8o5OPst
```

---

### Environment Variables (.env)

```
IMAP_HOST=mail.ementech.co.ke
IMAP_PORT=993
IMAP_USER=admin@ementech.co.ke
IMAP_PASS=JpeQQEbwpzQDe8o5OPst
SMTP_HOST=mail.ementech.co.ke
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=admin@ementech.co.ke
SMTP_PASS=JpeQQEbwpzQDe8o5OPst
```

---

### Testing

Run the email test script:
```bash
cd backend
node test-email-system.js
```

---

### Security Notes

- Password: 20-character alphanumeric (strong)
- No special characters to avoid encoding issues
- Changed from temporary "testpass123" on January 19, 2026
- Configuration files updated on both VPS and local

---

### Backup Information

Backup of old password file: `/etc/dovecot/passwd.backup` on VPS

---

⚠️ **Keep this file secure and do not commit to public repositories!**
