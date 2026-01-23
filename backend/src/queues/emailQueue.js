import Bull from 'bull';
import nodemailer from 'nodemailer';
import Campaign from '../models/Campaign.js';
import EmailTemplate from '../models/EmailTemplate.js';
import Lead from '../models/Lead.js';

/**
 * Email Queue Module - Phase 3: Email Marketing & Campaigns
 *
 * Bull queue setup for handling bulk email operations with:
 * - Job types: send-campaign, send-single, send-batch
 * - Progress tracking for real-time updates
 * - Retry configuration with exponential backoff
 * - Rate limiting support
 * - Job completion and failure handlers
 * - Integration with nodemailer for actual sending
 *
 * @version 1.0.0
 * @since 2026-01-23
 */

// ============================================================================
// REDIS & QUEUE CONFIGURATION
// ============================================================================

/**
 * Redis connection configuration
 * Falls back to localhost if REDIS_URL not provided
 */
const redisConfig = {
  redis: process.env.REDIS_URL || {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB, 10) || 0,
  },
};

/**
 * Default queue options for all queues
 */
const defaultQueueOptions = {
  ...redisConfig,
  defaultJobOptions: {
    removeOnComplete: {
      age: 24 * 3600, // Keep completed jobs for 24 hours
      count: 1000,    // Keep last 1000 completed jobs
    },
    removeOnFail: {
      age: 7 * 24 * 3600, // Keep failed jobs for 7 days
    },
  },
  settings: {
    lockDuration: 300000,    // 5 minutes lock for long-running jobs
    stalledInterval: 60000,  // Check for stalled jobs every minute
    maxStalledCount: 3,      // Retry stalled jobs up to 3 times
  },
};

// ============================================================================
// QUEUE INITIALIZATION
// ============================================================================

/**
 * Main email queue for all email operations
 */
const emailQueue = new Bull('email-queue', defaultQueueOptions);

/**
 * High-priority queue for transactional/urgent emails
 */
const priorityEmailQueue = new Bull('priority-email-queue', {
  ...defaultQueueOptions,
  limiter: {
    max: 100,        // Max 100 jobs per duration
    duration: 1000,  // Per second (100 emails/second for priority)
  },
});

// ============================================================================
// NODEMAILER TRANSPORT CONFIGURATION
// ============================================================================

/**
 * Create nodemailer transport with pool for efficiency
 */
const createTransport = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'mail.ementech.co.ke',
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    pool: true,           // Use pooled connections
    maxConnections: 5,    // Max 5 simultaneous connections
    maxMessages: 100,     // Max messages per connection before reconnecting
    rateDelta: 1000,      // Check rate limit every second
    rateLimit: 10,        // Max 10 messages per second
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === 'production',
    },
  });
};

let transporter = createTransport();

/**
 * Verify and refresh transporter connection
 */
const verifyTransport = async () => {
  try {
    await transporter.verify();
    return true;
  } catch (error) {
    console.error('Email transport verification failed:', error.message);
    // Recreate transporter on failure
    transporter = createTransport();
    return false;
  }
};

// ============================================================================
// JOB TYPE DEFINITIONS
// ============================================================================

/**
 * Job type constants
 */
export const JOB_TYPES = {
  SEND_CAMPAIGN: 'send-campaign',
  SEND_SINGLE: 'send-single',
  SEND_BATCH: 'send-batch',
  SEND_TRANSACTIONAL: 'send-transactional',
  PROCESS_BOUNCE: 'process-bounce',
  PROCESS_OPEN: 'process-open',
  PROCESS_CLICK: 'process-click',
};

/**
 * Retry configuration with exponential backoff
 */
const retryConfig = {
  attempts: 5,
  backoff: {
    type: 'exponential',
    delay: 2000, // Start with 2 seconds, then 4s, 8s, 16s, 32s
  },
};

// ============================================================================
// JOB PROCESSORS
// ============================================================================

/**
 * Process send-campaign job
 * Sends emails to all recipients in a campaign
 *
 * @param {Object} job - Bull job object
 * @returns {Promise<Object>} Job result
 */
