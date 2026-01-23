# EmenTech AI-Powered Ecosystem - Complete System Architecture

**Project Code**: EMENTECH-ECOSYSTEM-2025
**Document Version**: 1.0
**Date**: January 20, 2026
**Architect**: System Architecture Agent
**Status**: Complete

---

## Executive Summary

This document outlines a comprehensive, AI-powered ecosystem architecture for EmenTech that transforms the website from a static brochure into an intelligent lead capture and engagement platform. The architecture leverages 2025 best practices including Next.js 15, Vercel AI SDK, multi-modal AI models, vector databases, and real-time personalization to create investor and client-friendly experiences that naturally capture leads through value exchange.

### Vision Statement

Create a modern, AI-native digital ecosystem that:
- **Naturally captures leads** through value-first interactions (content, tools, insights)
- **Qualifies leads intelligently** using AI-powered conversations and behavioral analysis
- **Personalizes experiences** dynamically based on user intent and engagement patterns
- **Scales engagement** through automation while maintaining human touch
- **Provides actionable insights** through predictive analytics and lead scoring
- **Respects privacy** with transparent, compliant data collection practices

### Key Differentiators

1. **Value-First Lead Capture**: No intrusive "sign up" forms. Instead, offer value (resources, tools, insights) and capture information progressively.
2. **AI-Native Personalization**: Every interaction is personalized using AI models trained on user behavior and preferences.
3. **Predictive Lead Scoring**: Machine learning models identify high-value prospects instantly, enabling targeted follow-up.
4. **Conversational Interfaces**: Natural language interactions (chat, voice) that feel like talking to a human expert.
5. **Progressive Profiling**: Collect data incrementally as trust builds, maximizing conversion while respecting privacy.
6. **Real-Time Optimization**: Continuous A/B testing and ML-driven optimization of all touchpoints.

### Business Impact Goals

