import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  CircularProgress,
  Avatar,
  Divider,
  LinearProgress
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  WaterDrop as WaterIcon,
  Receipt as BillIcon,
  History as HistoryIcon,
  CheckCircle as PaidIcon,
  Pending as PendingIcon,
  Error as UnpaidIcon
} from '@mui/icons-material';
import axios from 'axios';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

const API_URL = 'http://192.168.1.111:8000/api';

export default function CustomerHistory({ customerId, onClose }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchId, setSearchId] = useState(customerId || '');
  const [customerData, setCustomerData] = useState(null);

  const fetchCustomerData = async (id) => {
    if (!id) return;
    
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/customers/history/${id}`);
      setCustomerData(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching customer:', err);
      setError('Customer not found or server error');
      setCustomerData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (customerId) {
      fetchCustomerData(customerId);
    }
  }, [customerId]);

  const handleSearch = () => {
    if (searchId.trim()) {
      fetchCustomerData(searchId.trim());
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'Paid': return <PaidIcon color="success" fontSize="small" />;
      case 'Pending': return <PendingIcon color="warning" fontSize="small" />;
      case 'Unpaid': return <UnpaidIcon color="error" fontSize="small" />;
      default: return null;
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Paid': return 'success';
      case 'Pending': return 'warning';
      case 'Unpaid': return 'error';
      default: return 'default';
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const chartData = customerData?.consumptionHistory?.map(item => ({
    month: item.month,
    consumption: item.consumption,
    bill: item.billAmount
  })) || [];

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: '#1e3a8a' }}>
        Customer History
      </Typography>

      {/* Search Bar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              label="Enter Customer ID"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              placeholder="e.g., CUST-001"
              variant="outlined"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleSearch}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Search Customer'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
      )}

      {loading && (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      )}

      {customerData && !loading && (
        <Grid container spacing={3}>
          {/* Customer Info Card */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <Avatar sx={{ bgcolor: '#1976d2', width: 56, height: 56, mr: 2 }}>
                    <PersonIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h5">{customerData.customerInfo.name}</Typography>
                    <Chip 
                      label={customerData.customerInfo.accountStatus}
                      size="small"
                      color={customerData.customerInfo.accountStatus === 'Active' ? 'success' : 'default'}
                    />
                  </Box>
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                <Grid container spacing={1}>
                  <Grid item xs={12}>
                    <Box display="flex" alignItems="center">
                      <EmailIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">{customerData.customerInfo.email}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12}>
                    <Box display="flex" alignItems="center">
                      <PhoneIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">{customerData.customerInfo.phone}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12}>
                    <Box display="flex" alignItems="center">
                      <LocationIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">{customerData.customerInfo.address}</Typography>
                    </Box>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />
                
                <Typography variant="subtitle2" gutterBottom>Meter Information</Typography>
                <Typography variant="body2">Meter #: {customerData.customerInfo.meterNumber}</Typography>
                <Typography variant="body2">Zone: {customerData.customerInfo.zone}</Typography>
                <Typography variant="body2">Connected: {customerData.customerInfo.connectionDate}</Typography>
                <Typography variant="body2">Credit Score: {customerData.customerInfo.creditScore}</Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Billing Summary */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Billing Summary</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6} md={3}>
                    <Paper sx={{ p: 2, bgcolor: '#e3f2fd', textAlign: 'center' }}>
                      <Typography variant="caption" color="textSecondary">Total Billed</Typography>
                      <Typography variant="h6">{formatCurrency(customerData.billingSummary.totalBilled)}</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Paper sx={{ p: 2, bgcolor: '#e8f5e8', textAlign: 'center' }}>
                      <Typography variant="caption" color="textSecondary">Total Paid</Typography>
                      <Typography variant="h6" color="success.main">{formatCurrency(customerData.billingSummary.totalPaid)}</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Paper sx={{ p: 2, bgcolor: '#ffebee', textAlign: 'center' }}>
                      <Typography variant="caption" color="textSecondary">Outstanding</Typography>
                      <Typography variant="h6" color="error">{formatCurrency(customerData.billingSummary.outstanding)}</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Paper sx={{ p: 2, bgcolor: '#fff3e0', textAlign: 'center' }}>
                      <Typography variant="caption" color="textSecondary">Avg Consumption</Typography>
                      <Typography variant="h6" color="warning.main">{customerData.billingSummary.averageConsumption} m³</Typography>
                    </Paper>
                  </Grid>
                </Grid>

                {/* Consumption Chart */}
                {chartData.length > 0 && (
                  <Box sx={{ mt: 3, height: 200 }}>
                    <Typography variant="subtitle2" gutterBottom>12-Month Consumption Trend</Typography>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="consumption" stroke="#1976d2" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Consumption History Table */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Consumption History</Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Month</TableCell>
                        <TableCell align="right">Consumption (m³)</TableCell>
                        <TableCell align="right">Bill Amount</TableCell>
                        <TableCell align="center">Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {customerData.consumptionHistory.map((row, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{row.month}</TableCell>
                          <TableCell align="right">{row.consumption} m³</TableCell>
                          <TableCell align="right">{formatCurrency(row.billAmount)}</TableCell>
                          <TableCell align="center">
                            <Chip 
                              icon={getStatusIcon(row.status)}
                              label={row.status}
                              size="small"
                              color={getStatusColor(row.status)}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Service History */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Service History</Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {customerData.serviceHistory.map((row, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{row.date}</TableCell>
                          <TableCell>
                            <Chip 
                              label={row.type}
                              size="small"
                              color={row.type === 'Maintenance' ? 'primary' : 'default'}
                            />
                          </TableCell>
                          <TableCell>{row.description}</TableCell>
                          <TableCell>
                            <Chip 
                              label={row.status}
                              size="small"
                              color={row.status === 'Completed' ? 'success' : 'warning'}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}