import AnalyticsDashboard from '../models/AnalyticsDashboard.js';
import {
  aggregateLeadMetrics,
  aggregateEmailMetrics,
  aggregateSequenceMetrics,
  aggregateSocialMetrics,
  aggregateABTestMetrics,
  aggregateRevenueMetrics,
  buildFunnelAnalytics,
  calculateGrowthRates,
  generateDashboardSnapshot,
  saveDashboardSnapshot,
  batchGenerateSnapshots,
  generateCohortAnalysis,
} from '../services/analyticsAggregator.js';
import Lead from '../models/Lead.js';
import Campaign from '../models/Campaign.js';
import Sequence from '../models/Sequence.js';
import SocialPost from '../models/SocialPost.js';
import ABTest from '../models/ABTest.js';

/**
 * Analytics Dashboard Controller - Phase 7: Analytics Dashboard
 *
 * Handles all analytics dashboard endpoints:
 * - Dashboard overview with KPIs
 * - Lead, email, campaign, sequence, social analytics
 * - Revenue and ROI calculations
 * - Date range filtering with comparison
 * - Export functionality (CSV, JSON)
 *
 * @version 1.0.0
 * @since 2026-01-23
 */

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Parse date range from query parameters
 * @param {Object} query - Express query object
 * @returns {Object} Date range { startDate, endDate }
 */
function parseDateRange(query) {
  const {
    startDate,
    endDate,
    days = 30,
    period,
  } = query;

  let rangeStartDate, rangeEndDate;

  if (startDate && endDate) {
    rangeStartDate = new Date(startDate);
    rangeEndDate = new Date(endDate);
    rangeEndDate.setHours(23, 59, 59, 999);
  } else if (period) {
    const now = new Date();
    rangeEndDate = new Date();

    switch (period) {
      case 'today':
        rangeStartDate = new Date(now);
        rangeStartDate.setHours(0, 0, 0, 0);
        break;
      case 'yesterday':
        rangeStartDate = new Date(now);
        rangeStartDate.setDate(now.getDate() - 1);
        rangeStartDate.setHours(0, 0, 0, 0);
        rangeEndDate = new Date(rangeStartDate);
        rangeEndDate.setHours(23, 59, 59, 999);
        break;
      case 'week':
        rangeStartDate = new Date(now);
        rangeStartDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        rangeStartDate = new Date(now);
        rangeStartDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        rangeStartDate = new Date(now);
        rangeStartDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        rangeStartDate = new Date(now);
        rangeStartDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        rangeStartDate = new Date(now);
        rangeStartDate.setDate(now.getDate() - parseInt(days));
    }
  } else {
    rangeEndDate = new Date();
    rangeStartDate = new Date();
    rangeStartDate.setDate(rangeStartDate.getDate() - parseInt(days));
  }

  return { startDate: rangeStartDate, endDate: rangeEndDate };
}

/**
 * Parse period parameter
 * @param {string} period - Period string
 * @returns {string} Normalized period
 */
function parsePeriod(period = 'daily') {
  const validPeriods = ['hourly', 'daily', 'weekly', 'monthly'];
  return validPeriods.includes(period) ? period : 'daily';
}

/**
 * Format date for export
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string
 */
function formatDateForExport(date) {
  return date.toISOString().split('T')[0];
}

/**
 * Convert data to CSV format
 * @param {Array} data - Array of objects
 * @param {Array} columns - Column definitions
 * @returns {string} CSV string
 */
function convertToCSV(data, columns) {
  if (!data || data.length === 0) {
    return '';
  }

  const headers = columns.map(c => c.header).join(',');
  const rows = data.map(row => {
    return columns.map(col => {
      const value = row[col.field] ?? '';
      // Escape quotes and wrap in quotes if contains comma
      const strValue = String(value);
      if (strValue.includes(',') || strValue.includes('"') || strValue.includes('\n')) {
        return `"${strValue.replace(/"/g, '""')}"`;
      }
      return strValue;
    }).join(',');
  });

  return [headers, ...rows].join('\n');
}

// ============================================================================
// DASHBOARD OVERVIEW
// ============================================================================

/**
 * Get dashboard overview with key metrics
 * @route GET /api/analytics-dashboard/overview
 * @access Private (Admin/Manager)
 */
