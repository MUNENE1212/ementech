# EmenTech Complete System Architecture

**Version**: 2.0
**Last Updated**: 2026-01-21
**Status**: Production Live with Local Development Requirements
**Architecture Team**: System Architecture Review

---

## Executive Summary

EmenTech operates a multi-service technology ecosystem built on the MERN stack (MongoDB, Express.js, React, Node.js) with real-time capabilities via Socket.IO. The system comprises three distinct applications:

1. **Corporate Website** (https://ementech.co.ke) - React 19 + Node.js
2. **Job Marketplace** (https://dumuwaks.ementech.co.ke) - React 18 + Node.js
3. **API Backend** (https://api.ementech.co.ke) - Shared Node.js infrastructure

This document provides a comprehensive architecture review designed to support local development, UI/UX design, and frontend implementation for the email and lead management systems.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture Patterns](#architecture-patterns)
4. [Service Architecture](#service-architecture)
5. [Data Flow Architecture](#data-flow-architecture)
6. [Authentication & Authorization](#authentication--authorization)
7. [Real-time Communication](#real-time-communication)
8. [Email System Architecture](#email-system-architecture)
9. [Lead Management Architecture](#lead-management-architecture)
10. [API Architecture](#api-architecture)
11. [Security Architecture](#security-architecture)
12. [Development vs Production](#development-vs-production)
13. [Deployment Architecture](#deployment-architecture)

---

## 1. System Overview

### 1.1 Multi-Application Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      EmenTech Ecosystem                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│  │  Corporate Site  │  │  Job Marketplace  │  │  API Backend  │ │
│  │  ementech.co.ke  │  │ dumuwaks.ementech │  │api.ementech  │ │
│  │                  │  │                   │  │              │ │
│  │  React 19        │  │  React 18         │  │  Node.js     │ │
│  │  Vite Build      │  │  Vite Build       │  │  Express.js  │ │
│  │  Static Files    │  │  Static Files     │  │  REST API    │ │
│  └────────┬─────────┘  └────────┬──────────┘  └──────┬───────┘ │
│           │                     │                     │         │
│           └─────────────────────┴─────────────────────┘         │
│                                 │                               │
│                                 ▼                               │
│                   ┌─────────────────────────┐                   │
│                   │   Shared Infrastructure  │                   │
│                   │   - MongoDB Atlas       │                   │
│                   │   - Socket.IO           │                   │
│                   │   - Email System        │                   │
│                   │   - PM2 Process Manager │                   │
│                   └─────────────────────────┘                   │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Server Infrastructure

**VPS Details**:
- **Provider**: Linode (assumed based on IP range)
- **OS**: Ubuntu 22.04 (Linux 6.14.0-37-generic)
- **IP Address**: 69.164.244.165
- **Domains**: ementech.co.ke, www.ementech.co.ke, dumuwaks.ementech.co.ke

**Process Management**:
- **PM2** running 2 processes:
  - `dumuwaks-backend` - Job marketplace API (102.1 MB)
  - `ementech-backend` - Corporate site API (92.2 MB)

**Web Server**:
- **Nginx** reverse proxy handling:
  - SSL/TLS termination (Let's Encrypt)
  - Static file serving
  - API proxying
  - WebSocket upgrade handling
  - Load balancing (future-ready)

### 1.3 Database Architecture

**MongoDB Atlas** (Cloud-hosted):
- **33 Collections/Models** defined
- **Connection**: Mongoose ODM
- **Indexes**: Compound, text search, TTL
- **Replication**: MongoDB Atlas replica sets
- **Backups**: Atlas automated backups

---

## 2. Technology Stack

### 2.1 Frontend Stack

**Corporate Website** (ementech.co.ke):
```json
{
  "framework": "React 19.2.0",
  "language": "TypeScript 5.9.3",
  "build_tool": "Vite 7.2.4",
  "routing": "React Router DOM 7.12.0",
  "styling": "TailwindCSS 3.4.19",
  "animations": "Framer Motion 12.26.2",
  "icons": "Lucide React 0.562.0, React Icons 5.5.0",
  "http": "Axios 1.13.2",
  "realtime": "Socket.IO Client 4.8.3",
  "dates": "date-fns 4.1.0",
  "email": "@emailjs/browser 4.4.1"
}
```

**Job Marketplace** (dumuwaks.ementech.co.ke):
```json
{
  "framework": "React 18.x",
  "build_tool": "Vite",
  "styling": "TailwindCSS",
  "state_management": "React Context",
  "routing": "React Router"
}
```

### 2.2 Backend Stack

**Shared Backend** (api.ementech.co.ke):
```json
{
  "runtime": "Node.js (ES Modules)",
  "framework": "Express.js 4.19.2",
  "database": "MongoDB via Mongoose 8.0.0",
  "realtime": "Socket.IO 4.7.5",
  "email": {
    "imap": "imap 0.8.19",
    "smtp": "nodemailer 6.9.13",
    "parser": "mailparser 3.6.6"
  },
  "auth": {
    "jwt": "jsonwebtoken 9.0.2",
    "hashing": "bcryptjs 2.4.3"
  },
  "ai": "OpenAI 6.16.0 (disabled)",
  "security": {
    "helmet": "7.1.0",
    "cors": "2.8.5",
    "rate_limiting": "express-rate-limit 7.1.5",
    "validation": "express-validator 7.0.1"
  },
  "compression": "compression 1.7.4",
  "utils": {
    "dotenv": "16.4.5",
    "axios": "1.13.2",
    "date-fns": "4.1.0"
  }
}
```

### 2.3 Development Tools

**Build & Development**:
- Vite (HMR, optimized builds)
- TypeScript (type safety)
- ESLint (code quality)
- PostCSS + Autoprefixer (CSS processing)

**Deployment**:
- PM2 (process management)
- Nginx (reverse proxy)
- Let's Encrypt (SSL/TLS)
- Git (version control)

---

## 3. Architecture Patterns

### 3.1 Overall Pattern: Multi-Application with Shared Backend

The system follows a **hybrid microservices pattern**:

```
┌──────────────────────────────────────────────────────────────┐
│                   Pattern: API Gateway + Services            │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Frontend Layer (3 separate apps)                           │
│  ├─ Corporate Website (React 19)                            │
│  ├─ Job Marketplace (React 18)                              │
│  └─ Admin Dashboard (Future)                                │
│                    │                                         │
│                    ▼                                         │
│  API Gateway Layer (Nginx)                                  │
│  ├─ SSL Termination                                         │
│  ├─ Request Routing                                         │
│  ├─ WebSocket Upgrade                                       │
│  └─ Static File Serving                                     │
│                    │                                         │
│                    ▼                                         │
│  Application Layer (2 Node.js processes)                    │
│  ├─ ementech-backend (Corporate API)                        │
│  └─ dumuwaks-backend (Marketplace API)                      │
│                    │                                         │
│                    ▼                                         │
│  Service Layer                                              │
│  ├─ Email Service (IMAP/SMTP)                               │
│  ├─ Lead Service (Capture & Scoring)                        │
│  ├─ Analytics Service                                       │
│  ├─ Chatbot Service (OpenAI - disabled)                     │
│  └─ Content Management Service                              │
│                    │                                         │
│                    ▼                                         │
│  Data Layer                                                 │
│  ├─ MongoDB Atlas (Primary Database)                        │
│  └─ IMAP Server (External Email Provider)                   │
│                    │                                         │
│                    ▼                                         │
│  External Services                                          │
│  ├─ OpenAI API (optional)                                   │
│  └─ Email Provider (IMAP/SMTP)                              │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 3.2 Frontend Architecture Pattern

**Client-Side Rendering (CSR) with SPA**:
- React 19 with functional components and hooks
- Context API for state management (no Redux)
- React Router v7 for client-side routing
- Framer Motion for animations
- Optimistic UI updates for better UX

**State Management Strategy**:
```
┌────────────────────────────────────────────────┐
│         State Management Architecture          │
├────────────────────────────────────────────────┤
│                                                │
│  1. AuthContext                                │
│     ├─ user: User | null                       │
│     ├─ isAuthenticated: boolean                │
│     ├─ loading: boolean                        │
│     └─ Methods: login, logout, register        │
│                                                │
│  2. EmailContext                               │
│     ├─ emails: Email[]                         │
│     ├─ currentFolder: string                   │
│     ├─ selectedEmails: Set<id>                 │
│     ├─ unreadCounts: Map<string, number>       │
│     ├─ labels: Label[]                         │
│     └─ Methods: sync, send, markRead, etc.     │
│                                                │
│  3. LeadContext                                │
│     ├─ leads: Lead[]                           │
│     ├─ stats: LeadStats                        │
│     ├─ filters: LeadFilters                    │
│     └─ Methods: capture, update, score         │
│                                                │
│  4. Component State (useState)                 │
│     └─ Local UI state (modals, forms, etc.)    │
│                                                │
└────────────────────────────────────────────────┘
```

### 3.3 Backend Architecture Pattern

**Layered Architecture with REST + WebSocket**:

```
┌──────────────────────────────────────────────────────────┐
│              Backend Layer Architecture                  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────────────────────────────────────────┐        │
│  │  Routes Layer (REST API)                    │        │
│  │  - auth.routes.js                           │        │
│  │  - email.routes.js (20+ endpoints)          │        │
│  │  - lead.routes.js                           │        │
│  │  - chat.routes.js                           │        │
│  │  - analytics.routes.js                      │        │
│  │  - content.routes.js                        │        │
│  │  - interaction.routes.js                    │        │
│  └─────────────────┬───────────────────────────┘        │
│                    │                                     │
│  ┌─────────────────▼───────────────────────────┐        │
│  │  Middleware Layer                           │        │
│  │  - auth.js (JWT verification)               │        │
│  │  - rbac.js (Role-based access control)      │        │
│  │  - rateLimiter.js (Multiple limiters)       │        │
│  │  - validation.js (Request validation)       │        │
│  └─────────────────┬───────────────────────────┘        │
│                    │                                     │
│  ┌─────────────────▼───────────────────────────┐        │
│  │  Controllers Layer (Business Logic)         │        │
│  │  - emailController.js (Email operations)    │        │
│  │  - authController.js (Auth operations)      │        │
│  │  - leadController.js (Lead operations)      │        │
│  │  - chatController.js (Chatbot logic)        │        │
│  │  - analyticsController.js                   │        │
│  └─────────────────┬───────────────────────────┘        │
│                    │                                     │
│  ┌─────────────────▼───────────────────────────┐        │
│  │  Services Layer (Domain Logic)              │        │
│  │  - imapWatcher.js (IMAP monitoring)         │        │
│  │  - emailService.js (Email operations)       │        │
│  │  - leadScoring.js (Scoring algorithm)       │        │
│  │  - socket.js (WebSocket handlers)           │        │
│  └─────────────────┬───────────────────────────┘        │
│                    │                                     │
│  ┌─────────────────▼───────────────────────────┐        │
│  │  Models Layer (Mongoose Schemas)            │        │
│  │  - User.js, Email.js, Lead.js, etc.         │        │
│  │  (33 models total)                          │        │
│  └─────────────────┬───────────────────────────┘        │
│                    │                                     │
│  ┌─────────────────▼───────────────────────────┐        │
│  │  Database Layer                             │        │
│  │  - MongoDB Atlas (Mongoose connection)      │        │
│  └─────────────────────────────────────────────┘        │
│                                                          │
│  Parallel: Socket.IO Event Handlers                     │
│  ├─ email:new (New email received)                      │
│  ├─ email:sync (Sync progress)                          │
│  ├─ email:read (Read status update)                     │
│  └─ chat:message (Chatbot messages)                     │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 4. Service Architecture

### 4.1 Service Decomposition

The backend is organized into 5 core services:

#### 4.1.1 Authentication Service
**Purpose**: User identity and access management
**Technology**: JWT, bcryptjs, HTTP-only cookies
**Endpoints**:
- `POST /api/auth/login` - User authentication
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `POST /api/auth/change-password` - Change password

#### 4.1.2 Email Service
**Purpose**: Email client functionality with IMAP/SMTP
**Technology**: imap, nodemailer, mailparser, Socket.IO
**Endpoints**: 20+ endpoints (detailed in section 8)
**Real-time Events**: email:new, email:sync, email:read, email:folder

#### 4.1.3 Lead Management Service
**Purpose**: Lead capture, scoring, and nurturing
**Technology**: Custom scoring algorithm, MongoDB aggregation
**Endpoints**:
- `POST /api/leads` - Create lead (public)
- `GET /api/leads` - List leads (admin)
- `GET /api/leads/statistics` - Dashboard stats
- `GET /api/leads/qualified` - Qualified leads
- `POST /api/leads/score` - Recalculate scores
- `PUT /api/leads/:id` - Update lead
- `POST /api/leads/:id/convert` - Convert to opportunity
- `POST /api/leads/:id/notes` - Add note

#### 4.1.4 Analytics Service
**Purpose**: Business intelligence and reporting
**Technology**: MongoDB aggregation pipeline
**Endpoints**:
- `GET /api/analytics/dashboard` - Dashboard data
- `GET /api/analytics/funnel` - Conversion funnel
- `GET /api/analytics/sources` - Traffic sources
- `POST /api/analytics/track` - Track custom events

#### 4.1.5 Chatbot Service
**Purpose**: AI-powered customer support
**Technology**: OpenAI API, Socket.IO
**Status**: Implemented but disabled (requires API key)
**Endpoints**: `POST /api/chat/message`

### 4.2 Inter-Service Communication

**Synchronous Communication**:
- REST API calls (HTTP/HTTPS)
- CORS-enabled for cross-origin requests
- JSON data format

**Asynchronous Communication**:
- Socket.IO for real-time updates
- Event-driven architecture
- Broadcast to specific user rooms

**Service Boundaries**:
```
┌─────────────────────────────────────────────────────┐
│          Service Boundaries & Communication          │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Frontend ──REST──> Authentication Service           │
│     │                                              │
│     ├─ REST ──> Email Service ──> IMAP Server       │
│     │            │                                  │
│     │            └─ Socket.IO <──> IMAP Watcher     │
│     │                                              │
│     ├─ REST ──> Lead Service ──> MongoDB            │
│     │                                              │
│     ├─ REST ──> Analytics Service ──> MongoDB       │
│     │                                              │
│     └─ Socket.IO ─> Chatbot Service ──> OpenAI      │
│                     (disabled)                      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 5. Data Flow Architecture

### 5.1 Request Flow (REST API)

```
┌───────────────────────────────────────────────────────────┐
│              REST API Request Flow                        │
├───────────────────────────────────────────────────────────┤
│                                                           │
│  1. Client Request                                        │
│     │                                                      │
│     ├─ Browser (React app)                                │
│     ├─ HTTP/HTTPS request                                 │
│     └─ Includes JWT token (if authenticated)              │
│                                                           │
│  2. Nginx Reverse Proxy                                   │
│     │                                                      │
│     ├─ SSL/TLS termination                                │
│     ├─ Routing to /api                                    │
│     ├─ Proxy to localhost:5001                            │
│     └─ WebSocket upgrade (if Socket.IO)                   │
│                                                           │
│  3. Express.js Server                                     │
│     │                                                      │
│     ├─ Security middleware (helmet)                       │
│     ├─ CORS validation                                    │
│     ├─ Body parsing (JSON, 10MB limit)                    │
│     ├─ Compression (gzip)                                 │
│     └─ Request logging                                    │
│                                                           │
│  4. Authentication Middleware                            │
│     │                                                      │
│     ├─ JWT verification (if protected route)              │
│     ├─ Token extraction from Authorization header         │
│     ├─ User lookup in database                           │
│     └─ req.user attachment                                │
│                                                           │
│  5. Rate Limiting Middleware                             │
│     │                                                      │
│     ├─ IP-based rate limiting                            │
│     ├─ Endpoint-specific limits                          │
│     └─ Request counting                                   │
│                                                           │
│  6. Route Handler                                         │
│     │                                                      │
│     ├─ Route matching (e.g., /api/email)                  │
│     ├─ Parameter extraction (req.params, req.query)       │
│     └─ Controller invocation                              │
│                                                           │
│  7. Controller (Business Logic)                           │
│     │                                                      │
│     ├─ Input validation                                   │
│     ├─ Business rule execution                            │
│     ├─ Service layer invocation                           │
│     └─ Error handling                                     │
│                                                           │
│  8. Database Query (Mongoose)                             │
│     │                                                      │
│     ├─ Model operation (find, create, update)             │
│     ├─ Query execution                                    │
│     └─ Result transformation                              │
│                                                           │
│  9. Response                                              │
│     │                                                      │
│     ├─ JSON response format                               │
│     ├─ HTTP status code (200, 201, 400, 401, 403, 500)   │
│     ├─ Success/Error flag                                 │
│     └─ Data/message payload                               │
│                                                           │
│  10. Client receives response                             │
│      │                                                     │
│      ├─ Axios interceptor processing                      │
│      ├─ State update (React context/local state)          │
│      └─ UI re-render                                      │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

### 5.2 Real-time Data Flow (Socket.IO)

```
┌───────────────────────────────────────────────────────────┐
│            Socket.IO Real-time Data Flow                  │
├───────────────────────────────────────────────────────────┤
│                                                           │
│  Server-Side: IMAP Watcher                                │
│     │                                                      │
│     ├─ imapWatcher.js runs on server start                │
│     ├─ Connects to IMAP server (email provider)           │
│     ├─ Listens for IDLE events (new emails)               │
│     │                                                      │
│     ├─ New Email Detected                                  │
│     │   │                                                  │
│     │   ├─ Parse email (mailparser)                       │
│     │   ├─ Save to MongoDB (Email model)                  │
│     │   ├─ Update unread counts                           │
│     │   └─ Emit Socket.IO event:                          │
│     │       │                                              │
│     │       ▼                                              │
│     │       io.to(userId).emit('email:new', emailData)    │
│     │                                                      │
│  Client-Side: EmailContext                                │
│     │                                                      │
│     ├─ socket.on('email:new', (data) => {                 │
│     │     // Update email list optimistically             │
│     │     setEmails(prev => [data, ...prev]);             │
│     │     // Update unread count                          │
│     │     setUnreadCounts(prev => ({                      │
│     │       ...prev,                                       │
│     │       [data.folder]: prev[data.folder] + 1          │
│     │     }));                                             │
│     │     // Show notification toast                      │
│     │     showNotification(`New email from ${data.from}`);│
│     │   });                                                │
│     │                                                      │
│     └─ UI automatically updates (React re-render)         │
│                                                           │
│  Bidirectional Communication:                             │
│     │                                                      │
│     ┌─────────┐              ┌─────────┐                  │
│     │ Client  │◄─ Socket.IO ─│ Server  │                  │
│     │         │─────────────>│         │                  │
│     └─────────┘  Events      └─────────┘                  │
│                                                           │
│     Client ──emit──> 'email:sync'                        │
│     Server ──emit──> 'email:sync:progress'               │
│     Server ──emit──> 'email:sync:complete'               │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

### 5.3 Email System Data Flow

```
┌───────────────────────────────────────────────────────────┐
│              Email System Data Flow                       │
├───────────────────────────────────────────────────────────┤
│                                                           │
│  INCOMING EMAIL FLOW:                                     │
│                                                           │
│  External Sender                                          │
│       │                                                    │
│       ├─ Email sent to user@ementech.co.ke                │
│       │                                                    │
│       ▼                                                    │
│  Email Provider (IMAP Server)                             │
│       │                                                    │
│       ├─ Email arrives in INBOX                           │
│       │                                                    │
│       ▼                                                    │
│  IMAP Watcher (imapWatcher.js)                            │
│       │                                                    │
│       ├─ IDLE connection detects new email                │
│       ├─ Fetch email via IMAP                             │
│       ├─ Parse with mailparser                            │
│       │                                                    │
│       ├─ Extract:                                         │
│       │  ├─ From, To, CC, BCC                             │
│       │  ├─ Subject, Body (text + HTML)                   │
│       │  ├─ Attachments                                   │
│       │  ├─ Date, Message-ID, UID                         │
│       │  └─ Thread-ID                                     │
│       │                                                    │
│       ├─ Save to MongoDB (Email model)                    │
│       ├─ Create/update Contact (if new sender)            │
│       ├─ Increment unread count for folder                │
│       │                                                    │
│       ├─ Emit Socket.IO event: 'email:new'                │
│       │   │                                                │
│       │   └─> Client receives and updates UI              │
│       │                                                    │
│       └─ Optional: Send notification                      │
│                                                           │
│  OUTGOING EMAIL FLOW:                                     │
│                                                           │
│  User clicks "Compose" in Email UI                        │
│       │                                                    │
│       ▼                                                    │
│  EmailComposer Component                                  │
│       │                                                    │
│       ├─ User fills form (To, Subject, Body, Attachments) │
│       │                                                    │
│       ▼                                                    │
│  Client: emailService.sendEmail()                         │
│       │                                                    │
│       ├─ POST /api/email/send                             │
│       ├─ Include: to, subject, text, html, attachments    │
│       │                                                    │
│       ▼                                                    │
│  Server: emailController.sendEmail()                      │
│       │                                                    │
│       ├─ Validate input                                   │
│       ├─ Create email record in MongoDB (folder: 'sent')  │
│       │                                                    │
│       ├─ Send via SMTP (nodemailer)                       │
│       │  ├─ Connect to SMTP server                        │
│       │  ├─ Send email                                    │
│       │  └─ Handle response                               │
│       │                                                    │
│       ├─ Update MongoDB with sent status                  │
│       │                                                    │
│       ├─ Emit Socket.IO event: 'email:sent'               │
│       │                                                    │
│       └─ Return response to client                        │
│            │                                               │
│            └─> Client updates UI (optimistic or confirmed)│
│                                                           │
│  EMAIL SYNC FLOW (Manual):                                │
│                                                           │
│  User clicks "Sync" button                                │
│       │                                                    │
│       ▼                                                    │
│  Client: emailService.syncEmails(folder)                  │
│       │                                                    │
│       ├─ POST /api/email/sync/:folder                     │
│       │                                                    │
│       ▼                                                    │
│  Server: emailController.syncEmails()                     │
│       │                                                    │
│       ├─ Connect to IMAP for specified folder             │
│       ├─ Fetch all emails since last sync                 │
│       ├─ Parse and batch insert to MongoDB                │
│       ├─ Update unread counts                             │
│       ├─ Emit progress events via Socket.IO               │
│       │                                                    │
│       └─ Return summary (synced count, errors)            │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

### 5.4 Lead Capture Data Flow

```
┌───────────────────────────────────────────────────────────┐
│               Lead Management Data Flow                   │
├───────────────────────────────────────────────────────────┤
│                                                           │
│  LEAD CAPTURE FLOW:                                       │
│                                                           │
│  Visitor on Website                                       │
│       │                                                    │
│       ├─ Sees exit intent popup / newsletter form         │
│       ├─ Fills out form (email, name, company, etc.)      │
│       │                                                    │
│       ▼                                                    │
│  Frontend: LeadForm Component                             │
│       │                                                    │
│       ├─ Validate inputs                                  │
│       ├─ Collect UTM parameters (if available)            │
│       ├─ Capture source (contact form, newsletter, etc.)   │
│       │                                                    │
│       ▼                                                    │
│  Client: leadService.createLead(data)                     │
│       │                                                    │
│       ├─ POST /api/leads                                  │
│       ├─ Include: email, name, source, UTMs, etc.         │
│       │                                                    │
│       ▼                                                    │
│  Server: leadController.createLead()                      │
│       │                                                    │
│       ├─ Validation check                                  │
│       ├─ Check if lead already exists (by email)          │
│       │  ├─ If yes: Update existing lead                  │
│       │  └─ If no: Create new lead                        │
│       │                                                    │
│       ├─ Apply Lead Scoring Algorithm:                    │
│       │  ├─ Profile completeness (20 pts)                 │
│       │  ├─ Job title seniority (15 pts)                  │
│       │  ├─ Company size (10 pts)                         │
│       │  ├─ Budget (20 pts)                               │
│       │  ├─ Timeline urgency (15 pts)                     │
│       │  ├─ Engagement level (20 pts)                     │
│       │  ├─ Decision maker bonus (10 pts)                 │
│       │  └─ Source quality (10 pts)                       │
│       │                                                    │
│       ├─ Calculate Profile Stage (1-4):                   │
│       │  1. Anonymous (email only)                        │
│       │  2. Identified (name, company)                    │
│       │  3. Qualified (budget, timeline)                  │
│       │  4. Opportunity (ready to convert)                │
│       │                                                    │
│       ├─ Save to MongoDB (Lead model)                     │
│       ├─ Track interaction in Analytics                   │
│       │                                                    │
│       └─ Return success response                          │
│            │                                               │
│            └─> Show success modal to user                 │
│                                                           │
│  LEAD NURTURING FLOW:                                     │
│                                                           │
│  Admin views leads in dashboard                           │
│       │                                                    │
│       ├─ Filter by score, status, source                  │
│       ├─ View lead details                                │
│       ├─ Add notes/interactions                           │
│       ├─ Update lead status                               │
│       ├─ Send follow-up email                             │
│       └─ Convert to opportunity                           │
│                                                           │
│  Progressive Profiling:                                   │
│       │                                                    │
│       ├─ Stage 1 → Stage 2: Collect name, company         │
│       ├─ Stage 2 → Stage 3: Collect budget, timeline      │
│       ├─ Stage 3 → Stage 4: Ready for sales engagement    │
│       └─ Each stage increases lead score                  │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

---

## 6. Authentication & Authorization

### 6.1 Authentication Architecture

**Strategy**: JWT (JSON Web Tokens) with HTTP-only cookies

```
┌───────────────────────────────────────────────────────────┐
│              Authentication Flow                          │
├───────────────────────────────────────────────────────────┤
│                                                           │
│  LOGIN FLOW:                                              │
│                                                           │
│  1. User submits login form                               │
│     │                                                      │
│     ├─ email: user@example.com                            │
│     └─ password: *********                                │
│                                                           │
│  2. Client: authService.login(email, password)            │
│     │                                                      │
│     └─ POST /api/auth/login                               │
│                                                           │
│  3. Server: authController.login()                        │
│     │                                                      │
│     ├─ Validate input                                     │
│     ├─ Find user by email in MongoDB                      │
│     ├─ Compare password hash (bcryptjs)                   │
│     │                                                      │
│     ├─ If valid:                                          │
│     │  ├─ Generate JWT token                              │
│     │  │  ├─ Payload: { userId, role, email }             │
│     │  │  └─ Expiry: 7 days                               │
│     │  │                                                  │
│     │  ├─ Set HTTP-only cookie:                           │
│     │  │  └─ name='token'                                 │
│     │  │  └─ httpOnly=true                                │
│     │  │  └─ secure=true (production)                     │
│     │  │  └─ sameSite='strict'                            │
│     │  │                                                  │
│     │  ├─ Return user data (without password)             │
│     │  └─ Status: 200 OK                                  │
│     │                                                      │
│     └─ If invalid:                                        │
│        └─ Return error (401 Unauthorized)                 │
│                                                           │
│  4. Client receives response                              │
│     │                                                      │
│     ├─ Update AuthContext:                                │
│     │  ├─ setUser(userData)                               │
│     │  └─ setIsAuthenticated(true)                        │
│     ├─ Store user in localStorage (optional)              │
│     └─ Redirect to dashboard                              │
│                                                           │
│  AUTHENTICATED REQUEST FLOW:                              │
│                                                           │
│  1. Client makes request to protected endpoint            │
│     │                                                      │
│     ├─ Axios interceptor adds Authorization header:       │
│     │  └─ Authorization: Bearer <token>                   │
│     │                                                      │
│     └─ Cookie automatically sent with request             │
│        (httpOnly, so JS can't access it)                  │
│                                                           │
│  2. Server: auth middleware (protect)                     │
│     │                                                      │
│     ├─ Extract token from:                                │
│     │  ├─ Authorization header (preferred)                │
│     │  └─ Cookie (fallback)                               │
│     │                                                      │
│     ├─ Verify JWT signature:                              │
│     │  ├─ jwt.verify(token, JWT_SECRET)                   │
│     │  └─ Extract userId, role, email                     │
│     │                                                      │
│     ├─ Fetch user from MongoDB:                           │
│     │  ├─ User.findById(userId)                           │
│     │  └─ Check if isActive=true                          │
│     │                                                      │
│     ├─ Attach user to request:                            │
│     │  └─ req.user = user                                 │
│     │                                                      │
│     └─ Call next() middleware                             │
│                                                           │
│  3. Route handler executes with authenticated user        │
│                                                           │
│  LOGOUT FLOW:                                             │
│                                                           │
│  1. User clicks logout                                    │
│     │                                                      │
│     ▼                                                     │
│  2. Client: authService.logout()                          │
│     │                                                      │
│     ├─ Clear HTTP-only cookie (via API call)              │
│     ├─ Clear localStorage                                 │
│     ├─ Update AuthContext:                                │
│     │  ├─ setUser(null)                                   │
│     │  └─ setIsAuthenticated(false)                       │
│     └─ Redirect to home                                   │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

### 6.2 Authorization Model (RBAC)

**Roles**:
- `admin`: Full system access
- `manager`: Leads, analytics, content management
- `employee`: Basic access, email, own profile

**Permissions Matrix**:
```
┌─────────────────────────────────────────────────────────────┐
│                   Role-Based Access Control                 │
├─────────────────────────────────────────────────────────────┤
│ Feature/Endpoint          │ Admin │ Manager │ Employee │    │
├───────────────────────────┼───────┼─────────┼──────────┼─────┤
│ User Management           │  ✓   │    ✗    │    ✗     │     │
│ Email Management          │  ✓   │    ✓    │    ✓     │     │
│ Lead Management           │  ✓   │    ✓    │    ✗     │     │
│ Lead Scoring              │  ✓   │    ✓    │    ✗     │     │
│ Analytics Dashboard       │  ✓   │    ✓    │    ✗     │     │
│ Content Management        │  ✓   │    ✓    │    ✗     │     │
│ Chatbot Configuration     │  ✓   │    ✗    │    ✗     │     │
│ System Settings           │  ✓   │    ✗    │    ✗     │     │
│ Own Profile               │  ✓   │    ✓    │    ✓     │     │
└─────────────────────────────────────────────────────────────┘
```

**Implementation** (middleware/rbac.js):
```javascript
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    next();
  };
};

// Usage:
router.get('/api/leads/statistics',
  protect,
  authorize('admin', 'manager'),
  leadController.getStatistics
);
```

---

## 7. Real-time Communication

### 7.1 Socket.IO Architecture

**Server Setup** (backend/src/config/socket.js):
```javascript
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins, // from environment
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
  pingTimeout: 60000,  // 60 seconds
  pingInterval: 25000, // 25 seconds
});
```

**Connection Flow**:
```
┌───────────────────────────────────────────────────────────┐
│              Socket.IO Connection Flow                    │
├───────────────────────────────────────────────────────────┤
│                                                           │
│  1. Client Initialization                                 │
│     │                                                      │
│     ├─ EmailContext component mounts                      │
│     ├─ Create socket connection:                          │
│     │  │                                                  │
│     │  └─ import { io } from 'socket.io-client';          │
│     │     const socket = io(API_URL, {                    │
│     │       auth: { token: getToken() }                   │
│     │     });                                             │
│     │                                                  │
│     └─ Connection established                             │
│                                                           │
│  2. Server: Connection Handler                            │
│     │                                                      │
│     ├─ io.on('connection', (socket) => {                 │
│     │  │                                                  │
│     │  ├─ Extract JWT from socket.auth.token             │
│     │  ├─ Verify token                                    │
│     │  ├─ Get user ID                                     │
│     │  │                                                  │
│     │  ├─ Join user-specific room:                       │
│     │  │  └─ socket.join(`user:${userId}`)               │
│     │  │                                                  │
│     │  ├─ Set up event listeners:                        │
│     │  │  ├─ socket.on('email:sync', ...)                │
│     │  │  ├─ socket.on('chat:message', ...)              │
│     │  │  └─ socket.on('disconnect', ...)                │
│     │  │                                                  │
│     │  └─ Store socket reference for user                │
│     │});                                                  │
│     │                                                      │
│  3. Client: Event Listeners                               │
│     │                                                      │
│     ├─ socket.on('email:new', (email) => {               │
│     │     // Add to email list                            │
│     │     setEmails(prev => [email, ...prev]);           │
│     │     // Update unread count                          │
│     │     incrementUnread(email.folder);                  │
│     │     // Show notification                            │
│     │     toast(`New email from ${email.from}`);          │
│     │   });                                               │
│     │                                                  │
│     ├─ socket.on('email:sync:progress', (data) => {      │
│     │     setSyncProgress(data);                          │
│     │   });                                               │
│     │                                                  │
│     └─ socket.on('email:sync:complete', (result) => {    │
│         setSyncResult(result);                            │
│         setIsSyncing(false);                              │
│       });                                                 │
│                                                           │
│  4. Server: Emitting Events                               │
│     │                                                      │
│     ├─ Target specific user:                              │
│     │  └─ io.to(`user:${userId}`).emit('email:new', email)│
│     │                                                  │
│     ├─ Broadcast to all users:                            │
│     │  └─ io.emit('system:announcement', message)         │
│     │                                                  │
│     └─ Send to room:                                      │
│        └─ io.to('room:admins').emit('lead:new', lead)    │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

### 7.2 Real-time Events

**Email Events**:
```javascript
// New email received
io.to(`user:${userId}`).emit('email:new', {
  id: email._id,
  from: email.from,
  subject: email.subject,
  preview: email.textBody?.substring(0, 100),
  folder: email.folder,
  date: email.date
});

// Email sync progress
socket.emit('email:sync:progress', {
  folder: 'INBOX',
  processed: 45,
  total: 100,
  percentage: 45
});

// Sync complete
socket.emit('email:sync:complete', {
  folder: 'INBOX',
  synced: 100,
  errors: 0,
  duration: '3.2s'
});

// Email read status updated
io.to(`user:${userId}`).emit('email:read', {
  emailId: email._id,
  isRead: true
});

// Email moved to folder
io.to(`user:${userId}`).emit('email:folder', {
  emailId: email._id,
  oldFolder: 'INBOX',
  newFolder: 'Archive'
});
```

**Chat Events** (when enabled):
```javascript
// Chatbot message
socket.emit('chat:message', {
  role: 'assistant',
  content: responseText,
  timestamp: new Date()
});

// Chatbot typing
socket.emit('chat:typing', {
  isTyping: true
});
```

---

## 8. Email System Architecture

### 8.1 Email System Overview

**Purpose**: Full-featured email client interface integrated with IMAP/SMTP

**Key Features**:
- Real-time email synchronization (IMAP IDLE)
- Email composition and sending (SMTP)
- Folder management (Inbox, Sent, Drafts, Trash, Spam, Archive)
- Label system for categorization
- Contact management
- Full-text search
- Threaded conversations
- Attachment handling
- Offline support (cached in MongoDB)

### 8.2 Email API Endpoints

**Complete Endpoint List** (20+ endpoints):

```
┌─────────────────────────────────────────────────────────────┐
│                   Email API Endpoints                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ FETCHING & SYNCING:                                         │
│  GET    /api/email                    - Fetch emails        │
│  POST   /api/email/sync/:folder?      - Sync from IMAP      │
│  GET    /api/email/:id                - Get single email    │
│  GET    /api/email/search?q=...       - Search emails       │
│                                                             │
│ SENDING:                                                    │
│  POST   /api/email/send              - Send email          │
│                                                             │
│ ACTIONS:                                                    │
│  PUT    /api/email/:id/read          - Mark read/unread    │
│  PUT    /api/email/mark-read         - Batch mark read     │
│  PUT    /api/email/:id/flag          - Toggle star/flag    │
│  PUT    /api/email/:id/folder        - Move to folder      │
│  DELETE /api/email/:id               - Soft delete         │
│  DELETE /api/email/multiple/delete   - Batch delete        │
│                                                             │
│ FOLDERS:                                                    │
│  GET    /api/email/folders/list     - Get folders          │
│  GET    /api/email/folders/unread-count - Unread counts    │
│                                                             │
│ LABELS:                                                     │
│  GET    /api/email/labels/list      - Get labels           │
│  POST   /api/email/labels            - Create label        │
│  PUT    /api/email/:id/labels/:labelId - Add label         │
│  DELETE /api/email/:id/labels/:labelId - Remove label      │
│                                                             │
│ CONTACTS:                                                   │
│  GET    /api/email/contacts/list    - Get contacts         │
│  POST   /api/email/contacts          - Create contact      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 8.3 Email Data Model

```javascript
// Email Model (backend/src/models/Email.js)
{
  // Identification
  user: ObjectId,              // Reference to User
  emailAccount: String,        // Email address
  messageId: String,           // Message-ID header
  uid: Number,                 // IMAP UID

  // Organization
  folder: {
    type: String,
    enum: ['inbox', 'sent', 'drafts', 'trash', 'spam', 'archive'],
    default: 'inbox'
  },
  threadId: String,            // Conversation threading

  // Participants
  from: {
    name: String,
    address: String
  },
  to: [{ name: String, address: String }],
  cc: [{ name: String, address: String }],
  bcc: [{ name: String, address: String }],
  replyTo: [{ name: String, address: String }],

  // Content
  subject: String,
  textBody: String,            // Plain text version
  htmlBody: String,            // HTML version
  attachments: [{
    filename: String,
    contentType: String,
    size: Number,
    cid: String                // Content-ID for inline images
  }],

  // Flags
  isRead: { type: Boolean, default: false },
  isFlagged: { type: Boolean, default: false },
  hasAttachments: { type: Boolean, default: false },

  // Labels
  labels: [ObjectId],          // Reference to Label model

  // Dates
  date: Date,                  // Received date
  sentDate: Date,              // Sent date (from header)

  // Sync Status
  syncStatus: {
    type: String,
    enum: ['synced', 'pending', 'error'],
    default: 'synced'
  },

  // Indexes
  indexes: [
    { user: 1, folder: 1, date: -1 },
    { user: 1, messageId: 1 },
    { user: 1, threadId: 1 },
    { subject: 'text', textBody: 'text', from: 'text' }
  ]
}
```

### 8.4 IMAP Integration (imapWatcher.js)

**Real-time Email Monitoring**:
```javascript
// IMAP Watcher Architecture
┌─────────────────────────────────────────────────────────────┐
│               IMAP Watcher Service                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  STARTUP:                                                   │
│  ├─ Server starts (server.js)                              │
│  ├─ Call startAllWatchers()                                │
│  ├─ For each user with email account:                      │
│  │  ├─ Create IMAP connection                              │
│  │  ├─ Open INBOX in IDLE mode                             │
│  │  └─ Listen for new email events                         │
│                                                             │
│  IDLE MODE (Real-time):                                    │
│  ├─ IMAP server pushes new email notification              │
│  ├─ Watcher fetches new email immediately                  │
│  ├─ Parse with mailparser                                  │
│  ├─ Save to MongoDB                                         │
│  ├─ Emit Socket.IO event: 'email:new'                      │
│  └─ Client receives and updates UI instantly               │
│                                                             │
│  PERIODIC SYNC (Fallback):                                 │
│  ├─ Every 5 minutes                                        │
│  ├─ Fetch all emails since last sync                       │
│  ├─ Compare with MongoDB                                   │
│  ├─ Insert new emails                                      │
│  ├─ Update metadata                                        │
│  └─ Emit summary event                                     │
│                                                             │
│  ERROR HANDLING:                                           │
│  ├─ Connection lost: Reconnect with exponential backoff    │
│  ├─ Parse error: Log and continue                          │
│  ├─ DB error: Retry with queue                             │
│  └─ Notify admin of persistent errors                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 8.5 SMTP Integration (Sending Emails)

**Email Sending Flow**:
```javascript
// nodemailer Transporter Configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false, // STARTTLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});

// Send Email Function
async function sendEmail({ to, cc, bcc, subject, text, html, attachments }) {
  // 1. Create email record in MongoDB (folder: 'sent', status: 'sending')
  const email = await Email.create({
    user: req.user._id,
    folder: 'sent',
    to, cc, bcc, subject, textBody: text, htmlBody: html,
    attachments,
    syncStatus: 'pending'
  });

  try {
    // 2. Send via SMTP
    const info = await transporter.sendMail({
      from: req.user.email,
      to, cc, bcc, subject, html,
      attachments: attachments.map(a => ({
        filename: a.filename,
        content: a.content,
        contentType: a.contentType
      }))
    });

    // 3. Update email record with success
    email.syncStatus = 'synced';
    email.messageId = info.messageId;
    await email.save();

    // 4. Emit Socket.IO event
    io.to(`user:${req.user._id}`).emit('email:sent', email);

    return email;
  } catch (error) {
    // 5. Handle failure
    email.syncStatus = 'error';
    email.error = error.message;
    await email.save();
    throw error;
  }
}
```

---

## 9. Lead Management Architecture

### 9.1 Lead Management Overview

**Purpose**: Comprehensive lead capture, scoring, and nurturing system

**Key Features**:
- Multi-source lead capture
- Progressive profiling (4 stages)
- Automatic lead scoring (120 point scale)
- Lead status tracking
- Interaction logging
- Email integration
- Analytics and reporting
- GDPR compliance

### 9.2 Lead Data Model

```javascript
// Lead Model (backend/src/models/Lead.js)
{
  // CONTACT INFORMATION
  email: { type: String, required: true, unique: true },
  name: String,
  phone: String,
  company: String,
  jobTitle: String,
  website: String,

  // PROGRESSIVE PROFILING
  profileStage: {
    type: Number,
    enum: [1, 2, 3, 4],
    default: 1,
    // 1: Anonymous (email only)
    // 2: Identified (name, company)
    // 3: Qualified (budget, timeline)
    // 4: Opportunity (ready to convert)
  },

  // ENHANCED DATA (collected over time)
  companySize: String,
  industry: String,
  budget: {
    type: String,
    enum: ['<5k', '5k-10k', '10k-25k', '25k-50k', '50k+']
  },
  timeline: {
    type: String,
    enum: ['urgent', '1-3mo', '3-6mo', '6mo+']
  },

  // LEAD SCORING
  leadScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 120
  },
  status: {
    type: String,
    enum: ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'],
    default: 'new'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },

  // SOURCE TRACKING
  source: {
    type: String,
    enum: ['contact-form', 'newsletter', 'event', 'survey', 'download',
            'meetup', 'chatbot', 'referral', 'website']
  },
  campaign: String,
  utmSource: String,
  utmMedium: String,
  utmCampaign: String,
  utmTerm: String,
  utmContent: String,

  // ENGAGEMENT METRICS
  engagement: {
    pageViews: { type: Number, default: 0 },
    timeOnSite: { type: Number, default: 0 }, // seconds
    sessionCount: { type: Number, default: 1 },
    lastActivity: Date,
    emailOpens: { type: Number, default: 0 },
    emailClicks: { type: Number, default: 0 }
  },

  // GDPR COMPLIANCE
  consentGiven: { type: Boolean, default: false },
  marketingConsent: { type: Boolean, default: false },
  unsubscribed: { type: Boolean, default: false },
  consentDate: Date,

  // INTERACTIONS & NOTES
  notes: [{
    content: String,
    author: ObjectId, // Reference to User
    createdAt: Date
  }],
  interactions: [{
    type: {
      type: String,
      enum: ['call', 'email', 'meeting', 'demo', 'other']
    },
    description: String,
    author: ObjectId,
    createdAt: Date
  }],

  // ASSIGNMENT
  assignedTo: ObjectId, // Reference to User

  // CONVERSION
  converted: { type: Boolean, default: false },
  conversionDate: Date,
  value: Number, // Deal value if converted

  // CUSTOM FIELDS
  customFields: Map, // Key-value pairs for custom data

  // INFERRED DATA
  inferredData: {
    location: String,      // From IP
    deviceType: String,    // From user agent
    referrer: String,
    firstPage: String,
    leadQuality: String    // AI-predicted quality
  },

  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },

  // Indexes
  indexes: [
    { email: 1 },
    { leadScore: -1 },
    { status: 1, leadScore: -1 },
    { source: 1, createdAt: -1 },
    { assignedTo: 1, status: 1 }
  ]
}
```

### 9.3 Lead Scoring Algorithm

**Calculation Method**:
```javascript
function calculateLeadScore(lead) {
  let score = 0;

  // 1. Profile Completeness (20 points max)
  if (lead.name) score += 5;
  if (lead.phone) score += 3;
  if (lead.company) score += 5;
  if (lead.jobTitle) score += 4;
  if (lead.website) score += 3;

  // 2. Job Title Seniority (15 points max)
  const seniorTitles = ['ceo', 'cto', 'director', 'vp', 'head', 'manager'];
  const title = lead.jobTitle?.toLowerCase() || '';
  if (seniorTitles.some(s => title.includes(s))) {
    score += title.includes('ceo') || title.includes('cto') ? 15 : 10;
  } else if (title) {
    score += 5;
  }

  // 3. Company Size (10 points max)
  if (lead.companySize === '50+') score += 10;
  else if (lead.companySize === '11-50') score += 7;
  else if (lead.companySize === '2-10') score += 5;
  else if (lead.companySize === '1') score += 2;

  // 4. Budget (20 points max)
  if (lead.budget === '50k+') score += 20;
  else if (lead.budget === '25k-50k') score += 15;
  else if (lead.budget === '10k-25k') score += 10;
  else if (lead.budget === '5k-10k') score += 5;

  // 5. Timeline Urgency (15 points max)
  if (lead.timeline === 'urgent') score += 15;
  else if (lead.timeline === '1-3mo') score += 12;
  else if (lead.timeline === '3-6mo') score += 8;
  else if (lead.timeline === '6mo+') score += 4;

  // 6. Engagement Level (20 points max)
  const engagement = lead.engagement || {};
  score += Math.min(engagement.pageViews || 0, 5); // Max 5 for page views
  score += Math.min(Math.floor((engagement.timeOnSite || 0) / 60), 5); // 5 for 5+ min
  score += Math.min(engagement.emailOpens || 0, 5); // Max 5 for email opens
  score += Math.min(engagement.emailClicks || 0, 5); // Max 5 for email clicks

  // 7. Decision Maker Bonus (10 points)
  const decisionMakerTitles = ['ceo', 'cto', 'director', 'vp', 'founder', 'owner'];
  if (decisionMakerTitles.some(t => title.includes(t))) {
    score += 10;
  }

  // 8. Source Quality (10 points max)
  const highQualitySources = ['referral', 'event', 'meetup'];
  const mediumQualitySources = ['contact-form', 'demo', 'chatbot'];
  if (highQualitySources.includes(lead.source)) score += 10;
  else if (mediumQualitySources.includes(lead.source)) score += 5;
  else score += 2; // Low quality sources

  return Math.min(score, 120); // Cap at 120
}
```

**Score Interpretation**:
```
┌─────────────────────────────────────────────────────────────┐
│                   Lead Score Interpretation                 │
├─────────────────────────────────────────────────────────────┤
│ Score Range   │ Quality   │ Priority  │ Action              │
├───────────────┼───────────┼───────────┼─────────────────────┤
│ 100-120       │ Excellent │ Urgent    │ Immediate contact   │
│ 80-99         │ High      │ High      │ Contact within 24h  │
│ 60-79         │ Good      │ Medium    │ Contact within 48h  │
│ 40-59         │ Average   │ Medium    │ Nurture campaign    │
│ 20-39         │ Low       │ Low       │ Newsletter only     │
│ 0-19          │ Poor      │ Low       │ Monitor only        │
└─────────────────────────────────────────────────────────────┘
```

---

## 10. API Architecture

### 10.1 API Design Principles

**RESTful Conventions**:
- Use HTTP verbs appropriately (GET, POST, PUT, DELETE)
- Resource-based URLs (`/api/resource/:id`)
- Consistent response format
- Proper status codes
- Versioning ready (currently v1, implicit)

**Response Format**:
```javascript
// Success Response
{
  "success": true,
  "data": {
    // Response data here
  },
  "message": "Operation successful" // Optional
}

// Error Response
{
  "success": false,
  "message": "Error description",
  "error": {
    "code": "ERROR_CODE",
    "details": "Detailed error message"
  }
}
```

### 10.2 CORS Configuration

**Multi-Origin Support**:
```javascript
// backend/src/server.js
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : ['http://localhost:5173'];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow cookies
}));
```

**Environment Configuration**:
```bash
# Production
CORS_ORIGIN=https://ementech.co.ke,https://www.ementech.co.ke,https://dumuwaks.ementech.co.ke

# Development
CORS_ORIGIN=http://localhost:3000,http://localhost:5173
```

### 10.3 Rate Limiting Strategy

**Multiple Rate Limiters**:
```javascript
// backend/src/middleware/rateLimiter.js

// General API limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests, please try again later'
});

// Lead creation limiter (prevent spam)
export const leadCreationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 leads per minute
  message: 'Too many lead submissions, please try again later'
});

// Chatbot limiter
export const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 messages per minute
  message: 'Too many chat messages, please slow down'
});

// Download limiter (attachments, exports)
export const downloadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 downloads per minute
  message: 'Too many downloads, please try again later'
});
```

### 10.4 API Endpoint Categorization

**Public Endpoints** (No authentication):
```
GET  /api/health
POST /api/auth/login
POST /api/auth/register
POST /api/leads (lead capture)
POST /api/leads/:id/unsubscribe
```

**Protected Endpoints** (JWT required):
```
# All email endpoints (20+)
/api/email/*

# User management
GET  /api/auth/me
PUT  /api/auth/profile
POST /api/auth/change-password

# Lead management (admin/manager)
GET  /api/leads
GET  /api/leads/statistics
GET  /api/leads/qualified
PUT  /api/leads/:id
POST /api/leads/score

# Analytics (admin/manager)
GET  /api/analytics/*
```

---

## 11. Security Architecture

### 11.1 Security Measures

**Implementation Checklist**:

```
┌─────────────────────────────────────────────────────────────┐
│                   Security Architecture                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 1. TRANSPORT LAYER SECURITY                                 │
│    ├─ SSL/TLS (Let's Encrypt)                              │
│    ├─ HTTPS only (HTTP -> HTTPS redirect)                  │
│    └─ Strong cipher suites                                 │
│                                                             │
│ 2. AUTHENTICATION                                           │
│    ├─ JWT tokens (7-day expiry)                            │
│    ├─ HTTP-only cookies (prevent XSS)                      │
│    ├─ Secure flag (production only)                        │
│    ├─ SameSite=strict (prevent CSRF)                       │
│    └─ Password hashing (bcryptjs, salt rounds: 10)         │
│                                                             │
│ 3. AUTHORIZATION                                            │
│    ├─ Role-based access control (RBAC)                     │
│    ├─ Route-level permissions                              │
│    └─ Resource-level ownership checks                      │
│                                                             │
│ 4. INPUT VALIDATION                                         │
│    ├─ express-validator (server-side)                      │
│    ├─ Schema validation (Mongoose)                         │
│    ├─ Type checking (TypeScript)                           │
│    ├─ HTML sanitization (prevent XSS)                      │
│    └─ SQL injection prevention (NoSQL safe)                │
│                                                             │
│ 5. RATE LIMITING                                           │
│    ├─ IP-based rate limiting                               │
│    ├─ Endpoint-specific limits                             │
│    └─ DDoS protection (Nginx)                              │
│                                                             │
│ 6. SECURITY HEADERS (Helmet.js)                            │
│    ├─ X-Content-Type-Options: nosniff                      │
│    ├─ X-Frame-Options: DENY                                │
│    ├─ X-XSS-Protection: 1; mode=block                      │
│    ├─ Strict-Transport-Security: max-age=31536000          │
│    ├─ Content-Security-Policy (CSP)                        │
│    └─ Referrer-Policy: strict-origin-when-cross-origin     │
│                                                             │
│ 7. DATA PROTECTION                                          │
│    ├─ Environment variables (.env, not committed)          │
│    ├─ Passwords never in logs                              │
│    ├─ Sensitive data encryption (MongoDB)                  │
│    ├─ GDPR compliance (consent tracking)                   │
│    └─ Regular backups (MongoDB Atlas)                      │
│                                                             │
│ 8. API SECURITY                                             │
│    ├─ CORS configuration (whitelist origins)               │
│    ├─ Request size limits (10MB)                           │
│    ├─ Request timeout                                      │
│    └─ Error handling (no sensitive info in errors)         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 11.2 Environment Variables Security

**Required Variables** (sensitive):
```bash
# Database
MONGODB_URI=mongodb+srv://...

# JWT
JWT_SECRET=random_64_char_string
JWT_EXPIRE=7d

# Email (IMAP)
IMAP_HOST=imap.example.com
IMAP_PORT=993
IMAP_USER=user@ementech.co.ke
IMAP_PASSWORD=app_specific_password
IMAP_TLS=true

# Email (SMTP)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=user@ementech.co.ke
SMTP_PASSWORD=app_specific_password

# OpenAI (optional)
OPENAI_API_KEY=sk-...

# CORS
CORS_ORIGIN=https://ementech.co.ke,https://www.ementech.co.ke

# Server
PORT=5001
NODE_ENV=production
```

**Security Best Practices**:
- Never commit `.env` files
- Use `.env.example` as template
- Rotate secrets regularly
- Use app-specific passwords for email
- Generate strong JWT secrets (64+ characters)
- Restrict MongoDB Atlas IP whitelist
- Enable MongoDB Atlas authentication

---

## 12. Development vs Production

### 12.1 Environment Differences

```
┌─────────────────────────────────────────────────────────────┐
│            Development vs Production Comparison             │
├─────────────────────────────────────────────────────────────┤
│ Aspect              │ Development         │ Production      │
├─────────────────────┼─────────────────────┼─────────────────┤
│ Frontend URL        │ localhost:3000      │ ementech.co.ke  │
│ Backend URL         │ localhost:5001      │ api.ementech... │
│ Database            │ Local or Atlas     │ Atlas only      │
│ IMAP/SMTP           │ Test accounts      │ Real accounts   │
│ JWT Expiry          │ 24 hours           │ 7 days          │
│ Logging             │ Console, detailed  │ File, errors    │
│ Error Messages      │ Full stack trace   │ Generic only    │
│ CORS                │ localhost origins  │ Production URLs │
│ Hot Reload          │ Yes (Vite HMR)     │ No              │
│ Source Maps         │ Yes                │ No              │
│ Compression         │ Disabled           │ Enabled (gzip)  │
│ Minification        │ No                 │ Yes             │
│ SSL/TLS             │ No                 │ Yes             │
│ Rate Limiting       │ Relaxed            │ Strict          │
│ Analytics           │ Disabled           │ Enabled         │
│ Email Monitoring    │ Manual sync only   │ Real-time IDLE  │
└─────────────────────────────────────────────────────────────┘
```

### 12.2 Local Development Setup

**Frontend (React)**:
```bash
cd /media/munen/muneneENT/ementech/ementech-website
npm install
npm run dev  # Runs on localhost:3000
# Vite proxy handles /api -> localhost:5001
```

**Backend (Node.js)**:
```bash
cd backend
npm install
cp .env.example .env.local  # Configure with local/test values
npm run dev  # Runs on localhost:5001 with nodemon (HMR)
```

**Database**:
- Option 1: Use MongoDB Atlas (same as production)
- Option 2: Run local MongoDB (docker or installed)
  ```bash
  # Docker
  docker run -d -p 27017:27017 --name mongodb mongo:latest

  # Or installed
  sudo systemctl start mongod
  ```

**IMAP/SMTP Testing**:
- Use test email accounts (Gmail, Outlook)
- Create app-specific passwords
- Update `.env.local` with test credentials

---

## 13. Deployment Architecture

### 13.1 Server Configuration

**VPS Details**:
- OS: Ubuntu 22.04 LTS
- Kernel: Linux 6.14.0-37-generic
- IP: 69.164.244.165
- Domains: ementech.co.ke, dumuwaks.ementech.co.ke
- Provider: Linode (assumed)

**Directory Structure**:
```
/var/www/
├── ementech-website/           # Corporate site
│   ├── backend/                # Node.js API
│   │   ├── src/
│   │   ├── node_modules/
│   │   ├── package.json
│   │   └── .env                # Production env
│   └── current/                # Frontend build (static)
│       ├── index.html
│       └── assets/
│
└── dumuwaks-backend/           # Job marketplace
    └── (similar structure)
```

### 13.2 Process Management (PM2)

**Running Processes**:
```bash
# View processes
pm2 list

# Expected output:
# ┌─────┬──────────────────┬─────────┬─────┬─────────┐
# │ ID  │ Name             │ Status  │ CPU │ Memory  │
# ├─────┼──────────────────┼─────────┼─────┼─────────┤
# │ 0   │ dumuwaks-backend │ online  │ 0%  │ 102.1MB │
# │ 1   │ ementech-backend │ online  │ 0%  │ 92.2MB  │
# └─────┴──────────────────┴─────────┴─────┴─────────┘

# Restart process
pm2 restart ementech-backend

# View logs
pm2 logs ementech-backend

# Monitor
pm2 monit
```

**PM2 Ecosystem File** (backend/ecosystem.config.js):
```javascript
module.exports = {
  apps: [{
    name: 'ementech-backend',
    script: './src/server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5001
    }
  }]
};
```

### 13.3 Nginx Configuration

**Site Configuration** (/etc/nginx/sites-available/ementech.co.ke):
```nginx
# HTTP to HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name ementech.co.ke www.ementech.co.ke;
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ementech.co.ke www.ementech.co.ke;

    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/ementech.co.ke/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ementech.co.ke/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Root directory (frontend build)
    root /var/www/ementech-website/current;
    index index.html;

    # Frontend static files
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API proxy
    location /api/ {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Socket.IO WebSocket proxy
    location /socket.io/ {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Logging
    access_log /var/log/nginx/ementech_access.log;
    error_log /var/log/nginx/ementech_error.log;
}
```

### 13.4 Deployment Workflow

**Frontend Deployment**:
```bash
# On local machine
cd /media/munen/muneneENT/ementech/ementech-website
npm run build

# On server
cd /var/www/ementech-website
mkdir -p backups
mv current backups/current-$(date +%Y%m%d-%H%M%S)
mkdir -p current
# Upload build/ directory to current/
# (via scp, rsync, or git pull)

# Restart nginx (not necessary, just reads new files)
sudo nginx -s reload
```

**Backend Deployment**:
```bash
# On server
cd /var/www/ementech-website/backend

# Pull latest code
git pull origin main

# Install dependencies
npm install --production

# Restart PM2 process
pm2 restart ementech-backend

# Check status
pm2 status
pm2 logs --lines 50
```

---

## 14. Monitoring & Maintenance

### 14.1 Health Monitoring

**Health Check Endpoint**:
```
GET /api/health

Response:
{
  "status": "healthy",
  "timestamp": "2026-01-21T12:00:00.000Z",
  "uptime": 3600.123,
  "environment": "production"
}
```

**Monitoring Checklist**:
- Server uptime (PM2)
- Memory usage (PM2 monit)
- CPU usage (PM2 monit)
- API response times
- Database connection status
- IMAP connection status
- Error logs (PM2 logs, Nginx logs)
- SSL certificate expiry (Let's Encrypt auto-renews)

### 14.2 Backup Strategy

**Automated Backups**:
- MongoDB Atlas: Continuous backups + snapshot
- Code: Git repository (GitHub, GitLab, etc.)
- Environment variables: Secure storage (1Password, etc.)
- SSL certificates: Let's Encrypt auto-renewal

**Manual Backups** (recommended before major changes):
```bash
# Database export
mongodump --uri="MONGODB_URI" --out=/backup/$(date +%Y%m%d)

# Frontend build backup
cp -r /var/www/ementech-website/current /backup/current-$(date +%Y%m%d)

# Backend code backup (already in git)
cd /var/www/ementech-website/backend
git push origin main
```

---

## 15. Next Steps for UI/UX Design & Frontend Development

This architecture document provides the foundation for:

1. **Email System UI/UX** - See `email-system-ui-spec.md`
2. **Lead Management UI/UX** - See `lead-management-ui-spec.md`
3. **Local Development Setup** - See `local-development-setup.md`
4. **Testing Strategy** - See `testing-strategy.md`
5. **Component Integration** - See `component-api-integration.md`
6. **Deployment Guide** - See `deployment-checklist.md`

---

**Document Status**: Complete
**Next Review**: After local development environment setup
**Maintained By**: Architecture Team
**Questions**: Consult implementation team or escalate via `.agent-workspace/escalations/`
