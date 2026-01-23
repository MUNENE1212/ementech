# Ementech Website - Technology Stack Inventory

**Analysis Date**: 2026-01-21
**Project Status**: Production Live
**Total Dependencies**: 140+ packages across all projects

---

## Executive Summary

The Ementech website project uses a **modern JavaScript full-stack** with React 19 (latest) on the frontend and Node.js/Express on the backend. The stack is carefully chosen for performance, developer experience, and real-time capabilities.

**Key Highlights**:
- React 19.2.0 (cutting edge)
- Socket.IO 4.8.3 for real-time features
- Production-grade IMAP email integration
- MongoDB with Mongoose ODM
- Tailwind CSS for styling
- PM2 + Nginx in production

---

## Frontend Technology Stack

### Core Framework

**React 19.2.0** (Latest)
- **Version**: 19.2.0
- **License**: MIT
- **Purpose**: UI Framework
- **Why React 19**: Latest performance improvements, concurrent features, automatic batching
- **Status**: Production Ready ✅

**TypeScript 5.9.3**
- **Version**: 5.9.3
- **Purpose**: Type safety
- **Coverage**: 100% of new code, gradual adoption in legacy
- **Config Files**:
  - `tsconfig.json` (root config)
  - `tsconfig.app.json` (application code)
  - `tsconfig.node.json` (build scripts)

**Vite 7.2.4**
- **Version**: 7.2.4
- **Purpose**: Build tool & dev server
- **Why Vite**: Lightning-fast HMR, optimized builds, ES modules
- **Dev Server Port**: 3000
- **Build Output**: `/dist`
- **Status**: Production Ready ✅

### UI Libraries

**Tailwind CSS 3.4.19**
- **Version**: 3.4.19
- **Purpose**: Utility-first CSS framework
- **Config**: `tailwind.config.js`
- **PostCSS**: Enabled
- **Autoprefixer**: Enabled
- **Customization**: Extended theme for Ementech branding

**Framer Motion 12.26.2**
- **Version**: 12.26.2
- **Purpose**: Animation library
- **Usage**: Page transitions, hero animations, micro-interactions
- **Features**: Gesture animations, layout animations, exit animations

**Lucide React 0.562.0**
- **Version**: 0.562.0
- **Purpose**: Icon library
- **Why Lucide**: Lightweight, tree-shakeable, consistent design
- **Count**: 1000+ icons available

**React Icons 5.5.0**
- **Version**: 5.5.0
- **Purpose**: Additional icon library
- **Includes**: Font Awesome, Material Design, Ionicons

### Routing

**React Router DOM 7.12.0**
- **Version**: 7.12.0 (Latest)
- **Purpose**: Client-side routing
- **Mode**: BrowserRouter
- **Routes**: 13 pages
- **Status**: Production Ready ✅

### HTTP Client

**Axios 1.13.2**
- **Version**: 1.13.2
- **Purpose**: HTTP client for API requests
- **Base URL**: Configured via environment variable
- **Features**: Interceptors, request/response transformation, error handling
- **Usage Pattern**: Service layer (see `/src/services/`)

### Real-time Communication

**Socket.IO Client 4.8.3**
- **Version**: 4.8.3
- **Purpose**: Real-time bi-directional communication
- **Connection**: Auto-connects to backend
- **Events**: 10+ event types (email updates, chat, typing indicators)
- **Features**: Automatic reconnection, room-based messaging

### Form Handling

**EmailJS 4.4.1**
- **Version**: 4.4.1
- **Purpose**: Contact form submissions
- **Usage**: Contact page form
- **Alternative**: Can use backend API instead

### Date/Time Utilities

**date-fns 4.1.0**
- **Version**: 4.1.0
- **Purpose**: Date manipulation and formatting
- **Why date-fns**: Modular, tree-shakeable, immutable
- **Usage**: Email dates, timestamps, scheduling

### Development Tools

**ESLint 9.39.1**
- **Version**: 9.39.1
- **Purpose**: Code linting
- **Config**: `eslint.config.js`
- **Plugins**:
  - `eslint-plugin-react-hooks` 7.0.1
  - `eslint-plugin-react-refresh` 0.4.24

**TypeScript ESLint 8.46.4**
- **Version**: 8.46.4
- **Purpose**: TypeScript linting rules

