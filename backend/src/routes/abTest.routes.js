import express from 'express';
import {
  getABTests,
  getABTestById,
  createABTest,
  updateABTest,
  deleteABTest,
  startABTest,
  pauseABTest,
  resumeABTest,
  stopABTest,
  declareWinner,
  getRecommendedWinner,
  getTestResults,
  getTestReport,
  getAggregateAnalytics,
  duplicateABTest,
  createFromCampaign,
  createFromTemplate,
  assignVariant,
} from '../controllers/abTestController.js';
import { protect, authorize } from '../middleware/auth.js';

/**
 * A/B Test Routes - Phase 5: A/B Testing & Optimization
 *
 * RESTful routes for A/B test management:
 * - A/B test CRUD operations
 * - Test lifecycle management (start, pause, resume, stop)
 * - Winner selection and declaration
 * - Test results and analytics
 * - Test duplication and creation from templates/campaigns
 * - Variant assignment for traffic allocation
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
// ANALYTICS (Admin/Manager)
// ============================================================================

/**
 * @route   GET /api/abtests/analytics
 * @desc    Get aggregate A/B test metrics
 * @access  Private/Admin/Manager
 */
router.get('/analytics', authorize('admin', 'manager'), getAggregateAnalytics);

// ============================================================================
// TEST CREATION FROM EXISTING RESOURCES (Admin/Manager)
// ============================================================================

/**
 * @route   POST /api/abtests/create-from-campaign
 * @desc    Create an A/B test from an existing campaign
 * @access  Private/Admin/Manager
 *
 * @body    {string} campaignId - Campaign ID (required)
 * @body    {Object} testConfig - Test configuration (required)
 */
router.post('/create-from-campaign', authorize('admin', 'manager'), createFromCampaign);

/**
 * @route   POST /api/abtests/create-from-template
 * @desc    Create an A/B test from an existing template
 * @access  Private/Admin/Manager
 *
 * @body    {string} templateId - Template ID (required)
 * @body    {Object} testConfig - Test configuration (required)
 */
router.post('/create-from-template', authorize('admin', 'manager'), createFromTemplate);

// ============================================================================
// A/B TEST CRUD ROUTES (Admin/Manager)
// ============================================================================

/**
 * @route   GET /api/abtests
 * @desc    Get all A/B tests with filters and pagination
 * @access  Private/Admin/Manager
 *
 * @query   {string} [status] - Filter by status
 * @query   {string} [testType] - Filter by test type
 * @query   {string} [category] - Filter by category
 * @query   {string} [search] - Search by name/description
 * @query   {number} [page=1] - Page number
 * @query   {number} [limit=20] - Items per page
 * @query   {string} [sort=-createdAt] - Sort field
 */
router.get('/', authorize('admin', 'manager'), getABTests);

/**
 * @route   POST /api/abtests
 * @desc    Create a new A/B test
 * @access  Private/Admin/Manager
 *
 * @body    {string} name - Test name (required)
 * @body    {string} [description] - Test description
 * @body    {string} testType - Type of test (required)
 * @body    {string} [category] - Test category
 * @body    {string[]} [tags] - Test tags
 * @body    {Object[]} variants - Test variants (required, min 2, max 10)
 * @body    {string} controlVariantId - Control variant ID (required)
 * @body    {string} [winnerCriteria] - Winner determination metric
 * @body    {string} [winnerDirection] - Higher or lower is better
 * @body    {number} [minImprovementThreshold] - Minimum improvement percentage
 * @body    {boolean} [autoSelectWinner] - Auto-select winner when significant
 * @body    {Object} [significance] - Statistical significance settings
 * @body    {Object} [duration] - Test duration settings
 * @body    {Object} [trafficAllocation] - Traffic allocation settings
 * @body    {string} [campaignId] - Associated campaign ID
 * @body    {string} [sequenceId] - Associated sequence ID
 * @body    {string} [templateId] - Associated template ID
 * @body    {string} [hypothesis] - Test hypothesis
 * @body    {string} [expectedOutcome] - Expected outcome
 * @body    {string} [notes] - Internal notes
 */
router.post('/', authorize('admin', 'manager'), createABTest);

/**
 * @route   GET /api/abtests/:id
 * @desc    Get a single A/B test by ID
 * @access  Private/Admin/Manager
 *
 * @param   {string} id - Test ID
 */
router.get('/:id', authorize('admin', 'manager'), getABTestById);

