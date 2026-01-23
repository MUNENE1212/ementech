import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

/**
 * Social Publisher Service - Phase 6: Social Media Integration
 *
 * Handles publishing to social media platforms:
 * - LinkedIn API integration (share post, upload media)
 * - Twitter/X API integration (tweet, upload media)
 * - Token refresh handling
 * - Rate limiting and error handling
 * - Webhook support for engagement updates
 *
 * @version 1.0.0
 * @since 2026-01-23
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

const LINKEDIN_API_BASE = 'https://api.linkedin.com/v2';
const TWITTER_API_BASE = 'https://api.twitter.com/2';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Make an authenticated API request
 *
 * @param {string} url - Request URL
 * @param {string} method - HTTP method
 * @param {string} accessToken - OAuth access token
 * @param {Object} [body] - Request body
 * @param {Object} [headers] - Additional headers
 * @returns {Promise<Object>} API response
 */
async function makeRequest(url, method, accessToken, body = null, headers = {}) {
  const config = {
    method,
    url,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (body) {
    config.data = body;
  }

  const response = await axios(config);
  return response.data;
}

/**
 * Handle API errors with retry logic
 *
 * @param {Error} error - Error object
 * @param {number} retryCount - Current retry count
 * @param {number} maxRetries - Maximum retries
 * @returns {Promise<void>}
 */
async function handleApiError(error, retryCount = 0, maxRetries = 3) {
  if (retryCount >= maxRetries) {
    throw error;
  }

  const status = error.response?.status;
  const isRetryable = !status || [429, 500, 502, 503, 504].includes(status);

  if (isRetryable) {
    // Exponential backoff
    const delay = Math.pow(2, retryCount) * 1000;
    await new Promise(resolve => setTimeout(resolve, delay));
  } else {
    throw error;
  }
}

// ============================================================================
// LINKEDIN API
// ============================================================================

/**
 * Publish a post to LinkedIn
 *
 * @param {Object} post - SocialPost document
 * @param {Object} account - SocialAccount document
 * @returns {Promise<Object>} Result with postId and URL
 */
async function publishToLinkedIn(post, account) {
  const { accessToken } = account.tokens;
  const { content, media, linkPreview } = post;

  // Step 1: Register the post for upload
  const personUrn = `urn:li:person:${account.accountId}`;

  let postData = {
    author: personUrn,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: {
          text: content.substring(0, 3000), // LinkedIn limit
        },
        shareMediaCategory: media?.length > 0 ? 'IMAGE' : 'NONE',
      },
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
    },
  };

  // Handle media attachments
  if (media && media.length > 0) {
    const mediaAssets = [];

    for (const mediaItem of media) {
      try {
        // Upload image to LinkedIn
        const uploadUrl = await registerLinkedInImageUpload(personUrn, accessToken);
        const mediaUrn = await uploadLinkedInImage(uploadUrl, mediaItem.url, accessToken);

        mediaAssets.push({
          status: 'READY',
          description: {
            text: mediaItem.altText || '',
          },
          media: mediaUrn,
          title: {
            text: mediaItem.altText || 'Image',
          },
        });
      } catch (uploadError) {
        console.error('Error uploading media to LinkedIn:', uploadError);
        throw new Error(`Failed to upload media: ${uploadError.message}`);
      }
    }

    postData.specificContent['com.linkedin.ugc.ShareContent'].media = mediaAssets;
  }

  // Handle link preview
  if (linkPreview && linkPreview.url) {
    postData.specificContent['com.linkedin.ugc.ShareContent'].shareMediaCategory = 'ARTICLE';
    postData.specificContent['com.linkedin.ugc.ShareContent'].media = [
      {
        status: 'READY',
        description: {
          text: linkPreview.description || '',
        },
        originalUrl: linkPreview.url,
        title: {
          text: linkPreview.title || '',
        },
      },
    ];
  }

  // Step 2: Create the post
  const createResponse = await makeRequest(
    `${LINKEDIN_API_BASE}/ugcPosts`,
    'POST',
    accessToken,
    postData
  );

  const postId = createResponse.id;

  // Step 3: Get the post URL
  const postUrl = `https://www.linkedin.com/feed/update/${postId}`;

  return {
    postId,
    url: postUrl,
    platform: 'linkedin',
  };
}

