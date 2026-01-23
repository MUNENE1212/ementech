# Real-Time Email System with Socket.IO - Complete Architecture

## 🎯 Overview

Transform your EmenTech email server into a **real-time email system** integrated seamlessly into your MERN stack website using Socket.IO.

---

## 📐 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Real-time    │  │ Live Email   │  │ Desktop      │          │
│  │ Inbox        │  │ Composer     │  │ Notifications│          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                  │                  │                   │
│         └──────────────────┴──────────────────┘                   │
│                            │                                     │
│                    Socket.IO Client                              │
└────────────────────────────┼─────────────────────────────────────┘
                             │
                    WebSocket Connection
                             │
┌────────────────────────────┴─────────────────────────────────────┐
│                      BACKEND (Node.js/Express)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Socket.IO    │  │ Email        │  │ User         │          │
│  │ Server       │◄─┤ API Routes   │◄─┤ Auth         │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                  │                  │                   │
│         │                  │                  │                   │
│  ┌──────▼──────────────────▼──────────────────▼───────┐         │
│  │        Email Monitor Daemon (IMAP IDLE)            │         │
│  │  - Watches Dovecot for new emails                  │         │
│  │  - Emits Socket.IO events                          │         │
│  └──────┬──────────────────────────────────────────────┘         │
└─────────┼────────────────────────────────────────────────────────┘
          │
          │ IMAP Protocol
          │
┌─────────▼────────────────────────────────────────────────────────┐
│                   EMAIL SERVER (Dovecot/Postfix)                  │
├─────────────────────────────────────────────────────────────────┤
│  • Dovecot (IMAP server) - delivers emails to monitor           │
│  • Postfix (SMTP server) - sends outgoing emails                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Real-Time Events

### 1. **New Email Received** 📧
```javascript
// Server emits
io.emit('new_email', {
  id: 'msg123',
  from: 'sender@example.com',
  subject: 'Project Update',
  preview: 'Hey, just wanted to check in...',
  timestamp: '2026-01-19T10:30:00Z'
});

// Client receives
socket.on('new_email', (email) => {
  // Play notification sound
  // Show toast notification
  // Update inbox without refresh
  // Increment unread count
});
```

### 2. **Email Sent** ✉️
```javascript
// Client sends
socket.emit('send_email', {
  to: 'recipient@example.com',
  subject: 'Hello',
  body: 'Testing real-time email'
});

// Server confirms
io.to(socket.id).emit('email_sent', {
  success: true,
  messageId: 'abc123',
  timestamp: Date.now()
});
```

### 3. **Typing Indicator** ⌨️
```javascript
// When user starts composing
socket.emit('typing', { emailId: 'msg123' });

// Broadcast to other users
socket.broadcast.emit('user_typing', {
  user: 'admin@ementech.co.ke',
  emailId: 'msg123'
});
```

### 4. **Read Receipt** ✓
```javascript
// When email is opened
socket.emit('mark_read', { emailId: 'msg123' });

// Notify other devices
io.to('admin@ementech.co.ke').emit('email_read', {
  emailId: 'msg123',
  readAt: Date.now()
});
```

---

## 🛠️ Implementation Components

### Phase 1: Backend Infrastructure (Server-Side)

#### 1.1 Email Monitor Daemon
**File**: `/var/www/email-daemon/emailMonitor.js`
- Connects to Dovecot via IMAP
- Uses IMAP IDLE for real-time push
- Emits Socket.IO events on new email
- Auto-reconnects on connection loss

#### 1.2 Socket.IO Email Events
**File**: `backend/src/routes/email.routes.js`
```javascript
// Send email via SMTP
router.post('/api/v1/email/send', protect, async (req, res) => {
  // Use Postfix to send
  // Emit 'email_sent' event
  // Return confirmation
});

// Get inbox with real-time updates
router.get('/api/v1/email/inbox', protect, async (req, res) => {
  // Fetch emails from IMAP
  // Return email list
});
```

