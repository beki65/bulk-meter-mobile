// Configuration for different environments
let API_URL = 'https://bulk-meter-mobile.onrender.com/api';

// For development (local testing)
if (process.env.NODE_ENV === 'development') {
  // Use your computer's local IP address (find it using 'ipconfig' command)
  API_URL = 'http://192.168.1.100:8000/api';  // Replace with your actual IP
}

// If you want to force local testing for all environments (temporarily)
// Uncomment the line below:
// API_URL = 'http://192.168.1.100:8000/api';

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
    console.error('Connection failed:', error);
    return false;
  }
};