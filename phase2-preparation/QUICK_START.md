# Phase 2: VPS Setup - Quick Reference

**Status:** ✅ Preparation Complete - Ready for Execution

---

## 📋 Quick Start Guide

### What You Need to Provide

1. **VPS IP Address** - From Interserver control panel
2. **Root SSH Access** - Password or SSH key file
3. **Domain Access** - Can log into DNS provider
4. **Admin Email** - For SSL certificates (e.g., admin@ementech.co.ke)

---

### 📁 Documentation Created

**Location:** `/media/munen/muneneENT/ementech/ementech-website/phase2-preparation/`

| File | Size | Purpose |
|------|------|---------|
| **SUMMARY.md** | 20 KB | Start here - Complete overview |
| **VPS_PREREQUISITES.md** | 15 KB | What info we need from you |
| **VPS_SPECIFICATIONS.md** | 19 KB | VPS recommendations & costs |
| **STEP_BY_STEP_SETUP.md** | 34 KB | Detailed setup commands |
| **PRE_DEPLOYMENT_CHECKLIST.md** | 15 KB | Verify everything is ready |
| **RISK_MITIGATION.md** | 24 KB | Risk management strategies |
| **PHASE2_EXECUTION_PLAN.md** | 24 KB | Complete execution roadmap |

**Total:** 5,653 lines of documentation (156 KB)

---

## 💰 Cost Estimates

### Recommended Configuration (2 Slices)