const processCampaignJob = async (job) => {
  const { campaignId, userId } = job.data;
  const startTime = Date.now();

  try {
    // Load campaign with template
    const campaign = await Campaign.findById(campaignId).populate('template');
    if (!campaign) {
      throw new Error(`Campaign ${campaignId} not found`);
    }

    if (campaign.status !== 'scheduled') {
      throw new Error(`Campaign ${campaignId} is not in scheduled status`);
    }

    // Mark campaign as sending
    campaign.markAsSending();
    campaign.queueJobId = job.id;
    await campaign.save();

    // Build recipient list
    const recipientQuery = campaign.buildAudienceQuery();
    const recipients = await Lead.find(recipientQuery)
      .select('email name firstName lastName tags pipelineStage')
      .lean();

    const totalRecipients = recipients.length;
    campaign.metrics.totalRecipients = totalRecipients;
    await campaign.save();

    if (totalRecipients === 0) {
      campaign.markAsSent();
      await campaign.save();
      return { success: true, sent: 0, message: 'No recipients found' };
    }

    // Process in batches
    const batchSize = campaign.batchSize || 100;
    const batchDelay = campaign.batchDelay || 1000;
    let sentCount = 0;
    let failedCount = 0;
    const errors = [];

    for (let i = 0; i < recipients.length; i += batchSize) {
      // Check if campaign was paused/cancelled
      const currentCampaign = await Campaign.findById(campaignId);
      if (currentCampaign.status === 'paused' || currentCampaign.status === 'cancelled') {
        return {
          success: false,
          sent: sentCount,
          failed: failedCount,
          message: `Campaign ${currentCampaign.status}`,
        };
      }

      const batch = recipients.slice(i, i + batchSize);

      // Add batch jobs to queue
      const batchJobs = batch.map(recipient => ({
        name: JOB_TYPES.SEND_SINGLE,
        data: {
          campaignId,
          recipient,
          template: campaign.template.toObject(),
          sender: campaign.sender,
          subject: campaign.subject || campaign.template.subject,
          preheader: campaign.preheader || campaign.template.preheader,
        },
        opts: {
          ...retryConfig,
          priority: campaign.priority === 'urgent' ? 1 : (campaign.priority === 'high' ? 2 : 3),
        },
      }));

      // Process batch
      await emailQueue.addBulk(batchJobs);

      // Update progress
      const progress = Math.round(((i + batch.length) / totalRecipients) * 100);
      await job.progress(progress);
      campaign.processingProgress = progress;
      await campaign.save();

      // Wait between batches to respect rate limits
      if (i + batchSize < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, batchDelay));
      }
    }

    // Mark campaign as sent
    campaign.markAsSent();
    campaign.schedule.lastSentAt = new Date();

    // For recurring campaigns, calculate next send time
    if (campaign.type === 'recurring') {
      campaign.schedule.sendsCompleted = (campaign.schedule.sendsCompleted || 0) + 1;
      campaign.schedule.nextSendAt = calculateNextSendTime(campaign.schedule);
      if (campaign.schedule.nextSendAt) {
        campaign.status = 'scheduled';
      }
    }

    await campaign.save();

    // Update template metrics
    await EmailTemplate.findByIdAndUpdate(campaign.template._id, {
      $inc: { 'metrics.totalSent': sentCount },
      $set: { 'metrics.lastUpdated': new Date() },
    });

    const duration = Date.now() - startTime;
    return {
      success: true,
      campaignId,
      sent: sentCount,
      failed: failedCount,
      total: totalRecipients,
      duration,
      errors: errors.slice(0, 10), // Only return first 10 errors
    };

  } catch (error) {
    // Mark campaign as failed
    const campaign = await Campaign.findById(campaignId);
    if (campaign) {
      campaign.markAsFailed(error.message);
      await campaign.save();
    }
    throw error;
  }
};

/**
 * Process send-single job
 * Sends a single email to one recipient
 *
 * @param {Object} job - Bull job object
 * @returns {Promise<Object>} Job result
 */
