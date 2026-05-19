import axios from 'axios';
import { API_BASE_URL, STORAGE_KEYS } from '../constants/api';
import { attachAuthInterceptor } from './authInterceptor';

const axiosInstance = axios.create({ baseURL: API_BASE_URL });

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

attachAuthInterceptor(axiosInstance);

const usersApi = {
  getAll: (skip = 0, limit = 100) =>
    axiosInstance.get('/users', { params: { skip, limit } }),

  createUser: (data) =>
    axiosInstance.post('/users', data),

  updateUser: (userId, data) =>
    axiosInstance.put(`/users/${userId}`, data),

  deleteUser: (userId) =>
    axiosInstance.delete(`/users/${userId}`),
};

export default usersApi;
