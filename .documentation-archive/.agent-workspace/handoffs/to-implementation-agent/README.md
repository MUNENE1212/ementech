# EmenTech Email System - Implementation Handoff

**Project**: EMENTECH-EMAIL-001  
**Date**: January 19, 2026  
**From**: System Architecture Agent  
**To**: Implementation Agent  

---

## Executive Summary

This handoff package provides complete architecture, technical specifications, and implementation guidance for building an enterprise-grade, real-time email system for EmenTech Technologies.

### Vision
Build a modern, accessible, real-time email client that:
- Delivers emails instantly using IMAP IDLE + Socket.IO
- Achieves WCAG 2.1 AA accessibility compliance
- Scales seamlessly from 5 to 100+ users
- Integrates with existing Postfix + Dovecot email server
- Runs efficiently on 2GB RAM VPS

### Key Constraints
- **Resources**: 2GB RAM VPS, Ubuntu 24.04 LTS
- **Existing Infrastructure**: nginx, MongoDB, Node.js, Postfix, Dovecot
- **Timeline**: 3 weeks (per project plan)
- **Accessibility**: WCAG 2.1 AA mandatory (85+ Lighthouse score)
- **Performance**: < 2s email delivery, < 200ms API response

---

## Quick Start Guide

### Phase 1: Foundation (Days 1-3)
1. **Set up project structure**
   ```bash
   mkdir -p /var/www/ementech-email/{frontend,backend,shared}
   cd /var/www/ementech-email
   ```

2. **Initialize backend**
   ```bash
   cd backend
   npm init -y
   npm install express socket.io mongoose jsonwebtoken bcrypt zod cors
   npm install -D typescript @types/node @types/express
   ```

3. **Initialize frontend**
   ```bash
   cd ../frontend
   npm create vite@latest . -- --template react-ts
   npm install zustand @radix-ui/react-* socket.io-client react-hook-form zod
   npm install -D tailwindcss postcss autoprefixer
   ```

4. **Connect to MongoDB**
   ```typescript
   // backend/src/config/database.ts
   import mongoose from 'mongoose';
   
   mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ementech_email');
   ```

### Phase 2: Core Features (Days 4-10)
1. Implement authentication (JWT)
2. Build IMAP monitor daemon
3. Create Socket.IO integration
4. Implement email CRUD operations
5. Build React email components

### Phase 3: Polish & Launch (Days 11-21)
1. WCAG 2.1 AA compliance testing
2. Performance optimization
3. Load testing
4. Security audit
5. Production deployment

---

## Critical Architecture Decisions

### 1. Real-Time Architecture
**Choice**: Socket.IO + IMAP IDLE  
**Why**: 
- Instant push notifications (no polling)
- Bidirectional communication
- Automatic reconnection
- Room-based user targeting

**Implementation**:
```typescript
// Server
io.to(`user:${userId}`).emit('email:new', email);

// Client
socket.on('email:new', (email) => {
  // Update UI
});
```

### 2. State Management
**Choice**: Zustand  
**Why**:
- Lightweight (3KB vs Redux 15KB)
- TypeScript-first
- No boilerplate
- Simple async actions

### 3. UI Component Library
**Choice**: Radix UI + Tailwind CSS  
**Why**:
- Unstyled, accessible primitives
- WCAG 2.1 AA ready out of box
- Full keyboard navigation
- Screen reader support
- Consistent with existing EmenTech apps

### 4. Database Choice
**Choice**: MongoDB (already in use)  
**Why**:
- Flexible schema for email data
- Document model fits hierarchical email structure
- Existing infrastructure
- Good at read-heavy workloads

### 5. Authentication
**Choice**: JWT (stateless)  
**Why**:
- Scalable (no server-side session storage)
- Works with Socket.IO authentication
- Industry standard
- Easy integration with existing systems

---

## File Structure

```
/var/www/ementech-email/
├── backend/
│   ├── src/
│   │   ├── config/         # Database, Socket.IO, IMAP config
│   │   ├── models/         # Mongoose schemas
│   │   ├── routes/         # Express routes
│   │   ├── services/       # Business logic
│   │   ├── middleware/     # Auth, validation, error handling
│   │   ├── socket/         # Socket.IO handlers
│   │   └── workers/        # Background processes (IMAP monitor)
│   ├── dist/               # Compiled TypeScript
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/         # Radix UI primitives
│   │   │   ├── email/      # Email components
│   │   │   ├── contacts/   # Contact components
│   │   │   └── shared/     # Shared components
│   │   ├── pages/          # Route pages
│   │   ├── stores/         # Zustand stores
│   │   ├── hooks/          # Custom hooks
│   │   ├── utils/          # Helper functions
│   │   └── types/          # TypeScript types
│   ├── dist/               # Built React app
│   ├── package.json
│   └── vite.config.ts
└── shared/
    ├── types/              # Shared TypeScript types
    └── constants/          # Shared constants
```

