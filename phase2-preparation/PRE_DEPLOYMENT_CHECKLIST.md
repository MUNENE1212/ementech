# Pre-Deployment Checklist - Final Verification Before VPS Setup

**Phase:** 2 - Interserver VPS Setup
**Date:** January 18, 2026
**Purpose:** Comprehensive checklist to verify everything is ready before executing VPS setup

---

## Executive Summary

This checklist ensures all prerequisites are met, configurations are correct, and risks are mitigated before beginning VPS setup. DO NOT start VPS setup until all CRITICAL items are verified.

**How to Use This Checklist:**
1. Print or have this document open during setup
2. Check each item as completed
3. Do not proceed if any CRITICAL item is unchecked
4. Resolve issues before continuing

---

## Part 1: VPS Access & Specifications (CRITICAL)

### VPS Information Verified

- [ ] **VPS IP Address Obtained**
  - IP: ________________________
  - Source: Interserver control panel
  - **Status:** ✅ Verified / ⚠️ Pending / ❌ Missing

- [ ] **Root Access Tested**
  - Can SSH into VPS as root
  - Password OR SSH key working
  - **Status:** ✅ Verified / ⚠️ Pending / ❌ Missing

- [ ] **VPS Specifications Confirmed**
  - Operating System: Ubuntu 22.04 LTS (preferred)
  - RAM: ____ GB (Minimum 2GB, Recommended 4GB)
  - CPU: ____ cores (Minimum 1, Recommended 2)
  - Storage: ____ GB (Minimum 25GB, Recommended 50GB)
  - **Status:** ✅ Meets minimum / ⚠️ Below minimum / ❌ Needs upgrade

- [ ] **VPS is Fresh Install**
  - No previous installations
  - Clean Ubuntu installation
  - **Status:** ✅ Confirmed / ⚠️ Has existing data / ❌ Needs rebuild

---

## Part 2: Domain & DNS Configuration (CRITICAL)

### Domain Access

- [ ] **Domain Registrar Access Confirmed**
  - Registrar: ________________________
  - Can log into control panel
  - **Status:** ✅ Verified / ⚠️ Pending / ❌ No access

- [ ] **DNS Provider Identified**
  - DNS Provider: ________________________
  - Can be same as registrar or separate (e.g., Cloudflare)
  - **Status:** ✅ Verified / ⚠️ Pending / ❌ Unknown

- [ ] **Admin Email Address Configured**
  - Email: ________________________ (e.g., admin@ementech.co.ke)
  - Accessible for SSL certificate emails
  - **Status:** ✅ Configured / ⚠️ Pending / ❌ No email

### DNS Records Ready

- [ ] **DNS Records Prepared** (To be configured AFTER VPS is ready)
  - A Record: @ → YOUR_VPS_IP
  - A Record: www → YOUR_VPS_IP
  - A Record: app → YOUR_VPS_IP
  - A Record: api → YOUR_VPS_IP
  - **Status:** ✅ Ready to configure / ⚠️ Need to prepare / ❌ Not configured

---

## Part 3: Third-Party Services (IMPORTANT)

### Required for Full Functionality

- [ ] **Cloudinary Account** (Image hosting)
  - Cloud Name: ________________________
  - API Key: ________________________
  - API Secret: ________________________
  - **Status:** ✅ Configured / ⚠️ Pending / ❌ Will configure later

- [ ] **Email Service** (Transactional emails)
  - Provider: ________________________ (Gmail / SendGrid / etc.)
  - SMTP Host: ________________________
  - SMTP Port: ________________________
  - SMTP Username: ________________________
  - SMTP Password: ________________________
  - **Status:** ✅ Configured / ⚠️ Pending / ❌ Will configure later

