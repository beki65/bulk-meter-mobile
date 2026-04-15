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
  LinearProgress,
  Grid
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
  NetworkCheck as NetworkIcon
} from '@mui/icons-material';
import localforage from 'localforage';
import { Camera } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { db } from './firebase';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  deleteDoc, 
  doc,
  updateDoc,
  getDocs,
  writeBatch
} from 'firebase/firestore';

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
  const [syncingFirestore, setSyncingFirestore] = useState(false);

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

  // Load saved readings from Firestore (real-time)
  useEffect(() => {
    const q = query(collection(db, 'readings'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const readings = [];
      snapshot.forEach((doc) => {
        readings.push({ id: doc.id, ...doc.data() });
      });
      setSavedReadings(readings);
      // Also save to localforage for offline access
      readings.forEach(async (reading) => {
        await localforage.setItem(reading.id, reading);
      });
    }, (error) => {
      console.error('Firestore listener error:', error);
      // Fallback to localforage if offline
      loadLocalReadings();
    });
    
    return () => unsubscribe();
  }, []);

  const loadLocalReadings = async () => {
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
      dmaId: dmaConfigs[formData.dma]?.id,
      dmaName: formData.dma,
      pointName: formData.inlet,
      pointType: isOutlet ? 'outlet' : 'inlet',
      meterReading: parseFloat(formData.meterReading),
      size: formData.size,
      notes: formData.notes,
      gps: gps.lat && gps.lng ? { lat: gps.lat, lng: gps.lng, accuracy: gps.accuracy } : null,
      photo: photo,
      timestamp: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0],
      syncedToCloud: !offline,
      syncedAt: offline ? null : new Date().toISOString()
    };

    try {
      // Save to Firestore (cloud)
      const docRef = await addDoc(collection(db, 'readings'), readingData);
      // Also save locally
      await localforage.setItem(docRef.id, { ...readingData, id: docRef.id });
      showSnackbar('Reading saved and synced to cloud!');
      
      // Reset form
      setFormData({ dma: '', inlet: '', size: '', meterReading: '', notes: '' });
      setGps({ lat: null, lng: null, accuracy: null, loading: false });
      setPhoto(null);
      
    } catch (error) {
      console.error('Save to Firestore failed:', error);
      // Save locally only
      const localId = Date.now().toString();
      await localforage.setItem(localId, { ...readingData, id: localId, syncedToCloud: false });
      showSnackbar('Saved offline - will sync when online', 'warning');
      
      setFormData({ dma: '', inlet: '', size: '', meterReading: '', notes: '' });
      setGps({ lat: null, lng: null, accuracy: null, loading: false });
      setPhoto(null);
      loadLocalReadings();
    }
  };

  const syncOfflineReadings = async () => {
    setSyncingFirestore(true);
    const offlineReadings = [];
    
    await localforage.iterate((value, key) => {
      if (!value.syncedToCloud && value.timestamp) {
        offlineReadings.push({ id: key, ...value });
      }
    });
    
    let successCount = 0;
    
    for (const reading of offlineReadings) {
      try {
        const { id, ...readingData } = reading;
        await addDoc(collection(db, 'readings'), {
          ...readingData,
          syncedToCloud: true,
          syncedAt: new Date().toISOString()
        });
        await localforage.removeItem(id);
        successCount++;
      } catch (error) {
        console.error('Failed to sync:', error);
      }
    }
    
    setSyncingFirestore(false);
    if (successCount > 0) {
      showSnackbar(`Synced ${successCount} offline readings to cloud`);
    }
  };

  const deleteReading = async (id) => {
    try {
      // Delete from Firestore
      await deleteDoc(doc(db, 'readings', id));
      // Delete from local storage
      await localforage.removeItem(id);
      showSnackbar('Reading deleted');
    } catch (error) {
      console.error('Delete failed:', error);
      // If online delete fails, mark for deletion locally
      await localforage.removeItem(id);
      showSnackbar('Reading deleted locally', 'warning');
    }
  };

  // Sync offline readings when back online
  useEffect(() => {
    if (!offline) {
      syncOfflineReadings();
    }
  }, [offline]);

  const renderCaptureScreen = () => (
    <Box sx={{ p: 2 }}>
      <Paper sx={{ p: 1, mb: 2, bgcolor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box display="flex" alignItems="center">
          <NetworkIcon sx={{ mr: 1, color: offline ? 'error.main' : 'success.main' }} />
          <Typography variant="caption">
            {offline ? 'Offline Mode' : 'Cloud Connected'}
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
        <Typography variant="h6">Readings</Typography>
        {syncingFirestore && <CircularProgress size={20} />}
      </Box>

      {savedReadings.length === 0 ? (
        <Alert severity="info">No readings saved</Alert>
      ) : (
        savedReadings.map((reading) => (
          <Card key={reading.id} sx={{ mb: 2 }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between">
                <Box>
                  <Typography variant="subtitle2">
                    {reading.dmaName || reading.dma} - {reading.pointName}
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
                <IconButton size="small" onClick={() => deleteReading(reading.id)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
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
              <Badge color="primary" variant="dot" invisible={savedReadings.length === 0}>
                <HistoryIcon />
              </Badge>
            }
          />
        </BottomNavigation>

        {/* Settings Dialog */}
        <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Settings</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Data is synced to Firebase Cloud
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Total Readings: {savedReadings.length}
            </Typography>
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="caption">
                💡 Readings are saved to Firebase Firestore<br/>
                Works offline, syncs automatically when online
              </Typography>
            </Alert>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSettingsOpen(false)}>Close</Button>
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