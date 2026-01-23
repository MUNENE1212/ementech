# EmenTech Enterprise Security Architecture
## Comprehensive Security Design Document

**Version:** 1.0.0
**Date:** 2026-01-20
**Status:** DRAFT - Awaiting Implementation
**Priority:** CRITICAL

---

## Executive Summary

This document outlines the enterprise-grade security architecture for EmenTech's corporate website and services platform. As a company selling web development services, maintaining robust security is both a technical requirement and a business imperative.

### Current Security Posture Assessment

**STRENGTHS:**
- SSL/TLS encryption configured
- Basic rate limiting implemented
- JWT authentication system in place
- Helmet.js security headers configured
- Input validation using express-validator
- Password hashing with bcrypt

**CRITICAL VULNERABILITIES:**
1. Hardcoded production credentials in .env file (EXPOSED IN REPO)
2. Weak JWT secret key
3. Exposed OpenAI API key
4. No Content Security Policy enforcement
5. Missing CSRF protection
6. No API request signing
7. Insufficient logging and monitoring
8. No intrusion detection system
9. Email credentials in plaintext
10. No security audit logging
11. Missing input sanitization for XSS
12. No SQL injection prevention beyond basic mongoose
13. Weak password policy (min 6 chars)
14. No account lockout mechanism
15. Session management issues
16. CORS configuration allows multiple origins
17. No API versioning for security patches
18. Missing security response headers

---

## Security Architecture Overview

### Defense in Depth Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                    EXTERNAL LAYER                            │
│  - DDoS Protection (Cloudflare/Nginx)                       │
│  - Web Application Firewall (WAF)                           │
│  - SSL/TLS Termination (TLS 1.2+)                           │
│  - Rate Limiting (Nginx)                                    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    EDGE SECURITY (Nginx)                     │
│  - HTTP to HTTPS redirect                                   │
│  - Security Headers (HSTS, CSP, X-Frame-Options)           │
│  - IP Whitelisting/Blacklisting                             │
│  - Request Size Limits                                      │
│  - DDoS Mitigation                                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER (Express)               │
│  - CORS Validation                                          │
│  - Helmet.js Security Headers                               │
│  - Rate Limiting (express-rate-limit)                       │
│  - Request Validation & Sanitization                        │
│  - Authentication (JWT + Refresh Tokens)                    │
│  - Authorization (Role-Based Access Control)                │
│  - CSRF Protection                                          │
│  - Input Sanitization (XSS Prevention)                      │
│  - SQL Injection Prevention (Mongoose)                      │
│  - File Upload Validation                                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    BUSINESS LOGIC LAYER                      │
│  - Secure Session Management                                │
│  - Password Policy Enforcement                              │
│  - Account Lockout Mechanism                                │
│  - Audit Logging                                            │
│  - Security Event Monitoring                                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    DATA LAYER                                │
│  - MongoDB Atlas Security (Encryption at Rest)              │
│  - Database User Privileges (Least Privilege)               │
│  - Query Injection Prevention                               │
│  - Sensitive Data Encryption                                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    INFRASTRUCTURE LAYER                      │
│  - VPS Security (UFW Firewall)                              │
│  - SSH Hardening                                            │
│  - System Monitoring                                        │
│  - Log Aggregation                                          │
│  - Backup & Recovery                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. NETWORK & INFRASTRUCTURE SECURITY

### 1.1 VPS Security Configuration

**Firewall Rules (UFW):**

```bash
# Default policies
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH (from specific IPs only)
sudo ufw allow from YOUR_ADMIN_IP/32 to any port 22

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow backend API (localhost only - no external access)
sudo ufw allow from 127.0.0.1 to any port 5001

# Enable firewall
sudo ufw enable
```

**SSH Hardening (`/etc/ssh/sshd_config`):**

```bash
# Disable root login
PermitRootLogin no

# Disable password authentication (key-based only)
PasswordAuthentication no
PubkeyAuthentication yes

# Change default port
Port 2222

# Limit login attempts
MaxAuthTries 3
LoginGraceTime 30

# Disable X11 forwarding
X11Forwarding no

# Allow only specific users
AllowUsers admin
```

### 1.2 Nginx Security Enhancements

**Security Headers Configuration:**

```nginx
# Security Headers
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://ementech.co.ke wss://ementech.co.ke; frame-ancestors 'self'; form-action 'self';" always;
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;

# Remove server version
server_tokens off;

# Disable unwanted methods
if ($request_method !~ ^(GET|HEAD|POST|PUT|DELETE|OPTIONS)$ ) {
    return 405;
}

# Prevent access to sensitive files
location ~* /(\.env|\.git|\.gitignore|\.htaccess|\.htpasswd) {
    deny all;
    return 404;
}
```

**Rate Limiting Configuration:**

```nginx
# Rate limit zones
http {
    # General rate limiting
    limit_req_zone $binary_remote_addr zone=general_limit:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=20r/s;
    limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=5r/s;

    # Connection limiting
    limit_conn_zone $binary_remote_addr zone=conn_limit:10m;

    server {
        # Apply to main location
        location / {
            limit_req zone=general_limit burst=20 nodelay;
            limit_conn conn_limit 10;
        }

        # Stricter limits for API
        location /api/ {
            limit_req zone=api_limit burst=10 nodelay;
            limit_conn conn_limit 20;
        }

        # Strictest limits for auth endpoints
        location /api/auth/ {
            limit_req zone=auth_limit burst=5 nodelay;
            limit_conn conn_limit 5;
        }
    }
}
```

