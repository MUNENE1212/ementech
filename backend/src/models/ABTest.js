import mongoose from 'mongoose';

/**
 * A/B Test Model - Phase 5: A/B Testing & Optimization
 *
 * This model supports:
 * - A/B test identification and configuration
 * - Multiple test types (subject_line, content, sender, send_time, template, landing_page)
 * - Variant management with traffic allocation
 * - Statistical significance tracking
 * - Winner selection based on configurable criteria
 * - Test duration and scheduling
 * - Results tracking and reporting
 *
 * @version 1.0.0
 * @since 2026-01-23
 */

// ============================================================================
// SUB-SCHEMAS
// ============================================================================

/**
 * Variant Configuration Sub-Schema
 * Defines a single test variant with its configuration and metrics
 */
const variantSchema = new mongoose.Schema({
  /** Variant identifier (A, B, C, D, E, etc.) */
  variantId: {
    type: String,
    required: true,
    uppercase: true,
    maxlength: 10,
  },
  /** Human-readable name for this variant */
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },
  /** Description of what makes this variant different */
  description: {
    type: String,
    trim: true,
    maxlength: 1000,
  },
  /** Traffic allocation percentage (must sum to 100 across all variants) */
  weight: {
    type: Number,
    required: true,
    min: 1,
    max: 100,
    default: 50,
  },
  /** For subject_line tests: the subject line to test */
  subject: {
    type: String,
    trim: true,
    maxlength: 200,
  },
  /** For content tests: the HTML content to test */
  content: {
    type: String,
  },
  /** For sender tests: the sender name */
  senderName: {
    type: String,
    trim: true,
    maxlength: 200,
  },
  /** For sender tests: the sender email */
  senderEmail: {
    type: String,
    trim: true,
    lowercase: true,
  },
  /** For send_time tests: the time to send (HH:MM format) */
  sendTime: {
    type: String,
    match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (use HH:MM)'],
  },
  /** For send_time tests: the timezone */
  sendTimezone: {
    type: String,
    default: 'Africa/Nairobi',
  },
  /** For template tests: the template ID to use */
  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EmailTemplate',
  },
  /** For landing_page tests: the landing page URL */
  landingPageUrl: {
    type: String,
    trim: true,
  },
  /** Whether this variant has been declared the winner */
  isWinner: {
    type: Boolean,
    default: false,
  },
  /** When this variant was declared the winner */
  winnerDeclaredAt: Date,
  /** Metrics for this variant */
  metrics: {
    /** Number of recipients assigned to this variant */
    recipients: { type: Number, default: 0 },
    /** Number of emails sent for this variant */
    sent: { type: Number, default: 0 },
    /** Number of emails delivered */
    delivered: { type: Number, default: 0 },
    /** Number of unique opens */
    uniqueOpens: { type: Number, default: 0 },
    /** Total opens (including re-opens) */
    totalOpens: { type: Number, default: 0 },
    /** Number of unique clicks */
    uniqueClicks: { type: Number, default: 0 },
    /** Total clicks */
    totalClicks: { type: Number, default: 0 },
    /** Number of bounces */
    bounces: { type: Number, default: 0 },
    /** Number of unsubscribes */
    unsubscribes: { type: Number, default: 0 },
    /** Number of conversions/goal completions */
    conversions: { type: Number, default: 0 },
    /** Revenue generated from this variant */
    revenue: { type: Number, default: 0, min: 0 },
    /** Custom goal completions */
    customGoalCompletions: { type: Number, default: 0 },
  },
}, { _id: false });

/**
 * Statistical Significance Sub-Schema
 * Configures and tracks statistical significance calculations
 */
const significanceConfigSchema = new mongoose.Schema({
  /** Confidence level for significance testing (90, 95, 99) */
  confidenceLevel: {
    type: Number,
    enum: [90, 95, 99],
    default: 95,
  },
  /** Minimum sample size per variant before declaring significance */
  minSampleSize: {
    type: Number,
    default: 100,
    min: 10,
  },
  /** Type of statistical test to use */
  testType: {
    type: String,
    enum: ['z-test', 'chi-square', 't-test', 'bayesian'],
    default: 'z-test',
  },
  /** Whether statistical significance has been achieved */
  isSignificant: {
    type: Boolean,
    default: false,
  },
  /** P-value from statistical test */
  pValue: {
    type: Number,
    min: 0,
    max: 1,
  },
  /** Confidence interval lower bound */
  confidenceIntervalLower: Number,
  /** Confidence interval upper bound */
  confidenceIntervalUpper: Number,
  /** Effect size (Cohen's d or similar) */
  effectSize: Number,
  /** When significance was last calculated */
  lastCalculatedAt: Date,
}, { _id: false });

/**
 * Test Duration Sub-Schema
 * Configures test timing and duration
 */
const durationConfigSchema = new mongoose.Schema({
  /** When the test should start (null = immediately) */
  startAt: {
    type: Date,
    default: null,
  },
  /** When the test must end (null = no fixed end) */
  endAt: {
    type: Date,
    default: null,
  },
  /** Minimum duration before winner can be declared (hours) */
  minDurationHours: {
    type: Number,
    default: 24,
    min: 1,
  },
  /** Maximum duration before auto-ending (hours, null = unlimited) */
  maxDurationHours: {
    type: Number,
    default: null,
    min: 1,
  },
  /** Actual start time (when test began running) */
  actualStartAt: Date,
  /** Actual end time (when test completed or was stopped) */
  actualEndAt: Date,
}, { _id: false });

