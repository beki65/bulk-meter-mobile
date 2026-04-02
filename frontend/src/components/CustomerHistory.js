import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Grid, Card, CardContent,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Chip, Button, TextField, MenuItem, FormControl,
  InputLabel, Select, CircularProgress, Alert, IconButton, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import {
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Cloud as CloudIcon,
  History as HistoryIcon,
  Receipt as ReceiptIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  NavigateBefore as NavigateBeforeIcon,
  NavigateNext as NavigateNextIcon
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

export default function CustomerHistory({ dmaList = [] }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDMA, setSelectedDMA] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [customers, setCustomers] = useState([]);
  const [stats, setStats] = useState(null);
  const [availableMonths, setAvailableMonths] = useState([]);
  const [chartDialogOpen, setChartDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerHistory, setCustomerHistory] = useState([]);
  const [filters, setFilters] = useState({
    minConsumption: '',
    zeroConsumption: false
  });
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Helper to get auth token
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      headers: { Authorization: `Bearer ${token}` }
    };
  };

  useEffect(() => {
    fetchAvailableMonths();
  }, []);

  useEffect(() => {
    if (selectedDMA && selectedMonth) {
      setPage(1);
      loadDMAData();
    }
  }, [selectedDMA, selectedMonth, filters]);

  const fetchAvailableMonths = async () => {
    try {
      const response = await axios.get(`${API_URL}/months`, getAuthHeaders());
      setAvailableMonths(response.data);
      if (response.data.length > 0) {
        setSelectedMonth(response.data[0].label);
      }
    } catch (err) {
      console.error('Failed to fetch months:', err);
    }
  };

  const loadDMAData = async () => {
    setLoading(true);
    try {
      const monthMap = {
        'January': 1, 'February': 2, 'March': 3, 'April': 4, 'May': 5, 'June': 6,
        'July': 7, 'August': 8, 'September': 9, 'October': 10, 'November': 11, 'December': 12
      };
      const parts = selectedMonth.split(' ');
      const month = monthMap[parts[0]];
      const year = parseInt(parts[1]);
      
      const response = await axios.get(`${API_URL}/customers`, {
        params: { 
          dmaId: selectedDMA, 
          month, 
          year,
          page,
          limit: 50,
          ...(filters.minConsumption && { minConsumption: filters.minConsumption }),
          ...(filters.zeroConsumption && { zeroConsumption: 'true' })
        },
        ...getAuthHeaders()
      });
      
      setCustomers(response.data.customers);
      setStats(response.data.stats);
      setTotalPages(response.data.pagination?.totalPages || 1);
      setTotalItems(response.data.pagination?.totalItems || 0);
      setError(null);
    } catch (err) {
      setError('Failed to load DMA data: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const applyFilters = () => {
    loadDMAData();
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    loadDMAData();
  };

  const handleViewHistory = async (customer) => {
    setSelectedCustomer(customer);
    try {
      const response = await axios.get(`${API_URL}/customers/${customer.id}/history`, getAuthHeaders());
      setCustomerHistory(response.data.history || []);
      setChartDialogOpen(true);
    } catch (err) {
      console.error('Failed to fetch history:', err);
      setCustomerHistory([]);
      setChartDialogOpen(true);
    }
  };

  const exportToCSV = () => {
    let csvContent = "Customer ID,Name,Meter Number,Consumption (m³),Bill Amount (ETB),Status,Meter Key Changed\n";
    
    customers.forEach(c => {
      csvContent += `${c.id},${c.name},${c.meterNumber},${c.currentConsumption || 0},${c.currentBill || 0},${c.status},${c.meterKeyChanged ? 'Yes' : 'No'}\n`;
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers-${selectedDMA}-${selectedMonth}.csv`;
    a.click();
  };

  const getChartData = () => {
    if (!customerHistory || customerHistory.length === 0) return [];
    return customerHistory.map(item => ({
      month: item.period || `${item.month}/${item.year}`,
      consumption: item.consumption || 0,
      billAmount: item.billAmount || 0
    }));
  };

  const totalConsumptionHistory = customerHistory.reduce((sum, h) => sum + (h.consumption || 0), 0);
  const totalBillHistory = customerHistory.reduce((sum, h) => sum + (h.billAmount || 0), 0);
  const peakConsumption = Math.max(...customerHistory.map(h => h.consumption || 0), 0);

  return (
    <Paper sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600, color: '#1e3a8a' }}>
            👥 Customer History & Analytics
          </Typography>
          <Box display="flex" alignItems="center" mt={1}>
            <Chip icon={<CloudIcon />} label="Using Database (Live)" color="success" size="small" />
          </Box>
        </Box>
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

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Select DMA</InputLabel>
            <Select value={selectedDMA} label="Select DMA" onChange={(e) => setSelectedDMA(e.target.value)}>
              {dmaList.map((dma) => (
                <MenuItem key={dma.id} value={dma.id}>{dma.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Select Month</InputLabel>
            <Select
              value={selectedMonth}
              label="Select Month"
              onChange={(e) => setSelectedMonth(e.target.value)}
              disabled={availableMonths.length === 0}
            >
              {availableMonths.map((month) => (
                <MenuItem key={month.label} value={month.label}>
                  {month.label} ({month.count?.toLocaleString() || 0} records)
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3, bgcolor: '#f5f5f5' }}>
        <Typography variant="subtitle1" gutterBottom>Filters</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Min Consumption (m³)"
              type="number"
              value={filters.minConsumption}
              onChange={(e) => handleFilterChange('minConsumption', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={4}>
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
          <Grid item xs={12} md={4}>
            <Button fullWidth variant="contained" onClick={applyFilters} sx={{ height: '56px' }}>
              Apply Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {stats && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} md={2.4}>
            <Card sx={{ bgcolor: '#e3f2fd' }}>
              <CardContent>
                <Typography variant="caption">Total Customers</Typography>
                <Typography variant="h6">{stats.totalCustomers?.toLocaleString() || 0}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={2.4}>
            <Card sx={{ bgcolor: '#fff3e0' }}>
              <CardContent>
                <Typography variant="caption">Zero Consumption</Typography>
                <Typography variant="h6" color="error.main">{stats.zeroConsumption?.toLocaleString() || 0}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={2.4}>
            <Card sx={{ bgcolor: '#e8f5e8' }}>
              <CardContent>
                <Typography variant="caption">&gt;100m³</Typography>
                <Typography variant="h6" color="warning.main">{stats.highConsumption?.toLocaleString() || 0}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={2.4}>
            <Card sx={{ bgcolor: '#f3e5f5' }}>
              <CardContent>
                <Typography variant="caption">Average Consumption</Typography>
                <Typography variant="h6">{stats.averageConsumption?.toFixed(1) || 0} m³</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={2.4}>
            <Card sx={{ bgcolor: '#ffebee' }}>
              <CardContent>
                <Typography variant="caption">Total Consumption</Typography>
                <Typography variant="h6">{stats.totalConsumption?.toLocaleString() || 0} m³</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
              <TableCell><strong>Customer ID</strong></TableCell>
              <TableCell><strong>Name</strong></TableCell>
              <TableCell><strong>Meter Number</strong></TableCell>
              <TableCell align="right"><strong>Consumption (m³)</strong></TableCell>
              <TableCell align="right"><strong>Bill Amount (ETB)</strong></TableCell>
              <TableCell align="center"><strong>Meter Key</strong></TableCell>
              <TableCell align="center"><strong>Status</strong></TableCell>
              <TableCell align="center"><strong>Action</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={8} align="center"><CircularProgress /></TableCell></TableRow>
            ) : customers.length === 0 ? (
              <TableRow><TableCell colSpan={8} align="center">No customers found</TableCell></TableRow>
            ) : (
              customers.map((customer) => (
                <TableRow key={customer.id} hover>
                  <TableCell>{customer.id}</TableCell>
                  <TableCell>{customer.name}</TableCell>
                  <TableCell>{customer.meterNumber}</TableCell>
                  <TableCell align="right">
                    <Chip
                      label={`${customer.currentConsumption || 0} m³`}
                      size="small"
                      color={(customer.currentConsumption || 0) > 100 ? 'warning' : 
                             (customer.currentConsumption || 0) === 0 ? 'error' : 'success'}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">
                      {customer.currentBill ? `${customer.currentBill.toLocaleString()} ETB` : '0 ETB'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title={customer.meterKeyChanged ? 'Meter Key Changed' : 'Meter Key Unchanged'}>
                      {customer.meterKeyChanged ? (
                        <WarningIcon color="warning" />
                      ) : (
                        <CheckCircleIcon color="success" />
                      )}
                    </Tooltip>
                  </TableCell>
                  <TableCell align="center">
                    <Chip label={customer.status} size="small" color="success" />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="View Consumption History">
                      <IconButton size="small" onClick={() => handleViewHistory(customer)} color="primary">
                        <HistoryIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      {/* Pagination */}
      {totalItems > 0 && (
        <Box display="flex" justifyContent="center" alignItems="center" mt={3} gap={2}>
          <Button 
            variant="outlined" 
            onClick={() => handlePageChange(page - 1)} 
            disabled={page === 1 || loading}
            startIcon={<NavigateBeforeIcon />}
          >
            Previous
          </Button>
          <Typography variant="body2">
            Page {page} of {totalPages} ({totalItems.toLocaleString()} total customers)
          </Typography>
          <Button 
            variant="outlined" 
            onClick={() => handlePageChange(page + 1)} 
            disabled={page === totalPages || loading}
            endIcon={<NavigateNextIcon />}
          >
            Next
          </Button>
        </Box>
      )}

      {/* History Dialog */}
      <Dialog open={chartDialogOpen} onClose={() => setChartDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              <ReceiptIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Consumption & Bill History: {selectedCustomer?.name}
            </Typography>
            <IconButton onClick={() => setChartDialogOpen(false)}><RefreshIcon /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {customerHistory.length > 0 ? (
            <>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Meter Number: {selectedCustomer?.meterNumber}
                {selectedCustomer?.meterKeyChanged && (
                  <Chip 
                    label="Meter Changed" 
                    size="small" 
                    color="warning" 
                    sx={{ ml: 1 }}
                  />
                )}
              </Typography>
              
              <Box sx={{ mt: 2, height: 350 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={getChartData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" angle={-45} textAnchor="end" height={60} />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <RechartsTooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="consumption" stroke="#1976d2" name="Consumption (m³)" strokeWidth={2} dot={{ r: 4 }} />
                    <Line yAxisId="right" type="monotone" dataKey="billAmount" stroke="#f57c00" name="Bill Amount (ETB)" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
              
              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid item xs={4}>
                  <Card sx={{ bgcolor: '#e3f2fd' }}>
                    <CardContent>
                      <Typography variant="caption">Total Consumption</Typography>
                      <Typography variant="h6">{totalConsumptionHistory} m³</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={4}>
                  <Card sx={{ bgcolor: '#fff3e0' }}>
                    <CardContent>
                      <Typography variant="caption">Total Bill</Typography>
                      <Typography variant="h6">{totalBillHistory.toLocaleString()} ETB</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={4}>
                  <Card sx={{ bgcolor: '#e8f5e8' }}>
                    <CardContent>
                      <Typography variant="caption">Peak Consumption</Typography>
                      <Typography variant="h6">{peakConsumption} m³</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </>
          ) : (
            <Box textAlign="center" py={4}>
              <Typography color="textSecondary">
                No historical data available for this customer
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setChartDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}