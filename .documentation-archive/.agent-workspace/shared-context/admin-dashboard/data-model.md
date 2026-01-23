# Admin Dashboard - Data Model

## Overview

This document defines the complete database schema for the EmenTech Admin Dashboard system. All data models use MongoDB with Mongoose ODM.

## Design Principles

1. **Time-Series Optimization**: Use MongoDB time-series collections for high-volume monitoring data
2. **Index Strategy**: Optimize for common query patterns
3. **Data Retention**: Define retention policies for each collection
4. **Relationships**: Use references for one-to-many, embedded for one-to-few
5. **Scalability**: Design for horizontal scaling

---

## Database Collections

### 1. Sites Collection

**Purpose**: Store website configuration and metadata

**Collection Name**: `sites`
**Collection Type**: Standard

```javascript
{
  _id: ObjectId,                    // Auto-generated
  name: String,                     // Site name (e.g., "EmenTech")
  domain: String,                   // Primary domain (e.g., "ementech.co.ke")
  url: String,                      // Full URL (e.g., "https://ementech.co.ke")
  type: {
    type: String,                   // "website" | "api" | "mobile"
    enum: ["website", "api", "mobile"]
  },
  description: String,              // Optional description

  // Monitoring Configuration
  monitoring: {
    enabled: Boolean,               // Is monitoring active?
    interval: Number,               // Check interval in minutes (1, 2, 5, 10)
    priority: {
      type: String,
      enum: ["critical", "high", "normal", "low"],
      default: "normal"
    },
    timeout: Number,                // Request timeout in ms (default: 10000)
    expectedStatus: Number,         // Expected HTTP status (default: 200)
    keywords: [String],             // Keywords to check in response
    checkSSL: Boolean,              // Monitor SSL certificate?
    checkDomain: Boolean,           // Monitor domain expiry?
  },

  // Server Configuration (optional, if accessible)
  server: {
    host: String,                   // Server hostname/IP
    sshPort: Number,                // SSH port
    sshUser: String,                // SSH username
    pm2AppName: String,             // PM2 app name
    hasHealthEndpoint: Boolean,     // Does app have /health endpoint?
    healthEndpointPath: String,     // e.g., "/health"
  },

  // Analytics Configuration
  analytics: {
    enabled: Boolean,               // Track analytics?
    trackingMethod: {
      type: String,
      enum: ["nginx", "js", "api", "hybrid"],
      default: "hybrid"
    },
    trackingId: String,             // Unique tracking ID
  },

  // Alert Configuration
  alerts: {
    enabled: Boolean,
    email: String,                  // Alert email
    webhook: String,                // Webhook URL (Slack, Discord, etc.)
    threshold: {
      uptime: Number,               // Alert if uptime % below this (default: 95)
      responseTime: Number,         // Alert if response time above this (ms)
      errorRate: Number             // Alert if error rate above this (%)
    }
  },

  // Current Status (cached in MongoDB for fast access)
  status: {
    state: {
      type: String,
      enum: ["up", "down", "degraded", "unknown"],
      default: "unknown"
    },
    uptime: Number,                 // Current uptime percentage
    lastCheck: Date,                // Last health check timestamp
    nextCheck: Date,                // Next scheduled check
    responseTime: Number,           // Last response time (ms)
    lastError: String,              // Last error message
  },

  // SSL & Domain Information
  ssl: {
    valid: Boolean,
    issuer: String,
    subject: String,
    validFrom: Date,
    validTo: Date,
    daysUntilExpiry: Number
  },
  domain: {
    registrar: String,
    created: Date,
    expires: Date,
    daysUntilExpiry: Number,
    nameservers: [String]
  },

  // Metadata
  tags: [String],                   // For grouping/filtering
  category: String,                 // "business" | "personal" | "client"
  ownerId: ObjectId,                // Reference to User (owner)
  team: [ObjectId],                 // Team members with access

  // Timestamps
  createdAt: Date,
  updatedAt: Date,
  deletedAt: Date                   // Soft delete
}
```

**Indexes**:
```javascript
// Query optimization
db.sites.createIndex({ domain: 1 }, { unique: true })
db.sites.createIndex({ "status.state": 1 })
db.sites.createIndex({ ownerId: 1 })
db.sites.createIndex({ tags: 1 })
db.sites.createIndex({ createdAt: -1 })
```

**Relationships**:
- Has many HealthChecks
- Has many Analytics
- Has many Alerts
- Belongs to User (owner)

---

