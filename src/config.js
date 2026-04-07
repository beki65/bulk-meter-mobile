// src/config.js

// Default production URL
let API_URL = 'https://bulk-meter-mobile.onrender.com/api';

// Check if we have a saved custom URL
const savedUrl = localStorage.getItem('custom_api_url');
if (savedUrl) {
  API_URL = savedUrl;
}

export { API_URL };

// Helper to set custom API URL
export const setApiUrl = (url) => {
  localStorage.setItem('custom_api_url', url);
  API_URL = url;
  console.log('📡 API URL changed to:', url);
  return API_URL;
};

// Helper to test connection
export const testConnection = async (url) => {
  try {
    const response = await fetch(`${url}/health`, { timeout: 5000 });
    if (response.ok) {
      const data = await response.json();
      return { success: true, data };
    }
    return { success: false, error: 'Invalid response' };
  } catch (error) {
    return { success: false, error: error.message };
  }
};