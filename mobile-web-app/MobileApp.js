import React, { useState, useEffect } from 'react';
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Box,
  AppBar,
  Toolbar,
  Typography,
  Container,
  Paper,
  Button,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Card,
  CardContent,
  Alert,
  Snackbar,
  IconButton,
  CircularProgress,
  BottomNavigation,
  BottomNavigationAction,
  Badge,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  LinearProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  CameraAlt as CameraIcon,
  MyLocation as GpsIcon,
  Save as SaveIcon,
  History as HistoryIcon,
  Home as HomeIcon,
  Sync as SyncIcon,
  WifiOff as OfflineIcon,
  Delete as DeleteIcon,
  Settings as SettingsIcon,
  NetworkCheck as NetworkIcon,
  Refresh as RefreshIcon,
  Computer as ComputerIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import localforage from 'localforage';
import axios from 'axios';
import { Camera } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';

// Configure localforage
localforage.config({
  name: 'BulkMeterMobile',
  storeName: 'readings'
});

const theme = createTheme({
  palette: {
    primary: { main: '#1e3a8a' },
    secondary: { main: '#f57c00' },
  },
  typography: { fontSize: 14 },
});

// DMA configurations
const dmaConfigs = {
  'Jafar': {
    id: 'DMA-JFR',
    inlets: [{ name: 'Bulk Didly', size: '4"' }, { name: 'Shemachoch', size: '3"' }],
    outlets: [{ name: 'Tel', size: '6"' }]
  },
  'Yeka': {
    id: 'DMA-YKA',
    inlets: [{ name: 'Misrak', size: '4"' }, { name: 'English', size: '3"' }, { name: 'Wubet', size: '2.5"' }],
    outlets: []
  },
  '2019 DMA': {
    id: 'DMA-2019',
    inlets: [{ name: 'Inlet 1', size: 'Unknown' }, { name: 'Inlet 2', size: 'Unknown' }],
    outlets: []
  }
};

// Get saved API URL or use default
const getSavedApiUrl = () => {
  const saved = localStorage.getItem('api_url');
  return saved || 'https://bulk-meter-mobile.onrender.com/api';
};

const saveApiUrl = (url) => {
  localStorage.setItem('api_url', url);
};

// Get saved server list
const getSavedServers = () => {
  const saved = localStorage.getItem('discovered_servers');
  return saved ? JSON.parse(saved) : [];
};

const saveServers = (servers) => {
  localStorage.setItem('discovered_servers', JSON.stringify(servers));
};

