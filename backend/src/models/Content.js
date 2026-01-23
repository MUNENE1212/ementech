import mongoose from 'mongoose';

const contentSchema = new mongoose.Schema({
  // ========== Core Content Information ==========
  title: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  summary: String, // Short summary for cards/previews

  // ========== Content Classification ==========
  contentType: {
    type: String,
    required: true,
    enum: ['blog', 'whitepaper', 'guide', 'case_study', 'webinar', 'video', 'tool', 'template', 'checklist', 'report', 'infographic', 'other']
  },
  category: {
    type: String,
    enum: ['ai-integration', 'web-development', 'mobile-development', 'cloud-services', 'consulting', 'training', 'case-studies', 'research', 'other']
  },
  tags: [{
    type: String,
    lowercase: true,
    trim: true
  }],

  // ========== Content Body ==========
  body: String, // Markdown or HTML content
  bodyFormat: {
    type: String,
    enum: ['markdown', 'html', 'plain'],
    default: 'markdown'
  },

  // ========== File/Resource Information ==========
  fileUrl: String, // For downloadable resources (PDFs, etc.)
  fileSize: Number, // in bytes
  fileType: String, // pdf, docx, xlsx, etc.
  fileName: String,
  thumbnailUrl: String,
  duration: Number, // For videos/webinars (in seconds)

  // ========== Access Control ==========
  accessLevel: {
    type: String,
    enum: ['public', 'email-gated', 'registration-gated', 'premium', 'internal'],
    default: 'public'
  },
  requiredFields: [String], // Fields required to access: ['email', 'company', 'jobTitle']
  accessPermissions: {
    type: Map,
    of: Boolean
  },

  // ========== Lead Capture Settings ==========
  captureLead: {
    type: Boolean,
    default: false
  },
  captureForm: {
    show: Boolean,
    fields: [{
      name: String,
      type: {
        type: String,
        enum: ['text', 'email', 'select', 'checkbox', 'textarea']
      },
      label: String,
      required: Boolean,
      placeholder: String,
      options: [String] // For select fields
    }],
    submitButtonText: String,
    submitSuccessMessage: String
  },

  // ========== SEO & Discovery ==========
  metaTitle: String,
  metaDescription: String,
  keywords: [String],
  featuredImage: String,
  ogImage: String, // Open Graph image for social sharing

  // ========== Publishing ==========
  status: {
    type: String,
    enum: ['draft', 'published', 'archived', 'scheduled'],
    default: 'draft'
  },
  publishedAt: {
    type: Date
  },
  scheduledFor: {
    type: Date
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  authorName: String,

  // ========== Engagement Metrics ==========
  metrics: {
    views: {
      type: Number,
      default: 0
    },
    uniqueViews: {
      type: Number,
      default: 0
    },
    downloads: {
      type: Number,
      default: 0
    },
    shares: {
      type: Number,
      default: 0
    },
    likes: {
      type: Number,
      default: 0
    },
    comments: {
      type: Number,
      default: 0
    },
    avgTimeOnPage: {
      type: Number,
      default: 0
    }, // in seconds
    bounceRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    conversionRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    leadGenerated: {
      type: Number,
      default: 0
    }
  },

  // ========== Related Content ==========
  relatedContent: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Content'
  }],
  prerequisites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Content'
  }],

  // ========== Content Value ==========
  value: {
    type: String,
    enum: ['free', 'freemium', 'premium'],
    default: 'free'
  },
  price: {
    amount: Number,
    currency: {
      type: String,
      default: 'USD'
    },
    display: String // e.g., "$499 value"
  },

  // ========== Difficulty Level ==========
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
    default: 'intermediate'
  },

  // ========== Time Estimates ==========
  readTime: Number, // in minutes
  completionTime: Number, // in minutes for tools/courses

  // ========== AI/ML Features ==========
  // Embeddings for semantic search (RAG)
  embedding: {
    type: [Number],
    index: 'vector' // For vector similarity search (if using MongoDB Atlas Search)
  },
  embeddingModel: {
    type: String,
    default: 'text-embedding-3-small'
  },
  embeddingUpdatedAt: {
    type: Date
  },

  // AI-generated summaries/insights
  aiSummary: String,
  aiKeyPoints: [String],
  aiTopics: [String],
  aiSentiment: {
    type: String,
    enum: ['positive', 'neutral', 'negative']
  },

  // Language
  language: {
    type: String,
    default: 'en'
  },

  // ========== Version Control ==========
  version: {
    type: String,
    default: '1.0'
  },
  lastReviewed: {
    type: Date
  },
  nextReviewDate: {
    type: Date
  },
  updatesHistory: [{
    version: String,
    updatedAt: Date,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    changes: String
  }],

  // ========== Target Audience ==========
  targetAudience: [{
    type: String
    // e.g., ['CTOs', 'VPs of Engineering', 'Technical Founders']
  }],
  companySize: [{
    type: String,
    enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+']
  }],
  industries: [{
    type: String
  }],

  // ========== Featured & Trending ==========
  featured: {
    type: Boolean,
    default: false
  },
  featuredOrder: Number,
  trending: {
    type: Boolean,
    default: false
  },
  trendingScore: {
    type: Number,
    default: 0
  },

  // ========== Content Sources ==========
  sourceUrl: String, // External source if curated
  sourceAttribution: String,

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

