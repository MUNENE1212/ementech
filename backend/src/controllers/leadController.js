import Lead from '../models/Lead.js';
import Interaction from '../models/Interaction.js';

// @desc    Create a new lead
// @route   POST /api/leads
// @access  Public
export const createLead = async (req, res) => {
  try {
    const {
      email,
      name,
      source,
      consentGiven,
      ...additionalData
    } = req.body;

    // Validate required fields
    if (!email || !source) {
      return res.status(400).json({
        success: false,
        message: 'Email and source are required'
      });
    }

    // Check if lead already exists
    let lead = await Lead.findOne({ email });

    if (lead) {
      // Update existing lead
      if (!lead.isActive) {
        lead.isActive = true;
        lead.unsubscribed = false;
        lead.unsubscribeReason = null;
      }

      // Update with new data
      Object.assign(lead, additionalData);

      // Update consent if provided
      if (consentGiven && !lead.consentGiven) {
        lead.consentGiven = true;
        lead.consentDate = new Date();
        lead.consentIP = req.ip;
      }

      await lead.save();
    } else {
      // Create new lead
      lead = await Lead.create({
        email,
        name,
        source,
        consentGiven: consentGiven || false,
        consentDate: consentGiven ? new Date() : null,
        consentIP: consentGiven ? req.ip : null,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        ...additionalData
      });
    }

    // Track interaction
    await Interaction.create({
      leadId: lead._id,
      eventType: 'form_submit',
      eventCategory: 'conversion',
      formType: source,
      formData: additionalData,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.status(201).json({
      success: true,
      message: 'Lead created successfully',
      data: lead
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all leads (admin only)
// @route   GET /api/leads
// @access  Private/Admin
export const getLeads = async (req, res) => {
  try {
    const {
      status,
      source,
      priority,
      profileStage,
      page = 1,
      limit = 20,
      sort = '-createdAt',
      search
    } = req.query;

    // Build query
    const query = { isActive: true };

    if (status) query.status = status;
    if (source) query.source = source;
    if (priority) query.priority = priority;
    if (profileStage) query.profileStage = profileStage;

    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } }
      ];
    }

    // Execute query with pagination
    const leads = await Lead.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    // Get total count
    const total = await Lead.countDocuments(query);

    res.status(200).json({
      success: true,
      count: leads.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: leads
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single lead
// @route   GET /api/leads/:id
// @access  Private/Admin
export const getLeadById = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id)
      .lean();

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    // Get lead's interactions
    const interactions = await Interaction.getUserJourney(lead._id, 20);
    const metrics = await Interaction.getEngagementMetrics(lead._id);

    res.status(200).json({
      success: true,
      data: {
        ...lead,
        interactions,
        engagementMetrics: metrics
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update lead
// @route   PUT /api/leads/:id
// @access  Private/Admin
export const updateLead = async (req, res) => {
  try {
    let lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    // Update lead
    Object.assign(lead, req.body);
    await lead.save();

    res.status(200).json({
      success: true,
      message: 'Lead updated successfully',
      data: lead
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Soft delete lead
// @route   DELETE /api/leads/:id
// @access  Private/Admin
export const deleteLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    lead.isActive = false;
    await lead.save();

    res.status(200).json({
      success: true,
      message: 'Lead deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Recalculate lead scores
// @route   POST /api/leads/score
// @access  Private/Admin
export const recalculateScores = async (req, res) => {
  try {
    const { leadIds } = req.body;

    let query = {};
    if (leadIds && leadIds.length > 0) {
      query._id = { $in: leadIds };
    }

    const leads = await Lead.find(query);

    const results = [];
    for (const lead of leads) {
      const oldScore = lead.leadScore;
      lead.calculateLeadScore();
      await lead.save();
      results.push({
        leadId: lead._id,
        email: lead.email,
        oldScore,
        newScore: lead.leadScore
      });
    }

    res.status(200).json({
      success: true,
      message: `Recalculated scores for ${results.length} leads`,
      data: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Convert lead to opportunity/customer
// @route   POST /api/leads/:id/convert
// @access  Private/Admin
export const convertLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    lead.status = 'converted';
    lead.convertedAt = new Date();
    await lead.save();

    // Track conversion
    await Interaction.create({
      leadId: lead._id,
      eventType: 'conversion',
      eventCategory: 'conversion',
      impactScore: 100,
      value: 100
    });

    res.status(200).json({
      success: true,
      message: 'Lead converted successfully',
      data: lead
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get lead statistics
// @route   GET /api/leads/statistics
// @access  Private/Admin
export const getLeadStatistics = async (req, res) => {
  try {
    const { days = 30, source } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const matchQuery = {
      isActive: true,
      createdAt: { $gte: startDate }
    };

    if (source) matchQuery.source = source;

    const stats = await Lead.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalLeads: { $sum: 1 },
          byStatus: {
            $push: '$status'
          },
          bySource: {
            $push: '$source'
          },
          byPriority: {
            $push: '$priority'
          },
          avgLeadScore: {
            $avg: '$leadScore'
          },
          convertedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'converted'] }, 1, 0] }
          },
          qualifiedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'qualified'] }, 1, 0] }
          }
        }
      }
    ]);

    const result = stats[0] || {
      totalLeads: 0,
      byStatus: [],
      bySource: [],
      byPriority: [],
      avgLeadScore: 0,
      convertedCount: 0,
      qualifiedCount: 0
    };

    // Count by status
    const statusCounts = {};
    result.byStatus.forEach(status => {
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    // Count by source
    const sourceCounts = {};
    result.bySource.forEach(source => {
      sourceCounts[source] = (sourceCounts[source] || 0) + 1;
    });

    // Count by priority
    const priorityCounts = {};
    result.byPriority.forEach(priority => {
      priorityCounts[priority] = (priorityCounts[priority] || 0) + 1;
    });

    res.status(200).json({
      success: true,
      data: {
        totalLeads: result.totalLeads,
        avgLeadScore: Math.round(result.avgLeadScore),
        convertedCount: result.convertedCount,
        qualifiedCount: result.qualifiedCount,
        conversionRate: result.totalLeads > 0
          ? ((result.convertedCount / result.totalLeads) * 100).toFixed(2)
          : 0,
        byStatus: statusCounts,
        bySource: sourceCounts,
        byPriority: priorityCounts
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Unsubscribe lead
// @route   POST /api/leads/:id/unsubscribe
// @access  Public
export const unsubscribeLead = async (req, res) => {
  try {
    const { reason } = req.body;
    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    lead.unsubscribed = true;
    lead.unsubscribeDate = new Date();
    lead.unsubscribeReason = reason;
    lead.marketingConsent = false;
    await lead.save();

    res.status(200).json({
      success: true,
      message: 'Successfully unsubscribed'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Add note to lead
// @route   POST /api/leads/:id/notes
// @access  Private/Admin
export const addNote = async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Note content is required'
      });
    }

    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    lead.notes.push({
      content,
      createdBy: req.user ? req.user.id : null,
      createdAt: new Date()
    });

    await lead.save();

    res.status(200).json({
      success: true,
      message: 'Note added successfully',
      data: lead
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get qualified leads
// @route   GET /api/leads/qualified
// @access  Private/Admin
export const getQualifiedLeads = async (req, res) => {
  try {
    const { minScore = 50 } = req.query;

    const leads = await Lead.find({
      isActive: true,
      leadScore: { $gte: parseInt(minScore) }
    })
      .sort({ leadScore: -1 })
      .limit(50)
      .lean();

    res.status(200).json({
      success: true,
      count: leads.length,
      data: leads
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
