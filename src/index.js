import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Detect if running in Capacitor native app
const isCapacitorApp = () => {
  // Check for Capacitor global object
  return typeof window !== 'undefined' && 
         window.Capacitor && 
         window.Capacitor.isNativePlatform && 
         window.Capacitor.isNativePlatform();
};

// Log environment info
console.log('🚀 App starting...');
console.log('📱 Running in Capacitor app:', isCapacitorApp());
console.log('🌐 Platform:', navigator.platform);
console.log('🔗 URL:', window.location.href);

// Add global error handler
window.addEventListener('error', (event) => {
  console.error('❌ Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('❌ Unhandled promise rejection:', event.reason);
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);