/**
 * Social Page
 * Social media management
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Share2, Trash2, Edit2, Calendar, Image as ImageIcon } from 'lucide-react';
import { useSocialPosts, useSocialAccounts, useFilters } from '../hooks';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { StatusBadge } from '../components/ui/Badge';
import { Card, CardHeader } from '../components/ui/Card';
import { ConfirmModal } from '../components/ui/Modal';
import type { SocialPost } from '../types';

const PLATFORMS = ['linkedin', 'twitter'];
const POST_STATUS = ['draft', 'scheduled', 'publishing', 'published', 'failed'];
const POST_TYPES = ['text', 'image', 'video', 'link', 'carousel', 'poll'];

export const Social: React.FC = () => {
  const navigate = useNavigate();
  const [deletePostId, setDeletePostId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'accounts'>('posts');

  const { filters, updateFilter } = useFilters({
    page: 1,
    limit: 20,
  });

  const { posts, isLoading, refetch, publishPost, deletePost } = useSocialPosts(filters);
  const { accounts, refetch: refetchAccounts } = useSocialAccounts();

  const handleSearch = (query: string) => {
    updateFilter('search', query || undefined);
  };

  const handlePlatformFilter = (platform: string) => {
    updateFilter('platform', platform === 'all' ? undefined : platform);
  };

  const handleStatusFilter = (status: string) => {
    updateFilter('status', status === 'all' ? undefined : status);
  };

  const handlePublish = async (id: string) => {
    await publishPost(id);
    refetch();
  };

  const handleDelete = async () => {
    if (deletePostId) {
      await deletePost(deletePostId);
      setDeletePostId(null);
      setShowDeleteModal(false);
      refetch();
    }
  };

  const getPlatformIcon = (platform: string) => {
    return platform === 'linkedin' ? 'in' : '𝕏';
  };

  const getPlatformColor = (platform: string) => {
    return platform === 'linkedin' ? 'bg-blue-600' : 'bg-black';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Social Media</h1>
          <p className="text-gray-500">Manage your social media presence</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={() => refetchAccounts()}
          >
            Refresh Accounts
          </Button>
          <Button variant="primary" leftIcon={<Plus size={16} />} onClick={() => navigate('/social/new')}>
            New Post
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab('posts')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'posts'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Posts
          </button>
          <button
            onClick={() => setActiveTab('accounts')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'accounts'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Accounts
          </button>
        </div>
      </div>

      {activeTab === 'posts' ? (
        <>
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[250px]">
              <Input
                placeholder="Search posts..."
                leftIcon={<Search size={18} className="text-gray-400" />}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg p-1">
              {['all', ...PLATFORMS].map((platform) => (
                <button
                  key={platform}
                  onClick={() => handlePlatformFilter(platform)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    (filters.platform === platform) || (platform === 'all' && !filters.platform)
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {platform === 'all' ? 'All' : platform.charAt(0).toUpperCase() + platform.slice(1)}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg p-1">
              {['all', ...POST_STATUS].map((status) => (
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

          {/* Posts Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl p-6 border border-gray-200 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-20 bg-gray-200 rounded mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12">
              <Share2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500 mb-4">No posts found</p>
              <Button variant="primary" leftIcon={<Plus size={16} />} onClick={() => navigate('/social/new')}>
                Create Your First Post
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <Card key={post._id} padding="none">
                  {/* Platform Header */}
                  <div className={`flex items-center gap-2 px-4 py-3 ${
                    post.platform === 'linkedin' ? 'bg-blue-50' : 'bg-gray-50'
                  } rounded-t-xl`}>
                    <div className={`w-8 h-8 rounded-full ${getPlatformColor(post.platform)} flex items-center justify-center text-white text-sm font-bold`}>
                      {getPlatformIcon(post.platform)}
                    </div>
                    <span className="text-sm font-medium capitalize">{post.platform}</span>
                    <StatusBadge status={post.status} size="sm" className="ml-auto" />
                  </div>

                  {/* Post Content */}
                  <div className="p-4">
                    {post.media && post.media.length > 0 && (
                      <div className="mb-3 rounded-lg overflow-hidden bg-gray-100 aspect-video flex items-center justify-center">
                        {post.media[0].type === 'image' ? (
                          <img src={post.media[0].url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-8 h-8 text-gray-400" />
                        )}
                      </div>
                    )}
                    <p className="text-sm text-gray-700 line-clamp-4 mb-3">{post.content}</p>
                    {post.linkUrl && (
                      <div className="flex items-center gap-2 text-sm text-primary-600 mb-3">
                        <Share2 size={14} />
                        <span className="truncate">{post.linkUrl}</span>
                      </div>
                    )}

                    {/* Analytics for published posts */}
                    {post.analytics && (
                      <div className="grid grid-cols-4 gap-2 py-3 border-t border-gray-100 mb-3">
                        <div className="text-center">
                          <p className="text-lg font-bold text-gray-900">{post.analytics.likes || 0}</p>
                          <p className="text-xs text-gray-500">Likes</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-gray-900">{post.analytics.comments || 0}</p>
                          <p className="text-xs text-gray-500">Comments</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-gray-900">{post.analytics.shares || 0}</p>
                          <p className="text-xs text-gray-500">Shares</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-gray-900">
                            {((post.analytics.engagementRate || 0) * 100).toFixed(1)}%
                          </p>
                          <p className="text-xs text-gray-500">Engagement</p>
                        </div>
                      </div>
                    )}

                    {/* Scheduled Time */}
                    {post.scheduledFor && (
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                        <Calendar size={14} />
                        <span>{new Date(post.scheduledFor).toLocaleString()}</span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                      {post.status === 'draft' && (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => navigate(`/social/${post._id}/edit`)}
                        >
                          Edit
                        </Button>
                      )}
                      {post.status === 'scheduled' && (
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => handlePublish(post._id)}
                        >
                          Publish Now
                        </Button>
                      )}
                      {post.status === 'draft' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => navigate(`/social/${post._id}/schedule`)}
                        >
                          Schedule
                        </Button>
                      )}
                      <div className="flex-1"></div>
                      <Button
                        size="sm"
                        variant="ghost"
                        leftIcon={<Trash2 size={14} />}
                        onClick={() => {
                          setDeletePostId(post._id);
                          setShowDeleteModal(true);
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      ) : (
        // Accounts Tab
        <div className="space-y-6">
          {accounts.length === 0 ? (
            <div className="text-center py-12">
              <Share2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500 mb-4">No social accounts connected</p>
              <Button variant="primary" leftIcon={<Plus size={16} />} onClick={() => navigate('/social/connect')}>
                Connect Account
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {accounts.map((account) => (
                <Card key={account._id}>
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-12 h-12 rounded-full ${getPlatformColor(account.platform)} flex items-center justify-center text-white text-xl font-bold`}>
                      {getPlatformIcon(account.platform)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{account.name}</h3>
                      <p className="text-sm text-gray-500">@{account.username || account.platformAccountId}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 py-4 border-t border-gray-100 mb-4">
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        {account.metrics?.followers?.toLocaleString() || 0}
                      </p>
                      <p className="text-sm text-gray-500">Followers</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        {account.metrics?.postsCount?.toLocaleString() || 0}
                      </p>
                      <p className="text-sm text-gray-500">Posts</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="secondary" onClick={() => navigate(`/social/accounts/${account._id}`)}>
                      Manage
                    </Button>
                    {account.status === 'needs_reauth' && (
                      <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                        Re-auth Required
                      </span>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeletePostId(null);
        }}
        onConfirm={handleDelete}
        title="Delete Post"
        message="Are you sure you want to delete this post? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};
