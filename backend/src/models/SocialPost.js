import mongoose from 'mongoose';

/**
 * Social Post Model - Phase 6: Social Media Integration
 *
 * This model manages social media posts for:
 * - LinkedIn and Twitter/X publishing
 * - Multiple post types (text, image, video, link, carousel, poll)
 * - Scheduled publishing with timezone support
 * - Post analytics tracking
 * - Campaign and sequence associations
 * - Post lifecycle management (draft, scheduled, published, failed, deleted)
 *
 * @version 1.0.0
 * @since 2026-01-23
 */

// ============================================================================
// SUB-SCHEMAS
// ============================================================================

/**
 * Media Attachment Sub-Schema
 * Represents attached media (images, videos, documents)
 */
const mediaAttachmentSchema = new mongoose.Schema({
  /** Media type */
  type: {
    type: String,
    enum: ['image', 'video', 'document', 'gif'],
    required: true,
  },
  /** Public URL of the media */
  url: {
    type: String,
    required: true,
  },
  /** Alt text for accessibility */
  altText: {
    type: String,
    trim: true,
    maxlength: 500,
  },
  /** Platform-specific media ID after upload */
  platformMediaId: {
    type: String,
  },
  /** Upload status */
  uploadStatus: {
    type: String,
    enum: ['pending', 'uploading', 'uploaded', 'failed'],
    default: 'pending',
  },
  /** Upload error if failed */
  uploadError: {
    message: String,
    code: String,
  },
  /** Media metadata */
  metadata: {
    width: Number,
    height: Number,
    duration: Number, // for video
    size: Number, // bytes
    mimeType: String,
  },
}, { _id: false });

/**
 * Poll Configuration Sub-Schema
 * For Twitter/X polls
 */
const pollConfigSchema = new mongoose.Schema({
  /** Poll options (2-4 options) */
  options: [{
    /** Option label */
    label: {
      type: String,
      required: true,
      trim: true,
      maxlength: 25,
    },
    /** Position index */
    position: {
      type: Number,
      required: true,
    },
  }],
  /** Duration in minutes */
  durationMinutes: {
    type: Number,
    required: true,
    min: 1,
    max: 10080, // 7 days
  },
}, { _id: false });

/**
 * Link Preview Sub-Schema
 * For link attachment metadata
 */
const linkPreviewSchema = new mongoose.Schema({
  /** URL to share */
  url: {
    type: String,
    required: true,
  },
  /** Preview title */
  title: String,
  /** Preview description */
  description: String,
  /** Preview image URL */
  imageUrl: String,
  /** Site name */
  siteName: String,
}, { _id: false });

/**
 * Recurring Schedule Sub-Schema
 * For posts that repeat
 */
const recurringScheduleSchema = new mongoose.Schema({
  /** Frequency of recurrence */
  frequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    required: true,
  },
  /** For weekly: days of week (0=Sunday, 6=Saturday) */
  daysOfWeek: [{
    type: Number,
    min: 0,
    max: 6,
  }],
  /** For monthly: day of month */
  dayOfMonth: {
    type: Number,
    min: 1,
    max: 31,
  },
  /** End date for recurrence */
  endDate: Date,
  /** Maximum number of occurrences */
  maxOccurrences: Number,
  /** Occurrences so far */
  occurrencesCount: {
    type: Number,
    default: 0,
  },
}, { _id: false });

/**
 * Post Analytics Sub-Schema
 * Engagement metrics from platforms
 */
