import React, { useState, useEffect } from 'react';
import { Container, Paper, Typography, Box, Button, TextField, Alert, Grid, IconButton, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { artistAPI, authAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toTitleCaseInput } from '../../utils/formatters';
import DeleteIcon from '@mui/icons-material/Delete';
import PriceRecommendation from '../../components/Common/PriceRecommendation';

const UploadArtworks = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [images, setImages] = useState([]);
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [priceRecommendationOpen, setPriceRecommendationOpen] = useState(false);
  const [autoFilledData, setAutoFilledData] = useState(null);
  const [analyzingImage, setAnalyzingImage] = useState(false);
  const MAX_IMAGES = 20;
  const MIN_RECOMMENDED_IMAGES = 1;

  const extractImageMetrics = (img) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return {
        brightness: 0.75,
        contrast: 0.75,
        composition: 0.75,
        colorHarmony: 0.75,
        quality: 0.75,
        authenticity: 0.8,
        subjectComplexity: 0.75,
      };
    }

    // Downscale for fast analysis while keeping visual signal.
    const maxSide = 512;
    const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
    const w = Math.max(32, Math.round(img.width * scale));
    const h = Math.max(32, Math.round(img.height * scale));

    canvas.width = w;
    canvas.height = h;
    ctx.drawImage(img, 0, 0, w, h);

    const imageData = ctx.getImageData(0, 0, w, h).data;
    const totalPixels = w * h;

    let brightnessSum = 0;
    let graySqSum = 0;
    let satSum = 0;
    let edgeCount = 0;

    const gray = new Float32Array(totalPixels);

    for (let i = 0, p = 0; i < imageData.length; i += 4, p += 1) {
      const r = imageData[i] / 255;
      const g = imageData[i + 1] / 255;
      const b = imageData[i + 2] / 255;

      // Perceived luminance.
      const y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      gray[p] = y;
      brightnessSum += y;
      graySqSum += y * y;

      const maxC = Math.max(r, g, b);
      const minC = Math.min(r, g, b);
      satSum += maxC === 0 ? 0 : (maxC - minC) / maxC;
    }

    // Simple edge density proxy using local luminance gradients.
    for (let y = 1; y < h - 1; y += 1) {
      for (let x = 1; x < w - 1; x += 1) {
        const idx = y * w + x;
        const gx = Math.abs(gray[idx + 1] - gray[idx - 1]);
        const gy = Math.abs(gray[idx + w] - gray[idx - w]);
        if (gx + gy > 0.22) edgeCount += 1;
      }
    }

    const meanBrightness = brightnessSum / totalPixels;
    const variance = Math.max(graySqSum / totalPixels - meanBrightness * meanBrightness, 0);
    const stdDev = Math.sqrt(variance);
    const edgeDensity = edgeCount / Math.max(1, (w - 2) * (h - 2));
    const meanSaturation = satSum / totalPixels;

    const brightness = Math.max(0, Math.min(1, meanBrightness));
    const contrast = Math.max(0, Math.min(1, stdDev / 0.5));
    const composition = Math.max(0, Math.min(1, edgeDensity * 3.2));
    const colorHarmony = Math.max(0, Math.min(1, meanSaturation));
    const subjectComplexity = Math.max(0, Math.min(1, edgeDensity * 2.6));

    const quality = Math.max(
      0,
      Math.min(1, brightness * 0.15 + contrast * 0.25 + composition * 0.3 + colorHarmony * 0.3)
    );

    // Heuristic authenticity proxy.
    const authenticity = Math.max(0, Math.min(1, 0.55 + contrast * 0.2 + composition * 0.25));

    return {
      brightness,
      contrast,
      composition,
      colorHarmony,
      quality,
      authenticity,
      subjectComplexity,
    };
  };

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
    const remainingSlots = MAX_IMAGES - images.length;
    if (remainingSlots <= 0) {
      setMessage({ text: `You can upload up to ${MAX_IMAGES} images for one artwork.`, type: 'warning' });
      return;
    }
    const limitedFiles = files.slice(0, remainingSlots);
    if (limitedFiles.length < files.length) {
      setMessage({ text: `Only ${MAX_IMAGES} images are allowed per artwork.`, type: 'warning' });
    }
    const next = limitedFiles.map(f => ({ file: f, url: URL.createObjectURL(f) }));
    setImages(prev => [...prev, ...next]);

    // Auto-analyze first image for dimensions and quality
    if (next.length > 0) {
      analyzeFirstImage(next[0]);
    }
  };

  /**
   * Extract image dimensions and analyze quality
   * Called when user selects first image
   */
  const analyzeFirstImage = (imageObj) => {
    try {
      setAnalyzingImage(true);

      const img = new Image();
      img.onload = async () => {
        try {
          // Extract pixel dimensions
          const width_px = img.width;
          const height_px = img.height;

          // Convert pixels to cm (assuming 200 DPI for digital art)
          const dpi = 200;
          const cm_per_pixel = 2.54 / dpi;
          const width_cm = Number((width_px * cm_per_pixel).toFixed(2));
          const height_cm = Number((height_px * cm_per_pixel).toFixed(2));
          const size_cm2 = Number((width_cm * height_cm).toFixed(2));
          const aspect_ratio = parseFloat((width_cm / height_cm).toFixed(2));

          const metrics = extractImageMetrics(img);

          // Build image-aware defaults from the uploaded image itself.
          const analysisData = {
            width_cm,
            height_cm,
            size_cm2,
            aspect_ratio,
            width_px,
            height_px,
            ai_quality_score: Number(metrics.quality.toFixed(3)),
            ai_authenticity_score: Number(metrics.authenticity.toFixed(3)),
            image_brightness_score: Number(metrics.brightness.toFixed(3)),
            image_contrast_score: Number(metrics.contrast.toFixed(3)),
            composition_score: Number(metrics.composition.toFixed(3)),
            color_harmony_score: Number(metrics.colorHarmony.toFixed(3)),
            artist_experience_years: 5,
            artist_previous_sales: 0,
            artist_reputation_score: 3.5,
            time_taken_hours: 10,
            year_created: new Date().getFullYear(),
            edition_size: 1,
            country: 'Pakistan',
            market_demand_index: 0.50,
            subject_complexity_score: Number(metrics.subjectComplexity.toFixed(3))
          };

          setAutoFilledData(analysisData);
          setMessage({
            text: `✓ Image analyzed: ${width_cm}cm × ${height_cm}cm (${size_cm2}cm²) | Quality: ${(analysisData.ai_quality_score * 100).toFixed(0)}%`,
            type: 'success'
          });
        } catch (err) {
          console.error('Error analyzing image:', err);
          setMessage({
            text: 'Could not analyze image fully, but dimensions extracted',
            type: 'info'
          });
        } finally {
          setAnalyzingImage(false);
        }
      };

      img.onerror = () => {
        setAnalyzingImage(false);
        setMessage({
          text: 'Could not load image for analysis',
          type: 'warning'
        });
      };

      img.src = imageObj.url;
    } catch (err) {
      setAnalyzingImage(false);
      console.error('Error in analyzeFirstImage:', err);
    }
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

  const handleAcceptPriceRecommendation = (recommendedPrice) => {
    setPrice(recommendedPrice.toString());
    setMessage({ 
      text: `Price updated to $${recommendedPrice.toFixed(2)} (recommended by AI)`, 
      type: 'success' 
    });
  };

  const handleOpenPriceRecommendation = () => {
    if (images.length === 0) {
      setMessage({
        text: 'Please upload at least one artwork image before requesting a price recommendation.',
        type: 'warning'
      });
      return;
    }

    setPriceRecommendationOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });

    if (images.length < 1) {
      setMessage({ text: 'Please select at least 1 image.', type: 'error' });
      return;
    }

    if (images.length < MIN_RECOMMENDED_IMAGES) {
      setMessage({ text: `Please upload at least ${MIN_RECOMMENDED_IMAGES} images for better gallery view.`, type: 'error' });
      return;
    }

    if (!title.trim()) {
      setMessage({ text: 'Artwork title is required.', type: 'error' });
      return;
    }

    const parsedPrice = parseFloat(price);
    if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
      setMessage({ text: 'Valid artwork price is required.', type: 'error' });
      return;
    }

    const form = new FormData();
    images.forEach(item => form.append('images', item.file));
    form.append('title', title.trim());
    form.append('price', String(parsedPrice));
    form.append('description', description.trim());
    form.append('submission_context', 'dashboard');

    try {
      setLoading(true);
      const response = await artistAPI.uploadPortfolio(form);
      setMessage({
        text: response.data?.message || 'Artwork uploaded successfully. It is now available on Home and your dashboard.',
        type: 'success'
      });
      // Clear form
      setImages([]);
      setTitle('');
      setPrice('');
      setDescription('');
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
        <Typography variant="h4" gutterBottom>Upload Artwork</Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Add artwork details and upload one or more images. All images will appear in the artwork detail gallery.
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          You can upload 1, 2, or more images for one artwork (max {MAX_IMAGES}).
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
          <TextField
            fullWidth
            label="Artwork Title"
            value={title}
            onChange={(e) => setTitle(toTitleCaseInput(e.target.value))}
            margin="normal"
            required
          />

          <TextField
            fullWidth
            label="Price"
            type="number"
            inputProps={{ min: 0, step: '0.01' }}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            margin="normal"
            required
          />

          <Box sx={{ mt: 1, mb: 2 }}>
            <Button 
              variant="outlined" 
              color="primary"
              onClick={handleOpenPriceRecommendation}
              disabled={images.length === 0 || analyzingImage}
              sx={{ textTransform: 'none' }}
            >
              💡 Get AI Price Recommendation
            </Button>
          </Box>

          <TextField
            fullWidth
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            margin="normal"
            multiline
            minRows={3}
          />

          <Button variant="contained" component="label" sx={{ mt: 1 }}>
            Select Images
            <input hidden accept="image/*" multiple type="file" onChange={handleImageChange} />
          </Button>
          {analyzingImage && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Analyzing first image for dimensions and quality...
            </Typography>
          )}
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            Selected: {images.length} / {MAX_IMAGES}
          </Typography>

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

          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button type="submit" variant="contained" disabled={loading}>{loading ? 'Uploading...' : 'Upload Artwork'}</Button>
            <Button variant="text" onClick={() => navigate(-1)}>Cancel</Button>
          </Box>
        </Box>
          </>
        )}

        {/* Price Recommendation Dialog */}
        <PriceRecommendation 
          open={priceRecommendationOpen}
          onClose={() => setPriceRecommendationOpen(false)}
          onAcceptPrice={handleAcceptPriceRecommendation}
          autoFilledData={autoFilledData}
          imageFile={images[0]?.file || null}
          imagePreviewUrl={images[0]?.url || null}
        />
      </Paper>
    </Container>
  );
};

export default UploadArtworks;
