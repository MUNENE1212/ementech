# API Reference

**Base URL:**
- Development: `http://localhost:5001/api`
- Production: `https://ementech.co.ke/api`

**Authentication:** JWT Bearer token in Authorization header

---

## Authentication Endpoints

### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "role": "employee",
  "department": "engineering"
}
```

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@ementech.co.ke",
  "password": "Admin2026!"
}

Response:
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": { ... }
  }
}
```

### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

### Update Profile
```http
PUT /api/auth/profile
Authorization: Bearer <token>
Content-Type: application/json
```

---

## Email Endpoints

### List Emails
```http
GET /api/email?folder=INBOX&limit=20&page=1
Authorization: Bearer <token>
```

### Get Single Email
```http
GET /api/email/:emailId
Authorization: Bearer <token>
```

### Sync Emails from IMAP
```http
POST /api/email/sync/:folder
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "synced": 15,
    "failed": 0
  }
}
```

### Send Email
```http
POST /api/email/send
Authorization: Bearer <token>
Content-Type: application/json

{
  "to": ["recipient@example.com"],
  "cc": ["cc@example.com"],
  "subject": "Test Email",
  "text": "Plain text body",
  "html": "<p>HTML body</p>",
  "attachments": [...]
}
```

### Mark Read/Unread
```http
PUT /api/email/:emailId/read
Authorization: Bearer <token>
Content-Type: application/json

{ "read": true }
```

### Toggle Flag
```http
PUT /api/email/:emailId/flag
Authorization: Bearer <token>
```

### Move to Folder
```http
PUT /api/email/:emailId/folder
Authorization: Bearer <token>
Content-Type: application/json

{ "folder": "Archive" }
```

### Delete Email
```http
DELETE /api/email/:emailId
Authorization: Bearer <token>
```

### Search Emails
```http
GET /api/email/search?q=keyword&folder=INBOX
Authorization: Bearer <token>
```

### Get Folders
```http
GET /api/email/folders
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": [
    { "_id": "INBOX", "name": "Inbox", "unreadCount": 5 },
    { "_id": "Sent", "name": "Sent", "unreadCount": 0 }
  ]
}
```

### Get Labels
```http
GET /api/email/labels
Authorization: Bearer <token>
```

### Create Label
```http
POST /api/email/labels
Authorization: Bearer <token>
Content-Type: application/json

{ "name": "Important", "color": "#ff0000" }
```

### Get Contacts
```http
GET /api/email/contacts
Authorization: Bearer <token>
```

---

## Lead Endpoints

### Create Lead (Public)
```http
POST /api/leads
Content-Type: application/json

{
  "email": "lead@example.com",
  "name": "John Doe",
  "company": "Example Inc",
  "source": "newsletter"
}
```

### List Leads (Admin)
```http
GET /api/leads?page=1&limit=20
Authorization: Bearer <token>
```

### Get Lead Statistics
```http
GET /api/leads/statistics
Authorization: Bearer <token>
```

### Get Qualified Leads
```http
GET /api/leads/qualified
Authorization: Bearer <token>
```

### Update Lead
```http
PUT /api/leads/:leadId
Authorization: Bearer <token>
```

### Convert to Opportunity
```http
POST /api/leads/:leadId/convert
Authorization: Bearer <token>
```

### Add Note
```http
POST /api/leads/:leadId/notes
Authorization: Bearer <token>
Content-Type: application/json

{ "note": "Called client, interested" }
```

### Unsubscribe
```http
POST /api/leads/:id/unsubscribe
```

---

## Analytics Endpoints

### Dashboard Analytics
```http
GET /api/analytics/dashboard
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "visitors": 1234,
    "leads": 56,
    "conversions": 12,
    "topPages": [...]
  }
}
```

### Conversion Funnel
```http
GET /api/analytics/funnel
Authorization: Bearer <token>
```

### Traffic Sources
```http
GET /api/analytics/sources
Authorization: Bearer <token>
```

### Track Event
```http
POST /api/analytics/track
Content-Type: application/json

{
  "event": "page_view",
  "page": "/products",
  "referrer": "google.com"
}
```

---

## Health Check

```http
GET /api/health

Response:
{
  "status": "healthy",
  "timestamp": "2026-01-25T10:30:00.000Z",
  "uptime": 123456,
  "environment": "production"
}
```

---

## Error Responses

All endpoints return consistent error format:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 429 | Too Many Requests |
| 500 | Server Error |

---

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| API (general) | 100 req/15min |
| Lead creation | 5 req/min |
| Chat | 20 req/min |
| Downloads | 10 req/min |
