# Go-Live Checklist & Deployment Procedures

**Project**: EmenTech Enterprise Email System
**Project Code**: EMENTECH-EMAIL-001
**Deployment Date**: February 9, 2026 (Target)
**Deployment Window**: 2:00 AM - 6:00 AM UTC (Low traffic period)
**Version**: 1.0

---

## Pre-Deployment Checklist (Day -1 to Day -7)

### Week Before Launch (Feb 2-8)

#### 7 Days Before (Feb 2)
- [ ] **Code Freeze**: No new features, only bug fixes
- [ ] **Feature Freeze**: All features implemented and locked
- [ ] **Complete Testing Suite**: All unit, integration, E2E tests passing
- [ ] **Test Coverage Verified**: 80%+ coverage achieved
- [ ] **Performance Benchmarks Met**: Lighthouse ≥ 75, page load < 3s
- [ ] **Accessibility Audit Passed**: Lighthouse ≥ 85, WCAG 2.1 AA compliant
- [ ] **Security Scan Clean**: Zero HIGH/CRITICAL vulnerabilities
- [ ] **Load Testing Complete**: 100 concurrent users, < 500ms response time

#### 5 Days Before (Feb 4)
- [ ] **All Critical Bugs Fixed**: Zero showstoppers
- [ ] **High-Priority Bugs < 5**: Only minor bugs acceptable
- [ ] **Bug Fixes Verified**: No regressions introduced
- [ ] **Code Review Complete**: All code reviewed and approved
- [ ] **Documentation Complete**: API docs, setup guides, troubleshooting
- [ ] **User Acceptance Testing**: 5+ users tested, 80%+ task completion
- [ ] **Stakeholder Approval**: Business owner approved launch
- [ ] **Go/No-Go Decision Scheduled**: For Feb 7

#### 3 Days Before (Feb 6)
- [ ] **Production Environment Ready**: Server capacity verified
- [ ] **Database Schema Finalized**: Migrations tested and documented
- [ ] **Email Monitor Daemon Tested**: Running in staging, IMAP connection stable
- [ ] **Socket.IO Server Tested**: WebSocket connections stable
- [ ] **PM2 Configuration Ready**: Process management configured
- [ ] **Nginx Configuration Ready**: Reverse proxy configured
- [ ] **SSL/TLS Certificates Valid**: Not expiring soon, renewed if needed
- [ ] **DNS Records Verified**: All records correct and propagated

#### 2 Days Before (Feb 7)
- [ ] **Go/No-Go Meeting**: Conducted, decision documented
- [ ] **Deployment Plan Finalized**: All steps documented
- [ ] **Rollback Plan Tested**: Rollback procedure verified
- [ ] **Monitoring Setup**: Alerts configured, dashboards ready
- [ ] **Logging Setup**: Logs collected, retention policy set
- [ ] **Backup Strategy Tested**: Database and file backups verified
- [ ] **Incident Response Plan Ready**: Runbook created, team trained
- [ ] **Launch Announcement Prepared**: Email, Slack, documentation ready

#### 1 Day Before (Feb 8)
- [ ] **Team Briefing**: Deployment team briefed on procedures
- [ ] **Stakeholder Notification**: Launch communicated to all stakeholders
- [ ] **User Notification**: End users notified of planned maintenance
- [ ] **Final Smoke Tests**: All critical paths tested in staging
- [ ] **Deployment Checklist Verified**: All items checked
- [ ] **Rollback Verification**: Rollback tested one final time
- [ ] **On-Call Schedule**: Team assigned for launch day and 24 hours post-launch
- [ ] **Communication Channels**: Slack/Teams channels created for coordination

---

## Deployment Day Checklist (February 9, 2026)

### Pre-Deployment (2:00 AM - 3:00 AM UTC)

**Team Assembly**:
- [ ] All deployment team members online (Slack/Teams)
- [ ] Voice channel open for real-time communication
- [ ] Dashboard open for monitoring
- [ ] Runbook accessible to all team members

