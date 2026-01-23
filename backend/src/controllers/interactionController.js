import Interaction from '../models/Interaction.js';

// @desc    Track user interaction/event
// @route   POST /api/interactions
// @access  Public
export const trackInteraction = async (req, res) => {
  try {
    const {
      leadId,
      sessionId,
      eventType,
      eventCategory,
      ...additionalData
    } = req.body;

    // Validate required fields
    if (!leadId || !eventType) {
      return res.status(400).json({
        success: false,
        message: 'Lead ID and event type are required'
      });
    }

    // Create interaction
    const interaction = await Interaction.create({
      leadId,
      sessionId,
      eventType,
      eventCategory: eventCategory || 'engagement',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      ...additionalData
    });

    // Update lead's activity metrics
    const Lead = (await import('../models/Lead.js')).default;
    const lead = await Lead.findById(leadId);
    if (lead) {
      lead.lastActivity = new Date();
      lead.activityCount += 1;
      if (eventType === 'page_view') {
        lead.pageViews += 1;
      }
      await lead.save();
    }

    res.status(201).json({
      success: true,
      message: 'Interaction tracked successfully',
      data: interaction
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get user journey for a lead
// @route   GET /api/interactions/lead/:leadId
// @access  Private/Admin
export const getUserJourney = async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    const interactions = await Interaction.getUserJourney(
      req.params.leadId,
      parseInt(limit)
    );

    // Get funnel position
    const funnelPosition = await Interaction.getFunnelPosition(req.params.leadId);

    // Get engagement metrics
    const metrics = await Interaction.getEngagementMetrics(req.params.leadId);

    res.status(200).json({
      success: true,
      data: {
        interactions,
        funnelPosition,
        metrics
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get interaction analytics
// @route   GET /api/interactions/analytics
// @access  Private/Admin
export const getInteractionAnalytics = async (req, res) => {
  try {
    const { days = 30, eventType } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const matchQuery = {
      createdAt: { $gte: startDate }
    };

    if (eventType) matchQuery.eventType = eventType;

    const analytics = await Interaction.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$eventType',
          count: { $sum: 1 },
          uniqueLeads: { $addToSet: '$leadId' },
          avgImpactScore: { $avg: '$impactScore' },
          totalValue: { $sum: '$value' }
        }
      },
      {
        $project: {
          eventType: '$_id',
          count: 1,
          uniqueLeads: { $size: '$uniqueLeads' },
          avgImpactScore: { $round: ['$avgImpactScore', 2] },
          totalValue: 1,
          _id: 0
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Batch track interactions
// @route   POST /api/interactions/batch
// @access  Private
export const batchTrack = async (req, res) => {
  try {
    const { interactions } = req.body;

    if (!Array.isArray(interactions) || interactions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Interactions array is required'
      });
    }

    // Add IP and user agent to each interaction
    const enrichedInteractions = interactions.map(interaction => ({
      ...interaction,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    }));

    const created = await Interaction.insertMany(enrichedInteractions);

    res.status(201).json({
      success: true,
      message: `${created.length} interactions tracked successfully`,
      count: created.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
