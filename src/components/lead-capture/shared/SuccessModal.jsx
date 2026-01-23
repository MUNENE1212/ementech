/**
 * Success Modal Component
 * Animated success state for lead capture conversions
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';

const SuccessModal = ({
  isOpen,
  onClose,
  title = 'Success!',
  message,
  icon: Icon = Check,
  showCloseButton = true,
  autoCloseDelay = 3000,
}) => {
  React.useEffect(() => {
    if (isOpen && autoCloseDelay > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);

      return () => clearTimeout(timer);
    }
  }, [isOpen, autoCloseDelay, onClose]);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', duration: 0.5 }}
        className="relative max-w-md w-full bg-dark-900 border border-dark-800 rounded-2xl shadow-2xl p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {showCloseButton && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        )}

        <div className="flex flex-col items-center text-center space-y-4">
          {/* Animated Success Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-accent-500/20 rounded-full blur-xl animate-pulse" />
            <div className="relative bg-gradient-to-br from-accent-500 to-accent-600 rounded-full p-4">
              <Icon size={32} className="text-white" />
            </div>
          </motion.div>

          {/* Title */}
          <motion.h3
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-bold text-white"
          >
            {title}
          </motion.h3>

          {/* Message */}
          {message && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-gray-400"
            >
              {message}
            </motion.p>
          )}

          {/* Confetti Animation (Simple) */}
          <motion.div
            className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  backgroundColor: ['#3b82f6', '#f59e0b', '#10b981'][i % 3],
                  left: `${20 + i * 15}%`,
                  top: '20%',
                }}
                animate={{
                  y: [0, -100, -150],
                  x: [0, (i - 2.5) * 20],
                  opacity: [1, 0.5, 0],
                  rotate: [0, 360],
                }}
                transition={{
                  duration: 1.5,
                  delay: 0.5 + i * 0.1,
                  ease: 'easeOut',
                }}
              />
            ))}
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SuccessModal;
