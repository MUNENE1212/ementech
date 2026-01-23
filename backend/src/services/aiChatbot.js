import mongoose from 'mongoose';
import OpenAI from 'openai';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import Lead from '../models/Lead.js';
import User from '../models/User.js';

/**
 * AI Chatbot Service
 * Handles lead qualification conversations using OpenAI GPT-4o
 */
class AIChatbotService {
  constructor() {
    // Use lazy initialization - check API key when methods are called, not in constructor
    this.openai = null;
    this.isEnabled = null; // Will be determined on first use
    this._initialized = false;

    // Lead qualification questions (asked naturally based on context)
    this.qualificationCriteria = {
      budget: { min: 10000, weight: 30 },
      timeline: { maxMonths: 6, weight: 25 },
      authority: { weight: 20 },
      need: { weight: 25 }
    };
  }

  /**
   * Initialize OpenAI (lazy loading)
   */
  _initialize() {
    if (this._initialized) return;

    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey && apiKey !== 'sk-placeholder-key-replace-with-real-key' && apiKey.startsWith('sk-')) {
      this.openai = new OpenAI({ apiKey });
      this.isEnabled = true;
      console.log('✅ AI Chatbot initialized with OpenAI');
    } else {
      this.openai = null;
      this.isEnabled = false;
      console.log('⚠️  AI Chatbot disabled: Missing or invalid OPENAI_API_KEY');
    }

