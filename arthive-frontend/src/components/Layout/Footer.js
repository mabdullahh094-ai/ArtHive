import React, { useState } from 'react';
import { 
  Box,
  Container,
  Typography,
  Grid,
  Link as MuiLink,
  TextField,
  Button,
  IconButton,
  Divider,
  List,
  ListItem,
  InputAdornment,
  Tooltip,
  useScrollTrigger,
  Zoom,
  alpha,
  useTheme,
} from '@mui/material';
import { 
  Link as RouterLink,
} from 'react-router-dom';
import {
  Email,
  LocationOn,
  ArrowUpward,
  Send,
  Copyright,
  Security,
  Description,
  Help,
  Store,
  Palette,
  Brush,
  CameraAlt,
} from '@mui/icons-material';
import { useNotification } from '../../context/NotificationContext';

const Footer = () => {
  const theme = useTheme();
  const { showSuccess, showError } = useNotification();
  
  // State
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Scroll trigger for back-to-top button
  const trigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 100,
  });
  
  const handleScrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };
  
  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      showError('Please enter a valid email address');
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      showSuccess('Successfully subscribed to newsletter!');
      setEmail('');
    } catch (error) {
      showError('Failed to subscribe. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Footer sections data
  const footerSections = [
    {
      title: 'Discover',
      links: [
        { label: 'Featured Artworks', path: '/artworks?featured=true', icon: <Palette /> },
        { label: 'New Arrivals', path: '/artworks?sort=newest', icon: <Brush /> },
        { label: 'Trending Now', path: '/artworks?sort=trending', icon: <CameraAlt /> },
        { label: 'Artists Directory', path: '/artists', icon: <Brush /> },
        { label: 'Categories', path: '/categories', icon: <Palette /> },
      ],
    },
    {
      title: 'Buy & Sell',
      links: [
        { label: 'How to Buy', path: '/how-to-buy', icon: <Store /> },
        { label: 'Sell Your Art', path: '/sell', icon: <Store /> },
        { label: 'Shipping Info', path: '/shipping', icon: <LocationOn /> },
        { label: 'Payment Methods', path: '/payment-methods', icon: <Security /> },
        { label: 'Returns & Refunds', path: '/returns', icon: <Description /> },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'About Us', path: '/about', icon: <Help /> },
        { label: 'Contact', path: '/contact', icon: <Email /> },
        { label: 'Careers', path: '/careers', icon: <Help /> },
        { label: 'Press', path: '/press', icon: <Description /> },
        { label: 'Blog', path: '/blog', icon: <Description /> },
      ],
    },
    {
      title: 'Support',
      links: [
        { label: 'Help Center', path: '/help', icon: <Help /> },
        { label: 'FAQ', path: '/faq', icon: <Help /> },
        { label: 'Terms & Conditions', path: '/terms', icon: <Security /> },
        { label: 'Privacy Policy', path: '/privacy', icon: <Security /> },
        { label: 'Cookie Policy', path: '/cookies', icon: <Security /> },
      ],
    },
  ];
  
  // Payment methods
  const paymentMethods = ['Visa', 'MasterCard', 'PayPal', 'Stripe', 'Apple Pay', 'Google Pay'];
  
  return (
    <>
      {/* Main Footer */}
      <Box
        component="footer"
        sx={{
          backgroundColor: theme.palette.grey[900],
          color: theme.palette.grey[300],
          py: { xs: 4, md: 6 },
          borderTop: `1px solid ${theme.palette.divider}`,
          position: 'relative',
        }}
      >
        <Container maxWidth="xl">
          {/* Top Section - Newsletter */}
          <Box
            sx={{
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              borderRadius: 2,
              p: { xs: 3, md: 4 },
              mb: 6,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            }}
          >
            <Grid container alignItems="center" spacing={4}>
              <Grid item xs={12} md={6}>
                <Typography variant="h5" gutterBottom color="white" fontWeight="bold">
                  Stay Inspired
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  Subscribe to our newsletter for exclusive artwork previews, artist interviews, 
                  and special offers delivered to your inbox.
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <form onSubmit={handleNewsletterSubmit}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      fullWidth
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      size="small"
                      sx={{
                        backgroundColor: alpha(theme.palette.common.white, 0.1),
                        borderRadius: 1,
                        '& .MuiOutlinedInput-root': {
                          color: 'white',
                          '& fieldset': {
                            borderColor: alpha(theme.palette.common.white, 0.3),
                          },
                          '&:hover fieldset': {
                            borderColor: theme.palette.primary.main,
                          },
                        },
                      }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Email sx={{ color: alpha(theme.palette.common.white, 0.7) }} />
                          </InputAdornment>
                        ),
                      }}
                    />
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      disabled={submitting}
                      startIcon={<Send />}
                      sx={{
                        minWidth: 120,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {submitting ? 'Subscribing...' : 'Subscribe'}
                    </Button>
                  </Box>
                  <Typography variant="caption" sx={{ mt: 1, display: 'block', opacity: 0.7 }}>
                    By subscribing, you agree to our Privacy Policy. Unsubscribe at any time.
                  </Typography>
                </form>
              </Grid>
            </Grid>
          </Box>
          
          {/* Main Content Grid */}
          <Grid container spacing={{ xs: 4, md: 6 }}>
            {/* Dynamic Sections - FIXED SECTION */}
            {footerSections.map((section) => (
              <Grid item xs={6} sm={3} key={section.title}>
                <Typography 
                  variant="h6" 
                  gutterBottom 
                  sx={{ 
                    color: 'white',
                    fontSize: '1.1rem',
                    mb: 2,
                    fontWeight: 600,
                  }}
                >
                  {section.title}
                </Typography>
                <List disablePadding>
                  {section.links.map((link) => (
                    <ListItem
                      key={link.label}
                      disableGutters
                      sx={{ py: 0.5 }}
                    >
                      <Box
                        component={RouterLink}
                        to={link.path}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          textDecoration: 'none',
                          color: theme.palette.grey[400],
                          width: '100%',
                          py: 0.5,
                          px: 1,
                          borderRadius: 1,
                          '&:hover': {
                            color: theme.palette.primary.light,
                            backgroundColor: alpha(theme.palette.primary.main, 0.05),
                          },
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <Box sx={{ opacity: 0.7, fontSize: '0.9rem' }}>
                          {link.icon}
                        </Box>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                          {link.label}
                        </Typography>
                      </Box>
                    </ListItem>
                  ))}
                </List>
              </Grid>
            ))}
          </Grid>
          
          <Divider sx={{ my: 4, borderColor: alpha(theme.palette.common.white, 0.1) }} />
          
          {/* Bottom Section */}
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Copyright sx={{ fontSize: 16, opacity: 0.7 }} />
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  {new Date().getFullYear()} ArtHive. All rights reserved.
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, ml: 2 }}>
                  <MuiLink
                    component={RouterLink}
                    to="/terms"
                    sx={{
                      color: 'inherit',
                      opacity: 0.8,
                      textDecoration: 'none',
                      '&:hover': {
                        opacity: 1,
                        color: theme.palette.primary.light,
                      },
                    }}
                  >
                    Terms
                  </MuiLink>
                  <MuiLink
                    component={RouterLink}
                    to="/privacy"
                    sx={{
                      color: 'inherit',
                      opacity: 0.8,
                      textDecoration: 'none',
                      '&:hover': {
                        opacity: 1,
                        color: theme.palette.primary.light,
                      },
                    }}
                  >
                    Privacy
                  </MuiLink>
                  <MuiLink
                    component={RouterLink}
                    to="/cookies"
                    sx={{
                      color: 'inherit',
                      opacity: 0.8,
                      textDecoration: 'none',
                      '&:hover': {
                        opacity: 1,
                        color: theme.palette.primary.light,
                      },
                    }}
                  >
                    Cookies
                  </MuiLink>
                </Box>
              </Box>
              
              {/* Project Info */}
              <Typography 
                variant="caption" 
                sx={{ 
                  display: 'block', 
                  mt: 1, 
                  opacity: 0.6,
                  fontStyle: 'italic',
                }}
              >
                Final Year Project - Computer Science & Engineering
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              {/* Payment Methods */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: { xs: 'flex-start', md: 'flex-end' }, gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="body2" sx={{ opacity: 0.8, mr: 1 }}>
                  We accept:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {paymentMethods.map((method) => (
                    <Box
                      key={method}
                      sx={{
                        px: 1.5,
                        py: 0.5,
                        backgroundColor: alpha(theme.palette.common.white, 0.05),
                        borderRadius: 1,
                        border: `1px solid ${alpha(theme.palette.common.white, 0.1)}`,
                      }}
                    >
                      <Typography variant="caption" sx={{ opacity: 0.7 }}>
                        {method}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
              
              {/* Language & Currency Selector */}
              <Box sx={{ display: 'flex', gap: 2, justifyContent: { xs: 'flex-start', md: 'flex-end' }, mt: 2 }}>
                <Typography variant="body2" sx={{ opacity: 0.7 }}>
                  English | USD
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>
      
      {/* Back to Top Button */}
      <Zoom in={trigger}>
        <Box
          sx={{
            position: 'fixed',
            bottom: 32,
            right: 32,
            zIndex: theme.zIndex.speedDial,
          }}
        >
          <Tooltip title="Back to top">
            <IconButton
              onClick={handleScrollToTop}
              sx={{
                backgroundColor: theme.palette.primary.main,
                color: 'white',
                width: 48,
                height: 48,
                '&:hover': {
                  backgroundColor: theme.palette.primary.dark,
                  transform: 'translateY(-2px)',
                },
                boxShadow: 3,
                transition: 'all 0.3s ease',
              }}
              aria-label="Back to top"
            >
              <ArrowUpward />
            </IconButton>
          </Tooltip>
        </Box>
      </Zoom>
      
      {/* Accessibility Notice */}
      <Box
        sx={{
          backgroundColor: theme.palette.grey[900],
          borderTop: `1px solid ${alpha(theme.palette.common.white, 0.1)}`,
          py: 1,
        }}
      >
        <Container maxWidth="xl">
          <Typography 
            variant="caption" 
            align="center" 
            sx={{ 
              display: 'block',
              opacity: 0.6,
            }}
          >
            This website is committed to accessibility. If you encounter any issues, 
            please contact us at{' '}
            <MuiLink 
              href="mailto:accessibility@arthive.com" 
              sx={{ color: 'inherit', textDecoration: 'underline' }}
            >
              accessibility@arthive.com
            </MuiLink>
          </Typography>
        </Container>
      </Box>
    </>
  );
};

Footer.propTypes = {
  // Add any props if needed
};

export default Footer;