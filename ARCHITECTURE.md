# EmenTech Website Architecture

**Last Updated**: 2026-01-20
**Status**: Production Live at ementech.co.ke

## Overview

Full-stack MERN application for EmenTech business website with integrated email system, lead capture, and AI chatbot.

**Tech Stack**:
- Frontend: React 19 + TypeScript + Vite + TailwindCSS
- Backend: Node.js + Express.js
- Database: MongoDB (Mongoose ODM)
- Real-time: Socket.IO
- Email: IMAP/SMTP via nodemailer + imap libraries
- Deployment: VPS (Ubuntu), PM2, Nginx, Let's Encrypt SSL

---

## Frontend Architecture

### Core Framework
- **React 19** with TypeScript
- **Vite** for build tooling
- **React Router v7** for navigation
- **Framer Motion** for animations
- **TailwindCSS** for styling

### Key Libraries
```json
{
  "react": "^19.2.0",
  "react-router-dom": "^7.12.0",
  "framer-motion": "^12.26.2",
  "axios": "^1.13.2",
  "socket.io-client": "^4.8.3",
  "date-fns": "^4.1.0",
  "lucide-react": "^0.562.0"
}
```

### Application Structure

**Routes** (src/App.tsx):
- `/` - HomePage (public)
- `/products` - ProductsPage (public)
- `/services` - ServicesPage (public)
- `/about` - AboutPage (public)
- `/contact` - ContactPage (public)
- `/careers` - CareersPage (public)
- `/terms` - TermsPage (public)
- `/privacy` - PrivacyPage (public)
- `/login` - LoginPage (public)
- `/register` - RegisterPage (public)
- `/profile` - ProfilePage (protected)
- `/settings` - SettingsPage (protected)
- `/email` - EmailInbox (protected)
- `/email/:folder` - EmailInbox with folder (protected)
- `/*` - NotFoundPage

**Context Providers**:
- `AuthProvider` - Authentication state (src/contexts/AuthContext.jsx)
- `EmailProvider` - Email state & Socket.IO (src/contexts/EmailContext.jsx)
- `LeadProvider` - Lead capture state (src/contexts/LeadContext.jsx)

**Services** (src/services/):
- `authService.js` - Login, register, profile management
- `emailService.js` - Email CRUD, sync, labels, folders
- `leadService.js` - Lead capture, progressive profiling
- `chatService.js` - AI chatbot integration

**Components**:
- `layout/Header.tsx` - Navigation with auth state
- `layout/Footer.tsx` - Site footer
- `sections/Hero/` - Hero section with animations
- `sections/Products.tsx` - Products showcase
- `sections/Services.tsx` - Services showcase
- `sections/About.tsx` - About section
- `sections/Contact.tsx` - Contact form
- `email/` - Full email client UI
- `chat/` - AI chatbot widget
- `lead-capture/` - Exit intent popups, forms
- `auth/` - ProtectedRoute component

---

## Backend Architecture

### Core Framework
- **Node.js** with ES modules
- **Express.js** REST API
- **Socket.IO** for real-time email updates
- **Mongoose** for MongoDB ODM

### Dependencies
```json
{
  "express": "^4.19.2",
  "mongoose": "^8.0.0",
  "socket.io": "^4.7.5",
  "nodemailer": "^6.9.13",
  "imap": "^0.8.19",
  "mailparser": "^3.6.6",
  "openai": "^6.16.0",
  "helmet": "^7.1.0",
  "cors": "^2.8.5",
  "express-rate-limit": "^7.1.5"
}
```

### Server Configuration

**Entry Point**: backend/src/server.js

**Middleware**:
1. Helmet (security headers)
2. CORS (multi-origin support)
3. Express JSON (10MB limit)
4. Compression (gzip)
5. Request logging
6. Rate limiting (multiple limiters)
7. Authentication (JWT)
8. Role-based access control (RBAC)
9. Error handling

**Socket.IO Setup**:
- CORS enabled for frontend origins
- Ping timeout: 60s
- Ping interval: 25s
- Real-time email sync events
- Chatbot message handling

### API Routes

**Base URL**: `/api`

