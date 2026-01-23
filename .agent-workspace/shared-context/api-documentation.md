# Ementech Website - API Documentation

**Analysis Date**: 2026-01-21
**API Version**: 1.0.0
**Base URL**: https://ementech.co.ke/api
**Protocol**: HTTPS
**Format**: JSON
**Authentication**: JWT Bearer Token

---

## API Overview

The Ementech website exposes a **RESTful API** built with Express.js, featuring 7 route groups with 50+ endpoints. The API handles email management, authentication, chat, lead capture, content management, and analytics.

### Key Features
- JWT-based authentication
- Rate limiting (per endpoint)
- CORS enabled for specific origins
- Real-time updates via Socket.IO
- Input validation
- Error handling
- Compression (gzip)

### Response Format

**Success Response**:
```json
{
  "success": true,
  "data": { ... },
  "count": 10
}
```

**Error Response**:
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error (dev only)"
}
```

---

## Authentication

### Authentication Method
**Type**: Bearer Token (JWT)

**How to Obtain**:
1. POST to `/api/auth/login` with credentials
2. Receive JWT token in response
3. Include token in Authorization header:
   ```
   Authorization: Bearer <token>
   ```

**Token Lifetime**: 7 days (configurable)

**Token Refresh**: Not implemented (re-login required)

---

## Rate Limiting

### Rate Limits by Endpoint

| Endpoint Pattern | Limit | Window |
|-----------------|-------|--------|
| General API | 100 requests | 15 minutes |
| Chat endpoints | 30 requests | 1 minute |
| Lead creation | 5 requests | 1 hour |
| Download endpoints | 10 requests | 1 minute |

### Rate Limit Headers
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642781234
```

### Rate Limit Error Response
```json
{
  "success": false,
  "message": "Too many requests, please try again later."
}
```

---

## Route Groups

1. **Health Check** (`/api/health`)
2. **Authentication** (`/api/auth/*`)
3. **Email Management** (`/api/email/*`) - 20 endpoints
4. **Chat/AI** (`/api/chat/*`)
5. **Lead Management** (`/api/leads/*`)
6. **Interactions** (`/api/interactions/*`)
7. **Content Management** (`/api/content/*`)
8. **Analytics** (`/api/analytics/*`)

---

## 1. Health Check

### GET /api/health

Check API health and uptime.

**Authentication**: None

**Request**:
```http
GET /api/health
```

**Response** (200 OK):
```json
{
  "status": "healthy",
  "timestamp": "2026-01-21T10:30:00.000Z",
  "uptime": 123456.789,
  "environment": "production"
}
```

---

## 2. Authentication Routes

Base Path: `/api/auth`

### POST /api/auth/register

Register a new user account.

**Authentication**: None

**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "company": "Example Corp",
  "phone": "+254700000000"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "isActive": true,
      "createdAt": "2026-01-21T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Validation Rules**:
- `name`: Required, 2-100 characters
- `email`: Required, valid email format, unique
- `password`: Required, 6+ characters
- `company`: Optional
- `phone`: Optional

### POST /api/auth/login

Login with email and password.

**Authentication**: None

**Request Body**:
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### GET /api/auth/me

Get current user profile.

**Authentication**: Required (JWT)

**Request**:
```http
GET /api/auth/me
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "company": "Example Corp",
    "phone": "+254700000000",
    "role": "user",
    "isActive": true,
    "createdAt": "2026-01-21T10:30:00.000Z",
    "updatedAt": "2026-01-21T10:30:00.000Z"
  }
}
```

### PUT /api/auth/profile

Update user profile.

**Authentication**: Required (JWT)

**Request Body**:
```json
{
  "name": "John Updated",
  "company": "New Company",
  "phone": "+254711111111"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Updated",
    "email": "john@example.com",
    "company": "New Company",
    "phone": "+254711111111",
    "role": "user"
  }
}
```

---

## 3. Email Management Routes

Base Path: `/api/email`

**Authentication**: Required (JWT) for all routes

**Rate Limiting**: 100 requests/15 minutes

### GET /api/email

Fetch emails from database.

**Authentication**: Required

**Query Parameters**:
- `folder` (string): Folder name (default: "INBOX")
- `limit` (number): Max emails to return (default: 50)
- `skip` (number): Number of emails to skip (default: 0)