### 2. Health Checks Collection (Time-Series)

**Purpose**: Store health check results for monitoring

**Collection Name**: `healthchecks`
**Collection Type**: Time-Series

```javascript
// Time-series collection configuration
{
  timeField: "timestamp",
  metaField: "metadata",
  granularity: "seconds"
}

// Document structure
{
  timestamp: Date,                  // Primary time field

  metadata: {
    siteId: ObjectId,               // Reference to Site
    checkType: String               // "http" | "ping" | "ssl" | "domain"
  },

  // HTTP Check Results
  http: {
    status: {
      type: String,
      enum: ["up", "down", "degraded", "timeout"]
    },
    statusCode: Number,             // HTTP status code
    responseTime: Number,           // Response time in ms
    size: Number,                   // Response size in bytes
    redirected: Boolean,            // Was request redirected?
    redirectUrl: String,            // Final URL after redirects
    headers: {
      server: String,
      contentType: String,
      cacheControl: String,
      // ... other headers
    },
    keywordsMatched: Boolean,       // Did expected keywords appear?
    errorMessage: String,           // Error message if failed
    certificate: {
      valid: Boolean,
      issuer: String,
      subject: String,
      validFrom: Date,
      validTo: Date,
      daysUntilExpiry: Number
    }
  },

  // Ping Check Results
  ping: {
    status: {
      type: String,
      enum: ["reachable", "unreachable"]
    },
  alive: Boolean,                   // Is host alive?
    packetLoss: Number,             // Packet loss percentage
    minLatency: Number,             // Minimum latency (ms)
    maxLatency: Number,             // Maximum latency (ms)
    avgLatency: Number,             // Average latency (ms)
    stddevLatency: Number,          // Standard deviation
    errorMessage: String
  },

  // Domain Check Results
  domain: {
    status: {
      type: String,
      enum: ["valid", "expiring", "expired", "error"]
    },
    expires: Date,
    daysUntilExpiry: Number,
    registrar: String,
    nameservers: [String],
    dnsRecords: {
      a: [String],                  // A records
      aaaa: [String],               // IPv6 records
      mx: [String],                 // Mail records
      txt: [String],                // TXT records
      cname: [String]               // CNAME records
    }
  },

  // Server Resource Metrics (if available)
  resources: {
    cpu: {
      usage: Number,                // CPU usage percentage
      load: [Number]                // Load average (1min, 5min, 15min)
    },
    memory: {
      used: Number,                 // Used memory in MB
      free: Number,                 // Free memory in MB
      total: Number,                // Total memory in MB
      percentage: Number            // Usage percentage
    },
    disk: {
      used: Number,                 // Used disk in GB
      free: Number,                 // Free disk in GB
      total: Number,                // Total disk in GB
      percentage: Number            // Usage percentage
    },
    network: {
      rx: Number,                   // Received bytes
      tx: Number,                   // Transmitted bytes
      connections: Number           // Active connections
    },
    processes: {
      running: Number,              // Running processes
      sleeping: Number,             // Sleeping processes
      total: Number                 // Total processes
    },
    pm2: {
      status: String,               // "online" | "stopped" | "errored"
      cpu: Number,                  // CPU usage
      memory: Number,               // Memory in MB
      restarts: Number,             // Restart count
      uptime: Number                // Uptime in seconds
    },
    database: {
      connections: Number,          // Active connections
      ops: Number,                  // Operations per second
      latency: Number               // Query latency (ms)
    }
  }
}
```

**Indexes**:
```javascript
// Time-series auto-creates index on timestamp
// Additional indexes:
db.healthchecks.createIndex({ "metadata.siteId": 1, timestamp: -1 })
db.healthchecks.createIndex({ "metadata.checkType": 1, timestamp: -1 })
```

**Data Retention**:
- Raw data: 90 days
- After 90 days: Aggregate to hourly averages
- After 1 year: Aggregate to daily averages

**Aggregation Strategy**:
```javascript
// Hourly aggregation
{
  $group: {
    _id: {
      siteId: "$metadata.siteId",
      hour: { $dateToString: { format: "%Y-%m-%d %H:00:00", date: "$timestamp" } }
    },
    avgResponseTime: { $avg: "$http.responseTime" },
    uptimePercentage: {
      $avg: { $cond: [{ $eq: ["$http.status", "up"] }, 1, 0] }
    },
    totalChecks: { $sum: 1 },
    failedChecks: {
      $sum: { $cond: [{ $ne: ["$http.status", "up"] }, 1, 0] }
    }
  }
}
```

