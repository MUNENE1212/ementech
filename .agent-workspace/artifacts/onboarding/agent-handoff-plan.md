# Ementech Website - Agent Handoff Plan

**Created**: 2026-01-21
**Project Status**: Production Live
**Documentation Status**: Complete
**Handoff Type**: Full Project Onboarding

---

## Handoff Summary

This document provides a **comprehensive handoff plan** for transferring knowledge of the Ementech website project to other AI agents or human developers. All critical documentation has been created and is located in `.agent-workspace/`.

### Documentation Package

**Location**: `/media/munen/muneneENT/ementech/ementech-website/.agent-workspace/`

**Shared Context** (for all agents):
```
.agent-workspace/shared-context/
├── onboarding-summary.md                    # START HERE - Project overview
├── reverse-engineered-architecture.md       # System architecture
├── tech-stack-inventory.md                  # All technologies used
├── api-documentation.md                     # Complete API reference
├── email-system-documentation.md            # CWD email system details
└── data-model-documentation.md              # Database schema reference
```

**Artifacts** (for specific roles):
```
.agent-workspace/artifacts/onboarding/
├── code-quality-assessment.md               # Quality metrics & issues
└── technical-debt-analysis.md               # Debt & remediation plan
```

---

## Quick Start for New Agents

### Step 1: Read Onboarding Summary (30 minutes)

**File**: `.agent-workspace/shared-context/onboarding-summary.md`

**What You'll Learn**:
- Project purpose and scope
- Technology stack overview
- Critical systems (email system!)
- Project structure
- Development setup
- Testing the email system

**Key Takeaway**: The email system is a PRODUCTION-GRADE, FULLY TESTED IMAP client built for CWD startup. It is NOT optional.

---

### Step 2: Study Architecture (1 hour)

**File**: `.agent-workspace/shared-context/reverse-engineered-architecture.md`

**What You'll Learn**:
- System architecture diagram
- Layer-by-layer breakdown
- Real-time communication flow
- Email system architecture
- Security architecture
- Deployment architecture

**Key Takeaway**: Three-tier monolith with service-oriented patterns and real-time Socket.IO integration.

---

### Step 3: Review Your Domain (1-2 hours)

**Choose Your Domain**:

**For Frontend Developers**:
1. Read `tech-stack-inventory.md` (Frontend section)
2. Explore `/src/components/` directory
3. Study `/src/pages/` for routing
4. Review `/src/services/` for API integration

**For Backend Developers**:
1. Read `tech-stack-inventory.md` (Backend section)
2. Study `api-documentation.md`
3. Explore `/backend/src/controllers/`
4. Review `/backend/src/models/`
5. Study `/backend/src/services/` (especially imapWatcher.js)

**For Email System Work** (CWD Startup):
1. **CRITICAL**: Read `email-system-documentation.md`
2. Study `/backend/src/services/imapWatcher.js` (342 lines)
3. Review `/backend/src/controllers/emailController.js` (1067 lines)
4. Test IMAP connection before making changes
5. Understand Socket.IO events

**For DevOps Engineers**:
1. Read `reverse-engineered-architecture.md` (Deployment section)
2. Study `DEPLOYMENT.md` (557 lines)
3. Review Nginx configuration
4. Understand PM2 process management
5. Review backup procedures

**For QA Engineers**:
1. Read `code-quality-assessment.md` (Testing section)
2. Study `api-documentation.md` for endpoint testing
3. Review `email-system-documentation.md` for email testing
4. Create test plan based on coverage gaps

---

### Step 4: Understand Quality & Debt (30 minutes)

**Files**:
- `code-quality-assessment.md`
- `technical-debt-analysis.md`

**What You'll Learn**:
- Overall code quality: 7.5/10
- Critical issue: Zero test coverage
- 14 technical debt items identified
- Prioritized remediation plan

---

### Step 5: Setup Development Environment (1 hour)

**Prerequisites**:
- Node.js 18+
- MongoDB 4.4+
- Git

