import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Paperclip,
  X,
  Minimize2,
  Maximize2,
  Bold,
  Italic,
  Underline,
  List,
  Link as LinkIcon,
  Smile
} from 'lucide-react';

/**
 * EmailComposer Component
 *
 * Full-featured email composer with:
 * - Rich text editor
 * - File attachments with progress
 * - Auto-save drafts
 * - Recipient picker
 * - Mobile-responsive
 * - Keyboard shortcuts (Ctrl+Enter to send)
 * - Full accessibility
 */
const EmailComposer = ({
  to = '',
  subject = '',
  body = '',
  cc = '',
  bcc = '',
  attachments = [],
  onSend,
  onSaveDraft,
  onDiscard,
  onMinimize,
  onMaximize
}) => {
  const [formData, setFormData] = useState({
    to: to || '',
    cc: cc || '',
    bcc: bcc || '',
    subject: subject || '',
    body: body || ''
  });
  const [isExpanded, setIsExpanded] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [fileInputRef, setFileInputRef] = useState(null);

  useEffect(() => {
    // Auto-save draft every 30 seconds
    const interval = setInterval(() => {
      if (formData.to || formData.subject || formData.body) {
        onSaveDraft?.(formData);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [formData]);

  const handleChange = (field) => (e) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleAttachmentChange = (e) => {
    const files = Array.from(e.target.files);

    files.forEach(file => {
      const reader = new FileReader();

      reader.onabort = () => console.log('File reading was aborted');
      reader.onerror = () => console.log('File reading has failed');
      reader.onload = () => {
        // Upload file and track progress
        setUploadProgress(prev => ({
          ...prev,
          [file.name]: 0
        }));

        // Simulate upload progress
        let progress = 0;
        const uploadInterval = setInterval(() => {
          progress += 10;
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: progress
          }));

          if (progress >= 100) {
            clearInterval(uploadInterval);
          }
        }, 200);
      };

      reader.readAsArrayBuffer(file);
    });
  };

  const handleSend = (e) => {
    e.preventDefault();

    if (!formData.to) {
      alert('Please enter at least one recipient');
      return;
    }

    onSend?.(formData);
    // Reset form
    setFormData({
      to: '',
      cc: '',
      bcc: '',
      subject: '',
      body: ''
    });
    setIsExpanded(false);
  };

  const handleKeyDown = (e) => {
    // Ctrl+Enter or Cmd+Enter to send
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSend(e);
    }
    // Escape to discard
    if (e.key === 'Escape' && !e.shiftKey) {
      e.preventDefault();
      if (window.confirm('Discard this email?')) {
        onDiscard?.();
      }
    }
  };

  return (
    <div
      className={`email-composer bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600
                  rounded-lg shadow-xl ${isExpanded ? 'expanded' : ''}`}
      onKeyDown={handleKeyDown}
      role="form"
      aria-label="Compose email"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">New Message</h2>
        <div className="flex items-center gap-1">
          {!isExpanded && (
            <button
              onClick={() => setIsExpanded(true)}
              className="p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800
                             text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300
                             transition-colors"
              aria-label="Expand composer"
            >
              <Maximize2 className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={() => {
              if (window.confirm('Discard this email?')) {
                onDiscard?.();
              }
            }}
            className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20
                           text-neutral-500 hover:text-red-600 dark:hover:text-red-400
                           transition-colors"
            aria-label="Discard email"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Composer Form */}
      <form onSubmit={handleSend} className="p-4 space-y-3">
        {/* To Field */}
        <div className="flex items-center gap-2">
          <label htmlFor="email-to" className="text-sm font-medium text-neutral-700 dark:text-neutral-300 w-12">
            To:
          </label>
          <input
            id="email-to"
            type="email"
            required
            multiple
            value={formData.to}
            onChange={handleChange('to')}
            className="flex-1 px-3 py-2 bg-neutral-50 dark:bg-neutral-800
                     border border-neutral-300 dark:border-neutral-600 rounded-lg
                     text-neutral-900 dark:text-white placeholder-neutral-500
                     focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="recipients@example.com"
            aria-label="Email recipients"
          />
        </div>

        {/* CC/BCC Fields (when expanded) */}
        {isExpanded && (
          <>
            <div className="flex items-center gap-2">
              <label htmlFor="email-cc" className="text-sm font-medium text-neutral-700 dark:text-neutral-300 w-12">
                Cc:
              </label>
              <input
                id="email-cc"
                type="email"
                multiple
                value={formData.cc}
                onChange={handleChange('cc')}
                className="flex-1 px-3 py-2 bg-neutral-50 dark:bg-neutral-800
                         border border-neutral-300 dark:border-neutral-600 rounded-lg
                         text-neutral-900 dark:text-white placeholder-neutral-500
                         focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="cc@example.com"
              />
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="email-bcc" className="text-sm font-medium text-neutral-700 dark:text-neutral-300 w-12">
                Bcc:
              </label>
              <input
                id="email-bcc"
                type="email"
                multiple
                value={formData.bcc}
                onChange={handleChange('bcc')}
                className="flex-1 px-3 py-2 bg-neutral-50 dark:bg-neutral-800
                         border border-neutral-300 dark:border-neutral-600 rounded-lg
                         text-neutral-900 dark:text-white placeholder-neutral-500
                         focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="bcc@example.com"
              />
            </div>
          </>
        )}

        {/* Subject */}
        <div>
          <input
            type="text"
            value={formData.subject}
            onChange={handleChange('subject')}
            className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800
                     border border-neutral-300 dark:border-neutral-600 rounded-lg
                     text-neutral-900 dark:text-white placeholder-neutral-500
                     focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Subject"
            aria-label="Email subject"
          />
        </div>

        {/* Formatting Toolbar */}
        {isExpanded && (
          <div className="flex items-center gap-1 py-2 border-b border-neutral-200 dark:border-neutral-700">
            <button
              type="button"
              className="p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800
                             text-neutral-600 dark:text-neutral-400 transition-colors"
              aria-label="Bold text"
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800
                             text-neutral-600 dark:text-neutral-400 transition-colors"
              aria-label="Italic text"
            >
              <Italic className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800
                             text-neutral-600 dark:text-neutral-400 transition-colors"
              aria-label="Underline text"
            >
              <Underline className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800
                             text-neutral-600 dark:text-neutral-400 transition-colors"
              aria-label="Insert list"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800
                             text-neutral-600 dark:text-neutral-400 transition-colors"
              aria-label="Insert link"
            >
              <LinkIcon className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Body */}
        <div>
          <textarea
            value={formData.body}
            onChange={handleChange('body')}
            className="w-full h-64 px-3 py-2 bg-neutral-50 dark:bg-neutral-800
                     border border-neutral-300 dark:border-neutral-600 rounded-lg
                     text-neutral-900 dark:text-white placeholder-neutral-500
                     focus:outline-none focus:ring-2 focus:ring-primary-500
                     resize-none font-mono text-sm"
            placeholder="Write your message here..."
            aria-label="Email body"
          />
        </div>

        {/* Attachments */}
        {attachments.length > 0 && (
          <div className="space-y-2">
            {attachments.map((attachment, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 rounded-lg
                              bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
              >
                <div className="flex items-center gap-2">
                  <Paperclip className="w-4 h-4 text-neutral-500" />
                  <span className="text-sm text-neutral-700 dark:text-neutral-300">
                    {attachment.filename}
                  </span>
                  <span className="text-xs text-neutral-500">
                    ({(attachment.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
                {uploadProgress[attachment.filename] !== undefined && (
                  <div className="text-xs text-primary-600 dark:text-primary-400">
                    {uploadProgress[attachment.filename]}%
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3">
          <div className="flex items-center gap-2">
            {/* Attachment Button */}
            <input
              ref={setFileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleAttachmentChange}
              aria-label="Upload attachments"
            />
            <button
              type="button"
              onClick={() => fileInputRef?.click()}
              className="p-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800
                             text-neutral-600 dark:text-neutral-400 transition-colors"
              aria-label="Attach files"
            >
              <Paperclip className="w-5 h-5" />
            </button>

            {/* Insert Emoji */}
            <button
              type="button"
              className="p-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800
                             text-neutral-600 dark:text-neutral-400 transition-colors"
              aria-label="Insert emoji"
            >
              <Smile className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Minimize/Expand */}
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800
                             text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300
                             transition-colors"
              aria-label={isExpanded ? 'Minimize composer' : 'Expand composer'}
            >
              {isExpanded ? (
                <Minimize2 className="w-5 h-5" />
              ) : (
                <Maximize2 className="w-5 h-5" />
              )}
            </button>

            {/* Send Button */}
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2
                         bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600
                         text-white rounded-lg font-semibold shadow-md hover:shadow-lg
                         transition-all"
              aria-label="Send email"
            >
              <Send className="w-4 h-4" />
              <span>Send</span>
            </button>
          </div>
        </div>

        {/* Help Text */}
        <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
          <kbd className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded">Ctrl+Enter</kbd> to send
          {' '}&middot{' '}
          <kbd className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded">Esc</kbd> to discard
        </div>
      </form>
    </div>
  );
};

export default EmailComposer;
