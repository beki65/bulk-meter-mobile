import React, { useState } from 'react';
import { Paper, Typography, Button, Box, CircularProgress, Alert, TextField } from '@mui/material';
import { API_URL, testConnection, discoverServer, setApiUrl } from './config';

export default function DebugScreen() {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState(null);
  const [customUrl, setCustomUrl] = useState('');

  const testConnectionToServer = async (url) => {
    setTesting(true);
    setResult(null);
    try {
      const response = await fetch(`${url}/health`);
      const data = await response.json();
      setResult({ success: true, data, url });
    } catch (error) {
      setResult({ success: false, error: error.message, url });
    } finally {
      setTesting(false);
    }
  };

  const handleTestCurrent = () => {
    testConnectionToServer(API_URL);
  };

  const handleAutoDiscover = async () => {
    setTesting(true);
    const discovered = await discoverServer();
    if (discovered) {
      setResult({ success: true, message: `Discovered server: ${discovered}`, url: discovered });
    } else {
      setResult({ success: false, message: 'No server found' });
    }
    setTesting(false);
  };

  const handleSetCustomUrl = () => {
    if (customUrl) {
      setApiUrl(customUrl);
      setResult({ success: true, message: `Set URL to: ${customUrl}. App will reload.` });
      setTimeout(() => window.location.reload(), 1500);
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>🔧 Connection Debug</Typography>
      
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="textSecondary">
          Current API URL: <strong>{API_URL}</strong>
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Hostname: <strong>{window.location.hostname}</strong>
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Capacitor: <strong>{typeof window.Capacitor !== 'undefined' ? 'Yes' : 'No'}</strong>
        </Typography>
      </Box>

      <Box display="flex" gap={2} sx={{ mb: 2 }}>
        <Button 
          variant="contained" 
          onClick={handleTestCurrent}
          disabled={testing}
        >
          Test Current URL
        </Button>
        <Button 
          variant="outlined" 
          onClick={handleAutoDiscover}
          disabled={testing}
        >
          Auto Discover
        </Button>
      </Box>

      <Box display="flex" gap={2} sx={{ mb: 2 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Enter custom URL (e.g., http://192.168.1.188:8000/api)"
          value={customUrl}
          onChange={(e) => setCustomUrl(e.target.value)}
        />
        <Button 
          variant="contained" 
          onClick={handleSetCustomUrl}
          disabled={!customUrl}
        >
          Set URL
        </Button>
      </Box>

      {testing && (
        <Box display="flex" alignItems="center" gap={2}>
          <CircularProgress size={20} />
          <Typography>Testing connection...</Typography>
        </Box>
      )}

      {result && (
        <Alert severity={result.success ? 'success' : 'error'} sx={{ mt: 2 }}>
          {result.success ? (
            <>
              ✅ Connected to {result.url}
              {result.data && (
                <Typography variant="caption" display="block">
                  Response: {JSON.stringify(result.data)}
                </Typography>
              )}
            </>
          ) : (
            <>❌ Failed to connect to {result.url}: {result.error}</>
          )}
        </Alert>
      )}

      <Typography variant="caption" color="textSecondary" sx={{ mt: 2, display: 'block' }}>
        Tip: If using local server, make sure your phone is on the same WiFi as your computer.
        Your computer's IP: Check with `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
      </Typography>
    </Paper>
  );
}