# Security Quick Reference Guide
## EmenTech Website Security Implementation

**Last Updated:** 2026-01-20
**Priority:** CRITICAL

---

## CRITICAL SECURITY ISSUES - FIX IMMEDIATELY

### 1. EXPOSED CREDENTIALS (CRITICAL - Fix Now)

**File:** `/backend/.env`
**Issue:** Contains exposed secrets in repository
**Impact:** FULL SYSTEM COMPROMISE

**IMMEDIATE ACTIONS:**
```bash
# 1. Remove from git
cd backend
git rm --cached .env
git commit -m "security: Remove exposed .env file"

# 2. Add to .gitignore
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
echo ".env.*.local" >> .gitignore

# 3. Generate new secrets
JWT_SECRET=$(openssl rand -base64 64)
JWT_REFRESH_SECRET=$(openssl rand -base64 64)
SESSION_SECRET=$(openssl rand -base64 64)

# 4. Update .env with new values
# Edit .env and replace all secrets

# 5. Rotate database password
# 6. Rotate email passwords
# 7. Rotate OpenAI API key if needed
```

### 2. WEAK PASSWORD POLICY (CRITICAL)

**Current:** 6 characters minimum
**Required:** 12 characters with complexity requirements

**Fix:** Update User model password validation (see Implementation Guide)

### 3. NO ACCOUNT LOCKOUT (HIGH)

**Issue:** Unlimited login attempts
**Fix:** Implement account lockout after 5 failed attempts

---

## SECURITY ARCHITECTURE SUMMARY

### Defense Layers

```
┌─────────────────────────────────────────────┐
│ 1. Network Layer (UFW, Fail2Ban)           │
│    - Firewall rules                         │
│    - SSH hardening                          │
│    - DDoS protection                        │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ 2. Edge Layer (Nginx)                       │
│    - SSL/TLS termination                    │
│    - Security headers                       │
│    - Rate limiting                          │
│    - WAF capabilities                       │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ 3. Application Layer (Express)              │
│    - Helmet.js security headers             │
│    - CORS validation                        │
│    - Rate limiting (Redis)                  │
│    - Authentication (JWT)                   │
│    - Input validation                       │
│    - XSS/SQL injection prevention           │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ 4. Business Logic Layer                     │
│    - Password policy enforcement            │
│    - Account lockout                        │
│    - Session management                     │
│    - Audit logging                          │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ 5. Data Layer (MongoDB)                     │
│    - Encryption at rest                     │
│    - TLS in transit                         │
│    - Least privilege access                 │
│    - Query injection prevention            │
└─────────────────────────────────────────────┘
```

---

## SECURITY COMMANDS REFERENCE

### Generate Secure Secrets

```bash
# JWT Secret (64 chars)
openssl rand -base64 64

# Database password
openssl rand -base64 32

# API key
openssl rand -hex 32

# Session secret
openssl rand -base64 64
```

### VPS Security Commands

```bash
# UFW Firewall
sudo ufw enable
sudo ufw status verbose
sudo ufw allow from YOUR_IP to any port 22
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Fail2Ban status
sudo fail2ban-client status
sudo fail2ban-client status sshd

# View security logs
sudo tail -f /var/log/ementech/security.log
sudo tail -f /var/log/nginx/ementech-website-error.log
```

### MongoDB Security

```bash
# Connect to MongoDB
mongosh "mongodb+srv://USER:PASS@HOST/DB"

# Create user
db.createUser({
  user: "ementech_app_prod",
  pwd: "STRONG_PASSWORD",
  roles: [{ role: "readWrite", db: "ementech_production" }]
})
```

---

## TESTING COMMANDS

### Test Authentication Security

```bash
# Test login with invalid credentials
curl -X POST https://ementech.co.ke/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"wrong"}' \
  -v

# Test rate limiting
for i in {1..10}; do
  curl https://ementech.co.ke/api/health
done
```

### Test Security Headers

```bash
# Check headers
curl -I https://ementech.co.ke

# Expected headers:
# Strict-Transport-Security: max-age=63072000
# X-Frame-Options: SAMEORIGIN
# X-Content-Type-Options: nosniff
# Content-Security-Policy: ...
```

### Test SSL/TLS

```bash
# Test SSL configuration
curl -vI https://ementech.co.ke 2>&1 | grep -i "TLS\|SSL"

# Check certificate
openssl s_client -connect ementech.co.ke:443 -servername ementech.co.ke
```

---

## ENVIRONMENT VARIABLES

### Required Environment Variables

```env
# Server
NODE_ENV=production
PORT=5001

# Client
CLIENT_URL=https://ementech.co.ke
CORS_ORIGIN=https://ementech.co.ke

# Database
MONGODB_URI=mongodb+srv://USER:PASS@HOST/DB?ssl=true
MONGODB_DB_NAME=ementech_production

# JWT (64+ chars)
JWT_SECRET=GENERATE_WITH_openssl_rand_-base64_64
JWT_EXPIRE=15m
JWT_REFRESH_SECRET=GENERATE_WITH_openssl_rand_-base64_64
JWT_REFRESH_EXPIRE=7d

# Email
IMAP_HOST=mail.ementech.co.ke
IMAP_PORT=993
IMAP_USER=admin@ementech.co.ke
IMAP_PASS=STRONG_PASSWORD
SMTP_HOST=mail.ementech.co.ke
SMTP_PORT=587
SMTP_USER=admin@ementech.co.ke
SMTP_PASS=STRONG_PASSWORD

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Session
SESSION_SECRET=GENERATE_WITH_openssl_rand_-base64_64
SESSION_MAX_AGE=3600000

# Redis (optional, for rate limiting)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=PASSWORD

# Logging
LOG_LEVEL=info
SECURITY_LOG_PATH=/var/log/ementech/security.log
```

