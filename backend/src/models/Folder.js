import mongoose from 'mongoose';
const { Schema } = mongoose;

/**
 * Folder Schema
 * User-defined email folders for organization
 */
const folderSchema = new Schema({
  // User who owns this folder
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Folder name
  name: {
    type: String,
    required: true,
    trim: true,
    enum: ['INBOX', 'Sent', 'Drafts', 'Trash', 'Spam', 'Important', 'Archive', 'Custom']
  },

  // Custom folder name (if name is 'Custom')
  customName: {
    type: String,
    trim: true
  },

  // Folder icon (for UI)
  icon: {
    type: String,
    default: 'folder'
  },

  // Folder color (for UI)
  color: {
    type: String,
    default: '#1976d2'
  },

  // Parent folder (for nested folders)
  parentFolder: {
    type: Schema.Types.ObjectId,
    ref: 'Folder'
  },

  // Folder order for display
  order: {
    type: Number,
    default: 0
  },

  // Unread count (cached for performance)
  unreadCount: {
    type: Number,
    default: 0
  },

  // Total count (cached)
  totalCount: {
    type: Number,
    default: 0
  },

  // Is system folder (cannot be deleted)
  isSystem: {
    type: Boolean,
    default: false
  },

  // Is visible in sidebar
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
folderSchema.index({ user: 1, name: 1 });
folderSchema.index({ user: 1, parentFolder: 1 });

// Static method to get user folders
folderSchema.statics.getUserFolders = async function(userId) {
  return await this.find({
    user: userId,
    isDeleted: false,
    isVisible: true
  }).sort({ order: 1, name: 1 });
};

// Static method to get system folders
folderSchema.statics.getSystemFolders = function() {
  return [
    { name: 'INBOX', displayName: 'Inbox', icon: 'inbox', color: '#1976d2' },
    { name: 'Sent', displayName: 'Sent', icon: 'send', color: '#388e3c' },
    { name: 'Drafts', displayName: 'Drafts', icon: 'draft', color: '#f57c00' },
    { name: 'Important', displayName: 'Important', icon: 'star', color: '#fbc02d' },
    { name: 'Spam', displayName: 'Spam', icon: 'warning', color: '#d32f2f' },
    { name: 'Trash', displayName: 'Trash', icon: 'delete', color: '#616161' },
    { name: 'Archive', displayName: 'Archive', icon: 'archive', color: '#455a64' }
  ];
};

// Instance method to update counts
folderSchema.methods.updateCounts = async function() {
  const Email = mongoose.model('Email');
  this.unreadCount = await Email.countDocuments({
    user: this.user,
    folder: this.name,
    isRead: false,
    isDeleted: false
  });
  this.totalCount = await Email.countDocuments({
    user: this.user,
    folder: this.name,
    isDeleted: false
  });
  return await this.save();
};

const Folder = mongoose.model('Folder', folderSchema);

export default Folder;
