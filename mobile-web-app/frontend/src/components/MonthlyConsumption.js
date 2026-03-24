import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import {
  Info as InfoIcon,
  Calculate as CalculateIcon
} from '@mui/icons-material';
import axios from 'axios';

const API_URL = 'http://192.168.1.111:8000/api';

// Month names and target dates
const MONTHS = [
  { name: 'January', targetDay: 13, targetMonth: 1 },
  { name: 'February', targetDay: 12, targetMonth: 2 },
  { name: 'March', targetDay: 14, targetMonth: 3 },
  { name: 'April', targetDay: 13, targetMonth: 4 },
  { name: 'May', targetDay: 13, targetMonth: 5 },
  { name: 'June', targetDay: 12, targetMonth: 6 },
  { name: 'July', targetDay: 12, targetMonth: 7 },
  { name: 'August', targetDay: 11, targetMonth: 8 },
  { name: 'September', targetDay: 12, targetMonth: 9 },
  { name: 'October', targetDay: 15, targetMonth: 10 },
  { name: 'November', targetDay: 14, targetMonth: 11 },
  { name: 'December', targetDay: 14, targetMonth: 12 }
];

export default function MonthlyConsumption({ dmaId, pointName }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [readings, setReadings] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [chartType, setChartType] = useState('bar');
  const [year, setYear] = useState(2025);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (dmaId && pointName) {
      fetchAllReadings();
    }
  }, [dmaId, pointName]);

  const fetchAllReadings = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${API_URL}/readings/${dmaId}/${pointName}/history?days=730`
      );
      
      const allReadings = response.data.sort((a, b) => 
        new Date(a.timestamp) - new Date(b.timestamp)
      );
      
      setReadings(allReadings);
      calculateProRatedConsumption(allReadings);
      
    } catch (err) {
      console.error('Error fetching readings:', err);
      setError('Failed to load readings');
    } finally {
      setLoading(false);
    }
  };

  // Find the closest reading to a target date
  const findClosestReading = (readingsList, targetDate) => {
    if (readingsList.length === 0) return null;
    
    const targetTime = targetDate.getTime();
    
    let closest = readingsList[0];
    let smallestDiff = Math.abs(new Date(closest.timestamp).getTime() - targetTime);
    
    for (let i = 1; i < readingsList.length; i++) {
      const readingTime = new Date(readingsList[i].timestamp).getTime();
      const diff = Math.abs(readingTime - targetTime);
      
      if (diff < smallestDiff) {
        smallestDiff = diff;
        closest = readingsList[i];
      }
    }
    
    return {
      ...closest,
      dateDiff: Math.round(smallestDiff / (1000 * 60 * 60 * 24)) // difference in days
    };
  };

  // Calculate pro-rated consumption
  const calculateProRatedConsumption = (readingsList) => {
    if (readingsList.length === 0) {
      setMonthlyData([]);
      return;
    }

    // Generate target dates for each month
    const monthlyReadings = [];
    
    for (let month = 0; month < 12; month++) {
      const targetDay = MONTHS[month].targetDay;
      const targetDate = new Date(year, month, targetDay);
      
      const closestReading = findClosestReading(readingsList, targetDate);
      
      if (closestReading) {
        monthlyReadings.push({
          month: month,
          monthName: MONTHS[month].name,
          targetDate: targetDate,
          actualDate: new Date(closestReading.timestamp),
          reading: closestReading.meterReading,
          readingId: closestReading._id,
          dateDiff: closestReading.dateDiff,
          originalReading: closestReading
        });
      } else {
        monthlyReadings.push({
          month: month,
          monthName: MONTHS[month].name,
          targetDate: targetDate,
          actualDate: null,
          reading: null,
          dateDiff: null
        });
      }
    }

    // Calculate pro-rated consumption
    const consumptionData = [];
    
    for (let i = 0; i < monthlyReadings.length; i++) {
      const current = monthlyReadings[i];
      
      if (current.reading === null) {
        consumptionData.push({
          month: current.monthName,
          monthNum: i + 1,
          reading: null,
          previousReading: null,
          consumption: null,
          actualDate: null,
          targetDate: current.targetDate,
          hasData: false,
          formula: null
        });
        continue;
      }
      
      // Find the closest previous month with a reading
      let prevReadingData = null;
      
      for (let j = i - 1; j >= 0; j--) {
        if (monthlyReadings[j].reading !== null) {
          prevReadingData = {
            reading: monthlyReadings[j].reading,
            actualDate: monthlyReadings[j].actualDate,
            targetDate: monthlyReadings[j].targetDate,
            monthName: monthlyReadings[j].monthName
          };
          break;
        }
      }
      
      if (prevReadingData) {
        // Calculate pro-rated consumption using the formula:
        // (CurrentReading - PrevReading) * (TargetDateGap) / (ActualDateGap)
        
        const currentActualDate = current.actualDate;
        const prevActualDate = prevReadingData.actualDate;
        
        // Target date gap (30 days for Dec-Nov in your example)
        const targetDateGap = (current.targetDate - prevReadingData.targetDate) / (1000 * 60 * 60 * 24);
        
        // Actual date gap between readings
        const actualDateGap = (currentActualDate - prevActualDate) / (1000 * 60 * 60 * 24);
        
        // Raw difference in readings
        const readingDiff = current.reading - prevReadingData.reading;
        
        // Pro-rated consumption
        let proRatedConsumption = 0;
        if (actualDateGap > 0) {
          proRatedConsumption = (readingDiff * targetDateGap) / actualDateGap;
        }
        
        // Calculate adjustment factor for display
        const adjustmentFactor = targetDateGap / actualDateGap;
        
        consumptionData.push({
          month: current.monthName,
          monthNum: i + 1,
          reading: current.reading,
          readingDate: current.actualDate,
          previousReading: prevReadingData.reading,
          previousMonth: prevReadingData.monthName,
          previousDate: prevActualDate,
          targetDate: current.targetDate,
          previousTargetDate: prevReadingData.targetDate,
          targetDateGap: Math.round(targetDateGap),
          actualDateGap: Math.round(actualDateGap),
          readingDiff: readingDiff,
          consumption: proRatedConsumption > 0 ? proRatedConsumption : 0,
          adjustmentFactor: adjustmentFactor.toFixed(3),
          formula: `${readingDiff.toFixed(1)} × ${targetDateGap} / ${actualDateGap} = ${proRatedConsumption.toFixed(1)} m³`,
          hasData: true,
          isEstimated: Math.abs(actualDateGap - targetDateGap) > 5, // Estimated if dates differ significantly
          rawConsumption: readingDiff
        });
      } else {
        // First month with data
        consumptionData.push({
          month: current.monthName,
          monthNum: i + 1,
          reading: current.reading,
          readingDate: current.actualDate,
          previousReading: null,
          consumption: 0,
          targetDate: current.targetDate,
          hasData: true,
          isFirst: true,
          formula: 'Baseline reading'
        });
      }
    }

    setMonthlyData(consumptionData);
  };

  // Calculate statistics
  const calculateStats = () => {
    const validData = monthlyData.filter(d => d.hasData && d.consumption > 0);
    if (validData.length === 0) return null;
    
    const consumptions = validData.map(d => d.consumption);
    const rawConsumptions = validData.map(d => d.rawConsumption || 0);
    
    const avg = consumptions.reduce((a, b) => a + b, 0) / consumptions.length;
    const max = Math.max(...consumptions);
    const min = Math.min(...consumptions);
    const total = consumptions.reduce((a, b) => a + b, 0);
    
    const totalRaw = rawConsumptions.reduce((a, b) => a + b, 0);
    const adjustmentFactor = total > 0 ? (totalRaw / total).toFixed(3) : 1;
    
    return { avg, max, min, total, totalRaw, adjustmentFactor };
  };

  const stats = calculateStats();

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  };

  const renderChart = () => {
    const chartData = monthlyData.filter(d => d.hasData).map(d => ({
      month: d.month.substring(0, 3),
      consumption: Number(d.consumption.toFixed(1)),
      rawConsumption: d.rawConsumption ? Number(d.rawConsumption.toFixed(1)) : 0,
      isEstimated: d.isEstimated || false
    }));

    if (chartData.length === 0) {
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography color="textSecondary">
            No monthly data available for {year}
          </Typography>
        </Box>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <RechartsTooltip 
            formatter={(value, name) => {
              if (name === 'consumption') return [`${value} m³`, 'Pro-rated Consumption'];
              if (name === 'rawConsumption') return [`${value} m³`, 'Raw Difference'];
              return [value, name];
            }}
            labelFormatter={(label) => `${label} ${year}`}
          />
          <Legend />
          <Bar 
            dataKey="consumption" 
            fill="#1976d2" 
            name="Pro-rated Consumption (m³)"
            radius={[4, 4, 0, 0]}
          />
          {showDetails && (
            <Bar 
              dataKey="rawConsumption" 
              fill="#f57c00" 
              name="Raw Reading Diff (m³)"
              radius={[4, 4, 0, 0]}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    );
  };

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">
          📊 Monthly Consumption (Pro-rated) - {pointName}
        </Typography>
        <Box display="flex" gap={2}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Year</InputLabel>
            <Select
              value={year}
              label="Year"
              onChange={(e) => {
                setYear(e.target.value);
                calculateProRatedConsumption(readings);
              }}
            >
              <MenuItem value={2025}>2025</MenuItem>
              <MenuItem value={2024}>2024</MenuItem>
              <MenuItem value={2023}>2023</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Chart Type</InputLabel>
            <Select
              value={chartType}
              label="Chart Type"
              onChange={(e) => setChartType(e.target.value)}
            >
              <MenuItem value="bar">Bar Chart</MenuItem>
              <MenuItem value="line">Line Chart</MenuItem>
            </Select>
          </FormControl>
          <Chip
            icon={<CalculateIcon />}
            label={showDetails ? "Hide Details" : "Show Details"}
            onClick={() => setShowDetails(!showDetails)}
            color={showDetails ? "primary" : "default"}
            variant={showDetails ? "filled" : "outlined"}
          />
        </Box>
      </Box>

      {/* Statistics Cards */}
      {stats && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} md={3}>
            <Card sx={{ bgcolor: '#e3f2fd' }}>
              <CardContent>
                <Typography variant="caption" color="textSecondary">Average Monthly</Typography>
                <Typography variant="h6">{stats.avg.toFixed(1)} m³</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card sx={{ bgcolor: '#ffebee' }}>
              <CardContent>
                <Typography variant="caption" color="textSecondary">Peak Month</Typography>
                <Typography variant="h6" color="error">{stats.max.toFixed(1)} m³</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card sx={{ bgcolor: '#e8f5e8' }}>
              <CardContent>
                <Typography variant="caption" color="textSecondary">Lowest Month</Typography>
                <Typography variant="h6" color="success.main">{stats.min.toFixed(1)} m³</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card sx={{ bgcolor: '#fff3e0' }}>
              <CardContent>
                <Typography variant="caption" color="textSecondary">Year Total</Typography>
                <Typography variant="h6" color="warning.main">{stats.total.toFixed(1)} m³</Typography>
                {showDetails && (
                  <Typography variant="caption" display="block">
                    Raw Diff: {stats.totalRaw.toFixed(1)} m³
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Chart */}
      <Paper sx={{ p: 2, bgcolor: '#fafafa', mb: 3 }}>
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

      {/* Monthly Data Table */}
      {monthlyData.length > 0 && (
        <TableContainer component={Paper}>
          <Table size={showDetails ? "small" : "medium"}>
            <TableHead>
              <TableRow sx={{ bgcolor: '#1976d2' }}>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Month</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">
                  Target Date
                </TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">
                  Reading Date
                </TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">
                  Reading (m³)
                </TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">
                  Previous Reading
                </TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">
                  Pro-rated Consumption
                </TableCell>
                {showDetails && (
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">
                    Calculation
                  </TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {monthlyData.map((row, index) => (
                <TableRow 
                  key={index}
                  sx={{ 
                    '&:nth-of-type(odd)': { bgcolor: '#f5f5f5' },
                    ...(row.isEstimated && { bgcolor: '#fff3e0' })
                  }}
                >
                  <TableCell component="th" scope="row">
                    <Box display="flex" alignItems="center">
                      {row.month}
                      {row.isEstimated && (
                        <Tooltip title="Estimated - adjusted for date difference">
                          <InfoIcon fontSize="small" sx={{ ml: 1, color: '#f57c00' }} />
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    {row.targetDate ? formatDate(row.targetDate) : '-'}
                  </TableCell>
                  <TableCell align="right">
                    {row.readingDate ? formatDate(row.readingDate) : '-'}
                  </TableCell>
                  <TableCell align="right">
                    {row.reading ? `${row.reading.toFixed(1)} m³` : '-'}
                  </TableCell>
                  <TableCell align="right">
                    {row.previousReading ? `${row.previousReading.toFixed(1)} m³` : '-'}
                  </TableCell>
                  <TableCell align="right">
                    {row.consumption > 0 ? (
                      <Chip 
                        label={`${row.consumption.toFixed(1)} m³`}
                        color="primary"
                        size="small"
                      />
                    ) : row.hasData ? (
                      <Chip label="Baseline" size="small" variant="outlined" />
                    ) : '-'}
                  </TableCell>
                  {showDetails && (
                    <TableCell align="right">
                      <Tooltip title={row.formula || ''}>
                        <Typography variant="caption" fontFamily="monospace">
                          {row.adjustmentFactor ? `${row.readingDiff.toFixed(0)} × ${row.targetDateGap}/${row.actualDateGap}` : '-'}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Formula Explanation */}
      <Alert severity="info" sx={{ mt: 2 }}>
        <Typography variant="body2" fontWeight="bold">
          📐 Pro-rated Consumption Formula:
        </Typography>
        <Typography variant="body2">
          (Current Reading - Previous Reading) × (Target Date Gap) / (Actual Date Gap)
        </Typography>
        <Typography variant="caption" color="textSecondary">
          Example: (250 - 230) × 30 days / 29 days = 20.7 m³ for December
        </Typography>
      </Alert>
    </Box>
  );
}