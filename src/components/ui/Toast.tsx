import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  onClose: () => void;
  className?: string;
}

/**
 * Toast notification component
 * Auto-dismisses after duration
 * Accessible with ARIA live region
 *
 * @param message - Toast message
 * @param type - Toast type
 * @param duration - Auto-dismiss duration in ms
 * @param onClose - Close callback
 * @param className - Additional CSS classes
 */
export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'info',
  duration = 5000,
  onClose,
  className = '',
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-accent-500" aria-hidden="true" />,
    error: <AlertCircle className="w-5 h-5 text-red-500" aria-hidden="true" />,
    info: <Info className="w-5 h-5 text-primary-500" aria-hidden="true" />,
  };

  const bgColors = {
    success: 'bg-accent-500/10 border-accent-500/50',
    error: 'bg-red-500/10 border-red-500/50',
    info: 'bg-primary-500/10 border-primary-500/50',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, x: '-50%' }}
      animate={{ opacity: 1, y: 0, x: '-50%' }}
      exit={{ opacity: 0, y: 20, x: '-50%' }}
      transition={{ duration: 0.3 }}
      className={`fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-4 rounded-lg border backdrop-blur-sm shadow-xl max-w-md ${bgColors[type]} ${className}`}
      role="alert"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="flex-shrink-0">
        {icons[type]}
      </div>
      <p className="flex-1 text-sm font-medium text-white">{message}</p>
      <button
        onClick={onClose}
        className="flex-shrink-0 text-dark-400 hover:text-white transition-colors"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
};

interface ToastContainerProps {
  toasts: Array<{ id: string; message: string; type?: 'success' | 'error' | 'info' }>;
  onRemove: (id: string) => void;
  className?: string;
}

/**
 * Container for multiple toasts
 */
export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onRemove,
  className = '',
}) => {
  return (
    <div className={`fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 space-y-2 ${className}`}>
      <AnimatePresence>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => onRemove(toast.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};
