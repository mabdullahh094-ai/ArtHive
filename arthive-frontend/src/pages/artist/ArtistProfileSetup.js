import React, { useState, useEffect, useCallback } from 'react';
import {
  Avatar,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  Grid,
} from '@mui/material';
import { Person } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { artistAPI, authAPI } from '../../services/api';
import { isValidPhone } from '../../utils/validators';

const ArtistProfileSetup = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    city: '',
    country: '',
    address: '',
    phone_number: '',
    contact_email: '',
    bio: '',
  });
  const [profilePhotoPreview, setProfilePhotoPreview] = useState(null);
  const [portfolioImages, setPortfolioImages] = useState([]);
  const [existingPortfolioCount, setExistingPortfolioCount] = useState(0);
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
            address: (u.artist && u.artist.address) || '',
            phone_number: (u.artist && u.artist.phone_number) || '',
            contact_email: u.email || '',
            bio: (u.artist && u.artist.bio) || '',
          });

          setExistingPortfolioCount((u.artist && u.artist.total_artworks) || 0);
          
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
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePortfolioImagesChange = (e) => {
    const files = Array.from(e.target.files || []);
    setPortfolioImages(files);
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

      if (!form.address.trim()) {
        setMessage({ text: 'Address is required.', type: 'error' });
        setLoading(false);
        return;
      }

      if (!form.phone_number.trim()) {
        setMessage({ text: 'Phone number is required.', type: 'error' });
        setLoading(false);
        return;
      }

      if (!isValidPhone(form.phone_number.trim())) {
        setMessage({ text: 'Please enter a valid phone number.', type: 'error' });
        setLoading(false);
        return;
      }

      const totalPortfolioAfterUpload = existingPortfolioCount + portfolioImages.length;
      if (totalPortfolioAfterUpload < 4) {
        setMessage({ text: 'Please ensure at least 4 portfolio artworks are submitted for admin review.', type: 'error' });
        setLoading(false);
        return;
      }

      if (existingPortfolioCount < 4 && portfolioImages.length > 0 && portfolioImages.length < 4) {
        setMessage({ text: 'Please upload at least 4 artwork images in one submission.', type: 'error' });
        setLoading(false);
        return;
      }

      if (bioWordCount > 150) {
        setMessage({ text: 'Bio must be 150 words or fewer.', type: 'error' });
        setLoading(false);
        return;
      }

      const payload = {
        first_name: form.first_name,
        last_name: form.last_name,
        city: form.city,
        country: form.country,
        address: form.address,
        phone_number: form.phone_number,
        contact_email: form.contact_email,
        bio: form.bio
      };

      const { data } = await authAPI.updateProfile(payload);

      if (portfolioImages.length > 0) {
        const portfolioFormData = new FormData();
        portfolioImages.forEach((file) => {
          portfolioFormData.append('images', file);
        });
        portfolioFormData.append('specialization', form.bio);
        await artistAPI.uploadPortfolio(portfolioFormData);
        setExistingPortfolioCount((prev) => prev + portfolioImages.length);
        setPortfolioImages([]);
      }

      if (data && data.success) {
        setMessage({
          text: '✅ Profile and artworks submitted for verification! Admin will review and approve/reject based on your submitted artworks.',
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
          Fill out your profile details and submit at least 4 portfolio artworks. Admin will review your profile and artworks, then approve or reject.
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
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <Typography variant="subtitle2">Profile Photo</Typography>
                <Avatar
                  src={profilePhotoPreview || undefined}
                  alt="Profile preview"
                  sx={{
                    width: 120,
                    height: 120,
                    border: '2px solid',
                    borderColor: 'primary.main',
                    bgcolor: 'grey.100',
                    color: 'text.secondary',
                    '& img': {
                      objectFit: 'cover',
                    },
                  }}
                >
                  {!profilePhotoPreview && <Person sx={{ fontSize: 56 }} />}
                </Avatar>
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

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="First Name"
                name="first_name"
                value={form.first_name}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Last Name"
                name="last_name"
                value={form.last_name}
                onChange={handleChange}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone Number"
                name="phone_number"
                value={form.phone_number}
                onChange={handleChange}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                name="contact_email"
                type="email"
                value={form.contact_email}
                onChange={handleChange}
                helperText="This email will be shown to buyers for contact."
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Address"
                name="address"
                value={form.address}
                onChange={handleChange}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="City"
                name="city"
                value={form.city}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} md={6}>
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

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Typography variant="subtitle2">Portfolio Artworks (Minimum 4 total)</Typography>
                <Typography variant="caption" color="text.secondary">
                  Already submitted: {existingPortfolioCount} | Selected now: {portfolioImages.length}
                </Typography>
                <Button
                  variant="outlined"
                  component="label"
                  sx={{ maxWidth: 300 }}
                >
                  Upload Portfolio Artworks
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    multiple
                    onChange={handlePortfolioImagesChange}
                  />
                </Button>
                {portfolioImages.length > 0 && (
                  <Typography variant="caption" color="text.secondary">
                    {portfolioImages.length} file(s) selected
                  </Typography>
                )}
              </Box>
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
