import mongoose from 'mongoose';

/**
 * Analytics Dashboard Model - Phase 7: Analytics Dashboard
 *
 * This model manages comprehensive marketing analytics including:
 * - Dashboard metric snapshots at different time granularities
 * - Aggregated metrics from leads, campaigns, sequences, social posts, A/B tests
 * - Growth rate calculations and trend analysis
 * - Conversion funnel tracking
 * - ROI and revenue analytics
 * - Dashboard widget configurations
 *
 * @version 1.0.0
 * @since 2026-01-23
 */

// ============================================================================
// SUB-SCHEMAS
// ============================================================================

/**
 * Lead Metrics Sub-Schema
 * Aggregated lead generation and pipeline metrics
 */
const leadMetricsSchema = new mongoose.Schema({
  // Lead counts by status
  total: { type: Number, default: 0 },
  new: { type: Number, default: 0 },
  contacted: { type: Number, default: 0 },
  qualified: { type: Number, default: 0 },
  proposal: { type: Number, default: 0 },
  negotiation: { type: Number, default: 0 },
  converted: { type: Number, default: 0 },
  unqualified: { type: Number, default: 0 },
  recycled: { type: Number, default: 0 },

  // Lead source breakdown
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

  // Pipeline metrics
  pipelineSnapshot: {
    new: { type: Number, default: 0 },
    contacted: { type: Number, default: 0 },
    meeting_scheduled: { type: Number, default: 0 },
    proposal_sent: { type: Number, default: 0 },
    negotiation: { type: Number, default: 0 },
    won: { type: Number, default: 0 },
    lost: { type: Number, default: 0 },
  },

  // Lead quality metrics
  avgLeadScore: { type: Number, default: 0 },
  highValueLeads: { type: Number, default: 0 }, // leadScore > 60

  // Assignment metrics
  assignedLeads: { type: Number, default: 0 },
  unassignedLeads: { type: Number, default: 0 },
  activeEmployees: { type: Number, default: 0 },

  // Velocity metrics (time in pipeline stages)
  avgTimeToQualify: { type: Number, default: 0 }, // hours
  avgTimeToConvert: { type: Number, default: 0 }, // hours
  avgStageDurations: {
    new: { type: Number, default: 0 },
    contacted: { type: Number, default: 0 },
    meeting_scheduled: { type: Number, default: 0 },
    proposal_sent: { type: Number, default: 0 },
    negotiation: { type: Number, default: 0 },
  },

  // Value metrics
  totalPipelineValue: { type: Number, default: 0 },
  weightedPipelineValue: { type: Number, default: 0 }, // estimatedValue * probability
}, { _id: false });

/**
 * Email & Campaign Metrics Sub-Schema
 * Aggregated email marketing performance
 */
const emailMetricsSchema = new mongoose.Schema({
  // Campaign performance
  totalCampaigns: { type: Number, default: 0 },
  activeCampaigns: { type: Number, default: 0 },
  sentCampaigns: { type: Number, default: 0 },
  scheduledCampaigns: { type: Number, default: 0 },

  // Email deliverability
  emailsSent: { type: Number, default: 0 },
  emailsDelivered: { type: Number, default: 0 },
  emailsBounced: { type: Number, default: 0 },
  emailsFailed: { type: Number, default: 0 },
  deliveryRate: { type: Number, default: 0 }, // percentage

  // Engagement metrics
  uniqueOpens: { type: Number, default: 0 },
  totalOpens: { type: Number, default: 0 },
  uniqueClicks: { type: Number, default: 0 },
  totalClicks: { type: Number, default: 0 },
  openRate: { type: Number, default: 0 }, // percentage
  clickRate: { type: Number, default: 0 }, // percentage
  clickToOpenRate: { type: Number, default: 0 }, // percentage

  // Negative metrics
  unsubscribes: { type: Number, default: 0 },
  spamComplaints: { type: Number, default: 0 },
  unsubscribeRate: { type: Number, default: 0 },
  spamRate: { type: Number, default: 0 },

  // Top performing campaigns
  topCampaigns: [{
    campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign' },
    name: String,
    sent: Number,
    openRate: Number,
    clickRate: Number,
    conversions: Number,
  }],

  // Template performance
  templatePerformance: [{
    templateId: { type: mongoose.Schema.Types.ObjectId, ref: 'EmailTemplate' },
    name: String,
    used: Number,
    avgOpenRate: Number,
    avgClickRate: Number,
  }],

  // Revenue attribution
  revenueAttributed: { type: Number, default: 0 },
  costPerEmail: { type: Number, default: 0 },
  roi: { type: Number, default: 0 }, // percentage
}, { _id: false });

