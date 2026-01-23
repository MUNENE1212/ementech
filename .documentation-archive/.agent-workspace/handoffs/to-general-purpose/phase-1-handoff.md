# Handoff Package: Phase 1 - Local Development Preparation

**From:** Project Director Agent
**To:** General-Purpose Agent
**Date:** 2026-01-18
**Phase:** 1 - Local Development Preparation
**Priority:** HIGH
**Estimated Duration:** 8-12 hours (parallel tracks)

---

## Handoff Summary

You are being assigned **Phase 1: Local Development Preparation**. This is a **parallel-track phase** where you will work on three independent tracks simultaneously. This phase is **critical path** and should begin immediately.

**Key Advantage:** All work in this phase is local and independent. You have full autonomy to execute without blocking other agents or waiting for infrastructure.

---

## Current Project State

### Projects Overview

**1. ementech-website**
- **Location:** `/media/munen/muneneENT/ementech/ementech-website`
- **Current State:** Single-page React app with sections
- **Tech Stack:** React 19, Vite 7, TailwindCSS 3, React Router v7 (installed but not configured)
- **Needs:** Convert to multipage with routing, create 5 pages, add team members section

**2. dumuwaks**
- **Location:** `/media/munen/muneneENT/PLP/MERN/Proj`
- **Backend State:** ✅ Running successfully on port 5000
  - MongoDB connected (ementech database)
  - All services initialized (Socket.IO, Cloudinary, etc.)
  - URL: http://localhost:5000
- **Frontend State:** Not started, needs production build configuration
- **Tech Stack:**
  - Backend: Node.js, Express, MongoDB, Socket.IO
  - Frontend: React 18, Vite 5, TailwindCSS 3, Redux Toolkit, React Router v6

### Infrastructure Status

- VPS: Not yet acquired (Phase 2)
- DNS: Not configured (Phase 3)
- SSL: Not generated (Phase 3)
- Deployment scripts: Not created (your job in Track C)

### Research Status

✅ All research complete (6 comprehensive guides available in `/media/munen/muneneENT/PLP/MERN/Proj/.agent-workspace/shared-context/`)

---

## Your Mission: Three Parallel Tracks

You will execute **three tracks simultaneously**. Each track is independent and can be worked on in any order or in parallel.

### Track A: ementech-website Enhancement

**Objective:** Convert single-page app to multipage with React Router v7

**Tasks:**

1. **Configure React Router v7** (1-2 hours)
   - File: `/media/munen/muneneENT/ementech/ementech-website/src/main.tsx`
   - Import BrowserRouter, Routes, Route from react-router-dom
   - Wrap App in BrowserRouter
   - Define route structure:
     - `/` → Home page
     - `/products` → Products page
     - `/services` → Services page
     - `/about` → About page (with team members)
     - `/contact` → Contact page
   - Update App.tsx to use `<Routes>` and `<Route>` instead of rendering all sections

2. **Create Page Components** (2-3 hours, can parallelize)
   - Create `/src/pages/Home.tsx` (move Hero section content)
   - Create `/src/pages/Products.tsx` (move Products section content)
   - Create `/src/pages/Services.tsx` (move Services section content)
   - Create `/src/pages/About.tsx` (move About section + add team members)
   - Create `/src/pages/Contact.tsx` (move Contact section content)

3. **Add Team Members Section to About Page** (1 hour)
   - Create `/src/components/TeamSection.tsx`
   - Design requirements:
     - Grid layout (responsive: 1 col mobile, 2 col tablet, 3-4 col desktop)
     - Team member cards with:
       - Photo placeholder (use placeholder images or gradients)
       - Name
       - Role/Title
       - Short bio
       - Social links (LinkedIn, Email, etc.)
     - Smooth animations (Framer Motion already installed)
   - Add 4-6 sample team members (placeholder data is fine)
   - Integrate into About page

4. **Update Navigation** (30 min)
   - File: `/media/munen/muneneENT/ementech/ementech-website/src/components/layout/Header.tsx`
   - Replace anchor links (`#section`) with React Router `Link` components
   - Links: Home, Products, Services, About, Contact
   - Add active state styling for current page

