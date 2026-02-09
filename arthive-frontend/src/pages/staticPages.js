// Static pages like About, Contact, Terms, etc.
import React from 'react';
import { Container, Typography, Box, Paper, Grid } from '@mui/material';
import { Helmet } from 'react-helmet-async';

export const AboutPage = () => (
  <Container maxWidth="lg" sx={{ py: 8 }}>
    <Helmet>
      <title>About Us - ArtHive</title>
      <meta name="description" content="Learn about ArtHive, our mission, and our team" />
    </Helmet>
    
    <Typography variant="h2" gutterBottom>
      About ArtHive
    </Typography>
    <Typography variant="body1" paragraph>
      {/* Content here */}
    </Typography>
  </Container>
);

export const ContactPage = () => (
  <Container maxWidth="lg" sx={{ py: 8 }}>
    <Helmet>
      <title>Contact Us - ArtHive</title>
      <meta name="description" content="Get in touch with ArtHive customer support" />
    </Helmet>
    
    <Typography variant="h2" gutterBottom>
      Contact Us
    </Typography>
    {/* Contact form and info */}
  </Container>
);

// Export all static pages
export { AboutPage, ContactPage };