/**
 * Sequence Metrics Sub-Schema
 * Email sequence/drip campaign performance
 */
const sequenceMetricsSchema = new mongoose.Schema({
  // Sequence counts
  totalSequences: { type: Number, default: 0 },
  activeSequences: { type: Number, default: 0 },
  pausedSequences: { type: Number, default: 0 },

  // Enrollment metrics
  totalEnrolled: { type: Number, default: 0 },
  currentlyActive: { type: Number, default: 0 },
  completedToday: { type: Number, default: 0 },
  unenrolled: { type: Number, default: 0 },

  // Engagement metrics
  emailsSent: { type: Number, default: 0 },
  uniqueOpens: { type: Number, default: 0 },
  uniqueClicks: { type: Number, default: 0 },
  openRate: { type: Number, default: 0 },
  clickRate: { type: Number, default: 0 },

  // Completion metrics
  completionRate: { type: Number, default: 0 },
  avgCompletionTime: { type: Number, default: 0 }, // hours
  dropOffRate: { type: Number, default: 0 },

  // Step-by-step completion
  stepCompletion: [{
    stepOrder: Number,
    completed: Number,
    total: Number,
    rate: Number,
  }],

  // Top performing sequences
  topSequences: [{
    sequenceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Sequence' },
    name: String,
    type: String,
    enrolled: Number,
    completed: Number,
    completionRate: Number,
    conversionRate: Number,
  }],

  // Revenue from sequences
  revenueGenerated: { type: Number, default: 0 },
  conversions: { type: Number, default: 0 },
}, { _id: false });

/**
 * Social Media Metrics Sub-Schema
 * Social media platform performance
 */
const socialMetricsSchema = new mongoose.Schema({
  // Post counts by platform
  linkedin: {
    totalPosts: { type: Number, default: 0 },
    published: { type: Number, default: 0 },
    scheduled: { type: Number, default: 0 },
    draft: { type: Number, default: 0 },
  },
  twitter: {
    totalPosts: { type: Number, default: 0 },
    published: { type: Number, default: 0 },
    scheduled: { type: Number, default: 0 },
    draft: { type: Number, default: 0 },
  },

  // Engagement totals across platforms
  totalLikes: { type: Number, default: 0 },
  totalComments: { type: Number, default: 0 },
  totalShares: { type: Number, default: 0 },
  totalClicks: { type: Number, default: 0 },
  totalImpressions: { type: Number, default: 0 },

  // Engagement rates
  avgEngagementRate: { type: Number, default: 0 },

  // Follower growth
  linkedinFollowers: { type: Number, default: 0 },
  twitterFollowers: { type: Number, default: 0 },
  totalFollowers: { type: Number, default: 0 },
  followerGrowthRate: { type: Number, default: 0 }, // percentage

  // Top performing posts
  topPosts: [{
    postId: { type: mongoose.Schema.Types.ObjectId, ref: 'SocialPost' },
    platform: String,
    content: String, // truncated
    likes: Number,
    comments: Number,
    shares: Number,
    engagementRate: Number,
  }],

  // Platform comparison
  platformComparison: [{
    platform: { type: String, enum: ['linkedin', 'twitter'] },
    posts: Number,
    likes: Number,
    comments: Number,
    shares: Number,
    engagementRate: Number,
  }],
}, { _id: false });

/**
 * A/B Test Metrics Sub-Schema
 * A/B testing experiment results
 */
