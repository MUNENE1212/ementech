# Admin Dashboard - Monitoring Strategy

## Overview

This document defines the comprehensive monitoring strategy for the EmenTech Admin Dashboard system, covering what to monitor, how to monitor it, and alert thresholds.

---

## 1. Monitoring Targets

### 1.1 HTTP Endpoint Monitoring

**What to Monitor**:
- HTTP status code
- Response time (time to first byte)
- Full page load time
- Content verification (keyword matching)
- Redirect chain
- Headers (server, cache-control, etc.)
- SSL certificate validity
- Response size

**Check Methods**:
```javascript
// HTTP HEAD request (fast, checks availability)
HEAD https://example.com

// HTTP GET request (full page check)
GET https://example.com
```

**Monitoring Intervals**:

| Priority | Interval | Daily Checks |
|----------|----------|--------------|
| Critical | 1 minute | 1,440 |
| High | 2 minutes | 720 |
| Normal | 5 minutes | 288 |
| Low | 10 minutes | 144 |

### 1.2 SSL/TLS Certificate Monitoring

**What to Monitor**:
- Certificate validity (valid/invalid)
- Issuer authority
- Subject/Domain match
- Validity period
- Days until expiration
- Certificate chain
- Protocol version (TLS 1.2+ required)
- Cipher strength

**Check Frequency**: Daily (at 2 AM UTC)

**Alert Thresholds**:
- **Critical**: < 7 days to expiry
- **Warning**: < 30 days to expiry
- **Info**: > 30 days to expiry

**Check Implementation**:
```javascript
// Node.js implementation
const tls = require('tls');
const socket = tls.connect(443, 'example.com', () => {
  const cert = socket.getPeerCertificate();
  const daysToExpiry = calculateDaysToExpiry(cert.valid_to);
  socket.destroy();
});
```

### 1.3 Domain Expiry Monitoring

**What to Monitor**:
- Domain registration status
- Registrar information
- Expiration date
- Days until expiration
- Nameserver status
- DNS propagation

**Check Frequency**: Daily (at 3 AM UTC)

**Alert Thresholds**:
- **Critical**: < 30 days to expiry
- **Warning**: < 60 days to expiry
- **Info**: > 60 days to expiry

**Data Source**: WHOIS protocol

### 1.4 Server Resource Monitoring

**Prerequisites**:
- SSH access to server
- Monitoring agent installed (optional)

**What to Monitor**:

**CPU Usage**:
```javascript
{
  current: 45.2,          // Current CPU usage %
  load1: 1.23,           // 1-minute load average
  load5: 1.15,           // 5-minute load average
  load15: 1.08           // 15-minute load average
}
```

**Memory Usage**:
```javascript
{
  total: 8192,           // Total MB
  used: 4523,            // Used MB
  free: 3669,            // Free MB
  percentage: 55.2,      // Usage percentage
  swap: {
    total: 2048,
    used: 234,
    percentage: 11.4
  }
}
```

**Disk Usage**:
```javascript
{
  path: '/',
  total: 120,            // Total GB
  used: 45,              // Used GB
  free: 75,              // Free GB
  percentage: 37.5       // Usage percentage
}
```

**Network I/O**:
```javascript
{
  rx: 1234567890,        // Bytes received
  tx: 234567890,         // Bytes transmitted
  connections: 234       // Active connections
}
```

**Alert Thresholds**:
- **CPU**: Warning at 80%, Critical at 90%
- **Memory**: Warning at 80%, Critical at 90%
- **Disk**: Warning at 80%, Critical at 90%
- **Load**: Warning when load > number of cores

**Check Frequency**: Every 5 minutes

### 1.5 PM2 Process Monitoring

**What to Monitor**:
- Process status (online/stopped/errored)
- CPU usage
- Memory usage
- Restart count
- Uptime duration
- PID

**Check Method**:
```bash
# PM2 command
pm2 jlist
```

**Output**:
```javascript
[{
  name: 'ementech-backend',
  pid: 12345,
  status: 'online',
  cpu: 2.5,
  memory: 245.8,
  restart_time: 0,
  uptime: 345678
}]
```

