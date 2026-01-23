EmenTech Email Server - Testing & Verification Procedures
===========================================================

Purpose: Comprehensive testing procedures to ensure email server is fully operational
Date: 2025-01-19
Server: ementech-mail.ementech.co.ke (69.164.244.165)

TESTING CHECKLIST
=================

Phase 1: Pre-Testing Verification
----------------------------------
[ ] All 16 implementation phases completed
[ ] All services running (postfix, dovecot, rspamd, nginx)
[ ] DNS records added at registrar
[ ] DNS propagation complete (wait 30 minutes)
[ ] SSL certificates installed
[ ] Email accounts created
[ ] Firewall rules configured

Phase 2: DNS Testing
--------------------
[ ] A records resolve correctly
[ ] MX record is correct
[ ] SPF record passes validation
[ ] DKIM record is present
[ ] DMARC record is valid
[ ] PTR record exists (check with VPS provider)
[ ] SRV records resolve (if configured)

Phase 3: Service Testing
-------------------------
[ ] Postfix accepts connections on port 25
[ ] Postfix accepts connections on port 587
[ ] Postfix accepts connections on port 465
[ ] Dovecot accepts connections on port 993
[ ] Dovecot accepts connections on port 995
[ ] Nginx serves webmail on port 443
[ ] Rspamd is filtering spam

Phase 4: Authentication Testing
--------------------------------
[ ] ceo@ementech.co.ke can authenticate
[ ] info@ementech.co.ke can authenticate
[ ] support@ementech.co.ke can authenticate
[ ] admin@ementech.co.ke can authenticate
[ ] tech@ementech.co.ke can authenticate
[ ] Webmail login works for all accounts
[ ] IMAP authentication works
[ ] SMTP authentication works

Phase 5: Email Testing
----------------------
[ ] Internal email delivery works
[ ] External email delivery works
[ ] Email receiving works
[ ] Webmail can send email
[ ] Webmail can receive email
[ ] Attachments work (upload/download)
[ ] Spam filtering detects spam
[ ] DKIM signing is working

Phase 6: Security Testing
--------------------------
[ ] SSL/TLS certificates are valid
[ ] Only strong ciphers are enabled
[ ] Server is not an open relay
[ ] Fail2ban is blocking attacks
[ ] Firewall rules are correct
[ ] No security vulnerabilities

Phase 7: Performance Testing
-----------------------------
[ ] Memory usage is acceptable (<1.5GB)
[ ] Disk usage is acceptable (<80%)
[ ] Mail queue is not stuck
[ ] Concurrent connections work
[ ] Response time is acceptable

DETAILED TESTING PROCEDURES
============================

TEST 1: DNS Records Verification
---------------------------------
Purpose: Verify all DNS records are correct and propagated

Command:
```bash
# A Records
dig +short mail.ementech.co.ke A
dig +short smtp.ementech.co.ke A
dig +short imap.ementech.co.ke A
dig +short webmail.ementech.co.ke A

# Expected Output: 69.164.244.165 (for all A records)

# MX Record
dig +short MX ementech.co.ke

# Expected Output: 10 mail.ementech.co.ke.

# SPF Record
dig +short TXT ementech.co.ke

# Expected Output: "v=spf1 mx a ip4:69.164.244.165 -all"

# DMARC Record
dig +short TXT _dmarc.ementech.co.ke

# Expected Output: "v=DMARC1; p=quarantine; rua=mailto:admin@ementech.co.ke; ..."

# DKIM Record
dig +short TXT default._domainkey.ementech.co.ke

# Expected Output: "v=DKIM1; k=rsa; p=MIGfMA0GCSq..."

# PTR Record
dig -x 69.164.244.165 +short

# Expected Output: mail.ementech.co.ke.

# Test from external DNS servers
dig @8.8.8.8 +short MX ementech.co.ke
dig @1.1.1.1 +short TXT ementech.co.ke
```

