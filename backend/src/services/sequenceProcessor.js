import Sequence from '../models/Sequence.js';
import Lead from '../models/Lead.js';
import EmailTemplate from '../models/EmailTemplate.js';
import { addCampaignJob } from '../queues/emailQueue.js';
import { renderEmail } from '../utils/emailRenderer.js';

/**
 * Sequence Processor Service - Phase 4: Email Sequences & Drip Campaigns
 *
 * Handles:
 * - Processing sequence enrollments
 * - Calculating delay triggers for next steps
 * - Moving leads through sequence steps
 * - Handling unsubscribe requests
 * - Tracking sequence progress
 * - Integration with emailQueue for sending
 *
 * @version 1.0.0
 * @since 2026-01-23
 */

// ============================================================================
// CONSTANTS
// ============================================================================

const PROCESSOR_CONFIG = {
  /** Number of leads to process per batch */
  BATCH_SIZE: 100,
  /** Delay between batches in ms */
  BATCH_DELAY: 1000,
  /** Maximum retries for failed sends */
  MAX_RETRIES: 3,
  /** Hours to look ahead for scheduled sends */
  LOOKAHEAD_HOURS: 24,
};

// ============================================================================
// SEQUENCE ENROLLMENT PROCESSING
// ============================================================================

/**
 * Process auto-enrollment for all active sequences
 * Finds leads who match trigger conditions and enrolls them
 *
 * @returns {Promise<Object>} Processing results
 */
export const processAutoEnrollments = async () => {
  const results = {
    processed: 0,
    enrolled: 0,
    skipped: 0,
    failed: 0,
    sequences: [],
  };

  try {
    // Get all active sequences with auto-enroll enabled
    const sequences = await Sequence.getAutoEnrollSequences();

    for (const sequence of sequences) {
      const sequenceResult = await processSequenceAutoEnroll(sequence);
      results.sequences.push(sequenceResult);
      results.enrolled += sequenceResult.enrolled;
      results.skipped += sequenceResult.skipped;
      results.failed += sequenceResult.failed;
      results.processed++;
    }

    return results;

  } catch (error) {
    console.error('Error processing auto-enrollments:', error);
    throw error;
  }
};

/**
 * Process auto-enrollment for a single sequence
 *
 * @param {Sequence} sequence - The sequence to process
 * @returns {Promise<Object>} Enrollment results
 */
const processSequenceAutoEnroll = async (sequence) => {
  const result = {
    sequenceId: sequence._id,
    sequenceName: sequence.name,
    enrolled: 0,
    skipped: 0,
    failed: 0,
  };

  try {
    const { trigger, enrollment } = sequence;

    // Check if auto-enroll is enabled
    if (!enrollment?.autoEnroll) {
      return result;
    }

    // Build query based on trigger type
    const query = buildTriggerQuery(sequence);

    // Add enrollment exclusions
    applyEnrollmentExclusions(query, sequence);

    // Find leads matching the trigger
    const leads = await Lead.find(query).limit(PROCESSOR_CONFIG.BATCH_SIZE);

    for (const lead of leads) {
      try {
        // Check if already enrolled in this sequence
        const alreadyEnrolled = lead.activeSequences?.some(
          s => s.sequenceId.toString() === sequence._id.toString()
        );

        if (alreadyEnrolled) {
          result.skipped++;
          continue;
        }

        // Check max enrollments
        if (enrollment.maxEnrollments) {
          const currentEnrollments = await Lead.countDocuments({
            'activeSequences.sequenceId': sequence._id,
            'activeSequences.status': 'active',
          });

          if (currentEnrollments >= enrollment.maxEnrollments) {
            result.skipped++;
            continue;
          }
        }

        // Enroll the lead
        lead.enrollInSequence(sequence._id);
        await lead.save();

        // Schedule first email
        await scheduleFirstEmail(sequence, lead);

        result.enrolled++;

        // Update sequence metrics
        sequence.updateMetrics({ enrolled: 1, active: 1 });

      } catch (err) {
        console.error(`Error enrolling lead ${lead._id}:`, err);
        result.failed++;
      }
    }

    // Save sequence metrics
    await sequence.save();

    return result;

  } catch (error) {
    console.error(`Error processing sequence ${sequence._id}:`, error);
    result.failed++;
    return result;
  }
};

/**
 * Build query based on sequence trigger type
 *
 * @param {Sequence} sequence - The sequence
 * @returns {Object} MongoDB query
 */
