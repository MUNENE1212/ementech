# Quick Reference: Multi-Project Deployment

**Last Updated:** 2026-01-18
**Status:** Planning Phase - Awaiting Approval

---

## Project Overview at a Glance

### Two Projects, One VPS

| Project | Type | Domain | Status | Priority |
|---------|------|--------|--------|----------|
| **ementech-website** | React Corporate Site | ementech.co.ke, www.ementech.co.ke | Needs Routing Conversion | Medium |
| **dumuwaks** | MERN Full-Stack | app.ementech.co.ke (fe), api.ementech.co.ke (be) | Backend Running (port 5000) | High |

### Current State

**Ready to Deploy:**
- ✅ All research complete (6 comprehensive guides, 50+ sources)
- ✅ Backend running successfully (localhost:5000)
- ✅ Tech stacks finalized
- ✅ Execution plan created

**Needs Work:**
- ⏳ ementech-website: Convert SPA to multipage with React Router v7
- ⏳ dumuwaks: Frontend build and backend deployment to VPS
- ⏳ Infrastructure: VPS setup, DNS, SSL, Nginx

---

## Recommended Execution Strategy

### **Parallel Preparation, Sequential Deployment**

```
Step 1: Start Phase 1 NOW (Local Prep)
  ├─ ementech-website: Add routing, create pages, build
  ├─ dumuwaks frontend: Config API, test, build
  └─ Configs: Create .env templates, PM2 configs, Nginx configs

Step 2: VPS Setup & DNS (While Phase 1 builds run)
  ├─ Get VPS IP
  ├─ Install Node.js, MongoDB, Nginx, PM2
  ├─ Configure DNS (ementech.co.ke, app, api, www)
  └─ Wait for DNS propagation (24-48h)

Step 3: Deploy dumuwaks First (Leverage Running Backend)
  ├─ Deploy backend to api.ementech.co.ke
  ├─ Test API and Socket.IO
  ├─ Deploy frontend to app.ementech.co.ke
  └─ Test full-stack integration

Step 4: Deploy ementech-website
  ├─ Deploy build to ementech.co.ke
  ├─ Test all pages and routing
  └─ Test contact form

Step 5: Configure Nginx Reverse Proxy
  ├─ ementech.co.ke → React build
  ├─ app.ementech.co.ke → dumuwaks frontend
  ├─ api.ementech.co.ke → dumuwaks backend (port 5001)
  └─ Configure SSL for all domains

Step 6: Production Testing
  ├─ Test all domains via HTTPS
  ├─ Test routing, forms, real-time features
  ├─ Security testing (HTTPS, firewall, headers)
  └─ Performance testing (load times, API response)

Step 7: Documentation & Handoff
  ├─ Create deployment runbook
  ├─ Document all configurations
  └─ Final stakeholder review
```

---

## Decision Matrix

### Decision 1: Start Phase 1 Immediately?

**YES** - Begin local preparation without waiting for full approval

**Why:**
- Saves 8-12 hours
- Zero risk (only local work)
- Builds will be ready when VPS is ready
- Can always pivot if plan changes

### Decision 2: Deployment Order?

**dumuwaks First** (recommended)

**Why:**
- Backend already running (huge advantage)
- Validates full MERN stack pipeline
- Completes complex project first
- Lessons learned simplify ementech-website deployment

### Decision 3: Testing Approach?

**Test on Production** (not staging)

**Why:**
- New deployments (no existing users)
- Faster overall timeline
- Production testing = real-world testing
- Can deploy during low-traffic hours

---

## Agent Assignments

| Phase | Agent | Duration | Key Tasks |
|-------|-------|----------|-----------|
| **Phase 0** | Project Director | 2-4h | Create plan, get approval |
| **Phase 1** | General-Purpose | 8-12h | Local prep (3 parallel tracks) |
| **Phase 2** | Deployment-Ops | 3-4h | VPS setup (Node, MongoDB, Nginx) |
| **Phase 3** | Deployment-Ops | 4-6h + 24-48h DNS | DNS config, SSL certificates |
| **Phase 4** | Deployment-Ops | 4-6h | Deploy all applications |
| **Phase 5** | Deployment-Ops | 2-3h | Configure Nginx reverse proxy |
| **Phase 6** | Quality-Assurance | 4-6h | Test all functionality |
| **Phase 7** | Project Director | 2-3h | Documentation and handoff |