- [ ] **SMS Service** (Africa's Talking - for dumuwaks)
  - Username: ________________________
  - API Key: ________________________
  - **Status:** ✅ Configured / ⚠️ Pending / ❌ Not using SMS

### Optional Services

- [ ] **Payment Integration** (M-Pesa or Stripe)
  - Service: ________________________
  - API Keys: ________________________
  - **Status:** ✅ Configured / ⚠️ Pending / ❌ Will add later

- [ ] **MongoDB Atlas** (If not using local MongoDB)
  - Connection String: ________________________
  - **Status:** ✅ Configured / ⚠️ Pending / ❌ Using local MongoDB

- [ ] **Monitoring Service** (Sentry, DataDog, etc.)
  - Service: ________________________
  - API Key/DSN: ________________________
  - **Status:** ✅ Configured / ⚠️ Pending / ❌ Using basic PM2 monitoring

---

## Part 4: Local Environment Readiness

### Application Builds Tested

- [ ] **ementech-website Build Tested**
  - Command: `npm run build` completed successfully
  - Output in `/dist` directory
  - No build errors
  - **Status:** ✅ Ready / ⚠️ Has errors / ❌ Not built yet

- [ ] **dumuwaks-frontend Build Tested**
  - Command: `npm run build` completed successfully
  - Output in `/dist` directory
  - No build errors
  - **Status:** ✅ Ready / ⚠️ Has errors / ❌ Not built yet

- [ ] **dumuwaks-backend Build Tested**
  - TypeScript compilation successful
  - No compilation errors
  - Production dependencies installed
  - **Status:** ✅ Ready / ⚠️ Has errors / ❌ Not built yet

### Environment Variables Prepared

- [ ] **Backend Environment Variables Ready**
  - `.env.production.template` reviewed
  - All required variables identified
  - Values prepared (not yet on VPS)
  - **Status:** ✅ Prepared / ⚠️ Missing variables / ❌ Not reviewed

---

## Part 5: Deployment Scripts & Configuration

### Deployment Scripts Ready

- [ ] **setup-vps.sh Script Available**
  - Location: `/deployment/setup-vps.sh`
  - Script reviewed and understood
  - **Status:** ✅ Ready / ⚠️ Needs review / ❌ Missing

- [ ] **deploy-ementech.sh Script Available**
  - Location: `/deployment/deploy-ementech.sh`
  - Configuration variables checked
  - **Status:** ✅ Ready / ⚠️ Needs review / ❌ Missing

- [ ] **deploy-dumuwaks.sh Script Available**
  - Location: `/deployment/deploy-dumuwaks.sh`
  - Configuration variables checked
  - **Status:** ✅ Ready / ⚠️ Needs review / ❌ Missing

- [ ] **deploy-all.sh Script Available**
  - Location: `/deployment/deploy-all.sh`
  - Script reviewed
  - **Status:** ✅ Ready / ⚠️ Needs review / ❌ Missing

### Nginx Configurations Prepared

- [ ] **ementech-website.conf Ready**
  - Location: `/deployment/ementech-website.conf`
  - Configuration reviewed
  - **Status:** ✅ Ready / ⚠️ Needs review / ❌ Missing

- [ ] **dumuwaks-frontend.conf Ready**
  - Location: `/deployment/dumuwaks-frontend.conf`
  - Configuration reviewed
  - **Status:** ✅ Ready / ⚠️ Needs review / ❌ Missing

- [ ] **dumuwaks-backend.conf Ready**
  - Location: `/deployment/dumuwaks-backend.conf`
  - Configuration reviewed
  - **Status:** ✅ Ready / ⚠️ Needs review / ❌ Missing

### PM2 Ecosystem Files Ready

- [ ] **ementech-website PM2 Config Ready**
  - Location: `/deployment/ecosystem.ementech.config.js`
  - Configuration reviewed
  - **Status:** ✅ Ready / ⚠️ Needs review / ❌ Missing

- [ ] **dumuwaks-backend PM2 Config Ready**
  - Location: (to be created in dumuwaks-backend directory)
  - Configuration reviewed
  - **Status:** ✅ Ready / ⚠️ Needs review / ❌ Missing

---

## Part 6: Security & Access Control

### SSH Access Security

- [ ] **SSH Access Method Chosen**
  - Method: Password-based / SSH key-based / Both
  - **Status:** ✅ Decided / ⚠️ Undecided

- [ ] **SSH Key Generated** (If using key-based auth)
  - Private key location: ________________________
  - Public key installed on VPS
  - **Status:** ✅ Ready / ⚠️ Not generated / ❌ Using password

### Access Control

- [ ] **Firewall Rules Understood**
  - UFW will be enabled
  - Ports 22, 80, 443 will be open
  - All other ports closed by default
  - **Status:** ✅ Understood / ⚠️ Need clarification

- [ ] **Root Login Policy Decided**
  - Allow root login: Yes / No / Only with SSH key
  - **Status:** ✅ Decided / ⚠️ Undecided

---

## Part 7: Backup & Disaster Recovery

### Backup Strategy

- [ ] **Backup Requirements Identified**
  - Database backup frequency: Daily / Weekly / Hourly
  - Backup retention: 7 days / 30 days / 90 days
  - Backup location: Local / Remote (S3, etc.)
  - **Status:** ✅ Decided / ⚠️ Undecided / ❌ No backup plan

- [ ] **MongoDB Backup Plan**
  - Method: mongodump / MongoDB Atlas automated / Custom
  - **Status:** ✅ Plan ready / ⚠️ Needs research / ❌ No plan

### Recovery Procedures

- [ ] **Rollback Procedure Understood**
  - Read rollback sections in deployment guides
  - Procedure documented
  - **Status:** ✅ Understood / ⚠️ Needs review / ❌ Not reviewed

---

## Part 8: Monitoring & Logging

### Monitoring Setup

- [ ] **Monitoring Requirements Identified**
  - Basic: PM2 monitoring only
  - Enhanced: PM2 + Sentry/other service
  - Advanced: PM2 + Sentry + uptime monitoring
  - **Status:** ✅ Decided / ⚠️ Undecided / ❌ No monitoring planned

- [ ] **Monitoring Service Account** (If using)
  - Service: ________________________
  - Account created
  - API keys ready
  - **Status:** ✅ Ready / ⚠️ Not using / ❌ Need to create

### Logging Strategy

- [ ] **Log Retention Policy**
  - PM2 logs: 7 days / 14 days / 30 days
  - Application logs: 7 days / 30 days / 90 days
  - nginx logs: 7 days / 14 days / 30 days
  - **Status:** ✅ Decided / ⚠️ Will use defaults

---

## Part 9: Documentation & Knowledge

### Documentation Reviewed

- [ ] **VPS Setup Guide Read**
  - Read `STEP_BY_STEP_SETUP.md`
  - Understand each step
  - Time commitment: 2-4 hours
  - **Status:** ✅ Read / ⚠️ Skimmed / ❌ Not read

- [ ] **VPS Specifications Reviewed**
  - Read `VPS_SPECIFICATIONS.md`
  - Understand resource requirements
  - **Status:** ✅ Read / ⚠️ Skimmed / ❌ Not read

- [ ] **Troubleshooting Guide Reviewed**
  - Read `DEPLOYMENT_TROUBLESHOOTING.md`
  - Know common issues and solutions
  - **Status:** ✅ Read / ⚠️ Skimmed / ❌ Not read

### Skills & Knowledge

- [ ] **Basic Linux Commands Understood**
  - Comfortable with SSH, nano, systemctl, etc.
  - **Status:** ✅ Comfortable / ⚠️ Can follow instructions / ❌ Need training

- [ ] **Git Basics Understood**
  - Can clone repositories, switch branches
  - **Status:** ✅ Comfortable / ⚠️ Basic knowledge / ❌ No experience

---

## Part 10: Timing & Scheduling

### Time Commitment

- [ ] **Sufficient Time Allocated**
  - VPS setup: 2-4 hours
  - DNS configuration: 5 minutes
  - DNS propagation: 1-48 hours (waiting time)
  - SSL installation: 30 minutes (after DNS propagation)
  - Application deployment: 1-2 hours
  - Testing: 1 hour
  - **Total Time:** 5-8 hours (spread over 1-2 days due to DNS)
  - **Status:** ✅ Time available / ⚠️ Need to schedule / ❌ Insufficient time

### Scheduling

- [ ] **Maintenance Window Identified**
  - Best time for deployment: ________________________
  - Low-traffic period preferred
  - **Status:** ✅ Scheduled / ⚠️ Anytime / ❌ Conflict with other tasks

---

## Part 11: Communication & Support

### Contacts Ready

- [ ] **Interserver Support Contact Info**
  - Support URL: https://www.interserver.net/support/
  - **Status:** ✅ Available / ⚠️ Not needed

- [ ] **Domain Registrar Support**
  - Support URL: ________________________
  - **Status:** ✅ Available / ⚠️ Not needed

- [ ] **Deployment Team Escalation Path**
  - How to escalate issues: Create ticket in `.agent-workspace/escalations/`
  - **Status:** ✅ Understood / ⚠️ Unclear

### Notifications Configured

- [ ] **SSL Expiration Alerts**
  - Admin email will receive Let's Encrypt expiration emails
  - **Status:** ✅ Configured / ⚠️ Need to check email / ❌ Not configured

---

## Part 12: Final Go/No-Go Decision

### Critical Path Items (ALL Must Be ✅ to Proceed)

- [ ] **VPS Access Working** ✅ / ❌
- [ ] **VPS Specifications Meet Minimum** ✅ / ❌
- [ ] **Domain Access Confirmed** ✅ / ❌
- [ ] **Admin Email Configured** ✅ / ❌
- [ ] **Application Builds Tested** ✅ / ❌
- [ ] **Deployment Scripts Available** ✅ / ❌
- [ ] **Setup Guide Read** ✅ / ❌
- [ ] **Time Allocated** ✅ / ❌

**Decision:**
- [ ] **GO** - All critical items verified, ready to proceed
- [ ] **NO-GO** - Critical issues, resolve before proceeding
- [ ] **PROCEED WITH CAUTION** - Minor issues, acceptable risks

---

## Pre-Setup Verification Test

**Before starting full VPS setup, run this quick test:**

```bash
# 1. Test VPS Access
ssh root@YOUR_VPS_IP "echo 'VPS access: OK'"

# Expected output: VPS access: OK

# 2. Test DNS Resolution (if already configured)
dig ementech.co.ke +short

# Expected output: YOUR_VPS_IP (or blank if DNS not configured yet)

# 3. Verify you have sudo access on VPS
ssh root@YOUR_VPS_IP "whoami"

# Expected output: root
```

**If all tests pass:** You're ready to begin VPS setup!

**If any test fails:**
- VPS access fails: Check IP address and credentials
- DNS fails: Normal if not configured yet, will configure during setup
- Sudo fails: Should be root, if not contact support

---

## Risk Assessment

### High-Risk Items (Could Block Deployment)

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Wrong VPS specifications | High | Low | Verify specs match requirements |
| Lost SSH access | Critical | Low | Keep alternative access method ready |
| DNS configuration errors | High | Medium | Double-check DNS records |
| SSL certificate fails | High | Low | Ensure DNS propagates first |

### Medium-Risk Items (Could Cause Delays)

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Missing API keys | Medium | High | Can add after initial deployment |
| Build errors | Medium | Low | Test builds locally first |
| Insufficient resources | Medium | Low | Start with recommended specs |

### Low-Risk Items (Minor Inconveniences)

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| DNS propagation delay | Low | High | Plan for 24-48 hour wait |
| Documentation gaps | Low | Low | Refer to troubleshooting guide |

---

## Final Sign-Off

**Before proceeding with VPS setup, confirm:**

1. [ ] I have read and understood all prerequisites
2. [ ] I have verified VPS access works
3. [ ] I have allocated sufficient time (5-8 hours spread over 1-2 days)
4. [ ] I understand DNS propagation will take 1-48 hours
5. [ ] I have critical API keys available (or can add later)
6. [ ] I know how to escalate issues if needed
7. [ ] I have backed up any important local data
8. [ ] I am ready to begin VPS setup

**Signature:** ________________________
**Date:** ________________________

---

## Document Version

**Version:** 1.0
**Last Updated:** January 18, 2026
**Maintained By:** Ementech Deployment Team

**Next Steps After Checklist Completion:**
1. If all CRITICAL items checked: Proceed to `STEP_BY_STEP_SETUP.md`
2. If any CRITICAL items unchecked: Resolve before proceeding
3. If unsure about any item: Review related documentation or ask questions

**For Questions:**
- Review `VPS_PREREQUISITES.md` for detailed requirements
- Review `VPS_SPECIFICATIONS.md` for VPS recommendations
- Create escalation ticket if needed