const buildTriggerQuery = (sequence) => {
  const { trigger, enrollment } = sequence;
  const query = {
    isActive: true,
    unsubscribed: { $ne: true },
  };

  switch (trigger.type) {
    case 'lead_created':
      // New leads created within the initial delay period
      const delayMs = convertDelayToMs(trigger.initialDelay || { value: 0, unit: 'hours' });
      const createdAfter = new Date(Date.now() - delayMs);
      query.createdAt = { $gte: createdAfter };
      break;

    case 'lead_score':
      // Leads with score at or above threshold
      query.leadScore = { $gte: trigger.scoreThreshold || 50 };
      break;

    case 'pipeline_stage':
      // Leads who entered a specific stage
      query.pipelineStage = trigger.pipelineStage;
      break;

    case 'tag_added':
      // Leads with specific tag
      if (trigger.tag) {
        query.tags = trigger.tag;
      }
      break;

    case 'inactivity':
      // Leads inactive for specified days
      const inactivityCutoff = new Date(Date.now() - (trigger.inactivityDays || 30) * 24 * 60 * 60 * 1000);
      query.lastActivity = { $lt: inactivityCutoff };
      break;

    case 'birthday':
      // Leads with upcoming birthdays (next 7 days)
      // This requires special handling in the main loop
      break;

    case 'anniversary':
      // Leads with upcoming company anniversaries (next 30 days)
      // This requires special handling in the main loop
      break;

    case 'manual':
      // No auto-enrollment for manual triggers
      break;

    default:
      // For other trigger types, check tags
      if (enrollment?.enrollOnTags && enrollment.enrollOnTags.length > 0) {
        query.tags = { $in: enrollment.enrollOnTags };
      }
      if (enrollment?.enrollOnPipelineStages && enrollment.enrollOnPipelineStages.length > 0) {
        query.pipelineStage = { $in: enrollment.enrollOnPipelineStages };
      }
      if (enrollment?.minLeadScore) {
        query.leadScore = { $gte: enrollment.minLeadScore };
      }
      break;
  }

  return query;
};

/**
 * Apply enrollment exclusion filters
 *
 * @param {Object} query - The query to modify
 * @param {Sequence} sequence - The sequence with enrollment settings
 */
const applyEnrollmentExclusions = (query, sequence) => {
  const { enrollment } = sequence;

  // Exclude leads already in this sequence
  query['activeSequences.sequenceId'] = { $ne: sequence._id };

  // Exclude previous completers if enabled
  if (enrollment?.excludePreviousCompleters) {
    query['completedSequences.sequenceId'] = { $ne: sequence._id };
  }

  // Already handled at base level:
  // - excludeUnsubscribed (unsubscribed: { $ne: true })
  // - excludeBounced (would need bounce tracking field)
};

// ============================================================================
// SEQUENCE EMAIL PROCESSING
// ============================================================================

/**
 * Process pending sequence emails
 * Finds leads due for their next sequence email and sends them
 *
 * @returns {Promise<Object>} Processing results
 */
export const processPendingEmails = async () => {
  const results = {
    processed: 0,
    sent: 0,
    skipped: 0,
    failed: 0,
    leads: [],
  };

  try {
    // Get leads with pending sequence emails due now or earlier
    const leads = await Lead.find({
      'pendingSequenceEmails.scheduledFor': { $lte: new Date() },
      'pendingSequenceEmails.status': 'pending',
      isActive: true,
      unsubscribed: { $ne: true },
    }).limit(PROCESSOR_CONFIG.BATCH_SIZE);

    for (const lead of leads) {
      const leadResult = await processLeadPendingEmails(lead);
      results.sent += leadResult.sent;
      results.skipped += leadResult.skipped;
      results.failed += leadResult.failed;
      results.leads.push(leadResult);
      results.processed++;
    }

    return results;

  } catch (error) {
    console.error('Error processing pending emails:', error);
    throw error;
  }
};

/**
 * Process all pending emails for a single lead
 *
 * @param {Lead} lead - The lead to process
 * @returns {Promise<Object>} Results for this lead
 */
