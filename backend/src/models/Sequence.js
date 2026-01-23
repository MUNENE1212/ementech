import mongoose from 'mongoose';

/**
 * Sequence Model - Phase 4: Email Sequences & Drip Campaigns
 *
 * This model supports:
 * - Automated email sequences (drip campaigns)
 * - Multiple sequence types (drip, nurture, onboarding, re-engagement, custom)
 * - Multi-step email flows with configurable delays
 * - Trigger-based enrollment
 * - Lead enrollment tracking and management
 * - Sequence analytics and metrics
 * - Pause/resume capabilities
 *
 * @version 1.0.0
 * @since 2026-01-23
 */

// ============================================================================
// SUB-SCHEMAS
// ============================================================================

/**
 * Sequence Step Sub-Schema
 * Defines a single step in an email sequence
 */
const sequenceStepSchema = new mongoose.Schema({
  /** Step order in sequence (1-indexed) */
  order: {
    type: Number,
    required: true,
    min: 1,
  },
  /** Email template to use for this step */
  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EmailTemplate',
    required: true,
  },
  /** Subject line override (optional, uses template subject if not provided) */
  subject: String,
  /** Delay before sending this step after previous step */
  delay: {
    /** Number of time units to delay */
    value: {
      type: Number,
      required: true,
      min: 0,
      default: 1,
    },
    /** Time unit */
    unit: {
      type: String,
      enum: ['minutes', 'hours', 'days', 'weeks'],
      default: 'days',
    },
  },
  /** Conditions that must be met before sending this step */
  conditions: [{
    /** Field to check (can use lead fields like 'leadScore', 'pipelineStage', etc.) */
    field: String,
    /** Operator for comparison */
    operator: {
      type: String,
      enum: ['equals', 'notEquals', 'greaterThan', 'lessThan', 'contains', 'exists', 'notExists'],
    },
    /** Value to compare against */
    value: mongoose.Schema.Types.Mixed,
  }],
  /** Whether to skip this step if conditions aren't met (vs pausing sequence) */
  skipIfConditionsNotMet: {
    type: Boolean,
    default: false,
  },
  /** Whether this step can be sent multiple times (for recurring sequences) */
  canRepeat: {
    type: Boolean,
    default: false,
  },
  /** Notes about this step */
  notes: String,
}, { _id: false });

/**
 * Trigger Configuration Sub-Schema
 * Defines how leads are enrolled in the sequence
 */
const triggerConfigSchema = new mongoose.Schema({
  /** Type of trigger that enrolls leads */
  type: {
    type: String,
    enum: [
      'manual',           // Manual enrollment only
      'lead_created',     // When a lead is created
      'lead_score',       // When lead score reaches threshold
      'pipeline_stage',   // When lead enters pipeline stage
      'tag_added',        // When a specific tag is added
      'form_submitted',   // When a specific form is submitted
      'page_visited',     // When a page is visited
      'email_opened',     // When an email is opened
      'email_clicked',    // When a link in an email is clicked
      'birthday',         // On lead's birthday
      'anniversary',      // On company anniversary
      'inactivity',       // After period of inactivity
      'custom',           // Custom trigger via API
    ],
    default: 'manual',
  },
  /** For lead_score: the threshold score */
  scoreThreshold: {
    type: Number,
    min: 0,
  },
  /** For pipeline_stage: which stage triggers enrollment */
  pipelineStage: {
    type: String,
    enum: ['new', 'contacted', 'meeting_scheduled', 'proposal_sent', 'negotiation', 'won', 'lost'],
  },
  /** For tag_added: which tag triggers enrollment */
  tag: String,
  /** For form_submitted: form identifier */
  formId: String,
  /** For page_visited: page path or pattern */
  pagePath: String,
  /** For email_opened/clicked: which email/campaign */
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
  },
  /** For inactivity: days of inactivity before triggering */
  inactivityDays: {
    type: Number,
    min: 1,
  },
  /** For birthday/anniversary: days before/after (-7 = 7 days before, 0 = on day, 3 = 3 days after) */
  dayOffset: {
    type: Number,
    default: 0,
  },
  /** Additional conditions for trigger */
  conditions: [{
    field: String,
    operator: String,
    value: mongoose.Schema.Types.Mixed,
  }],
  /** Delay after trigger before first email */
  initialDelay: {
    value: { type: Number, default: 0 },
    unit: { type: String, enum: ['minutes', 'hours', 'days'], default: 'hours' },
  },
}, { _id: false });

