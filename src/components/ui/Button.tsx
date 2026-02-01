import React from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

/**
 * Button component with multiple variants and states
 * Follows WCAG 2.2 AA accessibility standards
 * Touch target minimum 48x48px
 * Respects prefers-reduced-motion
 *
 * @param variant - Visual style variant
 * @param size - Button size (sm, md, lg)
 * @param isLoading - Show loading spinner
 * @param fullWidth - Expand to full width
 * @param leftIcon - Icon before text
 * @param rightIcon - Icon after text
 */
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const prefersReducedMotion = useReducedMotion();

  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-950 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-500 active:bg-primary-700 shadow-lg shadow-primary-500/20',
    secondary: 'bg-dark-800 text-white border-2 border-dark-700 hover:bg-dark-700 focus:ring-dark-700 active:bg-dark-600',
    outline: 'bg-transparent text-primary-500 border-2 border-primary-500 hover:bg-primary-50 focus:ring-primary-500 active:bg-primary-100',
    ghost: 'bg-transparent text-primary-500 hover:bg-primary-50 focus:ring-primary-500 active:bg-primary-100',
    danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500 active:bg-red-700 shadow-lg shadow-red-500/20',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm min-h-[40px]',
    md: 'px-6 py-3 text-base min-h-[48px]', // 48px touch target
    lg: 'px-8 py-4 text-lg min-h-[52px]',
  };

  const hoverProps = prefersReducedMotion ? {} : {
    whileHover: { scale: disabled || isLoading ? 1 : 1.02 },
    whileTap: { scale: disabled || isLoading ? 1 : 0.98 },
    transition: { duration: 0.15 },
  };

  return (
    <motion.button
      {...hoverProps}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      type={props.type}
      form={props.form}
      name={props.name}
      value={props.value}
      onClick={props.onClick}
      onMouseDown={props.onMouseDown}
      onMouseUp={props.onMouseUp}
    >
      {isLoading ? (
        <>
          <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
          <span className="sr-only">Loading...</span>
        </>
      ) : null}
      {!isLoading && leftIcon ? <span className="mr-2" aria-hidden="true">{leftIcon}</span> : null}
      {children}
      {!isLoading && rightIcon ? <span className="ml-2" aria-hidden="true">{rightIcon}</span> : null}
    </motion.button>
  );
};
