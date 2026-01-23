# Nginx Multi-Application VPS Deployment - Research Index

**Quick Links to All Documentation**

---

## 🚀 Quick Start

**For Immediate Deployment:**
1. Read: [NGINX_REVERSE_PROXY_GUIDE.md](NGINX_REVERSE_PROXY_GUIDE.md) - Main guide
2. Run: `bash nginx-config-archive/setup-nginx.sh` - Automated setup
3. Reference: [NGINX_QUICK_REFERENCE.md](NGINX_QUICK_REFERENCE.md) - Commands

**For Understanding the Research:**
1. [RESEARCH_COMPLETE.md](RESEARCH_COMPLETE.md) - Executive summary
2. [RESEARCH_SOURCES.md](RESEARCH_SOURCES.md) - All sources and references

---

## 📚 Documentation Files

### Primary Documentation

| File | Lines | Description |
|------|-------|-------------|
| **[NGINX_REVERSE_PROXY_GUIDE.md](NGINX_REVERSE_PROXY_GUIDE.md)** | 1,494 | Complete implementation guide with all configurations |
| **[NGINX_QUICK_REFERENCE.md](NGINX_QUICK_REFERENCE.md)** | 362 | Essential commands, troubleshooting, checklists |
| **[RESEARCH_SOURCES.md](RESEARCH_SOURCES.md)** | 295 | All research sources with URLs and credibility |
| **[RESEARCH_COMPLETE.md](RESEARCH_COMPLETE.md)** | 350 | Executive summary of deliverables |

### Configuration Archive

**Directory:** [nginx-config-archive/](nginx-config-archive/)

| File | Description |
|------|-------------|
| **[README.md](nginx-config-archive/README.md)** | Configuration archive setup guide |
| **[setup-nginx.sh](nginx-config-archive/setup-nginx.sh)** | Automated deployment script |
| **[nginx-main.conf](nginx-config-archive/nginx-main.conf)** | Main nginx configuration |
| **[ementech-website.conf](nginx-config-archive/ementech-website.conf)** | Main website server block |
| **[dumuwaks-frontend.conf](nginx-config-archive/dumuwaks-frontend.conf)** | Frontend app server block |
| **[dumuwaks-backend.conf](nginx-config-archive/dumuwaks-backend.conf)** | Backend API server block |
| **[ecosystem.config.js](nginx-config-archive/ecosystem.config.js)** | PM2 ecosystem file |
| **[logrotate-nginx](nginx-config-archive/logrotate-nginx)** | Log rotation configuration |

---

## 🎯 What's Included

### ✅ Complete Nginx Configuration
- Multiple server blocks for different domains/subdomains
- Reverse proxy for Node.js backends
- Static file serving for React builds
- WebSocket support (Socket.io)
- React Router client-side routing support

### ✅ Performance Optimization
- HTTP/2 enabled
- Gzip compression
- Static asset caching (1 year)
- Worker process optimization
- Buffer and timeout tuning
- Keep-alive connections

### ✅ SSL/TLS Configuration
- Let's Encrypt certificate setup
- Multiple domains/subdomains support
- Auto-renewal configuration
- Wildcard certificate option
- 4096-bit DH parameters
- SSL stapling

### ✅ Security Hardening
- Rate limiting per application
- Security headers (CORS, CSP, HSTS, etc.)
- DDoS protection at nginx level
- IP whitelisting/blacklisting
- Prevention of common attacks

### ✅ Process Management
- PM2 ecosystem configuration
- Auto-restart on failure
- Log management and rotation
- Memory limits and graceful shutdown

### ✅ Interserver VPS Specifics
- Official InterServer documentation
- UFW firewall configuration
- VPS resource optimization

---

## 📋 Deployment Checklist

### Pre-Deployment
- [ ] DNS records configured (ementech.co.ke, www, app, api)
- [ ] VPS accessible via SSH
- [ ] Node.js and npm installed
- [ ] Applications built and ready

### Configuration
- [ ] Copy nginx configuration files
- [ ] Set up SSL certificates with Certbot
- [ ] Configure PM2 ecosystem file
- [ ] Test nginx configuration (`nginx -t`)
- [ ] Configure UFW firewall

