const mongoose = require('mongoose');

const Schema = mongoose.Schema;

// Tier Pricing Schema (for packages like Basic, Standard, Premium)
const PricingTierSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  price: {
    type: Number,
    required: true,
    min: 0
  },
  duration: {
    type: Number,
    min: 0 // in hours, null if not applicable
  },
  includes: [{
    type: String,
    trim: true
  }],
  isPopular: {
    type: Boolean,
    default: false
  }
}, { _id: false });

// Service Pricing Schema - Provider-specific pricing for services
const ServicePricingSchema = new Schema({
  // References
  provider: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  serviceCategory: {
    type: Schema.Types.ObjectId,
    ref: 'ServiceCategory',
    required: true,
    index: true
  },

  // Basic Information
  serviceName: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    maxlength: 1000
  },

  // Pricing Type
  pricingType: {
    type: String,
    enum: ['flat', 'hourly', 'tiered', 'package', 'custom'],
    required: true
  },

  // Flat Rate Pricing
  flatRate: {
    type: Number,
    min: 0,
    default: null
  },
  flatRateDescription: String,

  // Hourly Rate Pricing
  hourlyRate: {
    type: Number,
    min: 0,
    default: null
  },
  minimumHours: {
    type: Number,
    min: 0,
    default: 1
  },
  maximumHours: {
    type: Number,
    min: 0
  },

  // Tiered/Package Pricing
  tiers: [PricingTierSchema],

  // Custom Pricing (starts from)
  startsFrom: {
    type: Number,
    min: 0,
    default: null
  },

  // Dynamic Pricing Adjustments
  rushFee: {
    type: Number,
    default: 0,
    min: 0,
    max: 100 // percentage
  },
  weekendFee: {
    type: Number,
    default: 0,
    min: 0,
    max: 100 // percentage
  },
  holidayFee: {
    type: Number,
    default: 0,
    min: 0,
    max: 100 // percentage
  },
  emergencyFee: {
    type: Number,
    default: 0,
    min: 0,
    max: 100 // percentage
  },
  travelFee: {
    type: Number,
    default: 0,
    min: 0 // flat fee per km or per visit
  },
  travelFeeType: {
    type: String,
    enum: ['per_km', 'flat', 'included'],
    default: 'flat'
  },
  maxTravelDistance: {
    type: Number,
    default: 10 // in kilometers
  },

  // Discounts
  discounts: {
    firstTimeDiscount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100 // percentage
    },
    bulkDiscount: {
      enabled: {
        type: Boolean,
        default: false
      },
      threshold: {
        type: Number,
        default: 5 // minimum bookings/services
      },
      discount: {
        type: Number,
        default: 10,
        min: 0,
        max: 100 // percentage
      }
    },
    loyaltyDiscount: {
      enabled: {
        type: Boolean,
        default: false
      },
      discount: {
        type: Number,
        default: 5,
        min: 0,
        max: 100 // percentage
      }
    }
  },

  // Service Details
  duration: {
    type: Number,
    min: 0 // estimated duration in hours
  },
  requiresDeposit: {
    type: Boolean,
    default: false
  },
  depositAmount: {
    type: Number,
    min: 0,
    min: 0 // fixed amount or percentage
  },
  depositType: {
    type: String,
    enum: ['fixed', 'percentage'],
    default: 'percentage'
  },

  // Availability
  availableDays: [{
    type: Number,
    min: 0,
    max: 6 // 0 = Sunday, 6 = Saturday
  }],
  availableTimeStart: String, // "HH:MM" format
  availableTimeEnd: String, // "HH:MM" format

  // Cancellation Policy
  cancellationPolicy: {
    type: String,
    enum: ['flexible', 'moderate', 'strict'],
    default: 'moderate'
  },
  cancellationNotice: {
    type: Number,
    default: 24 // hours
  },

  // Currency
  currency: {
    type: String,
    default: 'KES'
  },

  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },

  // Metadata
  notes: String,
  lastUpdatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ===== INDEXES =====
