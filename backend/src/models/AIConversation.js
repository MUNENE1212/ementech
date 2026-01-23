import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  // Token usage for cost tracking
  tokens: {
    prompt: Number,
    completion: Number,
    total: Number
  },
  // AI-specific metadata
  metadata: {
    model: String, // e.g., 'gpt-4o', 'claude-3.5-sonnet'
    temperature: Number,
    maxTokens: Number,
    finishReason: String // 'stop', 'length', 'content_filter'
  },
  // Tool/Function calls (for AI agents)
  toolCalls: [{
    id: String,
    name: String,
    arguments: mongoose.Schema.Types.Mixed
  }],
  // Context for the message
  context: {
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead'
    },
    sessionId: String,
    intent: String, // AI-detected intent
    sentiment: String, // 'positive', 'neutral', 'negative'
    confidence: Number // 0-1
  }
}, { _id: true });

const aiConversationSchema = new mongoose.Schema({
  // ========== Core References ==========
  leadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead',
    index: true
  },
  sessionId: {
    type: String,
    index: true,
    required: true
  },

  // ========== Conversation Type ==========
  conversationType: {
    type: String,
    enum: ['lead-qualification', 'support', 'general-inquiry', 'consultation', 'assessment'],
    default: 'general-inquiry'
  },

  // ========== Messages ==========
  messages: [messageSchema],

  // ========== Conversation State ==========
  status: {
    type: String,
    enum: ['active', 'paused', 'completed', 'handed-off'],
    default: 'active'
  },

  // ========== Lead Qualification ==========
  qualification: {
    isQualified: {
      type: Boolean,
      default: false
    },
    qualifiedAt: Date,
    criteria: {
      budget: Boolean,
      timeline: Boolean,
      authority: Boolean,
      need: Boolean
    },
    score: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    }
  },

  // ========== AI Agent Configuration ==========
  agent: {
    type: {
      type: String,
      enum: ['consultant', 'support', 'qualifier', 'scheduler'],
      default: 'consultant'
    },
    model: {
      type: String,
      default: 'gpt-4o'
    },
    temperature: {
      type: Number,
      default: 0.7,
      min: 0,
      max: 2
    },
    maxTokens: {
      type: Number,
      default: 1000
    },
    systemPrompt: String
  },

  // ========== Conversation Summary (AI-generated) ==========
  summary: String,
  keyPoints: [String],
  nextSteps: [String],
  extractedInfo: {
    // Data extracted from conversation
    name: String,
    email: String,
    company: String,
    role: String,
    challenges: [String],
    goals: [String],
    budget: String,
    timeline: String,
    techStack: [String]
  },

  // ========== Handoff Details ==========
  handoff: {
    to: {
      type: String,
      enum: ['human-sales', 'human-support', 'email', 'none']
    },
    at: Date,
    reason: String,
    notes: String
  },

  // ========== Engagement Metrics ==========
  metrics: {
    messageCount: {
      type: Number,
      default: 0
    },
    totalTokens: {
      type: Number,
      default: 0
    },
    estimatedCost: {
      type: Number,
      default: 0
    }, // in USD
    avgResponseTime: Number, // in milliseconds
    userSatisfaction: {
      type: Number,
      min: 1,
      max: 5
    }, // user rating
    resolutionTime: Number // time to resolve in seconds
  },

  // ========== Context & Metadata ==========
  context: {
    referrer: String,
    landingPage: String,
    utmSource: String,
    utmMedium: String,
    utmCampaign: String,
    device: String,
    location: String
  },

  // Tags for categorization
  tags: [String],

  // User feedback
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    helpful: Boolean,
    createdAt: Date
  },

  startedAt: {
    type: Date,
    default: Date.now
  },
  endedAt: Date,
  lastMessageAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// ========== Indexes ==========
aiConversationSchema.index({ leadId: 1, startedAt: -1 });
aiConversationSchema.index({ sessionId: 1 });
aiConversationSchema.index({ status: 1, lastMessageAt: -1 });
aiConversationSchema.index({ conversationType: 1 });
aiConversationSchema.index({ 'qualification.isQualified': 1 });
aiConversationSchema.index({ createdAt: -1 });

// ========== Virtuals ==========
aiConversationSchema.virtual('duration').get(function() {
  const end = this.endedAt || new Date();
  return Math.floor((end - this.startedAt) / 1000); // seconds
});

aiConversationSchema.virtual('isResolved').get(function() {
  return this.status === 'completed' || this.status === 'handed-off';
});

// ========== Methods ==========

// Add message to conversation
aiConversationSchema.methods.addMessage = async function(message) {
  this.messages.push(message);
  this.metrics.messageCount += 1;
  this.lastMessageAt = new Date();

  // Update token usage
  if (message.tokens) {
    this.metrics.totalTokens += message.tokens.total || 0;
  }

  // Update extracted info if provided in context
  if (message.context && message.context.extractedData) {
    Object.assign(this.extractedInfo, message.context.extractedData);
  }

  return await this.save();
};

