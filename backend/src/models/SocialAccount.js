import mongoose from 'mongoose';

/**
 * Social Account Model - Phase 6: Social Media Integration
 *
 * This model manages connected social media accounts for:
 * - LinkedIn API integration (OAuth 2.0)
 * - Twitter/X API integration (OAuth 2.0)
 * - OAuth token storage with refresh handling
 * - Rate limiting tracking per account
 * - Webhook configuration for real-time engagement updates
 * - Account status management
 *
 * @version 1.0.0
 * @since 2026-01-23
 */

// ============================================================================
// SUB-SCHEMAS
// ============================================================================

/**
 * OAuth Token Sub-Schema
 * Stores encrypted access and refresh tokens
 */
const oauthTokenSchema = new mongoose.Schema({
  /** Encrypted access token for API requests */
  accessToken: {
    type: String,
    required: true,
  },
  /** Encrypted refresh token (if supported by platform) */
  refreshToken: {
    type: String,
  },
  /** Token type (typically "Bearer") */
  tokenType: {
    type: String,
    default: 'Bearer',
  },
  /** When the access token expires */
  expiresAt: {
    type: Date,
  },
  /** Token scope granted by user */
  scope: [{
    type: String,
  }],
  /** Timestamp when token was obtained */
  obtainedAt: {
    type: Date,
    default: Date.now,
  },
}, { _id: false });

/**
 * Rate Limit Sub-Schema
 * Tracks API rate limit status per account
 */
const rateLimitSchema = new mongoose.Schema({
  /** API calls remaining in current window */
  remaining: {
    type: Number,
    default: 100,
  },
  /** When the rate limit window resets */
  resetAt: {
    type: Date,
  },
  /** Maximum calls allowed per window */
  limit: {
    type: Number,
    default: 100,
  },
  /** Total API calls made (lifetime) */
  totalCalls: {
    type: Number,
    default: 0,
  },
  /** Last API call timestamp */
  lastCallAt: {
    type: Date,
  },
}, { _id: false });

/**
 * Webhook Configuration Sub-Schema
 * Manages webhook subscriptions for engagement updates
 */
const webhookConfigSchema = new mongoose.Schema({
  /** Whether webhook is enabled for this account */
  enabled: {
    type: Boolean,
    default: false,
  },
  /** Webhook ID from platform */
  webhookId: {
    type: String,
  },
  /** Webhook URL endpoint */
  webhookUrl: {
    type: String,
  },
  /** Events subscribed to (e.g., 'likes', 'comments', 'shares') */
  events: [{
    type: String,
  }],
  /** Webhook secret for signature verification */
  secret: {
    type: String,
  },
  /** When webhook was last verified */
  lastVerifiedAt: {
    type: Date,
  },
  /** Last error from webhook delivery */
  lastError: {
    message: String,
    at: Date,
  },
}, { _id: false });

/**
 * Account Statistics Sub-Schema
 * Cached account metrics
 */
const accountStatsSchema = new mongoose.Schema({
  /** Number of followers */
  followers: {
    type: Number,
    default: 0,
  },
  /** Number of following */
  following: {
    type: Number,
    default: 0,
  },
  /** Number of posts */
  posts: {
    type: Number,
    default: 0,
  },
  /** Profile URL */
  profileUrl: {
    type: String,
  },
  /** Profile image URL */
  profileImageUrl: {
    type: String,
  },
  /** Account bio/description */
  bio: {
    type: String,
  },
  /** When stats were last updated */
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
}, { _id: false });

// ============================================================================
// MAIN SOCIAL ACCOUNT SCHEMA
// ============================================================================

