const mongoose = require('mongoose');

const Schema = mongoose.Schema;

// ServiceCategory Schema - For organizing all service types on the platform
const ServiceCategorySchema = new Schema({
  // Basic Information
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },

  // Display Information
  displayName: {
    type: String,
    required: true
  },
  description: {
    type: String,
    maxlength: 500
  },
  icon: {
    type: String,
    default: 'scissors' // lucide-react icon name
  },
  image: {
    url: String,
    publicId: String
  },

  // Hierarchy - Support for subcategories
  parentCategory: {
    type: Schema.Types.ObjectId,
    ref: 'ServiceCategory',
    default: null
  },
  level: {
    type: Number,
    default: 0 // 0 = top level, 1 = subcategory, 2 = sub-subcategory
  },
  path: {
    type: [Schema.Types.ObjectId],
    default: [] // Array of parent category IDs for fast traversal
  },

  // Category Details
  categoryType: {
    type: String,
    enum: ['technician', 'service', 'professional', 'creative', 'wellness', 'other'],
    required: true
  },
  tags: [{
    type: String,
    trim: true
  }],

  // Pricing Guidelines (for market rate suggestions)
  pricing: {
    minHourlyRate: {
      type: Number,
      min: 0
    },
    maxHourlyRate: {
      type: Number,
      min: 0
    },
    avgHourlyRate: {
      type: Number,
      min: 0
    },
    minFlatRate: {
      type: Number,
      min: 0
    },
    maxFlatRate: {
      type: Number,
      min: 0
    },
    avgFlatRate: {
      type: Number,
      min: 0
    },
    currency: {
      type: String,
      default: 'KES'
    }
  },

  // Verification Requirements
  verification: {
    requiresId: {
      type: Boolean,
      default: true
    },
    requiresCertification: {
      type: Boolean,
      default: false
    },
    requiresPortfolio: {
      type: Boolean,
      default: false
    },
    requiredCertifications: [String]
  },

  // Display Settings
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  order: {
    type: Number,
    default: 0 // Lower numbers appear first
  },
  showOnHomepage: {
    type: Boolean,
    default: true
  },

  // Statistics
  stats: {
    providerCount: {
      type: Number,
      default: 0
    },
    bookingCount: {
      type: Number,
      default: 0
    },
    reviewCount: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    }
  },

  // SEO
  seo: {
    metaTitle: String,
    metaDescription: String,
    keywords: [String]
  },

  // Metadata
  notes: String,
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  lastModifiedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ===== INDEXES =====
ServiceCategorySchema.index({ slug: 1 });
ServiceCategorySchema.index({ parentCategory: 1 });
ServiceCategorySchema.index({ level: 1 });
ServiceCategorySchema.index({ isActive: 1, order: 1 });
ServiceCategorySchema.index({ isFeatured: 1 });
ServiceCategorySchema.index({ categoryType: 1 });

// Compound indexes
ServiceCategorySchema.index({ isActive: 1, isFeatured: 1, order: 1 });
ServiceCategorySchema.index({ parentCategory: 1, isActive: 1 });

// Text search
ServiceCategorySchema.index({
  name: 'text',
  displayName: 'text',
  description: 'text',
  tags: 'text'
});

// ===== VIRTUALS =====

// Virtual for subcategories
ServiceCategorySchema.virtual('subcategories', {
  ref: 'ServiceCategory',
  localField: '_id',
  foreignField: 'parentCategory',
  justOne: false
});

// Virtual for parent
ServiceCategorySchema.virtual('parent', {
  ref: 'ServiceCategory',
  localField: 'parentCategory',
  foreignField: '_id',
  justOne: true
});

// Virtual for full path name
ServiceCategorySchema.virtual('fullPath').get(function() {
  return `${this.path.map(id => id.toString()).join('/')}/${this._id.toString()}`;
});

// ===== MIDDLEWARE =====

// Update level and path before saving
ServiceCategorySchema.pre('save', async function(next) {
  if (this.isModified('parentCategory')) {
    // Update level
    this.level = this.parentCategory ? 1 : 0;

    // Update path
    if (this.parentCategory) {
      const parent = await this.constructor.findById(this.parentCategory);
      if (parent) {
        this.path = [...parent.path, parent._id];
        this.level = parent.level + 1;
      }
    } else {
      this.path = [];
    }
  }
  next();
});

