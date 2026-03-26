import React from 'react';
import { Box, Paper, Typography, Button, Grid, Card, CardContent } from '@mui/material';

export default function TestPage() {
  const handleClick = () => {
    alert('🎉 Button clicked! This proves buttons work!');
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h3" gutterBottom>🔴 SIMPLE TEST PAGE</Typography>
      <Typography variant="h5" gutterBottom>If you see this, React is working!</Typography>
      
      <Grid container spacing={3} sx={{ mt: 2 }}>
        {[1, 2, 3].map((item) => (
          <Grid item xs={12} md={4} key={item}>
            <Card>
              <CardContent>
                <Typography variant="h5">Test Card {item}</Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  This is a simple test card
                </Typography>
                
                {/* BIG OBVIOUS BUTTON */}
                <Button 
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={handleClick}
                  sx={{ 
                    bgcolor: '#ff0000',
                    color: 'white',
                    fontSize: '1.5rem',
                    py: 3,
                    mt: 2,
                    border: '5px solid yellow'
                  }}
                >
                  🟢 CLICK ME 🟢
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}