import axios from 'axios';
import { API_URL } from '../config';

// Get token from localStorage
const getToken = () => localStorage.getItem('token');

// Create axios instance with interceptor
const apiClient = axios.create({
  baseURL: API_URL,
});

// Add token to every request
apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const dmaAPI = {
  getHistory: () => apiClient.get('/dma/history'),
  // ... other methods
};

export const nrwAPI = {
  calculate: (data) => apiClient.post('/nrw/calculate', data),
};

export const analyticsAPI = {
  getOverview: () => apiClient.get('/analytics/overview'),
};