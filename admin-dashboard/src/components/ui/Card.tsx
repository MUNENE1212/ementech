/**
 * Card Component
 * Reusable card container component
 */

import React, { HTMLAttributes, forwardRef } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'bordered' | 'elevated' | 'flat';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

const variantClasses = {
  default: 'bg-white rounded-xl border border-gray-200',
  bordered: 'bg-white rounded-xl border-2 border-gray-300',
  elevated: 'bg-white rounded-xl shadow-lg border-0',
  flat: 'bg-white rounded-xl border-0 shadow-none',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'default', padding = 'md', hover = false, className = '', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`${variantClasses[variant]} ${paddingClasses[padding]} ${hover ? 'hover:shadow-md transition-shadow duration-200' : ''} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

interface CardHeaderProps {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ title, subtitle, action }) => {
  return (
    <div className="flex items-start justify-between mb-4">
      <div>
        {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};

interface CardStatsProps {
  title: string;
  value: string | number;
  change?: number;
  icon?: React.ReactNode;
  prefix?: string;
  suffix?: string;
}

export const CardStats: React.FC<CardStatsProps> = ({ title, value, change, icon, prefix = '', suffix = '' }) => {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {prefix}
            {typeof value === 'number' ? value.toLocaleString() : value}
            {suffix}
          </p>
          {change !== undefined && (
            <p className={`text-sm mt-2 flex items-center gap-1 ${isPositive ? 'text-accent-600' : isNegative ? 'text-red-600' : 'text-gray-500'}`}>
              {isPositive && '↑'}
              {isNegative && '↓'}
              {Math.abs(change)}%
              <span className="text-gray-500 ml-1">vs last period</span>
            </p>
          )}
        </div>
        {icon && <div className="text-gray-400">{icon}</div>}
      </div>
    </div>
  );
};