/**
 * Enrollment Settings Sub-Schema
 * Configures automatic enrollment behavior
 */
const enrollmentSettingsSchema = new mongoose.Schema({
  /** Whether to automatically enroll leads who match trigger */
  autoEnroll: {
    type: Boolean,
    default: false,
  },
  /** Segment IDs to automatically enroll */
  segments: [{
    type: String,
    trim: true,
  }],
  /** Tags that trigger auto-enrollment when added to lead */
  enrollOnTags: [{
    type: String,
    trim: true,
    lowercase: true,
  }],
  /** Pipeline stages that trigger auto-enrollment */
  enrollOnPipelineStages: [{
    type: String,
    enum: ['new', 'contacted', 'meeting_scheduled', 'proposal_sent', 'negotiation', 'won', 'lost'],
  }],
  /** Minimum lead score for auto-enrollment */
  minLeadScore: {
    type: Number,
    min: 0,
  },
  /** Maximum number of leads that can be enrolled (null = unlimited) */
  maxEnrollments: {
    type: Number,
    min: 1,
  },
  /** Whether to exclude leads who have completed this sequence before */
  excludePreviousCompleters: {
    type: Boolean,
    default: true,
  },
  /** Whether to exclude leads who unsubscribed from any sequence */
  excludeUnsubscribed: {
    type: Boolean,
    default: true,
  },
  /** Whether to exclude leads who bounced */
  excludeBounced: {
    type: Boolean,
    default: true,
  },
}, { _id: false });

/**
 * Unsubscribe Settings Sub-Schema
 * Configures unsubscribe behavior
 */
const unsubscribeSettingsSchema = new mongoose.Schema({
  /** When to unsubscribe from sequence */
  behavior: {
    type: String,
    enum: [
      'immediate',        // Unsubscribe immediately from all marketing
      'sequence_only',    // Only unsubscribe from this sequence
      'wait_until_end',   // Finish current sequence then unsubscribe
    ],
    default: 'sequence_only',
  },
  /** Whether clicking unsubscribe removes from all sequences */
  unsubscribeFromAll: {
    type: Boolean,
    default: false,
  },
  /** Custom unsubscribe message */
  customMessage: String,
  /** URL for custom unsubscribe page */
  customUnsubscribeUrl: String,
}, { _id: false });

/**
 * Sequence Metrics Sub-Schema
 * Tracks sequence performance
 */
const sequenceMetricsSchema = new mongoose.Schema({
  /** Total leads enrolled */
  enrolled: {
    type: Number,
    default: 0,
  },
  /** Leads who completed all steps */
  completed: {
    type: Number,
    default: 0,
  },
  /** Currently active enrollments */
  active: {
    type: Number,
    default: 0,
  },
  /** Leads who unsubscribed */
  unsubscribed: {
    type: Number,
    default: 0,
  },
  /** Leads who converted (reached goal) */
  converted: {
    type: Number,
    default: 0,
  },
  /** Total emails sent across all steps */
  emailsSent: {
    type: Number,
    default: 0,
  },
  /** Total opens across all steps */
  totalOpens: {
    type: Number,
    default: 0,
  },
  /** Unique opens */
  uniqueOpens: {
    type: Number,
    default: 0,
  },
  /** Total clicks */
  totalClicks: {
    type: Number,
    default: 0,
  },
  /** Unique clicks */
  uniqueClicks: {
    type: Number,
    default: 0,
  },
  /** Bounces */
  bounces: {
    type: Number,
    default: 0,
  },
  /** Step completion rates */
  stepCompletionRates: [{
    stepOrder: Number,
    completed: Number,
    skipped: Number,
    rate: Number, // Percentage
  }],
  /** Average time to complete sequence (in hours) */
  avgCompletionTime: {
    type: Number,
    default: 0,
  },
  /** Revenue attributed to this sequence */
  revenue: {
    type: Number,
    default: 0,
  },
  /** When metrics were last updated */
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
}, { _id: false });

// ============================================================================
// MAIN SEQUENCE SCHEMA
// ============================================================================