**Request**:
```http
GET /api/email?folder=INBOX&limit=20&skip=0
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "count": 20,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "user": "507f1f77bcf86cd799439011",
      "emailAccount": "507f1f77bcf86cd799439011",
      "messageId": "message123@example.com",
      "uid": 12345,
      "folder": "INBOX",
      "threadId": "thread123",
      "from": {
        "name": "Sender Name",
        "email": "sender@example.com"
      },
      "to": [
        {
          "name": "Recipient",
          "email": "recipient@example.com"
        }
      ],
      "subject": "Email Subject",
      "textBody": "Plain text body",
      "htmlBody": "<html>HTML body</html>",
      "priority": "normal",
      "isRead": false,
      "isFlagged": false,
      "hasAttachments": true,
      "attachments": [
        {
          "filename": "document.pdf",
          "contentType": "application/pdf",
          "size": 12345,
          "contentId": "cid123"
        }
      ],
      "labels": [
        {
          "_id": "507f1f77bcf86cd799439011",
          "name": "Work",
          "color": "#1976d2"
        }
      ],
      "date": "2026-01-21T10:30:00.000Z",
      "sentDate": "2026-01-21T10:30:00.000Z",
      "inReplyTo": "previous123@example.com",
      "references": ["original123@example.com"],
      "syncStatus": "synced",
      "isDeleted": false,
      "createdAt": "2026-01-21T10:30:00.000Z",
      "updatedAt": "2026-01-21T10:30:00.000Z"
    }
  ]
}
```

### POST /api/email/sync/:folder?

Sync emails from IMAP server.

**Authentication**: Required

**URL Parameters**:
- `folder` (string, optional): Folder to sync (default: "INBOX")

**Request**:
```http
POST /api/email/sync/INBOX
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Emails synced successfully",
  "syncedCount": 15
}
```

**Real-time Event**: Emits `new_email` Socket.IO event for each new email.

### GET /api/email/search

Search emails by subject, body, or sender.

**Authentication**: Required

**Query Parameters**:
- `q` (string, required): Search query
- `folder` (string, optional): Folder to search
- `limit` (number, optional): Max results (default: 50)
- `skip` (number, optional): Number to skip (default: 0)

**Request**:
```http
GET /api/email/search?q=urgent&folder=INBOX&limit=20
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "count": 5,
  "query": "urgent",
  "data": [...]
}
```

### GET /api/email/:id

Get single email by ID.

**Authentication**: Required

**Request**:
```http
GET /api/email/507f1f77bcf86cd799439011
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": { ... }
}
```

### POST /api/email/send

Send email via SMTP.

**Authentication**: Required

**Request Body**:
```json
{
  "to": "recipient@example.com",
  "cc": "cc@example.com",
  "bcc": "bcc@example.com",
  "subject": "Test Email",
  "textBody": "Plain text content",
  "htmlBody": "<html>HTML content</html>",
  "attachments": [
    {
      "filename": "document.pdf",
      "content": "base64encodedcontent",
      "contentType": "application/pdf"
    }
  ],
  "replyTo": "replyto@example.com"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Email sent successfully",
  "data": {
    "messageId": "<messageid@example.com>",
    "email": { ... }
  }
}
```

**Real-time Event**: Emits `email_sent` Socket.IO event.

### PUT /api/email/:id/read

Mark email as read/unread.

**Authentication**: Required

**Request Body**:
```json
{
  "isRead": true
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Email marked as read",
  "data": { ... }
}
```

**Real-time Event**: Emits `email_read_status` Socket.IO event.

### PUT /api/email/mark-read

Mark multiple emails as read/unread.

**Authentication**: Required

**Request Body**:
```json
{
  "emailIds": ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"],
  "isRead": true
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "2 emails marked as read",
  "modifiedCount": 2
}
```

### PUT /api/email/:id/flag

Toggle flagged (starred) status.

**Authentication**: Required

**Request**:
```http
PUT /api/email/507f1f77bcf86cd799439011/flag
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Email flagged",
  "data": { ... }
}
```

**Real-time Event**: Emits `email_flagged` Socket.IO event.

### PUT /api/email/:id/folder

Move email to folder.

**Authentication**: Required

**Request Body**:
```json
{
  "folder": "Archive"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Email moved to Archive",
  "data": { ... }
}
```

