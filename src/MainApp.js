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
  Grid,
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
  LinearProgress
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
  Refresh as RefreshIcon,
  NetworkCheck as NetworkIcon,
  DataUsage as DataIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import localforage from 'localforage';
import axios from 'axios';
import { useAuth } from './context/AuthContext';
import { API_URL } from './config';
// Add import
import SettingsIcon from '@mui/icons-material/Settings';
import EnvironmentSwitcher from './components/EnvironmentSwitcher';

// Add state
const [showEnvSwitcher, setShowEnvSwitcher] = useState(false);

// Add Settings button to AppBar (inside Toolbar)
<IconButton color="inherit" onClick={() => setShowEnvSwitcher(true)}>
  <SettingsIcon />
</IconButton>

// Add EnvironmentSwitcher component at the end of return
{showEnvSwitcher && (
  <EnvironmentSwitcher 
    open={showEnvSwitcher} 
    onClose={() => setShowEnvSwitcher(false)} 
  />
)}
// Configure localforage
localforage.config({
  name: 'BulkMeterMobile',
  storeName: 'readings'
});

const theme = createTheme({
  palette: {
    primary: {
      main: '#1e3a8a',
    },
    secondary: {
      main: '#f57c00',
    },
  },
  typography: {
    fontSize: 14,
  },
});

// API URL - Update this based on your deployment


// DMA configurations
const dmaConfigs = {
  'Jafar': {
    id: 'DMA-JFR',
    inlets: [
      { name: 'Bulk Didly', size: '4"' },
      { name: 'Shemachoch', size: '3"' }
    ],
    outlets: [
      { name: 'Tel', size: '6"' }
    ]
  },
  'Yeka': {
    id: 'DMA-YKA',
    inlets: [
      { name: 'Misrak', size: '4"' },
      { name: 'English', size: '3"' },
      { name: 'Wubet', size: '2.5"' }
    ],
    outlets: []
  },
  '2019 DMA': {
    id: 'DMA-2019',
    inlets: [
      { name: 'Inlet 1', size: 'Unknown' },
      { name: 'Inlet 2', size: 'Unknown' }
    ],
    outlets: []
  }
};

