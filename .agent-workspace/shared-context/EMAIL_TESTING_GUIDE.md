# EmenTech Email System - Testing Guide

**Last Updated:** January 21, 2026
**Purpose:** Complete testing procedures for email functionality
**Target:** @ementech.co.ke personalized email accounts

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Testing Environment Setup](#testing-environment-setup)
3. [Authentication Testing](#authentication-testing)
4. [IMAP Connection Testing](#imap-connection-testing)
5. [SMTP Sending Testing](#smtp-sending-testing)
6. [Email Sync Testing](#email-sync-testing)
7. [Real-Time Notifications Testing](#real-time-notifications-testing)
8. [Folder Management Testing](#folder-management-testing)
9. [Label Management Testing](#label-management-testing)
10. [Contact Management Testing](#contact-management-testing)
11. [Search Functionality Testing](#search-functionality-testing)
12. [Security Testing](#security-testing)
13. [Performance Testing](#performance-testing)
14. [Troubleshooting Tests](#troubleshooting-tests)

---

## Prerequisites

### Required Tools

- **curl** - For API testing
- **Postman** (optional) - For API testing
- **MongoDB Compass** (optional) - For database inspection
- **Web Browser** - For Socket.IO testing
- **Email Client** - For receiving test emails (Gmail, Outlook, etc.)

### Required Information

- Backend API URL: `https://ementech.co.ke` or `http://localhost:5001`
- Test email account: `admin@ementech.co.ke`
- Email password: `Admin2026!`
- MongoDB connection string (for direct database access)

### Test User

Ensure you have a test user account:

```json
{
  "name": "Test User",
  "email": "testuser@example.com",
  "password": "TestPass123!",
  "role": "admin"
}
```

---

## Testing Environment Setup

### 1. Verify Backend is Running

```bash
curl https://ementech.co.ke/api/health
```

**Expected Response**:
```json
{
  "status": "healthy",
  "timestamp": "2026-01-21T...",
  "uptime": 12345.67,
  "environment": "production"
}
```

### 2. Verify Database Connection

Check MongoDB logs or use MongoDB Compass to connect to the database.

### 3. Verify Email Server Accessibility

```bash
# Test IMAP port
telnet mail.ementech.co.ke 993

# Test SMTP port
telnet mail.ementech.co.ke 587
```

### 4. Check PM2 Process Status (Production)

```bash
ssh root@69.164.244.165
pm2 status
pm2 logs ementech-backend --lines 50
```

---

## Authentication Testing

### Test 1: User Registration

**Objective**: Register a new user

```bash
curl -X POST https://ementech.co.ke/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "testuser@example.com",
    "password": "TestPass123!",
    "role": "admin",
    "department": "engineering"
  }'
```

**Expected Response** (201 Created):
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "name": "Test User",
    "email": "testuser@example.com",
    "role": "admin",
    "department": "engineering"
  }
}
```

**Save the token** for subsequent tests.

---

### Test 2: User Login

**Objective**: Login with existing user

```bash
curl -X POST https://ementech.co.ke/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "TestPass123!"
  }'
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "name": "Test User",
    "email": "testuser@example.com",
    "role": "admin",
    "department": "engineering"
  }
}
```

---

### Test 3: Get Current User

**Objective**: Verify authentication works

```bash
curl -X GET https://ementech.co.ke/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "user": {
    "id": "...",
    "name": "Test User",
    "email": "testuser@example.com",
    "role": "admin",
    "department": "engineering"
  }
}
```

---

### Test 4: Invalid Token

**Objective**: Verify authentication rejects invalid tokens

```bash
curl -X GET https://ementech.co.ke/api/auth/me \
  -H "Authorization: Bearer invalid_token"
```

**Expected Response** (401 Unauthorized):
```json
{
  "success": false,
  "message": "Not authorized to access this route. Token failed."
}
```

---

## IMAP Connection Testing

### Test 5: Add Email Account to User

**Objective**: Configure @ementech.co.ke email account for user

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
    }
  }'
```

**Expected Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "email": "admin@ementech.co.ke",
    "isPrimary": true,
    "isVerified": false,
    ...
  }
}
```

---

### Test 6: Test IMAP Connection

**Objective**: Verify IMAP credentials and connectivity

**Note**: This requires creating a test endpoint or using MongoDB directly.

**Via MongoDB Shell**:
```javascript
// Connect to MongoDB
use ementech

// Find user email
db.useremails.findOne({ email: "admin@ementech.co.ke" })

// Test connection (this requires the testConnection method)
// You'll need to create a test script or use the API
```

**Expected**: Connection successful, no errors.

---

### Test 7: Manual IMAP Connection Test

**Objective**: Test IMAP connection using openssl

```bash
openssl s_client -connect mail.ementech.co.ke:993 -crlf
```

**Then send IMAP commands**:
```
. LOGIN admin@ementech.co.ke Admin2026!
. LIST "" *
. SELECT INBOX
. SEARCH ALL
. LOGOUT
```

**Expected**: Successful login and folder listing.

---

## SMTP Sending Testing

### Test 8: Send Test Email

**Objective**: Send an email through SMTP

```bash
curl -X POST https://ementech.co.ke/api/email/send \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "recipient@example.com",
    "subject": "Test Email from EmenTech",
    "textBody": "This is a test email sent from the EmenTech email system.",
    "htmlBody": "<h1>Test Email</h1><p>This is a test email sent from the EmenTech email system.</p>"
  }'
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "message": "Email sent successfully",
  "data": {
    "messageId": "<unique-id@ementech.co.ke>",
    "email": {
      "_id": "...",
      "folder": "Sent",
      "subject": "Test Email from EmenTech",
      ...
    }
  }
}
```

**Verification**:
- Check recipient inbox for email
- Check `Sent` folder in database
- Verify email has correct from address: `admin@ementech.co.ke`

---

### Test 9: Send Email with Attachments

**Objective**: Test email with file attachment

```bash
curl -X POST https://ementech.co.ke/api/email/send \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "recipient@example.com",
    "subject": "Test Email with Attachment",
    "textBody": "Please find attached file.",
    "attachments": [
      {
        "filename": "test.txt",
        "content": "VGhpcyBpcyBhIHRlc3QgZmlsZS4=",
        "contentType": "text/plain"
      }
    ]
  }'
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "message": "Email sent successfully",
  "data": {
    "messageId": "...",
    "email": {
      "hasAttachments": true,
      "attachments": [
        {
          "filename": "test.txt",
          "contentType": "text/plain",
          "size": 19
        }
      ]
    }
  }
}
```

**Verification**:
- Recipient receives email with attachment
- Attachment is correct size and content

---

### Test 10: Send Email with CC and BCC

**Objective**: Test multiple recipients

```bash
curl -X POST https://ementech.co.ke/api/email/send \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "recipient1@example.com",
    "cc": "recipient2@example.com",
    "bcc": "recipient3@example.com",
    "subject": "Test Multiple Recipients",
    "textBody": "Testing CC and BCC."
  }'