const sequenceSchema = new mongoose.Schema({
  // -------------------------------------------------------------------------
  // IDENTIFICATION FIELDS
  // -------------------------------------------------------------------------

  /** Human-readable sequence name */
  name: {
    type: String,
    required: [true, 'Sequence name is required'],
    trim: true,
    maxlength: [200, 'Sequence name cannot exceed 200 characters'],
  },

  /** URL-friendly identifier for the sequence */
  slug: {
    type: String,
    required: [true, 'Sequence slug is required'],
    trim: true,
    lowercase: true,
    match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'],
    index: true,
  },

  /** Detailed description of the sequence */
  description: {
    type: String,
    maxlength: [2000, 'Description cannot exceed 2000 characters'],
  },

  // -------------------------------------------------------------------------
  // SEQUENCE TYPE & CLASSIFICATION
  // -------------------------------------------------------------------------

  /** Type of sequence */
  type: {
    type: String,
    enum: [
      'drip',           // Timed drip campaign
      'nurture',        // Lead nurturing sequence
      'onboarding',     // New customer onboarding
      're-engagement',  // Re-engage inactive leads
      'welcome',        // Welcome sequence for new leads
      'educational',    // Educational content series
      'promotional',    // Promotional offers sequence
      'abandoned-cart', // Recover abandoned carts (if applicable)
      'custom',         // Custom sequence type
    ],
    default: 'drip',
    index: true,
  },

  /** Category for organization */
  category: {
    type: String,
    enum: [
      'lead-generation',
      'customer-retention',
      'sales-nurturing',
      'product-launch',
      'event-promotion',
      'newsletter',
      'custom',
    ],
    default: 'custom',
  },

  /** Tags for filtering and organization */
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
  }],

  // -------------------------------------------------------------------------
  // SEQUENCE STEPS
  // -------------------------------------------------------------------------

  /** Ordered list of steps in the sequence */
  steps: [sequenceStepSchema],

  // -------------------------------------------------------------------------
  // TRIGGER CONFIGURATION
  // -------------------------------------------------------------------------

  /** How leads are enrolled in this sequence */
  trigger: triggerConfigSchema,

  // -------------------------------------------------------------------------
  // ENROLLMENT SETTINGS
  // -------------------------------------------------------------------------

  /** Enrollment configuration */
  enrollment: enrollmentSettingsSchema,

  // -------------------------------------------------------------------------
  // UNSUBSCRIBE SETTINGS
  // -------------------------------------------------------------------------

  /** Unsubscribe behavior */
  unsubscribeSettings: unsubscribeSettingsSchema,

  // -------------------------------------------------------------------------
  // STATUS & WORKFLOW
  // -------------------------------------------------------------------------

  /** Current sequence status */
  status: {
    type: String,
    enum: [
      'draft',     // Being created/edited
      'active',    // Currently enrolling and sending
      'paused',    // Temporarily paused (no new enrollments)
      'archived',  // No longer in use
    ],
    default: 'draft',
    index: true,
  },

  /** Reason for current status (especially for paused/archived) */
  statusReason: String,

  /** Status change history */
  statusHistory: [{
    status: String,
    changedAt: {
      type: Date,
      default: Date.now,
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reason: String,
  }],

  // -------------------------------------------------------------------------
  // SCHEDULING SETTINGS
  // -------------------------------------------------------------------------

  /** Timezone for scheduling sends */
  timezone: {
    type: String,
    default: 'Africa/Nairobi',
  },

  /** Preferred send time (24-hour format, e.g., "09:00") */
  preferredSendTime: {
    type: String,
    default: '09:00',
    match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (use HH:MM)'],
  },

  /** Days of week when emails can be sent (null = all days) */
  allowedSendDays: [{
    type: Number,
    min: 0, // Sunday
    max: 6,  // Saturday
  }],

  /** Whether to skip weekends for delay calculations */
  skipWeekends: {
    type: Boolean,
    default: false,
  },

  /** Whether to skip holidays */
  skipHolidays: {
    type: Boolean,
    default: false,
  },

  /** Holiday dates to skip (array of ISO date strings) */
  holidays: [String],

  // -------------------------------------------------------------------------
  // PERFORMANCE METRICS
  // -------------------------------------------------------------------------

  /** Sequence performance metrics */
  metrics: sequenceMetricsSchema,

  // -------------------------------------------------------------------------
  // GOAL TRACKING
  // -------------------------------------------------------------------------

  /** Primary goal of this sequence (what success looks like) */
  goal: {
    type: String,
    enum: [
      'engagement',      // Measure by opens/clicks
      'conversion',      // Measure by conversions
      'retention',       // Measure by completion rate
      'revenue',         // Measure by revenue generated
      'response',        // Measure by replies/interactions
      'custom',          // Custom goal
    ],
    default: 'engagement',
  },

  /** Target value for the goal */
  goalTarget: {
    type: Number,
    min: 0,
  },

  /** Goal description */
  goalDescription: String,

  // -------------------------------------------------------------------------
  // INTERNAL NOTES & METADATA
  // -------------------------------------------------------------------------

  /** Internal notes about the sequence */
  notes: {
    type: String,
    maxlength: [5000, 'Notes cannot exceed 5000 characters'],
  },

  /** Estimated duration of sequence (in days) - computed from steps */
  estimatedDuration: {
    type: Number,
    min: 0,
  },

  // -------------------------------------------------------------------------
  // AUDIT FIELDS
  // -------------------------------------------------------------------------

  /** User who created the sequence */
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  /** User who last updated the sequence */
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },

  /** Creation timestamp */
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },

  /** Last update timestamp */
  updatedAt: {
    type: Date,
    default: Date.now,
  },

  /** When the sequence was archived */
  archivedAt: Date,

  /** Who archived the sequence */
  archivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
});

