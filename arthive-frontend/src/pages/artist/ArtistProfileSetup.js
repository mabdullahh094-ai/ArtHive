import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  Grid,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';

const ArtistProfileSetup = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    city: '',
    country: '',
    contact_email: '',
    bio: '',
  });
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [verificationStatus, setVerificationStatus] = useState(null);
  const bioWordCount = form.bio.trim() ? form.bio.trim().split(/\s+/).length : 0;

  // Memoize navigate to prevent infinite loops
  const handleRedirectToDashboard = useCallback(() => {
    navigate('/artist/dashboard', { replace: true });
  }, [navigate]);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profileRes = await authAPI.getProfile();
        if (profileRes.data?.user) {
          const u = profileRes.data.user;
          
          // Check verification status
          if (u.artist) {
            setVerificationStatus(u.artist.verification_status);
            
            // If verified, redirect to dashboard (only once)
            if (u.artist.verification_status === 'verified') {
              setTimeout(() => {
                handleRedirectToDashboard();
              }, 100);
              return;
            }
          }
          
          setForm({
            first_name: u.first_name || '',
            last_name: u.last_name || '',
            city: (u.artist && u.artist.city) || '',
            country: (u.artist && u.artist.country) || '',
            contact_email: u.email || '',
            bio: (u.artist && u.artist.bio) || '',
          });
          
          if (u.profile_pic_url) {
            setProfilePhotoPreview(u.profile_pic_url);
          }
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
      }
    };
    
    let mounted = true;
    if (mounted) {
      loadProfile();
    }
    return () => {
      mounted = false;
    };
  }, [handleRedirectToDashboard]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });
    
    try {
      const requiredFields = ['first_name', 'last_name', 'city', 'country', 'contact_email', 'bio'];
      const missing = requiredFields.filter((f) => !form[f] || !form[f].trim());
      if (missing.length) {
        setMessage({ text: 'Please complete all profile fields before submitting for verification.', type: 'error' });
        setLoading(false);
        return;
      }

      if (bioWordCount > 150) {
        setMessage({ text: 'Bio must be 150 words or fewer.', type: 'error' });
        setLoading(false);
        return;
      }

      let payload;
      if (profilePhoto) {
        payload = new FormData();
        payload.append('first_name', form.first_name);
        payload.append('last_name', form.last_name);
        payload.append('city', form.city);
        payload.append('country', form.country);
        payload.append('contact_email', form.contact_email);
        payload.append('bio', form.bio);
        payload.append('profile_photo', profilePhoto);
      } else {
        payload = {
          first_name: form.first_name,
          last_name: form.last_name,
          city: form.city,
          country: form.country,
          contact_email: form.contact_email,
          bio: form.bio
        };
      }

      const { data } = await authAPI.updateProfile(payload);
      if (data && data.success) {
        setMessage({
          text: '✅ Profile submitted for verification! Admin will review it within 24-48 hours.',
          type: 'success'
        });
        setVerificationStatus('pending');
      } else {
        setMessage({ text: 'Update failed', type: 'error' });
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Update failed';
      setMessage({ text: msg, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Paper sx={{ p: 4 }} elevation={3}>
        <Typography variant="h4" gutterBottom fontWeight={800}>
          Complete Your Artist Profile
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
          Fill out your profile details to get started. Your profile will be reviewed by our admin team before you can upload artworks.
        </Typography>

        {/* Verification Status Messages */}
        {verificationStatus === 'pending' && (
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
              ⏳ Your Profile is Under Review
            </Typography>
            <Typography variant="body2">
              Your profile has been submitted for verification. Admin will review it within 24-48 hours. You'll be notified once it's approved.
            </Typography>
          </Alert>
        )}

        {verificationStatus === 'rejected' && (
          <Alert severity="error" sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
              ❌ Profile Rejected
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Your profile was rejected by the admin. Please review and update your information, then resubmit.
            </Typography>
            <Typography variant="caption">
              If you have questions, please contact our support team.
            </Typography>
          </Alert>
        )}

        {message.text && (
          <Alert severity={message.type} sx={{ mb: 3 }}>
            {message.text}
          </Alert>
        )}

        {/* Profile Form */}
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                name="first_name"
                value={form.first_name}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                name="last_name"
                value={form.last_name}
                onChange={handleChange}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="City"
                name="city"
                value={form.city}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Country"
                name="country"
                value={form.country}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Contact Email"
                name="contact_email"
                type="email"
                value={form.contact_email}
                onChange={handleChange}
                helperText="This email will be shown to buyers for contact."
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="subtitle2">Profile Photo</Typography>
                {profilePhotoPreview && (
                  <Box
                    component="img"
                    src={profilePhotoPreview}
                    alt="Profile preview"
                    sx={{
                      width: 120,
                      height: 120,
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '2px solid',
                      borderColor: 'primary.main',
                    }}
                  />
                )}
                <Button
                  variant="outlined"
                  component="label"
                  sx={{ maxWidth: 250 }}
                >
                  Upload Profile Photo
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </Button>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Bio"
                name="bio"
                value={form.bio}
                onChange={handleChange}
                helperText={`${bioWordCount}/150 words (max)`}
                error={bioWordCount > 150}
              />
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
            <Button
              type="submit"
              variant="contained"
              disabled={loading || bioWordCount > 150}
            >
              {loading ? 'Submitting...' : 'Submit for Verification'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default ArtistProfileSetup;
