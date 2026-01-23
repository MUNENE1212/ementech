# Admin Dashboard - System Architecture

## Executive Summary

The EmenTech Admin Dashboard is a **modular monolithic application** designed for high scalability and real-time monitoring of multiple websites. The architecture prioritizes performance, maintainability, and future microservices migration capability.

**Key Architectural Decisions:**
- **Pattern**: Modular Monolith (can evolve to microservices)
- **Frontend**: Next.js 14 with App Router for optimal performance and SEO
- **Backend**: Fastify for high-performance API endpoints
- **Real-time**: Socket.IO for live monitoring updates
- **Database**: MongoDB Atlas (time-series optimized) + Redis for caching
- **Deployment**: Same VPS initially, designed for horizontal scaling

---

## 1. Architecture Pattern: Modular Monolith

### Why Modular Monolith?

**Advantages for This Use Case:**
1. **Faster Development**: Single deployment, simpler debugging
2. **Better Performance**: No network latency between services
3. **Cost Effective**: Runs efficiently on existing VPS
4. **Easy to Scale**: Can add more VPS instances with load balancer
5. **Future Migration**: Modules can be extracted to microservices later

**Monolith vs Microservices Trade-off:**

| Aspect | Monolith | Microservices |
|--------|----------|---------------|
| **Development Speed** | Fast (single codebase) | Slower (distributed complexity) |
| **Deployment** | Simple (one unit) | Complex (orchestration needed) |
| **Performance** | Better (in-process calls) | Worse (network overhead) |
| **Scalability** | Vertical (add resources) | Horizontal (add instances) |
| **Team Size** | Small teams ideal | Large teams needed |
| **Cost** | Lower infrastructure | Higher infrastructure |
| **Our Choice** | Selected for MVP | Future phase |

**Migration Path to Microservices:**
When monitoring 100+ sites, extract modules:
- `health-check-service` - Handles all monitoring
- `analytics-service` - Data aggregation and processing
- `alert-service` - Notification management
- `auth-service` - Authentication and authorization

---

## 2. High-Level Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                         Client Layer                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │
│  │   Web Browser│  │  Mobile App  │  │  API Clients │            │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘            │
└─────────┼──────────────────┼──────────────────┼──────────────────┘
          │                  │                  │
          │ HTTPS + WebSocket│                  │
          └──────────────────┼──────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────────┐
│                      Nginx Reverse Proxy                            │
│                    (SSL Termination, Routing)                       │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼────────┐  ┌──────▼────────┐  ┌───────▼────────┐
│   EmenTech     │  │ Admin         │  │   Dumuwaks     │
│   Frontend     │  │ Dashboard     │  │   Frontend     │
│   (Static)     │  │ (Next.js App) │  │   (Static)     │
└────────────────┘  └──────┬────────┘  └────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                   │                   │
┌───────▼────────┐  ┌──────▼────────┐  ┌───────▼────────┐
│   EmenTech     │  │ Admin Dashboard│  │   Dumuwaks     │
│   Backend API  │  │ Backend API    │  │   Backend API  │
│   (Express)    │  │   (Fastify)    │  │   (Express)    │
└───────┬────────┘  └──────┬────────┘  └───────┬────────┘
        │                  │                   │
        └──────────────────┼───────────────────┘
                           │
        ┌──────────────────┼───────────────────┐
        │                  │                   │
┌───────▼────────┐  ┌──────▼────────┐  ┌───────▼────────┐
│   MongoDB      │  │    Redis      │  │   Socket.IO    │
│   Atlas        │  │   (Cache +    │  │   (Real-time)  │
│   (Primary DB) │  │    Queue)     │  │                │
└────────────────┘  └───────────────┘  └────────────────┘
                           │
                  ┌────────▼────────┐
                  │  Background     │
                  │  Jobs (Bull)    │
                  │  - Health Checks│
                  │  - Data Aggregation│
                  │  - Alerts       │
                  └─────────────────┘
