# EmenTech Email System - API Examples

**Last Updated:** January 21, 2026
**Purpose:** Working code examples for integrating with the EmenTech email system
**Base URL:** https://ementech.co.ke

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Authentication Examples](#authentication-examples)
3. [Email Account Setup Examples](#email-account-setup-examples)
4. [Email Sending Examples](#email-sending-examples)
5. [Email Receiving Examples](#email-receiving-examples)
6. [Email Management Examples](#email-management-examples)
7. [Folder & Label Examples](#folder--label-examples)
8. [Contact Management Examples](#contact-management-examples)
9. [Socket.IO Examples](#socketio-examples)
10. [JavaScript SDK Examples](#javascript-sdk-examples)
11. [Complete Integration Example](#complete-integration-example)

---

## Quick Start

### Prerequisites

1. Valid user account with JWT token
2. Configured email account (@ementech.co.ke)
3. Backend server running
4. MongoDB database connected

### Get JWT Token

First, authenticate to get your JWT token:

```bash
curl -X POST https://ementech.co.ke/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "password": "your-password"
  }'
```

Save the returned `token` for subsequent requests.

---

## Authentication Examples

### User Registration

```bash
curl -X POST https://ementech.co.ke/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john.doe@ementech.co.ke",
    "password": "SecurePass123!",
    "role": "employee",
    "department": "engineering"
  }'
```

**Response**:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john.doe@ementech.co.ke",
    "role": "employee",
    "department": "engineering"
  }
}
```

---

### User Login

```bash
curl -X POST https://ementech.co.ke/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@ementech.co.ke",
    "password": "SecurePass123!"
  }'
```

**Response**:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john.doe@ementech.co.ke",
    "role": "employee",
    "department": "engineering"
  }
}
```

---

### Get Current User

```bash
curl -X GET https://ementech.co.ke/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response**:
```json
{
  "success": true,
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john.doe@ementech.co.ke",
    "role": "employee",
    "department": "engineering"
  }
}
```

---

### Change Password

```bash
curl -X PUT https://ementech.co.ke/api/auth/password \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "SecurePass123!",
    "newPassword": "NewSecurePass456!"
  }'
```

**Response**:
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

---

## Email Account Setup Examples

### Add Email Account to User

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

**Response**:
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "email": "admin@ementech.co.ke",
    "displayName": "EmenTech Admin",
    "accountType": "work",
    "isPrimary": true,
    "isActive": true,
    "syncStatus": "idle",
    "isVerified": false
  }
}
```

---

## Email Sending Examples

### Send Simple Text Email

```bash
curl -X POST https://ementech.co.ke/api/email/send \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "client@example.com",
    "subject": "Project Update",
    "textBody": "Dear Client,\n\nI wanted to provide you with an update on our project progress.\n\nBest regards"
  }'
```

---

### Send HTML Email

```bash
curl -X POST https://ementech.co.ke/api/email/send \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "client@example.com",
    "subject": "Welcome to EmenTech",
    "htmlBody": "<!DOCTYPE html><html><head><style>body{font-family:Arial,sans-serif;}</style></head><body><h1>Welcome!</h1><p>Thank you for joining EmenTech.</p><p>We are excited to work with you.</p><p>Best regards,<br>EmenTech Team</p></body></html>"
  }'
```

---

### Send Email with Multiple Recipients

```bash
curl -X POST https://ementech.co.ke/api/email/send \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": ["client1@example.com", "client2@example.com"],
    "cc": "manager@ementech.co.ke",
    "bcc": "admin@ementech.co.ke",
    "subject": "Meeting Tomorrow",
    "textBody": "Lets meet tomorrow at 10 AM to discuss the project."
  }'
```

---

### Send Email with Attachment

```bash
curl -X POST https://ementech.co.ke/api/email/send \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "client@example.com",
    "subject": "Project Proposal",
    "textBody": "Please find attached the project proposal.",
    "attachments": [
      {
        "filename": "proposal.pdf",
        "content": "JVBERi0xLjQKJ..." (base64 encoded content),
        "contentType": "application/pdf"
      },
      {
        "filename": "budget.xlsx",
        "content": "UEsDBBQABgAIAAAAIQ..." (base64 encoded content),
        "contentType": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      }
    ]
  }'
```

**Note**: File content must be base64 encoded.

**Encode file to base64**:
```bash
base64 -i proposal.pdf
```

---

### Send Email with Reply-To

```bash
curl -X POST https://ementech.co.ke/api/email/send \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "support@example.com",
    "subject": "Support Request",
    "textBody": "I need help with...",
    "replyTo": "projects@ementech.co.ke"
  }'
```

---

## Email Receiving Examples

### Fetch Emails from Inbox

```bash
curl -X GET "https://ementech.co.ke/api/email?folder=INBOX&limit=20&skip=0" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response**:
```json
{
  "success": true,
  "count": 20,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "folder": "INBOX",
      "from": {
        "name": "John Smith",
        "email": "john.smith@example.com"
      },
      "to": [
        {
          "email": "admin@ementech.co.ke"
        }
      ],
      "subject": "Project Inquiry",
      "textBody": "Hi, I am interested in...",
      "htmlBody": "<p>Hi, I am interested in...</p>",
      "date": "2026-01-21T10:30:00.000Z",
      "isRead": false,
      "isFlagged": false,
      "hasAttachments": false,
      "labels": []
    }
  ]
}
```

---

### Fetch Emails from Sent Folder

```bash
curl -X GET "https://ementech.co.ke/api/email?folder=Sent&limit=50" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### Get Single Email

```bash
curl -X GET https://ementech.co.ke/api/email/507f1f77bcf86cd799439013 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response**:
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "folder": "INBOX",
    "messageId": "<1234567890@example.com>",
    "uid": 12345,
    "from": {
      "name": "John Smith",
      "email": "john.smith@example.com"
    },
    "to": [
      {
        "name": "EmenTech Admin",
        "email": "admin@ementech.co.ke"
      }
    ],
    "subject": "Project Inquiry",
    "textBody": "Hi, I am interested in your services...",
    "htmlBody": "<p>Hi, I am interested in your services...</p>",
    "date": "2026-01-21T10:30:00.000Z",
    "sentDate": "2026-01-21T10:30:00.000Z",
    "isRead": false,
    "isFlagged": false,
    "hasAttachments": true,
    "attachments": [
      {
        "filename": "requirements.pdf",
        "contentType": "application/pdf",
        "size": 245678
      }
    ],
    "labels": [
      {
        "_id": "507f1f77bcf86cd799439014",
        "name": "Work",
        "color": "#1976d2"
      }
    ]
  }
}
```

---

### Manual Email Sync

```bash
curl -X POST https://ementech.co.ke/api/email/sync/INBOX \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response**:
```json
{
  "success": true,
  "message": "Emails synced successfully",
  "syncedCount": 5
}
```

---

### Sync Different Folder

```bash
curl -X POST https://ementech.co.ke/api/email/sync/Sent \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Email Management Examples

### Mark Email as Read

```bash
curl -X PUT https://ementech.co.ke/api/email/507f1f77bcf86cd799439013/read \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "isRead": true
  }'
```

---

### Mark Multiple Emails as Read

```bash
curl -X PUT https://ementech.co.ke/api/email/mark-read \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "emailIds": [
      "507f1f77bcf86cd799439013",
      "507f1f77bcf86cd799439014",
      "507f1f77bcf86cd799439015"
    ],
    "isRead": true
  }'
```

**Response**:
```json
{
  "success": true,
  "message": "3 emails marked as read",
  "modifiedCount": 3
}
```

---

### Star/Flag Email

```bash
curl -X PUT https://ementech.co.ke/api/email/507f1f77bcf86cd799439013/flag \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response**:
```json
{
  "success": true,
  "message": "Email flagged",
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "isFlagged": true
  }
}
```

---

### Move Email to Folder

```bash
curl -X PUT https://ementech.co.ke/api/email/507f1f77bcf86cd799439013/folder \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "folder": "Archive"
  }'
```

**Response**:
```json
{
  "success": true,
  "message": "Email moved to Archive",
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "folder": "Archive"
  }
}
```

---

### Delete Email

```bash
curl -X DELETE https://ementech.co.ke/api/email/507f1f77bcf86cd799439013 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response**:
```json
{
  "success": true,
  "message": "Email deleted successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "folder": "Trash",
    "isDeleted": true
  }
}
```

