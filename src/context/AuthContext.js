import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import localforage from 'localforage';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_URL = 'http://192.168.1.111:8000/api';

  useEffect(() => {
    loadStoredUser();
  }, []);

  const loadStoredUser = async () => {
    try {
      const userData = await localforage.getItem('user');
      const token = await localforage.getItem('token');
      
      if (userData && token) {
        setUser(userData);
        // Set default axios authorization header
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      setError(null);
      const response = await axios.post(`${API_URL}/auth/login`, {
        username,
        password
      });
      
      const { token, ...userData } = response.data;
      
      // Store auth data
      await localforage.setItem('user', userData);
      await localforage.setItem('token', token);
      
      // Set default axios header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setUser(userData);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      setError(message);
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    try {
      await localforage.removeItem('user');
      await localforage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      error,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};