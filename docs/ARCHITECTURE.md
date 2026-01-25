# EmenTech Architecture

## System Overview

```
                           Internet
                              │
                              ▼
                    ┌─────────────────┐
                    │   Nginx (443)   │
                    │   SSL/TLS       │
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ ementech.co.ke  │ │ admin.ementech  │ │ mail.ementech   │
│ Main Frontend   │ │ Admin Frontend  │ │ Email Server    │
│ /var/www/       │ │ /var/www/       │ │ Postfix/Dovecot │
│ ementech-website│ │ admin-ementech  │ │                 │
└────────┬────────┘ └────────┬────────┘ └─────────────────┘
         │                   │
         └─────────┬─────────┘
                   ▼
         ┌─────────────────┐
         │  Backend :5001  │
         │  Express.js     │
         │  Socket.IO      │
         └────────┬────────┘
                  │
     ┌────────────┼────────────┐
     ▼            ▼            ▼
┌─────────┐ ┌─────────┐ ┌─────────┐
│ MongoDB │ │  Redis  │ │PostgreSQL│
│  Atlas  │ │ :6379   │ │  :5432  │
│ (cloud) │ │ (cache) │ │ (mail)  │
└─────────┘ └─────────┘ └─────────┘
```

---

## Frontend Architecture

### Tech Stack
- React 19 + TypeScript
- Vite (build tooling)
- TailwindCSS (styling)
- React Router v7
- Framer Motion (animations)
- Socket.IO Client

### Application Routes

| Route | Component | Access |
|-------|-----------|--------|
| `/` | HomePage | Public |
| `/products` | ProductsPage | Public |
| `/services` | ServicesPage | Public |
| `/about` | AboutPage | Public |
| `/contact` | ContactPage | Public |
| `/login` | LoginPage | Public |
| `/register` | RegisterPage | Public |
| `/profile` | ProfilePage | Protected |
| `/email` | EmailInbox | Protected |
| `/email/:folder` | EmailInbox | Protected |

### Context Providers
- `AuthProvider` - Authentication state
- `EmailProvider` - Email state & Socket.IO
- `LeadProvider` - Lead capture state

---

## Backend Architecture

### Tech Stack
- Node.js v20.20.0
- Express.js
- Socket.IO
- Mongoose ODM

### Middleware Stack
1. Helmet (security headers)
2. CORS (multi-origin)
3. JSON parser (10MB limit)
4. Compression (gzip)
5. Rate limiting
6. JWT authentication
7. RBAC (role-based access)
8. Error handling

### Directory Structure
```
backend/
├── src/
│   ├── server.js          # Entry point
│   ├── config/
│   │   ├── database.js    # MongoDB connection
│   │   └── socket.js      # Socket.IO handlers
│   ├── controllers/       # Route handlers
│   ├── models/            # Mongoose schemas
│   ├── routes/            # API routes
│   ├── middleware/        # Auth, RBAC, rate limiting
│   └── utils/             # Helper functions
├── ecosystem.config.cjs   # PM2 configuration
└── .env                   # Environment variables
```

---

## Data Models

### User
```javascript
{
  name: String,
  email: String (unique),
  password: String (bcrypt hashed),
  role: ['admin', 'manager', 'employee'],
  department: ['leadership', 'engineering', 'marketing', 'sales', 'support', 'hr'],
  isActive: Boolean
}
```

### Email
```javascript
{
  user: ObjectId,
  emailAccount: ObjectId,
  messageId: String,
  uid: Number,
  folder: String,
  from: { name, address },
  to: [{ name, address }],
  subject: String,
  textBody: String,
  htmlBody: String,
  isRead: Boolean,
  isFlagged: Boolean,
  labels: [ObjectId],
  date: Date
}
```

### Lead
```javascript
{
  email: String,
  name: String,
  company: String,
  profileStage: Number (1-4),
  leadScore: Number (0-120),
  source: String,
  engagement: { pageViews, timeOnSite, sessionCount },
  consentGiven: Boolean
}
```

---

## Email System

### Flow Diagram
```
INBOUND:
Internet → :25 → Postfix → Rspamd → Dovecot LMTP → /var/mail/vhosts

OUTBOUND:
Client → :587 → Dovecot Auth → Postfix → OpenDKIM → Internet
```

### Components
| Component | Version | Purpose |
|-----------|---------|---------|
| Postfix | 3.8.6 | MTA (SMTP) |
| Dovecot | 2.3.21 | MDA (IMAP/POP3) |
| OpenDKIM | - | DKIM signing |
| Rspamd | - | Spam filter |
| SpamAssassin | - | Spam filter |

### Ports
| Port | Protocol | Service |
|------|----------|---------|
| 25 | SMTP | Inbound mail |
| 587 | SMTP | Submission |
| 993 | IMAPS | IMAP over SSL |
| 995 | POP3S | POP3 over SSL |

---

## Authentication

### JWT Strategy
- Tokens stored in HTTP-only cookies
- Expiration: 7 days
- Refresh token support

### Role Permissions
| Role | Permissions |
|------|-------------|
| admin | Full access |
| manager | Leads, analytics, content |
| employee | Basic access |

### Rate Limits
| Limiter | Limit |
|---------|-------|
| API | 100 req/15min |
| Lead creation | 5 req/min |
| Chat | 20 req/min |
| Downloads | 10 req/min |

---

## Lead Scoring Algorithm

| Factor | Points |
|--------|--------|
| Profile completeness | 20 |
| Job title seniority | 15 |
| Company size | 10 |
| Budget | 20 |
| Timeline urgency | 15 |
| Engagement level | 20 |
| Decision maker | 10 |
| Source quality | 10 |
| **Maximum** | **~120** |

---

## Real-time Events (Socket.IO)

| Event | Direction | Description |
|-------|-----------|-------------|
| `email:new` | Server→Client | New email received |
| `email:sync` | Server→Client | Sync progress |
| `email:read` | Server→Client | Read status updated |
| `chat:message` | Bidirectional | Chat messages |
