const express = require('express');
const cors = require('cors');
const app = express();

// Try to find an available port
const PORT = process.env.PORT || 8000;

// Simple middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Backend is running!',
    port: PORT,
    time: new Date().toISOString()
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!', timestamp: new Date().toISOString() });
});

// Months endpoint
app.get('/api/months', (req, res) => {
  res.json([
    { month: 1, year: 2026, label: 'January 2026', count: 1000 },
    { month: 12, year: 2025, label: 'December 2025', count: 1000 }
  ]);
});

// Customers endpoint
app.get('/api/customers', (req, res) => {
  res.json({
    customers: [],
    stats: { totalCustomers: 0, zeroConsumption: 0, highConsumption: 0, averageConsumption: 0 }
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n✅ Server running on port ${PORT}`);
  console.log(`📡 Test: http://localhost:${PORT}/api/health`);
});