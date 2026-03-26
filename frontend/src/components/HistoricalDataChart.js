// In HistoricalDataChart.js
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Chip, Box, Typography } from '@mui/material';
import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

export default function HistoricalDataChart({ dmaId, pointName }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sources, setSources] = useState({ manual: 0, mobile: 0 });

  useEffect(() => {
    fetchHistory();
  }, [dmaId, pointName]);

  const fetchHistory = async () => {
    try {
      const response = await axios.get(`${API_URL}/reading-history/${dmaId}/${pointName}`);
      const readings = response.data;
      
      // Count sources
      const manualCount = readings.filter(r => r.source === 'manual').length;
      const mobileCount = readings.filter(r => r.source === 'mobile').length;
      setSources({ manual: manualCount, mobile: mobileCount });
      
      // Format for chart
      const chartData = readings.map(r => ({
        date: new Date(r.readingDate).toLocaleDateString(),
        value: r.readingValue,
        source: r.source || (r.meterId === 'Mobile App' ? 'mobile' : 'manual')
      })).reverse(); // Oldest to newest for chart
      
      setData(chartData);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Typography>Loading...</Typography>;

  return (
    <Box>
      <Box display="flex" gap={1} mb={2}>
        <Chip 
          label={`Manual: ${sources.manual}`} 
          size="small" 
          color="primary" 
          variant="outlined"
        />
        <Chip 
          label={`Mobile: ${sources.mobile}`} 
          size="small" 
          color="success" 
          variant="outlined"
        />
        <Chip 
          label={`Total: ${data.length}`} 
          size="small" 
          color="info" 
        />
      </Box>
      
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke="#1976d2" 
            name="Reading (m³)"
            strokeWidth={2}
            dot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
}