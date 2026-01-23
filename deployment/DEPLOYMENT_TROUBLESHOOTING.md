# Deployment Troubleshooting Guide

Common issues and solutions for deploying Ementech projects to VPS.

## Table of Contents
1. [PM2 Issues](#pm2-issues)
2. [nginx Issues](#nginx-issues)
3. [SSL Certificate Issues](#ssl-certificate-issues)
4. [Database Connection Issues](#database-connection-issues)
5. [WebSocket Connection Issues](#websocket-connection-issues)
6. [Build and Deployment Issues](#build-and-deployment-issues)
7. [Performance Issues](#performance-issues)
8. [Security Issues](#security-issues)

---

## PM2 Issues

### Issue: PM2 won't start

**Symptoms:**
- `pm2 start` command fails
- PM2 daemon won't initialize
- "Command not found" error

**Solutions:**

1. **Check if PM2 is installed:**
   ```bash
   which pm2
   pm2 --version
   ```

2. **Reinstall PM2:**
   ```bash
   npm uninstall -g pm2
   npm install -g pm2
   ```

3. **Clean PM2 state:**
   ```bash
   pm2 kill
   rm -rf ~/.pm2
   pm2 resurrect
   ```

4. **Check file permissions:**
   ```bash
   ls -la /var/log/pm2
   sudo chown -R node-user:node-user /var/log/pm2
   ```

5. **Verify Node.js version:**
   ```bash
   node --version  # Should be 20.x or higher
   ```

---

### Issue: PM2 app keeps restarting

**Symptoms:**
- PM2 status shows "restart: 10+" or higher
- Application crashes immediately after starting

**Solutions:**

1. **Check error logs:**
   ```bash
   pm2 logs --err
   pm2 logs app-name --err --lines 100
   ```

2. **Common causes:**

   **Missing environment variables:**
   ```bash
   # Check if .env exists
   ls -la /var/www/dumuwaks-backend/current/.env

   # View .env file
   cat /var/www/dumuwaks-backend/current/.env

   # Ensure all required variables are set
   ```

   **Port already in use:**
   ```bash
   # Check what's using the port
   sudo netstat -tulpn | grep :5000
   sudo lsof -i :5000

   # Kill the process using the port
   sudo kill -9 <PID>
   ```

   **Database connection failure:**
   ```bash
   # Check MongoDB status
   systemctl status mongod

   # Test MongoDB connection
   mongosh --eval "db.adminCommand('ping')"
   ```

3. **Increase restart limit temporarily:**
   ```bash
   pm2 start app.js --max-restarts 50
   ```

4. **Start in development mode for more logs:**
   ```bash
   NODE_ENV=development pm2 start app.js
   ```

---

### Issue: PM2 processes not starting on reboot

**Symptoms:**
- Apps stop working after server reboot
- `pm2 status` shows empty list after reboot

**Solutions:**

1. **Setup PM2 startup script:**
   ```bash
   # As node-user or root
   pm2 startup
   # Copy and run the command it outputs
   ```

2. **Save current processes:**
   ```bash
   pm2 save
   ```

3. **Verify systemd service:**
   ```bash
   systemctl status pm2-root
   systemctl enable pm2-root
   ```

4. **Check startup logs:**
   ```bash
   journalctl -u pm2-root -f
   ```

---

## nginx Issues

### Issue: nginx 502 Bad Gateway

**Symptoms:**
- Browser shows "502 Bad Gateway"
- nginx error log shows "upstream prematurely closed connection"

**Solutions:**

1. **Check if backend is running:**
   ```bash
   pm2 status
   curl http://localhost:5000/health
   ```

2. **Check nginx error logs:**
   ```bash
   sudo tail -f /var/log/nginx/error.log
   ```

3. **Verify nginx configuration:**
   ```bash
   sudo nginx -t
   ```

4. **Check proxy_pass settings:**
   ```bash
   # View nginx config
   sudo cat /etc/nginx/sites-available/dumuwaks-backend.conf

   # Ensure backend URL is correct
   proxy_pass http://localhost:5000;
   ```

5. **Restart services:**
   ```bash
   sudo systemctl restart nginx
   pm2 restart all
   ```

---

### Issue: nginx 404 Not Found

**Symptoms:**
- Getting 404 errors for valid routes
- React Router not working

**Solutions:**

1. **Check try_files directive:**
   ```nginx
   location / {
       try_files $uri $uri/ /index.html;  # Ensure this line exists
   }
   ```

2. **Verify root directory:**
   ```bash
   ls -la /var/www/ementech-website/current/dist
   ```

3. **Check file permissions:**
   ```bash
   sudo chown -R www-data:www-data /var/www/ementech-website/current
   sudo chmod -R 755 /var/www/ementech-website/current
   ```

4. **Test nginx config:**
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

---

### Issue: nginx won't start

**Symptoms:**
- `systemctl start nginx` fails
- "Configuration test failed" error

**Solutions:**

1. **Test nginx configuration:**
   ```bash
   sudo nginx -t
   ```

2. **Check for syntax errors:**
   ```bash
   # Look for specific error message
   sudo nginx -t 2>&1 | grep error
   ```

3. **Common configuration errors:**
   - Missing semicolons
   - Invalid variable names
   - Mismatched braces
   - Invalid file paths

4. **Check port conflicts:**
   ```bash
   sudo netstat -tulpn | grep :80
   sudo netstat -tulpn | grep :443
   ```

5. **Check error logs:**
   ```bash
   sudo journalctl -u nginx -n 50
   ```

---

## SSL Certificate Issues

### Issue: SSL certificate not working

**Symptoms:**
- Browser shows "Your connection is not private"
- "SSL certificate error" message

**Solutions:**

1. **Check certificate status:**
   ```bash
   sudo certbot certificates
   ```

2. **Verify certificate files:**
   ```bash
   ls -la /etc/letsencrypt/live/ementech.co.ke/
   ```

3. **Check nginx SSL configuration:**
   ```bash
   sudo cat /etc/nginx/sites-available/ementech-website.conf | grep ssl_certificate
   ```

4. **Test SSL configuration:**
   ```bash
   # Online test
   # Visit: https://www.ssllabs.com/ssltest/

   # Command line test
   openssl s_client -connect ementech.co.ke:443 -servername ementech.co.ke
   ```

5. **Renew certificate:**
   ```bash
   sudo certbot renew --force-renewal
   sudo systemctl reload nginx
   ```

---

### Issue: Let's Encrypt challenge fails

**Symptoms:**
- Certbot fails with "DNS problem" or "Connection timeout"
- Can't obtain SSL certificate

**Solutions:**

1. **Verify DNS propagation:**
   ```bash
   dig ementech.co.ke +short
   dig app.ementech.co.ke +short
   dig api.ementech.co.ke +short
   ```

2. **Check DNS records:**
   - A records pointing to correct IP
   - No typos in domain names
   - DNS fully propagated (use https://dnschecker.org/)

3. **Check firewall:**
   ```bash
   sudo ufw status
   # Ensure port 80 and 443 are open
   ```

4. **Verify nginx is running:**
   ```bash
   systemctl status nginx
   curl http://ementech.co.ke
   ```

5. **Use staging server for testing:**
   ```bash
   sudo certbot --nginx --staging -d ementech.co.ke
   ```

---

### Issue: Certificate auto-renewal not working

**Symptoms:**
- Certificates expire and don't auto-renew
- Manual renewal works but automatic fails

**Solutions:**

1. **Test auto-renewal:**
   ```bash
   sudo certbot renew --dry-run
   ```

2. **Check renewal timer:**
   ```bash
   systemctl status certbot.timer
   systemctl list-timers | grep certbot
   ```

3. **Enable renewal timer:**
   ```bash
   sudo systemctl enable certbot.timer
   sudo systemctl start certbot.timer
   ```

4. **Check renewal logs:**
   ```bash
   sudo journalctl -u certbot.timer -n 50
   ```

5. **Manually renew:**
   ```bash
   sudo certbot renew
   sudo systemctl reload nginx
   ```

---

## Database Connection Issues

### Issue: MongoDB connection refused

**Symptoms:**
- "Connection refused" error
- Application can't connect to MongoDB
- ECONNREFUSED error

**Solutions:**

1. **Check MongoDB status:**
   ```bash
   systemctl status mongod
   ```

2. **Start MongoDB if not running:**
   ```bash
   sudo systemctl start mongod
   sudo systemctl enable mongod
   ```

3. **Check MongoDB logs:**
   ```bash
   sudo tail -f /var/log/mongodb/mongod.log
   ```

4. **Verify connection string:**
   ```bash
   # In .env file
   MONGODB_URI=mongodb://localhost:27017/dumuwaks

   # Test connection
   mongosh "mongodb://localhost:27017/dumuwaks"
   ```

5. **Check if port is open:**
   ```bash
   sudo netstat -tulpn | grep :27017
   ```

6. **Check MongoDB configuration:**
   ```bash
   sudo cat /etc/mongod.conf | grep bindIp
   ```

---

### Issue: Redis connection fails

**Symptoms:**
- "Redis connection lost" error
- Cache not working

**Solutions:**

1. **Check Redis status:**
   ```bash
   systemctl status redis-server
   ```

2. **Start Redis:**
   ```bash
   sudo systemctl start redis-server
   sudo systemctl enable redis-server
   ```

3. **Test Redis connection:**
   ```bash
   redis-cli ping
   # Should return: PONG
   ```

4. **Check Redis configuration:**
   ```bash
   redis-cli info server
   ```

5. **Verify connection string in .env:**
   ```bash
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=
   ```

---

## WebSocket Connection Issues

### Issue: Socket.io can't connect

**Symptoms:**
- WebSocket connection fails
- "Socket.io connection error"
- Real-time features not working

**Solutions:**

1. **Check nginx WebSocket configuration:**
   ```nginx
   location /socket.io/ {
       proxy_pass http://localhost:5000;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection "upgrade";
       proxy_set_header Host $host;
   }
   ```

2. **Verify backend Socket.io is running:**
   ```bash
   pm2 logs dumuwaks-backend | grep socket
   ```

3. **Check if port is accessible:**
   ```bash
   curl -I http://localhost:5000/socket.io/
   ```

4. **Test WebSocket connection:**
   ```bash
   # Use online WebSocket tester
   # wscat: npm install -g wscat
   wscat -c wss://api.ementech.co.ke/socket.io/
   ```

5. **Increase timeout values in nginx:**
   ```nginx
   proxy_connect_timeout 7d;
   proxy_send_timeout 7d;
   proxy_read_timeout 7d;
   ```

---

## Build and Deployment Issues

### Issue: Build fails on VPS

**Symptoms:**
- `npm run build` fails
- Out of memory errors
- Build process hangs

**Solutions:**

1. **Increase swap space:**
   ```bash
   # Create 2GB swap file
   sudo fallocate -l 2G /swapfile
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile

   # Make permanent
   echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
   ```

2. **Use build flags:**
   ```bash
   NODE_ENV=production npm run build
   ```

3. **Clean and rebuild:**
   ```bash
   rm -rf node_modules dist
   npm ci
   npm run build
   ```

4. **Check disk space:**
   ```bash
   df -h
   # Ensure at least 5GB free
   ```

---

### Issue: Deployment scripts fail

**Symptoms:**
- `deploy-ementech.sh` fails
- rsync errors
- Permission denied errors

**Solutions:**

1. **Check SSH connectivity:**
   ```bash
   ssh -v root@ementech.co.ke
   ```

2. **Verify SSH key permissions:**
   ```bash
   chmod 600 ~/.ssh/id_rsa
   chmod 644 ~/.ssh/id_rsa.pub
   ```

3. **Test rsync manually:**
   ```bash
   rsync -avz -e "ssh -p 22" /local/dir/ root@ementech.co.ke:/remote/dir/
   ```

4. **Check directory permissions on VPS:**
   ```bash
   ls -la /var/www/
   sudo chown -R node-user:node-user /var/www
   ```

5. **Run with verbose flag:**
   ```bash
   bash -x deploy-ementech.sh
   ```

---

## Performance Issues

### Issue: Slow application response

**Symptoms:**
- Pages load slowly
- API calls take long time
- High latency

**Solutions:**

1. **Check system resources:**
   ```bash
   htop
   free -h
   df -h
   ```

2. **Enable nginx caching:**
   ```nginx
   proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=100m inactive=60m;

   location /api/ {
       proxy_cache api_cache;
       proxy_cache_valid 200 10m;
   }
   ```

3. **Enable gzip compression:**
   ```nginx
   gzip on;
   gzip_types text/plain text/css application/json application/javascript;
   ```

4. **Optimize MongoDB:**
   ```bash
   # Create indexes
   mongosh dumuwaks
   db.users.createIndex({ email: 1 })
   ```

5. **Enable PM2 cluster mode:**
   ```bash
   pm2 start app.js -i max
   ```

---

### Issue: High memory usage

**Symptoms:**
- Node.js process using too much memory
- OOM (Out of Memory) errors

**Solutions:**

1. **Check memory usage:**
   ```bash
   pm2 monit
   free -h
   ```

2. **Set memory limit:**
   ```javascript
   // In ecosystem.config.js
   max_memory_restart: '1G'
   ```

3. **Enable swap:**
   ```bash
   sudo swapon --show
   ```

4. **Restart PM2 processes:**
   ```bash
   pm2 restart all
   ```

5. **Check for memory leaks:**
   ```bash
   pm2 install pm2-logrotate
   npm install -g memwatch-next
   ```

---

## Security Issues

### Issue: Brute force attacks on SSH

**Symptoms:**
- Many failed login attempts in logs
- High CPU usage from sshd

**Solutions:**

1. **Install fail2ban:**
   ```bash
   sudo apt-get install fail2ban
   sudo systemctl enable fail2ban
   sudo systemctl start fail2ban
   ```

2. **Configure fail2ban:**
   ```bash
   sudo nano /etc/fail2ban/jail.local

   [sshd]
   enabled = true
   port = 22
   maxretry = 3
   bantime = 3600
   ```

3. **Restart fail2ban:**
   ```bash
   sudo systemctl restart fail2ban
   ```

4. **Check banned IPs:**
   ```bash
   sudo fail2ban-client status sshd
   ```

---

### Issue: Malicious traffic/bot attacks

**Symptoms:**
- Unusual traffic patterns
- API abuse
- High server load

**Solutions:**

1. **Implement rate limiting in nginx:**
   ```nginx
   limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

   location /api/ {
       limit_req zone=api_limit burst=20 nodelay;
   }
   ```

2. **Block suspicious IPs:**
   ```bash
   # In nginx config
   deny 1.2.3.4;
   deny 5.6.7.0/24;
   ```

3. **Enable Cloudflare (optional):**
   - Add VPS behind Cloudflare proxy
   - Enable firewall rules
   - Enable bot fight mode

4. **Monitor access logs:**
   ```bash
   sudo tail -f /var/log/nginx/access.log
   ```

---

## Getting Help

If you can't resolve the issue:

1. **Check logs:**
   ```bash
   # PM2 logs
   pm2 logs

   # nginx logs
   sudo tail -f /var/log/nginx/error.log

   # System logs
   journalctl -f
   ```

2. **Gather diagnostic information:**
   ```bash
   # System status
   systemctl status nginx mongod redis-server

   # PM2 status
   pm2 status

   # Network status
   netstat -tulpn

   # Disk usage
   df -h
   ```

3. **Contact support with:**
   - Error messages
   - Log files
   - Steps to reproduce
   - System information

---

## Useful Commands Reference

```bash
# System diagnostics
systemctl status nginx mongod redis-server
pm2 status
netstat -tulpn

# Log monitoring
pm2 logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/mongodb/mongod.log
journalctl -f

# Service management
sudo systemctl restart nginx
sudo systemctl reload nginx
pm2 restart all
pm2 reload all

# Configuration testing
sudo nginx -t
pm2 ecosystem validate

# Health checks
curl http://localhost:5000/health
curl https://api.ementech.co.ke/health
```

---

**Last Updated**: 2025-01-18
**Version**: 1.0