/**
 * Register an image upload with LinkedIn
 *
 * @param {string} personUrn - Person URN
 * @param {string} accessToken - Access token
 * @returns {Promise<string>} Upload URL
 */
async function registerLinkedInImageUpload(personUrn, accessToken) {
  const response = await makeRequest(
    `${LINKEDIN_API_BASE}/assets?action=registerUpload`,
    'POST',
    accessToken,
    {
      registerUploadRequest: {
        owner: personUrn,
        recipes: [
          'urn:li:digitalmediaRecipe:feedshare-image',
        ],
        serviceRelations: [],
        supportedUploadMechanism: [
          'SYNCHRONOUS_UPLOAD',
        ],
      },
    }
  );

  return response.value?.uploadMechanism?.['com.linkedin.digitalmedia.uploading.MediaUploadWorker']?.uploadUrl;
}

/**
 * Upload an image to LinkedIn
 *
 * @param {string} uploadUrl - Upload URL from registration
 * @param {string} imageUrl - URL of image to upload
 * @param {string} accessToken - Access token
 * @returns {Promise<string>} Media URN
 */
async function uploadLinkedInImage(uploadUrl, imageUrl, accessToken) {
  // Download image
  const imageResponse = await axios.get(imageUrl, {
    responseType: 'arraybuffer',
  });

  // Upload to LinkedIn
  const uploadResponse = await axios.put(uploadUrl, imageResponse.data, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'image/jpeg',
    },
  });

  // The location header contains the media URN
  const location = uploadResponse.headers['location'] || uploadResponse.headers['x-linkedin-urn'];
  if (!location) {
    throw new Error('No location header in upload response');
  }

  // Extract URN from location
  const urnMatch = location.match(/urn:li:digitalmediaAsset:[A-Za-z0-9]+/);
  return urnMatch ? urnMatch[0] : location;
}

/**
 * Delete a post from LinkedIn
 *
 * @param {string} postId - Platform post ID
 * @param {string} accessToken - Access token
 * @returns {Promise<void>}
 */
async function deleteFromLinkedIn(postId, accessToken) {
  await makeRequest(
    `${LINKEDIN_API_BASE}/ugcPosts/${postId}`,
    'DELETE',
    accessToken
  );
}

/**
 * Get post analytics from LinkedIn
 *
 * @param {string} postId - Platform post ID
 * @param {string} accessToken - Access token
 * @returns {Promise<Object>} Analytics data
 */
async function getLinkedInAnalytics(postId, accessToken) {
  try {
    // LinkedIn requires special permissions for analytics
    // This is a placeholder for the implementation
    const response = await makeRequest(
      `${LINKEDIN_API_BASE}/ugcPosts/${postId}?projection=(*,socialDetail(*,totalShares,likesCount,commentsCount))`,
      'GET',
      accessToken
    );

    return {
      likes: response.socialDetail?.likesCount || 0,
      comments: response.socialDetail?.commentsCount || 0,
      shares: response.socialDetail?.totalShares || 0,
      impressions: 0, // Not available in basic endpoint
    };
  } catch (error) {
    console.error('Error fetching LinkedIn analytics:', error.message);
    return {};
  }
}

/**
 * Refresh LinkedIn access token
 *
 * @param {string} refreshToken - Refresh token
 * @returns {Promise<Object>} New token data
 */
async function refreshLinkedInToken(refreshToken) {
  const params = new URLSearchParams();
  params.append('grant_type', 'refresh_token');
  params.append('refresh_token', refreshToken);
  params.append('client_id', process.env.LINKEDIN_CLIENT_ID);
  params.append('client_secret', process.env.LINKEDIN_CLIENT_SECRET);

  const response = await axios.post(
    'https://www.linkedin.com/oauth/v2/accessToken',
    params
  );

  const expiresIn = response.data.expires_in || 5184000; // Default 60 days
  const expiresAt = new Date(Date.now() + expiresIn * 1000);

  return {
    accessToken: response.data.access_token,
    refreshToken: response.data.refresh_token || refreshToken,
    expiresAt,
  };
}

