# EmenTech Email System - Verification Checklist

**Last Updated:** January 21, 2026
**Purpose:** Complete system verification for @ementech.co.ke email functionality
**Status:** Ready for Production Verification

---

## Instructions

Use this checklist to verify the email system is fully functional. Check each item and mark as [✅] Pass or [❌] Fail. Document any issues in the notes section.

**Person Verifying**: _________________________
**Date**: _________________________
**Environment**: [ ] Development [ ] Staging [ ] Production

---

## 1. System Requirements

### 1.1 Backend Services
- [ ] Backend server is running on port 5001 (or configured port)
- [ ] MongoDB database is connected
- [ ] PM2 process is active (production)
- [ ] Server responds to health check endpoint

### 1.2 Email Server
- [ ] mail.ementech.co.ke is accessible
- [ ] IMAP port 993 is open
- [ ] SMTP port 587 is open
- [ ] Can connect to both ports from backend server

### 1.3 Environment Configuration
- [ ] JWT_SECRET is set and secure
- [ ] MONGODB_URI is correctly configured
- [ ] CORS_ORIGIN includes frontend domain
- [ ] Email credentials are correct

**Notes**: __________________________________________________________________
_____________________________________________________________________________

---

## 2. Authentication System Verification

### 2.1 User Registration
- [ ] Can register new user via API
- [ ] Password is hashed in database (not plain text)
- [ ] JWT token is returned on registration
- [ ] User data is correct (name, email, role, department)

**Test Command**:
```bash
curl -X POST https://ementech.co.ke/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"TestPass123!"}'
```

**Result**: [ ] Pass [ ] Fail
**Notes**: __________________________________________________________________

### 2.2 User Login
- [ ] Can login with valid credentials
- [ ] JWT token is returned
- [ ] Token expiration is set correctly (7 days)
- [ ] Invalid credentials return 401 error

**Test Command**:
```bash
curl -X POST https://ementech.co.ke/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123!"}'
```

**Result**: [ ] Pass [ ] Fail
**JWT Token**: _______________________________________________________________

### 2.3 Protected Routes
- [ ] Can access protected routes with valid token
- [ ] Invalid tokens are rejected
- [ ] Missing tokens are rejected
- [ ] Expired tokens are rejected

**Test Command**:
```bash
curl -X GET https://ementech.co.ke/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Result**: [ ] Pass [ ] Fail
**Notes**: __________________________________________________________________

### 2.4 User Data
- [ ] User model has correct fields (name, email, password, role, department, isActive)
- [ ] Password field is excluded from queries by default
- [ ] Role-based access control works
- [ ] Account activation/deactivation works

**Result**: [ ] Pass [ ] Fail
**Notes**: __________________________________________________________________

---

## 3. Email Account Setup Verification

### 3.1 Add Email Account
- [ ] Can add email account to user profile
- [ ] IMAP credentials are accepted
- [ ] SMTP credentials are accepted
- [ ] Credentials are encrypted in database

**Test Command**:
```bash
curl -X POST https://ementech.co.ke/api/user-emails \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email":"admin@ementech.co.ke",
    "isPrimary":true,
    "imap":{"host":"mail.ementech.co.ke","port":993,"tls":true,"username":"admin@ementech.co.ke","password":"Admin2026!"},
    "smtp":{"host":"mail.ementech.co.ke","port":587,"secure":false,"username":"admin@ementech.co.ke","password":"Admin2026!"}
  }'