export const getDashboardOverview = async (req, res) => {
  try {
    const { days = 30, compare = 'previous' } = req.query;

    const { startDate, endDate } = parseDateRange({ days });

    // Get summary from analytics dashboard
    const summary = await AnalyticsDashboard.getDashboardSummary(parseInt(days));

    // Add comparison data if requested
    if (compare === 'previous') {
      const prevDays = parseInt(days) * 2;
      const prevStartDate = new Date(endDate);
      prevStartDate.setDate(prevStartDate.getDate() - prevDays);

      const prevSummary = await AnalyticsDashboard.getAggregateForRange(
        prevStartDate,
        startDate,
        'daily'
      );

      summary.comparison = {
        leads: calculateGrowthPercentage(summary.leads?.total || 0, prevSummary.leads?.total || 0),
        conversions: calculateGrowthPercentage(summary.leads?.converted || 0, prevSummary.leads?.converted || 0),
        revenue: calculateGrowthPercentage(summary.revenue?.totalRevenue || 0, prevSummary.revenue?.totalRevenue || 0),
        openRate: calculateGrowthPercentage(summary.email?.openRate || 0, prevSummary.email?.openRate || 0),
        clickRate: calculateGrowthPercentage(summary.email?.clickRate || 0, prevSummary.email?.clickRate || 0),
      };
    }

    res.status(200).json({
      success: true,
      data: summary,
      dateRange: { startDate, endDate },
    });
  } catch (error) {
    console.error('Error fetching dashboard overview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard overview',
      error: error.message,
    });
  }
};

/**
 * Calculate growth percentage
 * @param {number} current - Current value
 * @param {number} previous - Previous value
 * @returns {number} Growth percentage
 */
function calculateGrowthPercentage(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 10000) / 100;
}

// ============================================================================
// LEAD ANALYTICS
// ============================================================================

/**
 * Get lead analytics with sources and pipeline metrics
 * @route GET /api/analytics-dashboard/leads
 * @access Private (Admin/Manager)
 */
export const getLeadAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = parseDateRange(req.query);

    const metrics = await aggregateLeadMetrics(startDate, endDate);

    // Get pipeline velocity chart data
    const pipelineVelocity = await Lead.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          pipelineStageHistory: { $exists: true },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' },
          },
          totalLeads: { $sum: 1 },
          qualifiedLeads: {
            $sum: {
              $cond: [{ $ifNull: ['$qualifiedAt', false] }, 1, 0],
            },
          },
          avgLeadScore: { $avg: '$leadScore' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
    ]);

    // Get lead source breakdown chart data
    const sourceTrend = await Lead.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            source: '$source',
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            week: { $week: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: '$_id.source',
          weeks: {
            $push: {
              week: '$_id.week',
              count: '$count',
            },
          },
          total: { $sum: '$count' },
        },
      },
      { $sort: { total: -1 } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        ...metrics,
        pipelineVelocity,
        sourceTrend,
      },
      dateRange: { startDate, endDate },
    });
  } catch (error) {
    console.error('Error fetching lead analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch lead analytics',
      error: error.message,
    });
  }
};

/**
 * Get lead pipeline snapshot
 * @route GET /api/analytics-dashboard/leads/pipeline
 * @access Private (Admin/Manager)
 */
export const getPipelineSnapshot = async (req, res) => {
  try {
    const pipelineSnapshot = await Lead.getPipelineSnapshot();

    // Get employee workloads
    const User = require('../models/User.js').default;
    const employees = await User.find({
      role: { $in: ['admin', 'manager', 'employee'] },
      isActive: true,
    })
      .select('name email assignedLeads maxLeadCapacity')
      .lean();

    const employeeWorkloads = employees.map(emp => ({
      employeeId: emp._id,
      name: emp.name,
      email: emp.email,
      assignedLeads: emp.assignedLeads?.length || 0,
      maxLeadCapacity: emp.maxLeadCapacity || 50,
      utilizationRate: emp.maxLeadCapacity > 0
        ? Math.round(((emp.assignedLeads?.length || 0) / emp.maxLeadCapacity) * 100)
        : 0,
    }));

    res.status(200).json({
      success: true,
      data: {
        pipelineSnapshot,
        employeeWorkloads,
      },
    });
  } catch (error) {
    console.error('Error fetching pipeline snapshot:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pipeline snapshot',
      error: error.message,
    });
  }
};

// ============================================================================
// EMAIL & CAMPAIGN ANALYTICS
// ============================================================================

/**
 * Get email and campaign analytics
 * @route GET /api/analytics-dashboard/email
 * @access Private (Admin/Manager)
 */
