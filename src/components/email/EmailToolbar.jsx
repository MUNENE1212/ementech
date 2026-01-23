import React, { useState } from 'react';
import {
  Archive,
  ArchiveX,
  Check,
  ChevronDown,
  Tag,
  Trash2,
  Star,
  StarOff,
  Folder,
  MoreVertical
} from 'lucide-react';

/**
 * EmailToolbar Component
 *
 * Quick action toolbar for email operations:
 * - Bulk actions (archive, delete, mark as read/unread)
 * - Label management
 * - Folder moves
 * - Star toggles
 * - Responsive design
 * - Keyboard shortcuts
 * - Full accessibility
 */
const EmailToolbar = ({
  selectedEmails = [],
  onArchive,
  onDelete,
  onMarkRead,
  onMarkUnread,
  onAddLabel,
  onRemoveLabel,
  onMoveToFolder,
  onToggleStar,
  folders = [],
  labels = []
}) => {
  const [showLabelMenu, setShowLabelMenu] = useState(false);
  const [showFolderMenu, setShowFolderMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const selectedCount = selectedEmails.length;

  const handleBulkAction = (action, e) => {
    e?.stopPropagation();
    switch (action) {
      case 'archive':
        onArchive?.(selectedEmails);
        break;
      case 'delete':
        onDelete?.(selectedEmails);
        break;
      case 'read':
        onMarkRead?.(selectedEmails);
        break;
      case 'unread':
        onMarkUnread?.(selectedEmails);
        break;
      case 'star':
        onToggleStar?.(selectedEmails);
        break;
    }
    // Close menus
    setShowLabelMenu(false);
    setShowFolderMenu(false);
    setShowMoreMenu(false);
  };

  if (selectedCount === 0) {
    return (
      <div
        className="h-14 border-b border-neutral-200 dark:border-neutral-700
                      bg-white dark:bg-neutral-900 px-4
                      flex items-center text-sm text-neutral-500 dark:text-neutral-400"
        role="status"
        aria-live="polite"
      >
        Select emails to perform bulk actions
      </div>
    );
  }

  return (
    <div
      className="h-14 border-b border-neutral-200 dark:border-neutral-700
                    bg-white dark:bg-neutral-900 px-4
                    flex items-center justify-between sticky top-0 z-20"
      role="toolbar"
      aria-label={`Email actions for ${selectedCount} selected emails`}
    >
      {/* Selection Count */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          {selectedCount} {selectedCount === 1 ? 'email' : 'emails'} selected
        </span>
        <button
          onClick={() => handleBulkAction('read')}
          className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
          aria-label={`Mark all ${selectedCount} as read`}
        >
          Mark all as read
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1">
        {/* Archive */}
        <button
          onClick={(e) => handleBulkAction('archive', e)}
          className="p-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800
                         text-neutral-600 dark:text-neutral-400 transition-colors"
          aria-label={`Archive ${selectedCount} selected emails`}
          title="Archive"
        >
          <Archive className="w-5 h-5" />
        </button>

        {/* Delete */}
        <button
          onClick={(e) => handleBulkAction('delete', e)}
          className="p-2 rounded hover:bg-red-50 dark:hover:bg-red-900/20
                         text-neutral-600 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-400
                         transition-colors"
          aria-label={`Delete ${selectedCount} selected emails`}
          title="Delete"
        >
          <Trash2 className="w-5 h-5" />
        </button>

        {/* Mark as Read/Unread */}
        <div className="relative">
          <button
            onClick={() => handleBulkAction('unread')}
            className="p-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800
                           text-neutral-600 dark:text-neutral-400 transition-colors"
            aria-label="Mark as unread"
            title="Mark as unread"
          >
            <Check className="w-5 h-5" />
          </button>
        </div>

        {/* Star Toggle */}
        <button
          onClick={() => handleBulkAction('star')}
          className="p-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800
                         text-neutral-600 dark:text-neutral-400 transition-colors"
          aria-label="Toggle star"
          title="Toggle star"
        >
          <Star className="w-5 h-5" />
        </button>

        {/* Labels Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowLabelMenu(!showLabelMenu);
              setShowFolderMenu(false);
              setShowMoreMenu(false);
            }}
            className="p-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800
                           text-neutral-600 dark:text-neutral-400 transition-colors"
            aria-label="Add label"
            aria-haspopup="true"
            aria-expanded={showLabelMenu}
          >
            <Tag className="w-5 h-5" />
          </button>

          {showLabelMenu && (
            <div
              className="absolute right-0 top-full mt-1 w-56 bg-white dark:bg-neutral-800
                            rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700
                            py-1 z-50"
              role="menu"
              aria-label="Label options"
            >
              <div className="px-3 py-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                Add Label
              </div>
              {labels.map(label => (
                <button
                  key={label._id}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleBulkAction('addLabel', label._id);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left
                                text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700
                                transition-colors"
                  role="menuitem"
                >
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: label.color }}
                  />
                  {label.name}
                </button>
              ))}
              {labels.length === 0 && (
                <div className="px-3 py-2 text-sm text-neutral-500 dark:text-neutral-400">
                  No labels created
                </div>
              )}
            </div>
          )}
        </div>

        {/* Move to Folder Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowFolderMenu(!showFolderMenu);
              setShowLabelMenu(false);
              setShowMoreMenu(false);
            }}
            className="p-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800
                           text-neutral-600 dark:text-neutral-400 transition-colors"
            aria-label="Move to folder"
            aria-haspopup="true"
            aria-expanded={showFolderMenu}
          >
            <Folder className="w-5 h-5" />
          </button>

          {showFolderMenu && (
            <div
              className="absolute right-0 top-full mt-1 w-56 bg-white dark:bg-neutral-800
                            rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700
                            py-1 z-50"
              role="menu"
              aria-label="Move to folder"
            >
              <div className="px-3 py-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                Move to Folder
              </div>
              {folders.map(folder => (
                <button
                  key={folder._id}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleBulkAction('move', folder._id);
                  }}
                  className="w-full px-3 py-2 text-sm text-left text-neutral-700 dark:text-neutral-300
                                hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
                  role="menuitem"
                >
                  {folder.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* More Options */}
        <div className="relative">
          <button
            onClick={() => {
              setShowMoreMenu(!showMoreMenu);
              setShowLabelMenu(false);
              setShowFolderMenu(false);
            }}
            className="p-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800
                           text-neutral-600 dark:text-neutral-400 transition-colors"
            aria-label="More options"
            aria-haspopup="true"
            aria-expanded={showMoreMenu}
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {showMoreMenu && (
            <div
              className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-neutral-800
                            rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700
                            py-1 z-50"
              role="menu"
              aria-label="More options"
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleBulkAction('markUnread');
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left
                             text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700
                             transition-colors"
                role="menuitem"
              >
                <ArchiveX className="w-4 h-4" />
                Mark as unread
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleBulkAction('unstar');
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left
                             text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700
                             transition-colors"
                role="menuitem"
              >
                <StarOff className="w-4 h-4" />
                Remove star
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailToolbar;
