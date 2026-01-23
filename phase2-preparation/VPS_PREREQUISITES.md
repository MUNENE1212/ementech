# VPS Prerequisites - Information Needed from User

**Phase:** 2 - Interserver VPS Setup
**Date:** January 18, 2026
**Purpose:** Identify all information needed before VPS setup can begin

---

## Executive Summary

Before we can begin Phase 2 (VPS Setup), we need specific information from you about your Interserver VPS, domain configuration, and third-party services. This document lists everything we need and why it's required.

**Why This Matters:** Starting VPS setup without complete information can lead to delays, misconfigurations, or security vulnerabilities. Gathering everything upfront ensures smooth execution.

---

## 1. VPS Access Information (CRITICAL)

### What We Need

| Information | Description | Where to Find |
|-------------|-------------|---------------|
| **VPS IP Address** | Public IP address of your Interserver VPS | Interserver control panel → VPS details |
| **Root Password** OR **SSH Key** | Credentials to access VPS as root user | Interserver control panel → VPS details → Root credentials |
| **VPS Hostname** (optional) | Hostname assigned to VPS (e.g., vps.ementech.co.ke) | Interserver control panel or your own records |

### Why We Need This
- **VPS IP**: Required to connect via SSH and run setup scripts
- **Root Access**: Required to install software, configure firewall, create users, and set up system services
- **SSH Key Preferred**: More secure than password authentication (we can help set this up if you don't have one)

### How to Access This Information

1. Log into your **Interserver Control Panel** (https://cp.interserver.net)
2. Navigate to **VPS** section
3. Find your VPS instance
4. Copy the **IP Address**
5. Note the **Root Password** (or download SSH private key)

### Security Best Practice

**Important:** Never share these credentials in unencrypted channels (email, chat). We recommend:
- Store credentials in a secure password manager
- Use SSH key authentication instead of passwords
- Provide credentials directly when we begin VPS setup

---

## 2. VPS Specifications & Configuration

### What We Need

| Information | Recommended Value | Your Current Value |
|-------------|------------------|-------------------|
| **Operating System** | Ubuntu 22.04 LTS | _________ |
| **RAM** | 4GB+ (2GB minimum) | _________ |
| **CPU Cores** | 2+ cores | _________ |
| **Storage** | 40GB+ SSD | _________ |
| **VPS Provider** | Interserver | Interserver ✓ |
| **VPS Plan/Slice** | 2-4 slices (depending on traffic) | _________ |

### Why We Need This

- **Operating System**: Our setup scripts are optimized for Ubuntu 22.04 LTS. Other distributions may require modifications.
- **RAM**: Running 3 applications (website + frontend + backend + MongoDB) requires sufficient memory:
  - **2GB**: Minimum (may need swap file)
  - **4GB**: Recommended for production
  - **8GB+**: Ideal for high traffic
- **CPU**: Multiple cores allow PM2 cluster mode for better performance
- **Storage**: 40GB provides room for applications, logs, and database growth

### How to Check Your Current VPS Specs

```bash
# Once you have SSH access, run:
free -h              # Check RAM
lscpu | grep "^CPU(s)" # Check CPU cores
df -h                # Check storage
lsb_release -a       # Check OS version
```

---

## 3. Domain Access & Configuration

### What We Need

| Information | Description | Where to Find |
|-------------|-------------|---------------|
| **Domain Registrar** | Where ementech.co.ke is registered | Your domain provider (e.g., Namecheap, GoDaddy) |
| **DNS Provider** | Service managing DNS records | Can be same as registrar or separate (e.g., Cloudflare) |
| **Admin Email** | Email for SSL certificates & domain contacts | admin@ementech.co.ke (recommended) |
| **Domain Access** | Login credentials to configure DNS | Your registrar/DNS provider control panel |

### Why We Need This

- **DNS Configuration**: We need to create A records pointing to your VPS IP
- **SSL Certificates**: Let's Encrypt requires an email address for certificate expiration notifications
- **DNS Propagation**: DNS changes can take 24-48 hours to propagate globally

### Required DNS Records

Once VPS setup begins, we'll need you to configure these DNS records:

```
Type    Name                    Value                    TTL
----    ----                    -----                    ----
A       @                       YOUR_VPS_IP              3600
A       www                     YOUR_VPS_IP              3600
A       app                     YOUR_VPS_IP              3600
A       api                     YOUR_VPS_IP              3600
```

### Your Task: Prepare DNS Configuration

**Before VPS Setup:**
1. Identify your DNS provider (check where your domain's nameservers point)
2. Ensure you can access your DNS control panel
3. Note your admin email address (for SSL certificates)
4. Decide if you want to use Cloudflare CDN (recommended for DDoS protection)

---

## 4. Third-Party Service API Keys

### What We Need

For the dumuwaks application to function fully in production, we need API credentials for:

#### A. Cloudinary (Image Storage)

| Credential | Description | Where to Get It |
|------------|-------------|-----------------|
| **Cloud Name** | Your Cloudinary cloud identifier | Cloudinary Dashboard → Settings |
| **API Key** | Public API key | Cloudinary Dashboard → Settings |
| **API Secret** | Secret key for server-side uploads | Cloudinary Dashboard → Settings |
| **Upload Preset** | Named upload configuration | Cloudinary Dashboard → Upload (create one) |

**Why Needed:** dumuwaks backend uploads user profile pictures and product images to Cloudinary CDN.

**Alternative:** Self-hosted image storage (not recommended for production - more complex, less scalable).

#### B. Africa's Talking (SMS Service - Kenya)

| Credential | Description | Where to Get It |
|------------|-------------|-----------------|
| **Username** | Your Africa's Talking account username | Africa's Talking Dashboard |
| **API Key** | API key for programmatic SMS | Africa's Talking Dashboard → API Settings |

**Why Needed:** dumuwaks sends SMS notifications (payment confirmations, order updates, etc.).

**Alternative:** Other SMS providers (e.g., Twilio, Bonga) would require code changes.

#### C. Email Service (Transactional Emails)

| Credential | Description | Where to Get It |
|------------|-------------|-----------------|
| **SMTP Host** | Email server hostname | smtp.gmail.com (for Gmail) |
| **SMTP Port** | Port number (usually 587 for TLS) | 587 |
| **SMTP Username** | Email address | your-email@gmail.com |
| **SMTP Password** | App-specific password | Gmail App Passwords (generate one) |
| **From Address** | Sender email address | noreply@amentech.co.ke (recommended) |

**Why Needed:** dumuwaks sends email notifications (user registration, password resets, order confirmations).

**Options:**
- **Gmail**: Free, but has sending limits (100-200 emails/day)
- **SendGrid**: Free tier (100 emails/day), better deliverability
- **Amazon SES**: Pay-as-you-go, very cost-effective at scale
- **Mailgun**: Free trial, then pay-as-you-go

#### D. M-Pesa Payment Integration (Optional - Can Be Added Later)

| Credential | Description | Where to Get It |
|------------|-------------|-----------------|
| **Consumer Key** | M-Pesa API consumer key | Safaricom Developer Portal |
| **Consumer Secret** | M-Pesa API secret | Safaricom Developer Portal |
| **Passkey** | Lipa Na M-Pesa passkey | Safaricom Developer Portal |
| **Shortcode** | Paybill/Till number | Your business shortcode (174379 for test) |
| **Environment** | sandbox or production | Choose based on testing stage |

**Why Needed:** dumuwaks processes M-Pesa payments for orders.

**Note:** This can be configured after initial deployment. Application will function without payments for testing.

#### E. Stripe Payment Integration (Optional - Alternative to M-Pesa)

| Credential | Description | Where to Get It |
|------------|-------------|-----------------|
| **Publishable Key** | Public key for frontend | Stripe Dashboard → API Keys |
| **Secret Key** | Secret key for backend | Stripe Dashboard → API Keys |
| **Webhook Secret** | For verifying webhook events | Stripe Dashboard → Webhooks → Create webhook |

**Why Needed:** dumuwaks processes international card payments via Stripe.

**Note:** This can be configured after initial deployment.

### What to Do Right Now

**Option 1: Provide All Credentials Before VPS Setup**
- Get all API keys before we start
- We configure everything during VPS setup
- Application is fully functional immediately after deployment

**Option 2: Provide Minimal Credentials, Add Services Later**
- Provide only VPS and domain access now
- We deploy with placeholder configurations
- You add API keys later via environment variables
- Application functions partially (without third-party integrations)

---

## 5. GitHub/Repository Access (If Using Git Deployment)

### What We Need

| Information | Description | Where to Find |
|-------------|-------------|---------------|
| **Repository URL** | GitHub/GitLab repository URLs | Your Git provider |
| **Deploy Key** OR **Personal Access Token** | For authentication | GitHub Settings → Developer Settings |
| **Branch Name** | Production branch (usually `main`) | Your repository |

**Why Needed:** For automated deployment via Git (optional - you can also deploy via rsync/scp).

**Alternative:** Manual deployment using rsync/scp (our deployment scripts support both methods).

---

## 6. Security Configuration Preferences

### What We Need

| Decision | Options | Recommended |
|----------|---------|-------------|
| **SSH Authentication** | Password-based, SSH key, or both | SSH key only |
| **Root Login** | Enabled or disabled after setup | Disabled (security best practice) |
| **Firewall** | UFW configuration rules | Strict (only 80, 443, 22) |
| **SSL/TLS** | Let's Encrypt (free) or custom certificate | Let's Encrypt |
| **Fail2Ban** | Enable intrusion prevention | Enabled |
| **Automatic Updates** | Enable or disable | Security updates only |

**Why We Need Your Preferences:** We can configure security according to your requirements. Our defaults follow industry best practices, but you may have specific compliance needs.

---

## 7. Backup & Disaster Recovery Preferences

### What We Need

| Decision | Options | Recommended |
|----------|---------|-------------|
| **Database Backups** | MongoDB Atlas automated or local cron jobs | MongoDB Atlas (if using) |
| **Backup Frequency** | Hourly, daily, weekly | Daily |
| **Backup Retention** | 7 days, 30 days, 90 days | 30 days |
| **Backup Location** | Local storage, remote storage (S3, etc.) | Remote (if budget allows) |

**Why We Need Your Preferences:** Backup strategy affects setup complexity and cost.

---

## Checklist: What to Provide Before Phase 2

Use this checklist to ensure you have everything ready:

### MUST HAVE (Cannot Start Without)

- [ ] **VPS IP Address**: __________________
- [ ] **Root SSH Access**: Password or SSH key file location
- [ ] **Operating System Confirmed**: Ubuntu 22.04 LTS (preferred) or ___________
- [ ] **VPS Specs Verified**: RAM: ___ GB, CPU: ___ cores, Storage: ___ GB
- [ ] **Domain Access**: Can log into DNS provider control panel
- [ ] **Admin Email**: __________________ (for SSL certificates)

### SHOULD HAVE (Delays Deployment If Missing)

- [ ] **Cloudinary Credentials**: Cloud Name, API Key, API Secret
- [ ] **Email Service**: SMTP credentials (or Gmail app password)
- [ ] **Africa's Talking**: Username and API Key (if using SMS)
- [ ] **Payment Integration**: M-Pesa or Stripe credentials (or configure later)

### NICE TO HAVE (Optional Enhancements)

- [ ] **GitHub Repository Access**: For Git-based deployment
- [ ] **Monitoring Service**: Sentry DSN, DataDog API key, etc.
- [ ] **Analytics**: Google Analytics ID, etc.
- [ ] **CDN Configuration**: Cloudflare account access

---

## Security Note: How to Share Credentials

**IMPORTANT:** For your security, do NOT email credentials or post them in chat.

### Recommended Methods

1. **Password Manager**: Share via Bitwarden, 1Password, LastPass, etc.
2. **Encrypted File**: Encrypt file with GPG and share key via separate channel
3. **Secure Notes**: Use encrypted notes in collaboration tools (Slack, etc.)
4. **Direct Entry**: Enter credentials directly when prompted during setup

### What NOT to Do

- ❌ Send credentials via email
- ❌ Post credentials in chat/discord/Slack (unless using secure feature)
- ❌ Store credentials in Git repository
- ❌ Use same password across multiple services

---

## Next Steps

### Once You Have All Information

1. **Fill in the checklist** above with actual values
2. **Contact the deployment team** with confirmation that prerequisites are ready
3. **Schedule VPS setup** time (estimated 2-4 hours for initial setup)
4. **Share credentials securely** using recommended methods above
5. **Verify DNS access** before setup begins

### If You Need Help

- **VPS Access**: Contact Interserver support if you can't find credentials
- **Domain Access**: Contact your domain registrar if you can't log in
- **API Keys**: Refer to service documentation (Cloudinary, Africa's Talking, etc.)
- **Security Questions**: Ask deployment team for recommendations

---

## Estimated Timeline

Assuming all prerequisites are ready:

| Task | Time Required |
|------|---------------|
| VPS initial setup & hardening | 1-2 hours |
| DNS configuration (after you make changes) | 1-48 hours (propagation time) |
| SSL certificate installation | 30 minutes (after DNS propagates) |
| Application deployment | 1-2 hours |
| Testing & verification | 1 hour |
| **Total** | **4-6 hours** (spread over 1-2 days due to DNS propagation) |

**Note:** DNS propagation is the only waiting period. All other work happens in sequence.

---

## Document Version

**Version:** 1.0
**Last Updated:** January 18, 2026
**Maintained By:** Ementech Deployment Team

**Changes:**
- v1.0 (2026-01-18): Initial version - Comprehensive prerequisites list

---

## Appendix: Where to Get Help

### Interserver VPS Support
- **Knowledge Base**: https://www.interserver.net/kb/
- **Support Ticket**: https://www.interserver.net/support/
- **Live Chat**: Available on Interserver website

### DNS Providers
- **Cloudflare**: https://developers.cloudflare.com/
- **Namecheap**: https://www.namecheap.com/support/
- **GoDaddy**: https://www.godaddy.com/help/

### Third-Party Services
- **Cloudinary**: https://cloudinary.com/documentation
- **Africa's Talking**: https://developers.africastalking.com/
- **Gmail SMTP**: https://support.google.com/mail/answer/7126229
- **SendGrid**: https://docs.sendgrid.com/
- **M-Pesa**: https://developer.safaricom.co.ke/
- **Stripe**: https://stripe.com/docs

### Deployment Team
- **Escalations**: Create ticket in `.agent-workspace/escalations/`
- **Questions**: Refer to project documentation in `/deployment/`
