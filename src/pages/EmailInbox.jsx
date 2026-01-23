import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Menu } from 'lucide-react';
import { useEmail } from '../contexts/EmailContext';
import EmailList from '../components/email/EmailList';
import EmailReader from '../components/email/EmailReader';
import EmailSidebar from '../components/email/EmailSidebar';
import EmailToolbar from '../components/email/EmailToolbar';
import EmailComposer from '../components/email/EmailComposer';
import '../styles/email.css';

/**
 * EmailInbox Page
 *
 * Main email interface with:
 * - All 6 email components integrated
 * - WCAG 2.1 AA accessibility
 * - Real-time Socket.IO updates
 * - Full keyboard navigation
 * - Mobile-responsive design
 */
const EmailInbox = () => {
  const navigate = useNavigate();
  const { folder: folderParam } = useParams();
  const {
    emails,
    folders,
    labels,
    currentFolder,
    selectedEmails,
    loading,
    error,
    searchQuery,
    setCurrentFolder,
    setSelectedEmails,
    setSearchQuery,
    syncEmails,
    deleteMultipleEmails,
    markMultipleAsRead,
    toggleStarMultiple,
    moveToFolder,
    addLabelToEmails,
    sendEmail,
    saveDraft
  } = useEmail();

  // Local state
  const [selectedEmailId, setSelectedEmailId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showComposer, setShowComposer] = useState(false);
  const [composerData, setComposerData] = useState({
    to: '',
    subject: '',
    body: '',
    cc: '',
    bcc: '',
    attachments: []
  });
  const [unreadCounts, setUnreadCounts] = useState({});

  // Refs
  const skipLinkRef = useRef(null);
  const mainContentRef = useRef(null);

  /**
   * Set folder from URL params
   */
  useEffect(() => {
    if (folderParam) {
      setCurrentFolder(folderParam.toUpperCase());
    } else {
      setCurrentFolder('INBOX');
    }
  }, [folderParam, setCurrentFolder]);

  /**
   * Calculate unread counts
   */
  useEffect(() => {
    const counts = {
      'INBOX': emails.filter(e => e.folder === 'INBOX' && !e.read).length,
      'STARRED': emails.filter(e => e.starred && !e.read).length,
      'SENT': 0,
      'DRAFTS': emails.filter(e => e.folder === 'DRAFTS' && !e.read).length,
      'ARCHIVE': emails.filter(e => e.folder === 'ARCHIVE' && !e.read).length,
      'TRASH': emails.filter(e => e.folder === 'TRASH' && !e.read).length
    };

    folders.forEach(folder => {
      counts[folder._id] = folder.unreadCount || 0;
    });

    setUnreadCounts(counts);
  }, [emails, folders]);

  /**
   * Handle keyboard shortcuts
   */
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + K: Focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.querySelector('[aria-label="Search emails"]')?.focus();
      }

      // Escape: Close composer or deselect
      if (e.key === 'Escape') {
        if (showComposer) {
          if (window.confirm('Discard this email?')) {
            setShowComposer(false);
            setComposerData({
              to: '',
              subject: '',
              body: '',
              cc: '',
              bcc: '',
              attachments: []
            });
          }
        } else if (selectedEmailId) {
          setSelectedEmailId(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showComposer, selectedEmailId]);

  /**
   * Get selected email objects
   */
  const getSelectedEmailObjects = () => {
    return emails.filter(email => selectedEmails.includes(email._id));
  };

  /**
   * Handle email click
   */
  const handleEmailClick = (email) => {
    setSelectedEmailId(email._id);
  };

  /**
   * Handle multi-select
   */
  const handleMultiSelect = (emailIds) => {
    setSelectedEmails(prev => {
      const newSet = new Set([...prev, ...emailIds]);
      return Array.from(newSet);
    });
  };

  /**
   * Handle folder change
   */
  const handleFolderChange = (folder) => {
    if (!folder) {
      console.error('handleFolderChange called with undefined folder');
      return;
    }

    // folder is already a string (folder.id or folder._id from sidebar)
    const folderId = folder.toUpperCase();

    setCurrentFolder(folderId);
    setSelectedEmailId(null);
    setSelectedEmails([]);
    navigate(`/email/${folderId.toLowerCase()}`);
  };

  /**
   * Handle search
   */
  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  /**
   * Handle compose
   */
  const handleCompose = () => {
    console.log('Compose button clicked - setting showComposer to true');
    setShowComposer(true);
  };

  /**
   * Handle send email
   */
  const handleSendEmail = async (emailData) => {
    try {
      await sendEmail(emailData);
      setShowComposer(false);
      setComposerData({
        to: '',
        subject: '',
        body: '',
        cc: '',
        bcc: '',
        attachments: []
      });
    } catch (error) {
      console.error('Failed to send email:', error);
      alert('Failed to send email. Please try again.');
    }
  };

  /**
   * Handle save draft
   */
  const handleSaveDraft = async (emailData) => {
    try {
      await saveDraft(emailData);
    } catch (error) {
      console.error('Failed to save draft:', error);
    }
  };

  /**
   * Handle reply
   */
  const handleReply = (email) => {
    setComposerData({
      to: email.from,
      subject: `Re: ${email.subject}`,
      body: `\n\n--- Original Message ---\nFrom: ${email.from}\nDate: ${email.date}\nSubject: ${email.subject}\n\n${email.body}`,
      cc: '',
      bcc: '',
      attachments: []
    });
    setShowComposer(true);
  };

  /**
   * Handle reply all
   */
  const handleReplyAll = (email) => {
    const allRecipients = [
      email.from,
      ...(email.to || []),
      ...(email.cc || [])
    ].filter(email => email && typeof email === 'string' && email.trim() !== '');

    setComposerData({
      to: allRecipients.join(', '),
      subject: `Re: ${email.subject}`,
      body: `\n\n--- Original Message ---\nFrom: ${email.from}\nDate: ${email.date}\nSubject: ${email.subject}\n\n${email.body}`,
      cc: '',
      bcc: '',
      attachments: []
    });
    setShowComposer(true);
  };

  /**
   * Handle forward
   */
  const handleForward = (email) => {
    setComposerData({
      to: '',
      subject: `Fwd: ${email.subject}`,
      body: `\n\n--- Forwarded Message ---\nFrom: ${email.from}\nDate: ${email.date}\nSubject: ${email.subject}\n\n${email.body}`,
      cc: '',
      bcc: '',
      attachments: email.attachments || []
    });
    setShowComposer(true);
  };

  /**
   * Handle delete
   */
  const handleDelete = async (email) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete this email?`
    );

    if (confirmed) {
      await deleteMultipleEmails([email._id]);
      if (selectedEmailId === email._id) {
        setSelectedEmailId(null);
      }
    }
  };

  /**
   * Handle archive
   */
  const handleArchive = async (email) => {
    await moveToFolder([email._id], 'ARCHIVE');
    if (selectedEmailId === email._id) {
      setSelectedEmailId(null);
    }
  };

  /**
   * Handle toggle star
   */
  const handleToggleStar = async (email) => {
    await toggleStarMultiple([email._id]);
  };

  /**
   * Handle toolbar actions
   */
  const handleToolbarArchive = async (emailIds) => {
    await moveToFolder(emailIds, 'ARCHIVE');
    setSelectedEmails([]);
    if (selectedEmailId && emailIds.includes(selectedEmailId)) {
      setSelectedEmailId(null);
    }
  };

  const handleToolbarDelete = async (emailIds) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${emailIds.length} email${emailIds.length > 1 ? 's' : ''}?`
    );

    if (confirmed) {
      await deleteMultipleEmails(emailIds);
      setSelectedEmails([]);
      if (selectedEmailId && emailIds.includes(selectedEmailId)) {
        setSelectedEmailId(null);
      }
    }
  };

  const handleToolbarMarkRead = async (emailIds) => {
    await markMultipleAsRead(emailIds, true);
    setSelectedEmails([]);
  };

  const handleToolbarMarkUnread = async (emailIds) => {
    await markMultipleAsRead(emailIds, false);
    setSelectedEmails([]);
  };

  const handleToolbarToggleStar = async (emailIds) => {
    await toggleStarMultiple(emailIds);
  };

  const handleToolbarAddLabel = async (emailIds, labelId) => {
    await addLabelToEmails(emailIds, labelId);
    setSelectedEmails([]);
  };

  const handleToolbarMoveToFolder = async (emailIds, folderId) => {
    await moveToFolder(emailIds, folderId);
    setSelectedEmails([]);
    if (selectedEmailId && emailIds.includes(selectedEmailId)) {
      setSelectedEmailId(null);
    }
  };

  /**
   * Handle settings navigation
   */
  const handleSettings = () => {
    navigate('/settings');
  };

  /**
   * Get selected email object
   */
  const selectedEmail = emails.find(e => e._id === selectedEmailId);

  return (
    <>
      {/* Skip to main content link for accessibility */}
      <a
        ref={skipLinkRef}
        href="#main-content"
        className="skip-link"
        onClick={(e) => {
          e.preventDefault();
          mainContentRef.current?.focus();
        }}
      >
        Skip to main content
      </a>

      <motion.div
        className="email-inbox-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        role="application"
        aria-label="Email Inbox"
      >
        {/* Mobile Header */}
        <header className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700 px-4 py-3 flex items-center justify-between lg:hidden">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800"
            aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            aria-expanded={isSidebarOpen}
          >
            {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <h1 className="text-lg font-semibold text-neutral-900 dark:text-white">
            {currentFolder}
          </h1>
          <div className="w-10" />
        </header>

        {/* Main Layout */}
        <div className="flex h-[calc(100vh-64px)]">
          {/* Sidebar */}
          <aside
            className={`${isSidebarOpen ? 'block' : 'hidden'} lg:block fixed lg:relative z-30 w-64 h-full`}
            aria-label="Email navigation"
          >
            <EmailSidebar
              currentFolder={currentFolder}
              folders={folders}
              labels={labels}
              unreadCounts={unreadCounts}
              onFolderChange={handleFolderChange}
              onLabelFilter={(labelId) => {
                // Filter by label
                console.log('Filter by label:', labelId);
              }}
              onCompose={handleCompose}
              onSettings={handleSettings}
              onSearch={handleSearch}
            />
          </aside>

          {/* Main Content */}
          <main
            ref={mainContentRef}
            className="flex-1 flex flex-col min-w-0"
            role="main"
            id="main-content"
            tabIndex={-1}
          >
            {/* Toolbar */}
            {selectedEmails.length > 0 && (
              <EmailToolbar
                selectedEmails={selectedEmails}
                onArchive={handleToolbarArchive}
                onDelete={handleToolbarDelete}
                onMarkRead={handleToolbarMarkRead}
                onMarkUnread={handleToolbarMarkUnread}
                onToggleStar={handleToolbarToggleStar}
                onAddLabel={handleToolbarAddLabel}
                onMoveToFolder={handleToolbarMoveToFolder}
                folders={folders}
                labels={labels}
              />
            )}

            {/* Content Area */}
            <div className="flex-1 flex overflow-hidden">
              {/* Email List */}
              <div className={`${selectedEmailId ? 'hidden lg:block lg:w-1/2' : 'w-full'}`}>
                {error && (
                  <div className="m-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400" role="alert">
                    {error}
                  </div>
                )}

                <EmailList
                  emails={emails}
                  loading={loading}
                  selectedEmails={selectedEmails}
                  onEmailSelect={handleEmailClick}
                  onMultiSelect={handleMultiSelect}
                  searchQuery={searchQuery}
                  folder={currentFolder}
                />
              </div>

              {/* Email Reader */}
              <div className={`${selectedEmailId ? 'block lg:w-1/2' : 'hidden lg:block'}`}>
                <EmailReader
                  email={selectedEmail}
                  loading={loading}
                  onReply={handleReply}
                  onReplyAll={handleReplyAll}
                  onForward={handleForward}
                  onDelete={handleDelete}
                  onArchive={handleArchive}
                  onToggleStar={handleToggleStar}
                  onDownload={(attachment) => {
                    console.log('Download attachment:', attachment);
                  }}
                />
              </div>
            </div>
          </main>
        </div>

        {/* Email Composer Modal */}
        <AnimatePresence>
          {showComposer && (
            <motion.div
              className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setShowComposer(false);
                }
              }}
            >
              <motion.div
                className="w-full max-w-3xl bg-white dark:bg-neutral-900 rounded-lg shadow-xl"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
                <EmailComposer
                  {...composerData}
                  onSend={handleSendEmail}
                  onSaveDraft={handleSaveDraft}
                  onDiscard={() => {
                    setShowComposer(false);
                    setComposerData({
                      to: '',
                      subject: '',
                      body: '',
                      cc: '',
                      bcc: '',
                      attachments: []
                    });
                  }}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
};

export default EmailInbox;