Pass Criteria:
- All commands return expected output
- No NXDOMAIN errors
- Records propagate to external DNS servers

Troubleshooting:
- Wait 30 minutes for DNS propagation
- Check for typos in DNS records
- Use https://www.whatsmydns.net/ to check worldwide propagation
- Verify records are saved at registrar

TEST 2: SMTP Port 25 (Incoming Mail)
-------------------------------------
Purpose: Verify server accepts incoming mail from other servers

Command:
```bash
telnet localhost 25
```

Expected Conversation:
```
Trying 127.0.0.1...
Connected to localhost.
Escape character is '^]'.
220 ementech-mail.ementech.co.ke ESMTP Postfix (Ubuntu)

EHLO test.com
250-ementech-mail.ementech.co.ke
250-PIPELINING
250-SIZE 20971520
250-VRFY
250-ETRN
250-STARTTLS
250-ENHANCEDSTATUSCODES
250-8BITMIME
250 DSN

MAIL FROM:<test@example.com>
250 2.1.0 Ok

RCPT TO:<ceo@ementech.co.ke>
250 2.1.5 Ok

DATA
354 End data with <CR><LF>.<CR><LF>

Subject: Test email
From: test@example.com
To: ceo@ementech.co.ke

This is a test email.
.
250 2.0.0 Ok: queued as XXXXX

QUIT
221 2.0.0 Bye
```

Pass Criteria:
- Connection succeeds
- EHLO returns capabilities including STARTTLS
- MAIL FROM and RCPT TO succeed
- DATA accepts message
- Message is queued (250 2.0.0 Ok)

Troubleshooting:
- Check Postfix is running: systemctl status postfix
- Check firewall: sudo ufw status | grep 25
- Check logs: sudo tail -f /var/log/mail.log

TEST 3: SMTP Port 587 (Authenticated Submission)
--------------------------------------------------
Purpose: Verify clients can send email with authentication

Command:
```bash
swaks --to ceo@ementech.co.ke \
  --from info@ementech.co.ke \
  --server mail.ementech.co.ke:587 \
  --auth \
  --auth-user info@ementech.co.ke \
  --auth-password [PASSWORD] \
  --tls
```

Expected Output:
```
=== Trying mail.ementech.co.ke:587 ===
=== Connected to mail.ementech.co.ke. ===
<-  220 ementech-mail.ementech.co.ke ESMTP Postfix
 -> EHLO ...
<-  250-ementech-mail.ementech.co.ke
<-  250-STARTTLS
<-  250-AUTH PLAIN LOGIN
 -> STARTTLS
<-  220 2.0.0 Ready to start TLS
=== TLS started with cipher TLSv1.3 ===
 -> AUTH PLAIN [BASE64]
<-  235 2.7.0 Authentication successful
 -> MAIL FROM:<info@ementech.co.ke>
<-  250 2.1.0 Ok
 -> RCPT TO:<ceo@ementech.co.ke>
<-  250 2.1.5 Ok
 -> DATA
<-  354 End data with <CR><LF>.<CR><LF>
 -> [email content]
 <-  250 2.0.0 Ok: queued as XXXXX
 -> QUIT
<-  221 2.0.0 Bye
=== Connection closed with remote host. ===
```

Pass Criteria:
- Authentication succeeds (235 2.7.0)
- TLS connection established
- Email is queued successfully
- No authentication errors

Troubleshooting:
- Verify password is correct: doveadm auth test info@ementech.co.ke PASSWORD
- Check SASL is enabled: postconf | grep sasl
- Check logs: sudo tail -f /var/log/mail.log | grep sasl

TEST 4: IMAP Port 993 (Secure Email Retrieval)
----------------------------------------------
Purpose: Verify clients can retrieve email securely

Command:
```bash
openssl s_client -connect mail.ementech.co.ke:993 -crlf
```