```

**Result**: [ ] Pass [ ] Fail
**Email Account ID**: _____________________________________________________

### 3.2 Credential Encryption
- [ ] IMAP password is encrypted in database
- [ ] SMTP password is encrypted in database
- [ ] Can decrypt credentials correctly
- [ ] Encryption uses AES-256-CBC

**Database Check**:
```javascript
db.useremails.findOne({email:"admin@ementech.co.ke"})
// Verify: imap.password and smtp.password are encrypted
```

**Result**: [ ] Pass [ ] Fail
**Notes**: __________________________________________________________________

### 3.3 Primary Email Account
- [ ] User can have only one primary email
- [ ] Setting new primary email unsets old primary
- [ ] Can fetch user's primary email
- [ ] Primary email is used for sending by default

**Result**: [ ] Pass [ ] Fail
**Notes**: __________________________________________________________________

---

## 4. IMAP Connection Verification

### 4.1 IMAP Connectivity
- [ ] Can connect to mail.ementech.co.ke:993
- [ ] TLS connection works
- [ ] Authentication succeeds
- [ ] Can list IMAP folders

**Manual Test**:
```bash
openssl s_client -connect mail.ementech.co.ke:993 -crlf
# Then send: . LOGIN admin@ementech.co.ke Admin2026!
# Then send: . LIST "" *
```

**Result**: [ ] Pass [ ] Fail
**IMAP Folders Listed**: __________________________________________________

### 4.2 IMAP Watcher Service
- [ ] IMAP watcher starts when server starts
- [ ] Watcher monitors user's email accounts
- [ ] No connection errors in logs
- [ ] Watcher reconnects on disconnect

**Backend Logs Check**:
```bash
pm2 logs ementech-backend --lines 100 | grep -E "IMAP|watch"
```

**Result**: [ ] Pass [ ] Fail
**Log Output**: __________________________________________________________________
_____________________________________________________________________________

### 4.3 IMAP IDLE or Polling
- [ ] System attempts IMAP IDLE first
- [ ] Falls back to polling if IDLE not supported
- [ ] Polling interval is 30 seconds
- [ ] No excessive CPU usage from polling

**Result**: [ ] Pass [ ] Fail
**Mode Used**: [ ] IDLE [ ] Polling
**Notes**: __________________________________________________________________

---

## 5. SMTP Sending Verification

### 5.1 SMTP Connectivity
- [ ] Can connect to mail.ementech.co.ke:587
- [ ] STARTTLS works
- [ ] Authentication succeeds
- [ ] Can send test email

**Test Command**:
```bash
curl -X POST https://ementech.co.ke/api/email/send \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"to":"test@example.com","subject":"Test","textBody":"Test email"}'
```

**Result**: [ ] Pass [ ] Fail
**Email Sent**: [ ] Yes [ ] No
**Message ID**: ______________________________________________________________

### 5.2 Email Delivery
- [ ] Email arrives at recipient inbox
- [ ] From address is admin@ementech.co.ke
- [ ] Subject is correct
- [ ] Body content is correct
- [ ] Headers are properly formatted

**Recipient Check**: [ ] Pass [ ] Fail
**Notes**: __________________________________________________________________

### 5.3 Sent Folder
- [ ] Sent email is saved to database
- [ ] Folder is set to 'Sent'
- [ ] Message ID is recorded
- [ ] Date and time are correct

**Database Check**:
```javascript
db.emails.findOne({folder:"Sent"}).sort({date:-1}).limit(1)
```

**Result**: [ ] Pass [ ] Fail
**Notes**: __________________________________________________________________

### 5.4 Attachments
- [ ] Can send email with attachment
- [ ] Attachment size is correct
- [ ] Attachment content type is correct
- [ ] Recipient receives attachment

**Result**: [ ] Pass [ ] Fail
**Notes**: __________________________________________________________________

---

## 6. Email Receiving Verification

### 6.1 Email Sync
- [ ] Can manually sync INBOX
- [ ] Emails are fetched from IMAP server
- [ ] Emails are saved to database
- [ ] Sync status is updated

**Test Command**:
```bash
curl -X POST https://ementech.co.ke/api/email/sync/INBOX \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Result**: [ ] Pass [ ] Fail
**Emails Synced**: ________
**Notes**: __________________________________________________________________

### 6.2 Email Parsing
- [ ] Subject is parsed correctly
- [ ] From address is parsed correctly
- [ ] To address is parsed correctly
- [ ] CC is parsed correctly
- [ ] HTML body is captured
- [ ] Text body is captured
- [ ] Attachments are detected
- [ ] Date is correct

**Result**: [ ] Pass [ ] Fail
**Notes**: __________________________________________________________________

### 6.3 Real-Time Email Detection
- [ ] Sending email to admin@ementech.co.ke triggers detection
- [ ] Detection happens within 30 seconds (IDLE) or 30-60 seconds (polling)
- [ ] Backend logs show new email detection
- [ ] Email is saved to database automatically

**Test Steps**:
1. Send email from external account to admin@ementech.co.ke
2. Watch backend logs: `pm2 logs ementech-backend --lines 50`
3. Check database for new email

