import express from 'express';
import {
  createLead,
  getLeads,
  getLeadById,
  updateLead,
  deleteLead,
  recalculateScores,
  convertLead,
  getLeadStatistics,
  unsubscribeLead,
  addNote,
  getQualifiedLeads
} from '../controllers/leadController.js';
import {
  assignLead,
  bulkAssignLeads,
  autoAssign,
  unassignLead,
  updatePipelineStage,
  getPipelineView,
  getPipelineSnapshot,
  getLeadsByEmployee,
  getMyLeads,
  addTags,
  removeTag,
  getLeadsByTag,
  updateEstimatedValue,
  updateProbability
} from '../controllers/leadAssignmentController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/', createLead); // Create lead (newsletter, download, etc.)
router.post('/:id/unsubscribe', unsubscribeLead);

// Protected routes (require authentication)
router.use(protect); // All routes below require authentication

// Routes for all authenticated employees
router.get('/my-leads', getMyLeads); // Get current user's assigned leads
router.get('/by-employee/:id', getLeadsByEmployee); // Get leads by employee
router.get('/by-tag/:tag', protect, authorize('admin', 'manager'), getLeadsByTag); // Get leads by tag

// Admin/Manager only routes
router.use(authorize('admin', 'manager')); // All routes below require admin/manager role

// Lead CRUD
router.get('/', getLeads);
router.get('/statistics', getLeadStatistics);
router.get('/qualified', getQualifiedLeads);
router.post('/score', recalculateScores);
router.get('/:id', getLeadById);
router.put('/:id', updateLead);
router.delete('/:id', deleteLead);
router.post('/:id/convert', convertLead);
router.post('/:id/notes', addNote);

// ========== Phase 2: Lead Assignment & Pipeline Routes ==========

// Assignment routes
router.put('/:id/assign', assignLead); // Assign lead to employee
router.delete('/:id/assign', unassignLead); // Unassign lead
router.post('/bulk-assign', bulkAssignLeads); // Bulk assign multiple leads
router.post('/auto-assign', autoAssign); // Auto-assign unassigned leads

// Pipeline routes
router.put('/:id/pipeline-stage', updatePipelineStage); // Update pipeline stage
router.get('/pipeline', getPipelineView); // Get Kanban board data
router.get('/pipeline-snapshot', getPipelineSnapshot); // Get pipeline counts

// Tag routes
router.post('/:id/tags', addTags); // Add tags to lead
router.delete('/:id/tags/:tag', removeTag); // Remove tag from lead

// Value & Probability routes
router.put('/:id/value', updateEstimatedValue); // Update estimated value
router.put('/:id/probability', updateProbability); // Update probability

export default router;
