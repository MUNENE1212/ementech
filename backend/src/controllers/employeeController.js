import mongoose from 'mongoose';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import User from '../models/User.js';
import Lead from '../models/Lead.js';
import Interaction from '../models/Interaction.js';

/**
 * Employee Controller
 * Handles all employee management operations including:
 * - Invitation and onboarding
 * - Profile management
 * - Permissions management
 * - Company email configuration
 * - Performance metrics
 *
 * @version 1.0.0
 * @since 2026-01-22
 */

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate JWT Token for authenticated users
 * @param {string} id - User's MongoDB ObjectId
 * @returns {string} JWT token
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

/**
 * Create email transporter for sending invitation emails
 * Uses environment variables for SMTP configuration
 * @returns {Object} Nodemailer transporter
 */
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'mail.ementech.co.ke',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

/**
 * Send invitation email to new employee
 * @param {string} toEmail - Recipient email address
 * @param {string} invitationToken - Secure invitation token
 * @param {Object} employeeData - Employee details for email template
 * @returns {Promise<Object>} Email send result
 */
const sendInvitationEmail = async (toEmail, invitationToken, employeeData) => {
  const transporter = createTransporter();

  const invitationUrl = `${process.env.FRONTEND_URL || 'https://ementech.co.ke'}/accept-invitation/${invitationToken}`;

  const mailOptions = {
    from: `"EmenTech Team" <${process.env.SMTP_USER || 'noreply@ementech.co.ke'}>`,
    to: toEmail,
    subject: `You're invited to join EmenTech - ${employeeData.jobTitle || 'Team Member'}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1a56db; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
          .button { display: inline-block; background: #1a56db; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
          .details { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to EmenTech!</h1>
          </div>
          <div class="content">
            <p>Hello ${employeeData.name},</p>
            <p>You have been invited to join the EmenTech team as <strong>${employeeData.jobTitle || 'Team Member'}</strong> in the <strong>${employeeData.department || 'Engineering'}</strong> department.</p>

            <div class="details">
              <p><strong>Your Details:</strong></p>
              <ul>
                <li>Employee ID: ${employeeData.employeeId}</li>
                <li>Position: ${employeeData.jobTitle}</li>
                <li>Department: ${employeeData.department}</li>
              </ul>
            </div>

            <p>Click the button below to accept your invitation and set up your account:</p>

            <center>
              <a href="${invitationUrl}" class="button">Accept Invitation</a>
            </center>

            <p><small>This invitation link will expire in 7 days.</small></p>
            <p><small>If you didn't expect this invitation, please ignore this email.</small></p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} EmenTech. All rights reserved.</p>
            <p>Nairobi, Kenya | <a href="https://ementech.co.ke">ementech.co.ke</a></p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Welcome to EmenTech!

      Hello ${employeeData.name},

      You have been invited to join the EmenTech team as ${employeeData.jobTitle || 'Team Member'} in the ${employeeData.department || 'Engineering'} department.

      Your Employee ID: ${employeeData.employeeId}

      Accept your invitation here: ${invitationUrl}

      This invitation link will expire in 7 days.

      If you didn't expect this invitation, please ignore this email.

      - The EmenTech Team
    `,
  };

  return await transporter.sendMail(mailOptions);
};

/**
 * Validate permission resource and action combinations
 * @param {Array} permissions - Array of permission objects
 * @returns {Object} Validation result with isValid flag and errors array
 */
