# EmenTech Marketing Ecosystem - Decisions Log

This document tracks all major decisions made during the project. Locked decisions require human approval to change.

---

## Decision: Admin Dashboard Technology Stack - 2026-01-22

**Question:** What technology should be used to rebuild the admin dashboard?

**Options Considered:**
1. React/Vite (consistent with main frontend)
2. Vue.js (alternative modern framework)
3. Keep existing implementation

**Decision:** React/Vite

**Decided By:** Human (Project Owner)
**Date:** 2026-01-22

**Reasoning:** Maintains consistency with the main frontend codebase, allowing code sharing, unified styling, and reduced learning curve for developers.

**Implications:**
- Technical: Admin dashboard will share components/utilities with main frontend
- Cost: No additional framework licensing or training
- Timeline: Faster development due to existing React expertise

**Locked:** YES - This decision is now an architectural constraint

---

## Decision: Social Media Platforms - 2026-01-22

**Question:** Which social media platforms should be integrated for marketing?

**Options Considered:**
1. LinkedIn only
2. Twitter/X only
3. LinkedIn + Twitter/X (both)
4. LinkedIn + Twitter/X + Facebook

**Decision:** LinkedIn + Twitter/X

**Decided By:** Human (Project Owner)
**Date:** 2026-01-22

**Reasoning:** LinkedIn provides B2B reach while Twitter/X offers broader engagement. This combination covers professional and general audiences without the complexity of Facebook's API.

**Implications:**
- Technical: Two OAuth integrations to implement
- Cost: Both platforms have free API tiers sufficient for initial usage
- Timeline: Approximately 2-3 days of additional development

**Locked:** YES - This decision is now an architectural constraint

---

## Decision: Employee Email Auto-Creation - 2026-01-22

**Question:** How should company email accounts be provisioned for new employees?

**Options Considered:**
1. Manual creation by admin on mail server
2. Auto-create via mail server API during employee onboarding
3. Use third-party email service (Google Workspace, etc.)

**Decision:** Auto-create via mail server API

**Decided By:** Human (Project Owner)
**Date:** 2026-01-22

**Reasoning:** Automates onboarding process, reduces manual steps, keeps email under company's existing mail.ementech.co.ke domain.

**Implications:**
- Technical: Requires API access to mail server (Dovecot/Postfix)
- Cost: No additional cost (using existing infrastructure)
- Timeline: May require coordination with mail server admin

**Locked:** YES - This decision is now an architectural constraint

---

## Decision: Feature Priority Balance - 2026-01-22

**Question:** How should feature priority be distributed across the 8 phases?

**Options Considered:**
1. Heavy focus on core features, minimal analytics
2. Balanced priority across all features
3. Marketing-heavy with limited employee management

**Decision:** Balanced priority across all features

**Decided By:** Human (Project Owner)
**Date:** 2026-01-22

**Reasoning:** All features contribute to the complete marketing ecosystem vision. Skipping or minimizing any phase would result in an incomplete platform.

**Implications:**
- Technical: Full implementation of all 8 phases required
- Cost: Full development effort for all features
- Timeline: Estimated 8 phases, sequential implementation

**Locked:** YES - This decision is now an architectural constraint

---

## Pending Decisions

*No pending decisions at this time.*

---

**Document Status**: ACTIVE
**Created**: 2026-01-22
**Last Updated**: 2026-01-22