const abTestMetricsSchema = new mongoose.Schema({
  // Test counts
  totalTests: { type: Number, default: 0 },
  activeTests: { type: Number, default: 0 },
  completedTests: { type: Number, default: 0 },

  // Test breakdown by type
  byType: {
    subject_line: { type: Number, default: 0 },
    content: { type: Number, default: 0 },
    sender: { type: Number, default: 0 },
    send_time: { type: Number, default: 0 },
    template: { type: Number, default: 0 },
    landing_page: { type: Number, default: 0 },
    multivariate: { type: Number, default: 0 },
  },

  // Results
  testsSignificant: { type: Number, default: 0 },
  avgConfidenceLevel: { type: Number, default: 0 },

  // Performance improvements from winners
  avgImprovement: { type: Number, default: 0 }, // percentage

  // Active tests overview
  activeTestsList: [{
    testId: { type: mongoose.Schema.Types.ObjectId, ref: 'ABTest' },
    name: String,
    testType: String,
    variants: Number,
    startedAt: Date,
    status: String,
  }],

  // Recent winners
  recentWinners: [{
    testId: { type: mongoose.Schema.Types.ObjectId, ref: 'ABTest' },
    testName: String,
    winningVariant: String,
    improvement: Number,
    confidenceLevel: Number,
  }],
}, { _id: false });

/**
 * Revenue & ROI Metrics Sub-Schema
 * Financial performance tracking
 */
const revenueMetricsSchema = new mongoose.Schema({
  // Revenue totals
  totalRevenue: { type: Number, default: 0 },
  recurringRevenue: { type: Number, default: 0 },
  oneTimeRevenue: { type: Number, default: 0 },

  // Cost tracking
  totalCost: { type: Number, default: 0 },
  emailCost: { type: Number, default: 0 },
  advertisingCost: { type: Number, default: 0 },
  laborCost: { type: Number, default: 0 },
  otherCost: { type: Number, default: 0 },

  // ROI calculations
  roi: { type: Number, default: 0 }, // percentage
  marketingROI: { type: Number, default: 0 }, // revenue / marketing cost

  // Cost per metrics
  costPerLead: { type: Number, default: 0 },
  costPerAcquisition: { type: Number, default: 0 },
  costPerConversion: { type: Number, default: 0 },

  // Revenue by source
  revenueBySource: [{
    source: String,
    revenue: Number,
    percentage: Number,
  }],

  // Revenue by campaign
  revenueByCampaign: [{
    campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign' },
    name: String,
    revenue: Number,
    cost: Number,
    roi: Number,
  }],
}, { _id: false });

/**
 * Growth Rate Sub-Schema
 * Period-over-period growth calculations
 */
const growthRateSchema = new mongoose.Schema({
  // Growth percentages
  leadsGrowth: { type: Number, default: 0 }, // percentage
  conversionsGrowth: { type: Number, default: 0 },
  revenueGrowth: { type: Number, default: 0 },
  emailEngagementGrowth: { type: Number, default: 0 },
  socialGrowth: { type: Number, default: 0 },

  // Trend indicators
  leadsTrend: { type: String, enum: ['up', 'down', 'stable'], default: 'stable' },
  conversionsTrend: { type: String, enum: ['up', 'down', 'stable'], default: 'stable' },
  revenueTrend: { type: String, enum: ['up', 'down', 'stable'], default: 'stable' },

  // Comparison with previous period
  previousPeriod: {
    leads: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },
    avgOpenRate: { type: Number, default: 0 },
    avgClickRate: { type: Number, default: 0 },
  },
}, { _id: false });

/**
 * Funnel Metrics Sub-Schema
 * Conversion funnel tracking
 */
const funnelMetricsSchema = new mongoose.Schema({
  // Funnel stages
  visitors: { type: Number, default: 0 },
  visitorsEngaged: { type: Number, default: 0 }, // meaningful interaction
  leads: { type: Number, default: 0 },
  marketingQualifiedLeads: { type: Number, default: 0 },
  salesQualifiedLeads: { type: Number, default: 0 },
  opportunities: { type: Number, default: 0 },
  conversions: { type: Number, default: 0 },

  // Stage-to-stage conversion rates
  visitorToLeadRate: { type: Number, default: 0 },
  leadToMqlRate: { type: Number, default: 0 },
  mqlToSqlRate: { type: Number, default: 0 },
  sqlToOpportunityRate: { type: Number, default: 0 },
  opportunityToCloseRate: { type: Number, default: 0 },

  // Overall conversion rate
  overallConversionRate: { type: Number, default: 0 },

  // Funnel velocity (time through stages)
  avgCycleTime: { type: Number, default: 0 }, // days to convert
  avgTimeInStage: {
    lead: { type: Number, default: 0 }, // days
    mql: { type: Number, default: 0 },
    sql: { type: Number, default: 0 },
    opportunity: { type: Number, default: 0 },
  },

  // Drop-off analysis
  dropOffPoints: [{
    fromStage: String,
    toStage: String,
    dropped: Number,
    rate: Number,
  }],
}, { _id: false });

