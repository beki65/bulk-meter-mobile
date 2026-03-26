import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Drawer, AppBar, Toolbar, List, Typography, Divider,
  IconButton, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Avatar, Badge, Menu, MenuItem, useTheme
} from '@mui/material';
import {
  Menu as MenuIcon,
  WaterDrop as WaterIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  AccountCircle,
  Logout,
  ChevronLeft as ChevronLeftIcon
} from '@mui/icons-material';

const drawerWidth = 280;

export default function Layout({ children }) {
  const [open, setOpen] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();
  const theme = useTheme();

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ 
        zIndex: theme.zIndex.drawer + 1,
        backgroundColor: '#1e3a8a'
      }}>
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setOpen(!open)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            💧 Water Utility - DMA Management
          </Typography>
          
          <IconButton color="inherit">
            <Badge badgeContent={0} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
          
          <IconButton onClick={handleProfileMenuOpen} color="inherit">
            <Avatar sx={{ width: 35, height: 35, bgcolor: '#f57c00' }}>OP</Avatar>
          </IconButton>
          
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
            <MenuItem onClick={handleMenuClose}>Profile</MenuItem>
            <MenuItem onClick={handleMenuClose}>Settings</MenuItem>
            <Divider />
            <MenuItem onClick={handleMenuClose}>Logout</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Drawer variant="permanent" open={open} sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          backgroundColor: '#f8fafc',
          ...(!open && { width: 0, overflowX: 'hidden' }),
        },
      }}>
        <Toolbar>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e3a8a' }}>
            DMA Manager
          </Typography>
        </Toolbar>
        <Divider />
        <List sx={{ mt: 2, px: 2 }}>
          <ListItem disablePadding>
            <ListItemButton onClick={() => navigate('/')}>
              <ListItemIcon><WaterIcon sx={{ color: '#1e3a8a' }} /></ListItemIcon>
              <ListItemText primary="DMA Zones" />
            </ListItemButton>
          </ListItem>
        </List>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}