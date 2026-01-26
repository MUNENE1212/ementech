import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Menu, ArrowLeft } from 'lucide-react';
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
 * - Responsive design for mobile and desktop
 * - Collapsible sidebar on mobile
 * - Full keyboard navigation
 * - Email list and reader views
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
    syncing,
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
  const [mobileView, setMobileView] = useState('list'); // 'list' or 'detail'

  // Refs
  const skipLinkRef = useRef(null);
  const mainContentRef = useRef(null);

  /**
   * Set folder from URL params
   */
  useEffect(() => {
    if (folderParam) {
      const folderUpper = folderParam.toUpperCase();
      setCurrentFolder(folderUpper);
    } else {
      setCurrentFolder('INBOX');
    }
  }, [folderParam, setCurrentFolder]);

  /**
   * Calculate unread counts
   */
  useEffect(() => {
    const counts = {
      'INBOX': emails.filter(e => e.folder === 'INBOX' && !e.isRead).length,
      'STARRED': emails.filter(e => e.isFlagged && !e.isRead).length,
      'SENT': 0,
      'DRAFTS': emails.filter(e => e.folder === 'Drafts' && !e.isRead).length,
      'ARCHIVE': emails.filter(e => e.folder === 'Archive' && !e.isRead).length,
      'TRASH': emails.filter(e => e.folder === 'Trash' && !e.isRead).length
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
        } else if (selectedEmailId && window.innerWidth >= 1024) {
          setSelectedEmailId(null);
        } else if (mobileView === 'detail') {
          setMobileView('list');
          setSelectedEmailId(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showComposer, selectedEmailId, mobileView]);

  /**
   * Handle email click
   */
  const handleEmailClick = (email) => {
    setSelectedEmailId(email._id);
    // On mobile, switch to detail view
    if (window.innerWidth < 1024) {
      setMobileView('detail');
    }
  };

  /**
   * Handle back to list (mobile)
   */
  const handleBackToList = () => {
    setMobileView('list');
    setSelectedEmailId(null);
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

    const folderId = folder.toUpperCase();
    setCurrentFolder(folderId);
    setSelectedEmailId(null);
    setSelectedEmails([]);
    setMobileView('list');
    setIsSidebarOpen(false);
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
    setShowComposer(true);
    setIsSidebarOpen(false);
  };

  /**
   * Handle sync
   */
  const handleSync = async () => {
    try {
      await syncEmails(currentFolder);
    } catch (err) {
      console.error('Failed to sync emails:', err);
    }
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
    const fromEmail = typeof email.from === 'object' ? email.from?.email || '' : email.from;
    setComposerData({
      to: fromEmail,
      subject: `Re: ${email.subject}`,
      body: `\n\n--- Original Message ---\nFrom: ${typeof email.from === 'object' ? email.from?.name : email.from}\nDate: ${email.date}\nSubject: ${email.subject}\n\n${email.textBody || email.htmlBody || ''}`,
      cc: '',
      bcc: '',
      attachments: []
    });
    setShowComposer(true);
    setMobileView('list');
  };

  /**
   * Handle reply all
   */
  const handleReplyAll = (email) => {
    const fromEmail = typeof email.from === 'object' ? email.from?.email || '' : email.from;
    const toEmails = email.to?.map(t => typeof t === 'object' ? t?.email || '' : t).filter(Boolean) || [];
    const ccEmails = email.cc?.map(c => typeof c === 'object' ? c?.email || '' : c).filter(Boolean) || [];

    const allRecipients = [
      fromEmail,
      ...toEmails,
      ...ccEmails
    ].filter(email => email && email.trim() !== '');

    setComposerData({
      to: fromEmail,
      subject: `Re: ${email.subject}`,
      body: `\n\n--- Original Message ---\nFrom: ${typeof email.from === 'object' ? email.from?.name : email.from}\nDate: ${email.date}\nSubject: ${email.subject}\n\n${email.textBody || email.htmlBody || ''}`,
      cc: ccEmails.join(', '),
      bcc: '',
      attachments: []
    });
    setShowComposer(true);
    setMobileView('list');
  };

  /**
   * Handle forward
   */
  const handleForward = (email) => {
    setComposerData({
      to: '',
      subject: `Fwd: ${email.subject}`,
      body: `\n\n--- Forwarded Message ---\nFrom: ${typeof email.from === 'object' ? email.from?.name : email.from}\nDate: ${email.date}\nSubject: ${email.subject}\n\n${email.textBody || email.htmlBody || ''}`,
      cc: '',
      bcc: '',
      attachments: email.attachments || []
    });
    setShowComposer(true);
    setMobileView('list');
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
        setMobileView('list');
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
      setMobileView('list');
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
      setMobileView('list');
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
        setMobileView('list');
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
      setMobileView('list');
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

  const isMobile = window.innerWidth < 1024;

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
        className="email-inbox-container h-screen flex flex-col bg-white dark:bg-neutral-900"
        style={{ position: 'relative', zIndex: 51 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        role="application"
        aria-label="Email Inbox"
      >
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900">
          <div className="flex items-center gap-3">
            {mobileView === 'detail' ? (
              <button
                onClick={handleBackToList}
                className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
                aria-label="Back to emails"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
                aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
                aria-expanded={isSidebarOpen}
              >
                {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}
            <h1 className="text-lg font-semibold text-neutral-900 dark:text-white">
              {mobileView === 'detail' ? 'Email' : currentFolder}
            </h1>
          </div>
          {mobileView === 'list' && (
            <button
              onClick={handleCompose}
              className="px-4 py-2 bg-primary-500 text-white rounded-lg font-medium text-sm"
              aria-label="Compose new email"
            >
              Compose
            </button>
          )}
        </header>

        {/* Main Layout */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar - Mobile Overlay, Desktop Fixed */}
          {isSidebarOpen && (
            <>
              <div
                className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                onClick={() => setIsSidebarOpen(false)}
                aria-hidden="true"
              />
              <aside
                className="fixed inset-y-0 left-0 z-50 w-72 lg:hidden"
                aria-label="Email navigation"
              >
                <EmailSidebar
                  currentFolder={currentFolder}
                  folders={folders}
                  labels={labels}
                  unreadCounts={unreadCounts}
                  onFolderChange={(f) => {
                    handleFolderChange(f);
                  }}
                  onLabelFilter={(labelId) => {
                    console.log('Filter by label:', labelId);
                  }}
                  onCompose={handleCompose}
                  onSettings={handleSettings}
                  onSearch={handleSearch}
                  onSync={handleSync}
                  isSyncing={syncing}
                />
              </aside>
            </>
          )}

          {/* Desktop Sidebar - Always Visible */}
          <aside
            className="hidden lg:block w-64 bg-neutral-50 dark:bg-neutral-800 border-r border-neutral-200 dark:border-neutral-700"
            aria-label="Email navigation"
          >
            <EmailSidebar
              currentFolder={currentFolder}
              folders={folders}
              labels={labels}
              unreadCounts={unreadCounts}
              onFolderChange={handleFolderChange}
              onLabelFilter={(labelId) => {
                console.log('Filter by label:', labelId);
              }}
              onCompose={handleCompose}
              onSettings={handleSettings}
              onSearch={handleSearch}
              onSync={handleSync}
              isSyncing={syncing}
            />
          </aside>

          {/* Main Content */}
          <main
            ref={mainContentRef}
            className="flex-1 flex flex-col min-w-0 overflow-hidden"
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
              {/* Email List - Always visible on desktop, toggles on mobile */}
              <div className={`${isMobile ? (mobileView === 'list' ? 'flex-1' : 'hidden') : selectedEmailId ? 'w-1/2' : 'flex-1'} overflow-hidden flex flex-col`}>
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

              {/* Email Reader - Visible on desktop when email selected, on mobile when in detail view */}
              <div className={`${isMobile ? (mobileView === 'detail' ? 'flex-1' : 'hidden') : selectedEmailId ? 'w-1/2' : 'hidden'} overflow-hidden`}>
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
                className="w-full max-w-3xl bg-white dark:bg-neutral-900 rounded-lg shadow-xl max-h-[90vh] overflow-hidden flex flex-col"
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
