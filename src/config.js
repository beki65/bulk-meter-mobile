// Configuration for different environments
const ENV = {
  development: {
    API_URL: 'http://192.168.1.16:8000/api',  // Your current IP
  },
  production: {
    API_URL: 'https://your-deployed-backend.com/api',  // When you deploy to cloud
  },
  ngrok: {
    API_URL: 'https://abc123.ngrok.io/api',  // Your ngrok URL
  }
};

// Change this based on where you're deploying
export const API_URL = ENV.ngrok.API_URL;  // or ENV.production.API_URL