// ========== Indexes for Performance ==========
// Note: slug already has unique index from schema definition
contentSchema.index({ status: 1, publishedAt: -1 });
contentSchema.index({ contentType: 1, status: 1 });
contentSchema.index({ category: 1, status: 1 });
contentSchema.index({ tags: 1 });
contentSchema.index({ featured: 1, featuredOrder: 1 });
contentSchema.index({ 'metrics.views': -1 });
contentSchema.index({ 'metrics.downloads': -1 });
contentSchema.index({ trending: 1, trendingScore: -1 });
contentSchema.index({ publishedAt: -1 });
contentSchema.index({ accessLevel: 1, status: 1 });

// Generate slug from title before saving
contentSchema.pre('save', function(next) {
  this.updatedAt = new Date();

  if (this.isModified('title') && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  next();
});

// ========== Virtuals ==========
contentSchema.virtual('isPublished').get(function() {
  return this.status === 'published' && this.publishedAt <= new Date();
});

contentSchema.virtual('requiresGating').get(function() {
  return this.accessLevel !== 'public' && this.captureLead;
});

// ========== Static Methods ==========

// Get published content by type
contentSchema.statics.getPublishedByType = async function(contentType, limit = 10) {
  return await this.find({
    contentType,
    status: 'published',
    publishedAt: { $lte: new Date() }
  })
    .sort({ publishedAt: -1 })
    .limit(limit)
    .lean();
};

// Get featured content
contentSchema.statics.getFeatured = async function(limit = 5) {
  return await this.find({
    featured: true,
    status: 'published',
    publishedAt: { $lte: new Date() }
  })
    .sort({ featuredOrder: 1, publishedAt: -1 })
    .limit(limit)
    .lean();
};

// Get trending content (based on recent views)
contentSchema.statics.getTrending = async function(days = 7, limit = 10) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  return await this.find({
    status: 'published',
    publishedAt: { $gte: cutoffDate }
  })
    .sort({ 'metrics.views': -1 })
    .limit(limit)
    .lean();
};

// Search content by keyword
contentSchema.statics.search = async function(query, filters = {}) {
  const {
    contentType,
    category,
    tags,
    accessLevel
  } = filters;

  const searchQuery = {
    status: 'published',
    publishedAt: { $lte: new Date() },
    $or: [
      { title: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
      { tags: { $in: [new RegExp(query, 'i')] } }
    ]
  };

  if (contentType) searchQuery.contentType = contentType;
  if (category) searchQuery.category = category;
  if (tags && tags.length > 0) searchQuery.tags = { $in: tags };
  if (accessLevel) searchQuery.accessLevel = accessLevel;

  return await this.find(searchQuery)
    .sort({ 'metrics.views': -1 })
    .lean();
};

// Increment view count
contentSchema.methods.incrementViews = async function(unique = false) {
  this.metrics.views += 1;
  if (unique) {
    this.metrics.uniqueViews += 1;
  }
  return await this.save();
};

// Increment download count
contentSchema.methods.incrementDownloads = async function() {
  this.metrics.downloads += 1;
  return await this.save();
};

// Add to trending score
contentSchema.methods.updateTrendingScore = async function() {
  // Calculate trending score based on recent engagement
  const daysSincePublished = (Date.now() - this.publishedAt.getTime()) / (1000 * 60 * 60 * 24);
  const recencyFactor = Math.max(0.1, 1 - (daysSincePublished / 30)); // Decay over 30 days

  const engagementScore =
    (this.metrics.views * 1) +
    (this.metrics.downloads * 5) +
    (this.metrics.shares * 10) +
    (this.metrics.leadGenerated * 20);

  this.trendingScore = Math.round(engagementScore * recencyFactor);
  this.trending = this.trendingScore > 50;

  return await this.save();
};

const Content = mongoose.model('Content', contentSchema);

export default Content;
