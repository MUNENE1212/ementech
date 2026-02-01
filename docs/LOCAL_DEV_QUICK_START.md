# Local Development Quick Start Guide

**Project:** EmenTech Website UI/UX Overhaul 2026
**Purpose:** Quick reference for local development
**Last Updated:** February 1, 2026

---

## Prerequisites

Before starting, ensure you have:

- **Node.js** (v18 or higher recommended)
- **npm** (comes with Node.js)
- **Git** (for version control)

---

## Quick Start (3 Steps)

### Step 1: Install Dependencies

```bash
npm install
```

This installs all required packages (370 dependencies).

### Step 2: Start Development Server

```bash
npm run dev
```

The development server will start at:
```
http://localhost:5173
```

### Step 3: Open in Browser

Navigate to `http://localhost:5173` in your browser.

That's it! You're now running the Ementech website locally with hot module replacement.

---

## Common Commands

### Development

```bash
# Start development server (with hot reload)
npm run dev
# URL: http://localhost:5173

# Type checking (TypeScript)
npx tsc --noEmit

# Linting (ESLint)
npm run lint
```

### Production Build

```bash
# Build for production
npm run build

# Preview production build locally
npm run preview
# URL: http://localhost:4173
```

### Testing

```bash
# Run tests (when test framework is added)
npm test

# Run tests in watch mode
npm run test:watch
```

---

## Environment Configuration

### Development Environment

Create `.env.development` (already exists):

```env
VITE_API_URL=http://localhost:5000/api
```

### Production Environment

Create `.env.production`:

```env
VITE_API_URL=https://api.ementech.co.ke/api

# EmailJS Configuration (for contact form)
VITE_EMAILJS_SERVICE_ID=your_service_id
VITE_EMAILJS_TEMPLATE_ID=your_template_id
VITE_EMAILJS_PUBLIC_KEY=your_public_key
```

**Note:** Never commit `.env` files to Git. Use `.env.example` as a template.

---

## Project Structure

```
ementech-website/
├── src/
│   ├── components/
│   │   ├── ui/           # 8 new UI components (Button, Card, FormInput, etc.)
│   │   ├── layout/       # 3 new layout components (BentoGrid, Section, Container)
│   │   ├── sections/     # Page sections (Hero, Contact, etc.)
│   │   ├── email/        # Email components (EmailInbox)
│   │   └── features/     # Feature-specific components
│   ├── pages/            # 14 page components (lazy-loaded)
│   ├── hooks/            # Custom React hooks (useReducedMotion, etc.)
│   ├── contexts/         # React context providers
│   ├── services/         # API service layer
│   ├── utils/            # Utility functions
│   ├── App.tsx           # Main app component
│   └── main.tsx          # Entry point
├── public/               # Static assets
├── docs/                 # Documentation
├── .ai/                  # AI agent state and workflows
└── dist/                 # Production build output (generated)
```

---

## New Components (Stage 2)

### UI Components (8)

1. **Button** (`src/components/ui/Button.tsx`)
   - 5 variants: primary, secondary, outline, ghost, danger
   - 3 sizes: sm, md, lg
   - All states: default, hover, active, focus, disabled, loading

2. **Card** (`src/components/ui/Card.tsx`)
   - 3 variants: default, glass, elevated
   - Hover effects with keyboard support

3. **FormInput** (`src/components/ui/FormInput.tsx`)
   - Validation states: error, success, disabled
   - ARIA labels and error messages
   - Left/right icon support

4. **LoadingIndicator** (`src/components/ui/LoadingIndicator.tsx`)
   - Full-screen loading state
   - Accessible (aria-busy)

5. **ErrorState** (`src/components/ui/ErrorState.tsx`)
   - Clear error messaging
   - Action button support

6. **Toast** (`src/components/ui/Toast.tsx`)
   - 4 variants: success, error, warning, info
   - Auto-dismiss functionality

7. **LazyImage** (`src/components/ui/LazyImage.tsx`)
   - Intersection Observer lazy loading
   - Skeleton placeholder

8. **Skeleton** (`src/components/ui/Skeleton.tsx`)
   - 3 variants: rectangular, circular, text
   - Pulse animation

### Layout Components (3)

9. **BentoGrid** (`src/components/layout/BentoGrid.tsx`)
   - Responsive columns: 1, 2, 3, or 4
   - Asymmetric layouts

10. **Section** (`src/components/layout/Section.tsx`)
    - Configurable padding: sm (64px), md (96px), lg (128px)
    - ID support for anchor links

11. **Container** (`src/components/layout/Container.tsx`)
    - Responsive max-widths
    - Centered content

