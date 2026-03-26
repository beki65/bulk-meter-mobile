import React from 'react';

function App() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#1e3a8a',
      color: 'white',
      fontFamily: 'sans-serif',
      textAlign: 'center',
      padding: '20px'
    }}>
      <div>
        <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>💧</h1>
        <h2>Bulk Meter Mobile</h2>
        <p>App is working!</p>
        <p style={{ fontSize: '12px', marginTop: '20px', color: '#ccc' }}>
          Build: {new Date().toLocaleString()}
        </p>
      </div>
    </div>
  );
}

export default App;