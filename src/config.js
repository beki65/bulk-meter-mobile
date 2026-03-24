// Configuration for different environments
const ENV = {
  development: {
<<<<<<< HEAD
    API_URL: 'http://192.168.1.188:8000/api', // Your current computer IP
  },
  production: {
    API_URL: 'https://water-utility-backend.onrender.com/api', // Render deployed backend
  },
  staging: {
    API_URL: 'https://staging-water-utility.onrender.com/api',
  },
  local: {
    API_URL: 'http://localhost:8000/api',
  }
};

// Get current environment from build time or localStorage
const getCurrentEnvironment = () => {
  // Check if user has saved a custom environment
  const savedEnv = localStorage.getItem('app_environment');
  if (savedEnv && ENV[savedEnv]) {
    return savedEnv;
  }
  
  // Use production for APK builds
  if (process.env.NODE_ENV === 'production') {
    return 'production';
  }
  
  // Development default
  return 'development';
};

// Get API URL based on current environment
const getApiUrl = () => {
  // Check if running on GitHub Pages
  if (window.location.hostname.includes('github.io')) {
    return ENV.production.API_URL;
  }
  
  // Check if running on localhost
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
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

// Get custom API URL if set
export const getCustomApiUrl = () => {
  const customUrl = localStorage.getItem('custom_api_url');
  if (customUrl) return customUrl;
  return API_URL;
};
=======
    API_URL: 'http://192.168.1.16:8000/api', // For local testing
  },
  production: {
    API_URL: 'https://bulk-meter-mobile.onrender.com/api', // <-- YOUR LIVE RENDER URL
  }
};

// Use production for the APK build
export const API_URL = ENV.production.API_URL;
>>>>>>> b7cd2bc2a082bb0d8ea2e81b00a2c10d5dae25eb