```

**Verification**:
- All recipients receive email
- CC recipients see each other
- BCC recipients don't see each other

---

## Email Sync Testing

### Test 11: Manual Email Sync

**Objective**: Sync emails from IMAP server

```bash
curl -X POST https://ementech.co.ke/api/email/sync/INBOX \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "message": "Emails synced successfully",
  "syncedCount": 5
}
```

**Verification**:
- Check `emails` collection in MongoDB
- Verify emails are synced from INBOX
- Check email metadata (from, to, subject, date)

---

### Test 12: Sync Different Folders

**Objective**: Sync various IMAP folders

```bash
# Sync Sent folder
curl -X POST https://ementech.co.ke/api/email/sync/Sent \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Sync Drafts folder
curl -X POST https://ementech.co.ke/api/email/sync/Drafts \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Verification**:
- Emails from each folder are synced
- Folder field correctly set

---

### Test 13: Fetch Synced Emails

**Objective**: Retrieve synced emails from database

```bash
curl -X GET "https://ementech.co.ke/api/email?folder=INBOX&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "count": 10,
  "data": [
    {
      "_id": "...",
      "folder": "INBOX",
      "from": {
        "name": "Sender Name",
        "email": "sender@example.com"
      },
      "subject": "Email Subject",
      "date": "2026-01-21T...",
      "isRead": false,
      "hasAttachments": false
    }
  ]
}
```

---

### Test 14: Test Real-Time Sync

**Objective**: Verify IMAP watcher picks up new emails

