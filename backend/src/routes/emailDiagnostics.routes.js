/**
 * Email Diagnostics Routes
 *
 * Admin-only routes for email system diagnostics and security audits.
 *
 * @module emailDiagnosticsRoutes
 */

import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  runAudit,
  runSMTPDiagnostics,
  testMailbox,
  checkDNS,
  sendTestEmail,
  getConfig,
} from '../controllers/emailDiagnosticsController.js';

const router = express.Router();

// All routes require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

/**
 * @route   GET /api/email-diagnostics/config
 * @desc    Get current email configuration (sanitized)
 * @access  Admin
 */
router.get('/config', getConfig);

/**
 * @route   GET /api/email-diagnostics/audit
 * @desc    Run full security audit (SPF, DKIM, DMARC, MX)
 * @access  Admin
 * @query   {string} domain - Domain to audit (optional, defaults to EMAIL_DOMAIN)
 */
router.get('/audit', runAudit);

/**
 * @route   GET /api/email-diagnostics/smtp
 * @desc    Run SMTP connection diagnostics
 * @access  Admin
 * @query   {string} host - SMTP host (optional)
 * @query   {number} port - SMTP port (optional)
 * @query   {boolean} secure - Use implicit TLS (optional)
 */
router.get('/smtp', runSMTPDiagnostics);

/**
 * @route   GET /api/email-diagnostics/dns
 * @desc    Check DNS records (SPF, DKIM, DMARC, MX)
 * @access  Admin
 * @query   {string} domain - Domain to check (optional)
 */
router.get('/dns', checkDNS);

/**
 * @route   GET /api/email-diagnostics/mailbox/:email
 * @desc    Test mailbox receiving capability
 * @access  Admin
 * @param   {string} email - Email address to test
 */
router.get('/mailbox/:email', testMailbox);

/**
 * @route   POST /api/email-diagnostics/test-send
 * @desc    Send a test email
 * @access  Admin
 * @body    {string} to - Recipient email address
 */
router.post('/test-send', sendTestEmail);

export default router;
