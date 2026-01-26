import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import * as emailService from '../services/emailService';

const EmailContext = createContext();

export const useEmail = () => {
  const context = useContext(EmailContext);
  if (!context) {
    throw new Error('useEmail must be used within EmailProvider');
  }
  return context;
};

export const EmailProvider = ({ children }) => {
  const [emails, setEmails] = useState([]);
  const [folders, setFolders] = useState([]);
  const [labels, setLabels] = useState([]);
  const [currentFolder, setCurrentFolder] = useState('INBOX');
  const [selectedEmails, setSelectedEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [socket, setSocket] = useState(null);
  const [newEmailIds, setNewEmailIds] = useState(new Set());

  // Initialize Socket.IO
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('🔒 No auth token found - email features disabled');
      return;
    }

    try {
      // Connect to base URL, not /api (Socket.IO is at root path)
      const socketUrl = import.meta.env.VITE_API_URL
        ? import.meta.env.VITE_API_URL.replace('/api', '')
        : window.location.origin;

      const newSocket = io(socketUrl, {
        path: '/socket.io/',
        auth: { token },
        reconnection: true,
        reconnectionAttempts: 2,
        reconnectionDelay: 2000,
        timeout: 5000,
        transports: ['websocket', 'polling'],
      });

      newSocket.on('connect', () => {
        console.log('✅ Connected to email server');
      });

      newSocket.on('connect_error', (error) => {
        // Silently handle connection errors - Socket.IO is optional for email functionality
        console.warn('⚠️ Real-time updates unavailable (Socket.IO not connected)');
        // Don't set error state - emails will work without real-time updates
      });

      newSocket.on('new_email', (email) => {
        console.log('📧 New email received:', email);
        setEmails(prev => [email, ...prev]);
        setNewEmailIds(prev => new Set([...prev, email._id]));
      });

      newSocket.on('email_updated', (email) => {
        setEmails(prev => prev.map(e => e._id === email._id ? email : e));
      });

      newSocket.on('email_deleted', (emailId) => {
        setEmails(prev => prev.filter(e => e._id !== emailId));
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    } catch (err) {
      console.error('Failed to initialize socket:', err);
      setError('Failed to initialize email service');
    }
  }, []);

  // Fetch emails
  const fetchEmails = useCallback(async (folder = 'INBOX') => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Authentication required');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await emailService.fetchEmails(folder);
      setEmails(data);
    } catch (err) {
      console.error('Failed to fetch emails:', err);
      setError(err.message || 'Failed to fetch emails');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch folders
  const fetchFolders = useCallback(async () => {
    try {
      const data = await emailService.getFolders();
      setFolders(data);
    } catch (err) {
      console.error('Failed to fetch folders:', err);
    }
  }, []);

  // Fetch labels
  const fetchLabels = useCallback(async () => {
    try {
      const data = await emailService.getLabels();
      setLabels(data);
    } catch (err) {
      console.error('Failed to fetch labels:', err);
    }
  }, []);

  // Initial data fetch - runs on mount and when authentication changes
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    console.log('🔍 Authentication detected - fetching email data...');
    fetchEmails(currentFolder);
    fetchFolders();
    fetchLabels();
  }, [currentFolder, fetchEmails, fetchFolders, fetchLabels]); // Re-fetch when folder changes

  // Listen for authentication changes (login/logout across tabs)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'token' || e.key === null) {
        // Token changed or cleared (logout)
        const token = localStorage.getItem('token');
        if (token) {
          console.log('🔄 Authentication state changed - reloading email data...');
          fetchEmails(currentFolder);
          fetchFolders();
          fetchLabels();
        } else {
          // Logged out - clear email data
          setEmails([]);
          setFolders([]);
          setLabels([]);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [currentFolder, fetchEmails, fetchFolders, fetchLabels]);

  // Fetch emails when folder changes
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    fetchEmails(currentFolder);
  }, [currentFolder, fetchEmails]); // Fetch when folder changes

  // Email actions
  const syncEmails = async (folder = 'INBOX') => {
    setSyncing(true);
    try {
      await emailService.syncEmails(folder);
      await fetchEmails(folder);
    } catch (err) {
      console.error('Failed to sync emails:', err);
      throw err;
    } finally {
      setSyncing(false);
    }
  };

  const deleteMultipleEmails = async (emailIds) => {
    try {
      await emailService.deleteMultipleEmails(emailIds);
      setEmails(prev => prev.filter(e => !emailIds.includes(e._id)));
    } catch (err) {
      console.error('Failed to delete emails:', err);
      throw err;
    }
  };

  const markMultipleAsRead = async (emailIds, read = true) => {
    try {
      await emailService.markMultipleAsRead(emailIds, read);
      setEmails(prev => prev.map(e =>
        emailIds.includes(e._id) ? { ...e, isRead: read } : e
      ));
    } catch (err) {
      console.error('Failed to mark emails:', err);
      throw err;
    }
  };

  const toggleStarMultiple = async (emailIds) => {
    try {
      await emailService.toggleStarMultiple(emailIds);
      setEmails(prev => prev.map(e =>
        emailIds.includes(e._id) ? { ...e, isFlagged: !e.isFlagged } : e
      ));
    } catch (err) {
      console.error('Failed to toggle stars:', err);
      throw err;
    }
  };

  const moveToFolder = async (emailIds, folderId) => {
    try {
      await emailService.moveToFolder(emailIds, folderId);
      setEmails(prev => prev.map(e => 
        emailIds.includes(e._id) ? { ...e, folder: folderId } : e
      ));
    } catch (err) {
      console.error('Failed to move emails:', err);
      throw err;
    }
  };

  const addLabelToEmails = async (emailIds, labelId) => {
    try {
      await emailService.addLabelToEmails(emailIds, labelId);
    } catch (err) {
      console.error('Failed to add labels:', err);
      throw err;
    }
  };

  const sendEmail = async (emailData) => {
    try {
      const sentEmail = await emailService.sendEmail(emailData);
      setEmails(prev => [sentEmail, ...prev]);
      return sentEmail;
    } catch (err) {
      console.error('Failed to send email:', err);
      throw err;
    }
  };

  const saveDraft = async (emailData) => {
    try {
      const draft = await emailService.saveDraft(emailData);
      return draft;
    } catch (err) {
      console.error('Failed to save draft:', err);
      throw err;
    }
  };

  const value = {
    emails,
    folders,
    labels,
    currentFolder,
    selectedEmails,
    loading,
    syncing,
    error,
    searchQuery,
    newEmailIds,
    socket,
    setCurrentFolder,
    setSelectedEmails,
    setSearchQuery,
    fetchEmails,
    syncEmails,
    deleteMultipleEmails,
    markMultipleAsRead,
    toggleStarMultiple,
    moveToFolder,
    addLabelToEmails,
    sendEmail,
    saveDraft,
  };

  return (
    <EmailContext.Provider value={value}>
      {children}
    </EmailContext.Provider>
  );
};
