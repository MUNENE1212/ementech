# DumuWaks 2.0 - Technology Decisions

## Overview

This document records all major technology decisions made during the architecture design phase, including trade-off analysis, rationale, and alternatives considered.

---

## Table of Contents

1. [Architecture Decisions](#architecture-decisions)
2. [Database Technology](#database-technology)
3. [Backend Framework & Libraries](#backend-framework--libraries)
4. [Frontend Technology](#frontend-technology)
5. [Notification & Communication](#notification--communication)
6. [Job Scheduling & Queues](#job-scheduling--queues)
7. [Caching Strategy](#caching-strategy)
8. [Monitoring & Observability](#monitoring--observability)
9. [Infrastructure & Deployment](#infrastructure--deployment)
10. [Security Decisions](#security-decisions)

---

## Architecture Decisions

### ADR-001: Monolithic vs Microservices

**Status:** Accepted

**Context:**
- DumuWaks 2.0 is currently a monolithic MERN stack application
- Team size is small (< 10 developers)
- Pricing and Review systems need to integrate deeply with existing Booking system
- Need to release features quickly to market

**Decision:** **Start with Monolithic, prepare for microservices**

**Rationale:**

**Pros of Monolithic (Current Choice):**
- ✅ Faster development (no distributed system complexity)
- ✅ Simpler deployment (single artifact)
- ✅ Easier debugging (everything in one process)
- ✅ No network latency between services
- ✅ Lower operational complexity
- ✅ Shared data models (no API versioning between services)

**Pros of Microservices (Future):**
- ✅ Independent scaling (scale review system separately)
- ✅ Technology diversity (different DB per service)
- ✅ Fault isolation (review system crash doesn't affect bookings)
- ✅ Team autonomy (different teams can deploy independently)

**Trade-offs:**
| Aspect | Monolithic | Microservices |
|--------|-----------|---------------|
| Development Speed | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| Operational Complexity | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| Scalability | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Fault Isolation | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| Data Consistency | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |

**Implementation Strategy:**
1. Build pricing and review as **modules** within monolith
2. Use **clear boundaries** (separate routes, services, models)
3. Use **feature flags** for gradual rollout
4. Design **APIs as if microservices** (clean contracts)
5. When to extract: Team > 10 developers OR single component causes > 50% of load

**Alternatives Considered:**
- **Modular Monolith:** Similar choice, but with stricter module boundaries
- **Service-Oriented Architecture (SOA):** Too heavy for current scale
- **Serverless Functions:** Too complex for stateful operations

**Consequences:**
- Positive: Faster time-to-market (3 months vs 6 months)
- Positive: Easier onboarding for new developers
- Negative: May need refactor in 12-18 months if scaling needs change
- Negative: Single point of failure (mitigated with redundancy)

---

## Database Technology

### ADR-002: MongoDB (NoSQL) vs PostgreSQL (SQL)

**Status:** Accepted

**Context:**
- Need to store diverse pricing models (flat, hourly, tiered, package)
- Pricing data is hierarchical and varies by type
- Need geospatial queries for location-based pricing
- Existing platform uses MongoDB
- Data will grow to millions of pricing records and reviews

**Decision:** **MongoDB (NoSQL)**

**Rationale:**

**Why MongoDB Fits:**

1. **Flexible Schema for Pricing Models**
   ```javascript
   // Single collection supports all pricing types
   {
     pricingType: "tiered",
     tiers: [/* array of tiers */],
     // OR
     pricingType: "flat",
     flatRate: 500
   }
   ```
   vs SQL: Would need separate tables OR complex JSON column queries

2. **Hierarchical Data**
   - Tiers within pricing
   - Packages with included services
   - Dynamic pricing rules
   - Natural fit for document model

3. **Geospatial Queries**
   ```javascript
   {
     location: {
       type: "Point",
       coordinates: [36.8219, -1.2864]
     }
   }

   // Find providers within 10km
   db.ServicePricing.find({
     location: {
       $near: {
         $geometry: { type: "Point", coordinates: [...] },
         $maxDistance: 10000
       }
     }
   })
   ```
   Native 2dsphere indexes, optimized for location queries

4. **Aggregation Pipeline**
   ```javascript
   // Calculate market rates
   db.ServicePricing.aggregate([
     { $match: { serviceCategoryId: ObjectId("...") } },
     { $group: {
         _id: null,
         avgPrice: { $avg: "$flatRate" },
         minPrice: { $min: "$flatRate" },
         percentile75: { $percentile: ["$flatRate", 0.75] }
       }
     }
   ])
   ```

5. **Existing Infrastructure**
   - Team already knows MongoDB
   - No migration cost
   - Consistent with current stack

**Trade-offs:**

| Aspect | MongoDB | PostgreSQL |
|--------|---------|-----------|
| Schema Flexibility | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| Query Complexity | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Data Integrity | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Geospatial | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Horizontal Scaling | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| Learning Curve | ⭐⭐⭐⭐ | ⭐⭐⭐ |

**PostgreSQL Advantages Not Chosen:**
- ✅ ACID compliance (but MongoDB has transactions now)
- ✅ Complex JOINs (not needed for our use case)
- ✅ Mature ecosystem (true, but MongoDB is close)
- ✅ Data integrity via constraints (must enforce in app layer)

**Mitigation Strategies for MongoDB:**
1. **Application-Level Validation**
   - Mongoose schemas for structure
   - Custom validators for business rules
   - Pre/post hooks for data integrity

2. **Transactions (MongoDB 4.0+)**
   ```javascript
   session.startTransaction();
   try {
     // Update pricing
     // Create audit trail
     session.commitTransaction();
   } catch (error) {
     session.abortTransaction();
   }
   ```

3. **Index Strategy**
   - Compound indexes for common queries
   - Geospatial indexes for location
   - TTL indexes for expiry

**Alternatives Considered:**
- **PostgreSQL with JSONB:** Good middle ground, but geospatial queries slower
- **MySQL:** Similar to PostgreSQL, less flexible JSON support
- **DynamoDB:** Too expensive, limited query capabilities

**Consequences:**
- Positive: Development speed 2x faster (no complex migrations)
- Positive: Natural fit for pricing data structure
- Negative: Must implement validation in application code
- Negative: Aggregation queries can be complex (mitigated with proper indexing)

---

## Backend Framework & Libraries

### ADR-003: Express.js vs Fastify vs Koa

**Status:** Accepted

**Context:**
- Existing backend uses Express.js
- Need high-performance APIs for pricing calculations
- Need robust middleware ecosystem
- Team expertise in Express

**Decision:** **Express.js** (stay with current)

**Rationale:**

| Framework | Performance | Ecosystem | Team Expertise | Middleware |
|-----------|------------|-----------|----------------|------------|
| **Express.js** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Fastify | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ |
| Koa | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ |

**Why Express.js:**
- ✅ **Ecosystem:** Largest middleware ecosystem (authentication, validation, logging)
- ✅ **Team Expertise:** No learning curve
- ✅ **Battle-Tested:** Used by thousands of production apps
- ✅ **Flexibility:** Can structure as needed (MVC, modular, etc.)

**When to Switch to Fastify:**
- Response time > 500ms consistently
- Need 20,000+ requests/second
- Team has capacity to migrate (2-3 weeks)

**Current Performance:**
- Target: < 200ms for pricing APIs
- Express.js can handle 5,000-10,000 req/s with proper optimization

---

### ADR-004: Bull Queue vs Agenda vs RabbitMQ

**Status:** Accepted

**Context:**
- Need to schedule review requests at optimal times
- Need retries for failed SMS/push notifications
- Need job dashboard for monitoring
- Already using Redis for caching

**Decision:** **Bull Queue**

**Rationale:**

| Queue System | Pros | Cons | Score |
|--------------|------|------|-------|
| **Bull** | • Redis-backed (fast)  <br>• Built-in retries  <br>• Job dashboard UI  <br>• Cron scheduling  <br>• TypeScript support | • Requires Redis  <br>• Smaller community than RabbitMQ | ⭐⭐⭐⭐⭐ |
| **Agenda** | • MongoDB-backed  <br>• Good scheduling | • No native retries  <br>• Slower than Redis  <br>• Less active | ⭐⭐⭐ |
| **RabbitMQ** | • Battle-tested  <br>• Very mature  <br>• Complex routing | • Separate infrastructure  <br>• More complex setup  <br>• Higher learning curve | ⭐⭐⭐⭐ |

**Why Bull Queue:**

1. **Redis Already in Stack**
   - Using Redis for caching
   - No additional infrastructure
   - Low operational overhead

2. **Built-in Features**
   ```javascript
   const reviewQueue = new Bull('review-requests', {
     redis: { port: 6379 },
     defaultJobOptions: {
       attempts: 3,
       backoff: {
         type: 'exponential',
         delay: 2000
       },
       removeOnComplete: 100 // Keep last 100 jobs
     }
   });

   // Schedule review request
   await reviewQueue.add(
     { bookingId, customerId },
     {
       delay: 2 * 60 * 60 * 1000, // 2 hours
       jobId: `booking-${bookingId}` // Deduplicate
     }
   );
   ```

3. **Dashboard UI**
   ```javascript
   const ui = new BullAdapter(reviewQueue);
   const router = createBullBoard([ui]);
   app.use('/admin/queues', router);
   ```
   Visual interface for monitoring queues

4. **Cron Scheduling**
   ```javascript
   // Aggregate analytics every night
   analyticsQueue.add('aggregate', {}, {
     repeat: { cron: '0 2 * * *' } // 2 AM daily
   });
   ```

**Alternatives Considered:**
- **Agenda:** MongoDB-backed is nice, but Redis is faster for queue operations
- **RabbitMQ:** Overkill for current scale, adds operational complexity
- **AWS SQS:** Good option if on AWS, but vendor lock-in

---

## Frontend Technology

### ADR-005: React Query vs Redux vs SWR

**Status:** Accepted

**Context:**
- Need to manage server state (pricing, reviews)
- Need caching for pricing data
- Need real-time updates for review status
- Using React for frontend

**Decision:** **React Query (TanStack Query)**

**Rationale:**

| State Management | Server State | Client State | Caching | Real-time |
|------------------|--------------|--------------|---------|-----------|
| **React Query** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Redux | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐ |
| SWR | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |

**Why React Query:**

1. **Built-in Caching**
   ```javascript
   const { data: pricing } = useQuery(
     ['provider-pricing', providerId],
     () => fetchProviderPricing(providerId),
     {
       staleTime: 60 * 60 * 1000, // 1 hour
       cacheTime: 24 * 60 * 60 * 1000 // 24 hours
     }
   );
   ```
   Automatic caching, no manual cache management

2. **Background Refetching**
   - Data stays fresh
   - Optimistic updates
   - Invalidations on mutations

3. **Real-time with Polling/WebSockets**
   ```javascript
   useQuery(['reviews', providerId], fetchReviews, {
     refetchInterval: 30 * 1000 // Poll every 30s
   });
   ```

4. **Less Boilerplate**
   - No actions, reducers, selectors
   - Simple hooks
   - Easy to learn

**When to Use Redux (in addition to React Query):**
- Complex client state (multi-step forms)
- Need for time-travel debugging
- Very large state (thousands of items)

**Hybrid Approach:**
```javascript
// React Query for server state
const { data: pricing } = useQuery(['pricing', id]);

// React Context for client state
const { selectedTier } = usePricingContext();
```

---

## Notification & Communication

### ADR-006: Notification Channel Strategy

**Status:** Accepted

**Context:**
- Need to send review requests
- Target market is Kenya (high WhatsApp usage)
- Cost constraints (SMS costs money)
- Need high response rates

**Decision:** **Multi-Channel Strategy with Priority Order**

**Channel Priority:**
1. **Push Notification** (First choice - Free)
2. **WhatsApp Business API** (Second - High engagement)
3. **SMS** (Third - Universal but costly)
4. **Email** (Last resort - Low open rate)

**Channel Selection Logic:**
```javascript
function selectChannel(userPreferences, installedApp) {
  // Priority 1: Push (if app installed)
  if (installedApp && userPreferences.pushEnabled) {
    return 'push';
  }

  // Priority 2: WhatsApp (high engagement in Kenya)
  if (userPreferences.whatsappEnabled && user.whatsappNumber) {
    return 'whatsapp';
  }

  // Priority 3: SMS (fallback)
  if (userPreferences.smsEnabled && user.phone) {
    return 'sms';
  }

  // Priority 4: Email (last resort)
  return 'email';
}
```

**Cost Optimization:**
| Channel | Cost per Message | Response Rate | Monthly Cost (10k msgs) |
|---------|------------------|---------------|-------------------------|
| Push | KES 0 | 45% | KES 0 |
| WhatsApp | KES 0.50 | 55% | KES 5,000 |
| SMS | KES 1.50 | 37% | KES 15,000 |
| Email | KES 0.10 | 15% | KES 1,000 |

**Strategy:**
- Try push first (100% of users with app)
- Fallback to WhatsApp for users without app (if available)
- SMS only for critical messages or users without WhatsApp
- Email for promotional content (not time-sensitive)

**Providers:**
- **Push:** Firebase Cloud Messaging (FCM) - Free, scalable
- **WhatsApp:** Meta WhatsApp Business API - KES 0.50/message
- **SMS:** Africa's Talking (local) - KES 1.20/message
- **Email:** SendGrid - Free tier (100 emails/day)

---

### ADR-007: Firebase FCM vs OneSignal

**Status:** Accepted

**Context:**
- Need push notification service
- Need reliable delivery
- Need rich notification support
- Budget constraints

**Decision:** **Firebase Cloud Messaging (FCM)**

**Rationale:**

| Feature | FCM | OneSignal |
|---------|-----|-----------|
| Cost | Free | Freemium (10k free) |
| Delivery | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Rich Media | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Dashboard | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| SDK Size | Small | Large |
| Support | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

**Why FCM:**
- ✅ Completely free (unlimited notifications)
- ✅ Reliable (Google infrastructure)
- ✅ Rich notifications (images, actions)
- ✅ Topic-based messaging (segments)
- ✅ Already using Firebase for auth

**OneSignal Advantages Not Chosen:**
- Better dashboard
- Easier setup
- Better analytics
- But: Paid tier starts at 10k users (we'll exceed)

---

## Caching Strategy

### ADR-008: Redis vs Memcached

**Status:** Accepted

**Context:**
- Need to cache pricing data
- Need to cache review aggregations
- Need to cache user sessions
- Need persistence across restarts

**Decision:** **Redis**

**Rationale:**

| Feature | Redis | Memcached |
|---------|-------|-----------|
| Persistence | ✅ Yes | ❌ No |
| Data Structures | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| Pub/Sub | ✅ Yes | ❌ No |
| Memory Efficiency | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Speed | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Ecosystem | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |

**Why Redis:**

1. **Persistence**
   - Pricing data cached persists across restarts
   - RDB snapshots + AOF logging
   - Memcached: Lost on restart (cold start)

2. **Data Structures**
   ```javascript
   // Hash: Provider pricing
   await client.hSet('provider:123', {
     'service:haircut': JSON.stringify(pricing),
     'service:massage': JSON.stringify(pricing)
   });

   // Sorted Set: Review leaderboard
   await client.zAdd('reviews:top-providers', [
     { score: 4.8, value: 'provider:123' },
     { score: 4.7, value: 'provider:456' }
   ]);
   ```

3. **Pub/Sub for Real-time**
   ```javascript
   // Subscribe to provider updates
   subscriber.subscribe('provider:123-updates');

   // Publish updates
   publisher.publish('provider:123-updates', JSON.stringify(update));
   ```

4. **Already Using for Bull Queue**
   - Single Redis instance for cache + queue
   - Cost savings (infrastructure reuse)

**Cache Strategy:**
```javascript
// Pricing cache (long TTL)
await redis.setex(
  `pricing:${providerId}:${serviceId}`,
  60 * 60, // 1 hour
  JSON.stringify(pricing)
);

// Review aggregations (short TTL)
await redis.setex(
  `reviews:aggregate:${providerId}`,
  15 * 60, // 15 minutes
  JSON.stringify(stats)
);

// Market rates (very long TTL)
await redis.setex(
  `market:rates:${categoryId}:${city}`,
  24 * 60 * 60, // 24 hours
  JSON.stringify(rates)
);
```

---

## Monitoring & Observability

### ADR-009: CloudWatch vs Datadog vs New Relic

**Status:** Accepted

**Context:**
- Need application performance monitoring
- Need error tracking
- Need logging
- Budget constraints

**Decision:** **AWS CloudWatch** (if on AWS) OR **Datadog** (if budget allows)

**Current Choice:** Start with **CloudWatch** (cost-effective)

**Rationale:**

| Feature | CloudWatch | Datadog | New Relic |
|---------|-----------|---------|-----------|
| Cost | ⭐⭐⭐⭐⭐ (Free tier) | ⭐⭐⭐ ($15/host) | ⭐⭐⭐ |
| AWS Integration | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| Ease of Use | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Alerts | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Dashboards | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

**Why CloudWatch (Start):**
- ✅ Free tier (10 custom metrics, 5 GB logs)
- ✅ Native AWS integration
- ✅ No setup needed if using AWS
- ✅ Sufficient for initial scale

**Upgrade Path to Datadog When:**
- Need more than 10 custom metrics
- Need better dashboards
- Need APM (distributed tracing)
- Monthly cost < KES 10,000 is acceptable

**Current Stack:**
```javascript
// Logging: Winston → CloudWatch Logs
const winston = require('winston');
require('winston-cloudwatch');

// Metrics: AWS SDK → CloudWatch Metrics
const { CloudWatch } = require('@aws-sdk/client-cloudwatch');

// Alerts: CloudWatch Alarms
// - Review response rate < 15%
// - API latency > 500ms
// - Error rate > 5%
```

---

## Infrastructure & Deployment

### ADR-010: AWS vs DigitalOcean vs Azure

**Status:** Accepted

**Context:**
- Need reliable hosting
- Need managed database (MongoDB Atlas)
- Need easy deployment
- Need cost-effective solution
- Target market is Kenya (low latency)

**Decision:** **AWS** (for compute) + **MongoDB Atlas** (for database)

**Rationale:**

**Infrastructure Setup:**
```yaml
# AWS (Compute)
- EC2 / ECS: Application servers
- S3: Static assets, photo storage
- CloudFront: CDN for static content
- Route 53: DNS management
- ElastiCache: Redis (optional, or self-hosted)

# MongoDB Atlas (Database)
- M10 cluster (production)
- Auto-scaling
- Backups automated
- Global distribution (optional)
```

**Why AWS:**
- ✅ **Kenya Region:** Cape Town (af-south-1) - low latency to Kenya
- ✅ **Reliability:** 99.99% SLA
- ✅ **Ecosystem:** Everything needed in one place
- ✅ **Free Tier:** 12 months free tier helps bootstrap

**Why MongoDB Atlas:**
- ✅ **Managed Service:** No DB administration overhead
- ✅ **Backups:** Automated continuous backups
- ✅ **Global Distribution:** Can add regions later
- ✅ **Monitoring:** Built-in performance metrics

**Cost Comparison (Monthly):**
| Provider | EC2 + DB | Total (3 instances) |
|----------|----------|---------------------|
| AWS (EC2 + Atlas) | $150 + $57 | ~$207 (~KES 26,000) |
| DigitalOcean (Droplet + Atlas) | $90 + $57 | ~$147 (~KES 18,500) |
| Azure (VM + Cosmos DB) | $180 + $150 | ~$330 (~KES 41,000) |

**Decision:** AWS is slightly more expensive but offers:
- Better Kenya region support
- More mature ecosystem
- Easier hiring (AWS skills common)

---

## Security Decisions

### ADR-011: JWT vs Session-Based Auth

**Status:** Accepted

**Context:**
- Need stateless authentication for API
- Need to support mobile apps
- Need role-based access (provider, customer, admin)

**Decision:** **JWT (JSON Web Tokens)**

**Rationale:**

| Aspect | JWT | Sessions |
|--------|-----|----------|
| Scalability | ⭐⭐⭐⭐⭐ (stateless) | ⭐⭐⭐ (store session) |
| Mobile Support | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| Security | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Performance | ⭐⭐⭐⭐⭐ (no DB lookup) | ⭐⭐⭐⭐ |
| Revocation | ⭐⭐ | ⭐⭐⭐⭐⭐ |

**Why JWT:**

1. **Stateless Authentication**
   ```javascript
   // No database lookup on each request
   const decoded = jwt.verify(token, process.env.JWT_SECRET);
   // User data available immediately
   ```

2. **Mobile-Friendly**
   - Store token securely on device
   - No session cookies needed
   - Works across multiple domains

3. **Role-Based Access**
   ```javascript
   const token = jwt.sign({
     userId: user._id,
     role: 'provider', // customer, admin
     permissions: ['read:pricing', 'write:pricing']
   }, secret, { expiresIn: '7d' });
   ```

4. **Performance**
   - No database roundtrip for auth check
   - Faster API responses

**JWT Implementation:**
```javascript
// Access token (short-lived)
const accessToken = jwt.sign(
  { userId, role },
  process.env.JWT_SECRET,
  { expiresIn: '15m' }
);

// Refresh token (long-lived)
const refreshToken = jwt.sign(
  { userId },
  process.env.REFRESH_SECRET,
  { expiresIn: '7d' }
);
```

**Revocation Strategy (JWT Weakness):**
- Store revoked tokens in Redis (blacklist)
- Or use short access tokens + refresh tokens
- Refresh token rotation on each use

---

## Summary of Technology Stack

### Frontend
- **Framework:** React 18
- **State Management:** React Query + React Context
- **Forms:** React Hook Form
- **Styling:** TailwindCSS
- **Charts:** Recharts (analytics dashboards)

### Backend
- **Runtime:** Node.js 20 LTS
- **Framework:** Express.js
- **Database:** MongoDB (MongoDB Atlas)
- **ORM/ODM:** Mongoose
- **Authentication:** JWT + Passport.js
- **Validation:** Joi
- **API Docs:** Swagger/OpenAPI

### Infrastructure
- **Hosting:** AWS (EC2 / ECS)
- **CDN:** CloudFront
- **Database:** MongoDB Atlas (M10 cluster)
- **Caching:** Redis (ElastiCache or self-hosted)
- **Queue:** Bull (Redis-backed)
- **File Storage:** AWS S3
- **Email:** SendGrid
- **SMS:** Africa's Talking
- **Push:** Firebase FCM
- **Monitoring:** AWS CloudWatch
- **Logging:** Winston + CloudWatch Logs

### DevOps
- **Version Control:** Git + GitHub
- **CI/CD:** GitHub Actions
- **Containerization:** Docker
- **Orchestration:** ECS (future: Kubernetes)
- **Terraform:** Infrastructure as Code (optional)

---

## Technology Radar

### Adopt (Use Now)
- ✅ React 18
- ✅ Node.js 20 LTS
- ✅ MongoDB 7.0
- ✅ Redis 7.0
- ✅ React Query
- ✅ Bull Queue

### Trial (Evaluate)
- 🧪 Next.js (for future migration)
- 🧪 Prisma (alternative to Mongoose)
- 🧪 tRPC (type-safe APIs)
- 🧪 Turborepo (monorepo management)

### Assess (Research)
- 🔍 GraphQL (alternative to REST)
- 🔍 gRPC (for microservices communication)
- 🔍 Kafka (for event streaming)
- 🔍 ClickHouse (for analytics)

### Hold (Avoid)
- ❌ Angular (not aligned with stack)
- ❌ PHP/Laravel (not aligned with stack)
- ❌ Microservices (too early)
- ❌ Kubernetes (too complex for current scale)

---

This completes the Technology Decisions documentation. All decisions are based on project constraints, team expertise, budget, and scalability requirements.
