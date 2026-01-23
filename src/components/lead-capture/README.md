# Lead Capture Components

Modern, conversion-optimized lead capture components following the "Value-First" principle for EmenTech.

## Components

### 1. NewsletterSignup

Email subscription component with GDPR compliance and multiple variants.

**Variants:**
- `minimal`: Compact form for footers
- `inline`: Centered form for content areas
- `prominent`: Full-featured form with newsletter selection

**Usage:**
```jsx
import { NewsletterSignup } from '@/components/lead-capture';

<NewsletterSignup
  context="footer"  // footer, article, resource, exit-intent
  variant="minimal"  // minimal, inline, prominent
/>
```

**Features:**
- Email-only capture initially
- GDPR consent checkbox
- Success animations
- Auto-closes after success
- Tracks subscription source

---

### 2. ResourceDownload

Progressive form for gated content downloads (whitepapers, guides, reports).

**Usage:**
```jsx
import { ResourceDownload } from '@/components/lead-capture';

<ResourceDownload
  resource={{
    id: 'ai-guide',
    title: 'Complete AI Implementation Guide',
    type: 'guide',
    format: 'PDF',
    pages: 45,
    value: '$499 value',
    description: 'Step-by-step AI integration roadmap',
    topics: ['RAG systems', 'LLM finetuning'],
    downloadUrl: '/downloads/guide.pdf',
  }}
  progressiveFields={['email', 'name', 'company']}
/>
```

**Features:**
- Progressive profiling (smart field detection)
- Auto-infers company from email domain
- Shows resource preview
- Download after email capture
- Professional, trustworthy design

---

### 3. ExitIntentPopup

Captures leads when users show exit intent (mouse leaves page).

**Usage:**
```jsx
import { ExitIntentPopup } from '@/components/lead-capture';

<ExitIntentPopup
  offers={[
    {
      id: 'free-guide',
      title: "Wait! Don't Miss This Free Guide",
      description: 'Get our AI Implementation Checklist',
      value: '$199 value',
      cta: 'Send Me the Checklist',
    }
  ]}
  delay={1000}  // Delay before showing (ms)
  showOncePerSession={true}
  excludePaths={['/login', '/register']}
/>
```

**Features:**
- Triggers on exit intent
- Shows once per session
- Can exclude certain pages
- Attractive offer presentation
- Easy to dismiss

---

## Shared Components

### LeadForm

Reusable form component with validation.

```jsx
import { LeadForm } from '@/components/lead-capture';

<LeadForm
  fields={['email', 'name', 'company']}
  onSubmit={(data) => handleSubmit(data)}
  submitButtonText="Get Access"
  isLoading={false}
  error={null}
/>
```

**Features:**
- Real-time validation
- Email format checking
- Auto-infer company from email
- Accessibility compliant
- Clear error messages

### SuccessModal

Animated success state modal.

```jsx
import { SuccessModal } from '@/components/lead-capture';

<SuccessModal
  isOpen={true}
  onClose={() => setShowSuccess(false)}
  title="Success!"
  message="Check your inbox for confirmation."
  autoCloseDelay={3000}
/>
```

### LoadingSpinner

Elegant loading animation.

```jsx
import { LoadingSpinner } from '@/components/lead-capture';

<LoadingSpinner size="medium" text="Processing..." />
```

---

## Lead Context

Global state management for progressive profiling.

**Usage:**
```jsx
import { useLead } from '@/contexts/LeadContext';

const { initializeLead, updateProfile, trackEvent } = useLead();

// Initialize lead with email
await initializeLead('user@example.com');

// Update with additional data
await updateProfile({ name: 'John', company: 'Acme' });

// Track interactions
await trackEvent('resource_download', { resourceId: 'guide-1' });
```

**Features:**
- Persists data to localStorage
- Progressive profiling levels
- Interaction tracking
- GDPR-compliant data clearing

---

## Lead Service

API integration service for lead capture operations.

