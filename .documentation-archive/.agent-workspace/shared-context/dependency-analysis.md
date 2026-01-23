# Dependency Analysis & Task Matrix

**Generated:** 2026-01-18
**Project:** ementech.co.ke Multi-Project Deployment

---

## Task Dependency Graph

```
┌─────────────────────────────────────────────────────────────────────┐
│                         PHASE 0: Planning                           │
│  [Approve Execution Plan] → All tasks blocked                       │
└─────────────────────────────────────────────────────────────────────┘
                                   ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    PHASE 1: Local Prep (PARALLEL)                   │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │ Track A:         │  │ Track B:         │  │ Track C:         │  │
│  │ ementech-site    │  │ dumuwaks-fe      │  │ Configs          │  │
│  │                  │  │                  │  │                  │  │
│  │ 1. Router setup  │  │ 1. API config    │  │ 1. .env templates│  │
│  │ 2. Page creation │  │ 2. Socket config │  │ 2. PM2 configs   │  │
│  │ 3. Team section  │  │ 3. Build prep    │  │ 3. Nginx configs │  │
│  │ 4. Build         │  │ 4. Build         │  │ 4. Deploy scripts│  │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘  │
│         ↓                      ↓                      ↓             │
└─────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│                      PHASE 2: VPS Setup (SEQUENTIAL)                │
│                                                                      │
│  [Get VPS IP] → [System Setup] → [MongoDB Setup] → [Nginx Setup]    │
│                                                                      │
│  Blocked by: Phase 0 approval                                       │
│  Blocks: DNS configuration, SSL generation, all deployments         │
└─────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│                      PHASE 3: DNS & SSL (SEQUENTIAL)                │
│                                                                      │
│  [Update Nameservers] → [Add A Records] → [DNS Propagation]         │
│                                                           ↓          │
│  [Install Certbot] ← [Basic Nginx] ← [DNS Verified]                 │
│        ↓                                                             │
│  [Generate SSL Certs] → [Configure Auto-renewal]                    │
│                                                                      │
│  Blocked by: VPS IP, Nginx basic setup                              │
│  Blocks: Production deployment, HTTPS testing                       │
└─────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│                   PHASE 4: App Deployment (SEQUENTIAL)              │
│                                                                      │
│  [Deploy dumuwaks Backend]                                          │
│        ↓                                                             │
│        ├─→ [Upload Code] → [Install Deps] → [Config Env]           │
│        ├─→ [Start PM2] → [Test API] → [Verify Socket.IO]           │
│        ↓                                                             │
│  [Deploy dumuwaks Frontend]                                         │
│        ↓                                                             │
│        ├─→ [Upload Build] → [Config API URL]                        │
│        ├─→ [Test Connection] → [Test Socket.IO]                     │
│        ↓                                                             │
│  [Deploy ementech-website]                                          │
│        ↓                                                             │
│        ├─→ [Upload Build] → [Test Pages] → [Test Routing]          │
│        └─→ [Test Contact Form]                                      │
│                                                                      │
│  Blocked by: SSL certificates, VPS setup                            │
│  Blocks: Nginx reverse proxy configuration                          │
└─────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│                   PHASE 5: Nginx Configuration                      │
│                                                                      │
│  [Config ementech.co.ke] → [Config app.ementech.co.ke]              │
│                                                           ↓          │
│  [Config api.ementech.co.ke] → [Test All Domains]                   │
│                                                                      │
│  Blocked by: All applications deployed                              │
│  Blocks: Production testing                                         │
└─────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│                      PHASE 6: Testing (PARALLEL)                    │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │ ementech-site    │  │ dumuwaks         │  │ Security         │  │
│  │ Testing          │  │ Full Stack Test  │  │ Testing          │  │
│  │                  │  │                  │  │                  │  │
│  │ - Pages          │  │ - Auth           │  │ - HTTPS          │  │
│  │ - Routing        │  │ - Booking        │  │ - Firewall       │  │
│  │ - Contact Form   │  │ - Socket.IO      │  │ - Headers        │  │
│  │ - Responsive     │  │ - Payments       │  │ - CORS           │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘  │
│                                                                      │
│  Blocked by: Nginx configured, all domains accessible               │
│  Blocks: Documentation and handoff                                  │
└─────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│                      PHASE 7: Documentation                          │
│                                                                      │
│  [Create Runbook] → [Create Diagrams] → [Final Review] → [Sign-off]│
│                                                                      │
│  Blocked by: All testing complete                                   │
│  Blocks: Project completion                                          │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Critical Path Analysis

### Longest Path (Critical Path)
```
Phase 0 → Phase 2 → Phase 3 (DNS 24-48h) → Phase 4 → Phase 5 → Phase 6 → Phase 7
Total: 5-6 days (including DNS propagation)
```

### Parallel Opportunities
**Phase 1 can run during:**
- Phase 0 approval waiting period
- Phase 3 DNS propagation period

**Phase 6 testing can be parallelized:**
- ementech-website testing (independent)
- dumuwaks testing (independent)
- Security testing (can overlap with functional testing)

---

## Task-Level Dependencies

### ementech-website Tasks

| Task | ID | Depends On | Blocks | Duration | Can Parallelize? |
|------|----|------------|--------|----------|------------------|
| Configure React Router v7 | E1 | Phase 0 approval | E2, E3 | 1-2h | No |
| Create Home page | E2 | E1 | E4 | 30m | Yes (with Products/Services) |
| Create Products page | E3 | E1 | E4 | 30m | Yes (with Home/Services) |
| Create Services page | E4 | E1 | E7 | 30m | Yes (with Home/Products) |
| Create About page | E5 | E1 | E7 | 30m | Yes (with other pages) |
| Add team members section | E6 | E5 | E7 | 1h | No |
| Create Contact page | E7 | E1 | E8 | 30m | Yes (with other pages) |
| Test routing locally | E8 | E2-E7 | E9 | 1h | No |
| Create production build | E9 | E8 | Deployment | 30m | No |

### dumuwaks Frontend Tasks

| Task | ID | Depends On | Blocks | Duration | Can Parallelize? |
|------|----|------------|--------|----------|------------------|
| Configure API connection | D1 | Phase 0 approval | D3 | 30m | Yes (with Socket config) |
| Configure Socket.IO | D2 | Phase 0 approval | D3 | 30m | Yes (with API config) |
| Test backend integration | D3 | D1, D2 | D4 | 1h | No |
| Create production build | D4 | D3 | Deployment | 30m | Yes (with ementech build) |

### VPS Setup Tasks

| Task | ID | Depends On | Blocks | Duration | Can Parallelize? |
|------|----|------------|--------|----------|------------------|
| Acquire VPS IP | V1 | Phase 0 approval | V2 | 30m | No |
| System update & setup | V2 | V1 | V3 | 1h | No |
| Install Node.js & PM2 | V3 | V2 | V4 | 30m | Yes (with MongoDB) |
| Install MongoDB | V4 | V2 | V5 | 1h | Yes (with Node.js) |
| Install Nginx | V5 | V2 | V6 | 30m | Yes (with other installs) |
| Configure firewall | V6 | V3, V4, V5 | V7 | 30m | No |
| Create directory structure | V7 | V6 | DNS config | 30m | No |

### DNS & SSL Tasks

| Task | ID | Depends On | Blocks | Duration | Can Parallelize? |
|------|----|------------|--------|----------|------------------|
| Update nameservers | N1 | V1 | N2 | 30m | No |
| Add A records | N2 | N1 | N3 | 30m | No |
| Verify DNS propagation | N3 | N2 | N5 | 5-10m | No |
| Install Certbot | N4 | V5 | N5 | 15m | Yes (during propagation) |
| Generate SSL certificates | N5 | N3, N4 | N6 | 30m | No |
| Configure auto-renewal | N6 | N5 | Deployment | 15m | No |

### Deployment Tasks

| Task | ID | Depends On | Blocks | Duration | Can Parallelize? |
|------|----|------------|--------|----------|------------------|
| Upload dumuwaks backend | B1 | N6 | B2 | 30m | No |
| Configure backend env | B2 | B1 | B3 | 30m | No |
| Start backend with PM2 | B3 | B2 | B4 | 15m | No |
| Test backend API | B4 | B3 | F1 | 30m | No |
| Upload dumuwaks frontend | F1 | B4 | F2 | 30m | No |
| Configure frontend env | F2 | F1 | F3 | 15m | No |
| Test frontend-backend | F3 | F2 | E1 | 1h | No |
| Upload ementech-website | E1 | N6 | E2 | 30m | Yes (with F1) |
| Test ementech-website | E2 | E1 | Nginx config | 30m | No |

### Nginx Configuration Tasks

| Task | ID | Depends On | Blocks | Duration | Can Parallelize? |
|------|----|------------|--------|----------|------------------|
| Config ementech.co.ke | NX1 | E2 | NX4 | 1h | Yes (with app config) |
| Config app.ementech.co.ke | NX2 | F3 | NX4 | 1h | Yes (with ementech config) |
| Config api.ementech.co.ke | NX3 | B4 | NX4 | 1h | Yes (with other configs) |
| Test all Nginx configs | NX4 | NX1, NX2, NX3 | Testing | 30m | No |

---

## Resource Optimization Matrix

### Which Tasks Can Run in Parallel?

**During Phase 0 → Phase 1 Transition:**
- ementech-website development
- dumuwaks frontend configuration
- Configuration file creation
- Research review (if needed)

**During Phase 1 (Local Prep):**
- All three tracks (A, B, C) can run simultaneously
- Page creation for ementech-website can be parallelized
- Configuration file creation can be parallelized

**During Phase 2 (VPS Setup):**
- Node.js installation can run alongside MongoDB installation
- Nginx installation can run alongside database setup
- (Must wait for system updates to complete first)

**During Phase 3 (DNS & SSL):**
- Certbot installation can happen during DNS propagation wait
- SSL configuration can be prepared while waiting for propagation

**During Phase 4 (Deployment):**
- ementech-website build upload can run alongside dumuwaks frontend upload
- (Backend must be deployed and tested before frontend deployment)

**During Phase 6 (Testing):**
- ementech-website testing can run alongside dumuwaks testing
- Security testing can overlap with functional testing
- Performance testing can run in parallel

### Which Tasks MUST Run Sequentially?

**Hard Dependencies (No Parallelization Possible):**
1. VPS IP → System setup → All VPS operations
2. Nameserver update → DNS propagation → SSL generation
3. dumuwaks backend deployment → dumuwaks frontend deployment
4. All app deployments → Nginx reverse proxy configuration
5. Nginx configuration → Production testing
6. All testing → Documentation completion

**Soft Dependencies (Can Run with Caution):**
1. Page creation (can parallelize but need consistent routing)
2. Configuration files (can parallelize but must be consistent)
3. Nginx server blocks (can create in parallel but test sequentially)

---

## Bottleneck Analysis

### Primary Bottlenecks

**1. DNS Propagation (24-48 hours)**
- **Impact:** Blocks SSL generation, delays all HTTPS testing
- **Mitigation:** Use local hosts file for initial testing
- **Workaround:** Proceed with HTTP testing while waiting
- **Cannot avoid:** This is a DNS constraint

**2. dumuwaks Backend Deployment**
- **Impact:** Blocks frontend deployment, full-stack testing
- **Mitigation:** Backend already running locally, just redeploy
- **Workaround:** Test frontend locally with production backend URL
- **Time to reduce:** 2-3 hours (well within acceptable range)

**3. Sequential Application Deployment**
- **Impact:** Cannot deploy all apps simultaneously
- **Mitigation:** Optimize deployment scripts
- **Workaround:** Prepare everything in Phase 1
- **Time to reduce:** 4-6 hours (acceptable for production deployment)

### Secondary Bottlenecks

**4. Nginx Configuration**
- **Impact:** Blocks production testing
- **Mitigation:** Prepare templates during Phase 1
- **Workaround:** Test locally with Docker-Nginx
- **Time to reduce:** 2-3 hours

**5. Production Testing**
- **Impact:** Blocks documentation and completion
- **Mitigation:** Parallelize testing tracks
- **Workaround:** Use automated testing tools
- **Time to reduce:** 4-6 hours (already parallelized)

---

## Risk-Based Dependencies

### High-Risk Dependencies (Require Extra Attention)

**1. dumuwaks Backend → dumuwaks Frontend**
- **Risk:** If backend deployment fails, frontend cannot be tested
- **Mitigation:** Test backend thoroughly before proceeding
- **Rollback:** Keep backend running on localhost during deployment
- **Verification:** API health checks, Socket.IO connection test

**2. DNS Propagation → SSL Generation**
- **Risk:** If DNS fails to propagate, SSL cannot be generated
- **Mitigation:** Verify DNS with multiple tools (nslookup, dig, online)
- **Rollback:** Use temporary self-signed certificates
- **Verification:** HTTPS test, certificate validity check

**3. All Apps Deployed → Nginx Configuration**
- **Risk:** If any app fails, Nginx config will be incomplete
- **Mitigation:** Test each app individually before configuring Nginx
- **Rollback:** Comment out problematic server blocks
- **Verification:** nginx -t, curl tests for each domain

### Medium-Risk Dependencies

**4. React Router Configuration → Page Creation**
- **Risk:** If router misconfigured, pages won't work
- **Mitigation:** Test router with simple page first
- **Rollback:** Revert to previous commit
- **Verification:** Manual routing test, no 404s

**5. Environment Variables → Application Start**
- **Risk:** Wrong variables cause runtime errors
- **Mitigation:** Use .env.production templates, double-check values
- **Rollback:** Restore from .env.example
- **Verification:** PM2 logs, application health check

---

## Optimization Recommendations

### Immediate Optimizations

**1. Start Phase 1 NOW (Don't wait for approval)**
- All Phase 1 tasks are independent and can begin immediately
- Saves 8-12 hours in overall timeline
- No risk: if plan changes, only prep work is lost

**2. Prepare All Configuration Files in Phase 1**
- Create Nginx configs, PM2 configs, .env templates during local prep
- Reduces Phase 4-5 deployment time by 50%
- Allows testing configs locally before VPS deployment

**3. Use DNS Propagation Time Effectively**
- Phase 1 work can continue during DNS propagation
- Can prepare deployment scripts, documentation drafts
- Reduces perceived wait time

### Long-term Optimizations

**4. Automate Deployment with Scripts**
- Create bash scripts for each deployment step
- Reduces human error, speeds up deployment
- Enables repeatable deployments

**5. Use PM2 Ecosystem for Process Management**
- Configure auto-restart, logging, monitoring
- Reduces operational overhead
- Improves reliability

**6. Implement CI/CD for Future Deployments**
- GitHub Actions or similar for automated testing
- Automated deployments to staging/production
- Reduces manual work for updates

---

## Decision Points Requiring Human Input

### Decision 1: Approve Parallel Phase 1 Start

**Question:** Should we begin Phase 1 (local preparation) immediately without waiting for full plan approval?

**Pros:**
- Saves 8-12 hours
- No risk involved (only local work)
- Builds will be ready when VPS is ready

**Cons:**
- May do work that gets changed in approved plan
- Could waste effort if priorities change

**Recommendation:** **YES** - Begin Phase 1 immediately

**Reasoning:** Phase 1 tasks are all low-risk and independent. Even if plan changes, having production builds and configuration files ready is valuable.

---

### Decision 2: dumuwaks vs ementech-website Deployment Order

**Question:** Should we deploy dumuwaks first (recommended) or ementech-website first?

**Option A: dumuwaks First (Recommended)**
- Pros: Backend already running, validates full stack, completes complex project first
- Cons: Takes longer to see first live website
- Effort: 4-6 hours for backend + 2-3 hours for frontend
- Risk: Medium (MERN stack has more moving parts)

**Option B: ementech-website First**
- Pros: Quick win, simpler project, faster to see live site
- Cons: Doesn't leverage running backend, delays complex testing
- Effort: 1-2 hours total
- Risk: Low (static site is simple)

**Recommendation:** **Option A - dumuwaks first**

**Reasoning:** The backend is already running successfully. We should capitalize on this advantage and complete the complex full-stack deployment while we have momentum. The lessons learned will make ementech-website deployment trivial.

---

### Decision 3: Testing Approach

**Question:** Should we test on production domains immediately or use staging environment first?

**Option A: Test Directly on Production**
- Pros: Faster, no extra infrastructure, test actual production environment
- Cons: Risk of exposing bugs to public, no rollback if issues found
- Effort: No additional setup
- Risk: Medium

**Option B: Use Staging Subdomain First**
- Pros: Safer, can test without public exposure, easier rollback
- Cons: Extra setup time, need to manage staging environment
- Effort: +2-3 hours for staging setup
- Risk: Low

**Recommendation:** **Option A - Test directly on production**

**Reasoning:**
- These are new deployments with no existing users
- We're deploying during development phase (not production cut-over)
- Can deploy during low-traffic hours
- Faster overall timeline
- If critical issues found, can take site down temporarily

**Exception:** If dumuwaks already has active users, use staging first.

---

## Summary

**Key Insights:**

1. **Only 3 hard bottlenecks exist:** DNS propagation (unavoidable), sequential deployment (acceptable), Nginx config (optimizable)

2. **Massive parallelization opportunity:** Phase 1 (8-12 hours) can run alongside VPS setup and DNS propagation

3. **Backend advantage:** dumuwaks backend running gives us significant head start

4. **Risk is manageable:** All high-risk dependencies have clear mitigation strategies

5. **Timeline is realistic:** 5-6 days is achievable with recommended approach

**Critical Success Factors:**

1. Start Phase 1 immediately (don't wait)
2. Deploy dumuwaks first (leverage running backend)
3. Prepare all configs in Phase 1 (reduce deployment risk)
4. Use DNS propagation time effectively
5. Test thoroughly before proceeding to each next phase
