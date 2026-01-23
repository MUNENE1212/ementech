import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

/**
 * User Schema - Extended for Employee Management System
 *
 * This model supports:
 * - Basic user authentication (existing)
 * - Employee management with hierarchy (reportsTo)
 * - Company email integration (mail.ementech.co.ke)
 * - Invitation-based onboarding
 * - Lead assignment and capacity management
 * - Granular permission system
 *
 * @version 2.0.0
 * @since 2026-01-22
 */

// ============================================================================
// SUB-SCHEMAS
// ============================================================================

/**
 * Company Email Configuration Sub-Schema
 * Stores configuration for auto-created company email accounts
 */
const companyEmailSchema = new mongoose.Schema({
  /** Company email address (e.g., "john@ementech.co.ke") */
  address: {
    type: String,
    lowercase: true,
    trim: true,
  },
  /** Whether the email account has been configured on the mail server */
  isConfigured: {
    type: Boolean,
    default: false,
  },
  /** Encrypted email password for IMAP/SMTP access */
  password: {
    type: String,
    select: false, // Never return password in queries by default
  },
  /** Timestamp when the email was configured */
  configuredAt: Date,
}, { _id: false });

/**
 * Assigned Lead Sub-Schema
 * Tracks leads assigned to an employee
 */
const assignedLeadSchema = new mongoose.Schema({
  /** Reference to the Lead document */
  leadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead',
    required: true,
  },
  /** When the lead was assigned to this employee */
  assignedAt: {
    type: Date,
    default: Date.now,
  },
}, { _id: false });

/**
 * Permission Sub-Schema
 * Defines granular access control per resource
 */
const permissionSchema = new mongoose.Schema({
  /** The resource being controlled */
  resource: {
    type: String,
    enum: ['leads', 'campaigns', 'analytics', 'employees', 'templates', 'sequences', 'social', 'settings'],
    required: true,
  },
  /** Actions allowed on this resource */
  actions: [{
    type: String,
    enum: ['read', 'write', 'delete', 'admin'],
  }],
}, { _id: false });

// ============================================================================
// MAIN USER SCHEMA
// ============================================================================

const userSchema = new mongoose.Schema({
  // -------------------------------------------------------------------------
  // EXISTING FIELDS (preserved from original schema)
  // -------------------------------------------------------------------------

  /** User's full name */
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
  },

  /** User's personal email (for login) */
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email',
    ],
  },

  /** Hashed password */
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false,
  },

  /** User role for access control */
  role: {
    type: String,
    enum: ['admin', 'manager', 'employee'],
    default: 'employee',
  },

  /** Department within the organization */
  department: {
    type: String,
    enum: ['leadership', 'engineering', 'marketing', 'sales', 'support', 'hr'],
    default: 'engineering',
  },

  /** Whether the user account is active */
  isActive: {
    type: Boolean,
    default: true,
  },

  /** Account creation timestamp */
  createdAt: {
    type: Date,
    default: Date.now,
  },

  // -------------------------------------------------------------------------
  // NEW FIELDS: Employee Information
  // -------------------------------------------------------------------------

  /** Unique employee identifier (e.g., "EMP-001") */
  employeeId: {
    type: String,
    trim: true,
    // Note: unique + sparse index defined below in schema.index()
  },

  /** Employee's hire date */
  hireDate: Date,

  /** Job title/position */
  jobTitle: String,

  /** Reference to the employee's manager */
  reportsTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },

  // -------------------------------------------------------------------------
  // NEW FIELDS: Company Email Configuration
  // -------------------------------------------------------------------------

  /** Company email account configuration */
  companyEmail: companyEmailSchema,

  // -------------------------------------------------------------------------
  // NEW FIELDS: Invitation Tracking
  // -------------------------------------------------------------------------

  /** Reference to the user who sent the invitation */
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },

  /** When the invitation was sent */
  invitedAt: Date,

  /** Secure token for accepting invitation */
  invitationToken: {
    type: String,
    select: false, // Security: don't include in queries by default
  },

  /** When the invitation token expires */
  invitationExpiry: Date,

  /** Whether the user has accepted their invitation */
  invitationAccepted: {
    type: Boolean,
    default: false,
  },

  // -------------------------------------------------------------------------
  // NEW FIELDS: Lead Assignment
  // -------------------------------------------------------------------------

  /** Leads currently assigned to this employee */
  assignedLeads: [assignedLeadSchema],

  /** Maximum number of leads this employee can handle */
  maxLeadCapacity: {
    type: Number,
    default: 50,
    min: [0, 'Lead capacity cannot be negative'],
    max: [1000, 'Lead capacity cannot exceed 1000'],
  },

  // -------------------------------------------------------------------------
  // NEW FIELDS: Profile Information
  // -------------------------------------------------------------------------

  /** URL to user's avatar image */
  avatar: String,

  /** Contact phone number */
  phone: {
    type: String,
    trim: true,
  },

  /** Short biography or description */
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters'],
  },

  /** List of skills/expertise */
  skills: [{
    type: String,
    trim: true,
  }],

  // -------------------------------------------------------------------------
  // NEW FIELDS: Granular Permissions
  // -------------------------------------------------------------------------

  /** Resource-level permissions for fine-grained access control */
  permissions: [permissionSchema],

  // -------------------------------------------------------------------------
  // TIMESTAMPS
  // -------------------------------------------------------------------------

  /** Last update timestamp */
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// ============================================================================
// INDEXES
// ============================================================================

