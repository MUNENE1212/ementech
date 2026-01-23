import mongoose from 'mongoose';

const leadSchema = new mongoose.Schema({
  // ========== Core Contact Information ==========
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    index: true
  },
  name: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  company: {
    type: String,
    trim: true
  },
  jobTitle: {
    type: String,
    trim: true
  },

  // ========== Progressive Profiling Fields ==========
  // Profile Stage (1=Anonymous, 2=Identified, 3=Qualified, 4=Opportunity)
  profileStage: {
    type: Number,
    default: 2,
    min: 1,
    max: 4
  },

  // Company Details
  companySize: {
    type: String,
    enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+']
  },
  industry: {
    type: String,
    trim: true
  },
  website: {
    type: String,
    trim: true
  },

  // Role & Authority
  department: {
    type: String,
    trim: true
  },
  seniority: {
    type: String,
    enum: ['c-level', 'vp', 'director', 'manager', 'individual-contributor', 'other']
  },
  decisionMaker: {
    type: Boolean,
    default: false
  },

  // Project Details (Qualified Stage)
  budget: {
    type: String,
    enum: ['<5k', '5k-10k', '10k-25k', '25k-50k', '50k-100k', '100k+']
  },
  timeline: {
    type: String,
    enum: ['immediate', '1-3-months', '3-6-months', '6-12-months', 'exploring']
  },
  challenges: [{
    type: String
  }],
  goals: [{
    type: String
  }],
  techStack: [{
    type: String
  }],

  // ========== Lead Source Tracking ==========
  source: {
    type: String,
    enum: ['newsletter', 'event', 'survey', 'offer', 'meetup', 'contact', 'download', 'chatbot', 'referral', 'other'],
    required: true
  },
  sourceDetails: {
    type: String,
    trim: true
  },
  campaign: {
    type: String,
    trim: true
  },
  referralSource: String,

  // ========== Interests & Preferences ==========
  interests: [{
    type: String,
    enum: ['software-development', 'web-development', 'mobile-apps', 'cloud-services', 'consulting', 'training', 'products', 'ai-integration', 'other']
  }],
  services: [{
    type: String
  }],
  preferredContactMethod: {
    type: String,
    enum: ['email', 'phone', 'whatsapp', 'linkedin'],
    default: 'email'
  },

  // ========== Lead Status Management ==========
  status: {
    type: String,
    enum: ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'converted', 'unqualified', 'recycled'],
    default: 'new'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  leadScore: {
    type: Number,
    default: 0,
    min: 0
  },
  qualifiedAt: {
    type: Date
  },
  convertedAt: {
    type: Date
  },

  // ========== Engagement Tracking ==========
  lastContacted: {
    type: Date
  },
  contactCount: {
    type: Number,
    default: 0
  },
  lastActivity: {
    type: Date
  },
  activityCount: {
    type: Number,
    default: 0
  },
  pageViews: {
    type: Number,
    default: 0
  },
  timeOnSite: {
    type: Number,
    default: 0
  },
  sessionCount: {
    type: Number,
    default: 1
  },

  // Notes & Interactions
  notes: [{
    content: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],

  // ========== GDPR & Privacy Compliance ==========
  consentGiven: {
    type: Boolean,
    default: false
  },
  consentDate: {
    type: Date
  },
  consentIP: String,
  privacyPolicyAccepted: {
    type: Boolean,
    default: false
  },
  marketingConsent: {
    type: Boolean,
    default: false
  },
  dataRetentionPeriod: {
    type: String,
    enum: ['1-year', '2-years', '5-years', 'indefinite'],
    default: '2-years'
  },

  // Soft Delete & Subscription Management
  isActive: {
    type: Boolean,
    default: true
  },
  unsubscribed: {
    type: Boolean,
    default: false
  },
  unsubscribeDate: {
    type: Date
  },
  unsubscribeReason: String,

  // ========== Metadata ==========
  ipAddress: String,
  userAgent: String,
  location: {
    country: String,
    city: String,
    region: String
  },
  utmSource: String,
  utmMedium: String,
  utmCampaign: String,
  utmTerm: String,
  utmContent: String,

  // Inferred Data (AI-generated, marked with confidence)
  inferredData: {
    type: Map,
    of: {
      value: mongoose.Schema.Types.Mixed,
      confidence: {
        type: Number,
        min: 0,
        max: 1
      },
      inferredAt: {
        type: Date,
        default: Date.now
      }
    }
  },

  // Custom Fields (flexible for future needs)
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
  },

  // ========== Phase 2: Lead Assignment & Pipeline ==========
  /**
   * Assignment fields for employee lead management
   * Tracks which employee owns this lead and when
   */
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  /** When the lead was assigned to current owner */
  assignedAt: Date,
  /** Who assigned this lead (for audit trail) */
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  /**
   * Pipeline Stage Management
   * Tracks the sales pipeline stage with full history
   */
  pipelineStage: {
    type: String,
    enum: ['new', 'contacted', 'meeting_scheduled', 'proposal_sent', 'negotiation', 'won', 'lost'],
    default: 'new'
  },
  /** Full history of pipeline stage transitions for analytics */
  pipelineStageHistory: [{
    stage: String,
    enteredAt: Date,
    exitedAt: Date,
    duration: Number, // Duration in stage (hours)
    notes: String
  }],

  /**
   * Value Tracking
   * Estimated deal value and probability for forecasting
   */
  estimatedValue: {
    type: Number,
    min: 0,
    default: 0
  },
  /** Probability of closing (0-100%) */
  probability: {
    type: Number,
    min: 0,
    max: 100,
    default: 50
  },

  /**
   * Tags for segmentation and filtering
   * Enables custom categorization beyond standard fields
   */
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],

  /**
   * Personalization dates for relationship building
   * Used for automated birthday/anniversary messages
   */
  dateOfBirth: Date,
  /** Company founding date for anniversary messages */
  companyAnniversary: Date,

  /**
   * Active Email Sequences
   * Tracks which automated sequences this lead is currently enrolled in
   */
  activeSequences: [{
    sequenceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sequence',
      required: true
    },
    /** When the lead was enrolled in this sequence */
    enrolledAt: {
      type: Date,
      default: Date.now
    },
    /** Current status in this sequence */
    status: {
      type: String,
      enum: ['active', 'paused'],
      default: 'active'
    },
    /** Current step index (0-based) */
    stepIndex: {
      type: Number,
      default: 0,
      min: 0
    },
    /** When the last email was sent for this sequence */
    lastEmailSentAt: Date,
    /** When the sequence was paused */
    pausedAt: Date,
    /** When the sequence was resumed (if applicable) */
    resumedAt: Date,
    /** Estimated time for next email */
    nextEmailAt: Date,
  }],

  /**
   * Completed Sequences
   * Tracks sequence history for leads who completed/unsubscribed
   */
  completedSequences: [{
    sequenceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sequence',
      required: true
    },
    /** When enrollment was completed/ended */
    completedAt: {
      type: Date,
      default: Date.now
    },
    /** How the enrollment ended */
    status: {
      type: String,
      enum: ['completed', 'unsubscribed', 'bounced', 'removed'],
      default: 'completed'
    },
    /** Final step reached */
    finalStepIndex: {
      type: Number,
      default: 0,
      min: 0
    },
    /** Reason for completion status */
    reason: String,
  }],

  /**
   * Sequence History
   * Full audit trail of all sequence enrollments
   */
  sequenceHistory: [{
    sequenceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sequence',
      required: true
    },
    sequenceName: String,
    /** Action taken */
    action: {
      type: String,
      enum: ['enrolled', 'paused', 'resumed', 'completed', 'unsubscribed', 'removed'],
    },
    /** When the action occurred */
    timestamp: {
      type: Date,
      default: Date.now
    },
    /** Step index at time of action */
    stepIndex: {
      type: Number,
      default: 0
    },
    /** Additional context */
    notes: String,
    /** Who triggered the action (system/user ID) */
    triggeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
  }],

  /**
   * Pending Sequence Emails
   * Tracks scheduled sequence emails waiting to be sent
   */
  pendingSequenceEmails: [{
    sequenceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sequence',
    },
    stepOrder: Number,
    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EmailTemplate',
    },
    scheduledFor: Date,
    sentAt: Date,
    status: {
      type: String,
      enum: ['pending', 'sent', 'failed', 'cancelled'],
      default: 'pending'
    },
    failureReason: String,
  }]
});

