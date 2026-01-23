import React from 'react';
import { formatDistanceToNow } from 'date-fns';

/**
 * MessageBubble Component
 * Displays individual chat messages
 */
const MessageBubble = ({ message }) => {
  const isUser = message.role === 'user';
  const isAI = message.role === 'assistant';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} px-4 py-2`}>
      {/* AI Avatar */}
      {isAI && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mr-3">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
      )}

      {/* Message Content */}
      <div className={`max-w-[80%] ${isUser ? 'order-2' : 'order-1'}`}>
        <div
          className={`px-4 py-3 rounded-2xl ${
            isUser
              ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-tr-sm shadow-md'
              : 'bg-white text-gray-900 rounded-tl-sm shadow-md border border-gray-200'
          }`}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words font-medium">
            {message.content}
          </p>

          {/* Timestamp */}
          {message.timestamp && (
            <div
              className={`text-xs mt-1 ${
                isUser ? 'text-blue-100' : 'text-gray-500'
              }`}
            >
              {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
            </div>
          )}
        </div>
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center ml-3 order-1">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
      )}
    </div>
  );
};

export default MessageBubble;
