# Security Implementation Guide
## Detailed Technical Specifications for EmenTech Security Architecture

**Version:** 1.0.0
**Date:** 2026-01-20
**Target Implementation:** Complete by 2026-02-20

---

## Table of Contents

1. [Backend Security Implementation](#1-backend-security-implementation)
2. [Frontend Security Implementation](#2-frontend-security-implementation)
3. [Database Security Implementation](#3-database-security-implementation)
4. [Infrastructure Security Implementation](#4-infrastructure-security-implementation)
5. [Email Security Implementation](#5-email-security-implementation)
6. [Monitoring & Logging Implementation](#6-monitoring--logging-implementation)

---

## 1. BACKEND SECURITY IMPLEMENTATION

### 1.1 Critical Security Fixes (IMMEDIATE - Complete in 24 Hours)

#### Task 1.1: Remove Exposed Credentials

**Problem:** .env file contains exposed secrets in repository

**Files to Modify:**
- `/backend/.env` (DELETE from repo)
- `/backend/.gitignore` (ADD .env)
- `/backend/.env.example` (UPDATE with template)

**Implementation Steps:**

1. **Remove .env from git history:**
```bash
# Remove .env from git but keep local copy
cd /media/munen/muneneENT/ementech/ementech-website/backend
git rm --cached .env
git commit -m "security: Remove .env from version control"

# Update .gitignore
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
echo ".env.*.local" >> .gitignore
git add .gitignore
git commit -m "security: Add .env to gitignore"
```

2. **Generate new secure secrets:**

```bash
# Generate JWT Secret (64 characters)
JWT_SECRET=$(openssl rand -base64 64)
echo "JWT_SECRET=$JWT_SECRET"

# Generate Refresh Token Secret
JWT_REFRESH_SECRET=$(openssl rand -base64 64)
echo "JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET"

# Generate Session Secret
SESSION_SECRET=$(openssl rand -base64 64)
echo "SESSION_SECRET=$SESSION_SECRET"
```

3. **Update .env file with new values:**

```env
# Server Configuration
NODE_ENV=production
PORT=5001

# Client Configuration
CLIENT_URL=https://ementech.co.ke
CORS_ORIGIN=https://ementech.co.ke

# Database (USE STRONG PASSWORD)
MONGODB_URI=mongodb+srv://ementech_prod:STRONG_PASSWORD@cluster.mongodb.net/ementech?retryWrites=true&w=majority&ssl=true
MONGODB_DB_NAME=ementech_production

# JWT Configuration (USE GENERATED SECRETS)
JWT_SECRET=PASTE_GENERATED_JWT_SECRET_HERE
JWT_EXPIRE=15m
JWT_REFRESH_SECRET=PASTE_GENERATED_REFRESH_SECRET_HERE
JWT_REFRESH_EXPIRE=7d

# Email (ROTATE THESE CREDENTIALS)
IMAP_HOST=mail.ementech.co.ke
IMAP_PORT=993
IMAP_USER=admin@ementech.co.ke
IMAP_PASS=NEW_STRONG_PASSWORD
SMTP_HOST=mail.ementech.co.ke
SMTP_PORT=587
SMTP_USER=admin@ementech.co.ke
SMTP_PASS=NEW_STRONG_PASSWORD

# API Keys (ROTATE IF EXPOSED)
OPENAI_API_KEY=YOUR_NEW_API_KEY

# Security Configuration
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Session
SESSION_SECRET=PASTE_GENERATED_SESSION_SECRET_HERE
SESSION_MAX_AGE=3600000

# Logging
LOG_LEVEL=info
SECURITY_LOG_PATH=/var/log/ementech/security.log
```

4. **Create environment-specific .env files:**

```bash
# Production
cp .env .env.production

# Development
cp .env .env.development
# Update development values

# Example
echo ".env.production" >> .gitignore
echo ".env.development" >> .gitignore
```

**Verification:**
```bash
# Verify .env is not in git
git ls-files | grep .env

# Should return nothing
```

---

#### Task 1.2: Implement Strong Password Policy

**Problem:** Current minimum password is 6 characters (too weak)

**Files to Create/Modify:**
- Create: `/backend/src/middleware/passwordValidation.js`
- Update: `/backend/src/models/User.js`
- Update: `/backend/src/controllers/authController.js`

**Implementation:**

1. **Create password validation middleware:**

```javascript
// /backend/src/middleware/passwordValidation.js
import { body, validationResult } from 'express-validator';

export const validatePasswordStrength = [
  body('password')
    .isLength({ min: 12, max: 128 })
    .withMessage('Password must be between 12 and 128 characters')
    .matches(/^(?=.*[a-z])/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/^(?=.*[A-Z])/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/^(?=.*\d)/)
    .withMessage('Password must contain at least one number')
    .matches(/^(?=.*[@$!%*?&])/)
    .withMessage('Password must contain at least one special character (@$!%*?&)')
    .not()
    .matches /^(.)\1+$/)
    .withMessage('Password cannot contain repeating characters')
    .not()
    .matches(/password|123456|qwerty|admin/i)
    .withMessage('Password cannot contain common words'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Password validation failed',
        errors: errors.array()
      });
    }
    next();
  }
];

export const calculatePasswordStrength = (password) => {
  let strength = 0;

  // Length bonus
  if (password.length >= 12) strength += 1;
  if (password.length >= 16) strength += 1;

  // Character variety
  if (/[a-z]/.test(password)) strength += 1;
  if (/[A-Z]/.test(password)) strength += 1;
  if (/\d/.test(password)) strength += 1;
  if (/[@$!%*?&]/.test(password)) strength += 1;

  return strength; // 0-6 scale
};
```

2. **Update User model:**

```javascript
// /backend/src/models/User.js (UPDATE password field)
password: {
  type: String,
  required: [true, 'Please add a password'],
  minlength: [12, 'Password must be at least 12 characters'],
  select: false,
  validate: {
    validator: function(v) {
      // Custom validation for strength
      return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/.test(v);
    },
    message: 'Password does not meet strength requirements'
  }
}
```

3. **Update auth controller:**

```javascript
// /backend/src/controllers/authController.js
import { validatePasswordStrength } from '../middleware/passwordValidation.js';

// UPDATE register endpoint
export const register = [
  validatePasswordStrength,
  async (req, res) => {
    // ... existing code
  }
];
```

---

#### Task 1.3: Implement Account Lockout Mechanism

**Problem:** No protection against brute force attacks

**Files to Create/Modify:**
- Create: `/backend/src/middleware/accountLockout.js`
- Update: `/backend/src/models/User.js`
- Update: `/backend/src/controllers/authController.js`

**Implementation:**

1. **Create account lockout middleware:**

```javascript
// /backend/src/middleware/accountLockout.js
import User from '../models/User.js';

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

export const checkAccountLockout = async (req, res, next) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && user.lockUntil && user.lockUntil > Date.now()) {
      const remainingTime = Math.ceil((user.lockUntil - Date.now()) / 1000 / 60);

      return res.status(429).json({
        success: false,
        message: `Account locked due to multiple failed attempts. Please try again in ${remainingTime} minutes.`,
        locked: true,
        remainingTime
      });
    }

    next();
  } catch (error) {
    console.error('Error checking account lockout:', error);
    next();
  }
};

export const recordFailedAttempt = async (req, res, next) => {
  const { email } = req.body;

  // Store original status code
  const originalStatusCode = res.statusCode;

  // Override json to intercept response
  const originalJson = res.json;
  res.json = function(data) {
    // If authentication failed
    if (res.statusCode === 401 || (data.success === false && data.message.includes('Invalid credentials'))) {
      User.findOne({ email }).then(user => {
        if (user) {
          user.loginAttempts = (user.loginAttempts || 0) + 1;

          if (user.loginAttempts >= MAX_ATTEMPTS) {
            user.lockUntil = Date.now() + LOCKOUT_DURATION;
            user.loginAttempts = 0;

            console.warn(`Account locked for ${email} due to ${MAX_ATTEMPTS} failed attempts`);

            user.save().catch(err => console.error('Error locking account:', err));
          } else {
            user.save().catch(err => console.error('Error recording failed attempt:', err));
          }
        }
      }).catch(err => console.error('Error in recordFailedAttempt:', err));
    }

    return originalJson.call(this, data);
  };

  next();
};

export const resetFailedAttempts = async (req, res, next) => {
  const { email } = req.body;

  // Reset on successful login
  const originalJson = res.json;
  res.json = function(data) {
    if (data.success === true && data.token) {
      User.findOne({ email }).then(user => {
        if (user) {
          user.loginAttempts = 0;
          user.lockUntil = undefined;
          user.lastLogin = Date.now();
          user.lastLoginIP = req.ip;

          user.save().catch(err => console.error('Error resetting attempts:', err));
        }
      }).catch(err => console.error('Error in resetFailedAttempts:', err));
    }

    return originalJson.call(this, data);
  };

  next();
};
```

2. **Update User model (add lockout fields):**

```javascript
// Add to userSchema
loginAttempts: {
  type: Number,
  default: 0
},
lockUntil: {
  type: Date
},
lastLogin: {
  type: Date
},
lastLoginIP: {
  type: String
}
```

3. **Update auth routes:**

```javascript
// /backend/src/routes/auth.routes.js
import { checkAccountLockout, recordFailedAttempt, resetFailedAttempts } from '../middleware/accountLockout.js';

// UPDATE login route
router.post('/login',
  checkAccountLockout,
  recordFailedAttempt,
  resetFailedAttempts,
  login
);
```

---

#### Task 1.4: Enhance JWT Security

**Problem:** JWT tokens have long expiration and weak secrets

**Files to Create/Modify:**
- Create: `/backend/src/middleware/tokenBlacklist.js`
- Update: `/backend/src/controllers/authController.js`
- Update: `/backend/src/middleware/auth.js`

**Implementation:**

1. **Create token blacklist model:**

```javascript
// /backend/src/models/TokenBlacklist.js
import mongoose from 'mongoose';

const tokenBlacklistSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

tokenBlacklist.index({ token: 1 });

export default mongoose.model('TokenBlacklist', tokenBlacklistSchema);
```

2. **Update auth controller with token management:**

```javascript
// /backend/src/controllers/authController.js
import TokenBlacklist from '../models/TokenBlacklist.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '15m', // CHANGED from 7d to 15m
  });
};

const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d',
  });
};

// UPDATE login endpoint
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated',
      });
    }

    // Generate tokens
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.status(200).json({
      success: true,
      token,
      refreshToken,
      expiresIn: 15 * 60 * 1000, // 15 minutes in milliseconds
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// NEW logout endpoint
export const logout = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (token) {
      // Decode token to get expiration
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Add to blacklist
      await TokenBlacklist.create({
        token,
        userId: decoded.id,
        expiresAt: new Date(decoded.exp * 1000)
      });
    }

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// NEW refresh token endpoint
export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Get user
    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Generate new access token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      expiresIn: 15 * 60 * 1000
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid refresh token'
    });
  }
};
```

3. **Update auth middleware to check blacklist:**

```javascript
// /backend/src/middleware/auth.js
import TokenBlacklist from '../models/TokenBlacklist.js';

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

    // Check if token is blacklisted
    const blacklisted = await TokenBlacklist.findOne({ token });
    if (blacklisted) {
      return res.status(401).json({
        success: false,
        message: 'Token has been revoked',
        code: 'TOKEN_REVOKED'
      });
    }

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
    if (req.user.passwordChangedAt && decoded.iat < req.user.passwordChangedAt.getTime() / 1000) {
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
```

4. **Update auth routes:**

```javascript
// /backend/src/routes/auth.routes.js
import { register, login, getMe, changePassword, logout, refreshToken } from '../controllers/authController.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshToken);

// Protected routes
router.get('/me', protect, getMe);
router.put('/password', protect, changePassword);
router.post('/logout', protect, logout);

export default router;
```

---

### 1.2 High-Priority Security Enhancements (WEEK 1)

#### Task 1.5: Implement Enhanced Security Headers

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
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: [],
    },
  },

  // HSTS
  hsts: {
    maxAge: 63072000, // 2 years
    includeSubDomains: true,
    preload: true
  },

  // Other headers
  frameguard: { action: 'sameorigin' },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
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

  if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
    console.log('[SECURITY AUDIT]', JSON.stringify(logData));
  }

  next();
};
```

**Update: `/backend/src/server.js`**

```javascript
import { securityHeaders, requestId, validateContentType, securityAuditLog } from './middleware/security.js';

// ADD to middleware setup (after helmet import)
app.use(securityHeaders);
app.use(requestId);
app.use(validateContentType);
app.use(securityAuditLog);
```

---

#### Task 1.6: Implement Intrusion Detection

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

// NoSQL injection patterns
const noSQLPatterns = [
  /\$where/i,
  /\$ne/i,
  /\$in/i,
  /\$or/i,
  /\{/,
  /\}/
];

export const detectIntrusion = (req, res, next) => {
  let suspicious = false;
  let reasons = [];

  // Check URL
  const url = req.url;

  if (sqlInjectionPatterns.some(p => p.test(url))) {
    suspicious = true;
    reasons.push('SQL injection in URL');
  }

  if (xssPatterns.some(p => p.test(url))) {
    suspicious = true;
    reasons.push('XSS in URL');
  }

  if (pathTraversalPatterns.some(p => p.test(url))) {
    suspicious = true;
    reasons.push('Path traversal in URL');
  }

  // Check headers
  const userAgent = req.get('user-agent') || '';
  const knownScanners = ['sqlmap', 'nmap', 'nikto', 'burp', 'owasp', 'zap'];
  if (knownScanners.some(scanner => userAgent.toLowerCase().includes(scanner))) {
    suspicious = true;
    reasons.push(`Known security scanner detected: ${userAgent}`);
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

    if (noSQLPatterns.some(p => p.test(bodyStr))) {
      suspicious = true;
      reasons.push('NoSQL injection in body');
    }
  }

  // Check query parameters
  if (req.query) {
    const queryStr = JSON.stringify(req.query);

    if (sqlInjectionPatterns.some(p => p.test(queryStr))) {
      suspicious = true;
      reasons.push('SQL injection in query');
    }

    if (noSQLPatterns.some(p => p.test(queryStr))) {
      suspicious = true;
      reasons.push('NoSQL injection in query');
    }
  }

  // Log and block suspicious requests
  if (suspicious) {
    const logData = {
      timestamp: new Date().toISOString(),
      ip: req.ip,
      method: req.method,
      url: req.url,
      userAgent: userAgent,
      reasons: reasons.join(', '),
      body: req.body ? JSON.stringify(req.body) : 'none'
    };

    console.error('[INTRUSION DETECTED]', JSON.stringify(logData));

    return res.status(403).json({
      success: false,
      message: 'Request blocked by security system',
      code: 'INTRUSION_DETECTED'
    });
  }

  next();
};
```

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

  // Ensure log directory exists
  const logDir = path.dirname(SECURITY_LOG_PATH);
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  // Append to security log
  fs.appendFileSync(SECURITY_LOG_PATH, logLine, 'utf8');

  // Also log to console
  console.log('[SECURITY]', logLine);
};

export const logAuthFailure = (req, reason) => {
  logSecurityEvent({
    event_type: 'AUTH_FAILURE',
    ip: req.ip,
    user_agent: req.get('user-agent'),
    path: req.path,
    method: req.method,
    reason
  });
};

export const logSuspiciousActivity = (req, activity) => {
  logSecurityEvent({
    event_type: 'SUSPICIOUS_ACTIVITY',
    ip: req.ip,
    user_agent: req.get('user-agent'),
    path: req.path,
    method: req.method,
    activity
  });
};

export const logRateLimitExceeded = (req, limitType) => {
  logSecurityEvent({
    event_type: 'RATE_LIMIT_EXCEEDED',
    ip: req.ip,
    path: req.path,
    limit_type: limitType
  });
};
```

**Update: `/backend/src/server.js`**

```javascript
import { detectIntrusion } from './middleware/intrusionDetection.js';

// ADD to middleware (before routes)
app.use(detectIntrusion);
```

---

#### Task 1.7: Enhanced Rate Limiting

**Update: `/backend/src/middleware/rateLimiter.js`**

First, install Redis for distributed rate limiting:

```bash
npm install ioredis
```

Then update the rate limiter:

```javascript
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';
import { logRateLimitExceeded } from '../utils/securityLogger.js';

// Initialize Redis for distributed rate limiting
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
});

