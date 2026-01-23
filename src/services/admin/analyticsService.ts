/**
 * Analytics service
 * API functions for analytics and reporting
 */

import { apiClient } from './apiClient';
import type { ApiResponse } from '../../types/admin';

export const analyticsService = {
  /**
   * Get dashboard overview with KPIs
   */
  async getOverview(period?: string): Promise<any> {
    const params = period ? `?period=${period}` : '';
    const response = await apiClient.get<ApiResponse<any>>(
      `/analytics-dashboard/overview${params}`
    );
    return response.data.data!;
  },

  /**
   * Get lead analytics
   */
  async getLeadsAnalytics(period?: string): Promise<any> {
    const params = period ? `?period=${period}` : '';
    const response = await apiClient.get<ApiResponse<any>>(
      `/analytics-dashboard/leads${params}`
    );
    return response.data.data!;
  },

  /**
   * Get pipeline snapshot
   */
  async getPipelineSnapshot(): Promise<any> {
    const response = await apiClient.get<ApiResponse<any>>(
      '/analytics-dashboard/leads/pipeline'
    );
    return response.data.data!;
  },

  /**
   * Get email and campaign analytics
   */
  async getEmailAnalytics(period?: string): Promise<any> {
    const params = period ? `?period=${period}` : '';
    const response = await apiClient.get<ApiResponse<any>>(
      `/analytics-dashboard/email${params}`
    );
    return response.data.data!;
  },

  /**
   * Get campaign performance details
   */
  async getCampaignAnalytics(campaignId: string): Promise<any> {
    const response = await apiClient.get<ApiResponse<any>>(
      `/analytics-dashboard/campaigns/${campaignId}`
    );
    return response.data.data!;
  },

  /**
   * Get sequence analytics
   */
  async getSequenceAnalytics(period?: string): Promise<any> {
    const params = period ? `?period=${period}` : '';
    const response = await apiClient.get<ApiResponse<any>>(
      `/analytics-dashboard/sequences${params}`
    );
    return response.data.data!;
  },

  /**
   * Get sequence enrollment trend
   */
  async getSequenceEnrollmentTrend(sequenceId?: string): Promise<any> {
    const params = sequenceId ? `?sequenceId=${sequenceId}` : '';
    const response = await apiClient.get<ApiResponse<any>>(
      `/analytics-dashboard/sequences/enrollment-trend${params}`
    );
    return response.data.data!;
  },

  /**
   * Get social media analytics
   */
  async getSocialAnalytics(period?: string): Promise<any> {
    const params = period ? `?period=${period}` : '';
    const response = await apiClient.get<ApiResponse<any>>(
      `/analytics-dashboard/social${params}`
    );
    return response.data.data!;
  },

  /**
   * Get social account status
   */
  async getSocialAccountsStatus(): Promise<any> {
    const response = await apiClient.get<ApiResponse<any>>(
      '/analytics-dashboard/social/accounts'
    );
    return response.data.data!;
  },

  /**
   * Get A/B test analytics
   */
  async getABTestAnalytics(period?: string): Promise<any> {
    const params = period ? `?period=${period}` : '';
    const response = await apiClient.get<ApiResponse<any>>(
      `/analytics-dashboard/abtests${params}`
    );
    return response.data.data!;
  },

  /**
   * Get revenue and ROI analytics
   */
  async getRevenueAnalytics(period?: string): Promise<any> {
    const params = period ? `?period=${period}` : '';
    const response = await apiClient.get<ApiResponse<any>>(
      `/analytics-dashboard/revenue${params}`
    );
    return response.data.data!;
  },

  /**
   * Get conversion funnel analytics
   */
  async getFunnelAnalytics(period?: string): Promise<any> {
    const params = period ? `?period=${period}` : '';
    const response = await apiClient.get<ApiResponse<any>>(
      `/analytics-dashboard/funnel${params}`
    );
    return response.data.data!;
  },

  /**
   * Get cohort analysis
   */
  async getCohortAnalysis(type?: string): Promise<any> {
    const params = type ? `?type=${type}` : '';
    const response = await apiClient.get<ApiResponse<any>>(
      `/analytics-dashboard/cohorts${params}`
    );
    return response.data.data!;
  },

  /**
   * Get latest snapshot
   */
  async getLatestSnapshot(): Promise<any> {
    const response = await apiClient.get<ApiResponse<any>>(
      '/analytics-dashboard/snapshot/latest'
    );
    return response.data.data!;
  },

  /**
   * Generate new snapshot
   */
  async generateSnapshot(type?: string): Promise<any> {
    const response = await apiClient.post<ApiResponse<any>>(
      '/analytics-dashboard/snapshot/generate',
      { type }
    );
    return response.data.data!;
  },

  /**
   * Export as CSV
   */
  async exportCSV(endpoint: string, filters?: any): Promise<Blob> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }

    const response = await apiClient.get(
      `/analytics-dashboard/export/${endpoint}?${params.toString()}`,
      { responseType: 'blob' }
    );
    return response.data;
  },

  /**
   * Export as JSON
   */
  async exportJSON(endpoint: string, filters?: any): Promise<any> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }

    const response = await apiClient.get<ApiResponse<any>>(
      `/analytics-dashboard/export/${endpoint}?${params.toString()}`
    );
    return response.data.data!;
  },

  /**
   * Get widgets configuration
   */
  async getWidgets(): Promise<any> {
    const response = await apiClient.get<ApiResponse<any>>('/analytics-dashboard/widgets');
    return response.data.data!;
  },

  /**
   * Update widgets configuration
   */
  async updateWidgets(widgets: any[]): Promise<any> {
    const response = await apiClient.put<ApiResponse<any>>(
      '/analytics-dashboard/widgets',
      { widgets }
    );
    return response.data.data!;
  },
};
