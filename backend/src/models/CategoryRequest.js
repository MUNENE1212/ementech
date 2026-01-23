const mongoose = require('mongoose');

const Schema = mongoose.Schema;

// CategoryRequest Schema - For community-driven category suggestions
const CategoryRequestSchema = new Schema({
  // Requester Information
  requester: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Proposed Category Details
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  displayName: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    maxlength: 500
  },
  categoryType: {
    type: String,
    enum: ['technician', 'service', 'professional', 'creative', 'wellness', 'other'],
    required: true
  },

  // Suggested Configuration
  suggestedIcon: {
    type: String,
    default: 'scissors'
  },
  suggestedPricing: {
    minHourlyRate: Number,
    maxHourlyRate: Number,
    avgHourlyRate: Number,
    minFlatRate: Number,
    maxFlatRate: Number,
    avgFlatRate: Number,
    currency: {
      type: String,
      default: 'KES'
    }
  },

  // Justification & Market Info
  justification: {
    type: String,
    required: true,
    maxlength: 1000
  },
  urgency: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium'
  },
  estimatedMarketSize: {
    type: String,
    maxlength: 200
  },
  similarCategories: [{
    type: String
  }],
  useCases: [{
    type: String
  }],

  // Community Support
  supporters: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    comment: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  supportCount: {
    type: Number,
    default: 0
  },

  // Status Tracking
  status: {
    type: String,
    enum: ['pending', 'under_review', 'approved', 'rejected', 'implemented'],
    default: 'pending'
  },

  // Admin Response
  adminResponse: {
    type: String,
    maxlength: 1000
  },
  reviewedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: Date,
  implementedAt: Date,

  // Resulting Category (if approved)
  resultingCategoryId: {
    type: Schema.Types.ObjectId,
    ref: 'ServiceCategory'
  },

  // Additional Context
  references: [{
    type: String
  }],
  notes: String,

  // Flags
  isDuplicate: {
    type: Boolean,
    default: false
  },
  duplicateOf: {
    type: Schema.Types.ObjectId,
    ref: 'CategoryRequest'
  }

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ===== INDEXES =====

CategoryRequestSchema.index({ slug: 1 });
CategoryRequestSchema.index({ status: 1 });
CategoryRequestSchema.index({ supportCount: -1 });
CategoryRequestSchema.index({ categoryType: 1 });
CategoryRequestSchema.index({ requester: 1 });
CategoryRequestSchema.index({ createdAt: -1 });

// Compound indexes
CategoryRequestSchema.index({ status: 1, supportCount: -1 });
CategoryRequestSchema.index({ status: 1, createdAt: -1 });
CategoryRequestSchema.index({ categoryType: 1, status: 1 });

// Text search
CategoryRequestSchema.index({
  name: 'text',
  displayName: 'text',
  description: 'text',
  justification: 'text'
});

// ===== VIRTUALS =====

// Virtual for supporter count (redundant but useful)
CategoryRequestSchema.virtual('supporterCount').get(function() {
  return this.supporters.length;
});

// ===== METHODS =====

// Add support to request
CategoryRequestSchema.methods.addSupport = async function(userId, comment = '') {
  // Check if user already supported
  const existingSupport = this.supporters.find(
    s => s.user.toString() === userId.toString()
  );

  if (existingSupport) {
    throw new Error('User has already supported this request');
  }

  this.supporters.push({
    user: userId,
    comment,
    timestamp: new Date()
  });

  this.supportCount = this.supporters.length;
  await this.save();

  return this;
};

// Remove support from request
CategoryRequestSchema.methods.removeSupport = async function(userId) {
  this.supporters = this.supporters.filter(
    s => s.user.toString() !== userId.toString()
  );

  this.supportCount = this.supporters.length;
  await this.save();

  return this;
};

// Check if user has supported
CategoryRequestSchema.methods.hasSupported = function(userId) {
  return this.supporters.some(
    s => s.user.toString() === userId.toString()
  );
};

// Mark as under review
CategoryRequestSchema.methods.markUnderReview = async function(adminId, response = '') {
  this.status = 'under_review';
  this.adminResponse = response;
  this.reviewedBy = adminId;
  this.reviewedAt = new Date();
  await this.save();

  return this;
};