---

### 3. Analytics Collection (Time-Series)

**Purpose**: Store website analytics data

**Collection Name**: `analytics`
**Collection Type**: Time-Series

```javascript
// Time-series collection configuration
{
  timeField: "timestamp",
  metaField: "metadata",
  granularity: "seconds"
}

// Document structure
{
  timestamp: Date,

  metadata: {
    siteId: ObjectId,               // Reference to Site
    eventType: String,              // "pageview" | "session" | "event" | "conversion"
    sessionId: String               // Session identifier
  },

  // Page View Events
  pageview: {
    path: String,                   // e.g., "/about"
    title: String,                  // Page title
    referrer: String,               // Referrer URL
    search: {
      engine: String,               // "google" | "bing" | "duckduckgo"
      query: String                 // Search query
    },
    loadTime: Number,               // Page load time (ms)
    scrollDepth: Number,            // Maximum scroll percentage (0-100)
    timeOnPage: Number              // Time spent on page (seconds)
  },

  // Session Events
  session: {
    start: Boolean,                 // Is this session start?
    end: Boolean,                   // Is this session end?
    duration: Number,               // Session duration (seconds)
    pageViews: Number,              // Number of page views in session
    entryPage: String,              // First page visited
    exitPage: String,               // Last page visited
    bounce: Boolean                 // Single page session?
  },

  // Custom Events
  event: {
    category: String,               // Event category
    action: String,                 // Event action
    label: String,                  // Event label
    value: Number                   // Event value (optional)
  },

  // Conversion Events
  conversion: {
    funnel: String,                 // Funnel name (e.g., "signup")
    step: Number,                   // Step number
    goal: String,                   // Goal name
    value: Number,                  // Conversion value
    currency: String                // Currency code
  },

  // User/Visitor Information
  visitor: {
    isNew: Boolean,                 // Is this a new visitor?
    id: String,                     // Unique visitor ID
    fingerprint: String,            // Browser fingerprint
    ipAddress: String,              // Anonymized IP
    location: {
      country: String,              // Country code (ISO 3166-1 alpha-2)
      countryName: String,          // Country name
      region: String,               // State/region
      city: String,                 // City
      latitude: Number,
      longitude: Number,
      timezone: String              // Timezone (e.g., "Africa/Nairobi")
    },
    device: {
      type: {
        type: String,
        enum: ["desktop", "mobile", "tablet", "bot"]
      },
      os: {
        name: String,               // "Windows" | "Mac" | "Linux" | "Android" | "iOS"
        version: String
      },
      browser: {
        name: String,               // "Chrome" | "Firefox" | "Safari" | "Edge"
        version: String
      },
      screen: {
        width: Number,
        height: Number,
        density: Number             // Pixel ratio
      },
      vendor: String,               // Device manufacturer
      model: String                 // Device model
    },
    network: {
      type: String,                 // "wifi" | "cellular" | "ethernet" | "unknown"
      speed: String                 // "slow-2g" | "2g" | "3g" | "4g"
    }
  },

  // Performance Metrics
  performance: {
    dns: Number,                    // DNS lookup time (ms)
    tcp: Number,                    // TCP connection time (ms)
    tls: Number,                    // TLS handshake time (ms)
    ttfb: Number,                   // Time to first byte (ms)
    download: Number,               // Download time (ms)
    domParse: Number,               // DOM parsing time (ms)
    domContentLoaded: Number,       // DOM Content Loaded time (ms)
    loadComplete: Number            // Load complete time (ms)
  }
}
```

**Indexes**:
```javascript
// Time-series auto-creates index on timestamp
// Additional indexes:
db.analytics.createIndex({ "metadata.siteId": 1, timestamp: -1 })
db.analytics.createIndex({ "metadata.sessionId": 1, timestamp: 1 })
db.analytics.createIndex({ "pageview.path": 1, timestamp: -1 })
db.analytics.createIndex({ "visitor.location.country": 1, timestamp: -1 })
```

**Data Retention**:
- Raw data: 1 year
- After 1 year: Aggregate to daily/hourly statistics

**Pre-Aggregations** (Materialized Views):

