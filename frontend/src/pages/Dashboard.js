import React, { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Avatar,
  LinearProgress,
  Chip,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import RefreshIcon from '@mui/icons-material/Refresh';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import PeopleIcon from '@mui/icons-material/People';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import WarningIcon from '@mui/icons-material/Warning';
import DashboardIcon from '@mui/icons-material/Dashboard';
import MapIcon from '@mui/icons-material/Map';
import CalculateIcon from '@mui/icons-material/Calculate';
import InfoIcon from '@mui/icons-material/Info';
import LeakAddIcon from '@mui/icons-material/LeakAdd';
import BiotechIcon from '@mui/icons-material/Biotech';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import TimelineIcon from '@mui/icons-material/Timeline';
import { dmaAPI, nrwAPI, analyticsAPI } from '../services/api';
import HistoricalDataChart from '../components/HistoricalDataChart';
import DMAMap from '../components/DMAMap';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dmaData, setDmaData] = useState(null);
  const [nrwData, setNrwData] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [selectedParent, setSelectedParent] = useState('adma');
  const [selectedChild, setSelectedChild] = useState('bulk');
  const [nrwInput, setNrwInput] = useState({ systemInput: 950000, billedConsumption: 775000 });
  const [customerSearch, setCustomerSearch] = useState('');
  
  // History dialog state
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState(null);

  // Menu items for left navigation
 const menuItems = [
  {
    id: 'adma',
    label: "DMA's",
    icon: <WaterDropIcon />,
    color: '#1976d2',
    children: [
      { id: 'bulk', label: 'DMA BULK', icon: <DashboardIcon /> },
      { id: 'map', label: 'MAP VIEW', icon: <MapIcon /> },
      { id: 'nrw', label: 'NRW CALCULATOR', icon: <CalculateIcon /> },
      { id: 'customers', label: 'CUSTOMERS', icon: <PeopleIcon /> },
      { id: 'about', label: 'ABOUT', icon: <InfoIcon /> }
    ]
  },
  {
    id: 'leaks',
    label: "Leaks Location",
    icon: <LeakAddIcon />,
    color: '#d32f2f',
    children: [
      { id: 'leaks-map', label: 'Leaks Mapping', icon: <LocationOnIcon /> },
      { id: 'leaks-calculation', label: 'Leaks Calculation', icon: <CalculateIcon /> },
      { id: 'leaks-progress', label: 'MLWR Progress', icon: <TimelineIcon /> }
    ]
  },
  {
    id: 'contamination',
    label: "Contamination",
    icon: <BiotechIcon />,
    color: '#ed6c02',
    children: [
      { id: 'contamination-map', label: 'Location/Mapping', icon: <LocationOnIcon /> },
      { id: 'contamination-reason', label: 'Reason of Contamination', icon: <InfoIcon /> },
      { id: 'contamination-progress', label: 'MLWR Progress', icon: <TimelineIcon /> }
    ]
  }
  ];

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch real data from backend - NO MOCK DATA
      const [dmaResponse, nrwResponse, analyticsResponse] = await Promise.all([
        dmaAPI.getHistory(),
        nrwAPI.calculate(nrwInput),
        analyticsAPI.getOverview()
      ]);
      
      setDmaData(dmaResponse.data);
      setNrwData(nrwResponse.data);
      setAnalytics(analyticsResponse.data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError('Failed to connect to backend. Make sure it\'s running on port 8000');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Calculate totals from real data
  const totalConnections = dmaData?.zones?.reduce((acc, zone) => acc + (zone.totalConnections || 0), 0) || 0;
  const activeMeters = dmaData?.zones?.reduce((acc, zone) => acc + (zone.activeMeters || 0), 0) || 0;
  
  const nrwComponents = nrwData?.components ? [
    { name: 'Leaks', value: nrwData.components.leaks },
    { name: 'Meter Errors', value: nrwData.components.meterInaccuracies },
    { name: 'Unauthorized', value: nrwData.components.unauthorizedConsumption },
    { name: 'Bursts', value: nrwData.components.bursts },
  ] : [];

  const formatLastReading = (lastReading) => {
    if (!lastReading) return 'No data';
    const date = new Date(lastReading.timestamp);
    return `Last: ${lastReading.value} m³ at ${date.toLocaleTimeString()}`;
  };

  // DMA Bulk Content with real data only
  const renderDMABulk = () => {
    if (!dmaData?.zones || dmaData.zones.length === 0) {
      return (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="textSecondary">
            No DMA data available. Please check backend connection.
          </Typography>
        </Paper>
      );
    }

    return (
      <Box>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: '#1e3a8a', mb: 3 }}>
          DMA Zones
        </Typography>
        
        {/* KPI Cards - Only show if data exists */}
        {(totalConnections > 0 || activeMeters > 0) && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {totalConnections > 0 && (
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="body2" sx={{ opacity: 0.8 }}>Total Connections</Typography>
                        <Typography variant="h4" sx={{ fontWeight: 600, mt: 1 }}>
                          {totalConnections.toLocaleString()}
                        </Typography>
                      </Box>
                      <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                        <PeopleIcon />
                      </Avatar>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            )}

            {activeMeters > 0 && (
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%)', color: 'white' }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="body2" sx={{ opacity: 0.8 }}>Active Meters</Typography>
                        <Typography variant="h4" sx={{ fontWeight: 600, mt: 1 }}>
                          {activeMeters.toLocaleString()}
                        </Typography>
                      </Box>
                      <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                        <WaterDropIcon />
                      </Avatar>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            )}

            {nrwData?.nrwPercentage && (
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="body2" sx={{ opacity: 0.8 }}>NRW Percentage</Typography>
                        <Typography variant="h4" sx={{ fontWeight: 600, mt: 1 }}>
                          {nrwData.nrwPercentage}%
                        </Typography>
                      </Box>
                      <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                        <WarningIcon />
                      </Avatar>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            )}

            {nrwData?.financial?.totalLossValue && (
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="body2" sx={{ opacity: 0.8 }}>Financial Loss</Typography>
                        <Typography variant="h4" sx={{ fontWeight: 600, mt: 1 }}>
                          ${parseInt(nrwData.financial.totalLossValue).toLocaleString()}
                        </Typography>
                      </Box>
                      <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                        <TrendingDownIcon />
                      </Avatar>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        )}

        {/* DMA Zone Cards with real inlet/outlet data */}
        <Grid container spacing={3}>
          {dmaData.zones.map((zone, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card sx={{ 
                borderLeft: 6, 
                borderColor: index === 0 ? '#FF6B6B' : index === 1 ? '#4ECDC4' : '#95A5A6',
                height: '100%'
              }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h5" sx={{ fontWeight: 600 }}>{zone.name}</Typography>
                    <Chip 
                      label={zone.id} 
                      size="small" 
                      sx={{
                        bgcolor: index === 0 ? '#FF6B6B' : index === 1 ? '#4ECDC4' : '#95A5A6',
                        color: 'white',
                        fontWeight: 600
                      }}
                    />
                  </Box>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  {/* Inlets Section */}
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, color: '#1976d2' }}>
                    Inlets ({zone.inlets?.length || 0})
                  </Typography>
                  
                  {zone.inlets?.map((inlet, i) => (
                    <Card key={i} variant="outlined" sx={{ 
                      mb: 2, 
                      borderLeft: 4, 
                      borderColor: '#1976d2',
                      bgcolor: inlet.lastReading ? '#f8f9fa' : '#fff'
                    }}>
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              {inlet.name}
                            </Typography>
                            {inlet.lastReading ? (
                              <Box mt={0.5}>
                                <Chip 
                                  size="small"
                                  label="LIVE"
                                  color="success"
                                  sx={{ mr: 1, height: 20 }}
                                />
                                <Typography variant="caption" color="success.main">
                                  Last: {inlet.lastReading.value} m³
                                </Typography>
                              </Box>
                            ) : (
                              <Typography variant="caption" color="textSecondary">
                                No readings yet
                              </Typography>
                            )}
                          </Box>
                          <Box>
                            <Button 
                              size="small" 
                              variant="text"
                              sx={{ minWidth: 'auto', mr: 0.5 }}
                              onClick={() => {
                                setSelectedPoint({ 
                                  dmaId: zone.id, 
                                  pointName: inlet.name, 
                                  pointType: 'inlet' 
                                });
                                setHistoryDialogOpen(true);
                              }}
                            >
                              HISTORY
                            </Button>
                            <Button 
                              size="small" 
                              variant="outlined"
                              sx={{ minWidth: 'auto' }}
                            >
                              MANUAL
                            </Button>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}

                  {/* Outlets Section */}
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, color: '#f57c00', mt: 3 }}>
                    Outlets ({zone.outlets?.length || 0})
                  </Typography>
                  
                  {zone.outlets?.map((outlet, i) => (
                    <Card key={i} variant="outlined" sx={{ 
                      mb: 2, 
                      borderLeft: 4, 
                      borderColor: '#f57c00',
                      bgcolor: outlet.lastReading ? '#f8f9fa' : '#fff'
                    }}>
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              {outlet.name}
                            </Typography>
                            {outlet.lastReading ? (
                              <Box mt={0.5}>
                                <Chip 
                                  size="small"
                                  label="LIVE"
                                  color="success"
                                  sx={{ mr: 1, height: 20 }}
                                />
                                <Typography variant="caption" color="success.main">
                                  Last: {outlet.lastReading.value} m³
                                </Typography>
                              </Box>
                            ) : (
                              <Typography variant="caption" color="textSecondary">
                                No readings yet
                              </Typography>
                            )}
                          </Box>
                          <Box>
                            <Button 
                              size="small" 
                              variant="text"
                              sx={{ minWidth: 'auto', mr: 0.5 }}
                              onClick={() => {
                                setSelectedPoint({ 
                                  dmaId: zone.id, 
                                  pointName: outlet.name, 
                                  pointType: 'outlet' 
                                });
                                setHistoryDialogOpen(true);
                              }}
                            >
                              HISTORY
                            </Button>
                            <Button 
                              size="small" 
                              variant="outlined"
                              sx={{ minWidth: 'auto' }}
                            >
                              MANUAL
                            </Button>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}

                  {/* If no outlets */}
                  {(!zone.outlets || zone.outlets.length === 0) && (
                    <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 1, mb: 2 }}>
                      No outlets configured
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Charts - Only show if history data exists */}
        {dmaData?.history && dmaData.history.length > 0 && (
          <Grid container spacing={3} sx={{ mt: 4 }}>
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  Consumption & Losses Trend
                </Typography>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={dmaData.history}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="consumption" 
                      stroke="#8884d8" 
                      strokeWidth={3}
                      name="Consumption (m³)"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="losses" 
                      stroke="#ff7300" 
                      strokeWidth={3}
                      name="Losses (m³)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>

            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  NRW Composition
                </Typography>
                {nrwComponents.length > 0 ? (
                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                      <Pie
                        data={nrwComponents}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {nrwComponents.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Typography color="textSecondary" align="center" py={4}>
                    No NRW data available
                  </Typography>
                )}
              </Paper>
            </Grid>
          </Grid>
        )}
      </Box>
    );
  };
// About
    const renderAbout = () => (
   <Paper sx={{ p: 3 }}>
    <Typography variant="h4" gutterBottom sx={{ color: '#1976d2', fontWeight: 600 }}>
      Water Utility Management System
    </Typography>
    <Typography variant="h6" gutterBottom>Version 1.0.0</Typography>
    <Divider sx={{ my: 2 }} />
    <Typography variant="body1" paragraph>
      Enterprise Grade Water Distribution Management System designed to monitor and manage DMA zones,
      track consumption, detect leaks, and calculate Non-Revenue Water (NRW).
    </Typography>
    <Typography variant="body2" color="textSecondary">
      © 2026 Water Utility. All rights reserved@bekaman.
    </Typography>
  </Paper>
);
  // NRW Calculator
  const renderNRWCalculator = () => (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom sx={{ color: '#1976d2', fontWeight: 600 }}>
        NRW Calculator
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="System Input (m³)"
            type="number"
            value={nrwInput.systemInput}
            onChange={(e) => setNrwInput({...nrwInput, systemInput: e.target.value})}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Billed Consumption (m³)"
            type="number"
            value={nrwInput.billedConsumption}
            onChange={(e) => setNrwInput({...nrwInput, billedConsumption: e.target.value})}
            margin="normal"
          />
          <Button 
            variant="contained" 
            onClick={() => fetchData()}
            sx={{ mt: 2 }}
          >
            Calculate NRW
          </Button>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 2, bgcolor: '#f5f5f5' }}>
            <Typography variant="h6">Results</Typography>
            {nrwData ? (
              <>
                <Typography>NRW Percentage: <strong>{nrwData.nrwPercentage || 0}%</strong></Typography>
                <Typography>Volume Lost: <strong>{(nrwData.nrwVolume || 0).toLocaleString()} m³</strong></Typography>
                <Typography>Financial Loss: <strong>${(nrwData.financial?.totalLossValue || 0).toLocaleString()}</strong></Typography>
              </>
            ) : (
              <Typography color="textSecondary">No data available</Typography>
            )}
          </Card>
        </Grid>
      </Grid>
    </Paper>
  );

  // Customers
  const renderCustomers = () => (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom sx={{ color: '#1976d2', fontWeight: 600 }}>
        Customer Management
      </Typography>
      <TextField
        fullWidth
        label="Search Customer by ID or Name"
        value={customerSearch}
        onChange={(e) => setCustomerSearch(e.target.value)}
        margin="normal"
      />
      <TableContainer component={Paper} sx={{ mt: 3 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#1976d2' }}>
              <TableCell sx={{ color: 'white' }}>Customer ID</TableCell>
              <TableCell sx={{ color: 'white' }}>Name</TableCell>
              <TableCell sx={{ color: 'white' }}>Meter Number</TableCell>
              <TableCell sx={{ color: 'white' }}>Zone</TableCell>
              <TableCell sx={{ color: 'white' }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {/* This would be populated from real API */}
            <TableRow>
              <TableCell colSpan={5} align="center">
                <Typography color="textSecondary">No customer data available</Typography>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );

  // Map View
 const renderMapView = () => (
  <DMAMap />
  );


  // Leaks Content
  const renderLeaksContent = () => (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom sx={{ color: '#d32f2f', fontWeight: 600 }}>
        Leaks Management
      </Typography>
      <Alert severity="info">
        Leak detection data will appear here once available
      </Alert>
    </Paper>
  );

  // Contamination Content
  const renderContaminationContent = () => (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom sx={{ color: '#ed6c02', fontWeight: 600 }}>
        Contamination Monitoring
      </Typography>
      <Alert severity="info">
        Contamination monitoring data will appear here once available
      </Alert>
    </Paper>
  );

  /// Main render function
const renderContent = () => {
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box textAlign="center" py={4}>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button variant="contained" onClick={fetchData} startIcon={<RefreshIcon />}>
          Retry Connection
        </Button>
      </Box>
    );
  }

  // DMA's children
  if (selectedParent === 'adma') {
    switch(selectedChild) {
      case 'bulk':
        return renderDMABulk();
      case 'map':
        return renderMapView();
      case 'nrw':
        return renderNRWCalculator();
      case 'customers':
        return renderCustomers();
      case 'about':
        return renderAbout();
      default:
        return renderDMABulk();
    }
  }

  // Leaks children
  if (selectedParent === 'leaks') {
    return renderLeaksContent();
  }

  // Contamination children
  if (selectedParent === 'contamination') {
    return renderContaminationContent();
  }

  return null;
};

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      {/* Left Vertical Menu */}
      <Paper sx={{ width: 280, borderRadius: 0, bgcolor: '#1e3a8a', color: 'white' }}>
        <Box sx={{ p: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
            Water Utility
          </Typography>
          <List>
            {menuItems.map((item) => (
              <ListItem key={item.id} disablePadding sx={{ mb: 1 }}>
                <ListItemButton
                  selected={selectedParent === item.id}
                  onClick={() => {
                    setSelectedParent(item.id);
                    setSelectedChild(item.children[0].id);
                  }}
                  sx={{
                    borderRadius: 2,
                    color: 'white',
                    '&.Mui-selected': {
                      bgcolor: item.color,
                    },
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                  }}
                >
                  <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.label} 
                    primaryTypographyProps={{ fontWeight: 500 }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Paper>

      {/* Right Content Area */}
      <Box sx={{ flex: 1, p: 4 }}>
        {/* Top Horizontal Menu */}
        <Paper sx={{ p: 2, mb: 4 }}>
          <Box display="flex" gap={2} flexWrap="wrap">
            {menuItems
              .find(item => item.id === selectedParent)
              ?.children.map((child) => (
                <Button
                  key={child.id}
                  variant={selectedChild === child.id ? "contained" : "outlined"}
                  startIcon={child.icon}
                  onClick={() => setSelectedChild(child.id)}
                  sx={{
                    borderRadius: 2,
                    ...(selectedChild === child.id && {
                      bgcolor: menuItems.find(item => item.id === selectedParent).color,
                      '&:hover': { opacity: 0.9 }
                    })
                  }}
                >
                  {child.label}
                </Button>
              ))}
          </Box>
        </Paper>

        {/* Main Content Area */}
        {renderContent()}

        {/* History Dialog */}
        <Dialog open={historyDialogOpen} onClose={() => setHistoryDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            <Typography variant="h6">
              Historical Readings: {selectedPoint?.pointName}
            </Typography>
          </DialogTitle>
          <DialogContent>
            {selectedPoint && (
              <HistoricalDataChart 
                dmaId={selectedPoint.dmaId}
                pointName={selectedPoint.pointName}
              />
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setHistoryDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
}