5. **Test Routing Locally** (1 hour)
   - Run `npm run dev`
   - Test:
     - Navigate between all pages
     - Direct URL access (refresh on each page)
     - Browser back/forward buttons
     - No 404 errors
     - No console errors
   - Fix any issues

6. **Create Production Build** (30 min)
   - Run `npm run build`
   - Verify no TypeScript errors
   - Check build output in `/dist`
   - Test with `npm run preview`
   - Verify routing works in preview mode

**Deliverables:**
- [ ] React Router v7 configured and working
- [ ] 5 page components created
- [ ] Team members section added to About page
- [ ] Navigation using Link components
- [ ] All routing tests passing
- [ ] Production build in `/dist` directory
- [ ] No errors in console

**Files to Modify/Create:**
- `/media/munen/muneneENT/ementech/ementech-website/src/main.tsx`
- `/media/munen/muneneENT/ementech/ementech-website/src/App.tsx`
- `/media/munen/muneneENT/ementech/ementech-website/src/components/layout/Header.tsx`
- `/media/munen/muneneENT/ementech/ementech-website/src/pages/*.tsx` (5 files)
- `/media/munen/muneneENT/ementech/ementech-website/src/components/TeamSection.tsx`

**Success Criteria:**
- Can navigate to all 5 pages without page reload
- Direct URL access works (no 404s on refresh)
- Team members section displays correctly on About page
- Build completes without errors
- `npm run preview` shows working multipage site

---

### Track B: dumuwaks Frontend Production Build

**Objective:** Configure frontend for production deployment to app.ementech.co.ke

**Tasks:**

1. **Configure Production API Connection** (30 min)
   - File: `/media/munen/muneneENT/PLP/MERN/Proj/frontend/src/config/api.ts` (or similar)
   - Update API base URL from `http://localhost:5000` to `https://api.ementech.co.ke`
   - Ensure environment variable support:
     ```typescript
     const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
     ```
   - Create `/media/munen/muneneENT/PLP/MERN/Proj/frontend/.env.production`:
     ```
     VITE_API_URL=https://api.ementech.co.ke
     VITE_SOCKET_URL=https://api.ementech.co.ke
     ```

2. **Configure Socket.IO for Production** (30 min)
   - Locate Socket.IO client initialization
   - Update connection URL from `http://localhost:5000` to production URL
   - Configure transports: `['websocket', 'polling']`
   - Ensure secure connection (HTTPS):
     ```typescript
     const socket = io(VITE_SOCKET_URL, {
       secure: true,
       transports: ['websocket', 'polling']
     });
     ```

3. **Test Backend Integration Locally** (1 hour)
   - Start backend: `cd /media/munen/muneneENT/PLP/MERN/Proj/backend && npm start` (if not running)
   - Start frontend: `cd /media/munen/muneneENT/PLP/MERN/Proj/frontend && npm run dev`
   - Test:
     - User registration/login
     - API calls (check Network tab)
     - Socket.IO connection (check browser console)
     - Real-time updates (if applicable)
   - Document any issues

4. **Update PWA Configuration** (15 min)
   - File: `vite.config.ts` or similar
   - Ensure PWA manifest is configured for production domain
   - Update scope to `/` for app.ementech.co.ke

5. **Create Production Build** (30 min)
   - Run `npm run build`
   - Verify no TypeScript errors
   - Check build output in `/dist`
   - Verify service worker is generated
   - Test with `npm run preview`
   - Check PWA installation (if applicable)

**Deliverables:**
- [ ] Production API URL configured
- [ ] Socket.IO configured for production (HTTPS + WebSocket)
- [ ] .env.production file created
- [ ] All backend integration tests passing
- [ ] Production build in `/dist` directory
- [ ] Service worker registered
- [ ] No console errors

**Files to Modify/Create:**
- `/media/munen/muneneENT/PLP/MERN/Proj/frontend/.env.production`
- `/media/munen/muneneNT/PLP/MERN/Proj/frontend/src/config/*.ts` (API config)
- `/media/munen/muneneNT/PLP/MERN/Proj/frontend/src/socket.ts` (or wherever Socket.IO is initialized)

