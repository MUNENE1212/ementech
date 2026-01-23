import { useState, useCallback, useEffect, useRef } from 'react';
import { chatService } from '../services/chatService';

/**
 * Custom hook for AI Chatbot functionality
 * Manages chat state and message handling
 */
export const useChat = (initialConversationId = null) => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState(initialConversationId);
  const [error, setError] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const messagesEndRef = useRef(null);

  /**
   * Scroll to bottom of messages
   */
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  /**
   * Load conversation history
   */
  const loadConversation = useCallback(async (convId) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await chatService.getConversation(convId);

      if (response.success) {
        setMessages(response.data.messages);
        setConversationId(convId);
      }
    } catch (err) {
      console.error('Error loading conversation:', err);
      setError('Failed to load conversation');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Send message to AI
   */
  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || isLoading) return;

    // Add user message to local state immediately
    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setIsTyping(true);
    setError(null);

    try {
      const response = await chatService.sendMessage(text, conversationId);

      if (response.success) {
        const { response: aiResponse, conversationId: newConvId, suggestions: newSuggestions } = response.data;

        // Update conversation ID if this is a new conversation
        if (newConvId && newConvId !== conversationId) {
          setConversationId(newConvId);
        }

        // Add AI response
        const aiMessage = {
          id: Date.now() + 1,
          role: 'assistant',
          content: aiResponse,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, aiMessage]);
        setSuggestions(newSuggestions || []);
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');

      // Remove user message if failed
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  }, [conversationId, isLoading]);

  /**
   * Send a quick action/suggestion
   */
  const sendSuggestion = useCallback((suggestion) => {
    sendMessage(suggestion);
  }, [sendMessage]);

  /**
   * Clear all messages
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
    setConversationId(null);
    setSuggestions([]);
    setError(null);
  }, []);

  /**
   * Retry failed message
   */
  const retryMessage = useCallback((messageText) => {
    sendMessage(messageText);
  }, [sendMessage]);

  return {
    messages,
    isLoading,
    isTyping,
    error,
    conversationId,
    suggestions,
    messagesEndRef,
    sendMessage,
    sendSuggestion,
    loadConversation,
    clearMessages,
    retryMessage
  };
};

export default useChat;
