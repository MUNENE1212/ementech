import mongoose from 'mongoose';

const interactionSchema = new mongoose.Schema({
  // ========== Core References ==========
  leadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead',
    required: true,
    index: true
  },
  sessionId: {
    type: String,
    index: true
  },

  // ========== Event Classification ==========
  eventType: {
    type: String,
    required: true,
    enum: [
      // Page View Events
      'page_view',
      'page_leave',
      'scroll_depth',

      // Engagement Events
      'click',
      'form_start',
      'form_submit',
      'form_abandon',
      'download',
      'video_play',
      'video_pause',
      'video_complete',

      // Chat Events
      'chat_initiate',
      'chat_message',
      'chat_qualification',
      'chat_schedule_demo',

      // Content Events
      'content_view',
      'content_share',
      'bookmark',

      // Event Registration
      'event_register',
      'event_attend',
      'event_no_show',

      // Newsletter Events
      'newsletter_subscribe',
      'newsletter_open',
      'newsletter_click',
      'newsletter_unsubscribe',

      // Commerce/Conversion
      'add_to_cart',
      'initiate_checkout',
      'purchase',
      'referral',

      // Custom
      'custom'
    ]
  },
  eventCategory: {
    type: String,
    enum: ['engagement', 'navigation', 'conversion', 'support', 'custom'],
    default: 'engagement'
  },

  // ========== Event Details ==========
  pageTitle: String,
  pageUrl: String,
  referrer: String,
  elementId: String,
  elementText: String,
  linkUrl: String,

  // ========== Form Data ==========
  formType: {
    type: String,
    enum: ['newsletter', 'contact', 'download', 'event', 'survey', 'assessment', 'other']
  },
  formData: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  formCompletionTime: Number, // in seconds
  formFieldsFilled: [String],

  // ========== Content Interaction ==========
  contentType: {
    type: String,
    enum: ['blog', 'whitepaper', 'guide', 'case_study', 'webinar', 'video', 'tool', 'other']
  },
  contentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Content'
  },
  contentTitle: String,
  timeSpent: Number, // in seconds
  scrollDepth: Number, // percentage 0-100

  // ========== Video Interaction ==========
  videoId: String,
  videoTitle: String,
  videoDuration: Number,
  videoPosition: Number, // seconds watched

  // ========== Chat Interaction ==========
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation'
  },
  message: String,
  botResponse: String,
  intent: String, // AI-detected intent
  sentiment: {
    type: String,
    enum: ['positive', 'neutral', 'negative']
  },

  // ========== Newsletter Events ==========
  campaignId: String,
  campaignName: String,
  emailSubject: String,
  linkClicked: String,

  // ========== Event Registration ==========
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  },
  eventTitle: String,
  registrationStatus: {
    type: String,
    enum: ['registered', 'attended', 'no-show', 'cancelled']
  },

  // ========== Value & Impact ==========
  value: {
    type: Number,
    default: 0
  }, // Business value score (0-100)
  impactScore: {
    type: Number,
    default: 0
  }, // Impact on lead score (positive or negative)

  // ========== Technical Details ==========
  ipAddress: String,
  userAgent: String,
  device: {
    type: {
      type: String,
      enum: ['desktop', 'mobile', 'tablet']
    },
    os: String,
    browser: String
  },
  location: {
    country: String,
    city: String,
    region: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },

  // ========== UTM Tracking ==========
  utmSource: String,
  utmMedium: String,
  utmCampaign: String,
  utmTerm: String,
  utmContent: String,

  // ========== Context & Metadata ==========
  context: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },

  // A/B Testing
  experimentId: String,
  variation: String,

  // Custom properties for flexibility
  customProperties: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },

  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// ========== Compound Indexes for Performance ==========
interactionSchema.index({ leadId: 1, createdAt: -1 });
interactionSchema.index({ eventType: 1, createdAt: -1 });
interactionSchema.index({ sessionId: 1, createdAt: -1 });
interactionSchema.index({ leadId: 1, eventType: 1 });
interactionSchema.index({ createdAt: -1, eventType: 1 });
interactionSchema.index({ campaignId: 1 });
interactionSchema.index({ eventId: 1 });

// ========== Static Methods ==========

// Get user journey for a lead
interactionSchema.statics.getUserJourney = async function(leadId, limit = 50) {
  return await this.find({ leadId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
};

// Get first touchpoint
interactionSchema.statics.getFirstTouchpoint = async function(leadId) {
  return await this.findOne({ leadId })
    .sort({ createdAt: 1 })
    .lean();
};

// Get last activity
interactionSchema.statics.getLastActivity = async function(leadId) {
  return await this.findOne({ leadId })
    .sort({ createdAt: -1 })
    .lean();
};

// Count interactions by type
interactionSchema.statics.countByType = async function(leadId) {
  return await this.aggregate([
    { $match: { leadId } },
    {
      $group: {
        _id: '$eventType',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

// Get engagement metrics
interactionSchema.statics.getEngagementMetrics = async function(leadId) {
  const result = await this.aggregate([
    { $match: { leadId } },
    {
      $group: {
        _id: null,
        totalEvents: { $sum: 1 },
        pageViews: {
          $sum: { $cond: [{ $eq: ['$eventType', 'page_view'] }, 1, 0] }
        },
        totalValue: { $sum: '$value' },
        avgImpactScore: { $avg: '$impactScore' },
        lastActivity: { $max: '$createdAt' },
        firstActivity: { $min: '$createdAt' }
      }
    }
  ]);

  if (result.length === 0) {
    return {
      totalEvents: 0,
      pageViews: 0,
      totalValue: 0,
      avgImpactScore: 0,
      lastActivity: null,
      firstActivity: null
    };
  }

  return result[0];
};

// Calculate conversion funnel step
interactionSchema.statics.getFunnelPosition = async function(leadId) {
  const interactions = await this.find({ leadId })
    .select('eventType')
    .lean();

  const eventTypes = new Set(interactions.map(i => i.eventType));

  // Define funnel stages
  if (eventTypes.has('purchase') || eventTypes.has('chat_schedule_demo')) {
    return 'conversion';
  }
  if (eventTypes.has('event_register') || eventTypes.has('download')) {
    return 'consideration';
  }
  if (eventTypes.has('newsletter_subscribe') || eventTypes.has('form_submit')) {
    return 'interest';
  }
  if (eventTypes.has('page_view')) {
    return 'awareness';
  }

  return 'unknown';
};

// Pre-save middleware to set impact score based on event type
interactionSchema.pre('save', function(next) {
  // Default impact scores by event type
  const impactScores = {
    // High value conversions
    'chat_schedule_demo': 50,
    'event_register': 40,
    'purchase': 50,
    'download': 30,

    // Medium value engagement
    'newsletter_subscribe': 20,
    'form_submit': 25,
    'chat_initiate': 15,
    'chat_qualification': 35,

    // Content engagement
    'content_view': 10,
    'video_play': 8,
    'video_complete': 15,

    // Low value
    'page_view': 2,
    'click': 1,

    // Negative signals
    'newsletter_unsubscribe': -20,
    'form_abandon': -5,
    'bounce': -10
  };

  if (!this.impactScore) {
    this.impactScore = impactScores[this.eventType] || 0;
  }

  // Calculate value score based on impact and recency
  const daysSinceEvent = (Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60 * 24);
  const recencyDecay = Math.max(0, 1 - (daysSinceEvent / 90)); // 90-day decay
  this.value = Math.round(this.impactScore * recencyDecay);

  next();
});

const Interaction = mongoose.model('Interaction', interactionSchema);

export default Interaction;
