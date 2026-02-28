import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

// Permissions matrix (mirrors backend)
const PERMISSIONS = {
  superadmin: {
    dashboard: ['read', 'write'],
    inventory: ['read', 'write', 'stock'],
    orders:    ['read', 'write'],
    reports:   ['read', 'write'],
    settings:  ['read', 'write'],
    users:     ['read', 'write']
  },
  admin: {
    dashboard: ['read', 'write'],
    inventory: ['read', 'write', 'stock'],
    orders:    ['read', 'write'],
    reports:   ['read', 'write'],
    settings:  ['read', 'write'],
    users:     []
  },
  manager: {
    dashboard: ['read'],
    dashboard: ['read'],
    inventory: ['read', 'stock'],
    orders:    ['read', 'write'],
    reports:   ['read'],
    settings:  [],
    users:     []
  },
  viewer: {
    dashboard: ['read'],
    inventory: ['read'],
    orders:    ['read'],
    reports:   ['read'],
    settings:  [],
    users:     []
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('crm_token'));
  const [loading, setLoading] = useState(true);

  // Setup axios interceptor for auth header
  useEffect(() => {
    const interceptor = axios.interceptors.request.use((config) => {
      const storedToken = localStorage.getItem('crm_token');
      if (storedToken && config.url?.startsWith('/api/crm')) {
        config.headers.Authorization = `Bearer ${storedToken}`;
      }
      return config;
    });

    return () => axios.interceptors.request.eject(interceptor);
  }, []);

  // Validate token on mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await axios.get('/api/crm/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (data.success) {
          setUser(data.user);
        } else {
          logout();
        }
      } catch {
        logout();
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, []);

  const login = async (username, password) => {
    const { data } = await axios.post('/api/crm/auth/login', { username, password });

    if (data.success) {
      localStorage.setItem('crm_token', data.token);
      setToken(data.token);
      setUser(data.user);
      return { success: true };
    }

    return { success: false, message: data.message };
  };

  const logout = useCallback(() => {
    localStorage.removeItem('crm_token');
    setToken(null);
    setUser(null);
  }, []);

  const hasPermission = useCallback((resource, action = 'read') => {
    if (!user) return false;
    const rolePerms = PERMISSIONS[user.role];
    if (!rolePerms || !rolePerms[resource]) return false;
    return rolePerms[resource].includes(action);
  }, [user]);

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    hasPermission,
    isAuthenticated: !!user && !!token
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
