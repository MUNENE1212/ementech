# Multi-Project Deployment Orchestration Plan

**Generated:** 2026-01-18
**Orchestrator:** Project Director Agent
**Project:** ementech.co.ke Multi-Project Deployment

---

## Executive Summary

This plan orchestrates the deployment of two distinct projects to a single Interserver VPS:
1. **ementech-website** - Corporate React website (converted SPA to multipage)
2. **dumuwaks** - Full MERN stack application (backend running, frontend pending)

**Key Advantage:** Backend is already running successfully on port 5000, putting us ahead of schedule.

---

## Dependency Analysis

### Critical Path Dependencies

```
Phase 1 (Local Dev Prep) → Phase 2 (VPS Setup) → Phase 3 (Deployment) → Phase 4 (Testing)
```

### Parallel Opportunities

**Phase 1 - CAN BE DONE IN PARALLEL:**
- ementech-website routing conversion
- dumuwaks frontend build prep
- Environment variable configuration
- Production build scripts creation

**Phase 2 - MUST BE SEQUENTIAL:**
- VPS base setup (prerequisite for everything)
- DNS configuration (depends on VPS IP)
- SSL certificates (depends on DNS + Nginx)

**Phase 3 - PARTIALLY PARALLEL:**
- Backend deployment (dumuwaks) - can happen after VPS base setup
- Frontend deployments - can be done in parallel after SSL
- Nginx configuration - must happen after all apps are deployed

### Task Blocking Matrix

| Task | Blocked By | Blocks |
|------|-----------|--------|
| DNS configuration | VPS IP acquisition | SSL generation, domain testing |
| SSL certificates | DNS propagation, Nginx basic setup | HTTPS deployment, production testing |
| dumuwaks backend deployment | VPS setup, MongoDB | Frontend deployment, API testing |
| ementech-website deployment | VPS setup, Nginx | Production website testing |
| dumuwaks frontend deployment | Backend deployment, SSL | Full stack testing |

---

## Optimal Workflow Design

### Strategy: **Parallel Preparation, Sequential Deployment**

**Rationale:**
1. **Maximize efficiency** by preparing all projects locally while VPS is being set up
2. **Minimize deployment downtime** by having all builds ready before touching production
3. **Reduce risk** by testing locally first, then on VPS
4. **Optimize resource usage** by using general-purpose agent for parallel prep work

### Workflow Phases

