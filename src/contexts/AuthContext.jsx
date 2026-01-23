import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as authService from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize auth state from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }

    setLoading(false);
  }, []);

  // Login function
  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authService.login(email, password);

      if (response.success) {
        setToken(response.token);
        setUser(response.user);
        setIsAuthenticated(true);
        return { success: true };
      }

      return { success: false, message: response.message };
    } catch (err) {
      const errorMessage = err.message || 'Login failed';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Register function
  const register = useCallback(async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authService.register(userData);

      if (response.success) {
        setToken(response.token);
        setUser(response.user);
        setIsAuthenticated(true);
        return { success: true };
      }

      return { success: false, message: response.message };
    } catch (err) {
      const errorMessage = err.message || 'Registration failed';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Logout function
  const logout = useCallback(() => {
    authService.logout();
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setError(null);
  }, []);

  // Change password function
  const changePassword = useCallback(async (currentPassword, newPassword) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authService.changePassword({
        currentPassword,
        newPassword,
      });

      setLoading(false);
      return { success: true, message: response.message };
    } catch (err) {
      const errorMessage = err.message || 'Failed to change password';
      setError(errorMessage);
      setLoading(false);
      return { success: false, message: errorMessage };
    }
  }, []);

  // Refresh user data
  const refreshUser = useCallback(async () => {
    if (!token) return;

    try {
      const response = await authService.getMe();
      if (response.success) {
        setUser(response.user);
        localStorage.setItem('user', JSON.stringify(response.user));
      }
    } catch (err) {
      console.error('Failed to refresh user:', err);
      // If token is invalid, logout
      if (err.response?.status === 401) {
        logout();
      }
    }
  }, [token, logout]);

  // Update user profile
  const updateUser = useCallback((updates) => {
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  }, [user]);

  const value = {
    user,
    token,
    loading,
    error,
    isAuthenticated,
    login,
    register,
    logout,
    changePassword,
    refreshUser,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
