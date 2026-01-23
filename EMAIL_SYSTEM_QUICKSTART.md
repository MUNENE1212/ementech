# EmenTech Email System - Quick Start Guide

## ✅ System Status: FULLY OPERATIONAL

Your email system is now fully configured and working! Here's everything you need to know.

---

## 🎯 What Was Set Up

### 1. **Email Account Configuration**
- **Email:** admin@ementech.co.ke
- **IMAP:** mail.ementech.co.ke:993 (SSL/TLS)
- **SMTP:** mail.ementech.co.ke:587 (STARTTLS)
- **Status:** ✅ Active and synced
- **Auto-sync:** Enabled (every 5 minutes)

### 2. **Database**
- **Emails in IMAP:** 60 messages in INBOX
- **User:** admin@ementech.co.ke
- **Password:** Admin2026!
- **Email Account:** Properly linked to admin user

### 3. **Automatic Sync**
- **Cron Job:** Running every 5 minutes
- **Script:** `/var/www/ementech-website/backend/email-sync.sh`
- **Log File:** `/var/log/email-sync.log`
- **Status:** ✅ Active

### 4. **Frontend**
- **URL:** `https://ementech.co.ke/email`
- **Status:** ✅ Deployed and working
- **Blank Page Bug:** ✅ Fixed

### 5. **SSL Certificate**
- **Domain:** mail.ementech.co.ke
- **Type:** Let's Encrypt (valid, trusted certificate)
- **Issued:** January 21, 2026
- **Expires:** April 21, 2026
- **Auto-renewal:** ✅ Enabled
- **Status:** ✅ Configured and active
- **Postfix SMTP:** ✅ Using valid SSL
- **Dovecot IMAP:** ✅ Using valid SSL

---

## 🚀 How to Access Your Email

### Step 1: Clear Browser Cache
**IMPORTANT!** Your browser may be caching the old broken version.

**Hard Refresh:**
- Windows/Linux: `Ctrl + Shift + R`
- Mac: `Cmd + Shift + R`

**Or clear cache manually:**
1. Open DevTools (F12)
2. Right-click refresh button
3. Select "Empty Cache and Hard Reload"

### Step 2: Login
1. Go to: `https://ementech.co.ke/login`
2. Email: `admin@ementech.co.ke`
3. Password: `Admin2026!`

### Step 3: Access Email
Navigate to: `https://ementech.co.ke/email`

**Or click the "Email" link in your navigation menu**

---

## 📧 How Email Sync Works

### The Process

```
Incoming Email
    ↓
IMAP Server (mail.ementech.co.ke)
    ↓
Cron Job (every 5 minutes)
    ↓
Backend API (/api/email/sync/INBOX)
    ↓
MongoDB Database
    ↓
Frontend Dashboard
```

### What Happens Automatically

1. **Every 5 minutes**, the cron job runs:
   ```bash
   /var/www/ementech-website/backend/email-sync.sh
   ```

2. Script logs into the backend API

3. Backend connects to IMAP server

4. Fetches new emails from INBOX

5. Saves them to MongoDB database

6. Frontend displays them in the dashboard

### Manual Sync

You can also trigger a manual sync from the frontend:

1. Click the **"Sync"** button in the email dashboard
2. Or call the API directly:
   ```bash
   curl -X POST http://69.164.244.165:5001/api/email/sync/INBOX \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

---

## 📱 Using the Email Dashboard

### Features Available

#### 1. **View Emails**
- **Inbox** - All received emails
- **Sent** - Emails you've sent
- **Drafts** - Draft emails
- **Archive** - Archived emails
- **Trash** - Deleted emails
- **Starred** - Flagged important emails

#### 2. **Compose New Email**
1. Click the **"Compose"** button (top-left)
2. Fill in:
   - **To:** Recipient email address
   - **Subject:** Email subject
   - **Body:** Email message
3. Click **"Send"**

#### 3. **Reply/Forward**
- **Reply** - Reply to sender
- **Reply All** - Reply to all recipients
- **Forward** - Forward email to someone else

#### 4. **Manage Emails**
- **Star** - Mark as important (click star icon)
- **Read/Unread** - Toggle read status
- **Delete** - Move to trash
- **Archive** - Archive email
- **Move to Folder** - Organize into folders
- **Add Labels** - Categorize with custom labels

#### 5. **Keyboard Shortcuts**
- **C** - Compose new email
- **1-6** - Switch folders (Inbox, Starred, Sent, Drafts, Archive, Trash)
- **Ctrl/Cmd + K** - Focus search
- **Escape** - Close composer or deselect email

---

## 🧪 Testing Your Email System

### Test 1: Send an Email to Yourself

1. Go to `https://ementech.co.ke/email`
2. Click **"Compose"**
3. To: `admin@ementech.co.ke`
4. Subject: `Test Email`
5. Body: `This is a test email`
6. Click **"Send"**