/**
 * Widget Config Sub-Schema
 * Dashboard widget configuration
 */
const widgetConfigSchema = new mongoose.Schema({
  widgetId: { type: String, required: true },
  type: {
    type: String,
    enum: ['metric', 'chart', 'table', 'funnel', 'gauge', 'list', 'calendar'],
    required: true,
  },
  title: String,
  position: {
    row: { type: Number, default: 0 },
    col: { type: Number, default: 0 },
    rowSpan: { type: Number, default: 1 },
    colSpan: { type: Number, default: 1 },
  },
  dataSource: String, // 'leads', 'email', 'campaigns', 'sequences', 'social', 'revenue'
  metricType: String, // 'total', 'average', 'rate', 'growth'
  visualization: String, // 'number', 'line', 'bar', 'pie', 'table', etc.
  config: mongoose.Schema.Types.Mixed, // Widget-specific config
  refreshInterval: { type: Number, default: 300000 }, // ms (5 min default)
  enabled: { type: Boolean, default: true },
}, { _id: false });

// ============================================================================
// MAIN ANALYTICS DASHBOARD SCHEMA
// ============================================================================

const analyticsDashboardSchema = new mongoose.Schema({
  // -------------------------------------------------------------------------
  // TIME PERIOD & GRANULARITY
  // -------------------------------------------------------------------------

  /** Time granularity of this snapshot */
  period: {
    type: String,
    required: true,
    enum: ['hourly', 'daily', 'weekly', 'monthly'],
    index: true,
  },

  /** Start date of this period */
  date: {
    type: Date,
    required: true,
    index: true,
  },

  /** End date of this period (for hourly/weekly/monthly aggregations) */
  dateRange: {
    start: Date,
    end: Date,
  },

  /** Year for monthly aggregations */
  year: {
    type: Number,
    min: 2020,
    max: 2100,
  },

  /** Month (1-12) for monthly aggregations */
  month: {
    type: Number,
    min: 1,
    max: 12,
  },

  /** Week number (1-53) for weekly aggregations */
  week: {
    type: Number,
    min: 1,
    max: 53,
  },

  /** Hour (0-23) for hourly aggregations */
  hour: {
    type: Number,
    min: 0,
    max: 23,
  },

  // -------------------------------------------------------------------------
  // AGGREGATED METRICS
  // -------------------------------------------------------------------------

  /** Lead generation metrics */
  leads: leadMetricsSchema,

  /** Email and campaign metrics */
  email: emailMetricsSchema,

  /** Sequence/drip campaign metrics */
  sequences: sequenceMetricsSchema,

  /** Social media metrics */
  social: socialMetricsSchema,

  /** A/B testing metrics */
  abTests: abTestMetricsSchema,

  /** Revenue and ROI metrics */
  revenue: revenueMetricsSchema,

  /** Growth rates compared to previous period */
  growth: growthRateSchema,

  /** Conversion funnel metrics */
  funnel: funnelMetricsSchema,

  // -------------------------------------------------------------------------
  // DASHBOARD CONFIGURATION
  // -------------------------------------------------------------------------

  /** Dashboard widgets configuration */
  widgets: [widgetConfigSchema],

  /** Custom KPIs defined by user */
  customKPIs: [{
    name: String,
    value: mongoose.Schema.Types.Mixed,
    target: Number,
    unit: String,
    trend: String, // 'up', 'down', 'stable'
  }],

  // -------------------------------------------------------------------------
  // METADATA
  // -------------------------------------------------------------------------

  /** When these metrics were computed */
  computedAt: {
    type: Date,
    default: Date.now,
  },

  /** Computation status */
  status: {
    type: String,
    enum: ['pending', 'computing', 'complete', 'failed'],
    default: 'complete',
  },

  /** Any errors during computation */
  computationError: String,

  /** Data freshness indicator */
  isFresh: {
    type: Boolean,
    default: true,
  },

  /** Tags for filtering */
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
  }],

  /** Created at timestamp */
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },

  /** Updated at timestamp */
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// ============================================================================
// INDEXES
// ============================================================================

// Compound index for period lookups
analyticsDashboardSchema.index({ period: 1, date: -1 });
analyticsDashboardSchema.index({ period: 1, year: 1, month: 1 });
analyticsDashboardSchema.index({ period: 1, year: 1, week: 1 });
analyticsDashboardSchema.index({ period: 1, date: 1, hour: 1 });

