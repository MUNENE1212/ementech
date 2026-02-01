import React from 'react';

interface BentoItem {
  id: string;
  content: React.ReactNode;
  span?: 'row-span-2' | 'col-span-2' | 'row-span-2 col-span-2' | 'row-span-2 md:row-span-1 md:col-span-2';
  className?: string;
}

interface BentoGridProps {
  items: BentoItem[];
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}

/**
 * BentoGrid component for feature showcases
 * Supports asymmetric layouts with row/column spanning
 * Fully responsive grid system
 *
 * @param items - Array of bento items to display
 * @param columns - Number of columns (responsive)
 * @param className - Additional CSS classes
 */
export const BentoGrid: React.FC<BentoGridProps> = ({ items, columns = 3, className = '' }) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-6 ${className}`}>
      {items.map((item) => (
        <div
          key={item.id}
          className={`${item.span || ''} ${item.className || ''}`}
        >
          {item.content}
        </div>
      ))}
    </div>
  );
};
