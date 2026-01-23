# AI Chatbot Setup Guide

## Overview

The EmenTech AI Chatbot is a lead qualification and support chatbot powered by OpenAI GPT-4o. It naturally converses with visitors, qualifies leads, and collects information through value-first interactions.

## Features

- **Natural Conversations**: AI-powered responses using GPT-4o
- **Lead Qualification**: Automatically scores leads based on budget, timeline, authority, and needs
- **Progressive Profiling**: Collects information naturally during conversation
- **Quick Actions**: Contextual suggestions for common queries
- **Real-time**: Instant responses with typing indicators
- **Beautiful UI**: Modern, responsive chat interface

## Architecture

### Backend Components

1. **AI Chatbot Service** (`backend/src/services/aiChatbot.js`)
   - Message processing and intent detection
   - Response generation using OpenAI
   - Lead qualification logic
   - Conversation management

2. **Chat Routes** (`backend/src/routes/chat.routes.js`)
   - `/api/chat/message` - Send and receive messages
   - `/api/chat/conversation/:id` - Get conversation history
   - `/api/chat/analytics` - Get chatbot analytics

3. **Chat Controller** (`backend/src/controllers/chatController.js`)
   - Request handling
   - Response formatting
   - Error handling

### Frontend Components

1. **AIChatbot** (`src/components/chat/AIChatbot.jsx`)
   - Main orchestrator component
   - Manages chat state

2. **ChatWindow** (`src/components/chat/ChatWindow.jsx`)
   - Message display
   - Input handling
   - Quick actions

3. **Supporting Components**
   - `MessageBubble` - Individual message display
   - `TypingIndicator` - Loading animation
   - `QuickActions` - Conversation starters
   - `ChatButton` - Floating trigger button

4. **Custom Hook** (`src/hooks/useChat.js`)
   - State management
   - API communication
   - Message handling

5. **Service** (`src/services/chatService.js`)
   - HTTP client for API calls

## Setup Instructions

### 1. Backend Configuration

Add to `backend/.env`:

```env
# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here

# API Configuration
API_URL=http://localhost:5001/api
CORS_ORIGIN=http://localhost:5173
```

### 2. Get OpenAI API Key

