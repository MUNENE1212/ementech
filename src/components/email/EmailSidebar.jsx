import React, { useState } from 'react';
import {
  Inbox,
  Send,
  FileText,
  Trash2,
  Archive,
  Star,
  Folder,
  FolderPlus,
  Tag,
  Settings,
  Search,
  Plus,
  ChevronDown,
  ChevronRight,
  RefreshCw
} from 'lucide-react';

/**
 * EmailSidebar Component
 *
 * Left sidebar for email navigation with:
 * - System folders (inbox, sent, drafts, trash, archive, starred)
 * - Custom folders
 * - Labels with color coding
 * - Unread counts
 * - Collapsible sections
 * - Compose button
 * - Search functionality
 * - Settings link
 * - Full accessibility
 */
const EmailSidebar = ({
  currentFolder = 'INBOX',
  folders = [],
  labels = [],
  unreadCounts = {},
  onFolderChange,
  onLabelFilter,
  onCompose,
  onSettings,
  onSearch,
  onSync,
  isSyncing = false
}) => {
  const [isFoldersExpanded, setIsFoldersExpanded] = useState(true);
  const [isLabelsExpanded, setIsLabelsExpanded] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const systemFolders = [
    { id: 'INBOX', name: 'Inbox', icon: Inbox, color: 'text-blue-500' },
    { id: 'STARRED', name: 'Starred', icon: Star, color: 'text-yellow-500' },
    { id: 'Sent', name: 'Sent', icon: Send, color: 'text-green-500' },
    { id: 'Drafts', name: 'Drafts', icon: FileText, color: 'text-neutral-500' },
    { id: 'Archive', name: 'Archive', icon: Archive, color: 'text-purple-500' },
    { id: 'Trash', name: 'Trash', icon: Trash2, color: 'text-red-500' }
  ];

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch?.(query);
  };

  const handleKeyDown = (e) => {
    // Keyboard shortcuts for folders
    const folderShortcuts = {
      '1': 'INBOX',
      '2': 'STARRED',
      '3': 'SENT',
      '4': 'DRAFTS',
      '5': 'ARCHIVE',
      '6': 'TRASH'
    };

    if (folderShortcuts[e.key]) {
      e.preventDefault();
      onFolderChange?.(folderShortcuts[e.key]);
    }

    // C to compose
    if (e.key === 'c' || e.key === 'C') {
      if (!e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        onCompose?.();
      }
    }
  };

  return (
    <div
      className="email-sidebar w-64 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-700
                  flex flex-col h-full"
      style={{ position: 'relative', zIndex: 55 }}
      role="navigation"
      aria-label="Email navigation"
      onKeyDown={handleKeyDown}
    >
      {/* Compose Button */}
      <div className="p-4 space-y-2" style={{ position: 'relative', zIndex: 60 }}>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onCompose?.();
          }}
          className="w-full flex items-center justify-center gap-2 px-6 py-3
                     bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600
                     text-white rounded-lg font-semibold shadow-md hover:shadow-lg
                     transition-all cursor-pointer"
          aria-label="Compose new email"
          style={{ position: 'relative', zIndex: 60 }}
        >
          <Plus className="w-5 h-5" />
          <span>Compose</span>
        </button>

        {/* Sync Button */}
        <button
          onClick={() => onSync?.()}
          disabled={isSyncing}
          className={`w-full flex items-center justify-center gap-2 px-4 py-2
                     bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700
                     text-neutral-700 dark:text-neutral-300 rounded-lg font-medium
                     transition-all cursor-pointer ${
                       isSyncing ? 'opacity-70 cursor-wait' : ''
                     }`}
          aria-label="Sync emails"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'Syncing...' : 'Sync Emails'}</span>
        </button>
      </div>

      {/* Search */}
      <div className="px-4 pb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearch}
            className="w-full pl-10 pr-4 py-2 bg-neutral-100 dark:bg-neutral-800
                     border border-neutral-300 dark:border-neutral-600 rounded-lg
                     text-neutral-900 dark:text-white placeholder-neutral-500
                     focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Search emails..."
            aria-label="Search emails"
          />
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* System Folders */}
        <div className="px-2">
          <button
            onClick={() => setIsFoldersExpanded(!isFoldersExpanded)}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-semibold
                       text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800
                       rounded-lg transition-colors"
            aria-expanded={isFoldersExpanded}
            aria-controls="folders-list"
          >
            {isFoldersExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
            <span>Folders</span>
          </button>

          {isFoldersExpanded && (
            <ul id="folders-list" className="mt-1 space-y-1" role="list">
              {systemFolders.map((folder) => {
                const Icon = folder.icon;
                const unreadCount = unreadCounts[folder.id] || 0;
                const isActive = currentFolder === folder.id;

                return (
                  <li key={folder.id}>
                    <button
                      onClick={() => onFolderChange?.(folder.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg
                                 transition-colors ${
                                   isActive
                                     ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                                     : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                                 }`}
                      >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-5 h-5 ${folder.color}`} />
                        <span className="text-sm font-medium">{folder.name}</span>
                      </div>
                      {unreadCount > 0 && (
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            isActive
                              ? 'bg-primary-500 text-white'
                              : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
                          }`}
                        >
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Custom Folders */}
        {folders.length > 0 && (
          <div className="mt-4 px-2">
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                Custom Folders
              </span>
              <button
                onClick={() => {/* Handle create folder */}}
                className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800
                               text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300
                               transition-colors"
                aria-label="Create new folder"
              >
                <FolderPlus className="w-4 h-4" />
              </button>
            </div>

            <ul className="mt-1 space-y-1" role="list">
              {folders.map((folder) => {
                const unreadCount = unreadCounts[folder._id] || 0;
                const isActive = currentFolder === folder._id;

                return (
                  <li key={folder._id}>
                    <button
                      onClick={() => onFolderChange?.(folder._id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg
                                 transition-colors ${
                                   isActive
                                     ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                                     : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                                 }`}
                    >
                      <div className="flex items-center gap-3">
                        <Folder className="w-5 h-5 text-neutral-400" />
                        <span className="text-sm font-medium">{folder.name}</span>
                      </div>
                      {unreadCount > 0 && (
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            isActive
                              ? 'bg-primary-500 text-white'
                              : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
                          }`}
                        >
                          {unreadCount}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Labels */}
        {labels.length > 0 && (
          <div className="mt-4 px-2">
            <button
              onClick={() => setIsLabelsExpanded(!isLabelsExpanded)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm font-semibold
                         text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800
                         rounded-lg transition-colors"
              aria-expanded={isLabelsExpanded}
              aria-controls="labels-list"
            >
              {isLabelsExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              <span>Labels</span>
            </button>

            {isLabelsExpanded && (
              <ul id="labels-list" className="mt-1 space-y-1" role="list">
                {labels.map((label) => (
                  <li key={label._id}>
                    <button
                      onClick={() => onLabelFilter?.(label._id)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg
                                 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800
                                 transition-colors"
                    >
                      <Tag
                        className="w-5 h-5"
                        style={{ color: label.color }}
                      />
                      <span className="text-sm font-medium">{label.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Settings */}
      <div className="p-4 border-t border-neutral-200 dark:border-neutral-700">
        <button
          onClick={() => onSettings?.()}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg
                     text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800
                     transition-colors"
        >
          <Settings className="w-5 h-5 text-neutral-400" />
          <span className="text-sm font-medium">Settings</span>
        </button>
      </div>

      {/* Keyboard Shortcuts Help */}
      <div className="px-4 pb-4 text-xs text-neutral-500 dark:text-neutral-400">
        <p className="font-semibold mb-1">Shortcuts:</p>
        <div className="space-y-0.5">
          <div><kbd className="px-1 bg-neutral-100 dark:bg-neutral-800 rounded">C</kbd> Compose</div>
          <div><kbd className="px-1 bg-neutral-100 dark:bg-neutral-800 rounded">1-6</kbd> Folders</div>
        </div>
      </div>
    </div>
  );
};

export default EmailSidebar;
