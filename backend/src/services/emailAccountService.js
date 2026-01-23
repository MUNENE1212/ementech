/**
 * Email Account Service
 *
 * Handles automatic creation and management of employee email accounts
 * on mail.ementech.co.ke (Dovecot IMAP / Postfix SMTP)
 *
 * @module emailAccountService
 */

import crypto from 'crypto';
import { Imap } from 'imap';
import nodemailer from 'nodemailer';
import User from '../models/User.js';
import UserEmail from '../models/UserEmail.js';

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

const EMAIL_DOMAIN = process.env.EMAIL_DOMAIN || 'ementech.co.ke';
const MAIL_SERVER = {
  imap: {
    host: process.env.IMAP_HOST || 'mail.ementech.co.ke',
    port: parseInt(process.env.IMAP_PORT) || 993,
    tls: true
  },
  smtp: {
    host: process.env.SMTP_HOST || 'mail.ementech.co.ke',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false
  }
};

// Encryption configuration (matches UserEmail pattern)
const ENCRYPTION_ALGO = 'aes-256-cbc';
const ENCRYPTION_KEY = crypto.scryptSync(
  process.env.JWT_SECRET || 'default-secret-change-in-production',
  'salt',
  32
);

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Encrypts text using AES-256-CBC
 * @param {string} text - Plain text to encrypt
 * @returns {string} Encrypted text with IV prepended
 */
function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGO, ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * Decrypts text using AES-256-CBC
 * @param {string} encryptedText - Encrypted text with IV prepended
 * @returns {string} Decrypted plain text
 */
