import React, { useEffect, useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import { Email, Person, Shield, CalendarToday, Edit } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { authAPI } from '../../services/api';

const Profile = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const notification = useNotification();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      if (!isAuthenticated) {
        notification.showWarning('Please log in to view your profile');
        navigate('/login');
        return;
      }

      try {
        const res = await authAPI.getProfile();
        const data = res?.data?.user || res?.data;
        setProfile(data || user || null);
      } catch (err) {
        console.error('Failed to load profile:', err);
        notification.showError('Could not load your profile right now');
        setProfile(user || null);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [isAuthenticated, navigate, notification, user]);

  if (!isAuthenticated) return null;

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!profile) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom>
          No profile data available
        </Typography>
        <Button variant="contained" onClick={() => navigate('/')}>Go Home</Button>
      </Container>
    );
  }

  const initials = `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`.toUpperCase();
  const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unnamed User';

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        My Account
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        View your basic details. Editing coming soon.
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardHeader
          avatar={
            <Avatar
              src={profile.profile_pic_url}
              alt={fullName}
              sx={{ width: 72, height: 72, fontSize: 28 }}
            >
              {profile.profile_pic_url ? null : initials || <Person />}
            </Avatar>
          }
          title={
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="h5" fontWeight={700}>{fullName}</Typography>
              <Chip
                label={profile.user_type === 'artist' ? 'Artist' : profile.user_type === 'admin' ? 'Admin' : 'Buyer'}
                color="primary"
                size="small"
                icon={<Shield fontSize="small" />}
              />
              {profile.status && (
                <Chip label={profile.status} size="small" variant="outlined" />
              )}
            </Stack>
          }
          subheader={profile.email}
          action={
            <Button startIcon={<Edit />} variant="outlined" disabled>
              Edit (soon)
            </Button>
          }
        />
        <Divider />
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <Email />
                </Avatar>
                <Box>
                  <Typography variant="overline" color="text.secondary">Email</Typography>
                  <Typography variant="body1">{profile.email}</Typography>
                </Box>
              </Stack>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ bgcolor: 'secondary.main' }}>
                  <Person />
                </Avatar>
                <Box>
                  <Typography variant="overline" color="text.secondary">User ID</Typography>
                  <Typography variant="body1">{profile.id}</Typography>
                </Box>
              </Stack>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <Shield />
                </Avatar>
                <Box>
                  <Typography variant="overline" color="text.secondary">Role</Typography>
                  <Typography variant="body1">{profile.user_type || 'buyer'}</Typography>
                </Box>
              </Stack>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ bgcolor: 'info.main' }}>
                  <CalendarToday />
                </Avatar>
                <Box>
                  <Typography variant="overline" color="text.secondary">Status</Typography>
                  <Typography variant="body1">{profile.status || 'active'}</Typography>
                </Box>
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {profile.user_type === 'artist' && profile.artist && (
        <Card>
          <CardHeader title="Artist Profile" subheader="Artist-specific details" />
          <Divider />
          <CardContent>
            <Typography variant="body1" gutterBottom>
              {profile.artist.bio || 'No bio provided yet.'}
            </Typography>
            <Stack direction="row" spacing={2}>
              <Chip label={`Total artworks: ${profile.artist.total_artworks || 0}`} />
              <Chip label={`Total sales: ${profile.artist.total_sales || 0}`} />
              <Chip label={`Verification: ${profile.artist.verification_status || 'pending'}`} />
            </Stack>
          </CardContent>
        </Card>
      )}
    </Container>
  );
};

export default Profile;