---

### Delete Multiple Emails

```bash
curl -X DELETE https://ementech.co.ke/api/email/multiple/delete \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "emailIds": [
      "507f1f77bcf86cd799439013",
      "507f1f77bcf86cd799439014",
      "507f1f77bcf86cd799439015"
    ]
  }'
```

**Response**:
```json
{
  "success": true,
  "message": "3 emails deleted successfully",
  "deletedCount": 3
}
```

---

### Search Emails

```bash
curl -X GET "https://ementech.co.ke/api/email/search?q=project&folder=INBOX&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response**:
```json
{
  "success": true,
  "count": 5,
  "query": "project",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "subject": "Project Update",
      "from": {
        "name": "Team Lead",
        "email": "lead@example.com"
      },
      "date": "2026-01-21T10:30:00.000Z"
    }
  ]
}
```

---

## Folder & Label Examples

### Get Folders

```bash
curl -X GET https://ementech.co.ke/api/email/folders/list \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response**:
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
      "color": "#388e3c",
      "unreadCount": 0,
      "totalCount": 50
    },
    {
      "name": "Drafts",
      "displayName": "Drafts",
      "icon": "draft",
      "color": "#f57c00",
      "unreadCount": 0,
      "totalCount": 2
    },
    {
      "name": "Important",
      "displayName": "Important",
      "icon": "star",
      "color": "#fbc02d",
      "unreadCount": 1,
      "totalCount": 10
    }
  ]
}
```

---

### Get Unread Count

```bash
curl -X GET "https://ementech.co.ke/api/email/folders/unread-count?folder=INBOX" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response**:
```json
{
  "success": true,
  "count": 5
}
```