// ============================================================================
// TWITTER/X API
// ============================================================================

/**
 * Publish a post to Twitter/X
 *
 * @param {Object} post - SocialPost document
 * @param {Object} account - SocialAccount document
 * @returns {Promise<Object>} Result with postId and URL
 */
async function publishToTwitter(post, account) {
  const { accessToken } = account.tokens;
  const { content, media, poll } = post;

  let mediaIds = [];

  // Upload media first
  if (media && media.length > 0) {
    for (const mediaItem of media) {
      try {
        const mediaId = await uploadToTwitter(mediaItem.url, accessToken);
        mediaIds.push(mediaId);
      } catch (uploadError) {
        console.error('Error uploading media to Twitter:', uploadError);
        throw new Error(`Failed to upload media: ${uploadError.message}`);
      }
    }
  }

  // Build tweet request
  const tweetData = {
    text: content.substring(0, 280), // Twitter limit
  };

  // Attach media
  if (mediaIds.length > 0) {
    tweetData.media = {
      media_ids: mediaIds,
    };
  }

  // Attach poll
  if (poll && poll.options) {
    tweetData.poll = {
      options: poll.options.map(o => o.label),
      duration_minutes: poll.durationMinutes,
    };
  }

  // Create tweet
  const response = await makeRequest(
    `${TWITTER_API_BASE}/tweets`,
    'POST',
    accessToken,
    tweetData
  );

  const postId = response.data.id;
  const postUrl = `https://twitter.com/i/status/${postId}`;

  return {
    postId,
    url: postUrl,
    platform: 'twitter',
  };
}

/**
 * Upload media to Twitter/X
 *
 * @param {string} imageUrl - URL of media to upload
 * @param {string} accessToken - Access token
 * @returns {Promise<string>} Media ID
 */
async function uploadToTwitter(imageUrl, accessToken) {
  // Download image
  const imageResponse = await axios.get(imageUrl, {
    responseType: 'arraybuffer',
  });

  // Step 1: Initialize upload
  const initResponse = await makeRequest(
    'https://upload.twitter.com/1.1/media/upload.json',
    'POST',
    accessToken,
    null,
    {
      'Content-Type': 'application/x-www-form-urlencoded',
    }
  );

  // For v2 API, use the media endpoint
  const formData = new FormData();
  formData.append('media', imageResponse.data);

  const uploadResponse = await axios.post(
    'https://upload.twitter.com/1.1/media/upload.json',
    formData,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        ...formData.getHeaders(),
      },
    }
  );

  return uploadResponse.data.media_id_string;
}

/**
 * Delete a post from Twitter/X
 *
 * @param {string} postId - Platform post ID
 * @param {string} accessToken - Access token
 * @returns {Promise<void>}
 */
async function deleteFromTwitter(postId, accessToken) {
  await makeRequest(
    `${TWITTER_API_BASE}/tweets/${postId}`,
    'DELETE',
    accessToken
  );
}

/**
 * Get post analytics from Twitter/X
 *
 * @param {string} postId - Platform post ID
 * @param {string} accessToken - Access token
 * @returns {Promise<Object>} Analytics data
 */
async function getTwitterAnalytics(postId, accessToken) {
  try {
    const response = await makeRequest(
      `${TWITTER_API_BASE}/tweets/${postId}?tweet.fields=public_metrics,attachments,poll_details`,
      'GET',
      accessToken
    );

    const metrics = response.data?.public_metrics || {};

    return {
      likes: metrics.like_count || 0,
      comments: metrics.reply_count || 0,
      shares: metrics.retweet_count || 0,
      clicks: metrics.quote_count || 0,
      impressions: metrics.impression_count || 0,
    };
  } catch (error) {
    console.error('Error fetching Twitter analytics:', error.message);
    return {};
  }
}