ServicePricingSchema.index({ provider: 1, isActive: 1 });
ServicePricingSchema.index({ serviceCategory: 1, isActive: 1 });
ServicePricingSchema.index({ pricingType: 1 });
ServicePricingSchema.index({ isFeatured: 1 });
ServicePricingSchema.index({ createdAt: -1 });

// Compound indexes
ServicePricingSchema.index({ provider: 1, serviceCategory: 1 });
ServicePricingSchema.index({ serviceCategory: 1, isActive: 1, isFeatured: 1 });

// ===== VIRTUALS =====

// Virtual for provider
ServicePricingSchema.virtual('providerDetails', {
  ref: 'User',
  localField: 'provider',
  foreignField: '_id',
  justOne: true
});

// Virtual for category
ServicePricingSchema.virtual('categoryDetails', {
  ref: 'ServiceCategory',
  localField: 'serviceCategory',
  foreignField: '_id',
  justOne: true
});

// ===== METHODS =====

// Calculate price based on booking details
ServicePricingSchema.methods.calculatePrice = function(bookingDetails) {
  const {
    quantity = 1,
    isRush = false,
    isWeekend = false,
    isHoliday = false,
    isEmergency = false,
    distance = 0,
    tierName = null
  } = bookingDetails;

  let basePrice = 0;

  // Calculate base price based on pricing type
  switch (this.pricingType) {
    case 'flat':
      basePrice = this.flatRate;
      break;

    case 'hourly':
      const hours = Math.max(this.minimumHours, quantity || 1);
      basePrice = this.hourlyRate * hours;
      break;

    case 'tiered':
    case 'package':
      if (tierName) {
        const tier = this.tiers.find(t => t.name === tierName);
        if (tier) {
          basePrice = tier.price;
        }
      } else if (this.tiers.length > 0) {
        // Default to first tier
        basePrice = this.tiers[0].price;
      }
      break;

    case 'custom':
      basePrice = this.startsFrom;
      break;
  }

  if (!basePrice) return null;

  let totalPrice = basePrice;
  let adjustments = [];

  // Apply rush fee
  if (isRush && this.rushFee > 0) {
    const rushAmount = (basePrice * this.rushFee) / 100;
    totalPrice += rushAmount;
    adjustments.push({ type: 'Rush Fee', amount: rushAmount });
  }

  // Apply weekend fee
  if (isWeekend && this.weekendFee > 0) {
    const weekendAmount = (basePrice * this.weekendFee) / 100;
    totalPrice += weekendAmount;
    adjustments.push({ type: 'Weekend Fee', amount: weekendAmount });
  }

  // Apply holiday fee
  if (isHoliday && this.holidayFee > 0) {
    const holidayAmount = (basePrice * this.holidayFee) / 100;
    totalPrice += holidayAmount;
    adjustments.push({ type: 'Holiday Fee', amount: holidayAmount });
  }

  // Apply emergency fee
  if (isEmergency && this.emergencyFee > 0) {
    const emergencyAmount = (basePrice * this.emergencyFee) / 100;
    totalPrice += emergencyAmount;
    adjustments.push({ type: 'Emergency Fee', amount: emergencyAmount });
  }

  // Apply travel fee
  if (distance > 0 && this.travelFee > 0) {
    let travelAmount = 0;
    if (this.travelFeeType === 'per_km') {
      travelAmount = this.travelFee * distance;
    } else {
      travelAmount = this.travelFee;
    }
    totalPrice += travelAmount;
    adjustments.push({ type: 'Travel Fee', amount: travelAmount });
  }

  return {
    basePrice,
    totalPrice,
    adjustments,
    currency: this.currency
  };
};

// Get minimum price
ServicePricingSchema.methods.getMinPrice = function() {
  switch (this.pricingType) {
    case 'flat':
      return this.flatRate;

    case 'hourly':
      return this.hourlyRate * this.minimumHours;

    case 'tiered':
    case 'package':
      if (this.tiers.length > 0) {
        return Math.min(...this.tiers.map(t => t.price));
      }
      return null;

    case 'custom':
      return this.startsFrom;

    default:
      return null;
  }
};