---

## SECURITY FILES TO CREATE

### Backend Files

```
/backend/src/middleware/
├── security.js (Security headers, logging)
├── authEnhanced.js (Enhanced auth with lockout)
├── accountLockout.js (Account lockout logic)
├── intrusionDetection.js (XSS, SQL injection detection)
├── passwordValidation.js (Password strength validation)
└── rateLimiter.js (Enhanced rate limiting)

/backend/src/models/
├── TokenBlacklist.js (JWT blacklist model)
└── User.js (Update with security fields)

/backend/src/utils/
└── securityLogger.js (Security event logging)

/backend/src/config/
└── database.js (Enhanced security options)
```

### Frontend Files

```
/src/utils/
└── security.tsx (XSS protection, secure storage)

/src/security/
└── csp.ts (Content Security Policy)

/src/services/
└── authService.ts (Enhanced with token refresh)
```

---

## IMPLEMENTATION PRIORITY ORDER

### Phase 1: CRITICAL (Complete in 24 hours)

1. Remove .env from repository
2. Generate and update all secrets
3. Implement strong password policy
4. Implement account lockout
5. Enhance JWT security
6. Add token blacklist

**Estimated Time:** 6-8 hours

### Phase 2: HIGH (Complete in Week 1)

1. Implement enhanced security headers
2. Add intrusion detection
3. Enhance rate limiting
4. Configure UFW firewall
5. Harden SSH
6. Install Fail2Ban

**Estimated Time:** 3-4 days

### Phase 3: MEDIUM (Complete in Week 2)

1. MongoDB Atlas security configuration
2. Update Nginx security headers
3. Implement Content Security Policy
4. Set up security logging
5. Add email security

**Estimated Time:** 3-4 days

### Phase 4: MAINTENANCE (Ongoing)

1. Daily log monitoring
2. Weekly dependency updates
3. Monthly secret rotation
4. Quarterly security audits

---

## SECURITY CHECKLIST

### Pre-Deployment

- [ ] All secrets removed from repository
- [ ] Strong password policy implemented
- [ ] Account lockout enabled
- [ ] JWT secrets secured (64+ chars)
- [ ] Token expiration set to 15 minutes
- [ ] Refresh tokens implemented
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] Input validation active
- [ ] XSS protection enabled
- [ ] SQL injection prevention active
- [ ] CSRF protection implemented
- [ ] HTTPS enforced
- [ ] Database encryption enabled
- [ ] Firewall configured
- [ ] SSH hardened
- [ ] Security logging enabled
- [ ] Monitoring active

### Post-Deployment

- [ ] Test authentication flow
- [ ] Test rate limiting
- [ ] Test security headers
- [ ] Test SSL/TLS configuration
- [ ] Review security logs
- [ ] Run vulnerability scan
- [ ] Document any issues
- [ ] Create incident response plan

---

## COMMON SECURITY ISSUES & SOLUTIONS

### Issue: Brute Force Attack
**Symptoms:** Many failed login attempts in logs
**Solution:** Account lockout, rate limiting, Fail2Ban

### Issue: XSS Attack
**Symptoms:** Suspicious scripts in user input
**Solution:** Input sanitization, CSP headers

### Issue: SQL Injection
**Symptoms:** SQL patterns in request logs
**Solution:** Parameterized queries, input validation

### Issue: DDoS Attack
**Symptoms:** Huge spike in traffic
**Solution:** Rate limiting, Cloudflare, Nginx limits

### Issue: Token Theft
**Symptoms:** Unauthorized access with valid tokens
**Solution:** Short expiration, refresh tokens, blacklist

---

## CONTACT & ESCALATION

### Security Incident Response

1. **Immediate Actions (0-1 hour)**
   - Isolate affected systems
   - Preserve logs
   - Block suspicious IPs
   - Notify team

2. **Investigation (1-24 hours)**
   - Analyze logs
   - Identify root cause
   - Determine scope
   - Document findings

3. **Recovery (24-72 hours)**
   - Patch vulnerabilities
   - Restore from backups if needed
   - Update security policies
   - Monitor for re-occurrence

4. **Post-Incident**
   - Conduct review
   - Update documentation
   - Implement improvements
   - Train team

---

## USEFUL RESOURCES

### Security Tools
- OWASP ZAP: https://www.zaproxy.org/
- Nmap: https://nmap.org/
- Snyk: https://snyk.io/
- npm audit: Built into npm

### Documentation
- OWASP Top 10: https://owasp.org/www-project-top-ten/
- Mozilla SSL Config: https://ssl-config.mozilla.org/
- Helmet.js: https://helmetjs.github.io/

### Security News
- Krebs on Security: https://krebsonsecurity.com/
- The Hacker News: https://thehackernews.com/
- SANS: https://www.sans.org/

---

## QUICK REMINDERS

### DO's
✓ Use environment variables for secrets
✓ Rotate secrets regularly
✓ Enable security headers
✓ Implement rate limiting
✓ Log security events
✓ Test security features
✓ Keep dependencies updated
✓ Use HTTPS only
✓ Validate all inputs
✓ Follow principle of least privilege

### DON'Ts
✗ Commit secrets to repository
✗ Use weak passwords
✗ Disable security features in production
✗ Ignore security warnings
✗ Use eval() or similar dangerous functions
✗ Trust client-side validation
✗ Expose error details to users
✗ Use default credentials
✗ Disable SSL verification
✗ Ignore security logs

---

**This quick reference guide provides essential information for implementing and maintaining security. Always refer to the full Security Architecture and Implementation Guide for detailed information.**

---

**Version:** 1.0.0
**Last Updated:** 2026-01-20
**Maintained By:** EmenTech Development Team