const socialAccountSchema = new mongoose.Schema({
  // -------------------------------------------------------------------------
  // ACCOUNT IDENTIFICATION
  // -------------------------------------------------------------------------

  /** Platform identifier */
  platform: {
    type: String,
    required: [true, 'Platform is required'],
    enum: ['linkedin', 'twitter'],
    index: true,
  },

  /** Username/handle on the platform */
  username: {
    type: String,
    required: [true, 'Username is required'],
    trim: true,
  },

  /** Platform-specific account ID */
  accountId: {
    type: String,
    required: [true, 'Account ID is required'],
    index: true,
  },

  /** Display name (may differ from username) */
  displayName: {
    type: String,
    trim: true,
  },

  // -------------------------------------------------------------------------
  // OAUTH TOKENS
  // -------------------------------------------------------------------------

  /** OAuth credentials */
  tokens: {
    type: oauthTokenSchema,
    required: [true, 'OAuth tokens are required'],
  },

  // -------------------------------------------------------------------------
  // ACCOUNT STATUS
  // -------------------------------------------------------------------------

  /** Connection status */
  status: {
    type: String,
    enum: ['active', 'inactive', 'error', 'needs_reauth'],
    default: 'active',
    index: true,
  },

  /** Status message (especially for error state) */
  statusMessage: {
    type: String,
  },

  /** Last error that occurred */
  lastError: {
    code: String,
    message: String,
    at: Date,
  },

  /** Number of consecutive failures */
  failureCount: {
    type: Number,
    default: 0,
  },

  // -------------------------------------------------------------------------
  // RATE LIMITING
  // -------------------------------------------------------------------------

  /** API rate limit tracking */
  rateLimit: {
    type: rateLimitSchema,
    default: () => ({}),
  },

  // -------------------------------------------------------------------------
  // WEBHOOK CONFIGURATION
  // -------------------------------------------------------------------------

  /** Webhook settings */
  webhooks: {
    type: webhookConfigSchema,
    default: () => ({}),
  },

  // -------------------------------------------------------------------------
  // ACCOUNT STATISTICS
  // -------------------------------------------------------------------------

  /** Cached account metrics */
  stats: {
    type: accountStatsSchema,
    default: () => ({}),
  },

  // -------------------------------------------------------------------------
  // EMPLOYEE ASSOCIATION
  // -------------------------------------------------------------------------

  /** Employee who connected this account */
  connectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },

  /** Employee this account represents (for posting as) */
  representsEmployee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },

  /** Whether this is the company account (vs personal) */
  isCompanyAccount: {
    type: Boolean,
    default: false,
  },

  // -------------------------------------------------------------------------
  // PERMISSIONS
  // -------------------------------------------------------------------------

  /** Roles that can use this account for posting */
  allowedRoles: [{
    type: String,
    enum: ['admin', 'manager', 'employee'],
    default: ['admin', 'manager'],
  }],

  /** Specific employees allowed to use this account */
  allowedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],

  // -------------------------------------------------------------------------
  // PREFERENCES
  // -------------------------------------------------------------------------

  /** Default hashtags to append to posts */
  defaultHashtags: [{
    type: String,
    trim: true,
  }],

  /** Automatically shorten URLs */
  autoShortenUrls: {
    type: Boolean,
    default: true,
  },

  /** Require approval before publishing */
  requireApproval: {
    type: Boolean,
    default: false,
  },

  // -------------------------------------------------------------------------
  // AUDIT FIELDS
  // -------------------------------------------------------------------------

  /** Connection timestamp */
  connectedAt: {
    type: Date,
    default: Date.now,
  },

  /** Last successful API call */
  lastUsedAt: {
    type: Date,
  },

  /** When account was last synced */
  lastSyncedAt: {
    type: Date,
  },

  /** Reconnection attempts count */
  reconnectAttempts: {
    type: Number,
    default: 0,
  },

  /** Timestamp of archived/disconnected account */
  archivedAt: {
    type: Date,
  },

  /** Who archived this account */
  archivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
});

// ============================================================================
// INDEXES
// ============================================================================

// Compound index for unique accounts per platform
socialAccountSchema.index({ platform: 1, accountId: 1 }, { unique: true });

// Compound index for active accounts by employee
socialAccountSchema.index({ connectedBy: 1, status: 1, platform: 1 });

// Index for rate limit queries
socialAccountSchema.index({ platform: 1, 'rateLimit.resetAt': 1 });

// Index for accounts needing re-authentication
socialAccountSchema.index({ status: 1, 'tokens.expiresAt': 1 });

// ============================================================================
// VIRTUAL PROPERTIES
// ============================================================================

/**
 * Check if token is expired or about to expire
 */
socialAccountSchema.virtual('isTokenExpired').get(function() {
  if (!this.tokens.expiresAt) return false;
  // Consider expired if within 5 minutes
  const expiryBuffer = 5 * 60 * 1000;
  return new Date(this.tokens.expiresAt).getTime() < Date.now() + expiryBuffer;
});

/**
 * Check if account is ready for posting
 */
socialAccountSchema.virtual('isReady').get(function() {
  return this.status === 'active' && !this.isTokenExpired;
});

/**
 * Get rate limit percentage used
 */
socialAccountSchema.virtual('rateLimitUsedPercent').get(function() {
  if (!this.rateLimit || this.rateLimit.limit === 0) return 0;
  return Math.round(((this.rateLimit.limit - this.rateLimit.remaining) / this.rateLimit.limit) * 100);
});

