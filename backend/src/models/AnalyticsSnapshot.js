import mongoose from 'mongoose';

/**
 * Analytics Snapshot Model - Phase 7: Analytics Dashboard
 *
 * This model stores pre-aggregated analytics snapshots for:
 * - Dashboard overview metrics (KPIs at a glance)
 * - Lead analytics (sources, pipeline stages, scores)
 * - Email and campaign performance (opens, clicks, conversions)
 * - Sequence analytics (enrollments, completion rates)
 * - Social media analytics (engagement, reach)
 * - Revenue and ROI tracking
 * - Time-based granularities (hourly, daily, weekly, monthly)
 *
 * Snapshots are created periodically to enable fast dashboard queries
 * without aggregating large datasets on every request.
 *
 * @version 1.0.0
 * @since 2026-01-23
 */

// ============================================================================
// SUB-SCHEMAS
// ============================================================================

/**
 * Lead Metrics Sub-Schema
 * Tracks lead generation and pipeline metrics
 */
const leadMetricsSchema = new mongoose.Schema({
  /** Total leads in snapshot */
  total: { type: Number, default: 0 },
  /** New leads created in period */
  new: { type: Number, default: 0 },
  /** Qualified leads in period */
  qualified: { type: Number, default: 0 },
  /** Leads converted to customers */
  converted: { type: Number, default: 0 },
  /** Leads by source */
  bySource: {
    newsletter: { type: Number, default: 0 },
    event: { type: Number, default: 0 },
    survey: { type: Number, default: 0 },
    offer: { type: Number, default: 0 },
    meetup: { type: Number, default: 0 },
    contact: { type: Number, default: 0 },
    download: { type: Number, default: 0 },
    chatbot: { type: Number, default: 0 },
    referral: { type: Number, default: 0 },
    other: { type: Number, default: 0 },
  },
  /** Leads by pipeline stage */
  byStage: {
    new: { type: Number, default: 0 },
    contacted: { type: Number, default: 0 },
    meeting_scheduled: { type: Number, default: 0 },
    proposal_sent: { type: Number, default: 0 },
    negotiation: { type: Number, default: 0 },
    won: { type: Number, default: 0 },
    lost: { type: Number, default: 0 },
  },
  /** Lead score distribution */
  scoreDistribution: [{
    range: String, // '0-20', '21-40', '41-60', '61-80', '81-100'
    count: Number,
  }],
  /** Average lead score */
  avgScore: { type: Number, default: 0 },
  /** Unassigned leads count */
  unassigned: { type: Number, default: 0 },
  /** Assigned leads count */
  assigned: { type: Number, default: 0 },
}, { _id: false });

/**
 * Email Metrics Sub-Schema
 * Tracks email campaign performance
 */
const emailMetricsSchema = new mongoose.Schema({
  /** Total emails sent in period */
  sent: { type: Number, default: 0 },
  /** Emails successfully delivered */
  delivered: { type: Number, default: 0 },
  /** Unique email opens */
  uniqueOpens: { type: Number, default: 0 },
  /** Total opens (including re-opens) */
  totalOpens: { type: Number, default: 0 },
  /** Unique clicks */
  uniqueClicks: { type: Number, default: 0 },
  /** Total clicks */
  totalClicks: { type: Number, default: 0 },
  /** Bounced emails */
  bounces: { type: Number, default: 0 },
  /** Unsubscribes */
  unsubscribes: { type: Number, default: 0 },
  /** Spam complaints */
  spamComplaints: { type: Number, default: 0 },
  /** Conversions attributed to email */
  conversions: { type: Number, default: 0 },
  /** Revenue from email campaigns */
  revenue: { type: Number, default: 0 },
  /** Open rate percentage */
  openRate: { type: Number, default: 0 },
  /** Click rate percentage */
  clickRate: { type: Number, default: 0 },
  /** Click-to-open rate percentage */
  clickToOpenRate: { type: Number, default: 0 },
  /** Bounce rate percentage */
  bounceRate: { type: Number, default: 0 },
  /** Unsubscribe rate percentage */
  unsubscribeRate: { type: Number, default: 0 },
}, { _id: false });

/**
 * Campaign Metrics Sub-Schema
 * Tracks individual campaign performance
 */
