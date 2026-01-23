import express from 'express';
import {
  getAllContent,
  getContentById,
  trackDownload,
  searchContent,
  getFeaturedContent,
  getTrendingContent,
  getContentByType,
  createContent,
  updateContent,
  deleteContent
} from '../controllers/contentController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', getAllContent);
router.get('/featured', getFeaturedContent);
router.get('/trending', getTrendingContent);
router.get('/type/:type', getContentByType);
router.post('/search', searchContent);
router.get('/:id', getContentById);
router.post('/:id/download', trackDownload);

// Protected routes (require authentication)
router.use(protect);

// Admin-only routes
router.use(authorize('admin', 'manager'));

router.post('/', createContent);
router.put('/:id', updateContent);
router.delete('/:id', deleteContent);

export default router;
