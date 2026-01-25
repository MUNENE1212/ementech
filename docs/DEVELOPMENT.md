# Local Development Setup

## Prerequisites

- Node.js v18+ (recommend v20 LTS)
- MongoDB (local or Atlas)
- Git

---

## Quick Start

### 1. Install Dependencies

```bash
# Frontend
cd /media/munen/muneneENT/ementech/ementech-website
npm install

# Backend
cd backend
npm install
```

### 2. Configure Environment

Create `backend/.env`:

```bash
# Server
NODE_ENV=development
PORT=5001
CLIENT_URL=http://localhost:5173

# MongoDB (local or Atlas)
MONGODB_URI=mongodb+srv://master25:master25@cluster0.qaobi.mongodb.net/?appName=Cluster0

# JWT
JWT_SECRET=ementech-secret-key-2026

# Email
IMAP_HOST=mail.ementech.co.ke
IMAP_PORT=993
IMAP_USER=admin@ementech.co.ke
IMAP_PASS=<password>
SMTP_HOST=mail.ementech.co.ke
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=admin@ementech.co.ke
SMTP_PASS=<password>

# Sync credentials
SYNC_ADMIN_EMAIL=admin@ementech.co.ke
SYNC_ADMIN_PASSWORD=<password>

# CORS
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
```

### 3. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Runs on http://localhost:5001
```

**Terminal 2 - Frontend:**
```bash
npm run dev
# Runs on http://localhost:5173
```

---

## Access URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:5001/api |
| Email Dashboard | http://localhost:5173/email |

---

## Test Credentials

```
Email: admin@ementech.co.ke
Password: Admin2026!
```

---

## Project Structure

```
ementech-website/
├── src/                    # Frontend (React)
│   ├── pages/              # Page components
│   ├── components/         # Reusable components
│   │   ├── email/          # Email client UI
│   │   ├── chat/           # AI chatbot
│   │   └── layout/         # Header, Footer
│   ├── contexts/           # React contexts
│   ├── services/           # API clients
│   └── App.tsx             # Routes
├── backend/                # Backend (Express)
│   ├── src/
│   │   ├── server.js       # Entry point
│   │   ├── controllers/    # Route handlers
│   │   ├── models/         # Mongoose schemas
│   │   ├── routes/         # API routes
│   │   └── middleware/     # Auth, RBAC
│   ├── ecosystem.config.cjs
│   └── .env
├── docs/                   # Documentation
├── package.json            # Frontend deps
└── vite.config.ts
```

---

## Common Commands

### Development
```bash
npm run dev          # Start frontend dev server
npm run build        # Build for production
npm run preview      # Preview production build
```

### Backend
```bash
cd backend
npm run dev          # Start with nodemon
npm start            # Start production
```

### Testing
```bash
# Health check
curl http://localhost:5001/api/health

# Login
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ementech.co.ke","password":"Admin2026!"}'
```

---

## Troubleshooting

### MongoDB connection failed
```bash
# Check if MongoDB is running
pgrep -l mongod

# Start MongoDB
sudo systemctl start mongod
```

### Port already in use
```bash
# Find process
lsof -i :5001
lsof -i :5173

# Kill process
kill -9 <PID>
```

### IMAP connection timeout
```bash
# Test IMAP connectivity
telnet mail.ementech.co.ke 993

# Check firewall
sudo ufw status
sudo ufw allow 993/tcp
```

### Module not found
```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
```