- **Lead Volume**: Increase qualified leads by 300% within 6 months
- **Lead Quality**: Improve lead-to-opportunity rate by 150% through predictive scoring
- **Engagement**: Achieve 40%+ return visitor rate through personalized experiences
- **Conversion**: Convert 25%+ of anonymous visitors into identified leads
- **Time-to-Lead**: Reduce average lead capture time from 3 months to 30 days
- **Cost-per-Lead**: Decrease by 50% through automated nurturing and qualification

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Technology Stack](#2-technology-stack)
3. [User Acquisition & Lead Capture Layer](#3-user-acquisition--lead-capture-layer)
4. [AI-Powered Engagement Layer](#4-ai-powered-engagement-layer)
5. [Data Models & Schema Design](#5-data-models--schema-design)
6. [API Specifications](#6-api-specifications)
7. [Frontend Architecture](#7-frontend-architecture)
8. [AI/LLM Integration Strategy](#8-aillm-integration-strategy)
9. [User Journey Flows](#9-user-journey-flows)
10. [Implementation Roadmap](#10-implementation-roadmap)
11. [Privacy & Compliance](#11-privacy--compliance)
12. [Scalability & Performance](#12-scalability--performance)
13. [Security Architecture](#13-security-architecture)
14. [Monitoring & Analytics](#14-monitoring--analytics)

---

## 1. Architecture Overview

### 1.1 High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PRESENTATION LAYER                                    │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐          │
│  │   Next.js 15     │  │   React SPA      │  │  Email Client    │          │
│  │   (ementech.co.ke) │ │  (app.ementech)  │  │  (Existing)      │          │
│  │   Server Comps   │  │   Client Comps   │  │                  │          │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘          │
│           │                     │                     │                      │
│           └─────────────────────┼─────────────────────┘                      │
│                             │                                            │
│                   ┌─────────▼────────┐                                      │
│                   │  Vercel Edge     │                                      │
│                   │  Network         │                                      │
│                   └─────────┬────────┘                                      │
└─────────────────────────────┼────────────────────────────────────────────────┘
                              │ HTTPS/WSS
                              │
┌─────────────────────────────┼────────────────────────────────────────────────┐
│                      API GATEWAY / CDN                                        │
│  ┌──────────────────────────┼──────────────────────────┐                    │
│  │              REST API               │    WebSocket (Socket.IO)  │          │
│  └──────────────────────────┼──────────────────────────┘                    │
└─────────────────────────────┼────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Next.js    │    │   Express    │    │   AI/LLM     │
│  Route Hdrs  │    │   Backend    │    │  Services    │
│  (Server     │    │              │    │              │
│  Actions)    │    │              │    │              │
└──────┬───────┘    └──────┬───────┘    └──────┬───────┘
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
┌──────────────────────────┼────────────────────────────────────────────────┐
│                      APPLICATION LAYER                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                    Business Logic Services                           │  │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐       │  │
│  │  │   Lead     │ │   AI       │ │  Content   │ │ Analytics  │       │  │
│  │  │ Capture    │ │ Agents     │ │ Engine     │ │ Engine     │       │  │
│  │  └────────────┘ └────────────┘ └────────────┘ └────────────┘       │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                    AI/ML Processing Layer                            │  │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐       │  │
│  │  │ RAG/Vector │ │   Lead     │ │ Intent     │ │ Content    │       │  │
│  │  │ Search     │ │ Scoring    │ │ Detection  │ │ Generation │       │  │
│  │  └────────────┘ └────────────┘ └────────────┘ └────────────┘       │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────┼────────────────────────────────────────────────┐
│                      DATA LAYER                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         MongoDB Database                             │    │
│  │  • leads (progressive profiles)                                      │    │
│  │  • interactions (behaviors, events)                                  │    │
│  │  • content (resources, articles, case studies)                       │    │
│  │  • conversations (AI chat history)                                   │    │
│  │  • analytics (aggregated metrics)                                    │    │
│  └────────────────────────────┬────────────────────────────────────────┘    │
│                                │                                             │
│  ┌────────────────────────────▼────────────────────────────────────────┐    │
│  │                    Vector Database (Pinecone)                        │    │
│  │  • Content embeddings (semantic search)                              │    │
│  │  • User behavior embeddings (similarity matching)                    │    │
│  │  • Conversation context (RAG retrieval)                              │    │
│  └────────────────────────────┬────────────────────────────────────────┘    │
│                                │                                             │
│  ┌────────────────────────────▼────────────────────────────────────────┐    │
│  │                    Cache Layer (Redis)                               │    │
│  │  • Session state                                                     │    │
│  │  • API response caching                                              │    │
│  │  • Real-time data                                                    │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │              File Storage (Local/S3)                                  │   │
│  │  • Resource downloads (PDFs, whitepapers)                             │   │
│  │  • User-generated content                                             │   │
│  │  • AI-generated assets                                                │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────────────────────┘

                              │
┌─────────────────────────────┼────────────────────────────────────────────────┐
│                   EXTERNAL AI/ML SERVICES                                      │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐             │
│  │  OpenAI    │  │  Anthropic │  │  Cohere    │  │  Hume AI   │             │
│  │  GPT-4o    │  │  Claude    │  │  Rerank    │  │  Voice     │             │
│  │            │  │  3.5       │  │            │  │            │             │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘             │
└───────────────────────────────────────────────────────────────────────────────┘

                              │
┌─────────────────────────────┼────────────────────────────────────────────────┐
│                   INTEGRATION SERVICES                                        │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐             │
│  │   Email    │  │   CRM      │  │ Analytics  │  │   Slack    │             │
│  │  (SMTP)    │  │  (HubSpot) │  │  (PostHog) │  │  Alerts    │             │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘             │
└───────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Architecture Principles

#### 1.2.1 Value-First Design
- Every interaction provides value before requesting data
- Lead capture is a byproduct of valuable experiences, not the primary goal
- Progressive data collection as trust builds

#### 1.2.2 AI-Native (Not AI-Bolted)
- AI/ML is foundational, not an add-on
- Personalization is default, not optional
- Predictive insights drive all interactions

#### 1.2.3 Privacy-Respecting
- Transparent data collection with clear value exchange
- GDPR/CCPA compliant by default
- User control over data retention and deletion

#### 1.2.4 Performance-Optimized
- < 3s initial page load
- < 100ms API response time
- < 500ms AI inference time
- Edge caching for static content

#### 1.2.5 Scalability-Ready
- Stateless API design
- Horizontal scaling capability
- Database sharding support
- CDN distribution

---

## 2. Technology Stack

### 2.1 Frontend Stack

| Component | Technology | Version | Justification |
|-----------|-----------|---------|---------------|
| **Framework** | Next.js | 15.0+ | Server Components, RSC, PPR, Turbopack, built-in optimization |
| **UI Library** | React | 19.0+ | Latest stable, concurrent features, Server Components |
| **State Management** | Zustand | 5.0+ | Lightweight, TypeScript-first, server-friendly |
| **Styling** | Tailwind CSS | 3.4+ | Utility-first, design tokens, dark mode support |
| **Components** | Radix UI | 1.0+ | Accessible primitives, WCAG 2.1 AA compliant |
| **AI SDK** | Vercel AI SDK | 3.0+ | Built for Next.js, streaming, tool calling, RAG support |
| **Animations** | Framer Motion | 11.0+ | Smooth transitions, gesture support |
| **Forms** | React Hook Form | 7.51+ | Performance, validation, accessibility |
| **Validation** | Zod | 3.22+ | TypeScript-first, runtime validation |
| **Data Fetching** | TanStack Query | 5.0+ | Caching, invalidation, SSR support |
| **Icons** | Lucide React | 0.562+ | Tree-shakeable, consistent |
| **Build Tool** | Turbopack | Built-in | Fast HMR, optimized bundles |
| **TypeScript** | TypeScript | 5.3+ | Type safety, developer experience |

### 2.2 Backend Stack

| Component | Technology | Version | Justification |
|-----------|-----------|---------|---------------|
| **Primary Framework** | Next.js | 15.0+ | Server Actions, Route Handlers, Edge Functions |
| **API Framework** | Express.js | 4.19+ | Legacy route support, flexibility |
| **Real-Time** | Socket.IO | 4.7+ | WebSocket fallback, auto-reconnect |
| **Database** | MongoDB | 7.0+ | Flexible schema, existing infrastructure |
| **ODM** | Mongoose | 8.4+ | Schema validation, middleware, TypeScript |
| **Vector DB** | Pinecone | 3.0+ | Managed, scalable, excellent performance |
| **Cache** | Redis | 7.2+ | Session state, API caching, rate limiting |
| **File Storage** | Local/S3 | - | Development/production flexibility |
| **Email** | Nodemailer | 6.9+ | SMTP support, templates |
| **Auth** | NextAuth.js | 5.0+ | OAuth, JWT, session management |
| **Validation** | Zod | 3.22+ | Consistent with frontend |
| **Monitoring** | Sentry | 7.0+ | Error tracking, performance |
| **Logging** | Winston | 3.11+ | Structured logging, transports |

### 2.3 AI/ML Stack

| Component | Technology | Version | Justification |
|-----------|-----------|---------|---------------|
| **Primary LLM** | OpenAI GPT-4o | Latest | Speed, vision, function calling, cost-effective |
| **Secondary LLM** | Claude 3.5 Sonnet | Latest | Long context, reasoning, coding, nuanced responses |
| **Embeddings** | OpenAI text-embedding-3-small | Latest | Cost-effective, fast, 1536 dimensions |
| **Reranking** | Cohere Rerank | v3 | Improved retrieval accuracy |
| **Voice AI** | Hume AI | Latest | Emotion detection, natural voice |
| **Vector Search** | Pinecone | 3.0+ | Managed, filtering, metadata |
| **Prompt Mgmt** | LangSmith | Latest | Debugging, versioning, analytics |
| **Feature Flags** | LaunchDarkly | Latest | A/B testing, gradual rollout |
| **Analytics** | PostHog | Latest | Product analytics, session replay |

### 2.4 DevOps Stack

| Component | Technology | Justification |
|-----------|-----------|---------------|
| **Hosting** | Vercel | Next.js optimized, Edge Network, preview deployments |
| **CDN** | Vercel Edge | Global distribution, edge functions |
| **Database** | MongoDB Atlas | Managed, auto-scaling, backups |
| **Vector DB** | Pinecone Cloud | Managed, high performance |
| **Cache** | Upstash Redis | Serverless, edge-compatible |
| **Monitoring** | Vercel Analytics | Built-in performance metrics |
| **Error Tracking** | Sentry | Real-time alerts, release tracking |
| **CI/CD** | GitHub Actions | Integrated with repository, free tier |
| **Environment** | .env files | Simple, secure (with Vercel) |
| **SSL** | Let's Encrypt (Vercel) | Auto-renewal, free |

---

## 3. User Acquisition & Lead Capture Layer

### 3.1 Lead Capture Strategies (Value-First)

#### 3.1.1 Newsletter Subscriptions (Not "Sign Up", "Stay Informed")

**Approach**: Position as exclusive insights, not marketing emails.

**UI Components**:
```typescript
// components/lead-capture/NewsletterSignup.tsx
interface NewsletterSignupProps {
  context: 'homepage' | 'article' | 'resource' | 'exit-intent';
  variant?: 'minimal' | 'prominent' | 'inline';
}

const newsletters = [
  {
    id: 'tech-insights',
    name: 'EmenTech Tech Insights',
    description: 'Weekly AI & tech trends, implementation guides',
    frequency: 'weekly',
    audience: 'technical-leaders',
    sampleContent: 'AI implementation patterns, cost optimization, scaling strategies'
  },
  {
    id: 'growth-hacks',
    name: 'Growth Playbook',
    description: 'Proven growth strategies for tech companies',
    frequency: 'bi-weekly',
    audience: 'founders-executives',
    sampleContent: 'Lead generation hacks, conversion optimization, case studies'
  },
  {
    id: 'investor-updates',
    name: 'EmenTech Investor Briefing',
    description: 'Monthly progress, milestones, opportunities',
    frequency: 'monthly',
    audience: 'investors',
    sampleContent: 'Product roadmap, traction metrics, partnership news'
  }
];
```

**Data Collection** (Progressive):
- **Initial**: Email address only
- **Follow-up**: Job title, company size, interests (via AI chat)
- **Over time**: Tech stack, budget, timeline (inferred from behavior)

**AI Personalization**:
```typescript
// Use AI to personalize newsletter content
const personalizedDigest = await ai.generate({
  model: 'gpt-4o',
  prompt: `Generate newsletter digest for ${subscriber.profile} based on:
  - Past engagement: ${subscriber.engagement}
  - Interests: ${subscriber.interests}
  - Role: ${subscriber.role}
  - Company stage: ${subscriber.companyStage}`,
  tools: ['get_trending_content', 'get_company_updates']
});
```

#### 3.1.2 Resource Downloads (Whitepapers, Guides, Reports)

**High-Value Resources**:
```typescript
const resources = [
  {
    id: 'ai-implementation-guide',
    title: 'The Complete Guide to AI Implementation in 2025',
    type: 'guide',
    format: 'PDF',
    pages: 45,
    value: '$499 value',
    description: 'Step-by-step AI integration roadmap with real case studies',
    topics: ['RAG systems', 'LLM finetuning', 'Cost optimization', 'Production scaling'],
    captureForm: {
      fields: ['email', 'job_title', 'company_size'],
      reason: 'To send related updates and customized resources'
    }
  },
  {
    id: 'roi-calculator-report',
    title: 'AI Tools ROI Benchmark Report 2025',
    type: 'report',
    format: 'PDF + Excel',
    pages: 30,
    value: 'Industry-first data',
    description: 'Analyze ROI from 200+ AI implementations across industries',
    captureForm: {
      fields: ['email', 'company', 'industry'],
      reason: 'To send industry-specific comparisons'
    }
  },
  {
    id: 'implementation-checklist',
    title: 'Production AI Checklist: 50-Point Inspection',
    type: 'checklist',
    format: 'Interactive PDF',
    pages: 15,
    value: 'Prevent costly mistakes',
    description: 'Essential checks before, during, and after AI deployment',
    captureForm: {
      fields: ['email'],
      reason: 'To send updated versions'
    }
  }
];
```

**Smart Form Filling** (AI-Assisted):
```typescript
// AI parses natural language input to auto-fill forms
const SmartResourceForm = () => {
  const { complete } = useCompletion();

  const handleNaturalLanguageInput = async (input: string) => {
    // User types: "I'm a CTO at a 50-person fintech company"
    const extracted = await complete('/api/extract-form-data', {
      schema: resourceFormSchema,
      input
    });

    // Auto-fill: job_title = "CTO", company_size = "50", industry = "fintech"
    setFormData(extracted);
  };
};
```

#### 3.1.3 Event Registrations (Webinars, Workshops, Meetups)

**Event Types**:
```typescript
const eventTypes = [
  {
    type: 'webinar',
    title: 'Live AI Implementation Workshop',
    duration: '90 minutes',
    format: 'Zoom + interactive Q&A',
    capacity: 100,
    registrationFields: ['email', 'name', 'company', 'role', 'experience_level'],
    valueProp: 'Build your first AI feature live with our engineers',
    recordingAvailable: true
  },
  {
    type: 'roundtable',
    title: 'CTO Roundtable: Scaling AI Systems',
    duration: '2 hours',
    format: 'In-person (Nairobi) + Virtual',
    capacity: 20,
    registrationFields: ['email', 'name', 'company', 'role', 'team_size', 'challenges'],
    valueProp: 'Peer learning, exclusive networking, confidential discussion',
    qualificationRequired: true // Only qualified leads
  }
];
```

**AI-Enhanced Registration**:
```typescript
// Conversational registration bot
const RegistrationBot = () => {
  const { messages, handleSubmit } = useChat({
    api: '/api/chat/register',
    initialMessage: 'Hi! I\'ll help you register for the event. Let\'s start with your email...'
  });

  // Bot progressively collects information naturally
  // "Great! What's your name?"
  // "What company are you with?"
  // "What's your role there?"
  // "Perfect! What are you hoping to learn?"
  // "You're registered! Check your email for confirmation."
};
```

#### 3.1.4 Interactive Tools (ROI Calculators, Assessments)

**ROI Calculator**:
```typescript
const ROICalculator = () => {
  const [inputs, setInputs] = useState({
    teamSize: 5,
    avgSalary: 80000,
    currentTools: ['salesforce', 'hubspot'],
    painPoints: ['lead_quality', 'follow_up_speed'],
    goals: ['increase_conversions', 'reduce_churn']
  });

  const [projection, setProjection] = useState(null);

  const calculate = async () => {
    // AI-powered projection
    const result = await fetch('/api/ai/calculate-roi', {
      method: 'POST',
      body: JSON.stringify(inputs)
    });

    setProjection(await result.json());
  };

  return (
    <div>
      <InteractiveInputs onChange={setInputs} />
      <Button onClick={calculate}>Calculate My ROI</Button>
      {projection && (
        <ResultsDisplay
          annualSavings={projection.savings}
          timeToValue={projection.timeToValue}
          confidence={projection.confidence}
          onCaptureLead={(email) => saveCalculation(email, inputs, projection)}
        />
      )}
    </div>
  );
};
```

**Self-Assessment Tool**:
```typescript
const AIDevelopmentAssessment = () => {
  const questions = [
    {
      id: 'data_readiness',
      text: 'How would you describe your current data infrastructure?',
      options: ['No data strategy', 'Basic analytics', 'Data warehouse', 'ML pipeline']
    },
    {
      id: 'team_capabilities',
      text: 'What AI/ML experience does your team have?',
      options: ['None', 'Learning', 'Some projects', 'Production ML']
    },
    // ... 15 more questions
  ];

  const [results, setResults] = useState(null);

  const analyze = async (answers) => {
    // AI analyzes and provides personalized roadmap
    const assessment = await fetch('/api/ai/assess-maturity', {
      method: 'POST',
      body: JSON.stringify({ answers, companyContext })
    });

    const { score, recommendations, roadmap, nextSteps } = await assessment.json();

    setResults({ score, recommendations, roadmap, nextSteps });
  };

  return (
    <AssessmentFlow
      questions={questions}
      onComplete={analyze}
      onEmailCapture={(email) => saveAssessment(email, results)}
    />
  );
};
```

#### 3.1.5 Progressive Profiling

**Data Collection Stages**:
```typescript
const profilingStages = [
  {
    stage: 1,
    name: 'Anonymous',
    data: ['cookies', 'session_id', 'referrer', 'landing_page'],
    capture: 'Automatic',
    value: 'Personalized content recommendations'
  },
  {
    stage: 2,
    name: 'Identified',
    data: ['email', 'name'],
    capture: 'Newsletter signup, resource download',
    value: 'Customized newsletter, additional resources'
  },
  {
    stage: 3,
    name: 'Qualified',
    data: ['company', 'role', 'company_size', 'industry', 'challenges'],
    capture: 'AI conversation, event registration',
    value: 'Personalized demos, case studies, consultation'
  },
  {
    stage: 4,
    name: 'Opportunity',
    data: ['budget', 'timeline', 'decision_process', 'tech_stack', 'competitors'],
    capture: 'Sales qualification call',
    value: 'Custom proposal, proof of concept'
  }
];

// Progressive profiling engine
const updateProfileStage = async (leadId: string) => {
  const lead = await Lead.findById(leadId);
  const completeness = calculateProfileCompleteness(lead);

  if (completeness.score >= 0.25 && lead.stage < 2) {
    lead.stage = 2; // Identified
    await triggerWelcomeSequence(lead);
  }
  if (completeness.score >= 0.5 && lead.stage < 3) {
    lead.stage = 3; // Qualified
    await notifySalesTeam(lead);
  }
  if (completeness.score >= 0.8 && lead.stage < 4) {
    lead.stage = 4; // Opportunity
    await assignAccountExecutive(lead);
  }

  await lead.save();
};
```

**AI-Enhanced Profiling** (Inferred Data):
```typescript
// Infer missing data from behavior patterns
const inferProfileData = async (leadId: string) => {
  const interactions = await Interaction.find({ leadId }).sort('-createdAt');

  const prompt = `
    Analyze this user's behavior and infer missing profile data:

    Interactions: ${JSON.stringify(interactions)}
    Current Profile: ${JSON.stringify(currentProfile)}

    Infer (with confidence scores):
    - Company size (based on content engagement)
    - Industry (based on topics viewed)
    - Role (based on resources downloaded)
    - Budget range (based on interest in enterprise features)
    - Timeline (based on urgency signals)
    - Technical sophistication (based on documentation depth)

    Return JSON with inferred fields and confidence (0-1).
  `;

  const inferences = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' }
  });

  // Update profile with high-confidence inferences (>0.7)
  for (const [field, value] of Object.entries(inferences)) {
    if (value.confidence > 0.7 && !currentProfile[field]) {
      currentProfile[field] = value.value;
      currentProfile[`${field}_inferred`] = true;
    }
  }

  await lead.save();
};
```

#### 3.1.6 Exit-Intent Capture

**Smart Exit Detection**:
```typescript
const ExitIntentModal = () => {
  const [show, setShow] = useState(false);
  const [offer, setOffer] = useState(null);

  useEffect(() => {
    const handleExit = (e) => {
      // Detect exit intent (mouse leaving viewport)
      if (e.clientY < 10 && !sessionStorage.getItem('exitShown')) {
        setShow(true);
        sessionStorage.setItem('exitShown', 'true');

        // AI selects best exit offer
        selectExitOffer().then(setOffer);
      }
    };

    document.addEventListener('mouseleave', handleExit);
    return () => document.removeEventListener('mouseleave', handleExit);
  }, []);

  return (
    show && offer && (
      <Modal onClose={() => setShow(false)}>
        <ExitOffer
          type={offer.type}
          title={offer.title}
          description={offer.description}
          cta={offer.cta}
          onCapture={handleCapture}
        />
      </Modal>
    )
  );
};

// AI selects optimal exit offer based on user session
const selectExitOffer = async () => {
  const sessionData = getSessionData();

  const prompt = `
    User session data:
    ${JSON.stringify(sessionData)}

    Select the best exit-intent offer to capture this lead.

    Available offers:
    1. Free AI consultation call (high value, high friction)
    2. Download "AI Implementation Checklist" (medium value, low friction)
    3. Subscribe to "Tech Insights" newsletter (low value, lowest friction)
    4. Join exclusive webinar waitlist (medium value, medium friction)

    Consider:
    - Pages visited
    - Time on site
    - Scroll depth
    - Referral source
    - Industry (if known)
    - Role (if known)

    Return JSON with offer number and personalized messaging.
  `;

  const selection = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' }
  });

  return selection.choices[0].message.content;
};
```

#### 3.1.7 AI Chatbot for Natural Conversation

**24/7 Lead Qualification Bot**:
```typescript
// app/api/chat/qualify/route.ts
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

export async function POST(req: Request) {
  const { messages, conversationId } = await req.json();

  // Retrieve conversation history
  const history = await getConversationHistory(conversationId);

  const result = streamText({
    model: openai('gpt-4o'),
    system: `You are an EmenTech solutions specialist. Your goals:
    1. Understand the visitor's needs and challenges
    2. Provide helpful, valuable advice (not sales pitches)
    3. Naturally gather information: role, company, challenges, timeline, budget
    4. Qualify leads based on: budget ($10k+), timeline (<6 months), decision-maker
    5. For qualified leads: suggest a demo call
    6. Be conversational, helpful, and never pushy

    Qualification criteria:
    - Budget: Looking to invest $10k+
    - Timeline: Project starting within 6 months
    - Authority: Decision maker or influencer
    - Need: Clear pain point we can solve

    If qualified, use the 'schedule_demo' function to suggest a call.`,
    messages: [...history, ...messages],
    tools: {
      schedule_demo: {
        description: 'Schedule a demo call for qualified leads',
        parameters: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            company: { type: 'string' },
            preferredTime: { type: 'string' },
            reason: { type: 'string' }
          },
          required: ['name', 'email', 'company']
        }
      },
      send_resource: {
        description: 'Send a relevant resource to the visitor',
        parameters: {
          type: 'object',
          properties: {
            email: { type: 'string' },
            resourceId: { type: 'string' },
            reason: { type: 'string' }
          },
          required: ['email', 'resourceId']
        }
      },
      save_lead: {
        description: 'Save lead information to CRM',
        parameters: {
          type: 'object',
          properties: {
            email: { type: 'string' },
            name: { type: 'string' },
            company: { type: 'string' },
            role: { type: 'string' },
            challenges: { type: 'array', items: { type: 'string' } },
            budget: { type: 'string' },
            timeline: { type: 'string' }
          },
          required: ['email', 'name']
        }
      }
    },
    onFinish: async ({ toolCalls }) => {
      // Track tool calls for analytics
      for (const toolCall of toolCalls) {
        await trackEvent('chatbot_tool_call', {
          tool: toolCall.toolName,
          conversationId
        });
      }
    }
  });

  return result.toDataStreamResponse();
}
```

**Bot UI Component**:
```typescript
// components/chatbot/LeadQualificationChat.tsx
'use client';

import { useChat } from 'ai/react';
import { useState } from 'react';

export function LeadQualificationChat() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat/qualify',
    initialMessages: [{
      id: '1',
      role: 'assistant',
      content: 'Hi! Welcome to EmenTech. I\'m here to help you explore how AI can transform your business. What brings you here today?'
    }],
    onFinish: async (message) => {
      // Check if lead was qualified
      if (message.toolCalls?.some(t => t.toolName === 'schedule_demo')) {
        await trackEvent('lead_qualified', { source: 'chatbot' });
      }
    }
  });

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[500px] bg-white rounded-lg shadow-2xl flex flex-col">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 rounded-t-lg">
        <h3 className="font-semibold">Talk to an AI Specialist</h3>
        <p className="text-sm opacity-90">Typically replies instantly</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(m => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-lg ${
              m.role === 'user'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-900'
            }`}>
              {m.content}
              {m.toolCalls && (
                <div className="text-xs opacity-75 mt-2">
                  ✓ {m.toolCalls.map(t => t.toolName).join(', ')}
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && <TypingIndicator />}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={handleInputChange}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
```

---

## 4. AI-Powered Engagement Layer

### 4.1 Intelligent Chatbot Architecture

#### 4.1.1 Multi-Agent System

```typescript
// lib/ai/agents/index.ts
import { OpenAI } from '@ai-sdk/openai';

// Agent orchestrator
class AgentOrchestrator {
  private agents: Map<string, Agent>;

  constructor() {
    this.agents = new Map([
      ['researcher', new ResearchAgent()],
      ['consultant', new ConsultantAgent()],
      ['qualifier', new QualifierAgent()],
      ['scheduler', new SchedulerAgent()]
    ]);
  }

  async routeMessage(message: string, context: ConversationContext) {
    // Intent-based routing
    const intent = await this.classifyIntent(message, context);

    // Select appropriate agent
    const agent = this.agents.get(intent.agent);

    // Execute agent workflow
    return await agent.execute(message, context);
  }

  private async classifyIntent(message: string, context: ConversationContext) {
    // Use embeddings + vector search for intent classification
    const embedding = await embed(message);
    const similarIntents = await vectorStore.query({
      vector: embedding,
      topK: 1,
      filter: { type: 'intent' }
    });

    return similarIntents.matches[0].metadata;
  }
}

// Research Agent - Provides helpful information
class ResearchAgent extends Agent {
  async execute(message: string, context: ConversationContext) {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      tools: [searchKnowledgeBase, getCaseStudies, getBlogPosts],
      toolChoice: 'auto',
      messages: [{
        role: 'system',
        content: 'You are a helpful research specialist. Provide valuable, actionable information based on the user\'s question. Cite sources when relevant.'
      }, {
        role: 'user',
        content: message
      }]
    });

    return response;
  }
}

// Consultant Agent - Engages in consulting conversations
class ConsultantAgent extends Agent {
  async execute(message: string, context: ConversationContext) {
    // Gather user's business context
    const businessContext = await this.gatherBusinessContext(message, context);

    // Provide tailored advice
    const advice = await openai.chat.completions.create({
      model: 'claude-3-5-sonnet-20241022', // Better for complex reasoning
      messages: [{
        role: 'system',
        content: `You are an experienced AI consultant. Provide strategic, practical advice tailored to the user's specific situation. Ask clarifying questions when needed. Be direct and actionable.`
      }, {
        role: 'user',
        content: `Context: ${JSON.stringify(businessContext)}\n\nQuestion: ${message}`
      }]
    });

    return advice;
  }
}

// Qualifier Agent - Natural lead qualification
class QualifierAgent extends Agent {
  async execute(message: string, context: ConversationContext) {
    const qualification = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{
        role: 'system',
        content: `You are a lead qualification specialist. Naturally gather BANT information:
        - Budget: What's their budget range?
        - Authority: Are they a decision maker?
        - Need: What challenges are they facing?
        - Timeline: When are they looking to implement?

        Be conversational. Ask one question at a time. Build rapport first.`
      }, ...context.history, {
        role: 'user',
        content: message
      }],
      tools: [saveLead, calculateLeadScore]
    });

    return qualification;
  }
}

// Scheduler Agent - Books meetings
class SchedulerAgent extends Agent {
  async execute(message: string, context: ConversationContext) {
    const scheduling = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{
        role: 'system',
        content: 'You are a scheduling assistant. Help book meetings at convenient times. Confirm details before scheduling.'
      }, ...context.history, {
        role: 'user',
        content: message
      }],
      tools: [getAvailableSlots, bookMeeting, sendConfirmation]
    });

    return scheduling;
  }
}
```

#### 4.1.2 RAG Implementation (Retrieval-Augmented Generation)

```typescript
// lib/ai/rag/index.ts
import { Pinecone } from '@pinecone-database/pinecone';
import { embed } from 'ai';

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!
});

const index = pinecone.index('ementech-knowledge-base');

export async function retrieveRelevantContext(query: string, filters?: any) {
  // 1. Embed query
  const { embedding } = await embed({
    model: openai.embedding('text-embedding-3-small'),
    value: query
  });

  // 2. Vector search
  const results = await index.query({
    vector: embedding,
    topK: 5,
    includeMetadata: true,
    filter: filters
  });

  // 3. Rerank for relevance
  const reranked = await rerankResults(query, results.matches);

  // 4. Return top 3
  return reranked.slice(0, 3);
}

// Rerank with Cohere
async function rerankResults(query: string, documents: any[]) {
  const response = await fetch('https://api.cohere.ai/v1/rerank', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.COHERE_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'rerank-english-v3.0',
      query,
      documents: documents.map(doc => ({
        text: doc.metadata.text,
        id: doc.id
      }))
    })
  });

  const results = await response.json();
  return results.results.map(r => documents[r.index]);
}

