import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, TextField, Box } from '@mui/material';
import { API_URL, setApiUrl } from '../config';

export default function EnvironmentSwitcher({ open, onClose }) {
  const [customUrl, setCustomUrl] = React.useState('');

  const handleSwitchToProd = () => {
    setApiUrl('https://water-utility-backend.onrender.com/api');
    onClose();
    window.location.reload();
  };

  const handleSwitchToDev = () => {
    setApiUrl('http://192.168.1.188:8000/api');
    onClose();
    window.location.reload();
  };

  const handleSwitchToLocal = () => {
    setApiUrl('http://localhost:8000/api');
    onClose();
    window.location.reload();
  };

  const handleSetCustomUrl = () => {
    if (customUrl) {
      setApiUrl(customUrl);
      onClose();
      window.location.reload();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Switch Environment</DialogTitle>
      <DialogContent>
        <Typography variant="body2" gutterBottom>
          Current URL: <strong>{API_URL}</strong>
        </Typography>
        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Button variant="outlined" onClick={handleSwitchToProd}>Production (Render)</Button>
          <Button variant="outlined" onClick={handleSwitchToDev}>Development (Local IP)</Button>
          <Button variant="outlined" onClick={handleSwitchToLocal}>Local (localhost)</Button>
          <TextField
            size="small"
            label="Custom URL"
            placeholder="http://192.168.1.100:8000/api"
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            sx={{ mt: 1 }}
          />
          <Button variant="contained" onClick={handleSetCustomUrl}>Use Custom URL</Button>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}