# Email System UI/UX Specification

**Version**: 1.0
**Last Updated**: 2026-01-21
**Target Audience**: UI/UX Designers, Frontend Developers
**Priority**: High (Core Feature)

---

## Table of Contents

1. [Overview](#overview)
2. [User Stories & Requirements](#user-stories--requirements)
3. [Information Architecture](#information-architecture)
4. [Component Hierarchy](#component-hierarchy)
5. [Component Specifications](#component-specifications)
6. [State Management](#state-management)
7. [API Integration](#api-integration)
8. [Real-time Features](#real-time-features)
9. [User Flows](#user-flows)
10. [Responsive Design](#responsive-design)
11. [Accessibility](#accessibility)
12. [Design Guidelines](#design-guidelines)

---

## 1. Overview

### 1.1 Purpose

Build a modern, Gmail-like email client interface integrated with the EmenTech backend via IMAP/SMTP and real-time updates via Socket.IO.

### 1.2 Key Features

- Real-time email synchronization (Socket.IO)
- Full email management (read, compose, reply, forward, delete)
- Folder navigation (Inbox, Sent, Drafts, Trash, Spam, Archive)
- Label system for categorization
- Threaded conversations
- Attachment handling
- Full-text search
- Mobile-responsive design
- Offline support (cached in MongoDB)

### 1.3 Technical Constraints

- **Frontend**: React 19, TypeScript, TailwindCSS, Framer Motion
- **State**: React Context (EmailContext)
- **Real-time**: Socket.IO Client
- **API**: REST endpoints (20+ endpoints available)
- **Icons**: Lucide React, React Icons

---

## 2. User Stories & Requirements

### 2.1 Primary User Stories

**As a user, I want to:**

1. **View my emails** organized by folder so I can manage my communications
2. **Compose new emails** with rich text formatting so I can communicate professionally
3. **Reply to and forward emails** so I can respond to incoming messages
4. **Organize emails** with labels and folders so I can keep track of important messages
5. **Search emails** by keyword, sender, subject so I can find specific messages
6. **Manage attachments** by uploading, downloading, and previewing files
7. **Star important emails** so I can easily find them later
8. **Delete emails** and move them to trash so I can keep my inbox clean
9. **Receive real-time notifications** when new emails arrive so I can respond quickly
10. **View threaded conversations** so I can see the entire email chain

### 2.2 Acceptance Criteria

- Email list loads within 2 seconds
- Real-time emails appear within 3 seconds of arrival
- Search returns results within 1 second
- Compose/send completes within 3 seconds
- Attachments up to 25MB supported
- All actions work offline (with sync on reconnect)
- Mobile interface fully functional

---

## 3. Information Architecture

### 3.1 Application Structure

```
Email System
│
├── Sidebar (Left Panel)
│   ├── Compose Button (Primary CTA)
│   ├── Folder List
│   │   ├── Inbox (with unread count)
│   │   ├── Sent
│   │   ├── Drafts
│   │   ├── Trash
│   │   ├── Spam
│   │   └── Archive
│   └── Labels Section
│       ├── Label 1 (count)
│       ├── Label 2 (count)
│       └── + Create Label
│
├── Email List (Middle Panel)
│   ├── Search Bar
│   ├── Filter Toolbar
│   │   ├── All / Unread toggle
│   │   ├── Starred filter
│   │   ├── Label filter
│   │   └── Sort options
│   ├── Bulk Actions Bar
│   │   ├── Select All checkbox
│   │   ├── Mark Read/Unread
│   │   ├── Add Label
│   │   ├── Move to Folder
│   │   └── Delete
│   └── Email Items (Scrollable)
│       ├── Checkbox
│       ├── Star icon
│       ├── Sender
│       ├── Subject (with unread bold)
│       ├── Preview text
│       ├── Date
│       ├── Labels (badges)
│       └── Attachment icon
│
└── Email Detail (Right Panel / Full View)
    ├── Email Toolbar
    │   ├── Back to list
    │   ├── Archive
    │   ├── Spam
    │   ├── Delete
    │   ├── Mark Unread
    │   ├── Add Label
    │   └── More actions (menu)
    ├── Thread View
    │   ├── Thread header (participants, date)
    │   └── Email cards (chronological)
    │       ├── Sender avatar
    │       ├── Sender info
    │       ├── Recipient info
    │       ├── Subject
    │       ├── Body (HTML)
    │       ├── Attachments list
    │       └── Quick actions
    └── Reply Box
        ├── Reply / Reply All buttons
        └── Rich text editor
```

### 3.2 Responsive Layout Strategy

**Desktop (1024px+)**:
- Three-column layout (Sidebar | Email List | Email Detail)

**Tablet (768px - 1023px)**:
- Two-column layout (Collapsible Sidebar | Email List / Email Detail)
- Slide panel for email detail

**Mobile (<768px)**:
- Single-column layout
- Navigation drawer for sidebar
- Full-screen email detail view
- Bottom navigation bar

---

## 4. Component Hierarchy

```
EmailInbox (Page)
│
├── EmailLayout
│   ├── EmailSidebar
│   │   ├── ComposeButton
│   │   ├── FolderList
│   │   │   └── FolderItem
│   │   └── LabelList
│   │       ├── LabelItem
│   │       └── CreateLabelModal
│   │
│   ├── EmailList
│   │   ├── EmailSearchBar
│   │   ├── EmailFilterToolbar
│   │   ├── BulkActionBar (conditional)
│   │   ├── EmailListItems (Scrollable)
│   │   │   └── EmailItem (repeated)
│   │   └── EmailListPagination
│   │
│   └── EmailDetail (conditional)
│       ├── EmailToolbar
│       ├── ThreadHeader
│       ├── ThreadView
│       │   └── EmailCard (repeated)
│       ├── AttachmentList
│       └── ReplyBox
│           └── RichTextEditor
│
└── ComposeEmailModal (Overlay)
    ├── ComposeHeader
    ├── ComposeForm
    │   ├── ToField (with autocomplete)
    │   ├── CcField (toggle)
    │   ├── BccField (toggle)
    │   ├── SubjectField
    │   ├── RichTextEditor
    │   └── AttachmentUploader
    └── ComposeFooter
        ├── SaveDraft
        ├── Discard
        └── Send
```

---

## 5. Component Specifications

### 5.1 EmailLayout Component

**Purpose**: Container component for email interface

**Props**:
```typescript
interface EmailLayoutProps {
  children: React.ReactNode;
}
```

**State**: None (layout only)

**Responsibilities**:
- Three-column layout management
- Responsive breakpoint handling
- Slide panel animations (Framer Motion)

**Layout**:
```
┌──────────────────────────────────────────────────────────┐
│  EmailLayout                                             │
│  ┌─────────┬──────────────────┬─────────────────────┐    │
│  │ Sidebar │   Email List     │   Email Detail      │    │
│  │ (250px) │   (400px)        │   (Flex/Full)       │    │
│  │         │                  │                     │    │
│  │ Fixed   │  Scrollable      │  Scrollable         │    │
│  └─────────┴──────────────────┴─────────────────────┘    │
└──────────────────────────────────────────────────────────┘
```

**Styling**: TailwindCSS Grid/Flexbox

---

### 5.2 EmailSidebar Component

**Purpose**: Navigation for folders and labels

**Props**:
```typescript
interface EmailSidebarProps {
  folders: Folder[];
  labels: Label[];
  currentFolder: string;
  onFolderChange: (folder: string) => void;
}
```

**State**:
```typescript
{
  isCollapsed: boolean;
  showCreateLabel: boolean;
}
```

**Features**:
- Collapsible sidebar (desktop)
- Drawer navigation (mobile)
- Unread count badges
- Active folder highlighting
- Label color indicators
- Create label button

**Component Structure**:
```tsx
<EmailSidebar>
  {/* Compose Button - Primary CTA */}
  <ComposeButton onClick={openCompose} />

  {/* Folder List */}
  <FolderList>
    {folders.map(folder => (
      <FolderItem
        key={folder.name}
        name={folder.name}
        unreadCount={folder.unreadCount}
        isActive={currentFolder === folder.name}
        onClick={() => onFolderChange(folder.name)}
        icon={getFolderIcon(folder.name)}
      />
    ))}
  </FolderList>

  {/* Labels Section */}
  <LabelsSection>
    <LabelsHeader>
      Labels
      <AddLabelIcon onClick={openCreateLabel} />
    </LabelsHeader>
    <LabelList>
      {labels.map(label => (
        <LabelItem
          key={label._id}
          name={label.name}
          color={label.color}
          count={label.emailCount}
        />
      ))}
    </LabelList>
  </LabelsSection>
</EmailSidebar>
```

**Icons** (Lucide React):
- Inbox: `Inbox`
- Sent: `Send`
- Drafts: `File`
- Trash: `Trash2`
- Spam: `AlertOctagon`
- Archive: `Archive`
- Label: `Tag`

**Styling**:
- Background: Dark (bg-dark-900)
- Active item: bg-dark-800 with accent border
- Hover: bg-dark-800
- Text: gray-200 (inactive), white (active)
- Unread badge: Accent color (blue-500) circle

---

### 5.3 FolderItem Component

**Purpose**: Individual folder navigation item

**Props**:
```typescript
interface FolderItemProps {
  name: string;
  unreadCount: number;
  isActive: boolean;
  onClick: () => void;
  icon: LucideIcon;
}
```

**Visual Design**:
```
┌─────────────────────────────────────┐
│ [📧] Inbox            [12] (badge)  │ <- Active state
│     (accent border on left)          │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ [📤] Sent                           │ <- Inactive state
└─────────────────────────────────────┘
```

**States**:
- Default: Gray text, no border
- Hover: bg-dark-800
- Active: White text, accent border-left (4px)
- Unread badge: Blue circle with count

**Interactions**:
- Click: Switch folder
- Long press (mobile): Show folder options

---

### 5.4 EmailList Component

**Purpose**: List of emails in current folder

**Props**:
```typescript
interface EmailListProps {
  emails: Email[];
  loading: boolean;
  hasMore: boolean;
  selectedEmails: Set<string>;
  onEmailSelect: (id: string) => void;
  onEmailClick: (email: Email) => void;
  onLoadMore: () => void;
}
```

**State**:
```typescript
{
  searchQuery: string;
  filterUnreadOnly: boolean;
  filterStarred: boolean;
  selectedLabel: string | null;
  sortBy: 'date' | 'subject' | 'from';
}
```

**Component Structure**:
```tsx
<EmailList>
  {/* Search Bar */}
  <EmailSearchBar
    value={searchQuery}
    onChange={setSearchQuery}
    placeholder="Search emails..."
  />

  {/* Filter Toolbar */}
  <EmailFilterToolbar>
    <ToggleUnread
      active={filterUnreadOnly}
      onChange={setFilterUnreadOnly}
    />
    <ToggleStarred
      active={filterStarred}
      onChange={setFilterStarred}
    />
    <LabelFilter
      selected={selectedLabel}
      onChange={setSelectedLabel}
    />
    <SortDropdown
      value={sortBy}
      onChange={setSortBy}
    />
  </EmailFilterToolbar>

  {/* Bulk Actions (when emails selected) */}
  {selectedEmails.size > 0 && (
    <BulkActionBar>
      <SelectAllCheckbox
        checked={allSelected}
        onChange={toggleSelectAll}
      />
      <MarkReadButton />
      <AddLabelButton />
      <MoveToFolderButton />
      <DeleteButton />
    </BulkActionBar>
  )}

  {/* Email Items */}
  <EmailListContainer>
    {loading ? (
      <EmailListSkeleton count={10} />
    ) : (
      emails.map(email => (
        <EmailItem
          key={email._id}
          email={email}
          isSelected={selectedEmails.has(email._id)}
          onSelect={onEmailSelect}
          onClick={onEmailClick}
        />
      ))
    )}
  </EmailListContainer>

  {/* Infinite Scroll Loader */}
  {hasMore && <LoadMoreTrigger onLoadMore={onLoadMore} />}
</EmailList>
```

**Styling**:
- Background: Dark (bg-dark-900)
- Email item: bg-dark-800 (hover), bg-dark-900 (selected)
- Border: Border-b between items
- Height: 80px per item (compact mode), 120px (comfortable mode)

---

### 5.5 EmailItem Component

**Purpose**: Individual email in list

**Props**:
```typescript
interface EmailItemProps {
  email: Email;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onClick: (email: Email) => void;
}
```

**Visual Design**:
```
┌──────────────────────────────────────────────────────────┐
│ [✓] [⭐] John Doe                        Jan 21, 2:30 PM │
│        Subject line here (bold if unread)               │
│        Preview text goes here and truncates after...     │
│        [📎] [Label1] [Label2]                           │
└──────────────────────────────────────────────────────────┘
```

**Elements**:
1. Checkbox (left) - For bulk selection
2. Star icon (toggle)
3. Sender name (bold if unread)
4. Subject line (bold if unread)
5. Preview text (truncate after 100 chars)
6. Date (right-aligned, relative format)
7. Attachment icon (if hasAttachments)
8. Label badges (if labels present)

**States**:
- Unread: Bold text, white background
- Read: Normal text, dark background
- Selected: Accent border-left
- Flagged: Yellow star icon
- Has attachments: Paperclip icon

**Interactions**:
- Click: Open email detail
- Checkbox click: Toggle selection (stop propagation)
- Star click: Toggle flag (stop propagation)
- Right-click: Context menu (reply, forward, delete, etc.)

**Styling**:
- Unread: bg-dark-800
- Read: bg-dark-900
- Selected: border-l-4 border-blue-500 bg-dark-800
- Hover: bg-dark-800
- Transition: All 200ms

---

### 5.6 EmailDetail Component

**Purpose**: Full email view with thread

**Props**:
```typescript
interface EmailDetailProps {
  email: Email;
  thread: Email[];
  onReply: () => void;
  onForward: () => void;
  onDelete: () => void;
  onMarkUnread: () => void;
}
```

**Component Structure**:
```tsx
<EmailDetail>
  {/* Toolbar */}
  <EmailToolbar>
    <BackButton onClick={backToList} />
    <ArchiveButton onClick={archiveEmail} />
    <SpamButton onClick={markAsSpam} />
    <DeleteButton onClick={deleteEmail} />
    <MarkUnreadButton onClick={onMarkUnread} />
    <AddLabelButton />
    <MoreMenu>
      <MenuItem onClick={reply}>Reply</MenuItem>
      <MenuItem onClick={replyAll}>Reply All</MenuItem>
      <MenuItem onClick={forward}>Forward</MenuItem>
      <MenuItem onClick={print}>Print</MenuItem>
    </MoreMenu>
  </EmailToolbar>

  {/* Thread Header */}
  <ThreadHeader>
    <Subject>{email.subject}</Subject>
    <ThreadInfo>
      <Participants>
        {thread.map(t => t.from).unique().map((from, i) => (
          <Avatar key={i} src={from.avatar} name={from.name} />
        ))}
      </Participants>
      <ThreadDate>{formatDate(email.date)}</ThreadDate>
      <ThreadCount>{thread.length} messages</ThreadCount>
    </ThreadInfo>
  </ThreadHeader>

  {/* Thread View */}
  <ThreadView>
    {thread.map((threadEmail, index) => (
      <EmailCard
        key={threadEmail._id}
        email={threadEmail}
        isExpanded={index === thread.length - 1}
        onReply={replyToEmail}
      />
    ))}
  </ThreadView>

  {/* Attachments */}
  {email.hasAttachments && (
    <AttachmentList>
      {email.attachments.map(attachment => (
        <AttachmentCard
          key={attachment.cid}
          filename={attachment.filename}
          size={attachment.size}
          type={attachment.contentType}
          onDownload={downloadAttachment}
          onPreview={previewAttachment}
        />
      ))}
    </AttachmentList>
  )}

  {/* Reply Box */}
  <ReplyBox>
    <ReplyActions>
      <ReplyButton onClick={reply}>Reply</ReplyButton>
      <ReplyAllButton onClick={replyAll}>Reply All</ReplyButton>
      <ForwardButton onClick={forward}>Forward</ForwardButton>
    </ReplyActions>
    <RichTextEditor
      placeholder="Write your reply..."
      onSend={sendReply}
    />
  </ReplyBox>
</EmailDetail>
```

**Styling**:
- Background: Dark (bg-dark-900)
- Toolbar: Fixed at top, bg-dark-800
- Thread cards: Alternating shades for readability
- Selected email: Highlighted with accent border
- Reply box: Sticky at bottom

---

### 5.7 EmailCard Component

**Purpose**: Individual email in thread

**Props**:
```typescript
interface EmailCardProps {
  email: Email;
  isExpanded: boolean;
  onReply: () => void;
}
```

**Visual Design**:
```
┌──────────────────────────────────────────────────────────┐
│ [Avatar] John Doe <john@example.com>        Jan 21, 2:30PM│
│          to: Me, Jane <jane@example.com>                │
└──────────────────────────────────────────────────────────┘
│                                                           │
│ Email body content here...                               │
│ Supports HTML formatting, images, links, etc.           │
│                                                           │
└──────────────────────────────────────────────────────────┘
│ [📎 attachment.pdf (2.3 MB)]                            │
└──────────────────────────────────────────────────────────┘
│ [Reply] [Reply All] [Forward]                           │
└──────────────────────────────────────────────────────────┘
```

**Elements**:
1. Sender avatar (circle, 40px)
2. Sender info (name, email)
3. Recipient info (collapsed by default)
4. Date/time
5. Email body (HTML)
6. Attachments (if present)
7. Quick action buttons

**States**:
- Expanded: Show full body
- Collapsed: Show preview only

**Interactions**:
- Click header: Toggle expand/collapse
- Hover: Show action buttons

---

### 5.8 ComposeEmailModal Component

**Purpose**: Email composition modal

**Props**:
```typescript
interface ComposeEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'compose' | 'reply' | 'forward';
  defaultValues?: {
    to?: string[];
    cc?: string[];
    subject?: string;
    body?: string;
  };
}
```

**State**:
```typescript
{
  to: string[];
  cc: string[];
  bcc: string[];
  subject: string;
  body: string;
  attachments: File[];
  sending: boolean;
  saving: boolean;
}
```

**Component Structure**:
```tsx
<ComposeEmailModal isOpen={isOpen} onClose={onClose}>
  <ComposeHeader>
    <Title>New Message</Title>
    <CloseButton onClick={onClose} />
  </ComposeHeader>

  <ComposeForm>
    {/* To Field */}
    <RecipientField
      label="To"
      value={to}
      onChange={setTo}
      suggestions={contactSuggestions}
      placeholder="Recipients"
    />

    {/* CC Field (toggleable) */}
    {showCc && (
      <RecipientField
        label="Cc"
        value={cc}
        onChange={setCc}
        suggestions={contactSuggestions}
      />
    )}

    {/* BCC Field (toggleable) */}
    {showBcc && (
      <RecipientField
        label="Bcc"
        value={bcc}
        onChange={setBcc}
        suggestions={contactSuggestions}
      />
    )}

    {/* Toggle CC/BCC */}
    <ToggleCcBcc>
      <ToggleButton onClick={() => setShowCc(!showCc)}>
        Cc
      </ToggleButton>
      <ToggleButton onClick={() => setShowBcc(!showBcc)}>
        Bcc
      </ToggleButton>
    </ToggleCcBcc>

    {/* Subject */}
    <SubjectField
      value={subject}
      onChange={setSubject}
      placeholder="Subject"
    />

    {/* Rich Text Editor */}
    <RichTextEditor
      value={body}
      onChange={setBody}
      placeholder="Write your message..."
      features={{
        bold: true,
        italic: true,
        underline: true,
        lists: true,
        links: true,
        images: true,
        attachments: true
      }}
    />

    {/* Attachments */}
    <AttachmentUploader
      files={attachments}
      onAdd={addAttachment}
      onRemove={removeAttachment}
    />
  </ComposeForm>

  <ComposeFooter>
    <LeftActions>
      <SaveDraftButton onClick={saveDraft} disabled={saving}>
        {saving ? 'Saving...' : 'Save Draft'}
      </SaveDraftButton>
      <DiscardButton onClick={discard}>
        Discard
      </DiscardButton>
    </LeftActions>

    <RightActions>
      <SendButton
        onClick={sendEmail}
        disabled={sending || !canSend}
      >
        {sending ? (
          <>
            <Spinner />
            Sending...
          </>
        ) : (
          <>
            <SendIcon />
            Send
          </>
        )}
      </SendButton>
    </RightActions>
  </ComposeFooter>
</ComposeEmailModal>
```

**Visual Design**:
```
┌──────────────────────────────────────────────────────────┐
│ New Message                                    [×]       │
├──────────────────────────────────────────────────────────┤
│ To:      [john@example.com]          [Contact suggestions]│
│ Cc:      [+ Add Cc]                                       │
│ Subject: [Project Update]                                 │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ [Rich Text Editor Toolbar]                              │
│ [B] [I] [U] [List] [Link] [Image]                       │
│                                                          │
│ Write your message here...                              │
│                                                          │
│ Attachments: [📎 file.pdf (2.3 MB)] [×]                 │
├──────────────────────────────────────────────────────────┤
│ [Save Draft] [Discard]              [Send →]            │
└──────────────────────────────────────────────────────────┘
```

**Validation**:
- To: Required, at least one valid email
- Subject: Required
- Body: Optional but recommended
- Attachments: Max 25MB total

**Keyboard Shortcuts**:
- Ctrl/Cmd + Enter: Send
- Ctrl/Cmd + S: Save draft
- Esc: Close (with confirmation)

---

### 5.9 RichTextEditor Component

**Purpose**: WYSIWYG text editor for email composition

**Props**:
```typescript
interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  features?: {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    lists?: boolean;
    links?: boolean;
    images?: boolean;
    attachments?: boolean;
  };
}
```

**Toolbar Options**:
- **Bold** (B): Ctrl/Cmd + B
- **Italic** (I): Ctrl/Cmd + I
- **Underline** (U): Ctrl/Cmd + U
- **Bullet List**: Ctrl/Cmd + Shift + 8
- **Numbered List**: Ctrl/Cmd + Shift + 7
- **Insert Link**: Ctrl/Cmd + K
- **Insert Image**: Upload or URL
- **Attachment**: File upload

**Implementation Options**:
1. Custom implementation with `contenteditable`
2. Library: TipTap, Slate.js, or Draft.js
3. Lightweight: Quill.js

**Recommended**: TipTap (React-friendly, extensible, modern)

---

### 5.10 AttachmentUploader Component

**Purpose**: File upload for email attachments

**Props**:
```typescript
interface AttachmentUploaderProps {
  files: File[];
  onAdd: (file: File) => void;
  onRemove: (index: number) => void;
  maxSize?: number; // Default: 25MB
  allowedTypes?: string[]; // Default: all
}
```

**Features**:
- Drag & drop support
- Click to browse
- File preview (image thumbnail, file icon)
- File size display
- Remove button
- Progress indicator during upload
- Error handling (size limit, type restriction)

**Visual Design**:
```
┌──────────────────────────────────────────────────────────┐
│ Attachments                                             │
├──────────────────────────────────────────────────────────┤
│ [📄 file.pdf (2.3 MB)]                    [Remove ×]     │
│ [🖼️ image.png (1.1 MB)]                    [Remove ×]     │
├──────────────────────────────────────────────────────────┤
│ [+ Add Attachment]  or  Drag & Drop files here          │
└──────────────────────────────────────────────────────────┘
```

---

### 5.11 EmailSearchBar Component

**Purpose**: Search emails with filters

**Props**:
```typescript
interface EmailSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: (query: string) => void;
  placeholder?: string;
}
```

**Features**:
- Debounced search (500ms)
- Search suggestions (previous searches)
- Advanced search toggle:
  - From: sender
  - To: recipient
  - Subject: subject line
  - Has: attachment
  - Date: date range
  - In: folder/label

**Visual Design**:
```
┌──────────────────────────────────────────────────────────┐
│ [🔍 Search emails...]                    [Advanced ▼]   │
└──────────────────────────────────────────────────────────┘
```

**Advanced Search Panel** (expandable):
```
┌──────────────────────────────────────────────────────────┐
│ From:    [________________]                              │
│ To:      [________________]                              │
│ Subject: [________________]                              │
│ Has:     ☑ Attachments                                   │
│ Date:    [From ▼] [To ▼]                                │
│ In:      [Folder ▼] [Label ▼]                           │
│                                                          │
│                    [Search] [Reset]                      │
└──────────────────────────────────────────────────────────┘
```

---

### 5.12 NotificationToast Component

**Purpose**: Real-time email notifications

**Props**:
```typescript
interface NotificationToastProps {
  email: Email;
  onClose: () => void;
  onClick: () => void;
}
```

**Visual Design**:
```
┌──────────────────────────────────────────────────────────┐
│ [📧] New Email                              [×]          │
│                                                          │
│ From: John Doe                                           │
│ Subject: Project Update                                  │
│ Preview: This is an update on the project...            │
│                                                          │
│                    [View] [Dismiss]                      │
└──────────────────────────────────────────────────────────┘
```

**Behavior**:
- Auto-dismiss after 5 seconds
- Stack multiple toasts
- Click to open email
- Hover to pause auto-dismiss
- Slide-in animation (Framer Motion)

---

## 6. State Management

### 6.1 EmailContext Structure

**File**: `src/contexts/EmailContext.jsx`

**State**:
```javascript
{
  // Emails
  emails: Email[],
  currentFolder: string,
  selectedEmails: Set<string>,
  currentEmail: Email | null,
  thread: Email[],

  // Folders & Labels
  folders: Folder[],
  labels: Label[],
  unreadCounts: { [folder: string]: number },

  // UI State
  loading: boolean,
  syncing: boolean,
  syncProgress: number,
  error: string | null,

  // Search & Filter
  searchQuery: string,
  filterUnreadOnly: boolean,
  filterStarred: boolean,
  selectedLabel: string | null,

  // Compose
  composeMode: 'compose' | 'reply' | 'forward',
  isComposeOpen: boolean,
  replyToEmail: Email | null,
}
```

**Actions**:
```javascript
{
  // Fetching
  fetchEmails: (folder?: string) => Promise<void>,
  fetchEmail: (id: string) => Promise<void>,
  fetchThread: (threadId: string) => Promise<void>,

  // Sync
  syncEmails: (folder?: string) => Promise<void>,

  // Actions
  sendEmail: (data: SendEmailData) => Promise<void>,
  markAsRead: (id: string) => Promise<void>,
  toggleFlag: (id: string) => Promise<void>,
  moveToFolder: (id: string, folder: string) => Promise<void>,
  deleteEmail: (id: string) => Promise<void>,
  addLabel: (emailId: string, labelId: string) => Promise<void>,
  removeLabel: (emailId: string, labelId: string) => Promise<void>,

  // Bulk Actions
  markMultipleAsRead: (ids: string[]) => Promise<void>,
  deleteMultiple: (ids: string[]) => Promise<void>,

  // Search
  searchEmails: (query: string) => Promise<void>,

  // Folders & Labels
  createLabel: (name: string, color: string) => Promise<void>,

  // UI Actions
  selectEmail: (id: string) => void,
  selectMultiple: (ids: string[]) => void,
  clearSelection: () => void,
  setCurrentFolder: (folder: string) => void,
  openCompose: (mode?: 'compose' | 'reply' | 'forward') => void,
  closeCompose: () => void,

  // Real-time handlers
  handleNewEmail: (email: Email) => void,
  handleEmailRead: (data: { id: string, isRead: boolean }) => void,
  handleSyncProgress: (progress: number) => void,
}
```

### 6.2 State Updates Pattern

**Optimistic Updates**:
```javascript
// Example: Mark as read
const markAsRead = async (id) => {
  // Optimistic update
  setEmails(prev => prev.map(email =>
    email._id === id ? { ...email, isRead: true } : email
  ));

  try {
    await API.markAsRead(id);
  } catch (error) {
    // Rollback on error
    setEmails(prev => prev.map(email =>
      email._id === id ? { ...email, isRead: false } : email
    ));
    showError('Failed to mark as read');
  }
};
```

**Real-time Email Addition**:
```javascript
// Socket.IO event handler
socket.on('email:new', (newEmail) => {
  // Add to beginning of list
  setEmails(prev => [newEmail, ...prev]);

  // Increment unread count
  setUnreadCounts(prev => ({
    ...prev,
    [newEmail.folder]: prev[newEmail.folder] + 1
  }));

  // Show notification
  toast(`New email from ${newEmail.from.name}`);
});
```

---

## 7. API Integration

### 7.1 EmailService

**File**: `src/services/emailService.js`

**Methods**:
```javascript
// Fetching
const fetchEmails = (params) => {
  return axios.get('/api/email', { params });
};

const fetchEmail = (id) => {
  return axios.get(`/api/email/${id}`);
};

// Sync
const syncEmails = (folder) => {
  return axios.post(`/api/email/sync/${folder || ''}`);
};

// Sending
const sendEmail = (data) => {
  return axios.post('/api/email/send', data);
};

// Actions
const markAsRead = (id, isRead) => {
  return axios.put(`/api/email/${id}/read`, { isRead });
};

const toggleFlag = (id) => {
  return axios.put(`/api/email/${id}/flag`);
};

const moveToFolder = (id, folder) => {
  return axios.put(`/api/email/${id}/folder`, { folder });
};

const deleteEmail = (id) => {
  return axios.delete(`/api/email/${id}`);
};

// Bulk Actions
const markMultipleAsRead = (ids, isRead) => {
  return axios.put('/api/email/mark-read', { ids, isRead });
};

const deleteMultiple = (ids) => {
  return axios.delete('/api/email/multiple/delete', { data: { ids } });
};

// Search
const searchEmails = (query) => {
  return axios.get('/api/email/search', { params: { q: query } });
};

// Folders
const fetchFolders = () => {
  return axios.get('/api/email/folders/list');
};

const fetchUnreadCounts = () => {
  return axios.get('/api/email/folders/unread-count');
};

// Labels
const fetchLabels = () => {
  return axios.get('/api/email/labels/list');
};

const createLabel = (name, color) => {
  return axios.post('/api/email/labels', { name, color });
};

const addLabelToEmail = (emailId, labelId) => {
  return axios.put(`/api/email/${emailId}/labels/${labelId}`);
};

const removeLabelFromEmail = (emailId, labelId) => {
  return axios.delete(`/api/email/${emailId}/labels/${labelId}`);
};

// Contacts
const fetchContacts = () => {
  return axios.get('/api/email/contacts/list');
};

const createContact = (data) => {
  return axios.post('/api/email/contacts', data);
};
```

### 7.2 Axios Interceptors

**Request Interceptor** (Add JWT):
```javascript
axios.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

**Response Interceptor** (Handle errors):
```javascript
axios.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

---

## 8. Real-time Features

### 8.1 Socket.IO Integration

**Connection Setup** (EmailContext):
```javascript
useEffect(() => {
  // Connect to Socket.IO
  const socket = io(API_URL, {
    auth: { token: getToken() },
    transports: ['websocket']
  });

  // New email event
  socket.on('email:new', (email) => {
    handleNewEmail(email);
  });

  // Email read status update
  socket.on('email:read', ({ id, isRead }) => {
    setEmails(prev => prev.map(e =>
      e._id === id ? { ...e, isRead } : e
    ));
  });

  // Sync progress
  socket.on('email:sync:progress', ({ folder, processed, total }) => {
    setSyncProgress(Math.round((processed / total) * 100));
  });

  // Sync complete
  socket.on('email:sync:complete', ({ folder, synced }) => {
    setSyncing(false);
    setSyncProgress(0);
    // Refresh email list
    fetchEmails(folder);
  });

  return () => {
    socket.disconnect();
  };
}, []);
```

### 8.2 Real-time Notification Flow

```
┌──────────────────────────────────────────────────────────┐
│          Real-time Email Notification Flow               │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  1. New Email Arrives (IMAP Server)                     │
│     │                                                    │
│     ▼                                                    │
│  2. IMAP Watcher Detects Email                          │
│     │                                                    │
│     ├─ Parse email                                      │
│     ├─ Save to MongoDB                                  │
│     │                                                    │
│     └─ Emit Socket.IO Event:                            │
│         │                                                │
│         ▼                                                │
│         io.to(`user:${userId}`).emit('email:new', email) │
│                                                          │
│  3. Client Receives Event                               │
│     │                                                    │
│     ├─ Update EmailContext (add to list)                │
│     ├─ Update unread count                              │
│     ├─ Show toast notification                          │
│     │                                                    │
│     └─ UI Auto-Updates (React re-render)                │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 9. User Flows

### 9.1 Primary User Flows

**Flow 1: View New Emails**
1. User navigates to `/email`
2. EmailContext loads and fetches emails for current folder (default: inbox)
3. Email list displays with newest first
4. Real-time emails appear automatically via Socket.IO
5. User clicks email to open detail view

**Flow 2: Compose & Send Email**
1. User clicks "Compose" button in sidebar
2. ComposeEmailModal opens
3. User fills in To, Subject, Body
4. User optionally adds attachments
5. User clicks "Send"
6. Optimistic update: Close modal, add to sent folder
7. API call: Send email via SMTP
8. On success: Show success toast
9. On error: Show error toast, reopen modal with data

**Flow 3: Reply to Email**
1. User views email in EmailDetail
2. User clicks "Reply" in thread card or reply box
3. ComposeEmailModal opens with pre-filled data:
   - To: Original sender
   - Subject: Re: Original subject
   - Body: Quote original message
4. User types reply and sends
5. Email sent and added to thread

**Flow 4: Search Emails**
1. User types in search bar
2. Debounce 500ms
3. API call to `/api/email/search?q=query`
4. Results display in filtered list
5. User can refine with advanced search filters
6. User clicks result to view

**Flow 5: Organize with Labels**
1. User selects email(s) with checkbox
2. BulkActionBar appears
3. User clicks "Add Label"
4. Label picker modal opens
5. User selects existing label or creates new
6. Labels added to emails (optimistic)
7. API call: Update emails with labels
8. UI updates with label badges

### 9.2 Edge Cases & Error Handling

- **No internet connection**: Show offline banner, queue actions
- **Send failure**: Reopen compose modal with error message
- **Sync failure**: Show retry button, log error for admin
- **Attachment too large**: Show error, block upload
- **Invalid email address**: Show validation error
- **Attachment download failure**: Show error, offer retry
- **Socket.IO disconnect**: Show reconnecting indicator, auto-reconnect
- **Multiple tabs**: Sync state across tabs via localStorage events

---

## 10. Responsive Design

### 10.1 Breakpoints

```css
/* Mobile First */
.email-list { /* Default: Single column */ }

@media (min-width: 768px) { /* Tablet */
  .email-layout {
    grid-template-columns: 200px 1fr;
  }
}

@media (min-width: 1024px) { /* Desktop */
  .email-layout {
    grid-template-columns: 250px 400px 1fr;
  }
}
```

### 10.2 Mobile Adaptations

**Navigation**:
- Sidebar becomes bottom navigation bar
- Drawer for folder access
- Hamburger menu for labels

**Email List**:
- Compact view (60px height)
- Swipe actions (delete, star)
- Pull to refresh

**Email Detail**:
- Full-screen view
- Back button to list
- Sticky toolbar at bottom (reply, forward)

**Compose**:
- Full-screen modal
- Auto-focus on body field
- Attachment button at bottom

---

## 11. Accessibility

### 11.1 Keyboard Navigation

**Shortcuts**:
- `C`: Compose new email
- `R`: Reply to selected email
- `F`: Forward selected email
- `Delete` / `Backspace`: Delete selected email
- `*` + `A`: Select all emails
- `Esc`: Close modal / Clear selection
- `J`: Navigate down
- `K`: Navigate up
- `Enter`: Open selected email
- `Ctrl/Cmd + Enter`: Send email
- `/`: Focus search

### 11.2 ARIA Labels

```html
<button aria-label="Compose new email">
  <Icon name="compose" />
</button>

<div role="navigation" aria-label="Email folders">
  {/* Folder list */}
</div>

<div
  role="listitem"
  aria-label={`Email from ${email.from.name}, ${email.subject}`}
  aria-unread={!email.isRead}
>
  {/* Email item */}
</div>
```

### 11.3 Screen Reader Support

- Announce new email arrivals
- Announce unread counts
- Announce search results count
- Describe attachment types
- Indicate starred/flagged status
- Provide context for actions

---

## 12. Design Guidelines

### 12.1 Color Palette

**Dark Theme** (Default):
```css
--bg-primary: #0f172a;      /* dark-900 */
--bg-secondary: #1e293b;    /* dark-800 */
--bg-tertiary: #334155;     /* dark-700 */
--text-primary: #f8fafc;    /* gray-50 */
--text-secondary: #94a3b8;  /* gray-400 */
--accent: #3b82f6;          /* blue-500 */
--accent-hover: #2563eb;    /* blue-600 */
--success: #22c55e;         /* green-500 */
--error: #ef4444;           /* red-500 */
--warning: #f59e0b;         /* amber-500 */
```

**Light Theme** (Optional):
```css
--bg-primary: #ffffff;
--bg-secondary: #f3f4f6;
--text-primary: #111827;
--text-secondary: #6b7280;
```

### 12.2 Typography

**Font Family**: Inter or system-ui

**Sizes**:
```css
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
```

**Weights**:
- Regular: 400
- Medium: 500
- Semibold: 600
- Bold: 700

### 12.3 Spacing

```css
--spacing-1: 0.25rem;  /* 4px */
--spacing-2: 0.5rem;   /* 8px */
--spacing-3: 0.75rem;  /* 12px */
--spacing-4: 1rem;     /* 16px */
--spacing-6: 1.5rem;   /* 24px */
--spacing-8: 2rem;     /* 32px */
```

### 12.4 Shadows

```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
```

### 12.5 Border Radius

```css
--radius-sm: 0.25rem;  /* 4px */
--radius: 0.375rem;    /* 6px */
--radius-md: 0.5rem;   /* 8px */
--radius-lg: 0.75rem;  /* 12px */
--radius-full: 9999px;
```

---

## 13. Performance Optimization

### 13.1 Code Splitting

```javascript
// Lazy load compose modal
const ComposeEmailModal = lazy(() =>
  import('./components/email/ComposeEmailModal')
);

// Lazy load email detail
const EmailDetail = lazy(() =>
  import('./components/email/EmailDetail')
);
```

### 13.2 Memoization

```javascript
// Memoize email items
const EmailItemMemo = memo(EmailItem, (prev, next) => {
  return (
    prev.email._id === next.email._id &&
    prev.isSelected === next.isSelected &&
    prev.email.isRead === next.email.isRead
  );
});
```

### 13.3 Virtual Scrolling

For large email lists (1000+ emails):
- Use `react-window` or `react-virtual`
- Render only visible items
- Improved performance and memory usage

### 13.4 Image Optimization

- Lazy load avatars
- WebP format for attachments
- Thumbnail generation for image attachments
- Progressive image loading

---

## 14. Testing Requirements

### 14.1 Component Tests

- **EmailList**: Renders emails, handles loading state
- **EmailItem**: Click, select, star actions
- **EmailDetail**: Thread view, reply functionality
- **ComposeEmailModal**: Form validation, send email
- **AttachmentUploader**: File upload, remove

### 14.2 Integration Tests

- Search emails and filter results
- Compose and send email flow
- Mark as read/unread updates UI
- Delete email removes from list
- Label assignment updates badges

### 14.3 E2E Tests (Playwright/Cypress)

- User logs in and views inbox
- User composes and sends email
- User searches for specific email
- User replies to email
- User deletes email
- User creates label and assigns to email

---

**Document Status**: Complete
**Next Steps**: Lead Management UI/UX Specification
**Maintained By**: Architecture Team
**Questions**: Consult architecture team or escalate via `.agent-workspace/escalations/`
