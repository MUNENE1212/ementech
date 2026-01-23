import React, { useState, useEffect } from 'react';
import { Reply, ReplyAll, Forward, Star, Archive, Trash2, Printer, Download } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

/**
 * EmailReader Component
 *
 * Displays full email content with:
 * - Email headers (from, to, cc, date, subject)
 * - Email body (rich text/plain)
 * - Attachments with download
 * - Action buttons (reply, forward, delete, etc.)
 * - Keyboard shortcuts
 * - Print functionality
 * - Full accessibility
 */
const EmailReader = ({
  email,
  loading = false,
  onReply,
  onReplyAll,
  onForward,
  onDelete,
  onArchive,
  onToggleStar,
  onDownload
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAllRecipients, setShowAllRecipients] = useState(false);

  useEffect(() => {
    // Mark as read when viewed
    if (email && !email.read) {
      // Call API to mark as read
    }
  }, [email]);

  if (loading) {
    return (
      <div
        className="flex items-center justify-center h-full p-12"
        role="status"
        aria-live="polite"
        aria-label="Loading email"
      >
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-16 h-16 bg-neutral-200 dark:bg-neutral-700 rounded mb-4"></div>
          <div className="w-48 h-4 bg-neutral-200 dark:bg-neutral-700 rounded mb-2"></div>
          <div className="w-64 h-3 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (!email) {
    return (
      <div
        className="flex flex-col items-center justify-center h-full p-12 text-center"
        role="status"
        aria-live="polite"
      >
        <div className="w-20 h-20 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-4">
          <Reply className="w-10 h-10 text-neutral-400 dark:text-neutral-600" />
        </div>
        <h3 className="text-lg font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
          Select an email to read
        </h3>
        <p className="text-neutral-500 dark:text-neutral-400">
          Choose an email from the list to view its contents
        </p>
      </div>
    );
  }

  const extractName = (emailString) => {
    if (!emailString) return 'Unknown';
    const match = emailString.match(/["']?(.*?)["']?\s*<.*?>/);
    return match ? match[1] : emailString.split('@')[0];
  };

  const handleKeyDown = (e) => {
    // Keyboard shortcuts
    if (e.key === 'r' || e.key === 'R') {
      e.preventDefault();
      if (!e.shiftKey) {
        onReply?.(email);
      } else {
        onReplyAll?.(email);
      }
    } else if (e.key === 'f' || e.key === 'F') {
      e.preventDefault();
      onForward?.(email);
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      onDelete?.(email);
    } else if (e.key === 'e' || e.key === 'E') {
      e.preventDefault();
      onArchive?.(email);
    } else if (e.key === 's' || e.key === 'S') {
      e.preventDefault();
      onToggleStar?.(email);
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-KE', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div
      className="email-reader h-full overflow-y-auto"
      onKeyDown={handleKeyDown}
      role="region"
      aria-label="Email content"
    >
      {/* Email Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700 p-6">
        {/* Subject */}
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">
          {email.subject || '(No Subject)'}
        </h1>

        {/* Sender Info */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500
                              flex items-center justify-center text-white font-bold text-lg">
                {extractName(email.from).charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-neutral-900 dark:text-white">
                  {extractName(email.from)}
                </p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {email.from?.match(/<(.+)>/)?.[1] || email.from}
                </p>
              </div>
            </div>

            {/* To, CC, BCC */}
            <button
              className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white
                             flex items-center gap-1"
              onClick={() => setShowAllRecipients(!showAllRecipients)}
              aria-expanded={showAllRecipients}
            >
              <span>to {email.to?.length || 0} recipients</span>
              <span className="text-xs">{showAllRecipients ? '▲' : '▼'}</span>
            </button>

            {showAllRecipients && (
              <div className="mt-2 space-y-1 text-sm text-neutral-600 dark:text-neutral-400">
                <div><strong>To:</strong> {email.to?.join(', ') || 'Unknown'}</div>
                {email.cc && <div><strong>Cc:</strong> {email.cc.join(', ')}</div>}
                {email.bcc && <div><strong>Bcc:</strong> {email.bcc.join(', ')}</div>}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleStar?.(email)}
              className={`p-2 rounded-full transition-colors ${
                email.starred
                  ? 'text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
                  : 'text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
              aria-label={email.starred ? 'Unstar email' : 'Star email'}
              aria-pressed={email.starred}
            >
              <Star className={`w-5 h-5 ${email.starred ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={() => window.print()}
              className="p-2 rounded-full text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800
                             transition-colors"
              aria-label="Print email"
            >
              <Printer className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Date and Labels */}
        <div className="flex items-center justify-between text-sm text-neutral-600 dark:text-neutral-400">
          <span>{formatDate(email.date)}</span>
          <span>{formatDistanceToNow(new Date(email.date), { addSuffix: true })}</span>
        </div>

        {/* Labels */}
        {email.labels && email.labels.length > 0 && (
          <div className="flex gap-2 mt-3">
            {email.labels.map(label => (
              <span
                key={label._id}
                className="px-3 py-1 text-sm font-medium rounded-full"
                style={{
                  backgroundColor: label.color ? `${label.color}20` : '#f3f4f6',
                  color: label.color || '#374151'
                }}
              >
                {label.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Email Body */}
      <div
        className="p-6 prose dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: email.body || '' }}
        role="article"
        aria-label="Email content"
      />

      {/* Attachments */}
      {email.attachments && email.attachments.length > 0 && (
        <div className="p-6 border-t border-neutral-200 dark:border-neutral-700">
          <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">
            {email.attachments.length} {email.attachments.length === 1 ? 'Attachment' : 'Attachments'}
          </h3>
          <div className="space-y-2">
            {email.attachments.map(attachment => (
              <div
                key={attachment._id}
                className="flex items-center justify-between p-3 rounded-lg
                              bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700
                              transition-colors cursor-pointer group"
                onClick={() => onDownload?.(attachment)}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded bg-white dark:bg-neutral-700
                                  shadow-sm group-hover:shadow-md transition-shadow">
                    <Download className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-900 dark:text-white">
                      {attachment.filename}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {(attachment.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <Download className="w-5 h-5 text-neutral-400 group-hover:text-primary-500 transition-colors" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Bar */}
      <div className="sticky bottom-0 z-10 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-700
                      p-4 flex items-center gap-2">
        <button
          onClick={() => onReply?.(email)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2
                         bg-primary-500 hover:bg-primary-600 text-white rounded-lg
                         transition-colors font-medium"
          aria-label={`Reply to ${extractName(email.from)}`}
        >
          <Reply className="w-4 h-4" />
          <span>Reply</span>
        </button>
        <button
          onClick={() => onReplyAll?.(email)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2
                         bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700
                         text-neutral-900 dark:text-white rounded-lg
                         transition-colors font-medium"
          aria-label="Reply to all"
        >
          <ReplyAll className="w-4 h-4" />
          <span>Reply All</span>
        </button>
        <button
          onClick={() => onForward?.(email)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2
                         bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700
                         text-neutral-900 dark:text-white rounded-lg
                         transition-colors font-medium"
          aria-label="Forward email"
        >
          <Forward className="w-4 h-4" />
          <span>Forward</span>
        </button>
      </div>

      {/* Keyboard Shortcuts Help */}
      <div className="p-6 border-t border-neutral-200 dark:border-neutral-700 text-xs text-neutral-500 dark:text-neutral-400">
        <p className="font-semibold mb-2">Keyboard shortcuts:</p>
        <div className="grid grid-cols-2 gap-2">
          <div><kbd className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded">R</kbd> Reply</div>
          <div><kbd className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded">Shift+R</kbd> Reply All</div>
          <div><kbd className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded">F</kbd> Forward</div>
          <div><kbd className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded">S</kbd> Star</div>
          <div><kbd className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded">E</kbd> Archive</div>
          <div><kbd className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded">Delete</kbd> Delete</div>
        </div>
      </div>
    </div>
  );
};

export default EmailReader;
