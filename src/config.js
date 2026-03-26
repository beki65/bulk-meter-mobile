// Configuration for different environments
const ENV = {
  development: {
    API_URL: 'http://192.168.1.188:8000/api',
  },
  production: {
    API_URL: 'https://water-utility-backend.onrender.com/api',
  },
  local: {
    API_URL: 'http://localhost:8000/api',
  }
};

// Detect if running in Capacitor/Android app
const isCapacitorApp = () => {
  // Check if window.Capacitor exists (safe check)
  return typeof window !== 'undefined' && 
         window.Capacitor && 
         window.Capacitor.isNativePlatform && 
         window.Capacitor.isNativePlatform();
};

// Get API URL based on current environment
const getApiUrl = () => {
  // For Capacitor/Android app, always use production URL
  if (isCapacitorApp()) {
    console.log('📱 Running in Capacitor app, using production URL');
    return ENV.production.API_URL;
  }
  
  // Check if running on GitHub Pages
  if (typeof window !== 'undefined' && window.location && window.location.hostname.includes('github.io')) {
    console.log('🌐 Running on GitHub Pages, using production URL');
    return ENV.production.API_URL;
  }
  
  // Check if running on localhost
  if (typeof window !== 'undefined' && window.location && 
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    // Try to get saved custom URL first
    if (typeof localStorage !== 'undefined') {
      const savedUrl = localStorage.getItem('custom_api_url');
      if (savedUrl) {
        console.log('💾 Using saved custom URL:', savedUrl);
        return savedUrl;
      }
    }
    console.log('🏠 Using local URL');
    return ENV.local.API_URL;
  }
  
  // For development with IP
  if (process.env.NODE_ENV === 'development') {
    console.log('🛠️ Using development URL');
    return ENV.development.API_URL;
  }
  
  // Default to production
  console.log('🌍 Defaulting to production URL');
  return ENV.production.API_URL;
};

export const API_URL = getApiUrl();
console.log('🔧 Final API_URL:', API_URL);

// Helper to manually set API URL
export const setApiUrl = (url) => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('custom_api_url', url);
  }
  console.log('📡 API URL changed to:', url);
  if (typeof window !== 'undefined') {
    window.location.reload();
  }
};

// Helper to get custom API URL
export const getCustomApiUrl = () => {
  if (typeof localStorage !== 'undefined') {
    const customUrl = localStorage.getItem('custom_api_url');
    if (customUrl) return customUrl;
  }
  return API_URL;
};

// Helper to reset to default
export const resetApiUrl = () => {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('custom_api_url');
  }
  console.log('🔄 Reset to default API URL');
  if (typeof window !== 'undefined') {
    window.location.reload();
  }
};

// Helper to test connection to a server
export const testConnection = async (url) => {
  try {
    console.log('🔍 Testing connection to:', `${url}/health`);
    const response = await fetch(`${url}/health`, { timeout: 10000 });
    const data = await response.json();
    console.log('✅ Connection successful:', data);
    return response.ok;
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    return false;
  }
};

// Helper to discover local server automatically
export const discoverServer = async () => {
  const commonIps = ['192.168.1.188', '192.168.1.100', '192.168.0.100', '10.0.0.100'];
  
  console.log('🔍 Discovering local server...');
  for (const ip of commonIps) {
    try {
      const url = `http://${ip}:8000/api`;
      console.log(`  Testing ${url}...`);
      const isValid = await testConnection(url);
      if (isValid) {
        console.log(`✅ Found server at ${url}`);
        setApiUrl(url);
        return url;
      }
    } catch (e) {
      console.log(`  Failed: ${e.message}`);
    }
  }
  console.log('❌ No local server found');
  return null;
};