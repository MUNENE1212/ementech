import EmailTemplate from '../models/EmailTemplate.js';

/**
 * Template Controller - Phase 3: Email Marketing & Campaigns
 *
 * Handles all email template operations:
 * - Template CRUD operations
 * - Template preview/render
 * - Template duplication
 * - Template search
 * - A/B variant management
 *
 * @version 1.0.0
 * @since 2026-01-23
 */

// ============================================================================
// TEMPLATE CRUD OPERATIONS
// ============================================================================

/**
 * @desc    Get all email templates with filters and pagination
 * @route   GET /api/templates
 * @access  Private/Admin/Manager
 *
 * @param {string} [req.query.status] - Filter by status
 * @param {string} [req.query.type] - Filter by type
 * @param {string} [req.query.category] - Filter by category
 * @param {string} [req.query.triggerType] - Filter by trigger type
 * @param {string} [req.query.search] - Search by name/tags
 * @param {number} [req.query.page=1] - Page number
 * @param {number} [req.query.limit=20] - Items per page
 * @param {string} [req.query.sort=-createdAt] - Sort field
 */
export const getTemplates = async (req, res) => {
  try {
    const {
      status,
      type,
      category,
      triggerType,
      search,
      page = 1,
      limit = 20,
      sort = '-createdAt',
      includeVariants = false,
    } = req.query;

    // Build query
    const query = {};

    if (status) {
      query.status = status;
    }

    if (type) {
      query.type = type;
    }

    if (category) {
      query.category = category;
    }

    if (triggerType) {
      query.triggerType = triggerType;
    }

    // Exclude variants by default
    if (includeVariants !== 'true') {
      query.isVariant = { $ne: true };
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
      ];
    }

    // Execute query with pagination
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [templates, total] = await Promise.all([
      EmailTemplate.find(query)
        .populate('createdBy', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit, 10))
        .lean(),
      EmailTemplate.countDocuments(query),
    ]);

    // Add computed fields to response
    const templatesWithStats = templates.map(template => ({
      ...template,
      openRate: template.metrics?.totalSent > 0
        ? Math.round((template.metrics.uniqueOpens / template.metrics.totalSent) * 10000) / 100
        : 0,
      clickRate: template.metrics?.totalSent > 0
        ? Math.round((template.metrics.uniqueClicks / template.metrics.totalSent) * 10000) / 100
        : 0,
    }));

    res.status(200).json({
      success: true,
      count: templates.length,
      total,
      page: parseInt(page, 10),
      pages: Math.ceil(total / parseInt(limit, 10)),
      data: templatesWithStats,
    });

  } catch (error) {
    console.error('Error getting templates:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Get a single template by ID
 * @route   GET /api/templates/:id
 * @access  Private/Admin/Manager
 *
 * @param {string} req.params.id - Template ID
 */
export const getTemplateById = async (req, res) => {
  try {
    const template = await EmailTemplate.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .populate('parentTemplate', 'name slug');

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found',
      });
    }

    // Get variants if this is a parent template
    let variants = [];
    if (!template.isVariant) {
      variants = await EmailTemplate.getVariants(template._id);
    }

    res.status(200).json({
      success: true,
      data: {
        ...template.toObject(),
        variants,
      },
    });

  } catch (error) {
    console.error('Error getting template:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Get template by slug
 * @route   GET /api/templates/slug/:slug
 * @access  Private/Admin/Manager
 *
 * @param {string} req.params.slug - Template slug
 */
export const getTemplateBySlug = async (req, res) => {
  try {
    const template = await EmailTemplate.findBySlug(req.params.slug);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found',
      });
    }

    res.status(200).json({
      success: true,
      data: template,
    });

  } catch (error) {
    console.error('Error getting template by slug:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Create a new template
 * @route   POST /api/templates
 * @access  Private/Admin/Manager
 *
 * @param {Object} req.body - Template data
 */
export const createTemplate = async (req, res) => {
  try {
    const {
      name,
      category,
      type,
      subject,
      preheader,
      htmlBody,
      plainTextBody,
      variables,
      triggerType,
      triggerConfig,
      design,
      tags,
      notes,
    } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Template name is required',
      });
    }

    if (!subject) {
      return res.status(400).json({
        success: false,
        message: 'Email subject is required',
      });
    }

    if (!htmlBody) {
      return res.status(400).json({
        success: false,
        message: 'HTML body is required',
      });
    }

    if (!plainTextBody) {
      return res.status(400).json({
        success: false,
        message: 'Plain text body is required',
      });
    }

    // Create template
    const template = new EmailTemplate({
      name,
      category: category || 'custom',
      type: type || 'marketing',
      subject,
      preheader,
      htmlBody,
      plainTextBody,
      variables: variables || [],
      triggerType: triggerType || 'none',
      triggerConfig,
      design,
      tags,
      notes,
      createdBy: req.user._id,
    });

    await template.save();

    res.status(201).json({
      success: true,
      message: 'Template created successfully',
      data: template,
    });

  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Update a template
 * @route   PUT /api/templates/:id
 * @access  Private/Admin/Manager
 *
 * @param {string} req.params.id - Template ID
 * @param {Object} req.body - Updated template data
 */
export const updateTemplate = async (req, res) => {
  try {
    const template = await EmailTemplate.findById(req.params.id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found',
      });
    }

    // Only allow editing in draft or paused status
    if (!['draft', 'paused'].includes(template.status)) {
      return res.status(400).json({
        success: false,
        message: 'Can only edit templates in draft or paused status',
      });
    }

    // Fields that can be updated
    const allowedFields = [
      'name', 'category', 'type', 'subject', 'preheader',
      'htmlBody', 'plainTextBody', 'variables', 'triggerType',
      'triggerConfig', 'design', 'status', 'tags', 'notes',
      'variantWeight',
    ];

    // Update allowed fields
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        template[field] = req.body[field];
      }
    });

    // Increment version if content changed
    if (req.body.htmlBody || req.body.plainTextBody || req.body.subject) {
      template.incrementVersion();
    }

    template.updatedBy = req.user._id;
    await template.save();

    res.status(200).json({
      success: true,
      message: 'Template updated successfully',
      data: template,
    });

  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Delete (archive) a template
 * @route   DELETE /api/templates/:id
 * @access  Private/Admin
 *
 * @param {string} req.params.id - Template ID
 */