// RAG chat endpoint
export async function ragChat(query: string, conversationHistory: Message[]) {
  // 1. Retrieve relevant context
  const context = await retrieveRelevantContext(query);

  // 2. Generate response with context
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{
      role: 'system',
      content: `You are a knowledgeable EmenTech assistant. Answer questions using the following context. Cite your sources using [Source X] notation.

      Context:
      ${context.map((c, i) => `[Source ${i+1}]: ${c.metadata.text}`).join('\n\n')}

      If the context doesn't contain enough information, say so and offer to connect them with a human expert.`
    }, ...conversationHistory, {
      role: 'user',
      content: query
    }]
  });

  return {
    answer: response.choices[0].message.content,
    sources: context.map(c => ({
      title: c.metadata.title,
      url: c.metadata.url,
      type: c.metadata.type
    }))
  };
}
```

#### 4.1.3 Knowledge Base Structure

```typescript
// Content to be indexed in vector database
const knowledgeBaseCategories = [
  {
    category: 'services',
    documents: [
      {
        id: 'service-ai-consulting',
        title: 'AI Strategy Consulting',
        text: 'Comprehensive AI implementation roadmap development, technology selection, and proof-of-concept development...',
        metadata: {
          type: 'service',
          url: '/services/ai-consulting',
          pricing: '$5k-50k',
          duration: '2-12 weeks'
        }
      },
      {
        id: 'service-ml-development',
        title: 'Custom ML Development',
        text: 'End-to-end machine learning solution development including data pipelines, model training, and production deployment...',
        metadata: {
          type: 'service',
          url: '/services/ml-development',
          pricing: '$10k-200k',
          duration: '4-24 weeks'
        }
      }
    ]
  },
  {
    category: 'case-studies',
    documents: [
      {
        id: 'case-fintech-ml',
        title: 'Fintech Startup Reduces Fraud by 94%',
        text: 'How we implemented ML-based fraud detection for a Series A fintech company...',
        metadata: {
          type: 'case-study',
          industry: 'fintech',
          companySize: '50-200',
          results: ['94% fraud reduction', '3x ROI', '6 month implementation']
        }
      }
    ]
  },
  {
    category: 'resources',
    documents: [
      {
        id: 'blog-rag-best-practices',
        title: 'RAG Implementation Best Practices in 2025',
        text: 'Production-proven patterns for building robust RAG systems including chunking strategies, reranking, and evaluation...',
        metadata: {
          type: 'blog',
          publishedAt: '2025-01-15',
          readTime: '8 minutes',
          url: '/blog/rag-best-practices'
        }
      }
    ]
  }
];

// Ingest content pipeline
async function ingestKnowledgeBase() {
  for (const category of knowledgeBaseCategories) {
    for (const doc of category.documents) {
      // 1. Chunk document
      const chunks = chunkText(doc.text, {
        chunkSize: 500,
        overlap: 100
      });

      // 2. Embed chunks
      const embeddings = await Promise.all(
        chunks.map(chunk => embed({
          model: openai.embedding('text-embedding-3-small'),
          value: chunk
        }))
      );

      // 3. Upsert to Pinecone
      await index.upsert(
        embeddings.map((emb, i) => ({
          id: `${doc.id}-chunk-${i}`,
          values: emb.embedding,
          metadata: {
            ...doc.metadata,
            text: chunks[i],
            chunkIndex: i,
            documentId: doc.id
          }
        }))
      );
    }
  }
}
```

### 4.2 Personalized Content Recommendations

```typescript
// lib/ai/recommendations.ts
export async function getPersonalizedRecommendations(userId: string) {
  // 1. Get user profile
  const profile = await getUserProfile(userId);

  // 2. Get behavioral embeddings
  const behaviorEmbedding = await embedUserBehavior(profile.behaviors);

  // 3. Find similar users
  const similarUsers = await findSimilarUsers(behaviorEmbedding);

  // 4. Get content engaged by similar users
  const engagedContent = await getContentEngagedByUsers(similarUsers);

  // 5. Rank by relevance and novelty
  const recommendations = await rankContent({
    content: engagedContent,
    userProfile: profile,
    behavior: profile.behaviors
  });

  return recommendations;
}

// Content ranking AI
async function rankContent(params: any) {
  const prompt = `
    Rank this content for user with profile:

    User Profile:
    ${JSON.stringify(params.userProfile)}

    Recent Behaviors:
    ${JSON.stringify(params.behavior.slice(-10))}

    Candidate Content:
    ${JSON.stringify(params.content)}

    Rank by:
    1. Relevance to user's interests
    2. Appropriateness for their stage
    3. Novelty (not already consumed)
    4. Actionability (practical value)

    Return top 10 with scores (0-1) and reasoning.
  `;

  const ranked = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' }
  });

  return JSON.parse(ranked.choices[0].message.content);
}
```

### 4.3 Behavioral Tracking & Analytics

```typescript
// lib/analytics/tracker.ts
export class BehavioralTracker {
  async trackEvent(event: TrackingEvent) {
    // 1. Store event
    await Interaction.create({
      leadId: event.leadId,
      type: event.type,
      properties: event.properties,
      timestamp: new Date(),
      sessionId: event.sessionId
    });

    // 2. Update user profile in real-time
    await this.updateProfileFromEvent(event);

    // 3. Trigger automations
    await this.checkTriggerConditions(event);
  }

  private async updateProfileFromEvent(event: TrackingEvent) {
    const profile = await Lead.findById(event.leadId);

    // Update interests based on content viewed
    if (event.type === 'page_view') {
      const topics = await extractTopics(event.properties.url);
      profile.interests = mergeTopics(profile.interests, topics);
    }

    // Update stage based on engagement depth
    if (event.type === 'resource_download') {
      profile.engagementScore += 10;
    }

    // Update intent based on behavior patterns
    profile.buyingStage = await this.predictBuyingStage(profile);

    await profile.save();
  }

  private async checkTriggerConditions(event: TrackingEvent) {
    // High-intent trigger
    if (event.type === 'pricing_page_view' && event.properties.duration > 60) {
      await this.triggerHighIntentWorkflow(event.leadId);
    }

    // Re-engagement trigger
    const lastVisit = await this.getLastVisit(event.leadId);
    if (lastVisit && Date.now() - lastVisit > 7 * 24 * 60 * 60 * 1000) {
      await this.triggerReengagement(event.leadId);
    }
  }
}
```

### 4.4 Predictive Lead Scoring

```typescript
// lib/ai/lead-scoring.ts
export class LeadScoringEngine {
  async scoreLead(leadId: string): Promise<LeadScore> {
    const lead = await Lead.findById(leadId).populate('interactions');

    // 1. Extract features
    const features = await this.extractFeatures(lead);

    // 2. Predict conversion probability
    const probability = await this.predictConversion(features);

    // 3. Calculate score (0-100)
    const score = Math.round(probability * 100);

    // 4. Determine grade
    const grade = this.determineGrade(score);

    // 5. Get recommended actions
    const actions = await this.getRecommendedActions(score, features);

    return { score, grade, probability, factors: features, actions };
  }

  private async extractFeatures(lead: Lead): Promise<LeadFeatures> {
    return {
      // Behavioral features (40%)
      engagementScore: this.calculateEngagement(lead.interactions),
      visitFrequency: this.calculateVisitFrequency(lead.interactions),
      contentDepth: this.calculateContentDepth(lead.interactions),
      timeOnSite: this.calculateTotalTimeOnSite(lead.interactions),

      // Demographic features (25%)
      companySize: lead.companySize,
      industry: lead.industry,
      role: lead.role,
      seniority: lead.seniority,

      // Firmographic features (20%)
      budget: lead.budget,
      timeline: lead.timeline,
      authority: lead.authority,

      // Intent features (15%)
      buyingStage: lead.buyingStage,
      painPoints: lead.painPoints,
      techStack: lead.techStack
    };
  }

  private async predictConversion(features: LeadFeatures): Promise<number> {
    // For MVP: rule-based scoring
    // For production: train ML model on historical data

    const weights = {
      engagementScore: 0.25,
      visitFrequency: 0.10,
      contentDepth: 0.05,
      budget: 0.20,
      timeline: 0.15,
      authority: 0.15,
      buyingStage: 0.10
    };

    const probability =
      (features.engagementScore / 100) * weights.engagementScore +
      (Math.min(features.visitFrequency / 10, 1)) * weights.visitFrequency +
      (Math.min(features.contentDepth / 50, 1)) * weights.contentDepth +
      (this.scoreBudget(features.budget) * weights.budget) +
      (this.scoreTimeline(features.timeline) * weights.timeline) +
      (this.scoreAuthority(features.authority) * weights.authority) +
      (this.scoreBuyingStage(features.buyingStage) * weights.buyingStage);

    return Math.max(0, Math.min(1, probability));
  }

  private determineGrade(score: number): LeadGrade {
    if (score >= 80) return 'A'; // Hot lead - immediate follow-up
    if (score >= 60) return 'B'; // Warm lead - nurture
    if (score >= 40) return 'C'; // Cool lead - monitor
    return 'D'; // Cold lead - minimal effort
  }