```

---

## 3. Frontend Architecture

### 3.1 Framework: Next.js 14 (App Router)

**Why Next.js over React + Vite?**

| Feature | Next.js 14 | React + Vite |
|---------|------------|--------------|
| **Server-Side Rendering** | Built-in | Manual setup |
| **API Routes** | Built-in | Need separate backend |
| **File-based Routing** | Yes | Need React Router |
| **Image Optimization** | Built-in | Manual |
| **Code Splitting** | Automatic | Manual |
| **SEO** | Excellent | Manual setup |
| **Performance** | Optimized | Good |
| **Learning Curve** | Medium | Low |
| **Best For** | Full-stack apps | SPAs |

**Decision**: Next.js 14 because:
1. Admin dashboard needs SEO (searchable documentation)
2. Built-in API routes for BFF (Backend for Frontend) pattern
3. Server components for better performance
4. Easy deployment to VPS with PM2
5. Future: Can deploy to Vercel for edge functions

### 3.2 UI Component Library: shadcn/ui + Radix UI

**Why shadcn/ui?**

- **Not a component library** - it's code you own
- **Built on Radix UI** - accessible, unstyled components
- **Tailwind CSS** - consistent with existing tech stack
- **Customizable** - full control over components
- **Modern Design** - beautiful, professional UI
- **TypeScript** - fully typed
- **No runtime dependencies** - compiles to plain components

**Alternative Considered**: MUI, Chakra UI, Ant Design
**Rejection**: Too opinionated, harder to customize, larger bundle size

### 3.3 State Management: Zustand + React Query

**Zustand** (Client State)
- Simple, lightweight (1KB)
- No context provider hell
- TypeScript friendly
- Great for UI state (modals, filters, themes)

**React Query** (Server State)
- Caching, revalidation, background updates
- Optimistic updates
- Pagination, infinite scroll
- DevTools for debugging
- Perfect for API data management

### 3.4 Real-time Updates: Socket.IO Client

**Why Socket.IO over WebSockets?**
- Automatic reconnection
- Fallback to polling
- Room-based communication
- Event-driven architecture
- Already used in existing backend

### 3.5 Data Visualization

**Primary**: Recharts (simple, responsive)
- React-friendly
- SSR compatible
- Good for basic charts

**Advanced**: D3.js (complex visualizations)
- Full control
- Custom visualizations
- Heatmaps, sankey diagrams

### 3.6 Frontend Module Structure

```
admin-dashboard-frontend/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Auth group layout
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/         # Dashboard group layout
│   │   ├── page.tsx         # Main overview
│   │   ├── sites/           # Site management
│   │   │   ├── page.tsx     # Sites list
│   │   │   └── [id]/        # Site detail
│   │   │       ├── page.tsx # Site overview
│   │   │       ├── analytics/
│   │   │       ├── health/
│   │   │       └── settings/
│   │   ├── alerts/
│   │   ├── reports/
│   │   └── settings/
│   ├── api/                 # API routes (BFF)
│   │   └── ...
│   ├── layout.tsx           # Root layout
│   └── globals.css          # Global styles
├── components/
│   ├── ui/                  # shadcn/ui components
│   ├── dashboard/           # Dashboard-specific
│   │   ├── SiteCard.tsx
│   │   ├── HealthIndicator.tsx
│   │   ├── MetricCard.tsx
│   │   └── ...
│   ├── analytics/
│   │   ├── LineChart.tsx
│   │   ├── BarChart.tsx
│   │   ├── Heatmap.tsx
│   │   └── ...
│   └── layout/
│       ├── Header.tsx
│       ├── Sidebar.tsx
│       └── Footer.tsx
├── lib/
│   ├── api.ts               # API client (fetch wrapper)
│   ├── socket.ts            # Socket.IO client
│   ├── query.ts             # React Query setup
│   └── utils.ts             # Utility functions
├── hooks/
│   ├── useSites.ts          # Site data hook
│   ├── useHealthChecks.ts   # Health check hook
│   ├── useAnalytics.ts      # Analytics data hook
│   └── useSocket.ts         # Socket hook
├── stores/
│   ├── ui.ts                # UI state (Zustand)
│   └── filters.ts           # Filter state
└── types/
    └── index.ts             # TypeScript types
