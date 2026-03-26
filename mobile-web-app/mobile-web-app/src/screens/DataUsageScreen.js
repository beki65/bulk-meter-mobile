import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  LinearProgress,
  Divider
} from '@mui/material';
import {
  Wifi as WifiIcon,
  NetworkCell as MobileIcon,
  DataUsage as DataIcon,
  DeleteSweep as ResetIcon
} from '@mui/icons-material';
import { getDataUsage, resetDataUsage } from '../utils/dataUsage';

export default function DataUsageScreen() {
  const [usage, setUsage] = useState(null);

  useEffect(() => {
    loadUsage();
  }, []);

  const loadUsage = async () => {
    const data = await getDataUsage();
    setUsage(data);
  };

  const handleReset = async () => {
    if (window.confirm('Reset data usage statistics?')) {
      await resetDataUsage();
      loadUsage();
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!usage) return null;

  const totalMB = usage.total / (1024 * 1024);
  const wifiPercent = (usage.wifi / usage.total) * 100 || 0;
  const mobilePercent = (usage.mobile / usage.total) * 100 || 0;

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: '#1e3a8a' }}>
        Data Usage
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Paper sx={{ p: 2, bgcolor: '#e3f2fd', textAlign: 'center' }}>
                <WifiIcon sx={{ fontSize: 40, color: '#1976d2', mb: 1 }} />
                <Typography variant="h6">{formatBytes(usage.wifi)}</Typography>
                <Typography variant="caption">WiFi</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6}>
              <Paper sx={{ p: 2, bgcolor: '#fff3e0', textAlign: 'center' }}>
                <MobileIcon sx={{ fontSize: 40, color: '#f57c00', mb: 1 }} />
                <Typography variant="h6">{formatBytes(usage.mobile)}</Typography>
                <Typography variant="caption">Mobile Data</Typography>
              </Paper>
            </Grid>
          </Grid>

          <Box sx={{ mt: 3 }}>
            <Typography variant="body2" gutterBottom>Usage Distribution</Typography>
            <LinearProgress 
              variant="determinate" 
              value={wifiPercent} 
              sx={{ height: 10, borderRadius: 5, mb: 1 }}
            />
            <Box display="flex" justifyContent="space-between">
              <Typography variant="caption">WiFi: {wifiPercent.toFixed(1)}%</Typography>
              <Typography variant="caption">Mobile: {mobilePercent.toFixed(1)}%</Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="body2">Total Data Used</Typography>
              <Typography variant="h4">{formatBytes(usage.total)}</Typography>
              <Typography variant="caption" color="textSecondary">
                Last reset: {new Date(usage.lastReset).toLocaleDateString()}
              </Typography>
            </Box>
            <Button 
              variant="outlined" 
              startIcon={<ResetIcon />}
              onClick={handleReset}
              size="small"
            >
              Reset
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Alert severity="info">
        <Typography variant="body2">
          📱 On mobile data, large syncs are paused. 
          Connect to WiFi for best performance.
        </Typography>
      </Alert>
    </Box>
  );
}