**Real-time Event**: Emits `email_moved` Socket.IO event.

### DELETE /api/email/:id

Delete email (soft delete).

**Authentication**: Required

**Request**:
```http
DELETE /api/email/507f1f77bcf86cd799439011
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Email deleted successfully",
  "data": { ... }
}
```

**Real-time Event**: Emits `email_deleted` Socket.IO event.

### DELETE /api/email/multiple/delete

Delete multiple emails.

**Authentication**: Required

**Request Body**:
```json
{
  "emailIds": ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"]
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "2 emails deleted successfully",
  "deletedCount": 2
}
```

### GET /api/email/folders/list

Get user's email folders.

**Authentication**: Required

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "name": "INBOX",
      "displayName": "Inbox",
      "icon": "inbox",
      "color": "#1976d2",
      "unreadCount": 5,
      "totalCount": 100
    },
    {
      "name": "Sent",
      "displayName": "Sent",
      "icon": "send",
      "color": "#4caf50",
      "unreadCount": 0,
      "totalCount": 50
    }
  ]
}
```

### GET /api/email/folders/unread-count

Get unread email count for folder.

**Authentication**: Required

**Query Parameters**:
- `folder` (string, optional): Folder name (default: "INBOX")

**Response** (200 OK):
```json
{
  "success": true,
  "count": 15
}
```

### GET /api/email/labels/list

Get user's labels.

**Authentication**: Required

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Work",
      "color": "#1976d2",
      "icon": "work"
    }
  ]
}
```

### POST /api/email/labels

Create new label.

**Authentication**: Required

**Request Body**:
```json
{
  "name": "Important",
  "color": "#ff5722",
  "icon": "star"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "message": "Label created successfully",
  "data": { ... }
}
```

### PUT /api/email/:id/labels/:labelId

Add label to email.

**Authentication**: Required

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Label added to email",
  "data": { ... }
}
```

### DELETE /api/email/:id/labels/:labelId

Remove label from email.

**Authentication**: Required

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Label removed from email",
  "data": { ... }
}
```

### GET /api/email/contacts/list

Get user's contacts.

**Authentication**: Required

**Query Parameters**:
- `search` (string, optional): Search query

**Response** (200 OK):
```json
{
  "success": true,
  "count": 50,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+254700000000",
      "company": "Example Corp",
      "frequencyScore": 10,
      "isDeleted": false
    }
  ]
}
```

### POST /api/email/contacts

Create new contact.

**Authentication**: Required

**Request Body**:
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "+254711111111",
  "company": "Another Corp",
  "notes": "Important client"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "message": "Contact created successfully",
  "data": { ... }
}
```

---

## 4. Chat/AI Routes

Base Path: `/api/chat`

**Authentication**: Required (JWT)

**Rate Limiting**: 30 requests/minute

### POST /api/chat/message

Send message to AI chatbot.

**Authentication**: Required

**Request Body**:
```json
{
  "message": "Hello, I need help with your services"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "message": "Hi! I'd be happy to help you with our services. What are you looking for?",
    "conversationId": "507f1f77bcf86cd799439011",
    "timestamp": "2026-01-21T10:30:00.000Z"
  }
}
```

### POST /api/chat/feedback

Submit feedback on chatbot response.

**Authentication**: Required

**Request Body**:
```json
{
  "conversationId": "507f1f77bcf86cd799439011",
  "messageId": "507f1f77bcf86cd799439011",
  "rating": 5,
  "feedback": "Very helpful"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Feedback submitted successfully"
}
```

---

## 5. Lead Management Routes

Base Path: `/api/leads`

**Authentication**: Optional (some public endpoints)

**Rate Limiting**: 5 requests/hour

### POST /api/leads

Create new lead (public endpoint).

**Authentication**: None

**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+254700000000",
  "company": "Example Corp",
  "interest": "Software Development",
  "message": "I'm interested in your services"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "message": "Lead created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "status": "new",
    "source": "website",
    "createdAt": "2026-01-21T10:30:00.000Z"
  }
}
```

### GET /api/leads

Get all leads (admin only).

**Authentication**: Required (Admin role)

**Response** (200 OK):
```json
{
  "success": true,
  "count": 100,
  "data": [...]
}
```

### GET /api/leads/:id

Get single lead.

**Authentication**: Required (Admin or own lead)