1. Go to [platform.openai.com](https://platform.openai.com)
2. Sign up or log in
3. Navigate to API keys section
4. Create new API key
5. Copy and add to `.env` file

### 3. Frontend Configuration

Add to frontend `.env`:

```env
VITE_API_URL=http://localhost:5001/api
```

### 4. Install Dependencies

Backend (already installed):
```bash
cd backend
npm install openai
```

Frontend (uses existing dependencies):
- axios (already installed)
- date-fns (already installed)
- socket.io-client (already installed)

### 5. Start Servers

Backend:
```bash
cd backend
npm run dev
```

Frontend:
```bash
npm run dev
```

## Usage

### For Visitors

1. Click the floating chat button (bottom-right corner)
2. Start typing or select a quick action
3. AI responds naturally and helps qualify your needs
4. If qualified, AI will request email to schedule a call

### For Admins

#### View Conversations

```javascript
GET /api/chat/conversations?page=1&limit=20
```

#### Get Analytics

```javascript
GET /api/chat/analytics?startDate=2025-01-01&endDate=2025-01-31
```

Response:
```json
{
  "success": true,
  "data": {
    "totalConversations": 150,
    "qualifiedLeads": 45,
    "qualificationRate": 30,
    "avgMessages": 8,
    "avgLeadScore": 72
  }
}
```

#### View Conversation Details

```javascript
GET /api/chat/conversation/:conversationId
```

## Lead Qualification Logic

### Scoring System

Maximum score: 100 points

1. **Budget** (30 points)
   - $50,000+: 30 points
   - $25,000-$49,999: 25 points
   - $10,000-$24,999: 20 points
   - $5,000-$9,999: 10 points

2. **Timeline** (25 points)
   - 0-3 months: 25 points
   - 3-6 months: 20 points
   - 6-12 months: 15 points
   - 12+ months: 5 points

3. **Authority** (20 points)
   - Decision maker: 20 points
   - Not decision maker: 5 points

4. **Needs/Pain Points** (25 points)
   - Each pain point: up to 10 points (max 25)

5. **Email Captured** (10 points)

### Qualification Threshold

- **Qualified**: 70+ points
- **In Progress**: 40-69 points
- **Not Qualified**: < 40 points

## Conversation Flow Example

```
User: "I need a website built"

AI: "Great! I'd love to help. What type of website are you looking for?"

User: "E-commerce site for my clothing line"

AI: "Excellent choice! How many products do you plan to sell?"

User: "About 500 to start"

AI: "Perfect! What's your timeline for getting this live?"

User: "Need it live in 2 months"

AI: "Got it. And what's your budget range?"

User: "$5,000 - $10,000"

AI: "Thanks for sharing! I'll have our team reach out with a detailed proposal.
    What's the best email to send it to?"

User: "john@example.com"

[System creates lead with score: 72/100 - Qualified]
```

## API Endpoints

### Public Endpoints

#### Send Message
```http
POST /api/chat/message
Content-Type: application/json

{
  "message": "I need a website",
  "conversationId": "optional-existing-id"
}
```

#### Get Conversation
```http
GET /api/chat/conversation/:conversationId
```

### Admin Endpoints (Require Authentication)

#### Get All Conversations
```http
GET /api/chat/conversations?page=1&limit=20&status=all
```

#### Get Conversation Stats
```http
GET /api/chat/conversation/:conversationId/stats
```

#### Get Analytics
```http
GET /api/chat/analytics?startDate=2025-01-01&endDate=2025-01-31
```

#### Update Conversation Status
```http
PUT /api/chat/conversation/:conversationId/status
Content-Type: application/json

{
  "status": "archived"
}
```

#### Manual Qualification
```http
POST /api/chat/conversation/:conversationId/qualify
```

#### Delete Conversation
```http
DELETE /api/chat/conversation/:conversationId
```

## Customization

### Modify AI Behavior

Edit `backend/src/services/aiChatbot.js`:

```javascript
const systemPrompt = `You are an EmenTech AI Assistant...`;
```

### Change Scoring Criteria

Edit `_calculateLeadScore` method in `aiChatbot.js`:

```javascript
_calculateLeadScore(qualification) {
  let score = 0;
  // Customize scoring logic
  return score;
}
```

### Update Quick Actions

Edit `_generateSuggestions` method:

```javascript
_generateSuggestions(intent, lastResponse) {
  // Return contextual suggestions
  return ["Action 1", "Action 2", "Action 3"];
}
```

## Styling

The chatbot uses Tailwind CSS. To customize colors:

```jsx
// In ChatWindow.jsx
className="bg-gradient-to-r from-blue-600 to-blue-700"
```

## Troubleshooting

### Chatbot Not Responding

1. Check OpenAI API key is set correctly
2. Verify backend is running on correct port
3. Check browser console for errors
4. Verify CORS settings

### Messages Not Saving

1. Check MongoDB connection
2. Verify Conversation/Message models exist
3. Check backend logs for errors

### Lead Not Created

1. Verify lead score reaches 70+
2. Check Lead model exists
3. Review qualification logic in backend

## Monitoring

### Key Metrics to Track

1. **Engagement Rate**: % of visitors who chat
2. **Conversation Length**: Average messages per chat
3. **Qualification Rate**: % that provide email
4. **Lead Score Distribution**: Breakdown by score ranges
5. **Conversion Rate**: % that become customers

### View Logs

Backend:
```bash
cd backend
npm run dev
# Watch console logs for chatbot activity
```

## Security Considerations

1. **Rate Limiting**: Add rate limiting to `/api/chat/message` endpoint
2. **Input Sanitization**: Messages are sanitized before processing
3. **API Key Security**: Never commit OpenAI API key to git
4. **CORS**: Configure proper CORS origins
5. **Authentication**: Admin endpoints should require authentication

## Future Enhancements

- [ ] Multi-language support
- [ ] Voice input/output
- [ ] File upload/sharing
- [ ] Calendar integration
- [ ] CRM integration (HubSpot, Salesforce)
- [ ] A/B testing for prompts
- [ ] Sentiment analysis
- [ ] Agent handoff (human takeover)
- [ ] Knowledge base integration (RAG)

## Support

For issues or questions:
- Email: info@ementech.co.ke
- Website: ementech.co.ke

## License

MIT License - EmenTech 2026

---

**Status**: Production Ready ✅
**Version**: 1.0.0
**Last Updated**: January 20, 2026