---

### Create Label

```bash
curl -X POST https://ementech.co.ke/api/email/labels \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Important Client",
    "color": "#ff5722",
    "icon": "business"
  }'
```

**Response**:
```json
{
  "success": true,
  "message": "Label created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439020",
    "name": "Important Client",
    "color": "#ff5722",
    "icon": "business",
    "isVisible": true
  }
}
```

---

### Get Labels

```bash
curl -X GET https://ementech.co.ke/api/email/labels/list \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439020",
      "name": "Important Client",
      "color": "#ff5722",
      "icon": "business"
    },
    {
      "_id": "507f1f77bcf86cd799439021",
      "name": "Work",
      "color": "#1976d2",
      "icon": "work"
    }
  ]
}
```

---

### Add Label to Email

```bash
curl -X PUT https://ementech.co.ke/api/email/507f1f77bcf86cd799439013/labels/507f1f77bcf86cd799439020 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response**:
```json
{
  "success": true,
  "message": "Label added to email",
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "labels": [
      {
        "_id": "507f1f77bcf86cd799439020",
        "name": "Important Client",
        "color": "#ff5722"
      }
    ]
  }
}
```

---

### Remove Label from Email

```bash
curl -X DELETE https://ementech.co.ke/api/email/507f1f77bcf86cd799439013/labels/507f1f77bcf86cd799439020 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response**:
```json
{
  "success": true,
  "message": "Label removed from email",
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "labels": []
  }
}
```

---

## Contact Management Examples

### Get Contacts

```bash
curl -X GET https://ementech.co.ke/api/email/contacts/list \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response**:
```json
{
  "success": true,
  "count": 25,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439030",
      "name": "John Smith",
      "email": "john.smith@example.com",
      "phone": "+1234567890",
      "company": "Example Corp",
      "frequencyScore": 15,
      "lastContactedAt": "2026-01-21T10:30:00.000Z",
      "isFavorite": true
    }
  ]
}
```

---

### Search Contacts

```bash
curl -X GET "https://ementech.co.ke/api/email/contacts/list?search=john" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### Create Contact

