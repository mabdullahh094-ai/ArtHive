import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  IconButton,
  CircularProgress,
} from '@mui/material';
import {
  Search,
  FilterList,
  Favorite,
  FavoriteBorder,
  ArrowForward,
  Star,
  Visibility,
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { buyerAPI } from '../services/api';

const Home = () => {
  const notification = useNotification();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addToCart, addToWishlist, removeFromWishlist, wishlistItems } = useCart();
  const [artworks, setArtworks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [homeStats, setHomeStats] = useState({
    curated_artworks: 0,
    verified_artists: 0,
    monthly_collectors: 0,
    countries_count: 0,
  });

  const statHighlights = [
    { label: 'Curated artworks', value: homeStats.curated_artworks, accent: '#2563eb' },
    { label: 'Verified artists', value: homeStats.verified_artists, accent: '#f59e0b' },
    { label: 'Monthly collectors', value: homeStats.monthly_collectors, accent: '#16a34a' },
  ];

  const formatCompactNumber = (value) => {
    const number = Number(value) || 0;
    return new Intl.NumberFormat('en', {
      notation: 'compact',
      compactDisplay: 'short',
      maximumFractionDigits: 1,
    }).format(number);
  };


  const fetchArtworks = useCallback(async () => {
    try {
      setLoading(true);
      const res = await buyerAPI.getArtworks({
        page: 1,
        limit: 12,
        search: appliedSearch || undefined,
        category: category !== 'all' ? category : undefined,
      });

      console.log('API Response:', res?.data);
      const list = res?.data?.artworks || res?.data?.data || res?.data?.items || [];
      console.log('Artworks list:', list);
      console.log('First artwork image_url:', list[0]?.image_url);
      setArtworks(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Failed to fetch artworks:', err);
      setArtworks([]);
    } finally {
      setLoading(false);
    }
  }, [appliedSearch, category]);

  useEffect(() => {
    fetchArtworks();
  }, [fetchArtworks]);

  useEffect(() => {
    const fetchHomeStats = async () => {
      try {
        const res = await buyerAPI.getHomeStats();
        if (res.data?.success && res.data?.stats) {
          setHomeStats({
            curated_artworks: res.data.stats.curated_artworks || 0,
            verified_artists: res.data.stats.verified_artists || 0,
            monthly_collectors: res.data.stats.monthly_collectors || 0,
            countries_count: res.data.stats.countries_count || 0,
          });
        }
      } catch (err) {
        console.error('Failed to fetch home stats:', err);
      }
    };

    fetchHomeStats();
  }, []);

  const handleWishlistToggle = async (artwork) => {
    console.log('Wishlist button clicked', { artwork, isAuthenticated });
    if (!isAuthenticated) {
      console.log('User not authenticated, redirecting to login');
      notification.showWarning('Please log in to add to wishlist');
      navigate('/login');
      return;
    }

    const artworkId = artwork?.id || artwork?.artworkId;
    console.log('Processing wishlist for artwork:', artworkId);
    const isWishlisted = wishlistItems.some(item => item.artworkId === artworkId || item.id === artworkId);
    console.log('Is wishlisted:', isWishlisted, 'Current wishlist items:', wishlistItems);

    try {
      if (isWishlisted) {
        console.log('Removing from wishlist...');
        const result = await removeFromWishlist(artworkId);
        console.log('Remove result:', result);
        notification.showInfo('Removed from wishlist');
      } else {
        console.log('Adding to wishlist...');
        const result = await addToWishlist(artwork);
        console.log('Add to wishlist result:', result);
        if (result && result.success) {
          notification.showSuccess('Added to wishlist!');
        } else {
          notification.showError(result?.error || 'Failed to add to wishlist');
        }
      }
    } catch (err) {
      console.error('Wishlist error details:', err);
      console.error('Error response:', err.response?.data);
      const errorMsg = err.response?.data?.message || err.message || 'Failed to update wishlist';
      notification.showError(errorMsg);
    }
  };

  const handleAddToCart = async (artwork) => {
    console.log('Add to cart button clicked', { artwork, isAuthenticated });
    if (!isAuthenticated) {
      notification.showWarning('Please log in to add to cart');
      navigate('/login');
      return;
    }

    try {
      const result = await addToCart(artwork);
      console.log('Add to cart result:', result);
      if (result && result.success) {
        notification.showSuccess('Added to cart!');
      } else {
        notification.showError(result?.error || 'Failed to add to cart');
      }
    } catch (err) {
      console.error('Add to cart error:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Failed to add to cart';
      notification.showError(errorMsg);
    }
  };

  const filteredArtworks = artworks;

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    const trimmed = searchTerm.trim();
    if (!trimmed) return;

    // Navigate to the dedicated gallery page so the user clearly sees filtered results
    navigate(`/artworks?search=${encodeURIComponent(trimmed)}`);
    setAppliedSearch(trimmed);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Hero Section */}
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          textAlign: 'center',
          mb: { xs: 5, md: 8 },
          py: { xs: 5, md: 9 },
          px: { xs: 2.5, md: 6 },
          borderRadius: { xs: 3, md: 4 },
          color: 'white',
          background: 'radial-gradient(circle at 20% 20%, rgba(96,165,250,0.35), transparent 32%), radial-gradient(circle at 80% 0%, rgba(245,158,11,0.28), transparent 34%), linear-gradient(135deg, #0f172a 0%, #111827 45%, #1d4ed8 100%)',
        }}
      >
        <Box sx={{ position: 'absolute', inset: 0, opacity: 0.15, background: 'radial-gradient(circle at 50% 50%, #fff 0%, transparent 40%)' }} />
        <Box sx={{ position: 'relative', maxWidth: 760, mx: 'auto' }}>
          <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 800, letterSpacing: -0.5 }}>
            Discover Extraordinary Art
          </Typography>
          <Typography variant="h5" component="p" gutterBottom sx={{ mb: 4, opacity: 0.92 }}>
            Explore, collect, and connect with artists worldwide.
          </Typography>
          
          <Box component="form" onSubmit={handleSearchSubmit} sx={{ maxWidth: 640, mx: 'auto', mt: 4 }}>
            <TextField
              fullWidth
              placeholder="Search artworks, artists, collections..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ 
                backgroundColor: 'rgba(255,255,255,0.08)',
                borderRadius: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  color: 'white',
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                  '&:hover fieldset': { borderColor: 'white' },
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: 'rgba(255,255,255,0.8)' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <Button type="submit" variant="contained" color="secondary" sx={{ borderRadius: 2 }}>
                      Search
                    </Button>
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          <Grid container spacing={{ xs: 1.25, sm: 2 }} sx={{ mt: { xs: 3, md: 4 } }}>
            {statHighlights.map((item) => (
              <Grid item xs={4} sm={4} key={item.label}>
                <Box
                  sx={{
                    width: { xs: 96, sm: '100%' },
                    height: { xs: 96, sm: 'auto' },
                    mx: 'auto',
                    p: { xs: 1.25, sm: 2.5 },
                    borderRadius: { xs: '50%', sm: 3 },
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: { xs: 'center', sm: 'flex-start' },
                    textAlign: { xs: 'center', sm: 'left' },
                    gap: { xs: 0.3, sm: 0.75 },
                  }}
                >
                  <Typography variant="h4" fontWeight={800} sx={{ color: item.accent, fontSize: { xs: '1.4rem', sm: '2rem' }, lineHeight: 1 }}>
                    {formatCompactNumber(item.value)}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.85, fontSize: { xs: '0.62rem', sm: '0.875rem' }, lineHeight: 1.2 }}>
                    {item.label}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>

        </Box>
      </Box>

      {/* Mobile Creative Highlights */}
      <Box
        sx={{
          display: { xs: 'block', md: 'none' },
          mb: 5,
        }}
      >
        <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 700 }}>
          Quick Picks
        </Typography>
        <Box
          sx={{
            display: 'flex',
            gap: 1.5,
            overflowX: 'auto',
            pb: 1,
            '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
          {[
            { label: 'Trending Today', bg: 'linear-gradient(135deg, #2563eb 0%, #60a5fa 100%)' },
            { label: 'New Arrivals', bg: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)' },
            { label: 'Top Rated', bg: 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)' },
          ].map((item) => (
            <Box
              key={item.label}
              sx={{
                minWidth: 160,
                color: 'white',
                p: 2,
                borderRadius: 3,
                background: item.bg,
                boxShadow: '0 10px 24px rgba(15,23,42,0.18)',
              }}
            >
              <Typography variant="subtitle2" sx={{ opacity: 0.9 }}>
                Featured
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 700 }}>
                {item.label}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.85 }}>
                Swipe to explore
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>


      {/* Filters */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 4, backgroundColor: 'white', p: { xs: 2, md: 3 }, borderRadius: 3, boxShadow: 2, border: '1px solid rgba(15,23,42,0.06)' }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FilterList />
          <FormControl sx={{ minWidth: 150 }}>
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <MenuItem value="all">All Categories</MenuItem>
              <MenuItem value="painting">Painting</MenuItem>
              <MenuItem value="photography">Photography</MenuItem>
              <MenuItem value="sculpture">Sculpture</MenuItem>
              <MenuItem value="digital">Digital Art</MenuItem>
            </Select>
          </FormControl>
        </Box>
        
        <Typography variant="h6" component="h2">
          Featured Artworks
        </Typography>
      </Box>

      {/* Artworks Grid */}
      <Grid container spacing={{ xs: 2, md: 4 }} sx={{ mb: 8 }}>
        {loading ? (
          <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : filteredArtworks.length === 0 ? (
          <Box sx={{ width: '100%', textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary">
              No artworks found. Check back soon!
            </Typography>
          </Box>
        ) : (
          filteredArtworks.map((artwork) => (
            <Grid item xs={6} sm={6} md={3} key={artwork.id}>
              <Card sx={{
                position: 'relative',
                transition: 'transform 0.2s, box-shadow 0.2s',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: { xs: 2.5, sm: 3 },
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: 6,
                }
              }}>
                {/* Wishlist Button */}
                <IconButton
                  sx={{ 
                    position: 'absolute', 
                    top: { xs: 6, sm: 8 }, 
                    right: { xs: 6, sm: 8 }, 
                    backgroundColor: 'white',
                    p: { xs: 0.75, sm: 1 },
                    '&:hover': { backgroundColor: 'white' }
                  }}
                  onClick={() => handleWishlistToggle(artwork)}
                >
                  {wishlistItems.some(item => item.artworkId === artwork.id || item.id === artwork.id) ? (
                    <Favorite color="error" />
                  ) : (
                    <FavoriteBorder />
                  )}
                </IconButton>

                {(() => {
                  const imageSrc = (artwork.image_url || artwork.imageUrl || artwork.image || '').trim();
                  return (
                    <Box
                      sx={{
                        height: { xs: 135, sm: 200 },
                        overflow: 'hidden',
                        backgroundColor: '#f5f5f5',
                        cursor: 'pointer'
                      }}
                      onClick={() => window.location.href = `/artwork/${artwork.id}`}
                    >
                      {imageSrc ? (
                        <img
                          src={imageSrc}
                          alt={artwork.title}
                          referrerPolicy="no-referrer"
                          crossOrigin="anonymous"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            display: 'block'
                          }}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <Box
                          sx={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'text.secondary',
                            fontSize: { xs: '0.75rem', sm: '0.875rem' },
                          }}
                        >
                          No Image
                        </Box>
                      )}
                    </Box>
                  );
                })()}
                
                <CardContent sx={{ flexGrow: 1, p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
                  <Typography variant="h6" component="h3" gutterBottom noWrap sx={{ fontSize: { xs: '1.05rem', sm: '1.25rem' }, mb: { xs: 0.4, sm: 1 } }}>
                    {artwork.title}
                  </Typography>
                  
                  <Typography 
                    variant="body2" 
                    color="primary" 
                    component={Link}
                    to={`/artists/${artwork.artist_id}`}
                    sx={{ 
                      textDecoration: 'none',
                      display: 'block',
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      maxWidth: '100%',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      mb: { xs: 0.25, sm: 0.5 },
                      '&:hover': { textDecoration: 'underline' }
                    }}
                  >
                    {artwork.artist_first_name} {artwork.artist_last_name}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: { xs: 0.5, sm: 1 } }}>
                    <Typography variant="h6" color="primary" sx={{ fontSize: { xs: '0.95rem', sm: '1.25rem' } }}>
                      ${artwork.price ? artwork.price.toLocaleString() : 'N/A'}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Star sx={{ color: '#FFD700', fontSize: { xs: 14, sm: 16 } }} />
                      <Typography variant="body2" sx={{ fontSize: { xs: '0.9rem', sm: '0.875rem' } }}>
                        {artwork.rating || 'N/A'}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mt: { xs: 0.5, sm: 1 }, fontSize: { xs: '0.72rem', sm: '0.875rem' } }} noWrap>
                    {artwork.medium || 'N/A'} {artwork.year ? `• ${artwork.year}` : ''}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: { xs: 1, sm: 2 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Visibility sx={{ fontSize: { xs: 14, sm: 16 } }} />
                      <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                        {artwork.view_count || 0}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Favorite sx={{ fontSize: { xs: 14, sm: 16 }, color: 'error.main' }} />
                      <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                        {artwork.likes || 0}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Button
                    fullWidth
                    variant="contained"
                    sx={{ mt: { xs: 1.25, sm: 2 }, py: { xs: 0.8, sm: 1 }, fontSize: { xs: '0.72rem', sm: '0.875rem' }, whiteSpace: 'nowrap' }}
                    onClick={() => handleAddToCart(artwork)}
                  >
                    Add to Cart
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      {/* Featured Artists Section */}
      <Box sx={{ mb: 8 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h2">
            Featured Artists
          </Typography>
        </Box>
        
        <Box sx={{ textAlign: 'center', py: { xs: 2, md: 3 } }}>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Artist profiles are available on the dedicated artists page.
          </Typography>
          <Button
            variant="contained"
            component={Link}
            to="/artists"
            endIcon={<ArrowForward />}
          >
            See Artist Profiles
          </Button>
        </Box>
      </Box>

      {/* Stats Section */}
      <Box
        sx={{
          backgroundColor: 'primary.light',
          color: 'white',
          py: 6,
          borderRadius: 4,
          mb: 8,
          textAlign: 'center'
        }}
      >
        <Typography variant="h4" component="h2" gutterBottom>
          Join Our Growing Community
        </Typography>

        <Grid container spacing={4} sx={{ mt: 2 }}>
          <Grid item xs={6} md={3}>
            <Typography variant="h3" component="div" gutterBottom>
              {formatCompactNumber(homeStats.curated_artworks)}
            </Typography>
            <Typography variant="body1">
              Artworks
            </Typography>
          </Grid>

          <Grid item xs={6} md={3}>
            <Typography variant="h3" component="div" gutterBottom>
              {formatCompactNumber(homeStats.verified_artists)}
            </Typography>
            <Typography variant="body1">
              Artists
            </Typography>
          </Grid>

          <Grid item xs={6} md={3}>
            <Typography variant="h3" component="div" gutterBottom>
              {formatCompactNumber(homeStats.monthly_collectors)}
            </Typography>
            <Typography variant="body1">
              Collectors
            </Typography>
          </Grid>

          <Grid item xs={6} md={3}>
            <Typography variant="h3" component="div" gutterBottom>
              {formatCompactNumber(homeStats.countries_count)}
            </Typography>
            <Typography variant="body1">
              Countries
            </Typography>
          </Grid>
        </Grid>
      </Box>

    </Container>
  );
};

export default Home;