**Success Criteria:**
- Frontend builds without errors
- All API calls point to https://api.ementech.co.ke
- Socket.IO configured for secure WebSocket connection
- Local testing shows successful backend integration
- PWA manifest configured for app.ementech.co.ke

---

### Track C: Configuration Files Creation

**Objective:** Create all deployment configuration files for both projects

**Tasks:**

1. **Create PM2 Ecosystem Files** (1 hour total)

   **dumuwaks Backend:**
   - Create: `/media/munen/muneneNT/PLP/MERN/Proj/backend/ecosystem.config.js`
   ```javascript
   module.exports = {
     apps: [{
       name: 'dumuwaks-backend',
       script: './src/server.js',
       cwd: '/var/www/api.ementech.co.ke/current',
       instances: 1,
       exec_mode: 'cluster',
       env: {
         NODE_ENV: 'production',
         PORT: 5001
       },
       error_file: './logs/error.log',
       out_file: './logs/out.log',
       log_date_format: 'YYYY-MM-DD HH:mm:ss',
       merge_logs: true,
       autorestart: true,
       max_restarts: 10,
       min_uptime: '10s'
     }]
   };
   ```

   **dumuwaks Frontend (Serve with PM2):**
   - Create: `/media/munen/muneneNT/PLP/MERN/Proj/frontend/ecosystem.config.js`
   ```javascript
   module.exports = {
     apps: [{
       name: 'dumuwaks-frontend',
       script: 'npx',
       args: 'serve -s dist -l 3000',
       cwd: '/var/www/app.ementech.co.ke/current',
       instances: 1,
       env: {
         NODE_ENV: 'production'
       },
       autorestart: true
     }]
   };
   ```
   **Note:** You may need to `npm install serve --save-dev` for frontend

2. **Create Environment Variable Templates** (1 hour total)

   **dumuwaks Backend:**
   - Create: `/media/munen/muneneNT/PLP/MERN/Proj/backend/.env.production.template`
   ```bash
   # Server
   NODE_ENV=production
   PORT=5001

   # MongoDB
   MONGODB_URI=mongodb://localhost:27017/dumuwaks

   # JWT
   JWT_SECRET=your_jwt_secret_here
   JWT_EXPIRE=7d

   # Cloudinary
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret

   # Africa's Talking
   AT_USERNAME=your_username
   AT_API_KEY=your_api_key

   # Stripe
   STRIPE_SECRET_KEY=your_stripe_secret
   STRIPE_WEBHOOK_SECRET=your_webhook_secret

   # Email (Nodemailer)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password

   # Firebase (if used)
   FIREBASE_SERVICE_ACCOUNT_KEY=path_to_service_account.json

   # Frontend URL
   FRONTEND_URL=https://app.ementech.co.ke
   ```

   **dumuwaks Frontend:**
   - Already created in Track B, but create template:
   - Create: `/media/munen/muneneNT/PLP/MERN/Proj/frontend/.env.production.template`
   ```bash
   VITE_API_URL=https://api.ementech.co.ke
   VITE_SOCKET_URL=https://api.ementech.co.ke
   ```

   **ementech-website:**
   - Create: `/media/munen/muneneNT/ementech/ementech-website/.env.production.template`
   ```bash
   # EmailJS (if used for contact form)
   VITE_EMAILJS_SERVICE_ID=your_service_id
   VITE_EMAILJS_TEMPLATE_ID=your_template_id
   VITE_EMAILJS_PUBLIC_KEY=your_public_key
   ```

