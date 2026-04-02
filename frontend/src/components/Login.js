import React, { useState } from 'react';
import {
  Box, Paper, TextField, Button, Typography, Container,
  Checkbox, FormControlLabel, Alert, CircularProgress, InputAdornment,
  IconButton
} from '@mui/material';
import { Visibility, VisibilityOff, WaterDrop } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, changePassword } = useAuth();
  
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [tempUserId, setTempUserId] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError('');
  
  const result = await login(username, password, rememberMe);
  console.log('Login result:', result);  // Debug log
  
  if (result?.requirePasswordChange) {
    setTempUserId(result.userId);
    setShowChangePassword(true);
  } else if (result?.success) {
    // Login successful, navigate to dashboard
    console.log('Login successful, redirecting...');
    // The AuthContext already handles navigation? 
    // If not, you might need to useNavigate here
  } else if (result?.error) {
    setError(result.error);
  }
  
  setLoading(false);
};
  
 const handleChangePassword = async (e) => {
  e.preventDefault();
  
  if (newPassword !== confirmPassword) {
    setError('Passwords do not match');
    return;
  }
  
  if (newPassword.length < 6) {
    setError('Password must be at least 6 characters');
    return;
  }
  
  setLoading(true);
  
  // Use the login function with the new password after change
  // First, change the password
  const changeResult = await changePassword('AAWSA', newPassword);
  
  if (changeResult.success) {
    // Now login with the new password
    const loginResult = await login(username, newPassword, rememberMe);
    if (loginResult.success) {
      setShowChangePassword(false);
    } else {
      setError(loginResult.error);
    }
  } else {
    setError(changeResult.error);
  }
  setLoading(false);
};
  
  if (showChangePassword) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
          <Paper sx={{ p: 4, width: '100%' }}>
            <Box textAlign="center" mb={3}>
              <WaterDrop sx={{ fontSize: 48, color: '#1976d2' }} />
              <Typography variant="h5" gutterBottom>Change Password</Typography>
              <Typography variant="body2" color="textSecondary">
                This is your first login. Please change your password.
              </Typography>
            </Box>
            
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            
            <form onSubmit={handleChangePassword}>
              <TextField
                fullWidth
                label="New Password"
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                margin="normal"
                required
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
              <TextField
                fullWidth
                label="Confirm Password"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                margin="normal"
                required
              />
              <Button
                fullWidth
                variant="contained"
                type="submit"
                disabled={loading}
                sx={{ mt: 3 }}
              >
                {loading ? <CircularProgress size={24} /> : 'Change Password'}
              </Button>
            </form>
          </Paper>
        </Box>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="sm">
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
        <Paper sx={{ p: 4, width: '100%' }}>
          <Box textAlign="center" mb={3}>
            <WaterDrop sx={{ fontSize: 48, color: '#1976d2' }} />
            <Typography variant="h4" gutterBottom>Water Utility Management</Typography>
            <Typography variant="body2" color="textSecondary">
              Please sign in to continue
            </Typography>
          </Box>
          
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              margin="normal"
              required
              autoFocus
            />
            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
              }
              label="Remember Me"
            />
            <Button
              fullWidth
              variant="contained"
              type="submit"
              disabled={loading}
              sx={{ mt: 2 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Sign In'}
            </Button>
          </form>
        </Paper>
      </Box>
    </Container>
  );
}