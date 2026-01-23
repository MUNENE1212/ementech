# EmenTech Local Development Setup

**Last Updated:** January 22, 2026
**Status:** Local Environment Configuration

---

## 📊 Current Project State

### Database Status

**Local MongoDB** (`mongodb://localhost:27017/ementech`) - ✅ Running

**Collection Counts:**
```
matchings: 48
interactions: 1
matchingpreferences: 2
leads: 1
analytics: 0
labels: 0
users: 12
transactions: 11
folders: 5
reviews: 0
posts: 9
supporttickets: 2
notifications: 9
emails: 6
pricingconfigs: 3
bookings: 28
portfolios: 0
contents: 0
aiinteractions: 0
contacts: 0
matchinginteractions: 37
messages: 5
useremails: 1
conversations: 2
```

**Critical Data:**
- **Admin User:** `admin@ementech.co.ke` (ID: `696e43568badd18d3c6be822`)
- **Email Account:** Exists but **IMAP not configured** (host/port empty)
- **Emails:** 6 emails exist but **userId field is empty**

### Issues Identified

1. **Email Account Configuration Missing**
   - Email account exists in database
   - IMAP host and port fields are empty
   - Need to configure: `mail.ementech.co.ke:993`

2. **Emails Not Linked to Users**
   - 6 emails in database
   - All have empty `userId` fields
   - Frontend can't display them due to user association

3. **Backend Configuration**
   - `.env` file has correct MongoDB URI (local)
   - Email credentials configured
   - Backend ready to run locally

---

## 🏗️ Architecture Overview

### Local Development Stack

```
┌─────────────────────────────────────────┐
│         Frontend (React/Vite)          │
│         http://localhost:5173          │
│  - Email Dashboard                     │
│  - Chat System                         │
│  - Admin Panel                         │
└─────────────────┬───────────────────────┘
                  │ HTTP
                  ↓
┌─────────────────────────────────────────┐
│      Backend (Node.js/Express)         │
│         http://localhost:5001          │
│  - API Routes                          │
│  - Email Controller                    │
│  - IMAP/SMTP Services                  │
│  - Authentication (JWT)                │
└─────────────┬───────────────────────────┘
              │
    ┌─────────┴─────────┐
    ↓                   ↓
┌──────────────┐  ┌─────────────────┐
│ Local MongoDB│  │ IMAP/SMTP Server│
│  :27017      │  │ mail.ementech   │
│  ementech db │  │    .co.ke       │
└──────────────┘  └─────────────────┘
```

### Key Technologies

**Frontend:**
- React 18 with TypeScript
- Vite (build tool)
- TailwindCSS (styling)
- React Router (navigation)
- Socket.IO Client (real-time)

**Backend:**
- Node.js (Express)
- MongoDB (Mongoose ODM)
- JWT (authentication)
- Nodemailer (SMTP)
- node-imap (IMAP)
- Socket.IO (real-time)
- PM2 (process manager)

**Email Infrastructure:**
- Postfix (SMTP server)
- Dovecot (IMAP server)
- Let's Encrypt SSL/TLS

---

## 🚀 Local Setup Instructions

### Prerequisites

```bash
# Check if required services are running
pgrep -l mongod    # MongoDB
pgrep -l node      # Node.js (if backend running)
```

### Step 1: Backend Setup

**1.1 Navigate to backend directory:**
```bash
cd /media/munen/muneneENT/ementech/ementech-website/backend
```

**1.2 Install dependencies (if needed):**
```bash
npm install
```

**1.3 Verify `.env` configuration:**
```bash
cat .env
```

Expected content:
```env
MONGODB_URI=mongodb://localhost:27017/ementech
PORT=5001
CLIENT_URL=http://localhost:5173
JWT_SECRET=your_jwt_secret_here
NODE_ENV=development

# Email Configuration
IMAP_HOST=mail.ementech.co.ke
IMAP_PORT=993
IMAP_USER=admin@ementech.co.ke
IMAP_PASS=JpeQQEbwpzQDe8o5OPst

SMTP_HOST=mail.ementech.co.ke
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=admin@ementech.co.ke
SMTP_PASS=JpeQQEbwpzQDe8o5OPst
```

**1.4 Start backend:**
```bash
npm run dev
```

