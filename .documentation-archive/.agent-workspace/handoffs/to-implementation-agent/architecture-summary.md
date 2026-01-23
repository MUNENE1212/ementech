# EmenTech Email System - Architecture Summary

**For**: Implementation Agent  
**Date**: January 19, 2026  
**Reading Time**: 10 minutes

---

## System Overview

**What We're Building**: Real-time email client with IMAP IDLE push notifications  
**Users**: 5-100 users (scalable architecture)  
**Platform**: Web (mobile-responsive)  
**Timeline**: 3 weeks

---

## Architecture Pattern

```
[React Frontend] ←→ [Socket.IO Client]
        ↓                   ↓
   (HTTPS/WSS)         (WSS)
        ↓                   ↓
    [nginx] ←→ [Express API + Socket.IO Server]
                      ↓
              ┌─────────┴─────────┐
              ↓                   ↓
        [MongoDB]          [IMAP Monitor Daemon]
                                  ↓
                          [Dovecot IMAP Server]
```

**Key Point**: IMAP Monitor Daemon watches for new emails via IMAP IDLE and pushes them to clients via Socket.IO.

---

## Technology Stack (Final)

### Frontend
| Component | Technology | Why |
|-----------|-----------|-----|
| Framework | React 19.2 | Latest, proven, excellent hooks |
| State | Zustand 5.0 | Lightweight (3KB), simple, TypeScript-first |
| Routing | React Router 7.12 | Data loading, accessible |
| UI Kit | Radix UI | Unstyled accessible primitives (WCAG ready) |
| Styling | Tailwind CSS 3.4 | Consistent with existing EmenTech apps |
| Real-Time | Socket.IO Client 4.7 | Auto-reconnect, proven |
| Forms | React Hook Form 7.51 | Minimal re-renders, accessible |
| Validation | Zod 3.22 | TypeScript runtime validation |
| Rich Text | Tiptap 2.2 | Extensible, accessible |
| Build | Vite 7.2 | Fast HMR, optimized builds |

### Backend
| Component | Technology | Why |
|-----------|-----------|-----|
| Runtime | Node.js 20.11 LTS | Long-term support |
| Framework | Express 4.19 | Minimal, flexible |
| Real-Time | Socket.IO 4.7 | Proven, scalable |
| Database | MongoDB 7.0 | Flexible schema, email-friendly |
| ODM | Mongoose 8.4 | Validation, middleware, TypeScript |
| IMAP | node-imap 0.8.9 | Stable, IDLE support |
| Auth | JWT | Stateless, industry standard |
| Password | bcrypt 5.1 | Proven hashing |

---

## Real-Time Flow (Critical)

### 1. Incoming Email (Real-Time)
```
[External Sender] → [Postfix] → [Dovecot]
                                        ↓
                                  [Maildir storage]
                                        ↓
                             [IMAP IDLE push]
                                        ↓
                         [IMAP Monitor Daemon]
                                        ↓
                         [Fetch + Parse + Store]
                                        ↓
                              [MongoDB]
                                        ↓
                         [Socket.IO emit]
                                        ↓
                         [Client Browser]
                                        ↓
                         [UI Updates + Notification]
```

**Time**: < 2 seconds from Dovecot to UI

### 2. Socket.IO Events
```typescript
// Server → Client
io.to(`user:${userId}`).emit('email:new', email);

// Client receives
socket.on('email:new', (email) => {
  // Update Zustand store
  // Show desktop notification
  // Update unread count
});
```

---

## Database Schema (Quick Reference)

### Key Collections
1. **Emails**: Messages with headers, body, attachments
2. **Folders**: INBOX, Sent, Drafts, etc.
3. **Labels**: User tags
4. **Contacts**: CRM data
5. **Users**: Accounts + preferences
6. **Notifications**: Notification history
7. **Analytics**: Aggregated metrics

### Critical Indexes
```javascript
// Email lookups (most common)
{ userId: 1, folderId: 1, receivedAt: -1 }
{ userId: 1, isRead: 1, receivedAt: -1 }

// Search
{ subject: 'text', plainTextBody: 'text' }

// Contacts (case-insensitive)
{ userId: 1, emailLower: 1 }
```

---

## Component Structure

### Frontend File Tree
```
src/
├── components/
│   ├── ui/                 # Button, Input, etc. (Radix UI)
│   ├── email/              # EmailList, EmailView, EmailComposer
│   ├── contacts/           # ContactList, ContactForm
│   └── shared/             # Layout, Header, Sidebar
├── pages/                  # InboxPage, SentPage, etc.
├── stores/                 # authStore, emailStore, etc.
├── hooks/                  # useEmail, useContacts
├── utils/                  # helpers, formatters
└── types/                  # TypeScript types
```

