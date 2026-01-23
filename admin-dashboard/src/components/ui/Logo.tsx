/**
 * Logo Component
 * EmenTech logo
 */

import React from 'react';

interface LogoProps {
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ className = '' }) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-accent-500 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
        E
      </div>
      <span className="text-2xl font-bold text-gray-900">EmenTech</span>
    </div>
  );
};