**Steps**:
1. Start backend server (or check it's running)
2. Send an email to `admin@ementech.co.ke` from external account
3. Wait up to 30 seconds (for polling) or immediate (if IDLE works)
4. Check backend logs for new email detection
5. Fetch emails to verify new email appears

**Backend Log Output**:
```
🔔 New email detected for admin@ementech.co.ke
✅ New email synced: Test Subject
   From: sender@example.com
   Emitting via Socket.IO to user USER_ID
```

---

## Real-Time Notifications Testing

### Test 15: Socket.IO Connection

**Objective**: Test Socket.IO connection

**Create HTML file** (`test-socket.html`):

```html
<!DOCTYPE html>
<html>
<head>
  <title>Socket.IO Test</title>
  <script src="https://cdn.socket.io/4.7.5/socket.io.min.js"></script>
</head>
<body>
  <h1>Socket.IO Connection Test</h1>
  <div id="status">Connecting...</div>
  <div id="events"></div>

  <script>
    const token = 'YOUR_JWT_TOKEN';
    const socket = io('https://ementech.co.ke', {
      auth: { token }
    });

    socket.on('connect', () => {
      document.getElementById('status').innerText = 'Connected';
      console.log('Connected to Socket.IO');
    });

    socket.on('disconnect', () => {
      document.getElementById('status').innerText = 'Disconnected';
    });

    socket.on('new_email', (email) => {
      const eventDiv = document.createElement('div');
      eventDiv.innerText = `New email: ${email.subject}`;
      document.getElementById('events').appendChild(eventDiv);
    });

    socket.on('connect_error', (error) => {
      document.getElementById('status').innerText = 'Connection error: ' + error.message;
    });
  </script>
</body>
</html>
```

**Verification**:
- Open file in browser
- Status shows "Connected"
- No console errors

---

### Test 16: Real-Time Email Notification

**Objective**: Verify new email notification

**Steps**:
1. Open Socket.IO test page (from Test 15)
2. Send email to `admin@ementech.co.ke`
3. Wait for notification

**Expected**:
- `new_email` event triggered
- Email details displayed on page
- Backend logs show Socket.IO emit

---

## Folder Management Testing

### Test 17: Get Folders

**Objective**: Retrieve user's email folders

```bash
curl -X GET https://ementech.co.ke/api/email/folders/list \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response** (200 OK):
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
    }
  ]
}
```

---

### Test 18: Move Email to Folder

**Objective**: Move email to different folder

```bash
curl -X PUT https://ementech.co.ke/api/email/EMAIL_ID/folder \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "folder": "Archive"
  }'
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "message": "Email moved to Archive",
  "data": {
    "_id": "...",
    "folder": "Archive",
    ...
  }
}
```

**Verification**:
- Email folder updated in database
- Real-time notification sent (if Socket.IO connected)

---

### Test 19: Get Unread Count

**Objective**: Get unread email count for folder

```bash
curl -X GET "https://ementech.co.ke/api/email/folders/unread-count?folder=INBOX" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "count": 5
}
```

---

## Label Management Testing

### Test 20: Create Label

**Objective**: Create custom label

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

**Expected Response** (201 Created):
```json
{
  "success": true,
  "message": "Label created successfully",
  "data": {
    "_id": "...",
    "name": "Important Client",
    "color": "#ff5722",
    "icon": "business"
  }
}
```

---

### Test 21: Get Labels

**Objective**: Retrieve user's labels

```bash
curl -X GET https://ementech.co.ke/api/email/labels/list \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "name": "Important Client",
      "color": "#ff5722",
      "icon": "business"
    }
  ]
}
```

---

### Test 22: Add Label to Email

**Objective**: Assign label to email

```bash
curl -X PUT https://ementech.co.ke/api/email/EMAIL_ID/labels/LABEL_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "message": "Label added to email",
  "data": {
    "_id": "...",
    "labels": ["LABEL_ID"],
    ...
  }
}
```

---

### Test 23: Remove Label from Email

**Objective**: Remove label from email

```bash
curl -X DELETE https://ementech.co.ke/api/email/EMAIL_ID/labels/LABEL_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "message": "Label removed from email",
  "data": {
    "_id": "...",
    "labels": [],
    ...
  }
}
```

---

## Contact Management Testing

### Test 24: Get Contacts

**Objective**: Retrieve user's contacts

```bash
curl -X GET https://ementech.co.ke/api/email/contacts/list \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "count": 10,
  "data": [
    {
      "_id": "...",
      "name": "John Doe",
      "email": "john@example.com",
      "frequencyScore": 5,
      "lastContactedAt": "2026-01-21T..."
    }
  ]
}
```

---

### Test 25: Search Contacts

**Objective**: Search contacts by name or email

```bash
curl -X GET "https://ementech.co.ke/api/email/contacts/list?search=john" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "name": "John Doe",
      "email": "john@example.com"
    },
    {
      "name": "John Smith",
      "email": "johnsmith@example.com"
    }
  ]
}
```

---

### Test 26: Create Contact

**Objective**: Manually create contact

```bash
curl -X POST https://ementech.co.ke/api/email/contacts \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "email": "jane@example.com",
    "phone": "+1234567890",
    "company": "Example Corp",
    "notes": "Important client"
  }'
```

**Expected Response** (201 Created):
```json
{
  "success": true,
  "message": "Contact created successfully",
  "data": {
    "_id": "...",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "phone": "+1234567890",
    "company": "Example Corp",
    "notes": "Important client"
  }
}
```

---

### Test 27: Verify Contact Auto-Creation

**Objective**: Verify contacts are auto-created from emails

**Steps**:
1. Send test email to new recipient
2. Fetch contacts list
3. Verify new contact exists with increased `frequencyScore`

---

## Search Functionality Testing

### Test 28: Search Emails

**Objective**: Full-text search across emails

```bash
curl -X GET "https://ementech.co.ke/api/email/search?q=project&folder=INBOX&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "count": 5,
  "query": "project",
  "data": [
    {
      "subject": "Project Update",
      "from": {
        "name": "Team Lead",
        "email": "lead@example.com"
      }
    }
  ]
}
```

**Verification**:
- Results include emails with "project" in:
  - Subject
  - Text body
  - From name
  - From email

---

## Security Testing

### Test 29: Verify Password Encryption

**Objective**: Ensure email passwords are encrypted

**Steps**:
1. Connect to MongoDB
2. Check `useremails` collection
3. Verify `imap.password` and `smtp.password` are encrypted

```javascript
db.useremails.findOne({ email: "admin@ementech.co.ke" })
```

**Expected**: Passwords should be encrypted strings (not plain text)

---

### Test 30: Test Unauthorized Access

**Objective**: Verify API rejects unauthorized requests

```bash
curl -X GET https://ementech.co.ke/api/email
```

**Expected Response** (401 Unauthorized):
```json
{
  "success": false,
  "message": "Not authorized to access this route. Please login."
}
```

---

### Test 31: Test Cross-User Access

**Objective**: Ensure users can only access their own emails

**Steps**:
1. Login as User A
2. Try to access User B's email ID
3. Verify access is denied

```bash
curl -X GET https://ementech.co.ke/api/email/USER_B_EMAIL_ID \
  -H "Authorization: Bearer USER_A_JWT_TOKEN"
```

**Expected Response** (404 Not Found or 403 Forbidden)

---

## Performance Testing

### Test 32: Sync Performance

**Objective**: Measure sync speed

**Steps**:
1. Start with empty email collection
2. Trigger sync
3. Measure time to complete

```bash
time curl -X POST https://ementech.co.ke/api/email/sync/INBOX \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected**: Sync completes within reasonable time (< 30 seconds for 100 emails)

---

### Test 33: Fetch Performance

**Objective**: Measure fetch speed

```bash
time curl -X GET "https://ementech.co.ke/api/email?folder=INBOX&limit=100" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected**: Response within 1 second

---

### Test 34: Search Performance

**Objective**: Measure search speed

```bash
time curl -X GET "https://ementech.co.ke/api/email/search?q=test&limit=50" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected**: Response within 2 seconds

---

## Troubleshooting Tests

### Test 35: Invalid IMAP Credentials

**Objective**: Verify error handling for bad credentials

```bash
curl -X POST https://ementech.co.ke/api/user-emails \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@ementech.co.ke",
    "imap": {
      "host": "mail.ementech.co.ke",
      "port": 993,
      "tls": true,
      "username": "admin@ementech.co.ke",
      "password": "WrongPassword"
    },
    "smtp": {
      "host": "mail.ementech.co.ke",
      "port": 587,
      "secure": false,
      "username": "admin@ementech.co.ke",
      "password": "WrongPassword"
    }
  }'
