import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  Chip,
  CircularProgress,
  Container,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { Favorite, FavoriteBorder, Search, ShoppingCart } from '@mui/icons-material';
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
      <Box sx={{ mb: 4, mt: 4 }} component="form" onSubmit={handleSearchSubmit}>
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <TextField
            fullWidth
            placeholder="Search artworks or artists..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />,
            }}
          />
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={filter}
              label="Category"
              onChange={(e) => handleFilterChange(e.target.value)}
            >
              {CATEGORY_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button variant="contained" type="submit" sx={{ px: 3 }}>
            Search
          </Button>
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
        <Grid container spacing={4}>
          {artworks.map((artwork) => {
            const isWishlisted = wishlistItems.some(
              (item) => item.artworkId === artwork.id || item.id === artwork.id
            );

            const artistName = artwork.artist_first_name
              ? `${artwork.artist_first_name} ${artwork.artist_last_name}`
              : artwork.artistName || 'Unknown Artist';
            const categoryLabel = artwork.category_name || artwork.category || 'Uncategorized';
            const mediumLabel = artwork.medium || artwork.medium_type || 'N/A';
            const image = artwork.image_url || artwork.imageUrl || 'https://via.placeholder.com/400x300?text=No+Image';

            return (
              <Grid item xs={12} sm={6} md={4} key={artwork.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Link to={`/artwork/${artwork.id}`} style={{ textDecoration: 'none' }}>
                    <CardMedia
                      component="img"
                      height="250"
                      image={image}
                      alt={artwork.title}
                      sx={{ objectFit: 'cover', backgroundColor: '#f5f5f5' }}
                      onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/400x300?text=No+Image'; }}
                    />
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography gutterBottom variant="h6" noWrap>
                        {artwork.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        noWrap
                        title={artistName}
                      >
                        By {artistName}
                      </Typography>
                      <Box sx={{ mt: 1, mb: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Chip label={categoryLabel} size="small" sx={{ mr: 1 }} />
                        <Chip label={mediumLabel} size="small" variant="outlined" />
                      </Box>
                      <Typography variant="h6" color="primary">
                        ${artwork.price ? artwork.price.toLocaleString() : 'N/A'}
                      </Typography>
                    </CardContent>
                  </Link>
                  <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                    <IconButton
                      size="small"
                      sx={{ mr: 1 }}
                      onClick={() => handleWishlistClick(artwork)}
                      aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                    >
                      {isWishlisted ? <Favorite color="error" /> : <FavoriteBorder />}
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