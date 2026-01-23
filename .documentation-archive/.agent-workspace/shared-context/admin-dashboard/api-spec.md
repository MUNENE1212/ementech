# Admin Dashboard - API Specification

## Overview

This document provides a comprehensive RESTful API specification for the EmenTech Admin Dashboard system. All endpoints use JSON format and follow REST conventions.

**Base URL**: `https://admin.ementech.co.ke/api`
**API Version**: v1
**Content-Type**: `application/json`

---

## Authentication

### Authentication Strategy

All endpoints (except auth endpoints) require JWT authentication.

**Header Format**:
```http
Authorization: Bearer <access_token>
```

**Token Types**:
- **Access Token**: Short-lived (15 minutes), used for API requests
- **Refresh Token**: Long-lived (7 days), used to obtain new access tokens

---

## API Response Format

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": { ... }
  }
}
```

### Paginated Response

```json
{
  "success": true,
  "data": {
    "items": [ ... ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "pages": 5
    }
  }
}
```

---

## Rate Limiting

| Endpoint Type | Limit | Window |
|--------------|-------|--------|
| Auth endpoints | 5 requests | 15 minutes |
| Standard API | 100 requests | 1 minute |
| Health check API | 1000 requests | 1 minute |
| Analytics API | 50 requests | 1 minute |

**Rate Limit Headers**:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642694400
```

---

## API Endpoints

### 1. Authentication Endpoints

#### 1.1 Register User

Register a new user account (requires admin approval or invitation).

**Endpoint**: `POST /auth/register`
**Auth Required**: No

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "timezone": "Africa/Nairobi"
}
```

**Validation**:
- `email`: Valid email, unique
- `password`: Min 8 chars, must contain uppercase, lowercase, number, special char
- `firstName`: 2-50 chars
- `lastName`: 2-50 chars
- `timezone`: Valid IANA timezone (optional)

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "viewer",
      "status": "pending",
      "emailVerified": false
    },
    "message": "Registration successful. Please verify your email."
  }
}
```

#### 1.2 Verify Email

Verify email address with token sent to email.

**Endpoint**: `POST /auth/verify-email`
**Auth Required**: No

**Request Body**:
```json
{
  "token": "verification_token_here"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

#### 1.3 Login

Authenticate user and receive tokens.

**Endpoint**: `POST /auth/login`
**Auth Required**: No

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "admin",
      "permissions": ["sites:read", "sites:write", "health:read"],
      "preferences": {
        "dashboard": {
          "darkMode": false,
          "defaultView": "overview"
        }
      }
    },
    "tokens": {
      "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 900
    }
  }
}
```

#### 1.4 Refresh Token

Obtain a new access token using refresh token.

**Endpoint**: `POST /auth/refresh`
**Auth Required**: No (uses refresh token)

**Request Body**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 900
  }
}
```

#### 1.5 Logout

Invalidate current session.

**Endpoint**: `POST /auth/logout`
**Auth Required**: Yes

**Request Body**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### 1.6 Forgot Password

Request password reset email.

**Endpoint**: `POST /auth/forgot-password`
**Auth Required**: No

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Password reset email sent if email exists"
}
```

#### 1.7 Reset Password

Reset password with token from email.

**Endpoint**: `POST /auth/reset-password`
**Auth Required**: No

**Request Body**:
```json
{
  "token": "reset_token_here",
  "password": "NewSecurePass123!"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Password reset successful"
}
```

---

### 2. Sites Endpoints

#### 2.1 List All Sites

Get list of all sites user has access to.

**Endpoint**: `GET /sites`
**Auth Required**: Yes
**Permissions**: `sites:read`