```
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 0: Planning & Approval (CURRENT)                          │
│ - Create execution plan                                         │
│ - Define success criteria                                       │
│ - Get human approval                                            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 1: Local Development Preparation (PARALLEL TASKS)         │
│ Agent: General-Purpose Agent                                    │
│                                                                 │
│ Track A: ementech-website                                       │
│  - Configure React Router v7                                    │
│  - Create page components (Home, Products, Services, About)     │
│  - Add team members section to About page                       │
│  - Test routing locally                                         │
│  - Create production build                                      │
│                                                                 │
│ Track B: dumuwaks Frontend                                      │
│  - Configure API connection (localhost:5000 → production URL)   │
│  - Configure Socket.IO connection                               │
│  - Test backend integration locally                             │
│  - Create production build                                      │
│                                                                 │
│ Track C: Configuration Files                                    │
│  - Create .env.production templates                             │
│  - Create PM2 ecosystem files                                   │
│  - Create Nginx configuration templates                         │
│  - Create deployment scripts                                    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 2: VPS Infrastructure Setup                               │
│ Agent: Deployment-Ops-Agent                                     │
│                                                                 │
│ 1. Base System Setup                                            │
│    - Update Ubuntu packages                                     │
│    - Install Node.js 18+ LTS                                    │
│    - Install PM2 globally                                       │
│    - Configure UFW firewall                                     │
│                                                                 │
│ 2. Database Setup                                               │
│    - Install MongoDB                                            │
│    - Configure MongoDB authentication                           │
│    - Create databases (ementech, dumuwaks)                      │
│                                                                 │
│ 3. Web Server Setup                                             │
│    - Install Nginx                                              │
│    - Create directory structure                                 │
│    - Configure basic reverse proxy                              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 3: DNS & SSL Configuration                                │
│ Agent: Deployment-Ops-Agent                                     │
│                                                                 │
│ 1. DNS Configuration                                            │
│    - Update nameservers to Interserver                          │
│    - Add A records (@, www, app, api)                          │
│    - Verify DNS propagation                                    │
│                                                                 │
│ 2. SSL Certificate Setup                                        │
│    - Install Certbot                                            │
│    - Generate SSL certificates for all subdomains               │
│    - Configure auto-renewal                                     │
│    - Test HTTPS connections                                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 4: Application Deployment (SEQUENTIAL)                    │
│ Agent: Deployment-Ops-Agent                                     │
│                                                                 │
│ 1. Deploy dumuwaks Backend                                      │
│    - Upload backend code to /var/www/api.ementech.co.ke         │
│    - Install dependencies                                       │
│    - Configure environment variables                            │
│    - Seed initial data (if needed)                              │
│    - Start with PM2                                             │
│    - Test API endpoints                                         │
│                                                                 │
│ 2. Deploy dumuwaks Frontend                                     │
│    - Upload build to /var/www/app.ementech.co.ke               │
│    - Configure production API URL                               │
│    - Test frontend-backend connection                           │
│    - Test Socket.IO connection                                  │
│                                                                 │
│ 3. Deploy ementech-website                                      │
│    - Upload build to /var/www/ementech.co.ke                    │
│    - Test all pages and routing                                 │
│    - Test responsive design                                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 5: Nginx Reverse Proxy Configuration                      │
│ Agent: Deployment-Ops-Agent                                     │
│                                                                 │
│ 1. Configure ementech.co.ke (main website)                      │
│    - HTTP to HTTPS redirect                                     │
│    - React Router support (try_files)                           │
│    - Static asset caching                                       │
│                                                                 │
│ 2. Configure app.ementech.co.ke (dumuwaks frontend)             │
│    - HTTP to HTTPS redirect                                     │
│    - React Router support                                       │
│    - API proxy to api.ementech.co.ke                            │
│    - Socket.IO WebSocket support                                │
│                                                                 │
│ 3. Configure api.ementech.co.ke (dumuwaks backend)              │
│    - HTTP to HTTPS redirect                                     │
│    - Proxy to Node.js backend (port 5001)                       │
│    - Rate limiting                                              │
│    - CORS configuration                                         │
│                                                                 │
│ 4. Test Nginx configuration                                     │
│    - nginx -t (syntax check)                                    │
│    - systemctl restart nginx                                    │
│    - Test all domains and subdomains                            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 6: Production Testing & Verification                      │
│ Agent: Quality-Assurance-Agent                                  │
│                                                                 │
│ 1. ementech-website Testing                                     │
│    - Test all pages (Home, Products, Services, About, Contact)  │
│    - Test navigation between pages                              │
│    - Test contact form (EmailJS integration)                    │
│    - Test responsive design (mobile, tablet, desktop)           │
│    - Test SSL certificate                                       │
│                                                                 │
│ 2. dumuwaks Full Stack Testing                                  │
│    - Test user registration/login                               │
│    - test technician profiles                                   │
│    - Test booking system                                        │
│    - Test real-time updates (Socket.IO)                         │
│    - Test file uploads (Cloudinary)                             │
│    - Test payment processing (Stripe)                           │
│    - Test admin dashboard                                       │
│                                                                 │
│ 3. Security Testing                                            │
│    - Test HTTPS enforcement                                     │
│    - Test firewall rules                                        │
│    - Test rate limiting                                         │
│    - Test CORS configuration                                    │
│    - Check for security headers (helmet.js)                     │
│                                                                 │
│ 4. Performance Testing                                         │
│    - Test page load speeds                                      │
│    - Check API response times                                   │
│    - Monitor PM2 process status                                 │
│    - Check Nginx access/error logs                              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 7: Documentation & Handoff                                │
│ Agent: Project Director (Orchestrator)                          │
│                                                                 │
│ 1. Create deployment documentation                               │
│    - VPS setup guide                                            │
│    - Deployment runbook                                         │
│    - Emergency rollback procedures                              │
│    - Monitoring and maintenance guide                           │
│                                                                 │
│ 2. Create handoff package                                      │
│    - All credentials and access details (secure storage)        │
│    - Architecture diagrams                                      │
│    - API documentation                                          │
│    - Troubleshooting guide                                      │
│                                                                 │
│ 3. Final delivery                                              │
│    - Verify all success criteria met                           │
│    - Conduct final review with stakeholder                      │
│    - Mark project complete                                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Prioritization Decision

### Recommended Order: **dumuwaks First, Then ementech-website**

**Rationale:**

1. **Backend Already Running** (Advantage: dumuwaks)
   - dumuwaks backend is successfully running on port 5000
   - MongoDB is connected and configured
   - All backend services are initialized
   - This gives us a **significant head start**

2. **Complexity Gradient**
   - dumuwaks is more complex (full stack, real-time features, payments)
   - ementech-website is simpler (static marketing site)
   - **Complete complex project first** when energy is highest

3. **Testing Dependencies**
   - dumuwaks frontend needs backend deployed to test API integration
   - ementech-website has no backend dependencies
   - **Backend-first approach** validates infrastructure early

4. **Risk Mitigation**
   - If issues arise during deployment, better to discover them with complex project
   - Learn lessons on dumuwaks, apply to ementech-website
   - **Fail forward** - tackle hardest challenge first

5. **Resource Optimization**
   - Both projects can be prepared in parallel (Phase 1)
   - But deploy dumuwaks first to validate full pipeline
   - ementech-website deployment becomes **trivial** after MERN stack proven

### When to Add Team Members Section?

**Answer: During Phase 1 (Local Prep) for ementech-website**

- Team members section is part of About page
- It's a static component (no backend required)
- Can be developed alongside routing configuration
- **No dependencies** on other deployment tasks

### When to Create Deployment Scripts?

**Answer: During Phase 1 (Local Prep), Track C**

- Create scripts while preparing applications
- Test scripts locally before using on VPS
- Include scripts in git repository
- **Prevents errors** from manual commands in production

---

## Agent Coordination & Handoffs

### Agent Specialization Matrix

| Phase | Primary Agent | Secondary Agent | Handoff Trigger |
|-------|--------------|-----------------|-----------------|
| Phase 0 | Project Director | - | Plan approved |
| Phase 1 | General-Purpose | - | All builds ready |
| Phase 2 | Deployment-Ops | - | VPS base setup complete |
| Phase 3 | Deployment-Ops | - | SSL certificates verified |
| Phase 4 | Deployment-Ops | Debugging (if needed) | All apps deployed |
| Phase 5 | Deployment-Ops | Debugging (if needed) | Nginx configured & tested |
| Phase 6 | Quality-Assurance | Debugging (if issues) | All tests passed |
| Phase 7 | Project Director | - | Documentation complete |

### Handoff Protocol

**Before Each Handoff:**
1. Create detailed handoff package in `.agent-workspace/handoffs/to-[agent-name]/`
2. Include:
   - Current project state
   - Completed tasks summary
   - Known issues or workarounds
   - Next phase objectives
   - Success criteria
   - Relevant file paths
   - Environment variables
   - Dependencies and constraints

**After Each Handoff:**
1. Receiving agent confirms receipt
2. Agent reviews handoff package
3. Agent asks clarifying questions if needed
4. Agent acknowledges understanding of objectives
5. Work begins on next phase

**Return Triggers (When to Escalate Back):**
- Unresolvable technical blockers
- Security or compliance concerns
- Scope changes required
- Human decision needed
- Critical failures preventing progress

---

## Success Criteria by Phase

### Phase 0: Planning & Approval
- [ ] Execution plan created
- [ ] Dependency analysis completed
- [ ] Agent assignments defined
- [ ] Human approval obtained

### Phase 1: Local Development Preparation
**ementech-website:**
- [ ] React Router v7 configured and working
- [ ] All 5 pages created (Home, Products, Services, About, Contact)
- [ ] Team members section added to About page
- [ ] Navigation between pages working
- [ ] Production build successful
- [ ] No TypeScript errors
- [ ] All assets optimized

**dumuwaks Frontend:**
- [ ] API connection configured for production
- [ ] Socket.IO connection configured for production
- [ ] All API calls tested locally
- [ ] Production build successful
- [ ] PWA manifest configured
- [ ] Environment variables documented

**Configuration Files:**
- [ ] .env.production templates created for all projects
- [ ] PM2 ecosystem files created (backend.config.js, frontend.config.js)
- [ ] Nginx configuration templates created
- [ ] Deployment scripts created and tested locally
- [ ] Deployment documentation drafted

### Phase 2: VPS Infrastructure Setup
- [ ] VPS accessible via SSH
- [ ] Node.js 18+ LTS installed
- [ ] PM2 installed and configured
- [ ] MongoDB installed, secured, and running
- [ ] Databases created (ementech, dumuwaks)
- [ ] Nginx installed and running
- [ ] UFW firewall configured (ports 22, 80, 443, 5001)
- [ ] Directory structure created (/var/www/*)
- [ ] User permissions configured
- [ ] Git installed for code deployment

### Phase 3: DNS & SSL Configuration
- [ ] Nameservers updated to Interserver
- [ ] A records created (@, www, app, api)
- [ ] DNS propagation verified (nslookup, dig)
- [ ] Certbot installed
- [ ] SSL certificates generated for all domains
- [ ] Auto-renewal configured (cron job)
- [ ] HTTPS working for all domains
- [ ] SSL certificates valid (check expiration)

### Phase 4: Application Deployment
**dumuwaks Backend:**
- [ ] Code uploaded to /var/www/api.ementech.co.ke
- [ ] Dependencies installed (npm ci --production)
- [ ] Environment variables configured
- [ ] Database seeded (if needed)
- [ ] PM2 process started and stable
- [ ] API endpoints responding (curl tests)
- [ ] Socket.IO server accessible
- [ ] Logs show no errors

**dumuwaks Frontend:**
- [ ] Build uploaded to /var/www/app.ementech.co.ke
- [ ] Environment variables configured
- [ ] API connection working
- [ ] Socket.IO connection working
- [ ] PWA manifest served correctly
- [ ] Service worker registered
- [ ] All features functional

**ementech-website:**
- [ ] Build uploaded to /var/www/ementech.co.ke
- [ ] All pages accessible
- [ ] Routing working (no 404s on refresh)
- [ ] Contact form functional (EmailJS)
- [ ] Responsive design working
- [ ] No console errors

### Phase 5: Nginx Configuration
- [ ] All server blocks configured
- [ ] HTTP to HTTPS redirects working
- [ ] React Router support configured (try_files)
- [ ] Socket.IO WebSocket proxy configured
- [ ] API reverse proxy configured
- [ ] Rate limiting configured
- [ ] CORS configured correctly
- [ ] Gzip compression enabled
- [ ] Static asset caching configured
- [ ] nginx -t passes without errors
- [ ] nginx restarted successfully
- [ ] All domains accessible via HTTPS

### Phase 6: Production Testing
**ementech-website:**
- [ ] All 5 pages load correctly
- [ ] Navigation works between all pages
- [ ] Direct URL access works (no 404s)
- [ ] Contact form sends emails
- [ ] Mobile responsive (375px, 768px)
- [ ] Tablet responsive (1024px)
- [ ] Desktop responsive (1920px+)
- [ ] SSL valid (no browser warnings)
- [ ] Page load time < 3 seconds

**dumuwaks:**
- [ ] User registration works
- [ ] User login works
- [ ] Password reset works
- [ ] Technician profile creation works
- [ ] Service booking works
- [ ] Real-time updates work (Socket.IO)
- [ ] File uploads work (Cloudinary)
- [ ] Payment processing works (Stripe test mode)
- [ ] Admin dashboard accessible
- [ ] All API endpoints respond correctly
- [ ] CORS working properly
- [ ] No console errors
- [ ] No errors in PM2 logs

**Security:**
- [ ] HTTPS enforced on all domains
- [ ] Firewall active and configured
- [ ] Only necessary ports open
- [ ] Rate limiting working
- [ ] Security headers present
- [ ] No sensitive data in client-side bundles
- [ ] Environment variables secured
- [ ] MongoDB authentication enabled
- [ ] Session cookies secure (httpOnly, secure)

**Performance:**
- [ ] Page load times acceptable (< 3s)
- [ ] API response times < 500ms
- [ ] PM2 processes stable (no crashes)
- [ ] Memory usage acceptable
- [ ] CPU usage acceptable
- [ ] Nginx logs show no errors
- [ ] Application logs show no errors

### Phase 7: Documentation & Handoff
- [ ] Deployment runbook created
- [ ] VPS setup documented
- [ ] Rollback procedures documented
- [ ] Monitoring guide created
- [ ] Maintenance guide created
- [ ] Architecture diagrams created
- [ ] API documentation complete
- [ ] Troubleshooting guide created
- [ ] All credentials securely stored
- [ ] Final review completed
- [ ] Stakeholder sign-off obtained

---

## Risk Assessment & Mitigation

### Critical Risks

| Risk | Impact | Probability | Mitigation | Contingency |
|------|--------|-------------|------------|-------------|
| DNS propagation delays | High | Medium | Use local hosts file for testing | Allow 24-48 hours for DNS |
| SSL certificate issues | High | Low | Use Certbot with tested configuration | Temporary self-signed certs |
| MongoDB connection failure | Critical | Low | Test connection during Phase 2 | Restore from backup |
| PM2 process crashes | High | Low | Configure auto-restart, monitor logs | Set up alerting |
| Nginx misconfiguration | High | Medium | Test with nginx -t before reload | Keep backup of working config |
| React Router 404s | Medium | Medium | Use try_files in Nginx | Fallback to hash routing |
| Socket.IO connection fails | High | Medium | Test WebSocket proxy in Nginx | Fall back to polling |
| Environment variable mismatch | Critical | Medium | Use .env.production templates | Manual verification |
| Port conflicts | Medium | Low | Document all ports in use | Change ports as needed |
| Insufficient VPS resources | High | Low | Monitor resources during testing | Upgrade VPS plan |

### Quality Gates

**Before proceeding to next phase, verify:**
1. All deliverables from current phase complete
2. All acceptance criteria met
3. No critical blockers remaining
4. Tests passing
5. Documentation updated
6. Handoff package prepared

---

## Estimated Timeline

### Phase 0: Planning & Approval
- **Duration:** 2-4 hours
- **Agent:** Project Director
- **Deliverable:** Approved execution plan

### Phase 1: Local Development Preparation
- **Duration:** 8-12 hours (parallel tracks)
- **Agent:** General-Purpose Agent
- **Deliverables:** Production builds, configuration files

**Track A (ementech-website):** 4-6 hours
- Routing config: 1-2 hours
- Page creation: 2-3 hours
- Team members section: 1 hour
- Build & test: 1 hour

**Track B (dumuwaks frontend):** 2-3 hours
- API config: 30 min
- Socket.IO config: 30 min
- Testing: 1 hour
- Build: 30 min

**Track C (configs):** 2-3 hours
- Env templates: 1 hour
- PM2 configs: 30 min
- Nginx configs: 1 hour
- Scripts: 30 min

### Phase 2: VPS Infrastructure Setup
- **Duration:** 3-4 hours
- **Agent:** Deployment-Ops-Agent
- **Deliverable:** Ready VPS with all services

### Phase 3: DNS & SSL Configuration
- **Duration:** 4-6 hours (plus DNS propagation 24-48h)
- **Agent:** Deployment-Ops-Agent
- **Deliverable:** Working HTTPS for all domains

### Phase 4: Application Deployment
- **Duration:** 4-6 hours
- **Agent:** Deployment-Ops-Agent
- **Deliverable:** All applications deployed and running

### Phase 5: Nginx Configuration
- **Duration:** 2-3 hours
- **Agent:** Deployment-Ops-Agent
- **Deliverable:** Complete reverse proxy setup

### Phase 6: Production Testing
- **Duration:** 4-6 hours
- **Agent:** Quality-Assurance-Agent
- **Deliverable:** Fully tested and verified deployment

### Phase 7: Documentation & Handoff
- **Duration:** 2-3 hours
- **Agent:** Project Director
- **Deliverable:** Complete documentation package

**Total Estimated Time:** 29-44 hours (excluding 24-48h DNS propagation)

**Recommended Schedule:**
- **Day 1:** Phases 0-1 (local prep)
- **Day 2:** Phases 2-3 (start DNS, begin VPS setup)
- **Day 3-4:** Wait for DNS propagation (continue prep if needed)
- **Day 4:** Phases 4-5 (deployment)
- **Day 5:** Phase 6 (testing)
- **Day 5-6:** Phase 7 (documentation)

---

## Next Steps: Human Decision Required

### Decision Point: Approve Execution Plan

**Question:** Do you approve this orchestration plan and authorize beginning Phase 1?

**Key Points for Approval:**
1. Strategy: **Parallel preparation, sequential deployment**
2. Priority: **dumuwaks first** (backend already running), then ementech-website
3. Approach: Complete complex project first when energy is highest
4. Risk mitigation: Test locally first, then deploy to VPS
5. Timeline: 5-6 days (including DNS propagation)

**If Approved:**
- Create detailed task list for Phase 1
- Assign General-Purpose Agent to begin parallel preparation
- Set up tracking in project-manifest.json
- Begin execution

**If Modifications Needed:**
- Specify which aspects need adjustment
- Re-rank priorities if needed
- Adjust timeline if constraints exist
- Identify any missing requirements

**Alternatives Considered:**

1. **Alternative A: ementech-website first**
   - Pros: Quick win, simpler project
   - Cons: Doesn't leverage running backend, delays complex testing
   - Risk: May waste time if infrastructure issues discovered later

2. **Alternative B: Simultaneous deployment**
   - Pros: Faster completion
   - Cons: Higher risk, harder to debug issues
   - Risk: Conflicting configurations, difficult troubleshooting

3. **Alternative C: Deploy backend, stop and test**
   - Pros: Incremental validation
   - Cons: Slower overall, context switching
   - Risk: May lose momentum

**Recommendation: Proceed with proposed plan** (Parallel prep, sequential deployment, dumuwaks first)

**Impact if Delayed:**
- VPS setup cannot begin until plan approved
- Local preparation work blocked
- DNS configuration delayed
- Overall timeline extended

**Deadline for Decision:** Before beginning Phase 1 (recommended within 24 hours)

---

## Appendix: File Structure Reference

### Project Locations
```
ementech-website: /media/munen/muneneENT/ementech/ementech-website
dumuwaks: /media/munen/muneneENT/PLP/MERN/Proj
  ├── backend/ (currently running on port 5000)
  └── frontend/