const processSingleEmailJob = async (job) => {
  const { campaignId, recipient, template, sender, subject, preheader } = job.data;

  try {
    // Build personalized email
    const templateInstance = new EmailTemplate(template);
    const personalizationData = buildPersonalizationData(recipient);

    const rendered = templateInstance.render(personalizationData, 'html');

    // Prepare email options
    const mailOptions = {
      from: `"${sender.name}" <${sender.email}>`,
      to: recipient.email,
      subject: rendered.subject || subject,
      html: rendered.body,
      text: templateInstance.render(personalizationData, 'text').body,
      headers: {
        'X-Campaign-ID': campaignId,
        'X-Lead-ID': recipient._id,
        'List-Unsubscribe': `<mailto:unsubscribe@ementech.co.ke?subject=Unsubscribe&body=${recipient._id}>`,
      },
    };

    if (preheader || rendered.preheader) {
      // Inject preheader as hidden text in HTML
      const preheaderText = preheader || rendered.preheader;
      mailOptions.html = injectPreheader(mailOptions.html, preheaderText);
    }

    // Send email
    const result = await transporter.sendMail(mailOptions);

    // Update campaign metrics
    if (campaignId) {
      await Campaign.findByIdAndUpdate(campaignId, {
        $inc: {
          'metrics.sent': 1,
          'metrics.delivered': 1,
        },
        $set: { 'metrics.lastUpdated': new Date() },
      });
    }

    return {
      success: true,
      messageId: result.messageId,
      recipient: recipient.email,
      response: result.response,
    };

  } catch (error) {
    // Update campaign failure metrics
    if (campaignId) {
      await Campaign.findByIdAndUpdate(campaignId, {
        $inc: {
          'metrics.sent': 1,
          'metrics.failed': 1,
          'metrics.softBounces': error.responseCode >= 400 && error.responseCode < 500 ? 1 : 0,
          'metrics.hardBounces': error.responseCode >= 500 ? 1 : 0,
        },
        $set: { 'metrics.lastUpdated': new Date() },
      });
    }

    throw error;
  }
};

/**
 * Process send-batch job
 * Sends emails to a batch of recipients
 *
 * @param {Object} job - Bull job object
 * @returns {Promise<Object>} Job result
 */
const processBatchJob = async (job) => {
  const { recipients, template, sender, subject, preheader, campaignId } = job.data;
  const results = {
    success: 0,
    failed: 0,
    errors: [],
  };

  for (let i = 0; i < recipients.length; i++) {
    const recipient = recipients[i];

    try {
      // Add individual job to queue
      await emailQueue.add(JOB_TYPES.SEND_SINGLE, {
        campaignId,
        recipient,
        template,
        sender,
        subject,
        preheader,
      }, retryConfig);

      results.success++;
    } catch (error) {
      results.failed++;
      results.errors.push({
        email: recipient.email,
        error: error.message,
      });
    }

    // Update progress
    await job.progress(Math.round(((i + 1) / recipients.length) * 100));
  }

  return results;
};

/**
 * Process transactional email job
 * High priority, single recipient emails (password reset, receipts, etc.)
 *
 * @param {Object} job - Bull job object
 * @returns {Promise<Object>} Job result
 */
