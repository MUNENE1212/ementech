# AI Chatbot - Quick Reference Card

## Quick Start (5 Minutes)

### 1. Add OpenAI API Key
```bash
# Edit backend/.env
OPENAI_API_KEY=sk-your-key-here
```

### 2. Start Backend
```bash
cd backend
npm run dev
```

### 3. Start Frontend
```bash
npm run dev
```

### 4. Test!
- Open http://localhost:5173
- Click floating chat button (bottom-right)
- Send a message

---

## API Endpoints

### Public
```bash
POST /api/chat/                    # Send message
GET  /api/chat/conversations/:id   # Get conversation
```

### Protected (Auth Required)
```bash
POST /api/chat/conversations/:id/end      # End chat
POST /api/chat/conversations/:id/handoff  # Human takeover
```

### Admin Only
```bash
GET /api/chat/statistics           # Analytics
```

---

## Lead Scoring

**Max Score**: 100 points
**Qualified**: 70+ points

| Criterion     | Points                  |
|---------------|-------------------------|
| Budget        | 30 ($50k+ = full)       |
| Timeline      | 25 (<3mo = full)        |
| Authority     | 20 (Decision maker)     |
| Pain Points   | 25 (10pts each)         |
| Email         | 10 (Captured)           |

---

## File Locations

### Backend
```
backend/src/
├── services/aiChatbot.js       # AI logic
├── controllers/chatController.js
├── routes/chat.routes.js
└── server.js
```

### Frontend
```
src/
├── components/chat/
│   ├── AIChatbot.jsx           # Main component
│   ├── ChatWindow.jsx
│   └── ChatButton.jsx
├── hooks/useChat.js
├── services/chatService.js
└── App.tsx
```

---

## Common Commands

```bash
# Install dependencies
cd backend && npm install openai

# Restart backend
cd backend && npm run dev

# Check logs
# Watch terminal for chat activity

# Test API
curl -X POST http://localhost:5001/api/chat/ \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello"}'
```

---

## Environment Variables

```bash
# Backend (.env)
OPENAI_API_KEY=sk-...
MONGODB_URI=mongodb://...
CORS_ORIGIN=http://localhost:5173

# Frontend (.env)
VITE_API_URL=http://localhost:5001/api
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Not responding | Check OpenAI key & credits |
| CORS error | Verify CORS_ORIGIN setting |
| Slow response | Check OpenAI API status |
| No leads | Check score is 70+ |

---

## Monitoring

Check weekly:
- Total conversations
- Qualification rate (target: 25%+)
- Average lead score (target: 70+)
- OpenAI costs (set alerts)

---

## Next Steps

1. Test with real conversations
2. Add rate limiting (if not present)
3. Set up cost monitoring
4. Create admin dashboard
5. Add email notifications

---

## Support

📧 info@ementech.co.ke
🌐 ementech.co.ke

---

**Version**: 1.0.0
**Status**: Production Ready ✅
