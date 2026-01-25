# EmenTech Email System - Architecture & Data Flow

## 📧 How Emails Work in Your System

### The Two-Layer Architecture

Your email system has TWO separate storage locations:

1. **IMAP Server** (mail.ementech.co.ke)
   - This is your actual mail server where emails are received
   - Uses Dovecot IMAP server
   - Currently has **7 messages** in the INBOX

2. **MongoDB Database** (ementech)
   - This is where the application reads emails from
   - Emails must be SYNCED from IMAP to MongoDB
   - Currently has **6 emails** stored

### Why You Weren't Seeing Real Emails

The email dashboard queries **MongoDB**, not the IMAP server directly. So even though you had 7 messages on the mail server, they weren't visible in the dashboard because they hadn't been synced to the database yet.

### Data Flow

```
Incoming Email
    ↓
IMAP Server (mail.ementech.co.ke) ← Email arrives here first
    ↓
Sync Process (POST /api/email/sync/:folder) ← Copies emails to database
    ↓
MongoDB Database ← Application queries this
    ↓
Email Dashboard ← Displays emails from database
```

## 📊 Current Database Status

### Email Account Configuration
✅ **1 email account configured**
- Email: admin@ementech.co.ke
- Display Name: EmenTech Admin
- IMAP Host: mail.ementech.co.ke
- IMAP Port: 993 (SSL/TLS)
- SMTP Host: mail.ementech.co.ke
- SMTP Port: 587 (STARTTLS)

### Emails in Database
✅ **6 total emails** (synced from IMAP)

Recent emails:
1. **Undelivered Mail Returned to Sender** (4x)
   - From: mailer-daemon@ementech.co.ke
   - Dates: Jan 19, 5:57 PM - 8:30 PM
   - Note: These are bounce messages from failed email attempts

2. **🧪 Test Email from EmenTech Admin**
   - From: admin@ementech.co.ke
   - Date: Jan 19, 5:50 PM

3. **Test Email from EmenTech System**
   - From: admin@ementech.co.ke
   - Date: Jan 19, 5:42 PM

## 🔧 How to Sync Real Emails

### Method 1: Via API (Recommended)

You can trigger a sync from the frontend using the sync endpoint:

```javascript
POST /api/email/sync/INBOX
```

This will:
1. Connect to the IMAP server
2. Fetch new emails from INBOX
3. Save them to MongoDB
4. Return count of synced emails

### Method 2: Manual Sync Script

I've created a sync script you can run anytime:

```bash
cd /var/www/ementech-website/backend
node sync-real-emails.js
```

## 🔄 Automatic Sync (Not Yet Implemented)

The system has support for automatic syncing but it's not currently enabled. Here's what needs to be done:

### Option 1: Cron Job
Add a cron job to sync emails every 5 minutes:

```bash
*/5 * * * * cd /var/www/ementech-website/backend && node sync-real-emails.js >> /var/log/email-sync.log 2>&1
```

### Option 2: Background Service
Implement a background worker in Node.js that:
1. Runs continuously
2. Syncs emails every 5 minutes (configurable per user)
3. Uses Socket.IO to push new emails to connected clients in real-time

The infrastructure is already in place:
- `UserEmail` model has `autoSync` and `syncInterval` fields
- `emailController.js` has the `syncEmails` function
- Socket.IO is set up for real-time notifications

## 📝 Email Data Structure

Each email in the database contains:

```javascript
{
  _id: ObjectId,
  user: ObjectId,              // User who owns this email
  emailAccount: ObjectId,      // Which email account it belongs to
  messageId: String,           // Unique IMAP message ID
  uid: Number,                 // IMAP UID
  folder: String,              // INBOX, Sent, Drafts, Trash, etc.
  from: { name, email },
  to: [{ name, email }],
  cc: [{ name, email }],
  subject: String,
  textBody: String,            // Plain text version
  htmlBody: String,            // HTML version
  date: Date,                  // When received
  sentDate: Date,              // From Date header
  isRead: Boolean,
  isFlagged: Boolean,
  hasAttachments: Boolean,
  attachments: [{ filename, contentType, size }],
  labels: [ObjectId],          // User-defined categories
  inReplyTo: String,           // Thread support
  references: [String],        // Thread support
  isDeleted: Boolean           // Soft delete
}
```

## 🚀 Next Steps to Get Real-Time Emails

### 1. Set Up Automatic Sync (Recommended)

Create a cron job on the server:

```bash
ssh root@69.164.244.165
crontab -e

# Add this line:
*/5 * * * * cd /var/www/ementech-website/backend && node sync-real-emails.js >> /var/log/email-sync.log 2>&1
```

### 2. Add Sync Button to Frontend

Add a "Sync Now" button to the email dashboard that calls:

```javascript
await fetch('/api/email/sync/INBOX', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### 3. Send Real Emails to Test

Send an email to admin@ementech.co.ke from an external account (Gmail, Outlook, etc.) then:
1. Wait 5 minutes (for cron) OR
2. Run the sync script manually
3. Refresh your email dashboard
4. The new email should appear

## 🐛 Troubleshooting

### If emails don't appear after syncing:

1. **Check the database**:
   ```bash
   cd /var/www/ementech-website/backend
   node check-db-emails.js
   ```

2. **Check the IMAP server**:
   ```bash
   ssh root@69.164.244.165
   doveadm fetch -u admin@ementech.co.ke all mailbox INBOX
   ```

3. **Check the logs**:
   ```bash
   ssh root@69.164.244.165
   pm2 logs ementech-backend --lines 50
   ```

### Common Issues:

**Issue**: "No email account configured"
- **Solution**: The UserEmail document is missing. Check if admin has an email account in database.

**Issue**: "IMAP connection error"
- **Solution**: Check IMAP credentials. Test with:
  ```bash
  doveadm auth test admin@ementech.co.ke Admin2026!
  ```

**Issue**: Emails show in IMAP but not in dashboard
- **Solution**: Run the sync script manually to copy them to database

## 📁 Key Files

### Backend
- `/var/www/ementech-website/backend/src/models/Email.js` - Email schema
- `/var/www/ementech-website/backend/src/models/UserEmail.js` - Email account config
- `/var/www/ementech-website/backend/src/controllers/emailController.js` - Email operations
- `/var/www/ementech-website/backend/sync-real-emails.js` - Manual sync script
- `/var/www/ementech-website/backend/check-db-emails.js` - Database checker

### Frontend
- `/var/www/ementech-website/src/contexts/EmailContext.jsx` - Email state management
- `/var/www/ementech-website/src/pages/EmailInbox.jsx` - Email dashboard
- `/var/www/ementech-website/src/services/emailService.js` - API client
- `/var/www/ementech-website/src/components/email/` - Email components

## 📌 Summary

✅ **Email system is fully functional**
- IMAP server is configured and receiving emails
- Email account is set up in database
- Sync process works correctly
- Dashboard displays emails from database

⚠️ **Missing piece: Automatic sync**
- Emails must be manually synced from IMAP to database
- Frontend has no "Sync" button
- No automatic background sync running

🎯 **To see real emails**:
1. Set up cron job OR add sync button to frontend
2. Send test email to admin@ementech.co.ke
3. Run sync manually OR wait for cron
4. Refresh dashboard

The system is working as designed - it just needs the sync automation enabled!
