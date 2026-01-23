/**
 * Templates Page
 * Email template management
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, FileText, Copy, Trash2 } from 'lucide-react';
import { useTemplates, useFilters } from '../../hooks/admin';
import { Button } from '../../components/admin/ui/Button';
import { Input } from '../../components/admin/ui/Input';
import { StatusBadge } from '../../components/admin/ui/Badge';
import { Card, CardHeader } from '../../components/admin/ui/Card';
import { ConfirmModal } from '../../components/admin/ui/Modal';
import type { EmailTemplate } from '../../types/admin/admin';

const TEMPLATE_CATEGORIES = [
  'newsletter',
  'promotional',
  'announcement',
  'onboarding',
  're-engagement',
  'transactional',
  'event',
  'survey',
  'abandoned-cart',
  'welcome',
  'birthday',
  'holiday',
  'follow-up',
  'reminder',
  'custom',
];

export const Templates: React.FC = () => {
  const navigate = useNavigate();
  const [deleteTemplateId, setDeleteTemplateId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { filters, updateFilter } = useFilters({
    page: 1,
    limit: 20,
  });

  const { templates, isLoading, refetch, deleteTemplate, duplicateTemplate } = useTemplates(filters);

  const handleSearch = (query: string) => {
    updateFilter('search', query || undefined);
  };

  const handleCategoryFilter = (category: string) => {
    updateFilter('category', category === 'all' ? undefined : category);
  };

  const handleDuplicate = async (id: string) => {
    await duplicateTemplate(id);
    refetch();
  };

  const handleDelete = async () => {
    if (deleteTemplateId) {
      await deleteTemplate(deleteTemplateId);
      setDeleteTemplateId(null);
      setShowDeleteModal(false);
      refetch();
    }
  };

  const getCategoryLabel = (category: string) => {
    return category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Email Templates</h1>
          <p className="text-gray-500">Manage your reusable email templates</p>
        </div>
        <Button variant="primary" leftIcon={<Plus size={16} />} onClick={() => navigate('/templates/new')}>
          New Template
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[250px]">
          <Input
            placeholder="Search templates..."
            leftIcon={<Search size={18} className="text-gray-400" />}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg p-1 max-w-xl overflow-x-auto">
          {['all', ...TEMPLATE_CATEGORIES].slice(0, 8).map((category) => (
            <button
              key={category}
              onClick={() => handleCategoryFilter(category)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                (filters.category === category) || (category === 'all' && !filters.category)
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {category === 'all' ? 'All' : getCategoryLabel(category)}
            </button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-6 border border-gray-200 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-20 bg-gray-200 rounded mb-4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500 mb-4">No templates found</p>
          <Button variant="primary" leftIcon={<Plus size={16} />} onClick={() => navigate('/templates/new')}>
            Create Your First Template
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <Card key={template._id} hover padding="none">
              <div className="h-40 bg-gray-50 rounded-t-xl overflow-hidden relative">
                <div className="absolute inset-0 p-4">
                  <div className="bg-white rounded-lg shadow-sm p-3 text-sm text-gray-600 line-clamp-6">
                    <div dangerouslySetInnerHTML={{ __html: template.htmlBody }} />
                  </div>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3
                    className="font-semibold text-gray-900 cursor-pointer hover:text-primary-600 truncate"
                    onClick={() => navigate(`/templates/${template._id}`)}
                  >
                    {template.name}
                  </h3>
                  <StatusBadge status={template.status} size="sm" />
                </div>
                <p className="text-sm text-gray-500 mb-3 truncate">{template.subject}</p>
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                  <span className="capitalize">{template.type}</span>
                  <span>•</span>
                  <span className="capitalize">{getCategoryLabel(template.category || 'custom')}</span>
                </div>
                <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => navigate(`/templates/${template._id}`)}
                  >
                    View
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    leftIcon={<Copy size={14} />}
                    onClick={() => handleDuplicate(template._id)}
                  >
                    Duplicate
                  </Button>
                  <div className="flex-1"></div>
                  {template.status === 'draft' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      leftIcon={<Trash2 size={14} />}
                      onClick={() => {
                        setDeleteTemplateId(template._id);
                        setShowDeleteModal(true);
                      }}
                    >
                      Delete
                    </Button>
                  )}
                </div>
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
          setDeleteTemplateId(null);
        }}
        onConfirm={handleDelete}
        title="Delete Template"
        message="Are you sure you want to delete this template? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};
