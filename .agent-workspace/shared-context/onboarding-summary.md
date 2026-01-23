# Ementech Website Project - Onboarding Summary

**Project ID**: ementech-website
**Analysis Date**: 2026-01-21
**Analyst**: Claude Code (Project Onboarding Specialist)
**Status**: Production Live
**Repository**: /media/munen/muneneENT/ementech/ementech-website

---

## Executive Summary

The Ementech website project is a full-stack corporate website for EmenTech (a Kenyan software company) with a sophisticated, production-tested IMAP email system built for a tech startup client (CWD). The project combines a React-based corporate frontend with an Express.js backend that features real-time email monitoring, AI chatbot capabilities, lead capture, and content management.

**Key Distinction**: This is NOT just a corporate website. It includes a fully functional, tested email management system that was built for and tested by a real startup (CWD). The email system with IMAP integration is a critical, production-grade component.

---

## Quick Facts

### Technology Stack
- **Frontend**: React 19.2.0, TypeScript, Vite 7.2.4, Tailwind CSS 3.4.19, Framer Motion 12.26.2
- **Backend**: Node.js, Express 4.19.2, Socket.IO 4.7.5
- **Database**: MongoDB (via Mongoose 8.0.0)
- **Email**: IMAP (imap 0.8.19), SMTP (nodemailer 6.9.13), mailparser 3.6.6
- **Authentication**: JWT (jsonwebtoken 9.0.2), bcryptjs 2.4.3
- **AI Integration**: OpenAI 6.16.0
- **Real-time**: Socket.IO client & server 4.8.3

### Production Status
- **Live URL**: https://ementech.co.ke
- **Deployment**: VPS at 69.164.244.165 (Ubuntu Linux 6.14.0-37-generic)
- **Process Manager**: PM2 (ementech-backend running on port 5001)
- **Web Server**: Nginx with Let's Encrypt SSL
- **Frontend Build**: Served as static files from /var/www/ementech-website/current
- **Backend Location**: /var/www/ementech-website/backend

### Project Structure
```
ementech-website/
├── backend/                    # Express.js API server
│   ├── src/
│   │   ├── config/            # Database, Socket.IO config
│   │   ├── controllers/       # Route handlers (email, auth, chat, lead, etc.)
│   │   ├── middleware/        # Auth, rate limiting, validation
│   │   ├── models/            # 31 MongoDB models
│   │   ├── routes/            # API route definitions
│   │   ├── services/          # IMAP watcher, AI chatbot
│   │   ├── utils/             # Helper functions
│   │   └── server.js          # Entry point
│   ├── logs/                  # Application logs
│   └── package.json
│
├── admin-dashboard/           # Separate admin dashboard (Fastify backend)
│   ├── backend/
│   ├── frontend/
│   └── shared/
│
├── src/                       # React frontend
│   ├── components/
│   │   ├── auth/             # Login, register components
│   │   ├── chat/             # AI chatbot interface
│   │   ├── email/            # Email inbox components
│   │   ├── layout/           # Header, footer
│   │   ├── lead-capture/     # Lead generation forms
│   │   ├── sections/         # Hero, services, products
│   │   └── ui/               # UI components
│   ├── pages/                # Route pages (13 pages)
│   ├── services/             # API service layer
│   ├── contexts/             # React contexts
│   └── App.tsx
│
├── public/                    # Static assets
├── deployment/                # Deployment scripts & configs
├── dist/                      # Frontend build output
└── documentation-archive/     # Historical documentation
```

---

## Critical Systems

### 1. Email/IMAP System (HIGH PRIORITY)
**Purpose**: Real-time email monitoring and management for CWD startup
**Status**: Fully tested and production-ready
**Technology**: IMAP protocol with IDLE/polling fallback
**Key Features**:
- Real-time email push via Socket.IO (IMAP IDLE) or 30-second polling
- Full email sync (INBOX, Sent, Drafts, Trash, Spam, Archive)
- Email sending via SMTP
- Folder management
- Label system
- Contact management with frequency tracking
- Thread tracking
- Attachment handling
- Search functionality

