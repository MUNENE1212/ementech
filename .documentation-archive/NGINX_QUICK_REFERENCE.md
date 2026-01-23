# Nginx Multi-App Deployment - Quick Reference

**Last Updated:** January 18, 2026

## Essential Commands

### Nginx
```bash
sudo nginx -t                      # Test configuration
sudo systemctl reload nginx        # Apply changes (zero downtime)
sudo systemctl restart nginx       # Restart service
sudo systemctl status nginx        # Check status
sudo journalctl -u nginx -n 50     # View logs
```

### PM2
```bash
pm2 start ecosystem.config.js      # Start all apps
pm2 restart all                    # Restart all apps
pm2 reload all                     # Zero-downtime reload
pm2 status                         # View status
pm2 logs                           # View logs
pm2 monit                          # Real-time monitoring
pm2 save                           # Save process list
pm2 startup                        # Auto-start on boot
```

### SSL/Certificates
```bash
sudo certbot certificates          # List all certificates
sudo certbot renew                 # Renew manually
sudo certbot renew --dry-run       # Test renewal
```

### Firewall (UFW)
```bash
sudo ufw status                    # Check status
sudo ufw allow 80/tcp             # Allow HTTP
sudo ufw allow 443/tcp            # Allow HTTPS
sudo ufw enable                    # Enable firewall
```

### Logs
```bash
# Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Application-specific logs
sudo tail -f /var/log/nginx/ementech-website-error.log
sudo tail -f /var/log/nginx/dumuwaks-frontend-error.log
sudo tail -f /var/log/nginx/dumuwaks-backend-error.log

# PM2 logs
pm2 logs
pm2 logs dumuwaks-backend --lines 100
```

## Common Issues & Solutions

### 502 Bad Gateway
```bash
# Check if backend is running
pm2 status

# Check backend logs
pm2 logs dumuwaks-backend

# Check if port 5000 is listening
sudo netstat -tulpn | grep 5000
```

### 404 on React Routes
Check nginx config has:
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

### SSL Certificate Errors
```bash
# Check certificate exists
ls -la /etc/letsencrypt/live/ementech.co.ke/

# Renew manually
sudo certbot renew --post-hook "systemctl reload nginx"
```

### WebSocket Connection Failures
Ensure nginx has WebSocket headers:
```nginx
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
```

## File Locations

### Nginx
```
/etc/nginx/nginx.conf                          # Main config
/etc/nginx/sites-available/                    # Available sites
/etc/nginx/sites-enabled/                      # Enabled sites
/etc/nginx/ssl/dhparam.pem                     # SSL params
/var/log/nginx/                                # Logs
```

### SSL Certificates
```
/etc/letsencrypt/live/domain.com/
├── fullchain.pem                              # Certificate
├── privkey.pem                                # Private key
└── chain.pem                                  # Chain
```

### Applications
```
/var/www/
├── ecosystem.config.js                        # PM2 config
├── ementech-website/current/dist/             # Main site
├── dumuwaks-frontend/current/dist/            # Frontend app
└── dumuwaks-backend/current/                  # Backend API
```

### Logs
```
/var/log/nginx/                                # Nginx logs
/var/log/pm2/                                  # PM2 logs
```

## Testing Commands

### SSL Test
```bash
openssl s_client -connect ementech.co.ke:443
```

### HTTP/2 Test
```bash
nghttp -nv https://ementech.co.ke
```

### Performance Test
```bash
ab -n 100 -c 10 https://ementech.co.ke/
```

### DNS Test
```bash
dig ementech.co.ke +short
nslookup app.ementech.co.ke
```

### Security Headers Test
```bash
curl -I https://ementech.co.ke
```

## Configuration Checks

### Test Nginx Syntax
```bash
sudo nginx -t
```

### Check SSL Configuration
Visit: https://www.ssllabs.com/ssltest/

### Check Security Headers
Visit: https://securityheaders.com/

### Check HTTP/2
Visit: https://tools.keycdn.com/http2-test

## Deployment Checklist

### Pre-Deployment
- [ ] DNS records configured
- [ ] Firewall ports open (80, 443)
- [ ] Applications built
- [ ] Environment variables set

### Deployment
- [ ] Copy files to /var/www/
- [ ] Update nginx server blocks
- [ ] Test nginx configuration
- [ ] Obtain SSL certificates
- [ ] Start PM2 applications
- [ ] Test all routes