const validatePermissions = (permissions) => {
  const validResources = ['leads', 'campaigns', 'analytics', 'employees', 'templates', 'sequences', 'social', 'settings'];
  const validActions = ['read', 'write', 'delete', 'admin'];
  const errors = [];

  for (const perm of permissions) {
    if (!validResources.includes(perm.resource)) {
      errors.push(`Invalid resource: ${perm.resource}`);
    }
    if (perm.actions && Array.isArray(perm.actions)) {
      for (const action of perm.actions) {
        if (!validActions.includes(action)) {
          errors.push(`Invalid action '${action}' for resource '${perm.resource}'`);
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// ============================================================================
// CONTROLLER FUNCTIONS
// ============================================================================

/**
 * Invite a new employee
 * Creates a user record with invitation token and sends invitation email
 *
 * @route POST /api/employees/invite
 * @access Admin only
 *
 * @param {Object} req.body - Employee data
 * @param {string} req.body.email - Employee's personal email
 * @param {string} req.body.name - Employee's full name
 * @param {string} req.body.jobTitle - Job title/position
 * @param {string} req.body.department - Department (engineering, marketing, etc.)
 * @param {string} req.body.role - Role (employee, manager, admin)
 * @param {ObjectId} req.body.reportsTo - Manager's user ID (optional)
 * @param {number} req.body.maxLeadCapacity - Max leads assignable (optional)
 *
 * @returns {Object} { success, message, employeeId }
 */
export const inviteEmployee = async (req, res) => {
  try {
    const {
      email,
      name,
      jobTitle,
      department,
      role,
      reportsTo,
      maxLeadCapacity,
      permissions,
    } = req.body;

    // Validate required fields
    if (!email || !name) {
      return res.status(400).json({
        success: false,
        message: 'Email and name are required',
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email already exists',
      });
    }

    // Validate manager reference if provided
    if (reportsTo) {
      const manager = await User.findById(reportsTo);
      if (!manager) {
        return res.status(400).json({
          success: false,
          message: 'Specified manager not found',
        });
      }
    }

    // Generate employee ID
    const employeeId = await User.generateEmployeeId();

    // Create temporary password (will be replaced when invitation is accepted)
    const tempPassword = crypto.randomBytes(16).toString('hex');

    // Create the user record
    const newEmployee = new User({
      email: email.toLowerCase(),
      name,
      password: tempPassword,
      jobTitle: jobTitle || '',
      department: department || 'engineering',
      role: role || 'employee',
      employeeId,
      reportsTo: reportsTo || null,
      maxLeadCapacity: maxLeadCapacity || 50,
      permissions: permissions || [],
      invitedBy: req.user._id,
      invitedAt: new Date(),
      invitationAccepted: false,
      isActive: false, // Will be activated when invitation is accepted
    });

    // Generate invitation token (7 days expiry as per User model)
    const invitationToken = newEmployee.generateInvitationToken();

    // Save the employee
    await newEmployee.save();

    // Send invitation email
    try {
      await sendInvitationEmail(email, invitationToken, {
        name,
        jobTitle,
        department,
        employeeId,
      });
    } catch (emailError) {
      // Log email error but don't fail the invitation
      console.error('Failed to send invitation email:', emailError);
      // Optionally, you could delete the user and return error
      // await User.findByIdAndDelete(newEmployee._id);
    }

    res.status(201).json({
      success: true,
      message: 'Employee invitation sent successfully',
      employeeId: newEmployee._id,
      data: {
        employeeId,
        email,
        name,
        jobTitle,
        department,
        role: newEmployee.role,
      },
    });
  } catch (error) {
    console.error('Error inviting employee:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to invite employee',
      error: error.message,
    });
  }
};

/**
 * Accept employee invitation
 * Validates token, sets password, marks invitation as accepted
 * Triggers company email creation via emailAccountService
 *
 * @route POST /api/employees/accept-invitation/:token
 * @access Public
 *
 * @param {string} req.params.token - Invitation token from email
 * @param {string} req.body.password - New password for the account
 *
 * @returns {Object} { success, user, token (JWT) }
 */
export const acceptInvitation = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // Validate password
    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    // Find user by invitation token
    const user = await User.findByInvitationToken(token);

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired invitation token',
      });
    }

    // Check if invitation is still valid
    if (!user.isInvitationValid()) {
      return res.status(400).json({
        success: false,
        message: 'Invitation has expired. Please request a new invitation.',
      });
    }

    // Update user with new password and activate
    user.password = password;
    user.invitationAccepted = true;
    user.isActive = true;
    user.hireDate = new Date();
    user.invitationToken = undefined;
    user.invitationExpiry = undefined;

    await user.save();

    // Generate JWT token for immediate login
    const jwtToken = generateToken(user._id);

    // Note: Company email creation will be triggered separately via configureCompanyEmail
    // This allows admin to configure email at their discretion

    res.status(200).json({
      success: true,
      message: 'Invitation accepted successfully. Welcome to EmenTech!',
      token: jwtToken,
      user: {
        id: user._id,
        employeeId: user.employeeId,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        jobTitle: user.jobTitle,
      },
    });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to accept invitation',
      error: error.message,
    });
  }
};

