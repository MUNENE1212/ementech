import ABTest from '../models/ABTest.js';
import Campaign from '../models/Campaign.js';
import Sequence from '../models/Sequence.js';
import EmailTemplate from '../models/EmailTemplate.js';
import { calculateStatisticalSignificance, determineWinner, generateTestReport } from '../services/abTestAnalyzer.js';

/**
 * A/B Test Controller - Phase 5: A/B Testing & Optimization
 *
 * Handles all A/B test-related operations:
 * - A/B test CRUD operations
 * - Test lifecycle management (start, pause, stop)
 * - Winner declaration and selection
 * - Test results and analytics
 * - Test duplication and creation from templates/campaigns
 *
 * @version 1.0.0
 * @since 2026-01-23
 */

// ============================================================================
// A/B TEST CRUD OPERATIONS
// ============================================================================

/**
 * @desc    Get all A/B tests with filters and pagination
 * @route   GET /api/abtests
 * @access  Private/Admin/Manager
 */
export const getABTests = async (req, res) => {
  try {
    const {
      status,
      testType,
      category,
      search,
      page = 1,
      limit = 20,
      sort = '-createdAt',
    } = req.query;

    const query = { archivedAt: null };

    if (status) query.status = status;
    if (testType) query.testType = testType;
    if (category) query.category = category;

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
        { hypothesis: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [tests, total] = await Promise.all([
      ABTest.find(query)
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email')
        .populate('campaignId', 'name slug')
        .populate('sequenceId', 'name slug')
        .populate('templateId', 'name slug')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit, 10))
        .lean(),
      ABTest.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count: tests.length,
      total,
      page: parseInt(page, 10),
      pages: Math.ceil(total / parseInt(limit, 10)),
      data: tests,
    });

  } catch (error) {
    console.error('Error getting A/B tests:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Get a single A/B test by ID
 * @route   GET /api/abtests/:id
 * @access  Private/Admin/Manager
 */
export const getABTestById = async (req, res) => {
  try {
    const test = await ABTest.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .populate('winnerSelectedBy', 'name email')
      .populate('campaignId', 'name slug subject')
      .populate('sequenceId', 'name slug')
      .populate('templateId', 'name slug subject');

    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'A/B test not found',
      });
    }

    res.status(200).json({
      success: true,
      data: test,
    });

  } catch (error) {
    console.error('Error getting A/B test:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Create a new A/B test
 * @route   POST /api/abtests
 * @access  Private/Admin/Manager
 */
export const createABTest = async (req, res) => {
  try {
    const {
      name,
      description,
      testType,
      category,
      tags,
      variants,
      controlVariantId,
      winnerCriteria,
      winnerDirection,
      minImprovementThreshold,
      autoSelectWinner,
      significance,
      duration,
      trafficAllocation,
      campaignId,
      sequenceId,
      templateId,
      hypothesis,
      expectedOutcome,
      notes,
    } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Test name is required',
      });
    }

    if (!testType) {
      return res.status(400).json({
        success: false,
        message: 'Test type is required',
      });
    }

    if (!variants || variants.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'At least 2 variants are required',
      });
    }

    if (variants.length > 10) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 10 variants allowed',
      });
    }

    // Verify associated resources exist if provided
    if (campaignId) {
      const campaign = await Campaign.findById(campaignId);
      if (!campaign) {
        return res.status(404).json({
          success: false,
          message: 'Campaign not found',
        });
      }
    }

    if (sequenceId) {
      const sequence = await Sequence.findById(sequenceId);
      if (!sequence) {
        return res.status(404).json({
          success: false,
          message: 'Sequence not found',
        });
      }
    }

    if (templateId) {
      const template = await EmailTemplate.findById(templateId);
      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'Template not found',
        });
      }
    }

    // Validate control variant ID
    const controlVariant = variants.find(v => v.variantId === controlVariantId);
    if (!controlVariant) {
      return res.status(400).json({
        success: false,
        message: 'Control variant ID must match one of the variants',
      });
    }

    const abTest = new ABTest({
      name,
      description,
      testType,
      category: category || 'custom',
      tags,
      variants,
      controlVariantId,
      winnerCriteria: winnerCriteria || 'open_rate',
      winnerDirection: winnerDirection || 'higher',
      minImprovementThreshold: minImprovementThreshold || 5,
      autoSelectWinner: autoSelectWinner || false,
      significance,
      duration,
      trafficAllocation,
      campaignId,
      sequenceId,
      templateId,
      hypothesis,
      expectedOutcome,
      notes,
      createdBy: req.user._id,
    });

    await abTest.save();

    await abTest.populate('createdBy', 'name email');
    await abTest.populate('campaignId', 'name slug');
    await abTest.populate('sequenceId', 'name slug');
    await abTest.populate('templateId', 'name slug');

    res.status(201).json({
      success: true,
      message: 'A/B test created successfully',
      data: abTest,
    });

  } catch (error) {
    console.error('Error creating A/B test:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Update an A/B test
 * @route   PUT /api/abtests/:id
 * @access  Private/Admin/Manager
 */
export const updateABTest = async (req, res) => {
  try {
    const test = await ABTest.findById(req.params.id);

    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'A/B test not found',
      });
    }

    if (!test.isEditable) {
      return res.status(400).json({
        success: false,
        message: 'Cannot edit test that is already running or completed',
      });
    }

    const allowedFields = [
      'name', 'description', 'testType', 'category', 'tags', 'variants',
      'controlVariantId', 'winnerCriteria', 'winnerDirection',
      'minImprovementThreshold', 'autoSelectWinner', 'significance',
      'duration', 'trafficAllocation', 'campaignId', 'sequenceId',
      'templateId', 'hypothesis', 'expectedOutcome', 'notes',
    ];

    // Validate variants if being updated
    if (req.body.variants) {
      if (req.body.variants.length < 2) {
        return res.status(400).json({
          success: false,
          message: 'At least 2 variants are required',
        });
      }
      if (req.body.variants.length > 10) {
        return res.status(400).json({
          success: false,
          message: 'Maximum 10 variants allowed',
        });
      }

      const controlId = req.body.controlVariantId || test.controlVariantId;
      const controlExists = req.body.variants.some(v => v.variantId === controlId);
      if (!controlExists) {
        return res.status(400).json({
          success: false,
          message: 'Control variant ID must match one of the variants',
        });
      }
    }

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        test[field] = req.body[field];
      }
    });

    test.updatedBy = req.user._id;
    await test.save();

    await test.populate('createdBy', 'name email');
    await test.populate('updatedBy', 'name email');
    await test.populate('campaignId', 'name slug');
    await test.populate('sequenceId', 'name slug');
    await test.populate('templateId', 'name slug');

    res.status(200).json({
      success: true,
      message: 'A/B test updated successfully',
      data: test,
    });

  } catch (error) {
    console.error('Error updating A/B test:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Delete (archive) an A/B test
 * @route   DELETE /api/abtests/:id
 * @access  Private/Admin
 */
export const deleteABTest = async (req, res) => {
  try {
    const test = await ABTest.findById(req.params.id);

    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'A/B test not found',
      });
    }

    if (test.status === 'running') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete running test. Stop it first.',
      });
    }

    test.archive(req.user._id);
    await test.save();

    res.status(200).json({
      success: true,
      message: 'A/B test archived successfully',
    });

  } catch (error) {
    console.error('Error deleting A/B test:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================================
// TEST LIFECYCLE MANAGEMENT
// ============================================================================

/**
 * @desc    Start an A/B test
 * @route   POST /api/abtests/:id/start
 * @access  Private/Admin/Manager
 */
export const startABTest = async (req, res) => {
  try {
    const { startAt } = req.body;

    const test = await ABTest.findById(req.params.id);

    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'A/B test not found',
      });
    }

    if (!['draft', 'scheduled'].includes(test.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot start test with status: ' + test.status,
      });
    }

    if (!test.variants || test.variants.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Test must have at least 2 variants before starting',
      });
    }

    if (startAt && new Date(startAt) > new Date()) {
      test.duration.startAt = new Date(startAt);
      test.changeStatus('scheduled', req.user._id, 'Scheduled to start at ' + startAt);
    } else {
      test.changeStatus('running', req.user._id, 'Test started');
    }

    await test.save();

    res.status(200).json({
      success: true,
      message: test.status === 'scheduled' ? 'Test scheduled successfully' : 'Test started successfully',
      data: {
        testId: test._id,
        status: test.status,
        startAt: test.duration.startAt || test.duration.actualStartAt,
      },
    });

  } catch (error) {
    console.error('Error starting A/B test:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Pause an A/B test
 * @route   POST /api/abtests/:id/pause
 * @access  Private/Admin/Manager
 */
export const pauseABTest = async (req, res) => {
  try {
    const { reason } = req.body;

    const test = await ABTest.findById(req.params.id);

    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'A/B test not found',
      });
    }

    if (test.status !== 'running') {
      return res.status(400).json({
        success: false,
        message: 'Can only pause running tests',
      });
    }

    test.changeStatus('paused', req.user._id, reason || 'Test paused');
    await test.save();

    res.status(200).json({
      success: true,
      message: 'Test paused successfully',
      data: {
        testId: test._id,
        status: test.status,
        statusReason: test.statusReason,
      },
    });

  } catch (error) {
    console.error('Error pausing A/B test:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Resume a paused A/B test
 * @route   POST /api/abtests/:id/resume
 * @access  Private/Admin/Manager
 */
export const resumeABTest = async (req, res) => {
  try {
    const test = await ABTest.findById(req.params.id);

    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'A/B test not found',
      });
    }

    if (test.status !== 'paused') {
      return res.status(400).json({
        success: false,
        message: 'Can only resume paused tests',
      });
    }

    test.changeStatus('running', req.user._id, 'Test resumed');
    await test.save();

    res.status(200).json({
      success: true,
      message: 'Test resumed successfully',
      data: {
        testId: test._id,
        status: test.status,
      },
    });

  } catch (error) {
    console.error('Error resuming A/B test:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Stop an A/B test
 * @route   POST /api/abtests/:id/stop
 * @access  Private/Admin/Manager
 */
export const stopABTest = async (req, res) => {
  try {
    const { reason, outcome = 'completed' } = req.body;

    const test = await ABTest.findById(req.params.id);

    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'A/B test not found',
      });
    }

    if (!['running', 'paused', 'scheduled'].includes(test.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot stop test with status: ' + test.status,
      });
    }

    const validOutcomes = ['completed', 'inconclusive', 'cancelled'];
    if (!validOutcomes.includes(outcome)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid outcome. Must be one of: completed, inconclusive, cancelled',
      });
    }

    test.changeStatus(outcome, req.user._id, reason || 'Test stopped');
    await test.save();

    res.status(200).json({
      success: true,
      message: 'Test ' + outcome + ' successfully',
      data: {
        testId: test._id,
        status: test.status,
        statusReason: test.statusReason,
      },
    });

  } catch (error) {
    console.error('Error stopping A/B test:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================================
// WINNER SELECTION
// ============================================================================

/**
 * @desc    Manually declare a winner for the test
 * @route   POST /api/abtests/:id/declare-winner
 * @access  Private/Admin/Manager
 */
export const declareWinner = async (req, res) => {
  try {
    const { variantId, reason } = req.body;

    if (!variantId) {
      return res.status(400).json({
        success: false,
        message: 'Variant ID is required',
      });
    }

    const test = await ABTest.findById(req.params.id);

    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'A/B test not found',
      });
    }

    if (!['running', 'paused'].includes(test.status)) {
      return res.status(400).json({
        success: false,
        message: 'Can only declare winner for running or paused tests',
      });
    }

    test.selectWinner(variantId, req.user._id, reason || 'Manually declared winner');
    test.changeStatus('completed', req.user._id, 'Winner declared: ' + variantId);

    await test.save();

    const winner = test.getVariant(variantId);
    const control = test.controlVariant;

    res.status(200).json({
      success: true,
      message: 'Winner declared successfully',
      data: {
        testId: test._id,
        winningVariantId: test.winningVariantId,
        winningVariant: winner,
        controlVariant: control,
        improvement: test.results.improvementPercentage,
        estimatedLift: test.results.estimatedLift,
        winnerSelectedAt: test.winnerSelectedAt,
      },
    });

  } catch (error) {
    console.error('Error declaring winner:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Get the recommended winner based on current data
 * @route   GET /api/abtests/:id/recommended-winner
 * @access  Private/Admin/Manager
 */
export const getRecommendedWinner = async (req, res) => {
  try {
    const test = await ABTest.findById(req.params.id);

    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'A/B test not found',
      });
    }

    const bestVariant = test.getBestVariant();
    if (!bestVariant) {
      return res.status(400).json({
        success: false,
        message: 'Could not determine best variant',
      });
    }

    const significance = await calculateStatisticalSignificance(test);

    const minSampleReached = test.variants.every(
      v => (v.metrics?.sent || 0) >= (test.significance?.minSampleSize || 100)
    );

    const minDurationReached = test.hasReachedMinDuration;

    const recommendation = {
      recommendedVariantId: bestVariant.variantId,
      recommendedVariant: bestVariant,
      controlVariant: test.controlVariant,
      winnerCriteria: test.winnerCriteria,
      significance,
      minSampleReached,
      minDurationReached,
      readyToDeclare: minSampleReached && minDurationReached && significance.isSignificant,
      improvement: test.results.improvementPercentage,
      meetsThreshold: test.results.improvementPercentage >= test.minImprovementThreshold,
    };

    res.status(200).json({
      success: true,
      data: recommendation,
    });

  } catch (error) {
    console.error('Error getting recommended winner:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================================
// TEST RESULTS & ANALYTICS
// ============================================================================

/**
 * @desc    Get test results with statistics
 * @route   GET /api/abtests/:id/results
 * @access  Private/Admin/Manager
 */
export const getTestResults = async (req, res) => {
  try {
    const { includeSignificance = 'true', includeComparison = 'true' } = req.query;

    const test = await ABTest.findById(req.params.id)
      .populate('campaignId', 'name')
      .populate('sequenceId', 'name')
      .populate('templateId', 'name');

    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'A/B test not found',
      });
    }

    const variantResults = test.variants.map(variant => {
      const metrics = variant.metrics || {};
      const base = metrics.delivered || metrics.sent || metrics.recipients || 1;

      return {
        variantId: variant.variantId,
        name: variant.name,
        isWinner: variant.isWinner,
        isControl: variant.variantId === test.controlVariantId,
        metrics: metrics,
        rates: {
          openRate: base > 0 ? ((metrics.uniqueOpens || 0) / base) * 100 : 0,
          clickRate: base > 0 ? ((metrics.uniqueClicks || 0) / base) * 100 : 0,
          clickToOpenRate: (metrics.uniqueOpens || 0) > 0
            ? ((metrics.uniqueClicks || 0) / metrics.uniqueOpens) * 100
            : 0,
          conversionRate: base > 0 ? ((metrics.conversions || 0) / base) * 100 : 0,
          bounceRate: base > 0 ? ((metrics.bounces || 0) / base) * 100 : 0,
          unsubscribeRate: base > 0 ? ((metrics.unsubscribes || 0) / base) * 100 : 0,
        },
        revenue: metrics.revenue || 0,
        weight: variant.weight,
      };
    });

    // Sort by winner criteria rate
    variantResults.sort((a, b) => {
      const rateMap = {
        open_rate: 'openRate',
        click_rate: 'clickRate',
        click_to_open_rate: 'clickToOpenRate',
        conversion_rate: 'conversionRate',
        revenue: 'revenue',
        unsubscribes: 'unsubscribeRate',
        bounces: 'bounceRate',
      };

      const rateField = rateMap[test.winnerCriteria] || 'openRate';
      const aRate = a.rates[rateField] || 0;
      const bRate = b.rates[rateField] || 0;

      return test.winnerDirection === 'higher' ? bRate - aRate : aRate - bRate;
    });

    const results = {
      testId: test._id,
      testName: test.name,
      testType: test.testType,
      status: test.status,
      winnerCriteria: test.winnerCriteria,
      winnerDirection: test.winnerDirection,
      winningVariantId: test.winningVariantId,
      controlVariantId: test.controlVariantId,
      duration: test.duration,
      aggregated: test.results,
      variants: variantResults,
    };

    if (includeSignificance === 'true') {
      results.significance = await calculateStatisticalSignificance(test);
    }

    if (includeComparison === 'true') {
      results.comparison = generateTestReport(test);
    }

    res.status(200).json({
      success: true,
      data: results,
    });

  } catch (error) {
    console.error('Error getting test results:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Get full test report with analysis
 * @route   GET /api/abtests/:id/report
 * @access  Private/Admin/Manager
 */
export const getTestReport = async (req, res) => {
  try {
    const test = await ABTest.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('campaignId', 'name')
      .populate('sequenceId', 'name')
      .populate('templateId', 'name');

    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'A/B test not found',
      });
    }

    const report = await generateTestReport(test);

    res.status(200).json({
      success: true,
      data: report,
    });

  } catch (error) {
    console.error('Error generating test report:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Get aggregate A/B test metrics
 * @route   GET /api/abtests/analytics
 * @access  Private/Admin/Manager
 */
export const getAggregateAnalytics = async (req, res) => {
  try {
    const { testType, category, startDate, endDate } = req.query;

    const metrics = await ABTest.getAggregateMetrics({
      testType,
      category,
      startDate,
      endDate,
    });

    const typeBreakdown = await ABTest.aggregate([
      {
        $match: {
          archivedAt: null,
          ...(testType && { testType }),
          ...(category && { category }),
          ...(startDate && { createdAt: { $gte: new Date(startDate) } }),
          ...(endDate && { createdAt: { $lte: new Date(endDate) } }),
        },
      },
      {
        $group: {
          _id: '$testType',
          count: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
          },
          avgImprovement: { $avg: '$results.improvementPercentage' },
        },
      },
    ]);

    const recentTests = await ABTest.find({
      status: { $in: ['running', 'completed'] },
      archivedAt: null,
    })
      .populate('campaignId', 'name')
      .sort('-createdAt')
      .limit(5);

    res.status(200).json({
      success: true,
      data: {
        aggregate: metrics,
        typeBreakdown: typeBreakdown.map(t => ({
          testType: t._id,
          count: t.count,
          completed: t.completed,
          avgImprovement: t.avgImprovement || 0,
        })),
        recentTests: recentTests.map(t => ({
          id: t._id,
          name: t.name,
          testType: t.testType,
          status: t.status,
          campaign: t.campaignId?.name,
          improvement: t.results?.improvementPercentage,
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
// TEST OPERATIONS
// ============================================================================

/**
 * @desc    Duplicate an A/B test
 * @route   POST /api/abtests/:id/duplicate
 * @access  Private/Admin/Manager
 */
export const duplicateABTest = async (req, res) => {
  try {
    const { name } = req.body;

    const test = await ABTest.findById(req.params.id);

    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'A/B test not found',
      });
    }

    const newName = name || test.name + ' (Copy)';
    const duplicate = test.duplicate(newName, req.user._id);

    duplicate.slug = await ABTest.generateSlug(newName);

    await duplicate.save();

    await duplicate.populate('campaignId', 'name');
    await duplicate.populate('sequenceId', 'name');
    await duplicate.populate('templateId', 'name');

    res.status(201).json({
      success: true,
      message: 'A/B test duplicated successfully',
      data: duplicate,
    });

  } catch (error) {
    console.error('Error duplicating A/B test:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Create an A/B test from a campaign
 * @route   POST /api/abtests/create-from-campaign
 * @access  Private/Admin/Manager
 */
export const createFromCampaign = async (req, res) => {
  try {
    const { campaignId, testConfig } = req.body;

    if (!campaignId) {
      return res.status(400).json({
        success: false,
        message: 'Campaign ID is required',
      });
    }

    if (!testConfig) {
      return res.status(400).json({
        success: false,
        message: 'Test configuration is required',
      });
    }

    const abTest = await ABTest.createFromCampaign(
      campaignId,
      testConfig,
      req.user._id
    );

    await abTest.populate('campaignId', 'name slug');
    await abTest.populate('templateId', 'name slug');

    res.status(201).json({
      success: true,
      message: 'A/B test created from campaign successfully',
      data: abTest,
    });

  } catch (error) {
    console.error('Error creating A/B test from campaign:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Create an A/B test from a template
 * @route   POST /api/abtests/create-from-template
 * @access  Private/Admin/Manager
 */
export const createFromTemplate = async (req, res) => {
  try {
    const { templateId, testConfig } = req.body;

    if (!templateId) {
      return res.status(400).json({
        success: false,
        message: 'Template ID is required',
      });
    }

    if (!testConfig) {
      return res.status(400).json({
        success: false,
        message: 'Test configuration is required',
      });
    }

    const abTest = await ABTest.createFromTemplate(
      templateId,
      testConfig,
      req.user._id
    );

    await abTest.populate('templateId', 'name slug');

    res.status(201).json({
      success: true,
      message: 'A/B test created from template successfully',
      data: abTest,
    });

  } catch (error) {
    console.error('Error creating A/B test from template:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Get variant assignment for a recipient
 * @route   POST /api/abtests/:id/assign-variant
 * @access  Private/Admin/Manager
 */
export const assignVariant = async (req, res) => {
  try {
    const { recipientId } = req.body;

    if (!recipientId) {
      return res.status(400).json({
        success: false,
        message: 'Recipient ID is required',
      });
    }

    const test = await ABTest.findById(req.params.id);

    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'A/B test not found',
      });
    }

    if (!['running', 'scheduled'].includes(test.status)) {
      return res.status(400).json({
        success: false,
        message: 'Can only assign variants for running or scheduled tests',
      });
    }

    const variantId = allocateVariant(test, recipientId);

    res.status(200).json({
      success: true,
      data: {
        testId: test._id,
        variantId,
        variant: test.getVariant(variantId),
        recipientId,
      },
    });

  } catch (error) {
    console.error('Error assigning variant:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================================
// TRAFFIC ALLOCATION HELPERS
// ============================================================================

function allocateVariant(test, recipientId) {
  const strategy = test.trafficAllocation?.strategy || 'equal';

  switch (strategy) {
    case 'weighted':
      return weightedAllocation(test.variants);
    case 'thompson_sampling':
      return thompsonSamplingAllocation(test.variants);
    case 'epsilon_greedy':
      return epsilonGreedyAllocation(test.variants, test.trafficAllocation.epsilon);
    case 'equal':
    default:
      return equalAllocation(test.variants, recipientId);
  }
}

function equalAllocation(variants, recipientId) {
  const hash = recipientId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const index = hash % variants.length;
  return variants[index].variantId;
}

function weightedAllocation(variants) {
  const total = variants.reduce((sum, v) => sum + (v.weight || 0), 0);
  let random = Math.random() * total;

  for (const variant of variants) {
    random -= variant.weight;
    if (random <= 0) {
      return variant.variantId;
    }
  }

  return variants[0].variantId;
}

function thompsonSamplingAllocation(variants) {
  let bestSample = -Infinity;
  let bestVariant = variants[0];

  for (const variant of variants) {
    const metrics = variant.metrics || {};
    const alpha = (metrics.conversions || 0) + 1;
    const beta = (metrics.sent || 0) - (metrics.conversions || 0) + 1;
    const sample = betaSample(alpha, beta);

    if (sample > bestSample) {
      bestSample = sample;
      bestVariant = variant;
    }
  }

  return bestVariant.variantId;
}

function betaSample(alpha, beta) {
  const u1 = Math.pow(Math.random(), 1 / alpha);
  const u2 = Math.pow(Math.random(), 1 / beta);
  return u1 / (u1 + u2);
}

function epsilonGreedyAllocation(variants, epsilon = 0.1) {
  if (Math.random() < epsilon) {
    const index = Math.floor(Math.random() * variants.length);
    return variants[index].variantId;
  }

  let bestVariant = variants[0];
  let bestRate = -1;

  for (const variant of variants) {
    const metrics = variant.metrics || {};
    const sent = metrics.sent || 0;
    const conversions = metrics.conversions || 0;
    const rate = sent > 0 ? conversions / sent : 0;

    if (rate > bestRate) {
      bestRate = rate;
      bestVariant = variant;
    }
  }

  return bestVariant.variantId;
}

// ============================================================================
// EXPORT
// ============================================================================

export default {
  getABTests,
  getABTestById,
  createABTest,
  updateABTest,
  deleteABTest,
  startABTest,
  pauseABTest,
  resumeABTest,
  stopABTest,
  declareWinner,
  getRecommendedWinner,
  getTestResults,
  getTestReport,
  getAggregateAnalytics,
  duplicateABTest,
  createFromCampaign,
  createFromTemplate,
  assignVariant,
};