### Post-Deployment
- [ ] Verify SSL certificates
- [ ] Test HTTP to HTTPS redirect
- [ ] Test React Router routes
- [ ] Test API endpoints
- [ ] Test WebSocket connections
- [ ] Check logs for errors
- [ ] Setup monitoring

## Rate Limiting Values

### Main Website (ementech.co.ke)
- 10 requests/second
- 20 burst
- 10 concurrent connections

### Frontend App (app.ementech.co.ke)
- 20 requests/second
- 40 burst
- 20 concurrent connections

### Backend API (api.ementech.co.ke)
- 10 requests/second
- 20 burst
- 10 concurrent connections

## Port Configuration

### External
- **80**: HTTP (redirects to HTTPS)
- **443**: HTTPS
- **22**: SSH (firewall only)

### Internal (localhost)
- **3000**: Ementech website (dev)
- **3001**: Dumu Waks frontend (dev)
- **5000**: Dumu Waks backend (production)

## Environment Variables

Add to `ecosystem.config.js`:
```javascript
env: {
    NODE_ENV: 'production',
    PORT: 5000,
    DATABASE_URL: 'your-db-url',
    JWT_SECRET: 'your-secret',
    // Add your variables here
}
```

## Backup Commands

```bash
# Backup nginx config
sudo tar -czf nginx-backup-$(date +%Y%m%d).tar.gz /etc/nginx/

# Backup PM2 config
tar -czf pm2-backup-$(date +%Y%m%d).tar.gz ~/.pm2/

# Backup SSL certificates
sudo tar -czf letsencrypt-backup-$(date +%Y%m%d).tar.gz /etc/letsencrypt/
```

## Performance Tuning Quick Tips

1. **Enable HTTP/2**: Already enabled in config
2. **Gzip Compression**: Already enabled
3. **Static Asset Caching**: Already configured
4. **Worker Processes**: Set to `auto` (matches CPU cores)
5. **Keep-Alive**: Set to 65 seconds
6. **Buffer Sizes**: Optimized for VPS

## Security Quick Tips

1. **SSL/TLS**: Only allow TLSv1.2 and TLSv1.3
2. **HSTS**: Enabled with 1 year max-age
3. **Rate Limiting**: Configured per application
4. **Security Headers**: All headers enabled
5. **Server Tokens**: Disabled
6. **Firewall**: Only ports 80, 443, 22 open

## Monitoring Commands

```bash
# System resources
htop

# Nginx status
sudo systemctl status nginx

# PM2 status
pm2 status

# PM2 monitoring
pm2 monit

# Disk usage
df -h

# Memory usage
free -m

# Process list
ps aux | grep node
```

## Quick URLs for Testing

- **Main Site**: https://ementech.co.ke
- **Main Site (www)**: https://www.ementech.co.ke
- **Frontend App**: https://app.ementech.co.ke
- **Backend API**: https://api.ementech.co.ke
- **SSL Test**: https://www.ssllabs.com/ssltest/
- **Security Headers**: https://securityheaders.com/
- **HTTP/2 Test**: https://tools.keycdn.com/http2-test
- **Performance**: https://tools.pingdom.com/
- **Page Speed**: https://pagespeed.web.dev/

## Emergency Recovery

### If Nginx Won't Start
```bash
# Check syntax
sudo nginx -t

# View recent errors
sudo journalctl -u nginx -n 50

# Restore from backup
sudo cp /etc/nginx/nginx.conf.backup.* /etc/nginx/nginx.conf
sudo systemctl reload nginx
```

### If All Apps Are Down
```bash
# Check PM2 status
pm2 status

# Restart all apps
pm2 restart all

# Check system resources
free -m
df -h
```

### If SSL Certificate Expires
```bash
# Renew immediately
sudo certbot renew --post-hook "systemctl reload nginx"

# Verify
sudo certbot certificates
```

## Documentation Reference

- **Full Guide**: `NGINX_REVERSE_PROXY_GUIDE.md`
- **Config Archive**: `nginx-config-archive/README.md`
- **Setup Script**: `nginx-config-archive/setup-nginx.sh`

## Support Resources

- Nginx Docs: https://nginx.org/en/docs/
- PM2 Docs: https://pm2.keymetrics.io/docs/
- Certbot Docs: https://certbot.eff.org/docs/
- Let's Encrypt Community: https://community.letsencrypt.org/

---

**Last Updated**: January 18, 2026
