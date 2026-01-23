# Multi-Application VPS - Quick Reference Card

**VPS**: 69.164.244.165 | **User**: root | **Date**: Jan 21, 2026

---

## SSH Access

```bash
ssh root@69.164.244.165
```

---

## PM2 Commands (Process Management)

```bash
# View all processes
pm2 list

# View real-time monitoring
pm2 monit

# View logs
pm2 logs
pm2 logs ementech-backend --lines 100
pm2 logs dumuwaks-backend --lines 100

# Restart processes
pm2 restart all
pm2 restart ementech-backend
pm2 restart dumuwaks-backend
```

---

## Application URLs

### Ementech (✅ Fully Operational)
- Frontend: https://ementech.co.ke
- Backend API: https://ementech.co.ke/api/*
- Port: 5001 (local)

### Dumuwaks (🚧 Backend Ready, Awaiting DNS)
- Frontend: http://dumuwaks.ementech.co.ke (after DNS)
- Backend API: http://dumuwaks.ementech.co.ke/api/*
- Port: 5000 (local)

---

## Health Checks

```bash
# Automated health check
/var/www/shared/scripts/health-check.sh

# Manual checks
curl https://ementech.co.ke/api/health
curl http://localhost:5000/api/health
curl http://localhost:5001/api/health

# PM2 status
pm2 list
```

---

## Nginx Management

```bash
# Test configuration
nginx -t

# Graceful reload (no downtime)
systemctl reload nginx

# View logs
tail -f /var/log/nginx/error.log
```

---

## Log Locations

```
PM2 Logs:          /var/log/pm2/
App Logs:          /var/log/applications/
Nginx Logs:        /var/log/nginx/
Health Check:      /var/log/applications/health-check.log
```

---

## System Status

```bash
# Resources
free -h                    # Memory
df -h                      # Disk

# Services
systemctl status nginx
ufw status
fail2ban-client status

# Ports
netstat -tlnp | grep -E '(5000|5001|80|443)'
```

---

## Next Actions

1. **IMMEDIATE**: Create DNS A record for dumuwaks.ementech.co.ke → 69.164.244.165
2. **After DNS**: Run `certbot --nginx -d dumuwaks.ementech.co.ke`
3. **Daily**: Monitor health check logs

---

**Status**: Production Ready (99% Complete)
