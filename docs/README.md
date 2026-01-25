# EmenTech Platform Documentation

**Last Updated:** January 25, 2026
**Status:** Production Live at https://ementech.co.ke

## Quick Links

| Document | Description |
|----------|-------------|
| [Architecture](./ARCHITECTURE.md) | System design, tech stack, data models |
| [Deployment](./DEPLOYMENT.md) | Production deployment & VPS management |
| [Development](./DEVELOPMENT.md) | Local development setup |
| [API Reference](./API.md) | REST API endpoints |
| [Infrastructure](./INFRASTRUCTURE.md) | VPS infrastructure blueprint |
| [Email System](./EMAIL_SYSTEM.md) | Email client documentation |

---

## Platform Overview

EmenTech is a fullstack MERN application consisting of:

1. **Main Website** (ementech.co.ke) - Business website with email client, lead capture, analytics
2. **Admin Dashboard** (admin.ementech.co.ke) - Staff management, shared backend
3. **Email Server** (mail.ementech.co.ke) - Postfix/Dovecot SMTP/IMAP

### Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Vite, TailwindCSS, Framer Motion |
| Backend | Node.js, Express.js, Socket.IO |
| Database | MongoDB Atlas (cloud) |
| Cache | Redis 7.0 |
| Web Server | Nginx with Let's Encrypt SSL |
| Process Manager | PM2 with ecosystem config |
| Email | Postfix (SMTP), Dovecot (IMAP) |

### Server Details

| Property | Value |
|----------|-------|
| IP Address | 69.164.244.165 |
| Hostname | mail.ementech.co.ke |
| OS | Ubuntu 24.04.3 LTS |
| Resources | 1 vCPU, 2GB RAM, 40GB SSD |

---

## Quick Start

### Local Development

```bash
# Backend (Terminal 1)
cd backend && npm install && npm run dev

# Frontend (Terminal 2)
npm install && npm run dev
```

Access: http://localhost:5173

### Production Deployment

```bash
# 1. Build frontend
npm run build

# 2. Deploy frontend to VPS
rsync -av --delete dist/ root@69.164.244.165:/var/www/ementech-website/

# 3. Deploy backend (if changed)
rsync -av backend/ root@69.164.244.165:/var/www/ementech-website/backend/

# 4. Restart backend
ssh root@69.164.244.165 "cd /var/www/ementech-website/backend && pm2 restart ementech-backend"
```

---

## Key Features

- **Full Email Client** (IMAP/SMTP integration)
  - Inbox, Sent, Drafts, Archive, Trash, Starred folders
  - Compose, Reply, Reply All, Forward
  - Real-time email updates via Socket.IO
  - Background syncing (every 30s)
  - Mobile-responsive design

- **Lead Management**
  - Lead capture with progressive profiling
  - Lead scoring algorithm (0-120 points)
  - Analytics dashboard

- **Authentication**
  - JWT authentication with RBAC
  - User roles: Admin, Staff, User

- **AI Integration**
  - OpenAI chatbot (when API key configured)

---

## Email System Details

### Folder Structure
- **INBOX**: Incoming emails (synced from IMAP)
- **SENT**: Emails sent via SMTP (stored in database)
- **Drafts**: Saved drafts (stored in database)
- **Archive**: Archived emails (stored in database)
- **Trash**: Deleted emails (stored in database)
- **STARRED**: Virtual folder (filter by `isFlagged: true`)

### Email Sync Behavior
- **Background**: Backend polls IMAP every 30 seconds for new emails
- **Frontend**: Fetches from database (fast, no IMAP)
- **Manual**: User can click sync button to force sync
- **Only INBOX syncs from IMAP** - other folders are database-managed

### Mobile Responsive
- Sidebar as overlay on mobile
- Full-width email list
- Full-screen email reader with back button
- Touch-friendly interactions

---

## Support

- **SSH Access:** `ssh root@69.164.244.165`
- **PM2 Monitor:** `pm2 monit`
- **Backend Logs:** `pm2 logs ementech-backend --lines 100`
- **Nginx Logs:** `tail -f /var/log/nginx/error.log`