/**
 * Get list of employees with pagination and filters
 *
 * @route GET /api/employees
 * @access Admin/Manager
 *
 * @param {string} req.query.department - Filter by department
 * @param {string} req.query.role - Filter by role
 * @param {boolean} req.query.isActive - Filter by active status
 * @param {string} req.query.search - Search by name or email
 * @param {number} req.query.page - Page number (default: 1)
 * @param {number} req.query.limit - Items per page (default: 20)
 * @param {string} req.query.sortBy - Sort field (default: createdAt)
 * @param {string} req.query.sortOrder - Sort order: asc/desc (default: desc)
 *
 * @returns {Object} { employees, pagination }
 */
export const getEmployees = async (req, res) => {
  try {
    const {
      department,
      role,
      isActive,
      search,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    // Build query
    const query = {};

    // Filter by department
    if (department) {
      query.department = department;
    }

    // Filter by role
    if (role) {
      query.role = role;
    }

    // Filter by active status
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    // Search by name or email
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
      ];
    }

    // If user is a manager (not admin), only show their direct reports
    if (req.user.role === 'manager') {
      query.reportsTo = req.user._id;
    }

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query with pagination
    const employees = await User.find(query)
      .select('-password -invitationToken')
      .populate('reportsTo', 'name email employeeId')
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    // Get total count for pagination
    const totalCount = await User.countDocuments(query);

    // Add computed fields for each employee
    const employeesWithMetrics = await Promise.all(
      employees.map(async (emp) => {
        const empObj = emp.toObject();

        // Get assigned lead count
        empObj.assignedLeadCount = emp.getAssignedLeadCount();

        // Get direct reports count
        const directReportsCount = await User.countDocuments({
          reportsTo: emp._id,
          isActive: true,
        });
        empObj.directReportsCount = directReportsCount;

        return empObj;
      })
    );

    res.status(200).json({
      success: true,
      employees: employeesWithMetrics,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalCount / limitNum),
        totalCount,
        limit: limitNum,
        hasMore: pageNum * limitNum < totalCount,
      },
    });
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employees',
      error: error.message,
    });
  }
};

/**
 * Get detailed employee information
 *
 * @route GET /api/employees/:id
 * @access Admin/Manager/Self
 *
 * @param {string} req.params.id - Employee's MongoDB ObjectId
 *
 * @returns {Object} { employee, metrics }
 */
export const getEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid employee ID',
      });
    }

    // Fetch employee
    const employee = await User.findById(id)
      .select('-password -invitationToken')
      .populate('reportsTo', 'name email employeeId jobTitle')
      .populate('invitedBy', 'name email');

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    // Authorization check: Admin, Manager of this employee, or self
    const isAdmin = req.user.role === 'admin';
    const isManager = employee.reportsTo && employee.reportsTo._id.toString() === req.user._id.toString();
    const isSelf = employee._id.toString() === req.user._id.toString();

    if (!isAdmin && !isManager && !isSelf) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this employee',
      });
    }

    // Get direct reports
    const directReports = await User.find({
      reportsTo: employee._id,
      isActive: true,
    }).select('name email employeeId jobTitle');

    // Get assigned leads summary
    const assignedLeadCount = employee.getAssignedLeadCount();
    const leadsCapacityUsed = Math.round((assignedLeadCount / employee.maxLeadCapacity) * 100);

    // Basic performance metrics
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get lead conversion metrics (simplified - will be enhanced in Phase 2)
    const leadsAssigned = await Lead.countDocuments({
      'notes.createdBy': employee._id,
      createdAt: { $gte: thirtyDaysAgo },
    });

    res.status(200).json({
      success: true,
      employee: employee.toObject(),
      metrics: {
        assignedLeadCount,
        maxLeadCapacity: employee.maxLeadCapacity,
        leadsCapacityUsed,
        directReportsCount: directReports.length,
        isFullyOnboarded: employee.isFullyOnboarded,
      },
      directReports,
      leadsMetrics: {
        assignedLast30Days: leadsAssigned,
      },
    });
  } catch (error) {
    console.error('Error fetching employee:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employee',
      error: error.message,
    });
  }
};

