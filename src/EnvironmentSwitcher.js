import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Button,
  Typography,
  Chip,
  Box,
  CircularProgress,
  Alert
} from '@mui/material';
import { CheckCircle, RadioButtonUnchecked } from '@mui/icons-material';
import { 
  API_URL, 
  CURRENT_ENV, 
  setEnvironment, 
  getAvailableEnvironments,
  testConnection 
} from '../config';

export default function EnvironmentSwitcher({ open, onClose }) {
  const [environments, setEnvironments] = useState([]);
  const [currentEnv, setCurrentEnv] = useState(CURRENT_ENV);
  const [testing, setTesting] = useState({});
  const [testResults, setTestResults] = useState({});

  useEffect(() => {
    setEnvironments(getAvailableEnvironments());
    setCurrentEnv(CURRENT_ENV);
  }, []);

  const handleTestConnection = async (envName, url) => {
    setTesting(prev => ({ ...prev, [envName]: true }));
    const isConnected = await testConnection(url);
    setTestResults(prev => ({ ...prev, [envName]: isConnected }));
    setTesting(prev => ({ ...prev, [envName]: false }));
  };

  const handleSwitch = (envName) => {
    setEnvironment(envName);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="h6">Server Environment</Typography>
        <Typography variant="caption" color="textSecondary">
          Current: <strong>{currentEnv}</strong> - {API_URL}
        </Typography>
      </DialogTitle>
      <DialogContent>
        <List>
          {environments.map((env) => (
            <ListItem
              key={env.name}
              disablePadding
              secondaryAction={
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handleTestConnection(env.name, env.url)}
                  disabled={testing[env.name]}
                >
                  {testing[env.name] ? <CircularProgress size={20} /> : 'Test'}
                </Button>
              }
            >
              <ListItemButton onClick={() => handleSwitch(env.name)}>
                {currentEnv === env.name ? (
                  <CheckCircle color="success" sx={{ mr: 2 }} />
                ) : (
                  <RadioButtonUnchecked sx={{ mr: 2 }} />
                )}
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="body1">
                        {env.name.toUpperCase()}
                      </Typography>
                      {testResults[env.name] && (
                        <Chip label="Online" size="small" color="success" />
                      )}
                      {testResults[env.name] === false && (
                        <Chip label="Offline" size="small" color="error" />
                      )}
                    </Box>
                  }
                  secondary={env.url}
                  secondaryTypographyProps={{
                    style: { fontSize: '11px', wordBreak: 'break-all' }
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            <strong>Production:</strong> Use when APK is built<br />
            <strong>Development:</strong> Use when testing with local server<br />
            <strong>Local:</strong> Use when running on same computer
          </Typography>
        </Alert>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}