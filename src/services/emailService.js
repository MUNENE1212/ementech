import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

// Get auth token
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Create axios instance
const api = axios.create({
  baseURL: `${API_URL}/email`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Fetch emails
export const fetchEmails = async (folder = 'INBOX') => {
  try {
    const response = await api.get(`?folder=${folder}`);
    return response.data.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch emails');
  }
};

// Sync emails from IMAP
export const syncEmails = async (folder = 'INBOX') => {
  try {
    const response = await api.post(`/sync/${folder}`);
    return response.data.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to sync emails');
  }
};

// Get single email
export const getEmail = async (emailId) => {
  try {
    const response = await api.get(`/${emailId}`);
    return response.data.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch email');
  }
};

// Send email
export const sendEmail = async (emailData) => {
  try {
    // Map 'body' to 'textBody' for backend compatibility
    const payload = {
      ...emailData,
      textBody: emailData.body || emailData.textBody || '',
      htmlBody: emailData.htmlBody || ''
    };
    // Remove 'body' as backend expects 'textBody'/'htmlBody'
    delete payload.body;

    const response = await api.post('/send', payload);
    return response.data.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to send email');
  }
};

// Save draft
export const saveDraft = async (emailData) => {
  try {
    const response = await api.post('/draft', emailData);
    return response.data.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to save draft');
  }
};

// Mark as read/unread
export const markAsRead = async (emailId, read = true) => {
  try {
    const response = await api.put(`/${emailId}/read`, { read });
    return response.data.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to update email');
  }
};

// Mark multiple as read/unread
export const markMultipleAsRead = async (emailIds, read = true) => {
  try {
    const response = await api.put('/multiple/read', { emailIds, read });
    return response.data.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to update emails');
  }
};

// Toggle star/flag
export const toggleStar = async (emailId) => {
  try {
    const response = await api.put(`/${emailId}/flag`);
    return response.data.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to update email');
  }
};

// Toggle multiple stars
export const toggleStarMultiple = async (emailIds) => {
  try {
    const response = await api.put('/multiple/flag', { emailIds });
    return response.data.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to update emails');
  }
};

// Move to folder
export const moveToFolder = async (emailIds, folderId) => {
  try {
    const response = await api.put('/multiple/folder', { emailIds, folderId });
    return response.data.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to move emails');
  }
};

// Delete email
export const deleteEmail = async (emailId) => {
  try {
    const response = await api.delete(`/${emailId}`);
    return response.data.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to delete email');
  }
};

// Delete multiple emails
export const deleteMultipleEmails = async (emailIds) => {
  try {
    const response = await api.delete('/multiple', { data: { emailIds } });
    return response.data.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to delete emails');
  }
};

// Search emails
export const searchEmails = async (query) => {
  try {
    const response = await api.get(`/search?q=${query}`);
    return response.data.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to search emails');
  }
};

// Get folders
export const getFolders = async () => {
  try {
    const response = await api.get('/folders/list');
    return response.data.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch folders');
  }
};

// Get unread count
export const getUnreadCount = async (folder = 'INBOX') => {
  try {
    const response = await api.get(`/folders/unread-count?folder=${folder}`);
    return response.data.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch unread count');
  }
};

// Get labels
export const getLabels = async () => {
  try {
    const response = await api.get('/labels/list');
    return response.data.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch labels');
  }
};

// Create label
export const createLabel = async (labelData) => {
  try {
    const response = await api.post('/labels', labelData);
    return response.data.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to create label');
  }
};

// Add label to email
export const addLabelToEmails = async (emailIds, labelId) => {
  try {
    const response = await api.put(`/labels/${labelId}`, { emailIds });
    return response.data.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to add label');
  }
};

// Remove label from email
export const removeLabelFromEmails = async (emailIds, labelId) => {
  try {
    const response = await api.delete(`/labels/${labelId}`, { data: { emailIds } });
    return response.data.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to remove label');
  }
};

// Get contacts
export const getContacts = async () => {
  try {
    const response = await api.get('/contacts/list');
    return response.data.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch contacts');
  }
};

// Create contact
export const createContact = async (contactData) => {
  try {
    const response = await api.post('/contacts', contactData);
    return response.data.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to create contact');
  }
};
// Force rebuild - Wed Jan 21 05:56:45 PM EAT 2026