// Custom hook for network status
const useNetworkStatus = () => {
  const [networkType, setNetworkType] = useState('unknown');
  const [isConnected, setIsConnected] = useState(navigator.onLine);
  const [isMetered, setIsMetered] = useState(false);
  const [connectionSpeed, setConnectionSpeed] = useState(null);

  useEffect(() => {
    const handleOnline = () => {
      setIsConnected(true);
      updateNetworkInfo();
    };

    const handleOffline = () => {
      setIsConnected(false);
    };

    const updateNetworkInfo = () => {
      if ('connection' in navigator) {
        const connection = navigator.connection || 
                          navigator.mozConnection || 
                          navigator.webkitConnection;
        
        if (connection) {
          setNetworkType(connection.type || 'unknown');
          setIsMetered(connection.metered || false);
          setConnectionSpeed(connection.downlink);
        }
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    updateNetworkInfo();

    // Listen for connection changes
    if ('connection' in navigator) {
      navigator.connection.addEventListener('change', updateNetworkInfo);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if ('connection' in navigator) {
        navigator.connection.removeEventListener('change', updateNetworkInfo);
      }
    };
  }, []);

  return { networkType, isConnected, isMetered, connectionSpeed };
};

// Data usage tracker
const useDataUsage = () => {
  const [dataUsage, setDataUsage] = useState({ wifi: 0, mobile: 0, total: 0 });

  const trackDataUsage = async (bytes, networkType) => {
    setDataUsage(prev => {
      const newUsage = { ...prev };
      if (networkType === 'wifi' || networkType === 'ethernet') {
        newUsage.wifi += bytes;
      } else if (networkType === 'cellular') {
        newUsage.mobile += bytes;
      }
      newUsage.total += bytes;
      return newUsage;
    });
  };

  const resetDataUsage = () => {
    setDataUsage({ wifi: 0, mobile: 0, total: 0 });
  };

  return { dataUsage, trackDataUsage, resetDataUsage };
};

export default function MainApp() {
  const [currentScreen, setCurrentScreen] = useState('capture');
  const [formData, setFormData] = useState({
    dma: '',
    inlet: '',
    size: '',
    meterReading: '',
    notes: ''
  });
  const [gps, setGps] = useState({ lat: null, lng: null, accuracy: null, loading: false });
  const [savedReadings, setSavedReadings] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [offline, setOffline] = useState(!navigator.onLine);
  const [syncing, setSyncing] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  const [dataUsageDialogOpen, setDataUsageDialogOpen] = useState(false);
  const { user, logout } = useAuth();
  
  const { networkType, isConnected, isMetered, connectionSpeed } = useNetworkStatus();
  const { dataUsage, trackDataUsage, resetDataUsage } = useDataUsage();

  // Network status
  useEffect(() => {
    const handleOnline = () => setOffline(false);
    const handleOffline = () => setOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load saved readings
  useEffect(() => {
    loadSavedReadings();
  }, []);

  // Show warning on mobile data
  useEffect(() => {
    if (networkType === 'cellular' && isMetered) {
      showSnackbar('You are on mobile data. Large syncs may incur charges.', 'warning');
    }
  }, [networkType, isMetered]);

  const loadSavedReadings = async () => {
    const readings = [];
    await localforage.iterate((value, key) => {
      readings.push({ id: key, ...value });
    });
    setSavedReadings(readings.sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    ));
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  // GPS Capture using browser's geolocation
  const captureGps = () => {
    setGps(prev => ({ ...prev, loading: true }));

    if (!navigator.geolocation) {
      showSnackbar('GPS not supported', 'error');
      setGps(prev => ({ ...prev, loading: false }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGps({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          loading: false
        });
        showSnackbar('GPS captured');
      },
      (error) => {
        showSnackbar('GPS failed: ' + error.message, 'error');
        setGps({ lat: null, lng: null, accuracy: null, loading: false });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Camera using browser's file input
  const takePhoto = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (readerEvent) => {
          setPhoto(readerEvent.target.result);
          showSnackbar('Photo captured');
        };
        reader.readAsDataURL(file);
      }
    };
    
    input.click();
  };

  // Save reading
  const saveReading = async () => {
    if (!formData.dma || !formData.inlet || !formData.meterReading) {
      showSnackbar('Please fill all required fields', 'error');
      return;
    }

    // Check if selected item is an outlet
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
      isOutlet: isOutlet,
      userId: user?._id,
      userName: user?.name
    };

    console.log('💾 Saving reading:', readingData);

    const id = Date.now().toString();
    await localforage.setItem(id, readingData);

    showSnackbar(offline ? 'Saved offline' : 'Saved locally');
    
    // Reset form
    setFormData({ dma: '', inlet: '', size: '', meterReading: '', notes: '' });
    setGps({ lat: null, lng: null, accuracy: null, loading: false });
    setPhoto(null);
    
    loadSavedReadings();

    if (!offline) {
      syncWithServer();
    }
  };

  // Sync a single reading
  const syncSingleReading = async (reading) => {
    try {
      let dmaId = 'DMA-2019';
      if (reading.dma === 'Jafar') dmaId = 'DMA-JFR';
      if (reading.dma === 'Yeka') dmaId = 'DMA-YKA';

      const response = await axios.post(`${API_URL}/bulk-readings`, {
        dmaId: dmaId,
        pointName: reading.inlet,
        meterReading: parseFloat(reading.meterReading),
        size: reading.size || 'Unknown',
        notes: reading.notes || '',
        latitude: reading.gps?.lat || null,
        longitude: reading.gps?.lng || null,
        timestamp: reading.timestamp,
        date: reading.date,
        pointType: reading.isOutlet ? 'outlet' : 'inlet',
        userId: reading.userId,
        userName: reading.userName
      });

      // Track data usage (approximate size of request)
      const requestSize = JSON.stringify(reading).length;
      await trackDataUsage(requestSize, networkType);

      if (response.status === 201) {
        const updated = { ...reading, synced: true };
        await localforage.setItem(reading.id, updated);
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Sync failed:', error.response?.data || error.message);
      throw error;
    }
  };

  // Main sync function with network awareness
  const syncWithServer = async () => {
    if (offline) {
      showSnackbar('Cannot sync while offline', 'warning');
      return;
    }

    const unsynced = savedReadings.filter(r => !r.synced);
    if (unsynced.length === 0) {
      showSnackbar('All readings synced', 'info');
      return;
    }

    // Check if on mobile data and have large pending sync
    if (networkType === 'cellular' && isMetered && unsynced.length > 10) {
      setSyncDialogOpen(true);
      return;
    }

    await performSync(unsynced);
  };

  // Perform the actual sync
  const performSync = async (unsynced) => {
    setSyncing(true);
    let successCount = 0;

    try {
      // Different sync strategies based on connection
      if (networkType === 'cellular' && connectionSpeed < 0.5) {
        // Slow mobile data - sync one by one with delay
        for (const reading of unsynced) {
          try {
            await syncSingleReading(reading);
            successCount++;
            await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (error) {
            console.error('Sync failed:', error);
          }
        }
      } else if (networkType === 'cellular') {
        // Good mobile data - sync in batches
        const batchSize = 5;
        for (let i = 0; i < unsynced.length; i += batchSize) {
          const batch = unsynced.slice(i, i + batchSize);
          await Promise.all(batch.map(reading => syncSingleReading(reading)));
          successCount += batch.length;
        }
      } else {
        // WiFi - sync all at once
        await Promise.all(unsynced.map(reading => syncSingleReading(reading)));
        successCount = unsynced.length;
      }

      showSnackbar(`Synced ${successCount} of ${unsynced.length} readings`);
    } catch (error) {
      showSnackbar('Sync failed: ' + error.message, 'error');
    } finally {
      setSyncing(false);
      await loadSavedReadings();
    }
  };

  // Delete reading
  const deleteReading = async (id) => {
    await localforage.removeItem(id);
    loadSavedReadings();
    showSnackbar('Reading deleted');
  };

  // Format bytes for display
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Render capture screen
  const renderCaptureScreen = () => (
    <Box sx={{ p: 2 }}>
      {/* Network indicator */}
      <Paper sx={{ p: 1, mb: 2, bgcolor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box display="flex" alignItems="center">
          <NetworkIcon sx={{ mr: 1, color: offline ? 'error.main' : 'success.main' }} />
          <Typography variant="caption">
            {offline ? 'Offline' : `${networkType} ${connectionSpeed ? `(${connectionSpeed} Mbps)` : ''}`}
          </Typography>
        </Box>
        <Button size="small" onClick={() => setDataUsageDialogOpen(true)} startIcon={<DataIcon />}>
          {formatBytes(dataUsage.total)}
        </Button>
      </Paper>

      {/* DMA Selection */}
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

      {/* Inlet Selection */}
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
              <MenuItem key={inlet.name} value={inlet.name}>
                📥 {inlet.name}
              </MenuItem>
            ))}
            {dmaConfigs[formData.dma].outlets.map(outlet => (
              <MenuItem key={outlet.name} value={outlet.name}>
                📤 {outlet.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {/* Meter Reading */}
      <TextField
        fullWidth
        label="Meter Reading (m³)"
        type="number"
        value={formData.meterReading}
        onChange={(e) => setFormData({ ...formData, meterReading: e.target.value })}
        sx={{ mb: 2 }}
        autoFocus
      />

      {/* Size Selection */}
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

      {/* Notes */}
      <TextField
        fullWidth
        label="Notes"
        multiline
        rows={2}
        value={formData.notes}
        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        sx={{ mb: 2 }}
      />

      {/* Action Buttons */}
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

      {/* Status Display */}
      {gps.lat && (
        <Alert severity="success" sx={{ mb: 2, py: 0.5 }}>
          📍 GPS: ±{Math.round(gps.accuracy)}m
        </Alert>
      )}
      {photo && (
        <Alert severity="success" sx={{ mb: 2, py: 0.5 }}>
          📸 Photo taken
        </Alert>
      )}

      {/* Save Button */}
      <Button
        fullWidth
        variant="contained"
        size="large"
        startIcon={<SaveIcon />}
        onClick={saveReading}
        disabled={syncing}
        sx={{ py: 2 }}
      >
        {syncing ? 'Syncing...' : 'Save Reading'}
      </Button>
    </Box>
  );

  // Render history screen
  const renderHistoryScreen = () => (
    <Box sx={{ p: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Saved Readings</Typography>
        <Box>
          <Button
            size="small"
            startIcon={<SyncIcon />}
            onClick={syncWithServer}
            disabled={syncing || offline}
            sx={{ mr: 1 }}
          >
            {syncing ? <CircularProgress size={20} /> : 'Sync'}
          </Button>
          <Button
            size="small"
            color="error"
            onClick={logout}
          >
            Logout
          </Button>
        </Box>
      </Box>

      {syncing && (
        <Box sx={{ width: '100%', mb: 2 }}>
          <LinearProgress />
          <Typography variant="caption" align="center" display="block">
            Syncing... Please wait
          </Typography>
        </Box>
      )}

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
                  {!reading.synced && (
                    <Chip size="small" label="Pending" color="warning" sx={{ mr: 1 }} />
                  )}
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
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              📱 Bulk Meter {user && `- ${user.name}`}
            </Typography>
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
          <BottomNavigationAction
            label="Capture"
            value="capture"
            icon={<HomeIcon />}
          />
          <BottomNavigationAction
            label="History"
            value="history"
            icon={
              <Badge
                color="primary"
                variant="dot"
                invisible={!savedReadings.some(r => !r.synced)}
              >
                <HistoryIcon />
              </Badge>
            }
          />
        </BottomNavigation>

        {/* Sync Confirmation Dialog for Mobile Data */}
        <Dialog open={syncDialogOpen} onClose={() => setSyncDialogOpen(false)}>
          <DialogTitle>
            <Box display="flex" alignItems="center">
              <WarningIcon color="warning" sx={{ mr: 1 }} />
              Mobile Data Warning
            </Box>
          </DialogTitle>
          <DialogContent>
            <Typography>
              You are on mobile data and have {savedReadings.filter(r => !r.synced).length} unsynced readings.
              This may use approximately{' '}
              {formatBytes(savedReadings.filter(r => !r.synced).length * 500)} of data.
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
              Continue with sync?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSyncDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={() => {
                setSyncDialogOpen(false);
                performSync(savedReadings.filter(r => !r.synced));
              }} 
              variant="contained"
              color="warning"
            >
              Continue
            </Button>
          </DialogActions>
        </Dialog>

        {/* Data Usage Dialog */}
        <Dialog open={dataUsageDialogOpen} onClose={() => setDataUsageDialogOpen(false)}>
          <DialogTitle>Data Usage Statistics</DialogTitle>
          <DialogContent>
            <Box sx={{ minWidth: 300 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, bgcolor: '#e3f2fd', textAlign: 'center' }}>
                    <Typography variant="caption">WiFi</Typography>
                    <Typography variant="h6">{formatBytes(dataUsage.wifi)}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, bgcolor: '#fff3e0', textAlign: 'center' }}>
                    <Typography variant="caption">Mobile</Typography>
                    <Typography variant="h6">{formatBytes(dataUsage.mobile)}</Typography>
                  </Paper>
                </Grid>
              </Grid>
              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Typography variant="h6">Total: {formatBytes(dataUsage.total)}</Typography>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={resetDataUsage} color="error">Reset</Button>
            <Button onClick={() => setDataUsageDialogOpen(false)}>Close</Button>
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