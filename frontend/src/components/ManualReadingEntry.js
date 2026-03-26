import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  History as HistoryIcon,
  CloudUpload as CloudUploadIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

export default function ManualReadingEntry() {
  const [loading, setLoading] = useState(false);
  const [readings, setReadings] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingReading, setEditingReading] = useState(null);
  const [formData, setFormData] = useState({
    dmaId: '',
    pointName: '',
    pointType: 'inlet',
    readingDate: '',
    readingValue: '',
    meterId: '',
    notes: ''
  });
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  // DMA and point configuration
  const dmaConfig = {
    'DMA-JFR': {
      name: 'Jafar DMA',
      points: [
        { name: 'Bulk Didly', type: 'inlet' },
        { name: 'Shemachoch', type: 'inlet' },
        { name: 'Tel', type: 'outlet' }
      ]
    },
    'DMA-YKA': {
      name: 'Yeka DMA',
      points: [
        { name: 'Misrak', type: 'inlet' },
        { name: 'English', type: 'inlet' },
        { name: 'Wubet', type: 'inlet' }
      ]
    },
    'DMA-2019': {
      name: '2019 DMA',
      points: [
        { name: 'Inlet 1', type: 'inlet' },
        { name: 'Inlet 2', type: 'inlet' }
      ]
    }
  };

  useEffect(() => {
    fetchReadings();
  }, []);

  const fetchReadings = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/reading-history`);
      setReadings(response.data);
    } catch (err) {
      console.error('Failed to fetch readings:', err);
      setError('Failed to load reading history');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.dmaId || !formData.pointName || !formData.readingDate || !formData.readingValue) {
      setError('Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      if (editingReading) {
        // Update existing reading
        await axios.put(`${API_URL}/reading-history/${editingReading._id}`, formData);
        setSuccess('Reading updated successfully');
      } else {
        // Create new reading
        await axios.post(`${API_URL}/reading-history`, formData);
        setSuccess('Reading added successfully');
      }
      
      setDialogOpen(false);
      resetForm();
      fetchReadings();
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save reading');
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this reading?')) return;
    
    try {
      await axios.delete(`${API_URL}/reading-history/${id}`);
      setSuccess('Reading deleted successfully');
      fetchReadings();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to delete reading');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleEdit = (reading) => {
    setEditingReading(reading);
    setFormData({
      dmaId: reading.dmaId,
      pointName: reading.pointName,
      pointType: reading.pointType,
      readingDate: reading.readingDate.split('T')[0],
      readingValue: reading.readingValue,
      meterId: reading.meterId || '',
      notes: reading.notes || ''
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingReading(null);
    setFormData({
      dmaId: '',
      pointName: '',
      pointType: 'inlet',
      readingDate: '',
      readingValue: '',
      meterId: '',
      notes: ''
    });
  };

  const handleDMAChange = (dmaId) => {
    setFormData({ ...formData, dmaId, pointName: '', pointType: 'inlet' });
  };

  const getPointsForDMA = () => {
    const config = dmaConfig[formData.dmaId];
    return config ? config.points : [];
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" sx={{ fontWeight: 600, color: '#1e3a8a' }}>
          📝 Manual Reading Entry
        </Typography>
        <Box>
          <Tooltip title="Refresh">
            <IconButton onClick={fetchReadings} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              resetForm();
              setDialogOpen(true);
            }}
            sx={{ ml: 2 }}
          >
            Add Reading
          </Button>
        </Box>
      </Box>

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Reading History Table */}
      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
              <TableCell><strong>Date</strong></TableCell>
              <TableCell><strong>DMA</strong></TableCell>
              <TableCell><strong>Point</strong></TableCell>
              <TableCell><strong>Type</strong></TableCell>
              <TableCell align="right"><strong>Reading (m³)</strong></TableCell>
              <TableCell><strong>Meter ID</strong></TableCell>
              <TableCell align="center"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : readings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  No readings found. Click "Add Reading" to enter your first reading.
                </TableCell>
              </TableRow>
            ) : (
              readings.map((reading) => (
                <TableRow key={reading._id} hover>
                  <TableCell>{new Date(reading.readingDate).toLocaleDateString()}</TableCell>
                  <TableCell>{dmaConfig[reading.dmaId]?.name || reading.dmaId}</TableCell>
                  <TableCell>{reading.pointName}</TableCell>
                  <TableCell>
                    <Chip 
                      label={reading.pointType} 
                      size="small"
                      color={reading.pointType === 'inlet' ? 'primary' : 'warning'}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Typography fontWeight="bold">
                      {reading.readingValue.toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell>{reading.meterId || '-'}</TableCell>
                  <TableCell align="center">
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => handleEdit(reading)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" onClick={() => handleDelete(reading._id)} color="error">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingReading ? 'Edit Reading' : 'Add New Reading'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>DMA</InputLabel>
                <Select
                  value={formData.dmaId}
                  label="DMA"
                  onChange={(e) => handleDMAChange(e.target.value)}
                >
                  {Object.entries(dmaConfig).map(([id, config]) => (
                    <MenuItem key={id} value={id}>{config.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Point Name</InputLabel>
                <Select
                  value={formData.pointName}
                  label="Point Name"
                  onChange={(e) => {
                    const point = getPointsForDMA().find(p => p.name === e.target.value);
                    setFormData({
                      ...formData,
                      pointName: e.target.value,
                      pointType: point?.type || 'inlet'
                    });
                  }}
                  disabled={!formData.dmaId}
                >
                  {getPointsForDMA().map((point) => (
                    <MenuItem key={point.name} value={point.name}>
                      {point.name} ({point.type})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Reading Date"
                type="date"
                value={formData.readingDate}
                onChange={(e) => setFormData({ ...formData, readingDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Reading Value (m³)"
                type="number"
                value={formData.readingValue}
                onChange={(e) => setFormData({ ...formData, readingValue: e.target.value })}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Meter ID (optional)"
                value={formData.meterId}
                onChange={(e) => setFormData({ ...formData, meterId: e.target.value })}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes (optional)"
                multiline
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : (editingReading ? 'Update' : 'Save')}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}