// ============================================================================
// INDEXES
// ============================================================================

// Unique slug per sequence
sequenceSchema.index({ slug: 1 }, { unique: true });

// Compound index for active sequences lookup
sequenceSchema.index({ status: 1, type: 1 });

// Index for trigger-based lookups
sequenceSchema.index({ 'trigger.type': 1, status: 1 });

// Index for category filtering
sequenceSchema.index({ category: 1, status: 1 });

// Index for tag-based filtering
sequenceSchema.index({ tags: 1 });

// Index for creator filtering
sequenceSchema.index({ createdBy: 1, createdAt: -1 });

// ============================================================================
// VIRTUAL PROPERTIES
// ============================================================================

/**
 * Calculate completion rate as percentage
 */
sequenceSchema.virtual('completionRate').get(function() {
  if (!this.metrics || this.metrics.enrolled === 0) return 0;
  return Math.round((this.metrics.completed / this.metrics.enrolled) * 10000) / 100;
});

/**
 * Calculate open rate as percentage
 */
sequenceSchema.virtual('openRate').get(function() {
  if (!this.metrics || this.metrics.emailsSent === 0) return 0;
  return Math.round((this.metrics.uniqueOpens / this.metrics.emailsSent) * 10000) / 100;
});

/**
 * Calculate click rate as percentage
 */
sequenceSchema.virtual('clickRate').get(function() {
  if (!this.metrics || this.metrics.emailsSent === 0) return 0;
  return Math.round((this.metrics.uniqueClicks / this.metrics.emailsSent) * 10000) / 100;
});

/**
 * Calculate unsubscribe rate
 */
sequenceSchema.virtual('unsubscribeRate').get(function() {
  if (!this.metrics || this.metrics.enrolled === 0) return 0;
  return Math.round((this.metrics.unsubscribed / this.metrics.enrolled) * 10000) / 100;
});

/**
 * Calculate conversion rate
 */
sequenceSchema.virtual('conversionRate').get(function() {
  if (!this.metrics || this.metrics.enrolled === 0) return 0;
  return Math.round((this.metrics.converted / this.metrics.enrolled) * 10000) / 100;
});

/**
 * Check if sequence is editable (only in draft status)
 */
sequenceSchema.virtual('isEditable').get(function() {
  return this.status === 'draft';
});

/**
 * Check if sequence can be activated
 */
sequenceSchema.virtual('canBeActivated').get(function() {
  return this.status === 'draft' && this.steps && this.steps.length > 0;
});

/**
 * Check if sequence is currently running
 */
sequenceSchema.virtual('isRunning').get(function() {
  return this.status === 'active';
});

// Ensure virtuals are included in JSON output
sequenceSchema.set('toJSON', { virtuals: true });
sequenceSchema.set('toObject', { virtuals: true });

// ============================================================================
// INSTANCE METHODS
// ============================================================================

/**
 * Update sequence status with history tracking
 *
 * @param {string} newStatus - The new status
 * @param {ObjectId} userId - ID of user making the change
 * @param {string} [reason] - Optional reason for the change
 * @returns {this} Updated sequence
 *
 * @example
 * await sequence.changeStatus('active', userId, 'Sequence activated');
 * await sequence.save();
 */
