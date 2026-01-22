# EmenTech Marketing Ecosystem - Architecture Document

## Overview

This document defines the approved architectural decisions for the EmenTech Marketing Ecosystem upgrade.

---

## System Architecture

```
+-----------------------------------------------------------------------------------+
|                              FRONTEND LAYER                                        |
|  +------------------+  +------------------+  +------------------+                  |
|  | Public Website   |  | Admin Dashboard  |  | Employee Portal  |                  |
|  | (React/Vite)     |  | (React/Vite)     |  | (React/Vite)     |                  |
|  | Port: 5173       |  | Port: 5174       |  | (Future)         |                  |
|  +--------+---------+  +--------+---------+  +--------+---------+                  |
+-----------+--------------------+--------------------+-----------------------------+
            |                    |                    |
            v                    v                    v
+-----------------------------------------------------------------------------------+
|                        UNIFIED BACKEND (Express.js)                                |
|                              Port: 5000                                            |
|  +-------------+  +-------------+  +-------------+  +-------------+               |
|  | Marketing   |  | Employee    |  | Analytics   |  | Email       |               |
|  | Campaigns   |  | Management  |  | Dashboard   |  | System      |               |
|  | Sequences   |  | Permissions |  | Reports     |  | Templates   |               |
|  | A/B Testing |  | Auto-Email  |  | Real-time   |  | Bulk Send   |               |
|  +-------------+  +-------------+  +-------------+  +-------------+               |
+-----------------------------------------------------------------------------------+
            |                    |                    |
            v                    v                    v
+-----------------------------------------------------------------------------------+
|                           INFRASTRUCTURE                                           |
|  +-------------+  +-------------+  +-------------+  +-------------+               |
|  | MongoDB     |  | Socket.IO   |  | Bull Queue  |  | Redis       |               |
|  | (Data)      |  | (Real-time) |  | (Email Jobs)|  | (Cache)     |               |
|  +-------------+  +-------------+  +-------------+  +-------------+               |
+-----------------------------------------------------------------------------------+
```

---

## Technology Stack

### Frontend
| Component | Technology | Status |
|-----------|------------|--------|
| Public Website | React 18 + Vite + TypeScript | EXISTING |
| Admin Dashboard | React 18 + Vite + TypeScript | TO BE REBUILT |
| Styling | Tailwind CSS | EXISTING |
| State Management | React Context + Hooks | EXISTING |
| HTTP Client | Axios/Fetch | EXISTING |
| Real-time | Socket.IO Client | EXISTING |

**Decision**: LOCKED - Admin dashboard will be rebuilt as React/Vite (approved by human)

### Backend
| Component | Technology | Status |
|-----------|------------|--------|
| Framework | Express.js | EXISTING |
| Database | MongoDB + Mongoose | EXISTING |
| Authentication | JWT | EXISTING |
| Real-time | Socket.IO | EXISTING |
| Email Sending | Nodemailer | EXISTING |
| Job Queue | Bull + Redis | TO BE ADDED |
| Caching | Redis | TO BE ADDED |

### External Integrations
| Integration | Provider | Status |
|-------------|----------|--------|
| Company Email | mail.ementech.co.ke | TO BE INTEGRATED |
| Social - LinkedIn | LinkedIn API (OAuth 2.0) | TO BE INTEGRATED |
| Social - Twitter/X | Twitter API v2 (OAuth 2.0) | TO BE INTEGRATED |

**Decision**: LOCKED - Integrate LinkedIn + Twitter/X for social marketing (approved by human)

---

## Directory Structure

### Backend (`/backend/src/`)
```
backend/src/
+-- config/           # Configuration files
+-- controllers/      # Route handlers
+-- middleware/       # Express middleware
+-- models/           # Mongoose models
+-- routes/           # API route definitions
+-- services/         # Business logic services
+-- queues/           # Bull queue definitions (NEW)
+-- utils/            # Utility functions
+-- server.js         # Application entry point
```

### Admin Dashboard (`/admin-dashboard/`)
```
admin-dashboard/
+-- src/
|   +-- components/
|   |   +-- layout/       # AdminLayout, Sidebar, Header
|   |   +-- marketing/    # Campaign, Template, Sequence components
|   |   +-- leads/        # Lead list, pipeline, assignment
|   |   +-- employees/    # Employee management components
|   |   +-- analytics/    # Dashboard, reports, visualizations
|   |   +-- social/       # Social media components
|   +-- pages/            # Page components
|   +-- services/         # API service functions
|   +-- contexts/         # React contexts
|   +-- hooks/            # Custom hooks
```

---

## Data Models

### Core Models (Existing - To Be Extended)
- `User.js` - Add employee fields, permissions, invitation system
- `Lead.js` - Add assignment, pipeline stages, tags
- `Newsletter.js` - Extend Campaign schema
- `Analytics.js` - Add campaign, social, pipeline metrics

### New Models (To Be Created)
- `EmailTemplate.js` - Email template management
- `EmailSequence.js` - Automated sequence definitions
- `SequenceEnrollment.js` - Lead enrollment tracking
- `ABTest.js` - A/B testing configuration and results
- `SocialConnection.js` - OAuth connections for social platforms

---

## API Design

### Naming Convention
- RESTful endpoints: `/api/[resource]/[action]`
- Plural nouns for collections: `/api/employees`, `/api/leads`
- Nested resources: `/api/employees/:id/performance`

### Authentication
- JWT tokens in Authorization header
- Role-based access control (admin, manager, employee)
- Permission-based actions per resource

### New Route Groups
| Route Group | Base Path | Purpose |
|-------------|-----------|---------|
| Employees | `/api/employees` | Employee management |
| Marketing | `/api/marketing` | Campaign management |
| Templates | `/api/templates` | Email template CRUD |
| Sequences | `/api/sequences` | Automated sequences |
| A/B Tests | `/api/abtests` | A/B testing |
| Social | `/api/social` | Social media integration |
| Analytics | `/api/analytics` | Enhanced analytics |

---

## Security Requirements

1. **Password Storage**: bcrypt with salt rounds >= 10
2. **Token Encryption**: AES-256 for OAuth tokens
3. **API Authentication**: JWT with short expiry (1h access, 7d refresh)
4. **Rate Limiting**: Implement on bulk operations
5. **Input Validation**: Joi/express-validator on all endpoints
6. **CORS**: Configured for known frontend origins only

---

## Performance Requirements

1. **Bulk Email**: Must use Bull queue (no synchronous sending)
2. **Real-time Updates**: Socket.IO for live dashboard updates
3. **Database Indexes**: Required on frequently queried fields
4. **Caching**: Redis for analytics aggregations
5. **Pagination**: Required on all list endpoints (default: 20 items)

---

## Environment Variables (New)

```env
# Redis (for Bull queue and caching)
REDIS_URL=redis://localhost:6379

# Social Media OAuth
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
LINKEDIN_REDIRECT_URI=

TWITTER_CLIENT_ID=
TWITTER_CLIENT_SECRET=
TWITTER_REDIRECT_URI=

# Mail Server Admin API
MAIL_ADMIN_API_KEY=
MAIL_ADMIN_API_URL=
```

---

**Document Status**: APPROVED
**Created**: 2026-01-22
**Last Updated**: 2026-01-22
**Locked Decisions**:
- Admin Dashboard: React/Vite rebuild (Human Approved)
- Social Integration: LinkedIn + Twitter/X (Human Approved)
- Employee Email: Auto-create on mail.ementech.co.ke (Human Approved)
