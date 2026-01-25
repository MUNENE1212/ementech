/**
 * Sidebar Component
 * Main navigation sidebar for the admin dashboard
 */

import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Mail,
  MessageSquare,
  FileText,
  Share2,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  FlaskConical,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface NavItem {
  path: string;
  label: string;
  icon: React.ElementType;
  permission?: { resource: string; action: string };
  roles?: string[];
}

const navItems: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/leads', label: 'Leads', icon: Users },
  { path: '/campaigns', label: 'Campaigns', icon: Mail },
  { path: '/sequences', label: 'Sequences', icon: MessageSquare },
  { path: '/templates', label: 'Templates', icon: FileText },
  { path: '/social', label: 'Social Media', icon: Share2 },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/abtests', label: 'A/B Tests', icon: FlaskConical },
  { path: '/employees', label: 'Employees', icon: Briefcase, roles: ['admin', 'manager'] },
  { path: '/settings', label: 'Settings', icon: Settings },
];

interface SidebarProps {
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ className = '' }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { hasRole, hasPermission, user } = useAuth();

  const canAccess = (item: NavItem) => {
    if (item.roles && !hasRole(item.roles)) {
      return false;
    }
    if (item.permission && !hasPermission(item.permission.resource, item.permission.action)) {
      return false;
    }
    return true;
  };

  // Get user info outside of conditional render to avoid React Hooks violations
  const userInitial = user?.firstName?.[0] || 'U';
  const userFirstName = user?.firstName || '';
  const userLastName = user?.lastName || '';
  const userRole = user?.role || '';

  return (
    <aside
      className={`bg-dark-900 text-white transition-all duration-300 flex flex-col h-screen sticky top-0 ${
        isCollapsed ? 'w-16' : 'w-64'
      } ${className}`}
    >
      {/* Logo */}
      <div className="p-4 border-b border-dark-700 flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center font-bold text-white">
              E
            </div>
            <span className="font-semibold text-lg">EmenTech</span>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg hover:bg-dark-700 transition-colors ml-auto"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-2">
          {navItems.filter(canAccess).map((item) => {
            const Icon = item.icon;

            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive: navActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                      navActive
                        ? 'bg-primary-600 text-white'
                        : 'text-gray-300 hover:bg-dark-700 hover:text-white'
                    }`
                  }
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon size={20} />
                  {!isCollapsed && <span className="font-medium">{item.label}</span>}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Info */}
      {!isCollapsed && (
        <div className="p-4 border-t border-dark-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-semibold">
              {userInitial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {userFirstName} {userLastName}
              </p>
              <p className="text-xs text-gray-400 capitalize">{userRole}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
