import Content from '../models/Content.js';
import Interaction from '../models/Interaction.js';

// @desc    Get all content
// @route   GET /api/content
// @access  Public
export const getAllContent = async (req, res) => {
  try {
    const {
      contentType,
      category,
      tags,
      featured,
      page = 1,
      limit = 12,
      sort = '-publishedAt'
    } = req.query;

    // Build query
    const query = {
      status: 'published',
      publishedAt: { $lte: new Date() }
    };

    if (contentType) query.contentType = contentType;
    if (category) query.category = category;
    if (tags) query.tags = { $in: tags.split(',') };
    if (featured) query.featured = featured === 'true';

    // Execute query
    const content = await Content.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .select('-body') // Exclude body for list view
      .lean();

    const total = await Content.countDocuments(query);

    res.status(200).json({
      success: true,
      count: content.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: content
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single content
// @route   GET /api/content/:id
// @access  Public
export const getContentById = async (req, res) => {
  try {
    const content = await Content.findById(req.params.id).lean();

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    // Increment view count
    if (content.status === 'published') {
      await Content.findByIdAndUpdate(req.params.id, {
        $inc: { 'metrics.views': 1 }
      });
    }

    res.status(200).json({
      success: true,
      data: content
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Track content download
// @route   POST /api/content/:id/download
// @access  Public
export const trackDownload = async (req, res) => {
  try {
    const { leadId, email } = req.body;

    const content = await Content.findById(req.params.id);

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    // Track download interaction
    if (leadId) {
      await Interaction.create({
        leadId,
        eventType: 'download',
        eventCategory: 'engagement',
        contentType: content.contentType,
        contentId: content._id,
        contentTitle: content.title,
        impactScore: 30,
        value: 30,
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });
    }

    // Increment download count
    content.metrics.downloads += 1;
    content.metrics.leadGenerated += 1;
    await content.save();

    res.status(200).json({
      success: true,
      message: 'Download tracked successfully',
      fileUrl: content.fileUrl
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Search content
// @route   POST /api/content/search
// @access  Public
export const searchContent = async (req, res) => {
  try {
    const { query, filters = {} } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const results = await Content.search(query, filters);

    res.status(200).json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get featured content
// @route   GET /api/content/featured
// @access  Public
export const getFeaturedContent = async (req, res) => {
  try {
    const { limit = 5 } = req.query;

    const content = await Content.getFeatured(parseInt(limit));

    res.status(200).json({
      success: true,
      count: content.length,
      data: content
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get trending content
// @route   GET /api/content/trending
// @access  Public
export const getTrendingContent = async (req, res) => {
  try {
    const { days = 7, limit = 10 } = req.query;

    const content = await Content.getTrending(parseInt(days), parseInt(limit));

    res.status(200).json({
      success: true,
      count: content.length,
      data: content
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get content by type
// @route   GET /api/content/type/:type
// @access  Public
export const getContentByType = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const content = await Content.getPublishedByType(
      req.params.type,
      parseInt(limit)
    );

    res.status(200).json({
      success: true,
      count: content.length,
      data: content
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Admin routes below

// @desc    Create content
// @route   POST /api/content
// @access  Private/Admin
export const createContent = async (req, res) => {
  try {
    const content = await Content.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Content created successfully',
      data: content
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update content
// @route   PUT /api/content/:id
// @access  Private/Admin
export const updateContent = async (req, res) => {
  try {
    const content = await Content.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Content updated successfully',
      data: content
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete content
// @route   DELETE /api/content/:id
// @access  Private/Admin
export const deleteContent = async (req, res) => {
  try {
    const content = await Content.findByIdAndDelete(req.params.id);

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Content deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