// Update stats
ServiceCategorySchema.pre('save', async function(next) {
  if (this.isModified('stats.providerCount') || this.isModified('stats.bookingCount')) {
    // Could trigger recalculation here if needed
  }
  next();
});

// ===== METHODS =====

// Get all descendants (children, grandchildren, etc.)
ServiceCategorySchema.methods.getDescendants = async function() {
  const descendants = await this.constructor.find({
    path: this._id
  }).sort({ order: 1 });

  return descendants;
};

// Get all children (direct descendants only)
ServiceCategorySchema.methods.getChildren = async function() {
  const children = await this.constructor.find({
    parentCategory: this._id,
    isActive: true
  }).sort({ order: 1 });

  return children;
};

// Get ancestors
ServiceCategorySchema.methods.getAncestors = async function() {
  if (this.path.length === 0) return [];

  const ancestors = await this.constructor.find({
    _id: { $in: this.path }
  }).sort({ level: 1 });

  return ancestors;
};

// Add provider to this category
ServiceCategorySchema.methods.addProvider = async function() {
  this.stats.providerCount += 1;
  await this.save();
};

// Remove provider from this category
ServiceCategorySchema.methods.removeProvider = async function() {
  if (this.stats.providerCount > 0) {
    this.stats.providerCount -= 1;
    await this.save();
  }
};

// Update category stats
ServiceCategorySchema.methods.updateStats = async function() {
  const User = mongoose.model('User');
  const Booking = mongoose.model('Booking');
  const Review = mongoose.model('Review');

  // Count providers in this category
  const providerCount = await User.countDocuments({
    role: 'technician',
    'skills.serviceCategory': this._id,
    status: 'active'
  });

  // Count bookings in this category
  const bookingCount = await Booking.countDocuments({
    serviceCategory: this._id
  });

  // Get average rating for this category
  const reviews = await Review.aggregate([
    {
      $match: {
        serviceCategory: this._id,
        status: 'published'
      }
    },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating.overall' },
        count: { $sum: 1 }
      }
    }
  ]);

  this.stats.providerCount = providerCount;
  this.stats.bookingCount = bookingCount;
  this.stats.reviewCount = reviews[0]?.count || 0;
  this.stats.averageRating = reviews[0]?.averageRating || 0;

  await this.save();
};

// ===== STATIC METHODS =====

// Get top-level categories (no parent)
ServiceCategorySchema.statics.getTopLevelCategories = async function() {
  return this.find({
    parentCategory: null,
    isActive: true
  }).sort({ order: 1 });
};

// Get featured categories
ServiceCategorySchema.statics.getFeaturedCategories = async function(limit = 10) {
  return this.find({
    isActive: true,
    isFeatured: true
  })
  .sort({ order: 1 })
  .limit(limit);
};

// Get category tree (with nested children)
ServiceCategorySchema.statics.getCategoryTree = async function(maxLevel = 2) {
  const categories = await this.find({
    isActive: true,
    level: { $lte: maxLevel }
  })
  .sort({ level: 1, order: 1 })
  .lean();

  // Build tree structure
  const buildTree = (parentId = null) => {
    return categories
      .filter(cat => {
        const pid = cat.parentCategory ? cat.parentCategory.toString() : null;
        return pid === parentId;
      })
      .map(cat => ({
        ...cat,
        children: buildTree(cat._id.toString())
      }));
  };

  return buildTree();
};

// Search categories
ServiceCategorySchema.statics.searchCategories = async function(query) {
  return this.find({
    $text: { $search: query },
    isActive: true
  }, { score: { $meta: 'textScore' } })
  .sort({ score: { $meta: 'textScore' } });
};

// Get categories by type
ServiceCategorySchema.statics.getByType = async function(categoryType) {
  return this.find({
    categoryType,
    isActive: true,
    parentCategory: null // Only top-level
  }).sort({ order: 1 });
};

module.exports = mongoose.model('ServiceCategory', ServiceCategorySchema);
