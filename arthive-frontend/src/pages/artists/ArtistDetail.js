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
  Stack,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  ArrowBack,
  Share,
  Favorite,
  Facebook,
  Twitter,
  Instagram,
  Language,
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
  const canAddToCart = !!user && ['buyer', 'user'].includes(user?.user_type);

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
        const biographyParts = [artistData.specialization, artistData.bio].filter(
          (value) => value && String(value).trim(),
        );
        const displayArtist = {
          id: artistData.id,
          name: `${artistData.first_name || ''} ${artistData.last_name || ''}`.trim(),
          title: artistData.specialization || '',
          bio: biographyParts.join(' • ') || 'No biography available.',
          fullBio: biographyParts.join(' • ') || 'No biography available.',
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

    notification.showSuccess(`Following ${artist?.name}`);
  };

  const handleAddToCart = (artwork) => {
    if (!user) {
      notification.showError('Please login to add items to cart');
      navigate('/login');
      return;
    }

    if (!canAddToCart) {
      notification.showWarning('Only buyers can add items to cart');
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
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/artists')} sx={{ mt: 2 }}>
          Back to Artists
        </Button>
      </Container>
    );
  }

  return (
    <Container
      maxWidth="xl"
      sx={{
        py: { xs: 2.5, md: 4 },
        background:
          'radial-gradient(circle at 0% 0%, rgba(37,99,235,0.08), transparent 30%), radial-gradient(circle at 100% 15%, rgba(245,158,11,0.08), transparent 28%)',
      }}
    >
      <Paper
        elevation={0}
        sx={{
          mb: 3,
          borderRadius: 2.5,
          overflow: 'hidden',
          border: '1px solid rgba(15,23,42,0.08)',
          boxShadow: '0 10px 20px rgba(15,23,42,0.08)',
          background: '#fff',
        }}
      >
        <Box
          sx={{
            height: { xs: 78, md: 98 },
            backgroundImage: artist.coverImage
              ? `linear-gradient(180deg, rgba(15,23,42,0.08), rgba(15,23,42,0.58)), url(${artist.coverImage})`
              : 'linear-gradient(135deg, #0f172a 0%, #1d4ed8 48%, #f59e0b 100%)',
            backgroundColor: artist.coverImage ? 'transparent' : 'rgba(15,23,42,0.08)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            position: 'relative',
          }}
        />

        <Box sx={{ p: { xs: 1.25, md: 1.8 } }}>
          <Grid container spacing={{ xs: 1.1, md: 1.6 }} alignItems="center">
            <Grid item xs={12} md={2}>
              <Box sx={{ position: 'relative', mt: { xs: -4.1, md: -4.8 }, display: 'flex', justifyContent: { xs: 'center', md: 'center' } }}>
                <Box
                  sx={{
                    p: 0.35,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #2563eb 0%, #f59e0b 100%)',
                    boxShadow: '0 6px 12px rgba(15,23,42,0.12)',
                  }}
                >
                  <Avatar
                    src={artist.avatar}
                    alt={artist.name}
                    sx={{
                      width: { xs: 76, md: 88 },
                      height: { xs: 76, md: 88 },
                      border: '3px solid white',
                      boxShadow: '0 3px 10px rgba(15,23,42,0.12)',
                    }}
                  />
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} md={10}>
              <Box>
                <Typography variant="h3" gutterBottom sx={{ fontWeight: 800, fontSize: { xs: '1.1rem', md: '1.55rem' }, lineHeight: 1.1, mb: 0.2, textAlign: { xs: 'center', md: 'left' } }}>
                  {artist.name}
                </Typography>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={0.65} mt={0.8} flexWrap="wrap" useFlexGap alignItems={{ xs: 'stretch', sm: 'center' }} justifyContent={{ xs: 'center', md: 'flex-start' }}>
                  <Button
                    variant="contained"
                    sx={{ borderRadius: 2, px: 1.35, py: 0.55, fontWeight: 700, boxShadow: 'none', fontSize: '0.62rem' }}
                    startIcon={<Favorite />}
                    onClick={handleFollow}
                  >
                    Follow
                  </Button>
                  <Button
                    variant="outlined"
                    sx={{ borderRadius: 2, px: 1.35, py: 0.55, fontWeight: 700, fontSize: '0.62rem' }}
                    startIcon={<Share />}
                    onClick={handleShare}
                  >
                    Share
                  </Button>

                  {artist.socialLinks && (
                    <Stack direction="row" spacing={0.5} sx={{ ml: { xs: 0, sm: 'auto' } }}>
                      {artist.socialLinks.website && (
                        <IconButton href={artist.socialLinks.website} target="_blank" size="small" sx={{ backgroundColor: alpha('#2563eb', 0.06) }}>
                          <Language />
                        </IconButton>
                      )}
                      {artist.socialLinks.facebook && (
                        <IconButton href={artist.socialLinks.facebook} target="_blank" size="small" sx={{ backgroundColor: alpha('#2563eb', 0.06) }}>
                          <Facebook />
                        </IconButton>
                      )}
                      {artist.socialLinks.twitter && (
                        <IconButton href={artist.socialLinks.twitter} target="_blank" size="small" sx={{ backgroundColor: alpha('#2563eb', 0.06) }}>
                          <Twitter />
                        </IconButton>
                      )}
                      {artist.socialLinks.instagram && (
                        <IconButton href={artist.socialLinks.instagram} target="_blank" size="small" sx={{ backgroundColor: alpha('#2563eb', 0.06) }}>
                          <Instagram />
                        </IconButton>
                      )}
                    </Stack>
                  )}
                </Stack>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      <Box sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTabs-indicator': { height: 3, borderRadius: 2 },
            '& .MuiTab-root': { textTransform: 'none', fontWeight: 700, minHeight: 44 },
          }}
        >
          <Tab label="Artworks" />
          <Tab label="About" />
          <Tab label="Exhibitions" />
          <Tab label="Contact" />
        </Tabs>
      </Box>

      {tabValue === 0 && (
        <>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 800, mb: 2 }}>
            Artworks by {artist.name}
          </Typography>
          <Grid container spacing={{ xs: 1.25, sm: 1.5, md: 2 }}>
            {artworks.map((artwork) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={artwork.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 2.5,
                    border: '1px solid rgba(15,23,42,0.08)',
                    boxShadow: '0 10px 24px rgba(15,23,42,0.08)',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    overflow: 'hidden',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 12px 20px rgba(15,23,42,0.1)',
                    },
                  }}
                >
                  <Box
                    sx={{
                      height: { xs: 160, sm: 175 },
                      backgroundColor: '#f5f5f5',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      position: 'relative',
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
                    <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(15,23,42,0.02), rgba(15,23,42,0.18))' }} />
                  </Box>

                  <CardContent sx={{ flexGrow: 1, minHeight: 150, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', p: 1.15 }}>
                    <Typography
                      component={Link}
                      to={`/artwork/${artwork.id}`}
                      sx={{
                        textDecoration: 'none',
                        color: 'inherit',
                        fontSize: '0.88rem',
                        fontWeight: 700,
                        lineHeight: 1.2,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        minHeight: 34,
                        '&:hover': { color: 'primary.main' },
                      }}
                    >
                      {artwork.title}
                    </Typography>

                    <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.68rem', mt: 0.25 }} noWrap>
                      {artwork.year} • {artwork.medium}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.66rem' }} noWrap>
                      {artwork.dimensions}
                    </Typography>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1.05 }}>
                      <Box>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.62rem' }}>
                          Price
                        </Typography>
                        <Typography variant="h6" sx={{ color: '#f57224', fontWeight: 800, lineHeight: 1.05, fontSize: '0.98rem' }}>
                          ${(Number(artwork.price) || 0).toLocaleString()}
                        </Typography>
                      </Box>

                      <Button
                        size="small"
                        variant="outlined"
                        sx={{ borderRadius: 1.5, fontSize: '0.62rem', fontWeight: 700, minWidth: 88, px: 1, py: 0.45, borderColor: 'rgba(245,114,36,0.55)', color: '#f57224' }}
                        disabled={!canAddToCart}
                        onClick={() => handleAddToCart(artwork)}
                      >
                        {canAddToCart ? 'Add to Cart' : 'Buyers Only'}
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
        <Paper sx={{ p: { xs: 2.2, md: 3 }, borderRadius: 3, border: '1px solid rgba(15,23,42,0.08)' }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 800 }}>
            Biography
          </Typography>
          <Typography variant="body1" paragraph>
            {artist.fullBio || artist.bio}
          </Typography>

          <Divider sx={{ my: 3 }} />

          {artist.education && artist.education.length > 0 && (
            <>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                Education & Training
              </Typography>
              <List>
                {artist.education.map((edu, index) => (
                  <ListItem key={index}>
                    <ListItemText primary={edu.institution} secondary={`${edu.degree}, ${edu.year}`} />
                  </ListItem>
                ))}
              </List>
              <Divider sx={{ my: 3 }} />
            </>
          )}

          {artist.awards && artist.awards.length > 0 && (
            <>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
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
        <Paper sx={{ p: { xs: 2.2, md: 3 }, borderRadius: 3, border: '1px solid rgba(15,23,42,0.08)' }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 800 }}>
            Exhibitions
          </Typography>
          {artist.exhibitions && artist.exhibitions.length > 0 ? (
            <List>
              {artist.exhibitions.map((exhibition, index) => (
                <ListItem key={index}>
                  <ListItemText primary={exhibition.title} secondary={`${exhibition.gallery}, ${exhibition.year}`} />
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
        <Paper sx={{ p: { xs: 2.2, md: 3 }, borderRadius: 3, border: '1px solid rgba(15,23,42,0.08)' }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 800 }}>
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
                  <ListItemText primary="Email" secondary={artist.contact.email} />
                </ListItem>
              )}
              {artist.contact.phone && (
                <ListItem>
                  <ListItemAvatar>
                    <Avatar>
                      <Phone />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText primary="Phone" secondary={artist.contact.phone} />
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