**Alert Conditions**:
- Process status = "stopped" or "errored"
- Restart count > 5 in last hour
- Memory usage > 1GB
- CPU usage > 80%

**Check Frequency**: Every 2 minutes

### 1.6 Database Monitoring (MongoDB)

**What to Monitor**:
- Connection pool status
- Active connections
- Query performance (slow queries)
- Database size
- Index usage
- Replication lag (if replica set)

**Check Method**:
```javascript
// MongoDB statistics
db.serverStatus()
db.stats()
```

**Alert Thresholds**:
- Connection pool > 80% utilized
- Slow queries > 100ms
- Database size > 80% of limit
- Replication lag > 10 seconds

**Check Frequency**: Every 5 minutes

### 1.7 Nginx Status Monitoring

**What to Monitor**:
- Active connections
- Requests per second
- Connections per second
- Status codes (200, 404, 500, etc.)
- Response times

**Prerequisites**:
Enable `ngx_http_stub_status_module`

**Check Endpoint**: `http://localhost/nginx_status`

**Output**:
```
Active connections: 234
server accepts handled requests
 4567 4567 12345
Reading: 0 Writing: 45 Waiting: 189
```

**Check Frequency**: Every 2 minutes

### 1.8 Custom Health Endpoints

**Monitored Applications**:
- EmenTech Backend: `https://api.ementech.co.ke/api/health`
- Dumuwaks Backend: `https://api.dumuwaks.co.ke/api/health`
- Admin Dashboard: `https://admin.ementech.co.ke/api/health`

**Expected Response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-20T10:30:00Z",
  "uptime": 345678,
  "services": {
    "database": "connected",
    "redis": "connected",
    "email": "ready"
  }
}
```

**Check Frequency**: Every 1 minute (if endpoint exists)

---

## 2. Health Check Implementation

### 2.1 Check Flow

```
┌─────────────────────┐
│  Scheduled Trigger  │ (Based on site interval)
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   HTTP Check        │
│   - GET request     │
│   - Measure time    │
│   - Check status    │
│   - Verify content  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   SSL Check         │ (Daily)
│   - Certificate     │
│   - Expiry date     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Domain Check      │ (Daily)
│   - WHOIS lookup    │
│   - Expiry date     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Server Check      │ (If accessible)
│   - SSH connection  │
│   - Resources       │
│   - PM2 processes   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Aggregation       │
│   - Calculate stats │
│   - Update status   │
└──────────┬──────────┘
           │
           ├──────────────────┐
           ▼                  ▼
┌───────────────────┐  ┌──────────────┐
│  Store in MongoDB │  │   Redis      │
│  (Time-series)    │  │   (Cache)    │
└─────────┬─────────┘  └──────────────┘
          │
          ▼
┌─────────────────────┐
│  Emit Socket Event  │ (Real-time update)
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Check Alert Rules  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Trigger Alert?     │
│  (If threshold met) │
└─────────────────────┘
```

### 2.2 Check Implementation (Node.js)

**HTTP Health Check**:
```javascript
import axios from 'axios';

async function httpHealthCheck(site) {
  const start = Date.now();

  try {
    const response = await axios.get(site.url, {
      timeout: site.monitoring.timeout || 10000,
      validateStatus: () => true, // Don't throw on any status
      maxRedirects: 5
    });

    const duration = Date.now() - start;

    // Check for keywords
    let keywordsMatched = true;
    if (site.monitoring.keywords && site.monitoring.keywords.length > 0) {
      const content = response.data;
      keywordsMatched = site.monitoring.keywords.every(keyword =>
        content.includes(keyword)
      );
    }

    return {
      status: response.status === 200 && keywordsMatched ? 'up' : 'down',
      statusCode: response.status,
      responseTime: duration,
      size: response.headers['content-length'] || 0,
      redirected: response.request._redirectable._redirectCount > 0,
      keywordsMatched,
      errorMessage: null
    };
  } catch (error) {
    return {
      status: 'down',
      statusCode: error.response?.status || 0,
      responseTime: Date.now() - start,
      errorMessage: error.message
    };
  }
}
```

**SSL Health Check**:
```javascript
import https from 'https';

