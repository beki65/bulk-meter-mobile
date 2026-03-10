import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress
} from '@mui/material';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, error } = useAuth();

  const handleLogin = async () => {
    if (!username || !password) {
      alert('Please fill in all fields');
      return;
    }
    
    setLoading(true);
    const result = await login(username, password);
    setLoading(false);
    
    if (result.success && onLoginSuccess) {
      onLoginSuccess();
    }
  };

  return (
    <Box sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      bgcolor: '#f5f5f5'
    }}>
      <Paper sx={{ p: 4, maxWidth: 400, width: '90%' }}>
        <Typography variant="h4" gutterBottom align="center">
          📱 Bulk Meter
        </Typography>
        <Typography variant="subtitle1" gutterBottom align="center" color="textSecondary">
          Field Data Collection
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <TextField
          fullWidth
          label="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          margin="normal"
          disabled={loading}
        />
        
        <TextField
          fullWidth
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          margin="normal"
          disabled={loading}
          onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
        />
        
        <Button
          fullWidth
          variant="contained"
          size="large"
          onClick={handleLogin}
          disabled={loading}
          sx={{ mt: 3, py: 1.5 }}
        >
          {loading ? <CircularProgress size={24} /> : 'Login'}
        </Button>
        
        <Typography variant="caption" display="block" align="center" sx={{ mt: 2 }}>
          Demo credentials: admin / admin123
        </Typography>
      </Paper>
    </Box>
  );
}