```

**Expected**: Error response indicating authentication failure

---

### Test 36: Invalid SMTP Configuration

**Objective**: Test SMTP error handling

```bash
curl -X POST https://ementech.co.ke/api/email/send \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "invalid-email-address",
    "subject": "Test",
    "textBody": "Test"
  }'
```

**Expected**: Error response indicating invalid recipient or send failure

---

### Test 37: Network Failure Simulation

**Objective**: Test behavior when email server is unreachable

**Steps**:
1. Temporarily block email server ports (firewall)
2. Try to sync emails
3. Verify graceful error handling

**Expected**: Error message, no crash, sync status set to 'error'

---

## Test Results Summary

### Test Checklist

Use this checklist to track test results:

- [ ] Test 1: User Registration
- [ ] Test 2: User Login
- [ ] Test 3: Get Current User
- [ ] Test 4: Invalid Token
- [ ] Test 5: Add Email Account
- [ ] Test 6: IMAP Connection Test
- [ ] Test 7: Manual IMAP Test
- [ ] Test 8: Send Test Email
- [ ] Test 9: Send with Attachments
- [ ] Test 10: Send with CC/BCC
- [ ] Test 11: Manual Sync
- [ ] Test 12: Sync Different Folders
- [ ] Test 13: Fetch Emails
- [ ] Test 14: Real-Time Sync
- [ ] Test 15: Socket.IO Connection
- [ ] Test 16: Real-Time Notification
- [ ] Test 17: Get Folders
- [ ] Test 18: Move Email
- [ ] Test 19: Unread Count
- [ ] Test 20: Create Label
- [ ] Test 21: Get Labels
- [ ] Test 22: Add Label to Email
- [ ] Test 23: Remove Label
- [ ] Test 24: Get Contacts
- [ ] Test 25: Search Contacts
- [ ] Test 26: Create Contact
- [ ] Test 27: Auto-Create Contacts
- [ ] Test 28: Search Emails
- [ ] Test 29: Password Encryption
- [ ] Test 30: Unauthorized Access
- [ ] Test 31: Cross-User Access
- [ ] Test 32: Sync Performance
- [ ] Test 33: Fetch Performance
- [ ] Test 34: Search Performance
- [ ] Test 35: Invalid IMAP
- [ ] Test 36: Invalid SMTP
- [ ] Test 37: Network Failure

---

## Automated Testing Script

### Bash Script for Basic Tests

```bash
#!/bin/bash