/**
 * Update employee profile and job information
 *
 * @route PUT /api/employees/:id
 * @access Admin or Self
 *
 * Self can only update: avatar, phone, bio, skills
 * Admin can update: all fields except password
 *
 * @param {string} req.params.id - Employee's MongoDB ObjectId
 * @param {Object} req.body - Fields to update
 *
 * @returns {Object} { success, employee }
 */
export const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid employee ID',
      });
    }

    // Fetch employee
    const employee = await User.findById(id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    // Authorization check
    const isAdmin = req.user.role === 'admin';
    const isSelf = employee._id.toString() === req.user._id.toString();

    if (!isAdmin && !isSelf) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this employee',
      });
    }

    // Define allowed fields based on role
    const selfAllowedFields = ['avatar', 'phone', 'bio', 'skills'];
    const adminAllowedFields = [
      'name',
      'avatar',
      'phone',
      'bio',
      'skills',
      'jobTitle',
      'department',
      'role',
      'reportsTo',
      'maxLeadCapacity',
      'hireDate',
    ];

    const allowedFields = isAdmin ? adminAllowedFields : selfAllowedFields;

    // Filter update data to only allowed fields
    const updateData = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    // Validate manager reference if updating reportsTo
    if (updateData.reportsTo) {
      const manager = await User.findById(updateData.reportsTo);
      if (!manager) {
        return res.status(400).json({
          success: false,
          message: 'Specified manager not found',
        });
      }
      // Prevent circular reporting
      if (updateData.reportsTo.toString() === id) {
        return res.status(400).json({
          success: false,
          message: 'Employee cannot report to themselves',
        });
      }
    }

    // Update employee
    Object.assign(employee, updateData);
    await employee.save();

    res.status(200).json({
      success: true,
      message: 'Employee updated successfully',
      employee: {
        id: employee._id,
        employeeId: employee.employeeId,
        name: employee.name,
        email: employee.email,
        role: employee.role,
        department: employee.department,
        jobTitle: employee.jobTitle,
        avatar: employee.avatar,
        phone: employee.phone,
        bio: employee.bio,
        skills: employee.skills,
      },
    });
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update employee',
      error: error.message,
    });
  }
};

/**
 * Deactivate employee (soft delete)
 * Reassigns their leads to manager or pool, revokes company email access
 *
 * @route DELETE /api/employees/:id
 * @access Admin only
 *
 * @param {string} req.params.id - Employee's MongoDB ObjectId
 * @param {ObjectId} req.body.reassignTo - User ID to reassign leads to (optional)
 *
 * @returns {Object} { success, message }
 */
