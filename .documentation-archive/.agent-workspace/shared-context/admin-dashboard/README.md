# EmenTech Admin Dashboard - Architecture Documentation

## Overview

This directory contains comprehensive architecture documentation for the EmenTech Admin Dashboard system - a modern, scalable monitoring and analytics platform designed to manage multiple websites and services.

## System Purpose

The Admin Dashboard provides:
- Real-time health monitoring for multiple websites
- Comprehensive analytics tracking and visualization
- Centralized management interface for all monitored services
- Alert and notification system
- Historical data analysis and trend reporting

## Current Monitored Services

1. **EmenTech** (ementech.co.ke)
   - Backend: Node.js/Express (port 5001)
   - Frontend: React + Vite
   - Database: MongoDB Atlas
   - Email: Postmark/Dovecot

2. **Dumuwaks** (app.ementech.co.ke)
   - Backend: Node.js/Express (port 5000)
   - Frontend: React + Vite (PWA)
   - Database: MongoDB (shared)
   - Features: Bookings, payments, technician matching

## Infrastructure

- **VPS**: 69.164.244.165
- **Process Manager**: PM2
- **Reverse Proxy**: Nginx
- **Database**: MongoDB Atlas
- **Real-time**: Socket.IO

## Documentation Structure

### Core Architecture Documents

1. **architecture.md** - Complete system architecture design
   - High-level architecture pattern
   - Component design
   - Technology stack justification
   - Scalability considerations

2. **data-model.md** - Database schema and relationships
   - MongoDB collections
   - Document structures
   - Indexing strategy
   - Relationship definitions

3. **api-spec.md** - RESTful API specification
   - All endpoints with request/response formats
   - Authentication requirements
   - Rate limiting rules
   - Error handling

4. **monitoring-strategy.md** - Health monitoring system design
   - What to monitor
   - Monitoring intervals
   - Alert thresholds
   - Check implementations

5. **analytics-system.md** - Analytics tracking design
   - Data collection methods
   - Metrics tracked
   - Aggregation strategies
   - Visualization approach

6. **security-architecture.md** - Security design
   - Authentication (JWT + OAuth2)
   - Authorization (RBAC)
   - Data encryption
   - Audit logging

7. **tech-decisions.md** - Technology choices and trade-offs
   - Framework selections
   - Library choices
   - Infrastructure decisions
   - Future considerations

8. **implementation-roadmap.md** - Phased development plan
   - Phase 1: MVP (health monitoring)
   - Phase 2: Analytics integration
   - Phase 3: Advanced features
   - Phase 4: Multi-server support

9. **deployment-guide.md** - Deployment strategy
   - Environment setup
   - CI/CD pipeline
   - SSL/HTTPS configuration
   - Backup strategy

10. **wireframes.md** - UI/UX design specifications
    - Dashboard layouts
    - Component descriptions
    - User flow diagrams
    - Interaction patterns

## Architecture Artifacts

Located in `.agent-workspace/artifacts/`:

- **diagrams/architecture-diagram.png** - System overview
- **diagrams/data-flow.png** - Data flow diagram
- **diagrams/deployment-architecture.png** - Deployment architecture
- **wireframes/** - UI mockups and wireframes

## Key Design Principles

1. **Scalability**: Designed to monitor hundreds of websites
2. **Real-time**: WebSocket-based live monitoring
3. **Modularity**: Microservices-ready architecture
4. **Security**: Enterprise-grade security measures
5. **Performance**: Optimized for high-frequency monitoring
6. **Maintainability**: Clean code architecture and documentation
7. **Extensibility**: Easy to add new monitoring capabilities

## Technology Stack Summary

### Frontend
- **Framework**: Next.js 14 (App Router)
- **UI Library**: shadcn/ui + Radix UI
- **Styling**: Tailwind CSS
- **Charts**: Recharts + D3.js
- **State Management**: Zustand + React Query
- **Real-time**: Socket.IO Client

### Backend
- **Runtime**: Node.js 20 LTS
- **Framework**: Fastify (high performance)
- **Real-time**: Socket.IO
- **Job Scheduler**: Bull (Redis-based)
- **Monitoring**: Node.js built-in + custom agents

### Database
- **Primary**: MongoDB Atlas (existing)
- **Cache**: Redis (sessions, rate limiting, job queues)
- **Time-series**: MongoDB with time-series collections

### Infrastructure
- **Hosting**: Same VPS (initially)
- **Domain**: admin.ementech.co.ke
- **SSL**: Let's Encrypt (auto-renew)
- **Process Manager**: PM2
- **Reverse Proxy**: Nginx

## Quick Reference

### Key Features
- Multi-site health monitoring
- Real-time status updates
- Analytics tracking (Google Analytics style)
- Alert management
- Historical data and trends
- User management with RBAC
- Audit logging
- API access

### Monitoring Capabilities
- Uptime checks (1-5 min intervals)
- Response time tracking
- SSL certificate expiry monitoring
- Domain expiry tracking
- Server resource monitoring
- PM2 process status
- Nginx status
- Database connection pool
- Error rate tracking

### Analytics Metrics
- Page views
- Unique visitors
- Geographic distribution
- Referrer tracking
- Device/browser breakdown
- Popular pages
- Entry/exit pages
- Session duration
- Conversion funnels

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Internet                           │
└──────────────────────────┬──────────────────────────────┘
                           │
                   ┌───────▼────────┐
                   │  Nginx Reverse │
                   │     Proxy      │
                   └───────┬────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
┌───────▼────────┐ ┌───────▼────────┐ ┌──────▼──────┐
│   EmenTech     │ │    Admin       │ │   Dumuwaks  │
│   Frontend     │ │   Dashboard    │ │   Frontend  │
│   (:3001)      │ │   (:3000)      │ │   (:3002)   │
└────────────────┘ └───────┬────────┘ └─────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
┌───────▼────────┐ ┌───────▼────────┐ ┌──────▼──────┐
│   EmenTech     │ │  Admin Dash    │ │   Dumuwaks  │
│   Backend      │ │   Backend      │ │   Backend   │
│   (:5001)      │ │   (:5050)      │ │   (:5000)   │
└───────┬────────┘ └───────┬────────┘ └─────────────┘
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
┌───────▼────────┐ ┌───────▼────────┐ ┌──────▼──────┐
│  MongoDB Atlas │ │     Redis      │ │   Socket.IO │
│   (Primary)    │ │    (Cache)     │ │   (Realtime)│
└────────────────┘ └────────────────┘ └─────────────┘
```

## Getting Started

For implementation team:
1. Review all architecture documents
2. Study data models and API specifications
3. Set up development environment (see deployment-guide.md)
4. Follow implementation-roadmap.md for phased development
5. Refer to wireframes.md for UI implementation

## Support and Maintenance

- **Documentation Owner**: Architecture Team
- **Last Updated**: 2025-01-20
- **Version**: 1.0.0
- **Status**: Architecture Design Complete

For questions or clarifications, refer to specific documentation files or create an escalation request in `.agent-workspace/escalations/`.