```

---

## 4. Backend Architecture

### 4.1 Framework: Fastify over Express

**Why Fastify?**

| Metric | Express | Fastify |
|--------|---------|---------|
| **Performance** | Baseline | 2x faster |
| **JSON Validation** | Manual | Built-in (JSON Schema) |
| **Logging** | Morgan | Pino (structured) |
| **TypeScript** | Good | Excellent |
| **Overhead** | Higher | Lower |
| **Ecosystem** | Massive | Large & Growing |
| **Learning Curve** | Low | Low |

**Benchmark** (requests/second):
```
Express.js:     ~30,000 req/s
Fastify:        ~70,000 req/s
Native Node.js: ~90,000 req/s
```

**Decision**: Fastify because:
1. Admin dashboard makes many API requests
2. JSON validation out of the box
3. Better TypeScript support
4. Schema-based serialization
5. Compatible with Express middleware

**Note**: Keep Express for EmenTech & Dumuwaks (no need to migrate working apps)

### 4.2 Backend Module Structure

```
admin-dashboard-backend/
├── src/
│   ├── server.js             # Entry point
│   ├── config/
│   │   ├── database.js       # MongoDB connection
│   │   ├── redis.js          # Redis connection
│   │   ├── socket.js         # Socket.IO setup
│   │   └── env.js            # Environment variables
│   ├── routes/
│   │   ├── auth.routes.js    # Authentication
│   │   ├── sites.routes.js   # Site management
│   │   ├── health.routes.js  # Health check data
│   │   ├── analytics.routes.js
│   │   ├── alerts.routes.js
│   │   ├── users.routes.js   # User management
│   │   └── reports.routes.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── sites.controller.js
│   │   ├── health.controller.js
│   │   ├── analytics.controller.js
│   │   └── ...
│   ├── services/
│   │   ├── health.service.js      # Health check logic
│   │   ├── analytics.service.js   # Data aggregation
│   │   ├── alert.service.js       # Alert management
│   │   ├── site.service.js        # Site management
│   │   └── email.service.js       # Email notifications
│   ├── models/
│   │   ├── Site.js
│   │   ├── HealthCheck.js
│   │   ├── Analytics.js
│   │   ├── Alert.js
│   │   └── User.js
│   ├── workers/
│   │   ├── health.worker.js       # Scheduled health checks
│   │   ├── analytics.worker.js    # Data aggregation
│   │   └── alert.worker.js        # Alert processing
│   ├── middleware/
│   │   ├── auth.js                # JWT verification
│   │   ├── rbac.js                # Role-based access control
│   │   ├── validation.js          # Request validation
│   │   └── errorHandler.js        # Global error handler
│   ├── utils/
│   │   ├── http.js                # HTTP checker
│   │   ├── ping.js                # ICMP ping
│   │   ├── ssl.js                 # SSL checker
│   │   ├── dns.js                 # DNS lookup
│   │   └── metrics.js             # Metrics calculator
│   └── socket/
│       ├── handlers/
│       │   ├── health.handler.js  # Real-time health updates
│       │   └── alert.handler.js   # Real-time alerts
│       └── rooms.js               # Socket room management
└── package.json
```

### 4.3 Job Queue: Bull (Redis-based)

**Why Bull over Cron?**

| Feature | Cron | Bull (Redis) |
|---------|------|--------------|
| **Scheduling** | Fixed intervals | Dynamic scheduling |
| **Concurrency** | Single process | Multiple workers |
| **Retries** | Manual | Automatic |
| **Priority** | No | Yes |
| **Monitoring** | Difficult | Built-in UI (Bull Board) |
| **Persistence** | No | Yes (Redis) |

**Jobs Types**:
1. **Health Check Jobs** - Run every 1-5 minutes per site
2. **Analytics Aggregation** - Run every hour
3. **Alert Processing** - Run immediately on trigger
4. **Data Cleanup** - Run daily (delete old data)
5. **SSL/Domain Checks** - Run daily

**Job Flow**:
```
Site Added → Create Health Check Job → Queue → Worker Processes
                                                    ↓
                                          Emit Socket Event
                                                    ↓
                                          Store in MongoDB
                                                    ↓
                                          Check Alert Rules
                                                    ↓
                                          Send Notification (if needed)
```

---

## 5. Database Architecture

### 5.1 MongoDB Atlas (Primary Database)

**Why MongoDB?**
- **Already in use** - No new infrastructure cost
- **Flexible schema** - Easy to evolve data models
- **Time-series collections** - Optimized for monitoring data
- **Horizontal scaling** - Ready for future growth
- **Aggregation pipeline** - Powerful analytics queries

**Time-Series Collections** (MongoDB 5.0+):
```javascript
// Health check time-series collection
db.createCollection("healthchecks", {
  timeseries: {
    timeField: "timestamp",
    metaField: "metadata",
    granularity: "seconds"
  }
});
```

**Benefits**:
- Automatic data partitioning
- Efficient time-based queries
- 40-60% storage savings
- Faster aggregations

### 5.2 Redis (Cache & Queue)

**Use Cases**:

1. **Session Storage**
   ```javascript
   // User sessions
   session:userId -> { token, expiry, data }
   ```

2. **API Response Caching**
   ```javascript
   // Cache health check data for 1 minute
   health:siteId -> JSON response (TTL: 60s)
   ```

3. **Rate Limiting**
   ```javascript
   // API rate limiting
   ratelimit:userId:api:endpoint -> count (TTL: 60s)
   ```

4. **Job Queues** (Bull)
   ```javascript
   bull:health:checks -> Queue
   bull:analytics:jobs -> Queue
   ```

5. **Real-time State**
   ```javascript
   // Current site status (fast access)
   status:siteId -> { status, lastCheck, uptime % }
   ```

6. **Pub/Sub**
   ```javascript
   // Cross-process communication
   channel:health-updates -> Publish updates
   ```

---

## 6. Real-time Communication

### 6.1 Socket.IO Architecture

**Events**:

```javascript
// Client → Server
socket.emit('subscribe:site', siteId)
socket.emit('unsubscribe:site', siteId)
socket.emit('get:realtime-metrics', siteId)