**Critical Files**:
- `/backend/src/controllers/emailController.js` (1067 lines)
- `/backend/src/services/imapWatcher.js` (342 lines)
- `/backend/src/routes/email.routes.js` (100 lines)
- `/backend/src/config/socket.js` (139 lines)
- `/backend/src/models/Email.js` (335 lines)

**API Endpoints**: 20+ email-related routes (see API documentation)

### 2. Authentication System
**Technology**: JWT with bcrypt password hashing
**Features**:
- JWT token authentication
- Password hashing (bcryptjs)
- Role-based access control
- Account activation/deactivation
- Protected routes middleware
- Socket.IO authentication

**Critical Files**:
- `/backend/src/middleware/auth.js`
- `/backend/src/controllers/authController.js`
- `/backend/src/models/User.js`

### 3. Real-time Communication (Socket.IO)
**Purpose**: Real-time updates for email, chat, notifications
**Features**:
- Email push notifications
- Read status updates
- Typing indicators
- Multi-client synchronization
- Room-based messaging (user-specific channels)

**Critical Files**:
- `/backend/src/config/socket.js`
- Socket.IO integration in server.js

### 4. AI Chatbot
**Purpose**: Intelligent customer support chatbot
**Technology**: OpenAI API
**Features**:
- Natural language processing
- Lead capture integration
- Conversation history tracking
- Context-aware responses

**Critical Files**:
- `/backend/src/services/aiChatbot.js`
- `/src/components/chat/`

---

## Database Schema Overview

**Total Models**: 31 MongoDB schemas

### Core Models
1. **User** - User accounts and authentication
2. **Email** - Email messages with full IMAP sync
3. **UserEmail** - User email account credentials (encrypted)
4. **Folder** - Email folder management
5. **Label** - User-defined email labels
6. **Contact** - Email contacts with frequency tracking

### Business Models
7. **Lead** - Lead capture and management
8. **Interaction** - User interactions tracking
9. **Conversation** - Chat conversations
10. **Message** - Chat messages
11. **AIConversation** - AI chatbot conversations
12. **Booking** - Booking/appointment system
13. **Analytics** - Analytics data

### Content Models
14. **Content** - CMS content
15. **Post** - Blog posts
16. **FAQ** - Frequently asked questions
17. **Event** - Events management
18. **Newsletter** - Newsletter subscriptions
19. **Review** - Customer reviews
20. **Portfolio** - Portfolio items
21. **ServiceCategory** - Service categories
22. **ServicePricing** - Service pricing
23. **SupportTicket** - Support tickets

### Advanced Models
24. **Matching** - User matching system
25. **MatchingInteraction** - Matching interactions
26. **MatchingPreference** - User matching preferences
27. **CategoryRequest** - Category requests
28. **DiagnosticFlow** - Diagnostic flows
29. **Notification** - User notifications
30. **PricingConfig** - Pricing configuration
31. **Transaction** - Financial transactions

---

## API Architecture

### Base URL
- **Development**: http://localhost:5001/api
- **Production**: https://ementech.co.ke/api

### Route Groups
1. **Email Routes** (`/api/email/*`) - 20 endpoints
2. **Auth Routes** (`/api/auth/*`) - Authentication
3. **Chat Routes** (`/api/chat/*`) - AI chatbot
4. **Lead Routes** (`/api/leads/*`) - Lead management
5. **Interaction Routes** (`/api/interactions/*`) - User interactions
6. **Content Routes** (`/api/content/*`) - CMS operations
7. **Analytics Routes** (`/api/analytics/*`) - Analytics data

### Rate Limiting
- General API: 100 requests/15 minutes
- Lead creation: 5 requests/hour
- Chat endpoint: 30 requests/minute
- Download endpoints: 10 requests/minute

---

## Frontend Architecture

### Pages (13 Total)
1. **HomePage** - Landing page with hero section
2. **AboutPage** - Company information
3. **ServicesPage** - Services overview
4. **ProductsPage** - Products showcase
5. **ContactPage** - Contact form
6. **CareersPage** - Job listings
7. **PrivacyPage** - Privacy policy
8. **TermsPage** - Terms of service
9. **EmailInbox** - Email management interface (CWD startup)
10. **LoginPage** - User authentication
11. **RegisterPage** - User registration
12. **ProfilePage** - User profile management
13. **SettingsPage** - User settings

