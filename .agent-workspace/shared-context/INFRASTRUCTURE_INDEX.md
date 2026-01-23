# Multi-Application VPS Infrastructure - Documentation Index

**Project**: EmenTech Multi-Application VPS Infrastructure
**VPS**: 69.164.244.165 (mail.ementech.co.ke)
**Last Updated**: 2026-01-21
**Status**: Architecture Complete - Ready for Implementation

---

## Document Overview

This documentation provides a comprehensive infrastructure architecture for hosting multiple production applications on a single Ubuntu 22.04 VPS. The architecture supports secure multi-tenancy, isolated application environments, centralized monitoring, and automated deployment capabilities.

### Hosted Applications

1. **EmenTech Website** (https://ementech.co.ke)
   - Corporate website with IMAP email system
   - Frontend: React 19 + Vite
   - Backend: Node.js + Express (Port 5001)
   - Database: MongoDB Atlas
   - Status: ✅ Production Deployed

2. **Dumuwaks** (https://dumuwaks.ementech.co.ke)
   - Kenyan Job Marketplace
   - Frontend: React 18 + TypeScript
   - Backend: Node.js + Express (Port 5000)
   - Database: MongoDB Atlas
   - Status: 🚧 Backend Deployed, Frontend Pending

3. **Admin Dashboard** (https://admin.ementech.co.ke)
   - System Monitoring and Management
   - Frontend: React 18 + TypeScript
   - Backend: Node.js + Express (Port 3001)
   - Database: MongoDB Atlas
   - Status: 📋 Designed, Ready to Deploy

---

## Documentation Structure

### Core Architecture Documents

#### 1. Multi-Application Infrastructure Architecture
**File**: `MULTI_APP_INFRASTRUCTURE_ARCHITECTURE.md`
**Purpose**: Complete system architecture and technical specifications
**Sections**:
- Architecture Overview
- Directory Structure
- Network Architecture
- Application Configuration
- SSL Certificate Management
- Process Management (PM2)
- Security Hardening
- Monitoring & Logging
- Backup Strategy
- Deployment Automation
- Scaling Considerations
- Disaster Recovery

**Target Audience**: System Architects, DevOps Engineers, Senior Developers

---

#### 2. Nginx Multi-Application Configuration
**File**: `nginx-configurations.md`
**Purpose**: Complete Nginx configuration for multi-domain hosting
**Sections**:
- Main Nginx Configuration
- Security Configuration
- SSL Configuration
- Rate Limiting Configuration
- Site-Specific Configurations (EmenTech, Dumuwaks, Admin)
- Implementation Steps
- Troubleshooting

**Target Audience**: DevOps Engineers, System Administrators

---

#### 3. PM2 Process Management Configuration
**File**: `pm2-configuration.md`
**Purpose**: PM2 ecosystem configuration for multi-app management
**Sections**:
- PM2 Ecosystem Configuration
- Individual App Configurations
- PM2 Startup and Systemd
- Monitoring and Logging
- Cluster Mode (Optional)
- Implementation Steps
- Troubleshooting

**Target Audience**: DevOps Engineers, Node.js Developers

---

#### 4. Automation Scripts Collection
**File**: `automation-scripts.md`
**Purpose**: Ready-to-use deployment and maintenance scripts
**Sections**:
- Deployment Scripts (zero-downtime deployment)
- Backup Scripts (comprehensive backup automation)
- Monitoring Scripts (health checks, resource monitoring)
- Maintenance Scripts (log cleanup, system updates)
- Utility Scripts (SSL renewal, DB connection test)
- Cron Jobs

**Target Audience**: DevOps Engineers, System Administrators

---

### Implementation Guide

#### 5. Implementation Guide
**File**: `.agent-workspace/handoffs/to-deployment-ops/IMPLEMENTATION_GUIDE.md`
**Purpose**: Step-by-step implementation instructions
**Sections**:
- Pre-Implementation Checklist
- Implementation Phases (8 phases, 6-8 hours)
  1. Infrastructure Preparation
  2. Security Hardening
  3. SSL Certificate Management
  4. Nginx Multi-Domain Configuration
  5. PM2 Multi-Application Configuration
  6. DNS Configuration
  7. Deployment Automation
  8. Testing and Verification
- Rollback Procedures
- Post-Implementation Tasks
- Monitoring and Maintenance
- Troubleshooting Guide

**Target Audience**: Deployment Operations Agent

---

## Quick Reference

### Architecture Diagram

```
Internet
   ↓
DNS (ementech.co.ke, dumuwaks.ementech.co.ke, admin.ementech.co.ke)
   ↓
VPS (69.164.244.165)
   ↓
UFW Firewall → Nginx Reverse Proxy
   ↓
┌──────────────────┬──────────────────┬──────────────────┐
│  Ementech Site   │  Dumuwaks App    │  Admin Dashboard │
│  (ementech.co.ke)│  (dumuwaks.)     │  (admin.)        │
├──────────────────┼──────────────────┼──────────────────┤
│ React Frontend   │ React Frontend   │ React Frontend   │
│ (/var/www/       │ (/var/www/       │ (/var/www/       │
│  ementech/current)│ dumuwaks/current)│ admin/current)   │
├──────────────────┼──────────────────┼──────────────────┤
│ Node.js Backend  │ Node.js Backend  │ Node.js Backend  │
│ Port: 5001       │ Port: 5000       │ Port: 3001       │
│ PM2: ementech-   │ PM2: dumuwaks-   │ PM2: admin-      │
│      backend     │      backend     │      backend     │
└────────┬─────────┴────────┬─────────┴────────┬─────────┘
         │                  │                  │
         └──────────────────┼──────────────────┘
                            ↓
                  MongoDB Atlas (Cloud)
```

### Port Allocation

| Port | Service        | Application        | Exposure |
|------|----------------|--------------------|----------|
| 22   | SSH            | System             | Internet |
| 80   | HTTP           | Nginx              | Internet |
| 443  | HTTPS          | Nginx              | Internet |
| 5000 | Node.js API    | Dumuwaks Backend   | Local    |
| 5001 | Node.js API    | Ementech Backend   | Local    |
| 3001 | Node.js API    | Admin Backend      | Local    |

### Directory Structure

```
/var/www/
├── ementech-website/              # Ementech Corporate Website
│   ├── backend/                   # Backend application
│   ├── current/                   # Frontend build
│   ├── releases/                  # Deployment history
│   └── shared/                    # Shared assets
│
├── dumuwaks/                      # Dumuwaks Job Marketplace
│   ├── backend/
│   ├── current/
│   ├── releases/
│   └── shared/
│
├── admin-dashboard/               # Admin Monitoring Dashboard
│   ├── backend/
│   ├── current/
│   ├── releases/
│   └── shared/
│
└── shared/                        # Shared resources
    ├── scripts/                   # Automation scripts
    ├── backups/                   # Backup storage
    └── pm2/                       # PM2 configuration
```

### Key Technologies

**Frontend Stack**:
- React 19 (EmenTech)
- React 18 (Dumuwaks, Admin)
- TypeScript
- Vite (build tooling)
- TailwindCSS

**Backend Stack**:
- Node.js
- Express.js
- Socket.IO (real-time)
- MongoDB Atlas (database)

**Infrastructure**:
- Nginx (reverse proxy)
- PM2 (process manager)
- Let's Encrypt (SSL)
- UFW (firewall)
- Fail2ban (intrusion prevention)

---

## Implementation Status

### Completed ✅

1. **Architecture Design**
   - Multi-application architecture
   - Directory structure
   - Network configuration
   - Security hardening strategy

2. **Nginx Configuration**
   - Multi-domain configuration
   - SSL/TLS setup
   - Rate limiting
   - Security headers

3. **PM2 Configuration**
   - Ecosystem file for all apps
   - Process management
   - Log rotation
   - Systemd integration

4. **Automation Scripts**
   - Zero-downtime deployment
   - Automated backups
   - Health monitoring
   - Maintenance scripts

5. **Implementation Guide**
   - Step-by-step instructions
   - Rollback procedures
   - Troubleshooting guide

### Pending 🚧

1. **Deployment Implementation**
   - Execute implementation guide
   - Configure DNS records
   - Obtain SSL certificates
   - Deploy Dumuwaks frontend
   - Deploy admin dashboard

2. **Monitoring Setup**
   - Configure monitoring dashboards
   - Set up alerting
   - Fine-tune thresholds

3. **Documentation Updates**
   - Document any deviations from design
   - Add lessons learned
   - Update troubleshooting guides

---

## Next Steps for Deployment-Operations Agent

### Immediate Actions

1. **Review Documentation**
   - Read `MULTI_APP_INFRASTRUCTURE_ARCHITECTURE.md`
   - Review `IMPLEMENTATION_GUIDE.md`
   - Understand rollback procedures

2. **Pre-Implementation Checks**
   - Verify VPS access
   - Confirm DNS management access
   - Gather MongoDB Atlas credentials
   - Schedule maintenance window

3. **Execute Implementation**
   - Follow `IMPLEMENTATION_GUIDE.md` phase by phase
   - Complete each phase before moving to next
   - Test thoroughly after each phase
   - Document any issues

4. **Post-Implementation**
   - Monitor for 24 hours
   - Verify all automated tasks
   - Test all applications
   - Update documentation

### Risk Mitigation

**High Risk Operations**:
- Nginx configuration changes
- SSL certificate updates
- PM2 process changes
- DNS modifications

**Mitigation Strategy**:
- Perform during low-traffic hours
- Create backups before changes
- Test in staging first
- Have rollback ready
- Monitor continuously

---

## Support and Resources

### Documentation Files

All documentation is located in:
```
/media/munen/muneneENT/ementech/ementech-website/.agent-workspace/shared-context/
```

### Key Contact Points

**Architecture Questions**: Refer to architecture documents
**Implementation Issues**: Follow troubleshooting guide
**Emergency Rollback**: Use rollback procedures in implementation guide

### External Resources

- Nginx Documentation: https://nginx.org/en/docs/
- PM2 Documentation: https://pm2.keymetrics.io/docs/
- MongoDB Atlas: https://cloud.mongodb.com/
- Let's Encrypt: https://letsencrypt.org/docs/

---

## Version History

**v1.0** (2026-01-21) - Initial Architecture Design
- Complete multi-application infrastructure design
- Nginx multi-domain configuration
- PM2 ecosystem configuration
- Automation scripts
- Implementation guide

---

## Appendix

### A. Performance Benchmarks

**Target Metrics**:
- Page Load: < 2s
- API Response: < 200ms
- Uptime: > 99.9%
- SSL: A+ grade (SSL Labs)

### B. Security Checklist

- [x] Firewall configured (UFW)
- [x] Intrusion prevention (Fail2ban)
- [x] SSL/TLS certificates
- [x] Security headers (Nginx)
- [x] Rate limiting
- [x] SSH hardening
- [x] Regular updates

### C. Backup Schedule

- **Daily**: MongoDB backups (Atlas automated)
- **Daily**: Configuration backups (automated script)
- **Weekly**: User uploads backup
- **Monthly**: Full VPS snapshot

---

**Document Status**: ✅ Complete
**Ready for Implementation**: Yes
**Estimated Implementation Time**: 6-8 hours
**Required Expertise**: DevOps Engineer / System Administrator