Backend will run on: `http://localhost:5001`

**Verify backend is running:**
```bash
curl http://localhost:5001/api/health
```

### Step 2: Frontend Setup

**2.1 Navigate to project root:**
```bash
cd /media/munen/muneneENT/ementech/ementech-website
```

**2.2 Install dependencies (if needed):**
```bash
npm install
```

**2.3 Start frontend:**
```bash
npm run dev
```

Frontend will run on: `http://localhost:5173`

**2.4 Access the application:**
```bash
# Open in browser
xdg-open http://localhost:5173
```

### Step 3: Fix Email Account Configuration

**The email account needs IMAP settings configured:**

Create a fix script:
```bash
cat > fix-email-config.cjs << 'EOF'
const mongoose = require('mongoose');
require('dotenv').config();

async function fixEmailConfig() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const admin = await mongoose.connection.db.collection('users')
      .findOne({ email: 'admin@ementech.co.ke' });

    console.log('Admin User:', admin._id);

    const result = await mongoose.connection.db.collection('useremails')
      .updateOne(
        { email: 'admin@ementech.co.ke' },
        {
          $set: {
            imapHost: 'mail.ementech.co.ke',
            imapPort: 993,
            smtpHost: 'mail.ementech.co.ke',
            smtpPort: 587,
            user: admin._id
          }
        }
      );

    console.log('Updated email account:', result.modifiedCount, 'document');

    // Verify
    const emailAccount = await mongoose.connection.db.collection('useremails')
      .findOne({ email: 'admin@ementech.co.ke' });

    console.log('\nEmail Account Configuration:');
    console.log('Email:', emailAccount.email);
    console.log('User ID:', emailAccount.user);
    console.log('IMAP:', emailAccount.imapHost + ':' + emailAccount.imapPort);
    console.log('SMTP:', emailAccount.smtpHost + ':' + emailAccount.smtpPort);

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

fixEmailConfig();
EOF

node fix-email-config.cjs
```

### Step 4: Fix Email User Associations

**Emails need to be linked to the admin user:**

```bash
cat > fix-email-users.cjs << 'EOF'
const mongoose = require('mongoose');
require('dotenv').config();

async function fixEmailUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const admin = await mongoose.connection.db.collection('users')
      .findOne({ email: 'admin@ementech.co.ke' });

    console.log('Admin User:', admin._id);

    const result = await mongoose.connection.db.collection('emails')
      .updateMany(
        { userId: { $exists: false } },
        { $set: { userId: admin._id } }
      );

    console.log('Updated emails:', result.modifiedCount, 'documents');

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

fixEmailUsers();
EOF

node fix-email-users.cjs
```

---

## 🔐 Authentication

### Local Login Credentials

```
Email: admin@ementech.co.ke
Password: Admin2026!
```

### Login API

```bash
# Get auth token
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ementech.co.ke","password":"Admin2026!"}'
```

Response:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "email": "admin@ementech.co.ke",
      "name": "EmenTech Admin"
    }
  }
}
```

---

## 📧 Testing Email System Locally

### Test 1: Backend Health Check

```bash
curl http://localhost:5001/api/health
```

### Test 2: Fetch Email Folders

```bash
TOKEN="your_token_here"

curl -X GET http://localhost:5001/api/email/folders \
  -H "Authorization: Bearer $TOKEN"
```

### Test 3: Sync Emails from IMAP

```bash
TOKEN="your_token_here"

curl -X POST http://localhost:5001/api/email/sync/INBOX \
  -H "Authorization: Bearer $TOKEN"
```

### Test 4: Get Emails from Database

```bash
TOKEN="your_token_here"

curl -X GET "http://localhost:5001/api/email?folder=INBOX&limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🐛 Troubleshooting

### Issue: MongoDB Connection Failed

**Check MongoDB is running:**
```bash
pgrep -l mongod
```

**If not running, start MongoDB:**
```bash
sudo systemctl start mongod
# OR
sudo service mongodb start
```

**Check MongoDB logs:**
```bash
sudo journalctl -u mongod -n 50
```

### Issue: Backend Port Already in Use

**Find process using port 5001:**
```bash
lsof -i :5001
```

**Kill the process:**
```bash
kill -9 <PID>
```

