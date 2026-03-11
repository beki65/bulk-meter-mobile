import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip
} from '@mui/material';
import {
  WaterDrop as WaterIcon,
  Map as MapIcon,
  BarChart as ChartIcon,
  People as PeopleIcon,
  Calculate as CalculateIcon,
  Storage as StorageIcon,
  Security as SecurityIcon,
  CloudSync as SyncIcon,
  Smartphone as MobileIcon,
  Dashboard as DashboardIcon,
  GitHub as GitHubIcon,
  Email as EmailIcon
} from '@mui/icons-material';

export default function About() {
  const features = [
    { icon: <MobileIcon />, title: 'Mobile Data Collection', description: 'Offline-capable mobile app for field workers to record meter readings with GPS and photos' },
    { icon: <SyncIcon />, title: 'Auto-Sync', description: 'Automatically syncs data when internet connection is available' },
    { icon: <DashboardIcon />, title: 'Real-time Dashboard', description: 'Web dashboard showing live DMA status and readings' },
    { icon: <MapIcon />, title: 'DMA Management', description: 'Manage multiple DMAs with inlets and outlets' },
    { icon: <ChartIcon />, title: 'Consumption Charts', description: 'Visualize historical data and monthly consumption patterns' },
    { icon: <CalculateIcon />, title: 'NRW Calculator', description: 'Calculate Non-Revenue Water and identify loss components' },
    { icon: <PeopleIcon />, title: 'Customer Management', description: 'View customer history, billing, and consumption patterns' },
    { icon: <StorageIcon />, title: 'Persistent Storage', description: 'MongoDB database with offline-first architecture' },
    { icon: <SecurityIcon />, title: 'Authentication', description: 'Secure login with JWT tokens and role-based access' }
  ];

  const techStack = [
    { category: 'Frontend', items: ['React', 'Material-UI', 'Recharts', 'Axios'] },
    { category: 'Mobile', items: ['React (PWA)', 'LocalForage', 'Geolocation API'] },
    { category: 'Backend', items: ['Node.js', 'Express', 'MongoDB', 'Mongoose'] },
    { category: 'Authentication', items: ['JWT', 'bcrypt', 'Role-based access'] }
  ];

  return (
    <Box>
      {/* Header */}
      <Paper sx={{ p: 4, mb: 4, bgcolor: '#1e3a8a', color: 'white' }}>
        <Typography variant="h3" gutterBottom sx={{ fontWeight: 700 }}>
          Water Utility Management System
        </Typography>
        <Typography variant="h6" sx={{ opacity: 0.9 }}>
          Version 2.0.0 | Enterprise Grade Water Distribution Management
        </Typography>
      </Paper>

      <Grid container spacing={4}>
        {/* Description */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h5" gutterBottom sx={{ color: '#1e3a8a', fontWeight: 600 }}>
                About the System
              </Typography>
              <Typography variant="body1" paragraph>
                The Water Utility Management System is a comprehensive solution for water utilities to monitor, 
                manage, and analyze water distribution networks. It provides real-time data collection from field 
                workers, automated calculations, and insightful analytics.
              </Typography>
              <Typography variant="body1" paragraph>
                Designed for efficiency, the system works offline-first, ensuring data collection continues even 
                in remote areas with no internet connectivity. Once connected, data automatically syncs to the cloud.
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>Key Benefits</Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon><WaterIcon color="primary" /></ListItemIcon>
                  <ListItemText primary="Reduce NRW by up to 30%" secondary="Identify and fix leaks quickly" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><SyncIcon color="primary" /></ListItemIcon>
                  <ListItemText primary="Real-time Monitoring" secondary="Live data from field to dashboard" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><PeopleIcon color="primary" /></ListItemIcon>
                  <ListItemText primary="Improved Customer Service" secondary="Better billing and issue resolution" />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Stats */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h5" gutterBottom sx={{ color: '#1e3a8a', fontWeight: 600 }}>
                System Statistics
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Paper sx={{ p: 3, textAlign: 'center', bgcolor: '#e3f2fd' }}>
                    <Typography variant="h3" color="primary">3</Typography>
                    <Typography variant="body2">Active DMAs</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper sx={{ p: 3, textAlign: 'center', bgcolor: '#fff3e0' }}>
                    <Typography variant="h3" color="warning.main">6</Typography>
                    <Typography variant="body2">Inlets/Outlets</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper sx={{ p: 3, textAlign: 'center', bgcolor: '#e8f5e8' }}>
                    <Typography variant="h3" color="success.main">1K+</Typography>
                    <Typography variant="body2">Readings</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper sx={{ p: 3, textAlign: 'center', bgcolor: '#ffebee' }}>
                    <Typography variant="h3" color="error">24/7</Typography>
                    <Typography variant="body2">Availability</Typography>
                  </Paper>
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" gutterBottom>Tech Stack</Typography>
              <Grid container spacing={2}>
                {techStack.map((stack, idx) => (
                  <Grid item xs={6} key={idx}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{stack.category}</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                      {stack.items.map((item, i) => (
                        <Chip key={i} label={item} size="small" variant="outlined" />
                      ))}
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Features Grid */}
        <Grid item xs={12}>
          <Typography variant="h5" gutterBottom sx={{ color: '#1e3a8a', fontWeight: 600, mt: 2 }}>
            Key Features
          </Typography>
          <Grid container spacing={2}>
            {features.map((feature, idx) => (
              <Grid item xs={12} md={6} lg={4} key={idx}>
                <Card sx={{ height: '100%', '&:hover': { boxShadow: 6 } }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={2}>
                      <Avatar sx={{ bgcolor: '#1e3a8a', mr: 2 }}>
                        {feature.icon}
                      </Avatar>
                      <Typography variant="h6">{feature.title}</Typography>
                    </Box>
                    <Typography variant="body2" color="textSecondary">
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Grid>

        {/* Contact */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, bgcolor: '#f5f5f5', textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>Need Help?</Typography>
            <Typography variant="body2" paragraph>
              For support, feature requests, or bug reports, please contact our team.
            </Typography>
            <Box display="flex" justifyContent="center" gap={2}>
              <Chip 
                icon={<EmailIcon />} 
                label="NRW megenegna Team" 
                variant="outlined"
                onClick={() => window.location.href = 'mailto:NRW megenegna Team'}
              />
              <Chip 
                icon={<GitHubIcon />} 
                label="Documentation" 
                variant="outlined"
                onClick={() => window.open('https://docs.waterutility.com', '_blank')}
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}