import axios from 'axios';

// Use localhost for local development
const API_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000, // Increased timeout to 30 seconds
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
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
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
  getLatestReading: (dmaId, pointName) => 
    api.get(`/bulk-readings/${dmaId}/${pointName}/latest`),
  getReadingHistory: (dmaId, pointName, days = 30) => 
    api.get(`/bulk-readings/${dmaId}/${pointName}/history?days=${days}`),
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