/**
 * Traffic Allocation Sub-Schema
 * Configures how traffic is distributed among variants
 */
const trafficAllocationSchema = new mongoose.Schema({
  /** How traffic is allocated */
  strategy: {
    type: String,
    enum: ['equal', 'weighted', 'thompson_sampling', 'epsilon_greedy'],
    default: 'equal',
  },
  /** For weighted: custom weights per variant (stored in variant.weight) */
  /** For thompson_sampling: exploration rate */
  explorationRate: {
    type: Number,
    min: 0,
    max: 1,
    default: 0.1,
  },
  /** For epsilon_greedy: epsilon value */
  epsilon: {
    type: Number,
    min: 0,
    max: 1,
    default: 0.1,
  },
  /** Whether to auto-allocate to winner during test */
  autoOptimize: {
    type: Boolean,
    default: false,
  },
  /** Percentage of traffic for test phase (rest gets winner if declared) */
  testTrafficPercentage: {
    type: Number,
    min: 10,
    max: 100,
    default: 100,
  },
}, { _id: false });

/**
 * Results Summary Sub-Schema
 * Aggregated test results and analysis
 */
const resultsSummarySchema = new mongoose.Schema({
  /** Total recipients across all variants */
  totalRecipients: { type: Number, default: 0 },
  /** Total sent across all variants */
  totalSent: { type: Number, default: 0 },
  /** Total delivered across all variants */
  totalDelivered: { type: Number, default: 0 },
  /** Total opens across all variants */
  totalOpens: { type: Number, default: 0 },
  /** Total clicks across all variants */
  totalClicks: { type: Number, default: 0 },
  /** Total conversions across all variants */
  totalConversions: { type: Number, default: 0 },
  /** Total revenue across all variants */
  totalRevenue: { type: Number, default: 0 },
  /** Overall conversion rate */
  overallConversionRate: { type: Number, default: 0 },
  /** Overall open rate */
  overallOpenRate: { type: Number, default: 0 },
  /** Overall click rate */
  overallClickRate: { type: Number, default: 0 },
  /** Improvement percentage of winner over baseline */
  improvementPercentage: Number,
  /** Estimated lift from using winner */
  estimatedLift: Number,
  /** Recommendations based on test results */
  recommendations: [String],
  /** When results were last updated */
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
}, { _id: false });

// ============================================================================
// MAIN AB TEST SCHEMA
// ============================================================================

