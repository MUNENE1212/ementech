# EmenTech Email System - User Guide
## Complete Business Email Operations Manual

---

## Table of Contents
1. [System Overview](#system-overview)
2. [Email Account Setup](#email-account-setup)
3. [API Usage Guide](#api-usage-guide)
4. [Business Operations Workflows](#business-operations-workflows)
5. [Real-Time Email Monitoring](#real-time-email-monitoring)
6. [Frontend Integration](#frontend-integration)
7. [Troubleshooting](#troubleshooting)

---

## System Overview

The EmenTech Email System provides a complete email management solution with:
- **Real-time email monitoring** via IMAP IDLE or polling
- **Email sending** via SMTP
- **WebSocket notifications** for instant email delivery
- **Multiple email account support** per user
- **Folder management** (Inbox, Sent, Drafts, Trash, Spam, Archive)
- **Label management** for organization
- **Thread support** for email conversations
- **Attachment handling**

### Architecture
```
Client (React) → API (Express) → Email Controller → IMAP/SMTP Services
                                    ↓
                            Socket.IO (Real-time)
                                    ↓
                            MongoDB (Email Storage)
```

---

## Email Account Setup

### Step 1: Create a User Account

First, create a user account via the authentication API:

```bash
POST https://ementech.co.ke/api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@ementech.co.ke",
  "password": "securePassword123",
  "phone": "+254700000000"
}
```

### Step 2: Add Email Account Configuration

Once registered, add your email account credentials:

```bash
POST https://ementech.co.ke/api/email/accounts
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "name": "Business Email",
  "email": "admin@ementech.co.ke",
  "imap": {
    "host": "mail.ementech.co.ke",
    "port": 993,
    "tls": true,
    "username": "admin@ementech.co.ke",
    "password": "your-email-password"
  },
  "smtp": {
    "host": "mail.ementech.co.ke",
    "port": 587,
    "secure": false,
    "username": "admin@ementech.co.ke",
    "password": "your-email-password"
  },
  "isPrimary": true
}
```

**Important:** The password is encrypted before storage in the database.

### Step 3: Verify Email Account

Check that your email account is configured correctly:

```bash
GET https://ementech.co.ke/api/email/accounts
Authorization: Bearer <your-jwt-token>
```

Expected response:
```json
{
  "success": true,
  "accounts": [
    {
      "_id": "account_id",
      "name": "Business Email",
      "email": "admin@ementech.co.ke",
      "imap": {
        "host": "mail.ementech.co.ke",
        "port": 993
      },
      "isPrimary": true,
      "isActive": true
    }
  ]
}
```

---

## API Usage Guide

### Authentication

All email API endpoints require JWT authentication:

```bash
# Login to get token
POST https://ementech.co.ke/api/auth/login
Content-Type: application/json

{
  "email": "john@ementech.co.ke",
  "password": "securePassword123"
}

# Response
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}

# Use token in subsequent requests
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Fetch Emails

#### List Emails from Folder

```bash
GET https://ementech.co.ke/api/email/folders/INBOX?page=1&limit=20
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Emails per page (default: 20, max: 100)
- `search` - Search query (optional)

**Response:**
```json
{
  "success": true,
  "emails": [
    {
      "_id": "email_id",
      "messageId": "<message-id@ementech.co.ke>",
      "uid": 12345,
      "folder": "INBOX",
      "from": {
        "name": "Sender Name",
        "email": "sender@example.com"
      },
      "to": [
        {
          "name": "Recipient",
          "email": "admin@ementech.co.ke"
        }
      ],
      "subject": "Business Inquiry",
      "textBody": "Email content...",
      "htmlBody": "<html>...</html>",
      "date": "2026-01-21T10:30:00.000Z",
      "sentDate": "2026-01-21T10:30:00.000Z",
      "hasAttachments": true,
      "attachments": [
        {
          "filename": "document.pdf",
          "contentType": "application/pdf",
          "size": 123456
        }
      ],
      "read": false,
      "starred": false,
      "labels": ["business", "important"]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

#### Get Single Email

```bash
GET https://ementech.co.ke/api/email/<email_id>
Authorization: Bearer <token>
```

### Send Email

#### Compose and Send New Email

```bash
POST https://ementech.co.ke/api/email/send
Authorization: Bearer <token>
Content-Type: application/json

{
  "to": [
    {
      "email": "client@example.com",
      "name": "Client Name"
    }
  ],
  "cc": [
    {
      "email": "manager@ementech.co.ke",
      "name": "Manager"
    }
  ],
  "subject": "Business Proposal",
  "textBody": "Dear Client,\n\nPlease find attached our proposal.\n\nBest regards",
  "htmlBody": "<p>Dear Client,</p><p>Please find attached our proposal.</p><p>Best regards</p>",
  "attachments": [
    {
      "filename": "proposal.pdf",
      "contentType": "application/pdf",
      "content": "base64-encoded-content"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email sent successfully",
  "email": {
    "_id": "new_email_id",
    "folder": "Sent",
    "subject": "Business Proposal",
    "date": "2026-01-21T10:35:00.000Z"
  }
}
```

### Reply to Email

```bash
POST https://ementech.co.ke/api/email/<email_id>/reply
Authorization: Bearer <token>
Content-Type: application/json

{
  "textBody": "Thank you for your inquiry. We'll respond shortly.",
  "htmlBody": "<p>Thank you for your inquiry. We'll respond shortly.</p>",
  "cc": [
    {
      "email": "team@ementech.co.ke"
    }
  ]
}
```

### Forward Email

```bash
POST https://ementech.co.ke/api/email/<email_id>/forward
Authorization: Bearer <token>
Content-Type: application/json

{
  "to": [
    {
      "email": "recipient@example.com"
    }
  ],
  "textBody": "Please see the forwarded message below.",
  "htmlBody": "<p>Please see the forwarded message below.</p>"
}
```

### Folder Operations

#### List Folders

```bash
GET https://ementech.co.ke/api/email/folders/list
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "folders": [
    { "name": "INBOX", "count": 12, "unread": 3 },
    { "name": "Sent", "count": 45, "unread": 0 },
    { "name": "Drafts", "count": 2, "unread": 0 },
    { "name": "Trash", "count": 8, "unread": 0 },
    { "name": "Spam", "count": 15, "unread": 5 },
    { "name": "Archive", "count": 120, "unread": 0 }
  ]
}
```

#### Move Email to Folder

```bash
PUT https://ementech.co.ke/api/email/<email_id>/move
Authorization: Bearer <token>
Content-Type: application/json

{
  "folder": "Archive"
}
```

### Label Operations

#### Create Label

```bash
POST https://ementech.co.ke/api/email/labels
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "business",
  "color": "#ff5722"
}
```

#### Add Label to Email

```bash
PUT https://ementech.co.ke/api/email/<email_id>/labels
Authorization: Bearer <token>
Content-Type: application/json

{
  "labels": ["business", "important"]
}
```

#### Remove Label from Email

```bash
DELETE https://ementech.co.ke/api/email/<email_id>/labels/business
Authorization: Bearer <token>
```

### Email Actions

#### Mark as Read/Unread

```bash
PUT https://ementech.co.ke/api/email/<email_id>/read
Authorization: Bearer <token>
Content-Type: application/json

{
  "read": true
}
```

#### Star/Unstar Email

```bash
PUT https://ementech.co.ke/api/email/<email_id>/star
Authorization: Bearer <token>
Content-Type: application/json

{
  "starred": true
}
```

#### Delete Email

```bash
DELETE https://ementech.co.ke/api/email/<email_id>
Authorization: Bearer <token>
```

**Note:** This moves the email to Trash. To permanently delete:

```bash
DELETE https://ementech.co.ke/api/email/<email_id>?permanent=true
Authorization: Bearer <token>
```

### Sync Email

#### Manual Sync

```bash
POST https://ementech.co.ke/api/email/sync
Authorization: Bearer <token>
Content-Type: application/json

{
  "folder": "INBOX"
}
```

#### Full Email Sync

```bash
POST https://ementech.co.ke/api/email/sync/full
Authorization: Bearer <token>
```

---

## Business Operations Workflows

### Workflow 1: Handling Customer Inquiries

**Use Case:** Process incoming customer inquiries and respond professionally.

```bash
# Step 1: Fetch unread emails from INBOX
GET /api/email/folders/INBOX?search=unread

# Step 2: Read the email
GET /api/email/{email_id}

# Step 3: Add label for tracking
PUT /api/email/{email_id}/labels
{
  "labels": ["customer-inquiry", "pending-response"]
}

# Step 4: Mark as read
PUT /api/email/{email_id}/read
{
  "read": true
}

# Step 5: Send response
POST /api/email/{email_id}/reply
{
  "textBody": "Thank you for your inquiry. We have received your request and will respond within 24 hours.",
  "htmlBody": "<p>Thank you for your inquiry. We have received your request and will respond within 24 hours.</p>"
}

# Step 6: Update label
PUT /api/email/{email_id}/labels
{
  "labels": ["customer-inquiry", "responded"]
}

# Step 7: Archive the conversation
PUT /api/email/{email_id}/move
{
  "folder": "Archive"
}
```

### Workflow 2: Sending Business Proposals

**Use Case:** Send business proposals with attachments to potential clients.

```bash
# Step 1: Compose email with proposal
POST /api/email/send
{
  "to": [
    {
      "email": "client@company.com",
      "name": "Client Decision Maker"
    }
  ],
  "cc": [
    {
      "email": "manager@ementech.co.ke",
      "name": "Sales Manager"
    }
  ],
  "subject": "Business Proposal - EmenTech Solutions",
  "textBody": "Dear Client,\n\nPlease find attached our comprehensive proposal for your review.\n\nWe look forward to discussing this opportunity further.\n\nBest regards,\nJohn Doe\nEmenTech",
  "htmlBody": "<p>Dear Client,</p><p>Please find attached our comprehensive proposal for your review.</p><p>We look forward to discussing this opportunity further.</p><p>Best regards,<br>John Doe<br>EmenTech</p>",
  "attachments": [
    {
      "filename": "ementech-proposal.pdf",
      "contentType": "application/pdf",
      "content": "<base64-encoded-pdf-content>"
    },
    {
      "filename": "pricing-sheet.xlsx",
      "contentType": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "content": "<base64-encoded-excel-content>"
    }
  ]
}

# Step 2: Add label for tracking
PUT /api/email/{sent_email_id}/labels
{
  "labels": ["proposal-sent", "follow-up-required"]
}
```

### Workflow 3: Team Collaboration

**Use Case:** Forward emails to team members for collaboration.

```bash
# Step 1: Fetch email
GET /api/email/{email_id}

# Step 2: Forward to team
POST /api/email/{email_id}/forward
{
  "to": [
    {
      "email": "technical@ementech.co.ke",
      "name": "Technical Team"
    },
    {
      "email": "sales@ementech.co.ke",
      "name": "Sales Team"
    }
  ],
  "textBody": "Please review this customer inquiry and provide your input.",
  "htmlBody": "<p>Please review this customer inquiry and provide your input.</p>"
}

# Step 3: Label original email
PUT /api/email/{email_id}/labels
{
  "labels": ["escalated-to-team"]
}
```

### Workflow 4: Email Follow-ups

**Use Case:** Track and follow up on important emails.

```bash
# Step 1: Find emails requiring follow-up
GET /api/email/folders/INBOX?search=follow-up

# Step 2: Star important emails
PUT /api/email/{email_id}/star
{
  "starred": true
}

# Step 3: Add reminder label
PUT /api/email/{email_id}/labels
{
  "labels": ["follow-up", "high-priority"]
}

# Step 4: Send follow-up email
POST /api/email/{email_id}/reply
{
  "textBody": "Following up on our previous conversation. Do you have any updates?",
  "htmlBody": "<p>Following up on our previous conversation. Do you have any updates?</p>"
}
```

---

## Real-Time Email Monitoring

### How It Works

The email system uses **IMAP IDLE** for real-time push notifications:

1. **IMAP Watcher Service** monitors your email accounts
2. When a new email arrives, it's immediately detected
3. Email is fetched and stored in MongoDB
4. **Socket.IO** pushes the email to connected clients
5. Frontend receives email instantly without page refresh

### Fallback Polling

If IMAP IDLE is not supported by your email server, the system automatically falls back to **polling every 30 seconds**.

### Socket.IO Integration

#### Connect to WebSocket

```javascript
import { io } from 'socket.io-client';

const socket = io('https://ementech.co.ke', {
  auth: {
    token: 'your-jwt-token'
  },
  transports: ['websocket']
});

// Listen for new emails
socket.on('new_email', (email) => {
  console.log('New email received:', email.subject);
  // Update UI, show notification, etc.
});

// Listen for email updates
socket.on('email_updated', (email) => {
  console.log('Email updated:', email._id);
  // Refresh email in UI
});

// Listen for connection status
socket.on('connect', () => {
  console.log('Connected to email service');
});

socket.on('disconnect', () => {
  console.log('Disconnected from email service');
});
```

### Real-Time Events

| Event | Description | Payload |
|-------|-------------|---------|
| `new_email` | New email received | Full email object |
| `email_updated` | Email status changed | Updated email object |
| `email_deleted` | Email was deleted | `{ emailId: string }` |
| `email_moved` | Email moved to folder | `{ emailId: string, folder: string }` |
| `labels_changed` | Email labels updated | `{ emailId: string, labels: string[] }` |

---

## Frontend Integration

### React Example: Email Inbox Component

```jsx
import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';

const EmailInbox = () => {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);

  // Fetch initial emails
  useEffect(() => {
    const fetchEmails = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(
          'https://ementech.co.ke/api/email/folders/INBOX',
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        setEmails(response.data.emails);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching emails:', error);
      }
    };

    fetchEmails();
  }, []);

  // Setup Socket.IO for real-time updates
  useEffect(() => {
    const token = localStorage.getItem('token');
    const socketConnection = io('https://ementech.co.ke', {
      auth: { token },
      transports: ['websocket']
    });

    socketConnection.on('new_email', (newEmail) => {
      // Add new email to the top of the list
      setEmails(prevEmails => [newEmail, ...prevEmails]);

      // Show browser notification
      if (Notification.permission === 'granted') {
        new Notification('New Email', {
          body: `From: ${newEmail.from.name}\nSubject: ${newEmail.subject}`,
          icon: '/email-icon.png'
        });
      }
    });

    socketConnection.on('email_updated', (updatedEmail) => {
      // Update email in list
      setEmails(prevEmails =>
        prevEmails.map(email =>
          email._id === updatedEmail._id ? updatedEmail : email
        )
      );
    });

    setSocket(socketConnection);

    return () => {
      socketConnection.disconnect();
    };
  }, []);

  const markAsRead = async (emailId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `https://ementech.co.ke/api/email/${emailId}/read`,
        { read: true },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Update local state
      setEmails(prevEmails =>
        prevEmails.map(email =>
          email._id === emailId ? { ...email, read: true } : email
        )
      );
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  if (loading) return <div>Loading emails...</div>;

  return (
    <div className="email-inbox">
      <h2>Inbox</h2>
      <ul>
        {emails.map(email => (
          <li
            key={email._id}
            className={email.read ? 'read' : 'unread'}
            onClick={() => markAsRead(email._id)}
          >
            <div className="email-sender">
              {email.from.name || email.from.email}
            </div>
            <div className="email-subject">{email.subject}</div>
            <div className="email-date">
              {new Date(email.date).toLocaleString()}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default EmailInbox;
```

---

## Troubleshooting

### Issue 1: Emails Not Syncing

**Symptoms:** New emails not appearing in inbox

**Solutions:**
1. Check if IMAP watcher is running:
   ```bash
   ssh root@69.164.244.165
   pm2 logs ementech-backend --lines 50
   ```

2. Look for these log messages:
   - `📧 Starting IMAP watcher for {email}`
   - `✅ IDLE supported for {email}`
   - `🔔 New email detected`

3. Verify email account credentials:
   ```bash
   GET /api/email/accounts
   ```

4. Manually trigger sync:
   ```bash
   POST /api/email/sync/full
   ```

### Issue 2: Cannot Send Emails

**Symptoms:** Send email API returns error

**Solutions:**
1. Verify SMTP configuration in `.env`:
   ```bash
   SMTP_HOST=mail.ementech.co.ke
   SMTP_PORT=587
   SMTP_USER=admin@ementech.co.ke
   SMTP_PASS=your-password
   ```

2. Check email account SMTP settings:
   ```bash
   GET /api/email/accounts
   ```

3. Test SMTP connection manually via backend logs

### Issue 3: Real-Time Notifications Not Working

**Symptoms:** New emails don't appear instantly, require page refresh

**Solutions:**
1. Check Socket.IO connection:
   ```javascript
   console.log('Socket connected:', socket.connected);
   ```

2. Verify WebSocket connection in browser DevTools Network tab

3. Check backend Socket.IO logs:
   ```bash
   pm2 logs ementech-backend | grep socket
   ```

4. Ensure CORS allows WebSocket connections

### Issue 4: Authentication Errors

**Symptoms:** API returns 401 Unauthorized

**Solutions:**
1. Verify JWT token is valid:
   ```bash
   GET /api/auth/me
   Authorization: Bearer <token>
   ```

2. Check token expiration:
   ```javascript
   const decoded = jwtDecode(token);
   console.log('Token expires:', new Date(decoded.exp * 1000));
   ```

3. Refresh token if expired:
   ```bash
   POST /api/auth/refresh
   ```

### Issue 5: Email Account Connection Fails

**Symptoms:** Cannot connect to IMAP/SMTP server

**Solutions:**
1. Test network connectivity:
   ```bash
   telnet mail.ementech.co.ke 993  # IMAP
   telnet mail.ementech.co.ke 587  # SMTP
   ```

2. Verify credentials with email provider

3. Check if email provider requires:
   - App-specific passwords
   - Two-factor authentication
   - OAuth2 instead of username/password

4. Review firewall rules on VPS

---

## Monitoring and Maintenance

### Check Email System Health

```bash
# Backend health
curl https://ementech.co.ke/api/health

# IMAP watcher status
ssh root@69.164.244.165
pm2 logs ementech-backend --lines 100 | grep -E "IMAP|IDLE|email"

# Socket.IO connections
pm2 logs ementech-backend --lines 50 | grep socket
```

### View Email Statistics

```bash
# Total emails in database
ssh root@69.164.244.165
mongosh "mongodb+srv://cluster0.keatoba.mongodb.net/ementech" --username master25
use ementech
db.emails.countDocuments()

# Emails by folder
db.emails.aggregate([
  { $group: { _id: "$folder", count: { $sum: 1 } } }
])

# Recent emails
db.emails.find().sort({ date: -1 }).limit(10)
```

### Restart Email Service

```bash
# Graceful restart
ssh root@69.164.244.165
pm2 restart ementech-backend

# Full restart (including database)
pm2 restart ementech-backend && pm2 logs ementech-backend --lines 50
```

---

## Security Best Practices

1. **Always use HTTPS** for email API calls
2. **Never log email passwords** or expose them in client-side code
3. **Encrypt sensitive attachments** before storage
4. **Implement rate limiting** to prevent abuse
5. **Use JWT tokens** with short expiration times
6. **Validate and sanitize** all email content to prevent XSS
7. **Implement virus scanning** for email attachments
8. **Regular security audits** of email access logs

---

## Support and Contact

For technical support or questions:
- **Email:** support@ementech.co.ke
- **Documentation:** https://ementech.co.ke/docs
- **API Status:** https://ementech.co.ke/api/health

---

**Version:** 1.0.0
**Last Updated:** January 21, 2026
**System:** EmenTech Corporate Email System v1.0