/**
 * Refresh Twitter access token
 *
 * @param {string} refreshToken - Refresh token
 * @returns {Promise<Object>} New token data
 */
async function refreshTwitterToken(refreshToken) {
  const params = new URLSearchParams();
  params.append('grant_type', 'refresh_token');
  params.append('refresh_token', refreshToken);
  params.append('client_id', process.env.TWITTER_CLIENT_ID);
  params.append('client_secret', process.env.TWITTER_CLIENT_SECRET);

  const response = await axios.post(
    'https://api.twitter.com/2/oauth2/token',
    params
  );

  const expiresIn = response.data.expires_in || 7200; // Default 2 hours
  const expiresAt = new Date(Date.now() + expiresIn * 1000);

  return {
    accessToken: response.data.access_token,
    refreshToken: response.data.refresh_token || refreshToken,
    expiresAt,
  };
}

// ============================================================================
// PUBLIC SERVICE FUNCTIONS
// ============================================================================

/**
 * Publish a post to its designated platform
 *
 * @param {Object} post - SocialPost document (must populate account)
 * @param {number} [retryCount=0] - Current retry count
 * @returns {Promise<Object>} Result with postId and URL
 */
export async function publishPost(post, retryCount = 0) {
  const { platform, account } = post;

  if (!account) {
    throw new Error('Post must have an account populated');
  }

  // Check if account is ready
  if (account.status !== 'active') {
    throw new Error(`Account status is ${account.status}, cannot publish`);
  }

  // Check token expiration
  if (account.isTokenExpired) {
    throw new Error('Access token expired, please reconnect account');
  }

  // Check rate limits
  if (!account.canMakeApiCall) {
    throw new Error('Rate limit exceeded, please try again later');
  }

  let result;

  try {
    // Platform-specific publishing
    if (platform === 'linkedin') {
      result = await publishToLinkedIn(post, account);
    } else if (platform === 'twitter') {
      result = await publishToTwitter(post, account);
    } else {
      throw new Error(`Unsupported platform: ${platform}`);
    }

    // Record API call
    account.recordApiCall();
    await account.save();

    return result;

  } catch (error) {
    // Handle rate limiting
    if (error.response?.status === 429) {
      const resetAt = error.response.headers['x-rate-limit-reset'];
      if (resetAt) {
        account.rateLimit.remaining = 0;
        account.rateLimit.resetAt = new Date(parseInt(resetAt) * 1000);
      }
      await account.save();
    }

    // Retry logic
    await handleApiError(error, retryCount);

    // Recursive retry
    return publishPost(post, retryCount + 1);
  }
}

/**
 * Delete a post from platform
 *
 * @param {Object} post - SocialPost document (must populate account)
 * @returns {Promise<void>}
 */
export async function deletePost(post) {
  const { platform, account, analytics } = post;

  if (!analytics?.platformPostId) {
    throw new Error('Post not published on platform');
  }

  const { accessToken } = account.tokens;
  const postId = analytics.platformPostId;

  if (platform === 'linkedin') {
    await deleteFromLinkedIn(postId, accessToken);
  } else if (platform === 'twitter') {
    await deleteFromTwitter(postId, accessToken);
  } else {
    throw new Error(`Unsupported platform: ${platform}`);
  }

  // Record API call
  account.recordApiCall();
  await account.save();
}

/**
 * Refresh access tokens for an account
 *
 * @param {Object} account - SocialAccount document
 * @returns {Promise<Object>} New token data
 */
export async function refreshTokens(account) {
  const { platform, tokens } = account;

  if (!tokens.refreshToken) {
    throw new Error('No refresh token available, please re-authenticate');
  }

  let tokenData;

  if (platform === 'linkedin') {
    tokenData = await refreshLinkedInToken(tokens.refreshToken);
  } else if (platform === 'twitter') {
    tokenData = await refreshTwitterToken(tokens.refreshToken);
  } else {
    throw new Error(`Unsupported platform: ${platform}`);
  }

  return tokenData;
}