**Globals 16.5.0**
- **Version**: 16.5.0
- **Purpose**: Global variables for ESLint

---

## Backend Technology Stack

### Core Framework

**Node.js** (Runtime)
- **Version**: 18+ (LTS)
- **Purpose**: JavaScript runtime
- **Process Manager**: PM2
- **Port**: 5001

**Express 4.19.2**
- **Version**: 4.19.2
- **Purpose**: Web framework
- **Why Express**: Minimal, flexible, huge ecosystem
- **Architecture**: Middleware-based
- **Status**: Production Ready ✅

### Real-time Communication

**Socket.IO 4.7.5**
- **Version**: 4.7.5
- **Purpose**: WebSocket server
- **Features**:
  - Automatic fallback (WebSocket → polling)
  - Room-based messaging
  - JWT authentication
  - CORS support
  - Sticky sessions (ready for Redis)
- **Ping Timeout**: 60000ms
- **Ping Interval**: 25000ms

### Database & ORM

**MongoDB** (Database)
- **Version**: 4.4+ (Production), 5.0+ (Recommended)
- **Purpose**: NoSQL document database
- **Deployment**: VPS local instance or MongoDB Atlas
- **Status**: Production Ready ✅

**Mongoose 8.0.0**
- **Version**: 8.0.0
- **Purpose**: MongoDB ODM (Object Document Mapper)
- **Features**:
  - Schema validation
  - Middleware (pre/post hooks)
  - Virtual properties
  - Population (references)
  - Query building
  - Indexes
- **Models**: 31 schemas defined

### Email System (CWD Startup)

**IMAP Client 0.8.19**
- **Version**: 0.8.19
- **Purpose**: IMAP protocol implementation
- **Features**:
  - IDLE support (real-time push)
  - SSL/TLS
  - Folder management
  - Message fetching
  - Flag management
- **Usage**: Real-time email monitoring

**mailparser 3.6.6**
- **Version**: 3.6.6
- **Purpose**: Email parsing
- **Features**:
  - Parse raw email
  - Extract attachments
  - Decode headers
  - HTML to text conversion
- **Usage**: Processing incoming emails

**nodemailer 6.9.13**
- **Version**: 6.9.13
- **Purpose**: SMTP email sending
- **Features**:
  - SMTP transport
  - HTML emails
  - Attachments
  - OAuth2 support
- **Usage**: Sending outgoing emails

### Authentication & Security

**jsonwebtoken 9.0.2**
- **Version**: 9.0.2
- **Purpose**: JWT token generation/verification
- **Algorithm**: HS256
- **Expiration**: 7 days (configurable)
- **Secret**: Environment variable

**bcryptjs 2.4.3**
- **Version**: 2.4.3
- **Purpose**: Password hashing
- **Rounds**: 10
- **Why bcryptjs**: Pure JS (works without native compilation)
- **Alternative**: bcrypt (faster but requires compilation)

**helmet 7.1.0**
- **Version**: 7.1.0
- **Purpose**: Security headers
- **Headers**: CSP, X-Frame-Options, X-Content-Type-Options, etc.

**express-validator 7.0.1**
- **Version**: 7.0.1
- **Purpose**: Input validation
- **Features**: Sanitization, validation chains, error messages

**express-rate-limit 7.1.5**
- **Version**: 7.1.5
- **Purpose**: Rate limiting
- **Limits**:
  - General API: 100 req/15min
  - Chat: 30 req/min
  - Lead creation: 5 req/hour

**cors 2.8.5**
- **Version**: 2.8.5
- **Purpose**: CORS middleware
- **Config**: Allowed origins from environment

**compression 1.7.4**
- **Version**: 1.7.4
- **Purpose**: Response compression (gzip)

### AI Integration

**OpenAI 6.16.0**
- **Version**: 6.16.0
- **Purpose**: AI chatbot
- **Features**:
  - GPT-4 access
  - Conversation context
  - Lead capture integration
- **Usage**: Customer support chatbot

### Utility Libraries

**dotenv 16.4.5**
- **Version**: 16.4.5
- **Purpose**: Environment variables
- **Config**: `.env` file (not in git)