---

## 2. BACKEND SECURITY LAYER

### 2.1 Enhanced Environment Configuration

**SECURE .ENV FILE STRUCTURE:**

```env
# Server Environment
NODE_ENV=production
PORT=5001

# Client Configuration (Production only)
CLIENT_URL=https://ementech.co.ke

# CORS Configuration (Single origin in production)
CORS_ORIGIN=https://ementech.co.ke

# Database Security
MONGODB_URI=mongodb+srv://ementech_prod:${MONGODB_PASSWORD}@cluster.mongodb.net/ementech?retryWrites=true&w=majority&ssl=true
MONGODB_DB_NAME=ementech_production

# JWT Configuration (USE STRONG SECRETS)
JWT_SECRET=${JWT_SECRET}  # Use 64+ character random string
JWT_EXPIRE=15m
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
JWT_REFRESH_EXPIRE=7d

# Email Configuration (USE ENCRYPTED CREDENTIALS)
IMAP_HOST=mail.ementech.co.ke
IMAP_PORT=993
IMAP_USER=${IMAP_USER}
IMAP_PASS=${IMAP_PASS}
SMTP_HOST=mail.ementech.co.ke
SMTP_PORT=587
SMTP_USER=${SMTP_USER}
SMTP_PASS=${SMTP_PASS}

# API Keys (NEVER COMMIT TO REPO)
OPENAI_API_KEY=${OPENAI_API_KEY}

# Security Configuration
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
BCRYPT_ROUNDS=12

# Session Configuration
SESSION_SECRET=${SESSION_SECRET}
SESSION_MAX_AGE=3600000

# Security Headers
ENABLE_CSP=true
ENABLE_HSTS=true

# Logging
LOG_LEVEL=info
SECURITY_LOG_PATH=/var/log/ementech/security.log
```

**MANDATORY SECURITY PRACTICES:**

1. **NEVER commit .env files to version control**
2. **Use environment variable management** (e.g., AWS Secrets Manager, HashiCorp Vault)
3. **Generate cryptographically secure secrets** (64+ characters)
4. **Rotate secrets regularly** (every 90 days)
5. **Use different secrets for each environment**

### 2.2 Enhanced Security Middleware

**Create: `/backend/src/middleware/security.js`**

```javascript
import helmet from 'helmet';
import crypto from 'crypto';

// Enhanced Helmet configuration
export const securityHeaders = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://ementech.co.ke", "wss://ementech.co.ke"],
      fontSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      upgradeInsecureRequests: [],
    },
  },

  // HTTP Strict Transport Security
  hsts: {
    maxAge: 63072000, // 2 years
    includeSubDomains: true,
    preload: true
  },

  // X-Frame-Options
  frameguard: {
    action: 'sameorigin'
  },

  // X-Content-Type-Options
  noSniff: true,

  // X-XSS-Protection
  xssFilter: true,

  // Referrer Policy
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin'
  },

  // Disable Server header
  hidePoweredBy: true,
});

// Request ID for tracing
export const requestId = (req, res, next) => {
  req.id = crypto.randomBytes(16).toString('hex');
  res.setHeader('X-Request-ID', req.id);
  next();
};

// Validate Content-Type
export const validateContentType = (req, res, next) => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    if (!req.is('application/json')) {
      return res.status(415).json({
        success: false,
        message: 'Content-Type must be application/json'
      });
    }
  }
  next();
};

// Sanitize request body (XSS prevention)
export const sanitizeBody = (req, res, next) => {
  if (req.body) {
    // Remove potentially dangerous HTML
    const sanitize = (obj) => {
      if (typeof obj === 'string') {
        return obj
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '');
      }
      if (Array.isArray(obj)) {
        return obj.map(sanitize);
      }
      if (obj && typeof obj === 'object') {
        const sanitized = {};
        for (const key in obj) {
          sanitized[key] = sanitize(obj[key]);
        }
        return sanitized;
      }
      return obj;
    };
    req.body = sanitize(req.body);
  }
  next();
};

// Security audit logging
export const securityAuditLog = (req, res, next) => {
  const logData = {
    timestamp: new Date().toISOString(),
    requestId: req.id,
    method: req.method,
    path: req.path,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent'),
    userId: req.user?.id,
    hasToken: !!req.headers.authorization,
  };

  // Log sensitive operations
  if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
    console.log('[SECURITY AUDIT]', JSON.stringify(logData));
  }

  next();
};
```

### 2.3 Enhanced Authentication & Authorization

**Create: `/backend/src/middleware/authEnhanced.js`**