---

## Key Implementation Checklist

### Must-Have Features (MVP)
- [ ] User authentication (JWT login/logout)
- [ ] Real-time email delivery (IMAP IDLE + Socket.IO)
- [ ] Email list (inbox, sent, drafts, trash)
- [ ] Email view (read individual emails)
- [ ] Compose/reply/forward emails
- [ ] Email search (full-text search)
- [ ] Folder management
- [ ] Labels/tags
- [ ] Contact management
- [ ] Desktop notifications
- [ ] Mobile responsive design
- [ ] WCAG 2.1 AA compliance

### Should-Have Features (Phase 2)
- [ ] Email filters (advanced filtering)
- [ ] Email threading
- [ ] Attachment handling
- [ ] Rich text editor
- [ ] Email signatures
- [ ] Keyboard shortcuts
- [ ] Email analytics
- [ ] Export/import emails

### Nice-to-Have (Future)
- [ ] Email scheduling
- [ ] CRM integration
- [ ] Multi-language support
- [ ] Dark mode
- [ ] Email templates
- [ ] Auto-responder
- [ ] Spam filtering UI

---

## Accessibility Requirements (WCAG 2.1 AA)

### Critical Requirements
1. **Keyboard Navigation**: All features accessible via keyboard
2. **Screen Reader Support**: Proper ARIA labels and roles
3. **Focus Indicators**: Visible focus on all interactive elements
4. **Color Contrast**: Minimum 4.5:1 for normal text
5. **Text Scaling**: Support 200% zoom without breaking
6. **Form Labels**: All inputs have associated labels
7. **Error Messages**: Accessible error announcements

### Testing Checklist
- [ ] Test with NVDA screen reader (Windows) or VoiceOver (Mac)
- [ ] Test keyboard-only navigation
- [ ] Run axe DevTools audit (target: 85+ score)
- [ ] Test high contrast mode (Windows)
- [ ] Test browser zoom at 200%
- [ ] Verify color contrast with WebAIM Contrast Checker
- [ ] Test with screen magnification software

---

## Performance Targets

### API Response Times
- **Email list fetch**: < 200ms
- **Single email fetch**: < 100ms
- **Send email**: < 500ms
- **Search query**: < 500ms
- **Contact operations**: < 200ms

### Real-Time Performance
- **Email delivery time**: < 2s (from IMAP to UI)
- **Socket.IO latency**: < 100ms
- **Connection time**: < 1s

### Frontend Performance
- **Initial load**: < 3s
- **Time to interactive**: < 5s
- **Lighthouse performance**: ≥ 75
- **Lighthouse accessibility**: ≥ 85

---

## Security Checklist

### Authentication & Authorization
- [ ] JWT implementation with secure secret
- [ ] Password hashing with bcrypt (cost factor ≥ 10)
- [ ] Token expiration (7 days recommended)
- [ ] Route protection middleware
- [ ] Rate limiting on auth endpoints

### Data Protection
- [ ] Input validation on all endpoints (Zod schemas)
- [ ] SQL injection prevention (use parameterized queries)
- [ ] XSS protection (sanitize user input)
- [ ] CSRF protection (use SameSite cookies)
- [ ] Secure headers (helmet.js)

### IMAP Security
- [ ] IMAP credentials in environment variables
- [ ] TLS/SSL for IMAP connections
- [ ] Never log IMAP passwords
- [ ] Separate credentials per user

### API Security
- [ ] CORS configuration
- [ ] Rate limiting (100 req/15min per user)
- [ ] Request size limits (25MB for attachments)
- [ ] API versioning (/api/v1/...)

---

## Environment Variables

### Required Variables
```bash
# API Configuration
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://mail.ementech.co.ke

# MongoDB
MONGO_URI=mongodb://localhost:27017/ementech_email

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-characters
JWT_EXPIRES_IN=7d

# Email Server (IMAP)
IMAP_HOST=localhost
IMAP_PORT=993
IMAP_USER_TEMPLATE=%s@ementech.co.ke
IMAP_PASSWORD=secure-password

# SMTP (Postfix)
SMTP_HOST=localhost
SMTP_PORT=587

# Socket.IO
SOCKET_IO_CORS_ORIGIN=https://mail.ementech.co.ke

# Redis (Phase 2)
REDIS_URL=redis://localhost:6379
```

