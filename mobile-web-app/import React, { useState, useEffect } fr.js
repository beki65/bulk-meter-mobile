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
  TableRow
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

  // Menu items for left navigation
  const menuItems = [
    {
      id: 'adma',
      label: "ADMA's",
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
    },
    {
      id: 'about-main',
      label: "About",
      icon: <InfoIcon />,
      color: '#2e7d32',
      children: [
        { id: 'about-system', label: 'System Info', icon: <InfoIcon /> },
        { id: 'about-docs', label: 'Documentation', icon: <InfoIcon /> },
        { id: 'about-contact', label: 'Contact', icon: <InfoIcon /> }
      ]
    }
  ];

  const fetchData = async () => {
    try {
      setLoading(true);
      
      let dmaResponse, nrwResponse, analyticsResponse;
      
      try {
        dmaResponse = await dmaAPI.getHistory();
      } catch (e) {
        console.log('Using mock DMA data');
        dmaResponse = { data: { 
          zones: [
            { 
              id: 'DMA-JFR', 
              name: 'Jafar DMA', 
              totalConnections: 850, 
              activeMeters: 820, 
              efficiency: 94, 
              inlets: [
                { name: 'Bulk Didly', lastReading: null },
                { name: 'Shemachoch', lastReading: { value: 45667, timestamp: new Date().toISOString() } }
              ], 
              outlets: [
                { name: 'Tel', lastReading: null }
              ] 
            },
            { 
              id: 'DMA-YKA', 
              name: 'Yeka DMA', 
              totalConnections: 1200, 
              activeMeters: 1150, 
              efficiency: 96, 
              inlets: [
                { name: 'Misrak', lastReading: null },
                { name: 'English', lastReading: null },
                { name: 'Wubet', lastReading: null }
              ], 
              outlets: [] 
            },
            { 
              id: 'DMA-2019', 
              name: '2019 DMA', 
              totalConnections: 400, 
              activeMeters: 380, 
              efficiency: 92, 
              inlets: [
                { name: 'Inlet 1', lastReading: null },
                { name: 'Inlet 2', lastReading: null }
              ], 
              outlets: [] 
            }
          ], 
          history: [
            { date: 'Jan', consumption: 45000, losses: 5000 },
            { date: 'Feb', consumption: 47000, losses: 5200 },
            { date: 'Mar', consumption: 49000, losses: 4800 },
            { date: 'Apr', consumption: 52000, losses: 5500 },
            { date: 'May', consumption: 51000, losses: 5300 },
            { date: 'Jun', consumption: 54000, losses: 6000 }
          ] 
        } };
      }
      
      try {
        nrwResponse = await nrwAPI.calculate(nrwInput);
      } catch (e) {
        console.log('Using mock NRW data');
        nrwResponse = { data: { 
          nrwPercentage: 18.5,
          nrwVolume: 175000,
          components: {
            leaks: 70000,
            meterInaccuracies: 52500,
            unauthorizedConsumption: 35000,
            bursts: 17500
          },
          financial: {
            totalLossValue: 148750
          }
        } };
      }
      
      try {
        analyticsResponse = await analyticsAPI.getOverview();
      } catch (e) {
        console.log('Using mock analytics data');
        analyticsResponse = { data: { 
          trends: {
            customers: '+5.2%',
            nrw: '-2.1%'
          }
        } };
      }
      
      setDmaData(dmaResponse.data);
      setNrwData(nrwResponse.data);
      setAnalytics(analyticsResponse.data);
      setError(null);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalConnections = dmaData?.zones?.reduce((acc, zone) => acc + (zone.totalConnections || 0), 0) || 2450;
  const activeMeters = dmaData?.zones?.reduce((acc, zone) => acc + (zone.activeMeters || 0), 0) || 2350;
  
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

  // ADMA Bulk Content
  const renderADMABulk = () => (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: '#1e3a8a', mb: 3 }}>
        DMA Zones
      </Typography>
      
      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
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

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>NRW Percentage</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 600, mt: 1 }}>
                    {nrwData?.nrwPercentage || 0}%
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                  <WarningIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>Financial Loss</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 600, mt: 1 }}>
                    ${parseInt(nrwData?.financial?.totalLossValue || 0).toLocaleString()}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                  <TrendingDownIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* DMA Zone Cards */}
      <Grid container spacing={3}>
        {dmaData?.zones?.map((zone, index) => (
          <Grid item xs={12} md={4} key={index}>
            <Card sx={{ 
              borderLeft: 6, 
              borderColor: index === 0 ? '#FF6B6B' : index === 1 ? '#4ECDC4' : '#95A5A6',
              height: '100%'
            }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>{zone.name}</Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>{zone.id}</Typography>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="subtitle2" gutterBottom>Inlets ({zone.inlets?.length || 0})</Typography>
                {zone.inlets?.map((inlet, i) => (
                  <Box key={i} sx={{ mb: 1, p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                    <Typography variant="body2">{inlet.name}</Typography>
                    <Typography variant="caption" color={inlet.lastReading ? 'success.main' : 'textSecondary'}>
                      {formatLastReading(inlet.lastReading)}
                    </Typography>
                  </Box>
                ))}
                
                <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>Outlets ({zone.outlets?.length || 0})</Typography>
                {zone.outlets?.map((outlet, i) => (
                  <Box key={i} sx={{ mb: 1, p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                    <Typography variant="body2">{outlet.name}</Typography>
                    <Typography variant="caption" color={outlet.lastReading ? 'success.main' : 'textSecondary'}>
                      {formatLastReading(outlet.lastReading)}
                    </Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
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
            <Typography>NRW Percentage: <strong>{nrwData?.nrwPercentage || 0}%</strong></Typography>
            <Typography>Volume Lost: <strong>{(nrwData?.nrwVolume || 0).toLocaleString()} m³</strong></Typography>
            <Typography>Financial Loss: <strong>${(nrwData?.financial?.totalLossValue || 0).toLocaleString()}</strong></Typography>
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
            <TableRow>
              <TableCell>CUST-001</TableCell>
              <TableCell>John Doe</TableCell>
              <TableCell>MTR-001</TableCell>
              <TableCell>Jafar DMA</TableCell>
              <TableCell><Chip label="Active" color="success" size="small" /></TableCell>
            </TableRow>
            <TableRow>
              <TableCell>CUST-002</TableCell>
              <TableCell>Jane Smith</TableCell>
              <TableCell>MTR-002</TableCell>
              <TableCell>Yeka DMA</TableCell>
              <TableCell><Chip label="Active" color="success" size="small" /></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );

  // Map View
  const renderMapView = () => (
    <Paper sx={{ p: 3, minHeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f5f5f5' }}>
      <Box textAlign="center">
        <MapIcon sx={{ fontSize: 80, color: '#1976d2', mb: 2 }} />
        <Typography variant="h6" color="textSecondary">
          Interactive DMA Map View
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Map integration coming soon...
        </Typography>
      </Box>
    </Paper>
  );

  // About
  const renderAbout = () => (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ color: '#1976d2', fontWeight: 600 }}>
        Water Utility Management System
      </Typography>
      <Typography variant="h6" gutterBottom>Version 2.0.0</Typography>
      <Divider sx={{ my: 2 }} />
      <Typography variant="body1" paragraph>
        Enterprise Grade Water Distribution Management System designed to monitor and manage DMA zones,
        track consumption, detect leaks, and calculate Non-Revenue Water (NRW).
      </Typography>
      <Typography variant="body2" color="textSecondary">
        © 2026 Water Utility. All rights reserved.
      </Typography>
    </Paper>
  );

  // Leaks Content
  const renderLeaksContent = () => {
    const selectedLeakChild = selectedChild;
    
    switch(selectedLeakChild) {
      case 'leaks-map':
        return (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom sx={{ color: '#d32f2f', fontWeight: 600 }}>
              Leaks Mapping
            </Typography>
            <Grid container spacing={3}>
              {[1, 2, 3].map((item) => (
                <Grid item xs={12} md={4} key={item}>
                  <Card sx={{ borderLeft: 4, borderColor: '#d32f2f' }}>
                    <CardContent>
                      <Typography variant="h6">Leak #{item}</Typography>
                      <Typography variant="body2">Location: Jafar DMA - Bulk Didly</Typography>
                      <Typography variant="body2">Detected: 2026-03-0{item}</Typography>
                      <Chip label="Active" color="error" size="small" sx={{ mt: 1 }} />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        );
        
      case 'leaks-calculation':
        return (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom sx={{ color: '#d32f2f', fontWeight: 600 }}>
              Leaks Calculation
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">Total Leaks Detected</Typography>
                    <Typography variant="h3" color="#d32f2f">7</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">Estimated Water Loss</Typography>
                    <Typography variant="h3" color="#d32f2f">45,678 m³</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">Financial Impact</Typography>
                    <Typography variant="h4">$38,826</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        );
        
      case 'leaks-progress':
        return (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom sx={{ color: '#d32f2f', fontWeight: 600 }}>
              MLWR Progress
            </Typography>
            <Card>
              <CardContent>
                <Typography variant="h6">Monthly Leak Water Recovery (MLWR)</Typography>
                <Box sx={{ mt: 3 }}>
                  <Typography>Progress: 65%</Typography>
                  <LinearProgress variant="determinate" value={65} sx={{ height: 10, borderRadius: 5, mt: 1 }} />
                </Box>
                <Grid container spacing={2} sx={{ mt: 2 }}>
                  <Grid item xs={6}>
                    <Typography variant="body2">Target: 70,000 m³</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2">Recovered: 45,500 m³</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Paper>
        );
        
      default:
        return (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom sx={{ color: '#d32f2f', fontWeight: 600 }}>
              Leaks Management
            </Typography>
            <Grid container spacing={3}>
              {[1, 2, 3].map((item) => (
                <Grid item xs={12} md={4} key={item}>
                  <Card sx={{ borderLeft: 4, borderColor: '#d32f2f' }}>
                    <CardContent>
                      <Typography variant="h6">Leak #{item}</Typography>
                      <Typography variant="body2">Location: Jafar DMA - Bulk Didly</Typography>
                      <Typography variant="body2">Detected: 2026-03-0{item}</Typography>
                      <Chip label="Active" color="error" size="small" sx={{ mt: 1 }} />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        );
    }
  };

  // Contamination Content
  const renderContaminationContent = () => {
    const selectedContChild = selectedChild;
    
    switch(selectedContChild) {
      case 'contamination-map':
        return (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom sx={{ color: '#ed6c02', fontWeight: 600 }}>
              Contamination Location/Mapping
            </Typography>
            <Alert severity="success" sx={{ mb: 3 }}>
              No active contamination events detected
            </Alert>
            <Paper sx={{ p: 3, bgcolor: '#f5f5f5', minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography color="textSecondary">Contamination map will be displayed here</Typography>
            </Paper>
          </Paper>
        );
        
      case 'contamination-reason':
        return (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom sx={{ color: '#ed6c02', fontWeight: 600 }}>
              Reason of Contamination
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#ed6c02' }}>
                    <TableCell sx={{ color: 'white' }}>Date</TableCell>
                    <TableCell sx={{ color: 'white' }}>Location</TableCell>
                    <TableCell sx={{ color: 'white' }}>Reason</TableCell>
                    <TableCell sx={{ color: 'white' }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>2026-02-15</TableCell>
                    <TableCell>Jafar DMA - Bulk Didly</TableCell>
                    <TableCell>Pipe corrosion</TableCell>
                    <TableCell><Chip label="Resolved" color="success" size="small" /></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>2026-01-20</TableCell>
                    <TableCell>Yeka DMA - Misrak</TableCell>
                    <TableCell>Cross connection</TableCell>
                    <TableCell><Chip label="Resolved" color="success" size="small" /></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        );
        
      case 'contamination-progress':
        return (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom sx={{ color: '#ed6c02', fontWeight: 600 }}>
              MLWR Progress - Contamination
            </Typography>
            <Card>
              <CardContent>
                <Typography variant="h6">Water Quality Recovery Progress</Typography>
                <Box sx={{ mt: 3 }}>
                  <Typography>Overall Progress: 92%</Typography>
                  <LinearProgress variant="determinate" value={92} sx={{ height: 10, borderRadius: 5, mt: 1, bgcolor: '#ffebee' }} />
                </Box>
                <Grid container spacing={2} sx={{ mt: 2 }}>
                  <Grid item xs={4}>
                    <Typography variant="body2">Samples Tested: 156</Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2">Passed: 144</Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2">Failed: 12</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Paper>
        );
        
      default:
        return (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom sx={{ color: '#ed6c02', fontWeight: 600 }}>
              Contamination Monitoring
            </Typography>
            <Alert severity="info">
              No contamination events detected in the last 30 days.
            </Alert>
          </Paper>
        );
    }
  };

  // Main render function
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

    // ADMA's children
    if (selectedParent === 'adma') {
      switch(selectedChild) {
        case 'bulk':
          return renderADMABulk();
        case 'map':
          return renderMapView();
        case 'nrw':
          return renderNRWCalculator();
        case 'customers':
          return renderCustomers();
        case 'about':
          return renderAbout();
        default:
          return renderADMABulk();
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

    // About children
    if (selectedParent === 'about-main') {
      return renderAbout();
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
                      '&:hover': { bgcolor: item.color }
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
        {/* Top Horizontal Menu - Shows children of selected parent */}
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
                      '&:hover': {
                        bgcolor: menuItems.find(item => item.id === selectedParent).color,
                        opacity: 0.9
                      }
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
      </Box>
    </Box>
  );
}