const postAnalyticsSchema = new mongoose.Schema({
  /** Platform-specific post ID (after publishing) */
  platformPostId: {
    type: String,
  },
  /** Platform post URL */
  platformPostUrl: {
    type: String,
  },

  // Engagement metrics
  /** Number of likes/reactions */
  likes: {
    type: Number,
    default: 0,
  },
  /** Number of comments */
  comments: {
    type: Number,
    default: 0,
  },
  /** Number of shares/retweets */
  shares: {
    type: Number,
    default: 0,
  },
  /** Number of link clicks */
  clicks: {
    type: Number,
    default: 0,
  },
  /** Number of impressions/views */
  impressions: {
    type: Number,
    default: 0,
  },
  /** Number of video views (for video posts) */
  videoViews: {
    type: Number,
    default: 0,
  },
  /** Video watch time in seconds (for video posts) */
  videoWatchTime: {
    type: Number,
    default: 0,
  },

  // Engagement rates
  /** Engagement rate (calculated) */
  engagementRate: {
    type: Number,
    default: 0,
  },

  // Poll-specific
  /** Total votes (for poll posts) */
  totalVotes: {
    type: Number,
    default: 0,
  },
  /** Vote breakdown by option (for poll posts) */
  voteBreakdown: [{
    optionIndex: Number,
    label: String,
    votes: Number,
    percentage: Number,
  }],

  // Timestamps
  /** When metrics were last fetched from platform */
  lastFetchedAt: {
    type: Date,
  },
  /** When post was published on platform */
  publishedAt: {
    type: Date,
  },

  // Raw data from platform (webhook updates)
  /** Raw platform response data */
  rawData: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
  },
}, { _id: false });

/**
 * Publishing History Sub-Schema
 * Tracks publish attempts and results
 */
const publishHistorySchema = new mongoose.Schema({
  /** Attempt number */
  attempt: {
    type: Number,
    required: true,
  },
  /** Attempt timestamp */
  at: {
    type: Date,
    default: Date.now,
  },
  /** Status of attempt */
  status: {
    type: String,
    enum: ['pending', 'success', 'failed'],
    required: true,
  },
  /** Error message if failed */
  error: {
    message: String,
    code: String,
  },
  /** Platform response if successful */
  response: {
    postId: String,
    url: String,
    data: mongoose.Schema.Types.Mixed,
  },
}, { _id: false });

// ============================================================================
// MAIN SOCIAL POST SCHEMA
// ============================================================================

