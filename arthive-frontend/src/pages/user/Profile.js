import React, { useEffect, useRef, useState } from 'react';
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
  IconButton,
  Stack,
  TextField,
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
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profilePicFile, setProfilePicFile] = useState(null);
  const [profilePicPreview, setProfilePicPreview] = useState('');
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    bio: '',
    website_url: '',
    city: '',
    country: '',
    contact_email: '',
    address: '',
    phone_number: '',
  });
  const hasRedirectedRef = useRef(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const loadProfile = async () => {
      if (!isAuthenticated) {
        if (!hasRedirectedRef.current) {
          hasRedirectedRef.current = true;
          notification.showWarning('Please log in to view your profile');
          navigate('/login', { replace: true });
        }
        setLoading(false);
        return;
      }

      hasRedirectedRef.current = false;

      try {
        const res = await authAPI.getProfile();
        const data = res?.data?.user || res?.data;
        setProfile(data || user || null);
        if (data) {
          setProfilePicPreview(data.profile_pic_url || '');
          setFormData({
            first_name: data.first_name || '',
            last_name: data.last_name || '',
            bio: data.artist?.bio || '',
            website_url: data.artist?.website_url || '',
            city: data.artist?.city || '',
            country: data.artist?.country || '',
            contact_email: data.artist?.contact_email || '',
            address: data.artist?.address || '',
            phone_number: data.artist?.phone_number || '',
          });
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
        notification.showError('Could not load your profile right now');
        setProfile(user || null);
        if (user) {
          setProfilePicPreview(user.profile_pic_url || '');
          setFormData((prev) => ({
            ...prev,
            first_name: user.first_name || '',
            last_name: user.last_name || '',
          }));
        }
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

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleEditToggle = () => {
    if (isEditing) {
      setProfilePicFile(null);
      setProfilePicPreview(profile.profile_pic_url || '');
      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        bio: profile.artist?.bio || '',
        website_url: profile.artist?.website_url || '',
        city: profile.artist?.city || '',
        country: profile.artist?.country || '',
        contact_email: profile.artist?.contact_email || '',
        address: profile.artist?.address || '',
        phone_number: profile.artist?.phone_number || '',
      });
      setIsEditing(false);
      return;
    }
    setIsEditing(true);
  };

  const handleProfilePicFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setProfilePicFile(file);
    setProfilePicPreview(URL.createObjectURL(file));
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);

      const payload = new FormData();
      payload.append('first_name', formData.first_name || '');
      payload.append('last_name', formData.last_name || '');

      if (profilePicFile) {
        payload.append('profile_pic', profilePicFile);
      }

      if (profile.user_type === 'artist') {
        payload.append('bio', formData.bio || '');
        payload.append('website_url', formData.website_url || '');
        payload.append('city', formData.city || '');
        payload.append('country', formData.country || '');
        payload.append('contact_email', formData.contact_email || '');
        payload.append('address', formData.address || '');
        payload.append('phone_number', formData.phone_number || '');
      }

      const updateRes = await authAPI.updateProfile(payload);
      if (!updateRes?.data?.success) {
        throw new Error(updateRes?.data?.message || 'Profile update failed');
      }

      const refreshed = await authAPI.getProfile();
      const latest = refreshed?.data?.user || refreshed?.data;
      setProfile(latest || profile);
      setProfilePicFile(null);
      setProfilePicPreview(latest?.profile_pic_url || '');
      setIsEditing(false);
      notification.showSuccess('Profile updated successfully');
    } catch (err) {
      const message = err?.response?.data?.message || err.message || 'Failed to update profile';
      notification.showError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        My Account
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        View and edit your account details.
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardHeader
          avatar={
            <Box sx={{ position: 'relative', width: 72, height: 72 }}>
              <Avatar
                src={profilePicPreview || profile.profile_pic_url}
                alt={fullName}
                sx={{ width: 72, height: 72, fontSize: 28 }}
              >
                {profile.profile_pic_url ? null : initials || <Person />}
              </Avatar>
              {isEditing && (
                <IconButton
                  size="small"
                  onClick={() => fileInputRef.current?.click()}
                  sx={{
                    position: 'absolute',
                    right: -6,
                    bottom: -6,
                    bgcolor: 'primary.main',
                    color: 'white',
                    width: 28,
                    height: 28,
                    '&:hover': { bgcolor: 'primary.dark' },
                  }}
                >
                  <Edit fontSize="small" />
                </IconButton>
              )}
            </Box>
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
            <Stack direction="row" spacing={1}>
              <Button startIcon={<Edit />} variant="outlined" onClick={handleEditToggle}>
                {isEditing ? 'Cancel' : 'Edit'}
              </Button>
              {isEditing && (
                <Button variant="contained" onClick={handleSaveProfile} disabled={saving}>
                  {saving ? 'Saving...' : 'Save'}
                </Button>
              )}
            </Stack>
          }
        />
        <Divider />
        <CardContent>
          {isEditing && (
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={formData.first_name}
                  onChange={(e) => handleInputChange('first_name', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  value={formData.last_name}
                  onChange={(e) => handleInputChange('last_name', e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                {profilePicFile && (
                  <Typography variant="body2" color="text.secondary">
                    Selected image: {profilePicFile.name}
                  </Typography>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleProfilePicFileChange}
                />
              </Grid>

              {profile.user_type === 'artist' && (
                <>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      minRows={3}
                      label="Bio"
                      value={formData.bio}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Phone"
                      value={formData.phone_number}
                      onChange={(e) => handleInputChange('phone_number', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Contact Email"
                      value={formData.contact_email}
                      onChange={(e) => handleInputChange('contact_email', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="City"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Country"
                      value={formData.country}
                      onChange={(e) => handleInputChange('country', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Website URL"
                      value={formData.website_url}
                      onChange={(e) => handleInputChange('website_url', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      minRows={2}
                      label="Address"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                    />
                  </Grid>
                </>
              )}
            </Grid>
          )}

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
            {(profile.artist.phone_number || profile.artist.address) && (
              <Box sx={{ mt: 2 }}>
                {profile.artist.phone_number && (
                  <Typography variant="body2" color="text.secondary">
                    Phone: {profile.artist.phone_number}
                  </Typography>
                )}
                {profile.artist.address && (
                  <Typography variant="body2" color="text.secondary">
                    Address: {profile.artist.address}
                  </Typography>
                )}
              </Box>
            )}
          </CardContent>
        </Card>
      )}
    </Container>
  );
};

export default Profile;