export const getEmailAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = parseDateRange(req.query);

    const metrics = await aggregateEmailMetrics(startDate, endDate);

    // Get email performance trend over time
    const emailTrend = await Campaign.aggregate([
      {
        $match: {
          status: 'sent',
          $or: [
            { createdAt: { $gte: startDate, $lte: endDate } },
            { 'metrics.completedAt': { $gte: startDate, $lte: endDate } },
          ],
          archivedAt: null,
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' },
          },
          sent: { $sum: '$metrics.sent' },
          delivered: { $sum: '$metrics.delivered' },
          opened: { $sum: '$metrics.uniqueOpens' },
          clicked: { $sum: '$metrics.uniqueClicks' },
          bounces: { $sum: { $add: ['$metrics.hardBounces', '$metrics.softBounces'] } },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
    ]);

    // Calculate daily rates
    const emailTrendWithRates = emailTrend.map(t => ({
      ...t,
      date: `${t._id.year}-${String(t._id.month).padStart(2, '0')}-${String(t._id.day).padStart(2, '0')}`,
      deliveryRate: t.sent > 0 ? Math.round((t.delivered / t.sent) * 10000) / 100 : 0,
      openRate: t.delivered > 0 ? Math.round((t.opened / t.delivered) * 10000) / 100 : 0,
      clickRate: t.delivered > 0 ? Math.round((t.clicked / t.delivered) * 10000) / 100 : 0,
      bounceRate: t.sent > 0 ? Math.round((t.bounces / t.sent) * 10000) / 100 : 0,
    }));

    res.status(200).json({
      success: true,
      data: {
        ...metrics,
        emailTrend: emailTrendWithRates,
      },
      dateRange: { startDate, endDate },
    });
  } catch (error) {
    console.error('Error fetching email analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch email analytics',
      error: error.message,
    });
  }
};

/**
 * Get campaign performance details
 * @route GET /api/analytics-dashboard/campaigns
 * @access Private (Admin/Manager)
 */
export const getCampaignAnalytics = async (req, res) => {
  try {
    const { limit = 20, sort = '-createdAt' } = req.query;

    const campaigns = await Campaign.find({
      status: { $in: ['sent', 'sending'] },
      archivedAt: null,
    })
      .sort(sort)
      .limit(parseInt(limit))
      .populate('template', 'name')
      .lean();

    const campaignData = campaigns.map(c => ({
      id: c._id,
      name: c.name,
      slug: c.slug,
      type: c.type,
      category: c.category,
      status: c.status,
      template: c.template?.name,
      sentAt: c.schedule?.sendAt,
      metrics: c.metrics,
      virtuals: {
        openRate: c.openRate,
        clickRate: c.clickRate,
        clickToOpenRate: c.clickToOpenRate,
        bounceRate: c.bounceRate,
        conversionRate: c.conversionRate,
      },
    }));

    res.status(200).json({
      success: true,
      data: campaignData,
      pagination: {
        limit: parseInt(limit),
        total: await Campaign.countDocuments({ status: 'sent', archivedAt: null }),
      },
    });
  } catch (error) {
    console.error('Error fetching campaign analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch campaign analytics',
      error: error.message,
    });
  }
};

// ============================================================================
// SEQUENCE ANALYTICS
// ============================================================================

/**
 * Get sequence analytics
 * @route GET /api/analytics-dashboard/sequences
 * @access Private (Admin/Manager)
 */
export const getSequenceAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = parseDateRange(req.query);

    const metrics = await aggregateSequenceMetrics(startDate, endDate);

    // Get detailed sequence performance
    const sequences = await Sequence.find({
      status: { $in: ['active', 'paused'] },
      archivedAt: null,
    })
      .select('name type category status metrics steps goal goalTarget createdAt')
      .sort({ 'metrics.enrolled': -1 })
      .limit(20)
      .lean();

    const sequenceData = sequences.map(s => ({
      id: s._id,
      name: s.name,
      type: s.type,
      category: s.category,
      status: s.status,
      goal: s.goal,
      goalTarget: s.goalTarget,
      stepsCount: s.steps?.length || 0,
      metrics: s.metrics,
      virtuals: {
        completionRate: s.completionRate,
        openRate: s.openRate,
        clickRate: s.clickRate,
        conversionRate: s.conversionRate,
      },
      createdAt: s.createdAt,
    }));

    res.status(200).json({
      success: true,
      data: {
        ...metrics,
        sequences: sequenceData,
      },
      dateRange: { startDate, endDate },
    });
  } catch (error) {
    console.error('Error fetching sequence analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sequence analytics',
      error: error.message,
    });
  }
};

/**
 * Get sequence enrollment trends
 * @route GET /api/analytics-dashboard/sequences/enrollment-trend
 * @access Private (Admin/Manager)
 */