**Functions:**
```javascript
import {
  subscribeNewsletter,
  saveResourceDownload,
  saveExitIntent,
  updateLeadProfile,
  trackInteraction,
  isValidEmail,
  inferCompanyFromEmail,
} from '@/services/leadService';

// Subscribe to newsletter
await subscribeNewsletter({
  email: 'user@example.com',
  consent: true,
  source: 'footer',
});

// Save resource download
await saveResourceDownload({
  email: 'user@example.com',
  name: 'John Doe',
  company: 'Acme',
  resourceId: 'ai-guide',
  resourceName: 'AI Implementation Guide',
  consent: true,
});

// Track interaction
await trackInteraction({
  email: 'user@example.com',
  action: 'page_view',
  metadata: { page: '/home' },
});
```

---

## Design Principles

### Value-First Approach
- Always give value first, ask for email second
- Make benefits clear and compelling
- Use professional, investor-friendly design
- Dark theme matching ementech.co.ke

### Copywriting Guidelines
- Avoid "sign up" - use "get access", "download", "subscribe"
- Focus on benefits, not features
- Use action-oriented CTAs
- Create urgency without pressure

### Progressive Profiling
- Start with email only
- Collect name, company, phone over time
- Store in localStorage, merge on server
- Minimize form fields for higher conversion

### Privacy First
- Clear consent language
- Link to privacy policy
- Unsubscribe option always visible
- GDPR-compliant by default

---

## Integration Points

**Footer - Newsletter signup** (already integrated)
```jsx
<Footer />  // Contains NewsletterSignup component
```

**Exit Intent** (already integrated in App)
```jsx
<ExitIntentPopup />  // Shows on exit intent
```

**Homepage - Hero CTA for resource download**
```jsx
<ResourceDownload resource={heroResource} />
```

**Services pages - Relevant resource downloads**
```jsx
<ResourceDownload resource={serviceResource} />
```

**Blog posts - Related downloads**
```jsx
<ResourceDownload resource={blogResource} />
```

---

## Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_URL=http://localhost:5000/api
```

For production:
```env
VITE_API_URL=https://api.ementech.co.ke/api
```

---

## Backend API Endpoints Required

The frontend expects these API endpoints:

### Lead Management
- `POST /api/leads/newsletter` - Subscribe to newsletter
- `POST /api/leads/resource-download` - Save resource download
- `POST /api/leads/exit-intent` - Save exit intent capture
- `PATCH /api/leads/profile` - Update lead profile (progressive)
- `GET /api/leads/profile/:email` - Get lead profile
- `GET /api/leads/exists/:email` - Check if lead exists
- `POST /api/leads/track` - Track interaction

See `/backend/src/api/` for implementation details.

---

## Testing

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

**Test Checklist:**
- [ ] Newsletter signup in footer
- [ ] Email validation works
- [ ] Consent checkbox required
- [ ] Success modal appears
- [ ] Exit intent popup triggers
- [ ] Exit intent shows only once per session
- [ ] Resource download form works
- [ ] Progressive profiling detects existing data
- [ ] All forms are responsive on mobile
- [ ] All forms are accessible (WCAG 2.1 AA)

---

## Performance

- Fast loading (< 3s initial load)
- Minimal JavaScript bundle size
- Optimized images and assets
- Lazy loading for exit intent
- Efficient state management

---

## Accessibility

All components are WCAG 2.1 AA compliant:
- Semantic HTML
- ARIA labels
- Keyboard navigation
- Screen reader support
- Color contrast ratios met
- Focus indicators visible

---

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

---

## Future Enhancements

- [ ] ROI Calculator component
- [ ] Service Assessment tool
- [ ] A/B testing variants
- [ ] Advanced analytics integration
- [ ] Multi-language support
- [ ] Advanced lead scoring
- [ ] CRM integration (HubSpot)
- [ ] Email sequence automation

---

## Support

For questions or issues, contact the development team.

---

**Built with ❤️ for EmenTech**
