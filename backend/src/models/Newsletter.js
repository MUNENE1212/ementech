import mongoose from 'mongoose';

const newsletterSchema = new mongoose.Schema({
  // ========== Core Newsletter Information ==========
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  description: String,

  // ========== Newsletter Type ==========
  newsletterType: {
    type: String,
    enum: ['tech-insights', 'growth-hacks', 'investor-updates', 'product-updates', 'weekly-digest', 'custom'],
    required: true
  },

  // ========== Frequency ==========
  frequency: {
    type: String,
    enum: ['daily', 'weekly', 'bi-weekly', 'monthly', 'quarterly', 'as-needed'],
    required: true
  },
  sendDays: [{
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  }],
  sendTime: {
    type: String,
    default: '09:00'
  },
  timezone: {
    type: String,
    default: 'Africa/Nairobi'
  },

  // ========== Target Audience ==========
  targetAudience: {
    seniority: [{
      type: String,
      enum: ['c-level', 'vp', 'director', 'manager', 'individual-contributor', 'all']
    }],
    companySize: [{
      type: String,
      enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+', 'all']
    }],
    industries: [String],
    interests: [String]
  },

  // ========== Content Strategy ==========
  contentFocus: [String], // e.g., ['AI trends', 'Best practices', 'Case studies']
  typicalTopics: [String],
  tone: {
    type: String,
    enum: ['professional', 'casual', 'technical', 'conversational'],
    default: 'professional'
  },

  // ========== Subscription Settings ==========
  requiresDoubleOptIn: {
    type: Boolean,
    default: true
  },
  welcomeEmail: {
    subject: String,
    body: String,
    sendImmediately: {
      type: Boolean,
      default: true
    }
  },
  confirmationEmail: {
    subject: String,
    body: String
  },

  // ========== Status ==========
  status: {
    type: String,
    enum: ['active', 'paused', 'archived'],
    default: 'active'
  },

  // ========== Metrics ==========
  metrics: {
    totalSubscribers: {
      type: Number,
      default: 0
    },
    activeSubscribers: {
      type: Number,
      default: 0
    }, // Subscribed and engaged in last 90 days
    totalCampaigns: {
      type: Number,
      default: 0
    },
    avgOpenRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    avgClickRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    avgBounceRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    totalUnsubscribes: {
      type: Number,
      default: 0
    }
  },

  // ========== Design & Branding ==========
  template: {
    type: String,
    enum: ['modern', 'classic', 'minimal', 'custom'],
    default: 'modern'
  },
  primaryColor: String,
  logoUrl: String,
  headerImage: String,
  footerText: String,

  // ========== Social & Sharing ==========
  socialLinks: {
    website: String,
    twitter: String,
    linkedin: String,
    facebook: String
  },

  // ========== Automation ==========
  autoSend: {
    enabled: {
      type: Boolean,
      default: false
    },
    nextSendDate: Date
  },

  // ========== Featured ==========
  featured: {
    type: Boolean,
    default: false
  },
  displayOrder: {
    type: Number,
    default: 0
  },

  // ========== Custom Fields ==========
  customFields: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },

  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Subscription schema (embedded in leads, but also tracked here)
const subscriptionSchema = new mongoose.Schema({
  leadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead',
    required: true,
    index: true
  },
  newsletterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Newsletter',
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'unsubscribed', 'bounced', 'cleaned'],
    default: 'pending'
  },
  subscribedAt: {
    type: Date,
    default: Date.now
  },
  confirmedAt: Date,
  unsubscribedAt: Date,
  unsubscribeReason: String,

  // Engagement tracking
  metrics: {
    emailsSent: {
      type: Number,
      default: 0
    },
    emailsOpened: {
      type: Number,
      default: 0
    },
    emailsClicked: {
      type: Number,
      default: 0
    },
    lastOpenedAt: Date,
    lastClickedAt: Date
  },

  // Customization preferences
  preferences: {
    format: {
      type: String,
      enum: ['html', 'text', 'both'],
      default: 'html'
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'bi-weekly', 'monthly'],
      default: 'weekly'
    }
  },

  customFields: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Campaign schema