const campaignMetricsSchema = new mongoose.Schema({
  /** Total campaigns in period */
  total: { type: Number, default: 0 },
  /** Active campaigns */
  active: { type: Number, default: 0 },
  /** Scheduled campaigns */
  scheduled: { type: Number, default: 0 },
  /** Completed campaigns */
  completed: { type: Number, default: 0 },
  /** Campaigns by status */
  byStatus: {
    draft: { type: Number, default: 0 },
    scheduled: { type: Number, default: 0 },
    sending: { type: Number, default: 0 },
    sent: { type: Number, default: 0 },
    paused: { type: Number, default: 0 },
    cancelled: { type: Number, default: 0 },
  },
  /** Campaigns by category */
  byCategory: [{
    category: String,
    count: Number,
    totalSent: Number,
    totalOpens: Number,
    totalClicks: Number,
  }],
  /** Top performing campaigns */
  topPerforming: [{
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campaign',
    },
    name: String,
    sent: Number,
    openRate: Number,
    clickRate: Number,
    conversionRate: Number,
  }],
}, { _id: false });

/**
 * Sequence Metrics Sub-Schema
 * Tracks email sequence performance
 */
const sequenceMetricsSchema = new mongoose.Schema({
  /** Total sequences */
  total: { type: Number, default: 0 },
  /** Active sequences */
  active: { type: Number, default: 0 },
  /** Paused sequences */
  paused: { type: Number, default: 0 },
  /** Total enrollments */
  totalEnrollments: { type: Number, default: 0 },
  /** Active enrollments */
  activeEnrollments: { type: Number, default: 0 },
  /** Completed enrollments */
  completedEnrollments: { type: Number, default: 0 },
  /** Unsubscribed from sequences */
  unsubscribed: { type: Number, default: 0 },
  /** Overall completion rate */
  completionRate: { type: Number, default: 0 },
  /** Average time to complete (hours) */
  avgCompletionTime: { type: Number, default: 0 },
  /** Emails sent via sequences */
  emailsSent: { type: Number, default: 0 },
  /** Sequences by type */
  byType: [{
    type: String,
    count: Number,
    enrollments: Number,
    completionRate: Number,
  }],
  /** Top performing sequences */
  topPerforming: [{
    sequenceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sequence',
    },
    name: String,
    enrollments: Number,
    completionRate: Number,
    conversionRate: Number,
  }],
}, { _id: false });

/**
 * Social Metrics Sub-Schema
 * Tracks social media performance
 */
const socialMetricsSchema = new mongoose.Schema({
  /** Total posts in period */
  totalPosts: { type: Number, default: 0 },
  /** Published posts */
  published: { type: Number, default: 0 },
  /** Scheduled posts */
  scheduled: { type: Number, default: 0 },
  /** Draft posts */
  drafts: { type: Number, default: 0 },
  /** Total impressions */
  impressions: { type: Number, default: 0 },
  /** Total reach (unique users) */
  reach: { type: Number, default: 0 },
  /** Total engagement (likes + comments + shares) */
  totalEngagement: { type: Number, default: 0 },
  /** Engagement rate (engagement / reach) */
  engagementRate: { type: Number, default: 0 },
  /** Breakdown by engagement type */
  engagement: {
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
  },
  /** Metrics by platform */
  byPlatform: [{
    platform: { type: String, enum: ['linkedin', 'twitter'] },
    posts: Number,
    impressions: Number,
    engagement: Number,
    engagementRate: Number,
  }],
  /** Posts by type */
  byType: {
    text: { type: Number, default: 0 },
    image: { type: Number, default: 0 },
    video: { type: Number, default: 0 },
    link: { type: Number, default: 0 },
    carousel: { type: Number, default: 0 },
    poll: { type: Number, default: 0 },
  },
  /** Top performing posts */
  topPerforming: [{
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SocialPost',
    },
    platform: String,
    type: String,
    engagementRate: Number,
    impressions: Number,
  }],
  /** Follower growth */
  followerGrowth: {
    linkedin: { type: Number, default: 0 },
    twitter: { type: Number, default: 0 },
  },
  /** Total followers across platforms */
  totalFollowers: { type: Number, default: 0 },
}, { _id: false });

/**
 * A/B Test Metrics Sub-Schema
 * Tracks A/B testing performance
 */
const abTestMetricsSchema = new mongoose.Schema({
  /** Total tests run */
  total: { type: Number, default: 0 },
  /** Active tests */
  active: { type: Number, default: 0 },
  /** Completed tests */
  completed: { type: Number, default: 0 },
  /** Tests with significant winner */
  withWinner: { type: Number, default: 0 },
  /** Tests by type */
  byType: {
    subject_line: { type: Number, default: 0 },
    content: { type: Number, default: 0 },
    sender: { type: Number, default: 0 },
    send_time: { type: Number, default: 0 },
    template: { type: Number, default: 0 },
    landing_page: { type: Number, default: 0 },
    multivariate: { type: Number, default: 0 },
  },
  /** Average improvement from winners */
  avgImprovement: { type: Number, default: 0 },
  /** Total participants across all tests */
  totalParticipants: { type: Number, default: 0 },
}, { _id: false });

