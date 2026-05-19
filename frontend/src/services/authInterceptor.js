import { STORAGE_KEYS } from '../constants/api';

let _logout = null;

export const setLogoutHandler = (fn) => {
  _logout = fn;
};

export const isTokenExpired = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};

export const handle401 = () => {
  localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER_DATA);
  if (_logout) _logout();
};

export const attachAuthInterceptor = (axiosInstance) => {
  axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        handle401();
      }
      return Promise.reject(error);
    }
  );
};
