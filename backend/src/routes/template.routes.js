import express from 'express';
import {
  getTemplates,
  getTemplateById,
  getTemplateBySlug,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  previewTemplate,
  validateVariables,
  duplicateTemplate,
  createVariant,
  getVariants,
  searchTemplates,
  getByCategory,
  getByTrigger,
  getTopPerforming,
  getAggregateMetrics,
  activateTemplate,
  pauseTemplate,
} from '../controllers/templateController.js';
import { protect, authorize } from '../middleware/auth.js';

/**
 * Template Routes - Phase 3: Email Marketing & Campaigns
 *
 * RESTful routes for email template management:
 * - Template CRUD operations
 * - Template preview/render
 * - Template duplication
 * - A/B variant management
 * - Search and analytics
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
// SEARCH & ANALYTICS (Admin/Manager)
// ============================================================================

/**
 * @route   GET /api/templates/search
 * @desc    Search templates by name, tags, or category
 * @access  Private/Admin/Manager
 *
 * @query   {string} q - Search query (required)
 * @query   {string} [status] - Filter by status
 * @query   {string} [type] - Filter by type
 * @query   {number} [limit=50] - Maximum results
 */
router.get('/search', authorize('admin', 'manager'), searchTemplates);

/**
 * @route   GET /api/templates/metrics
 * @desc    Get aggregate template metrics
 * @access  Private/Admin/Manager
 */
router.get('/metrics', authorize('admin', 'manager'), getAggregateMetrics);

/**
 * @route   GET /api/templates/top-performing
 * @desc    Get top performing templates
 * @access  Private/Admin/Manager
 *
 * @query   {string} [metric=openRate] - Metric to sort by (openRate, clickRate, conversionRate)
 * @query   {number} [limit=10] - Number of templates
 */
router.get('/top-performing', authorize('admin', 'manager'), getTopPerforming);

/**
 * @route   GET /api/templates/category/:category
 * @desc    Get active templates by category
 * @access  Private/Admin/Manager
 *
 * @param   {string} category - Template category
 */
router.get('/category/:category', authorize('admin', 'manager'), getByCategory);

/**
 * @route   GET /api/templates/trigger/:triggerType
 * @desc    Get active templates by trigger type
 * @access  Private/Admin/Manager
 *
 * @param   {string} triggerType - Trigger type (birthday, anniversary, pipeline_stage, etc.)
 * @query   {string} [pipelineStage] - Filter by pipeline stage (for pipeline_stage trigger)
 */
router.get('/trigger/:triggerType', authorize('admin', 'manager'), getByTrigger);

/**
 * @route   GET /api/templates/slug/:slug
 * @desc    Get template by slug
 * @access  Private/Admin/Manager
 *
 * @param   {string} slug - Template slug
 */
router.get('/slug/:slug', authorize('admin', 'manager'), getTemplateBySlug);

// ============================================================================
// TEMPLATE CRUD ROUTES (Admin/Manager)
// ============================================================================

/**
 * @route   GET /api/templates
 * @desc    Get all email templates with filters and pagination
 * @access  Private/Admin/Manager
 *
 * @query   {string} [status] - Filter by status (draft, active, paused, archived)
 * @query   {string} [type] - Filter by type (marketing, transactional, automated)
 * @query   {string} [category] - Filter by category
 * @query   {string} [triggerType] - Filter by trigger type
 * @query   {string} [search] - Search by name/tags
 * @query   {number} [page=1] - Page number
 * @query   {number} [limit=20] - Items per page
 * @query   {string} [sort=-createdAt] - Sort field
 * @query   {string} [includeVariants=false] - Include A/B variants
 */
router.get('/', authorize('admin', 'manager'), getTemplates);