/**
 * Revenue Metrics Sub-Schema
 * Tracks financial performance
 */
const revenueMetricsSchema = new mongoose.Schema({
  /** Total revenue in period */
  total: { type: Number, default: 0 },
  /** Recurring revenue */
  recurring: { type: Number, default: 0 },
  /** One-time revenue */
  oneTime: { type: Number, default: 0 },
  /** Projected revenue (from pipeline) */
  projected: { type: Number, default: 0 },
  /** Total value of open opportunities */
  pipelineValue: { type: Number, default: 0 },
  /** Cost per lead */
  costPerLead: { type: Number, default: 0 },
  /** Customer acquisition cost */
  cac: { type: Number, default: 0 },
  /** Customer lifetime value (estimated) */
  clv: { type: Number, default: 0 },
  /** ROI percentage */
  roi: { type: Number, default: 0 },
  /** Revenue by source */
  bySource: [{
    source: String,
    revenue: Number,
    deals: Number,
  }],
  /** Average deal size */
  avgDealSize: { type: Number, default: 0 },
  /** Revenue trend (vs previous period) */
  growthRate: { type: Number, default: 0 },
}, { _id: false });

/**
 * Conversion Funnel Sub-Schema
 * Tracks conversion through stages
 */
const conversionFunnelSchema = new mongoose.Schema({
  /** Website visitors */
  visitors: { type: Number, default: 0 },
  /** Engaged visitors (multiple pages, time on site) */
  engaged: { type: Number, default: 0 },
  /** Leads (email capture, form submit) */
  leads: { type: Number, default: 0 },
  /** Qualified leads (meet criteria) */
  qualified: { type: Number, default: 0 },
  /** Opportunities (sales ready) */
  opportunities: { type: Number, default: 0 },
  /** Converted (customers) */
  converted: { type: Number, default: 0 },
  /** Conversion rates between stages */
  rates: {
    visitorToEngaged: { type: Number, default: 0 },
    engagedToLead: { type: Number, default: 0 },
    leadToQualified: { type: Number, default: 0 },
    qualifiedToOpportunity: { type: Number, default: 0 },
    opportunityToConverted: { type: Number, default: 0 },
    overall: { type: Number, default: 0 },
  },
}, { _id: false });

/**
 * Traffic Metrics Sub-Schema
 * Tracks website traffic
 */
const trafficMetricsSchema = new mongoose.Schema({
  /** Total sessions */
  sessions: { type: Number, default: 0 },
  /** Unique visitors */
  uniqueVisitors: { type: Number, default: 0 },
  /** Page views */
  pageViews: { type: Number, default: 0 },
  /** Bounce rate percentage */
  bounceRate: { type: Number, default: 0 },
  /** Average session duration (seconds) */
  avgSessionDuration: { type: Number, default: 0 },
  /** Pages per session */
  pagesPerSession: { type: Number, default: 0 },
  /** Traffic by source */
  bySource: {
    organic: { type: Number, default: 0 },
    direct: { type: Number, default: 0 },
    referral: { type: Number, default: 0 },
    social: { type: Number, default: 0 },
    email: { type: Number, default: 0 },
    paid: { type: Number, default: 0 },
  },
  /** Top pages */
  topPages: [{
    path: String,
    views: Number,
    uniqueVisitors: Number,
  }],
}, { _id: false });

/**
 * Growth Metrics Sub-Schema
 * Tracks period-over-period growth
 */
const growthMetricsSchema = new mongoose.Schema({
  /** Lead growth percentage */
  leads: { type: Number, default: 0 },
  /** Revenue growth percentage */
  revenue: { type: Number, default: 0 },
  /** Engagement growth percentage */
  engagement: { type: Number, default: 0 },
  /** Conversion rate growth percentage */
  conversionRate: { type: Number, default: 0 },
  /** Email performance growth */
  emailPerformance: { type: Number, default: 0 },
  /** Social follower growth */
  socialFollowers: { type: Number, default: 0 },
}, { _id: false });

// ============================================================================
// MAIN ANALYTICS SNAPSHOT SCHEMA
// ============================================================================

