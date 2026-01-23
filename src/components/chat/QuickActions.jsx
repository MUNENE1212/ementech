import React from 'react';

/**
 * QuickActions Component
 * Displays conversation starter chips
 */
const QuickActions = ({ actions, onSelect, disabled = false }) => {
  if (!actions || actions.length === 0) return null;

  return (
    <div className="px-4 py-3 space-y-2">
      <p className="text-xs text-gray-500 font-medium">Quick actions:</p>
      <div className="flex flex-wrap gap-2">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={() => onSelect(action)}
            disabled={disabled}
            className={`
              px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
              ${disabled
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100 hover:shadow-md cursor-pointer'
              }
              border border-blue-200
            `}
          >
            {action}
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;
