# Infrastructure Blueprint

**Server:** 69.164.244.165 (mail.ementech.co.ke)

---

## System Specifications

| Property | Value |
|----------|-------|
| OS | Ubuntu 24.04.3 LTS |
| Kernel | 6.8.0-90-generic |
| CPU | 1 vCPU Intel Xeon |
| RAM | 2 GB |
| Disk | 40 GB SSD (31% used) |
| Swap | 512 MB |

---

## Network Configuration

### Open Ports

| Port | Service | Purpose |
|------|---------|---------|
| 22 | SSH | Remote access |
| 25 | Postfix | SMTP inbound |
| 80 | Nginx | HTTP redirect |
| 443 | Nginx | HTTPS |
| 587 | Postfix | SMTP submission |
| 993 | Dovecot | IMAPS |
| 995 | Dovecot | POP3S |
| 5000 | Node.js | Dumuwaks API |
| 5001 | Node.js | Ementech API |
| 5432 | PostgreSQL | Database (local) |
| 6379 | Redis | Cache (local) |

### Firewall (UFW)

```bash
# Status: active
# Default: deny incoming, allow outgoing

22/tcp    LIMIT IN    Anywhere    # SSH
80/tcp    ALLOW IN    Anywhere    # HTTP
443/tcp   ALLOW IN    Anywhere    # HTTPS
25/tcp    ALLOW IN    Anywhere    # SMTP
587/tcp   ALLOW IN    Anywhere    # SMTP Submit
465/tcp   ALLOW IN    Anywhere    # SMTPS
993/tcp   ALLOW IN    Anywhere    # IMAPS
995/tcp   ALLOW IN    Anywhere    # POP3S
```

---

## Hosted Applications

### Ementech Platform
- **Frontend:** /var/www/ementech-website/current
- **Backend:** /var/www/ementech-website/backend
- **Port:** 5001
- **PM2 Name:** ementech-backend

### Dumuwaks Marketplace
- **Frontend:** /var/www/dumuwaks/current
- **Backend:** /var/www/dumuwaks/backend
- **Port:** 5000
- **PM2 Name:** dumuwaks-backend

### Email Server
- **Domain:** mail.ementech.co.ke
- **MTA:** Postfix 3.8.6
- **IMAP/POP3:** Dovecot 2.3.21
- **Mail Storage:** /var/mail/vhosts

---

## Nginx Virtual Hosts

```
ementech.co.ke → /var/www/ementech-website/current
admin.ementech.co.ke → /var/www/admin-ementech/current
api.ementech.co.ke → localhost:5000 (Dumuwaks API)
dumuwaks.ementech.co.ke → /var/www/dumuwaks/current
mail.ementech.co.ke → /var/www/mail.ementech.co.ke
```

---

## SSL Certificates

Provider: Let's Encrypt (auto-renewal)

| Domain | Type | Expiry |
|--------|------|--------|
| ementech.co.ke | ECDSA | April 18, 2026 |
| admin.ementech.co.ke | ECDSA | April 25, 2026 |
| api.ementech.co.ke | ECDSA | April 21, 2026 |
| dumuwaks.ementech.co.ke | ECDSA | April 21, 2026 |
| mail.ementech.co.ke | ECDSA | April 21, 2026 |

---

## Process Management (PM2)

```
ID  Name                Status  Restarts  Memory
0   ementech-backend    online  0*       ~160 MB
1   dumuwaks-backend    online  57       ~100 MB
```

*Restart counter reset after memory fix

---

## Scheduled Tasks

### Root Crontab
```bash
# Email sync every 5 minutes
*/5 * * * * /var/www/ementech-website/backend/email-sync.sh

# Automated backup daily at 2:00 AM
0 2 * * * /usr/local/bin/ementech-backup.sh
```

### System Cron
```bash
# Health check every 5 minutes
*/5 * * * * root /var/www/shared/scripts/health-check.sh

# Resource monitoring hourly
0 * * * * root /var/www/shared/scripts/resource-monitor.sh

# SSL renewal daily
0 5 * * * root certbot renew --quiet --deploy-hook "systemctl reload nginx"
```

---

## Storage Layout

```
Disk: 39GB total, 12GB used (31%)

/var/www/dumuwaks         977 MB
/var/www/ementech-website 109 MB
/var/mail/vhosts          13 MB
/var/lib/postgresql       46 MB
/var/backups/ementech     3.2 MB
```

---

## Security Configuration

### Fail2Ban Jails
- sshd (836 total banned)
- nginx-http-auth
- nginx-limit-req

### Rate Limiting (Nginx)
- 10 req/s per IP
- Connection limits per IP

### Security Features
- Disable plaintext auth (Dovecot)
- TLS 1.2/1.3 only
- HSTS enabled
- DKIM signing
- Spam filtering (Rspamd + SpamAssassin)

---

## Key File Locations

### Applications
```
/var/www/ementech-website/backend/
/var/www/ementech-website/current/
/var/www/admin-ementech/current/
/var/www/dumuwaks/backend/
/var/www/dumuwaks/current/
```

### Configuration
```
/etc/nginx/sites-enabled/
/etc/nginx/conf.d/security.conf
/etc/postfix/main.cf
/etc/dovecot/dovecot.conf
/etc/opendkim/
```

### Logs
```
/var/log/nginx/
/var/log/mail.log
/var/log/pm2/
/var/log/fail2ban.log
```

### Certificates
```
/etc/letsencrypt/live/
/etc/nginx/ssl/dhparam.pem
```

---

## Backup Configuration

Location: `/var/backups/ementech/`

Script: `/usr/local/bin/ementech-backup.sh`

Schedule: Daily at 2:00 AM

Retention:
- 7 daily backups
- 4 weekly backups

Backed up:
- Mail directories (/var/mail/vhosts)
- PostgreSQL database
- Configuration files

---

## Quick Commands

### SSH Access
```bash
ssh root@69.164.244.165
```

### Process Management
```bash
pm2 list
pm2 logs <name>
pm2 restart <name>
pm2 monit
```

### Service Management
```bash
systemctl status nginx postfix dovecot redis postgresql
systemctl restart <service>
```

### Mail Testing
```bash
echo "Test" | mail -s "Test" admin@ementech.co.ke
postqueue -p
tail -f /var/log/mail.log
```

### SSL Management
```bash
certbot certificates
certbot renew --dry-run
```

---

*Last Updated: 2026-01-25*
*Auto-generated from VPS analysis*
