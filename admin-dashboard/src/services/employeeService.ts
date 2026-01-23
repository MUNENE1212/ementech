/**
 * Employee service
 * API functions for employee management
 */

import { apiClient } from './apiClient';
import type { User, ApiResponse, PaginatedResponse } from '../types';

export interface EmployeeFilters {
  page?: number;
  limit?: number;
  status?: string;
  role?: string;
  department?: string;
  search?: string;
}

export const employeeService = {
  /**
   * Get all employees
   */
  async getEmployees(filters?: EmployeeFilters): Promise<PaginatedResponse<User>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }

    const response = await apiClient.get<PaginatedResponse<User>>(
      `/employees?${params.toString()}`
    );
    return response.data;
  },

  /**
   * Get employee by ID
   */
  async getEmployeeById(id: string): Promise<User> {
    const response = await apiClient.get<ApiResponse<User>>(`/employees/${id}`);
    return response.data.data!;
  },

  /**
   * Create new employee
   */
  async createEmployee(employee: Partial<User>): Promise<User> {
    const response = await apiClient.post<ApiResponse<User>>('/employees', employee);
    return response.data.data!;
  },

  /**
   * Update employee
   */
  async updateEmployee(id: string, employee: Partial<User>): Promise<User> {
    const response = await apiClient.put<ApiResponse<User>>(`/employees/${id}`, employee);
    return response.data.data!;
  },

  /**
   * Deactivate employee
   */
  async deactivateEmployee(id: string): Promise<User> {
    const response = await apiClient.delete<ApiResponse<User>>(`/employees/${id}`);
    return response.data.data!;
  },

  /**
   * Invite employee
   */
  async inviteEmployee(email: string, role: string, options?: any): Promise<User> {
    const response = await apiClient.post<ApiResponse<User>>('/employees/invite', {
      email,
      role,
      ...options,
    });
    return response.data.data!;
  },

  /**
   * Accept invitation
   */
  async acceptInvitation(token: string, password: string, name?: string): Promise<User> {
    const response = await apiClient.post<ApiResponse<User>>(
      `/employees/accept-invitation/${token}`,
      { password, name }
    );
    return response.data.data!;
  },

  /**
   * Update employee permissions
   */
  async updatePermissions(id: string, permissions: any[]): Promise<User> {
    const response = await apiClient.put<ApiResponse<User>>(
      `/employees/${id}/permissions`,
      { permissions }
    );
    return response.data.data!;
  },

  /**
   * Get employee performance metrics
   */
  async getPerformance(id: string): Promise<any> {
    const response = await apiClient.get<ApiResponse<any>>(`/employees/${id}/performance`);
    return response.data.data!;
  },

  /**
   * Get direct reports
   */
  async getDirectReports(id: string): Promise<User[]> {
    const response = await apiClient.get<ApiResponse<User[]>>(
      `/employees/${id}/direct-reports`
    );
    return response.data.data!;
  },

  /**
   * Update lead capacity
   */
  async updateLeadCapacity(id: string, capacity: number): Promise<User> {
    const response = await apiClient.put<ApiResponse<User>>(
      `/employees/${id}/lead-capacity`,
      { maxLeadCapacity: capacity }
    );
    return response.data.data!;
  },

  /**
   * Configure company email
   */
  async configureEmail(id: string, emailConfig: any): Promise<User> {
    const response = await apiClient.post<ApiResponse<User>>(
      `/employees/${id}/email/configure`,
      emailConfig
    );
    return response.data.data!;
  },
};