```javascript
// Daily page view counts
{
  siteId: ObjectId,
  date: Date,
  totalPageViews: Number,
  uniqueVisitors: Number,
  uniqueSessions: Number,
  avgSessionDuration: Number,
  bounceRate: Number,
  topPages: [{ path: String, views: Number }],
  topReferrers: [{ referrer: String, views: Number }],
  topCountries: [{ country: String, visitors: Number }],
  deviceBreakdown: {
    desktop: Number,
    mobile: Number,
    tablet: Number
  },
  browserBreakdown: [{
    browser: String,
    version: String,
    count: Number
  }]
}
```

---

### 4. Alerts Collection

**Purpose**: Store alert history and configuration

**Collection Name**: `alerts`
**Collection Type**: Standard

```javascript
{
  _id: ObjectId,

  // Alert Definition
  definition: {
    type: {
      type: String,
      enum: ["uptime", "response_time", "ssl_expiry", "domain_expiry", "error_rate", "custom"]
    },
    condition: {
      operator: {
        type: String,
        enum: ["gt", "lt", "eq", "gte", "lte", "contains"]
      },
      threshold: Number,            // Threshold value
      duration: Number,             // Duration in minutes (for sustained conditions)
      checkInterval: Number         // How often to check (minutes)
    }
  },

  // Alert Metadata
  siteId: ObjectId,                // Site this alert is for
  name: String,                    // Alert name (e.g., "High Response Time")
  description: String,             // Description
  severity: {
    type: String,
    enum: ["info", "warning", "critical", "emergency"]
  },
  enabled: Boolean,                // Is alert active?

  // Notification Settings
  notifications: {
    email: {
      enabled: Boolean,
      recipients: [String],         // Email addresses
      template: String             // Email template name
    },
    webhook: {
      enabled: Boolean,
      url: String,                 // Webhook URL
      method: {
        type: String,
        enum: ["POST", "PUT", "PATCH"]
      },
      headers: Map,                // Custom headers
      body: String                 // Body template
    },
    sms: {
      enabled: Boolean,
      recipients: [String]         // Phone numbers
    },
    inApp: {
      enabled: Boolean             // Show in dashboard
    }
  },

  // Alert State
  state: {
    status: {
      type: String,
      enum: ["ok", "triggered", "acknowledged", "resolved"]
    },
    lastTriggered: Date,           // When was last triggered?
    lastAcknowledged: Date,        // When was last acknowledged?
    acknowledgedBy: ObjectId,      // User who acknowledged
    resolvedAt: Date,              // When was resolved?
    triggerCount: Number,          // Total times triggered
    consecutiveTriggers: Number    // Consecutive triggers (since resolved)
  },

  // Statistics
  stats: {
    totalTriggered: Number,        // Total times triggered
    totalAcknowledged: Number,     // Total times acknowledged
    avgResolutionTime: Number,     // Avg time to resolve (minutes)
    lastThresholdValue: Number,    // Last value that triggered
    lastThresholdTime: Date        // When last threshold was breached
  },

  // Metadata
  tags: [String],
  createdBy: ObjectId,             // User who created
  createdAt: Date,
  updatedAt: Date,
  deletedAt: Date
}
```

**Indexes**:
```javascript
db.alerts.createIndex({ siteId: 1, enabled: 1 })
db.alerts.createIndex({ "state.status": 1 })
db.alerts.createIndex({ "definition.type": 1 })
db.alerts.createIndex({ createdAt: -1 })
```

---

### 5. Alert Incidents Collection

**Purpose**: Store individual alert trigger events

**Collection Name**: `alert_incidents`
**Collection Type**: Standard

