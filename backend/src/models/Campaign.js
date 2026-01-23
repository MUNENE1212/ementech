import mongoose from 'mongoose';

/**
 * Campaign Model - Phase 3: Email Marketing & Campaigns
 *
 * This model supports:
 * - Campaign identification and categorization
 * - Multiple campaign types (one-time, recurring, automated, drip/sequence)
 * - Scheduling with timezone support and recurring rules
 * - Audience targeting with segments, filters, and exclusions
 * - Template association (links to EmailTemplate model)
 * - Status workflow management
 * - Performance metrics tracking (sent, delivered, opened, clicked, bounced, unsubscribed)
 * - A/B testing configuration at the campaign level
 * - Budget and cost tracking
 * - Integration with Lead model for recipient management
 *
 * @version 1.0.0
 * @since 2026-01-23
 */

// ============================================================================
// SUB-SCHEMAS
// ============================================================================

/**
 * Schedule Configuration Sub-Schema
 * Defines when and how campaigns are sent
 */
const scheduleConfigSchema = new mongoose.Schema({
  /** Scheduled send date/time (for one-time campaigns) */
  sendAt: {
    type: Date,
    index: true,
  },
  /** Timezone for scheduling (IANA timezone identifier) */
  timezone: {
    type: String,
    default: 'Africa/Nairobi',
  },
  /** For recurring campaigns: how often to send */
  frequency: {
    type: String,
    enum: ['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly', 'custom'],
  },
  /** For weekly/biweekly: which days of week (0=Sunday, 6=Saturday) */
  daysOfWeek: [{
    type: Number,
    min: 0,
    max: 6,
  }],
  /** For monthly: which day of month (1-31, -1 for last day) */
  dayOfMonth: {
    type: Number,
    min: -1,
    max: 31,
  },
  /** Time of day to send (24-hour format, e.g., "09:00") */
  sendTime: {
    type: String,
    default: '09:00',
    match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (use HH:MM)'],
  },
  /** Start date for recurring campaigns */
  startDate: Date,
  /** End date for recurring campaigns (null = no end) */
  endDate: Date,
  /** Custom cron expression for advanced scheduling */
  cronExpression: String,
  /** Number of sends completed (for recurring) */
  sendsCompleted: {
    type: Number,
    default: 0,
  },
  /** Maximum number of sends (for recurring, null = unlimited) */
  maxSends: Number,
  /** Last time this campaign was sent */
  lastSentAt: Date,
  /** Next scheduled send time (computed) */
  nextSendAt: Date,
}, { _id: false });

/**
 * Audience Filter Sub-Schema
 * Defines a single filter condition for targeting
 */
const audienceFilterSchema = new mongoose.Schema({
  /** Field to filter on (e.g., 'source', 'tags', 'leadScore') */
  field: {
    type: String,
    required: true,
  },
  /** Comparison operator */
  operator: {
    type: String,
    enum: [
      'equals',
      'notEquals',
      'contains',
      'notContains',
      'startsWith',
      'endsWith',
      'greaterThan',
      'lessThan',
      'greaterThanOrEqual',
      'lessThanOrEqual',
      'between',
      'in',
      'notIn',
      'exists',
      'notExists',
      'isTrue',
      'isFalse',
      'before',
      'after',
      'withinDays',
    ],
    required: true,
  },
  /** Value to compare against */
  value: {
    type: mongoose.Schema.Types.Mixed,
  },
  /** Second value for 'between' operator */
  valueEnd: {
    type: mongoose.Schema.Types.Mixed,
  },
}, { _id: false });

/**
 * Audience Segment Sub-Schema
 * Defines audience targeting configuration
 */
const audienceConfigSchema = new mongoose.Schema({
  /** Target all leads (ignores filters) */
  targetAll: {
    type: Boolean,
    default: false,
  },
  /** Pre-defined segment IDs to include */
  segments: [{
    type: String,
    trim: true,
  }],
  /** Custom filters with AND logic */
  filters: [audienceFilterSchema],
  /** Filter logic: 'and' (all must match) or 'or' (any must match) */
  filterLogic: {
    type: String,
    enum: ['and', 'or'],
    default: 'and',
  },
  /** Specific lead IDs to exclude */
  excludeLeadIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead',
  }],
  /** Tags to exclude (leads with any of these tags are excluded) */
  excludeTags: [{
    type: String,
    trim: true,
    lowercase: true,
  }],
  /** Exclude leads who unsubscribed */
  excludeUnsubscribed: {
    type: Boolean,
    default: true,
  },
  /** Exclude leads who bounced */
  excludeBounced: {
    type: Boolean,
    default: true,
  },
  /** Exclude leads in certain pipeline stages */
  excludePipelineStages: [{
    type: String,
    enum: ['new', 'contacted', 'meeting_scheduled', 'proposal_sent', 'negotiation', 'won', 'lost'],
  }],
  /** Only include leads assigned to specific employees */
  assignedToEmployees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  /** Minimum lead score required */
  minLeadScore: {
    type: Number,
    min: 0,
  },
  /** Maximum lead score allowed */
  maxLeadScore: {
    type: Number,
    min: 0,
  },
  /** Estimated recipient count (cached) */
  estimatedRecipients: {
    type: Number,
    default: 0,
  },
  /** When the recipient estimate was last calculated */
  estimatedAt: Date,
}, { _id: false });

/**
 * A/B Test Configuration Sub-Schema
 * Defines campaign-level A/B testing settings
 */