### Issue: IMAP Connection Timeout

**Test IMAP connectivity:**
```bash
telnet mail.ementech.co.ke 993
```

**Check firewall:**
```bash
sudo ufw status
```

**If needed, allow IMAP port:**
```bash
sudo ufw allow 993/tcp
```

### Issue: Emails Not Showing in Frontend

**1. Check browser console for errors**
- Press F12
- Look for red error messages

**2. Verify backend is responding:**
```bash
curl http://localhost:5001/api/health
```

**3. Check you're logged in:**
- Open DevTools → Application → Local Storage
- Look for `token` key
- If missing, login again

**4. Verify email account configuration:**
```bash
mongosh --quiet ementech --eval "
db.useremails.findOne({email: 'admin@ementech.co.ke'}, {imapHost: 1, imapPort: 1, smtpHost: 1, smtpPort: 1})
"
```

---

## 📁 Project Structure

### Backend (`/backend/`)

```
backend/
├── src/
│   ├── models/
│   │   ├── User.js              # User schema
│   │   ├── UserEmail.js         # Email account config
│   │   ├── Email.js             # Email message schema
│   │   ├── Lead.js              # Lead capture
│   │   └── ...
│   ├── controllers/
│   │   ├── authController.js    # Authentication
│   │   ├── emailController.js   # Email operations
│   │   └── ...
│   ├── routes/
│   │   ├── auth.routes.js       # Auth endpoints
│   │   ├── email.routes.js      # Email endpoints
│   │   └── ...
│   ├── services/
│   │   ├── imapService.js       # IMAP operations
│   │   ├── smtpService.js       # SMTP operations
│   │   └── imapWatcher.js       # IDLE support (FIXED)
│   ├── middleware/
│   │   └── auth.js              # JWT verification
│   └── config/
│       └── db.js                # MongoDB connection
├── .env                         # Environment variables
├── package.json
└── server.js                    # Entry point
```

### Frontend (`/src/`)

```
src/
├── pages/
│   ├── Home.jsx                 # Landing page
│   ├── Login.jsx                # Login page
│   ├── Register.jsx             # Registration
│   ├── EmailInbox.jsx           # Email dashboard
│   └── ...
├── components/
│   ├── auth/
│   │   ├── PrivateRoute.jsx     # Protected routes
│   │   └── ...
│   ├── email/
│   │   ├── EmailList.jsx        # Email list view
│   │   ├── EmailReader.jsx      # Email detail view
│   │   ├── EmailSidebar.jsx     # Folder navigation
│   │   ├── EmailComposer.jsx    # Compose email
│   │   └── EmailToolbar.jsx     # Email actions
│   ├── chat/
│   ├── lead-capture/
│   └── layout/
│       ├── Header.jsx
│       └── Footer.jsx
├── contexts/
│   ├── AuthContext.jsx          # Auth state
│   ├── EmailContext.jsx         # Email state
│   └── ChatContext.jsx          # Chat state
├── services/
│   ├── authService.js           # Auth API client
│   ├── emailService.js          # Email API client
│   └── chatService.js           # Chat API client
├── hooks/
│   ├── useAuth.js
│   ├── useEmail.js
│   └── ...
├── styles/
│   └── index.css
├── App.jsx                      # Root component
├── main.jsx                     # Entry point
└── ...
```

---

## 🔧 Development Workflow

### Running Both Frontend and Backend

**Terminal 1 - Backend:**
```bash
cd /media/munen/muneneENT/ementech/ementech-website/backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd /media/munen/muneneENT/ementech/ementech-website
npm run dev
```

**Access Application:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:5001
- Email Dashboard: http://localhost:5173/email

### Hot Reloading

Both Vite (frontend) and the dev server (backend with nodemon) support hot reloading:
- Frontend changes auto-refresh in browser
- Backend changes auto-restart server

---

## 📊 API Endpoints

### Authentication

```
POST   /api/auth/register        Register new user
POST   /api/auth/login           Login user
GET    /api/auth/me              Get current user
PUT    /api/auth/profile         Update profile
```

### Email

