import mongoose from 'mongoose';
const { Schema } = mongoose;

/**
 * Email Schema
 * Stores email metadata and content
 */
const emailSchema = new Schema({
  // User who owns this email
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Email account this belongs to
  emailAccount: {
    type: Schema.Types.ObjectId,
    ref: 'UserEmail',
    required: true,
    index: true
  },

  // Message ID from IMAP server
  messageId: {
    type: String,
    required: true,
    index: true
  },

  // IMAP UID
  uid: {
    type: Number,
    required: true
  },

  // Folder location (INBOX, Sent, Drafts, Trash, etc.)
  folder: {
    type: String,
    enum: ['INBOX', 'Sent', 'Drafts', 'Trash', 'Spam', 'Important', 'Archive'],
    default: 'INBOX',
    index: true
  },

  // Email thread ID for grouping conversations
  threadId: {
    type: String,
    index: true
  },

  // Sender information
  from: {
    name: String,
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    }
  },

  // Recipients
  to: [{
    name: String,
    email: {
      type: String,
      lowercase: true,
      trim: true
    }
  }],

  // CC recipients
  cc: [{
    name: String,
    email: {
      type: String,
      lowercase: true,
      trim: true
    }
  }],

  // BCC recipients
  bcc: [{
    name: String,
    email: {
      type: String,
      lowercase: true,
      trim: true
    }
  }],

  // Reply to addresses
  replyTo: [{
    name: String,
    email: {
      type: String,
      lowercase: true,
      trim: true
    }
  }],

  // Email subject
  subject: {
    type: String,
    default: '(No Subject)'
  },

  // Plain text body
  textBody: {
    type: String
  },

  // HTML body
  htmlBody: {
    type: String
  },

  // Email priority/importance
  priority: {
    type: String,
    enum: ['high', 'normal', 'low'],
    default: 'normal'
  },

  // Read status
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },

  // Flagged/starred
  isFlagged: {
    type: Boolean,
    default: false,
    index: true
  },

  // Has attachments
  hasAttachments: {
    type: Boolean,
    default: false
  },

  // Attachments metadata
  attachments: [{
    filename: String,
    contentType: String,
    size: Number,
    contentId: String, // For inline images
    cid: String // Content-ID
  }],

  // Labels (user-defined categories)
  labels: [{
    type: Schema.Types.ObjectId,
    ref: 'Label'
  }],

  // Received date
  date: {
    type: Date,
    required: true,
    index: true
  },

  // Sent date (from Date header)
  sentDate: {
    type: Date
  },

  // In reply to message ID
  inReplyTo: {
    type: String
  },

  // References (for threading)
  references: [String],

  // Headers (for advanced use)
  headers: {
    type: Map,
    of: String
  },

  // Sync status with IMAP server
  syncStatus: {
    type: String,
    enum: ['synced', 'pending', 'failed'],
    default: 'synced'
  },

  // Last sync timestamp
  lastSyncedAt: {
    type: Date,
    default: Date.now
  },

  // Deleted flag (soft delete)
  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  },

  // Deleted at timestamp
  deletedAt: {
    type: Date
  }
}, {
  timestamps: true,
  // Optimize for queries
  index: {
    user: 1,
    folder: 1,
    date: -1
  },
  // Optimize for unread count queries
  index: {
    user: 1,
    isRead: 1
  },
  // Optimize for search
  index: {
    user: 1,
    subject: 'text',
    textBody: 'text'
  }
});

// Virtual for formatted from
emailSchema.virtual('fromDisplay').get(function() {
  if (this.from.name) {
    return `"${this.from.name}" <${this.from.email}>`;
  }
  return this.from.email;
});

// Virtual for folder display name
emailSchema.virtual('folderName').get(function() {
  const folderNames = {
    'INBOX': 'Inbox',
    'Sent': 'Sent',
    'Drafts': 'Drafts',
    'Trash': 'Trash',
    'Spam': 'Spam',
    'Important': 'Important',
    'Archive': 'Archive'
  };
  return folderNames[this.folder] || this.folder;
});

// Index for full-text search
emailSchema.index({ subject: 'text', textBody: 'text' });

// Compound indexes for common queries
emailSchema.index({ user: 1, folder: 1, isRead: 1, date: -1 });
emailSchema.index({ user: 1, isFlagged: 1, date: -1 });
emailSchema.index({ user: 1, hasAttachments: 1, date: -1 });

// Static method to get unread count
emailSchema.statics.getUnreadCount = async function(userId, folder = 'INBOX') {
  return await this.countDocuments({
    user: userId,
    folder: folder,
    isRead: false,
    isDeleted: false
  });
};

// Static method to search emails
emailSchema.statics.searchEmails = async function(userId, query, options = {}) {
  const {
    folder,
    limit = 50,
    skip = 0,
    sortBy = 'date',
    sortOrder = -1
  } = options;

  const searchQuery = {
    user: userId,
    isDeleted: false,
    $or: [
      { subject: { $regex: query, $options: 'i' } },
      { textBody: { $regex: query, $options: 'i' } },
      { 'from.email': { $regex: query, $options: 'i' } },
      { 'from.name': { $regex: query, $options: 'i' } }
    ]
  };

  if (folder) {
    searchQuery.folder = folder;
  }

  return await this.find(searchQuery)
    .sort({ [sortBy]: sortOrder })
    .limit(limit)
    .skip(skip)
    .populate('labels', 'name color');
};

// Instance method to mark as read
emailSchema.methods.markAsRead = async function() {
  this.isRead = true;
  return await this.save();
};

// Instance method to toggle flag
emailSchema.methods.toggleFlag = async function() {
  this.isFlagged = !this.isFlagged;
  return await this.save();
};

// Instance method to move to folder
emailSchema.methods.moveToFolder = async function(newFolder) {
  this.folder = newFolder;
  return await this.save();
};

// Instance method to soft delete
emailSchema.methods.softDelete = async function() {
  this.isDeleted = true;
  this.deletedAt = new Date();
  if (this.folder !== 'Trash') {
    this.folder = 'Trash';
  }
  return await this.save();
};

const Email = mongoose.model('Email', emailSchema);

export default Email;