const analyticsSnapshotSchema = new mongoose.Schema({
  // ==========================================================================
  // IDENTIFICATION & TIME PERIOD
  // ==========================================================================

  /** Time granularity of this snapshot */
  granularity: {
    type: String,
    required: true,
    enum: ['hourly', 'daily', 'weekly', 'monthly', 'quarterly', 'yearly'],
    index: true,
  },

  /** Start date of the snapshot period */
  startDate: {
    type: Date,
    required: true,
    index: true,
  },

  /** End date of the snapshot period */
  endDate: {
    type: Date,
    required: true,
    index: true,
  },

  /** Human-readable label (e.g., "January 2026", "Week 3") */
  label: {
    type: String,
    trim: true,
  },

  /** Year for grouping */
  year: {
    type: Number,
    index: true,
  },

  /** Month (1-12) for grouping */
  month: {
    type: Number,
    min: 1,
    max: 12,
    index: true,
  },

  /** Week of year (1-53) for grouping */
  week: {
    type: Number,
    min: 1,
    max: 53,
  },

  /** Day of month (1-31) for grouping */
  day: {
    type: Number,
    min: 1,
    max: 31,
  },

  /** Hour of day (0-23) for grouping */
  hour: {
    type: Number,
    min: 0,
    max: 23,
  },

  // ==========================================================================
  // METRICS (all optional, populated by aggregation)
  // ==========================================================================

  /** Lead generation metrics */
  leads: leadMetricsSchema,

  /** Email performance metrics */
  email: emailMetricsSchema,

  /** Campaign performance metrics */
  campaigns: campaignMetricsSchema,

  /** Sequence performance metrics */
  sequences: sequenceMetricsSchema,

  /** Social media metrics */
  social: socialMetricsSchema,

  /** A/B testing metrics */
  abTests: abTestMetricsSchema,

  /** Revenue and financial metrics */
  revenue: revenueMetricsSchema,

  /** Conversion funnel metrics */
  funnel: conversionFunnelSchema,

  /** Website traffic metrics */
  traffic: trafficMetricsSchema,

  /** Period-over-period growth metrics */
  growth: growthMetricsSchema,

  // ==========================================================================
  // METADATA
  // ==========================================================================

  /** When this snapshot was created */
  generatedAt: {
    type: Date,
    default: Date.now,
  },

  /** Whether this snapshot is complete (all metrics populated) */
  isComplete: {
    type: Boolean,
    default: false,
  },

  /** Tags for filtering/custom snapshots */
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
  }],

  /** Associated user/employee for personal snapshots */
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true,
  },

  /** Notes about this snapshot */
  notes: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
});

// ============================================================================
// INDEXES
// ============================================================================

// Compound index for time-based queries
analyticsSnapshotSchema.index({ granularity: 1, startDate: -1 });
analyticsSnapshotSchema.index({ granularity: 1, endDate: -1 });

// Indexes for year/month queries (common dashboard patterns)
analyticsSnapshotSchema.index({ granularity: 1, year: 1, month: -1 });
analyticsSnapshotSchema.index({ granularity: 1, year: 1, week: -1 });

// Index for user-specific snapshots
analyticsSnapshotSchema.index({ userId: 1, granularity: 1, startDate: -1 });

// Index for tags
analyticsSnapshotSchema.index({ tags: 1 });

// Index for generatedAt (for cleanup queries)
analyticsSnapshotSchema.index({ generatedAt: -1 });

// ============================================================================
// VIRTUALS
// ============================================================================

/**
 * Calculate overall conversion rate
 */
analyticsSnapshotSchema.virtual('overallConversionRate').get(function() {
  const visitors = this.funnel?.visitors || 0;
  const converted = this.funnel?.converted || 0;
  return visitors > 0 ? ((converted / visitors) * 100).toFixed(2) : '0.00';
});

/**
 * Calculate email deliverability rate
 */
analyticsSnapshotSchema.virtual('emailDeliverabilityRate').get(function() {
  const sent = this.email?.sent || 0;
  const delivered = this.email?.delivered || 0;
  return sent > 0 ? ((delivered / sent) * 100).toFixed(2) : '0.00';
});

/**
 * Calculate total engagement rate (social)
 */
analyticsSnapshotSchema.virtual('totalEngagementRate').get(function() {
  const impressions = this.social?.impressions || 0;
  const engagement = this.social?.totalEngagement || 0;
  return impressions > 0 ? ((engagement / impressions) * 100).toFixed(2) : '0.00';
});

/**
 * Get period duration in milliseconds
 */
analyticsSnapshotSchema.virtual('duration').get(function() {
  return this.endDate.getTime() - this.startDate.getTime();
});

// ============================================================================
// INSTANCE METHODS
// ============================================================================

/**
 * Get the next snapshot period based on granularity
 *
 * @returns {Object} Object with startDate and endDate for next period
 */
analyticsSnapshotSchema.methods.getNextPeriod = function() {
  const { granularity, endDate } = this;
  const start = new Date(endDate);
  const end = new Date(endDate);

  switch (granularity) {
    case 'hourly':
      start.setHours(start.getHours() + 1);
      end.setHours(end.getHours() + 1);
      break;
    case 'daily':
      start.setDate(start.getDate() + 1);
      end.setDate(end.getDate() + 1);
      break;
    case 'weekly':
      start.setDate(start.getDate() + 7);
      end.setDate(end.getDate() + 7);
      break;
    case 'monthly':
      start.setMonth(start.getMonth() + 1);
      end.setMonth(end.getMonth() + 1);
      break;
    case 'quarterly':
      start.setMonth(start.getMonth() + 3);
      end.setMonth(end.getMonth() + 3);
      break;
    case 'yearly':
      start.setFullYear(start.getFullYear() + 1);
      end.setFullYear(end.getFullYear() + 1);
      break;
  }

  return { startDate: start, endDate: end };
};

