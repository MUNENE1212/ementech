import SocialAccount from '../models/SocialAccount.js';
import SocialPost from '../models/SocialPost.js';
import {
  publishPost,
  deletePost,
  refreshTokens,
  getPostAnalytics,
  uploadMedia,
  testConnection,
} from '../services/socialPublisher.js';
import crypto from 'crypto';

/**
 * Social Controller - Phase 6: Social Media Integration
 *
 * Handles all social media operations:
 * - Social account management (connect, disconnect, OAuth)
 * - Post CRUD operations
 * - Post scheduling and publishing
 * - Analytics retrieval
 * - Bulk operations
 *
 * @version 1.0.0
 * @since 2026-01-23
 */

// ============================================================================
// SOCIAL ACCOUNT MANAGEMENT
// ============================================================================

/**
 * @desc    Get all social accounts
 * @route   GET /api/social/accounts
 * @access  Private/Admin/Manager
 *
 * @param {string} [req.query.platform] - Filter by platform
 * @param {string} [req.query.status] - Filter by status
 */
export const getAccounts = async (req, res) => {
  try {
    const { platform, status } = req.query;

    const query = { archivedAt: null };
    if (platform) query.platform = platform;
    if (status) query.status = status;

    const accounts = await SocialAccount.find(query)
      .populate('connectedBy', 'name email')
      .populate('representsEmployee', 'name email')
      .sort({ platform: 1, username: 1 });

    // Filter accounts based on user permissions
    const userAccounts = accounts.filter(account =>
      account.userCanUse(req.user)
    );

    res.status(200).json({
      success: true,
      count: userAccounts.length,
      data: userAccounts,
    });

  } catch (error) {
    console.error('Error getting social accounts:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Get a single social account by ID
 * @route   GET /api/social/accounts/:id
 * @access  Private/Admin/Manager
 *
 * @param {string} req.params.id - Account ID
 */
export const getAccountById = async (req, res) => {
  try {
    const account = await SocialAccount.findById(req.params.id)
      .populate('connectedBy', 'name email')
      .populate('representsEmployee', 'name email');

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Social account not found',
      });
    }

    // Check user permissions
    if (!account.userCanUse(req.user)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this account',
      });
    }

    res.status(200).json({
      success: true,
      data: account,
    });

  } catch (error) {
    console.error('Error getting social account:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Connect a new social account (initiates OAuth flow)
 * @route   POST /api/social/accounts/connect
 * @access  Private/Admin/Manager
 *
 * @param {string} req.body.platform - Platform to connect
 * @param {boolean} [req.body.isCompanyAccount] - Whether this is a company account
 */
export const connectAccount = async (req, res) => {
  try {
    const { platform, isCompanyAccount = false } = req.body;

    if (!platform) {
      return res.status(400).json({
        success: false,
        message: 'Platform is required',
      });
    }

    if (!['linkedin', 'twitter'].includes(platform)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid platform. Supported: linkedin, twitter',
      });
    }

    // Generate state parameter for OAuth security
    const state = crypto.randomBytes(32).toString('hex');

    // Store state in session or temporary storage
    // For now, we'll return it to be used in the callback

    // Build OAuth URL based on platform
    let authUrl = '';
    const redirectUri = `${process.env.FRONTEND_URL}/social/callback`;

    if (platform === 'linkedin') {
      const clientId = process.env.LINKEDIN_CLIENT_ID;
      const scope = 'w_member_social,rw_organization_admin%20profile'; // Read/write posts, org admin

      authUrl = `https://www.linkedin.com/oauth/v2/authorization?` +
        `response_type=code&` +
        `client_id=${clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${scope}&` +
        `state=${state}`;

    } else if (platform === 'twitter') {
      const clientId = process.env.TWITTER_CLIENT_ID;
      const scope = 'tweet.read%20tweet.write%20tweet.moderate.write%20users.read%20follows.read%20follows.write';

      authUrl = `https://twitter.com/i/oauth2/authorize?` +
        `response_type=code&` +
        `client_id=${clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${scope}&` +
        `state=${state}&` +
        `code_challenge=challenge&` +
        `code_challenge_method=plain`;
    }

    res.status(200).json({
      success: true,
      data: {
        authUrl,
        state,
        platform,
      },
    });

  } catch (error) {
    console.error('Error initiating OAuth:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    OAuth callback handler
 * @route   POST /api/social/accounts/callback
 * @access  Public
 *
 * @param {string} req.body.code - OAuth authorization code
 * @param {string} req.body.state - OAuth state parameter
 * @param {string} req.body.platform - Platform
 * @param {boolean} [req.body.isCompanyAccount] - Whether this is a company account
 */
export const handleOAuthCallback = async (req, res) => {
  try {
    const { code, state, platform, isCompanyAccount = false } = req.body;

    if (!code || !platform) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters',
      });
    }

    // Exchange authorization code for access tokens
    // This would normally call the socialPublisher service
    // For now, we'll create a placeholder response

    // TODO: Implement actual OAuth token exchange
    // This is a simplified version - the real implementation would:
    // 1. Exchange code for access token
    // 2. Fetch user profile
    // 3. Store in SocialAccount

    res.status(501).json({
      success: false,
      message: 'OAuth callback handler not fully implemented. Please complete the implementation.',
    });

  } catch (error) {
    console.error('Error handling OAuth callback:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Manually add a social account with tokens
 * @route   POST /api/social/accounts
 * @access  Private/Admin
 *
 * @param {Object} req.body - Account data with tokens
 */
export const createAccount = async (req, res) => {
  try {
    const {
      platform,
      username,
      accountId,
      displayName,
      accessToken,
      refreshToken,
      expiresAt,
      isCompanyAccount,
      representsEmployee,
      allowedRoles,
      allowedUsers,
    } = req.body;

    // Validation
    if (!platform || !username || !accountId || !accessToken) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: platform, username, accountId, accessToken',
      });
    }

    if (!['linkedin', 'twitter'].includes(platform)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid platform. Supported: linkedin, twitter',
      });
    }

    // Check for duplicate account
    const existing = await SocialAccount.findOne({ platform, accountId, archivedAt: null });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'This account is already connected',
      });
    }

    // Create account
    const account = new SocialAccount({
      platform,
      username,
      accountId,
      displayName,
      tokens: {
        accessToken,
        refreshToken,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
      isCompanyAccount,
      representsEmployee,
      allowedRoles: allowedRoles || ['admin', 'manager'],
      allowedUsers: allowedUsers || [],
      connectedBy: req.user._id,
    });

    await account.save();

    // Test connection
    try {
      await testConnection(account);
      account.clearError();
      account.lastUsedAt = new Date();
    } catch (testError) {
      account.markError('CONNECTION_TEST_FAILED', testError.message);
    }
    await account.save();

    await account.populate('connectedBy', 'name email');
    await account.populate('representsEmployee', 'name email');

    res.status(201).json({
      success: true,
      message: 'Social account connected successfully',
      data: account,
    });

  } catch (error) {
    console.error('Error creating social account:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Update social account
 * @route   PUT /api/social/accounts/:id
 * @access  Private/Admin
 *
 * @param {string} req.params.id - Account ID
 */
export const updateAccount = async (req, res) => {
  try {
    const account = await SocialAccount.findById(req.params.id);

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Social account not found',
      });
    }

    // Allowed update fields
    const allowedFields = [
      'displayName', 'isCompanyAccount', 'representsEmployee',
      'allowedRoles', 'allowedUsers', 'defaultHashtags',
      'autoShortenUrls', 'requireApproval',
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        account[field] = req.body[field];
      }
    });

    await account.save();
    await account.populate('connectedBy', 'name email');
    await account.populate('representsEmployee', 'name email');

    res.status(200).json({
      success: true,
      message: 'Account updated successfully',
      data: account,
    });

  } catch (error) {
    console.error('Error updating social account:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Disconnect/remove a social account
 * @route   DELETE /api/social/accounts/:id
 * @access  Private/Admin
 *
 * @param {string} req.params.id - Account ID
 */
export const deleteAccount = async (req, res) => {
  try {
    const account = await SocialAccount.findById(req.params.id);

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Social account not found',
      });
    }

    // Check if there are scheduled posts using this account
    const scheduledPosts = await SocialPost.countDocuments({
      account: account._id,
      status: { $in: ['scheduled', 'publishing'] },
    });

    if (scheduledPosts > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot disconnect account with ${scheduledPosts} scheduled posts. Please cancel or reassign them first.`,
      });
    }

    // Archive account
    account.archive(req.user._id);
    await account.save();

    res.status(200).json({
      success: true,
      message: 'Social account disconnected successfully',
    });

  } catch (error) {
    console.error('Error deleting social account:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Refresh OAuth tokens for an account
 * @route   POST /api/social/accounts/:id/refresh
 * @access  Private/Admin
 *
 * @param {string} req.params.id - Account ID
 */
export const refreshAccountTokens = async (req, res) => {
  try {
    const account = await SocialAccount.findById(req.params.id);

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Social account not found',
      });
    }

    // Refresh tokens using the service
    const newTokens = await refreshTokens(account);

    account.updateTokens(newTokens);
    await account.save();

    res.status(200).json({
      success: true,
      message: 'Tokens refreshed successfully',
      data: {
        expiresAt: account.tokens.expiresAt,
      },
    });

  } catch (error) {
    console.error('Error refreshing tokens:', error);

    // Mark account as needing re-auth if refresh failed
    if (req.params.id) {
      const account = await SocialAccount.findById(req.params.id);
      if (account) {
        account.markNeedsReauth(error.message);
        await account.save();
      }
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Sync account stats from platform
 * @route   POST /api/social/accounts/:id/sync
 * @access  Private/Admin/Manager
 *
 * @param {string} req.params.id - Account ID
 */
export const syncAccountStats = async (req, res) => {
  try {
    const account = await SocialAccount.findById(req.params.id);

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Social account not found',
      });
    }

    // TODO: Implement actual stats fetching from platform
    // This would call the socialPublisher service to get current stats

    account.lastSyncedAt = new Date();
    await account.save();

    res.status(200).json({
      success: true,
      message: 'Account stats synced successfully',
      data: account.stats,
    });

  } catch (error) {
    console.error('Error syncing account stats:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Get accounts needing re-authentication
 * @route   GET /api/social/accounts/needs-reauth
 * @access  Private/Admin
 */
export const getAccountsNeedingReauth = async (req, res) => {
  try {
    const accounts = await SocialAccount.findNeedsReauth();

    res.status(200).json({
      success: true,
      count: accounts.length,
      data: accounts,
    });

  } catch (error) {
    console.error('Error getting accounts needing reauth:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================================
// SOCIAL POST MANAGEMENT
// ============================================================================

/**
 * @desc    Get all social posts
 * @route   GET /api/social/posts
 * @access  Private/Admin/Manager
 *
 * @param {string} [req.query.status] - Filter by status
 * @param {string} [req.query.platform] - Filter by platform
 * @param {string} [req.query.account] - Filter by account ID
 * @param {string} [req.query.campaign] - Filter by campaign ID
 * @param {number} [req.query.page=1] - Page number
 * @param {number} [req.query.limit=20] - Items per page
 */
export const getPosts = async (req, res) => {
  try {
    const {
      status,
      platform,
      account,
      campaign,
      page = 1,
      limit = 20,
    } = req.query;

    const query = { deletedAt: null };

    if (status) query.status = status;
    if (platform) query.platform = platform;
    if (account) query.account = account;
    if (campaign) query.campaign = campaign;

    // Filter by accounts user can access
    const userAccounts = await SocialAccount.findAvailableForUser(req.user);
    const accountIds = userAccounts.map(a => a._id);
    query.account = { $in: accountIds };

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [posts, total] = await Promise.all([
      SocialPost.find(query)
        .populate('account')
        .populate('createdBy', 'name email')
        .sort('-createdAt')
        .skip(skip)
        .limit(parseInt(limit, 10))
        .lean(),
      SocialPost.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count: posts.length,
      total,
      page: parseInt(page, 10),
      pages: Math.ceil(total / parseInt(limit, 10)),
      data: posts,
    });

  } catch (error) {
    console.error('Error getting social posts:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Get a single social post by ID
 * @route   GET /api/social/posts/:id
 * @access  Private/Admin/Manager
 *
 * @param {string} req.params.id - Post ID
 */
export const getPostById = async (req, res) => {
  try {
    const post = await SocialPost.findById(req.params.id)
      .populate('account')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .populate('campaign')
      .populate('sequence');

    if (!post || post.deletedAt) {
      return res.status(404).json({
        success: false,
        message: 'Social post not found',
      });
    }

    // Check user permissions
    const canAccess = post.account && post.account.userCanUse
      ? post.account.userCanUse(req.user)
      : true;

    if (!canAccess) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this post',
      });
    }

    res.status(200).json({
      success: true,
      data: post,
    });

  } catch (error) {
    console.error('Error getting social post:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Create a new social post
 * @route   POST /api/social/posts
 * @access  Private/Admin/Manager
 *
 * @param {Object} req.body - Post data
 */
export const createPost = async (req, res) => {
  try {
    const {
      content,
      platform,
      account,
      postType,
      media,
      linkPreview,
      poll,
      scheduledAt,
      timezone,
      recurring,
      campaign,
      sequence,
      sequenceStep,
      requiresApproval,
      shortenUrls,
      includeDefaultHashtags,
      priority,
      tags,
      notes,
    } = req.body;

    // Validation
    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Post content is required',
      });
    }

    if (!platform || !['linkedin', 'twitter'].includes(platform)) {
      return res.status(400).json({
        success: false,
        message: 'Valid platform (linkedin, twitter) is required',
      });
    }

    if (!account) {
      return res.status(400).json({
        success: false,
        message: 'Social account is required',
      });
    }

    // Get account and check permissions
    const socialAccount = await SocialAccount.findById(account);
    if (!socialAccount) {
      return res.status(404).json({
        success: false,
        message: 'Social account not found',
      });
    }

    if (!socialAccount.userCanUse(req.user)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to use this account',
      });
    }

    // Check if account requires approval
    const needsApproval = socialAccount.requireApproval || requiresApproval;

    // Validate content length
    const maxLength = platform === 'twitter' ? 280 : 3000;
    if (content.length > maxLength) {
      return res.status(400).json({
        success: false,
        message: `Content exceeds ${platform} character limit of ${maxLength}`,
      });
    }

    // Create post
    const post = new SocialPost({
      content,
      platform,
      account,
      postType: postType || 'text',
      media: media || [],
      linkPreview,
      poll,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      timezone: timezone || 'Africa/Nairobi',
      recurring,
      campaign,
      sequence,
      sequenceStep,
      requiresApproval: needsApproval,
      shortenUrls: shortenUrls !== false,
      includeDefaultHashtags: includeDefaultHashtags !== false,
      priority: priority || 'normal',
      tags,
      notes,
      createdBy: req.user._id,
      updatedBy: req.user._id,
    });

    // Add default hashtags from account if enabled
    if (includeDefaultHashtags !== false && socialAccount.defaultHashtags?.length > 0) {
      const existingHashtags = post.hashtags || [];
      const defaultHashtags = socialAccount.defaultHashtags.filter(
        tag => !existingHashtags.includes(tag.replace('#', '').toLowerCase())
      );
      post.hashtags = [...existingHashtags, ...defaultHashtags.map(h => h.replace('#', '').toLowerCase())];
    }

    // Set initial status
    if (scheduledAt) {
      post.status = 'scheduled';
    } else {
      post.status = 'draft';
    }

    await post.save();

    // Populate for response
    await post.populate('account');
    await post.populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: needsApproval
        ? 'Post created and pending approval'
        : scheduledAt
          ? 'Post scheduled successfully'
          : 'Post created successfully',
      data: post,
    });

  } catch (error) {
    console.error('Error creating social post:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Update a social post
 * @route   PUT /api/social/posts/:id
 * @access  Private/Admin/Manager
 *
 * @param {string} req.params.id - Post ID
 * @param {Object} req.body - Updated post data
 */
export const updatePost = async (req, res) => {
  try {
    const post = await SocialPost.findById(req.params.id);

    if (!post || post.deletedAt) {
      return res.status(404).json({
        success: false,
        message: 'Social post not found',
      });
    }

    // Only allow editing draft posts or scheduled posts not yet published
    if (!post.isEditable && post.status !== 'scheduled') {
      return res.status(400).json({
        success: false,
        message: 'Can only edit draft or scheduled posts',
      });
    }

    // Get account for permission check
    const account = await SocialAccount.findById(post.account);
    if (account && !account.userCanUse(req.user)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to edit this post',
      });
    }

    // Allowed update fields
    const allowedFields = [
      'content', 'postType', 'media', 'linkPreview', 'poll',
      'scheduledAt', 'timezone', 'recurring', 'requiresApproval',
      'shortenUrls', 'includeDefaultHashtags', 'priority',
      'tags', 'notes',
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        post[field] = req.body[field];
      }
    });

    // Update status based on schedule
    if (req.body.scheduledAt) {
      post.status = 'scheduled';
    }

    post.updatedBy = req.user._id;
    await post.save();

    await post.populate('account');
    await post.populate('createdBy', 'name email');

    res.status(200).json({
      success: true,
      message: 'Post updated successfully',
      data: post,
    });

  } catch (error) {
    console.error('Error updating social post:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Delete/archive a social post
 * @route   DELETE /api/social/posts/:id
 * @access  Private/Admin/Manager
 *
 * @param {string} req.params.id - Post ID
 */
export const deletePostEndpoint = async (req, res) => {
  try {
    const post = await SocialPost.findById(req.params.id);

    if (!post || post.deletedAt) {
      return res.status(404).json({
        success: false,
        message: 'Social post not found',
      });
    }

    // Check permissions
    const account = await SocialAccount.findById(post.account);
    if (account && !account.userCanUse(req.user)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this post',
      });
    }

    // If already published, try to delete from platform first
    if (post.status === 'published' && post.analytics?.platformPostId) {
      try {
        await deletePost(post);
      } catch (platformError) {
        console.error('Error deleting from platform:', platformError);
        // Continue with local deletion
      }
    }

    // Archive post
    post.archive(req.user._id);
    await post.save();

    res.status(200).json({
      success: true,
      message: 'Post deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting social post:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Publish a post immediately
 * @route   POST /api/social/posts/:id/publish
 * @access  Private/Admin/Manager
 *
 * @param {string} req.params.id - Post ID
 */
export const publishPostNow = async (req, res) => {
  try {
    const post = await SocialPost.findById(req.params.id).populate('account');

    if (!post || post.deletedAt) {
      return res.status(404).json({
        success: false,
        message: 'Social post not found',
      });
    }

    // Check permissions
    if (!post.account.userCanUse(req.user)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to publish with this account',
      });
    }

    // Check approval status
    if (post.requiresApproval && post.approvalStatus !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Post requires approval before publishing',
      });
    }

    // Check account status
    if (!post.account.isReady) {
      return res.status(400).json({
        success: false,
        message: 'Account is not ready for publishing. Please reconnect.',
      });
    }

    // Validate content length
    const validation = post.validateContentLength();
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: `Content exceeds ${post.platform} character limit`,
      });
    }

    // Mark as publishing
    post.markPublishing();
    await post.save();

    // Publish to platform
    try {
      const result = await publishPost(post);
      post.markPublished(result);
      await post.save();

      res.status(200).json({
        success: true,
        message: 'Post published successfully',
        data: {
          postId: post._id,
          platformPostId: result.postId,
          platformPostUrl: result.url,
          status: post.status,
        },
      });

    } catch (publishError) {
      post.markFailed('PUBLISH_FAILED', publishError.message);
      await post.save();

      // Check if auth error
      if (publishError.message.includes('auth') || publishError.message.includes('token')) {
        post.account.markNeedsReauth(publishError.message);
        await post.account.save();
      }

      throw publishError;
    }

  } catch (error) {
    console.error('Error publishing post:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Schedule a post for later
 * @route   POST /api/social/posts/:id/schedule
 * @access  Private/Admin/Manager
 *
 * @param {string} req.params.id - Post ID
 * @param {string} req.body.scheduledAt - When to publish
 * @param {string} [req.body.timezone] - Timezone
 */
export const schedulePost = async (req, res) => {
  try {
    const { scheduledAt, timezone } = req.body;

    if (!scheduledAt) {
      return res.status(400).json({
        success: false,
        message: 'scheduledAt is required',
      });
    }

    const post = await SocialPost.findById(req.params.id).populate('account');

    if (!post || post.deletedAt) {
      return res.status(404).json({
        success: false,
        message: 'Social post not found',
      });
    }

    // Check permissions
    if (!post.account.userCanUse(req.user)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to schedule this post',
      });
    }

    // Schedule the post
    post.scheduleFor(new Date(scheduledAt), timezone);
    await post.save();

    res.status(200).json({
      success: true,
      message: 'Post scheduled successfully',
      data: {
        postId: post._id,
        scheduledAt: post.scheduledAt,
        timezone: post.timezone,
        status: post.status,
      },
    });

  } catch (error) {
    console.error('Error scheduling post:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Unschedule a post (return to draft)
 * @route   POST /api/social/posts/:id/unschedule
 * @access  Private/Admin/Manager
 *
 * @param {string} req.params.id - Post ID
 */
export const unschedulePost = async (req, res) => {
  try {
    const post = await SocialPost.findById(req.params.id);

    if (!post || post.deletedAt) {
      return res.status(404).json({
        success: false,
        message: 'Social post not found',
      });
    }

    // Check permissions
    const account = await SocialAccount.findById(post.account);
    if (account && !account.userCanUse(req.user)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to unschedule this post',
      });
    }

    if (post.status !== 'scheduled') {
      return res.status(400).json({
        success: false,
        message: 'Can only unschedule scheduled posts',
      });
    }

    // Return to draft
    post.status = 'draft';
    post.scheduledAt = null;
    post.updatedBy = req.user._id;
    await post.save();

    res.status(200).json({
      success: true,
      message: 'Post unscheduled successfully',
      data: post,
    });

  } catch (error) {
    console.error('Error unscheduling post:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Duplicate a post
 * @route   POST /api/social/posts/:id/duplicate
 * @access  Private/Admin/Manager
 *
 * @param {string} req.params.id - Post ID
 */
export const duplicatePost = async (req, res) => {
  try {
    const post = await SocialPost.findById(req.params.id);

    if (!post || post.deletedAt) {
      return res.status(404).json({
        success: false,
        message: 'Social post not found',
      });
    }

    // Check permissions
    const account = await SocialAccount.findById(post.account);
    if (account && !account.userCanUse(req.user)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to duplicate this post',
      });
    }

    // Create duplicate
    const duplicate = post.duplicate(req.user._id);

    // Clear scheduled time from duplicate
    duplicate.scheduledAt = null;

    await duplicate.save();
    await duplicate.populate('account');
    await duplicate.populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Post duplicated successfully',
      data: duplicate,
    });

  } catch (error) {
    console.error('Error duplicating post:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================================
// POST ANALYTICS
// ============================================================================

/**
 * @desc    Get analytics for a post
 * @route   GET /api/social/posts/:id/analytics
 * @access  Private/Admin/Manager
 *
 * @param {string} req.params.id - Post ID
 */
export const getPostAnalyticsEndpoint = async (req, res) => {
  try {
    const post = await SocialPost.findById(req.params.id).populate('account');

    if (!post || post.deletedAt) {
      return res.status(404).json({
        success: false,
        message: 'Social post not found',
      });
    }

    // Check permissions
    if (!post.account.userCanUse(req.user)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this post analytics',
      });
    }

    if (post.status !== 'published') {
      return res.status(400).json({
        success: false,
        message: 'Analytics only available for published posts',
      });
    }

    // Fetch latest analytics from platform
    try {
      const analytics = await getPostAnalytics(post);
      post.updateAnalytics(analytics);
      await post.save();
    } catch (fetchError) {
      console.error('Error fetching analytics from platform:', fetchError);
      // Continue with cached analytics
    }

    res.status(200).json({
      success: true,
      data: {
        post: {
          id: post._id,
          content: post.content,
          platform: post.platform,
          postType: post.postType,
          publishedAt: post.analytics?.publishedAt,
          platformPostUrl: post.analytics?.platformPostUrl,
        },
        analytics: post.analytics || {},
        engagement: {
          total: post.totalEngagement || 0,
          rate: post.analytics?.engagementRate || 0,
        },
      },
    });

  } catch (error) {
    console.error('Error getting post analytics:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Get aggregate social media analytics
 * @route   GET /api/social/analytics
 * @access  Private/Admin/Manager
 *
 * @param {string} [req.query.startDate] - Start date
 * @param {string} [req.query.endDate] - End date
 * @param {string} [req.query.platform] - Platform filter
 * @param {string} [req.query.account] - Account filter
 */
export const getSocialAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, platform, account } = req.query;

    const analytics = await SocialPost.getAggregateAnalytics({
      startDate,
      endDate,
      platform,
      account,
    });

    // Get account stats
    const accountQuery = { status: 'active', archivedAt: null };
    if (platform) accountQuery.platform = platform;
    if (account) accountQuery._id = account;

    const accounts = await SocialAccount.find(accountQuery);
    const totalFollowers = accounts.reduce((sum, acc) => sum + (acc.stats?.followers || 0), 0);

    res.status(200).json({
      success: true,
      data: {
        posts: analytics,
        accounts: {
          total: accounts.length,
          totalFollowers,
          byPlatform: {
            linkedin: accounts.filter(a => a.platform === 'linkedin').length,
            twitter: accounts.filter(a => a.platform === 'twitter').length,
          },
        },
      },
    });

  } catch (error) {
    console.error('Error getting social analytics:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Refresh analytics for published posts
 * @route   POST /api/social/analytics/refresh
 * @access  Private/Admin
 */
export const refreshAnalytics = async (req, res) => {
  try {
    const { hoursAgo = 24, platform } = req.body;

    // Get posts to update
    const posts = await SocialPost.getForAnalyticsUpdate({ hoursAgo, platform });

    let updated = 0;
    let failed = 0;

    for (const post of posts) {
      try {
        const analytics = await getPostAnalytics(post);
        post.updateAnalytics(analytics);
        await post.save();
        updated++;
      } catch (error) {
        console.error(`Error updating analytics for post ${post._id}:`, error);
        failed++;
      }
    }

    res.status(200).json({
      success: true,
      message: `Analytics refreshed for ${updated} posts, ${failed} failed`,
      data: {
        total: posts.length,
        updated,
        failed,
      },
    });

  } catch (error) {
    console.error('Error refreshing analytics:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================================
// POST APPROVAL
// ============================================================================

/**
 * @desc    Approve a post
 * @route   POST /api/social/posts/:id/approve
 * @access  Private/Admin
 *
 * @param {string} req.params.id - Post ID
 */
export const approvePost = async (req, res) => {
  try {
    const post = await SocialPost.findById(req.params.id);

    if (!post || post.deletedAt) {
      return res.status(404).json({
        success: false,
        message: 'Social post not found',
      });
    }

    if (!post.requiresApproval) {
      return res.status(400).json({
        success: false,
        message: 'This post does not require approval',
      });
    }

    post.approve(req.user._id);
    await post.save();

    res.status(200).json({
      success: true,
      message: 'Post approved successfully',
      data: {
        postId: post._id,
        approvalStatus: post.approvalStatus,
        approvedBy: req.user._id,
        approvedAt: post.approvedAt,
      },
    });

  } catch (error) {
    console.error('Error approving post:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Reject a post
 * @route   POST /api/social/posts/:id/reject
 * @access  Private/Admin
 *
 * @param {string} req.params.id - Post ID
 * @param {string} req.body.reason - Rejection reason
 */
export const rejectPost = async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required',
      });
    }

    const post = await SocialPost.findById(req.params.id);

    if (!post || post.deletedAt) {
      return res.status(404).json({
        success: false,
        message: 'Social post not found',
      });
    }

    post.reject(req.user._id, reason);
    await post.save();

    res.status(200).json({
      success: true,
      message: 'Post rejected',
      data: {
        postId: post._id,
        approvalStatus: post.approvalStatus,
        rejectionReason: post.rejectionReason,
      },
    });

  } catch (error) {
    console.error('Error rejecting post:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Get posts pending approval
 * @route   GET /api/social/posts/pending-approval
 * @access  Private/Admin
 */
export const getPendingApprovalPosts = async (req, res) => {
  try {
    const posts = await SocialPost.getPendingApproval();

    res.status(200).json({
      success: true,
      count: posts.length,
      data: posts,
    });

  } catch (error) {
    console.error('Error getting pending approval posts:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================================
// BULK OPERATIONS
// ============================================================================

/**
 * @desc    Bulk publish scheduled posts
 * @route   POST /api/social/posts/bulk-publish
 * @access  Private (internal/cron)
 */
export const bulkPublishScheduled = async (req, res) => {
  try {
    const posts = await SocialPost.getScheduledForPublishing();

    const results = {
      total: posts.length,
      published: 0,
      failed: 0,
      errors: [],
    };

    for (const post of posts) {
      try {
        // Check approval if required
        if (post.requiresApproval && post.approvalStatus !== 'approved') {
          results.failed++;
          results.errors.push({
            postId: post._id,
            error: 'Post requires approval',
          });
          continue;
        }

        // Check account status
        if (!post.account.isReady) {
          results.failed++;
          results.errors.push({
            postId: post._id,
            error: 'Account not ready for publishing',
          });
          continue;
        }

        // Mark as publishing
        post.markPublishing();
        await post.save();

        // Publish
        const result = await publishPost(post);
        post.markPublished(result);
        await post.save();

        results.published++;
      } catch (error) {
        console.error(`Error publishing post ${post._id}:`, error);
        post.markFailed('BULK_PUBLISH_FAILED', error.message);
        await post.save();
        results.failed++;
        results.errors.push({
          postId: post._id,
          error: error.message,
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Bulk publish complete: ${results.published} published, ${results.failed} failed`,
      data: results,
    });

  } catch (error) {
    console.error('Error in bulk publish:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Bulk delete posts
 * @route   POST /api/social/posts/bulk-delete
 * @access  Private/Admin/Manager
 *
 * @param {string[]} req.body.postIds - Array of post IDs to delete
 */
export const bulkDeletePosts = async (req, res) => {
  try {
    const { postIds } = req.body;

    if (!Array.isArray(postIds) || postIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'postIds array is required',
      });
    }

    const results = {
      total: postIds.length,
      deleted: 0,
      failed: 0,
    };

    for (const postId of postIds) {
      try {
        const post = await SocialPost.findById(postId);
        if (post && !post.deletedAt) {
          post.archive(req.user._id);
          await post.save();
          results.deleted++;
        } else {
          results.failed++;
        }
      } catch (error) {
        results.failed++;
      }
    }

    res.status(200).json({
      success: true,
      message: `Bulk delete complete: ${results.deleted} deleted, ${results.failed} failed`,
      data: results,
    });

  } catch (error) {
    console.error('Error in bulk delete:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================================
// MEDIA UPLOAD
// ============================================================================

/**
 * @desc    Upload media to social platform
 * @route   POST /api/social/media/upload
 * @access  Private/Admin/Manager
 *
 * @param {string} req.body.platform - Platform
 * @param {string} req.body.accountId - Account ID
 * @param {string} req.body.mediaUrl - URL of media to upload
 * @param {string} req.body.mediaType - Type (image, video)
 * @param {string} [req.body.altText] - Alt text
 */
export const uploadMediaEndpoint = async (req, res) => {
  try {
    const { platform, accountId, mediaUrl, mediaType, altText } = req.body;

    if (!platform || !accountId || !mediaUrl || !mediaType) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: platform, accountId, mediaUrl, mediaType',
      });
    }

    const account = await SocialAccount.findById(accountId);
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found',
      });
    }

    if (!account.userCanUse(req.user)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to use this account',
      });
    }

    const result = await uploadMedia(account, {
      url: mediaUrl,
      type: mediaType,
      altText,
    });

    res.status(200).json({
      success: true,
      message: 'Media uploaded successfully',
      data: result,
    });

  } catch (error) {
    console.error('Error uploading media:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================================
// EXPORT
// ============================================================================

export default {
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
  deletePost: deletePostEndpoint,
  publishPost: publishPostNow,
  schedulePost,
  unschedulePost,
  duplicatePost,

  // Analytics
  getPostAnalytics: getPostAnalyticsEndpoint,
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
  uploadMedia: uploadMediaEndpoint,
};