const redisOptions = {
  client: redis,
  prefix: 'ementech_rate_limit:',
};

// Create rate limiter factory
const createRateLimiter = (options) => {
  const limiter = rateLimit({
    store: process.env.NODE_ENV === 'production' ? new RedisStore(redisOptions) : undefined,
    windowMs: options.windowMs,
    max: options.max,
    message: options.message || {
      success: false,
      message: 'Too many requests, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: options.skipSuccessfulRequests || false,
    handler: (req, res) => {
      logRateLimitExceeded(req, options.name || 'unknown');

      res.status(429).json({
        success: false,
        message: options.message || 'Too many requests',
        retryAfter: Math.round(options.windowMs / 1000),
      });
    }
  });

  return limiter;
};

// Rate limiters
export const apiLimiter = createRateLimiter({
  name: 'api',
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100
});

export const authLimiter = createRateLimiter({
  name: 'auth',
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: false
});

export const formSubmitLimiter = createRateLimiter({
  name: 'form_submit',
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3
});

export const chatLimiter = createRateLimiter({
  name: 'chat',
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 15
});

export const leadCreationLimiter = createRateLimiter({
  name: 'lead_creation',
  windowMs: 60 * 60 * 1000,
  max: 10
});

export const downloadLimiter = createRateLimiter({
  name: 'download',
  windowMs: 60 * 60 * 1000,
  max: 20
});

export const searchLimiter = createRateLimiter({
  name: 'search',
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20
});
```

---

## 2. FRONTEND SECURITY IMPLEMENTATION

### 2.1 Security Dependencies

**Install required packages:**

```bash
cd /media/munen/muneneENT/ementech/ementech-website
npm install dompurify
npm install --save-dev @types/dompurify
```

### 2.2 Create Security Utilities

**Create: `/src/utils/security.tsx`**

```typescript
import DOMPurify from 'dompurify';

// Sanitize HTML content
export const sanitizeHTML = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'title'],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
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

