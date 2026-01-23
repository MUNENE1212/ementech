import express from 'express';
import {
  sendMessage,
  qualifyLead,
  getConversation,
  endConversation,
  handoffToHuman,
  getChatStatistics
} from '../controllers/chatController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/', sendMessage);
router.post('/qualify', qualifyLead);

// Protected routes
router.use(protect);

router.get('/conversations/:conversationId', getConversation);
router.post('/conversations/:conversationId/end', endConversation);
router.post('/conversations/:conversationId/handoff', handoffToHuman);

// Admin-only routes
router.use(authorize('admin', 'manager'));
router.get('/statistics', getChatStatistics);

export default router;