Expected Conversation:
```
CONNECTED(00000003)
---
* OK [CAPABILITY IMAP4rev1 SASL-IR LOGIN-REFERRALS ID ENABLE IDLE NAMESPACE LITERAL+ STARTTLS AUTH=PLAIN AUTH=LOGIN] Dovecot ready.

a001 LOGIN ceo@ementech.co.ke [PASSWORD]
a001 OK [CAPABILITY IMAP4rev1 SASL-IR LOGIN-REFERRALS ID ENABLE IDLE SORT SORT=DISPLAY THREAD=REFERENCES THREAD=REFS] Logged in

a002 LIST "" "*"
* LIST (\HasNoChildren) "." INBOX
a002 OK LIST completed

a003 SELECT INBOX
* FLAGS (\Answered \Flagged \Deleted \Seen \Draft)
* OK [PERMANENTFLAGS (\Answered \Flagged \Deleted \Seen \Draft \*)] Flags permitted.
* OK [UNSEEN 0] First unseen.
a003 OK [READ-WRITE] Select completed

a004 LOGOUT
* BYE Logging out
a004 OK Logout completed.
```

Pass Criteria:
- SSL/TLS connection succeeds
- Authentication succeeds
- INBOX is accessible
- Can SELECT INBOX
- Logout succeeds

Troubleshooting:
- Check Dovecot is running: systemctl status dovecot
- Check SSL certificates: ls -la /etc/letsencrypt/live/
- Check logs: sudo tail -f /var/log/dovecot.log

TEST 5: Webmail Access
-----------------------
Purpose: Verify webmail is accessible via HTTPS

Procedure:
1. Open browser: https://webmail.ementech.co.ke
2. Login with ceo@ementech.co.ke
3. Check inbox loads
4. Compose new email
5. Send test email to info@ementech.co.ke
6. Check sent folder
7. Check received email in info@ementech.co.ke inbox

Pass Criteria:
- Webmail loads without SSL warnings
- Login succeeds
- Inbox displays emails
- Can compose and send email
- Can receive email
- Attachments work

Troubleshooting:
- Check nginx is running: systemctl status nginx
- Check SSL certificate: openssl s_client -connect webmail.ementech.co.ke:443
- Check nginx logs: sudo tail -f /var/log/nginx/webmail-error.log
- Check Roundcube logs: sudo tail -f /var/log/roundcube/errors

TEST 6: Spam Filtering Test
----------------------------
Purpose: Verify spam filter detects and flags spam

Command:
```bash
# Send GTUBE test spam (Generic Test for Unsolicited Bulk Email)
echo -e "Subject: Test spam\n\nXJS*C4JDBQADN1.NSBN3*2IDNEN*GTUBE-STANDARD-ANTI-UBE-TEST-EMAIL*C.34X" | sendmail ceo@ementech.co.ke

# Check logs
sudo tail -f /var/log/mail.log | grep spam
sudo tail -f /var/log/rspamd/rspamd.log | grep spam
```

Expected Output:
```
# Email should be flagged with high spam score
# Headers should include: X-Spam-Flag: YES
# Score should be 1000+ (GTUBE always scores 1000)
```

Pass Criteria:
- GTUBE email is detected as spam
- Spam score is 1000+
- Email is rejected or moved to spam folder
- Logs show spam detection

Troubleshooting:
- Check Rspamd is running: systemctl status rspamd
- Check milter connection: sudo netstat -tulpn | grep 11332
- View Rspamd web UI: https://mail.ementech.co.ke:11334 (login with password from /etc/rspamd/local.d/worker-controller.inc)

TEST 7: DKIM Signing Test
--------------------------
Purpose: Verify outgoing emails are signed with DKIM

Command:
```bash
# Send test email
echo "Test DKIM signing" | mail -s "DKIM Test" ceo@ementech.co.ke

# Check email was signed
sudo tail -100 /var/log/mail.log | grep dkim
```

