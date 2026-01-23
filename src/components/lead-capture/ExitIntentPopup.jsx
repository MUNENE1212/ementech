/**
 * Exit Intent Popup Component
 * Captures leads when users show exit intent
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gift, Sparkles, BookOpen } from 'lucide-react';
import { saveExitIntent } from '../../services/leadService';
import { useLead } from '../../contexts/LeadContext';
import LeadForm from './shared/LeadForm';

const ExitIntentPopup = ({
  offers = [
    {
      id: 'ai-guide',
      title: 'Wait! Don\'t Miss This Free Guide',
      description: 'Get our AI Implementation Checklist - 50 essential checks before deploying AI',
      value: '$199 value',
      icon: BookOpen,
      cta: 'Send Me the Checklist',
    },
  ],
  delay = 1000, // Delay before showing exit intent (ms)
  showOncePerSession = true,
  excludePaths = ['/login', '/register', '/dashboard'],
}) => {
  const { initializeLead, updateProfile, trackEvent } = useLead();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(offers[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState(null);
  const hasShownRef = useRef(false);
  const mouseLeftRef = useRef(false);

  // Check if current path should be excluded
  const shouldExclude = () => {
    const currentPath = window.location.pathname;
    return excludePaths.some((path) => currentPath.startsWith(path));
  };

  // Check if already shown this session
  const checkAlreadyShown = () => {
    if (!showOncePerSession) return false;
    return sessionStorage.getItem('ementech_exit_intent_shown') === 'true';
  };

  // Mark as shown
  const markAsShown = () => {
    if (showOncePerSession) {
      sessionStorage.setItem('ementech_exit_intent_shown', 'true');
    }
  };

  // Handle mouse leave (exit intent)
  const handleMouseLeave = (e) => {
    // Check if mouse left from top of viewport
    if (e.clientY <= 0 && !mouseLeftRef.current) {
      mouseLeftRef.current = true;

      // Delay slightly to avoid false positives
      setTimeout(() => {
        if (
          !hasShownRef.current &&
          !checkAlreadyShown() &&
          !shouldExclude() &&
          !isOpen
        ) {
          setIsOpen(true);
          hasShownRef.current = true;
          markAsShown();
        }
        mouseLeftRef.current = false;
      }, delay);
    }
  };

  // Setup event listeners
  useEffect(() => {
    if (typeof window === 'undefined') return;

    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseout', handleMouseLeave);

    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseout', handleMouseLeave);
    };
  }, [delay]);

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleSubmit = async (formData) => {
    setIsLoading(true);
    setError(null);

    try {
      // Initialize/update lead
      await initializeLead(formData.email);

      // Update profile if name provided
      if (formData.name) {
        await updateProfile({ name: formData.name });
      }

      // Save exit intent capture
      await saveExitIntent({
        email: formData.email,
        name: formData.name,
        offer: selectedOffer.id,
        consent: true,
        source: 'exit-intent-popup',
      });

      // Track the event
      await trackEvent('exit_intent_capture', {
        offer: selectedOffer.id,
        offerName: selectedOffer.title,
      });

      setShowSuccess(true);

      // Auto-close after success
      setTimeout(() => {
        handleClose();
      }, 3000);
    } catch (err) {
      console.error('Exit intent capture error:', err);
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const OfferIcon = selectedOffer.icon || Gift;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="relative max-w-lg w-full pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={handleClose}
                className="absolute -top-4 -right-4 p-2 bg-dark-800 hover:bg-dark-700 rounded-full text-gray-400 hover:text-white transition-all z-10 shadow-lg"
                aria-label="Close"
              >
                <X size={20} />
              </button>

              <div className="bg-dark-900 border-2 border-gold-500/50 rounded-2xl overflow-hidden shadow-2xl">
                {/* Header with Gradient */}
                <div className="relative bg-gradient-to-br from-primary-600 via-gold-500 to-accent-600 p-6 sm:p-8">
                  {/* Animated Background Elements */}
                  <div className="absolute inset-0 overflow-hidden">
                    <motion.div
                      className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"
                      animate={{
                        scale: [1, 1.2, 1],
                        x: [0, 10, 0],
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    />
                    <motion.div
                      className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-xl"
                      animate={{
                        scale: [1, 1.3, 1],
                        y: [0, -10, 0],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    />
                  </div>

                  {/* Content */}
                  <div className="relative">
                    <motion.div
                      initial={{ rotate: 0 }}
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                      className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl mb-4"
                    >
                      <OfferIcon size={32} className="text-white" />
                    </motion.div>

                    <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                      {selectedOffer.title}
                    </h2>

                    {selectedOffer.value && (
                      <div className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm text-white font-medium mb-3">
                        {selectedOffer.value}
                      </div>
                    )}

                    <p className="text-white/90 text-sm sm:text-base">
                      {selectedOffer.description}
                    </p>
                  </div>
                </div>

                {/* Form Section */}
                <div className="p-6 sm:p-8">
                  <AnimatePresence mode="wait">
                    {!showSuccess ? (
                      <motion.div
                        key="form"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="space-y-6"
                      >
                        <div className="text-center mb-6">
                          <div className="flex items-center justify-center space-x-2 text-gold-400 mb-2">
                            <Sparkles size={16} />
                            <span className="text-sm font-medium">
                              Limited Time Offer
                            </span>
                          </div>
                          <p className="text-sm text-gray-400">
                            Enter your email to get instant access
                          </p>
                        </div>

                        {/* Lead Form */}
                        <LeadForm
                          fields={['email', 'name']}
                          onSubmit={handleSubmit}
                          submitButtonText={selectedOffer.cta}
                          isLoading={isLoading}
                          error={error}
                          showSuccess={showSuccess}
                          placeholderEmail="Enter your email"
                          placeholderName="Your name (optional)"
                          autoComplete={false}
                        />

                        {/* Trust Signals */}
                        <div className="flex items-center justify-center space-x-4 text-xs text-gray-500 pt-4 border-t border-dark-800">
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-accent-500 rounded-full" />
                            <span>Instant access</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-accent-500 rounded-full" />
                            <span>No spam</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-accent-500 rounded-full" />
                            <span>Unsubscribe anytime</span>
                          </div>
                        </div>

                        {/* Privacy Note */}
                        <p className="text-xs text-gray-500 text-center">
                          By entering your email, you agree to receive this resource and related updates.{' '}
                          <a href="/privacy" className="text-primary-400 hover:underline">
                            Privacy Policy
                          </a>
                        </p>

                        {/* No Thanks Link */}
                        <button
                          onClick={handleClose}
                          className="w-full text-sm text-gray-500 hover:text-gray-400 transition-colors"
                        >
                          No thanks, I don't want free resources
                        </button>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="success"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-8"
                      >
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                          className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-accent-500 to-accent-600 rounded-full mb-4"
                        >
                          <Sparkles size={32} className="text-white" />
                        </motion.div>
                        <h3 className="text-2xl font-bold text-white mb-2">
                          You're In!
                        </h3>
                        <p className="text-sm text-gray-400">
                          Check your inbox for your free resource.
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ExitIntentPopup;
