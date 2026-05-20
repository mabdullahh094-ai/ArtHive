import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
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
              <Grid item xs={6} sm={4} md={3} lg={2} key={`${item.order_id}-${item.id}`}>
                  <Card sx={{
                    position: 'relative',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 1.5,
                    border: '1px solid rgba(15,23,42,0.1)',
                    backgroundColor: '#fff',
                    '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 18px rgba(15,23,42,0.12)' }
                  }}>
                    {item.image_url && (
                      <Box sx={{ height: { xs: 125, sm: 150, md: 145 }, overflow: 'hidden', backgroundColor: '#f5f5f5' }}>
                        <img
                          src={item.image_url}
                          alt={item.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                          referrerPolicy="no-referrer"
                          crossOrigin="anonymous"
                          onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }}
                        />
                      </Box>
                    )}
                    <CardContent sx={{ flexGrow: 1, p: 1, '&:last-child': { pb: 1 } }}>
                      <Typography sx={{ fontWeight: 700, fontSize: { xs: '0.78rem', sm: '0.82rem' } }} noWrap>
                        {item.title || 'Untitled Artwork'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.45, fontSize: '0.66rem' }}>
                        Order #{item.order_number || item.order_id}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.66rem' }}>
                        Sold on {formatDate(item.order_date)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.66rem' }}>
                        Buyer: {`${item.buyer_first_name || ''} ${item.buyer_last_name || ''}`.trim() || 'N/A'}
                      </Typography>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.8 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.66rem' }}>
                          Qty: {item.quantity || 0}
                        </Typography>
                        <Typography sx={{ fontWeight: 800, color: 'success.dark', fontSize: { xs: '0.74rem', sm: '0.82rem' } }}>
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