```javascript
{
  _id: ObjectId,

  alertId: ObjectId,               // Reference to Alert
  siteId: ObjectId,                // Reference to Site
  type: String,                    // Alert type
  severity: String,                // Alert severity

  // Incident Details
  triggeredAt: Date,               // When was triggered?
  detectedAt: Date,                // When was detected?
  value: Number,                   // Value that triggered
  threshold: Number,               // Threshold value
  message: String,                 // Alert message
  details: Map,                    // Additional details

  // Resolution
  acknowledgedAt: Date,            // When acknowledged?
  acknowledgedBy: ObjectId,        // Who acknowledged?
  acknowledgementNote: String,     // Note added when acknowledging

  resolvedAt: Date,                // When resolved?
  resolvedBy: ObjectId,            // Who resolved?
  resolutionNote: String,         // Resolution note
  resolution: {
    type: {
      type: String,
      enum: ["automatic", "manual", "false_positive"]
    },
    description: String
  },

  // Notifications Sent
  notificationsSent: [{
    channel: String,               // "email" | "webhook" | "sms" | "inapp"
    recipient: String,             // Recipient
    status: {
      type: String,
      enum: ["pending", "sent", "delivered", "failed"]
    },
    sentAt: Date,
    error: String                  // Error if failed
  }],

  // Metadata
  duration: Number,                // Incident duration (minutes)
  falsePositive: Boolean,          // Marked as false positive?

  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
```javascript
db.alert_incidents.createIndex({ alertId: 1, triggeredAt: -1 })
db.alert_incidents.createIndex({ siteId: 1, triggeredAt: -1 })
db.alert_incidents.createIndex({ "state.status": 1, triggeredAt: -1 })
db.alert_incidents.createIndex({ triggeredAt: -1 })
```

---

### 6. Users Collection

**Purpose**: Store admin dashboard user accounts

**Collection Name**: `users`
**Collection Type**: Standard

```javascript
{
  _id: ObjectId,

  // Authentication
  email: {
    type: String,
    lowercase: true,
    trim: true,
    unique: true
  },
  password: String,                // Hashed password (bcrypt)
  refreshToken: String,            // Current refresh token

  // Profile
  profile: {
    firstName: String,
    lastName: String,
    avatar: String,                // Avatar URL
    timezone: String,              // User timezone
    language: String,              // Preferred language
    bio: String                    // Short bio
  },

  // Role & Permissions
  role: {
    type: String,
    enum: ["super_admin", "admin", "viewer", "analyst"],
    default: "viewer"
  },
  permissions: [String],           // Custom permissions (if any)
  sites: [ObjectId],               // Sites user has access to (empty = all)

  // Preferences
  preferences: {
    notifications: {
      email: Boolean,              // Email notifications?
      inApp: Boolean,              // In-app notifications?
      mobile: Boolean              // Mobile push notifications?
    },
    dashboard: {
      defaultView: String,         // "overview" | "sites" | "analytics"
      refreshInterval: Number,     // Auto-refresh interval (seconds)
      darkMode: Boolean
    },
    alerts: {
      soundEnabled: Boolean,
      desktopNotifications: Boolean
    }
  },

  // Security
  security: {
    twoFactorEnabled: Boolean,     // 2FA enabled?
    twoFactorSecret: String,       // 2FA secret
    lastPasswordChange: Date,      // Last password change
    passwordResetToken: String,    // Password reset token
    passwordResetExpires: Date,    // Reset token expiry
    loginAttempts: Number,         // Failed login attempts
    lockedUntil: Date,             // Account locked until?
    lastLogin: Date,               // Last successful login
    lastLoginIP: String            // Last login IP
  },

  // Activity
  activity: {
    lastSeen: Date,                // Last active timestamp
    totalLogins: Number,           // Total login count
    totalSessions: Number          // Total sessions count
  },

  // Status
  status: {
    type: String,
    enum: ["active", "inactive", "suspended", "pending"],
    default: "pending"
  },
  emailVerified: Boolean,          // Email verified?
  emailVerificationToken: String,  // Verification token
  emailVerificationExpires: Date,  // Token expiry

  // Timestamps
  createdAt: Date,
  updatedAt: Date,
  deletedAt: Date                  // Soft delete
}
```

**Indexes**:
```javascript
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ "status.type": 1 })
db.users.createIndex({ "role": 1 })
db.users.createIndex({ createdAt: -1 })
```

---

### 7. Sessions Collection

**Purpose**: Store user sessions (alternative to Redis)

**Collection Name**: `sessions`
**Collection Type**: Standard

```javascript
{
  _id: ObjectId,

  userId: ObjectId,                // Reference to User
  token: String,                   // Session token (unique)
  refreshToken: String,            // Refresh token

  // Session Details
  device: {
    type: String,                  // "desktop" | "mobile" | "tablet"
    os: String,                    // Operating system
    browser: String,               // Browser name
    ip: String,                    // IP address
    userAgent: String              // User agent string
  },

  // Session State
  valid: Boolean,                  // Is session valid?
  expiresAt: Date,                 // Expiration timestamp

  // Activity
  lastActivity: Date,              // Last activity timestamp
  createdAt: Date,
  revokedAt: Date                  // If manually revoked
}
```

**Indexes**:
```javascript
db.sessions.createIndex({ token: 1 }, { unique: true })
db.sessions.createIndex({ userId: 1, valid: 1 })
db.sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }) // TTL index
```

---

### 8. Audit Logs Collection

**Purpose**: Store audit trail for compliance and debugging

**Collection Name**: `audit_logs`
**Collection Type**: Standard

```javascript
{
  _id: ObjectId,

  // Action Details
  action: {
    type: String,                  // "create" | "read" | "update" | "delete"
    entity: String,                // "site" | "alert" | "user" | "settings"
    entityId: ObjectId,            // ID of entity
    description: String            // Human-readable description
  },

  // User Context
  user: {
    id: ObjectId,                  // User who performed action
    email: String,                 // User email
    role: String                   // User role
  },

  // Request Context
  request: {
    method: String,                // HTTP method
    url: String,                   // Request URL
    ip: String,                    // IP address
    userAgent: String,             // User agent
    referer: String                // Referer
  },

  // Changes
  changes: {
    before: Object,                // State before (for update/delete)
    after: Object                  // State after (for create/update)
  },

  // Result
  result: {
    status: {
      type: String,
      enum: ["success", "failure"]
    },
    errorCode: String,             // Error code if failed
    errorMessage: String           // Error message if failed
  },

  // Metadata
  timestamp: Date,                 // When action occurred
  duration: Number                 // Request duration (ms)
}
```

**Indexes**:
```javascript
db.audit_logs.createIndex({ "user.id": 1, timestamp: -1 })
db.audit_logs.createIndex({ "action.entity": 1, timestamp: -1 })
db.audit_logs.createIndex({ timestamp: -1 })
```

**Data Retention**: 1 year (configurable)

---

### 9. Reports Collection

**Purpose**: Store generated reports and their configurations

**Collection Name**: `reports`
**Collection Type**: Standard

```javascript
{
  _id: ObjectId,

  // Report Details
  name: String,                    // Report name
  description: String,             // Report description
  type: {
    type: String,
    enum: ["uptime", "performance", "analytics", "custom"]
  },

  // Report Configuration
  config: {
    sites: [ObjectId],             // Sites to include
    dateRange: {
      start: Date,
      end: Date
    },
    metrics: [String],             // Metrics to include
    groupBy: String,               // "day" | "week" | "month" | "site"
    format: {
      type: String,
      enum: ["json", "csv", "pdf", "html"]
    },
    includeCharts: Boolean,
    includeRawData: Boolean
  },

  // Report Schedule
  schedule: {
    enabled: Boolean,              // Is this a scheduled report?
    frequency: {
      type: String,
      enum: ["daily", "weekly", "monthly"]
    },
    dayOfWeek: Number,             // 0-6 (for weekly)
    dayOfMonth: Number,            // 1-31 (for monthly)
    time: String,                  // HH:MM format
    timezone: String               // Timezone
  },

  // Report State
  status: {
    type: String,
    enum: ["draft", "generating", "ready", "failed", "scheduled"]
  },

  // Generated Report Data
  data: {
    generatedAt: Date,             // When was it generated?
    fileUrl: String,               // URL to generated file
    fileSize: Number,              // File size in bytes
    recordCount: Number,           // Number of records
    summary: Object                // Summary statistics
  },

  // Recipients
  recipients: [String],            // Email addresses
  lastSentAt: Date,                // When was last sent?

  // Metadata
  createdBy: ObjectId,             // User who created
  createdAt: Date,
  updatedAt: Date,
  deletedAt: Date
}
```

**Indexes**:
```javascript
db.reports.createIndex({ createdBy: 1, createdAt: -1 })
db.reports.createIndex({ "schedule.enabled": 1 })
db.reports.createIndex({ "status.type": 1 })
```

---

### 10. Settings Collection

**Purpose**: Store system-wide settings and configuration

**Collection Name**: `settings`
**Collection Type**: Standard

```javascript
{
  _id: ObjectId,

  // Setting Details
  key: {
    type: String,
    unique: true
  },
  value: Schema.Types.Mixed,        // Any type (string, number, object, array)
  category: String,                // "general" | "monitoring" | "alerts" | "analytics"

  // Metadata
  description: String,             // What this setting does
  type: {
    type: String,
    enum: ["string", "number", "boolean", "object", "array"]
  },
  defaultValue: Schema.Types.Mixed,
  isPublic: Boolean,               // Can non-admin users see this?
  isEditable: Boolean,             // Can users edit this?

  // Validation
  validation: {
    required: Boolean,
    min: Number,                   // For numbers
    max: Number,                   // For numbers
    options: [Schema.Types.Mixed]  // For enums
  },

  // Audit
  updatedBy: ObjectId,             // Last updated by
  updatedAt: Date,
  createdAt: Date
}
```

**Default Settings**:
```javascript
// General
{
  key: "app.name",
  value: "EmenTech Admin Dashboard",
  category: "general",
  type: "string",
  isEditable: true
}

