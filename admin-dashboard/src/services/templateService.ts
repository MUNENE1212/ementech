/**
 * Email template service
 * API functions for template management
 */

import { apiClient } from './apiClient';
import type { EmailTemplate, ApiResponse, PaginatedResponse } from '../types';

export interface TemplateFilters {
  page?: number;
  limit?: number;
  category?: string;
  type?: string;
  status?: string;
  search?: string;
}

export const templateService = {
  /**
   * Get all templates
   */
  async getTemplates(filters?: TemplateFilters): Promise<PaginatedResponse<EmailTemplate>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }

    const response = await apiClient.get<PaginatedResponse<EmailTemplate>>(
      `/templates?${params.toString()}`
    );
    return response.data;
  },

  /**
   * Get template by ID
   */
  async getTemplateById(id: string): Promise<EmailTemplate> {
    const response = await apiClient.get<ApiResponse<EmailTemplate>>(`/templates/${id}`);
    return response.data.data!;
  },

  /**
   * Create new template
   */
  async createTemplate(template: Partial<EmailTemplate>): Promise<EmailTemplate> {
    const response = await apiClient.post<ApiResponse<EmailTemplate>>('/templates', template);
    return response.data.data!;
  },

  /**
   * Update template
   */
  async updateTemplate(id: string, template: Partial<EmailTemplate>): Promise<EmailTemplate> {
    const response = await apiClient.put<ApiResponse<EmailTemplate>>(`/templates/${id}`, template);
    return response.data.data!;
  },

  /**
   * Delete (archive) template
   */
  async deleteTemplate(id: string): Promise<void> {
    await apiClient.delete(`/templates/${id}`);
  },

  /**
   * Preview template with data
   */
  async previewTemplate(id: string, data: Record<string, any>): Promise<{ html: string; text: string }> {
    const response = await apiClient.post<ApiResponse<{ html: string; text: string }>>(
      `/templates/${id}/preview`,
      { data }
    );
    return response.data.data!;
  },

  /**
   * Validate template variables
   */
  async validateVariables(id: string): Promise<{ valid: boolean; errors: string[] }> {
    const response = await apiClient.post<ApiResponse<{ valid: boolean; errors: string[] }>>(
      `/templates/${id}/validate-variables`
    );
    return response.data.data!;
  },

  /**
   * Activate template
   */
  async activateTemplate(id: string): Promise<EmailTemplate> {
    const response = await apiClient.post<ApiResponse<EmailTemplate>>(
      `/templates/${id}/activate`
    );
    return response.data.data!;
  },

  /**
   * Pause template
   */
  async pauseTemplate(id: string): Promise<EmailTemplate> {
    const response = await apiClient.post<ApiResponse<EmailTemplate>>(
      `/templates/${id}/pause`
    );
    return response.data.data!;
  },

  /**
   * Duplicate template
   */
  async duplicateTemplate(id: string): Promise<EmailTemplate> {
    const response = await apiClient.post<ApiResponse<EmailTemplate>>(
      `/templates/${id}/duplicate`
    );
    return response.data.data!;
  },

  /**
   * Get template A/B variants
   */
  async getVariants(id: string): Promise<EmailTemplate[]> {
    const response = await apiClient.get<ApiResponse<EmailTemplate[]>>(
      `/templates/${id}/variants`
    );
    return response.data.data!;
  },

  /**
   * Create A/B variant
   */
  async createVariant(id: string, variant: Partial<EmailTemplate>): Promise<EmailTemplate> {
    const response = await apiClient.post<ApiResponse<EmailTemplate>>(
      `/templates/${id}/variant`,
      variant
    );
    return response.data.data!;
  },

  /**
   * Search templates
   */
  async searchTemplates(query: string): Promise<EmailTemplate[]> {
    const response = await apiClient.get<ApiResponse<EmailTemplate[]>>(
      `/templates/search?q=${encodeURIComponent(query)}`
    );
    return response.data.data!;
  },

  /**
   * Get top performing templates
   */
  async getTopPerforming(limit?: number): Promise<EmailTemplate[]> {
    const response = await apiClient.get<ApiResponse<EmailTemplate[]>>(
      `/templates/top-performing?limit=${limit || 10}`
    );
    return response.data.data!;
  },

  /**
   * Get templates by category
   */
  async getByCategory(category: string): Promise<EmailTemplate[]> {
    const response = await apiClient.get<ApiResponse<EmailTemplate[]>>(
      `/templates/category/${category}`
    );
    return response.data.data!;
  },

  /**
   * Get templates by trigger type
   */
  async getByTrigger(triggerType: string): Promise<EmailTemplate[]> {
    const response = await apiClient.get<ApiResponse<EmailTemplate[]>>(
      `/templates/trigger/${triggerType}`
    );
    return response.data.data!;
  },

  /**
   * Get aggregate metrics
   */
  async getMetrics(): Promise<any> {
    const response = await apiClient.get<ApiResponse<any>>('/templates/metrics');
    return response.data.data!;
  },
};