**axios 1.13.2**
- **Version**: 1.13.2
- **Purpose**: HTTP client (same as frontend)
- **Usage**: External API calls

**date-fns 4.1.0**
- **Version**: 4.1.0
- **Purpose**: Date manipulation (same as frontend)

### Development Tools

**nodemon 3.1.0**
- **Version**: 3.1.0
- **Purpose**: Auto-restart on file changes
- **Usage**: Development only (`npm run dev`)

---

## Admin Dashboard Stack

The project includes a separate admin dashboard with its own stack:

### Admin Backend

**Fastify 4.26.1**
- **Version**: 4.26.1
- **Purpose**: Web framework (faster than Express)
- **Why Fastify**: Performance, schema validation

**Bull 4.12.2**
- **Version**: 4.12.2
- **Purpose**: Job queue (Redis-backed)
- **Usage**: Background jobs, email queues

**ioredis 5.3.2**
- **Version**: 5.3.2
- **Purpose**: Redis client
- **Usage**: Bull queue, caching

**Postmark 4.0.2**
- **Version**: 4.0.2
- **Purpose**: Transactional email service
- **Usage**: Admin notifications

**Winston 3.11.0**
- **Version**: 3.11.0
- **Purpose**: Logging
- **Usage**: Structured logging

**Pino 8.19.0**
- **Version**: 8.19.0
- **Purpose**: High-performance logging
- **Usage**: JSON logging

**@fastify/jwt 8.0.0**
- **Version**: 8.0.0
- **Purpose**: JWT authentication for Fastify

**@fastify/swagger 8.14.0**
- **Version**: 8.14.0
- **Purpose**: OpenAPI/Swagger documentation

**@fastify/websocket 10.0.1**
- **Version**: 10.0.1
- **Purpose**: WebSocket support in Fastify

---

## DevOps & Infrastructure

### Web Server

**Nginx** (Latest stable)
- **Version**: 1.18+
- **Purpose**: Reverse proxy, static file serving
- **Features**:
  - SSL/TLS termination
  - HTTP/2 support
  - Gzip compression
  - Caching
  - WebSocket upgrade
- **Status**: Production Ready ✅

### SSL/TLS

**Let's Encrypt**
- **Purpose**: Free SSL certificates
- **Tool**: Certbot
- **Renewal**: Automatic (cron job)
- **Certificate Path**: `/etc/letsencrypt/live/ementech.co.ke/`

### Process Management

**PM2** (Latest)
- **Version**: 5.x
- **Purpose**: Node.js process manager
- **Features**:
  - Auto-restart on crash
  - Log management
  - Cluster mode (available)
  - Environment management
  - Monitoring (`pm2 monit`)
- **Process Name**: `ementech-backend`
- **Status**: Production Ready ✅

### Operating System

**Ubuntu Linux**
- **Version**: 6.14.0-37-generic
- **Purpose**: Server OS
- **VPS Provider**: Linode (IP: 69.164.244.165)

### Database

**MongoDB**
- **Version**: 4.4+
- **Purpose**: NoSQL database
- **Location**: Same VPS or MongoDB Atlas
- **Management**: Command line or GUI tools

---

## Development Tools

### Version Control

**Git**
- **Version**: Latest
- **Repository**: Local (`.git` directory)
- **Branch**: `main`
- **Recent Commits**: Logo refinements, file cleanup

### Code Quality

**ESLint** (Frontend)
- **Version**: 9.39.1
- **Purpose**: Code linting
- **Configuration**: `eslint.config.js`

**TypeScript** (Type Safety)
- **Version**: 5.9.3
- **Purpose**: Static typing
- **Coverage**: Frontend + (partial backend)

### Build Tools

**Vite** (Frontend Build)
- **Version**: 7.2.4
- **Purpose**: Build and dev server
- **Features**: HMR, optimized production builds, code splitting

**PostCSS**
- **Version**: 8.5.6
- **Purpose**: CSS processing
- **Plugins**: Autoprefixer, Tailwind CSS

**Autoprefixer**
- **Version**: 10.4.23
- **Purpose**: CSS vendor prefixes

---

## Testing Stack

### Current Status
**No automated tests found in main project**

### Recommended Testing Stack (Not Implemented)

**Jest**
- **Purpose**: Unit testing
- **Availability**: Not in use