**Result**: [ ] Pass [ ] Fail
**Detection Time**: ________ seconds
**Notes**: __________________________________________________________________

---

## 7. Real-Time Notifications Verification

### 7.1 Socket.IO Connection
- [ ] Socket.IO server is initialized
- [ ] Client can connect with JWT token
- [ ] Connection is authenticated
- [ ] User joins their personal room

**Browser Console Test**:
```javascript
const socket = io('https://ementech.co.ke', {
  auth: { token: 'YOUR_JWT_TOKEN' }
});
socket.on('connect', () => console.log('Connected'));
```

**Result**: [ ] Pass [ ] Fail
**Notes**: __________________________________________________________________

### 7.2 New Email Notification
- [ ] New email triggers 'new_email' event
- [ ] Event contains email object
- [ ] Client receives notification in real-time
- [ ] Multiple clients receive notification

**Test Steps**:
1. Open browser with Socket.IO connection
2. Send email to admin@ementech.co.ke
3. Verify 'new_email' event is triggered

**Result**: [ ] Pass [ ] Fail
**Notes**: __________________________________________________________________

### 7.3 Email Update Notifications
- [ ] Mark as read triggers 'email_read_status' event
- [ ] Toggle flag triggers 'email_flagged' event
- [ ] Move to folder triggers 'email_moved' event
- [ ] Delete triggers 'email_deleted' event

**Result**: [ ] Pass [ ] Fail
**Notes**: __________________________________________________________________

---

## 8. Email Management Verification

### 8.1 Fetch Emails
- [ ] Can fetch emails from INBOX
- [ ] Can fetch emails from Sent folder
- [ ] Can fetch emails from other folders
- [ ] Pagination works (limit, skip)
- [ ] Emails are sorted by date (newest first)

**Test Command**:
```bash
curl -X GET "https://ementech.co.ke/api/email?folder=INBOX&limit=10&skip=0" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Result**: [ ] Pass [ ] Fail
**Notes**: __________________________________________________________________

### 8.2 Get Single Email
- [ ] Can fetch single email by ID
- [ ] Returns 404 for non-existent email
- [ ] Labels are populated
- [ ] All fields are present

**Result**: [ ] Pass [ ] Fail
**Notes**: __________________________________________________________________

### 8.3 Mark as Read/Unread
- [ ] Can mark email as read
- [ ] Can mark email as unread
- [ ] Update reflects in database
- [ ] Real-time notification is sent
- [ ] Can mark multiple emails at once

**Result**: [ ] Pass [ ] Fail
**Notes**: __________________________________________________________________

### 8.4 Flag/Star Email
- [ ] Can toggle flag status
- [ ] Flag reflects in database
- [ ] Real-time notification is sent
- [ ] Can filter by flagged emails

**Result**: [ ] Pass [ ] Fail
**Notes**: __________________________________________________________________

### 8.5 Move to Folder
- [ ] Can move email to different folder
- [ ] Folder update reflects in database
- [ ] Real-time notification is sent
- [ ] Moving to Trash works

**Result**: [ ] Pass [ ] Fail
**Notes**: __________________________________________________________________

### 8.6 Delete Email
- [ ] Can delete email (soft delete)
- [ ] Email is marked as deleted
- [ ] Email is moved to Trash folder
- [ ] Real-time notification is sent
- [ ] Can delete multiple emails

**Result**: [ ] Pass [ ] Fail
**Notes**: __________________________________________________________________

---

## 9. Folder Management Verification

### 9.1 Get Folders
- [ ] Can retrieve user's folders
- [ ] System folders are present (Inbox, Sent, Drafts, etc.)
- [ ] Unread counts are correct
- [ ] Total counts are correct

**Test Command**:
```bash
curl -X GET https://ementech.co.ke/api/email/folders/list \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Result**: [ ] Pass [ ] Fail
**Folder List**: __________________________________________________________________
_____________________________________________________________________________

### 9.2 Unread Count
- [ ] Can get unread count for folder
- [ ] Count is accurate
- [ ] Count updates in real-time
- [ ] Can get count for different folders

**Result**: [ ] Pass [ ] Fail
**INBOX Unread**: ________
**Sent Unread**: ________
**Notes**: __________________________________________________________________

