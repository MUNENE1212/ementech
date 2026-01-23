/**
 * Leads Page
 * Lead management with list view and Kanban board
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Filter, Download, Grid3x3, List } from 'lucide-react';
import { useLeads, useFilters, usePagination } from '../hooks';
import { Table, Pagination } from '../components/tables/Table';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { StatusBadge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { LeadForm } from '../components/forms/LeadForm';
import { ConfirmModal } from '../components/ui/Modal';
import type { Lead, LeadFilters } from '../types';

const PIPELINE_STAGES = [
  { value: 'new', label: 'New', color: 'bg-blue-500' },
  { value: 'contacted', label: 'Contacted', color: 'bg-purple-500' },
  { value: 'qualified', label: 'Qualified', color: 'bg-green-500' },
  { value: 'proposal', label: 'Proposal', color: 'bg-yellow-500' },
  { value: 'negotiation', label: 'Negotiation', color: 'bg-orange-500' },
  { value: 'won', label: 'Won', color: 'bg-emerald-500' },
  { value: 'lost', label: 'Lost', color: 'bg-red-500' },
];

const LEAD_SOURCES = ['Website', 'Referral', 'LinkedIn', 'Twitter', 'Email', 'Ads', 'Other'];

export const Leads: React.FC = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deleteLeadId, setDeleteLeadId] = useState<string | null>(null);

  const { filters, updateFilter, resetFilters, hasActiveFilters } = useFilters<LeadFilters>({
    page: 1,
    limit: 20,
  });

  const pagination = usePagination({
    initialPage: filters.page || 1,
    initialLimit: filters.limit || 20,
    totalPages: 1, // Will be updated from API response
  });

  const { leads, pagination: apiPagination, isLoading, refetch, createLead, deleteLead } = useLeads({
    ...filters,
    page: pagination.page,
    limit: pagination.limit,
  });

  // Update total pages from API
  React.useEffect(() => {
    if (apiPagination?.totalPages && apiPagination.totalPages !== pagination.totalPages) {
      pagination.updateTotalPages(apiPagination.totalPages);
    }
  }, [apiPagination?.totalPages, pagination]);

  const columns = [
    {
      key: 'name',
      title: 'Name',
      render: (_: any, record: Lead) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-medium text-sm">
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
      key: 'company',
      title: 'Company',
      render: (value: string) => value || <span className="text-gray-400">-</span>,
    },
    {
      key: 'status',
      title: 'Status',
      render: (value: string) => <StatusBadge status={value} />,
    },
    {
      key: 'source',
      title: 'Source',
      render: (value: string) => value || <span className="text-gray-400">-</span>,
    },
    {
      key: 'score',
      title: 'Score',
      render: (value: number) => {
        const score = value || 0;
        const color =
          score >= 80 ? 'text-green-600' : score >= 50 ? 'text-yellow-600' : 'text-gray-600';
        return <span className={`font-medium ${color}`}>{score}</span>;
      },
    },
    {
      key: 'estimatedValue',
      title: 'Value',
      render: (value: number) =>
        value ? `$${value.toLocaleString()}` : <span className="text-gray-400">-</span>,
    },
    {
      key: 'assignedTo',
      title: 'Assigned To',
      render: (value: string) => value || <span className="text-gray-400">Unassigned</span>,
    },
    {
      key: 'createdAt',
      title: 'Created',
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
  ];

  const handleSearch = (query: string) => {
    updateFilter('search', query || undefined);
    pagination.reset();
  };

  const handleStatusFilter = (status: string) => {
    updateFilter('status', status === 'all' ? undefined : [status]);
    pagination.reset();
  };

  const handlePageChange = (page: number) => {
    pagination.goToPage(page);
    updateFilter('page', page);
  };

  const handleLeadClick = (lead: Lead) => {
    navigate(`/leads/${lead._id}`);
  };

  const handleCreateLead = async (data: Partial<Lead>) => {
    await createLead(data);
    setIsCreateModalOpen(false);
    refetch();
  };

  const handleDeleteLead = async () => {
    if (deleteLeadId) {
      await deleteLead(deleteLeadId);
      setDeleteLeadId(null);
      refetch();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
          <p className="text-gray-500">Manage and track your leads</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            leftIcon={<Download size={16} />}
            onClick={() => {/* Export logic */}}
          >
            Export
          </Button>
          <Button
            variant="primary"
            leftIcon={<Plus size={16} />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            Add Lead
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[250px]">
          <Input
            placeholder="Search leads..."
            leftIcon={<Search size={18} className="text-gray-400" />}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg p-1">
          {['all', ...PIPELINE_STAGES.map((s) => s.value)].map((status) => (
            <button
              key={status}
              onClick={() => handleStatusFilter(status)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                (!filters.status?.[0] && status === 'all') || filters.status?.[0] === status
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {status === 'all' ? 'All' : PIPELINE_STAGES.find((s) => s.value === status)?.label || status}
            </button>
          ))}
        </div>

        <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 ${viewMode === 'list' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
          >
            <List size={18} />
          </button>
          <button
            onClick={() => setViewMode('kanban')}
            className={`p-2 ${viewMode === 'kanban' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
          >
            <Grid3x3 size={18} />
          </button>
        </div>

        {hasActiveFilters && (
          <Button variant="ghost" onClick={resetFilters}>
            Clear Filters
          </Button>
        )}
      </div>

      {/* List View */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <Table
            columns={columns}
            data={leads}
            keyField="_id"
            isLoading={isLoading}
            emptyMessage="No leads found"
            onRowClick={handleLeadClick}
          />
          {apiPagination && (
            <Pagination
              page={pagination.page}
              totalPages={apiPagination.totalPages || 1}
              total={apiPagination.total || 0}
              limit={pagination.limit}
              onPageChange={handlePageChange}
              onLimitChange={(limit) => {
                pagination.changeLimit(limit);
                updateFilter('limit', limit);
              }}
            />
          )}
        </div>
      )}

      {/* Kanban View */}
      {viewMode === 'kanban' && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {PIPELINE_STAGES.map((stage) => (
            <div key={stage.value} className="flex-shrink-0 w-80">
              <div className="bg-gray-100 rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                    <h3 className="font-semibold text-gray-900">{stage.label}</h3>
                  </div>
                  <span className="text-sm text-gray-500">
                    {leads.filter((l) => l.status === stage.value).length}
                  </span>
                </div>
                <div className="space-y-3">
                  {leads
                    .filter((l) => l.status === stage.value)
                    .map((lead) => (
                      <div
                        key={lead._id}
                        onClick={() => handleLeadClick(lead)}
                        className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-medium text-sm">
                            {lead.firstName?.[0] || lead.email[0].toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {lead.firstName} {lead.lastName}
                            </p>
                            <p className="text-sm text-gray-500 truncate">{lead.company || lead.email}</p>
                          </div>
                        </div>
                        {lead.estimatedValue && (
                          <p className="text-sm font-medium text-gray-700">
                            ${lead.estimatedValue.toLocaleString()}
                          </p>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Lead Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Lead"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button form="lead-form" type="submit" isLoading={false}>
              Create Lead
            </Button>
          </>
        }
      >
        <LeadForm onSubmit={handleCreateLead} onCancel={() => setIsCreateModalOpen(false)} />
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!deleteLeadId}
        onClose={() => setDeleteLeadId(null)}
        onConfirm={handleDeleteLead}
        title="Delete Lead"
        message="Are you sure you want to delete this lead? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};