export const getSequenceEnrollmentTrend = async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Get leads enrolled in sequences over time
    const enrollmentTrend = await Lead.aggregate([
      {
        $match: {
          'activeSequences.0': { $exists: true },
          'sequenceHistory.0': { $exists: true },
          isActive: true,
        },
      },
      { $unwind: '$sequenceHistory' },
      {
        $match: {
          'sequenceHistory.action': 'enrolled',
          'sequenceHistory.timestamp': { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$sequenceHistory.timestamp' },
            month: { $month: '$sequenceHistory.timestamp' },
            day: { $dayOfMonth: '$sequenceHistory.timestamp' },
          },
          enrolled: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
    ]);

    const trend = enrollmentTrend.map(t => ({
      date: `${t._id.year}-${String(t._id.month).padStart(2, '0')}-${String(t._id.day).padStart(2, '0')}`,
      enrolled: t.enrolled,
    }));

    res.status(200).json({
      success: true,
      data: trend,
      dateRange: { startDate, endDate },
    });
  } catch (error) {
    console.error('Error fetching enrollment trend:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch enrollment trend',
      error: error.message,
    });
  }
};

// ============================================================================
// SOCIAL MEDIA ANALYTICS
// ============================================================================

/**
 * Get social media analytics
 * @route GET /api/analytics-dashboard/social
 * @access Private (Admin/Manager)
 */
export const getSocialAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = parseDateRange(req.query);

    const metrics = await aggregateSocialMetrics(startDate, endDate);

    // Get social post trends
    const postTrend = await SocialPost.aggregate([
      {
        $match: {
          publishedAt: { $gte: startDate, $lte: endDate },
          status: 'published',
        },
      },
      {
        $group: {
          _id: {
            platform: '$platform',
            year: { $year: '$publishedAt' },
            month: { $month: '$publishedAt' },
            day: { $dayOfMonth: '$publishedAt' },
          },
          posts: { $sum: 1 },
          likes: { $sum: '$analytics.likes' },
          comments: { $sum: '$analytics.comments' },
          shares: { $sum: '$analytics.shares' },
          impressions: { $sum: '$analytics.impressions' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
    ]);

    const trend = postTrend.map(t => ({
      date: `${t._id.year}-${String(t._id.month).padStart(2, '0')}-${String(t._id.day).padStart(2, '0')}`,
      platform: t._id.platform,
      posts: t.posts,
      likes: t.likes,
      comments: t.comments,
      shares: t.shares,
      impressions: t.impressions,
      engagementRate: t.impressions > 0
        ? Math.round(((t.likes + t.comments + t.shares) / t.impressions) * 10000) / 100
        : 0,
    }));

    res.status(200).json({
      success: true,
      data: {
        ...metrics,
        postTrend: trend,
      },
      dateRange: { startDate, endDate },
    });
  } catch (error) {
    console.error('Error fetching social analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch social analytics',
      error: error.message,
    });
  }
};

/**
 * Get social account status
 * @route GET /api/analytics-dashboard/social/accounts
 * @access Private (Admin/Manager)
 */
export const getSocialAccountsStatus = async (req, res) => {
  try {
    const SocialAccount = require('../models/SocialAccount.js').default;

    const accounts = await SocialAccount.find()
      .select('platform accountName status stats followerCount lastSyncedAt createdAt')
      .sort({ createdAt: -1 })
      .lean();

    const accountStatus = accounts.map(acc => ({
      id: acc._id,
      platform: acc.platform,
      accountName: acc.accountName || `${acc.platform} Account`,
      status: acc.status,
      followers: acc.stats?.followers || acc.followerCount || 0,
      lastSyncedAt: acc.lastSyncedAt || acc.stats?.lastSyncedAt,
      needsReauth: acc.status === 'needs_reauth' || acc.status === 'error',
      createdAt: acc.createdAt,
    }));

    res.status(200).json({
      success: true,
      data: accountStatus,
    });
  } catch (error) {
    console.error('Error fetching social accounts status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch social accounts status',
      error: error.message,
    });
  }
};

// ============================================================================
// A/B TEST ANALYTICS
// ============================================================================

/**
 * Get A/B test analytics
 * @route GET /api/analytics-dashboard/abtests
 * @access Private (Admin/Manager)
 */
