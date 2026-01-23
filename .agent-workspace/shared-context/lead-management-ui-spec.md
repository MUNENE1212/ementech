# Lead Management System UI/UX Specification

**Version**: 1.0
**Last Updated**: 2026-01-21
**Target Audience**: UI/UX Designers, Frontend Developers
**Priority**: High (Core Business Feature)

---

## Table of Contents

1. [Overview](#overview)
2. [User Stories & Requirements](#user-stories--requirements)
3. [Information Architecture](#information-architecture)
4. [Component Hierarchy](#component-hierarchy)
5. [Component Specifications](#component-specifications)
6. [State Management](#state-management)
7. [API Integration](#api-integration)
8. [User Flows](#user-flows)
9. [Responsive Design](#responsive-design)
10. [Accessibility](#accessibility)
11. [Design Guidelines](#design-guidelines)

---

## 1. Overview

### 1.1 Purpose

Build a comprehensive lead management system for capturing, scoring, tracking, and nurturing leads through the sales pipeline.

### 1.2 Key Features

- Multi-source lead capture (forms, chatbot, referrals)
- Progressive profiling (4 stages)
- Automatic lead scoring (120 point scale)
- Lead status tracking (New → Won/Lost)
- Lead dashboard with analytics
- Lead list with filtering and search
- Lead detail view with full history
- Task and follow-up management
- Email integration
- CSV import/export
- Lead assignment to team members
- GDPR compliance tracking

### 1.3 Technical Constraints

- **Frontend**: React 19, TypeScript, TailwindCSS, Framer Motion
- **State**: React Context (LeadContext)
- **Charts**: Recharts or Chart.js for analytics
- **API**: REST endpoints (10+ endpoints available)
- **Icons**: Lucide React, React Icons
- **Forms**: React Hook Form + Zod validation

---

## 2. User Stories & Requirements

### 2.1 Primary User Stories

**As a marketing team member, I want to:**

1. **Capture leads** from multiple sources so I can build our pipeline
2. **View lead statistics** in a dashboard so I can track performance
3. **Score leads automatically** so I can prioritize follow-ups
4. **Filter and search leads** so I can find specific leads
5. **Export leads to CSV** so I can analyze data externally

**As a sales team member, I want to:**

6. **View assigned leads** so I can prioritize my work
7. **See lead details** including interactions so I can understand context
8. **Add notes and interactions** so I can track touchpoints
9. **Update lead status** so I can reflect pipeline progress
10. **Send emails to leads** directly from the system

**As an admin, I want to:**

11. **Assign leads to team members** so I can distribute workload
12. **View conversion analytics** so I can measure ROI
13. **Import leads in bulk** so I can migrate existing data
14. **Manage lead stages** so I can monitor pipeline health

### 2.2 Acceptance Criteria

- Dashboard loads within 2 seconds
- Lead list supports 1000+ leads with pagination
- Search returns results within 1 second
- Lead score updates automatically on profile changes
- All interactions are logged with timestamps
- GDPR consent is tracked and cannot be bypassed
- Email integration works seamlessly with email system
- Mobile interface fully functional for field use

---

## 3. Information Architecture

### 3.1 Application Structure

```
Lead Management System
│
├── Navigation (Top Bar)
│   ├── Dashboard
│   ├── Leads List
│   ├── Analytics
│   └── Settings
│
├── Lead Dashboard (Default View)
│   ├── KPI Cards
│   │   ├── Total Leads
│   │   ├── New This Month
│   │   ├── Qualified Leads
│   │   └── Conversion Rate
│   ├── Lead Sources Chart (Donut)
│   ├── Lead Status Chart (Funnel)
│   ├── Lead Trend Chart (Line)
│   └── Recent Leads Table
│
├── Lead List View
│   ├── Search & Filter Bar
│   │   ├── Search input
│   │   ├── Status filter
│   │   ├── Score filter
│   │   ├── Source filter
│   │   ├── Assigned to filter
│   │   └── Date range filter
│   ├── Bulk Actions Bar
│   │   ├── Assign to...
│   │   ├── Update status
│   │   ├── Add tag
│   │   └── Export
│   ├── Sort Options
│   │   ├── Sort by: Date / Score / Name
│   │   └── Sort order: Asc / Desc
│   └── Lead Cards/Rows (Scrollable)
│       ├── Checkbox
│       ├── Avatar
│       ├── Name & Company
│       ├── Email & Phone
│       ├── Score badge
│       ├── Status badge
│       ├── Source badge
│       ├── Assigned to
│       └── Actions menu
│
├── Lead Detail View
│   ├── Header
│   │   ├── Back button
│   │   ├── Lead name (editable)
│   │   ├── Status dropdown
│   │   ├── Score display
│   │   ├── Actions menu
│   │   │   ├── Convert to opportunity
│   │   │   ├── Send email
│   │   │   ├── Delete lead
│   │   │   └── Merge with...
│   └── Tabs
│       ├── Overview Tab
│       │   ├── Contact Info Card
│       │   ├── Lead Profile Card
│       │   ├── Scoring Breakdown
│       │   └── Progress Bar (Stage)
│       ├── Interactions Tab
│       │   ├── Timeline View
│       │   ├── Add Note Button
│       │   ├── Log Interaction Button
│       │   └── Interaction Cards
│       ├── Tasks Tab
│       │   ├── Task List
│       │   ├── Add Task Button
│       │   └── Task Cards
│       └── Emails Tab
│           ├── Email History
│           ├── Compose Email Button
│           └── Email List
│
└── Lead Capture Forms (Public)
    ├── Contact Form (Website)
    ├── Newsletter Signup
    ├── Event Registration
    ├── Content Download
    └── Exit Intent Popup
```

### 3.2 Responsive Layout Strategy

**Desktop (1024px+)**:
- Three-column layout for detail view (Info | Interactions | Tasks)
- Sidebar navigation for main sections
- KPI cards in grid (4 columns)

**Tablet (768px - 1023px)**:
- Two-column layout for detail view
- Collapsible sidebar
- KPI cards in grid (2 columns)

**Mobile (<768px)**:
- Single-column layout
- Bottom navigation bar
- Full-screen detail views
- Stacked KPI cards
- Swipeable tabs

---

## 4. Component Hierarchy

```
LeadManagement (Page)
│
├── LeadNavigation (Top Bar)
│   ├── NavItem: Dashboard
│   ├── NavItem: Leads
│   ├── NavItem: Analytics
│   └── NavItem: Settings
│
├── LeadDashboard (Default Route)
│   ├── KPIGrid
│   │   ├── KPICard (Total Leads)
│   │   ├── KPICard (New This Month)
│   │   ├── KPICard (Qualified)
│   │   └── KPICard (Conversion Rate)
│   ├── ChartsSection
│   │   ├── SourcesChart (Donut)
│   │   ├── StatusChart (Funnel)
│   │   └── TrendChart (Line)
│   └── RecentLeadsTable
│
├── LeadList (Route)
│   ├── LeadSearchBar
│   ├── LeadFilterPanel
│   ├── BulkActionBar
│   ├── LeadSortBar
│   ├── LeadGrid/LeadTable
│   │   └── LeadCard/LeadRow (repeated)
│   └── LeadPagination
│
├── LeadDetail (Route)
│   ├── LeadDetailHeader
│   ├── LeadTabs
│   │   ├── Tab: Overview
│   │   │   ├── ContactInfoCard
│   │   │   ├── ProfileInfoCard
│   │   │   ├── ScoringBreakdownCard
│   │   │   └── StageProgressCard
│   │   ├── Tab: Interactions
│   │   │   ├── InteractionTimeline
│   │   │   ├── AddNoteModal
│   │   │   └── LogInteractionModal
│   │   ├── Tab: Tasks
│   │   │   ├── TaskList
│   │   │   └── AddTaskModal
│   │   └── Tab: Emails
│   │       ├── EmailHistory
│   │       └── ComposeEmailModal
│   └── DeleteConfirmationModal
│
└── LeadCaptureForms (Public)
    ├── ContactForm
    ├── NewsletterSignupForm
    ├── EventRegistrationForm
    ├── ResourceDownloadForm
    └── ExitIntentPopup
```

---

## 5. Component Specifications

### 5.1 LeadNavigation Component

**Purpose**: Top navigation bar for lead management sections

**Props**:
```typescript
interface LeadNavigationProps {
  currentSection: 'dashboard' | 'leads' | 'analytics' | 'settings';
  onSectionChange: (section: string) => void;
}
```

**Visual Design**:
```
┌──────────────────────────────────────────────────────────┐
│ [Dashboard] [Leads] [Analytics] [Settings]              │
│      ●        ○        ○          ○                     │
└──────────────────────────────────────────────────────────┘
```

**States**:
- Default: Gray text
- Hover: Underline
- Active: Accent color with bottom border

**Mobile**: Bottom navigation bar with icons

---

### 5.2 KPICard Component

**Purpose**: Display single key performance indicator

**Props**:
```typescript
interface KPICardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease';
    period: string;
  };
  icon?: LucideIcon;
  color?: 'blue' | 'green' | 'purple' | 'orange';
}
```

**Visual Design**:
```
┌─────────────────────────────────────┐
│ [👥] Total Leads                    │
│      2,451                          │
│      ↑ 12% from last month          │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ [⭐] Qualified Leads                │
│      456                            │
│      ↑ 8% from last month           │
└─────────────────────────────────────┘
```

**Color Coding**:
- Blue: General metrics
- Green: Positive metrics (qualified, converted)
- Purple: Engagement metrics
- Orange: Warning metrics (lost, stale)

**Interactions**:
- Click: Navigate to filtered lead list

---

### 5.3 LeadSearchBar Component

**Purpose**: Search leads with filters

**Props**:
```typescript
interface LeadSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: (query: string) => void;
  filters: LeadFilters;
  onFilterChange: (filters: LeadFilters) => void;
}
```

**Features**:
- Text search (name, email, company)
- Filter dropdown (status, score, source, assigned)
- Date range picker
- Clear filters button
- Save search as preset

**Visual Design**:
```
┌──────────────────────────────────────────────────────────┐
│ [🔍 Search by name, email, company...]  [Filters ▼]    │
└──────────────────────────────────────────────────────────┘

Filter Panel (expandable):
┌──────────────────────────────────────────────────────────┐
│ Status:     [New ▼]                                     │
│ Score:      [60+ ▼]                                     │
│ Source:     [All ▼]                                     │
│ Assigned:   [All ▼]                                     │
│ Date:       [From ▼] [To ▼]                             │
│                                                          │
│                  [Apply] [Clear] [Save Preset]          │
└──────────────────────────────────────────────────────────┘
```

---

### 5.4 LeadCard Component

**Purpose**: Display lead in list/grid view

**Props**:
```typescript
interface LeadCardProps {
  lead: Lead;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onClick: (lead: Lead) => void;
}
```

**Visual Design** (Card View):
```
┌──────────────────────────────────────────────────────────┐
│ [✓] [Avatar] John Doe                    Score: 85      │
│           CEO at TechCorp               [High] [Qualified]│
│           john@techcorp.com                              │
│           +1 (555) 123-4567                              │
│           📧 Website | 💼 Referral                       │
│           👤 Assigned to: Jane Smith                     │
│           📅 Created: Jan 15, 2026                       │
└──────────────────────────────────────────────────────────┘
```

**Visual Design** (Table Row):
```
┌────────────────────────────────────────────────────────────────────┐
│ [✓] [Avatar] John Doe    CEO at TechCorp   85  Qualified  Ref... │
│         john@techcorp.com  📧 Website      ↑   High        Jane  │
└────────────────────────────────────────────────────────────────────┘
```

**Elements**:
1. Checkbox (for bulk selection)
2. Avatar (with initials if no image)
3. Name (bold)
4. Job title & company
5. Email (truncated if long)
6. Phone (optional)
7. Score badge (color-coded)
8. Status badge
9. Source badge
10. Assigned to avatar/name
11. Created date (relative format)

**Score Badge Colors**:
- 100-120: Purple (Excellent)
- 80-99: Green (High)
- 60-79: Blue (Good)
- 40-59: Yellow (Average)
- 20-39: Orange (Low)
- 0-19: Gray (Poor)

**Status Badge Colors**:
- New: Blue
- Contacted: Yellow
- Qualified: Green
- Proposal: Purple
- Won: Green (filled)
- Lost: Red

**Interactions**:
- Click: Open lead detail
- Checkbox: Toggle selection (stop propagation)
- Right-click: Context menu

---

### 5.5 LeadDetailHeader Component

**Purpose**: Header for lead detail view

**Props**:
```typescript
interface LeadDetailHeaderProps {
  lead: Lead;
  onStatusChange: (status: string) => void;
  onConvert: () => void;
  onDelete: () => void;
  onSendEmail: () => void;
}
```

**Visual Design**:
```
┌──────────────────────────────────────────────────────────┐
│ ← Back    John Doe          [Status ▼]  Score: 85       │
│           CEO at TechCorp    Qualified     [⋮]           │
└──────────────────────────────────────────────────────────┘
```

**Actions Menu**:
```
┌────────────────────┐
│ Convert to Opportunity
│ Send Email
│ Add Note
│ Log Interaction
│ ──────────────────
│ Merge with...
│ Assign to...
│ ──────────────────
│ Delete Lead
└────────────────────┘
```

---

### 5.6 ContactInfoCard Component

**Purpose**: Display lead contact information

**Props**:
```typescript
interface ContactInfoCardProps {
  lead: Lead;
  onEdit: () => void;
}
```

**Visual Design**:
```
┌──────────────────────────────────────────────────────────┐
│ Contact Information                                      │
│ ─────────────────────────────────────────────────────── │
│                                                          │
│  [Avatar - Large]                                        │
│  John Doe                                                │
│  CEO at TechCorp                                         │
│                                                          │
│  📧 john@techcorp.com                     [Copy] [Email]│
│  📱 +1 (555) 123-4567                      [Call] [SMS] │
│  🌐 www.techcorp.com                       [Visit]      │
│  📍 Nairobi, Kenya                                    │
│                                                          │
│  [Edit Contact Info]                                     │
└──────────────────────────────────────────────────────────┘
```

**Features**:
- Clickable email (opens compose modal)
- Clickable phone (initiates call if supported)
- Clickable website (opens in new tab)
- Copy to clipboard buttons
- Edit button (opens edit modal)

---

### 5.7 ProfileInfoCard Component

**Purpose**: Display lead profile and scoring info

**Props**:
```typescript
interface ProfileInfoCardProps {
  lead: Lead;
}
```

**Visual Design**:
```
┌──────────────────────────────────────────────────────────┐
│ Lead Profile                                             │
│ ─────────────────────────────────────────────────────── │
│                                                          │
│ Stage: ████░░░░░░░░░░░░ 2/4 (Identified)               │
│                                                          │
│ Company Size: 11-50                                      │
│ Industry: Technology                                     │
│ Budget: 25k-50k                                          │
│ Timeline: 1-3 months                                     │
│                                                          │
│ Source: Website (UTM: google, cpc, campaign1)           │
│ Campaign: Summer Promo 2026                             │
│                                                          │
│ Engagement:                                              │
│  • Page Views: 12                                        │
│  • Time on Site: 8m 32s                                  │
│  • Sessions: 5                                           │
│  • Last Activity: 2 hours ago                            │
│                                                          │
│ GDPR: ✅ Consent given on Jan 15, 2026                   │
│       ✅ Marketing consent                               │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

### 5.8 ScoringBreakdownCard Component

**Purpose**: Display detailed lead score breakdown

**Props**:
```typescript
interface ScoringBreakdownCardProps {
  lead: Lead;
  onRecalculate: () => void;
}
```

**Visual Design**:
```
┌──────────────────────────────────────────────────────────┐
│ Lead Scoring (85/120)                                    │
│ ─────────────────────────────────────────────────────── │
│                                                          │
│ Profile Completeness  ████████░░  18/20 (+18)           │
│ Job Title Seniority   ████████░░  15/15 (+15)           │
│ Company Size         ████░░░░░░░   7/10 (+7)            │
│ Budget               ██████████  20/20 (+20)            │
│ Timeline Urgency     ███████░░░  12/15 (+12)            │
│ Engagement Level     ████░░░░░░░   8/20 (+8)            │
│ Decision Maker       ██████████  10/10 (+10)           │
│ Source Quality       ██░░░░░░░░░    5/10 (+5)           │
│                                                          │
│ ─────────────────────────────────────────────────────  │
│ Total: 85/120                                            │
│                                                          │
│ Quality: High ⭐⭐⭐                                     │
│ Priority: Follow up within 24 hours                     │
│                                                          │
│                [Recalculate Score]                       │
└──────────────────────────────────────────────────────────┘
```

**Features**:
- Progress bars for each category
- Color-coded (green: good, yellow: average, red: poor)
- Hover tooltips explaining scoring
- Quality rating (stars)
- Recommended action based on score
- Recalculate button (manual override)

---

### 5.9 StageProgressCard Component

**Purpose**: Display lead's progress through stages

**Props**:
```typescript
interface StageProgressCardProps {
  lead: Lead;
  onStageUpdate: (stage: number) => void;
}
```

**Visual Design**:
```
┌──────────────────────────────────────────────────────────┐
│ Progressive Profiling                                    │
│ ─────────────────────────────────────────────────────── │
│                                                          │
│  Stage 1  Stage 2  Stage 3  Stage 4                     │
│  (Anonymous) (Identified) (Qualified) (Opportunity)     │
│     ●        ●        ○         ○                      │
│   Complete  Complete  Pending    Locked                 │
│                                                          │
│ ─────────────────────────────────────────────────────── │
│                                                          │
│ Stage 1: Anonymous ✓                                    │
│   • Email address                                       │
│   • Source captured                                     │
│                                                          │
│ Stage 2: Identified ✓                                   │
│   • Name: John Doe                                      │
│   • Company: TechCorp                                   │
│   • Job title: CEO                                      │
│                                                          │
│ Stage 3: Qualified → In Progress                        │
│   • Budget: Not captured yet                            │
│     [+ Collect Budget]                                   │
│   • Timeline: Not captured yet                          │
│     [+ Collect Timeline]                                 │
│                                                          │
│ Stage 4: Opportunity (Locked)                           │
│   Requires Stage 3 completion                           │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Features**:
- Step progress indicator
- Completion status per stage
- Data collection checklist
- Action buttons for missing data
- Stage unlock mechanism

---

### 5.10 InteractionTimeline Component

**Purpose**: Display chronological history of lead interactions

**Props**:
```typescript
interface InteractionTimelineProps {
  interactions: Interaction[];
  onAdd: (interaction: Interaction) => void;
  onEdit: (id: string, data: Interaction) => void;
  onDelete: (id: string) => void;
}
```

**Visual Design**:
```
┌──────────────────────────────────────────────────────────┐
│ Interactions Timeline                                    │
│ ─────────────────────────────────────────────────────── │
│                                                          │
│  [+ Add Note] [+ Log Interaction]                        │
│                                                          │
│  Today                                                   │
│  ┌────────────────────────────────────────────────┐     │
│  │ 10:30 AM | John Smith                         │     │
│  │                                                 │     │
│  │ 📞 Call - 15 minutes                          │     │
│  │                                                 │     │
│  │ Discussed budget requirements. Lead is         │     │
│  │ interested in our premium plan. Will send      │     │
│  │ proposal by end of week.                       │     │
│  │                                                 │     │
│  │               [Edit] [Delete]                  │     │
│  └────────────────────────────────────────────────┘     │
│                                                          │
│  Yesterday                                               │
│  ┌────────────────────────────────────────────────┐     │
│  │ 3:45 PM | Jane Doe                            │     │
│  │                                                 │     │
│  │ ✉️ Email Sent                                  │     │
│  │                                                 │     │
│  │ Sent product information and pricing.          │     │
│  │                                                 │     │
│  │               [View Email] [Edit]              │     │
│  └────────────────────────────────────────────────┘     │
│                                                          │
│  Jan 18, 2026                                            │
│  ┌────────────────────────────────────────────────┐     │
│  │ 2:00 PM | System                              │     │
│  │                                                 │     │
│  │ 📝 Note                                        │     │
│  │                                                 │     │
│  │ Lead downloaded our whitepaper on AI           │     │
│  │ implementation strategies.                     │     │
│  │                                                 │     │
│  │               [Edit] [Delete]                  │     │
│  └────────────────────────────────────────────────┘     │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Interaction Types**:
- 📞 Call
- ✉️ Email (sent/received)
- 📝 Note
- 🤝 Meeting
- 💻 Demo
- 📄 Proposal sent

**Features**:
- Grouped by date
- Timestamp with author
- Type icon
- Description
- Action buttons (edit, delete)
- Link to related emails

---

### 5.11 AddNoteModal Component

**Purpose**: Add note to lead

**Props**:
```typescript
interface AddNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (note: string) => void;
}
```

**Visual Design**:
```
┌──────────────────────────────────────────────────────────┐
│ Add Note                                    [×]          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ Note:                                                    │
│ ┌────────────────────────────────────────────────┐       │
│ │                                                  │       │
│ │ [Rich text editor or textarea]                  │       │
│ │                                                  │       │
│ │                                                  │       │
│ └────────────────────────────────────────────────┘       │
│                                                          │
│ 200 characters remaining                                 │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                [Cancel]          [Save Note]             │
└──────────────────────────────────────────────────────────┘
```

**Features**:
- Rich text or plain text
- Character limit (1000)
- Auto-save as draft
- @Mention team members (optional)
- Attach files (optional)

---

### 5.12 LogInteractionModal Component

**Purpose**: Log interaction with lead

**Props**:
```typescript
interface LogInteractionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (interaction: InteractionData) => void;
}
```

**Visual Design**:
```
┌──────────────────────────────────────────────────────────┐
│ Log Interaction                             [×]          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ Type:                                                    │
│ [📞 Call] [✉️ Email] [🤝 Meeting] [💻 Demo] [📝 Other] │
│                                                          │
│ Description:                                             │
│ ┌────────────────────────────────────────────────┐       │
│ │                                                  │       │
│ │                                                  │       │
│ └────────────────────────────────────────────────┘       │
│                                                          │
│ Duration (minutes): [15]                                │
│                                                          │
│ Outcome: [Positive ▼]                                   │
│                                                          │
│ Follow-up required: [✓]                                 │
│                                                          │
│ If yes, date: [Jan 25, 2026 ▼]                          │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                [Cancel]          [Log Interaction]       │
└──────────────────────────────────────────────────────────┘
```

**Interaction Types**:
- Call (duration required)
- Email (link to email system)
- Meeting (duration, location)
- Demo (duration, link)
- Other

**Outcomes**:
- Positive
- Neutral
- Negative
- Follow-up required

---

### 5.13 TaskList Component

**Purpose**: Display tasks associated with lead

**Props**:
```typescript
interface TaskListProps {
  tasks: Task[];
  onAdd: (task: Task) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}
```

**Visual Design**:
```
┌──────────────────────────────────────────────────────────┐
│ Tasks                                    [+ Add Task]    │
│ ─────────────────────────────────────────────────────── │
│                                                          │
│ Overdue                                                  │
│ ┌────────────────────────────────────────────────┐       │
│ │ [ ] Follow up on proposal        Due: Jan 18   │       │
│ │     Assigned to: John Smith                   │       │
│ │     [Complete] [Edit] [Delete]                │       │
│ └────────────────────────────────────────────────┘       │
│                                                          │
│ Today                                                    │
│ ┌────────────────────────────────────────────────┐       │
│ │ [✓] Send pricing information      Due: Today   │       │
│ │     Completed by Jane Doe                     │       │
│ │     [Reopen] [Delete]                         │       │
│ └────────────────────────────────────────────────┘       │
│                                                          │
│ Upcoming                                                 │
│ ┌────────────────────────────────────────────────┐       │
│ │ [ ] Schedule demo call            Due: Jan 25   │       │
│ │     Assigned to: You                          │       │
│ │     [Complete] [Edit] [Delete]                │       │
│ └────────────────────────────────────────────────┘       │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Task States**:
- Overdue (red)
- Due today (yellow)
- Upcoming (blue)
- Completed (green, strikethrough)

**Features**:
- Checkbox to complete
- Due date with relative time
- Assigned to avatar
- Priority indicator
- Grouped by due date

---

### 5.14 LeadCaptureForm Component

**Purpose**: Capture leads from website

**Props**:
```typescript
interface LeadCaptureFormProps {
  type: 'contact' | 'newsletter' | 'event' | 'download';
  fields: FormField[];
  onSubmit: (data: LeadData) => void;
  source: string;
}
```

**Visual Design** (Generic):
```
┌──────────────────────────────────────────────────────────┐
│ Get in Touch                                             │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ Name *                                                   │
│ [________________________________________________]       │
│                                                          │
│ Email *                                                  │
│ [________________________________________________]       │
│                                                          │
│ Phone                                                   │
│ [________________________________________________]       │
│                                                          │
│ Company                                                 │
│ [________________________________________________]       │
│                                                          │
│ Message *                                               │
│ ┌────────────────────────────────────────────────┐       │
│ │                                                  │       │
│ │                                                  │       │
│ └────────────────────────────────────────────────┘       │
│                                                          │
│ ☐ I consent to receive marketing communications          │
│                                                          │
│                        [Send Message]                    │
└──────────────────────────────────────────────────────────┘
```

**Progressive Profiling** (Stage-based):
```
Stage 1 (Initial):
- Email only

Stage 2 (Follow-up):
- Name, Company, Job Title

Stage 3 (Qualified):
- Budget, Timeline, Industry

Stage 4 (Opportunity):
- Detailed requirements
```

**Validation**:
- Email: Required, valid format
- Name: Required for stage 2+
- Phone: Optional, valid format if provided
- GDPR consent: Required checkbox

**Success State**:
```
┌──────────────────────────────────────────────────────────┐
│                   ✓ Thank You!                           │
│                                                          │
│ Your information has been submitted successfully.       │
│                                                          │
│ We'll be in touch within 24 hours.                       │
│                                                          │
│ In the meantime, check out our resources:               │
│ • [Blog]                                                │
│ • [Case Studies]                                        │
│ • [Documentation]                                       │
│                                                          │
│                        [Close]                          │
└──────────────────────────────────────────────────────────┘
```

---

### 5.15 SourcesChart Component

**Purpose**: Display lead source distribution

**Props**:
```typescript
interface SourcesChartProps {
  data: SourceData[];
  type: 'donut' | 'bar' | 'pie';
}
```

**Visual Design** (Donut Chart):
```
        Leads by Source

        ┌─────────┐
        │ ╔═══╗   │
        │ ║   ║   │
        │ ║   ║   │
        │ ╚═══╝   │
        └─────────┘

  Website      ████████████████ 45% (1,103)
  Referral     ██████████ 30% (735)
  Newsletter   █████ 15% (368)
  Event        ███ 8% (196)
  Chatbot      ██ 2% (49)

  Total: 2,451 leads
```

**Interactions**:
- Hover: Show exact count and percentage
- Click segment: Filter lead list by source
- Legend: Click to toggle visibility

---

### 5.16 StatusChart Component

**Purpose**: Display lead funnel by status

**Props**:
```typescript
interface StatusChartProps {
  data: StatusData[];
  type: 'funnel' | 'bar';
}
```

**Visual Design** (Funnel):
```
┌──────────────────────────────────────────────────────────┐
│                     Lead Funnel                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────────────────────────┐               │
│  │           New: 1,200                 │               │
│  └──────────────────────────────────────┘               │
│                    │                                     │
│                    ▼                                     │
│  ┌──────────────────────────────────────┐               │
│  │       Contacted: 850                 │               │
│  └──────────────────────────────────────┘               │
│                    │                                     │
│                    ▼                                     │
│  ┌──────────────────────────────────────┐               │
│  │       Qualified: 456                 │               │
│  └──────────────────────────────────────┘               │
│                    │                                     │
│                    ▼                                     │
│  ┌──────────────────────────────────────┐               │
│  │       Proposal: 150                  │               │
│  └──────────────────────────────────────┘               │
│                    │                                     │
│                    ▼                                     │
│  ┌──────────────────────────────────────┐               │
│  │         Won: 75 (6.25%)              │               │
│  └──────────────────────────────────────┘               │
│                    │                                     │
│                    ▼                                     │
│  ┌──────────────────────────────────────┐               │
│  │         Lost: 40 (3.33%)             │               │
│  └──────────────────────────────────────┘               │
│                                                          │
└──────────────────────────────────────────────────────────┘

Conversion Rate: 6.25%
Avg. Sales Cycle: 45 days
```

**Features**:
- Click stage: Filter leads by status
- Show conversion rates between stages
- Color-coded by status

---

## 6. State Management

### 6.1 LeadContext Structure

**File**: `src/contexts/LeadContext.jsx`

**State**:
```javascript
{
  // Leads
  leads: Lead[],
  currentLead: Lead | null,
  selectedLeads: Set<string>,

  // Dashboard
  stats: {
    total: number,
    newThisMonth: number,
    qualified: number,
    conversionRate: number
  },

  // Filters
  filters: {
    status: string[],
    score: { min: number, max: number },
    source: string[],
    assignedTo: string[],
    dateRange: { start: Date, end: Date }
  },
  searchQuery: string,
  sortBy: 'date' | 'score' | 'name',
  sortOrder: 'asc' | 'desc',

  // UI State
  loading: boolean,
  error: string | null,
  pagination: {
    page: number,
    limit: number,
    total: number
  },

  // Modals
  showAddNote: boolean,
  showLogInteraction: boolean,
  showAddTask: boolean,
  showEditLead: boolean,
}
```

**Actions**:
```javascript
{
  // Fetching
  fetchLeads: (params) => Promise<void>,
  fetchLead: (id) => Promise<void>,
  fetchStats: () => Promise<void>,

  // CRUD
  createLead: (data) => Promise<void>,
  updateLead: (id, data) => Promise<void>,
  deleteLead: (id) => Promise<void>,
  convertLead: (id) => Promise<void>,

  // Interactions
  addNote: (leadId, note) => Promise<void>,
  logInteraction: (leadId, interaction) => Promise<void>,
  addTask: (leadId, task) => Promise<void>,
  toggleTask: (leadId, taskId) => Promise<void>,

  // Bulk Actions
  updateMultiple: (ids, data) => Promise<void>,
  assignMultiple: (ids, userId) => Promise<void>,
  exportLeads: (ids) => Promise<void>,

  // Filters
  setFilters: (filters) => void,
  clearFilters: () => void,
  setSearchQuery: (query) => void,
  setSort: (by, order) => void,

  // UI Actions
  selectLead: (id) => void,
  selectMultiple: (ids) => void,
  clearSelection: () => void,
  openModal: (modal) => void,
  closeModal: () => void,
}
```

---

## 7. API Integration

### 7.1 LeadService

**File**: `src/services/leadService.js`

**Methods**:
```javascript
// Fetching
const fetchLeads = (params) => {
  return axios.get('/api/leads', { params });
};

const fetchLead = (id) => {
  return axios.get(`/api/leads/${id}`);
};

const fetchStats = () => {
  return axios.get('/api/leads/statistics');
};

const fetchQualified = () => {
  return axios.get('/api/leads/qualified');
};

// CRUD
const createLead = (data) => {
  return axios.post('/api/leads', data);
};

const updateLead = (id, data) => {
  return axios.put(`/api/leads/${id}`, data);
};

const deleteLead = (id) => {
  return axios.delete(`/api/leads/${id}`);
};

// Scoring
const recalculateScore = (id) => {
  return axios.post(`/api/leads/${id}/score`);
};

// Conversion
const convertLead = (id, data) => {
  return axios.post(`/api/leads/${id}/convert`, data);
};

// Notes
const addNote = (leadId, note) => {
  return axios.post(`/api/leads/${leadId}/notes`, { note });
};

// Export
const exportLeads = (params) => {
  return axios.get('/api/leads/export', {
    params,
    responseType: 'blob'
  });
};

// Import
const importLeads = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return axios.post('/api/leads/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};
```

---

## 8. User Flows

### 8.1 Primary User Flows

**Flow 1: View Dashboard**
1. User navigates to `/leads` (default: dashboard)
2. LeadContext fetches statistics
3. KPI cards display metrics
4. Charts render with data
5. Recent leads table shows latest activity
6. User can click KPI to filter leads

**Flow 2: Search & Filter Leads**
1. User navigates to "Leads" section
2. LeadContext fetches all leads (paginated)
3. User enters search query
4. Debounce 500ms, then filter leads
5. User applies additional filters (status, score, etc.)
6. List updates with filtered results
7. User can save filter combination as preset

**Flow 3: View Lead Detail**
1. User clicks lead from list
2. LeadContext fetches full lead data
3. Lead detail view opens with Overview tab
4. User can switch tabs (Interactions, Tasks, Emails)
5. User can edit lead information
6. Changes save automatically or on button click

**Flow 4: Add Note to Lead**
1. User opens lead detail
2. User clicks "+ Add Note" button
3. AddNoteModal opens
4. User types note content
5. User clicks "Save Note"
6. LeadContext calls API to add note
7. Interaction timeline updates with new note
8. Modal closes

**Flow 5: Log Interaction**
1. User opens lead detail
2. User clicks "+ Log Interaction"
3. LogInteractionModal opens
4. User selects interaction type
5. User fills in details (description, duration, outcome)
6. User clicks "Log Interaction"
7. API call to log interaction
8. Timeline updates, lead score may adjust
9. If follow-up required, task created automatically

**Flow 6: Convert Lead to Opportunity**
1. User views qualified lead (score 60+)
2. User clicks "Convert to Opportunity" in actions menu
4. Conversion modal opens (pre-fill with available data)
5. User confirms conversion
6. Lead status changes to "Proposal"
7. Opportunity created in sales system
8. Notification sent to assigned user

**Flow 7: Assign Leads**
1. User selects one or more leads (checkboxes)
2. BulkActionBar appears
3. User clicks "Assign to..."
4. User picker modal opens
5. User selects team member
6. API call to update assignedTo field
7. Leads update with new assignment
8. Notification sent to assignee

**Flow 8: Import Leads**
1. User navigates to Settings
2. User clicks "Import Leads"
3. Import modal opens
4. User downloads CSV template
5. User fills in lead data
6. User uploads CSV file
7. System validates data
8. Preview shows first 10 rows
9. User confirms import
10. Progress bar shows import status
11. Summary shows successful/failed imports
12. Imported leads appear in list

---

## 9. Responsive Design

### 9.1 Mobile Adaptations

**Lead List**:
- Card view only (no table)
- Swipe actions:
  - Swipe left: Delete
  - Swipe right: Star/Mark
- Pull to refresh
- Infinite scroll (no pagination)

**Lead Detail**:
- Full-screen view
- Bottom sheet for actions
- Swipe left/right between tabs
- Collapsible sections (accordion style)

**Dashboard**:
- Stack KPI cards vertically
- Charts become full-width
- Recent leads table shows 5 items only

**Forms**:
- Full-screen modals
- Larger touch targets (44px min)
- Numeric keyboards for numbers
- Calendar picker for dates

---

## 10. Accessibility

### 10.1 Keyboard Navigation

**Shortcuts**:
- `N`: New lead (open capture form)
- `F`: Focus search
- `L`: Open lead list
- `D`: Open dashboard
- `Enter`: Open selected lead
- `Esc`: Close modal
- `Ctrl/Cmd + K`: Quick search (Command palette)

### 10.2 ARIA Labels

```html
<button aria-label="Add note to lead">
  <Icon name="note" />
</button>

<div role="list" aria-label="Leads list">
  <div role="listitem" aria-label={`Lead ${lead.name}`}>
    {/* Lead card */}
  </div>
</div>
```

### 10.3 Screen Reader Support

- Announce lead count changes
- Announce filter results
- Describe chart data (alt text)
- Indicate form errors
- Provide context for actions

---

## 11. Design Guidelines

### 11.1 Color Palette

Same as Email System (see email-system-ui-spec.md)

### 11.2 Lead-Specific Colors

**Score Colors**:
- Excellent (100-120): Purple (#a855f7)
- High (80-99): Green (#22c55e)
- Good (60-79): Blue (#3b82f6)
- Average (40-59): Yellow (#eab308)
- Low (20-39): Orange (#f97316)
- Poor (0-19): Gray (#6b7280)

**Status Colors**:
- New: Blue (#3b82f6)
- Contacted: Yellow (#eab308)
- Qualified: Green (#22c55e)
- Proposal: Purple (#a855f7)
- Won: Green fill (#22c55e)
- Lost: Red (#ef4444)

**Source Colors**:
- Website: Blue
- Referral: Green
- Newsletter: Purple
- Event: Orange
- Chatbot: Yellow

---

## 12. Performance Optimization

### 12.1 List Virtualization

For lead lists with 1000+ leads:
```javascript
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={leads.length}
  itemSize={120}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>
      <LeadCard lead={leads[index]} />
    </div>
  )}
</FixedSizeList>
```

### 12.2 Lazy Loading

```javascript
// Lazy load charts
const SourcesChart = lazy(() =>
  import('./components/lead/SourcesChart')
);

// Lazy load detail view
const LeadDetail = lazy(() =>
  import('./components/lead/LeadDetail')
);
```

### 12.3 Memoization

```javascript
// Memoize lead cards
const LeadCardMemo = memo(LeadCard, (prev, next) => {
  return (
    prev.lead._id === next.lead._id &&
    prev.lead.score === next.lead.score &&
    prev.lead.status === next.lead.status
  );
});
```

---

## 13. Testing Requirements

### 13.1 Component Tests

- LeadList: Renders leads, handles selection
- LeadCard: Click, select, star actions
- LeadDetail: Tabs switching, data display
- AddNoteModal: Form validation, submit
- LogInteractionModal: Type selection, validation
- KPICard: Data display, formatting

### 13.2 Integration Tests

- Search and filter leads
- Update lead status
- Add note to lead
- Log interaction
- Assign leads
- Export leads (CSV generation)

### 13.3 E2E Tests (Playwright/Cypress)

- User views dashboard
- User searches for lead
- User opens lead detail
- User adds note
- User logs interaction
- User updates status
- User exports leads

---

**Document Status**: Complete
**Next Steps**: Local Development Setup Guide
**Maintained By**: Architecture Team
**Questions**: Consult architecture team or escalate via `.agent-workspace/escalations/`
