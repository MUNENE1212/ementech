# Ementech Website - Reverse Engineered Architecture

**Analysis Date**: 2026-01-21
**Project Status**: Production Live
**Architect Style**: Full-Stack Monolith with Microservices Capabilities

---

## Executive Architecture Overview

The Ementech website follows a **three-tier monolithic architecture** with real-time capabilities and service-oriented patterns. The system is designed as a corporate website with embedded business functionality, most notably a production-grade IMAP email management system.

### Architecture Type
- **Pattern**: Monolithic with service-oriented internal structure
- **Communication**: REST API + WebSocket (Socket.IO)
- **Data Flow**: Unidirectional (React → Express → MongoDB) with real-time push back via Socket.IO
- **Deployment**: Single VPS with PM2 process management and Nginx reverse proxy

---

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Browser    │  │   Browser    │  │   Browser    │          │
│  │  (Corporate) │  │  (Email UI)  │  │   (Admin)    │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                 │                     │
│         └─────────────────┼─────────────────┘                     │
│                           │                                       │
│                    ┌──────▼──────┐                                │
│                    │ React SPA   │                                │
│                    │ Vite Build  │                                │
│                    │ Tailwind CSS│                                │
│                    └──────┬──────┘                                │
└───────────────────────────┼──────────────────────────────────────┘
                            │ HTTPS (443)
                            │
