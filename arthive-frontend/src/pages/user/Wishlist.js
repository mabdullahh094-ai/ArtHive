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
  Checkbox,
  } from '@mui/material';
import {
  Delete as DeleteIcon,
  ShoppingCart as CartIcon,
  Visibility as ViewIcon,
  Favorite as FavoriteIcon,
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useNotification } from '../../context/NotificationContext';

const Wishlist = () => {
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState(new Set());
  
  const { user, isLoading: authLoading } = useAuth();
  const { addToCart, wishlistItems, removeFromWishlist, loading: cartLoading } = useCart();
  const navigate = useNavigate();
  const notification = useNotification();
  const canAddToCart = !!user && ['buyer', 'user'].includes(user?.user_type);

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
    if (!canAddToCart) {
      notification.showWarning('Only buyers can add items to cart');
      return;
    }

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

  const handleSelectItem = (itemId) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const handleAddSelectedToCart = async () => {
    if (selectedItems.size === 0) {
      notification.showError('Please select at least one item');
      return;
    }

    try {
      const itemsToAdd = wishlistItems.filter(
        (item) => selectedItems.has(item.artworkId || item.id)
      );

      await Promise.all(
        itemsToAdd.map((item) => addToCart(item.artworkId || item.id, 1))
      );

      await Promise.all(
        itemsToAdd.map((item) => removeFromWishlist(item.artworkId || item.id))
      );

      notification.showSuccess(`${itemsToAdd.length} item(s) added to cart!`);
      setSelectedItems(new Set());
    } catch (err) {
      notification.showError('Failed to add selected items to cart');
      console.error('Error adding to cart:', err);
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
    <Container maxWidth="lg" sx={{ py: { xs: 2.5, md: 4 } }}>
      {/* Header */}
      <Box sx={{ mb: { xs: 3, md: 4 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1.25 }}>
          <Box sx={{ minWidth: 0, pr: 1 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              My Wishlist
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'} saved
              {selectedItems.size > 0 && ` • ${selectedItems.size} selected`}
            </Typography>
          </Box>
          
          {wishlistItems.length > 0 && (
            <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
              {selectedItems.size >= 2 && (
                <Button
                  variant="contained"
                  startIcon={<CartIcon />}
                  disabled={!canAddToCart}
                  onClick={handleAddSelectedToCart}
                  sx={{ whiteSpace: 'nowrap' }}
                >
                  {canAddToCart ? 'Add Selected to Cart' : 'Buyers Only'}
                </Button>
              )}
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleClearWishlist}
                sx={{ whiteSpace: 'nowrap' }}
              >
                Clear All
              </Button>
            </Box>
          )}
        </Box>
      </Box>

      <Divider sx={{ mb: { xs: 3, md: 4 } }} />

      {/* Wishlist Items */}
      {wishlistItems.length === 0 ? (
        <Paper sx={{ p: { xs: 4, md: 8 }, textAlign: 'center' }}>
          <FavoriteIcon sx={{ fontSize: { xs: 60, md: 80 }, color: 'text.disabled', mb: 2 }} />
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
        <Grid container spacing={{ xs: 1.5, md: 2 }}>
          {wishlistItems.map((item) => {
            const itemId = item.artworkId || item.id;
            const isSelected = selectedItems.has(itemId);
            return (
            <Grid item xs={12} key={item.id}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Checkbox
                  checked={isSelected}
                  onChange={() => handleSelectItem(itemId)}
                  sx={{ flexShrink: 0 }}
                />
                <Card sx={{ display: 'flex', flexDirection: 'row', minHeight: { xs: 96, sm: 142 }, overflow: 'hidden', flex: 1 }}>
                  {/* Artwork Image */}
                  <CardMedia
                    component="img"
                    sx={{ width: { xs: 72, sm: 136 }, height: { xs: 96, sm: 'auto' }, cursor: 'pointer', flexShrink: 0 }}
                    image={item.image}
                    alt={item.title}
                    onClick={() => navigate(`/artwork/${item.artworkId}`)}
                  />
                
                <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                  <CardContent sx={{ flex: '1 0 auto', p: { xs: 0.6, sm: 1.1 }, pb: { xs: 0.2, sm: 0.45 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: { xs: 0.5, sm: 0 } }}>
                      <Box sx={{ minWidth: 0, pr: 0.5 }}>
                        <Typography
                          variant="subtitle1"
                          component={Link}
                          to={`/artwork/${item.artworkId}`}
                          sx={{
                            textDecoration: 'none',
                            color: 'inherit',
                            '&:hover': { color: 'primary.main' },
                            fontWeight: 700,
                            fontSize: { xs: '0.8rem', sm: '0.92rem' },
                            lineHeight: 1.2,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
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
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: 'block',
                            fontSize: { xs: '0.72rem', sm: '0.8rem' },
                          }}
                        >
                          {item.artist?.name || item.artist}
                        </Typography>
                        
                        {(item.category || item.medium) && (
                          <Box sx={{ display: 'flex', gap: 0.5, mt: 0.35, mb: 0.3, flexWrap: 'wrap' }}>
                            {item.category && (
                              <Chip label={item.category} size="small" sx={{ height: 20, '& .MuiChip-label': { px: 0.8, fontSize: '0.64rem' } }} />
                            )}
                            {item.medium && (
                              <Chip label={item.medium} size="small" variant="outlined" sx={{ display: { xs: 'none', sm: 'inline-flex' }, height: 20, '& .MuiChip-label': { px: 0.8, fontSize: '0.64rem' } }} />
                            )}
                          </Box>
                        )}
                        
                        {([item.year, item.dimensions].filter(Boolean).length > 0) && (
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.66rem', sm: '0.78rem' }, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {[item.year, item.dimensions].filter(Boolean).join(' • ')}
                          </Typography>
                        )}
                      </Box>
                      
                      <Typography variant="subtitle1" color="primary" sx={{ fontWeight: 700, fontSize: { xs: '0.86rem', sm: '0.92rem' }, lineHeight: 1, whiteSpace: 'nowrap' }}>
                        ${item.price.toLocaleString()}
                      </Typography>
                    </Box>
                    
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.1, fontSize: { xs: '0.62rem', sm: '0.7rem' } }}>
                      Added on {new Date(item.addedDate).toLocaleDateString()}
                    </Typography>
                  </CardContent>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', p: { xs: 0.6, sm: 1.1 }, pt: 0, flexDirection: 'row', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
                    <Box sx={{ flexShrink: 0, display: { xs: 'none', sm: 'flex' } }}>
                      <IconButton
                        aria-label="view artwork"
                        onClick={() => navigate(`/artwork/${item.artworkId}`)}
                        size="small"
                        sx={{ mr: 0.5 }}
                      >
                        <ViewIcon />
                      </IconButton>
                      
                      <IconButton
                        aria-label="remove from wishlist"
                        onClick={() => handleRemoveFromWishlist(item.artworkId || item.id)}
                        color="error"
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                    
                    <Button
                      variant="contained"
                      startIcon={<CartIcon />}
                      disabled={!canAddToCart}
                      onClick={() => handleMoveToCart(item)}
                      sx={{
                        ml: 'auto',
                        minWidth: 0,
                        maxWidth: '100%',
                        px: { xs: 0.75, sm: 1.5 },
                        whiteSpace: 'nowrap',
                        flexShrink: 1,
                        fontSize: { xs: '0.64rem', sm: '0.76rem' },
                        '& .MuiButton-startIcon': { mr: { xs: 0.35, sm: 1 }, ml: 0 },
                        display: { xs: 'none', sm: 'inline-flex' },
                      }}
                      size="small"
                    >
                      {canAddToCart ? 'Move to Cart' : 'Buyers Only'}
                    </Button>

                  </Box>
                </Box>
              </Card>
              </Box>
            </Grid>
            );
          })}
        </Grid>
      )}

      {/* Summary */}
      {wishlistItems.length > 0 && (
        <Paper sx={{ p: { xs: 2, md: 3 }, mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Wishlist Summary
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 1.5, sm: 0 } }}>
            <Typography variant="body1">
              Total value: <strong>${wishlistItems.reduce((sum, item) => sum + item.price, 0).toLocaleString()}</strong>
            </Typography>
            <Button
              variant="contained"
              color="primary"
              size="large"
              sx={{ width: { xs: '100%', sm: 'auto' } }}
              onClick={async () => {
                try {
                  // If items are selected, add only selected items; otherwise add all
                  const itemsToProcess = selectedItems.size > 0 
                    ? wishlistItems.filter(item => selectedItems.has(item.artworkId || item.id))
                    : wishlistItems;

                  await Promise.all(
                    itemsToProcess.map(item => 
                      addToCart(item.artworkId || item.id, 1)
                    )
                  );
                  await Promise.all(
                    itemsToProcess.map(item => 
                      removeFromWishlist(item.artworkId || item.id)
                    )
                  );
                  
                  notification.showSuccess(`${itemsToProcess.length} item(s) moved to cart!`);
                  if (selectedItems.size > 0) {
                    setSelectedItems(new Set());
                  }
                } catch (err) {
                  notification.showError('Failed to move items to cart');
                  console.error('Error moving items:', err);
                }
              }}
            >
              {selectedItems.size > 0 ? `Add Selected (${selectedItems.size}) to Cart` : 'Add All to Cart'}
            </Button>
          </Box>
        </Paper>
      )}
    </Container>
  );
};

export default Wishlist;