3. **Create Nginx Configuration Templates** (1 hour total)

   **ementech.co.ke:**
   - Create: `/media/munen/muneneNT/ementech/ementech-website/.agent-workspace/artifacts/nginx-ementech.conf.template`
   ```nginx
   server {
       listen 80;
       listen [::]:80;
       server_name ementech.co.ke www.ementech.co.ke;

       # Redirect to HTTPS
       return 301 https://$server_name$request_uri;
   }

   server {
       listen 443 ssl http2;
       listen [::]:443 ssl http2;
       server_name ementech.co.ke www.ementech.co.ke;

       # SSL Configuration (Certbot will add this)
       ssl_certificate /etc/letsencrypt/live/ementech.co.ke/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/ementech.co.ke/privkey.pem;

       # Root directory
       root /var/www/ementech.co.ke/public;
       index index.html;

       # React Router support
       location / {
           try_files $uri $uri/ /index.html;
       }

       # Static asset caching
       location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
           expires 1y;
           add_header Cache-Control "public, immutable";
       }

       # Gzip compression
       gzip on;
       gzip_vary on;
       gzip_min_length 1024;
       gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;

       # Security headers
       add_header X-Frame-Options "SAMEORIGIN" always;
       add_header X-Content-Type-Options "nosniff" always;
       add_header X-XSS-Protection "1; mode=block" always;
   }
   ```

   **app.ementech.co.ke:**
   - Create: `/media/munen/muneneNT/ementech/ementech-website/.agent-workspace/artifacts/nginx-app.conf.template`
   ```nginx
   server {
       listen 80;
       listen [::]:80;
       server_name app.ementech.co.ke;

       # Redirect to HTTPS
       return 301 https://$server_name$request_uri;
   }

   server {
       listen 443 ssl http2;
       listen [::]:443 ssl http2;
       server_name app.ementech.co.ke;

       # SSL Configuration
       ssl_certificate /etc/letsencrypt/live/app.ementech.co.ke/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/app.ementech.co.ke/privkey.pem;

       # Root directory
       root /var/www/app.ementech.co.ke/public;
       index index.html;

       # React Router support
       location / {
           try_files $uri $uri/ /index.html;
       }

       # Proxy API requests to backend
       location /api/ {
           proxy_pass http://localhost:5001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }

       # Socket.IO WebSocket support
       location /socket.io/ {
           proxy_pass http://localhost:5001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection "upgrade";
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }

       # Static asset caching
       location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
           expires 1y;
           add_header Cache-Control "public, immutable";
       }

       # Gzip compression
       gzip on;
       gzip_vary on;
       gzip_min_length 1024;
       gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;

       # PWA manifest
       location /manifest.json {
           add_header Cache-Control "public, max-age=604800";
       }

       # Service worker
       location /sw.js {
           add_header Cache-Control "public, max-age=0";
       }
   }
   ```

   **api.ementech.co.ke:**
   - Create: `/media/munen/muneneNT/ementech/ementech-website/.agent-workspace/artifacts/nginx-api.conf.template`
   ```nginx
   # Rate limiting zone
   limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

   server {
       listen 80;
       listen [::]:80;
       server_name api.ementech.co.ke;

       # Redirect to HTTPS
       return 301 https://$server_name$request_uri;
   }

   server {
       listen 443 ssl http2;
       listen [::]:443 ssl http2;
       server_name api.ementech.co.ke;

       # SSL Configuration
       ssl_certificate /etc/letsencrypt/live/api.ementech.co.ke/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/api.ementech.co.ke/privkey.pem;

       # Proxy to Node.js backend
       location / {
           limit_req zone=api_limit burst=20 nodelay;

           proxy_pass http://localhost:5001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;

           # CORS headers (adjust as needed)
           add_header Access-Control-Allow-Origin https://app.ementech.co.ke always;
           add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
           add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization" always;
           add_header Access-Control-Allow-Credentials "true" always;

           if ($request_method = 'OPTIONS') {
               return 204;
           }
       }

       # Socket.IO
       location /socket.io/ {
           proxy_pass http://localhost:5001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection "upgrade";
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }

       # Gzip compression
       gzip on;
       gzip_vary on;
       gzip_min_length 1024;
       gzip_types application/json application/javascript text/css text/plain text/xml;

       # Security headers
       add_header X-Frame-Options "SAMEORIGIN" always;
       add_header X-Content-Type-Options "nosniff" always;
       add_header X-XSS-Protection "1; mode=block" always;
   }
   ```

