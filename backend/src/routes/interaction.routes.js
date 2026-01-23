import express from 'express';
import {
  trackInteraction,
  getUserJourney,
  getInteractionAnalytics,
  batchTrack
} from '../controllers/interactionController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/', trackInteraction);
router.post('/batch', batchTrack);

// Protected routes
router.use(protect);

// Admin routes
router.use(authorize('admin', 'manager'));

router.get('/lead/:leadId', getUserJourney);
router.get('/analytics', getInteractionAnalytics);

export default router;
