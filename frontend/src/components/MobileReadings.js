import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Box
} from '@mui/material';
import axios from 'axios';
import { API_URL } from '../config';

export default function MobileReadings() {
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReadings();
  }, []);

  const fetchReadings = async () => {
    try {
      const response = await axios.get(`${API_URL}/mongo-readings`);
      setReadings(response.data.readings || []);
    } catch (error) {
      console.error('Failed to fetch mobile readings:', error);
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

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: '#1e3a8a' }}>
        📱 Mobile Bulk Readings
      </Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
        Total: {readings.length} readings from mobile app
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
            {readings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No readings yet. Use the mobile app to add readings.
                </TableCell>
              </TableRow>
            ) : (
              readings.map((reading) => (
                <TableRow key={reading._id} hover>
                  <TableCell>
                    {new Date(reading.timestamp).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={reading.dmaId} 
                      size="small"
                      color={reading.dmaId === 'DMA-JFR' ? 'error' : 'primary'}
                    />
                  </TableCell>
                  <TableCell>{reading.pointName}</TableCell>
                  <TableCell align="right">
                    <Typography fontWeight="bold">
                      {reading.meterReading.toLocaleString()} m³
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={reading.source || 'mobile'} size="small" color="success" />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}