**Steps**:
```bash
# Clone repository (if not already)
cd /media/munen/muneneENT/ementech/ementech-website

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Start frontend (terminal 1)
cd ..
npm run dev

# Start backend (terminal 2)
cd backend
npm run dev
```

**Access**:
- Frontend: http://localhost:3000
- Backend: http://localhost:5001
- API Health: http://localhost:5001/api/health

---

## Agent-Specific Handoffs

### Agent: Frontend Developer

**Primary Responsibilities**:
- Build React components
- Implement UI features
- Integrate with backend APIs
- Handle Socket.IO real-time updates

**Critical Knowledge**:
1. **React 19** - Latest version with concurrent features
2. **TypeScript** - Used for type safety
3. **Vite** - Build tool (not webpack)
4. **Tailwind CSS** - Utility-first styling
5. **Framer Motion** - Animation library
6. **Socket.IO Client** - Real-time updates

**Key Files to Study**:
```
/src/App.tsx                    # App root, routing
/src/components/email/           # Email UI components (CWD)
/src/components/chat/            # AI chatbot UI
/src/pages/EmailInbox.jsx        # Email inbox page
/src/services/                   # API service layer
```

**Common Tasks**:
- Add new page → Create in `/src/pages/`, update `App.tsx`
- Add component → Create in appropriate `/src/components/` subdirectory
- Call API → Use services from `/src/services/`
- Real-time updates → Listen to Socket.IO events

**Gotchas**:
- Email system is CRITICAL - don't break it
- Socket.IO requires JWT token in auth
- All API calls require authentication
- Email components use JSX (not TSX)

---

### Agent: Backend Developer

**Primary Responsibilities**:
- Develop API endpoints
- Implement business logic
- Manage database operations
- Integrate external services

**Critical Knowledge**:
1. **Express.js** - Web framework
2. **Socket.IO** - Real-time communication
3. **Mongoose** - MongoDB ODM
4. **IMAP** - Email protocol (CWD startup)
5. **JWT** - Authentication
6. **Nodemailer** - Email sending

**Key Files to Study**:
```
/backend/src/server.js               # Entry point
/backend/src/controllers/            # Request handlers
/backend/src/models/                 # Data models
/backend/src/routes/                 # API routes
/backend/src/services/imapWatcher.js # Email monitoring (CWD)
/backend/src/config/socket.js        # Socket.IO config
```

**Common Tasks**:
- Add endpoint → Create controller, add route
- Add model → Create in `/models/`, add indexes
- Add business logic → Create in `/services/`
- Emit Socket.IO event → Use helper functions

