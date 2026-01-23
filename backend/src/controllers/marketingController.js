import Campaign from '../models/Campaign.js';
import EmailTemplate from '../models/EmailTemplate.js';
import Lead from '../models/Lead.js';
import { addCampaignJob, getJobStatus, cancelJob, getQueueStats } from '../queues/emailQueue.js';

/**
 * Marketing Controller - Phase 3: Email Marketing & Campaigns
 *
 * Handles all campaign-related operations:
 * - Campaign CRUD operations
 * - Campaign scheduling and sending
 * - Audience preview/estimation
 * - A/B test management
 * - Campaign analytics and reporting
 * - Pause/resume/cancel operations
 * - Campaign duplication
 *
 * @version 1.0.0
 * @since 2026-01-23
 */

// ============================================================================
// CAMPAIGN CRUD OPERATIONS
// ============================================================================

/**
 * @desc    Get all campaigns with filters and pagination
 * @route   GET /api/marketing/campaigns
 * @access  Private/Admin/Manager
 *
 * @param {string} [req.query.status] - Filter by status
 * @param {string} [req.query.type] - Filter by campaign type
 * @param {string} [req.query.category] - Filter by category
 * @param {string} [req.query.search] - Search by name/description
 * @param {number} [req.query.page=1] - Page number
 * @param {number} [req.query.limit=20] - Items per page
 * @param {string} [req.query.sort=-createdAt] - Sort field
 */
