import React, { useState, useEffect } from 'react';
import {
  Paper, Typography, Grid, Card, CardContent, Button,
  FormControl, InputLabel, Select, MenuItem, CircularProgress,
  Chip, Divider, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Box, Alert, Tabs, Tab
} from '@mui/material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import axios from 'axios';
import { API_URL } from '../config';

///const API_URL = 'http://localhost:8000/api';
const COLORS = ['#2e7d32', '#d32f2f'];

export default function NRWCalculator() {
  const [calcLoading, setCalcLoading] = useState({
    jafar: false,
    yeka: false,
    total: false
  });
  const [calcResult, setCalcResult] = useState({
    jafar: null,
    yeka: null,
    total: null
  });
  const [selectedPeriods, setSelectedPeriods] = useState({
    jafar: '',
    yeka: '',
    total: ''
  });
  const [availablePeriods, setAvailablePeriods] = useState([]);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    const fetchPeriods = async () => {
      try {
        const response = await axios.get(`${API_URL}/available-periods`);
        setAvailablePeriods(response.data.periods || []);
        if (response.data.periods?.length > 0) {
          setSelectedPeriods({
            jafar: response.data.periods[0].id,
            yeka: response.data.periods[0].id,
            total: response.data.periods[0].id
          });
        }
      } catch (error) {
        console.error('Failed to fetch periods:', error);
      }
    };
    fetchPeriods();
  }, []);

  const calculateNRW = async (dmaType, periodId) => {
    if (!periodId) return;
    
    setCalcLoading(prev => ({ ...prev, [dmaType]: true }));
    setError(null);
    
    try {
      const response = await axios.post(`${API_URL}/nrw/calculate`, {
        periodId: periodId
      });
      
      let resultData;
      if (dmaType === 'total') {
        resultData = response.data;
      } else if (dmaType === 'jafar') {
        const jafarData = response.data.dmNRW.find(d => d.dmaId === 'DMA-JFR');
        resultData = {
          ...response.data,
          dmNRW: [jafarData],
          total: {
            systemInput: jafarData.systemInput,
            billedConsumption: jafarData.billedConsumption,
            nrwVolume: jafarData.nrwVolume,
            nrwPercentage: jafarData.nrwPercentage,
            totalCustomers: jafarData.customerCount,
            totalActiveMeters: jafarData.activeMeters
          }
        };
      } else if (dmaType === 'yeka') {
        const yekaData = response.data.dmNRW.find(d => d.dmaId === 'DMA-YKA');
        resultData = {
          ...response.data,
          dmNRW: [yekaData],
          total: {
            systemInput: yekaData.systemInput,
            billedConsumption: yekaData.billedConsumption,
            nrwVolume: yekaData.nrwVolume,
            nrwPercentage: yekaData.nrwPercentage,
            totalCustomers: yekaData.customerCount,
            totalActiveMeters: yekaData.activeMeters
          }
        };
      }
      
      setCalcResult(prev => ({ ...prev, [dmaType]: resultData }));
    } catch (error) {
      console.error('NRW calculation failed:', error);
      setError(`Failed to calculate NRW for ${dmaType}. Please try again.`);
    } finally {
      setCalcLoading(prev => ({ ...prev, [dmaType]: false }));
    }
  };

  useEffect(() => {
    if (selectedPeriods.jafar) calculateNRW('jafar', selectedPeriods.jafar);
  }, [selectedPeriods.jafar]);

  useEffect(() => {
    if (selectedPeriods.yeka) calculateNRW('yeka', selectedPeriods.yeka);
  }, [selectedPeriods.yeka]);

  useEffect(() => {
    if (selectedPeriods.total) calculateNRW('total', selectedPeriods.total);
  }, [selectedPeriods.total]);

  const getNRWColor = (percentage) => {
    if (percentage > 40) return '#d32f2f';
    if (percentage > 25) return '#f57c00';
    if (percentage > 15) return '#ffa000';
    return '#388e3c';
  };

  const getNRWStatus = (percentage) => {
    if (percentage > 40) return 'Critical';
    if (percentage > 25) return 'High';
    if (percentage > 15) return 'Medium';
    return 'Good';
  };

  const getComparisonData = () => {
    if (!calcResult.jafar || !calcResult.yeka) return [];
    return [
      {
        name: 'Jafar DMA',
        systemInput: calcResult.jafar.total.systemInput,
        billedConsumption: calcResult.jafar.total.billedConsumption,
        nrwVolume: Math.abs(calcResult.jafar.total.nrwVolume),
        nrwPercentage: calcResult.jafar.total.nrwPercentage
      },
      {
        name: 'Yeka DMA',
        systemInput: calcResult.yeka.total.systemInput,
        billedConsumption: calcResult.yeka.total.billedConsumption,
        nrwVolume: Math.abs(calcResult.yeka.total.nrwVolume),
        nrwPercentage: calcResult.yeka.total.nrwPercentage
      }
    ];
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: '#1e3a8a' }}>
        💧 Non-Revenue Water (NRW) Calculator
      </Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        Using REAL data from:
        • System Inflow: <strong>DMA BULK</strong> (Water Balance)
        • Billed Consumption: <strong>CUSTOMERS</strong> (Customer Bills)
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
          <Tab label="📊 Total System" />
          <Tab label="📍 Jafar DMA" />
          <Tab label="📍 Yeka DMA" />
        </Tabs>
      </Box>

      {/* Total System View */}
      {activeTab === 0 && (
        <Box>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Select Period</InputLabel>
                <Select
                  value={selectedPeriods.total}
                  label="Select Period"
                  onChange={(e) => setSelectedPeriods(prev => ({ ...prev, total: e.target.value }))}
                >
                  {availablePeriods.map((period) => (
                    <MenuItem key={period.id} value={period.id}>
                      {period.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              {calcLoading.total && <CircularProgress size={24} />}
              {calcResult.total && !calcLoading.total && (
                <Chip label="Data Loaded" color="success" size="small" />
              )}
            </Grid>
          </Grid>

          {calcLoading.total ? (
            <Box textAlign="center" py={4}>
              <CircularProgress />
              <Typography sx={{ mt: 2 }}>Calculating NRW...</Typography>
            </Box>
          ) : calcResult.total ? (
            <>
              <Card sx={{ mb: 4, bgcolor: '#f5f5f5' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {calcResult.total.period.name} - Total System
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                      <Typography variant="subtitle2" color="textSecondary">
                        System Input (from DMA BULK)
                      </Typography>
                      <Typography variant="h4">
                        {calcResult.total.total.systemInput.toLocaleString()} m³
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="subtitle2" color="textSecondary">
                        Billed Consumption (from CUSTOMERS)
                      </Typography>
                      <Typography variant="h4" sx={{ color: '#2e7d32' }}>
                        {calcResult.total.total.billedConsumption.toLocaleString()} m³
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="subtitle2" color="textSecondary">
                        NRW Volume
                      </Typography>
                      <Typography variant="h4" color="error">
                        {calcResult.total.total.nrwVolume.toLocaleString()} m³
                      </Typography>
                    </Grid>
                  </Grid>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Box>
                    <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                      NRW Percentage
                    </Typography>
                    <Typography variant="h2" sx={{ color: getNRWColor(calcResult.total.total.nrwPercentage) }}>
                      {calcResult.total.total.nrwPercentage}%
                    </Typography>
                    <Chip 
                      label={getNRWStatus(calcResult.total.total.nrwPercentage)}
                      sx={{ mt: 1, bgcolor: getNRWColor(calcResult.total.total.nrwPercentage), color: 'white' }}
                    />
                  </Box>
                </CardContent>
              </Card>

              <Typography variant="h6" gutterBottom>
                DMA Comparison
              </Typography>
              <Card sx={{ mb: 4, p: 2 }}>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={getComparisonData()} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="systemInput" fill="#1976d2" name="System Input (m³)" />
                    <Bar dataKey="billedConsumption" fill="#2e7d32" name="Billed (m³)" />
                    <Bar dataKey="nrwVolume" fill="#d32f2f" name="NRW Volume (m³)" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              <Typography variant="h6" gutterBottom>
                Per DMA Breakdown
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                      <TableCell><strong>DMA</strong></TableCell>
                      <TableCell align="right"><strong>Period</strong></TableCell>
                      <TableCell align="right"><strong>System Input (m³)</strong></TableCell>
                      <TableCell align="right"><strong>Billed (m³)</strong></TableCell>
                      <TableCell align="right"><strong>NRW Volume (m³)</strong></TableCell>
                      <TableCell align="right"><strong>NRW %</strong></TableCell>
                      <TableCell align="right"><strong>Customers</strong></TableCell>
                      <TableCell align="right"><strong>Active Meters</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow hover>
                      <TableCell><strong>Jafar DMA</strong></TableCell>
                      <TableCell align="right">{calcResult.jafar?.period?.name || '-'}</TableCell>
                      <TableCell align="right">{calcResult.jafar?.total?.systemInput?.toLocaleString() || 0}</TableCell>
                      <TableCell align="right">{calcResult.jafar?.total?.billedConsumption?.toLocaleString() || 0}</TableCell>
                      <TableCell align="right" sx={{ color: 'error.main' }}>
                        {calcResult.jafar?.total?.nrwVolume?.toLocaleString() || 0}
                      </TableCell>
                      <TableCell align="right">
                        <Chip
                          label={`${calcResult.jafar?.total?.nrwPercentage || 0}%`}
                          size="small"
                          sx={{
                            bgcolor: getNRWColor(calcResult.jafar?.total?.nrwPercentage || 0),
                            color: 'white'
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">{calcResult.jafar?.dmNRW[0]?.customerCount?.toLocaleString() || 0}</TableCell>
                      <TableCell align="right">{calcResult.jafar?.dmNRW[0]?.activeMeters?.toLocaleString() || 0}</TableCell>
                    </TableRow>
                    <TableRow hover>
                      <TableCell><strong>Yeka DMA</strong></TableCell>
                      <TableCell align="right">{calcResult.yeka?.period?.name || '-'}</TableCell>
                      <TableCell align="right">{calcResult.yeka?.total?.systemInput?.toLocaleString() || 0}</TableCell>
                      <TableCell align="right">{calcResult.yeka?.total?.billedConsumption?.toLocaleString() || 0}</TableCell>
                      <TableCell align="right" sx={{ color: 'error.main' }}>
                        {calcResult.yeka?.total?.nrwVolume?.toLocaleString() || 0}
                      </TableCell>
                      <TableCell align="right">
                        <Chip
                          label={`${calcResult.yeka?.total?.nrwPercentage || 0}%`}
                          size="small"
                          sx={{
                            bgcolor: getNRWColor(calcResult.yeka?.total?.nrwPercentage || 0),
                            color: 'white'
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">{calcResult.yeka?.dmNRW[0]?.customerCount?.toLocaleString() || 0}</TableCell>
                      <TableCell align="right">{calcResult.yeka?.dmNRW[0]?.activeMeters?.toLocaleString() || 0}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          ) : null}
        </Box>
      )}

      {/* Jafar DMA View */}
      {activeTab === 1 && (
        <Box>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Select Period for Jafar DMA</InputLabel>
                <Select
                  value={selectedPeriods.jafar}
                  label="Select Period for Jafar DMA"
                  onChange={(e) => setSelectedPeriods(prev => ({ ...prev, jafar: e.target.value }))}
                >
                  {availablePeriods.map((period) => (
                    <MenuItem key={period.id} value={period.id}>
                      {period.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              {calcLoading.jafar && <CircularProgress size={24} />}
              {calcResult.jafar && !calcLoading.jafar && (
                <Chip label={`Period: ${calcResult.jafar.period.name}`} color="info" size="small" />
              )}
            </Grid>
          </Grid>

          {calcLoading.jafar ? (
            <Box textAlign="center" py={4}>
              <CircularProgress />
              <Typography sx={{ mt: 2 }}>Calculating NRW for Jafar DMA...</Typography>
            </Box>
          ) : calcResult.jafar ? (
            <>
              <Card sx={{ mb: 4, bgcolor: '#e3f2fd' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ color: '#1976d2' }}>
                    📍 Jafar DMA - {calcResult.jafar.period.name}
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                      <Typography variant="subtitle2" color="textSecondary">System Input</Typography>
                      <Typography variant="h4">{calcResult.jafar.total.systemInput.toLocaleString()} m³</Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="subtitle2" color="textSecondary">Billed Consumption</Typography>
                      <Typography variant="h4" sx={{ color: '#2e7d32' }}>
                        {calcResult.jafar.total.billedConsumption.toLocaleString()} m³
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="subtitle2" color="textSecondary">NRW Volume</Typography>
                      <Typography variant="h4" color="error">
                        {calcResult.jafar.total.nrwVolume.toLocaleString()} m³
                      </Typography>
                    </Grid>
                  </Grid>
                  <Divider sx={{ my: 2 }} />
                  <Box display="flex" alignItems="center" gap={2}>
                    <Typography variant="h2" sx={{ color: getNRWColor(calcResult.jafar.total.nrwPercentage) }}>
                      {calcResult.jafar.total.nrwPercentage}%
                    </Typography>
                    <Chip 
                      label={getNRWStatus(calcResult.jafar.total.nrwPercentage)}
                      sx={{ bgcolor: getNRWColor(calcResult.jafar.total.nrwPercentage), color: 'white' }}
                    />
                  </Box>
                </CardContent>
              </Card>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>NRW Composition</Typography>
                      <Box sx={{ height: 280, width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={[
                                { name: 'Billed Consumption', value: calcResult.jafar.total.billedConsumption },
                                { name: 'NRW Volume', value: Math.abs(calcResult.jafar.total.nrwVolume) }
                              ]}
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              labelLine={false}
                            >
                              <Cell fill={COLORS[0]} />
                              <Cell fill={COLORS[1]} />
                            </Pie>
                            <Tooltip formatter={(value) => `${value.toLocaleString()} m³`} />
                            <Legend verticalAlign="bottom" height={36} />
                          </PieChart>
                        </ResponsiveContainer>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card sx={{ bgcolor: '#fff3e0', height: '100%' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>📊 Customer Statistics</Typography>
                      <Box sx={{ mt: 2 }}>
                        <Box display="flex" justifyContent="space-between" mb={2}>
                          <Typography>Total Customers</Typography>
                          <Typography fontWeight="bold">{calcResult.jafar.dmNRW[0]?.customerCount?.toLocaleString() || 0}</Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between" mb={2}>
                          <Typography>Active Meters</Typography>
                          <Typography fontWeight="bold">{calcResult.jafar.dmNRW[0]?.activeMeters?.toLocaleString() || 0}</Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between" mb={2}>
                          <Typography>Average Consumption per Customer</Typography>
                          <Typography fontWeight="bold">
                            {(calcResult.jafar.total.billedConsumption / (calcResult.jafar.dmNRW[0]?.customerCount || 1)).toFixed(1)} m³
                          </Typography>
                        </Box>
                        <Divider sx={{ my: 2 }} />
                        <Box display="flex" justifyContent="space-between">
                          <Typography>Financial Loss</Typography>
                          <Typography color="error.main" fontWeight="bold">
                            Birr {Math.abs(calcResult.jafar.total.nrwVolume * 32.00).toLocaleString()}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </>
          ) : null}
        </Box>
      )}

      {/* Yeka DMA View */}
      {activeTab === 2 && (
        <Box>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Select Period for Yeka DMA</InputLabel>
                <Select
                  value={selectedPeriods.yeka}
                  label="Select Period for Yeka DMA"
                  onChange={(e) => setSelectedPeriods(prev => ({ ...prev, yeka: e.target.value }))}
                >
                  {availablePeriods.map((period) => (
                    <MenuItem key={period.id} value={period.id}>
                      {period.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              {calcLoading.yeka && <CircularProgress size={24} />}
              {calcResult.yeka && !calcLoading.yeka && (
                <Chip label={`Period: ${calcResult.yeka.period.name}`} color="info" size="small" />
              )}
            </Grid>
          </Grid>

          {calcLoading.yeka ? (
            <Box textAlign="center" py={4}>
              <CircularProgress />
              <Typography sx={{ mt: 2 }}>Calculating NRW for Yeka DMA...</Typography>
            </Box>
          ) : calcResult.yeka ? (
            <>
              <Card sx={{ mb: 4, bgcolor: '#e8f5e9' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ color: '#2e7d32' }}>
                    📍 Yeka DMA - {calcResult.yeka.period.name}
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                      <Typography variant="subtitle2" color="textSecondary">System Input</Typography>
                      <Typography variant="h4">{calcResult.yeka.total.systemInput.toLocaleString()} m³</Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="subtitle2" color="textSecondary">Billed Consumption</Typography>
                      <Typography variant="h4" sx={{ color: '#2e7d32' }}>
                        {calcResult.yeka.total.billedConsumption.toLocaleString()} m³
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="subtitle2" color="textSecondary">NRW Volume</Typography>
                      <Typography variant="h4" color="error">
                        {calcResult.yeka.total.nrwVolume.toLocaleString()} m³
                      </Typography>
                    </Grid>
                  </Grid>
                  <Divider sx={{ my: 2 }} />
                  <Box display="flex" alignItems="center" gap={2}>
                    <Typography variant="h2" sx={{ color: getNRWColor(calcResult.yeka.total.nrwPercentage) }}>
                      {calcResult.yeka.total.nrwPercentage}%
                    </Typography>
                    <Chip 
                      label={getNRWStatus(calcResult.yeka.total.nrwPercentage)}
                      sx={{ bgcolor: getNRWColor(calcResult.yeka.total.nrwPercentage), color: 'white' }}
                    />
                  </Box>
                </CardContent>
              </Card>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>NRW Composition</Typography>
                      <Box sx={{ height: 280, width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={[
                                { name: 'Billed Consumption', value: calcResult.yeka.total.billedConsumption },
                                { name: 'NRW Volume', value: Math.abs(calcResult.yeka.total.nrwVolume) }
                              ]}
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              labelLine={false}
                            >
                              <Cell fill={COLORS[0]} />
                              <Cell fill={COLORS[1]} />
                            </Pie>
                            <Tooltip formatter={(value) => `${value.toLocaleString()} m³`} />
                            <Legend verticalAlign="bottom" height={36} />
                          </PieChart>
                        </ResponsiveContainer>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card sx={{ bgcolor: '#fff3e0', height: '100%' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>📊 Customer Statistics</Typography>
                      <Box sx={{ mt: 2 }}>
                        <Box display="flex" justifyContent="space-between" mb={2}>
                          <Typography>Total Customers</Typography>
                          <Typography fontWeight="bold">{calcResult.yeka.dmNRW[0]?.customerCount?.toLocaleString() || 0}</Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between" mb={2}>
                          <Typography>Active Meters</Typography>
                          <Typography fontWeight="bold">{calcResult.yeka.dmNRW[0]?.activeMeters?.toLocaleString() || 0}</Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between" mb={2}>
                          <Typography>Average Consumption per Customer</Typography>
                          <Typography fontWeight="bold">
                            {(calcResult.yeka.total.billedConsumption / (calcResult.yeka.dmNRW[0]?.customerCount || 1)).toFixed(1)} m³
                          </Typography>
                        </Box>
                        <Divider sx={{ my: 2 }} />
                        <Box display="flex" justifyContent="space-between">
                          <Typography>Financial Loss</Typography>
                          <Typography color="error.main" fontWeight="bold">
                            Birr {Math.abs(calcResult.yeka.total.nrwVolume * 32.00).toLocaleString()}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </>
          ) : null}
        </Box>
      )}
    </Paper>
  );
}