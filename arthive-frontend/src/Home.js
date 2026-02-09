import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  Container, 
  Button, 
  Typography, 
  Box, 
  Grid, 
  Card, 
  CardMedia, 
  CardContent,
  CardActions,
  Chip,
  IconButton,
  Paper,
  Stack,
  CircularProgress,
  Alert,
  alpha,
  useTheme,
  Grow,
  Zoom,
} from '@mui/material';
import { 
  ArrowForward, 
  FavoriteBorder, 
  ShoppingCart, 
  Star, 
  Palette,
  Brush,
  CameraAlt,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { buyerAPI } from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Home = () => {
  const theme = useTheme();
  
  // State
  const [featuredArtworks, setFeaturedArtworks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [apiStatus, setApiStatus] = useState('idle'); // 'idle', 'loading', 'success', 'error'
  
  // Context
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  
  // Fetch data on mount
  const fetchHomeData = useCallback(async () => {
    setLoading(true);
    setApiStatus('loading');
    setError(null);
    
    try {
      console.log('Fetching homepage data...');
      
      // Test backend connection first
      const healthCheck = await fetch('http://localhost:3001/api/test');
      if (!healthCheck.ok) {
        throw new Error('Backend server is not responding');
      }
      
      // Fetch all data
      const [featuredData, categoriesData] = await Promise.allSettled([
        buyerAPI.getArtworks({ featured: true, limit: 4 }),
        buyerAPI.getCategories(),
      ]);
      
      console.log('API Responses:', { featuredData, categoriesData });
      
      // Handle featured artworks
      if (featuredData.status === 'fulfilled' && featuredData.value.success) {
        setFeaturedArtworks(featuredData.value.items);
      } else {
        console.warn('Featured data fallback');
        const mockArtworks = [
          {
            id: 1,
            title: 'Abstract Colors',
            price: 299.99,
            image_url: 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=400',
            artist_first_name: 'Jane',
            artist_last_name: 'Doe',
            category_name: 'Abstract',
            medium: 'Oil on Canvas',
            description: 'Vibrant abstract painting'
          }
        ];
        setFeaturedArtworks(mockArtworks);
      }
      
      // Handle categories
      if (categoriesData.status === 'fulfilled') {
        setCategories(categoriesData.value);
      } else {
        console.warn('Categories data fallback');
        setCategories([
          { id: 1, name: 'Painting', slug: 'painting', count: 250 },
          { id: 2, name: 'Digital Art', slug: 'digital-art', count: 180 },
          { id: 3, name: 'Photography', slug: 'photography', count: 320 },
          { id: 4, name: 'Sculpture', slug: 'sculpture', count: 95 }
        ]);
      }
      
      setApiStatus('success');
      
    } catch (err) {
      console.error('Home data fetch error:', err);
      setError(err.message || 'Failed to load homepage data');
      setApiStatus('error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHomeData();
  }, [fetchHomeData]);
  
  const handleAddToCart = async (artwork) => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      return;
    }
    
    try {
      // If you have a cart context
      if (addToCart) {
        const result = await addToCart(artwork.id);
        if (result.success) {
          toast.success(`${artwork.title} added to cart successfully!`);
        } else {
          toast.error(result.error || 'Failed to add to cart');
        }
      } else {
        // Fallback if no cart context
        toast.success(`${artwork.title} added to cart!`);
        console.log('Added to cart:', artwork);
      }
    } catch (err) {
      toast.error('Failed to add to cart');
      console.error('Add to cart error:', err);
    }
  };
  
  const handleAddToWishlist = (artwork) => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to wishlist');
      return;
    }
    
    toast.success(`${artwork.title} added to wishlist!`);
    console.log('Added to wishlist:', artwork);
  };
  
  const formatPrice = (price) => {
    if (!price) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };
  
  // Helper to get image URL
  const getImageUrl = (artwork) => {
    return artwork.image_url || artwork.imageUrl || artwork.thumbnail || 
           'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400';
  };
  
  // Helper to get artist name
  const getArtistName = (artwork) => {
    if (artwork.artist?.name) return artwork.artist.name;
    if (artwork.artistName) return artwork.artistName;
    if (artwork.artist_first_name && artwork.artist_last_name) {
      return `${artwork.artist_first_name} ${artwork.artist_last_name}`;
    }
    return 'Unknown Artist';
  };
  
  // Loading state
  if (loading && apiStatus === 'loading') {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '60vh',
        gap: 2 
      }}>
        <CircularProgress />
        <Typography color="text.secondary">
          {apiStatus === 'loading' ? 'Connecting to server...' : 'Loading artworks...'}
        </Typography>
      </Box>
    );
  }
  
  return (
    <Box sx={{ overflow: 'hidden' }}>
      {/* Status Alert */}
      {apiStatus === 'error' && (
        <Container maxWidth="lg">
          <Alert 
            severity="warning" 
            sx={{ 
              mt: 2, 
              mb: 2,
              '& .MuiAlert-message': {
                width: '100%'
              }
            }}
            action={
              <Button 
                color="inherit" 
                size="small" 
                onClick={fetchHomeData}
              >
                Retry
              </Button>
            }
          >
            {error || 'Using demo data. Some features may be limited.'}
          </Alert>
        </Container>
      )}
      
      {/* Hero Section */}
      <Box
        component={motion.div}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`,
          color: 'white',
          py: { xs: 8, md: 12 },
          mb: 6,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Container maxWidth="lg">
          <Grid container alignItems="center" spacing={4}>
            <Grid item xs={12} md={6}>
              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.8 }}
              >
                <Typography 
                  variant="h2" 
                  component="h1" 
                  gutterBottom 
                  sx={{ 
                    fontWeight: 'bold',
                    fontSize: { xs: '2.5rem', md: '3.5rem' },
                    lineHeight: 1.2,
                  }}
                >
                  Discover Extraordinary Art
                </Typography>
                <Typography 
                  variant="h5" 
                  gutterBottom 
                  sx={{ 
                    mb: 4, 
                    opacity: 0.9,
                    fontSize: { xs: '1.25rem', md: '1.5rem' },
                  }}
                >
                  Connect with emerging artists and collect unique pieces
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <Button
                    variant="contained"
                    size="large"
                    component={Link}
                    to="/artworks"
                    sx={{
                      backgroundColor: 'white',
                      color: theme.palette.primary.dark,
                      '&:hover': { 
                        backgroundColor: alpha('#ffffff', 0.9),
                        transform: 'translateY(-2px)',
                      },
                      px: 4,
                      py: 1.5,
                      fontWeight: 'bold',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    Explore Collection
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    component={Link}
                    to="/register"
                    sx={{
                      borderColor: 'white',
                      color: 'white',
                      '&:hover': { 
                        borderColor: 'white',
                        backgroundColor: alpha('#ffffff', 0.1),
                      },
                      px: 4,
                      py: 1.5,
                    }}
                  >
                    Join as Artist
                  </Button>
                </Stack>
              </motion.div>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <motion.div
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                style={{ position: 'relative' }}
              >
                {featuredArtworks[0] && (
                  <Card
                    sx={{
                      borderRadius: 4,
                      overflow: 'hidden',
                      boxShadow: 8,
                      transform: 'rotate(3deg)',
                    }}
                  >
                    <CardMedia
                      component="img"
                      height="400"
                      image={getImageUrl(featuredArtworks[0])}
                      alt={featuredArtworks[0].title}
                      sx={{ objectFit: 'cover' }}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
                        color: 'white',
                        p: 3,
                      }}
                    >
                      <Typography variant="h6">{featuredArtworks[0].title}</Typography>
                      <Typography variant="body2">
                        By {getArtistName(featuredArtworks[0])}
                      </Typography>
                    </Box>
                  </Card>
                )}
              </motion.div>
            </Grid>
          </Grid>
        </Container>
      </Box>
      
      {/* Stats Section */}
      <Container maxWidth="lg">
        <Grid container spacing={3} sx={{ mb: 8 }}>
          {[
            { label: 'Artworks', value: '10K+', icon: <Palette /> },
            { label: 'Artists', value: '500+', icon: <Brush /> },
            { label: 'Happy Collectors', value: '2K+', icon: <Star /> },
            { label: 'Categories', value: '50+', icon: <CameraAlt /> },
          ].map((stat, index) => (
            <Grid item xs={6} md={3} key={stat.label}>
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: index * 0.1 + 0.5, duration: 0.5 }}
              >
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    textAlign: 'center',
                    borderRadius: 4,
                    border: `1px solid ${theme.palette.divider}`,
                    '&:hover': {
                      borderColor: theme.palette.primary.main,
                      transform: 'translateY(-4px)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  <Box sx={{ color: theme.palette.primary.main, mb: 1 }}>
                    {stat.icon}
                  </Box>
                  <Typography variant="h3" fontWeight="bold" gutterBottom>
                    {stat.value}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stat.label}
                  </Typography>
                </Paper>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </Container>
      
      {/* Featured Artworks */}
      <Container maxWidth="lg">
        <Box sx={{ mb: 8 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <div>
              <Typography variant="h4" component="h2" gutterBottom fontWeight="bold">
                Featured Artworks
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Curated selection of exceptional pieces
              </Typography>
            </div>
            <Button
              component={Link}
              to="/artworks"
              endIcon={<ArrowForward />}
              variant="outlined"
            >
              View All
            </Button>
          </Box>
          
          <Grid container spacing={3}>
            {featuredArtworks.slice(0, 4).map((artwork, index) => (
              <Grid item xs={12} sm={6} md={3} key={artwork.id}>
                <Grow in timeout={(index + 1) * 200}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: 3,
                      overflow: 'hidden',
                      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: theme.shadows[8],
                      },
                    }}
                  >
                    <Link to={`/artwork/${artwork.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <Box sx={{ position: 'relative', overflow: 'hidden' }}>
                        <CardMedia
                          component="img"
                          height="220"
                          image={getImageUrl(artwork)}
                          alt={artwork.title}
                          sx={{ objectFit: 'cover' }}
                        />
                        {artwork.is_featured && (
                          <Chip
                            label="Featured"
                            color="primary"
                            size="small"
                            sx={{ position: 'absolute', top: 12, left: 12 }}
                          />
                        )}
                      </Box>
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Typography gutterBottom variant="h6" noWrap>
                          {artwork.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          By {getArtistName(artwork)}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                          {artwork.category_name && (
                            <Chip 
                              label={artwork.category_name} 
                              size="small" 
                              variant="outlined" 
                            />
                          )}
                          {artwork.medium && (
                            <Chip 
                              label={artwork.medium} 
                              size="small" 
                              variant="outlined" 
                              color="secondary"
                            />
                          )}
                        </Box>
                        <Typography variant="h6" color="primary" fontWeight="bold">
                          {formatPrice(artwork.price)}
                        </Typography>
                      </CardContent>
                    </Link>
                    <CardActions sx={{ justifyContent: 'space-between', p: 2, pt: 0 }}>
                      <IconButton 
                        size="small" 
                        onClick={() => handleAddToWishlist(artwork)}
                      >
                        <FavoriteBorder />
                      </IconButton>
                      <Button
                        size="small"
                        color="primary"
                        variant="contained"
                        startIcon={<ShoppingCart />}
                        onClick={() => handleAddToCart(artwork)}
                      >
                        Add to Cart
                      </Button>
                    </CardActions>
                  </Card>
                </Grow>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>
      
      {/* Categories */}
      <Box sx={{ backgroundColor: alpha(theme.palette.primary.light, 0.05), py: 8, mb: 8 }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography variant="h4" component="h2" gutterBottom fontWeight="bold">
              Browse by Category
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Explore artworks by your preferred medium
            </Typography>
          </Box>
          
          <Grid container spacing={3}>
            {categories.slice(0, 4).map((category, index) => (
              <Grid item xs={6} md={3} key={category.id || index}>
                <Zoom in timeout={(index + 1) * 200}>
                  <Card
                    component={Link}
                    to={`/artworks?category=${category.slug || category.name.toLowerCase().replace(/\s+/g, '-')}`}
                    sx={{
                      textDecoration: 'none',
                      color: 'inherit',
                      p: 4,
                      textAlign: 'center',
                      borderRadius: 3,
                      backgroundColor: 'white',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: theme.shadows[8],
                        backgroundColor: theme.palette.primary.main,
                        color: 'white',
                        '& .MuiTypography-root': {
                          color: 'white',
                        },
                      },
                    }}
                  >
                    <Box sx={{ fontSize: 48, mb: 2, color: theme.palette.primary.main }}>
                      {category.icon === 'painting' && <Palette />}
                      {category.icon === 'photography' && <CameraAlt />}
                      {category.icon === 'digital' && <Brush />}
                      {!category.icon && <Palette />}
                    </Box>
                    <Typography variant="h6" gutterBottom>
                      {category.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {category.count || '100+'} artworks
                    </Typography>
                  </Card>
                </Zoom>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>
      
      {/* CTA Section */}
      <Box sx={{ 
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.9)} 0%, ${alpha(theme.palette.secondary.main, 0.9)} 100%)`, 
        color: 'white',
        py: 10,
      }}>
        <Container maxWidth="md">
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h3" component="h2" gutterBottom fontWeight="bold">
              Ready to Start Your Collection?
            </Typography>
            <Typography variant="h6" gutterBottom sx={{ mb: 4, opacity: 0.9 }}>
              Join thousands of art lovers discovering amazing artworks
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
              <Button
                variant="contained"
                size="large"
                component={Link}
                to="/artworks"
                sx={{
                  backgroundColor: 'white',
                  color: theme.palette.primary.dark,
                  px: 5,
                  py: 1.5,
                  fontWeight: 'bold',
                  '&:hover': {
                    backgroundColor: alpha('#ffffff', 0.9),
                  },
                }}
              >
                Browse Artworks
              </Button>
              <Button
                variant="outlined"
                size="large"
                component={Link}
                to="/register"
                sx={{
                  borderColor: 'white',
                  color: 'white',
                  px: 5,
                  py: 1.5,
                  '&:hover': {
                    backgroundColor: alpha('#ffffff', 0.1),
                  },
                }}
              >
                Sell Your Art
              </Button>
            </Stack>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;