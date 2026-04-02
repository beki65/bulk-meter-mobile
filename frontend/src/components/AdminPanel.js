import React, { useState, useEffect } from 'react';
import {
  Paper, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Select, MenuItem, FormControl, InputLabel,
  Chip, IconButton, Switch, Box, Tab, Tabs, Alert
} from '@mui/material';
import { Add, Edit, Delete, Refresh } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    email: '',
    role: 'technician',
    dmaAccess: []
  });
  const { hasPermission, token } = useAuth();
  
  const dmaList = ['DMA-JFR', 'DMA-YKA'];
  
  useEffect(() => {
    if (hasPermission('canManageUsers')) {
      fetchUsers();
      fetchLogs();
    }
  }, []);
  
  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/auth/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };
  
  const fetchLogs = async () => {
    try {
      const response = await axios.get('/api/audit-logs');
      setLogs(response.data);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    }
  };
  
  const handleSave = async () => {
    setError('');
    setLoading(true);
    try {
      if (editingUser) {
        await axios.put(`/api/auth/users/${editingUser._id}`, formData);
      } else {
        await axios.post('/api/auth/users', formData);
      }
      setOpenDialog(false);
      fetchUsers();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to save user');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDelete = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await axios.delete(`/api/auth/users/${userId}`);
        fetchUsers();
      } catch (error) {
        alert('Failed to delete user');
      }
    }
  };
  
  const getRoleColor = (role) => {
    switch(role) {
      case 'admin': return 'error';
      case 'sub_process_owner': return 'warning';
      case 'engineer': return 'info';
      default: return 'default';
    }
  };
  
  if (!hasPermission('canManageUsers')) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Alert severity="error">
          You don't have permission to access this page.
        </Alert>
      </Paper>
    );
  }
  
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: '#1e3a8a' }}>
        🔧 Admin Panel
      </Typography>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
          <Tab label="👥 User Management" />
          <Tab label="📋 Audit Logs" />
        </Tabs>
      </Box>
      
      {activeTab === 0 && (
        <>
          <Box display="flex" justifyContent="flex-end" mb={2}>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => {
                setEditingUser(null);
                setFormData({ username: '', fullName: '', email: '', role: 'technician', dmaAccess: [] });
                setOpenDialog(true);
              }}
            >
              Add User
            </Button>
          </Box>
          
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  <TableCell><strong>Username</strong></TableCell>
                  <TableCell><strong>Full Name</strong></TableCell>
                  <TableCell><strong>Email</strong></TableCell>
                  <TableCell><strong>Role</strong></TableCell>
                  <TableCell><strong>DMA Access</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell><strong>Last Login</strong></TableCell>
                  <TableCell align="center"><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user._id} hover>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.fullName}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={user.role.replace(/_/g, ' ')}
                        size="small"
                        color={getRoleColor(user.role)}
                      />
                    </TableCell>
                    <TableCell>
                      {user.dmaAccess?.map(dma => (
                        <Chip key={dma} label={dma} size="small" sx={{ mr: 0.5 }} />
                      ))}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.isActive ? 'Active' : 'Inactive'}
                        size="small"
                        color={user.isActive ? 'success' : 'error'}
                      />
                    </TableCell>
                    <TableCell>
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton size="small" onClick={() => {
                        setEditingUser(user);
                        setFormData({
                          username: user.username,
                          fullName: user.fullName,
                          email: user.email,
                          role: user.role,
                          dmaAccess: user.dmaAccess || []
                        });
                        setOpenDialog(true);
                      }}>
                        <Edit />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDelete(user._id)}>
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
      
      {activeTab === 1 && (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell><strong>Timestamp</strong></TableCell>
                <TableCell><strong>User</strong></TableCell>
                <TableCell><strong>Action</strong></TableCell>
                <TableCell><strong>Details</strong></TableCell>
                <TableCell><strong>IP Address</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log._id} hover>
                  <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                  <TableCell>{log.username}</TableCell>
                  <TableCell>{log.action}</TableCell>
                  <TableCell>{JSON.stringify(log.details)}</TableCell>
                  <TableCell>{log.ipAddress}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Username"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            margin="normal"
            disabled={!!editingUser}
          />
          <TextField
            fullWidth
            label="Full Name"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            margin="normal"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Role</InputLabel>
            <Select
              value={formData.role}
              label="Role"
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            >
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="sub_process_owner">Sub Process Owner</MenuItem>
              <MenuItem value="engineer">Engineer</MenuItem>
              <MenuItem value="technician">Technician</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel>DMA Access</InputLabel>
            <Select
              multiple
              value={formData.dmaAccess}
              label="DMA Access"
              onChange={(e) => setFormData({ ...formData, dmaAccess: e.target.value })}
              renderValue={(selected) => selected.join(', ')}
            >
              {dmaList.map((dma) => (
                <MenuItem key={dma} value={dma}>
                  {dma}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}