const abTestConfigSchema = new mongoose.Schema({
  /** Whether A/B testing is enabled for this campaign */
  enabled: {
    type: Boolean,
    default: false,
  },
  /** What element is being tested */
  testType: {
    type: String,
    enum: ['subject', 'content', 'sender', 'sendTime', 'template'],
  },
  /** Test variants */
  variants: [{
    /** Variant identifier (A, B, C, etc.) */
    variantId: {
      type: String,
      enum: ['A', 'B', 'C', 'D', 'E'],
      required: true,
    },
    /** Description of what's different in this variant */
    description: String,
    /** Template to use for this variant (if testing templates) */
    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EmailTemplate',
    },
    /** Subject line for this variant (if testing subjects) */
    subject: String,
    /** Sender name for this variant (if testing senders) */
    senderName: String,
    /** Sender email for this variant (if testing senders) */
    senderEmail: String,
    /** Send time for this variant (if testing send times) */
    sendTime: String,
    /** Traffic allocation percentage (1-100) */
    weight: {
      type: Number,
      min: 1,
      max: 100,
      default: 50,
    },
    /** Metrics for this variant */
    metrics: {
      sent: { type: Number, default: 0 },
      delivered: { type: Number, default: 0 },
      opened: { type: Number, default: 0 },
      clicked: { type: Number, default: 0 },
      bounced: { type: Number, default: 0 },
      unsubscribed: { type: Number, default: 0 },
      conversions: { type: Number, default: 0 },
      revenue: { type: Number, default: 0 },
    },
    /** Whether this variant has been declared the winner */
    isWinner: {
      type: Boolean,
      default: false,
    },
  }],
  /** Percentage of audience for testing phase (rest gets winner) */
  testSize: {
    type: Number,
    min: 5,
    max: 100,
    default: 20,
  },
  /** Metric to determine winner */
  winnerCriteria: {
    type: String,
    enum: ['openRate', 'clickRate', 'conversionRate', 'revenue'],
    default: 'openRate',
  },
  /** Minimum sample size per variant for statistical significance */
  minSampleSize: {
    type: Number,
    default: 100,
  },
  /** Whether to automatically select and send to winner */
  autoSelectWinner: {
    type: Boolean,
    default: false,
  },
  /** Hours to wait before selecting winner */
  testDurationHours: {
    type: Number,
    default: 24,
  },
  /** When the test started */
  testStartedAt: Date,
  /** When the winner was selected */
  winnerSelectedAt: Date,
  /** ID of winning variant */
  winningVariantId: String,
  /** Statistical confidence level achieved */
  confidenceLevel: {
    type: Number,
    min: 0,
    max: 100,
  },
}, { _id: false });

/**
 * Budget Configuration Sub-Schema
 * Tracks campaign costs and budget
 */
const budgetConfigSchema = new mongoose.Schema({
  /** Total budget allocated for this campaign */
  totalBudget: {
    type: Number,
    min: 0,
    default: 0,
  },
  /** Currency for budget (ISO 4217 code) */
  currency: {
    type: String,
    default: 'KES',
    uppercase: true,
    maxlength: 3,
  },
  /** Cost per email sent (for cost tracking) */
  costPerEmail: {
    type: Number,
    min: 0,
    default: 0,
  },
  /** Total amount spent */
  totalSpent: {
    type: Number,
    min: 0,
    default: 0,
  },
  /** External costs (design, copywriting, etc.) */
  externalCosts: {
    type: Number,
    min: 0,
    default: 0,
  },
  /** Revenue attributed to this campaign */
  revenueGenerated: {
    type: Number,
    min: 0,
    default: 0,
  },
  /** Notes about budget/spending */
  notes: String,
}, { _id: false });

/**
 * Campaign Metrics Sub-Schema
 * Aggregated performance metrics
 */
const campaignMetricsSchema = new mongoose.Schema({
  /** Total recipients targeted */
  totalRecipients: {
    type: Number,
    default: 0,
  },
  /** Number of emails sent */
  sent: {
    type: Number,
    default: 0,
  },
  /** Number of emails successfully delivered */
  delivered: {
    type: Number,
    default: 0,
  },
  /** Number of emails that failed to send */
  failed: {
    type: Number,
    default: 0,
  },
  /** Number of unique opens */
  uniqueOpens: {
    type: Number,
    default: 0,
  },
  /** Total opens (including re-opens) */
  totalOpens: {
    type: Number,
    default: 0,
  },
  /** Number of unique clicks */
  uniqueClicks: {
    type: Number,
    default: 0,
  },
  /** Total clicks */
  totalClicks: {
    type: Number,
    default: 0,
  },
  /** Number of hard bounces */
  hardBounces: {
    type: Number,
    default: 0,
  },
  /** Number of soft bounces */
  softBounces: {
    type: Number,
    default: 0,
  },
  /** Number of unsubscribes triggered */
  unsubscribes: {
    type: Number,
    default: 0,
  },
  /** Number of spam complaints */
  spamComplaints: {
    type: Number,
    default: 0,
  },
  /** Number of forwards/shares */
  forwards: {
    type: Number,
    default: 0,
  },
  /** Number of conversions attributed */
  conversions: {
    type: Number,
    default: 0,
  },
  /** Revenue attributed to this campaign */
  revenue: {
    type: Number,
    default: 0,
  },
  /** Click map data (which links were clicked) */
  clickMap: [{
    url: String,
    clicks: { type: Number, default: 0 },
    uniqueClicks: { type: Number, default: 0 },
  }],
  /** Device breakdown */
  deviceBreakdown: {
    desktop: { type: Number, default: 0 },
    mobile: { type: Number, default: 0 },
    tablet: { type: Number, default: 0 },
    unknown: { type: Number, default: 0 },
  },
  /** Email client breakdown */
  emailClientBreakdown: {
    type: Map,
    of: Number,
    default: {},
  },
  /** Geographic breakdown */
  geoBreakdown: {
    type: Map,
    of: Number,
    default: {},
  },
  /** When metrics were last updated */
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
  /** When the campaign finished sending */
  completedAt: Date,
}, { _id: false });

/**
 * Sender Configuration Sub-Schema
 * Defines the "from" address and reply settings
 */
const senderConfigSchema = new mongoose.Schema({
  /** Sender name (e.g., "John from EmenTech") */
  name: {
    type: String,
    required: true,
    trim: true,
    default: 'EmenTech',
  },
  /** Sender email address */
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    default: 'noreply@ementech.co.ke',
  },
  /** Reply-to email address (if different from sender) */
  replyTo: {
    type: String,
    trim: true,
    lowercase: true,
  },
  /** Reply-to name */
  replyToName: {
    type: String,
    trim: true,
  },
}, { _id: false });

// ============================================================================
// MAIN CAMPAIGN SCHEMA
// ============================================================================