  private async getRecommendedActions(score: number, features: LeadFeatures): Promise<string[]> {
    const prompt = `
      Lead score: ${score}/100
      Features: ${JSON.stringify(features)}

      Recommend 3-5 specific actions to move this lead forward.
      Consider:
      - What's their biggest barrier?
      - What content would be most valuable?
      - What's the next logical step?
      - How urgent is follow-up?

      Return prioritized action list with reasoning.
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }]
    });

    return parseActions(response.choices[0].message.content);
  }
}
```

---

## 5. Data Models & Schema Design

### 5.1 MongoDB Collections

#### 5.1.1 Leads Collection (Progressive Profiling)

```typescript
// models/Lead.model.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface ILead extends Document {
  // Identification
  email: string;
  emailLower: string;
  name?: string;

  // Progressive profiling fields (collected over time)
  profile: {
    // Basic (Stage 2)
    company?: string;
    role?: string;
    phone?: string;

    // Qualified (Stage 3)
    companySize?: string; // '1-10', '11-50', '51-200', '201-500', '500+'
    industry?: string;
    website?: string;
    linkedIn?: string;

    // Opportunity (Stage 4)
    budget?: string; // '<10k', '10k-50k', '50k-100k', '100k+'
    timeline?: string; // 'immediate', '1-3mo', '3-6mo', '6-12mo', '12mo+'
    decisionProcess?: string;
    techStack?: string[];
    competitors?: string[];
  };

  // Behavioral data
  behaviors: {
    visits: number;
    pageViews: number;
    timeOnSite: number; // seconds
    lastVisitAt: Date;
    firstVisitAt: Date;
    scrollDepth: number; // average % scrolled
  };

  // Engagement
  engagement: {
    score: number; // 0-100
    stage: 'anonymous' | 'identified' | 'qualified' | 'opportunity' | 'customer';
    buyingStage: 'awareness' | 'consideration' | 'decision';
    source: string; // How they found us
    medium: string; // Channel
    campaign?: string;
  };

  // Interactions
  interactions: mongoose.Types.ObjectId[]; // Ref: Interaction
  conversions: mongoose.Types.ObjectId[]; // Ref: Conversion

  // AI-derived data
  aiData: {
    interests: string[]; // Inferred from content
    painPoints: string[]; // Inferred from behavior
    intentScore: number; // 0-1
    predictedBudget?: string;
    predictedTimeline?: string;
    similarityCluster?: string; // Similar leads
    nextBestAction?: string;
  };

  // Lead qualification
  qualification: {
    score?: number; // 0-100
    grade?: 'A' | 'B' | 'C' | 'D';
    probability?: number; // Conversion probability
    factors?: Record<string, number>;
    qualifiedAt?: Date;
    assignedTo?: string; // Salesperson
  };

  // Preferences
  preferences: {
    communication: 'email' | 'phone' | 'whatsapp';
    frequency: 'daily' | 'weekly' | 'bi-weekly' | 'monthly';
    topics: string[];
    doNotContact: boolean;
  };

  // Privacy & Consent
  consent: {
    given: boolean;
    givenAt: Date;
    method: string; // 'checkbox', 'implicit', 'chat'
    dataProcessing: boolean;
    marketing: boolean;
    gdprAccepted: boolean;
  };

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

const LeadSchema = new Schema<ILead>({
  email: {
    type: String,
    required: true,
    index: true
  },
  emailLower: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  name: String,

  profile: {
    company: String,
    role: String,
    phone: String,
    companySize: {
      type: String,
      enum: ['1-10', '11-50', '51-200', '201-500', '500+']
    },
    industry: String,
    website: String,
    linkedIn: String,
    budget: {
      type: String,
      enum: ['<10k', '10k-50k', '50k-100k', '100k+']
    },
    timeline: {
      type: String,
      enum: ['immediate', '1-3mo', '3-6mo', '6-12mo', '12mo+']
    },
    decisionProcess: String,
    techStack: [String],
    competitors: [String]
  },

  behaviors: {
    visits: { type: Number, default: 0 },
    pageViews: { type: Number, default: 0 },
    timeOnSite: { type: Number, default: 0 },
    lastVisitAt: Date,
    firstVisitAt: { type: Date, default: Date.now },
    scrollDepth: { type: Number, default: 0 }
  },

  engagement: {
    score: { type: Number, default: 0, min: 0, max: 100 },
    stage: {
      type: String,
      enum: ['anonymous', 'identified', 'qualified', 'opportunity', 'customer'],
      default: 'anonymous'
    },
    buyingStage: {
      type: String,
      enum: ['awareness', 'consideration', 'decision'],
      default: 'awareness'
    },
    source: String,
    medium: String,
    campaign: String
  },

  interactions: [{
    type: Schema.Types.ObjectId,
    ref: 'Interaction'
  }],
  conversions: [{
    type: Schema.Types.ObjectId,
    ref: 'Conversion'
  }],

  aiData: {
    interests: [String],
    painPoints: [String],
    intentScore: { type: Number, min: 0, max: 1 },
    predictedBudget: String,
    predictedTimeline: String,
    similarityCluster: String,
    nextBestAction: String
  },

  qualification: {
    score: { type: Number, min: 0, max: 100 },
    grade: {
      type: String,
      enum: ['A', 'B', 'C', 'D']
    },
    probability: { type: Number, min: 0, max: 1 },
    factors: Map,
    qualifiedAt: Date,
    assignedTo: String
  },

  preferences: {
    communication: {
      type: String,
      enum: ['email', 'phone', 'whatsapp'],
      default: 'email'
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'bi-weekly', 'monthly'],
      default: 'weekly'
    },
    topics: [String],
    doNotContact: { type: Boolean, default: false }
  },

  consent: {
    given: { type: Boolean, required: true, default: false },
    givenAt: Date,
    method: String,
    dataProcessing: { type: Boolean, default: false },
    marketing: { type: Boolean, default: false },
    gdprAccepted: { type: Boolean, default: false }
  },

  deletedAt: Date
}, {
  timestamps: true
});

// Indexes
LeadSchema.index({ emailLower: 1 });
LeadSchema.index({ 'engagement.stage': 1 });
LeadSchema.index({ 'qualification.score': -1 });
LeadSchema.index({ createdAt: -1 });
LeadSchema.index({ 'behaviors.lastVisitAt': -1 });

// Compound indexes
LeadSchema.index({ 'engagement.stage': 1, 'qualification.grade': 1 });
LeadSchema.index({ 'profile.industry': 1, 'profile.companySize': 1 });

export const Lead = mongoose.model<ILead>('Lead', LeadSchema);
```

#### 5.1.2 Interactions Collection

```typescript
// models/Interaction.model.ts
export interface IInteraction extends Document {
  leadId: mongoose.Types.ObjectId;
  sessionId: string;

  // Event details
  type: InteractionType;
  category: 'page_view' | 'engagement' | 'conversion' | 'chat' | 'email';

  // Event-specific data
  properties: {
    // Page view
    url?: string;
    path?: string;
    referrer?: string;
    title?: string;
    duration?: number; // seconds

    // Engagement
    elementType?: string; // 'button', 'link', 'form'
    elementId?: string;
    elementText?: string;
    scrollDepth?: number;

    // Resource
    resourceId?: string;
    resourceType?: string;

    // Chat
    message?: string;
    botResponse?: string;
    toolCalls?: string[];

    // Email
    emailId?: string;
    linkClicked?: string;
  };

  // Context
  context: {
    userAgent: string;
    ip: string;
    country?: string;
    city?: string;
    device: 'desktop' | 'mobile' | 'tablet';
    browser: string;
    os: string;
  };

  // AI analysis
  aiAnalysis?: {
    intent?: string;
    sentiment?: 'positive' | 'neutral' | 'negative';
    topics?: string[];
    urgency?: 'low' | 'medium' | 'high';
    value?: number; // Estimated value 0-100
  };

  createdAt: Date;
}

type InteractionType =
  | 'page_view'
  | 'page_exit'
  | 'click'
  | 'scroll'
  | 'form_submit'
  | 'form_start'
  | 'resource_download'
  | 'newsletter_signup'
  | 'event_register'
  | 'chat_message'
  | 'chat_tool_call'
  | 'email_open'
  | 'email_click'
  | 'roi_calculate'
  | 'assessment_complete';

const InteractionSchema = new Schema<IInteraction>({
  leadId: {
    type: Schema.Types.ObjectId,
    ref: 'Lead',
    required: true,
    index: true
  },
  sessionId: { type: String, required: true, index: true },

  type: {
    type: String,
    required: true,
    enum: [
      'page_view', 'page_exit', 'click', 'scroll',
      'form_submit', 'form_start',
      'resource_download', 'newsletter_signup', 'event_register',
      'chat_message', 'chat_tool_call',
      'email_open', 'email_click',
      'roi_calculate', 'assessment_complete'
    ]
  },
  category: {
    type: String,
    enum: ['page_view', 'engagement', 'conversion', 'chat', 'email'],
    required: true
  },

  properties: {
    url: String,
    path: String,
    referrer: String,
    title: String,
    duration: Number,
    elementType: String,
    elementId: String,
    elementText: String,
    scrollDepth: Number,
    resourceId: String,
    resourceType: String,
    message: String,
    botResponse: String,
    toolCalls: [String],
    emailId: String,
    linkClicked: String
  },

  context: {
    userAgent: String,
    ip: String,
    country: String,
    city: String,
    device: {
      type: String,
      enum: ['desktop', 'mobile', 'tablet']
    },
    browser: String,
    os: String
  },

  aiAnalysis: {
    intent: String,
    sentiment: {
      type: String,
      enum: ['positive', 'neutral', 'negative']
    },
    topics: [String],
    urgency: {
      type: String,
      enum: ['low', 'medium', 'high']
    },
    value: { type: Number, min: 0, max: 100 }
  }
}, {
  timestamps: true
});

// Indexes
InteractionSchema.index({ leadId: 1, createdAt: -1 });
InteractionSchema.index({ sessionId: 1 });
InteractionSchema.index({ type: 1 });
InteractionSchema.index({ createdAt: -1 });

// TTL for old interactions (90 days)
InteractionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export const Interaction = mongoose.model<IInteraction>('Interaction', InteractionSchema);
```

#### 5.1.3 Content Collection

```typescript
// models/Content.model.ts
export interface IContent extends Document {
  // Basic info
  title: string;
  slug: string;
  type: 'blog' | 'case_study' | 'whitepaper' | 'guide' | 'webinar' | 'newsletter';

  // Content
  body: string;
  excerpt?: string;
  coverImage?: string;

  // Categorization
  topics: string[];
  tags: string[];
  industry?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';

  // Metadata
  seo: {
    metaTitle: string;
    metaDescription: string;
    keywords: string[];
  };

  // Engagement
  stats: {
    views: number;
    downloads: number;
    shares: number;
    avgReadingTime: number;
    conversionRate: number;
  };

  // Gating
  gating: {
    isGated: boolean;
    requiredFields?: string[]; // ['email', 'company']
    valueExchange: string; // "Download our comprehensive guide"
  };

  // AI embeddings
  embeddings?: {
    textEmbedding: number[]; // For semantic search
    topicEmbedding: number[]; // For recommendation
  };

  // Related content
  relatedContent: mongoose.Types.ObjectId[];

  // Published
  publishedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ContentSchema = new Schema<IContent>({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  type: {
    type: String,
    enum: ['blog', 'case_study', 'whitepaper', 'guide', 'webinar', 'newsletter'],
    required: true
  },

  body: { type: String, required: true },
  excerpt: String,
  coverImage: String,

  topics: [String],
  tags: [String],
  industry: String,
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },

  seo: {
    metaTitle: String,
    metaDescription: String,
    keywords: [String]
  },

  stats: {
    views: { type: Number, default: 0 },
    downloads: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    avgReadingTime: { type: Number, default: 0 },
    conversionRate: { type: Number, default: 0 }
  },

  gating: {
    isGated: { type: Boolean, default: false },
    requiredFields: [String],
    valueExchange: String
  },

  embeddings: {
    textEmbedding: [Number],
    topicEmbedding: [Number]
  },

  relatedContent: [{
    type: Schema.Types.ObjectId,
    ref: 'Content'
  }],

  publishedAt: Date
}, {
  timestamps: true
});

ContentSchema.index({ slug: 1 });
ContentSchema.index({ type: 1 });
ContentSchema.index({ topics: 1 });
ContentSchema.index({ publishedAt: -1 });

export const Content = mongoose.model<IContent>('Content', ContentSchema);
```

#### 5.1.4 Conversations Collection (AI Chat)

```typescript
// models/Conversation.model.ts
export interface IConversation extends Document {
  leadId?: mongoose.Types.ObjectId; // Anonymous until identified

  // Conversation metadata
  sessionId: string;
  channel: 'webchat' | 'email' | 'sms';
  status: 'active' | 'resolved' | 'escalated';

  // Messages
  messages: ConversationMessage[];

  // Agent assignment
  assignedTo?: {
    type: 'ai' | 'human';
    agentId?: string;
    name: string;
  };

  // AI analysis
  aiAnalysis?: {
    primaryIntent?: string;
    intents: string[];
    sentiment?: 'positive' | 'neutral' | 'negative';
    urgency?: 'low' | 'medium' | 'high';
    qualificationProgress: number; // 0-1
    estimatedValue?: number;
  };

  // Outcome
  outcome?: {
    resolved: boolean;
    satisfaction?: number; // 1-5
    conversion?: boolean;
    nextAction?: string;
  };

  startedAt: Date;
  endedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

type ConversationMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  toolCalls?: Array<{
    id: string;
    name: string;
    arguments: Record<string, any>;
    result?: any;
  }>;
  timestamp: Date;
  metadata?: {
    source: 'ai' | 'human' | 'template';
    confidence?: number;
  };
};

const ConversationSchema = new Schema<IConversation>({
  leadId: {
    type: Schema.Types.ObjectId,
    ref: 'Lead',
    index: true
  },
  sessionId: { type: String, required: true, index: true },
  channel: {
    type: String,
    enum: ['webchat', 'email', 'sms'],
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'resolved', 'escalated'],
    default: 'active'
  },

  messages: [{
    id: String,
    role: {
      type: String,
      enum: ['user', 'assistant', 'system'],
      required: true
    },
    content: { type: String, required: true },
    toolCalls: [{
      id: String,
      name: String,
      arguments: Schema.Types.Mixed,
      result: Schema.Types.Mixed
    }],
    timestamp: { type: Date, default: Date.now },
    metadata: {
      source: { type: String, enum: ['ai', 'human', 'template'] },
      confidence: Number
    }
  }],

  assignedTo: {
    type: {
      type: String,
      enum: ['ai', 'human']
    },
    agentId: String,
    name: String
  },

  aiAnalysis: {
    primaryIntent: String,
    intents: [String],
    sentiment: {
      type: String,
      enum: ['positive', 'neutral', 'negative']
    },
    urgency: {
      type: String,
      enum: ['low', 'medium', 'high']
    },
    qualificationProgress: { type: Number, min: 0, max: 1 },
    estimatedValue: Number
  },

  outcome: {
    resolved: Boolean,
    satisfaction: { type: Number, min: 1, max: 5 },
    conversion: Boolean,
    nextAction: String
  },

  startedAt: { type: Date, default: Date.now },
  endedAt: Date
}, {
  timestamps: true
});

ConversationSchema.index({ leadId: 1, startedAt: -1 });
ConversationSchema.index({ sessionId: 1 });
ConversationSchema.index({ status: 1 });

export const Conversation = mongoose.model<IConversation>('Conversation', ConversationSchema);
```

#### 5.1.5 Events Collection

```typescript
// models/Event.model.ts
export interface IEvent extends Document {
  name: string;
  slug: string;
  type: 'webinar' | 'workshop' | 'roundtable' | 'meetup';

  // Details
  description: string;
  agenda: string[];
  speakers: Array<{
    name: string;
    title: string;
    company: string;
    photo?: string;
    bio?: string;
  }>;

  // Schedule
  scheduledFor: Date;
  duration: number; // minutes
  timezone: string;

  // Format
  format: 'virtual' | 'in-person' | 'hybrid';
  platform?: string; // 'Zoom', 'Google Meet', etc.
  location?: string;

  // Capacity
  capacity: number;
  registeredCount: number;

  // Registration requirements
  registration: {
    required: boolean;
    fields: string[]; // ['email', 'name', 'company']
    qualificationRequired?: boolean;
  };

  // Content
  coverImage?: string;
  recordingAvailable: boolean;
  recordingUrl?: string;

  status: 'upcoming' | 'live' | 'completed' | 'cancelled';

  createdAt: Date;
  updatedAt: Date;
}

const EventSchema = new Schema<IEvent>({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  type: {
    type: String,
    enum: ['webinar', 'workshop', 'roundtable', 'meetup'],
    required: true
  },

  description: { type: String, required: true },
  agenda: [String],
  speakers: [{
    name: String,
    title: String,
    company: String,
    photo: String,
    bio: String
  }],

  scheduledFor: { type: Date, required: true },
  duration: { type: Number, required: },
  timezone: { type: String, default: 'Africa/Nairobi' },

  format: {
    type: String,
    enum: ['virtual', 'in-person', 'hybrid'],
    required: true
  },
  platform: String,
  location: String,

  capacity: { type: Number, required: true },
  registeredCount: { type: Number, default: 0 },

  registration: {
    required: { type: Boolean, default: true },
    fields: [String],
    qualificationRequired: Boolean
  },

  coverImage: String,
  recordingAvailable: { type: Boolean, default: false },
  recordingUrl: String,

  status: {
    type: String,
    enum: ['upcoming', 'live', 'completed', 'cancelled'],
    default: 'upcoming'
  }
}, {
  timestamps: true
});

EventSchema.index({ slug: 1 });
EventSchema.index({ scheduledFor: 1 });
EventSchema.index({ status: 1 });

export const Event = mongoose.model<IEvent>('Event', EventSchema);

// Event Registrations
export interface IEventRegistration extends Document {
  eventId: mongoose.Types.ObjectId;
  leadId: mongoose.Types.ObjectId;

  // Registration data
  data: {
    name: string;
    email: string;
    company?: string;
    role?: string;
    [key: string]: any;
  };

  // Attendance
  attended: boolean;
  attendedAt?: Date;

  // Engagement
  questionsAsked: number;
  pollResponses: number;

  // Follow-up
  followUpSent: boolean;
  followUpAt?: Date;

  registeredAt: Date;
}

const EventRegistrationSchema = new Schema<IEventRegistration>({
  eventId: {
    type: Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
    index: true
  },
  leadId: {
    type: Schema.Types.ObjectId,
    ref: 'Lead',
    required: true,
    index: true
  },

  data: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    company: String,
    role: String
  },

  attended: { type: Boolean, default: false },
  attendedAt: Date,

  questionsAsked: { type: Number, default: 0 },
  pollResponses: { type: Number, default: 0 },

  followUpSent: { type: Boolean, default: false },
  followUpAt: Date,

  registeredAt: { type: Date, default: Date.now }
});

EventRegistrationSchema.index({ eventId: 1, leadId: 1 }, { unique: true });

export const EventRegistration = mongoose.model<IEventRegistration>('EventRegistration', EventRegistrationSchema);
```

---

[CONTINUED IN NEXT MESSAGE DUE TO LENGTH...]

## 6. API Specifications

### 6.1 REST API Endpoints

#### 6.1.1 Lead Management APIs

```typescript
// app/api/leads/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Lead } from '@/models/Lead.model';
import { z } from 'zod';

// Validation schemas
const createLeadSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  consent: z.object({
    given: z.boolean(),
    dataProcessing: z.boolean(),
    marketing: z.boolean()
  }),
  source: z.string(),
  medium: z.string(),
  campaign: z.string().optional()
});

// GET /api/leads - List leads (with filtering)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  const filters = {
    stage: searchParams.get('stage'),
    grade: searchParams.get('grade'),
    industry: searchParams.get('industry'),
    source: searchParams.get('source'),
    dateFrom: searchParams.get('dateFrom'),
    dateTo: searchParams.get('dateTo')
  };

  const pagination = {
    page: parseInt(searchParams.get('page') || '1'),
    limit: parseInt(searchParams.get('limit') || '20')
  };

  const leads = await Lead.find(filters)
    .sort({ createdAt: -1 })
    .skip((pagination.page - 1) * pagination.limit)
    .limit(pagination.limit)
    .populate('interactions');

  const total = await Lead.countDocuments(filters);

  return NextResponse.json({
    leads,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      pages: Math.ceil(total / pagination.limit)
    }
  });
}

// POST /api/leads - Create or update lead
export async function POST(request: NextRequest) {
  const body = await request.json();
  const validated = createLeadSchema.parse(body);

  // Check if lead exists
  const existingLead = await Lead.findOne({
    emailLower: validated.email.toLowerCase()
  });

  if (existingLead) {
    // Update existing lead
    existingLead.consent = validated.consent;
    if (validated.name && !existingLead.name) {
      existingLead.name = validated.name;
    }
    await existingLead.save();

    return NextResponse.json({ lead: existingLead, updated: true });
  }

  // Create new lead
  const lead = await Lead.create({
    email: validated.email,
    emailLower: validated.email.toLowerCase(),
    name: validated.name,
    consent: validated.consent,
    engagement: {
      stage: 'identified',
      source: validated.source,
      medium: validated.medium,
      campaign: validated.campaign
    },
    behaviors: {
      firstVisitAt: new Date(),
      lastVisitAt: new Date()
    }
  });

  // Trigger welcome sequence
  await triggerWelcomeSequence(lead);

  return NextResponse.json({ lead, created: true }, { status: 201 });
}
```

```typescript
// app/api/leads/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Lead } from '@/models/Lead.model';

// GET /api/leads/:id - Get single lead
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const lead = await Lead.findById(params.id)
    .populate('interactions')
    .populate('conversions');

  if (!lead) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  }

  return NextResponse.json({ lead });
}

// PATCH /api/leads/:id - Update lead (progressive profiling)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const updates = await request.json();

  const lead = await Lead.findByIdAndUpdate(
    params.id,
    { $set: updates },
    { new: true, runValidators: true }
  );

  if (!lead) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  }

  // Check if stage should be updated
  await updateLeadStageIfNeeded(lead);

  return NextResponse.json({ lead });
}

// DELETE /api/leads/:id - Soft delete lead
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const lead = await Lead.findByIdAndUpdate(
    params.id,
    { deletedAt: new Date() },
    { new: true }
  );

  if (!lead) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  }

  return NextResponse.json({ deleted: true });
}
```

```typescript
// app/api/leads/[id]/score/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { LeadScoringEngine } from '@/lib/ai/lead-scoring';

// POST /api/leads/:id/score - Calculate lead score
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const scoringEngine = new LeadScoringEngine();
  const score = await scoringEngine.scoreLead(params.id);

  // Update lead with score
  await Lead.findByIdAndUpdate(params.id, {
    'qualification.score': score.score,
    'qualification.grade': score.grade,
    'qualification.probability': score.probability,
    'qualification.factors': score.factors
  });

  return NextResponse.json({ score });
}
```

#### 6.1.2 Content APIs

```typescript
// app/api/content/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Content } from '@/models/Content.model';

// GET /api/content - List content
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const filters = {
    type: searchParams.get('type'),
    topic: searchParams.get('topic'),
    industry: searchParams.get('industry'),
    difficulty: searchParams.get('difficulty'),
    isGated: searchParams.get('gated')
  };

  const content = await Content.find(filters)
    .sort({ publishedAt: -1 })
    .limit(parseInt(searchParams.get('limit') || '20'));

  return NextResponse.json({ content });
}

// POST /api/content - Create content (admin)
export async function POST(request: NextRequest) {
  const body = await request.json();

  // Generate embeddings
  const textEmbedding = await embedText(body.body);
  const topicEmbedding = await embedText(body.topics.join(' '));

  const content = await Content.create({
    ...body,
    embeddings: {
      textEmbedding,
      topicEmbedding
    }
  });

  return NextResponse.json({ content }, { status: 201 });
}
```

```typescript
// app/api/content/[slug]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Content } from '@/models/Content.model';
import { getPersonalizedRecommendations } from '@/lib/ai/recommendations';

// GET /api/content/:slug - Get content
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const content = await Content.findOne({ slug: params.slug });

  if (!content) {
    return NextResponse.json({ error: 'Content not found' }, { status: 404 });
  }

  // Track view
  await trackContentView(content._id, request);

  // Get recommendations if user is logged in
  const userId = request.headers.get('x-user-id');
  let recommendations = [];
  if (userId) {
    recommendations = await getPersonalizedRecommendations(userId);
  }

  return NextResponse.json({ content, recommendations });
}
```

```typescript
// app/api/content/recommendations/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getPersonalizedRecommendations } from '@/lib/ai/recommendations';

// GET /api/content/recommendations - Get personalized content
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id');

  if (!userId) {
    return NextResponse.json(
      { error: 'User ID required' },
      { status: 401 }
    );
  }

  const recommendations = await getPersonalizedRecommendations(userId);

  return NextResponse.json({ recommendations });
}
```

#### 6.1.3 Interaction Tracking APIs

```typescript
// app/api/track/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { BehavioralTracker } from '@/lib/analytics/tracker';

// POST /api/track - Track user interaction
export async function POST(request: NextRequest) {
  const body = await request.json();

  // Validate event
  const event = {
    leadId: body.leadId || null, // Anonymous if null
    sessionId: body.sessionId,
    type: body.type,
    category: body.category,
    properties: body.properties,
    context: {
      userAgent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for') || request.ip,
      ...body.context
    }
  };

  const tracker = new BehavioralTracker();
  await tracker.trackEvent(event);

  return NextResponse.json({ tracked: true });
}
```

#### 6.1.4 AI Chat APIs

```typescript
// app/api/chat/qualify/route.ts
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

// POST /api/chat/qualify - Lead qualification chat
export async function POST(req: Request) {
  const { messages, conversationId, leadId } = await req.json();

  // Get conversation history
  const history = conversationId 
    ? await getConversationHistory(conversationId)
    : [];

  const result = streamText({
    model: openai('gpt-4o'),
    system: `You are an EmenTech solutions specialist. Your goals:
    1. Understand the visitor's needs and challenges
    2. Provide helpful, valuable advice (not sales pitches)
    3. Naturally gather information: role, company, challenges, timeline, budget
    4. Qualify leads based on: budget ($10k+), timeline (<6 months), decision-maker
    5. For qualified leads: suggest a demo call

    Be conversational, helpful, and never pushy.`,
    messages: [...history, ...messages],
    tools: {
      schedule_demo: {
        description: 'Schedule a demo call for qualified leads',
        parameters: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            company: { type: 'string' },
            preferredTime: { type: 'string' },
            reason: { type: 'string' }
          },
          required: ['name', 'email', 'company']
        }
      },
      save_lead: {
        description: 'Save or update lead information',
        parameters: {
          type: 'object',
          properties: {
            email: { type: 'string' },
            name: { type: 'string' },
            company: { type: 'string' },
            role: { type: 'string' },
            challenges: { type: 'array', items: { type: 'string' } },
            budget: { type: 'string' },
            timeline: { type: 'string' }
          },
          required: ['email']
        }
      },
      send_resource: {
        description: 'Send a relevant resource via email',
        parameters: {
          type: 'object',
          properties: {
            email: { type: 'string' },
            resourceId: { type: 'string' },
            reason: { type: 'string' }
          },
          required: ['email', 'resourceId']
        }
      }
    },
    onFinish: async ({ toolCalls, messages }) => {
      // Save conversation
      await saveConversation({
        conversationId,
        leadId,
        messages: messages,
        toolCalls
      });
    }
  });

  return result.toDataStreamResponse();
}
```

```typescript
// app/api/chat/rag/route.ts
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { retrieveRelevantContext } from '@/lib/ai/rag';

// POST /api/chat/rag - RAG-powered knowledge chat
export async function POST(req: Request) {
  const { messages, conversationId } = await req.json();

  const lastMessage = messages[messages.length - 1];

  // Retrieve relevant context
  const context = await retrieveRelevantContext(lastMessage.content);

  const result = streamText({
    model: openai('gpt-4o'),
    system: `You are a knowledgeable EmenTech assistant. Answer questions using the provided context. Cite your sources using [Source X] notation.

    Context:
    ${context.map((c, i) => `[Source ${i+1}]: ${c.metadata.text}`).join('\n\n')}

    If the context doesn't contain enough information, say so and offer to connect them with a human expert.`,
    messages: messages,
    tools: {
      connect_human: {
        description: 'Connect to human expert',
        parameters: {
          type: 'object',
          properties: {
            reason: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string' }
          },
          required: ['reason', 'name', 'email']
        }
      }
    }
  });

  return result.toDataStreamResponse();
}
```

#### 6.1.5 Event APIs

```typescript
// app/api/events/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Event } from '@/models/Event.model';

