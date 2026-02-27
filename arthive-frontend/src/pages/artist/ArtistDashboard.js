import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Alert,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Chip,
  CircularProgress,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { authAPI, artistAPI } from '../../services/api';

const ArtistDashboard = () => {
  const navigate = useNavigate();
  const [isVerified, setIsVerified] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [artworks, setArtworks] = useState([]);
  const [stats, setStats] = useState(null);

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
        <Paper sx={{ p: 4 }} elevation={3}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="h4" gutterBottom fontWeight={800}>
                Artist Dashboard
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Manage your artworks and view your statistics.
              </Typography>
            </Box>
          </Box>

          {/* Statistics Cards */}
          {stats && (
            <Grid container spacing={2} sx={{ mb: 4 }}>
              <Grid item xs={6} sm={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h6">
                    {stats.artworks?.total_artworks || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Artworks
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h6">
                    {stats.artworks?.approved_artworks || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Approved
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h6">
                    {stats.artworks?.pending_artworks || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h6">${stats.orders?.total_revenue || 0}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Revenue
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          )}

          {/* Artworks Section */}
          <Box>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
              Your Artworks
            </Typography>
            {artworks.length === 0 ? (
              <Alert severity="info">
                No artworks uploaded yet. Start by uploading your first artwork to showcase your work!
              </Alert>
            ) : (
              <Grid container spacing={2}>
                {artworks.map((artwork) => (
                  <Grid item xs={12} sm={6} md={4} key={artwork.id}>
                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                      {artwork.image_url && (
                        <CardMedia
                          component="img"
                          height="220"
                          image={artwork.image_url}
                          alt={artwork.title}
                          sx={{
                            height: 220,
                            objectFit: 'cover',
                            backgroundColor: '#f5f5f5',
                          }}
                        />
                      )}
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Typography variant="subtitle1" gutterBottom>
                          {artwork.title}
                        </Typography>
                        <Box sx={{ mb: 1 }}>
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
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          ${artwork.price || 'N/A'}
                        </Typography>
                        {artwork.view_count && (
                          <Typography variant="body2" color="text.secondary">
                            Views: {artwork.view_count}
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        </Paper>
      )}
    </Container>
  );
};

export default ArtistDashboard;