const campaignSchema = new mongoose.Schema({
  // -------------------------------------------------------------------------
  // IDENTIFICATION FIELDS
  // -------------------------------------------------------------------------

  /** Human-readable campaign name */
  name: {
    type: String,
    required: [true, 'Campaign name is required'],
    trim: true,
    maxlength: [200, 'Campaign name cannot exceed 200 characters'],
  },

  /** URL-friendly identifier for the campaign */
  slug: {
    type: String,
    required: [true, 'Campaign slug is required'],
    trim: true,
    lowercase: true,
    match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'],
    index: true,
  },

  /** Detailed description of the campaign */
  description: {
    type: String,
    maxlength: [2000, 'Description cannot exceed 2000 characters'],
  },

  // -------------------------------------------------------------------------
  // CAMPAIGN TYPE & CLASSIFICATION
  // -------------------------------------------------------------------------

  /** Type of campaign determines sending behavior */
  type: {
    type: String,
    enum: [
      'one-time',      // Single send at scheduled time
      'recurring',     // Repeats on schedule (newsletters)
      'automated',     // Triggered by events (welcome, abandoned cart)
      'drip',          // Part of a sequence/drip campaign
      'transactional', // System notifications, receipts
    ],
    default: 'one-time',
    index: true,
  },

  /** Campaign category for organization */
  category: {
    type: String,
    enum: [
      'newsletter',
      'promotional',
      'announcement',
      'welcome',
      'onboarding',
      're-engagement',
      'feedback',
      'event',
      'holiday',
      'product-update',
      'educational',
      'transactional',
      'custom',
    ],
    default: 'custom',
    index: true,
  },

  /** Tags for filtering and organization */
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
  }],

  // -------------------------------------------------------------------------
  // TEMPLATE ASSOCIATION
  // -------------------------------------------------------------------------

  /** Primary email template for this campaign */
  template: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EmailTemplate',
    required: [true, 'Email template is required'],
    index: true,
  },

  /** Subject line (can override template subject) */
  subject: {
    type: String,
    trim: true,
    maxlength: [200, 'Subject cannot exceed 200 characters'],
  },

  /** Preheader text (can override template preheader) */
  preheader: {
    type: String,
    trim: true,
    maxlength: [150, 'Preheader cannot exceed 150 characters'],
  },

  // -------------------------------------------------------------------------
  // SENDER CONFIGURATION
  // -------------------------------------------------------------------------

  /** Sender information */
  sender: senderConfigSchema,

  // -------------------------------------------------------------------------
  // SCHEDULING CONFIGURATION
  // -------------------------------------------------------------------------

  /** Schedule settings */
  schedule: scheduleConfigSchema,

  // -------------------------------------------------------------------------
  // AUDIENCE TARGETING
  // -------------------------------------------------------------------------

  /** Audience configuration */
  audience: audienceConfigSchema,

  /** Cached list of recipient lead IDs (populated before send) */
  recipientList: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead',
  }],

  /** When the recipient list was last computed */
  recipientListComputedAt: Date,

  // -------------------------------------------------------------------------
  // STATUS WORKFLOW
  // -------------------------------------------------------------------------

  /** Current campaign status */
  status: {
    type: String,
    enum: [
      'draft',       // Being created/edited
      'scheduled',   // Ready to send at scheduled time
      'sending',     // Currently being sent
      'sent',        // Completed sending
      'paused',      // Temporarily stopped (for recurring)
      'cancelled',   // Permanently stopped
      'failed',      // Failed to send
    ],
    default: 'draft',
    index: true,
  },

  /** Reason for current status (especially for paused/cancelled/failed) */
  statusReason: String,

  /** History of status changes */
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
  // A/B TESTING CONFIGURATION
  // -------------------------------------------------------------------------

  /** A/B testing settings */
  abTest: abTestConfigSchema,

  // -------------------------------------------------------------------------
  /** Reference to full ABTest model if test was created as standalone */
  abTestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ABTest',
  },

  // BUDGET & COST TRACKING
  // -------------------------------------------------------------------------

  /** Budget configuration */
  budget: budgetConfigSchema,

  // -------------------------------------------------------------------------
  // PERFORMANCE METRICS
  // -------------------------------------------------------------------------

  /** Campaign performance metrics */
  metrics: campaignMetricsSchema,

  // -------------------------------------------------------------------------
  // SEQUENCE/DRIP CONFIGURATION
  // -------------------------------------------------------------------------

  /** For drip campaigns: which sequence this belongs to */
  sequenceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EmailSequence',
  },

  /** For drip campaigns: step number in the sequence */
  sequenceStep: {
    type: Number,
    min: 1,
  },

  /** For drip campaigns: delay after previous step */
  sequenceDelay: {
    /** Number of units to delay */
    value: {
      type: Number,
      min: 0,
      default: 0,
    },
    /** Unit of delay */
    unit: {
      type: String,
      enum: ['minutes', 'hours', 'days', 'weeks'],
      default: 'days',
    },
  },

  /** For automated campaigns: trigger configuration */
  trigger: {
    /** Event that triggers this campaign */
    event: {
      type: String,
      enum: [
        'lead_created',
        'lead_score_reached',
        'pipeline_stage_changed',
        'tag_added',
        'form_submitted',
        'page_visited',
        'email_opened',
        'email_clicked',
        'birthday',
        'anniversary',
        'inactivity',
        'custom',
      ],
    },
    /** Specific conditions for the trigger */
    conditions: [{
      field: String,
      operator: String,
      value: mongoose.Schema.Types.Mixed,
    }],
    /** Delay after trigger before sending */
    delay: {
      value: { type: Number, default: 0 },
      unit: { type: String, enum: ['minutes', 'hours', 'days'], default: 'hours' },
    },
  },

  // -------------------------------------------------------------------------
  // PROCESSING & QUEUE FIELDS
  // -------------------------------------------------------------------------

  /** Bull queue job ID for processing */
  queueJobId: String,

  /** Processing progress (0-100) */
  processingProgress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },

  /** Batch size for sending */
  batchSize: {
    type: Number,
    default: 100,
    min: 1,
    max: 1000,
  },

  /** Delay between batches (ms) */
  batchDelay: {
    type: Number,
    default: 1000,
    min: 0,
  },

  /** Rate limiting: max emails per hour */
  rateLimit: {
    type: Number,
    default: 1000,
    min: 1,
  },

  /** Retry configuration for failed sends */
  retryConfig: {
    maxRetries: { type: Number, default: 3 },
    retryDelay: { type: Number, default: 5000 }, // ms
  },

  // -------------------------------------------------------------------------
  // APPROVAL WORKFLOW
  // -------------------------------------------------------------------------

  /** Whether approval is required before sending */
  requiresApproval: {
    type: Boolean,
    default: false,
  },

  /** Current approval status */
  approvalStatus: {
    type: String,
    enum: ['not_required', 'pending', 'approved', 'rejected'],
    default: 'not_required',
  },

  /** Who approved the campaign */
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },

  /** When the campaign was approved */
  approvedAt: Date,

  /** Rejection reason if applicable */
  rejectionReason: String,

  // -------------------------------------------------------------------------
  // INTERNAL NOTES & METADATA
  // -------------------------------------------------------------------------

  /** Internal notes about the campaign */
  notes: {
    type: String,
    maxlength: [5000, 'Notes cannot exceed 5000 characters'],
  },

  /** Priority for queue processing */
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal',
  },

  // -------------------------------------------------------------------------
  // AUDIT FIELDS
  // -------------------------------------------------------------------------

  /** User who created the campaign */
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  /** User who last updated the campaign */
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

  /** When the campaign was archived (soft delete) */
  archivedAt: Date,

  /** Who archived the campaign */
  archivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
});

// ============================================================================
// INDEXES
// ============================================================================

// Unique slug per campaign
campaignSchema.index({ slug: 1 }, { unique: true });

// Compound index for campaign lookup by status and type
campaignSchema.index({ status: 1, type: 1 });

