import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  TextField,
  Alert,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Stack,
  IconButton,
  Tooltip
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import {
  CalendarToday as CalendarIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

export default function DMAConsumptionAnalytics({ 
  dmaList = [], // Accept dmaList prop
  selectedDMAId = '', // Accept selectedDMAId prop to pre-select
  onClose // Optional close handler
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDMA, setSelectedDMA] = useState(selectedDMAId || '');
  const [readings, setReadings] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [periodType, setPeriodType] = useState('daily');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [historicalData, setHistoricalData] = useState([]);

  // Update selected DMA when prop changes
  useEffect(() => {
    if (selectedDMAId) {
      setSelectedDMA(selectedDMAId);
    }
  }, [selectedDMAId]);

  // Fetch DMA readings when selected changes
  useEffect(() => {
    if (selectedDMA) {
      fetchDMADetails();
    }
  }, [selectedDMA]);

  const fetchDMADetails = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/bulk-readings/${selectedDMA}`);
      const allReadings = response.data;
      allReadings.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      setReadings(allReadings);
      
      // Prepare historical data for charts
      const history = allReadings.map(r => ({
        date: new Date(r.timestamp).toLocaleDateString(),
        value: r.meterReading,
        pointName: r.pointName,
        type: r.pointType
      }));
      setHistoricalData(history);
      
    } catch (err) {
      setError('Failed to fetch DMA readings');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Update date fields based on period type
  useEffect(() => {
    if (periodType === 'daily') {
      // For daily, end date is same as start
      setEndDate(startDate);
    } else if (periodType === 'weekly') {
      // Set end date to start date + 6 days (Monday-Sunday week)
      const newEnd = new Date(startDate);
      newEnd.setDate(startDate.getDate() + 6);
      setEndDate(newEnd);
    } else if (periodType === '15days') {
      // Set end date to start date + 14 days
      const newEnd = new Date(startDate);
      newEnd.setDate(startDate.getDate() + 14);
      setEndDate(newEnd);
    } else if (periodType === 'monthly') {
      // Set end date to last day of the month
      const newEnd = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
      setEndDate(newEnd);
    }
  }, [periodType, startDate]);

  const calculateConsumption = () => {
    const periodStart = new Date(startDate);
    const periodEnd = new Date(endDate);
    
    periodStart.setHours(0, 0, 0, 0);
    periodEnd.setHours(23, 59, 59, 999);

    const periodReadings = readings.filter(r => {
      const readingDate = new Date(r.timestamp);
      return readingDate >= periodStart && readingDate <= periodEnd;
    });

    const pointData = {};
    
    periodReadings.forEach(reading => {
      if (!pointData[reading.pointName]) {
        pointData[reading.pointName] = {
          readings: [],
          firstReading: null,
          lastReading: null
        };
      }
      pointData[reading.pointName].readings.push(reading);
    });

    Object.keys(pointData).forEach(point => {
      const sorted = pointData[point].readings.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      pointData[point].firstReading = sorted[0];
      pointData[point].lastReading = sorted[sorted.length - 1];
      pointData[point].consumption = sorted.length > 1 
        ? sorted[sorted.length-1].meterReading - sorted[0].meterReading
        : 0;
      pointData[point].pointType = sorted[0]?.pointType || 'inlet';
    });

    let totalInflow = 0;
    let totalOutflow = 0;
    const details = [];

    Object.keys(pointData).forEach(point => {
      const data = pointData[point];
      if (data.pointType === 'inlet') {
        totalInflow += data.consumption;
      } else {
        totalOutflow += data.consumption;
      }
      details.push({
        name: point,
        type: data.pointType,
        consumption: data.consumption,
        firstReading: data.firstReading?.meterReading,
        lastReading: data.lastReading?.meterReading,
        firstDate: data.firstReading?.timestamp,
        lastDate: data.lastReading?.timestamp
      });
    });

    const netBalance = totalInflow - totalOutflow;
    const nrwLoss = totalInflow > 0 ? ((netBalance < 0 ? 0 : netBalance) / totalInflow * 100).toFixed(2) : 0;

    setAnalytics({
      startDate: periodStart,
      endDate: periodEnd,
      totalInflow,
      totalOutflow,
      netBalance,
      nrwLoss,
      details,
      periodType,
      totalDays: Math.round((periodEnd - periodStart) / (1000 * 60 * 60 * 24)) + 1
    });
  };

  const exportToCSV = () => {
    if (!analytics) return;
    
    let csvContent = "Data,Value\n";
    csvContent += `Start Date,${analytics.startDate.toLocaleDateString()}\n`;
    csvContent += `End Date,${analytics.endDate.toLocaleDateString()}\n`;
    csvContent += `Total Days,${analytics.totalDays}\n`;
    csvContent += `Total Inflow,${analytics.totalInflow} m³\n`;
    csvContent += `Total Outflow,${analytics.totalOutflow} m³\n`;
    csvContent += `Net Balance,${analytics.netBalance} m³\n`;
    csvContent += `NRW,${analytics.nrwLoss}%\n\n`;
    csvContent += "Point,Type,First Reading,Last Reading,Consumption\n";
    
    analytics.details.forEach(row => {
      csvContent += `${row.name},${row.type},${row.firstReading || 0},${row.lastReading || 0},${row.consumption}\n`;
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `consumption-${selectedDMA}-${new Date().toISOString()}.csv`;
    a.click();
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: '#1e3a8a' }}>
          📊 Consumption Analytics
        </Typography>
        {onClose && (
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        )}
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>Select DMA & Period</Typography>
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>DMA Zone</InputLabel>
              <Select
                value={selectedDMA}
                label="DMA Zone"
                onChange={(e) => setSelectedDMA(e.target.value)}
              >
                {dmaList && dmaList.length > 0 ? (
                  dmaList.map((dma) => (
                    <MenuItem key={dma.id} value={dma.id}>{dma.name}</MenuItem>
                  ))
                ) : (
                  <MenuItem value={selectedDMAId}>
                    {dmaList[0]?.name || selectedDMAId}
                  </MenuItem>
                )}
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Period Type</InputLabel>
              <Select
                value={periodType}
                label="Period Type"
                onChange={(e) => setPeriodType(e.target.value)}
              >
                <MenuItem value="daily">Daily</MenuItem>
                <MenuItem value="weekly">Weekly</MenuItem>
                <MenuItem value="15days">15 Days</MenuItem>
                <MenuItem value="monthly">Monthly</MenuItem>
              </Select>
            </FormControl>

            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={setStartDate}
                renderInput={(params) => <TextField {...params} fullWidth sx={{ mb: 2 }} />}
              />
              
              {periodType !== 'daily' && (
                <DatePicker
                  label="End Date"
                  value={endDate}
                  onChange={setEndDate}
                  renderInput={(params) => <TextField {...params} fullWidth sx={{ mb: 2 }} />}
                />
              )}
            </LocalizationProvider>

            <Stack direction="row" spacing={1}>
              <Button
                fullWidth
                variant="contained"
                onClick={calculateConsumption}
                startIcon={<CalendarIcon />}
                disabled={!selectedDMA}
              >
                Calculate
              </Button>
              {analytics && (
                <Tooltip title="Export to CSV">
                  <IconButton onClick={exportToCSV} color="primary">
                    <DownloadIcon />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          {loading && (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
          )}

          {analytics && !loading && (
            <Card sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Results: {new Date(analytics.startDate).toLocaleDateString()} - {new Date(analytics.endDate).toLocaleDateString()}
                <Chip 
                  label={`${analytics.totalDays} days`}
                  size="small"
                  sx={{ ml: 2 }}
                />
              </Typography>

              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6} md={3}>
                  <Card sx={{ bgcolor: '#e3f2fd' }}>
                    <CardContent>
                      <Typography variant="caption">Total Inflow</Typography>
                      <Typography variant="h6">{analytics.totalInflow.toLocaleString()} m³</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Card sx={{ bgcolor: '#fff3e0' }}>
                    <CardContent>
                      <Typography variant="caption">Total Outflow</Typography>
                      <Typography variant="h6">{analytics.totalOutflow.toLocaleString()} m³</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Card sx={{ bgcolor: '#e8f5e8' }}>
                    <CardContent>
                      <Typography variant="caption">Net Balance</Typography>
                      <Typography variant="h6" color={analytics.netBalance >= 0 ? 'success.main' : 'error.main'}>
                        {analytics.netBalance.toLocaleString()} m³
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Card sx={{ bgcolor: '#ffebee' }}>
                    <CardContent>
                      <Typography variant="caption">NRW %</Typography>
                      <Typography variant="h6" color={analytics.nrwLoss > 20 ? 'error.main' : 'success.main'}>
                        {analytics.nrwLoss}%
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Point</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell align="right">First Reading</TableCell>
                      <TableCell align="right">Last Reading</TableCell>
                      <TableCell align="right">Consumption</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {analytics.details.map((row, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{row.name}</TableCell>
                        <TableCell>
                          <Chip 
                            label={row.type}
                            size="small"
                            color={row.type === 'inlet' ? 'primary' : 'warning'}
                          />
                        </TableCell>
                        <TableCell align="right">
                          {row.firstReading ? `${row.firstReading.toLocaleString()} m³` : '-'}
                        </TableCell>
                        <TableCell align="right">
                          {row.lastReading ? `${row.lastReading.toLocaleString()} m³` : '-'}
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            label={`${row.consumption.toLocaleString()} m³`}
                            size="small"
                            color={row.consumption > 0 ? 'success' : 'default'}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {historicalData.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>30-Day Trend</Typography>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={historicalData.slice(-30)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" angle={-45} textAnchor="end" height={60} />
                      <YAxis />
                      <RechartsTooltip />
                      <Line type="monotone" dataKey="value" stroke="#1976d2" name="Reading" />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              )}
            </Card>
          )}

          {!selectedDMA && !loading && (
            <Paper sx={{ p: 4, textAlign: 'center', bgcolor: '#f5f5f5' }}>
              <Typography color="textSecondary">
                Select a DMA zone to view consumption analytics
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Paper>
  );
}