**Public Routes**:
- `GET /api/health` - Health check
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/leads` - Create lead (public capture)
- `POST /api/leads/:id/unsubscribe` - Unsubscribe from marketing

**Protected Routes** (require JWT):

Email Management (`/api/email`):
- `GET /` - Fetch emails
- `POST /sync/:folder?` - Sync emails from IMAP
- `GET /:id` - Get single email
- `POST /send` - Send email
- `PUT /:id/read` - Mark read/unread
- `PUT /:id/flag` - Toggle flag
- `PUT /:id/folder` - Move to folder
- `DELETE /:id` - Delete email
- `GET /search` - Search emails
- `GET /folders/list` - Get folders
- `GET /folders/unread-count` - Unread count
- `GET /labels/list` - Get labels
- `POST /labels` - Create label
- `PUT /:id/labels/:labelId` - Add label
- `DELETE /:id/labels/:labelId` - Remove label
- `GET /contacts/list` - Get contacts
- `POST /contacts` - Create contact

Lead Management (`/api/leads`):
- `GET /` - Get all leads (admin/manager)
- `GET /statistics` - Lead statistics (admin/manager)
- `GET /qualified` - Get qualified leads (admin/manager)
- `POST /score` - Recalculate scores (admin/manager)
- `GET /:id` - Get lead by ID
- `PUT /:id` - Update lead
- `DELETE /:id` - Delete lead
- `POST /:id/convert` - Convert to opportunity
- `POST /:id/notes` - Add note to lead

Content Management (`/api/content`):
- Blog posts, pages, media management
- CRUD operations for content

Analytics (`/api/analytics`):
- `GET /dashboard` - Dashboard analytics
- `GET /funnel` - Conversion funnel
- `GET /sources` - Traffic sources
- `POST /track` - Track custom events

### Data Models

**User** (models/User.js):
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: ['admin', 'manager', 'employee'],
  department: ['leadership', 'engineering', 'marketing', 'sales', 'support', 'hr'],
  isActive: Boolean
}
```

**Lead** (models/Lead.js):
- Contact: email, name, phone, company, jobTitle
- Progressive Profiling: profileStage (1-4), companySize, industry, budget, timeline
- Lead Scoring: leadScore (0-100+), status, priority
- Source Tracking: source, campaign, UTM parameters
- Engagement: pageViews, timeOnSite, sessionCount, lastActivity
- GDPR: consentGiven, marketingConsent, unsubscribed
- Custom Fields & Inferred Data

**Email** (models/Email.js):
- user, emailAccount, messageId, uid
- folder, threadId
- from, to, cc, bcc, replyTo
- subject, textBody, htmlBody
- isRead, isFlagged, hasAttachments, labels
- date, sentDate, syncStatus
- Full-text search indexed

**Conversation** (models/Conversation.js):
- AI chatbot conversations
- Messages, context, metadata

**Interaction** (models/Interaction.js):
- User interactions for analytics
- Page views, clicks, time on page

**Analytics** (models/Analytics.js):
- Daily aggregated analytics
- Funnel data, sources, conversions

### Authentication & Authorization

**JWT Strategy**:
- Token stored in HTTP-only cookies
- Refresh token support
- Token expiration: 7 days

**Roles**:
- `admin` - Full access
- `manager` - Leads, analytics, content
- `employee` - Basic access

**Middleware** (src/middleware/):
- `auth.js` - JWT verification
- `rbac.js` - Role-based access control
- `rateLimiter.js` - Multiple rate limiters:
  - apiLimiter (100 req/15min)
  - leadCreationLimiter (5 req/min)
  - chatLimiter (20 req/min)
  - downloadLimiter (10 req/min)
- `validation.js` - Request validation using express-validator

---

## Email System Architecture

### IMAP Integration
- Library: `imap` v0.8.19
- Real-time email synchronization
- Folder management (INBOX, Sent, Drafts, Trash, Spam, Archive)
- Email parsing with `mailparser`

### SMTP Integration
- Library: `nodemailer` v6.9.13
- Email sending with attachments
- Transport configuration via environment variables

### Socket.IO Events
- `email:new` - New email received
- `email:sync` - Email sync progress
- `email:read` - Email read status updated
- `email:folder` - Email moved to folder