// ========== Indexes for Performance ==========
leadSchema.index({ email: 1, source: 1 });
leadSchema.index({ status: 1, createdAt: -1 });
leadSchema.index({ source: 1, isActive: 1 });
leadSchema.index({ leadScore: -1 });
leadSchema.index({ profileStage: 1, status: 1 });
leadSchema.index({ convertedAt: 1 });
leadSchema.index({ unsubscribed: 1, isActive: 1 });
leadSchema.index({ lastActivity: -1 });

// ========== Phase 2: Additional Indexes ==========
// Compound index for assignment queries
leadSchema.index({ assignedTo: 1, isActive: 1 });
// Compound index for pipeline stage queries
leadSchema.index({ pipelineStage: 1, isActive: 1 });
// Index for tag-based filtering
leadSchema.index({ tags: 1 });
// Index for birthday queries (used for automated personalization)
leadSchema.index({ dateOfBirth: 1 });
// Index for company anniversary queries
leadSchema.index({ companyAnniversary: 1 });
// Compound index for value-based prioritization
leadSchema.index({ estimatedValue: -1, probability: -1 });

// Phase 4: Sequence enrollment indexes
// Index for finding leads in specific sequences
leadSchema.index({ 'activeSequences.sequenceId': 1, 'activeSequences.status': 1 });
// Index for completed sequences lookup
leadSchema.index({ 'completedSequences.sequenceId': 1 });
// Index for sequence history lookup
leadSchema.index({ 'sequenceHistory.sequenceId': 1 });
// Index for pending sequence emails
leadSchema.index({ 'pendingSequenceEmails.scheduledFor': 1, 'pendingSequenceEmails.status': 1 });

