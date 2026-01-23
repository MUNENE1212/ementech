/**
 * Lead Service
 * Handles all lead capture API calls with progressive profiling
 * Includes retry logic and enhanced error handling
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
const LEAD_ENDPOINT = `${API_BASE_URL}/leads`;

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

/**
 * Helper function to delay execution
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise<void>}
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Helper function to retry failed requests with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {number} retries - Number of retries remaining
 * @returns {Promise<any>}
 */
const retryWithBackoff = async (fn, retries = MAX_RETRIES) => {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) {
      throw error;
    }

    // Log retry attempt
    console.warn(`Request failed, retrying... (${MAX_RETRIES - retries + 1}/${MAX_RETRIES})`);

    // Wait before retrying with exponential backoff
    await delay(RETRY_DELAY * (MAX_RETRIES - retries + 1));

    return retryWithBackoff(fn, retries - 1);
  }
};

/**
 * Helper function to handle API errors gracefully
 * @param {Response} response - Fetch response object
 * @param {string} defaultMessage - Default error message
 * @throws {Error} - Enhanced error with user-friendly message
 */
const handleApiError = async (response, defaultMessage) => {
  try {
    const errorData = await response.json();
    throw new Error(errorData.message || errorData.error || defaultMessage);
  } catch (parseError) {
    // If we can't parse the error, use the status text or default message
    throw new Error(response.statusText || defaultMessage);
  }
};

/**
 * Helper function to check if error is a network error
 * @param {Error} error - Error object
 * @returns {boolean}
 */
const isNetworkError = (error) => {
  return error.message.includes('Failed to fetch') ||
         error.message.includes('NetworkError') ||
         error.name === 'TypeError';
};

/**
 * Save newsletter subscription with retry logic
 * @param {Object} data - { email, consent, source }
 * @returns {Promise<Object>}
 */
export const subscribeNewsletter = async (data) => {
  const fetchWithRetry = async () => {
    try {
      const response = await fetch(`${LEAD_ENDPOINT}/newsletter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          consent: data.consent,
          source: data.source || 'footer',
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        await handleApiError(response, 'Failed to subscribe to newsletter');
      }

      return await response.json();
    } catch (error) {
      // Log detailed error for debugging
      console.error('Newsletter subscription error:', {
        message: error.message,
        email: data.email,
        source: data.source,
        timestamp: new Date().toISOString(),
        stack: error.stack
      });

      // Throw user-friendly error
      if (isNetworkError(error)) {
        throw new Error('Unable to connect. Please check your internet connection and try again.');
      }

      throw error;
    }
  };

  return retryWithBackoff(fetchWithRetry);
};

/**
 * Save resource download lead with retry logic
 * @param {Object} data - { email, name, company, resourceId, consent }
 * @returns {Promise<Object>}
 */
export const saveResourceDownload = async (data) => {
  const fetchWithRetry = async () => {
    try {
      const response = await fetch(`${LEAD_ENDPOINT}/resource-download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          name: data.name || '',
          company: data.company || '',
          resourceId: data.resourceId,
          resourceName: data.resourceName,
          consent: data.consent,
          source: data.source || 'resource-page',
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        await handleApiError(response, 'Failed to save resource download');
      }

      return await response.json();
    } catch (error) {
      console.error('Resource download error:', {
        message: error.message,
        email: data.email,
        resourceId: data.resourceId,
        timestamp: new Date().toISOString(),
        stack: error.stack
      });

      if (isNetworkError(error)) {
        throw new Error('Unable to connect. Please check your internet connection and try again.');
      }

      throw error;
    }
  };

  return retryWithBackoff(fetchWithRetry);
};

/**
 * Save exit intent capture with retry logic
 * @param {Object} data - { email, name, offer, consent }
 * @returns {Promise<Object>}
 */
export const saveExitIntent = async (data) => {
  const fetchWithRetry = async () => {
    try {
      const response = await fetch(`${LEAD_ENDPOINT}/exit-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          name: data.name || '',
          offer: data.offer,
          consent: data.consent,
          source: data.source || 'exit-intent',
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        await handleApiError(response, 'Failed to save exit intent');
      }

      return await response.json();
    } catch (error) {
      console.error('Exit intent error:', {
        message: error.message,
        email: data.email,
        offer: data.offer,
        timestamp: new Date().toISOString(),
        stack: error.stack
      });

      if (isNetworkError(error)) {
        throw new Error('Unable to connect. Please check your internet connection and try again.');
      }

      throw error;
    }
  };

  return retryWithBackoff(fetchWithRetry);
};

/**
 * Update lead profile progressively with retry logic
 * @param {string} email - Lead email
 * @param {Object} additionalData - Additional profile data
 * @returns {Promise<Object>}
 */
export const updateLeadProfile = async (email, additionalData) => {
  const fetchWithRetry = async () => {
    try {
      const response = await fetch(`${LEAD_ENDPOINT}/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          ...additionalData,
        }),
      });

      if (!response.ok) {
        await handleApiError(response, 'Failed to update lead profile');
      }

      return await response.json();
    } catch (error) {
      console.error('Profile update error:', {
        message: error.message,
        email,
        timestamp: new Date().toISOString(),
        stack: error.stack
      });

      if (isNetworkError(error)) {
        throw new Error('Unable to connect. Please check your internet connection and try again.');
      }

      throw error;
    }
  };

  return retryWithBackoff(fetchWithRetry);
};

/**
 * Track lead interaction (doesn't throw, logs errors only)
 * @param {Object} data - { email, action, metadata }
 * @returns {Promise<Object>}
 */
export const trackInteraction = async (data) => {
  try {
    const response = await fetch(`${LEAD_ENDPOINT}/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: data.email,
        action: data.action,
        metadata: data.metadata || {},
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      console.warn('Interaction tracking failed:', response.status, response.statusText);
      return { success: false, tracked: false };
    }

    const result = await response.json();
    return { success: true, tracked: true, data: result };
  } catch (error) {
    console.error('Interaction tracking error:', {
      message: error.message,
      action: data.action,
      timestamp: new Date().toISOString()
    });
    // Don't throw for tracking errors - they shouldn't block UX
    return { success: true, tracked: false };
  }
};

/**
 * Validate email format
 * @param {string} email
 * @returns {boolean}
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Infer company from email domain
 * @param {string} email
 * @returns {string|null}
 */
export const inferCompanyFromEmail = (email) => {
  if (!email || !isValidEmail(email)) return null;

  const domain = email.split('@')[1];

  // Common email providers - return null as company can't be inferred
  const commonProviders = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
    'aol.com', 'icloud.com', 'protonmail.com', 'mail.com'
  ];

  if (commonProviders.includes(domain.toLowerCase())) {
    return null;
  }

  // Extract company name from domain
  const companyDomain = domain.split('.')[0];
  return companyDomain.charAt(0).toUpperCase() + companyDomain.slice(1);
};

/**
 * Check if lead already exists
 * @param {string} email
 * @returns {Promise<boolean>}
 */
export const checkLeadExists = async (email) => {
  try {
    const response = await fetch(`${LEAD_ENDPOINT}/exists/${encodeURIComponent(email)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.exists;
  } catch (error) {
    console.error('Lead existence check error:', error);
    return false;
  }
};

/**
 * Get lead profile
 * @param {string} email
 * @returns {Promise<Object|null>}
 */
export const getLeadProfile = async (email) => {
  try {
    const response = await fetch(`${LEAD_ENDPOINT}/profile/${encodeURIComponent(email)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Get lead profile error:', error);
    return null;
  }
};