export const deactivateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { reassignTo } = req.body;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid employee ID',
      });
    }

    // Prevent deactivating self
    if (id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot deactivate your own account',
      });
    }

    // Fetch employee
    const employee = await User.findById(id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    // Check if already deactivated
    if (!employee.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Employee is already deactivated',
      });
    }

    // Handle lead reassignment
    let reassignedCount = 0;
    if (employee.assignedLeads && employee.assignedLeads.length > 0) {
      // If reassignTo is specified, validate the target user
      if (reassignTo) {
        const targetUser = await User.findById(reassignTo);
        if (!targetUser || !targetUser.isActive) {
          return res.status(400).json({
            success: false,
            message: 'Invalid reassignment target user',
          });
        }

        // Reassign leads to target user
        for (const lead of employee.assignedLeads) {
          if (!targetUser.assignedLeads) {
            targetUser.assignedLeads = [];
          }
          targetUser.assignedLeads.push({
            leadId: lead.leadId,
            assignedAt: new Date(),
          });
        }
        await targetUser.save();
        reassignedCount = employee.assignedLeads.length;
      } else if (employee.reportsTo) {
        // Reassign to manager if no target specified
        const manager = await User.findById(employee.reportsTo);
        if (manager && manager.isActive) {
          if (!manager.assignedLeads) {
            manager.assignedLeads = [];
          }
          for (const lead of employee.assignedLeads) {
            manager.assignedLeads.push({
              leadId: lead.leadId,
              assignedAt: new Date(),
            });
          }
          await manager.save();
          reassignedCount = employee.assignedLeads.length;
        }
      }
      // Note: If no target and no manager, leads go to "pool" (unassigned)
    }

    // Clear employee's assigned leads
    employee.assignedLeads = [];

    // Deactivate employee
    employee.isActive = false;

    // Mark company email as revoked (actual revocation handled by emailAccountService)
    if (employee.companyEmail && employee.companyEmail.isConfigured) {
      employee.companyEmail.isConfigured = false;
      // Note: Actual email account revocation will be handled by emailAccountService
    }

    // Update direct reports to report to this employee's manager
    await User.updateMany(
      { reportsTo: employee._id },
      { reportsTo: employee.reportsTo || null }
    );

    await employee.save();

    res.status(200).json({
      success: true,
      message: 'Employee deactivated successfully',
      data: {
        employeeId: employee.employeeId,
        leadsReassigned: reassignedCount,
        directReportsReassigned: true,
      },
    });
  } catch (error) {
    console.error('Error deactivating employee:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate employee',
      error: error.message,
    });
  }
};

/**
 * Update employee permissions
 * Validates resource/action combinations
 *
 * @route PUT /api/employees/:id/permissions
 * @access Admin only
 *
 * @param {string} req.params.id - Employee's MongoDB ObjectId
 * @param {Array} req.body.permissions - Array of { resource, actions } objects
 *
 * @returns {Object} { success, permissions }
 */
export const updatePermissions = async (req, res) => {
  try {
    const { id } = req.params;
    const { permissions } = req.body;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid employee ID',
      });
    }

    // Validate permissions array
    if (!permissions || !Array.isArray(permissions)) {
      return res.status(400).json({
        success: false,
        message: 'Permissions must be an array',
      });
    }

    // Validate permission resource/action combinations
    const validation = validatePermissions(permissions);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid permissions',
        errors: validation.errors,
      });
    }

    // Fetch employee
    const employee = await User.findById(id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    // Prevent modifying admin permissions if target is admin
    if (employee.role === 'admin' && req.user._id.toString() !== id) {
      return res.status(403).json({
        success: false,
        message: 'Cannot modify permissions for admin users',
      });
    }

    // Update permissions
    employee.permissions = permissions;
    await employee.save();

    res.status(200).json({
      success: true,
      message: 'Permissions updated successfully',
      permissions: employee.permissions,
    });
  } catch (error) {
    console.error('Error updating permissions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update permissions',
      error: error.message,
    });
  }
};

/**
 * Configure company email for employee
 * Triggers emailAccountService to create mailbox on mail.ementech.co.ke
 *
 * @route POST /api/employees/:id/email/configure
 * @access Admin only
 *
 * @param {string} req.params.id - Employee's MongoDB ObjectId
 * @param {string} req.body.emailPrefix - Prefix for company email (optional, defaults to first name)
 *
 * @returns {Object} { success, email }
 */