const processLeadPendingEmails = async (lead) => {
  const result = {
    leadId: lead._id,
    leadEmail: lead.email,
    sent: 0,
    skipped: 0,
    failed: 0,
    emails: [],
  };

  if (!lead.pendingSequenceEmails || lead.pendingSequenceEmails.length === 0) {
    return result;
  }

  // Get pending emails due now
  const dueEmails = lead.pendingSequenceEmails.filter(e =>
    e.status === 'pending' && e.scheduledFor <= new Date()
  );

  for (const pendingEmail of dueEmails) {
    try {
      const sendResult = await sendSequenceEmail(lead, pendingEmail);

      if (sendResult.success) {
        result.sent++;

        // Update pending email status
        pendingEmail.status = 'sent';
        pendingEmail.sentAt = new Date();

        // Update lead's enrollment step
        const enrollment = lead.activeSequences?.find(
          s => s.sequenceId.toString() === pendingEmail.sequenceId.toString()
        );

        if (enrollment) {
          enrollment.stepIndex = pendingEmail.stepOrder;
          enrollment.lastEmailSentAt = new Date();
        }

        result.emails.push({
          sequenceId: pendingEmail.sequenceId,
          stepOrder: pendingEmail.stepOrder,
          status: 'sent',
          emailId: sendResult.emailId,
        });

        // Check if sequence is complete
        await checkSequenceCompletion(lead, pendingEmail.sequenceId);

      } else {
        result.failed++;
        pendingEmail.status = 'failed';
        pendingEmail.failureReason = sendResult.error || 'Unknown error';

        result.emails.push({
          sequenceId: pendingEmail.sequenceId,
          stepOrder: pendingEmail.stepOrder,
          status: 'failed',
          error: sendResult.error,
        });
      }

    } catch (err) {
      console.error(`Error sending sequence email to lead ${lead._id}:`, err);
      result.failed++;
    }
  }

  // Save lead updates
  await lead.save();

  return result;
};

/**
 * Send a sequence email to a lead
 *
 * @param {Lead} lead - The lead to send to
 * @param {Object} pendingEmail - The pending email configuration
 * @returns {Promise<Object>} Send result
 */
