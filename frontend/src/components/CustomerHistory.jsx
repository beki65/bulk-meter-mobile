import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Grid, Card, CardContent,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Chip, Button, TextField, MenuItem, FormControl,
  InputLabel, Select, CircularProgress, Alert, Divider,
  Tab, Tabs, IconButton, Tooltip
} from '@mui/material';
import {
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  WaterDrop as WaterIcon
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import csvDataService from '../services/csvDataService';

export default function CustomerHistory({ dmaList = [] }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDMA, setSelectedDMA] = useState('');
  const [customers, setCustomers] = useState([]);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({
    minConsumption: '',
    zeroConsumption: false,
    meterKeyChanged: null
  });
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    if (selectedDMA) {
      loadDMAData();
    }
  }, [selectedDMA]);

  const loadDMAData = async () => {
    setLoading(true);
    try {
      // Get DMA statistics
      const dmaStats = await csvDataService.getDMAStatistics(selectedDMA);
      setStats(dmaStats);
      
      // Get customers with filters
      const dmaCustomers = await csvDataService.getCustomersByDMA(selectedDMA, filters);
      setCustomers(dmaCustomers);
      
      setError(null);
    } catch (err) {
      setError('Failed to load DMA data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = async () => {
    setLoading(true);
    try {
      const filtered = await csvDataService.getCustomersByDMA(selectedDMA, filters);
      setCustomers(filtered);
    } catch (err) {
      setError('Failed to apply filters');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerSelect = async (customer) => {
    setSelectedCustomer(customer);
    const history = await csvDataService.getCustomerConsumptionHistory(customer.id);
    setSelectedCustomer(prev => ({ ...prev, ...history }));
  };

  const exportToCSV = () => {
    // Create CSV content
    let csvContent = "Customer ID,Name,Meter Number,Avg Consumption,Status,Meter Key Changed\n";
    
    customers.forEach(c => {
      csvContent += `${c.id},${c.name},${c.meterNumber},${csvDataService.calculateAverageConsumption(c).toFixed(2)},${c.status},${c.meterKeyChanged}\n`;
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers-${selectedDMA}-${new Date().toISOString()}.csv`;
    a.click();
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" sx={{ fontWeight: 600, color: '#1e3a8a' }}>
          👥 Customer History & Analytics
        </Typography>
        <Box>
          <Tooltip title="Refresh Data">
            <IconButton onClick={loadDMAData} disabled={!selectedDMA || loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Export to CSV">
            <IconButton onClick={exportToCSV} disabled={customers.length === 0}>
              <DownloadIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* DMA Selection */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Select DMA</InputLabel>
            <Select
              value={selectedDMA}
              label="Select DMA"
              onChange={(e) => setSelectedDMA(e.target.value)}
            >
              {dmaList.map((dma) => (
                <MenuItem key={dma.id} value={dma.id}>{dma.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {selectedDMA && (
        <>
          {/* Statistics Cards */}
          {stats && (
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6} md={2}>
                <Card sx={{ bgcolor: '#e3f2fd' }}>
                  <CardContent>
                    <Typography variant="caption">Total Customers</Typography>
                    <Typography variant="h6">{stats.totalCustomers}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} md={2}>
                <Card sx={{ bgcolor: '#fff3e0' }}>
                  <CardContent>
                    <Typography variant="caption">Zero Consumption</Typography>
                    <Typography variant="h6" color="error.main">{stats.zeroConsumption}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} md={2}>
                <Card sx={{ bgcolor: '#e8f5e8' }}>
                  <CardContent>
                    <Typography variant="caption">>100m³ Avg</Typography>
                    <Typography variant="h6" color="warning.main">{stats.highConsumption}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} md={2}>
                <Card sx={{ bgcolor: '#ffebee' }}>
                  <CardContent>
                    <Typography variant="caption">Meter Key Changed</Typography>
                    <Typography variant="h6">{stats.meterKeyChanged}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} md={2}>
                <Card sx={{ bgcolor: '#f3e5f5' }}>
                  <CardContent>
                    <Typography variant="caption">Avg Consumption</Typography>
                    <Typography variant="h6">{stats.averageConsumption.toFixed(1)} m³</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Filters */}
          <Paper sx={{ p: 2, mb: 3, bgcolor: '#f5f5f5' }}>
            <Typography variant="subtitle1" gutterBottom>Filters</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Min Avg Consumption"
                  type="number"
                  value={filters.minConsumption}
                  onChange={(e) => handleFilterChange('minConsumption', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Zero Consumption</InputLabel>
                  <Select
                    value={filters.zeroConsumption}
                    label="Zero Consumption"
                    onChange={(e) => handleFilterChange('zeroConsumption', e.target.value)}
                  >
                    <MenuItem value={false}>All</MenuItem>
                    <MenuItem value={true}>Show Zero Consumption</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Meter Key Changed</InputLabel>
                  <Select
                    value={filters.meterKeyChanged}
                    label="Meter Key Changed"
                    onChange={(e) => handleFilterChange('meterKeyChanged', e.target.value)}
                  >
                    <MenuItem value={null}>All</MenuItem>
                    <MenuItem value={true}>Changed</MenuItem>
                    <MenuItem value={false}>Not Changed</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <Button 
                  fullWidth 
                  variant="contained" 
                  onClick={applyFilters}
                  sx={{ height: '56px' }}
                >
                  Apply Filters
                </Button>
              </Grid>
            </Grid>
          </Paper>

          {/* Customer List */}
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Customer ID</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Meter Number</TableCell>
                  <TableCell align="right">Avg Consumption</TableCell>
                  <TableCell align="center">Meter Key</TableCell>
                  <TableCell align="center">Status</TableCell>
                  <TableCell align="center">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : customers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      No customers found
                    </TableCell>
                  </TableRow>
                ) : (
                  customers.map((customer) => {
                    const avgConsumption = csvDataService.calculateAverageConsumption(customer);
                    return (
                      <TableRow 
                        key={customer.id}
                        hover
                        onClick={() => handleCustomerSelect(customer)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell>{customer.id}</TableCell>
                        <TableCell>{customer.name}</TableCell>
                        <TableCell>{customer.meterNumber}</TableCell>
                        <TableCell align="right">
                          <Chip
                            label={`${avgConsumption.toFixed(1)} m³`}
                            size="small"
                            color={avgConsumption > 100 ? 'warning' : avgConsumption === 0 ? 'error' : 'success'}
                          />
                        </TableCell>
                        <TableCell align="center">
                          {customer.meterKeyChanged ? (
                            <CheckCircleIcon color="success" />
                          ) : (
                            <WarningIcon color="warning" />
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={customer.status}
                            size="small"
                            color={customer.status === 'active' ? 'success' : 'default'}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Button size="small" variant="outlined">
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Customer Details */}
          {selectedCustomer && (
            <Paper sx={{ mt: 3, p: 2 }}>
              <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
                <Tab label="Consumption History" />
                <Tab label="Meter Details" />
                <Tab label="Billing History" />
              </Tabs>
              
              <Box sx={{ mt: 2 }}>
                {tabValue === 0 && selectedCustomer.history && (
                  <>
                    <Typography variant="h6" gutterBottom>
                      {selectedCustomer.name} - 12 Month Consumption
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={selectedCustomer.history}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <RechartsTooltip />
                        <Line type="monotone" dataKey="consumption" stroke="#1976d2" name="m³" />
                      </LineChart>
                    </ResponsiveContainer>
                    
                    <Grid container spacing={2} sx={{ mt: 2 }}>
                      <Grid item xs={3}>
                        <Card sx={{ p: 2, bgcolor: '#e3f2fd' }}>
                          <Typography variant="caption">Average</Typography>
                          <Typography variant="h6">{selectedCustomer.averageConsumption?.toFixed(1)} m³</Typography>
                        </Card>
                      </Grid>
                      <Grid item xs={3}>
                        <Card sx={{ p: 2, bgcolor: '#ffebee' }}>
                          <Typography variant="caption">Zero Months</Typography>
                          <Typography variant="h6">{selectedCustomer.zeroMonths}</Typography>
                        </Card>
                      </Grid>
                      <Grid item xs={3}>
                        <Card sx={{ p: 2, bgcolor: '#e8f5e8' }}>
                          <Typography variant="caption">Peak</Typography>
                          <Typography variant="h6">{selectedCustomer.peakConsumption} m³</Typography>
                        </Card>
                      </Grid>
                      <Grid item xs={3}>
                        <Card sx={{ p: 2, bgcolor: '#fff3e0' }}>
                          <Typography variant="caption">Trend</Typography>
                          <Typography variant="h6" sx={{ textTransform: 'capitalize' }}>
                            {selectedCustomer.trend}
                          </Typography>
                        </Card>
                      </Grid>
                    </Grid>
                  </>
                )}
                
                {tabValue === 1 && (
                  <Box>
                    <Typography variant="body1" gutterBottom>
                      <strong>Meter Number:</strong> {selectedCustomer.meterNumber}
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      <strong>Meter Key:</strong> {selectedCustomer.meterKey}
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      <strong>Key Changed:</strong> {selectedCustomer.meterKeyChanged ? 'Yes' : 'No'}
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      <strong>Last Reading:</strong> {selectedCustomer.lastReading} m³
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      <strong>Last Reading Date:</strong> {selectedCustomer.lastReadingDate || 'N/A'}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Paper>
          )}
        </>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
      )}
    </Paper>
  );
}