export const getCampaigns = async (req, res) => {
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

    const [campaigns, total] = await Promise.all([
      Campaign.find(query)
        .populate('template', 'name slug category')
        .populate('createdBy', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit, 10))
        .lean(),
      Campaign.countDocuments(query),
    ]);

    // Add computed fields to response
    const campaignsWithStats = campaigns.map(campaign => ({
      ...campaign,
      openRate: campaign.metrics?.delivered > 0
        ? Math.round((campaign.metrics.uniqueOpens / campaign.metrics.delivered) * 10000) / 100
        : 0,
      clickRate: campaign.metrics?.delivered > 0
        ? Math.round((campaign.metrics.uniqueClicks / campaign.metrics.delivered) * 10000) / 100
        : 0,
    }));

    res.status(200).json({
      success: true,
      count: campaigns.length,
      total,
      page: parseInt(page, 10),
      pages: Math.ceil(total / parseInt(limit, 10)),
      data: campaignsWithStats,
    });

  } catch (error) {
    console.error('Error getting campaigns:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Get a single campaign by ID
 * @route   GET /api/marketing/campaigns/:id
 * @access  Private/Admin/Manager
 *
 * @param {string} req.params.id - Campaign ID
 */
export const getCampaignById = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id)
      .populate('template')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .populate('approvedBy', 'name email');

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found',
      });
    }

    // Get job status if campaign has a queue job
    let jobStatus = null;
    if (campaign.queueJobId) {
      jobStatus = await getJobStatus(campaign.queueJobId);
    }

    res.status(200).json({
      success: true,
      data: {
        ...campaign.toObject(),
        jobStatus,
      },
    });

  } catch (error) {
    console.error('Error getting campaign:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Create a new campaign
 * @route   POST /api/marketing/campaigns
 * @access  Private/Admin/Manager
 *
 * @param {Object} req.body - Campaign data
 */
export const createCampaign = async (req, res) => {
  try {
    const {
      name,
      description,
      type,
      category,
      template,
      subject,
      preheader,
      sender,
      schedule,
      audience,
      abTest,
      budget,
      tags,
      notes,
      priority,
      requiresApproval,
    } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Campaign name is required',
      });
    }

    if (!template) {
      return res.status(400).json({
        success: false,
        message: 'Email template is required',
      });
    }

    // Verify template exists
    const templateExists = await EmailTemplate.findById(template);
    if (!templateExists) {
      return res.status(404).json({
        success: false,
        message: 'Email template not found',
      });
    }

    // Create campaign
    const campaign = new Campaign({
      name,
      description,
      type: type || 'one-time',
      category: category || 'custom',
      template,
      subject,
      preheader,
      sender: sender || {
        name: 'EmenTech',
        email: 'noreply@ementech.co.ke',
      },
      schedule,
      audience,
      abTest,
      budget,
      tags,
      notes,
      priority,
      requiresApproval,
      createdBy: req.user._id,
    });

    await campaign.save();

    // Populate template for response
    await campaign.populate('template', 'name slug category');

    res.status(201).json({
      success: true,
      message: 'Campaign created successfully',
      data: campaign,
    });

  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Update a campaign
 * @route   PUT /api/marketing/campaigns/:id
 * @access  Private/Admin/Manager
 *
 * @param {string} req.params.id - Campaign ID
 * @param {Object} req.body - Updated campaign data
 */
export const updateCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found',
      });
    }

    // Only allow editing in draft status
    if (campaign.status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: 'Can only edit campaigns in draft status',
      });
    }

    // Fields that can be updated
    const allowedFields = [
      'name', 'description', 'type', 'category', 'template',
      'subject', 'preheader', 'sender', 'schedule', 'audience',
      'abTest', 'budget', 'tags', 'notes', 'priority', 'requiresApproval',
      'batchSize', 'batchDelay', 'rateLimit', 'retryConfig',
    ];

    // Update allowed fields
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        campaign[field] = req.body[field];
      }
    });

    campaign.updatedBy = req.user._id;
    await campaign.save();

    await campaign.populate('template', 'name slug category');

    res.status(200).json({
      success: true,
      message: 'Campaign updated successfully',
      data: campaign,
    });

  } catch (error) {
    console.error('Error updating campaign:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Delete (archive) a campaign
 * @route   DELETE /api/marketing/campaigns/:id
 * @access  Private/Admin
 *
 * @param {string} req.params.id - Campaign ID
 */
export const deleteCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found',
      });
    }

    // Don't allow deleting active campaigns
    if (campaign.status === 'sending') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete a campaign that is currently sending',
      });
    }

    // Soft delete by archiving
    campaign.archive(req.user._id);
    await campaign.save();

    res.status(200).json({
      success: true,
      message: 'Campaign archived successfully',
    });

  } catch (error) {
    console.error('Error deleting campaign:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================================
// CAMPAIGN SCHEDULING & SENDING
// ============================================================================

/**
 * @desc    Schedule a campaign for sending
 * @route   POST /api/marketing/campaigns/:id/schedule
 * @access  Private/Admin/Manager
 *
 * @param {string} req.params.id - Campaign ID
 * @param {string} req.body.sendAt - When to send (ISO date string)
 * @param {string} [req.body.timezone] - Timezone for scheduling
 */
export const scheduleCampaign = async (req, res) => {
  try {
    const { sendAt, timezone } = req.body;

    if (!sendAt) {
      return res.status(400).json({
        success: false,
        message: 'sendAt date is required',
      });
    }

    const sendDate = new Date(sendAt);
    if (sendDate <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Schedule time must be in the future',
      });
    }

    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found',
      });
    }

    // Check approval if required
    if (campaign.requiresApproval && campaign.approvalStatus !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Campaign requires approval before scheduling',
      });
    }

    // Schedule the campaign
    campaign.scheduleSend(sendDate, timezone || 'Africa/Nairobi', req.user._id);
    await campaign.save();

    res.status(200).json({
      success: true,
      message: 'Campaign scheduled successfully',
      data: {
        campaignId: campaign._id,
        scheduledFor: campaign.schedule.sendAt,
        timezone: campaign.schedule.timezone,
        status: campaign.status,
      },
    });

  } catch (error) {
    console.error('Error scheduling campaign:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Send a campaign immediately
 * @route   POST /api/marketing/campaigns/:id/send
 * @access  Private/Admin/Manager
 *
 * @param {string} req.params.id - Campaign ID
 */
export const sendCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id).populate('template');

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found',
      });
    }

    // Validate campaign status
    if (!['draft', 'scheduled'].includes(campaign.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot send campaign in ${campaign.status} status`,
      });
    }

    // Check approval if required
    if (campaign.requiresApproval && campaign.approvalStatus !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Campaign requires approval before sending',
      });
    }

    // Schedule immediately
    const sendTime = new Date();
    sendTime.setMinutes(sendTime.getMinutes() + 1); // Send in 1 minute

    campaign.scheduleSend(sendTime, 'Africa/Nairobi', req.user._id);
    await campaign.save();

    // Add to queue
    const job = await addCampaignJob(campaign._id, req.user._id);

    // Update campaign with job ID
    campaign.queueJobId = job.jobId;
    await campaign.save();

    res.status(200).json({
      success: true,
      message: 'Campaign queued for sending',
      data: {
        campaignId: campaign._id,
        jobId: job.jobId,
        status: campaign.status,
        estimatedRecipients: campaign.audience?.estimatedRecipients || 'unknown',
      },
    });

  } catch (error) {
    console.error('Error sending campaign:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Pause a campaign
 * @route   POST /api/marketing/campaigns/:id/pause
 * @access  Private/Admin/Manager
 *
 * @param {string} req.params.id - Campaign ID
 * @param {string} [req.body.reason] - Reason for pausing
 */
export const pauseCampaign = async (req, res) => {
  try {
    const { reason } = req.body;

    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found',
      });
    }

    campaign.pause(req.user._id, reason);
    await campaign.save();

    res.status(200).json({
      success: true,
      message: 'Campaign paused successfully',
      data: {
        campaignId: campaign._id,
        status: campaign.status,
        statusReason: campaign.statusReason,
      },
    });

  } catch (error) {
    console.error('Error pausing campaign:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Resume a paused campaign
 * @route   POST /api/marketing/campaigns/:id/resume
 * @access  Private/Admin/Manager
 *
 * @param {string} req.params.id - Campaign ID
 */
export const resumeCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found',
      });
    }

    campaign.resume(req.user._id);
    await campaign.save();

    res.status(200).json({
      success: true,
      message: 'Campaign resumed successfully',
      data: {
        campaignId: campaign._id,
        status: campaign.status,
        scheduledFor: campaign.schedule?.sendAt,
      },
    });

  } catch (error) {
    console.error('Error resuming campaign:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Cancel a campaign
 * @route   POST /api/marketing/campaigns/:id/cancel
 * @access  Private/Admin/Manager
 *
 * @param {string} req.params.id - Campaign ID
 * @param {string} [req.body.reason] - Reason for cancellation
 */
export const cancelCampaign = async (req, res) => {
  try {
    const { reason } = req.body;

    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found',
      });
    }

    // Cancel queue job if exists
    if (campaign.queueJobId) {
      await cancelJob(campaign.queueJobId);
    }

    campaign.cancel(req.user._id, reason);
    await campaign.save();

    res.status(200).json({
      success: true,
      message: 'Campaign cancelled successfully',
      data: {
        campaignId: campaign._id,
        status: campaign.status,
        statusReason: campaign.statusReason,
      },
    });

  } catch (error) {
    console.error('Error cancelling campaign:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================================
// AUDIENCE MANAGEMENT
// ============================================================================

/**
 * @desc    Preview/estimate audience size for a campaign
 * @route   POST /api/marketing/campaigns/:id/audience-preview
 * @access  Private/Admin/Manager
 *
 * @param {string} req.params.id - Campaign ID
 */
export const previewAudience = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found',
      });
    }

    // Compute audience size
    const count = await campaign.computeAudienceSize();
    await campaign.save();

    // Get sample recipients
    const query = campaign.buildAudienceQuery();
    const sample = await Lead.find(query)
      .select('email name company pipelineStage leadScore tags')
      .limit(10)
      .lean();

    res.status(200).json({
      success: true,
      data: {
        estimatedRecipients: count,
        sampleRecipients: sample,
        lastEstimatedAt: campaign.audience.estimatedAt,
        filters: campaign.audience?.filters || [],
        segments: campaign.audience?.segments || [],
      },
    });

  } catch (error) {
    console.error('Error previewing audience:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Estimate audience size without saving
 * @route   POST /api/marketing/audience-estimate
 * @access  Private/Admin/Manager
 *
 * @param {Object} req.body - Audience configuration
 */
export const estimateAudience = async (req, res) => {
  try {
    const { audience } = req.body;

    if (!audience) {
      return res.status(400).json({
        success: false,
        message: 'Audience configuration is required',
      });
    }

    // Create a temporary campaign to use its query builder
    const tempCampaign = new Campaign({
      name: 'temp',
      template: '000000000000000000000000',
      createdBy: req.user._id,
      audience,
    });

    const query = tempCampaign.buildAudienceQuery();
    const count = await Lead.countDocuments(query);

    // Get breakdown by pipeline stage
    const breakdown = await Lead.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$pipelineStage',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        estimatedRecipients: count,
        breakdown: breakdown.reduce((acc, item) => {
          acc[item._id || 'unknown'] = item.count;
          return acc;
        }, {}),
      },
    });

  } catch (error) {
    console.error('Error estimating audience:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================================
// A/B TESTING
// ============================================================================

/**
 * @desc    Configure A/B test for a campaign
 * @route   POST /api/marketing/campaigns/:id/ab-test
 * @access  Private/Admin/Manager
 *
 * @param {string} req.params.id - Campaign ID
 * @param {Object} req.body - A/B test configuration
 */
export const configureAbTest = async (req, res) => {
  try {
    const {
      enabled,
      testType,
      variants,
      testSize,
      winnerCriteria,
      minSampleSize,
      autoSelectWinner,
      testDurationHours,
    } = req.body;

    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found',
      });
    }

    if (campaign.status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: 'Can only configure A/B test for draft campaigns',
      });
    }

    // Update A/B test configuration
    campaign.abTest = {
      enabled: enabled !== false,
      testType: testType || 'subject',
      variants: variants || [],
      testSize: testSize || 20,
      winnerCriteria: winnerCriteria || 'openRate',
      minSampleSize: minSampleSize || 100,
      autoSelectWinner: autoSelectWinner || false,
      testDurationHours: testDurationHours || 24,
    };

    await campaign.save();

    res.status(200).json({
      success: true,
      message: 'A/B test configured successfully',
      data: campaign.abTest,
    });

  } catch (error) {
    console.error('Error configuring A/B test:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Get A/B test results
 * @route   GET /api/marketing/campaigns/:id/ab-test/results
 * @access  Private/Admin/Manager
 *
 * @param {string} req.params.id - Campaign ID
 */
export const getAbTestResults = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found',
      });
    }

    if (!campaign.abTest?.enabled) {
      return res.status(400).json({
        success: false,
        message: 'A/B testing is not enabled for this campaign',
      });
    }

    // Calculate performance for each variant
    const variantResults = campaign.abTest.variants.map(variant => {
      const metrics = variant.metrics || {};
      const delivered = metrics.delivered || 0;

      return {
        variantId: variant.variantId,
        description: variant.description,
        metrics: {
          sent: metrics.sent || 0,
          delivered,
          opened: metrics.opened || 0,
          clicked: metrics.clicked || 0,
          conversions: metrics.conversions || 0,
          revenue: metrics.revenue || 0,
        },
        rates: {
          openRate: delivered > 0 ? Math.round((metrics.opened / delivered) * 10000) / 100 : 0,
          clickRate: delivered > 0 ? Math.round((metrics.clicked / delivered) * 10000) / 100 : 0,
          conversionRate: delivered > 0 ? Math.round((metrics.conversions / delivered) * 10000) / 100 : 0,
        },
        isWinner: variant.isWinner,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        testType: campaign.abTest.testType,
        winnerCriteria: campaign.abTest.winnerCriteria,
        testSize: campaign.abTest.testSize,
        testStartedAt: campaign.abTest.testStartedAt,
        winnerSelectedAt: campaign.abTest.winnerSelectedAt,
        winningVariantId: campaign.abTest.winningVariantId,
        confidenceLevel: campaign.abTest.confidenceLevel,
        variants: variantResults,
        bestVariant: campaign.getBestVariant(),
      },
    });

  } catch (error) {
    console.error('Error getting A/B test results:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Select A/B test winner
 * @route   POST /api/marketing/campaigns/:id/ab-test/select-winner
 * @access  Private/Admin/Manager
 *
 * @param {string} req.params.id - Campaign ID
 * @param {string} req.body.variantId - Winner variant ID
 */
export const selectAbTestWinner = async (req, res) => {
  try {
    const { variantId, confidenceLevel } = req.body;

    if (!variantId) {
      return res.status(400).json({
        success: false,
        message: 'variantId is required',
      });
    }

    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found',
      });
    }

    campaign.selectWinner(variantId, confidenceLevel || 95);
    await campaign.save();

    res.status(200).json({
      success: true,
      message: `Variant ${variantId} selected as winner`,
      data: campaign.abTest,
    });

  } catch (error) {
    console.error('Error selecting A/B test winner:', error);
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
 * @desc    Get campaign analytics
 * @route   GET /api/marketing/campaigns/:id/analytics
 * @access  Private/Admin/Manager
 *
 * @param {string} req.params.id - Campaign ID
 */
export const getCampaignAnalytics = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id).populate('template', 'name slug');

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found',
      });
    }

    const metrics = campaign.metrics || {};

    res.status(200).json({
      success: true,
      data: {
        campaign: {
          id: campaign._id,
          name: campaign.name,
          status: campaign.status,
          type: campaign.type,
          category: campaign.category,
          template: campaign.template,
        },
        metrics: {
          totalRecipients: metrics.totalRecipients || 0,
          sent: metrics.sent || 0,
          delivered: metrics.delivered || 0,
          failed: metrics.failed || 0,
          uniqueOpens: metrics.uniqueOpens || 0,
          totalOpens: metrics.totalOpens || 0,
          uniqueClicks: metrics.uniqueClicks || 0,
          totalClicks: metrics.totalClicks || 0,
          hardBounces: metrics.hardBounces || 0,
          softBounces: metrics.softBounces || 0,
          unsubscribes: metrics.unsubscribes || 0,
          spamComplaints: metrics.spamComplaints || 0,
          conversions: metrics.conversions || 0,
          revenue: metrics.revenue || 0,
        },
        rates: {
          openRate: campaign.openRate || 0,
          clickRate: campaign.clickRate || 0,
          clickToOpenRate: campaign.clickToOpenRate || 0,
          bounceRate: campaign.bounceRate || 0,
          unsubscribeRate: campaign.unsubscribeRate || 0,
          conversionRate: campaign.conversionRate || 0,
          deliveryRate: campaign.deliveryRate || 0,
        },
        roi: {
          totalSpent: campaign.budget?.totalSpent || 0,
          externalCosts: campaign.budget?.externalCosts || 0,
          revenueGenerated: metrics.revenue || 0,
          roi: campaign.roi || 0,
          costPerConversion: campaign.costPerConversion || 0,
          actualCostPerEmail: campaign.actualCostPerEmail || 0,
        },
        clickMap: metrics.clickMap || [],
        deviceBreakdown: metrics.deviceBreakdown || {},
        emailClientBreakdown: metrics.emailClientBreakdown || {},
        geoBreakdown: metrics.geoBreakdown || {},
        timeline: {
          createdAt: campaign.createdAt,
          scheduledFor: campaign.schedule?.sendAt,
          sentAt: campaign.schedule?.lastSentAt,
          completedAt: metrics.completedAt,
        },
      },
    });

  } catch (error) {
    console.error('Error getting campaign analytics:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Get aggregate marketing metrics
 * @route   GET /api/marketing/analytics
 * @access  Private/Admin/Manager
 *
 * @param {string} [req.query.startDate] - Start date for metrics
 * @param {string} [req.query.endDate] - End date for metrics
 * @param {string} [req.query.type] - Filter by campaign type
 * @param {string} [req.query.category] - Filter by category
 */
export const getMarketingAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, type, category } = req.query;

    const metrics = await Campaign.getAggregateMetrics({
      startDate,
      endDate,
      type,
      category,
    });

    // Get top performing campaigns
    const topCampaigns = await Campaign.getTopPerforming('openRate', 5);

    // Get queue stats
    const queueStats = await getQueueStats();

    res.status(200).json({
      success: true,
      data: {
        aggregate: metrics,
        topPerforming: topCampaigns.map(c => ({
          id: c._id,
          name: c.name,
          openRate: c.openRate,
          clickRate: c.clickRate,
          sent: c.metrics?.sent || 0,
        })),
        queue: queueStats,
      },
    });

  } catch (error) {
    console.error('Error getting marketing analytics:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================================
// CAMPAIGN OPERATIONS
// ============================================================================

/**
 * @desc    Duplicate a campaign
 * @route   POST /api/marketing/campaigns/:id/duplicate
 * @access  Private/Admin/Manager
 *
 * @param {string} req.params.id - Campaign ID
 * @param {string} [req.body.name] - Name for duplicate
 */
export const duplicateCampaign = async (req, res) => {
  try {
    const { name } = req.body;

    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found',
      });
    }

    const newName = name || `${campaign.name} (Copy)`;
    const duplicate = campaign.duplicate(newName, req.user._id);

    // Generate unique slug
    duplicate.slug = await Campaign.generateSlug(newName);

    await duplicate.save();
    await duplicate.populate('template', 'name slug category');

    res.status(201).json({
      success: true,
      message: 'Campaign duplicated successfully',
      data: duplicate,
    });

  } catch (error) {
    console.error('Error duplicating campaign:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Approve a campaign
 * @route   POST /api/marketing/campaigns/:id/approve
 * @access  Private/Admin
 *
 * @param {string} req.params.id - Campaign ID
 */
export const approveCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found',
      });
    }

    campaign.approve(req.user._id);
    await campaign.save();

    res.status(200).json({
      success: true,
      message: 'Campaign approved successfully',
      data: {
        campaignId: campaign._id,
        approvalStatus: campaign.approvalStatus,
        approvedBy: req.user._id,
        approvedAt: campaign.approvedAt,
      },
    });

  } catch (error) {
    console.error('Error approving campaign:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Reject a campaign
 * @route   POST /api/marketing/campaigns/:id/reject
 * @access  Private/Admin
 *
 * @param {string} req.params.id - Campaign ID
 * @param {string} req.body.reason - Rejection reason
 */
export const rejectCampaign = async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required',
      });
    }

    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found',
      });
    }

    campaign.reject(req.user._id, reason);
    await campaign.save();

    res.status(200).json({
      success: true,
      message: 'Campaign rejected',
      data: {
        campaignId: campaign._id,
        approvalStatus: campaign.approvalStatus,
        rejectionReason: campaign.rejectionReason,
      },
    });

  } catch (error) {
    console.error('Error rejecting campaign:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Get campaigns pending approval
 * @route   GET /api/marketing/campaigns/pending-approval
 * @access  Private/Admin
 */
export const getPendingApproval = async (req, res) => {
  try {
    const campaigns = await Campaign.getPendingApproval();

    res.status(200).json({
      success: true,
      count: campaigns.length,
      data: campaigns,
    });

  } catch (error) {
    console.error('Error getting pending campaigns:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================================
// QUEUE STATUS
// ============================================================================

/**
 * @desc    Get email queue status
 * @route   GET /api/marketing/queue-status
 * @access  Private/Admin
 */
export const getQueueStatus = async (req, res) => {
  try {
    const stats = await getQueueStats();

    res.status(200).json({
      success: true,
      data: stats,
    });

  } catch (error) {
    console.error('Error getting queue status:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Get job status
 * @route   GET /api/marketing/jobs/:jobId
 * @access  Private/Admin/Manager
 *
 * @param {string} req.params.jobId - Job ID
 */
export const getJobStatusEndpoint = async (req, res) => {
  try {
    const status = await getJobStatus(req.params.jobId);

    if (!status) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    res.status(200).json({
      success: true,
      data: status,
    });

  } catch (error) {
    console.error('Error getting job status:', error);
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
  getCampaigns,
  getCampaignById,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  scheduleCampaign,
  sendCampaign,
  pauseCampaign,
  resumeCampaign,
  cancelCampaign,
  previewAudience,
  estimateAudience,
  configureAbTest,
  getAbTestResults,
  selectAbTestWinner,
  getCampaignAnalytics,
  getMarketingAnalytics,
  duplicateCampaign,
  approveCampaign,
  rejectCampaign,
  getPendingApproval,
  getQueueStatus,
  getJobStatusEndpoint,
};