// Server → Client
socket.emit('health:update', { siteId, status, metrics })
socket.emit('alert:triggered', alert)
socket.emit('analytics:live', { pageViews, visitors })
```

**Rooms**:
```javascript
// Subscribe to site-specific updates
socket.join(`site:${siteId}`)

// Admin room (all sites)
socket.join('admin:all-sites')

// Alert room
socket.join('alerts')
```

**Use Cases**:

1. **Live Health Updates**
   - Status changes (up/down/degraded)
   - Response time spikes
   - SSL expiry warnings

2. **Real-time Analytics**
   - Live page views
   - Active sessions
   - Geographic heatmap

3. **Alert Notifications**
   - Immediate alert push
   - Alert acknowledgments
   - System notifications

### 6.2 Fallback Strategy

If Socket.IO fails:
- **Polling**: Client polls every 30 seconds
- **Server-Sent Events (SSE)**: One-way updates
- **Automatic reconnection**: Socket.IO handles this

---

## 7. Monitoring System Design

### 7.1 Health Check Architecture

```
┌─────────────────────────────────────────────────────────┐
│                Health Check Manager                     │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Job Scheduler (Bull)                            │  │
│  │  - Check every site based on interval            │  │
│  │  - Priority queue (critical sites first)         │  │
│  └──────────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
┌───────▼────────┐ ┌──▼──────────┐ ┌─▼────────────┐
│   HTTP Check   │ │  Ping Check │ │ SSL/Domain   │
│   - Response   │ │  - ICMP     │ │ Check        │
│     time       │ │  - Latency  │ │ - Expiry     │
│   - Status     │ │  - Packet   │ │ - Validity   │
│     code       │ │    loss     │ │              │
└───────┬────────┘ └──┬──────────┘ └─┬────────────┘
        │             │              │
        └──────────────┼──────────────┘
                       │
            ┌──────────▼──────────┐
            │   Aggregation       │
            │   - Calculate       │
            │     uptime %        │
            │   - Avg response    │
            │     time            │
            └──────────┬──────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
┌───────▼────────┐ ┌──▼──────────┐ ┌─▼────────────┐
│   MongoDB     │ │   Redis     │ │  Socket.IO   │
│   (Historical)│ │   (Cache)   │ │  (Real-time) │
└────────────────┘ └─────────────┘ └──────────────┘
```

### 7.2 Monitoring Targets

**Per Site**:

1. **HTTP Endpoint Health**
   - Status code (200, 301, 404, 500, etc.)
   - Response time (ms)
   - Content match (check for specific text)
   - Headers (server, cache-control)
   - Redirect chain

2. **SSL/TLS Certificate**
   - Validity period
   - Expiry date (alert 30 days before)
   - Certificate authority
   - Protocol version (TLS 1.2+)
   - Cipher strength

3. **Domain Health**
   - DNS resolution
   - WHOIS expiry (alert 60 days before)
   - Nameserver status
   - DNS propagation

4. **Server Resources** (if accessible)
   - CPU usage
   - Memory usage
   - Disk space
   - Network I/O

5. **Application Health** (if has endpoint)
   - PM2 process status
   - Database connection
   - Queue depth
   - Error rate

### 7.3 Monitoring Intervals

| Site Priority | HTTP Check | SSL Check | Domain Check |
|--------------|------------|-----------|--------------|
| **Critical** | 1 min | Daily | Daily |
| **High** | 2 min | Daily | Daily |
| **Normal** | 5 min | Weekly | Weekly |
| **Low** | 10 min | Weekly | Weekly |

---

## 8. Analytics System Design

### 8.1 Data Collection Methods

**1. Nginx Log Parsing** (Primary)

```bash
# Nginx log format
$remote_addr - $remote_user [$time_local] "$request"
$status $body_bytes_sent "$http_referer" "$http_user_agent"

# Parse with custom script or GoAccess
# Send to admin dashboard API
```

**2. JavaScript Tracking** (Backup)

```javascript
// Add to monitored websites
<script src="https://admin.ementech.co.ke/tracker.js"></script>
<script>
  Analytics.init({
    siteId: 'site-id-here',
    autoTrack: true
  });
