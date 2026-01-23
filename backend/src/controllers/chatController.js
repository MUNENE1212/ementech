import AIChatbotService from '../services/aiChatbot.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import Lead from '../models/Lead.js';

// Instantiate the service (environment variables are now loaded)
const aiChatbotService = new AIChatbotService();

/**
 * Chat Controller
 * Handles all chatbot-related endpoints
 */

/**
 * Send a message and get AI response
 */
export const sendMessage = async (req, res) => {
  try {
    const { message, conversationId } = req.body;

    // Validate input
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    // Get visitor info from request
    const visitorInfo = {
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      referrer: req.get('referrer')
    };

    // Process message through AI chatbot
    const result = await aiChatbotService.processMessage(
      message.trim(),
      conversationId || null,
      visitorInfo
    );

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send message',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * End a conversation
 */
export const endConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await Conversation.findByIdAndUpdate(
      conversationId,
      {
        status: 'archived',
        'metadata.endedAt': new Date(),
        'metadata.endedBy': req.user?.id || 'system'
      },
      { new: true }
    );

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }

    res.json({
      success: true,
      message: 'Conversation ended successfully',
      data: conversation
    });

  } catch (error) {
    console.error('Error ending conversation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to end conversation'
    });
  }
};

/**
 * Hand off conversation to human agent
 */
export const handoffToHuman = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { agentId, reason } = req.body;

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }

    // Update conversation metadata
    conversation.metadata.handoff = {
      toHuman: true,
      agentId,
      reason,
      timestamp: new Date()
    };

    // Send notification to agent (implement notification system)
    // This could send an email, Slack message, or real-time notification

    await conversation.save();

    res.json({
      success: true,
      message: 'Conversation handed off to human agent',
      data: conversation
    });

  } catch (error) {
    console.error('Error handing off conversation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to handoff conversation'
    });
  }
};

/**
 * Get chat statistics (admin)
 */
export const getChatStatistics = async (req, res) => {
  try {
    const { startDate, endDate, groupBy } = req.query;

    const matchQuery = {
      'metadata.isAIChatbot': true
    };

    if (startDate || endDate) {
      matchQuery.createdAt = {};
      if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
      if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
    }

    // Total conversations
    const totalConversations = await Conversation.countDocuments(matchQuery);

    // Qualified leads
    const qualifiedLeads = await Conversation.countDocuments({
      ...matchQuery,
      'metadata.leadId': { $exists: true }
    });

    // Conversations by status
    const conversationsByStatus = await Conversation.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Average messages per conversation
    const conversations = await Conversation.find(matchQuery);
    const conversationIds = conversations.map(c => c._id);

    const totalMessages = await Message.countDocuments({
      conversation: { $in: conversationIds }
    });

    const avgMessages = totalConversations > 0 ? totalMessages / totalConversations : 0;

    // Lead quality distribution
    const leadScores = conversations
      .filter(c => c.metadata.leadScore)
      .map(c => c.metadata.leadScore);

    const leadQuality = {
      high: leadScores.filter(s => s >= 70).length,
      medium: leadScores.filter(s => s >= 40 && s < 70).length,
      low: leadScores.filter(s => s < 40).length
    };

    // Conversations over time (if groupBy is 'day', 'week', 'month')
    let conversationsOverTime = [];
    if (groupBy) {
      conversationsOverTime = await Conversation.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: {
              date: {
                $dateToString: {
                  format: groupBy === 'day' ? '%Y-%m-%d' : '%Y-%U',
                  date: '$createdAt'
                }
              }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.date': 1 } }
      ]);
    }

    res.json({
      success: true,
      data: {
        overview: {
          totalConversations,
          qualifiedLeads,
          qualificationRate: totalConversations > 0
            ? Math.round((qualifiedLeads / totalConversations) * 100)
            : 0,
          avgMessages: Math.round(avgMessages)
        },
        byStatus: conversationsByStatus,
        leadQuality,
        conversationsOverTime,
        period: {
          start: startDate || 'all time',
          end: endDate || 'present'
        }
      }
    });

  } catch (error) {
    console.error('Error getting chat statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get chat statistics'
    });
  }
};

/**
 * Get conversation history
 */