const socialPostSchema = new mongoose.Schema({
  // -------------------------------------------------------------------------
  // POST IDENTIFICATION
  // -------------------------------------------------------------------------

  /** Post content text */
  content: {
    type: String,
    required: [true, 'Post content is required'],
    trim: true,
    maxlength: [10000, 'Post content too long'],
  },

  /** Platform to publish to */
  platform: {
    type: String,
    required: [true, 'Platform is required'],
    enum: ['linkedin', 'twitter'],
    index: true,
  },

  /** Social account to post from */
  account: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SocialAccount',
    required: [true, 'Social account is required'],
    index: true,
  },

  // -------------------------------------------------------------------------
  // POST TYPE & CONFIGURATION
  // -------------------------------------------------------------------------

  /** Post type */
  postType: {
    type: String,
    enum: ['text', 'image', 'video', 'link', 'carousel', 'poll'],
    default: 'text',
  },

  /** Media attachments */
  media: [mediaAttachmentSchema],

  /** Link preview (for link posts) */
  linkPreview: linkPreviewSchema,

  /** Poll configuration (for poll posts) */
  poll: pollConfigSchema,

  /** Mentions/tagged users */
  mentions: [{
    /** Platform user ID */
    platformUserId: String,
    /** Username/handle */
    username: String,
    /** Display name */
    displayName: String,
  }],

  /** Hashtags (extracted or explicitly added) */
  hashtags: [{
    type: String,
    trim: true,
    lowercase: true,
  }],

  // -------------------------------------------------------------------------
  // SCHEDULING
  // -------------------------------------------------------------------------

  /** Post status */
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'publishing', 'published', 'failed', 'deleted'],
    default: 'draft',
    index: true,
  },

  /** Scheduled publish time */
  scheduledAt: {
    type: Date,
    index: true,
  },

  /** Timezone for scheduling */
  timezone: {
    type: String,
    default: 'Africa/Nairobi',
  },

  /** Recurring schedule for repeat posts */
  recurring: recurringScheduleSchema,

  /** Whether this is a recurring post template */
  isRecurringTemplate: {
    type: Boolean,
    default: false,
  },

  /** Parent recurring post ID (for generated recurring posts) */
  parentRecurringPost: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SocialPost',
  },

  // -------------------------------------------------------------------------
  // CAMPAIGN/SEQUENCE ASSOCIATION
  // -------------------------------------------------------------------------

  /** Associated campaign */
  campaign: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
  },

  /** Associated sequence */
  sequence: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sequence',
  },

  /** Step number if part of sequence */
  sequenceStep: {
    type: Number,
  },

  // -------------------------------------------------------------------------
  // ANALYTICS
  // -------------------------------------------------------------------------

  /** Post analytics and metrics */
  analytics: {
    type: postAnalyticsSchema,
    default: () => ({}),
  },

  // -------------------------------------------------------------------------
  // PUBLISHING TRACKING
  // -------------------------------------------------------------------------

  /** Publishing attempt history */
  publishHistory: [publishHistorySchema],

  /** Number of publish attempts */
  publishAttempts: {
    type: Number,
    default: 0,
  },

  /** Queue job ID for scheduled posts */
  queueJobId: {
    type: String,
  },

  // -------------------------------------------------------------------------
  // APPROVAL WORKFLOW
  // -------------------------------------------------------------------------

  /** Whether approval is required */
  requiresApproval: {
    type: Boolean,
    default: false,
  },

  /** Approval status */
  approvalStatus: {
    type: String,
    enum: ['not_required', 'pending', 'approved', 'rejected'],
    default: 'not_required',
  },

  /** Who approved the post */
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },

  /** When approved */
  approvedAt: {
    type: Date,
  },

  /** Rejection reason */
  rejectionReason: {
    type: String,
  },

  // -------------------------------------------------------------------------
  // SETTINGS & OPTIONS
  // -------------------------------------------------------------------------

  /** Whether to shorten URLs automatically */
  shortenUrls: {
    type: Boolean,
    default: true,
  },

  /** Whether to add default hashtags from account */
  includeDefaultHashtags: {
    type: Boolean,
    default: true,
  },

  /** Priority in queue */
  priority: {
    type: String,
    enum: ['low', 'normal', 'high'],
    default: 'normal',
  },

  // -------------------------------------------------------------------------
  // INTERNAL NOTES
  // -------------------------------------------------------------------------

  /** Internal notes */
  notes: {
    type: String,
    maxlength: [2000, 'Notes too long'],
  },

  /** Tags for organization */
  tags: [{
    type: String,
    trim: true,
  }],

  // -------------------------------------------------------------------------
  // AUDIT FIELDS
  // -------------------------------------------------------------------------

  /** User who created the post */
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  /** User who last updated the post */
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },

  /** Creation timestamp */
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },

  /** Last update timestamp */
  updatedAt: {
    type: Date,
    default: Date.now,
  },

  /** When post was deleted/archived */
  deletedAt: {
    type: Date,
  },

  /** Who deleted the post */
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
});

// ============================================================================
// INDEXES
// ============================================================================

// Compound index for scheduled posts
socialPostSchema.index({ status: 1, scheduledAt: 1 });

// Index for posts by account
socialPostSchema.index({ account: 1, status: 1, createdAt: -1 });

// Index for campaign posts
socialPostSchema.index({ campaign: 1, status: 1 });

// Index for sequence posts
socialPostSchema.index({ sequence: 1, sequenceStep: 1 });

// Index for approval workflow
socialPostSchema.index({ approvalStatus: 1, requiresApproval: 1 });

// Index for platform-specific post ID lookup
socialPostSchema.index({ platform: 1, 'analytics.platformPostId': 1 });

// ============================================================================
// VIRTUAL PROPERTIES
// ============================================================================

/**
 * Check if post is editable (only draft status)
 */
socialPostSchema.virtual('isEditable').get(function() {
  return this.status === 'draft';
});

/**
 * Check if post is scheduled or publishing
 */
socialPostSchema.virtual('isScheduled').get(function() {
  return ['scheduled', 'publishing'].includes(this.status);
});

/**
 * Check if post has been published
 */
socialPostSchema.virtual('isPublished').get(function() {
  return this.status === 'published';
});

/**
 * Calculate total engagement rate
 */
socialPostSchema.virtual('totalEngagement').get(function() {
  if (!this.analytics) return 0;
  return (this.analytics.likes || 0) +
         (this.analytics.comments || 0) +
         (this.analytics.shares || 0);
});

/**
 * Get time until scheduled publish
 */