// ========== Virtuals ==========
leadSchema.virtual('daysSinceLastActivity').get(function() {
  if (!this.lastActivity) return null;
  return Math.floor((Date.now() - this.lastActivity) / (1000 * 60 * 60 * 24));
});

leadSchema.virtual('profileCompleteness').get(function() {
  const requiredFields = ['email', 'name', 'company', 'jobTitle', 'companySize', 'industry'];
  const completed = requiredFields.filter(field => this[field]);
  return Math.round((completed.length / requiredFields.length) * 100);
});

// ========== Methods ==========

// Calculate lead score based on multiple factors
leadSchema.methods.calculateLeadScore = function() {
  let score = 0;

  // Profile completeness (up to 20 points)
  const completeness = this.profileCompleteness;
  score += (completeness / 100) * 20;

  // Job title seniority (up to 15 points)
  const seniorityScores = {
    'c-level': 15,
    'vp': 12,
    'director': 10,
    'manager': 7,
    'individual-contributor': 4,
    'other': 2
  };
  score += seniorityScores[this.seniority] || 0;

  // Company size (up to 10 points)
  const companySizeScores = {
    '1000+': 10,
    '501-1000': 9,
    '201-500': 7,
    '51-200': 5,
    '11-50': 3,
    '1-10': 1
  };
  score += companySizeScores[this.companySize] || 0;

  // Budget (up to 20 points)
  const budgetScores = {
    '100k+': 20,
    '50k-100k': 17,
    '25k-50k': 14,
    '10k-25k': 10,
    '5k-10k': 5,
    '<5k': 2
  };
  score += budgetScores[this.budget] || 0;

  // Timeline urgency (up to 15 points)
  const timelineScores = {
    'immediate': 15,
    '1-3-months': 12,
    '3-6-months': 8,
    '6-12-months': 4,
    'exploring': 1
  };
  score += timelineScores[this.timeline] || 0;

  // Engagement level (up to 20 points)
  if (this.activityCount > 10) score += 10;
  else if (this.activityCount > 5) score += 7;
  else if (this.activityCount > 2) score += 4;
  else if (this.activityCount >= 1) score += 2;

  if (this.sessionCount > 5) score += 10;
  else if (this.sessionCount > 3) score += 7;
  else if (this.sessionCount > 1) score += 4;

  // Decision maker bonus (up to 10 points)
  if (this.decisionMaker) score += 10;

  // Marketing consent (shows interest)
  if (this.marketingConsent) score += 5;

  // Source quality (up to 10 points)
  const sourceScores = {
    'referral': 10,
    'event': 9,
    'chatbot': 8,
    'contact': 7,
    'download': 6,
    'survey': 5,
    'newsletter': 4,
    'offer': 3,
    'meetup': 7,
    'other': 2
  };
  score += sourceScores[this.source] || 0;

  this.leadScore = Math.round(score);
  return this.leadScore;
};

// Update profile stage based on completeness
leadSchema.methods.updateProfileStage = function() {
  const completeness = this.profileCompleteness / 100;
  const hasBudget = !!this.budget;
  const hasTimeline = !!this.timeline;

  if (completeness >= 0.8 && hasBudget && hasTimeline) {
    this.profileStage = 4; // Opportunity
    if (this.status === 'new') {
      this.status = 'qualified';
      this.qualifiedAt = new Date();
    }
  } else if (completeness >= 0.5) {
    this.profileStage = 3; // Qualified
    if (this.status === 'new') {
      this.status = 'contacted';
    }
  } else if (completeness >= 0.25) {
    this.profileStage = 2; // Identified
  } else {
    this.profileStage = 1; // Anonymous
  }

  return this.profileStage;
};

// ========== Phase 2: Instance Methods ==========

/**
 * Assign this lead to an employee
 * Updates assignment fields and tracks who made the assignment
 *
 * @param {string|ObjectId} userId - The user ID to assign the lead to
 * @param {string|ObjectId} assignedBy - The user ID making the assignment
 * @returns {Promise<Lead>} The updated lead document
 *
 * @example
 * const lead = await Lead.findById(leadId);
 * await lead.assignTo(employeeId, adminId);
 * await lead.save();
 */
leadSchema.methods.assignTo = function(userId, assignedBy) {
  // If previously assigned, handle reassignment tracking here if needed
  this.assignedTo = userId;
  this.assignedAt = new Date();
  this.assignedBy = assignedBy;
  return this;
};