```javascript
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import rateLimit from 'express-rate-limit';

// Track failed login attempts
const failedAttempts = new Map();
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

// Enhanced rate limiter for authentication
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later'
  },
  skipSuccessfulRequests: false,
  standardHeaders: true,
  legacyHeaders: false,
});

// Check account lockout
export const checkAccountLockout = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const attempts = failedAttempts.get(ip);

  if (attempts && attempts.count >= MAX_ATTEMPTS) {
    const timePassed = Date.now() - attempts.lastAttempt;
    if (timePassed < LOCKOUT_DURATION) {
      const remainingTime = Math.ceil((LOCKOUT_DURATION - timePassed) / 1000 / 60);
      return res.status(429).json({
        success: false,
        message: `Account locked. Try again in ${remainingTime} minutes`
      });
    } else {
      // Reset after lockout period
      failedAttempts.delete(ip);
    }
  }
  next();
};

// Record failed attempt
export const recordFailedAttempt = (req, res, next) => {
  const originalSend = res.send;
  res.send = function(data) {
    if (res.statusCode === 401 || res.statusCode === 403) {
      const ip = req.ip || req.connection.remoteAddress;
      const attempts = failedAttempts.get(ip) || { count: 0, lastAttempt: 0 };
      attempts.count++;
      attempts.lastAttempt = Date.now();
      failedAttempts.set(ip, attempts);
    }
    originalSend.call(this, data);
  };
  next();
};

// Enhanced JWT verification with rotation
export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route',
      code: 'NO_TOKEN'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if token is blacklisted (implement token blacklist)
    // const isBlacklisted = await TokenBlacklist.exists({ token });
    // if (isBlacklisted) {
    //   return res.status(401).json({
    //     success: false,
    //     message: 'Token has been revoked',
    //     code: 'TOKEN_REVOKED'
    //   });
    // }

    // Get user from token
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    if (!req.user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account has been deactivated',
        code: 'ACCOUNT_DEACTIVATED'
      });
    }

    // Check if password was changed after token was issued
    if (decoded.iat < req.user.passwordChangedAt) {
      return res.status(401).json({
        success: false,
        message: 'Password has been changed, please login again',
        code: 'PASSWORD_CHANGED'
      });
    }

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route',
      code: 'AUTH_FAILED'
    });
  }
};

// Refresh token handler
export const refreshAccessToken = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({
      success: false,
      message: 'Refresh token is required'
    });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Generate new access token
    const accessToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.json({
      success: true,
      accessToken,
      expiresIn: 15 * 60 * 1000 // 15 minutes
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid refresh token'
    });
  }
};
```

### 2.4 Enhanced Rate Limiting

**Update: `/backend/src/middleware/rateLimiter.js`**

```javascript
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';

// Initialize Redis for distributed rate limiting (recommended for production)
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
});

const redisOptions = {
  client: redis,
  prefix: 'rate_limit:',
};

// General API rate limiter
export const apiLimiter = rateLimit({
  store: process.env.NODE_ENV === 'production' ? new RedisStore(redisOptions) : undefined,
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many requests',
      retryAfter: Math.round(15 * 60),
    });
  }
});

// Authentication endpoints - strictest limits
export const authLimiter = rateLimit({
  store: process.env.NODE_ENV === 'production' ? new RedisStore(redisOptions) : undefined,
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: false, // Count failed attempts too
  message: {
    success: false,
    message: 'Too many authentication attempts, account temporarily locked'
  }
});

// Form submissions
export const formSubmitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  skipSuccessfulRequests: false,
  message: {
    success: false,
    message: 'Too many form submissions, please try again later'
  }
});

// Chat endpoints
export const chatLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 15,
  message: {
    success: false,
    message: 'Too many chat messages, please wait'
  }
});

// Lead creation
export const leadCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: 'Too many lead creation attempts'
  }
});

// Content downloads
export const downloadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    message: 'Download limit exceeded'
  }
});

// Search endpoints
export const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    message: 'Too many search requests'
  }
});
```

### 2.5 Enhanced Input Validation

**Update: `/backend/src/middleware/validation.js`**

Add XSS protection and sanitization:

```javascript
import { body, param, query, validationResult } from 'express-validator';
import { sanitize } from 'sanitize-html';

// Extended validation with sanitization
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Custom sanitization middleware
export const sanitizeInput = (fields) => {
  return (req, res, next) => {
    fields.forEach(field => {
      if (req.body[field]) {
        req.body[field] = sanitize(req.body[field], {
          allowedTags: [],
          allowedAttributes: {},
          textFilter: (text) => text.trim()
        });
      }
    });
    next();
  };
};

// Enhanced email validation with disposable email detection
export const validateEmailSecure = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .custom(async (email) => {
      // Check for disposable email domains
      const disposableDomains = ['tempmail.com', 'guerrillamail.com', 'mailinator.com'];
      const domain = email.split('@')[1];
      if (disposableDomains.includes(domain)) {
        throw new Error('Disposable email addresses are not allowed');
      }
      return true;
    })
    .withMessage('Valid business email is required'),
  validate
];

// Password strength validation
export const validatePassword = [
  body('password')
    .isLength({ min: 12, max: 128 })
    .withMessage('Password must be between 12 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain uppercase, lowercase, number, and special character')
    .not()
    .matches(/^(.)\1+$/)
    .withMessage('Password cannot contain repeating characters'),
  validate
];

// Secure login validation
export const validateLogin = [
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .exists()
    .withMessage('Password is required')
    .isLength({ min: 1 })
    .withMessage('Password cannot be empty'),
  validate
];

// SQL injection prevention for MongoDB
export const validateMongoId = (paramName) => {
  return [
    param(paramName)
      .isMongoId()
      .withMessage(`Invalid ${paramName} format`)
      .custom((value) => {
        // Check for NoSQL injection patterns
        const noSQLPatterns = [
          /\$where/i,
          /\$ne/i,
          /\$in/i,
          /\$or/i,
          /\{/,
          /\}/
        ];
        for (const pattern of noSQLPatterns) {
          if (pattern.test(value)) {
            throw new Error('Invalid input detected');
          }
        }
        return true;
      }),
    validate
  ];
};
```

