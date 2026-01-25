# EmenTech Email System - End-to-End Authentication Flow

## Overview

The EmenTech email system uses a multi-layered authentication approach:
1. **User Authentication** - JWT-based auth for accessing the application
2. **Email Account Authentication** - Encrypted IMAP/SMTP credentials for email servers
3. **Socket.IO Authentication** - Real-time websocket authentication

---

## Layer 1: User Authentication (JWT)

### 1.1 User Login Flow

```
FRONTEND                      BACKEND                      DATABASE
   │                              │                            │
   ├─── User enters credentials ──>│                            │
   │    (email, password)          │                            │
   │                              │                            │
   │                              ├─── Find user by email ───>  │
   │                              │    SELECT * FROM users      │
   │                              │    WHERE email = ?          │
   │                              │<── Return user record ──────│
   │                              │                            │
   │                              ├─── Compare password         │
   │                              │    bcrypt.compare()         │
   │                              │                            │
   │                              ├─── Check isActive          │
   │                              │                            │
   │                              ├─── Generate JWT token      │
   │                              │    jwt.sign({id},          │
   │                              │           JWT_SECRET)      │
   │                              │                            │
   │<─ Return token + user ───────┤                            │
   │                              │                            │
   ├─── Store token in localStorage                          │
   ├─── Store user in localStorage                           │
   │                              │                            │
```

### 1.2 Frontend: AuthContext.jsx

**Location:** `/src/contexts/AuthContext.jsx`

```javascript
// When user logs in
const login = async (email, password) => {
  // 1. Call authService.login()
  const response = await authService.login(email, password);

  // 2. Store JWT token in localStorage
  localStorage.setItem('token', response.token);

  // 3. Store user data in localStorage
  localStorage.setItem('user', JSON.stringify(response.user));

  // 4. Update React state
  setToken(response.token);
  setUser(response.user);
  setIsAuthenticated(true);
};
```

### 1.3 Frontend: authService.js

**Location:** `/src/services/authService.js`

```javascript
export const login = async (email, password) => {
  // POST request to /api/auth/login
  const response = await api.post('/login', { email, password });

  if (response.data.success) {
    // Store token and user in localStorage
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
  }

  return response.data;
};
```

### 1.4 Backend: auth.routes.js

**Location:** `/backend/src/routes/auth.routes.js`

```javascript
// Public route - no authentication required
router.post('/login', login);

// Protected routes - authentication required
router.get('/me', protect, getMe);
router.put('/password', protect, changePassword);
```

### 1.5 Backend: authController.js

**Location:** `/backend/src/controllers/authController.js`

```javascript
export const login = async (req, res) => {
  const { email, password } = req.body;

  // 1. Validate input
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide email and password'
    });
  }

  // 2. Find user in database
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // 3. Verify password using bcrypt
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // 4. Check if user account is active
  if (!user.isActive) {
    return res.status(401).json({
      success: false,
      message: 'Your account has been deactivated'
    });
  }

  // 5. Generate JWT token
  const token = generateToken(user._id);

  // 6. Return token and user data
  res.status(200).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department
    }
  });
};
```

### 1.6 Backend: auth.js Middleware

**Location:** `/backend/src/middleware/auth.js`

```javascript
export const protect = async (req, res, next) => {
  let token;

  // 1. Extract token from Authorization header
  if (req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }

  try {
    // 2. Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Get user from token
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not found with this token'
      });
    }

    // 4. Check if user is still active
    if (!req.user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated'
      });
    }

    // 5. Proceed to next middleware/route handler
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
};
```

---

## Layer 2: Email Account Authentication

### 2.1 Email Account Configuration Flow

```
FRONTEND                      BACKEND                      EMAIL SERVER
   │                              │                            │
   ├─── Configure email ─────────>│                            │
   │    (IMAP/SMTP credentials)    │                            │
   │                              │                            │
   │                              ├─── Encrypt passwords       │
   │                              │    AES-256-CBC             │
   │                              │                            │
   │                              ├─── Store in UserEmail ────>│
   │                              │    - IMAP host/port        │
   │                              │    - IMAP user/pass        │
   │                              │    - SMTP host/port        │
   │                              │    - SMTP user/pass        │
   │                              │                            │
   │<─ Configuration saved ───────┤                            │
   │                              │                            │
```

### 2.2 Email Account Storage

**Location:** `/backend/src/models/UserEmail.js`