**React Testing Library**
- **Purpose**: React component testing
- **Availability**: Not in use

**Supertest**
- **Purpose**: API endpoint testing
- **Availability**: Not in use

**Cypress**
- **Purpose**: E2E testing
- **Availability**: Not in use

---

## CI/CD Stack

### Current Status
**No CI/CD pipeline configured**

### Recommended Tools (Not Implemented)

**GitHub Actions**
- **Purpose**: CI/CD automation
- **Availability**: Repository is Git-based but no actions configured

**Docker**
- **Purpose**: Containerization
- **Availability**: Not in use

**Kubernetes**
- **Purpose**: Orchestration
- **Availability**: Not in use

---

## Monitoring & Observability

### Current Implementation

**PM2 Monitoring**
- **Purpose**: Process monitoring
- **Command**: `pm2 monit`
- **Features**: CPU, memory, logs

**Nginx Logs**
- **Access Log**: `/var/log/nginx/access.log`
- **Error Log**: `/var/log/nginx/error.log`

**Application Logs**
- **Backend**: PM2 logs (`pm2 logs ementech-backend`)
- **Frontend**: Browser console

### Recommended Tools (Not Implemented)

**Sentry** - Error tracking
**DataDog** - APM
**Prometheus** - Metrics
**Grafana** - Dashboards
**ELK Stack** - Log aggregation

---

## Performance Optimization

### Frontend

**Code Splitting**
- **Tool**: Vite automatic code splitting
- **Chunks**:
  - `react-vendor` (React, React DOM)
  - `framer-motion` (Animation library)
  - `icons` (Lucide, React Icons)

**Lazy Loading**
- **Usage**: Route-based lazy loading (can be implemented)

**Image Optimization**
- **Status**: Manual optimization (can use ImageNext or similar)

**Caching**
- **Strategy**: Browser caching headers (Nginx)

### Backend

**Database Indexes**
- **Coverage**: All models have appropriate indexes
- **Types**: Single, compound, text search

**Compression**
- **Tool**: Compression middleware (gzip)
- **Coverage**: All API responses

**Rate Limiting**
- **Purpose**: Prevent abuse
- **Coverage**: All API endpoints

**Connection Pooling**
- **MongoDB**: Automatic (Mongoose)
- **Status**: Optimized for production

---

## Security Stack

### Network Security

**SSL/TLS**
- **Provider**: Let's Encrypt
- **Protocol**: TLS 1.2+
- **Certificate**: Auto-renew

**Firewall**
- **Status**: Recommended but not configured
- **Tool**: ufw (Uncomplicated Firewall)

**Fail2ban**
- **Status**: Recommended but not configured
- **Purpose**: SSH brute-force protection

### Application Security

**Helmet.js**
- **Version**: 7.1.0
- **Purpose**: Security headers
- **Coverage**: All HTTP responses

**CORS**
- **Version**: 2.8.5
- **Purpose**: Cross-origin restrictions
- **Config**: Whitelist only

**Rate Limiting**
- **Version**: 7.1.5
- **Purpose**: DDoS prevention
- **Coverage**: All endpoints

**JWT Authentication**
- **Version**: 9.0.2
- **Purpose**: Token-based auth
- **Expiration**: 7 days

**Password Hashing**
- **Library**: bcryptjs 2.4.3
- **Rounds**: 10
- **Purpose**: Secure password storage

**Input Validation**
- **Library**: express-validator 7.0.1
- **Purpose**: Prevent injection attacks
- **Coverage**: User inputs

---

## Third-Party APIs & Services

### Email Services

**IMAP Server**
- **Purpose**: Incoming email (CWD startup)
- **Protocol**: IMAP (port 993)
- **Authentication**: Encrypted credentials

**SMTP Server**
- **Purpose**: Outgoing email
- **Protocol**: SMTP (port 587)
- **Authentication**: Encrypted credentials

### AI Services

**OpenAI API**
- **Purpose**: AI chatbot
- **Models**: GPT-4
- **Features**: Natural language processing

### Transactional Email (Admin)

**Postmark**
- **Purpose**: Admin dashboard emails
- **Status**: Admin backend only

---

## Dependency Analysis