**Query Parameters**:
```
?page=1
&limit=20
&status=up
&search=ementech
&tag=business
&category=client
&sort=createdAt
&order=desc
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "507f1f77bcf86cd799439011",
        "name": "EmenTech",
        "domain": "ementech.co.ke",
        "url": "https://ementech.co.ke",
        "type": "website",
        "status": {
          "state": "up",
          "uptime": 99.95,
          "responseTime": 123,
          "lastCheck": "2025-01-20T10:30:00Z"
        },
        "monitoring": {
          "enabled": true,
          "interval": 5
        },
        "tags": ["business", "corporate"],
        "createdAt": "2025-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 2,
      "pages": 1
    }
  }
}
```

#### 2.2 Get Site Details

Get detailed information about a specific site.

**Endpoint**: `GET /sites/:siteId`
**Auth Required**: Yes
**Permissions**: `sites:read`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "name": "EmenTech",
    "domain": "ementech.co.ke",
    "url": "https://ementech.co.ke",
    "type": "website",
    "description": "EmenTech corporate website",
    "monitoring": {
      "enabled": true,
      "interval": 5,
      "priority": "critical",
      "timeout": 10000,
      "expectedStatus": 200,
      "checkSSL": true,
      "checkDomain": true
    },
    "server": {
      "host": "69.164.244.165",
      "pm2AppName": "ementech-backend"
    },
    "analytics": {
      "enabled": true,
      "trackingMethod": "hybrid",
      "trackingId": "GA-123456789"
    },
    "alerts": {
      "enabled": true,
      "email": "admin@ementech.co.ke",
      "threshold": {
        "uptime": 95,
        "responseTime": 2000
      }
    },
    "status": {
      "state": "up",
      "uptime": 99.95,
      "lastCheck": "2025-01-20T10:30:00Z",
      "nextCheck": "2025-01-20T10:35:00Z",
      "responseTime": 123
    },
    "ssl": {
      "valid": true,
      "issuer": "Let's Encrypt",
      "validTo": "2025-04-20T00:00:00Z",
      "daysUntilExpiry": 89
    },
    "domain": {
      "registrar": "BuyVM",
      "expires": "2025-12-20T00:00:00Z",
      "daysUntilExpiry": 334
    },
    "tags": ["business", "corporate"],
    "category": "business",
    "owner": {
      "id": "507f1f77bcf86cd799439011",
      "name": "Admin User"
    },
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-20T10:30:00Z"
  }
}
```

#### 2.3 Create Site

Add a new site to monitor.

**Endpoint**: `POST /sites`
**Auth Required**: Yes
**Permissions**: `sites:write`

**Request Body**:
```json
{
  "name": "New Website",
  "domain": "example.com",
  "url": "https://example.com",
  "type": "website",
  "description": "My new website",
  "monitoring": {
    "enabled": true,
    "interval": 5,
    "priority": "normal",
    "timeout": 10000,
    "expectedStatus": 200,
    "keywords": ["Welcome", "Home"],
    "checkSSL": true,
    "checkDomain": true
  },
  "analytics": {
    "enabled": true,
    "trackingMethod": "js"
  },
  "alerts": {
    "enabled": true,
    "email": "admin@example.com"
  },
  "tags": ["client"],
  "category": "client"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439012",
    "name": "New Website",
    "domain": "example.com",
    "status": {
      "state": "unknown",
      "lastCheck": null
    },
    "createdAt": "2025-01-20T10:35:00Z"
  }
}
```

#### 2.4 Update Site

Update site configuration.

**Endpoint**: `PUT /sites/:siteId`
**Auth Required**: Yes
**Permissions**: `sites:write`

**Request Body** (all fields optional):
```json
{
  "name": "Updated Name",
  "monitoring": {
    "interval": 2
  },
  "alerts": {
    "threshold": {
      "responseTime": 5000
    }
  }
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Updated Name",
    "updatedAt": "2025-01-20T10:40:00Z"
  }
}
```

#### 2.5 Delete Site

Remove a site from monitoring (soft delete).

**Endpoint**: `DELETE /sites/:siteId`
**Auth Required**: Yes
**Permissions**: `sites:write`

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Site deleted successfully"
}
```

