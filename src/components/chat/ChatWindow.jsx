import React, { useState, useRef, useEffect } from 'react';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import QuickActions from './QuickActions';

/**
 * ChatWindow Component
 * Main chat interface with message list and input
 */
const ChatWindow = ({ isOpen, onClose, chatState }) => {
  const { messages, isTyping, error, suggestions, messagesEndRef, sendMessage, sendSuggestion } = chatState;
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef(null);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!inputValue.trim()) return;

    const messageToSend = inputValue;
    setInputValue('');
    sendMessage(messageToSend);
  };

  const handleSuggestionClick = (suggestion) => {
    sendSuggestion(suggestion);
  };

  if (!isOpen) return null;

  const greenTheme = {
    primary: '#10B981',
    light: '#34D399',
    dark: '#059669',
    glow: 'rgba(16, 185, 129, 0.3)'
  };

  return (
    <div
      className="fixed bottom-24 right-6 w-full max-w-md h-[600px] rounded-2xl flex flex-col z-50 overflow-hidden animate-in slide-in-from-bottom-4 duration-300"
      style={{
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.25), rgba(255, 255, 255, 0.1))',
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        border: '1px solid rgba(255, 255, 255, 0.18)',
        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        backgroundClip: 'padding-box'
      }}
    >
      {/* Header - Transparent */}
      <div
        className="text-white px-6 py-4 flex items-center justify-between relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${greenTheme.light}, ${greenTheme.primary}, ${greenTheme.dark})`,
          opacity: 0.95
        }}
      >
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-white/10 rounded-full blur-2xl animate-pulse" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="flex items-center space-x-3 relative z-10">
          {/* AI Avatar */}
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.3), rgba(255,255,255,0.1))',
              backdropFilter: 'blur(10px)',
              border: '2px solid rgba(255,255,255,0.2)'
            }}
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>

          <div>
            <h3 className="font-semibold text-lg">EmenTech AI Assistant</h3>
            <p className="text-sm text-white/90">Here to help you explore our services</p>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/10 rounded-full transition-colors relative z-10"
          aria-label="Close chat"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages Area - Transparent with better contrast */}
      <div
        className="flex-1 overflow-y-auto"
        style={{
          background: 'linear-gradient(to bottom, rgba(249, 250, 251, 0.4), rgba(243, 244, 246, 0.6))'
        }}
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full px-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Start a conversation
              </h4>
              <p className="text-sm text-gray-700 font-medium">
                Ask us about our services, pricing, or schedule a consultation
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              // Calculate fade based on message position (older = more faded)
              const totalMessages = messages.length;
              const messageAge = totalMessages - index;
              const opacity = messageAge === 1 ? 1 : Math.max(0.35, 1 - (messageAge - 1) * 0.15);

              return (
                <div key={index} style={{ opacity, transition: 'opacity 0.3s ease' }}>
                  <MessageBubble message={message} />
                </div>
              );
            })}

            {isTyping && <TypingIndicator />}

            {error && (
              <div className="px-4 py-2">
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Quick Actions */}
      {messages.length > 0 && suggestions.length > 0 && !isTyping && (
        <QuickActions
          actions={suggestions}
          onSelect={handleSuggestionClick}
          disabled={isTyping}
        />
      )}

      {/* Input Area - Glassmorphism with better contrast */}
      <form
        onSubmit={handleSubmit}
        className="px-4 py-4"
        style={{
          background: 'linear-gradient(to top, rgba(255, 255, 255, 0.9), rgba(249, 250, 251, 0.85))',
          borderTop: '1px solid rgba(209, 213, 219, 0.5)',
          backdropFilter: 'blur(10px)'
        }}
      >
        <div className="flex items-end space-x-2">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="Type your message..."
              rows={1}
              className="w-full px-4 py-3 bg-white/90 border-2 border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 text-sm transition-all text-gray-900 placeholder-gray-500"
              style={{
                minHeight: '48px',
                maxHeight: '120px',
                focusRingColor: greenTheme.primary,
                backdropFilter: 'blur(10px)'
              }}
              onFocus={(e) => {
                e.target.style.boxShadow = `0 0 0 3px ${greenTheme.glow}`;
                e.target.style.borderColor = greenTheme.primary;
              }}
              onBlur={(e) => {
                e.target.style.boxShadow = 'none';
                e.target.style.borderColor = 'rgb(229, 231, 235)';
              }}
              disabled={isTyping}
            />
          </div>

          <button
            type="submit"
            disabled={!inputValue.trim() || isTyping}
            className={`
              p-3 rounded-xl transition-all duration-200 flex items-center justify-center
              ${!inputValue.trim() || isTyping
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'hover:shadow-lg hover:scale-105'
              }
            `}
            style={!inputValue.trim() || isTyping ? {} : {
              background: `linear-gradient(135deg, ${greenTheme.light}, ${greenTheme.primary}, ${greenTheme.dark})`,
              color: 'white'
            }}
            aria-label="Send message"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-2 text-center">
          Powered by AI. Your conversation helps us serve you better.
        </p>
      </form>
    </div>
  );
};

export default ChatWindow;
