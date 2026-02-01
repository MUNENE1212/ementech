# EmenTech Website UI/UX Overhaul - Architecture Document

## Overview

This document defines the architectural decisions and constraints for the UI/UX overhaul project.

---

## Current Technology Stack

### Frontend
| Component | Technology | Version | Status |
|-----------|-----------|---------|--------|
| Framework | React | 19.2.0 | EXISTING |
| Language | TypeScript | Latest | EXISTING |
| Build Tool | Vite | Latest | EXISTING |
| Styling | Tailwind CSS | Latest | EXISTING |
| Animations | Framer Motion | Latest | EXISTING |
| Routing | React Router | Latest | EXISTING |
| HTTP | Axios/Fetch | Native | EXISTING |

### Infrastructure
| Component | Technology | Purpose |
|-----------|-----------|---------|
| Backend API | Express.js | REST endpoints |
| Database | MongoDB | Content storage |
| Email | Nodemailer | Contact forms |

**Decision**: LOCKED - Must maintain existing technology stack

---

## Design System Architecture

### Color Palette (Current)
```css
/* Brand Colors */
--primary-blue: #3b82f6;
--accent-green: #10b981;
--accent-gold: #f59e0b;
--background-dark: #020617;

/* Applied using 60-30-10 rule:
   - 60%: White/Light Gray (dominant)
   - 30%: Brand colors (secondary)
   - 10%: Vibrant accents (CTA)
*/
```

### Typography Scale
```css
/* Headings: Plus Jakarta Sans (to be evaluated) */
h1: 48-72px, weight 700
h2: 36-48px, weight 600-700
h3: 24-32px, weight 600

/* Body: Inter (or evaluate alternatives) */
body: 16-18px, weight 400
small: 14-15px, weight 400

/* Code: Geist Mono or Fira Code */
code: 14-16px, weight 400
```

### Spacing System (8-Point Grid)
```css
/* Base unit: 8px */
4px:  Icon spacing
8px:  Button padding, small gaps
16px: Card padding, form inputs
24px: Section spacing, component gaps
32px: Large component spacing
48px: Section breaks
64px+: Major divisions
```

---

## Component Architecture

### Layout Components
```
src/components/layout/
├── Navbar.tsx              # Main navigation (responsive)
├── Footer.tsx              # Site footer
├── Section.tsx             # Reusable section wrapper
├── Container.tsx           # Width-constrained container
└── Grid.tsx                # Bento grid system
```

### UI Components
```
src/components/ui/
├── Button.tsx              # Primary/Secondary/Ghost variants
├── Card.tsx                # Content cards with hover states
├── FormInput.tsx           # Text, email, textarea inputs
├── FormLabel.tsx           # Accessible form labels
├── Badge.tsx               # Status/indicator badges
├── Modal.tsx               # Dialog/overlay
└── Accordion.tsx           # Collapsible content
```

### Feature Components
```
src/components/features/
├── Hero.tsx                # Landing hero section
├── FeatureShowcase.tsx     # Bento grid feature display
├── TestimonialCard.tsx     # Customer testimonials
├── CTASection.tsx          # Call-to-action sections
└── ContactForm.tsx         # Lead capture form
```

---

## Page Structure

### Current Pages to Enhance
1. **HomePage** (`src/pages/HomePage.tsx`)
   - Hero section
   - Services/features showcase
   - Trust signals (clients, testimonials)
   - CTA sections

2. **AboutPage** (`src/pages/AboutPage.tsx`)
   - Company story
   - Team section
   - Values/mission
   - CTA

3. **ServicesPage** (`src/pages/ServicesPage.tsx`)
   - Service listings
   - Detailed service descriptions
   - Process breakdown

4. **ContactPage** (`src/pages/ContactPage.tsx`)
   - Contact form (optimize to 3-5 fields)
   - Contact information
   - Map/location

---

## Accessibility Architecture

### Semantic HTML
```html
<!-- Use proper landmark elements -->
<header role="banner">
<nav role="navigation" aria-label="Main">
<main role="main">
<section aria-labelledby="heading-1">
<aside role="complementary">
<footer role="contentinfo">
```

### ARIA Attributes
```html
<!-- Interactive elements -->
<button aria-label="Close dialog" aria-expanded="false">
<div role="button" tabindex="0" aria-pressed="true">

<!-- Form elements -->
<label for="email" id="email-label">
<input id="email" aria-required="true" aria-describedby="email-error">

<!-- Live regions -->
<div role="status" aria-live="polite">
<div role="alert" aria-live="assertive">
```

### Keyboard Navigation
- Tab: Logical focus order
- Enter/Space: Activate buttons/links
- Escape: Close modals/menus
- Arrow keys: Navigate widgets (tabs, grids)

---

## Performance Architecture

### Code Splitting Strategy
```typescript
// Route-based splitting
const HomePage = lazy(() => import('./pages/HomePage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));

// Component-based splitting
const HeavyComponent = lazy(() => import('./components/HeavyComponent'));
```

### Image Optimization
- Use WebP format with fallbacks
- Implement lazy loading with IntersectionObserver
- Responsive images with srcset
- Compress all images (target < 200KB per image)

### Animation Optimization
```typescript
// Use CSS transforms instead of layout-triggering properties
transform: translateX(100px)  // GPU accelerated
// instead of
left: 100px  // Triggers layout

// Use will-change sparingly
will-change: transform, opacity

// Respect prefers-reduced-motion
@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.01ms !important; }
}
```

---

## Responsive Breakpoints

### Breakpoint Scale
```css
/* Mobile First Approach */
/* Mobile: 0-767px (default) */
sm: 640px   /* Small tablets */
md: 768px   /* Tablets */
lg: 1024px  /* Small desktops */
xl: 1280px  /* Desktops */
2xl: 1536px /* Large desktops */
```

### Container Widths
```
Mobile:   100% width
Tablet:   748px max
Desktop:  1200px max
Large:    1400px max
```

---

## State Management

### Local Component State
```typescript
// Use React hooks for component state
const [isOpen, setIsOpen] = useState(false);
const [formData, setFormData] = useForm<FormData>();
```

### Global State (if needed)
```typescript
// Use React Context for theme, auth, etc.
const { theme, toggleTheme } = useTheme();
```

---

## API Integration

### Existing Endpoints
```
GET  /api/content          # Page content
POST /api/contact          # Contact form submission
GET  /api/services         # Services data
POST /api/newsletter       # Newsletter signup
```

**No new API endpoints required for UI/UX overhaul**

---

## Environment Variables

```env
# Existing (no changes required)
VITE_API_URL=http://localhost:5000/api
VITE_SITE_URL=http://localhost:5173
```

---

**Document Status**: APPROVED
**Created**: 2026-02-01
**Last Updated**: 2026-02-01
**Locked Decisions**:
- Technology Stack: React/Vite/TypeScript/Tailwind (Non-negotiable)
- Brand Colors: Must maintain current brand identity
- Performance: Core Web Vitals must pass
- Accessibility: WCAG 2.2 AA compliance required
