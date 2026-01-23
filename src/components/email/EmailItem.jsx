import React, { useRef, useEffect } from 'react';
import { Mail, Star, Paperclip } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

/**
 * EmailItem Component
 *
 * Displays a single email in the email list with:
 * - Read/unread visual distinction
 * - Star/favorite flag
 * - Attachment indicator
 * - Sender, subject, preview
 * - Timestamp
 * - New email animation
 * - Keyboard navigation support
 * - Touch-friendly interactions
 * - Full accessibility
 */
const EmailItem = ({
  email,
  isNew = false,
  isSelected = false,
  isFocused = false,
  onClick,
  onFocus,
  ariaPosInSet,
  ariaSetSize
}) => {
  const itemRef = useRef(null);

  // Focus management
  useEffect(() => {
    if (isFocused && itemRef.current) {
      itemRef.current.focus();
      itemRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [isFocused]);

  const handleClick = (e) => {
    e.stopPropagation();
    onClick?.(email);
  };

  const formatTime = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInHours = (now - date) / (1000 * 60 * 60);

      if (diffInHours < 24) {
        return formatDistanceToNow(date, { addSuffix: true });
      } else {
        return date.toLocaleDateString('en-KE', {
          month: 'short',
          day: 'numeric'
        });
      }
    } catch {
      return '';
    }
  };

  const extractName = (emailFrom) => {
    if (!emailFrom) return 'Unknown';

    // Handle object format: { name: '...', email: '...' }
    if (typeof emailFrom === 'object' && emailFrom.name) {
      return emailFrom.name;
    }

    // Handle string format: "John Doe <john@example.com>"
    if (typeof emailFrom === 'string') {
      const match = emailFrom.match(/["']?(.*?)["']?\s*<.*?>/);
      return match ? match[1] : emailFrom.split('@')[0];
    }

    // Handle string format: "john@example.com"
    if (typeof emailFrom === 'string') {
      return emailFrom.split('@')[0];
    }

    return 'Unknown';
  };

  const senderName = extractName(email.from);
  const hasAttachments = email.attachments && email.attachments.length > 0;

  return (
    <li
      ref={itemRef}
      className={`
        relative cursor-pointer transition-all duration-200
        ${email.read
          ? 'bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800'
          : 'bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30 font-semibold'
        }
        ${isSelected ? 'ring-2 ring-primary-500 ring-inset' : ''}
        ${isFocused ? 'ring-2 ring-secondary-500 ring-inset' : ''}
        ${isNew ? 'animate-pulse-once' : ''}
      `}
      onClick={handleClick}
      onFocus={onFocus}
      role="option"
      aria-selected={isSelected}
      aria-posinset={ariaPosInSet}
      aria-setsize={ariaSetSize}
      aria-label={`${email.read ? 'Read' : 'Unread'} email from ${senderName}, subject: ${email.subject}, ${formatTime(email.date)}`}
      tabIndex={isFocused ? 0 : -1}
    >
      {/* Checkbox for multi-select */}
      <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => {
            e.stopPropagation();
            onClick(e);
          }}
          className="w-5 h-5 rounded border-2 border-neutral-300 dark:border-neutral-600
                     text-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                     disabled:opacity-50 transition-colors cursor-pointer"
          aria-label={`Select email from ${senderName}`}
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {/* Star/Favorite */}
      <button
        className={`absolute left-12 top-1/2 -translate-y-1/2 z-10
                       transition-colors duration-200
                       ${email.starred ? 'text-yellow-500' : 'text-neutral-300 dark:text-neutral-600 hover:text-yellow-400'}`}
        onClick={(e) => {
          e.stopPropagation();
          // Handle star toggle
        }}
        aria-label={email.starred ? 'Unstar email' : 'Star email'}
        aria-pressed={email.starred}
      >
        <Star className={`w-5 h-5 ${email.starred ? 'fill-current' : ''}`} />
      </button>

      {/* New Email Badge */}
      {isNew && (
        <span className="absolute right-3 top-3 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-primary-500"></span>
        </span>
      )}

      {/* Email Content */}
      <div className="pl-20 pr-12 py-4">
        {/* Sender and Time Row */}
        <div className="flex items-center justify-between mb-1">
          <span className={`text-sm truncate mr-4 ${
            email.read
              ? 'text-neutral-700 dark:text-neutral-300'
              : 'text-neutral-900 dark:text-white font-bold'
          }`}>
            {senderName}
          </span>
          <span className="text-xs text-neutral-500 dark:text-neutral-400 flex-shrink-0">
            {formatTime(email.date)}
          </span>
        </div>

        {/* Subject */}
        <div className={`text-sm mb-1 truncate ${
          email.read
            ? 'text-neutral-800 dark:text-neutral-200'
            : 'text-neutral-900 dark:text-white font-semibold'
        }`}>
          {email.subject || '(No Subject)'}
        </div>

        {/* Preview with attachment icon */}
        <div className="flex items-start gap-2">
          {hasAttachments && (
            <Paperclip className="w-4 h-4 text-neutral-400 dark:text-neutral-500 flex-shrink-0 mt-0.5" />
          )}
          <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">
            {email.preview || 'No preview'}
          </p>
        </div>

        {/* Labels */}
        {email.labels && email.labels.length > 0 && (
          <div className="flex gap-2 mt-2">
            {email.labels.slice(0, 3).map(label => (
              <span
                key={label._id}
                className="px-2 py-0.5 text-xs font-medium rounded-full bg-neutral-100 dark:bg-neutral-800
                               text-neutral-700 dark:text-neutral-300"
                style={{
                  backgroundColor: label.color ? `${label.color}20` : undefined,
                  color: label.color || undefined
                }}
              >
                {label.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Unread Indicator */}
      {!email.read && (
        <div className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary-500"
             aria-label="Unread email" />
      )}

      {/* Folder Badge */}
      {email.folder !== 'INBOX' && (
        <span className="absolute bottom-2 right-2 px-2 py-1 text-xs font-medium rounded
                         bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
          {email.folder}
        </span>
      )}
    </li>
  );
};

export default EmailItem;