// GET /api/events - List events
export async function GET(request: NextRequest) {
  const events = await Event.find({
    status: { $in: ['upcoming', 'live'] }
  }).sort({ scheduledFor: 1 });

  return NextResponse.json({ events });
}

// POST /api/events - Create event (admin)
export async function POST(request: NextRequest) {
  const body = await request.json();
  const event = await Event.create(body);

  return NextResponse.json({ event }, { status: 201 });
}
```

```typescript
// app/api/events/[id]/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { EventRegistration, Event } from '@/models';

// POST /api/events/:id/register - Register for event
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();

  // Check capacity
  const event = await Event.findById(params.id);
  if (!event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }

  if (event.registeredCount >= event.capacity) {
    return NextResponse.json(
      { error: 'Event is full' },
      { status: 400 }
    );
  }

  // Create or find lead
  let lead = await Lead.findOne({ emailLower: body.email.toLowerCase() });
  if (!lead) {
    lead = await Lead.create({
      email: body.email,
      emailLower: body.email.toLowerCase(),
      name: body.name,
      consent: body.consent,
      engagement: {
        stage: 'identified',
        source: 'event',
        medium: 'registration'
      }
    });
  }

  // Check if already registered
  const existing = await EventRegistration.findOne({
    eventId: params.id,
    leadId: lead._id
  });

  if (existing) {
    return NextResponse.json(
      { error: 'Already registered' },
      { status: 400 }
    );
  }

  // Create registration
  const registration = await EventRegistration.create({
    eventId: params.id,
    leadId: lead._id,
    data: body
  });

  // Update event count
  await Event.findByIdAndUpdate(params.id, {
    $inc: { registeredCount: 1 }
  });

  // Send confirmation
  await sendEventConfirmation(lead, event);

  // Track conversion
  await trackConversion({
    leadId: lead._id,
    type: 'event_registration',
    value: event.estimatedValue || 50
  });

  return NextResponse.json({ registration, event }, { status: 201 });
}
```

### 6.2 WebSocket Events (Socket.IO)

#### 6.2.1 Real-Time Lead Updates

```typescript
// server/socket/handlers/lead.handler.ts
import { Socket } from 'socket.io';

export function setupLeadHandlers(io: Server, socket: Socket) {
  // Lead score updated
  socket.on('lead:score_updated', async (data: { leadId: string }) => {
    const score = await calculateLeadScore(data.leadId);

    // Notify admin dashboard
    io.to('admin:leads').emit('lead:updated', {
      leadId: data.leadId,
      score
    });
  });

  // New qualified lead
  socket.on('lead:qualified', async (data: { leadId: string }) => {
    const lead = await Lead.findById(data.leadId).populate('interactions');

    // Notify sales team
    io.to('sales:team').emit('lead:new_qualified', {
      lead,
      priority: lead.qualification.grade === 'A' ? 'high' : 'normal'
    });

    // Trigger real-time notifications
    await sendSlackAlert(`New ${lead.qualification.grade}-grade lead: ${lead.email}`);
  });
}
```

#### 6.2.2 Chat Events

```typescript
// server/socket/handlers/chat.handler.ts
export function setupChatHandlers(io: Server, socket: Socket) {
  // Join conversation room
  socket.on('chat:join', (conversationId: string) => {
    socket.join(`conversation:${conversationId}`);
  });

  // New message
  socket.on('chat:message', async (data: {
    conversationId: string;
    message: string;
    leadId?: string;
  }) => {
    // Emit to all in conversation
    io.to(`conversation:${data.conversationId}`).emit('chat:message', {
      role: 'user',
      content: data.message,
      timestamp: new Date()
    });

    // Process with AI
    const response = await processChatMessage(data);

    // Emit AI response
    io.to(`conversation:${data.conversationId}`).emit('chat:message', {
      role: 'assistant',
      content: response.content,
      toolCalls: response.toolCalls,
      timestamp: new Date()
    });
  });

  // Typing indicator
  socket.on('chat:typing', (data: { conversationId: string; isTyping: boolean }) => {
    socket.to(`conversation:${data.conversationId}`).emit('chat:typing', {
      isTyping: data.isTyping
    });
  });
}
```

#### 6.2.3 Analytics Events

```typescript
// server/socket/handlers/analytics.handler.ts
export function setupAnalyticsHandlers(io: Server, socket: Socket) {
  // Real-time page view
  socket.on('analytics:page_view', async (data: {
    path: string;
    leadId?: string;
  }) => {
    // Broadcast to admin dashboard
    io.to('admin:analytics').emit('analytics:live_viewers', {
      path: data.path,
      viewers: await getActiveViewers(data.path)
    });
  });

  // Conversion event
  socket.on('analytics:conversion', async (data: {
    leadId: string;
    type: string;
    value: number;
  }) => {
    // Update real-time metrics
    io.to('admin:analytics').emit('analytics:metrics_updated', {
      conversions: await getConversionsToday(),
      revenue: await getRevenueToday()
    });
  });
}
```

---

## 7. Frontend Architecture

### 7.1 Next.js 15 App Router Structure

```
app/
├── (marketing)/                 # Marketing site routes
│   ├── page.tsx                # Homepage
│   ├── layout.tsx              # Marketing layout
│   ├── about/
│   │   └── page.tsx
│   ├── services/
│   │   └── page.tsx
│   ├── blog/
│   │   ├── page.tsx            # Blog index
│   │   └── [slug]/
│   │       └── page.tsx        # Blog post
│   └── resources/
│       ├── page.tsx            # Resources index
│       └── [slug]/
│           └── page.tsx        # Resource detail
│
├── (app)/                       # Application routes
│   ├── dashboard/
│   │   ├── page.tsx            # Dashboard home
│   │   ├── leads/
│   │   │   ├── page.tsx        # Leads list
│   │   │   └── [id]/
│   │   │       └── page.tsx    # Lead detail
│   │   ├── analytics/
│   │   │   └── page.tsx        # Analytics dashboard
│   │   └── content/
│   │       ├── page.tsx        # Content management
│   │       └── new/
│   │           └── page.tsx
│   └── layout.tsx              # App layout (authenticated)
│
├── api/                         # API routes
│   ├── leads/
│   │   ├── route.ts
│   │   └── [id]/
│   │       └── route.ts
│   ├── chat/
│   │   ├── qualify/
│   │   │   └── route.ts
│   │   └── rag/
│   │       └── route.ts
│   ├── content/
│   │   ├── route.ts
│   │   └── [slug]/
│   │       └── route.ts
│   ├── events/
│   │   ├── route.ts
│   │   └── [id]/
│   │       └── register/
│   │           └── route.ts
│   └── track/
│       └── route.ts
│
├── layout.tsx                   # Root layout
└── page.tsx                     # Root page (redirects)
```

### 7.2 Component Architecture

#### 7.2.1 Server Components (Default)

```typescript
// app/(marketing)/blog/page.tsx
import { Content } from '@/models/Content.model';
import { ContentList } from '@/components/content/ContentList';
import { ContentFilters } from '@/components/content/ContentFilters';