const abTestSchema = new mongoose.Schema({
  // -------------------------------------------------------------------------
  // IDENTIFICATION FIELDS
  // -------------------------------------------------------------------------

  /** Human-readable test name */
  name: {
    type: String,
    required: [true, 'Test name is required'],
    trim: true,
    maxlength: [200, 'Test name cannot exceed 200 characters'],
  },

  /** URL-friendly identifier for the test */
  slug: {
    type: String,
    required: [true, 'Test slug is required'],
    trim: true,
    lowercase: true,
    match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'],
    unique: true,
    index: true,
  },

  /** Detailed description of the test */
  description: {
    type: String,
    maxlength: [2000, 'Description cannot exceed 2000 characters'],
  },

  // -------------------------------------------------------------------------
  // TEST TYPE & CONFIGURATION
  // -------------------------------------------------------------------------

  /** What element is being tested */
  testType: {
    type: String,
    enum: [
      'subject_line',    // Testing different subject lines
      'content',         // Testing different email content
      'sender',          // Testing different sender names/emails
      'send_time',       // Testing different send times
      'template',        // Testing different email templates
      'landing_page',    // Testing different landing pages
      'multivariate',    // Testing multiple variables simultaneously
      'custom',          // Custom test type
    ],
    required: [true, 'Test type is required'],
    index: true,
  },

  /** Category for organization */
  category: {
    type: String,
    enum: [
      'engagement',
      'conversion',
      'retention',
      'acquisition',
      'transactional',
      'promotional',
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
  // TEST VARIANTS
  // -------------------------------------------------------------------------

  /** Test variants (minimum 2, maximum 10) */
  variants: {
    type: [variantSchema],
    validate: {
      validator: function(v) {
        return v.length >= 2 && v.length <= 10;
      },
      message: 'Test must have between 2 and 10 variants',
    },
  },

  /** Control variant (baseline) - variantId of the control */
  controlVariantId: {
    type: String,
    required: true,
  },

  // -------------------------------------------------------------------------
  // WINNER SELECTION CONFIGURATION
  // -------------------------------------------------------------------------

  /** Metric to use for determining winner */
  winnerCriteria: {
    type: String,
    enum: [
      'open_rate',
      'click_rate',
      'click_to_open_rate',
      'conversion_rate',
      'revenue',
      'unsubscribes',     // Lower is better
      'bounces',          // Lower is better
      'custom_goal',
    ],
    default: 'open_rate',
  },

  /** Higher or lower is better for winner criteria */
  winnerDirection: {
    type: String,
    enum: ['higher', 'lower'],
    default: 'higher',
  },

  /** Minimum improvement threshold for declaring winner (percentage) */
  minImprovementThreshold: {
    type: Number,
    default: 5,
    min: 0,
    max: 100,
  },

  /** Whether to automatically select and apply winner */
  autoSelectWinner: {
    type: Boolean,
    default: false,
  },

  /** ID of the winning variant (when winner is selected) */
  winningVariantId: {
    type: String,
    default: null,
  },

  /** When winner was selected */
  winnerSelectedAt: Date,

  /** Who selected the winner (manual selection) */
  winnerSelectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },

  /** Reason for winner selection */
  winnerSelectionReason: String,

  // -------------------------------------------------------------------------
  // STATISTICAL SIGNIFICANCE
  // -------------------------------------------------------------------------

  significance: significanceConfigSchema,

  // -------------------------------------------------------------------------
  // TEST DURATION
  // -------------------------------------------------------------------------

  duration: durationConfigSchema,

  // -------------------------------------------------------------------------
  // TRAFFIC ALLOCATION
  // -------------------------------------------------------------------------

  trafficAllocation: trafficAllocationSchema,

  // -------------------------------------------------------------------------
  // ASSOCIATED RESOURCES
  // -------------------------------------------------------------------------

  /** Associated campaign (if testing within a campaign) */
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    index: true,
  },

  /** Associated sequence (if testing within a sequence) */
  sequenceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sequence',
    index: true,
  },

  /** Associated template (if testing template variants) */
  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EmailTemplate',
    index: true,
  },

  // -------------------------------------------------------------------------
  // TEST STATUS & WORKFLOW
  // -------------------------------------------------------------------------

  /** Current test status */
  status: {
    type: String,
    enum: [
      'draft',        // Being configured
      'scheduled',    // Scheduled to start
      'running',      // Currently running
      'paused',       // Temporarily paused
      'completed',    // Finished with winner
      'cancelled',    // Cancelled before completion
      'inconclusive', // Finished without clear winner
    ],
    default: 'draft',
    index: true,
  },

  /** Reason for current status */
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
  // RESULTS & METRICS
  // -------------------------------------------------------------------------

  /** Aggregated test results */
  results: resultsSummarySchema,

  /** Detailed variant comparison data */
  variantComparison: [{
    variantId: String,
    comparedToVariantId: String,
    metricName: String,
    difference: Number,
    differencePercentage: Number,
    isSignificant: Boolean,
    zScore: Number,
  }],

  // -------------------------------------------------------------------------
  // INTERNAL NOTES & METADATA
  // -------------------------------------------------------------------------

  /** Hypothesis being tested */
  hypothesis: {
    type: String,
    maxlength: [1000, 'Hypothesis cannot exceed 1000 characters'],
  },

  /** Expected outcome */
  expectedOutcome: String,

  /** Internal notes */
  notes: {
    type: String,
    maxlength: [5000, 'Notes cannot exceed 5000 characters'],
  },

  /** Priority for processing */
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal',
  },

  // -------------------------------------------------------------------------
  // AUDIT FIELDS
  // -------------------------------------------------------------------------

  /** User who created the test */
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  /** User who last updated the test */
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

  /** When the test was archived (soft delete) */
  archivedAt: Date,

  /** Who archived the test */
  archivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
});

// ============================================================================
// INDEXES
// ============================================================================

// Status and type lookup
abTestSchema.index({ status: 1, testType: 1 });

// Campaign/sequence association
abTestSchema.index({ campaignId: 1, status: 1 });
abTestSchema.index({ sequenceId: 1, status: 1 });

// Created by lookup
abTestSchema.index({ createdBy: 1, createdAt: -1 });

// Tag-based filtering
abTestSchema.index({ tags: 1 });

// Winner selection lookup
abTestSchema.index({ status: 1, autoSelectWinner: 1, duration: 1 });

// ============================================================================
// VIRTUAL PROPERTIES
// ============================================================================

/**
 * Calculate completion percentage
 */
abTestSchema.virtual('completionPercentage').get(function() {
  if (!this.duration.actualStartAt) return 0;
  if (this.status === 'completed' || this.status === 'cancelled' || this.status === 'inconclusive') {
    return 100;
  }

  const start = new Date(this.duration.actualStartAt).getTime();
  const now = Date.now();

  // If max duration is set, use that; otherwise use min duration as baseline
  const maxDuration = this.duration.maxDurationHours || this.duration.minDurationHours * 2;
  const end = start + (maxDuration * 60 * 60 * 1000);

  const percentage = Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
  return Math.round(percentage * 100) / 100;
});

/**
 * Check if test is editable
 */
abTestSchema.virtual('isEditable').get(function() {
  return ['draft', 'scheduled'].includes(this.status);
});

/**
 * Check if test is currently running
 */
abTestSchema.virtual('isRunning').get(function() {
  return this.status === 'running';
});

/**
 * Get the control variant
 */
abTestSchema.virtual('controlVariant').get(function() {
  return this.variants?.find(v => v.variantId === this.controlVariantId);
});

/**
 * Get the winning variant (if selected)
 */