// Secure component for rendering HTML
export const SafeHTML = ({ html, className = '' }: { html: string; className?: string }) => {
  const sanitized = sanitizeHTML(html);
  return <div className={className} dangerouslySetInnerHTML={{ __html: sanitized }} />;
};

// Secure localStorage wrapper with basic encryption
const ENCRYPTION_KEY = process.env.VITE_STORAGE_KEY || 'ementech-secure-storage';

const simpleEncrypt = (text: string): string => {
  try {
    // Simple XOR encryption for demo - use proper encryption in production
    let result = '';
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(text.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length));
    }
    return btoa(result);
  } catch {
    return text;
  }
};

const simpleDecrypt = (encoded: string): string => {
  try {
    const text = atob(encoded);
    let result = '';
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(text.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length));
    }
    return result;
  } catch {
    return encoded;
  }
};

export const secureStorage = {
  setItem: (key: string, value: any): void => {
    try {
      const serialized = JSON.stringify(value);
      const encrypted = simpleEncrypt(serialized);
      localStorage.setItem(key, encrypted);
    } catch (error) {
      console.error('Error saving to secure storage:', error);
    }
  },

  getItem: <T>(key: string): T | null => {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;

      const decrypted = simpleDecrypt(item);
      return JSON.parse(decrypted) as T;
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

// Generate nonce for CSP
export const generateNonce = (): string => {
  return crypto.getRandomValues(new Uint32Array(1))[0].toString(36);
};

// XSS Protection for user input
export const sanitizeUserInput = (input: string): string => {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};
```

### 2.3 Update Axios Configuration

**Update: `/src/services/authService.ts`**

```typescript
import axios, { AxiosError } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

// Create axios instance with security defaults
const api = axios.create({
  baseURL: `${API_URL}/auth`,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
  timeout: 15000, // 15 second timeout
  withCredentials: false, // We'll use Authorization header
});

// Request interceptor - Add security headers
api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add request timestamp for replay attack prevention
    config.headers['X-Request-Timestamp'] = Date.now().toString();

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    // Handle token expiration
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Try to refresh token
      try {
        const refreshToken = secureStorage.getItem<string>('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken,
          });

          const { accessToken } = response.data;
          secureStorage.setItem('token', accessToken);

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

    // Handle other errors
    if (error.response?.status === 403) {
      console.warn('[Security] Access denied:', error.config?.url);
    }

    if (error.response?.status === 429) {
      console.warn('[Security] Rate limit exceeded:', error.config?.url);
    }

    return Promise.reject(error);
  }
);

