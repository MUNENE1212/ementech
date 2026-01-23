/**
 * App Component
 * Main application with routing and providers
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ui/ProtectedRoute';
import { AdminLayout } from './components/layout/AdminLayout';
import {
  Login,
  Dashboard,
  Leads,
  LeadDetail,
  Campaigns,
  CampaignDetail,
  Sequences,
  SequenceDetail,
  Templates,
  TemplateDetail,
  Social,
  SocialPostDetail,
  Analytics,
  Employees,
  EmployeeDetail,
  Settings,
  NotFound,
  Unauthorized,
} from './pages/index';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 60000, // 1 minute
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />

            {/* Protected routes with layout */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AdminLayout title="Dashboard" subtitle="Welcome back" />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />

              {/* Leads */}
              <Route path="leads" element={<Leads />} />
              <Route path="leads/:id" element={<LeadDetail />} />

              {/* Campaigns */}
              <Route path="campaigns" element={<Campaigns />} />
              <Route path="campaigns/new" element={<CampaignDetail />} />
              <Route path="campaigns/:id" element={<CampaignDetail />} />

              {/* Sequences */}
              <Route path="sequences" element={<Sequences />} />
              <Route path="sequences/new" element={<SequenceDetail />} />
              <Route path="sequences/:id/edit" element={<SequenceDetail />} />
              <Route path="sequences/:id" element={<SequenceDetail />} />

              {/* Templates */}
              <Route path="templates" element={<Templates />} />
              <Route path="templates/new" element={<TemplateDetail />} />
              <Route path="templates/:id" element={<TemplateDetail />} />

              {/* Social */}
              <Route path="social" element={<Social />} />
              <Route path="social/new" element={<SocialPostDetail />} />
              <Route path="social/:id/edit" element={<SocialPostDetail />} />
              <Route path="social/:id" element={<SocialPostDetail />} />
              <Route path="social/accounts/:id" element={<div className="p-6">Account Management - Coming Soon</div>} />
              <Route path="social/connect" element={<div className="p-6">Connect Account - Coming Soon</div>} />

              {/* Analytics */}
              <Route path="analytics" element={<Analytics />} />

              {/* Employees (admin/manager only) */}
              <Route
                path="employees"
                element={
                  <ProtectedRoute requireRole={['admin', 'manager']}>
                    <Employees />
                  </ProtectedRoute>
                }
              />
              <Route
                path="employees/new"
                element={
                  <ProtectedRoute requireRole={['admin', 'manager']}>
                    <EmployeeDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="employees/invite"
                element={
                  <ProtectedRoute requireRole={['admin', 'manager']}>
                    <div className="p-6">Invite Employee - Coming Soon</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="employees/:id"
                element={
                  <ProtectedRoute requireRole={['admin', 'manager']}>
                    <EmployeeDetail />
                  </ProtectedRoute>
                }
              />

              {/* Settings */}
              <Route path="settings" element={<Settings />} />

              {/* A/B Tests */}
              <Route path="abtests" element={<div className="p-6">A/B Tests - Coming Soon</div>} />
            </Route>

            {/* Error pages */}
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