abTestSchema.virtual('winningVariant').get(function() {
  if (!this.winningVariantId) return null;
  return this.variants?.find(v => v.variantId === this.winningVariantId);
});

/**
 * Check if test has reached minimum duration
 */
abTestSchema.virtual('hasReachedMinDuration').get(function() {
  if (!this.duration.actualStartAt) return false;

  const elapsed = Date.now() - new Date(this.duration.actualStartAt).getTime();
  const minDurationMs = this.duration.minDurationHours * 60 * 60 * 1000;

  return elapsed >= minDurationMs;
});

// Ensure virtuals are included in JSON output
abTestSchema.set('toJSON', { virtuals: true });
abTestSchema.set('toObject', { virtuals: true });

// ============================================================================
// INSTANCE METHODS
// ============================================================================

/**
 * Update test status with history tracking
 *
 * @param {string} newStatus - The new status
 * @param {ObjectId} userId - ID of user making the change
 * @param {string} [reason] - Optional reason for the change
 * @returns {this} Updated test
 *
 * @example
 * await abTest.changeStatus('running', userId, 'Test started');
 * await abTest.save();
 */
abTestSchema.methods.changeStatus = function(newStatus, userId, reason) {
  const validStatuses = ['draft', 'scheduled', 'running', 'paused', 'completed', 'cancelled', 'inconclusive'];
  if (!validStatuses.includes(newStatus)) {
    throw new Error(`Invalid status: ${newStatus}`);
  }

  const oldStatus = this.status;

  // Validate status transitions
  const validTransitions = {
    'draft': ['scheduled', 'running', 'cancelled'],
    'scheduled': ['running', 'paused', 'draft', 'cancelled'],
    'running': ['paused', 'completed', 'cancelled', 'inconclusive'],
    'paused': ['running', 'cancelled', 'completed'],
    'completed': [], // Terminal state
    'cancelled': [], // Terminal state
    'inconclusive': [], // Terminal state
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

  // Update timestamps for running tests
  if (newStatus === 'running' && !this.duration.actualStartAt) {
    this.duration.actualStartAt = new Date();
  }

  if (['completed', 'cancelled', 'inconclusive'].includes(newStatus) && !this.duration.actualEndAt) {
    this.duration.actualEndAt = new Date();
  }

  return this;
};

/**
 * Get a variant by ID
 *
 * @param {string} variantId - Variant ID to find
 * @returns {Object|null} Variant or null if not found
 */
abTestSchema.methods.getVariant = function(variantId) {
  return this.variants?.find(v => v.variantId === variantId) || null;
};

/**
 * Update metrics for a specific variant
 *
 * @param {string} variantId - Variant ID
 * @param {Object} metricsData - Metrics to update
 * @returns {this} Updated test
 *
 * @example
 * abTest.updateVariantMetrics('A', { opens: 10, clicks: 5 });
 * await abTest.save();
 */
abTestSchema.methods.updateVariantMetrics = function(variantId, metricsData = {}) {
  const variant = this.getVariant(variantId);
  if (!variant) {
    throw new Error(`Variant ${variantId} not found`);
  }

  if (!variant.metrics) {
    variant.metrics = {};
  }

  // Update metrics
  const metricFields = [
    'recipients', 'sent', 'delivered', 'uniqueOpens', 'totalOpens',
    'uniqueClicks', 'totalClicks', 'bounces', 'unsubscribes',
    'conversions', 'revenue', 'customGoalCompletions',
  ];

  metricFields.forEach(field => {
    if (metricsData[field] !== undefined) {
      variant.metrics[field] = (variant.metrics[field] || 0) + metricsData[field];
    }
  });

  // Update aggregated results
  this.recalculateResults();

  return this;
};

/**
 * Recalculate aggregated results from variant metrics
 *
 * @returns {this} Updated test
 * @private
 */
abTestSchema.methods.recalculateResults = function() {
  if (!this.variants || this.variants.length === 0) {
    return this;
  }

  if (!this.results) {
    this.results = {};
  }

  // Sum up all variant metrics
  this.results.totalRecipients = this.variants.reduce((sum, v) => sum + (v.metrics?.recipients || 0), 0);
  this.results.totalSent = this.variants.reduce((sum, v) => sum + (v.metrics?.sent || 0), 0);
  this.results.totalDelivered = this.variants.reduce((sum, v) => sum + (v.metrics?.delivered || 0), 0);
  this.results.totalOpens = this.variants.reduce((sum, v) => sum + (v.metrics?.uniqueOpens || 0), 0);
  this.results.totalClicks = this.variants.reduce((sum, v) => sum + (v.metrics?.uniqueClicks || 0), 0);
  this.results.totalConversions = this.variants.reduce((sum, v) => sum + (v.metrics?.conversions || 0), 0);
  this.results.totalRevenue = this.variants.reduce((sum, v) => sum + (v.metrics?.revenue || 0), 0);

  // Calculate rates
  this.results.overallOpenRate = this.results.totalDelivered > 0
    ? Math.round((this.results.totalOpens / this.results.totalDelivered) * 10000) / 100
    : 0;

  this.results.overallClickRate = this.results.totalDelivered > 0
    ? Math.round((this.results.totalClicks / this.results.totalDelivered) * 10000) / 100
    : 0;

  this.results.overallConversionRate = this.results.totalDelivered > 0
    ? Math.round((this.results.totalConversions / this.results.totalDelivered) * 10000) / 100
    : 0;

  this.results.lastUpdated = new Date();

  return this;
};

/**
 * Select a winner for the test
 *
 * @param {string} variantId - ID of winning variant
 * @param {ObjectId} userId - ID of user selecting winner
 * @param {string} [reason] - Reason for selection
 * @returns {this} Updated test
 *
 * @example
 * await abTest.selectWinner('B', userId, 'Variant B showed 15% improvement');
 * await abTest.save();
 */
abTestSchema.methods.selectWinner = function(variantId, userId, reason) {
  if (this.status !== 'running' && this.status !== 'paused') {
    throw new Error('Can only select winner for running or paused tests');
  }

  const variant = this.getVariant(variantId);
  if (!variant) {
    throw new Error(`Variant ${variantId} not found`);
  }

  // Unmark all variants as winner, then mark the selected one
  this.variants.forEach(v => {
    v.isWinner = false;
    v.winnerDeclaredAt = null;
  });

  variant.isWinner = true;
  variant.winnerDeclaredAt = new Date();

  this.winningVariantId = variantId;
  this.winnerSelectedAt = new Date();
  this.winnerSelectedBy = userId;
  this.winnerSelectionReason = reason;

  // Calculate improvement percentage
  const control = this.controlVariant;
  if (control && control.metrics) {
    const controlRate = this.getVariantRate(control);
    const winnerRate = this.getVariantRate(variant);

    if (controlRate > 0) {
      this.results.improvementPercentage = Math.round(((winnerRate - controlRate) / controlRate) * 10000) / 100;

      // Calculate estimated lift
      if (this.results.totalRevenue > 0) {
        const baselineRevenue = control.metrics.revenue || 0;
        this.results.estimatedLift = Math.round((this.results.totalRevenue - baselineRevenue) * 100) / 100;
      }
    }
  }

  return this;
};

/**
 * Get the rate for a variant based on winner criteria
 *
 * @param {Object} variant - Variant object
 * @returns {number} Rate value
 * @private
 */
abTestSchema.methods.getVariantRate = function(variant) {
  if (!variant.metrics) return 0;

  const metrics = variant.metrics;
  const base = metrics.delivered || metrics.sent || metrics.recipients || 1;

  switch (this.winnerCriteria) {
    case 'open_rate':
      return base > 0 ? (metrics.uniqueOpens || 0) / base : 0;
    case 'click_rate':
      return base > 0 ? (metrics.uniqueClicks || 0) / base : 0;
    case 'click_to_open_rate':
      return (metrics.uniqueOpens || 0) > 0
        ? (metrics.uniqueClicks || 0) / metrics.uniqueOpens
        : 0;
    case 'conversion_rate':
      return base > 0 ? (metrics.conversions || 0) / base : 0;
    case 'revenue':
      return metrics.revenue || 0;
    case 'unsubscribes':
      return base > 0 ? (metrics.unsubscribes || 0) / base : 0;
    case 'bounces':
      return base > 0 ? (metrics.bounces || 0) / base : 0;
    case 'custom_goal':
      return base > 0 ? (metrics.customGoalCompletions || 0) / base : 0;
    default:
      return base > 0 ? (metrics.uniqueOpens || 0) / base : 0;
  }
};

/**
 * Get the best performing variant based on winner criteria
 *
 * @returns {Object|null} Best performing variant or null
 */
abTestSchema.methods.getBestVariant = function() {
  if (!this.variants || this.variants.length === 0) {
    return null;
  }

  return this.variants.reduce((best, current) => {
    const bestRate = this.getVariantRate(best);
    const currentRate = this.getVariantRate(current);

    if (this.winnerDirection === 'higher') {
      return currentRate > bestRate ? current : best;
    } else {
      return currentRate < bestRate ? current : best;
    }
  }, this.variants[0]);
};

/**
 * Archive the test (soft delete)
 *
 * @param {ObjectId} userId - ID of user archiving
 * @returns {this} Updated test
 */
abTestSchema.methods.archive = function(userId) {
  this.archivedAt = new Date();
  this.archivedBy = userId;
  return this;
};

/**
 * Duplicate the test
 *
 * @param {string} newName - Name for the duplicate
 * @param {ObjectId} userId - ID of user creating the duplicate
 * @returns {Object} New test object (not saved)
 *
 * @example
 * const duplicate = abTest.duplicate('Test Copy v2', userId);
 * await duplicate.save();
 */
abTestSchema.methods.duplicate = function(newName, userId) {
  const testData = this.toObject();

  // Remove fields that should be unique or reset
  delete testData._id;
  delete testData.id;
  delete testData.createdAt;
  delete testData.updatedAt;
  delete testData.slug;
  delete testData.archivedAt;
  delete testData.archivedBy;

  // Set new values
  testData.name = newName;
  testData.status = 'draft';
  testData.statusHistory = [{
    status: 'draft',
    changedAt: new Date(),
    changedBy: userId,
    reason: 'Duplicated from test',
  }];
  testData.createdBy = userId;
  testData.updatedBy = userId;

  // Reset results
  testData.results = {
    totalRecipients: 0,
    totalSent: 0,
    totalDelivered: 0,
    totalOpens: 0,
    totalClicks: 0,
    totalConversions: 0,
    totalRevenue: 0,
    overallConversionRate: 0,
    overallOpenRate: 0,
    overallClickRate: 0,
    lastUpdated: new Date(),
  };

  // Reset duration
  if (testData.duration) {
    testData.duration.actualStartAt = null;
    testData.duration.actualEndAt = null;
  }

  // Reset variant metrics
  if (testData.variants) {
    testData.variants.forEach(v => {
      v.isWinner = false;
      v.winnerDeclaredAt = null;
      if (v.metrics) {
        v.metrics = {
          recipients: 0, sent: 0, delivered: 0, uniqueOpens: 0, totalOpens: 0,
          uniqueClicks: 0, totalClicks: 0, bounces: 0, unsubscribes: 0,
          conversions: 0, revenue: 0, customGoalCompletions: 0,
        };
      }
    });
  }

  // Reset winner selection
  testData.winningVariantId = null;
  testData.winnerSelectedAt = null;
  testData.winnerSelectedBy = null;
  testData.winnerSelectionReason = null;

  // Reset significance
  if (testData.significance) {
    testData.significance.isSignificant = false;
    testData.significance.pValue = null;
    testData.significance.lastCalculatedAt = null;
  }

  return new (mongoose.model('ABTest'))(testData);
};

// ============================================================================
// STATIC METHODS
// ============================================================================

/**
 * Find test by slug
 *
 * @param {string} slug - Test slug
 * @returns {Promise<ABTest|null>}
 */
abTestSchema.statics.findBySlug = async function(slug) {
  return this.findOne({ slug: slug.toLowerCase(), archivedAt: null });
};

/**
 * Get tests by status
 *
 * @param {string|string[]} status - Status or array of statuses
 * @param {Object} options - Query options
 * @returns {Promise<ABTest[]>}
 */
abTestSchema.statics.getByStatus = async function(status, options = {}) {
  const statuses = Array.isArray(status) ? status : [status];
  const { limit = 50, skip = 0, sort = '-createdAt' } = options;

  return this.find({
    status: { $in: statuses },
    archivedAt: null,
  })
    .populate('createdBy', 'name email')
    .populate('campaignId', 'name')
    .populate('sequenceId', 'name')
    .populate('templateId', 'name')
    .sort(sort)
    .skip(skip)
    .limit(limit);
};

/**
 * Get tests by type
 *
 * @param {string} testType - Test type
 * @param {Object} options - Query options
 * @returns {Promise<ABTest[]>}
 */
abTestSchema.statics.getByType = async function(testType, options = {}) {
  const { status, limit = 50 } = options;
  const query = { testType, archivedAt: null };

  if (status) {
    query.status = status;
  }

  return this.find(query)
    .populate('campaignId', 'name')
    .populate('templateId', 'name')
    .sort('-createdAt')
    .limit(limit);
};

/**
 * Get running tests that are ready for evaluation
 *
 * @returns {Promise<ABTest[]>} Tests that may be ready to declare winner
 */
abTestSchema.statics.getTestsForEvaluation = async function() {
  const now = new Date();

  return this.find({
    status: 'running',
    archivedAt: null,
    'duration.actualStartAt': { $exists: true },
    $or: [
      { 'duration.endAt': { $lte: now } },
      { 'duration.maxDurationHours': { $exists: true } },
    ],
  });
};

/**
 * Get tests for a specific campaign
 *
 * @param {ObjectId} campaignId - Campaign ID
 * @returns {Promise<ABTest[]>}
 */
abTestSchema.statics.getByCampaign = async function(campaignId) {
  return this.find({
    campaignId,
    archivedAt: null,
  }).sort('-createdAt');
};

/**
 * Get tests for a specific sequence
 *
 * @param {ObjectId} sequenceId - Sequence ID
 * @returns {Promise<ABTest[]>}
 */
abTestSchema.statics.getBySequence = async function(sequenceId) {
  return this.find({
    sequenceId,
    archivedAt: null,
  }).sort('-createdAt');
};

/**
 * Search tests by name or tags
 *
 * @param {string} query - Search query
 * @param {Object} options - Search options
 * @returns {Promise<ABTest[]>}
 */
abTestSchema.statics.search = async function(query, options = {}) {
  const { status, testType, category, limit = 50 } = options;

  const searchQuery = {
    archivedAt: null,
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
      { tags: { $regex: query, $options: 'i' } },
      { hypothesis: { $regex: query, $options: 'i' } },
    ],
  };

  if (status) searchQuery.status = status;
  if (testType) searchQuery.testType = testType;
  if (category) searchQuery.category = category;

  return this.find(searchQuery)
    .populate('campaignId', 'name')
    .populate('sequenceId', 'name')
    .sort('-updatedAt')
    .limit(limit);
};