export const getConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;

    if (!conversationId) {
      return res.status(400).json({
        success: false,
        error: 'Conversation ID is required'
      });
    }

    const conversation = await Conversation.findById(conversationId)
      .populate('lastMessage');

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }

    const messages = await Message.find({
      conversation: conversationId,
      isDeleted: false
    })
    .sort({ createdAt: 1 })
    .limit(50);

    res.json({
      success: true,
      data: {
        conversation,
        messages: messages.map(msg => ({
          id: msg._id,
          role: msg.isAIGenerated ? 'assistant' : 'user',
          content: msg.text,
          timestamp: msg.createdAt,
          suggestions: msg.metadata?.suggestions || []
        }))
      }
    });

  } catch (error) {
    console.error('Error getting conversation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get conversation'
    });
  }
};

/**
 * Get all chatbot conversations (for admin)
 */
export const getAllConversations = async (req, res) => {
  try {
    const { page = 1, limit = 20, status = 'all' } = req.query;

    const query = {
      'metadata.isAIChatbot': true
    };

    if (status !== 'all') {
      query.status = status;
    }

    const conversations = await Conversation.find(query)
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('lastMessage');

    const total = await Conversation.countDocuments(query);

    res.json({
      success: true,
      data: {
        conversations,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error getting conversations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get conversations'
    });
  }
};

/**
 * Get conversation statistics
 */
export const getConversationStats = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const stats = await aiChatbotService.getConversationStats(conversationId);

    if (!stats) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error getting conversation stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get conversation stats'
    });
  }
};

/**
 * Manual lead qualification trigger
 */
export const qualifyLead = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }

    // Trigger qualification check
    const qualificationStatus = await aiChatbotService._checkQualification(
      conversation,
      { type: 'manual' },
      ''
    );

    // Create/update lead if qualified
    if (qualificationStatus.isQualified) {
      const lead = await aiChatbotService._createOrUpdateLead(
        conversation,
        qualificationStatus
      );

      return res.json({
        success: true,
        data: {
          message: 'Lead qualified successfully',
          lead,
          qualificationStatus
        }
      });
    }

    res.json({
      success: true,
      data: {
        message: 'Lead not yet qualified',
        qualificationStatus
      }
    });

  } catch (error) {
    console.error('Error qualifying lead:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to qualify lead'
    });
  }
};

/**
 * Update conversation status
 */
export const updateConversationStatus = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { status } = req.body;

    if (!['active', 'archived', 'deleted'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status'
      });
    }

    const conversation = await Conversation.findByIdAndUpdate(
      conversationId,
      { status },
      { new: true }
    );

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }

    res.json({
      success: true,
      data: conversation
    });

  } catch (error) {
    console.error('Error updating conversation status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update conversation status'
    });
  }
};

/**
 * Delete conversation (soft delete)
 */
export const deleteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await Conversation.findByIdAndUpdate(
      conversationId,
      { status: 'deleted' },
      { new: true }
    );

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }

    res.json({
      success: true,
      message: 'Conversation deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete conversation'
    });
  }
};

/**
 * Get chatbot analytics (admin)
 */
export const getAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const matchQuery = {
      'metadata.isAIChatbot': true
    };

    if (startDate || endDate) {
      matchQuery.createdAt = {};
      if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
      if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
    }

    // Total conversations
    const totalConversations = await Conversation.countDocuments(matchQuery);

    // Qualified leads
    const qualifiedLeads = await Conversation.countDocuments({
      ...matchQuery,
      'metadata.leadId': { $exists: true }
    });

    // Average messages per conversation
    const conversations = await Conversation.find(matchQuery);
    const totalMessages = await Message.countDocuments({
      conversation: { $in: conversations.map(c => c._id) }
    });

    const avgMessages = totalConversations > 0 ? totalMessages / totalConversations : 0;

    // Lead qualification rate
    const qualificationRate = totalConversations > 0
      ? (qualifiedLeads / totalConversations) * 100
      : 0;

    // Average lead score
    const leads = await Lead.find({ source: 'AI Chatbot' });
    const avgLeadScore = leads.length > 0
      ? leads.reduce((sum, lead) => sum + (lead.score || 0), 0) / leads.length
      : 0;

    res.json({
      success: true,
      data: {
        totalConversations,
        qualifiedLeads,
        qualificationRate: Math.round(qualificationRate),
        avgMessages: Math.round(avgMessages),
        avgLeadScore: Math.round(avgLeadScore),
        period: {
          start: startDate || 'all time',
          end: endDate || 'present'
        }
      }
    });

  } catch (error) {
    console.error('Error getting analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get analytics'
    });
  }
};

export default {
  sendMessage,
  getConversation,
  qualifyLead,
  endConversation,
  handoffToHuman,
  getChatStatistics
};