sequenceSchema.methods.changeStatus = function(newStatus, userId, reason) {
  const validStatuses = ['draft', 'active', 'paused', 'archived'];
  if (!validStatuses.includes(newStatus)) {
    throw new Error(`Invalid status: ${newStatus}`);
  }

  const oldStatus = this.status;

  // Validate status transitions
  const validTransitions = {
    'draft': ['active', 'archived'],
    'active': ['paused', 'archived'],
    'paused': ['active', 'draft', 'archived'],
    'archived': ['draft'], // Can restore from archive
  };

  if (!validTransitions[oldStatus]?.includes(newStatus)) {
    throw new Error(`Cannot transition from ${oldStatus} to ${newStatus}`);
  }

  // Record the status change
  if (!this.statusHistory) {
    this.statusHistory = [];
  }

  this.statusHistory.push({
    status: newStatus,
    changedAt: new Date(),
    changedBy: userId,
    reason: reason || `Changed from ${oldStatus} to ${newStatus}`,
  });

  this.status = newStatus;
  this.statusReason = reason;

  return this;
};

/**
 * Add a step to the sequence
 *
 * @param {Object} stepData - Step configuration
 * @returns {this} Updated sequence
 *
 * @example
 * sequence.addStep({
 *   order: 1,
 *   templateId: templateId,
 *   delay: { value: 1, unit: 'days' }
 * });
 */
sequenceSchema.methods.addStep = function(stepData) {
  if (!this.steps) {
    this.steps = [];
  }

  // If order not provided, append to end
  if (!stepData.order) {
    stepData.order = this.steps.length + 1;
  }

  // Check if step with this order already exists
  const existingIndex = this.steps.findIndex(s => s.order === stepData.order);

  if (existingIndex >= 0) {
    // Insert and reorder subsequent steps
    this.steps.forEach(s => {
      if (s.order >= stepData.order) {
        s.order += 1;
      }
    });
  }

  this.steps.push(stepData);

  // Re-sort by order
  this.steps.sort((a, b) => a.order - b.order);

  this.estimatedDuration = this.calculateDuration();

  return this;
};

/**
 * Remove a step from the sequence
 *
 * @param {number} stepOrder - Order of step to remove
 * @returns {this} Updated sequence
 *
 * @example
 * sequence.removeStep(2);
 */
sequenceSchema.methods.removeStep = function(stepOrder) {
  if (!this.steps) return this;

  const initialLength = this.steps.length;

  this.steps = this.steps.filter(s => s.order !== stepOrder);

  // Reorder remaining steps
  this.steps.forEach((s, index) => {
    s.order = index + 1;
  });

  if (this.steps.length !== initialLength) {
    this.estimatedDuration = this.calculateDuration();
  }

  return this;
};

/**
 * Update a step in the sequence
 *
 * @param {number} stepOrder - Order of step to update
 * @param {Object} updates - Fields to update
 * @returns {this} Updated sequence
 */
sequenceSchema.methods.updateStep = function(stepOrder, updates) {
  if (!this.steps) return this;

  const step = this.steps.find(s => s.order === stepOrder);

  if (!step) {
    throw new Error(`Step ${stepOrder} not found`);
  }

  // Update allowed fields
  const allowedFields = ['templateId', 'subject', 'delay', 'conditions', 'skipIfConditionsNotMet', 'canRepeat', 'notes'];

  allowedFields.forEach(field => {
    if (updates[field] !== undefined) {
      step[field] = updates[field];
    }
  });

  this.estimatedDuration = this.calculateDuration();

  return this;
};

/**
 * Move a step to a new position
 *
 * @param {number} currentOrder - Current step order
 * @param {number} newOrder - New position
 * @returns {this} Updated sequence
 */
sequenceSchema.methods.moveStep = function(currentOrder, newOrder) {
  if (!this.steps || this.steps.length === 0) return this;

  const step = this.steps.find(s => s.order === currentOrder);

  if (!step) {
    throw new Error(`Step ${currentOrder} not found`);
  }

  // Remove step from current position
  this.steps = this.steps.filter(s => s.order !== currentOrder);

  // Adjust orders of other steps
  this.steps.forEach(s => {
    if (s.order >= newOrder) {
      s.order += 1;
    }
  });

  // Add step at new position
  step.order = newOrder;
  this.steps.push(step);

  // Re-sort and renumber
  this.steps.sort((a, b) => a.order - b.order);
  this.steps.forEach((s, index) => {
    s.order = index + 1;
  });

  this.estimatedDuration = this.calculateDuration();

  return this;
};