#### 2.6 Check Site Now

Trigger immediate health check for a site.

**Endpoint**: `POST /sites/:siteId/check`
**Auth Required**: Yes
**Permissions**: `sites:write`

**Response** (202 Accepted):
```json
{
  "success": true,
  "message": "Health check initiated",
  "data": {
    "siteId": "507f1f77bcf86cd799439011",
    "checkId": "507f1f77bcf86cd799439013"
  }
}
```

---

### 3. Health Check Endpoints

#### 3.1 Get Health Checks History

Get historical health check data for a site.

**Endpoint**: `GET /health/:siteId`
**Auth Required**: Yes
**Permissions**: `health:read`

**Query Parameters**:
```
?from=2025-01-19T00:00:00Z
&to=2025-01-20T23:59:59Z
&type=http
&limit=100
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "507f1f77bcf86cd799439015",
        "timestamp": "2025-01-20T10:30:00Z",
        "type": "http",
        "status": "up",
        "responseTime": 123,
        "statusCode": 200,
        "size": 15234,
        "ssl": {
          "valid": true,
          "daysUntilExpiry": 89
        }
      }
    ],
    "summary": {
      "total": 288,
      "up": 285,
      "down": 3,
      "uptimePercentage": 98.96,
      "avgResponseTime": 134,
      "minResponseTime": 98,
      "maxResponseTime": 245
    }
  }
}
```

#### 3.2 Get Current Status

Get current health status of all sites.