Alternative: View email headers in webmail:
1. Send test email to external address (Gmail, etc.)
2. Open email in webmail
3. View "Message Source" or "Show Original"
4. Look for: DKIM-Signature: header

Expected Header:
```
DKIM-Signature: v=1; a=rsa-sha256; c=relaxed/relaxed;
 d=ementech.co.ke; s=default; t=1234567890;
 h=from:to:subject:date; bh=abc123...;
 b=xyz456...
```

Pass Criteria:
- DKIM-Signature header is present
- Domain is ementech.co.ke
- Selector is default
- Signature is valid (when verified)

Verification:
Send test email to: https://www.mail-tester.com/
Should show: DKIM: PASS (with green checkmark)

Troubleshooting:
- Check DKIM key exists: ls -la /var/lib/rspamd/dkim/
- Check DKIM config: cat /etc/rspamd/local.d/dkim_signing.conf
- Check DNS: dig +short TXT default._domainkey.ementech.co.ke

TEST 8: Email Deliverability Test
----------------------------------
Purpose: Verify emails are delivered to external providers (Gmail, Outlook)

Procedure:
1. Send test email to: your-email@gmail.com
2. Send test email to: your-email@outlook.com
3. Check if email arrives in inbox (not spam)
4. View email headers to verify SPF/DKIM/DMARC

Gmail Headers (look for):
```
Received-SPF: pass (google.com: domain of ceo@ementech.co.ke designates 69.164.244.165 as permitted sender)
Authentication-Results: mx.google.com;
  dkim=pass header.i=@ementech.co.ke;
  spf=pass (google.com: domain of ceo@ementech.co.ke designates 69.164.244.165 as permitted sender);
  dmarc=pass (p=QUARANTINE sp=QUARANTINE dis=NONE) header.from=ementech.co.ke
```

Outlook Headers (look for):
```
X-Forefront-Antispam-Report: ... SPF:Pass; DKIM:Pass; DMARC:Pass
```

Pass Criteria:
- Email arrives in inbox (not spam folder)
- SPF passes
- DKIM passes
- DMARC passes
- No authentication failures

Troubleshooting:
- Use: https://www.mail-tester.com/ (send test email, get score)
- Use: https://mxtoolbox.com/deliverability
- Check SPF: dig +short TXT ementech.co.ke
- Check DKIM: dig +short TXT default._domainkey.ementech.co.ke
- Check DMARC: dig +short TXT _dmarc.ementech.co.ke

TEST 9: Security Hardening Test
--------------------------------
Purpose: Verify security measures are in place

Command:
```bash
# Test SSL/TLS configuration
curl https://sslcheck.websecurity.symantec.com/check.php \
  --data "host=mail.ementech.co.ke&port=993"

# Alternative: Use SSL Labs
# https://www.ssllabs.com/ssltest/analyze.html?d=mail.ementech.co.ke

# Check for open relay
curl https://www.mail-abuse.com/analyzer.html?address=69.164.244.165

# Check firewall
sudo ufw status numbered

# Check Fail2ban
sudo fail2ban-client status

# Test for weak ciphers
nmap --script ssl-enum-ciphers -p 993 mail.ementech.co.ke
```

Pass Criteria:
- SSL Labs grade: A or better
- No open relay detected
- Only necessary ports are open
- Fail2ban is active with banned IPs (if attacks occurred)
- Only strong ciphers (TLSv1.2+, no SSLv3)

Troubleshooting:
- Update SSL config in Postfix and Dovecot
- Update firewall rules: sudo ufw allow/deny
- Restart services after config changes

TEST 10: Performance Test
--------------------------
Purpose: Verify server performance is acceptable

Command:
```bash
# Check memory usage
free -h

# Check disk usage
df -h /var/mail

# Check mail queue
sudo postqueue -p

# Check active connections
sudo netstat -an | grep :993 | wc -l
sudo netstat -an | grep :587 | wc -l

# Check system load
uptime

# Check process stats
ps aux | grep -E "postfix|dovecot|rspamd" | awk '{print $3, $4, $11}'
```