// Index for date range queries
analyticsDashboardSchema.index({ dateRange: { start: 1, end: 1 } });

// Index for fresh data queries
analyticsDashboardSchema.index({ isFresh: 1, period: 1 });

// ============================================================================
// VIRTUAL PROPERTIES
// ============================================================================

/**
 * Calculate overall marketing health score (0-100)
 */
analyticsDashboardSchema.virtual('healthScore').get(function() {
  let score = 50; // Base score

  // Lead generation contributes up to 20 points
  const leadGrowth = Math.max(-50, Math.min(50, this.growth?.leadsGrowth || 0));
  score += Math.sign(leadGrowth) * Math.min(20, Math.abs(leadGrowth) / 2.5);

  // Conversions contribute up to 20 points
  const conversionGrowth = Math.max(-50, Math.min(50, this.growth?.conversionsGrowth || 0));
  score += Math.sign(conversionGrowth) * Math.min(20, Math.abs(conversionGrowth) / 2.5);

  // Email engagement contributes up to 10 points
  if (this.email?.openRate > 20) score += 5;
  if (this.email?.clickRate > 5) score += 5;

  // Revenue growth contributes up to 20 points
  const revenueGrowth = Math.max(-100, Math.min(100, this.growth?.revenueGrowth || 0));
  score += Math.sign(revenueGrowth) * Math.min(20, Math.abs(revenueGrowth) / 5);

  return Math.max(0, Math.min(100, score));
});

/**
 * Get period label for display
 */
analyticsDashboardSchema.virtual('periodLabel').get(function() {
  const date = new Date(this.date);

  switch (this.period) {
    case 'hourly':
      return date.toLocaleString('en-US', {
        month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
      });
    case 'daily':
      return date.toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
      });
    case 'weekly':
      return `Week ${this.week} of ${date.getFullYear()}`;
    case 'monthly':
      return date.toLocaleDateString('en-US', {
        month: 'long', year: 'numeric'
      });
    default:
      return date.toISOString();
  }
});

// Ensure virtuals are included in JSON output
analyticsDashboardSchema.set('toJSON', { virtuals: true });
analyticsDashboardSchema.set('toObject', { virtuals: true });

// ============================================================================
// INSTANCE METHODS
// ============================================================================

/**
 * Calculate growth rate compared to a previous snapshot
 *
 * @param {Object} previousMetrics - Metrics from previous period
 * @param {string} metricName - Name of metric to compare
 * @returns {number} Growth percentage
 *
 * @example
 * const growth = snapshot.calculateGrowth(previousSnapshot, 'leads.total');
 */
analyticsDashboardSchema.methods.calculateGrowth = function(previousMetrics, metricName) {
  const keys = metricName.split('.');
  let currentValue = this;
  let previousValue = previousMetrics;

  for (const key of keys) {
    currentValue = currentValue?.[key];
    previousValue = previousValue?.[key];
  }

  if (typeof currentValue !== 'number' || typeof previousValue !== 'number') {
    return 0;
  }

  if (previousValue === 0) {
    return currentValue > 0 ? 100 : 0;
  }

  return Math.round(((currentValue - previousValue) / previousValue) * 10000) / 100;
};

/**
 * Get trend direction for a metric
 *
 * @param {number} growthRate - Growth percentage
 * @returns {string} Trend direction ('up', 'down', 'stable')
 */
analyticsDashboardSchema.methods.getTrendDirection = function(growthRate) {
  if (growthRate > 5) return 'up';
  if (growthRate < -5) return 'down';
  return 'stable';
};

/**
 * Mark as stale (data needs refresh)
 *
 * @returns {this} Updated snapshot
 */
analyticsDashboardSchema.methods.markAsStale = function() {
  this.isFresh = false;
  return this;
};

// ============================================================================
// STATIC METHODS
// ============================================================================

/**
 * Get latest snapshot for a period
 *
 * @param {string} period - Time period ('hourly', 'daily', 'weekly', 'monthly')
 * @returns {Promise<AnalyticsDashboard|null>}
 */
analyticsDashboardSchema.statics.getLatest = async function(period = 'daily') {
  return this.findOne({ period, status: 'complete' })
    .sort({ date: -1 })
    .lean();
};