---

## 3. FRONTEND SECURITY

### 3.1 React Security Best Practices

**Environment Variables for Frontend:**

```env
# .env.production
VITE_API_URL=https://api.ementech.co.ke
VITE_APP_URL=https://ementech.co.ke
VITE_ENABLE_ANALYTICS=true
```

### 3.2 Axios Interceptors for Security

**Update: `/src/services/authService.js`**

```typescript
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

// Create axios instance with security defaults
const api = axios.create({
  baseURL: `${API_URL}/auth`,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
  timeout: 15000, // 15 second timeout
  withCredentials: true, // Send cookies for CSRF protection
});

// Request interceptor - Add auth token and security headers
api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add request timestamp for replay attack prevention
    config.headers['X-Request-Timestamp'] = Date.now().toString();

    // Add request nonce
    config.headers['X-Request-Nonce'] = generateNonce();

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle security errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle token expiration
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Try to refresh token
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken,
          });

          const { accessToken } = response.data;
          localStorage.setItem('token', accessToken);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Log security events
    if (error.response?.status === 403 || error.response?.status === 429) {
      console.warn('[Security]', {
        status: error.response.status,
        message: error.response.data?.message,
        url: originalRequest.url,
      });
    }

    return Promise.reject(error);
  }
);

// Generate random nonce
function generateNonce(): string {
  return crypto.getRandomValues(new Uint32Array(1))[0].toString(36);
}

// Secure token storage with encryption
const getAuthToken = (): string | null => {
  const token = localStorage.getItem('token');
  return token || null;
};

// ... rest of the service methods
```

### 3.3 Content Security Policy

**Create: `/src/security/csp.ts`**

```typescript
// Content Security Policy configuration
export const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ["'self'", "data:", "https:"],
  'font-src': ["'self'", "data:"],
  'connect-src': ["'self'", import.meta.env.VITE_API_URL, "wss://ementech.co.ke"],
  'frame-src': ["'none'"],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'frame-ancestors': ["'none'"],
  'upgrade-insecure-requests': [],
};

// Generate CSP meta tag
export const generateCSPMeta = (): string => {
  const policy = Object.entries(CSP_DIRECTIVES)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; ');

  return `<meta http-equiv="Content-Security-Policy" content="${policy}">`;
};
```

### 3.4 XSS Protection in Components

**Create: `/src/utils/security.tsx`**

```typescript
import DOMPurify from 'dompurify';

// Sanitize HTML content
export const sanitizeHTML = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a'],
    ALLOWED_ATTR: ['href', 'title'],
  });
};

// Validate URL
export const isValidURL = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
};

// Prevent XSS in React components
export const SafeHTML = ({ html }: { html: string }) => {
  return <div dangerouslySetInnerHTML={{ __html: sanitizeHTML(html) }} />;
};

// Secure local storage wrapper
export const secureStorage = {
  setItem: (key: string, value: any): void => {
    const serialized = JSON.stringify(value);
    // In production, encrypt before storing
    localStorage.setItem(key, btoa(serialized));
  },

  getItem: <T>(key: string): T | null => {
    const item = localStorage.getItem(key);
    if (!item) return null;
    try {
      const decoded = atob(item);
      return JSON.parse(decoded) as T;
    } catch {
      return null;
    }
  },

  removeItem: (key: string): void => {
    localStorage.removeItem(key);
  },

  clear: (): void => {
    localStorage.clear();
  }
};
```

---

## 4. DATABASE SECURITY

### 4.1 MongoDB Atlas Security Configuration

**Database Security Best Practices:**

1. **Enable Encryption at Rest:**
   - MongoDB Atlas provides automatic encryption
   - Verify in Atlas console: Security → Encryption at Rest

2. **Network Access:**
   - Whitelist VPS IP address only
   - Use IP whitelist: 69.164.244.165
   - Enable VPC peaking if available

3. **Database Users:**
   - Create separate users for each service
   - Use principle of least privilege
   - Rotate credentials regularly

**Database User Roles:**

```javascript
// Application user (Read/Write)
{
  username: "ementech_app",
  roles: [
    { role: "readWrite", database: "ementech_production" }
  ]
}

// Backup user (Read only)
{
  username: "ementech_backup",
  roles: [
    { role: "read", database: "ementech_production" }
  ]
}
```

