import React, { createContext, useContext, useState, useEffect } from 'react';
import api, { getCsrfCookie } from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [activeCycle, setActiveCycle] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dashboardLoading, setDashboardLoading] = useState(false);

  const fetchUserAndDashboard = async () => {
    try {
      const res = await api.get('/user');
      setUser(res.data.user);
      setActiveCycle(res.data.user?.active_cycle || null);

      if (res.data.has_active_cycle) {
        await refreshDashboard();
      }
    } catch (err) {
      setUser(null);
      setActiveCycle(null);
      setDashboardData(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshDashboard = async () => {
    setDashboardLoading(true);
    try {
      const res = await api.get('/budget-cycles/active');
      if (res.data && res.data.dashboard) {
        setDashboardData(res.data.dashboard);
        setActiveCycle(res.data.cycle);
      }
    } catch (err) {
      console.warn('Could not fetch active dashboard:', err);
    } finally {
      setDashboardLoading(false);
    }
  };

  useEffect(() => {
    fetchUserAndDashboard();
  }, []);

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const login = async (credentials) => {
    await getCsrfCookie();
    const res = await api.post('/login', credentials);
    if (res.data.token) {
      if (credentials.remember) {
        localStorage.setItem('tipidtayo_token', res.data.token);
        localStorage.setItem('tipidtayo_remember_me', 'true');
        sessionStorage.removeItem('tipidtayo_token');
      } else {
        sessionStorage.setItem('tipidtayo_token', res.data.token);
        localStorage.setItem('tipidtayo_remember_me', 'false');
        localStorage.removeItem('tipidtayo_token');
      }
    }
    setUser(res.data.user);
    setActiveCycle(res.data.user?.active_cycle || null);
    await refreshDashboard();
    return res.data;
  };

  const register = async (userData) => {
    await getCsrfCookie();
    const res = await api.post('/register', userData);
    if (res.data.token) {
      localStorage.setItem('tipidtayo_token', res.data.token);
      localStorage.setItem('tipidtayo_remember_me', 'true');
      sessionStorage.removeItem('tipidtayo_token');
    }
    setUser(res.data.user);
    setActiveCycle(null);
    return res.data;
  };

  const logout = async () => {
    try {
      await api.post('/logout');
    } catch (err) {
      console.warn('Logout error', err);
    } finally {
      localStorage.removeItem('tipidtayo_token');
      sessionStorage.removeItem('tipidtayo_token');
      setUser(null);
      setActiveCycle(null);
      setDashboardData(null);
    }
  };

  const requestLogout = () => {
    setShowLogoutConfirm(true);
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const confirmLogout = async () => {
    setShowLogoutConfirm(false);
    await logout();
  };

  const updateUserState = (newUserData) => {
    setUser((prev) => ({ ...prev, ...newUserData }));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        activeCycle,
        dashboardData,
        loading,
        dashboardLoading,
        login,
        register,
        logout,
        showLogoutConfirm,
        requestLogout,
        cancelLogout,
        confirmLogout,
        refreshDashboard,
        refreshUser: fetchUserAndDashboard,
        updateUserState,
        setDashboardData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
