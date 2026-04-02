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
  Chip,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Menu,
  Badge
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
import SmartphoneIcon from '@mui/icons-material/Smartphone';
import CloseIcon from '@mui/icons-material/Close';
import HistoryIcon from '@mui/icons-material/History';
import AccountCircle from '@mui/icons-material/AccountCircle';
import AdminPanelSettings from '@mui/icons-material/AdminPanelSettings';
import Logout from '@mui/icons-material/Logout';
import axios from 'axios';
import { dmaAPI, nrwAPI, analyticsAPI } from '../services/api';
import HistoricalDataChart from '../components/HistoricalDataChart';
import DMAMap from '../components/DMAMap';
import CustomerHistory from '../components/CustomerHistory';
import NRWCalculator from '../components/NRWCalculator';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';
// Use API_URL in all axios calls
// Use Render backend URL
//const API_URL = 'https://bulk-meter-mobile.onrender.com/api';
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
///const API_URL = 'http://localhost:8000/api';
export default function Dashboard() {
  const { user, logout, hasPermission } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dmaData, setDmaData] = useState(null);
  const [nrwData, setNrwData] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [selectedParent, setSelectedParent] = useState('adma');
  const [selectedChild, setSelectedChild] = useState('bulk');
  const [nrwInput, setNrwInput] = useState({ systemInput: 950000, billedConsumption: 775000 });
  
  // Mobile readings state
  const [mobileReadings, setMobileReadings] = useState([]);
  const [readingsLoading, setReadingsLoading] = useState(false);
  
  // History dialog state
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState(null);
  
  // System Inflow states
  const [systemInflowData, setSystemInflowData] = useState({});
  const [selectedInflowMonth, setSelectedInflowMonth] = useState('');
  const [availableMonths, setAvailableMonths] = useState([]);
  const [loadingInflow, setLoadingInflow] = useState(false);
  const [selectedYear, setSelectedYear] = useState('all');
  
  // Manual Reading states
  const [manualReadings, setManualReadings] = useState({});
  const [showManualInput, setShowManualInput] = useState({});
  const [readingValue, setReadingValue] = useState({});
  const [readingDate, setReadingDate] = useState({});
  const [saving, setSaving] = useState(false);
  const [availablePeriods, setAvailablePeriods] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('');
  // Combined readings for history
  const [combinedReadings, setCombinedReadings] = useState({});

  // User menu handlers
  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const handleLogout = async () => {
    await logout();
    handleMenuClose();
  };
  const handleAdminPanel = () => {
    navigate('/admin');
    handleMenuClose();
  };

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
      id: 'mobile',
      label: "Mobile Readings",
      icon: <SmartphoneIcon />,
      color: '#4caf50',
      children: [
        { id: 'readings', label: 'All Readings', icon: <SmartphoneIcon /> }
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

  // Generate months from January 2025 to December 2026
  const generateMonthsFrom2025To2026 = () => {
    const months = [];
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    for (let year = 2025; year <= 2026; year++) {
      for (let month = 0; month < 12; month++) {
        const monthName = monthNames[month];
        months.push({
          label: `${monthName} ${year}`,
          value: `${year}-${String(month + 1).padStart(2, '0')}`,
          year: year,
          month: month + 1
        });
      }
    }
    return months.reverse();
  };

  // Fetch available months
  const fetchAvailableMonths = async () => {
    try {
      const response = await axios.get(`${API_URL}/months`);
      if (response.data && response.data.length > 0) {
        setAvailableMonths(response.data);
        if (response.data.length > 0) {
          setSelectedInflowMonth(response.data[0].label);
        }
      } else {
        const months = generateMonthsFrom2025To2026();
        setAvailableMonths(months);
        if (months.length > 0) {
          setSelectedInflowMonth(months[0].label);
        }
      }
    } catch (error) {
      console.error('Failed to fetch months:', error);
      const months = generateMonthsFrom2025To2026();
      setAvailableMonths(months);
      if (months.length > 0) {
        setSelectedInflowMonth(months[0].label);
      }
    }
  };

  // Filter months based on selected year
  const getFilteredMonths = () => {
    if (selectedYear === 'all') {
      return availableMonths;
    }
    return availableMonths.filter(month => month.year === parseInt(selectedYear));
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const dmaResponse = await dmaAPI.getHistory();
      const analyticsResponse = await analyticsAPI.getOverview();
      
      let nrwResponse = null;
      try {
        const selectedPeriod = '2026-december';
        nrwResponse = await axios.post(`${API_URL}/nrw/calculate`, {
          periodId: selectedPeriod
        });
      } catch (err) {
        console.error('Failed to fetch NRW data:', err);
      }
      
      setDmaData(dmaResponse.data);
      setNrwData(nrwResponse?.data || null);
      setAnalytics(analyticsResponse.data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError('Failed to connect to backend.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch mobile readings
  const fetchMobileReadings = async () => {
    setReadingsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/mongo-readings`);
      setMobileReadings(response.data.readings || []);
    } catch (error) {
      console.error('Failed to fetch mobile readings:', error);
    } finally {
      setReadingsLoading(false);
    }
  };

  // Fetch combined readings
  const fetchCombinedReadings = async (dmaId, pointName) => {
    try {
      const [manualRes, mobileRes] = await Promise.all([
        axios.get(`${API_URL}/reading-history/${dmaId}/${pointName}`),
        axios.get(`${API_URL}/mongo-readings`)
      ]);
      
      const mobileReadingsForPoint = mobileRes.data.readings?.filter(
        r => r.dmaId === dmaId && r.pointName === pointName
      ) || [];
      
      const formattedMobile = mobileReadingsForPoint.map(r => ({
        readingDate: r.timestamp,
        readingValue: r.meterReading,
        source: 'mobile',
        notes: r.notes || 'From mobile app',
        _id: r._id,
        uniqueKey: `${r.meterReading}-${new Date(r.timestamp).toLocaleDateString()}`
      }));
      
      const formattedManual = (manualRes.data || []).map(r => ({
        readingDate: r.readingDate,
        readingValue: r.readingValue,
        source: 'manual',
        notes: r.notes || '-',
        uniqueKey: `${r.readingValue}-${new Date(r.readingDate).toLocaleDateString()}`
      }));
      
      const allReadingsMap = new Map();
      formattedMobile.forEach(reading => {
        allReadingsMap.set(reading.uniqueKey, reading);
      });
      formattedManual.forEach(reading => {
        if (!allReadingsMap.has(reading.uniqueKey)) {
          allReadingsMap.set(reading.uniqueKey, reading);
        }
      });
      
      const allReadings = Array.from(allReadingsMap.values())
        .sort((a, b) => new Date(b.readingDate) - new Date(a.readingDate));
      
      setCombinedReadings(prev => ({
        ...prev,
        [`${dmaId}-${pointName}`]: allReadings
      }));
      
      return allReadings;
    } catch (error) {
      console.error('Failed to fetch combined readings:', error);
      return [];
    }
  };

  // Fetch system inflow
  const fetchSystemInflow = async (periodId) => {
    setLoadingInflow(true);
    try {
      const response = await axios.get(`${API_URL}/water-balance-summary`, {
        params: { periodId }
      });
      
      const inflowMap = {};
      if (response.data && response.data.dmas) {
        response.data.dmas.forEach(dma => {
          inflowMap[dma.dmaId] = {
            inflow: dma.totalInlet || 0,
            outflow: dma.totalOutlet || 0,
            netInflow: dma.systemInflow || 0,
            inletDetails: dma.inletDetails,
            outletDetails: dma.outletDetails
          };
        });
      }
      setSystemInflowData(inflowMap);
    } catch (error) {
      console.error('Failed to fetch system inflow:', error);
    } finally {
      setLoadingInflow(false);
    }
  };

  // Fetch manual readings for a specific point
  const fetchManualReadings = async (dmaId, pointName) => {
    try {
      const response = await axios.get(`${API_URL}/reading-history/${dmaId}/${pointName}`);
      setManualReadings(prev => ({
        ...prev,
        [`${dmaId}-${pointName}`]: response.data
      }));
    } catch (error) {
      console.error('Failed to fetch readings:', error);
    }
  };

  // Save manual reading
  const saveManualReading = async (dmaId, pointName, pointType, value, date) => {
    if (!value || !date) {
      alert('Please enter both reading value and date');
      return;
    }

    setSaving(true);
    try {
      await axios.post(`${API_URL}/reading-history`, {
        dmaId,
        pointName,
        pointType,
        readingDate: date,
        readingValue: parseFloat(value),
        source: 'manual'
      });
      
      await fetchManualReadings(dmaId, pointName);
      
      setShowManualInput(prev => ({ ...prev, [`${dmaId}-${pointName}`]: false }));
      setReadingValue(prev => ({ ...prev, [`${dmaId}-${pointName}`]: '' }));
      setReadingDate(prev => ({ ...prev, [`${dmaId}-${pointName}`]: '' }));
      
      alert('Reading saved successfully!');
    } catch (error) {
      console.error('Failed to save reading:', error);
      alert('Failed to save reading');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchMobileReadings();
  }, []);

  useEffect(() => {
    fetchAvailableMonths();
  }, []);

  useEffect(() => {
    if (selectedInflowMonth) {
      const [monthName, yearStr] = selectedInflowMonth.split(' ');
      const monthMap = {
        'January': 'january', 'February': 'february', 'March': 'march',
        'April': 'april', 'May': 'may', 'June': 'june',
        'July': 'july', 'August': 'august', 'September': 'september',
        'October': 'october', 'November': 'november', 'December': 'december'
      };
      const periodId = `${yearStr}-${monthMap[monthName]}`;
      fetchSystemInflow(periodId);
    }
  }, [selectedInflowMonth]);

  // Calculate totals
  const totalConnections = dmaData?.zones?.reduce((acc, zone) => acc + (zone.totalConnections || 0), 0) || 0;
  const activeMeters = dmaData?.zones?.reduce((acc, zone) => acc + (zone.activeMeters || 0), 0) || 0;
  
  const nrwComponents = nrwData?.components ? [
    { name: 'Leaks', value: nrwData.components.leaks },
    { name: 'Meter Errors', value: nrwData.components.meterInaccuracies },
    { name: 'Unauthorized', value: nrwData.components.unauthorizedConsumption },
    { name: 'Bursts', value: nrwData.components.bursts },
  ] : [];

  const getUniqueYears = () => {
    const years = [...new Set(availableMonths.map(m => m.year))];
    return years.sort((a, b) => b - a);
  };

  // Render functions
  const renderMobileReadings = () => (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: '#1e3a8a' }}>
        📱 Mobile Bulk Readings
      </Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
        Total: {mobileReadings.length} readings from mobile app
      </Typography>
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
              <TableCell><strong>Date/Time</strong></TableCell>
              <TableCell><strong>DMA</strong></TableCell>
              <TableCell><strong>Point</strong></TableCell>
              <TableCell align="right"><strong>Reading (m³)</strong></TableCell>
              <TableCell><strong>Source</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {readingsLoading ? (
              <TableRow><TableCell colSpan={5} align="center"><CircularProgress size={30} /></TableCell></TableRow>
            ) : mobileReadings.length === 0 ? (
              <TableRow><TableCell colSpan={5} align="center">No readings yet. Use the mobile app to add readings.</TableCell></TableRow>
            ) : (
              mobileReadings.map((reading) => (
                <TableRow key={reading._id} hover>
                  <TableCell>{new Date(reading.timestamp).toLocaleString()}</TableCell>
                  <TableCell><Chip label={reading.dmaId} size="small" color={reading.dmaId === 'DMA-JFR' ? 'error' : 'primary'} /></TableCell>
                  <TableCell>{reading.pointName}</TableCell>
                  <TableCell align="right"><Typography fontWeight="bold">{reading.meterReading.toLocaleString()} m³</Typography></TableCell>
                  <TableCell><Chip label={reading.source || 'mobile'} size="small" color="success" /></TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );

  const renderDMABulk = () => {
    if (!dmaData?.zones || dmaData.zones.length === 0) {
      return (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="textSecondary">No DMA data available. Please check backend connection.</Typography>
        </Paper>
      );
    }

    const filteredMonths = getFilteredMonths();
    const uniqueYears = getUniqueYears();

    return (
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: '#1e3a8a' }}>DMA Zones</Typography>
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 500 }}>System Inflow:</Typography>
            {uniqueYears.length > 0 && (
              <FormControl size="small" sx={{ minWidth: 100 }}>
                <InputLabel>Year</InputLabel>
                <Select value={selectedYear} label="Year" onChange={(e) => setSelectedYear(e.target.value)} sx={{ bgcolor: 'white' }}>
                  <MenuItem value="all">All Years</MenuItem>
                  {uniqueYears.map(year => (<MenuItem key={year} value={year}>{year}</MenuItem>))}
                </Select>
              </FormControl>
            )}
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Select Month</InputLabel>
              <Select value={selectedInflowMonth} label="Select Month" onChange={(e) => setSelectedInflowMonth(e.target.value)} sx={{ bgcolor: 'white' }}>
                {filteredMonths.map((month) => {
                  const isCurrentMonth = month.year === new Date().getFullYear() && month.month === new Date().getMonth() + 1;
                  return (
                    <MenuItem key={month.label} value={month.label}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography>{month.label}</Typography>
                        {isCurrentMonth && <Chip label="Current" size="small" color="primary" sx={{ height: 20 }} />}
                      </Box>
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
            {loadingInflow && <CircularProgress size={20} />}
          </Box>
        </Box>

        {/* KPI Cards */}
        {(totalConnections > 0 || activeMeters > 0) && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {totalConnections > 0 && (
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box><Typography variant="body2" sx={{ opacity: 0.8 }}>Total Connections</Typography><Typography variant="h4">{totalConnections.toLocaleString()}</Typography></Box>
                      <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}><PeopleIcon /></Avatar>
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
                      <Box><Typography variant="body2" sx={{ opacity: 0.8 }}>Active Meters</Typography><Typography variant="h4">{activeMeters.toLocaleString()}</Typography></Box>
                      <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}><WaterDropIcon /></Avatar>
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
                      <Box><Typography variant="body2" sx={{ opacity: 0.8 }}>NRW Percentage</Typography><Typography variant="h4">{nrwData.nrwPercentage}%</Typography></Box>
                      <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}><WarningIcon /></Avatar>
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
                      <Box><Typography variant="body2" sx={{ opacity: 0.8 }}>Financial Loss</Typography><Typography variant="h4">${parseInt(nrwData.financial.totalLossValue).toLocaleString()}</Typography></Box>
                      <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}><TrendingDownIcon /></Avatar>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        )}

        {/* DMA Zone Cards */}
        <Grid container spacing={3}>
          {dmaData.zones.map((zone, index) => {
            const inflowInfo = systemInflowData[zone.id];
            return (
              <Grid item xs={12} md={4} key={index}>
                <Card sx={{ borderLeft: 6, borderColor: index === 0 ? '#FF6B6B' : index === 1 ? '#4ECDC4' : '#95A5A6', height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="h5" sx={{ fontWeight: 600 }}>{zone.name}</Typography>
                      <Chip label={zone.id} size="small" sx={{ bgcolor: index === 0 ? '#FF6B6B' : index === 1 ? '#4ECDC4' : '#95A5A6', color: 'white', fontWeight: 600 }} />
                    </Box>
                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ mb: 3, p: 2, bgcolor: '#e8f5e9', borderRadius: 2 }}>
                      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, color: '#2e7d32' }}>💧 System Inflow ({selectedInflowMonth || 'Select Month'})</Typography>
                      {inflowInfo ? (
                        <Grid container spacing={1}>
                          <Grid item xs={6}><Typography variant="caption" color="textSecondary">Water Entering</Typography><Typography variant="h6" color="primary">{inflowInfo.inflow?.toLocaleString() || 0} m³</Typography></Grid>
                          <Grid item xs={6}><Typography variant="caption" color="textSecondary">Water Exiting</Typography><Typography variant="h6" color="warning.main">{inflowInfo.outflow?.toLocaleString() || 0} m³</Typography></Grid>
                          <Grid item xs={12}><Divider sx={{ my: 1 }} /><Typography variant="caption" color="textSecondary">Net Inflow</Typography><Typography variant="subtitle1" fontWeight="bold">{inflowInfo.netInflow?.toLocaleString() || 0} m³</Typography></Grid>
                        </Grid>
                      ) : (
                        <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 1 }}>No inflow data for selected month</Typography>
                      )}
                    </Box>
                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, color: '#1976d2' }}>Inlets ({zone.inlets?.length || 0})</Typography>
                    {zone.inlets?.map((inlet, i) => {
                      const readings = manualReadings[`${zone.id}-${inlet.name}`];
                      const latestReading = readings?.[0];
                      const showInput = showManualInput[`${zone.id}-${inlet.name}`];
                      return (
                        <Card key={i} variant="outlined" sx={{ mb: 2, borderLeft: 4, borderColor: '#1976d2', bgcolor: '#f8f9fa' }}>
                          <CardContent>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{inlet.name}</Typography>
                              <Box>
                                {hasPermission('canAddReadings') && (
                                  <Button size="small" variant="text" onClick={() => { fetchManualReadings(zone.id, inlet.name); setShowManualInput(prev => ({ ...prev, [`${zone.id}-${inlet.name}`]: !showInput })); }}>{showInput ? 'Hide' : 'MANUAL'}</Button>
                                )}
                                <Button size="small" variant="outlined" sx={{ ml: 1 }} onClick={async () => { const readings = await fetchCombinedReadings(zone.id, inlet.name); setSelectedPoint({ dmaId: zone.id, pointName: inlet.name, pointType: 'inlet', readings }); setHistoryDialogOpen(true); }}>HISTORY</Button>
                              </Box>
                            </Box>
                            {latestReading ? (
                              <Box mt={1}><Chip size="small" label="LIVE" color="success" sx={{ mr: 1, height: 20 }} /><Typography variant="caption" color="success.main">Last: {latestReading.readingValue.toLocaleString()} m³ ({new Date(latestReading.readingDate).toLocaleDateString()})</Typography></Box>
                            ) : <Typography variant="caption" color="textSecondary">No readings yet</Typography>}
                            {showInput && (
                              <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                                <Typography variant="caption" fontWeight="bold" gutterBottom>Enter New Reading:</Typography>
                                <TextField fullWidth size="small" type="number" label="Reading Value (m³)" value={readingValue[`${zone.id}-${inlet.name}`] || ''} onChange={(e) => setReadingValue(prev => ({ ...prev, [`${zone.id}-${inlet.name}`]: e.target.value }))} sx={{ mt: 1, mb: 1 }} />
                                <TextField fullWidth size="small" type="date" label="Reading Date" value={readingDate[`${zone.id}-${inlet.name}`] || ''} onChange={(e) => setReadingDate(prev => ({ ...prev, [`${zone.id}-${inlet.name}`]: e.target.value }))} InputLabelProps={{ shrink: true }} sx={{ mb: 1 }} />
                                <Button fullWidth variant="contained" size="small" disabled={saving} onClick={() => saveManualReading(zone.id, inlet.name, 'inlet', readingValue[`${zone.id}-${inlet.name}`], readingDate[`${zone.id}-${inlet.name}`])}>{saving ? <CircularProgress size={20} /> : 'Save Reading'}</Button>
                              </Box>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, color: '#f57c00', mt: 3 }}>Outlets ({zone.outlets?.length || 0})</Typography>
                    {zone.outlets?.map((outlet, i) => {
                      const readings = manualReadings[`${zone.id}-${outlet.name}`];
                      const latestReading = readings?.[0];
                      const showInput = showManualInput[`${zone.id}-${outlet.name}`];
                      return (
                        <Card key={i} variant="outlined" sx={{ mb: 2, borderLeft: 4, borderColor: '#f57c00', bgcolor: '#f8f9fa' }}>
                          <CardContent>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{outlet.name}</Typography>
                              <Box>
                                {hasPermission('canAddReadings') && (
                                  <Button size="small" variant="text" onClick={() => { fetchManualReadings(zone.id, outlet.name); setShowManualInput(prev => ({ ...prev, [`${zone.id}-${outlet.name}`]: !showInput })); }}>{showInput ? 'Hide' : 'MANUAL'}</Button>
                                )}
                                <Button size="small" variant="outlined" sx={{ ml: 1 }} onClick={async () => { const readings = await fetchCombinedReadings(zone.id, outlet.name); setSelectedPoint({ dmaId: zone.id, pointName: outlet.name, pointType: 'outlet', readings }); setHistoryDialogOpen(true); }}>HISTORY</Button>
                              </Box>
                            </Box>
                            {latestReading ? (
                              <Box mt={1}><Chip size="small" label="LIVE" color="success" sx={{ mr: 1, height: 20 }} /><Typography variant="caption" color="success.main">Last: {latestReading.readingValue.toLocaleString()} m³ ({new Date(latestReading.readingDate).toLocaleDateString()})</Typography></Box>
                            ) : <Typography variant="caption" color="textSecondary">No readings yet</Typography>}
                            {showInput && (
                              <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                                <Typography variant="caption" fontWeight="bold" gutterBottom>Enter New Reading:</Typography>
                                <TextField fullWidth size="small" type="number" label="Reading Value (m³)" value={readingValue[`${zone.id}-${outlet.name}`] || ''} onChange={(e) => setReadingValue(prev => ({ ...prev, [`${zone.id}-${outlet.name}`]: e.target.value }))} sx={{ mt: 1, mb: 1 }} />
                                <TextField fullWidth size="small" type="date" label="Reading Date" value={readingDate[`${zone.id}-${outlet.name}`] || ''} onChange={(e) => setReadingDate(prev => ({ ...prev, [`${zone.id}-${outlet.name}`]: e.target.value }))} InputLabelProps={{ shrink: true }} sx={{ mb: 1 }} />
                                <Button fullWidth variant="contained" size="small" disabled={saving} onClick={() => saveManualReading(zone.id, outlet.name, 'outlet', readingValue[`${zone.id}-${outlet.name}`], readingDate[`${zone.id}-${outlet.name}`])}>{saving ? <CircularProgress size={20} /> : 'Save Reading'}</Button>
                              </Box>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                    {(!zone.outlets || zone.outlets.length === 0) && <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 1, mb: 2 }}>No outlets configured</Typography>}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        {/* Charts */}
        {dmaData?.history && dmaData.history.length > 0 && (
          <Grid container spacing={3} sx={{ mt: 4 }}>
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>Consumption & Losses Trend</Typography>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={dmaData.history}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" /><YAxis /><RechartsTooltip /><Legend />
                    <Line type="monotone" dataKey="consumption" stroke="#8884d8" strokeWidth={3} name="Consumption (m³)" />
                    <Line type="monotone" dataKey="losses" stroke="#ff7300" strokeWidth={3} name="Losses (m³)" />
                  </LineChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>NRW Composition</Typography>
                {nrwComponents.length > 0 ? (
                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                      <Pie data={nrwComponents} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} outerRadius={120} fill="#8884d8" dataKey="value">
                        {nrwComponents.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <Typography color="textSecondary" align="center" py={4}>No NRW data available</Typography>}
              </Paper>
            </Grid>
          </Grid>
        )}
      </Box>
    );
  };

  const renderAbout = () => (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ color: '#1976d2', fontWeight: 600 }}>DMA Monitoring System</Typography>
      <Typography variant="h6" gutterBottom>Version 1.0.0</Typography>
      <Divider sx={{ my: 2 }} />
      <Typography variant="body1" paragraph>Enterprise Grade Water Distribution Management System designed to monitor and manage DMA zones, track consumption, detect leaks, and calculate Non-Revenue Water (NRW).</Typography>
      <Typography variant="body2" color="textSecondary">© 2026 Water Utility. All rights reserved.</Typography>
    </Paper>
  );

  const renderNRWCalculator = () => <NRWCalculator />;

  const renderCustomers = () => {
    const dmaZones = dmaData?.zones?.map(zone => ({ id: zone.id, name: zone.name })) || [];
    return <CustomerHistory dmaList={dmaZones} />;
  };

  const renderMapView = () => <DMAMap />;
  const renderLeaksContent = () => (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom sx={{ color: '#d32f2f', fontWeight: 600 }}>Leaks Management</Typography>
      <Alert severity="info">Leak detection data will appear here once available</Alert>
    </Paper>
  );
  const renderContaminationContent = () => (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom sx={{ color: '#ed6c02', fontWeight: 600 }}>Contamination Monitoring</Typography>
      <Alert severity="info">Contamination monitoring data will appear here once available</Alert>
    </Paper>
  );

  const renderContent = () => {
    if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh"><CircularProgress /></Box>;
    if (error) return <Box textAlign="center" py={4}><Alert severity="error" sx={{ mb: 2 }}>{error}</Alert><Button variant="contained" onClick={fetchData} startIcon={<RefreshIcon />}>Retry Connection</Button></Box>;

    if (selectedParent === 'adma') {
      switch(selectedChild) {
        case 'bulk': return renderDMABulk();
        case 'map': return renderMapView();
        case 'nrw': return renderNRWCalculator();
        case 'customers': return renderCustomers();
        case 'about': return renderAbout();
        default: return renderDMABulk();
      }
    }
    if (selectedParent === 'mobile') return renderMobileReadings();
    if (selectedParent === 'leaks') return renderLeaksContent();
    if (selectedParent === 'contamination') return renderContaminationContent();
    return null;
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      {/* Left Vertical Menu */}
      <Paper sx={{ width: 280, borderRadius: 0, bgcolor: '#1e3a8a', color: 'white' }}>
        <Box sx={{ p: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>Water Utility</Typography>
          <List>
            {menuItems.map((item) => (
              <ListItem key={item.id} disablePadding sx={{ mb: 1 }}>
                <ListItemButton selected={selectedParent === item.id} onClick={() => { setSelectedParent(item.id); setSelectedChild(item.children[0].id); }} sx={{ borderRadius: 2, color: 'white', '&.Mui-selected': { bgcolor: item.color }, '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}>
                  <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: 500 }} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Paper>

      {/* Right Content Area */}
      <Box sx={{ flex: 1, p: 4 }}>
        {/* Top Bar with User Menu */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Paper sx={{ p: 2, flex: 1 }}>
            <Box display="flex" gap={2} flexWrap="wrap">
              {menuItems.find(item => item.id === selectedParent)?.children.map((child) => (
                <Button key={child.id} variant={selectedChild === child.id ? "contained" : "outlined"} startIcon={child.icon} onClick={() => setSelectedChild(child.id)} sx={{ borderRadius: 2, ...(selectedChild === child.id && { bgcolor: menuItems.find(item => item.id === selectedParent).color, '&:hover': { opacity: 0.9 } }) }}>{child.label}</Button>
              ))}
            </Box>
          </Paper>
          <Box ml={2}>
            <IconButton onClick={handleMenuOpen} sx={{ p: 1 }}>
              <Avatar sx={{ bgcolor: '#1976d2' }}>{user?.fullName?.charAt(0) || user?.username?.charAt(0) || 'U'}</Avatar>
            </IconButton>
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose} transformOrigin={{ horizontal: 'right', vertical: 'top' }} anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}>
              <MenuItem disabled><Typography variant="body2"><strong>{user?.fullName}</strong></Typography></MenuItem>
              <MenuItem disabled><Typography variant="caption" color="textSecondary">Role: {user?.role?.replace(/_/g, ' ')}</Typography></MenuItem>
              <Divider />
              {hasPermission('canManageUsers') && (
                <MenuItem onClick={handleAdminPanel}><AdminPanelSettings sx={{ mr: 1, fontSize: 20 }} /> Admin Panel</MenuItem>
              )}
              <MenuItem onClick={handleLogout}><Logout sx={{ mr: 1, fontSize: 20 }} /> Logout</MenuItem>
            </Menu>
          </Box>
        </Box>

        {/* Main Content Area */}
        {renderContent()}

        {/* History Dialog */}
        <Dialog open={historyDialogOpen} onClose={() => setHistoryDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box display="flex" alignItems="center"><HistoryIcon sx={{ mr: 1, color: '#1976d2' }} /><Typography variant="h6">Historical Readings: {selectedPoint?.pointName}</Typography><Chip label={selectedPoint?.pointType} size="small" color={selectedPoint?.pointType === 'inlet' ? 'primary' : 'warning'} sx={{ ml: 2 }} /></Box>
              <IconButton onClick={() => setHistoryDialogOpen(false)}><CloseIcon /></IconButton>
            </Box>
          </DialogTitle>
          <DialogContent dividers>
            {selectedPoint && (
              <Box>
                <Box display="flex" gap={2} sx={{ mb: 2 }}>
                  <Chip label={`Total: ${selectedPoint.readings?.length || 0} readings`} color="info" />
                  <Chip label={`Mobile: ${selectedPoint.readings?.filter(r => r.source === 'mobile').length || 0}`} color="success" variant="outlined" />
                  <Chip label={`Manual: ${selectedPoint.readings?.filter(r => r.source === 'manual').length || 0}`} color="warning" variant="outlined" />
                </Box>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead><TableRow sx={{ bgcolor: '#f5f5f5' }}><TableCell><strong>Date/Time</strong></TableCell><TableCell align="right"><strong>Reading (m³)</strong></TableCell><TableCell><strong>Source</strong></TableCell><TableCell><strong>Notes</strong></TableCell></TableRow></TableHead>
                    <TableBody>
                      {selectedPoint.readings?.length === 0 ? (
                        <TableRow><TableCell colSpan={4} align="center">No readings available</TableCell></TableRow>
                      ) : (
                        selectedPoint.readings?.map((reading, idx) => (
                          <TableRow key={idx} hover>
                            <TableCell>{new Date(reading.readingDate).toLocaleString()}</TableCell>
                            <TableCell align="right"><Typography fontWeight="bold">{reading.readingValue.toLocaleString()} m³</Typography></TableCell>
                            <TableCell><Chip label={reading.source || 'unknown'} size="small" color={reading.source === 'mobile' ? 'success' : 'warning'} /></TableCell>
                            <TableCell><Typography variant="caption" color="textSecondary">{reading.notes || '-'}</Typography></TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                {selectedPoint.readings?.length > 1 && (
                  <Box sx={{ mt: 3, height: 250 }}>
                    <Typography variant="subtitle2" gutterBottom>Reading Trend</Typography>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={[...selectedPoint.readings].reverse()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="readingDate" tickFormatter={(date) => new Date(date).toLocaleDateString()} angle={-45} textAnchor="end" height={60} />
                        <YAxis />
                        <RechartsTooltip labelFormatter={(label) => new Date(label).toLocaleString()} formatter={(value) => [`${value.toLocaleString()} m³`, 'Reading']} />
                        <Line type="monotone" dataKey="readingValue" stroke="#1976d2" strokeWidth={2} dot={{ r: 4 }} name="Reading" />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions><Button onClick={() => setHistoryDialogOpen(false)}>Close</Button></DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
}