**Endpoint**: `GET /health/status`
**Auth Required**: Yes
**Permissions**: `health:read`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "sites": [
      {
        "siteId": "507f1f77bcf86cd799439011",
        "name": "EmenTech",
        "state": "up",
        "uptime": 99.95,
        "responseTime": 123,
        "lastCheck": "2025-01-20T10:30:00Z"
      },
      {
        "siteId": "507f1f77bcf86cd799439012",
        "name": "Dumuwaks",
        "state": "degraded",
        "uptime": 95.23,
        "responseTime": 2341,
        "lastCheck": "2025-01-20T10:29:00Z"
      }
    ],
    "summary": {
      "total": 2,
      "up": 1,
      "degraded": 1,
      "down": 0
    }
  }
}
```

#### 3.3 Get Uptime Statistics

Get detailed uptime statistics for a site.

**Endpoint**: `GET /health/:siteId/uptime`
**Auth Required**: Yes
**Permissions**: `health:read`

**Query Parameters**:
```
?period=24h  // 24h, 7d, 30d, 90d, custom
&from=2025-01-01T00:00:00Z
&to=2025-01-20T23:59:59Z
&groupBy=hour  // hour, day, week, month
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "period": {
      "from": "2025-01-19T10:30:00Z",
      "to": "2025-01-20T10:30:00Z"
    },
    "overall": {
      "uptime": 99.95,
      "downtime": "4m 32s",
      "incidents": 3
    },
    "series": [
      {
        "timestamp": "2025-01-19T11:00:00Z",
        "uptime": 100,
        "avgResponseTime": 125
      },
      {
        "timestamp": "2025-01-19T12:00:00Z",
        "uptime": 98.5,
        "avgResponseTime": 234
      }
    ]
  }
}
```

#### 3.4 Get Response Time Statistics

Get response time analytics.

**Endpoint**: `GET /health/:siteId/response-time`
**Auth Required**: Yes
**Permissions**: `health:read`

**Query Parameters**:
```
?period=7d
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "period": "7d",
    "statistics": {
      "min": 98,
      "max": 5234,
      "avg": 145,
      "median": 132,
      "p95": 234,
      "p99": 567
    },
    "series": [
      {
        "timestamp": "2025-01-13T00:00:00Z",
        "value": 145
      }
    ]
  }
}
```

---

### 4. Analytics Endpoints

#### 4.1 Get Analytics Overview

Get analytics overview for a site.

**Endpoint**: `GET /analytics/:siteId/overview`
**Auth Required**: Yes
**Permissions**: `analytics:read`

**Query Parameters**:
```
?from=2025-01-01T00:00:00Z
&to=2025-01-20T23:59:59Z
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "period": {
      "from": "2025-01-01T00:00:00Z",
      "to": "2025-01-20T23:59:59Z"
    },
    "metrics": {
      "pageViews": 45234,
      "uniqueVisitors": 8934,
      "sessions": 12345,
      "bounceRate": 42.5,
      "avgSessionDuration": 245,
      "pagesPerSession": 3.67
    },
    "trends": {
      "pageViewsChange": 12.5,
      "visitorsChange": 8.3
    }
  }
}
```

#### 4.2 Get Page Views

Get page view analytics.

**Endpoint**: `GET /analytics/:siteId/pageviews`
**Auth Required**: Yes
**Permissions**: `analytics:read`

**Query Parameters**:
```
?from=2025-01-01T00:00:00Z
&to=2025-01-20T23:59:59Z
&groupBy=day  // hour, day, week, month
&path=/about
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "total": 45234,
    "unique": 8934,
    "series": [
      {
        "timestamp": "2025-01-01T00:00:00Z",
        "pageViews": 2345,
        "uniqueVisitors": 567
      }
    ]
  }
}
```

#### 4.3 Get Top Pages

Get most visited pages.

**Endpoint**: `GET /analytics/:siteId/pages`
**Auth Required**: Yes
**Permissions**: `analytics:read`

**Query Parameters**:
```
?from=2025-01-01T00:00:00Z
&to=2025-01-20T23:59:59Z
&limit=10
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "pages": [
      {
        "path": "/",
        "title": "Home",
        "views": 12345,
        "uniqueVisitors": 5678,
        "avgTimeOnPage": 45,
        "bounceRate": 32.5
      },
      {
        "path": "/about",
        "title": "About Us",
        "views": 8234,
        "uniqueVisitors": 3456,
        "avgTimeOnPage": 78,
        "bounceRate": 28.3
      }
    ]
  }
}
```

#### 4.4 Get Geographic Data

Get visitor geographic distribution.

**Endpoint**: `GET /analytics/:siteId/geo`
**Auth Required**: Yes
**Permissions**: `analytics:read`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "countries": [
      {
        "code": "KE",
        "name": "Kenya",
        "visitors": 5678,
        "percentage": 45.6
      },
      {
        "code": "US",
        "name": "United States",
        "visitors": 2345,
        "percentage": 18.8
      }
    ],
    "cities": [
      {
        "city": "Nairobi",
        "country": "Kenya",
        "visitors": 3456,
        "percentage": 27.7
      }
    ]
  }
}
```

#### 4.5 Get Device & Browser Stats

Get device and browser breakdown.

**Endpoint**: `GET /analytics/:siteId/devices`
**Auth Required**: Yes
**Permissions**: `analytics:read`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "types": [
      {
        "type": "desktop",
        "count": 7834,
        "percentage": 62.8
      },
      {
        "type": "mobile",
        "count": 3456,
        "percentage": 27.7
      },
      {
        "type": "tablet",
        "count": 1144,
        "percentage": 9.2
      }
    ],
    "browsers": [
      {
        "name": "Chrome",
        "version": "120",
        "count": 6789,
        "percentage": 54.4
      },
      {
        "name": "Safari",
        "version": "17",
        "count": 2345,
        "percentage": 18.8
      }
    ],
    "operatingSystems": [
      {
        "name": "Windows",
        "version": "10",
        "count": 4567,
        "percentage": 36.6
      },
      {
        "name": "Android",
        "version": "13",
        "count": 2345,
        "percentage": 18.8
      }
    ]
  }
}
```

#### 4.6 Get Referrer Data

Get traffic sources.

**Endpoint**: `GET /analytics/:siteId/referrers`
**Auth Required**: Yes
**Permissions**: `analytics:read`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "sources": [
      {
        "type": "search",
        "name": "Google",
        "visits": 3456,
        "percentage": 27.7
      },
      {
        "type": "social",
        "name": "LinkedIn",
        "visits": 1234,
        "percentage": 9.9
      },
      {
        "type": "direct",
        "name": "Direct",
        "visits": 5678,
        "percentage": 45.5
      }
    ]
  }
}
```