export const configureCompanyEmail = async (req, res) => {
  try {
    const { id } = req.params;
    const { emailPrefix } = req.body;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid employee ID',
      });
    }

    // Fetch employee
    const employee = await User.findById(id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    // Check if employee has accepted invitation
    if (!employee.invitationAccepted) {
      return res.status(400).json({
        success: false,
        message: 'Employee must accept invitation before configuring company email',
      });
    }

    // Check if company email is already configured
    if (employee.companyEmail && employee.companyEmail.isConfigured) {
      return res.status(400).json({
        success: false,
        message: 'Company email is already configured',
        email: employee.companyEmail.address,
      });
    }

    // Generate email address
    const prefix = emailPrefix || employee.name.split(' ')[0].toLowerCase();
    const emailAddress = `${prefix}@ementech.co.ke`;

    // Check for email address uniqueness
    const existingEmail = await User.findOne({
      'companyEmail.address': emailAddress,
      _id: { $ne: employee._id },
    });

    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'Email address already in use. Please specify a different prefix.',
      });
    }

    // Generate a secure password for the email account
    const emailPassword = crypto.randomBytes(12).toString('base64').slice(0, 16);

    // Store company email configuration
    // Note: Actual mailbox creation will be handled by emailAccountService in Step 3
    employee.companyEmail = {
      address: emailAddress,
      isConfigured: true,
      password: emailPassword, // Will be encrypted by emailAccountService
      configuredAt: new Date(),
    };

    await employee.save();

    // Note: The emailAccountService will handle:
    // 1. Creating the mailbox on mail.ementech.co.ke
    // 2. Encrypting and storing credentials
    // 3. Sending welcome email with credentials

    res.status(200).json({
      success: true,
      message: 'Company email configuration initiated',
      email: emailAddress,
      // Note: Password should be sent securely to the employee, not returned in API response
      // This will be handled by emailAccountService
    });
  } catch (error) {
    console.error('Error configuring company email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to configure company email',
      error: error.message,
    });
  }
};

/**
 * Get employee performance metrics
 *
 * @route GET /api/employees/:id/performance
 * @access Admin/Manager/Self
 *
 * @param {string} req.params.id - Employee's MongoDB ObjectId
 * @param {number} req.query.days - Time range: 30, 60, or 90 days (default: 30)
 *
 * @returns {Object} { metrics, trends }
 */