// Secure token storage
const getAuthToken = (): string | null => {
  return secureStorage.getItem<string>('token');
};

// Login
export const login = async (email: string, password: string) => {
  try {
    const response = await api.post('/login', { email, password });

    if (response.data.success) {
      // Store tokens securely
      secureStorage.setItem('token', response.data.token);
      if (response.data.refreshToken) {
        secureStorage.setItem('refreshToken', response.data.refreshToken);
      }
      secureStorage.setItem('user', response.data.user);
    }

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
    throw error;
  }
};

// Register
export const register = async (userData: any) => {
  try {
    const response = await api.post('/register', userData);

    if (response.data.success) {
      secureStorage.setItem('token', response.data.token);
      if (response.data.refreshToken) {
        secureStorage.setItem('refreshToken', response.data.refreshToken);
      }
      secureStorage.setItem('user', response.data.user);
    }

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
    throw error;
  }
};

// Logout
export const logout = async () => {
  try {
    const token = getAuthToken();
    if (token) {
      await api.post('/logout');
    }
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    secureStorage.removeItem('token');
    secureStorage.removeItem('refreshToken');
    secureStorage.removeItem('user');
  }
};

// Get current user
export const getMe = async () => {
  try {
    const response = await api.get('/me');
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || 'Failed to fetch user');
    }
    throw error;
  }
};

