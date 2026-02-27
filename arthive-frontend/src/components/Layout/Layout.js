import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom';
import {
  Box,
  LinearProgress,
  Container,
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Badge,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
  Stack,
  Grid,
} from '@mui/material';
import { ShoppingCart, Favorite, Search, Menu as MenuIcon, AccountCircle } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

const navLinks = [
  { label: 'Home', to: '/' },
  { label: 'Artworks', to: '/artworks' },
  { label: 'Artists', to: '/artists' },
  { label: 'Wishlist', to: '/wishlist' },
  { label: 'Cart', to: '/cart' },
];

// Header component
const Header = () => {
  const { user, logout } = useAuth();
  const { cartItems } = useCart();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = () => {
    logout();
     setDrawerOpen(false);
     setTimeout(() => {
       navigate('/', { replace: true });
     }, 100);
  };
  return (
    <AppBar
      position="sticky"
      sx={{
        background: isScrolled ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.86)',
        color: 'text.primary',
        backdropFilter: 'blur(14px)',
        transition: 'all 0.25s ease',
        boxShadow: isScrolled ? '0 12px 30px rgba(15,23,42,0.08)' : 'none',
      }}
    >
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ py: { xs: 1, sm: 1.5 }, alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
          <IconButton
            sx={{ display: { xs: 'inline-flex', lg: 'none' }, mr: { xs: 0.25, sm: 0.75 }, p: { xs: 0.8, sm: 1.2 } }}
            onClick={() => setDrawerOpen(true)}
            aria-label="Toggle navigation"
          >
            <MenuIcon />
          </IconButton>

          <Box component={Link} to="/" sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            <Typography variant="h5" fontWeight={800} letterSpacing={0.4} color="text.primary" sx={{ fontSize: { xs: '1.05rem', sm: '1.5rem' } }}>
              Arthive
            </Typography>
          </Box>

          <Box sx={{ display: { xs: 'none', lg: 'flex' }, ml: 4, gap: 1 }}>
            {navLinks.map((link) => (
              <Button
                key={link.to}
                component={Link}
                to={link.to}
                color="inherit"
                sx={{
                  fontWeight: 600,
                  px: 1.6,
                  color: 'text.secondary',
                  '&:hover': { color: 'text.primary', backgroundColor: 'transparent' },
                }}
              >
                {link.label}
              </Button>
            ))}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.25, sm: 1 }, ml: 'auto' }}>
            <IconButton color="inherit" size="large" component={Link} to="/artworks" sx={{ color: 'text.secondary', p: { xs: 0.8, sm: 1.2 } }}>
              <Search />
            </IconButton>

            <IconButton component={Link} to="/wishlist" color="inherit" sx={{ color: 'text.secondary', p: { xs: 0.8, sm: 1.2 } }}>
              <Favorite />
            </IconButton>

            <IconButton component={Link} to="/cart" color="inherit" sx={{ color: 'text.secondary', p: { xs: 0.8, sm: 1.2 } }}>
              <Badge badgeContent={cartItems.length} color="error">
                <ShoppingCart />
              </Badge>
            </IconButton>

            {user && (
              <IconButton component={Link} to="/profile" color="inherit" sx={{ color: 'text.secondary', p: { xs: 0.8, sm: 1.2 }, display: { xs: 'none', sm: 'inline-flex' } }} aria-label="My Account">
                <AccountCircle />
              </IconButton>
            )}

            {user ? (
              <Stack direction="row" spacing={1} alignItems="center" sx={{ display: { xs: 'none', md: 'inline-flex' } }}>
                <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'inline-flex' }, color: 'text.secondary' }}>
                  Hi, {user.first_name || user.name || user.email}
                </Typography>
                {/* My Account text button removed; icon remains in header */}
                <Button size="small" variant="outlined" onClick={handleLogout}>Logout</Button>
              </Stack>
            ) : (
              <Stack direction="row" spacing={1} sx={{ display: { xs: 'none', md: 'inline-flex' } }}>
                <Button size="small" component={Link} to="/login" color="inherit">Log in</Button>
                <Button size="small" variant="contained" component={Link} to="/register">
                  Join Arthive
                </Button>
              </Stack>
            )}
          </Box>
        </Toolbar>
      </Container>

      <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: 280, p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box component={Link} to="/" onClick={() => setDrawerOpen(false)} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <Typography variant="h6" fontWeight={700}>Arthive</Typography>
          </Box>
          <Divider />
          <List>
            {navLinks.map((link) => (
              <ListItem key={link.to} disablePadding>
                <ListItemButton component={Link} to={link.to} onClick={() => setDrawerOpen(false)}>
                  <ListItemText primary={link.label} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          <Box sx={{ mt: 'auto' }}>
            <Divider sx={{ my: 1 }} />
            {user ? (
              <Stack spacing={1}>
                <Button fullWidth component={Link} to="/profile" onClick={() => setDrawerOpen(false)}>
                  My Account
                </Button>
                <Button fullWidth variant="outlined" onClick={handleLogout}>Logout</Button>
              </Stack>
            ) : (
              <Stack spacing={1}>
                <Button fullWidth component={Link} to="/login" onClick={() => setDrawerOpen(false)}>
                  Log in
                </Button>
                <Button fullWidth variant="contained" component={Link} to="/register" onClick={() => setDrawerOpen(false)}>
                  Join Arthive
                </Button>
              </Stack>
            )}
          </Box>
        </Box>
      </Drawer>
    </AppBar>
  );
};

const Footer = () => {
  return (
    <Box component="footer" sx={{ background: 'linear-gradient(135deg, #0f172a 0%, #111827 40%, #1f2937 100%)', color: 'rgba(255,255,255,0.86)', mt: 'auto', pt: 6, pb: 4 }}>
      <Container maxWidth="xl">
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Typography variant="h5" fontWeight={800} gutterBottom>Arthive</Typography>
            <Typography variant="body2" sx={{ opacity: 0.8, maxWidth: 360 }}>
              Discover, collect, and showcase standout artworks from emerging and established artists across the globe.
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>Explore</Typography>
            <Stack spacing={1.2}>
              {[
                { label: 'Home', to: '/' },
                { label: 'Artworks', to: '/artworks' },
                { label: 'Artists', to: '/artists' },
                { label: 'Wishlist', to: '/wishlist' },
              ].map((item) => (
                <Button key={item.to} component={Link} to={item.to} sx={{ color: 'rgba(255,255,255,0.86)', justifyContent: 'flex-start', px: 0 }}>
                  {item.label}
                </Button>
              ))}
            </Stack>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>Stay in touch</Typography>
            <Stack direction="row" spacing={1}>
              <Button variant="contained" component={Link} to="/register" color="secondary">Become an artist</Button>
              <Button variant="outlined" component={Link} to="/login" sx={{ borderColor: 'rgba(255,255,255,0.3)', color: 'white' }}>Login</Button>
            </Stack>
          </Grid>
        </Grid>
        <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.12)' }} />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="body2" sx={{ opacity: 0.75 }}>
            © {new Date().getFullYear()} Arthive. All rights reserved.
          </Typography>
          <Stack direction="row" spacing={2} sx={{ color: 'rgba(255,255,255,0.8)' }}>
            <Button component={Link} to="/privacy" sx={{ color: 'inherit', px: 0 }}>Privacy</Button>
            <Button component={Link} to="/terms" sx={{ color: 'inherit', px: 0 }}>Terms & Conditions</Button>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
};

// Main Layout component
const Layout = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Show loading when route changes
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, [location]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      
      {isLoading && (
        <LinearProgress sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999 }} />
      )}
      
      <Box component="main" sx={{ flexGrow: 1 }}>
        {children || <Outlet />}
      </Box>
      
      <Footer />
    </Box>
  );
};

export default Layout;