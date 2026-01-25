# EmenTech Platform

Fullstack MERN application for ementech.co.ke with integrated email system, lead capture, and analytics.

## Quick Links

| Resource | Link |
|----------|------|
| **Production** | https://ementech.co.ke |
| **Admin** | https://admin.ementech.co.ke |
| **Documentation** | [docs/](./docs/) |
| **API Reference** | [docs/API.md](./docs/API.md) |
| **Architecture** | [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) |

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Vite, TailwindCSS |
| Backend | Node.js, Express.js, Socket.IO |
| Database | MongoDB Atlas, Redis |
| Server | Nginx, PM2, Let's Encrypt |

## Quick Start

```bash
# Install dependencies
npm install

# Start development servers
npm run dev              # Frontend (localhost:5173)
cd backend && npm run dev  # Backend (localhost:5001)
```

See [Development Guide](./docs/DEVELOPMENT.md) for complete setup instructions.

## Deployment

```bash
# Build for production
npm run build

# Deploy to VPS
scp -r dist/* root@69.164.244.165:/var/www/ementech-website/current/
```

See [Deployment Guide](./docs/DEPLOYMENT.md) for full deployment process.

## Documentation

- [README](./docs/README.md) - Project overview
- [ARCHITECTURE](./docs/ARCHITECTURE.md) - System design and tech stack
- [DEPLOYMENT](./docs/DEPLOYMENT.md) - Production deployment guide
- [DEVELOPMENT](./docs/DEVELOPMENT.md) - Local development setup
- [API](./docs/API.md) - REST API reference
- [INFRASTRUCTURE](./docs/INFRASTRUCTURE.md) - VPS infrastructure blueprint

## License

© 2026 EmenTech
