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
  Typography,
} from '@mui/material';
import { Favorite, FavoriteBorder, FilterList } from '@mui/icons-material';
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
  { label: 'Mixed Media', value: 'mixed-media' },
  { label: 'Drawing', value: 'drawing' },
  { label: 'Printmaking', value: 'printmaking' },
  { label: 'Textile Art', value: 'textile-art' },
];

const ArtworkGallery = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchParam = searchParams.get('search') || '';
  const categoryParam = searchParams.get('category') || 'all';
  const pageParam = Number(searchParams.get('page') || 1);

  const [filter, setFilter] = useState(categoryParam);
  const [page, setPage] = useState(pageParam);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [artworks, setArtworks] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const notification = useNotification();
  const { isAuthenticated, user } = useAuth();
  const { addToWishlist, removeFromWishlist, wishlistItems, addToCart } = useCart();
  const canAddToCart = isAuthenticated && ['buyer', 'user'].includes(user?.user_type);

  useEffect(() => {
    setFilter(categoryParam || 'all');
    setPage(pageParam || 1);
  }, [searchParam, categoryParam, pageParam]);

  useEffect(() => {
    if (!isCategoryOpen) return undefined;

    const isCategoryMenuElement = (target) =>
      target instanceof Element &&
      Boolean(target.closest('[data-category-menu="true"], [data-category-menu-paper="true"]'));

    const closeCategoryMenu = (event) => {
      if (isCategoryMenuElement(event.target)) return;
      setIsCategoryOpen(false);
    };

    window.addEventListener('scroll', closeCategoryMenu, true);
    window.addEventListener('touchmove', closeCategoryMenu, { passive: true, capture: true });
    window.addEventListener('wheel', closeCategoryMenu, { passive: true, capture: true });

    return () => {
      window.removeEventListener('scroll', closeCategoryMenu, true);
      window.removeEventListener('touchmove', closeCategoryMenu, true);
      window.removeEventListener('wheel', closeCategoryMenu, true);
    };
  }, [isCategoryOpen]);

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

  const handleFilterChange = (value) => {
    setFilter(value);
    updateParams({ search: searchParam, category: value, page: 1 });
  };

  const handlePageChange = (_, value) => {
    setPage(value);
    updateParams({ search: searchParam, category: filter, page: value });
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

    if (!canAddToCart) {
      notification.showWarning('Only buyers can add items to cart');
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
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', md: 'center' }, gap: 2, mb: 4, backgroundColor: 'white', p: { xs: 2, md: 3 }, borderRadius: 3, boxShadow: 2, border: '1px solid rgba(15,23,42,0.06)' }}>
        <Typography variant="h6" component="h2" sx={{ order: { xs: 2, md: 1 } }}>
          Featured Artworks
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', order: { xs: 1, md: 2 } }}>
          <FilterList />
          <FormControl sx={{ minWidth: 150 }}>
            <Select
              value={filter}
              onChange={(e) => handleFilterChange(e.target.value)}
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
                  'data-category-menu-paper': 'true',
                  sx: {
                    maxHeight: 300,
                    mt: 0.5,
                  },
                },
              }}
            >
              <MenuItem value="all">All Categories</MenuItem>
              {CATEGORY_OPTIONS.filter((option) => option.value !== 'all').map((option) => (
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
        <Grid container spacing={{ xs: 1, sm: 1.25, md: 1.5 }}>
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
              <Grid item xs={6} sm={4} md={3} lg={2} key={artwork.id}>
                <Card
                  sx={{
                    position: 'relative',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 1.5,
                    border: '1px solid rgba(15,23,42,0.1)',
                    overflow: 'hidden',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: 6,
                    },
                  }}
                >
                  <IconButton
                    sx={{
                      position: 'absolute',
                      top: { xs: 5, sm: 7 },
                      right: { xs: 5, sm: 7 },
                      backgroundColor: 'white',
                      p: { xs: 0.55, sm: 0.8 },
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
                        height: { xs: 120, sm: 155, md: 170 },
                        objectFit: 'cover',
                        backgroundColor: '#f5f5f5',
                      }}
                      onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/400x300?text=No+Image'; }}
                    />
                    <CardContent sx={{ flexGrow: 1, p: { xs: 1, sm: 1.4 }, '&:last-child': { pb: { xs: 1, sm: 1.4 } } }}>
                      <Typography gutterBottom variant="h6" noWrap sx={{ fontSize: { xs: '0.92rem', sm: '1.05rem' }, mb: { xs: 0.25, sm: 0.5 } }}>
                        {artwork.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        noWrap
                        title={artistName}
                        sx={{ fontSize: { xs: '0.68rem', sm: '0.8rem' } }}
                      >
                        By {artistName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: { xs: 0.35, sm: 0.6 }, fontSize: { xs: '0.66rem', sm: '0.78rem' } }} noWrap>
                        {mediumLabel}
                      </Typography>
                      <Typography variant="h6" color="primary" sx={{ fontSize: { xs: '0.84rem', sm: '1rem' }, fontWeight: 800 }}>
                        ${artwork.price ? artwork.price.toLocaleString() : 'N/A'}
                      </Typography>
                      <Button
                        fullWidth
                        variant="contained"
                        sx={{ mt: { xs: 0.9, sm: 1.3 }, py: { xs: 0.58, sm: 0.75 }, fontSize: { xs: '0.66rem', sm: '0.78rem' }, whiteSpace: 'nowrap', borderRadius: 1.5 }}
                        disabled={!canAddToCart || artwork.isSold}
                        onClick={(e) => {
                          e.preventDefault();
                          handleAddToCart(artwork);
                        }}
                      >
                        {artwork.isSold ? 'Sold Out' : canAddToCart ? 'Add to Cart' : 'Buyers Only'}
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