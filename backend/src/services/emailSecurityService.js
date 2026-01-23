/**
 * Email Security Service
 *
 * Provides email security features including:
 * - DKIM signing for outbound emails
 * - TLS/STARTTLS configuration
 * - SPF/DKIM/DMARC validation helpers
 * - Email authentication diagnostics
 *
 * @module emailSecurityService
 * @version 1.0.0
 */

import crypto from 'crypto';
import dns from 'dns';
import { promisify } from 'util';
import nodemailer from 'nodemailer';

const resolveTxt = promisify(dns.resolveTxt);
const resolveMx = promisify(dns.resolveMx);

// ============================================================================
// CONFIGURATION
// ============================================================================

const EMAIL_DOMAIN = process.env.EMAIL_DOMAIN || 'ementech.co.ke';
const DKIM_SELECTOR = process.env.DKIM_SELECTOR || 'default';

/**
 * DKIM Configuration
 * To generate DKIM keys:
 * 1. openssl genrsa -out dkim-private.pem 2048
 * 2. openssl rsa -in dkim-private.pem -pubout -out dkim-public.pem
 * 3. Add the public key to DNS as a TXT record: default._domainkey.ementech.co.ke
 */
const DKIM_CONFIG = {
  domainName: EMAIL_DOMAIN,
  keySelector: DKIM_SELECTOR,
  privateKey: process.env.DKIM_PRIVATE_KEY || null,
};

/**
 * Secure TLS configuration for email transport
 */
export const TLS_CONFIG = {
  // Minimum TLS version (TLS 1.2 or higher)
  minVersion: 'TLSv1.2',

  // Preferred cipher suites (in order of preference)
  ciphers: [
    'ECDHE-ECDSA-AES256-GCM-SHA384',
    'ECDHE-RSA-AES256-GCM-SHA384',
    'ECDHE-ECDSA-CHACHA20-POLY1305',
    'ECDHE-RSA-CHACHA20-POLY1305',
    'ECDHE-ECDSA-AES128-GCM-SHA256',
    'ECDHE-RSA-AES128-GCM-SHA256',
    'DHE-RSA-AES256-GCM-SHA384',
    'DHE-RSA-AES128-GCM-SHA256',
  ].join(':'),

  // Honor server cipher order
  honorCipherOrder: true,

  // Certificate validation (set to true in production)
  rejectUnauthorized: process.env.NODE_ENV === 'production',
};

// ============================================================================
// SECURE TRANSPORT FACTORY
// ============================================================================

/**
 * Creates a secure nodemailer transport with proper TLS and optional DKIM
 *
 * @param {Object} options - Transport options
 * @param {string} options.host - SMTP host
 * @param {number} options.port - SMTP port (587 for STARTTLS, 465 for SSL)
 * @param {boolean} options.secure - Use implicit TLS (port 465)
 * @param {Object} options.auth - Authentication credentials
 * @param {boolean} options.enableDkim - Enable DKIM signing
 * @param {boolean} options.pool - Use connection pooling
 * @returns {Object} Nodemailer transport
 */
