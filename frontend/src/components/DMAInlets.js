import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Grid,
  Divider
} from '@mui/material';
import {
  History as HistoryIcon,
  Edit as ManualIcon,
  ShowChart as ChartIcon,
  CalendarMonth as MonthlyIcon,
  ArrowUpward as InletIcon
} from '@mui/icons-material';

export default function DMAInlets({ dma, onShowChart, onShowMonthly }) {
  const formatLastReading = (lastReading) => {
    if (!lastReading) return null;
    const date = new Date(lastReading.timestamp);
    return `${lastReading.value} m³ at ${date.toLocaleTimeString()}`;
  };

  return (
    <Box>
      {/* Inlets Section */}
      <Box sx={{ mb: 2 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <InletIcon sx={{ fontSize: 28, color: '#1976d2', mr: 1 }} />
          <Typography variant="h5" sx={{ color: '#1976d2', fontWeight: 600 }}>
            Inlets ({dma.inlets?.length || 0})
          </Typography>
        </Box>
        
        <Grid container spacing={2}>
          {dma.inlets?.map((inlet, idx) => (
            <Grid item xs={12} key={idx}>
              <Card variant="outlined" sx={{ 
                borderLeft: 4, 
                borderColor: '#1976d2',
                bgcolor: inlet.lastReading ? '#f8f9fa' : '#fff'
              }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {inlet.name}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Flow Rate: {inlet.flowRate || '—'} m³/h
                      </Typography>
                      {inlet.lastReading ? (
                        <Box mt={1}>
                          <Chip 
                            size="small"
                            label="LIVE"
                            color="success"
                            sx={{ mr: 1 }}
                          />
                          <Typography variant="caption" color="success.main">
                            Last: {formatLastReading(inlet.lastReading)}
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
                        onClick={() => onShowChart(inlet.name, 'inlet')}
                        sx={{ mr: 1 }}
                      >
                        CHART
                      </Button>
                      <Button 
                        size="small" 
                        startIcon={<MonthlyIcon />}
                        onClick={() => onShowMonthly(inlet.name, 'inlet')}
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
      </Box>

      <Divider sx={{ my: 2 }} />
    </Box>
  );
}