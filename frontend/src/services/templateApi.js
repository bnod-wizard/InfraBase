import axios from 'axios';
import { API_BASE_URL, STORAGE_KEYS } from '../constants/api';

const axiosInstance = axios.create({ baseURL: API_BASE_URL });

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

const templateApi = {
  getAll: () =>
    axiosInstance.get('/templates'),

  getById: (templateId) =>
    axiosInstance.get(`/templates/${templateId}`),

  // Save sections as a new version (auto-sets it as active)
  saveVersion: (templateId, sections, label) =>
    axiosInstance.post(`/templates/${templateId}/versions`, { sections, label }),

  // Set an existing version as active
  setActive: (templateId, version) =>
    axiosInstance.put(`/templates/${templateId}/active`, { version }),

  // Create a brand-new custom template
  createTemplate: (name, description, icon) =>
    axiosInstance.post('/templates', { name, description, icon }),

  // Delete a custom template
  deleteTemplate: (templateId) =>
    axiosInstance.delete(`/templates/${templateId}`),

  // Download URL for built-in .docx file (needs auth header — use fetch with token)
  getDownloadUrl: (templateId) =>
    `${API_BASE_URL}/templates/${templateId}/download`,
};

export default templateApi;