```bash
curl -X POST https://ementech.co.ke/api/email/contacts \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "email": "jane.doe@example.com",
    "phone": "+0987654321",
    "company": "Acme Inc",
    "notes": "Key contact for project X"
  }'
```

**Response**:
```json
{
  "success": true,
  "message": "Contact created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439031",
    "name": "Jane Doe",
    "email": "jane.doe@example.com",
    "phone": "+0987654321",
    "company": "Acme Inc",
    "notes": "Key contact for project X",
    "frequencyScore": 0
  }
}
```

---

## Socket.IO Examples

### Client-Side Connection

```html
<!DOCTYPE html>
<html>
<head>
  <title>EmenTech Email - Real-Time</title>
  <script src="https://cdn.socket.io/4.7.5/socket.io.min.js"></script>
</head>
<body>
  <div id="status">Connecting...</div>
  <div id="emails"></div>

  <script>
    // Replace with your JWT token
    const token = 'YOUR_JWT_TOKEN_HERE';

    // Connect to Socket.IO server
    const socket = io('https://ementech.co.ke', {
      auth: { token }
    });

    // Connection status
    socket.on('connect', () => {
      console.log('Connected to Socket.IO');
      document.getElementById('status').innerText = 'Connected';
      document.getElementById('status').style.color = 'green';
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from Socket.IO');
      document.getElementById('status').innerText = 'Disconnected';
      document.getElementById('status').style.color = 'red';
    });

    socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      document.getElementById('status').innerText = 'Error: ' + error.message;
      document.getElementById('status').style.color = 'red';
    });

    // Listen for new emails
    socket.on('new_email', (email) => {
      console.log('New email received:', email);

      // Create email element
      const emailDiv = document.createElement('div');
      emailDiv.style.border = '1px solid #ccc';
      emailDiv.style.padding = '10px';
      emailDiv.style.margin = '10px 0';
      emailDiv.innerHTML = `
        <strong>From:</strong> ${email.from.name || email.from.email}<br>
        <strong>Subject:</strong> ${email.subject}<br>
        <strong>Date:</strong> ${new Date(email.date).toLocaleString()}
      `;

      // Add to emails container
      document.getElementById('emails').prepend(emailDiv);

      // Show notification
      if (Notification.permission === 'granted') {
        new Notification('New Email', {
          body: `${email.from.name || email.from.email}: ${email.subject}`,
          icon: '/logo.png'
        });
      }
    });

    // Listen for email sent
    socket.on('email_sent', (email) => {
      console.log('Email sent:', email);
      alert('Email sent successfully!');
    });

    // Listen for email read status updates
    socket.on('email_read_status', (data) => {
      console.log('Email read status updated:', data);
      // Update UI to show read/unread status
    });

    // Listen for flagged emails
    socket.on('email_flagged', (data) => {
      console.log('Email flagged:', data);
      // Update UI to show flagged status
    });

    // Listen for moved emails
    socket.on('email_moved', (data) => {
      console.log('Email moved:', data);
      // Update UI to reflect new folder
    });

    // Listen for deleted emails
    socket.on('email_deleted', (data) => {
      console.log('Email deleted:', data);
      // Remove email from UI
    });

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  </script>
</body>
</html>
```

---

### Send Email via Socket.IO

```javascript
// Send email event
socket.emit('send_email', {
  to: 'recipient@example.com',
  subject: 'Test Email',
  htmlBody: '<p>This is a test email sent via Socket.IO</p>'
});

// Listen for response
socket.on('email_sent', (data) => {
  if (data.success) {
    console.log('Email sent successfully');
  } else {
    console.error('Failed to send email:', data.message);
  }
});
```

---

### Mark as Read via Socket.IO

```javascript
// Mark email as read
socket.emit('mark_read', {
  emailId: '507f1f77bcf86cd799439013',
  isRead: true
});

// Listen for confirmation
socket.on('email_updated', (data) => {
  console.log('Email updated:', data);
});
```

---

## JavaScript SDK Examples

### Create EmailService Class