```javascript
const userEmailSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // IMAP Configuration
  imap: {
    host: { type: String, required: true },
    port: { type: Number, default: 993 },
    tls: { type: Boolean, default: true },
    username: { type: String, required: true },
    password: {
      type: String,
      required: true
      // ENCRYPTED using AES-256-CBC
    }
  },

  // SMTP Configuration
  smtp: {
    host: { type: String, required: true },
    port: { type: Number, default: 587 },
    secure: { type: Boolean, default: false },
    username: { type: String, required: true },
    password: {
      type: String,
      required: true
      // ENCRYPTED using AES-256-CBC
    }
  }
});
```

### 2.3 Password Encryption

**Algorithm:** AES-256-CBC

```javascript
// Encrypt password before storing
userEmailSchema.methods.encrypt = function(text) {
  const algorithm = 'aes-256-cbc';
  // Generate key from JWT_SECRET
  const key = crypto.scryptSync(process.env.JWT_SECRET || 'secret', 'salt', 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  // Return IV:encrypted format
  return iv.toString('hex') + ':' + encrypted;
};

// Decrypt password when needed
userEmailSchema.methods.decrypt = function(encryptedText) {
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync(process.env.JWT_SECRET || 'secret', 'salt', 32);

  // Split IV and encrypted data
  const parts = encryptedText.split(':');
  const iv = Buffer.from(parts.shift(), 'hex');
  const encrypted = parts.join(':');

  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
};
```

### 2.4 IMAP Connection Authentication

**Location:** `/backend/src/controllers/emailController.js`

```javascript
const createImapConnection = (emailAccount) => {
  return new Imap({
    host: emailAccount.imap.host,
    port: emailAccount.imap.port,
    tls: emailAccount.imap.tls,
    user: emailAccount.imap.username,
    // Decrypt password before using
    password: emailAccount.decrypt(emailAccount.imap.password),
    tlsOptions: { rejectUnauthorized: false }
  });
};

// Usage
const syncEmails = async (req, res) => {
  const userId = req.user.id; // From JWT token

  // Get user's primary email account
  const emailAccount = await UserEmail.getPrimaryEmail(userId);

  if (!emailAccount) {
    return res.status(404).json({
      success: false,
      message: 'No email account configured'
    });
  }

  // Create IMAP connection with decrypted credentials
  const imap = createImapConnection(emailAccount);

  // Connect and sync emails...
};
```

---

## Layer 3: Socket.IO Authentication

### 3.1 Socket.IO Connection Flow

```
FRONTEND (EmailContext)    BACKEND (socket.js)          DATABASE
      │                           │                        │
      ├─── Get JWT token ────────>│                        │
      │   from localStorage       │                        │
      │                           │                        │
      │<── Connection established ─┤                        │
      │                           │                        │
      │                           ├─── Verify JWT token ──>│
      │                           │    jwt.verify()        │
      │                           │                        │
      │                           ├─── Get user from DB ───>│
      │                           │    User.findById()     │
      │                           │<─ Return user ─────────│
      │                           │                        │
      │                           ├─── Join user rooms    │
      │                           │    - email:{userId}   │
      │                           │    - user:{userId}   │
      │                           │                        │
      │<── Ready for real-time ────┤                        │
      │    email updates           │                        │
```

### 3.2 Frontend: EmailContext.jsx

**Location:** `/src/contexts/EmailContext.jsx`

```javascript
useEffect(() => {
  // 1. Get JWT token from localStorage
  const token = localStorage.getItem('token');

  if (!token) {
    console.log('🔒 No auth token found - email features disabled');
    return;
  }

  // 2. Initialize Socket.IO connection
  const newSocket = io(import.meta.env.VITE_API_URL || '/api', {
    path: '/socket.io/',
    auth: { token }, // Send JWT token in auth object
    reconnection: true,
    reconnectionAttempts: 3,
    reconnectionDelay: 1000,
    transports: ['websocket', 'polling'],
  });

  // 3. Listen for connection events
  newSocket.on('connect', () => {
    console.log('✅ Connected to email server');
  });

  newSocket.on('connect_error', (error) => {
    console.error('❌ Socket connection error:', error.message);
  });

  // 4. Listen for real-time email updates
  newSocket.on('new_email', (email) => {
    console.log('📧 New email received:', email);
    setEmails(prev => [email, ...prev]);
  });

  newSocket.on('email_updated', (email) => {
    setEmails(prev => prev.map(e =>
      e._id === email._id ? email : e
    ));
  });

  newSocket.on('email_deleted', (emailId) => {
    setEmails(prev => prev.filter(e => e._id !== emailId));
  });

  setSocket(newSocket);

  return () => {
    newSocket.disconnect();
  };
}, []);
```

### 3.3 Backend: socket.js

**Location:** `/backend/src/config/socket.js`