export const getEmployeePerformance = async (req, res) => {
  try {
    const { id } = req.params;
    const { days = 30 } = req.query;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid employee ID',
      });
    }

    // Validate days parameter
    const validDays = [30, 60, 90];
    const daysNum = parseInt(days);
    if (!validDays.includes(daysNum)) {
      return res.status(400).json({
        success: false,
        message: 'Days must be 30, 60, or 90',
      });
    }

    // Fetch employee
    const employee = await User.findById(id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    // Authorization check
    const isAdmin = req.user.role === 'admin';
    const isManager = employee.reportsTo && employee.reportsTo.toString() === req.user._id.toString();
    const isSelf = employee._id.toString() === req.user._id.toString();

    if (!isAdmin && !isManager && !isSelf) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this employee\'s performance',
      });
    }

    // Calculate date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNum);

    // Get leads assigned to employee
    const assignedLeadIds = employee.assignedLeads.map(al => al.leadId);

    // Count leads assigned during period
    const leadsAssigned = await Lead.countDocuments({
      _id: { $in: assignedLeadIds },
    });

    // Count converted leads
    const leadsConverted = await Lead.countDocuments({
      _id: { $in: assignedLeadIds },
      status: 'converted',
      convertedAt: { $gte: startDate },
    });

    // Calculate conversion rate
    const conversionRate = leadsAssigned > 0
      ? Math.round((leadsConverted / leadsAssigned) * 100)
      : 0;

    // Get interaction metrics for response time calculation
    const interactions = await Interaction.find({
      leadId: { $in: assignedLeadIds },
      createdAt: { $gte: startDate },
    }).sort({ createdAt: 1 });

    // Calculate average response time (simplified calculation)
    let totalResponseTime = 0;
    let responseCount = 0;

    // Group interactions by lead and calculate response times
    const leadInteractions = {};
    for (const interaction of interactions) {
      const leadId = interaction.leadId.toString();
      if (!leadInteractions[leadId]) {
        leadInteractions[leadId] = [];
      }
      leadInteractions[leadId].push(interaction);
    }

    // Calculate response times for chat interactions
    for (const leadId in leadInteractions) {
      const leadInts = leadInteractions[leadId];
      for (let i = 1; i < leadInts.length; i++) {
        if (leadInts[i].eventType === 'chat_message' && leadInts[i - 1].eventType === 'chat_message') {
          const responseTime = (leadInts[i].createdAt - leadInts[i - 1].createdAt) / 1000 / 60; // minutes
          if (responseTime > 0 && responseTime < 1440) { // Within 24 hours
            totalResponseTime += responseTime;
            responseCount++;
          }
        }
      }
    }

    const avgResponseTime = responseCount > 0
      ? Math.round(totalResponseTime / responseCount)
      : null;

    // Get leads by status for trends
    const leadsByStatus = await Lead.aggregate([
      { $match: { _id: { $in: assignedLeadIds } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // Calculate trend data (weekly breakdown)
    const weeklyData = [];
    const weeksCount = Math.ceil(daysNum / 7);

    for (let i = 0; i < weeksCount; i++) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (i + 1) * 7);
      const weekEnd = new Date();
      weekEnd.setDate(weekEnd.getDate() - i * 7);

      const weekConversions = await Lead.countDocuments({
        _id: { $in: assignedLeadIds },
        status: 'converted',
        convertedAt: { $gte: weekStart, $lt: weekEnd },
      });

      weeklyData.unshift({
        weekStart: weekStart.toISOString().split('T')[0],
        conversions: weekConversions,
      });
    }

    res.status(200).json({
      success: true,
      metrics: {
        leadsAssigned,
        leadsConverted,
        conversionRate,
        avgResponseTime, // in minutes
        leadsByStatus: leadsByStatus.reduce((acc, s) => {
          acc[s._id] = s.count;
          return acc;
        }, {}),
      },
      trends: {
        period: `${daysNum} days`,
        weekly: weeklyData,
      },
      employee: {
        id: employee._id,
        name: employee.name,
        employeeId: employee.employeeId,
      },
    });
  } catch (error) {
    console.error('Error fetching employee performance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employee performance',
      error: error.message,
    });
  }
};

/**
 * Resend invitation email
 * Regenerates token and resends email for users who haven't accepted yet
 *
 * @route POST /api/employees/:id/resend-invitation
 * @access Admin only
 *
 * @param {string} req.params.id - Employee's MongoDB ObjectId
 *
 * @returns {Object} { success, message }
 */
export const resendInvitation = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid employee ID',
      });
    }

    // Fetch employee
    const employee = await User.findById(id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    // Check if invitation was already accepted
    if (employee.invitationAccepted) {
      return res.status(400).json({
        success: false,
        message: 'Employee has already accepted the invitation',
      });
    }

    // Generate new invitation token
    const invitationToken = employee.generateInvitationToken();
    employee.invitedAt = new Date(); // Update invitation timestamp
    await employee.save();

    // Send invitation email
    try {
      await sendInvitationEmail(employee.email, invitationToken, {
        name: employee.name,
        jobTitle: employee.jobTitle,
        department: employee.department,
        employeeId: employee.employeeId,
      });
    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Failed to send invitation email',
        error: emailError.message,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Invitation resent successfully',
      data: {
        email: employee.email,
        name: employee.name,
        invitedAt: employee.invitedAt,
        expiresAt: employee.invitationExpiry,
      },
    });
  } catch (error) {
    console.error('Error resending invitation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend invitation',
      error: error.message,
    });
  }
};

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  inviteEmployee,
  acceptInvitation,
  getEmployees,
  getEmployee,
  updateEmployee,
  deactivateEmployee,
  updatePermissions,
  configureCompanyEmail,
  getEmployeePerformance,
  resendInvitation,
};
