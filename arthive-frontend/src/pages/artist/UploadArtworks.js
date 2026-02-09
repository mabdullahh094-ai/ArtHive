import React, { useState, useEffect } from 'react';
import { Container, Paper, Typography, Box, Button, TextField, Alert, Grid, IconButton, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { artistAPI, authAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import DeleteIcon from '@mui/icons-material/Delete';

const UploadArtworks = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [images, setImages] = useState([]);
  const [certificate, setCertificate] = useState(null);
  const [specialization, setSpecialization] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [checkingStatus, setCheckingStatus] = useState(true);

  useEffect(() => {
    const checkVerificationStatus = async () => {
      try {
        const profileRes = await authAPI.getProfile();
        if (profileRes.data?.user) {
          const u = profileRes.data.user;
          if (u.artist && u.artist.verification_status === 'verified') {
            // Artist is verified, allow upload
          } else {
            setMessage({
              text: 'Your artist profile must be verified by admin before uploading artworks.',
              type: 'error'
            });
            // Redirect after 2 seconds
            setTimeout(() => navigate('/artist/dashboard'), 2000);
          }
        }
      } catch (err) {
        console.error('Failed to check verification status:', err);
      } finally {
        setCheckingStatus(false);
      }
    };

    if (!authLoading) {
      checkVerificationStatus();
    }
  }, [authLoading, navigate]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    const next = files.map(f => ({ file: f, url: URL.createObjectURL(f) }));
    setImages(prev => [...prev, ...next]);
  };

  const removeImage = (index) => {
    setImages(prev => {
      const copy = [...prev];
      // revoke object URL
      if (copy[index] && copy[index].url) URL.revokeObjectURL(copy[index].url);
      copy.splice(index, 1);
      return copy;
    });
  };

  const handleCertificateChange = (e) => {
    const file = e.target.files?.[0] || null;
    setCertificate(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });

    if (images.length < 4) {
      setMessage({ text: 'Please select at least 4 images.', type: 'error' });
      return;
    }

    const form = new FormData();
    images.forEach(item => form.append('images', item.file));
    if (certificate) form.append('certificate', certificate);
    form.append('specialization', specialization || '');

    try {
      setLoading(true);
      const response = await artistAPI.uploadPortfolio(form);
      setMessage({
        text: response.data?.message || 'Artworks uploaded successfully and are pending admin approval. You will see them in your dashboard shortly.',
        type: 'success'
      });
      // Clear form
      setImages([]);
      setCertificate(null);
      setSpecialization('');
      setTimeout(() => navigate('/artist/dashboard'), 2000);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Upload failed';
      setMessage({ text: msg, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Protect page: redirect if not authenticated or not an artist
  // Check artist verification status
  useEffect(() => {
    const checkVerification = async () => {
      // Wait for auth to finish loading
      if (authLoading) return;
      
      if (!isAuthenticated) {
        navigate('/login');
        return;
      }
      
      if (user && user.user_type && user.user_type !== 'artist') {
        navigate('/');
        return;
      }

      // Check artist verification status
      try {
        const response = await authAPI.getProfile();
        if (response.data?.user?.artist) {
          const status = response.data.user.artist.verification_status;
          setVerificationStatus(status);
          
          if (status !== 'verified') {
            setMessage({
              text: status === 'pending'
                ? 'Your artist profile is pending admin approval. You will be able to upload artworks once approved.'
                : 'Your artist profile was rejected. Please contact support for more information.',
              type: 'warning'
            });
          }
        }
      } catch (err) {
        console.error('Failed to check verification status:', err);
      } finally {
        setCheckingStatus(false);
      }
    };

    checkVerification();
  }, [isAuthenticated, user, navigate, authLoading]);

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Paper sx={{ p: 4 }} elevation={3}>
        <Typography variant="h4" gutterBottom>Upload Portfolio</Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Upload at least 4 images showcasing your work, and optionally upload a certificate.
        </Typography>

        {checkingStatus ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : verificationStatus !== 'verified' ? (
          <>
            {message.text && <Alert severity={message.type} sx={{ mt: 3 }}>{message.text}</Alert>}
            <Box sx={{ mt: 3 }}>
              <Button variant="outlined" onClick={() => navigate('/artist/dashboard')}>
                Go to Dashboard
              </Button>
            </Box>
          </>
        ) : (
          <>
            {message.text && <Alert severity={message.type} sx={{ mb: 2 }}>{message.text}</Alert>}

            <Box component="form" onSubmit={handleSubmit}>
          <TextField fullWidth label="Specialization / Certificate Description" value={specialization} onChange={(e) => setSpecialization(e.target.value)} margin="normal" />

          <Button variant="contained" component="label" sx={{ mt: 1 }}>
            Select Images
            <input hidden accept="image/*" multiple type="file" onChange={handleImageChange} />
          </Button>

          <Grid container spacing={2} sx={{ mt: 2 }}>
            {images.map((img, idx) => (
              <Grid item xs={6} sm={3} key={idx}>
                <Box sx={{ position: 'relative' }}>
                  <img src={img.url} alt={`preview-${idx}`} style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 4 }} />
                  <IconButton size="small" onClick={() => removeImage(idx)} sx={{ position: 'absolute', top: 6, right: 6, bgcolor: 'rgba(255,255,255,0.8)' }}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Grid>
            ))}
          </Grid>

          <Box sx={{ mt: 2 }}>
            <Button variant="outlined" component="label">Select Certificate (optional)
              <input hidden accept="image/*,application/pdf" type="file" onChange={handleCertificateChange} />
            </Button>
            {certificate && <Typography variant="body2" sx={{ ml: 2, display: 'inline-block' }}>{certificate.name}</Typography>}
          </Box>

          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button type="submit" variant="contained" disabled={loading}>{loading ? 'Uploading...' : 'Upload Portfolio'}</Button>
            <Button variant="text" onClick={() => navigate(-1)}>Cancel</Button>
          </Box>
        </Box>
          </>
        )}
      </Paper>
    </Container>
  );
};

export default UploadArtworks;
