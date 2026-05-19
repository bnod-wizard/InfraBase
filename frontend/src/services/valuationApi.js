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

const valuationApi = {
  getQueue:      ()                         => axiosInstance.get('/valuations/queue'),
  getTracked:    ()                         => axiosInstance.get('/valuations/tracked'),
  takeAction:    (valuationId, action, note) =>
    axiosInstance.post(`/valuations/${valuationId}/action/${action}`, { note: note || '' }),
};

export default valuationApi;
