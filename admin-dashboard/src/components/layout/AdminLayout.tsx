/**
 * AdminLayout Component
 * Main layout wrapper for the admin dashboard
 */

import React, { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ErrorBoundary } from '../ui/ErrorBoundary';

interface AdminLayoutProps {
  title?: string;
  subtitle?: string;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ title, subtitle }) => {
  return (
    <ErrorBoundary>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header title={title} subtitle={subtitle} />
          <main className="flex-1 p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </ErrorBoundary>
  );
};
