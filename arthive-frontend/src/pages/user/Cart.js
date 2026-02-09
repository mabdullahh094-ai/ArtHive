import React, { useState } from 'react';
import {
  Container,
  Grid,
  CardMedia,
  Typography,
  Box,
  Button,
  IconButton,
  Divider,
  Paper,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
 } from '@mui/material';
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  ShoppingBag as BagIcon,
  ArrowBack as BackIcon,
  LocalShipping as ShippingIcon,
  Payment as PaymentIcon,
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

const Cart = () => {
  const { cartItems, removeFromCart, updateQuantity, clearCart, getCartTotal } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const notification = useNotification();
  
  const [loading] = useState(false);
  const [shipping] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [promoCode, setPromoCode] = useState('');

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
    
    // Navigate to checkout page (you can create this later)
    notification.showSuccess('Proceeding to checkout');
    // navigate('/checkout');
  };

  const handleApplyPromo = () => {
    if (promoCode === 'ARTHIVE10') {
      setDiscount(getCartTotal() * 0.1); // 10% discount
      notification.showSuccess('Promo code applied! 10% discount');
    } else if (promoCode) {
      notification.showError('Invalid promo code');
    }
  };

  const subtotal = getCartTotal();
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + shipping + tax - discount;

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
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate(-1)}
          sx={{ mb: 2 }}
        >
          Continue Shopping
        </Button>
        
        <Typography variant="h4" component="h1" gutterBottom>
          Shopping Cart
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {cartItems.reduce((sum, item) => sum + item.quantity, 0)} items in your cart
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Cart Items */}
        <Grid item xs={12} md={8}>
          <TableContainer component={Paper} elevation={0} variant="outlined">
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
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => {
                if (window.confirm('Are you sure you want to clear your cart?')) {
                  clearCart();
                }
              }}
            >
              Clear Cart
            </Button>
          </Box>
        </Grid>
        
        {/* Order Summary */}
        <Grid item xs={12} md={4}>
          <Paper elevation={0} variant="outlined" sx={{ p: 3, position: 'sticky', top: 20 }}>
            <Typography variant="h6" gutterBottom>
              Order Summary
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              {/* Promo Code */}
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Promo code"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                />
                <Button
                  variant="outlined"
                  onClick={handleApplyPromo}
                  disabled={!promoCode}
                >
                  Apply
                </Button>
              </Box>
              
              {/* Shipping */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Shipping</Typography>
                <Typography variant="body2">
                  {shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}
                </Typography>
              </Box>
              
              {/* Discount */}
              {discount > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Discount</Typography>
                  <Typography variant="body2" color="success.main">
                    -${discount.toFixed(2)}
                  </Typography>
                </Box>
              )}
              
              {/* Tax */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Tax (8%)</Typography>
                <Typography variant="body2">${tax.toFixed(2)}</Typography>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              {/* Total */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6">Total</Typography>
                <Typography variant="h6" color="primary">
                  ${total.toFixed(2)}
                </Typography>
              </Box>
            </Box>
            
            <Button
              fullWidth
              variant="contained"
              size="large"
              startIcon={<PaymentIcon />}
              onClick={handleCheckout}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Proceed to Checkout'}
            </Button>
            
            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block', textAlign: 'center' }}>
              <ShippingIcon sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
              Free shipping on orders over $500
            </Typography>
            
            <Divider sx={{ my: 3 }} />
            
            <Typography variant="body2" color="text.secondary" paragraph>
              Need help? Contact our support team.
            </Typography>
            
            <Button
              fullWidth
              variant="text"
              size="small"
              component={Link}
              to="/contact"
            >
              Contact Support
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Cart;