// Get maximum price
ServicePricingSchema.methods.getMaxPrice = function() {
  switch (this.pricingType) {
    case 'flat':
      return this.flatRate;

    case 'hourly':
      return this.maximumHours ? this.hourlyRate * this.maximumHours : null;

    case 'tiered':
    case 'package':
      if (this.tiers.length > 0) {
        return Math.max(...this.tiers.map(t => t.price));
      }
      return null;

    case 'custom':
      return null; // No max for custom pricing

    default:
      return null;
  }
};

// Check if available on specific day/time
ServicePricingSchema.methods.isAvailable = function(dayOfWeek, time) {
  // Check if day is available
  if (this.availableDays && this.availableDays.length > 0) {
    if (!this.availableDays.includes(dayOfWeek)) {
      return false;
    }
  }

  // Check if time is within range
  if (this.availableTimeStart && this.availableTimeEnd && time) {
    const [hours, minutes] = time.split(':').map(Number);
    const [startHours, startMinutes] = this.availableTimeStart.split(':').map(Number);
    const [endHours, endMinutes] = this.availableTimeEnd.split(':').map(Number);

    const timeInMinutes = hours * 60 + minutes;
    const startInMinutes = startHours * 60 + startMinutes;
    const endInMinutes = endHours * 60 + endMinutes;

    if (timeInMinutes < startInMinutes || timeInMinutes > endInMinutes) {
      return false;
    }
  }

  return true;
};

// ===== STATIC METHODS =====

// Get all pricing for a provider
ServicePricingSchema.statics.getProviderPricing = function(providerId, activeOnly = true) {
  const query = { provider: providerId };
  if (activeOnly) query.isActive = true;

  return this.find(query)
    .populate('serviceCategory', 'name slug icon')
    .sort({ isFeatured: -1, createdAt: -1 });
};

// Get pricing for a specific service
ServicePricingSchema.statics.getServicePricing = function(serviceCategoryId, options = {}) {
  const query = { serviceCategory: serviceCategoryId };
  if (options.activeOnly) query.isActive = true;
  if (options.featuredOnly) query.isFeatured = true;

  return this.find(query)
    .populate('provider', 'firstName lastName profilePicture rating stats')
    .sort({ isFeatured: -1, 'hourlyRate': 1 });
};

// Get pricing suggestions (market rates)
ServicePricingSchema.statics.getPricingSuggestions = async function(serviceCategoryId) {
  const ServiceCategory = mongoose.model('ServiceCategory');
  const category = await ServiceCategory.findById(serviceCategoryId);

  if (!category) return null;

  return {
    hourlyRate: {
      min: category.pricing.minHourlyRate,
      max: category.pricing.maxHourlyRate,
      avg: category.pricing.avgHourlyRate
    },
    flatRate: {
      min: category.pricing.minFlatRate,
      max: category.pricing.maxFlatRate,
      avg: category.pricing.avgFlatRate
    },
    currency: category.pricing.currency
  };
};

// Get price range for a service across providers
ServicePricingSchema.statics.getPriceRange = async function(serviceCategoryId) {
  const pricings = await this.find({
    serviceCategory: serviceCategoryId,
    isActive: true
  });

  const flatRates = pricings
    .filter(p => p.pricingType === 'flat' && p.flatRate)
    .map(p => p.flatRate);

  const hourlyRates = pricings
    .filter(p => p.pricingType === 'hourly' && p.hourlyRate)
    .map(p => p.hourlyRate);

  return {
    flatRate: flatRates.length > 0 ? {
      min: Math.min(...flatRates),
      max: Math.max(...flatRates),
      avg: flatRates.reduce((a, b) => a + b, 0) / flatRates.length
    } : null,
    hourlyRate: hourlyRates.length > 0 ? {
      min: Math.min(...hourlyRates),
      max: Math.max(...hourlyRates),
      avg: hourlyRates.reduce((a, b) => a + b, 0) / hourlyRates.length
    } : null,
    providerCount: pricings.length
  };
};

module.exports = mongoose.model('ServicePricing', ServicePricingSchema);
