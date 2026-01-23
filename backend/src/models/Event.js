import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  // ========== Core Event Information ==========
  title: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    required: true
  },
  summary: String, // Short description for cards

  // ========== Event Type ==========
  eventType: {
    type: String,
    required: true,
    enum: ['webinar', 'workshop', 'roundtable', 'meetup', 'conference', 'office-hours', 'other']
  },

  // ========== Scheduling ==========
  startDateTime: {
    type: Date,
    required: true
  },
  endDateTime: {
    type: Date,
    required: true,
    validate: {
      validator: function(v) {
        return v > this.startDateTime;
      },
      message: 'End time must be after start time'
    }
  },
  timezone: {
    type: String,
    default: 'Africa/Nairobi'
  },
  duration: Number, // in minutes

  // ========== Location/Platform ==========
  location: {
    type: {
      type: String,
      enum: ['virtual', 'physical', 'hybrid'],
      required: true
    },
    address: String,
    city: String,
    country: String,
    venue: String,
    virtualLink: String, // Zoom, Google Meet, etc.
    virtualPassword: String,
    meetingId: String,
    platform: {
      type: String,
      enum: ['zoom', 'google-meet', 'teams', 'webex', 'other']
    }
  },

  // ========== Capacity & Registration ==========
  capacity: {
    type: Number,
    default: 100
  },
  registrationCount: {
    type: Number,
    default: 0
  },
  waitlistCapacity: {
    type: Number,
    default: 50
  },
  waitlistCount: {
    type: Number,
    default: 0
  },
  requiresApproval: {
    type: Boolean,
    default: false
  },

  // ========== Target Audience ==========
  targetAudience: [{
    type: String
  }],
  seniority: [{
    type: String,
    enum: ['c-level', 'vp', 'director', 'manager', 'individual-contributor', 'all']
  }],
  companySize: [{
    type: String,
    enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+', 'all']
  }],
  industries: [String],
  prerequisites: [String], // Requirements to attend

  // ========== Content & Agenda ==========
  agenda: [{
    time: String,
    title: String,
    description: String,
    speaker: String,
    duration: Number // in minutes
  }],
  topics: [String],
  keyTakeaways: [String],
  skillLevel: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'all-levels'],
    default: 'all-levels'
  },

  // ========== Speakers/Presenters ==========
  speakers: [{
    name: String,
    title: String,
    company: String,
    bio: String,
    photo: String,
    linkedin: String,
    twitter: String,
    isMainSpeaker: Boolean
  }],

  // ========== Lead Capture ==========
  captureFields: [{
    name: String,
    label: String,
    type: {
      type: String,
      enum: ['text', 'email', 'select', 'checkbox', 'textarea']
    },
    required: Boolean,
    options: [String] // For select fields
  }],
  qualificationRequired: {
    type: Boolean,
    default: false
  },

  // ========== Resources ==========
  resources: [{
    name: String,
    description: String,
    url: String,
    fileType: String,
    availableAfter: Boolean
  }],
  recordingUrl: String,
  recordingAvailable: {
    type: Boolean,
    default: false
  },
  slidesUrl: String,

  // ========== Communication ==========
  reminderEmails: [{
    sendBefore: Number, // hours before event
    sent: {
      type: Boolean,
      default: false
    },
    sentAt: Date
  }],
  followUpEmail: {
    subject: String,
    body: String,
    sent: Boolean,
    sentAt: Date
  },
  confirmationEmail: {
    subject: String,
    body: String
  },

  // ========== Event Status ==========
  status: {
    type: String,
    enum: ['draft', 'published', 'registration-open', 'registration-closed', 'ongoing', 'completed', 'cancelled', 'postponed'],
    default: 'draft'
  },
  publishedAt: Date,
  registrationOpenDate: Date,
  registrationCloseDate: Date,

  // ========== Engagement Metrics ==========
  metrics: {
    registrations: {
      type: Number,
      default: 0
    },
    attendanceRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    noShowRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    avgRating: {
      type: Number,
      min: 1,
      max: 5
    },
    totalReviews: {
      type: Number,
      default: 0
    },
    leadsGenerated: {
      type: Number,
      default: 0
    },
    qualifiedLeads: {
      type: Number,
      default: 0
    }
  },

  // ========== Visual Assets ==========
  thumbnail: String,
  banner: String,
  gallery: [String],

  // ========== Pricing (for paid events) ==========
  isPaid: {
    type: Boolean,
    default: false
  },
  price: {
    amount: Number,
    currency: {
      type: String,
      default: 'USD'
    },
    display: String
  },

  // ========== SEO ==========
  metaTitle: String,
  metaDescription: String,
  keywords: [String],

  // ========== Organizers ==========
  organizers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  // ========== Featured ==========
  featured: {
    type: Boolean,
    default: false
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

// ========== Indexes ==========
// Note: slug already has unique index from schema definition
eventSchema.index({ status: 1, startDateTime: -1 });
eventSchema.index({ eventType: 1, status: 1 });
eventSchema.index({ startDateTime: 1, status: 1 });
eventSchema.index({ featured: 1 });

// Generate slug from title
eventSchema.pre('save', function(next) {
  this.updatedAt = new Date();

  if (this.isModified('title') && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // Calculate duration if not set
  if (this.isModified('startDateTime') || this.isModified('endDateTime')) {
    if (this.startDateTime && this.endDateTime) {
      this.duration = Math.round((this.endDateTime - this.startDateTime) / 60000); // minutes
    }
  }

  next();
});

// ========== Virtuals ==========
eventSchema.virtual('isUpcoming').get(function() {
  return this.startDateTime > new Date();
});

eventSchema.virtual('isOngoing').get(function() {
  const now = new Date();
  return this.startDateTime <= now && this.endDateTime >= now;
});

eventSchema.virtual('isCompleted').get(function() {
  return this.endDateTime < new Date();
});

eventSchema.virtual('spotsRemaining').get(function() {
  return Math.max(0, this.capacity - this.registrationCount);
});

eventSchema.virtual('isFull').get(function() {
  return this.registrationCount >= this.capacity;
});

eventSchema.virtual('isRegistrationOpen').get(function() {
  const now = new Date();
  if (this.registrationOpenDate && now < this.registrationOpenDate) return false;
  if (this.registrationCloseDate && now > this.registrationCloseDate) return false;
  if (this.status !== 'published' && this.status !== 'registration-open') return false;
  return true;
});

// ========== Methods ==========

// Register a lead for the event
eventSchema.methods.registerLead = async function(leadId, registrationData = {}) {
  const Registration = mongoose.model('Registration');

  // Check if already registered
  const existing = await Registration.findOne({ leadId, eventId: this._id });
  if (existing) {
    throw new Error('Lead is already registered for this event');
  }

  // Check if event is full
  if (this.registrationCount >= this.capacity) {
    // Add to waitlist
    const waitlistEntry = await Registration.create({
      leadId,
      eventId: this._id,
      status: 'waitlisted',
      ...registrationData
    });

    this.waitlistCount += 1;
    await this.save();

    return waitlistEntry;
  }

  // Create registration
  const registration = await Registration.create({
    leadId,
    eventId: this._id,
    status: 'registered',
    ...registrationData
  });

  this.registrationCount += 1;
  await this.save();

  return registration;
};

// Update attendance metrics
eventSchema.methods.updateAttendanceMetrics = async function() {
  const Registration = mongoose.model('Registration');

  const total = await Registration.countDocuments({ eventId: this._id });
  const attended = await Registration.countDocuments({ eventId: this._id, status: 'attended' });
  const noShow = await Registration.countDocuments({ eventId: this._id, status: 'no-show' });

  this.metrics.attendanceRate = total > 0 ? Math.round((attended / total) * 100) : 0;
  this.metrics.noShowRate = total > 0 ? Math.round((noShow / total) * 100) : 0;

  await this.save();
};

// ========== Static Methods ==========

// Get upcoming events
eventSchema.statics.getUpcoming = async function(limit = 10) {
  return await this.find({
    status: { $in: ['published', 'registration-open'] },
    startDateTime: { $gt: new Date() }
  })
    .sort({ startDateTime: 1 })
    .limit(limit)
    .lean();
};

// Get past events
eventSchema.statics.getPast = async function(limit = 10) {
  return await this.find({
    status: 'completed',
    endDateTime: { $lt: new Date() }
  })
    .sort({ startDateTime: -1 })
    .limit(limit)
    .lean();
};

// Get featured events
eventSchema.statics.getFeatured = async function(limit = 5) {
  return await this.find({
    featured: true,
    status: { $in: ['published', 'registration-open'] },
    startDateTime: { $gt: new Date() }
  })
    .sort({ startDateTime: 1 })
    .limit(limit)
    .lean();
};

// Search events
eventSchema.statics.search = async function(query, filters = {}) {
  const { eventType, startDate, endDate, skillLevel } = filters;

  const searchQuery = {
    status: { $in: ['published', 'registration-open', 'completed'] },
    $or: [
      { title: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
      { topics: { $in: [new RegExp(query, 'i')] } }
    ]
  };

  if (eventType) searchQuery.eventType = eventType;
  if (skillLevel) searchQuery.skillLevel = skillLevel;
  if (startDate || endDate) {
    searchQuery.startDateTime = {};
    if (startDate) searchQuery.startDateTime.$gte = new Date(startDate);
    if (endDate) searchQuery.startDateTime.$lte = new Date(endDate);
  }

  return await this.find(searchQuery)
    .sort({ startDateTime: 1 })
    .lean();
};

const Registration = new mongoose.Schema({
  leadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead',
    required: true,
    index: true
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['registered', 'confirmed', 'attended', 'no-show', 'cancelled', 'waitlisted'],
    default: 'registered'
  },
  registrationData: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  questions: [{
    question: String,
    answer: String
  }],
  registeredAt: {
    type: Date,
    default: Date.now
  },
  confirmedAt: Date,
  attendedAt: Date,
  cancelledAt: Date,
  checkInNotes: String,
  noShowReason: String,
  customFields: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

Registration.index({ leadId: 1, eventId: 1 }, { unique: true });
Registration.index({ eventId: 1, status: 1 });

const Event = mongoose.model('Event', eventSchema);
const EventRegistration = mongoose.model('EventRegistration', Registration);

export { EventRegistration };
export default Event;
