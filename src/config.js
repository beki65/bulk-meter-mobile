// Configuration for different environments
let API_URL = 'https://water-utility-backend.onrender.com/api';

// For development (local testing)
if (process.env.NODE_ENV === 'development') {
  API_URL = 'http://localhost:8000/api';
}

// For Android app, use production URL
if (typeof window !== 'undefined' && window.location.protocol === 'capacitor:') {
  API_URL = 'https://water-utility-backend.onrender.com/api';
}

export { API_URL };

// Helper to manually set API URL
export const setApiUrl = (url) => {
  localStorage.setItem('custom_api_url', url);
  API_URL = url;
  console.log('📡 API URL changed to:', url);
  window.location.reload();
};

// Helper to test connection
export const testConnection = async (url) => {
  try {
    const response = await fetch(`${url}/health`, { timeout: 10000 });
    const data = await response.json();
    return response.ok;
  } catch (error) {
    return false;
  }
};