### Component Categories
- **Auth Components** - Login, registration forms
- **Chat Components** - AI chatbot interface
- **Email Components** - Email inbox, compose, folders
- **Layout Components** - Header, footer
- **Lead Capture Components** - Lead generation forms
- **Section Components** - Hero, services, products
- **UI Components** - Reusable UI elements

### State Management
- React Context API for global state
- Custom hooks for specific functionality
- Socket.IO client for real-time updates

---

## Environment Configuration

### Required Environment Variables

#### Backend (.env)
```bash
# Server
PORT=5001
NODE_ENV=production

# Database
MONGODB_URI=mongodb://...

# CORS
CORS_ORIGIN=https://ementech.co.ke,https://www.ementech.co.ke

# JWT
JWT_SECRET=...
JWT_EXPIRE=7d

# Email IMAP (CWD Startup)
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

#### Frontend (.env.production)
```bash
VITE_API_URL=https://api.ementech.co.ke
VITE_SITE_URL=https://ementech.co.ke
```

---

## Deployment Architecture

### Production Environment
- **VPS**: Ubuntu Linux 6.14.0-37-generic
- **IP Address**: 69.164.244.165
- **Domain**: ementech.co.ke, www.ementech.co.ke
- **SSL**: Let's Encrypt (auto-renew)

### Process Management (PM2)
```bash
ementech-backend (PID: 1640) - Port 5001
```

### Web Server (Nginx)
- **HTTP (80)**: Redirects to HTTPS
- **HTTPS (443)**: Serves frontend static files and proxies API requests
- **Socket.IO**: WebSocket upgrade configured

### Directory Structure (Production)
```
/var/www/ementech-website/
├── backend/              # Backend application
├── current/              # Frontend build output
├── frontend/             # Previous builds
└── releases/             # Deployment history
```

---

## Known Issues & Technical Debt

### Critical Issues
**None identified** - System is production-stable

### Medium Priority
1. **Email Attachment Handling**: Attachments are tracked but not fully implemented for download
2. **Email Threading**: Thread ID exists but threading logic not fully implemented
3. **Admin Dashboard**: Separate admin dashboard exists but integration unclear

### Low Priority
1. **Test Coverage**: No automated tests found in main project
2. **API Documentation**: No OpenAPI/Swagger documentation
3. **Error Handling**: Some routes have generic error messages

---

## Key Dependencies

### Frontend Critical Dependencies
- react@19.2.0 (latest)
- react-router-dom@7.12.0
- socket.io-client@4.8.3
- axios@1.13.2
- framer-motion@12.26.2
- tailwindcss@3.4.19

### Backend Critical Dependencies
- express@4.19.2
- socket.io@4.7.5
- mongoose@8.0.0
- imap@0.8.19 (IMAP client)
- nodemailer@6.9.13 (SMTP client)
- mailparser@3.6.6 (email parsing)
- jsonwebtoken@9.0.2
- bcryptjs@2.4.3
- openai@6.16.0

---

## Development Setup

### Prerequisites
- Node.js 18+
- MongoDB 4.4+
- IMAP email account (for testing email system)

### Frontend Setup
```bash
cd /media/munen/muneneENT/ementech/ementech-website
npm install
npm run dev  # Development server on port 3000
npm run build  # Production build
```

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env  # Configure environment variables
npm run dev  # Development with nodemon
npm start  # Production
```

### Database Setup
```bash
# Ensure MongoDB is running
sudo systemctl start mongod

# Or use MongoDB Atlas connection string
```

---

## Testing the Email System (CWD Startup)

The email system has been tested and is production-ready. To test:

1. **Configure IMAP Credentials** in `.env`:
   ```bash
   IMAP_HOST=imap.example.com
   IMAP_PORT=993
   IMAP_USER=cwd@startup.com
   IMAP_PASSWORD=app_password
   ```

2. **Start Backend**:
   ```bash
   cd backend
   npm start
   ```

