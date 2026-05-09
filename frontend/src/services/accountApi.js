import axios from 'axios';
import { API_BASE_URL, STORAGE_KEYS } from '../constants/api';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
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

  // Get accounts with filters and search
  getAccountsFiltered: (query = '', statuses = [], skip = 0, limit = 10) => {
    const params = {
      q: query,
      skip,
      limit
    };
    if (statuses && statuses.length > 0) {
      params.status = statuses.join(',');
    }
    return axiosInstance.get('/accounts/list/filtered', { params });
  },

  // Update account
  updateAccount: (accountId, data) =>
    axiosInstance.put(`/accounts/${accountId}`, data),

  // Delete account
  deleteAccount: (accountId) =>
    axiosInstance.delete(`/accounts/${accountId}`),

  // Get account statistics
  getAccountStats: () =>
    axiosInstance.get('/accounts/stats/overview'),

  // Valuation metadata
  getValuation: (accountId) =>
    axiosInstance.get(`/accounts/${accountId}/valuation`),

  saveValuation: (accountId, data) =>
    axiosInstance.post(`/accounts/${accountId}/valuation`, data),

  // Document generation – returns a blob
  generateDocument: (accountId, docType) =>
    axiosInstance.get(`/accounts/${accountId}/generate/${docType}`, { responseType: 'blob' })
};

export default accountApi;