### Backend File Tree
```
src/
├── config/                 # database.ts, socket.ts, imap.ts
├── models/                 # Mongoose schemas
├── routes/                 # Express routes
├── services/               # Business logic
├── middleware/             # auth, validation, errors
├── socket/                 # Socket.IO handlers
└── workers/                # ImapMonitorDaemon
```

---

## Implementation Priority

### Week 1: Foundation
1. **Project Setup**
   - Initialize React + Vite
   - Initialize Express + TypeScript
   - Connect to MongoDB
   - Set up PM2 ecosystem

2. **Authentication**
   - JWT login/logout
   - Protected routes
   - User model + schema

3. **IMAP Integration**
   - node-imap connection
   - Fetch emails test
   - Store in MongoDB

### Week 2: Core Features
1. **Email CRUD**
   - List emails (paginated)
   - View single email
   - Compose/send email
   - Delete/archive email

2. **Real-Time**
   - Socket.IO server setup
   - IMAP IDLE monitor daemon
   - Push to clients
   - Desktop notifications

3. **UI Components**
   - Email list with virtualization
   - Email detail view
   - Composer with rich text
   - Folder navigation

### Week 3: Polish
1. **Search & Filter**
   - Full-text search
   - Advanced filters
   - Labels/tags

2. **Contacts**
   - Contact CRUD
   - Auto-add from emails
   - Import/export

3. **Accessibility**
   - WCAG 2.1 AA compliance
   - Keyboard navigation
   - Screen reader testing
   - Lighthouse audit (target: 85+)

4. **Performance**
   - Code splitting
   - Lazy loading
   - Response caching
   - Load testing

---

## Critical Implementation Details

### 1. IMAP Monitor Daemon (Background Process)
```typescript
// workers/ImapMonitorDaemon.ts
class ImapMonitorDaemon {
  async start() {
    const imap = await Imap.connect({
      user: process.env.IMAP_USER,
      password: process.env.IMAP_PASSWORD,
      host: 'localhost',
      port: 993,
      tls: true
    });

    await imap.openBox('INBOX', false);
    
    imap.on('update', async () => {
      // Fetch new emails
      // Store in MongoDB
      // Emit Socket.IO event
    });

    imap.idle(); // Start IDLE mode
  }
}
```

**Run with PM2**: Separate process from API server

### 2. Socket.IO Authentication
```typescript
// Server
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  const decoded = jwt.verify(token, JWT_SECRET);
  socket.data.userId = decoded.sub;
  next();
});

io.on('connection', (socket) => {
  const userId = socket.data.userId;
  socket.join(`user:${userId}`);
});

// Client
const socket = io(API_URL, {
  auth: { token: localStorage.getItem('token') }
});
```

### 3. Email Pagination (Performance)
```typescript
// API Route
app.get('/api/emails', async (req, res) => {
  const { page = 1, limit = 25 } = req.query;
  
  const emails = await Email.find({ 
    userId: req.user._id,
    folderId: req.query.folderId,
    isDeleted: false 
  })
  .sort({ receivedAt: -1 })
  .skip((page - 1) * limit)
  .limit(limit)
  .lean(); // Faster, no Mongoose overhead
  
  res.json({ emails, page, limit });
});
```

### 4. Full-Text Search
```typescript
// MongoDB text index
EmailSchema.index({ 
  subject: 'text', 
  plainTextBody: 'text',
  'from.name': 'text'
});

// Search query
const results = await Email.find(
  { $text: { $search: searchQuery } },
  { score: { $meta: 'textScore' } }
).sort({ score: { $meta: 'textScore' } });
```

---

## Performance Targets

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Email delivery | < 2s | Timestamp from IMAP to Socket.IO emit |
| API response | < 200ms | API middleware timing |
| Page load | < 3s | Lighthouse performance |
| Accessibility | ≥ 85 | Lighthouse accessibility score |
| Socket.IO latency | < 100ms | Ping time |
| Concurrent users | 5 → 100 | Socket.IO connections |

---

## Accessibility (WCAG 2.1 AA)

### Must-Have
1. **Keyboard Navigation**: All features work without mouse
2. **ARIA Labels**: All interactive elements labeled
3. **Focus Indicators**: Visible focus on all controls
4. **Color Contrast**: 4.5:1 minimum
5. **Screen Reader**: Test with NVDA/VoiceOver
6. **Form Errors**: Announced to screen readers