4. **Create Deployment Scripts** (30 min total)

   **Deploy dumuwaks Backend:**
   - Create: `/media/munen/muneneNT/ementech/ementech-website/.agent-workspace/artifacts/deploy-backend.sh`
   ```bash
   #!/bin/bash
   # Deployment script for dumuwaks backend

   echo "Deploying dumuwaks backend to api.ementech.co.ke..."

   # Configuration
   SERVER_USER="root"
   SERVER_HOST="your-vps-ip"
   SERVER_DIR="/var/www/api.ementech.co.ke"
   LOCAL_DIR="/media/munen/muneneNT/PLP/MERN/Proj/backend"

   # Build (if needed)
   echo "Installing production dependencies..."
   cd "$LOCAL_DIR"
   npm ci --production

   # Create directory structure on server
   echo "Creating directory structure on server..."
   ssh "$SERVER_USER@$SERVER_HOST" "mkdir -p $SERVER_DIR/{current,logs,releases}"

   # Upload code
   echo "Uploading code to server..."
   rsync -avz --delete \
     --exclude 'node_modules' \
     --exclude '.git' \
     --exclude 'logs' \
     --exclude '.env' \
     "$LOCAL_DIR/" "$SERVER_USER@$SERVER_HOST:$SERVER_DIR/current/"

   # Configure environment (manual step)
   echo "Configure .env on server manually!"

   # Restart PM2
   echo "Restarting PM2 process..."
   ssh "$SERVER_USER@$SERVER_HOST" "cd $SERVER_DIR/current && pm2 restart ecosystem.config.js || pm2 start ecosystem.config.js"

   echo "Backend deployment complete!"
   echo "Monitor logs: ssh $SERVER_USER@$SERVER_HOST 'pm2 logs dumuwaks-backend'"
   ```

   **Deploy dumuwaks Frontend:**
   - Create: `/media/munen/muneneNT/ementech/ementech-website/.agent-workspace/artifacts/deploy-frontend.sh`
   ```bash
   #!/bin/bash
   # Deployment script for dumuwaks frontend

   echo "Deploying dumuwaks frontend to app.ementech.co.ke..."

   # Configuration
   SERVER_USER="root"
   SERVER_HOST="your-vps-ip"
   SERVER_DIR="/var/www/app.ementech.co.ke"
   LOCAL_DIR="/media/munen/muneneNT/PLP/MERN/Proj/frontend"

   # Build
   echo "Building frontend for production..."
   cd "$LOCAL_DIR"
   npm run build

   # Create directory structure on server
   echo "Creating directory structure on server..."
   ssh "$SERVER_USER@$SERVER_HOST" "mkdir -p $SERVER_DIR/public"

   # Upload build
   echo "Uploading build to server..."
   rsync -avz --delete \
     "$LOCAL_DIR/dist/" "$SERVER_USER@$SERVER_HOST:$SERVER_DIR/public/"

   # Restart PM2 (if serving with PM2)
   # ssh "$SERVER_USER@$SERVER_HOST" "pm2 restart dumuwaks-frontend"

   echo "Frontend deployment complete!"
   echo "Visit: https://app.ementech.co.ke"
   ```

   **Deploy ementech-website:**
   - Create: `/media/munen/muneneNT/ementech/ementech-website/.agent-workspace/artifacts/deploy-ementech.sh`
   ```bash
   #!/bin/bash
   # Deployment script for ementech-website

   echo "Deploying ementech-website to ementech.co.ke..."

   # Configuration
   SERVER_USER="root"
   SERVER_HOST="your-vps-ip"
   SERVER_DIR="/var/www/ementech.co.ke"
   LOCAL_DIR="/media/munen/muneneNT/ementech/ementech-website"

   # Build
   echo "Building ementech-website for production..."
   cd "$LOCAL_DIR"
   npm run build

   # Create directory structure on server
   echo "Creating directory structure on server..."
   ssh "$SERVER_USER@$SERVER_HOST" "mkdir -p $SERVER_DIR/public"

   # Upload build
   echo "Uploading build to server..."
   rsync -avz --delete \
     "$LOCAL_DIR/dist/" "$SERVER_USER@$SERVER_HOST:$SERVER_DIR/public/"

   echo "ementech-website deployment complete!"
   echo "Visit: https://ementech.co.ke"
   ```

   Make scripts executable:
   ```bash
   chmod +x /media/munen/muneneNT/ementech/ementech-website/.agent-workspace/artifacts/deploy-*.sh
   ```