/**
 * Get snapshots for date range
 *
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {string} period - Time period
 * @returns {Promise<AnalyticsDashboard[]>}
 */
analyticsDashboardSchema.statics.getForRange = async function(startDate, endDate, period = 'daily') {
  return this.find({
    period,
    date: { $gte: startDate, $lte: endDate },
    status: 'complete',
  })
    .sort({ date: 1 })
    .lean();
};

/**
 * Get aggregate metrics for date range
 *
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {string} period - Time period
 * @returns {Promise<Object>} Aggregated metrics
 */
analyticsDashboardSchema.statics.getAggregateForRange = async function(startDate, endDate, period = 'daily') {
  const snapshots = await this.getForRange(startDate, endDate, period);

  if (snapshots.length === 0) {
    return this.getEmptyAggregate();
  }

  return this.aggregateSnapshots(snapshots);
};

/**
 * Aggregate multiple snapshots
 *
 * @param {Array} snapshots - Array of snapshot documents
 * @returns {Object} Aggregated metrics
 */
analyticsDashboardSchema.statics.aggregateSnapshots = function(snapshots) {
  const aggregate = {
    period: 'aggregate',
    dateRange: {
      start: snapshots[0]?.date || new Date(),
      end: snapshots[snapshots.length - 1]?.date || new Date(),
    },
    leads: { total: 0, new: 0, qualified: 0, converted: 0, bySource: {} },
    email: {
      totalCampaigns: 0, emailsSent: 0, emailsDelivered: 0,
      uniqueOpens: 0, uniqueClicks: 0, openRate: 0, clickRate: 0,
    },
    sequences: {
      totalEnrolled: 0, completedToday: 0, emailsSent: 0,
      completionRate: 0, conversions: 0,
    },
    social: {
      totalLikes: 0, totalComments: 0, totalShares: 0,
      totalFollowers: 0, avgEngagementRate: 0,
    },
    abTests: {
      totalTests: 0, completedTests: 0,
      testsSignificant: 0, avgImprovement: 0,
    },
    revenue: {
      totalRevenue: 0, totalCost: 0,
      roi: 0, marketingROI: 0,
    },
    growth: {
      leadsGrowth: 0, conversionsGrowth: 0, revenueGrowth: 0,
    },
    funnel: {
      visitors: 0, leads: 0, conversions: 0,
      overallConversionRate: 0,
    },
  };

  // Sum all metrics
  snapshots.forEach(snapshot => {
    // Leads
    if (snapshot.leads) {
      aggregate.leads.total += snapshot.leads.total || 0;
      aggregate.leads.new += snapshot.leads.new || 0;
      aggregate.leads.qualified += snapshot.leads.qualified || 0;
      aggregate.leads.converted += snapshot.leads.converted || 0;

      if (snapshot.leads.bySource) {
        Object.keys(snapshot.leads.bySource).forEach(source => {
          if (!aggregate.leads.bySource[source]) {
            aggregate.leads.bySource[source] = 0;
          }
          aggregate.leads.bySource[source] += snapshot.leads.bySource[source] || 0;
        });
      }
    }

    // Email
    if (snapshot.email) {
      aggregate.email.totalCampaigns += snapshot.email.totalCampaigns || 0;
      aggregate.email.emailsSent += snapshot.email.emailsSent || 0;
      aggregate.email.emailsDelivered += snapshot.email.emailsDelivered || 0;
      aggregate.email.uniqueOpens += snapshot.email.uniqueOpens || 0;
      aggregate.email.uniqueClicks += snapshot.email.uniqueClicks || 0;
    }

    // Sequences
    if (snapshot.sequences) {
      aggregate.sequences.totalEnrolled += snapshot.sequences.totalEnrolled || 0;
      aggregate.sequences.completedToday += snapshot.sequences.completedToday || 0;
      aggregate.sequences.emailsSent += snapshot.sequences.emailsSent || 0;
      aggregate.sequences.conversions += snapshot.sequences.conversions || 0;
    }

    // Social
    if (snapshot.social) {
      aggregate.social.totalLikes += snapshot.social.totalLikes || 0;
      aggregate.social.totalComments += snapshot.social.totalComments || 0;
      aggregate.social.totalShares += snapshot.social.totalShares || 0;
      aggregate.social.totalFollowers += snapshot.social.totalFollowers || 0;
    }

    // A/B Tests
    if (snapshot.abTests) {
      aggregate.abTests.totalTests += snapshot.abTests.totalTests || 0;
      aggregate.abTests.completedTests += snapshot.abTests.completedTests || 0;
      aggregate.abTests.testsSignificant += snapshot.abTests.testsSignificant || 0;
    }

    // Revenue
    if (snapshot.revenue) {
      aggregate.revenue.totalRevenue += snapshot.revenue.totalRevenue || 0;
      aggregate.revenue.totalCost += snapshot.revenue.totalCost || 0;
    }

    // Funnel
    if (snapshot.funnel) {
      aggregate.funnel.visitors += snapshot.funnel.visitors || 0;
      aggregate.funnel.leads += snapshot.funnel.leads || 0;
      aggregate.funnel.conversions += snapshot.funnel.conversions || 0;
    }
  });

  // Calculate rates
  aggregate.email.openRate = aggregate.email.emailsSent > 0
    ? Math.round((aggregate.email.uniqueOpens / aggregate.email.emailsSent) * 10000) / 100
    : 0;

  aggregate.email.clickRate = aggregate.email.emailsSent > 0
    ? Math.round((aggregate.email.uniqueClicks / aggregate.email.emailsSent) * 10000) / 100
    : 0;

  aggregate.email.deliveryRate = aggregate.email.emailsSent > 0
    ? Math.round((aggregate.email.emailsDelivered / aggregate.email.emailsSent) * 10000) / 100
    : 0;

  aggregate.sequences.completionRate = aggregate.sequences.totalEnrolled > 0
    ? Math.round((aggregate.sequences.completedToday / aggregate.sequences.totalEnrolled) * 10000) / 100
    : 0;

  aggregate.funnel.overallConversionRate = aggregate.funnel.visitors > 0
    ? Math.round((aggregate.funnel.conversions / aggregate.funnel.visitors) * 10000) / 100
    : 0;

  aggregate.revenue.roi = aggregate.revenue.totalCost > 0
    ? Math.round(((aggregate.revenue.totalRevenue - aggregate.revenue.totalCost) / aggregate.revenue.totalCost) * 10000) / 100
    : 0;

  return aggregate;
};