#### 4.7 Get Real-time Analytics

Get current real-time analytics.

**Endpoint**: `GET /analytics/:siteId/realtime`
**Auth Required**: Yes
**Permissions**: `analytics:read`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "timestamp": "2025-01-20T10:30:00Z",
    "activeUsers": 23,
    "pageViewsLast30min": 145,
    "topPages": [
      {
        "path": "/",
        "activeUsers": 12
      }
    ],
    "geo": {
      "KE": 8,
      "US": 5,
      "GB": 3
    }
  }
}
```

---

### 5. Alerts Endpoints

#### 5.1 List Alerts

Get all alerts for a site or all sites.

**Endpoint**: `GET /alerts`
**Auth Required**: Yes
**Permissions**: `alerts:read`

**Query Parameters**:
```
?siteId=507f1f77bcf86cd799439011
&status=triggered
&severity=critical
&type=uptime
&page=1
&limit=20
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "507f1f77bcf86cd799439020",
        "site": {
          "id": "507f1f77bcf86cd799439011",
          "name": "EmenTech"
        },
        "type": "uptime",
        "name": "High Uptime Alert",
        "severity": "critical",
        "enabled": true,
        "state": {
          "status": "triggered",
          "lastTriggered": "2025-01-20T10:15:00Z",
          "triggerCount": 5
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 15
    }
  }
}
```

#### 5.2 Create Alert

Create a new alert.

**Endpoint**: `POST /alerts`
**Auth Required**: Yes
**Permissions**: `alerts:write`

**Request Body**:
```json
{
  "siteId": "507f1f77bcf86cd799439011",
  "type": "response_time",
  "name": "High Response Time",
  "description": "Alert when response time exceeds 2000ms",
  "severity": "warning",
  "enabled": true,
  "condition": {
    "operator": "gt",
    "threshold": 2000,
    "duration": 5
  },
  "notifications": {
    "email": {
      "enabled": true,
      "recipients": ["admin@ementech.co.ke"]
    },
    "webhook": {
      "enabled": true,
      "url": "https://hooks.slack.com/services/..."
    },
    "inApp": {
      "enabled": true
    }
  }
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439021",
    "name": "High Response Time",
    "createdAt": "2025-01-20T10:45:00Z"
  }
}
```

#### 5.3 Update Alert

Update alert configuration.

**Endpoint**: `PUT /alerts/:alertId`
**Auth Required**: Yes
**Permissions**: `alerts:write`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439021",
    "updatedAt": "2025-01-20T10:50:00Z"
  }
}
```

#### 5.4 Delete Alert

Delete an alert.