---

## Critical Path

**Total Timeline: 5-6 days**

```
Day 1: Phase 0-1 (Planning + Local Prep)
Day 2: Phase 2-3 (VPS Setup + DNS Start)
Day 3-4: Wait for DNS Propagation (can continue prep)
Day 4: Phase 4-5 (Deployment + Nginx)
Day 5: Phase 6 (Testing)
Day 5-6: Phase 7 (Documentation)
```

**Bottleneck:** DNS propagation (24-48 hours) - UNAVOIDABLE

**Optimization:** Phase 1 runs during DNS wait, reducing perceived delay

---

## Success Criteria (Quick Check)

### Phase 1 (Local Prep)
- [ ] ementech-website has 5 pages with working routing
- [ ] dumuwaks frontend builds without errors
- [ ] All configuration files created (.env, PM2, Nginx)
- [ ] Production builds tested locally

### Phase 2-3 (Infrastructure)
- [ ] VPS accessible via SSH
- [ ] Node.js 18+, MongoDB, Nginx, PM2 installed
- [ ] DNS propagated (ementech.co.ke, app, api, www)
- [ ] SSL certificates valid for all domains

### Phase 4-5 (Deployment)
- [ ] dumuwaks backend running on api.ementech.co.ke
- [ ] dumuwaks frontend running on app.ementech.co.ke
- [ ] ementech-website running on ementech.co.ke
- [ ] All domains accessible via HTTPS
- [ ] Nginx reverse proxy working

### Phase 6 (Testing)
- [ ] All pages load without errors
- [ ] Routing works (no 404s on refresh)
- [ ] API calls working (dumuwaks)
- [ ] Socket.IO connection working (dumuwaks)
- [ ] Contact form working (ementech-website)
- [ ] Security verified (HTTPS, firewall, headers)
- [ ] Performance acceptable (< 3s page loads)

### Phase 7 (Handoff)
- [ ] Deployment runbook complete
- [ ] All credentials documented
- [ ] Troubleshooting guide created
- [ ] Stakeholder sign-off obtained

---

## Risk Management

### High-Risk Items (Mitigation Planned)

**1. DNS Propagation Delay**
- **Risk:** Blocks SSL generation
- **Mitigation:** Use local hosts file for testing
- **Impact:** Low (managed delay)

**2. dumuwaks Backend Deployment**
- **Risk:** Frontend cannot test without backend
- **Mitigation:** Backend already running locally
- **Impact:** Medium (well-understood risk)

**3. SSL Certificate Issues**
- **Risk:** Cannot enable HTTPS
- **Mitigation:** Use Certbot (proven tool)
- **Impact:** Low (standard procedure)

### Medium-Risk Items

**4. React Router v7 Configuration**
- **Risk:** Pages won't route correctly
- **Mitigation:** Test locally before deployment
- **Impact:** Medium (newer version, but well-documented)

**5. Environment Variable Mismatches**
- **Risk:** Applications fail to start
- **Mitigation:** Use .env.production templates
- **Impact:** Medium (common issue, easily fixed)

### Low-Risk Items

**6. Nginx Configuration**
- **Risk:** Reverse proxy misconfiguration
- **Mitigation:** Test with nginx -t before reload
- **Impact:** Low (standard deployment practice)

---

## File Locations

### Local Development
```bash
ementech-website:  /media/munen/muneneENT/ementech/ementech-website
dumuwaks backend:  /media/munen/muneneENT/PLP/MERN/Proj/backend
dumuwaks frontend: /media/munen/muneneENT/PLP/MERN/Proj/frontend
```

### VPS Production (To Be Created)
```bash
ementech-website:  /var/www/ementech.co.ke/public
dumuwaks frontend: /var/www/app.ementech.co.ke/public
dumuwaks backend:  /var/www/api.ementech.co.ke/current
```

