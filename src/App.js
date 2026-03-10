import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginScreen from './screens/LoginScreen';
import MainApp from './MainApp';
import { Box, CircularProgress } from '@mui/material';

function AppContent() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { user, loading } = useAuth();

  useEffect(() => {
    if (user) {
      setIsAuthenticated(true);
    }
  }, [user]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return <MainApp />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}