**Endpoint**: `DELETE /alerts/:alertId`
**Auth Required**: Yes
**Permissions**: `alerts:write`

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Alert deleted successfully"
}
```

#### 5.5 Acknowledge Alert

Acknowledge a triggered alert.

**Endpoint**: `POST /alerts/:alertId/acknowledge`
**Auth Required**: Yes
**Permissions**: `alerts:write`

**Request Body**:
```json
{
  "note": "Investigating the issue"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Alert acknowledged"
}
```

#### 5.6 Get Alert Incidents

Get incident history for an alert.

**Endpoint**: `GET /alerts/:alertId/incidents`
**Auth Required**: Yes
**Permissions**: `alerts:read`

**Query Parameters**:
```
?status=resolved
&from=2025-01-01T00:00:00Z
&limit=50
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "507f1f77bcf86cd799439025",
        "triggeredAt": "2025-01-20T10:15:00Z",
        "value": 3456,
        "threshold": 2000,
        "duration": 15,
        "acknowledgedAt": "2025-01-20T10:20:00Z",
        "resolvedAt": "2025-01-20T10:30:00Z",
        "acknowledgedBy": {
          "id": "507f1f77bcf86cd799439011",
          "name": "Admin User"
        }
      }
    ]
  }
}
```

---

### 6. Users Endpoints

#### 6.1 List Users

Get all users (admin only).

**Endpoint**: `GET /users`
**Auth Required**: Yes
**Permissions**: `users:read` (Admin only)

**Query Parameters**:
```
?status=active
&role=admin
&search=john
&page=1
&limit=20
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "507f1f77bcf86cd799439011",
        "email": "admin@ementech.co.ke",
        "firstName": "Admin",
        "lastName": "User",
        "role": "super_admin",
        "status": "active",
        "emailVerified": true,
        "lastLogin": "2025-01-20T09:15:00Z",
        "createdAt": "2025-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5
    }
  }
}
```

#### 6.2 Get User Profile

Get current user's profile.

**Endpoint**: `GET /users/me`
**Auth Required**: Yes

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "admin",
    "permissions": ["sites:read", "sites:write"],
    "profile": {
      "timezone": "Africa/Nairobi",
      "avatar": "https://..."
    },
    "preferences": {
      "notifications": {
        "email": true,
        "inApp": true
      },
      "dashboard": {
        "darkMode": false,
        "defaultView": "overview"
      }
    },
    "createdAt": "2025-01-01T00:00:00Z"
  }
}
```

#### 6.3 Update User Profile

Update current user's profile.

**Endpoint**: `PUT /users/me`
**Auth Required**: Yes

**Request Body**:
```json
{
  "firstName": "John Updated",
  "preferences": {
    "dashboard": {
      "darkMode": true
    }
  }
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "firstName": "John Updated",
    "preferences": {
      "dashboard": {
        "darkMode": true
      }
    }
  }
}
```

#### 6.4 Change Password

Change current user's password.

**Endpoint**: `POST /users/me/change-password`
**Auth Required**: Yes

