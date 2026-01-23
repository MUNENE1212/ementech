/**
 * Resource Download Component
 * Progressive form for gated content downloads
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Download, Check, AlertCircle, ExternalLink } from 'lucide-react';
import { saveResourceDownload } from '../../services/leadService';
import { useLead } from '../../contexts/LeadContext';
import LeadForm from './shared/LeadForm';
import SuccessModal from './shared/SuccessModal';

const ResourceDownload = ({
  resource = {
    id: 'ai-implementation-guide',
    title: 'The Complete Guide to AI Implementation in 2025',
    type: 'guide',
    format: 'PDF',
    pages: 45,
    value: '$499 value',
    description: 'Step-by-step AI integration roadmap with real case studies',
    topics: ['RAG systems', 'LLM finetuning', 'Cost optimization'],
    downloadUrl: '#',
  },
  progressiveFields = ['email', 'name', 'company'],
  className = '',
}) => {
  const { initializeLead, updateProfile, trackEvent, hasData } = useLead();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [downloadStarted, setDownloadStarted] = useState(false);

  // Determine which fields to show based on lead data
  const getFieldsForStep = () => {
    const fields = [];

    // Always show email first
    fields.push('email');

    // Add name if in progressive fields and not already captured
    if (progressiveFields.includes('name') && !hasData('name')) {
      fields.push('name');
    }

    // Add company if in progressive fields and not already captured
    if (progressiveFields.includes('company') && !hasData('company')) {
      fields.push('company');
    }

    return fields;
  };

  const handleSubmit = async (formData) => {
    setIsLoading(true);
    setError(null);

    try {
      // Initialize/update lead
      await initializeLead(formData.email);

      // Update profile with additional data
      if (formData.name || formData.company) {
        await updateProfile({
          name: formData.name,
          company: formData.company,
        });
      }

      // Save resource download
      await saveResourceDownload({
        email: formData.email,
        name: formData.name,
        company: formData.company,
        resourceId: resource.id,
        resourceName: resource.title,
        consent: true,
        source: 'resource-download',
      });

      // Track the event
      await trackEvent('resource_download', {
        resourceId: resource.id,
        resourceName: resource.title,
      });

      // Show success and trigger download
      setShowSuccess(true);
      setDownloadStarted(true);

      // Trigger download after a short delay
      setTimeout(() => {
        triggerDownload();
      }, 1500);
    } catch (err) {
      console.error('Resource download error:', err);
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const triggerDownload = () => {
    // Create a temporary link to trigger download
    const link = document.createElement('a');
    link.href = resource.downloadUrl;
    link.download = `${resource.title}.${resource.format.toLowerCase()}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const typeColors = {
    guide: 'from-blue-500 to-blue-600',
    report: 'from-purple-500 to-purple-600',
    checklist: 'from-green-500 to-green-600',
    whitepaper: 'from-orange-500 to-orange-600',
  };

  const typeIcons = {
    guide: FileText,
    report: FileText,
    checklist: Check,
    whitepaper: FileText,
  };

  const TypeIcon = typeIcons[resource.type] || FileText;

  return (
    <div className={`resource-download ${className}`}>
      <div className="bg-dark-900 border border-dark-800 rounded-2xl overflow-hidden">
        {/* Resource Preview */}
        <div className="bg-gradient-to-br from-dark-800 to-dark-900 p-6 sm:p-8">
          <div className="flex items-start space-x-4">
            {/* Resource Icon */}
            <div className={`flex-shrink-0 p-4 bg-gradient-to-br ${typeColors[resource.type]} rounded-xl shadow-lg`}>
              <TypeIcon size={32} className="text-white" />
            </div>

            {/* Resource Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-2">
                <span className="inline-block px-2 py-1 bg-primary-500/20 text-primary-400 text-xs font-semibold rounded-full uppercase tracking-wide">
                  {resource.type}
                </span>
                {resource.value && (
                  <span className="text-xs text-gold-400 font-medium">
                    {resource.value}
                  </span>
                )}
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                {resource.title}
              </h3>
              <p className="text-sm text-gray-400 mb-3">
                {resource.description}
              </p>

              {/* Resource Metadata */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                {resource.format && (
                  <span className="flex items-center space-x-1">
                    <FileText size={12} />
                    <span>{resource.format}</span>
                  </span>
                )}
                {resource.pages && (
                  <span className="flex items-center space-x-1">
                    <span>{resource.pages} pages</span>
                  </span>
                )}
                {resource.topics && (
                  <span className="flex items-center space-x-1">
                    <span>{resource.topics.slice(0, 2).join(', ')}</span>
                    {resource.topics.length > 2 && (
                      <span>+{resource.topics.length - 2} more</span>
                    )}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Topics Pills */}
          {resource.topics && resource.topics.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {resource.topics.map((topic, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-dark-800 border border-dark-700 rounded-full text-xs text-gray-400"
                >
                  {topic}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Download Form */}
        <div className="p-6 sm:p-8">
          <AnimatePresence mode="wait">
            {!downloadStarted ? (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {/* Value Proposition */}
                <div className="text-center mb-6">
                  <h4 className="text-lg font-semibold text-white mb-2">
                    Enter your email to download
                  </h4>
                  <p className="text-sm text-gray-400">
                    Get instant access plus weekly updates on similar resources
                  </p>
                </div>

                {/* Form */}
                <LeadForm
                  fields={getFieldsForStep()}
                  onSubmit={handleSubmit}
                  submitButtonText={
                    <span className="flex items-center justify-center space-x-2">
                      <Download size={18} />
                      <span>Download {resource.type}</span>
                    </span>
                  }
                  isLoading={isLoading}
                  error={error}
                />

                {/* Trust Signals */}
                <div className="pt-4 border-t border-dark-800">
                  <div className="flex items-center justify-center space-x-6 text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Check size={14} className="text-accent-500" />
                      <span>Instant access</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Check size={14} className="text-accent-500" />
                      <span>No spam</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Check size={14} className="text-accent-500" />
                      <span>Unsubscribe anytime</span>
                    </div>
                  </div>
                </div>

                {/* Privacy Note */}
                <p className="text-xs text-gray-500 text-center">
                  By downloading, you agree to receive related resources.{' '}
                  <a href="/privacy" className="text-primary-400 hover:underline">
                    Privacy Policy
                  </a>
                </p>
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
                  <Check size={32} className="text-white" />
                </motion.div>
                <h4 className="text-xl font-bold text-white mb-2">
                  Download Started!
                </h4>
                <p className="text-sm text-gray-400 mb-6">
                  Your download should start automatically. If not,{' '}
                  <button
                    onClick={triggerDownload}
                    className="text-primary-400 hover:underline font-medium"
                  >
                    click here
                  </button>
                </p>

                {/* Additional Resources CTA */}
                <div className="p-4 bg-dark-800 rounded-xl border border-dark-700">
                  <p className="text-sm text-gray-300 mb-3">
                    Want more resources like this?
                  </p>
                  <a
                    href="/resources"
                    className="inline-flex items-center space-x-2 text-sm text-primary-400 hover:text-primary-300 font-medium"
                  >
                    <span>Browse all resources</span>
                    <ExternalLink size={14} />
                  </a>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <SuccessModal
        isOpen={showSuccess}
        onClose={() => setShowSuccess(false)}
        title="Access Granted!"
        message={`Your download of "${resource.title}" has started. Check your email for more valuable resources.`}
      />
    </div>
  );
};

export default ResourceDownload;
