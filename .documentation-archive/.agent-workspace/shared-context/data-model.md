# EmenTech Email System - Database Schema (MongoDB)

**Project**: EMENTECH-EMAIL-001  
**Document Version**: 1.0  
**Date**: January 19, 2026  
**Status**: Complete

---

## Table of Contents

1. [Database Overview](#database-overview)
2. [Collection Schemas](#collection-schemas)
3. [Indexing Strategy](#indexing-strategy)
4. [Relationships](#relationships)
5. [Data Validation](#data-validation)
6. [Migration Scripts](#migration-scripts)

---

## Database Overview

### Database Name
`ementech_email`

### Technology
MongoDB 7.0+ with Mongoose ODM

### Design Principles
- **Email-First**: Schema optimized for email storage and retrieval
- **Searchable**: Full-text search indexes on email content
- **Scalable**: Efficient for 5 to 100+ users
- **Flexible**: Document structure accommodates diverse email formats

### Collections Overview

| Collection | Purpose | Est. Documents (5 users) | Est. Documents (100 users) |
|------------|---------|-------------------------|---------------------------|
| emails | Store email messages | 5,000 | 100,000+ |
| folders | Email folders (INBOX, Sent, etc.) | 50 | 1,000 |
| labels | User-defined labels/tags | 25 | 500 |
| contacts | Contact management | 250 | 5,000 |
| users | User accounts & preferences | 5 | 100 |
| notifications | Notification history | 500 | 10,000 |
| analytics | Usage metrics | Aggregated | Aggregated |

---

## Collection Schemas

### 1. Emails Collection

**Purpose**: Store all email messages with full headers, body, and metadata.

```typescript
import mongoose, { Schema, Document } from 'mongoose';

export interface IEmail extends Document {
  // References
  userId: mongoose.Types.ObjectId;
  folderId: mongoose.Types.ObjectId;
  labelIds?: mongoose.Types.ObjectId[];
  
  // IMAP-specific
  imapUid: number; // IMAP UID (unique per folder)
  imapMessageId: string; // Message-ID header
  imapFlags: string[]; // [\Seen, \Answered, \Flagged, \Deleted, \Draft]
  
  // Email addresses
  from: {
    name: string;
    address: string;
  };
  to: Array<{ name: string; address: string }>;
  cc?: Array<{ name: string; address: string }>;
  bcc?: Array<{ name: string; address: string }>;
  replyTo?: Array<{ name: string; address: string }>;
  
  // Subject & Body
  subject: string;
  plainTextBody?: string;
  htmlBody?: string;
  previewText: string; // First 200 chars for list view
  
  // Attachments
  attachments?: Array<{
    filename: string;
    contentType: string;
    size: number;
    cid?: string; // Content-ID for inline images
    location: string; // S3 URL or local path
  }>;
  
  // Email metadata
  headers: Map<string, string>; // Key headers (Date, Message-ID, etc.)
  inReplyTo?: string; // Message-ID being replied to
  references?: string[]; // Thread conversation
  threadId?: string; // Custom thread grouping
  
  // Status
  isRead: boolean;
  isFlagged: boolean;
  isDeleted: boolean;
  hasAttachments: boolean;
  
  // Timestamps
  sentAt: Date; // Date header
  receivedAt: Date; // When received by server
  createdAt: Date;
  updatedAt: Date;
}

const EmailSchema = new Schema<IEmail>({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true 
  },
  folderId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Folder', 
    required: true,
    index: true 
  },
  labelIds: [{ 
    type: Schema.Types.ObjectId, 
    ref: 'Label',
    index: true 
  }],
  
  // IMAP-specific
  imapUid: { 
    type: Number, 
    required: true,
    index: true 
  },
  imapMessageId: { 
    type: String, 
    required: true,
    index: true 
  },
  imapFlags: [{
    type: String,
    enum: ['\\Seen', '\\Answered', '\\Flagged', '\\Deleted', '\\Draft']
  }],
  
  // Email addresses
  from: {
    name: { type: String, required: true },
    address: { type: String, required: true }
  },
  to: [{
    name: { type: String },
    address: { type: String, required: true }
  }],
  cc: [{
    name: { type: String },
    address: { type: String, required: true }
  }],
  bcc: [{
    name: { type: String },
    address: { type: String, required: true )
  }],
  replyTo: [{
    name: { type: String },
    address: { type: String, required: true }
  }],
  
  // Subject & Body
  subject: { type: String, required: true },
  plainTextBody: String,
  htmlBody: String,
  previewText: { 
    type: String, 
    default: '',
    maxlength: 200 
  },
  
  // Attachments
  attachments: [{
    filename: { type: String, required: true },
    contentType: { type: String, required: true },
    size: { type: Number, required: true },
    cid: String,
    location: { type: String, required: true }
  }],
  
  // Email metadata
  headers: { type: Map, of: String },
  inReplyTo: String,
  references: [String],
  threadId: { type: String, index: true },
  
  // Status
  isRead: { type: Boolean, default: false, index: true },
  isFlagged: { type: Boolean, default: false, index: true },
  isDeleted: { type: Boolean, default: false, index: true },
  hasAttachments: { type: Boolean, default: false, index: true },
  
  // Timestamps
  sentAt: { type: Date, required: true, index: true },
  receivedAt: { type: Date, required: true, index: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Indexes
EmailSchema.index({ userId: 1, folderId: 1, receivedAt: -1 });
EmailSchema.index({ userId: 1, isRead: 1, receivedAt: -1 });
EmailSchema.index({ userId: 1, isDeleted: 1, receivedAt: -1 });
EmailSchema.index({ imapMessageId: 1 }, { unique: true });
EmailSchema.index({ threadId: 1 });

// Text search index
EmailSchema.index({ 
  subject: 'text', 
  plainTextBody: 'text',
  'from.name': 'text',
  'from.address': 'text'
});

// Virtual for folder name
EmailSchema.virtual('folderName', {
  ref: 'Folder',
  localField: 'folderId',
  foreignField: '_id',
  justOne: true
});

export const Email = mongoose.model<IEmail>('Email', EmailSchema);
```

---

### 2. Folders Collection

**Purpose**: Define email folders (INBOX, Sent, Drafts, etc.).

```typescript
export interface IFolder extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  type: 'system' | 'custom';
  systemType?: 'inbox' | 'sent' | 'drafts' | 'trash' | 'spam' | 'archive';
  parentId?: mongoose.Types.ObjectId;
  unreadCount: number;
  totalCount: number;
  color?: string; // For UI display
  icon?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FolderSchema = new Schema<IFolder>({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true 
  },
  name: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['system', 'custom'],
    required: true 
  },
  systemType: { 
    type: String,
    enum: ['inbox', 'sent', 'drafts', 'trash', 'spam', 'archive']
  },
  parentId: {
    type: Schema.Types.ObjectId,
    ref: 'Folder'
  },
  unreadCount: { type: Number, default: 0 },
  totalCount: { type: Number, default: 0 },
  color: String,
  icon: String,
  sortOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true, index: true }
}, {
  timestamps: true
});

FolderSchema.index({ userId: 1, type: 1, sortOrder: 1 });
FolderSchema.index({ userId: 1, parentId: 1 });

export const Folder = mongoose.model<IFolder>('Folder', FolderSchema);
```

---

### 3. Labels Collection

**Purpose**: User-defined labels/tags for categorizing emails.

```typescript
export interface ILabel extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  color: string;
  icon?: string;
  emailCount: number;
  unreadCount: number;
  isVisible: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const LabelSchema = new Schema<ILabel>({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true 
  },
  name: { type: String, required: true },
  color: { type: String, required: }, // Hex color code
  icon: String,
  emailCount: { type: Number, default: 0 },
  unreadCount: { type: Number, default: 0 },
  isVisible: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 }
}, {
  timestamps: true
});

LabelSchema.index({ userId: 1, sortOrder: 1 });

export const Label = mongoose.model<ILabel>('Label', LabelSchema);
```

---

### 4. Contacts Collection

**Purpose**: Contact management with CRM integration.

```typescript
export interface IContact extends Document {
  userId: mongoose.Types.ObjectId;
  
  // Basic info
  firstName?: string;
  lastName?: string;
  email: string;
  emailLower: string; // For case-insensitive search
  phone?: string;
  company?: string;
  
  // Address
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  
  // Additional info
  notes?: string;
  tags?: string[];
  avatar?: string; // URL to avatar image
  
  // CRM fields
  lastContactDate?: Date;
  contactCount: number; // Number of emails exchanged
  isFavorite: boolean;
  isBlocked: boolean;
  
  // Source tracking
  source: 'manual' | 'inbox' | 'sent' | 'crm_import';
  sourceEmailId?: mongoose.Types.ObjectId;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const ContactSchema = new Schema<IContact>({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true 
  },
  firstName: String,
  lastName: String,
  email: { type: String, required: true },
  emailLower: { 
    type: String, 
    required: true,
    index: true 
  },
  phone: String,
  company: String,
  
  address: {
    street: String,
    city: String,
    state: String,
    postalCode: String,
    country: String
  },
  
  notes: String,
  tags: [String],
  avatar: String,
  
  // CRM fields
  lastContactDate: Date,
  contactCount: { type: Number, default: 0 },
  isFavorite: { type: Boolean, default: false },
  isBlocked: { type: Boolean, default: false },
  
  // Source
  source: { 
    type: String,
    enum: ['manual', 'inbox', 'sent', 'crm_import'],
    required: true 
  },
  sourceEmailId: {
    type: Schema.Types.ObjectId,
    ref: 'Email'
  }
}, {
  timestamps: true
});

ContactSchema.index({ userId: 1, emailLower: 1 }, { unique: true });
ContactSchema.index({ userId: 1, lastName: 1, firstName: 1 });
ContactSchema.index({ userId: 1, company: 1 });

// Virtual for full name
ContactSchema.virtual('fullName').get(function() {
  if (this.firstName && this.lastName) {
    return `${this.firstName} ${this.lastName}`;
  }
  return this.firstName || this.lastName || this.email;
});

export const Contact = mongoose.model<IContact>('Contact', ContactSchema);
```

---

### 5. Users Collection

**Purpose**: User accounts and preferences.

```typescript
export interface IUser extends Document {
  email: string;
  emailLower: string;
  passwordHash: string;
  
  // Profile
  firstName?: string;
  lastName?: string;
  displayName?: string;
  avatar?: string;
  
  // Email account info
  imapUsername: string; // For IMAP connection
  imapPassword: string; // Encrypted
  smtpUsername: string;
  smtpPassword: string;
  
  // Preferences
  preferences: {
    theme: 'light' | 'dark' | 'system';
    emailsPerPage: number;
    signature?: string;
    defaultCc?: string[];
    defaultBcc?: string[];
    autoSaveDrafts: boolean;
    markAsReadOnView: boolean;
    showPreview: boolean;
    notificationEnabled: boolean;
    soundEnabled: boolean;
    desktopNotifications: boolean;
    language: string;
    timezone: string;
  };
  
  // Email signature
  signatures?: Array<{
    id: string;
    name: string;
    content: string;
    isDefault: boolean;
  }>;
  
  // Role
  role: 'user' | 'admin';
  isActive: boolean;
  
  // Timestamps
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true },
  emailLower: { 
    type: String, 
    required: true,
    unique: true,
    index: true 
  },
  passwordHash: { type: String, required: true },
  
  // Profile
  firstName: String,
  lastName: String,
  displayName: String,
  avatar: String,
  
  // Email account
  imapUsername: { type: String, required: true },
  imapPassword: { type: String, required: true }, // Store encrypted
  smtpUsername: { type: String, required: true },
  smtpPassword: { type: String, required: true }, // Store encrypted
  
  // Preferences
  preferences: {
    theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
    emailsPerPage: { type: Number, default: 25 },
    signature: String,
    defaultCc: [String],
    defaultBcc: [String],
    autoSaveDrafts: { type: Boolean, default: true },
    markAsReadOnView: { type: Boolean, default: true },
    showPreview: { type: Boolean, default: true },
    notificationEnabled: { type: Boolean, default: true },
    soundEnabled: { type: Boolean, default: false },
    desktopNotifications: { type: Boolean, default: true },
    language: { type: String, default: 'en' },
    timezone: { type: String, default: 'Africa/Nairobi' }
  },
  
  // Signatures
  signatures: [{
    id: { type: String, required: true },
    name: { type: String, required: true },
    content: { type: String, required: true },
    isDefault: { type: Boolean, default: false }
  }],
  
  // Role
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  isActive: { type: Boolean, default: true, index: true },
  
  // Timestamps
  lastLoginAt: Date
}, {
  timestamps: true
});

export const User = mongoose.model<IUser>('User', UserSchema);
```

---

### 6. Notifications Collection

**Purpose**: Track notification history for analytics.

```typescript
export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'email_new' | 'email_sent' | 'email_error' | 'system';
  title: string;
  message: string;
  emailId?: mongoose.Types.ObjectId;
  
  // Delivery
  channel: 'desktop' | 'mobile' | 'email' | 'sms';
  deliveryStatus: 'pending' | 'sent' | 'delivered' | 'failed';
  sentAt?: Date;
  readAt?: Date;
  
  // Metadata
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true 
  },
  type: { 
    type: String,
    enum: ['email_new', 'email_sent', 'email_error', 'system'],
    required: true 
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  emailId: {
    type: Schema.Types.ObjectId,
    ref: 'Email'
  },
  
  // Delivery
  channel: {
    type: String,
    enum: ['desktop', 'mobile', 'email', 'sms'],
    required: true 
  },
  deliveryStatus: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'failed'],
    default: 'pending'
  },
  sentAt: Date,
  readAt: Date
}, {
  timestamps: true
});

NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ deliveryStatus: 1 });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
```

---

### 7. Analytics Collection

**Purpose**: Aggregated usage metrics.

```typescript
export interface IAnalytics extends Document {
  userId: mongoose.Types.ObjectId;
  period: 'daily' | 'weekly' | 'monthly';
  date: Date;
  
  // Email metrics
  emailsReceived: number;
  emailsSent: number;
  emailsDeleted: number;
  unreadCount: number;
  
  // Usage metrics
  loginCount: number;
  lastLoginAt: Date;
  
  // Storage metrics
  storageUsed: number; // Bytes
  attachmentCount: number;
  
  createdAt: Date;
}

const AnalyticsSchema = new Schema<IAnalytics>({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true 
  },
  period: { 
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    required: true 
  },
  date: { type: Date, required: true, index: true },
  
  // Email metrics
  emailsReceived: { type: Number, default: 0 },
  emailsSent: { type: Number, default: 0 },
  emailsDeleted: { type: Number, default: 0 },
  unreadCount: { type: Number, default: 0 },
  
  // Usage
  loginCount: { type: Number, default: 0 },
  lastLoginAt: Date,
  
  // Storage
  storageUsed: { type: Number, default: 0 },
  attachmentCount: { type: Number, default: 0 }
}, {
  timestamps: true
});

AnalyticsSchema.index({ userId: 1, period: 1, date: -1 });

export const Analytics = mongoose.model<IAnalytics>('Analytics', AnalyticsSchema);
```

---

## Indexing Strategy

### Critical Indexes

```javascript
// Emails - Most queried collection
db.emails.createIndex({ userId: 1, folderId: 1, receivedAt: -1 });
db.emails.createIndex({ userId: 1, isRead: 1, receivedAt: -1 });
db.emails.createIndex({ userId: 1, isDeleted: 1, receivedAt: -1 });
db.emails.createIndex({ imapMessageId: 1 }, { unique: true });
db.emails.createIndex({ threadId: 1 });
db.emails.createIndex({ subject: 'text', plainTextBody: 'text' }); // Full-text search

// Contacts - Fast lookups
db.contacts.createIndex({ userId: 1, emailLower: 1 }, { unique: true });
db.contacts.createIndex({ userId: 1, lastName: 1, firstName: 1 });

// Users - Authentication
db.users.createIndex({ emailLower: 1 }, { unique: true });
db.users.createIndex({ isActive: 1 });

// Folders - Navigation
db.folders.createIndex({ userId: 1, type: 1, sortOrder: 1 });

// Labels - Tagging
db.labels.createIndex({ userId: 1, sortOrder: 1 });

// Notifications - Recent history
db.notifications.createIndex({ userId: 1, createdAt: -1 });

// Analytics - Reporting
db.analytics.createIndex({ userId: 1, period: 1, date: -1 });
```

---

## Relationships

```
User (1) ----< (N) Email
User (1) ----< (N) Folder
User (1) ----< (N) Label
User (1) ----< (N) Contact
User (1) ----< (N) Notification
User (1) ----< (N) Analytics

Folder (1) ----< (N) Email
Label (1) ----< (N) Email

Contact (N) ----< (N) Email (via email addresses)

Notification (1) ----< (1) Email (optional)
```

---

## Migration Scripts

### Initial Setup

```javascript
// migrations/001_initial_setup.js
const mongoose = require('mongoose');

async function setupDatabase() {
  await mongoose.connect('mongodb://localhost:27017/ementech_email');
  
  // Create indexes
  await mongoose.connection.db.collection('emails').createIndex({ userId: 1, folderId: 1, receivedAt: -1 });
  await mongoose.connection.db.collection('emails').createIndex({ imapMessageId: 1 }, { unique: true });
  
  console.log('Database setup complete!');
  await mongoose.disconnect();
}

setupDatabase().catch(console.error);
```

### Seed System Folders

```javascript
// migrations/002_seed_system_folders.js
const mongoose = require('mongoose');
const User = require('../models/User.model');
const Folder = require('../models/Folder.model');

async function seedFolders() {
  await mongoose.connect('mongodb://localhost:27017/ementech_email');
  
  const users = await User.find();
  
  for (const user of users) {
    const folders = [
      { userId: user._id, name: 'Inbox', type: 'system', systemType: 'inbox', sortOrder: 1 },
      { userId: user._id, name: 'Sent', type: 'system', systemType: 'sent', sortOrder: 2 },
      { userId: user._id, name: 'Drafts', type: 'system', systemType: 'drafts', sortOrder: 3 },
      { userId: user._id, name: 'Trash', type: 'system', systemType: 'trash', sortOrder: 4 },
      { userId: user._id, name: 'Spam', type: 'system', systemType: 'spam', sortOrder: 5 },
      { userId: user._id, name: 'Archive', type: 'system', systemType: 'archive', sortOrder: 6 }
    ];
    
    await Folder.insertMany(folders);
  }
  
  console.log('System folders seeded!');
  await mongoose.disconnect();
}

seedFolders().catch(console.error);
```

---

**End of Data Model Document**