**System Verification**:
- [ ] Staging environment stable
- [ ] Production server capacity verified (CPU, RAM, disk)
- [ ] Database backups created (pre-deployment snapshot)
- [ ] Current production state documented
- [ ] Email server status checked (Postfix, Dovecot operational)
- [ ] Network connectivity verified

**Code Deployment**:
- [ ] Git tag created for release (e.g., v1.0.0)
- [ ] Production build artifacts generated
- [ ] Build tested locally
- [ ] Artifacts uploaded to production server

---

### Deployment Execution (3:00 AM - 4:00 AM UTC)

#### Step 1: Database Migration (3:00 - 3:15 AM)
**Owner**: Implementation Agent + Project Director

```bash
# Connect to production database
mongo --host localhost --username admin --password

# Create collections
use ementech-email
db.createCollection('emails')
db.createCollection('users')
db.createCollection('settings')

# Create indexes
db.emails.createIndex({ userId: 1, timestamp: -1 })
db.emails.createIndex({ read: 1 })
db.emails.createIndex({ folder: 1 })
db.users.createIndex({ email: 1 }, { unique: true })

# Verify indexes
db.emails.getIndexes()
db.users.getIndexes()
```

- [ ] Collections created
- [ ] Indexes created and verified
- [ ] Migration logged
- [ ] Rollback script ready (drop collections if needed)

#### Step 2: Backend Deployment (3:15 - 3:45 AM)
**Owner**: Implementation Agent

```bash
# Navigate to backend directory
cd /var/www/ementech/email-backend

# Pull latest code
git fetch origin
git checkout v1.0.0
git pull origin v1.0.0

# Install dependencies
npm ci --production

# Build TypeScript
npm run build

# Update environment variables
nano .env.production
# Verify all variables correct

# Restart backend with PM2
pm2 restart ementech-email-api
pm2 save

# Verify PM2 status
pm2 status
pm2 logs ementech-email-api --lines 50
```

- [ ] Code deployed
- [ ] Dependencies installed
- [ ] Environment variables configured
- [ ] PM2 restarted
- [ ] API responding (health check)
- [ ] No errors in logs

#### Step 3: Email Monitor Daemon (3:45 - 4:00 AM)
**Owner**: Implementation Agent

```bash
# Navigate to email daemon
cd /var/www/email-daemon

# Update emailMonitor.js
git pull origin main

# Install dependencies
npm install

# Test IMAP connection
node test-imap-connection.js

# Start with PM2
pm2 start emailMonitor.js --name email-monitor
pm2 save

# Verify logs
pm2 logs email-monitor --lines 50
```

- [ ] Daemon updated
- [ ] IMAP connection tested
- [ ] PM2 started
- [ ] Logs showing IDLE connection
- [ ] No errors in logs

#### Step 4: Frontend Deployment (4:00 - 4:30 AM)
**Owner**: Implementation Agent

```bash
# Navigate to frontend directory
cd /var/www/ementech/email-frontend

# Pull latest code
git fetch origin
git checkout v1.0.0
git pull origin v1.0.0

# Install dependencies
npm ci

# Build for production
npm run build

# Verify build output
ls -la dist/

# Update Nginx configuration if needed
sudo nginx -t
sudo systemctl reload nginx
```

- [ ] Frontend deployed
- [ ] Build successful
- [ ] Static files in dist/
- [ ] Nginx reloaded
- [ ] Website accessible

#### Step 5: Socket.IO Server (4:30 - 4:45 AM)
**Owner**: Implementation Agent

```bash
# Socket.IO is part of backend, verify it's running
pm2 logs ementech-email-api --lines 20 | grep -i socket

# Test WebSocket connection
# (Use browser dev tools or WebSocket test client)
# wss://ementech.co.ke/socket.io/

# Verify Socket.IO is listening
netstat -tlnp | grep :3000
```

- [ ] Socket.IO process running
- [ ] WebSocket port listening
- [ ] Test connection successful
- [ ] No Socket.IO errors in logs

---

### Post-Deployment Verification (4:45 AM - 5:15 AM UTC)

#### Smoke Tests (Critical User Paths)

