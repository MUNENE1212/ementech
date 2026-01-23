/**
 * Lead Form Component
 * Reusable form with validation for lead capture
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, User, Building2, Check, AlertCircle } from 'lucide-react';
import { isValidEmail, inferCompanyFromEmail } from '../../../services/leadService';

const LeadForm = ({
  fields = ['email'],
  onSubmit,
  submitButtonText = 'Get Access',
  submitButtonClassName = '',
  isLoading = false,
  showSuccess = false,
  error = null,
  placeholderEmail = 'Enter your email',
  placeholderName = 'Your name',
  placeholderCompany = 'Company name',
  autoComplete = true,
}) => {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    company: '',
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});

  const validateField = (field, value) => {
    switch (field) {
      case 'email':
        if (!value) return 'Email is required';
        if (!isValidEmail(value)) return 'Please enter a valid email';
        return '';
      case 'name':
        if (fields.includes('name') && !value.trim()) return 'Name is required';
        return '';
      case 'company':
        if (fields.includes('company') && !value.trim()) return 'Company is required';
        return '';
      default:
        return '';
    }
  };

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Auto-infer company from email domain
    if (field === 'email' && isValidEmail(value)) {
      const inferred = inferCompanyFromEmail(value);
      if (inferred && !formData.company) {
        setFormData((prev) => ({ ...prev, company: inferred }));
      }
    }

    // Validate field if already touched
    if (touchedFields[field]) {
      const error = validateField(field, value);
      setFieldErrors((prev) => ({ ...prev, [field]: error }));
    }
  };

  const handleFieldBlur = (field) => {
    setTouchedFields((prev) => ({ ...prev, [field]: true }));
    const error = validateField(field, formData[field]);
    setFieldErrors((prev) => ({ ...prev, [field]: error }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate all fields
    const errors = {};
    let hasErrors = false;

    fields.forEach((field) => {
      const error = validateField(field, formData[field]);
      if (error) {
        errors[field] = error;
        hasErrors = true;
      }
    });

    if (hasErrors) {
      setFieldErrors(errors);
      setTouchedFields(
        fields.reduce((acc, field) => ({ ...acc, [field]: true }), {})
      );
      return;
    }

    // Submit only required fields
    const submitData = {};
    fields.forEach((field) => {
      submitData[field] = formData[field];
    });

    onSubmit(submitData);
  };

  const isFieldValid = (field) => {
    return touchedFields[field] && !fieldErrors[field];
  };

  const isFieldInvalid = (field) => {
    return touchedFields[field] && fieldErrors[field];
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Email Field */}
      {fields.includes('email') && (
        <div className="space-y-2">
          <label htmlFor="email" className="sr-only">
            Email address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail
                size={18}
                className={`transition-colors ${
                  isFieldValid('email')
                    ? 'text-accent-500'
                    : isFieldInvalid('email')
                    ? 'text-red-500'
                    : 'text-gray-500'
                }`}
              />
            </div>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={(e) => handleFieldChange('email', e.target.value)}
              onBlur={() => handleFieldBlur('email')}
              placeholder={placeholderEmail}
              autoComplete={autoComplete ? 'email' : 'off'}
              disabled={isLoading || showSuccess}
              className={`w-full pl-10 pr-4 py-3 bg-dark-800 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all ${
                isFieldValid('email')
                  ? 'border-accent-500 focus:ring-accent-500/50'
                  : isFieldInvalid('email')
                  ? 'border-red-500 focus:ring-red-500/50'
                  : 'border-dark-700 focus:ring-primary-500/50 focus:border-primary-500'
              }`}
              aria-invalid={isFieldInvalid('email')}
              aria-describedby={isFieldInvalid('email') ? 'email-error' : undefined}
            />
            {isFieldValid('email') && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <Check size={18} className="text-accent-500" />
              </motion.div>
            )}
          </div>
          <AnimatePresence>
            {isFieldInvalid('email') && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center space-x-2 text-red-400 text-sm"
              >
                <AlertCircle size={14} />
                <span id="email-error">{fieldErrors.email}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Name Field */}
      {fields.includes('name') && (
        <div className="space-y-2">
          <label htmlFor="name" className="sr-only">
            Name
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User
                size={18}
                className={`transition-colors ${
                  isFieldValid('name')
                    ? 'text-accent-500'
                    : isFieldInvalid('name')
                    ? 'text-red-500'
                    : 'text-gray-500'
                }`}
              />
            </div>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              onBlur={() => handleFieldBlur('name')}
              placeholder={placeholderName}
              autoComplete={autoComplete ? 'name' : 'off'}
              disabled={isLoading || showSuccess}
              className={`w-full pl-10 pr-4 py-3 bg-dark-800 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all ${
                isFieldValid('name')
                  ? 'border-accent-500 focus:ring-accent-500/50'
                  : isFieldInvalid('name')
                  ? 'border-red-500 focus:ring-red-500/50'
                  : 'border-dark-700 focus:ring-primary-500/50 focus:border-primary-500'
              }`}
              aria-invalid={isFieldInvalid('name')}
              aria-describedby={isFieldInvalid('name') ? 'name-error' : undefined}
            />
            {isFieldValid('name') && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <Check size={18} className="text-accent-500" />
              </motion.div>
            )}
          </div>
          <AnimatePresence>
            {isFieldInvalid('name') && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center space-x-2 text-red-400 text-sm"
              >
                <AlertCircle size={14} />
                <span id="name-error">{fieldErrors.name}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Company Field */}
      {fields.includes('company') && (
        <div className="space-y-2">
          <label htmlFor="company" className="sr-only">
            Company
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Building2
                size={18}
                className={`transition-colors ${
                  isFieldValid('company')
                    ? 'text-accent-500'
                    : isFieldInvalid('company')
                    ? 'text-red-500'
                    : 'text-gray-500'
                }`}
              />
            </div>
            <input
              type="text"
              id="company"
              name="company"
              value={formData.company}
              onChange={(e) => handleFieldChange('company', e.target.value)}
              onBlur={() => handleFieldBlur('company')}
              placeholder={placeholderCompany}
              autoComplete={autoComplete ? 'organization' : 'off'}
              disabled={isLoading || showSuccess}
              className={`w-full pl-10 pr-4 py-3 bg-dark-800 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all ${
                isFieldValid('company')
                  ? 'border-accent-500 focus:ring-accent-500/50'
                  : isFieldInvalid('company')
                  ? 'border-red-500 focus:ring-red-500/50'
                  : 'border-dark-700 focus:ring-primary-500/50 focus:border-primary-500'
              }`}
              aria-invalid={isFieldInvalid('company')}
              aria-describedby={isFieldInvalid('company') ? 'company-error' : undefined}
            />
            {isFieldValid('company') && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <Check size={18} className="text-accent-500" />
              </motion.div>
            )}
          </div>
          <AnimatePresence>
            {isFieldInvalid('company') && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center space-x-2 text-red-400 text-sm"
              >
                <AlertCircle size={14} />
                <span id="company-error">{fieldErrors.company}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Form Error */}
      <AnimatePresence>
        {error && !showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start space-x-2 text-red-400 text-sm"
          >
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submit Button */}
      <motion.button
        type="submit"
        disabled={isLoading || showSuccess}
        whileHover={{ scale: isLoading || showSuccess ? 1 : 1.02 }}
        whileTap={{ scale: isLoading || showSuccess ? 1 : 0.98 }}
        className={`w-full py-3 px-6 bg-gradient-to-r from-primary-500 via-gold-500 to-accent-500 rounded-lg text-white font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed ${submitButtonClassName}`}
      >
        {isLoading ? (
          <span className="flex items-center justify-center space-x-2">
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
            />
            <span>Processing...</span>
          </span>
        ) : showSuccess ? (
          <span className="flex items-center justify-center space-x-2">
            <Check size={18} />
            <span>Success!</span>
          </span>
        ) : (
          submitButtonText
        )}
      </motion.button>
    </form>
  );
};

export default LeadForm;