// Change password
export const changePassword = async (passwordData: any) => {
  try {
    const response = await api.put('/password', passwordData);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || 'Failed to change password');
    }
    throw error;
  }
};

// Check authentication
export const isAuthenticated = (): boolean => {
  return !!getAuthToken();
};

// Get stored user
export const getStoredUser = () => {
  return secureStorage.getItem('user');
};
```

### 2.4 Add Content Security Policy

**Create: `/src/security/csp.ts`**

```typescript
// Content Security Policy configuration
export const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ["'self'", "data:", "https:"],
  'font-src': ["'self'", "data:"],
  'connect-src': [
    "'self'",
    import.meta.env.VITE_API_URL || 'https://ementech.co.ke',
    "wss://ementech.co.ke"
  ],
  'frame-src': ["'none'"],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'frame-ancestors': ["'none'"],
  'upgrade-insecure-requests': [],
};

// Generate CSP meta tag content
export const generateCSPContent = (): string => {
  return Object.entries(CSP_DIRECTIVES)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; ');
};

// Add CSP to document head (call in main.tsx)
export const addCSPMetaTag = () => {
  const meta = document.createElement('meta');
  meta.httpEquiv = 'Content-Security-Policy';
  meta.content = generateCSPContent();
  document.head.appendChild(meta);
};
```

**Update: `/src/main.tsx`**

```typescript
import { addCSPMetaTag } from './security/csp';