/**
 * @route   POST /api/templates
 * @desc    Create a new email template
 * @access  Private/Admin/Manager
 *
 * @body    {string} name - Template name (required)
 * @body    {string} subject - Email subject (required)
 * @body    {string} htmlBody - HTML body (required)
 * @body    {string} plainTextBody - Plain text body (required)
 * @body    {string} [category=custom] - Template category
 * @body    {string} [type=marketing] - Template type
 * @body    {string} [preheader] - Preheader text
 * @body    {Array} [variables] - Variable definitions
 * @body    {string} [triggerType=none] - Trigger type for automation
 * @body    {Object} [triggerConfig] - Trigger configuration
 * @body    {Object} [design] - Design configuration
 * @body    {string[]} [tags] - Template tags
 * @body    {string} [notes] - Internal notes
 */
router.post('/', authorize('admin', 'manager'), createTemplate);

/**
 * @route   GET /api/templates/:id
 * @desc    Get a single template by ID
 * @access  Private/Admin/Manager
 *
 * @param   {string} id - Template ID
 */
router.get('/:id', authorize('admin', 'manager'), getTemplateById);

/**
 * @route   PUT /api/templates/:id
 * @desc    Update a template
 * @access  Private/Admin/Manager
 *
 * @param   {string} id - Template ID
 * @body    All createTemplate fields are allowed
 */
router.put('/:id', authorize('admin', 'manager'), updateTemplate);

/**
 * @route   DELETE /api/templates/:id
 * @desc    Delete (archive) a template
 * @access  Private/Admin
 *
 * @param   {string} id - Template ID
 */
router.delete('/:id', authorize('admin'), deleteTemplate);

// ============================================================================
// TEMPLATE PREVIEW & VALIDATION (Admin/Manager)
// ============================================================================

/**
 * @route   POST /api/templates/:id/preview
 * @desc    Preview/render a template with sample data
 * @access  Private/Admin/Manager
 *
 * @param   {string} id - Template ID
 * @body    {Object} [variables] - Variable values for rendering
 * @body    {string} [format=html] - Output format (html or text)
 */
router.post('/:id/preview', authorize('admin', 'manager'), previewTemplate);

/**
 * @route   POST /api/templates/:id/validate-variables
 * @desc    Validate that required variables are provided
 * @access  Private/Admin/Manager
 *
 * @param   {string} id - Template ID
 * @body    {Object} variables - Variables to validate
 */
router.post('/:id/validate-variables', authorize('admin', 'manager'), validateVariables);

// ============================================================================
// TEMPLATE STATUS MANAGEMENT (Admin/Manager)
// ============================================================================

/**
 * @route   POST /api/templates/:id/activate
 * @desc    Activate a template
 * @access  Private/Admin/Manager
 *
 * @param   {string} id - Template ID
 */
router.post('/:id/activate', authorize('admin', 'manager'), activateTemplate);

/**
 * @route   POST /api/templates/:id/pause
 * @desc    Pause a template
 * @access  Private/Admin/Manager
 *
 * @param   {string} id - Template ID
 */
router.post('/:id/pause', authorize('admin', 'manager'), pauseTemplate);

// ============================================================================
// TEMPLATE DUPLICATION & VARIANTS (Admin/Manager)
// ============================================================================

/**
 * @route   POST /api/templates/:id/duplicate
 * @desc    Duplicate a template
 * @access  Private/Admin/Manager
 *
 * @param   {string} id - Template ID
 * @body    {string} [name] - Name for duplicate
 */
router.post('/:id/duplicate', authorize('admin', 'manager'), duplicateTemplate);

/**
 * @route   GET /api/templates/:id/variants
 * @desc    Get A/B test variants for a template
 * @access  Private/Admin/Manager
 *
 * @param   {string} id - Parent template ID
 */
router.get('/:id/variants', authorize('admin', 'manager'), getVariants);

/**
 * @route   POST /api/templates/:id/variant
 * @desc    Create an A/B test variant
 * @access  Private/Admin/Manager
 *
 * @param   {string} id - Parent template ID
 * @body    {string} variantId - Variant identifier (B, C, D, E)
 * @body    {Object} [changes] - Fields to change in variant
 */
router.post('/:id/variant', authorize('admin', 'manager'), createVariant);

// ============================================================================
// EXPORT
// ============================================================================

export default router;