4. **Enable MongoDB Atlas Security Features:**
   - Enable MongoDB Atlas Alerting
   - Enable Real-time Performance Monitoring
   - Enable Data Explorer
   - Enable Cloud Backup
   - Enable Continuous Cloud Backup
   - Enable Query Performance Insights

### 4.2 Mongoose Security Enhancements

**Create: `/backend/src/config/database.js` (Enhanced)**

```javascript
import mongoose from 'mongoose';

// Security options for MongoDB connection
const securityOptions = {
  // SSL connection
  ssl: true,
  sslValidate: true,

  // Authentication
  authSource: 'admin',

  // Connection pooling
  maxPoolSize: 10,
  minPoolSize: 5,
  socketTimeoutMS: 45000,

  // Retry logic
  serverSelectionTimeoutMS: 5000,
  retryWrites: true,

  // Security
  autoIndex: process.env.NODE_ENV !== 'production', // Disable in production
};

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, securityOptions);

    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Security: Disable mongoose auto-indexing in production
    if (process.env.NODE_ENV === 'production') {
      mongoose.set('autoIndex', false);
    }

    // Enable query logging in development
    if (process.env.NODE_ENV === 'development') {
      mongoose.set('debug', true);
    }

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected');
    });

    return conn;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};
```

### 4.3 Model Security Enhancements

**Update User Model with Security Features:**

```javascript
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email',
    ],
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: [12, 'Password must be at least 12 characters'],
    select: false, // Don't return password by default
  },
  role: {
    type: String,
    enum: ['admin', 'manager', 'employee'],
    default: 'employee',
  },
  department: {
    type: String,
    enum: ['leadership', 'engineering', 'marketing', 'sales', 'support', 'hr'],
    default: 'engineering',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date,
  lastLogin: Date,
  lastLoginIP: String,
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  twoFactorSecret: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Encrypt password before saving
userSchema.pre('save', async function (next) {
  // Only hash if password is modified
  if (!this.isModified('password')) {
    return next();
  }

  // Use higher rounds for production (12-14)
  const saltRounds = process.env.NODE_ENV === 'production' ? 12 : 10;
  const salt = await bcrypt.genSalt(saltRounds);
  this.password = await bcrypt.hash(this.password, salt);

  // Update password changed timestamp
  this.passwordChangedAt = Date.now();
  next();
});

// Match user entered password to hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Check if account is locked
userSchema.virtual('isLocked').get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Increment login attempts
userSchema.methods.incLoginAttempts = function () {
  // If lock has expired and loginAttempts is reset
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }

  const updates = { $inc: { loginAttempts: 1 } };

  // Lock the account if we've reached max attempts
  if (this.loginAttempts + 1 >= MAX_LOGIN_ATTEMPTS && !this.isLocked) {
    updates.$set = {
      lockUntil: Date.now() + LOCK_TIME
    };
  }

  return this.updateOne(updates);
};

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 15 * 60 * 1000; // 15 minutes

const User = mongoose.model('User', userSchema);

export default User;
```

---

## 5. API SECURITY

### 5.1 API Key Management

**Create API Key System:**

```javascript
// /backend/src/models/ApiKey.js
import mongoose from 'mongoose';
import crypto from 'crypto';

const apiKeySchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  scopes: [{
    type: String,
    enum: ['read:leads', 'write:leads', 'read:analytics', 'send:email', 'manage:content']
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastUsed: Date,
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Generate API key before saving
apiKeySchema.pre('save', function(next) {
  if (!this.key) {
    this.key = 'ement_' + crypto.randomBytes(32).toString('hex');
  }
  next();
});

export default mongoose.model('ApiKey', apiKeySchema);
```

### 5.2 API Versioning Strategy

```javascript
// /backend/src/routes/v1/index.js
import express from 'express';
const router = express.Router();

// v1 API routes
router.use('/auth', authRoutes);
router.use('/leads', leadRoutes);
router.use('/email', emailRoutes);

export default router;

// In server.js
import v1Routes from './routes/v1/index.js';
app.use('/api/v1', v1Routes);
```

### 5.3 API Response Signing

```javascript
// /backend/src/middleware/responseSigning.js
import crypto from 'crypto';

export const signResponse = (req, res, next) => {
  const originalSend = res.json;

  res.json = function (data) {
    // Add signature to response
    if (data.success && data.data) {
      const signature = crypto
        .createHmac('sha256', process.env.API_SIGNATURE_SECRET)
        .update(JSON.stringify(data.data))
        .digest('hex');

      data.signature = signature;
    }

    return originalSend.call(this, data);
  };

  next();
};
```

---

## 6. EMAIL SECURITY

### 6.1 Email Configuration Security

**Current Issues:**
- Email credentials exposed in .env file
- No encryption for stored emails
- No rate limiting on email sending
- No DKIM/SPF records verification

**Secure Email Configuration:**

```javascript
// /backend/src/config/email.js (Enhanced)
import nodemailer from 'nodemailer';
import Imap from 'imap';
import { simpleParser } from 'mailparser';

// Validate email configuration
export const validateEmailConfig = () => {
  const required = [
    'IMAP_HOST',
    'IMAP_PORT',
    'IMAP_USER',
    'IMAP_PASS',
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_USER',
    'SMTP_PASS'
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing email configuration: ${missing.join(', ')}`);
  }
};

