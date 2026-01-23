import React, { useState } from 'react';
import ChatButton from './ChatButton';
import ChatWindow from './ChatWindow';
import { useChat } from '../../hooks/useChat';

/**
 * AIChatbot Component
 * Main orchestrator for the AI chatbot
 * Manages chat button and window visibility
 */
const AIChatbot = ({ initialConversationId = null }) => {
  const [isOpen, setIsOpen] = useState(false);

  const chatState = useChat(initialConversationId);

  const toggleChat = () => {
    setIsOpen(prev => !prev);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <>
      <ChatButton
        isOpen={isOpen}
        onClick={toggleChat}
        unreadCount={isOpen ? 0 : (chatState.messages.length === 0 ? 1 : 0)}
      />

      <ChatWindow
        isOpen={isOpen}
        onClose={handleClose}
        chatState={chatState}
      />
    </>
  );
};

export default AIChatbot;