- **VPS:** $12/month (4GB RAM, 2 CPU cores, 50GB storage)
- **Domain:** ~$1/month
- **SSL:** FREE (Let's Encrypt)
- **Third-party services:** $10-20/month (optional)

**Total: ~$23-33/month**

---

## ⏱️ Timeline

### Phase 2 Execution

- **Day 1:** 4-6 hours active work
  - VPS setup, software installation, DNS configuration
- **Wait:** 24-48 hours (DNS propagation)
- **Day 2:** 1-2 hours active work
  - SSL certificates, deployment, testing

**Total:** 5-8 hours spread over 1-2 days

---

## ✅ Success Criteria

**Technical:**
- All software installed (Node.js 20, MongoDB 7.0, Redis, nginx, PM2)
- All applications deployed and accessible
- SSL certificates working
- Firewall configured
- Auto-startup enabled

**Functional:**
- ✅ https://ementech.co.ke (corporate website)
- ✅ https://app.ementech.co.ke (dumuwaks frontend)
- ✅ https://api.ementech.co.ke (dumuwaks backend)
- Page load times < 3 seconds
- No console errors

---

## 🚀 Next Steps

### For You (User)

1. **Read SUMMARY.md** - Start here for complete overview
2. **Complete PRE_DEPLOYMENT_CHECKLIST.md** - Verify readiness
3. **Gather credentials** - VPS access, domain access, API keys
4. **Contact us** - When ready to begin execution

### For Us (Deployment Team)

1. **Receive prerequisites** - User provides credentials
2. **Execute Phase 2** - Follow STEP_BY_STEP_SETUP.md
3. **Deploy applications** - Using deployment scripts
4. **Test & verify** - Ensure everything works
5. **Handoff** - Documentation and training

---

## 📍 Key Files Reference

### Deployment Scripts (Already Created)

**Location:** `/media/munen/muneneENT/ementech/ementech-website/deployment/`

```bash
setup-vps.sh              # Automated VPS initialization
deploy-ementech.sh        # Deploy corporate website
deploy-dumuwaks.sh        # Deploy dumuwaks (frontend + backend)
deploy-all.sh             # Deploy all applications
setup-monitoring.sh       # Configure monitoring
```

### Configuration Files (Already Created)

```bash
ementech-website.conf     # Nginx config for ementech.co.ke
dumuwaks-frontend.conf    # Nginx config for app.ementech.co.ke
dumuwaks-backend.conf     # Nginx config for api.ementech.co.ke
ecosystem.ementech.config.js  # PM2 config for corporate site
```

---

## 🎯 What Gets Deployed

### Applications

1. **ementech-website**
   - Location: `/var/www/ementech-website/current`
   - Domain: ementech.co.ke, www.ementech.co.ke
   - Type: Static React build
   - Served by: nginx

2. **dumuwaks-frontend**
   - Location: `/var/www/dumuwaks-frontend/current`
   - Domain: app.ementech.co.ke
   - Type: React SPA
   - Served by: nginx

3. **dumuwaks-backend**
   - Location: `/var/www/dumuwaks-backend/current`
   - Domain: api.ementech.co.ke
   - Type: Node.js/Express/MongoDB
   - Managed by: PM2

### Database & Services

- **MongoDB 7.0:** Local installation on VPS
- **Redis:** For sessions and caching
- **nginx:** Reverse proxy and static file server
- **PM2:** Process manager for Node.js apps
- **Let's Encrypt:** SSL certificates

---

## 🔐 Security Features

- ✅ SSH key authentication (recommended)
- ✅ Firewall (UFW) - Only ports 22, 80, 443 open
- ✅ Fail2ban - Intrusion prevention
- ✅ SSL/TLS - All sites use HTTPS
- ✅ Security headers - Configured in nginx
- ✅ Log rotation - Prevents disk filling
- ✅ Auto-updates - Security patches only

---

## 📊 Monitoring

### Basic (Included)

- PM2 monitoring: `pm2 monit`
- System resources: `htop`
- Service status: `systemctl status`
- Log files: `/var/log/pm2/`, `/var/log/nginx/`

### Enhanced (Optional)

- Sentry - Error tracking
- DataDog - Infrastructure monitoring
- UptimeRobot - Uptime monitoring

---

## 🛠️ Common Commands

### Check Application Status

```bash
pm2 list                    # PM2 processes
pm2 logs                   # Application logs
pm2 monit                  # Real-time monitoring
systemctl status nginx     # nginx status
systemctl status mongod    # MongoDB status
```

### Restart Applications

```bash
pm2 restart all            # Restart all apps
pm2 restart dumuwaks-backend  # Restart specific app
systemctl reload nginx     # Reload nginx config
```

### View Logs

```bash
pm2 logs --lines 100       # PM2 logs
tail -f /var/log/nginx/error.log  # nginx errors
tail -f /var/log/nginx/access.log # nginx access
journalctl -u nginx -f     # systemd logs
```

---

## 🆘 Troubleshooting

### Quick Fixes

```bash
# If site not accessible
systemctl status nginx
systemctl restart nginx

# If backend not working
pm2 list
pm2 restart dumuwaks-backend

# If database issues
systemctl status mongod
systemctl restart mongod

# Check resources
free -h                    # Memory
df -h                      # Disk
htop                       # CPU & RAM
```

### For Detailed Issues

See: `/deployment/DEPLOYMENT_TROUBLESHOOTING.md`

---

## 📞 Support

### For Questions During Setup

- Review relevant documentation in `phase2-preparation/`
- Check `DEPLOYMENT_TROUBLESHOOTING.md`
- Create escalation ticket in `.agent-workspace/escalations/`

### Emergency Contacts

- **Interserver Support:** https://www.interserver.net/support/
- **Let's Encrypt:** https://community.letsencrypt.org/
- **MongoDB:** https://www.mongodb.com/community

---

## ✨ Highlights

**What Makes This Setup Robust:**

✅ **Production-Ready** - Industry best practices
✅ **Secure** - Firewall, SSL, fail2ban, SSH keys
✅ **Scalable** - Easy to upgrade VPS slices
✅ **Maintainable** - Comprehensive documentation
✅ **Observable** - Monitoring and logging configured
✅ **Automated** - PM2 auto-restart, SSL auto-renewal
✅ **Cost-Effective** - Starts at $23-33/month
✅ **Idiot-Proof** - Step-by-step commands with verification

---

## 📝 Checklist

### Before Starting Phase 2

- [ ] Read SUMMARY.md
- [ ] Read VPS_PREREQUISITES.md
- [ ] Verify VPS specifications (VPS_SPECIFICATIONS.md)
- [ ] Complete PRE_DEPLOYMENT_CHECKLIST.md
- [ ] Gather all credentials
- [ ] Allocate 5-8 hours over 1-2 days

### Ready to Execute?

- [ ] All prerequisites verified
- [ ] VPS credentials obtained
- [ ] Domain access confirmed
- [ ] API keys gathered (if ready)
- [ ] Timeline scheduled

**If all checked: Contact deployment team to begin Phase 2!**

---

## 🎉 Summary

**Phase 2 Preparation: COMPLETE ✅**

**Deliverables:**
- 7 comprehensive documents (5,653 lines, 156 KB)
- Complete VPS setup guide with exact commands
- Risk mitigation strategies
- Pre-deployment checklist
- Cost analysis and recommendations
- Detailed execution plan

**What We Need:**
- VPS IP and root access
- Domain access confirmation
- Admin email for SSL
- Optional: API keys for full functionality

**What We Deliver:**
- Fully configured VPS (Ubuntu 22.04 LTS)
- All applications deployed and tested
- SSL certificates installed
- Monitoring and logging configured
- Complete documentation and handoff

**Timeline:**
- After receiving credentials: 24-72 hours to live
- Active work: 5-8 hours over 1-2 days
- Main bottleneck: DNS propagation (24-48 hours)

**Estimated Cost:**
- $23-33/month (recommended 2-slice configuration with services)

---

**✅ READY TO EXECUTE WHEN YOU ARE!**

For questions, see SUMMARY.md or create escalation ticket.