/**
 * Get empty aggregate structure
 *
 * @returns {Object} Empty aggregate
 */
analyticsDashboardSchema.statics.getEmptyAggregate = function() {
  return {
    period: 'aggregate',
    leads: { total: 0, new: 0, qualified: 0, converted: 0, bySource: {} },
    email: {
      totalCampaigns: 0, emailsSent: 0, emailsDelivered: 0,
      uniqueOpens: 0, uniqueClicks: 0, openRate: 0, clickRate: 0,
    },
    sequences: {
      totalEnrolled: 0, completedToday: 0, emailsSent: 0,
      completionRate: 0, conversions: 0,
    },
    social: {
      totalLikes: 0, totalComments: 0, totalShares: 0,
      totalFollowers: 0, avgEngagementRate: 0,
    },
    abTests: {
      totalTests: 0, completedTests: 0,
      testsSignificant: 0, avgImprovement: 0,
    },
    revenue: {
      totalRevenue: 0, totalCost: 0,
      roi: 0, marketingROI: 0,
    },
    growth: {
      leadsGrowth: 0, conversionsGrowth: 0, revenueGrowth: 0,
    },
    funnel: {
      visitors: 0, leads: 0, conversions: 0,
      overallConversionRate: 0,
    },
  };
};

/**
 * Create or update snapshot for a specific date
 *
 * @param {Object} metrics - Metrics data
 * @param {string} period - Time period
 * @param {Date} date - Date of snapshot
 * @returns {Promise<AnalyticsDashboard>}
 */
analyticsDashboardSchema.statics.upsertSnapshot = async function(metrics, period = 'daily', date = new Date()) {
  // Normalize date based on period
  const normalizedDate = new Date(date);
  switch (period) {
    case 'daily':
      normalizedDate.setHours(0, 0, 0, 0);
      break;
    case 'weekly':
      const dayOfWeek = normalizedDate.getDay();
      normalizedDate.setDate(normalizedDate.getDate() - dayOfWeek);
      normalizedDate.setHours(0, 0, 0, 0);
      break;
    case 'monthly':
      normalizedDate.setDate(1);
      normalizedDate.setHours(0, 0, 0, 0);
      break;
    case 'hourly':
      normalizedDate.setMinutes(0, 0, 0);
      break;
  }

  const query = { period, date: normalizedDate };

  const update = {
    $set: {
      ...metrics,
      computedAt: new Date(),
      status: 'complete',
      isFresh: true,
      updatedAt: new Date(),
    },
  };

  return this.findOneAndUpdate(query, update, {
    upsert: true,
    new: true,
    setDefaultsOnInsert: true,
  });
};

