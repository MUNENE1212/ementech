import EmailTemplate from '../models/EmailTemplate.js';

/**
 * Email Renderer Utility
 *
 * Handles rendering of email templates with variable substitution
 * and email formatting for delivery
 *
 * @version 1.0.0
 * @since 2026-01-23
 */

/**
 * Render an email template with provided data
 *
 * @param {ObjectId|string} templateId - The template ID to render
 * @param {Object} data - Variable data for substitution
 * @param {Object} [options] - Rendering options
 * @returns {Promise<Object>} Rendered email with subject, body, etc.
 *
 * @example
 * const rendered = await renderEmail(templateId, { firstName: 'John', company: 'Acme' });
 * // Returns: { subject: '...', htmlBody: '...', textBody: '...' }
 */
export const renderEmail = async (templateId, data = {}, options = {}) => {
  try {
    const template = await EmailTemplate.findById(templateId);

    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    // Validate required variables
    const validation = template.validateVariables(data);
    if (!validation.valid) {
      throw new Error(`Missing required variables: ${validation.missing.join(', ')}`);
    }

    // Render the template
    return template.render(data, options.format || 'html');

  } catch (error) {
    console.error('Error rendering email:', error);
    throw error;
  }
};

/**
 * Render template preview with sample data
 *
 * @param {ObjectId|string} templateId - The template ID
 * @returns {Promise<Object>} Rendered preview
 */
export const renderPreview = async (templateId) => {
  const sampleData = {
    firstName: 'John',
    lastName: 'Doe',
    name: 'John Doe',
    email: 'john.doe@example.com',
    company: 'Example Company',
    jobTitle: 'Software Engineer',
    phone: '+1234567890',
    // Add more sample fields as needed
  };

  return renderEmail(templateId, sampleData);
};

/**
 * Validate that all required variables are present
 *
 * @param {ObjectId|string} templateId - The template ID
 * @param {Object} data - Data to validate
 * @returns {Object} Validation result
 */
export const validateTemplateVariables = async (templateId, data) => {
  const template = await EmailTemplate.findById(templateId);

  if (!template) {
    throw new Error(`Template ${templateId} not found`);
  }

  return template.validateVariables(data);
};

/**
 * Get all variables used in a template
 *
 * @param {ObjectId|string} templateId - The template ID
 * @returns {Promise<Array>} Array of variable definitions
 */
export const getTemplateVariables = async (templateId) => {
  const template = await EmailTemplate.findById(templateId);

  if (!template) {
    throw new Error(`Template ${templateId} not found`);
  }

  return template.variables || [];
};

/**
 * Create a plaintext version from HTML
 *
 * @param {string} html - HTML content
 * @returns {string} Plain text version
 */
export const htmlToPlainText = (html) => {
  let text = html;

  // Remove HTML tags
  text = text.replace(/<[^>]+>/g, '');

  // Decode HTML entities
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");

  // Clean up whitespace
  text = text.replace(/\s+/g, ' ');
  text = text.trim();

  return text;
};

/**
 * Prepare email data for sending through nodemailer
 *
 * @param {Object} options - Email options
 * @returns {Object} Prepared email object
 */
export const prepareEmailOptions = (options = {}) => {
  const {
    to,
    from = 'EmenTech <noreply@ementech.co.ke>',
    subject,
    html,
    text,
    replyTo,
    attachments = [],
    headers = {},
  } = options;

  if (!to) {
    throw new Error('Recipient (to) is required');
  }

  if (!subject) {
    throw new Error('Subject is required');
  }

  if (!html && !text) {
    throw new Error('Either html or text body is required');
  }

  const email = {
    to: Array.isArray(to) ? to.join(', ') : to,
    from,
    subject,
    headers,
  };

  if (html) {
    email.html = html;
  }

  if (text) {
    email.text = text;
  } else if (html) {
    email.text = htmlToPlainText(html);
  }

  if (replyTo) {
    email.replyTo = replyTo;
  }

  if (attachments.length > 0) {
    email.attachments = attachments;
  }

  // Add tracking headers
  email.headers['X-Mailer'] = 'EmenTech Marketing Platform';
  email.headers['X-Priority'] = options.priority || '3';

  return email;
};

/**
 * Get unsubscribe URL for a lead
 *
 * @param {string} leadId - The lead ID
 * @param {string} [sequenceId] - Optional sequence ID
 * @returns {string} Unsubscribe URL
 */
export const getUnsubscribeUrl = (leadId, sequenceId = null) => {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  let url = `${baseUrl}/unsubscribe/${leadId}`;

  if (sequenceId) {
    url += `?sequence=${sequenceId}`;
  }

  return url;
};

/**
 * Get tracking pixel URL for email open tracking
 *
 * @param {string} emailId - Unique email identifier
 * @returns {string} Tracking pixel URL
 */
export const getTrackingPixelUrl = (emailId) => {
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:5001';
  return `${backendUrl}/api/track/open/${emailId}`;
};

/**
 * Get link tracking URL
 *
 * @param {string} emailId - Unique email identifier
 * @param {string} url - The original URL to track
 * @returns {string} Tracking URL
 */
export const getLinkTrackingUrl = (emailId, url) => {
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:5001';
  return `${backendUrl}/api/track/click/${emailId}?url=${encodeURIComponent(url)}`;
};

/**
 * Inject tracking into HTML email
 *
 * @param {string} html - The HTML email body
 * @param {string} emailId - Unique email identifier
 * @returns {string} HTML with tracking injected
 */
export const injectTracking = (html, emailId) => {
  let trackedHtml = html;

  // Add open tracking pixel (1x1 transparent image)
  const pixelUrl = getTrackingPixelUrl(emailId);
  const pixel = `<img src="${pixelUrl}" width="1" height="1" style="display:none;" alt="">`;

  // Inject before closing body tag or at end
  if (trackedHtml.includes('</body>')) {
    trackedHtml = trackedHtml.replace('</body>', `${pixel}</body>`);
  } else {
    trackedHtml += pixel;
  }

  // Add link tracking to all href attributes
  trackedHtml = trackedHtml.replace(
    /href=["'](https?:\/\/[^"']+)["']/gi,
    (match, url) => {
      // Skip unsubscribe links
      if (url.includes('/unsubscribe')) {
        return match;
      }
      const trackingUrl = getLinkTrackingUrl(emailId, url);
      return `href="${trackingUrl}"`;
    }
  );

  return trackedHtml;
};

export default {
  renderEmail,
  renderPreview,
  validateTemplateVariables,
  getTemplateVariables,
  htmlToPlainText,
  prepareEmailOptions,
  getUnsubscribeUrl,
  getTrackingPixelUrl,
  getLinkTrackingUrl,
  injectTracking,
};
