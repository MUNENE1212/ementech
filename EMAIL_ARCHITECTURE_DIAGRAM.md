# Email System Architecture Visualization

## Current State (What Exists)

```
┌─────────────────────────────────────────────────────────────────┐
│                        INTERNET                                 │
└────────────────────────────┬────────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │   DNS System    │
                    └────────┬────────┘
                             │
            ┌────────────────┼────────────────┐
            │                │                │
    ┌───────▼──────┐  ┌──────▼───────┐  ┌────▼────────┐
    │ementech.co.ke│  │dumuwaks.     │  │admin.ementech│
    │   ✅ WORKING  │  │ementech.co.ke│  │.co.ke       │
    │              │  │  ✅ WORKING  │  │  ❌ MISSING  │
    │→69.164.244.165│  │→69.164.244.165│  │→NO DNS RECORD│
    └───────┬──────┘  └──────┬───────┘  └─────────────┘
            │                │
            │                │
    ┌───────▼────────────────▼──────────────────────────────┐
    │              VPS (69.164.244.165)                      │
    │                                                        │
    │  ┌────────────────────────────────────────────────┐  │
    │  │              Nginx Reverse Proxy               │  │
    │  ├────────────────────────────────────────────────┤  │
    │  │ ✅ ementech.co.conf (ementech.co.ke)           │  │
    │  │ ✅ dumuwaks.conf (dumuwaks.ementech.co.ke)     │  │
    │  │ ❌ admin.conf (MISSING - admin.ementech.co.ke) │  │
    │  └───────────────────┬────────────────────────────┘  │
    │                      │                                 │
    │  ┌───────────────────┼────────────────────────────┐  │
    │  │                   │                            │  │
    │  │  ┌────────▼────────┴───────────┐              │  │
    │  │  │   Frontend Static Files     │              │  │
    │  │  ├─────────────────────────────┤              │  │
    │  │  │ /var/www/ementech-website/  │              │  │
    │  │  │ current/                     │              │  │
    │  │  │ ├── index.html               │              │  │
    │  │  │ ├── assets/                  │              │  │
    │  │  │ └── ...                      │              │  │
    │  │  └─────────────────────────────┘              │  │
    │  │                   │                            │  │
    │  │  ┌────────▼────────┴───────────┐              │  │
    │  │  │  Backend API Proxy (/api)   │              │  │
    │  │  └────────┬────────────────────┘              │  │
    │  │           │                                    │  │
    │  │  ┌────────▼───────────────────┐               │  │
    │  │  │ Socket.IO Proxy (/socket.io)│              │  │
    │  │  └────────┬───────────────────┘               │  │
    │  │           │                                    │  │
    │  └───────────┼────────────────────────────────────┘  │
    │              │                                        │
    │  ┌───────────▼─────────────────────────────┐        │
    │  │   PM2 Process Manager                   │        │
    │  ├─────────────────────────────────────────┤        │
    │  │ ✅ ementech-backend (PID: 77196)        │        │
    │  │    Port: 5001                           │        │
    │  │    Status: online                       │        │
    │  │    Uptime: 3h                           │        │
    │  │                                         │        │
    │  │ ✅ dumuwaks-backend (PID: 76684)        │        │
    │  │    Port: 5000                           │        │
    │  │    Status: online                       │        │
    │  │                                         │        │
    │  │ ❌ admin-backend                        │        │
    │  │    NOT RUNNING - NOT DEPLOYED           │        │
    │  └─────────────────────────────────────────┘        │
    │                                                      │
    │  ┌────────────────────────────────────────────────┐│
    │  │   EmenTech Backend (Port 5001)                  ││
    │  ├────────────────────────────────────────────────┤│
    │  │ ✅ Health Check: /api/health                   ││
    │  │ ✅ Email Routes: /api/email/*                   ││
    │  │ ✅ Auth Routes: /api/auth/*                     ││
    │  │ ✅ Chat Routes: /api/chat/*                     ││
    │  │ ✅ Lead Routes: /api/leads/*                    ││
    │  │ ✅ Socket.IO: Real-time email updates           ││
    │  │ ✅ IMAP Watcher: Monitors mail.ementech.co.ke  ││
    │  │ ✅ SMTP Service: Sends via mail.ementech.co.ke ││
    │  │ ⚠️  CORS: Only allows ementech.co.ke          ││
    │  └────────────────────────────────────────────────┘│
    │                                                      │
    │  ┌────────────────────────────────────────────────┐│
    │  │   MongoDB (Local Port 27017)                   ││
    │  ├────────────────────────────────────────────────┤│
    │  │ ✅ Database: ementech                          ││
    │  │ ✅ Collections:                                ││
    │  │    - emails (email messages)                   ││
    │  │    - users (user accounts)                     ││
    │  │    - useremails (email credentials)            ││
    │  │    - contacts, labels, folders                 ││
    │  └────────────────────────────────────────────────┘│
    └──────────────────────────────────────────────────────┘

    ┌─────────────────────────────────────────────────────┐
    │           Email Infrastructure                      │
    ├─────────────────────────────────────────────────────┤
    │  ✅ mail.ementech.co.ke (Email Server)              │
    │     IMAP: 993 (for receiving emails)                │
    │     SMTP: 587 (for sending emails)                  │
    │                                                      │
    │  ✅ Email Account:                                  │
    │     admin@ementech.co.ke                            │
    │     Password: JpeQQEbwpzQDe8o5OPst                  │
    └─────────────────────────────────────────────────────┘
```