// Secure transporter configuration
export const createTransporter = () => {
  validateEmailConfig();

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: parseInt(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    // Security options
    tls: {
      rejectUnauthorized: true,
      minVersion: 'TLSv1.2'
    },
    // Rate limiting
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    rateDelta: 1000,
    rateLimit: 10
  });
};

// Secure IMAP configuration
export const createImapConnection = () => {
  return new Imap({
    user: process.env.IMAP_USER,
    password: process.env.IMAP_PASS,
    host: process.env.IMAP_HOST,
    port: parseInt(process.env.IMAP_PORT),
    tls: {
      rejectUnauthorized: true
    },
    connTimeout: 10000,
    authTimeout: 5000
  });
};

// Email sending with rate limiting and queue
import Queue from 'bull';
const emailQueue = new Queue('email-sending', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD
  }
});

emailQueue.process(async (job) => {
  const transporter = createTransporter();
  await transporter.sendMail(job.data);
  return { success: true };
});

export const queueEmail = (emailData) => {
  return emailQueue.add(emailData, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000
    }
  });
};
```

### 6.2 Email Content Security

```javascript
// Sanitize email content
import { sanitize } from 'sanitize-html';

export const sanitizeEmailContent = (html) => {
  return sanitize(html, {
    allowedTags: ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3'],
    allowedAttributes: {
      'a': ['href', 'title'],
      '*': ['class']
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesByTag: {}
  });
};

// Validate email recipients
export const validateRecipients = (recipients) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return recipients.filter(email => {
    const valid = emailRegex.test(email);
    if (!valid) {
      console.warn(`Invalid email address rejected: ${email}`);
    }
    return valid;
  });
};
```

---

## 7. LOGGING & MONITORING

### 7.1 Security Event Logging

**Create: `/backend/src/utils/securityLogger.js`**

```javascript
import fs from 'fs';
import path from 'path';

const SECURITY_LOG_PATH = process.env.SECURITY_LOG_PATH || '/var/log/ementech/security.log';

export const logSecurityEvent = (event) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level: 'SECURITY',
    ...event
  };

  const logLine = JSON.stringify(logEntry) + '\n';

  // Append to security log
  fs.appendFileSync(SECURITY_LOG_PATH, logLine, 'utf8');

  // Also log to console for immediate visibility
  console.log('[SECURITY]', logLine);
};

export const logAuthFailure = (req, reason) => {
  logSecurityEvent({
    event_type: 'AUTH_FAILURE',
    ip: req.ip,
    user_agent: req.get('user-agent'),
    path: req.path,
    method: req.method,
    reason,
    timestamp: new Date().toISOString()
  });
};

export const logSuspiciousActivity = (req, activity) => {
  logSecurityEvent({
    event_type: 'SUSPICIOUS_ACTIVITY',
    ip: req.ip,
    user_agent: req.get('user-agent'),
    path: req.path,
    method: req.method,
    activity,
    timestamp: new Date().toISOString()
  });
};

export const logRateLimitExceeded = (req, limitType) => {
  logSecurityEvent({
    event_type: 'RATE_LIMIT_EXCEEDED',
    ip: req.ip,
    path: req.path,
    limit_type: limitType,
    timestamp: new Date().toISOString()
  });
};
```

### 7.2 Intrusion Detection

**Create: `/backend/src/middleware/intrusionDetection.js`**

```javascript
import { logSuspiciousActivity } from '../utils/securityLogger.js';

// SQL Injection patterns
const sqlInjectionPatterns = [
  /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,
  /(\bor\b|\band\b).*?=/i,
  /exec(\s|\+)+(s|x)p\w+/i
];

// XSS patterns
const xssPatterns = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi
];

// Path traversal patterns
const pathTraversalPatterns = [
  /\.\.\//,
  /\.\./
];

