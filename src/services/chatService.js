import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Chat Service
 * Handles all API calls related to the AI chatbot
 */

export const chatService = {
  /**
   * Send a message to the AI chatbot
   */
  sendMessage: async (message, conversationId = null) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/chat/`, {
        message,
        conversationId
      });

      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  /**
   * Get conversation history
   */
  getConversation: async (conversationId) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/chat/conversations/${conversationId}`
      );

      return response.data;
    } catch (error) {
      console.error('Error getting conversation:', error);
      throw error;
    }
  },

  /**
   * Get chatbot statistics (admin)
   */
  getStatistics: async (params = {}) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/chat/statistics`, {
        params
      });

      return response.data;
    } catch (error) {
      console.error('Error getting statistics:', error);
      throw error;
    }
  }
};

export default chatService;
