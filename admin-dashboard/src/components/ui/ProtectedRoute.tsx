/**
 * ProtectedRoute Component
 * Route wrapper that requires authentication
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Loading } from '../layout/Loading';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireRole?: string | string[];
  requirePermission?: { resource: string; action: string };
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireRole,
  requirePermission,
}) => {
  const { user: _user, isAuthenticated, isLoading, hasRole, hasPermission } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <Loading fullScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireRole && !hasRole(requireRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (requirePermission && !hasPermission(requirePermission.resource, requirePermission.action)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};
