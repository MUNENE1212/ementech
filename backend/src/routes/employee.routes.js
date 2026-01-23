/**
 * Employee Routes
 *
 * API endpoints for employee management including:
 * - Invitation and onboarding
 * - Profile management
 * - Permission management
 * - Company email configuration
 * - Performance metrics
 *
 * @module employee/routes
 */

import express from 'express';
import {
  inviteEmployee,
  acceptInvitation,
  getEmployees,
  getEmployee,
  updateEmployee,
  deactivateEmployee,
  updatePermissions,
  configureCompanyEmail,
  getEmployeePerformance,
  resendInvitation
} from '../controllers/employeeController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// ============================================================================
// PUBLIC ROUTES
// ============================================================================

/**
 * @route   POST /api/employees/accept-invitation/:token
 * @desc    Accept invitation and set password
 * @access  Public (valid token required)
 */
router.post('/accept-invitation/:token', acceptInvitation);

// ============================================================================
// PROTECTED ROUTS - All require authentication
// ============================================================================

/**
 * @route   GET /api/employees
 * @desc    List all employees with filters and pagination
 * @access  Private (Admin, Manager)
 */
router.get('/', protect, authorize('admin', 'manager'), getEmployees);

/**
 * @route   POST /api/employees/invite
 * @desc    Invite a new employee (creates user with invitation token)
 * @access  Private (Admin only)
 */
router.post('/invite', protect, authorize('admin'), inviteEmployee);

/**
 * @route   GET /api/employees/:id
 * @desc    Get detailed employee information
 * @access  Private (Admin, Manager, or Self)
 */
router.get('/:id', protect, getEmployee);

/**
 * @route   PUT /api/employees/:id
 * @desc    Update employee profile
 * @access  Private (Admin can update all, Self can update limited fields)
 */
router.put('/:id', protect, updateEmployee);

/**
 * @route   DELETE /api/employees/:id
 * @desc    Deactivate employee (soft delete)
 * @access  Private (Admin only)
 */
router.delete('/:id', protect, authorize('admin'), deactivateEmployee);

/**
 * @route   PUT /api/employees/:id/permissions
 * @desc    Update employee granular permissions
 * @access  Private (Admin only)
 */
router.put('/:id/permissions', protect, authorize('admin'), updatePermissions);

/**
 * @route   POST /api/employees/:id/email/configure
 * @desc    Configure company email (creates mailbox)
 * @access  Private (Admin only)
 */
router.post('/:id/email/configure', protect, authorize('admin'), configureCompanyEmail);

/**
 * @route   GET /api/employees/:id/performance
 * @desc    Get employee performance metrics
 * @access  Private (Admin, Manager, or Self)
 */
router.get('/:id/performance', protect, getEmployeePerformance);

/**
 * @route   POST /api/employees/:id/resend-invitation
 * @desc    Resend invitation email with new token
 * @access  Private (Admin only)
 */
router.post('/:id/resend-invitation', protect, authorize('admin'), resendInvitation);

// ============================================================================
// BATCH ROUTES
// ============================================================================

/**
 * @route   POST /api/employees/bulk/deactivate
 * @desc    Deactivate multiple employees
 * @access  Private (Admin only)
 */