/**
 * Move lead to a new pipeline stage
 * Records stage history with duration for analytics
 *
 * @param {string} newStage - The new pipeline stage
 * @param {string} [notes] - Optional notes about the stage change
 * @returns {Promise<Lead>} The updated lead document
 *
 * @example
 * const lead = await Lead.findById(leadId);
 * await lead.moveToStage('meeting_scheduled', 'Demo scheduled for Tuesday');
 * await lead.save();
 */
leadSchema.methods.moveToStage = function(newStage, notes) {
  const validStages = ['new', 'contacted', 'meeting_scheduled', 'proposal_sent', 'negotiation', 'won', 'lost'];
  if (!validStages.includes(newStage)) {
    throw new Error(`Invalid pipeline stage: ${newStage}`);
  }

  const oldStage = this.pipelineStage;
  const now = new Date();

  // Find the current stage entry in history and close it
  if (this.pipelineStageHistory && this.pipelineStageHistory.length > 0) {
    const currentStageEntry = this.pipelineStageHistory.find(h => !h.exitedAt);
    if (currentStageEntry) {
      currentStageEntry.exitedAt = now;
      // Calculate duration in hours
      if (currentStageEntry.enteredAt) {
        const durationMs = now - currentStageEntry.enteredAt;
        currentStageEntry.duration = Math.round(durationMs / (1000 * 60 * 60) * 100) / 100; // Hours with 2 decimals
      }
    }
  }

  // Add new stage entry to history
  if (!this.pipelineStageHistory) {
    this.pipelineStageHistory = [];
  }
  this.pipelineStageHistory.push({
    stage: newStage,
    enteredAt: now,
    notes: notes || `Moved from ${oldStage} to ${newStage}`
  });

  // Update current stage
  this.pipelineStage = newStage;

  // Auto-update probability based on stage progression
  this.updateProbabilityByStage(newStage);

  return this;
};

/**
 * Update probability based on pipeline stage
 * Internal helper method called by moveToStage
 *
 * @param {string} stage - The current pipeline stage
 * @private
 */
leadSchema.methods.updateProbabilityByStage = function(stage) {
  const stageProbabilities = {
    'new': 10,
    'contacted': 25,
    'meeting_scheduled': 50,
    'proposal_sent': 60,
    'negotiation': 75,
    'won': 100,
    'lost': 0
  };
  this.probability = stageProbabilities[stage] || 50;
};

/**
 * Add a tag to the lead
 * Prevents duplicate tags
 *
 * @param {string} tag - The tag to add
 * @returns {boolean} True if tag was added, false if already exists
 *
 * @example
 * const lead = await Lead.findById(leadId);
 * lead.addTag('high-priority');
 * await lead.save();
 */
leadSchema.methods.addTag = function(tag) {
  if (!tag || typeof tag !== 'string') {
    return false;
  }

  const normalizedTag = tag.toLowerCase().trim();

  if (!this.tags) {
    this.tags = [];
  }

  if (!this.tags.includes(normalizedTag)) {
    this.tags.push(normalizedTag);
    return true;
  }
  return false;
};

/**
 * Remove a tag from the lead
 *
 * @param {string} tag - The tag to remove
 * @returns {boolean} True if tag was removed, false if not found
 *
 * @example
 * const lead = await Lead.findById(leadId);
 * lead.removeTag('low-priority');
 * await lead.save();
 */
leadSchema.methods.removeTag = function(tag) {
  if (!tag || typeof tag !== 'string') {
    return false;
  }

  const normalizedTag = tag.toLowerCase().trim();

  if (!this.tags) {
    return false;
  }

  const index = this.tags.indexOf(normalizedTag);
  if (index > -1) {
    this.tags.splice(index, 1);
    return true;
  }
  return false;
};

/**
 * Calculate estimated value based on lead profile
 * Uses company size, budget, industry, and job seniority
 *
 * @returns {number} Estimated value in currency units
 *
 * @example
 * const lead = await Lead.findById(leadId);
 * const estimatedValue = lead.calculateValue();
 */
leadSchema.methods.calculateValue = function() {
  let baseValue = 0;

  // Value by company size
  const sizeValues = {
    '1-10': 5000,
    '11-50': 15000,
    '51-200': 50000,
    '201-500': 100000,
    '501-1000': 250000,
    '1000+': 500000
  };

  // Value by budget range (midpoint approximation)
  const budgetValues = {
    '<5k': 2500,
    '5k-10k': 7500,
    '10k-25k': 17500,
    '25k-50k': 37500,
    '50k-100k': 75000,
    '100k+': 150000
  };

  // Value by seniority (multiplier)
  const seniorityMultipliers = {
    'c-level': 2.0,
    'vp': 1.5,
    'director': 1.3,
    'manager': 1.1,
    'individual-contributor': 1.0,
    'other': 1.0
  };

  // Start with budget-based value if available
  if (this.budget && budgetValues[this.budget]) {
    baseValue = budgetValues[this.budget];
  } else if (this.companySize && sizeValues[this.companySize]) {
    baseValue = sizeValues[this.companySize];
  }

  // Apply seniority multiplier
  if (this.seniority && seniorityMultipliers[this.seniority]) {
    baseValue *= seniorityMultipliers[this.seniority];
  }

  // Decision maker bonus
  if (this.decisionMaker) {
    baseValue *= 1.5;
  }

  // Apply probability as a factor
  const finalValue = baseValue * (this.probability / 100);

  this.estimatedValue = Math.round(finalValue);
  return this.estimatedValue;
};

