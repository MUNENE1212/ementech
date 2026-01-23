import mongoose from 'mongoose';
const { Schema } = mongoose;

/**
 * Contact Schema
 * Email contacts for quick access and auto-complete
 */
const contactSchema = new Schema({
  // User who owns this contact
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Contact name
  name: {
    type: String,
    required: true,
    trim: true
  },

  // Email address
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },

  // Phone number
  phone: {
    type: String,
    trim: true
  },

  // Profile picture URL
  avatar: {
    type: String
  },

  // Company
  company: {
    type: String,
    trim: true
  },

  // Notes
  notes: {
    type: String,
    maxlength: 500
  },

  // How frequently this contact is used
  frequencyScore: {
    type: Number,
    default: 0
  },

  // Last contacted date
  lastContactedAt: {
    type: Date
  },

  // Is favorite
  isFavorite: {
    type: Boolean,
    default: false,
    index: true
  },

  // Is blocked
  isBlocked: {
    type: Boolean,
    default: false
  },

  // Deleted flag
  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  }
}, {
  timestamps: true
});

// Compound index
contactSchema.index({ user: 1, email: 1 }, { unique: true });
contactSchema.index({ user: 1, name: 'text', email: 'text' });

// Static method to search contacts
contactSchema.statics.searchContacts = async function(userId, query) {
  return await this.find({
    user: userId,
    isDeleted: false,
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { email: { $regex: query, $options: 'i' } }
    ]
  }).sort({ frequencyScore: -1, lastContactedAt: -1 });
};

// Static method to get frequent contacts
contactSchema.statics.getFrequentContacts = async function(userId, limit = 10) {
  return await this.find({
    user: userId,
    isDeleted: false,
    frequencyScore: { $gt: 0 }
  }).sort({ frequencyScore: -1 })
    .limit(limit);
};

// Static method to get favorite contacts
contactSchema.statics.getFavoriteContacts = async function(userId) {
  return await this.find({
    user: userId,
    isDeleted: false,
    isFavorite: true
  }).sort({ name: 1 });
};

// Instance method to increment frequency
contactSchema.methods.incrementFrequency = async function() {
  this.frequencyScore += 1;
  this.lastContactedAt = new Date();
  return await this.save();
};

// Instance method to toggle favorite
contactSchema.methods.toggleFavorite = async function() {
  this.isFavorite = !this.isFavorite;
  return await this.save();
};

const Contact = mongoose.model('Contact', contactSchema);

export default Contact;
