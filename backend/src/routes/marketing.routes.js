import express from 'express';
import {
  getCampaigns,
  getCampaignById,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  scheduleCampaign,
  sendCampaign,
  pauseCampaign,
  resumeCampaign,
  cancelCampaign,
  previewAudience,
  estimateAudience,
  configureAbTest,
  getAbTestResults,
  selectAbTestWinner,
  getCampaignAnalytics,
  getMarketingAnalytics,
  duplicateCampaign,
  approveCampaign,
  rejectCampaign,
  getPendingApproval,
  getQueueStatus,
  getJobStatusEndpoint,
} from '../controllers/marketingController.js';
import { protect, authorize } from '../middleware/auth.js';

/**
 * Marketing Routes - Phase 3: Email Marketing & Campaigns
 *
 * RESTful routes for campaign management:
 * - Campaign CRUD operations
 * - Campaign scheduling and sending
 * - Audience preview/estimation
 * - A/B test management
 * - Analytics and reporting
 * - Approval workflow
 *
 * @version 1.0.0
 * @since 2026-01-23
 */

const router = express.Router();

// ============================================================================
// ALL ROUTES REQUIRE AUTHENTICATION
// ============================================================================

router.use(protect);

// ============================================================================
// ANALYTICS & QUEUE STATUS (Admin/Manager)
// ============================================================================

/**
 * @route   GET /api/marketing/analytics
 * @desc    Get aggregate marketing metrics
 * @access  Private/Admin/Manager
 */
router.get('/analytics', authorize('admin', 'manager'), getMarketingAnalytics);

/**
 * @route   GET /api/marketing/queue-status
 * @desc    Get email queue status
 * @access  Private/Admin
 */
router.get('/queue-status', authorize('admin'), getQueueStatus);

/**
 * @route   GET /api/marketing/jobs/:jobId
 * @desc    Get job status by ID
 * @access  Private/Admin/Manager
 */
router.get('/jobs/:jobId', authorize('admin', 'manager'), getJobStatusEndpoint);

// ============================================================================
// AUDIENCE ESTIMATION (Admin/Manager)
// ============================================================================

/**
 * @route   POST /api/marketing/audience-estimate
 * @desc    Estimate audience size without creating a campaign
 * @access  Private/Admin/Manager
 */
router.post('/audience-estimate', authorize('admin', 'manager'), estimateAudience);

// ============================================================================
// APPROVAL WORKFLOW (Admin Only)
// ============================================================================

/**
 * @route   GET /api/marketing/campaigns/pending-approval
 * @desc    Get campaigns pending approval
 * @access  Private/Admin
 */
router.get('/campaigns/pending-approval', authorize('admin'), getPendingApproval);

// ============================================================================
// CAMPAIGN CRUD ROUTES (Admin/Manager)
// ============================================================================

/**
 * @route   GET /api/marketing/campaigns
 * @desc    Get all campaigns with filters and pagination
 * @access  Private/Admin/Manager
 *
 * @query   {string} [status] - Filter by status (draft, scheduled, sending, sent, paused, cancelled, failed)
 * @query   {string} [type] - Filter by type (one-time, recurring, automated, drip, transactional)
 * @query   {string} [category] - Filter by category
 * @query   {string} [search] - Search by name/description
 * @query   {number} [page=1] - Page number
 * @query   {number} [limit=20] - Items per page
 * @query   {string} [sort=-createdAt] - Sort field
 */
router.get('/campaigns', authorize('admin', 'manager'), getCampaigns);

/**
 * @route   POST /api/marketing/campaigns
 * @desc    Create a new campaign
 * @access  Private/Admin/Manager
 *
 * @body    {string} name - Campaign name (required)
 * @body    {string} template - Template ID (required)
 * @body    {string} [description] - Campaign description
 * @body    {string} [type] - Campaign type
 * @body    {string} [category] - Campaign category
 * @body    {string} [subject] - Email subject (overrides template)
 * @body    {string} [preheader] - Preheader text (overrides template)
 * @body    {Object} [sender] - Sender configuration
 * @body    {Object} [schedule] - Schedule configuration
 * @body    {Object} [audience] - Audience targeting configuration
 * @body    {Object} [abTest] - A/B testing configuration
 * @body    {Object} [budget] - Budget configuration
 * @body    {string[]} [tags] - Campaign tags
 * @body    {string} [notes] - Internal notes
 * @body    {string} [priority] - Priority (low, normal, high, urgent)
 * @body    {boolean} [requiresApproval] - Whether approval is required
 */
router.post('/campaigns', authorize('admin', 'manager'), createCampaign);

/**
 * @route   GET /api/marketing/campaigns/:id
 * @desc    Get a single campaign by ID
 * @access  Private/Admin/Manager
 *
 * @param   {string} id - Campaign ID
 */
router.get('/campaigns/:id', authorize('admin', 'manager'), getCampaignById);

/**
 * @route   PUT /api/marketing/campaigns/:id
 * @desc    Update a campaign
 * @access  Private/Admin/Manager
 *
 * @param   {string} id - Campaign ID
 * @body    All createCampaign fields are allowed
 */
router.put('/campaigns/:id', authorize('admin', 'manager'), updateCampaign);

/**
 * @route   DELETE /api/marketing/campaigns/:id
 * @desc    Delete (archive) a campaign
 * @access  Private/Admin
 *
 * @param   {string} id - Campaign ID
 */
router.delete('/campaigns/:id', authorize('admin'), deleteCampaign);

// ============================================================================
// CAMPAIGN ACTIONS (Admin/Manager)
// ============================================================================