### Email Features Implemented
- Fetch emails from IMAP
- Sync emails to database
- Send emails via SMTP
- Mark read/unread
- Flag/star emails
- Move to folders
- Soft delete
- Search emails (full-text)
- Label management
- Contact management
- Unread counts per folder

---

## Lead Capture System

### Lead Sources
- Newsletter signup
- Event registration
- Survey responses
- Offer downloads
- Meetup registration
- Contact form
- Content downloads
- Chatbot interactions
- Referrals

### Progressive Profiling
- Profile Stages:
  1. Anonymous (email only)
  2. Identified (name, company)
  3. Qualified (budget, timeline)
  4. Opportunity (ready to convert)

### Lead Scoring Algorithm
- Profile completeness (20 points)
- Job title seniority (15 points)
- Company size (10 points)
- Budget (20 points)
- Timeline urgency (15 points)
- Engagement level (20 points)
- Decision maker bonus (10 points)
- Source quality (10 points)
- **Maximum: ~120 points**

### Implemented Features
- Lead creation from multiple sources
- Automatic lead scoring
- Profile stage updates
- Lead statistics dashboard
- Qualified leads filtering
- Unsubscribe management
- GDPR compliance tracking
- Notes & interactions
- Conversion tracking

---

## AI Chatbot

### Implementation
- OpenAI API integration (currently disabled - needs API key)
- React component: src/components/chat/
- Backend controller: controllers/chatController.js
- Socket.IO for real-time messaging

### Status
- Code implemented but commented out in server.js (line 89, 100)
- Requires valid OPENAI_API_KEY environment variable

---

## Database Schema

**Collections** (33 models defined):
1. User - Authentication & users
2. Lead - Lead management
3. Email - Email storage
4. Conversation - AI chatbot conversations
5. Interaction - User interactions
6. Analytics - Aggregated analytics
7. Content - CMS content
8. Event - Events tracking
9. Message - Chat messages
10. Newsletter - Newsletter management
11. UserEmail - Email accounts
12. Label - Email labels
13. Folder - Email folders
14. Contact - Email contacts
15. AIConversation - AI conversations
16. Analytics - Daily analytics
17. Plus 16 more models (Booking, CategoryRequest, DiagnosticFlow, FAQ, Matching, MatchingInteraction, MatchingPreference, Notification, Portfolio, Post, PricingConfig, Review, ServiceCategory, ServicePricing, SupportTicket, Transaction)

**Indexes**:
- All models have appropriate indexes for query performance
- Compound indexes for common queries
- Full-text search on emails
- TTL indexes for data retention

---

## Deployment Architecture

### Server Details
- **VPS**: Ubuntu Linux 6.14.0-37-generic
- **IP**: 69.164.244.165
- **Domain**: ementech.co.ke, www.ementech.co.ke

### Process Management (PM2)
**Running Processes**:
```
ID  Name                Status  CPU    Memory
0   dumuwaks-backend    online  0%     102.1mb
1   ementech-backend    online  0%     92.2mb
```

### Directory Structure
```
/var/www/
├── ementech-website/
│   ├── backend/           # Backend app (PM2: ementech-backend)
│   │   └── src/
│   │       ├── server.js
│   │       ├── config/
│   │       ├── controllers/
│   │       ├── models/
│   │       ├── routes/
│   │       ├── middleware/
│   │       └── utils/
│   └── current/           # Frontend build (served by nginx)
│       ├── index.html
│       └── assets/
└── dumuwaks-backend/      # Separate project
    └── dumuwaks-frontend/
```

### Nginx Configuration
**Site**: ementech.co.ke

**SSL**: Let's Encrypt certificates

**Upstreams**:
- Frontend: Static files from `/var/www/ementech-website/current`
- Backend API: `http://localhost:5001`
- Socket.IO: Proxied to backend on `/socket.io/`

**Proxy Settings**:
- HTTP/1.1
- WebSocket upgrade enabled
- Real IP forwarding
- Protocol forwarding (HTTPS)

---

## Environment Variables Required

**Backend** (.env):
```bash
PORT=5001
NODE_ENV=production
MONGODB_URI=mongodb://...
CORS_ORIGIN=https://ementech.co.ke,https://www.ementech.co.ke

# JWT
JWT_SECRET=...
JWT_EXPIRE=7d

# Email (IMAP)
IMAP_HOST=...
IMAP_PORT=993
IMAP_USER=...
IMAP_PASSWORD=...
IMAP_TLS=true

# Email (SMTP)
SMTP_HOST=...
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=...
SMTP_PASSWORD=...

# OpenAI (currently disabled)
OPENAI_API_KEY=...
```

