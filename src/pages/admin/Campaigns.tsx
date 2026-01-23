/**
 * Campaigns Page
 * Email campaign management
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Filter, Play, Pause, Copy, Trash2 } from 'lucide-react';
import { useCampaigns, useFilters, usePagination, useModal } from '../../hooks/admin';
import { Table, Pagination } from '../../components/admin/tables/Table';
import { Button } from '../../components/admin/ui/Button';
import { Input } from '../../components/admin/ui/Input';
import { StatusBadge } from '../../components/admin/ui/Badge';
import { ConfirmModal } from '../../components/admin/ui/Modal';
import type { Campaign } from '../../types/admin/admin';

const CAMPAIGN_TYPES = [
  { value: 'one-time', label: 'One-time' },
  { value: 'recurring', label: 'Recurring' },
  { value: 'automated', label: 'Automated' },
  { value: 'drip', label: 'Drip' },
];

const CAMPAIGN_STATUS = ['draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled'];

export const Campaigns: React.FC = () => {
  const navigate = useNavigate();
  const deleteModal = useModal();
  const [deleteCampaignId, setDeleteCampaignId] = useState<string | null>(null);

  const { filters, updateFilter, resetFilters } = useFilters({
    page: 1,
    limit: 20,
  });

  const pagination = usePagination({
    initialPage: 1,
    initialLimit: 20,
  });

  const { campaigns, pagination: apiPagination, isLoading, refetch, sendCampaign, pauseCampaign, resumeCampaign, deleteCampaign } =
    useCampaigns({
      ...filters,
      page: pagination.page,
      limit: pagination.limit,
    });

  const columns = [
    {
      key: 'name',
      title: 'Campaign',
      render: (_: any, record: Campaign) => (
        <div>
          <p className="font-medium text-gray-900">{record.name}</p>
          {record.description && (
            <p className="text-sm text-gray-500 truncate max-w-xs">{record.description}</p>
          )}
        </div>
      ),
    },
    {
      key: 'type',
      title: 'Type',
      render: (value: string) => (
        <span className="text-sm text-gray-600 capitalize">{value}</span>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      render: (value: string) => <StatusBadge status={value} />,
    },
    {
      key: 'metrics',
      title: 'Metrics',
      render: (_: any, record: Campaign) => (
        <div className="text-sm">
          <p className="text-gray-600">
            {record.metrics?.sent || 0} sent · {record.metrics?.opens || 0} opened
          </p>
          <p className="text-gray-500">
            {record.metrics?.clicks || 0} clicks · {record.metrics?.conversions || 0} conversions
          </p>
        </div>
      ),
    },
    {
      key: 'schedule',
      title: 'Scheduled',
      render: (_: any, record: Campaign) =>
        record.schedule?.sendAt ? new Date(record.schedule.sendAt).toLocaleDateString() : '-',
    },
    {
      key: 'createdAt',
      title: 'Created',
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
  ];

  const handleSearch = (query: string) => {
    updateFilter('search', query || undefined);
  };

  const handleStatusFilter = (status: string) => {
    updateFilter('status', status === 'all' ? undefined : status);
  };

  const handleSend = async (id: string) => {
    await sendCampaign(id);
    refetch();
  };

  const handlePause = async (id: string) => {
    await pauseCampaign(id);
    refetch();
  };

  const handleResume = async (id: string) => {
    await resumeCampaign(id);
    refetch();
  };

  const handleDelete = async () => {
    if (deleteCampaignId) {
      await deleteCampaign(deleteCampaignId);
      setDeleteCampaignId(null);
      deleteModal.close();
      refetch();
    }
  };

  const getActions = (record: Campaign) => {
    const actions = [];

    if (record.status === 'draft' || record.status === 'scheduled') {
      actions.push({
        label: 'Send Now',
        icon: <Play size={14} />,
        onClick: () => handleSend(record._id),
      });
    }

    if (record.status === 'sending') {
      actions.push({
        label: 'Pause',
        icon: <Pause size={14} />,
        onClick: () => handlePause(record._id),
      });
    }

    if (record.status === 'paused') {
      actions.push({
        label: 'Resume',
        icon: <Play size={14} />,
        onClick: () => handleResume(record._id),
      });
    }

    actions.push({
      label: 'Duplicate',
      icon: <Duplicate size={14} />,
      onClick: () => {/* Duplicate logic */},
    });

    if (record.status === 'draft' || record.status === 'cancelled') {
      actions.push({
        label: 'Delete',
        icon: <Trash2 size={14} />,
        onClick: () => {
          setDeleteCampaignId(record._id);
          deleteModal.open();
        },
        variant: 'danger' as const,
      });
    }

    return actions;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
          <p className="text-gray-500">Manage your email campaigns</p>
        </div>
        <Button variant="primary" leftIcon={<Plus size={16} />} onClick={() => navigate('/campaigns/new')}>
          New Campaign
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[250px]">
          <Input
            placeholder="Search campaigns..."
            leftIcon={<Search size={18} className="text-gray-400" />}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg p-1">
          {['all', ...CAMPAIGN_STATUS].map((status) => (
            <button
              key={status}
              onClick={() => handleStatusFilter(status)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                (filters.status === status) || (status === 'all' && !filters.status)
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Campaigns Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <Table
          columns={columns}
          data={campaigns}
          keyField="_id"
          isLoading={isLoading}
          emptyMessage="No campaigns found"
          onRowClick={(record) => navigate(`/campaigns/${record._id}`)}
        />
        {apiPagination && (
          <Pagination
            page={pagination.page}
            totalPages={apiPagination.totalPages || 1}
            total={apiPagination.total || 0}
            limit={pagination.limit}
            onPageChange={(page) => {
              pagination.goToPage(page);
              updateFilter('page', page);
            }}
            onLimitChange={(limit) => {
              pagination.changeLimit(limit);
              updateFilter('limit', limit);
            }}
          />
        )}
      </div>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => {
          deleteModal.close();
          setDeleteCampaignId(null);
        }}
        onConfirm={handleDelete}
        title="Delete Campaign"
        message="Are you sure you want to delete this campaign? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};