/**
 * @route   POST /api/marketing/campaigns/:id/duplicate
 * @desc    Duplicate a campaign
 * @access  Private/Admin/Manager
 *
 * @param   {string} id - Campaign ID
 * @body    {string} [name] - Name for duplicate
 */
router.post('/campaigns/:id/duplicate', authorize('admin', 'manager'), duplicateCampaign);

/**
 * @route   POST /api/marketing/campaigns/:id/schedule
 * @desc    Schedule a campaign for sending
 * @access  Private/Admin/Manager
 *
 * @param   {string} id - Campaign ID
 * @body    {string} sendAt - ISO date string for when to send (required)
 * @body    {string} [timezone] - Timezone (default: Africa/Nairobi)
 */
router.post('/campaigns/:id/schedule', authorize('admin', 'manager'), scheduleCampaign);

/**
 * @route   POST /api/marketing/campaigns/:id/send
 * @desc    Send a campaign immediately
 * @access  Private/Admin/Manager
 *
 * @param   {string} id - Campaign ID
 */
router.post('/campaigns/:id/send', authorize('admin', 'manager'), sendCampaign);

/**
 * @route   POST /api/marketing/campaigns/:id/pause
 * @desc    Pause a campaign
 * @access  Private/Admin/Manager
 *
 * @param   {string} id - Campaign ID
 * @body    {string} [reason] - Reason for pausing
 */
router.post('/campaigns/:id/pause', authorize('admin', 'manager'), pauseCampaign);

/**
 * @route   POST /api/marketing/campaigns/:id/resume
 * @desc    Resume a paused campaign
 * @access  Private/Admin/Manager
 *
 * @param   {string} id - Campaign ID
 */
router.post('/campaigns/:id/resume', authorize('admin', 'manager'), resumeCampaign);

/**
 * @route   POST /api/marketing/campaigns/:id/cancel
 * @desc    Cancel a campaign
 * @access  Private/Admin/Manager
 *
 * @param   {string} id - Campaign ID
 * @body    {string} [reason] - Reason for cancellation
 */
router.post('/campaigns/:id/cancel', authorize('admin', 'manager'), cancelCampaign);

// ============================================================================
// APPROVAL ROUTES (Admin Only for Actions)
// ============================================================================

/**
 * @route   POST /api/marketing/campaigns/:id/approve
 * @desc    Approve a campaign
 * @access  Private/Admin
 *
 * @param   {string} id - Campaign ID
 */
router.post('/campaigns/:id/approve', authorize('admin'), approveCampaign);

/**
 * @route   POST /api/marketing/campaigns/:id/reject
 * @desc    Reject a campaign
 * @access  Private/Admin
 *
 * @param   {string} id - Campaign ID
 * @body    {string} reason - Rejection reason (required)
 */
router.post('/campaigns/:id/reject', authorize('admin'), rejectCampaign);

// ============================================================================
// AUDIENCE ROUTES (Admin/Manager)
// ============================================================================

/**
 * @route   POST /api/marketing/campaigns/:id/audience-preview
 * @desc    Preview/estimate audience size for a campaign
 * @access  Private/Admin/Manager
 *
 * @param   {string} id - Campaign ID
 */
router.post('/campaigns/:id/audience-preview', authorize('admin', 'manager'), previewAudience);

// ============================================================================
// A/B TESTING ROUTES (Admin/Manager)
// ============================================================================

/**
 * @route   POST /api/marketing/campaigns/:id/ab-test
 * @desc    Configure A/B test for a campaign
 * @access  Private/Admin/Manager
 *
 * @param   {string} id - Campaign ID
 * @body    {boolean} [enabled=true] - Whether A/B testing is enabled
 * @body    {string} testType - What to test (subject, content, sender, sendTime, template)
 * @body    {Array} variants - Test variants configuration
 * @body    {number} [testSize=20] - Percentage of audience for testing
 * @body    {string} [winnerCriteria=openRate] - How to determine winner
 * @body    {number} [minSampleSize=100] - Minimum sample size per variant
 * @body    {boolean} [autoSelectWinner=false] - Auto-select winner after test
 * @body    {number} [testDurationHours=24] - Hours to run test
 */
router.post('/campaigns/:id/ab-test', authorize('admin', 'manager'), configureAbTest);

/**
 * @route   GET /api/marketing/campaigns/:id/ab-test/results
 * @desc    Get A/B test results
 * @access  Private/Admin/Manager
 *
 * @param   {string} id - Campaign ID
 */
router.get('/campaigns/:id/ab-test/results', authorize('admin', 'manager'), getAbTestResults);

/**
 * @route   POST /api/marketing/campaigns/:id/ab-test/select-winner
 * @desc    Select A/B test winner
 * @access  Private/Admin/Manager
 *
 * @param   {string} id - Campaign ID
 * @body    {string} variantId - Winner variant ID (required)
 * @body    {number} [confidenceLevel=95] - Statistical confidence level
 */
router.post('/campaigns/:id/ab-test/select-winner', authorize('admin', 'manager'), selectAbTestWinner);

// ============================================================================
// ANALYTICS ROUTES (Admin/Manager)
// ============================================================================

/**
 * @route   GET /api/marketing/campaigns/:id/analytics
 * @desc    Get campaign analytics
 * @access  Private/Admin/Manager
 *
 * @param   {string} id - Campaign ID
 */
router.get('/campaigns/:id/analytics', authorize('admin', 'manager'), getCampaignAnalytics);

// ============================================================================
// EXPORT
// ============================================================================

export default router;