// Ensure virtuals are included in JSON output
socialAccountSchema.set('toJSON', { virtuals: true });
socialAccountSchema.set('toObject', { virtuals: true });

// ============================================================================
// INSTANCE METHODS
// ============================================================================

/**
 * Update OAuth tokens
 *
 * @param {Object} tokenData - New token data
 * @returns {this} Updated account
 *
 * @example
 * account.updateTokens({ accessToken: 'new-token', expiresAt: new Date() });
 * await account.save();
 */
socialAccountSchema.methods.updateTokens = function(tokenData) {
  if (tokenData.accessToken) {
    this.tokens.accessToken = tokenData.accessToken;
  }
  if (tokenData.refreshToken) {
    this.tokens.refreshToken = tokenData.refreshToken;
  }
  if (tokenData.expiresAt) {
    this.tokens.expiresAt = tokenData.expiresAt;
  }
  if (tokenData.scope) {
    this.tokens.scope = tokenData.scope;
  }
  this.tokens.obtainedAt = new Date();

  // Reset status to active if it was needs_reauth
  if (this.status === 'needs_reauth') {
    this.status = 'active';
    this.statusMessage = null;
  }

  return this;
};

/**
 * Record an API call (update rate limiting)
 *
 * @param {number} [remaining] - Remaining calls from API response
 * @param {number} [limit] - Total limit from API response
 * @returns {this} Updated account
 */
socialAccountSchema.methods.recordApiCall = function(remaining, limit) {
  this.rateLimit.totalCalls = (this.rateLimit.totalCalls || 0) + 1;
  this.rateLimit.lastCallAt = new Date();

  if (remaining !== undefined) {
    this.rateLimit.remaining = remaining;
  }
  if (limit !== undefined) {
    this.rateLimit.limit = limit;
  }

  this.lastUsedAt = new Date();

  return this;
};

/**
 * Check if account can make API calls (rate limit check)
 *
 * @returns {boolean} True if calls can be made
 */
socialAccountSchema.methods.canMakeApiCall = function() {
  if (!this.rateLimit || !this.rateLimit.resetAt) return true;

  // Check if window has expired
  if (new Date(this.rateLimit.resetAt) < new Date()) {
    return true;
  }

  return (this.rateLimit.remaining || 0) > 0;
};

/**
 * Mark account as needing re-authentication
 *
 * @param {string} [reason] - Reason for re-auth
 * @returns {this} Updated account
 */
socialAccountSchema.methods.markNeedsReauth = function(reason) {
  this.status = 'needs_reauth';
  this.statusMessage = reason || 'Authentication expired. Please reconnect.';
  this.failureCount = (this.failureCount || 0) + 1;
  this.lastError = {
    code: 'AUTH_EXPIRED',
    message: reason || 'Authentication expired',
    at: new Date(),
  };
  return this;
};

/**
 * Mark account as having an error
 *
 * @param {string} code - Error code
 * @param {string} message - Error message
 * @returns {this} Updated account
 */
socialAccountSchema.methods.markError = function(code, message) {
  this.status = 'error';
  this.statusMessage = message;
  this.lastError = {
    code,
    message,
    at: new Date(),
  };
  this.failureCount = (this.failureCount || 0) + 1;

  // Mark as needs_reauth if auth error
  if (code === '401' || code === '403' || code === 'AUTH_EXPIRED' || code === 'AUTH_FAILED') {
    this.status = 'needs_reauth';
  }

  return this;
};

/**
 * Clear error and mark as active
 *
 * @returns {this} Updated account
 */
socialAccountSchema.methods.clearError = function() {
  this.status = 'active';
  this.statusMessage = null;
  this.failureCount = 0;
  return this;
};

/**
 * Check if a user has permission to use this account
 *
 * @param {Object} user - User object with role and _id
 * @returns {boolean} True if user can use this account
 */
socialAccountSchema.methods.userCanUse = function(user) {
  // Admin can always use
  if (user.role === 'admin') return true;

  // Check role permissions
  if (this.allowedRoles && this.allowedRoles.includes(user.role)) {
    return true;
  }

  // Check specific user permissions
  if (this.allowedUsers && this.allowedUsers.some(id => id.toString() === user._id.toString())) {
    return true;
  }

  return false;
};

/**
 * Update account statistics
 *
 * @param {Object} stats - New statistics
 * @returns {this} Updated account
 */
