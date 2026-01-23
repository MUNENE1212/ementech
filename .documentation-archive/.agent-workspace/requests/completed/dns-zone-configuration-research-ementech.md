# Comprehensive DNS Zone Configuration Research Report
## Domain: ementech.co.ke (Kenyan TLD)

**Last Updated:** 2026-01-18
**Research Date:** 2026-01-18
**Prepared For:** Ementetech - Multi-Project Deployment Strategy

---

## Executive Summary

This research provides comprehensive guidance for configuring DNS zones for ementech.co.ke to host multiple projects: a corporate React website and a full MERN stack application (Dumu Waks). The report covers DNS record configuration, subdomain strategy, security best practices, Kenyan .ke domain specifics, and integration with InterServer VPS infrastructure.

**Key Recommendations:**
1. Use InterServer's free DNS hosting service with nameservers `cdns1.interserver.net` and `cdns2.interserver.net`
2. Implement a clear subdomain strategy: `ementech.co.ke` for corporate site, `app.ementech.co.ke` for Dumu Waks
3. Consider Cloudflare for CDN/DNS management to improve performance for both Kenyan and global audiences
4. Configure proper email authentication (SPF, DKIM, DMARC) to prevent spam and phishing
5. Use TTL values of 1-4 hours during normal operations, reduce to 5 minutes before planned changes

---

## 1. DNS Zone Configuration

### 1.1 Required DNS Records for ementech.co.ke

#### **A Record (Address Record)**
- **Purpose:** Maps domain names to IPv4 addresses
- **Usage:** Direct traffic to your VPS server
- **Example Configuration:**
  ```
  ementech.co.ke.     IN  A       192.0.2.1
  www.ementech.co.ke. IN  A       192.0.2.1
  app.ementech.co.ke. IN  A       192.0.2.1
  ```

#### **AAAA Record (IPv6 Address)**
- **Purpose:** Maps domain names to IPv6 addresses
- **Usage:** Future-proofing for IPv6 adoption
- **Example Configuration:**
  ```
  ementech.co.ke.     IN  AAAA    2001:0db8:85a3::1
  www.ementech.co.ke. IN  AAAA    2001:0db8:85a3::1
  ```
- **Note:** Only configure if your VPS supports IPv6

#### **CNAME Record (Canonical Name)**
- **Purpose:** Creates aliases for domain names
- **Usage:** Points subdomains to other domains
- **Best Practice:** Use CNAME for www pointing to root domain
  ```
  www.ementech.co.ke. IN  CNAME   ementech.co.ke.
  ```
- **Warning:** Never point a CNAME to the root domain if you need other records (MX, TXT) at the root

#### **MX Record (Mail Exchange)**
- **Purpose:** Specifies mail servers for email delivery
- **Priority:** Lower numbers = higher priority
- **Example Configuration (using Google Workspace):**
  ```
  ementech.co.ke.  IN  MX  10  aspmx.l.google.com.
  ementech.co.ke.  IN  MX  20  alt1.aspmx.l.google.com.
  ementech.co.ke.  IN  MX  20  alt2.aspmx.l.google.com.
  ementech.co.ke.  IN  MX  30  alt3.aspmx.l.google.com.
  ementech.co.ke.  IN  MX  30  alt4.aspmx.l.google.com.
  ```

#### **TXT Records (Text Records)**
Multiple TXT records are needed for different purposes:

**SPF (Sender Policy Framework):**
```
ementech.co.ke.  IN  TXT  "v=spf1 include:_spf.google.com ~all"
```

**DKIM (DomainKeys Identified Mail):**
```
selector1._domainkey.ementech.co.ke.  IN  TXT  "v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA..."
```

**DMARC (Domain-based Message Authentication):**
```
_dmarc.ementech.co.ke.  IN  TXT  "v=DMARC1; p=none; rua=mailto:admin@ementech.co.ke"
```

**Domain Verification (if using Google Workspace, etc.):**
```
ementech.co.ke.  IN  TXT  "google-site-verification=verificationcodehere"
```

#### **NS Records (Name Server)**
- **Purpose:** Specifies authoritative DNS servers
- **Using InterServer:**
  ```
  ementech.co.ke.  IN  NS  cdns1.interserver.net.
  ementech.co.ke.  IN  NS  cdns2.interserver.net.
  ```
- **Using Cloudflare:**
  ```
  ementech.co.ke.  IN  NS  ada.ns.cloudflare.com.
  ementech.co.ke.  IN  NS  kai.ns.cloudflare.com.
  ```

#### **SOA Record (Start of Authority)**
- **Purpose:** Contains administrative information about the DNS zone
- **Automatically created** by DNS hosting provider
- **Includes:** Primary nameserver, admin email, serial number, timers

### 1.2 Complete DNS Zone File Example

```
; Zone file for ementech.co.ke
; TTL: 3600 seconds (1 hour)

$TTL 3600
@       IN  SOA     cdns1.interserver.net. admin.ementech.co.ke. (
                        2026011801  ; Serial (YYYYMMDDNN)
                        3600        ; Refresh (1 hour)
                        1800        ; Retry (30 minutes)
                        604800      ; Expire (1 week)
                        86400       ; Minimum TTL (1 day)
                    )

; Name Servers
@       IN  NS      cdns1.interserver.net.
@       IN  NS      cdns2.interserver.net.

; Main Domain (Corporate Website)
@       IN  A       192.0.2.1
@       IN  AAAA    2001:0db8:85a3::1

; WWW Subdomain
www     IN  A       192.0.2.1
www     IN  AAAA    2001:0db8:85a3::1

; Dumu Waks Application
app     IN  A       192.0.2.1
app     IN  AAAA    2001:0db8:85a3::1

; Email Servers (Google Workspace example)
@       IN  MX  10  aspmx.l.google.com.
@       IN  MX  20  alt1.aspmx.l.google.com.
@       IN  MX  20  alt2.aspmx.l.google.com.
@       IN  MX  30  alt3.aspmx.l.google.com.
@       IN  MX  30  alt4.aspmx.l.google.com.

; TXT Records
@       IN  TXT  "v=spf1 include:_spf.google.com ~all"
@       IN  TXT  "google-site-verification=yourcodehere"

; DMARC
_dmarc  IN  TXT  "v=DMARC1; p=none; rua=mailto:admin@ementech.co.ke; ruf=mailto:admin@ementech.co.ke"

; DKIM (example - actual selector and key from email provider)
google._domainkey  IN  TXT  "v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA..."
```

### 1.3 TTL (Time-to-Live) Recommendations

**TTL Best Practices for 2025:**

| Record Type | Normal Operation | Before Changes | Dynamic Content |
|-------------|------------------|----------------|-----------------|
| A/AAAA | 1-4 hours (3600-14400s) | 5 minutes (300s) | 1-5 minutes (60-300s) |
| CNAME | 1-4 hours (3600-14400s) | 5 minutes (300s) | N/A |
| MX | 4-24 hours (14400-86400s) | 1 hour (3600s) | N/A |
| TXT | 1-4 hours (3600-14400s) | 5 minutes (300s) | N/A |
| NS | 24-48 hours (86400-172800s) | 24 hours (86400s) | N/A |

**Recommended Strategy:**
1. **Normal operation:** Use TTL of 3600-14400 seconds (1-4 hours) for A/AAAA records
2. **Before planned changes:** Lower TTL to 300 seconds (5 minutes) 24-48 hours in advance
3. **After changes:** Wait for full propagation (24-48 hours) then restore normal TTL
4. **Email records:** Keep MX and TXT records with higher TTL (4-24 hours) as they change infrequently

**Note on Cloudflare Auto-TTL:** Cloudflare recommends 300 seconds (5 minutes) for auto-TTL configuration.

---

## 2. Subdomain Strategy

### 2.1 Recommended Subdomain Structure

**Option A: Functional-Based Structure (RECOMMENDED)**
```
ementech.co.ke          → Corporate website (React multipage)
www.ementech.co.ke      → Corporate website (redirects to root)
app.ementech.co.ke      → Dumu Waks platform (MERN application)
api.ementech.co.ke      → API endpoints (if needed)
blog.ementech.co.ke     → Company blog (future)
```

**Advantages:**
- Clear separation of concerns
- Easy to understand and maintain
- Scalable for future projects
- Professional appearance
- SSL certificate easier to manage (wildcard certificate covers all)

**Option B: Project-Based Structure**
```
ementech.co.ke              → Corporate website
dumuwaks.ementech.co.ke    → Dumu Waks platform
project3.ementech.co.ke    → Future project 3
```

**Advantages:**
- Each project has its own identity
- Clear project separation
- Easy to migrate projects to separate domains later

**Disadvantages:**
- Less professional appearance
- Longer subdomain names

### 2.2 Wildcard Subdomain Configuration

For maximum flexibility, consider setting up a wildcard subdomain:

```
*.ementech.co.ke.  IN  A  192.0.2.1
```

**Use Cases:**
- Development environments (dev.ementech.co.ke, staging.ementech.co.ke)
- User-specific subdomains (tenant1.app.ementech.co.ke)
- Testing environments
- Future projects without updating DNS

**Setup Steps:**
1. Log into your DNS hosting provider (InterServer or Cloudflare)
2. Create a new A record
3. Name: `*`
4. Points to: Your VPS IP address
5. Configure your web server (nginx/Apache) to handle wildcard subdomains

