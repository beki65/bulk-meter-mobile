import React, { useState } from 'react';

export default function Test() {
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDialog, setShowDialog] = useState(false);

  const items = [
    { id: 1, name: 'Jafar DMA', color: '#FF6B6B' },
    { id: 2, name: 'Yeka DMA', color: '#4ECDC4' },
    { id: 3, name: '2019 DMA', color: '#95A5A6' }
  ];

  const cardStyle = {
    borderLeft: '6px solid',
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    height: '100%',
    display: 'flex',
    flexDirection: 'column'
  };

  const buttonStyle = (color) => ({
    width: '100%',
    padding: '15px',
    backgroundColor: color,
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '20px'
  });

  return (
    <div style={{ padding: '20px', backgroundColor: '#f5f5f5' }}>
      <h1 style={{ color: '#1e3a8a', marginBottom: '30px' }}>DMA Zones Test</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        {items.map(item => (
          <div key={item.id} style={{ ...cardStyle, borderColor: item.color }}>
            <h2 style={{ margin: '0 0 10px 0' }}>{item.name}</h2>
            <div style={{ color: '#666', marginBottom: '10px' }}>ID: DMA-{item.id}</div>
            <div style={{ flex: 1 }}>
              <p>This is a test card for {item.name}</p>
              <p>Click the button below to test</p>
            </div>
            
            {/* 🟢 TEST BUTTON - This will definitely appear 🟢 */}
            <button
              onClick={() => {
                setSelectedItem(item);
                setShowDialog(true);
              }}
              style={buttonStyle(item.color)}
            >
              VIEW {item.name} DETAILS
            </button>
          </div>
        ))}
      </div>

      {/* Dialog Popup */}
      {showDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            maxWidth: '400px',
            width: '90%'
          }}>
            <h2 style={{ marginTop: 0, color: selectedItem?.color }}>
              {selectedItem?.name}
            </h2>
            <p>Test dialog opened successfully!</p>
            <p>The button works! 🎉</p>
            <button
              onClick={() => setShowDialog(false)}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: selectedItem?.color,
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginTop: '20px'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}