# Ementech Website - Data Model Documentation

**Analysis Date**: 2026-01-21
**Database**: MongoDB
**ODM**: Mongoose 8.0.0
**Total Models**: 31 schemas

---

## Executive Summary

The Ementech website uses MongoDB with Mongoose ODM, featuring 31 data models that support the corporate website, email management system (CWD startup), AI chatbot, lead capture, and content management.

---

## Database Architecture

### Database Design Philosophy

**Document-Oriented**: MongoDB schema chosen for flexibility and evolving requirements

**Relationship Strategy**:
- **Embedded Documents**: For closely related data (email attachments, message parts)
- **References**: For related entities (email.user → User, email.labels → Label)
- **Denormalization**: For performance (email.from cached in Email doc)

**Indexing Strategy**:
- Single field indexes on frequently queried fields
- Compound indexes for multi-field queries
- Text indexes for full-text search
- Unique indexes on unique fields (email, username)

---

## Core Models (Critical)

### 1. User

**File**: `/backend/src/models/User.js`

**Purpose**: User accounts and authentication

**Schema**:
```javascript
{
  name: String (required),
  email: String (required, unique, lowercase),
  password: String (required, hashed),
  role: String (enum: ['user', 'admin'], default: 'user'),
  company: String,
  phone: String,
  avatar: String,
  isActive: Boolean (default: true),
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
- `{ email: 1 }` (unique)
- `{ isActive: 1 }`

**Relationships**:
- Has many Emails
- Has many UserEmails
- Has many Conversations
- Has many Leads

**Security**:
- Password hashed with bcryptjs (10 rounds)
- Email case-insensitive unique

---

### 2. Email

**File**: `/backend/src/models/Email.js` (335 lines)

**Purpose**: Email messages with full IMAP sync (CWD startup)

**Schema**: See `/email-system-documentation.md` for full schema

**Key Fields**:
```javascript
{
  user: ObjectId (ref: User, indexed),
  emailAccount: ObjectId (ref: UserEmail, indexed),
  messageId: String (unique, indexed),
  uid: Number (IMAP UID),
  folder: String (enum: INBOX, Sent, Drafts, ...),
  from: { name, email },
  to: [{ name, email }],
  subject: String,
  htmlBody: String,
  textBody: String,
  isRead: Boolean (indexed),
  isFlagged: Boolean (indexed),
  hasAttachments: Boolean,
  labels: [ObjectId] (ref: Label),
  date: Date (indexed),
  inReplyTo: String,
  references: [String],
  isDeleted: Boolean
}
```

**Indexes**:
```javascript
{ user: 1, folder: 1, date: -1 }
{ user: 1, isRead: 1 }
{ user: 1, isFlagged: 1, date: -1 }
{ messageId: 1 } (unique)
{ subject: 'text', textBody: 'text' }
```

**Static Methods**:
- `getUnreadCount(userId, folder)`
- `searchEmails(userId, query, options)`

**Instance Methods**:
- `markAsRead()`
- `toggleFlag()`
- `moveToFolder(newFolder)`
- `softDelete()`

**Virtuals**:
- `fromDisplay` - Formatted from address
- `folderName` - Human-readable folder name

---

### 3. UserEmail

**File**: `/backend/src/models/UserEmail.js`

**Purpose**: Email account credentials (encrypted) - CWD startup

**Schema**:
```javascript
{
  user: ObjectId (ref: User, required),
  email: String (required, unique),
  displayName: String,

  imap: {
    host: String (required),
    port: Number (required),
    tls: Boolean (default: true),
    username: String (required),
    password: String (required, encrypted)
  },

  smtp: {
    host: String (required),
    port: Number (required),
    secure: Boolean (default: false),
    username: String (required),
    password: String (required, encrypted)
  },

  replyTo: String,
  isPrimary: Boolean (default: false),
  syncStatus: String (enum: 'syncing', 'success', 'error'),
  lastSyncedAt: Date,
  syncError: String
}
```

**Indexes**:
- `{ user: 1, isPrimary: -1 }`
- `{ email: 1 }` (unique)

**Static Methods**:
- `getPrimaryEmail(userId)` - Get user's primary email account

**Encryption**:
- IMAP and SMTP passwords encrypted
- Decrypted only when used for IMAP/SMTP connection

---

### 4. Folder

**File**: `/backend/src/models/Folder.js`

**Purpose**: Email folder management

**Schema**:
```javascript
{
  user: ObjectId (ref: User, required),
  name: String (required),        // System folder name
  customName: String,             // Display name for custom folders
  icon: String,
  color: String,
  unreadCount: Number (default: 0),
  totalCount: Number (default: 0),
  isSystem: Boolean (default: false)
}
```

**Static Methods**:
- `getSystemFolders()` - Returns predefined system folders
- `getUserFolders(userId)` - Get user's custom folders

**System Folders**:
- INBOX, Sent, Drafts, Trash, Spam, Important, Archive

---

### 5. Label

**File**: `/backend/src/models/Label.js`

**Purpose**: User-defined email labels

**Schema**:
```javascript
{
  user: ObjectId (ref: User, required),
  name: String (required),
  color: String (default: '#1976d2'),
  icon: String (default: 'label')
}
```

**Static Methods**:
- `getUserLabels(userId)` - Get user's labels

---

### 6. Contact

**File**: `/backend/src/models/Contact.js`

**Purpose**: Email contacts with frequency tracking

**Schema**:
```javascript
{
  user: ObjectId (ref: User, required),
  name: String,
  email: String (required),
  phone: String,
  company: String,
  notes: String,
  frequencyScore: Number (default: 0),
  isDeleted: Boolean (default: false)
}
```

**Indexes**:
- `{ user: 1, email: 1 }` (unique)
- `{ user: 1, frequencyScore: -1 }`

**Instance Methods**:
- `incrementFrequency()` - Increments score on email interaction

**Static Methods**:
- `searchContacts(userId, query)` - Search contacts

---

## Business Models

### 7. Lead

**File**: `/backend/src/models/Lead.js`

**Purpose**: Lead capture from website forms

**Schema**:
```javascript
{
  name: String (required),
  email: String (required),
  phone: String,
  company: String,
  interest: String,
  message: String,
  status: String (enum: 'new', 'contacted', 'qualified', 'converted', 'lost'),
  source: String (default: 'website'),
  assignedTo: ObjectId (ref: User),
  notes: [String],
  value: Number,
  probability: Number,
  expectedCloseDate: Date,
  isDeleted: Boolean
}
```

**Indexes**:
- `{ email: 1 }`
- `{ status: 1 }`
- `{ createdAt: -1 }`

---

### 8. Interaction

**File**: `/backend/src/models/Interaction.js`

**Purpose**: User interaction tracking (analytics)

**Schema**:
```javascript
{
  user: ObjectId (ref: User),
  type: String (enum: 'page_view', 'click', 'form_submit', 'download'),
  page: String,
  resource: String,
  metadata: Mixed,
  ipAddress: String,
  userAgent: String,
  referrer: String,
  sessionId: String
}
```

**Indexes**:
- `{ user: 1, type: -1, createdAt: -1 }`
- `{ type: 1, createdAt: -1 }`

---

### 9. Conversation

**File**: `/backend/src/models/Conversation.js`

**Purpose**: Chat conversations (AI chatbot)

**Schema**:
```javascript
{
  user: ObjectId (ref: User),
  type: String (enum: 'support', 'sales', 'general'),
  status: String (enum: 'active', 'closed', 'archived'),
  assignedTo: ObjectId (ref: User),
  tags: [String],
  rating: Number,
  feedback: String,
  startedAt: Date,
  endedAt: Date
}
```

**Relationships**:
- Has many Messages

---

### 10. Message

**File**: `/backend/src/models/Message.js`

**Purpose**: Chat messages in conversations

**Schema**:
```javascript
{
  conversation: ObjectId (ref: Conversation, required),
  sender: ObjectId (ref: User),
  senderType: String (enum: 'user', 'agent', 'system'),
  content: String (required),
  contentType: String (enum: 'text', 'image', 'file'),
  attachments: [{
    filename: String,
    url: String,
    mimeType: String,
    size: Number
  }],
  isRead: Boolean (default: false),
  metadata: Mixed
}
```

**Indexes**:
- `{ conversation: 1, createdAt: 1 }`

---

### 11. AIConversation

**File**: `/backend/src/models/AIConversation.js`

**Purpose**: AI chatbot conversations with OpenAI

**Schema**:
```javascript
{
  user: ObjectId (ref: User),
  messages: [{
    role: String (enum: 'user', 'assistant', 'system'),
    content: String,
    timestamp: Date
  }],
  context: Mixed,
  model: String (default: 'gpt-4'),
  tokensUsed: Number,
  cost: Number,
  status: String (enum: 'active', 'completed', 'error')
}
```

---

## Content Management Models

### 12. Content

**File**: `/backend/src/models/Content.js`

**Purpose**: CMS content blocks

**Schema**:
```javascript
{
  type: String (enum: 'hero', 'about', 'services', 'testimonials'),
  title: String,
  content: String,
  htmlContent: String,
  metadata: Mixed,
  isActive: Boolean (default: true),
  order: Number,
  locale: String (default: 'en')
}
```

---

### 13. Post

**File**: `/backend/src/models/Post.js`

**Purpose**: Blog posts

**Schema**:
```javascript
{
  title: String (required),
  slug: String (unique),
  content: String (required),
  excerpt: String,
  featuredImage: String,
  author: ObjectId (ref: User),
  category: String,
  tags: [String],
  status: String (enum: 'draft', 'published', 'archived'),
  publishedAt: Date,
  metaTitle: String,
  metaDescription: String,
  views: Number (default: 0)
}
```

**Indexes**:
- `{ slug: 1 }` (unique)
- `{ status: 1, publishedAt: -1 }`

---

### 14. FAQ

**File**: `/backend/src/models/FAQ.js`

**Purpose**: Frequently asked questions

**Schema**:
```javascript
{
  question: String (required),
  answer: String (required),
  category: String,
  order: Number (default: 0),
  isActive: Boolean (default: true),
  locale: String (default: 'en')
}
```

---

### 15. Event

**File**: `/backend/src/models/Event.js`

**Purpose**: Events management

**Schema**:
```javascript
{
  title: String (required),
  description: String,
  startDate: Date (required),
  endDate: Date,
  location: String,
  isVirtual: Boolean (default: false),
  meetingLink: String,
  maxAttendees: Number,
  registeredCount: Number (default: 0),
  status: String (enum: 'upcoming', 'ongoing', 'completed', 'cancelled'),
  coverImage: String,
  organizer: ObjectId (ref: User)
}
```

---

### 16. Newsletter

**File**: `/backend/src/models/Newsletter.js`

**Purpose**: Newsletter subscribers

**Schema**:
```javascript
{
  email: String (required, unique),
  firstName: String,
  lastName: String,
  isActive: Boolean (default: true),
  subscribedAt: Date,
  unsubscribedAt: Date
}
```

---

### 17. Review

**File**: `/backend/src/models/Review.js`

**Purpose**: Customer reviews

**Schema**:
```javascript
{
  user: ObjectId (ref: User),
  rating: Number (required, min: 1, max: 5),
  title: String,
  content: String,
  service: String,
  isVerified: Boolean (default: false),
  isApproved: Boolean (default: false),
  helpfulCount: Number (default: 0)
}
```

---

### 18. Portfolio

**File**: `/backend/src/models/Portfolio.js`

**Purpose**: Portfolio items/projects

**Schema**:
```javascript
{
  title: String (required),
  description: String,
  client: String,
  technologies: [String],
  images: [String],
  projectUrl: String,
  githubUrl: String,
  startDate: Date,
  endDate: Date,
  status: String (enum: 'completed', 'ongoing', 'planned'),
  featured: Boolean (default: false),
  order: Number
}
```

---

## Service & Pricing Models

### 19. ServiceCategory

**File**: `/backend/src/models/ServiceCategory.js`

**Purpose**: Service categories

**Schema**:
```javascript
{
  name: String (required),
  description: String,
  icon: String,
  order: Number,
  isActive: Boolean (default: true)
}
```

---

### 20. ServicePricing

**File**: `/backend/src/models/ServicePricing.js`

**Purpose**: Service pricing tiers

**Schema**:
```javascript
{
  service: ObjectId (ref: ServiceCategory),
  name: String (required),
  description: String,
  price: Number (required),
  currency: String (default: 'USD'),
  billingCycle: String (enum: 'one_time', 'monthly', 'yearly'),
  features: [String],
  isPopular: Boolean (default: false),
  isActive: Boolean (default: true)
}
```

---

### 21. PricingConfig

**File**: `/backend/src/models/PricingConfig.js`

**Purpose**: Global pricing configuration

**Schema**:
```javascript
{
  currency: String (default: 'USD'),
  taxRate: Number,
  discountPercent: Number,
  minProjectCost: Number,
  hourlyRate: Number
}
```

---

## Support & Booking Models

### 22. SupportTicket

**File**: `/backend/src/models/SupportTicket.js`

**Purpose**: Customer support tickets

**Schema**:
```javascript
{
  user: ObjectId (ref: User),
  subject: String (required),
  description: String (required),
  category: String,
  priority: String (enum: 'low', 'medium', 'high', 'urgent'),
  status: String (enum: 'open', 'in_progress', 'resolved', 'closed'),
  assignedTo: ObjectId (ref: User),
  resolution: String,
  resolvedAt: Date
}
```

---

### 23. Booking

**File**: `/backend/src/models/Booking.js`

**Purpose**: Appointment/bookings system

**Schema**:
```javascript
{
  user: ObjectId (ref: User, required),
  service: String,
  date: Date (required),
  time: String (required),
  duration: Number (default: 60), // minutes
  status: String (enum: 'pending', 'confirmed', 'completed', 'cancelled'),
  notes: String,
  location: String,
  meetingLink: String,
  reminderSent: Boolean (default: false)
}
```

---

## Advanced Features Models

### 24. Matching

**File**: `/backend/src/models/Matching.js`

**Purpose**: User matching system (for community features)

**Schema**:
```javascript
{
  user: ObjectId (ref: User, required),
  targetUser: ObjectId (ref: User, required),
  score: Number,
  status: String (enum: 'pending', 'accepted', 'rejected', 'blocked'),
  type: String (enum: 'professional', 'social', 'mentorship')
}
```

---

### 25. MatchingInteraction

**File**: `/backend/src/models/MatchingInteraction.js`

**Purpose**: Interactions between matched users

**Schema**:
```javascript
{
  matching: ObjectId (ref: Matching),
  fromUser: ObjectId (ref: User),
  toUser: ObjectId (ref: User),
  type: String (enum: 'message', 'meeting_request', 'profile_view'),
  content: String,
  status: String (enum: 'sent', 'delivered', 'read')
}
```

---

### 26. MatchingPreference

**File**: `/backend/src/models/MatchingPreference.js`

**Purpose**: User matching preferences

**Schema**:
```javascript
{
  user: ObjectId (ref: User, required),
  interests: [String],
  skills: [String],
  lookingFor: String,
  industry: String,
  experienceLevel: String,
  location: String,
  remoteOk: Boolean
}
```

---

### 27. Notification

**File**: `/backend/src/models/Notification.js`

**Purpose**: User notifications

**Schema**:
```javascript
{
  user: ObjectId (ref: User, required),
  type: String (enum: 'email', 'system', 'alert'),
  title: String (required),
  message: String (required),
  actionUrl: String,
  isRead: Boolean (default: false),
  readAt: Date,
  priority: String (enum: 'low', 'normal', 'high')
}
```

**Indexes**:
- `{ user: 1, isRead: 1, createdAt: -1 }`

---

## Diagnostic Models

### 28. DiagnosticFlow

**File**: `/backend/src/models/DiagnosticFlow.js`

**Purpose**: Diagnostic flows for troubleshooting

**Schema**:
```javascript
{
  name: String (required),
  description: String,
  category: String,
  steps: [{
    order: Number,
    question: String,
    options: [{ label: String, value: String, nextStep: Number }],
    action: String,
    result: String
  }],
  isActive: Boolean (default: true)
}
```

---

### 29. CategoryRequest

**File**: `/backend/src/models/CategoryRequest.js`

**Purpose**: User-submitted category requests

**Schema**:
```javascript
{
  user: ObjectId (ref: User),
  name: String (required),
  description: String,
  reason: String,
  status: String (enum: 'pending', 'approved', 'rejected'),
  reviewedBy: ObjectId (ref: User),
  reviewedAt: Date,
  notes: String
}
```

---

## Analytics Model

### 30. Analytics

**File**: `/backend/src/models/Analytics.js`

**Purpose**: Analytics data storage

**Schema**:
```javascript
{
  date: Date (required),
  metric: String (required),
  value: Mixed (required),
  dimensions: Mixed,
  source: String
}
```

**Indexes**:
- `{ date: -1, metric: 1 }`

---

## Transaction Model

### 31. Transaction

**File**: `/backend/src/models/Transaction.js`

**Purpose**: Financial transactions

**Schema**:
```javascript
{
  user: ObjectId (ref: User),
  type: String (enum: 'payment', 'refund', 'invoice'),
  amount: Number (required),
  currency: String (default: 'USD'),
  status: String (enum: 'pending', 'completed', 'failed', 'refunded'),
  description: String,
  metadata: Mixed,
  relatedEntity: String,
  relatedId: ObjectId
}
```

**Indexes**:
- `{ user: 1, createdAt: -1 }`
- `{ status: 1, createdAt: -1 }`

---

## Database Indexes Summary

### Critical Indexes (Performance)

**Email**:
- `{ user: 1, folder: 1, date: -1 }` - Folder listing
- `{ user: 1, isRead: 1 }` - Unread count
- `{ messageId: 1 }` - Duplicate detection
- `{ subject: 'text', textBody: 'text' }` - Full-text search

**User**:
- `{ email: 1 }` - Unique login
- `{ isActive: 1 }` - Active users

**Interaction**:
- `{ user: 1, type: -1, createdAt: -1 }` - User history

**Lead**:
- `{ status: 1, createdAt: -1 }` - Lead pipeline

---

## Database Relationships

### One-to-Many

- User → Emails
- User → UserEmails
- User → Leads
- User → Conversations
- User → Notifications
- Conversation → Messages

### Many-to-Many

- Email ↔ Labels (via email.labels array)
- Post ↔ Tags (via post.tags array)

### One-to-One

- User → Primary UserEmail (via isPrimary flag)

---

## Data Integrity

### Validation

**Schema Validation**:
- Required fields enforced
- Type checking
- Enum values validated
- Min/max values enforced
- Custom validators (email format, etc.)

**Unique Constraints**:
- User.email
- UserEmail.email
- Email.messageId
- Post.slug
- Newsletter.email

### Cascade Deletes (Soft Deletes)

**Strategy**: Soft deletes used throughout
- `isDeleted` flag instead of true deletion
- Preserves data for analytics
- Allows recovery

---

## Performance Optimization

### Indexing Strategy

1. **Single Field**: Frequently queried fields
2. **Compound**: Multi-field queries (user + folder)
3. **Text**: Full-text search (subject, body)
4. **Unique**: Prevent duplicates
5. **TTL**: Auto-expire old data (not implemented)

### Query Optimization

**Efficient Queries**:
```javascript
// Good - Uses index
Email.find({ user: userId, folder: 'INBOX' })
  .sort({ date: -1 })
  .limit(50);

