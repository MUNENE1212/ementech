import Lead from '../models/Lead.js';
import User from '../models/User.js';
import { sendLeadAssigned, sendPipelineUpdated } from '../utils/leadNotifications.js';

/**
 * Lead Assignment Controller
 *
 * Handles lead assignment to employees, pipeline management,
 * and related operations for the sales CRM functionality.
 *
 * @version 2.0.0
 * @since 2026-01-22
 */

// ============================================================================
// ASSIGNMENT FUNCTIONS
// ============================================================================

/**
 * @desc    Assign a single lead to an employee
 * @route   PUT /api/leads/:id/assign
 * @access  Private/Admin/Manager
 *
 * @param {string} req.params.id - Lead ID
 * @param {string} req.body.assignedTo - User ID to assign lead to
 * @param {string} [req.body.notes] - Optional notes about the assignment
 *
 * @example
 * PUT /api/leads/507f1f77bcf86cd799439011/assign
 * Body: { "assignedTo": "507f1f77bcf86cd799439012", "notes": "Hot lead from trade show" }
 */
export const assignLead = async (req, res) => {
  try {
    const { assignedTo, notes } = req.body;
    const leadId = req.params.id;
    const assignedBy = req.user._id;

    // Validate input
    if (!assignedTo) {
      return res.status(400).json({
        success: false,
        message: 'assignedTo field is required'
      });
    }

    // Find the lead
    const lead = await Lead.findById(leadId);
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    // Find the employee to assign to
    const employee = await User.findById(assignedTo);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Check if employee is active
    if (!employee.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Cannot assign lead to inactive employee'
      });
    }

    // Check if employee has capacity
    if (!employee.canAcceptMoreLeads()) {
      return res.status(400).json({
        success: false,
        message: `Employee has reached maximum lead capacity (${employee.maxLeadCapacity})`
      });
    }

    // Store previous assignment for notification
    const previousAssignee = lead.assignedTo;
    const wasReassigned = previousAssignee && previousAssignee.toString() !== assignedTo;

    // Assign the lead
    lead.assignTo(assignedTo, assignedBy);

    // Add assignment note if provided
    if (notes) {
      if (!lead.notes) {
        lead.notes = [];
      }
      lead.notes.push({
        content: `Assignment note: ${notes}`,
        createdBy: assignedBy,
        createdAt: new Date()
      });
    }

    await lead.save();

    // Update employee's assigned leads
    const existingAssignment = employee.assignedLeads.findIndex(
      al => al.leadId.toString() === leadId
    );

    if (existingAssignment >= 0) {
      // Update existing assignment
      employee.assignedLeads[existingAssignment].assignedAt = new Date();
    } else {
      // Add new assignment
      employee.assignedLeads.push({
        leadId: leadId,
        assignedAt: new Date()
      });
    }

    await employee.save();

    // Send real-time notification to assigned employee
    await sendLeadAssigned(assignedTo, {
      leadId: lead._id,
      leadEmail: lead.email,
      leadName: lead.name,
      assignedBy: req.user.name,
      wasReassigned,
      notes
    });

    // Notify previous assignee if reassigned
    if (wasReassigned) {
      await sendLeadAssigned(previousAssignee, {
        leadId: lead._id,
        leadEmail: lead.email,
        leadName: lead.name,
        assignedBy: req.user.name,
        wasReassigned: true,
        notes: 'Lead reassigned to another team member'
      });
    }

    res.status(200).json({
      success: true,
      message: wasReassigned
        ? 'Lead reassigned successfully'
        : 'Lead assigned successfully',
      data: {
        lead,
        employee: {
          id: employee._id,
          name: employee.name,
          email: employee.email,
          currentLoad: employee.getAssignedLeadCount(),
          capacity: employee.maxLeadCapacity
        }
      }
    });
  } catch (error) {
    console.error('Error assigning lead:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Bulk assign multiple leads with load balancing
 * @route   POST /api/leads/bulk-assign
 * @access  Private/Admin/Manager
 *
 * @param {string[]} req.body.leadIds - Array of lead IDs to assign
 * @param {string[]} req.body.employeeIds - Array of employee IDs for round-robin
 * @param {string} [req.body.strategy] - Assignment strategy: 'round-robin' (default) or 'workload'
 * @param {string} [req.body.department] - Filter employees by department
 * @param {string} [req.body.notes] - Optional notes for all assignments
 *
 * @example
 * POST /api/leads/bulk-assign
 * Body: {
 *   "leadIds": ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"],
 *   "strategy": "workload",
 *   "department": "sales"
 * }
 */
export const bulkAssignLeads = async (req, res) => {
  try {
    const { leadIds, employeeIds, strategy = 'round-robin', department, notes } = req.body;
    const assignedBy = req.user._id;

    // Validate input
    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'leadIds array is required'
      });
    }

    let employees = [];

    // If specific employees provided, use them
    if (employeeIds && Array.isArray(employeeIds) && employeeIds.length > 0) {
      employees = await User.find({
        _id: { $in: employeeIds },
        isActive: true
      });
    } else {
      // Otherwise get all employees with capacity in department
      employees = await User.findWithLeadCapacity(department, 1);
    }

    if (employees.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No eligible employees found with available capacity'
      });
    }

    // Get leads to assign
    const leads = await Lead.find({
      _id: { $in: leadIds },
      isActive: true
    });

    if (leads.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No valid leads found'
      });
    }

    // Sort employees based on strategy
    if (strategy === 'workload') {
      // Sort by current workload (least loaded first)
      employees.sort((a, b) => a.getAssignedLeadCount() - b.getAssignedLeadCount());
    }
    // round-robin keeps original order

    const results = {
      successful: [],
      failed: [],
      total: leads.length
    };

    // Assign leads using selected strategy
    for (let i = 0; i < leads.length; i++) {
      const lead = leads[i];
      const employee = employees[i % employees.length];

      // Check if employee still has capacity
      if (!employee.canAcceptMoreLeads()) {
        results.failed.push({
          leadId: lead._id,
          reason: 'Employee at maximum capacity'
        });
        continue;
      }

      try {
        // Assign lead
        lead.assignTo(employee._id, assignedBy);

        // Add note if provided
        if (notes) {
          if (!lead.notes) {
            lead.notes = [];
          }
          lead.notes.push({
            content: `Bulk assignment: ${notes}`,
            createdBy: assignedBy,
            createdAt: new Date()
          });
        }

        await lead.save();

        // Update employee's assigned leads
        const existingAssignment = employee.assignedLeads.findIndex(
          al => al.leadId.toString() === lead._id.toString()
        );

        if (existingAssignment >= 0) {
          employee.assignedLeads[existingAssignment].assignedAt = new Date();
        } else {
          employee.assignedLeads.push({
            leadId: lead._id,
            assignedAt: new Date()
          });
        }

        await employee.save();

        results.successful.push({
          leadId: lead._id,
          assignedTo: employee._id,
          employeeName: employee.name
        });

        // Send notification
        await sendLeadAssigned(employee._id, {
          leadId: lead._id,
          leadEmail: lead.email,
          leadName: lead.name,
          assignedBy: req.user.name,
          notes
        });

      } catch (error) {
        results.failed.push({
          leadId: lead._id,
          reason: error.message
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Assigned ${results.successful.length} of ${results.total} leads`,
      data: results
    });
  } catch (error) {
    console.error('Error in bulk assignment:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Auto-assign unassigned leads using round-robin or workload-based assignment
 * @route   POST /api/leads/auto-assign
 * @access  Private/Admin/Manager
 *
 * @param {string} [req.body.department] - Filter by department
 * @param {string} [req.body.strategy='workload'] - Assignment strategy
 * @param {number} [req.body.limit=50] - Maximum leads to assign
 *
 * @example
 * POST /api/leads/auto-assign
 * Body: { "department": "sales", "limit": 20 }
 */
export const autoAssign = async (req, res) => {
  try {
    const { department, strategy = 'workload', limit = 50 } = req.body;

    // Use the static method on Lead model
    const result = await Lead.autoAssign({ department, limit });

    // Send notifications for assigned leads
    if (result.details && result.details.length > 0) {
      for (const detail of result.details) {
        const lead = await Lead.findById(detail.leadId);
        if (lead) {
          await sendLeadAssigned(detail.assignedTo, {
            leadId: lead._id,
            leadEmail: lead.email,
            leadName: lead.name,
            assignedBy: 'System (auto-assignment)',
            notes: 'Automatically assigned based on availability'
          });
        }
      }
    }

    res.status(200).json({
      success: true,
      message: result.message || `Auto-assignment complete`,
      data: result
    });
  } catch (error) {
    console.error('Error in auto-assign:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Unassign a lead from current owner
 * @route   DELETE /api/leads/:id/assign
 * @access  Private/Admin/Manager
 *
 * @param {string} req.params.id - Lead ID
 * @param {string} [req.body.reason] - Reason for unassignment
 */
export const unassignLead = async (req, res) => {
  try {
    const { reason } = req.body;
    const leadId = req.params.id;

    const lead = await Lead.findById(leadId);
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    if (!lead.assignedTo) {
      return res.status(400).json({
        success: false,
        message: 'Lead is not assigned to anyone'
      });
    }

    const previousAssignee = lead.assignedTo;

    // Clear assignment
    lead.assignedTo = null;
    lead.assignedAt = null;
    lead.assignedBy = null;

    // Add note about unassignment
    if (reason) {
      if (!lead.notes) {
        lead.notes = [];
      }
      lead.notes.push({
        content: `Unassigned: ${reason}`,
        createdBy: req.user._id,
        createdAt: new Date()
      });
    }

    await lead.save();

    // Remove from employee's assigned leads
    const employee = await User.findById(previousAssignee);
    if (employee && employee.assignedLeads) {
      employee.assignedLeads = employee.assignedLeads.filter(
        al => al.leadId.toString() !== leadId
      );
      await employee.save();
    }

    // Notify previous assignee
    await sendLeadAssigned(previousAssignee, {
      leadId: lead._id,
      leadEmail: lead.email,
      leadName: lead.name,
      assignedBy: req.user.name,
      wasReassigned: true,
      notes: reason || 'Lead unassigned'
    });

    res.status(200).json({
      success: true,
      message: 'Lead unassigned successfully',
      data: lead
    });
  } catch (error) {
    console.error('Error unassigning lead:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ============================================================================
// PIPELINE MANAGEMENT
// ============================================================================

/**
 * @desc    Update lead's pipeline stage
 * @route   PUT /api/leads/:id/pipeline-stage
 * @access  Private/Admin/Manager
 *
 * @param {string} req.params.id - Lead ID
 * @param {string} req.body.stage - New pipeline stage
 * @param {string} [req.body.notes] - Notes about the stage change
 *
 * @example
 * PUT /api/leads/507f1f77bcf86cd799439011/pipeline-stage
 * Body: { "stage": "meeting_scheduled", "notes": "Demo set for Tuesday 2pm" }
 */
export const updatePipelineStage = async (req, res) => {
  try {
    const { stage, notes } = req.body;
    const leadId = req.params.id;

    // Validate stage
    const validStages = ['new', 'contacted', 'meeting_scheduled', 'proposal_sent', 'negotiation', 'won', 'lost'];
    if (!stage || !validStages.includes(stage)) {
      return res.status(400).json({
        success: false,
        message: `Invalid stage. Must be one of: ${validStages.join(', ')}`
      });
    }

    const lead = await Lead.findById(leadId);
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    const previousStage = lead.pipelineStage;

    // Move to new stage
    lead.moveToStage(stage, notes);
    await lead.save();

    // Update status based on pipeline stage
    if (stage === 'won') {
      lead.status = 'converted';
      lead.convertedAt = new Date();
      await lead.save();
    } else if (stage === 'lost') {
      lead.status = 'unqualified';
      await lead.save();
    }

    // Send notification if assigned to someone
    if (lead.assignedTo) {
      await sendPipelineUpdated(lead.assignedTo, {
        leadId: lead._id,
        leadEmail: lead.email,
        leadName: lead.name,
        previousStage,
        newStage: stage,
        notes
      });
    }

    res.status(200).json({
      success: true,
      message: `Pipeline stage updated from ${previousStage} to ${stage}`,
      data: {
        lead,
        previousStage,
        newStage: stage
      }
    });
  } catch (error) {
    console.error('Error updating pipeline stage:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Get pipeline view for Kanban board
 * @route   GET /api/leads/pipeline
 * @access  Private/Admin/Manager
 *
 * @param {string} [req.query.assignedTo] - Filter by assigned user
 * @param {string} [req.query.tags] - Filter by tags (comma-separated)
 * @param {number} [req.query.minValue] - Minimum estimated value
 * @param {number} [req.query.minProbability] - Minimum probability
 *
 * @example
 * GET /api/leads/pipeline?assignedTo=507f1f77bcf86cd799439012&tags=high-priority
 */
export const getPipelineView = async (req, res) => {
  try {
    const { assignedTo, tags, minValue, minProbability } = req.query;

    // Build query
    const query = { isActive: true };

    if (assignedTo) {
      query.assignedTo = assignedTo;
    }

    if (tags) {
      query.tags = { $in: tags.split(',').map(t => t.trim().toLowerCase()) };
    }

    if (minValue) {
      query.estimatedValue = { $gte: parseFloat(minValue) };
    }

    if (minProbability) {
      query.probability = { $gte: parseFloat(minProbability) };
    }

    // Get all leads matching query
    const leads = await Lead.find(query)
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email')
      .lean();

    // Organize by pipeline stage
    const stages = ['new', 'contacted', 'meeting_scheduled', 'proposal_sent', 'negotiation', 'won', 'lost'];
    const pipeline = {};

    stages.forEach(stage => {
      pipeline[stage] = leads.filter(lead => lead.pipelineStage === stage);
    });

    // Calculate summary statistics
    const summary = {
      totalLeads: leads.length,
      totalValue: leads.reduce((sum, lead) => sum + (lead.estimatedValue || 0), 0),
      weightedValue: leads.reduce((sum, lead) => {
        const probability = lead.probability || 0;
        return sum + ((lead.estimatedValue || 0) * (probability / 100));
      }, 0),
      byStage: {}
    };

    stages.forEach(stage => {
      const stageLeads = pipeline[stage];
      summary.byStage[stage] = {
        count: stageLeads.length,
        totalValue: stageLeads.reduce((sum, lead) => sum + (lead.estimatedValue || 0), 0),
        avgProbability: stageLeads.length > 0
          ? stageLeads.reduce((sum, lead) => sum + (lead.probability || 0), 0) / stageLeads.length
          : 0
      };
    });

    res.status(200).json({
      success: true,
      data: {
        pipeline,
        summary
      }
    });
  } catch (error) {
    console.error('Error getting pipeline view:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Get pipeline snapshot (counts by stage)
 * @route   GET /api/leads/pipeline-snapshot
 * @access  Private
 *
 * @example
 * GET /api/leads/pipeline-snapshot
 */
export const getPipelineSnapshot = async (req, res) => {
  try {
    const snapshot = await Lead.getPipelineSnapshot();

    res.status(200).json({
      success: true,
      data: snapshot
    });
  } catch (error) {
    console.error('Error getting pipeline snapshot:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ============================================================================
// EMPLOYEE LEAD MANAGEMENT
// ============================================================================

/**
 * @desc    Get all leads assigned to a specific employee
 * @route   GET /api/leads/by-employee/:id
 * @access  Private
 *
 * @param {string} req.params.id - Employee user ID
 * @param {string} [req.query.pipelineStage] - Filter by pipeline stage
 * @param {string} [req.query.sort] - Sort order (default: -assignedAt)
 *
 * @example
 * GET /api/leads/by-employee/507f1f77bcf86cd799439012?pipelineStage=contacted
 */
export const getLeadsByEmployee = async (req, res) => {
  try {
    const { id: employeeId } = req.params;
    const { pipelineStage, sort = '-assignedAt' } = req.query;

    // Verify employee exists
    const employee = await User.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Build query
    const query = {
      assignedTo: employeeId,
      isActive: true
    };

    if (pipelineStage) {
      query.pipelineStage = pipelineStage;
    }

    // Get leads
    const leads = await Lead.find(query)
      .sort(sort)
      .populate('assignedBy', 'name email')
      .lean();

    // Calculate summary statistics
    const summary = {
      totalLeads: leads.length,
      currentCapacity: employee.getAssignedLeadCount(),
      maxCapacity: employee.maxLeadCapacity,
      availableCapacity: employee.availableLeadCapacity,
      totalEstimatedValue: leads.reduce((sum, lead) => sum + (lead.estimatedValue || 0), 0),
      weightedPipelineValue: leads.reduce((sum, lead) => {
        const prob = lead.probability || 0;
        return sum + ((lead.estimatedValue || 0) * (prob / 100));
      }, 0),
      byStage: {}
    };

    // Group by pipeline stage
    const stages = ['new', 'contacted', 'meeting_scheduled', 'proposal_sent', 'negotiation', 'won', 'lost'];
    stages.forEach(stage => {
      const stageLeads = leads.filter(lead => lead.pipelineStage === stage);
      summary.byStage[stage] = {
        count: stageLeads.length,
        value: stageLeads.reduce((sum, lead) => sum + (lead.estimatedValue || 0), 0)
      };
    });

    res.status(200).json({
      success: true,
      data: {
        leads,
        summary
      }
    });
  } catch (error) {
    console.error('Error getting leads by employee:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Get current user's assigned leads
 * @route   GET /api/leads/my-leads
 * @access  Private
 *
 * @param {string} [req.query.pipelineStage] - Filter by pipeline stage
 * @param {string} [req.query.sort] - Sort order
 *
 * @example
 * GET /api/leads/my-leads?pipelineStage=meeting_scheduled
 */
export const getMyLeads = async (req, res) => {
  try {
    const { pipelineStage, sort = '-assignedAt' } = req.query;

    const leads = await Lead.getByAssignee(req.user._id, {
      activeOnly: true,
      sort
    });

    // Filter by pipeline stage if specified
    let filteredLeads = leads;
    if (pipelineStage) {
      filteredLeads = leads.filter(lead => lead.pipelineStage === pipelineStage);
    }

    // Calculate summary
    const summary = {
      totalLeads: filteredLeads.length,
      currentCapacity: req.user.getAssignedLeadCount(),
      maxCapacity: req.user.maxLeadCapacity,
      availableCapacity: req.user.availableLeadCapacity,
      totalEstimatedValue: filteredLeads.reduce((sum, lead) => sum + (lead.estimatedValue || 0), 0),
      byStage: {}
    };

    const stages = ['new', 'contacted', 'meeting_scheduled', 'proposal_sent', 'negotiation', 'won', 'lost'];
    stages.forEach(stage => {
      const stageLeads = filteredLeads.filter(lead => lead.pipelineStage === stage);
      summary.byStage[stage] = {
        count: stageLeads.length,
        value: stageLeads.reduce((sum, lead) => sum + (lead.estimatedValue || 0), 0)
      };
    });

    res.status(200).json({
      success: true,
      data: {
        leads: filteredLeads,
        summary
      }
    });
  } catch (error) {
    console.error('Error getting my leads:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ============================================================================
// TAG MANAGEMENT
// ============================================================================

/**
 * @desc    Add tags to a lead
 * @route   POST /api/leads/:id/tags
 * @access  Private/Admin/Manager
 *
 * @param {string[]} req.body.tags - Tags to add
 *
 * @example
 * POST /api/leads/507f1f77bcf86cd799439011/tags
 * Body: { "tags": ["high-priority", "enterprise", "q4-target"] }
 */
export const addTags = async (req, res) => {
  try {
    const { tags } = req.body;

    if (!tags || !Array.isArray(tags) || tags.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'tags array is required'
      });
    }

    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    const addedTags = [];
    const existingTags = [];

    tags.forEach(tag => {
      if (lead.addTag(tag)) {
        addedTags.push(tag.toLowerCase().trim());
      } else {
        existingTags.push(tag.toLowerCase().trim());
      }
    });

    await lead.save();

    res.status(200).json({
      success: true,
      message: `Added ${addedTags.length} tags`,
      data: {
        addedTags,
        existingTags,
        allTags: lead.tags
      }
    });
  } catch (error) {
    console.error('Error adding tags:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Remove a tag from a lead
 * @route   DELETE /api/leads/:id/tags/:tag
 * @access  Private/Admin/Manager
 *
 * @param {string} req.params.id - Lead ID
 * @param {string} req.params.tag - Tag to remove
 *
 * @example
 * DELETE /api/leads/507f1f77bcf86cd799439011/tags/low-priority
 */
export const removeTag = async (req, res) => {
  try {
    const { tag } = req.params;

    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    const removed = lead.removeTag(tag);
    await lead.save();

    if (!removed) {
      return res.status(404).json({
        success: false,
        message: `Tag "${tag}" not found on lead`
      });
    }

    res.status(200).json({
      success: true,
      message: `Tag "${tag}" removed successfully`,
      data: {
        removedTag: tag,
        remainingTags: lead.tags
      }
    });
  } catch (error) {
    console.error('Error removing tag:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Get leads by tag
 * @route   GET /api/leads/by-tag/:tag
 * @access  Private/Admin/Manager
 *
 * @param {string} req.params.tag - Tag to search for
 *
 * @example
 * GET /api/leads/by-tag/high-priority
 */
export const getLeadsByTag = async (req, res) => {
  try {
    const { tag } = req.params;

    const leads = await Lead.findByTag(tag);

    res.status(200).json({
      success: true,
      count: leads.length,
      data: leads
    });
  } catch (error) {
    console.error('Error getting leads by tag:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ============================================================================
// VALUE & PROBABILITY MANAGEMENT
// ============================================================================

/**
 * @desc    Update lead's estimated value
 * @route   PUT /api/leads/:id/value
 * @access  Private/Admin/Manager
 *
 * @param {number} req.body.estimatedValue - New estimated value
 * @param {string} [req.body.notes] - Notes about the value change
 */
export const updateEstimatedValue = async (req, res) => {
  try {
    const { estimatedValue, notes } = req.body;

    if (estimatedValue === undefined || estimatedValue < 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid estimatedValue is required'
      });
    }

    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    const oldValue = lead.estimatedValue;
    lead.estimatedValue = parseFloat(estimatedValue);

    // Add note if provided
    if (notes) {
      if (!lead.notes) {
        lead.notes = [];
      }
      lead.notes.push({
        content: `Value updated from ${oldValue} to ${lead.estimatedValue}: ${notes}`,
        createdBy: req.user._id,
        createdAt: new Date()
      });
    }

    await lead.save();

    res.status(200).json({
      success: true,
      message: 'Estimated value updated successfully',
      data: {
        oldValue,
        newValue: lead.estimatedValue,
        lead
      }
    });
  } catch (error) {
    console.error('Error updating estimated value:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Update lead's probability
 * @route   PUT /api/leads/:id/probability
 * @access  Private/Admin/Manager
 *
 * @param {number} req.body.probability - New probability (0-100)
 * @param {string} [req.body.notes] - Notes about the probability change
 */
export const updateProbability = async (req, res) => {
  try {
    const { probability, notes } = req.body;

    if (probability === undefined || probability < 0 || probability > 100) {
      return res.status(400).json({
        success: false,
        message: 'Probability must be between 0 and 100'
      });
    }

    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    const oldProbability = lead.probability;
    lead.probability = parseFloat(probability);

    // Recalculate estimated value with new probability
    lead.calculateValue();

    // Add note if provided
    if (notes) {
      if (!lead.notes) {
        lead.notes = [];
      }
      lead.notes.push({
        content: `Probability updated from ${oldProbability}% to ${lead.probability}%: ${notes}`,
        createdBy: req.user._id,
        createdAt: new Date()
      });
    }

    await lead.save();

    res.status(200).json({
      success: true,
      message: 'Probability updated successfully',
      data: {
        oldProbability,
        newProbability: lead.probability,
        newEstimatedValue: lead.estimatedValue,
        lead
      }
    });
  } catch (error) {
    console.error('Error updating probability:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export default {
  assignLead,
  bulkAssignLeads,
  autoAssign,
  unassignLead,
  updatePipelineStage,
  getPipelineView,
  getPipelineSnapshot,
  getLeadsByEmployee,
  getMyLeads,
  addTags,
  removeTag,
  getLeadsByTag,
  updateEstimatedValue,
  updateProbability
};