### Deployment
- [ ] Deploy applications to `/var/www/`
- [ ] Start PM2 applications
- [ ] Reload nginx
- [ ] Test all domains
- [ ] Verify SSL certificates
- [ ] Test React Router routes
- [ ] Test WebSocket connections
- [ ] Check logs for errors

### Post-Deployment
- [ ] Set up monitoring
- [ ] Configure log rotation
- [ ] Test SSL auto-renewal
- [ ] Document any customizations
- [ ] Set up backup procedures

---

## 🔧 Common Commands

### Nginx
```bash
sudo nginx -t                    # Test configuration
sudo systemctl reload nginx      # Apply changes
sudo systemctl status nginx      # Check status
```

### PM2
```bash
pm2 start ecosystem.config.js    # Start apps
pm2 status                       # Check status
pm2 logs                         # View logs
pm2 save                         # Save process list
```

### SSL
```bash
sudo certbot certificates        # List certificates
sudo certbot renew               # Renew manually
```

---

## 🧪 Testing URLs

- **Main Site:** https://ementech.co.ke
- **Main Site (www):** https://www.ementech.co.ke
- **Frontend App:** https://app.ementech.co.ke
- **Backend API:** https://api.ementech.co.ke

### Online Testing Tools
- SSL Test: https://www.ssllabs.com/ssltest/
- Security Headers: https://securityheaders.com/
- HTTP/2 Test: https://tools.keycdn.com/http2-test
- Performance: https://tools.pingdom.com/

---

## 🆘 Troubleshooting

### Quick Links
- **502 Bad Gateway:** Check if PM2 app is running
- **404 on Routes:** Verify `try_files` in nginx config
- **SSL Errors:** Renew certificates manually
- **WebSocket Failures:** Check WebSocket headers
- **Rate Limiting:** Adjust limits in server blocks

### For Full Troubleshooting
See the [Troubleshooting Section](NGINX_REVERSE_PROXY_GUIDE.md#13-troubleshooting) in the main guide.

---

## 📞 Support Resources

### Official Documentation
- [Nginx Docs](https://nginx.org/en/docs/)
- [PM2 Docs](https://pm2.keymetrics.io/docs/)
- [Certbot Docs](https://certbot.eff.org/docs/)

### Community Support
- [NGINX Community](https://community.nginx.org/)
- [Let's Encrypt Community](https://community.letsencrypt.org/)
- [Stack Overflow - Nginx](https://stackoverflow.com/questions/tagged/nginx)
- [Server Fault](https://serverfault.com/questions/tagged/nginx)

---

## 📊 Research Statistics

- **Total Sources:** 50+ verified references
- **Documentation:** 2,600+ lines
- **Configuration Files:** 7 production-ready + 1 automated script
- **Research Date:** January 18, 2026
- **Source Quality:** Official docs + 2025-2026 sources
- **Status:** Complete and production-ready

---

## 🎓 Research Credibility

### Very High (Official)
- NGINX official documentation
- PM2 official documentation
- Let's Encrypt / Certbot docs
- InterServer official guides

### High (Established)
- DigitalOcean tutorials
- Stack Overflow vetted solutions
- Server Fault community
- F5 Networks (NGINX owner)

### Medium (Community)
- Developer blogs and tutorials
- Recent 2025 publications
- Community discussions

---

## 📅 Last Updated

**Date:** January 18, 2026
**Research By:** Claude Code (Anthropic AI)
**Status:** Complete - Ready for Implementation

---

## ⚡ Next Steps

1. **Read the Main Guide:** [NGINX_REVERSE_PROXY_GUIDE.md](NGINX_REVERSE_PROXY_GUIDE.md)
2. **Use Automated Setup:** `sudo bash nginx-config-archive/setup-nginx.sh`
3. **Deploy Applications:** Copy your apps to `/var/www/` directories
4. **Start PM2:** `pm2 start /var/www/ecosystem.config.js`
5. **Test Everything:** Verify all domains and functionality

**For questions or issues, refer to the main guide's troubleshooting section.**

---

**📁 All files are located in:** `/media/munen/muneneENT/ementech/ementech-website/`