socialPostSchema.virtual('timeUntilPublish').get(function() {
  if (!this.scheduledAt || this.status !== 'scheduled') return null;
  const diff = new Date(this.scheduledAt) - new Date();
  return diff > 0 ? diff : 0;
});

// Ensure virtuals are included in JSON output
socialPostSchema.set('toJSON', { virtuals: true });
socialPostSchema.set('toObject', { virtuals: true });

// ============================================================================
// INSTANCE METHODS
// ============================================================================

/**
 * Change post status
 *
 * @param {string} newStatus - New status
 * @param {string} [reason] - Reason for change
 * @returns {this} Updated post
 */
socialPostSchema.methods.changeStatus = function(newStatus, reason) {
  const validStatuses = ['draft', 'scheduled', 'publishing', 'published', 'failed', 'deleted'];
  if (!validStatuses.includes(newStatus)) {
    throw new Error(`Invalid status: ${newStatus}`);
  }

  const oldStatus = this.status;

  // Validate status transitions
  const validTransitions = {
    'draft': ['scheduled', 'deleted'],
    'scheduled': ['publishing', 'draft', 'deleted'],
    'publishing': ['published', 'failed', 'scheduled'],
    'published': ['deleted'],
    'failed': ['draft', 'scheduled', 'deleted'],
    'deleted': [],
  };

  if (!validTransitions[oldStatus]?.includes(newStatus)) {
    throw new Error(`Cannot transition from ${oldStatus} to ${newStatus}`);
  }

  this.status = newStatus;

  // Record in publish history if publishing
  if (newStatus === 'publishing') {
    this.publishAttempts = (this.publishAttempts || 0) + 1;
  }

  // Record publish history if published
  if (newStatus === 'published') {
    if (!this.analytics) this.analytics = {};
    this.analytics.publishedAt = new Date();
  }

  return this;
};

/**
 * Schedule the post for publishing
 *
 * @param {Date} scheduledAt - When to publish
 * @param {string} [timezone] - Timezone
 * @returns {this} Updated post
 */
socialPostSchema.methods.scheduleFor = function(scheduledAt, timezone) {
  if (this.status !== 'draft') {
    throw new Error('Can only schedule draft posts');
  }

  if (new Date(scheduledAt) <= new Date()) {
    throw new Error('Schedule time must be in the future');
  }

  this.scheduledAt = scheduledAt;
  this.timezone = timezone || 'Africa/Nairobi';
  this.changeStatus('scheduled');

  return this;
};

/**
 * Mark post as currently publishing
 *
 * @returns {this} Updated post
 */
socialPostSchema.methods.markPublishing = function() {
  if (this.status !== 'scheduled') {
    throw new Error('Can only mark scheduled posts as publishing');
  }

  this.changeStatus('publishing');
  return this;
};

/**
 * Mark post as successfully published
 *
 * @param {Object} platformData - Platform response data
 * @returns {this} Updated post
 */
socialPostSchema.methods.markPublished = function(platformData) {
  this.changeStatus('published');

  if (!this.analytics) this.analytics = {};

  this.analytics.platformPostId = platformData.postId;
  this.analytics.platformPostUrl = platformData.url;
  this.analytics.publishedAt = new Date();

  // Record in publish history
  this.publishHistory.push({
    attempt: this.publishAttempts,
    status: 'success',
    response: {
      postId: platformData.postId,
      url: platformData.url,
      data: platformData,
    },
  });

  return this;
};

/**
 * Mark post as failed to publish
 *
 * @param {string} errorCode - Error code
 * @param {string} errorMessage - Error message
 * @returns {this} Updated post
 */
socialPostSchema.methods.markFailed = function(errorCode, errorMessage) {
  this.changeStatus('failed', errorMessage);

  // Record in publish history
  this.publishHistory.push({
    attempt: this.publishAttempts,
    status: 'failed',
    error: {
      code: errorCode,
      message: errorMessage,
    },
  });

  return this;
};

/**
 * Update analytics from platform
 *
 * @param {Object} data - Analytics data
 * @returns {this} Updated post
 */
