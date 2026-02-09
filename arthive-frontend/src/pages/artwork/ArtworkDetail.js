import React from 'react';
import { Container, Typography } from '@mui/material';
import { useParams } from 'react-router-dom';

const ArtworkDetail = () => {
  const { id } = useParams();
  
  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Typography variant="h4">Artwork Details</Typography>
      <Typography>Viewing artwork ID: {id}</Typography>
      <Typography>Detailed artwork view will be implemented here</Typography>
    </Container>
  );
};

export default ArtworkDetail;