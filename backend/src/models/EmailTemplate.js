import mongoose from 'mongoose';

/**
 * EmailTemplate Model - Phase 3: Email Marketing & Campaigns
 *
 * This model supports:
 * - Reusable email templates with variable substitution
 * - Multiple template types (marketing, transactional, automated)
 * - Trigger-based automation (birthday, anniversary, pipeline stage)
 * - Design configuration for consistent branding
 * - Performance metrics tracking (opens, clicks, conversions)
 * - A/B testing variants
 *
 * @version 1.0.0
 * @since 2026-01-23
 */

// ============================================================================
// SUB-SCHEMAS
// ============================================================================

/**
 * Template Variable Sub-Schema
 * Defines variables that can be substituted in the template
 */
const variableSchema = new mongoose.Schema({
  /** Variable name (used in template as {{variableName}}) */
  name: {
    type: String,
    required: true,
    trim: true,
  },
  /** Default value if not provided during send */
  defaultValue: {
    type: String,
    default: '',
  },
  /** Whether this variable must be provided */
  required: {
    type: Boolean,
    default: false,
  },
  /** Description of what this variable represents */
  description: String,
  /** Example value for documentation */
  example: String,
}, { _id: false });

/**
 * Trigger Configuration Sub-Schema
 * Defines when automated emails should be sent
 */
const triggerConfigSchema = new mongoose.Schema({
  /** Days before/after the trigger event (-7 = 7 days before, 3 = 3 days after) */
  daysOffset: {
    type: Number,
    default: 0,
  },
  /** Time of day to send (24-hour format, e.g., "09:00") */
  sendTime: {
    type: String,
    default: '09:00',
    match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (use HH:MM)'],
  },
  /** Timezone for the send time */
  timezone: {
    type: String,
    default: 'Africa/Nairobi',
  },
  /** For pipeline triggers: which stage transition triggers this */
  pipelineStage: {
    type: String,
    enum: ['new', 'contacted', 'meeting_scheduled', 'proposal_sent', 'negotiation', 'won', 'lost'],
  },
  /** For sequence triggers: which sequence step this belongs to */
  sequenceStep: Number,
  /** Conditions that must be met for trigger to fire */
  conditions: [{
    field: String,
    operator: {
      type: String,
      enum: ['equals', 'notEquals', 'contains', 'notContains', 'greaterThan', 'lessThan', 'exists', 'notExists'],
    },
    value: mongoose.Schema.Types.Mixed,
  }],
}, { _id: false });

/**
 * Design Configuration Sub-Schema
 * Stores visual styling for the template
 */
const designConfigSchema = new mongoose.Schema({
  /** Layout template to use */
  layout: {
    type: String,
    enum: ['simple', 'newsletter', 'promotional', 'transactional', 'minimal', 'custom'],
    default: 'simple',
  },
  /** Primary brand color (hex) */
  primaryColor: {
    type: String,
    default: '#0066cc',
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color'],
  },
  /** Secondary brand color (hex) */
  secondaryColor: {
    type: String,
    default: '#333333',
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color'],
  },
  /** Background color (hex) */
  backgroundColor: {
    type: String,
    default: '#ffffff',
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color'],
  },
  /** Font family for headings */
  headingFont: {
    type: String,
    default: 'Arial, sans-serif',
  },
  /** Font family for body text */
  bodyFont: {
    type: String,
    default: 'Arial, sans-serif',
  },
  /** Logo URL to include in header */
  logoUrl: String,
  /** Social media links to include in footer */
  socialLinks: {
    facebook: String,
    twitter: String,
    linkedin: String,
    instagram: String,
  },
  /** Custom CSS to inject */
  customCss: String,
  /** Header image URL */
  headerImageUrl: String,
  /** Footer text (e.g., company address, unsubscribe text) */
  footerText: String,
}, { _id: false });

/**
 * Performance Metrics Sub-Schema
 * Tracks template performance over time
 */