### Custom Hooks (1)

12. **useReducedMotion** (`src/hooks/useReducedMotion.ts`)
    - Detects `prefers-reduced-motion`
    - Respects user accessibility preferences

---

## Development Features

### Hot Module Replacement (HMR)

Changes to components are reflected instantly without full page refresh.

- Edit a component file
- Save the file
- See changes in browser immediately

### Type Checking

TypeScript provides real-time type checking:

```bash
npx tsc --noEmit
```

### Linting

ESLint ensures code quality:

```bash
npm run lint
```

Fix linting issues automatically:
```bash
npm run lint -- --fix
```

---

## Code Splitting

All 14 routes are lazy-loaded for optimal performance:

```typescript
const HomePage = lazy(() => import('./pages/HomePage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
// ... etc
```

This reduces the initial bundle size and improves load times.

---

## Styling

### Tailwind CSS

The project uses Tailwind CSS for styling.

**Configuration:** `tailwind.config.js`

**Custom Colors:**
- Primary Blue: `#3b82f6`
- Accent Green: `#10b981`
- Accent Gold: `#f59e0b`
- Dark 950: `#020617`

**Spacing:** 8-point grid system (4, 8, 12, 16, 24, 32, 48, 64, 80, 96, 120, 128)

### Custom CSS

Global styles are in `src/index.css`.

---

## Performance

### Bundle Size

Current: **118.35 KB gzipped** (20% reduction from original)

### Code Splitting

- 14 routes lazy-loaded
- Per-route chunks: 3-48 KB each
- Vendor chunks separated (React, Framer Motion)

### Lazy Loading

Images use `LazyImage` component with Intersection Observer.

---

## Accessibility

### WCAG 2.2 AA Compliance

All components are accessibility-compliant:

- Keyboard navigation throughout
- ARIA labels on interactive elements
- Focus indicators (2px rings)
- Touch targets meet 48×48px minimum
- Skip navigation link present

### Testing

Test accessibility with:
- Keyboard navigation (Tab, Enter, Escape, Arrow keys)
- Screen reader (NVDA, VoiceOver)
- Browser dev tools (Accessibility tree)

---

## Troubleshooting

### Port Already in Use

If port 5173 is in use:
```bash
# Kill process on port 5173
npx kill-port 5173

# Or use a different port
npm run dev -- --port 3000
```

### Build Errors

If build fails:
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf dist
```

### TypeScript Errors

If TypeScript errors appear:
```bash
# Check for type errors
npx tsc --noEmit

# Update types
npm update
```

### Stale Components

If components don't update:
1. Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)
2. Clear browser cache
3. Restart dev server

---

## Useful Tips

### Faster Development

1. Use hot module replacement (HMR) for instant feedback
2. Keep browser dev tools open for console errors
3. Use React DevTools for component inspection

### Code Quality

1. Run `npm run lint` before committing
2. Run `npx tsc --noEmit` to catch type errors
3. Use TypeScript for all new components

### Performance

1. Use `LazyImage` for images
2. Keep bundle size under 500 KB
3. Profile with React DevTools Profiler

### Accessibility

1. Test keyboard navigation
2. Check color contrast (4.5:1 minimum)
3. Add ARIA labels to interactive elements

---

## Production Deployment

For production deployment instructions, see:
**`PRODUCTION_DEPLOYMENT_GUIDE.md`**

Quick production steps:
```bash
# 1. Build for production
npm run build

# 2. Preview build locally
npm run preview

# 3. Test at http://localhost:4173

# 4. Deploy 'dist/' directory to hosting
```

---

## Getting Help

### Documentation

- **Deployment Report:** `DEPLOYMENT_REPORT_20260201.md`
- **Production Guide:** `PRODUCTION_DEPLOYMENT_GUIDE.md`
- **CSP Configuration:** `CSP_HEADERS_CONFIG.md`
- **Security Report:** `SECURITY_AUDIT_REPORT_20260201.md`
- **QA Report:** `QA_VALIDATION_REPORT_20260201.md`

### Resources

- **React Documentation:** https://react.dev/
- **TypeScript Documentation:** https://www.typescriptlang.org/docs/
- **Vite Documentation:** https://vitejs.dev/guide/
- **Tailwind CSS:** https://tailwindcss.com/docs

---

## Summary

**To start development:**
```bash
npm install
npm run dev
# Open http://localhost:5173
```

**To build for production:**
```bash
npm run build
npm run preview
# Open http://localhost:4173
```

**Happy coding!** 🚀

---

**Last Updated:** February 1, 2026
**Project Version:** 1.0.0
**Status:** Production Ready
