/**
 * API Configuration and Constants
 */

export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: `${API_BASE_URL}/auth/register`,
    LOGIN: `${API_BASE_URL}/auth/login`,
    PROFILE: `${API_BASE_URL}/auth/profile`,
  },
  USERS: `${API_BASE_URL}/users`,
  CUSTOMERS: `${API_BASE_URL}/customers`,
  HEALTH: `${API_BASE_URL}/health`,
};

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  USER_DATA: 'userData',
};

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  UNAUTHORIZED: 'Unauthorized. Please login again.',
  SERVER_ERROR: 'Server error. Please try again later.',
};
