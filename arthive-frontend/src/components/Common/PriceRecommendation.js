import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Grid,
  Box,
  CircularProgress,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper
} from '@mui/material';
import { TrendingUp as TrendingUpIcon } from '@mui/icons-material';
import { artistAPI } from '../../services/api';

/**
 * Smart Price Recommendation Component
 * Auto-fills dimensions and quality scores from image
 * Only asks user for 4 essential fields: medium, style, condition, is_original
 */
const PriceRecommendation = ({ 
  open, 
  onClose, 
  onAcceptPrice, 
  autoFilledData = null,
  imageFile = null,
  imagePreviewUrl = null
}) => {
  const [loading, setLoading] = useState(false);
  const [modelInfo, setModelInfo] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState(null);
  
  // Only 4 required fields
  const [formData, setFormData] = useState({
    medium: 'oil',
    style: 'impressionism',
    condition: 'good',
    is_original: 1
  });

  // When auto-filled data changes, reset form
  useEffect(() => {
    setFormData({
      medium: 'oil',
      style: 'impressionism',
      condition: 'good',
      is_original: 1
    });
    setPrediction(null);
  }, [open, autoFilledData]);

  useEffect(() => {
    if (open && !modelInfo) {
      fetchModelInfo();
    }
  }, [open, modelInfo]);

  const fetchModelInfo = async () => {
    try {
      const response = await artistAPI.get('/artist/prediction-info');
      if (response.data?.success) {
        setModelInfo(response.data.model_info);
      }
    } catch (err) {
      console.error('Error fetching model info:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const predictPrice = async () => {
    try {
      setLoading(true);
      setError(null);
      setPrediction(null);

      if (!imageFile) {
        setError('Image file is required for price prediction');
        setLoading(false);
        return;
      }

      // Create FormData - image file is all we need, Python model extracts price from image
      const formData = new FormData();
      formData.append('image', imageFile);

      // Send to backend - it will pass the image to Python predictor
      const response = await artistAPI.post(
        '/artist/predict-price',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 60000
        }
      );

      if (response.data?.success) {
        setPrediction(response.data.prediction);
      } else {
        setError(response.data?.error || 'Prediction failed');
      }
    } catch (err) {
      console.error('Prediction error:', err);
      if (err.code === 'ECONNABORTED') {
        setError('Prediction is taking longer than expected. Please try again in a few seconds.');
      } else if (err.request && !err.response) {
        setError('Could not reach the server. Please make sure backend is running and try again.');
      } else {
        setError(err.response?.data?.error || 'Failed to predict price');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = () => {
    const acceptedPrice = prediction?.predicted_price_pkr ?? prediction?.predicted_price;
    if (typeof acceptedPrice === 'number' && Number.isFinite(acceptedPrice)) {
      onAcceptPrice(acceptedPrice);
      onClose();
    }
  };

  const recommendedPrice = prediction?.predicted_price_pkr ?? prediction?.predicted_price;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 'bold', bgcolor: 'primary.main', color: 'white' }}>
        <Box display="flex" alignItems="center" gap={1}>
          <TrendingUpIcon />
          AI Price Recommendation
        </Box>
      </DialogTitle>

      <DialogContent sx={{ mt: 2 }}>
        {imagePreviewUrl && (
          <Paper sx={{ mb: 2, p: 1.5, bgcolor: '#f8fafc', border: '1px solid #dbe4ff' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
              Selected Artwork
            </Typography>
            <Box
              component="img"
              src={imagePreviewUrl}
              alt="Selected artwork preview"
              sx={{
                width: '100%',
                maxHeight: 240,
                objectFit: 'contain',
                borderRadius: 2,
                display: 'block',
                backgroundColor: '#fff'
              }}
            />
          </Paper>
        )}

        {!imagePreviewUrl && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Please upload an artwork image first so the AI can review the selected piece.
          </Alert>
        )}

        {/* Auto-filled Info */}
        {autoFilledData && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="caption">
              <strong>Auto-detected:</strong> {autoFilledData.width_cm}cm × {autoFilledData.height_cm}cm ({autoFilledData.size_cm2}cm²)
              | Quality: {(autoFilledData.ai_quality_score * 100).toFixed(0)}%
            </Typography>
          </Alert>
        )}

        {/* Simple 4-field Form */}
        {!prediction && (
          <Grid container spacing={2.5} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Medium *</InputLabel>
                <Select
                  name="medium"
                  value={formData.medium}
                  onChange={handleInputChange}
                  label="Medium"
                >
                  <MenuItem value="oil">Oil</MenuItem>
                  <MenuItem value="acrylic">Acrylic</MenuItem>
                  <MenuItem value="watercolor">Watercolor</MenuItem>
                  <MenuItem value="charcoal">Charcoal</MenuItem>
                  <MenuItem value="ink">Ink</MenuItem>
                  <MenuItem value="pastel">Pastel</MenuItem>
                  <MenuItem value="gouache">Gouache</MenuItem>
                  <MenuItem value="mixed_media">Mixed Media</MenuItem>
                  <MenuItem value="digital">Digital</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Style *</InputLabel>
                <Select
                  name="style"
                  value={formData.style}
                  onChange={handleInputChange}
                  label="Style"
                >
                  <MenuItem value="impressionism">Impressionism</MenuItem>
                  <MenuItem value="realism">Realism</MenuItem>
                  <MenuItem value="landscape">Landscape</MenuItem>
                  <MenuItem value="minimalism">Minimalism</MenuItem>
                  <MenuItem value="conceptual">Conceptual</MenuItem>
                  <MenuItem value="pop_art">Pop Art</MenuItem>
                  <MenuItem value="expressionism">Expressionism</MenuItem>
                  <MenuItem value="surrealism">Surrealism</MenuItem>
                  <MenuItem value="abstract">Abstract</MenuItem>
                  <MenuItem value="portrait">Portrait</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Condition *</InputLabel>
                <Select
                  name="condition"
                  value={formData.condition}
                  onChange={handleInputChange}
                  label="Condition"
                >
                  <MenuItem value="new">New</MenuItem>
                  <MenuItem value="fair">Fair</MenuItem>
                  <MenuItem value="good">Good</MenuItem>
                  <MenuItem value="excellent">Excellent</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Type *</InputLabel>
                <Select
                  name="is_original"
                  value={formData.is_original}
                  onChange={handleInputChange}
                  label="Type"
                >
                  <MenuItem value={1}>Original</MenuItem>
                  <MenuItem value={0}>Copy/Reproduction</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        )}

        {/* Loading State */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Error Message */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Prediction Result */}
        {prediction && (
          <Paper sx={{ p: 2.5, bgcolor: '#f5f5f5', border: '2px solid #4caf50' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: '#4caf50' }}>
              ✓ Prediction Result
            </Typography>

            <Box sx={{ mb: 2 }}>
              <Typography variant="h4" sx={{ color: '#4caf50', fontWeight: 'bold', mb: 0.5 }}>
                {typeof recommendedPrice === 'number' && Number.isFinite(recommendedPrice)
                  ? `$${recommendedPrice.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}`
                  : 'Price unavailable'}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Recommended Price (USD)
              </Typography>
            </Box>
          </Paper>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="outlined">
          Cancel
        </Button>
        {!prediction ? (
          <Button
            onClick={predictPrice}
            variant="contained"
            disabled={loading}
            sx={{ bgcolor: '#1976d2' }}
          >
            {loading ? 'Predicting...' : 'Predict Price'}
          </Button>
        ) : (
          <Button
            onClick={handleAccept}
            variant="contained"
            sx={{ bgcolor: '#4caf50' }}
          >
            Accept & Use Price
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default PriceRecommendation;
