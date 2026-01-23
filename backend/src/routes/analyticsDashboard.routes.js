import express from 'express';
import {
  getDashboardOverview,
  getLeadAnalytics,
  getPipelineSnapshot,
  getEmailAnalytics,
  getCampaignAnalytics,
  getSequenceAnalytics,
  getSequenceEnrollmentTrend,
  getSocialAnalytics,
  getSocialAccountsStatus,
  getABTestAnalytics,
  getRevenueAnalytics,
  getFunnelAnalytics,
  getCohortAnalytics,
  getLatestSnapshot,
  generateSnapshot,
  batchGenerateSnapshotsHandler as batchGenerateSnapshots,
  exportAnalyticsCSV,
  exportAnalyticsJSON,
  getWidgets,
  updateWidgets,
} from '../controllers/analyticsDashboardController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// ============================================================================
// AUTH MIDDLEWARE
// ============================================================================

// All routes require authentication
router.use(protect);

// Most routes require admin or manager role
const adminOrManager = authorize('admin', 'manager');

// ============================================================================
// OVERVIEW ROUTES
// ============================================================================

/**
 * @route   GET /api/analytics-dashboard/overview
 * @desc    Get dashboard overview with key metrics
 * @access  Private (Admin/Manager)
 */
router.get('/overview', adminOrManager, getDashboardOverview);

// ============================================================================
// LEAD ANALYTICS ROUTES
// ============================================================================

/**
 * @route   GET /api/analytics-dashboard/leads
 * @desc    Get lead analytics with sources and pipeline metrics
 * @access  Private (Admin/Manager)
 */
router.get('/leads', adminOrManager, getLeadAnalytics);

/**
 * @route   GET /api/analytics-dashboard/leads/pipeline
 * @desc    Get current pipeline snapshot
 * @access  Private (Admin/Manager)
 */
router.get('/leads/pipeline', adminOrManager, getPipelineSnapshot);

// ============================================================================
// EMAIL & CAMPAIGN ANALYTICS ROUTES
// ============================================================================

/**
 * @route   GET /api/analytics-dashboard/email
 * @desc    Get email and campaign analytics
 * @access  Private (Admin/Manager)
 */
router.get('/email', adminOrManager, getEmailAnalytics);

/**
 * @route   GET /api/analytics-dashboard/campaigns
 * @desc    Get campaign performance details
 * @access  Private (Admin/Manager)
 */
router.get('/campaigns', adminOrManager, getCampaignAnalytics);

// ============================================================================
// SEQUENCE ANALYTICS ROUTES
// ============================================================================

/**
 * @route   GET /api/analytics-dashboard/sequences
 * @desc    Get sequence analytics
 * @access  Private (Admin/Manager)
 */
router.get('/sequences', adminOrManager, getSequenceAnalytics);

/**
 * @route   GET /api/analytics-dashboard/sequences/enrollment-trend
 * @desc    Get sequence enrollment trends
 * @access  Private (Admin/Manager)
 */
router.get('/sequences/enrollment-trend', adminOrManager, getSequenceEnrollmentTrend);

// ============================================================================
// SOCIAL MEDIA ANALYTICS ROUTES
// ============================================================================

/**
 * @route   GET /api/analytics-dashboard/social
 * @desc    Get social media analytics
 * @access  Private (Admin/Manager)
 */
router.get('/social', adminOrManager, getSocialAnalytics);

/**
 * @route   GET /api/analytics-dashboard/social/accounts
 * @desc    Get social account status
 * @access  Private (Admin/Manager)
 */
router.get('/social/accounts', adminOrManager, getSocialAccountsStatus);

// ============================================================================
// A/B TEST ANALYTICS ROUTES
// ============================================================================

/**
 * @route   GET /api/analytics-dashboard/abtests
 * @desc    Get A/B test analytics
 * @access  Private (Admin/Manager)
 */
router.get('/abtests', adminOrManager, getABTestAnalytics);

// ============================================================================
// REVENUE & ROI ANALYTICS ROUTES
// ============================================================================

/**
 * @route   GET /api/analytics-dashboard/revenue
 * @desc    Get revenue and ROI analytics
 * @access  Private (Admin/Manager)
 */
router.get('/revenue', adminOrManager, getRevenueAnalytics);

// ============================================================================
// CONVERSION FUNNEL ROUTES
// ============================================================================

/**
 * @route   GET /api/analytics-dashboard/funnel
 * @desc    Get conversion funnel analytics
 * @access  Private (Admin/Manager)
 */
router.get('/funnel', adminOrManager, getFunnelAnalytics);

// ============================================================================
// COHORT ANALYTICS ROUTES
// ============================================================================

/**
 * @route   GET /api/analytics-dashboard/cohorts
 * @desc    Get cohort analysis
 * @access  Private (Admin/Manager)
 */
router.get('/cohorts', adminOrManager, getCohortAnalytics);

// ============================================================================
// SNAPSHOT MANAGEMENT ROUTES
// ============================================================================

/**
 * @route   GET /api/analytics-dashboard/snapshot/latest
 * @desc    Get latest dashboard snapshot
 * @access  Private (Admin/Manager)
 */
router.get('/snapshot/latest', adminOrManager, getLatestSnapshot);

/**
 * @route   POST /api/analytics-dashboard/snapshot/generate
 * @desc    Generate and save a new dashboard snapshot
 * @access  Private (Admin)
 */
router.post('/snapshot/generate', authorize('admin'), generateSnapshot);

/**
 * @route   POST /api/analytics-dashboard/snapshot/batch
 * @desc    Batch generate snapshots for date range
 * @access  Private (Admin)
 */
router.post('/snapshot/batch', authorize('admin'), batchGenerateSnapshots);

// ============================================================================
// EXPORT ROUTES
// ============================================================================

/**
 * @route   GET /api/analytics-dashboard/export/csv
 * @desc    Export analytics data as CSV
 * @access  Private (Admin/Manager)
 */
router.get('/export/csv', adminOrManager, exportAnalyticsCSV);

/**
 * @route   GET /api/analytics-dashboard/export/json
 * @desc    Export analytics data as JSON
 * @access  Private (Admin/Manager)
 */
router.get('/export/json', adminOrManager, exportAnalyticsJSON);

// ============================================================================
// WIDGET MANAGEMENT ROUTES
// ============================================================================

/**
 * @route   GET /api/analytics-dashboard/widgets
 * @desc    Get dashboard widgets configuration
 * @access  Private (Admin/Manager)
 */
router.get('/widgets', adminOrManager, getWidgets);

/**
 * @route   PUT /api/analytics-dashboard/widgets
 * @desc    Update dashboard widgets configuration
 * @access  Private (Admin)
 */
router.put('/widgets', authorize('admin'), updateWidgets);

export default router;