---

## 10. Label Management Verification

### 10.1 Create Label
- [ ] Can create custom label
- [ ] Label name is unique per user
- [ ] Label color can be set
- [ ] Label icon can be set

**Test Command**:
```bash
curl -X POST https://ementech.co.ke/api/email/labels \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Label","color":"#ff5722","icon":"label"}'
```

**Result**: [ ] Pass [ ] Fail
**Label ID**: _______________________________________________________________

### 10.2 Get Labels
- [ ] Can retrieve user's labels
- [ ] Default labels are created
- [ ] Custom labels are included
- [ ] Labels are sorted by order

**Result**: [ ] Pass [ ] Fail
**Notes**: __________________________________________________________________

### 10.3 Add/Remove Labels
- [ ] Can add label to email
- [ ] Can remove label from email
- [ ] Multiple labels can be added
- [ ] Updates reflect in database

**Result**: [ ] Pass [ ] Fail
**Notes**: __________________________________________________________________

---

## 11. Contact Management Verification

### 11.1 Get Contacts
- [ ] Can retrieve user's contacts
- [ ] Contacts are sorted by frequency
- [ ] Favorite contacts are marked
- [ ] Pagination works

**Result**: [ ] Pass [ ] Fail
**Contact Count**: ________
**Notes**: __________________________________________________________________

### 11.2 Search Contacts
- [ ] Can search contacts by name
- [ ] Can search contacts by email
- [ ] Search is case-insensitive
- [ ] Results are relevant

**Test Command**:
```bash
curl -X GET "https://ementech.co.ke/api/email/contacts/list?search=john" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Result**: [ ] Pass [ ] Fail
**Notes**: __________________________________________________________________

### 11.3 Create Contact
- [ ] Can manually create contact
- [ ] All fields are saved correctly
- [ ] Email is unique per user
- [ ] Duplicate email is rejected

**Result**: [ ] Pass [ ] Fail
**Notes**: __________________________________________________________________

### 11.4 Auto-Create Contacts
- [ ] Sending email creates contact
- [ ] Receiving email creates contact
- [ ] Contact frequency score increments
- [ ] Last contacted date updates

**Test Steps**:
1. Send email to new recipient
2. Check contacts list for new contact
3. Verify frequencyScore is 1

**Result**: [ ] Pass [ ] Fail
**Notes**: __________________________________________________________________

---

## 12. Search Functionality Verification

### 12.1 Full-Text Search
- [ ] Can search by subject
- [ ] Can search by text body
- [ ] Can search by from name
- [ ] Can search by from email
- [ ] Search is case-insensitive
- [ ] Results are relevant

**Test Command**:
```bash
curl -X GET "https://ementech.co.ke/api/email/search?q=test&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Result**: [ ] Pass [ ] Fail
**Notes**: __________________________________________________________________

### 12.2 Search in Folder
- [ ] Can limit search to specific folder
- [ ] Folder filter works correctly
- [ ] Search results are accurate

**Result**: [ ] Pass [ ] Fail
**Notes**: __________________________________________________________________

---

## 13. Security Verification

### 13.1 Credential Encryption
- [ ] Email passwords are encrypted in database
- [ ] Encryption uses AES-256-CBC
- [ ] Decryption works correctly
- [ ] Plain text passwords are never stored

**Database Verification**:
```javascript
db.useremails.findOne({email:"admin@ementech.co.ke"}, {imap:1, smtp:1})
// Verify passwords are encrypted (not plain text)
```

**Result**: [ ] Pass [ ] Fail
**Notes**: __________________________________________________________________

### 13.2 Access Control
- [ ] Users can only access their own emails
- [ ] Cross-user access is blocked
- [ ] Invalid tokens are rejected
- [ ] Expired tokens are rejected
- [ ] Role-based access control works

**Result**: [ ] Pass [ ] Fail
**Notes**: __________________________________________________________________

### 13.3 Password Hashing
- [ ] User passwords are hashed with bcrypt
- [ ] Salt rounds is 10
- [ ] Password field is excluded from queries
- [ ] Plain text passwords are never stored

**Result**: [ ] Pass [ ] Fail
**Notes**: __________________________________________________________________

---

## 14. Performance Verification