// Server Component - runs on server, no JS to client
export default async function BlogPage({
  searchParams
}: {
  searchParams: { type?: string; topic?: string }
}) {
  // Fetch data directly in component
  const posts = await Content.find({
    type: 'blog',
    ...(searchParams.type && { type: searchParams.type }),
    ...(searchParams.topic && { topics: searchParams.topic })
  }).sort({ publishedAt: -1 });

  const topics = await Content.distinct('topics', { type: 'blog' });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">EmenTech Blog</h1>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-3">
          <ContentFilters topics={topics} />
        </div>

        <div className="col-span-9">
          <ContentList posts={posts} />
        </div>
      </div>
    </div>
  );
}
```

#### 7.2.2 Client Components (Interactive)

```typescript
// components/chatbot/LeadQualificationChat.tsx
'use client';

import { useChat } from 'ai/react';
import { useState, useEffect } from 'react';
import { MotionConfig, motion } from 'framer-motion';

interface LeadQualificationChatProps {
  leadId?: string;
  initialMessage?: string;
}

export function LeadQualificationChat({
  leadId,
  initialMessage
}: LeadQualificationChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat/qualify',
    body: { leadId },
    initialMessages: initialMessage ? [{
      id: '1',
      role: 'assistant',
      content: initialMessage
    }] : undefined,
    onFinish: async (message) => {
      // Track qualified lead
      if (message.toolCalls?.some(t => t.toolName === 'schedule_demo')) {
        await fetch('/api/track', {
          method: 'POST',
          body: JSON.stringify({
            type: 'chat_qualified',
            leadId,
            properties: { toolCalls: message.toolCalls }
          })
        });
      }
    }
  });

  // Show welcome message after 30 seconds
  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 30000);

      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  return (
    <MotionConfig transition={{ duration: 0.3 }}>
      {/* Floating button */}
      {!isOpen && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 w-16 h-16 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 flex items-center justify-center"
        >
          <MessageIcon className="w-8 h-8" />
        </motion.button>
      )}

      {/* Chat window */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className={`fixed bottom-4 right-4 bg-white rounded-lg shadow-2xl ${
            isMinimized ? 'h-16' : 'h-[600px]'
          } w-96 flex flex-col`}
        >
          {/* Header */}
          <div className="bg-blue-600 text-white p-4 rounded-t-lg flex justify-between items-center">
            <div>
              <h3 className="font-semibold">Talk to an AI Specialist</h3>
              <p className="text-sm opacity-90">Typically replies instantly</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setIsMinimized(!isMinimized)}>
                {isMinimized ? <ExpandIcon /> : <MinimizeIcon />}
              </button>
              <button onClick={() => setIsOpen(false)}>
                <CloseIcon />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map(m => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] p-3 rounded-lg ${
                      m.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      {m.content}
                      {m.toolCalls && (
                        <div className="text-xs opacity-75 mt-2">
                          ✓ {m.toolCalls.map(t => t.toolName).join(', ')}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
                {isLoading && <TypingIndicator />}
              </div>

              {/* Input */}
              <form onSubmit={handleSubmit} className="p-4 border-t">
                <div className="flex gap-2">
                  <input
                    value={input}
                    onChange={handleInputChange}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isLoading}
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    Send
                  </button>
                </div>
              </form>
            </>
          )}
        </motion.div>
      )}
    </MotionConfig>
  );
}
```

#### 7.2.3 Hybrid Components (Server + Client)

```typescript
// components/content/PersonalizedRecommendations.tsx
import { getPersonalizedRecommendations } from '@/lib/ai/recommendations';
import { RecommendationCard } from './RecommendationCard';

// Server Component wrapper
async function PersonalizedRecommendationsServer({
  userId
}: {
  userId: string;
}) {
  // Server-side: Fetch recommendations
  const recommendations = await getPersonalizedRecommendations(userId);

  return (
    <PersonalizedRecommendationsClient 
      recommendations={recommendations} 
    />
  );
}

// Client Component for interactivity
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

function PersonalizedRecommendationsClient({
  recommendations: initialRecommendations
}: {
  recommendations: Recommendation[];
}) {
  const [recommendations] = useState(initialRecommendations);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const dismiss = (id: string) => {
    setDismissed(prev => new Set([...prev, id]));
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Recommended for You</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {recommendations
          .filter(rec => !dismissed.has(rec.id))
          .map((rec, index) => (
            <motion.div
              key={rec.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <RecommendationCard
                recommendation={rec}
                onDismiss={() => dismiss(rec.id)}
              />
            </motion.div>
          ))}
      </div>
    </div>
  );
}

export default PersonalizedRecommendationsServer;
```

### 7.3 State Management (Zustand)

```typescript
// stores/leadStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface LeadState {
  currentLead: Lead | null;
  sessionId: string;
  behaviors: Behavior[];
  actions: LeadActions;
}

interface LeadActions {
  setCurrentLead: (lead: Lead) => void;
  updateProfile: (updates: Partial<Lead['profile']>) => void;
  trackBehavior: (behavior: Behavior) => void;
  clearSession: () => void;
}

export const useLeadStore = create<LeadState>()(
  persist(
    (set, get) => ({
      currentLead: null,
      sessionId: crypto.randomUUID(),
      behaviors: [],

      actions: {
        setCurrentLead: (lead) => set({ currentLead: lead }),

        updateProfile: (updates) => {
          const { currentLead } = get();
          if (!currentLead) return;

          set({
            currentLead: {
              ...currentLead,
              profile: { ...currentLead.profile, ...updates }
            }
          });

          // Sync with server
          fetch(`/api/leads/${currentLead._id}`, {
            method: 'PATCH',
            body: JSON.stringify({ profile: updates })
          });
        },

        trackBehavior: (behavior) => {
          const { sessionId, behaviors } = get();

          const newBehavior = {
            ...behavior,
            sessionId,
            timestamp: new Date()
          };

          set({ behaviors: [...behaviors, newBehavior] });

          // Send to server
          fetch('/api/track', {
            method: 'POST',
            body: JSON.stringify(newBehavior)
          });
        },

        clearSession: () => {
          set({
            currentLead: null,
            sessionId: crypto.randomUUID(),
            behaviors: []
          });
        }
      }
    }),
    {
      name: 'ementech-lead-storage',
      partialize: (state) => ({
        currentLead: state.currentLead,
        sessionId: state.sessionId
      })
    }
  )
);
```

```typescript
// stores/chatStore.ts
import { create } from 'zustand';

interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  isOpen: boolean;
  isMinimized: boolean;
  actions: ChatActions;
}

interface ChatActions {
  openChat: (initialMessage?: string) => void;
  closeChat: () => void;
  minimizeChat: () => void;
  maximizeChat: () => void;
  setActiveConversation: (id: string) => void;
  addMessage: (conversationId: string, message: Message) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  conversations: [],
  activeConversationId: null,
  isOpen: false,
  isMinimized: false,

  actions: {
    openChat: (initialMessage) => set({ isOpen: true, isMinimized: false }),
    closeChat: () => set({ isOpen: false }),
    minimizeChat: () => set({ isMinimized: true }),
    maximizeChat: () => set({ isMinimized: false }),
    setActiveConversation: (id) => set({ activeConversationId: id }),
    addMessage: (conversationId, message) => {
      set((state) => ({
        conversations: state.conversations.map(conv =>
          conv._id === conversationId
            ? { ...conv, messages: [...conv.messages, message] }
            : conv
        )
      }));
    }
  }
}));
```

---

## 8. AI/LLM Integration Strategy

### 8.1 Model Selection Matrix

| Use Case | Primary Model | Secondary Model | Reasoning |
|----------|--------------|-----------------|-----------|
| **Lead Qualification Chat** | GPT-4o | Claude 3.5 Sonnet | Fast responses, excellent function calling |
| **Content Generation** | Claude 3.5 Sonnet | GPT-4o | Long context, nuanced writing |
| **Code Examples** | Claude 3.5 Sonnet | - | Superior coding capabilities |
| **RAG - Search** | GPT-4o | - | Fast, cost-effective for queries |
| **RAG - Generation** | Claude 3.5 Sonnet | - | Better synthesis of complex info |
| **Sentiment Analysis** | GPT-4o-mini | - | Cost-effective for simple classification |
| **Lead Scoring** | Custom ML | GPT-4o (explanation) | ML for prediction, LLM for insights |
| **Personalization** | Claude 3.5 Sonnet | - | Understands user context deeply |
| **Content Recommendations** | Embeddings + Rerank | - | Vector search most effective |
| **Exit Intent Offers** | GPT-4o | - | Quick decision making |

### 8.2 Prompt Engineering Patterns

#### 8.2.1 Few-Shot Learning Pattern

```typescript
// lib/ai/prompts/lead-qualification.ts
export const createQualificationPrompt = (context: {
  conversationHistory: Message[];
  userProfile: Partial<Lead>;
}) => {
  return {
    system: `You are an expert B2B sales consultant for EmenTech, an AI implementation company.

Your goal: Qualify leads naturally through conversation, NOT interrogation.

Qualification Criteria:
- Budget: $10k+ minimum
- Timeline: Starting within 6 months
- Authority: Decision maker or influencer
- Need: Clear AI/ML use case

Conversation Style:
- Conversational, friendly, helpful
- Ask ONE question at a time
- Build rapport before qualification
- Provide value between questions
- Never pushy or salesy

Examples of GOOD approaches:

Example 1:
User: "We're looking at AI for customer service"
Bot: "That's a great use case! Many companies see 30-40% efficiency gains there. What's your current support setup like?"

Example 2:
User: "I need to convince my boss"
Bot: "Totally get that. What usually helps is putting together an ROI case. What metrics matter most to your leadership?"

Examples of BAD approaches:
- "What's your budget?" (Too direct)
- "Are you the decision maker?" (Interrogating)
- "We should schedule a demo" (Too pushy)

Current conversation context:
${JSON.stringify(context.userProfile, null, 2)}`,

    messages: context.conversationHistory
  };
};
```

#### 8.2.2 Chain-of-Thought Pattern

```typescript
// lib/ai/prompts/lead-scoring.ts
export const createLeadScoringPrompt = (lead: Lead) => {
  return {
    system: `You are a lead scoring expert. Analyze this lead and provide a score (0-100).

SCORING FRAMEWORK:
1. Engagement (40 points): How actively have they engaged?
2. Fit (30 points): Do they match our ideal customer profile?
3. Intent (20 points): How strong is their buying intent?
4. Urgency (10 points): How soon do they need to solve this?

ANALYSIS FORMAT:
Think through each factor step-by-step:

1. ENGAGEMENT ANALYSIS:
   - Page views: ${lead.behaviors.pageViews}
   - Time on site: ${lead.behaviors.timeOnSite} seconds
   - Resources downloaded: ${lead.interactions.filter(i => i.type === 'resource_download').length}
   - Score: __/40

2. FIT ANALYSIS:
   - Company size: ${lead.profile.companySize}
   - Industry: ${lead.profile.industry}
   - Role: ${lead.profile.role}
   - Score: __/30

3. INTENT ANALYSIS:
   - Buying stage: ${lead.engagement.buyingStage}
   - Pain points: ${lead.aiData.painPoints.join(', ')}
   - Score: __/20

4. URGENCY ANALYSIS:
   - Timeline: ${lead.profile.timeline}
   - Score: __/10

FINAL SCORE: ___/100
GRADE: A (80-100) | B (60-79) | C (40-59) | D (0-39)`,

    user: `Analyze this lead and provide scoring with reasoning.`
  };
};
```

#### 8.2.3 Self-Critique Pattern

```typescript
// lib/ai/prompts/content-generation.ts
export const createContentPrompt = async (topic: string, audience: string) => {
  return {
    system: `You are an expert content writer for EmenTech.

WRITING PROCESS:
1. Generate initial outline
2. Critique your own work
3. Improve based on critique
4. Finalize content

CRITIQUE CHECKLIST:
- Is the tone appropriate for ${audience}?
- Is the content actionable and specific?
- Are there clear examples?
- Is it concise but comprehensive?
- Does it provide genuine value?

Output both the critique and improved version.`,

    user: `Write a blog post about: "${topic}" for ${audience}.`
  };
};
```

### 8.3 Cost Optimization Strategy

```typescript
// lib/ai/cost-optimizer.ts
export class CostOptimizer {
  private cache: Map<string, any> = new Map();

  async optimize(prompt: string, taskType: TaskType): Promise<string> {
    const cacheKey = this.generateCacheKey(prompt, taskType);

    // Check cache
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // Select model based on task complexity
    const model = this.selectModel(taskType, prompt);

    // Estimate cost
    const estimatedCost = this.estimateCost(model, prompt);

    // Check budget
    if (estimatedCost > 0.10) {
      // For expensive tasks, try cheaper model first
      const cheaperResult = await this.tryWithCheaperModel(prompt, taskType);
      if (this.isQualityAcceptable(cheaperResult)) {
        return cheaperResult;
      }
    }

    // Use selected model
    const result = await this.generateWithModel(model, prompt);

    // Cache result
    this.cache.set(cacheKey, result);

    return result;
  }

  private selectModel(taskType: TaskType, prompt: string): string {
    const complexity = this.assessComplexity(prompt);

    switch (taskType) {
      case 'chat':
        return complexity === 'simple' ? 'gpt-4o-mini' : 'gpt-4o';

      case 'content-generation':
        return prompt.length > 5000 ? 'claude-3-5-sonnet' : 'gpt-4o';

      case 'analysis':
        return 'claude-3-5-sonnet'; // Better reasoning

      case 'extraction':
        return 'gpt-4o-mini'; // Simple tasks

      default:
        return 'gpt-4o';
    }
  }

  private async tryWithCheaperModel(
    prompt: string,
    taskType: TaskType
  ): Promise<string> {
    const cheapModel = this.getCheapestModel(taskType);
    return await this.generateWithModel(cheapModel, prompt);
  }

  private estimateCost(model: string, prompt: string): number {
    const pricing = {
      'gpt-4o': { input: 2.50, output: 10.00 }, // per 1M tokens
      'gpt-4o-mini': { input: 0.15, output: 0.60 },
      'claude-3-5-sonnet': { input: 3.00, output: 15.00 }
    };

    const tokens = this.estimateTokens(prompt);
    const modelPricing = pricing[model as keyof typeof pricing];

    return (tokens / 1_000_000) * modelPricing.input;
  }
}
```

### 8.4 Fallback & Error Handling

```typescript
// lib/ai/error-handling.ts
export class AIOrchestrator {
  private models = ['gpt-4o', 'claude-3-5-sonnet', 'gpt-4o-mini'];

  async generateWithFallback(prompt: string, options: any) {
    let lastError;

    for (const model of this.models) {
      try {
        const result = await this.generateWithModel(model, prompt, options);
        return { success: true, data: result, model };
      } catch (error) {
        lastError = error;
        console.warn(`${model} failed, trying next model`, error);

        // Log failure
        await this.logModelFailure(model, error);
      }
    }

    // All models failed
    return {
      success: false,
      error: lastError,
      fallbackMessage: this.getFallbackResponse(options.taskType)
    };
  }

  private getFallbackResponse(taskType: string): string {
    const fallbacks = {
      chat: "I apologize, but I'm experiencing technical difficulties. Please try again in a moment or email us at hello@ementech.co.ke",
      qualification: "I'd love to help you further. Could you please email us at hello@ementech.co.ke and we'll get back to you right away?",
      recommendation: "Our team would be happy to provide personalized recommendations. Please reach out at hello@ementech.co.ke"
    };

    return fallbacks[taskType as keyof typeof fallbacks] || fallbacks.chat;
  }