// Add CSP meta tag
addCSPMetaTag();

// Rest of your main.tsx code...
```

---

## 3. DATABASE SECURITY IMPLEMENTATION

### 3.1 MongoDB Atlas Security Configuration

**Steps to implement:**

1. **Log into MongoDB Atlas Console**
   - Go to https://cloud.mongodb.com
   - Navigate to your cluster

2. **Configure Network Access**
   - Go to: Security → Network Access
   - Click "Add IP Address"
   - Add VPS IP: `69.164.244.165`
   - Remove any 0.0.0.0/0 entries (whitelist all)

3. **Configure Database Users**
   - Go to: Security → Database Access
   - Create separate users for each service

   ```javascript
   // Application user (Read/Write)
   Username: ementech_app_prod
   Password: [Generate strong password]
   Database: ementech_production
   Roles: readWrite

   // Backup user (Read only)
   Username: ementech_backup
   Password: [Generate strong password]
   Database: ementech_production
   Roles: read
   ```

4. **Enable Encryption at Rest**
   - Go to: Your cluster → Encryption at Rest
   - Verify encryption is enabled (should be default)

5. **Enable Auditing**
   - Go to: Security → Auditing
   - Enable audit logging
   - Set retention period

6. **Update Connection String**

```env
# In backend/.env
MONGODB_URI=mongodb+srv://ementech_app_prod:PASSWORD@cluster.mongodb.net/ementech_production?retryWrites=true&w=majority&ssl=true&authSource=admin
```

### 3.2 Update Database Configuration

**Update: `/backend/src/config/database.js`**

```javascript
import mongoose from 'mongoose';

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
  connectTimeoutMS: 10000,

  // Retry logic
  serverSelectionTimeoutMS: 5000,
  retryWrites: true,
  retryReads: true,

  // Security: Disable auto-indexing in production
  autoIndex: process.env.NODE_ENV !== 'production',
};

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, securityOptions);

    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Security: Disable mongoose auto-indexing in production
    if (process.env.NODE_ENV === 'production') {
      mongoose.set('autoIndex', false);
      console.log('Auto-indexing disabled in production');
    }

    // Enable query logging in development
    if (process.env.NODE_ENV === 'development') {
      mongoose.set('debug', true);
    }

    // Security: Protect against prototype pollution
    mongoose.set('sanitizeProjection', true);

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
    });

    return conn;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed through app termination');
  process.exit(0);
});
```

---

## 4. INFRASTRUCTURE SECURITY IMPLEMENTATION

### 4.1 Configure UFW Firewall

**Execute on VPS:**

```bash
# SSH into VPS
ssh root@69.164.244.165

# Install UFW if not installed
sudo apt update
sudo apt install ufw -y

# Set default policies
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH (replace YOUR_ADMIN_IP with actual IP)
# Get your admin IP from: curl ifconfig.me
sudo ufw allow from YOUR_ADMIN_IP to any port 22

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow backend API (localhost only - no external access)
sudo ufw allow from 127.0.0.1 to any port 5001

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status verbose
```

### 4.2 Harden SSH Configuration

**Execute on VPS:**

```bash
# Backup original config
sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup

# Edit SSH config
sudo nano /etc/ssh/sshd_config

