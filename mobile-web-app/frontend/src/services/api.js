import axios from 'axios';

// Use environment variable with fallback
<<<<<<< HEAD
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
=======
const API_URL = process.env.REACT_APP_API_URL || 'http://192.168.1.16:8000/api';
>>>>>>> b7cd2bc2a082bb0d8ea2e81b00a2c10d5dae25eb

console.log('🌐 Using API URL:', API_URL); // This will help debug

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`🚀 API Request: ${config.method.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for logging
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ API Error:', error.message);
    return Promise.reject(error);
  }
);

// DMA APIs
export const dmaAPI = {
  getHistory: () => api.get('/dma/history'),
};

// Bulk Reading APIs
export const bulkAPI = {
  sendReading: (data) => api.post('/bulk-readings', data),
  getLatestReading: (dmaId, inletName) => 
    api.get(`/bulk-readings/${dmaId}/${inletName}/latest`),
  getReadingHistory: (dmaId, inletName, days = 30) => 
    api.get(`/bulk-readings/${dmaId}/${inletName}/history?days=${days}`),
};

// NRW Calculator API
export const nrwAPI = {
  calculate: (data) => api.post('/nrw/calculate', data),
};

// Analytics API
export const analyticsAPI = {
  getOverview: () => api.get('/analytics/overview'),
};

// Shapefile API
export const shapefileAPI = {
  getShapefile: (dmaId) => api.get(`/shapefile/${dmaId}`),
};

export default api;