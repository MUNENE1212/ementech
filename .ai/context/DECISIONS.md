# EmenTech Website UI/UX Overhaul - Decisions Log

This document tracks all major decisions made during the UI/UX overhaul project. Locked decisions require human approval to change.

---

## Project Initialization

**Decision**: Initialize UI/UX overhaul as new project
**Date**: 2026-02-01
**Reasoning**: This is a separate initiative from the marketing ecosystem upgrade, focused on website modernization based on 2026 best practices research.

---

## Pending Decisions

*No decisions pending - project initialization in progress*

---

## Locked Decisions

### Technology Stack
**Decision**: Maintain existing React/Vite/TypeScript/Tailwind stack
**Locked**: YES - This is now a constraint
**Reasoning**: Existing stack is modern, performant, and team is familiar with it.

### Brand Colors
**Decision**: Must maintain current brand colors (#3b82f6, #10b981, #f59e0b, #020617)
**Locked**: YES - This is now a constraint
**Reasoning**: Brand identity must be preserved; can optimize usage but not change colors.

### Accessibility Standard
**Decision**: WCAG 2.2 AA compliance is mandatory
**Locked**: YES - This is now a constraint
**Reasoning**: Legal requirement and ethical best practice for inclusive design.

### Performance Targets
**Decision**: Core Web Vitals must pass (LCP < 2.5s, INP < 200ms, CLS < 0.1)
**Locked**: YES - This is now a constraint
**Reasoning**: Performance impacts SEO rankings and user experience directly.

---

## Future Decisions Requiring Human Input

### Typography
**Question**: Should we adopt Plus Jakarta Sans for headings or keep current font?
**Options**:
1. Plus Jakarta Sans (recommended in research)
2. Keep current font family
3. Evaluate other modern alternatives

**Status**: PENDING - Will escalate after research phase

### Animation Approach
**Question**: How extensive should animations be?
**Options**:
1. Minimal animations (performance-focused)
2. Balanced approach (current state, optimized)
3. Rich animations (engagement-focused, with performance safeguards)

**Status**: PENDING - Will evaluate after performance audit

### Dark Mode
**Question**: Should we implement a dark mode toggle?
**Options**:
1. Yes, add dark mode toggle
2. No, maintain current dark theme only
3. Auto-detect system preference

**Status**: PENDING - Nice-to-have, can defer to later stage

---

**Document Status**: ACTIVE
**Created**: 2026-02-01
**Last Updated**: 2026-02-01
