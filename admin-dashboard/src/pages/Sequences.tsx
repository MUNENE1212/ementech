/**
 * Sequences Page
 * Email sequence management
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Play, Pause, Trash2, Edit2 } from 'lucide-react';
import { useSequences, useFilters } from '../hooks';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { StatusBadge } from '../components/ui/Badge';
import { Card, CardHeader } from '../components/ui/Card';
import { ConfirmModal } from '../components/ui/Modal';
import type { Sequence } from '../types';

const SEQUENCE_TYPES = [
  'drip',
  'nurture',
  'onboarding',
  're-engagement',
  'welcome',
  'educational',
  'promotional',
  'abandoned-cart',
  'custom',
];

export const Sequences: React.FC = () => {
  const navigate = useNavigate();
  const [deleteSequenceId, setDeleteSequenceId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { filters, updateFilter } = useFilters({
    page: 1,
    limit: 20,
  });

  const { sequences, isLoading, refetch, activateSequence, pauseSequence, deleteSequence } =
    useSequences(filters);

  const handleSearch = (query: string) => {
    updateFilter('search', query || undefined);
  };

  const handleStatusFilter = (status: string) => {
    updateFilter('status', status === 'all' ? undefined : status);
  };

  const handleActivate = async (id: string) => {
    await activateSequence(id);
    refetch();
  };

  const handlePause = async (id: string) => {
    await pauseSequence(id);
    refetch();
  };

  const handleDelete = async () => {
    if (deleteSequenceId) {
      await deleteSequence(deleteSequenceId);
      setDeleteSequenceId(null);
      setShowDeleteModal(false);
      refetch();
    }
  };

  const getTypeLabel = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sequences</h1>
          <p className="text-gray-500">Automated email sequences for nurturing leads</p>
        </div>
        <Button variant="primary" leftIcon={<Plus size={16} />} onClick={() => navigate('/sequences/new')}>
          New Sequence
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[250px]">
          <Input
            placeholder="Search sequences..."
            leftIcon={<Search size={18} className="text-gray-400" />}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg p-1">
          {['all', 'draft', 'active', 'paused', 'archived'].map((status) => (
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

      {/* Sequences Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-6 border border-gray-200 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      ) : sequences.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No sequences found</p>
          <Button variant="primary" leftIcon={<Plus size={16} />} onClick={() => navigate('/sequences/new')}>
            Create Your First Sequence
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sequences.map((sequence) => (
            <Card key={sequence._id} hover padding="sm">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3
                      className="font-semibold text-gray-900 cursor-pointer hover:text-primary-600"
                      onClick={() => navigate(`/sequences/${sequence._id}`)}
                    >
                      {sequence.name}
                    </h3>
                    <StatusBadge status={sequence.status} size="sm" />
                  </div>
                  <p className="text-sm text-gray-500 capitalize">{getTypeLabel(sequence.type)}</p>
                </div>
                <button
                  onClick={() => navigate(`/sequences/${sequence._id}/edit`)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <Edit2 size={16} />
                </button>
              </div>

              {sequence.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{sequence.description}</p>
              )}

              <div className="grid grid-cols-3 gap-4 py-4 border-t border-gray-100">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{sequence.steps?.length || 0}</p>
                  <p className="text-xs text-gray-500">Steps</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">
                    {sequence.metrics?.enrolled || 0}
                  </p>
                  <p className="text-xs text-gray-500">Enrolled</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">
                    {sequence.metrics?.completionRate?.toFixed(0) || 0}%
                  </p>
                  <p className="text-xs text-gray-500">Complete</p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                {sequence.status === 'draft' || sequence.status === 'paused' ? (
                  <Button
                    size="sm"
                    variant="primary"
                    leftIcon={<Play size={14} />}
                    onClick={() => handleActivate(sequence._id)}
                  >
                    {sequence.status === 'draft' ? 'Activate' : 'Resume'}
                  </Button>
                ) : sequence.status === 'active' ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    leftIcon={<Pause size={14} />}
                    onClick={() => handlePause(sequence._id)}
                  >
                    Pause
                  </Button>
                ) : null}

                <div className="flex-1"></div>

                {(sequence.status === 'draft' || sequence.status === 'paused' || sequence.status === 'archived') && (
                  <Button
                    size="sm"
                    variant="ghost"
                    leftIcon={<Trash2 size={14} />}
                    onClick={() => {
                      setDeleteSequenceId(sequence._id);
                      setShowDeleteModal(true);
                    }}
                  >
                    Delete
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeleteSequenceId(null);
        }}
        onConfirm={handleDelete}
        title="Delete Sequence"
        message="Are you sure you want to delete this sequence? Enrolled leads will not receive further emails from this sequence."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};
