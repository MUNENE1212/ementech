# EmenTech Email System - Complete Guide

**Last Updated:** January 21, 2026
**System Version:** 1.0.0
**Status:** Production Ready
**Email Domain:** @ementech.co.ke

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Database Models](#database-models)
4. [Email Account Setup](#email-account-setup)
5. [IMAP Configuration](#imap-configuration)
6. [SMTP Configuration](#smtp-configuration)
7. [Real-Time Email Monitoring](#real-time-email-monitoring)
8. [Email Sending](#email-sending)
9. [Email Receiving](#email-receiving)
10. [Email Management](#email-management)
11. [Socket.IO Integration](#socket-io-integration)
12. [API Reference](#api-reference)
13. [Configuration](#configuration)
14. [Troubleshooting](#troubleshooting)

---

## System Overview

The EmenTech Email System is a comprehensive email management solution that enables users to send and receive personalized emails through their @ementech.co.ke email accounts. The system features real-time email synchronization, folder management, labels, contacts, and secure credential storage.

### Key Features

- **Personalized Email Accounts**: Each user can have their own @ementech.co.ke email address
- **IMAP Email Receiving**: Real-time email monitoring using IMAP IDLE or polling
- **SMTP Email Sending**: Send emails through authenticated SMTP servers
- **Real-Time Notifications**: Socket.IO for instant email notifications
- **Email Synchronization**: Automatic sync of emails from server to database
- **Folder Management**: Inbox, Sent, Drafts, Trash, Spam, Important, Archive
- **Labels & Organization**: Custom labels for email categorization
- **Contact Management**: Auto-save contacts from email communications
- **Search & Filter**: Full-text search across emails
- **Encryption**: Encrypted storage of email credentials

---

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     EmenTech Email System                    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐      ┌──────────────┐    ┌─────────────┐ │
│  │   Frontend   │──────│  API Routes  │────│   Socket.IO │ │
│  │              │      │              │    │             │ │
│  └──────────────┘      └──────────────┘    └─────────────┘ │
│                                │                            │
│                                ▼                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Email Controller                         │  │
│  │  - Send emails         - Sync emails                  │  │
│  │  - Fetch emails        - Search emails                │  │
│  │  - Manage folders      - Manage labels                │  │
│  └──────────────────────────────────────────────────────┘  │
│           │                    │               │            │
│           ▼                    ▼               ▼            │
│  ┌──────────────┐    ┌───────────────┐  ┌─────────────┐   │
│  │   IMAP       │    │    SMTP       │  │  MongoDB    │   │
│  │   Watcher    │    │  Transporter  │  │  Database   │   │
│  │              │    │               │  │             │   │
│  │ - IDLE Mode  │    │ - Send email  │  │ - Emails    │   │
│  │ - Polling    │    │ - Queue       │  │ - Folders   │   │
│  │ - Sync       │    │ - Delivery    │  │ - Labels    │   │
│  └──────────────┘    └───────────────┘  │ - Contacts  │   │
│         │                                  │ - UserEmails│  │
│         └──────────────────────────────────┴─────────────┘  │
│                        │                                    │
│                        ▼                                    │
│         ┌────────────────────────────────┐                  │
│         │   mail.ementech.co.ke          │                  │
│         │   (IMAP:993, SMTP:587)         │                  │
│         └────────────────────────────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

**Backend**:
- Express.js (REST API)
- Socket.IO (Real-time communication)
- node-imap (IMAP client)
- nodemailer (SMTP client)
- mailparser (Email parsing)
- MongoDB + Mongoose (Database)

**Security**:
- AES-256-CBC encryption for email credentials
- JWT-based authentication
- TLS/SSL for IMAP and SMTP connections

---

## Database Models

### 1. User Model

**File**: `/backend/src/models/User.js`

Stores user authentication and profile information.

```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  role: String (enum: ['admin', 'manager', 'employee']),
  department: String,
  isActive: Boolean
}
```

---

### 2. UserEmail Model

**File**: `/backend/src/models/UserEmail.js`

Stores user's email account configurations with encrypted credentials.

```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: User),
  email: String (required),
  displayName: String,
  accountType: String (enum: ['personal', 'work', 'other']),
  isPrimary: Boolean,
  isActive: Boolean,

  // IMAP Configuration (Encrypted)
  imap: {
    host: String (required),
    port: Number (default: 993),
    tls: Boolean (default: true),
    username: String (required),
    password: String (encrypted, required)
  },

  // SMTP Configuration (Encrypted)
  smtp: {
    host: String (required),
    port: Number (default: 587),
    secure: Boolean (default: false),
    username: String (required),
    password: String (encrypted, required)
  },

  // Sync Status
  lastSyncedAt: Date,
  syncStatus: String (enum: ['idle', 'syncing', 'success', 'error']),
  syncError: String,
  autoSync: Boolean (default: true),
  syncInterval: Number (default: 5 minutes),

  // Signature & Reply
  signature: String,
  fromName: String,
  replyTo: String,

  // Verification
  isVerified: Boolean,
  verificationToken: String,
  verifiedAt: Date,
  isDeleted: Boolean
}
```

**Key Methods**:
- `encrypt(text)` - Encrypt sensitive data
- `decrypt(encryptedText)` - Decrypt sensitive data
- `setImapPassword(password)` - Set encrypted IMAP password
- `setSmtpPassword(password)` - Set encrypted SMTP password
- `testConnection()` - Test IMAP connection

**Static Methods**:
- `getPrimaryEmail(userId)` - Get user's primary email account
- `getActiveEmails(userId)` - Get all active email accounts

**Encryption Details**:
- Algorithm: AES-256-CBC
- Key: Derived from JWT_SECRET using scrypt
- IV: Random 16 bytes per encryption

---

### 3. Email Model

**File**: `/backend/src/models/Email.js`

Stores synchronized email metadata and content.

```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: User),
  emailAccount: ObjectId (ref: UserEmail),
  messageId: String (required, unique per account),
  uid: Number (IMAP UID),
  folder: String (enum: ['INBOX', 'Sent', 'Drafts', 'Trash', 'Spam', 'Important', 'Archive']),
  threadId: String,

  // Sender & Recipients
  from: {
    name: String,
    email: String (required)
  },
  to: [{ name: String, email: String }],
  cc: [{ name: String, email: String }],
  bcc: [{ name: String, email: String }],
  replyTo: [{ name: String, email: String }],

  // Content
  subject: String,
  textBody: String,
  htmlBody: String,
  priority: String (enum: ['high', 'normal', 'low']),

  // Status
  isRead: Boolean (default: false),
  isFlagged: Boolean (default: false),
  hasAttachments: Boolean,
  attachments: [{
    filename: String,
    contentType: String,
    size: Number,
    contentId: String,
    cid: String
  }],

  // Organization
  labels: [ObjectId (ref: Label)],

  // Dates
  date: Date (required),
  sentDate: Date,
  inReplyTo: String,
  references: [String],

  // Sync Status
  syncStatus: String,
  lastSyncedAt: Date,

  // Soft Delete
  isDeleted: Boolean,
  deletedAt: Date
}
```

**Key Methods**:
- `markAsRead()` - Mark email as read
- `toggleFlag()` - Toggle starred status
- `moveToFolder(newFolder)` - Move to different folder
- `softDelete()` - Soft delete email

**Static Methods**:
- `getUnreadCount(userId, folder)` - Get unread email count
- `searchEmails(userId, query, options)` - Full-text search

**Indexes**:
- Compound: `{ user: 1, folder: 1, date: -1 }`
- Compound: `{ user: 1, isRead: 1 }`
- Text: `{ subject: 'text', textBody: 'text' }`

---

### 4. Folder Model

**File**: `/backend/src/models/Folder.js`

User-defined and system email folders.

```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: User),
  name: String (enum: ['INBOX', 'Sent', 'Drafts', 'Trash', 'Spam', 'Important', 'Archive', 'Custom']),
  customName: String,
  icon: String,
  color: String,
  parentFolder: ObjectId (ref: Folder),
  order: Number,
  unreadCount: Number (cached),
  totalCount: Number (cached),
  isSystem: Boolean,
  isVisible: Boolean,
  isDeleted: Boolean
}
```

**System Folders**:
- INBOX (Inbox) - Blue
- Sent - Green
- Drafts - Orange
- Important - Yellow
- Spam - Red
- Trash - Gray
- Archive - Blue Gray

**Static Methods**:
- `getUserFolders(userId)` - Get user's folders
- `getSystemFolders()` - Get system folder definitions

---

### 5. Label Model

**File**: `/backend/src/models/Label.js`

User-defined labels for email categorization.

```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: User),
  name: String (required),
  color: String (default: '#1976d2'),
  icon: String,
  order: Number,
  isVisible: Boolean,
  isDeleted: Boolean
}
```

**Default Labels**:
- Work (Blue)
- Personal (Green)
- Travel (Yellow)
- Finance (Purple)

---

### 6. Contact Model

**File**: `/backend/src/models/Contact.js`

Email contacts for quick access and auto-complete.

```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: User),
  name: String (required),
  email: String (required, unique per user),
  phone: String,
  avatar: String,
  company: String,
  notes: String,
  frequencyScore: Number (default: 0),
  lastContactedAt: Date,
  isFavorite: Boolean,
  isBlocked: Boolean,
  isDeleted: Boolean
}
```

**Key Methods**:
- `incrementFrequency()` - Increment contact usage score
- `toggleFavorite()` - Toggle favorite status

**Static Methods**:
- `searchContacts(userId, query)` - Search contacts
- `getFrequentContacts(userId, limit)` - Get most used contacts
- `getFavoriteContacts(userId)` - Get favorite contacts

---

## Email Account Setup

### Adding an Email Account to User

**Step 1: Obtain User's JWT Token**

First, authenticate the user to get their JWT token.

**Step 2: Create UserEmail Document**

Use MongoDB or API to create email account configuration.

```bash
curl -X POST https://ementech.co.ke/api/user-emails \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@ementech.co.ke",
    "displayName": "EmenTech Admin",
    "accountType": "work",
    "isPrimary": true,
    "imap": {
      "host": "mail.ementech.co.ke",
      "port": 993,
      "tls": true,
      "username": "admin@ementech.co.ke",
      "password": "Admin2026!"
    },
    "smtp": {
      "host": "mail.ementech.co.ke",
      "port": 587,
      "secure": false,
      "username": "admin@ementech.co.ke",
      "password": "Admin2026!"
    },
    "signature": "Best regards,\nEmenTech Team",
    "fromName": "EmenTech",
    "replyTo": "admin@ementech.co.ke"
  }'
```

**Note**: Passwords are automatically encrypted before storage.

**Step 3: Verify Email Account**

Test the IMAP connection to ensure credentials are correct.

```bash
curl -X POST https://ementech.co.ke/api/user-emails/EMAIL_ID/test \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## IMAP Configuration

### IMAP Connection Settings

**Server**: mail.ementech.co.ke
**Port**: 993
**Security**: TLS/SSL
**Authentication**: Username and Password

### Connection Code

**File**: `/backend/src/controllers/emailController.js`

```javascript
const createImapConnection = (emailAccount) => {
  return new Imap({
    host: emailAccount.imap.host,        // 'mail.ementech.co.ke'
    port: emailAccount.imap.port,        // 993
    tls: emailAccount.imap.tls,          // true
    user: emailAccount.imap.username,    // 'admin@ementech.co.ke'
    password: emailAccount.decrypt(emailAccount.imap.password),
    tlsOptions: { rejectUnauthorized: false }
  });
};
```

### IMAP Folders

The system monitors the following IMAP folders:

- **INBOX** - Incoming emails
- **Sent** - Sent emails
- **Drafts** - Draft emails
- **Trash** - Deleted emails
- **Spam** - Spam emails
- **Important** - Important emails
- **Archive** - Archived emails

### IMAP IDLE Support

The system attempts to use IMAP IDLE for real-time push notifications. If IDLE is not supported by the server, it falls back to polling every 30 seconds.

---

## SMTP Configuration

### SMTP Connection Settings

**Server**: mail.ementech.co.ke
**Port**: 587
**Security**: STARTTLS
**Authentication**: Username and Password

### SMTP Transporter Code

**File**: `/backend/src/controllers/emailController.js`

```javascript
const transporter = nodemailer.createTransport({
  host: emailAccount.smtp.host,          // 'mail.ementech.co.ke'
  port: emailAccount.smtp.port,          // 587
  secure: emailAccount.smtp.secure,      // false (STARTTLS)
  auth: {
    user: emailAccount.smtp.username,    // 'admin@ementech.co.ke'
    pass: emailAccount.decrypt(emailAccount.smtp.password)
  }
});
```

### Sending Email Example

```javascript
const mailOptions = {
  from: `"${emailAccount.displayName || emailAccount.email}" <${emailAccount.email}>`,
  to: 'recipient@example.com',
  subject: 'Test Email',
  html: '<h1>Hello World</h1>',
  text: 'Hello World'
};

const info = await transporter.sendMail(mailOptions);
```

---

## Real-Time Email Monitoring

### IMAP Watcher Service

**File**: `/backend/src/services/imapWatcher.js`

The IMAP Watcher is a singleton service that monitors email accounts in real-time.

### Features

1. **IMAP IDLE Mode**: Real-time push notifications when supported
2. **Polling Fallback**: 30-second polling when IDLE is unavailable
3. **Automatic Reconnection**: Reconnects on connection loss
4. **Multi-User Support**: Monitors all active users
5. **Socket.IO Integration**: Instant push notifications to clients

### Starting the Watcher

The watcher starts automatically when the backend server starts:

```javascript
// File: /backend/src/server.js
await startAllWatchers();
```

### Watching a User's Email

```javascript
import { imapWatcher } from './services/imapWatcher.js';

// Start watching
await imapWatcher.startWatching(userId);

// Stop watching
await imapWatcher.stopWatching(userId);

// Stop all watchers
await imapWatcher.stopAll();
```

### Monitoring Process

1. **Fetch Active Users**: Get all users with `isActive: true`
2. **Get Primary Email**: Get each user's primary email account
3. **Test IMAP IDLE**: Check if server supports IMAP IDLE
4. **Start IDLE or Polling**:
   - If IDLE supported: Use IDLE for real-time push
   - If IDLE not supported: Poll every 30 seconds
5. **Fetch New Emails**: When new email detected, fetch and parse
6. **Save to Database**: Store email in MongoDB
7. **Push to Client**: Send real-time notification via Socket.IO

---

## Email Sending

### Send Email Flow

```
Client Request → API Validation → Get User's Email Account →
Create SMTP Transporter → Send Email → Save to Database →
Notify Client via Socket.IO
```

### API Endpoint

**Endpoint**: `POST /api/email/send`
**Authentication**: Required

### Request Body

```json
{
  "to": "recipient@example.com",
  "cc": "cc@example.com",
  "bcc": "bcc@example.com",
  "subject": "Test Email Subject",
  "textBody": "Plain text body",
  "htmlBody": "<h1>HTML Body</h1>",
  "attachments": [
    {
      "filename": "document.pdf",
      "content": "base64_encoded_content",
      "contentType": "application/pdf"
    }
  ],
  "replyTo": "replies@ementech.co.ke"
}
```

### Response

```json
{
  "success": true,
  "message": "Email sent successfully",
  "data": {
    "messageId": "<unique-id@ementech.co.ke>",
    "email": {
      "_id": "...",
      "folder": "Sent",
      "subject": "Test Email Subject",
      ...
    }
  }
}
```

### Features

- **Multiple Recipients**: To, CC, BCC support
- **HTML & Text**: Supports both HTML and plain text
- **Attachments**: File attachment support
- **Reply-To**: Custom reply-to address
- **Signature**: Automatic signature insertion
- **Contact Update**: Automatically creates/updates contacts

---

## Email Receiving

### Email Sync Process

1. **IMAP Connection**: Connect to mail.ementech.co.ke
2. **Open Folder**: Open INBOX folder
3. **Fetch Emails**: Fetch recent emails (last 50)
4. **Parse Emails**: Parse email content using mailparser
5. **Check Duplicates**: Check if email already exists in database
6. **Save New Emails**: Save new emails to MongoDB
7. **Update Contacts**: Create/update contacts from senders
8. **Notify Client**: Send real-time notification via Socket.IO

### Manual Sync

**Endpoint**: `POST /api/email/sync/:folder?`
**Authentication**: Required

```bash
curl -X POST https://ementech.co.ke/api/email/sync/INBOX \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Response

```json
{
  "success": true,
  "message": "Emails synced successfully",
  "syncedCount": 5
}
```

### Auto Sync

Email accounts can be configured to auto-sync at regular intervals (default: 5 minutes).

```javascript
{
  autoSync: true,
  syncInterval: 5  // minutes
}
```

---

## Email Management

### Fetch Emails

**Endpoint**: `GET /api/email`
**Authentication**: Required

**Query Parameters**:
- `folder` - Folder name (default: 'INBOX')
- `limit` - Number of emails (default: 50)
- `skip` - Number of emails to skip (default: 0)

```bash
curl -X GET "https://ementech.co.ke/api/email?folder=INBOX&limit=20&skip=0" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get Single Email

**Endpoint**: `GET /api/email/:id`
**Authentication**: Required

```bash
curl -X GET "https://ementech.co.ke/api/email/EMAIL_ID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Mark as Read/Unread

**Endpoint**: `PUT /api/email/:id/read`
**Authentication**: Required

**Request Body**:
```json
{
  "isRead": true
}
```

### Mark Multiple as Read

**Endpoint**: `PUT /api/email/mark-read`
**Authentication**: Required

**Request Body**:
```json
{
  "emailIds": ["id1", "id2", "id3"],
  "isRead": true
}
```

### Toggle Flag

**Endpoint**: `PUT /api/email/:id/flag`
**Authentication**: Required

### Move to Folder

**Endpoint**: `PUT /api/email/:id/folder`
**Authentication**: Required

**Request Body**:
```json
{
  "folder": "Archive"
}
```

### Delete Email

**Endpoint**: `DELETE /api/email/:id`
**Authentication**: Required

**Note**: This performs a soft delete (moves to Trash folder)

### Delete Multiple Emails

**Endpoint**: `DELETE /api/email/multiple/delete`
**Authentication**: Required

**Request Body**:
```json
{
  "emailIds": ["id1", "id2", "id3"]
}
```

### Search Emails

**Endpoint**: `GET /api/email/search`
**Authentication**: Required

**Query Parameters**:
- `q` - Search query (required)
- `folder` - Folder to search (optional)
- `limit` - Results limit (default: 50)
- `skip` - Results to skip (default: 0)

```bash
curl -X GET "https://ementech.co.ke/api/email/search?q=project&folder=INBOX&limit=20" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Search Fields**:
- Subject
- Text body
- From email
- From name

---

## Socket.IO Integration

### Socket.IO Events

**File**: `/backend/src/config/socket.js`

### Connection

**Client-Side**:
```javascript
import { io } from 'socket.io-client';

const socket = io('https://ementech.co.ke', {
  auth: {
    token: 'YOUR_JWT_TOKEN'
  }
});

socket.on('connect', () => {
  console.log('Connected to email server');
});
```

**Server-Side**:
```javascript
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.user.email}`);
  socket.join(`user:${socket.userId}`);
});
```

### Real-Time Events

#### New Email

**Event**: `new_email`

**Server Emits**:
```javascript
sendNewEmail(userId, email);
```

**Client Receives**:
```javascript
socket.on('new_email', (email) => {
  console.log('New email received:', email);
  // Update UI, show notification, etc.
});
```

#### Email Sent

**Event**: `email_sent`

**Server Emits**:
```javascript
sendEmailSent(userId, email);
```

**Client Receives**:
```javascript
socket.on('email_sent', (email) => {
  console.log('Email sent:', email);
});
```

#### Email Read Status

**Event**: `email_read_status`

**Server Emits**:
```javascript
sendEmailReadStatus(userId, { emailId, isRead });
```

#### Email Flagged

**Event**: `email_flagged`

**Server Emits**:
```javascript
sendEmailFlagged(userId, { emailId, isFlagged });
```

#### Email Moved

**Event**: `email_moved`

**Server Emits**:
```javascript
sendEmailMoved(userId, { emailId, folder });
```

#### Email Deleted

**Event**: `email_deleted`

**Server Emits**:
```javascript
sendEmailDeleted(userId, { emailId });
```

### Client-Side Events

#### Send Email

**Client Emits**:
```javascript
socket.emit('send_email', {
  to: 'recipient@example.com',
  subject: 'Test',
  htmlBody: '<p>Hello</p>'
});
```

#### Mark as Read

**Client Emits**:
```javascript
socket.emit('mark_read', {
  emailId: 'EMAIL_ID',
  isRead: true
});
```

---

## API Reference

### Authentication

All email endpoints require authentication via JWT token.

**Header**:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

### Email Endpoints

#### Fetch Emails
- **Method**: GET
- **Path**: `/api/email`
- **Query**: `folder`, `limit`, `skip`
- **Response**: Array of emails

#### Sync Emails
- **Method**: POST
- **Path**: `/api/email/sync/:folder?`
- **Response**: Sync result with count

#### Get Single Email
- **Method**: GET
- **Path**: `/api/email/:id`
- **Response**: Single email object

#### Send Email
- **Method**: POST
- **Path**: `/api/email/send`
- **Body**: Email details
- **Response**: Sent email with messageId

#### Mark as Read
- **Method**: PUT
- **Path**: `/api/email/:id/read`
- **Body**: `{ isRead: boolean }`
- **Response**: Updated email

#### Mark Multiple as Read
- **Method**: PUT
- **Path**: `/api/email/mark-read`
- **Body**: `{ emailIds: [], isRead: boolean }`
- **Response**: Modified count

#### Toggle Flag
- **Method**: PUT
- **Path**: `/api/email/:id/flag`
- **Response**: Updated email

#### Move to Folder
- **Method**: PUT
- **Path**: `/api/email/:id/folder`
- **Body**: `{ folder: string }`
- **Response**: Updated email

#### Delete Email
- **Method**: DELETE
- **Path**: `/api/email/:id`
- **Response**: Deleted email

#### Delete Multiple Emails
- **Method**: DELETE
- **Path**: `/api/email/multiple/delete`
- **Body**: `{ emailIds: [] }`
- **Response**: Deleted count

#### Search Emails
- **Method**: GET
- **Path**: `/api/email/search`
- **Query**: `q`, `folder`, `limit`, `skip`
- **Response**: Array of matching emails

### Folder Endpoints

#### Get Folders
- **Method**: GET
- **Path**: `/api/email/folders/list`
- **Response**: Array of folders with counts

#### Get Unread Count
- **Method**: GET
- **Path**: `/api/email/folders/unread-count`
- **Query**: `folder`
- **Response**: `{ count: number }`

### Label Endpoints

#### Get Labels
- **Method**: GET
- **Path**: `/api/email/labels/list`
- **Response**: Array of labels

#### Create Label
- **Method**: POST
- **Path**: `/api/email/labels`
- **Body**: `{ name, color, icon }`
- **Response**: Created label

#### Add Label to Email
- **Method**: PUT
- **Path**: `/api/email/:id/labels/:labelId`
- **Response**: Updated email

#### Remove Label from Email
- **Method**: DELETE
- **Path**: `/api/email/:id/labels/:labelId`
- **Response**: Updated email

### Contact Endpoints

#### Get Contacts
- **Method**: GET
- **Path**: `/api/email/contacts/list`
- **Query**: `search`
- **Response**: Array of contacts

#### Create Contact
- **Method**: POST
- **Path**: `/api/email/contacts`
- **Body**: `{ name, email, phone, company, notes }`
- **Response**: Created contact

---

## Configuration

### Environment Variables

**File**: `/backend/.env`

```env
# Email Configuration (SMTP)
SMTP_HOST=mail.ementech.co.ke
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=admin@ementech.co.ke
SMTP_PASS=Admin2026!

# IMAP Configuration
IMAP_HOST=mail.ementech.co.ke
IMAP_PORT=993
IMAP_USER=admin@ementech.co.ke
IMAP_PASS=Admin2026!

# Email Server Configuration
EMAIL_DOMAIN=ementech.co.ke
EMAIL_FROM=noreply@ementech.co.ke
EMAIL_FROM_NAME=EmenTech

# JWT Secret (Used for encryption)
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d

# Database
MONGODB_URI=mongodb+srv://...

# CORS
CORS_ORIGIN=https://ementech.co.ke
```

### Email Account Configuration

When adding a new @ementech.co.ke email account, use these settings:

**IMAP Settings**:
- Host: mail.ementech.co.ke
- Port: 993
- TLS: true
- Username: [full email address]
- Password: [email password]

**SMTP Settings**:
- Host: mail.ementech.co.ke
- Port: 587
- Secure: false (STARTTLS)
- Username: [full email address]
- Password: [email password]

---

## Troubleshooting

### Common Issues

#### 1. IMAP Connection Failed

**Symptoms**:
- Error: "IMAP connection error"
- Emails not syncing

**Solutions**:
- Verify IMAP credentials are correct
- Check mail.ementech.co.ke is accessible
- Verify port 993 is not blocked by firewall
- Check network connectivity

#### 2. SMTP Sending Failed

**Symptoms**:
- Error: "Failed to send email"
- Emails not being sent

**Solutions**:
- Verify SMTP credentials are correct
- Check SMTP port 587 is not blocked
- Verify email account is active
- Check recipient email address is valid

#### 3. Real-Time Notifications Not Working

**Symptoms**:
- New emails not appearing in real-time
- Socket.IO connection issues

**Solutions**:
- Check Socket.IO is initialized on backend
- Verify client is connected to Socket.IO
- Check JWT token is valid
- Check firewall is not blocking WebSocket connections

#### 4. Emails Not Syncing

**Symptoms**:
- Sync returns 0 emails
- Old emails not appearing

**Solutions**:
- Manually trigger sync via API
- Check IMAP watcher is running
- Verify email account is set as primary
- Check sync status in UserEmail document

#### 5. Encryption/Decryption Errors

**Symptoms**:
- Error decrypting email credentials
- Password mismatch errors

**Solutions**:
- Verify JWT_SECRET is consistent
- Re-save email credentials
- Check encryption key derivation

### Debug Mode

Enable detailed logging by setting:

```env
NODE_ENV=development
```

This will log:
- IMAP connection status
- SMTP send attempts
- Socket.IO events
- Email sync progress
- Encryption/decryption operations

### Testing Email Connectivity

#### Test IMAP Connection

```bash
# Using openssl
openssl s_client -connect mail.ementech.co.ke:993

# Using telnet (if TLS not required)
telnet mail.ementech.co.ke 993
```

#### Test SMTP Connection

```bash
# Using openssl
openssl s_client -connect mail.ementech.co.ke:587
STARTTLS
```

#### Test Email Account via API

```bash
# Test IMAP connection
curl -X POST https://ementech.co.ke/api/user-emails/EMAIL_ID/test \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Security Best Practices

### Credential Storage

- All email passwords are encrypted using AES-256-CBC
- Encryption key derived from JWT_SECRET
- IV is unique per encryption
- Decryption only happens in memory

### Connection Security

- IMAP uses TLS/SSL (port 993)
- SMTP uses STARTTLS (port 587)
- `rejectUnauthorized: false` for self-signed certs

### Access Control

- All endpoints require JWT authentication
- Users can only access their own emails
- Email accounts are tied to specific users
- Socket.IO authentication required

### Recommendations

1. **Strong Passwords**: Use strong passwords for email accounts
2. **Regular Rotation**: Rotate email passwords regularly
3. **Limit Access**: Only give email access to users who need it
4. **Monitor Logs**: Regularly check email sync logs
5. **Backup**: Regularly backup email database
6. **HTTPS**: Always use HTTPS in production
7. **Firewall**: Configure firewall to allow only necessary ports

---

## Performance Optimization

### Database Indexes

Ensure these indexes are created:

```javascript
// Email collection
db.emails.createIndex({ user: 1, folder: 1, date: -1 });
db.emails.createIndex({ user: 1, isRead: 1 });
db.emails.createIndex({ subject: 'text', textBody: 'text' });

// UserEmail collection
db.useremails.createIndex({ user: 1, email: 1 }, { unique: true });
db.useremails.createIndex({ user: 1, isPrimary: 1 });

// Contact collection
db.contacts.createIndex({ user: 1, email: 1 }, { unique: true });
```

### Sync Optimization

- Limit sync to last 50 emails per folder
- Use IMAP UID to avoid re-fetching
- Cache folder counts
- Use compound indexes for queries

### Real-Time Optimization

- Use IMAP IDLE when available (saves resources)
- Polling fallback: 30-second interval
- Batch Socket.IO notifications
- Use room-based broadcasting

---

## Future Enhancements

1. **Email Threading**: Group emails by conversation
2. **Snooze Emails**: Temporarily hide emails
3. **Email Templates**: Predefined email templates
4. **Scheduled Sending**: Send emails at scheduled times
5. **Undo Send**: Recall sent emails within time limit
6. **Email Filters**: Automatic filtering rules
7. **Attachment Preview**: Preview attachments without downloading
8. **Rich Text Editor**: Enhanced compose editor
9. **Email Import**: Import emails from other providers
10. **Multiple Identities**: Send from different email addresses

---

**Document Version**: 1.0
**Last Updated**: January 21, 2026
**Maintained By**: EmenTech Development Team
