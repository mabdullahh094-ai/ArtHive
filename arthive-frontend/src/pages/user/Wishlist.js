import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Button,
  IconButton,
  Divider,
  Paper,
  Chip,
  CircularProgress,
  } from '@mui/material';
import {
  Delete as DeleteIcon,
  ShoppingCart as CartIcon,
  Visibility as ViewIcon,
  Favorite as FavoriteIcon,
  ArrowBack as BackIcon,
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useNotification } from '../../context/NotificationContext';

const Wishlist = () => {
  const [loading, setLoading] = useState(true);
  
  const { user, isLoading: authLoading } = useAuth();
  const { addToCart, wishlistItems, removeFromWishlist, loading: cartLoading } = useCart();
  const navigate = useNavigate();
  const notification = useNotification();

  useEffect(() => {
    // Wait until auth state is known before redirecting
    if (authLoading) return;

    if (!user) {
      navigate('/login');
      return;
    }
    // Data comes from cart context, so just mark as loaded
    setLoading(cartLoading);
  }, [user, authLoading, navigate, cartLoading]);

  const handleRemoveFromWishlist = async (artworkId) => {
    try {
      await removeFromWishlist(artworkId);
      notification.showSuccess('Removed from wishlist');
    } catch (err) {
      notification.showError('Failed to remove item');
      console.error('Error removing from wishlist:', err);
    }
  };

  const handleMoveToCart = async (artwork) => {
    try {
      await addToCart(artwork.artworkId || artwork.id, 1);
      await removeFromWishlist(artwork.artworkId || artwork.id);
      notification.showSuccess('Moved to cart!');
    } catch (err) {
      notification.showError('Failed to move to cart');
      console.error('Error moving to cart:', err);
    }
  };

  const handleClearWishlist = async () => {
    if (window.confirm('Are you sure you want to clear your entire wishlist?')) {
      try {
        // Remove all items from wishlist
        await Promise.all(wishlistItems.map(item => removeFromWishlist(item.artworkId || item.id)));
        notification.showSuccess('Wishlist cleared');
      } catch (err) {
        notification.showError('Failed to clear wishlist');
        console.error('Error clearing wishlist:', err);
      }
    }
  };

  if (authLoading || loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading your wishlist...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate(-1)}
          sx={{ mb: 2 }}
        >
          Back
        </Button>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              My Wishlist
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'} saved
            </Typography>
          </Box>
          
          {wishlistItems.length > 0 && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleClearWishlist}
            >
              Clear All
            </Button>
          )}
        </Box>
      </Box>

      <Divider sx={{ mb: 4 }} />

      {/* Wishlist Items */}
      {wishlistItems.length === 0 ? (
        <Paper sx={{ p: 8, textAlign: 'center' }}>
          <FavoriteIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Your wishlist is empty
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Save artworks you love to your wishlist to view them later.
          </Typography>
          <Button
            variant="contained"
            component={Link}
            to="/artworks"
            sx={{ mt: 2 }}
          >
            Browse Artworks
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {wishlistItems.map((item) => (
            <Grid item xs={12} key={item.id}>
              <Card sx={{ display: 'flex', height: 200 }}>
                {/* Artwork Image */}
                <CardMedia
                  component="img"
                  sx={{ width: 200, cursor: 'pointer' }}
                  image={item.image}
                  alt={item.title}
                  onClick={() => navigate(`/artwork/${item.artworkId}`)}
                />
                
                <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <CardContent sx={{ flex: '1 0 auto' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <Typography
                          variant="h6"
                          component={Link}
                          to={`/artwork/${item.artworkId}`}
                          sx={{
                            textDecoration: 'none',
                            color: 'inherit',
                            '&:hover': { color: 'primary.main' },
                          }}
                        >
                          {item.title}
                        </Typography>
                        
                        <Typography
                          variant="body2"
                          color="primary"
                          component={Link}
                          to={`/artists/${item.artistId}`}
                          sx={{
                            textDecoration: 'none',
                            '&:hover': { textDecoration: 'underline' },
                          }}
                        >
                          {item.artist?.name || item.artist}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', gap: 1, mt: 1, mb: 1 }}>
                          <Chip label={item.category} size="small" />
                          <Chip label={item.medium} size="small" variant="outlined" />
                        </Box>
                        
                        <Typography variant="body2" color="text.secondary">
                          {item.year} • {item.dimensions}
                        </Typography>
                      </Box>
                      
                      <Typography variant="h6" color="primary">
                        ${item.price.toLocaleString()}
                      </Typography>
                    </Box>
                    
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                      Added on {new Date(item.addedDate).toLocaleDateString()}
                    </Typography>
                  </CardContent>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 2, pt: 0 }}>
                    <Box>
                      <IconButton
                        aria-label="view artwork"
                        onClick={() => navigate(`/artwork/${item.artworkId}`)}
                        sx={{ mr: 1 }}
                      >
                        <ViewIcon />
                      </IconButton>
                      
                      <IconButton
                        aria-label="remove from wishlist"
                        onClick={() => handleRemoveFromWishlist(item.artworkId || item.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                    
                    <Button
                      variant="contained"
                      startIcon={<CartIcon />}
                      onClick={() => handleMoveToCart(item)}
                    >
                      Move to Cart
                    </Button>
                  </Box>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Summary */}
      {wishlistItems.length > 0 && (
        <Paper sx={{ p: 3, mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Wishlist Summary
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body1">
              Total value: <strong>${wishlistItems.reduce((sum, item) => sum + item.price, 0).toLocaleString()}</strong>
            </Typography>
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={async () => {
                try {
                  // Add all items to cart and remove from wishlist
                  await Promise.all(
                    wishlistItems.map(item => 
                      addToCart(item.artworkId || item.id, 1)
                    )
                  );
                  await Promise.all(
                    wishlistItems.map(item => 
                      removeFromWishlist(item.artworkId || item.id)
                    )
                  );
                  notification.showSuccess('All items moved to cart!');
                } catch (err) {
                  notification.showError('Failed to move items to cart');
                  console.error('Error moving items:', err);
                }
              }}
            >
              Add All to Cart
            </Button>
          </Box>
        </Paper>
      )}
    </Container>
  );
};

export default Wishlist;