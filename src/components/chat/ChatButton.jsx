import React from 'react';
import { MessageCircle, X, Bot } from 'lucide-react';

/**
 * ChatButton Component
 * Floating button to open/close the chat with beautiful green theme
 */
const ChatButton = ({ isOpen, onClick, unreadCount = 0 }) => {
  const greenTheme = {
    primary: '#10B981',
    light: '#34D399',
    dark: '#059669',
    glow: 'rgba(16, 185, 129, 0.5)'
  };

  return (
    <button
      onClick={onClick}
      className={`
        fixed bottom-6 right-6 w-16 h-16 rounded-full
        text-white
        flex items-center justify-center
        transition-all duration-300
        z-50 group
        ${isOpen ? 'rotate-90' : ''}
      `}
      style={{
        background: isOpen
          ? `linear-gradient(135deg, ${greenTheme.dark}, ${greenTheme.primary})`
          : `linear-gradient(135deg, ${greenTheme.light}, ${greenTheme.primary}, ${greenTheme.dark})`,
        boxShadow: isOpen
          ? `0 0 0 0 ${greenTheme.glow}`
          : `0 8px 24px ${greenTheme.glow}, 0 0 0 0 ${greenTheme.glow}`,
      }}
      onMouseEnter={(e) => {
        if (!isOpen) {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.boxShadow = `0 12px 32px ${greenTheme.glow}, 0 0 0 4px ${greenTheme.glow}`;
        }
      }}
      onMouseLeave={(e) => {
        if (!isOpen) {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = `0 8px 24px ${greenTheme.glow}, 0 0 0 0 ${greenTheme.glow}`;
        }
      }}
      aria-label={isOpen ? 'Close chat' : 'Open chat'}
    >
      {isOpen ? (
        <X size={28} strokeWidth={2.5} />
      ) : (
        <Bot size={28} strokeWidth={2.5} className="animate-pulse-slow" />
      )}

      {/* Pulsing ring effect when closed */}
      {!isOpen && (
        <span
          className="absolute inset-0 rounded-full animate-ping-slow opacity-75"
          style={{
            background: `linear-gradient(135deg, ${greenTheme.light}, ${greenTheme.primary})`,
          }}
        />
      )}

      {/* Unread Badge */}
      {unreadCount > 0 && !isOpen && (
        <span
          className="absolute -top-1 -right-1 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center animate-bounce shadow-lg"
          style={{
            background: 'linear-gradient(135deg, #EF4444, #DC2626)',
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.5)'
          }}
        >
          {unreadCount}
        </span>
      )}

      {/* Tooltip */}
      {!isOpen && (
        <div className="absolute right-full mr-4 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl">
          Need help? Chat with us!
          <div className="absolute left-full top-1/2 -translate-y-1/2 -ml-1">
            <div
              className="border-8 border-transparent border-r-gray-900"
              style={{ filter: 'drop-shadow(-2px 0 2px rgba(0,0,0,0.1))' }}
            />
          </div>
        </div>
      )}
    </button>
  );
};

export default ChatButton;
