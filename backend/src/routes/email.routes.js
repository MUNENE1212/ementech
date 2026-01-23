import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  fetchEmails,
  syncEmails,
  getEmail,
  sendEmail,
  markAsRead,
  markMultipleAsRead,
  toggleFlag,
  moveToFolder,
  deleteEmail,
  deleteMultipleEmails,
  searchEmails,
  getFolders,
  getUnreadCount,
  getLabels,
  createLabel,
  addLabelToEmail,
  removeLabelFromEmail,
  getContacts,
  createContact
} from '../controllers/emailController.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// ===== EMAIL FETCHING & SYNCING =====

// Fetch emails from database
router.get('/', fetchEmails);

// Sync emails from IMAP server
router.post('/sync/:folder?', syncEmails);

// Search emails (MUST come before /:id route)
router.get('/search', searchEmails);

// Get single email
router.get('/:id', getEmail);

// ===== SENDING EMAILS =====

// Send email
router.post('/send', sendEmail);

// ===== EMAIL ACTIONS =====

// Mark as read/unread
router.put('/:id/read', markAsRead);

// Mark multiple as read/unread
router.put('/mark-read', markMultipleAsRead);

// Toggle flagged status
router.put('/:id/flag', toggleFlag);

// Move to folder
router.put('/:id/folder', moveToFolder);

// Delete email (soft delete)
router.delete('/:id', deleteEmail);

// Delete multiple emails
router.delete('/multiple/delete', deleteMultipleEmails);

// ===== FOLDERS =====

// Get folders
router.get('/folders/list', getFolders);

// Get unread count
router.get('/folders/unread-count', getUnreadCount);

// ===== LABELS =====

// Get labels
router.get('/labels/list', getLabels);

// Create label
router.post('/labels', createLabel);

// Add label to email
router.put('/:id/labels/:labelId', addLabelToEmail);

// Remove label from email
router.delete('/:id/labels/:labelId', removeLabelFromEmail);

// ===== CONTACTS =====

// Get contacts
router.get('/contacts/list', getContacts);

// Create contact
router.post('/contacts', createContact);

export default router;