Pass Criteria:
- Memory usage: < 1.5GB (75% of 2GB)
- Disk usage: < 80% of /var/mail
- Mail queue: < 100 messages (should be 0-10 normally)
- Load average: < 2.0
- No excessive CPU usage

Troubleshooting:
- High memory: Restart services, check for memory leaks
- High disk usage: Clean spam folders, rotate logs
- Large queue: Check for stuck emails, flush queue
- High load: Optimize configurations, limit connections

AUTOMATED TESTING SCRIPT
========================
Save this as: /usr/local/bin/test-mail-server.sh

```bash
#!/bin/bash
# Automated mail server testing script

echo "EmenTech Mail Server Test Suite"
echo "==============================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Function to run test
run_test() {
    local test_name=$1
    local test_command=$2
    local expected=$3

    echo -n "Testing: $test_name... "
    result=$(eval $test_command)

    if [[ $result == *"$expected"* ]]; then
        echo -e "${GREEN}PASS${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}FAIL${NC}"
        echo "  Expected: $expected"
        echo "  Got: $result"
        ((FAILED++))
        return 1
    fi
}

# DNS Tests
echo "DNS Tests"
echo "---------"
run_test "A Record (mail)" "dig +short mail.ementech.co.ke A" "69.164.244.165"
run_test "MX Record" "dig +short MX ementech.co.ke" "mail.ementech.co.ke"
run_test "SPF Record" "dig +short TXT ementech.co.ke" "spf1"
run_test "DMARC Record" "dig +short TXT _dmarc.ementech.co.ke" "DMARC1"
echo ""

# Service Tests
echo "Service Tests"
echo "-------------"
run_test "Postfix Running" "systemctl is-active postfix" "active"
run_test "Dovecot Running" "systemctl is-active dovecot" "active"
run_test "Rspamd Running" "systemctl is-active rspamd" "active"
run_test "Nginx Running" "systemctl is-active nginx" "active"
echo ""

# Port Tests
echo "Port Tests"
echo "----------"
run_test "SMTP (25) Open" "netstat -tulpn | grep :25" "master"
run_test "SMTP (587) Open" "netstat -tulpn | grep :587" "master"
run_test "IMAP (993) Open" "netstat -tulpn | grep :993" "dovecot"
echo ""

# Performance Tests
echo "Performance Tests"
echo "-----------------"
MEMORY_USAGE=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100}')
if [ $MEMORY_USAGE -lt 80 ]; then
    echo -e "Memory Usage: ${GREEN}$MEMORY_USAGE%${NC}"
    ((PASSED++))
else
    echo -e "Memory Usage: ${RED}$MEMORY_USAGE%${NC} (high)"
    ((FAILED++))
fi

DISK_USAGE=$(df -h /var/mail | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -lt 80 ]; then
    echo -e "Disk Usage: ${GREEN}$DISK_USAGE%${NC}"
    ((PASSED++))
else
    echo -e "Disk Usage: ${RED}$DISK_USAGE%${NC} (high)"
    ((FAILED++))
fi
echo ""

# Summary
echo "==============================="
echo "Test Results: $PASSED passed, $FAILED failed"
echo "==============================="

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed!${NC}"
    exit 1
fi
```

Make executable:
```bash
sudo chmod +x /usr/local/bin/test-mail-server.sh
```

Run tests:
```bash
sudo /usr/local/bin/test-mail-server.sh
```

ONLINE TESTING TOOLS
====================

