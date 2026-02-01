import React from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface CardProps {
  children: React.ReactNode;
  hover?: boolean;
  className?: string;
  onClick?: () => void;
  variant?: 'default' | 'glass' | 'elevated';
  focusable?: boolean;
}

/**
 * Card component with hover effects and glass-morphism
 * Fully accessible with keyboard navigation support
 * Respects prefers-reduced-motion
 *
 * @param hover - Enable hover lift effect
 * @param onClick - Make card clickable
 * @param variant - Visual style variant
 * @param focusable - Show focus indicator when tabbing
 */
export const Card: React.FC<CardProps> = ({
  children,
  hover = true,
  className = '',
  onClick,
  variant = 'default',
  focusable = true,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const CardComponent = hover ? motion.div : 'div';

  const variants = {
    default: 'bg-dark-900 rounded-xl border border-dark-800 p-6',
    glass: 'bg-dark-900/50 backdrop-blur-sm rounded-xl border border-dark-800/50 p-6',
    elevated: 'bg-dark-900 rounded-xl border border-dark-800 p-6 shadow-xl',
  };

  const baseClasses = `${variants[variant]} ${className}`;

  const hoverProps = hover && !prefersReducedMotion ? {
    whileHover: { y: -4, boxShadow: '0 20px 40px rgba(0,0,0,0.3)' },
    transition: { duration: 0.2 },
  } : {};

  const interactiveProps = onClick ? {
    role: 'button' as const,
    tabIndex: focusable ? 0 : undefined,
    onClick,
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick();
      }
    },
    className: `${baseClasses} cursor-pointer ${focusable ? 'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-950' : ''}`,
  } : {
    className: baseClasses,
  };

  return (
    <CardComponent
      {...hoverProps}
      {...interactiveProps}
    >
      {children}
    </CardComponent>
  );
};