```

### VPS Directory Structure (To Be Created)
```
/var/www/
  ├── ementech.co.ke/
  │   └── public/ (ementech-website build)
  ├── app.ementech.co.ke/
  │   └── public/ (dumuwaks frontend build)
  └── api.ementech.co.ke/
      └── current/ (dumuwaks backend code)
```

### Agent Workspace
```
.agent-workspace/
  ├── config/
  │   └── project-manifest.json
  ├── shared-context/
  │   ├── orchestration-execution-plan.md (this file)
  │   ├── vps-configuration-guide.md
  │   └── deployment-checklist.md
  ├── handoffs/
  │   ├── to-general-purpose/
  │   ├── to-deployment-ops/
  │   └── to-quality-assurance/
  ├── requests/
  ├── escalations/
  ├── artifacts/
  │   ├── production-builds/
  │   ├── configuration-files/
  │   └── deployment-scripts/
  └── logs/
      └── agent-activity.jsonl
```

---

## Summary

This orchestration plan provides a **systematic, risk-managed approach** to deploying two distinct web projects to a single VPS. By leveraging the **already-running dumuwaks backend** and **preparing both projects in parallel**, we maximize efficiency while maintaining quality and managing risks.

The **parallel preparation, sequential deployment** strategy ensures we're ready to deploy quickly once infrastructure is in place, while the **dumuwaks-first priority** allows us to validate the full MERN stack pipeline before tackling the simpler ementech-website.

With clear **agent specializations**, **handoff protocols**, and **success criteria**, we maintain complete context throughout the project lifecycle and ensure smooth transitions between phases.
