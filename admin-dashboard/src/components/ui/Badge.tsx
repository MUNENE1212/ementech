/**
 * Badge Component
 * Status and label badges
 */

import React from 'react';

export type BadgeVariant =
  | 'default'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'gray';

export type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-800',
  primary: 'bg-primary-100 text-primary-800',
  success: 'bg-accent-100 text-accent-800',
  warning: 'bg-gold-100 text-gold-800',
  danger: 'bg-red-100 text-red-800',
  info: 'bg-blue-100 text-blue-800',
  gray: 'bg-gray-200 text-gray-700',
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
}) => {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${variantClasses[variant]} ${sizeClasses[size]}`}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full bg-current`}
        />
      )}
      {children}
    </span>
  );
};

// Status badge mapping for common statuses
interface StatusBadgeProps {
  status: string;
  size?: BadgeSize;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm', className: _className }) => {
  const statusMap: Record<string, BadgeVariant> = {
    // Lead statuses
    new: 'info',
    contacted: 'primary',
    qualified: 'success',
    proposal: 'warning',
    negotiation: 'warning',
    won: 'success',
    lost: 'danger',

    // Campaign/Sequence statuses
    draft: 'gray',
    scheduled: 'info',
    sending: 'primary',
    sent: 'success',
    active: 'success',
    paused: 'warning',
    cancelled: 'danger',
    failed: 'danger',
    archived: 'gray',

    // A/B test statuses
    running: 'primary',
    completed: 'success',

    // Social post statuses
    published: 'success',
    publishing: 'primary',
    deleted: 'gray',

    // Social account statuses
    inactive: 'gray',
    error: 'danger',
    needs_reauth: 'warning',

    // User statuses
    pending: 'warning',
  };

  const variant = statusMap[status.toLowerCase()] || 'default';

  return (
    <Badge variant={variant} size={size}>
      {status}
    </Badge>
  );
};