// Monitoring
{
  key: "monitoring.default_interval",
  value: 5,
  category: "monitoring",
  type: "number",
  validation: { min: 1, max: 60 }
}

// Alerts
{
  key: "alerts.default_email",
  value: "admin@ementech.co.ke",
  category: "alerts",
  type: "string"
}

// Data Retention
{
  key: "retention.healthcheck_days",
  value: 90,
  category: "general",
  type: "number"
}

{
  key: "retention.analytics_days",
  value: 365,
  category: "general",
  type: "number"
}
```

**Indexes**:
```javascript
db.settings.createIndex({ key: 1 }, { unique: true })
db.settings.createIndex({ category: 1 })
```

---

### 11. Notifications Collection

**Purpose**: Store in-app notifications for users

**Collection Name**: `notifications`
**Collection Type**: Standard

```javascript
{
  _id: ObjectId,

  // Recipient
  userId: ObjectId,                // User to notify

  // Notification Details
  type: {
    type: String,
    enum: ["alert", "system", "update", "info"]
  },
  title: String,                   // Notification title
  message: String,                 // Notification message
  priority: {
    type: String,
    enum: ["low", "normal", "high", "urgent"]
  },

  // Related Entity
  relatedTo: {
    entityType: String,            // "site" | "alert" | "user"
    entityId: ObjectId
  },

  // Action Buttons
  actions: [{
    label: String,                 // Button label
    url: String,                   // Action URL
    type: {
      type: String,
      enum: ["primary", "secondary", "danger"]
    }
  }],

  // State
  read: Boolean,                   // Has user read this?
  readAt: Date,                    // When was read?

  // Expiry
  expiresAt: Date,                 // When to auto-delete?

  // Metadata
  createdAt: Date
}
```

**Indexes**:
```javascript
db.notifications.createIndex({ userId: 1, read: 1, createdAt: -1 })
db.notifications.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
```

---

## Relationship Diagram

```
┌─────────────┐
│    Sites    │
│             │
│  _id        │───┐
│  ownerId    │───┼──┐
└─────────────┘   │  │
                  │  │
     ┌────────────┘  │
     │               │