const metricsSchema = new mongoose.Schema({
  /** Total number of times this template was sent */
  totalSent: {
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
  /** Number of bounces */
  bounces: {
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
  /** Number of conversions attributed to this template */
  conversions: {
    type: Number,
    default: 0,
  },
  /** Revenue attributed to this template */
  revenue: {
    type: Number,
    default: 0,
  },
  /** Last time metrics were updated */
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
}, { _id: false });

// ============================================================================
// MAIN EMAIL TEMPLATE SCHEMA
// ============================================================================

const emailTemplateSchema = new mongoose.Schema({
  // -------------------------------------------------------------------------
  // IDENTIFICATION FIELDS
  // -------------------------------------------------------------------------

  /** Human-readable template name */
  name: {
    type: String,
    required: [true, 'Template name is required'],
    trim: true,
    maxlength: [200, 'Template name cannot exceed 200 characters'],
  },

  /** URL-friendly identifier for the template */
  slug: {
    type: String,
    required: [true, 'Template slug is required'],
    trim: true,
    lowercase: true,
    match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'],
    index: true,
  },

  /** Template category for organization */
  category: {
    type: String,
    enum: [
      'welcome',
      'onboarding',
      'newsletter',
      'promotional',
      'transactional',
      'notification',
      'follow-up',
      're-engagement',
      'birthday',
      'anniversary',
      'feedback',
      'survey',
      'event',
      'custom',
    ],
    default: 'custom',
    index: true,
  },

  /** Template type determines sending behavior */
  type: {
    type: String,
    enum: [
      'marketing',      // Requires marketing consent, can be unsubscribed
      'transactional',  // Always sent (receipts, password resets, etc.)
      'automated',      // Triggered by events/conditions
    ],
    default: 'marketing',
    index: true,
  },

  // -------------------------------------------------------------------------
  // CONTENT FIELDS
  // -------------------------------------------------------------------------

  /** Email subject line (supports variables) */
  subject: {
    type: String,
    required: [true, 'Email subject is required'],
    trim: true,
    maxlength: [200, 'Subject cannot exceed 200 characters'],
  },

  /** Preheader text (preview text shown in inbox) */
  preheader: {
    type: String,
    trim: true,
    maxlength: [150, 'Preheader cannot exceed 150 characters'],
  },

  /** HTML body of the email (supports variables) */
  htmlBody: {
    type: String,
    required: [true, 'HTML body is required'],
  },

  /** Plain text version of the email (required for deliverability) */
  plainTextBody: {
    type: String,
    required: [true, 'Plain text body is required'],
  },

  // -------------------------------------------------------------------------
  // VARIABLE CONFIGURATION
  // -------------------------------------------------------------------------

  /** Variables available for substitution in this template */
  variables: [variableSchema],

  // -------------------------------------------------------------------------
  // TRIGGER & AUTOMATION CONFIGURATION
  // -------------------------------------------------------------------------

  /** Type of trigger for automated emails */
  triggerType: {
    type: String,
    enum: [
      'none',           // Manual send only
      'birthday',       // Triggered by lead's birthday
      'anniversary',    // Triggered by company anniversary
      'pipeline_stage', // Triggered by pipeline stage change
      'sequence',       // Part of an email sequence
      'lead_score',     // Triggered when lead score reaches threshold
      'inactivity',     // Triggered after period of no activity
      'signup',         // Triggered on new lead signup
      'custom',         // Custom trigger via API
    ],
    default: 'none',
    index: true,
  },

  /** Configuration for the trigger */
  triggerConfig: triggerConfigSchema,

  // -------------------------------------------------------------------------
  // DESIGN CONFIGURATION
  // -------------------------------------------------------------------------

  /** Visual design settings */
  design: designConfigSchema,

  // -------------------------------------------------------------------------
  // STATUS & METADATA
  // -------------------------------------------------------------------------

  /** Template status */
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'archived'],
    default: 'draft',
    index: true,
  },

  /** Version number for tracking changes */
  version: {
    type: Number,
    default: 1,
  },

  /** Tags for filtering and organization */
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
  }],

  /** Internal notes about the template */
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters'],
  },

  // -------------------------------------------------------------------------
  // PERFORMANCE METRICS
  // -------------------------------------------------------------------------

  /** Aggregated performance metrics */
  metrics: metricsSchema,

  // -------------------------------------------------------------------------
  // A/B TESTING SUPPORT
  // -------------------------------------------------------------------------

  /** Whether this template is part of an A/B test */
  isVariant: {
    type: Boolean,
    default: false,
  },

  /** Reference to the parent template (for variants) */
  parentTemplate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EmailTemplate',
  },

  /** Variant identifier (A, B, C, etc.) */
  variantId: {
    type: String,
    enum: ['A', 'B', 'C', 'D', 'E'],
  },

  /** Traffic allocation percentage for this variant (1-100) */
  variantWeight: {
    type: Number,
    min: 1,
    max: 100,
    default: 50,
  },

  // -------------------------------------------------------------------------
  // AUDIT FIELDS
  // -------------------------------------------------------------------------

  /** User who created the template */
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },

  /** User who last updated the template */
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },

  /** Creation timestamp */
  createdAt: {
    type: Date,
    default: Date.now,
  },

  /** Last update timestamp */
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// ============================================================================
// INDEXES
// ============================================================================