# Configuration
API_URL="https://ementech.co.ke"
EMAIL="testuser@example.com"
PASSWORD="TestPass123!"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Test 1: Health Check
echo "Testing health endpoint..."
response=$(curl -s "$API_URL/api/health")
if echo "$response" | grep -q "healthy"; then
  echo -e "${GREEN}✓ Health check passed${NC}"
else
  echo -e "${RED}✗ Health check failed${NC}"
fi

# Test 2: Login
echo "Testing login..."
response=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

token=$(echo "$response" | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -n "$token" ]; then
  echo -e "${GREEN}✓ Login successful${NC}"
else
  echo -e "${RED}✗ Login failed${NC}"
  exit 1
fi

# Test 3: Fetch Emails
echo "Testing email fetch..."
response=$(curl -s -X GET "$API_URL/api/email?folder=INBOX&limit=5" \
  -H "Authorization: Bearer $token")

if echo "$response" | grep -q "success"; then
  echo -e "${GREEN}✓ Email fetch successful${NC}"
else
  echo -e "${RED}✗ Email fetch failed${NC}"
fi

echo "Basic tests completed!"
```

Save as `test-email-system.sh`, make executable (`chmod +x test-email-system.sh`), and run.

---

## Conclusion

After completing all tests, you should have:

1. **Verified Authentication**: Users can register, login, and access protected endpoints
2. **Confirmed IMAP Connectivity**: Can connect to mail.ementech.co.ke and sync emails
3. **Validated SMTP Sending**: Can send emails from @ementech.co.ke addresses
4. **Tested Real-Time Features**: Socket.IO notifications work correctly
5. **Checked Organization**: Folders, labels, and contacts function properly
6. **Verified Security**: Passwords encrypted, access control working
7. **Measured Performance**: System responds within acceptable limits

### Common Issues Found

1. **IMAP IDLE Not Supported**: Falls back to polling (normal)
2. **Certificate Warnings**: Use `rejectUnauthorized: false` for self-signed certs
3. **Slow Initial Sync**: Normal for large mailboxes
4. **Missing Email Account**: Must add UserEmail document before syncing

### Next Steps

1. Fix any failed tests
2. Implement automated testing in CI/CD pipeline
3. Set up monitoring for IMAP watcher
4. Create alerts for sync failures
5. Document any custom configurations

---

**Document Version**: 1.0
**Last Updated**: January 21, 2026
**Maintained By**: EmenTech Development Team