// Compound index for scheduled campaigns lookup
campaignSchema.index({ status: 1, 'schedule.sendAt': 1 });

// Compound index for recurring campaigns
campaignSchema.index({ type: 1, 'schedule.nextSendAt': 1, status: 1 });

// Index for template lookups
campaignSchema.index({ template: 1, status: 1 });

// Index for sequence lookups
campaignSchema.index({ sequenceId: 1, sequenceStep: 1 });

// Index for category filtering
campaignSchema.index({ category: 1, status: 1 });

// Index for tag-based filtering
campaignSchema.index({ tags: 1 });

// Compound index for A/B test queries
campaignSchema.index({ 'abTest.enabled': 1, status: 1 });

// Index for ABTest reference
campaignSchema.index({ abTestId: 1 });

// Index for creator filtering
campaignSchema.index({ createdBy: 1, createdAt: -1 });

// Compound index for performance sorting
campaignSchema.index({ 'metrics.sent': -1, status: 1 });

// Index for approval workflow
campaignSchema.index({ approvalStatus: 1, requiresApproval: 1 });

// ============================================================================
// VIRTUAL PROPERTIES
// ============================================================================

/**
 * Calculate open rate as a percentage
 */
campaignSchema.virtual('openRate').get(function() {
  if (!this.metrics || this.metrics.delivered === 0) return 0;
  return Math.round((this.metrics.uniqueOpens / this.metrics.delivered) * 10000) / 100;
});

/**
 * Calculate click rate as a percentage
 */
campaignSchema.virtual('clickRate').get(function() {
  if (!this.metrics || this.metrics.delivered === 0) return 0;
  return Math.round((this.metrics.uniqueClicks / this.metrics.delivered) * 10000) / 100;
});

/**
 * Calculate click-to-open rate
 */
campaignSchema.virtual('clickToOpenRate').get(function() {
  if (!this.metrics || this.metrics.uniqueOpens === 0) return 0;
  return Math.round((this.metrics.uniqueClicks / this.metrics.uniqueOpens) * 10000) / 100;
});

/**
 * Calculate bounce rate (total bounces)
 */
campaignSchema.virtual('bounceRate').get(function() {
  if (!this.metrics || this.metrics.sent === 0) return 0;
  const totalBounces = (this.metrics.hardBounces || 0) + (this.metrics.softBounces || 0);
  return Math.round((totalBounces / this.metrics.sent) * 10000) / 100;
});

/**
 * Calculate unsubscribe rate
 */
campaignSchema.virtual('unsubscribeRate').get(function() {
  if (!this.metrics || this.metrics.delivered === 0) return 0;
  return Math.round((this.metrics.unsubscribes / this.metrics.delivered) * 10000) / 100;
});

/**
 * Calculate spam complaint rate
 */
campaignSchema.virtual('spamRate').get(function() {
  if (!this.metrics || this.metrics.delivered === 0) return 0;
  return Math.round((this.metrics.spamComplaints / this.metrics.delivered) * 10000) / 100;
});

/**
 * Calculate conversion rate
 */
campaignSchema.virtual('conversionRate').get(function() {
  if (!this.metrics || this.metrics.delivered === 0) return 0;
  return Math.round((this.metrics.conversions / this.metrics.delivered) * 10000) / 100;
});

/**
 * Calculate delivery rate
 */
campaignSchema.virtual('deliveryRate').get(function() {
  if (!this.metrics || this.metrics.sent === 0) return 0;
  return Math.round((this.metrics.delivered / this.metrics.sent) * 10000) / 100;
});

/**
 * Calculate ROI (Return on Investment)
 */
campaignSchema.virtual('roi').get(function() {
  if (!this.budget || this.budget.totalSpent === 0) return 0;
  const totalCost = this.budget.totalSpent + (this.budget.externalCosts || 0);
  const revenue = this.metrics?.revenue || this.budget?.revenueGenerated || 0;
  return Math.round(((revenue - totalCost) / totalCost) * 10000) / 100;
});

/**
 * Calculate cost per conversion
 */
campaignSchema.virtual('costPerConversion').get(function() {
  if (!this.metrics || this.metrics.conversions === 0) return null;
  const totalCost = (this.budget?.totalSpent || 0) + (this.budget?.externalCosts || 0);
  return Math.round((totalCost / this.metrics.conversions) * 100) / 100;
});

/**
 * Calculate cost per email
 */
campaignSchema.virtual('actualCostPerEmail').get(function() {
  if (!this.metrics || this.metrics.sent === 0) return 0;
  const totalCost = (this.budget?.totalSpent || 0) + (this.budget?.externalCosts || 0);
  return Math.round((totalCost / this.metrics.sent) * 10000) / 10000;
});

/**
 * Check if campaign is editable (only in draft status)
 */
campaignSchema.virtual('isEditable').get(function() {
  return this.status === 'draft';
});

/**
 * Check if campaign can be scheduled
 */
campaignSchema.virtual('canBeScheduled').get(function() {
  return this.status === 'draft' && this.template;
});

/**
 * Check if campaign is in progress
 */
campaignSchema.virtual('isInProgress').get(function() {
  return ['scheduled', 'sending'].includes(this.status);
});

/**
 * Check if campaign is complete
 */
campaignSchema.virtual('isComplete').get(function() {
  return ['sent', 'cancelled', 'failed'].includes(this.status);
});

/**
 * Get time until scheduled send
 */
campaignSchema.virtual('timeUntilSend').get(function() {
  if (!this.schedule?.sendAt || this.status !== 'scheduled') return null;
  const now = new Date();
  const sendAt = new Date(this.schedule.sendAt);
  const diffMs = sendAt - now;
  if (diffMs <= 0) return 0;
  return diffMs;
});

// Ensure virtuals are included in JSON output
campaignSchema.set('toJSON', { virtuals: true });
campaignSchema.set('toObject', { virtuals: true });

// ============================================================================
// INSTANCE METHODS
// ============================================================================

/**
 * Update campaign status with history tracking
 *
 * @param {string} newStatus - The new status
 * @param {ObjectId} userId - ID of user making the change
 * @param {string} [reason] - Optional reason for the change
 * @returns {this} Updated campaign
 *
 * @example
 * await campaign.changeStatus('scheduled', userId, 'Campaign approved');
 * await campaign.save();
 */
