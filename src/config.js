// Configuration for different environments
const ENV = {
  development: {
    API_URL: 'http://192.168.1.188:8000/api', // Your current computer IP
  },
  production: {
    API_URL: 'https://water-utility-backend.onrender.com/api', // Render backend
  },
  local: {
    API_URL: 'http://localhost:8000/api',
  }
};

// Get API URL based on current environment
const getApiUrl = () => {
  // Check if running on GitHub Pages
  if (window.location.hostname.includes('github.io')) {
    return ENV.production.API_URL;
  }
  
  // Check if running on localhost
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    // Try to get saved custom URL first
    const savedUrl = localStorage.getItem('custom_api_url');
    if (savedUrl) {
      return savedUrl;
    }
    return ENV.local.API_URL;
  }
  
  // For development with IP
  if (process.env.NODE_ENV === 'development') {
    return ENV.development.API_URL;
  }
  
  // Default to production
  return ENV.production.API_URL;
};

export const API_URL = getApiUrl();

// Helper to manually set API URL (can be used in settings)
export const setApiUrl = (url) => {
  localStorage.setItem('custom_api_url', url);
  window.location.reload();
};

// Helper to get custom API URL
export const getCustomApiUrl = () => {
  const customUrl = localStorage.getItem('custom_api_url');
  if (customUrl) return customUrl;
  return API_URL;
};

// Helper to reset to default
export const resetApiUrl = () => {
  localStorage.removeItem('custom_api_url');
  window.location.reload();
};

// Helper to test connection to a server
export const testConnection = async (url) => {
  try {
    const response = await fetch(`${url}/health`, { timeout: 5000 });
    return response.ok;
  } catch (error) {
    return false;
  }
};

// Helper to discover local server automatically
export const discoverServer = async () => {
  const commonIps = ['192.168.1.188', '192.168.1.100', '192.168.0.100', '10.0.0.100'];
  
  for (const ip of commonIps) {
    try {
      const url = `http://${ip}:8000/api`;
      const isValid = await testConnection(url);
      if (isValid) {
        setApiUrl(url);
        return url;
      }
    } catch (e) {
      // Continue to next IP
    }
  }
  return null;
};