async function sslHealthCheck(domain) {
  return new Promise((resolve) => {
    const options = {
      host: domain,
      port: 443,
      method: 'GET',
      agent: false
    };

    const req = https.request(options, (res) => {
      const cert = res.socket.getPeerCertificate();
      const daysToExpiry = calculateDaysToExpiry(cert.valid_to);

      resolve({
        valid: cert.valid_to !== '',
        issuer: cert.issuer,
        subject: cert.subject,
        validFrom: new Date(cert.valid_from),
        validTo: new Date(cert.valid_to),
        daysUntilExpiry: daysToExpiry
      });
      req.destroy();
    });

    req.on('error', () => {
      resolve({ valid: false, error: 'SSL check failed' });
    });

    req.setTimeout(5000, () => {
      req.destroy();
      resolve({ valid: false, error: 'Timeout' });
    });

    req.end();
  });
}

function calculateDaysToExpiry(validTo) {
  const expiry = new Date(validTo);
  const now = new Date();
  const diff = expiry - now;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}
```

**Ping Check (ICMP)**:
```javascript
import { ping } from 'ping';

async function pingHealthCheck(host) {
  const results = await ping.promise.probe(host, {
    timeout: 5,
    extra: ['-c', '1']
  });

  return {
    status: results.alive ? 'reachable' : 'unreachable',
    alive: results.alive,
    packetLoss: results.packetLoss,
    minLatency: results.min === 'unknown' ? 0 : results.min,
    maxLatency: results.max === 'unknown' ? 0 : results.max,
    avgLatency: results.avg === 'unknown' ? 0 : results.avg
  };
}
```

---

## 3. Alert Thresholds and Rules

### 3.1 Built-in Alert Templates

**Uptime Alert**:
```javascript
{
  type: 'uptime',
  name: 'Low Uptime',
  condition: {
    operator: 'lt',
    threshold: 95,          // 95%
    duration: 5             // 5 consecutive failures
  },
  severity: 'warning'
}
```

**Response Time Alert**:
```javascript
{
  type: 'response_time',
  name: 'High Response Time',
  condition: {
    operator: 'gt',
    threshold: 2000,        // 2000ms
    duration: 5             // 5 consecutive checks
  },
  severity: 'warning'
}
```

**SSL Expiry Alert**:
```javascript
{
  type: 'ssl_expiry',
  name: 'SSL Certificate Expiring Soon',
  condition: {
    operator: 'lt',
    threshold: 30,          // 30 days
    duration: 1
  },
  severity: 'critical'
}
```

**Domain Expiry Alert**:
```javascript
{
  type: 'domain_expiry',
  name: 'Domain Expiring Soon',
  condition: {
    operator: 'lt',
    threshold: 60,          // 60 days
    duration: 1
  },
  severity: 'warning'
}
```

**Error Rate Alert**:
```javascript
{
  type: 'error_rate',
  name: 'High Error Rate',
  condition: {
    operator: 'gt',
    threshold: 5,           // 5%
    duration: 10            // Over last 10 checks
  },
  severity: 'critical'
}
```

### 3.2 Alert Logic

**Trigger Conditions**:
1. **Immediate**: SSL/Domain expiry
2. **Sustained**: Uptime, Response Time (requires consecutive failures)
3. **Aggregated**: Error Rate (calculated over time window)

**Alert States**:
```
OK → Triggered → Acknowledged → Resolved → OK
  ↑              ↓
  └──────────────┴── Triggered again (if condition persists)
```

**Debouncing**:
- Prevent alert spam
- Minimum 5 minutes between identical alerts
- Automatic resolution after 3 consecutive OK checks

---

## 4. Monitoring Scheduler

### 4.1 Job Queue Configuration

```javascript
// Bull queue configuration
const healthCheckQueue = new Queue('health-checks', {
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    removeOnComplete: 100,
    removeOnFail: 50
  }
});
```

### 4.2 Job Scheduling

```javascript
// Schedule health check for a site
async function scheduleHealthCheck(site) {
  const job = await healthCheckQueue.add(
    'check-site',
    { siteId: site._id },
    {
      repeat: {
        every: site.monitoring.interval * 60 * 1000 // Convert to ms
      },
      priority: getPriority(site.monitoring.priority)
    }
  );

  return job.id;
}

