import React from 'react';
import ReactDOM from 'react-dom/client';

console.log('🚀 index.js loaded');
console.log('📱 Platform:', navigator.platform);
console.log('🔗 URL:', window.location.href);

const root = ReactDOM.createRoot(document.getElementById('root'));

// Simple fallback in case App fails to load
try {
  const App = require('./App').default;
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log('✅ App rendered successfully');
} catch (error) {
  console.error('❌ App failed to load:', error);
  root.render(
    <div style={{ padding: '20px', color: 'red', background: 'white' }}>
      <h1>Error Loading App</h1>
      <pre>{error.message}</pre>
    </div>
  );
}