import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Chip
} from '@mui/material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import axios from 'axios';

const API_URL = 'http://192.168.1.111:8000/api';

const COLORS = ['#1976d2', '#f57c00', '#4ecdc4', '#ff6b6b', '#95a5a6', '#9b59b6'];

export default function DMACharts({ dmaId, pointName, pointType }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [chartType, setChartType] = useState('line');
  const [timeRange, setTimeRange] = useState(30);

  useEffect(() => {
    if (dmaId && pointName) {
      fetchHistory();
    }
  }, [dmaId, pointName, timeRange]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${API_URL}/readings/${dmaId}/${pointName}/history?days=${timeRange}`
      );
      
      // Format data for charts
      const formattedData = response.data.map(reading => ({
        date: new Date(reading.timestamp).toLocaleDateString(),
        time: new Date(reading.timestamp).toLocaleTimeString(),
        value: reading.meterReading,
        timestamp: reading.timestamp
      })).reverse(); // Show oldest to newest
      
      setHistoryData(formattedData);
      setError(null);
    } catch (err) {
      console.error('Error fetching history:', err);
      setError('Failed to load historical data');
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const calculateStats = () => {
    if (historyData.length === 0) return null;
    
    const values = historyData.map(d => d.value);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const max = Math.max(...values);
    const min = Math.min(...values);
    const last = values[values.length - 1];
    const first = values[0];
    const change = last - first;
    const changePercent = first ? ((change / first) * 100).toFixed(1) : 0;
    
    return { avg, max, min, last, first, change, changePercent };
  };

  const stats = calculateStats();

  const renderChart = () => {
    if (historyData.length === 0) {
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography color="textSecondary">
            No historical data available for this point
          </Typography>
        </Box>
      );
    }

    switch (chartType) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={historyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#1976d2"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 8 }}
                name="Meter Reading (m³)"
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={historyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#1976d2"
                fill="#1976d2"
                fillOpacity={0.3}
                name="Meter Reading (m³)"
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={historyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#1976d2" name="Meter Reading (m³)" />
            </BarChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <Box>
      {/* Header with controls */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">
          📊 {pointName} - Historical Data
          {pointType && (
            <Chip
              label={pointType}
              size="small"
              color={pointType === 'inlet' ? 'primary' : 'warning'}
              sx={{ ml: 2 }}
            />
          )}
        </Typography>
        <Box display="flex" gap={2}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Chart Type</InputLabel>
            <Select
              value={chartType}
              label="Chart Type"
              onChange={(e) => setChartType(e.target.value)}
            >
              <MenuItem value="line">Line Chart</MenuItem>
              <MenuItem value="area">Area Chart</MenuItem>
              <MenuItem value="bar">Bar Chart</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              label="Time Range"
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <MenuItem value={7}>Last 7 days</MenuItem>
              <MenuItem value={30}>Last 30 days</MenuItem>
              <MenuItem value={90}>Last 90 days</MenuItem>
              <MenuItem value={365}>Last year</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Statistics Cards */}
      {stats && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} md={2}>
            <Card sx={{ bgcolor: '#e3f2fd' }}>
              <CardContent>
                <Typography variant="caption" color="textSecondary">Average</Typography>
                <Typography variant="h6">{stats.avg.toFixed(1)} m³</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={2}>
            <Card sx={{ bgcolor: '#ffebee' }}>
              <CardContent>
                <Typography variant="caption" color="textSecondary">Maximum</Typography>
                <Typography variant="h6" color="error">{stats.max.toFixed(1)} m³</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={2}>
            <Card sx={{ bgcolor: '#e8f5e8' }}>
              <CardContent>
                <Typography variant="caption" color="textSecondary">Minimum</Typography>
                <Typography variant="h6" color="success.main">{stats.min.toFixed(1)} m³</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={2}>
            <Card sx={{ bgcolor: '#fff3e0' }}>
              <CardContent>
                <Typography variant="caption" color="textSecondary">Latest</Typography>
                <Typography variant="h6" color="warning.main">{stats.last.toFixed(1)} m³</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={2}>
            <Card sx={{ bgcolor: '#f3e5f5' }}>
              <CardContent>
                <Typography variant="caption" color="textSecondary">Change</Typography>
                <Typography
                  variant="h6"
                  color={stats.change >= 0 ? 'success.main' : 'error.main'}
                >
                  {stats.change >= 0 ? '+' : ''}{stats.change.toFixed(1)} m³
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={2}>
            <Card sx={{ bgcolor: '#e1f5fe' }}>
              <CardContent>
                <Typography variant="caption" color="textSecondary">% Change</Typography>
                <Typography
                  variant="h6"
                  color={stats.changePercent >= 0 ? 'success.main' : 'error.main'}
                >
                  {stats.changePercent}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Chart */}
      <Paper sx={{ p: 2, bgcolor: '#fafafa' }}>
        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          renderChart()
        )}
      </Paper>

      {/* Data Table */}
      {historyData.length > 0 && (
        <Paper sx={{ mt: 3, p: 2 }}>
          <Typography variant="h6" gutterBottom>Recent Readings</Typography>
          <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
            {historyData.slice(-10).reverse().map((reading, idx) => (
              <Box
                key={idx}
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                sx={{
                  py: 1,
                  borderBottom: '1px solid #eee',
                  '&:last-child': { borderBottom: 'none' }
                }}
              >
                <Typography variant="body2">{reading.date} {reading.time}</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {reading.value} m³
                </Typography>
              </Box>
            ))}
          </Box>
        </Paper>
      )}
    </Box>
  );
}