### 14.1 Response Times
- [ ] Health check responds in < 100ms
- [ ] Fetch emails responds in < 1s
- [ ] Send email responds in < 3s
- [ ] Sync completes in < 30s (for 100 emails)
- [ ] Search responds in < 2s

**Measured Times**:
- Health check: ________ ms
- Fetch emails: ________ ms
- Send email: ________ ms
- Sync: ________ s
- Search: ________ ms

**Result**: [ ] Pass [ ] Fail
**Notes**: __________________________________________________________________

### 14.2 Database Queries
- [ ] Indexes are created and used
- [ ] No full table scans
- [ ] Query execution is optimal
- [ ] No N+1 query problems

**Check with MongoDB**:
```javascript
db.emails.getIndexes()
db.emails.find({user:userId, folder:"INBOX"}).explain("executionStats")
```

**Result**: [ ] Pass [ ] Fail
**Notes**: __________________________________________________________________

---

## 15. Error Handling Verification

### 15.1 IMAP Errors
- [ ] Invalid credentials return error
- [ ] Connection timeout is handled
- [ ] Network errors are handled
- [ ] Sync status is set to 'error'

**Test**: Use wrong IMAP password
**Result**: [ ] Pass [ ] Fail
**Notes**: __________________________________________________________________

### 15.2 SMTP Errors
- [ ] Invalid recipient returns error
- [ ] Send failure is handled gracefully
- [ ] Timeout is handled
- [ ] Error message is descriptive

**Test**: Send to invalid email address
**Result**: [ ] Pass [ ] Fail
**Notes**: __________________________________________________________________

### 15.3 API Errors
- [ ] 400 Bad Request for invalid input
- [ ] 401 Unauthorized for no token
- [ ] 403 Forbidden for insufficient permissions
- [ ] 404 Not Found for missing resources
- [ ] 500 Internal Server Error logs error

**Result**: [ ] Pass [ ] Fail
**Notes**: __________________________________________________________________

---

## 16. Monitoring & Logging Verification

### 16.1 Backend Logs
- [ ] IMAP connections are logged
- [ ] SMTP sends are logged
- [ ] Errors are logged with details
- [ ] New email detection is logged
- [ ] Socket.IO events are logged

**Check Logs**:
```bash
pm2 logs ementech-backend --lines 100 | grep -E "IMAP|SMTP|email|Socket"
```

**Result**: [ ] Pass [ ] Fail
**Notes**: __________________________________________________________________

### 16.2 Database Logs
- [ ] Database queries are logged in dev mode
- [ ] Connection pool status is healthy
- [ ] No connection errors

**Result**: [ ] Pass [ ] Fail
**Notes**: __________________________________________________________________

---

## Summary Results

### Total Checks
- Total Items: _____
- Passed: _____
- Failed: _____
- Pass Rate: _____%

### Critical Items (Must Pass)
- [ ] Authentication works
- [ ] IMAP connection works
- [ ] SMTP sending works
- [ ] Emails can be received
- [ ] Real-time notifications work
- [ ] Credentials are encrypted

### Overall Status
- [ ] ✅ SYSTEM READY FOR PRODUCTION
- [ ] ⚠️ SYSTEM HAS MINOR ISSUES (Document below)
- [ ] ❌ SYSTEM HAS CRITICAL ISSUES (Document below)

---

## Issues Found

### Critical Issues (Must Fix Before Production)

1. _________________________________________________________________________
   _________________________________________________________________________

2. _________________________________________________________________________
   _________________________________________________________________________

### Minor Issues (Should Fix)

1. _________________________________________________________________________
   _________________________________________________________________________

2. _________________________________________________________________________
   _________________________________________________________________________

### Recommendations

1. _________________________________________________________________________
   _________________________________________________________________________

2. _________________________________________________________________________
   _________________________________________________________________________

---

## Sign-Off

**Verified By**: _________________________
**Date**: _________________________
**Signature**: _________________________

**Approved By**: _________________________
**Date**: _________________________
**Signature**: _________________________

---

## Additional Notes

_____________________________________________________________________________
_____________________________________________________________________________
_____________________________________________________________________________
_____________________________________________________________________________
_____________________________________________________________________________

---

**Document Version**: 1.0
**Last Updated**: January 21, 2026
**Maintained By**: EmenTech Development Team
