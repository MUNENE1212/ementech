# EmenTech Email System - System Architecture

**Project Code**: EMENTECH-EMAIL-001
**Document Version**: 1.0
**Date**: January 19, 2026
**Architect**: System Architecture Agent
**Status**: Complete

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [Technology Stack](#technology-stack)
4. [System Components](#system-components)
5. [Data Flow Architecture](#data-flow-architecture)
6. [Real-Time Communication](#real-time-communication)
7. [Security Architecture](#security-architecture)
8. [Scalability Strategy](#scalability-strategy)
9. [Integration Points](#integration-points)
10. [Deployment Architecture](#deployment-architecture)

---

## Executive Summary

The EmenTech Email System is an enterprise-grade, real-time email client built on the MERN stack, integrating seamlessly with the existing Postfix + Dovecot email server. The system provides modern email capabilities with real-time notifications, advanced search, contact management, and full WCAG 2.1 AA accessibility compliance.

### Key Design Principles

1. **Real-Time First**: Instant email delivery and notifications using Socket.IO and IMAP IDLE
2. **Accessibility First**: WCAG 2.1 AA compliance built into every component
3. **Performance**: Optimized for 2GB RAM VPS with efficient caching and lazy loading
4. **Scalability**: Designed to scale from 5 to 100+ users with clear upgrade paths
5. **Brand Integration**: Seamless visual and UX consistency with ementech.co.ke and app.ementech.co.ke

### Architecture Highlights

- **Event-Driven**: Socket.IO for real-time bidirectional communication
- **IMAP IDLE**: Push notifications for instant email delivery
- **Component-Based**: React with reusable, accessible components
- **RESTful API**: Standard REST + WebSocket hybrid for maximum compatibility
- **MongoDB**: Flexible document storage for emails, contacts, and metadata
- **Responsive**: Mobile-first design with desktop optimization

---

## Architecture Overview

### High-Level Architecture Pattern

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │   React      │  │  React       │  │  React       │                  │
│  │   Inbox UI   │  │  Composer    │  │  Settings    │                  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘                  │
│         │                  │                  │                          │
│         └──────────────────┼──────────────────┘                          │
│                            │                                             │
│                   ┌────────▼────────┐                                    │
│                   │  Socket.IO      │                                    │
│                   │  Client         │                                    │
│                   └────────┬────────┘                                    │
└────────────────────────────┼────────────────────────────────────────────┘
                             │ HTTPS/WSS
                              │
┌────────────────────────────┼────────────────────────────────────────────┐
│                    API GATEWAY / nginx                                    │
│  ┌─────────────────────────┼──────────────────────────┐                │
│  │              REST API    │    WebSocket (Socket.IO)  │                │
│  └─────────────────────────┼──────────────────────────┘                │
└────────────────────────────┼────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        APPLICATION LAYER                                 │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    Express.js API Server                         │   │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐     │   │
│  │  │ Email Routes   │  │ Contact Routes │  │ Auth Routes    │     │   │
│  │  └────────────────┘  └────────────────┘  └────────────────┘     │   │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐     │   │
│  │  │ Search Service │  │ Label Service  │  │ Analytics      │     │   │
│  │  └────────────────┘  └────────────────┘  └────────────────┘     │   │
│  └────────────────────────────────┬────────────────────────────────┘   │
│                                   │                                     │
│  ┌────────────────────────────────▼────────────────────────────────┐   │
│  │                    Socket.IO Server                              │   │
│  │  • Connection management                                         │   │
│  │  • Event broadcasting                                            │   │
│  │  • Room-based communication                                      │   │
│  └────────────────────────────────┬────────────────────────────────┘   │
└───────────────────────────────────┼─────────────────────────────────────┘
                                    │
┌───────────────────────────────────┼─────────────────────────────────────┐
│                      SERVICE LAYER                                      │
│  ┌────────────────────────────────▼────────────────────────────────┐   │
│  │              IMAP Monitor Daemon (Node.js)                       │   │
│  │  • IMAP IDLE connection (Dovecot)                                │   │
│  │  • Real-time email detection                                     │   │
│  │  • Event emission to Socket.IO                                   │   │
│  └────────────────────────────────┬────────────────────────────────┘   │
│                                   │                                     │
│  ┌────────────────────────────────▼────────────────────────────────┐   │
│  │              Email Processing Service                            │   │
│  │  • Fetch new emails via IMAP                                     │   │
│  │  • Parse and store in MongoDB                                    │   │
│  │  • Update search indexes                                         │   │
│  │  • Trigger notifications                                         │   │
│  └────────────────────────────────┬────────────────────────────────┘   │
└───────────────────────────────────┼─────────────────────────────────────┘
                                    │
┌───────────────────────────────────┼─────────────────────────────────────┐
│                      DATA LAYER                                         │
│                                   │                                     │
│  ┌────────────────────────────────▼────────────────────────────────┐   │
│  │                    MongoDB Database                              │   │
│  │  • emails (messages, headers, bodies)                            │   │
│  │  • contacts (CRM data)                                           │   │
│  │  • labels (categories, tags)                                     │   │
│  │  • users (preferences, settings)                                 │   │
│  │  • analytics (usage metrics)                                     │   │
│  └────────────────────────────────┬────────────────────────────────┘   │
│                                   │                                     │
│  ┌────────────────────────────────▼────────────────────────────────┐   │
│  │              Dovecot IMAP Server (Existing)                      │   │
│  │  • Maildir storage (/var/vmail)                                  │   │
│  │  • IMAP IDLE support                                             │   │
│  │  • Authentication                                                │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │              Postfix SMTP Server (Existing)                       │  │
│  │  • Outgoing email delivery                                        │  │
│  │  • Queue management                                               │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend Stack

| Component | Technology | Version | Justification |
|-----------|-----------|---------|---------------|
| **Framework** | React | 19.2.0 | Latest stable, excellent performance, built-in hooks |
| **State Management** | Zustand | 5.0+ | Lightweight (3KB), TypeScript-first, no boilerplate |
| **Routing** | React Router | 7.12+ | Data loading, nested routes, excellent accessibility |
| **UI Components** | Radix UI | 1.0+ | Unstyled, accessible primitives, WCAG 2.1 AA ready |
| **Styling** | Tailwind CSS | 3.4+ | Utility-first, consistent with existing apps |
| **Real-Time Client** | Socket.IO Client | 4.7+ | Auto-reconnect, fallbacks, proven reliability |
| **Forms** | React Hook Form | 7.51+ | Minimal re-renders, accessible by default |
| **Validation** | Zod | 3.22+ | TypeScript-first, runtime validation |
| **Rich Text Editor** | Tiptap | 2.2+ | ProseMirror-based, extensible, accessible |
| **Icons** | Lucide React | 0.562+ | Tree-shakeable, consistent with existing apps |
| **Build Tool** | Vite | 7.2+ | Fast HMR, optimized builds, native ESM |

### Backend Stack

| Component | Technology | Version | Justification |
|-----------|-----------|---------|---------------|
| **Runtime** | Node.js | 20.11+ LTS | Long-term support, excellent performance |
| **Framework** | Express.js | 4.19+ | Minimal, flexible, huge ecosystem |
| **Real-Time Server** | Socket.IO | 4.7+ | Proven, scalable, automatic CORS handling |
| **Database** | MongoDB | 7.0+ | Flexible schema, excellent for email data |
| **ODM** | Mongoose | 8.4+ | Schema validation, middleware, TypeScript support |
| **IMAP Client** | node-imap | 0.8.9 | Stable, well-maintained, IDLE support |
| **Mail Parser** | mailparser-mit | 0.2.0 | MIT licensed, robust parsing |
| **Authentication** | JWT | - | Stateless, scalable, industry standard |
| **Password Hashing** | bcrypt | 5.1+ | Proven, adaptive hashing |
| **Validation** | Zod | 3.22+ | Consistent with frontend |
| **API Documentation** | OpenAPI | 3.0+ | Standard, tool-agnostic |

### DevOps & Monitoring

| Component | Technology | Justification |
|-----------|-----------|---------------|
| **Process Manager** | PM2 | Auto-restart, clustering, monitoring |
| **Reverse Proxy** | nginx | Existing, efficient, SSL termination |
| **SSL Certificates** | Let's Encrypt | Free, auto-renewal |
| **Monitoring** | Custom metrics | Lightweight, tailored to needs |
| **Logging** | Winston + Morgan | Structured logging, transports |
| **Testing** | Vitest + Playwright | Unit + E2E, Vite-native |

---

## System Components

### 1. Frontend Components

#### 1.1 Core UI Components (Reusable)

```typescript
components/
├── ui/                          # Radix UI primitives + styling
│   ├── button.tsx              # Accessible button with variants
│   ├── input.tsx               # Text input with validation states
│   ├── textarea.tsx            # Multi-line input
│   ├── select.tsx              # Dropdown select
│   ├── checkbox.tsx            # Checkbox group
│   ├── dialog.tsx              # Modal dialogs
│   ├── dropdown-menu.tsx       # Context menus
│   ├── toast.tsx               # Notifications
│   ├── tooltip.tsx             # Help tooltips
│   ├── tabs.tsx                # Tab navigation
│   ├── badge.tsx               # Status badges
│   ├── avatar.tsx              # User avatars
│   └── progress.tsx            # Progress indicators
├── email/
│   ├── EmailList.tsx           # Inbox/Sent folder list
│   ├── EmailItem.tsx           # Single email row
│   ├── EmailView.tsx           # Email detail view
│   ├── EmailComposer.tsx       # Compose/reply/forward
│   ├── EmailToolbar.tsx        # Actions (delete, archive, etc.)
│   ├── EmailSearch.tsx         # Search bar with filters
│   ├── EmailFilters.tsx        # Filter controls
│   ├── FolderTree.tsx          # Sidebar folder navigation
│   └── EmailAttachments.tsx    # Attachment list
├── contacts/
│   ├── ContactList.tsx         # All contacts view
│   ├── ContactCard.tsx         # Single contact display
│   ├── ContactForm.tsx         # Add/Edit contact
│   ├── ContactSearch.tsx       # Contact search
│   └── ContactAvatar.tsx       # Avatar with initials
├── auth/
│   ├── LoginForm.tsx           # Login form
│   ├── ProtectedRoute.tsx      # Route guard
│   └── PasswordReset.tsx       # Password reset flow
└── shared/
    ├── Layout.tsx              # App shell (header, sidebar)
    ├── Header.tsx              # Top navigation bar
    ├── Sidebar.tsx             # Collapsible sidebar
    ├── LoadingSpinner.tsx      # Loading states
    ├── ErrorBoundary.tsx       # Error handling
    ├── NotificationCenter.tsx  # Toast notifications
    └── KeyboardShortcuts.tsx   # Global shortcuts
```

#### 1.2 Page Components (Routes)

```typescript
pages/
├── InboxPage.tsx               # Main inbox view
├── SentPage.tsx                # Sent emails
├── DraftsPage.tsx              # Draft emails
├── ArchivePage.tsx             # Archived emails
├── SpamPage.tsx                # Spam folder
├── TrashPage.tsx               # Deleted emails
├── EmailDetailPage.tsx         # Single email view
├── ComposePage.tsx             # Compose new email
├── ContactsPage.tsx            # Contact management
├── SettingsPage.tsx            # User settings
└── SearchResultsPage.tsx       # Advanced search results
```

#### 1.3 State Management (Zustand Stores)

```typescript
stores/
├── authStore.ts                # Authentication state
├── emailStore.ts               # Email data & pagination
├── folderStore.ts              # Folders & labels
├── contactStore.ts             # Contact management
├── uiStore.ts                  # UI state (sidebar, theme, etc.)
├── notificationStore.ts        # Notification preferences
└── searchStore.ts              # Search queries & filters
```

### 2. Backend Components

#### 2.1 API Routes (REST)

```typescript
routes/
├── auth/
│   ├── auth.routes.ts          # Login, logout, token refresh
│   └── password.routes.ts      # Password reset, change password
├── emails/
│   ├── email.routes.ts         # CRUD operations
│   ├── folder.routes.ts        # Folder management
│   ├── label.routes.ts         # Label/CRUD tags
│   ├── attachment.routes.ts    # Upload/download
│   └── search.routes.ts        # Advanced search
├── contacts/
│   ├── contact.routes.ts       # Contact CRUD
│   └── crm.routes.ts           # CRM integration
├── settings/
│   ├── user.routes.ts          # User profile
│   ├── preferences.routes.ts   # Email preferences
│   └── signature.routes.ts     # Email signatures
└── analytics/
    ├── usage.routes.ts         # Usage statistics
    └── engagement.routes.ts    # Email engagement metrics
```

#### 2.2 Socket.IO Events (Real-Time)

```typescript
socket/
├── events.ts                   # Event definitions
├── handlers/
│   ├── email.handler.ts        # Email event handlers
│   ├── notification.handler.ts # Notification handlers
│   └── collaboration.handler.ts # Real-time collaboration
└── rooms.ts                    # Room management (user-specific)
```

#### 2.3 Services (Business Logic)

```typescript
services/
├── EmailService.ts             # Email operations
├── ImapService.ts              # IMAP connection management
├── ContactService.ts           # Contact management
├── SearchService.ts            # Search & indexing
├── NotificationService.ts      # Notification delivery
├── AnalyticsService.ts         # Metrics tracking
└── CronService.ts              # Scheduled tasks
```

#### 2.4 Background Processes

```typescript
workers/
├── ImapMonitorDaemon.ts        # IMAP IDLE listener
├── EmailProcessor.ts           # Process new emails
├── NotificationWorker.ts       # Send notifications
└── AnalyticsWorker.ts          # Aggregate metrics
```

#### 2.5 Middleware

```typescript
middleware/
├── auth.middleware.ts          # JWT verification
├── error.middleware.ts         # Global error handling
├── validation.middleware.ts    # Request validation
├── rateLimit.middleware.ts     # API rate limiting
├── logger.middleware.ts        # Request logging
└── cors.middleware.ts          # CORS configuration
```

### 3. Database Components

#### 3.1 MongoDB Models (Mongoose)

```typescript
models/
├── Email.model.ts              # Email messages
├── Folder.model.ts             # Email folders
├── Label.model.ts              # Labels/tags
├── Contact.model.ts            # Contacts
├── User.model.ts               # User accounts
├── Notification.model.ts       # Notification history
└── Analytics.model.ts          # Usage metrics
```

---

## Data Flow Architecture

### 1. Incoming Email Flow (Real-Time)

```
[External Sender]
       │
       │ SMTP (port 25)
       ▼
[Postfix] → [Dovecot] → Maildir (/var/vmail/)
       │
       │ IMAP IDLE push
       ▼
[IMAP Monitor Daemon]
       │
       │ Detects new email
       ▼
[Email Processing Service]
       │
       ├─► Fetch email via IMAP
       ├─► Parse headers, body, attachments
       ├─► Store in MongoDB (Email collection)
       ├─► Update search indexes
       ├─► Update user stats (unread count)
       └─► Emit Socket.IO event
                │
                │ Socket.IO (WSS)
                ▼
        [Client Browser]
                │
                ▼
        [React UI Updates]
         • Inbox list refresh
         • Desktop notification
         • Unread badge update
         • Audio notification
```

### 2. Outgoing Email Flow

```
[User: Compose Email]
       │
       │ Form submission
       ▼
[React Composer UI]
       │
       │ HTTP POST /api/emails/send
       ▼
[Express API]
       │
       ├─► Validate recipient addresses
       ├─► Validate attachments
       ├─► Store in MongoDB (Sent folder)
       ├─► Queue for delivery
       └─► Return email ID
                │
                ▼
[Postfix SMTP Queue]
       │
       │ SMTP transaction
       ▼
[Recipient Mail Server]
       │
       ▼
[Recipient Inbox]
```

### 3. Real-Time Notification Flow

```
[Event Source: IMAP Monitor]
       │
       │ Emit event
       ▼
[Socket.IO Server]
       │
       ├─► Determine target users
       ├─► Join user to room
       └─► Broadcast to room
                │
                │ WSS
                ▼
        [Socket.IO Client]
                │
                ├─► Receive event
                ├─► Update local state
                ├─► Trigger UI re-render
                └─► Show notification
```

### 4. Search Flow

```
[User: Search Query]
       │
       │ HTTP GET /api/emails/search?q=...
       ▼
[Express API - Search Route]
       │
       ├─► Parse query (text, filters, date range)
       ├─► Build MongoDB query
       ├─► Execute search with pagination
       ├─► Sort results (relevance/date)
       └─► Return paginated results
                │
                ▼
        [React UI Display]
```

---

## Real-Time Communication

### Socket.IO Architecture

#### 1. Connection Management

```typescript
// Server: Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000
});

// Client: Socket.IO setup
const socket = io(process.env.VITE_API_URL, {
  auth: { token: localStorage.getItem('token') },
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
});
```

#### 2. Room-Based Communication

```typescript
// Each user joins their own room on connection
socket.on('connection', (socket) => {
  const userId = socket.data.userId;
  socket.join(`user:${userId}`);

  // Leave room on disconnect
  socket.on('disconnect', () => {
    socket.leave(`user:${userId}`);
  });
});

// Send email to specific user
io.to(`user:${userId}`).emit('email:new', newEmail);
```

#### 3. Event Definitions

| Event Name | Direction | Payload | Purpose |
|-----------|-----------|---------|---------|
| `email:new` | Server → Client | Email object | New email received |
| `email:read` | Client → Server | Email ID | Mark email as read |
| `email:delete` | Bidirectional | Email ID | Email deleted |
| `notification:show` | Server → Client | Notification object | Show notification |
| `typing:start` | Client → Server | Compose ID | User is typing |
| `typing:stop` | Client → Server | Compose ID | User stopped typing |
| `collab:cursor` | Bidirectional | Cursor position | Real-time collaboration |
| `folder:update` | Server → Client | Folder stats | Folder count update |

#### 4. IMAP IDLE Integration

```typescript
// ImapMonitorDaemon.ts
class ImapMonitorDaemon {
  private imap: Imap;

  async start() {
    this.imap = await Imap.connect({
      user: process.env.EMAIL_USER,
      password: process.env.EMAIL_PASSWORD,
      host: 'localhost',
      port: 993,
      tls: true
    });

    // Open mailbox with IDLE
    await this.imap.openBox('INBOX', false);

    // Listen for IDLE updates
    this.imap.on('update', async () => {
      const newEmails = await this.fetchNewEmails();

      for (const email of newEmails) {
        // Process and store
        await this.emailService.processEmail(email);

        // Emit real-time event
        io.to(`user:${email.userId}`).emit('email:new', email);
      }
    });

    // Start IDLE mode
    this.imap.idle();
  }
}
```

---

## Security Architecture

### 1. Authentication Flow

```
[Client: Login]
       │
       │ POST /api/auth/login {email, password}
       ▼
[Express API]
       │
       ├─► Validate input
       ├─► Find user in MongoDB
       ├─► Compare password hash (bcrypt)
       ├─► Generate JWT (expires: 7d)
       └─► Return token + user object
                │
                ▼
        [Client Storage]
         • localStorage: token
         • memory: user state
```

### 2. JWT Structure

```typescript
interface JWTPayload {
  sub: string;           // User ID
  email: string;         // User email
  role: 'user' | 'admin';
  iat: number;           // Issued at
  exp: number;           // Expiration
}

// Example:
{
  "sub": "65a7b8c9d0e1f2a3b4c5d6e7",
  "email": "ceo@ementech.co.ke",
  "role": "user",
  "iat": 1705689600,
  "exp": 1706294400
}
```

### 3. Authorization Middleware

```typescript
// Protect routes
export const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Admin-only routes
export const adminMiddleware = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
};
```

### 4. Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

// API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests from this IP'
});

// Stricter for authentication
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 login attempts per 15 minutes
  skipSuccessfulRequests: true
});
```

### 5. Data Validation

```typescript
import { z } from 'zod';

// Email send validation
const sendEmailSchema = z.object({
  to: z.array(z.string().email()).min(1).max(50),
  cc: z.array(z.string().email()).max(50).optional(),
  bcc: z.array(z.string().email()).max(50).optional(),
  subject: z.string().min(1).max(500),
  body: z.string().min(1).max(50000),
  attachments: z.array(z.object({
    filename: z.string(),
    contentType: z.string(),
    size: z.number().max(25 * 1024 * 1024) // 25MB max
  })).optional()
});
```

### 6. IMAP Credentials Security

```typescript
// Store IMAP credentials in environment variables
const imapConfig = {
  user: process.env.IMAP_USER,
  password: process.env.IMAP_PASSWORD,
  host: 'localhost',
  port: 993,
  tls: true
};

// Never log credentials
// Use secure secrets management in production
```

---

## Scalability Strategy

### Phase 1: Current (5-10 Users)

**Resources**:
- 2GB RAM VPS
- MongoDB on same server
- Single Node.js process
- Socket.IO in-memory

**Performance Targets**:
- < 100ms API response time
- < 2s real-time email delivery
- 10 concurrent users

**Upgrade Triggers**:
- RAM usage > 80%
- API response time > 500ms
- Socket.IO disconnections > 5%

### Phase 2: Growth (10-25 Users)

**Upgrades**:
- Upgrade VPS to 4GB RAM
- Enable PM2 clustering (2-4 processes)
- Add Redis for Socket.IO adapter
- Implement MongoDB indexing
- Add response caching

**Architecture Changes**:
```typescript
// PM2 cluster configuration
module.exports = {
  apps: [{
    name: 'email-api',
    script: './dist/server.js',
    instances: 2,
    exec_mode: 'cluster',
    max_memory_restart: '1G'
  }]
};

// Redis Socket.IO adapter
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

const redisClient = createClient({ url: process.env.REDIS_URL });
io.adapter(createAdapter(redisClient));
```

**Performance Targets**:
- < 200ms API response time
- < 1s real-time email delivery
- 25 concurrent users

### Phase 3: Expansion (25-100 Users)

**Upgrades**:
- Dedicated server: 8GB RAM, 4 cores
- Separate MongoDB server (4GB RAM)
- Nginx load balancer
- Redis caching layer
- Elasticsearch for search
- CDN for static assets

**Architecture Changes**:
```
                      [Internet]
                          │
                          ▼
                    [Load Balancer]
                          │
          ┌───────────────┼───────────────┐
          │               │               │
     [API Server 1] [API Server 2] [API Server 3]
          │               │               │
          └───────────────┼───────────────┘
                          │
          ┌───────────────┼───────────────┐
          │               │               │
     [Redis Cache]   [MongoDB]      [Elasticsearch]
```

**Performance Targets**:
- < 300ms API response time
- < 500ms real-time email delivery
- 100 concurrent users

---

## Integration Points

### 1. Integration with Existing EmenTech Systems

#### 1.1 Shared Authentication

```typescript
// Use existing JWT from ementech.co.ke
const existingToken = localStorage.getItem('ementech_token');

// Pass to email system
socket.auth = { token: existingToken };
```

#### 1.2 Shared MongoDB Instance

```typescript
// Connect to existing MongoDB
mongoose.connect(process.env.EXISTING_MONGO_URI, {
  dbName: 'ementech_email' // Separate database
});
```

#### 1.3 Shared nginx Configuration

```nginx
# Add to existing nginx config
location /email-api/ {
    proxy_pass http://localhost:3001/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
}

location /socket.io/ {
    proxy_pass http://localhost:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
}
```

### 2. Email Server Integration (Postfix + Dovecot)

#### 2.1 IMAP Connection

```typescript
const imapConfig = {
  user: 'ceo@ementech.co.ke',
  password: process.env.EMAIL_PASSWORD,
  host: 'localhost', // Dovecot on same server
  port: 993,
  tls: true,
  connTimeout: 10000,
  authTimeout: 5000
};
```

#### 2.2 SMTP Integration for Sending

```typescript
// Use existing Postfix for outbound
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'localhost',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});
```

### 3. CRM Integration (Future)

```typescript
// API endpoints for CRM data
interface CRMContact {
  id: string;
  name: string;
  email: string;
  company?: string;
  phone?: string;
  tags?: string[];
  lastContact?: Date;
  notes?: string;
}

// Sync contacts with CRM
GET /api/contacts/sync-crm
POST /api/contacts/import-crm
```

---

## Deployment Architecture

### 1. Directory Structure

```
/var/www/ementech-email/
├── backend/
│   ├── dist/                  # Compiled TypeScript
│   ├── src/                   # Source code
│   ├── package.json
│   └── ecosystem.config.js    # PM2 configuration
├── frontend/
│   ├── dist/                  # Built React app
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
└── shared/
    ├── types/                 # Shared TypeScript types
    └── constants/             # Shared constants
```

### 2. Process Management (PM2)

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'ementech-email-api',
      script: './backend/dist/server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      max_memory_restart: '500M',
      error_file: '/var/log/pm2/ementech-email-error.log',
      out_file: '/var/log/pm2/ementech-email-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss'
    },
    {
      name: 'ementech-email-worker',
      script: './backend/dist/workers/ImapMonitorDaemon.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      autorestart: true
    }
  ]
};
```

### 3. nginx Configuration

```nginx
# /etc/nginx/sites-available/ementech-email

# Frontend (React SPA)
server {
    listen 80;
    server_name mail.ementech.co.ke;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name mail.ementech.co.ke;

    ssl_certificate /etc/letsencrypt/live/ementech.co.ke/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ementech.co.ke/privkey.pem;

    # Frontend static files
    location / {
        root /var/www/ementech-email/frontend/dist;
        try_files $uri /index.html;

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API proxy
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # CORS headers
        add_header Access-Control-Allow-Origin https://mail.ementech.co.ke;
        add_header Access-Control-Allow-Methods 'GET, POST, PUT, DELETE, OPTIONS';
        add_header Access-Control-Allow-Headers 'Authorization, Content-Type';
    }

    # Socket.IO proxy
    location /socket.io/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 4. Environment Variables

```bash
# /var/www/ementech-email/backend/.env.production

# API Configuration
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://mail.ementech.co.ke

# MongoDB
MONGO_URI=mongodb://localhost:27017/ementech_email

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=7d

# Email Server (IMAP)
IMAP_HOST=localhost
IMAP_PORT=993
IMAP_USER_TEMPLATE=%s@ementech.co.ke
IMAP_PASSWORD=default-password

# SMTP (Postfix)
SMTP_HOST=localhost
SMTP_PORT=587

# Socket.IO
SOCKET_IO_CORS_ORIGIN=https://mail.ementech.co.ke

# Redis (Phase 2)
REDIS_URL=redis://localhost:6379

# Logging
LOG_LEVEL=info
LOG_FILE=/var/log/ementech-email/app.log

# Monitoring
SENTRY_DSN=your-sentry-dsn  # Optional
```

### 5. Backup Strategy

```bash
#!/bin/bash
# /usr/local/bin/backup-email-system.sh

# Backup MongoDB
mongodump --db=ementech_email --out=/backup/mongodb/$(date +%Y%m%d)

# Backup attachments
rsync -av /var/www/ementech-email/uploads/ /backup/attachments/$(date +%Y%m%d)/

# Compress
tar -czf /backup/ementech-email-$(date +%Y%m%d).tar.gz /backup/mongodb/$(date +%Y%m%d) /backup/attachments/$(date +%Y%m%d)

# Upload to remote storage (optional)
# aws s3 cp /backup/ementech-email-$(date +%Y%m%d).tar.gz s3://ementech-backups/

# Clean up old backups (30 days)
find /backup -name "ementech-email-*.tar.gz" -mtime +30 -delete
```

### 6. Monitoring Script

```typescript
// monitoring.ts
import { exec } from 'child_process';
import fs from 'fs';

interface HealthCheck {
  timestamp: Date;
  api: boolean;
  mongo: boolean;
  imap: boolean;
  ram: number;
  disk: number;
}

async function healthCheck(): Promise<HealthCheck> {
  // Check API
  const apiUp = await checkApi();

  // Check MongoDB
  const mongoUp = await checkMongo();

  // Check IMAP
  const imapUp = await checkImap();

  // Check RAM
  const ramUsage = await getRamUsage();

  // Check disk
  const diskUsage = await getDiskUsage();

  return {
    timestamp: new Date(),
    api: apiUp,
    mongo: mongoUp,
    imap: imapUp,
    ram: ramUsage,
    disk: diskUsage
  };
}

function alert(health: HealthCheck) {
  if (!health.api || !health.mongo || !health.imap || health.ram > 90 || health.disk > 90) {
    // Send alert (email, Slack, etc.)
    console.error('HEALTH CHECK FAILED:', health);
  }
}

// Run every 5 minutes
setInterval(async () => {
  const health = await healthCheck();
  fs.appendFileSync('/var/log/ementech-email/health.log', JSON.stringify(health) + '\n');
  alert(health);
}, 5 * 60 * 1000);
```

---

## Appendix

### A. Key Performance Indicators (KPIs)

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Email Delivery Time | < 2s | IMAP IDLE → Socket.IO emit |
| API Response Time | < 200ms | API middleware timing |
| Frontend Load Time | < 3s | Lighthouse performance |
| Socket.IO Latency | < 100ms | Ping time |
| Unread Count Accuracy | 100% | IMAP vs DB comparison |
| Search Response Time | < 500ms | MongoDB query timing |
| Concurrent Users | 5 → 100 | Socket.IO connections |
| RAM Usage | < 80% | System monitoring |
| Uptime | 99.9% | PM2 uptime monitoring |

### B. OpenAPI Specification Reference

See `api-spec.md` for complete OpenAPI 3.0 specification.

### C. Database Schema Reference

See `data-model.md` for complete MongoDB schema definitions.

### D. Component Hierarchy Reference

See `component-hierarchy.md` for detailed React component structure.

---

**End of System Architecture Document**

**Next Steps**:
1. Review `data-model.md` for database schema
2. Review `api-spec.md` for API specifications
3. Review `accessibility-guide.md` for WCAG 2.1 AA implementation
4. Proceed to implementation handoff package