**Nginx Wildcard Configuration Example:**
```nginx
server {
    listen 80;
    server_name *.ementech.co.ke;

    # Routing logic based on subdomain
    if ($host ~* ^app\.ementech\.co\.ke$) {
        set $app_root /var/www/dumuwaks;
    }

    if ($host ~* ^www\.ementech\.co\.ke$) {
        set $app_root /var/www/website;
    }

    root $app_root;
    # ... rest of configuration
}
```

### 2.3 Future Subdomain Planning

**Reserved Subdomains:**
- `app.ementech.co.ke` - Dumu Waks (current)
- `www.ementech.co.ke` - Corporate website (current)
- `api.ementech.co.ke` - API services (future)
- `admin.ementech.co.ke` - Admin panel (future)
- `blog.ementech.co.ke` - Company blog (future)
- `dev.ementech.co.ke` - Development environment (internal)
- `staging.ementech.co.ke` - Staging environment (internal)
- `mail.ementech.co.ke` - Email/webmail access
- `portal.ementech.co.ke` - Client portal (future)

**Naming Conventions:**
- Use lowercase letters only
- Avoid underscores (use hyphens if needed)
- Keep names short and memorable
- Use descriptive, functional names
- Avoid using trademarks of other companies

---

## 3. Domain Registrar Configuration

### 3.1 DNS Management Options

**Option 1: Use InterServer's Free DNS Hosting (RECOMMENDED for starting)**

**Advantages:**
- Free service with InterServer VPS
- Simple integration with your VPS
- Direct management through InterServer control panel
- Good for simple setups

**Steps:**
1. Log into your domain registrar (where you bought ementech.co.ke)
2. Find DNS/Nameserver settings for ementech.co.ke
3. Change nameservers to:
   - Primary: `cdns1.interserver.net`
   - Secondary: `cdns2.interserver.net`
4. Save changes
5. Log into InterServer portal at `https://my.interserver.net`
6. Navigate to **Domains → DNS Manager**
7. Add your domain and VPS IP address
8. Configure DNS records (see Section 1.2)
9. Wait 24-48 hours for propagation

**Option 2: Use Cloudflare DNS (RECOMMENDED for performance)**

**Advantages:**
- Free CDN with global edge network
- Built-in DDoS protection
- Faster DNS resolution (10-15ms faster than competitors)
- Better performance for global and Kenyan audiences
- SSL/TLS certificates (free)
- DNSSEC support
- Advanced security features

**Steps:**
1. Create free account at https://cloudflare.com
2. Add your domain (ementech.co.ke)
3. Cloudflare will scan existing DNS records
4. Choose the **Free plan** ($0/month)
5. Cloudflare will provide two nameservers (e.g., `ada.ns.cloudflare.com`, `kai.ns.cloudflare.com`)
6. Log into your domain registrar
7. Update nameservers to Cloudflare's nameservers
8. Wait up to 24 hours for Cloudflare to detect the change
9. Configure DNS records in Cloudflare dashboard
10. Configure SSL/TLS settings (Flexible or Full mode)
11. Set up Page Rules for caching strategies

**Option 3: Keep DNS at Registrar**

**Advantages:**
- One-stop management
- No additional accounts needed

**Disadvantages:**
- May lack advanced features
- No CDN benefits
- Limited DDoS protection

### 3.2 Pointing Domain to InterServer VPS

**Using InterServer Nameservers:**

1. **Change Nameservers at Registrar:**
   - Log into your KENIC-accredited registrar
   - Find DNS Management/Nameserver settings
   - Change to:
     ```
     Primary: cdns1.interserver.net
     Secondary: cdns2.interserver.net
     ```

2. **Configure DNS in InterServer Portal:**
   - Log into https://my.interserver.net
   - Navigate to: **Domains → DNS Manager**
   - Click: **Add Domain**
   - Enter:
     - Domain: `ementech.co.ke`
     - IP Address: Your VPS IP (e.g., `192.0.2.1`)
   - Click: **Add Zone**

3. **Verify DNS Records:**
   - After 24-48 hours, test with:
     ```bash
     nslookup ementech.co.ke
     dig ementech.co.ke
     ```

**Using Cloudflare with InterServer VPS:**

1. **Set up Cloudflare** (follow Option 2 steps above)
2. **Configure DNS Records to point to VPS:**
   - A record: `@` → Your VPS IP
   - A record: `www` → Your VPS IP
   - A record: `app` → Your VPS IP
3. **Configure SSL/TLS:**
   - SSL/TLS → Full or Full (strict) mode
   - Enable Always Use HTTPS
   - Enable Automatic HTTPS Rewrites
4. **Configure Caching:**
   - Caching → Configuration → Standard
   - Set up Page Rules for different subdomains

### 3.3 Nameserver Configuration

**Standard Setup (Two Nameservers):**
```
Primary:   cdns1.interserver.net
Secondary: cdns2.interserver.net
```

**Using Cloudflare:**
```
Primary:   ada.ns.cloudflare.com (example)
Secondary: kai.ns.cloudflare.com (example)
```

**Custom Nameservers (Advanced):**
If you want branded nameservers like `ns1.ementech.co.ke`:

1. Register child nameservers at your registrar
2. Create A records for ns1 and ns2 pointing to IP addresses
3. Use glue records at registry level
4. Configure DNS hosting on those IPs

**Note:** This requires additional setup and is recommended only for advanced users with dedicated DNS infrastructure.

### 3.4 DNS Propagation

**Timing:**
- **Standard propagation:** 24-48 hours
- **Typical observable propagation:** 2-6 hours for most users
- **Full global propagation:** Up to 72 hours in rare cases

**Factors Affecting Propagation:**
- TTL values of previous records
- ISP DNS caching
- Geographic location
- DNS resolver implementation

**Testing Propagation:**
- Use https://www.whatsmydns.net/ to check global propagation
- Use https://dnschecker.org/ for multi-location verification
- Command line testing:
  ```bash
  # Test specific nameserver
  dig @8.8.8.8 ementech.co.ke

  # Check authoritative nameservers
  dig ns ementech.co.ke

  # Check specific record type
  dig A ementech.co.ke
  dig MX ementech.co.ke
  ```

**Best Practice:**
- Make DNS changes during low-traffic periods
- Lower TTL 24-48 hours before planned changes
- Monitor propagation using online tools
- Keep old services running until propagation completes

---

## 4. Security & Performance

### 4.1 DNS Security

**DNSSEC (DNS Security Extensions)**

DNSSEC adds cryptographic signatures to DNS data to verify authenticity.

**Benefits:**
- Prevents DNS spoofing and cache poisoning
- Validates that DNS responses are authentic
- Protects against man-in-the-middle attacks

**Implementation:**
- Supported by Cloudflare (free tier)
- Check with your DNS provider for support
- Requires signing your DNS zone

**Configuration (Cloudflare Example):**
1. Log into Cloudflare dashboard
2. Select domain: ementech.co.ke
3. Navigate to: **DNS → DNSSEC**
4. Click: **Enable**
5. Add DS record at your registrar (Cloudflare provides this)

**DNS Firewall**
- Use DNS filtering to block malicious domains
- Cloudflare offers DNS firewall feature
- Can block known malware/phishing domains

**Access Control:**
- Limit zone transfers to authorized IPs only
- Use TSIG (Transaction SIGnature) for zone transfers
- Implement IP whitelisting for DNS management access

### 4.2 Email Authentication (SPF, DKIM, DMARC)

**Complete Email Protection Setup:**

**1. SPF (Sender Policy Framework)**
```
ementech.co.ke.  IN  TXT  "v=spf1 include:_spf.google.com ~all"
```

**Breakdown:**
- `v=spf1`: SPF version
- `include:_spf.google.com`: Authorize Google's mail servers
- `~all`: Soft fail - mark but don't reject unauthorized mail

**For Microsoft 365:**
```
ementech.co.ke.  IN  TXT  "v=spf1 include:spf.protection.outlook.com ~all"
```

**For custom mail server:**
```
ementech.co.ke.  IN  TXT  "v=spf1 ip4:192.0.2.1 ~all"
```

**2. DKIM (DomainKeys Identified Mail)**

DKIM requires generating a key pair:
- Private key: Stored on your mail server
- Public key: Published in DNS

**Example Record:**
```
google._domainkey.ementech.co.ke.  IN  TXT  "v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC..."
```

**Setup with Google Workspace:**
1. Log into Google Admin Console
2. Navigate to: **Apps → Google Workspace → Gmail → Authentication**
3. Generate DKIM key
4. Copy the TXT record provided
5. Add to your DNS zone
6. Click **Start Authentication** in Google Admin Console

**3. DMARC (Domain-based Message Authentication)**

**Start with monitoring mode (p=none):**
```
_dmarc.ementech.co.ke.  IN  TXT  "v=DMARC1; p=none; rua=mailto:admin@ementech.co.ke; ruf=mailto:admin@ementech.co.ke; sp=none; rf=afrf; pct=100"
```

**Breakdown:**
- `v=DMARC1`: DMARC version
- `p=none`: Monitoring mode only (recommended starting point)
- `rua`: Send aggregate reports to this email
- `ruf`: Send forensic reports to this email
- `sp=none`: Policy for subdomains
- `pct=100`: Apply policy to 100% of emails