/**
 * Get aggregate metrics across all tests
 *
 * @param {Object} options - Filter options
 * @returns {Promise<Object>}
 */
abTestSchema.statics.getAggregateMetrics = async function(options = {}) {
  const { startDate, endDate, testType, category } = options;

  const match = {
    archivedAt: null,
  };

  if (startDate) match.createdAt = { $gte: new Date(startDate) };
  if (endDate) match.createdAt = { ...match.createdAt, $lte: new Date(endDate) };
  if (testType) match.testType = testType;
  if (category) match.category = category;

  const result = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalTests: { $sum: 1 },
        runningTests: {
          $sum: { $cond: [{ $eq: ['$status', 'running'] }, 1, 0] },
        },
        completedTests: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
        },
        totalRecipients: { $sum: '$results.totalRecipients' },
        totalSent: { $sum: '$results.totalSent' },
        totalOpens: { $sum: '$results.totalOpens' },
        totalClicks: { $sum: '$results.totalClicks' },
        totalConversions: { $sum: '$results.totalConversions' },
        totalRevenue: { $sum: '$results.totalRevenue' },
        avgImprovement: { $avg: '$results.improvementPercentage' },
      },
    },
  ]);

  if (result.length === 0) {
    return {
      totalTests: 0,
      runningTests: 0,
      completedTests: 0,
      avgImprovement: 0,
      totalRevenue: 0,
    };
  }

  const stats = result[0];
  return {
    totalTests: stats.totalTests,
    runningTests: stats.runningTests,
    completedTests: stats.completedTests,
    totalRecipients: stats.totalRecipients || 0,
    totalSent: stats.totalSent || 0,
    avgOpenRate: stats.totalSent > 0
      ? Math.round((stats.totalOpens / stats.totalSent) * 10000) / 100
      : 0,
    avgClickRate: stats.totalSent > 0
      ? Math.round((stats.totalClicks / stats.totalSent) * 10000) / 100
      : 0,
    avgConversionRate: stats.totalSent > 0
      ? Math.round((stats.totalConversions / stats.totalSent) * 10000) / 100
      : 0,
    avgImprovement: stats.avgImprovement || 0,
    totalRevenue: stats.totalRevenue || 0,
  };
};

