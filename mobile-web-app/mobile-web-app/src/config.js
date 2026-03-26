// Configuration for different environments
const ENV = {
  development: {
    API_URL: 'http://192.168.1.16:8000/api', // For local testing
  },
  production: {
    API_URL: 'https://bulk-meter-mobile.onrender.com/api', // <-- YOUR LIVE RENDER URL
  }
};

// Use production for the APK build
export const API_URL = ENV.production.API_URL;