// Unique slug per active template
emailTemplateSchema.index({ slug: 1 }, { unique: true });

// Compound index for template lookup by category and status
emailTemplateSchema.index({ category: 1, status: 1 });

// Compound index for trigger-based queries
emailTemplateSchema.index({ triggerType: 1, status: 1 });

// Index for A/B test variant lookups
emailTemplateSchema.index({ parentTemplate: 1, isVariant: 1 });

// Index for tag-based filtering
emailTemplateSchema.index({ tags: 1 });

// Index for type-based queries
emailTemplateSchema.index({ type: 1, status: 1 });

// Compound index for performance sorting
emailTemplateSchema.index({ 'metrics.totalSent': -1, status: 1 });

// ============================================================================
// VIRTUAL PROPERTIES
// ============================================================================

/**
 * Calculate open rate as a percentage
 */
emailTemplateSchema.virtual('openRate').get(function() {
  if (this.metrics.totalSent === 0) return 0;
  return Math.round((this.metrics.uniqueOpens / this.metrics.totalSent) * 10000) / 100;
});

/**
 * Calculate click rate as a percentage
 */
emailTemplateSchema.virtual('clickRate').get(function() {
  if (this.metrics.totalSent === 0) return 0;
  return Math.round((this.metrics.uniqueClicks / this.metrics.totalSent) * 10000) / 100;
});

/**
 * Calculate click-to-open rate
 */
emailTemplateSchema.virtual('clickToOpenRate').get(function() {
  if (this.metrics.uniqueOpens === 0) return 0;
  return Math.round((this.metrics.uniqueClicks / this.metrics.uniqueOpens) * 10000) / 100;
});

/**
 * Calculate bounce rate
 */
emailTemplateSchema.virtual('bounceRate').get(function() {
  if (this.metrics.totalSent === 0) return 0;
  return Math.round((this.metrics.bounces / this.metrics.totalSent) * 10000) / 100;
});

/**
 * Calculate unsubscribe rate
 */
emailTemplateSchema.virtual('unsubscribeRate').get(function() {
  if (this.metrics.totalSent === 0) return 0;
  return Math.round((this.metrics.unsubscribes / this.metrics.totalSent) * 10000) / 100;
});

/**
 * Calculate conversion rate
 */
emailTemplateSchema.virtual('conversionRate').get(function() {
  if (this.metrics.totalSent === 0) return 0;
  return Math.round((this.metrics.conversions / this.metrics.totalSent) * 10000) / 100;
});