socialPostSchema.methods.updateAnalytics = function(data) {
  if (!this.analytics) this.analytics = {};

  const metrics = ['likes', 'comments', 'shares', 'clicks', 'impressions', 'videoViews', 'videoWatchTime', 'totalVotes'];

  metrics.forEach(metric => {
    if (data[metric] !== undefined) {
      this.analytics[metric] = data[metric];
    }
  });

  // Calculate engagement rate
  const impressions = this.analytics.impressions || 0;
  const totalEngagement = (this.analytics.likes || 0) +
                          (this.analytics.comments || 0) +
                          (this.analytics.shares || 0);

  this.analytics.engagementRate = impressions > 0
    ? Math.round((totalEngagement / impressions) * 10000) / 100
    : 0;

  // Update poll breakdown if provided
  if (data.voteBreakdown) {
    this.analytics.voteBreakdown = data.voteBreakdown;
  }

  this.analytics.lastFetchedAt = new Date();

  return this;
};

/**
 * Add media attachment
 *
 * @param {Object} mediaData - Media data
 * @returns {this} Updated post
 */
socialPostSchema.methods.addMedia = function(mediaData) {
  if (!this.media) this.media = [];

  this.media.push({
    type: mediaData.type,
    url: mediaData.url,
    altText: mediaData.altText,
    uploadStatus: 'pending',
    metadata: mediaData.metadata || {},
  });

  // Update post type based on media
  if (mediaData.type === 'video') {
    this.postType = 'video';
  } else if (this.media.length > 1) {
    this.postType = 'carousel';
  } else if (mediaData.type === 'image') {
    this.postType = 'image';
  }

  return this;
};

/**
 * Remove media attachment
 *
 * @param {string} mediaUrl - URL of media to remove
 * @returns {this} Updated post
 */
socialPostSchema.methods.removeMedia = function(mediaUrl) {
  if (!this.media) return this;

  this.media = this.media.filter(m => m.url !== mediaUrl);

  // Update post type
  if (this.media.length === 0) {
    this.postType = 'text';
  } else if (this.media.length === 1) {
    this.postType = this.media[0].type === 'video' ? 'video' : 'image';
  }

  return this;
};

/**
 * Mark media as uploaded
 *
 * @param {string} mediaUrl - URL of media
 * @param {string} platformMediaId - Platform media ID
 * @returns {this} Updated post
 */
socialPostSchema.methods.markMediaUploaded = function(mediaUrl, platformMediaId) {
  if (!this.media) return this;

  const media = this.media.find(m => m.url === mediaUrl);
  if (media) {
    media.uploadStatus = 'uploaded';
    media.platformMediaId = platformMediaId;
  }

  return this;
};

/**
 * Approve the post
 *
 * @param {ObjectId} userId - Approving user ID
 * @returns {this} Updated post
 */
socialPostSchema.methods.approve = function(userId) {
  if (!this.requiresApproval) {
    throw new Error('Post does not require approval');
  }

  this.approvalStatus = 'approved';
  this.approvedBy = userId;
  this.approvedAt = new Date();
  this.rejectionReason = null;

  return this;
};

/**
 * Reject the post
 *
 * @param {ObjectId} userId - Rejecting user ID
 * @param {string} reason - Rejection reason
 * @returns {this} Updated post
 */
socialPostSchema.methods.reject = function(userId, reason) {
  this.approvalStatus = 'rejected';
  this.rejectionReason = reason;

  return this;
};

/**
 * Archive/delete the post
 *
 * @param {ObjectId} userId - User ID
 * @returns {this} Updated post
 */
socialPostSchema.methods.archive = function(userId) {
  this.deletedAt = new Date();
  this.deletedBy = userId;
  this.status = 'deleted';

  return this;
};

/**
 * Duplicate the post
 *
 * @param {ObjectId} userId - User creating duplicate
 * @returns {SocialPost} New post instance
 */