**Response** (200 OK):
```json
{
  "success": true,
  "data": { ... }
}
```

### PUT /api/leads/:id

Update lead status.

**Authentication**: Required (Admin)

**Request Body**:
```json
{
  "status": "contacted",
  "notes": "Called on 2026-01-21"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Lead updated successfully",
  "data": { ... }
}
```

### DELETE /api/leads/:id

Delete lead.

**Authentication**: Required (Admin)

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Lead deleted successfully"
}
```

---

## 6. Interactions Routes

Base Path: `/api/interactions`

**Authentication**: Required

**Rate Limiting**: 100 requests/15 minutes

### POST /api/interactions

Track user interaction.

**Authentication**: Required

**Request Body**:
```json
{
  "type": "page_view",
  "page": "/services",
  "metadata": {
    "referrer": "https://google.com",
    "userAgent": "Mozilla/5.0..."
  }
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "message": "Interaction tracked successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "user": "507f1f77bcf86cd799439011",
    "type": "page_view",
    "page": "/services",
    "createdAt": "2026-01-21T10:30:00.000Z"
  }
}
```

### GET /api/interactions

Get user interactions.

**Authentication**: Required

**Query Parameters**:
- `type` (string, optional): Filter by type
- `limit` (number, optional): Max results
- `startDate` (date, optional): Filter start date
- `endDate` (date, optional): Filter end date

**Response** (200 OK):
```json
{
  "success": true,
  "count": 50,
  "data": [...]
}
```

### GET /api/interactions/stats

Get interaction statistics.

**Authentication**: Required (Admin)

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "totalPageViews": 1000,
    "uniqueVisitors": 500,
    "avgSessionDuration": 120,
    "topPages": [
      { "page": "/services", "views": 200 },
      { "page": "/products", "views": 150 }
    ]
  }
}
```

### DELETE /api/interactions/:id

Delete interaction.

**Authentication**: Required (Admin)

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Interaction deleted successfully"
}
```

---

## 7. Content Management Routes

Base Path: `/api/content`

**Authentication**: Required (Admin for write operations)

**Rate Limiting**: 100 requests/15 minutes

### GET /api/content/posts

Get all blog posts.

**Authentication**: None (public)

**Query Parameters**:
- `page` (number): Page number
- `limit` (number): Results per page
- `category` (string): Filter by category

**Response** (200 OK):
```json
{
  "success": true,
  "count": 20,
  "page": 1,
  "totalPages": 5,
  "data": [...]
}
```

### GET /api/content/posts/:slug

Get single post by slug.

**Authentication**: None (public)

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Blog Post Title",
    "slug": "blog-post-title",
    "content": "Full content...",
    "excerpt": "Short excerpt",
    "category": "Technology",
    "tags": ["react", "nodejs"],
    "author": {
      "name": "John Doe",
      "email": "john@example.com"
    },
    "publishedAt": "2026-01-21T10:30:00.000Z",
    "createdAt": "2026-01-21T10:30:00.000Z"
  }
}
```

### POST /api/content/posts

Create new post.

**Authentication**: Required (Admin)

**Request Body**:
```json
{
  "title": "New Post",
  "slug": "new-post",
  "content": "Full content...",
  "excerpt": "Short excerpt",
  "category": "Technology",
  "tags": ["react", "nodejs"],
  "status": "published"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "message": "Post created successfully",
  "data": { ... }
}
```

### PUT /api/content/posts/:id

Update post.

**Authentication**: Required (Admin)

**Request Body**:
```json
{
  "title": "Updated Title",
  "content": "Updated content..."
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Post updated successfully",
  "data": { ... }
}
```

### DELETE /api/content/posts/:id

Delete post.

**Authentication**: Required (Admin)

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Post deleted successfully"
}
```

### GET /api/content/faqs

Get all FAQs.

**Authentication**: None (public)

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "question": "What is EmenTech?",
      "answer": "EmenTech is a software company...",
      "category": "General",
      "order": 1
    }
  ]
}
```

---

## 8. Analytics Routes

Base Path: `/api/analytics`

**Authentication**: Required (Admin)

### GET /api/analytics/overview

Get analytics overview.

**Authentication**: Required (Admin)

