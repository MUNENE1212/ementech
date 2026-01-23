import express from 'express';
import {
  // Account management
  getAccounts,
  getAccountById,
  connectAccount,
  handleOAuthCallback,
  createAccount,
  updateAccount,
  deleteAccount,
  refreshAccountTokens,
  syncAccountStats,
  getAccountsNeedingReauth,

  // Post management
  getPosts,
  getPostById,
  createPost,
  updatePost,
  deletePostEndpoint as deletePost,
  publishPostNow as publishPost,
  schedulePost,
  unschedulePost,
  duplicatePost,

  // Analytics
  getPostAnalyticsEndpoint as getPostAnalytics,
  getSocialAnalytics,
  refreshAnalytics,

  // Approval
  approvePost,
  rejectPost,
  getPendingApprovalPosts,

  // Bulk operations
  bulkPublishScheduled,
  bulkDeletePosts,

  // Media
  uploadMediaEndpoint as uploadMedia,
} from '../controllers/socialController.js';
import { protect, authorize } from '../middleware/auth.js';

/**
 * Social Routes - Phase 6: Social Media Integration
 *
 * RESTful routes for social media management:
 * - Social account CRUD and OAuth
 * - Post CRUD operations
 * - Post scheduling and publishing
 * - Analytics retrieval
 * - Approval workflow
 * - Bulk operations
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
// OAUTH CALLBACK (PUBLIC)
// ============================================================================

/**
 * @route   POST /api/social/accounts/callback
 * @desc    Handle OAuth callback from social platforms
 * @access  Public (with state validation)
 */
router.post('/accounts/callback', handleOAuthCallback);

// ============================================================================
// ANALYTICS (Admin/Manager)
// ============================================================================

/**
 * @route   GET /api/social/analytics
 * @desc    Get aggregate social media analytics
 * @access  Private/Admin/Manager
 */
router.get('/analytics', authorize('admin', 'manager'), getSocialAnalytics);

/**
 * @route   POST /api/social/analytics/refresh
 * @desc    Refresh analytics from platforms
 * @access  Private/Admin
 */
router.post('/analytics/refresh', authorize('admin'), refreshAnalytics);

// ============================================================================
// ACCOUNT NEEDING REAUTH (Admin)
// ============================================================================

/**
 * @route   GET /api/social/accounts/needs-reauth
 * @desc    Get accounts needing re-authentication
 * @access  Private/Admin
 */
router.get('/accounts/needs-reauth', authorize('admin'), getAccountsNeedingReauth);

// ============================================================================
// ACCOUNT CONNECTION (Admin/Manager)
// ============================================================================

/**
 * @route   POST /api/social/accounts/connect
 * @desc    Initiate OAuth flow for account connection
 * @access  Private/Admin/Manager
 */
router.post('/accounts/connect', authorize('admin', 'manager'), connectAccount);

/**
 * @route   POST /api/social/accounts
 * @desc    Manually create/add a social account with tokens
 * @access  Private/Admin
 */
router.post('/accounts', authorize('admin'), createAccount);

// ============================================================================
// ACCOUNT CRUD (Admin/Manager)
// ============================================================================

/**
 * @route   GET /api/social/accounts
 * @desc    Get all social accounts
 * @access  Private/Admin/Manager
 *
 * @query   {string} [platform] - Filter by platform
 * @query   {string} [status] - Filter by status
 */
router.get('/accounts', authorize('admin', 'manager'), getAccounts);

/**
 * @route   GET /api/social/accounts/:id
 * @desc    Get a single social account by ID
 * @access  Private/Admin/Manager
 *
 * @param   {string} id - Account ID
 */
router.get('/accounts/:id', authorize('admin', 'manager'), getAccountById);

/**
 * @route   PUT /api/social/accounts/:id
 * @desc    Update a social account
 * @access  Private/Admin
 *
 * @param   {string} id - Account ID
 */
router.put('/accounts/:id', authorize('admin'), updateAccount);

/**
 * @route   DELETE /api/social/accounts/:id
 * @desc    Disconnect/remove a social account
 * @access  Private/Admin
 *
 * @param   {string} id - Account ID
 */
router.delete('/accounts/:id', authorize('admin'), deleteAccount);

// ============================================================================
// ACCOUNT ACTIONS (Admin)
// ============================================================================

/**
 * @route   POST /api/social/accounts/:id/refresh
 * @desc    Refresh OAuth tokens for an account
 * @access  Private/Admin
 *
 * @param   {string} id - Account ID
 */
router.post('/accounts/:id/refresh', authorize('admin'), refreshAccountTokens);

/**
 * @route   POST /api/social/accounts/:id/sync
 * @desc    Sync account stats from platform
 * @access  Private/Admin/Manager
 *
 * @param   {string} id - Account ID
 */
router.post('/accounts/:id/sync', authorize('admin', 'manager'), syncAccountStats);

// ============================================================================
// PENDING APPROVAL (Admin)
// ============================================================================

/**
 * @route   GET /api/social/posts/pending-approval
 * @desc    Get posts pending approval
 * @access  Private/Admin
 */
router.get('/posts/pending-approval', authorize('admin'), getPendingApprovalPosts);

// ============================================================================
// BULK OPERATIONS (Admin)
// ============================================================================

/**
 * @route   POST /api/social/posts/bulk-publish
 * @desc    Publish all scheduled posts due now
 * @access  Private (internal/cron)
 */
router.post('/posts/bulk-publish', bulkPublishScheduled);

/**
 * @route   POST /api/social/posts/bulk-delete
 * @desc    Bulk delete posts
 * @access  Private/Admin/Manager
 *
 * @body    {string[]} postIds - Array of post IDs
 */
