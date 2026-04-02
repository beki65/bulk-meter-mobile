import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  TextField,
  Box,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Chip
} from '@mui/material';
import { API_URL, setApiUrl, testConnection } from '../config';
import { getLocalIP, testBackendConnection, getAllLocalIPs } from '../utils/networkUtils';

export default function EnvironmentSwitcher({ open, onClose }) {
  const [customUrl, setCustomUrl] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [detecting, setDetecting] = useState(false);
  const [detectedIPs, setDetectedIPs] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [foundBackends, setFoundBackends] = useState([]);

  // Auto-detect local IP on component mount
  useEffect(() => {
    if (open) {
      detectLocalIP();
    }
  }, [open]);

  const detectLocalIP = async () => {
    setDetecting(true);
    try {
      const ips = await getAllLocalIPs();
      setDetectedIPs(ips);
      console.log('Detected IPs:', ips);
    } catch (error) {
      console.error('Error detecting IP:', error);
    } finally {
      setDetecting(false);
    }
  };

  const scanForBackend = async () => {
    if (detectedIPs.length === 0) {
      alert('Please detect IPs first');
      return;
    }
    
    setScanning(true);
    setFoundBackends([]);
    
    for (const ip of detectedIPs) {
      const baseIp = ip.substring(0, ip.lastIndexOf('.') + 1);
      console.log(`Scanning network: ${baseIp}.*`);
      
      // Scan common IPs (1-20 for faster scanning)
      for (let i = 1; i <= 20; i++) {
        const testIp = `${baseIp}${i}`;
        const url = `http://${testIp}:8000/api`;
        
        const result = await testBackendConnection(url, 1000);
        if (result.success) {
          setFoundBackends(prev => [...prev, { ip: testIp, url, port: 8000 }]);
        }
      }
    }
    
    setScanning(false);
  };

  const handleSwitchToProd = () => {
    setApiUrl('https://bulk-meter-mobile.onrender.com/api');
    onClose();
    window.location.reload();
  };

  const handleSwitchToLocalIP = (ip) => {
    const url = `http://${ip}:8000/api`;
    setApiUrl(url);
    onClose();
    window.location.reload();
  };

  const handleSwitchToLocalhost = () => {
    setApiUrl('http://localhost:8000/api');
    onClose();
    window.location.reload();
  };

  const handleTestConnection = async () => {
    if (!customUrl) return;
    setTesting(true);
    setTestResult(null);
    const isConnected = await testConnection(customUrl);
    setTestResult(isConnected);
    setTesting(false);
  };

  const handleSetCustomUrl = () => {
    if (customUrl) {
      setApiUrl(customUrl);
      onClose();
      window.location.reload();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Environment Settings
        <Typography variant="caption" display="block" color="textSecondary">
          Current: {API_URL}
        </Typography>
      </DialogTitle>
      
      <DialogContent>
        {/* Auto-detection Section */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            🔍 Auto-Detect Local Backend
          </Typography>
          
          <Box display="flex" gap={1} sx={{ mb: 2 }}>
            <Button 
              variant="outlined" 
              onClick={detectLocalIP}
              disabled={detecting}
              size="small"
            >
              {detecting ? <CircularProgress size={20} /> : 'Detect My IP'}
            </Button>
            <Button 
              variant="outlined" 
              onClick={scanForBackend}
              disabled={scanning || detectedIPs.length === 0}
              size="small"
            >
              {scanning ? <CircularProgress size={20} /> : 'Scan Network'}
            </Button>
          </Box>
          
          {detectedIPs.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="textSecondary">
                Your IP addresses:
              </Typography>
              <Box display="flex" gap={1} flexWrap="wrap" sx={{ mt: 1 }}>
                {detectedIPs.map(ip => (
                  <Chip 
                    key={ip} 
                    label={ip} 
                    size="small" 
                    onClick={() => handleSwitchToLocalIP(ip)}
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>
            </Box>
          )}
          
          {foundBackends.length > 0 && (
            <Alert severity="success" sx={{ mt: 2 }}>
              <Typography variant="subtitle2">Found Backend Servers:</Typography>
              {foundBackends.map(backend => (
                <Box key={backend.ip} display="flex" justifyContent="space-between" alignItems="center" sx={{ mt: 1 }}>
                  <Typography variant="body2">{backend.url}</Typography>
                  <Button 
                    size="small" 
                    variant="contained" 
                    onClick={() => handleSwitchToLocalIP(backend.ip)}
                  >
                    Connect
                  </Button>
                </Box>
              ))}
            </Alert>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Manual Configuration Section */}
        <Typography variant="subtitle2" gutterBottom>
          ⚙️ Manual Configuration
        </Typography>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Button variant="outlined" onClick={handleSwitchToProd} size="small">
            Production (Render)
          </Button>
          <Button variant="outlined" onClick={handleSwitchToLocalhost} size="small">
            Localhost (Emulator Only)
          </Button>
          
          <TextField
            size="small"
            label="Custom URL"
            placeholder="http://192.168.1.100:8000/api"
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            fullWidth
            sx={{ mt: 2 }}
          />
          
          <Box display="flex" gap={1}>
            <Button variant="outlined" onClick={handleTestConnection} disabled={!customUrl}>
              Test
            </Button>
            <Button variant="contained" onClick={handleSetCustomUrl}>
              Apply
            </Button>
          </Box>
          
          {testResult !== null && (
            <Alert severity={testResult ? 'success' : 'error'} sx={{ mt: 1 }}>
              {testResult ? '✅ Connection successful!' : '❌ Connection failed'}
            </Alert>
          )}
        </Box>

        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="caption">
            💡 Tip: Make sure your backend is running on port 8000<br/>
            Run: cd backend &amp;&amp; node server.js
          </Typography>
        </Alert>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}