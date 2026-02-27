import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Button,
  Chip,
  Divider,
  CircularProgress,
  Avatar,
  Paper,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  IconButton,
  Alert,
} from '@mui/material';
import {
  ArrowBack,
  Share,
  Favorite,
  Facebook,
  Twitter,
  Instagram,
  Language,
  CalendarToday,
  LocationOn,
  Email,
  Phone,
} from '@mui/icons-material';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { artistAPI } from '../../services/api';

const ArtistDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const notification = useNotification();
  const { user } = useAuth();
  const { addToCart } = useCart();
  
  const [artist, setArtist] = useState(null);
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [artistRes, artworksRes] = await Promise.all([
          artistAPI.getById(id),
          artistAPI.getArtworks(id, { page: 1, limit: 50 }),
        ]);

        const artistData = artistRes?.data?.artist;
        const artworksData = artworksRes?.data?.artworks || [];

        if (!artistData) {
          setError('Artist not found');
          setArtist(null);
          setArtworks([]);
          return;
        }

        const socialMedia = artistData.social_media || {};
        const displayArtist = {
          id: artistData.id,
          name: `${artistData.first_name || ''} ${artistData.last_name || ''}`.trim(),
          title: artistData.specialization || '',
          bio: artistData.bio || 'No biography available.',
          fullBio: artistData.bio || 'No biography available.',
          avatar: artistData.profile_pic_url || '',
          coverImage: artworksData[0]?.image_url || '',
          location: [artistData.city, artistData.country].filter(Boolean).join(', '),
          yearsActive: '',
          artworksCount: Number(artistData.total_artworks || artworksData.length || 0),
          followers: 0,
          rating: 'N/A',
          socialLinks: {
            website: artistData.website_url || socialMedia.website || '',
            instagram: socialMedia.instagram || '',
            facebook: socialMedia.facebook || '',
            twitter: socialMedia.twitter || '',
          },
          contact: {
            email: artistData.contact_email || artistData.email || '',
            phone: artistData.phone_number || '',
          },
          education: [],
          exhibitions: [],
          awards: [],
          categories: artistData.specialization ? [artistData.specialization] : [],
        };

        const mappedArtworks = artworksData.map((item) => ({
          id: item.id,
          title: item.title,
          artist: displayArtist.name,
          artistId: item.artist_id,
          price: Number(item.price || 0),
          image: item.image_url,
          category: item.category_name || '',
          medium: item.medium || 'N/A',
          year: item.created_at ? new Date(item.created_at).getFullYear() : '',
          dimensions: item.dimensions || '',
          description: item.description || '',
        }));

        setArtist(displayArtist);
        setArtworks(mappedArtworks);
      } catch (err) {
        const message = err?.response?.data?.message || 'Failed to load artist details';
        setError(message);
        setArtist(null);
        setArtworks([]);
        console.error('Error fetching artist details:', err);
        notification.showError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, notification]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: artist?.name,
        text: `Check out ${artist?.name} on Arthive`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      notification.showSuccess('Link copied to clipboard!');
    }
  };

  const handleFollow = () => {
    if (!user) {
      notification.showError('Please login to follow artists');
      navigate('/login');
      return;
    }
    
    // Implement follow functionality
    notification.showSuccess(`Following ${artist?.name}`);
  };

  const handleAddToCart = (artwork) => {
    if (!user) {
      notification.showError('Please login to add items to cart');
      navigate('/login');
      return;
    }
    addToCart(artwork);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !artist) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || 'Artist not found'}
        </Alert>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/artists')}
          sx={{ mt: 2 }}
        >
          Back to Artists
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Artist Header */}
      <Paper elevation={0} sx={{ mb: 4, borderRadius: 2, overflow: 'hidden' }}>
        {/* Cover Image */}
        <Box
          sx={{
            height: 200,
            backgroundImage: artist.coverImage ? `url(${artist.coverImage})` : 'none',
            backgroundColor: artist.coverImage ? 'transparent' : 'rgba(15,23,42,0.08)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            position: 'relative',
          }}
        />
        
        <Box sx={{ p: 4 }}>
          <Grid container spacing={4}>
            <Grid item xs={12} md={3}>
              <Box sx={{ position: 'relative', mt: -8 }}>
                <Avatar
                  src={artist.avatar}
                  alt={artist.name}
                  sx={{
                    width: 160,
                    height: 160,
                    border: '4px solid white',
                    boxShadow: 3,
                  }}
                />
              </Box>
            </Grid>
            
            <Grid item xs={12} md={9}>
              <Box>
                <Typography variant="h3" gutterBottom>
                  {artist.name}
                </Typography>
                
                {artist.title && (
                  <Typography variant="h6" color="textSecondary" gutterBottom>
                    {artist.title}
                  </Typography>
                )}

                <Box display="flex" gap={2} alignItems="center" flexWrap="wrap" mb={2}>
                  {artist.location && (
                    <Chip
                      icon={<LocationOn />}
                      label={artist.location}
                      size="small"
                      variant="outlined"
                    />
                  )}
                  {artist.yearsActive && (
                    <Chip
                      icon={<CalendarToday />}
                      label={artist.yearsActive}
                      size="small"
                      variant="outlined"
                    />
                  )}
                  {artist.categories?.map((cat, index) => (
                    <Chip
                      key={index}
                      label={cat}
                      size="small"
                      variant="outlined"
                      color="primary"
                    />
                  ))}
                </Box>

                <Typography variant="body1" paragraph>
                  {artist.bio}
                </Typography>

                {/* Stats */}
                <Box display="flex" gap={4} mb={3}>
                  <Box textAlign="center">
                    <Typography variant="h5" color="primary">
                      {artist.artworksCount}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Artworks
                    </Typography>
                  </Box>
                  <Box textAlign="center">
                    <Typography variant="h5" color="primary">
                      {artist.followers}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Followers
                    </Typography>
                  </Box>
                  <Box textAlign="center">
                    <Typography variant="h5" color="primary">
                      {artist.rating}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Rating
                    </Typography>
                  </Box>
                </Box>

                <Box display="flex" gap={2} mt={3} flexWrap="wrap">
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<Favorite />}
                    onClick={handleFollow}
                  >
                    Follow
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Share />}
                    onClick={handleShare}
                  >
                    Share
                  </Button>
                  
                  {/* Social Links */}
                  {artist.socialLinks && (
                    <Box display="flex" gap={1} ml="auto">
                      {artist.socialLinks.website && (
                        <IconButton href={artist.socialLinks.website} target="_blank" size="small">
                          <Language />
                        </IconButton>
                      )}
                      {artist.socialLinks.facebook && (
                        <IconButton href={artist.socialLinks.facebook} target="_blank" size="small">
                          <Facebook />
                        </IconButton>
                      )}
                      {artist.socialLinks.twitter && (
                        <IconButton href={artist.socialLinks.twitter} target="_blank" size="small">
                          <Twitter />
                        </IconButton>
                      )}
                      {artist.socialLinks.instagram && (
                        <IconButton href={artist.socialLinks.instagram} target="_blank" size="small">
                          <Instagram />
                        </IconButton>
                      )}
                    </Box>
                  )}
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* Tabs Section */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Artworks" />
          <Tab label="About" />
          <Tab label="Exhibitions" />
          <Tab label="Contact" />
        </Tabs>
      </Box>

      {/* Tab Content */}
      {tabValue === 0 && (
        <>
          <Typography variant="h5" gutterBottom>
            Artworks by {artist.name}
          </Typography>
          <Grid container spacing={3}>
            {artworks.map((artwork) => (
              <Grid item xs={12} sm={6} md={3} key={artwork.id}>
                <Card 
                  sx={{ 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 2,
                    transition: 'transform 0.2s',
                    '&:hover': { transform: 'translateY(-4px)' }
                  }}
                >
                  <Box
                    sx={{
                      height: 220,
                      backgroundColor: '#f5f5f5',
                      overflow: 'hidden',
                      cursor: 'pointer',
                    }}
                    onClick={() => navigate(`/artwork/${artwork.id}`)}
                  >
                    <CardMedia
                      component="img"
                      image={artwork.image}
                      alt={artwork.title}
                      sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                    />
                  </Box>
                  <CardContent sx={{ flexGrow: 1, minHeight: 165, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <Typography 
                      variant="h6" 
                      noWrap
                      component={Link}
                      to={`/artwork/${artwork.id}`}
                      sx={{ 
                        textDecoration: 'none',
                        color: 'inherit',
                        '&:hover': { color: 'primary.main' }
                      }}
                    >
                      {artwork.title}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {artwork.year} • {artwork.medium}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" noWrap>
                      {artwork.dimensions}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                      <Typography variant="h6" color="primary">
                        ${(Number(artwork.price) || 0).toLocaleString()}
                      </Typography>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => handleAddToCart(artwork)}
                      >
                        Add to Cart
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
            {artworks.length === 0 && (
              <Grid item xs={12}>
                <Typography variant="body1" color="textSecondary" align="center" py={4}>
                  No artworks found for this artist.
                </Typography>
              </Grid>
            )}
          </Grid>
        </>
      )}

      {tabValue === 1 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Biography
          </Typography>
          <Typography variant="body1" paragraph>
            {artist.fullBio || artist.bio}
          </Typography>
          
          <Divider sx={{ my: 3 }} />
          
          {artist.education && artist.education.length > 0 && (
            <>
              <Typography variant="h6" gutterBottom>
                Education & Training
              </Typography>
              <List>
                {artist.education.map((edu, index) => (
                  <ListItem key={index}>
                    <ListItemText
                      primary={edu.institution}
                      secondary={`${edu.degree}, ${edu.year}`}
                    />
                  </ListItem>
                ))}
              </List>
              <Divider sx={{ my: 3 }} />
            </>
          )}
          
          {artist.awards && artist.awards.length > 0 && (
            <>
              <Typography variant="h6" gutterBottom>
                Awards & Recognition
              </Typography>
              <List>
                {artist.awards.map((award, index) => (
                  <ListItem key={index}>
                    <ListItemText primary={award} />
                  </ListItem>
                ))}
              </List>
            </>
          )}
        </Paper>
      )}

      {tabValue === 2 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Exhibitions
          </Typography>
          {artist.exhibitions && artist.exhibitions.length > 0 ? (
            <List>
              {artist.exhibitions.map((exhibition, index) => (
                <ListItem key={index}>
                  <ListItemText
                    primary={exhibition.title}
                    secondary={`${exhibition.gallery}, ${exhibition.year}`}
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography variant="body1" color="textSecondary">
              No exhibition history available.
            </Typography>
          )}
        </Paper>
      )}

      {tabValue === 3 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Contact Information
          </Typography>
          {artist.contact && (
            <List>
              {artist.contact.email && (
                <ListItem>
                  <ListItemAvatar>
                    <Avatar>
                      <Email />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Email"
                    secondary={artist.contact.email}
                  />
                </ListItem>
              )}
              {artist.contact.phone && (
                <ListItem>
                  <ListItemAvatar>
                    <Avatar>
                      <Phone />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Phone"
                    secondary={artist.contact.phone}
                  />
                </ListItem>
              )}
            </List>
          )}
          
          <Typography variant="body2" color="textSecondary" sx={{ mt: 3 }}>
            For inquiries about artwork purchases or commissions, please contact the artist directly.
          </Typography>
        </Paper>
      )}
    </Container>
  );
};

export default ArtistDetail;