### Total Dependencies Count
- **Frontend**: 40+ packages
- **Backend**: 30+ packages
- **Admin Dashboard**: 20+ packages
- **Dev Dependencies**: 20+ packages

### Critical Dependencies (Production)
```
React 19.2.0
Express 4.19.2
Socket.IO 4.8.3
Mongoose 8.0.0
IMAP 0.8.19
JWT 9.0.2
Bcryptjs 2.4.3
Axios 1.13.2
```

### Vulnerability Status
**Not scanned** - Run `npm audit` to check for vulnerabilities

### Outdated Packages
**Not checked** - Run `npm outdated` to find updates

---

## License Summary

All dependencies use **permissive licenses**:
- **MIT**: Most packages (React, Express, etc.)
- **Apache 2.0**: Some packages
- **BSD**: Few packages

**No GPL or copyleft licenses detected** ✅

---

## Environment Variables

### Frontend (.env.production)
```bash
VITE_API_URL=https://api.ementech.co.ke
VITE_SITE_URL=https://ementech.co.ke
```

### Backend (.env)
```bash
PORT=5001
NODE_ENV=production
MONGODB_URI=mongodb://...
CORS_ORIGIN=https://ementech.co.ke,https://www.ementech.co.ke
JWT_SECRET=...
JWT_EXPIRE=7d

# Email IMAP
IMAP_HOST=...
IMAP_PORT=993
IMAP_USER=...
IMAP_PASSWORD=...

# Email SMTP
SMTP_HOST=...
SMTP_PORT=587
SMTP_USER=...
SMTP_PASSWORD=...

# OpenAI
OPENAI_API_KEY=...
```

---

## Version Compatibility Matrix

| Component | Version | Node.js | MongoDB |
|-----------|---------|---------|---------|
| React | 19.2.0 | N/A | N/A |
| Express | 4.19.2 | 18+ | N/A |
| Mongoose | 8.0.0 | 18+ | 4.4+ |
| Socket.IO | 4.7.5 | 18+ | N/A |
| IMAP | 0.8.19 | 14+ | N/A |
| Vite | 7.2.4 | 18+ | N/A |

---

## Technology Debt

### Missing Technologies
1. **Testing Framework** - No Jest, Cypress, etc.
2. **CI/CD Pipeline** - No GitHub Actions, GitLab CI
3. **Containerization** - No Docker, Kubernetes
4. **Monitoring** - No Sentry, DataDog
5. **API Documentation** - No Swagger/OpenAPI
6. **Redis** - Would improve Socket.IO scaling

### Upgrade Recommendations
1. **Redis** - Add for Socket.IO session storage
2. **Docker** - Containerize for easier deployment
3. **Jest** - Add automated testing
4. **Sentry** - Add error tracking
5. **Swagger** - Add API documentation

---

## Technology Strengths

1. **Modern Stack** - React 19, latest dependencies
2. **Real-time** - Socket.IO for instant updates
3. **Type Safety** - TypeScript on frontend
4. **Email System** - Production-grade IMAP/SMTP
5. **Security** - Multiple layers (JWT, CORS, rate limiting)
6. **Performance** - Vite, code splitting, compression

---

## Technology Weaknesses

1. **No Testing** - Zero automated tests
2. **No CI/CD** - Manual deployment only
3. **No Monitoring** - Basic logs only
4. **No Redis** - Memory-based Socket.IO (can't scale)
5. **No Containerization** - Direct PM2 deployment
6. **No API Docs** - No Swagger/OpenAPI

---

## Conclusion

The Ementech website uses a **modern, production-ready stack** with cutting-edge technologies (React 19) and real-time capabilities (Socket.IO, IMAP). The email system is particularly impressive, featuring full IMAP integration with real-time push.

**Recommendations**:
1. Add automated testing (Jest + Cypress)
2. Implement CI/CD pipeline
3. Add Redis for Socket.IO scaling
4. Set up monitoring (Sentry + DataDog)
5. Document APIs with Swagger
6. Containerize with Docker

**Overall Stack Quality**: 8/10
- Modern technologies ✅
- Email system excellent ✅
- Security good ✅
- Testing missing ❌
- CI/CD missing ❌
- Monitoring basic ⚠️

---

**Documentation Version**: 1.0.0
**Last Updated**: 2026-01-21
