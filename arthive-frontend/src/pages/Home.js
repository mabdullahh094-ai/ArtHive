import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Chip,
} from '@mui/material';
import {
  Search,
  FilterList,
  Favorite,
  FavoriteBorder,
  ArrowForward,
  Star,
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { buyerAPI } from '../services/api';

const Home = () => {
  const notification = useNotification();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { addToCart, addToWishlist, removeFromWishlist, wishlistItems } = useCart();
  const canAddToCart = isAuthenticated && ['buyer', 'user'].includes(user?.user_type);
  const [artworks, setArtworks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const categoryMenuRef = useRef(null);
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

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await buyerAPI.getCategories();
        const list = res?.data?.data || [];
        setCategories(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
        setCategories([]);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    if (!isCategoryOpen) {
      return undefined;
    }

    const handleScroll = (event) => {
      const target = event.target;
      if (
        target &&
        typeof target.closest === 'function' &&
        target.closest('[data-category-menu="true"]')
      ) {
        return;
      }
      setIsCategoryOpen(false);
    };

    window.addEventListener('scroll', handleScroll, true);
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isCategoryOpen]);

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

    if (!canAddToCart) {
      notification.showWarning('Only buyers can add items to cart');
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
    <Container
      maxWidth="xl"
      sx={{
        py: 2.5,
        background: 'radial-gradient(circle at 0% 0%, rgba(37,99,235,0.06), transparent 38%), radial-gradient(circle at 100% 20%, rgba(245,158,11,0.08), transparent 34%)',
      }}
    >
      {/* Hero Section */}
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          textAlign: 'center',
          mb: { xs: 4, md: 6 },
          py: { xs: 2.5, md: 4.5 },
          px: { xs: 1.5, md: 3.5 },
          borderRadius: { xs: 2.5, md: 3 },
          color: 'white',
          background: 'radial-gradient(circle at 20% 20%, rgba(96,165,250,0.35), transparent 32%), radial-gradient(circle at 80% 0%, rgba(245,158,11,0.28), transparent 34%), linear-gradient(135deg, #0f172a 0%, #111827 45%, #1d4ed8 100%)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 12px 26px rgba(15,23,42,0.25)',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            width: { xs: 110, md: 170 },
            height: { xs: 110, md: 170 },
            borderRadius: '50%',
            top: -34,
            right: { xs: -24, md: 24 },
            background: 'radial-gradient(circle, rgba(255,255,255,0.24) 0%, rgba(255,255,255,0) 72%)',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            width: { xs: 95, md: 150 },
            height: { xs: 95, md: 150 },
            borderRadius: '50%',
            bottom: -42,
            left: { xs: -20, md: 34 },
            background: 'radial-gradient(circle, rgba(251,191,36,0.26) 0%, rgba(245,158,11,0) 70%)',
          }}
        />
        <Box sx={{ position: 'absolute', inset: 0, opacity: 0.15, background: 'radial-gradient(circle at 50% 50%, #fff 0%, transparent 40%)' }} />
        <Box sx={{ position: 'relative', maxWidth: 600, mx: 'auto' }}>
          <Box sx={{ display: 'inline-flex', px: 1.05, py: 0.32, borderRadius: 99, mb: 0.9, bgcolor: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.28)' }}>
            <Typography sx={{ fontSize: { xs: '0.58rem', md: '0.64rem' }, letterSpacing: 0.35, fontWeight: 700 }}>
              CURATED MODERN ART MARKETPLACE
            </Typography>
          </Box>
          <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 800, letterSpacing: -0.4, fontSize: { xs: '1.45rem', md: '2.15rem' }, lineHeight: 1.12 }}>
            Discover Extraordinary Art
          </Typography>
          <Typography variant="h5" component="p" gutterBottom sx={{ mb: 1.5, opacity: 0.9, fontSize: { xs: '0.84rem', md: '1rem' } }}>
            Explore, collect, and connect with artists worldwide.
          </Typography>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 0.5, mb: 0.75 }}>
            {['Original Pieces', 'Verified Artists'].map((tag) => (
              <Chip
                key={tag}
                label={tag}
                size="small"
                sx={{
                  color: 'white',
                  borderColor: 'rgba(255,255,255,0.42)',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(4px)',
                  '& .MuiChip-label': {
                    px: 0.85,
                    fontSize: { xs: '0.56rem', md: '0.62rem' },
                    fontWeight: 600,
                  },
                }}
                variant="outlined"
              />
            ))}
          </Box>
          
          <Box component="form" onSubmit={handleSearchSubmit} sx={{ maxWidth: 500, mx: 'auto', mt: 1.3 }}>
            <TextField
              fullWidth
              placeholder="Search artworks, artists, collections..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ 
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderRadius: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  overflow: 'hidden',
                  pr: 0.5,
                  color: 'white',
                  '& .MuiOutlinedInput-input': {
                    py: 0.82,
                    fontSize: { xs: '0.8rem', md: '0.9rem' },
                  },
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
                  <InputAdornment position="end" sx={{ mr: 0 }}>
                    <Button
                      type="submit"
                      variant="contained"
                      color="secondary"
                      sx={{
                        borderRadius: 1.8,
                        minWidth: 84,
                        px: 1.5,
                        py: 0.55,
                        fontSize: { xs: '0.66rem', md: '0.72rem' },
                        border: '1px solid rgba(255,255,255,0.28)',
                      }}
                    >
                      Search
                    </Button>
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          <Grid container spacing={{ xs: 0.8, sm: 1.1 }} sx={{ mt: { xs: 1.5, md: 2 } }}>
            {statHighlights.map((item) => (
              <Grid item xs={4} sm={4} key={item.label}>
                <Box
                  sx={{
                    width: { xs: 76, sm: '100%' },
                    height: { xs: 76, sm: 'auto' },
                    mx: 'auto',
                    p: { xs: 0.75, sm: 1.35 },
                    borderRadius: { xs: '50%', sm: 3 },
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: { xs: 'center', sm: 'flex-start' },
                    textAlign: { xs: 'center', sm: 'left' },
                    gap: { xs: 0.15, sm: 0.4 },
                  }}
                >
                  <Typography variant="h4" fontWeight={800} sx={{ color: item.accent, fontSize: { xs: '0.96rem', sm: '1.3rem' }, lineHeight: 1 }}>
                    {formatCompactNumber(item.value)}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.85, fontSize: { xs: '0.5rem', sm: '0.7rem' }, lineHeight: 1.2 }}>
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
          mb: 3.5,
        }}
      >
        <Typography variant="h6" sx={{ mb: 1, fontWeight: 700, fontSize: '1rem' }}>
          Quick Picks
        </Typography>
        <Box
          sx={{
            display: 'flex',
            gap: 1,
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
                minWidth: 132,
                color: 'white',
                p: 1.25,
                borderRadius: 2.5,
                background: item.bg,
                boxShadow: '0 8px 16px rgba(15,23,42,0.16)',
              }}
            >
              <Typography variant="subtitle2" sx={{ opacity: 0.9, fontSize: '0.7rem' }}>
                Featured
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 700, fontSize: '0.8rem' }}>
                {item.label}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.85, fontSize: '0.64rem' }}>
                Swipe to explore
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>


      {/* Filters */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', md: 'center' }, gap: 2, mb: 4, backgroundColor: 'white', p: { xs: 2, md: 3 }, borderRadius: 3, boxShadow: 2, border: '1px solid rgba(15,23,42,0.06)' }}>
        <Typography variant="h6" component="h2" sx={{ order: { xs: 2, md: 1 } }}>
          Featured Artworks
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', order: { xs: 1, md: 2 } }}>
          <FilterList />
          <FormControl sx={{ minWidth: 150 }}>
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              open={isCategoryOpen}
              onOpen={() => setIsCategoryOpen(true)}
              onClose={() => setIsCategoryOpen(false)}
              MenuProps={{
                keepMounted: false,
                anchorOrigin: {
                  vertical: 'bottom',
                  horizontal: 'left',
                },
                transformOrigin: {
                  vertical: 'top',
                  horizontal: 'left',
                },
                MenuListProps: {
                  'data-category-menu': 'true',
                },
                PaperProps: {
                  ref: categoryMenuRef,
                  'data-category-menu': 'true',
                  sx: {
                    maxHeight: 300,
                    mt: 0.5,
                  },
                },
              }}
            >
              <MenuItem value="all">All Categories</MenuItem>
              {categories.map((cat) => (
                <MenuItem key={cat.id || cat.slug || cat.name} value={cat.name}>
                  {cat.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Artworks Grid */}
      <Grid container spacing={{ xs: 1, sm: 1.25, md: 1.5 }} sx={{ mb: 8 }}>
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
            <Grid item xs={6} sm={4} md={3} lg={2} key={artwork.id}>
              <Card sx={{
                position: 'relative',
                transition: 'transform 0.2s, box-shadow 0.2s',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 1.5,
                border: '1px solid rgba(15,23,42,0.1)',
                backgroundColor: '#fff',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 18px rgba(15,23,42,0.12)',
                }
              }}>
                {/* Wishlist Button */}
                <IconButton
                  sx={{ 
                    position: 'absolute', 
                    top: 6,
                    right: 6,
                    backgroundColor: 'white',
                    p: 0.55,
                    zIndex: 2,
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
                  const galleryPreview = Array.isArray(artwork.image_urls) && artwork.image_urls.length > 0
                    ? artwork.image_urls[0]
                    : null;
                  const imageSrc = (galleryPreview || artwork.image_url || artwork.imageUrl || artwork.image || '').trim();
                  return (
                    <Box
                      sx={{
                        height: { xs: 125, sm: 150, md: 145 },
                        overflow: 'hidden',
                        backgroundColor: '#f5f5f5',
                        cursor: 'pointer'
                      }}
                      onClick={() => navigate(`/artwork/${artwork.id}`)}
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
                
                <CardContent sx={{ flexGrow: 1, p: 1, '&:last-child': { pb: 1 } }}>
                  <Typography
                    variant="h6"
                    component="h3"
                    sx={{
                      fontSize: { xs: '0.78rem', sm: '0.82rem' },
                      mb: 0.55,
                      fontWeight: 600,
                      lineHeight: 1.3,
                      minHeight: { xs: 32, sm: 36 },
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {artwork.title}
                  </Typography>
                  
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    component={Link}
                    to={`/artists/${artwork.artist_id}`}
                    sx={{ 
                      textDecoration: 'none',
                      display: 'block',
                      fontSize: '0.67rem',
                      maxWidth: '100%',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      mb: 0.45,
                      '&:hover': { textDecoration: 'underline', color: 'text.primary' }
                    }}
                  >
                    {artwork.artist_first_name} {artwork.artist_last_name}
                  </Typography>
                  
                  <Typography variant="h6" sx={{ fontSize: { xs: '0.93rem', sm: '1rem' }, fontWeight: 800, color: '#f57224', lineHeight: 1.1 }}>
                      ${artwork.price ? artwork.price.toLocaleString() : 'N/A'}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.35, mb: 0.65 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                      <Star sx={{ color: '#faca15', fontSize: 13 }} />
                      <Typography variant="body2" sx={{ fontSize: '0.66rem', color: 'text.secondary' }}>
                        {artwork.rating || '4.5'}
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ fontSize: '0.64rem', color: 'text.disabled' }}>
                      {artwork.likes || 0} sold
                    </Typography>
                  </Box>
                  
                  <Button
                    fullWidth
                    variant="outlined"
                    sx={{
                      mt: 0.35,
                      py: 0.45,
                      fontSize: '0.62rem',
                      fontWeight: 700,
                      borderRadius: 1,
                      borderColor: 'rgba(245,114,36,0.55)',
                      color: '#f57224',
                      whiteSpace: 'nowrap',
                      '&:hover': {
                        borderColor: '#f57224',
                        backgroundColor: 'rgba(245,114,36,0.06)',
                      },
                    }}
                    disabled={!canAddToCart || artwork.isSold}
                    onClick={() => handleAddToCart(artwork)}
                  >
                    {artwork.isSold ? 'Sold Out' : canAddToCart ? 'Add to Cart' : 'Buyers Only'}
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