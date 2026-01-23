/**
 * Lead Context
 * Global state management for lead data and progressive profiling
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  getLeadProfile,
  updateLeadProfile,
  trackInteraction,
  inferCompanyFromEmail,
} from '../services/leadService';

const LeadContext = createContext(null);

export const useLead = () => {
  const context = useContext(LeadContext);
  if (!context) {
    throw new Error('useLead must be used within a LeadProvider');
  }
  return context;
};

export const LeadProvider = ({ children }) => {
  const [leadData, setLeadData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progressiveLevel, setProgressiveLevel] = useState(1); // 1: email, 2: name, 3: company
  const [identifiedEmail, setIdentifiedEmail] = useState(null);

  // Load lead data from localStorage on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('ementech_lead_email');
    const savedLevel = localStorage.getItem('ementech_lead_level');
    const savedData = localStorage.getItem('ementech_lead_data');

    if (savedEmail) {
      setIdentifiedEmail(savedEmail);
      setProgressiveLevel(savedLevel ? parseInt(savedLevel) : 1);

      if (savedData) {
        try {
          setLeadData(JSON.parse(savedData));
        } catch (e) {
          console.error('Error parsing saved lead data:', e);
        }
      }
    }
  }, []);

  /**
   * Save lead data to state and localStorage
   */
  const saveLeadData = useCallback((data) => {
    setLeadData(data);
    localStorage.setItem('ementech_lead_data', JSON.stringify(data));
  }, []);

  /**
   * Initialize lead with email
   */
  const initializeLead = useCallback(async (email) => {
    if (!email) return { success: false, error: 'Email is required' };

    setIsLoading(true);
    setError(null);

    try {
      // Check if lead already exists
      const existingProfile = await getLeadProfile(email);

      let profileData = {
        email,
        createdAt: new Date().toISOString(),
        interactions: [],
      };

      if (existingProfile) {
        profileData = { ...profileData, ...existingProfile };
        const savedLevel = localStorage.getItem('ementech_lead_level');
        setProgressiveLevel(savedLevel ? parseInt(savedLevel) : 2);
      } else {
        // New lead - infer company from email
        const inferredCompany = inferCompanyFromEmail(email);
        if (inferredCompany) {
          profileData.company = inferredCompany;
        }
      }

      saveLeadData(profileData);
      setIdentifiedEmail(email);
      localStorage.setItem('ementech_lead_email', email);

      setIsLoading(false);
      return { success: true, data: profileData };
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
      return { success: false, error: err.message };
    }
  }, [saveLeadData]);

  /**
   * Update lead profile progressively
   */
  const updateProfile = useCallback(async (additionalData) => {
    if (!identifiedEmail) {
      return { success: false, error: 'No lead identified' };
    }

    setIsLoading(true);
    setError(null);

    try {
      // Update local state
      const updatedData = {
        ...leadData,
        ...additionalData,
        updatedAt: new Date().toISOString(),
      };

      saveLeadData(updatedData);

      // Update server
      const result = await updateLeadProfile(identifiedEmail, additionalData);

      // Increase progressive level if adding new data
      if (additionalData.name && progressiveLevel < 2) {
        setProgressiveLevel(2);
        localStorage.setItem('ementech_lead_level', '2');
      }
      if (additionalData.company && progressiveLevel < 3) {
        setProgressiveLevel(3);
        localStorage.setItem('ementech_lead_level', '3');
      }

      setIsLoading(false);
      return { success: true, data: updatedData };
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
      return { success: false, error: err.message };
    }
  }, [identifiedEmail, leadData, saveLeadData, progressiveLevel]);

  /**
   * Track user interaction
   */
  const trackEvent = useCallback(async (action, metadata = {}) => {
    if (!identifiedEmail) {
      return { success: true }; // Don't track if not identified
    }

    try {
      // Update local interaction history
      const newInteraction = {
        action,
        metadata,
        timestamp: new Date().toISOString(),
      };

      const updatedData = {
        ...leadData,
        interactions: [...(leadData?.interactions || []), newInteraction],
      };

      saveLeadData(updatedData);

      // Send to server (non-blocking)
      trackInteraction({
        email: identifiedEmail,
        action,
        metadata,
      });

      return { success: true };
    } catch (err) {
      console.error('Tracking error:', err);
      return { success: true }; // Don't fail on tracking errors
    }
  }, [identifiedEmail, leadData, saveLeadData]);

  /**
   * Check if lead has provided specific data
   */
  const hasData = useCallback((field) => {
    return leadData && leadData[field] && leadData[field].trim() !== '';
  }, [leadData]);

  /**
   * Get lead's current progressive level
   */
  const getProgressiveLevel = useCallback(() => {
    return progressiveLevel;
  }, [progressiveLevel]);

  /**
   * Clear lead data (GDPR right to deletion)
   */
  const clearLeadData = useCallback(() => {
    setLeadData(null);
    setIdentifiedEmail(null);
    setProgressiveLevel(1);
    setError(null);
    localStorage.removeItem('ementech_lead_email');
    localStorage.removeItem('ementech_lead_level');
    localStorage.removeItem('ementech_lead_data');
  }, []);

  const value = {
    leadData,
    isLoading,
    error,
    identifiedEmail,
    progressiveLevel,
    initializeLead,
    updateProfile,
    trackEvent,
    hasData,
    getProgressiveLevel,
    clearLeadData,
  };

  return <LeadContext.Provider value={value}>{children}</LeadContext.Provider>;
};

export default LeadContext;