/**
 * Get the previous snapshot period based on granularity
 *
 * @returns {Object} Object with startDate and endDate for previous period
 */
analyticsSnapshotSchema.methods.getPreviousPeriod = function() {
  const { granularity, startDate } = this;
  const start = new Date(startDate);
  const end = new Date(startDate);

  switch (granularity) {
    case 'hourly':
      start.setHours(start.getHours() - 1);
      end.setHours(end.getHours() - 1);
      break;
    case 'daily':
      start.setDate(start.getDate() - 1);
      end.setDate(end.getDate() - 1);
      break;
    case 'weekly':
      start.setDate(start.getDate() - 7);
      end.setDate(end.getDate() - 7);
      break;
    case 'monthly':
      start.setMonth(start.getMonth() - 1);
      end.setMonth(end.getMonth() - 1);
      break;
    case 'quarterly':
      start.setMonth(start.getMonth() - 3);
      end.setMonth(end.getMonth() - 3);
      break;
    case 'yearly':
      start.setFullYear(start.getFullYear() - 1);
      end.setFullYear(end.getFullYear() - 1);
      break;
  }

  return { startDate: start, endDate: end };
};

/**
 * Merge data from another snapshot into this one
 * Useful for combining partial snapshots
 *
 * @param {Object} otherSnapshot - Another analytics snapshot document
 * @returns {AnalyticsSnapshot} This document with merged data
 */
analyticsSnapshotSchema.methods.merge = function(otherSnapshot) {
  if (!otherSnapshot) return this;

  // Merge lead metrics
  if (otherSnapshot.leads) {
    this.leads = this.leads || {};
    for (const key of Object.keys(otherSnapshot.leads)) {
      if (typeof otherSnapshot.leads[key] === 'number') {
        this.leads[key] = (this.leads[key] || 0) + otherSnapshot.leads[key];
      }
    }
  }

  // Merge email metrics
  if (otherSnapshot.email) {
    this.email = this.email || {};
    for (const key of Object.keys(otherSnapshot.email)) {
      if (typeof otherSnapshot.email[key] === 'number') {
        this.email[key] = (this.email[key] || 0) + otherSnapshot.email[key];
      }
    }
  }

  // Merge campaign metrics
  if (otherSnapshot.campaigns) {
    this.campaigns = this.campaigns || {};
    for (const key of Object.keys(otherSnapshot.campaigns)) {
      if (typeof otherSnapshot.campaigns[key] === 'number') {
        this.campaigns[key] = (this.campaigns[key] || 0) + otherSnapshot.campaigns[key];
      }
    }
  }

  // Merge sequence metrics
  if (otherSnapshot.sequences) {
    this.sequences = this.sequences || {};
    for (const key of Object.keys(otherSnapshot.sequences)) {
      if (typeof otherSnapshot.sequences[key] === 'number') {
        this.sequences[key] = (this.sequences[key] || 0) + otherSnapshot.sequences[key];
      }
    }
  }

  // Merge social metrics
  if (otherSnapshot.social) {
    this.social = this.social || {};
    for (const key of Object.keys(otherSnapshot.social)) {
      if (typeof otherSnapshot.social[key] === 'number') {
        this.social[key] = (this.social[key] || 0) + otherSnapshot.social[key];
      }
    }
  }

  // Merge revenue metrics
  if (otherSnapshot.revenue) {
    this.revenue = this.revenue || {};
    for (const key of Object.keys(otherSnapshot.revenue)) {
      if (typeof otherSnapshot.revenue[key] === 'number') {
        this.revenue[key] = (this.revenue[key] || 0) + otherSnapshot.revenue[key];
      }
    }
  }

  // Merge funnel metrics
  if (otherSnapshot.funnel) {
    this.funnel = this.funnel || {};
    for (const key of Object.keys(otherSnapshot.funnel)) {
      if (typeof otherSnapshot.funnel[key] === 'number') {
        this.funnel[key] = (this.funnel[key] || 0) + otherSnapshot.funnel[key];
      }
    }
  }

  // Merge traffic metrics
  if (otherSnapshot.traffic) {
    this.traffic = this.traffic || {};
    for (const key of Object.keys(otherSnapshot.traffic)) {
      if (typeof otherSnapshot.traffic[key] === 'number') {
        this.traffic[key] = (this.traffic[key] || 0) + otherSnapshot.traffic[key];
      }
    }
  }

  return this;
};