#### 1.3 Socket.IO Integration
**File**: `backend/src/config/socket.js` (modify existing)
```javascript
// Email room management
socket.on('join_email', (emailAddress) => {
  socket.join(emailAddress);
  console.log(`User joined ${emailAddress}`);
});

// Listen for email events
socket.on('send_email', async (emailData) => {
  // Send via SMTP
  // Emit confirmation
});
```

### Phase 2: Frontend Components (React)

#### 2.1 Real-Time Inbox Component
```jsx
// components/email/RealtimeInbox.jsx
import { useEffect, useState } from 'react';
import { socket } from '../utils/socket';

export default function RealtimeInbox() {
  const [emails, setEmails] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Listen for new emails
    socket.on('new_email', (email) => {
      setEmails(prev => [email, ...prev]);
      setUnreadCount(prev => prev + 1);

      // Show notification
      new Notification(`New email from ${email.from}`, {
        body: email.subject
      });
    });

    return () => socket.off('new_email');
  }, []);

  return (
    <div className="inbox">
      <h2>Inbox ({unreadCount})</h2>
      {emails.map(email => (
        <EmailItem key={email.id} email={email} />
      ))}
    </div>
  );
}
```

#### 2.2 Live Email Composer
```jsx
// components/email/LiveComposer.jsx
export default function LiveComposer() {
  const [isTyping, setIsTyping] = useState(false);

  const handleTyping = () => {
    if (!isTyping) {
      socket.emit('typing', { emailId: currentEmailId });
      setIsTyping(true);
    }
  };

  const sendEmail = () => {
    socket.emit('send_email', {
      to: recipient,
      subject: subject,
      body: body
    });

    socket.on('email_sent', (confirmation) => {
      console.log('Email sent!', confirmation);
    });
  };

  return <ComposerUI onTyping={handleTyping} onSend={sendEmail} />;
}
```

#### 2.3 Desktop Notifications
```javascript
// utils/notifications.js
export function requestNotificationPermission() {
  if ('Notification' in window) {
    Notification.requestPermission();
  }
}

export function showEmailNotification(email) {
  if (Notification.permission === 'granted') {
    new Notification(`📧 ${email.from}`, {
      body: email.subject,
      icon: '/email-icon.png',
      tag: email.id
    });
  }
}
```

---

## 📊 Database Schema (MongoDB)

### Email Model
```javascript
const EmailSchema = new Schema({
  messageId: { type: String, unique: true },
  from: { type: String, required: true },
  to: { type: String, required: true },
  subject: String,
  body: String,
  preview: String,
  read: { type: Boolean, default: false },
  folder: { type: String, default: 'INBOX' },
  timestamp: { type: Date, default: Date.now },
  userId: { type: Schema.Types.ObjectId, ref: 'User' }
});
```

### User Email Settings
```javascript
const UserEmailSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  emailAddress: { type: String, required: true },
  password: String, // Encrypted
  notifications: { type: Boolean, default: true },
  signature: String
});
```

---

## 🎨 UI/UX Features

### 1. **Smart Inbox**
- Real-time email sorting
- Category tabs (Primary, Social, Promotions)
- Quick filters (unread, starred, attachments)

### 2. **Live Compose**
- Auto-save drafts
- Typing indicators
- Attachment upload progress
- Emoji picker
- Rich text editor

### 3. **Desktop Notifications**
- New email popup
- Sound alerts
- Browser push notifications
- Notification center

### 4. **Email Preview Panel**
- Split view (list + preview)
- Keyboard shortcuts
- Quick actions (archive, delete, mark read)
- Contact avatars

---

## 🔒 Security Features

### 1. **Authentication**
- JWT token validation
- Socket.IO authentication
- Encrypted IMAP credentials

### 2. **CORS Configuration**
```javascript
const corsOptions = {
  origin: ['https://ementech.co.ke', 'https://app.ementech.co.ke'],
  credentials: true
};
```

### 3. **Rate Limiting**
- Email sending limits
- API request throttling
- Socket connection limits

---

## 📱 Mobile Responsiveness

- Responsive email composer
- Touch-friendly interface
- Mobile-optimized inbox
- Offline support (Service Workers)

---

## 🚀 Deployment Steps

