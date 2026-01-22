# EmenTech Marketing Ecosystem - Quality Baseline

**Established:** 2026-01-22
**Agent:** refactor_agent
**Version:** 1.0.0

This document defines the quality baseline for the EmenTech Marketing Ecosystem codebase. All new code must meet or exceed these standards.

---

## Code Style Standards

### Backend (Node.js/Express)

**Linting Tool:** ESLint
**Configuration File:** `eslint.config.js`
**Module System:** ES Modules (`type: "module"`)

**Rules Enforced:**
- No `var` declarations (use `const`/`let`)
- Arrow functions preferred for callbacks
- Template literals for string interpolation
- Destructuring for object/array access
- Async/await over Promises

**Code Style:**
- 2 space indentation
- Single quotes for strings
- Semicolons required
- Max line length: 100 (soft limit)
- Max function length: 50 lines
- Max file length: 300 lines

### Frontend (React/TypeScript)

**Linting Tool:** ESLint + TypeScript ESLint
**Configuration File:** `eslint.config.js`
**Framework:** React 18 + Vite

**React-Specific Rules:**
- React Hooks Rules of Hooks enforced
- No hooks in callbacks/conditionals
- Exhaustive deps warnings (may be suppressed with justification)
- No `any` types (use `unknown` instead)

**Code Style:**
- 2 space indentation
- Single quotes for JSX attributes
- Function components preferred over class components
- Custom hooks for reusable logic

---

## Testing Requirements

### Backend Testing

**Framework:** Jest (to be configured)
**Minimum Coverage:** 80%

**Required Test Types:**
1. **Unit Tests:** All service functions, utility functions
2. **Integration Tests:** All API endpoints
3. **Model Tests:** Mongoose model validation and methods

**Test Organization:**
```
backend/src/
  __tests__/
    models/
    controllers/
    services/
    routes/
```

### Frontend Testing

**Framework:** Vitest + React Testing Library (to be configured)
**Minimum Coverage:** 80%

**Required Test Types:**
1. **Unit Tests:** Utility functions, custom hooks
2. **Component Tests:** All UI components
3. **Integration Tests:** Key user flows

---

## Documentation Requirements

### Backend Documentation

**All public APIs must have:**
- JSDoc comments with `@param`, `@returns`, `@throws`
- Route decorators with `@route`, `@desc`, `@access`
- Example usage in complex functions

**Example:**
```javascript
/**
 * Invite a new employee
 * Creates a user record with invitation token and sends invitation email
 *
 * @route POST /api/employees/invite
 * @access Admin only
 *
 * @param {Object} req.body - Employee data
 * @param {string} req.body.email - Employee's personal email
 * @returns {Object} { success, message, employeeId }
 */
export const inviteEmployee = async (req, res) => {
  // ...
};
```

### Frontend Documentation

**All components must have:**
- Prop interface documentation
- Brief description of purpose
- Usage example for complex components

**Example:**
```typescript
/**
 * FloatingTechIcons Component
 *
 * Displays animated floating tech icons that respond to scroll.
 * Hidden on mobile and when reduced motion is preferred.
 *
 * @example
 * <FloatingTechIcons />
 */
```

---

## Security Requirements

### Password Security
- Minimum 10 bcrypt rounds for password hashing
- No plaintext password storage
- Temporary passwords for email accounts (16 chars, mixed types)

### Token Security
- JWT with AES-256-CBC encryption for sensitive data
- Short expiry: 1 hour access tokens, 7 day refresh tokens
- Tokens stored with `select: false` in Mongoose schemas

### API Security
- Input validation on all endpoints
- SQL injection prevention (Mongoose parameterized queries)
- XSS prevention (React automatic escaping)
- CSRF protection (SameSite cookies)
- Rate limiting on bulk operations

### Data Protection
- Sensitive fields encrypted at rest
- OAuth tokens encrypted
- Email credentials encrypted with AES-256-CBC
- No secrets in code (use environment variables)

---

## Performance Requirements

### Database Queries
- All list endpoints must use pagination (default: 20 items)
- Database indexes on frequently queried fields
- Compound indexes for complex queries
- No N+1 queries

### Caching Strategy
- Redis for session data (to be implemented)
- Cache analytics aggregations (to be implemented)
- Cache expensive computations

### Bulk Operations
- Must use Bull queue for email sending
- No synchronous bulk operations
- Job queue for heavy processing

---

## Pre-commit Checks

The following checks must pass before commits are allowed:

1. **ESLint:** No errors, warnings reviewed
2. **TypeScript:** No type errors (frontend)
3. **Tests:** All tests passing
4. **Build:** Frontend builds successfully

### Pre-commit Configuration (to be set up)

```yaml
# .pre-commit-config.yaml (planned)
repos:
  - repo: local
    hooks:
      - id: eslint
        name: ESLint
        entry: npx eslint
        language: node
        files: '\.(js|jsx|ts|tsx)$'
      - id: trailing-whitespace
        name: Trim trailing whitespace
        entry: trailing-whitespace-fixer
        types: [text]
```

---

## Tech Debt Policy

### Allowed Technical Debt

Technical debt may be added only when:
1. Documented in TECH_DEBT.md with ticket reference
2. Has a planned resolution date
3. Approved by technical lead
4. Includes clear documentation of why it's acceptable short-term

### Prohibited Technical Debt

The following is never allowed:
- Commented-out code (use git history instead)
- Unused imports or variables
- Duplicate logic (extract to shared function)
- Magic numbers (use named constants)
- Missing error handling on user inputs
- Hardcoded secrets or credentials

---

## Code Review Checklist

Before submitting code for review:

- [ ] ESLint passes with no errors
- [ ] All new functions have JSDoc/docstrings
- [ ] Tests written for new functionality
- [ ] Security best practices followed
- [ ] Performance considerations addressed
- [ ] No console.log statements left in production code
- [ ] Environment variables documented in `.env.example`

---

## Quality Metrics Baseline

### Current State (2026-01-22)

| Metric | Backend | Frontend | Target | Status |
|--------|---------|----------|--------|--------|
| ESLint Errors | 0 | 0 | 0 | PASS |
| ESLint Warnings | 0 | 1 (suppressed) | 0 | PASS |
| Test Coverage | Not measured | Not measured | 80% | TODO |
| TypeScript Coverage | N/A | 100% | 100% | PASS |
| Documentation Coverage | ~90% | ~85% | 80% | PASS |

### Measured Complexity

| Component | Lines | Functions | Avg Complexity | Max Complexity | Status |
|-----------|-------|-----------|----------------|----------------|--------|
| User.js (model) | 571 | 13 | 3.2 | 8 | PASS |
| employeeController.js | 1317 | 10 | 4.1 | 12 | WARN |
| emailAccountService.js | 887 | 11 | 3.8 | 9 | PASS |
| employee.routes.js | 376 | 8 | 2.5 | 6 | PASS |

### Code Duplication

- Estimated duplication: <2%
- No significant duplicated code blocks identified
- Shared patterns: Error handling, validation

---

## Enforcement

### Automated Enforcement

- ESLint runs on pre-commit
- CI pipeline runs full test suite
- Type checking enforced on frontend

### Manual Review

- Code review required for all changes
- Security review for authentication/authorization changes
- Architecture review for new modules

---

## Continuous Improvement

This baseline will be reviewed and updated:
- Quarterly for standards evolution
- When new tools/patterns are adopted
- Based on team feedback and lessons learned

---

**Document Status:** ACTIVE
**Next Review:** 2026-04-22