router.post(
  '/bulk/deactivate',
  protect,
  authorize('admin'),
  async (req, res) => {
    try {
      const { employeeIds } = req.body;

      if (!Array.isArray(employeeIds) || employeeIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'employeeIds must be a non-empty array'
        });
      }

      const results = await Promise.allSettled(
        employeeIds.map(async (id) => {
          const employee = await User.findById(id);
          if (employee && employee._id.toString() !== req.user._id.toString()) {
            employee.isActive = false;
            await employee.save();
            return { id, success: true };
          }
          return { id, success: false, reason: 'Not found or cannot deactivate self' };
        })
      );

      const succeeded = results.filter(r => r.status === 'fulfilled' && r.value.success).length;

      res.json({
        success: true,
        message: `Deactivated ${succeeded} of ${employeeIds.length} employees`,
        results: results.map(r => r.status === 'fulfilled' ? r.value : { success: false })
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

/**
 * @route   POST /api/employees/bulk/assign-department
 * @desc    Assign multiple employees to a department
 * @access  Private (Admin only)
 */
router.post(
  '/bulk/assign-department',
  protect,
  authorize('admin'),
  async (req, res) => {
    try {
      const { employeeIds, department } = req.body;

      if (!Array.isArray(employeeIds) || employeeIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'employeeIds must be a non-empty array'
        });
      }

      const validDepartments = ['leadership', 'engineering', 'marketing', 'sales', 'support', 'hr'];
      if (!validDepartments.includes(department)) {
        return res.status(400).json({
          success: false,
          message: `Invalid department. Must be one of: ${validDepartments.join(', ')}`
        });
      }

      const result = await User.updateMany(
        { _id: { $in: employeeIds } },
        { department }
      );

      res.json({
        success: true,
        message: `Updated department for ${result.modifiedCount} employees`,
        modifiedCount: result.modifiedCount
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

// ============================================================================
// REPORTING ROUTES
// ============================================================================

/**
 * @route   GET /api/employees/reports/headcount
 * @desc    Get headcount statistics by department
 * @access  Private (Admin, Manager)
 */
router.get(
  '/reports/headcount',
  protect,
  authorize('admin', 'manager'),
  async (req, res) => {
    try {
      const headcount = await User.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: '$department',
            count: { $sum: 1 }
          }
        },
        {
          $sort: { count: -1 }
        }
      ]);

      const byRole = await User.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 }
          }
        }
      ]);

      const total = await User.countDocuments({ isActive: true });

      res.json({
        success: true,
        data: {
          total,
          byDepartment: headcount.map(h => ({ department: h._id, count: h.count })),
          byRole: byRole.map(r => ({ role: r._id, count: r.count }))
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

/**
 * @route   GET /api/employees/reports/lead-capacity
 * @desc    Get lead capacity report across all employees
 * @access  Private (Admin, Manager)
 */
router.get(
  '/reports/lead-capacity',
  protect,
  authorize('admin', 'manager'),
  async (req, res) => {
    try {
      const users = await User.find({ isActive: true })
        .select('name email department maxLeadCapacity assignedLeads role')
        .lean();

      const report = users.map(user => ({
        id: user._id,
        name: user.name,
        email: user.email,
        department: user.department,
        role: user.role,
        maxCapacity: user.maxLeadCapacity,
        assigned: user.assignedLeads?.length || 0,
        available: user.maxLeadCapacity - (user.assignedLeads?.length || 0),
        utilizationPercent: Math.round(
          ((user.assignedLeads?.length || 0) / user.maxLeadCapacity) * 100
        )
      }));

      // Sort by utilization (highest first)
      report.sort((a, b) => b.utilizationPercent - a.utilizationPercent);

      res.json({
        success: true,
        data: {
          totalCapacity: report.reduce((sum, r) => sum + r.maxCapacity, 0),
          totalAssigned: report.reduce((sum, r) => sum + r.assigned, 0),
          totalAvailable: report.reduce((sum, r) => sum + r.available, 0),
          employees: report
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

/**
 * @route   GET /api/employees/reports/organization-chart
 * @desc    Get organization chart structure
 * @access  Private (Admin, Manager)
 */
router.get(
  '/reports/organization-chart',
  protect,
  authorize('admin', 'manager'),
  async (req, res) => {
    try {
      // Find all users with their manager relationships
      const users = await User.find({ isActive: true })
        .select('name email jobTitle department reportsTo employeeId')
        .populate('reportsTo', 'name email jobTitle')
        .lean();

      // Build tree structure
      const buildTree = (managerId = null) => {
        return users
          .filter(u =>
            managerId === null
              ? !u.reportsTo
              : u.reportsTo && u.reportsTo._id.toString() === managerId.toString()
          )
          .map(u => ({
            id: u._id,
            employeeId: u.employeeId,
            name: u.name,
            email: u.email,
            jobTitle: u.jobTitle,
            department: u.department,
            directReports: buildTree(u._id),
            directReportCount: users.filter(
              sub => sub.reportsTo && sub.reportsTo._id.toString() === u._id.toString()
            ).length
          }));
      };

      const tree = buildTree();

      res.json({
        success: true,
        data: {
          tree,
          stats: {
            totalEmployees: users.length,
            managers: users.filter(u => u.reportsTo).length,
            topLevel: tree.length
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

export default router;
