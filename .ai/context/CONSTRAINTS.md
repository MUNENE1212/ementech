# EmenTech Website UI/UX Overhaul - Project Constraints

This document defines the boundaries and limitations for the UI/UX overhaul project.

---

## Technical Constraints

### Must Use Existing Stack
- **Frontend**: React 19.2.0 + Vite + TypeScript + Tailwind CSS
- **Animations**: Framer Motion (optimize existing, don't replace)
- **Routing**: React Router (maintain existing routes)
- **Reason**: Consistency with existing codebase, maintainability

### No Breaking Changes
- Existing routes must remain functional
- API contracts cannot change
- Database schema changes are out of scope
- Must maintain backward compatibility

### Performance Requirements
- Bundle size target: < 500KB gzipped
- Core Web Vitals thresholds:
  - LCP (Largest Contentful Paint): < 2.5s
  - INP (Interaction to Next Paint): < 200ms
  - CLS (Cumulative Layout Shift): < 0.1
- No blocking JavaScript on main thread
- First Contentful Paint: < 1.8s

### Code Quality
- All code must follow existing patterns
- TypeScript strict mode enabled
- ESLint/Prettier compliance required
- Proper error handling on all user interactions
- No console.log in production code

---

## Design Constraints

### Brand Identity
- **Primary Blue**: #3b82f6 (must remain primary)
- **Accent Green**: #10b981 (must remain as accent)
- **Gold/Amber**: #f59e0b (must remain as accent)
- **Dark Background**: #020617 (can be used but not exclusively)

**Cannot change brand colors without human approval**

### Typography
- Can evaluate alternative fonts (Plus Jakarta Sans recommended)
- Must maintain font fallbacks
- Font loading performance must be optimized
- Web font files: < 100KB total

### Accessibility Non-Negotiables
- WCAG 2.2 AA compliance mandatory
- Color contrast: 4.5:1 for normal text, 3:1 for large text
- All interactive elements keyboard accessible
- Touch targets: minimum 48x48px
- Screen reader compatible (ARIA labels, semantic HTML)
- No content seizure risk (no flashing > 3x per second)

### Mobile-First Requirement
- Design for mobile first, enhance for desktop
- All features must work on mobile (not responsive-adaptive)
- Touch gestures must be supported where appropriate
- Mobile performance must meet Core Web Vitals

---

## Operational Constraints

### Sequential Stage Implementation
Stages must be implemented in order:
1. Refactor & Code Hygiene (establish baseline)
2. Implementation (apply improvements)
3. Testing & QA (validate quality)
4. Security Review (ensure no vulnerabilities)
5. Deployment (release to production)

### Checkpoint Requirements
- Checkpoint required after each stage completion
- All tests must pass before checkpoint creation
- Core Web Vitals must be verified before deployment
- Accessibility audit must pass before deployment

### Testing Requirements
- Manual testing on real devices (mobile + desktop)
- Automated accessibility testing (axe DevTools, WAVE)
- Lighthouse auditing (Performance, Accessibility, Best Practices, SEO)
- Cross-browser testing (Chrome, Firefox, Safari, Edge)
- Keyboard navigation testing

---

## Scope Constraints

### Out of Scope (Will NOT Do)
- Backend API changes
- Database migrations
- New feature development (only UI/UX improvements)
- Content creation/copywriting (unless for UX improvement)
- SEO optimization beyond technical performance
- A/B testing setup (infrastructure only, UX design included)

### In Scope (Will Do)
- Design system implementation (colors, typography, spacing)
- Layout improvements (bento grids, section spacing)
- Interactive elements (buttons, cards, forms, animations)
- Accessibility enhancements (ARIA, keyboard nav, contrast)
- Performance optimization (lazy loading, code splitting, image optimization)
- Mobile responsiveness improvements
- Conversion optimization (CTA placement, form optimization)

---

## Resource Constraints

### Development Time
- Target: 5 stages completed efficiently
- Each stage: 1-2 agent runs depending on complexity
- Total timeline: Dependent on feedback cycles

### External Dependencies
- No external API calls required
- No paid tools or services needed
- Use free dev tools: Lighthouse, axe DevTools, WAVE, React DevTools

---

## Escalation Triggers

The following situations MUST be escalated to human:
1. Brand color changes requested
2. Technology stack changes proposed
3. Performance targets cannot be met
4. Accessibility compliance conflicts with design vision
5. Breaking changes to existing functionality proposed
6. Timeline significantly at risk

---

## Success Criteria

### Must Have (Blocking)
- [ ] WCAG 2.2 AA compliant (passes automated + manual tests)
- [ ] Core Web Vitals green scores (LCP < 2.5s, INP < 200ms, CLS < 0.1)
- [ ] All interactive elements have proper hover/focus/active states
- [ ] Keyboard navigation works for all features
- [ ] Color contrast meets 4.5:1 minimum
- [ ] Touch targets meet 48x48px minimum
- [ ] Mobile responsive (320px - 1920px)
- [ ] No console errors in production build
- [ ] Bundle size < 500KB gzipped

### Should Have (Important)
- [ ] Plus Jakarta Sans or similar modern font for headings
- [ ] Bento grid layouts for feature showcases
- [ ] 8-point grid spacing system
- [ ] 60-30-10 color distribution
- [ ] Micro-interactions on cards/buttons
- [ ] Form validation feedback (real-time)
- [ ] Loading states for async actions
- [ ] Error states with helpful messages

### Could Have (Nice to Have)
- [ ] Dark mode toggle
- [ ] Reduced motion preferences respected
- [ ] Custom scrollbar styling
- [ ] Page transition animations
- [ ] Scroll progress indicators
- [ ] Back-to-top button

---

**Document Status**: APPROVED
**Created**: 2026-02-01
**Last Updated**: 2026-02-01
