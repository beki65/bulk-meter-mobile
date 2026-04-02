import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const navigate = useNavigate();
  
  let inactivityTimer = null;
  
  const resetInactivityTimer = () => {
    if (inactivityTimer) clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
      if (user) {
        logout('Session expired due to inactivity (15 minutes)');
      }
    }, 15 * 60 * 1000);
  };
  
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
    
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, resetInactivityTimer);
    });
    
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, resetInactivityTimer);
      });
      if (inactivityTimer) clearTimeout(inactivityTimer);
    };
  }, [token]);
  
  const fetchUser = async () => {
    try {
      const response = await axios.get(`${API_URL}/auth/me`);
      setUser(response.data);
      resetInactivityTimer();
    } catch (error) {
      console.error('Failed to fetch user:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };
  
  const login = async (username, password, rememberMe = false) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        username,
        password,
        rememberMe
      });
      
      const { token, user, requirePasswordChange, userId } = response.data;
      
      if (requirePasswordChange) {
        localStorage.setItem('tempUserId', userId);
        return { requirePasswordChange: true, userId };
      }
      
      setToken(token);
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      resetInactivityTimer();
      
      return { success: true };
      
    } catch (error) {
      console.error('Login error:', error.response?.data);
      return { error: error.response?.data?.error || 'Login failed' };
    }
  };
  
  const changePassword = async (currentPassword, newPassword) => {
    try {
      const tempUserId = localStorage.getItem('tempUserId');
      const config = {};
      
      if (token) {
        config.headers = { 'Authorization': `Bearer ${token}` };
      }
      
      const response = await axios.post(`${API_URL}/auth/change-password`, {
        currentPassword,
        newPassword,
        userId: tempUserId
      }, config);
      
      localStorage.removeItem('tempUserId');
      
      return { success: true };
    } catch (error) {
      console.error('Change password error:', error.response?.data);
      return { error: error.response?.data?.error || 'Failed to change password' };
    }
  };
  
  const logout = async (message) => {
    try {
      if (token) {
        await axios.post(`${API_URL}/auth/logout`);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      if (inactivityTimer) clearTimeout(inactivityTimer);
      navigate('/login');
      if (message) {
        alert(message);
      }
    }
  };
  
  const hasPermission = (action) => {
    if (!user) return false;
    
    const rolePermissions = {
      admin: { canAddReadings: true, canEditReadings: true, canDeleteReadings: true, canManageUsers: true },
      sub_process_owner: { canAddReadings: true, canEditReadings: true, canDeleteReadings: false, canManageUsers: false },
      engineer: { canAddReadings: true, canEditReadings: true, canDeleteReadings: false, canManageUsers: false },
      technician: { canAddReadings: false, canEditReadings: false, canDeleteReadings: false, canManageUsers: false }
    };
    
    const permissions = rolePermissions[user.role];
    return permissions?.[action] || false;
  };
  
  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      changePassword,
      hasPermission,
      token
    }}>
      {children}
    </AuthContext.Provider>
  );
};