</script>
```

**3. API-Based** (For SPAs)

```javascript
// Send page view event
fetch('https://admin.ementech.co.ke/api/analytics/pageview', {
  method: 'POST',
  body: JSON.stringify({
    siteId: 'site-id',
    path: '/about',
    referrer: document.referrer,
    userAgent: navigator.userAgent
  })
});
```

### 8.2 Metrics Tracked

**Basic Metrics**:
- Page views
- Unique visitors
- Sessions
- Bounce rate
- Session duration

**Advanced Metrics**:
- Geographic distribution (country, city)
- Device type (desktop, mobile, tablet)
- Browser & OS
- Referrer sources
- Top pages
- Entry/exit pages
- Page depth
- Conversion funnels

**Real-time Metrics**:
- Current active users
- Live page views (last 30 minutes)
- Geographic heatmap (live)

### 8.3 Data Aggregation Pipeline

```javascript
// MongoDB Aggregation Pipeline
[
  // Match time range
  { $match: { timestamp: { $gte: start, $lte: end } } },

  // Group by metric
  { $group: {
      _id: "$metric",
      count: { $sum: 1 },
      unique: { $addToSet: "$sessionId" }
  }
  },

  // Calculate unique count
  { $project: {
      metric: "$_id",
      total: "$count",
      unique: { $size: "$unique" }
  }
  },

  // Sort
  { $sort: { total: -1 } }
]
```

---

## 9. Security Architecture

### 9.1 Authentication

**JWT-Based Authentication**:

```javascript
// Access Token (15 minutes)
{
  userId: "123",
  email: "admin@ementech.co.ke",
  role: "admin",
  permissions: ["read:all", "write:all"],
  iat: 1234567890,
  exp: 1234568790
}

// Refresh Token (7 days)
{
  userId: "123",
  tokenId: "abc123",
  iat: 1234567890,
  exp: 1240243890
}
```

**Flow**:
1. User logs in with email/password
2. Server returns access + refresh token
3. Client stores in httpOnly cookies (secure)
4. Access token used in API requests
5. Refresh token used to get new access token
6. Logout = invalidate refresh token

### 9.2 Authorization: Role-Based Access Control (RBAC)

**Roles**:
1. **Super Admin** - Full access, manage users
2. **Admin** - Full access to assigned sites
3. **Viewer** - Read-only access
4. **Analyst** - Analytics only

**Permissions**:
```javascript
const permissions = {
  'sites:read': 'View site information',
  'sites:write': 'Add/edit/delete sites',
  'health:read': 'View health checks',
  'analytics:read': 'View analytics',
  'alerts:read': 'View alerts',
  'alerts:write': 'Manage alerts',
  'users:read': 'View users',
  'users:write': 'Manage users',
  'settings:read': 'View settings',
  'settings:write': 'Edit settings'
};
```

**Role-Permission Matrix**:

| Permission | Super Admin | Admin | Viewer | Analyst |
|------------|-------------|-------|--------|---------|
| sites:read | X | X | X | X |
| sites:write | X | X | | |
| health:read | X | X | X | |
| analytics:read | X | X | X | X |
| alerts:read | X | X | X | |
| alerts:write | X | X | | |
| users:read | X | | | |
| users:write | X | | | |
| settings:read | X | | | |
| settings:write | X | | | |

### 9.3 API Security

**Rate Limiting** (Redis-backed):
```javascript
// Different limits per endpoint
const limits = {
  auth: { windowMs: 15 * 60 * 1000, max: 5 },        // 5 per 15 min
  api: { windowMs: 60 * 1000, max: 100 },            // 100 per min
  health: { windowMs: 60 * 1000, max: 1000 },        // 1000 per min
  analytics: { windowMs: 60 * 1000, max: 50 }        // 50 per min
};
```

**CORS**:
```javascript
// Only allow admin dashboard origin
origin: ['https://admin.ementech.co.ke'],
credentials: true
```

**Input Validation**:
```javascript
// Fastify JSON Schema validation
schema: {
  body: {
    type: 'object',
    required: ['url', 'name'],
    properties: {
      url: { type: 'string', format: 'uri' },
      name: { type: 'string', minLength: 2, maxLength: 100 }
    }
  }
}
```

### 9.4 Data Encryption

- **TLS 1.3** for all connections
- **Hashing**: bcrypt (passwords)
- **Encryption**: AES-256 (sensitive data at rest)
- **Secrets**: Environment variables, never in code

---

## 10. Scalability Architecture

### 10.1 Vertical Scaling (Current VPS)

**Current VPS Specs** (assumption):
- CPU: 2-4 cores
- RAM: 4-8 GB
- Disk: 80-120 GB SSD

**Optimizations**:
1. **PM2 Cluster Mode** - Utilize all CPU cores
   ```bash
   pm2 start server.js -i max
   ```

2. **MongoDB Indexing** - Faster queries
   ```javascript
   db.healthchecks.createIndex({ siteId: 1, timestamp: -1 })
   db.analytics.createIndex({ siteId: 1, metric: 1, timestamp: -1 })
   ```

3. **Redis Caching** - Reduce database load
   ```javascript
   // Cache expensive queries
   redis.setex(key, 3600, JSON.stringify(data))
   ```

4. **Nginx Caching** - Cache static assets
   ```nginx
   proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=admin_cache:10m;
   ```

### 10.2 Horizontal Scaling (Future)

**When to Scale Horizontally**:
- Monitoring 50+ sites
- CPU usage > 80% consistently
- Response time > 2s

**Architecture**:

```
┌─────────────────┐
│   Load Balancer │ (Nginx/HAProxy)
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌──▼────┐ ┌────────┐
│ VPS 1 │ │ VPS 2 │ │ VPS 3 │
└───────┘ └───────┘ └────────┘
   │         │         │
   └─────────┼─────────┘
             │
     ┌───────▼────────┐
     │ MongoDB Atlas  │ (Replica Set)
     │   + Redis      │ (Cluster)
     └────────────────┘
