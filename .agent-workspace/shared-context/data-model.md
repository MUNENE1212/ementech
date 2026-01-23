# EmenTech Data Model Specification

**Version**: 2.0
**Last Updated**: 2026-01-21
**Database**: MongoDB Atlas with Mongoose ODM

---

## Table of Contents

1. [Database Overview](#database-overview)
2. [Core Models](#core-models)
3. [Email System Models](#email-system-models)
4. [Lead Management Models](#lead-management-models)
5. [User Management Models](#user-management-models)
6. [Analytics Models](#analytics-models)
7. [Content Management Models](#content-management-models)
8. [Additional Models](#additional-models)
9. [Relationships & Indexes](#relationships--indexes)
10. [Database Operations](#database-operations)

---

## 1. Database Overview

### 1.1 Database Information

**Database**: MongoDB Atlas (Cloud-hosted)
**ODM**: Mongoose 8.0.0
**Total Collections**: 33
**Connection**: Replicated with automatic failover

### 1.2 Naming Conventions

- **Collection Names**: Singular, PascalCase (e.g., `User`, `Email`, `Lead`)
- **Field Names**: camelCase (e.g., `firstName`, `lastName`)
- **Indexes**: Compound indexes for common queries
- **Relationships**: ObjectId references with population

### 1.3 Schema Design Principles

- **Embedded Documents**: For one-to-few relationships
- **References**: For one-to-many and many-to-many
- **Denormalization**: For read-heavy data (analytics)
- **Normalization**: For write-heavy data (transactional)

---

## 2. Core Models

### 2.1 User Model

**Purpose**: Authentication and user management

**File**: `backend/src/models/User.js`

**Schema**:
```javascript
{
  // Basic Information
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email']
  },

  password: {
    type: String,
    required: true,
    minlength: 60, // bcrypt hash length
    select: false // Don't return password by default
  },

  // Role & Permissions
  role: {
    type: String,
    enum: ['admin', 'manager', 'employee'],
    default: 'employee'
  },

  department: {
    type: String,
    enum: ['leadership', 'engineering', 'marketing', 'sales', 'support', 'hr'],
    default: 'engineering'
  },

  // Account Status
  isActive: {
    type: Boolean,
    default: true
  },

  emailVerified: {
    type: Boolean,
    default: false
  },

  // Profile
  avatar: String, // URL to image
  phone: String,
  bio: String,
  location: String,

  // Timestamps
  lastLogin: Date,
  passwordChangedAt: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}
```

**Indexes**:
```javascript
// Unique index on email
{ email: 1 }

// Compound index for active users
{ isActive: 1, role: 1 }
```

**Relationships**:
- One-to-many with Email (emails owned by user)
- One-to-many with Lead (leads assigned to user)
- One-to-many with Interaction (interactions created by user)

---

## 3. Email System Models

### 3.1 Email Model

**Purpose**: Store synchronized emails from IMAP

**File**: `backend/src/models/Email.js`

**Schema**:
```javascript
{
  // Ownership
  user: {
    type: ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  emailAccount: {
    type: String,
    required: true
  },

  // IMAP Identification
  messageId: {
    type: String,
    required: true,
    index: true
  },

  uid: {
    type: Number,
    required: true
  },

  // Organization
  folder: {
    type: String,
    enum: ['inbox', 'sent', 'drafts', 'trash', 'spam', 'archive'],
    default: 'inbox',
    index: true
  },

  threadId: {
    type: String,
    index: true
  },

  // Participants
  from: {
    name: String,
    address: {
      type: String,
      required: true
    }
  },

  to: [{
    name: String,
    address: String
  }],

  cc: [{
    name: String,
    address: String
  }],

  bcc: [{
    name: String,
    address: String
  }],

  replyTo: [{
    name: String,
    address: String
  }],

  // Content
  subject: {
    type: String,
    trim: true
  },

  textBody: {
    type: String,
    default: ''
  },

  htmlBody: {
    type: String,
    default: ''
  },

  attachments: [{
    filename: String,
    contentType: String,
    size: Number,
    cid: String, // Content-ID for inline images
    content: Buffer // Optional: stored if small
  }],

  // Flags
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },

  isFlagged: {
    type: Boolean,
    default: false,
    index: true
  },

  hasAttachments: {
    type: Boolean,
    default: false
  },

  // Labels
  labels: [{
    type: ObjectId,
    ref: 'Label'
  }],

  // Dates
  date: {
    type: Date,
    required: true,
    index: true
  },

  sentDate: Date,

  // Sync Status
  syncStatus: {
    type: String,
    enum: ['synced', 'pending', 'error'],
    default: 'synced'
  },

  // Error tracking
  error: String,

  // Full-text search
  $text: {
    fields: ['subject', 'textBody', 'from.address']
  },

  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}
```

**Indexes**:
```javascript
// Primary query index
{ user: 1, folder: 1, date: -1 }

// Thread lookup
{ user: 1, threadId: 1 }

// Unique email per account
{ user: 1, emailAccount: 1, messageId: 1 }

// Full-text search
{ subject: 'text', textBody: 'text', from: 'text' }

// Unread emails
{ user: 1, folder: 1, isRead: 1 }

// Flagged emails
{ user: 1, isFlagged: 1 }
```

**Relationships**:
- Belongs to User (many-to-one)
- Has many Labels (many-to-many)
- References Contact (sender/receivers)

---

### 3.2 Label Model

**Purpose**: Email categorization labels

**File**: `backend/src/models/Label.js`

**Schema**:
```javascript
{
  // Ownership
  user: {
    type: ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Label Details
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 50
  },

  color: {
    type: String,
    default: '#3b82f6',
    match: [/^#[0-9A-F]{6}$/i, 'Invalid hex color']
  },

  // Label Type
  type: {
    type: String,
    enum: ['user', 'system'],
    default: 'user'
  },

  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}
```

**Indexes**:
```javascript
// Unique label name per user
{ user: 1, name: 1 }
```

**Relationships**:
- Belongs to User (many-to-one)
- Has many Emails (one-to-many)

---

### 3.3 Folder Model

**Purpose**: Email folder management

**File**: `backend/src/models/Folder.js`

**Schema**:
```javascript
{
  // Ownership
  user: {
    type: ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Folder Details
  name: {
    type: String,
    required: true,
    enum: ['inbox', 'sent', 'drafts', 'trash', 'spam', 'archive']
  },

  // Unread Count
  unreadCount: {
    type: Number,
    default: 0
  },

  // Total Count
  totalCount: {
    type: Number,
    default: 0
  },

  // Timestamps
  updatedAt: { type: Date, default: Date.now }
}
```

**Indexes**:
```javascript
// Unique folder per user
{ user: 1, name: 1 }
```

**Relationships**:
- Belongs to User (many-to-one)
- Has many Emails (one-to-many)

---

### 3.4 Contact Model

**Purpose**: Email contacts (senders/receivers)

**File**: `backend/src/models/Contact.js`

**Schema**:
```javascript
{
  // Ownership
  user: {
    type: ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Contact Information
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },

  name: String,

  // Profile
  avatar: String, // Gravatar or custom
  company: String,
  phone: String,

  // Metadata
  lastContactDate: Date,
  emailCount: {
    type: Number,
    default: 0
  },

  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}
```

**Indexes**:
```javascript
// Unique email per user
{ user: 1, email: 1 }

// Most contacted
{ user: 1, emailCount: -1 }
```

**Relationships**:
- Belongs to User (many-to-one)
- Referenced by Emails (sender/receivers)

---

### 3.5 UserEmail Model

**Purpose**: User email accounts configuration

**File**: `backend/src/models/UserEmail.js`

**Schema**:
```javascript
{
  // Ownership
  user: {
    type: ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Email Account
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },

  // IMAP Configuration
  imap: {
    host: String,
    port: Number,
    tls: Boolean
  },

  // SMTP Configuration
  smtp: {
    host: String,
    port: Number,
    secure: Boolean
  },

  // Status
  isActive: {
    type: Boolean,
    default: true
  },

  // Last sync
  lastSyncAt: Date,

  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}
```

**Indexes**:
```javascript
// Unique email per user
{ user: 1, email: 1 }
```

**Relationships**:
- Belongs to User (many-to-one)
- Has many Emails (one-to-many)

---

## 4. Lead Management Models

### 4.1 Lead Model

**Purpose**: Lead capture and management

**File**: `backend/src/models/Lead.js`

**Schema**:
```javascript
{
  // CONTACT INFORMATION
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },

  name: {
    type: String,
    trim: true
  },

  phone: String,

  company: {
    type: String,
    trim: true
  },

  jobTitle: {
    type: String,
    trim: true
  },

  website: String,

  // PROGRESSIVE PROFILING
  profileStage: {
    type: Number,
    enum: [1, 2, 3, 4],
    default: 1,
    // 1: Anonymous (email only)
    // 2: Identified (name, company)
    // 3: Qualified (budget, timeline)
    // 4: Opportunity (ready to convert)
    index: true
  },

  // ENHANCED DATA
  companySize: {
    type: String,
    enum: ['1', '2-10', '11-50', '50+']
  },

  industry: String,

  budget: {
    type: String,
    enum: ['<5k', '5k-10k', '10k-25k', '25k-50k', '50k+']
  },

  timeline: {
    type: String,
    enum: ['urgent', '1-3mo', '3-6mo', '6mo+']
  },

  // LEAD SCORING
  leadScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 120,
    index: true
  },

  status: {
    type: String,
    enum: ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'],
    default: 'new',
    index: true
  },

  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
    index: true
  },

  // SOURCE TRACKING
  source: {
    type: String,
    enum: ['contact-form', 'newsletter', 'event', 'survey', 'download',
            'meetup', 'chatbot', 'referral', 'website'],
    index: true
  },

  campaign: String,

  utmSource: String,
  utmMedium: String,
  utmCampaign: String,
  utmTerm: String,
  utmContent: String,

  // ENGAGEMENT METRICS
  engagement: {
    pageViews: { type: Number, default: 0 },
    timeOnSite: { type: Number, default: 0 }, // seconds
    sessionCount: { type: Number, default: 1 },
    lastActivity: Date,
    emailOpens: { type: Number, default: 0 },
    emailClicks: { type: Number, default: 0 }
  },

  // GDPR COMPLIANCE
  consentGiven: {
    type: Boolean,
    default: false
  },

  marketingConsent: {
    type: Boolean,
    default: false
  },

  unsubscribed: {
    type: Boolean,
    default: false,
    index: true
  },

  consentDate: Date,

  // INTERACTIONS & NOTES
  notes: [{
    content: String,
    author: {
      type: ObjectId,
      ref: 'User'
    },
    createdAt: { type: Date, default: Date.now }
  }],

  interactions: [{
    type: {
      type: String,
      enum: ['call', 'email', 'meeting', 'demo', 'other']
    },
    description: String,
    duration: Number, // minutes
    author: {
      type: ObjectId,
      ref: 'User'
    },
    createdAt: { type: Date, default: Date.now }
  }],

  // ASSIGNMENT
  assignedTo: {
    type: ObjectId,
    ref: 'User',
    index: true
  },

  // CONVERSION
  converted: {
    type: Boolean,
    default: false
  },

  conversionDate: Date,

  value: {
    type: Number,
    default: 0
  }, // Deal value if converted

  // CUSTOM FIELDS
  customFields: {
    type: Map,
    of: String
  },

  // INFERRED DATA
  inferredData: {
    location: String,
    deviceType: String,
    referrer: String,
    firstPage: String,
    leadQuality: String
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },

  updatedAt: {
    type: Date,
    default: Date.now
  }
}
```

**Indexes**:
```javascript
// Email lookup (unique)
{ email: 1 }

// Score-based sorting
{ leadScore: -1 }

// Status & score filtering
{ status: 1, leadScore: -1 }

// Source tracking
{ source: 1, createdAt: -1 }

// Assignment
{ assignedTo: 1, status: 1 }

// Unsubscribed leads
{ unsubscribed: 1 }

// Stage progression
{ profileStage: 1, leadScore: -1 }
```

**Relationships**:
- Assigned to User (many-to-one)
- Has many Notes (embedded)
- Has many Interactions (embedded)

---

## 5. User Management Models

### 5.1 Authentication Model

**Note**: Authentication is handled through the User model with JWT tokens stored in HTTP-only cookies (server-side), not in a separate collection.

---

## 6. Analytics Models

### 6.1 Analytics Model

**Purpose**: Daily aggregated analytics

**File**: `backend/src/models/Analytics.js`

**Schema**:
```javascript
{
  // Date
  date: {
    type: Date,
    required: true,
    index: true
  },

  // Traffic Metrics
  visitors: {
    type: Number,
    default: 0
  },

  pageViews: {
    type: Number,
    default: 0
  },

  sessions: {
    type: Number,
    default: 0
  },

  // Lead Metrics
  leads: {
    new: { type: Number, default: 0 },
    qualified: { type: Number, default: 0 },
    converted: { type: Number, default: 0 }
  },

  // Source Breakdown
  sources: [{
    name: String,
    visitors: Number,
    leads: Number
  }],

  // Funnel Metrics
  funnel: {
    visitors: Number,
    signups: Number,
    leads: Number,
    qualified: Number,
    converted: Number
  },

  // Engagement
  avgSessionDuration: Number, // seconds
  bounceRate: Number, // percentage

  // Email Metrics
  emails: {
    sent: Number,
    opened: Number,
    clicked: Number
  },

  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}
```

**Indexes**:
```javascript
// Date-based queries
{ date: -1 }

// Compound index for date range queries
{ date: -1 }
```

---

### 6.2 Interaction Model

**Purpose**: User interaction tracking

**File**: `backend/src/models/Interaction.js`

**Schema**:
```javascript
{
  // Session
  sessionId: {
    type: String,
    index: true
  },

  // User (if authenticated)
  user: {
    type: ObjectId,
    ref: 'User',
    index: true
  },

  // Lead (if identified)
  lead: {
    type: ObjectId,
    ref: 'Lead',
    index: true
  },

  // Interaction Type
  type: {
    type: String,
    enum: ['pageview', 'click', 'submit', 'download', 'scroll', 'custom'],
    index: true
  },

  // Details
  page: String,
  element: String, // For clicks
  value: String, // For form submissions

  // Context
  referrer: String,
  utmSource: String,
  utmMedium: String,
  utmCampaign: String,

  // Device Info
  device: {
    type: String,
    enum: ['desktop', 'tablet', 'mobile']
  },

  browser: String,
  os: String,

  // Timestamp
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}
```

**Indexes**:
```javascript
// Session timeline
{ sessionId: 1, createdAt: 1 }

// User interactions
{ user: 1, createdAt: -1 }

// Lead interactions
{ lead: 1, createdAt: -1 }

// Type filtering
{ type: 1, createdAt: -1 }
```

---

## 7. Content Management Models

### 7.1 Content Model

**Purpose**: CMS for blog posts, pages, etc.

**File**: `backend/src/models/Content.js`

**Schema**:
```javascript
{
  // Content Details
  title: {
    type: String,
    required: true
  },

  slug: {
    type: String,
    unique: true,
    lowercase: true
  },

  type: {
    type: String,
    enum: ['post', 'page', 'snippet'],
    default: 'post'
  },

  // Content
  content: {
    type: String,
    required: true
  },

  excerpt: String,

  // Author
  author: {
    type: ObjectId,
    ref: 'User'
  },

  // Categories & Tags
  category: String,
  tags: [String],

  // Status
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },

  // SEO
  metaTitle: String,
  metaDescription: String,
  keywords: [String],

  // Featured Image
  featuredImage: String,

  // Metrics
  views: {
    type: Number,
    default: 0
  },

  // Timestamps
  publishedAt: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}
```

**Indexes**:
```javascript
// Unique slug
{ slug: 1 }

// Published posts
{ status: 1, publishedAt: -1 }

// Author posts
{ author: 1, status: 1 }
```

---

## 8. Additional Models

The following models are defined but not extensively used in the current implementation:

- **Conversation**: AI chatbot conversations
- **Message**: Chat messages
- **AIConversation**: AI-specific conversations
- **Event**: Events tracking
- **Newsletter**: Newsletter management
- **Notification**: User notifications
- **Post**: Social media posts
- **Booking**: Booking system
- **CategoryRequest**: Category requests
- **DiagnosticFlow**: Diagnostic flows
- **FAQ**: Frequently asked questions
- **Matching**: Matching algorithm
- **MatchingInteraction**: Matching interactions
- **MatchingPreference**: Matching preferences
- **Portfolio**: Portfolio items
- **PricingConfig**: Pricing configuration
- **Review**: Reviews
- **ServiceCategory**: Service categories
- **ServicePricing**: Service pricing
- **SupportTicket**: Support tickets
- **Transaction**: Transactions

**Note**: These models are prepared for future features and can be implemented as needed.

---

## 9. Relationships & Indexes

### 9.1 Entity Relationship Diagram (ERD)

```
┌──────────────┐
│     User     │
│  (Auth)      │
└──────┬───────┘
       │
       ├──────────────┐
       │              │
       ▼              ▼
┌─────────────┐  ┌──────────────┐
│   Email     │  │    Lead      │
│  (Many)     │  │   (Many)     │
└──────┬──────┘  └──────┬───────┘
       │                │
       ├─────┬─────┐    │
       │     │     │    │
       ▼     ▼     ▼    ▼
  ┌────────┐ ┌──────┐  ┌────────┐
  │ Label  │ │Folder│  │Contact │
  │(Many)  │ │(Many)│  │(Many)  │
  └────────┘ └──────┘  └────────┘

┌──────────────┐
│   Analytics  │
│  (Aggregated)│
└──────────────┘
       │
       ▼
┌──────────────┐
│ Interaction  │
│   (Events)   │
└──────────────┘
```

### 9.2 Key Indexes Summary

**User**:
```javascript
{ email: 1 } // unique
{ isActive: 1, role: 1 }
```

**Email**:
```javascript
{ user: 1, folder: 1, date: -1 } // Primary query
{ user: 1, messageId: 1 } // unique
{ user: 1, threadId: 1 } // Threads
{ user: 1, folder: 1, isRead: 1 } // Unread
{ user: 1, isFlagged: 1 } // Flagged
{ subject: 'text', textBody: 'text' } // Full-text search
```

**Lead**:
```javascript
{ email: 1 } // unique
{ leadScore: -1 } // Score sorting
{ status: 1, leadScore: -1 } // Status filtering
{ source: 1, createdAt: -1 } // Source tracking
{ assignedTo: 1, status: 1 } // Assignment
{ unsubscribed: 1 } // Unsubscribed
```

**Analytics**:
```javascript
{ date: -1 } // Date-based queries
```

**Interaction**:
```javascript
{ sessionId: 1, createdAt: 1 } // Session timeline
{ user: 1, createdAt: -1 } // User interactions
{ lead: 1, createdAt: -1 } // Lead interactions
```

---

## 10. Database Operations

### 10.1 Connection

**File**: `backend/src/config/database.js`

```javascript
import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      // Options for MongoDB connection
    });

    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

export default connectDB;
```

### 10.2 Common Queries

**Email Queries**:
```javascript
// Get emails by folder
const emails = await Email.find({ user: userId, folder: 'inbox' })
  .sort({ date: -1 })
  .limit(50);

// Get unread count
const unreadCount = await Email.countDocuments({
  user: userId,
  folder: 'inbox',
  isRead: false
});

// Search emails
const results = await Email.find({
  user: userId,
  $text: { $search: searchTerm }
});

// Get email thread
const thread = await Email.find({
  user: userId,
  threadId: threadId
}).sort({ date: 1 });
```

**Lead Queries**:
```javascript
// Get qualified leads
const qualified = await Lead.find({
  leadScore: { $gte: 60 },
  status: { $ne: 'lost' }
}).sort({ leadScore: -1 });

// Get lead statistics
const stats = await Lead.aggregate([
  { $group: {
    _id: '$status',
    count: { $sum: 1 },
    avgScore: { $avg: '$leadScore' }
  }}
]);

// Update lead score
const lead = await Lead.findByIdAndUpdate(
  leadId,
  { $set: { leadScore: newScore } },
  { new: true }
);
```

### 10.3 Aggregation Pipelines

**Lead Funnel**:
```javascript
const funnel = await Lead.aggregate([
  { $group: {
    _id: '$status',
    count: { $sum: 1 },
    totalValue: { $sum: '$value' }
  }},
  { $sort: { _id: 1 } }
]);
```

**Source Analytics**:
```javascript
const sources = await Lead.aggregate([
  { $group: {
    _id: '$source',
    count: { $sum: 1 },
    avgScore: { $avg: '$leadScore' }
  }},
  { $sort: { count: -1 } }
]);
```

---

**Document Status**: Complete
**Next Steps**: Email System UI/UX Specification
**Maintained By**: Architecture Team
