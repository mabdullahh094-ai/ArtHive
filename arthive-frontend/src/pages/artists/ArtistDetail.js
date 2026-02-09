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
    fetchArtistDetails();
    fetchArtistArtworks();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchArtistDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Replace with actual API call
      // const response = await artistAPI.getById(id);
      
      // Mock data
      const mockArtist = {
        id: parseInt(id),
        name: 'Sarah Chen',
        title: 'Abstract Expressionist',
        bio: 'Contemporary artist exploring abstract forms and colors. Sarah\'s work focuses on the intersection of dreams and reality through vibrant color palettes and fluid forms.',
        fullBio: 'Sarah Chen is a contemporary abstract expressionist based in New York City. With over 15 years of experience, her work has been exhibited in galleries worldwide. She holds an MFA from the School of Visual Arts and has been featured in numerous art publications.',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&auto=format&fit=crop',
        coverImage: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=1200&auto=format&fit=crop',
        location: 'New York, USA',
        yearsActive: '15 years',
        artworksCount: 42,
        followers: 1240,
        rating: 4.9,
        socialLinks: {
          website: 'https://sarahchen.art',
          instagram: 'https://instagram.com/sarahchenart',
          facebook: 'https://facebook.com/sarahchenart',
          twitter: 'https://twitter.com/sarahchenart',
        },
        contact: {
          email: 'sarah@chenart.com',
          phone: '+1 (555) 123-4567',
        },
        education: [
          {
            institution: 'School of Visual Arts',
            degree: 'MFA in Painting',
            year: '2010',
          },
          {
            institution: 'Pratt Institute',
            degree: 'BFA in Fine Arts',
            year: '2006',
          },
        ],
        exhibitions: [
          {
            title: 'Abstract Realities',
            gallery: 'Modern Art Gallery NYC',
            year: '2023',
          },
          {
            title: 'Color and Form',
            gallery: 'International Art Fair Miami',
            year: '2022',
          },
        ],
        awards: [
          'Young Artist Award 2022',
          'Contemporary Art Prize 2021',
        ],
        categories: ['Abstract', 'Contemporary', 'Mixed Media'],
      };
      
      setArtist(mockArtist);
    } catch (err) {
      setError('Failed to load artist details');
      console.error('Error fetching artist:', err);
      notification.showError('Failed to load artist details');
    } finally {
      setLoading(false);
    }
  };

  const fetchArtistArtworks = async () => {
    try {
      // Replace with actual API call
      // const response = await artistAPI.getArtworks(id);
      
      // Mock data
      const mockArtworks = [
        {
          id: 1,
          title: 'Abstract Dreams',
          artist: 'Sarah Chen',
          artistId: parseInt(id),
          price: 1200,
          image: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&auto=format&fit=crop',
          category: 'painting',
          medium: 'Oil on canvas',
          year: 2023,
          dimensions: '24" x 36"',
          description: 'A vibrant abstract piece exploring dreams and reality.',
          stock: 5,
          views: 1420,
          likes: 256,
          rating: 4.8,
          tags: ['abstract', 'colorful', 'modern'],
        },
        {
          id: 2,
          title: 'Morning Light',
          artist: 'Sarah Chen',
          artistId: parseInt(id),
          price: 950,
          image: 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=800&auto=format&fit=crop',
          category: 'painting',
          medium: 'Acrylic on wood',
          year: 2023,
          dimensions: '20" x 30"',
          description: 'Soft morning light through abstract forms.',
          stock: 3,
          views: 890,
          likes: 145,
          rating: 4.5,
          tags: ['abstract', 'light', 'soft'],
        },
        {
          id: 3,
          title: 'Urban Echoes',
          artist: 'Sarah Chen',
          artistId: parseInt(id),
          price: 1800,
          image: 'https://images.unsplash.com/photo-1543857778-c4a1a569e388?w=800&auto=format&fit=crop',
          category: 'mixed media',
          medium: 'Acrylic and collage',
          year: 2022,
          dimensions: '36" x 48"',
          description: 'Cityscape abstract with mixed media elements.',
          stock: 2,
          views: 1120,
          likes: 198,
          rating: 4.7,
          tags: ['urban', 'abstract', 'mixed-media'],
        },
        {
          id: 4,
          title: 'Color Burst',
          artist: 'Sarah Chen',
          artistId: parseInt(id),
          price: 750,
          image: 'https://images.unsplash.com/photo-1515405295579-ba7b45403062?w=800&auto=format&fit=crop',
          category: 'painting',
          medium: 'Watercolor and ink',
          year: 2023,
          dimensions: '16" x 20"',
          description: 'Explosion of colors in abstract form.',
          stock: 8,
          views: 760,
          likes: 112,
          rating: 4.4,
          tags: ['colorful', 'abstract', 'watercolor'],
        },
      ];
      
      setArtworks(mockArtworks);
    } catch (err) {
      console.error('Error fetching artworks:', err);
    }
  };

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
      {/* Back Button */}
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate(-1)}
        sx={{ mb: 3 }}
      >
        Back
      </Button>

      {/* Artist Header */}
      <Paper elevation={0} sx={{ mb: 4, borderRadius: 2, overflow: 'hidden' }}>
        {/* Cover Image */}
        <Box
          sx={{
            height: 200,
            backgroundImage: `url(${artist.coverImage})`,
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
                    transition: 'transform 0.2s',
                    '&:hover': { transform: 'translateY(-4px)' }
                  }}
                >
                  <CardMedia
                    component="img"
                    height="200"
                    image={artwork.image}
                    alt={artwork.title}
                    sx={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/artwork/${artwork.id}`)}
                  />
                  <CardContent sx={{ flexGrow: 1 }}>
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
                        ${artwork.price.toLocaleString()}
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