### Agent Workspace
```bash
Workspace: /media/munen/muneneENT/ementech/ementech-website/.agent-workspace
├── config/project-manifest.json (project state)
├── shared-context/ (all documentation)
├── handoffs/ (agent-to-agent messages)
└── logs/ (activity tracking)
```

---

## Quick Commands

### Local Testing
```bash
# ementech-website
cd /media/munen/muneneENT/ementech/ementech-website
npm run dev          # Development server
npm run build        # Production build

# dumuwaks backend (currently running)
cd /media/munen/muneneENT/PLP/MERN/Proj/backend
npm start            # Production server (port 5000)
npm run dev          # Development with nodemon

# dumuwaks frontend
cd /media/munen/muneneENT/PLP/MERN/Proj/frontend
npm run dev          # Development server
npm run build        # Production build
```

### VPS Deployment (When Ready)
```bash
# SSH to VPS
ssh root@your-vps-ip

# Check PM2 status
pm2 list
pm2 logs dumuwaks-backend

# Restart services
pm2 restart all
pm2 reload all

# Check Nginx
nginx -t                    # Test configuration
systemctl restart nginx     # Restart Nginx

# Check DNS
nslookup ementech.co.ke
dig api.ementech.co.ke
```

---

## Key Contacts & Stakeholders

**Project Director:** Claude Code (Orchestrator)
**Specialized Agents:**
- General-Purpose Agent (Development tasks)
- Deployment-Ops-Agent (VPS and infrastructure)
- Quality-Assurance-Agent (Testing and verification)
- Debugging-Agent (If issues arise)

**Human Stakeholder:** [You - Need approval to proceed]

---

## Next Actions

**Immediate (Can Start Now):**
1. Review orchestration execution plan
2. Approve recommended strategy
3. Authorize Phase 1 start (local preparation)

**After Approval:**
1. General-Purpose Agent begins Phase 1 (3 parallel tracks)
2. Track A: ementech-website routing conversion
3. Track B: dumuwaks frontend configuration
4. Track C: Configuration files creation

**Future (After Phase 1 Complete):**
1. Deployment-Ops-Agent handles VPS setup
2. Deploy applications sequentially
3. Configure Nginx reverse proxy
4. Quality-Assurance-Agent tests everything
5. Project Director creates documentation

---

## FAQs

**Q: Why dumuwaks first when it's more complex?**
A: Backend is already running. We should capitalize on this advantage and validate the full stack pipeline. Lessons learned will make ementech-website deployment trivial.

**Q: Can we start Phase 1 before full plan approval?**
A: YES - Phase 1 is all local work with zero risk. Starting now saves 8-12 hours.

**Q: What if DNS propagation takes longer than 48 hours?**
A: Use local hosts file to continue testing. DNS propagation typically completes within 24-48 hours.

**Q: Do we need a staging environment?**
A: Not recommended. These are new deployments with no existing users. Test directly on production during low-traffic hours.

**Q: What's the biggest risk?**
A: DNS propagation is the biggest bottleneck (24-48 hours), but this is unavoidable and expected.

**Q: Can we deploy both projects simultaneously?**
A: Not recommended. Sequential deployment reduces complexity and makes troubleshooting easier.

**Q: How do we handle SSL certificates?**
A: Use Certbot for Let's Encrypt. It's automated, free, and battle-tested.

**Q: What if something goes wrong during deployment?**
A: Each deployment phase includes testing checkpoints. Issues are caught early. PM2 provides auto-restart. Nginx can be rolled back.

---

## Summary

**This deployment is well-planned with manageable risks.**

- ✅ Research complete (6 guides, 50+ sources)
- ✅ Backend running (head start on dumuwaks)
- ✅ Clear strategy (parallel prep, sequential deploy)
- ✅ Realistic timeline (5-6 days)
- ✅ Expert agents assigned to each phase
- ✅ Comprehensive testing planned

**Recommended Action:** Approve plan and begin Phase 1 immediately.

**Expected Outcome:** Two production-ready applications deployed to ementech.co.ke domain with full SSL, security, and monitoring.

**Success Rate:** High (95%+ confidence)