**Test 1: Email Sending**
```bash
# Via API or browser
curl -X POST https://ementech.co.ke/api/v1/email/send \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "subject": "Smoke Test - Deployment",
    "body": "This is a smoke test email after deployment."
  }'
```
- [ ] Email sent successfully
- [ ] SMTP transmission logged
- [ ] No errors in Postfix logs
- [ ] Email received at test@example.com

**Test 2: Email Receiving**
```bash
# Send test email to admin@ementech.co.ke from external account
# Then check API
curl https://ementech.co.ke/api/v1/email/inbox \
  -H "Authorization: Bearer $TOKEN"
```
- [ ] Test email sent from external account
- [ ] Email monitor daemon detected new email
- [ ] Socket.IO event emitted (new_email)
- [ ] Email appears in inbox API response

**Test 3: Real-Time Notifications**
- [ ] Open email app in browser
- [ ] Send test email from external account
- [ ] Desktop notification received (if permission granted)
- [ ] Inbox updates without page refresh
- [ ] Unread count increments

**Test 4: Authentication**
```bash
curl -X POST https://ementech.co.ke/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@ementech.co.ke",
    "password": "testPassword"
  }'
```
- [ ] Login successful
- [ ] JWT token returned
- [ ] Token valid for API requests

**Test 5: Frontend Loading**
- [ ] Navigate to https://ementech.co.ke/email
- [ ] Page loads in < 3 seconds
- [ ] No console errors
- [ ] UI renders correctly
- [ ] Responsive on mobile

**Test 6: Accessibility**
- [ ] Run Lighthouse accessibility audit
- [ ] Score ≥ 85
- [ ] No critical violations

**Test 7: Performance**
- [ ] Run Lighthouse performance audit
- [ ] Score ≥ 75
- [ ] Page load < 3 seconds

---

### Monitoring & Validation (5:15 AM - 5:45 AM UTC)

**System Monitoring**:
- [ ] PM2 processes: All running, no restarts
- [ ] CPU usage: < 80%
- [ ] RAM usage: < 80%
- [ ] Disk space: > 20% free
- [ ] Database: Queries fast, no locks

**Application Monitoring**:
- [ ] API response time: < 500ms (p95)
- [ ] Socket.IO connections: Stable
- [ ] Email queue: Empty (no stuck emails)
- [ ] Error rate: < 1%

**Log Monitoring**:
```bash
# Backend logs
pm2 logs ementech-email-api --lines 100

# Email daemon logs
pm2 logs email-monitor --lines 100

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Mail logs
sudo tail -f /var/log/mail.log
```
- [ ] No error spikes
- [ ] No warning signs
- [ ] Normal traffic patterns

**Email Server Verification**:
```bash
# Check Postfix
sudo postfix status
sudo mailq

# Check Dovecot
sudo doveadm status

# Check IMAP connection
telnet localhost 993
```
- [ ] Postfix running
- [ ] Dovecot running
- [ ] Mail queue empty
- [ ] IMAP responding

---

### Go-Live Decision (5:45 AM - 6:00 AM UTC)

**Go/No-Go Criteria**:

**GO (Launch Successful)**
- All smoke tests passed
- No critical errors
- Monitoring stable
- Performance acceptable
- Team confident

**NO-GO (Rollback Required)**
- Any critical smoke test failed
- System unstable
- Critical errors detected
- Performance severely degraded

**If GO**:
- [ ] Document deployment success
- [ ] Notify stakeholders (launch successful)
- [ ] Notify end users (system live)
- [ ] Begin 24-hour monitoring period
- [ ] On-call team on standby

**If NO-GO (Rollback)**:
- [ ] Execute rollback procedure
- [ ] Restore pre-deployment database snapshot
- [ ] Revert code to previous version
- [ ] Restart old services
- [ ] Verify old system stable
- [ ] Investigate failure root cause
- [ ] Reschedule deployment

---

## Post-Launch Monitoring (First 24 Hours)

### Hour 0-6 (6:00 AM - 12:00 PM UTC)
**Monitoring Frequency**: Every 30 minutes