**Gotchas**:
- Email system is CRITICAL - test thoroughly
- All routes require authentication (except `/api/auth`, `/api/health`)
- Use `protect` middleware for protected routes
- Email credentials are encrypted (decrypt before using)
- IMAP connections are per-user (don't create global connections)

---

### Agent: Email System Specialist (CWD Startup)

**Primary Responsibilities**:
- Maintain IMAP email system
- Fix email sync issues
- Optimize email performance
- Add email features

**Critical Knowledge**:
1. **IMAP Protocol** - Email fetching
2. **IMAP IDLE** - Real-time push
3. **SMTP Protocol** - Email sending
4. **Socket.IO** - Real-time notifications
5. **Mailparser** - Email parsing
6. **Nodemailer** - Email sending

**Key Files to Study**:
```
/backend/src/services/imapWatcher.js          # MUST MASTER
/backend/src/controllers/emailController.js    # MUST MASTER
/backend/src/models/Email.js                  # Data structure
/backend/src/models/UserEmail.js              # Credentials
/backend/src/config/socket.js                 # Real-time events
```

**IMAP Watcher Architecture**:
```javascript
// Singleton pattern
class IMAPWatcher {
  watchers: Map<userId, Imap connection>
  syncIntervals: Map<userId, intervalId>

  startWatching(userId)           // Start monitoring
  tryIDLE(userId, emailAccount)   // Try real-time push
  startPolling(userId, emailAccount) // Fallback to 30s polling
  fetchNewEmails(...)             // Fetch & save emails
  stopWatching(userId)            // Stop monitoring
}
```

**Email Sync Flow**:
```
1. IMAP server notifies (IDLE) or polling triggers
2. fetchNewEmails() fetches emails with UID > lastUid
3. Parse with mailparser
4. Save to MongoDB
5. Emit 'new_email' Socket.IO event
6. Client updates UI instantly
```

**Testing Checklist**:
- [ ] IMAP connection works
- [ ] IDLE mode enabled (or polling fallback)
- [ ] Emails sync correctly
- [ ] Socket.IO events fire
- [ ] Email sending works (SMTP)
- [ ] Folder management works
- [ ] Labels work
- [ ] Search works

**Gotchas**:
- IMAP connections are PER-USER (not shared)
- Always decrypt passwords before using
- Test with real IMAP account
- Handle IMAP disconnections gracefully
- Don't block event loop (IMAP is async)
- Test with Gmail AND other providers

---

### Agent: DevOps Engineer

**Primary Responsibilities**:
- Manage deployments
- Configure servers
- Monitor applications
- Handle backups

**Critical Knowledge**:
1. **PM2** - Process manager
2. **Nginx** - Reverse proxy
3. **Let's Encrypt** - SSL certificates
4. **MongoDB** - Database
5. **Ubuntu Linux** - Server OS

**Key Files to Study**:
```
/DEPLOYMENT.md                       # Comprehensive deployment guide
/backend/package.json                # PM2 start script
/etc/nginx/sites-available/ementech.conf  # Nginx config
```

**Production Environment**:
```
VPS: 69.164.244.165
OS: Ubuntu Linux 6.14.0-37-generic
Domain: ementech.co.ke
SSL: Let's Encrypt
```

**PM2 Commands**:
```bash
pm2 list                              # List processes
pm2 logs ementech-backend             # View logs
pm2 restart ementech-backend          # Restart
pm2 monit                             # Monitor
```

**Nginx Commands**:
```bash
systemctl status nginx                # Check status
nginx -t                              # Test config
systemctl reload nginx                # Reload config
```

**Deployment Process**:
```bash
# Frontend
npm run build
scp -r dist/* root@69.164.244.165:/var/www/ementech-website/current/

# Backend
ssh root@69.164.244.165
cd /var/www/ementech-website/backend
git pull origin main
npm install
pm2 restart ementech-backend
```

**Monitoring**:
- PM2 logs: `pm2 logs ementech-backend`
- Nginx logs: `/var/log/nginx/access.log`, `/var/log/nginx/error.log`
- Health check: `curl https://ementech.co.ke/api/health`

**Gotchas**:
- Multiple projects on VPS (ementech-backend, dumuwaks-backend)
- Restart correct PM2 process
- Reload Nginx after config changes
- SSL certificates auto-renew (certbot)
- MongoDB backups NOT automated (needs setup)

---

### Agent: QA Engineer

**Primary Responsibilities**:
- Create test plans
- Write automated tests
- Manual testing
- Bug reporting

**Critical Knowledge**:
1. **Jest** - Unit testing framework
2. **Supertest** - API testing
3. **Cypress** - E2E testing
4. **Email System** - IMAP/SMTP testing
5. **Socket.IO** - Real-time testing

**Current Testing Status**:
- **Unit Tests**: 0% coverage ❌
- **Integration Tests**: 0% coverage ❌
- **E2E Tests**: 0% coverage ❌
- **Manual Tests**: Email system only

**Priority Testing Areas**:
1. **Email System** (CRITICAL - CWD startup)
   - IMAP sync
   - Email sending
   - Real-time updates
   - Folder management

2. **Authentication**
   - Login/logout
   - JWT tokens
   - Password reset

3. **API Endpoints**
   - All routes documented in `api-documentation.md`

4. **Frontend Components**
   - Email inbox
   - Chat interface
   - Forms

**Test Plan Template**:
```javascript
// Example: Email Sync Test
describe('Email Sync', () => {
  it('should sync emails from IMAP server', async () => {
    const response = await request(app)
      .post('/api/email/sync/INBOX')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.syncedCount).toBeGreaterThan(0);
  });
});
```

**Testing Checklist**:
- [ ] Unit tests for models (Email, User, UserEmail)
- [ ] Unit tests for services (imapWatcher)
- [ ] Integration tests for API endpoints
- [ ] E2E tests for critical paths
- [ ] Load testing for email sync
- [ ] Security testing (injection, XSS)

---

### Agent: Database Administrator

**Primary Responsibilities**:
- Manage MongoDB
- Optimize queries
- Handle backups
- Monitor performance

**Critical Knowledge**:
1. **MongoDB 4.4+** - Database
2. **Mongoose** - ODM
3. **Indexing** - Performance optimization
4. **Aggregation** - Complex queries

**Key Information**:
- **Database**: MongoDB (VPS local or Atlas)
- **Total Models**: 31 schemas
- **Critical Models**: Email, User, UserEmail
- **Indexes**: Properly defined on all models

**Performance Metrics**:
- Query times: Not measured
- Database size: Not measured
- Index usage: Not measured

**Backup Strategy**:
- **Current**: None (CRITICAL GAP)
- **Recommended**: Daily automated backups
- **Tool**: mongodump + cron + S3

**MongoDB Commands**:
```bash
# Connect
mongosh "mongodb://..."

# Backup
mongodump --uri="..." --out=/backups/

# Restore
mongorestore --uri="..." /backups/

# Check indexes
db.emails.getIndexes()

# Profile queries
db.setProfilingLevel(2)
db.system.profile.find().sort({millis: -1}).limit(10)
```

**Gotchas**:
- Email credentials encrypted in UserEmail model
- Soft deletes used (isDeleted flag)
- Large Email collection (needs monitoring)
- No backup strategy (CRITICAL)

---

## Project Handoff Checklist

### For Human Developers

**Week 1: Onboarding**
- [ ] Read all documentation in `.agent-workspace/shared-context/`
- [ ] Setup local development environment
- [ ] Run frontend and backend locally
- [ ] Test email system with IMAP account
- [ ] Review code quality assessment
- [ ] Understand technical debt priorities

**Week 2: First Contribution**
- [ ] Pick a small task from technical debt
- [ implement solution
- [ ] Write tests for your changes
- [ ] Submit pull request
- [ ] Get code review

**Week 3: Independent Work**
- [ ] Work on feature or bug fix
- [ ] Write comprehensive tests
- [ ] Document your changes
- [ ] Deploy to staging
- [ ] Monitor production

### For AI Agents

**Immediate Actions**:
- [ ] Read `onboarding-summary.md`
- [ ] Study domain-specific documentation
- [ ] Review current code structure
- [ ] Understand critical systems (email!)
- [ ] Check technical debt priorities

**Before Making Changes**:
- [ ] Confirm you understand the architecture
- [ ] Identify files you'll modify
- [ ] Consider impact on email system
- [ ] Plan testing approach
- [ ] Estimate effort

**After Making Changes**:
- [ ] Test thoroughly (email system especially)
- [ ] Update documentation if needed
- [ ] Run linters
- [ ] Check for breaking changes
- [ ] Document what you changed

---

## Critical Reminders

### 1. Email System is PRODUCTION-CRITICAL

**The email system (CWD startup) is NOT optional.** It has been fully tested and is production-ready.

**Before touching email system code**:
- Understand IMAP protocol
- Test with real IMAP account
- Study imapWatcher.js (342 lines)
- Have rollback plan ready
- Test Socket.IO events

**Email System Files**:
- `/backend/src/services/imapWatcher.js` - DON'T BREAK THIS
- `/backend/src/controllers/emailController.js` - Test thoroughly
- `/backend/src/models/Email.js` - Understand schema
- `/backend/src/models/UserEmail.js` - Encrypted credentials

### 2. No Automated Tests

**Current test coverage: 0%**

This means:
- Every deployment is risky
- Refactoring is dangerous
- Regressions are likely
- YOU MUST WRITE TESTS for any changes

**Priority**: Write tests before adding features

### 3. No Automated Backups

**Current backup strategy: None**

**Risk**: Catastrophic data loss

**Immediate Action Required**: Setup automated backups (see technical-debt-analysis.md)

### 4. Manual Deployment

**Current deployment: Manual (SSH + PM2 restart)**

**Risk**: Human error, slow deployments

**Solution**: Implement CI/CD pipeline (see technical-debt-analysis.md)

---

## Communication Channels

### For Questions

**Technical Questions**:
- Consult documentation in `.agent-workspace/shared-context/`
- Check `DEPLOYMENT.md` for deployment issues
- Review `api-documentation.md` for API questions

**Critical Issues**:
- Email system failures → IMMEDIATE ATTENTION
- Database issues → IMMEDIATE ATTENTION
- Security vulnerabilities → IMMEDIATE ATTENTION
- Production downtime → IMMEDIATE ATTENTION

### For Collaboration

**Git Workflow**:
- Branch: `main` (production)
- Create feature branches
- Pull requests for review
- Test before merge

**Code Review**:
- Check for breaking changes
- Verify email system not affected
- Ensure tests added
- Validate documentation updated

---

## Success Criteria

### For New Agents

**You are successfully onboarded when**:
- [ ] You understand the project architecture
- [ ] You can run the project locally
- [ ] You have made a successful change
- [ ] You understand the email system
- [ ] You know the critical files
- [ ] You can troubleshoot issues
- [ ] You have read all documentation

### For Project Success

**The project is healthy when**:
- [ ] Test coverage > 80%
- [ ] Automated backups in place
- [ ] CI/CD pipeline active
- [ ] Error tracking configured
- [ ] Monitoring dashboards live
- [ ] Technical debt <5 items
- [ ] Email system stable

---

## Resources

### Documentation
- `.agent-workspace/shared-context/onboarding-summary.md` - START HERE
- `.agent-workspace/shared-context/reverse-engineered-architecture.md`
- `.agent-workspace/shared-context/tech-stack-inventory.md`
- `.agent-workspace/shared-context/api-documentation.md`
- `.agent-workspace/shared-context/email-system-documentation.md`
- `.agent-workspace/shared-context/data-model-documentation.md`
- `.agent-workspace/artifacts/onboarding/code-quality-assessment.md`
- `.agent-workspace/artifacts/onboarding/technical-debt-analysis.md`

### External Documentation
- React 19: https://react.dev
- Express.js: https://expressjs.com
- Socket.IO: https://socket.io
- Mongoose: https://mongoosejs.com
- MongoDB: https://mongodb.com/docs
- IMAP: https://imapwiki.com/IMAP

### Tools
- PM2: https://pm2.keymetrics.io
- Nginx: https://nginx.org/en/docs
- Jest: https://jestjs.io
- Cypress: https://cypress.io
- Sentry: https://sentry.io

---

## Emergency Contacts

**Production Issues**:
- VPS: ssh root@69.164.244.165
- PM2: `pm2 restart ementech-backend`
- Nginx: `systemctl reload nginx`
- MongoDB: `systemctl restart mongod`

**Critical Commands**:
```bash
# Check if backend is running
pm2 list

# Restart backend
pm2 restart ementech-backend

# Check logs
pm2 logs ementech-backend --lines 100

# Check nginx
systemctl status nginx

# Health check
curl https://ementech.co.ke/api/health
```

---

## Conclusion

This handoff package provides **complete project documentation** for the Ementech website. All critical systems have been documented, especially the production-grade email system (CWD startup).

**Key Points**:
1. Email system is PRODUCTION-CRITICAL
2. Zero test coverage - ADD TESTS
3. No automated backups - SETUP NOW
4. Manual deployment - IMPLEMENT CI/CD
5. Quality is 7.5/10 - ROOM TO IMPROVE

**Next Steps**:
1. Read `onboarding-summary.md`
2. Study your domain-specific documentation
3. Setup local development environment
4. Review technical debt priorities
5. Start contributing!

**Good luck! 🚀**

---

**Handoff Version**: 1.0.0
**Created**: 2026-01-21
**Status**: Ready for Handoff