**Request Body**:
```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass123!"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

#### 6.5 Update User (Admin)

Update any user (admin only).

**Endpoint**: `PUT /users/:userId`
**Auth Required**: Yes
**Permissions**: `users:write`

**Request Body**:
```json
{
  "role": "admin",
  "status": "active",
  "sites": ["507f1f77bcf86cd799439011"]
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "role": "admin",
    "updatedAt": "2025-01-20T11:00:00Z"
  }
}
```

#### 6.6 Delete User (Admin)

Delete a user (admin only).

**Endpoint**: `DELETE /users/:userId`
**Auth Required**: Yes
**Permissions**: `users:write`

**Response** (200 OK):
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

---

### 7. Reports Endpoints

#### 7.1 List Reports

Get all reports.

**Endpoint**: `GET /reports`
**Auth Required**: Yes
**Permissions**: `reports:read`

**Query Parameters**:
```
?type=uptime
&status=ready
&page=1
&limit=20
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "507f1f77bcf86cd799439030",
        "name": "Weekly Uptime Report",
        "type": "uptime",
        "status": "ready",
        "schedule": {
          "enabled": true,
          "frequency": "weekly"
        },
        "createdAt": "2025-01-15T10:00:00Z",
        "lastGenerated": "2025-01-20T09:00:00Z"
      }
    ]
  }
}
```

#### 7.2 Create Report

Create a new report.

**Endpoint**: `POST /reports`
**Auth Required**: Yes
**Permissions**: `reports:write`

**Request Body**:
```json
{
  "name": "Monthly Performance Report",
  "description": "Monthly analytics report",
  "type": "analytics",
  "config": {
    "sites": ["507f1f77bcf86cd799439011"],
    "dateRange": {
      "from": "2025-01-01T00:00:00Z",
      "to": "2025-01-31T23:59:59Z"
    },
    "metrics": ["pageViews", "visitors", "bounceRate"],
    "format": "pdf",
    "includeCharts": true
  },
  "schedule": {
    "enabled": true,
    "frequency": "monthly",
    "dayOfMonth": 1,
    "time": "09:00",
    "timezone": "Africa/Nairobi"
  },
  "recipients": ["admin@ementech.co.ke"]
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439031",
    "name": "Monthly Performance Report",
    "status": "scheduled"
  }
}
```

#### 7.3 Generate Report

Manually trigger report generation.

**Endpoint**: `POST /reports/:reportId/generate`
**Auth Required**: Yes
**Permissions**: `reports:write`

**Response** (202 Accepted):
```json
{
  "success": true,
  "message": "Report generation started"
}
```

#### 7.4 Download Report

Download generated report.

**Endpoint**: `GET /reports/:reportId/download`
**Auth Required**: Yes
**Permissions**: `reports:read`

**Response**: (200 OK) - File download

---

### 8. Settings Endpoints

#### 8.1 Get Settings

Get system settings.

**Endpoint**: `GET /settings`
**Auth Required**: Yes

**Query Parameters**:
```
?category=monitoring
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "settings": [
      {
        "key": "monitoring.default_interval",
        "value": 5,
        "category": "monitoring",
        "type": "number",
        "description": "Default health check interval (minutes)"
      }
    ]
  }
}
```

#### 8.2 Update Setting

Update a system setting (admin only).

**Endpoint**: `PUT /settings/:settingKey`
**Auth Required**: Yes
**Permissions**: `settings:write`

**Request Body**:
```json
{
  "value": 2
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "key": "monitoring.default_interval",
    "value": 2,
    "updatedAt": "2025-01-20T11:15:00Z"
  }
}
```

---

### 9. Notifications Endpoints

#### 9.1 Get Notifications

Get user notifications.

**Endpoint**: `GET /notifications`
**Auth Required**: Yes

**Query Parameters**:
```
?unreadOnly=true
&type=alert
&limit=20
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "507f1f77bcf86cd799439040",
        "type": "alert",
        "title": "Site Down",
        "message": "EmenTech is down",
        "priority": "urgent",
        "read": false,
        "relatedTo": {
          "entityType": "site",
          "entityId": "507f1f77bcf86cd799439011"
        },
        "actions": [
          {
            "label": "View Site",
            "url": "/sites/507f1f77bcf86cd799439011",
            "type": "primary"
          }
        ],
        "createdAt": "2025-01-20T10:30:00Z"
      }
    ],
    "unreadCount": 5
  }
}
```

#### 9.2 Mark as Read

Mark notification as read.

**Endpoint**: `PUT /notifications/:notificationId/read`
**Auth Required**: Yes

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

#### 9.3 Mark All as Read

Mark all notifications as read.

**Endpoint**: `POST /notifications/read-all`
**Auth Required**: Yes

**Response** (200 OK):
```json
{
  "success": true,
  "message": "All notifications marked as read"
}
```

---

### 10. Dashboard Endpoints

#### 10.1 Get Dashboard Summary

Get dashboard overview data.

**Endpoint**: `GET /dashboard/summary`
**Auth Required**: Yes

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "sites": {
      "total": 2,
      "up": 1,
      "down": 0,
      "degraded": 1
    },
    "alerts": {
      "total": 15,
      "triggered": 3,
      "acknowledged": 2
    },
    "health": {
      "avgUptime": 97.6,
      "avgResponseTime": 145
    },
    "analytics": {
      "totalPageViews": 45234,
      "uniqueVisitors": 8934,
      "activeUsers": 23
    },
    "recentActivity": [
      {
        "type": "alert",
        "message": "EmenTech response time high",
        "timestamp": "2025-01-20T10:15:00Z"
      }
    ]
  }
}
```