```

**Components to Scale**:
1. **Backend API** - Add more instances
2. **Health Check Workers** - Distribute jobs
3. **Database** - MongoDB Atlas auto-scales
4. **Redis** - Upgrade to Redis Cluster

---

## 11. Performance Optimization

### 11.1 Database Optimization

**Indexing Strategy**:
```javascript
// Health checks
db.healthchecks.createIndex({ siteId: 1, timestamp: -1 })
db.healthchecks.createIndex({ status: 1, timestamp: -1 })

// Analytics
db.analytics.createIndex({ siteId: 1, timestamp: -1 })
db.analytics.createIndex({ sessionId: 1 })
db.analytics.createIndex({ path: 1, timestamp: -1 })

// Alerts
db.alerts.createIndex({ siteId: 1, status: 1, createdAt: -1 })
```

**Data Retention**:
```javascript
// Delete old health checks (> 90 days)
db.healthchecks.deleteMany({
  timestamp: { $lt: new Date(Date.now() - 90*24*60*60*1000) }
});

// Delete old analytics (> 1 year)
db.analytics.deleteMany({
  timestamp: { $lt: new Date(Date.now() - 365*24*60*60*1000) }
});
```

### 11.2 Caching Strategy

**Cache Layers**:
1. **Client-side** - Browser cache (1-5 min)
2. **CDN** - Static assets (1 day)
3. **Redis** - API responses (1-5 min)
4. **Database** - Query cache (MongoDB)

**Cache Invalidation**:
```javascript
// Invalidate on data change
async function updateSite(siteId, data) {
  const updated = await Site.findByIdAndUpdate(siteId, data);
  await redis.del(`site:${siteId}`);
  await redis.del(`sites:list`); // Invalidate list cache
  return updated;
}
```

### 11.3 API Optimization

**Pagination**:
```javascript
// Always paginate large datasets
GET /api/healthchecks?siteId=123&page=1&limit=50
```

**Fields Selection**:
```javascript
// Allow client to select fields
GET /api/sites?fields=id,name,status,lastCheck
```

**Compression**:
```javascript
// Enable gzip compression
app.use(compress());
```

---

## 12. Deployment Architecture

### 12.1 Deployment Strategy

**Single VPS Deployment** (Initial):

```
VPS (69.164.244.165)
│
├── Nginx (Reverse Proxy)
│   ├── ementech.co.ke → Port 3001 (React frontend)
│   ├── api.ementech.co.ke → Port 5001 (Backend)
│   ├── app.ementech.co.ke → Port 3002 (Dumuwaks frontend)
│   ├── api.dumuwaks.co.ke → Port 5000 (Dumuwaks backend)
│   └── admin.ementech.co.ke → Port 3000 (Admin dashboard)
│
├── PM2 Processes
│   ├── ementech-frontend (Port 3001)
│   ├── ementech-backend (Port 5001)
│   ├── dumuwaks-frontend (Port 3002)
│   ├── dumuwaks-backend (Port 5000)
│   ├── admin-frontend (Port 3000)
│   ├── admin-backend (Port 5050)
│   └── health-workers (Background jobs)
│
└── Services
    ├── MongoDB Atlas (Cloud)
    ├── Redis (Local or Cloud)
    └── Socket.IO (Embedded)
```

### 12.2 Domain Setup

**DNS Records**:
```
A Record:
  admin.ementech.co.ke → 69.164.244.165

CNAME (optional - if using CDN):
  admin-admin → ementech.co.ke
```

**SSL Certificate**:
```bash
# Let's Encrypt with Certbot
sudo certbot --nginx -d admin.ementech.co.ke
```

### 12.3 Nginx Configuration

```nginx
# Admin Dashboard
upstream admin_frontend {
    server localhost:3000;
}

upstream admin_backend {
    server localhost:5050;
}