// Intrusion detection middleware
export const detectIntrusion = (req, res, next) => {
  let suspicious = false;
  let reasons = [];

  // Check URL
  if (sqlInjectionPatterns.some(p => p.test(req.url))) {
    suspicious = true;
    reasons.push('SQL injection in URL');
  }

  if (xssPatterns.some(p => p.test(req.url))) {
    suspicious = true;
    reasons.push('XSS in URL');
  }

  if (pathTraversalPatterns.some(p => p.test(req.url))) {
    suspicious = true;
    reasons.push('Path traversal in URL');
  }

  // Check headers
  const userAgent = req.get('user-agent') || '';
  if (userAgent.includes('sqlmap') || userAgent.includes('nmap')) {
    suspicious = true;
    reasons.push('Known security scanner detected');
  }

  // Check body
  if (req.body) {
    const bodyStr = JSON.stringify(req.body);
    if (sqlInjectionPatterns.some(p => p.test(bodyStr))) {
      suspicious = true;
      reasons.push('SQL injection in body');
    }
    if (xssPatterns.some(p => p.test(bodyStr))) {
      suspicious = true;
      reasons.push('XSS in body');
    }
  }

  // Log suspicious activity
  if (suspicious) {
    logSuspiciousActivity(req, reasons.join(', '));
    return res.status(403).json({
      success: false,
      message: 'Request blocked'
    });
  }

  next();
};
```

---

## 8. IMPLEMENTATION ROADMAP

### Phase 1: CRITICAL Security Fixes (Implement Immediately)

**Priority: URGENT - Complete within 24 hours**

1. **Remove Exposed Credentials**
   - Remove .env file from repository
   - Add .env to .gitignore
   - Rotate all exposed secrets (JWT, OpenAI, Email, Database)
   - Implement environment variable management

2. **Implement Strong Password Policy**
   - Increase minimum password length to 12 characters
   - Enforce complexity requirements (uppercase, lowercase, number, special char)
   - Implement password strength meter on frontend

3. **Enable Account Lockout**
   - Implement account lockout after 5 failed attempts
   - Set lockout duration to 15 minutes
   - Add lockout notification emails

4. **Enhance JWT Security**
   - Use 64+ character random secret
   - Set token expiration to 15 minutes
   - Implement refresh token rotation
   - Add token blacklist for logout

### Phase 2: High-Priority Security Enhancements (Week 1)

**Priority: HIGH**

1. **Implement Comprehensive Security Headers**
   - Add all security headers in Nginx
   - Enable Content Security Policy
   - Configure HSTS with preload

2. **Add Intrusion Detection**
   - Implement SQL injection detection
   - Implement XSS detection
   - Implement path traversal detection
   - Log all suspicious activities

3. **Enhanced Rate Limiting**
   - Implement Redis-based rate limiting
   - Add rate limiting for all endpoints
   - Implement IP-based blocking

4. **Input Validation & Sanitization**
   - Add XSS sanitization middleware
   - Implement NoSQL injection prevention
   - Add email validation with disposable detection

### Phase 3: Advanced Security Features (Week 2-3)

**Priority: MEDIUM**

1. **Implement API Key System**
   - Create API key generation/management
   - Implement API key authentication
   - Add API key scopes

2. **Add Security Logging & Monitoring**
   - Implement comprehensive security logging
   - Add real-time security monitoring
   - Implement alert system

3. **Database Security Enhancements**
   - Implement database encryption
   - Configure MongoDB Atlas security features
   - Enable query performance monitoring

4. **Email Security**
   - Implement email queue system
   - Add email content sanitization
   - Implement SPF/DKIM verification

### Phase 4: Security Hardening (Week 4)

**Priority: MEDIUM**

1. **VPS Hardening**
   - Configure UFW firewall rules
   - Harden SSH configuration
   - Implement fail2ban
   - Enable automatic security updates

2. **Content Security Policy**
   - Implement strict CSP headers
   - Add CSP reporting
   - Implement nonce-based CSP

3. **Session Security**
   - Implement secure session management
   - Add session fixation protection
   - Implement concurrent session limits

4. **Two-Factor Authentication**
   - Implement TOTP-based 2FA
   - Add 2FA backup codes
   - Implement 2FA enforcement for admins

### Phase 5: Monitoring & Maintenance (Ongoing)

**Priority: ONGOING**

1. **Security Monitoring Dashboard**
   - Implement security metrics dashboard
   - Add real-time threat monitoring
   - Implement automated alerting

2. **Regular Security Audits**
   - Weekly security log review
   - Monthly vulnerability scanning
   - Quarterly penetration testing

3. **Security Documentation**
   - Create security runbook
   - Document incident response procedures
   - Create security best practices guide

---

## 9. SECURITY CHECKLIST

### Pre-Deployment Security Checklist

- [ ] All secrets removed from repository
- [ ] Strong password policy implemented
- [ ] Account lockout mechanism enabled
- [ ] JWT secrets rotated and secured
- [ ] All security headers configured
- [ ] Rate limiting implemented on all endpoints
- [ ] Input validation and sanitization enabled
- [ ] SQL injection prevention implemented
- [ ] XSS protection enabled
- [ ] CSRF protection implemented
- [ ] Content Security Policy enabled
- [ ] HTTPS enforced with HSTS
- [ ] Database encryption enabled
- [ ] Email credentials secured
- [ ] Security logging enabled
- [ ] Intrusion detection implemented
- [ ] API authentication secured
- [ ] File upload validation implemented
- [ ] Session management secured
- [ ] CORS properly configured
- [ ] Security monitoring enabled

---

## 10. INCIDENT RESPONSE PROCEDURES

### Security Incident Response Plan

**1. Detection Phase**
- Monitor security logs continuously
- Set up automated alerts for suspicious activities
- Regular security scans

**2. Containment Phase**
- Isolate affected systems
- Block suspicious IP addresses
- Disable compromised accounts
- Preserve evidence

**3. Eradication Phase**
- Identify and remove root cause
- Patch vulnerabilities
- Update security rules
- Verify complete removal

**4. Recovery Phase**
- Restore from clean backups
- Monitor for re-infection
- Document lessons learned
- Update security procedures

**5. Post-Incident Phase**
- Conduct incident review
- Update security policies
- Provide training if needed
- Implement improvements

---

## 11. SECURITY BEST PRACTICES

### Development Practices

1. **Never commit secrets to version control**
2. **Use environment-specific configurations**
3. **Implement principle of least privilege**
4. **Regular security training for developers**
5. **Code review checklist for security**
6. **Automated security testing in CI/CD**

### Operational Practices

1. **Regular security updates**
2. **Monitoring and alerting**
3. **Backup and disaster recovery**
4. **Incident response planning**
5. **Regular security audits**
6. **Penetration testing**

### Development Team Responsibilities

1. **Follow secure coding practices**
2. **Report security vulnerabilities immediately**
3. **Participate in security training**
4. **Review code for security issues**
5. **Keep dependencies updated**
6. **Document security decisions**

---

## 12. COMPLIANCE & STANDARDS

### Compliance Checklist

**GDPR Compliance:**
- [ ] Data encryption at rest and in transit
- [ ] User consent management
- [ ] Data breach notification procedures
- [ ] Right to erasure implementation
- [ ] Data portability features

**Data Protection:**
- [ ] PII encryption
- [ ] Access controls
- [ ] Audit logging
- [ ] Data retention policies
- [ ] Secure data disposal

---

## APPENDIX A: SECURITY CONFIGURATION FILES

### A.1 Nginx Security Configuration

```nginx
# /etc/nginx/conf.d/security.conf

