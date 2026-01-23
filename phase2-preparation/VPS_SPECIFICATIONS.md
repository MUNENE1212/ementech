# VPS Specifications - Recommendations & Requirements

**Phase:** 2 - Interserver VPS Setup
**Date:** January 18, 2026
**Purpose:** Recommend optimal VPS configuration for hosting all Ementech projects

---

## Executive Summary

This document provides detailed VPS specifications recommendations for hosting three applications on a single Interserver VPS:

1. **ementech-website** → Corporate website (static React build)
2. **dumuwaks-frontend** → Fullstack application frontend (React SPA)
3. **dumuwaks-backend** → Backend API (Node.js/Express/MongoDB)

**Key Recommendation:** Start with **2 slices (4GB RAM, 2 CPU cores)** for initial deployment. Scale up as needed based on traffic and resource usage.

---

## Table of Contents

1. [Minimum vs. Recommended Specifications](#minimum-vs-recommended-specifications)
2. [Interserver VPS Slices Explained](#interserver-vps-slices-explained)
3. [Cost Analysis](#cost-analysis)
4. [Resource Usage Breakdown](#resource-usage-breakdown)
5. [Scaling Strategy](#scaling-strategy)
6. [Operating System Selection](#operating-system-selection)
7. [Storage Requirements](#storage-requirements)
8. [Network & Bandwidth](#network--bandwidth)
9. [Recommendation Summary](#recommendation-summary)

---

## Minimum vs. Recommended Specifications

### Minimum Specifications (Development/Staging)

**Use Case:** Testing, development, or low-traffic initial deployment (< 100 daily users)

| Component | Minimum | Why This Minimum? |
|-----------|---------|-------------------|
| **RAM** | 2GB | Bare minimum to run 3 Node.js apps + MongoDB + nginx + OS overhead |
| **CPU** | 1 core | Single core sufficient for low traffic |
| **Storage** | 25GB SSD | Enough for applications + initial database + logs |
| **Bandwidth** | 1TB/month | Adequate for low-traffic website |
| **Interserver Slices** | 1 slice | 1 slice = 2GB RAM, 1 CPU core |

**Limitations:**
- May require swap file (slower performance)
- No PM2 cluster mode (can't utilize multiple cores)
- Limited headroom for traffic spikes
- MongoDB may be memory-constrained

**When to Use:**
- Initial development and testing
- Proof of concept deployment
- Budget-constrained projects with < 100 users/day

**Estimated Cost:** $6/month (1 slice)

---

### Recommended Specifications (Production)

**Use Case:** Production deployment with moderate traffic (100-1000 daily users)

| Component | Recommended | Why This Recommendation? |
|-----------|-------------|--------------------------|
| **RAM** | 4GB | Comfortable running all apps + MongoDB with caching |
| **CPU** | 2 cores | Enable PM2 cluster mode for better performance |
| **Storage** | 50GB SSD | Room for growth: databases, logs, uploads |
| **Bandwidth** | 2TB/month | Sufficient for moderate traffic + CDN offloading |
| **Interserver Slices** | 2 slices | 2 slices = 4GB RAM, 2 CPU cores |

**Benefits:**
- MongoDB can use more memory for better performance
- PM2 cluster mode enabled (2 workers for backend)
- nginx caching possible for static assets
- Room for traffic spikes
- Better user experience

**When to Use:**
- Production launch with expected traffic
- E-commerce or user-facing applications
- Applications requiring real-time features (Socket.io)

**Estimated Cost:** $12/month (2 slices)

---

### High-Traffic Specifications (Scaling Up)

**Use Case:** High-traffic production (> 1000 daily users) or e-commerce

| Component | High-Traffic | When to Upgrade |
|-----------|--------------|-----------------|
| **RAM** | 8GB+ | Consistent > 70% memory usage on 4GB plan |
| **CPU** | 4 cores+ | Consistent high CPU load or slow response times |
| **Storage** | 100GB+ SSD | Database growth or media file storage |
| **Bandwidth** | 4TB/month | Exceeding 2TB/month consistently |
| **Interserver Slices** | 4 slices | 4 slices = 8GB RAM, 4 CPU cores |

**Benefits:**
- PM2 cluster mode with 4 workers
- Significant MongoDB performance improvement
- Can handle traffic spikes without degradation
- Room for additional applications

**When to Use:**
- E-commerce with significant traffic
- Real-time applications with many concurrent Socket.io connections
- When monitoring shows consistent resource pressure

**Estimated Cost:** $24/month (4 slices)

---

## Interserver VPS Slices Explained

### What Is a "Slice"?

Interserver uses a "slices" pricing model where each slice provides:

| Resource | Per Slice |
|----------|-----------|
| **RAM** | 2 GB |
| **CPU Cores** | 1 core |
| **Storage** | 25 GB SSD |
| **Bandwidth** | 1 TB/month |
| **IP Addresses** | 1 IPv4 address |
| **Cost** | ~$6/month (as of 2026) |

### Slice Comparison

| Slices | RAM | CPU | Storage | Bandwidth | Monthly Cost |
|--------|-----|-----|---------|-----------|--------------|
| 1 | 2GB | 1 core | 25GB | 1TB | $6 |
| 2 | 4GB | 2 cores | 50GB | 2TB | $12 |
| 3 | 6GB | 3 cores | 75GB | 3TB | $18 |
| 4 | 8GB | 4 cores | 100GB | 4TB | $24 |
| 6 | 12GB | 6 cores | 150GB | 6TB | $36 |
| 8 | 16GB | 8 cores | 200GB | 8TB | $48 |

### Scaling Flexibility

**Advantage:** You can add or remove slices at any time without migrating to a new server.

- **Upgrade:** Add slices instantly, restart services
- **Downgrade:** Remove slices (ensure you have enough resources first)

---

## Cost Analysis

### Monthly Cost Breakdown

### 1 Slice Plan ($6/month) - Minimum

**Best For:** Development, testing, or very low traffic

```
VPS (1 slice):           $6.00/month
Domain (ementech.co.ke): $10-15/year (~$1.25/month)
SSL Certificates:        $0 (Let's Encrypt is free)
Backup Storage:          $0 (local storage)
Monitoring:              $0 (basic PM2 monitoring)
---
Total:                   ~$7.25/month
```

**Annual Cost:** ~$87/year

---

### 2 Slice Plan ($12/month) - Recommended

**Best For:** Production deployment with moderate traffic

```
VPS (2 slices):          $12.00/month
Domain:                  $1.25/month
SSL Certificates:        $0
Backup Storage:          $0-5/month (optional remote backup)
Monitoring:              $0 (basic) or $10-20/month (Sentry)
---
Total:                   ~$13.25-18.25/month
```

**Annual Cost:** ~$159-219/year

**Note:** This is the sweet spot for most small-to-medium applications.

---

### 4 Slice Plan ($24/month) - High Traffic

**Best For:** E-commerce, high-traffic sites

```
VPS (4 slices):          $24.00/month
Domain:                  $1.25/month
SSL Certificates:        $0
Backup Storage:          $5-10/month (recommended remote backup)
Monitoring:              $10-20/month (Sentry recommended)
CDN (Cloudflare):        $0 (free tier) or $20/month (pro)
---
Total:                   ~$40-55/month
```

**Annual Cost:** ~$480-660/year

---

### Third-Party Service Costs (Additional)

These are optional but commonly needed:

| Service | Free Tier | Paid Tier | When Needed |
|---------|-----------|-----------|-------------|
| **Cloudinary** | 25GB storage, 25GB bandwidth/month | $89/month (pro tier) | Image hosting for dumuwaks |
| **Africa's Talking SMS** | 10 free SMS | Pay-as-you-go (~KES 1.20/SMS) | SMS notifications in dumuwaks |
| **Email Service** | Gmail (free, limited) | SendGrid (free: 100/day, paid: from $15/month) | Transactional emails |
| **MongoDB Atlas** | 512MB free | M10 cluster from $9/month | Managed MongoDB (optional, can use local) |
| **Sentry Monitoring** | 5K errors/month | From $26/month | Error tracking (recommended) |
| **Stripe Payments** | Free (2.9% + $0.30 per transaction) | Same | Credit card processing |
| **M-Pesa** | Free setup | Transaction fees apply | Mobile payments (Kenya) |

**Estimated Additional Costs:** $0-50/month depending on usage

---

## Resource Usage Breakdown

### Memory (RAM) Usage

### Baseline Memory Consumption (Idle)

| Component | Idle Usage | Peak Usage |
|-----------|------------|------------|
| **OS (Ubuntu)** | 300-500MB | 500MB |
| **nginx** | 50-100MB | 200MB |
| **ementech-website (static)** | 0MB (served by nginx) | 0MB |
| **dumuwaks-frontend (static)** | 0MB (served by nginx) | 0MB |
| **dumuwaks-backend (PM2)** | 150-250MB per worker | 300-500MB per worker |
| **MongoDB** | 500MB-1GB | 2-4GB (with cache) |
| **Redis (optional)** | 50-100MB | 200MB |
| **Overhead** | 200-300MB | 500MB |

### Total Memory Requirements

| Configuration | Baseline | Recommended | Comfortable Headroom |
|---------------|----------|-------------|----------------------|
| **1 Slice (2GB)** | ~1.5GB | **2GB minimum** | **Tight** - may need swap |
| **2 Slices (4GB)** | ~1.5GB | **4GB recommended** | **Good** - room for growth |
| **4 Slices (8GB)** | ~1.5GB | **8GB ideal** | **Excellent** - scale headroom |

**Note:** MongoDB benefits greatly from having more RAM for caching frequently accessed data.

---

### CPU Usage

### Typical CPU Requirements

| Component | Idle | Moderate Load | High Load |
|-----------|------|---------------|-----------|
| **OS** | <1% | 1-2% | 2-5% |
| **nginx** | <1% | 5-10% | 10-20% |
| **ementech-website** | 0% | 0% (static) | 0% (static) |
| **dumuwaks-frontend** | 0% | 0% (static) | 0% (static) |
| **dumuwaks-backend** | <1% | 10-30% | 50-80% |
| **MongoDB** | 1-2% | 5-15% | 20-40% |
| **Redis (if used)** | <1% | 2-5% | 5-10% |

### When to Scale CPU

- **1 core sufficient:** < 500 daily users
- **2 cores recommended:** 500-2000 daily users
- **4+ cores:** > 2000 daily users or heavy computation

**Note:** PM2 cluster mode allows utilizing multiple CPU cores. With 2 cores, backend can run 2 workers for better performance.

---

### Storage Usage

### Estimated Storage Breakdown

| Component | Initial Usage | Growth Rate (Monthly) |
|-----------|---------------|----------------------|
| **OS + System** | 3-5GB | Minimal growth |
| **Node.js apps** | 500MB-1GB | 100MB (updates) |
| **node_modules** | 1-2GB | 100MB (updates) |
| **Application logs** | 100MB | 500MB-1GB (with rotation) |
| **nginx logs** | 100MB | 500MB-1GB (with rotation) |
| **MongoDB database** | 100MB | 500MB-2GB (depends on usage) |
| **Uploads (if local)** | 0 | 1-5GB (if using local storage) |
| **Total (Year 1)** | **5-10GB** | **15-30GB** |

### Storage Recommendations

| Plan | Storage | Adequate For |
|------|---------|--------------|
| **1 slice (25GB)** | 25GB | Development, or using Cloudinary for images |
| **2 slices (50GB)** | 50GB | **Recommended** - production with room for growth |
| **4 slices (100GB)** | 100GB | E-commerce with significant media storage |

**Important:** If using Cloudinary for image hosting (recommended), storage usage is much lower since images aren't stored locally.

---

## Scaling Strategy

### Phase 1: Initial Deployment (Month 1-3)

**Start with:** 2 slices (4GB RAM, 2 CPU cores, 50GB storage) - $12/month

**Expected Traffic:** 100-500 daily users

**Rationale:**
- Cost-effective while providing production-ready resources
- PM2 cluster mode possible with 2 cores
- MongoDB has sufficient memory for caching
- Room for initial growth

---

### Phase 2: Growth Phase (Month 3-12)

**Scale to:** 3-4 slices if needed

**Triggers for Scaling:**
- Average daily users > 1000
- PM2 shows consistent high CPU usage (> 70%)
- MongoDB memory usage consistently high (> 3GB)
- Response times degrading (> 500ms average)

**Monitor These Metrics:**
```bash
# PM2 monitoring
pm2 monit

# Memory usage
free -h

# CPU usage
top -bn1 | grep "Cpu(s)"

# Disk usage
df -h

# MongoDB stats
mongosh --eval "db.serverStatus().connections"
```

---

### Phase 3: High Traffic (Year 1+)

**Options:**

**Option A: Scale VPS Vertically** (Simpler)
- Upgrade to 6-8 slices
- Single server handles all traffic
- Easier management
- **Cost:** $36-48/month

**Option B: Horizontal Scaling** (More robust)
- Keep VPS for frontend/static sites
- Deploy backend to separate VPS or MongoDB Atlas
- Use load balancer (Interserver offers this)
- **Cost:** Similar to Option A, but better performance

**When to Choose Option B:**
- Consistently hitting resource limits on 8 slices
- Need high availability (redundancy)
- Business-critical application requiring 99.9% uptime

---

## Operating System Selection

### Recommended: Ubuntu 22.04 LTS (Jammy Jellyfish)

**Why Ubuntu 22.04 LTS:**
- Long-term support until 2027 (5 years security updates)
- Extensive community support and documentation
- All deployment scripts tested on Ubuntu 22.04
- Package availability: Node.js 20.x, MongoDB 7.0, nginx latest

**Alternative: Ubuntu 24.04 LTS** (Noble Numbat)
- Released April 2024
- LTS support until 2029
- Newer packages, but less battle-tested
- May require script adjustments

**Not Recommended:**
- **Ubuntu 20.04 LTS**: Reaching end of standard support in 2025
- **Debian**: Good, but our scripts use Ubuntu-specific commands
- **CentOS/RHEL**: Different package manager, requires script modifications

---

## Storage Requirements

### Storage Type: SSD (Required)

**Why SSD:**
- Fast I/O for database operations
- Quick application startup times
- Better overall performance vs. HDD
- Interserver provides SSD by default

### Storage Planning

#### Minimal Storage (25GB - 1 Slice)

**Use Case:** Development or using external services (Cloudinary, MongoDB Atlas)

**Breakdown:**
```
OS + System:        5GB
Applications:       2GB
Logs:               1GB (with rotation)
MongoDB (local):    5GB
Headroom:          12GB
```

**Suitable For:**
- Development environments
- Testing deployments
- Applications using Cloudinary for images
- Applications using MongoDB Atlas instead of local MongoDB

---

#### Standard Storage (50GB - 2 Slices) **RECOMMENDED**

**Use Case:** Production deployment

**Breakdown:**
```
OS + System:        5GB
Applications:       3GB
Logs:               5GB (with 30-day rotation)
MongoDB (local):   15GB
Uploads (local):   10GB (if not using Cloudinary)
Backups:           10GB (local backup snapshots)
Headroom:          12GB
```

**Suitable For:**
- Production applications
- Moderate database growth
- Local image storage (if not using Cloudinary)
- Local backup retention

---

#### Large Storage (100GB+ - 4+ Slices)

**Use Case:** E-commerce or media-heavy applications

**Breakdown:**
```
OS + System:        5GB
Applications:       5GB
Logs:              10GB (with 90-day rotation)
MongoDB (local):   40GB
Uploads (local):   30GB
Backups:           20GB
Headroom:          10GB
```

**Suitable For:**
- E-commerce with product catalogs
- Applications storing user-uploaded videos
- Significant database growth
- Longer log retention

---

### External Storage Options

**When local storage isn't enough:**

1. **MongoDB Atlas** (Recommended for databases)
   - Free tier: 512MB
   - Paid: From $9/month for M10 cluster
   - Benefits: Automated backups, high availability

2. **Cloudinary** (Recommended for images)
   - Free tier: 25GB storage + 25GB bandwidth
   - Paid: From $89/month
   - Benefits: CDN, image optimization, transformations

3. **AWS S3 / Google Cloud Storage** (Alternative for files)
   - Pay-as-you-go pricing
   - Scalable to petabytes
   - Good for backups and large files

---

## Network & Bandwidth

### Bandwidth Requirements

### Estimated Bandwidth Usage

| Traffic Level | Daily Users | Page Views/Day | Monthly Bandwidth |
|---------------|-------------|-----------------|-------------------|
| **Low** | 50 | 200 | 10-20GB |
| **Moderate** | 500 | 2,000 | 100-200GB |
| **High** | 5,000 | 20,000 | 1-2TB |
| **Very High** | 50,000 | 200,000 | 10-20TB |

### Interserver Bandwidth Allowance

| Plan | Included Bandwidth | Overage Cost |
|------|-------------------|--------------|
| 1 slice | 1TB/month | $1/TB (approx) |
| 2 slices | 2TB/month | $1/TB (approx) |
| 4 slices | 4TB/month | $1/TB (approx) |

### Bandwidth Optimization

**To reduce bandwidth usage:**

1. **Enable nginx Gzip Compression**
   - Compresses text-based assets (HTML, CSS, JS)
   - Typical savings: 60-80% reduction

2. **Use CDN (Cloudflare)**
   - Caches static assets at edge locations
   - Reduces bandwidth on VPS
   - Free tier available

3. **Browser Caching**
   - Set cache headers for static assets
   - Reduces repeat requests

4. **Image Optimization**
   - Use Cloudinary for automatic optimization
   - Serve WebP format when possible
   - Lazy load images

**Result:** With optimization, 2TB/month can typically handle 10,000+ daily users.

---

### Network Performance

**Interserver Network:**
- 1Gbps network port (standard)
- Excellent connectivity to US and Europe
- Good connectivity to Kenya (via subsea cables)

**Latency Expectations:**
- **From Kenya:** 150-250ms (acceptable for web applications)
- **From US/Europe:** 10-50ms (excellent)
- **Socket.io:** Works fine with < 250ms latency

**Optimization Tip:** Use Cloudflare CDN to reduce latency for international users.

---

## Recommendation Summary

### For Your Deployment

Based on hosting 3 applications (1 static site, 1 fullstack app, 1 backend API):

### START WITH: **2 Slices ($12/month)**

**Configuration:**
- **RAM:** 4GB
- **CPU:** 2 cores
- **Storage:** 50GB SSD
- **Bandwidth:** 2TB/month
- **OS:** Ubuntu 22.04 LTS

**Why This Is The Sweet Spot:**
1. **Production-Ready:** Sufficient resources for smooth operation
2. **PM2 Cluster Mode:** Can run 2 backend workers for better performance
3. **MongoDB Performance:** Enough RAM for effective caching
4. **Growth Room:** Can handle 10x traffic increase before scaling
5. **Cost-Effective:** Only $12/month for professional hosting
6. **Monitoring:** Comfortable headroom for monitoring tools

---

### Expected Performance

**With 2 slices, you can handle:**

| Metric | Expected Capacity |
|--------|-------------------|
| **Daily Users** | 1,000-2,000 |
| **Page Views/Day** | 5,000-10,000 |
| **Concurrent Users** | 50-100 |
| **API Requests/Day** | 50,000-100,000 |
| **Database Size** | 5-10GB (before performance impact) |

**When to Scale Up:**
- Consistently exceeding 70% RAM usage
- CPU load averaging > 80% over extended periods
- Database size > 15GB
- Response times > 500ms average

---

### Upgrade Path

**When needed (typically after 6-12 months):**

**Option 1: Add 1 Slice** (+$6/month)
- Total: 3 slices = 6GB RAM, 3 cores, 75GB storage
- Good for: 2x-3x traffic increase

**Option 2: Add 2 Slices** (+$12/month)
- Total: 4 slices = 8GB RAM, 4 cores, 100GB storage
- Good for: 4x-5x traffic increase or better performance headroom

**Option 3: Separate Database**
- Keep 2 slices for applications
- Use MongoDB Atlas for database (from $9/month)
- Better: Dedicated database resources

---

## Final Checklist Before Ordering

Before VPS setup begins, confirm:

- [ ] **VPS Plan Selected:** 2 slices (4GB RAM, 2 CPU cores, 50GB SSD)
- [ ] **Operating System:** Ubuntu 22.04 LTS
- [ ] **Budget Approved:** $12-15/month (including domain)
- [ ] **DNS Provider Access:** Confirmed (Cloudflare or registrar)
- [ ] **Third-Party Services:** Cloudinary, email service, SMS (if needed)
- [ ] **Monitoring Plan:** Basic PM2 monitoring or Sentry (optional)

---

## Document Version

**Version:** 1.0
**Last Updated:** January 18, 2026
**Author:** Ementech Deployment Team

**References:**
- Interserver VPS pricing: https://www.interserver.net/vps/
- MongoDB RAM requirements: https://www.mongodb.com/docs/manual/administration/production-notes/
- PM2 cluster mode: https://pm2.keymetrics.io/docs/usage/cluster-mode/