router.post('/posts/bulk-delete', authorize('admin', 'manager'), bulkDeletePosts);

// ============================================================================
// MEDIA UPLOAD (Admin/Manager)
// ============================================================================

/**
 * @route   POST /api/social/media/upload
 * @desc    Upload media to social platform
 * @access  Private/Admin/Manager
 *
 * @body    {string} platform - Platform name
 * @body    {string} accountId - Account ID
 * @body    {string} mediaUrl - URL of media
 * @body    {string} mediaType - Type (image, video)
 * @body    {string} [altText] - Alt text
 */
router.post('/media/upload', authorize('admin', 'manager'), uploadMedia);

// ============================================================================
// POST CRUD (Admin/Manager)
// ============================================================================

/**
 * @route   GET /api/social/posts
 * @desc    Get all social posts with filters
 * @access  Private/Admin/Manager
 *
 * @query   {string} [status] - Filter by status
 * @query   {string} [platform] - Filter by platform
 * @query   {string} [account] - Filter by account ID
 * @query   {string} [campaign] - Filter by campaign ID
 * @query   {number} [page=1] - Page number
 * @query   {number} [limit=20] - Items per page
 */
router.get('/posts', authorize('admin', 'manager'), getPosts);

/**
 * @route   POST /api/social/posts
 * @desc    Create a new social post
 * @access  Private/Admin/Manager
 *
 * @body    {string} content - Post content (required)
 * @body    {string} platform - Platform (linkedin, twitter) (required)
 * @body    {string} account - Account ID (required)
 * @body    {string} [postType] - Post type
 * @body    {Object[]} [media] - Media attachments
 * @body    {Object} [linkPreview] - Link preview
 * @body    {Object} [poll] - Poll configuration
 * @body    {string} [scheduledAt] - Schedule time
 * @body    {string} [timezone] - Timezone
 * @body    {Object} [recurring] - Recurring schedule
 * @body    {string} [campaign] - Campaign ID
 * @body    {string} [sequence] - Sequence ID
 * @body    {number} [sequenceStep] - Step number
 * @body    {boolean} [requiresApproval] - Require approval
 * @body    {string[]} [tags] - Post tags
 * @body    {string} [notes] - Internal notes
 */
router.post('/posts', authorize('admin', 'manager'), createPost);

/**
 * @route   GET /api/social/posts/:id
 * @desc    Get a single social post by ID
 * @access  Private/Admin/Manager
 *
 * @param   {string} id - Post ID
 */
router.get('/posts/:id', authorize('admin', 'manager'), getPostById);

/**
 * @route   PUT /api/social/posts/:id
 * @desc    Update a social post
 * @access  Private/Admin/Manager
 *
 * @param   {string} id - Post ID
 * @body    All createPost fields are allowed
 */
router.put('/posts/:id', authorize('admin', 'manager'), updatePost);

/**
 * @route   DELETE /api/social/posts/:id
 * @desc    Delete/archive a social post
 * @access  Private/Admin/Manager
 *
 * @param   {string} id - Post ID
 */
router.delete('/posts/:id', authorize('admin', 'manager'), deletePost);

// ============================================================================
// POST ACTIONS (Admin/Manager)
// ============================================================================

/**
 * @route   POST /api/social/posts/:id/publish
 * @desc    Publish a post immediately
 * @access  Private/Admin/Manager
 *
 * @param   {string} id - Post ID
 */
router.post('/posts/:id/publish', authorize('admin', 'manager'), publishPost);

/**
 * @route   POST /api/social/posts/:id/schedule
 * @desc    Schedule a post for later
 * @access  Private/Admin/Manager
 *
 * @param   {string} id - Post ID
 * @body    {string} scheduledAt - When to publish (required)
 * @body    {string} [timezone] - Timezone
 */
router.post('/posts/:id/schedule', authorize('admin', 'manager'), schedulePost);

/**
 * @route   POST /api/social/posts/:id/unschedule
 * @desc    Unschedule a post (return to draft)
 * @access  Private/Admin/Manager
 *
 * @param   {string} id - Post ID
 */
router.post('/posts/:id/unschedule', authorize('admin', 'manager'), unschedulePost);

/**
 * @route   POST /api/social/posts/:id/duplicate
 * @desc    Duplicate a post
 * @access  Private/Admin/Manager
 *
 * @param   {string} id - Post ID
 */
router.post('/posts/:id/duplicate', authorize('admin', 'manager'), duplicatePost);

// ============================================================================
// POST APPROVAL (Admin)
// ============================================================================

/**
 * @route   POST /api/social/posts/:id/approve
 * @desc    Approve a post
 * @access  Private/Admin
 *
 * @param   {string} id - Post ID
 */
router.post('/posts/:id/approve', authorize('admin'), approvePost);

/**
 * @route   POST /api/social/posts/:id/reject
 * @desc    Reject a post
 * @access  Private/Admin
 *
 * @param   {string} id - Post ID
 * @body    {string} reason - Rejection reason (required)
 */
router.post('/posts/:id/reject', authorize('admin'), rejectPost);

// ============================================================================
// POST ANALYTICS (Admin/Manager)
// ============================================================================

/**
 * @route   GET /api/social/posts/:id/analytics
 * @desc    Get analytics for a post
 * @access  Private/Admin/Manager
 *
 * @param   {string} id - Post ID
 */
router.get('/posts/:id/analytics', authorize('admin', 'manager'), getPostAnalytics);

// ============================================================================
// EXPORT
// ============================================================================

export default router;