---

## Email System Flow (Working on ementech.co.ke)

```
┌────────────────────────────────────────────────────────────────┐
│                    USER FLOW                                   │
└────────────────────────────────────────────────────────────────┘

1. USER VISITS EMAIL
   └─► https://ementech.co.ke/email
       └─► Served by Nginx (static files)
           └─► Loads React app (EmailInbox.jsx)

2. USER AUTHENTICATES
   └─► Login form sends credentials
       └─► POST /api/auth/login
           └─► Backend validates with MongoDB
               └─► Returns JWT token
                   └─► Stored in localStorage

3. EMAIL APP INITIALIZES
   └─► EmailContext.jsx loads
       ├─► Checks for JWT token
       ├─► Initializes Socket.IO connection
       │   └─► Connects to wss://ementech.co.ke/socket.io/
       │       └─► Authenticated with JWT
       └─► Fetches initial data
           ├─► GET /api/email?folder=INBOX
           ├─► GET /api/email/folders/list
           └─► GET /api/email/labels/list

4. REAL-TIME EMAIL UPDATES
   └─► IMAP Watcher Service (Backend)
       ├─► Connects to mail.ementech.co.ke:993
       ├─► Monitors INBOX for new emails
       └─► When new email arrives:
           ├─► Downloads via IMAP
           ├─► Saves to MongoDB
           └─► Emits Socket.IO event: 'new_email'
               └─► All connected clients receive update
                   └─► UI updates in real-time!

5. SENDING EMAILS
   └─► User composes email
       └─► Clicks Send
           └─► POST /api/email/send
               └─► Backend:
                   ├─► Validates recipients
                   ├─► Connects to mail.ementech.co.ke:587
                   ├─► Sends via SMTP
                   ├─► Saves to MongoDB (Sent folder)
                   └─► Returns success
                   └─► UI shows "Email sent"

6. EMAIL ACTIONS
   └─► User can:
       ├─► Mark read/unread (PUT /api/email/:id/read)
       ├─► Star/flag (PUT /api/email/:id/flag)
       ├─► Move to folder (PUT /api/email/:id/folder)
       ├─► Delete (DELETE /api/email/:id)
       ├─► Search (GET /api/email/search?q=...)
       └─► Manage labels/contacts
```

---

## Why admin.ementech.co.ke Doesn't Work

```
┌──────────────────────────────────────────────────────────┐
│          WHAT USER EXPECTS (But Doesn't Exist)          │
└──────────────────────────────────────────────────────────┘

User types: https://admin.ementech.co.ke
    │
    ▼
❌ DNS Lookup Fails
    │
    ├─► No A record for admin.ementech.co.ke
    ├─► Browser can't find IP address
    └─► Error: "Could not resolve host"

    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

IF DNS was fixed:
    │
    ▼
❌ Nginx Configuration Missing
    │
    ├─► Nginx doesn't know how to handle admin.ementech.co.ke
    ├─► No server block for this domain
    └─► Error: "404 Not Found" or "502 Bad Gateway"

    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

IF Nginx was configured:
    │
    ▼
❌ Admin Dashboard Empty
    │
    ├─► /var/www/admin-dashboard/current/ is empty
    ├─► No frontend files to serve
    └─► Error: "404 Not Found" or blank page

    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

IF Frontend was deployed:
    │
    ▼
❌ CORS Blocks API Requests
    │
    ├─► Frontend tries: fetch('/api/email')
    ├─► Backend checks CORS origin
    ├─► Origin: https://admin.ementech.co.ke
    ├─► Allowed: https://ementech.co.ke
    └─► Error: "CORS policy: Not allowed by CORS"
```

---

## The Fix: Two Paths

### Path 1: Use Main Site (RECOMMENDED)

```
┌──────────────────────────────────────────────────────────┐
│              SIMPLE PATH - 15-30 MINUTES                 │
└──────────────────────────────────────────────────────────┘

1. Deploy Email Components to Main Site
   └─► Email features already exist in ementech.co.ke codebase
   └─► Just need to build and deploy:
       ├─► /src/pages/EmailInbox.jsx
       ├─► /src/contexts/EmailContext.jsx
       ├─► /src/services/emailService.js
       └─► /src/components/email/*

2. Add Route to App.tsx (if missing)
   └─► <Route path="/email" element={<EmailInbox />} />

3. Build & Deploy
   └─► npm run build
   └─► Upload to /var/www/ementech-website/current/

4. Access Email
   └─► https://ementech.co.ke/email

5. Add Authentication (Optional)
   └─► Protect /email route with admin-only middleware

✅ DONE - Email working at https://ementech.co.ke/email
```