**Deliverables:**
- [ ] PM2 ecosystem.config.js for backend and frontend
- [ ] .env.production templates for all projects
- [ ] Nginx configuration templates for all 3 domains
- [ ] Deployment scripts (bash) for all 3 projects
- [ ] All scripts tested locally (syntax check)
- [ ] Documentation for each configuration file

**Files to Create:**
- `/media/munen/muneneNT/PLP/MERN/Proj/backend/ecosystem.config.js`
- `/media/munen/muneneNT/PLP/MERN/Proj/frontend/ecosystem.config.js`
- `.env.production.template` for all 3 projects
- Nginx configs in `.agent-workspace/artifacts/`
- Deployment scripts in `.agent-workspace/artifacts/`

**Success Criteria:**
- All configuration files are syntactically correct
- PM2 configs can be parsed without errors
- Nginx configs pass `nginx -t` test (syntax only, not applied)
- Deployment scripts have executable permissions
- All templates are well-documented with comments

---

## Execution Guidelines

### Work Approach

**Recommended Order:**
1. Start with Track A (ementech-website) - most complex, most impactful
2. Move to Track B (dumuwaks frontend) - medium complexity
3. Finish with Track C (configs) - straightforward but detail-oriented

**Alternatively:** Work on all tracks in parallel if you prefer context switching.

### Quality Standards

**Code Quality:**
- All TypeScript code must have no errors
- Follow existing code style in each project
- Add comments for complex logic
- Use meaningful variable and function names

**Testing:**
- Test routing thoroughly (Track A)
- Test backend integration (Track B)
- Syntax check all config files (Track C)
- No console errors in any application

**Documentation:**
- Document any assumptions made
- Note any issues encountered and resolutions
- Update project manifest with progress

### File Organization

**Keep all created files in their proper locations:**
- Source code in project directories
- Configuration templates in `.agent-workspace/artifacts/`
- Deployment scripts in `.agent-workspace/artifacts/`

**Version Control:**
- You may commit changes to git if desired
- Use descriptive commit messages
- Do NOT push to remote without approval

---

## What NOT to Do