/**
 * Calculate total estimated duration of sequence in days
 *
 * @returns {number} Duration in days
 * @private
 */
sequenceSchema.methods.calculateDuration = function() {
  if (!this.steps || this.steps.length === 0) return 0;

  let totalDays = 0;

  this.steps.forEach(step => {
    const delay = step.delay || { value: 0, unit: 'days' };

    switch (delay.unit) {
      case 'minutes':
        totalDays += delay.value / (60 * 24);
        break;
      case 'hours':
        totalDays += delay.value / 24;
        break;
      case 'days':
        totalDays += delay.value;
        break;
      case 'weeks':
        totalDays += delay.value * 7;
        break;
    }
  });

  return Math.round(totalDays * 100) / 100; // Round to 2 decimal places
};

/**
 * Get the next step for a lead at a given position
 *
 * @param {number} currentStepIndex - Current step index (0-based)
 * @returns {Object|null} Next step or null if at end
 */
sequenceSchema.methods.getNextStep = function(currentStepIndex) {
  if (!this.steps || this.steps.length === 0) return null;

  const nextIndex = currentStepIndex + 1;

  if (nextIndex >= this.steps.length) {
    return null; // Sequence complete
  }

  return this.steps[nextIndex];
};

/**
 * Duplicate the sequence
 *
 * @param {string} newName - Name for the duplicate
 * @param {ObjectId} userId - ID of user creating the duplicate
 * @returns {Object} New sequence object (not saved)
 *
 * @example
 * const duplicate = sequence.duplicate('Welcome Sequence v2', userId);
 * await duplicate.save();
 */
sequenceSchema.methods.duplicate = function(newName, userId) {
  const sequenceData = this.toObject();

  // Remove fields that should be unique or reset
  delete sequenceData._id;
  delete sequenceData.id;
  delete sequenceData.createdAt;
  delete sequenceData.updatedAt;
  delete sequenceData.slug;
  delete sequenceData.archivedAt;
  delete sequenceData.archivedBy;

  // Set new values
  sequenceData.name = newName;
  sequenceData.status = 'draft';
  sequenceData.statusHistory = [{
    status: 'draft',
    changedAt: new Date(),
    changedBy: userId,
    reason: 'Duplicated from sequence',
  }];
  sequenceData.createdBy = userId;
  sequenceData.updatedBy = userId;

  // Reset metrics
  sequenceData.metrics = {
    enrolled: 0,
    completed: 0,
    active: 0,
    unsubscribed: 0,
    converted: 0,
    emailsSent: 0,
    totalOpens: 0,
    uniqueOpens: 0,
    totalClicks: 0,
    uniqueClicks: 0,
    bounces: 0,
    stepCompletionRates: [],
    avgCompletionTime: 0,
    revenue: 0,
    lastUpdated: new Date(),
  };

  return new (mongoose.model('Sequence'))(sequenceData);
};

/**
 * Archive the sequence (soft delete)
 *
 * @param {ObjectId} userId - ID of user archiving
 * @returns {this} Updated sequence
 */
sequenceSchema.methods.archive = function(userId) {
  this.archivedAt = new Date();
  this.archivedBy = userId;
  this.status = 'archived';
  return this;
};

/**
 * Update metrics with new data
 *
 * @param {Object} data - Metrics to update
 * @returns {this} Updated sequence
 *
 * @example
 * sequence.updateMetrics({ enrolled: 1, emailsSent: 1 });
 * await sequence.save();
 */
sequenceSchema.methods.updateMetrics = function(data = {}) {
  if (!this.metrics) {
    this.metrics = {};
  }

  const metricsFields = [
    'enrolled', 'completed', 'active', 'unsubscribed', 'converted',
    'emailsSent', 'totalOpens', 'uniqueOpens', 'totalClicks', 'uniqueClicks',
    'bounces', 'revenue',
  ];

  metricsFields.forEach(field => {
    if (data[field] !== undefined) {
      this.metrics[field] = (this.metrics[field] || 0) + data[field];
    }
  });

  this.metrics.lastUpdated = new Date();

  return this;
};