campaignSchema.methods.changeStatus = function(newStatus, userId, reason) {
  const validStatuses = ['draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled', 'failed'];
  if (!validStatuses.includes(newStatus)) {
    throw new Error(`Invalid status: ${newStatus}`);
  }

  const oldStatus = this.status;

  // Validate status transitions
  const validTransitions = {
    'draft': ['scheduled', 'cancelled'],
    'scheduled': ['sending', 'paused', 'cancelled', 'draft'],
    'sending': ['sent', 'paused', 'failed'],
    'sent': [], // Terminal state
    'paused': ['scheduled', 'sending', 'cancelled'],
    'cancelled': [], // Terminal state
    'failed': ['draft'], // Can retry by returning to draft
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
 * Schedule the campaign for sending
 *
 * @param {Date} sendAt - When to send
 * @param {string} timezone - Timezone for scheduling
 * @param {ObjectId} userId - ID of user scheduling
 * @returns {this} Updated campaign
 *
 * @example
 * await campaign.scheduleSend(new Date('2026-02-01T09:00:00'), 'Africa/Nairobi', userId);
 * await campaign.save();
 */
campaignSchema.methods.scheduleSend = function(sendAt, timezone, userId) {
  if (this.status !== 'draft') {
    throw new Error('Can only schedule campaigns in draft status');
  }

  if (new Date(sendAt) <= new Date()) {
    throw new Error('Schedule time must be in the future');
  }

  if (!this.schedule) {
    this.schedule = {};
  }

  this.schedule.sendAt = sendAt;
  this.schedule.timezone = timezone || 'Africa/Nairobi';
  this.schedule.nextSendAt = sendAt;

  return this.changeStatus('scheduled', userId, `Scheduled for ${sendAt}`);
};

/**
 * Pause the campaign
 *
 * @param {ObjectId} userId - ID of user pausing
 * @param {string} [reason] - Reason for pausing
 * @returns {this} Updated campaign
 */
campaignSchema.methods.pause = function(userId, reason) {
  if (!['scheduled', 'sending'].includes(this.status)) {
    throw new Error('Can only pause scheduled or sending campaigns');
  }

  return this.changeStatus('paused', userId, reason || 'Campaign paused');
};

/**
 * Resume a paused campaign
 *
 * @param {ObjectId} userId - ID of user resuming
 * @returns {this} Updated campaign
 */
campaignSchema.methods.resume = function(userId) {
  if (this.status !== 'paused') {
    throw new Error('Can only resume paused campaigns');
  }

  // If there's a scheduled send time that's passed, update to now + 5 minutes
  if (this.schedule?.sendAt && new Date(this.schedule.sendAt) < new Date()) {
    const newSendTime = new Date();
    newSendTime.setMinutes(newSendTime.getMinutes() + 5);
    this.schedule.sendAt = newSendTime;
    this.schedule.nextSendAt = newSendTime;
  }

  return this.changeStatus('scheduled', userId, 'Campaign resumed');
};

/**
 * Cancel the campaign
 *
 * @param {ObjectId} userId - ID of user cancelling
 * @param {string} [reason] - Reason for cancellation
 * @returns {this} Updated campaign
 */
campaignSchema.methods.cancel = function(userId, reason) {
  if (this.status === 'sent' || this.status === 'cancelled') {
    throw new Error('Cannot cancel a completed or already cancelled campaign');
  }

  return this.changeStatus('cancelled', userId, reason || 'Campaign cancelled');
};

/**
 * Mark campaign as sending
 *
 * @returns {this} Updated campaign
 */
campaignSchema.methods.markAsSending = function() {
  if (this.status !== 'scheduled') {
    throw new Error('Can only start sending scheduled campaigns');
  }

  this.status = 'sending';
  this.processingProgress = 0;

  if (!this.statusHistory) {
    this.statusHistory = [];
  }

  this.statusHistory.push({
    status: 'sending',
    changedAt: new Date(),
    reason: 'Started sending',
  });

  return this;
};

/**
 * Update progress during sending
 *
 * @param {number} progress - Progress percentage (0-100)
 * @returns {this} Updated campaign
 */
campaignSchema.methods.updateProgress = function(progress) {
  this.processingProgress = Math.min(100, Math.max(0, progress));
  return this;
};

/**
 * Mark campaign as sent (completed)
 *
 * @returns {this} Updated campaign
 */
campaignSchema.methods.markAsSent = function() {
  if (this.status !== 'sending') {
    throw new Error('Can only complete campaigns that are sending');
  }

  this.status = 'sent';
  this.processingProgress = 100;
  this.metrics.completedAt = new Date();

  if (!this.statusHistory) {
    this.statusHistory = [];
  }

  this.statusHistory.push({
    status: 'sent',
    changedAt: new Date(),
    reason: 'Completed sending',
  });

  return this;
};

/**
 * Mark campaign as failed
 *
 * @param {string} reason - Reason for failure
 * @returns {this} Updated campaign
 */
campaignSchema.methods.markAsFailed = function(reason) {
  this.status = 'failed';
  this.statusReason = reason;

  if (!this.statusHistory) {
    this.statusHistory = [];
  }

  this.statusHistory.push({
    status: 'failed',
    changedAt: new Date(),
    reason: reason || 'Campaign failed',
  });

  return this;
};

/**
 * Update metrics with new data
 *
 * @param {Object} data - Metrics to update
 * @returns {this} Updated campaign
 *
 * @example
 * campaign.updateMetrics({ sent: 100, delivered: 98, opened: 25 });
 * await campaign.save();
 */
campaignSchema.methods.updateMetrics = function(data = {}) {
  if (!this.metrics) {
    this.metrics = {};
  }

  const metricsFields = [
    'totalRecipients', 'sent', 'delivered', 'failed',
    'uniqueOpens', 'totalOpens', 'uniqueClicks', 'totalClicks',
    'hardBounces', 'softBounces', 'unsubscribes', 'spamComplaints',
    'forwards', 'conversions', 'revenue',
  ];

  metricsFields.forEach(field => {
    if (data[field] !== undefined) {
      this.metrics[field] = (this.metrics[field] || 0) + data[field];
    }
  });

  this.metrics.lastUpdated = new Date();

  // Update budget spent based on sent count
  if (data.sent && this.budget?.costPerEmail > 0) {
    this.budget.totalSpent = (this.budget.totalSpent || 0) + (data.sent * this.budget.costPerEmail);
  }

  return this;
};

/**
 * Add a click to the click map
 *
 * @param {string} url - URL that was clicked
 * @param {boolean} isUnique - Whether this is a unique click
 * @returns {this} Updated campaign
 */
campaignSchema.methods.recordClick = function(url, isUnique = false) {
  if (!this.metrics) {
    this.metrics = {};
  }
  if (!this.metrics.clickMap) {
    this.metrics.clickMap = [];
  }

  let clickEntry = this.metrics.clickMap.find(c => c.url === url);
  if (!clickEntry) {
    clickEntry = { url, clicks: 0, uniqueClicks: 0 };
    this.metrics.clickMap.push(clickEntry);
  }

  clickEntry.clicks++;
  if (isUnique) {
    clickEntry.uniqueClicks++;
  }

  return this;
};

/**
 * Compute the recipient list based on audience configuration
 * Returns estimated count without storing full list
 *
 * @returns {Promise<number>} Estimated recipient count
 */
campaignSchema.methods.computeAudienceSize = async function() {
  const Lead = mongoose.model('Lead');
  const query = this.buildAudienceQuery();

  const count = await Lead.countDocuments(query);

  if (!this.audience) {
    this.audience = {};
  }
  this.audience.estimatedRecipients = count;
  this.audience.estimatedAt = new Date();

  return count;
};

/**
 * Build MongoDB query from audience configuration
 *
 * @returns {Object} MongoDB query object
 */
campaignSchema.methods.buildAudienceQuery = function() {
  const query = { isActive: true };

  if (!this.audience) {
    return query;
  }

  // If targeting all, return basic query
  if (this.audience.targetAll) {
    if (this.audience.excludeUnsubscribed !== false) {
      query.unsubscribed = { $ne: true };
    }
    return query;
  }

  const conditions = [];

  // Handle segments
  if (this.audience.segments?.length > 0) {
    conditions.push({ tags: { $in: this.audience.segments } });
  }

  // Handle custom filters
  if (this.audience.filters?.length > 0) {
    const filterConditions = this.audience.filters.map(filter => {
      return this.buildFilterCondition(filter);
    });

    if (this.audience.filterLogic === 'or') {
      conditions.push({ $or: filterConditions });
    } else {
      conditions.push(...filterConditions);
    }
  }

  // Handle exclusions
  if (this.audience.excludeLeadIds?.length > 0) {
    query._id = { $nin: this.audience.excludeLeadIds };
  }

  if (this.audience.excludeTags?.length > 0) {
    query.tags = { $nin: this.audience.excludeTags };
  }

  if (this.audience.excludeUnsubscribed !== false) {
    query.unsubscribed = { $ne: true };
  }

  if (this.audience.excludePipelineStages?.length > 0) {
    query.pipelineStage = { $nin: this.audience.excludePipelineStages };
  }

  if (this.audience.assignedToEmployees?.length > 0) {
    query.assignedTo = { $in: this.audience.assignedToEmployees };
  }

  if (this.audience.minLeadScore !== undefined) {
    query.leadScore = query.leadScore || {};
    query.leadScore.$gte = this.audience.minLeadScore;
  }

  if (this.audience.maxLeadScore !== undefined) {
    query.leadScore = query.leadScore || {};
    query.leadScore.$lte = this.audience.maxLeadScore;
  }

  if (conditions.length > 0) {
    query.$and = conditions;
  }

  return query;
};

/**
 * Build a single filter condition
 *
 * @param {Object} filter - Filter configuration
 * @returns {Object} MongoDB condition
 * @private
 */
campaignSchema.methods.buildFilterCondition = function(filter) {
  const { field, operator, value, valueEnd } = filter;

  const operatorMap = {
    'equals': { [field]: value },
    'notEquals': { [field]: { $ne: value } },
    'contains': { [field]: { $regex: value, $options: 'i' } },
    'notContains': { [field]: { $not: { $regex: value, $options: 'i' } } },
    'startsWith': { [field]: { $regex: `^${value}`, $options: 'i' } },
    'endsWith': { [field]: { $regex: `${value}$`, $options: 'i' } },
    'greaterThan': { [field]: { $gt: value } },
    'lessThan': { [field]: { $lt: value } },
    'greaterThanOrEqual': { [field]: { $gte: value } },
    'lessThanOrEqual': { [field]: { $lte: value } },
    'between': { [field]: { $gte: value, $lte: valueEnd } },
    'in': { [field]: { $in: Array.isArray(value) ? value : [value] } },
    'notIn': { [field]: { $nin: Array.isArray(value) ? value : [value] } },
    'exists': { [field]: { $exists: true, $ne: null } },
    'notExists': { [field]: { $exists: false } },
    'isTrue': { [field]: true },
    'isFalse': { [field]: false },
    'before': { [field]: { $lt: new Date(value) } },
    'after': { [field]: { $gt: new Date(value) } },
    'withinDays': {
      [field]: {
        $gte: new Date(Date.now() - value * 24 * 60 * 60 * 1000),
      },
    },
  };

  return operatorMap[operator] || {};
};

/**
 * Duplicate the campaign
 *
 * @param {string} newName - Name for the duplicate
 * @param {ObjectId} userId - ID of user creating the duplicate
 * @returns {Object} New campaign object (not saved)
 */
campaignSchema.methods.duplicate = function(newName, userId) {
  const campaignData = this.toObject();

  // Remove fields that should be unique or reset
  delete campaignData._id;
  delete campaignData.id;
  delete campaignData.createdAt;
  delete campaignData.updatedAt;
  delete campaignData.slug;
  delete campaignData.queueJobId;
  delete campaignData.recipientList;
  delete campaignData.recipientListComputedAt;
  delete campaignData.archivedAt;
  delete campaignData.archivedBy;
  delete campaignData.approvedBy;
  delete campaignData.approvedAt;

  // Set new values
  campaignData.name = newName;
  campaignData.status = 'draft';
  campaignData.statusHistory = [{
    status: 'draft',
    changedAt: new Date(),
    changedBy: userId,
    reason: 'Duplicated from campaign',
  }];
  campaignData.processingProgress = 0;
  campaignData.approvalStatus = campaignData.requiresApproval ? 'pending' : 'not_required';
  campaignData.createdBy = userId;
  campaignData.updatedBy = userId;

  // Reset metrics
  campaignData.metrics = {
    totalRecipients: 0,
    sent: 0,
    delivered: 0,
    failed: 0,
    uniqueOpens: 0,
    totalOpens: 0,
    uniqueClicks: 0,
    totalClicks: 0,
    hardBounces: 0,
    softBounces: 0,
    unsubscribes: 0,
    spamComplaints: 0,
    forwards: 0,
    conversions: 0,
    revenue: 0,
    clickMap: [],
    deviceBreakdown: { desktop: 0, mobile: 0, tablet: 0, unknown: 0 },
    emailClientBreakdown: {},
    geoBreakdown: {},
    lastUpdated: new Date(),
  };

  // Reset schedule
  if (campaignData.schedule) {
    campaignData.schedule.sendAt = null;
    campaignData.schedule.nextSendAt = null;
    campaignData.schedule.lastSentAt = null;
    campaignData.schedule.sendsCompleted = 0;
  }

  // Reset A/B test results
  if (campaignData.abTest) {
    campaignData.abTest.testStartedAt = null;
    campaignData.abTest.winnerSelectedAt = null;
    campaignData.abTest.winningVariantId = null;
    campaignData.abTest.confidenceLevel = null;
    if (campaignData.abTest.variants) {
      campaignData.abTest.variants.forEach(v => {
        v.isWinner = false;
        v.metrics = {
          sent: 0, delivered: 0, opened: 0, clicked: 0,
          bounced: 0, unsubscribed: 0, conversions: 0, revenue: 0,
        };
      });
    }
  }

  // Reset budget spent
  if (campaignData.budget) {
    campaignData.budget.totalSpent = 0;
    campaignData.budget.revenueGenerated = 0;
  }

  return new (mongoose.model('Campaign'))(campaignData);
};

/**
 * Archive the campaign (soft delete)
 *
 * @param {ObjectId} userId - ID of user archiving
 * @returns {this} Updated campaign
 */
campaignSchema.methods.archive = function(userId) {
  this.archivedAt = new Date();
  this.archivedBy = userId;
  return this;
};

/**
 * Approve the campaign for sending
 *
 * @param {ObjectId} userId - ID of user approving
 * @returns {this} Updated campaign
 */
campaignSchema.methods.approve = function(userId) {
  if (this.approvalStatus !== 'pending') {
    throw new Error('Campaign is not pending approval');
  }

  this.approvalStatus = 'approved';
  this.approvedBy = userId;
  this.approvedAt = new Date();
  this.rejectionReason = null;

  return this;
};

/**
 * Reject the campaign
 *
 * @param {ObjectId} userId - ID of user rejecting
 * @param {string} reason - Rejection reason
 * @returns {this} Updated campaign
 */
campaignSchema.methods.reject = function(userId, reason) {
  if (this.approvalStatus !== 'pending') {
    throw new Error('Campaign is not pending approval');
  }

  this.approvalStatus = 'rejected';
  this.rejectionReason = reason;

  return this;
};

/**
 * Select A/B test winner
 *
 * @param {string} variantId - ID of winning variant
 * @param {number} confidenceLevel - Statistical confidence level
 * @returns {this} Updated campaign
 */
campaignSchema.methods.selectWinner = function(variantId, confidenceLevel = 95) {
  if (!this.abTest?.enabled) {
    throw new Error('A/B testing is not enabled for this campaign');
  }

  const variant = this.abTest.variants.find(v => v.variantId === variantId);
  if (!variant) {
    throw new Error(`Variant ${variantId} not found`);
  }

  // Mark all as not winner, then mark the selected one
  this.abTest.variants.forEach(v => {
    v.isWinner = v.variantId === variantId;
  });

  this.abTest.winningVariantId = variantId;
  this.abTest.winnerSelectedAt = new Date();
  this.abTest.confidenceLevel = confidenceLevel;

  return this;
};

/**
 * Get the best performing A/B variant
 *
 * @returns {Object|null} Best performing variant or null
 */
campaignSchema.methods.getBestVariant = function() {
  if (!this.abTest?.enabled || !this.abTest.variants?.length) {
    return null;
  }

  const criteria = this.abTest.winnerCriteria || 'openRate';

  return this.abTest.variants.reduce((best, current) => {
    const getRate = (v) => {
      const m = v.metrics || {};
      if (m.delivered === 0 && m.sent === 0) return 0;
      const base = m.delivered || m.sent || 1;
      switch (criteria) {
        case 'openRate': return (m.opened || 0) / base;
        case 'clickRate': return (m.clicked || 0) / base;
        case 'conversionRate': return (m.conversions || 0) / base;
        case 'revenue': return m.revenue || 0;
        default: return (m.opened || 0) / base;
      }
    };

    return getRate(current) > getRate(best) ? current : best;
  }, this.abTest.variants[0]);
};

// ============================================================================
// STATIC METHODS
// ============================================================================

/**
 * Find campaign by slug
 *
 * @param {string} slug - Campaign slug
 * @returns {Promise<Campaign|null>}
 */
campaignSchema.statics.findBySlug = async function(slug) {
  return this.findOne({ slug: slug.toLowerCase(), archivedAt: null });
};

/**
 * Get scheduled campaigns ready to send
 *
 * @returns {Promise<Campaign[]>} Array of campaigns ready to send
 */
campaignSchema.statics.getReadyToSend = async function() {
  const now = new Date();

  return this.find({
    status: 'scheduled',
    archivedAt: null,
    $or: [
      { 'schedule.sendAt': { $lte: now } },
      { 'schedule.nextSendAt': { $lte: now } },
    ],
  }).populate('template').sort({ 'schedule.sendAt': 1 });
};

/**
 * Get campaigns by status
 *
 * @param {string|string[]} status - Status or array of statuses
 * @param {Object} options - Query options
 * @returns {Promise<Campaign[]>}
 */
campaignSchema.statics.getByStatus = async function(status, options = {}) {
  const statuses = Array.isArray(status) ? status : [status];
  const { limit = 50, skip = 0, sort = '-createdAt' } = options;

  return this.find({
    status: { $in: statuses },
    archivedAt: null,
  })
    .populate('template', 'name slug category')
    .populate('createdBy', 'name email')
    .sort(sort)
    .skip(skip)
    .limit(limit);
};

/**
 * Get campaigns by type
 *
 * @param {string} type - Campaign type
 * @param {Object} options - Query options
 * @returns {Promise<Campaign[]>}
 */
campaignSchema.statics.getByType = async function(type, options = {}) {
  const { status, limit = 50 } = options;
  const query = { type, archivedAt: null };

  if (status) {
    query.status = status;
  }

  return this.find(query)
    .populate('template', 'name slug')
    .sort('-createdAt')
    .limit(limit);
};

/**
 * Get campaigns for a specific template
 *
 * @param {ObjectId} templateId - Template ID
 * @returns {Promise<Campaign[]>}
 */
campaignSchema.statics.getByTemplate = async function(templateId) {
  return this.find({
    template: templateId,
    archivedAt: null,
  }).sort('-createdAt');
};

/**
 * Get campaigns in a sequence
 *
 * @param {ObjectId} sequenceId - Sequence ID
 * @returns {Promise<Campaign[]>} Campaigns sorted by sequence step
 */
campaignSchema.statics.getBySequence = async function(sequenceId) {
  return this.find({
    sequenceId,
    archivedAt: null,
  }).sort({ sequenceStep: 1 });
};

/**
 * Search campaigns by name or tags
 *
 * @param {string} query - Search query
 * @param {Object} options - Search options
 * @returns {Promise<Campaign[]>}
 */
campaignSchema.statics.search = async function(query, options = {}) {
  const { status, type, category, limit = 50 } = options;

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
  if (category) searchQuery.category = category;

  return this.find(searchQuery)
    .populate('template', 'name slug')
    .sort('-updatedAt')
    .limit(limit);
};

/**
 * Get top performing campaigns
 *
 * @param {string} metric - Metric to sort by
 * @param {number} limit - Number to return
 * @returns {Promise<Campaign[]>}
 */
campaignSchema.statics.getTopPerforming = async function(metric = 'openRate', limit = 10) {
  const campaigns = await this.find({
    status: 'sent',
    archivedAt: null,
    'metrics.delivered': { $gte: 100 },
  });

  return campaigns
    .sort((a, b) => {
      const rateA = a[metric] || 0;
      const rateB = b[metric] || 0;
      return rateB - rateA;
    })
    .slice(0, limit);
};

/**
 * Get aggregate metrics across all campaigns
 *
 * @param {Object} options - Filter options
 * @returns {Promise<Object>}
 */
campaignSchema.statics.getAggregateMetrics = async function(options = {}) {
  const { startDate, endDate, type, category } = options;

  const match = {
    status: { $in: ['sent', 'sending'] },
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
        totalCampaigns: { $sum: 1 },
        totalSent: { $sum: '$metrics.sent' },
        totalDelivered: { $sum: '$metrics.delivered' },
        totalOpens: { $sum: '$metrics.uniqueOpens' },
        totalClicks: { $sum: '$metrics.uniqueClicks' },
        totalBounces: { $sum: { $add: ['$metrics.hardBounces', '$metrics.softBounces'] } },
        totalUnsubscribes: { $sum: '$metrics.unsubscribes' },
        totalConversions: { $sum: '$metrics.conversions' },
        totalRevenue: { $sum: '$metrics.revenue' },
        totalSpent: { $sum: '$budget.totalSpent' },
      },
    },
  ]);

  if (result.length === 0) {
    return {
      totalCampaigns: 0,
      totalSent: 0,
      avgOpenRate: 0,
      avgClickRate: 0,
      avgBounceRate: 0,
      totalRevenue: 0,
      totalSpent: 0,
      roi: 0,
    };
  }

  const stats = result[0];
  return {
    totalCampaigns: stats.totalCampaigns,
    totalSent: stats.totalSent,
    totalDelivered: stats.totalDelivered,
    avgOpenRate: stats.totalDelivered > 0
      ? Math.round((stats.totalOpens / stats.totalDelivered) * 10000) / 100
      : 0,
    avgClickRate: stats.totalDelivered > 0
      ? Math.round((stats.totalClicks / stats.totalDelivered) * 10000) / 100
      : 0,
    avgBounceRate: stats.totalSent > 0
      ? Math.round((stats.totalBounces / stats.totalSent) * 10000) / 100
      : 0,
    avgConversionRate: stats.totalDelivered > 0
      ? Math.round((stats.totalConversions / stats.totalDelivered) * 10000) / 100
      : 0,
    totalRevenue: stats.totalRevenue,
    totalSpent: stats.totalSpent,
    roi: stats.totalSpent > 0
      ? Math.round(((stats.totalRevenue - stats.totalSpent) / stats.totalSpent) * 10000) / 100
      : 0,
  };
};

