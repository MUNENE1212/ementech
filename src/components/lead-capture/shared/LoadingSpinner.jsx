/**
 * Loading Spinner Component
 * Elegant loading animation for lead capture forms
 */

import React from 'react';
import { motion } from 'framer-motion';

const LoadingSpinner = ({ size = 'medium', text = 'Processing...' }) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12',
  };

  const dotSize = {
    small: 'w-1 h-1',
    medium: 'w-2 h-2',
    large: 'w-3 h-3',
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-3 py-4">
      <div className="relative">
        <motion.div
          className={`sizeClasses[size] rounded-full border-2 border-primary-500/30`}
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          <motion.div
            className={`absolute top-0 left-0 ${dotSize[size]} rounded-full bg-primary-500`}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </motion.div>
      </div>

      {text && (
        <motion.p
          className="text-sm text-gray-400"
          animate={{
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {text}
        </motion.p>
      )}
    </div>
  );
};

export default LoadingSpinner;
