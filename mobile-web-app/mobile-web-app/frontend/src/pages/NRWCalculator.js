import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip
} from '@mui/material';
import {
  WaterDrop as WaterIcon,
  TrendingDown as LossIcon,
  Savings as SavingsIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';

export default function NRWCalculator({ onViewCustomer }) {
  const [systemInput, setSystemInput] = useState(950000);
  const [billedConsumption, setBilledConsumption] = useState(775000);
  const [result, setResult] = useState(null);

  const calculateNRW = () => {
    const input = parseFloat(systemInput) || 0;
    const billed = parseFloat(billedConsumption) || 0;
    
    if (input <= 0 || billed <= 0) {
      alert('Please enter valid numbers');
      return;
    }
    
    const nrwVolume = input - billed;
    const nrwPercentage = (nrwVolume / input * 100).toFixed(2);
    const costPerUnit = 0.85;
    const totalLossValue = nrwVolume * costPerUnit;
    
    setResult({
      nrwPercentage,
      nrwVolume,
      totalLossValue: totalLossValue.toFixed(2),
      components: {
        leaks: nrwVolume * 0.4,
        meterInaccuracies: nrwVolume * 0.3,
        unauthorizedConsumption: nrwVolume * 0.2,
        bursts: nrwVolume * 0.1
      },
      recommendations: [
        "Implement pressure management in high-loss zones",
        "Schedule meter accuracy testing",
        "Conduct leak detection survey",
        "Review unauthorized consumption cases"
      ]
    });
  };

  const getNRWLevel = (percentage) => {
    if (percentage < 15) return { label: 'Excellent', color: 'success' };
    if (percentage < 25) return { label: 'Good', color: 'info' };
    if (percentage < 35) return { label: 'Moderate', color: 'warning' };
    return { label: 'Critical', color: 'error' };
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: '#1e3a8a' }}>
        NRW Calculator
      </Typography>
      <Typography variant="body1" color="textSecondary" paragraph>
        Calculate Non-Revenue Water (NRW) percentage and identify loss components
      </Typography>

      <Grid container spacing={3}>
        {/* Input Section */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Input Values</Typography>
            <TextField
              fullWidth
              label="System Input Volume (m³)"
              type="number"
              value={systemInput}
              onChange={(e) => setSystemInput(e.target.value)}
              margin="normal"
              helperText="Total water supplied to the system"
            />
            <TextField
              fullWidth
              label="Billed Consumption (m³)"
              type="number"
              value={billedConsumption}
              onChange={(e) => setBilledConsumption(e.target.value)}
              margin="normal"
              helperText="Water that was billed to customers"
            />
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={calculateNRW}
              sx={{ mt: 3 }}
            >
              Calculate NRW
            </Button>
          </Paper>
        </Grid>

        {/* Results Section */}
        <Grid item xs={12} md={6}>
          {result ? (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Results</Typography>
              
              <Box display="flex" alignItems="center" justifyContent="center" mb={3}>
                <Box textAlign="center">
                  <Typography variant="h2" sx={{ 
                    fontWeight: 700,
                    color: getNRWLevel(result.nrwPercentage).color === 'success' ? '#2e7d32' :
                           getNRWLevel(result.nrwPercentage).color === 'info' ? '#0288d1' :
                           getNRWLevel(result.nrwPercentage).color === 'warning' ? '#ed6c02' : '#d32f2f'
                  }}>
                    {result.nrwPercentage}%
                  </Typography>
                  <Chip 
                    label={getNRWLevel(result.nrwPercentage).label}
                    color={getNRWLevel(result.nrwPercentage).color}
                    sx={{ mt: 1 }}
                  />
                </Box>
              </Box>

              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <Card sx={{ bgcolor: '#e3f2fd' }}>
                    <CardContent>
                      <Typography variant="caption" color="textSecondary">NRW Volume</Typography>
                      <Typography variant="h6">{result.nrwVolume.toFixed(0)} m³</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card sx={{ bgcolor: '#ffebee' }}>
                    <CardContent>
                      <Typography variant="caption" color="textSecondary">Financial Loss</Typography>
                      <Typography variant="h6" color="error">${result.totalLossValue}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                Loss Components
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon><WaterIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Physical Leaks" 
                    secondary={`${(result.components.leaks / 1000).toFixed(1)}K m³`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><LossIcon color="warning" /></ListItemIcon>
                  <ListItemText 
                    primary="Meter Inaccuracies" 
                    secondary={`${(result.components.meterInaccuracies / 1000).toFixed(1)}K m³`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><WarningIcon color="error" /></ListItemIcon>
                  <ListItemText 
                    primary="Unauthorized Consumption" 
                    secondary={`${(result.components.unauthorizedConsumption / 1000).toFixed(1)}K m³`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><SavingsIcon color="success" /></ListItemIcon>
                  <ListItemText 
                    primary="Potential Savings" 
                    secondary={`$${(result.nrwVolume * 0.85 * 0.4).toFixed(2)}`}
                  />
                </ListItem>
              </List>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                Recommendations
              </Typography>
              {result.recommendations.map((rec, idx) => (
                <Alert key={idx} severity="info" icon={<CheckIcon />} sx={{ mb: 1 }}>
                  {rec}
                </Alert>
              ))}
            </Paper>
          ) : (
            <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
              <Typography color="textSecondary" align="center">
                Enter values and click Calculate to see NRW analysis
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}