### Testing
```bash
# Run Lighthouse CI
npm install -g @lhci/cli
lhci autorun --collect.url=http://localhost:3000

# Target scores
# Performance: ≥ 75
# Accessibility: ≥ 85
# Best Practices: ≥ 90
# SEO: ≥ 80
```

---

## Security Checklist

- [ ] JWT with 32+ character secret
- [ ] bcrypt (cost factor 10+)
- [ ] Input validation (Zod schemas)
- [ ] Rate limiting (100 req/15min)
- [ ] CORS configured
- [ ] IMAP credentials encrypted
- [ ] Helmet.js security headers
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS protection (sanitize input)
- [ ] CSRF tokens (state-changing operations)

---

## Environment Variables (Required)

```bash
# API
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://mail.ementech.co.ke

# MongoDB
MONGO_URI=mongodb://localhost:27017/ementech_email

# JWT
JWT_SECRET=<32-character random string>
JWT_EXPIRES_IN=7d

# IMAP
IMAP_HOST=localhost
IMAP_PORT=993
IMAP_USER=%s@ementech.co.ke
IMAP_PASSWORD=<secure password>

# Socket.IO
SOCKET_IO_CORS_ORIGIN=https://mail.ementech.co.ke
```

---

## Deployment Steps

### 1. Backend
```bash
cd /var/www/ementech-email/backend
npm install
npm run build
pm2 start ecosystem.config.js --env production
```

### 2. Frontend
```bash
cd /var/www/ementech-email/frontend
npm install
npm run build
# Output: /var/www/ementech-email/frontend/dist
```

### 3. nginx
```nginx
server {
    listen 443 ssl http2;
    server_name mail.ementech.co.ke;

    # React app
    location / {
        root /var/www/ementech-email/frontend/dist;
        try_files $uri /index.html;
    }

    # API proxy
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Socket.IO proxy
    location /socket.io/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 4. PM2 Ecosystem
```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'email-api',
      script: './dist/server.js',
      instances: 1,
      exec_mode: 'fork',
      env: { NODE_ENV: 'production', PORT: 3001 },
      max_memory_restart: '500M'
    },
    {
      name: 'email-worker',
      script: './dist/workers/ImapMonitorDaemon.js',
      autorestart: true
    }
  ]
};
```

---

## Success Criteria (Go/No-Go)

### Must Achieve
- [ ] Zero critical bugs
- [ ] < 5 high-priority bugs
- [ ] Lighthouse accessibility ≥ 85
- [ ] Lighthouse performance ≥ 75
- [ ] All tests passing (80%+ coverage)
- [ ] UAT approved
- [ ] Delivered in 3 weeks

### Should Achieve
- [ ] < 2s real-time email delivery
- [ ] 100 concurrent users supported
- [ ] Zero security vulnerabilities
- [ ] 4/5+ user satisfaction

---

## Quick Command Reference

```bash
# Start development
npm run dev          # Frontend (Vite)
npm run dev:api      # Backend (nodemon)

# Build for production
npm run build        # Frontend
npm run build:api    # Backend

# Database
mongosh             # MongoDB shell
mongodump --db=ementech_email  # Backup

# PM2
pm2 start ecosystem.config.js
pm2 logs
pm2 monit

# SSL
certbot --nginx -d mail.ementech.co.ke
```

---

## Common Issues & Solutions

### Issue 1: IMAP Connection Timeout
**Solution**: Increase timeout in imap config
```typescript
connTimeout: 10000, // 10 seconds
authTimeout: 5000
```

### Issue 2: Socket.IO Not Reconnecting
**Solution**: Add reconnection options
```typescript
const socket = io(API_URL, {
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
});
```

### Issue 3: High Memory Usage
**Solution**: Enable lean queries and limit results
```typescript
Email.find({}).lean().limit(1000)
```

---

## Resources

### Documentation
- `.agent-workspace/shared-context/architecture.md` - Full architecture
- `.agent-workspace/shared-context/data-model.md` - Database schemas
- `.agent-workspace/shared-context/INDEX.md` - Document index

### External Resources
- Socket.IO docs: https://socket.io/docs/
- node-imap: https://github.com/mscdex/node-imap
- Radix UI: https://www.radix-ui.com/
- Zustand: https://zustand-demo.pmnd.rs/

---

**You have everything you need. Start with project setup, then authentication, then IMAP integration. The rest will follow naturally. Good luck!** 🚀