**Query Parameters**:
- `period` (string): "day", "week", "month", "year"
- `startDate` (date): Start date
- `endDate` (date): End date

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "visitors": 1000,
    "pageViews": 5000,
    "leads": 50,
    "conversionRate": 5,
    "topPages": [
      { "page": "/services", "views": 1000 },
      { "page": "/products", "views": 800 }
    ],
    "trafficSources": [
      { "source": "google", "count": 600 },
      { "source": "direct", "count": 300 }
    ]
  }
}
```

### GET /api/analytics/traffic

Get traffic analytics.

**Authentication**: Required (Admin)

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "daily": [
      { "date": "2026-01-20", "visitors": 100, "pageViews": 500 },
      { "date": "2026-01-21", "visitors": 150, "pageViews": 750 }
    ]
  }
}
```

### GET /api/analytics/leads

Get lead analytics.

**Authentication**: Required (Admin)

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "total": 100,
    "byStatus": {
      "new": 50,
      "contacted": 30,
      "qualified": 15,
      "converted": 5
    },
    "bySource": {
      "website": 60,
      "referral": 25,
      "social": 15
    }
  }
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Not authorized to access this route. Please login."
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "User role 'user' is not authorized to access this route"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Route /api/invalid not found"
}
```

### 429 Too Many Requests
```json
{
  "success": false,
  "message": "Too many requests, please try again later."
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error",
  "error": "Detailed error message (development only)"
}
```

---

## Socket.IO Events

### Connection
```javascript
const socket = io('https://ementech.co.ke', {
  auth: { token: 'jwt_token_here' }
});
```

### Events from Server

**new_email**
```javascript
socket.on('new_email', (email) => {
  console.log('New email received:', email);
});
```

**email_sent**
```javascript
socket.on('email_sent', (email) => {
  console.log('Email sent:', email);
});
```

**email_read_status**
```javascript
socket.on('email_read_status', (data) => {
  console.log('Email read status changed:', data);
  // { emailId: "...", isRead: true }
});
```

**email_flagged**
```javascript
socket.on('email_flagged', (data) => {
  console.log('Email flagged:', data);
  // { emailId: "...", isFlagged: true }
});
```

**email_moved**
```javascript
socket.on('email_moved', (data) => {
  console.log('Email moved:', data);
  // { emailId: "...", folder: "Archive" }
});
```

**email_deleted**
```javascript
socket.on('email_deleted', (data) => {
  console.log('Email deleted:', data);
  // { emailId: "...", folder: "INBOX" }
});
```

### Events to Server

**send_email**
```javascript
socket.emit('send_email', {
  to: 'recipient@example.com',
  subject: 'Test',
  body: 'Message'
});
```

**mark_read**
```javascript
socket.emit('mark_read', {
  emailId: '...',
  isRead: true
});
```

---

## Testing the API

### Using cURL

**Health Check**:
```bash
curl https://ementech.co.ke/api/health
```

**Login**:
```bash
curl -X POST https://ementech.co.ke/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'
```

**Get Emails**:
```bash
curl https://ementech.co.ke/api/email \
  -H "Authorization: Bearer <token>"
```

### Using Axios

```javascript
import axios from 'axios';

const API = axios.create({
  baseURL: 'https://ementech.co.ke/api',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// Get emails
const emails = await API.get('/email');

// Send email
const result = await API.post('/email/send', {
  to: 'recipient@example.com',
  subject: 'Test',
  htmlBody: '<p>Hello</p>'
});
```

---

## API Best Practices

1. **Always use HTTPS** in production
2. **Include JWT token** in Authorization header for protected routes
3. **Handle errors gracefully** on client side
4. **Respect rate limits** to avoid being blocked
5. **Use compression** for large payloads
6. **Cache responses** where appropriate
7. **Validate input** before sending to API
8. **Use Socket.IO** for real-time features

---

## API Changes & Versioning

**Current Version**: 1.0.0

**Changelog**:
- Initial release with email, auth, chat, lead, content, analytics endpoints

**Future Plans**:
- Add pagination to all list endpoints
- Implement API versioning (/api/v2/*)
- Add OpenAPI/Swagger documentation
- Implement GraphQL endpoint

---

## Support & Contact

**API Documentation**: This file
**Base URL**: https://ementech.co.ke/api
**Support Email**: info@ementech.co.ke
**Status Page**: https://ementech.co.ke/api/health

---

**Documentation Version**: 1.0.0
**Last Updated**: 2026-01-21