/**
 * Check if lead has upcoming birthday (within next 7 days)
 * Used for automated birthday campaigns
 *
 * @returns {Date|null} Next birthday date or null
 */
leadSchema.methods.getUpcomingBirthday = function() {
  if (!this.dateOfBirth) return null;

  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  const nextBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());

  // If birthday has passed this year, get next year's
  if (nextBirthday < today) {
    nextBirthday.setFullYear(today.getFullYear() + 1);
  }

  // Check if within next 7 days
  const daysUntilBirthday = Math.ceil((nextBirthday - today) / (1000 * 60 * 60 * 24));
  return daysUntilBirthday <= 7 ? nextBirthday : null;
};

/**
 * Check if lead has upcoming company anniversary (within next 30 days)
 * Used for automated anniversary campaigns
 *
 * @returns {Date|null} Next anniversary date or null
 */
leadSchema.methods.getUpcomingAnniversary = function() {
  if (!this.companyAnniversary) return null;

  const today = new Date();
  const anniversaryDate = new Date(this.companyAnniversary);
  const nextAnniversary = new Date(today.getFullYear(), anniversaryDate.getMonth(), anniversaryDate.getDate());

  if (nextAnniversary < today) {
    nextAnniversary.setFullYear(today.getFullYear() + 1);
  }

  const daysUntilAnniversary = Math.ceil((nextAnniversary - today) / (1000 * 60 * 60 * 24));
  return daysUntilAnniversary <= 30 ? nextAnniversary : null;
};

// ========== Phase 2: Static Methods ==========

/**
 * Get all leads assigned to a specific user
 *
 * @param {string|ObjectId} userId - The user ID to find leads for
 * @param {Object} [options] - Query options
 * @param {boolean} [options.activeOnly=true] - Only return active leads
 * @param {string} [options.sort='-assignedAt'] - Sort order
 * @returns {Promise<Lead[]>} Array of assigned leads
 *
 * @example
 * const myLeads = await Lead.getByAssignee(userId, { activeOnly: true });
 */
leadSchema.statics.getByAssignee = async function(userId, options = {}) {
  const { activeOnly = true, sort = '-assignedAt' } = options;

  const query = { assignedTo: userId };
  if (activeOnly) {
    query.isActive = true;
  }

  return this.find(query).sort(sort).populate('assignedBy', 'name email');
};

/**
 * Get pipeline snapshot - counts by stage
 * Useful for Kanban board and dashboard widgets
 *
 * @returns {Promise<Object>} Object with stage names as keys and counts as values
 *
 * @example
 * const snapshot = await Lead.getPipelineSnapshot();
 * // Returns: { new: 10, contacted: 5, meeting_scheduled: 3, ... }
 */
leadSchema.statics.getPipelineSnapshot = async function() {
  const stages = ['new', 'contacted', 'meeting_scheduled', 'proposal_sent', 'negotiation', 'won', 'lost'];

  const pipelineData = await this.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: '$pipelineStage',
        count: { $sum: 1 },
        totalValue: { $sum: { $ifNull: ['$estimatedValue', 0] } }
      }
    }
  ]);

  // Build result object with all stages
  const result = {};
  stages.forEach(stage => {
    const stageData = pipelineData.find(d => d._id === stage);
    result[stage] = {
      count: stageData ? stageData.count : 0,
      totalValue: stageData ? stageData.totalValue : 0
    };
  });

  return result;
};

/**
 * Find leads by tag
 *
 * @param {string} tag - The tag to search for
 * @param {Object} [options] - Query options
 * @param {boolean} [options.activeOnly=true] - Only return active leads
 * @returns {Promise<Lead[]>} Array of leads with the specified tag
 *
 * @example
 * const highPriorityLeads = await Lead.findByTag('high-priority');
 */
leadSchema.statics.findByTag = async function(tag, options = {}) {
  const { activeOnly = true } = options;

  const query = { tags: tag.toLowerCase().trim() };
  if (activeOnly) {
    query.isActive = true;
  }

  return this.find(query).sort('-createdAt');
};