**Progressive DMARC Implementation:**
1. **Week 1-2:** `p=none` (monitor only)
2. **Week 3-4:** `p=quarantine` (move to spam)
3. **After 1 month:** `p=reject` (block failed emails) - if confident

**Testing Email Authentication:**
- Use https://mxtoolbox.com/dmarc.aspx
- Send test email to: check-auth@verifier.port25.com
- Monitor DMARC reports sent to rua email

### 4.3 DDoS Protection

**Cloudflare's Free DDoS Protection:**
- Automatically enabled with Cloudflare DNS
- Protects against layer 3, 4, and 7 attacks
- No configuration needed
- Unlimited bandwidth for DDoS mitigation

**Additional Protection Measures:**
1. **Rate Limiting:**
   - Configure rate limits in Cloudflare
   - Limit requests per minute per IP
   - Protect against brute force attacks

2. **Challenge Platforms:**
   - Enable JavaScript challenge for suspicious traffic
   - Use CAPTCHA for form submissions
   - Implement bot detection

3. **Anycast Network:**
   - Cloudflare uses Anycast to distribute attacks
   - Traffic automatically routed to nearest data center
   - Attack absorbed at edge, not your origin

**InterServer VPS Protection:**
- Basic DDoS mitigation included
- Consider upgrading to advanced protection if needed
- Monitor bandwidth usage for attack patterns

### 4.4 CDN Integration

**Recommended: Cloudflare CDN (Free Tier)**

**Coverage in Africa/Middle East:**
- Cloudflare has 33.64% market share in MEA region
- PoPs (Points of Presence) in:
  - Nairobi, Kenya
  - Johannesburg, South Africa
  - Multiple Middle East locations
  - European locations serving East Africa

**Benefits for ementech.co.ke:**
1. **Performance:**
   - Content cached at edge locations
   - 10-15ms faster than AWS CloudFront globally
   - Reduced latency for Kenyan users

2. **Bandwidth Savings:**
   - Static assets served from CDN
   - Reduced load on VPS
   - Free unlimited bandwidth on Cloudflare free tier

3. **Security:**
   - Web Application Firewall (WAF)
   - DDoS protection
   - SSL/TLS termination

**Setup Steps:**
1. Create Cloudflare account (see Section 3.1, Option 2)
2. Configure DNS records pointing to VPS
3. Enable CDN:
   - **Caching → Configuration → Standard**
   - **Speed → Optimization → Auto Minify** (CSS, JS, HTML)
   - **Speed → Optimization → Brotli** compression
4. Configure Page Rules:
   ```
   Rule 1: *app.ementech.co.ke/*
   - Cache Level: Bypass (for dynamic MERN app)

   Rule 2: *ementech.co.ke/static/*
   - Cache Level: Cache Everything
   - Edge Cache TTL: 1 month

   Rule 3: *ementech.co.ke/images/*
   - Cache Level: Cache Everything
   - Edge Cache TTL: 1 year
   ```

**Alternative: AWS CloudFront**

**When to use:**
- If already using AWS services (S3, EC2)
- Need advanced geo-targeting
- Require Lambda@Edge functionality

**Setup:**
- Create CloudFront distribution
- Origin: Your InterServer VPS
- Price classes: Include Africa
- Configure behaviors for different paths

**Comparison:**
| Feature | Cloudflare | AWS CloudFront |
|---------|-----------|----------------|
| Cost | Free tier available | Pay-as-you-go |
| Setup complexity | Simple | Moderate |
| Kenya performance | Excellent (Nairobi POP) | Good |
| DDoS protection | Included | Included (extra cost) |
| SSL | Free | Paid certificates |
| MEA market share | 33.64% | 20.67% |

**Recommendation:** Start with Cloudflare free tier for best balance of performance, cost, and features.

### 4.5 Load Balancing Considerations

**DNS Round Robin (Basic Load Balancing)**

**Setup:**
Create multiple A records with different IPs:
```
ementech.co.ke.  IN  A  192.0.2.1
ementech.co.ke.  IN  A  192.0.2.2
ementech.co.ke.  IN  A  192.0.2.3
```

**Advantages:**
- Simple to set up
- No additional cost
- Basic traffic distribution

**Limitations:**
- No health checking
- DNS caching can cause imbalance
- Not true load balancing
- If one server fails, traffic still sent there

**Recommendation:** Use only for simple scenarios with multiple VPS instances where occasional downtime is acceptable.

**Cloudflare Load Balancing (Paid Feature)**

**Benefits:**
- Real health checks
- Geographic routing
- Smart steering based on latency
- Automatic failover

**Cost:** Starts at $5/month plus $0.025 per million DNS queries

**When to Use:**
- Multiple VPS instances
- High availability requirements
- Global audience
- Complex routing needs

**Application-Level Load Balancing (Recommended for MERN Stack)**

**Nginx as Reverse Proxy/Load Balancer:**

```nginx
upstream dumuwaks_backend {
    # Multiple app servers
    server 192.0.2.1:3000;
    server 192.0.2.1:3001;
    server 192.0.2.1:3002;

    # Load balancing method
    least_conn;  # or: ip_hash, least_time
}

server {
    listen 80;
    server_name app.ementech.co.ke;

    location / {
        proxy_pass http://dumuwaks_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket support (if needed for Dumu Waks)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Static files served directly
    location /static/ {
        root /var/www/dumuwaks;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API endpoints
    location /api/ {
        proxy_pass http://dumuwaks_backend/api/;
        # Add rate limiting
        limit_req zone=api_limit burst=20 nodelay;
    }
}

# Rate limiting zone
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
```

**PM2 Cluster Mode for Node.js:**

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'dumuwaks',
    script: './server.js',
    instances: 'max',  // Use all CPU cores
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
```

**Benefits:**
- Utilizes all CPU cores
- Automatic failover
- Zero-downtime reloads
- Built-in load balancing

** HAProxy (Advanced Option):**

For more sophisticated load balancing needs:

```
frontend dumuwaks_front
    bind *:80
    bind *:443 ssl crt /etc/ssl/certs/ementech.co.ke.pem
    default_backend dumuwaks_back

backend dumuwaks_back
    balance roundrobin
    option httpchk GET /health
    server app1 192.0.2.1:3000 check
    server app2 192.0.2.1:3001 check
    server app3 192.0.2.1:3002 check
```

---

## 5. Kenyan .ke Domain Specifics

### 5.1 .ke Domain Requirements

**Registry: KENIC (Kenya Network Information Centre)**
- Website: https://kenic.or.ke/
- Official registry for .ke domains
- Managed by accredited registrars

**Domain Categories:**
- `.co.ke` - Commercial entities (ementech.co.ke)
- `.or.ke` - Non-profit organizations
- `.ac.ke` - Academic institutions (requires documentation)
- `.sc.ke` - Schools (requires specific documentation)
- `.ne.ke` - Network providers
- `.go.ke` - Government entities
- `.info.ke` - Information sites
- `.me.ke` - Personal websites

**Registration Requirements for .co.ke:**
- Register through KENIC-accredited registrar
- No residency requirement (varies by registrar)
- No specific documentation required for basic .co.ke
- Standard domain registration process

**Accredited Registrars:**
Some popular KENIC-accredited registrars include:
- Kenya Website Experts
- Truehost Cloud
- Sasahost
- Host Africa
- Many others (full list on KENIC website)

**Domain Regulations:**
- Governed by Kenya Information and Communications Act
- Domain Name Regulations (2013, updated 2025)
- Managed by Communications Authority of Kenya

### 5.2 Local DNS Hosting Options in Kenya

**Kenyan DNS Hosting Providers:**

1. **Local Registrars with DNS Hosting:**
   - Most accredited registrars offer free DNS hosting
   - Generally reliable for basic setups
   - May lack advanced features
   - Support may be local (beneficial for local businesses)

2. **Regional Providers:**
   - Several South African providers serve the African market
   - May have better infrastructure
   - Often more feature-rich

3. **International Providers (Recommended):**
   - **Cloudflare:** Has PoP in Nairobi, excellent global coverage
   - **InterServer:** Your VPS provider, integrated service
   - **AWS Route 53:** If using AWS infrastructure
   - **Google Cloud DNS:** If using Google Cloud services

**Recommendation:**
- **Start:** InterServer DNS (simple, integrated)
- **Upgrade to:** Cloudflare for performance and security features

### 5.3 Latency Considerations

**Kenya Internet Infrastructure:**
- Multiple submarine cable landings (TEAMs, SEACOM, EASSy)
- Improving domestic connectivity
- Growing data center presence in Nairobi

**Latency Comparison:**

| DNS Server Location | Latency from Nairobi | Notes |
|---------------------|---------------------|-------|
| Local (Nairobi) | 1-5ms | Best option if available |
| South Africa | 50-100ms | Regional option |
| Europe | 100-200ms | Common for international providers |
| US East Coast | 200-300ms | Higher latency |
| Global CDN (Cloudflare) | 5-20ms | Optimized routing, Nairobi POP |

**Performance Testing from Kenya:**
```bash
# Test DNS resolution time
dig @cdns1.interserver.net ementech.co.ke

# Compare with Cloudflare
dig @1.1.1.1 ementech.co.ke

