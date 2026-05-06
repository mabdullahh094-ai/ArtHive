import React, { useEffect, useMemo, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
} from '@mui/material';
import { Add, ChevronLeft, ChevronRight, Remove } from '@mui/icons-material';
import { Link, useParams } from 'react-router-dom';
import { buyerAPI } from '../../services/api';

const ArtworkDetail = () => {
  const { id } = useParams();
  const MIN_ZOOM = 1;
  const MAX_ZOOM = 3;
  const ZOOM_STEP = 0.2;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [artwork, setArtwork] = useState(null);
  const [similarArtworks, setSimilarArtworks] = useState([]);
  const [selectedImage, setSelectedImage] = useState('');
  const [zoomLevel, setZoomLevel] = useState(1);

  const imageUrls = useMemo(() => {
    if (!artwork) return [];
    const gallery = Array.isArray(artwork.image_urls)
      ? artwork.image_urls
      : artwork.image_urls
      ? [artwork.image_urls]
      : [];

    const combined = [artwork.image_url, ...gallery]
      .filter(Boolean)
      .map((url) => String(url).trim())
      .filter(Boolean);

    return [...new Set(combined)];
  }, [artwork]);

  useEffect(() => {
    const loadArtwork = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await buyerAPI.getArtworkById(id);
        const data = res.data;
        if (!data?.success || !data?.artwork) {
          setError('Artwork not found.');
          return;
        }
        setArtwork(data.artwork);
        setSimilarArtworks(Array.isArray(data.similarArtworks) ? data.similarArtworks : []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load artwork details.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadArtwork();
    }
  }, [id]);

  useEffect(() => {
    if (imageUrls.length > 0) {
      setSelectedImage(imageUrls[0]);
    }
  }, [imageUrls]);

  useEffect(() => {
    setZoomLevel(1);
  }, [selectedImage]);

  useEffect(() => {
    if (!artwork) return;

    const onKeyDown = (e) => {
      const tag = e.target?.tagName;
      if (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        e.target?.isContentEditable ||
        e.ctrlKey ||
        e.metaKey
      ) {
        return;
      }

      if (e.key === 'ArrowLeft' && imageUrls.length > 1) {
        e.preventDefault();
        const currentIndex = imageUrls.findIndex((url) => url === selectedImage);
        const safeIndex = currentIndex >= 0 ? currentIndex : 0;
        const prevIndex = (safeIndex - 1 + imageUrls.length) % imageUrls.length;
        setSelectedImage(imageUrls[prevIndex]);
        return;
      }

      if (e.key === 'ArrowRight' && imageUrls.length > 1) {
        e.preventDefault();
        const currentIndex = imageUrls.findIndex((url) => url === selectedImage);
        const safeIndex = currentIndex >= 0 ? currentIndex : 0;
        const nextIndex = (safeIndex + 1) % imageUrls.length;
        setSelectedImage(imageUrls[nextIndex]);
        return;
      }

      if (e.key === '+' || e.key === '=' || e.key === 'Add') {
        e.preventDefault();
        setZoomLevel((prev) => Math.min(prev + ZOOM_STEP, MAX_ZOOM));
        return;
      }

      if (e.key === '-' || e.key === '_' || e.key === 'Subtract') {
        e.preventDefault();
        setZoomLevel((prev) => Math.max(prev - ZOOM_STEP, MIN_ZOOM));
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [artwork, imageUrls, selectedImage]);

  const selectedImageIndex = imageUrls.findIndex((url) => url === selectedImage);

  const handlePrevImage = () => {
    if (imageUrls.length <= 1) return;
    const currentIndex = selectedImageIndex >= 0 ? selectedImageIndex : 0;
    const prevIndex = (currentIndex - 1 + imageUrls.length) % imageUrls.length;
    setSelectedImage(imageUrls[prevIndex]);
  };

  const handleNextImage = () => {
    if (imageUrls.length <= 1) return;
    const currentIndex = selectedImageIndex >= 0 ? selectedImageIndex : 0;
    const nextIndex = (currentIndex + 1) % imageUrls.length;
    setSelectedImage(imageUrls[nextIndex]);
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + ZOOM_STEP, MAX_ZOOM));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - ZOOM_STEP, MIN_ZOOM));
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, sm: 4, md: 5 } }}>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : artwork ? (
        <>
          <Box sx={{ maxWidth: 620, mx: 'auto' }}>
            <Box sx={{ position: 'relative', borderRadius: 2, overflow: 'hidden', bgcolor: '#f5f5f5', mb: 1.5 }}>
              <Box
                component="img"
                src={selectedImage || imageUrls[0]}
                alt={artwork.title}
                sx={{
                  width: '100%',
                  height: { xs: 150, sm: 190, md: 230 },
                  objectFit: 'contain',
                  display: 'block',
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: 'center center',
                  transition: 'transform 0.2s ease',
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  top: 10,
                  right: 10,
                  display: 'flex',
                  gap: 0.5,
                  bgcolor: 'rgba(255,255,255,0.85)',
                  borderRadius: 2,
                  p: 0.25,
                }}
              >
                <IconButton aria-label="Zoom out" size="small" onClick={handleZoomOut} disabled={zoomLevel <= MIN_ZOOM}>
                  <Remove fontSize="small" />
                </IconButton>
                <IconButton aria-label="Zoom in" size="small" onClick={handleZoomIn} disabled={zoomLevel >= MAX_ZOOM}>
                  <Add fontSize="small" />
                </IconButton>
              </Box>
              {imageUrls.length > 1 && (
                <>
                  <IconButton
                    aria-label="Previous image"
                    onClick={handlePrevImage}
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      left: 12,
                      transform: 'translateY(-50%)',
                      bgcolor: 'rgba(255,255,255,0.85)',
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.95)' },
                    }}
                  >
                    <ChevronLeft />
                  </IconButton>
                  <IconButton
                    aria-label="Next image"
                    onClick={handleNextImage}
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      right: 12,
                      transform: 'translateY(-50%)',
                      bgcolor: 'rgba(255,255,255,0.85)',
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.95)' },
                    }}
                  >
                    <ChevronRight />
                  </IconButton>
                </>
              )}
            </Box>

            {imageUrls.length > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.9, pb: 1 }}>
                {imageUrls.map((url) => (
                  <Box
                    key={url}
                    onClick={() => setSelectedImage(url)}
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      cursor: 'pointer',
                      bgcolor: selectedImage === url ? 'primary.main' : 'grey.400',
                      opacity: selectedImage === url ? 1 : 0.8,
                      transition: 'all 0.2s ease',
                    }}
                  />
                ))}
              </Box>
            )}

            <Box sx={{ mt: 2.5 }}>
              <Typography variant="h4" fontWeight={800} gutterBottom sx={{ fontSize: { xs: '1.35rem', sm: '1.7rem', md: '1.95rem' } }}>
                {artwork.title}
              </Typography>

              <Typography variant="h5" color="primary" sx={{ mb: 1.5, fontSize: { xs: '1.2rem', sm: '1.45rem' } }}>
                ${Number(artwork.price || 0).toLocaleString()}
              </Typography>

              <Typography variant="body1" color="text.secondary" sx={{ mb: 1.5, fontSize: { xs: '0.92rem', sm: '0.98rem' } }}>
                {artwork.description || 'No description available.'}
              </Typography>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {artwork.category_name && <Chip label={artwork.category_name} />}
                {artwork.medium && <Chip label={artwork.medium} variant="outlined" />}
                {artwork.dimensions && <Chip label={artwork.dimensions} variant="outlined" />}
              </Box>

              <Typography variant="body2" color="text.secondary">
                Artist: {artwork.artist_first_name} {artwork.artist_last_name}
              </Typography>
            </Box>
          </Box>

          {similarArtworks.length > 0 && (
            <Box sx={{ mt: { xs: 4, md: 5 } }}>
              <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
                Similar Artworks
              </Typography>
              <Grid container spacing={2}>
                {similarArtworks.map((item) => {
                  const preview = Array.isArray(item.image_urls) && item.image_urls.length > 0
                    ? item.image_urls[0]
                    : item.image_url;
                  return (
                    <Grid item xs={6} sm={4} md={3} key={item.id}>
                      <Card component={Link} to={`/artwork/${item.id}`} sx={{ textDecoration: 'none', height: '100%' }}>
                        <CardMedia component="img" image={preview} alt={item.title} sx={{ height: { xs: 120, sm: 140 }, objectFit: 'cover' }} />
                        <CardContent sx={{ p: { xs: 1, sm: 1.5 }, '&:last-child': { pb: { xs: 1, sm: 1.5 } } }}>
                          <Typography variant="subtitle2" noWrap>
                            {item.title}
                          </Typography>
                          <Typography variant="body2" color="primary">
                            ${Number(item.price || 0).toLocaleString()}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </Box>
          )}
        </>
      ) : (
        <Alert severity="info">Artwork not found.</Alert>
      )}
    </Container>
  );
};

export default ArtworkDetail;