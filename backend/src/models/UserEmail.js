import mongoose from 'mongoose';
import crypto from 'crypto';
import Imap from 'imap';
const { Schema } = mongoose;

/**
 * UserEmail Schema
 * Stores user's email account configurations
 */
const userEmailSchema = new Schema({
  // User who owns this email account
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Email address
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },

  // Display name
  displayName: {
    type: String,
    trim: true
  },

  // Account type (personal, work, other)
  accountType: {
    type: String,
    enum: ['personal', 'work', 'other'],
    default: 'personal'
  },

  // Is primary email account
  isPrimary: {
    type: Boolean,
    default: false,
    index: true
  },

  // Is active
  isActive: {
    type: Boolean,
    default: true
  },

  // IMAP Configuration
  imap: {
    host: {
      type: String,
      required: true
    },
    port: {
      type: Number,
      default: 993
    },
    tls: {
      type: Boolean,
      default: true
    },
    username: {
      type: String,
      required: true
    },
    // Encrypted password
    password: {
      type: String,
      required: true
    }
  },

  // SMTP Configuration
  smtp: {
    host: {
      type: String,
      required: true
    },
    port: {
      type: Number,
      default: 587
    },
    secure: {
      type: Boolean,
      default: false
    },
    username: {
      type: String,
      required: true
    },
    // Encrypted password
    password: {
      type: String,
      required: true
    }
  },

  // Last sync timestamp
  lastSyncedAt: {
    type: Date
  },

  // Sync status
  syncStatus: {
    type: String,
    enum: ['idle', 'syncing', 'success', 'error'],
    default: 'idle'
  },

  // Sync error message
  syncError: {
    type: String
  },

  // Auto-sync enabled
  autoSync: {
    type: Boolean,
    default: true
  },

  // Sync interval in minutes
  syncInterval: {
    type: Number,
    default: 5
  },

  // Signature for outgoing emails
  signature: {
    type: String,
    default: ''
  },

  // Default from name
  fromName: {
    type: String
  },

  // Reply to address
  replyTo: {
    type: String,
    lowercase: true
  },

  // Verification status
  isVerified: {
    type: Boolean,
    default: false
  },

  // Verification token
  verificationToken: {
    type: String
  },

  // Verified at
  verifiedAt: {
    type: Date
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
userEmailSchema.index({ user: 1, email: 1 }, { unique: true });
userEmailSchema.index({ user: 1, isPrimary: 1 });

// Pre-save middleware to ensure only one primary email per user
userEmailSchema.pre('save', async function(next) {
  if (this.isPrimary) {
    await this.constructor.updateMany(
      {
        user: this.user,
        _id: { $ne: this._id },
        isPrimary: true
      },
      { isPrimary: false }
    );
  }
  next();
});

// Virtual to get decrypted IMAP password
userEmailSchema.virtual('imapPassword').get(function() {
  return this.decrypt(this.imap.password);
});

// Virtual to get decrypted SMTP password
userEmailSchema.virtual('smtpPassword').get(function() {
  return this.decrypt(this.smtp.password);
});

// Instance method to encrypt password
userEmailSchema.methods.encrypt = function(text) {
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync(process.env.JWT_SECRET || 'secret', 'salt', 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
};

// Instance method to decrypt password
userEmailSchema.methods.decrypt = function(encryptedText) {
  if (!encryptedText) return '';
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync(process.env.JWT_SECRET || 'secret', 'salt', 32);
  const parts = encryptedText.split(':');
  const iv = Buffer.from(parts.shift(), 'hex');
  const encrypted = parts.join(':');
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

// Instance method to set IMAP password
userEmailSchema.methods.setImapPassword = function(password) {
  this.imap.password = this.encrypt(password);
};

// Instance method to set SMTP password
userEmailSchema.methods.setSmtpPassword = function(password) {
  this.smtp.password = this.encrypt(password);
};

// Static method to get user's primary email
userEmailSchema.statics.getPrimaryEmail = async function(userId) {
  return await this.findOne({
    user: userId,
    isPrimary: true,
    isDeleted: false
  });
};

// Static method to get user's active emails
userEmailSchema.statics.getActiveEmails = async function(userId) {
  return await this.find({
    user: userId,
    isActive: true,
    isDeleted: false
  }).sort({ isPrimary: -1, createdAt: 1 });
};

// Instance method to test connection
userEmailSchema.methods.testConnection = function() {
  return new Promise((resolve, reject) => {
    const imap = new Imap({
      host: this.imap.host,
      port: this.imap.port,
      tls: this.imap.tls,
      user: this.imap.username,
      password: this.decrypt(this.imap.password),
      tlsOptions: { rejectUnauthorized: false }
    });

    imap.once('ready', () => {
      imap.end();
      resolve(true);
    });

    imap.once('error', (err) => {
      reject(err);
    });

    imap.connect();
  });
};

const UserEmail = mongoose.model('UserEmail', userEmailSchema);

export default UserEmail;