function MobileApp() {
  const [currentScreen, setCurrentScreen] = useState('capture');
  const [formData, setFormData] = useState({
    dma: '', inlet: '', size: '', meterReading: '', notes: ''
  });
  const [gps, setGps] = useState({ lat: null, lng: null, accuracy: null, loading: false });
  const [savedReadings, setSavedReadings] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [offline, setOffline] = useState(!navigator.onLine);
  const [syncing, setSyncing] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [apiUrl, setApiUrl] = useState(getSavedApiUrl());
  const [customUrl, setCustomUrl] = useState(apiUrl);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [discovering, setDiscovering] = useState(false);
  const [availableServers, setAvailableServers] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [selectedServer, setSelectedServer] = useState(null);
  const [showServerList, setShowServerList] = useState(false);

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => setOffline(false);
    const handleOffline = () => setOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Load saved servers on startup
    const savedServers = getSavedServers();
    if (savedServers.length > 0) {
      setAvailableServers(savedServers);
    }
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load saved readings
  useEffect(() => {
    loadSavedReadings();
  }, []);

  const loadSavedReadings = async () => {
    const readings = [];
    await localforage.iterate((value, key) => {
      readings.push({ id: key, ...value });
    });
    setSavedReadings(readings.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const captureGps = async () => {
    setGps(prev => ({ ...prev, loading: true }));
    try {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000
      });
      setGps({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
        loading: false
      });
      showSnackbar('GPS captured successfully');
    } catch (error) {
      showSnackbar('Failed to get GPS: ' + error.message, 'error');
      setGps({ lat: null, lng: null, accuracy: null, loading: false });
    }
  };

  const takePhoto = async () => {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: 'base64'
      });
      setPhoto(image.base64String);
      showSnackbar('Photo captured');
    } catch (error) {
      showSnackbar('Failed to take photo', 'error');
    }
  };

  const saveReading = async () => {
    if (!formData.dma || !formData.inlet || !formData.meterReading) {
      showSnackbar('Please fill all required fields', 'error');
      return;
    }

    const isOutlet = dmaConfigs[formData.dma]?.outlets.some(o => o.name === formData.inlet);

    const readingData = {
      ...formData,
      dmaId: dmaConfigs[formData.dma]?.id,
      meterReading: parseFloat(formData.meterReading),
      gps: gps.lat && gps.lng ? { lat: gps.lat, lng: gps.lng } : null,
      photo: photo,
      timestamp: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0],
      synced: false,
      isOutlet: isOutlet
    };

    const id = Date.now().toString();
    await localforage.setItem(id, readingData);
    showSnackbar(offline ? 'Saved offline - will sync when online' : 'Saved locally');
    
    setFormData({ dma: '', inlet: '', size: '', meterReading: '', notes: '' });
    setGps({ lat: null, lng: null, accuracy: null, loading: false });
    setPhoto(null);
    loadSavedReadings();

    if (!offline) {
      syncWithServer();
    }
  };

  const syncWithServer = async () => {
    if (offline) {
      showSnackbar('Cannot sync while offline', 'warning');
      return;
    }

    setSyncing(true);
    const unsynced = savedReadings.filter(r => !r.synced);

    if (unsynced.length === 0) {
      showSnackbar('All readings synced', 'info');
      setSyncing(false);
      return;
    }

    let successCount = 0;

    for (const reading of unsynced) {
      try {
        let dmaId = 'DMA-2019';
        if (reading.dma === 'Jafar') dmaId = 'DMA-JFR';
        if (reading.dma === 'Yeka') dmaId = 'DMA-YKA';

        const response = await axios.post(`${apiUrl}/bulk-readings`, {
          dmaId: dmaId,
          pointName: reading.inlet,
          meterReading: parseFloat(reading.meterReading) || 0,
          size: reading.size || 'Unknown',
          notes: reading.notes || '',
          latitude: reading.gps?.lat || null,
          longitude: reading.gps?.lng || null,
          timestamp: reading.timestamp || new Date().toISOString(),
          date: reading.date || new Date().toISOString().split('T')[0],
          pointType: reading.isOutlet ? 'outlet' : 'inlet'
        });

        if (response.status === 201 || response.status === 200) {
          const updated = { ...reading, synced: true };
          await localforage.setItem(reading.id, updated);
          successCount++;
          console.log(`✅ Synced: ${reading.inlet} - ${reading.meterReading} m³`);
        }
      } catch (error) {
        console.error('❌ Sync failed:', error.response?.data || error.message);
      }
    }

    setSyncing(false);
    await loadSavedReadings();
    showSnackbar(`Synced ${successCount} of ${unsynced.length} readings`, successCount > 0 ? 'success' : 'error');
  };

  const deleteReading = async (id) => {
    await localforage.removeItem(id);
    loadSavedReadings();
    showSnackbar('Reading deleted');
  };

  const testConnection = async (url) => {
    setTestingConnection(true);
    setConnectionStatus(null);
    try {
      const response = await axios.get(`${url}/health`, { timeout: 5000 });
      if (response.data && response.data.status === 'OK') {
        setConnectionStatus({ success: true, message: 'Connection successful!' });
        return true;
      }
      setConnectionStatus({ success: false, message: 'Invalid response from server' });
      return false;
    } catch (error) {
      setConnectionStatus({ success: false, message: `Connection failed: ${error.message}` });
      return false;
    } finally {
      setTestingConnection(false);
    }
  };

  const applyApiUrl = async () => {
    const isValid = await testConnection(customUrl);
    if (isValid) {
      saveApiUrl(customUrl);
      setApiUrl(customUrl);
      setSettingsOpen(false);
      showSnackbar('API URL updated successfully!', 'success');
      loadSavedReadings();
    }
  };

  // Enhanced multi-server discovery
  const discoverServers = async () => {
    setScanning(true);
    setConnectionStatus(null);
    setShowServerList(true);
    
    const foundServers = [];
    
    // Method 1: Try mDNS/Bonjour names
    const commonNames = [
      'waterutility.local',
      'backend.local',
      'server.local',
      'laptop.local',
      'desktop.local',
      'WaterUtilityBackend.local'
    ];
    
    for (const name of commonNames) {
      const testUrl = `http://${name}:3001/api/discover`;
      try {
        const response = await axios.get(testUrl, { timeout: 1500 });
        if (response.data && response.data.computerName) {
          foundServers.push({
            name: response.data.computerName,
            ip: response.data.mainIp,
            url: `http://${response.data.mainIp}:8000/api`,
            discoveryUrl: testUrl,
            status: 'online',
            lastSeen: new Date().toISOString()
          });
        }
      } catch (error) {
        // Continue scanning
      }
    }
    
    // Method 2: Scan IP ranges
    const commonPrefixes = ['192.168.1.', '192.168.0.', '10.0.0.', '172.16.'];
    
    for (const prefix of commonPrefixes) {
      for (let i = 1; i <= 30; i++) {
        const testIp = `${prefix}${i}`;
        const discoverUrl = `http://${testIp}:3001/api/discover`;
        
        try {
          const response = await axios.get(discoverUrl, { timeout: 800 });
          if (response.data && response.data.computerName) {
            // Check if already found
            const exists = foundServers.some(s => s.ip === testIp);
            if (!exists) {
              foundServers.push({
                name: response.data.computerName,
                ip: testIp,
                url: `http://${testIp}:8000/api`,
                discoveryUrl: discoverUrl,
                status: 'online',
                lastSeen: new Date().toISOString(),
                systemInfo: {
                  os: response.data.os,
                  uptime: response.data.uptime,
                  memory: response.data.totalMemory
                }
              });
            }
          }
        } catch (error) {
          // Continue scanning
        }
      }
    }
    
    // Remove duplicates
    const uniqueServers = [];
    const seenIps = new Set();
    for (const server of foundServers) {
      if (!seenIps.has(server.ip)) {
        seenIps.add(server.ip);
        uniqueServers.push(server);
      }
    }
    
    setAvailableServers(uniqueServers);
    saveServers(uniqueServers);
    setScanning(false);
    
    if (uniqueServers.length === 0) {
      setConnectionStatus({ success: false, message: 'No servers found. Make sure backend is running on at least one computer.' });
    } else {
      setConnectionStatus({ success: true, message: `Found ${uniqueServers.length} server(s)!` });
    }
  };

  const connectToServer = async (server) => {
    setCustomUrl(server.url);
    setSelectedServer(server);
    const isValid = await testConnection(server.url);
    if (isValid) {
      saveApiUrl(server.url);
      setApiUrl(server.url);
      setSettingsOpen(false);
      setShowServerList(false);
      showSnackbar(`Connected to ${server.name} at ${server.ip}`, 'success');
      loadSavedReadings();
    }
  };

  const refreshServerList = () => {
    discoverServers();
  };

  const renderCaptureScreen = () => (
    <Box sx={{ p: 2 }}>
      <Paper sx={{ p: 1, mb: 2, bgcolor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box display="flex" alignItems="center">
          <NetworkIcon sx={{ mr: 1, color: offline ? 'error.main' : 'success.main' }} />
          <Typography variant="caption">
            {offline ? 'Offline' : (selectedServer ? `${selectedServer.name}` : apiUrl.split('/')[2] || 'Connected')}
          </Typography>
        </Box>
        <IconButton size="small" onClick={() => setSettingsOpen(true)}>
          <SettingsIcon fontSize="small" />
        </IconButton>
      </Paper>

      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>DMA Zone</InputLabel>
        <Select
          value={formData.dma}
          label="DMA Zone"
          onChange={(e) => setFormData({ ...formData, dma: e.target.value, inlet: '' })}
        >
          {Object.keys(dmaConfigs).map(dma => (
            <MenuItem key={dma} value={dma}>{dma}</MenuItem>
          ))}
        </Select>
      </FormControl>

      {formData.dma && (
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Inlet/Outlet</InputLabel>
          <Select
            value={formData.inlet}
            label="Inlet/Outlet"
            onChange={(e) => {
              const selected = e.target.value;
              setFormData({ ...formData, inlet: selected });
              const inlet = dmaConfigs[formData.dma].inlets.find(i => i.name === selected);
              const outlet = dmaConfigs[formData.dma].outlets.find(o => o.name === selected);
              if (inlet) setFormData(prev => ({ ...prev, size: inlet.size }));
              if (outlet) setFormData(prev => ({ ...prev, size: outlet.size }));
            }}
          >
            {dmaConfigs[formData.dma].inlets.map(inlet => (
              <MenuItem key={inlet.name} value={inlet.name}>📥 {inlet.name}</MenuItem>
            ))}
            {dmaConfigs[formData.dma].outlets.map(outlet => (
              <MenuItem key={outlet.name} value={outlet.name}>📤 {outlet.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      <TextField
        fullWidth
        label="Meter Reading (m³)"
        type="number"
        value={formData.meterReading}
        onChange={(e) => setFormData({ ...formData, meterReading: e.target.value })}
        sx={{ mb: 2 }}
        autoFocus
      />

      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Bulk Size</InputLabel>
        <Select
          value={formData.size}
          label="Bulk Size"
          onChange={(e) => setFormData({ ...formData, size: e.target.value })}
        >
          {['2"', '2.5"', '3"', '4"', '6"', '8"'].map(size => (
            <MenuItem key={size} value={size}>{size}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <TextField
        fullWidth
        label="Notes"
        multiline
        rows={2}
        value={formData.notes}
        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        sx={{ mb: 2 }}
      />

      <Grid container spacing={1} sx={{ mb: 2 }}>
        <Grid item xs={6}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<GpsIcon />}
            onClick={captureGps}
            disabled={gps.loading}
            sx={{ py: 1.5 }}
          >
            {gps.loading ? '...' : 'GPS'}
          </Button>
        </Grid>
        <Grid item xs={6}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<CameraIcon />}
            onClick={takePhoto}
            sx={{ py: 1.5 }}
          >
            Photo
          </Button>
        </Grid>
      </Grid>

      {gps.lat && (
        <Alert severity="success" sx={{ mb: 2 }}>📍 GPS Locked (accuracy: ±{Math.round(gps.accuracy)}m)</Alert>
      )}
      {photo && <Alert severity="success" sx={{ mb: 2 }}>📸 Photo captured</Alert>}

      <Button
        fullWidth
        variant="contained"
        size="large"
        startIcon={<SaveIcon />}
        onClick={saveReading}
        sx={{ py: 2 }}
      >
        Save Reading
      </Button>
    </Box>
  );

  const renderHistoryScreen = () => (
    <Box sx={{ p: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Saved Readings</Typography>
        <Button
          size="small"
          startIcon={<SyncIcon />}
          onClick={syncWithServer}
          disabled={syncing || offline}
        >
          {syncing ? <CircularProgress size={20} /> : 'Sync All'}
        </Button>
      </Box>

      {syncing && <LinearProgress sx={{ mb: 2 }} />}

      {savedReadings.length === 0 ? (
        <Alert severity="info">No readings saved</Alert>
      ) : (
        savedReadings.map((reading) => (
          <Card key={reading.id} sx={{ mb: 2 }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between">
                <Box>
                  <Typography variant="subtitle2">
                    {reading.dma} - {reading.inlet}
                  </Typography>
                  <Typography variant="body2">
                    Reading: {reading.meterReading} m³
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {new Date(reading.timestamp).toLocaleString()}
                  </Typography>
                  {reading.gps && (
                    <Typography variant="caption" display="block" color="textSecondary">
                      📍 {reading.gps.lat.toFixed(4)}, {reading.gps.lng.toFixed(4)}
                    </Typography>
                  )}
                </Box>
                <Box display="flex" alignItems="center">
                  {!reading.synced && <Chip size="small" label="Pending" color="warning" sx={{ mr: 1 }} />}
                  <IconButton size="small" onClick={() => deleteReading(reading.id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))
      )}
    </Box>
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ pb: 7, minHeight: '100vh', bgcolor: '#f5f5f5' }}>
        <AppBar position="sticky">
          <Toolbar>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>📱 Bulk Meter</Typography>
            <IconButton color="inherit" onClick={() => { setSettingsOpen(true); setShowServerList(true); }}>
              <NetworkIcon />
            </IconButton>
            {offline && <OfflineIcon />}
          </Toolbar>
        </AppBar>

        <Container maxWidth="sm" disableGutters>
          {currentScreen === 'capture' && renderCaptureScreen()}
          {currentScreen === 'history' && renderHistoryScreen()}
        </Container>

        <BottomNavigation
          value={currentScreen}
          onChange={(e, newValue) => setCurrentScreen(newValue)}
          sx={{ position: 'fixed', bottom: 0, left: 0, right: 0 }}
        >
          <BottomNavigationAction label="Capture" value="capture" icon={<HomeIcon />} />
          <BottomNavigationAction
            label="History"
            value="history"
            icon={
              <Badge color="primary" variant="dot" invisible={!savedReadings.some(r => !r.synced)}>
                <HistoryIcon />
              </Badge>
            }
          />
        </BottomNavigation>

        {/* Settings Dialog with Server List */}
        <Dialog open={settingsOpen} onClose={() => { setSettingsOpen(false); setShowServerList(false); }} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">Server Settings</Typography>
              <IconButton onClick={refreshServerList} size="small">
                <RefreshIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Current Server: <strong>{selectedServer ? selectedServer.name : apiUrl.split('/')[2] || 'None'}</strong>
            </Typography>
            
            <Button 
              fullWidth 
              variant="contained" 
              onClick={discoverServers} 
              disabled={scanning}
              startIcon={scanning ? <CircularProgress size={20} /> : <NetworkIcon />}
              sx={{ mb: 2 }}
            >
              {scanning ? 'Scanning Network...' : '🔍 Find Available Servers'}
            </Button>

            {showServerList && availableServers.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Available Servers ({availableServers.length})
                </Typography>
                <List sx={{ bgcolor: '#f5f5f5', borderRadius: 1 }}>
                  {availableServers.map((server, idx) => (
                    <ListItem 
                      key={idx} 
                      button 
                      onClick={() => connectToServer(server)}
                      sx={{ 
                        borderRadius: 1, 
                        mb: 0.5,
                        bgcolor: selectedServer?.ip === server.ip ? '#e3f2fd' : 'white'
                      }}
                    >
                      <ComputerIcon sx={{ mr: 2, color: '#1e3a8a' }} />
                      <ListItemText 
                        primary={server.name}
                        secondary={`IP: ${server.ip} | Port: 8000`}
                      />
                      {selectedServer?.ip === server.ip && (
                        <CheckCircleIcon color="success" />
                      )}
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            {connectionStatus && (
              <Alert severity={connectionStatus.success ? 'success' : 'error'} sx={{ mt: 2, mb: 2 }}>
                {connectionStatus.message}
              </Alert>
            )}

            <Divider sx={{ my: 2 }} />
            
            <Typography variant="subtitle2" gutterBottom>Manual Configuration</Typography>
            
            <TextField
              fullWidth
              label="Custom API URL"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="http://192.168.1.100:8000/api"
              margin="normal"
              size="small"
            />
            
            <Box display="flex" gap={1} sx={{ mt: 1, mb: 2 }}>
              <Button variant="outlined" onClick={() => testConnection(customUrl)} disabled={testingConnection} size="small">
                {testingConnection ? <CircularProgress size={20} /> : 'Test'}
              </Button>
              <Button variant="contained" onClick={applyApiUrl} size="small">
                Apply
              </Button>
            </Box>

            <Typography variant="subtitle2" gutterBottom>Quick Presets:</Typography>
            <Box display="flex" gap={1} flexWrap="wrap">
              <Button size="small" variant="outlined" onClick={() => setCustomUrl('https://bulk-meter-mobile.onrender.com/api')}>
                Production
              </Button>
              <Button size="small" variant="outlined" onClick={() => setCustomUrl('http://10.0.2.2:8000/api')}>
                Android Emulator
              </Button>
              <Button size="small" variant="outlined" onClick={() => setCustomUrl('http://localhost:8000/api')}>
                Localhost
              </Button>
            </Box>
            
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="caption">
                💡 To find computers on your network:<br/>
                1. Make sure backend is running on each computer<br/>
                2. Click "Find Available Servers"<br/>
                3. Select a server to connect
              </Typography>
            </Alert>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => { setSettingsOpen(false); setShowServerList(false); }}>Close</Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
}

export default MobileApp;