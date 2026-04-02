// src/config.js
const ENV = {
  development: {
    API_URL: 'http://localhost:8000/api',
  },
  production: {
    API_URL: 'https://bulk-meter-mobile.onrender.com/api',
  }
};

// Use development for local testing
export const API_URL = ENV.development.API_URL;