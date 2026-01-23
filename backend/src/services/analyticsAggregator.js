import Lead from '../models/Lead.js';
import Campaign from '../models/Campaign.js';
import Sequence from '../models/Sequence.js';
import SocialPost from '../models/SocialPost.js';
import SocialAccount from '../models/SocialAccount.js';
import ABTest from '../models/ABTest.js';
import AnalyticsDashboard from '../models/AnalyticsDashboard.js';
import User from '../models/User.js';

/**
 * Analytics Aggregator Service - Phase 7: Analytics Dashboard
 *
 * This service aggregates data from all models to compute dashboard metrics:
 * - Aggregates leads, campaigns, sequences, social posts, A/B tests data
 * - Calculates growth rates, trends, and conversion funnels
 * - Builds cohort analysis for user behavior
 * - Generates report-ready data with caching for performance
 *
 * @version 1.0.0
 * @since 2026-01-23
 */

// ============================================================================
// CACHE CONFIGURATION
// ============================================================================

/**
 * Simple in-memory cache for aggregated metrics
 * In production, use Redis for distributed caching
 */
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get from cache
 * @param {string} key - Cache key
 * @returns {Object|null} Cached value or null
 */
function getFromCache(key) {
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }
  cache.delete(key);
  return null;
}

/**
 * Set cache
 * @param {string} key - Cache key
 * @param {*} data - Data to cache
 */
function setCache(key, data) {
  cache.set(key, {
    data,
    expiresAt: Date.now() + CACHE_TTL,
  });
}

/**
 * Clear cache by pattern
 * @param {string} pattern - Pattern to match (e.g., 'daily:')
 */
function clearCachePattern(pattern) {
  for (const key of cache.keys()) {
    if (key.startsWith(pattern)) {
      cache.delete(key);
    }
  }
}

// ============================================================================
// LEAD ANALYTICS
// ============================================================================

/**
 * Aggregate lead metrics for a date range
 *
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Object>} Lead metrics
 */
export async function aggregateLeadMetrics(startDate, endDate) {
  const cacheKey = `leads:${startDate.toISOString()}:${endDate.toISOString()}`;
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  // Get lead counts by status
  const statusCounts = await Lead.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        isActive: true,
      },
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalValue: { $sum: { $ifNull: ['$estimatedValue', 0] } },
      },
    },
  ]);

  const leadMetrics = {
    total: 0,
    new: 0,
    contacted: 0,
    qualified: 0,
    proposal: 0,
    negotiation: 0,
    converted: 0,
    unqualified: 0,
    recycled: 0,
    bySource: {
      newsletter: 0, event: 0, survey: 0, offer: 0, meetup: 0,
      contact: 0, download: 0, chatbot: 0, referral: 0, other: 0,
    },
    totalPipelineValue: 0,
    weightedPipelineValue: 0,
  };

  // Process status counts
  statusCounts.forEach(({ _id, count, totalValue }) => {
    leadMetrics.total += count;
    if (leadMetrics.hasOwnProperty(_id)) {
      leadMetrics[_id] = count;
    }
    leadMetrics.totalPipelineValue += totalValue;
  });

  // Get pipeline snapshot (current state, not filtered by date)
  const pipelineSnapshot = await Lead.aggregate([
    {
      $match: { isActive: true },
    },
    {
      $group: {
        _id: '$pipelineStage',
        count: { $sum: 1 },
        totalValue: { $sum: { $ifNull: ['$estimatedValue', 0] } },
      },
    },
  ]);

  leadMetrics.pipelineSnapshot = {
    new: 0, contacted: 0, meeting_scheduled: 0, proposal_sent: 0,
    negotiation: 0, won: 0, lost: 0,
  };

  pipelineSnapshot.forEach(({ _id, count, totalValue }) => {
    if (leadMetrics.pipelineSnapshot.hasOwnProperty(_id)) {
      leadMetrics.pipelineSnapshot[_id] = count;
      leadMetrics.totalPipelineValue += totalValue;
    }
  });

  // Get leads by source
  const sourceCounts = await Lead.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        isActive: true,
      },
    },
    {
      $group: {
        _id: '$source',
        count: { $sum: 1 },
      },
    },
  ]);

  sourceCounts.forEach(({ _id, count }) => {
    if (leadMetrics.bySource.hasOwnProperty(_id)) {
      leadMetrics.bySource[_id] = count;
    } else {
      leadMetrics.bySource.other += count;
    }
  });

  // Get qualified leads count
  leadMetrics.qualified = await Lead.countDocuments({
    qualifiedAt: { $gte: startDate, $lte: endDate },
    isActive: true,
  });

  // Get converted leads count
  leadMetrics.converted = await Lead.countDocuments({
    convertedAt: { $gte: startDate, $lte: endDate },
    isActive: true,
  });

  // Calculate weighted pipeline value (estimated value * probability)
  const weightedPipelines = await Lead.aggregate([
    {
      $match: { isActive: true },
    },
    {
      $group: {
        _id: null,
        weightedValue: {
          $sum: { $multiply: [{ $ifNull: ['$estimatedValue', 0] }, { $divide: [{ $ifNull: ['$probability', 50] }, 100] }] },
        },
      },
    },
  ]);

  if (weightedPipelines.length > 0) {
    leadMetrics.weightedPipelineValue = weightedPipelines[0].weightedValue;
  }

  // Get average lead score
  const avgScore = await Lead.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        isActive: true,
      },
    },
    {
      $group: {
        _id: null,
        avgScore: { $avg: '$leadScore' },
      },
    },
  ]);

  leadMetrics.avgLeadScore = avgScore.length > 0 ? Math.round(avgScore[0].avgScore) : 0;

  // Count high value leads (score > 60)
  leadMetrics.highValueLeads = await Lead.countDocuments({
    createdAt: { $gte: startDate, $lte: endDate },
    leadScore: { $gte: 60 },
    isActive: true,
  });

  // Assignment metrics
  leadMetrics.assignedLeads = await Lead.countDocuments({
    assignedTo: { $exists: true, $ne: null },
    isActive: true,
  });

  leadMetrics.unassignedLeads = await Lead.countDocuments({
    $or: [
      { assignedTo: { $exists: false } },
      { assignedTo: null },
    ],
    isActive: true,
  });

  leadMetrics.activeEmployees = await User.countDocuments({
    role: { $in: ['admin', 'manager', 'employee'] },
    isActive: true,
  });

  // Calculate velocity metrics (time in pipeline stages)
  const stageDurations = await Lead.aggregate([
    {
      $match: {
        isActive: true,
        pipelineStageHistory: { $exists: true, $ne: [] },
      },
    },
    { $unwind: '$pipelineStageHistory' },
    {
      $group: {
        _id: '$pipelineStageHistory.stage',
        avgDuration: { $avg: '$pipelineStageHistory.duration' },
      },
    },
  ]);

  leadMetrics.avgStageDurations = {
    new: 0, contacted: 0, meeting_scheduled: 0, proposal_sent: 0, negotiation: 0,
  };

  stageDurations.forEach(({ _id, avgDuration }) => {
    if (leadMetrics.avgStageDurations.hasOwnProperty(_id)) {
      leadMetrics.avgStageDurations[_id] = Math.round(avgDuration);
    }
  });

  // Calculate average time to qualify and convert
  const qualifiedLeads = await Lead.find({
    qualifiedAt: { $exists: true },
    createdAt: { $exists: true },
    isActive: true,
  }).lean();

  if (qualifiedLeads.length > 0) {
    const timeToQualify = qualifiedLeads
      .map(l => (new Date(l.qualifiedAt) - new Date(l.createdAt)) / (1000 * 60 * 60)) // hours
      .filter(t => t > 0 && t < 24 * 365); // reasonable range

    leadMetrics.avgTimeToQualify = timeToQualify.length > 0
      ? Math.round(timeToQualify.reduce((a, b) => a + b, 0) / timeToQualify.length)
      : 0;
  }

  const convertedLeads = await Lead.find({
    convertedAt: { $exists: true },
    createdAt: { $exists: true },
    isActive: true,
  }).lean();

  if (convertedLeads.length > 0) {
    const timeToConvert = convertedLeads
      .map(l => (new Date(l.convertedAt) - new Date(l.createdAt)) / (1000 * 60 * 60)) // hours
      .filter(t => t > 0 && t < 24 * 365);

    leadMetrics.avgTimeToConvert = timeToConvert.length > 0
      ? Math.round(timeToConvert.reduce((a, b) => a + b, 0) / timeToConvert.length)
      : 0;
  }

  setCache(cacheKey, leadMetrics);
  return leadMetrics;
}

