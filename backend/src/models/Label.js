import mongoose from 'mongoose';
const { Schema } = mongoose;

/**
 * Label Schema
 * User-defined labels for categorizing emails
 */
const labelSchema = new Schema({
  // User who owns this label
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Label name
  name: {
    type: String,
    required: true,
    trim: true
  },

  // Label color
  color: {
    type: String,
    default: '#1976d2'
  },

  // Label icon
  icon: {
    type: String,
    default: 'label'
  },

  // Display order
  order: {
    type: Number,
    default: 0
  },

  // Is visible
  isVisible: {
    type: Boolean,
    default: true
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
labelSchema.index({ user: 1, name: 1 });

// Static method to get user labels
labelSchema.statics.getUserLabels = async function(userId) {
  return await this.find({
    user: userId,
    isDeleted: false,
    isVisible: true
  }).sort({ order: 1, name: 1 });
};

// Static method to get or create default labels
labelSchema.statics.getDefaultLabels = function(userId) {
  return [
    { name: 'Work', color: '#1976d2', icon: 'work', user: userId },
    { name: 'Personal', color: '#388e3c', icon: 'person', user: userId },
    { name: 'Travel', color: '#fbc02d', icon: 'flight', user: userId },
    { name: 'Finance', color: '#7b1fa2', icon: 'account_balance', user: userId }
  ];
};

const Label = mongoose.model('Label', labelSchema);

export default Label;