/**
 * Get leads with upcoming birthdays
 * Returns leads whose birthday is within the specified days
 *
 * @param {number} [daysAhead=7] - Days to look ahead
 * @returns {Promise<Lead[]>} Array of leads with upcoming birthdays
 *
 * @example
 * const birthdayLeads = await Lead.getUpcomingBirthdays(7);
 */
leadSchema.statics.getUpcomingBirthdays = async function(daysAhead = 7) {
  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + daysAhead);

  // Get all leads with birthdays (filtering done in-memory due to date complexity)
  const leads = await this.find({
    dateOfBirth: { $exists: true, $ne: null },
    isActive: true
  });

  // Filter leads with upcoming birthdays
  return leads.filter(lead => lead.getUpcomingBirthday() !== null);
};

/**
 * Get leads with upcoming company anniversaries
 *
 * @param {number} [daysAhead=30] - Days to look ahead
 * @returns {Promise<Lead[]>} Array of leads with upcoming anniversaries
 *
 * @example
 * const anniversaryLeads = await Lead.getUpcomingAnniversaries(30);
 */
leadSchema.statics.getUpcomingAnniversaries = async function(daysAhead = 30) {
  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + daysAhead);

  const leads = await this.find({
    companyAnniversary: { $exists: true, $ne: null },
    isActive: true
  });

  return leads.filter(lead => lead.getUpcomingAnniversary() !== null);
};

/**
 * Get leads enrolled in a specific sequence
 *
 * @param {string|ObjectId} sequenceId - The sequence ID
 * @param {Object} [options] - Query options
 * @returns {Promise<Lead[]>} Array of leads enrolled in the sequence
 *
 * @example
 * const enrolledLeads = await Lead.getBySequence(sequenceId);
 */
leadSchema.statics.getBySequence = async function(sequenceId, options = {}) {
  const { status = 'active' } = options;

  return this.find({
    'activeSequences.sequenceId': sequenceId,
    'activeSequences.status': status,
    isActive: true
  });
};

/**
 * Enroll a lead in a sequence
 *
 * @param {string|ObjectId} sequenceId - The sequence ID
 * @param {Object} [options] - Enrollment options
 * @returns {Promise<Lead>} The updated lead
 *
 * @example
 * await lead.enrollInSequence(sequenceId);
 * await lead.save();
 */
leadSchema.methods.enrollInSequence = function(sequenceId, options = {}) {
  const { stepIndex = 0, status = 'active' } = options;

  // Check if already enrolled
  const existingEnrollment = this.activeSequences?.find(
    s => s.sequenceId.toString() === sequenceId.toString()
  );

  if (existingEnrollment) {
    throw new Error('Lead is already enrolled in this sequence');
  }

  // Initialize arrays if needed
  if (!this.activeSequences) {
    this.activeSequences = [];
  }
  if (!this.sequenceHistory) {
    this.sequenceHistory = [];
  }

  // Add enrollment
  this.activeSequences.push({
    sequenceId,
    enrolledAt: new Date(),
    status,
    stepIndex,
  });

  // Add to history
  this.sequenceHistory.push({
    sequenceId,
    action: 'enrolled',
    timestamp: new Date(),
    stepIndex: 0,
  });

  return this;
};

/**
 * Unsubscribe a lead from a sequence
 *
 * @param {string|ObjectId} sequenceId - The sequence ID
 * @param {string} [reason] - Reason for unsubscribing
 * @returns {Promise<Lead>} The updated lead
 *
 * @example
 * await lead.unsubscribeFromSequence(sequenceId, 'User requested');
 * await lead.save();
 */
leadSchema.methods.unsubscribeFromSequence = function(sequenceId, reason) {
  // Find enrollment
  const enrollmentIndex = this.activeSequences?.findIndex(
    s => s.sequenceId.toString() === sequenceId.toString()
  );

  if (enrollmentIndex === -1 || enrollmentIndex === undefined) {
    throw new Error('Lead is not enrolled in this sequence');
  }

  const enrollment = this.activeSequences[enrollmentIndex];

  // Initialize completed sequences if needed
  if (!this.completedSequences) {
    this.completedSequences = [];
  }
  if (!this.sequenceHistory) {
    this.sequenceHistory = [];
  }

  // Add to completed with unsubscribed status
  this.completedSequences.push({
    sequenceId,
    completedAt: new Date(),
    status: 'unsubscribed',
    finalStepIndex: enrollment.stepIndex || 0,
    reason: reason || 'Manually unsubscribed',
  });

  // Add to history
  this.sequenceHistory.push({
    sequenceId,
    action: 'unsubscribed',
    timestamp: new Date(),
    stepIndex: enrollment.stepIndex || 0,
    notes: reason,
  });

  // Remove from active
  this.activeSequences.splice(enrollmentIndex, 1);

  return this;
};

/**
 * Pause a sequence for this lead
 *
 * @param {string|ObjectId} sequenceId - The sequence ID
 * @returns {Promise<Lead>} The updated lead
 *
 * @example
 * await lead.pauseSequence(sequenceId);
 * await lead.save();
 */