const campaignSchema = new mongoose.Schema({
  newsletterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Newsletter',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  preheader: String,

  // Content
  body: String, // HTML content
  plainTextBody: String,
  templateId: String,

  // Targeting
  segment: {
    type: String,
    enum: ['all', 'active', 'engaged', 'recent', 'custom'],
    default: 'all'
  },
  segmentCriteria: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },

  // Scheduling
  scheduledFor: Date,
  sentAt: Date,
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled'],
    default: 'draft'
  },

  // Metrics
  metrics: {
    recipients: {
      type: Number,
      default: 0
    },
    delivered: {
      type: Number,
      default: 0
    },
    opened: {
      type: Number,
      default: 0
    },
    uniqueOpens: {
      type: Number,
      default: 0
    },
    clicked: {
      type: Number,
      default: 0
    },
    uniqueClicks: {
      type: Number,
      default: 0
    },
    bounces: {
      type: Number,
      default: 0
    },
    unsubscribes: {
      type: Number,
      default: 0
    },
    complaints: {
      type: Number,
      default: 0
    },
    openRate: {
      type: Number,
      default: 0
    },
    clickRate: {
      type: Number,
      default: 0
    },
    bounceRate: {
      type: Number,
      default: 0
    }
  },

  // Links tracking
  links: [{
    url: String,
    title: String,
    clicks: Number,
    uniqueClicks: Number
  }],

  // A/B Testing
  abTest: {
    enabled: Boolean,
    variants: [{
      name: String,
      subject: String,
      body: String,
      sent: Number,
      openRate: Number,
      clickRate: Number
    }],
    winner: String
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// ========== Newsletter Indexes ==========
// Note: slug already has unique index from schema definition
newsletterSchema.index({ status: 1 });
newsletterSchema.index({ newsletterType: 1 });
newsletterSchema.index({ featured: 1, displayOrder: 1 });

// ========== Subscription Indexes ==========
subscriptionSchema.index({ leadId: 1, newsletterId: 1 }, { unique: true });
subscriptionSchema.index({ newsletterId: 1, status: 1 });
subscriptionSchema.index({ status: 1, subscribedAt: -1 });

// ========== Campaign Indexes ==========
campaignSchema.index({ newsletterId: 1, status: 1 });
campaignSchema.index({ status: 1, scheduledFor: 1 });
campaignSchema.index({ sentAt: -1 });

// ========== Newsletter Methods ==========

// Generate slug from name
newsletterSchema.pre('save', function(next) {
  this.updatedAt = new Date();

  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  next();
});

// Get active subscribers
newsletterSchema.methods.getActiveSubscribers = async function() {
  const Subscription = mongoose.model('NewsletterSubscription');
  const subscribers = await Subscription.find({
    newsletterId: this._id,
    status: 'active'
  })
    .populate('leadId')
    .lean();

  return subscribers;
};

// Update metrics
newsletterSchema.methods.updateMetrics = async function() {
  const Subscription = mongoose.model('NewsletterSubscription');
  const Campaign = mongoose.model('NewsletterCampaign');

  const activeSubs = await Subscription.countDocuments({
    newsletterId: this._id,
    status: 'active'
  });

  const campaigns = await Campaign.find({ newsletterId: this._id });

  let totalOpenRate = 0;
  let totalClickRate = 0;

  campaigns.forEach(campaign => {
    if (campaign.metrics.openRate > 0) {
      totalOpenRate += campaign.metrics.openRate;
    }
    if (campaign.metrics.clickRate > 0) {
      totalClickRate += campaign.metrics.clickRate;
    }
  });

  this.metrics.totalSubscribers = activeSubs;
  this.metrics.activeSubscribers = activeSubs;
  this.metrics.totalCampaigns = campaigns.length;
  this.metrics.avgOpenRate = campaigns.length > 0 ? totalOpenRate / campaigns.length : 0;
  this.metrics.avgClickRate = campaigns.length > 0 ? totalClickRate / campaigns.length : 0;

  await this.save();
};

// ========== Campaign Methods ==========

// Send campaign
campaignSchema.methods.send = async function() {
  const Newsletter = mongoose.model('Newsletter');
  const Subscription = mongoose.model('NewsletterSubscription');

  const newsletter = await Newsletter.findById(this.newsletterId);
  if (!newsletter) {
    throw new Error('Newsletter not found');
  }

  // Get subscribers based on segment
  const query = { newsletterId: this.newsletterId, status: 'active' };

  if (this.segment === 'engaged') {
    query['metrics.emailsOpened'] = { $gte: 1 };
  } else if (this.segment === 'recent') {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    query.subscribedAt = { $gte: thirtyDaysAgo };
  }

  const subscribers = await Subscription.find(query).populate('leadId');

  this.status = 'sending';
  this.metrics.recipients = subscribers.length;
  await this.save();

  // TODO: Integrate with email service to send emails
  // This would typically use Nodemailer, SendGrid, or similar

  this.status = 'sent';
  this.sentAt = new Date();
  await this.save();

  // Update newsletter metrics
  await newsletter.updateMetrics();

  return subscribers.length;
};

// Update campaign metrics
campaignSchema.methods.updateMetrics = async function() {
  const Subscription = mongoose.model('NewsletterSubscription');

  // Get all subscriptions that received this campaign
  const subscriptions = await Subscription.find({
    newsletterId: this.newsletterId,
    'metrics.emailsSent': { $gt: 0 }
  });

  let totalOpened = 0;
  let totalClicked = 0;
  let totalBounced = 0;
  let totalUnsubscribed = 0;

  subscriptions.forEach(sub => {
    totalOpened += sub.metrics.emailsOpened || 0;
    totalClicked += sub.metrics.emailsClicked || 0;
  });

  this.metrics.opened = totalOpened;
  this.metrics.uniqueOpens = totalOpened; // Simplified
  this.metrics.clicked = totalClicked;
  this.metrics.uniqueClicks = totalClicked; // Simplified

  if (this.metrics.recipients > 0) {
    this.metrics.openRate = ((totalOpened / this.metrics.recipients) * 100).toFixed(2);
    this.metrics.clickRate = ((totalClicked / this.metrics.recipients) * 100).toFixed(2);
    this.metrics.bounceRate = ((totalBounced / this.metrics.recipients) * 100).toFixed(2);
  }

  await this.save();
};

// ========== Static Methods ==========

// Get available newsletters for subscription
newsletterSchema.statics.getAvailable = async function() {
  return await this.find({ status: 'active' })
    .sort({ featured: -1, displayOrder: 1, name: 1 })
    .lean();
};

// Subscribe lead to newsletter
subscriptionSchema.statics.subscribe = async function(leadId, newsletterId) {
  // Check if already subscribed
  const existing = await this.findOne({ leadId, newsletterId });
  if (existing) {
    if (existing.status === 'unsubscribed') {
      // Resubscribe
      existing.status = 'active';
      existing.subscribedAt = new Date();
      existing.unsubscribedAt = null;
      existing.unsubscribeReason = null;
      return await existing.save();
    }
    return existing;
  }

  // Create new subscription
  const subscription = await this.create({
    leadId,
    newsletterId,
    status: 'pending' // Will be confirmed after double opt-in
  });

  return subscription;
};

// Unsubscribe
subscriptionSchema.statics.unsubscribe = async function(leadId, newsletterId, reason = '') {
  const subscription = await this.findOne({ leadId, newsletterId });
  if (subscription) {
    subscription.status = 'unsubscribed';
    subscription.unsubscribedAt = new Date();
    subscription.unsubscribeReason = reason;
    await subscription.save();
  }
  return subscription;
};

// Track email open
subscriptionSchema.statics.trackOpen = async function(subscriptionId) {
  const subscription = await this.findById(subscriptionId);
  if (subscription) {
    subscription.metrics.emailsOpened += 1;
    subscription.metrics.lastOpenedAt = new Date();
    await subscription.save();
  }
  return subscription;
};

// Track email click
subscriptionSchema.statics.trackClick = async function(subscriptionId) {
  const subscription = await this.findById(subscriptionId);
  if (subscription) {
    subscription.metrics.emailsClicked += 1;
    subscription.metrics.lastClickedAt = new Date();
    await subscription.save();
  }
  return subscription;
};

const Newsletter = mongoose.model('Newsletter', newsletterSchema);
const NewsletterSubscription = mongoose.model('NewsletterSubscription', subscriptionSchema);
const NewsletterCampaign = mongoose.model('NewsletterCampaign', campaignSchema);

export { NewsletterSubscription, NewsletterCampaign };
export default Newsletter;