const processTransactionalJob = async (job) => {
  const { to, from, subject, html, text, templateId, variables } = job.data;

  try {
    let htmlBody = html;
    let textBody = text;

    // If template specified, render it
    if (templateId) {
      const template = await EmailTemplate.findById(templateId);
      if (template) {
        const rendered = template.render(variables || {}, 'html');
        htmlBody = rendered.body;
        textBody = template.render(variables || {}, 'text').body;
      }
    }

    const mailOptions = {
      from: from || `"EmenTech" <noreply@ementech.co.ke>`,
      to,
      subject,
      html: htmlBody,
      text: textBody,
    };

    const result = await transporter.sendMail(mailOptions);

    return {
      success: true,
      messageId: result.messageId,
      response: result.response,
    };

  } catch (error) {
    throw error;
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Build personalization data from recipient
 *
 * @param {Object} recipient - Lead object
 * @returns {Object} Personalization data
 */
const buildPersonalizationData = (recipient) => {
  return {
    email: recipient.email,
    name: recipient.name || recipient.email.split('@')[0],
    firstName: recipient.firstName || recipient.name?.split(' ')[0] || '',
    lastName: recipient.lastName || recipient.name?.split(' ').slice(1).join(' ') || '',
    fullName: recipient.name || '',
    company: recipient.company || '',
    title: recipient.title || '',
    phone: recipient.phone || '',
    // Add more personalization fields as needed
    currentDate: new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
    currentYear: new Date().getFullYear(),
    unsubscribeLink: `${process.env.FRONTEND_URL || 'https://ementech.co.ke'}/unsubscribe?id=${recipient._id}`,
  };
};

/**
 * Inject preheader text into HTML email
 *
 * @param {string} html - HTML content
 * @param {string} preheader - Preheader text
 * @returns {string} Modified HTML
 */
const injectPreheader = (html, preheader) => {
  const preheaderHtml = `
    <div style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
      ${preheader}
      ${'&nbsp;'.repeat(50)}
    </div>
  `;

  // Insert after <body> tag or at the beginning
  if (html.includes('<body')) {
    return html.replace(/(<body[^>]*>)/i, `$1${preheaderHtml}`);
  }
  return preheaderHtml + html;
};

/**
 * Calculate next send time for recurring campaigns
 *
 * @param {Object} schedule - Schedule configuration
 * @returns {Date|null} Next send time
 */
const calculateNextSendTime = (schedule) => {
  if (!schedule.frequency) return null;

  const lastSent = schedule.lastSentAt || new Date();
  const [hours, minutes] = (schedule.sendTime || '09:00').split(':').map(Number);
  let nextSend = new Date(lastSent);
  nextSend.setHours(hours, minutes, 0, 0);

  switch (schedule.frequency) {
    case 'daily':
      nextSend.setDate(nextSend.getDate() + 1);
      break;
    case 'weekly':
      nextSend.setDate(nextSend.getDate() + 7);
      break;
    case 'biweekly':
      nextSend.setDate(nextSend.getDate() + 14);
      break;
    case 'monthly':
      nextSend.setMonth(nextSend.getMonth() + 1);
      if (schedule.dayOfMonth) {
        if (schedule.dayOfMonth === -1) {
          // Last day of month
          nextSend = new Date(nextSend.getFullYear(), nextSend.getMonth() + 1, 0);
        } else {
          nextSend.setDate(schedule.dayOfMonth);
        }
      }
      break;
    case 'quarterly':
      nextSend.setMonth(nextSend.getMonth() + 3);
      break;
    case 'yearly':
      nextSend.setFullYear(nextSend.getFullYear() + 1);
      break;
    default:
      return null;
  }

  // Check against end date
  if (schedule.endDate && nextSend > new Date(schedule.endDate)) {
    return null;
  }

  // Check against max sends
  if (schedule.maxSends && schedule.sendsCompleted >= schedule.maxSends) {
    return null;
  }

  return nextSend;
};

// ============================================================================
// QUEUE EVENT HANDLERS
// ============================================================================

/**
 * Register queue event handlers
 */
const registerEventHandlers = (queue, name = 'email') => {
  queue.on('completed', (job, result) => {
    console.log(`[${name}] Job ${job.id} completed:`, result?.success ? 'Success' : 'Failed');

    // Emit Socket.IO event for real-time updates
    if (global.io && job.data.campaignId) {
      global.io.emit('campaign:job-completed', {
        jobId: job.id,
        campaignId: job.data.campaignId,
        result,
      });
    }
  });

  queue.on('failed', (job, err) => {
    console.error(`[${name}] Job ${job.id} failed:`, err.message);

    // Emit Socket.IO event
    if (global.io && job.data.campaignId) {
      global.io.emit('campaign:job-failed', {
        jobId: job.id,
        campaignId: job.data.campaignId,
        error: err.message,
        attemptsMade: job.attemptsMade,
        attemptsRemaining: retryConfig.attempts - job.attemptsMade,
      });
    }
  });

  queue.on('progress', (job, progress) => {
    // Emit Socket.IO event for progress updates
    if (global.io && job.data.campaignId) {
      global.io.emit('campaign:progress', {
        jobId: job.id,
        campaignId: job.data.campaignId,
        progress,
      });
    }
  });

  queue.on('stalled', (job) => {
    console.warn(`[${name}] Job ${job.id} stalled`);
  });

  queue.on('error', (error) => {
    console.error(`[${name}] Queue error:`, error.message);
  });
};

// Register handlers for both queues
registerEventHandlers(emailQueue, 'email');
registerEventHandlers(priorityEmailQueue, 'priority-email');

// ============================================================================
// QUEUE PROCESSORS
// ============================================================================

/**
 * Process jobs based on type
 */
emailQueue.process(JOB_TYPES.SEND_CAMPAIGN, 2, processCampaignJob);
emailQueue.process(JOB_TYPES.SEND_SINGLE, 10, processSingleEmailJob);
emailQueue.process(JOB_TYPES.SEND_BATCH, 5, processBatchJob);

// Priority queue for transactional emails
priorityEmailQueue.process(JOB_TYPES.SEND_TRANSACTIONAL, 10, processTransactionalJob);

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Add a campaign to the email queue
 *
 * @param {string} campaignId - Campaign ID
 * @param {string} userId - User ID who triggered the send
 * @param {Object} options - Job options
 * @returns {Promise<Object>} Created job
 *
 * @example
 * const job = await addCampaignJob('507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012');
 */
export const addCampaignJob = async (campaignId, userId, options = {}) => {
  const job = await emailQueue.add(JOB_TYPES.SEND_CAMPAIGN, {
    campaignId,
    userId,
  }, {
    ...retryConfig,
    priority: options.priority || 2,
    delay: options.delay || 0,
    jobId: options.jobId || `campaign-${campaignId}-${Date.now()}`,
  });

  return {
    jobId: job.id,
    campaignId,
    status: 'queued',
  };
};

/**
 * Add a single email to the queue
 *
 * @param {Object} emailData - Email data
 * @returns {Promise<Object>} Created job
 *
 * @example
 * const job = await addSingleEmailJob({
 *   to: 'user@example.com',
 *   subject: 'Hello',
 *   html: '<p>Hello!</p>',
 * });
 */
export const addSingleEmailJob = async (emailData) => {
  const job = await emailQueue.add(JOB_TYPES.SEND_SINGLE, emailData, retryConfig);
  return { jobId: job.id };
};

/**
 * Add a batch of emails to the queue
 *
 * @param {Array} recipients - Array of recipient objects
 * @param {Object} emailConfig - Email configuration (template, sender, subject)
 * @returns {Promise<Object>} Created job
 */
export const addBatchEmailJob = async (recipients, emailConfig) => {
  const job = await emailQueue.add(JOB_TYPES.SEND_BATCH, {
    recipients,
    ...emailConfig,
  }, {
    ...retryConfig,
    priority: emailConfig.priority || 3,
  });

  return { jobId: job.id, recipientCount: recipients.length };
};

/**
 * Add a transactional email (high priority)
 *
 * @param {Object} emailData - Email data (to, subject, html, text)
 * @returns {Promise<Object>} Created job
 *
 * @example
 * await addTransactionalEmail({
 *   to: 'user@example.com',
 *   subject: 'Password Reset',
 *   templateId: '507f1f77bcf86cd799439011',
 *   variables: { resetLink: 'https://...' },
 * });
 */
export const addTransactionalEmail = async (emailData) => {
  const job = await priorityEmailQueue.add(JOB_TYPES.SEND_TRANSACTIONAL, emailData, {
    attempts: 3,
    backoff: { type: 'fixed', delay: 1000 },
    priority: 1,
  });

  return { jobId: job.id };
};

/**
 * Get job status
 *
 * @param {string} jobId - Job ID
 * @returns {Promise<Object>} Job status
 */
export const getJobStatus = async (jobId) => {
  let job = await emailQueue.getJob(jobId);
  if (!job) {
    job = await priorityEmailQueue.getJob(jobId);
  }

  if (!job) {
    return null;
  }

  const state = await job.getState();
  return {
    id: job.id,
    state,
    progress: job.progress(),
    data: job.data,
    attemptsMade: job.attemptsMade,
    processedOn: job.processedOn,
    finishedOn: job.finishedOn,
    failedReason: job.failedReason,
  };
};

/**
 * Cancel a job
 *
 * @param {string} jobId - Job ID
 * @returns {Promise<boolean>} Success status
 */
export const cancelJob = async (jobId) => {
  let job = await emailQueue.getJob(jobId);
  if (!job) {
    job = await priorityEmailQueue.getJob(jobId);
  }

  if (!job) {
    return false;
  }

  const state = await job.getState();
  if (state === 'active') {
    // Cannot cancel active jobs, but can mark campaign as cancelled
    return false;
  }

  await job.remove();
  return true;
};

/**
 * Get queue statistics
 *
 * @returns {Promise<Object>} Queue statistics
 */
export const getQueueStats = async () => {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    emailQueue.getWaitingCount(),
    emailQueue.getActiveCount(),
    emailQueue.getCompletedCount(),
    emailQueue.getFailedCount(),
    emailQueue.getDelayedCount(),
  ]);

  const [priorityWaiting, priorityActive] = await Promise.all([
    priorityEmailQueue.getWaitingCount(),
    priorityEmailQueue.getActiveCount(),
  ]);

  return {
    emailQueue: { waiting, active, completed, failed, delayed },
    priorityQueue: { waiting: priorityWaiting, active: priorityActive },
    total: {
      waiting: waiting + priorityWaiting,
      active: active + priorityActive,
      completed,
      failed,
      delayed,
    },
  };
};

