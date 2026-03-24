import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://192.168.1.16:8000/api';

export default function HistoricalDataChart({ dmaId, pointName }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [readings, setReadings] = useState([]);

  useEffect(() => {
    fetchHistory();
  }, [dmaId, pointName]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_URL}/bulk-readings/${dmaId}/${pointName}/history?days=90`
      );
      
      // Format data for chart
      const formattedData = response.data.map(reading => ({
        date: new Date(reading.timestamp).toLocaleDateString(),
        value: reading.meterReading,
        timestamp: reading.timestamp
      })).reverse();
      
      setReadings(formattedData);
      setError(null);
    } catch (err) {
      console.error('Error fetching history:', err);
      setError('Failed to load historical data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>
    );
  }

  if (readings.length === 0) {
    return (
      <Alert severity="info" sx={{ m: 2 }}>
        No historical data available for {pointName}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Chart */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Reading Trends - Last 90 Days
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={readings}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" angle={-45} textAnchor="end" height={60} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#1976d2" 
              strokeWidth={2}
              name="Meter Reading (m³)"
            />
          </LineChart>
        </ResponsiveContainer>
      </Paper>

      {/* Data Table */}
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#1976d2' }}>
              <TableCell sx={{ color: 'white' }}>Date</TableCell>
              <TableCell sx={{ color: 'white' }} align="right">Reading (m³)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {readings.slice(0, 10).map((reading, idx) => (
              <TableRow key={idx}>
                <TableCell>{reading.date}</TableCell>
                <TableCell align="right">
                  <Chip 
                    label={`${reading.value} m³`}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}