/**
 * @route   PUT /api/abtests/:id
 * @desc    Update an A/B test
 * @access  Private/Admin/Manager
 *
 * @param   {string} id - Test ID
 * @body    All createABTest fields are allowed
 */
router.put('/:id', authorize('admin', 'manager'), updateABTest);

/**
 * @route   DELETE /api/abtests/:id
 * @desc    Delete (archive) an A/B test
 * @access  Private/Admin
 *
 * @param   {string} id - Test ID
 */
router.delete('/:id', authorize('admin'), deleteABTest);

// ============================================================================
// TEST LIFECYCLE ACTIONS (Admin/Manager)
// ============================================================================

/**
 * @route   POST /api/abtests/:id/start
 * @desc    Start an A/B test
 * @access  Private/Admin/Manager
 *
 * @param   {string} id - Test ID
 * @body    {Date} [startAt] - Optional start time (null = immediate)
 */
router.post('/:id/start', authorize('admin', 'manager'), startABTest);

/**
 * @route   POST /api/abtests/:id/pause
 * @desc    Pause an A/B test
 * @access  Private/Admin/Manager
 *
 * @param   {string} id - Test ID
 * @body    {string} [reason] - Reason for pausing
 */
router.post('/:id/pause', authorize('admin', 'manager'), pauseABTest);

/**
 * @route   POST /api/abtests/:id/resume
 * @desc    Resume a paused A/B test
 * @access  Private/Admin/Manager
 *
 * @param   {string} id - Test ID
 */
router.post('/:id/resume', authorize('admin', 'manager'), resumeABTest);

/**
 * @route   POST /api/abtests/:id/stop
 * @desc    Stop an A/B test
 * @access  Private/Admin/Manager
 *
 * @param   {string} id - Test ID
 * @body    {string} [reason] - Reason for stopping
 * @body    {string} [outcome] - Outcome: 'completed', 'inconclusive', or 'cancelled'
 */
router.post('/:id/stop', authorize('admin', 'manager'), stopABTest);

// ============================================================================
// WINNER SELECTION (Admin/Manager)
// ============================================================================

/**
 * @route   GET /api/abtests/:id/recommended-winner
 * @desc    Get the recommended winner based on current data
 * @access  Private/Admin/Manager
 *
 * @param   {string} id - Test ID
 */
router.get('/:id/recommended-winner', authorize('admin', 'manager'), getRecommendedWinner);

/**
 * @route   POST /api/abtests/:id/declare-winner
 * @desc    Manually declare a winner for the test
 * @access  Private/Admin/Manager
 *
 * @param   {string} id - Test ID
 * @body    {string} variantId - ID of winning variant (required)
 * @body    {string} [reason] - Reason for selection
 */
router.post('/:id/declare-winner', authorize('admin', 'manager'), declareWinner);

// ============================================================================
// TEST RESULTS & ANALYTICS (Admin/Manager)
// ============================================================================

/**
 * @route   GET /api/abtests/:id/results
 * @desc    Get test results with statistics
 * @access  Private/Admin/Manager
 *
 * @param   {string} id - Test ID
 * @query   {boolean} [includeSignificance=true] - Include statistical significance
 * @query   {boolean} [includeComparison=true] - Include variant comparison
 */
router.get('/:id/results', authorize('admin', 'manager'), getTestResults);

/**
 * @route   GET /api/abtests/:id/report
 * @desc    Get full test report with analysis
 * @access  Private/Admin/Manager
 *
 * @param   {string} id - Test ID
 */
router.get('/:id/report', authorize('admin', 'manager'), getTestReport);

// ============================================================================
// TEST OPERATIONS (Admin/Manager)
// ============================================================================

/**
 * @route   POST /api/abtests/:id/duplicate
 * @desc    Duplicate an A/B test
 * @access  Private/Admin/Manager
 *
 * @param   {string} id - Test ID
 * @body    {string} [name] - Name for duplicate
 */
router.post('/:id/duplicate', authorize('admin', 'manager'), duplicateABTest);

// ============================================================================
// TRAFFIC ALLOCATION (Admin/Manager)
// ============================================================================

/**
 * @route   POST /api/abtests/:id/assign-variant
 * @desc    Get variant assignment for a recipient
 * @access  Private/Admin/Manager
 *
 * @param   {string} id - Test ID
 * @body    {string} recipientId - Unique recipient identifier (required)
 */
router.post('/:id/assign-variant', authorize('admin', 'manager'), assignVariant);

// ============================================================================
// EXPORT
// ============================================================================

export default router;