```javascript
class EmailService {
  constructor(baseUrl, token) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json',
      ...options.headers
    };

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  // Fetch emails
  async fetchEmails(folder = 'INBOX', limit = 50, skip = 0) {
    return await this.request(
      `/api/email?folder=${folder}&limit=${limit}&skip=${skip}`
    );
  }

  // Get single email
  async getEmail(emailId) {
    return await this.request(`/api/email/${emailId}`);
  }

  // Send email
  async sendEmail(data) {
    return await this.request('/api/email/send', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Mark as read
  async markAsRead(emailId, isRead = true) {
    return await this.request(`/api/email/${emailId}/read`, {
      method: 'PUT',
      body: JSON.stringify({ isRead })
    });
  }

  // Toggle flag
  async toggleFlag(emailId) {
    return await this.request(`/api/email/${emailId}/flag`, {
      method: 'PUT'
    });
  }

  // Move to folder
  async moveToFolder(emailId, folder) {
    return await this.request(`/api/email/${emailId}/folder`, {
      method: 'PUT',
      body: JSON.stringify({ folder })
    });
  }

  // Delete email
  async deleteEmail(emailId) {
    return await this.request(`/api/email/${emailId}`, {
      method: 'DELETE'
    });
  }

  // Search emails
  async searchEmails(query, folder = null, limit = 50) {
    let endpoint = `/api/email/search?q=${encodeURIComponent(query)}&limit=${limit}`;
    if (folder) {
      endpoint += `&folder=${folder}`;
    }
    return await this.request(endpoint);
  }

  // Sync emails
  async syncEmails(folder = 'INBOX') {
    return await this.request(`/api/email/sync/${folder}`, {
      method: 'POST'
    });
  }

  // Get folders
  async getFolders() {
    return await this.request('/api/email/folders/list');
  }

  // Get labels
  async getLabels() {
    return await this.request('/api/email/labels/list');
  }

  // Create label
  async createLabel(name, color = '#1976d2', icon = 'label') {
    return await this.request('/api/email/labels', {
      method: 'POST',
      body: JSON.stringify({ name, color, icon })
    });
  }

  // Add label to email
  async addLabelToEmail(emailId, labelId) {
    return await this.request(`/api/email/${emailId}/labels/${labelId}`, {
      method: 'PUT'
    });
  }

  // Get contacts
  async getContacts(search = null) {
    let endpoint = '/api/email/contacts/list';
    if (search) {
      endpoint += `?search=${encodeURIComponent(search)}`;
    }
    return await this.request(endpoint);
  }

  // Create contact
  async createContact(name, email, additionalData = {}) {
    return await this.request('/api/email/contacts', {
      method: 'POST',
      body: JSON.stringify({
        name,
        email,
        ...additionalData
      })
    });
  }
}
```

---

### Use EmailService

```javascript
// Initialize
const emailService = new EmailService(
  'https://ementech.co.ke',
  'YOUR_JWT_TOKEN'
);

// Fetch emails
async function loadInbox() {
  try {
    const response = await emailService.fetchEmails('INBOX', 20);
    console.log('Emails:', response.data);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch emails:', error);
  }
}

// Send email
async function sendEmail(to, subject, body) {
  try {
    const response = await emailService.sendEmail({
      to,
      subject,
      htmlBody: body
    });
    console.log('Email sent:', response.message);
    return response;
  } catch (error) {
    console.error('Failed to send email:', error);
  }
}

// Search emails
async function searchEmails(query) {
  try {
    const response = await emailService.searchEmails(query);
    console.log('Search results:', response.data);
    return response.data;
  } catch (error) {
    console.error('Search failed:', error);
  }
}

// Example usage
loadInbox();
sendEmail('client@example.com', 'Hello', '<p>Hello from EmenTech!</p>');
searchEmails('project');
```

---

## Complete Integration Example

### React Component Example

