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
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Palette,
  People,
  Shield,
  TrendingUp,
  Dashboard,
  Download,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../../services/api';

const AdminPanel = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
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
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [artistProfileDetails, setArtistProfileDetails] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

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
      const res = await adminAPI.getPendingArtworks({ page: 1, limit: 1000 });
      if (res.data?.artworks) {
        setArtworks(res.data.artworks);
        console.log('Artworks fetched:', res.data.artworks.length);
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
      const res = await adminAPI.getPendingArtists({ page: 1, limit: 1000 });
      if (res.data?.artists) {
        setArtists(res.data.artists);
        console.log('Artists fetched:', res.data.artists.length);
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
      const res = await adminAPI.getAllBuyers({ page: 1, limit: 1000 });
      if (res.data?.buyers) {
        setBuyers(res.data.buyers);
        console.log('Buyers fetched:', res.data.buyers.length);
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
    fetchArtworks(); // Load initial data for first tab
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

  const handleViewArtistProfile = async (artistId) => {
    try {
      setProfileLoading(true);
      setProfileDialogOpen(true);
      const res = await adminAPI.getArtistProfileDetails(artistId);
      if (res.data?.success) {
        setArtistProfileDetails({
          artist: res.data.artist,
          artworks: res.data.artworks || [],
        });
      } else {
        setArtistProfileDetails(null);
      }
    } catch (err) {
      console.error('Failed to fetch artist profile details:', err);
      setArtistProfileDetails(null);
    } finally {
      setProfileLoading(false);
    }
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

  const handleExportCSV = () => {
    let csvRows = [];
    let data = [];
    let headers = [];

    if (tab === 0) {
      // Artworks
      if (artworks.length === 0) {
        alert('No artworks to export. Please wait for data to load or check if there are pending artworks.');
        return;
      }
      headers = ['ID', 'Title', 'Artist', 'Description', 'Price', 'Status', 'Date'];
      data = artworks.map(a => [
        a.id,
        a.title,
        `${a.artist_first_name} ${a.artist_last_name}`,
        a.description || '',
        a.price || '',
        a.status || 'pending',
        new Date(a.created_at).toLocaleDateString(),
      ]);
    } else if (tab === 1) {
      // Artists
      if (artists.length === 0) {
        alert('No artists to export. Please wait for data to load or check if there are pending artists.');
        return;
      }
      headers = ['ID', 'Name', 'Email', 'Phone', 'Address', 'City', 'Country', 'Status', 'Date'];
      data = artists.map(a => [
        a.id,
        `${a.first_name} ${a.last_name}`,
        a.email,
        a.phone_number || '',
        a.address || '',
        a.city || '',
        a.country || '',
        a.verification_status || 'pending',
        new Date(a.signup_date).toLocaleDateString(),
      ]);
    } else if (tab === 2) {
      // Buyers
      if (buyers.length === 0) {
        alert('No buyers to export. Please wait for data to load or check if there are registered buyers.');
        return;
      }
      headers = ['ID', 'Name', 'Email', 'Status', 'Joined Date'];
      data = buyers.map(b => [
        b.id,
        `${b.first_name} ${b.last_name}`,
        b.email,
        b.status || 'active',
        new Date(b.created_at).toLocaleDateString(),
      ]);
    }

    // Escape CSV values
    const escapeCSV = (value) => {
      const stringValue = String(value || '');
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    // Add headers
    csvRows.push(headers.map(escapeCSV).join(','));

    // Add data rows
    data.forEach(row => {
      csvRows.push(row.map(escapeCSV).join(','));
    });

    // Add UTF-8 BOM for Excel compatibility
    const csvContent = '\uFEFF' + csvRows.join('\r\n');

    // Create Blob with proper encoding and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const tabName = tab === 0 ? 'Artworks' : tab === 1 ? 'Artists' : 'Buyers';
    const fileName = `${tabName}_${new Date().toLocaleDateString().replace(/\//g, '-')}.csv`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
  };



  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3, md: 6 } }}>
      <Paper
        sx={{
          p: { xs: 2, sm: 3, md: 4 },
          borderRadius: 3,
          background: 'linear-gradient(180deg, rgba(15,23,42,0.04) 0%, rgba(255,255,255,1) 50%)',
          border: '1px solid rgba(15,23,42,0.06)',
          boxShadow: '0 20px 60px rgba(15,23,42,0.08)',
        }}
        elevation={0}
      >
        <Box sx={{ display: 'flex', alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between', flexWrap: 'wrap', gap: { xs: 1.5, sm: 2 } }}>
          <Box>
            <Typography variant="h4" gutterBottom fontWeight={800} sx={{ fontSize: { xs: '1.45rem', sm: '2rem' } }}>
              Admin Dashboard
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
              Approve artists, review artworks, and keep the marketplace healthy.
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, width: { xs: '100%', sm: 'auto' } }}>
            <Button
              variant="outlined"
              startIcon={<Download />}
              color="inherit"
              sx={{ width: { xs: '100%', sm: 'auto' }, fontSize: { xs: '0.8rem', sm: '0.875rem' } }} 
              onClick={handleExportCSV}
            >
              Export CSV
            </Button>
          </Box>
        </Box>

        {/* Statistics Cards */}
        <Grid container spacing={2} sx={{ my: 3 }}>
          {statCards.map((card) => (
            <Grid item xs={6} sm={6} md={3} key={card.label}>
              <Card
                sx={{
                  minHeight: { xs: 120, sm: 140 },
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, rgba(37,99,235,0.08), rgba(255,255,255,0.9))',
                  border: '1px solid rgba(15,23,42,0.08)',
                }}
                elevation={0}
              >
                <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', p: { xs: 1.5, sm: 2.5 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Chip label={card.label} size="small" color={card.color} sx={{ color: '#fff', fontSize: '0.7rem' }} />
                    <Dashboard sx={{ color: 'rgba(15,23,42,0.35)', fontSize: '1.2rem' }} />
                  </Box>
                  <Typography variant="h4" fontWeight={800} gutterBottom sx={{ mb: 0.5, fontSize: { xs: '1.35rem', sm: '2rem' } }}>
                    {card.value}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: { xs: '0.7rem', sm: '0.8rem' } }}>
                    {card.sub}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tab} onChange={(e, newVal) => setTab(newVal)} variant="scrollable" allowScrollButtonsMobile>
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
              <Grid container spacing={{ xs: 2, sm: 3 }}>
                {artworks.map((artwork) => (
                  <Grid item xs={12} sm={6} md={4} key={artwork.id}>
                    <Card>
                      {artwork.image_url && (
                        <CardMedia
                          component="img"
                          height={isMobile ? '190' : '220'}
                          image={artwork.image_url}
                          alt={artwork.title}
                          sx={{
                            height: { xs: 190, sm: 220 },
                            objectFit: 'cover',
                            backgroundColor: '#f5f5f5',
                          }}
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
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, sm: 2 } }}>
                {artists.map((artist) => (
                  <Box
                    key={artist.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: { xs: 1.5, sm: 2 },
                      p: { xs: 1.5, sm: 2 },
                      borderRadius: 2,
                      background: 'linear-gradient(135deg, rgba(34,197,94,0.06), rgba(255,255,255,0.95))',
                      border: '1px solid rgba(15,23,42,0.08)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        boxShadow: '0 4px 12px rgba(34,197,94,0.12)',
                        background: 'linear-gradient(135deg, rgba(34,197,94,0.1), rgba(255,255,255,1))',
                      },
                    }}
                  >
                    {/* Avatar */}
                    {artist.profile_pic_url ? (
                      <Avatar
                        src={artist.profile_pic_url}
                        alt={`${artist.first_name} ${artist.last_name}`}
                        sx={{ width: { xs: 50, sm: 60 }, height: { xs: 50, sm: 60 }, flexShrink: 0 }}
                      />
                    ) : (
                      <Avatar
                        sx={{ width: { xs: 50, sm: 60 }, height: { xs: 50, sm: 60 }, flexShrink: 0, bgcolor: 'primary.main' }}
                      >
                        {artist.first_name?.[0]}{artist.last_name?.[0]}
                      </Avatar>
                    )}

                    {/* Name */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          fontWeight: 600, 
                          fontSize: { xs: '0.95rem', sm: '1.05rem' },
                          whiteSpace: { xs: 'normal', sm: 'nowrap' },
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {artist.first_name} {artist.last_name}
                      </Typography>
                    </Box>

                    {/* View Button */}
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      sx={{ 
                        flexShrink: 0,
                        px: { xs: 2, sm: 3 },
                        fontSize: { xs: '0.8rem', sm: '0.875rem' },
                      }}
                      onClick={() => handleViewArtistProfile(artist.id)}
                    >
                      View
                    </Button>
                  </Box>
                ))}
              </Box>
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
              <TableContainer sx={{ overflowX: 'auto' }}>
                <Table size={isMobile ? 'small' : 'medium'} sx={{ minWidth: 600 }}>
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

      <Dialog
        open={profileDialogOpen}
        onClose={() => setProfileDialogOpen(false)}
        fullWidth
        maxWidth="md"
        fullScreen={isMobile}
      >
        <DialogTitle>Artist Profile Details</DialogTitle>
        <DialogContent>
          {profileLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : !artistProfileDetails ? (
            <Alert severity="error">Failed to load artist profile details.</Alert>
          ) : (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Avatar
                  src={artistProfileDetails.artist.profile_pic_url}
                  alt={`${artistProfileDetails.artist.first_name} ${artistProfileDetails.artist.last_name}`}
                  sx={{ width: 72, height: 72 }}
                />
                <Box>
                  <Typography variant="h6">
                    {artistProfileDetails.artist.first_name} {artistProfileDetails.artist.last_name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Email: {artistProfileDetails.artist.email}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Status: {artistProfileDetails.artist.verification_status || 'pending'}
                  </Typography>
                </Box>
              </Box>

              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2"><strong>Phone:</strong> {artistProfileDetails.artist.phone_number || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2"><strong>Contact Email:</strong> {artistProfileDetails.artist.contact_email || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2"><strong>Address:</strong> {artistProfileDetails.artist.address || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2"><strong>City:</strong> {artistProfileDetails.artist.city || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2"><strong>Country:</strong> {artistProfileDetails.artist.country || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2"><strong>Specialization:</strong> {artistProfileDetails.artist.specialization || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2"><strong>Bio:</strong> {artistProfileDetails.artist.bio || 'N/A'}</Typography>
                </Grid>
              </Grid>

              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
                Submitted Artworks ({artistProfileDetails.artworks.length})
              </Typography>

              {artistProfileDetails.artworks.length === 0 ? (
                <Alert severity="info">No artworks submitted yet.</Alert>
              ) : (
                <Grid container spacing={2}>
                  {artistProfileDetails.artworks.map((artwork) => (
                    <Grid item xs={12} sm={6} md={4} key={artwork.id}>
                      <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        {artwork.image_url && (
                          <CardMedia
                            component="img"
                            height="180"
                            image={artwork.image_url}
                            alt={artwork.title}
                            sx={{
                              height: 180,
                              objectFit: 'cover',
                              backgroundColor: '#f5f5f5',
                            }}
                          />
                        )}
                        <CardContent sx={{ flexGrow: 1 }}>
                          <Typography variant="subtitle2" noWrap>
                            {artwork.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            Status: {artwork.status || 'pending'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            Price: ${artwork.price ?? 0}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {artistProfileDetails?.artist && (
            <>
              <Button
                color="error"
                variant="outlined"
                onClick={() => {
                  setProfileDialogOpen(false);
                  handleReject(artistProfileDetails.artist);
                }}
              >
                Reject Artist
              </Button>
              <Button
                color="success"
                variant="contained"
                onClick={() => {
                  setProfileDialogOpen(false);
                  handleApprove(artistProfileDetails.artist);
                }}
              >
                Approve Artist
              </Button>
            </>
          )}
          <Button onClick={() => setProfileDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

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