/**
 * Pause the email queue
 *
 * @returns {Promise<void>}
 */
export const pauseQueue = async () => {
  await emailQueue.pause();
  console.log('Email queue paused');
};

/**
 * Resume the email queue
 *
 * @returns {Promise<void>}
 */
export const resumeQueue = async () => {
  await emailQueue.resume();
  console.log('Email queue resumed');
};

/**
 * Clean old jobs from the queue
 *
 * @param {number} gracePeriod - Grace period in milliseconds
 * @returns {Promise<void>}
 */
export const cleanQueue = async (gracePeriod = 24 * 3600 * 1000) => {
  await emailQueue.clean(gracePeriod, 'completed');
  await emailQueue.clean(7 * 24 * 3600 * 1000, 'failed');
  console.log('Queue cleaned');
};

/**
 * Schedule recurring campaign check
 * Runs every minute to check for campaigns ready to send
 */
export const startRecurringCampaignScheduler = () => {
  setInterval(async () => {
    try {
      const dueRecurring = await Campaign.getRecurringDue();
      for (const campaign of dueRecurring) {
        console.log(`Scheduling recurring campaign: ${campaign.name}`);
        await addCampaignJob(campaign._id, campaign.createdBy);
      }

      const readyToSend = await Campaign.getReadyToSend();
      for (const campaign of readyToSend) {
        console.log(`Scheduling campaign: ${campaign.name}`);
        await addCampaignJob(campaign._id, campaign.createdBy);
      }
    } catch (error) {
      console.error('Error in recurring campaign scheduler:', error);
    }
  }, 60000); // Check every minute
};

// ============================================================================
// EXPORTS
// ============================================================================

export {
  emailQueue,
  priorityEmailQueue,
  verifyTransport,
};

export default {
  emailQueue,
  priorityEmailQueue,
  JOB_TYPES,
  addCampaignJob,
  addSingleEmailJob,
  addBatchEmailJob,
  addTransactionalEmail,
  getJobStatus,
  cancelJob,
  getQueueStats,
  pauseQueue,
  resumeQueue,
  cleanQueue,
  verifyTransport,
  startRecurringCampaignScheduler,
};