server {
    listen 80;
    server_name admin.ementech.co.ke;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name admin.ementech.co.ke;

    ssl_certificate /etc/letsencrypt/live/admin.ementech.co.ke/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/admin.ementech.co.ke/privkey.pem;

    # Frontend (Next.js)
    location / {
        proxy_pass http://admin_frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://admin_backend;
        proxy_http_version 1.1;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Socket.IO
    location /socket.io/ {
        proxy_pass http://admin_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 12.4 Environment Configuration

**Backend (.env)**:
```env
NODE_ENV=production
PORT=5050

# MongoDB
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/admin-dashboard

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-password

# JWT
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=https://admin.ementech.co.ke

# Email (for alerts)
SMTP_HOST=smtp.ementech.co.ke
SMTP_PORT=587
SMTP_USER=alerts@ementech.co.ke
SMTP_PASS=your-password

# Socket.IO
SOCKET_IO_PORT=5050
```

**Frontend (.env.local)**:
```env
NEXT_PUBLIC_API_URL=https://admin.ementech.co.ke/api
NEXT_PUBLIC_SOCKET_URL=https://admin.ementech.co.ke
NEXT_PUBLIC_APP_NAME=EmenTech Admin
```

---

## 13. Backup & Disaster Recovery

### 13.1 Backup Strategy

**Database Backups** (MongoDB Atlas):
- **Continuous Backup** - Enabled (point-in-time recovery)
- **Snapshot Backup** - Daily at 2 AM UTC
- **Retention**: 30 days

**Redis Backups**:
- **RDB Snapshot** - Every 24 hours
- **AOF** - Enabled (append-only file)
- **Retention**: 7 days locally, 30 days off-site

**Configuration Backups**:
- **Nginx configs** - Version controlled (Git)
- **PM2 ecosystem** - Version controlled (Git)
- **Environment variables** - Secure storage (Vault)

### 13.2 Disaster Recovery Plan

**Recovery Time Objective (RTO)**: 4 hours
**Recovery Point Objective (RPO)**: 15 minutes

**Scenarios**:

1. **VPS Failure**
   - Deploy new VPS
   - Restore from Git (code)
   - Restore MongoDB from Atlas (auto)
   - Update DNS

2. **Database Corruption**
   - MongoDB Atlas: Point-in-time recovery
   - Redis: Replay AOF file

3. **Data Loss**
   - Restore from latest snapshot
   - Replay transaction logs

4. **Security Breach**
   - Rotate all secrets
   - Force password reset
   - Review audit logs
   - Patch vulnerability

---

## 14. Monitoring & Observability

### 14.1 Application Monitoring

**Metrics to Collect**:
- API response times
- Database query times
- Error rates
- Active users
- Background job queue depth
- Socket.IO connections
- Cache hit/miss ratio

**Tools**:
- **Application Performance**: Custom monitoring + PM2 metrics
- **Log Aggregation**: Winston → File → Rotate
- **Uptime Monitoring**: The admin dashboard itself!

### 14.2 Logging Strategy

**Log Levels**:
```javascript
const levels = {
  error: 0,   // Errors that need attention
  warn: 1,    // Warnings that should be reviewed
  info: 2,    // General information
  http: 3,    // HTTP requests
  debug: 4    // Debugging info
};
```

**Log Format** (JSON):
```javascript
{
  timestamp: "2025-01-20T10:30:45.123Z",
  level: "info",
  message: "Health check completed",
  meta: {
    siteId: "123",
    status: "up",
    responseTime: 123,
    user: "system"
  }
}
```

**Log Rotation**:
```javascript
// Daily rotation, keep 14 days
new winston.transports.File({
  filename: 'logs/error.log',
  level: 'error',
  maxsize: 10485760, // 10MB
  maxFiles: 14
});
```

---

## 15. Development Workflow

### 15.1 Local Development Setup

```bash
# Clone repository
git clone <repo-url>
cd admin-dashboard

# Backend
cd backend
npm install
cp .env.example .env
# Configure .env
npm run dev

# Frontend (new terminal)
cd frontend
npm install
cp .env.local.example .env.local
# Configure .env.local
npm run dev
```

### 15.2 Testing Strategy

**Unit Tests** (Jest):
- Controllers
- Services
- Utilities
- Models

**Integration Tests** (Supertest):
- API endpoints
- Database operations
- Socket.IO events

**E2E Tests** (Playwright):
- Critical user flows
- Login/logout
- Site management
- Dashboard views

---

## 16. Migration Path to Microservices

### Phase 1: Modular Monolith (Current)
- Single codebase
- Modular structure
- Clear boundaries

### Phase 2: Extract Services (100+ sites)
1. **Health Check Service** - High CPU usage
2. **Analytics Service** - Data intensive
3. **Alert Service** - Independent logic

### Phase 3: Full Microservices (500+ sites)
- Independent deployments
- Service mesh (Istio)
- API Gateway
- Event-driven architecture

---

## 17. Technology Stack Summary

### Frontend
| Component | Technology | Version |
|-----------|-----------|---------|
| Framework | Next.js | 14.x |
| UI Library | shadcn/ui | Latest |
| Styling | Tailwind CSS | 3.x |
| State | Zustand + React Query | Latest |
| Real-time | Socket.IO Client | 4.x |
| Charts | Recharts + D3.js | Latest |
| Forms | React Hook Form + Zod | Latest |
| Tables | TanStack Table | Latest |

### Backend
| Component | Technology | Version |
|-----------|-----------|---------|
| Runtime | Node.js | 20 LTS |
| Framework | Fastify | 4.x |
| Real-time | Socket.IO | 4.x |
| Job Queue | Bull | 4.x |
| Validation | JSON Schema | - |
| Logging | Winston | 3.x |
| Testing | Jest + Supertest | Latest |

### Database
| Component | Technology | Version |
|-----------|-----------|---------|
| Primary DB | MongoDB Atlas | 6.x+ |
| Cache | Redis | 7.x |
| ODM | Mongoose | 8.x |

### Infrastructure
| Component | Technology | Version |
|-----------|-----------|---------|
| Server | Ubuntu | 22.04 LTS |
| Web Server | Nginx | Latest |
| Process Manager | PM2 | Latest |
| SSL | Let's Encrypt | - |
| DNS | Cloudflare/BuyVM | - |

---

## 18. Cost Analysis

### Initial Setup (One-time)
| Item | Cost |
|------|------|
| Development | $0 (DIY) |
| SSL Certificate | $0 (Let's Encrypt) |
| Domain Setup | $0 (subdomain) |
| **Total** | **$0** |

### Monthly Operating Costs
| Item | Cost |
|------|------|
| VPS (existing) | $0 (already paid) |
| MongoDB Atlas M0 | $0 (free tier) |
| Redis (self-hosted) | $0 |
| **Total** | **$0** |

### Future Scaling Costs
| Sites | VPS | MongoDB | Redis | Total/Month |
|-------|-----|---------|-------|-------------|
| 1-50 | Current | M0 | Local | $0 |
| 50-100 | Upgrade | M10 | Local | ~$20 |
| 100-500 | 2x VPS | M20 | Cloud | ~$100 |
| 500+ | Cluster | M40+ | Cluster | ~$500+ |

---

## 19. Success Metrics

### Technical Metrics
- **Availability**: 99.9% uptime
- **Response Time**: < 200ms (p95)
- **Monitoring Accuracy**: 99.99%
- **Alert Latency**: < 30 seconds

### Business Metrics
- **Sites Monitored**: 2 → 50+ in Year 1
- **User Satisfaction**: 4.5/5 stars
- **Cost per Site**: <$1/month
- **Time to Detect**: < 1 minute

---

## 20. Next Steps

For implementation team:

1. **Setup Development Environment**
   - Install dependencies
   - Configure local MongoDB + Redis
   - Setup PM2 locally

2. **Implement Phase 1** (see implementation-roadmap.md)
   - Authentication system
   - Site management
   - Basic health checks
   - Dashboard UI

3. **Deploy to Production**
   - Setup Nginx config
   - Configure SSL
   - Deploy with PM2
   - Smoke testing

4. **Monitor & Iterate**
   - Collect feedback
   - Fix bugs
   - Add features
   - Scale as needed

---

## Appendix: Architecture Decision Records (ADRs)

### ADR-001: Modular Monolith over Microservices
**Status**: Accepted
**Context**: Need to build MVP quickly, small team
**Decision**: Start with modular monolith
**Consequences**:
- (+) Faster development
- (+) Simpler deployment
- (+) Lower cost
- (-) Harder to scale later
- (-) Tighter coupling
**Revisit**: When monitoring 100+ sites

### ADR-002: Next.js over React SPA
**Status**: Accepted
**Context**: Dashboard needs good performance and SEO
**Decision**: Use Next.js 14 with App Router
**Consequences**:
- (+) Server components for performance
- (+) Built-in API routes
- (+) Excellent DX
- (-) Steeper learning curve
**Revisit**: Never (good long-term choice)

### ADR-003: Fastify over Express
**Status**: Accepted
**Context**: High-performance API needed
**Decision**: Use Fastify for admin dashboard backend
**Consequences**:
- (+) 2x performance
- (+) Built-in validation
- (+) Better TypeScript
- (-) Different from existing Express apps
**Revisit**: Never (good long-term choice)

### ADR-004: MongoDB + Redis over PostgreSQL
**Status**: Accepted
**Context**: Already using MongoDB, flexible schema needed
**Decision**: Keep MongoDB, add Redis
**Consequences**:
- (+) No migration needed
- (+) Time-series collections
- (+) Flexible schema
- (-) Less strict than SQL
- (-) More complex aggregations
**Revisit**: If data relationships become very complex

---

**Document Version**: 1.0.0
**Last Updated**: 2025-01-20
**Author**: Architecture Team
**Status**: Complete - Ready for Implementation