socialPostSchema.methods.duplicate = function(userId) {
  const postData = this.toObject();

  // Remove fields that should be unique or reset
  delete postData._id;
  delete postData.id;
  delete postData.createdAt;
  delete postData.updatedAt;
  delete postData.analytics.platformPostId;
  delete postData.analytics.platformPostUrl;
  delete postData.analytics.publishedAt;
  delete postData.queueJobId;
  delete postData.deletedAt;
  delete postData.deletedBy;
  delete postData.publishHistory;

  // Set new values
  postData.status = 'draft';
  postData.scheduledAt = null;
  postData.publishAttempts = 0;
  postData.approvalStatus = postData.requiresApproval ? 'pending' : 'not_required';
  postData.createdBy = userId;
  postData.updatedBy = userId;

  // Reset analytics
  postData.analytics = {
    likes: 0,
    comments: 0,
    shares: 0,
    clicks: 0,
    impressions: 0,
    engagementRate: 0,
  };

  return new (mongoose.model('SocialPost'))(postData);
};

/**
 * Generate the next recurring post
 *
 * @param {Date} nextScheduledAt - Next scheduled time
 * @returns {SocialPost} New post instance
 */
socialPostSchema.methods.generateNextRecurring = function(nextScheduledAt) {
  if (!this.recurring || !this.isRecurringTemplate) {
    throw new Error('Post is not a recurring template');
  }

  const postData = this.toObject();

  // Remove fields that should be unique
  delete postData._id;
  delete postData.id;
  delete postData.createdAt;
  delete postData.updatedAt;
  delete postData.analytics;

  // Set as child of template
  postData.status = 'scheduled';
  postData.scheduledAt = nextScheduledAt;
  postData.parentRecurringPost = this._id;
  postData.isRecurringTemplate = false;
  postData.recurring = undefined;

  // Reset publish tracking
  postData.publishAttempts = 0;
  postData.publishHistory = [];

  return new (mongoose.model('SocialPost'))(postData);
};

/**
 * Check character limits for platform
 *
 * @returns {Object} Validation result
 */
socialPostSchema.methods.validateContentLength = function() {
  const content = this.content || '';
  const maxLength = this.platform === 'twitter' ? 280 : 3000; // LinkedIn: 3000

  return {
    valid: content.length <= maxLength,
    length: content.length,
    maxLength,
    remaining: maxLength - content.length,
  };
};

// ============================================================================
// STATIC METHODS
// ============================================================================

/**
 * Find scheduled posts ready to publish
 *
 * @returns {Promise<SocialPost[]>}
 */
socialPostSchema.statics.getScheduledForPublishing = async function() {
  const now = new Date();

  return this.find({
    status: 'scheduled',
    scheduledAt: { $lte: now },
    deletedAt: null,
  })
    .populate('account')
    .populate('createdBy', 'name email')
    .sort({ scheduledAt: 1 });
};

/**
 * Find posts by status
 *
 * @param {string|string[]} status - Status or array of statuses
 * @param {Object} options - Query options
 * @returns {Promise<SocialPost[]>}
 */
socialPostSchema.statics.getByStatus = async function(status, options = {}) {
  const statuses = Array.isArray(status) ? status : [status];
  const { limit = 50, platform, account } = options;

  const query = {
    status: { $in: statuses },
    deletedAt: null,
  };

  if (platform) query.platform = platform;
  if (account) query.account = account;

  return this.find(query)
    .populate('account')
    .populate('createdBy', 'name email')
    .sort('-createdAt')
    .limit(limit);
};

/**
 * Find posts by campaign
 *
 * @param {ObjectId} campaignId - Campaign ID
 * @returns {Promise<SocialPost[]>}
 */
socialPostSchema.statics.getByCampaign = async function(campaignId) {
  return this.find({
    campaign: campaignId,
    deletedAt: null,
  })
    .populate('account')
    .sort('-createdAt');
};

/**
 * Find posts by sequence
 *
 * @param {ObjectId} sequenceId - Sequence ID
 * @returns {Promise<SocialPost[]>}
 */
socialPostSchema.statics.getBySequence = async function(sequenceId) {
  return this.find({
    sequence: sequenceId,
    deletedAt: null,
  })
    .populate('account')
    .sort({ sequenceStep: 1 });
};

/**
 * Find posts needing approval
 *
 * @returns {Promise<SocialPost[]>}
 */
socialPostSchema.statics.getPendingApproval = async function() {
  return this.find({
    requiresApproval: true,
    approvalStatus: 'pending',
    deletedAt: null,
  })
    .populate('account')
    .populate('createdBy', 'name email')
    .sort('-createdAt');
};

