import React from 'react';
import {
  Container,
  Grid,
  Card,
  CardMedia,
  Typography,
  Box,
  Button,
  IconButton,
  Paper,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
 } from '@mui/material';
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  ShoppingBag as BagIcon,
  Payment as PaymentIcon,
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

const Cart = () => {
  const { cartItems, removeFromCart, updateQuantity, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const notification = useNotification();

  const handleQuantityChange = (itemId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(itemId);
    } else {
      updateQuantity(itemId, newQuantity);
    }
  };

  const handleRemoveItem = (itemId) => {
    removeFromCart(itemId);
  };

  const handleCheckout = () => {
    if (!user) {
      notification.showError('Please login to checkout');
      navigate('/login');
      return;
    }
    
    if (cartItems.length === 0) {
      notification.showError('Your cart is empty');
      return;
    }
    navigate('/checkout');
  };

  if (cartItems.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 8, textAlign: 'center' }}>
        <BagIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
        <Typography variant="h5" gutterBottom>
          Your cart is empty
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Add some artworks to your cart to see them here.
        </Typography>
        <Button
          variant="contained"
          component={Link}
          to="/artworks"
          sx={{ mt: 2 }}
        >
          Browse Artworks
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Shopping Cart
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {cartItems.reduce((sum, item) => sum + item.quantity, 0)} items in your cart
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Cart Items */}
        <Grid item xs={12}>
          <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
            {cartItems.map((item) => {
              const fallbackImage = 'https://images.unsplash.com/photo-1528901166007-3784c7dd3653?auto=format&fit=crop&w=400&q=80';
              const imageSrc = (item.image_url || item.imageUrl || item.image || '').trim() || fallbackImage;
              const detailId = item.artwork_id || item.artworkId || item.id;

              return (
                <Card key={item.id} variant="outlined" sx={{ mb: 1.5, p: 1.25, overflow: 'hidden' }}>
                  <Box sx={{ display: 'flex', gap: 1.25, minWidth: 0 }}>
                    <CardMedia
                      component="img"
                      sx={{ width: 72, height: 72, borderRadius: 1, cursor: 'pointer', objectFit: 'cover', backgroundColor: '#f5f5f5', flexShrink: 0 }}
                      image={imageSrc}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      crossOrigin="anonymous"
                      onClick={() => navigate(`/artwork/${detailId}`)}
                      onError={(e) => { e.target.onerror = null; e.target.src = fallbackImage; }}
                    />

                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography
                        variant="subtitle2"
                        component={Link}
                        to={`/artwork/${detailId}`}
                        sx={{
                          textDecoration: 'none',
                          color: 'inherit',
                          '&:hover': { color: 'primary.main' },
                          display: 'block',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {item.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        By {item.artist_first_name} {item.artist_last_name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ${item.price?.toLocaleString()} each
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
                    <IconButton size="small" onClick={() => handleQuantityChange(item.id, item.quantity - 1)}>
                      <RemoveIcon fontSize="small" />
                    </IconButton>

                    <TextField
                      size="small"
                      value={item.quantity}
                      onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}
                      sx={{ width: 52 }}
                      inputProps={{ min: 1, style: { textAlign: 'center', padding: '6px 4px' } }}
                    />

                    <IconButton size="small" onClick={() => handleQuantityChange(item.id, item.quantity + 1)}>
                      <AddIcon fontSize="small" />
                    </IconButton>

                    <Typography variant="subtitle2" sx={{ ml: 'auto', whiteSpace: 'nowrap' }}>
                      ${((item.price || 0) * item.quantity).toLocaleString()}
                    </Typography>

                    <IconButton color="error" size="small" onClick={() => handleRemoveItem(item.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Card>
              );
            })}
          </Box>

          <TableContainer component={Paper} elevation={0} variant="outlined" sx={{ display: { xs: 'none', sm: 'block' } }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Product</TableCell>
                  <TableCell align="center">Price</TableCell>
                  <TableCell align="center">Quantity</TableCell>
                  <TableCell align="center">Total</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {cartItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {(() => {
                          const fallbackImage = 'https://images.unsplash.com/photo-1528901166007-3784c7dd3653?auto=format&fit=crop&w=400&q=80';
                          const imageSrc = (item.image_url || item.imageUrl || item.image || '').trim() || fallbackImage;
                          const detailId = item.artwork_id || item.artworkId || item.id;
                          return (
                            <CardMedia
                              component="img"
                              sx={{ width: 80, height: 80, borderRadius: 1, mr: 2, cursor: 'pointer', objectFit: 'cover', backgroundColor: '#f5f5f5' }}
                              image={imageSrc}
                              alt={item.title}
                              referrerPolicy="no-referrer"
                              crossOrigin="anonymous"
                              onClick={() => navigate(`/artwork/${detailId}`)}
                              onError={(e) => { e.target.onerror = null; e.target.src = fallbackImage; }}
                            />
                          );
                        })()}
                        <Box>
                          <Typography
                            variant="subtitle1"
                            component={Link}
                            to={`/artwork/${item.artwork_id || item.artworkId || item.id}`}
                            sx={{
                              textDecoration: 'none',
                              color: 'inherit',
                              '&:hover': { color: 'primary.main' },
                            }}
                          >
                            {item.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            By {item.artist_first_name} {item.artist_last_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {item.medium} • {item.year}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    
                    <TableCell align="center">
                      <Typography variant="body1">
                        ${item.price?.toLocaleString()}
                      </Typography>
                    </TableCell>
                    
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <IconButton
                          size="small"
                          onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                        >
                          <RemoveIcon />
                        </IconButton>
                        
                        <TextField
                          size="small"
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}
                          sx={{ width: 60, mx: 1 }}
                          inputProps={{ 
                            min: 1,
                            style: { textAlign: 'center' }
                          }}
                        />
                        
                        <IconButton
                          size="small"
                          onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        >
                          <AddIcon />
                        </IconButton>
                      </Box>
                    </TableCell>
                    
                    <TableCell align="center">
                      <Typography variant="body1" fontWeight="bold">
                        ${((item.price || 0) * item.quantity).toLocaleString()}
                      </Typography>
                    </TableCell>
                    
                    <TableCell align="center">
                      <IconButton
                        color="error"
                        onClick={() => handleRemoveItem(item.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          <Box sx={{ display: 'flex', justifyContent: { xs: 'stretch', sm: 'flex-end' }, flexDirection: 'row', gap: 1, mt: 3 }}>
            <Button
              variant="contained"
              component={Link}
              to="/artworks"
              size="small"
              sx={{
                border: '1px solid',
                borderColor: 'primary.main',
                flex: { xs: 1, sm: '0 0 auto' },
                minWidth: 0,
                width: { md: 220 },
                minHeight: { xs: 'auto', sm: 40, md: 44 },
                whiteSpace: 'nowrap',
              }}
            >
              Continue Shopping
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              size="small"
              sx={{
                flex: { xs: 1, sm: '0 0 auto' },
                minWidth: 0,
                width: { md: 220 },
                minHeight: { xs: 'auto', sm: 40, md: 44 },
                whiteSpace: 'nowrap',
              }}
              onClick={() => {
                if (window.confirm('Are you sure you want to clear your cart?')) {
                  clearCart();
                }
              }}
            >
              Clear Cart
            </Button>
          </Box>
          <Box sx={{ mt: 2, display: 'flex', justifyContent: { xs: 'stretch', sm: 'flex-end' } }}>
            <Button
              fullWidth={false}
              variant="contained"
              size="large"
              startIcon={<PaymentIcon />}
              onClick={handleCheckout}
              sx={{
                width: { xs: '100%', sm: 'auto', md: 220 },
                minWidth: { sm: 220, md: 220 },
                minHeight: { xs: 'auto', sm: 40, md: 44 },
              }}
            >
              Checkout
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Cart;