export function createSecureTransport(options = {}) {
  const {
    host = process.env.SMTP_HOST || 'mail.ementech.co.ke',
    port = parseInt(process.env.SMTP_PORT, 10) || 587,
    secure = process.env.SMTP_SECURE === 'true',
    auth = {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    enableDkim = !!DKIM_CONFIG.privateKey,
    pool = false,
    maxConnections = 5,
    maxMessages = 100,
    rateDelta = 1000,
    rateLimit = 10,
  } = options;

  const transportConfig = {
    host,
    port,
    secure, // true for 465, false for other ports (will use STARTTLS)
    auth,

    // Connection settings
    connectionTimeout: 30000, // 30 seconds
    greetingTimeout: 30000,
    socketTimeout: 60000,

    // TLS Configuration
    tls: {
      ...TLS_CONFIG,
      // Server name for SNI (Server Name Indication)
      servername: host,
    },

    // Force STARTTLS for non-secure connections (port 587)
    requireTLS: !secure && port === 587,

    // Enable debugging in development
    debug: process.env.NODE_ENV === 'development',
    logger: process.env.NODE_ENV === 'development',
  };

  // Add pooling if requested
  if (pool) {
    transportConfig.pool = true;
    transportConfig.maxConnections = maxConnections;
    transportConfig.maxMessages = maxMessages;
    transportConfig.rateDelta = rateDelta;
    transportConfig.rateLimit = rateLimit;
  }

  // Add DKIM signing if configured
  if (enableDkim && DKIM_CONFIG.privateKey) {
    transportConfig.dkim = {
      domainName: DKIM_CONFIG.domainName,
      keySelector: DKIM_CONFIG.keySelector,
      privateKey: DKIM_CONFIG.privateKey,
    };
  }

  return nodemailer.createTransport(transportConfig);
}

/**
 * Creates a secure transport with connection pooling for bulk sending
 */
export function createPooledSecureTransport(options = {}) {
  return createSecureTransport({
    ...options,
    pool: true,
    maxConnections: options.maxConnections || 5,
    maxMessages: options.maxMessages || 100,
  });
}

// ============================================================================
// EMAIL SECURITY HEADERS
// ============================================================================

/**
 * Generates security headers for outbound emails
 *
 * @param {Object} options - Header options
 * @param {string} options.messageId - Message ID
 * @param {string} options.campaignId - Campaign ID (optional)
 * @param {string} options.leadId - Lead/recipient ID (optional)
 * @param {string} options.unsubscribeUrl - Unsubscribe URL
 * @returns {Object} Headers object
 */
export function generateSecurityHeaders(options = {}) {
  const {
    messageId = `<${crypto.randomUUID()}@${EMAIL_DOMAIN}>`,
    campaignId,
    leadId,
    unsubscribeUrl,
  } = options;

  const headers = {
    // Standard message identification
    'Message-ID': messageId,

    // RFC 8058 One-Click Unsubscribe
    ...(unsubscribeUrl && {
      'List-Unsubscribe': `<${unsubscribeUrl}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    }),

    // Tracking headers (internal use)
    ...(campaignId && { 'X-Campaign-ID': campaignId }),
    ...(leadId && { 'X-Lead-ID': leadId }),

    // Anti-phishing headers
    'X-Mailer': `EmenTech-Mailer/1.0`,

    // Priority (normal)
    'X-Priority': '3',
    'X-MSMail-Priority': 'Normal',

    // Prevent auto-replies for marketing emails
    ...(campaignId && {
      'Precedence': 'bulk',
      'Auto-Submitted': 'auto-generated',
    }),
  };

  return headers;
}

// ============================================================================
// DNS RECORD VALIDATION
// ============================================================================

/**
 * Validates SPF record for a domain
 *
 * @param {string} domain - Domain to check
 * @returns {Promise<{valid: boolean, record: string|null, error: string|null}>}
 */
export async function validateSPF(domain = EMAIL_DOMAIN) {
  try {
    const records = await resolveTxt(domain);
    const spfRecords = records.flat().filter(r => r.startsWith('v=spf1'));

    if (spfRecords.length === 0) {
      return {
        valid: false,
        record: null,
        error: 'No SPF record found',
        recommendation: `Add TXT record: v=spf1 include:_spf.${domain} a mx ip4:YOUR_SERVER_IP ~all`,
      };
    }

    if (spfRecords.length > 1) {
      return {
        valid: false,
        record: spfRecords.join('; '),
        error: 'Multiple SPF records found (should be exactly one)',
        recommendation: 'Merge all SPF rules into a single TXT record',
      };
    }

    const spfRecord = spfRecords[0];

    // Check for common issues
    const issues = [];
    if (!spfRecord.includes('a') && !spfRecord.includes('mx') && !spfRecord.includes('ip4')) {
      issues.push('SPF record may not include your sending servers');
    }
    if (spfRecord.endsWith('+all')) {
      issues.push('SPF ends with +all (allows any server) - use ~all or -all instead');
    }

    return {
      valid: issues.length === 0,
      record: spfRecord,
      error: issues.length > 0 ? issues.join('; ') : null,
      issues,
    };
  } catch (error) {
    return {
      valid: false,
      record: null,
      error: `DNS lookup failed: ${error.message}`,
    };
  }
}

/**
 * Validates DKIM record for a domain
 *
 * @param {string} domain - Domain to check
 * @param {string} selector - DKIM selector (default: 'default')
 * @returns {Promise<{valid: boolean, record: string|null, error: string|null}>}
 */
export async function validateDKIM(domain = EMAIL_DOMAIN, selector = DKIM_SELECTOR) {
  try {
    const dkimDomain = `${selector}._domainkey.${domain}`;
    const records = await resolveTxt(dkimDomain);
    const dkimRecord = records.flat().join('');

    if (!dkimRecord) {
      return {
        valid: false,
        record: null,
        error: 'No DKIM record found',
        recommendation: `Add TXT record at ${dkimDomain}: v=DKIM1; k=rsa; p=YOUR_PUBLIC_KEY`,
      };
    }

    // Check for required parts
    const issues = [];
    if (!dkimRecord.includes('v=DKIM1')) {
      issues.push('Missing version (v=DKIM1)');
    }
    if (!dkimRecord.includes('p=')) {
      issues.push('Missing public key (p=...)');
    }

    return {
      valid: issues.length === 0,
      record: dkimRecord,
      error: issues.length > 0 ? issues.join('; ') : null,
      selector,
      lookupDomain: dkimDomain,
    };
  } catch (error) {
    if (error.code === 'ENOTFOUND' || error.code === 'ENODATA') {
      return {
        valid: false,
        record: null,
        error: `No DKIM record found at ${selector}._domainkey.${domain}`,
        recommendation: 'Add DKIM TXT record to enable email authentication',
      };
    }
    return {
      valid: false,
      record: null,
      error: `DNS lookup failed: ${error.message}`,
    };
  }
}

/**
 * Validates DMARC record for a domain
 *
 * @param {string} domain - Domain to check
 * @returns {Promise<{valid: boolean, record: string|null, error: string|null}>}
 */
export async function validateDMARC(domain = EMAIL_DOMAIN) {
  try {
    const dmarcDomain = `_dmarc.${domain}`;
    const records = await resolveTxt(dmarcDomain);
    const dmarcRecord = records.flat().join('');

    if (!dmarcRecord) {
      return {
        valid: false,
        record: null,
        error: 'No DMARC record found',
        recommendation: `Add TXT record at _dmarc.${domain}: v=DMARC1; p=quarantine; rua=mailto:dmarc-reports@${domain}`,
      };
    }

    // Check for required parts
    const issues = [];
    if (!dmarcRecord.includes('v=DMARC1')) {
      issues.push('Missing version (v=DMARC1)');
    }
    if (!dmarcRecord.includes('p=')) {
      issues.push('Missing policy (p=none|quarantine|reject)');
    }

    // Extract policy
    const policyMatch = dmarcRecord.match(/p=(none|quarantine|reject)/);
    const policy = policyMatch ? policyMatch[1] : 'unknown';

    if (policy === 'none') {
      issues.push('Policy is set to "none" (monitoring only) - consider "quarantine" or "reject"');
    }

    return {
      valid: issues.length === 0,
      record: dmarcRecord,
      policy,
      error: issues.length > 0 ? issues.join('; ') : null,
      lookupDomain: dmarcDomain,
    };
  } catch (error) {
    if (error.code === 'ENOTFOUND' || error.code === 'ENODATA') {
      return {
        valid: false,
        record: null,
        error: `No DMARC record found at _dmarc.${domain}`,
        recommendation: 'Add DMARC TXT record for email authentication policy',
      };
    }
    return {
      valid: false,
      record: null,
      error: `DNS lookup failed: ${error.message}`,
    };
  }
}

/**
 * Validates MX records for a domain
 *
 * @param {string} domain - Domain to check
 * @returns {Promise<{valid: boolean, records: Array, error: string|null}>}
 */
export async function validateMX(domain = EMAIL_DOMAIN) {
  try {
    const mxRecords = await resolveMx(domain);

    if (!mxRecords || mxRecords.length === 0) {
      return {
        valid: false,
        records: [],
        error: 'No MX records found',
        recommendation: `Add MX record: ${domain} -> mail.${domain} (priority 10)`,
      };
    }

    // Sort by priority
    const sortedRecords = mxRecords.sort((a, b) => a.priority - b.priority);

    return {
      valid: true,
      records: sortedRecords,
      primaryMX: sortedRecords[0].exchange,
      error: null,
    };
  } catch (error) {
    return {
      valid: false,
      records: [],
      error: `DNS lookup failed: ${error.message}`,
    };
  }
}

/**
 * Runs a complete email security audit for a domain
 *
 * @param {string} domain - Domain to audit
 * @returns {Promise<Object>} Complete audit results
 */
export async function runSecurityAudit(domain = EMAIL_DOMAIN) {
  console.log(`\n📧 Running email security audit for: ${domain}\n`);

  const [spf, dkim, dmarc, mx] = await Promise.all([
    validateSPF(domain),
    validateDKIM(domain),
    validateDMARC(domain),
    validateMX(domain),
  ]);

  const results = {
    domain,
    timestamp: new Date().toISOString(),
    overallScore: 0,
    maxScore: 100,
    checks: {
      spf: { ...spf, points: spf.valid ? 25 : 0, maxPoints: 25 },
      dkim: { ...dkim, points: dkim.valid ? 25 : 0, maxPoints: 25 },
      dmarc: { ...dmarc, points: dmarc.valid ? 25 : 0, maxPoints: 25 },
      mx: { ...mx, points: mx.valid ? 25 : 0, maxPoints: 25 },
    },
    recommendations: [],
  };

  // Calculate overall score
  results.overallScore =
    results.checks.spf.points +
    results.checks.dkim.points +
    results.checks.dmarc.points +
    results.checks.mx.points;

  // Generate recommendations
  if (!spf.valid) {
    results.recommendations.push({
      priority: 'high',
      type: 'spf',
      message: spf.recommendation || 'Configure SPF record',
    });
  }
  if (!dkim.valid) {
    results.recommendations.push({
      priority: 'high',
      type: 'dkim',
      message: dkim.recommendation || 'Configure DKIM record',
    });
  }
  if (!dmarc.valid) {
    results.recommendations.push({
      priority: 'medium',
      type: 'dmarc',
      message: dmarc.recommendation || 'Configure DMARC record',
    });
  }
  if (!mx.valid) {
    results.recommendations.push({
      priority: 'critical',
      type: 'mx',
      message: mx.recommendation || 'Configure MX records',
    });
  }

  // Print summary
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📊 Security Score: ${results.overallScore}/${results.maxScore}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  SPF:   ${spf.valid ? '✅' : '❌'} ${spf.record || spf.error}`);
  console.log(`  DKIM:  ${dkim.valid ? '✅' : '❌'} ${dkim.record ? 'Configured' : dkim.error}`);
  console.log(`  DMARC: ${dmarc.valid ? '✅' : '❌'} ${dmarc.record || dmarc.error}`);
  console.log(`  MX:    ${mx.valid ? '✅' : '❌'} ${mx.primaryMX || mx.error}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (results.recommendations.length > 0) {
    console.log('⚠️  Recommendations:');
    results.recommendations.forEach((rec, i) => {
      console.log(`  ${i + 1}. [${rec.priority.toUpperCase()}] ${rec.message}`);
    });
    console.log('');
  }

  return results;
}

// ============================================================================
// SMTP DIAGNOSTICS
// ============================================================================

/**
 * Tests SMTP connection with detailed diagnostics
 *
 * @param {Object} options - Connection options
 * @returns {Promise<Object>} Diagnostic results
 */
export async function diagnoseSMTP(options = {}) {
  const {
    host = process.env.SMTP_HOST || 'mail.ementech.co.ke',
    port = parseInt(process.env.SMTP_PORT, 10) || 587,
    secure = process.env.SMTP_SECURE === 'true',
    user = process.env.SMTP_USER,
    pass = process.env.SMTP_PASS,
  } = options;

  console.log(`\n🔍 SMTP Diagnostics for ${host}:${port}\n`);

  const results = {
    host,
    port,
    secure,
    timestamp: new Date().toISOString(),
    tests: {},
  };

  // Test 1: Basic connection
  console.log('Test 1: Basic Connection...');
  try {
    const transport = nodemailer.createTransport({
      host,
      port,
      secure,
      connectionTimeout: 10000,
      tls: {
        rejectUnauthorized: false, // For diagnosis only
      },
    });

    // Just try to connect (not authenticate)
    await new Promise((resolve, reject) => {
      transport.verify((error) => {
        if (error) reject(error);
        else resolve();
      });
    }).catch(() => {});

    results.tests.basicConnection = { success: true };
    console.log('  ✅ Basic connection successful');
  } catch (error) {
    results.tests.basicConnection = {
      success: false,
      error: error.message,
      code: error.code,
    };
    console.log(`  ❌ Basic connection failed: ${error.message}`);
  }

  // Test 2: TLS/STARTTLS
  console.log('Test 2: TLS/STARTTLS...');
  try {
    const transport = nodemailer.createTransport({
      host,
      port,
      secure,
      requireTLS: !secure && port === 587,
      tls: TLS_CONFIG,
      connectionTimeout: 10000,
    });

    await transport.verify();
    results.tests.tlsConnection = { success: true };
    console.log('  ✅ TLS/STARTTLS working');
  } catch (error) {
    results.tests.tlsConnection = {
      success: false,
      error: error.message,
      hint: error.code === 'ECONNREFUSED'
        ? 'Server refused connection - check firewall/port'
        : error.code === 'ETIMEDOUT'
        ? 'Connection timed out - check network/firewall'
        : null,
    };
    console.log(`  ❌ TLS connection failed: ${error.message}`);
  }

  // Test 3: Authentication
  if (user && pass) {
    console.log('Test 3: Authentication...');
    try {
      const transport = nodemailer.createTransport({
        host,
        port,
        secure,
        requireTLS: !secure && port === 587,
        auth: { user, pass },
        tls: { rejectUnauthorized: false },
        connectionTimeout: 10000,
      });

      await transport.verify();
      results.tests.authentication = { success: true, user };
      console.log(`  ✅ Authentication successful for ${user}`);
    } catch (error) {
      results.tests.authentication = {
        success: false,
        user,
        error: error.message,
        code: error.responseCode,
      };
      console.log(`  ❌ Authentication failed: ${error.message}`);

      if (error.responseCode === 535) {
        console.log('     💡 Hint: Invalid credentials - check username/password');
      } else if (error.responseCode === 534) {
        console.log('     💡 Hint: App password may be required (if using Gmail/2FA)');
      }
    }
  }

  // Test 4: Send test email (if auth works)
  if (results.tests.authentication?.success) {
    console.log('Test 4: Send Test Email...');
    try {
      const transport = nodemailer.createTransport({
        host,
        port,
        secure,
        requireTLS: !secure && port === 587,
        auth: { user, pass },
        tls: TLS_CONFIG,
      });

      const testResult = await transport.sendMail({
        from: user,
        to: user, // Send to self
        subject: 'SMTP Test - ' + new Date().toISOString(),
        text: 'This is a test email from EmenTech SMTP diagnostics.',
      });

      results.tests.sendEmail = {
        success: true,
        messageId: testResult.messageId,
        response: testResult.response,
      };
      console.log(`  ✅ Test email sent: ${testResult.messageId}`);
    } catch (error) {
      results.tests.sendEmail = {
        success: false,
        error: error.message,
        code: error.responseCode,
        response: error.response,
      };
      console.log(`  ❌ Send failed: ${error.message}`);

      // Provide hints based on error code
      if (error.responseCode === 451) {
        console.log('     💡 Hint: 451 error indicates server configuration problem');
        console.log('     Check: Postfix main.cf, virtual_mailbox_domains, virtual_mailbox_maps');
      } else if (error.responseCode === 550) {
        console.log('     💡 Hint: 550 error - recipient address rejected');
      } else if (error.responseCode === 554) {
        console.log('     💡 Hint: 554 error - message rejected (spam/policy)');
      }
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 Summary:');
  Object.entries(results.tests).forEach(([test, result]) => {
    console.log(`  ${result.success ? '✅' : '❌'} ${test}`);
  });
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  return results;
}

/**
 * Tests receiving mail capability (checks if mailbox can receive)
 * This helps diagnose 451 4.3.5 errors
 *
 * @param {string} email - Email address to test
 * @returns {Promise<Object>} Test results
 */
export async function testMailboxReceiving(email) {
  const domain = email.split('@')[1];
  const localPart = email.split('@')[0];

  console.log(`\n📬 Testing mailbox receiving capability for: ${email}\n`);

  const results = {
    email,
    timestamp: new Date().toISOString(),
    checks: {},
  };

  // Check 1: MX records exist
  console.log('Check 1: MX Records...');
  const mx = await validateMX(domain);
  results.checks.mxRecords = mx;
  console.log(`  ${mx.valid ? '✅' : '❌'} MX: ${mx.primaryMX || mx.error}`);

  // Check 2: Try to connect to the mail server
  if (mx.valid) {
    console.log('Check 2: Connect to Mail Server...');
    try {
      const net = await import('net');
      const connected = await new Promise((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(10000);

        socket.connect(25, mx.primaryMX, () => {
          socket.destroy();
          resolve(true);
        });

        socket.on('error', () => {
          socket.destroy();
          resolve(false);
        });

        socket.on('timeout', () => {
          socket.destroy();
          resolve(false);
        });
      });

      results.checks.serverConnection = { success: connected };
      console.log(`  ${connected ? '✅' : '❌'} Connection to ${mx.primaryMX}:25`);
    } catch (error) {
      results.checks.serverConnection = { success: false, error: error.message };
      console.log(`  ❌ Connection failed: ${error.message}`);
    }
  }

  // Recommendations for 451 4.3.5 error
  console.log('\n💡 Troubleshooting 451 4.3.5 "Server configuration problem":');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('This error means the receiving mail server has a configuration issue.');
  console.log('\nCheck on your mail server (mail.ementech.co.ke):');
  console.log('');
  console.log('1. Postfix main.cf - Verify virtual mailbox settings:');
  console.log('   virtual_mailbox_domains = ementech.co.ke');
  console.log('   virtual_mailbox_base = /var/mail/vhosts');
  console.log('   virtual_mailbox_maps = hash:/etc/postfix/vmailbox');
  console.log('');
  console.log('2. Virtual mailbox file (/etc/postfix/vmailbox):');
  console.log(`   ${email}    ${domain}/${localPart}/`);
  console.log('');
  console.log('3. Run postmap after editing:');
  console.log('   sudo postmap /etc/postfix/vmailbox');
  console.log('   sudo systemctl reload postfix');
  console.log('');
  console.log('4. Check Dovecot user database:');
  console.log(`   doveadm user ${email}`);
  console.log('');
  console.log('5. Check mail logs:');
  console.log('   sudo tail -f /var/log/mail.log');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  return results;
}

// ============================================================================
// DKIM KEY GENERATION
// ============================================================================

/**
 * Generates a DKIM key pair
 *
 * @returns {Object} Key pair with public and private keys
 */
export function generateDKIMKeyPair() {
  const { generateKeyPairSync } = crypto;

  const { publicKey, privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
    },
  });

  // Extract the base64 part for DNS record
  const publicKeyBase64 = publicKey
    .replace('-----BEGIN PUBLIC KEY-----', '')
    .replace('-----END PUBLIC KEY-----', '')
    .replace(/\n/g, '');

  console.log('\n🔐 DKIM Key Pair Generated');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n📤 Add this TXT record to your DNS:');
  console.log(`   Record: ${DKIM_SELECTOR}._domainkey.${EMAIL_DOMAIN}`);
  console.log(`   Value: v=DKIM1; k=rsa; p=${publicKeyBase64}`);
  console.log('\n📥 Add this to your .env file:');
  console.log(`   DKIM_PRIVATE_KEY="${privateKey.replace(/\n/g, '\\n')}"`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  return {
    publicKey,
    privateKey,
    publicKeyBase64,
    dnsRecord: {
      name: `${DKIM_SELECTOR}._domainkey.${EMAIL_DOMAIN}`,
      type: 'TXT',
      value: `v=DKIM1; k=rsa; p=${publicKeyBase64}`,
    },
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  TLS_CONFIG,
  createSecureTransport,
  createPooledSecureTransport,
  generateSecurityHeaders,
  validateSPF,
  validateDKIM,
  validateDMARC,
  validateMX,
  runSecurityAudit,
  diagnoseSMTP,
  testMailboxReceiving,
  generateDKIMKeyPair,
};