- [ ] System stability: No crashes
- [ ] Error rate: < 1%
- [ ] Response time: < 500ms
- [ ] Email delivery: Working normally
- [ ] Real-time updates: Working
- [ ] User feedback: Monitoring

### Hour 6-12 (12:00 PM - 6:00 PM UTC)
**Monitoring Frequency**: Every 1 hour

- [ ] System stability continued
- [ ] Performance metrics stable
- [ ] No memory leaks
- [ ] Email queue processing normally
- [ ] User complaints: < 5

### Hour 12-24 (6:00 PM - 6:00 AM UTC next day)
**Monitoring Frequency**: Every 2 hours

- [ ] System continues stable
- [ ] Overnight batch jobs (if any) successful
- [ ] No automated alerts triggered
- [ ] Morning traffic handled well

---

## Rollback Procedure (If Needed)

### Rollback Triggers
- Critical smoke test failures
- System instability
- Data corruption
- Security incident
- Performance severely degraded

### Rollback Steps

**Step 1: Stop Current Services** (5 minutes)
```bash
pm2 stop ementech-email-api
pm2 stop email-monitor
sudo systemctl stop nginx
```

**Step 2: Restore Database** (10 minutes)
```bash
# Restore from pre-deployment snapshot
mongorestore --drop --gzip --archive=/backups/pre-deployment-$(date +%Y%m%d).gz
```

**Step 3: Revert Code** (10 minutes)
```bash
# Backend
cd /var/www/ementech/email-backend
git checkout previous-stable-tag
pm2 restart ementech-email-api

# Frontend
cd /var/www/ementech/email-frontend
git checkout previous-stable-tag
npm run build
sudo systemctl reload nginx
```

**Step 4: Verify Old System** (15 minutes)
- [ ] Smoke tests pass
- [ ] System stable
- [ ] No errors
- [ ] Users can access system

**Step 5: Notify Stakeholders** (5 minutes)
- [ ] Rollback complete
- [ ] System back to previous version
- [ ] Incident investigation started
- [ ] New deployment timeline to be determined

---

## Launch Day Communications

### Pre-Launch (Day Before)
**To**: All Stakeholders
**Subject**: EmenTech Email System Launch Tomorrow (Feb 9)

**Template**:
```
Hello Team,

This is a reminder that the EmenTech Email System will launch tomorrow, February 9, 2026.

**Launch Window**: 2:00 AM - 6:00 AM UTC (Low traffic period)
**Expected Downtime**: Minimal (< 30 minutes)
**System Availability**: 6:00 AM UTC

**What to Expect**:
- New real-time email features
- Desktop notifications
- Improved user experience
- WCAG 2.1 AA accessibility

**Action Required**:
- Please logout before 2:00 AM UTC
- Clear browser cache after 6:00 AM UTC
- Login to new system

**Support**:
- Live support available 6:00 AM - 6:00 PM UTC
- Email: support@ementech.co.ke
- Slack: #email-system-support

Questions? Reply to this email.

Best regards,
Project Director
```

### Launch Successful (6:00 AM UTC)
**To**: All Stakeholders + End Users
**Subject**: EmenTech Email System Now Live!

**Template**:
```
Hello Everyone,

The EmenTech Email System has successfully launched and is now live! 🎉

**System Status**: 🟢 OPERATIONAL
**Launch Time**: 6:00 AM UTC, February 9, 2026

**What's New**:
✅ Real-time email delivery (no refresh needed)
✅ Desktop notifications for new emails
✅ Modern, accessible interface
✅ Mobile-optimized experience

**Get Started**:
1. Clear your browser cache
2. Navigate to: https://ementech.co.ke/email
3. Login with your existing credentials
4. Explore the new features!

**Training Resources**:
- User Guide: [Link]
- Video Tutorial: [Link]
- FAQ: [Link]

**Need Help?**
- Live support: 6:00 AM - 6:00 PM UTC
- Email: support@ementech.co.ke
- Slack: #email-system-support

Welcome to the future of email at EmenTech!

Best regards,
Project Director
```

### Launch Issues (If Rollback)
**To**: All Stakeholders + End Users
**Subject**: EmenTech Email System Launch Delayed