/**
 * Find published posts for analytics update
 *
 * @param {Object} options - Options
 * @returns {Promise<SocialPost[]>}
 */
socialPostSchema.statics.getForAnalyticsUpdate = async function(options = {}) {
  const { hoursAgo = 24, platform } = options;
  const cutoff = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);

  const query = {
    status: 'published',
    'analytics.publishedAt': { $gte: cutoff },
    deletedAt: null,
  };

  if (platform) query.platform = platform;

  return this.find(query)
    .populate('account')
    .sort('-analytics.publishedAt');
};

/**
 * Get aggregate analytics
 *
 * @param {Object} options - Filter options
 * @returns {Promise<Object>}
 */
socialPostSchema.statics.getAggregateAnalytics = async function(options = {}) {
  const { startDate, endDate, platform, account } = options;

  const match = {
    status: 'published',
    deletedAt: null,
  };

  if (startDate) match.createdAt = { $gte: new Date(startDate) };
  if (endDate) match.createdAt = { ...match.createdAt, $lte: new Date(endDate) };
  if (platform) match.platform = platform;
  if (account) match.account = account;

  const result = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalPosts: { $sum: 1 },
        totalLikes: { $sum: '$analytics.likes' },
        totalComments: { $sum: '$analytics.comments' },
        totalShares: { $sum: '$analytics.shares' },
        totalClicks: { $sum: '$analytics.clicks' },
        totalImpressions: { $sum: '$analytics.impressions' },
        avgEngagementRate: { $avg: '$analytics.engagementRate' },
      },
    },
  ]);

  if (result.length === 0) {
    return {
      totalPosts: 0,
      totalLikes: 0,
      totalComments: 0,
      totalShares: 0,
      totalClicks: 0,
      totalImpressions: 0,
      avgEngagementRate: 0,
    };
  }

  return {
    totalPosts: result[0].totalPosts,
    totalLikes: result[0].totalLikes,
    totalComments: result[0].totalComments,
    totalShares: result[0].totalShares,
    totalClicks: result[0].totalClicks,
    totalImpressions: result[0].totalImpressions,
    avgEngagementRate: Math.round(result[0].avgEngagementRate * 100) / 100,
  };
};

/**
 * Search posts by content
 *
 * @param {string} query - Search query
 * @param {Object} options - Search options
 * @returns {Promise<SocialPost[]>}
 */
socialPostSchema.statics.search = async function(query, options = {}) {
  const { limit = 50, platform, status } = options;

  const searchQuery = {
    deletedAt: null,
    $or: [
      { content: { $regex: query, $options: 'i' } },
      { notes: { $regex: query, $options: 'i' } },
      { tags: { $regex: query, $options: 'i' } },
    ],
  };

  if (platform) searchQuery.platform = platform;
  if (status) searchQuery.status = status;

  return this.find(searchQuery)
    .populate('account')
    .sort('-createdAt')
    .limit(limit);
};

// ============================================================================
// PRE-SAVE MIDDLEWARE
// ============================================================================

socialPostSchema.pre('save', async function(next) {
  // Update timestamp
  this.updatedAt = new Date();

  // Extract hashtags from content if not set
  if (this.isModified('content') && (!this.hashtags || this.hashtags.length === 0)) {
    const hashtagRegex = /#(\w+)/g;
    const matches = this.content.match(hashtagRegex);
    if (matches) {
      this.hashtags = matches.map(tag => tag.substring(1).toLowerCase());
    }
  }

  // Validate content length for platform
  if (this.isModified('content') && this.platform) {
    const validation = this.validateContentLength();
    if (!validation.valid) {
      return next(new Error(`Content exceeds ${this.platform} character limit (${validation.remaining} characters over)`));
    }
  }

  // Set approval status based on requirement
  if (this.isNew) {
    this.approvalStatus = this.requiresApproval ? 'pending' : 'not_required';
  }

  next();
});

// ============================================================================
// MODEL EXPORT
// ============================================================================

const SocialPost = mongoose.model('SocialPost', socialPostSchema);

export default SocialPost;