// Update qualification status
aiConversationSchema.methods.updateQualification = async function(criteria) {
  this.qualification.criteria = {
    ...this.qualification.criteria,
    ...criteria
  };

  // Check if all criteria are met
  const allCriteria = Object.values(this.qualification.criteria);
  this.qualification.isQualified = allCriteria.every(c => c === true);

  if (this.qualification.isQualified && !this.qualification.qualifiedAt) {
    this.qualification.qualifiedAt = new Date();
  }

  // Calculate qualification score
  const metCriteria = Object.values(this.qualification.criteria).filter(c => c).length;
  this.qualification.score = Math.round((metCriteria / allCriteria.length) * 100);

  return await this.save();
};

// Handoff to human
aiConversationSchema.methods.handoffToHuman = async function(to, reason, notes = '') {
  this.handoff = {
    to,
    at: new Date(),
    reason,
    notes
  };
  this.status = 'handed-off';
  this.endedAt = new Date();

  return await this.save();
};

// Generate summary (would be called by AI)
aiConversationSchema.methods.generateSummary = async function() {
  // This would normally call an AI model
  // For now, just mark that it needs to be done
  const lastNMessages = this.messages.slice(-10);
  const conversationText = lastNMessages.map(m => `${m.role}: ${m.content}`).join('\n');

  // TODO: Integrate with OpenAI/Anthropic to generate summary
  // const summary = await generateAISummary(conversationText);

  return this;
};

// Calculate estimated cost based on token usage
aiConversationSchema.methods.calculateCost = async function() {
  // Pricing (as of 2025, example rates)
  const pricing = {
    'gpt-4o': {
      input: 0.000005, // per token
      output: 0.000015
    },
    'gpt-4o-mini': {
      input: 0.00000015,
      output: 0.0000006
    },
    'claude-3.5-sonnet': {
      input: 0.000003,
      output: 0.000015
    }
  };

  const model = this.agent.model || 'gpt-4o';
  const rates = pricing[model] || pricing['gpt-4o'];

  let totalCost = 0;
  for (const msg of this.messages) {
    if (msg.tokens) {
      totalCost += (msg.tokens.prompt || 0) * rates.input;
      totalCost += (msg.tokens.completion || 0) * rates.output;
    }
  }

  this.metrics.estimatedCost = Math.round(totalCost * 1000000) / 1000000; // Round to 6 decimal places
  return await this.save();
};

// End conversation
aiConversationSchema.methods.end = async function(status = 'completed') {
  this.status = status;
  this.endedAt = new Date();

  if (status === 'completed' || status === 'handed-off') {
    this.metrics.resolutionTime = this.duration;
  }

  // Generate summary and calculate cost
  await this.generateSummary();
  await this.calculateCost();

  return await this.save();
};

// ========== Static Methods ==========

// Get active conversation for session
aiConversationSchema.statics.getActiveBySession = async function(sessionId) {
  return await this.findOne({
    sessionId,
    status: 'active'
  })
    .sort({ startedAt: -1 })
    .populate('leadId');
};

// Get recent conversations for lead
aiConversationSchema.statics.getRecentForLead = async function(leadId, limit = 5) {
  return await this.find({ leadId })
    .sort({ startedAt: -1 })
    .limit(limit)
    .lean();
};

// Get qualified leads from conversations
aiConversationSchema.statics.getQualifiedLeads = async function(days = 7) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  return await this.find({
    'qualification.isQualified': true,
    'qualification.qualifiedAt': { $gte: cutoffDate },
    status: { $in: ['completed', 'handed-off'] }
  })
    .populate('leadId')
    .sort({ 'qualification.qualifiedAt': -1 })
    .lean();
};

// Get conversation statistics
aiConversationSchema.statics.getStatistics = async function(filters = {}) {
  const matchQuery = {};

  if (filters.conversationType) {
    matchQuery.conversationType = filters.conversationType;
  }

  if (filters.startDate && filters.endDate) {
    matchQuery.startedAt = {
      $gte: new Date(filters.startDate),
      $lte: new Date(filters.endDate)
    };
  }

  const stats = await this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: null,
        totalConversations: { $sum: 1 },
        qualifiedLeads: {
          $sum: { $cond: ['$qualification.isQualified', 1, 0] }
        },
        completedConversations: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        handedOffConversations: {
          $sum: { $cond: [{ $eq: ['$status', 'handed-off'] }, 1, 0] }
        },
        totalMessages: { $sum: '$metrics.messageCount' },
        totalTokens: { $sum: '$metrics.totalTokens' },
        totalCost: { $sum: '$metrics.estimatedCost' },
        avgResolutionTime: { $avg: '$metrics.resolutionTime' },
        avgMessagesPerConversation: { $avg: '$metrics.messageCount' }
      }
    }
  ]);

  return stats[0] || {
    totalConversations: 0,
    qualifiedLeads: 0,
    completedConversations: 0,
    handedOffConversations: 0,
    totalMessages: 0,
    totalTokens: 0,
    totalCost: 0,
    avgResolutionTime: 0,
    avgMessagesPerConversation: 0
  };
};

// Pre-save middleware
aiConversationSchema.pre('save', function(next) {
  // Update message count
  this.metrics.messageCount = this.messages.length;

  next();
});

const AIConversation = mongoose.model('AIConversation', aiConversationSchema);

export default AIConversation;