export const getABTestAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = parseDateRange(req.query);

    const metrics = await aggregateABTestMetrics(startDate, endDate);

    // Get recent test results
    const recentTests = await ABTest.find({
      $or: [
        { createdAt: { $gte: startDate, $lte: endDate } },
        { status: 'running' },
      ],
    })
      .select('name testType status variants significance winnerCriteria results createdAt duration')
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    const testData = recentTests.map(t => ({
      id: t._id,
      name: t.name,
      testType: t.testType,
      status: t.status,
      variants: t.variants?.length || 0,
      winnerCriteria: t.winnerCriteria,
      isSignificant: t.significance?.isSignificant || false,
      confidenceLevel: t.significance?.confidenceLevel || 0,
      improvement: t.results?.improvementPercentage || 0,
      createdAt: t.createdAt,
      startedAt: t.duration?.actualStartAt,
      completedAt: t.duration?.actualEndAt,
    }));

    res.status(200).json({
      success: true,
      data: {
        ...metrics,
        tests: testData,
      },
      dateRange: { startDate, endDate },
    });
  } catch (error) {
    console.error('Error fetching A/B test analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch A/B test analytics',
      error: error.message,
    });
  }
};

// ============================================================================
// REVENUE & ROI ANALYTICS
// ============================================================================

/**
 * Get revenue and ROI analytics
 * @route GET /api/analytics-dashboard/revenue
 * @access Private (Admin/Manager)
 */
export const getRevenueAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = parseDateRange(req.query);

    const metrics = await aggregateRevenueMetrics(startDate, endDate);

    // Get revenue trend over time
    const revenueTrend = await Lead.aggregate([
      {
        $match: {
          convertedAt: { $gte: startDate, $lte: endDate },
          isActive: true,
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$convertedAt' },
            month: { $month: '$convertedAt' },
            day: { $dayOfMonth: '$convertedAt' },
          },
          conversions: { $sum: 1 },
          revenue: { $sum: { $ifNull: ['$estimatedValue', 0] } },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
    ]);

    const trend = revenueTrend.map(t => ({
      date: `${t._id.year}-${String(t._id.month).padStart(2, '0')}-${String(t._id.day).padStart(2, '0')}`,
      conversions: t.conversions,
      revenue: Math.round(t.revenue),
    }));

    // Calculate cumulative revenue
    let cumulative = 0;
    const cumulativeTrend = trend.map(t => {
      cumulative += t.revenue;
      return {
        date: t.date,
        revenue: t.revenue,
        cumulative: Math.round(cumulative),
      };
    });

    res.status(200).json({
      success: true,
      data: {
        ...metrics,
        revenueTrend: cumulativeTrend,
      },
      dateRange: { startDate, endDate },
    });
  } catch (error) {
    console.error('Error fetching revenue analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch revenue analytics',
      error: error.message,
    });
  }
};

// ============================================================================
// CONVERSION FUNNEL ANALYTICS
// ============================================================================

/**
 * Get conversion funnel analytics
 * @route GET /api/analytics-dashboard/funnel
 * @access Private (Admin/Manager)
 */
export const getFunnelAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = parseDateRange(req.query);

    const funnel = await buildFunnelAnalytics(startDate, endDate);

    // Get funnel stage duration data
    const stageDurations = await Lead.aggregate([
      {
        $match: {
          pipelineStageHistory: { $exists: true },
          isActive: true,
        },
      },
      { $unwind: '$pipelineStageHistory' },
      {
        $match: {
          'pipelineStageHistory.duration': { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: '$pipelineStageHistory.stage',
          avgDuration: { $avg: '$pipelineStageHistory.duration' },
          minDuration: { $min: '$pipelineStageHistory.duration' },
          maxDuration: { $max: '$pipelineStageHistory.duration' },
        },
      },
      { $sort: { avgDuration: 1 } },
    ]);

    const durations = stageDurations.map(d => ({
      stage: d._id,
      avgDuration: Math.round(d.avgDuration),
      minDuration: Math.round(d.minDuration),
      maxDuration: Math.round(d.maxDuration),
    }));

    res.status(200).json({
      success: true,
      data: {
        ...funnel,
        stageDurations: durations,
      },
      dateRange: { startDate, endDate },
    });
  } catch (error) {
    console.error('Error fetching funnel analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch funnel analytics',
      error: error.message,
    });
  }
};

// ============================================================================
// COHORT ANALYTICS
// ============================================================================

/**
 * Get cohort analysis
 * @route GET /api/analytics-dashboard/cohorts
 * @access Private (Admin/Manager)
 */
export const getCohortAnalytics = async (req, res) => {
  try {
    const { type = 'week', periods = 12 } = req.query;

    const cohorts = await generateCohortAnalysis(type, parseInt(periods));

    res.status(200).json({
      success: true,
      data: cohorts,
    });
  } catch (error) {
    console.error('Error fetching cohort analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cohort analytics',
      error: error.message,
    });
  }
};

// ============================================================================
// SNAPSHOT MANAGEMENT
// ============================================================================