```jsx
import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

function EmailClient() {
  const [emails, setEmails] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [socket, setSocket] = useState(null);
  const [folders, setFolders] = useState([]);
  const [currentFolder, setCurrentFolder] = useState('INBOX');

  const token = localStorage.getItem('jwtToken'); // Assume stored in localStorage

  useEffect(() => {
    // Connect to Socket.IO
    const socketConnection = io('https://ementech.co.ke', {
      auth: { token }
    });

    socketConnection.on('connect', () => {
      console.log('Connected to email server');
    });

    socketConnection.on('new_email', (email) => {
      setEmails(prev => [email, ...prev]);
      // Show notification
      new Notification('New Email', {
        body: `${email.from.name || email.from.email}: ${email.subject}`
      });
    });

    setSocket(socketConnection);

    // Load folders
    loadFolders();

    // Load initial emails
    loadEmails('INBOX');

    return () => {
      socketConnection.disconnect();
    };
  }, []);

  const loadEmails = async (folder) => {
    try {
      const response = await fetch(
        `https://ementech.co.ke/api/email?folder=${folder}&limit=50`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const data = await response.json();
      setEmails(data.data);
      setCurrentFolder(folder);
    } catch (error) {
      console.error('Failed to load emails:', error);
    }
  };

  const loadFolders = async () => {
    try {
      const response = await fetch(
        'https://ementech.co.ke/api/email/folders/list',
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const data = await response.json();
      setFolders(data.data);
    } catch (error) {
      console.error('Failed to load folders:', error);
    }
  };

  const markAsRead = async (emailId) => {
    try {
      await fetch(
        `https://ementech.co.ke/api/email/${emailId}/read`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ isRead: true })
        }
      );

      // Update local state
      setEmails(prev =>
        prev.map(email =>
          email._id === emailId
            ? { ...email, isRead: true }
            : email
        )
      );
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const deleteEmail = async (emailId) => {
    try {
      await fetch(
        `https://ementech.co.ke/api/email/${emailId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      // Remove from local state
      setEmails(prev => prev.filter(email => email._id !== emailId));
      if (selectedEmail?._id === emailId) {
        setSelectedEmail(null);
      }
    } catch (error) {
      console.error('Failed to delete email:', error);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* Sidebar */}
      <div style={{ width: '250px', borderRight: '1px solid #ccc', padding: '20px' }}>
        <h2>Folders</h2>
        {folders.map(folder => (
          <div
            key={folder.name}
            onClick={() => loadEmails(folder.name)}
            style={{
              padding: '10px',
              cursor: 'pointer',
              backgroundColor: currentFolder === folder.name ? '#f0f0f0' : 'transparent'
            }}
          >
            {folder.displayName} ({folder.unreadCount})
          </div>
        ))}
      </div>

      {/* Email List */}
      <div style={{ width: '400px', borderRight: '1px solid #ccc', overflow: 'auto' }}>
        {emails.map(email => (
          <div
            key={email._id}
            onClick={() => {
              setSelectedEmail(email);
              if (!email.isRead) markAsRead(email._id);
            }}
            style={{
              padding: '15px',
              borderBottom: '1px solid #eee',
              cursor: 'pointer',
              backgroundColor: email.isRead ? 'transparent' : '#f9f9f9',
              fontWeight: email.isRead ? 'normal' : 'bold'
            }}
          >
            <div>{email.from.name || email.from.email}</div>
            <div>{email.subject}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {new Date(email.date).toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      {/* Email Content */}
      <div style={{ flex: 1, padding: '20px', overflow: 'auto' }}>
        {selectedEmail ? (
          <div>
            <h1>{selectedEmail.subject}</h1>
            <p><strong>From:</strong> {selectedEmail.from.name || selectedEmail.from.email}</p>
            <p><strong>To:</strong> {selectedEmail.to.map(t => t.email).join(', ')}</p>
            <p><strong>Date:</strong> {new Date(selectedEmail.date).toLocaleString()}</p>
            <hr />
            <div dangerouslySetInnerHTML={{ __html: selectedEmail.htmlBody }} />
            <button onClick={() => deleteEmail(selectedEmail._id)}>
              Delete
            </button>
          </div>
        ) : (
          <p>Select an email to read</p>
        )}
      </div>
    </div>
  );
}

export default EmailClient;
```

---

**Document Version**: 1.0
**Last Updated**: January 21, 2026
**Maintained By**: EmenTech Development Team