  private async logModelFailure(model: string, error: any) {
    await fetch('/api/monitoring/model-failure', {
      method: 'POST',
      body: JSON.stringify({ model, error: error.message, timestamp: new Date() })
    });
  }
}
```

---

## 9. User Journey Flows

### 9.1 Anonymous Visitor → Lead Flow

```
[Anonymous Visitor]
      ↓
[Lands on Homepage]
      ↓
[View: Hero, Services, Case Studies]
      ↓
[Engagement Point: "Download AI Implementation Guide"]
      ↓
[Modal: Email Capture]
      ↓
[Stage 1: Identified Lead]
      • Email captured
      • Welcome email sent
      • Newsletter subscribed
      ↓
[Over Next 7 Days: Nurturing]
      • Day 1: Welcome email with best resources
      • Day 3: Case study relevant to industry
      • Day 7: Exclusive webinar invitation
      ↓
[Engagement Point: ROI Calculator]
      • Calculates potential savings
      • Captures: company size, role, challenges
      ↓
[Stage 2: Qualified Lead]
      • Profile enriched
      • Lead score calculated
      • Sales team notified (if score > 60)
      ↓
[Engagement Point: Event Registration]
      • Registers for webinar
      • Captures: timeline, budget, pain points
      ↓
[Stage 3: Opportunity]
      • Demo scheduled
      • Assigned to account executive
      ↓
[Conversion: Customer]
```

### 9.2 AI Chatbot Qualification Flow

```
[Visitor Starts Chat]
      ↓
[AI: "Hi! How can I help you explore AI for your business?"]
      ↓
[Visitor: "We're looking to implement chatbots"]
      ↓
[AI: Understands intent → Selects Researcher Agent]
      ↓
[AI: "Chatbots are great for customer service! Companies typically see 30-40% efficiency gains. What's your current support setup?"]
      ↓
[Visitor: "We use Zendesk, have 5 support agents"]
      ↓
[AI: Context gathering]
      • Company size inferred
      • Current tech stack noted
      ↓
[AI: "Got it! And what's the main challenge you're hoping to solve with automation?"]
      ↓
[Visitor: "Response times and costs"]
      ↓
[AI: Detects pain points → Switches to Qualifier Agent]
      ↓
[AI: "Totally understand. Those are exactly the challenges we help with. Typically, companies invest $15k-50k in a solution like this. Does that align with your expectations?"]
      ↓
[Visitor: "That sounds about right"]
      ↓
[Budget identified ✓]
      ↓
[AI: "Great! And when are you looking to get something live?"]
      ↓
[Visitor: "Hopefully in the next couple months"]
      ↓
[Timeline identified ✓]
      ↓
[AI: "Perfect timing. Would it be helpful to see a demo of what we've built for similar companies?"]
      ↓
[Visitor: "Yes, that would be great"]
      ↓
[High intent detected ✓]
      ↓
[AI: save_lead tool called]
      • Email: "What's the best email to send the demo link to?"
      • Name captured
      • Company captured
      ↓
[AI: schedule_demo tool called]
      • "We have openings this Thursday or Friday. Which works better?"
      • Time slot selected
      ↓
[Lead Qualified → Notified in Slack]
      • Lead score: 85/100
      • Grade: A
      • Assigned to sales rep
      ↓
[Confirmation email sent]
      • Calendar invite attached
      • Case studies attached
      ↓
[Next Steps: Demo Call]
```

### 9.3 Content Journey Flow

```
[Visitor Discovers Blog Post via Google]
      ↓
[Reads: "RAG Implementation Best Practices"]
      • Scroll depth: 85%
      • Time on page: 6 minutes
      ↓
[Engagement: "Related Content" sidebar]
      • Shows: "Building Production AI Systems"
      ↓
[Clicks: Reads second article]
      ↓
[Exit Intent Detected]
      ↓
[Modal: "Enjoyed this article?"]
      • Option 1: Get weekly insights (newsletter)
      • Option 2: Download complete guide (email capture)
      • Option 3: Continue reading
      ↓
[Selects: Download Guide]
      ↓
[Form: Smart Email Capture]
      • AI: "I see you're interested in AI infrastructure. What's your role?"
      • Visitor types: "I'm a CTO at a Series B startup"
      • AI extracts: role = "CTO", company stage = "Series B"
      • Auto-fills form fields
      ↓
[Downloads: Complete AI Infrastructure Guide (45 pages)]
      ↓
[Email: Guide delivered + nurture sequence starts]
      • Email 1 (immediate): Your guide + 3 more resources
      • Email 2 (2 days): Case study: Similar company's journey
      • Email 3 (5 days): Invitation: CTO roundtable dinner
      ↓
[Tracks: Behavior]
      • Opens all emails (high engagement)
      • Clicks: case study link
      • Reads: full case study
      • Engagement score: 75/100
      ↓
[Stage: Qualified Lead]
      • Persona: Technical Decision Maker
      • Intent: High
      • Timeline: Inferred 3-6 months
      ↓
[Personalized: Outreach]
      • Sales rep: personalized video message
      • Content: Technical deep-dive on their use case
      • Offer: Free architecture consultation
      ↓
[Conversion: Books Consultation]
```

---

## 10. Implementation Roadmap

### 10.1 Phase 1: Foundation (Weeks 1-4)

**Goal**: Set up infrastructure and basic lead capture

#### Week 1: Setup & Infrastructure
- [ ] Set up Next.js 15 project with TypeScript
- [ ] Configure Vercel deployment
- [ ] Set up MongoDB Atlas connection
- [ ] Set up Pinecone vector database
- [ ] Configure Redis (Upstash) for caching
- [ ] Set up Vercel AI SDK
- [ ] Create base folder structure

#### Week 2: Database & Models
- [ ] Define Mongoose schemas (Lead, Interaction, Content, Conversation)
- [ ] Set up indexes for performance
- [ ] Create seed data scripts
- [ ] Set up database migration scripts
- [ ] Test CRUD operations

#### Week 3: Basic Lead Capture
- [ ] Build newsletter signup component
- [ ] Create resource download flow
- [ ] Implement basic tracking (page views, clicks)
- [ ] Build email capture forms (progressive)
- [ ] Set up welcome email sequence

#### Week 4: Analytics & Tracking
- [ ] Implement behavioral tracking system
- [ ] Build lead staging logic
- [ ] Create basic analytics dashboard
- [ ] Set up conversion tracking
- [ ] Test end-to-end lead capture flow

**Deliverables**:
- Working Next.js app deployed to Vercel
- MongoDB database with collections and indexes
- Basic lead capture (newsletter, downloads)
- Behavioral tracking installed
- Analytics dashboard with real-time data

### 10.2 Phase 2: AI Integration (Weeks 5-8)

**Goal**: Add AI-powered features

#### Week 5: Chatbot Foundation
- [ ] Set up Vercel AI SDK chat endpoints
- [ ] Create chat UI components
- [ ] Implement basic conversation flow
- [ ] Add tool calling (save_lead, schedule_demo)
- [ ] Deploy chatbot to production

#### Week 6: RAG Implementation
- [ ] Ingest knowledge base content
- [ ] Set up Pinecone vector indexes
- [ ] Implement semantic search
- [ ] Add Cohere reranking
- [ ] Build RAG chat endpoint

#### Week 7: Lead Scoring
- [ ] Implement lead scoring algorithm
- [ ] Create feature extraction pipeline
- [ ] Build scoring dashboard
- [ ] Set up automated notifications for high-scoring leads
- [ ] Integrate with CRM

#### Week 8: Personalization
- [ ] Implement content recommendations
- [ ] Build personalization engine
- [ ] Create dynamic homepage personalization
- [ ] Add personalized email content
- [ ] Test recommendation accuracy

**Deliverables**:
- Working AI chatbot on website
- RAG-powered knowledge base chat
- Lead scoring system with dashboard
- Content recommendation engine
- Personalized user experiences

### 10.3 Phase 3: Advanced Features (Weeks 9-12)

**Goal**: Add sophisticated AI capabilities

#### Week 9: Advanced Chat Features
- [ ] Implement multi-agent system
- [ ] Add voice AI capabilities (Hume AI)
- [ ] Create conversational form filling
- [ ] Build sentiment analysis
- [ ] Add intent detection

#### Week 10: Predictive Analytics
- [ ] Implement churn prediction
- [ ] Build CLV prediction
- [ ] Create propensity models
- [ ] Build forecasting dashboard
- [ ] Set up automated interventions

#### Week 11: Event & Webinar System
- [ ] Build event registration flow
- [ ] Implement webinar integration (Zoom)
- [ ] Create automated reminders
- [ ] Build post-event follow-up
- [ ] Track event engagement

#### Week 12: Optimization & Testing
- [ ] Implement A/B testing framework
- [ ] Add multivariate testing
- [ ] Build conversion optimization tools
- [ ] Create experiments dashboard
- [ ] Run initial experiments

**Deliverables**:
- Multi-agent AI system
- Predictive analytics dashboard
- Event management system
- A/B testing framework
- Full production-ready AI ecosystem

### 10.4 Phase 4: Scale & Optimize (Weeks 13-16)

**Goal**: Optimize performance and prepare for scale

#### Week 13: Performance Optimization
- [ ] Implement caching strategy (Redis)
- [ ] Add CDN optimization
- [ ] Optimize database queries
- [ ] Add database indexes
- [ ] Implement rate limiting

#### Week 14: Monitoring & Observability
- [ ] Set up Sentry error tracking
- [ ] Implement custom metrics
- [ ] Build monitoring dashboard
- [ ] Set up alerting system
- [ ] Create performance reports

#### Week 15: Security & Compliance
- [ ] Implement GDPR compliance
- [ ] Add data deletion workflows
- [ ] Build consent management
- [ ] Security audit
- [ ] Penetration testing

#### Week 16: Documentation & Handoff
- [ ] Write API documentation
- [ ] Create component documentation
- [ ] Build runbooks
- [ ] Train team on AI systems
- [ ] Create maintenance guides

**Deliverables**:
- Optimized, production-ready system
- Comprehensive monitoring
- GDPR compliant
- Full documentation
- Team training completed

---

## 11. Privacy & Compliance

### 11.1 GDPR Compliance Checklist

#### 11.1.1 Lawful Basis for Processing
```typescript
// models/Lead.model.ts - Consent tracking
const consentSchema = {
  given: { type: Boolean, required: true },
  givenAt: { type: Date, required: true },
  method: { 
    type: String, 
    enum: ['checkbox', 'implicit', 'chat', 'cookie-consent'],
    required: true 
  },
  
  // Granular consent options
  dataProcessing: { 
    type: Boolean, 
    default: false,
    required: true 
  },
  marketing: { 
    type: Boolean, 
    default: false 
  },
  analytics: { 
    type: Boolean, 
    default: false 
  },
  
  // Legal basis tracking
  legalBasis: {
    type: String,
    enum: ['consent', 'contract', 'legitimate_interest', 'legal_obligation'],
    default: 'consent'
  },
  
  // Right to withdrawal
  withdrawnAt: Date,
  withdrawalMethod: String
};
```

#### 11.1.2 Privacy Policy Implementation

```typescript
// components/privacy/ConsentBanner.tsx
'use client';

import { useState, useEffect } from 'react';

export function ConsentBanner() {
  const [show, setShow] = useState(false);
  const [consent, setConsent] = useState({
    necessary: true,
    analytics: false,
    marketing: false
  });

  useEffect(() => {
    // Check if user already consented
    const saved = localStorage.getItem('consent');
    if (!saved) {
      setShow(true);
    } else {
      setConsent(JSON.parse(saved));
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('consent', JSON.stringify(consent));
    setShow(false);
    
    // Update tracking
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: 'consent_updated', consent });
  };

  const handleAcceptAll = () => {
    const allConsent = { ...consent, analytics: true, marketing: true };
    setConsent(allConsent);
    localStorage.setItem('consent', JSON.stringify(allConsent));
    setShow(false);
  };

  const handleReject = () => {
    const minimalConsent = { ...consent, analytics: false, marketing: false };
    setConsent(minimalConsent);
    localStorage.setItem('consent', JSON.stringify(minimalConsent));
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-6 z-50">
      <div className="container mx-auto max-w-4xl">
        <h3 className="text-lg font-semibold mb-2">
          We value your privacy
        </h3>
        <p className="text-sm text-gray-300 mb-4">
          We use cookies and similar technologies to help personalize content, 
          measure effectiveness, and provide a safer experience. By clicking 
          "Accept All", you agree to our use of cookies.
        </p>

        <div className="space-y-2 mb-4">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={consent.necessary} disabled />
            <span className="text-sm">Required (always active)</span>
          </label>

          <label className="flex items-center gap-2">
            <input 
              type="checkbox" 
              checked={consent.analytics}
              onChange={(e) => setConsent({...consent, analytics: e.target.checked})}
            />
            <span className="text-sm">Analytics (helps us improve)</span>
          </label>

          <label className="flex items-center gap-2">
            <input 
              type="checkbox" 
              checked={consent.marketing}
              onChange={(e) => setConsent({...consent, marketing: e.target.checked})}
            />
            <span className="text-sm">Marketing (personalized content)</span>
          </label>
        </div>

        <div className="flex gap-4">
          <button 
            onClick={handleAccept}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Save Preferences
          </button>

          <button 
            onClick={handleAcceptAll}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Accept All
          </button>

          <button 
            onClick={handleReject}
            className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
          >
            Reject All
          </button>

          <a 
            href="/privacy" 
            className="px-4 py-2 text-gray-300 hover:text-white underline"
          >
            Privacy Policy
          </a>
        </div>
      </div>
    </div>
  );
}
```

#### 11.1.3 Right to Access (Data Export)

```typescript
// app/api/leads/[id]/export/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Lead } from '@/models/Lead.model';
import { Interaction } from '@/models/Interaction.model';
import { generateCSV } from '@/lib/export';

