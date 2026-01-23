import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

// Get auth token
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Create axios instance for auth
const api = axios.create({
  baseURL: `${API_URL}/auth`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Login user
export const login = async (email, password) => {
  try {
    const response = await api.post('/login', { email, password });

    if (response.data.success) {
      // Store token in localStorage
      localStorage.setItem('token', response.data.token);
      // Store user data
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }

    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Login failed');
  }
};

// Register new user
export const register = async (userData) => {
  try {
    const response = await api.post('/register', userData);

    if (response.data.success) {
      // Store token in localStorage
      localStorage.setItem('token', response.data.token);
      // Store user data
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }

    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Registration failed');
  }
};

// Get current user
export const getMe = async () => {
  try {
    const response = await api.get('/me');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch user');
  }
};

// Change password
export const changePassword = async (passwordData) => {
  try {
    const response = await api.put('/password', passwordData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to change password');
  }
};

// Logout user (client-side only)
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

// Check if user is authenticated
export const isAuthenticated = () => {
  const token = getAuthToken();
  return !!token;
};

// Get stored user
export const getStoredUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};