# Test with Kenyan DNS
dig @196.216.167.1 ementech.co.ke  # Safaricom DNS
```

**Recommendations:**
1. **For Kenyan audience:** Cloudflare (Nairobi POP) or InterServer DNS
2. **For global audience:** Cloudflare or AWS Route 53
3. **Testing:** Always test DNS resolution from target locations

**Geographic DNS:**
- Cloudflare and AWS Route 53 support geographic routing
- Can route Kenyan users to nearest server
- Configure geo-based routing if you have multiple VPS locations

---

## 6. Step-by-Step Setup Process

### Phase 1: Initial Domain Configuration (Week 1)

**Step 1: Gather Information**
- Domain: ementech.co.ke
- VPS IP address: [Your InterServer VPS IP]
- Access to domain registrar account
- InterServer portal credentials

**Step 2: Choose DNS Hosting**
- Decide between: InterServer DNS vs Cloudflare DNS
- Recommendation: Start with InterServer, migrate to Cloudflare later

**Step 3: Configure Nameservers**
1. Log into domain registrar
2. Locate DNS/Nameserver settings
3. Update nameservers:
   - If InterServer: `cdns1.interserver.net`, `cdns2.interserver.net`
   - If Cloudflare: [Provided during Cloudflare setup]
4. Save changes
5. Note: This change takes 24-48 hours to propagate

**Step 4: Configure DNS Records**
1. Log into chosen DNS host
2. Add basic records:
   ```
   @ (A) → Your VPS IP
   www (A) → Your VPS IP
   app (A) → Your VPS IP
   ```
3. Set TTL: 3600 seconds (1 hour)

**Step 5: Test DNS Configuration**
```bash
# Test from local machine
nslookup ementech.co.ke
dig ementech.co.ke

# Check specific nameservers
dig @cdns1.interserver.net ementech.co.ke

# Check all record types
dig any ementech.co.ke