/**
 * Get campaigns pending approval
 *
 * @returns {Promise<Campaign[]>}
 */
campaignSchema.statics.getPendingApproval = async function() {
  return this.find({
    requiresApproval: true,
    approvalStatus: 'pending',
    archivedAt: null,
  })
    .populate('createdBy', 'name email')
    .populate('template', 'name slug')
    .sort('-createdAt');
};

/**
 * Generate a unique slug from a name
 *
 * @param {string} name - Campaign name
 * @returns {Promise<string>} Unique slug
 */
campaignSchema.statics.generateSlug = async function(name) {
  let baseSlug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

  let slug = baseSlug;
  let counter = 1;

  while (await this.findOne({ slug })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
};

/**
 * Get recurring campaigns due to run
 *
 * @returns {Promise<Campaign[]>}
 */
campaignSchema.statics.getRecurringDue = async function() {
  const now = new Date();

  return this.find({
    type: 'recurring',
    status: 'scheduled',
    archivedAt: null,
    'schedule.nextSendAt': { $lte: now },
    $or: [
      { 'schedule.endDate': null },
      { 'schedule.endDate': { $gte: now } },
    ],
    $or: [
      { 'schedule.maxSends': null },
      { $expr: { $lt: ['$schedule.sendsCompleted', '$schedule.maxSends'] } },
    ],
  }).populate('template');
};

// ============================================================================
// PRE-SAVE MIDDLEWARE
// ============================================================================

campaignSchema.pre('save', async function(next) {
  // Update timestamp
  this.updatedAt = new Date();

  // Auto-generate slug if not provided
  if (this.isNew && !this.slug) {
    this.slug = await mongoose.model('Campaign').generateSlug(this.name);
  }

  // Initialize sender if not set
  if (!this.sender) {
    this.sender = {
      name: 'EmenTech',
      email: 'noreply@ementech.co.ke',
    };
  }

  // Initialize metrics if not set
  if (!this.metrics) {
    this.metrics = {
      totalRecipients: 0,
      sent: 0,
      delivered: 0,
      failed: 0,
      uniqueOpens: 0,
      totalOpens: 0,
      uniqueClicks: 0,
      totalClicks: 0,
      hardBounces: 0,
      softBounces: 0,
      unsubscribes: 0,
      spamComplaints: 0,
      forwards: 0,
      conversions: 0,
      revenue: 0,
      clickMap: [],
      deviceBreakdown: { desktop: 0, mobile: 0, tablet: 0, unknown: 0 },
      lastUpdated: new Date(),
    };
  }

  // Initialize status history if new
  if (this.isNew && (!this.statusHistory || this.statusHistory.length === 0)) {
    this.statusHistory = [{
      status: 'draft',
      changedAt: new Date(),
      changedBy: this.createdBy,
      reason: 'Campaign created',
    }];
  }

  // Validate A/B test configuration
  if (this.abTest?.enabled && this.abTest.variants?.length > 0) {
    // Ensure variant weights sum to 100
    const totalWeight = this.abTest.variants.reduce((sum, v) => sum + (v.weight || 0), 0);
    if (totalWeight !== 100) {
      // Auto-adjust weights to sum to 100
      const perVariant = Math.floor(100 / this.abTest.variants.length);
      const remainder = 100 - (perVariant * this.abTest.variants.length);
      this.abTest.variants.forEach((v, i) => {
        v.weight = perVariant + (i === 0 ? remainder : 0);
      });
    }
  }

  // Set approval status based on requirement
  if (this.isNew) {
    this.approvalStatus = this.requiresApproval ? 'pending' : 'not_required';
  }

  next();
});

// ============================================================================
// MODEL EXPORT
// ============================================================================

const Campaign = mongoose.model('Campaign', campaignSchema);

export default Campaign;