**Template**:
```
Hello Everyone,

Unfortunately, we encountered technical issues during the launch of the new Email System. We have rolled back to the previous system to ensure stability.

**Current System Status**: 🟡 PREVIOUS VERSION ACTIVE
**Issue**: [Brief description of issue]
**Impact**: No data loss, system stable

**What This Means**:
- Old email system remains active
- Your data is safe
- No action required

**Next Steps**:
- We are investigating the issue
- New launch date will be communicated soon
- Apologies for the inconvenience

**Support**:
- Available as usual
- Contact: support@ementech.co.ke

Thank you for your patience.

Best regards,
Project Director
```

---

## Post-Launch Activities (Week 1)

### Day 1 (Feb 9) - Launch Day
- [ ] 24-hour monitoring complete
- [ ] System stable, no critical issues
- [ ] User support tickets: < 10
- [ ] Performance metrics: Within targets
- [ ] Daily status report sent

### Day 2-3 (Feb 10-11) - Stability Monitoring
- [ ] Continue monitoring
- [ ] Address user feedback
- [ ] Fix minor bugs found
- [ ] Optimize performance
- [ ] Document lessons learned

### Day 4-7 (Feb 12-15) - Normalization
- [ ] System normalized, no critical issues
- [ ] User training completed
- [ ] Support tickets decreasing
- [ ] Performance optimization complete
- [ ] Handoff to operations team

---

## Success Criteria

### Launch Success Metrics
- [ ] System deployed on schedule
- [ ] All smoke tests passed
- [ ] Zero critical bugs in production
- [ ] < 5 high-priority bugs in first 24 hours
- [ ] 99.9% uptime first week
- [ ] User satisfaction: 4/5+ stars
- [ ] No data loss or corruption
- [ ] Performance targets met (Lighthouse ≥ 75, accessibility ≥ 85)

### Post-Launch Success (Week 1)
- [ ] < 20 support tickets (minor issues)
- [ ] No rollback required
- [ ] System stable, no crashes
- [ ] User adoption: 80%+ active users
- [ ] Performance remains within targets
- [ ] Positive user feedback

---

## Launch Team Responsibilities

### Project Director
- Overall launch coordination
- Go/No-Go decision
- Stakeholder communication
- Incident management

### Implementation Agent
- Technical execution
- Smoke test verification
- Rollback execution (if needed)
- Bug fixes post-launch

### System Architect
- Architecture validation
- Performance monitoring
- Technical issue resolution

### Operations Team
- Server monitoring
- Log monitoring
- Alert response
- User support

---

## Launch Day Checklist Summary

### Pre-Deployment (Day -1 to Day -7)
- [ ] Testing complete and passing
- [ ] Documentation complete
- [ ] Stakeholder approval obtained
- [ ] Deployment plan finalized
- [ ] Rollback plan tested
- [ ] Monitoring configured
- [ ] Team briefed

### Deployment Day (Day 0)
- [ ] Pre-deployment verification
- [ ] Database migration
- [ ] Backend deployment
- [ ] Email daemon deployment
- [ ] Frontend deployment
- [ ] Smoke tests
- [ ] Go/No-Go decision
- [ ] Launch notification

### Post-Launch (Day 1-7)
- [ ] 24-hour monitoring
- [ ] User support
- [ ] Bug fixes
- [ ] Performance optimization
- [ ] Documentation updates
- [ ] Post-mortem (if issues)
- [ ] Handoff to operations

---

## Emergency Contacts (Launch Day)

| Role | Name | Contact | Time Zone |
|------|------|---------|-----------|
| Project Director | [Name] | [+Phone] | UTC |
| Implementation Agent | [Name] | [+Phone] | UTC |
| System Architect | [Name] | [+Phone] | UTC |
| Operations Lead | [Name] | [+Phone] | UTC |
| Business Owner | [Name] | [+Phone] | UTC |

---

**Document Version**: 1.0
**Owner**: Project Director
**Last Updated**: January 19, 2026
**Next Review**: Pre-deployment (Feb 8, 2026)
