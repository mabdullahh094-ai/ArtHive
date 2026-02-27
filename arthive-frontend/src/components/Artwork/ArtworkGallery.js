import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  CircularProgress,
  Container,
  FormControl,
  Grid,
  IconButton,
  MenuItem,
  Pagination,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { Favorite, FavoriteBorder, Search } from '@mui/icons-material';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useNotification } from '../../context/NotificationContext';
import { buyerAPI } from '../../services/api';

const PAGE_SIZE = 12;
const CATEGORY_OPTIONS = [
  { label: 'All Categories', value: 'all' },
  { label: 'Painting', value: 'painting' },
  { label: 'Photography', value: 'photography' },
  { label: 'Sculpture', value: 'sculpture' },
  { label: 'Digital Art', value: 'digital' },
];

const ArtworkGallery = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchParam = searchParams.get('search') || '';
  const categoryParam = searchParams.get('category') || 'all';
  const pageParam = Number(searchParams.get('page') || 1);

  const [searchQuery, setSearchQuery] = useState(searchParam);
  const [filter, setFilter] = useState(categoryParam);
  const [page, setPage] = useState(pageParam);
  const [artworks, setArtworks] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const notification = useNotification();
  const { isAuthenticated } = useAuth();
  const { addToWishlist, removeFromWishlist, wishlistItems, addToCart } = useCart();

  useEffect(() => {
    setSearchQuery(searchParam);
    setFilter(categoryParam || 'all');
    setPage(pageParam || 1);
  }, [searchParam, categoryParam, pageParam]);

  const updateParams = ({ search, category, page: nextPage }) => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (category && category !== 'all') params.set('category', category);
    if (nextPage && nextPage > 1) params.set('page', String(nextPage));
    setSearchParams(params);
  };

  const fetchArtworks = useCallback(async () => {
    try {
      setLoading(true);
      const res = await buyerAPI.getArtworks({
        page,
        limit: PAGE_SIZE,
        search: searchParam || undefined,
        category: categoryParam && categoryParam !== 'all' ? categoryParam : undefined,
      });

      const list = res?.data?.artworks || res?.data?.data || res?.data?.items || [];
      setArtworks(Array.isArray(list) ? list : []);
      const total = res?.data?.pagination?.totalPages || 1;
      setTotalPages(total > 0 ? total : 1);
    } catch (err) {
      console.error('Failed to fetch artworks:', err);
      setArtworks([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [page, searchParam, categoryParam]);

  useEffect(() => {
    fetchArtworks();
  }, [fetchArtworks]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    updateParams({ search: trimmed, category: filter, page: 1 });
  };

  const handleFilterChange = (value) => {
    setFilter(value);
    updateParams({ search: searchQuery.trim(), category: value, page: 1 });
  };

  const handlePageChange = (_, value) => {
    setPage(value);
    updateParams({ search: searchQuery.trim(), category: filter, page: value });
  };

  const handleWishlistClick = async (artwork) => {
    if (!isAuthenticated) {
      notification.showWarning('Please log in to add to wishlist');
      navigate('/login');
      return;
    }

    const isWishlisted = wishlistItems.some(
      (item) => item.artworkId === artwork.id || item.id === artwork.id
    );

    try {
      if (isWishlisted) {
        const result = await removeFromWishlist(artwork.id);
        if (result?.success) notification.showInfo('Removed from wishlist');
        else notification.showError(result?.error || 'Failed to remove');
      } else {
        const result = await addToWishlist(artwork);
        if (result?.success) notification.showSuccess('Added to wishlist');
        else notification.showError(result?.error || 'Failed to add');
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || 'Wishlist update failed';
      notification.showError(msg);
    }
  };

  const handleAddToCart = async (artwork) => {
    if (!isAuthenticated) {
      notification.showWarning('Please log in to add to cart');
      navigate('/login');
      return;
    }

    try {
      const result = await addToCart(artwork);
      if (result?.success) notification.showSuccess('Added to cart');
      else notification.showError(result?.error || 'Failed to add to cart');
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || 'Add to cart failed';
      notification.showError(msg);
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4, mt: { xs: 2, sm: 4 } }} component="form" onSubmit={handleSearchSubmit}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'stretch',
            gap: { xs: 1, sm: 1.5 },
            mb: 3,
          }}
        >
          <TextField
            fullWidth
            placeholder="Search artworks or artists..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{
              flex: '1 1 0',
              minWidth: 0,
              '& .MuiInputBase-root': {
                height: { xs: 42, sm: 48 },
                fontSize: { xs: '0.95rem', sm: '1rem' },
              },
            }}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />,
            }}
          />
          <FormControl
            sx={{
              flex: { xs: '0 0 36%', sm: '0 0 210px' },
              minWidth: { xs: 110, sm: 160 },
              '& .MuiInputBase-root': {
                height: { xs: 42, sm: 48 },
                fontSize: { xs: '0.95rem', sm: '1rem' },
              },
            }}
          >
            <Select
              value={filter}
              displayEmpty
              onChange={(e) => handleFilterChange(e.target.value)}
            >
              {CATEGORY_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        {(searchParam || categoryParam !== 'all') && (
          <Typography variant="body2" color="text.secondary">
            Showing results {searchParam ? `for "${searchParam}"` : 'for all terms'}
            {categoryParam !== 'all' ? ` in ${categoryParam}` : ''}
          </Typography>
        )}
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : artworks.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Typography variant="h6" color="text.secondary">
            No artworks found for this search.
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={{ xs: 2, md: 4 }}>
          {artworks.map((artwork) => {
            const isWishlisted = wishlistItems.some(
              (item) => item.artworkId === artwork.id || item.id === artwork.id
            );

            const artistName = artwork.artist_first_name
              ? `${artwork.artist_first_name} ${artwork.artist_last_name}`
              : artwork.artistName || 'Unknown Artist';
            const mediumLabel = artwork.medium || artwork.medium_type || 'N/A';
            const image = artwork.image_url || artwork.imageUrl || 'https://via.placeholder.com/400x300?text=No+Image';

            return (
              <Grid item xs={6} sm={6} md={3} key={artwork.id}>
                <Card
                  sx={{
                    position: 'relative',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: { xs: 2.5, sm: 3 },
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: 6,
                    },
                  }}
                >
                  <IconButton
                    sx={{
                      position: 'absolute',
                      top: { xs: 6, sm: 8 },
                      right: { xs: 6, sm: 8 },
                      backgroundColor: 'white',
                      p: { xs: 0.75, sm: 1 },
                      zIndex: 1,
                      '&:hover': { backgroundColor: 'white' },
                    }}
                    onClick={() => handleWishlistClick(artwork)}
                    aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                  >
                    {isWishlisted ? <Favorite color="error" /> : <FavoriteBorder />}
                  </IconButton>

                  <Link to={`/artwork/${artwork.id}`} style={{ textDecoration: 'none' }}>
                    <CardMedia
                      component="img"
                      image={image}
                      alt={artwork.title}
                      sx={{
                        height: { xs: 135, sm: 200 },
                        objectFit: 'cover',
                        backgroundColor: '#f5f5f5',
                      }}
                      onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/400x300?text=No+Image'; }}
                    />
                    <CardContent sx={{ flexGrow: 1, p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
                      <Typography gutterBottom variant="h6" noWrap sx={{ fontSize: { xs: '1.05rem', sm: '1.25rem' }, mb: { xs: 0.4, sm: 1 } }}>
                        {artwork.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        noWrap
                        title={artistName}
                        sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                      >
                        By {artistName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: { xs: 0.5, sm: 1 }, fontSize: { xs: '0.72rem', sm: '0.875rem' } }} noWrap>
                        {mediumLabel}
                      </Typography>
                      <Typography variant="h6" color="primary" sx={{ fontSize: { xs: '0.95rem', sm: '1.25rem' } }}>
                        ${artwork.price ? artwork.price.toLocaleString() : 'N/A'}
                      </Typography>
                      <Button
                        fullWidth
                        variant="contained"
                        sx={{ mt: { xs: 1.25, sm: 2 }, py: { xs: 0.8, sm: 1 }, fontSize: { xs: '0.72rem', sm: '0.875rem' }, whiteSpace: 'nowrap' }}
                        onClick={(e) => {
                          e.preventDefault();
                          handleAddToCart(artwork);
                        }}
                      >
                        Add to Cart
                      </Button>
                    </CardContent>
                  </Link>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 4 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            color="primary"
          />
        </Box>
      )}
    </Container>
  );
};

export default ArtworkGallery;