/**
 * Generate summary object for dashboard display
 *
 * @returns {Object} Summary object with key metrics
 */
analyticsSnapshotSchema.methods.toSummary = function() {
  return {
    period: {
      granularity: this.granularity,
      startDate: this.startDate,
      endDate: this.endDate,
      label: this.label,
    },
    leads: {
      total: this.leads?.total || 0,
      new: this.leads?.new || 0,
      qualified: this.leads?.qualified || 0,
      converted: this.leads?.converted || 0,
    },
    email: {
      sent: this.email?.sent || 0,
      openRate: this.email?.openRate || 0,
      clickRate: this.email?.clickRate || 0,
    },
    campaigns: {
      total: this.campaigns?.total || 0,
      active: this.campaigns?.active || 0,
    },
    sequences: {
      active: this.sequences?.active || 0,
      enrollments: this.sequences?.totalEnrollments || 0,
      completionRate: this.sequences?.completionRate || 0,
    },
    social: {
      posts: this.social?.totalPosts || 0,
      engagement: this.social?.totalEngagement || 0,
      engagementRate: this.social?.engagementRate || 0,
    },
    revenue: {
      total: this.revenue?.total || 0,
      growthRate: this.revenue?.growthRate || 0,
    },
    growth: this.growth || {},
  };
};

// ============================================================================
// STATIC METHODS
// ============================================================================

/**
 * Find or create a snapshot for a specific period and granularity
 *
 * @param {Date} startDate - Start date of the period
 * @param {Date} endDate - End date of the period
 * @param {string} granularity - Time granularity (hourly, daily, weekly, monthly, etc.)
 * @param {string} [userId] - Optional user ID for personal snapshots
 * @returns {Promise<AnalyticsSnapshot>} The snapshot document
 */
analyticsSnapshotSchema.statics.findOrCreate = async function(startDate, endDate, granularity, userId = null) {
  const query = {
    granularity,
    startDate: new Date(startDate),
    endDate: new Date(endDate),
  };

  if (userId) {
    query.userId = userId;
  }

  let snapshot = await this.findOne(query);

  if (!snapshot) {
    snapshot = new this(query);
    await snapshot.save();
  }

  return snapshot;
};

/**
 * Get snapshots for a date range
 *
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {string} granularity - Time granularity filter
 * @returns {Promise<AnalyticsSnapshot[]>} Array of snapshots
 */
analyticsSnapshotSchema.statics.getInRange = async function(startDate, endDate, granularity = null) {
  const query = {
    startDate: { $gte: new Date(startDate) },
    endDate: { $lte: new Date(endDate) },
  };

  if (granularity) {
    query.granularity = granularity;
  }

  return this.find(query).sort({ startDate: 1 }).lean();
};

/**
 * Get the latest snapshot for a given granularity
 *
 * @param {string} granularity - Time granularity
 * @param {string} [userId] - Optional user ID filter
 * @returns {Promise<AnalyticsSnapshot|null>} Latest snapshot or null
 */
analyticsSnapshotSchema.statics.getLatest = async function(granularity = 'daily', userId = null) {
  const query = { granularity };

  if (userId) {
    query.userId = userId;
  }

  return this.findOne(query).sort({ startDate: -1 });
};

/**
 * Get aggregation for a specific granularity across date range
 * Combines multiple snapshots into a single aggregated result
 *
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {string} granularity - Time granularity
 * @returns {Promise<Object>} Aggregated metrics
 */
