import express from 'express';
import Analytics from '../models/Analytics.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication and admin role
router.use(protect);
router.use(authorize('admin', 'manager'));

// @desc    Get analytics dashboard
// @route   GET /api/analytics/dashboard
// @access  Private/Admin
router.get('/dashboard', async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const summary = await Analytics.getDashboardSummary(parseInt(days));

    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Get conversion funnel data
// @route   GET /api/analytics/funnel
// @access  Private/Admin
router.get('/funnel', async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const analytics = await Analytics.getForRange(startDate, endDate, 'daily');

    // Aggregate funnel data
    const funnel = {
      visitors: 0,
      engaged: 0,
      leads: 0,
      qualified: 0,
      opportunities: 0,
      converted: 0
    };

    analytics.forEach(a => {
      funnel.visitors += a.funnel?.visitors || 0;
      funnel.engaged += a.funnel?.engaged || 0;
      funnel.leads += a.funnel?.leads || 0;
      funnel.qualified += a.funnel?.qualified || 0;
      funnel.opportunities += a.funnel?.opportunities || 0;
      funnel.converted += a.funnel?.converted || 0;
    });

    // Calculate conversion rates
    const total = funnel.visitors || 1;
    const rates = {
      toEngaged: ((funnel.engaged / total) * 100).toFixed(2),
      toLeads: ((funnel.leads / total) * 100).toFixed(2),
      toQualified: ((funnel.qualified / total) * 100).toFixed(2),
      toOpportunities: ((funnel.opportunities / total) * 100).toFixed(2),
      toConverted: ((funnel.converted / total) * 100).toFixed(2)
    };

    res.status(200).json({
      success: true,
      data: {
        funnel,
        rates
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Track analytics event (for manual tracking)
// @route   POST /api/analytics/track
// @access  Private/Admin
router.post('/track', async (req, res) => {
  try {
    const { event, data } = req.body;

    // This would typically integrate with an analytics service
    // like Google Analytics, Mixpanel, PostHog, etc.

    res.status(200).json({
      success: true,
      message: 'Event tracked successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Get analytics by source
// @route   GET /api/analytics/sources
// @access  Private/Admin
router.get('/sources', async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const analytics = await Analytics.getForRange(startDate, endDate, 'daily');

    // Aggregate source data
    const sources = {};

    analytics.forEach(a => {
      Object.entries(a.sources || {}).forEach(([source, data]) => {
        if (!sources[source]) {
          sources[source] = { visits: 0, conversions: 0 };
        }
        sources[source].visits += data.visits || 0;
        sources[source].conversions += data.conversions || 0;
      });
    });

    // Calculate conversion rates
    const sourceData = Object.entries(sources).map(([source, data]) => ({
      source,
      ...data,
      conversionRate: data.visits > 0
        ? ((data.conversions / data.visits) * 100).toFixed(2)
        : 0
    })).sort((a, b) => b.visits - a.visits);

    res.status(200).json({
      success: true,
      data: sourceData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;