// Bad - Collection scan
Email.find({ date: { $gt: Date.now() - 86400000 } });
```

**Projection**:
```javascript
// Only fetch needed fields
Email.find({ user: userId })
  .select('subject from date isRead');
```

**Population**:
```javascript
// Populate references
Email.find({ user: userId })
  .populate('labels', 'name color')
  .populate('emailAccount', 'email displayName');
```

---

## Migration Strategy

**Current State**: No migrations in place

**Recommendation**: Implement Mongoose migrations or custom migration scripts

**Migration Tools**:
- mongoose-migrate
- migrate-mongo
- Custom migration scripts

---

## Backup & Recovery

**Current**: Not documented

**Recommendations**:
1. Automated MongoDB backups (daily)
2. Point-in-time recovery
3. Backup to offsite location
4. Test restoration process

---

## Database Scaling

**Current**: Single MongoDB instance

**Scaling Path**:
1. **Vertical**: Upgrade server RAM/CPU
2. **Horizontal**: Replica set (high availability)
3. **Sharding**: Distribute data across servers
4. **Caching**: Redis for hot data

---

## Security

**Access Control**:
- Mongoose middleware enforces user ownership
- `user` field on all user-owned models
- Controllers check `req.user.id`

**Injection Prevention**:
- Mongoose sanitizes input
- No raw MongoDB queries
- Parameterized queries

**Encryption**:
- UserEmail passwords encrypted
- Sensitive data not logged

---

## Data Retention

**Policy**: Not defined

**Recommendations**:
- Define retention policies for each model
- Auto-archive old data
- Implement TTL indexes
- GDPR compliance (right to deletion)

---

## Monitoring

**Key Metrics**:
- Database connection pool usage
- Query performance (slow queries)
- Index usage statistics
- Database size growth
- Operation counts (read/write)

**Tools**:
- MongoDB Atlas (if using Atlas)
- MongoDB Profiler
- Custom monitoring

---

## Conclusion

The Ementech website data model consists of **31 MongoDB schemas** supporting a corporate website with a sophisticated email management system. The models are well-indexed, properly validated, and follow Mongoose best practices.

**Key Strengths**:
- Comprehensive email system (Email, UserEmail, Folder, Label, Contact)
- Support for multiple business features (leads, chat, CMS)
- Proper indexing strategy
- Soft delete pattern

**Next Steps**:
1. Implement migration system
2. Set up automated backups
3. Define data retention policies
4. Add database monitoring
5. Consider sharding for scale

---

**Documentation Version**: 1.0.0
**Last Updated**: 2026-01-21
