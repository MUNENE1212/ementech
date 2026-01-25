# 📧 Real-Time Email System with Socket.IO

## How It Works

Your email system now uses **Socket.IO for real-time email delivery** - no more waiting for cron jobs!

### Architecture

```
┌─────────────────┐
│  Incoming Email│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   IMAP Server   │ ← Email arrives here
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  IMAP Watcher   │ ← Watches in real-time (IDLE or polling)
│  (Background)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   MongoDB       │ ← Stores email
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Socket.IO     │ ← Pushes to connected clients instantly
│  (Real-time)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Browser       │ ← Email appears instantly!
│  (Frontend)     │
└─────────────────┘
```

## Real-Time Features

### 1. IMAP Watcher Service
**Location**: `/var/www/ementech-website/backend/src/services/imapWatcher.js`

The watcher runs continuously in the background and:

- **Uses IMAP IDLE** when available (instant push notifications)
- **Falls back to polling** every 30 seconds if IDLE not supported
- **Monitors all active users** automatically
- **Fetches new emails** as soon as they arrive
- **Emits Socket.IO events** to push emails to clients

### 2. Socket.IO Events

**Backend → Frontend Events:**

```javascript
// New email received
socket.on('new_email', (email) => {
  // Email appears instantly in inbox
});

// Email updated (read, starred, etc.)
socket.on('email_updated', (email) => {
  // Email updates in real-time
});

// Email deleted
socket.on('email_deleted', (emailId) => {
  // Email removed from view
});

// Email sent
socket.on('email_sent', (email) => {
  // Sent confirmation
});
```

### 3. Frontend Integration

**Location**: `/var/www/ementech-website/src/contexts/EmailContext.jsx`

The EmailContext automatically:
- Connects to Socket.IO on login
- Listens for real-time email events
- Updates email list instantly when new emails arrive
- Shows visual indicators for new emails

## How to Test Real-Time Emails

### Test 1: Send an Email Externally
1. Open Gmail, Outlook, or any email account
2. Send an email to **admin@ementech.co.ke**
3. **Within 30 seconds**, it will appear in your EmenTech inbox
4. No refresh needed!

### Test 2: Check Socket.IO Connection

Open your browser console on https://ementech.co.ke/email/inbox:

```javascript
// Should show: ✅ Connected to email server
// Look for WebSocket connection in Network tab (socket.io)
```

### Test 3: Monitor Real-Time Logs

```bash
ssh root@69.164.244.165
pm2 logs ementech-backend --lines 0
```

When a new email arrives, you'll see:
```
🔔 New email detected for admin@ementech.co.ke
✅ New email synced: [Subject]
   From: [sender@email.com]
   Emitting via Socket.IO to user [userId]
```

## What Changed

### Before (Cron Job)
- ✗ Emails synced every 5 minutes
- ✗ Had to wait or manually trigger sync
- ✗ No real-time updates
- ✗ Cron job required

### After (Socket.IO)
- ✓ Emails appear within 30 seconds
- ✓ Automatic background monitoring
- ✓ Instant push to browser via WebSocket
- ✓ No cron job needed
- ✓ Scales to multiple users
- ✓ Uses IMAP IDLE when available (instant!)

## Configuration

### IMAP Watcher Settings

The watcher is configured in `src/services/imapWatcher.js`:

```javascript
// IDLE mode: Uses server push (instant)
// Polling fallback: Checks every 30 seconds

pollingInterval: 30000, // 30 seconds
idleRefresh: 5 * 60 * 1000, // Refresh IDLE every 5 minutes
```

### Socket.IO Settings

```javascript
// Auto-reconnect enabled
reconnection: true,
reconnectionAttempts: 3,
reconnectionDelay: 1000,

// Transports: WebSocket first, falls back to polling
transports: ['websocket', 'polling'],
```

## Troubleshooting

### Real-Time Emails Not Appearing?

**1. Check if watcher is running:**
```bash
ssh root@69.164.244.165
pm2 logs ementech-backend | grep "IMAP"
```

Should see:
```
✅ Real-time email monitoring active
```

**2. Check Socket.IO connection:**
- Open browser DevTools → Network
- Look for "socket.io" WebSocket connection
- Status should be "101 Switching Protocols"

**3. Check email account is configured:**
```bash
ssh root@69.164.244.165
cd /var/www/ementech-website/backend
node check-db-emails.js
```

Should see:
```
✅ Email account configured
```

**4. Manually trigger sync to test:**
```bash
ssh root@69.164.244.165
cd /var/www/ementech-website/backend
node sync-real-emails.js
```

### Socket.IO Connection Errors

**Error**: "Authentication error: No token provided"
- **Solution**: Make sure you're logged in
- Token is stored in localStorage and sent with Socket.IO connection

**Error**: "Failed to connect to email server"
- **Solution**: Check backend is running
```bash
pm2 status ementech-backend
```

### High Memory Usage

The IMAP watcher maintains connections for each user. For 100+ users:

1. Consider polling instead of IDLE
2. Increase polling interval to 60+ seconds
3. Implement connection pooling

## Performance

### Scalability

- **Small teams (< 50 users)**: Current setup works great
- **Medium teams (50-200 users)**: Consider polling interval
- **Large teams (200+ users)**: Need connection pooling + Redis adapter

### Monitoring

Track these metrics:
```bash
# Active Socket.IO connections
pm2 logs ementech-backend | grep "User connected"

# New emails detected
pm2 logs ementech-backend | grep "New email detected"

# IMAP errors
pm2 logs ementech-backend | grep "IMAP error"
```

## Summary

✅ **Real-time email monitoring is ACTIVE**
- IMAP watcher runs in background
- Uses IMAP IDLE for instant push (when available)
- Falls back to 30-second polling
- Socket.IO pushes new emails to browser instantly
- No cron job needed
- No manual sync needed

✅ **Test it**: Send an email to admin@ementech.co.ke from Gmail/Outlook and watch it appear in your inbox within 30 seconds!

📚 **Related Documentation**:
- `EMAIL_SYSTEM_EXPLAINED.md` - Overall email architecture
- `AUTHENTICATION_DIAGRAM.txt` - How authentication works
