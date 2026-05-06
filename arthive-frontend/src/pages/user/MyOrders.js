import React, { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import PaidOutlinedIcon from '@mui/icons-material/PaidOutlined';
import { useAuth } from '../../context/AuthContext';
import { artistAPI, orderAPI } from '../../services/api';

const formatCurrency = (value) => {
  const amount = Number(value || 0);
  return `$${amount.toFixed(2)}`;
};

const formatDate = (value) => {
  if (!value) return 'Not available';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not available';

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const getStatusColor = (status) => {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'completed' || normalized === 'confirmed') return 'success';
  if (normalized === 'processing' || normalized === 'pending') return 'warning';
  if (normalized === 'failed' || normalized === 'cancelled') return 'error';
  return 'default';
};

const MyOrders = () => {
  const { user } = useAuth();
  const isArtist = user?.user_type === 'artist';
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError('');
        const response = isArtist ? await artistAPI.getOrders() : await orderAPI.getAll();
        setOrders(response?.data?.orders || []);
      } catch (err) {
        console.error('Failed to fetch orders:', err);
        setError('Unable to load orders right now. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [isArtist]);

  const summary = useMemo(() => {
    const totalOrders = orders.length;
    const totalSpent = orders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
    const activeShipments = orders.filter((order) => {
      const s = String(order.status || '').toLowerCase();
      return s === 'pending' || s === 'processing';
    }).length;

    return {
      totalOrders,
      totalSpent,
      activeShipments,
    };
  }, [orders]);

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
      <Box
        sx={{
          p: { xs: 2.5, md: 3.5 },
          borderRadius: 3,
          background: 'linear-gradient(135deg, #f0fdf4 0%, #eef2ff 100%)',
          border: '1px solid #dbeafe',
          mb: 3,
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
          {isArtist ? 'Sales Orders' : 'My Orders'}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {isArtist
            ? 'Track orders placed on your artworks and monitor fulfillment status.'
            : 'Track your purchases, shipping progress, and payment history in one place.'}
        </Typography>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card variant="outlined" sx={{ borderRadius: 2.5 }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <ReceiptLongOutlinedIcon color="primary" />
              <Box>
                <Typography variant="caption" color="text.secondary">Total Orders</Typography>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>{summary.totalOrders}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card variant="outlined" sx={{ borderRadius: 2.5 }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <PaidOutlinedIcon color="success" />
              <Box>
                <Typography variant="caption" color="text.secondary">{isArtist ? 'Total Sales' : 'Total Spent'}</Typography>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>{formatCurrency(summary.totalSpent)}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card variant="outlined" sx={{ borderRadius: 2.5 }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <LocalShippingOutlinedIcon color="warning" />
              <Box>
                <Typography variant="caption" color="text.secondary">Active Shipments</Typography>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>{summary.activeShipments}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : orders.length === 0 ? (
        <Card variant="outlined" sx={{ borderRadius: 3, p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>No orders yet</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {isArtist
              ? 'No customer orders found yet for your artworks.'
              : 'You have not placed any orders. Explore artworks and place your first order.'}
          </Typography>
          <Button component={RouterLink} to={isArtist ? '/artist/upload' : '/artworks'} variant="contained">
            {isArtist ? 'Upload Artwork' : 'Browse Artworks'}
          </Button>
        </Card>
      ) : (
        <Stack spacing={2}>
          {orders.map((order) => (
            <Card key={order.id} variant="outlined" sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={7}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                      Order #{order.order_number || order.id}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      Placed on {formatDate(order.order_date || order.created_at)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                      Items: {order.item_count || (order.items?.length ?? 0)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                      Tracking: {order.tracking_number || 'Will be shared soon'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                      {isArtist
                        ? `Buyer: ${order.buyer_first_name || ''} ${order.buyer_last_name || ''}`.trim()
                        : `Artist: ${order.artist_first_name || ''} ${order.artist_last_name || ''}`.trim()}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} md={5}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: { xs: 'flex-start', md: 'flex-end' }, gap: 1 }}>
                      <Chip
                        label={String(order.status || 'pending').toUpperCase()}
                        color={getStatusColor(order.status)}
                        size="small"
                      />
                      <Typography variant="h6" sx={{ fontWeight: 800 }}>
                        {formatCurrency(order.total_amount)}
                      </Typography>
                      <Button
                        component={RouterLink}
                        to={`/order-confirmation/${order.id}`}
                        state={{ order }}
                        variant="outlined"
                        size="small"
                      >
                        View Details
                      </Button>
                    </Box>
                  </Grid>
                </Grid>

                {Array.isArray(order.items) && order.items.length > 0 && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Stack spacing={1}>
                      {order.items.slice(0, 2).map((item) => (
                        <Box key={`${order.id}-${item.id || item.artwork_id}`} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            {item.title || 'Artwork'} x {item.quantity || 1}
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {formatCurrency((item.price_at_purchase || item.price || 0) * (item.quantity || 1))}
                          </Typography>
                        </Box>
                      ))}
                      {order.items.length > 2 && (
                        <Typography variant="caption" color="text.secondary">
                          +{order.items.length - 2} more item(s)
                        </Typography>
                      )}
                    </Stack>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Container>
  );
};

export default MyOrders;
