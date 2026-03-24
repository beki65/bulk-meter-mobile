import axios from 'axios';

// This will connect to your mobile app's backend
const MOBILE_API_URL = 'http://your-mobile-app-api.com/api'; // Replace with actual URL

const bulkAPI = axios.create({
  baseURL: MOBILE_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Fetch bulk readings for a specific DMA and inlet
export const getBulkReadings = async (dmaId, inletName, date) => {
  try {
    const response = await bulkAPI.get('/readings', {
      params: { dmaId, inletName, date }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching bulk readings:', error);
    return null;
  }
};

// Submit a new bulk reading (if your mobile app allows API submissions)
export const submitBulkReading = async (readingData) => {
  try {
    const response = await bulkAPI.post('/readings', readingData);
    return response.data;
  } catch (error) {
    console.error('Error submitting reading:', error);
    return null;
  }
};

// Get historical readings for charts
export const getReadingHistory = async (dmaId, inletName, days = 30) => {
  try {
    const response = await bulkAPI.get('/readings/history', {
      params: { dmaId, inletName, days }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching history:', error);
    return null;
  }
};

// WebSocket connection for real-time updates (if supported)
export const subscribeToReadings = (dmaId, inletName, callback) => {
  // This would be implemented with Socket.io or WebSockets
  // Example with WebSocket:
  const ws = new WebSocket(`ws://your-mobile-app-api.com/ws/readings/${dmaId}/${inletName}`);
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    callback(data);
  };
  
  return () => ws.close(); // Cleanup function
};

export default bulkAPI;