/**
 * Get latest dashboard snapshot
 * @route GET /api/analytics-dashboard/snapshot/latest
 * @access Private (Admin/Manager)
 */
export const getLatestSnapshot = async (req, res) => {
  try {
    const { period = 'daily' } = req.query;

    const snapshot = await AnalyticsDashboard.getLatest(period);

    if (!snapshot) {
      return res.status(404).json({
        success: false,
        message: 'No snapshot found for the specified period',
      });
    }

    res.status(200).json({
      success: true,
      data: snapshot,
    });
  } catch (error) {
    console.error('Error fetching latest snapshot:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch latest snapshot',
      error: error.message,
    });
  }
};

/**
 * Generate and save a new dashboard snapshot
 * @route POST /api/analytics-dashboard/snapshot/generate
 * @access Private (Admin)
 */
export const generateSnapshot = async (req, res) => {
  try {
    const { date, period = 'daily' } = req.body;

    const snapshotDate = date ? new Date(date) : new Date();
    const snapshot = await saveDashboardSnapshot(snapshotDate, period);

    res.status(201).json({
      success: true,
      message: 'Dashboard snapshot generated successfully',
      data: snapshot,
    });
  } catch (error) {
    console.error('Error generating snapshot:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate snapshot',
      error: error.message,
    });
  }
};

/**
 * Batch generate snapshots for date range
 * @route POST /api/analytics-dashboard/snapshot/batch
 * @access Private (Admin)
 */
export const batchGenerateSnapshotsHandler = async (req, res) => {
  try {
    const { startDate, endDate, period = 'daily' } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate and endDate are required',
      });
    }

    const snapshots = await batchGenerateSnapshots(
      new Date(startDate),
      new Date(endDate),
      period
    );

    res.status(201).json({
      success: true,
      message: `Generated ${snapshots.length} snapshots`,
      data: {
        count: snapshots.length,
        snapshots: snapshots.map(s => ({
          id: s._id,
          period: s.period,
          date: s.date,
          computedAt: s.computedAt,
        })),
      },
    });
  } catch (error) {
    console.error('Error batch generating snapshots:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to batch generate snapshots',
      error: error.message,
    });
  }
};

// ============================================================================
// EXPORT FUNCTIONALITY
// ============================================================================

/**
 * Export analytics data as CSV
 * @route GET /api/analytics-dashboard/export/csv
 * @access Private (Admin/Manager)
 */