# Make these changes:
```

**Updated `/etc/ssh/sshd_config`:**

```bash
# Disable root login
PermitRootLogin no

# Disable password authentication (key-based only)
PasswordAuthentication no
PubkeyAuthentication yes

# Change default port (optional but recommended)
Port 2222

# Limit login attempts
MaxAuthTries 3
LoginGraceTime 30

# Disable X11 forwarding
X11Forwarding no

# Allow only specific users
# AllowUsers admin

# Disable empty passwords
PermitEmptyPasswords no

# Logging
SyslogFacility AUTH
LogLevel VERBOSE
```

```bash
# Restart SSH service
sudo systemctl restart sshd

# Test connection in new terminal before closing current one
ssh -p 2222 root@69.164.244.165
```

### 4.3 Install and Configure Fail2Ban

**Execute on VPS:**

```bash
# Install Fail2Ban
sudo apt install fail2ban -y

# Create local configuration
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local

# Edit configuration
sudo nano /etc/fail2ban/jail.local
```

**Updated `/etc/fail2ban/jail.local`:**

```bash
[DEFAULT]
# Ban time (seconds)
bantime = 3600

# Find time (seconds)
findtime = 600

# Max retries
maxretry = 5

[sshd]
enabled = true
port = 2222
logpath = /var/log/auth.log
maxretry = 3

[nginx-http-auth]
enabled = true
logpath = /var/log/nginx/error.log

[nginx-limit-req]
enabled = true
logpath = /var/log/nginx/error.log
maxretry = 10
```

```bash
# Restart Fail2Ban
sudo systemctl restart fail2ban

# Enable on boot
sudo systemctl enable fail2ban

# Check status
sudo fail2ban-client status
```

### 4.4 Update Nginx Security Configuration

**Update: `/etc/nginx/sites-available/ementech-website.conf`**

Add enhanced security headers:

```nginx
# HTTP to HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name ementech.co.ke www.ementech.co.ke;

    # Redirect all HTTP requests to HTTPS
    return 301 https://$server_name$request_uri;
}

# HTTPS server block
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ementech.co.ke www.ementech.co.ke;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/ementech.co.ke/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ementech.co.ke/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/ementech.co.ke/chain.pem;
    ssl_dhparam /etc/nginx/ssl/dhparam.pem;

    # SSL Security Settings (Enhanced)
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;

    # OCSP Stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    resolver 8.8.8.8 8.8.4.4 valid=300s;
    resolver_timeout 5s;

    # Security Headers (Enhanced)
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https: wss:; frame-ancestors 'self'; form-action 'self';" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;

    # Remove server version
    server_tokens off;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=general_limit:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=20r/s;
    limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=5r/s;
    limit_conn_zone $binary_remote_addr zone=conn_limit:10m;

    # Logging
    access_log /var/log/nginx/ementech-website-access.log main;
    error_log /var/log/nginx/ementech-website-error.log warn;

    # Root directory
    root /var/www/ementech-website/current/dist;
    index index.html;

    # Client body size limit
    client_max_body_size 10M;
    client_body_buffer_size 1k;
    client_header_buffer_size 1k;

    # Main location
    location / {
        limit_req zone=general_limit burst=20 nodelay;
        limit_conn conn_limit 10;

        try_files $uri $uri/ /index.html;
    }

    # API proxy with security
    location /api/ {
        limit_req zone=api_limit burst=10 nodelay;
        limit_conn conn_limit 20;

        # Proxy settings
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;

        # Headers
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # Buffering
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;

        # Security headers
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header X-Content-Type-Options "nosniff" always;

        # CORS
        add_header Access-Control-Allow-Origin "https://ementech.co.ke" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization" always;
        add_header Access-Control-Allow-Credentials "true" always;

        # Handle preflight
        if ($request_method = OPTIONS) {
            return 204;
        }
    }

    # Static assets caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
        add_header X-Content-Type-Options "nosniff" always;
    }

    # Security: Block sensitive files
    location ~* /(\.env|\.git|\.gitignore|\.htaccess|\.htpasswd)$ {
        deny all;
        access_log off;
        log_not_found off;
        return 404;
    }

    # Security: Block hidden files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }

    # Health check
    location /health {
        access_log off;
        return 200 "OK";
        add_header Content-Type text/plain;
    }
}
```

```bash
# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## 5. MONITORING & LOGGING IMPLEMENTATION

### 5.1 Create Security Log Directory

**Execute on VPS:**