// ============================================================================
// EMAIL & CAMPAIGN ANALYTICS
// ============================================================================

/**
 * Aggregate email and campaign metrics
 *
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Object>} Email metrics
 */
export async function aggregateEmailMetrics(startDate, endDate) {
  const cacheKey = `email:${startDate.toISOString()}:${endDate.toISOString()}`;
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  // Get campaign counts
  const totalCampaigns = await Campaign.countDocuments({
    createdAt: { $gte: startDate, $lte: endDate },
  });

  const activeCampaigns = await Campaign.countDocuments({
    status: { $in: ['scheduled', 'sending'] },
    archivedAt: null,
  });

  const sentCampaigns = await Campaign.countDocuments({
    status: 'sent',
    createdAt: { $gte: startDate, $lte: endDate },
    archivedAt: null,
  });

  const scheduledCampaigns = await Campaign.countDocuments({
    status: 'scheduled',
    archivedAt: null,
  });

  // Aggregate email metrics from campaigns
  const campaignMetrics = await Campaign.aggregate([
    {
      $match: {
        $or: [
          { createdAt: { $gte: startDate, $lte: endDate } },
          { status: 'sent', 'metrics.completedAt': { $gte: startDate, $lte: endDate } },
        ],
        archivedAt: null,
      },
    },
    {
      $group: {
        _id: null,
        emailsSent: { $sum: '$metrics.sent' },
        emailsDelivered: { $sum: '$metrics.delivered' },
        emailsBounced: { $sum: { $add: ['$metrics.hardBounces', '$metrics.softBounces'] } },
        emailsFailed: { $sum: '$metrics.failed' },
        uniqueOpens: { $sum: '$metrics.uniqueOpens' },
        totalOpens: { $sum: '$metrics.totalOpens' },
        uniqueClicks: { $sum: '$metrics.uniqueClicks' },
        totalClicks: { $sum: '$metrics.totalClicks' },
        unsubscribes: { $sum: '$metrics.unsubscribes' },
        spamComplaints: { $sum: '$metrics.spamComplaints' },
        conversions: { $sum: '$metrics.conversions' },
        revenue: { $sum: '$metrics.revenue' },
        budgetSpent: { $sum: '$budget.totalSpent' },
      },
    },
  ]);

  const metrics = campaignMetrics[0] || {
    emailsSent: 0, emailsDelivered: 0, emailsBounced: 0, emailsFailed: 0,
    uniqueOpens: 0, totalOpens: 0, uniqueClicks: 0, totalClicks: 0,
    unsubscribes: 0, spamComplaints: 0, conversions: 0, revenue: 0, budgetSpent: 0,
  };

  const emailMetrics = {
    totalCampaigns,
    activeCampaigns,
    sentCampaigns,
    scheduledCampaigns,
    ...metrics,
    deliveryRate: metrics.emailsSent > 0
      ? Math.round((metrics.emailsDelivered / metrics.emailsSent) * 10000) / 100
      : 0,
    openRate: metrics.emailsDelivered > 0
      ? Math.round((metrics.uniqueOpens / metrics.emailsDelivered) * 10000) / 100
      : 0,
    clickRate: metrics.emailsDelivered > 0
      ? Math.round((metrics.uniqueClicks / metrics.emailsDelivered) * 10000) / 100
      : 0,
    clickToOpenRate: metrics.uniqueOpens > 0
      ? Math.round((metrics.uniqueClicks / metrics.uniqueOpens) * 10000) / 100
      : 0,
    unsubscribeRate: metrics.emailsDelivered > 0
      ? Math.round((metrics.unsubscribes / metrics.emailsDelivered) * 10000) / 100
      : 0,
    spamRate: metrics.emailsDelivered > 0
      ? Math.round((metrics.spamComplaints / metrics.emailsDelivered) * 10000) / 100
      : 0,
  };

  // Get top performing campaigns
  const topCampaigns = await Campaign.aggregate([
    {
      $match: {
        status: 'sent',
        'metrics.sent': { $gte: 100 },
        archivedAt: null,
      },
    },
    {
      $project: {
        name: 1,
        slug: 1,
        'metrics.sent': 1,
        'metrics.uniqueOpens': 1,
        'metrics.uniqueClicks': 1,
        'metrics.conversions': 1,
        openRate: {
          $cond: [
            { $gt: ['$metrics.delivered', 0] },
            { $multiply: [{ $divide: ['$metrics.uniqueOpens', '$metrics.delivered'] }, 100] },
            0,
          ],
        },
        clickRate: {
          $cond: [
            { $gt: ['$metrics.delivered', 0] },
            { $multiply: [{ $divide: ['$metrics.uniqueClicks', '$metrics.delivered'] }, 100] },
            0,
          ],
        },
      },
    },
    { $sort: { openRate: -1 } },
    { $limit: 5 },
  ]);

  emailMetrics.topCampaigns = topCampaigns.map(c => ({
    campaignId: c._id,
    name: c.name,
    sent: c.metrics.sent,
    openRate: Math.round(c.openRate * 100) / 100,
    clickRate: Math.round(c.clickRate * 100) / 100,
    conversions: c.metrics.conversions,
  }));

  // Calculate cost and ROI
  emailMetrics.costPerEmail = metrics.emailsSent > 0
    ? metrics.budgetSpent / metrics.emailsSent
    : 0;

  emailMetrics.revenueAttributed = metrics.revenue;

  emailMetrics.roi = metrics.budgetSpent > 0
    ? Math.round(((metrics.revenue - metrics.budgetSpent) / metrics.budgetSpent) * 10000) / 100
    : 0;

  setCache(cacheKey, emailMetrics);
  return emailMetrics;
}

