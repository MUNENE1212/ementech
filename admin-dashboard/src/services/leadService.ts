/**
 * Lead service
 * API functions for lead management
 */

import { apiClient } from './apiClient';
import type { Lead, ApiResponse, PaginatedResponse, LeadFilters } from '../types';

export type { LeadFilters };

export const leadService = {
  /**
   * Get all leads with pagination and filters
   */
  async getLeads(filters?: LeadFilters): Promise<PaginatedResponse<Lead>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (typeof value === 'object') {
            params.append(key, JSON.stringify(value));
          } else {
            params.append(key, String(value));
          }
        }
      });
    }

    const response = await apiClient.get<PaginatedResponse<Lead>>(
      `/leads?${params.toString()}`
    );
    return response.data;
  },

  /**
   * Get lead by ID
   */
  async getLeadById(id: string): Promise<Lead> {
    const response = await apiClient.get<ApiResponse<Lead>>(`/leads/${id}`);
    return response.data.data!;
  },

  /**
   * Create new lead
   */
  async createLead(lead: Partial<Lead>): Promise<Lead> {
    const response = await apiClient.post<ApiResponse<Lead>>('/leads', lead);
    return response.data.data!;
  },

  /**
   * Update lead
   */
  async updateLead(id: string, lead: Partial<Lead>): Promise<Lead> {
    const response = await apiClient.put<ApiResponse<Lead>>(`/leads/${id}`, lead);
    return response.data.data!;
  },

  /**
   * Delete lead
   */
  async deleteLead(id: string): Promise<void> {
    await apiClient.delete(`/leads/${id}`);
  },

  /**
   * Assign lead to employee
   */
  async assignLead(leadId: string, employeeId: string): Promise<Lead> {
    const response = await apiClient.post<ApiResponse<Lead>>(
      `/leads/${leadId}/assign`,
      { employeeId }
    );
    return response.data.data!;
  },

  /**
   * Bulk assign leads
   */
  async bulkAssignLeads(leadIds: string[], employeeId: string, strategy?: string): Promise<void> {
    await apiClient.post('/leads/bulk-assign', {
      leadIds,
      employeeId,
      strategy,
    });
  },

  /**
   * Auto-assign unassigned leads
   */
  async autoAssignLeads(): Promise<{ assigned: number }> {
    const response = await apiClient.post<ApiResponse<{ assigned: number }>>(
      '/leads/auto-assign'
    );
    return response.data.data!;
  },

  /**
   * Add tag to lead
   */
  async addTag(leadId: string, tag: string): Promise<Lead> {
    const response = await apiClient.post<ApiResponse<Lead>>(`/leads/${leadId}/tags`, { tag });
    return response.data.data!;
  },

  /**
   * Remove tag from lead
   */
  async removeTag(leadId: string, tag: string): Promise<Lead> {
    const response = await apiClient.delete<ApiResponse<Lead>>(`/leads/${leadId}/tags/${tag}`);
    return response.data.data!;
  },

  /**
   * Update lead score
   */
  async updateScore(leadId: string, score: number): Promise<Lead> {
    const response = await apiClient.put<ApiResponse<Lead>>(`/leads/${leadId}/score`, { score });
    return response.data.data!;
  },

  /**
   * Get pipeline snapshot
   */
  async getPipelineSnapshot(): Promise<Record<string, Lead[]>> {
    const response = await apiClient.get<ApiResponse<Record<string, Lead[]>>>(
      '/leads/pipeline'
    );
    return response.data.data!;
  },
};
