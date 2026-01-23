/**
 * Email Diagnostics Controller
 *
 * Provides API endpoints for email system diagnostics and security audits.
 * Admin-only access for security.
 *
 * @module emailDiagnosticsController
 */

import {
  runSecurityAudit,
  diagnoseSMTP,
  testMailboxReceiving,
  validateSPF,
  validateDKIM,
  validateDMARC,
  validateMX,
  createSecureTransport,
} from '../services/emailSecurityService.js';

const EMAIL_DOMAIN = process.env.EMAIL_DOMAIN || 'ementech.co.ke';

/**
 * Run full security audit
 * GET /api/email-diagnostics/audit
 */
export const runAudit = async (req, res) => {
  try {
    const domain = req.query.domain || EMAIL_DOMAIN;
    const results = await runSecurityAudit(domain);

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Security audit error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to run security audit',
      message: error.message,
    });
  }
};

/**
 * Run SMTP diagnostics
 * GET /api/email-diagnostics/smtp
 */
export const runSMTPDiagnostics = async (req, res) => {
  try {
    const results = await diagnoseSMTP({
      host: req.query.host || process.env.SMTP_HOST,
      port: parseInt(req.query.port, 10) || parseInt(process.env.SMTP_PORT, 10) || 587,
      secure: req.query.secure === 'true' || process.env.SMTP_SECURE === 'true',
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    });

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('SMTP diagnostics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to run SMTP diagnostics',
      message: error.message,
    });
  }
};

/**
 * Test mailbox receiving capability
 * GET /api/email-diagnostics/mailbox/:email
 */
export const testMailbox = async (req, res) => {
  try {
    const email = req.params.email || process.env.SMTP_USER;
    const results = await testMailboxReceiving(email);

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Mailbox test error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test mailbox',
      message: error.message,
    });
  }
};

/**
 * Check individual DNS records
 * GET /api/email-diagnostics/dns
 */
export const checkDNS = async (req, res) => {
  try {
    const domain = req.query.domain || EMAIL_DOMAIN;

    const [spf, dkim, dmarc, mx] = await Promise.all([
      validateSPF(domain),
      validateDKIM(domain),
      validateDMARC(domain),
      validateMX(domain),
    ]);

    const score = (spf.valid ? 25 : 0) + (dkim.valid ? 25 : 0) + (dmarc.valid ? 25 : 0) + (mx.valid ? 25 : 0);

    res.json({
      success: true,
      data: {
        domain,
        score,
        maxScore: 100,
        records: {
          spf,
          dkim,
          dmarc,
          mx,
        },
      },
    });
  } catch (error) {
    console.error('DNS check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check DNS records',
      message: error.message,
    });
  }
};

/**
 * Send test email
 * POST /api/email-diagnostics/test-send
 */
export const sendTestEmail = async (req, res) => {
  try {
    const { to } = req.body;

    if (!to) {
      return res.status(400).json({
        success: false,
        error: 'Recipient email address is required',
      });
    }

    const transport = createSecureTransport();

    // Verify connection first
    await transport.verify();

    // Send test email
    const result = await transport.sendMail({
      from: `"EmenTech Test" <${process.env.SMTP_USER || 'noreply@ementech.co.ke'}>`,
      to,
      subject: `Email Test - ${new Date().toISOString()}`,
      text: `This is a test email from EmenTech email diagnostics.\n\nSent at: ${new Date().toISOString()}\nFrom: ${process.env.SMTP_HOST}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #667eea;">📧 EmenTech Email Test</h2>
          <p>This is a test email from the EmenTech admin dashboard.</p>
          <table style="border-collapse: collapse; margin-top: 20px;">
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>Sent at:</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${new Date().toISOString()}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>SMTP Server:</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${process.env.SMTP_HOST}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>Requested by:</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${req.user?.email || 'Admin'}</td>
            </tr>
          </table>
        </div>
      `,
    });

    res.json({
      success: true,
      data: {
        messageId: result.messageId,
        response: result.response,
        recipient: to,
        sentAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Test email error:', error);

    // Provide detailed error information
    const errorInfo = {
      success: false,
      error: 'Failed to send test email',
      message: error.message,
      code: error.code,
      responseCode: error.responseCode,
      response: error.response,
    };

    // Add troubleshooting hints
    if (error.responseCode === 451) {
      errorInfo.hint = 'Server configuration problem - check Postfix virtual mailbox configuration';
    } else if (error.responseCode === 550) {
      errorInfo.hint = 'Recipient address rejected - mailbox may not exist';
    } else if (error.responseCode === 553) {
      errorInfo.hint = 'Sender address rejected - check SMTP authentication';
    } else if (error.code === 'ECONNREFUSED') {
      errorInfo.hint = 'Connection refused - check firewall and SMTP port';
    } else if (error.code === 'ETIMEDOUT') {
      errorInfo.hint = 'Connection timeout - check network connectivity';
    }

    res.status(500).json(errorInfo);
  }
};

/**
 * Get current email configuration (sanitized)
 * GET /api/email-diagnostics/config
 */
export const getConfig = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        smtp: {
          host: process.env.SMTP_HOST || 'mail.ementech.co.ke',
          port: parseInt(process.env.SMTP_PORT, 10) || 587,
          secure: process.env.SMTP_SECURE === 'true',
          user: process.env.SMTP_USER ? `${process.env.SMTP_USER.split('@')[0]}@***` : null,
          starttls: process.env.SMTP_SECURE !== 'true' && (parseInt(process.env.SMTP_PORT, 10) || 587) === 587,
        },
        imap: {
          host: process.env.IMAP_HOST || 'mail.ementech.co.ke',
          port: parseInt(process.env.IMAP_PORT, 10) || 993,
          tls: true,
        },
        domain: process.env.EMAIL_DOMAIN || 'ementech.co.ke',
        fromAddress: process.env.EMAIL_FROM || 'noreply@ementech.co.ke',
        fromName: process.env.EMAIL_FROM_NAME || 'EmenTech',
        dkim: {
          enabled: !!process.env.DKIM_PRIVATE_KEY,
          selector: process.env.DKIM_SELECTOR || 'default',
        },
        security: {
          tlsMinVersion: 'TLSv1.2',
          starttlsRequired: true,
          certificateValidation: process.env.NODE_ENV === 'production',
        },
      },
    });
  } catch (error) {
    console.error('Config retrieval error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve configuration',
      message: error.message,
    });
  }
};

export default {
  runAudit,
  runSMTPDiagnostics,
  testMailbox,
  checkDNS,
  sendTestEmail,
  getConfig,
};
