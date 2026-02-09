import React, { useState, useEffect, useMemo } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  Tabs,
  Tab,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Palette,
  People,
  Refresh,
  Shield,
  TrendingUp,
  Dashboard,
  Download,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../../services/api';

const AdminPanel = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [artworks, setArtworks] = useState([]);
  const [artists, setArtists] = useState([]);
  const [buyers, setBuyers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState(null);

  const statCards = useMemo(() => ([
    {
      label: 'Total Artworks',
      value: stats?.total_artworks || 0,
      sub: `${stats?.pending_artworks || 0} pending, ${stats?.rejected_artworks || 0} rejected`,
      icon: <Palette />,
      color: 'primary',
    },
    {
      label: 'Total Artists',
      value: stats?.total_artists || 0,
      sub: `${stats?.pending_artists || 0} pending verification`,
      icon: <Shield />,
      color: 'success',
    },
    {
      label: 'Total Buyers',
      value: stats?.total_buyers || 0,
      sub: 'Active collectors',
      icon: <People />,
      color: 'info',
    },
    {
      label: 'Total Revenue',
      value: stats?.total_revenue || 0,
      sub: 'All-time sales',
      icon: <TrendingUp />,
      color: 'warning',
    },
  ]), [stats]);

  // Protect page: redirect if not authenticated or not admin
  useEffect(() => {
    console.log('AdminPanel - Auth Check:', { isAuthenticated, user, userType: user?.user_type, isLoading: authLoading });
    
    // Wait for auth to finish loading
    if (authLoading) return;
    
    if (!isAuthenticated) {
      console.log('Not authenticated, redirecting to login');
      navigate('/login');
    } else if (user && user.user_type !== 'admin') {
      console.log('User is not admin, redirecting home. User type:', user.user_type);
      navigate('/');
    }
  }, [isAuthenticated, user, authLoading, navigate]);

  // Fetch pending artworks
  const fetchArtworks = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getPendingArtworks({ page: 1, limit: 20 });
      if (res.data?.artworks) {
        setArtworks(res.data.artworks);
      }
    } catch (err) {
      console.error('Failed to fetch artworks:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch pending artists
  const fetchArtists = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getPendingArtists({ page: 1, limit: 20 });
      if (res.data?.artists) {
        setArtists(res.data.artists);
      }
    } catch (err) {
      console.error('Failed to fetch artists:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all buyers/users
  const fetchBuyers = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getAllBuyers({ page: 1, limit: 50 });
      if (res.data?.buyers) {
        setBuyers(res.data.buyers);
      }
    } catch (err) {
      console.error('Failed to fetch buyers:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch dashboard statistics
  const fetchStats = async () => {
    try {
      const res = await adminAPI.getDashboardStats();
      if (res.data?.stats) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (tab === 0) {
      fetchArtworks();
    } else if (tab === 1) {
      fetchArtists();
    } else if (tab === 2) {
      fetchBuyers();
    }
  }, [tab]);

  const handleApprove = (item) => {
    setSelectedItem(item);
    setDialogAction('approve');
    setDialogOpen(true);
  };

  const handleReject = (item) => {
    setSelectedItem(item);
    setDialogAction('reject');
    setDialogOpen(true);
  };

  const confirmAction = async () => {
    try {
      if (tab === 0) {
        // Artwork approval
        const status = dialogAction === 'approve' ? 'approved' : 'rejected';
        const res = await adminAPI.updateArtworkStatus(selectedItem.id, status);
        if (res.data?.success) {
          // Remove item from list
          setArtworks(artworks.filter(a => a.id !== selectedItem.id));
          // Refresh stats to update counts
          fetchStats();
          console.log(`Artwork ${status} successfully`);
        } else {
          throw new Error('Failed to update artwork status');
        }
      } else {
        // Artist approval
        const verification_status = dialogAction === 'approve' ? 'verified' : 'rejected';
        const res = await adminAPI.updateArtistStatus(selectedItem.id, verification_status);
        if (res.data?.success) {
          // Remove item from list
          setArtists(artists.filter(a => a.id !== selectedItem.id));
          // Refresh stats to update counts
          fetchStats();
          console.log(`Artist ${verification_status} successfully`);
        } else {
          throw new Error('Failed to update artist status');
        }
      }
      setDialogOpen(false);
      setSelectedItem(null);
    } catch (err) {
      console.error('Failed to update status:', err);
      alert(`Failed to update status: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleRefresh = () => {
    fetchStats();
    if (tab === 0) fetchArtworks();
    if (tab === 1) fetchArtists();
    if (tab === 2) fetchBuyers();
  };

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Paper
        sx={{
          p: { xs: 3, md: 4 },
          borderRadius: 3,
          background: 'linear-gradient(180deg, rgba(15,23,42,0.04) 0%, rgba(255,255,255,1) 50%)',
          border: '1px solid rgba(15,23,42,0.06)',
          boxShadow: '0 20px 60px rgba(15,23,42,0.08)',
        }}
        elevation={0}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" gutterBottom fontWeight={800}>
              Admin Dashboard
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Approve artists, review artworks, and keep the marketplace healthy.
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" startIcon={<Download />} color="inherit">
              Export CSV
            </Button>
            <Button variant="contained" startIcon={<Refresh />} onClick={handleRefresh}>
              Refresh
            </Button>
          </Box>
        </Box>

        {/* Statistics Cards */}
        <Grid container spacing={2} sx={{ my: 3 }}>
          {statCards.map((card) => (
            <Grid item xs={12} sm={6} md={3} key={card.label}>
              <Card
                sx={{
                  height: '140px',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, rgba(37,99,235,0.08), rgba(255,255,255,0.9))',
                  border: '1px solid rgba(15,23,42,0.08)',
                }}
                elevation={0}
              >
                <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', p: 2.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Chip label={card.label} size="small" color={card.color} sx={{ color: '#fff', fontSize: '0.7rem' }} />
                    <Dashboard sx={{ color: 'rgba(15,23,42,0.35)', fontSize: '1.2rem' }} />
                  </Box>
                  <Typography variant="h4" fontWeight={800} gutterBottom sx={{ mb: 0.5 }}>
                    {card.value}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
                    {card.sub}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tab} onChange={(e, newVal) => setTab(newVal)}>
            <Tab label="Pending Artworks" />
            <Tab label="Pending Artists" />
            <Tab label="All Buyers" />
          </Tabs>
        </Box>

        {/* Artworks Tab */}
        {tab === 0 && (
          <>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
              </Box>
            ) : artworks.length === 0 ? (
              <Alert severity="success">No pending artworks. All submissions have been reviewed!</Alert>
            ) : (
              <Grid container spacing={3}>
                {artworks.map((artwork) => (
                  <Grid item xs={12} sm={6} md={4} key={artwork.id}>
                    <Card>
                      {artwork.image_url && (
                        <CardMedia
                          component="img"
                          height="200"
                          image={artwork.image_url}
                          alt={artwork.title}
                        />
                      )}
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          {artwork.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          by {artwork.artist_first_name} {artwork.artist_last_name}
                        </Typography>
                        {artwork.description && (
                          <Typography variant="body2" sx={{ mb: 2 }}>
                            {artwork.description}
                          </Typography>
                        )}
                        {artwork.price && (
                          <Typography variant="h6" color="primary">
                            ${artwork.price}
                          </Typography>
                        )}
                        <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                          <Button
                            variant="contained"
                            color="success"
                            size="small"
                            startIcon={<CheckCircle />}
                            onClick={() => handleApprove(artwork)}
                            fullWidth
                          >
                            Approve
                          </Button>
                          <Button
                            variant="contained"
                            color="error"
                            size="small"
                            startIcon={<Cancel />}
                            onClick={() => handleReject(artwork)}
                            fullWidth
                          >
                            Reject
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </>
        )}

        {/* Artists Tab */}
        {tab === 1 && (
          <>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
              </Box>
            ) : artists.length === 0 ? (
              <Alert severity="success">No pending artist registrations. All have been reviewed!</Alert>
            ) : (
              <Grid container spacing={3}>
                {artists.map((artist) => (
                  <Grid item xs={12} sm={6} md={4} key={artist.id}>
                    <Card>
                      {artist.profile_pic_url && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', pt: 2 }}>
                          <Avatar
                            src={artist.profile_pic_url}
                            alt={`${artist.first_name} ${artist.last_name}`}
                            sx={{ width: 80, height: 80 }}
                          />
                        </Box>
                      )}
                      <CardContent>
                        <Typography variant="h6" gutterBottom align="center">
                          {artist.first_name} {artist.last_name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Email: {artist.email}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Registered: {new Date(artist.signup_date).toLocaleDateString()}
                        </Typography>
                        {artist.bio && (
                          <Typography variant="body2" sx={{ my: 2 }}>
                            <strong>Bio:</strong> {artist.bio}
                          </Typography>
                        )}
                        {artist.specialization && (
                          <Chip
                            label={artist.specialization}
                            size="small"
                            sx={{ mb: 2 }}
                          />
                        )}
                        <Alert severity="info" sx={{ mb: 2, fontSize: '0.75rem' }}>
                          Artist cannot upload artworks until approved
                        </Alert>
                        <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                          <Button
                            variant="contained"
                            color="success"
                            size="small"
                            startIcon={<CheckCircle />}
                            onClick={() => handleApprove(artist)}
                            fullWidth
                          >
                            Approve
                          </Button>
                          <Button
                            variant="contained"
                            color="error"
                            size="small"
                            startIcon={<Cancel />}
                            onClick={() => handleReject(artist)}
                            fullWidth
                          >
                            Reject
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </>
        )}

        {/* Buyers Tab */}
        {tab === 2 && (
          <>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
              </Box>
            ) : buyers.length === 0 ? (
              <Alert severity="info">No buyers registered yet.</Alert>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Joined Date</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Orders</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {buyers.map((buyer) => (
                      <TableRow key={buyer.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar
                              src={buyer.profile_pic_url}
                              alt={`${buyer.first_name} ${buyer.last_name}`}
                              sx={{ width: 32, height: 32 }}
                            >
                              {buyer.first_name?.[0]}
                            </Avatar>
                            {buyer.first_name} {buyer.last_name}
                          </Box>
                        </TableCell>
                        <TableCell>{buyer.email}</TableCell>
                        <TableCell>
                          {new Date(buyer.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={buyer.status || 'active'}
                            color={buyer.status === 'active' ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{buyer.order_count || 0}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </>
        )}
      </Paper>

      {/* Confirmation Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>
          {dialogAction === 'approve' ? 'Approve' : 'Reject'} Submission?
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to {dialogAction} this {tab === 0 ? 'artwork' : 'artist'}?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={confirmAction}
            color={dialogAction === 'approve' ? 'success' : 'error'}
            variant="contained"
          >
            {dialogAction === 'approve' ? 'Approve' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminPanel;
