import axios from 'axios';
import { API_BASE_URL, STORAGE_KEYS } from '../constants/api';
import { attachAuthInterceptor } from './authInterceptor';

const axiosInstance = axios.create({ baseURL: API_BASE_URL });

axiosInstance.interceptors.request.use(
  config => {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  error => Promise.reject(error)
);

attachAuthInterceptor(axiosInstance);

const notificationApi = {
  getAll:      ()   => axiosInstance.get('/notifications'),
  getUnread:   ()   => axiosInstance.get('/notifications/unread-count'),
  markRead:    (id) => axiosInstance.post(`/notifications/${id}/read`),
  markAllRead: ()   => axiosInstance.post('/notifications/read-all'),
  remove:      (id) => axiosInstance.delete(`/notifications/${id}`),
};

export default notificationApi;