# Check from different locations
# Use: https://www.whatsmydns.net/
```

### Phase 2: Email Configuration (Week 1-2)

**Step 1: Choose Email Provider**
- Options: Google Workspace, Microsoft 365, Zoho Mail, or custom mail server
- Recommendation: Google Workspace or Zoho Mail (free tier available)

**Step 2: Configure MX Records**
```
ementech.co.ke.  IN  MX  10  aspmx.l.google.com.
ementech.co.ke.  IN  MX  20  alt1.aspmx.l.google.com.
ementech.co.ke.  IN  MX  20  alt2.aspmx.l.google.com.
```

**Step 3: Configure SPF**
```
ementech.co.ke.  IN  TXT  "v=spf1 include:_spf.google.com ~all"
```

**Step 4: Configure DKIM**
- Generate keys in email provider
- Add TXT record provided by provider

**Step 5: Configure DMARC**
```
_dmarc.ementech.co.ke.  IN  TXT  "v=DMARC1; p=none; rua=mailto:admin@ementech.co.ke; ruf=mailto:admin@ementech.co.ke; pct=100"
```

**Step 6: Test Email Authentication**
- Use: https://mxtoolbox.com/dkim.aspx
- Use: https://mxtoolbox.com/spf.aspx
- Use: https://mxtoolbox.com/dmarc.aspx
- Send test email and check headers

### Phase 3: Web Server Configuration (Week 2)

**Step 1: Configure nginx for Corporate Site**
```nginx
server {
    listen 80;
    server_name ementech.co.ke www.ementech.co.ke;

    root /var/www/ementech-website/build;
    index index.html;

    # React Router fallback
    location / {
        try_files $uri /index.html;
    }

    # Static assets caching
    location /static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

**Step 2: Configure nginx for Dumu Waks**
```nginx
server {
    listen 80;
    server_name app.ementech.co.ke;

    # Proxy to MERN app
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # API endpoints
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Static files
    location /static/ {
        root /var/www/dumuwaks;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**Step 3: Deploy React Corporate Site**
```bash
# Build the React app
cd /var/www/ementech-website
npm run build

# Copy to nginx directory
sudo cp -r build/* /var/www/ementech-website/build/

# Set permissions
sudo chown -R www-data:www-data /var/www/ementech-website/build

# Restart nginx
sudo systemctl restart nginx
```

**Step 4: Deploy MERN App (Dumu Waks)**
```bash
# Using PM2
cd /var/www/dumuwaks
pm2 start server.js --name dumuwaks
pm2 save
pm2 startup
```

### Phase 4: SSL/TLS Configuration (Week 2-3)

**Step 1: Install Certbot**
```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx
```

**Step 2: Obtain SSL Certificates**
```bash
# For corporate site
sudo certbot --nginx -d ementech.co.ke -d www.ementech.co.ke

# For Dumu Waks
sudo certbot --nginx -d app.ementech.co.ke
```

**Step 3: Auto-renewal Setup**
```bash
# Test renewal
sudo certbot renew --dry-run

# Certbot sets up auto-renewal cron job automatically
# Verify with:
sudo systemctl status certbot.timer
```

**Step 4: Update nginx Configuration**
After Certbot, nginx config is automatically updated with SSL:
```nginx
server {
    listen 443 ssl http2;
    server_name ementech.co.ke www.ementech.co.ke;

    ssl_certificate /etc/letsencrypt/live/ementech.co.ke/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ementech.co.ke/privkey.pem;
    # ... rest of configuration
}
```

**Alternative: Cloudflare SSL**
If using Cloudflare:
1. Enable SSL/TLS in Cloudflare dashboard
2. Choose "Full" or "Full (strict)" mode
3. Cloudflare provides SSL between edge and your VPS
4. Optional: Use Cloudflare Origin Certificate

### Phase 5: CDN Integration (Week 3-4)

**Step 1: Set Up Cloudflare** (if not already done)
1. Create Cloudflare account
2. Add domain
3. Update nameservers at registrar
4. Wait for activation

**Step 2: Configure DNS Records**
```
@ (A) → Your VPS IP, Proxy status: Proxied (orange cloud)
www (CNAME) → @, Proxy status: Proxied
app (A) → Your VPS IP, Proxy status: Proxied
```

**Step 3: Configure SSL/TLS**
1. SSL/TLS → Full or Full (strict)
2. Enable "Always Use HTTPS"
3. Enable "Automatic HTTPS Rewrites"

**Step 4: Configure Caching**
1. Caching → Configuration → Standard
2. Set Browser Cache TTL: Respect Existing Headers
3. Purge all files after first deployment

**Step 5: Create Page Rules**
```
Rule 1: *app.ementech.co.ke/*
- Cache Level: Bypass
- Disable Performance

Rule 2: *ementech.co.ke/static/*
- Cache Level: Cache Everything
- Edge Cache TTL: 1 month

Rule 3: *ementech.co.ke/*
- Cache Level: Standard
```

**Step 6: Configure Security**
1. Security → Settings → Security Level: Medium
2. Security → Settings → Bot Fight Mode: On
3. Security → Settings → Challenge Passage: 30 minutes

### Phase 6: Monitoring & Optimization (Ongoing)

**Step 1: Set Up Monitoring**
```bash
# Install monitoring tools
sudo apt install htop iotop

# Set up log rotation
sudo nano /etc/logrotate.conf
```

**Step 2: Monitor DNS Health**
- Use: https://dnschecker.org/
- Set up automated monitoring: UptimeRobot, Pingdom
- Check DNS propagation after changes

**Step 3: Monitor Performance**
```bash
# Test load time
curl -o /dev/null -s -w '%{time_total}\n' https://ementech.co.ke

# Check nginx status
sudo systemctl status nginx

# Check PM2 status
pm2 status
```

**Step 4: Regular Maintenance Tasks**
- Weekly: Check SSL certificate expiry
- Monthly: Review DNS records for accuracy
- Quarterly: Review and update TTL values if needed
- Annually: Review DNS hosting provider choice

---

## 7. Common Pitfalls to Avoid

### 7.1 DNS Configuration Mistakes

**1. CNAME to Root Domain**
- ❌ **Wrong:** `www.ementech.co.ke. IN CNAME ementech.co.ke.` when you need other records
- ✅ **Correct:** Use A records for root domain, CNAME for subdomains only
- **Why:** You cannot have other records (MX, TXT) at the same level as CNAME

**2. Missing WWW Record**
- ❌ **Wrong:** Only create `@` record, forget `www`
- ✅ **Correct:** Always create both `@` and `www` records
- **Why:** Many users instinctively type www, should work

**3. Incorrect TTL Management**
- ❌ **Wrong:** Set TTL to 300 seconds during normal operation
- ✅ **Correct:** Use 3600-14400 seconds normally, lower before changes
- **Why:** Too low TTL causes excessive DNS queries, too high delays propagation

**4. SPF Record Syntax Errors**
- ❌ **Wrong:** `v=spf1 include:_spf.google.com all`
- ✅ **Correct:** `v=spf1 include:_spf.google.com ~all`
- **Why:** Missing tilde (~) means hard fail, may block legitimate email

**5. DMARC Starting with Reject**
- ❌ **Wrong:** Start with `p=reject`
- ✅ **Correct:** Start with `p=none`, monitor, then progress
- **Why:** May block legitimate email before SPF/DKIM are properly configured

### 7.2 Subdomain Strategy Mistakes

**1. Inconsistent Naming**
- ❌ **Wrong:** Mix of `app.domain.com`, `application.domain.com`, `service.domain.com`
- ✅ **Correct:** Choose consistent naming convention and stick to it

**2. Too Many Subdomains**
- ❌ **Wrong:** Create separate subdomain for each small feature
- ✅ **Correct:** Group related features under one subdomain with path routing

**3. Not Planning for Growth**
- ❌ **Wrong:** Hardcode subdomain names in applications
- ✅ **Correct:** Use environment variables for subdomain configuration

### 7.3 VPS Configuration Mistakes

**1. Not Configuring Firewall**
- ❌ **Wrong:** Leave all ports open
- ✅ **Correct:** Configure UFW firewall
```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw enable
```

**2. Missing Security Headers**
- ❌ **Wrong:** No security headers in nginx
- ✅ **Correct:** Add comprehensive security headers
```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

**3. Not Configuring Node.js for Production**
- ❌ **Wrong:** Run Node.js apps directly with `node server.js`
- ✅ **Correct:** Use PM2 or systemd for process management
```bash
pm2 start server.js --name dumuwaks -i max
pm2 startup
pm2 save
```

**4. Missing Backup Strategy**
- ❌ **Wrong:** No backups configured
- ✅ **Correct:** Set up automated backups
```bash
# Database backup example
0 2 * * * mongodump --db dumuwaks --out /backups/mongo/$(date +\%Y\%m\%d)/
```

### 7.4 SSL/TLS Mistakes

**1. Self-Signed Certificates in Production**
- ❌ **Wrong:** Use self-signed certificates
- ✅ **Correct:** Use Let's Encrypt (free) or commercial certificates

**2. Certificate Auto-renewal Not Verified**
- ❌ **Wrong:** Assume auto-renewal works without testing
- ✅ **Correct:** Test renewal before certificate expires
```bash
sudo certbot renew --dry-run
```

**3. Mixed Content**
- ❌ **Wrong:** HTTP resources on HTTPS page
- ✅ **Correct:** All resources use HTTPS
- **Fix:** Update all URLs to use HTTPS or protocol-relative URLs

### 7.5 Performance Mistakes

**1. Not Enabling Compression**
- ❌ **Wrong:** Serve uncompressed assets
- ✅ **Correct:** Enable gzip/brotli compression
```nginx
gzip on;
gzip_types text/css application/javascript application/json;
gzip_min_length 1000;
```

**2. No Caching Strategy**
- ❌ **Wrong:** No cache headers for static assets
- ✅ **Correct:** Set appropriate cache headers
```nginx
location /static/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

**3. Not Optimizing Images**
- ❌ **Wrong:** Serve full-resolution images
- ✅ **Correct:** Optimize and compress images
```bash
# Example using imagemagick
convert input.jpg -quality 85 -strip output.jpg
```

### 7.6 DNS Propagation Mistakes

**1. Making Changes During Peak Hours**
- ❌ **Wrong:** Update DNS during business hours
- ✅ **Correct:** Schedule changes during low-traffic periods (night/weekend)

**2. Not Lowering TTL Before Changes**
- ❌ **Wrong:** Change DNS records without lowering TTL first
- ✅ **Correct:** Lower TTL to 300 seconds 24-48 hours before changes

**3. Assuming Instant Propagation**
- ❌ **Wrong:** Expect immediate changes worldwide
- ✅ **Correct:** Plan for 24-48 hour propagation window

**4. Not Testing from Multiple Locations**
- ❌ **Wrong:** Test DNS only from local network
- ✅ **Correct:** Use global DNS checking tools
- Tools: https://www.whatsmydns.net/, https://dnschecker.org/

---

## 8. Tools and Services Recommendations

### 8.1 DNS Management Tools

**Cloudflare (RECOMMENDED)**
- Cost: Free tier available
- Features:
  - Global CDN (Nairobi POP)
  - DDoS protection
  - DNSSEC support
  - API access
  - Analytics dashboard
- Pros:
  - Excellent performance
  - Generous free tier
  - Easy setup
  - Security features
- Cons:
  - Advanced features require paid plan
- Website: https://www.cloudflare.com/

**InterServer DNS Hosting**
- Cost: Free with VPS
- Features:
  - Basic DNS management
  - Integrated with VPS
  - Simple interface
- Pros:
  - Free service
  - Direct integration
  - Good support
- Cons:
  - Basic features only
  - No CDN
  - No advanced security
- Website: https://www.interserver.net/

**AWS Route 53**
- Cost: Pay-as-you-go (~$0.50/month per hosted zone)
- Features:
  - High availability
  - Latency-based routing
  - Geo DNS
  - Health checks
- Pros:
  - Excellent reliability
  - Advanced routing features
  - AWS integration
- Cons:
  - More expensive for simple needs
  - Steeper learning curve
  - No free tier for DNS
- Website: https://aws.amazon.com/route53/

**Google Cloud DNS**
- Cost: Pay-as-you-go (~$0.20 per zone/month)
- Features:
  - Managed DNS service
  - Cloud SDK integration
  - Global anycast
- Pros:
  - Simple pricing
  - Good performance
  - Google ecosystem
- Cons:
  - Fewer features than Cloudflare
  - Pay for queries
  - No free tier
- Website: https://cloud.google.com/dns

**Comparison Summary:**
| Provider | Cost | Performance | Features | Ease of Use | Best For |
|----------|------|-------------|----------|-------------|----------|
| Cloudflare | Free | Excellent | Extensive | Very Easy | Most users |
| InterServer | Free | Good | Basic | Easy | InterServer VPS customers |
| Route 53 | Paid | Excellent | Advanced | Moderate | AWS users |
| Google DNS | Paid | Very Good | Moderate | Easy | Google Cloud users |

### 8.2 DNS Testing Tools

**Web-Based Tools:**

1. **DNSChecker.org**
   - URL: https://dnschecker.org/
   - Features: Global DNS propagation checking
   - Use: Verify DNS records from multiple locations worldwide
   - Cost: Free

2. **WhatsMyDNS.net**
   - URL: https://www.whatsmydns.net/
   - Features: Real-time DNS propagation checker
   - Use: Monitor DNS changes globally
   - Cost: Free

3. **MXToolbox**
   - URL: https://mxtoolbox.com/
   - Features: Comprehensive DNS and email diagnostics
   - Use: DNS lookup, MX record checks, blacklist check
   - Cost: Free with paid options

4. **IntoDNS**
   - URL: https://www.intodns.com/
   - Features: DNS health report
   - Use: Comprehensive DNS configuration analysis
   - Cost: Free

5. **NSLookup.io**
   - URL: https://www.nslookup.io/
   - Features: Online DNS lookup tool
   - Use: Quick DNS record checks
   - Cost: Free

**Command-Line Tools:**

1. **dig**
   - Installation: `sudo apt install dnsutils` (Linux)
   - Features: Comprehensive DNS lookup utility
   - Examples:
     ```bash
     # Basic lookup
     dig ementech.co.ke

     # Specific record type
     dig MX ementech.co.ke

     # Query specific nameserver
     dig @8.8.8.8 ementech.co.ke

     # Trace DNS delegation
     dig +trace ementech.co.ke
     ```

2. **nslookup**
   - Built into most operating systems
   - Features: Interactive DNS lookup
   - Examples:
     ```bash
     # Basic lookup
     nslookup ementech.co.ke

     # Specific record type
     nslookup -type=MX ementech.co.ke

     # Query specific nameserver
     nslookup ementech.co.ke 8.8.8.8
     ```

3. **host**
   - Installation: Usually pre-installed
   - Features: Simple DNS lookup
   - Examples:
     ```bash
     host ementech.co.ke
     host -t MX ementech.co.ke
     ```

### 8.3 Email Authentication Testing Tools

**DMARC Analyzer**
- URL: https://www.dmarcanalyzer.com/
- Features: DMARC report analysis
- Cost: Free tier available

**Mail-Tester**
- URL: https://www.mail-tester.com/
- Features: Email deliverability testing
- Use: Test email authentication setup
- Cost: Free

**MXToolbox Email Tools**
- URL: https://mxtoolbox.com/emailheaders.aspx
- Features: Email header analysis
- Use: Verify SPF/DKIM/DMARC in practice

**Port25 SPF/DKIM Validator**
- Email: check-auth@verifier.port25.com
- Features: Automated authentication testing
- Use: Send test email to check SPF/DKIM/DMARC
- Cost: Free

### 8.4 Performance Monitoring Tools

**UptimeRobot**
- URL: https://uptimerobot.com/
- Features: Website uptime monitoring
- Cost: Free for up to 50 monitors
- Use: Monitor website availability

**Pingdom**
- URL: https://www.pingdom.com/
- Features: Website speed and uptime monitoring
- Cost: Free tier available
- Use: Performance testing and monitoring

**Google PageSpeed Insights**
- URL: https://pagespeed.web.dev/
- Features: Website performance analysis
- Cost: Free
- Use: Identify performance bottlenecks

**WebPageTest**
- URL: https://www.webpagetest.org/
- Features: Detailed performance analysis
- Cost: Free
- Use: In-depth performance testing from multiple locations

### 8.5 SSL/TLS Tools

**SSL Labs**
- URL: https://www.ssllabs.com/ssltest/
- Features: Comprehensive SSL/TLS analysis
- Cost: Free
- Use: Test SSL configuration and get security rating

**Let's Debug**
- URL: https://letsdebug.net/
- Features: Let's Encrypt troubleshooting
- Cost: Free
- Use: Diagnose certificate issuance problems

**Certificate Decoder**
- URL: https://www.sslshopper.com/certificate-decoder.html
- Features: Decode SSL certificates
- Cost: Free
- Use: View certificate details

### 8.6 Security Tools

**SecurityHeaders**
- URL: https://securityheaders.com/
- Features: HTTP security header analysis
- Cost: Free
- Use: Check security header configuration

**Have I Been Pwned**
- URL: https://haveibeenpwned.com/
- Features: Check if email/domain compromised
- Cost: Free
- Use: Security awareness

**Shodan**
- URL: https://www.shodan.io/
- Features: Internet-connected device search
- Cost: Free tier available
- Use: Check for exposed services

### 8.7 Load Testing Tools

**Apache Bench (ab)**
- Installation: `sudo apt install apache2-utils`
- Features: Simple HTTP load testing
- Example:
  ```bash
  ab -n 1000 -c 10 https://ementech.co.ke/
  ```

**wrk**
- Installation: `sudo apt install wrk`
- Features: HTTP benchmarking tool
- Example:
  ```bash
  wrk -t4 -c100 -d30s https://ementech.co.ke/
  ```

**Locust**
- Installation: `pip install locust`
- Features: Python-based load testing
- Use: Complex user scenario testing

---

## 9. Testing Procedures

### 9.1 DNS Configuration Testing

**Step 1: Verify DNS Records**
```bash
# Check A records
dig A ementech.co.ke
dig A www.ementech.co.ke
dig A app.ementech.co.ke

# Check MX records
dig MX ementech.co.ke

# Check TXT records (SPF, DMARC)
dig TXT ementech.co.ke
dig TXT _dmarc.ementech.co.ke

# Check NS records
dig NS ementech.co.ke

# Check all records
dig ANY ementech.co.ke
```

**Step 2: Test DNS Resolution Speed**
```bash
# Time DNS resolution
time dig ementech.co.ke

# Compare nameservers
time dig @cdns1.interserver.net ementech.co.ke
time dig @1.1.1.1 ementech.co.ke
time dig @8.8.8.8 ementech.co.ke
```

**Step 3: Check DNS Propagation**
```bash
# Use online tool: https://www.whatsmydns.net/
# Check from multiple locations

# Or use dig with specific nameservers
dig @8.8.8.8 ementech.co.ke        # Google DNS (US)
dig @1.1.1.1 ementech.co.ke        # Cloudflare (Global)
dig @196.216.167.1 ementech.co.ke  # Safaricom (Kenya)
```

**Step 4: Verify DNSSEC (if enabled)**
```bash
# Check DNSSEC validation
dig +dnssec ementech.co.ke

# Verify with trusted nameserver
dig +dnssec @8.8.8.8 ementech.co.ke
```

### 9.2 Email Authentication Testing

**Step 1: SPF Testing**
```bash
# Check SPF record
dig TXT ementech.co.ke | grep spf

# Online test: https://mxtoolbox.com/spf.aspx
# Enter domain and check SPF record
```

**Step 2: DKIM Testing**
```bash
# Check DKIM record (replace selector)
dig TXT selector1._domainkey.ementech.co.ke

# Online test: https://mxtoolbox.com/dkim.aspx
# Enter selector and domain
```

**Step 3: DMARC Testing**
```bash
# Check DMARC record
dig TXT _dmarc.ementech.co.ke

# Online test: https://mxtoolbox.com/dmarc.aspx
# Enter domain and check DMARC
```

**Step 4: Email Deliverability Test**
```
# Send email to: check-auth@verifier.port25.com
# You'll receive automated response with:
# - SPF result
# - DKIM result
# - DMARC result
# - Overall authentication status
```

### 9.3 SSL/TLS Testing

**Step 1: Basic SSL Check**
```bash
# Test SSL connection
openssl s_client -connect ementech.co.ke:443 -servername ementech.co.ke

# Check certificate details
openssl s_client -connect ementech.co.ke:443 -showcerts
```

**Step 2: SSL Labs Test**
1. Visit: https://www.ssllabs.com/ssltest/
2. Enter: ementech.co.ke
3. Review grade (aim for A or A+)
4. Check for:
   - Certificate validity
   - Protocol support (TLS 1.2+)
   - Cipher suite strength
   - Security headers

**Step 3: Certificate Expiry Check**
```bash
# Check certificate expiry
echo | openssl s_client -servername ementech.co.ke -connect ementech.co.ke:443 2>/dev/null | openssl x509 -noout -dates

# Set up monitoring (add to crontab)
# Alert if certificate expires in less than 30 days
```

**Step 4: HTTP Security Headers**
```bash
# Check security headers
curl -I https://ementech.co.ke

# Look for:
# - Strict-Transport-Security
# - X-Frame-Options
# - X-Content-Type-Options
# - X-XSS-Protection
# - Content-Security-Policy
```

### 9.4 Web Server Testing

**Step 1: Nginx Configuration Test**
```bash
# Test nginx configuration syntax
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx

# Check nginx status
sudo systemctl status nginx

# Check error logs
sudo tail -f /var/log/nginx/error.log
```

**Step 2: HTTP Response Testing**
```bash
# Test HTTP response
curl -I https://ementech.co.ke

# Test with full headers
curl -v https://ementech.co.ke

# Test response time
curl -o /dev/null -s -w '%{time_total}\n' https://ementech.co.ke
```

**Step 3: Load Testing**
```bash
# Using Apache Bench
ab -n 1000 -c 10 https://ementech.co.ke/

# Using wrk
wrk -t4 -c100 -d30s https://ementech.co.ke/

# Monitor server during test
htop
```

**Step 4: URL Reachability Testing**
```bash
# Test main domain
curl https://ementech.co.ke

# Test www subdomain
curl https://www.ementech.co.ke

# Test app subdomain
curl https://app.ementech.co.ke

# Test API endpoint (if configured)
curl https://app.ementech.co.ke/api/health
```

### 9.5 Application Testing

**Step 1: React Corporate Site**
```bash
# Test React Router
curl https://ementech.co.ke/about
curl https://ementech.co.ke/services
curl https://ementech.co.ke/contact

# Check for 404s
curl -I https://ementech.co.ke/nonexistent-page

# Test static assets
curl -I https://ementech.co.ke/static/js/main.js
curl -I https://ementech.co.ke/static/css/main.css
```

**Step 2: MERN Application (Dumu Waks)**
```bash
# Test main application
curl https://app.ementech.co.ke

# Test API endpoints
curl https://app.ementech.co.ke/api/health
curl https://app.ementech.co.ke/api/users

# Test WebSocket (if applicable)
# Use browser DevTools or specialized tool
```

**Step 3: PM2 Process Status**
```bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs dumuwaks

# Monitor in real-time
pm2 monit
```

### 9.6 Performance Testing

**Step 1: Page Speed Test**
1. Visit: https://pagespeed.web.dev/
2. Enter: https://ementech.co.ke
3. Review:
   - Performance score
   - First Contentful Paint
   - Largest Contentful Paint
   - Cumulative Layout Shift
   - Time to Interactive

**Step 2: WebPageTest**
1. Visit: https://www.webpagetest.org/
2. Enter: https://ementech.co.ke
3. Select test location: Nairobi, if available
4. Review:
   - Load time
   - First byte
   - Start render
   - Speed index
   - Requests count
   - Total size

**Step 3: Google Lighthouse**
```bash
# Install Lighthouse
npm install -g lighthouse

# Run audit
lighthouse https://ementech.co.ke --view

# Run specific categories
lighthouse https://ementech.co.ke --only-categories=performance,accessibility,best-practices,seo
```

### 9.7 Security Testing

**Step 1: Security Headers Check**
1. Visit: https://securityheaders.com/
2. Enter: https://ementech.co.ke
3. Review grade and recommendations

**Step 2: SSL Configuration Check**
1. Visit: https://www.ssllabs.com/ssltest/
2. Enter: ementech.co.ke
3. Aim for A or A+ grade

**Step 3: HTTP Security Headers**
```bash
# Check all headers
curl -I https://ementech.co.ke

# Verify headers present:
# - Strict-Transport-Security
# - X-Frame-Options
# - X-Content-Type-Options
# - X-XSS-Protection
# - Content-Security-Policy
# - Referrer-Policy
```

**Step 4: Open Port Check**
```bash
# Check open ports
sudo nmap -sS ementech.co.ke

# Should only show:
# - 22/tcp (SSH) - rate limit this
# - 80/tcp (HTTP)
# - 443/tcp (HTTPS)
```

---

## 10. Implementation Checklist

### Phase 1: DNS Setup (Days 1-2)

- [ ] Choose DNS hosting provider (InterServer or Cloudflare)
- [ ] Obtain VPS IP address from InterServer
- [ ] Log into domain registrar
- [ ] Update nameservers at registrar
- [ ] Wait for nameserver changes to propagate (24-48 hours)
- [ ] Log into DNS host
- [ ] Create A record for @ (root domain)
- [ ] Create A record for www
- [ ] Create A record for app
- [ ] Set TTL values (start with 3600 seconds)
- [ ] Test DNS resolution from local machine
- [ ] Use online tool to check global propagation

### Phase 2: Email Configuration (Days 3-5)

- [ ] Choose email provider (Google Workspace, Microsoft 365, or custom)
- [ ] Create email accounts
- [ ] Add MX records to DNS
- [ ] Create SPF TXT record
- [ ] Create DKIM TXT record (generate from email provider)
- [ ] Create DMARC TXT record
- [ ] Test SPF record
- [ ] Test DKIM record
- [ ] Test DMARC record
- [ ] Send test email to check-auth@verifier.port25.com
- [ ] Verify email authentication results

### Phase 3: Web Server Setup (Days 5-7)

- [ ] SSH into VPS
- [ ] Update system: `sudo apt update && sudo apt upgrade`
- [ ] Install nginx: `sudo apt install nginx`
- [ ] Install Node.js for MERN app
- [ ] Install PM2: `sudo npm install -g pm2`
- [ ] Configure nginx for corporate site
- [ ] Configure nginx for Dumu Waks app
- [ ] Test nginx configuration: `sudo nginx -t`
- [ ] Restart nginx: `sudo systemctl restart nginx`
- [ ] Configure firewall: `sudo ufw allow 80/tcp`, `sudo ufw allow 443/tcp`
- [ ] Deploy React corporate site to `/var/www/ementech-website`
- [ ] Deploy MERN app to `/var/www/dumuwaks`
- [ ] Test corporate site: `curl http://ementech.co.ke`
- [ ] Test Dumu Waks app: `curl http://app.ementech.co.ke`

### Phase 4: SSL/TLS Configuration (Days 8-10)

- [ ] Install Certbot: `sudo apt install certbot python3-certbot-nginx`
- [ ] Obtain SSL certificate for corporate site
- [ ] Obtain SSL certificate for app subdomain
- [ ] Test auto-renewal: `sudo certbot renew --dry-run`
- [ ] Verify SSL installation: Visit https://www.ssllabs.com/ssltest/
- [ ] Configure security headers in nginx
- [ ] Test HTTPS redirect
- [ ] Force HTTPS in applications
- [ ] Update any hardcoded HTTP URLs

### Phase 5: CDN Integration (Days 11-14)

- [ ] Create Cloudflare account (if using)
- [ ] Add domain to Cloudflare
- [ ] Update nameservers to Cloudflare's
- [ ] Wait for Cloudflare activation (24-48 hours)
- [ ] Add DNS records in Cloudflare
- [ ] Enable SSL/TLS: Full mode
- [ ] Enable Always Use HTTPS
- [ ] Configure caching settings
- [ ] Create Page Rules for app subdomain (bypass cache)
- [ ] Create Page Rules for static assets (cache everything)
- [ ] Enable Brotli compression
- [ ] Enable Auto Minify
- [ ] Purge cache
- [ ] Test CDN functionality
- [ ] Monitor performance improvements

### Phase 6: Monitoring & Security (Days 15-30)

- [ ] Set up uptime monitoring (UptimeRobot or Pingdom)
- [ ] Configure SSL expiry monitoring
- [ ] Set up automated backups
- [ ] Configure log rotation
- [ ] Set up email alerts for critical errors
- [ ] Review security headers
- [ ] Implement rate limiting
- [ ] Configure fail2ban for SSH protection
- [ ] Document all configurations
- [ ] Create runbook for common issues
- [ ] Schedule regular maintenance tasks

---

## 11. Maintenance and Operations

### 11.1 Regular Maintenance Tasks

**Daily:**
- Check website availability (automated monitoring)
- Review error logs for critical issues
- Monitor server resources (CPU, memory, disk)

**Weekly:**
- Review backup completion
- Check SSL certificate status
- Review PM2 process status
- Monitor DNS resolution

**Monthly:**
- Review DNS records for accuracy
- Check email authentication reports
- Review and update security patches
- Analyze performance metrics
- Review CDN usage and costs

**Quarterly:**
- Review DNS TTL values and adjust if needed
- Conduct full security audit
- Review backup strategy and test restoration
- Update documentation
- Review and optimize caching strategy

**Annually:**
- Review DNS hosting provider choice
- Evaluate new DNS/security features
- Major security audit
- Disaster recovery testing

### 11.2 DNS Record Updates

**When to Update Records:**
- Changing VPS IP address
- Adding new subdomains
- Updating email provider
- Implementing new security features

**Update Process:**
1. Lower TTL to 300 seconds (24-48 hours before)
2. Make DNS changes
3. Test from multiple locations
4. Wait for propagation (24-48 hours)
5. Restore TTL to normal values
6. Monitor for issues

### 11.3 SSL Certificate Management

**Automatic Renewal (Let's Encrypt):**
- Certbot automatically renews certificates
- Renewal attempts: Twice daily
- Test renewal: `sudo certbot renew --dry-run`
- Monitor expiry date

**Manual Renewal (if needed):**
```bash
sudo certbot renew
sudo systemctl reload nginx
```

**When Certificates Expire:**
- Let's Encrypt: 90 days, auto-renew at 60 days
- Commercial certificates: Varies (1 year typical)
- Set expiry alerts 30 days before expiration

### 11.4 Backup Strategy

**What to Backup:**
- DNS zone configurations (export from DNS host)
- nginx configuration files
- SSL certificates and private keys
- Application code
- Databases (MongoDB for MERN app)
- Environment configuration files

**Backup Schedule:**
- Database: Daily
- Application code: Before each deployment
- Configuration files: Weekly or when changed
- SSL certificates: After renewal

**Backup Commands:**
```bash
# Database backup
mongodump --db dumuwaks --out /backups/mongo/$(date +%Y%m%d)/

# Nginx configuration
sudo cp -r /etc/nginx /backups/nginx-$(date +%Y%m%d)/

# SSL certificates
sudo cp -r /etc/letsencrypt /backups/letsencrypt-$(date +%Y%m%d)/

# Application code
tar -czf /backups/dumuwaks-$(date +%Y%m%d).tar.gz /var/www/dumuwaks
```

### 11.5 Scaling Considerations

**When to Scale:**
- Consistent high CPU usage (>80%)
- Memory exhaustion
- Slow response times
- Database performance issues

**Scaling Options:**
1. **Vertical Scaling:**
   - Upgrade VPS plan
   - Add more RAM/CPU
   - Faster SSD storage

2. **Horizontal Scaling:**
   - Add more VPS instances
   - Implement load balancing
   - Use PM2 cluster mode
   - Separate database server

3. **CDN Scaling:**
   - Already enabled with Cloudflare
   - Automatically handles static assets
   - Reduces origin load

4. **Database Scaling:**
   - Implement database indexing
   - Use connection pooling
   - Consider MongoDB Atlas for managed database

---

## 12. Troubleshooting Guide

### 12.1 DNS Issues

**Problem: DNS not resolving**
```bash
# Check DNS propagation
dig ementech.co.ke
nslookup ementech.co.ke

# Check from multiple DNS servers
dig @8.8.8.8 ementech.co.ke
dig @1.1.1.1 ementech.co.ke

# Check nameservers
dig NS ementech.co.ke

# Solution: Wait for propagation or check DNS records
```

**Problem: Incorrect DNS record**
```bash
# View current record
dig A ementech.co.ke

# Solution: Update record in DNS host
# Lower TTL before change if urgent
# Verify update after 24-48 hours
```

**Problem: DNS cache issues**
```bash
# Clear local cache
sudo systemd-resolve --flush-caches  # Linux
ipconfig /flushdns                    # Windows

# Solution: Wait for TTL to expire or lower TTL
```

### 12.2 Email Issues

**Problem: Email marked as spam**
- Check SPF record: `dig TXT ementech.co.ke`
- Check DKIM record: `dig TXT selector1._domainkey.ementech.co.ke`
- Check DMARC record: `dig TXT _dmarc.ementech.co.ke`
- Use: https://www.mail-tester.com/
- Solution: Fix SPF/DKIM/DMARC configuration

**Problem: Email not delivered**
- Check MX records: `dig MX ementech.co.ke`
- Verify email provider configuration
- Check for IP blacklisting: https://mxtoolbox.com/blacklists.aspx
- Solution: Update MX records or contact email provider

### 12.3 SSL/TLS Issues

**Problem: Certificate not trusted**
- Check certificate: `openssl s_client -connect ementech.co.ke:443`
- Verify certificate chain
- Test at: https://www.ssllabs.com/ssltest/
- Solution: Reissue certificate or fix intermediate certificates

**Problem: Mixed content warnings**
- Check for HTTP resources on HTTPS page
- Use browser DevTools to identify
- Solution: Update all URLs to HTTPS

**Problem: Certificate expired**
- Check expiry: `openssl x509 -noout -dates -in /etc/letsencrypt/live/ementech.co.ke/cert.pem`
- Solution: Renew certificate: `sudo certbot renew`

### 12.4 Web Server Issues

**Problem: 502 Bad Gateway**
- Check if backend is running: `pm2 status`
- Check nginx error logs: `sudo tail -f /var/log/nginx/error.log`
- Solution: Restart backend or fix nginx configuration

**Problem: 404 Not Found**
- Check nginx configuration
- Verify file paths
- Check for typos in URLs
- Solution: Update nginx config or fix file paths

**Problem: Slow performance**
- Check server resources: `htop`
- Check nginx logs: `sudo tail -f /var/log/nginx/access.log`
- Enable caching
- Solution: Optimize application, add caching, or scale server

### 12.5 Application Issues

**Problem: React site not loading**
- Check build files exist
- Check nginx configuration
- Check browser console for errors
- Solution: Rebuild React app or fix nginx config

**Problem: MERN app not responding**
- Check if Node.js process running: `pm2 status`
- Check application logs: `pm2 logs dumuwaks`
- Check database connection
- Solution: Restart application or fix database connection

**Problem: API errors**
- Check if API endpoint exists
- Check CORS configuration
- Check API logs
- Solution: Fix API code or CORS configuration

---

## 13. Example Configurations

### 13.1 Complete Nginx Configuration

**File: /etc/nginx/sites-available/ementech**
```nginx
# Corporate website (React)
server {
    listen 80;
    server_name ementech.co.ke www.ementech.co.ke;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ementech.co.ke www.ementech.co.ke;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/ementech.co.ke/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ementech.co.ke/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers 'ECDHE-RSA-AES128-GCM-SHA256:...';

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Root directory
    root /var/www/ementech-website/build;
    index index.html;

    # React Router fallback
    location / {
        try_files $uri /index.html;
    }

    # Static assets caching
    location /static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip compression
    gzip on;
    gzip_types text/css application/javascript application/json;
    gzip_min_length 1000;
}

# Dumu Waks Application (MERN)
server {
    listen 80;
    server_name app.ementech.co.ke;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name app.ementech.co.ke;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/app.ementech.co.ke/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.ementech.co.ke/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

    # Proxy to Node.js backend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # API endpoints with rate limiting
    location /api/ {
        limit_req zone=api_limit burst=20 nodelay;
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Static files
    location /static/ {
        root /var/www/dumuwaks;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip compression
    gzip on;
    gzip_types text/css application/javascript application/json;
}
```

### 13.2 PM2 Ecosystem Configuration

**File: /var/www/dumuwaks/ecosystem.config.js**
```javascript
module.exports = {
  apps: [{
    name: 'dumuwaks',
    script: './server.js',
    instances: 'max',  // Use all CPU cores
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/pm2/dumuwaks-error.log',
    out_file: '/var/log/pm2/dumuwaks-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true,
    max_memory_restart: '1G'
  }]
};
```

**Start with PM2:**
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 13.3 Cloudflare Page Rules

**Rule 1: Bypass Cache for Dynamic App**
```
Pattern: *app.ementech.co.ke/*
Settings:
- Cache Level: Bypass
- Disable Performance
- Security Level: High
```

**Rule 2: Cache Static Assets**
```
Pattern: *ementech.co.ke/static/*
Settings:
- Cache Level: Cache Everything
- Edge Cache TTL: 1 month
- Browser Cache TTL: 1 year
```

**Rule 3: Cache Images**
```
Pattern: *ementech.co.ke/images/*
Settings:
- Cache Level: Cache Everything
- Edge Cache TTL: 1 year
- Browser Cache TTL: 1 year
```

**Rule 4: Forwarding URL (if needed)**
```
Pattern: ementech.co.ke
Settings:
- Forwarding URL: 301 - https://www.ementech.co.ke/$1
```

---

## 14. Recommended Configuration for ementech.co.ke

### 14.1 Final DNS Configuration

**Using Cloudflare (Recommended):**

| Name | Type | Content | Proxy Status | TTL |
|------|------|---------|--------------|-----|
| @ | A | [Your VPS IP] | Proxied (Orange cloud) | Auto |
| www | CNAME | @ | Proxied | Auto |
| app | A | [Your VPS IP] | Proxied | Auto |
| @ | MX | aspmx.l.google.com | DNS only | Auto |
| @ | MX | alt1.aspmx.l.google.com | DNS only | Auto |
| @ | MX | alt2.aspmx.l.google.com | DNS only | Auto |
| @ | TXT | v=spf1 include:_spf.google.com ~all | DNS only | Auto |
| _dmarc | TXT | v=DMARC1; p=none; rua=mailto:admin@ementech.co.ke | DNS only | Auto |
| google._domainkey | TXT | [From Google Workspace] | DNS only | Auto |

### 14.2 Subdomain Structure

**Recommended Structure:**
- `ementech.co.ke` - Corporate website (React)
- `www.ementech.co.ke` - Corporate website (redirects to root)
- `app.ementech.co.ke` - Dumu Waks platform (MERN)
- Future: `api.ementech.co.ke` - API services
- Future: `blog.ementech.co.ke` - Company blog
- Future: `admin.ementech.co.ke` - Admin panel

### 14.3 Technology Stack Summary

**Corporate Website:**
- Frontend: React (multipage)
- Server: nginx
- SSL: Let's Encrypt
- CDN: Cloudflare
- Deployment: Static build on VPS

**Dumu Waks Platform:**
- Frontend: React
- Backend: Node.js + Express
- Database: MongoDB
- Server: nginx (reverse proxy) + PM2
- SSL: Let's Encrypt
- CDN: Cloudflare (bypass for app)
- Deployment: Full MERN stack on VPS

---

## 15. Sources and References

### DNS Configuration
- Cloudflare DNS Record Types: https://developers.cloudflare.com/dns/manage-dns-records/reference/dns-record-types/
- DNS Records Explained: https://qrator.net/library/learning-center/DNS/What-Are-DNS-Records/
- Microsoft Azure DNS Overview: https://learn.microsoft.com/en-us/azure/dns/dns-zones-records
- DNS Made Easy Guide: https://dnsmadeeasy.com/resources/guide-to-understanding-dns-record-types

### TTL Best Practices
- DNS TTL Recommendations: Various industry sources (2025)
- Cloudflare TTL Documentation: https://developers.cloudflare.com/dns/manage-dns-records/reference/ttl/
- AWS Route 53 TTL Recommendations: AWS Documentation

### .ke Domain Information
- KENIC Official Website: https://kenic.or.ke/
- Kenya ICT Authority Domain Regulations: https://ict.go.ke/
- Kenya Network Information Act: https://new.kenyalaw.org/akn/ke/act/ln/2010/116/eng@2022-12-31

### Subdomain Strategy
- Wildcard DNS Setup: Various technical documentation
- Subdomain Naming Conventions: Industry best practices

### InterServer Configuration
- InterServer Nameservers: https://www.interserver.net/tips/kb/add-manage-nameservers-interserver/
- InterServer DNS Management: https://www.interserver.net/tips/kb/using-custom-nameservers-domains/

### DNS Security
- DNSSEC Implementation: Various security documentation (2025)
- DDoS Protection Strategies: Industry security reports (2025)

### CDN Comparison
- Cloudflare vs Route 53: https://dev.to/mechcloud_academy/cloudflare-dns-vs-aws-route-53-comprehensive-comparative-report-13mk
- Route 53 vs Cloudflare: https://runcloud.io/blog/cloudflare-vs-route-53
- DNS Provider Comparison: https://www.ioriver.io/blog/top-dns-providers

### Load Balancing
- DNS Round Robin: Various technical documentation
- Round Robin DNS: https://www.ioriver.io/terms/round-robin-dns
- Load Balancing Guide: https://www.loadbalancer.org/blog/complete-guide-to-dns-load-balancing/

### DNS Testing Tools
- nslookup.io: https://www.nslookup.io/
- DNS Checker: https://dnschecker.org/
- What's My DNS: https://www.whatsmydns.net/
- MXToolbox: https://mxtoolbox.com/
- Google DIG: https://toolbox.googleapps.com/apps/dig/

### Email Authentication
- SPF/DKIM/DMARC Setup: Email authentication best practices (2025)

### SSL/TLS
- SSL Labs: https://www.ssllabs.com/ssltest/
- Let's Encrypt: https://letsencrypt.org/

---

## 16. Summary and Next Steps

### Summary

This comprehensive research report provides detailed guidance for configuring DNS zones for ementech.co.ke to host multiple projects. The key recommendations are:

1. **DNS Hosting:** Use Cloudflare for performance, security, and CDN benefits
2. **Subdomain Strategy:** Implement functional-based structure (app.ementech.co.ke for Dumu Waks)
3. **Security:** Configure SPF, DKIM, and DMARC for email authentication
4. **SSL/TLS:** Use Let's Encrypt for free SSL certificates
5. **CDN:** Enable Cloudflare CDN for better performance in Kenya and globally
6. **Monitoring:** Set up regular monitoring and maintenance procedures

### Immediate Next Steps

1. **Week 1:**
   - Choose DNS hosting provider (recommend Cloudflare)
   - Update nameservers at domain registrar
   - Configure basic DNS records (A, www, app)
   - Wait for propagation

2. **Week 2:**
   - Configure email (SPF, DKIM, DMARC)
   - Set up nginx on VPS
   - Deploy corporate website
   - Deploy Dumu Waks application

3. **Week 3:**
   - Install SSL certificates
   - Enable Cloudflare CDN
   - Configure Page Rules
   - Test all configurations

4. **Week 4:**
   - Set up monitoring
   - Configure backups
   - Document procedures
   - Test disaster recovery

### Long-term Considerations

- Review DNS configuration quarterly
- Monitor SSL certificate expiration
- Keep security patches updated
- Scale infrastructure as needed
- Consider geographic redundancy for critical applications

This report provides a solid foundation for successfully deploying and managing multiple projects on the ementech.co.ke domain with proper DNS configuration, security, and performance optimization for both Kenyan and global audiences.

---

**End of Report**

**Report prepared by:** Claude Code Research Agent
**Date:** 2026-01-18
**Version:** 1.0

For questions or clarifications on any aspect of this DNS configuration research, please refer to the specific sections or consult the provided sources.
