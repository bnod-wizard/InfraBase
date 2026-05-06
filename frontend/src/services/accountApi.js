import axios from 'axios';
import { API_BASE_URL } from '../constants/api';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL
});

// Add token to requests
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const accountApi = {
  // Create account with hierarchy (bulk)
  createAccountWithHierarchy: (payload) =>
    axiosInstance.post('/accounts/bulk/create', payload),

  // Get account with hierarchy
  getAccountHierarchy: (accountId) =>
    axiosInstance.get(`/accounts/${accountId}/hierarchy`),

  // Get all accounts
  getAllAccounts: (skip = 0, limit = 10) =>
    axiosInstance.get('/accounts', { params: { skip, limit } }),

  // Get single account
  getAccount: (accountId) =>
    axiosInstance.get(`/accounts/${accountId}`),

  // Search accounts
  searchAccounts: (query, skip = 0, limit = 10) =>
    axiosInstance.get(`/accounts/search/${query}`, { params: { skip, limit } }),

  // Update account
  updateAccount: (accountId, data) =>
    axiosInstance.put(`/accounts/${accountId}`, data),

  // Delete account
  deleteAccount: (accountId) =>
    axiosInstance.delete(`/accounts/${accountId}`),

  // Get account statistics
  getAccountStats: () =>
    axiosInstance.get('/accounts/stats/overview')
};

export default accountApi;