/**
 * Generate a unique slug from a name
 *
 * @param {string} name - Test name
 * @returns {Promise<string>} Unique slug
 */
abTestSchema.statics.generateSlug = async function(name) {
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
 * Get top performing tests
 *
 * @param {string} metric - Metric to sort by
 * @param {number} limit - Number to return
 * @returns {Promise<ABTest[]>}
 */
abTestSchema.statics.getTopPerforming = async function(metric = 'results.totalRevenue', limit = 10) {
  return this.find({
    status: 'completed',
    archivedAt: null,
  })
    .sort({ [metric]: -1 })
    .limit(limit)
    .populate('campaignId', 'name')
    .populate('templateId', 'name');
};

/**
 * Create a test from a campaign
 *
 * @param {ObjectId} campaignId - Campaign ID
 * @param {Object} testConfig - Test configuration
 * @param {ObjectId} userId - User creating the test
 * @returns {Promise<ABTest>} Created test
 */
abTestSchema.statics.createFromCampaign = async function(campaignId, testConfig, userId) {
  const Campaign = mongoose.model('Campaign');
  const campaign = await Campaign.findById(campaignId);

  if (!campaign) {
    throw new Error('Campaign not found');
  }

  // Build test name from campaign
  const name = testConfig.name || `${campaign.name} - A/B Test`;

  // Build variants based on test type
  const variants = [];
  const variantLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

  if (testConfig.testType === 'subject_line' && testConfig.subjects) {
    testConfig.subjects.forEach((subject, index) => {
      variants.push({
        variantId: variantLetters[index],
        name: `Subject ${index + 1}`,
        subject,
        weight: Math.floor(100 / testConfig.subjects.length),
      });
    });
  } else if (testConfig.variants) {
    testConfig.variants.forEach((variantConfig, index) => {
      variants.push({
        ...variantConfig,
        variantId: variantLetters[index],
        weight: variantConfig.weight || Math.floor(100 / testConfig.variants.length),
      });
    });
  } else {
    // Default: create two variants from campaign
    variants.push(
      {
        variantId: 'A',
        name: 'Control',
        subject: campaign.subject || campaign.template?.subject,
        weight: 50,
      },
      {
        variantId: 'B',
        name: 'Variant B',
        subject: testConfig.variantSubject || campaign.subject || campaign.template?.subject,
        weight: 50,
      }
    );
  }

  const abTest = new this({
    name,
    description: testConfig.description || `A/B test for campaign: ${campaign.name}`,
    testType: testConfig.testType || 'subject_line',
    category: testConfig.category || 'engagement',
    tags: testConfig.tags,
    variants,
    controlVariantId: 'A',
    winnerCriteria: testConfig.winnerCriteria || 'open_rate',
    winnerDirection: testConfig.winnerDirection || 'higher',
    minImprovementThreshold: testConfig.minImprovementThreshold || 5,
    autoSelectWinner: testConfig.autoSelectWinner || false,
    campaignId,
    templateId: campaign.template,
    hypothesis: testConfig.hypothesis,
    expectedOutcome: testConfig.expectedOutcome,
    notes: testConfig.notes,
    createdBy: userId,
  });

  return await abTest.save();
};

/**
 * Create a test from a template
 *
 * @param {ObjectId} templateId - Template ID
 * @param {Object} testConfig - Test configuration
 * @param {ObjectId} userId - User creating the test
 * @returns {Promise<ABTest>} Created test
 */
abTestSchema.statics.createFromTemplate = async function(templateId, testConfig, userId) {
  const EmailTemplate = mongoose.model('EmailTemplate');
  const template = await EmailTemplate.findById(templateId);

  if (!template) {
    throw new Error('Template not found');
  }

  const name = testConfig.name || `${template.name} - A/B Test`;
  const variants = [];

  // Create template variants
  if (testConfig.testType === 'template' && testConfig.templateIds) {
    testConfig.templateIds.forEach((tid, index) => {
      variants.push({
        variantId: ['A', 'B', 'C', 'D', 'E'][index],
        name: `Template ${index + 1}`,
        templateId: tid,
        weight: Math.floor(100 / testConfig.templateIds.length),
      });
    });
  } else {
    // Default: use the template as control
    variants.push({
      variantId: 'A',
      name: 'Control',
      templateId,
      subject: template.subject,
      weight: 50,
    });

    if (testConfig.alternativeTemplateId) {
      variants.push({
        variantId: 'B',
        name: 'Variant B',
        templateId: testConfig.alternativeTemplateId,
        subject: testConfig.alternativeSubject || template.subject,
        weight: 50,
      });
    }
  }

  const abTest = new this({
    name,
    description: testConfig.description || `A/B test for template: ${template.name}`,
    testType: testConfig.testType || 'template',
    category: testConfig.category || 'engagement',
    tags: testConfig.tags,
    variants,
    controlVariantId: 'A',
    winnerCriteria: testConfig.winnerCriteria || 'open_rate',
    winnerDirection: testConfig.winnerDirection || 'higher',
    minImprovementThreshold: testConfig.minImprovementThreshold || 5,
    autoSelectWinner: testConfig.autoSelectWinner || false,
    templateId,
    hypothesis: testConfig.hypothesis,
    expectedOutcome: testConfig.expectedOutcome,
    notes: testConfig.notes,
    createdBy: userId,
  });

  return await abTest.save();
};

// ============================================================================
// PRE-SAVE MIDDLEWARE
// ============================================================================

abTestSchema.pre('save', async function(next) {
  // Update timestamp
  this.updatedAt = new Date();

  // Auto-generate slug if not provided
  if (this.isNew && !this.slug) {
    this.slug = await mongoose.model('ABTest').generateSlug(this.name);
  }

  // Initialize results if not set
  if (!this.results) {
    this.results = {
      totalRecipients: 0,
      totalSent: 0,
      totalDelivered: 0,
      totalOpens: 0,
      totalClicks: 0,
      totalConversions: 0,
      totalRevenue: 0,
      overallConversionRate: 0,
      overallOpenRate: 0,
      overallClickRate: 0,
      lastUpdated: new Date(),
    };
  }

  // Initialize significance config if not set
  if (!this.significance) {
    this.significance = {
      confidenceLevel: 95,
      minSampleSize: 100,
      testType: 'z-test',
      isSignificant: false,
    };
  }

  // Initialize duration config if not set
  if (!this.duration) {
    this.duration = {
      minDurationHours: 24,
      maxDurationHours: null,
    };
  }

  // Initialize traffic allocation if not set
  if (!this.trafficAllocation) {
    this.trafficAllocation = {
      strategy: 'equal',
      testTrafficPercentage: 100,
      autoOptimize: false,
    };
  }

  // Initialize status history if new
  if (this.isNew && (!this.statusHistory || this.statusHistory.length === 0)) {
    this.statusHistory = [{
      status: this.status,
      changedAt: new Date(),
      changedBy: this.createdBy,
      reason: 'Test created',
    }];
  }

  // Validate variant weights sum to 100
  if (this.variants && this.variants.length > 0) {
    const totalWeight = this.variants.reduce((sum, v) => sum + (v.weight || 0), 0);
    if (totalWeight !== 100) {
      // Auto-adjust weights to sum to 100
      const perVariant = Math.floor(100 / this.variants.length);
      const remainder = 100 - (perVariant * this.variants.length);
      this.variants.forEach((v, i) => {
        v.weight = perVariant + (i === 0 ? remainder : 0);
      });
    }
  }

  // Ensure controlVariantId exists in variants
  if (this.variants && this.variants.length > 0) {
    const controlExists = this.variants.some(v => v.variantId === this.controlVariantId);
    if (!controlExists) {
      this.controlVariantId = this.variants[0].variantId;
    }
  }

  // Initialize variant metrics if not set
  if (this.variants) {
    this.variants.forEach(v => {
      if (!v.metrics) {
        v.metrics = {
          recipients: 0,
          sent: 0,
          delivered: 0,
          uniqueOpens: 0,
          totalOpens: 0,
          uniqueClicks: 0,
          totalClicks: 0,
          bounces: 0,
          unsubscribes: 0,
          conversions: 0,
          revenue: 0,
          customGoalCompletions: 0,
        };
      }
    });
  }

  next();
});

// ============================================================================
// MODEL EXPORT
// ============================================================================

const ABTest = mongoose.model('ABTest', abTestSchema);

export default ABTest;
