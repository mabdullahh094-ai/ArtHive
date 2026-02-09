import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  Grid,
  Divider,
  Chip,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { checkoutAPI } from '../../services/api';

const OrderConfirmation = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const data = await checkoutAPI.getOrderById(orderId);
      setOrder(data);
    } catch (error) {
      console.error('Failed to fetch order:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <Typography>Loading order details...</Typography>
      </Container>
    );
  }

  if (!order) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          Order not found
        </Typography>
        <Button component={Link} to="/" variant="contained">
          Return Home
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <CheckCircleIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
        
        <Typography variant="h4" gutterBottom>
          Thank you for your order!
        </Typography>
        
        <Typography variant="body1" color="text.secondary" paragraph>
          Your order has been confirmed and is being processed.
        </Typography>
        
        <Chip 
          label={`Order #${order.orderNumber}`} 
          color="primary" 
          sx={{ mb: 3 }}
        />
        
        <Box sx={{ my: 4 }}>
          <Grid container spacing={3} justifyContent="center">
            <Grid item xs={12} sm={4}>
              <Typography variant="subtitle2" color="text.secondary">
                Total Amount
              </Typography>
              <Typography variant="h5">
                ${order.total.toFixed(2)}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="subtitle2" color="text.secondary">
                Payment Status
              </Typography>
              <Typography variant="h6" color="success.main">
                Paid
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="subtitle2" color="text.secondary">
                Order Date
              </Typography>
              <Typography variant="h6">
                {new Date(order.createdAt).toLocaleDateString()}
              </Typography>
            </Grid>
          </Grid>
        </Box>
        
        <Divider sx={{ my: 4 }} />
        
        <Typography variant="body1" paragraph>
          A confirmation email has been sent to {order.email}
        </Typography>
        
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 2 }}>
          <Button
            variant="contained"
            component={Link}
            to="/artworks"
          >
            Continue Shopping
          </Button>
          <Button
            variant="outlined"
            component={Link}
            to="/orders"
          >
            View All Orders
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default OrderConfirmation;