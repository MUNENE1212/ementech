# EmenTech Marketing Ecosystem - Technical Debt Register

**Last Updated:** 2026-01-22
**Maintained By:** refactor_agent

This document tracks all technical debt in the codebase. Technical debt is categorized by priority and tracked until resolution.

---

## Debt Addition Policy

Technical debt may be added when:
1. Time constraints require a temporary solution
2. Full implementation requires external dependencies not yet available
3. Migration from legacy patterns is in progress
4. A documented decision accepts technical trade-offs

**Required for each debt item:**
- Unique ID (TD-XXX)
- Priority (P0/P1/P2)
- Location in codebase
- Impact description
- Deadline for resolution
- Assigned to
- Status
- Created date

---

## P0 - Critical (Blockers)

**Current Count:** 0

No critical technical debt items. The codebase is production-ready.

---

## P1 - Important (Should Fix Soon)

**Current Count:** 2

### TD-001: Employee Controller File Size

**ID:** TD-001
**Priority:** P1
**Location:** `backend/src/controllers/employeeController.js`
**Impact:** The employee controller file is 1,317 lines, which impacts maintainability. As features grow, this file will become harder to navigate and maintain.

**Proposed Solution:** Split into smaller modules:
- `employeeController.js` - Core CRUD operations
- `employeeInvitationController.js` - Invitation-related endpoints
- `employeePerformanceController.js` - Performance metrics endpoints

**Deadline:** Phase 2 completion (2026-Q2)
**Assigned To:** implementation_agent
**Status:** TRACKED
**Created:** 2026-01-22

---

### TD-002: Test Coverage Not Measured

**ID:** TD-002
**Priority:** P1
**Location:** Backend and Frontend codebases
**Impact:** No automated testing infrastructure in place. Changes may introduce regressions that go undetected.

**Proposed Solution:**
1. Set up Jest for backend testing
2. Set up Vitest for frontend testing
3. Configure coverage reporting
4. Write initial tests for employee management endpoints
5. Set up CI/CD test running

**Deadline:** Phase 3 completion (2026-Q2)
**Assigned To:** implementation_agent
**Status:** TRACKED
**Created:** 2026-01-22

---

## P2 - Deferred (Track for Future)

**Current Count:** 1

### TD-003: Encryption Utilities in Multiple Files

**ID:** TD-003
**Priority:** P2
**Location:**
- `backend/src/models/UserEmail.js` (encrypt/decrypt methods)
- `backend/src/services/emailAccountService.js` (encrypt/decrypt functions)

**Impact:** Encryption logic is duplicated between UserEmail model and emailAccountService. This creates maintenance burden and risk of inconsistency.

**Proposed Solution:** Extract to shared utility module:
- Create `backend/src/utils/encryption.js`
- Centralize encryption key management
- Export standardized encrypt/decrypt functions

**Deadline:** Phase 4 completion (2026-Q3)
**Assigned To:** refactor_agent
**Status:** TRACKED
**Created:** 2026-01-22

---

## Resolved Debt

### TD-000: React Hooks Rules Violations (RESOLVED)

**ID:** TD-000
**Priority:** P1
**Location:** Frontend Hero components
**Impact:** React Hooks were being called conditionally and inside callbacks, violating Rules of Hooks and causing ESLint errors.

**Resolution:** All hooks violations fixed:
- Extracted `FloatingIconItem` component from `FloatingTechIcons.tsx`
- Extracted `StatItem` component from `HeroStats.tsx`
- Fixed conditional hook call in `HeroBackground.tsx`
- Fixed ref access during render in `useParticleSystem.ts`
- Fixed setState in useEffect in `useReducedMotion.ts`
- Changed `any` to `unknown` in `types.d.ts`

**Resolved Date:** 2026-01-22
**Assigned To:** refactor_agent
**Status:** RESOLVED

---

## Debt Metrics

| Priority | Count | Avg Age | Oldest Item | Resolution Rate |
|----------|-------|----------|--------------|-----------------|
| P0 | 0 | - | - | N/A |
| P1 | 2 | 0 days | TD-001 | 0% |
| P2 | 1 | 0 days | TD-003 | 0% |
| **Total** | **3** | **0 days** | **TD-001** | **0% (0 resolved)** |

---

## Prevention Strategies

To minimize new technical debt:

1. **Code Review:** All changes reviewed for quality standards
2. **Pre-commit Hooks:** ESLint checks before commits
3. **Architecture Review:** Major changes reviewed against ARCHITECTURE.md
4. **Documentation:** Complex decisions documented in DECISIONS.md
5. **Refactoring:** Regular refactoring sprints planned
6. **Testing:** Test coverage requirement enforced

---

## Debt Review Schedule

- **Weekly:** Review P0 items (escalate if not resolved)
- **Bi-weekly:** Review P1 items (assess priority)
- **Monthly:** Review P2 items (assess if priority should increase)
- **Quarterly:** Full debt review and cleanup sprint

---

**Document Status:** ACTIVE
**Next Review:** 2026-02-05