    this._initialized = true;
  }

  /**
   * Main message processing function
   * Routes user message to appropriate AI agent
   */
  async processMessage(userMessage, conversationId, visitorInfo = {}) {
    try {
      // Initialize OpenAI (lazy loading)
      this._initialize();

      if (!this.isEnabled) {
        throw new Error('AI Chatbot is not enabled. Please check OPENAI_API_KEY configuration.');
      }

      // Get conversation history
      const conversation = await this._getOrCreateConversation(conversationId, visitorInfo);
      const history = await this._getConversationHistory(conversation._id);

      // Detect intent
      const intent = await this._detectIntent(userMessage, history);

      // Generate AI response
      const response = await this._generateResponse(userMessage, history, intent);

      // Get bot user ID and visitor ID from conversation participants
      const botParticipant = conversation.participants.find(p => p.role === 'admin');
      const visitorParticipant = conversation.participants.find(p => p.role === 'member');
      const botUserId = botParticipant ? botParticipant.user : null;
      const visitorUserId = visitorParticipant ? visitorParticipant.user : null;

      // Save messages
      await this._saveMessages(conversation._id, userMessage, response, intent, botUserId, visitorUserId);

      // Check qualification progress
      const qualificationStatus = await this._checkQualification(conversation, intent, userMessage);

      // If qualified, create/update lead
      if (qualificationStatus.isQualified) {
        await this._createOrUpdateLead(conversation, qualificationStatus);
      }

      return {
        response: response.text,
        intent: intent.type,
        qualificationStatus,
        conversationId: conversation._id,
        suggestions: response.suggestions || []
      };

    } catch (error) {
      console.error('Error processing message:', error);
      throw new Error('Failed to process message');
    }
  }

  /**
   * Get or create conversation for visitor
   */
  async _getOrCreateConversation(conversationId, visitorInfo) {
    if (conversationId) {
      const conversation = await Conversation.findById(conversationId);
      if (conversation) return conversation;
    }

    // Get or create bot user for second participant
    let botUser = await User.findOne({ email: 'bot@ementech.co.ke' });
    if (!botUser) {
      // Create bot user if it doesn't exist
      botUser = await User.create({
        name: 'EmenTech AI Bot',
        email: 'bot@ementech.co.ke',
        password: 'bot_pass_' + Date.now(), // Random password
        role: 'admin',
        department: 'engineering',
        isActive: true
      });
      console.log('✅ Created bot user for AI chatbot');
    }

    // Create a placeholder user ID for the anonymous visitor
    // We'll use a special ObjectId that represents anonymous users
    const anonymousUserId = new mongoose.Types.ObjectId();

    // Create new chatbot conversation with 2 participants
    const conversation = await Conversation.create({
      type: 'support', // Using support type for AI chatbot
      participants: [
        {
          user: botUser._id, // AI bot user
          role: 'admin'
        },
        {
          user: anonymousUserId, // Anonymous visitor placeholder
          role: 'member'
        }
      ],
      metadata: {
        isAIChatbot: true,
        visitorInfo,
        isAnonymous: true
      }
    });

    // Send initial greeting
    await this._sendInitialGreeting(conversation._id, botUser._id);

    return conversation;
  }

  /**
   * Send initial greeting message
   */
  async _sendInitialGreeting(conversationId, botUserId) {
    const greeting = {
      text: "Hi! Welcome to EmenTech. I'm here to help you explore how we can transform your business with technology. What brings you here today?",
      type: 'text',
      sender: botUserId, // AI bot user ID
      conversation: conversationId,
      isAIGenerated: true
    };

    await Message.create(greeting);
  }

  /**
   * Get conversation history for context
   */
  async _getConversationHistory(conversationId) {
    const messages = await Message.find({
      conversation: conversationId,
      isDeleted: false
    })
    .sort({ createdAt: 1 })
    .limit(20); // Last 20 messages for context

    return messages.map(msg => ({
      role: msg.isAIGenerated ? 'assistant' : 'user',
      content: msg.text
    }));
  }

  /**
   * Detect user intent using GPT-4
   */
  async _detectIntent(message, history) {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are an intent classifier. Analyze the user's message and determine their intent.

            Possible intents:
            1. service_inquiry - Asking about EmenTech services
            2. pricing - Asking about costs/pricing
            3. booking - Wants to schedule a meeting/call
            4. technical - Technical question about development
            5. general - General conversation

            Respond with JSON: { "intent": "intent_name", "confidence": 0.95, "entities": {} }`
          },
          ...history.slice(-5),
          {
            role: 'user',
            content: message
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1
      });

      const result = JSON.parse(response.choices[0].message.content);
      return {
        type: result.intent,
        confidence: result.confidence,
        entities: result.entities
      };

    } catch (error) {
      console.error('Intent detection error:', error);
      return { type: 'general', confidence: 0.5, entities: {} };
    }
  }

  /**
   * Generate AI response using GPT-4
   */
  async _generateResponse(userMessage, history, intent) {
    const systemPrompt = `You are an EmenTech AI Assistant. Your role is to:

1. Be helpful, friendly, and conversational
2. Provide valuable information about EmenTech services (web development, mobile apps, AI/ML, cloud solutions)
3. Naturally gather information to qualify leads:
   - What type of project are they working on?
   - What's their timeline?
   - What's their budget range?
   - Are they the decision maker?
4. Be transparent that you're an AI
5. Never be pushy - focus on providing value first
6. If qualified (budget $10k+, timeline <6 months, decision maker), suggest scheduling a call

EmenTech Services:
- Custom Web Development (React, Next.js, Node.js)
- Mobile App Development (React Native, Flutter)
- AI/ML Solutions (Chatbots, Predictive Analytics, Automation)
- Cloud Solutions (AWS, Azure, Google Cloud)
- E-commerce Solutions

Pricing Ranges:
- Simple websites: $5,000 - $15,000
- Web applications: $15,000 - $50,000
- Mobile apps: $20,000 - $100,000
- AI/ML solutions: $25,000 - $150,000
- Full platforms: $50,000+

Response Guidelines:
- Keep responses concise (2-3 sentences max)
- Ask follow-up questions naturally
- Be conversational, not transactional
- If they seem qualified, ask for email to schedule a call`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          ...history,
          { role: 'user', content: userMessage }
        ],
        temperature: 0.7,
        max_tokens: 300
      });

      const aiResponse = response.choices[0].message.content;

      // Generate quick action suggestions
      const suggestions = this._generateSuggestions(intent, aiResponse);

      return {
        text: aiResponse,
        suggestions
      };

    } catch (error) {
      console.error('Response generation error:', error);

      // Fallback response
      return {
        text: "I apologize, but I'm having trouble connecting right now. Please try again or contact us directly at info@ementech.co.ke.",
        suggestions: [
          "Tell me about your services",
          "Get a quote",
          "Book a consultation"
        ]
      };
    }
  }

  /**
   * Generate contextual quick action suggestions
   */
  _generateSuggestions(intent, lastResponse) {
    const baseSuggestions = [
      "Tell me about your services",
      "Get a quote",
      "Book a consultation",
      "Learn about web development"
    ];

    if (intent.type === 'service_inquiry') {
      return [
        "Web Development",
        "Mobile Apps",
        "AI Solutions",
        "Pricing"
      ];
    }

    if (intent.type === 'pricing') {
      return [
        "Website pricing",
        "Mobile app pricing",
        "Get a detailed quote"
      ];
    }

    return baseSuggestions;
  }

  /**
   * Save user and AI messages to database
   */
  async _saveMessages(conversationId, userMessage, aiResponse, intent, botUserId, visitorUserId) {
    // Save user message
    await Message.create({
      conversation: conversationId,
      sender: visitorUserId, // Anonymous visitor ObjectId
      type: 'text',
      text: userMessage,
      status: 'sent',
      metadata: {
        intent: intent.type
      }
    });

    // Save AI response
    await Message.create({
      conversation: conversationId,
      sender: botUserId, // AI bot user
      type: 'text',
      text: aiResponse.text,
      isAIGenerated: true,
      metadata: {
        suggestions: aiResponse.suggestions,
        intent: intent.type
      }
    });
  }

  /**
   * Check if conversation has qualified a lead
   */
  async _checkQualification(conversation, intent, userMessage) {
    const messages = await Message.find({
      conversation: conversation._id,
      isDeleted: false
    }).sort({ createdAt: 1 });

    const conversationText = messages.map(m => m.text).join(' ');

    // Use GPT-4 to extract qualification data
    const qualification = await this._extractQualificationData(conversationText);

    // Calculate lead score
    const score = this._calculateLeadScore(qualification);

    const isQualified = score >= 70; // 70+ is qualified

    return {
      ...qualification,
      score,
      isQualified,
      status: isQualified ? 'qualified' : 'in_progress'
    };
  }

  /**
   * Extract qualification information from conversation
   */
  async _extractQualificationData(conversationText) {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `Extract lead qualification information from the conversation.

            Return JSON with these fields:
            {
              "name": "extracted name or null",
              "email": "extracted email or null",
              "company": "extracted company or null",
              "projectType": "type of project or null",
              "budget": "budget range or null (e.g., '$10,000 - $50,000')",
              "timeline": "timeline or null (e.g., '2-3 months')",
              "isDecisionMaker": true/false/null,
              "painPoints": ["pain point 1", "pain point 2"] or []
            }

            Only extract information that was explicitly mentioned. Use null for missing data.`
          },
          {
            role: 'user',
            content: conversationText
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1
      });

      return JSON.parse(response.choices[0].message.content);

    } catch (error) {
      console.error('Qualification extraction error:', error);
      return {};
    }
  }

  /**
   * Calculate lead score based on qualification criteria
   */
  _calculateLeadScore(qualification) {
    let score = 0;

    // Budget score (30 points max)
    if (qualification.budget) {
      const budgetNum = this._extractBudgetNumber(qualification.budget);
      if (budgetNum >= 50000) score += 30;
      else if (budgetNum >= 25000) score += 25;
      else if (budgetNum >= 10000) score += 20;
      else if (budgetNum >= 5000) score += 10;
    }

    // Timeline score (25 points max)
    if (qualification.timeline) {
      const timelineMonths = this._extractTimelineMonths(qualification.timeline);
      if (timelineMonths <= 3) score += 25;
      else if (timelineMonths <= 6) score += 20;
      else if (timelineMonths <= 12) score += 15;
      else score += 5;
    }

    // Authority score (20 points max)
    if (qualification.isDecisionMaker === true) score += 20;
    else if (qualification.isDecisionMaker === false) score += 5;

    // Need/Pain points score (25 points max)
    if (qualification.painPoints && qualification.painPoints.length > 0) {
      score += Math.min(qualification.painPoints.length * 10, 25);
    }

    // Email captured (+10 points)
    if (qualification.email) score += 10;

    return Math.min(score, 100);
  }

  /**
   * Extract numeric budget from string
   */
  _extractBudgetNumber(budgetString) {
    const numbers = budgetString.match(/\$?([\d,]+)/g);
    if (!numbers) return 0;

    const values = numbers.map(n => parseInt(n.replace(/[$,]/g, '')));
    return Math.max(...values);
  }

  /**
   * Extract timeline in months from string
   */
  _extractTimelineMonths(timelineString) {
    const lower = timelineString.toLowerCase();

    if (lower.includes('week')) return 0.5;
    if (lower.includes('month')) {
      const match = lower.match(/(\d+)\s*month/);
      return match ? parseInt(match[1]) : 6;
    }
    if (lower.includes('year')) {
      const match = lower.match(/(\d+)\s*year/);
      return match ? parseInt(match[1]) * 12 : 12;
    }

    return 6; // Default
  }

  /**
   * Create or update lead record
   */
  async _createOrUpdateLead(conversation, qualificationData) {
    try {
      // Check if lead already exists (by email)
      let lead;

      if (qualificationData.email) {
        lead = await Lead.findOne({ email: qualificationData.email.toLowerCase() });
      }

      const leadData = {
        name: qualificationData.name || 'Visitor',
        email: qualificationData.email || null,
        phone: qualificationData.phone || null,
        company: qualificationData.company || null,
        source: 'AI Chatbot',
        status: 'New',
        score: qualificationData.score,
        qualification: {
          projectType: qualificationData.projectType,
          budget: qualificationData.budget,
          timeline: qualificationData.timeline,
          isDecisionMaker: qualificationData.isDecisionMaker,
          painPoints: qualificationData.painPoints || []
        },
        metadata: {
          conversationId: conversation._id,
          qualifiedAt: new Date(),
          qualificationDetails: qualificationData
        }
      };

      if (lead) {
        // Update existing lead
        Object.assign(lead, leadData);
        await lead.save();
      } else {
        // Create new lead
        lead = await Lead.create(leadData);
      }

      // Update conversation with lead reference
      conversation.metadata.leadId = lead._id;
      conversation.metadata.leadScore = qualificationData.score;
      await conversation.save();

      return lead;

    } catch (error) {
      console.error('Error creating/updating lead:', error);
      throw error;
    }
  }

  /**
   * Get conversation statistics
   */
  async getConversationStats(conversationId) {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return null;

    const messages = await Message.countDocuments({
      conversation: conversationId,
      isDeleted: false
    });

    return {
      messages,
      createdAt: conversation.createdAt,
      lastActivity: conversation.metadata.lastActivity,
      leadScore: conversation.metadata.leadScore || null,
      isQualified: !!(conversation.metadata.leadId)
    };
  }
}

// Don't instantiate immediately - let the controller instantiate it after env is loaded
export default AIChatbotService;
