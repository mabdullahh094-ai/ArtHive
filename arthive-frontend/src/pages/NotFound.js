import React from 'react';
import { Container, Typography, Button, Box } from '@mui/material';
import { Link } from 'react-router-dom';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

const NotFound = () => {
  return (
    <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
      <ErrorOutlineIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 3 }} />
      <Typography variant="h1" gutterBottom>
        404
      </Typography>
      <Typography variant="h4" gutterBottom>
        Page Not Found
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        The page you're looking for doesn't exist or has been moved.
      </Typography>
      <Box sx={{ mt: 4 }}>
        <Button
          variant="contained"
          component={Link}
          to="/"
          size="large"
        >
          Go Home
        </Button>
      </Box>
    </Container>
  );
};

export default NotFound;