**Expected Result:**
- Email appears in Sent folder immediately
- Email appears in Inbox within 5 minutes (when cron runs)

### Test 2: Receive External Email

1. Send an email from your personal Gmail/Outlook to:
   ```
   admin@ementech.co.ke
   ```

2. Wait 5 minutes (for cron job)

3. Refresh your email dashboard

**Expected Result:**
- New email appears in Inbox
- You'll see sender's name and subject
- Unread count indicator shows

### Test 3: Check Sync Logs

View the automatic sync logs:

```bash
ssh root@69.164.244.165
tail -f /var/log/email-sync.log
```

**Expected Output:**
```
[2026-01-21 17:00:00] Starting email sync...
[2026-01-21 17:00:05] Response: {"success":true,"message":"Emails synced successfully"}
[2026-01-21 17:00:05] Email sync completed
```

---

## 🔧 Troubleshooting

### Issue: "No Email Account Configured"

**Cause:** Email account not linked to your user

**Solution:**
```bash
ssh root@69.164.244.165
cd /var/www/ementech-website/backend
node fix-email-account.cjs
```

### Issue: Emails Not Appearing

**Check 1:** Is cron job running?
```bash
ssh root@69.164.244.165
crontab -l | grep email-sync
```

**Check 2:** View sync logs
```bash
ssh root@69.164.244.165
tail -50 /var/log/email-sync.log
```

**Check 3:** Test IMAP connection
```bash
ssh root@69.164.244.165
doveadm auth test admin@ementech.co.ke JpeQQEbwpzQDe8o5OPst
```

### Issue: Can't Send Email

**Check 1:** Backend running?
```bash
ssh root@69.164.244.165
pm2 status | grep ementech-backend
```

**Check 2:** SMTP settings
```bash
ssh root@69.164.244.165
cat /var/www/ementech-website/backend/.env | grep SMTP
```

### Issue: Blank Page

**Solution:** Clear browser cache (Ctrl+Shift+R)

### Issue: "toLowerCase" Error

**Cause:** Old JavaScript cached

**Solution:** Hard refresh browser
- Windows/Linux: `Ctrl + Shift + R`
- Mac: `Cmd + Shift + R`

---

## 📊 System Architecture

### Components

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                     │
│              https://ementech.co.ke/email               │
│  - EmailInbox component                                  │
│  - EmailContext (state management)                      │
│  - EmailService (API client)                            │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP/HTTPS
                     ↓