```bash
# Create log directory
sudo mkdir -p /var/log/ementech

# Set permissions
sudo chown -R $USER:$USER /var/log/ementech
sudo chmod 750 /var/log/ementech

# Create log files
touch /var/log/ementech/security.log
touch /var/log/ementech/audit.log
```

### 5.2 Set Up Log Rotation

**Create: `/etc/logrotate.d/ementech`**

```bash
/var/log/ementech/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 $USER $USER
    sharedscripts
    postrotate
        systemctl restart ementech-backend > /dev/null 2>&1 || true
    endscript
}
```

### 5.3 Install Monitoring Tools (Optional but Recommended)

**Install Node.js monitoring:**

```bash
# Install PM2 for process management
npm install -g pm2

# Start backend with PM2
cd /media/munen/muneneENT/ementech/ementech-website/backend
pm2 start src/server.js --name ementech-backend

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup
```

---

## 6. TESTING & VALIDATION

### 6.1 Security Testing Checklist

Run these tests after implementation:

```bash
# 1. Test authentication
curl -X POST https://ementech.co.ke/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"wrongpass"}' \
  -v

# Should return 401

# 2. Test rate limiting
for i in {1..10}; do
  curl https://ementech.co.ke/api/health
done

# Should get 429 after limit

# 3. Test security headers
curl -I https://ementech.co.ke

# Check for:
# - Strict-Transport-Security
# - X-Frame-Options
# - X-Content-Type-Options
# - Content-Security-Policy

# 4. Test HTTPS enforcement
curl -I http://ementech.co.ke

# Should return 301 redirect to HTTPS

# 5. Test SQL injection protection
curl -X POST https://ementech.co.ke/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin'\'' OR '\''1'\''='\''1","password":"test"}' \
  -v

# Should return 400 or 403

# 6. Test XSS protection
curl -X POST https://ementech.co.ke/api/leads \
  -H "Content-Type: application/json" \
  -d '{"email":"test<script>alert(1)</script>@example.com","source":"newsletter"}' \
  -v

# Should return 400 validation error

# 7. Test file access blocking
curl https://ementech.co.ke/.env

# Should return 404
```

### 6.2 Automated Security Scanning

```bash
# Run npm audit
npm audit

# Run dependency check
npm install -g snyk
snyk test

# Run OWASP ZAP (install separately)
# zap-cli quick-scan --self-contained https://ementech.co.ke
```

---

## IMPLEMENTATION CHECKLIST

Use this checklist to track progress:

### Phase 1: Critical Security Fixes (24 Hours)
- [ ] Remove .env from repository
- [ ] Generate new strong secrets
- [ ] Implement strong password policy (12+ chars)
- [ ] Implement account lockout mechanism
- [ ] Enhance JWT security (shorter expiration, refresh tokens)
- [ ] Implement token blacklist
- [ ] Add logout endpoint

### Phase 2: High-Priority Enhancements (Week 1)
- [ ] Implement enhanced security headers
- [ ] Add intrusion detection system
- [ ] Enhance rate limiting with Redis
- [ ] Add input validation and sanitization
- [ ] Implement XSS protection
- [ ] Add NoSQL injection prevention
- [ ] Configure UFW firewall
- [ ] Harden SSH configuration
- [ ] Install Fail2Ban

### Phase 3: Database & Infrastructure (Week 2)
- [ ] Configure MongoDB Atlas security
- [ ] Enable database encryption
- [ ] Create separate database users
- [ ] Update Nginx security headers
- [ ] Implement Content Security Policy
- [ ] Set up security logging
- [ ] Configure log rotation

### Phase 4: Monitoring & Testing (Week 3)
- [ ] Implement security monitoring
- [ ] Set up automated security testing
- [ ] Create security dashboards
- [ ] Document incident response procedures
- [ ] Conduct security audit
- [ ] Test all security features

---

## SUPPORT & MAINTENANCE

### Daily Tasks
- Review security logs
- Check for failed authentication attempts
- Monitor rate limiting triggers

### Weekly Tasks
- Review and update firewall rules if needed
- Check for security updates
- Backup security logs

### Monthly Tasks
- Rotate secrets (JWT, API keys)
- Review and update security policies
- Conduct vulnerability scanning
- Update dependencies

### Quarterly Tasks
- Full security audit
- Penetration testing
- Security training for team
- Document and implement lessons learned

---

**This implementation guide provides detailed technical specifications for implementing enterprise-grade security for the EmenTech website. Follow each section carefully and test thoroughly before moving to production.**

---

**Document Version:** 1.0.0
**Last Updated:** 2026-01-20
**Next Review:** 2026-02-20