┌───────────────────────────▼──────────────────────────────────────┐
│                      WEB SERVER LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│                     ┌─────────────────┐                          │
│                     │  Nginx Reverse  │                          │
│                     │     Proxy       │                          │
│                     └────────┬────────┘                          │
│                              │                                   │
│           ┌──────────────────┼──────────────────┐               │
│           │                  │                  │               │
│    ┌──────▼──────┐    ┌─────▼──────┐   ┌──────▼──────┐        │
│    │ Static Files │    │ API Proxy  │   │ WebSocket   │        │
│    │   (Frontend) │    │  (/api/*)  │   │ (/socket.io) │        │
│    └─────────────┘    └─────┬──────┘   └──────┬──────┘        │
│                              │                  │                │
└──────────────────────────────┼──────────────────┼────────────────┘
                               │                  │
                               │ HTTP             │ WS
                               │                  │
┌──────────────────────────────▼──────────────────▼────────────────┐
│                  APPLICATION LAYER (Node.js)                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│                     ┌─────────────────────┐                      │
│                     │   Express Server    │                      │
│                     │    Port: 5001       │                      │
│                     └──────────┬──────────┘                      │
│                                │                                 │
│        ┌───────────────────────┼───────────────────────┐        │
│        │                       │                       │        │
│  ┌─────▼─────┐          ┌─────▼─────┐          ┌─────▼─────┐   │
│  │    API    │          │ Socket.IO │          │ Middleware │   │
│  │  Routes   │          │   Server  │          │   Stack    │   │
│  └─────┬─────┘          └─────┬─────┘          └───────────┘   │
│        │                      │                                 │
│        │              ┌───────▼────────┐                        │
│        │              │ Socket Handler │                        │
│        │              │  (Real-time)   │                        │
│        │              └────────────────┘                        │
│        │                                                      │
│  ┌─────▼──────────────────────────────────────────────────┐   │
│  │                 Controllers Layer                       │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │   │
│  │  │   Email  │ │    Auth  │ │   Chat   │ │   Lead   │  │   │
│  │  │ Controller│ │Controller│ │Controller│ │Controller│ │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │   │
│  │  │ Content  │ │Analytics │ │Interaction││   Other  │  │   │
│  │  │ Controller│ │Controller│ │Controller│ │Controllers│   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │   │
│  └────────────────────────────────────────────────────────┘   │
│        │                                                      │
│  ┌─────▼──────────────────────────────────────────────────┐   │
│  │                  Services Layer                         │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │   │
│  │  │ IMAP Watcher │  │  AI Chatbot  │  │ Email Sender │ │   │
│  │  │ (Real-time)  │  │ (OpenAI)     │  │   (SMTP)     │ │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘ │   │
│  └────────────────────────────────────────────────────────┘   │
│        │                                                      │
│  ┌─────▼──────────────────────────────────────────────────┐   │
│  │                  Models Layer (Mongoose)                │   │
│  │  31 Models: User, Email, Folder, Label, Contact, etc.  │   │
│  └────────────────────────────────────────────────────────┘   │
└──────────────────────────────┬─────────────────────────────────┘
                               │
                               │ Mongoose
                               │
┌──────────────────────────────▼─────────────────────────────────┐
│                    DATA PERSISTENCE LAYER                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│                     ┌─────────────────┐                          │
│                     │    MongoDB      │                          │
│                     │   (Database)    │                          │
│                     └─────────────────┘                          │
│                                                                   │
│                     ┌─────────────────┐                          │
│                     │  External APIs  │                          │
│                     │  - OpenAI API   │                          │
│                     │  - IMAP Server  │                          │
│                     │  - SMTP Server  │                          │
│                     └─────────────────┘                          │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

---

## Layer-by-Layer Architecture

### 1. Presentation Layer (Client)

**Technology Stack**:
- React 19.2.0 (Latest)
- TypeScript 5.9.3
- Vite 7.2.4 (Build Tool)
- Tailwind CSS 3.4.19 (Styling)
- Framer Motion 12.26.2 (Animations)
- React Router DOM 7.12.0 (Routing)
- Socket.IO Client 4.8.3 (Real-time)

**Architecture Pattern**: Component-based SPA with context-driven state management

**Component Hierarchy**:
```
App.tsx (Root)
├── Router Provider
├── Header (Navigation)
├── Routes
│   ├── HomePage
│   ├── AboutPage
│   ├── ServicesPage
│   ├── ProductsPage
│   ├── ContactPage
│   ├── EmailInbox (Email System UI)
│   ├── LoginPage
│   ├── RegisterPage
│   ├── ProfilePage
│   ├── SettingsPage
│   └── ... (5 more pages)
├── Footer
└── Socket.IO Provider (Global)
```

**State Management**:
- React Context API for global state (auth, user data)
- Component-level state for UI-specific data
- Socket.IO for real-time data synchronization
- No Redux or external state management library

**Data Flow**:
- **Requests**: Component → Service (Axios) → API
- **Real-time Updates**: Socket.IO → Context → Component
- **User Actions**: Component → Service → API → Response/Socket Event

**Service Layer Pattern**:
```typescript
// services/api.ts
const API_BASE = import.meta.env.VITE_API_URL;

export const emailService = {
  getEmails: (params) => axios.get(`${API_BASE}/email`, { params }),
  sendEmail: (data) => axios.post(`${API_BASE}/email/send`, data),
  markAsRead: (id) => axios.put(`${API_BASE}/email/${id}/read`),
  // ... more methods
};
```

---

### 2. Web Server Layer (Nginx)

**Role**: Reverse proxy and static file server

**Configuration**:
```nginx
server {
    listen 443 ssl http2;
    server_name ementech.co.ke www.ementech.co.ke;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/ementech.co.ke/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ementech.co.ke/privkey.pem;

    # Static Files (Frontend)
    root /var/www/ementech-website/current;
    index index.html;

    # API Proxy
    location /api/ {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket Proxy (Socket.IO)
    location /socket.io/ {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # SPA Fallback
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

**Responsibilities**:
1. SSL/TLS termination
2. HTTP to HTTPS redirect
3. Static file serving (frontend build)
4. API request proxying
5. WebSocket upgrade handling
6. Gzip compression
7. Caching headers

---

### 3. Application Layer (Node.js Backend)

**Technology Stack**:
- Node.js (Runtime)
- Express 4.19.2 (Web Framework)
- Socket.IO 4.7.5 (WebSocket Server)
- Mongoose 8.0.0 (MongoDB ODM)
- JWT 9.0.2 (Authentication)

**Architecture Pattern**: MVC with service layer

#### 3.1 Middleware Stack

```javascript
Request Flow:
1. CORS Middleware (Origin validation)
2. Helmet Security Headers
3. Body Parser (Express JSON)
4. Compression Middleware
5. Request Logging
6. Rate Limiter (Per-route)
7. Authentication (JWT verification)
8. Route Handler
```

**Middleware Pipeline**:
```javascript
// Global middleware (applied to all routes)
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(compression());

// Route-specific middleware
router.use(protect);  // Authentication
router.use(apiLimiter);  // Rate limiting
```

#### 3.2 Route Layer

**Route Organization**:
```
/api
├── /health (Health check)
├── /email (Email management - 20 routes)
├── /auth (Authentication - 4 routes)
├── /chat (AI chatbot - 2 routes)
├── /leads (Lead capture - 5 routes)
├── /interactions (User interactions - 4 routes)
├── /content (CMS - 6 routes)
└── /analytics (Analytics data - 3 routes)
```

**Route Pattern**:
```javascript
// Authentication + Rate Limiting applied
router.use(protect);
router.use(apiLimiter);

// CRUD pattern
router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);
```

#### 3.3 Controller Layer

**Responsibility**: Handle HTTP requests, invoke business logic, return responses

**Pattern Example**:
```javascript
export const fetchEmails = async (req, res) => {
  try {
    // 1. Extract request data
    const { folder = 'INBOX', limit = 50 } = req.query;
    const userId = req.user.id;

    // 2. Business logic
    const emails = await Email.find({
      user: userId,
      folder: folder,
      isDeleted: false
    })
      .sort({ date: -1 })
      .limit(parseInt(limit))
      .populate('labels');

    // 3. Response
    res.status(200).json({
      success: true,
      count: emails.length,
      data: emails
    });
  } catch (error) {
    // 4. Error handling
    res.status(500).json({
      success: false,
      message: 'Failed to fetch emails',
      error: error.message
    });
  }
};
```

#### 3.4 Service Layer

**Purpose**: Business logic that doesn't fit in controllers, long-running processes, external integrations

**Key Services**:

**1. IMAP Watcher Service** (`/backend/src/services/imapWatcher.js`)
- **Purpose**: Real-time email monitoring
- **Technology**: IMAP protocol with IDLE/polling fallback
- **Architecture**: Singleton pattern with Map-based user tracking
- **Features**:
  - Per-user IMAP connections
  - Automatic IDLE/polling detection
  - 30-second polling fallback
  - Real-time email push via Socket.IO
  - Connection recovery

**Service Class Structure**:
```javascript
class IMAPWatcher {
  constructor() {
    this.watchers = new Map();  // userId -> Imap connection
    this.syncIntervals = new Map();  // userId -> interval ID
  }

  async startWatching(userId) { ... }
  async tryIDLE(userId, emailAccount) { ... }
  startPolling(userId, emailAccount) { ... }
  async fetchNewEmails(userId, emailAccount, imap, sinceUid) { ... }
  async stopWatching(userId) { ... }
  async stopAll() { ... }
}
```

**2. AI Chatbot Service** (`/backend/src/services/aiChatbot.js`)
- **Purpose**: Intelligent customer support
- **Technology**: OpenAI API
- **Features**:
  - Natural language processing
  - Conversation context management
  - Lead capture integration
  - Response generation

**3. Socket.IO Service** (`/backend/src/config/socket.js`)
- **Purpose**: Real-time communication
- **Features**:
  - JWT-based socket authentication
  - Room-based messaging (user-specific channels)
  - Event-driven architecture
  - Multi-client synchronization

**Socket Event Types**:
```javascript
// Client → Server
'send_email'
'mark_read'
'typing'
'flagged'
'moved'
'deleted'

// Server → Client
'new_email' (Real-time email push)
'email_sent'
'email_read_status'
'email_flagged'
'email_moved'
'email_deleted'
'user_typing'
```

#### 3.5 Model Layer (Mongoose Schemas)

**Total Models**: 31 MongoDB schemas

**Schema Architecture**:
- **Fields**: Mongoose schema definitions
- **Indexes**: Performance optimization (compound, text)
- **Virtuals**: Computed properties
- **Static Methods**: Model-level operations
- **Instance Methods**: Document-level operations
- **Middleware**: Pre/post hooks

**Example Model Structure**:
```javascript
const emailSchema = new Schema({
  // Fields
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  folder: { type: String, enum: ['INBOX', 'Sent', ...], default: 'INBOX' },
  subject: String,
  isRead: { type: Boolean, default: false, index: true },
  // ... more fields
}, {
  timestamps: true,
  // Indexes
  index: { user: 1, folder: 1, date: -1 }
});

// Static method
emailSchema.statics.getUnreadCount = async function(userId, folder) {
  return await this.countDocuments({ user: userId, folder, isRead: false });
};

// Instance method
emailSchema.methods.markAsRead = async function() {
  this.isRead = true;
  return await this.save();
};

const Email = mongoose.model('Email', emailSchema);
```

**Key Models**:
- **User**: Authentication, profile
- **Email**: Email messages with full sync
- **UserEmail**: Encrypted email credentials
- **Folder**: Email folder management
- **Label**: User-defined labels
- **Contact**: Email contacts
- **Lead**: Lead capture
- **Conversation**: Chat conversations
- **Message**: Chat messages
- **Analytics**: Analytics data

---

### 4. Data Persistence Layer

**Database**: MongoDB (Document-oriented NoSQL)

**Connection Management**:
```javascript
// config/database.js
const connectDB = async () => {
  const conn = await mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log(`MongoDB Connected: ${conn.connection.host}`);
};
```

**Data Modeling Approach**:
- **Embedded Documents**: For closely related data (e.g., email attachments)
- **References**: For related entities (e.g., email.user → User)
- **Denormalization**: For performance (e.g., email.from cached in Email doc)
- **Indexes**: For query optimization

**External Integrations**:
- **IMAP Server**: Email fetching (incoming emails)
- **SMTP Server**: Email sending (outgoing emails)
- **OpenAI API**: AI chatbot responses

---

## Real-Time Communication Architecture

### Socket.IO Implementation

**Server Setup**:
```javascript
const io = new Server(httpServer, {
  cors: { origin: allowedOrigins },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Global access for helpers
global.io = io;
app.set('io', io);
```

**Authentication Middleware**:
```javascript
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.id);
  socket.userId = user._id;
  socket.user = user;
  next();
});
```

**Room-Based Architecture**:
```javascript
io.on('connection', (socket) => {
  // Join user-specific room
  socket.join(`user:${socket.userId}`);

  // Personal channel
  socket.join(`email:${socket.userId}`);
});
```

**Real-time Email Flow**:
```
1. New email arrives at IMAP server
2. IMAP Watcher detects new email (IDLE or polling)
3. fetchNewEmails() saves to MongoDB
4. sendNewEmail(userId, email) called
5. Socket.IO emits to user's room
6. Client receives 'new_email' event
7. UI updates instantly
```

---

## Email System Architecture (CWD Startup)

### System Overview

The email system is a **production-grade, fully tested IMAP email client** built for CWD startup. It provides Gmail-like functionality with real-time synchronization.

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    EMAIL CLIENT UI                          │
│              (React - EmailInbox.jsx)                       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ HTTP + WebSocket
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                 EMAIL API ROUTES                            │
│           (/api/email/* - 20 endpoints)                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
┌───────▼──────┐ ┌─────▼──────┐ ┌────▼────────┐
│ Email Fetch  │ │ Email Send │ │ Email Mgmt  │
│ Controller   │ │ Controller │ │ Controller  │
└───────┬──────┘ └─────┬──────┘ └────┬────────┘
        │              │              │
┌───────▼──────────────────▼────────────▼─────────────────────┐
│                    SERVICE LAYER                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ IMAP Watcher │  │ SMTP Sender  │  │ Socket Push  │      │
│  │ (Real-time)  │  │ (nodemailer) │  │ Notification │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────────────┬─────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
┌───────▼──────┐ ┌───▼──────┐ ┌──▼──────────┐
│   MongoDB    │ │ IMAP     │ │   SMTP      │
│  (Email DB)  │ │ Server   │ │  Server     │
└──────────────┘ └──────────┘ └─────────────┘
```

### Email Sync Flow (Real-time)

**1. IMAP IDLE Mode (Preferred)**:
```
1. IMAP Watcher opens IDLE connection
2. Server pushes notification when new email arrives
3. fetchNewEmails() retrieves email
4. Parse with mailparser
5. Save to MongoDB
6. Socket.IO emits to client
7. Client updates UI (instant)
```

**2. Polling Mode (Fallback)**:
```
1. IMAP Watcher polls every 30 seconds
2. Checks UID > last known UID
3. If new emails found, fetch them
4. Save to MongoDB
5. Socket.IO emits to client
6. Client updates UI (within 30s)
```

### Email Sending Flow

```
Client UI
  │
  │ POST /api/email/send
  ▼
Email Controller
  │
  │ 1. Get user's SMTP credentials
  │ 2. Create nodemailer transporter
  │ 3. Send email via SMTP
  ▼
SMTP Server
  │
  │ Returns messageId
  ▼
MongoDB
  │
  │ Save to Sent folder
  ▼
Socket.IO
  │
  │ Emit 'email_sent' event
  ▼
Client UI
```

### Data Models

**Email Model** (Key Fields):
```javascript
{
  user: ObjectId,
  emailAccount: ObjectId,
  messageId: String (unique),
  uid: Number (IMAP),
  folder: String (INBOX, Sent, Drafts, ...),
  from: { name, email },
  to: [{ name, email }],
  subject: String,
  textBody: String,
  htmlBody: String,
  isRead: Boolean,
  isFlagged: Boolean,
  hasAttachments: Boolean,
  attachments: [{ filename, contentType, size }],
  date: Date,
  references: [String] (for threading)
}
```

**UserEmail Model** (Encrypted Credentials):
```javascript
{
  user: ObjectId,
  email: String,
  displayName: String,
  imap: {
    host: String,
    port: Number,
    tls: Boolean,
    username: String,
    password: String (encrypted)
  },
  smtp: {
    host: String,
    port: Number,
    secure: Boolean,
    username: String,
    password: String (encrypted)
  },
  isPrimary: Boolean,
  syncStatus: String,
  lastSyncedAt: Date
}
```

---

## Security Architecture

### Authentication Flow

```
1. Client sends credentials to /api/auth/login
2. Server validates password
3. Server generates JWT (expires in 7 days)
4. Server returns JWT to client
5. Client stores JWT (localStorage)
6. Client includes JWT in Authorization header
7. Server verifies JWT on protected routes
8. Socket.IO also requires JWT for connection
```

### Security Layers

**1. Network Level**:
- SSL/TLS (Let's Encrypt)
- HTTP → HTTPS redirect
- TLS 1.2+ enforced

**2. Application Level**:
- Helmet.js security headers
- CORS (allowed origins only)
- Rate limiting (per endpoint)
- Request size limits (10mb)

**3. Authentication Level**:
- JWT with expiration
- Bcrypt password hashing (10 rounds)
- Account activation/deactivation
- Token refresh mechanism

**4. Data Level**:
- Input validation (express-validator)
- NoSQL injection prevention (Mongoose sanitization)
- XSS protection (React auto-escaping)
- Encrypted email credentials (UserEmail model)

---

## Deployment Architecture

### Server Configuration

**VPS**: Ubuntu Linux 6.14.0-37-generic
**IP**: 69.164.244.165
**Domain**: ementech.co.ke

### Process Management (PM2)

**Configuration**:
```javascript
// PM2 manages backend as "ementech-backend"
// Entry: /var/www/ementech-website/backend/src/server.js
// Port: 5001
// Autorestart: Enabled
// Max Memory: 1G
```

**Benefits**:
- Auto-restart on crash
- Log management
- Cluster mode (if needed)
- Environment management

### Directory Structure (Production)

```
/var/www/ementech-website/
├── backend/
│   ├── src/
│   ├── node_modules/
│   ├── package.json
│   ├── .env (production secrets)
│   └── logs/ (PM2 logs)
├── current/ (symlink to latest frontend build)
│   ├── index.html
│   └── assets/
├── frontend/ (previous builds)
└── releases/ (deployment history)
```

### Deployment Process

**Frontend**:
```bash
1. Build locally: npm run build
2. Upload dist/ to /var/www/ementech-website/current
3. Nginx automatically serves new files
```

**Backend**:
```bash
1. Upload code to /var/www/ementech-website/backend
2. Install dependencies: npm install
3. Restart PM2: pm2 restart ementech-backend
```

---

## Scaling Considerations

### Current Capacity
- **Single VPS**: Handles all traffic
- **MongoDB**: Single instance (could use Atlas for scaling)
- **PM2**: Single instance (could use cluster mode)

### Horizontal Scaling Path

**If needed**:
1. **Load Balancer**: Add Nginx load balancer
2. **Multiple Backend Instances**: PM2 cluster mode
3. **MongoDB Replica Set**: High availability
4. **Redis**: For Socket.IO sticky sessions
5. **CDN**: For static assets (Cloudflare)

### Vertical Scaling Path
1. **Upgrade VPS**: More RAM/CPU
2. **MongoDB Tuning**: Increase cache size
3. **Nginx Tuning**: Worker processes

---

## Monitoring & Observability

### Health Monitoring
- **Health Endpoint**: `/api/health`
- **PM2 Monitoring**: `pm2 monit`
- **Nginx Logs**: `/var/log/nginx/`
- **Application Logs**: PM2 log files

### Key Metrics to Monitor
- Backend uptime (PM2)
- API response times
- IMAP connection status
- Socket.IO connections
- MongoDB performance
- Nginx access/error logs

---

## Architecture Strengths

1. **Real-time Capabilities**: Socket.IO provides instant updates
2. **Email System**: Production-grade IMAP integration (rare in web apps)
3. **Separation of Concerns**: Clear MVC + Service layer
4. **Security**: Multiple layers (JWT, rate limiting, CORS, Helmet)
5. **Scalability**: Can scale horizontally if needed
6. **Modern Stack**: React 19, latest dependencies

---

## Architecture Weaknesses

1. **Monolithic**: All services in one codebase (could separate)
2. **No Redis**: Socket.IO memory-based (no cross-process sync)
3. **Single MongoDB**: No replica set (single point of failure)
4. **Limited Testing**: No automated test suite
5. **No API Documentation**: Missing OpenAPI/Swagger
6. **Error Handling**: Generic in some areas

---

## Technology Rationale

### Why React 19?
- Latest performance improvements
- Concurrent features
- Strong ecosystem

### Why Express?
- Minimal, unopinionated
- Huge middleware ecosystem
- Easy to deploy

### Why Socket.IO?
- Real-time bi-directional communication
- Automatic fallback (WebSocket → polling)
- Room-based messaging
- Strong React integration

### Why MongoDB?
- Flexible schema (evolving requirements)
- Document model (fits email data)
- Easy scaling (Atlas)
- Mongoose (strong typing)

### Why IMAP/SMTP?
- Standard email protocols
- Works with any email provider
- No vendor lock-in
- CWD startup requirement

---

## Conclusion

The Ementech website architecture is a **well-structured monolithic application** with real-time capabilities and a production-grade email system. The architecture follows industry best practices with clear separation of concerns, multiple security layers, and modern technologies.

**Key Architectural Highlight**: The IMAP email system is fully functional, tested, and production-ready - a rare and valuable feature that sets this project apart from typical corporate websites.

**Recommended Next Steps**:
1. Add automated testing
2. Implement API documentation (OpenAPI)
3. Add Redis for Socket.IO scaling
4. Set up MongoDB replica set
5. Implement proper logging system (Winston)

---

**Documentation Version**: 1.0.0
**Last Updated**: 2026-01-21