---

## Socket.IO Events

### Connection

**Client Connect**:
```javascript
const socket = io('https://admin.ementech.co.ke', {
  auth: {
    token: 'access_token_here'
  }
});
```

**Server Connection Success**:
```javascript
socket.on('connected', (data) => {
  console.log('Connected:', data);
  // { socketId: '...', userId: '...' }
});
```

### Real-time Events

**Subscribe to Site Updates**:
```javascript
// Client
socket.emit('subscribe:site', siteId);

// Server confirmation
socket.on('subscribed', (data) => {
  // { siteId: '...', channel: 'site:123' }
});
```

**Health Status Update**:
```javascript
// Server → Client
socket.on('health:update', (data) => {
  // {
  //   siteId: '...',
  //   status: 'up',
  //   responseTime: 123,
  //   timestamp: '2025-01-20T10:30:00Z'
  // }
});
```

**Alert Triggered**:
```javascript
// Server → Client
socket.on('alert:triggered', (alert) => {
  // { alertId, siteId, type, severity, message, timestamp }
});
```

**Alert Acknowledged**:
```javascript
// Server → Client
socket.on('alert:acknowledged', (data) => {
  // { alertId, acknowledgedBy, timestamp }
});
```

**Alert Resolved**:
```javascript
// Server → Client
socket.on('alert:resolved', (data) => {
  // { alertId, resolvedBy, timestamp }
});
```

**Real-time Analytics**:
```javascript
// Server → Client
socket.on('analytics:live', (data) => {
  // {
  //   siteId: '...',
  //   activeUsers: 23,
  //   pageViews: 145,
  //   timestamp: '...'
  // }
});
```

**Notification**:
```javascript
// Server → Client
socket.on('notification', (notification) => {
  // { id, type, title, message, priority }
});
```

### Unsubscribe

```javascript
// Client
socket.emit('unsubscribe:site', siteId);
```

---

## Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `AUTH_INVALID_CREDENTIALS` | 401 | Invalid email or password |
| `AUTH_TOKEN_EXPIRED` | 401 | Access token expired |
| `AUTH_TOKEN_INVALID` | 401 | Invalid token |
| `AUTH_UNAUTHORIZED` | 403 | Missing required permission |
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `NOT_FOUND` | 404 | Resource not found |
| `SITE_NOT_FOUND` | 404 | Site not found |
| `ALERT_NOT_FOUND` | 404 | Alert not found |
| `USER_NOT_FOUND` | 404 | User not found |
| `SITE_EXISTS` | 409 | Site with this domain already exists |
| `USER_EXISTS` | 409 | User with this email already exists |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Internal server error |

---

## Webhooks

### Alert Webhook Payload

When an alert is triggered, a POST request is sent to configured webhooks:

```json
{
  "event": "alert.triggered",
  "timestamp": "2025-01-20T10:15:00Z",
  "alert": {
    "id": "507f1f77bcf86cd799439020",
    "type": "uptime",
    "severity": "critical",
    "name": "High Uptime Alert"
  },
  "site": {
    "id": "507f1f77bcf86cd799439011",
    "name": "EmenTech",
    "url": "https://ementech.co.ke"
  },
  "incident": {
    "value": 85.5,
    "threshold": 95,
    "message": "Uptime dropped below 95%"
  }
}
```

### Alert Resolved Webhook

```json
{
  "event": "alert.resolved",
  "timestamp": "2025-01-20T10:30:00Z",
  "alert": {
    "id": "507f1f77bcf86cd799439020",
    "type": "uptime",
    "name": "High Uptime Alert"
  },
  "site": {
    "id": "507f1f77bcf86cd799439011",
    "name": "EmenTech"
  },
  "duration": 15
}
```

---

**Document Version**: 1.0.0
**Last Updated**: 2025-01-20
**Author**: Architecture Team
**Status**: Complete - Ready for Implementation