/**
 * Get all defined variable names
 */
emailTemplateSchema.virtual('variableNames').get(function() {
  return this.variables.map(v => v.name);
});

/**
 * Check if template has all required fields for sending
 */
emailTemplateSchema.virtual('isReadyToSend').get(function() {
  return (
    this.status === 'active' &&
    this.subject &&
    this.htmlBody &&
    this.plainTextBody
  );
});

// Ensure virtuals are included in JSON output
emailTemplateSchema.set('toJSON', { virtuals: true });
emailTemplateSchema.set('toObject', { virtuals: true });

// ============================================================================
// INSTANCE METHODS
// ============================================================================

/**
 * Render the template with provided variables
 * Replaces {{variableName}} placeholders with actual values
 *
 * @param {Object} data - Object containing variable values
 * @param {string} format - 'html' or 'text'
 * @returns {Object} Rendered subject, preheader, and body
 *
 * @example
 * const rendered = template.render({ firstName: 'John', company: 'Acme' }, 'html');
 * // Returns: { subject: '...', preheader: '...', body: '...' }
 */
emailTemplateSchema.methods.render = function(data = {}, format = 'html') {
  const replaceVariables = (text) => {
    if (!text) return text;

    let result = text;

    // Replace each variable
    this.variables.forEach(variable => {
      const value = data[variable.name] !== undefined
        ? data[variable.name]
        : variable.defaultValue;

      // Handle required variables
      if (variable.required && !data[variable.name]) {
        throw new Error(`Required variable "${variable.name}" was not provided`);
      }

      // Replace all occurrences of {{variableName}}
      const regex = new RegExp(`\\{\\{${variable.name}\\}\\}`, 'g');
      result = result.replace(regex, value || '');
    });

    // Clean up any unmatched variables
    result = result.replace(/\{\{[^}]+\}\}/g, '');

    return result;
  };

  return {
    subject: replaceVariables(this.subject),
    preheader: replaceVariables(this.preheader),
    body: replaceVariables(format === 'html' ? this.htmlBody : this.plainTextBody),
  };
};

/**
 * Validate that all required variables are present in the provided data
 *
 * @param {Object} data - Object containing variable values
 * @returns {Object} { valid: boolean, missing: string[] }
 *
 * @example
 * const result = template.validateVariables({ firstName: 'John' });
 * // Returns: { valid: false, missing: ['lastName', 'email'] }
 */
emailTemplateSchema.methods.validateVariables = function(data = {}) {
  const missing = this.variables
    .filter(v => v.required && !data[v.name])
    .map(v => v.name);

  return {
    valid: missing.length === 0,
    missing,
  };
};

/**
 * Create a duplicate of this template
 *
 * @param {string} newName - Name for the duplicated template
 * @param {string} newSlug - Slug for the duplicated template
 * @returns {Object} New template object (not saved)
 *
 * @example
 * const duplicate = template.duplicate('Welcome Email v2', 'welcome-email-v2');
 * await duplicate.save();
 */
emailTemplateSchema.methods.duplicate = function(newName, newSlug) {
  const templateData = this.toObject();

  // Remove fields that should be unique or reset
  delete templateData._id;
  delete templateData.id;
  delete templateData.createdAt;
  delete templateData.updatedAt;

  // Set new values
  templateData.name = newName;
  templateData.slug = newSlug;
  templateData.status = 'draft';
  templateData.version = 1;
  templateData.metrics = {
    totalSent: 0,
    uniqueOpens: 0,
    totalOpens: 0,
    uniqueClicks: 0,
    totalClicks: 0,
    bounces: 0,
    unsubscribes: 0,
    spamComplaints: 0,
    conversions: 0,
    revenue: 0,
    lastUpdated: new Date(),
  };

  // Clear A/B test associations
  templateData.isVariant = false;
  templateData.parentTemplate = null;
  templateData.variantId = null;

  return new (mongoose.model('EmailTemplate'))(templateData);
};