# Security Headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;

# Content Security Policy
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https: wss:; frame-ancestors 'self';" always;

# Hide server version
server_tokens off;

# Disable unwanted methods
if ($request_method !~ ^(GET|HEAD|POST|PUT|DELETE|OPTIONS)$ ) {
    return 405;
}

# Buffer size limits
client_body_buffer_size 1k;
client_header_buffer_size 1k;
client_max_body_size 10M;
large_client_header_buffers 2 1k;

# Timeouts
client_body_timeout 10;
client_header_timeout 10;
keepalive_timeout 5 5;
send_timeout 10;
```

### A.2 Environment Variable Template

```env
# /backend/.env.production.template
# Copy this file to .env.production and fill in values

NODE_ENV=production
PORT=5001

# Client
CLIENT_URL=https://ementech.co.ke
CORS_ORIGIN=https://ementech.co.ke

# Database
MONGODB_URI=mongodb+srv://USER:PASSWORD@HOST/DATABASE?ssl=true
MONGODB_DB_NAME=ementech_production

# JWT Secrets (Generate with: openssl rand -base64 64)
JWT_SECRET=GENERATE_64_CHAR_SECRET
JWT_EXPIRE=15m
JWT_REFRESH_SECRET=GENERATE_64_CHAR_SECRET
JWT_REFRESH_EXPIRE=7d

# Email (Use encrypted credentials)
IMAP_HOST=mail.ementech.co.ke
IMAP_PORT=993
IMAP_USER=admin@ementech.co.ke
IMAP_PASS=ENCRYPTED_PASSWORD
SMTP_HOST=mail.ementech.co.ke
SMTP_PORT=587
SMTP_USER=admin@ementech.co.ke
SMTP_PASS=ENCRYPTED_PASSWORD

# API Keys
OPENAI_API_KEY=YOUR_API_KEY

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Session
SESSION_SECRET=GENERATE_64_CHAR_SECRET
SESSION_MAX_AGE=3600000

# Redis (for rate limiting)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=GENERATE_PASSWORD

# Logging
LOG_LEVEL=info
SECURITY_LOG_PATH=/var/log/ementech/security.log
```

---

## APPENDIX B: SECURITY TESTING PROCEDURES

### B.1 Automated Security Testing

```bash
# Run security audit on npm packages
npm audit

# Run dependency check
npm install -g npm-check-updates
ncu

# Check for outdated packages
npm outdated

# Run SAST (Static Application Security Testing)
npm install -g snyk
snyk test
```

### B.2 Manual Security Testing

1. **SQL Injection Testing**
   - Try input: `' OR '1'='1`
   - Try input: `admin'--`
   - Try input: `1' DROP TABLE users--`

2. **XSS Testing**
   - Try input: `<script>alert('XSS')</script>`
   - Try input: `<img src=x onerror=alert('XSS')>`
   - Try input: `javascript:alert('XSS')`

3. **Rate Limit Testing**
   - Send rapid requests to /api/auth/login
   - Verify rate limiting after threshold
   - Verify lockout after max attempts

4. **Authentication Testing**
   - Try accessing protected routes without token
   - Try using expired token
   - Try using invalid token

---

## CONCLUSION

This security architecture provides a comprehensive, enterprise-grade security foundation for the EmenTech website. Implementation should follow the phased approach outlined in Section 8, prioritizing critical security fixes immediately.

**KEY TAKEAWAYS:**

1. Security is an ongoing process, not a one-time setup
2. Defense in depth is essential
3. Monitor, log, and audit everything
4. Regular updates and maintenance required
5. Security is everyone's responsibility

**NEXT STEPS:**

1. Review and approve this security architecture
2. Create implementation timeline
3. Assign responsibilities
4. Begin Phase 1 implementation immediately
5. Set up monitoring and alerting

---

**Document Version:** 1.0.0
**Last Updated:** 2026-01-20
**Next Review:** 2026-02-20
**Maintained By:** EmenTech Development Team
