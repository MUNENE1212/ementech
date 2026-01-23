import { body, param, query, validationResult } from 'express-validator';

// Validation middleware helper
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Lead validation rules
export const validateCreateLead = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('source')
    .isIn(['newsletter', 'event', 'survey', 'offer', 'meetup', 'contact', 'download', 'chatbot', 'referral', 'other'])
    .withMessage('Valid source is required'),
  body('name').optional().trim().isLength({ min: 2, max: 100 }),
  body('company').optional().trim().isLength({ max: 100 }),
  body('phone').optional().isMobilePhone('any'),
  body('consentGiven').optional().isBoolean(),
  validate
];

export const validateUpdateLead = [
  param('id').isMongoId().withMessage('Invalid lead ID'),
  body('email').optional().isEmail().normalizeEmail(),
  body('status').optional().isIn(['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'converted', 'unqualified', 'recycled']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  body('seniority').optional().isIn(['c-level', 'vp', 'director', 'manager', 'individual-contributor', 'other']),
  body('companySize').optional().isIn(['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+']),
  body('budget').optional().isIn(['<5k', '5k-10k', '10k-25k', '25k-50k', '50k-100k', '100k+']),
  body('timeline').optional().isIn(['immediate', '1-3-months', '3-6-months', '6-12-months', 'exploring']),
  validate
];

// Content validation rules
export const validateCreateContent = [
  body('title').trim().isLength({ min: 3, max: 200 }).withMessage('Title must be 3-200 characters'),
  body('description').trim().isLength({ min: 10, max: 500 }).withMessage('Description must be 10-500 characters'),
  body('contentType').isIn(['blog', 'whitepaper', 'guide', 'case_study', 'webinar', 'video', 'tool', 'template', 'checklist', 'report', 'infographic', 'other']),
  body('category').optional().isIn(['ai-integration', 'web-development', 'mobile-development', 'cloud-services', 'consulting', 'training', 'case-studies', 'research', 'other']),
  body('accessLevel').optional().isIn(['public', 'email-gated', 'registration-gated', 'premium', 'internal']),
  validate
];

// Interaction validation rules
export const validateTrackInteraction = [
  body('leadId').isMongoId().withMessage('Valid lead ID is required'),
  body('eventType').isIn([
    'page_view', 'page_leave', 'scroll_depth',
    'click', 'form_start', 'form_submit', 'form_abandon',
    'download', 'video_play', 'video_pause', 'video_complete',
    'chat_initiate', 'chat_message', 'chat_qualification', 'chat_schedule_demo',
    'content_view', 'content_share', 'bookmark',
    'event_register', 'event_attend', 'event_no_show',
    'newsletter_subscribe', 'newsletter_open', 'newsletter_click', 'newsletter_unsubscribe',
    'add_to_cart', 'initiate_checkout', 'purchase', 'referral',
    'custom'
  ]).withMessage('Valid event type is required'),
  body('sessionId').optional().isString(),
  validate
];

// Chat validation rules
export const validateChatMessage = [
  body('message').trim().isLength({ min: 1, max: 2000 }).withMessage('Message is required (max 2000 characters)'),
  body('sessionId').isString().withMessage('Session ID is required'),
  body('conversationId').optional().isMongoId(),
  body('leadId').optional().isMongoId(),
  validate
];

// Event validation rules
export const validateEventRegistration = [
  param('eventId').isMongoId().withMessage('Invalid event ID'),
  body('leadId').isMongoId().withMessage('Valid lead ID is required'),
  body('name').trim().isLength({ min: 2, max: 100 }),
  body('email').isEmail().normalizeEmail(),
  validate
];

// Query validation
export const validatePagination = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  validate
];

export const validateDateRange = [
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  validate
];

// Newsletter subscription validation
export const validateNewsletterSubscription = [
  body('email').isEmail().normalizeEmail(),
  body('newsletterId').optional().isMongoId(),
  body('consentGiven').isBoolean().withMessage('Consent must be given'),
  validate
];