### Step 1: Install Dependencies
```bash
# Backend
cd /media/munen/muneneENT/PLP/MERN/Proj/backend
npm install imap nodemailer mailparser

# Email daemon
cd /var/www/email-daemon
npm install imap
```

### Step 2: Configure Socket.IO
```bash
# Modify existing socket.js
# Add email event handlers
```

### Step 3: Start Email Monitor
```bash
# Using PM2
pm2 start /var/www/email-daemon/emailMonitor.js --name email-monitor

# Or systemd service
systemctl start email-monitor
```

### Step 4: Build Frontend
```bash
cd /media/munen/muneneENT/PLP/MERN/Proj/frontend
npm run build
```

---

## 💰 Resource Requirements

- **RAM**: +50MB for email monitor daemon
- **CPU**: Minimal (IDLE connection)
- **Storage**: Email metadata in MongoDB
- **Network**: WebSocket overhead (minimal)

---

## ⚡ Performance Optimization

### 1. **Email Caching**
- Store recent emails in Redis
- Cache IMAP connections
- Lazy load email body

### 2. **WebSocket Optimization**
- Binary data for attachments
- Compress large payloads
- Connection pooling

### 3. **Database Indexing**
```javascript
EmailSchema.index({ userId: 1, timestamp: -1 });
EmailSchema.index({ read: 1 });
```

---

## 🎯 Development Roadmap

### Week 1: Foundation
- [x] Email server installed
- [ ] Email monitor daemon created
- [ ] Socket.IO email events
- [ ] Basic email API endpoints

### Week 2: Frontend
- [ ] Real-time inbox component
- [ ] Email composer
- [ ] Desktop notifications
- [ ] Email reader

### Week 3: Advanced Features
- [ ] Email search
- [ ] Filters & labels
- [ ] Attachment handling
- [ ] Multiple accounts

### Week 4: Polish
- [ ] UI/UX improvements
- [ ] Mobile optimization
- [ ] Performance tuning
- [ ] Security audit

---

## 📊 Testing Strategy

### 1. **Unit Tests**
```javascript
test('socket emits new_email event', () => {
  const mockSocket = createMockSocket();
  expect(mockSocket.emit).toHaveBeenCalledWith('new_email', expect.any(Object));
});
```

### 2. **Integration Tests**
- Test IMAP connection
- Test Socket.IO events
- Test email sending/receiving

### 3. **Load Testing**
- Simulate 100 concurrent users
- Test with 1000+ emails
- WebSocket stress test

---

## 🆘 Troubleshooting

### Issue: Emails not appearing in real-time
**Solution**:
```bash
# Check email monitor
pm2 logs email-monitor

# Check IMAP connection
telnet localhost 993

# Restart daemon
pm2 restart email-monitor
```

### Issue: Socket.IO connection drops
**Solution**:
- Configure reconnection settings
- Check CORS configuration
- Verify WebSocket transport

---

## 📈 Monitoring & Analytics

### Key Metrics
- Real-time email delivery rate
- Socket.IO connection count
- Average email processing time
- User engagement metrics

### Logging
```javascript
// Track email events
logger.info('new_email_received', {
  from: email.from,
  to: email.to,
  timestamp: Date.now()
});
```

---

## 🎉 Benefits

### For Users:
- ✅ Instant email notifications
- ✅ No page refresh needed
- ✅ Real-time collaboration
- ✅ Desktop notifications
- ✅ Better UX

### For Business:
- ✅ Modern email experience
- ✅ Competitive advantage
- ✅ Increased engagement
- ✅ Professional image
- ✅ Scalable solution

---

## 🚀 Next Steps

**Ready to build this?**

1. **Proof of Concept** (1 day)
   - Basic email monitor
   - Simple Socket.IO event
   - Demo React component

2. **MVP** (1 week)
   - Full real-time inbox
   - Email sending/receiving
   - Desktop notifications

3. **Production** (2-3 weeks)
   - All advanced features
   - Polish & optimization
   - Security hardening

**Would you like me to start building the Proof of Concept?** 🚀

---

Generated: January 19, 2026
Architecture: MERN + Socket.IO + IMAP IDLE
Status: Ready for Implementation
