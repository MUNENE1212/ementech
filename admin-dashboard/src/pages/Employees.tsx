/**
 * Employees Page
 * Employee management (admin/manager only)
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Mail, Shield, Trash2, Edit2 } from 'lucide-react';
import { useEmployees, useFilters } from '../hooks';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { StatusBadge } from '../components/ui/Badge';
import { Table, Pagination } from '../components/tables/Table';
import { ConfirmModal } from '../components/ui/Modal';
import { Card, CardHeader } from '../components/ui/Card';
import type { User } from '../types';

export const Employees: React.FC = () => {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const [deleteEmployeeId, setDeleteEmployeeId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'list' | 'permissions' | 'performance'>('list');

  // Check authorization
  if (!hasRole(['admin', 'manager'])) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card padding="lg">
          <div className="text-center">
            <Shield className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-500">You don't have permission to view this page.</p>
          </div>
        </Card>
      </div>
    );
  }

  const { filters, updateFilter } = useFilters({
    page: 1,
    limit: 20,
  });

  const { employees, pagination, isLoading, refetch, inviteEmployee, deleteEmployee } = useEmployees(filters);

  const columns = [
    {
      key: 'name',
      title: 'Employee',
      render: (_: any, record: User) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-medium">
            {record.firstName?.[0] || record.email[0].toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-gray-900">
              {record.firstName} {record.lastName}
            </p>
            <p className="text-sm text-gray-500">{record.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'jobTitle',
      title: 'Role',
      render: (_: any, record: User) => (
        <div>
          <p className="font-medium text-gray-900">{record.jobTitle || 'N/A'}</p>
          <p className="text-sm text-gray-500 capitalize">{record.role}</p>
        </div>
      ),
    },
    {
      key: 'department',
      title: 'Department',
      render: (value: string) => value || <span className="text-gray-400">-</span>,
    },
    {
      key: 'companyEmail',
      title: 'Company Email',
      render: (value: any) => {
        if (value?.address) {
          return (
            <div className="flex items-center gap-2">
              <Mail size={14} className="text-gray-400" />
              <span className="text-sm">{value.address}</span>
              {value.configured && (
                <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">Active</span>
              )}
            </div>
          );
        }
        return <span className="text-gray-400">Not configured</span>;
      },
    },
    {
      key: 'assignedLeads',
      title: 'Assigned Leads',
      render: (_: any, record: User) => {
        const assigned = record.assignedLeads?.length || 0;
        const capacity = record.maxLeadCapacity || 0;
        const percent = capacity > 0 ? Math.round((assigned / capacity) * 100) : 0;
        return (
          <div>
            <p className="font-medium text-gray-900">{assigned} / {capacity || '∞'}</p>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
              <div
                className={`h-1.5 rounded-full ${
                  percent > 90 ? 'bg-red-500' : percent > 70 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(percent, 100)}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      key: 'status',
      title: 'Status',
      render: (value: string) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          value === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {value || 'Pending'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      title: 'Hired',
      render: (value: string) => value ? new Date(value).toLocaleDateString() : '-',
    },
  ];

  const handleSearch = (query: string) => {
    updateFilter('search', query || undefined);
  };

  const handleRoleFilter = (role: string) => {
    updateFilter('role', role === 'all' ? undefined : role);
  };

  const handleInvite = async (email: string, role: string) => {
    await inviteEmployee(email, role);
    refetch();
  };

  const handleDelete = async () => {
    if (deleteEmployeeId) {
      await deleteEmployee(deleteEmployeeId);
      setDeleteEmployeeId(null);
      setShowDeleteModal(false);
      refetch();
    }
  };

  // Stats cards
  const stats = {
    total: employees.length,
    active: employees.filter((e) => e.status === 'active').length,
    admins: employees.filter((e) => e.role === 'admin').length,
    managers: employees.filter((e) => e.role === 'manager').length,
    totalAssigned: employees.reduce((sum, e) => sum + (e.assignedLeads?.length || 0), 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
          <p className="text-gray-500">Manage your team and permissions</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            leftIcon={<Mail size={16} />}
            onClick={() => navigate('/employees/invite')}
          >
            Invite Employee
          </Button>
          <Button
            variant="primary"
            leftIcon={<Plus size={16} />}
            onClick={() => navigate('/employees/new')}
          >
            Add Employee
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card padding="sm">
          <p className="text-sm text-gray-500">Total Employees</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </Card>
        <Card padding="sm">
          <p className="text-sm text-gray-500">Active</p>
          <p className="text-2xl font-bold text-green-600">{stats.active}</p>
        </Card>
        <Card padding="sm">
          <p className="text-sm text-gray-500">Admins</p>
          <p className="text-2xl font-bold text-purple-600">{stats.admins}</p>
        </Card>
        <Card padding="sm">
          <p className="text-sm text-gray-500">Managers</p>
          <p className="text-2xl font-bold text-blue-600">{stats.managers}</p>
        </Card>
        <Card padding="sm">
          <p className="text-sm text-gray-500">Assigned Leads</p>
          <p className="text-2xl font-bold text-primary-600">{stats.totalAssigned}</p>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-6">
          <button
            onClick={() => setSelectedTab('list')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              selectedTab === 'list'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            All Employees
          </button>
          <button
            onClick={() => setSelectedTab('permissions')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              selectedTab === 'permissions'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Permissions
          </button>
          <button
            onClick={() => setSelectedTab('performance')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              selectedTab === 'performance'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Performance
          </button>
        </div>
      </div>

      {selectedTab === 'list' && (
        <>
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[250px]">
              <Input
                placeholder="Search employees..."
                leftIcon={<Search size={18} className="text-gray-400" />}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg p-1">
              {['all', 'admin', 'manager', 'employee'].map((role) => (
                <button
                  key={role}
                  onClick={() => handleRoleFilter(role)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    (filters.role === role) || (role === 'all' && !filters.role)
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {role === 'all' ? 'All' : role.charAt(0).toUpperCase() + role.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Employees Table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <Table
              columns={columns}
              data={employees}
              keyField="_id"
              isLoading={isLoading}
              emptyMessage="No employees found"
              onRowClick={(record) => navigate(`/employees/${record._id}`)}
            />
          </div>
        </>
      )}

      {selectedTab === 'permissions' && (
        <Card>
          <CardHeader title="Permissions Overview" />
          <div className="space-y-4">
            <p className="text-gray-600">
              Configure what resources and actions each role can access.
            </p>
            {/* Permission matrix would go here */}
            <div className="text-center py-8 text-gray-400">
              Permission management interface
            </div>
          </div>
        </Card>
      )}

      {selectedTab === 'performance' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {employees.map((employee) => (
            <Card key={employee._id} hover padding="sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-medium">
                  {employee.firstName?.[0]}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {employee.firstName} {employee.lastName}
                  </p>
                  <p className="text-sm text-gray-500">{employee.jobTitle}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Assigned Leads</p>
                  <p className="text-xl font-bold text-gray-900">
                    {employee.assignedLeads?.length || 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Capacity</p>
                  <p className="text-xl font-bold text-gray-900">
                    {employee.maxLeadCapacity || '∞'}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="secondary"
                className="w-full mt-4"
                onClick={() => navigate(`/employees/${employee._id}`)}
              >
                View Details
              </Button>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeleteEmployeeId(null);
        }}
        onConfirm={handleDelete}
        title="Deactivate Employee"
        message="Are you sure you want to deactivate this employee? They will no longer have access to the system."
        confirmText="Deactivate"
        variant="danger"
      />
    </div>
  );
};