const sendSequenceEmail = async (lead, pendingEmail) => {
  try {
    // Get the sequence and template
    const sequence = await Sequence.findById(pendingEmail.sequenceId);
    if (!sequence) {
      return { success: false, error: 'Sequence not found' };
    }

    const template = await EmailTemplate.findById(pendingEmail.templateId);
    if (!template) {
      return { success: false, error: 'Template not found' };
    }

    // Prepare email data with lead variables
    const emailData = {
      firstName: lead.name?.split(' ')[0] || '',
      lastName: lead.name?.split(' ').slice(1).join(' ') || '',
      name: lead.name || '',
      email: lead.email,
      company: lead.company || '',
      jobTitle: lead.jobTitle || '',
      // Add more personalization fields as needed
    };

    // Render the template
    const rendered = template.render(emailData);

    // Add to email queue
    const job = await addCampaignJob({
      templateId: template._id,
      recipientEmails: [lead.email],
      subject: rendered.subject,
      preheader: template.preheader,
      htmlBody: rendered.body,
      textBody: template.plainTextBody,
      sender: {
        name: 'EmenTech',
        email: 'noreply@ementech.co.ke',
      },
      metadata: {
        sequenceId: sequence._id,
        sequenceName: sequence.name,
        stepOrder: pendingEmail.stepOrder,
        leadId: lead._id,
      },
    });

    // Update sequence metrics
    sequence.updateMetrics({ emailsSent: 1 });
    await sequence.save();

    return {
      success: true,
      emailId: job.jobId,
      jobId: job.jobId,
    };

  } catch (error) {
    console.error('Error sending sequence email:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Check if a sequence is complete for a lead and update accordingly
 *
 * @param {Lead} lead - The lead
 * @param {ObjectId} sequenceId - The sequence ID
 */
const checkSequenceCompletion = async (lead, sequenceId) => {
  const sequence = await Sequence.findById(sequenceId);
  if (!sequence) return;

  const enrollment = lead.activeSequences?.find(
    s => s.sequenceId.toString() === sequenceId.toString()
  );

  if (!enrollment) return;

  const currentStep = enrollment.stepIndex || 0;
  const totalSteps = sequence.steps.length;

  // Check if all steps completed
  if (currentStep >= totalSteps) {
    // Complete the sequence
    lead.completeSequence(sequenceId);

    // Update sequence metrics
    sequence.updateMetrics({ completed: 1, active: -1 });
    await sequence.save();
  } else {
    // Schedule next step
    await scheduleNextStep(sequence, lead);
  }
};

/**
 * Schedule the first email for a newly enrolled lead
 *
 * @param {Sequence} sequence - The sequence
 * @param {Lead} lead - The lead
 */
const scheduleFirstEmail = async (sequence, lead) => {
  if (!sequence.steps || sequence.steps.length === 0) return;

  const firstStep = sequence.steps[0];

  // Calculate send time based on trigger delay
  const sendTime = new Date();
  const initialDelay = sequence.trigger?.initialDelay || { value: 0, unit: 'hours' };

  switch (initialDelay.unit) {
    case 'minutes':
      sendTime.setMinutes(sendTime.getMinutes() + initialDelay.value);
      break;
    case 'hours':
      sendTime.setHours(sendTime.getHours() + initialDelay.value);
      break;
    case 'days':
      sendTime.setDate(sendTime.getDate() + initialDelay.value);
      break;
  }

  // Apply preferred send time if set
  applyPreferredSendTime(sendTime, sequence);

  // Apply weekend/holiday skips if configured
  if (sequence.skipWeekends || sequence.skipHolidays) {
    adjustForNonBusinessDays(sendTime, sequence);
  }

  // Add to pending emails
  if (!lead.pendingSequenceEmails) {
    lead.pendingSequenceEmails = [];
  }

  lead.pendingSequenceEmails.push({
    sequenceId: sequence._id,
    stepOrder: 1,
    templateId: firstStep.templateId,
    scheduledFor: sendTime,
    status: 'pending',
  });

  // Update enrollment with next email time
  const enrollment = lead.activeSequences?.find(
    s => s.sequenceId.toString() === sequence._id.toString()
  );

  if (enrollment) {
    enrollment.nextEmailAt = sendTime;
  }
};

/**
 * Schedule the next step in a sequence for a lead
 *
 * @param {Sequence} sequence - The sequence
 * @param {Lead} lead - The lead
 */
const scheduleNextStep = async (sequence, lead) => {
  const enrollment = lead.activeSequences?.find(
    s => s.sequenceId.toString() === sequence._id.toString()
  );

  if (!enrollment) return;

  const currentStepIndex = enrollment.stepIndex || 0;
  const nextStep = sequence.steps[currentStepIndex];

  if (!nextStep) {
    // Sequence complete
    lead.completeSequence(sequence._id);
    sequence.updateMetrics({ completed: 1, active: -1 });
    await sequence.save();
    return;
  }

  // Calculate send time based on step delay
  const lastEmailTime = enrollment.lastEmailSentAt || new Date();
  const sendTime = new Date(lastEmailTime);
  const delay = nextStep.delay || { value: 1, unit: 'days' };

  switch (delay.unit) {
    case 'minutes':
      sendTime.setMinutes(sendTime.getMinutes() + delay.value);
      break;
    case 'hours':
      sendTime.setHours(sendTime.getHours() + delay.value);
      break;
    case 'days':
      sendTime.setDate(sendTime.getDate() + delay.value);
      break;
    case 'weeks':
      sendTime.setDate(sendTime.getDate() + (delay.value * 7));
      break;
  }

  // Apply preferred send time
  applyPreferredSendTime(sendTime, sequence);

  // Apply weekend/holiday skips
  if (sequence.skipWeekends || sequence.skipHolidays) {
    adjustForNonBusinessDays(sendTime, sequence);
  }

  // Add to pending emails
  if (!lead.pendingSequenceEmails) {
    lead.pendingSequenceEmails = [];
  }

  // Check conditions if any
  if (nextStep.conditions && nextStep.conditions.length > 0) {
    const conditionsMet = checkConditions(lead, nextStep.conditions);

    if (!conditionsMet) {
      if (nextStep.skipIfConditionsNotMet) {
        // Skip this step and schedule next
        enrollment.stepIndex = currentStepIndex + 1;
        await scheduleNextStep(sequence, lead);
        return;
      } else {
        // Pause sequence until conditions are met
        enrollment.status = 'paused';
        enrollment.pausedReason = 'Conditions not met for step ' + nextStep.order;
        return;
      }
    }
  }

  lead.pendingSequenceEmails.push({
    sequenceId: sequence._id,
    stepOrder: currentStepIndex + 1,
    templateId: nextStep.templateId,
    scheduledFor: sendTime,
    status: 'pending',
  });

  enrollment.nextEmailAt = sendTime;
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert delay configuration to milliseconds
 *
 * @param {Object} delay - Delay configuration
 * @returns {number} Milliseconds
 */
const convertDelayToMs = (delay) => {
  const { value = 0, unit = 'hours' } = delay;

  switch (unit) {
    case 'minutes':
      return value * 60 * 1000;
    case 'hours':
      return value * 60 * 60 * 1000;
    case 'days':
      return value * 24 * 60 * 60 * 1000;
    case 'weeks':
      return value * 7 * 24 * 60 * 60 * 1000;
    default:
      return 0;
  }
};

/**
 * Apply preferred send time to a date
 *
 * @param {Date} date - The date to modify
 * @param {Sequence} sequence - The sequence with settings
 */
const applyPreferredSendTime = (date, sequence) => {
  if (!sequence.preferredSendTime) return;

  const [hours, minutes] = sequence.preferredSendTime.split(':').map(Number);
  date.setHours(hours, minutes, 0, 0);
};

/**
 * Adjust date for weekends and holidays if configured
 *
 * @param {Date} date - The date to adjust
 * @param {Sequence} sequence - The sequence with settings
 */
const adjustForNonBusinessDays = (date, sequence) => {
  // Skip weekends
  if (sequence.skipWeekends) {
    while (date.getDay() === 0 || date.getDay() === 6) { // 0=Sunday, 6=Saturday
      date.setDate(date.getDate() + 1);
    }
  }

  // Skip holidays
  if (sequence.skipHolidays && sequence.holidays && sequence.holidays.length > 0) {
    const holidays = sequence.holidays.map(h => new Date(h).toDateString());
    while (holidays.includes(date.toDateString())) {
      date.setDate(date.getDate() + 1);

      // Also skip weekends when skipping holidays
      if (sequence.skipWeekends) {
        while (date.getDay() === 0 || date.getDay() === 6) {
          date.setDate(date.getDate() + 1);
        }
      }
    }
  }
};

/**
 * Check if lead meets the specified conditions
 *
 * @param {Lead} lead - The lead to check
 * @param {Array} conditions - Array of conditions
 * @returns {boolean} True if all conditions are met
 */
const checkConditions = (lead, conditions) => {
  if (!conditions || conditions.length === 0) return true;

  return conditions.every(condition => {
    const { field, operator, value } = condition;
    const leadValue = getLeadFieldValue(lead, field);

    switch (operator) {
      case 'equals':
        return leadValue === value;
      case 'notEquals':
        return leadValue !== value;
      case 'greaterThan':
        return leadValue > value;
      case 'lessThan':
        return leadValue < value;
      case 'contains':
        return typeof leadValue === 'string' && leadValue.includes(value);
      case 'exists':
        return leadValue !== undefined && leadValue !== null;
      case 'notExists':
        return leadValue === undefined || leadValue === null;
      default:
        return true;
    }
  });
};

/**
 * Get a field value from a lead
 *
 * @param {Lead} lead - The lead
 * @param {string} field - Field name (supports nested with dots)
 * @returns {*} The field value
 */
const getLeadFieldValue = (lead, field) => {
  return field.split('.').reduce((obj, key) => obj?.[key], lead);
};

/**
 * Get leads due for sequence emails in the next N hours
 *
 * @param {number} [hours=24] - Hours to look ahead
 * @returns {Promise<Lead[]>} Array of leads with pending emails
 */
export const getLeadsWithPendingEmails = async (hours = 24) => {
  const cutoff = new Date(Date.now() + hours * 60 * 60 * 1000);

  return Lead.find({
    'pendingSequenceEmails.scheduledFor': { $lte: cutoff },
    'pendingSequenceEmails.status': 'pending',
    isActive: true,
    unsubscribed: { $ne: true },
  })
    .select('email name activeSequences pendingSequenceEmails')
    .lean();
};

/**
 * Get sequence statistics
 *
 * @returns {Promise<Object>} Aggregate statistics
 */
export const getSequenceStats = async () => {
  const stats = await Sequence.aggregate([
    {
      $match: {
        archivedAt: null,
      },
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalEnrolled: { $sum: '$metrics.enrolled' },
        totalActive: { $sum: '$metrics.active' },
      },
    },
  ]);

  const result = {
    byStatus: {},
    totalSequences: 0,
    totalEnrolled: 0,
    totalActive: 0,
  };

  stats.forEach(s => {
    result.byStatus[s._id] = {
      count: s.count,
      enrolled: s.totalEnrolled,
      active: s.totalActive,
    };
    result.totalSequences += s.count;
    result.totalEnrolled += s.totalEnrolled;
    result.totalActive += s.totalActive;
  });

  // Get pending email count
  const pendingEmails = await Lead.countDocuments({
    'pendingSequenceEmails.status': 'pending',
  });

  result.pendingEmails = pendingEmails;

  return result;
};

/**
 * Cleanup completed/failed pending emails
 * Removes pending email entries that have been sent or failed
 *
 * @returns {Promise<number>} Number of cleaned entries
 */
export const cleanupPendingEmails = async () => {
  const result = await Lead.updateMany(
    {},
    {
      $pull: {
        pendingSequenceEmails: {
          status: { $in: ['sent', 'failed', 'cancelled'] },
        },
      },
    }
  );

  return result.modifiedCount || 0;
};

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  processAutoEnrollments,
  processPendingEmails,
  sendSequenceEmail,
  scheduleNextStep,
  getLeadsWithPendingEmails,
  getSequenceStats,
  cleanupPendingEmails,
  PROCESSOR_CONFIG,
};