leadSchema.methods.pauseSequence = function(sequenceId) {
  const enrollment = this.activeSequences?.find(
    s => s.sequenceId.toString() === sequenceId.toString()
  );

  if (!enrollment) {
    throw new Error('Lead is not enrolled in this sequence');
  }

  if (enrollment.status === 'paused') {
    return this; // Already paused
  }

  enrollment.status = 'paused';
  enrollment.pausedAt = new Date();

  // Add to history
  if (!this.sequenceHistory) {
    this.sequenceHistory = [];
  }

  this.sequenceHistory.push({
    sequenceId,
    action: 'paused',
    timestamp: new Date(),
    stepIndex: enrollment.stepIndex || 0,
  });

  return this;
};

/**
 * Resume a paused sequence for this lead
 *
 * @param {string|ObjectId} sequenceId - The sequence ID
 * @returns {Promise<Lead>} The updated lead
 *
 * @example
 * await lead.resumeSequence(sequenceId);
 * await lead.save();
 */
leadSchema.methods.resumeSequence = function(sequenceId) {
  const enrollment = this.activeSequences?.find(
    s => s.sequenceId.toString() === sequenceId.toString()
  );

  if (!enrollment) {
    throw new Error('Lead is not enrolled in this sequence');
  }

  if (enrollment.status !== 'paused') {
    throw new Error('Sequence is not paused for this lead');
  }

  enrollment.status = 'active';
  enrollment.resumedAt = new Date();

  // Add to history
  if (!this.sequenceHistory) {
    this.sequenceHistory = [];
  }

  this.sequenceHistory.push({
    sequenceId,
    action: 'resumed',
    timestamp: new Date(),
    stepIndex: enrollment.stepIndex || 0,
  });

  return this;
};

/**
 * Advance to the next step in a sequence
 *
 * @param {string|ObjectId} sequenceId - The sequence ID
 * @returns {Promise<Lead>} The updated lead
 *
 * @example
 * await lead.advanceSequenceStep(sequenceId);
 * await lead.save();
 */
leadSchema.methods.advanceSequenceStep = function(sequenceId) {
  const enrollment = this.activeSequences?.find(
    s => s.sequenceId.toString() === sequenceId.toString()
  );

  if (!enrollment) {
    throw new Error('Lead is not enrolled in this sequence');
  }

  enrollment.stepIndex = (enrollment.stepIndex || 0) + 1;
  enrollment.lastEmailSentAt = new Date();

  // Add to history
  if (!this.sequenceHistory) {
    this.sequenceHistory = [];
  }

  this.sequenceHistory.push({
    sequenceId,
    action: 'advanced',
    timestamp: new Date(),
    stepIndex: enrollment.stepIndex,
  });

  return this;
};

/**
 * Get the current progress for a sequence
 *
 * @param {string|ObjectId} sequenceId - The sequence ID
 * @returns {Object|null} Progress info or null if not enrolled
 *
 * @example
 * const progress = lead.getSequenceProgress(sequenceId);
 * // Returns: { stepIndex, enrolledAt, lastEmailSentAt, status }
 */
leadSchema.methods.getSequenceProgress = function(sequenceId) {
  const enrollment = this.activeSequences?.find(
    s => s.sequenceId.toString() === sequenceId.toString()
  );

  if (!enrollment) {
    // Check if completed
    const completed = this.completedSequences?.find(
      s => s.sequenceId.toString() === sequenceId.toString()
    );

    if (completed) {
      return {
        status: completed.status,
        stepIndex: completed.finalStepIndex,
        completedAt: completed.completedAt,
        reason: completed.reason,
      };
    }

    return null;
  }

  return {
    status: enrollment.status,
    stepIndex: enrollment.stepIndex || 0,
    enrolledAt: enrollment.enrolledAt,
    lastEmailSentAt: enrollment.lastEmailSentAt,
    nextEmailAt: enrollment.nextEmailAt,
    pausedAt: enrollment.pausedAt,
  };
};

/**
 * Check if lead is enrolled in any active sequences
 *
 * @returns {boolean} True if enrolled in at least one active sequence
 *
 * @example
 * if (lead.hasActiveSequences()) {
 *   console.log('Lead is in sequences');
 * }
 */
leadSchema.methods.hasActiveSequences = function() {
  return this.activeSequences && this.activeSequences.length > 0;
};

/**
 * Get all active sequences for this lead
 *
 * @returns {Array} Array of active sequence enrollments
 *
 * @example
 * const activeSequences = lead.getActiveSequences();
 */
leadSchema.methods.getActiveSequences = function() {
  return this.activeSequences?.filter(s => s.status === 'active') || [];
};

