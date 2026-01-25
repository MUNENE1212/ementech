# Email System Documentation

**Last Updated:** January 25, 2026

## Overview

The EmenTech email system provides a full-featured email client integrated with the main website. It combines IMAP sync for incoming emails with database storage for sent/drafts/archived emails.

## Architecture

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────┐
│   IMAP Server    │────▶│  Backend     │────▶│  MongoDB    │
│  (Dovecot)      │     │  (Node.js)    │     │  (Atlas)    │
└─────────────────┘     └──────┬───────┘     └─────────────┘
                              │
                              ▼
                        ┌──────────────┐
                        │  Frontend    │
                        │  (React)     │
                        └──────────────┘
```

## Components

### Backend Controllers (`backend/src/controllers/emailController.js`)

| Function | Method | Description |
|----------|--------|-------------|
| `fetchEmails` | GET | Fetch emails from database (case-insensitive folder matching) |
| `syncEmails` | POST | Sync emails from IMAP (INBOX only) or database (other folders) |
| `getEmail` | GET | Get single email by ID |
| `sendEmail` | POST | Send email via SMTP |
| `saveDraft` | POST | Save email as draft |
| `markAsRead` | PATCH | Mark email as read/unread |
| `toggleFlag` | PATCH | Toggle star flag |
| `deleteEmail` | DELETE | Delete email |
| `getFolders` | GET | Get user folders |
| `getLabels` | GET | Get user labels |

### Frontend Components (`src/components/email/`)

| Component | Description |
|----------|-------------|
| `EmailList.jsx` | Scrollable email list with keyboard navigation |
| `EmailItem.jsx` | Single email item in list |
| `EmailReader.jsx` | Full email viewer with reply/forward actions |
| `EmailSidebar.jsx` | Navigation sidebar with folders & labels |
| `EmailToolbar.jsx` | Batch operations toolbar |
| `EmailComposer.jsx` | Email compose modal |

### Context (`src/contexts/EmailContext.jsx`)

Provides global email state and actions:
- `emails[]` - All emails
- `folders[]` - User folders
- `labels[]` - User labels
- `currentFolder` - Currently selected folder
- `selectedEmails[]` - Multi-selected emails
- `loading`, `syncing`, `error` - UI states

## Folder Data Flow

### INBOX (IMAP Synced)
1. Backend polls IMAP every 30 seconds
2. New emails fetched and saved to MongoDB
3. Socket.IO emits `new_email` event to connected clients
4. Frontend displays new emails

### SENT (Database Managed)
1. User sends email via compose form
2. Backend sends via SMTP (Postfix)
3. Email saved to MongoDB with `folder: "Sent"`
4. Frontend fetches from database (no IMAP)

### DRAFTS/ARCHIVE/TRASH (Database Managed)
1. Operations save directly to MongoDB
2. No IMAP sync involved
3. Frontend fetches from database

### STARRED (Virtual Folder)
1. Filter query: `{ isFlagged: true, isDeleted: false }`
2. Can span across actual folders

## API Endpoints

### Fetch Emails
```
GET /api/email/fetch?folder=INBOX&limit=50&skip=0
```

### Sync Emails
```
POST /api/email/sync/:folder
```

### Send Email
```
POST /api/email/send
Body: {
  to: "email@example.com",
  subject: "Subject",
  body: "Email body",
  cc: "",
  bcc: ""
}
```

### Mark as Read
```
PATCH /api/email/:id/read
Body: { read: true }
```

### Toggle Star
```
PATCH /api/email/:id/flag
```

### Delete Email
```
DELETE /api/email/:id
```

## Environment Variables

Backend `.env`:
```
MONGODB_URI=mongodb+srv://...
IMAP_HOST=mail.ementech.co.ke
IMAP_PORT=993
IMAP_USER=admin@ementech.co.ke
IMAP_PASSWORD=...
SMTP_HOST=mail.ementech.co.ke
SMTP_PORT=587
```

## Troubleshooting

### Emails not displaying
1. Check `fetchEmails` query (case-insensitive folder matching)
2. Verify MongoDB connection
3. Check browser console for errors

### Sync not working
1. Verify IMAP credentials
2. Check backend logs: `pm2 logs ementech-backend`
3. Ensure folder is supported (INBOX syncs from IMAP)

### Mobile view issues
1. Sidebar toggles with menu icon
2. Back button returns to list
3. Emails are full-width on mobile

### 500 errors
1. Check nginx config: `/etc/nginx/sites-enabled/default`
2. Verify root path matches deployment directory
3. Reload nginx: `systemctl reload nginx`