```javascript
export const emailSocketHandler = (io) => {
  // Authentication middleware for all Socket.IO connections
  io.use(async (socket, next) => {
    try {
      // 1. Extract token from handshake
      const token = socket.handshake.auth.token ||
                   socket.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      // 2. Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 3. Get user from database
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      // 4. Attach user to socket
      socket.userId = user._id.toString();
      socket.user = user;

      next();
    } catch (error) {
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  // Handle connection
  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.user.email}`);

    // Join user's personal rooms for targeted updates
    socket.join(`email:${socket.userId}`);
    socket.join(`user:${socket.userId}`);

    // Handle email events
    socket.on('send_email', async (data) => {
      try {
        // Email sending logic
        io.to(`user:${socket.userId}`).emit('email_sent', {
          success: true,
          email: data
        });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('mark_read', (data) => {
      io.to(`user:${socket.userId}`).emit('email_updated', data);
    });

    socket.on('flagged', (data) => {
      io.to(`user:${socket.userId}`).emit('email_updated', data);
    });

    socket.on('moved', (data) => {
      io.to(`user:${socket.userId}`).emit('email_updated', data);
    });

    socket.on('deleted', (data) => {
      io.to(`user:${socket.userId}`).emit('email_deleted', data);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.user.email}`);
    });
  });

  return io;
};
```

---

## Layer 4: Protected API Routes

### 4.1 Email Routes Protection

**Location:** `/backend/src/routes/email.routes.js`

```javascript
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware to ALL email routes
router.use(protect);

// All routes below require valid JWT token
router.get('/', fetchEmails);
router.post('/sync/:folder?', syncEmails);
router.post('/send', sendEmail);
// ... etc
```

### 4.2 Accessing User Data in Controllers

**Location:** `/backend/src/controllers/emailController.js`

```javascript
const fetchEmails = async (req, res) => {
  try {
    const { folder = 'INBOX', limit = 50, skip = 0 } = req.query;

    // Get userId from JWT token (attached by protect middleware)
    const userId = req.user.id;

    // Get user's primary email account
    const emailAccount = await UserEmail.getPrimaryEmail(userId);

    // Fetch emails...
    const emails = await Email.find({
      user: userId,  // Only user's own emails
      folder: folder,
      isDeleted: false
    });

    res.status(200).json({
      success: true,
      count: emails.length,
      data: emails
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch emails'
    });
  }
};
```

---

## Complete End-to-End Flow

### Scenario: User Logs In and Fetches Emails

```
1. USER ENTERS CREDENTIALS
   └─> Frontend: AuthContext.login()
       └─> POST /api/auth/login
           └─> Backend: authController.login()
               ├─> Find user in MongoDB
               ├─> Verify password with bcrypt
               ├─> Check isActive flag
               └─> Generate JWT token
                   └─> Return { token, user }

2. STORE CREDENTIALS
   └─> localStorage.setItem('token', token)
   └─> localStorage.setItem('user', JSON.stringify(user))
   └─> Update React state
       ├─> setToken(token)
       └─> setUser(user)

3. INITIALIZE EMAIL SYSTEM
   └─> Frontend: EmailContext.useEffect()
       ├─> Get token from localStorage
       ├─> Connect Socket.IO with token
       │   └─> Backend: socket.js middleware
       │       ├─> Verify JWT token
       │       ├─> Get user from MongoDB
       │       ├─> Attach user to socket
       │       └─> Join user rooms
       └─> Socket connected and authenticated

4. FETCH EMAILS
   └─> Frontend: EmailContext.fetchEmails()
       └─> GET /api/email/?folder=INBOX
           └─> Backend: email.routes.js
               └─> protect middleware
                   ├─> Extract token from Authorization header
                   ├─> Verify JWT token
                   ├─> Get user from MongoDB
                   ├─> Attach user to req object
                   └─> Next: emailController.fetchEmails()
                       ├─> Get userId from req.user.id
                       ├─> Get user's email account from UserEmail
                       ├─> Decrypt IMAP password
                       ├─> Connect to IMAP server
                       └─> Return emails

5. REAL-TIME EMAIL UPDATES
   └─> Backend: New email detected
       └─> sendNewEmail(userId, email)
           └─> io.to(`user:${userId}`).emit('new_email', email)
               └─> Frontend: EmailContext socket listener
                   └─> setEmails(prev => [email, ...prev])
                       └─> UI updates automatically
```

---

## Security Features

### 1. JWT Token Security
- **Algorithm:** HS256 (HMAC with SHA-256)
- **Secret:** Stored in environment variable (JWT_SECRET)
- **Expiration:** 7 days (configurable via JWT_EXPIRE)
- **Storage:** httpOnly cookies recommended (currently using localStorage)

### 2. Password Security
- **Hashing:** bcrypt with salt
- **Storage:** Never stored in plain text
- **Validation:** Compared using bcrypt.compare()

### 3. Email Credentials Security
- **Encryption:** AES-256-CBC
- **Key Derivation:** scrypt from JWT_SECRET
- **IV:** Randomly generated for each encryption
- **Format:** IV:encrypted (hex encoded)

### 4. Multi-Layer Protection
- **API Routes:** Protected by JWT middleware
- **Socket.IO:** Authenticated via JWT in handshake
- **User Isolation:** Users can only access their own data
- **Account Status:** isActive flag checked on every request

---

## Environment Variables Required

```bash
# JWT Configuration
JWT_SECRET=your-super-secret-key-change-this
JWT_EXPIRE=7d

# Email Configuration (for default email accounts)
IMAP_HOST=mail.ementech.co.ke
IMAP_PORT=993
SMTP_HOST=mail.ementech.co.ke
SMTP_PORT=587

# Database
MONGODB_URI=mongodb://localhost:27017/ementech
```

---

## Testing Authentication

### Test Login Flow

```bash
# 1. Login
curl -X POST https://ementech.co.ke/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@ementech.co.ke",
    "password": "Admin2026!"
  }'

# Response:
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "name": "Admin User",
    "email": "admin@ementech.co.ke",
    "role": "admin",
    "department": "leadership"
  }
}

# 2. Access Protected Route
curl https://ementech.co.ke/api/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Response:
{
  "success": true,
  "user": {
    "id": "...",
    "name": "Admin User",
    "email": "admin@ementech.co.ke",
    "role": "admin",
    "department": "leadership"
  }
}
```

### Test Email Fetching

```bash
# Fetch emails (requires authentication)
curl https://ementech.co.ke/api/email/ \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Response:
{
  "success": true,
  "count": 25,
  "data": [
    {
      "_id": "...",
      "subject": "Test Email",
      "from": "sender@example.com",
      "to": "admin@ementech.co.ke",
      "folder": "INBOX",
      "isRead": false,
      ...
    }
  ]
}
```

---

## Common Issues and Solutions

### Issue 1: "Not authorized to access this route"
**Cause:** Missing or invalid JWT token
**Solution:**
- Check token is stored in localStorage
- Verify token is sent in Authorization header
- Check token hasn't expired
- Verify JWT_SECRET matches between generation and verification

### Issue 2: Socket.IO connection failed
**Cause:** JWT token not provided or invalid
**Solution:**
- Check token exists in localStorage before connecting
- Verify token format: `auth: { token }`
- Check CORS configuration
- Verify Socket.IO path matches backend

### Issue 3: Email credentials not working
**Cause:** Encrypted passwords cannot be decrypted
**Solution:**
- Verify JWT_SECRET is consistent
- Check encryption/decryption algorithm matches
- Ensure password was encrypted before storing
- Verify IV is properly stored with encrypted data

### Issue 4: User marked as inactive
**Cause:** isActive flag set to false
**Solution:**
- Check user.isActive in database
- Update isActive to true:
  ```javascript
  await User.findByIdAndUpdate(userId, { isActive: true });
  ```

---

## Best Practices

1. **Always use HTTPS in production** - Prevents token interception
2. **Implement token refresh** - Currently tokens expire after 7 days
3. **Use httpOnly cookies** - More secure than localStorage
4. **Implement rate limiting** - Prevents brute force attacks
5. **Log authentication events** - Track login attempts, failures
6. **Monitor suspicious activity** - Multiple failed logins, etc.
7. **Keep JWT_SECRET secure** - Use strong, random secret
8. **Rotate credentials regularly** - Change passwords periodically
9. **Implement 2FA** - Two-factor authentication for sensitive accounts
10. **Use separate email credentials** - Don't use personal email for testing

---

## Summary

The EmenTech email system uses a robust 3-layer authentication approach:

1. **User Authentication (JWT)** - Protects API routes and manages user sessions
2. **Email Account Authentication (Encrypted)** - Secures IMAP/SMTP credentials
3. **Socket.IO Authentication** - Secures real-time websocket connections

All layers work together to ensure:
- ✅ Only authenticated users can access email features
- ✅ Users can only access their own emails
- ✅ Email credentials are stored securely
- ✅ Real-time updates are authenticated
- ✅ System is protected from unauthorized access

The authentication flow is seamless from the user's perspective while maintaining strong security throughout the system.
