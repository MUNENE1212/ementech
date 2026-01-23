import Sequence from '../models/Sequence.js';
import Lead from '../models/Lead.js';
import EmailTemplate from '../models/EmailTemplate.js';
import { addCampaignJob } from '../queues/emailQueue.js';

/**
 * Sequence Controller - Phase 4: Email Sequences & Drip Campaigns
 *
 * Handles all sequence-related operations:
 * - Sequence CRUD operations
 * - Lead enrollment management
 * - Sequence progress tracking
 * - Pause/resume sequences
 * - Analytics and reporting
 *
 * @version 1.0.0
 * @since 2026-01-23
 */

// ============================================================================
// SEQUENCE CRUD OPERATIONS
// ============================================================================

/**
 * @desc    Get all sequences with filters and pagination
 * @route   GET /api/sequences
 * @access  Private/Admin/Manager
 *
 * @param {string} [req.query.status] - Filter by status
 * @param {string} [req.query.type] - Filter by sequence type
 * @param {string} [req.query.category] - Filter by category
 * @param {string} [req.query.search] - Search by name/description
 * @param {number} [req.query.page=1] - Page number
 * @param {number} [req.query.limit=20] - Items per page
 * @param {string} [req.query.sort=-createdAt] - Sort field
 */
export const getSequences = async (req, res) => {
  try {
    const {
      status,
      type,
      category,
      search,
      page = 1,
      limit = 20,
      sort = '-createdAt',
    } = req.query;

    // Build query
    const query = { archivedAt: null };

    if (status) {
      query.status = status;
    }

    if (type) {
      query.type = type;
    }

    if (category) {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
      ];
    }

    // Execute query with pagination
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [sequences, total] = await Promise.all([
      Sequence.find(query)
        .populate('steps.templateId', 'name slug subject')
        .populate('createdBy', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit, 10))
        .lean(),
      Sequence.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count: sequences.length,
      total,
      page: parseInt(page, 10),
      pages: Math.ceil(total / parseInt(limit, 10)),
      data: sequences,
    });

  } catch (error) {
    console.error('Error getting sequences:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Get a single sequence by ID
 * @route   GET /api/sequences/:id
 * @access  Private/Admin/Manager
 *
 * @param {string} req.params.id - Sequence ID
 */
export const getSequenceById = async (req, res) => {
  try {
    const sequence = await Sequence.findById(req.params.id)
      .populate('steps.templateId')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    if (!sequence) {
      return res.status(404).json({
        success: false,
        message: 'Sequence not found',
      });
    }

    // Get current enrollment count
    const activeEnrollments = await Lead.countDocuments({
      'activeSequences.sequenceId': sequence._id,
      'activeSequences.status': 'active',
    });

    res.status(200).json({
      success: true,
      data: {
        ...sequence.toObject(),
        currentEnrollments: activeEnrollments,
      },
    });

  } catch (error) {
    console.error('Error getting sequence:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Create a new sequence
 * @route   POST /api/sequences
 * @access  Private/Admin/Manager
 *
 * @param {Object} req.body - Sequence data
 */
export const createSequence = async (req, res) => {
  try {
    const {
      name,
      description,
      type,
      category,
      tags,
      steps,
      trigger,
      enrollment,
      unsubscribeSettings,
      timezone,
      preferredSendTime,
      allowedSendDays,
      skipWeekends,
      skipHolidays,
      holidays,
      goal,
      goalTarget,
      goalDescription,
      notes,
    } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Sequence name is required',
      });
    }

    // Validate that steps are provided and have templates
    if (!steps || steps.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one step is required',
      });
    }

    // Verify all templates exist
    const templateIds = steps.map(s => s.templateId);
    const templates = await EmailTemplate.find({ _id: { $in: templateIds } });

    if (templates.length !== templateIds.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more email templates not found',
      });
    }

    // Create sequence
    const sequence = new Sequence({
      name,
      description,
      type: type || 'drip',
      category: category || 'custom',
      tags,
      steps,
      trigger,
      enrollment,
      unsubscribeSettings,
      timezone,
      preferredSendTime,
      allowedSendDays,
      skipWeekends,
      skipHolidays,
      holidays,
      goal,
      goalTarget,
      goalDescription,
      notes,
      createdBy: req.user._id,
    });

    await sequence.save();

    // Populate templates for response
    await sequence.populate('steps.templateId', 'name slug subject');

    res.status(201).json({
      success: true,
      message: 'Sequence created successfully',
      data: sequence,
    });

  } catch (error) {
    console.error('Error creating sequence:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Update a sequence
 * @route   PUT /api/sequences/:id
 * @access  Private/Admin/Manager
 *
 * @param {string} req.params.id - Sequence ID
 * @param {Object} req.body - Updated sequence data
 */
export const updateSequence = async (req, res) => {
  try {
    const sequence = await Sequence.findById(req.params.id);

    if (!sequence) {
      return res.status(404).json({
        success: false,
        message: 'Sequence not found',
      });
    }

    // Only allow editing in draft or paused status
    if (sequence.status === 'active' && req.body.steps) {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify steps while sequence is active. Pause the sequence first.',
      });
    }

    // Fields that can be updated
    const allowedFields = [
      'name', 'description', 'type', 'category', 'tags', 'steps',
      'trigger', 'enrollment', 'unsubscribeSettings', 'timezone',
      'preferredSendTime', 'allowedSendDays', 'skipWeekends', 'skipHolidays',
      'holidays', 'goal', 'goalTarget', 'goalDescription', 'notes',
    ];

    // Verify templates if steps are being updated
    if (req.body.steps) {
      const templateIds = req.body.steps.map(s => s.templateId);
      const templates = await EmailTemplate.find({ _id: { $in: templateIds } });

      if (templates.length !== templateIds.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more email templates not found',
        });
      }
    }

    // Update allowed fields
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        sequence[field] = req.body[field];
      }
    });

    sequence.updatedBy = req.user._id;
    await sequence.save();

    await sequence.populate('steps.templateId', 'name slug subject');

    res.status(200).json({
      success: true,
      message: 'Sequence updated successfully',
      data: sequence,
    });

  } catch (error) {
    console.error('Error updating sequence:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Delete (archive) a sequence
 * @route   DELETE /api/sequences/:id
 * @access  Private/Admin
 *
 * @param {string} req.params.id - Sequence ID
 */
export const deleteSequence = async (req, res) => {
  try {
    const sequence = await Sequence.findById(req.params.id);

    if (!sequence) {
      return res.status(404).json({
        success: false,
        message: 'Sequence not found',
      });
    }

    // Don't allow deleting active sequences with enrollments
    if (sequence.status === 'active') {
      const activeEnrollments = await Lead.countDocuments({
        'activeSequences.sequenceId': sequence._id,
        'activeSequences.status': 'active',
      });

      if (activeEnrollments > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot delete active sequence with ${activeEnrollments} active enrollments. Pause the sequence first.`,
        });
      }
    }

    // Soft delete by archiving
    sequence.archive(req.user._id);
    await sequence.save();

    res.status(200).json({
      success: true,
      message: 'Sequence archived successfully',
    });

  } catch (error) {
    console.error('Error deleting sequence:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================================
// SEQUENCE STATUS ACTIONS
// ============================================================================

/**
 * @desc    Activate a sequence
 * @route   POST /api/sequences/:id/activate
 * @access  Private/Admin/Manager
 *
 * @param {string} req.params.id - Sequence ID
 */
export const activateSequence = async (req, res) => {
  try {
    const sequence = await Sequence.findById(req.params.id);

    if (!sequence) {
      return res.status(404).json({
        success: false,
        message: 'Sequence not found',
      });
    }

    // Validate sequence has steps
    if (!sequence.steps || sequence.steps.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot activate sequence with no steps',
      });
    }

    sequence.changeStatus('active', req.user._id, 'Sequence activated');
    await sequence.save();

    res.status(200).json({
      success: true,
      message: 'Sequence activated successfully',
      data: {
        sequenceId: sequence._id,
        status: sequence.status,
      },
    });

  } catch (error) {
    console.error('Error activating sequence:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Pause a sequence
 * @route   POST /api/sequences/:id/pause
 * @access  Private/Admin/Manager
 *
 * @param {string} req.params.id - Sequence ID
 * @param {string} [req.body.reason] - Reason for pausing
 */
export const pauseSequence = async (req, res) => {
  try {
    const { reason } = req.body;

    const sequence = await Sequence.findById(req.params.id);

    if (!sequence) {
      return res.status(404).json({
        success: false,
        message: 'Sequence not found',
      });
    }

    if (sequence.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Can only pause active sequences',
      });
    }

    sequence.changeStatus('paused', req.user._id, reason || 'Sequence paused');
    await sequence.save();

    res.status(200).json({
      success: true,
      message: 'Sequence paused successfully',
      data: {
        sequenceId: sequence._id,
        status: sequence.status,
        statusReason: sequence.statusReason,
      },
    });

  } catch (error) {
    console.error('Error pausing sequence:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Resume a paused sequence
 * @route   POST /api/sequences/:id/resume
 * @access  Private/Admin/Manager
 *
 * @param {string} req.params.id - Sequence ID
 */
export const resumeSequence = async (req, res) => {
  try {
    const sequence = await Sequence.findById(req.params.id);

    if (!sequence) {
      return res.status(404).json({
        success: false,
        message: 'Sequence not found',
      });
    }

    if (sequence.status !== 'paused') {
      return res.status(400).json({
        success: false,
        message: 'Can only resume paused sequences',
      });
    }

    sequence.changeStatus('active', req.user._id, 'Sequence resumed');
    await sequence.save();

    res.status(200).json({
      success: true,
      message: 'Sequence resumed successfully',
      data: {
        sequenceId: sequence._id,
        status: sequence.status,
      },
    });

  } catch (error) {
    console.error('Error resuming sequence:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================================
// SEQUENCE STEPS MANAGEMENT
// ============================================================================

/**
 * @desc    Add a step to a sequence
 * @route   POST /api/sequences/:id/steps
 * @access  Private/Admin/Manager
 *
 * @param {string} req.params.id - Sequence ID
 * @param {Object} req.body - Step data
 */
export const addStep = async (req, res) => {
  try {
    const { templateId, subject, delay, conditions, skipIfConditionsNotMet, canRepeat, notes } = req.body;

    if (!templateId) {
      return res.status(400).json({
        success: false,
        message: 'Template ID is required',
      });
    }

    // Verify template exists
    const template = await EmailTemplate.findById(templateId);
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Email template not found',
      });
    }

    const sequence = await Sequence.findById(req.params.id);

    if (!sequence) {
      return res.status(404).json({
        success: false,
        message: 'Sequence not found',
      });
    }

    // Only allow steps in draft or paused status
    if (sequence.status === 'active') {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify steps while sequence is active',
      });
    }

    sequence.addStep({
      templateId,
      subject,
      delay: delay || { value: 1, unit: 'days' },
      conditions,
      skipIfConditionsNotMet,
      canRepeat,
      notes,
    });

    await sequence.save();
    await sequence.populate('steps.templateId', 'name slug subject');

    res.status(200).json({
      success: true,
      message: 'Step added successfully',
      data: sequence,
    });

  } catch (error) {
    console.error('Error adding step:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Update a step in a sequence
 * @route   PUT /api/sequences/:id/steps/:stepOrder
 * @access  Private/Admin/Manager
 *
 * @param {string} req.params.id - Sequence ID
 * @param {number} req.params.stepOrder - Step order number
 * @param {Object} req.body - Step updates
 */
export const updateStep = async (req, res) => {
  try {
    const { stepOrder } = req.params;
    const updates = req.body;

    const sequence = await Sequence.findById(req.params.id);

    if (!sequence) {
      return res.status(404).json({
        success: false,
        message: 'Sequence not found',
      });
    }

    if (sequence.status === 'active') {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify steps while sequence is active',
      });
    }

    // Verify template if being changed
    if (updates.templateId) {
      const template = await EmailTemplate.findById(updates.templateId);
      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'Email template not found',
        });
      }
    }

    sequence.updateStep(parseInt(stepOrder), updates);
    await sequence.save();
    await sequence.populate('steps.templateId', 'name slug subject');

    res.status(200).json({
      success: true,
      message: 'Step updated successfully',
      data: sequence,
    });

  } catch (error) {
    console.error('Error updating step:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Remove a step from a sequence
 * @route   DELETE /api/sequences/:id/steps/:stepOrder
 * @access  Private/Admin/Manager
 *
 * @param {string} req.params.id - Sequence ID
 * @param {number} req.params.stepOrder - Step order number
 */
export const removeStep = async (req, res) => {
  try {
    const { stepOrder } = req.params;

    const sequence = await Sequence.findById(req.params.id);

    if (!sequence) {
      return res.status(404).json({
        success: false,
        message: 'Sequence not found',
      });
    }

    if (sequence.status === 'active') {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify steps while sequence is active',
      });
    }

    sequence.removeStep(parseInt(stepOrder));
    await sequence.save();
    await sequence.populate('steps.templateId', 'name slug subject');

    res.status(200).json({
      success: true,
      message: 'Step removed successfully',
      data: sequence,
    });

  } catch (error) {
    console.error('Error removing step:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Reorder steps in a sequence
 * @route   PUT /api/sequences/:id/steps/reorder
 * @access  Private/Admin/Manager
 *
 * @param {string} req.params.id - Sequence ID
 * @param {number[]} req.body.stepOrders - Array of step IDs in new order
 */
export const reorderSteps = async (req, res) => {
  try {
    const { stepOrders } = req.body;

    if (!Array.isArray(stepOrders)) {
      return res.status(400).json({
        success: false,
        message: 'stepOrders must be an array',
      });
    }

    const sequence = await Sequence.findById(req.params.id);

    if (!sequence) {
      return res.status(404).json({
        success: false,
        message: 'Sequence not found',
      });
    }

    if (sequence.status === 'active') {
      return res.status(400).json({
        success: false,
        message: 'Cannot reorder steps while sequence is active',
      });
    }

    // Create a map of current steps
    const stepsMap = new Map();
    sequence.steps.forEach(step => {
      stepsMap.set(step.order.toString(), step);
    });

    // Rebuild steps array with new order
    const newSteps = [];
    stepOrders.forEach((order, index) => {
      const step = stepsMap.get(order.toString());
      if (step) {
        step.order = index + 1;
        newSteps.push(step);
      }
    });

    sequence.steps = newSteps;
    sequence.estimatedDuration = sequence.calculateDuration();
    await sequence.save();
    await sequence.populate('steps.templateId', 'name slug subject');

    res.status(200).json({
      success: true,
      message: 'Steps reordered successfully',
      data: sequence,
    });

  } catch (error) {
    console.error('Error reordering steps:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================================
// LEAD ENROLLMENT
// ============================================================================

/**
 * @desc    Enroll a lead in a sequence
 * @route   POST /api/sequences/:id/enroll
 * @access  Private/Admin/Manager
 *
 * @param {string} req.params.id - Sequence ID
 * @param {string} req.body.leadId - Lead ID to enroll
 * @param {number} [req.body.startAtStep=0] - Step to start at (0-indexed)
 */
export const enrollLead = async (req, res) => {
  try {
    const { leadId, startAtStep = 0 } = req.body;

    if (!leadId) {
      return res.status(400).json({
        success: false,
        message: 'Lead ID is required',
      });
    }

    const sequence = await Sequence.findById(req.params.id);

    if (!sequence) {
      return res.status(404).json({
        success: false,
        message: 'Sequence not found',
      });
    }

    if (sequence.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Can only enroll leads in active sequences',
      });
    }

    const lead = await Lead.findById(leadId);

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found',
      });
    }

    // Check if already enrolled
    const existingEnrollment = lead.activeSequences?.find(
      s => s.sequenceId.toString() === sequence._id.toString()
    );

    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        message: 'Lead is already enrolled in this sequence',
      });
    }

    // Initialize array if needed
    if (!lead.activeSequences) {
      lead.activeSequences = [];
    }

    // Add enrollment
    lead.activeSequences.push({
      sequenceId: sequence._id,
      enrolledAt: new Date(),
      status: 'active',
      stepIndex: startAtStep,
      lastEmailSentAt: startAtStep > 0 ? new Date() : null,
    });

    await lead.save();

    // Update sequence metrics
    sequence.updateMetrics({ enrolled: 1, active: 1 });
    await sequence.save();

    // If starting at step 0, schedule first email
    if (startAtStep === 0 && sequence.steps.length > 0) {
      const firstStep = sequence.steps[0];

      // Calculate send time based on trigger delay
      const sendTime = new Date();
      const initialDelay = sequence.trigger?.initialDelay || { value: 0, unit: 'hours' };

      switch (initialDelay.unit) {
        case 'minutes':
          sendTime.setMinutes(sendTime.getMinutes() + initialDelay.value);
          break;
        case 'hours':
          sendTime.setHours(sendTime.getHours() + initialDelay.value);
          break;
        case 'days':
          sendTime.setDate(sendTime.getDate() + initialDelay.value);
          break;
      }

      // Store pending send for the processor
      if (!lead.pendingSequenceEmails) {
        lead.pendingSequenceEmails = [];
      }

      lead.pendingSequenceEmails.push({
        sequenceId: sequence._id,
        stepOrder: 1,
        scheduledFor: sendTime,
        templateId: firstStep.templateId,
      });

      await lead.save();
    }

    res.status(200).json({
      success: true,
      message: 'Lead enrolled successfully',
      data: {
        leadId: lead._id,
        sequenceId: sequence._id,
        sequenceName: sequence.name,
        enrolledAt: new Date(),
        startingStep: startAtStep + 1,
        totalSteps: sequence.steps.length,
      },
    });

  } catch (error) {
    console.error('Error enrolling lead:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Bulk enroll leads in a sequence
 * @route   POST /api/sequences/:id/enroll-bulk
 * @access  Private/Admin/Manager
 *
 * @param {string} req.params.id - Sequence ID
 * @param {string[]} req.body.leadIds - Array of Lead IDs to enroll
 * @param {number} [req.body.startAtStep=0] - Step to start at
 */
export const enrollLeadsBulk = async (req, res) => {
  try {
    const { leadIds, startAtStep = 0 } = req.body;

    if (!Array.isArray(leadIds) || leadIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'leadIds must be a non-empty array',
      });
    }

    if (leadIds.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Cannot enroll more than 100 leads at once',
      });
    }

    const sequence = await Sequence.findById(req.params.id);

    if (!sequence) {
      return res.status(404).json({
        success: false,
        message: 'Sequence not found',
      });
    }

    if (sequence.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Can only enroll leads in active sequences',
      });
    }

    const results = {
      enrolled: [],
      skipped: [],
      failed: [],
    };

    for (const leadId of leadIds) {
      try {
        const lead = await Lead.findById(leadId);

        if (!lead) {
          results.failed.push({ leadId, reason: 'Lead not found' });
          continue;
        }

        // Check if already enrolled
        const existingEnrollment = lead.activeSequences?.find(
          s => s.sequenceId.toString() === sequence._id.toString()
        );

        if (existingEnrollment) {
          results.skipped.push({ leadId, reason: 'Already enrolled' });
          continue;
        }

        // Initialize array if needed
        if (!lead.activeSequences) {
          lead.activeSequences = [];
        }

        // Add enrollment
        lead.activeSequences.push({
          sequenceId: sequence._id,
          enrolledAt: new Date(),
          status: 'active',
          stepIndex: startAtStep,
          lastEmailSentAt: startAtStep > 0 ? new Date() : null,
        });

        await lead.save();
        results.enrolled.push(leadId);

      } catch (err) {
        results.failed.push({ leadId, reason: err.message });
      }
    }

    // Update sequence metrics
    sequence.updateMetrics({ enrolled: results.enrolled.length, active: results.enrolled.length });
    await sequence.save();

    res.status(200).json({
      success: true,
      message: `Enrolled ${results.enrolled.length} leads`,
      data: results,
    });

  } catch (error) {
    console.error('Error bulk enrolling leads:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Unsubscribe a lead from a sequence
 * @route   POST /api/sequences/:id/unsubscribe
 * @access  Private/Admin/Manager
 *
 * @param {string} req.params.id - Sequence ID
 * @param {string} req.body.leadId - Lead ID to unsubscribe
 * @param {string} [req.body.reason] - Reason for unsubscribing
 */
export const unsubscribeLead = async (req, res) => {
  try {
    const { leadId, reason } = req.body;

    if (!leadId) {
      return res.status(400).json({
        success: false,
        message: 'Lead ID is required',
      });
    }

    const sequence = await Sequence.findById(req.params.id);

    if (!sequence) {
      return res.status(404).json({
        success: false,
        message: 'Sequence not found',
      });
    }

    const lead = await Lead.findById(leadId);

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found',
      });
    }

    // Find and remove from active sequences
    const enrollmentIndex = lead.activeSequences?.findIndex(
      s => s.sequenceId.toString() === sequence._id.toString()
    );

    if (enrollmentIndex === -1 || enrollmentIndex === undefined) {
      return res.status(404).json({
        success: false,
        message: 'Lead is not enrolled in this sequence',
      });
    }

    const enrollment = lead.activeSequences[enrollmentIndex];

    // Add to completed sequences with unsubscribed status
    if (!lead.completedSequences) {
      lead.completedSequences = [];
    }

    lead.completedSequences.push({
      sequenceId: sequence._id,
      completedAt: new Date(),
      status: 'unsubscribed',
      finalStepIndex: enrollment.stepIndex || 0,
      reason: reason || 'Manually unsubscribed',
    });

    // Remove from active
    lead.activeSequences.splice(enrollmentIndex, 1);

    await lead.save();

    // Update sequence metrics
    sequence.updateMetrics({ unsubscribed: 1, active: -1 });
    await sequence.save();

    res.status(200).json({
      success: true,
      message: 'Lead unsubscribed successfully',
      data: {
        leadId: lead._id,
        sequenceId: sequence._id,
        unsubscribedAt: new Date(),
      },
    });

  } catch (error) {
    console.error('Error unsubscribing lead:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Pause a sequence for a specific lead
 * @route   POST /api/sequences/:id/pause-lead
 * @access  Private/Admin/Manager
 *
 * @param {string} req.params.id - Sequence ID
 * @param {string} req.body.leadId - Lead ID
 */
export const pauseLeadSequence = async (req, res) => {
  try {
    const { leadId } = req.body;

    if (!leadId) {
      return res.status(400).json({
        success: false,
        message: 'Lead ID is required',
      });
    }

    const sequence = await Sequence.findById(req.params.id);

    if (!sequence) {
      return res.status(404).json({
        success: false,
        message: 'Sequence not found',
      });
    }

    const lead = await Lead.findById(leadId);

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found',
      });
    }

    // Find enrollment
    const enrollment = lead.activeSequences?.find(
      s => s.sequenceId.toString() === sequence._id.toString()
    );

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Lead is not enrolled in this sequence',
      });
    }

    enrollment.status = 'paused';
    enrollment.pausedAt = new Date();

    await lead.save();

    res.status(200).json({
      success: true,
      message: 'Sequence paused for lead',
      data: {
        leadId: lead._id,
        sequenceId: sequence._id,
        pausedAt: enrollment.pausedAt,
      },
    });

  } catch (error) {
    console.error('Error pausing lead sequence:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Resume a sequence for a specific lead
 * @route   POST /api/sequences/:id/resume-lead
 * @access  Private/Admin/Manager
 *
 * @param {string} req.params.id - Sequence ID
 * @param {string} req.body.leadId - Lead ID
 */
export const resumeLeadSequence = async (req, res) => {
  try {
    const { leadId } = req.body;

    if (!leadId) {
      return res.status(400).json({
        success: false,
        message: 'Lead ID is required',
      });
    }

    const sequence = await Sequence.findById(req.params.id);

    if (!sequence) {
      return res.status(404).json({
        success: false,
        message: 'Sequence not found',
      });
    }

    const lead = await Lead.findById(leadId);

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found',
      });
    }

    // Find enrollment
    const enrollment = lead.activeSequences?.find(
      s => s.sequenceId.toString() === sequence._id.toString()
    );

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Lead is not enrolled in this sequence',
      });
    }

    if (enrollment.status !== 'paused') {
      return res.status(400).json({
        success: false,
        message: 'Sequence is not paused for this lead',
      });
    }

    enrollment.status = 'active';
    enrollment.resumedAt = new Date();

    await lead.save();

    res.status(200).json({
      success: true,
      message: 'Sequence resumed for lead',
      data: {
        leadId: lead._id,
        sequenceId: sequence._id,
        resumedAt: enrollment.resumedAt,
      },
    });

  } catch (error) {
    console.error('Error resuming lead sequence:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================================
// PROGRESS TRACKING
// ============================================================================

/**
 * @desc    Get sequence progress for a lead
 * @route   GET /api/sequences/:id/progress/:leadId
 * @access  Private/Admin/Manager
 *
 * @param {string} req.params.id - Sequence ID
 * @param {string} req.params.leadId - Lead ID
 */
export const getLeadProgress = async (req, res) => {
  try {
    const { id, leadId } = req.params;

    const sequence = await Sequence.findById(id).populate('steps.templateId', 'name subject');

    if (!sequence) {
      return res.status(404).json({
        success: false,
        message: 'Sequence not found',
      });
    }

    const lead = await Lead.findById(leadId);

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found',
      });
    }

    // Find active enrollment
    const enrollment = lead.activeSequences?.find(
      s => s.sequenceId.toString() === sequence._id.toString()
    );

    // Check completed sequences
    const completed = lead.completedSequences?.find(
      s => s.sequenceId.toString() === sequence._id.toString()
    );

    if (!enrollment && !completed) {
      return res.status(404).json({
        success: false,
        message: 'Lead is not enrolled in this sequence',
      });
    }

    const currentStepIndex = enrollment?.stepIndex || 0;
    const totalSteps = sequence.steps.length;
    const completedSteps = currentStepIndex;
    const remainingSteps = totalSteps - completedSteps;
    const progressPercent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

    // Calculate next send time
    let nextSendAt = null;
    if (enrollment && enrollment.status === 'active' && currentStepIndex < totalSteps) {
      const nextStep = sequence.steps[currentStepIndex];
      if (nextStep && enrollment.lastEmailSentAt) {
        const lastSent = new Date(enrollment.lastEmailSentAt);
        const delay = nextStep.delay || { value: 1, unit: 'days' };

        nextSendAt = new Date(lastSent);
        switch (delay.unit) {
          case 'minutes':
            nextSendAt.setMinutes(nextSendAt.getMinutes() + delay.value);
            break;
          case 'hours':
            nextSendAt.setHours(nextSendAt.getHours() + delay.value);
            break;
          case 'days':
            nextSendAt.setDate(nextSendAt.getDate() + delay.value);
            break;
          case 'weeks':
            nextSendAt.setDate(nextSendAt.getDate() + (delay.value * 7));
            break;
        }
      }
    }

    res.status(200).json({
      success: true,
      data: {
        leadId: lead._id,
        leadEmail: lead.email,
        leadName: lead.name,
        sequenceId: sequence._id,
        sequenceName: sequence.name,
        status: enrollment?.status || completed?.status,
        enrolledAt: enrollment?.enrolledAt || completed?.completedAt,
        currentStepIndex,
        currentStepNumber: currentStepIndex + 1,
        totalSteps,
        completedSteps,
        remainingSteps,
        progressPercent,
        nextSendAt,
        estimatedCompletion: nextSendAt, // Simplified - actual would need full calculation
        steps: sequence.steps.map((step, index) => ({
          order: step.order,
          subject: step.subject || sequence.steps[index]?.templateId?.subject,
          templateId: step.templateId,
          status: index < currentStepIndex ? 'sent' : (index === currentStepIndex ? 'next' : 'pending'),
          delay: step.delay,
        })),
        isCompleted: !!completed,
        completedAt: completed?.completedAt,
      },
    });

  } catch (error) {
    console.error('Error getting lead progress:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Get all enrollments for a sequence
 * @route   GET /api/sequences/:id/enrollments
 * @access  Private/Admin/Manager
 *
 * @param {string} req.params.id - Sequence ID
 * @param {string} [req.query.status] - Filter by enrollment status
 */
export const getSequenceEnrollments = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, page = 1, limit = 50 } = req.query;

    const sequence = await Sequence.findById(id);

    if (!sequence) {
      return res.status(404).json({
        success: false,
        message: 'Sequence not found',
      });
    }

    // Build query for leads
    const query = {
      $or: [
        { 'activeSequences.sequenceId': sequence._id },
        { 'completedSequences.sequenceId': sequence._id },
      ],
    };

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const leads = await Lead.find(query)
      .select('email name company activeSequences completedSequences')
      .skip(skip)
      .limit(parseInt(limit, 10))
      .lean();

    // Process and filter results
    const enrollments = leads
      .map(lead => {
        const active = lead.activeSequences?.find(
          s => s.sequenceId.toString() === sequence._id.toString()
        );
        const completed = lead.completedSequences?.find(
          s => s.sequenceId.toString() === sequence._id.toString()
        );

        const enrollment = active || completed;

        if (!enrollment) return null;

        if (status && enrollment.status !== status) return null;

        return {
          leadId: lead._id,
          leadEmail: lead.email,
          leadName: lead.name,
          leadCompany: lead.company,
          status: enrollment.status,
          enrolledAt: enrollment.enrolledAt,
          stepIndex: enrollment.stepIndex || 0,
          lastEmailSentAt: enrollment.lastEmailSentAt,
          completedAt: enrollment.completedAt || completed?.completedAt,
          pausedAt: enrollment.pausedAt,
        };
      })
      .filter(e => e !== null);

    // Get total count
    const total = await Lead.countDocuments(query);

    res.status(200).json({
      success: true,
      count: enrollments.length,
      total,
      page: parseInt(page, 10),
      pages: Math.ceil(total / parseInt(limit, 10)),
      data: enrollments,
    });

  } catch (error) {
    console.error('Error getting enrollments:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================================
// ANALYTICS & REPORTING
// ============================================================================

/**
 * @desc    Get sequence analytics
 * @route   GET /api/sequences/:id/analytics
 * @access  Private/Admin/Manager
 *
 * @param {string} req.params.id - Sequence ID
 */
export const getSequenceAnalytics = async (req, res) => {
  try {
    const sequence = await Sequence.findById(req.params.id);

    if (!sequence) {
      return res.status(404).json({
        success: false,
        message: 'Sequence not found',
      });
    }

    // Get enrollment data
    const leads = await Lead.find({
      $or: [
        { 'activeSequences.sequenceId': sequence._id },
        { 'completedSequences.sequenceId': sequence._id },
      ],
    });

    const activeEnrollments = leads.filter(lead =>
      lead.activeSequences?.some(s => s.sequenceId.toString() === sequence._id.toString() && s.status === 'active')
    ).length;

    const pausedEnrollments = leads.filter(lead =>
      lead.activeSequences?.some(s => s.sequenceId.toString() === sequence._id.toString() && s.status === 'paused')
    ).length;

    const completions = leads.filter(lead =>
      lead.completedSequences?.some(s => s.sequenceId.toString() === sequence._id.toString() && s.status === 'completed')
    ).length;

    const unsubscribes = leads.filter(lead =>
      lead.completedSequences?.some(s => s.sequenceId.toString() === sequence._id.toString() && s.status === 'unsubscribed')
    ).length;

    // Calculate step completion rates
    const stepStats = sequence.steps.map(step => {
      const completedCount = leads.filter(lead => {
        const completed = lead.completedSequences?.find(
          s => s.sequenceId.toString() === sequence._id.toString()
        );
        return completed && completed.finalStepIndex >= step.order;
      }).length;

      return {
        order: step.order,
        completed: completedCount,
        total: leads.length,
        rate: leads.length > 0 ? Math.round((completedCount / leads.length) * 10000) / 100 : 0,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        sequence: {
          id: sequence._id,
          name: sequence.name,
          type: sequence.type,
          status: sequence.status,
        },
        enrollments: {
          total: leads.length,
          active: activeEnrollments,
          paused: pausedEnrollments,
          completed: completions,
          unsubscribed: unsubscribes,
        },
        rates: {
          completionRate: sequence.completionRate,
          openRate: sequence.openRate,
          clickRate: sequence.clickRate,
          unsubscribeRate: sequence.unsubscribeRate,
          conversionRate: sequence.conversionRate,
        },
        metrics: {
          emailsSent: sequence.metrics?.emailsSent || 0,
          uniqueOpens: sequence.metrics?.uniqueOpens || 0,
          uniqueClicks: sequence.metrics?.uniqueClicks || 0,
          bounces: sequence.metrics?.bounces || 0,
          revenue: sequence.metrics?.revenue || 0,
          avgCompletionTime: sequence.metrics?.avgCompletionTime || 0,
        },
        stepStats,
        estimatedDuration: sequence.estimatedDuration,
      },
    });

  } catch (error) {
    console.error('Error getting sequence analytics:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Get aggregate sequence metrics
 * @route   GET /api/sequences/analytics
 * @access  Private/Admin/Manager
 *
 * @param {string} [req.query.type] - Filter by sequence type
 * @param {string} [req.query.category] - Filter by category
 */
export const getAggregateAnalytics = async (req, res) => {
  try {
    const { type, category } = req.query;

    const metrics = await Sequence.getAggregateMetrics({ type, category });

    // Get active sequence counts by type
    const typeBreakdown = await Sequence.aggregate([
      {
        $match: {
          status: 'active',
          archivedAt: null,
          ...(type && { type }),
          ...(category && { category }),
        },
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalEnrolled: { $sum: '$metrics.enrolled' },
        },
      },
    ]);

    // Get top performing sequences
    const topSequences = await Sequence.getTopPerforming('completionRate', 5);

    res.status(200).json({
      success: true,
      data: {
        aggregate: metrics,
        typeBreakdown: typeBreakdown.map(t => ({
          type: t._id,
          count: t.count,
          totalEnrolled: t.totalEnrolled,
        })),
        topPerforming: topSequences.map(s => ({
          id: s._id,
          name: s.name,
          type: s.type,
          completionRate: s.completionRate,
          openRate: s.openRate,
          enrolled: s.metrics?.enrolled || 0,
        })),
      },
    });

  } catch (error) {
    console.error('Error getting aggregate analytics:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================================
// SEQUENCE OPERATIONS
// ============================================================================

/**
 * @desc    Duplicate a sequence
 * @route   POST /api/sequences/:id/duplicate
 * @access  Private/Admin/Manager
 *
 * @param {string} req.params.id - Sequence ID
 * @param {string} [req.body.name] - Name for duplicate
 */
export const duplicateSequence = async (req, res) => {
  try {
    const { name } = req.body;

    const sequence = await Sequence.findById(req.params.id);

    if (!sequence) {
      return res.status(404).json({
        success: false,
        message: 'Sequence not found',
      });
    }

    const newName = name || `${sequence.name} (Copy)`;
    const duplicate = sequence.duplicate(newName, req.user._id);

    // Generate unique slug
    duplicate.slug = await Sequence.generateSlug(newName);

    await duplicate.save();
    await duplicate.populate('steps.templateId', 'name slug subject');

    res.status(201).json({
      success: true,
      message: 'Sequence duplicated successfully',
      data: duplicate,
    });

  } catch (error) {
    console.error('Error duplicating sequence:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Preview a sequence
 * @route   GET /api/sequences/:id/preview
 * @access  Private/Admin/Manager
 *
 * @param {string} req.params.id - Sequence ID
 */
export const previewSequence = async (req, res) => {
  try {
    const sequence = await Sequence.findById(req.params.id)
      .populate('steps.templateId', 'name subject htmlBody');

    if (!sequence) {
      return res.status(404).json({
        success: false,
        message: 'Sequence not found',
      });
    }

    // Build preview data
    const preview = {
      id: sequence._id,
      name: sequence.name,
      description: sequence.description,
      type: sequence.type,
      estimatedDuration: sequence.estimatedDuration,
      totalSteps: sequence.steps.length,
      steps: sequence.steps.map(step => ({
        order: step.order,
        subject: step.subject || step.templateId?.subject,
        delay: step.delay,
        templateName: step.templateId?.name,
        conditions: step.conditions,
      })),
      trigger: sequence.trigger,
      enrollment: sequence.enrollment,
      goal: sequence.goal,
      goalDescription: sequence.goalDescription,
    };

    res.status(200).json({
      success: true,
      data: preview,
    });

  } catch (error) {
    console.error('Error previewing sequence:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================================
// EXPORT
// ============================================================================

export default {
  // CRUD
  getSequences,
  getSequenceById,
  createSequence,
  updateSequence,
  deleteSequence,

  // Status
  activateSequence,
  pauseSequence,
  resumeSequence,

  // Steps
  addStep,
  updateStep,
  removeStep,
  reorderSteps,

  // Enrollment
  enrollLead,
  enrollLeadsBulk,
  unsubscribeLead,
  pauseLeadSequence,
  resumeLeadSequence,

  // Progress
  getLeadProgress,
  getSequenceEnrollments,

  // Analytics
  getSequenceAnalytics,
  getAggregateAnalytics,

  // Operations
  duplicateSequence,
  previewSequence,
};