1. **Mail-Tester** (https://www.mail-tester.com/)
   - Send test email to address provided
   - Get comprehensive deliverability score
   - Check SPF, DKIM, DMARC
   - Identify issues
   - Aim for: 8/10 or higher

2. **MXToolbox** (https://mxtoolbox.com/)
   - DNS Lookup: Verify all DNS records
   - Diagnostics: Comprehensive mail server check
   - Blacklist Check: Verify IP not blacklisted
   - SMTP Test: Test SMTP connection
   - All tests should pass

3. **GlockApps** (https://glockapps.com/)
   - Test email deliverability
   - Check spam folder placement
   - Test with multiple providers (Gmail, Outlook, Yahoo)
   - Free tier available

4. **DNSlytics** (https://dnslytics.com/)
   - DNS report: Check all DNS records
   - DNS lookup: Verify specific records
   - Whois lookup: Check domain ownership
   - All records should be valid

5. **SSL Labs** (https://www.ssllabs.com/ssltest/)
   - Test SSL/TLS configuration
   - Check certificate validity
   - Verify cipher suites
   - Aim for: A grade or higher

6. **EmailRate** (https://emailrate.ai/)
   - Test email infrastructure
   - Check authentication (SPF/DKIM/DMARC)
   - Verify configuration
   - Free comprehensive test

TESTING SCHEDULE
================

Before Production Launch:
- Run all tests in this document
- Fix any failures
- Re-run tests until all pass
- Document any known issues

Daily (First Week):
- Run automated test script
- Check mail queue
- Verify email deliverability
- Monitor logs for errors

Weekly (First Month):
- Run full test suite
- Test with external providers
- Check spam folder placement
- Review deliverability scores

Monthly (Ongoing):
- Comprehensive security audit
- Performance testing
- Deliverability verification
- SSL certificate check

PASS/FAIL CRITERIA
==================

Overall Status: PASS
- All DNS tests pass
- All services are running
- All authentication tests pass
- Email can be sent and received
- SPF/DKIM/DMARC pass
- Security tests pass
- Performance is acceptable

Overall Status: FAIL
- Any DNS test fails
- Any service is not running
- Authentication fails
- Email delivery fails
- SPF/DKIM/DMARC fail
- Security vulnerabilities found
- Performance is poor

Known Issues Can Be Accepted:
- Minor configuration warnings
- Low-priority security findings
- Performance optimizations needed

TROUBLESHOOTING GUIDE
=====================

If Tests Fail:

1. **Check Services**
   systemctl status postfix dovecot rspamd nginx
   systemctl restart postfix dovecot rspamd nginx

2. **Check Logs**
   sudo tail -100 /var/log/mail.log
   sudo tail -100 /var/log/dovecot.log
   sudo tail -100 /var/log/rspamd/rspamd.log

3. **Check DNS**
   dig +short MX ementech.co.ke
   dig +short TXT ementech.co.ke
   Use: https://www.whatsmydns.net/

4. **Check Firewall**
   sudo ufw status numbered

5. **Check Configuration**
   sudo postfix check
   sudo doveconf -n | less

6. **Check Authentication**
   doveadm auth test user@ementech.co.ke PASSWORD

7. **Check SSL**
   openssl s_client -connect mail.ementech.co.ke:993
   sudo certbot certificates

8. **Run Diagnostics**
   sudo /usr/local/bin/test-mail-server.sh
   /root/mail-server-status.sh

ESCALATION PROCEDURES
=====================

Minor Issues (fix within 24 hours):
- Email delivery delays
- Some spam getting through
- Minor config warnings
- Performance degradation

Major Issues (fix immediately):
- Email completely down
- Server is open relay
- Security breach detected
- Database corruption
- Disk space full

Emergency (fix within 1 hour):
- Server being used for spam
- All services stopped
- Complete system failure
- Data loss

DOCUMENTATION
=============
- Full documentation: /root/mail-server-documentation.md
- Quick reference: /root/mail-server-quickref.txt
- Implementation guide: .agent-workspace/artifacts/email-server-implementation-guide.md
- DNS records: .agent-workspace/artifacts/dns-records.txt

VERSION: 1.0
LAST UPDATED: 2025-01-19
STATUS: Ready for Execution