// Approve request
CategoryRequestSchema.methods.approve = async function(adminId, response, resultingCategoryId = null) {
  this.status = 'approved';
  this.adminResponse = response;
  this.reviewedBy = adminId;
  this.reviewedAt = new Date();
  if (resultingCategoryId) {
    this.resultingCategoryId = resultingCategoryId;
  }
  await this.save();

  return this;
};

// Reject request
CategoryRequestSchema.methods.reject = async function(adminId, response) {
  this.status = 'rejected';
  this.adminResponse = response;
  this.reviewedBy = adminId;
  this.reviewedAt = new Date();
  await this.save();

  return this;
};

// Mark as implemented
CategoryRequestSchema.methods.markImplemented = async function(resultingCategoryId) {
  this.status = 'implemented';
  this.resultingCategoryId = resultingCategoryId;
  this.implementedAt = new Date();
  await this.save();

  return this;
};

// ===== STATIC METHODS =====

// Get trending requests (most supported)
CategoryRequestSchema.statics.getTrending = async function(limit = 10, days = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  return this.find({
    status: { $in: ['pending', 'under_review'] },
    createdAt: { $gte: cutoffDate }
  })
  .sort({ supportCount: -1, createdAt: -1 })
  .limit(limit)
  .populate('requester', 'firstName lastName profilePicture')
  .populate('supporters.user', 'firstName lastName profilePicture');
};

// Get pending requests
CategoryRequestSchema.statics.getPending = async function(limit = 20) {
  return this.find({ status: 'pending' })
    .sort({ supportCount: -1, createdAt: -1 })
    .limit(limit)
    .populate('requester', 'firstName lastName profilePicture');
};

// Get requests by status
CategoryRequestSchema.statics.getByStatus = async function(status, limit = 20) {
  return this.find({ status })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('requester', 'firstName lastName profilePicture')
    .populate('reviewedBy', 'firstName lastName');
};

// Check for duplicate requests
CategoryRequestSchema.statics.findDuplicates = async function(name, categoryType) {
  const normalizedName = name.toLowerCase().trim();

  return this.find({
    name: { $regex: new RegExp(`^${normalizedName}$`, 'i') },
    categoryType,
    status: { $nin: ['rejected'] }
  });
};

// Get user's requests
CategoryRequestSchema.statics.getUserRequests = async function(userId, status = null) {
  const query = { requester: userId };

  if (status) {
    query.status = status;
  }

  return this.find(query)
    .sort({ createdAt: -1 })
    .populate('supporters.user', 'firstName lastName profilePicture');
};

// Get requests user has supported
CategoryRequestSchema.statics.getSupportedByUser = async function(userId) {
  return this.find({
    'supporters.user': userId
  })
  .sort({ createdAt: -1 })
  .populate('requester', 'firstName lastName profilePicture');
};

// Search requests
CategoryRequestSchema.statics.searchRequests = async function(query) {
  return this.find({
    $text: { $search: query },
    status: { $in: ['pending', 'under_review', 'approved'] }
  }, { score: { $meta: 'textScore' } })
  .sort({ score: { $meta: 'textScore' } })
  .populate('requester', 'firstName lastName profilePicture');
};

// Get statistics by status
CategoryRequestSchema.statics.getStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalSupport: { $sum: '$supportCount' }
      }
    }
  ]);

  return stats.reduce((acc, stat) => {
    acc[stat._id] = {
      count: stat.count,
      totalSupport: stat.totalSupport
    };
    return acc;
  }, {});
};

// ===== MIDDLEWARE =====

// Generate slug from name if not provided
CategoryRequestSchema.pre('save', function(next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  next();
});

// Check for duplicates before saving
CategoryRequestSchema.pre('save', async function(next) {
  if (this.isNew) {
    const duplicates = await this.constructor.findDuplicates(this.name, this.categoryType);

    if (duplicates.length > 0) {
      this.isDuplicate = true;
      this.duplicateOf = duplicates[0]._id;
    }
  }
  next();
});

module.exports = mongoose.model('CategoryRequest', CategoryRequestSchema);