export const deleteTemplate = async (req, res) => {
  try {
    const template = await EmailTemplate.findById(req.params.id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found',
      });
    }

    // Archive the template
    template.archive();
    await template.save();

    res.status(200).json({
      success: true,
      message: 'Template archived successfully',
    });

  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================================
// TEMPLATE PREVIEW & RENDER
// ============================================================================

/**
 * @desc    Preview/render a template with sample data
 * @route   POST /api/templates/:id/preview
 * @access  Private/Admin/Manager
 *
 * @param {string} req.params.id - Template ID
 * @param {Object} [req.body.variables] - Variable values for rendering
 * @param {string} [req.body.format=html] - Output format (html or text)
 */
export const previewTemplate = async (req, res) => {
  try {
    const { variables = {}, format = 'html' } = req.body;

    const template = await EmailTemplate.findById(req.params.id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found',
      });
    }

    // Merge default sample data with provided variables
    const sampleData = {
      name: 'John Doe',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      company: 'Example Corp',
      currentDate: new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      currentYear: new Date().getFullYear(),
      unsubscribeLink: 'https://ementech.co.ke/unsubscribe?id=sample',
      ...variables,
    };

    try {
      const rendered = template.render(sampleData, format);

      res.status(200).json({
        success: true,
        data: {
          subject: rendered.subject,
          preheader: rendered.preheader,
          body: rendered.body,
          format,
          variablesUsed: Object.keys(sampleData),
        },
      });
    } catch (renderError) {
      res.status(400).json({
        success: false,
        message: `Render error: ${renderError.message}`,
        missingVariables: renderError.message.includes('Required variable')
          ? [renderError.message.match(/"([^"]+)"/)?.[1]]
          : [],
      });
    }

  } catch (error) {
    console.error('Error previewing template:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Validate template variables
 * @route   POST /api/templates/:id/validate-variables
 * @access  Private/Admin/Manager
 *
 * @param {string} req.params.id - Template ID
 * @param {Object} req.body.variables - Variables to validate
 */
export const validateVariables = async (req, res) => {
  try {
    const { variables = {} } = req.body;

    const template = await EmailTemplate.findById(req.params.id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found',
      });
    }

    const validation = template.validateVariables(variables);

    res.status(200).json({
      success: true,
      data: {
        valid: validation.valid,
        missing: validation.missing,
        provided: Object.keys(variables),
        required: template.variables.filter(v => v.required).map(v => v.name),
        optional: template.variables.filter(v => !v.required).map(v => v.name),
      },
    });

  } catch (error) {
    console.error('Error validating variables:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================================
// TEMPLATE DUPLICATION & VARIANTS
// ============================================================================

/**
 * @desc    Duplicate a template
 * @route   POST /api/templates/:id/duplicate
 * @access  Private/Admin/Manager
 *
 * @param {string} req.params.id - Template ID
 * @param {string} [req.body.name] - Name for duplicate
 */
export const duplicateTemplate = async (req, res) => {
  try {
    const { name } = req.body;

    const template = await EmailTemplate.findById(req.params.id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found',
      });
    }

    const newName = name || `${template.name} (Copy)`;
    const newSlug = await EmailTemplate.generateSlug(newName);

    const duplicate = template.duplicate(newName, newSlug);
    duplicate.createdBy = req.user._id;

    await duplicate.save();

    res.status(201).json({
      success: true,
      message: 'Template duplicated successfully',
      data: duplicate,
    });

  } catch (error) {
    console.error('Error duplicating template:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Create an A/B test variant
 * @route   POST /api/templates/:id/variant
 * @access  Private/Admin/Manager
 *
 * @param {string} req.params.id - Parent template ID
 * @param {string} req.body.variantId - Variant identifier (B, C, D, E)
 * @param {Object} [req.body.changes] - Fields to change in variant
 */
export const createVariant = async (req, res) => {
  try {
    const { variantId, changes = {} } = req.body;

    if (!variantId) {
      return res.status(400).json({
        success: false,
        message: 'variantId is required',
      });
    }

    if (!['B', 'C', 'D', 'E'].includes(variantId)) {
      return res.status(400).json({
        success: false,
        message: 'variantId must be B, C, D, or E',
      });
    }

    const template = await EmailTemplate.findById(req.params.id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found',
      });
    }

    // Check if variant already exists
    const existingVariant = await EmailTemplate.findOne({
      parentTemplate: template._id,
      variantId,
    });

    if (existingVariant) {
      return res.status(400).json({
        success: false,
        message: `Variant ${variantId} already exists`,
      });
    }

    const variant = template.createVariant(variantId, changes);
    variant.createdBy = req.user._id;

    // Update parent template variantId if not set
    if (!template.variantId) {
      template.variantId = 'A';
      await template.save();
    }

    await variant.save();

    res.status(201).json({
      success: true,
      message: `Variant ${variantId} created successfully`,
      data: variant,
    });

  } catch (error) {
    console.error('Error creating variant:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Get template variants
 * @route   GET /api/templates/:id/variants
 * @access  Private/Admin/Manager
 *
 * @param {string} req.params.id - Parent template ID
 */
export const getVariants = async (req, res) => {
  try {
    const template = await EmailTemplate.findById(req.params.id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found',
      });
    }

    const variants = await EmailTemplate.getVariants(template._id);

    res.status(200).json({
      success: true,
      count: variants.length,
      data: {
        parent: {
          id: template._id,
          name: template.name,
          variantId: template.variantId || 'A',
          metrics: template.metrics,
        },
        variants: variants.map(v => ({
          id: v._id,
          name: v.name,
          variantId: v.variantId,
          variantWeight: v.variantWeight,
          metrics: v.metrics,
          status: v.status,
        })),
      },
    });

  } catch (error) {
    console.error('Error getting variants:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================================
// TEMPLATE SEARCH & ANALYTICS
// ============================================================================

/**
 * @desc    Search templates
 * @route   GET /api/templates/search
 * @access  Private/Admin/Manager
 *
 * @param {string} req.query.q - Search query
 * @param {string} [req.query.status] - Filter by status
 * @param {string} [req.query.type] - Filter by type
 * @param {number} [req.query.limit=50] - Maximum results
 */
export const searchTemplates = async (req, res) => {
  try {
    const { q, status, type, limit = 50 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query (q) is required',
      });
    }

    const templates = await EmailTemplate.search(q, {
      status,
      type,
      limit: parseInt(limit, 10),
    });

    res.status(200).json({
      success: true,
      count: templates.length,
      data: templates,
    });

  } catch (error) {
    console.error('Error searching templates:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Get templates by category
 * @route   GET /api/templates/category/:category
 * @access  Private/Admin/Manager
 *
 * @param {string} req.params.category - Template category
 */
export const getByCategory = async (req, res) => {
  try {
    const templates = await EmailTemplate.getByCategory(req.params.category);

    res.status(200).json({
      success: true,
      count: templates.length,
      data: templates,
    });

  } catch (error) {
    console.error('Error getting templates by category:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Get templates by trigger type
 * @route   GET /api/templates/trigger/:triggerType
 * @access  Private/Admin/Manager
 *
 * @param {string} req.params.triggerType - Trigger type
 * @param {string} [req.query.pipelineStage] - Filter by pipeline stage
 */
export const getByTrigger = async (req, res) => {
  try {
    const { pipelineStage } = req.query;

    const templates = await EmailTemplate.getByTrigger(req.params.triggerType, {
      pipelineStage,
    });

    res.status(200).json({
      success: true,
      count: templates.length,
      data: templates,
    });

  } catch (error) {
    console.error('Error getting templates by trigger:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Get top performing templates
 * @route   GET /api/templates/top-performing
 * @access  Private/Admin/Manager
 *
 * @param {string} [req.query.metric=openRate] - Metric to sort by
 * @param {number} [req.query.limit=10] - Number of templates
 */
export const getTopPerforming = async (req, res) => {
  try {
    const { metric = 'openRate', limit = 10 } = req.query;

    const templates = await EmailTemplate.getTopPerforming(metric, parseInt(limit, 10));

    res.status(200).json({
      success: true,
      count: templates.length,
      data: templates.map(t => ({
        id: t._id,
        name: t.name,
        slug: t.slug,
        category: t.category,
        openRate: t.openRate,
        clickRate: t.clickRate,
        conversionRate: t.conversionRate,
        totalSent: t.metrics?.totalSent || 0,
      })),
    });

  } catch (error) {
    console.error('Error getting top performing templates:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Get aggregate template metrics
 * @route   GET /api/templates/metrics
 * @access  Private/Admin/Manager
 */
export const getAggregateMetrics = async (req, res) => {
  try {
    const metrics = await EmailTemplate.getAggregateMetrics();

    // Get template count by category
    const byCategory = await EmailTemplate.aggregate([
      { $match: { status: { $in: ['active', 'paused', 'draft'] } } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Get template count by type
    const byType = await EmailTemplate.aggregate([
      { $match: { status: { $in: ['active', 'paused', 'draft'] } } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        aggregate: metrics,
        byCategory: byCategory.reduce((acc, item) => {
          acc[item._id || 'unknown'] = item.count;
          return acc;
        }, {}),
        byType: byType.reduce((acc, item) => {
          acc[item._id || 'unknown'] = item.count;
          return acc;
        }, {}),
      },
    });

  } catch (error) {
    console.error('Error getting aggregate metrics:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Activate a template
 * @route   POST /api/templates/:id/activate
 * @access  Private/Admin/Manager
 *
 * @param {string} req.params.id - Template ID
 */
export const activateTemplate = async (req, res) => {
  try {
    const template = await EmailTemplate.findById(req.params.id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found',
      });
    }

    if (!['draft', 'paused'].includes(template.status)) {
      return res.status(400).json({
        success: false,
        message: 'Can only activate draft or paused templates',
      });
    }

    template.status = 'active';
    template.updatedBy = req.user._id;
    await template.save();

    res.status(200).json({
      success: true,
      message: 'Template activated',
      data: template,
    });

  } catch (error) {
    console.error('Error activating template:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Pause a template
 * @route   POST /api/templates/:id/pause
 * @access  Private/Admin/Manager
 *
 * @param {string} req.params.id - Template ID
 */
export const pauseTemplate = async (req, res) => {
  try {
    const template = await EmailTemplate.findById(req.params.id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found',
      });
    }

    if (template.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Can only pause active templates',
      });
    }

    template.status = 'paused';
    template.updatedBy = req.user._id;
    await template.save();

    res.status(200).json({
      success: true,
      message: 'Template paused',
      data: template,
    });

  } catch (error) {
    console.error('Error pausing template:', error);
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
  getTemplates,
  getTemplateById,
  getTemplateBySlug,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  previewTemplate,
  validateVariables,
  duplicateTemplate,
  createVariant,
  getVariants,
  searchTemplates,
  getByCategory,
  getByTrigger,
  getTopPerforming,
  getAggregateMetrics,
  activateTemplate,
  pauseTemplate,
};
