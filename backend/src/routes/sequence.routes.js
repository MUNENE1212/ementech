import express from 'express';
import {
  getSequences,
  getSequenceById,
  createSequence,
  updateSequence,
  deleteSequence,
  activateSequence,
  pauseSequence,
  resumeSequence,
  addStep,
  updateStep,
  removeStep,
  reorderSteps,
  enrollLead,
  enrollLeadsBulk,
  unsubscribeLead,
  pauseLeadSequence,
  resumeLeadSequence,
  getLeadProgress,
  getSequenceEnrollments,
  getSequenceAnalytics,
  getAggregateAnalytics,
  duplicateSequence,
  previewSequence,
} from '../controllers/sequenceController.js';
import { protect, authorize } from '../middleware/auth.js';

/**
 * Sequence Routes - Phase 4: Email Sequences & Drip Campaigns
 *
 * RESTful routes for sequence management:
 * - Sequence CRUD operations
 * - Step management
 * - Lead enrollment management
 * - Progress tracking
 * - Analytics and reporting
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
 * @route   GET /api/sequences/analytics
 * @desc    Get aggregate sequence metrics
 * @access  Private/Admin/Manager
 */
router.get('/analytics', authorize('admin', 'manager'), getAggregateAnalytics);

// ============================================================================
// SEQUENCE CRUD ROUTES (Admin/Manager)
// ============================================================================

/**
 * @route   GET /api/sequences
 * @desc    Get all sequences with filters and pagination
 * @access  Private/Admin/Manager
 *
 * @query   {string} [status] - Filter by status (draft, active, paused, archived)
 * @query   {string} [type] - Filter by type (drip, nurture, onboarding, re-engagement, etc.)
 * @query   {string} [category] - Filter by category
 * @query   {string} [search] - Search by name/description
 * @query   {number} [page=1] - Page number
 * @query   {number} [limit=20] - Items per page
 * @query   {string} [sort=-createdAt] - Sort field
 */
router.get('/', authorize('admin', 'manager'), getSequences);

/**
 * @route   POST /api/sequences
 * @desc    Create a new sequence
 * @access  Private/Admin/Manager
 *
 * @body    {string} name - Sequence name (required)
 * @body    {string} [description] - Sequence description
 * @body    {string} [type=drip] - Sequence type
 * @body    {string} [category=custom] - Sequence category
 * @body    {string[]} [tags] - Sequence tags
 * @body    {Object[]} steps - Sequence steps (required)
 * @body    {Object} [trigger] - Trigger configuration
 * @body    {Object} [enrollment] - Enrollment settings
 * @body    {Object} [unsubscribeSettings] - Unsubscribe behavior
 * @body    {string} [timezone=Africa/Nairobi] - Timezone
 * @body    {string} [preferredSendTime=09:00] - Preferred send time
 * @body    {number[]} [allowedSendDays] - Days when emails can be sent (0-6)
 * @body    {boolean} [skipWeekends=false] - Skip weekends for delays
 * @body    {boolean} [skipHolidays=false] - Skip holidays
 * @body    {string[]} [holidays] - Holiday dates (ISO format)
 * @body    {string} [goal] - Primary goal
 * @body    {number} [goalTarget] - Target value for goal
 * @body    {string} [goalDescription] - Goal description
 * @body    {string} [notes] - Internal notes
 */
router.post('/', authorize('admin', 'manager'), createSequence);

/**
 * @route   GET /api/sequences/:id
 * @desc    Get a single sequence by ID
 * @access  Private/Admin/Manager
 *
 * @param   {string} id - Sequence ID
 */
router.get('/:id', authorize('admin', 'manager'), getSequenceById);

/**
 * @route   PUT /api/sequences/:id
 * @desc    Update a sequence
 * @access  Private/Admin/Manager
 *
 * @param   {string} id - Sequence ID
 * @body    All createSequence fields are allowed
 */
router.put('/:id', authorize('admin', 'manager'), updateSequence);

/**
 * @route   DELETE /api/sequences/:id
 * @desc    Delete (archive) a sequence
 * @access  Private/Admin
 *
 * @param   {string} id - Sequence ID
 */
router.delete('/:id', authorize('admin'), deleteSequence);

// ============================================================================
// SEQUENCE STATUS ACTIONS (Admin/Manager)
// ============================================================================

/**
 * @route   POST /api/sequences/:id/activate
 * @desc    Activate a sequence
 * @access  Private/Admin/Manager
 *
 * @param   {string} id - Sequence ID
 */
router.post('/:id/activate', authorize('admin', 'manager'), activateSequence);

/**
 * @route   POST /api/sequences/:id/pause
 * @desc    Pause a sequence
 * @access  Private/Admin/Manager
 *
 * @param   {string} id - Sequence ID
 * @body    {string} [reason] - Reason for pausing
 */
router.post('/:id/pause', authorize('admin', 'manager'), pauseSequence);

/**
 * @route   POST /api/sequences/:id/resume
 * @desc    Resume a paused sequence
 * @access  Private/Admin/Manager
 *
 * @param   {string} id - Sequence ID
 */
router.post('/:id/resume', authorize('admin', 'manager'), resumeSequence);

// ============================================================================
// STEP MANAGEMENT (Admin/Manager)
// ============================================================================

/**
 * @route   POST /api/sequences/:id/steps
 * @desc    Add a step to a sequence
 * @access  Private/Admin/Manager
 *
 * @param   {string} id - Sequence ID
 * @body    {string} templateId - Email template ID (required)
 * @body    {string} [subject] - Subject line override
 * @body    {Object} [delay] - Delay configuration
 * @body    {Object[]} [conditions] - Conditions for sending
 * @body    {boolean} [skipIfConditionsNotMet=false] - Skip if conditions not met
 * @body    {boolean} [canRepeat=false] - Can repeat step
 * @body    {string} [notes] - Step notes
 */
