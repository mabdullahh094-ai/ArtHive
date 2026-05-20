import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Alert,
  Button,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Chip,
  CircularProgress,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  InputAdornment
} from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { authAPI, artistAPI } from '../../services/api';

const ArtistDashboard = () => {
  const navigate = useNavigate();
  const [isVerified, setIsVerified] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [artworks, setArtworks] = useState([]);
  const [dateSearch, setDateSearch] = useState('');
  const [stats, setStats] = useState(null);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedArtwork, setSelectedArtwork] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    price: '',
    status: ''
  });

  const handleEditClick = (artwork) => {
    setSelectedArtwork(artwork);
    setEditForm({
      title: artwork.title || '',
      description: artwork.description || '',
      price: artwork.price || '',
      status: artwork.status || 'pending'
    });
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (artwork) => {
    setSelectedArtwork(artwork);
    setDeleteDialogOpen(true);
  };

  const handleEditSubmit = async () => {
    try {
      setActionLoading(true);
      const res = await artistAPI.updateArtwork(selectedArtwork.id, editForm);
      if (res.data.success) {
        setArtworks(artworks.map(a => a.id === selectedArtwork.id ? { ...a, ...res.data.artwork } : a));
        setEditDialogOpen(false);
      }
    } catch (err) {
      console.error('Update failed', err);
      alert('Failed to update artwork');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      setActionLoading(true);
      const res = await artistAPI.deleteArtwork(selectedArtwork.id);
      if (res.data.success) {
        setArtworks(artworks.filter(a => a.id !== selectedArtwork.id));
        setDeleteDialogOpen(false);
      }
    } catch (err) {
      console.error('Delete failed', err);
      alert('Failed to delete artwork');
    } finally {
      setActionLoading(false);
    }
  };

  const formatCurrency = (value) => {
    const amount = Number(value || 0);
    return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getDateBadge = (value) => {
    if (!value) return 'Date N/A';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Date N/A';

    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const sameDay = (a, b) =>
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate();

    if (sameDay(date, today)) return 'Today';
    if (sameDay(date, yesterday)) return 'Yesterday';

    return date.toLocaleDateString();
  };

  const formatIsoDate = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toISOString().slice(0, 10);
  };


  const getDateKey = (value) => {
    if (!value) return 'unknown';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'unknown';
    return date.toISOString().slice(0, 10);
  };

  const filteredArtworks = [...artworks]
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    .filter((artwork) => {
      if (!dateSearch.trim()) return true;

      const term = dateSearch.trim().toLowerCase();
      const badge = getDateBadge(artwork.created_at).toLowerCase();
      const prettyDate = artwork.created_at
        ? new Date(artwork.created_at).toLocaleDateString().toLowerCase()
        : '';
      const isoDate = formatIsoDate(artwork.created_at);

      return (
        badge.includes(term) ||
        prettyDate.includes(term) ||
        isoDate.includes(term)
      );
    });

  const groupedArtworks = filteredArtworks.reduce((acc, artwork) => {
    const key = getDateKey(artwork.created_at);
    if (!acc[key]) {
      acc[key] = {
        label: getDateBadge(artwork.created_at),
        items: [],
      };
    }
    acc[key].items.push(artwork);
    return acc;
  }, {});

  const groupedEntries = Object.entries(groupedArtworks).sort((a, b) => {
    if (a[0] === 'unknown') return 1;
    if (b[0] === 'unknown') return -1;
    return new Date(b[0]) - new Date(a[0]);
  });

  useEffect(() => {
    const load = async () => {
      try {
        setAuthLoading(true);
        // Fetch profile
        const profileRes = await authAPI.getProfile();
        if (profileRes.data?.user) {
          const u = profileRes.data.user;
          // Check if artist is verified
          if (u.artist && u.artist.verification_status === 'verified') {
            setIsVerified(true);
          } else {
            // Not verified, redirect to profile setup
            navigate('/artist/profile');
            return;
          }
        }

        // Fetch artist's artworks
        const artworksRes = await artistAPI.getArtistArtworks();
        if (artworksRes.data?.artworks) {
          setArtworks(artworksRes.data.artworks);
        }

        // Fetch dashboard stats
        const statsRes = await artistAPI.getDashboardStats();
        if (statsRes.data?.stats) {
          setStats(statsRes.data.stats);
        }
      } catch (err) {
        console.error('Failed to load dashboard', err);
      } finally {
        setAuthLoading(false);
      }
    };
    load();
  }, [navigate]);

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      {authLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : !isVerified ? (
        <Alert severity="error">
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            🔒 Access Denied
          </Typography>
          <Typography variant="body2">
            Your artist profile has not been verified yet. Please complete your profile setup first.
          </Typography>
        </Alert>
      ) : (
        <Paper sx={{ p: 4, position: 'relative' }} elevation={3}>
          <Box sx={{ mb: 3, pr: { xs: 0, sm: 18 } }}>
            <Box>
              <Typography variant="h4" gutterBottom fontWeight={800}>
                Artist Dashboard
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Manage your artworks and view your statistics.
              </Typography>
            </Box>
          </Box>

          <Button
            variant="contained"
            onClick={() => navigate('/artist/upload')}
            sx={{
              position: 'absolute',
              top: { xs: 12, sm: 20 },
              right: { xs: 16, sm: 24 },
              fontSize: { xs: '0.72rem', sm: '0.875rem' },
              px: { xs: 1.25, sm: 2 },
              py: { xs: 0.6, sm: 0.85 },
              minWidth: { xs: 108, sm: 140 },
              whiteSpace: 'nowrap',
            }}
          >
            Upload Artwork
          </Button>

          <Button
            variant="outlined"
            onClick={() => navigate('/artist/sold-paintings')}
            sx={{
              position: 'absolute',
              top: { xs: 56, sm: 20 },
              right: { xs: 16, sm: 176 },
              fontSize: { xs: '0.7rem', sm: '0.82rem' },
              px: { xs: 1.1, sm: 1.5 },
              py: { xs: 0.45, sm: 0.7 },
              minWidth: { xs: 108, sm: 150 },
              whiteSpace: 'nowrap',
            }}
          >
            View Sold Paintings
          </Button>

          {/* Statistics Cards */}
          {stats && (
            <Grid container spacing={{ xs: 1, sm: 1.25 }} sx={{ mb: 3 }}>
              <Grid item xs={6} sm={3}>
                <Paper sx={{ p: { xs: 1, sm: 1.25 }, textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.1rem' } }}>
                    {stats.artworks?.total_artworks || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.68rem', sm: '0.78rem' } }}>
                    Total Artworks
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Paper sx={{ p: { xs: 1, sm: 1.25 }, textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.1rem' } }}>
                    {stats.artworks?.approved_artworks || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.68rem', sm: '0.78rem' } }}>
                    Approved
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Paper sx={{ p: { xs: 1, sm: 1.25 }, textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.1rem' } }}>
                    {stats.orders?.paintings_sold || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.68rem', sm: '0.78rem' } }}>
                    Paintings Sold
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Paper sx={{ p: { xs: 1, sm: 1.25 }, textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.1rem' } }}>{formatCurrency(stats.orders?.total_revenue)}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.68rem', sm: '0.78rem' } }}>
                    Total Revenue
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={6}>
                <Paper sx={{ p: { xs: 1, sm: 1.25 }, textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.1rem' } }}>
                    {stats.orders?.monthly_paintings_sold || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.68rem', sm: '0.78rem' } }}>
                    This Month Sold
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={6}>
                <Paper sx={{ p: { xs: 1, sm: 1.25 }, textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.1rem' } }}>
                    {formatCurrency(stats.orders?.monthly_revenue)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.68rem', sm: '0.78rem' } }}>
                    This Month Revenue
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          )}

          {/* Recently sold paintings moved to separate view; removed here. */}

          {/* Artworks Section */}
          <Box>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
              Your Artworks
            </Typography>

            <TextField
              fullWidth
              label="Search by date"
              placeholder="Try: today, yesterday, or 2026-03-08"
              value={dateSearch}
              onChange={(e) => setDateSearch(e.target.value)}
              sx={{ mb: 2 }}
            />

            {artworks.length === 0 ? (
              <Alert severity="info">
                No artworks uploaded yet. Click "Upload Artwork" to publish your first artwork.
              </Alert>
            ) : filteredArtworks.length === 0 ? (
              <Alert severity="info">
                No artworks found for this date search.
              </Alert>
            ) : (
              groupedEntries.map(([groupKey, group]) => (
                <Box key={groupKey} sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
                    {group.label} ({group.items.length} artworks uploaded)
                  </Typography>
                  <Grid container spacing={{ xs: 1, sm: 1.25 }}>
                    {group.items.map((artwork) => (
                      <Grid item xs={6} sm={4} md={3} lg={2} key={artwork.id}>
                        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: { xs: 1.5, sm: 2 }, position: 'relative' }}>
                          <Box sx={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 0.5, zIndex: 2 }}>
                            <Tooltip title="Edit">
                              <IconButton size="small" onClick={() => handleEditClick(artwork)} sx={{ bgcolor: 'rgba(255,255,255,0.8)', '&:hover': { bgcolor: 'white' } }}>
                                <Edit fontSize="small" color="primary" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton size="small" onClick={() => handleDeleteClick(artwork)} sx={{ bgcolor: 'rgba(255,255,255,0.8)', '&:hover': { bgcolor: 'white' } }}>
                                <Delete fontSize="small" color="error" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                          {artwork.image_url && (
                            <CardMedia
                              component="img"
                              image={artwork.image_url}
                              alt={artwork.title}
                              sx={{
                                height: { xs: 105, sm: 130, md: 145 },
                                objectFit: 'cover',
                                backgroundColor: '#f5f5f5',
                              }}
                            />
                          )}
                          <CardContent sx={{ flexGrow: 1, p: { xs: 0.8, sm: 1 }, '&:last-child': { pb: { xs: 0.8, sm: 1 } } }}>
                            <Typography variant="subtitle1" gutterBottom noWrap sx={{ fontSize: { xs: '0.74rem', sm: '0.82rem' }, mb: { xs: 0.35, sm: 0.5 } }}>
                              {artwork.title}
                            </Typography>
                            <Box sx={{ mb: 0.6, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                              <Chip
                                label={artwork.status || 'pending'}
                                color={
                                  artwork.status === 'approved'
                                    ? 'success'
                                    : artwork.status === 'rejected'
                                    ? 'error'
                                    : 'warning'
                                }
                                size="small"
                                sx={{ height: 20, '& .MuiChip-label': { px: 0.8, fontSize: '0.62rem' } }}
                              />
                            </Box>
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.66rem', sm: '0.72rem' } }}>
                              ${artwork.price || 'N/A'}
                            </Typography>
                            {artwork.view_count && (
                              <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.64rem', sm: '0.7rem' } }}>
                                Views: {artwork.view_count}
                              </Typography>
                            )}
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              ))
            )}
          </Box>
        </Paper>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Artwork</DialogTitle>
        <DialogContent dividers>
          <TextField
            fullWidth
            label="Title"
            value={editForm.title}
            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Description"
            value={editForm.description}
            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Price"
            type="number"
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
            value={editForm.price}
            onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
            sx={{ mb: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleEditSubmit} disabled={actionLoading}>
            {actionLoading ? <CircularProgress size={24} /> : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Artwork?</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete "{selectedArtwork?.title}"? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDeleteConfirm} disabled={actionLoading}>
            {actionLoading ? <CircularProgress size={24} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ArtistDashboard;
