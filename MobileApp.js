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
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Switch,
  Divider
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
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { getDistance } from 'geolib';
import localforage from 'localforage';
import axios from 'axios';
import { Camera } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { Network } from '@capacitor/network';

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
    fontSize: 14, // Larger for mobile
  },
});

// DMA configurations (same as before)
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

function MobileApp() {
  const [currentScreen, setCurrentScreen] = useState('capture'); // capture, history, settings
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

  // Network status monitoring
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

  // Capture GPS
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

  // Take photo
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

  // Save reading
  const saveReading = async () => {
    if (!formData.dma || !formData.inlet || !formData.meterReading) {
      showSnackbar('Please fill all required fields', 'error');
      return;
    }

    const readingData = {
      ...formData,
      dmaId: dmaConfigs[formData.dma]?.id,
      meterReading: parseFloat(formData.meterReading),
      gps: gps.lat && gps.lng ? { lat: gps.lat, lng: gps.lng } : null,
      photo: photo,
      timestamp: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0],
      synced: false
    };

    const id = Date.now().toString();
    await localforage.setItem(id, readingData);

    showSnackbar(offline ? 'Saved offline - will sync when online' : 'Saved locally');
    
    // Reset form
    setFormData({ dma: '', inlet: '', size: '', meterReading: '', notes: '' });
    setGps({ lat: null, lng: null, accuracy: null, loading: false });
    setPhoto(null);
    
    loadSavedReadings();

    if (!offline) {
      syncWithServer();
    }
  };

  // Sync with server
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

    const API_URL = 'http://192.168.1.216:8000/api';
    let successCount = 0;

    for (const reading of unsynced) {
      try {
        let dmaId = 'DMA-2019';
        if (reading.dma === 'Jafar') dmaId = 'DMA-JFR';
        if (reading.dma === 'Yeka') dmaId = 'DMA-YKA';

       const response = await axios.post(`${API_URL}/bulk-readings`, {
        dmaId: dmaId,
        pointName: reading.inlet,  // ← Changed from inletName
        meterReading: parseFloat(reading.meterReading) || 0,
       size: reading.size || 'Unknown',
        notes: reading.notes || '',
        latitude: reading.gps?.lat || null,
        longitude: reading.gps?.lng || null,
        timestamp: reading.timestamp || new Date().toISOString(),
        date: reading.date || new Date().toISOString().split('T')[0],
        pointType: reading.isOutlet ? 'outlet' : 'inlet'  // ← Add this
      });

        if (response.status === 201) {
          const updated = { ...reading, synced: true };
          await localforage.setItem(reading.id, updated);
          successCount++;
        }
      } catch (error) {
        console.error('Sync failed:', error);
      }
    }

    setSyncing(false);
    await loadSavedReadings();
    showSnackbar(`Synced ${successCount} of ${unsynced.length} readings`);
  };

  // Render capture screen
  const renderCaptureScreen = () => (
    <Box sx={{ p: 2 }}>
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
        <Alert severity="success" sx={{ mb: 2 }}>
          📍 GPS Locked
        </Alert>
      )}
      {photo && (
        <Alert severity="success" sx={{ mb: 2 }}>
          📸 Photo captured
        </Alert>
      )}

      {/* Save Button */}
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

  // Render history screen
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
          {syncing ? 'Syncing...' : 'Sync'}
        </Button>
      </Box>

      {savedReadings.length === 0 ? (
        <Alert severity="info">No readings saved</Alert>
      ) : (
        savedReadings.map((reading) => (
          <Card key={reading.id} sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="subtitle2">
                {reading.dma} - {reading.inlet}
              </Typography>
              <Typography variant="body2">
                Reading: {reading.meterReading} m³
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {new Date(reading.timestamp).toLocaleString()}
              </Typography>
              {!reading.synced && (
                <Chip
                  size="small"
                  label="Pending"
                  color="warning"
                  sx={{ mt: 1 }}
                />
              )}
            </CardContent>
          </Card>
        ))
      )}
    </Box>
  );

  // Main render
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ pb: 7, minHeight: '100vh', bgcolor: '#f5f5f5' }}>
        <AppBar position="sticky">
          <Toolbar>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              📱 Bulk Meter
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