```
GET    /api/email/folders        Get email folders
GET    /api/email                Get emails (with filters)
GET    /api/email/:id            Get single email
POST   /api/email/sync/:folder   Sync from IMAP
POST   /api/email/send           Send email
PUT    /api/email/:id            Update email (read, star, etc.)
DELETE /api/email/:id            Delete email
POST   /api/email/move           Move to folder
```

### Health Check

```
GET    /api/health               Server status
```

---

## 🚨 Known Issues & Fixes Applied

### ✅ Fixed: IMAP Watcher Crash

**Issue:** Backend crashing with `TypeError: Cannot read properties of undefined (reading 'includes')`

**Location:** `backend/src/services/imapWatcher.js:81`

**Fix Applied:**
```javascript
// Before
if (box.capabilities.includes('IDLE')) {

// After
if (box.capabilities && box.capabilities.includes('IDLE')) {
```

**Status:** ✅ Fixed locally

### ✅ Fixed: Postfix SASL Authentication

**Issue:** External emails failing with "fatal: no SASL authentication mechanisms"

**Fix Applied:**
```bash
postconf -e 'smtpd_sasl_auth_enable=no'
```

**Status:** ✅ Fixed on VPS

### ✅ Implemented: Let's Encrypt SSL Certificate

**Issue:** Self-signed certificate causing email delivery problems

**Fix Applied:**
- Obtained Let's Encrypt certificate for `mail.ementech.co.ke`
- Configured Postfix and Dovecot with valid SSL
- Certificate valid: January 21, 2026 - April 21, 2026

**Status:** ✅ Implemented on VPS

### ⚠️ Pending: Email Account Configuration (Local)

**Issue:** Email account has empty IMAP/SMTP configuration

**Fix Required:** Run the fix-email-config.cjs script (see Step 3 above)

**Status:** ⚠️ Needs to be applied locally

### ⚠️ Pending: Email User Associations (Local)

**Issue:** Emails in database have empty `userId` fields

**Fix Required:** Run the fix-email-users.cjs script (see Step 4 above)

**Status:** ⚠️ Needs to be applied locally

---

## 📈 Next Steps

1. ✅ Document current state
2. ⏳ Fix email account configuration locally
3. ⏳ Fix email user associations locally
4. ⏳ Test email sync locally
5. ⏳ Verify email sending locally
6. ⏳ Test email dashboard functionality
7. ⏳ Implement automatic email sync (cron job)
8. ⏳ Add real-time email notifications (Socket.IO)

---

## 🔗 Useful Commands

### MongoDB

```bash
# Connect to MongoDB shell
mongosh ementech

# List collections
db.getCollectionNames()

# Count documents
db.emails.countDocuments()
db.users.countDocuments()

# Query specific data
db.emails.find({folder: 'INBOX'}).limit(5)

# Update documents
db.emails.updateMany({userId: {$exists: false}}, {$set: {userId: ObjectId("...")}})
```

### Backend

```bash
# Start backend
npm run dev

# Start with PM2 (production-like)
pm2 start server.js --name ementech-backend

# View logs
pm2 logs ementech-backend

# Restart
pm2 restart ementech-backend
```

### Frontend

```bash
# Start frontend
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 📞 Support & Debugging

### Check Logs

**Backend logs:**
```bash
# If using npm run dev
# Logs appear directly in terminal

# If using PM2
pm2 logs ementech-backend --lines 50
```

**MongoDB logs:**
```bash
sudo journalctl -u mongod -n 50
```

**System logs:**
```bash
dmesg | tail
journalctl -xe
```

### Test Connectivity

**Test backend API:**
```bash
curl http://localhost:5001/api/health
```

**Test IMAP connection:**
```bash
openssl s_client -connect mail.ementech.co.ke:993 -crlf
```

**Test SMTP connection:**
```bash
openssl s_client -connect mail.ementech.co.ke:587 -starttls smtp -crlf
```

---

## 📝 Notes

- **Local MongoDB contains all production data** - 22 collections with substantial data
- **Email system partially configured** - needs IMAP settings and user associations
- **Backend ready to run** - has all dependencies and correct configuration
- **Frontend ready to run** - Vite dev server configured
- **Email infrastructure on VPS** - Postfix, Dovecot, SSL all working

---

**Document Created:** January 22, 2026
**Environment:** Local Development
**Database:** MongoDB (local)
**Status:** ⚠️ Configuration Required