---

## Deployment Commands

### Backend Deployment
```bash
cd /var/www/ementech-email/backend
npm install
npm run build
pm2 start ecosystem.config.js
```

### Frontend Deployment
```bash
cd /var/www/ementech-email/frontend
npm install
npm run build
# Files go to /var/www/ementech-email/frontend/dist
```

### nginx Configuration
```nginx
server {
    listen 443 ssl http2;
    server_name mail.ementech.co.ke;

    # Frontend
    location / {
        root /var/www/ementech-email/frontend/dist;
        try_files $uri /index.html;
    }

    # API
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Socket.IO
    location /socket.io/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
    }
}
```

---

## Monitoring & Logging

### Key Metrics to Monitor
- API response times
- Socket.IO connection count
- IMAP connection status
- Email delivery times
- Error rates
- RAM usage (target: < 80%)
- Disk usage (target: < 80%)

### Logging Strategy
```typescript
// Use Winston for structured logging
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: '/var/log/ementech-email/error.log', level: 'error' }),
    new winston.transports.File({ filename: '/var/log/ementech-email/combined.log' })
  ]
});
```

---

## Testing Strategy

### Unit Tests (Vitest)
- Target: 80%+ code coverage
- Test all business logic
- Test utility functions
- Mock external dependencies

### Integration Tests
- Test API endpoints
- Test database operations
- Test Socket.IO events
- Test IMAP integration

### E2E Tests (Playwright)
- Test user flows (login, compose, read, delete)
- Test real-time features
- Test accessibility with axe-core
- Test mobile responsiveness

### Performance Tests
- Load test API endpoints (artillery or k6)
- Test concurrent Socket.IO connections
- Test database query performance

---

## Common Pitfalls to Avoid

### 1. IMAP Connection Pooling
**Problem**: Creating new IMAP connection for each request  
**Solution**: Use connection pool or singleton IMAP connection per user

### 2. Socket.IO Memory Leaks
**Problem**: Not cleaning up event listeners  
**Solution**: Always remove listeners on disconnect
```typescript
socket.on('disconnect', () => {
  socket.removeAllListeners();
});
```

### 3. Missing ARIA Labels
**Problem**: Poor accessibility  
**Solution**: Every interactive element needs aria-label or visible text

### 4. Blocking Operations
**Problem**: Synchronous IMAP operations block event loop  
**Solution**: Always use async/await, never block

### 5. Race Conditions
**Problem**: Multiple email updates conflict  
**Solution**: Use MongoDB transactions or versioning

---

## Support & Escalation

### Architecture Questions
- Review `.agent-workspace/shared-context/architecture.md`
- Check `.agent-workspace/shared-context/INDEX.md` for document index

### Technical Blockers
- Document in `.agent-workspace/escalations/pending/`
- Tag System Architect for review

### Process Questions
- Refer to `.agent-workspace/workflow/master-project-plan.md`
- Check `.agent-workspace/EMAIL-SYSTEM-ORCHESTRATION.md`

---

## Success Criteria

### Must Achieve (Go/No-Go)
- [ ] Zero critical bugs
- [ ] < 5 high-priority bugs
- [ ] Lighthouse accessibility ≥ 85
- [ ] Lighthouse performance ≥ 75
- [ ] All tests passing
- [ ] UAT approved
- [ ] Delivered within 3 weeks

### Should Achieve
- [ ] 80%+ test coverage
- [ ] < 2s real-time email delivery
- [ ] 100 concurrent users supported
- [ ] Zero security vulnerabilities
- [ ] 4/5+ user satisfaction

---

## Handoff Acceptance Criteria

Implementation Agent confirms:
- [ ] All architecture documents reviewed
- [ ] Technology stack understood
- [ ] File structure created
- [ ] Development environment set up
- [ ] MongoDB connected
- [ ] First API endpoint working
- [ ] Socket.IO connection established
- [ ] IMAP connection tested

**Handoff Accepted By**: _________________  
**Date**: _________________  
**Signature**: _________________

---

**Good luck with the implementation! The architecture is designed to be practical, scalable, and accessible. You have everything you need to succeed.**

🚀 Let's build something amazing!