router.post('/:id/steps', authorize('admin', 'manager'), addStep);

/**
 * @route   PUT /api/sequences/:id/steps/:stepOrder
 * @desc    Update a step in a sequence
 * @access  Private/Admin/Manager
 *
 * @param   {string} id - Sequence ID
 * @param   {number} stepOrder - Step order number
 * @body    All addStep fields are allowed
 */
router.put('/:id/steps/:stepOrder', authorize('admin', 'manager'), updateStep);

/**
 * @route   DELETE /api/sequences/:id/steps/:stepOrder
 * @desc    Remove a step from a sequence
 * @access  Private/Admin/Manager
 *
 * @param   {string} id - Sequence ID
 * @param   {number} stepOrder - Step order number
 */
router.delete('/:id/steps/:stepOrder', authorize('admin', 'manager'), removeStep);

/**
 * @route   PUT /api/sequences/:id/steps/reorder
 * @desc    Reorder steps in a sequence
 * @access  Private/Admin/Manager
 *
 * @param   {string} id - Sequence ID
 * @body    {number[]} stepOrders - Array of step orders in new sequence
 */
router.put('/:id/steps/reorder', authorize('admin', 'manager'), reorderSteps);

// ============================================================================
// ENROLLMENT MANAGEMENT (Admin/Manager)
// ============================================================================

/**
 * @route   POST /api/sequences/:id/enroll
 * @desc    Enroll a single lead in a sequence
 * @access  Private/Admin/Manager
 *
 * @param   {string} id - Sequence ID
 * @body    {string} leadId - Lead ID to enroll (required)
 * @body    {number} [startAtStep=0] - Step to start at (0-indexed)
 */
router.post('/:id/enroll', authorize('admin', 'manager'), enrollLead);

/**
 * @route   POST /api/sequences/:id/enroll-bulk
 * @desc    Bulk enroll leads in a sequence
 * @access  Private/Admin/Manager
 *
 * @param   {string} id - Sequence ID
 * @body    {string[]} leadIds - Array of Lead IDs (required, max 100)
 * @body    {number} [startAtStep=0] - Step to start at
 */
router.post('/:id/enroll-bulk', authorize('admin', 'manager'), enrollLeadsBulk);

/**
 * @route   POST /api/sequences/:id/unsubscribe
 * @desc    Unsubscribe a lead from a sequence
 * @access  Private/Admin/Manager
 *
 * @param   {string} id - Sequence ID
 * @body    {string} leadId - Lead ID to unsubscribe (required)
 * @body    {string} [reason] - Reason for unsubscribing
 */
router.post('/:id/unsubscribe', authorize('admin', 'manager'), unsubscribeLead);

/**
 * @route   POST /api/sequences/:id/pause-lead
 * @desc    Pause a sequence for a specific lead
 * @access  Private/Admin/Manager
 *
 * @param   {string} id - Sequence ID
 * @body    {string} leadId - Lead ID (required)
 */
router.post('/:id/pause-lead', authorize('admin', 'manager'), pauseLeadSequence);

/**
 * @route   POST /api/sequences/:id/resume-lead
 * @desc    Resume a sequence for a specific lead
 * @access  Private/Admin/Manager
 *
 * @param   {string} id - Sequence ID
 * @body    {string} leadId - Lead ID (required)
 */
router.post('/:id/resume-lead', authorize('admin', 'manager'), resumeLeadSequence);

// ============================================================================
// PROGRESS TRACKING (Admin/Manager)
// ============================================================================

/**
 * @route   GET /api/sequences/:id/progress/:leadId
 * @desc    Get sequence progress for a lead
 * @access  Private/Admin/Manager
 *
 * @param   {string} id - Sequence ID
 * @param   {string} leadId - Lead ID
 */
router.get('/:id/progress/:leadId', authorize('admin', 'manager'), getLeadProgress);

/**
 * @route   GET /api/sequences/:id/enrollments
 * @desc    Get all enrollments for a sequence
 * @access  Private/Admin/Manager
 *
 * @param   {string} id - Sequence ID
 * @query   {string} [status] - Filter by enrollment status
 * @query   {number} [page=1] - Page number
 * @query   {number} [limit=50] - Items per page
 */
router.get('/:id/enrollments', authorize('admin', 'manager'), getSequenceEnrollments);

// ============================================================================
// ANALYTICS (Admin/Manager)
// ============================================================================

/**
 * @route   GET /api/sequences/:id/analytics
 * @desc    Get sequence analytics
 * @access  Private/Admin/Manager
 *
 * @param   {string} id - Sequence ID
 */
router.get('/:id/analytics', authorize('admin', 'manager'), getSequenceAnalytics);

// ============================================================================
// SEQUENCE OPERATIONS (Admin/Manager)
// ============================================================================

/**
 * @route   POST /api/sequences/:id/duplicate
 * @desc    Duplicate a sequence
 * @access  Private/Admin/Manager
 *
 * @param   {string} id - Sequence ID
 * @body    {string} [name] - Name for duplicate
 */
router.post('/:id/duplicate', authorize('admin', 'manager'), duplicateSequence);

/**
 * @route   GET /api/sequences/:id/preview
 * @desc    Preview a sequence
 * @access  Private/Admin/Manager
 *
 * @param   {string} id - Sequence ID
 */
router.get('/:id/preview', authorize('admin', 'manager'), previewSequence);

// ============================================================================
// EXPORT
// ============================================================================

export default router;
