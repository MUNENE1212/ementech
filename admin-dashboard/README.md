# EmenTech Admin Dashboard

React + TypeScript admin dashboard for managing marketing campaigns, leads, sequences, and more.

## Tech Stack

- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **React Router** - Routing
- **Tailwind CSS** - Styling
- **React Query (@tanstack/react-query)** - Data fetching & caching
- **Axios** - HTTP client
- **Recharts** - Charts
- **Lucide React** - Icons

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The dashboard will be available at `http://localhost:5174`

### Build

```bash
npm run build
```

### Preview

```bash
npm run preview
```

## Project Structure

```
admin-dashboard/
├── src/
│   ├── components/
│   │   ├── charts/         # Chart components (Line, Bar, Pie, Funnel)
│   │   ├── forms/          # Form components
│   │   ├── layout/         # Layout components (AdminLayout, Sidebar, Header)
│   │   ├── tables/         # Table components
│   │   ├── modals/         # Modal components
│   │   └── ui/             # UI components (Button, Input, Card, Badge, Modal, etc.)
│   ├── contexts/           # React contexts (AuthContext)
│   ├── hooks/              # Custom hooks (useLeads, useCampaigns, etc.)
│   ├── pages/              # Page components
│   ├── services/           # API service functions
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # Utility functions
│   ├── App.tsx             # Main app with routing
│   └── main.tsx            # Entry point
├── index.html
├── vite.config.ts
├── tailwind.config.js
└── package.json
```

## Features

### Pages

1. **Dashboard** - Overview with KPIs and charts
2. **Leads** - Lead management with list and Kanban board views
3. **Campaigns** - Email campaign management
4. **Sequences** - Automated email sequences
5. **Templates** - Email template management
6. **Social** - Social media post management
7. **Analytics** - Comprehensive analytics dashboard
8. **Employees** - Team and permission management (admin/manager only)
9. **Settings** - System configuration

### Components

- **Layout** - Sidebar navigation, header with search, user menu
- **Tables** - Sortable, paginated data tables
- **Charts** - Line, Bar, Pie, and Funnel charts
- **Forms** - Reusable form inputs with validation
- **Modals** - Confirmation dialogs and forms

### API Integration

All API calls are made through service functions in `src/services/`:
- `authService` - Authentication
- `leadService` - Lead CRUD
- `campaignService` - Campaign management
- `sequenceService` - Sequence management
- `templateService` - Template CRUD
- `socialService` - Social media
- `analyticsService` - Analytics data
- `employeeService` - Employee management

## Authentication

The dashboard uses JWT tokens for authentication. Login credentials are stored in localStorage.

## Environment Variables

See `.env.example` for required environment variables.

## Deployment

The dashboard is built as static files and can be deployed to any static hosting service:

1. Build the project: `npm run build`
2. Deploy the `dist/` folder

For production, the API URL should be configured in `VITE_API_URL`.
