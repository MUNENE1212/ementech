import React from 'react';

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  fullWidth?: boolean;
  padding?: 'sm' | 'md' | 'lg';
  ariaLabelledby?: string;
}

/**
 * Section component with consistent spacing
 * Follows 8-point grid spacing system
 * Mobile: 64px, Desktop: 80-128px
 *
 * @param children - Section content
 * @param className - Additional CSS classes
 * @param id - Section ID for navigation
 * @param fullWidth - Remove horizontal padding
 * @param padding - Vertical padding size
 * @param ariaLabelledby - ARIA label reference
 */
export const Section: React.FC<SectionProps> = ({
  children,
  className = '',
  id,
  fullWidth = false,
  padding = 'lg',
  ariaLabelledby,
}) => {
  const paddings = {
    sm: 'py-16', // 64px
    md: 'py-20', // 80px
    lg: 'py-32', // 128px - within 80-120px range
  };

  return (
    <section
      id={id}
      className={`${paddings[padding]} ${fullWidth ? '' : 'px-4'} ${className}`}
      aria-labelledby={ariaLabelledby}
    >
      {children}
    </section>
  );
};
