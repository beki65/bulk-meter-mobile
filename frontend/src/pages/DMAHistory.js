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
  Close as CloseIcon,
  Analytics as AnalyticsIcon
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
import DMAConsumptionAnalytics from '../components/DMAConsumptionAnalytics';

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
      { name: 'Inlet 2', flowRate: null, status: 'unknown', lastReading: null },
      { name: 'Inlet 3', flowRate: null, status: 'unknown', lastReading: null}
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

const API_URL = 'http://192.168.1.115:8000/api';

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
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  // Fetch live data from backend
  useEffect(() => {
    fetchDMAData();
    const interval = setInterval(fetchDMAData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Add debug log
  console.log('🔄 Component State:', {
    viewMode,
    dmaZonesCount: dmaData.zones?.length,
    selectedDMA: selectedDMA?.name,
    detailsOpen,
    analyticsOpen
  });

  const fetchDMAData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/dma/history`);
      console.log('📊 DMA History Response:', response.data);
      
      const readingsResponse = await axios.get(`${API_URL}/bulk-readings`);
      console.log('📊 All Readings Response:', readingsResponse.data);
      
      const latestReadings = {};
      readingsResponse.data.forEach(reading => {
        const key = `${reading.dmaId}-${reading.pointName}`;
        if (!latestReadings[key] || new Date(reading.timestamp) > new Date(latestReadings[key].timestamp)) {
          latestReadings[key] = {
            value: reading.meterReading,
            timestamp: reading.timestamp,
            type: reading.pointType || 'inlet'
          };
        }
      });
      
      if (response.data && response.data.zones) {
        const updatedZones = DEFAULT_DMAS.map(defaultZone => {
          const updatedInlets = defaultZone.inlets.map(inlet => {
            const key = `${defaultZone.id}-${inlet.name}`;
            const reading = latestReadings[key];
            return {
              ...inlet,
              lastReading: reading || null,
              status: reading ? 'active' : 'pending'
            };
          });

          const updatedOutlets = defaultZone.outlets.map(outlet => {
            const key = `${defaultZone.id}-${outlet.name}`;
            const reading = latestReadings[key];
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

  const handleShowChart = (pointName, pointType) => {
    setChartPoint({ name: pointName, type: pointType });
    setChartOpen(true);
  };

  const handleShowMonthly = (pointName, pointType) => {
    setChartPoint({ name: pointName, type: pointType });
    setMonthlyOpen(true);
  };

  const handleViewCustomer = (customerId) => {
    setSelectedCustomerId(customerId);
    setCustomerHistoryOpen(true);
  };

  const getZoneNotes = (zoneId) => {
    return notes[zoneId] || [];
  };

  const renderCards = () => (
    <Grid container spacing={3}>
      {dmaData.zones.map((zone) => {
        console.log(`🎴 Rendering card for ${zone.name}`);
        return (
          <Grid item xs={12} md={6} lg={4} key={zone.id}>
            <Card sx={{ 
              borderLeft: 6, 
              borderColor: zone.color,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              minHeight: 450,
              boxShadow: 3
            }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h5" gutterBottom>{zone.name}</Typography>
                <Chip label={zone.id} size="small" sx={{ bgcolor: zone.color, color: 'white', mb: 2 }} />
                
                <Typography variant="subtitle2" sx={{ mt: 2, fontWeight: 'bold' }}>
                  Inlets ({zone.inlets.length})
                </Typography>
                {zone.inlets.map((inlet, i) => (
                  <Box key={i} sx={{ ml: 2, mb: 1, p: 1, bgcolor: '#f8f9fa', borderRadius: 1 }}>
                    <Typography variant="body2">{inlet.name}</Typography>
                    <Typography variant="caption" color={inlet.lastReading ? 'success.main' : 'textSecondary'}>
                      {inlet.lastReading ? `Last: ${inlet.lastReading.value} m³` : 'No readings yet'}
                    </Typography>
                  </Box>
                ))}
                
                <Typography variant="subtitle2" sx={{ mt: 2, fontWeight: 'bold' }}>
                  Outlets ({zone.outlets.length})
                </Typography>
                {zone.outlets.length > 0 ? zone.outlets.map((outlet, i) => (
                  <Box key={i} sx={{ ml: 2, mb: 1, p: 1, bgcolor: '#f8f9fa', borderRadius: 1 }}>
                    <Typography variant="body2">{outlet.name}</Typography>
                    <Typography variant="caption" color={outlet.lastReading ? 'success.main' : 'textSecondary'}>
                      {outlet.lastReading ? `Last: ${outlet.lastReading.value} m³` : 'No readings yet'}
                    </Typography>
                  </Box>
                )) : (
                  <Typography variant="caption" sx={{ ml: 2, color: 'textSecondary' }}>
                    No outlets configured
                  </Typography>
                )}
              </CardContent>
              
              {/* BUTTON SECTION */}
              <Box sx={{ 
                p: 2, 
                backgroundColor: '#FFD700',
                borderTop: '4px solid #FF0000',
                display: 'flex', 
                gap: 1,
                boxShadow: '0 -4px 10px rgba(0,0,0,0.1)'
              }}>
                <Button 
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={() => {
                    console.log('🔵 DETAILS CLICKED:', zone.name);
                    setSelectedDMA(zone);
                    setDetailsOpen(true);
                  }}
                  sx={{ 
                    bgcolor: zone.color,
                    color: 'white',
                    py: 1.5,
                    fontSize: '1rem',
                    fontWeight: 'bold'
                  }}
                >
                  DETAILS
                </Button>
                <Button 
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={() => {
                    console.log('📊 ANALYTICS CLICKED:', zone.name);
                    setSelectedDMA(zone);
                    setAnalyticsOpen(true);
                  }}
                  sx={{ 
                    bgcolor: '#4CAF50',
                    color: 'white',
                    py: 1.5,
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    '&:hover': {
                      bgcolor: '#45a049'
                    }
                  }}
                >
                  ANALYTICS
                </Button>
              </Box>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );

  return (
    <Box sx={{ 
      minHeight: "100vh",
      overflow: 'auto',
      bgcolor: '#f5f5f5',
      p: 3
    }}>
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

      {viewMode === 'cards' && renderCards()}
      {viewMode === 'map' && <DMAMap />}
      {viewMode === 'nrw' && (
        <NRWCalculator onViewCustomer={handleViewCustomer} />
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
            <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
              <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
                <Tab label="Inlets/Outlets" />
                <Tab label="Notes" />
              </Tabs>
            </Box>
            <DialogContent dividers>
              {activeTab === 0 && (
                <>
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
                </>
              )}
              
              {activeTab === 1 && (
                <Paper sx={{ p: 3 }}>
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
              )}
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
              <Button onClick={() => setDetailsOpen(false)} size="large">Close</Button>
              <Button 
                variant="contained" 
                onClick={() => setNoteDialog(true)}
                size="large"
                sx={{ bgcolor: selectedDMA.color }}
              >
                Add Note
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Analytics Dialog */}
      <Dialog open={analyticsOpen} onClose={() => setAnalyticsOpen(false)} maxWidth="xl" fullWidth>
        <DialogTitle sx={{ bgcolor: '#f5f5f5' }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h4">
              <AnalyticsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Consumption Analytics: {selectedDMA?.name}
            </Typography>
            <IconButton onClick={() => setAnalyticsOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedDMA && (
            <DMAConsumptionAnalytics 
              dmaList={[selectedDMA]} 
              selectedDMAId={selectedDMA.id}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAnalyticsOpen(false)}>Close</Button>
        </DialogActions>
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