# Research Sources and References

**Last Updated:** January 18, 2026

## Nginx Reverse Proxy Configuration

### Multiple Domains and Server Blocks
1. **[DigitalOcean - Nginx Server and Location Block Selection Algorithms](https://www.digitalocean.com/community/tutorials/understanding-nginx-server-and-location-block-selection-algorithms)** (Dec 2025)
   - Understanding how nginx server blocks work
   - Credibility: High - DigitalOcean is a well-respected cloud hosting provider

2. **[NGINX Community - Handling Subdomains Configuration](https://community.nginx.org/t/handling-subdomains-nginx-configuration/5292)** (June 2025)
   - Recent discussion on subdomain configuration
   - Credibility: High - Official NGINX community

3. **[Configure Nginx to Host Multiple Subdomains](https://dev.to/on_stash/configure-nginx-to-host-multiple-subdomains-2g0b)**
   - Step-by-step setup guide
   - Credibility: Medium - Developer community post

4. **[Ultimate Guide: Configuring Nginx Reverse Proxy](https://medium.com/@yasoob2897/ultimate-guide-configuring-nginx-as-a-reverse-proxy-to-host-multiple-apps-on-the-same-server-99fd3a76d027)**
   - Multi-app hosting examples
   - Credibility: Medium - Independent blog post

## React SPA and Client-Side Routing

1. **[StackOverflow - NGINX proxy_pass and SPA routing in HTML5 mode](https://stackoverflow.com/questions/45502403/nginx-proxy-pass-and-spa-routing-in-html5-mode)**
   - Solution using `proxy_intercept_errors` and `error_page`
   - Credibility: High - Community-vetted solution

2. **[Medium - Serving React SPA using NGINX and Reverse Proxy](https://medium.com/@deresegetachew/serving-react-spa-using-nginx-and-reverse-proxy-4e5485c814a0)**
   - Client-side routing configuration
   - Credibility: Medium - Technical tutorial

3. **[DigitalOcean - How To Deploy a React Application with Nginx on Ubuntu](https://www.digitalocean.com/community/tutorials/deploy-react-application-with-nginx-on-ubuntu)**
   - Critical `try_files` directive for React Router
   - Credibility: High - DigitalOcean official guide

4. **[ServerFault - Handling relative URLs with nginx reverse proxy](https://serverfault.com/questions/932628/how-to-handle-relative-urls-correctly-with-a-nginx-reverse-proxy)**
   - Handling asset URLs behind reverse proxy
   - Credibility: High - Sysadmin community

## WebSocket and Socket.io Configuration

1. **[Socket.IO Reverse Proxy Documentation](https://socket.io/docs/v4/reverse-proxy/)**
   - Official Socket.IO reverse proxy guide
   - Credibility: Very High - Official documentation

2. **[NGINX WebSocket Proxying Documentation](https://nginx.org/en/docs/http/websocket.html)**
   - Official nginx WebSocket documentation
   - Credibility: Very High - Official NGINX documentation

3. **[F5 - NGINX + Node.js + Socket.IO Guide](https://www.f5.com/company/blog/nginx/nginx-nodejs-websockets-websocket)**
   - Comprehensive WebSocket tutorial
   - Credibility: High - F5 Networks (owns NGINX)

## SSL/TLS and Let's Encrypt

1. **[Let's Encrypt Community - Certbot Nginx Wildcards](https://community.letsencrypt.org/t/certbot-nginx-wildcards/234485)**
   - Discussion on wildcard certificates
   - Credibility: Very High - Official Let's Encrypt community

2. **[DigitalOcean - How To Create Let's Encrypt Wildcard Certificates](https://www.digitalocean.com/community/tutorials/how-to-create-let-s-encrypt-wildcard-certificates-with-certbot)**
   - DNS validation for wildcard certificates
   - Credibility: High - DigitalOcean guide

3. **[Certbot FAQ](https://certbot.eff.org/faq)**
   - DNS challenge requirement for wildcards
   - Credibility: Very High - Official Certbot documentation

## Performance Optimization

1. **[Ultimate Nginx Performance Tuning Checklist](https://wehaveservers.com/blog/dedicated-servers-news/ultimate-nginx-performance-tuning-checklist-http-2-tls-caching/)** (Sep 2025)
   - HTTP/2, TLS, caching optimization
   - Credibility: Medium - Hosting industry blog

2. **[Hosting.International - Optimizing Nginx Configuration](https://hosting.international/blog/optimizing-your-nginx-apache-configuration-for-peak-performance/)** (Sep 2025)
   - Gzip, caching, HTTP/2, worker optimization
   - Credibility: Medium - Hosting provider guide

3. **[SoftwareHouse.au - NGINX HTTP/2 & Brotli Max Speed Guide](https://softwarehouse.au/blog/http-2-and-brotli-on-nginx-a-comprehensive-guide-to-maximum-speed/)** (July 2025)
   - HTTP/2 and Brotli compression
   - Credibility: Medium - Development agency blog

4. **[Dev.To - Performance Tuning for Nginx](https://dev.to/ramer2b58cbe46bc8/performance-tuning-for-nginx-7-tips-to-slash-ttfb-and-boost-speed-4moa)** (Sep 2025)
   - Brotli, Gzip, SSL optimization
   - Credibility: Medium - Developer community

5. **[Tencent Cloud - Configure Caching and Static Content Compression](https://www.tencentcloud.com/techpedia/102115)** (Mar 2025)
   - Nginx caching configuration
   - Credibility: High - Major cloud provider

6. **[Medium - Optimizing NGINX for Performance and Scalability](https://medium.com/@mathur.danduprolu/optimizing-nginx-for-performance-and-scalability-part-4-7-22b0a4b199dd)**
   - Worker processes, gzip, proxy caching
   - Credibility: Medium - Technical blog

7. **[NGINX Official Documentation - Compression](https://docs.nginx.com/nginx/admin-guide/web-server/compression/)**
   - Official compression documentation
   - Credibility: Very High - Official NGINX docs

## Security Hardening

1. **[Dasroot! - Static Site Security: Headers, CSP, and Best Practices](https://dasroot.net/posts/2025/12/static-site-security-headers-csp-and/)** (Dec 2025)
   - Security headers and CSP configuration
   - Credibility: Medium - Security-focused blog

2. **[Arphost - 10 Essential Website Security Best Practices for 2025](https://arphost.com/website-security-best-practices/)** (Nov 2025)
   - SSL/TLS and security headers
   - Credibility: Medium - Web security blog

3. **[SpinupWP - Nginx Security Hardening for WordPress](https://spinupwp.com/hosting-wordpress-yourself/nginx-security-tweaks-woocommerce-caching-auto-server-updates/)** (Nov 2025)
   - TLS improvements and security headers
   - Credibility: Medium - WordPress hosting provider

4. **[Kevin Pirnie - Strengthening Website Security with Nginx Headers and CSP](https://kevinpirnie.com/about-kevin-pirnie/kevins-articles/strengthening-website-security-with-nginx-headers-and-csp/)** (July 2025)
   - HTTP security headers implementation
   - Credibility: Medium - Independent security researcher

5. **[ProtocolGuard - HTTP Header Security Guide](https://protocolguard.com/resources/http-header-security-guide/)**
   - Complete header security guide
   - Credibility: Medium - Security service provider

6. **[Medium - 10 Security-Header Recipes That Don't Slow Your Site](https://medium.com/@connect.hashblock/10-security-headers-recipes-that-dont-slow-your-site-06ecee5a8b00)**
   - Performance-optimized headers
   - Credibility: Low-Medium - Independent blog

7. **[GitHub Gist - Best nginx configuration for improved security](https://gist.github.com/plentz/6737338)**
   - Community-maintained security config
   - Credibility: Medium - Popular gist (1000+ stars)

8. **[Invicti - Missing HTTP Security Headers: Avoidable Risk, Easy Fix](https://www.invicti.com/blog/web-security/missing-http-security-headers)** (Feb 2025)
   - Configuring missing security headers
   - Credibility: High - Web security company

## Rate Limiting and DDoS Protection

1. **[NGINX Official Blog - Rate Limiting with NGINX](https://blog.nginx.org/blog/rate-limiting-nginx)**
   - Official rate limiting guide
   - Credibility: Very High - Official NGINX blog

2. **[AvenaCloud - Rate Limiting with Nginx for DDoS Protection](https://avenacloud.com/blog/implementing-rate-limiting-with-nginx-for-ddos-protection-a-comprehensive-guide/)** (2025)
   - Comprehensive DDoS protection tutorial
   - Credibility: Low-Medium - Cloud provider blog

3. **[Medium - NGINX Rate Limiting: Preventing DoS & DDoS](https://medium.com/@mohan.velegacherla/nginx-rate-limiting-preventing-dos-ddos-a208f9179b6e)**
   - Rate limiting for DoS/DDoS prevention
   - Credibility: Medium - Technical blog

4. **[CPNginx - How to Prevent DDoS Attacks with Nginx](https://cpnginx.com/nginx-on-cpanel/how-to-prevent-ddos-attacks-with-nginx/)** (2025)
   - Connection limits, rate limiting, bot protection
   - Credibility: Medium - Nginx/cPanel specialist

5. **[Solo.io - NGINX Rate Limiting: The Basics and 3 Code Examples](https://www.solo.io/topics/nginx/nginx-rate-limiting)**
   - Practical rate limiting examples
   - Credibility: High - API gateway company

## CORS Configuration

1. **[ServerFault - Nginx enabling CORS for multiple subdomains](https://serverfault.com/questions/958965/nginx-enabling-cors-for-multiple-subdomains)**
   - Multi-subdomain CORS setup
   - Credibility: High - Sysadmin community

2. **[Stack Overflow - Allow CORS for multiple domains in nginx](https://stackoverflow.com/questions/36582199/how-to-allow-access-via-cors-to-multiple-domains-within-nginx)**
   - Multi-origin CORS configuration
   - Credibility: High - Community-vetted solution

3. **[Medium - Navigating CORS: Enabling Multi-Origin Integration with nginx](https://medium.com/@imesh20616/navigating-cors-enabling-multi-origin-integration-with-nginx-ca80eb8de0b8)**
   - Multiple origin CORS policies
   - Credibility: Medium - Technical blog

## Buffer and Timeout Settings

1. **[Nginx Official Docs - ngx_http_proxy_module](https://nginx.org/en/docs/http/ngx_http_proxy_module.html)**
   - Official proxy buffering documentation
   - Credibility: Very High - Official NGINX documentation

2. **[DigitalOcean - How To Optimize Nginx Configuration](https://www.digitalocean.com/community/tutorials/how-to-optimize-nginx-configuration)**
   - Buffer size optimization
   - Credibility: High - DigitalOcean guide

3. **[Dev.To - Comprehensive Guide to Optimizing Nginx Configuration](https://dev.to/tanvirrahman/comprehensive-guide-to-optimizing-nginx-configuration-3hb9)**
   - Detailed configuration directives
   - Credibility: Medium - Developer community

4. **[CPNginx - Nginx Optimization and Performance Tuning Guide](https://cpnginx.com/nginx-on-cpanel/nginx-on-cpanel/nginx-optimization-and-performance-tuning-guide-boost-speed-reduce-load-and-improve-scalability/)**
   - Timeout directives and tuning
   - Credibility: Medium - Nginx specialist

5. **[Stack Overflow - Increase buffer timeout size on nginx](https://stackoverflow.com/questions/21994758/increase-buffer-timeout-size-on-nginx-node-js)**
   - Timeout configuration recommendations
   - Credibility: High - Community solution

6. **[F5 - Avoiding the Top 10 NGINX Configuration Mistakes](https://www.f5.com/company/blog/nginx/avoiding-top-10-nginx-configuration-mistakes)**
   - Common configuration errors and fixes
   - Credibility: Very High - F5 Networks (owns NGINX)

## PM2 and Process Management

1. **[PM2 - Ecosystem File Documentation](https://pm2.keymetrics.io/docs/usage/application-declaration/)**
   - Official ecosystem file guide
   - Credibility: Very High - Official PM2 documentation

2. **[PM2 - Production Setup with Nginx](https://pm2.keymetrics.io/docs/tutorials/pm2-nginx-production-setup)**
   - Official NGINX + PM2 integration guide
   - Credibility: Very High - Official PM2 documentation

3. **[Medium - Setup Node.js Application with PM2 and NGINX](https://medium.com/today-i-learned-chai/setup-node-js-application-with-pm2-and-nginx-72840f44ea73)**
   - Step-by-step PM2 + nginx setup
   - Credibility: Medium - Tutorial blog

4. **[Dev.To - Deploy Node.js on Linux with Nginx and PM2](https://dev.to/prateekshaweb/deploy-nodejs-on-linux-with-nginx-and-pm2-a-practical-beginners-guide-3gdm)**
   - Beginner-friendly PM2 ecosystem guide
   - Credibility: Medium - Developer community

5. **[DigitalOcean - How To Set Up a Node.js Application for Production on Ubuntu](https://www.digitalocean.com/community/tutorials/how-to-set-up-a-node-js-application-for-production-on-ubuntu-20-04)**
   - Production Node.js setup
   - Credibility: High - DigitalOcean guide

6. **[BetterStack - Running Node.js Apps with PM2 (Complete Guide)](https://betterstack.com/community/guides/scaling-nodejs/pm2-guide/)**
   - Comprehensive PM2 guide
   - Credibility: High - Developer tools company

## Log Rotation

1. **[RunCloud - How To Configure NGINX Log Rotation](https://runcloud.io/docs/how-to-configure-nginx-log-rotation)**
   - Log rotation configuration
   - Credibility: Medium - Cloud hosting provider

2. **[DigitalOcean - How To Configure Logging and Log Rotation in Nginx](https://www.digitalocean.com/community/tutorials/how-to-configure-logging-and-log-rotation-in-nginx-on-an-ubuntu-vps)** (Jan 2023)
   - Comprehensive logging tutorial
   - Credibility: High - DigitalOcean guide

3. **[NGINX Docs - Configuring Logging](https://docs.nginx.com/nginx/admin-guide/monitoring/logging/)**
   - Official logging documentation
   - Credibility: Very High - Official NGINX docs

4. **[Dash0 - Mastering Log Rotation in Linux with Logrotate](https://www.dash0.com/guides/log-rotation-linux-logrotate)**
   - Logrotate customization
   - Credibility: Medium - Observability platform

## InterServer VPS Specific

1. **[InterServer - Securing Nginx with SSL/TLS on Ubuntu](https://www.interserver.net/tips/kb/securing-nginx-ssl-tls-ubuntu-tips/)**
   - InterServer-specific nginx security
   - Credibility: Very High - Official InterServer documentation

2. **[InterServer - Setup Nginx, MySQL, PHP (LEMP stack) on Ubuntu 24.04](https://www.interserver.net/tips/kb/setup-lemp-stack-on-ubuntu-24-04/)**
   - LEMP stack installation guide
   - Credibility: Very High - Official InterServer documentation

3. **[InterServer - How to configure UFW Firewall on Ubuntu](https://www.interserver.net/tips/kb/configure-ufw-firewall-ubuntu-16/)**
   - Firewall configuration on InterServer
   - Credibility: Very High - Official InterServer documentation

4. **[InterServer - Manage and use Nginx Virtual host in Ubuntu](https://www.interserver.net/tips/kb/manage-use-nginx-virtual-host-ubuntu/)**
   - Virtual host configuration
   - Credibility: Very High - Official InterServer documentation

## Additional References

### Testing Tools
- SSL Labs: https://www.ssllabs.com/ssltest/
- Security Headers: https://securityheaders.com/
- HTTP/2 Test: https://tools.keycdn.com/http2-test
- WebPageTest: https://www.webpagetest.org/

### Official Documentation
- Nginx: https://nginx.org/en/docs/
- PM2: https://pm2.keymetrics.io/docs/
- Certbot: https://certbot.eff.org/docs/
- Let's Encrypt: https://letsencrypt.org/docs/

### Community Resources
- NGINX Community: https://community.nginx.org/
- Let's Encrypt Community: https://community.letsencrypt.org/
- Server Fault: https://serverfault.com/questions/tagged/nginx
- Stack Overflow: https://stackoverflow.com/questions/tagged/nginx

## Source Credibility Ratings

- **Very High**: Official documentation, well-established companies
- **High**: Reputable hosting providers, community-vetted solutions
- **Medium**: Independent blogs, developer communities
- **Low-Medium**: Unverified sources, personal blogs

## Research Methodology

1. Prioritized official documentation and established sources
2. Cross-referenced information across multiple sources
3. Preferred sources less than 1 year old for technology topics
4. Verified community solutions through upvotes/discussions
5. Included InterServer-specific documentation where available

---

**Last Updated**: January 18, 2026
