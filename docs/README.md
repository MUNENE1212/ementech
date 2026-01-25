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

---

## Platform Overview

EmenTech is a fullstack MERN application consisting of:

1. **Main Website** (ementech.co.ke) - Business website with email client, lead capture, analytics
2. **Admin Dashboard** (admin.ementech.co.ke) - Staff management, shared backend
3. **Email Server** (mail.ementech.co.ke) - Postfix/Dovecot SMTP/IMAP

### Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Vite, TailwindCSS |
| Backend | Node.js, Express.js, Socket.IO |
| Database | MongoDB Atlas (cloud) |
| Cache | Redis 7.0 |
| Web Server | Nginx with Let's Encrypt SSL |
| Process Manager | PM2 |
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
# Build frontend
npm run build

# Deploy to VPS
scp -r dist/* root@69.164.244.165:/var/www/ementech-website/current/

# Restart backend
ssh root@69.164.244.165 "pm2 restart ementech-backend && systemctl reload nginx"
```

---

## Key Features

- Full email client (IMAP/SMTP integration)
- Lead capture with progressive profiling
- Lead scoring algorithm (0-120 points)
- Real-time updates via Socket.IO
- JWT authentication with RBAC
- Analytics dashboard
- AI chatbot integration (OpenAI)

---

## Support

- **SSH Access:** `ssh root@69.164.244.165`
- **PM2 Monitor:** `pm2 monit`
- **Logs:** `pm2 logs ementech-backend`
