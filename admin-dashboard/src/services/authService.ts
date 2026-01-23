/**
 * Authentication service
 * Handles login, logout, token refresh, and user authentication
 */

import { apiClient, setToken, removeToken } from './apiClient';
import type { LoginCredentials, AuthUser, AuthTokens, ApiResponse } from '../types';

export const authService = {
  /**
   * Login user with email and password
   */
  async login(credentials: LoginCredentials): Promise<{ user: AuthUser; tokens: AuthTokens }> {
    const response = await apiClient.post<ApiResponse<{ user: AuthUser; tokens: AuthTokens }>>(
      '/auth/login',
      credentials
    );

    const { user, tokens } = response.data.data!;
    setToken(tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
    localStorage.setItem('user', JSON.stringify(user));

    return { user, tokens };
  },

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      removeToken();
      localStorage.removeItem('user');
    }
  },

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<AuthUser> {
    const response = await apiClient.get<ApiResponse<AuthUser>>('/auth/me');
    return response.data.data!;
  },

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    const response = await apiClient.post<ApiResponse<AuthTokens>>('/auth/refresh', {
      refreshToken,
    });

    const tokens = response.data.data!;
    setToken(tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);

    return tokens;
  },

  /**
   * Get stored user from localStorage
   */
  getStoredUser(): AuthUser | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('accessToken');
  },
};