socialAccountSchema.methods.updateStats = function(stats) {
  if (!this.stats) {
    this.stats = {};
  }

  if (stats.followers !== undefined) this.stats.followers = stats.followers;
  if (stats.following !== undefined) this.stats.following = stats.following;
  if (stats.posts !== undefined) this.stats.posts = stats.posts;
  if (stats.profileUrl) this.stats.profileUrl = stats.profileUrl;
  if (stats.profileImageUrl) this.stats.profileImageUrl = stats.profileImageUrl;
  if (stats.bio) this.stats.bio = stats.bio;

  this.stats.lastUpdated = new Date();
  this.lastSyncedAt = new Date();

  return this;
};

/**
 * Archive/disconnect the account
 *
 * @param {ObjectId} userId - ID of user disconnecting
 * @returns {this} Updated account
 */
socialAccountSchema.methods.archive = function(userId) {
  this.archivedAt = new Date();
  this.archivedBy = userId;
  this.status = 'inactive';
  return this;
};

/**
 * Restore an archived account
 *
 * @returns {this} Updated account
 */
socialAccountSchema.methods.restore = function() {
  this.archivedAt = null;
  this.archivedBy = null;
  this.status = 'active';
  return this;
};

// ============================================================================
// STATIC METHODS
// ============================================================================

/**
 * Find active accounts by platform
 *
 * @param {string} platform - Platform name
 * @returns {Promise<SocialAccount[]>}
 */
socialAccountSchema.statics.getActiveByPlatform = async function(platform) {
  return this.find({
    platform,
    status: 'active',
    archivedAt: null,
  }).populate('connectedBy', 'name email').populate('representsEmployee', 'name email');
};

/**
 * Find accounts by employee
 *
 * @param {ObjectId} userId - User ID
 * @returns {Promise<SocialAccount[]>}
 */
socialAccountSchema.statics.findByEmployee = async function(userId) {
  return this.find({
    $or: [
      { connectedBy: userId },
      { representsEmployee: userId },
    ],
    archivedAt: null,
  }).sort({ platform: 1, username: 1 });
};

/**
 * Find accounts needing re-authentication
 *
 * @returns {Promise<SocialAccount[]>}
 */
socialAccountSchema.statics.findNeedsReauth = async function() {
  return this.find({
    status: { $in: ['needs_reauth', 'error'] },
    archivedAt: null,
  }).populate('connectedBy', 'name email');
};

/**
 * Find accounts with expiring tokens
 *
 * @param {number} [minutes=60] - Minutes threshold for expiration
 * @returns {Promise<SocialAccount[]>}
 */
socialAccountSchema.statics.findExpiringTokens = async function(minutes = 60) {
  const threshold = new Date(Date.now() + minutes * 60 * 1000);

  return this.find({
    status: 'active',
    'tokens.expiresAt': { $lte: threshold },
    archivedAt: null,
  });
};

/**
 * Find company accounts by platform
 *
 * @param {string} platform - Platform name
 * @returns {Promise<SocialAccount[]>}
 */
socialAccountSchema.statics.findCompanyAccounts = async function(platform) {
  return this.find({
    platform,
    isCompanyAccount: true,
    status: 'active',
    archivedAt: null,
  });
};

/**
 * Get all active accounts (across all platforms)
 *
 * @returns {Promise<SocialAccount[]>}
 */
socialAccountSchema.statics.getAllActive = async function() {
  return this.find({
    status: 'active',
    archivedAt: null,
  })
    .populate('connectedBy', 'name email')
    .populate('representsEmployee', 'name email')
    .sort({ platform: 1, username: 1 });
};

/**
 * Find available accounts for a user
 *
 * @param {Object} user - User with role and _id
 * @returns {Promise<SocialAccount[]>}
 */
socialAccountSchema.statics.findAvailableForUser = async function(user) {
  const query = {
    status: 'active',
    archivedAt: null,
  };

  // Admins see all accounts
  if (user.role !== 'admin') {
    query.$or = [
      { allowedRoles: user.role },
      { allowedUsers: user._id },
    ];
  }

  return this.find(query)
    .populate('connectedBy', 'name email')
    .populate('representsEmployee', 'name email')
    .sort({ platform: 1 });
};

// ============================================================================
// PRE-SAVE MIDDLEWARE
// ============================================================================

socialAccountSchema.pre('save', async function(next) {
  // Reset reconnection attempts on successful connection
  if (this.status === 'active' && this.isModified('status')) {
    this.reconnectAttempts = 0;
  }

  next();
});

// ============================================================================
// MODEL EXPORT
// ============================================================================

const SocialAccount = mongoose.model('SocialAccount', socialAccountSchema);

export default SocialAccount;