// ============================================================================
// SEQUENCE ANALYTICS
// ============================================================================

/**
 * Aggregate sequence/drip campaign metrics
 *
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Object>} Sequence metrics
 */
export async function aggregateSequenceMetrics(startDate, endDate) {
  const cacheKey = `sequences:${startDate.toISOString()}:${endDate.toISOString()}`;
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  // Get sequence counts
  const totalSequences = await Sequence.countDocuments({
    createdAt: { $gte: startDate, $lte: endDate },
  });

  const activeSequences = await Sequence.countDocuments({
    status: 'active',
    archivedAt: null,
  });

  const pausedSequences = await Sequence.countDocuments({
    status: 'paused',
    archivedAt: null,
  });

  // Aggregate metrics from sequences
  const sequenceMetrics = await Sequence.aggregate([
    {
      $match: {
        $or: [
          { createdAt: { $gte: startDate, $lte: endDate } },
          { status: { $in: ['active', 'paused'] } },
        ],
        archivedAt: null,
      },
    },
    {
      $group: {
        _id: null,
        totalEnrolled: { $sum: '$metrics.enrolled' },
        currentlyActive: { $sum: '$metrics.active' },
        completed: { $sum: '$metrics.completed' },
        unsubscribed: { $sum: '$metrics.unsubscribed' },
        converted: { $sum: '$metrics.converted' },
        emailsSent: { $sum: '$metrics.emailsSent' },
        uniqueOpens: { $sum: '$metrics.uniqueOpens' },
        uniqueClicks: { $sum: '$metrics.uniqueClicks' },
        bounces: { $sum: '$metrics.bounces' },
        revenue: { $sum: '$metrics.revenue' },
      },
    },
  ]);

  const metrics = sequenceMetrics[0] || {
    totalEnrolled: 0, currentlyActive: 0, completed: 0,
    unsubscribed: 0, converted: 0, emailsSent: 0,
    uniqueOpens: 0, uniqueClicks: 0, bounces: 0, revenue: 0,
  };

  const sequenceAgg = {
    totalSequences,
    activeSequences,
    pausedSequences,
    totalEnrolled: metrics.totalEnrolled,
    currentlyActive: metrics.currentlyActive,
    completedToday: metrics.completed,
    unenrolled: metrics.unsubscribed,
    emailsSent: metrics.emailsSent,
    uniqueOpens: metrics.uniqueOpens,
    uniqueClicks: metrics.uniqueClicks,
    openRate: metrics.emailsSent > 0
      ? Math.round((metrics.uniqueOpens / metrics.emailsSent) * 10000) / 100
      : 0,
    clickRate: metrics.emailsSent > 0
      ? Math.round((metrics.uniqueClicks / metrics.emailsSent) * 10000) / 100
      : 0,
    completionRate: metrics.totalEnrolled > 0
      ? Math.round((metrics.completed / metrics.totalEnrolled) * 10000) / 100
      : 0,
    dropOffRate: metrics.totalEnrolled > 0
      ? Math.round((metrics.unsubscribed / metrics.totalEnrolled) * 10000) / 100
      : 0,
    revenueGenerated: metrics.revenue,
    conversions: metrics.converted,
  };

  // Get top performing sequences
  const topSequences = await Sequence.find({
    status: { $in: ['active', 'paused'] },
    'metrics.enrolled': { $gte: 10 },
    archivedAt: null,
  })
    .sort({ 'metrics.converted': -1 })
    .limit(5)
    .lean();

  sequenceAgg.topSequences = topSequences.map(s => ({
    sequenceId: s._id,
    name: s.name,
    type: s.type,
    enrolled: s.metrics.enrolled,
    completed: s.metrics.completed,
    completionRate: s.metrics.enrolled > 0
      ? Math.round((s.metrics.completed / s.metrics.enrolled) * 10000) / 100
      : 0,
    conversionRate: s.metrics.enrolled > 0
      ? Math.round((s.metrics.converted / s.metrics.enrolled) * 10000) / 100
      : 0,
  }));

  // Get step completion rates
  const stepData = await Sequence.aggregate([
    {
      $match: { archivedAt: null },
    },
    { $unwind: '$metrics.stepCompletionRates' },
    {
      $group: {
        _id: '$metrics.stepCompletionRates.stepOrder',
        totalCompleted: { $sum: '$metrics.stepCompletionRates.completed' },
        totalEnrolled: { $sum: '$metrics.enrolled' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  sequenceAgg.stepCompletion = stepData.map(step => ({
    stepOrder: step._id,
    completed: step.totalCompleted,
    total: step.totalEnrolled,
    rate: step.totalEnrolled > 0
      ? Math.round((step.totalCompleted / step.totalEnrolled) * 10000) / 100
      : 0,
  }));

  setCache(cacheKey, sequenceAgg);
  return sequenceAgg;
}

// ============================================================================
// SOCIAL MEDIA ANALYTICS
// ============================================================================

/**
 * Aggregate social media metrics
 *
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Object>} Social metrics
 */
export async function aggregateSocialMetrics(startDate, endDate) {
  const cacheKey = `social:${startDate.toISOString()}:${endDate.toISOString()}`;
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  // Get posts by platform and status
  const linkedinPosts = await SocialPost.aggregate([
    {
      $match: {
        platform: 'linkedin',
        createdAt: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  const twitterPosts = await SocialPost.aggregate([
    {
      $match: {
        platform: 'twitter',
        createdAt: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  const linkedinMetrics = {
    totalPosts: 0,
    published: 0,
    scheduled: 0,
    draft: 0,
  };

  linkedinPosts.forEach(({ _id, count }) => {
    linkedinMetrics.totalPosts += count;
    if (linkedinMetrics.hasOwnProperty(_id)) {
      linkedinMetrics[_id] = count;
    }
  });

  const twitterMetrics = {
    totalPosts: 0,
    published: 0,
    scheduled: 0,
    draft: 0,
  };

  twitterPosts.forEach(({ _id, count }) => {
    twitterMetrics.totalPosts += count;
    if (twitterMetrics.hasOwnProperty(_id)) {
      twitterMetrics[_id] = count;
    }
  });

  // Aggregate engagement metrics
  const engagementData = await SocialPost.aggregate([
    {
      $match: {
        status: 'published',
        publishedAt: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: '$platform',
        likes: { $sum: '$analytics.likes' },
        comments: { $sum: '$analytics.comments' },
        shares: { $sum: '$analytics.shares' },
        clicks: { $sum: '$analytics.clicks' },
        impressions: { $sum: '$analytics.impressions' },
        posts: { $sum: 1 },
      },
    },
  ]);

  const socialAgg = {
    linkedin: linkedinMetrics,
    twitter: twitterMetrics,
    totalLikes: 0,
    totalComments: 0,
    totalShares: 0,
    totalClicks: 0,
    totalImpressions: 0,
    avgEngagementRate: 0,
    linkedinFollowers: 0,
    twitterFollowers: 0,
    totalFollowers: 0,
    followerGrowthRate: 0,
  };

  engagementData.forEach(({ _id, likes, comments, shares, clicks, impressions, posts }) => {
    socialAgg.totalLikes += likes;
    socialAgg.totalComments += comments;
    socialAgg.totalShares += shares;
    socialAgg.totalClicks += clicks;
    socialAgg.totalImpressions += impressions;
  });

  // Calculate average engagement rate
  if (socialAgg.totalImpressions > 0) {
    const totalEngagements = socialAgg.totalLikes + socialAgg.totalComments + socialAgg.totalShares;
    socialAgg.avgEngagementRate = Math.round((totalEngagements / socialAgg.totalImpressions) * 10000) / 100;
  }

  // Get follower counts from social accounts
  const accounts = await SocialAccount.find({
    status: 'active',
  }).lean();

  accounts.forEach(account => {
    if (account.platform === 'linkedin' && account.stats?.followers) {
      socialAgg.linkedinFollowers += account.stats.followers;
    } else if (account.platform === 'twitter' && account.stats?.followers) {
      socialAgg.twitterFollowers += account.stats.followers;
    }
  });

  socialAgg.totalFollowers = socialAgg.linkedinFollowers + socialAgg.twitterFollowers;

  // Get top performing posts
  const topPosts = await SocialPost.find({
    status: 'published',
    'analytics.publishedAt': { $gte: startDate, $lte: endDate },
  })
    .sort({ 'analytics.likes': -1, 'analytics.comments': -1 })
    .limit(5)
    .lean();

  socialAgg.topPosts = topPosts.map(p => {
    const totalEngagement = (p.analytics?.likes || 0) + (p.analytics?.comments || 0) + (p.analytics?.shares || 0);
    return {
      postId: p._id,
      platform: p.platform,
      content: p.content.substring(0, 100) + (p.content.length > 100 ? '...' : ''),
      likes: p.analytics?.likes || 0,
      comments: p.analytics?.comments || 0,
      shares: p.analytics?.shares || 0,
      engagementRate: p.analytics?.impressions > 0
        ? Math.round((totalEngagement / p.analytics.impressions) * 10000) / 100
        : 0,
    };
  });

  // Build platform comparison
  socialAgg.platformComparison = engagementData.map(data => ({
    platform: data._id,
    posts: data.posts,
    likes: data.likes,
    comments: data.comments,
    shares: data.shares,
    engagementRate: data.impressions > 0
      ? Math.round(((data.likes + data.comments + data.shares) / data.impressions) * 10000) / 100
      : 0,
  }));

  setCache(cacheKey, socialAgg);
  return socialAgg;
}

// ============================================================================
// A/B TEST ANALYTICS
// ============================================================================

/**
 * Aggregate A/B testing metrics
 *
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Object>} A/B test metrics
 */
export async function aggregateABTestMetrics(startDate, endDate) {
  const cacheKey = `abtests:${startDate.toISOString()}:${endDate.toISOString()}`;
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  // Get test counts
  const totalTests = await ABTest.countDocuments({
    createdAt: { $gte: startDate, $lte: endDate },
  });

  const activeTests = await ABTest.countDocuments({
    status: 'running',
    archivedAt: null,
  });

  const completedTests = await ABTest.countDocuments({
    status: 'completed',
    completedAt: { $gte: startDate, $lte: endDate },
  });

  // Get tests by type
  const testsByType = await ABTest.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: '$testType',
        count: { $sum: 1 },
      },
    },
  ]);

  const byType = {
    subject_line: 0, content: 0, sender: 0, send_time: 0,
    template: 0, landing_page: 0, multivariate: 0,
  };

  testsByType.forEach(({ _id, count }) => {
    if (byType.hasOwnProperty(_id)) {
      byType[_id] = count;
    }
  });

  // Get completed tests with results
  const completedTestsData = await ABTest.find({
    status: 'completed',
    'significance.isSignificant': true,
  })
    .sort({ completedAt: -1 })
    .limit(10)
    .lean();

  const testsSignificant = await ABTest.countDocuments({
    status: 'completed',
    'significance.isSignificant': true,
  });

  let avgImprovement = 0;
  if (completedTestsData.length > 0) {
    const improvements = completedTestsData
      .map(t => t.results?.improvementPercentage)
      .filter(i => i !== undefined && i !== null);
    if (improvements.length > 0) {
      avgImprovement = improvements.reduce((a, b) => a + b, 0) / improvements.length;
    }
  }

  const abTestAgg = {
    totalTests,
    activeTests,
    completedTests,
    byType,
    testsSignificant,
    avgConfidenceLevel: 95, // Default, can be calculated from actual tests
    avgImprovement: Math.round(avgImprovement * 100) / 100,
    activeTestsList: [],
    recentWinners: [],
  };

  // Get active tests overview
  const activeTestsList = await ABTest.find({
    status: 'running',
  })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  abTestAgg.activeTestsList = activeTestsList.map(t => ({
    testId: t._id,
    name: t.name,
    testType: t.testType,
    variants: t.variants?.length || 0,
    startedAt: t.duration?.actualStartAt,
    status: t.status,
  }));

  // Get recent winners
  abTestAgg.recentWinners = completedTestsData.slice(0, 5).map(t => ({
    testId: t._id,
    testName: t.name,
    winningVariant: t.winningVariantId,
    improvement: t.results?.improvementPercentage || 0,
    confidenceLevel: t.significance?.confidenceLevel || 0,
  }));

  setCache(cacheKey, abTestAgg);
  return abTestAgg;
}

// ============================================================================
// REVENUE & ROI ANALYTICS
// ============================================================================

/**
 * Aggregate revenue and ROI metrics
 *
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Object>} Revenue metrics
 */
export async function aggregateRevenueMetrics(startDate, endDate) {
  const cacheKey = `revenue:${startDate.toISOString()}:${endDate.toISOString()}`;
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  // Get revenue from campaigns
  const campaignRevenue = await Campaign.aggregate([
    {
      $match: {
        $or: [
          { createdAt: { $gte: startDate, $lte: endDate } },
          { 'metrics.completedAt': { $gte: startDate, $lte: endDate } },
        ],
        archivedAt: null,
      },
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$metrics.revenue' },
        totalBudget: { $sum: '$budget.totalSpent' },
      },
    },
  ]);

  // Get revenue from sequences
  const sequenceRevenue = await Sequence.aggregate([
    {
      $match: {
        $or: [
          { createdAt: { $gte: startDate, $lte: endDate } },
          { status: { $in: ['active', 'paused'] } },
        ],
        archivedAt: null,
      },
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$metrics.revenue' },
      },
    },
  ]);

  // Get revenue from leads (converted)
  const convertedLeadsValue = await Lead.aggregate([
    {
      $match: {
        convertedAt: { $gte: startDate, $lte: endDate },
        isActive: true,
      },
    },
    {
      $group: {
        _id: null,
        totalValue: { $sum: { $ifNull: ['$estimatedValue', 0] } },
        count: { $sum: 1 },
      },
    },
  ]);

  const totalRevenue = (campaignRevenue[0]?.totalRevenue || 0) +
    (sequenceRevenue[0]?.totalRevenue || 0) +
    (convertedLeadsValue[0]?.totalValue || 0);

  const totalBudget = campaignRevenue[0]?.totalBudget || 0;

  const revenueAgg = {
    totalRevenue: Math.round(totalRevenue),
    recurringRevenue: 0, // Would need subscription tracking
    oneTimeRevenue: Math.round(totalRevenue),
    totalCost: Math.round(totalBudget),
    emailCost: Math.round(totalBudget * 0.7), // Estimate
    advertisingCost: 0,
    laborCost: Math.round(totalBudget * 0.3),
    otherCost: 0,
    roi: totalBudget > 0
      ? Math.round(((totalRevenue - totalBudget) / totalBudget) * 10000) / 100
      : 0,
    marketingROI: totalBudget > 0
      ? Math.round((totalRevenue / totalBudget) * 10000) / 100
      : 0,
    costPerLead: 0,
    costPerAcquisition: 0,
    costPerConversion: 0,
    revenueBySource: [],
    revenueByCampaign: [],
  };

  // Calculate cost metrics
  const leadCount = await Lead.countDocuments({
    createdAt: { $gte: startDate, $lte: endDate },
  });

  const conversionCount = await Lead.countDocuments({
    convertedAt: { $gte: startDate, $lte: endDate },
  });

  revenueAgg.costPerLead = leadCount > 0 ? totalBudget / leadCount : 0;
  revenueAgg.costPerAcquisition = leadCount > 0 ? totalBudget / leadCount : 0;
  revenueAgg.costPerConversion = conversionCount > 0 ? totalBudget / conversionCount : 0;

  // Get revenue by source (from leads)
  const revenueBySource = await Lead.aggregate([
    {
      $match: {
        convertedAt: { $gte: startDate, $lte: endDate },
        isActive: true,
      },
    },
    {
      $group: {
        _id: '$source',
        totalValue: { $sum: { $ifNull: ['$estimatedValue', 0] } },
      },
    },
    { $sort: { totalValue: -1 } },
  ]);

  revenueAgg.revenueBySource = revenueBySource.map(r => ({
    source: r._id,
    revenue: Math.round(r.totalValue),
    percentage: totalRevenue > 0 ? Math.round((r.totalValue / totalRevenue) * 10000) / 100 : 0,
  }));

  // Get revenue by campaign
  const revenueByCampaign = await Campaign.aggregate([
    {
      $match: {
        'metrics.conversions': { $gt: 0 },
        archivedAt: null,
      },
    },
    {
      $project: {
        name: 1,
        'metrics.revenue': 1,
        'metrics.conversions': 1,
        'budget.totalSpent': 1,
      },
    },
    {
      $addFields: {
        roi: {
          $cond: [
            { $gt: ['$budget.totalSpent', 0] },
            { $multiply: [{ $divide: [{ $subtract: ['$metrics.revenue', '$budget.totalSpent'] }, '$budget.totalSpent'] }, 100] },
            0,
          ],
        },
      },
    },
    { $sort: { 'metrics.revenue': -1 } },
    { $limit: 10 },
  ]);

  revenueAgg.revenueByCampaign = revenueByCampaign.map(c => ({
    campaignId: c._id,
    name: c.name,
    revenue: c.metrics.revenue,
    cost: c.budget.totalSpent,
    roi: Math.round(c.roi * 100) / 100,
  }));

  setCache(cacheKey, revenueAgg);
  return revenueAgg;
}

// ============================================================================
// CONVERSION FUNNEL ANALYTICS
// ============================================================================

/**
 * Build conversion funnel analytics
 *
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Object>} Funnel metrics
 */
export async function buildFunnelAnalytics(startDate, endDate) {
  const cacheKey = `funnel:${startDate.toISOString()}:${endDate.toISOString()}`;
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  // Get visitor data from interactions (if available)
  // For now, using lead data as proxy for funnel stages

  const totalLeads = await Lead.countDocuments({
    createdAt: { $gte: startDate, $lte: endDate },
  });

  const marketingQualified = await Lead.countDocuments({
    qualifiedAt: { $gte: startDate, $lte: endDate },
    isActive: true,
  });

  const salesQualified = await Lead.countDocuments({
    pipelineStage: { $in: ['meeting_scheduled', 'proposal_sent', 'negotiation'] },
    isActive: true,
  });

  const opportunities = await Lead.countDocuments({
    pipelineStage: { $in: ['proposal_sent', 'negotiation'] },
    isActive: true,
  });

  const conversions = await Lead.countDocuments({
    convertedAt: { $gte: startDate, $lte: endDate },
    isActive: true,
  });

  // Build funnel
  const funnel = {
    visitors: 0, // Would come from web analytics
    visitorsEngaged: 0, // Leads with meaningful interaction
    leads: totalLeads,
    marketingQualifiedLeads: marketingQualified,
    salesQualifiedLeads: salesQualified,
    opportunities: opportunities,
    conversions: conversions,
  };

  // Calculate conversion rates
  const visitors = funnel.visitors || funnel.leads || 1;
  funnel.visitorToLeadRate = visitors > 0
    ? Math.round((funnel.leads / visitors) * 10000) / 100
    : 0;

  funnel.leadToMqlRate = funnel.leads > 0
    ? Math.round((funnel.marketingQualifiedLeads / funnel.leads) * 10000) / 100
    : 0;

  funnel.mqlToSqlRate = funnel.marketingQualifiedLeads > 0
    ? Math.round((funnel.salesQualifiedLeads / funnel.marketingQualifiedLeads) * 10000) / 100
    : 0;

  funnel.sqlToOpportunityRate = funnel.salesQualifiedLeads > 0
    ? Math.round((funnel.opportunities / funnel.salesQualifiedLeads) * 10000) / 100
    : 0;

  funnel.opportunityToCloseRate = funnel.opportunities > 0
    ? Math.round((funnel.conversions / funnel.opportunities) * 10000) / 100
    : 0;

  funnel.overallConversionRate = funnel.leads > 0
    ? Math.round((funnel.conversions / funnel.leads) * 10000) / 100
    : 0;

  // Calculate funnel velocity
  const convertedLeads = await Lead.find({
    convertedAt: { $exists: true },
    createdAt: { $exists: true },
  }).lean();

  if (convertedLeads.length > 0) {
    const cycleTimes = convertedLeads
      .map(l => (new Date(l.convertedAt) - new Date(l.createdAt)) / (1000 * 60 * 60 * 24)) // days
      .filter(t => t > 0 && t < 365);

    funnel.avgCycleTime = cycleTimes.length > 0
      ? Math.round(cycleTimes.reduce((a, b) => a + b, 0) / cycleTimes.length)
      : 0;
  } else {
    funnel.avgCycleTime = 0;
  }

  // Drop-off analysis
  funnel.dropOffPoints = [
    {
      fromStage: 'leads',
      toStage: 'mql',
      dropped: funnel.leads - funnel.marketingQualifiedLeads,
      rate: funnel.leads > 0
        ? Math.round(((funnel.leads - funnel.marketingQualifiedLeads) / funnel.leads) * 10000) / 100
        : 0,
    },
    {
      fromStage: 'mql',
      toStage: 'sql',
      dropped: funnel.marketingQualifiedLeads - funnel.salesQualifiedLeads,
      rate: funnel.marketingQualifiedLeads > 0
        ? Math.round(((funnel.marketingQualifiedLeads - funnel.salesQualifiedLeads) / funnel.marketingQualifiedLeads) * 10000) / 100
        : 0,
    },
    {
      fromStage: 'sql',
      toStage: 'opportunity',
      dropped: funnel.salesQualifiedLeads - funnel.opportunities,
      rate: funnel.salesQualifiedLeads > 0
        ? Math.round(((funnel.salesQualifiedLeads - funnel.opportunities) / funnel.salesQualifiedLeads) * 10000) / 100
        : 0,
    },
    {
      fromStage: 'opportunity',
      toStage: 'customer',
      dropped: funnel.opportunities - funnel.conversions,
      rate: funnel.opportunities > 0
        ? Math.round(((funnel.opportunities - funnel.conversions) / funnel.opportunities) * 10000) / 100
        : 0,
    },
  ];

  setCache(cacheKey, funnel);
  return funnel;
}

// ============================================================================
// GROWTH RATE CALCULATION
// ============================================================================

/**
 * Calculate growth rates compared to previous period
 *
 * @param {Date} startDate - Current period start
 * @param {Date} endDate - Current period end
 * @param {string} period - Period type ('daily', 'weekly', 'monthly')
 * @returns {Promise<Object>} Growth metrics
 */
export async function calculateGrowthRates(startDate, endDate, period = 'daily') {
  const cacheKey = `growth:${startDate.toISOString()}:${endDate.toISOString()}`;
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  // Determine previous period range
  const dayDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
  const prevEndDate = new Date(startDate);
  prevEndDate.setDate(prevEndDate.getDate() - 1);
  const prevStartDate = new Date(prevEndDate);
  prevStartDate.setDate(prevStartDate.getDate() - dayDiff);

  // Get current period metrics
  const [currentLeads, currentEmail, currentRevenue] = await Promise.all([
    aggregateLeadMetrics(startDate, endDate),
    aggregateEmailMetrics(startDate, endDate),
    aggregateRevenueMetrics(startDate, endDate),
  ]);

  // Get previous period metrics
  const [prevLeads, prevEmail, prevRevenue] = await Promise.all([
    aggregateLeadMetrics(prevStartDate, prevEndDate),
    aggregateEmailMetrics(prevStartDate, prevEndDate),
    aggregateRevenueMetrics(prevStartDate, prevEndDate),
  ]);

  // Calculate growth percentages
  const calculateGrowth = (current, previous, metric) => {
    const curr = current[metric] || 0;
    const prev = previous[metric] || 0;
    if (prev === 0) return curr > 0 ? 100 : 0;
    return Math.round(((curr - prev) / prev) * 10000) / 100;
  };

  const getTrend = (growth) => {
    if (growth > 5) return 'up';
    if (growth < -5) return 'down';
    return 'stable';
  };

  const growth = {
    leadsGrowth: calculateGrowth(currentLeads, prevLeads, 'total'),
    conversionsGrowth: calculateGrowth(currentLeads, prevLeads, 'converted'),
    revenueGrowth: calculateGrowth(currentRevenue, prevRevenue, 'totalRevenue'),
    emailEngagementGrowth: calculateGrowth(currentEmail, prevEmail, 'openRate'),
    socialGrowth: 0, // Would calculate from social metrics
    leadsTrend: getTrend(calculateGrowth(currentLeads, prevLeads, 'total')),
    conversionsTrend: getTrend(calculateGrowth(currentLeads, prevLeads, 'converted')),
    revenueTrend: getTrend(calculateGrowth(currentRevenue, prevRevenue, 'totalRevenue')),
    previousPeriod: {
      leads: prevLeads.total,
      conversions: prevLeads.converted,
      revenue: prevRevenue.totalRevenue,
      avgOpenRate: prevEmail.openRate,
      avgClickRate: prevEmail.clickRate,
    },
  };

  setCache(cacheKey, growth);
  return growth;
}

// ============================================================================
// DASHBOARD SNAPSHOT GENERATION
// ============================================================================

/**
 * Generate complete dashboard snapshot for a specific date
 *
 * @param {Date} date - Date to generate snapshot for
 * @param {string} period - Time granularity
 * @returns {Promise<Object>} Complete snapshot data
 */
export async function generateDashboardSnapshot(date, period = 'daily') {
  // Determine date range based on period
  let startDate, endDate;

  switch (period) {
    case 'hourly':
      startDate = new Date(date);
      startDate.setMinutes(0, 0, 0);
      endDate = new Date(startDate);
      endDate.setHours(startDate.getHours() + 1);
      endDate.setMilliseconds(endDateMilliseconds - 1);
      break;
    case 'daily':
      startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'weekly':
      startDate = new Date(date);
      startDate.setDate(startDate.getDate() - startDate.getDay()); // Start of week
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 7);
      endDate.setMilliseconds(endDateMilliseconds - 1);
      break;
    case 'monthly':
      startDate = new Date(date);
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setMonth(startDate.getMonth() + 1);
      endDate.setMilliseconds(endDateMilliseconds - 1);
      break;
  }

  // Aggregate all metrics in parallel
  const [
    leads,
    email,
    sequences,
    social,
    abTests,
    revenue,
    growth,
    funnel,
  ] = await Promise.all([
    aggregateLeadMetrics(startDate, endDate),
    aggregateEmailMetrics(startDate, endDate),
    aggregateSequenceMetrics(startDate, endDate),
    aggregateSocialMetrics(startDate, endDate),
    aggregateABTestMetrics(startDate, endDate),
    aggregateRevenueMetrics(startDate, endDate),
    calculateGrowthRates(startDate, endDate, period),
    buildFunnelAnalytics(startDate, endDate),
  ]);

  return {
    period,
    date: startDate,
    dateRange: { start: startDate, end: endDate },
    leads,
    email,
    sequences,
    social,
    abTests,
    revenue,
    growth,
    funnel,
    computedAt: new Date(),
  };
}

/**
 * Save dashboard snapshot to database
 *
 * @param {Date} date - Date of snapshot
 * @param {string} period - Time period
 * @returns {Promise<AnalyticsDashboard>} Saved snapshot
 */
export async function saveDashboardSnapshot(date = new Date(), period = 'daily') {
  const metrics = await generateDashboardSnapshot(date, period);
  return AnalyticsDashboard.upsertSnapshot(metrics, period, date);
}

/**
 * Batch generate snapshots for a date range
 *
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {string} period - Time period
 * @returns {Promise<Array>} Generated snapshots
 */
export async function batchGenerateSnapshots(startDate, endDate, period = 'daily') {
  const snapshots = [];
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const snapshot = await saveDashboardSnapshot(currentDate, period);
    snapshots.push(snapshot);

    // Move to next period
    switch (period) {
      case 'hourly':
        currentDate.setHours(currentDate.getHours() + 1);
        break;
      case 'daily':
        currentDate.setDate(currentDate.getDate() + 1);
        break;
      case 'weekly':
        currentDate.setDate(currentDate.getDate() + 7);
        break;
      case 'monthly':
        currentDate.setMonth(currentDate.getMonth() + 1);
        break;
    }
  }

  return snapshots;
}

// ============================================================================
// COHORT ANALYSIS
// ============================================================================

/**
 * Perform cohort analysis on leads
 *
 * @param {string} cohortType - Type of cohort ('week', 'month', 'source')
 * @param {number} periods - Number of periods to analyze
 * @returns {Promise<Array>} Cohort data
 */
export async function generateCohortAnalysis(cohortType = 'week', periods = 12) {
  const cacheKey = `cohort:${cohortType}:${periods}`;
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  // Get leads grouped by cohort
  const cohortData = await Lead.aggregate([
    {
      $match: {
        createdAt: { $exists: true },
        isActive: true,
      },
    },
    {
      $group: {
        _id: {
          // Group by cohort type
          week: { $week: '$createdAt' },
          month: { $month: '$createdAt' },
          year: { $year: '$createdAt' },
          source: '$source',
        },
        leads: { $sum: 1 },
        converted: {
          $sum: {
            $cond: [{ $ifNull: ['$convertedAt', false] }, 1, 0],
          },
        },
        qualified: {
          $sum: {
            $cond: [{ $ifNull: ['$qualifiedAt', false) }, 1, 0],
          },
        },
      },
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1, '_id.week': 1 },
    },
  ]);

  // Format cohort data
  const cohorts = cohortData.map(c => ({
    cohort: cohortType === 'source' ? c._id.source : `W${c._id.week}-${c._id.year}`,
    leads: c.leads,
    converted: c.converted,
    qualified: c.qualified,
    conversionRate: c.leads > 0 ? Math.round((c.converted / c.leads) * 10000) / 100 : 0,
    qualificationRate: c.leads > 0 ? Math.round((c.qualified / c.leads) * 10000) / 100 : 0,
  }));

  setCache(cacheKey, cohorts);
  return cohorts;
}

// ============================================================================
// EXPORT FUNCTIONS
// ============================================================================

export {
  getFromCache,
  setCache,
  clearCachePattern,
};