analyticsSnapshotSchema.statics.getAggregate = async function(startDate, endDate, granularity = 'daily') {
  const snapshots = await this.getInRange(startDate, endDate, granularity);

  if (snapshots.length === 0) {
    return null;
  }

  // Start with an empty aggregate object
  const aggregate = {
    period: {
      granularity,
      startDate: new Date(Math.min(...snapshots.map(s => s.startDate))),
      endDate: new Date(Math.max(...snapshots.map(s => s.endDate))),
    },
    leads: {
      total: 0, new: 0, qualified: 0, converted: 0,
      bySource: {}, byStage: {}, avgScore: 0,
    },
    email: {
      sent: 0, delivered: 0, uniqueOpens: 0, uniqueClicks: 0,
      bounces: 0, unsubscribes: 0, conversions: 0, revenue: 0,
      openRate: 0, clickRate: 0, clickToOpenRate: 0,
      bounceRate: 0, unsubscribeRate: 0,
    },
    campaigns: {
      total: 0, active: 0, scheduled: 0, completed: 0,
    },
    sequences: {
      total: 0, active: 0, totalEnrollments: 0,
      completedEnrollments: 0, completionRate: 0,
    },
    social: {
      totalPosts: 0, published: 0, impressions: 0,
      totalEngagement: 0, engagementRate: 0,
    },
    abTests: {
      total: 0, active: 0, completed: 0, withWinner: 0,
    },
    revenue: {
      total: 0, recurring: 0, oneTime: 0,
      projected: 0, pipelineValue: 0, roi: 0,
    },
    funnel: {
      visitors: 0, engaged: 0, leads: 0,
      qualified: 0, opportunities: 0, converted: 0,
    },
    traffic: {
      sessions: 0, uniqueVisitors: 0, pageViews: 0,
      bounceRate: 0, avgSessionDuration: 0,
    },
  };

  // Sum up all numeric values
  for (const snapshot of snapshots) {
    if (snapshot.leads) {
      for (const key of ['total', 'new', 'qualified', 'converted']) {
        aggregate.leads[key] += snapshot.leads[key] || 0;
      }
    }

    if (snapshot.email) {
      for (const key of ['sent', 'delivered', 'uniqueOpens', 'uniqueClicks', 'bounces', 'unsubscribes', 'conversions', 'revenue']) {
        aggregate.email[key] += snapshot.email[key] || 0;
      }
    }

    if (snapshot.campaigns) {
      for (const key of ['total', 'active', 'scheduled', 'completed']) {
        aggregate.campaigns[key] += snapshot.campaigns[key] || 0;
      }
    }

    if (snapshot.sequences) {
      for (const key of ['total', 'active', 'totalEnrollments', 'completedEnrollments']) {
        aggregate.sequences[key] += snapshot.sequences[key] || 0;
      }
    }

    if (snapshot.social) {
      for (const key of ['totalPosts', 'published', 'impressions', 'totalEngagement']) {
        aggregate.social[key] += snapshot.social[key] || 0;
      }
    }

    if (snapshot.abTests) {
      for (const key of ['total', 'active', 'completed', 'withWinner']) {
        aggregate.abTests[key] += snapshot.abTests[key] || 0;
      }
    }

    if (snapshot.revenue) {
      for (const key of ['total', 'recurring', 'oneTime', 'projected', 'pipelineValue']) {
        aggregate.revenue[key] += snapshot.revenue[key] || 0;
      }
    }

    if (snapshot.funnel) {
      for (const key of ['visitors', 'engaged', 'leads', 'qualified', 'opportunities', 'converted']) {
        aggregate.funnel[key] += snapshot.funnel[key] || 0;
      }
    }

    if (snapshot.traffic) {
      for (const key of ['sessions', 'uniqueVisitors', 'pageViews']) {
        aggregate.traffic[key] += snapshot.traffic[key] || 0;
      }
    }
  }

  // Calculate derived metrics
  aggregate.email.openRate = aggregate.email.sent > 0
    ? ((aggregate.email.uniqueOpens / aggregate.email.sent) * 100).toFixed(2)
    : 0;
  aggregate.email.clickRate = aggregate.email.sent > 0
    ? ((aggregate.email.uniqueClicks / aggregate.email.sent) * 100).toFixed(2)
    : 0;
  aggregate.email.clickToOpenRate = aggregate.email.uniqueOpens > 0
    ? ((aggregate.email.uniqueClicks / aggregate.email.uniqueOpens) * 100).toFixed(2)
    : 0;

  aggregate.sequences.completionRate = aggregate.sequences.totalEnrollments > 0
    ? ((aggregate.sequences.completedEnrollments / aggregate.sequences.totalEnrollments) * 100).toFixed(2)
    : 0;

  aggregate.social.engagementRate = aggregate.social.impressions > 0
    ? ((aggregate.social.totalEngagement / aggregate.social.impressions) * 100).toFixed(2)
    : 0;

  // Funnel rates
  aggregate.funnel.rates = {
    visitorToEngaged: aggregate.funnel.visitors > 0
      ? ((aggregate.funnel.engaged / aggregate.funnel.visitors) * 100).toFixed(2)
      : 0,
    engagedToLead: aggregate.funnel.engaged > 0
      ? ((aggregate.funnel.leads / aggregate.funnel.engaged) * 100).toFixed(2)
      : 0,
    leadToQualified: aggregate.funnel.leads > 0
      ? ((aggregate.funnel.qualified / aggregate.funnel.leads) * 100).toFixed(2)
      : 0,
    overall: aggregate.funnel.visitors > 0
      ? ((aggregate.funnel.converted / aggregate.funnel.visitors) * 100).toFixed(2)
      : 0,
  };

  return aggregate;
};