/**
 * Complete a sequence (mark as finished)
 *
 * @param {string|ObjectId} sequenceId - The sequence ID
 * @returns {Promise<Lead>} The updated lead
 *
 * @example
 * await lead.completeSequence(sequenceId);
 * await lead.save();
 */
leadSchema.methods.completeSequence = function(sequenceId) {
  const enrollmentIndex = this.activeSequences?.findIndex(
    s => s.sequenceId.toString() === sequenceId.toString()
  );

  if (enrollmentIndex === -1 || enrollmentIndex === undefined) {
    throw new Error('Lead is not enrolled in this sequence');
  }

  const enrollment = this.activeSequences[enrollmentIndex];

  // Initialize completed sequences if needed
  if (!this.completedSequences) {
    this.completedSequences = [];
  }
  if (!this.sequenceHistory) {
    this.sequenceHistory = [];
  }

  // Add to completed
  this.completedSequences.push({
    sequenceId,
    completedAt: new Date(),
    status: 'completed',
    finalStepIndex: enrollment.stepIndex || 0,
  });

  // Add to history
  this.sequenceHistory.push({
    sequenceId,
    action: 'completed',
    timestamp: new Date(),
    stepIndex: enrollment.stepIndex || 0,
  });

  // Remove from active
  this.activeSequences.splice(enrollmentIndex, 1);

  return this;
};

/**
 * Auto-assign leads to employees based on workload balancing
 * Distributes unassigned leads to employees with available capacity
 *
 * @param {Object} options - Assignment options
 * @param {string} [options.department] - Filter by department
 * @param {number} [options.limit] - Maximum leads to assign
 * @returns {Promise<Object>} Assignment results
 *
 * @example
 * const result = await Lead.autoAssign({ department: 'sales', limit: 10 });
 * // Returns: { assigned: 5, failed: 0, details: [...] }
 */
leadSchema.statics.autoAssign = async function(options = {}) {
  const { department, limit } = options;

  // Get unassigned leads
  const unassignedLeads = await this.find({
    assignedTo: { $exists: false },
    isActive: true,
    pipelineStage: { $in: ['new', 'contacted'] }
  }).limit(limit || 100);

  if (unassignedLeads.length === 0) {
    return { assigned: 0, failed: 0, message: 'No unassigned leads found' };
  }

  // Get employees with available capacity
  const User = mongoose.model('User');
  const employees = await User.findWithLeadCapacity(department, 1);

  if (employees.length === 0) {
    return { assigned: 0, failed: unassignedLeads.length, message: 'No employees with available capacity' };
  }

  // Sort employees by current workload (ascending)
  employees.sort((a, b) => a.getAssignedLeadCount() - b.getAssignedLeadCount());

  // Assign leads in round-robin fashion
  let assignedCount = 0;
  const details = [];

  for (let i = 0; i < unassignedLeads.length; i++) {
    const lead = unassignedLeads[i];
    const employee = employees[i % employees.length];

    // Check if employee still has capacity
    if (employee.canAcceptMoreLeads()) {
      lead.assignedTo = employee._id;
      lead.assignedAt = new Date();
      await lead.save();

      // Update employee's assigned leads
      employee.assignedLeads.push({
        leadId: lead._id,
        assignedAt: new Date()
      });
      await employee.save();

      assignedCount++;
      details.push({
        leadId: lead._id,
        assignedTo: employee._id,
        employeeEmail: employee.email
      });
    }
  }

  return {
    assigned: assignedCount,
    failed: unassignedLeads.length - assignedCount,
    details
  };
};

// Pre-save middleware
leadSchema.pre('save', function(next) {
  this.updatedAt = new Date();

  // Recalculate lead score if relevant fields changed
  const modifiedPaths = this.modifiedPaths();
  const scoreRelevantFields = ['seniority', 'companySize', 'budget', 'timeline', 'decisionMaker', 'marketingConsent', 'source', 'activityCount', 'sessionCount'];

  if (scoreRelevantFields.some(field => modifiedPaths.includes(field))) {
    this.calculateLeadScore();
    this.updateProfileStage();
  }

  // Recalculate estimated value if value-relevant fields changed
  const valueRelevantFields = ['companySize', 'budget', 'seniority', 'decisionMaker', 'probability'];
  if (valueRelevantFields.some(field => modifiedPaths.includes(field))) {
    this.calculateValue();
  }

  // Initialize pipeline stage history if not set
  if (this.isNew && this.pipelineStage) {
    if (!this.pipelineStageHistory) {
      this.pipelineStageHistory = [];
    }
    // Check if there's no history entry for current stage
    const hasCurrentStageEntry = this.pipelineStageHistory.some(h => h.stage === this.pipelineStage && !h.exitedAt);
    if (!hasCurrentStageEntry) {
      this.pipelineStageHistory.push({
        stage: this.pipelineStage,
        enteredAt: new Date()
      });
    }
  }

  next();
});

const Lead = mongoose.model('Lead', leadSchema);

export default Lead;
