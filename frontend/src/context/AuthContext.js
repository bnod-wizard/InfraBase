/**
 * Auth Context - Global authentication state management
 */
import React, { createContext, useState, useCallback, useEffect } from 'react';
import { STORAGE_KEYS } from '../constants';
import { setLogoutHandler, isTokenExpired } from '../services/authInterceptor';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize from localStorage, clear immediately if token is expired
  useEffect(() => {
    const storedToken = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const storedUser = localStorage.getItem(STORAGE_KEYS.USER_DATA);

    if (storedToken && storedUser && !isTokenExpired(storedToken)) {
      const userData = JSON.parse(storedUser);
      // Backfill role from JWT payload if missing in stored user data
      if (!userData.role) {
        try {
          const payload = JSON.parse(atob(storedToken.split('.')[1]));
          userData.role = payload.role || 'user';
        } catch {}
      }
      setToken(storedToken);
      setUser(userData);
    } else if (storedToken) {
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER_DATA);
    }
    setLoading(false);
  }, []);

  const login = useCallback((userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, authToken);
    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_DATA);
  }, []);

  const updateUser = useCallback((updates) => {
    setUser(prev => {
      const updated = { ...prev, ...updates };
      localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Register logout with the axios interceptor module
  useEffect(() => {
    setLogoutHandler(logout);
  }, [logout]);

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token,
    login,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
