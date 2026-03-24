import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Grid,
  Paper
} from '@mui/material';
import {
  History as HistoryIcon,
  Edit as ManualIcon,
  ShowChart as ChartIcon,
  CalendarMonth as MonthlyIcon,
  ArrowDownward as OutletIcon
} from '@mui/icons-material';

export default function DMAOutlets({ outlets, onShowChart, onShowMonthly }) {
  const formatLastReading = (lastReading) => {
    if (!lastReading) return null;
    const date = new Date(lastReading.timestamp);
    return `${lastReading.value} m³ at ${date.toLocaleTimeString()}`;
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={2}>
        <OutletIcon sx={{ fontSize: 28, color: '#f57c00', mr: 1 }} />
        <Typography variant="h5" sx={{ color: '#f57c00', fontWeight: 600 }}>
          Outlets ({outlets?.length || 0})
        </Typography>
      </Box>
      
      <Grid container spacing={2}>
        {outlets?.map((outlet, idx) => (
          <Grid item xs={12} key={idx}>
            <Card variant="outlined" sx={{ 
              borderLeft: 4, 
              borderColor: '#f57c00',
              bgcolor: outlet.lastReading ? '#f8f9fa' : '#fff'
            }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {outlet.name}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Flow Rate: {outlet.flowRate || '—'} m³/h
                    </Typography>
                    {outlet.lastReading ? (
                      <Box mt={1}>
                        <Chip 
                          size="small"
                          label="LIVE"
                          color="success"
                          sx={{ mr: 1 }}
                        />
                        <Typography variant="caption" color="success.main">
                          Last: {formatLastReading(outlet.lastReading)}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="caption" color="textSecondary">
                        No readings yet
                      </Typography>
                    )}
                  </Box>
                  <Box>
                    <Button 
                      size="small" 
                      startIcon={<HistoryIcon />}
                      sx={{ mr: 1 }}
                    >
                      HISTORY
                    </Button>
                    <Button 
                      size="small" 
                      startIcon={<ChartIcon />}
                      onClick={() => onShowChart(outlet.name, 'outlet')}
                      sx={{ mr: 1 }}
                    >
                      CHART
                    </Button>
                    <Button 
                      size="small" 
                      startIcon={<MonthlyIcon />}
                      onClick={() => onShowMonthly(outlet.name, 'outlet')}
                      sx={{ mr: 1 }}
                      color="secondary"
                    >
                      MONTHLY
                    </Button>
                    <Button 
                      size="small" 
                      startIcon={<ManualIcon />}
                      variant="outlined"
                    >
                      MANUAL
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {(!outlets || outlets.length === 0) && (
        <Paper sx={{ p: 3, bgcolor: '#f5f5f5', textAlign: 'center' }}>
          <Typography color="textSecondary">
            No outlets configured for this DMA
          </Typography>
        </Paper>
      )}
    </Box>
  );
}