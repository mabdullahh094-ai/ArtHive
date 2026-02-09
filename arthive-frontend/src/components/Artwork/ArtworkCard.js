import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import {
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Typography,
  Button,
  Box,
  Chip,
  IconButton,
} from '@mui/material';
import { Favorite, FavoriteBorder, ShoppingCart } from '@mui/icons-material';

const ArtworkCard = ({ artwork, onAddToCart, onAddToWishlist, isWishlisted }) => {
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 3,
        overflow: 'hidden',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        '&:hover': {
          transform: 'translateY(-8px)',
          boxShadow: 8,
        },
      }}
    >
      <Link to={`/artwork/${artwork.id}`} style={{ textDecoration: 'none' }}>
        <Box sx={{ position: 'relative', overflow: 'hidden' }}>
          <CardMedia
            component="img"
            height="220"
            image={artwork.imageUrl || artwork.thumbnail || 'https://via.placeholder.com/400x300?text=Artwork'}
            alt={artwork.title}
            sx={{ objectFit: 'cover' }}
          />
          {artwork.isFeatured && (
            <Chip
              label="Featured"
              color="primary"
              size="small"
              sx={{ position: 'absolute', top: 12, left: 12 }}
            />
          )}
          {artwork.isSold && (
            <Box
              sx={{
                position: 'absolute',
                top: 12,
                right: 12,
                bgcolor: 'error.main',
                color: 'white',
                px: 1,
                py: 0.5,
                borderRadius: 1,
                fontSize: '0.75rem',
                fontWeight: 'bold',
              }}
            >
              SOLD
            </Box>
          )}
        </Box>
        <CardContent sx={{ flexGrow: 1 }}>
          <Typography gutterBottom variant="h6" noWrap>
            {artwork.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            By {artwork.artist?.name || artwork.artistName || 'Unknown Artist'}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
            {artwork.category && (
              <Chip label={artwork.category} size="small" />
            )}
            {artwork.medium && (
              <Chip label={artwork.medium} size="small" variant="outlined" />
            )}
          </Box>
          <Typography variant="h6" color="primary" fontWeight="bold">
            {formatPrice(artwork.price)}
          </Typography>
        </CardContent>
      </Link>
      <CardActions sx={{ justifyContent: 'space-between', p: 2, pt: 0 }}>
        <IconButton 
          size="small" 
          color={isWishlisted ? 'error' : 'default'}
          onClick={(e) => {
            e.preventDefault();
            onAddToWishlist(artwork);
          }}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          {isWishlisted ? <Favorite /> : <FavoriteBorder />}
        </IconButton>
        <Button
          size="small"
          color="primary"
          variant="contained"
          startIcon={<ShoppingCart />}
          onClick={() => onAddToCart(artwork.id)}
          disabled={artwork.isSold}
        >
          {artwork.isSold ? 'Sold Out' : 'Add to Cart'}
        </Button>
      </CardActions>
    </Card>
  );
};

ArtworkCard.propTypes = {
  artwork: PropTypes.object.isRequired,
  onAddToCart: PropTypes.func.isRequired,
  onAddToWishlist: PropTypes.func,
  isWishlisted: PropTypes.bool,
};

export default ArtworkCard;