/**
 * Sequence service
 * API functions for sequence management
 */

import { apiClient } from './apiClient';
import type { Sequence, Lead, ApiResponse, PaginatedResponse } from '../types';

export interface SequenceFilters {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
  search?: string;
}

export const sequenceService = {
  /**
   * Get all sequences
   */
  async getSequences(filters?: SequenceFilters): Promise<PaginatedResponse<Sequence>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }

    const response = await apiClient.get<PaginatedResponse<Sequence>>(
      `/sequences?${params.toString()}`
    );
    return response.data;
  },

  /**
   * Get sequence by ID
   */
  async getSequenceById(id: string): Promise<Sequence> {
    const response = await apiClient.get<ApiResponse<Sequence>>(`/sequences/${id}`);
    return response.data.data!;
  },

  /**
   * Create new sequence
   */
  async createSequence(sequence: Partial<Sequence>): Promise<Sequence> {
    const response = await apiClient.post<ApiResponse<Sequence>>('/sequences', sequence);
    return response.data.data!;
  },

  /**
   * Update sequence
   */
  async updateSequence(id: string, sequence: Partial<Sequence>): Promise<Sequence> {
    const response = await apiClient.put<ApiResponse<Sequence>>(`/sequences/${id}`, sequence);
    return response.data.data!;
  },

  /**
   * Delete sequence
   */
  async deleteSequence(id: string): Promise<void> {
    await apiClient.delete(`/sequences/${id}`);
  },

  /**
   * Activate sequence
   */
  async activateSequence(id: string): Promise<Sequence> {
    const response = await apiClient.post<ApiResponse<Sequence>>(`/sequences/${id}/activate`);
    return response.data.data!;
  },

  /**
   * Pause sequence
   */
  async pauseSequence(id: string): Promise<Sequence> {
    const response = await apiClient.post<ApiResponse<Sequence>>(`/sequences/${id}/pause`);
    return response.data.data!;
  },

  /**
   * Resume sequence
   */
  async resumeSequence(id: string): Promise<Sequence> {
    const response = await apiClient.post<ApiResponse<Sequence>>(`/sequences/${id}/resume`);
    return response.data.data!;
  },

  /**
   * Add step to sequence
   */
  async addStep(id: string, step: Partial<Sequence>): Promise<Sequence> {
    const response = await apiClient.post<ApiResponse<Sequence>>(
      `/sequences/${id}/steps`,
      step
    );
    return response.data.data!;
  },

  /**
   * Update step in sequence
   */
  async updateStep(id: string, stepOrder: number, step: Partial<any>): Promise<Sequence> {
    const response = await apiClient.put<ApiResponse<Sequence>>(
      `/sequences/${id}/steps/${stepOrder}`,
      step
    );
    return response.data.data!;
  },

  /**
   * Remove step from sequence
   */
  async removeStep(id: string, stepOrder: number): Promise<Sequence> {
    const response = await apiClient.delete<ApiResponse<Sequence>>(
      `/sequences/${id}/steps/${stepOrder}`
    );
    return response.data.data!;
  },

  /**
   * Reorder steps in sequence
   */
  async reorderSteps(id: string, stepOrders: number[]): Promise<Sequence> {
    const response = await apiClient.put<ApiResponse<Sequence>>(
      `/sequences/${id}/steps/reorder`,
      { stepOrders }
    );
    return response.data.data!;
  },

  /**
   * Enroll lead in sequence
   */
  async enrollLead(id: string, leadId: string): Promise<void> {
    await apiClient.post(`/sequences/${id}/enroll`, { leadId });
  },

  /**
   * Bulk enroll leads
   */
  async enrollLeadsBulk(id: string, leadIds: string[]): Promise<void> {
    await apiClient.post(`/sequences/${id}/enroll-bulk`, { leadIds });
  },

  /**
   * Unsubscribe lead from sequence
   */
  async unsubscribeLead(id: string, leadId: string): Promise<void> {
    await apiClient.post(`/sequences/${id}/unsubscribe`, { leadId });
  },

  /**
   * Pause sequence for lead
   */
  async pauseLeadSequence(id: string, leadId: string): Promise<void> {
    await apiClient.post(`/sequences/${id}/pause-lead`, { leadId });
  },

  /**
   * Resume sequence for lead
   */
  async resumeLeadSequence(id: string, leadId: string): Promise<void> {
    await apiClient.post(`/sequences/${id}/resume-lead`, { leadId });
  },

  /**
   * Get lead progress in sequence
   */
  async getLeadProgress(id: string, leadId: string): Promise<any> {
    const response = await apiClient.get<ApiResponse<any>>(
      `/sequences/${id}/progress/${leadId}`
    );
    return response.data.data!;
  },

  /**
   * Get sequence enrollments
   */
  async getEnrollments(id: string, filters?: any): Promise<PaginatedResponse<Lead>> {
    const response = await apiClient.get<PaginatedResponse<Lead>>(
      `/sequences/${id}/enrollments`
    );
    return response.data;
  },

  /**
   * Get sequence analytics
   */
  async getSequenceAnalytics(id: string): Promise<any> {
    const response = await apiClient.get<ApiResponse<any>>(`/sequences/${id}/analytics`);
    return response.data.data!;
  },

  /**
   * Duplicate sequence
   */
  async duplicateSequence(id: string): Promise<Sequence> {
    const response = await apiClient.post<ApiResponse<Sequence>>(
      `/sequences/${id}/duplicate`
    );
    return response.data.data!;
  },

  /**
   * Preview sequence
   */
  async previewSequence(sequence: Partial<Sequence>): Promise<any> {
    const response = await apiClient.post<ApiResponse<any>>(
      '/sequences/preview',
      sequence
    );
    return response.data.data!;
  },
};
