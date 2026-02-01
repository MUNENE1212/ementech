import React from 'react';

interface LoadingIndicatorProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'white' | 'dark' | 'accent';
  className?: string;
  fullScreen?: boolean;
  text?: string;
}

/**
 * LoadingIndicator component for async operations
 * Accessible with proper ARIA attributes
 *
 * @param size - Size of the spinner
 * @param color - Color variant
 * @param className - Additional CSS classes
 * @param fullScreen - Show as full-screen overlay
 * @param text - Optional loading text
 */
export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  size = 'md',
  color = 'primary',
  className = '',
  fullScreen = false,
  text,
}) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const colors = {
    primary: 'border-primary-500',
    white: 'border-white',
    dark: 'border-dark-900',
    accent: 'border-accent-500',
  };

  const spinner = (
    <div className={`inline-block ${sizes[size]} border-2 ${colors[color]} border-t-transparent rounded-full animate-spin ${className}`}
         role="status"
         aria-label="Loading"
         aria-live="polite">
      <span className="sr-only">Loading...</span>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-dark-950/80 backdrop-blur-sm z-50">
        <div className="flex flex-col items-center gap-4">
          {spinner}
          {text && <p className="text-dark-200 text-sm">{text}</p>}
        </div>
      </div>
    );
  }

  if (text) {
    return (
      <div className="flex flex-col items-center gap-4">
        {spinner}
        <p className="text-dark-200 text-sm">{text}</p>
      </div>
    );
  }

  return spinner;
};
