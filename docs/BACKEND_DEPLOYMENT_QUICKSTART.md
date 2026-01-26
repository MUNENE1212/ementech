# Backend Deployment Quickstart

**Last Updated**: January 26, 2026
**Status**: READY FOR DEPLOYMENT

---

## PREREQUISITE CHECK

Before deploying, verify:

```bash
# 1. Backend exists locally
ls -la backend/src/server.js

# 2. Environment file configured
ls -la backend/.env

# 3. PM2 config exists
ls -la backend/ecosystem.config.cjs
```

---

## ONE-COMMAND DEPLOYMENT

```bash
cd deployment
./deploy-backend.sh
```

That's it! The script handles everything.

---

## WHAT THE SCRIPT DOES

1. ✅ Creates deployment package (tarball)
2. ✅ Uploads to VPS via SSH
3. ✅ Extracts to `/var/www/ementech-website/backend/`
4. ✅ Installs production dependencies (`npm ci --production`)
5. ✅ Starts backend with PM2
6. ✅ Saves PM2 configuration
7. ✅ Runs health checks

---

## VERIFY DEPLOYMENT

```bash
# Check PM2 status
ssh root@69.164.244.165 'pm2 list | grep ementech-backend'

# Should show: "ementech-backend" "online"

# Check API health
curl https://ementech.co.ke/api/health

# Should return: 200 status with JSON

# View logs
ssh root@69.164.244.165 'pm2 logs ementech-backend --lines 50'
```

---

## TROUBLESHOOTING

### Backend not starting

```bash
# Check logs
ssh root@69.164.244.165 'pm2 logs ementech-backend --err'

# Common issues:
# 1. Missing .env file → Configure it manually
# 2. MongoDB connection failed → Check MONGODB_URI
# 3. Port already in use → Check port 5001
```

### Directory doesn't exist

```bash
# Verify backend directory on VPS
ssh root@69.164.244.165 'ls -la /var/www/ementech-website/backend/'

# If missing, re-run deployment script
cd deployment && ./deploy-backend.sh
```

### PM2 process error

```bash
# Restart PM2 process
ssh root@69.164.244.165 'pm2 restart ementech-backend'

# Or delete and recreate
ssh root@69.164.244.165 'pm2 delete ementech-backend'
ssh root@69.164.244.165 'cd /var/www/ementech-website/backend && pm2 start ecosystem.config.cjs'
ssh root@69.164.244.165 'pm2 save'
```

---

## ENVIRONMENT CONFIGURATION

Backend requires these environment variables in `/var/www/ementech-website/backend/.env`:

```bash
# Required
PORT=5001
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
JWT_SECRET=<your-secret>

# Email (for email campaigns)
SMTP_HOST=mail.ementech.co.ke
SMTP_PORT=587
SMTP_USER=admin@ementech.co.ke
SMTP_PASS=<password>

# CORS
CORS_ORIGIN=https://ementech.co.ke,https://www.ementech.co.ke
```

---

## MANUAL DEPLOYMENT (IF SCRIPT FAILS)

```bash
# 1. Create package
cd backend
tar czf /tmp/backend.tar.gz --exclude=node_modules --exclude=logs .

# 2. Upload
scp /tmp/backend.tar.gz root@69.164.244.165:/tmp/

# 3. SSH to VPS
ssh root@69.164.244.165

# 4. Extract
mkdir -p /var/www/ementech-website/backend
cd /var/www/ementech-website/backend
tar xzf /tmp/backend.tar.gz

# 5. Install dependencies
npm ci --production

# 6. Configure environment
cp .env.example .env
nano .env  # Edit with production values

# 7. Start with PM2
pm2 start ecosystem.config.cjs
pm2 save

# 8. Verify
pm2 list
curl http://localhost:5001/api/health
```

---

## DRY RUN (TEST WITHOUT DEPLOYING)

```bash
cd deployment
./deploy-backend.sh --dry-run
```

This shows what would be deployed without making changes.

---

## REFERENCE

- **Full Deployment Guide**: `docs/DEPLOYMENT.md`
- **Investigation Report**: `docs/BACKEND_INVESTIGATION_REPORT.md`
- **Deployment Script**: `deployment/deploy-backend.sh`
- **PM2 Config**: `backend/ecosystem.config.cjs`

---

## SUPPORT

If deployment fails:

1. Check the investigation report for root cause analysis
2. Review PM2 logs: `pm2 logs ementech-backend --lines 100`
3. Check nginx logs: `tail -f /var/log/nginx/error.log`
4. Verify MongoDB connectivity
5. Test environment variables

---

**Quick Reference**:

| Command | Purpose |
|---------|---------|
| `./deploy-backend.sh` | Deploy backend |
| `./deploy-backend.sh --dry-run` | Test deployment |
| `pm2 list` | Check status |
| `pm2 logs ementech-backend` | View logs |
| `pm2 restart ementech-backend` | Restart process |
| `curl https://ementech.co.ke/api/health` | Test API |

---

**Status**: Backend is ready to deploy. No blockers found.
