/**
 * Campaign service
 * API functions for campaign management
 */

import { apiClient } from './apiClient';
import type { Campaign, ApiResponse, PaginatedResponse } from '../../types/admin';

export interface CampaignFilters {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
  search?: string;
}

export const campaignService = {
  /**
   * Get all campaigns
   */
  async getCampaigns(filters?: CampaignFilters): Promise<PaginatedResponse<Campaign>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }

    const response = await apiClient.get<PaginatedResponse<Campaign>>(
      `/marketing/campaigns?${params.toString()}`
    );
    return response.data;
  },

  /**
   * Get campaign by ID
   */
  async getCampaignById(id: string): Promise<Campaign> {
    const response = await apiClient.get<ApiResponse<Campaign>>(
      `/marketing/campaigns/${id}`
    );
    return response.data.data!;
  },

  /**
   * Create new campaign
   */
  async createCampaign(campaign: Partial<Campaign>): Promise<Campaign> {
    const response = await apiClient.post<ApiResponse<Campaign>>(
      '/marketing/campaigns',
      campaign
    );
    return response.data.data!;
  },

  /**
   * Update campaign
   */
  async updateCampaign(id: string, campaign: Partial<Campaign>): Promise<Campaign> {
    const response = await apiClient.put<ApiResponse<Campaign>>(
      `/marketing/campaigns/${id}`,
      campaign
    );
    return response.data.data!;
  },

  /**
   * Delete campaign
   */
  async deleteCampaign(id: string): Promise<void> {
    await apiClient.delete(`/marketing/campaigns/${id}`);
  },

  /**
   * Schedule campaign
   */
  async scheduleCampaign(id: string, sendAt: string): Promise<Campaign> {
    const response = await apiClient.post<ApiResponse<Campaign>>(
      `/marketing/campaigns/${id}/schedule`,
      { sendAt }
    );
    return response.data.data!;
  },

  /**
   * Send campaign immediately
   */
  async sendCampaign(id: string): Promise<Campaign> {
    const response = await apiClient.post<ApiResponse<Campaign>>(
      `/marketing/campaigns/${id}/send`
    );
    return response.data.data!;
  },

  /**
   * Pause campaign
   */
  async pauseCampaign(id: string): Promise<Campaign> {
    const response = await apiClient.post<ApiResponse<Campaign>>(
      `/marketing/campaigns/${id}/pause`
    );
    return response.data.data!;
  },

  /**
   * Resume paused campaign
   */
  async resumeCampaign(id: string): Promise<Campaign> {
    const response = await apiClient.post<ApiResponse<Campaign>>(
      `/marketing/campaigns/${id}/resume`
    );
    return response.data.data!;
  },

  /**
   * Cancel campaign
   */
  async cancelCampaign(id: string, reason?: string): Promise<Campaign> {
    const response = await apiClient.post<ApiResponse<Campaign>>(
      `/marketing/campaigns/${id}/cancel`,
      { reason }
    );
    return response.data.data!;
  },

  /**
   * Duplicate campaign
   */
  async duplicateCampaign(id: string): Promise<Campaign> {
    const response = await apiClient.post<ApiResponse<Campaign>>(
      `/marketing/campaigns/${id}/duplicate`
    );
    return response.data.data!;
  },

  /**
   * Get campaign analytics
   */
  async getCampaignAnalytics(id: string): Promise<any> {
    const response = await apiClient.get<ApiResponse<any>>(
      `/marketing/campaigns/${id}/analytics`
    );
    return response.data.data!;
  },

  /**
   * Get audience preview
   */
  async getAudiencePreview(campaign: Partial<Campaign>): Promise<{ size: number; leads: any[] }> {
    const response = await apiClient.post<ApiResponse<{ size: number; leads: any[] }>>(
      '/marketing/campaigns/audience/preview',
      campaign
    );
    return response.data.data!;
  },
};