3. **Verify IMAP Watcher**:
   - Check logs for: `Starting IMAP watchers for X users...`
   - Should see: `Real-time email monitoring active`

4. **Test Email Sync**:
   - Send test email to configured address
   - Should see: `New email synced: [subject]`
   - Check browser console for Socket.IO `new_email` event

5. **Test Real-time Push**:
   - Login to EmailInbox page
   - Send email from external account
   - Email should appear instantly (via IMAP IDLE) or within 30s (polling)

---

## Security Implementation

### Implemented Security Measures
- SSL/TLS encryption (Let's Encrypt)
- Helmet.js security headers
- CORS configured for specific origins
- Rate limiting on all endpoints
- JWT authentication with expiration
- Password hashing (bcryptjs, 10 rounds)
- Input validation (express-validator)
- MongoDB injection prevention (native driver sanitization)
- XSS protection (React auto-escaping + helmet)

### Recommended Security Enhancements
- Configure firewall (ufw)
- Setup fail2ban for SSH protection
- Enable MongoDB authentication
- Implement automated backups
- Security audit on dependencies

---

## Monitoring & Maintenance

### Health Check Endpoint
```bash
curl https://ementech.co.ke/api/health
```

### PM2 Management
```bash
pm2 list
pm2 logs ementech-backend
pm2 restart ementech-backend
pm2 monit
```

### Nginx Management
```bash
systemctl status nginx
nginx -t  # Test configuration
systemctl reload nginx
```

### Log Locations
- Backend: `pm2 logs ementech-backend`
- Nginx access: `/var/log/nginx/access.log`
- Nginx error: `/var/log/nginx/error.log`

---

## Next Steps for Agents

### For Frontend Development
1. Review `/src/components/` for component patterns
2. Check `/src/pages/` for routing structure
3. Examine `/src/services/` for API integration patterns
4. Study `/src/contexts/` for state management

### For Backend Development
1. Review `/backend/src/controllers/` for business logic
2. Study `/backend/src/models/` for data structures
3. Check `/backend/src/routes/` for API endpoints
4. Examine `/backend/src/services/` for core services (IMAP, AI)

### For Email System Work (CWD Startup)
1. **CRITICAL**: Read `EMAIL_SYSTEM_EXPLAINED.md`
2. Study `/backend/src/services/imapWatcher.js`
3. Review `/backend/src/controllers/emailController.js`
4. Test with real IMAP account before deployment
5. Monitor Socket.IO connections in browser dev tools

### For DevOps/Deployment
1. Review `/deployment/` directory
2. Study `DEPLOYMENT.md` (557 lines)
3. Check PM2 ecosystem configuration
4. Verify Nginx configuration
5. Test SSL certificate renewal

---

## Important Notes

1. **Email System is Production-Critical**: The IMAP email system was built for and tested by CWD startup. It is NOT a demo or placeholder. Handle with care.

2. **Real-time Architecture**: The system uses Socket.IO extensively. Any changes must maintain WebSocket functionality.

3. **Multiple Projects**: The VPS hosts multiple projects (ementech-backend, dumuwaks-backend). Be careful when restarting PM2 processes.

4. **Documentation Archive**: Extensive historical documentation exists in `/documentation-archive/` but may be outdated. Trust current codebase over old docs.

5. **Admin Dashboard**: Separate admin dashboard exists but its relationship to main project is unclear. Investigate before integrating.

6. **MongoDB Models**: 31 models exist but not all are actively used. Check implementation before refactoring.

7. **Environment Variables**: Never commit `.env` files. Production secrets are on VPS, not in repository.

---

## Contact & Support

**Development Team**: EmenTech
**Project Location**: /media/munen/muneneENT/ementech/ementech-website
**Production URL**: https://ementech.co.ke
**VPS Access**: ssh root@69.164.244.165

**Emergency Commands**:
```bash
# Check if backend is running
pm2 list

# Restart backend
pm2 restart ementech-backend

# Check nginx
systemctl status nginx

# View logs
pm2 logs ementech-backend --lines 100
```

---

**Documentation Status**: Complete
**Last Updated**: 2026-01-21
**Version**: 1.0.0
