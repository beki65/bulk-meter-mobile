import React, { useState } from 'react';
import { Paper, Typography, Button, Box, CircularProgress, Alert, TextField, Divider } from '@mui/material';
import { API_URL, testConnection, setApiUrl } from './config';

export default function DebugScreen() {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState(null);
  const [customUrl, setCustomUrl] = useState('');

  const testConnectionToServer = async (url) => {
    setTesting(true);
    setResult(null);
    try {
      const response = await fetch(`${url}/health`, { timeout: 10000 });
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

  const handleSetCustomUrl = () => {
    if (customUrl) {
      setApiUrl(customUrl);
      setResult({ success: true, message: `URL set to: ${customUrl}. Reloading...` });
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
      </Box>

      <Button 
        variant="contained" 
        onClick={handleTestCurrent}
        disabled={testing}
        sx={{ mb: 2 }}
      >
        Test Current URL
      </Button>

      {testing && <CircularProgress size={20} sx={{ ml: 2 }} />}

      {result && (
        <Alert severity={result.success ? 'success' : 'error'} sx={{ mt: 2, mb: 2 }}>
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

      <Divider sx={{ my: 2 }} />

      <Typography variant="subtitle2" gutterBottom>Set Custom URL</Typography>
      <Box display="flex" gap={1}>
        <TextField
          fullWidth
          size="small"
          placeholder="http://192.168.1.188:8000/api"
          value={customUrl}
          onChange={(e) => setCustomUrl(e.target.value)}
        />
        <Button variant="outlined" onClick={handleSetCustomUrl}>Set</Button>
      </Box>

      <Typography variant="caption" color="textSecondary" sx={{ mt: 2, display: 'block' }}>
        Tip: If using local server, make sure your phone is on the same WiFi.
      </Typography>
    </Paper>
  );
}