// Compound index for efficient employee lookups
userSchema.index({ employeeId: 1 }, { unique: true, sparse: true });

// Index for company email lookups (sparse to allow null values)
userSchema.index({ 'companyEmail.address': 1 }, { unique: true, sparse: true });

// Index for invitation token lookups (sparse to allow null values)
userSchema.index({ invitationToken: 1 }, { sparse: true });

// Index for hierarchical queries (finding direct reports)
userSchema.index({ reportsTo: 1 });

// Index for active employees by department
userSchema.index({ isActive: 1, department: 1 });

// Index for role-based queries
userSchema.index({ role: 1, isActive: 1 });

// ============================================================================
// PRE-SAVE MIDDLEWARE
// ============================================================================

/**
 * Pre-save hook to hash password before saving
 * Only hashes if password has been modified
 */
userSchema.pre('save', async function (next) {
  // Update the updatedAt timestamp
  this.updatedAt = new Date();

  // Only hash password if it's been modified
  if (!this.isModified('password')) {
    next();
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ============================================================================
// INSTANCE METHODS
// ============================================================================

/**
 * Compare entered password with hashed password in database
 *
 * @param {string} enteredPassword - Plain text password to compare
 * @returns {Promise<boolean>} True if passwords match
 *
 * @example
 * const user = await User.findById(id).select('+password');
 * const isMatch = await user.matchPassword('plainTextPassword');
 */
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

/**
 * Generate a secure invitation token for employee onboarding
 * Sets the token and expiry (7 days from now) on the user document
 *
 * @returns {string} The generated invitation token (unhashed)
 *
 * @example
 * const user = new User({ ... });
 * const token = user.generateInvitationToken();
 * await user.save();
 * // Send token to invitee via email
 */
userSchema.methods.generateInvitationToken = function () {
  // Generate a random 32-byte token
  const token = crypto.randomBytes(32).toString('hex');

  // Hash the token for storage (security best practice)
  this.invitationToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  // Set expiry to 7 days from now
  this.invitationExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  // Return the unhashed token (to be sent to user)
  return token;
};

/**
 * Check if the invitation is still valid (not expired)
 *
 * @returns {boolean} True if invitation hasn't expired
 *
 * @example
 * if (user.isInvitationValid()) {
 *   // Allow user to accept invitation
 * }
 */
userSchema.methods.isInvitationValid = function () {
  // If no expiry set or already accepted, invitation is not valid
  if (!this.invitationExpiry || this.invitationAccepted) {
    return false;
  }

  return this.invitationExpiry > new Date();
};

/**
 * Check if user has a specific permission for a resource
 * Admins automatically have all permissions
 *
 * @param {string} resource - The resource to check (e.g., 'leads', 'campaigns')
 * @param {string} action - The action to check (e.g., 'read', 'write', 'delete', 'admin')
 * @returns {boolean} True if user has the specified permission
 *
 * @example
 * if (user.hasPermission('leads', 'write')) {
 *   // Allow user to create/update leads
 * }
 */
userSchema.methods.hasPermission = function (resource, action) {
  // Admins have all permissions
  if (this.role === 'admin') {
    return true;
  }

  // Check explicit permissions
  const permission = this.permissions.find(p => p.resource === resource);

  if (!permission) {
    return false;
  }

  // 'admin' action on a resource grants all other actions
  if (permission.actions.includes('admin')) {
    return true;
  }

  return permission.actions.includes(action);
};

/**
 * Get the number of leads currently assigned to this employee
 *
 * @returns {number} Count of assigned leads
 */
userSchema.methods.getAssignedLeadCount = function () {
  return this.assignedLeads ? this.assignedLeads.length : 0;
};

/**
 * Check if employee can accept more leads based on capacity
 *
 * @returns {boolean} True if under capacity
 */
userSchema.methods.canAcceptMoreLeads = function () {
  return this.getAssignedLeadCount() < this.maxLeadCapacity;
};

// ============================================================================
// STATIC METHODS
// ============================================================================

/**
 * Find a user by their invitation token
 * Hashes the provided token before searching (tokens are stored hashed)
 * Only returns users with valid (non-expired) invitations
 *
 * @param {string} token - The unhashed invitation token
 * @returns {Promise<User|null>} The user document or null if not found/expired
 *
 * @example
 * const user = await User.findByInvitationToken(tokenFromEmail);
 * if (user && user.isInvitationValid()) {
 *   // Process invitation acceptance
 * }
 */
userSchema.statics.findByInvitationToken = async function (token) {
  // Hash the token to match stored format
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  // Find user with matching token that hasn't expired
  return this.findOne({
    invitationToken: hashedToken,
    invitationExpiry: { $gt: new Date() },
    invitationAccepted: false,
  }).select('+invitationToken');
};

/**
 * Generate the next employee ID in sequence
 * Format: "EMP-XXX" where XXX is zero-padded number
 *
 * @returns {Promise<string>} The next available employee ID
 *
 * @example
 * const employeeId = await User.generateEmployeeId();
 * // Returns "EMP-001", "EMP-002", etc.
 */
userSchema.statics.generateEmployeeId = async function () {
  // Find the highest existing employee ID
  const lastEmployee = await this.findOne(
    { employeeId: { $exists: true, $ne: null } },
    { employeeId: 1 },
    { sort: { employeeId: -1 } }
  );

  let nextNumber = 1;

  if (lastEmployee && lastEmployee.employeeId) {
    // Extract number from existing ID (e.g., "EMP-042" -> 42)
    const match = lastEmployee.employeeId.match(/EMP-(\d+)/);
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1;
    }
  }

  // Format with zero-padding (3 digits minimum)
  return `EMP-${String(nextNumber).padStart(3, '0')}`;
};

/**
 * Find all employees reporting to a specific manager
 *
 * @param {ObjectId} managerId - The manager's user ID
 * @returns {Promise<User[]>} Array of direct reports
 *
 * @example
 * const directReports = await User.findDirectReports(managerId);
 */
userSchema.statics.findDirectReports = async function (managerId) {
  return this.find({
    reportsTo: managerId,
    isActive: true,
  }).sort({ name: 1 });
};

/**
 * Find employees with available lead capacity
 * Useful for auto-assignment algorithms
 *
 * @param {string} [department] - Optional department filter
 * @param {number} [minCapacity=1] - Minimum available capacity required
 * @returns {Promise<User[]>} Array of employees with capacity
 *
 * @example
 * const availableEmployees = await User.findWithLeadCapacity('sales', 5);
 */
userSchema.statics.findWithLeadCapacity = async function (department, minCapacity = 1) {
  const query = {
    isActive: true,
    role: { $in: ['employee', 'manager'] },
  };

  if (department) {
    query.department = department;
  }

  // Find all matching employees
  const employees = await this.find(query);

  // Filter to those with available capacity
  return employees.filter(emp => {
    const currentCount = emp.getAssignedLeadCount();
    const availableCapacity = emp.maxLeadCapacity - currentCount;
    return availableCapacity >= minCapacity;
  });
};

// ============================================================================
// VIRTUAL PROPERTIES
// ============================================================================

/**
 * Virtual property to get available lead capacity
 */
userSchema.virtual('availableLeadCapacity').get(function () {
  return this.maxLeadCapacity - this.getAssignedLeadCount();
});

/**
 * Virtual property to check if user is fully onboarded
 * (invitation accepted and email configured)
 */
userSchema.virtual('isFullyOnboarded').get(function () {
  return this.invitationAccepted &&
         this.companyEmail &&
         this.companyEmail.isConfigured;
});

// Ensure virtuals are included in JSON output
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

// ============================================================================
// MODEL EXPORT
// ============================================================================

const User = mongoose.model('User', userSchema);

export default User;