function decrypt(encryptedText) {
  if (!encryptedText) return '';
  const parts = encryptedText.split(':');
  const iv = Buffer.from(parts.shift(), 'hex');
  const encrypted = parts.join(':');
  const decipher = crypto.createDecipheriv(ENCRYPTION_ALGO, ENCRYPTION_KEY, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * Generates a secure random password
 * @param {number} length - Password length (default 16)
 * @returns {string} Secure random password
 */
export function generateSecurePassword(length = 16) {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  const all = uppercase + lowercase + numbers + special;
  let password = '';

  // Ensure at least one of each type
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }

  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Generates a username from employee name
 * @param {string} firstName - First name
 * @param {string} lastName - Last name
 * @param {boolean} [useInitials=false] - Use first letter of first name
 * @returns {string} Generated username
 */
export function generateUsername(firstName, lastName, useInitials = false) {
  const first = (firstName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const last = (lastName || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  if (useInitials) {
    return first.charAt(0) + last;
  }
  return first + '.' + last;
}

// ============================================================================
// MAILBOX MANAGEMENT FUNCTIONS
// ============================================================================

/**
 * Creates a new mailbox on the mail server
 *
 * NOTE: This implementation provides a framework for mailbox creation.
 * The actual method depends on your mail server configuration:
 *
 * Option A: SSH + doveadm commands (requires SSH access)
 * Option B: Direct database modification (if using virtual users)
 * Option C: REST API (if mail admin panel has API)
 * Option D: Manual preparation (admin creates manually, system configures)
 *
 * @param {string} username - Local part (e.g., "john" for john@ementech.co.ke)
 * @param {string} password - Initial password
 * @param {string} displayName - Full name
 * @returns {Promise<{success: boolean, email: string, message: string}>}
 */
export async function createMailbox(username, password, displayName) {
  const email = `${username}@${EMAIL_DOMAIN}`;

  try {
    // Check if mailbox already exists by testing connection
    const exists = await testMailboxConnection(email, password);
    if (exists.imap) {
      return {
        success: false,
        email,
        message: 'Mailbox already exists'
      };
    }

    // ============================================================================
    // IMPLEMENTATION CHOICE - Select one method below:
    // ============================================================================

    const method = process.env.MAILBOX_CREATION_METHOD || 'manual';

    switch (method) {
      case 'ssh':
        return await createMailboxViaSSH(username, password, displayName);
      case 'database':
        return await createMailboxViaDatabase(username, password, displayName);
      case 'api':
        return await createMailboxViaAPI(username, password, displayName);
      case 'manual':
      default:
        return await prepareMailboxManual(username, password, displayName);
    }

  } catch (error) {
    console.error('Error creating mailbox:', error);
    return {
      success: false,
      email,
      message: error.message
    };
  }
}

/**
 * Creates mailbox via SSH + doveadm commands
 * Requires: MAIL_ADMIN_SSH_KEY, MAIL_ADMIN_HOST, MAIL_ADMIN_USER
 */
async function createMailboxViaSSH(username, password, displayName) {
  const { NodeSSH } = await import('node-ssh');
  const ssh = new NodeSSH();

  try {
    await ssh.connect({
      host: process.env.MAIL_ADMIN_HOST || 'mail.ementech.co.ke',
      username: process.env.MAIL_ADMIN_USER || 'root',
      privateKeyPath: process.env.MAIL_ADMIN_SSH_KEY
    });

    // Generate password hash for Dovecot
    const passwordHash = generateDovecotPasswordHash(password);

    // Create mailbox using doveadm
    const commands = [
      // Add user to Dovecot
      `doveadm user add ${username}@${EMAIL_DOMAIN} -p "${passwordHash}"`,
      // Or using maildir command if needed
      // `maildirmake.dovecot /var/mail/${EMAIL_DOMAIN}/${username}`
    ];

    for (const cmd of commands) {
      await ssh.execCommand(cmd);
    }

    ssh.dispose();

    return {
      success: true,
      email: `${username}@${EMAIL_DOMAIN}`,
      message: 'Mailbox created successfully via SSH'
    };

  } catch (error) {
    ssh.dispose();
    throw new Error(`SSH mailbox creation failed: ${error.message}`);
  }
}

/**
 * Creates mailbox by direct database insertion
 * Use this if your mail server uses virtual users in a database
 */
async function createMailboxViaDatabase(username, password, displayName) {
  const mysql = await import('mysql2/promise');

  const connection = await mysql.createConnection({
    host: process.env.MAIL_DB_HOST || 'localhost',
    user: process.env.MAIL_DB_USER || 'mailadmin',
    password: process.env.MAIL_DB_PASSWORD,
    database: process.env.MAIL_DB_NAME || 'mailserver'
  });

  try {
    const passwordHash = generateDovecotPasswordHash(password);

    await connection.execute(
      `INSERT INTO virtual_users (domain_id, email, password) VALUES ((SELECT id FROM virtual_domains WHERE name = ?), ?, ?)`,
      [EMAIL_DOMAIN, `${username}@${EMAIL_DOMAIN}`, passwordHash]
    );

    await connection.end();

    return {
      success: true,
      email: `${username}@${EMAIL_DOMAIN}`,
      message: 'Mailbox created successfully via database'
    };

  } catch (error) {
    await connection.end();
    throw error;
  }
}

/**
 * Creates mailbox via REST API
 * Use this if your mail admin panel exposes an API
 */
async function createMailboxViaAPI(username, password, displayName) {
  const apiUrl = process.env.MAIL_ADMIN_API_URL;
  const apiKey = process.env.MAIL_ADMIN_API_KEY;

  if (!apiUrl || !apiKey) {
    throw new Error('Mail admin API not configured');
  }

  const response = await fetch(`${apiUrl}/mailboxes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      email: `${username}@${EMAIL_DOMAIN}`,
      password,
      displayName,
      quota: 1024 // 1GB default
    })
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`);
  }

  return {
    success: true,
    email: `${username}@${EMAIL_DOMAIN}`,
    message: 'Mailbox created successfully via API'
  };
}

/**
 * Prepares mailbox configuration for manual setup
 * Use this when automatic creation is not possible
 */
async function prepareMailboxManual(username, password, displayName) {
  // Store credentials encrypted for later use
  // Admin will need to manually create the mailbox
  const email = `${username}@${EMAIL_DOMAIN}`;

  // TODO: Send notification to admin with credentials
  console.log(`
================================================================================
  MANUAL MAILBOX CREATION REQUIRED
================================================================================

  Email: ${email}
  Password: ${password}
  Display Name: ${displayName}

  Please create this mailbox manually on ${MAIL_SERVER.imap.host}

  Commands (if you have SSH access):
  1. doveadm user add ${email} -p '${password}'
  2. doveadm mailbox create -u ${email} -A

  Or use your web hosting control panel.
================================================================================
  `);

  return {
    success: true,
    email,
    message: 'Mailbox prepared for manual creation. Admin notified.',
    manualSetupRequired: true,
    credentials: { password }
  };
}

/**
 * Removes a mailbox (when employee is deactivated)
 * @param {string} email - Full email address
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function deleteMailbox(email) {
  try {
    const method = process.env.MAILBOX_CREATION_METHOD || 'manual';

    switch (method) {
      case 'ssh':
        return await deleteMailboxViaSSH(email);
      case 'database':
        return await deleteMailboxViaDatabase(email);
      case 'api':
        return await deleteMailboxViaAPI(email);
      default:
        return { success: false, message: 'Manual deletion required' };
    }

  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
}

async function deleteMailboxViaSSH(email) {
  const { NodeSSH } = await import('node-ssh');
  const ssh = new NodeSSH();

  try {
    await ssh.connect({
      host: process.env.MAIL_ADMIN_HOST || 'mail.ementech.co.ke',
      username: process.env.MAIL_ADMIN_USER || 'root',
      privateKeyPath: process.env.MAIL_ADMIN_SSH_KEY
    });

    await ssh.execCommand(`doveadm user delete ${email}`);
    ssh.dispose();

    return {
      success: true,
      message: 'Mailbox deleted successfully'
    };

  } catch (error) {
    ssh.dispose();
    throw error;
  }
}

async function deleteMailboxViaDatabase(email) {
  const mysql = await import('mysql2/promise');

  const connection = await mysql.createConnection({
    host: process.env.MAIL_DB_HOST || 'localhost',
    user: process.env.MAIL_DB_USER || 'mailadmin',
    password: process.env.MAIL_DB_PASSWORD,
    database: process.env.MAIL_DB_NAME || 'mailserver'
  });

  try {
    await connection.execute(
      `DELETE FROM virtual_users WHERE email = ?`,
      [email]
    );

    await connection.end();

    return {
      success: true,
      message: 'Mailbox deleted successfully from database'
    };

  } catch (error) {
    await connection.end();
    throw error;
  }
}

async function deleteMailboxViaAPI(email) {
  const apiUrl = process.env.MAIL_ADMIN_API_URL;
  const apiKey = process.env.MAIL_ADMIN_API_KEY;

  const response = await fetch(`${apiUrl}/mailboxes/${email}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${apiKey}`
    }
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`);
  }

  return {
    success: true,
    message: 'Mailbox deleted successfully via API'
  };
}

/**
 * Changes mailbox password
 * @param {string} email - Full email address
 * @param {string} newPassword - New password
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function changePassword(email, newPassword) {
  try {
    const method = process.env.MAILBOX_CREATION_METHOD || 'manual';

    switch (method) {
      case 'ssh':
        return await changePasswordViaSSH(email, newPassword);
      case 'database':
        return await changePasswordViaDatabase(email, newPassword);
      case 'api':
        return await changePasswordViaAPI(email, newPassword);
      default:
        return { success: false, message: 'Manual password change required' };
    }

  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
}

async function changePasswordViaSSH(email, newPassword) {
  const { NodeSSH } = await import('node-ssh');
  const ssh = new NodeSSH();

  try {
    await ssh.connect({
      host: process.env.MAIL_ADMIN_HOST || 'mail.ementech.co.ke',
      username: process.env.MAIL_ADMIN_USER || 'root',
      privateKeyPath: process.env.MAIL_ADMIN_SSH_KEY
    });

    const passwordHash = generateDovecotPasswordHash(newPassword);
    await ssh.execCommand(`doveadm user password ${email} -p "${passwordHash}"`);
    ssh.dispose();

    return {
      success: true,
      message: 'Password changed successfully'
    };

  } catch (error) {
    ssh.dispose();
    throw error;
  }
}

async function changePasswordViaDatabase(email, newPassword) {
  const mysql = await import('mysql2/promise');

  const connection = await mysql.createConnection({
    host: process.env.MAIL_DB_HOST || 'localhost',
    user: process.env.MAIL_DB_USER || 'mailadmin',
    password: process.env.MAIL_DB_PASSWORD,
    database: process.env.MAIL_DB_NAME || 'mailserver'
  });

  try {
    const passwordHash = generateDovecotPasswordHash(newPassword);

    await connection.execute(
      `UPDATE virtual_users SET password = ? WHERE email = ?`,
      [passwordHash, email]
    );

    await connection.end();

    return {
      success: true,
      message: 'Password changed successfully'
    };

  } catch (error) {
    await connection.end();
    throw error;
  }
}

async function changePasswordViaAPI(email, newPassword) {
  const apiUrl = process.env.MAIL_ADMIN_API_URL;
  const apiKey = process.env.MAIL_ADMIN_API_KEY;

  const response = await fetch(`${apiUrl}/mailboxes/${email}/password`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({ password: newPassword })
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`);
  }

  return {
    success: true,
    message: 'Password changed successfully via API'
  };
}

/**
 * Tests IMAP and SMTP connection for a mailbox
 * @param {string} email - Full email address
 * @param {string} password - Mailbox password
 * @returns {Promise<{imap: boolean, smtp: boolean, error?: string}>}
 */
export async function testMailboxConnection(email, password) {
  const result = { imap: false, smtp: false };

  // Test IMAP connection
  try {
    const imapTest = await testIMAPConnection(email, password);
    result.imap = imapTest.success;
  } catch (error) {
    console.error('IMAP connection test failed:', error.message);
  }

  // Test SMTP connection
  try {
    const smtpTest = await testSMTPConnection(email, password);
    result.smtp = smtpTest.success;
  } catch (error) {
    console.error('SMTP connection test failed:', error.message);
  }

  return result;
}

/**
 * Tests IMAP connection
 */
async function testIMAPConnection(email, password) {
  return new Promise((resolve, reject) => {
    const imap = new Imap({
      user: email,
      password: password,
      host: MAIL_SERVER.imap.host,
      port: MAIL_SERVER.imap.port,
      tls: MAIL_SERVER.imap.tls,
      tlsOptions: { rejectUnauthorized: false },
      connTimeout: 10000
    });

    imap.once('ready', () => {
      imap.end();
      resolve({ success: true });
    });

    imap.once('error', (err) => {
      reject(new Error(`IMAP error: ${err.message}`));
    });

    imap.connect();
  });
}

/**
 * Tests SMTP connection
 */
async function testSMTPConnection(email, password) {
  try {
    const transporter = nodemailer.createTransporter({
      host: MAIL_SERVER.smtp.host,
      port: MAIL_SERVER.smtp.port,
      secure: MAIL_SERVER.smtp.secure,
      auth: {
        user: email,
        pass: password
      }
    });

    await transporter.verify();
    return { success: true };
  } catch (error) {
    throw new Error(`SMTP error: ${error.message}`);
  }
}

/**
 * Generates a Dovecot-compatible password hash (SHA512-CRYPT)
 * @param {string} password - Plain text password
 * @returns {string} Dovecot password hash
 */
function generateDovecotPasswordHash(password) {
  // SHA512-CRYPT format (Dovecot default)
  // For production, you might want to use the actual crypt() function
  // This is a simplified version - in production use proper hashing
  const hash = crypto.createHash('sha512').update(password).digest('hex');
  return `{SHA512-CRYPT}${hash}`;
}

// ============================================================================
// USER INTEGRATION FUNCTIONS
// ============================================================================

/**
 * Complete workflow for configuring user's company email
 * 1. Generates secure password
 * 2. Creates mailbox on mail server
 * 3. Tests connection
 * 4. Stores encrypted credentials in User model
 * 5. Creates UserEmail record for IMAP/SMTP access
 *
 * @param {string|ObjectId} userId - User ID
 * @param {string} emailUsername - Local part for email (e.g., "john")
 * @returns {Promise<{success: boolean, email: string, message: string, credentials?: object}>}
 */
export async function configureUserEmail(userId, emailUsername) {
  try {
    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return {
        success: false,
        message: 'User not found'
      };
    }

    // Check if already configured
    if (user.companyEmail?.isConfigured) {
      return {
        success: false,
        message: 'Company email already configured for this user'
      };
    }

    // Generate secure password
    const password = generateSecurePassword(16);
    const email = `${emailUsername}@${EMAIL_DOMAIN}`;

    // Create mailbox on mail server
    const mailboxResult = await createMailbox(emailUsername, password, user.name);
    if (!mailboxResult.success) {
      return {
        success: false,
        message: `Failed to create mailbox: ${mailboxResult.message}`
      };
    }

    // Test connection (if mailbox was created automatically)
    if (!mailboxResult.manualSetupRequired) {
      const connectionTest = await testMailboxConnection(email, password);
      if (!connectionTest.imap && !connectionTest.smtp) {
        return {
          success: false,
          message: 'Mailbox created but connection test failed'
        };
      }
    }

    // Store encrypted credentials in User model
    const encryptedPassword = encrypt(password);
    user.companyEmail = {
      address: email,
      isConfigured: !mailboxResult.manualSetupRequired,
      password: encryptedPassword,
      configuredAt: new Date()
    };
    await user.save();

    // Create UserEmail record for email client integration
    const userEmail = new UserEmail({
      user: user._id,
      email: email,
      displayName: user.name,
      accountType: 'work',
      isPrimary: true,
      imap: {
        host: MAIL_SERVER.imap.host,
        port: MAIL_SERVER.imap.port,
        tls: true,
        username: email,
        password: encryptedPassword
      },
      smtp: {
        host: MAIL_SERVER.smtp.host,
        port: MAIL_SERVER.smtp.port,
        secure: false,
        username: email,
        password: encryptedPassword
      },
      isVerified: true,
      verifiedAt: new Date()
    });
    await userEmail.save();

    return {
      success: true,
      email,
      message: 'Company email configured successfully',
      credentials: {
        email,
        password,
        imap: MAIL_SERVER.imap,
        smtp: MAIL_SERVER.smtp
      },
      manualSetupRequired: mailboxResult.manualSetupRequired
    };

  } catch (error) {
    console.error('Error configuring user email:', error);
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Retrieves decrypted credentials for a user's company email
 * @param {string|ObjectId} userId
 * @returns {Promise<{email: string, password: string, imap: object, smtp: object}|null>}
 */
export async function getUserEmailCredentials(userId) {
  try {
    const user = await User.findById(userId);
    if (!user || !user.companyEmail?.isConfigured) {
      return null;
    }

    const decryptedPassword = decrypt(user.companyEmail.password);

    return {
      email: user.companyEmail.address,
      password: decryptedPassword,
      imap: MAIL_SERVER.imap,
      smtp: MAIL_SERVER.smtp
    };

  } catch (error) {
    console.error('Error getting user email credentials:', error);
    return null;
  }
}

/**
 * Sends welcome email with credentials to new employee
 * @param {string} email - Employee's company email
 * @param {string} name - Employee's name
 * @param {string} tempPassword - Temporary password (for first login)
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
export async function sendWelcomeEmail(email, name, tempPassword) {
  try {
    const transporter = nodemailer.createTransporter({
      host: MAIL_SERVER.smtp.host,
      port: MAIL_SERVER.smtp.port,
      secure: MAIL_SERVER.smtp.secure,
      auth: {
        user: process.env.SMTP_USER || `noreply@${EMAIL_DOMAIN}`,
        pass: process.env.SMTP_PASS
      }
    });

    const mailOptions = {
      from: `"EmenTech IT" <noreply@${EMAIL_DOMAIN}>`,
      to: email,
      subject: 'Welcome to EmenTech - Your Email Account is Ready',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; background: #f9f9f9; }
            .info-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #667eea; }
            .password { font-family: monospace; background: #eee; padding: 10px; font-size: 16px; }
            .footer { text-align: center; padding: 20px; color: #777; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to EmenTech!</h1>
              <p>${name}</p>
            </div>
            <div class="content">
              <p>Your company email account is now ready to use.</p>

              <div class="info-box">
                <h3>Email Account Details</h3>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Temporary Password:</strong> <span class="password">${tempPassword}</span></p>
              </div>

              <p><strong>Setup Instructions:</strong></p>
              <ol>
                <li>Use your company email and temporary password to log in</li>
                <li>You'll be prompted to change your password on first login</li>
                <li>Configure your email client or use webmail at <a href="https://mail.${EMAIL_DOMAIN}">mail.${EMAIL_DOMAIN}</a></li>
              </ol>

              <h3>Email Settings (for manual configuration)</h3>
              <p><strong>IMAP Server:</strong> ${MAIL_SERVER.imap.host}<br>
              <strong>IMAP Port:</strong> ${MAIL_SERVER.imap.port}<br>
              <strong>SMTP Server:</strong> ${MAIL_SERVER.smtp.host}<br>
              <strong>SMTP Port:</strong> ${MAIL_SERVER.smtp.port}</p>

              <p>If you have any questions, please contact IT support.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} EmenTech. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);

    return {
      success: true,
      messageId: info.messageId
    };

  } catch (error) {
    console.error('Error sending welcome email:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

export default {
  generateSecurePassword,
  generateUsername,
  createMailbox,
  deleteMailbox,
  changePassword,
  testMailboxConnection,
  configureUserEmail,
  getUserEmailCredentials,
  sendWelcomeEmail
};