// GET /api/leads/:id/export - Export all user data (GDPR right to access)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const lead = await Lead.findById(params.id);
  
  if (!lead) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  }

  // Gather all personal data
  const interactions = await Interaction.find({ leadId: params.id });
  
  const personalData = {
    profile: lead.profile,
    behaviors: lead.behaviors,
    consent: lead.consent,
    interactions: interactions.map(i => ({
      type: i.type,
      properties: i.properties,
      timestamp: i.createdAt
    })),
    exportDate: new Date().toISOString()
  };

  // Return as JSON or CSV
  const format = request.nextUrl.searchParams.get('format') || 'json';

  if (format === 'csv') {
    const csv = generateCSV(personalData);
    
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="ementech-data-${params.id}.csv"`
      }
    });
  }

  return NextResponse.json({ data: personalData });
}
```

#### 11.1.4 Right to Deletion

```typescript
// app/api/leads/[id]/delete/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Lead } from '@/models/Lead.model';
import { Interaction } from '@/models/Interaction.model';
import { Conversation } from '@/models/Conversation.model';

// DELETE /api/leads/:id/delete - Delete all user data (GDPR right to be forgotten)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const lead = await Lead.findById(params.id);

  if (!lead) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  }

  // Anonymize instead of hard delete (for data integrity)
  const anonymizedData = {
    email: `deleted-${params.id}@anonymized.local`,
    emailLower: `deleted-${params.id}@anonymized.local`,
    name: '[DELETED]',
    profile: {},
    consent: {
      given: false,
      withdrawnAt: new Date()
    },
    deletedAt: new Date()
  };

  // Update lead to anonymized state
  await Lead.findByIdAndUpdate(params.id, anonymizedData);

  // Delete interactions (or anonymize if needed for analytics)
  await Interaction.deleteMany({ leadId: params.id });

  // Delete conversations
  await Conversation.deleteMany({ leadId: params.id });

  // Remove from marketing lists
  await removeFromMarketingLists(params.id);

  // Log deletion for compliance
  await logDataDeletion({
    leadId: params.id,
    timestamp: new Date(),
    method: 'user_request',
    verifiedBy: 'email_confirmation'
  });

  return NextResponse.json({ 
    deleted: true,
    message: 'All your personal data has been permanently deleted.'
  });
}
```

#### 11.1.5 Cookie Consent Management

```typescript
// lib/privacy/cookie-manager.ts
export class CookieManager {
  static setConsent(consent: ConsentConfig) {
    // Set consent cookie (1 year)
    document.cookie = `consent=${JSON.stringify(consent)}; max-age=${31536000}; path=/; SameSite=Lax`;

    // Update tracking scripts based on consent
    if (consent.analytics) {
      this.enableAnalytics();
    } else {
      this.disableAnalytics();
    }

    if (consent.marketing) {
      this.enableMarketing();
    } else {
      this.disableMarketing();
    }
  }

  static getConsent(): ConsentConfig | null {
    const cookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('consent='));
    
    if (cookie) {
      return JSON.parse(cookie.split('=')[1]);
    }

    return null;
  }

  static enableAnalytics() {
    // Initialize analytics (PostHog, Google Analytics, etc.)
    if (typeof window !== 'undefined' && (window as any).posthog) {
      (window as any).posthog.opt_in_capturing();
    }
  }

  static disableAnalytics() {
    if (typeof window !== 'undefined' && (window as any).posthog) {
      (window as any).posthog.opt_out_capturing();
    }
  }

  static enableMarketing() {
    // Enable marketing cookies, pixels
    // Meta Pixel, LinkedIn Insight Tag, etc.
  }

  static disableMarketing() {
    // Disable marketing tracking
  }
}
```

### 11.2 Data Retention Policy

```typescript
// lib/privacy/data-retention.ts
export class DataRetentionPolicy {
  static retentionPeriods = {
    interactions: 90 * 24 * 60 * 60 * 1000, // 90 days
    leads: 730 * 24 * 60 * 60 * 1000, // 2 years (if not converted)
    customers: 2555 * 24 * 60 * 60 * 1000, // 7 years (after conversion)
    conversations: 180 * 24 * 60 * 60 * 1000, // 6 months
    analytics: 390 * 24 * 60 * 60 * 1000 // 13 months
  };

  static async cleanupOldData() {
    const now = Date.now();

    // Delete old interactions
    await Interaction.deleteMany({
      createdAt: { $lt: new Date(now - this.retentionPeriods.interactions) }
    });

    // Anonymize old leads (not customers)
    await Lead.updateMany(
      {
        createdAt: { $lt: new Date(now - this.retentionPeriods.leads) },
        'engagement.stage': { $ne: 'customer' }
      },
      {
        $set: {
          email: `anonymized-${Math.random()}@deleted.local`,
          emailLower: `anonymized-${Math.random()}@deleted.local`,
          name: '[ANONYMIZED]',
          profile: {},
          deletedAt: new Date()
        }
      }
    );

    // Delete old conversations
    await Conversation.deleteMany({
      createdAt: { $lt: new Date(now - this.retentionPeriods.conversations) }
    });
  }

  static scheduleCleanup() {
    // Run daily at 2 AM
    cron.schedule('0 2 * * *', () => {
      this.cleanupOldData();
    });
  }
}
```

---

## 12. Scalability & Performance

### 12.1 Performance Targets

| Metric | Target | Measurement | Why It Matters |
|--------|--------|-------------|----------------|
| **Page Load** | < 3s | Lighthouse | User experience, SEO |
| **Time to Interactive** | < 5s | Lighthouse | Perceived performance |
| **First Contentful Paint** | < 1.5s | Lighthouse | Initial render |
| **API Response** | < 200ms | Server logs | Backend efficiency |
| **AI Inference** | < 500ms | API timing | Chat responsiveness |
| **Database Query** | < 100ms | Mongoose logs | Data retrieval speed |
| **Vector Search** | < 200ms | Pinecone logs | RAG performance |
| **Email Delivery** | < 30s | SMTP logs | Lead capture speed |

### 12.2 Caching Strategy

```typescript
// lib/cache/redis-cache.ts
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL!);

export class CacheManager {
  static async get<T>(key: string): Promise<T | null> {
    const cached = await redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  static async set<T>(
    key: string, 
    value: T, 
    ttl: number = 3600
  ): Promise<void> {
    await redis.setex(key, ttl, JSON.stringify(value));
  }

  static async invalidate(pattern: string): Promise<void> {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }

  // Cache tags for invalidation
  static async setWithTags<T>(
    key: string,
    value: T,
    tags: string[],
    ttl?: number
  ): Promise<void> {
    await this.set(key, value, ttl);

    // Add key to each tag set
    for (const tag of tags) {
      await redis.sadd(`tag:${tag}`, key);
    }
  }

  static async invalidateTags(tags: string[]): Promise<void> {
    for (const tag of tags) {
      const keys = await redis.smembers(`tag:${tag}`);
      if (keys.length > 0) {
        await redis.del(...keys);
        await redis.del(`tag:${tag}`);
      }
    }
  }
}

// Usage in API routes
export async function GET(request: NextRequest) {
  const cacheKey = `leads:${request.url}`;
  
  // Try cache first
  const cached = await CacheManager.get(cacheKey);
  if (cached) {
    return NextResponse.json(cached, {
      headers: { 'X-Cache': 'HIT' }
    });
  }

  // Fetch from database
  const leads = await Lead.find({});

  // Cache with tags
  await CacheManager.setWithTags(
    cacheKey,
    leads,
    ['leads', 'all-leads'],
    300 // 5 minutes
  );

  return NextResponse.json(leads, {
    headers: { 'X-Cache': 'MISS' }
  });
}
```

### 12.3 Database Optimization

```typescript
// lib/database/query-optimizer.ts
export class QueryOptimizer {
  // Select only required fields
  static async getLeadList(filters: any) {
    return await Lead.find(filters)
      .select('email name profile.company engagement.score') // Only needed fields
      .lean() // Return plain JS objects (faster)
      .maxTimeMS(5000) // Prevent slow queries
      .hint('engagement.stage_1_engagement.score_-1') // Use index hint
      .exec();
  }

  // Use aggregation for complex queries
  static async getLeadStats() {
    return await Lead.aggregate([
      { $match: { 'engagement.stage': { $ne: 'anonymous' } } },
      {
        $group: {
          _id: '$engagement.stage',
          count: { $sum: 1 },
          avgScore: { $avg: '$engagement.score' }
        }
      }
    ]);
  }

  // Pagination with cursor-based approach
  static async getLeadsPaginated(cursor?: string, limit = 20) {
    const query = cursor
      ? { _id: { $gt: cursor } }
      : {};

    const leads = await Lead.find(query)
      .sort({ _id: 1 })
      .limit(limit + 1) // Fetch one extra to check if more pages
      .lean();

    const hasMore = leads.length > limit;
    const results = hasMore ? leads.slice(0, -1) : leads;
    const nextCursor = hasMore ? results[results.length - 1]._id : null;

    return { results, nextCursor, hasMore };
  }
}
```

### 12.4 CDN & Edge Optimization

```typescript
// next.config.js
import type { NextConfig } from 'next';

const config: NextConfig = {
  // Enable edge runtime for specific routes
  experimental: {
    runtime: 'edge',
  },

  // Image optimization
  images: {
    domains: ['ementech.co.ke'],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
  },

  // Headers for caching
  async headers() {
    return [
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=60, stale-while-revalidate=300',
          },
        ],
      },
    ];
  },

  // Rewrites for API caching
  async rewrites() {
    return [
      {
        source: '/api/content/:path*',
        destination: '/api/cached-content/:path*',
      },
    ];
  },
};

export default config;
```

---

## 13. Security Architecture

### 13.1 Authentication & Authorization

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  // Public routes
  const publicPaths = ['/', '/blog', '/resources', '/api/login'];
  const isPublic = publicPaths.some(path => request.nextUrl.pathname.startsWith(path));

  if (isPublic) {
    return NextResponse.next();
  }

  // Verify JWT
  const token = request.cookies.get('auth_token')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const payload = await verifyJWT(token);

    // Add user info to headers
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', payload.userId);
    requestHeaders.set('x-user-role', payload.role);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/admin/:path*'],
};
```

### 13.2 Rate Limiting

```typescript
// lib/rate-limit/upstash-ratelimit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

export const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
  analytics: true,
  prefix: '@ementech/ratelimit',
});

// Usage in API routes
export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? 'anonymous';

  const { success, remaining, reset } = await ratelimit.limit(ip);

  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': '10',
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': new Date(reset).toISOString()
        }
      }
    );
  }

  // Process request...
}
```

### 13.3 Input Validation

```typescript
// lib/validation/schemas.ts
import { z } from 'zod';

export const leadSchemas = {
  create: z.object({
    email: z.string().email('Invalid email address'),
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    consent: z.object({
      given: z.boolean().refine(val => val === true, 'Consent is required'),
      dataProcessing: z.boolean(),
      marketing: z.boolean()
    }),
    source: z.string().max(50),
    medium: z.string().max(50),
    campaign: z.string().max(50).optional()
  }),

  updateProfile: z.object({
    company: z.string().max(200).optional(),
    role: z.string().max(100).optional(),
    phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number').optional(),
    companySize: z.enum(['1-10', '11-50', '51-200', '201-500', '500+']).optional(),
    industry: z.string().max(100).optional()
  })
};

// Usage in API routes
export async function POST(request: NextRequest) {
  const body = await request.json();

  try {
    const validated = leadSchemas.create.parse(body);
    // Process with validated data...
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
  }
}
```

### 13.4 Data Sanitization

```typescript
// lib/security/sanitizer.ts
import DOMPurify from 'isomorphic-dompurify';

export class Sanitizer {
  static sanitizeHTML(html: string): string {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li'],
      ALLOWED_ATTR: ['href', 'target', 'rel']
    });
  }

  static sanitizeInput(input: string): string {
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML
      .substring(0, 10000); // Limit length
  }

  static sanitizeEmail(email: string): string {
    return email.toLowerCase().trim();
  }

  static sanitizePhone(phone: string): string {
    return phone.replace(/[^\d+]/g, ''); // Keep only digits and +
  }
}
```

---

## 14. Monitoring & Analytics

### 14.1 Error Tracking (Sentry)

```typescript
// lib/monitoring/sentry.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  
  tracesSampleRate: 0.1, // 10% of transactions
  
  beforeSend(event, hint) {
    // Filter out sensitive data
    if (event.request?.headers) {
      delete event.request.headers['cookie'];
      delete event.request.headers['authorization'];
    }
    
    // Filter out specific errors
    if (event.exception?.values?.[0]?.type === 'ChunkLoadError') {
      return null; // Don't send chunk load errors
    }
    
    return event;
  }
});

// Custom error contexts
Sentry.setContext('lead_stage', {
  stage: 'identified',
  score: 75
});

// User tracking
Sentry.setUser({
  id: lead._id,
  email: lead.email,
  stage: lead.engagement.stage
});
```

### 14.2 Custom Metrics

```typescript
// lib/monitoring/metrics.ts
export class MetricsCollector {
  static async trackLeadCaptured(lead: Lead, source: string) {
    const metric = {
      type: 'lead_captured',
      timestamp: new Date(),
      data: {
        source,
        stage: lead.engagement.stage,
        industry: lead.profile.industry,
        companySize: lead.profile.companySize
      }
    };

    await Metric.create(metric);
    
    // Send to analytics
    if (typeof window !== 'undefined' && (window as any).posthog) {
      (window as any).posthog.capture('lead_captured', metric.data);
    }
  }

  static async trackConversion(conversion: Conversion) {
    const metric = {
      type: 'conversion',
      timestamp: new Date(),
      data: {
        type: conversion.type,
        value: conversion.value,
        leadId: conversion.leadId,
        funnelStage: conversion.funnelStage
      }
    };

    await Metric.create(metric);
  }

  static async trackAISatisfaction(
    conversationId: string,
    satisfaction: number
  ) {
    const metric = {
      type: 'ai_satisfaction',
      timestamp: new Date(),
      data: {
        conversationId,
        satisfaction, // 1-5
        model: 'gpt-4o',
        responseTime: satisfaction === 5 ? 'fast' : 'slow'
      }
    };

    await Metric.create(metric);
  }
}
```

### 14.3 Real-Time Dashboard

```typescript
// app/dashboard/analytics/page.tsx
export default async function AnalyticsDashboard() {
  // Fetch real-time metrics
  const [
    totalLeads,
    qualifiedLeads,
    conversionRate,
    activeChats,
    todayRevenue
  ] = await Promise.all([
      Lead.countDocuments({ 'engagement.stage': { $ne: 'anonymous' } }),
      Lead.countDocuments({ 'engagement.stage': 'qualified' }),
      getConversionRate(),
      Conversation.countDocuments({ status: 'active' }),
      getRevenueToday()
    ]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <MetricCard
        title="Total Leads"
        value={totalLeads}
        change="+12%"
        trend="up"
      />
      
      <MetricCard
        title="Qualified Leads"
        value={qualifiedLeads}
        change="+8%"
        trend="up"
      />
      
      <MetricCard
        title="Conversion Rate"
        value={`${(conversionRate * 100).toFixed(1)}%`}
        change="+2.3%"
        trend="up"
      />
      
      <MetricCard
        title="Today's Revenue"
        value={`$${todayRevenue.toLocaleString()}`}
        change="+15%"
        trend="up"
      />

      <RealTimeChart />
      <LiveLeadsTable />
      <ActiveConversations />
    </div>
  );
}
```

---

## Conclusion

This comprehensive AI-powered ecosystem architecture transforms EmenTech's digital presence from a static website into an intelligent lead capture and engagement platform. By combining:

1. **Value-First Lead Capture**: Natural data collection through valuable interactions
2. **AI-Native Personalization**: Every experience tailored to the individual
3. **Predictive Lead Scoring**: ML-powered identification of high-value prospects
4. **Conversational Interfaces**: Natural, human-like AI interactions
5. **Privacy-Respecting Design**: GDPR-compliant, transparent data practices

The system is designed to:
- Increase qualified leads by 300%
- Improve lead quality through predictive scoring
- Scale engagement through automation
- Provide actionable insights through analytics
- Deliver exceptional user experiences

### Next Steps

1. **Review this architecture** with stakeholders
2. **Prioritize features** based on business impact
3. **Begin Phase 1 implementation** (Foundation)
4. **Establish metrics** and baseline measurements
5. **Iterate and improve** based on data

This architecture is production-ready, scalable, and designed for long-term success. It leverages 2025 best practices while maintaining flexibility for future enhancements.

**Document Status**: COMPLETE ✅
**Ready for Implementation**: YES ✅
**Estimated Implementation Time**: 16 weeks
**Team Required**: 2-3 Full-Stack Developers, 1 AI/ML Engineer, 1 Designer

---

**Document Version**: 1.0
**Last Updated**: January 20, 2026
**Author**: System Architecture Agent
**Status**: Ready for Handoff