/**
 * Create an A/B test variant of this template
 *
 * @param {string} variantId - The variant identifier (B, C, D, E)
 * @param {Object} changes - Fields to change in the variant
 * @returns {Object} New variant template object (not saved)
 *
 * @example
 * const variantB = template.createVariant('B', { subject: 'New Subject Line' });
 * await variantB.save();
 */
emailTemplateSchema.methods.createVariant = function(variantId, changes = {}) {
  if (!['B', 'C', 'D', 'E'].includes(variantId)) {
    throw new Error('Variant ID must be B, C, D, or E');
  }

  const templateData = this.toObject();

  // Remove unique fields
  delete templateData._id;
  delete templateData.id;
  delete templateData.createdAt;
  delete templateData.updatedAt;
  delete templateData.slug;

  // Apply changes
  Object.assign(templateData, changes);

  // Set variant properties
  templateData.name = `${this.name} (Variant ${variantId})`;
  templateData.slug = `${this.slug}-variant-${variantId.toLowerCase()}`;
  templateData.isVariant = true;
  templateData.parentTemplate = this._id;
  templateData.variantId = variantId;
  templateData.variantWeight = 50; // Default 50% traffic
  templateData.status = 'draft';
  templateData.version = 1;
  templateData.metrics = {
    totalSent: 0,
    uniqueOpens: 0,
    totalOpens: 0,
    uniqueClicks: 0,
    totalClicks: 0,
    bounces: 0,
    unsubscribes: 0,
    spamComplaints: 0,
    conversions: 0,
    revenue: 0,
    lastUpdated: new Date(),
  };

  // Mark parent as variant A
  if (!this.variantId) {
    this.variantId = 'A';
  }

  return new (mongoose.model('EmailTemplate'))(templateData);
};

/**
 * Update metrics with new send data
 *
 * @param {Object} data - Metrics to add
 * @param {number} data.sent - Number sent
 * @param {number} data.opens - Number of opens
 * @param {number} data.clicks - Number of clicks
 * @param {number} data.bounces - Number of bounces
 * @param {number} data.unsubscribes - Number of unsubscribes
 * @returns {this} Updated template
 *
 * @example
 * template.updateMetrics({ sent: 100, opens: 25, clicks: 10 });
 * await template.save();
 */
emailTemplateSchema.methods.updateMetrics = function(data = {}) {
  if (!this.metrics) {
    this.metrics = {};
  }

  if (data.sent) this.metrics.totalSent = (this.metrics.totalSent || 0) + data.sent;
  if (data.opens) {
    this.metrics.uniqueOpens = (this.metrics.uniqueOpens || 0) + data.opens;
    this.metrics.totalOpens = (this.metrics.totalOpens || 0) + data.opens;
  }
  if (data.clicks) {
    this.metrics.uniqueClicks = (this.metrics.uniqueClicks || 0) + data.clicks;
    this.metrics.totalClicks = (this.metrics.totalClicks || 0) + data.clicks;
  }
  if (data.bounces) this.metrics.bounces = (this.metrics.bounces || 0) + data.bounces;
  if (data.unsubscribes) this.metrics.unsubscribes = (this.metrics.unsubscribes || 0) + data.unsubscribes;
  if (data.spamComplaints) this.metrics.spamComplaints = (this.metrics.spamComplaints || 0) + data.spamComplaints;
  if (data.conversions) this.metrics.conversions = (this.metrics.conversions || 0) + data.conversions;
  if (data.revenue) this.metrics.revenue = (this.metrics.revenue || 0) + data.revenue;

  this.metrics.lastUpdated = new Date();

  return this;
};

/**
 * Archive the template (soft delete)
 *
 * @returns {this} Updated template
 */
emailTemplateSchema.methods.archive = function() {
  this.status = 'archived';
  return this;
};