/**
 * Get step completion rate for a specific step
 *
 * @param {number} stepOrder - Step order
 * @param {number} completed - Number completed
 * @param {number} total - Total enrolled
 * @returns {number} Completion rate percentage
 */
sequenceSchema.methods.getStepCompletionRate = function(stepOrder, completed, total) {
  if (!this.metrics) {
    this.metrics = { stepCompletionRates: [] };
  }
  if (!this.metrics.stepCompletionRates) {
    this.metrics.stepCompletionRates = [];
  }

  const rate = total > 0 ? Math.round((completed / total) * 10000) / 100 : 0;

  // Update or add rate for this step
  const existingIndex = this.metrics.stepCompletionRates.findIndex(s => s.stepOrder === stepOrder);

  if (existingIndex >= 0) {
    this.metrics.stepCompletionRates[existingIndex] = { stepOrder, completed, skipped: 0, rate };
  } else {
    this.metrics.stepCompletionRates.push({ stepOrder, completed, skipped: 0, rate });
  }

  return rate;
};

// ============================================================================
// STATIC METHODS
// ============================================================================

/**
 * Find sequence by slug
 *
 * @param {string} slug - Sequence slug
 * @returns {Promise<Sequence|null>}
 */
sequenceSchema.statics.findBySlug = async function(slug) {
  return this.findOne({ slug: slug.toLowerCase(), archivedAt: null });
};

/**
 * Get active sequences by trigger type
 *
 * @param {string} triggerType - The trigger type
 * @returns {Promise<Sequence[]>} Array of active sequences
 *
 * @example
 * const birthdaySequences = await Sequence.getByTriggerType('birthday');
 */
sequenceSchema.statics.getByTriggerType = async function(triggerType) {
  return this.find({
    'trigger.type': triggerType,
    status: 'active',
    archivedAt: null,
  }).populate('steps.templateId');
};

/**
 * Get sequences ready to process enrollments
 * Returns active sequences with auto-enroll enabled
 *
 * @returns {Promise<Sequence[]>} Array of sequences
 */
sequenceSchema.statics.getAutoEnrollSequences = async function() {
  return this.find({
    status: 'active',
    'enrollment.autoEnroll': true,
    archivedAt: null,
  }).populate('steps.templateId');
};

/**
 * Get sequences by type
 *
 * @param {string} type - Sequence type
 * @param {Object} options - Query options
 * @returns {Promise<Sequence[]>}
 */
sequenceSchema.statics.getByType = async function(type, options = {}) {
  const { status = 'active', limit = 50 } = options;

  return this.find({
    type,
    status,
    archivedAt: null,
  })
    .populate('steps.templateId', 'name slug')
    .sort('-createdAt')
    .limit(limit);
};

/**
 * Search sequences by name or tags
 *
 * @param {string} query - Search query
 * @param {Object} options - Search options
 * @returns {Promise<Sequence[]>}
 */
sequenceSchema.statics.search = async function(query, options = {}) {
  const { status, type, limit = 50 } = options;

  const searchQuery = {
    archivedAt: null,
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
      { tags: { $regex: query, $options: 'i' } },
    ],
  };

  if (status) searchQuery.status = status;
  if (type) searchQuery.type = type;

  return this.find(searchQuery)
    .populate('steps.templateId', 'name slug')
    .sort('-updatedAt')
    .limit(limit);
};

/**
 * Get aggregate metrics across all sequences
 *
 * @param {Object} options - Filter options
 * @returns {Promise<Object>}
 */
