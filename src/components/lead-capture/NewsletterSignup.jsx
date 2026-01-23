/**
 * Newsletter Signup Component
 * Value-first newsletter subscription with GDPR consent
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Sparkles, Check, AlertCircle } from 'lucide-react';
import { subscribeNewsletter } from '../../services/leadService';
import { useLead } from '../../contexts/LeadContext';
import SuccessModal from './shared/SuccessModal';

const NewsletterSignup = ({
  context = 'footer',
  variant = 'minimal',
  className = '',
}) => {
  const { initializeLead, updateProfile, trackEvent } = useLead();
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [emailError, setEmailError] = useState('');

  const newsletters = {
    tech: {
      id: 'tech-insights',
      name: 'Tech Insights',
      description: 'Weekly AI & tech trends, implementation guides',
      icon: Sparkles,
    },
    growth: {
      id: 'growth-hacks',
      name: 'Growth Playbook',
      description: 'Proven growth strategies for tech companies',
      icon: Sparkles,
    },
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    setEmailError('');

    if (value && !validateEmail(value)) {
      setEmailError('Please enter a valid email');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!email) {
      setError('Please enter your email');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (!consent) {
      setError('Please agree to receive emails');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Subscribe to newsletter
      await subscribeNewsletter({
        email,
        consent: true,
        source: context,
      });

      // Initialize/update lead in context
      await initializeLead(email);

      // Track the event
      await trackEvent('newsletter_signup', {
        context,
        newsletter: 'tech-insights',
      });

      // Show success
      setShowSuccess(true);

      // Reset form
      setEmail('');
      setConsent(false);
    } catch (err) {
      console.error('Newsletter signup error:', err);
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const isMinimal = variant === 'minimal';
  const isInline = variant === 'inline';

  if (isMinimal) {
    return (
      <div className={`newsletter-signup ${className}`}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 relative group">
              <Mail
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary-400 transition-colors"
              />
              <input
                type="email"
                value={email}
                onChange={handleEmailChange}
                placeholder="Stay informed with weekly insights"
                className="w-full pl-10 pr-4 py-2.5 bg-dark-800 border border-dark-700 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all hover:border-dark-600"
                disabled={isLoading}
              />
            </div>
            <motion.button
              type="submit"
              disabled={isLoading || !email || !consent}
              whileHover={{ scale: isLoading ? 1 : 1.02 }}
              whileTap={{ scale: isLoading ? 1 : 0.98 }}
              className="px-6 py-2.5 bg-gradient-to-r from-primary-500 to-gold-500 rounded-lg text-white font-medium text-sm whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-primary-500/25 transition-all"
            >
              {isLoading ? (
                <span className="flex items-center space-x-2">
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Joining...</span>
                </span>
              ) : (
                'Subscribe'
              )}
            </motion.button>
          </div>

          {/* GDPR Consent Checkbox */}
          <label className="flex items-start space-x-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-dark-700 bg-dark-800 text-primary-500 focus:ring-2 focus:ring-primary-500/50 focus:ring-offset-0 transition-all cursor-pointer"
              disabled={isLoading}
            />
            <span className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors">
              I agree to receive emails. Unsubscribe anytime.
            </span>
          </label>

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-red-400 text-sm flex items-center space-x-1"
              >
                <AlertCircle size={14} />
                <span>{error}</span>
              </motion.p>
            )}

            {emailError && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-red-400 text-sm flex items-center space-x-1"
              >
                <AlertCircle size={14} />
                <span>{emailError}</span>
              </motion.p>
            )}
          </AnimatePresence>
        </form>

        <SuccessModal
          isOpen={showSuccess}
          onClose={() => setShowSuccess(false)}
          title="You're In!"
          message="Check your inbox for a welcome email with exclusive insights."
        />
      </div>
    );
  }

  if (isInline) {
    return (
      <div className={`newsletter-signup inline ${className}`}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-center mb-4">
            <h3 className="text-lg font-semibold text-white mb-2">
              Get Weekly AI Insights
            </h3>
            <p className="text-sm text-gray-400">
              Join 500+ industry leaders receiving actionable AI trends
            </p>
          </div>

          <div className="relative">
            <Mail
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
            />
            <input
              type="email"
              value={email}
              onChange={handleEmailChange}
              placeholder="Enter your email"
              className="w-full pl-10 pr-4 py-3 bg-dark-800 border border-dark-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
              disabled={isLoading}
            />
          </div>

          {/* GDPR Consent Checkbox */}
          <label className="flex items-start space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-dark-700 bg-dark-800 text-primary-500 focus:ring-2 focus:ring-primary-500/50"
              disabled={isLoading}
            />
            <span className="text-xs text-gray-400">
              I agree to receive emails about AI insights and company updates.{' '}
              <a href="/privacy" className="text-primary-400 hover:underline">
                Privacy Policy
              </a>
            </span>
          </label>

          <motion.button
            type="submit"
            disabled={isLoading || !email || !consent}
            whileHover={{ scale: isLoading ? 1 : 1.02 }}
            whileTap={{ scale: isLoading ? 1 : 0.98 }}
            className="w-full py-3 bg-gradient-to-r from-primary-500 via-gold-500 to-accent-500 rounded-lg text-white font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Joining...' : 'Get Weekly Insights'}
          </motion.button>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-400 text-sm text-center"
            >
              {error}
            </motion.p>
          )}

          <p className="text-xs text-gray-500 text-center">
            No spam, ever. Unsubscribe anytime.
          </p>
        </form>

        <SuccessModal
          isOpen={showSuccess}
          onClose={() => setShowSuccess(false)}
          title="Welcome Aboard!"
          message="You've successfully joined our community of tech leaders. Check your inbox for your first insight."
        />
      </div>
    );
  }

  // Prominent variant
  return (
    <div className={`newsletter-signup prominent ${className}`}>
      <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6 sm:p-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-gradient-to-br from-primary-500 to-gold-500 rounded-lg">
            <Sparkles size={24} className="text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">
              Stay Ahead of the Curve
            </h3>
            <p className="text-sm text-gray-400">
              Weekly insights you won't want to miss
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Newsletter Options */}
          <div className="space-y-2">
            {Object.values(newsletters).map((newsletter) => (
              <motion.label
                key={newsletter.id}
                className="flex items-start space-x-3 p-3 bg-dark-800/50 border border-dark-700 rounded-lg cursor-pointer hover:border-primary-500/50 transition-all"
                whileHover={{ scale: 1.01 }}
              >
                <input
                  type="radio"
                  name="newsletter"
                  value={newsletter.id}
                  defaultChecked={newsletter.id === 'tech'}
                  className="mt-1 w-4 h-4 border-dark-700 bg-dark-800 text-primary-500 focus:ring-2 focus:ring-primary-500/50"
                  disabled={isLoading}
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <newsletter.icon size={16} className="text-gold-400" />
                    <span className="text-white font-medium text-sm">
                      {newsletter.name}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">{newsletter.description}</p>
                </div>
              </motion.label>
            ))}
          </div>

          <div className="relative">
            <Mail
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
            />
            <input
              type="email"
              value={email}
              onChange={handleEmailChange}
              placeholder="Enter your email"
              className="w-full pl-10 pr-4 py-3 bg-dark-800 border border-dark-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
              disabled={isLoading}
            />
          </div>

          {/* GDPR Consent Checkbox */}
          <label className="flex items-start space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-dark-700 bg-dark-800 text-primary-500 focus:ring-2 focus:ring-primary-500/50"
              disabled={isLoading}
            />
            <span className="text-xs text-gray-400">
              I agree to receive emails and accept the{' '}
              <a href="/privacy" className="text-primary-400 hover:underline">
                Privacy Policy
              </a>
            </span>
          </label>

          <motion.button
            type="submit"
            disabled={isLoading || !email || !consent}
            whileHover={{ scale: isLoading ? 1 : 1.02 }}
            whileTap={{ scale: isLoading ? 1 : 0.98 }}
            className="w-full py-3 bg-gradient-to-r from-primary-500 via-gold-500 to-accent-500 rounded-lg text-white font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Joining...' : 'Get Exclusive Insights'}
          </motion.button>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-400 text-sm text-center"
            >
              {error}
            </motion.p>
          )}

          {emailError && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-400 text-sm text-center"
            >
              {emailError}
            </motion.p>
          )}

          <p className="text-xs text-gray-500 text-center">
            Join 500+ industry leaders. No spam, unsubscribe anytime.
          </p>
        </form>
      </div>

      <SuccessModal
        isOpen={showSuccess}
        onClose={() => setShowSuccess(false)}
        title="You're In!"
        message="Welcome to our community! Check your inbox for exclusive insights."
      />
    </div>
  );
};

export default NewsletterSignup;
