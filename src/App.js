import React, { useState, useEffect } from 'react';
import {
  Button,
  Typography,
  Box,
  Paper,
  TextField,
  Alert,
  CircularProgress
} from '@mui/material';
import axios from 'axios';
import localforage from 'localforage';

// Configure localforage
localforage.config({
  name: 'BulkMeterTest',
  storeName: 'test'
});

function App() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [savedData, setSavedData] = useState(null);
  const [testInput, setTestInput] = useState('');

  // Test localforage
  const testLocalForage = async () => {
    setLoading(true);
    try {
      await localforage.setItem('test', { value: testInput, timestamp: new Date().toISOString() });
      const data = await localforage.getItem('test');
      setSavedData(data);
      setMessage('✅ Data saved to localforage!');
    } catch (error) {
      setMessage('❌ Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Test axios
  const testAxios = async () => {
    setLoading(true);
    try {
      // Test with a public API first
      const response = await axios.get('https://jsonplaceholder.typicode.com/posts/1');
      setMessage('✅ Axios working! Response: ' + JSON.stringify(response.data).substring(0, 100));
    } catch (error) {
      setMessage('❌ Axios error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      bgcolor: '#1e3a8a',
      color: 'white',
      p: 3
    }}>
      <Typography variant="h4" gutterBottom>💧 Bulk Meter</Typography>
      <Typography variant="body2" sx={{ mb: 3, color: '#ccc' }}>
        Testing Features
      </Typography>

      <Paper sx={{ p: 3, width: '100%', maxWidth: 400, bgcolor: '#f5f5f5' }}>
        
        {/* Test LocalForage */}
        <Typography variant="subtitle1" sx={{ mb: 1, color: '#1e3a8a' }}>
          📦 LocalForage Test
        </Typography>
        <TextField
          fullWidth
          size="small"
          placeholder="Enter test data"
          value={testInput}
          onChange={(e) => setTestInput(e.target.value)}
          sx={{ mb: 1 }}
        />
        <Button
          fullWidth
          variant="contained"
          onClick={testLocalForage}
          disabled={loading}
          sx={{ mb: 2 }}
        >
          Save to Local Storage
        </Button>
        {savedData && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Saved: {JSON.stringify(savedData)}
          </Alert>
        )}

        {/* Test Axios */}
        <Typography variant="subtitle1" sx={{ mb: 1, color: '#1e3a8a' }}>
          🌐 Axios Test
        </Typography>
        <Button
          fullWidth
          variant="contained"
          color="secondary"
          onClick={testAxios}
          disabled={loading}
          sx={{ mb: 2 }}
        >
          Test API Call
        </Button>

        {/* Status Message */}
        {loading && <CircularProgress size={24} sx={{ display: 'block', mx: 'auto', my: 2 }} />}
        {message && (
          <Alert severity={message.includes('✅') ? 'success' : 'error'} sx={{ mt: 2 }}>
            {message}
          </Alert>
        )}
      </Paper>

      <Typography variant="body2" sx={{ mt: 3, color: '#ccc' }}>
        Features working: MUI ✅ | LocalForage 🔜 | Axios 🔜
      </Typography>
    </Box>
  );
}

export default App;