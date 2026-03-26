import React from 'react';

export default function App() {
  console.log('🚀 App starting...');
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#1e3a8a',
      color: 'white',
      fontFamily: 'sans-serif',
      padding: '20px',
      textAlign: 'center'
    }}>
      <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>💧</h1>
      <h2>✅ APP IS WORKING!</h2>
      <p>If you see this, the app loads correctly.</p>
      <p style={{ fontSize: '12px', marginTop: '40px', color: '#ccc' }}>
        Build: {new Date().toLocaleString()}
      </p>
    </div>
  );
}