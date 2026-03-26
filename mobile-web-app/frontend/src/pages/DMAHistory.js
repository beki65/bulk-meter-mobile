import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Grid, Card, CardContent, Chip,
  Tabs, Tab, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Alert, Snackbar, IconButton, Tooltip,
  CircularProgress, Divider
} from '@mui/material';
import {
  Map as MapIcon,
  ViewModule as ViewModuleIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  ArrowUpward as InletIcon,
  ArrowDownward as OutletIcon,
  WaterDrop as NRWIcon,
  People as CustomersIcon,
  Info as AboutIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import DMAMap from '../components/DMAMap';
import DMAInlets from '../components/DMAInlets';
import axios from 'axios';
import DMAOutlets from '../components/DMAOutlets';
import DMACharts from '../components/DMACharts';
import MonthlyConsumption from '../components/MonthlyConsumption';
import NRWCalculator from '../components/NRWCalculator';
import CustomerHistory from '../components/CustomerHistory';
import About from '../components/About';

// Default DMAs (used as fallback)
const DEFAULT_DMAS = [
  {
    id: 'DMA-JFR',
    name: 'Jafar DMA',
    inlets: [
      { name: 'Bulk Didly', flowRate: null, status: 'pending', lastReading: null },
      { name: 'Shemachoch', flowRate: null, status: 'pending', lastReading: null }
    ],
    outlets: [
      { name: 'Tel', flowRate: null, status: 'pending', lastReading: null }
    ],
    totalConnections: null,
    activeMeters: null,
    pressure: null,
    efficiency: null,
    status: 'pending',
    color: '#FF6B6B'
  },
  {
    id: 'DMA-YKA',
    name: 'Yeka DMA',
    inlets: [
      { name: 'Misrak', flowRate: null, status: 'pending', lastReading: null },
      { name: 'English', flowRate: null, status: 'pending', lastReading: null },
      { name: 'Wubet', flowRate: null, status: 'pending', lastReading: null }
    ],
    outlets: [],
    totalConnections: null,
    activeMeters: null,
    pressure: null,
    efficiency: null,
    status: 'pending',
    color: '#4ECDC4'
  },
  {
    id: 'DMA-2019',
    name: '2019 DMA',
    inlets: [
      { name: 'Inlet 1', flowRate: null, status: 'unknown', lastReading: null },
      { name: 'Inlet 2', flowRate: null, status: 'unknown', lastReading: null }
    ],
    outlets: [],
    totalConnections: null,
    activeMeters: null,
    pressure: null,
    efficiency: null,
    status: 'unknown',
    notes: 'Data pending - survey required',
    color: '#95A5A6'
  }
];

<<<<<<< HEAD
const API_URL = 'http://192.168.1.111:8000/api';
=======
const API_URL = 'http://192.168.1.16:8000/api';
>>>>>>> b7cd2bc2a082bb0d8ea2e81b00a2c10d5dae25eb

export default function DMAHistory() {
  const [viewMode, setViewMode] = useState('cards');
  const [dmaData, setDmaData] = useState({ zones: DEFAULT_DMAS });
  const [selectedDMA, setSelectedDMA] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [noteDialog, setNoteDialog] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [notes, setNotes] = useState({});
  const [chartOpen, setChartOpen] = useState(false);
  const [monthlyOpen, setMonthlyOpen] = useState(false);
  const [chartPoint, setChartPoint] = useState({ name: '', type: '' });
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [customerHistoryOpen, setCustomerHistoryOpen] = useState(false);
  const [nrwOpen, setNrwOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  // Fetch live data from backend
  useEffect(() => {
    fetchDMAData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchDMAData, 30000);
    return () => clearInterval(interval);
  }, []);

<<<<<<< HEAD
  const fetchDMAData = async () => {
    setLoading(true);
    try {
      // Fetch DMA history from backend
      const response = await axios.get(`${API_URL}/dma/history`);
      console.log('📊 Live DMA Data:', response.data);
      
      if (response.data && response.data.zones) {
        // Merge backend data with our default DMAs to preserve colors and structure
        const updatedZones = DEFAULT_DMAS.map(defaultZone => {
          const backendZone = response.data.zones.find(z => z.id === defaultZone.id);
          
          if (backendZone) {
            // Update inlets with last readings
            const updatedInlets = defaultZone.inlets.map(inlet => {
              const backendInlet = backendZone.inlets?.find(i => i.name === inlet.name);
              return {
                ...inlet,
                lastReading: backendInlet?.lastReading || null,
                status: backendInlet?.status || inlet.status,
                flowRate: backendInlet?.flowRate || null
              };
            });

            // Update outlets with last readings
            const updatedOutlets = defaultZone.outlets.map(outlet => {
              const backendOutlet = backendZone.outlets?.find(o => o.name === outlet.name);
              return {
                ...outlet,
                lastReading: backendOutlet?.lastReading || null,
                status: backendOutlet?.status || outlet.status,
                flowRate: backendOutlet?.flowRate || null
              };
            });

            return {
              ...defaultZone,
              inlets: updatedInlets,
              outlets: updatedOutlets,
              status: backendZone.status || defaultZone.status
            };
          }
          return defaultZone;
        });

        setDmaData({ zones: updatedZones });
        setError(null);
      }
    } catch (err) {
      console.error('❌ Failed to fetch DMA data:', err);
      setError('Using offline data - Server connection failed');
    } finally {
      setLoading(false);
    }
  };
=======
 const fetchDMAData = async () => {
  setLoading(true);
  try {
    // Fetch DMA history from backend
    const response = await axios.get(`${API_URL}/dma/history`);
    console.log('📊 DMA History Response:', response.data);
    
    // Fetch ALL readings
    const readingsResponse = await axios.get(`${API_URL}/bulk-readings`);
    console.log('📊 All Readings Response:', readingsResponse.data);
    
    // Create a map of latest readings
    const latestReadings = {};
    readingsResponse.data.forEach(reading => {
      const key = `${reading.dmaId}-${reading.pointName}`;
      console.log(`Processing reading: ${key} = ${reading.meterReading} at ${reading.timestamp}`);
      
      if (!latestReadings[key] || new Date(reading.timestamp) > new Date(latestReadings[key].timestamp)) {
        latestReadings[key] = {
          value: reading.meterReading,
          timestamp: reading.timestamp,
          type: reading.pointType || 'inlet'
        };
      }
    });
    
    console.log('📊 Latest Readings Map:', latestReadings);
    
    // Check specific keys we care about
    console.log('Bulk Didly reading:', latestReadings['DMA-JFR-Bulk Didly']);
    console.log('Tel reading:', latestReadings['DMA-JFR-Tel']);
    
    if (response.data && response.data.zones) {
      const updatedZones = DEFAULT_DMAS.map(defaultZone => {
        console.log(`Processing zone: ${defaultZone.name}`);
        
        const updatedInlets = defaultZone.inlets.map(inlet => {
          const key = `${defaultZone.id}-${inlet.name}`;
          const reading = latestReadings[key];
          console.log(`Inlet ${inlet.name} key: ${key}, reading:`, reading);
          
          return {
            ...inlet,
            lastReading: reading || null,
            status: reading ? 'active' : 'pending'
          };
        });

        const updatedOutlets = defaultZone.outlets.map(outlet => {
          const key = `${defaultZone.id}-${outlet.name}`;
          const reading = latestReadings[key];
          console.log(`Outlet ${outlet.name} key: ${key}, reading:`, reading);
          
          return {
            ...outlet,
            lastReading: reading || null,
            status: reading ? 'active' : 'pending'
          };
        });

        return {
          ...defaultZone,
          inlets: updatedInlets,
          outlets: updatedOutlets
        };
      });

      console.log('📊 Final Updated Zones:', updatedZones);
      setDmaData({ zones: updatedZones });
      setError(null);
    }
  } catch (err) {
    console.error('❌ Failed to fetch DMA data:', err);
    setError('Using offline data - Server connection failed');
  } finally {
    setLoading(false);
  }
};
>>>>>>> b7cd2bc2a082bb0d8ea2e81b00a2c10d5dae25eb

  const handleAddNote = () => {
    if (newNote.trim() && selectedDMA) {
      const updatedNotes = {
        ...notes,
        [selectedDMA.id]: [
          ...(notes[selectedDMA.id] || []),
          {
            date: new Date().toISOString().split('T')[0],
            text: newNote,
            author: 'Current User'
          }
        ]
      };
      setNotes(updatedNotes);
      setNewNote('');
      setNoteDialog(false);
      setSuccess('Note added successfully');
    }
  };

  // Chart handlers
  const handleShowChart = (pointName, pointType) => {
    setChartPoint({ name: pointName, type: pointType });
    setChartOpen(true);
  };

  const handleShowMonthly = (pointName, pointType) => {
    setChartPoint({ name: pointName, type: pointType });
    setMonthlyOpen(true);
  };

  // Customer History handler
  const handleViewCustomer = (customerId) => {
    setSelectedCustomerId(customerId);
    setCustomerHistoryOpen(true);
  };

  const getZoneNotes = (zoneId) => {
    return notes[zoneId] || [];
  };

  const formatLastReading = (lastReading) => {
    if (!lastReading) return null;
    const date = new Date(lastReading.timestamp);
    return `${lastReading.value} m³ at ${date.toLocaleTimeString()}`;
  };

  const renderCards = () => (
    <Grid container spacing={3}>
      {dmaData.zones.map((zone) => (
        <Grid item xs={12} md={6} lg={4} key={zone.id}>
          <Card sx={{ 
            cursor: 'pointer',
            transition: 'transform 0.2s',
            '&:hover': { transform: 'scale(1.02)', boxShadow: 6 },
            borderLeft: 6,
            borderColor: zone.color,
            position: 'relative'
          }}>
            {loading && (
              <Box sx={{ position: 'absolute', top: 10, right: 10 }}>
                <CircularProgress size={20} />
              </Box>
            )}
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  {zone.name}
                </Typography>
                <Chip 
                  label={zone.id} 
                  size="small" 
                  sx={{
                    bgcolor: zone.color,
                    color: 'white',
                    fontWeight: 600
                  }}
                />
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                Inlets/Outlets
              </Typography>
              
              <Grid container spacing={3}>
                {/* Inlets Section */}
                <Grid item xs={6}>
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      p: 2, 
                      bgcolor: '#e3f2fd',
                      borderRadius: 2,
                    }}
                  >
                    <Box display="flex" alignItems="center" mb={1}>
                      <InletIcon sx={{ fontSize: 20, color: '#1976d2', mr: 1 }} />
                      <Typography variant="h6" sx={{ color: '#1976d2' }}>
                        Inlets ({zone.inlets?.length || 0})
                      </Typography>
                    </Box>
                    
                    <Box sx={{ maxHeight: 150, overflow: 'auto' }}>
                      {zone.inlets?.map((inlet, idx) => (
                        <Box key={idx} sx={{ mb: 1.5, p: 1, bgcolor: 'white', borderRadius: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {inlet.name}
                          </Typography>
                          {inlet.lastReading ? (
                            <Typography variant="caption" color="success.main" display="block">
                              Last: {inlet.lastReading.value} m³
                            </Typography>
                          ) : (
                            <Typography variant="caption" color="textSecondary">
                              No data
                            </Typography>
                          )}
                        </Box>
                      ))}
                    </Box>
                  </Paper>
                </Grid>
                
                {/* Outlets Section */}
                <Grid item xs={6}>
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      p: 2, 
                      bgcolor: '#fff3e0',
                      borderRadius: 2,
                    }}
                  >
                    <Box display="flex" alignItems="center" mb={1}>
                      <OutletIcon sx={{ fontSize: 20, color: '#f57c00', mr: 1 }} />
                      <Typography variant="h6" sx={{ color: '#f57c00' }}>
                        Outlets ({zone.outlets?.length || 0})
                      </Typography>
                    </Box>
                    
                    <Box sx={{ maxHeight: 150, overflow: 'auto' }}>
                      {zone.outlets?.map((outlet, idx) => (
                        <Box key={idx} sx={{ mb: 1.5, p: 1, bgcolor: 'white', borderRadius: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {outlet.name}
                          </Typography>
                          {outlet.lastReading ? (
                            <Typography variant="caption" color="success.main" display="block">
                              Last: {outlet.lastReading.value} m³
                            </Typography>
                          ) : (
                            <Typography variant="caption" color="textSecondary">
                              No data
                            </Typography>
                          )}
                        </Box>
                      ))}
                    </Box>
                  </Paper>
                </Grid>
              </Grid>

              {zone.notes && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  {zone.notes}
                </Alert>
              )}

              <Box display="flex" justifyContent="center" mt={3}>
                <Button 
                  variant="contained"
                  startIcon={<InfoIcon />}
                  onClick={() => {
                    setSelectedDMA(zone);
                    setDetailsOpen(true);
                  }}
                  sx={{ 
                    borderRadius: 2,
                    px: 4,
                    bgcolor: zone.color,
                    '&:hover': {
                      bgcolor: zone.color,
                      filter: 'brightness(0.9)'
                    }
                  }}
                >
                  VIEW DETAILS
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h3" sx={{ fontWeight: 700, color: '#1e3a8a' }}>
          Water Utility Dashboard
        </Typography>
        <Box>
          <Tooltip title="Refresh Data">
            <IconButton onClick={fetchDMAData} color="primary" size="large" disabled={loading}>
              {loading ? <CircularProgress size={24} /> : <RefreshIcon />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {error && (
        <Alert severity="warning" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* View Tabs - Updated with new tabs */}
      <Paper sx={{ p: 1, mb: 4 }}>
        <Tabs 
          value={viewMode} 
          onChange={(e, v) => setViewMode(v)}
          centered
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': { fontSize: '1rem', fontWeight: 600 },
            '& .Mui-selected': { color: '#1e3a8a' }
          }}
        >
          <Tab value="cards" label="DMA BULK" icon={<ViewModuleIcon />} iconPosition="start" />
          <Tab value="map" label="MAP VIEW" icon={<MapIcon />} iconPosition="start" />
          <Tab value="nrw" label="NRW CALCULATOR" icon={<NRWIcon />} iconPosition="start" />
          <Tab value="customers" label="CUSTOMERS" icon={<CustomersIcon />} iconPosition="start" />
          <Tab value="about" label="ABOUT" icon={<AboutIcon />} iconPosition="start" />
        </Tabs>
      </Paper>

      {/* Main Content */}
      {viewMode === 'cards' && renderCards()}
      {viewMode === 'map' && <DMAMap />}
      {viewMode === 'nrw' && (
        <NRWCalculator 
          onViewCustomer={handleViewCustomer}
        />
      )}
      {viewMode === 'customers' && (
        <CustomerHistory 
          customerId={selectedCustomerId}
          onClose={() => setSelectedCustomerId(null)}
        />
      )}
      {viewMode === 'about' && <About />}

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="lg" fullWidth>
        {selectedDMA && (
          <>
            <DialogTitle sx={{ bgcolor: '#f5f5f5' }}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h4">{selectedDMA.name}</Typography>
                <Chip 
                  label={selectedDMA.id} 
                  sx={{
                    bgcolor: selectedDMA.color,
                    color: 'white',
                    fontSize: '1rem',
                    p: 2
                  }}
                />
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <DMAInlets 
                dma={selectedDMA} 
                onShowChart={handleShowChart}
                onShowMonthly={handleShowMonthly}
              />
              <Box sx={{ mt: 4 }}>
                <DMAOutlets 
                  outlets={selectedDMA.outlets} 
                  onShowChart={handleShowChart}
                  onShowMonthly={handleShowMonthly}
                />
              </Box>
              
              {/* Notes Section */}
              <Paper sx={{ p: 3, mt: 3 }}>
                <Typography variant="h5" gutterBottom>Notes</Typography>
                {getZoneNotes(selectedDMA.id).map((note, idx) => (
                  <Card key={idx} sx={{ mb: 2, bgcolor: '#f8f9fa' }}>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {note.author}
                        </Typography>
                        <Chip label={note.date} size="small" variant="outlined" />
                      </Box>
                      <Typography variant="body1">{note.text}</Typography>
                    </CardContent>
                  </Card>
                ))}
                {getZoneNotes(selectedDMA.id).length === 0 && (
                  <Typography color="textSecondary" align="center" py={4}>
                    No notes yet. Click "Add Note" to create one.
                  </Typography>
                )}
              </Paper>
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
              <Button onClick={() => setDetailsOpen(false)} size="large">Close</Button>
              <Button 
                variant="contained" 
                onClick={() => {
                  setDetailsOpen(false);
                  setNoteDialog(true);
                }}
                size="large"
                sx={{ bgcolor: selectedDMA.color }}
              >
                Add Note
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Historical Chart Dialog */}
      <Dialog open={chartOpen} onClose={() => setChartOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h5">
              📈 Historical Readings: {chartPoint.name}
              {chartPoint.type && (
                <Chip
                  label={chartPoint.type}
                  size="small"
                  color={chartPoint.type === 'inlet' ? 'primary' : 'warning'}
                  sx={{ ml: 2 }}
                />
              )}
            </Typography>
            <IconButton onClick={() => setChartOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedDMA && (
            <DMACharts
              dmaId={selectedDMA.id}
              pointName={chartPoint.name}
              pointType={chartPoint.type}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Monthly Consumption Dialog */}
      <Dialog open={monthlyOpen} onClose={() => setMonthlyOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h5">
              📊 Monthly Consumption (Pro-rated): {chartPoint.name}
              {chartPoint.type && (
                <Chip
                  label={chartPoint.type}
                  size="small"
                  color={chartPoint.type === 'inlet' ? 'primary' : 'warning'}
                  sx={{ ml: 2 }}
                />
              )}
            </Typography>
            <IconButton onClick={() => setMonthlyOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedDMA && (
            <MonthlyConsumption
              dmaId={selectedDMA.id}
              pointName={chartPoint.name}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Add Note Dialog */}
      <Dialog open={noteDialog} onClose={() => setNoteDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Note for {selectedDMA?.name}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Note"
            fullWidth
            multiline
            rows={4}
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Enter your note here..."
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNoteDialog(false)}>Cancel</Button>
          <Button onClick={handleAddNote} variant="contained">Add Note</Button>
        </DialogActions>
      </Dialog>

      {/* NRW Calculator Dialog */}
      <Dialog open={nrwOpen} onClose={() => setNrwOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h5">💧 NRW Calculator</Typography>
            <IconButton onClick={() => setNrwOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <NRWCalculator onViewCustomer={handleViewCustomer} />
        </DialogContent>
      </Dialog>

      {/* Customer History Dialog */}
      <Dialog open={customerHistoryOpen} onClose={() => setCustomerHistoryOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h5">👤 Customer History</Typography>
            <IconButton onClick={() => setCustomerHistoryOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <CustomerHistory 
            customerId={selectedCustomerId}
            onClose={() => setCustomerHistoryOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* About Dialog */}
      <Dialog open={aboutOpen} onClose={() => setAboutOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h5">ℹ️ About</Typography>
            <IconButton onClick={() => setAboutOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <About />
        </DialogContent>
      </Dialog>

      {/* Notifications */}
      <Snackbar open={!!success} autoHideDuration={3000} onClose={() => setSuccess(null)}>
        <Alert severity="success" variant="filled">{success}</Alert>
      </Snackbar>
    </Box>
  );
}