┌─────────────────────────────────────────────────────────┐
│              Backend API (Node.js/Express)              │
│              Port 5001 (PM2 managed)                    │
│  - /api/email/* routes                                  │
│  - Email controller                                     │
│  - IMAP/SMTP services                                   │
└────────────┬────────────────────────────────────────────┘
             │
    ┌────────┴────────┐
    ↓                 ↓
┌─────────┐     ┌──────────────┐
│ MongoDB │     │ IMAP Server  │
│  Atlas  │     │  Dovecot     │
│         │     │ mail.ementech│
└─────────┘     │    .co.ke    │
                └──────────────┘
```

### Data Flow

**Receiving Email:**
```
External Sender
    ↓
IMAP Server (mail.ementech.co.ke:993)
    ↓
Cron Job (every 5 min)
    ↓
Backend API (/api/email/sync/INBOX)
    ↓
MongoDB (emails collection)
    ↓
Frontend Dashboard (via API call)
```

**Sending Email:**
```
Frontend Compose
    ↓
Backend API (/api/email/send)
    ↓
SMTP Server (mail.ementech.co.ke:587)
    ↓
External Recipient
    ↓
Copy to MongoDB (Sent folder)
    ↓
Frontend Dashboard
```

---

## 🔐 Security Notes

### Credentials Used

**Email Account:**
- Email: `admin@ementech.co.ke`
- IMAP Password: `JpeQQEbwpzQDe8o5OPst` (encrypted in database)
- SMTP Password: `JpeQQEbwpzQDe8o5OPst` (encrypted in database)

**Admin User:**
- Email: `admin@ementech.co.ke`
- Password: `Admin2026!`
- JWT Token: 7-day expiration

### Encryption

- IMAP/SMTP passwords stored with **AES-256-CBC encryption**
- JWT tokens for authentication
- HTTPS/TLS for all connections
- **Valid SSL/TLS certificate** for mail.ementech.co.ke (Let's Encrypt)
- Secure SMTP (STARTTLS) on port 587
- Secure IMAP (SSL/TLS) on port 993

---

## 📁 Key Files & Locations

### Backend
```
/var/www/ementech-website/backend/
├── src/
│   ├── models/
│   │   ├── Email.js           # Email schema
│   │   ├── UserEmail.js       # Email account config
│   │   └── User.js            # User schema
│   ├── controllers/
│   │   └── emailController.js  # Email operations
│   └── routes/
│       └── email.routes.js     # API routes
├── sync-real-emails.js         # Manual sync script
├── email-sync.sh               # Cron job script
└── .env                        # Environment variables
```

### Frontend
```
/var/www/ementech-website/src/
├── pages/
│   └── EmailInbox.jsx          # Email dashboard
├── contexts/
│   └── EmailContext.jsx        # State management
├── services/
│   └── emailService.js         # API client
└── components/email/
    ├── EmailList.jsx           # Email list
    ├── EmailReader.jsx         # Email viewer
    ├── EmailSidebar.jsx        # Navigation
    ├── EmailToolbar.jsx        # Actions
    └── EmailComposer.jsx       # Compose
```

### Database
```
MongoDB Atlas (ementech)
├── users                       # User accounts
├── userEmails                  # Email configurations
└── emails                      # Email messages
```

---

## 🎉 What's Working Now

### ✅ Fully Functional

1. **Email Reception**
   - IMAP server receiving emails
   - Automatic sync every 5 minutes
   - Emails stored in MongoDB
   - Displayed in frontend dashboard

2. **Email Composition**
   - Compose new emails
   - Reply to emails
   - Forward emails
   - Save drafts

3. **Email Management**
   - Star/flag emails
   - Mark read/unread
   - Delete emails
   - Archive emails
   - Move to folders
   - Add labels

4. **Real-time Updates**
   - Socket.IO connected
   - Ready for instant notifications

5. **User Interface**
   - Clean, modern design
   - Responsive (mobile-friendly)
   - Keyboard shortcuts
   - Accessibility (WCAG 2.1 AA)

---

## 🚀 Next Steps (Optional Enhancements)

### Future Improvements

1. **Email Attachments**
   - Upload files
   - Download attachments
   - Preview images

2. **Email Threading**
   - Group conversations
   - Show email chains
   - Thread navigation

3. **Search & Filters**
   - Full-text search
   - Advanced filters
   - Saved searches

4. **Multiple Email Accounts**
   - Add more email addresses
   - Switch between accounts
   - Unified inbox

5. **Email Signatures**
   - Custom signatures
   - Rich text formatting
   - Multiple signatures

6. **Vacation Auto-Responder**
   - Out-of-office replies
   - Custom message
   - Date range

---

## 📞 Support

### If You Need Help

1. **Check Logs:**
   ```bash
   ssh root@69.164.244.165
   pm2 logs ementech-backend --lines 50
   tail -f /var/log/email-sync.log
   ```

2. **Test Connection:**
   ```bash
   curl https://ementech.co.ke/api/health
   ```

3. **View System Status:**
   ```bash
   ssh root@69.164.244.165
   pm2 status
   crontab -l
   ```

---

## ✅ Summary

**Your email system is now FULLY OPERATIONAL!**

- ✅ Email account configured
- ✅ IMAP connection working
- ✅ SMTP connection working
- ✅ Automatic sync running
- ✅ Frontend deployed
- ✅ All bugs fixed

**Access your email at:**
```
https://ementech.co.ke/email
```

**Login credentials:**
```
Email: admin@ementech.co.ke
Password: Admin2026!
```

**What to do now:**
1. Clear browser cache (Ctrl+Shift+R)
2. Login to your account
3. Navigate to /email route
4. Start sending and receiving emails!

---

**Created:** January 21, 2026
**System:** EmenTech Email System
**Status:** ✅ PRODUCTION READY