sequenceSchema.statics.getAggregateMetrics = async function(options = {}) {
  const { startDate, endDate, type, category } = options;

  const match = {
    status: { $in: ['active', 'paused'] },
    archivedAt: null,
  };

  if (startDate) match.createdAt = { $gte: new Date(startDate) };
  if (endDate) match.createdAt = { ...match.createdAt, $lte: new Date(endDate) };
  if (type) match.type = type;
  if (category) match.category = category;

  const result = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalSequences: { $sum: 1 },
        totalEnrolled: { $sum: '$metrics.enrolled' },
        totalCompleted: { $sum: '$metrics.completed' },
        totalActive: { $sum: '$metrics.active' },
        totalUnsubscribed: { $sum: '$metrics.unsubscribed' },
        totalConverted: { $sum: '$metrics.converted' },
        totalEmailsSent: { $sum: '$metrics.emailsSent' },
        totalOpens: { $sum: '$metrics.uniqueOpens' },
        totalClicks: { $sum: '$metrics.uniqueClicks' },
        totalRevenue: { $sum: '$metrics.revenue' },
      },
    },
  ]);

  if (result.length === 0) {
    return {
      totalSequences: 0,
      totalEnrolled: 0,
      avgCompletionRate: 0,
      avgOpenRate: 0,
      avgClickRate: 0,
      totalRevenue: 0,
    };
  }

  const stats = result[0];
  return {
    totalSequences: stats.totalSequences,
    totalEnrolled: stats.totalEnrolled,
    totalCompleted: stats.totalCompleted,
    avgCompletionRate: stats.totalEnrolled > 0
      ? Math.round((stats.totalCompleted / stats.totalEnrolled) * 10000) / 100
      : 0,
    avgOpenRate: stats.totalEmailsSent > 0
      ? Math.round((stats.totalOpens / stats.totalEmailsSent) * 10000) / 100
      : 0,
    avgClickRate: stats.totalEmailsSent > 0
      ? Math.round((stats.totalClicks / stats.totalEmailsSent) * 10000) / 100
      : 0,
    totalRevenue: stats.totalRevenue,
  };
};

/**
 * Generate a unique slug from a name
 *
 * @param {string} name - Sequence name
 * @returns {Promise<string>} Unique slug
 */
sequenceSchema.statics.generateSlug = async function(name) {
  let baseSlug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

  let slug = baseSlug;
  let counter = 1;

  while (await this.findOne({ slug, archivedAt: null })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
};

/**
 * Get top performing sequences
 *
 * @param {string} metric - Metric to sort by
 * @param {number} limit - Number to return
 * @returns {Promise<Sequence[]>}
 */
sequenceSchema.statics.getTopPerforming = async function(metric = 'completionRate', limit = 10) {
  const sequences = await this.find({
    status: { $in: ['active', 'paused'] },
    archivedAt: null,
    'metrics.enrolled': { $gte: 10 }, // Minimum for statistical significance
  });

  return sequences
    .sort((a, b) => {
      const rateA = a[metric] || 0;
      const rateB = b[metric] || 0;
      return rateB - rateA;
    })
    .slice(0, limit);
};

// ============================================================================
// PRE-SAVE MIDDLEWARE
// ============================================================================

sequenceSchema.pre('save', async function(next) {
  // Update timestamp
  this.updatedAt = new Date();

  // Auto-generate slug if not provided
  if (this.isNew && !this.slug) {
    this.slug = await mongoose.model('Sequence').generateSlug(this.name);
  }

  // Initialize metrics if not set
  if (!this.metrics) {
    this.metrics = {
      enrolled: 0,
      completed: 0,
      active: 0,
      unsubscribed: 0,
      converted: 0,
      emailsSent: 0,
      totalOpens: 0,
      uniqueOpens: 0,
      totalClicks: 0,
      uniqueClicks: 0,
      bounces: 0,
      stepCompletionRates: [],
      avgCompletionTime: 0,
      revenue: 0,
      lastUpdated: new Date(),
    };
  }

  // Initialize enrollment settings if not set
  if (!this.enrollment) {
    this.enrollment = {
      autoEnroll: false,
      segments: [],
      enrollOnTags: [],
      enrollOnPipelineStages: [],
      excludePreviousCompleters: true,
      excludeUnsubscribed: true,
      excludeBounced: true,
    };
  }

  // Initialize unsubscribe settings if not set
  if (!this.unsubscribeSettings) {
    this.unsubscribeSettings = {
      behavior: 'sequence_only',
      unsubscribeFromAll: false,
    };
  }

  // Initialize trigger if not set
  if (!this.trigger) {
    this.trigger = {
      type: 'manual',
    };
  }

  // Calculate estimated duration
  this.estimatedDuration = this.calculateDuration();

  // Initialize status history if new
  if (this.isNew && (!this.statusHistory || this.statusHistory.length === 0)) {
    this.statusHistory = [{
      status: this.status,
      changedAt: new Date(),
      changedBy: this.createdBy,
      reason: 'Sequence created',
    }];
  }

  next();
});

// ============================================================================
// MODEL EXPORT
// ============================================================================

const Sequence = mongoose.model('Sequence', sequenceSchema);

export default Sequence;
