import React from 'react';
import { Box, Button, Typography, Paper } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { useNavigate } from 'react-router-dom';

const ErrorFallback = ({ error, resetErrorBoundary }) => {
  const navigate = useNavigate();

  return (
    <Paper
      elevation={3}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '70vh',
        p: 4,
        mx: 'auto',
        maxWidth: 600,
      }}
    >
      <ErrorOutlineIcon
        color="error"
        sx={{ fontSize: 64, mb: 3 }}
      />
      
      <Typography variant="h5" gutterBottom color="error">
        Oops! Something went wrong
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Button
          variant="contained"
          onClick={resetErrorBoundary}
          sx={{ minWidth: 120 }}
        >
          Try Again
        </Button>
        
        <Button
          variant="outlined"
          onClick={() => navigate('/')}
          sx={{ minWidth: 120 }}
        >
          Go Home
        </Button>
      </Box>
    </Paper>
  );
};

export default ErrorFallback;