### Path 2: Build Separate Admin (COMPLEX)

```
┌──────────────────────────────────────────────────────────┐
│           COMPLEX PATH - 2-4 HOURS                       │
└──────────────────────────────────────────────────────────┘

1. Add DNS A Record (5-30 min for propagation)
   └─► admin.ementech.co.ke → 69.164.244.165

2. Create Nginx Config
   └─► /etc/nginx/sites-available/admin.ementech.co.ke.conf

3. Obtain SSL Certificate
   └─► certbot --nginx -d admin.ementech.co.ke

4. Build Admin Frontend
   └─► Create React app or move email components
   └─► npm run build

5. Deploy Admin Frontend
   └─► Upload to /var/www/admin-dashboard/current/

6. Update CORS
   └─► Add admin.ementech.co.ke to CORS_ORIGIN
   └─► pm2 restart ementech-backend

7. Test Complete System
   └─► DNS, nginx, SSL, frontend, backend, CORS

✅ DONE - Email working at https://admin.ementech.co.ke
```

---

## File Locations Reference

### LOCAL (Development Machine)
```
/media/munen/muneneNT/ementech/ementech-website/
├── backend/
│   └── src/
│       ├── routes/email.routes.js          # Email API endpoints
│       ├── controllers/emailController.js  # Email logic
│       ├── models/Email.js                 # Email data model
│       ├── services/imapWatcher.js         # IMAP monitoring
│       ├── config/socket.js                # Socket.IO setup
│       └── server.js                       # Backend entry point
│
└── src/
    ├── pages/EmailInbox.jsx                # Email UI page
    ├── contexts/EmailContext.jsx           # Email state management
    ├── services/emailService.js            # Email API client
    ├── components/email/                   # Email components
    └── styles/email.css                    # Email styles

ADMIN DASHBOARD (EMPTY):
├── admin-dashboard/
│   ├── frontend/  # EMPTY - No code
│   └── backend/   # EMPTY - No code
```

### REMOTE (VPS Server)
```
root@69.164.244.165:/var/www/

ementech-website/               ✅ WORKING
├── backend/                    # Backend application
│   ├── src/                    # Source code
│   ├── .env                    # Environment variables
│   └── node_modules/
├── current/                    # Frontend build output
│   ├── index.html
│   └── assets/
└── frontend/                   # Previous builds

admin-dashboard/                ❌ EMPTY
├── backend/                    # EMPTY - No code
├── current/                    # EMPTY - No code
├── frontend/                   # EMPTY - No code
└── releases/                   # EMPTY
```

---

## Email System Features

### ✅ IMPLEMENTED & WORKING
- Fetch emails from database
- Sync emails from IMAP server
- Send emails via SMTP
- Real-time Socket.IO updates
- Mark as read/unread
- Star/flag emails
- Move to folders
- Delete emails (soft delete)
- Search emails
- Create/manage labels
- Create/manage contacts
- Multiple email accounts
- Attachment support
- HTML email rendering
- WCAG 2.1 AA accessibility

### 📧 EMAIL PROVIDER
- mail.ementech.co.ke
- IMAP: port 993 (TLS)
- SMTP: port 587 (STARTTLS)
- Account: admin@ementech.co.ke

### 🔌 REAL-TIME FEATURES
- Socket.IO for instant updates
- IMAP watcher monitors inbox
- New emails pushed immediately
- Email updates sync across clients
- Read/unread status syncs
- Email deletions propagate

---

## Decision Recommendation

### GO WITH PATH 1 - Main Site

**Why?**
1. ✅ Email system already exists and works
2. ✅ Just need to deploy frontend components
3. ✅ Faster (15-30 min vs 2-4 hours)
4. ✅ Simpler architecture
5. ✅ Easier to maintain
6. ✅ Less to go wrong

**How?**
1. Build frontend: `npm run build`
2. Deploy: `scp dist/* root@69.164.244.165:/var/www/ementech-website/current/`
3. Access: `https://ementech.co.ke/email`
4. Login with admin credentials
5. Done!

**When to use Path 2 (Separate Admin)?**
Only if you need:
- Completely separate admin interface
- Different authentication system
- Custom admin-only features
- Isolated admin dashboard

But honestly, you can achieve all this with just protecting the `/email` route with admin middleware.

---

**For detailed investigation**: `ADMIN_EMAIL_INVESTIGATION_REPORT.md`
**For quick fix steps**: `ADMIN_EMAIL_QUICK_FIX.md`