/**
 * Increment version number
 *
 * @returns {this} Updated template
 */
emailTemplateSchema.methods.incrementVersion = function() {
  this.version = (this.version || 1) + 1;
  return this;
};

// ============================================================================
// STATIC METHODS
// ============================================================================

/**
 * Find template by slug
 *
 * @param {string} slug - Template slug
 * @returns {Promise<EmailTemplate|null>} Template or null
 *
 * @example
 * const template = await EmailTemplate.findBySlug('welcome-email');
 */
emailTemplateSchema.statics.findBySlug = async function(slug) {
  return this.findOne({ slug: slug.toLowerCase() });
};

/**
 * Get all active templates by category
 *
 * @param {string} category - Template category
 * @returns {Promise<EmailTemplate[]>} Array of templates
 *
 * @example
 * const welcomeTemplates = await EmailTemplate.getByCategory('welcome');
 */
emailTemplateSchema.statics.getByCategory = async function(category) {
  return this.find({
    category,
    status: 'active',
    isVariant: false,
  }).sort({ name: 1 });
};

/**
 * Get all templates with a specific trigger type
 *
 * @param {string} triggerType - The trigger type
 * @param {Object} options - Query options
 * @returns {Promise<EmailTemplate[]>} Array of templates
 *
 * @example
 * const birthdayTemplates = await EmailTemplate.getByTrigger('birthday');
 */
emailTemplateSchema.statics.getByTrigger = async function(triggerType, options = {}) {
  const query = {
    triggerType,
    status: 'active',
  };

  if (options.pipelineStage) {
    query['triggerConfig.pipelineStage'] = options.pipelineStage;
  }

  return this.find(query).sort({ createdAt: -1 });
};

/**
 * Get top performing templates by metric
 *
 * @param {string} metric - Metric to sort by ('openRate', 'clickRate', 'conversionRate')
 * @param {number} limit - Number of templates to return
 * @returns {Promise<EmailTemplate[]>} Array of top templates
 *
 * @example
 * const topTemplates = await EmailTemplate.getTopPerforming('openRate', 10);
 */
emailTemplateSchema.statics.getTopPerforming = async function(metric = 'openRate', limit = 10) {
  // Get all active templates with at least 100 sends (statistically significant)
  const templates = await this.find({
    status: 'active',
    'metrics.totalSent': { $gte: 100 },
  });

  // Calculate rates and sort
  const sorted = templates.sort((a, b) => {
    const rateA = a[metric] || 0;
    const rateB = b[metric] || 0;
    return rateB - rateA;
  });

  return sorted.slice(0, limit);
};

/**
 * Get all variants for a template
 *
 * @param {ObjectId} parentId - Parent template ID
 * @returns {Promise<EmailTemplate[]>} Array of variant templates
 *
 * @example
 * const variants = await EmailTemplate.getVariants(templateId);
 */
emailTemplateSchema.statics.getVariants = async function(parentId) {
  return this.find({
    parentTemplate: parentId,
    isVariant: true,
  }).sort({ variantId: 1 });
};

/**
 * Search templates by name or tags
 *
 * @param {string} query - Search query
 * @param {Object} options - Search options
 * @returns {Promise<EmailTemplate[]>} Array of matching templates
 *
 * @example
 * const results = await EmailTemplate.search('welcome', { status: 'active' });
 */
emailTemplateSchema.statics.search = async function(query, options = {}) {
  const searchQuery = {
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { tags: { $regex: query, $options: 'i' } },
      { category: { $regex: query, $options: 'i' } },
    ],
  };

  if (options.status) {
    searchQuery.status = options.status;
  }

  if (options.type) {
    searchQuery.type = options.type;
  }

  return this.find(searchQuery).sort({ updatedAt: -1 }).limit(options.limit || 50);
};

