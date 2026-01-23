/**
 * Social media service
 * API functions for social account and post management
 */

import { apiClient } from './apiClient';
import type { SocialAccount, SocialPost, ApiResponse, PaginatedResponse } from '../../types/admin';

export interface SocialFilters {
  page?: number;
  limit?: number;
  platform?: string;
  status?: string;
  search?: string;
}

export const socialService = {
  // ========== Account Management ==========

  /**
   * Get all social accounts
   */
  async getAccounts(): Promise<SocialAccount[]> {
    const response = await apiClient.get<ApiResponse<SocialAccount[]>>('/social/accounts');
    return response.data.data!;
  },

  /**
   * Get account by ID
   */
  async getAccountById(id: string): Promise<SocialAccount> {
    const response = await apiClient.get<ApiResponse<SocialAccount>>(`/social/accounts/${id}`);
    return response.data.data!;
  },

  /**
   * Initiate OAuth connection
   */
  async connectAccount(platform: string): Promise<{ authUrl: string }> {
    const response = await apiClient.post<ApiResponse<{ authUrl: string }>>(
      '/social/accounts/connect',
      { platform }
    );
    return response.data.data!;
  },

  /**
   * Create account manually (with tokens)
   */
  async createAccount(account: Partial<SocialAccount>): Promise<SocialAccount> {
    const response = await apiClient.post<ApiResponse<SocialAccount>>('/social/accounts', account);
    return response.data.data!;
  },

  /**
   * Update account
   */
  async updateAccount(id: string, account: Partial<SocialAccount>): Promise<SocialAccount> {
    const response = await apiClient.put<ApiResponse<SocialAccount>>(
      `/social/accounts/${id}`,
      account
    );
    return response.data.data!;
  },

  /**
   * Disconnect account
   */
  async disconnectAccount(id: string): Promise<void> {
    await apiClient.delete(`/social/accounts/${id}`);
  },

  /**
   * Refresh OAuth tokens
   */
  async refreshTokens(id: string): Promise<SocialAccount> {
    const response = await apiClient.post<ApiResponse<SocialAccount>>(
      `/social/accounts/${id}/refresh`
    );
    return response.data.data!;
  },

  /**
   * Sync account stats from platform
   */
  async syncAccount(id: string): Promise<SocialAccount> {
    const response = await apiClient.post<ApiResponse<SocialAccount>>(
      `/social/accounts/${id}/sync`
    );
    return response.data.data!;
  },

  /**
   * Get accounts needing re-authentication
   */
  async getAccountsNeedingReauth(): Promise<SocialAccount[]> {
    const response = await apiClient.get<ApiResponse<SocialAccount[]>>(
      '/social/accounts/needs-reauth'
    );
    return response.data.data!;
  },

  // ========== Post Management ==========

  /**
   * Get all social posts
   */
  async getPosts(filters?: SocialFilters): Promise<PaginatedResponse<SocialPost>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }

    const response = await apiClient.get<PaginatedResponse<SocialPost>>(
      `/social/posts?${params.toString()}`
    );
    return response.data;
  },

  /**
   * Get post by ID
   */
  async getPostById(id: string): Promise<SocialPost> {
    const response = await apiClient.get<ApiResponse<SocialPost>>(`/social/posts/${id}`);
    return response.data.data!;
  },

  /**
   * Create new social post
   */
  async createPost(post: Partial<SocialPost>): Promise<SocialPost> {
    const response = await apiClient.post<ApiResponse<SocialPost>>('/social/posts', post);
    return response.data.data!;
  },

  /**
   * Update social post
   */
  async updatePost(id: string, post: Partial<SocialPost>): Promise<SocialPost> {
    const response = await apiClient.put<ApiResponse<SocialPost>>(`/social/posts/${id}`, post);
    return response.data.data!;
  },

  /**
   * Delete post
   */
  async deletePost(id: string): Promise<void> {
    await apiClient.delete(`/social/posts/${id}`);
  },

  /**
   * Publish post immediately
   */
  async publishPost(id: string): Promise<SocialPost> {
    const response = await apiClient.post<ApiResponse<SocialPost>>(
      `/social/posts/${id}/publish`
    );
    return response.data.data!;
  },

  /**
   * Schedule post
   */
  async schedulePost(id: string, scheduledFor: string): Promise<SocialPost> {
    const response = await apiClient.post<ApiResponse<SocialPost>>(
      `/social/posts/${id}/schedule`,
      { scheduledFor }
    );
    return response.data.data!;
  },

  /**
   * Unschedule post
   */
  async unschedulePost(id: string): Promise<SocialPost> {
    const response = await apiClient.post<ApiResponse<SocialPost>>(
      `/social/posts/${id}/unschedule`
    );
    return response.data.data!;
  },

  /**
   * Duplicate post
   */
  async duplicatePost(id: string): Promise<SocialPost> {
    const response = await apiClient.post<ApiResponse<SocialPost>>(
      `/social/posts/${id}/duplicate`
    );
    return response.data.data!;
  },

  /**
   * Get post analytics
   */
  async getPostAnalytics(id: string): Promise<any> {
    const response = await apiClient.get<ApiResponse<any>>(`/social/posts/${id}/analytics`);
    return response.data.data!;
  },

  /**
   * Approve post
   */
  async approvePost(id: string): Promise<SocialPost> {
    const response = await apiClient.post<ApiResponse<SocialPost>>(
      `/social/posts/${id}/approve`
    );
    return response.data.data!;
  },

  /**
   * Reject post
   */
  async rejectPost(id: string, reason: string): Promise<SocialPost> {
    const response = await apiClient.post<ApiResponse<SocialPost>>(
      `/social/posts/${id}/reject`,
      { reason }
    );
    return response.data.data!;
  },

  /**
   * Get posts pending approval
   */
  async getPendingApproval(): Promise<SocialPost[]> {
    const response = await apiClient.get<ApiResponse<SocialPost[]>>(
      '/social/posts/pending-approval'
    );
    return response.data.data!;
  },

  /**
   * Bulk publish scheduled posts
   */
  async bulkPublish(posts?: string[]): Promise<{ published: number; failed: number }> {
    const response = await apiClient.post<ApiResponse<{ published: number; failed: number }>>(
      '/social/posts/bulk-publish',
      { posts }
    );
    return response.data.data!;
  },

  /**
   * Bulk delete posts
   */
  async bulkDelete(posts: string[]): Promise<void> {
    await apiClient.post('/social/posts/bulk-delete', { posts });
  },

  // ========== Analytics ==========

  /**
   * Get aggregate social analytics
   */
  async getAnalytics(filters?: any): Promise<any> {
    const response = await apiClient.get<ApiResponse<any>>('/social/analytics');
    return response.data.data!;
  },

  /**
   * Refresh analytics from platforms
   */
  async refreshAnalytics(): Promise<any> {
    const response = await apiClient.post<ApiResponse<any>>(
      '/social/analytics/refresh'
    );
    return response.data.data!;
  },

  /**
   * Upload media to platform
   */
  async uploadMedia(file: File, platform: string): Promise<{ url: string; mediaId: string }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('platform', platform);

    const response = await apiClient.post<ApiResponse<{ url: string; mediaId: string }>>(
      '/social/media/upload',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
    return response.data.data!;
  },
};