/**
 * Get analytics for a post from platform
 *
 * @param {Object} post - SocialPost document (must populate account)
 * @returns {Promise<Object>} Analytics data
 */
export async function getPostAnalytics(post) {
  const { platform, account, analytics } = post;

  if (!analytics?.platformPostId) {
    throw new Error('Post not published on platform');
  }

  const { accessToken } = account.tokens;
  const postId = analytics.platformPostId;

  let platformAnalytics;

  if (platform === 'linkedin') {
    platformAnalytics = await getLinkedInAnalytics(postId, accessToken);
  } else if (platform === 'twitter') {
    platformAnalytics = await getTwitterAnalytics(postId, accessToken);
  } else {
    throw new Error(`Unsupported platform: ${platform}`);
  }

  // Record API call
  account.recordApiCall();
  await account.save();

  return platformAnalytics;
}

/**
 * Upload media to platform
 *
 * @param {Object} account - SocialAccount document
 * @param {Object} mediaData - Media data {url, type, altText}
 * @returns {Promise<Object>} Upload result
 */
export async function uploadMedia(account, mediaData) {
  const { platform, tokens } = account;

  if (platform === 'linkedin') {
    const personUrn = `urn:li:person:${account.accountId}`;
    const uploadUrl = await registerLinkedInImageUpload(personUrn, tokens.accessToken);
    const mediaUrn = await uploadLinkedInImage(uploadUrl, mediaData.url, tokens.accessToken);

    return {
      platformMediaId: mediaUrn,
      uploadStatus: 'uploaded',
    };
  } else if (platform === 'twitter') {
    const mediaId = await uploadToTwitter(mediaData.url, tokens.accessToken);

    return {
      platformMediaId: mediaId,
      uploadStatus: 'uploaded',
    };
  } else {
    throw new Error(`Unsupported platform: ${platform}`);
  }
}

/**
 * Test connection to a social platform
 *
 * @param {Object} account - SocialAccount document
 * @returns {Promise<boolean>} True if connection is valid
 */
export async function testConnection(account) {
  const { platform, tokens } = account;

  if (platform === 'linkedin') {
    // Test by fetching profile
    await makeRequest(
      `${LINKEDIN_API_BASE}/me`,
      'GET',
      tokens.accessToken
    );
  } else if (platform === 'twitter') {
    // Test by fetching user info
    await makeRequest(
      `${TWITTER_API_BASE}/users/me?profile_image_url=true`,
      'GET',
      tokens.accessToken
    );
  } else {
    throw new Error(`Unsupported platform: ${platform}`);
  }

  return true;
}

// ============================================================================
// WEBHOOK HANDLERS
// ============================================================================

/**
 * Handle incoming webhook from LinkedIn
 *
 * @param {Object} payload - Webhook payload
 * @returns {Promise<Object>} Processed result
 */
export async function handleLinkedInWebhook(payload) {
  // Process webhook data for engagement updates
  const { event, data } = payload;

  switch (event) {
    case 'COMMENT_CREATED':
    case 'LIKE_CREATED':
    case 'SHARE_CREATED':
      // Update post analytics
      return {
        platform: 'linkedin',
        event,
        data,
        processed: true,
      };
    default:
      return {
        platform: 'linkedin',
        event,
        processed: false,
        message: 'Unknown event type',
      };
  }
}

/**
 * Handle incoming webhook from Twitter/X
 *
 * @param {Object} payload - Webhook payload
 * @returns {Promise<Object>} Processed result
 */
export async function handleTwitterWebhook(payload) {
  // Process webhook data for engagement updates
  const { for_user_id, tweet_create_events } = payload;

  if (tweet_create_events) {
    return {
      platform: 'twitter',
      event: 'tweet_create',
      data: tweet_create_events,
      processed: true,
    };
  }

  return {
    platform: 'twitter',
    processed: false,
    message: 'Unknown webhook format',
  };
}

export default {
  publishPost,
  deletePost,
  refreshTokens,
  getPostAnalytics,
  uploadMedia,
  testConnection,
  handleLinkedInWebhook,
  handleTwitterWebhook,
};