┌────▼──────────┐   │
│ HealthChecks  │   │
│ (Time-Series) │   │
│               │   │
│ siteId        │───┘
│ timestamp     │
└───────────────┘

     ┌────────────────┐
     │                │
┌────▼──────────┐   │
│   Analytics   │   │
│ (Time-Series) │   │
│               │   │
│ siteId        │───┘
│ timestamp     │
└───────────────┘

     ┌────────────────┐
     │                │
┌────▼──────────┐   │
│    Alerts     │   │
│               │   │
│  siteId       │───┘
└───────┬────────┘
        │
┌───────▼───────────────┐
│   Alert Incidents     │
│                       │
│  alertId              │
│  siteId               │
└───────────────────────┘

┌─────────────┐
│    Users    │
│             │
│  _id        │───┐
│  role       │   │
└─────────────┘   │
     ┌────────────┘
     │
┌────▼──────────┐     ┌──────────────┐
│   Sessions    │     │ Audit Logs   │
│               │     │              │
│  userId       │     │  user.id     │
└───────────────┘     └──────────────┘

┌─────────────┐
│  Settings   │
│             │
│  key (uniq) │
└─────────────┘
```

---

## Data Aggregation Pipelines

### 1. Calculate Site Uptime (Last 24 Hours)

```javascript
db.healthchecks.aggregate([
  {
    $match: {
      "metadata.siteId": ObjectId("..."),
      timestamp: {
        $gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
      },
      "metadata.checkType": "http"
    }
  },
  {
    $group: {
      _id: null,
      totalChecks: { $sum: 1 },
      successfulChecks: {
        $sum: {
          $cond: [{ $eq: ["$http.status", "up"] }, 1, 0]
        }
      },
      avgResponseTime: { $avg: "$http.responseTime" },
      minResponseTime: { $min: "$http.responseTime" },
      maxResponseTime: { $max: "$http.responseTime" }
    }
  },
  {
    $project: {
      uptime: {
        $multiply: [
          { $divide: ["$successfulChecks", "$totalChecks"] },
          100
        ]
      },
      avgResponseTime: 1,
      minResponseTime: 1,
      maxResponseTime: 1
    }
  }
])
```

### 2. Top Pages (Last 7 Days)

```javascript
db.analytics.aggregate([
  {
    $match: {
      "metadata.siteId": ObjectId("..."),
      "metadata.eventType": "pageview",
      timestamp: {
        $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      }
    }
  },
  {
    $group: {
      _id: "$pageview.path",
      views: { $sum: 1 },
      uniqueVisitors: { $addToSet: "$visitor.id" },
      avgTimeOnPage: { $avg: "$pageview.timeOnPage" }
    }
  },
  {
    $project: {
      path: "$_id",
      views: 1,
      uniqueVisitors: { $size: "$uniqueVisitors" },
      avgTimeOnPage: { $round: ["$avgTimeOnPage", 2] }
    }
  },
  { $sort: { views: -1 } },
  { $limit: 10 }
])
```

### 3. Geographic Distribution (Last 30 Days)

```javascript
db.analytics.aggregate([
  {
    $match: {
      "metadata.siteId": ObjectId("..."),
      timestamp: {
        $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      }
    }
  },
  {
    $group: {
      _id: "$visitor.location.country",
      visitors: { $addToSet: "$visitor.id" },
      pageViews: { $sum: 1 },
      avgSessionDuration: { $avg: "$session.duration" }
    }
  },
  {
    $project: {
      country: "$_id",
      uniqueVisitors: { $size: "$visitors" },
      pageViews: 1,
      avgSessionDuration: { $round: ["$avgSessionDuration", 2] }
    }
  },
  { $sort: { uniqueVisitors: -1 } }
])
```

---

## Data Retention Policies

| Collection | Retention Period | Archive Strategy |
|------------|-----------------|------------------|
| `sites` | Forever | Never delete |
| `healthchecks` | 90 days | Aggregate to hourly after 90 days |
| `analytics` | 1 year | Aggregate to daily after 1 year |
| `alerts` | Forever | Never delete |
| `alert_incidents` | 1 year | Archive after 1 year |
| `users` | Forever | Soft delete only |
| `sessions` | 30 days | TTL index auto-delete |
| `audit_logs` | 1 year | Archive after 1 year |
| `reports` | 90 days | Delete generated files |
| `settings` | Forever | Never delete |
| `notifications` | 30 days | TTL index auto-delete |

---

## Indexing Strategy Summary

### High-Traffic Collections (Time-Series)

**healthchecks**:
- Compound index: `{ siteId: 1, timestamp: -1 }`
- Covering queries for dashboard

**analytics**:
- Compound index: `{ siteId: 1, timestamp: -1 }`
- Single field: `{ sessionId: 1, timestamp: 1 }`
- Geo queries: `{ "visitor.location.country": 1, timestamp: -1 }`

### Standard Collections

**sites**:
- Unique: `{ domain: 1 }`
- Queries: `{ status: 1 }, { ownerId: 1 }, { tags: 1 }`

**alerts**:
- Compound: `{ siteId: 1, enabled: 1 }`
- Queries: `{ state: 1 }, { type: 1 }`

**users**:
- Unique: `{ email: 1 }`
- Queries: `{ role: 1 }, { status: 1 }`

---

## Scaling Considerations

### When to Shard?

**Signs You Need Sharding**:
- Health checks collection > 100 GB
- Analytics collection > 500 GB
- Query performance degrading
- Storage > 80% of capacity

**Shard Keys**:
- **healthchecks**: `{ "metadata.siteId": 1, timestamp: 1 }`
- **analytics**: `{ "metadata.siteId": 1, timestamp: 1 }`

### When to Use Read Replicas?

**Use Cases**:
- Analytics queries (heavy aggregations)
- Report generation
- Dashboard data (read-heavy)

**Strategy**:
- Primary: All writes
- Secondary: All read operations
- Analytics: Separate analytics node

---

## Backup Strategy

### MongoDB Atlas Backups

**Continuous Backup**:
- Point-in-time recovery (any second in past 30 days)
- Near-zero RPO

**Snapshot Backup**:
- Daily snapshots at 2 AM UTC
- Retention: 30 days

### Export Backups (On-premise)

```bash
# Weekly export to backup server
mongodump --uri="mongodb://..." --archive=/backups/admin-dashboard-$(date +%Y%m%d).gz
```

---

**Document Version**: 1.0.0
**Last Updated**: 2025-01-20
**Author**: Architecture Team
**Status**: Complete - Ready for Implementation