/**
 * Delete snapshots older than a certain date
 * Useful for cleanup and data retention
 *
 * @param {Date} cutoffDate - Delete snapshots generated before this date
 * @param {string} [granularity] - Optional granularity filter
 * @returns {Promise<number>} Number of snapshots deleted
 */
analyticsSnapshotSchema.statics.deleteOlderThan = async function(cutoffDate, granularity = null) {
  const query = {
    generatedAt: { $lt: new Date(cutoffDate) },
  };

  if (granularity) {
    query.granularity = granularity;
  }

  const result = await this.deleteMany(query);
  return result.deletedCount || 0;
};

/**
 * Calculate growth metrics comparing two periods
 *
 * @param {Date} currentStart - Current period start
 * @param {Date} currentEnd - Current period end
 * @param {Date} previousStart - Previous period start
 * @param {Date} previousEnd - Previous period end
 * @param {string} granularity - Time granularity
 * @returns {Promise<Object>} Growth metrics with percentages
 */
analyticsSnapshotSchema.statics.comparePeriods = async function(
  currentStart,
  currentEnd,
  previousStart,
  previousEnd,
  granularity = 'daily'
) {
  const [current, previous] = await Promise.all([
    this.getAggregate(currentStart, currentEnd, granularity),
    this.getAggregate(previousStart, previousEnd, granularity),
  ]);

  if (!current || !previous) {
    return null;
  }

  const calculateGrowth = (currentValue, previousValue) => {
    if (previousValue === 0) return currentValue > 0 ? 100 : 0;
    return ((currentValue - previousValue) / previousValue * 100).toFixed(2);
  };

  return {
    leads: {
      new: calculateGrowth(current.leads.new, previous.leads.new),
      qualified: calculateGrowth(current.leads.qualified, previous.leads.qualified),
      converted: calculateGrowth(current.leads.converted, previous.leads.converted),
    },
    email: {
      sent: calculateGrowth(current.email.sent, previous.email.sent),
      openRate: (current.email.openRate - previous.email.openRate).toFixed(2),
      clickRate: (current.email.clickRate - previous.email.clickRate).toFixed(2),
    },
    campaigns: {
      total: calculateGrowth(current.campaigns.total, previous.campaigns.total),
    },
    sequences: {
      enrollments: calculateGrowth(current.sequences.totalEnrollments, previous.sequences.totalEnrollments),
      completionRate: (current.sequences.completionRate - previous.sequences.completionRate).toFixed(2),
    },
    social: {
      posts: calculateGrowth(current.social.totalPosts, previous.social.totalPosts),
      engagement: calculateGrowth(current.social.totalEngagement, previous.social.totalEngagement),
      engagementRate: (current.social.engagementRate - previous.social.engagementRate).toFixed(2),
    },
    revenue: {
      total: calculateGrowth(current.revenue.total, previous.revenue.total),
    },
    conversionRate: (current.funnel.rates.overall - previous.funnel.rates.overall).toFixed(2),
  };
};

// ============================================================================
// PRE-SAVE MIDDLEWARE
// ============================================================================

analyticsSnapshotSchema.pre('save', function(next) {
  // Set year, month, week, day, hour based on startDate
  const startDate = this.startDate || new Date();

  this.year = startDate.getFullYear();
  this.month = startDate.getMonth() + 1;
  this.day = startDate.getDate();
  this.hour = startDate.getHours();

  // Calculate week of year
  const firstDayOfYear = new Date(startDate.getFullYear(), 0, 1);
  const pastDaysOfYear = (startDate - firstDayOfYear) / 86400000;
  this.week = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);

  // Generate label if not set
  if (!this.label) {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];

    switch (this.granularity) {
      case 'hourly':
        this.label = `${startDate.getDate()} ${months[startDate.getMonth()]} ${startDate.getFullYear()} - ${startDate.getHours()}:00`;
        break;
      case 'daily':
        this.label = `${startDate.getDate()} ${months[startDate.getMonth()]} ${startDate.getFullYear()}`;
        break;
      case 'weekly':
        this.label = `Week ${this.week}, ${months[startDate.getMonth()]} ${startDate.getFullYear()}`;
        break;
      case 'monthly':
        this.label = `${months[startDate.getMonth()]} ${startDate.getFullYear()}`;
        break;
      case 'quarterly':
        const quarter = Math.floor(startDate.getMonth() / 3) + 1;
        this.label = `Q${quarter} ${startDate.getFullYear()}`;
        break;
      case 'yearly':
        this.label = `${startDate.getFullYear()}`;
        break;
    }
  }

  next();
});

// ============================================================================
// MODEL EXPORT
// ============================================================================

const AnalyticsSnapshot = mongoose.model('AnalyticsSnapshot', analyticsSnapshotSchema);

export default AnalyticsSnapshot;
