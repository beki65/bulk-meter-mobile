// src/config.js
const ENV = {
  development: {
    API_URL: 'http://192.168.1.216:8000/api',
  },
  production: {
    API_URL: 'https://bulk-meter-mobile.onrender.com/api',
  }
};

// Use production for the mobile app
export const API_URL = ENV.production.API_URL;