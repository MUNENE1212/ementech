# CORS & Email Setup - Documentation Index

**Implementation Date:** 2026-01-20
**Status:** ✅ COMPLETE

---

## Quick Links

### 🚀 Getting Started
- **[QUICK_START_FOUNDERS.md](QUICK_START_FOUNDERS.md)** - Quick reference for founder login and first steps
- **[FOUNDER_CREDENTIALS.md](FOUNDER_CREDENTIALS.md)** - Founder account credentials and setup details

### 📋 Complete Documentation
- **[CORS_EMAIL_SETUP_COMPLETE.md](CORS_EMAIL_SETUP_COMPLETE.md)** - Full implementation documentation with technical details
- **[IMPLEMENTATION_SUMMARY.txt](IMPLEMENTATION_SUMMARY.txt)** - Executive summary of all changes

---

## What Was Implemented

### Task 1: Fix CORS and Axios Errors
- ✅ Backend CORS verified and working (already configured)
- ✅ Frontend proxy added for development
- ✅ Socket.IO CORS properly configured
- ✅ Production-ready configuration

**Files Modified:**
- `/vite.config.ts` - Added proxy configuration
- `/src/App.tsx` - Added SettingsPage route

### Task 2: Founder Email Accounts
- ✅ 3 MongoDB user accounts created (Admin role)
- ✅ 3 email accounts created on mail server
- ✅ Password change API verified (already working)
- ✅ Settings page component created
- ✅ Complete documentation provided

**Files Created:**
- `/backend/seed-founders.js` - Seed script for founder accounts
- `/src/pages/SettingsPage.jsx` - Full-featured settings page
- `/FOUNDER_CREDENTIALS.md` - Credentials documentation
- `/CORS_EMAIL_SETUP_COMPLETE.md` - Complete implementation guide
- `/QUICK_START_FOUNDERS.md` - Quick start guide

---

## Founder Accounts

### Account 1: Munene (CEO)
- **Email:** munene@ementech.co.ke
- **Password:** EmenTech2026!Munene
- **Login:** https://ementech.co.ke/login
- **Role:** Admin

### Account 2: Co-founder
- **Email:** founder2@ementech.co.ke
- **Password:** EmenTech2026!Founder2
- **Login:** https://ementech.co.ke/login
- **Role:** Admin

### Account 3: CTO
- **Email:** cto@ementech.co.ke
- **Password:** EmenTech2026!CTO
- **Login:** https://ementech.co.ke/login
- **Role:** Admin

⚠️ **IMPORTANT:** Change passwords immediately after first login!

---

## Key Features

### 1. Settings Page (/settings)
- **Profile Tab:** Update name, email, department
- **Security Tab:** Change password with validation
- **Notifications Tab:** Configure alert preferences
- **Display Tab:** Theme, language, timezone

### 2. Password Change API
- **Endpoint:** `PUT /api/auth/password`
- **Authentication:** Required (JWT token)
- **Validation:** Current password verification
- **Requirements:** Min 6 characters

### 3. Email Accounts
- **Server:** mail.ementech.co.ke
- **IMAP:** Port 993 (SSL/TLS)
- **SMTP:** Port 587 (STARTTLS)
- **Folders:** INBOX, Sent, Drafts, Trash, Spam, Archive

---

## How to Use

### For Founders

1. **First Time Login:**
   ```bash
   Go to: https://ementech.co.ke/login
   Enter your email and password from FOUNDER_CREDENTIALS.md
   Click "Login"
   ```

2. **Change Password:**
   ```bash
   Go to: https://ementech.co.ke/settings
   Click "Security" tab
   Enter current password
   Enter new password (strong)
   Click "Update Password"
   ```

3. **Configure Email:**
   ```bash
   Go to: https://ementech.co.ke/email
   Click "Add Email Account"
   Enter IMAP/SMTP settings
   Click "Connect"
   ```

### For Developers

1. **Run Seed Script (if needed):**
   ```bash
   cd backend
   node seed-founders.js
   ```

2. **Start Development:**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev

   # Terminal 2 - Frontend
   npm run dev
   ```

3. **Build for Production:**
   ```bash
   npm run build
   ```

---

## Testing

### Test Login
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"munene@ementech.co.ke","password":"EmenTech2026!Munene"}'
```

### Test Password Change
```bash
TOKEN="<your_jwt_token>"

curl -X PUT http://localhost:5001/api/auth/password \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"currentPassword":"EmenTech2026!Munene","newPassword":"NewPassword123!"}'
```

### Test Email Connection
```bash
telnet mail.ementech.co.ke 993  # IMAP
telnet mail.ementech.co.ke 587  # SMTP
```

---

## Security Checklist

- [ ] Change all founder passwords immediately
- [ ] Enable HTTPS in production
- [ ] Configure firewall rules
- [ ] Set up monitoring and alerts
- [ ] Review access logs regularly
- [ ] Implement 2FA (future)
- [ ] Secure credential files
- [ ] Delete FOUNDER_CREDENTIALS.md after setup

---

## Troubleshooting

### CORS Errors
1. Check backend .env for CORS_ORIGIN
2. Verify nginx configuration
3. Clear browser cache
4. Check proxy settings in vite.config.ts

### Login Issues
1. Verify email and password
2. Check backend logs
3. Ensure MongoDB is running
4. Try incognito mode

### Email Issues
1. Verify mail server is running
2. Check credentials
3. Test IMAP/SMTP connection
4. Review Dovecot logs

---

## Support

**Technical Support:**
- Email: cto@ementech.co.ke
- Mail Server: 69.164.244.165

**Documentation:**
- Full Guide: [CORS_EMAIL_SETUP_COMPLETE.md](CORS_EMAIL_SETUP_COMPLETE.md)
- Quick Start: [QUICK_START_FOUNDERS.md](QUICK_START_FOUNDERS.md)
- Credentials: [FOUNDER_CREDENTIALS.md](FOUNDER_CREDENTIALS.md)

---

## File Locations

### Modified Files
```
/media/munen/muneneENT/ementech/ementech-website/vite.config.ts
/media/munen/muneneENT/ementech/ementech-website/src/App.tsx
```

### New Files
```
/media/munen/muneneENT/ementech/ementech-website/backend/seed-founders.js
/media/munen/muneneENT/ementech/ementech-website/src/pages/SettingsPage.jsx
/media/munen/muneneENT/ementech/ementech-website/FOUNDER_CREDENTIALS.md
/media/munen/muneneENT/ementech/ementech-website/CORS_EMAIL_SETUP_COMPLETE.md
/media/munen/muneneENT/ementech/ementech-website/QUICK_START_FOUNDERS.md
/media/munen/muneneENT/ementech/ementech-website/IMPLEMENTATION_SUMMARY.txt
```

---

## Status

✅ **All Tasks Complete**
✅ **Production Ready**
✅ **Fully Documented**
✅ **Tested and Verified**

**Ready for Deployment:** YES

---

**Last Updated:** 2026-01-20
**Version:** 1.0.0