export const exportAnalyticsCSV = async (req, res) => {
  try {
    const { type = 'overview', startDate, endDate } = req.query;

    const { startDate: start, endDate: end } = parseDateRange({ startDate, endDate });

    let csv = '';
    let filename = `${type}_${formatDateForExport(start)}_to_${formatDateForExport(end)}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    if (type === 'leads') {
      const leads = await Lead.find({
        createdAt: { $gte: start, $lte: end },
      })
        .select('name email company source status pipelineStage leadScore estimatedValue probability createdAt')
        .lean();

      const columns = [
        { header: 'Name', field: 'name' },
        { header: 'Email', field: 'email' },
        { header: 'Company', field: 'company' },
        { header: 'Source', field: 'source' },
        { header: 'Status', field: 'status' },
        { header: 'Pipeline Stage', field: 'pipelineStage' },
        { header: 'Lead Score', field: 'leadScore' },
        { header: 'Estimated Value', field: 'estimatedValue' },
        { header: 'Probability', field: 'probability' },
        { header: 'Created At', field: 'createdAt' },
      ];

      csv = convertToCSV(leads, columns);
    } else if (type === 'campaigns') {
      const campaigns = await Campaign.find({
        createdAt: { $gte: start, $lte: end },
        archivedAt: null,
      })
        .select('name type category status metrics.createdAt')
        .lean();

      const columns = [
        { header: 'Name', field: 'name' },
        { header: 'Type', field: 'type' },
        { header: 'Category', field: 'category' },
        { header: 'Status', field: 'status' },
        { header: 'Sent', field: 'metrics.sent' },
        { header: 'Delivered', field: 'metrics.delivered' },
        { header: 'Opens', field: 'metrics.uniqueOpens' },
        { header: 'Clicks', field: 'metrics.uniqueClicks' },
        { header: 'Conversions', field: 'metrics.conversions' },
        { header: 'Revenue', field: 'metrics.revenue' },
      ];

      csv = convertToCSV(campaigns, columns);
    } else if (type === 'sequences') {
      const sequences = await Sequence.find({
        createdAt: { $gte: start, $lte: end },
        archivedAt: null,
      })
        .select('name type category status metrics')
        .lean();

      const columns = [
        { header: 'Name', field: 'name' },
        { header: 'Type', field: 'type' },
        { header: 'Category', field: 'category' },
        { header: 'Status', field: 'status' },
        { header: 'Enrolled', field: 'metrics.enrolled' },
        { header: 'Completed', field: 'metrics.completed' },
        { header: 'Active', field: 'metrics.active' },
        { header: 'Emails Sent', field: 'metrics.emailsSent' },
        { header: 'Conversions', field: 'metrics.converted' },
      ];

      csv = convertToCSV(sequences, columns);
    } else {
      // Default to overview metrics
      const snapshot = await AnalyticsDashboard.getAggregateForRange(start, end, 'daily');

      const overviewData = [{
        period: snapshot.period,
        totalLeads: snapshot.leads?.total || 0,
        newLeads: snapshot.leads?.new || 0,
        convertedLeads: snapshot.leads?.converted || 0,
        emailCampaigns: snapshot.email?.totalCampaigns || 0,
        emailsSent: snapshot.email?.emailsSent || 0,
        openRate: snapshot.email?.openRate || 0,
        clickRate: snapshot.email?.clickRate || 0,
        totalRevenue: snapshot.revenue?.totalRevenue || 0,
        roi: snapshot.revenue?.roi || 0,
      }];

      const columns = [
        { header: 'Period', field: 'period' },
        { header: 'Total Leads', field: 'totalLeads' },
        { header: 'New Leads', field: 'newLeads' },
        { header: 'Converted Leads', field: 'convertedLeads' },
        { header: 'Email Campaigns', field: 'emailCampaigns' },
        { header: 'Emails Sent', field: 'emailsSent' },
        { header: 'Open Rate', field: 'openRate' },
        { header: 'Click Rate', field: 'clickRate' },
        { header: 'Total Revenue', field: 'totalRevenue' },
        { header: 'ROI', field: 'roi' },
      ];

      csv = convertToCSV(overviewData, columns);
    }

    res.send(csv);
  } catch (error) {
    console.error('Error exporting CSV:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export analytics data',
      error: error.message,
    });
  }
};

/**
 * Export analytics data as JSON
 * @route GET /api/analytics-dashboard/export/json
 * @access Private (Admin/Manager)
 */
export const exportAnalyticsJSON = async (req, res) => {
  try {
    const { type = 'overview', startDate, endDate } = req.query;

    const { startDate: start, endDate: end } = parseDateRange({ startDate, endDate });

    let data = {};
    let filename = `${type}_${formatDateForExport(start)}_to_${formatDateForExport(end)}.json`;

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    if (type === 'overview') {
      data = await AnalyticsDashboard.getAggregateForRange(start, end, 'daily');
    } else if (type === 'leads') {
      data.leads = await aggregateLeadMetrics(start, end);
    } else if (type === 'email') {
      data.email = await aggregateEmailMetrics(start, end);
    } else if (type === 'sequences') {
      data.sequences = await aggregateSequenceMetrics(start, end);
    } else if (type === 'social') {
      data.social = await aggregateSocialMetrics(start, end);
    } else if (type === 'revenue') {
      data.revenue = await aggregateRevenueMetrics(start, end);
    } else if (type === 'full') {
      data = await generateDashboardSnapshot(new Date(), 'daily');
    }

    res.json({
      success: true,
      exportDate: new Date().toISOString(),
      dateRange: { startDate: start, endDate: end },
      data,
    });
  } catch (error) {
    console.error('Error exporting JSON:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export analytics data',
      error: error.message,
    });
  }
};

// ============================================================================
// WIDGET MANAGEMENT
// ============================================================================

/**
 * Get dashboard widgets configuration
 * @route GET /api/analytics-dashboard/widgets
 * @access Private (Admin/Manager)
 */
export const getWidgets = async (req, res) => {
  try {
    const { period = 'daily' } = req.query;

    const snapshot = await AnalyticsDashboard.getLatest(period);

    if (!snapshot || !snapshot.widgets) {
      return res.status(200).json({
        success: true,
        data: getDefaultWidgets(),
      });
    }

    res.status(200).json({
      success: true,
      data: snapshot.widgets,
    });
  } catch (error) {
    console.error('Error fetching widgets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch widgets',
      error: error.message,
    });
  }
};

/**
 * Update dashboard widgets configuration
 * @route PUT /api/analytics-dashboard/widgets
 * @access Private (Admin)
 */
export const updateWidgets = async (req, res) => {
  try {
    const { widgets, period = 'daily' } = req.body;

    if (!Array.isArray(widgets)) {
      return res.status(400).json({
        success: false,
        message: 'Widgets must be an array',
      });
    }

    const snapshot = await AnalyticsDashboard.getLatest(period);

    if (snapshot) {
      snapshot.widgets = widgets;
      await snapshot.save();
    } else {
      await AnalyticsDashboard.create({
        period,
        date: new Date(),
        widgets,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Widgets updated successfully',
      data: widgets,
    });
  } catch (error) {
    console.error('Error updating widgets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update widgets',
      error: error.message,
    });
  }
};

/**
 * Get default widgets configuration
 * @returns {Array} Default widgets
 */
function getDefaultWidgets() {
  return [
    {
      widgetId: 'kpi-leads',
      type: 'metric',
      title: 'Total Leads',
      position: { row: 0, col: 0, rowSpan: 1, colSpan: 1 },
      dataSource: 'leads',
      metricType: 'total',
      visualization: 'number',
      config: { icon: 'users', color: 'blue' },
      refreshInterval: 300000,
      enabled: true,
    },
    {
      widgetId: 'kpi-conversions',
      type: 'metric',
      title: 'Conversions',
      position: { row: 0, col: 1, rowSpan: 1, colSpan: 1 },
      dataSource: 'leads',
      metricType: 'total',
      field: 'converted',
      visualization: 'number',
      config: { icon: 'check-circle', color: 'green' },
      refreshInterval: 300000,
      enabled: true,
    },
    {
      widgetId: 'kpi-revenue',
      type: 'metric',
      title: 'Revenue',
      position: { row: 0, col: 2, rowSpan: 1, colSpan: 1 },
      dataSource: 'revenue',
      metricType: 'total',
      field: 'totalRevenue',
      visualization: 'currency',
      config: { icon: 'dollar-sign', color: 'emerald' },
      refreshInterval: 300000,
      enabled: true,
    },
    {
      widgetId: 'kpi-email-rate',
      type: 'metric',
      title: 'Email Open Rate',
      position: { row: 0, col: 3, rowSpan: 1, colSpan: 1 },
      dataSource: 'email',
      metricType: 'average',
      field: 'openRate',
      visualization: 'percentage',
      config: { icon: 'envelope', color: 'purple' },
      refreshInterval: 300000,
      enabled: true,
    },
    {
      widgetId: 'lead-trend',
      type: 'chart',
      title: 'Lead Trend',
      position: { row: 1, col: 0, rowSpan: 2, colSpan: 2 },
      dataSource: 'leads',
      metricType: 'total',
      visualization: 'line',
      config: { showPoints: true, fillArea: false },
      refreshInterval: 300000,
      enabled: true,
    },
    {
      widgetId: 'funnel',
      type: 'funnel',
      title: 'Conversion Funnel',
      position: { row: 1, col: 2, rowSpan: 2, colSpan: 2 },
      dataSource: 'funnel',
      visualization: 'funnel',
      config: {},
      refreshInterval: 300000,
      enabled: true,
    },
    {
      widgetId: 'top-campaigns',
      type: 'table',
      title: 'Top Campaigns',
      position: { row: 3, col: 0, rowSpan: 2, colSpan: 2 },
      dataSource: 'email',
      metricType: 'topCampaigns',
      visualization: 'table',
      config: { limit: 5 },
      refreshInterval: 300000,
      enabled: true,
    },
    {
      widgetId: 'revenue-by-source',
      type: 'chart',
      title: 'Revenue by Source',
      position: { row: 3, col: 2, rowSpan: 2, colSpan: 2 },
      dataSource: 'revenue',
      metricType: 'revenueBySource',
      visualization: 'pie',
      config: {},
      refreshInterval: 300000,
      enabled: true,
    },
  ];
}

export default {
  // Overview
  getDashboardOverview,

  // Leads
  getLeadAnalytics,
  getPipelineSnapshot,

  // Email & Campaigns
  getEmailAnalytics,
  getCampaignAnalytics,

  // Sequences
  getSequenceAnalytics,
  getSequenceEnrollmentTrend,

  // Social
  getSocialAnalytics,
  getSocialAccountsStatus,

  // A/B Tests
  getABTestAnalytics,

  // Revenue
  getRevenueAnalytics,

  // Funnel
  getFunnelAnalytics,

  // Cohorts
  getCohortAnalytics,

  // Snapshots
  getLatestSnapshot,
  generateSnapshot,
  batchGenerateSnapshots: batchGenerateSnapshotsHandler,

  // Exports
  exportAnalyticsCSV,
  exportAnalyticsJSON,

  // Widgets
  getWidgets,
  updateWidgets,
};