function getPriority(priority) {
  const priorities = {
    critical: 1,
    high: 3,
    normal: 5,
    low: 10
  };
  return priorities[priority] || 5;
}
```

### 4.3 Worker Implementation

```javascript
// Worker process
healthCheckQueue.process('check-site', async (job) => {
  const { siteId } = job.data;
  const site = await Site.findById(siteId);

  if (!site || !site.monitoring.enabled) {
    return { skipped: true };
  }

  // Perform checks
  const results = await Promise.allSettled([
    httpHealthCheck(site),
    // SSL check runs daily
    // Domain check runs daily
  ]);

  const healthResult = results[0].value;

  // Store result
  await HealthCheck.create({
    timestamp: new Date(),
    metadata: {
      siteId: site._id,
      checkType: 'http'
    },
    http: healthResult
  });

  // Update site status
  await Site.findByIdAndUpdate(siteId, {
    'status.state': healthResult.status,
    'status.lastCheck': new Date(),
    'status.responseTime': healthResult.responseTime
  });

  // Emit real-time update
  io.to(`site:${siteId}`).emit('health:update', {
    siteId: site._id,
    status: healthResult.status,
    responseTime: healthResult.responseTime,
    timestamp: new Date()
  });

  // Check alert rules
  await checkAlertRules(site, healthResult);

  return healthResult;
});
```

---

## 5. Monitoring Dashboard Metrics

### 5.1 Real-time Metrics

Display on dashboard:
- Current status (Up/Down/Degraded)
- Uptime percentage (last 24 hours)
- Average response time (last 24 hours)
- Last check timestamp
- Next check timestamp

### 5.2 Historical Metrics

Graphs showing:
- Uptime trend (last 7/30/90 days)
- Response time trend
- Incident count
- SSL expiry countdown
- Domain expiry countdown

### 5.3 Aggregated Metrics

Summary across all sites:
- Total sites
- Sites up/down/degraded
- Average uptime
- Average response time
- Active alerts
- Today's incidents

---

## 6. Data Retention and Cleanup

### 6.1 Retention Policy

| Data Type | Retention | Aggregation |
|-----------|-----------|-------------|
| Raw health checks | 90 days | → Hourly after 90 days |
| Hourly aggregates | 1 year | → Daily after 1 year |
| Daily aggregates | Forever | Keep |
| Analytics raw data | 1 year | → Daily after 1 year |
| Alert incidents | 1 year | Archive after 1 year |
| Audit logs | 1 year | Archive after 1 year |

### 6.2 Cleanup Job

```javascript
// Run daily at 3 AM
cron.schedule('0 3 * * *', async () => {
  // Delete old health checks
  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  await HealthCheck.deleteMany({ timestamp: { $lt: cutoff } });

  // Aggregate to hourly
  await aggregateHealthChecks();

  console.log('Data cleanup completed');
});
```

---

## 7. Monitoring Best Practices

### 7.1 Check Frequency Guidelines

- **Critical sites** (e-commerce, SaaS): 1 minute
- **Business sites**: 5 minutes
- **Personal blogs**: 10 minutes
- **Development**: 15-30 minutes

### 7.2 Alert Best Practices

- Don't alert on every failure (use sustained thresholds)
- Send summary emails instead of individual alerts for low-severity issues
- Use escalation chains (email → SMS → phone call)
- Include actionable information in alerts
- Always provide links to investigate

### 7.3 False Positive Prevention

- Use retry logic (3 attempts before marking as down)
- Check from multiple geographic locations
- Verify network connectivity
- Monitor the monitoring system itself

---

## 8. Monitoring System Self-Check

The admin dashboard should monitor itself:

**Self-Checks**:
- Background worker is running
- Queue depth is normal (< 1000 jobs)
- Redis connection is healthy
- MongoDB connection is healthy
- Socket.IO connections are working
- Disk space is sufficient

**Self-Alert**:
- If monitoring system fails, send email to admin
- Display system status on dashboard
- Auto-restart failed workers

---

**Document Version**: 1.0.0
**Last Updated**: 2025-01-20
**Author**: Architecture Team
**Status**: Complete - Ready for Implementation