/**
 * Mark all snapshots as stale (for data refresh)
 *
 * @param {string} [period] - Optional period filter
 * @returns {Promise<Object>} Update result
 */
analyticsDashboardSchema.statics.markAllAsStale = async function(period) {
  const query = period ? { period } : {};
  return this.updateMany(query, { isFresh: false });
};

/**
 * Get dashboard summary for quick overview
 *
 * @param {number} [days=30] - Number of days to summarize
 * @returns {Promise<Object>} Dashboard summary
 */
analyticsDashboardSchema.statics.getDashboardSummary = async function(days = 30) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const snapshots = await this.getForRange(startDate, endDate, 'daily');

  if (snapshots.length === 0) {
    return this.getEmptyAggregate();
  }

  const current = snapshots[snapshots.length - 1];
  const previous = snapshots[Math.max(0, snapshots.length - 8)]; // Compare to ~7 days ago

  const aggregate = this.aggregateSnapshots(snapshots);

  // Calculate growth from previous period
  if (previous) {
    aggregate.growth.leadsGrowth = current.calculateGrowth(previous, 'leads.total');
    aggregate.growth.conversionsGrowth = current.calculateGrowth(previous, 'leads.converted');
    aggregate.growth.revenueGrowth = current.calculateGrowth(previous, 'revenue.totalRevenue');
    aggregate.growth.emailEngagementGrowth = current.calculateGrowth(previous, 'email.openRate');
  }

  return aggregate;
};

/**
 * Clean up old snapshots based on retention policy
 *
 * @param {Object} policy - Retention policy
 * @param {number} policy.dailyKeep - Days to keep daily snapshots (default: 90)
 * @param {number} policy.hourlyKeep - Hours to keep hourly snapshots (default: 48)
 * @param {number} policy.weeklyKeep - Weeks to keep weekly snapshots (default: 52)
 * @param {number} policy.monthlyKeep - Months to keep monthly snapshots (default: 36)
 * @returns {Promise<Object>} Delete result
 */
analyticsDashboardSchema.statics.cleanupOldSnapshots = async function(policy = {}) {
  const now = new Date();
  const results = {};

  // Daily retention
  const dailyKeep = policy.dailyKeep || 90;
  const dailyCutoff = new Date(now);
  dailyCutoff.setDate(dailyCutoff.getDate() - dailyKeep);
  results.dailyDeleted = await this.deleteMany({
    period: 'daily',
    date: { $lt: dailyCutoff },
  });

  // Hourly retention
  const hourlyKeep = policy.hourlyKeep || 48;
  const hourlyCutoff = new Date(now);
  hourlyCutoff.setHours(hourlyCutoff.getHours() - hourlyKeep);
  results.hourlyDeleted = await this.deleteMany({
    period: 'hourly',
    date: { $lt: hourlyCutoff },
  });

  // Weekly retention
  const weeklyKeep = policy.weeklyKeep || 52;
  const weeklyCutoff = new Date(now);
  weeklyCutoff.setDate(weeklyCutoff.getDate() - (weeklyKeep * 7));
  results.weeklyDeleted = await this.deleteMany({
    period: 'weekly',
    date: { $lt: weeklyCutoff },
  });

  // Monthly retention (keep longer)
  const monthlyKeep = policy.monthlyKeep || 36;
  const monthlyCutoff = new Date(now);
  monthlyCutoff.setMonth(monthlyCutoff.getMonth() - monthlyKeep);
  results.monthlyDeleted = await this.deleteMany({
    period: 'monthly',
    date: { $lt: monthlyCutoff },
  });

  return results;
};

// ============================================================================
// PRE-SAVE MIDDLEWARE
// ============================================================================

analyticsDashboardSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// ============================================================================
// MODEL EXPORT
// ============================================================================

const AnalyticsDashboard = mongoose.model('AnalyticsDashboard', analyticsDashboardSchema);

export default AnalyticsDashboard;
