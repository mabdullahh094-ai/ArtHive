import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  CircularProgress,
  Container,
  Grid,
  Pagination,
  Typography,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { artistAPI } from '../../services/api';

const PAGE_SIZE = 12;

const SoldPaintings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const formatCurrency = (value) => {
    const amount = Number(value || 0);
    return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (value) => {
    if (!value) return 'Date N/A';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Date N/A';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  useEffect(() => {
    const fetchSoldPaintings = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await artistAPI.getSoldPaintings({
          page,
          limit: PAGE_SIZE,
        });

        const soldItems = response?.data?.sold_paintings || [];
        const total = response?.data?.pagination?.totalPages || 1;

        setItems(Array.isArray(soldItems) ? soldItems : []);
        setTotalPages(total > 0 ? total : 1);
      } catch (err) {
        console.error('Failed to fetch sold paintings:', err);
        setError(err?.response?.data?.message || 'Failed to load sold paintings');
        setItems([]);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    };

    fetchSoldPaintings();
  }, [page]);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          Sold Paintings
        </Typography>
        <Button variant="outlined" startIcon={<ArrowBack />} onClick={() => navigate('/artist/dashboard')}>
          Back to Dashboard
        </Button>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        View your sold artworks with buyer and revenue details.
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : items.length === 0 ? (
        <Alert severity="info">No sold paintings yet.</Alert>
      ) : (
        <>
          <Grid container spacing={2}>
            {items.map((item) => (
              <Grid item xs={12} sm={6} md={4} key={`${item.order_id}-${item.id}`}>
                <Card sx={{ borderRadius: 2, border: '1px solid rgba(15,23,42,0.08)' }}>
                  {item.image_url && (
                    <CardMedia
                      component="img"
                      image={item.image_url}
                      alt={item.title}
                      sx={{ height: 170, objectFit: 'cover', backgroundColor: '#f5f5f5' }}
                    />
                  )}
                  <CardContent>
                    <Typography sx={{ fontWeight: 700 }} noWrap>
                      {item.title || 'Untitled Artwork'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      Order #{item.order_number || item.order_id}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Sold on {formatDate(item.order_date)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Buyer: {`${item.buyer_first_name || ''} ${item.buyer_last_name || ''}`.trim() || 'N/A'}
                    </Typography>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1.2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Qty: {item.quantity || 0}
                      </Typography>
                      <Typography sx={{ fontWeight: 800, color: 'success.dark' }}>
                        {formatCurrency(item.line_revenue)}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination count={totalPages} page={page} onChange={(_, value) => setPage(value)} color="primary" />
            </Box>
          )}
        </>
      )}
    </Container>
  );
};

export default SoldPaintings;