**DO NOT:**
- ❌ Deploy anything to VPS (that's Phase 4)
- ❌ Configure DNS (that's Phase 3)
- ❌ Install anything on VPS (that's Phase 2)
- ❌ Generate SSL certificates (that's Phase 3)
- ❌ Modify backend code (it's already working)
- ❌ Change database schemas
- ❌ Commit sensitive data (API keys, secrets)

**Focus ONLY on:**
- ✅ Local development and testing
- ✅ Creating configuration files
- ✅ Building production artifacts
- ✅ Preparing for deployment

---

## Handoff Back to Project Director

### When Complete

Create a completion package in `/media/munen/muneneNT/ementech/ementech-website/.agent-workspace/handoffs/to-project-director/phase-1-complete/` with:

1. **Completion Report** (`completion-report.md`)
   - Summary of all tasks completed
   - Any issues encountered and resolutions
   - Files modified/created (with full paths)
   - Test results for each track
   - Recommendations for next phase

2. **Build Artifacts Inventory** (`builds.md`)
   - Location of all production builds
   - Build sizes and metrics
   - Any build warnings or notes

3. **Configuration Files Index** (`configs.md`)
   - List of all config files created
   - Purpose of each config file
   - Any values that need to be filled in during deployment

4. **Known Issues** (if any)
   - Any unresolved problems
   - Any workarounds implemented
   - Any risks identified for deployment phase

### Before Handing Off

**Verify:**
- [ ] All deliverables for Track A complete
- [ ] All deliverables for Track B complete
- [ ] All deliverables for Track C complete
- [ ] All builds tested locally
- [ ] All configuration files syntax-checked
- [ ] Documentation complete
- [ ] No console errors in any application
- [ ] Handoff package created

**Then:**
- Update project-manifest.json with phase completion status
- Create handoff package
- Notify Project Director (human) that Phase 1 is complete

---

## Escalation Triggers

**Escalate to Project Director immediately if:**

1. **Critical Blockers:**
   - Cannot configure React Router v7 (technical limitation)
   - Cannot create production builds (fatal errors)
   - Backend integration fails completely

2. **Scope Changes:**
   - Requirements unclear or contradictory
   - Need to make architectural decisions
   - Discover additional work not in scope

3. **Security Concerns:**
   - Accidentally commit sensitive data
   - Discover security vulnerabilities
   - Configuration exposes secrets

4. **Resource Issues:**
   - Need additional tools or dependencies
   - Disk space issues
   - Permission problems

**Handle Yourself:**
- Minor bugs or errors (fix and document)
- Style improvements (make judgment call)
- Test failures (debug and resolve)
- Documentation gaps (fill them in)

---

## Resources

### Available Documentation
- Orchestration Execution Plan: `.agent-workspace/shared-context/orchestration-execution-plan.md`
- Dependency Analysis: `.agent-workspace/shared-context/dependency-analysis.md`
- Quick Reference: `.agent-workspace/shared-context/quick-reference.md`

### Research Guides (in dumuwaks project)
- DNS zone configuration guide
- Interserver VPS setup guide
- Nginx reverse proxy configuration
- MERN production deployment
- SSL/TLS setup with Let's Encrypt
- Security best practices

### Tech Stack References
- React Router v7: https://reactrouter.com/
- Vite: https://vitejs.dev/
- PM2: https://pm2.keymetrics.io/
- Nginx: https://nginx.org/en/docs/

---

## Success Criteria for Phase 1

**Track A (ementech-website):**
- ✅ React Router v7 configured and working
- ✅ 5 pages created (Home, Products, Services, About, Contact)
- ✅ Team members section added to About page
- ✅ Navigation using Link components
- ✅ All routing tests passing
- ✅ Production build created in `/dist`
- ✅ No TypeScript or console errors

**Track B (dumuwaks frontend):**
- ✅ Production API URL configured
- ✅ Socket.IO configured for HTTPS
- ✅ .env.production file created
- ✅ Backend integration tested locally
- ✅ Production build created in `/dist`
- ✅ Service worker registered
- ✅ No console errors

**Track C (configs):**
- ✅ PM2 ecosystem files created (backend + frontend)
- ✅ .env.production templates created (all projects)
- ✅ Nginx configs created (all 3 domains)
- ✅ Deployment scripts created and executable
- ✅ All config files syntax-checked
- ✅ Documentation complete

**Overall:**
- ✅ All deliverables complete
- ✅ All tests passing
- ✅ Handoff package created
- ✅ Ready to proceed to Phase 2 (VPS Setup)

---

## Timeline

**Estimated Duration:** 8-12 hours

**Track A:** 4-6 hours
**Track B:** 2-3 hours
**Track C:** 2-3 hours

**Recommended Completion:** Within 24 hours of starting

**Next Phase (VPS Setup) can begin in parallel** once Phase 1 is substantially complete (80%+).

---

## Final Notes

**You have full autonomy to execute this phase.** Make technical decisions as needed, document them, and proceed.

**Focus on quality over speed.** It's better to take extra time and do it right than to rush and create technical debt.

**Keep excellent documentation.** The next agents will rely on your work and notes.

**Ask questions if needed.** If anything is unclear, escalate to Project Director.

**Good luck! You're setting the foundation for the entire deployment.**

---

**Handoff Information:**
- **Phase:** 1 - Local Development Preparation
- **Agent:** General-Purpose Agent
- **Next Phase:** 2 - VPS Infrastructure Setup (Deployment-Ops-Agent)
- **Blocking:** None (this phase enables all future phases)

**Contact for Questions:**
- Escalate to: Project Director
- Location: `.agent-workspace/escalations/`
- Format: Create markdown file with issue description

**When Complete:**
- Create handoff package in `.agent-workspace/handoffs/to-project-director/phase-1-complete/`
- Update project-manifest.json
- Notify human stakeholder

---

**Let's get started! Begin with Track A (ementech-website) or work on all tracks in parallel - your choice.**
