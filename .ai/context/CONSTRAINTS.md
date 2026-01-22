# EmenTech Marketing Ecosystem - Project Constraints

This document defines the boundaries and limitations for the project implementation.

---

## Technical Constraints

### Must Use Existing Stack
- **Frontend**: React 18 + Vite + TypeScript + Tailwind CSS
- **Backend**: Express.js + MongoDB + Mongoose
- **Real-time**: Socket.IO
- **Reason**: Consistency with existing codebase, maintainability

### Infrastructure Requirements
- Redis required for Bull queue and caching
- PM2 or similar for queue worker management
- Existing mail server (mail.ementech.co.ke) for company emails

### Code Quality
- All new code must follow existing patterns in codebase
- TypeScript for frontend, JavaScript for backend (matching existing)
- ESLint/Prettier compliance
- Proper error handling on all API endpoints

### Security Non-Negotiables
- No plaintext password storage
- OAuth tokens must be encrypted at rest
- JWT authentication on all protected routes
- Input validation on all user inputs
- Rate limiting on bulk operations

---

## Business Constraints

### Sequential Phase Implementation
Phases must be implemented in order due to dependencies:
1. Phase 1 (Employee) - Foundation for assignments
2. Phase 2 (Leads) - Depends on employee model for assignment
3. Phase 3 (Marketing) - Core email infrastructure
4. Phase 4 (Sequences) - Depends on marketing/templates
5. Phase 5 (A/B Testing) - Depends on marketing infrastructure
6. Phase 6 (Social) - Can partially parallel
7. Phase 7 (Analytics) - Depends on data from all phases
8. Phase 8 (Admin UI) - Built alongside but finalized last

### Checkpoint Requirements
- Checkpoint required after each phase completion
- Human verification required before moving to next phase
- All tests must pass before checkpoint creation

### External Service Dependencies
- LinkedIn API credentials required for Phase 6
- Twitter/X API credentials required for Phase 6
- Mail server admin access required for Phase 1

---

## Operational Constraints

### No Breaking Changes
- Existing API endpoints must remain functional
- Database migrations must preserve existing data
- Backwards compatibility required

### Testing Requirements
- Unit tests for new services
- Integration tests for new API endpoints
- Manual verification checklist for each phase

### Documentation Requirements
- API documentation for all new endpoints
- Update README with new features
- Inline code comments for complex logic

---

## Resource Constraints

### Environment Variables
New environment variables must be:
- Documented in `.env.example`
- Never committed with actual values
- Validated at application startup

### Database Indexes
New indexes must be:
- Added via migration scripts
- Documented in model files
- Verified for query performance

---

## Escalation Triggers

The following situations MUST be escalated to human:
1. Any decision affecting the technology stack
2. External service API key requirements
3. Schema changes that might affect existing data
4. Security-related implementation decisions
5. Cost-incurring service integrations
6. Timeline-affecting blockers

---

**Document Status**: APPROVED
**Created**: 2026-01-22
**Last Updated**: 2026-01-22