---

## Current Implementation Status

### ✅ Fully Implemented & Working
- Website frontend (all public pages)
- User authentication (login, register, JWT)
- Email system (IMAP sync, SMTP send, folders, labels)
- Lead capture (all sources, progressive profiling, scoring)
- Analytics dashboard (funnel, sources, daily stats)
- Real-time updates via Socket.IO
- Rate limiting & security
- Responsive design with animations
- SEO optimization (meta tags, sitemap, robots.txt)

### ⚠️ Implemented But Disabled
- AI Chatbot (code exists, needs OpenAI API key)
- Advanced content management (models defined, routes implemented)

### 🚧 Partially Implemented
- Admin dashboard (separate project in admin-dashboard/)
- Advanced analytics (basic implemented, could be expanded)
- Email templates (basic implemented, could be enhanced)

### ❌ Not Implemented
- Payment processing
- User profile customization
- Advanced reporting
- Multi-language support
- Mobile apps

---

## File Structure Reference

```
ementech-website/
├── backend/                    # Express.js API
│   ├── src/
│   │   ├── server.js          # Entry point
│   │   ├── config/            # Database, Socket.IO
│   │   ├── controllers/       # Route handlers
│   │   ├── models/            # Mongoose schemas (33 models)
│   │   ├── routes/            # API routes (6 route files)
│   │   ├── middleware/        # Auth, RBAC, rate limiting
│   │   └── utils/             # Helper functions
│   ├── package.json
│   └── .env                   # Environment variables
│
├── src/                        # React frontend
│   ├── main.tsx               # Entry point
│   ├── App.tsx                # Routes & providers
│   ├── pages/                 # Page components (14 pages)
│   ├── components/            # Reusable components
│   │   ├── layout/            # Header, Footer
│   │   ├── sections/          # Hero, Products, Services
│   │   ├── email/             # Email client UI
│   │   ├── chat/              # AI chatbot
│   │   ├── lead-capture/      # Exit intent, forms
│   │   └── auth/              # ProtectedRoute
│   ├── contexts/              # React contexts (3)
│   ├── services/              # API services (4)
│   ├── styles/                # Global styles
│   └── types.d.ts             # TypeScript types
│
├── public/                     # Static assets
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json

├── admin-dashboard/            # Separate admin project
│   ├── backend/               # Admin API
│   └── frontend/              # Admin UI
│
└── deployment/                 # Deployment scripts & docs
```

---

## API Endpoints Quick Reference

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `POST /api/auth/change-password` - Change password

### Email
- `GET /api/email` - List emails
- `GET /api/email/:id` - Get email
- `POST /api/email/send` - Send email
- `POST /api/email/sync` - Sync from IMAP
- `PUT /api/email/:id/read` - Mark read
- `DELETE /api/email/:id` - Delete email

### Leads
- `POST /api/leads` - Create lead (public)
- `GET /api/leads` - List leads (admin)
- `GET /api/leads/statistics` - Stats (admin)
- `PUT /api/leads/:id` - Update lead (admin)

### Analytics
- `GET /api/analytics/dashboard` - Dashboard data (admin)
- `GET /api/analytics/funnel` - Conversion funnel (admin)
- `GET /api/analytics/sources` - Traffic sources (admin)

---

## Key Features Summary

1. **Business Website** - Modern, animated company site
2. **Email Client** - Full Gmail-like email interface
3. **Lead Management** - Capture, score, and nurture leads
4. **Analytics Dashboard** - Track visitors, conversions, sources
5. **AI Chatbot** - Intelligent customer support (disabled)
6. **Real-time Updates** - Socket.IO for live data
7. **Responsive Design** - Mobile-first approach
8. **SEO Optimized** - Meta tags, sitemap, robots.txt
9. **Secure** - JWT auth, rate limiting, CORS, helmet
10. **Production Ready** - Deployed and live at ementech.co.ke

---

**Documentation Based On**: Actual code inspection, not assumptions