/**
 * Get aggregate metrics across all templates
 *
 * @returns {Promise<Object>} Aggregate metrics
 *
 * @example
 * const stats = await EmailTemplate.getAggregateMetrics();
 * // Returns: { totalSent: 50000, avgOpenRate: 25.5, avgClickRate: 3.2, ... }
 */
emailTemplateSchema.statics.getAggregateMetrics = async function() {
  const result = await this.aggregate([
    {
      $match: {
        status: { $in: ['active', 'paused'] },
        'metrics.totalSent': { $gt: 0 },
      },
    },
    {
      $group: {
        _id: null,
        totalTemplates: { $sum: 1 },
        totalSent: { $sum: '$metrics.totalSent' },
        totalOpens: { $sum: '$metrics.uniqueOpens' },
        totalClicks: { $sum: '$metrics.uniqueClicks' },
        totalBounces: { $sum: '$metrics.bounces' },
        totalUnsubscribes: { $sum: '$metrics.unsubscribes' },
        totalConversions: { $sum: '$metrics.conversions' },
        totalRevenue: { $sum: '$metrics.revenue' },
      },
    },
  ]);

  if (result.length === 0) {
    return {
      totalTemplates: 0,
      totalSent: 0,
      avgOpenRate: 0,
      avgClickRate: 0,
      avgBounceRate: 0,
      avgConversionRate: 0,
      totalRevenue: 0,
    };
  }

  const stats = result[0];
  return {
    totalTemplates: stats.totalTemplates,
    totalSent: stats.totalSent,
    avgOpenRate: stats.totalSent > 0
      ? Math.round((stats.totalOpens / stats.totalSent) * 10000) / 100
      : 0,
    avgClickRate: stats.totalSent > 0
      ? Math.round((stats.totalClicks / stats.totalSent) * 10000) / 100
      : 0,
    avgBounceRate: stats.totalSent > 0
      ? Math.round((stats.totalBounces / stats.totalSent) * 10000) / 100
      : 0,
    avgConversionRate: stats.totalSent > 0
      ? Math.round((stats.totalConversions / stats.totalSent) * 10000) / 100
      : 0,
    totalRevenue: stats.totalRevenue,
  };
};

/**
 * Generate a unique slug from a name
 *
 * @param {string} name - Template name
 * @returns {Promise<string>} Unique slug
 *
 * @example
 * const slug = await EmailTemplate.generateSlug('Welcome Email');
 * // Returns: 'welcome-email' or 'welcome-email-2' if exists
 */
emailTemplateSchema.statics.generateSlug = async function(name) {
  // Convert name to slug
  let baseSlug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

  // Check if slug exists
  let slug = baseSlug;
  let counter = 1;

  while (await this.findOne({ slug })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
};

// ============================================================================
// PRE-SAVE MIDDLEWARE
// ============================================================================

emailTemplateSchema.pre('save', async function(next) {
  // Update timestamp
  this.updatedAt = new Date();

  // Auto-generate slug if not provided
  if (this.isNew && !this.slug) {
    this.slug = await mongoose.model('EmailTemplate').generateSlug(this.name);
  }

  // Initialize metrics if not set
  if (!this.metrics) {
    this.metrics = {
      totalSent: 0,
      uniqueOpens: 0,
      totalOpens: 0,
      uniqueClicks: 0,
      totalClicks: 0,
      bounces: 0,
      unsubscribes: 0,
      spamComplaints: 0,
      conversions: 0,
      revenue: 0,
      lastUpdated: new Date(),
    };
  }

  // Initialize design if not set
  if (!this.design) {
    this.design = {
      layout: 'simple',
      primaryColor: '#0066cc',
      secondaryColor: '#333333',
      backgroundColor: '#ffffff',
      headingFont: 'Arial, sans-serif',
      bodyFont: 'Arial, sans-serif',
    };
  }

  next();
});

// ============================================================================
// MODEL EXPORT
// ============================================================================

const EmailTemplate = mongoose.model('EmailTemplate', emailTemplateSchema);

export default EmailTemplate;
