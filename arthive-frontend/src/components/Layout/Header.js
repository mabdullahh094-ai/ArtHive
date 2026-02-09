import React, { useEffect, useRef, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Avatar,
  Container,
  InputBase,
  alpha,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useMediaQuery,
  useTheme,
  Tooltip,
  Paper,
  Popper,
  Grow,
  styled,
} from '@mui/material';
import {
  ShoppingCart,
  Favorite,
  AccountCircle,
  Search,
  Menu as MenuIcon,
  Category,
  Palette,
  Brush,
  CameraAlt,
  ExitToApp,
  Person,
  Dashboard,
  Store,
  ArrowDropDown,
  Home,
  Help,
  DarkMode,
  LightMode,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { buyerAPI } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';

// Search bar styled component
const SearchBar = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(3),
    width: 'auto',
  },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('md')]: {
      width: '20ch',
      '&:focus': {
        width: '30ch',
      },
    },
  },
}));

const Header = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Context
  const { user, isAuthenticated, logout } = useAuth();
  const { cartCount, wishlistCount, fetchCart } = useCart();
  const { showSuccess } = useNotification();
  
  // State
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState([]);
  const [categoriesAnchorEl, setCategoriesAnchorEl] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const searchAnchorRef = useRef(null);
  
  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
    
    // Fetch cart on mount if authenticated
    if (isAuthenticated) {
      fetchCart();
    }
  }, [isAuthenticated, fetchCart]);
  
  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const fetchCategories = async () => {
    try {
      const response = await buyerAPI.getCategories();
      
      // Handle the API response - it returns {success: true, data: [...], count: X, message: "..."}
      // So we need to extract the data array from the response
      let categoriesArray = [];
      
      if (Array.isArray(response)) {
        // If response is already an array (unlikely with current API)
        categoriesArray = response;
      } else if (response && response.data && Array.isArray(response.data)) {
        // Response has data property with array (most common case)
        categoriesArray = response.data;
      } else if (response && response.success && Array.isArray(response.data)) {
        // Response with success wrapper
        categoriesArray = response.data;
      } else {
        // Fallback or unexpected format
        console.warn('Unexpected categories response format:', response);
        categoriesArray = [];
      }
      
      // Now slice safely
      const slicedCategories = categoriesArray.slice(0, 6); // Limit to 6 categories for header
      setCategories(slicedCategories);
      
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      // Set empty array as fallback
      setCategories([]);
    }
  };
  
  // Search suggestions
  const handleSearchChange = async (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    if (value.length > 2) {
      try {
        const response = await buyerAPI.searchArtworks(value, { limit: 5 });
        const payload = response?.data?.artworks || response?.data?.data || response?.data?.items || [];
        const suggestions = Array.isArray(payload) ? payload : [];
        setSearchSuggestions(suggestions);
      } catch (error) {
        console.error('Search error:', error);
        setSearchSuggestions([]);
      }
    } else {
      setSearchSuggestions([]);
    }
  };
  
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/artworks?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setSearchSuggestions([]);
      setSearchOpen(false);
    }
  };
  
  // Menu handlers
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleCategoriesOpen = (event) => {
    setCategoriesAnchorEl(event.currentTarget);
  };
  
  const handleCategoriesClose = () => {
    setCategoriesAnchorEl(null);
  };
  
  const handleLogout = async () => {
    logout();
    handleMenuClose();
    showSuccess('Logged out successfully');
    // Add a small delay to ensure state updates are processed before navigation
    setTimeout(() => {
      navigate('/', { replace: true });
    }, 100);
  };
  
  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };
  
  const handleSearchToggle = () => {
    setSearchOpen(!searchOpen);
    if (searchOpen) {
      setSearchQuery('');
      setSearchSuggestions([]);
    }
  };
  
  const handleThemeToggle = () => {
    setDarkMode(!darkMode);
    // In a real app, you would save this preference and apply the theme
  };
  
  // Navigation items
  const navItems = [
    { label: 'Home', path: '/', icon: <Home /> },
    { label: 'Gallery', path: '/artworks', icon: <Palette /> },
    { label: 'Artists', path: '/artists', icon: <Brush /> },
    { label: 'Categories', path: null, icon: <Category />, hasMenu: true },
    { label: 'About', path: '/about', icon: <Help /> },
  ];
  
  // User menu items
  const userMenuItems = user?.user_type === 'admin'
    ? [
        { label: 'Admin Dashboard', path: '/admin', icon: <Dashboard /> },
        { label: 'Logout', action: handleLogout, icon: <ExitToApp /> },
      ]
    : [
        { label: 'Profile', path: '/profile', icon: <Person /> },
        { label: 'Dashboard', path: user?.user_type === 'artist' ? '/artist/dashboard' : '/dashboard', icon: <Dashboard /> },
        { label: 'My Orders', path: '/orders', icon: <Store /> },
        { label: 'Logout', action: handleLogout, icon: <ExitToApp /> },
      ];
  
  // Mobile drawer
  const mobileDrawer = (
    <Drawer
      anchor="left"
      open={mobileMenuOpen}
      onClose={handleMobileMenuToggle}
      sx={{
        '& .MuiDrawer-paper': {
          width: 280,
          backgroundColor: theme.palette.background.paper,
        },
      }}
    >
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" component={RouterLink} to="/" sx={{ textDecoration: 'none', color: 'inherit' }}>
          🎨 ArtHive
        </Typography>
        <IconButton onClick={handleMobileMenuToggle}>
          <MenuIcon />
        </IconButton>
      </Box>
      
      <Divider />
      
      {/* Search in mobile drawer */}
      <Box sx={{ p: 2 }}>
        <form onSubmit={handleSearchSubmit}>
          <SearchBar>
            <SearchIconWrapper>
              <Search />
            </SearchIconWrapper>
            <StyledInputBase
              placeholder="Search artworks..."
              value={searchQuery}
              onChange={handleSearchChange}
              fullWidth
            />
          </SearchBar>
        </form>
      </Box>
      
      <Divider />
      
      {/* Navigation items */}
      <List>
        {navItems.map((item) => (
          <ListItem
            button
            key={item.label}
            component={item.path ? RouterLink : 'div'}
            to={item.path}
            onClick={() => {
              if (item.hasMenu) {
                handleCategoriesOpen({ currentTarget: document.getElementById('categories-mobile') });
              } else {
                handleMobileMenuToggle();
              }
            }}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItem>
        ))}
      </List>
      
      <Divider />
      
      {/* Categories in mobile menu */}
      <List>
        {categories.map((category) => (
          <ListItem
            button
            key={category.id}
            component={RouterLink}
            to={`/artworks?category=${category.slug || category.name.toLowerCase()}`}
            onClick={handleMobileMenuToggle}
          >
            <ListItemIcon>
              {category.icon === '🎨' && <Palette />}
              {category.icon === '📸' && <CameraAlt />}
              {category.icon === '💻' && <Brush />}
              {!['🎨', '📸', '💻'].includes(category.icon) && <Category />}
            </ListItemIcon>
            <ListItemText primary={category.name} />
          </ListItem>
        ))}
      </List>
      
      <Divider />
      
      {/* User section */}
      {isAuthenticated ? (
        <>
          <List>
            {userMenuItems.map((item) => (
              <ListItem
                button
                key={item.label}
                component={item.path ? RouterLink : 'div'}
                to={item.path}
                onClick={() => {
                  if (item.action) item.action();
                  handleMobileMenuToggle();
                }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItem>
            ))}
          </List>
          <Divider />
        </>
      ) : null}
      
      {/* Theme toggle */}
      <Box sx={{ p: 2 }}>
        <Button
          fullWidth
          variant="outlined"
          startIcon={darkMode ? <LightMode /> : <DarkMode />}
          onClick={handleThemeToggle}
        >
          {darkMode ? 'Light Mode' : 'Dark Mode'}
        </Button>
      </Box>
    </Drawer>
  );
  
  // Desktop view
  const desktopView = (
    <Container maxWidth="xl">
      <Toolbar disableGutters sx={{ py: 1 }}>
        {/* Logo */}
        <Typography
          variant="h5"
          component={RouterLink}
          to="/"
          sx={{
            mr: 4,
            fontWeight: 'bold',
            textDecoration: 'none',
            color: 'inherit',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            '&:hover': {
              opacity: 0.9,
            },
          }}
        >
          <Box component="span" sx={{ fontSize: '1.8rem' }}>🎨</Box>
          ArtHive
        </Typography>
        
        {/* Desktop Navigation */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1 }}>
          {navItems.map((item) => (
            item.hasMenu ? (
              <React.Fragment key={item.label}>
                <Button
                  color="inherit"
                  endIcon={<ArrowDropDown />}
                  onClick={handleCategoriesOpen}
                  sx={{
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.common.white, 0.1),
                    },
                  }}
                >
                  {item.label}
                </Button>
                
                {/* Categories Menu */}
                <Menu
                  anchorEl={categoriesAnchorEl}
                  open={Boolean(categoriesAnchorEl)}
                  onClose={handleCategoriesClose}
                  TransitionComponent={Grow}
                  sx={{
                    '& .MuiPaper-root': {
                      minWidth: 200,
                      maxHeight: 400,
                    },
                  }}
                >
                  {categories.map((category) => (
                    <MenuItem
                      key={category.id}
                      component={RouterLink}
                      to={`/artworks?category=${category.slug || category.name.toLowerCase()}`}
                      onClick={handleCategoriesClose}
                    >
                      <ListItemIcon>
                        {category.icon === '🎨' && <Palette />}
                        {category.icon === '📸' && <CameraAlt />}
                        {category.icon === '💻' && <Brush />}
                        {!['🎨', '📸', '💻'].includes(category.icon) && <Category />}
                      </ListItemIcon>
                      <ListItemText primary={category.name} />
                    </MenuItem>
                  ))}
                  <Divider />
                  <MenuItem component={RouterLink} to="/categories" onClick={handleCategoriesClose}>
                    View All Categories
                  </MenuItem>
                </Menu>
              </React.Fragment>
            ) : (
              <Button
                key={item.label}
                color="inherit"
                component={RouterLink}
                to={item.path}
                sx={{
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.common.white, 0.1),
                  },
                }}
              >
                {item.label}
              </Button>
            )
          ))}
          {isAuthenticated && (
            <Button
              color="inherit"
              component={RouterLink}
              to="/profile"
              sx={{
                '&:hover': {
                  backgroundColor: alpha(theme.palette.common.white, 0.1),
                },
              }}
            >
              My Account
            </Button>
          )}
        </Box>
        
        {/* Spacer */}
        <Box sx={{ flexGrow: 1 }} />
        
        {/* Search Bar */}
        <Box ref={searchAnchorRef} sx={{ display: { xs: 'none', md: 'flex' }, mr: 2 }}>
          <SearchBar>
            <SearchIconWrapper>
              <Search />
            </SearchIconWrapper>
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex' }}>
              <StyledInputBase
                placeholder="Search artworks, artists..."
                value={searchQuery}
                onChange={handleSearchChange}
                inputProps={{ 'aria-label': 'search' }}
              />
            </form>
          </SearchBar>
          
          {/* Search Suggestions */}
          {searchAnchorRef.current && searchSuggestions.length > 0 && (
            <Popper
              open={searchSuggestions.length > 0}
              anchorEl={searchAnchorRef.current}
              placement="bottom-start"
              style={{ zIndex: 1300 }}
              transition
            >
              {({ TransitionProps }) => (
                <Grow {...TransitionProps}>
                  <Paper sx={{ width: 320, maxHeight: 400, overflow: 'auto', mt: 1 }}>
                    <List>
                      {searchSuggestions.map((artwork) => (
                        <MenuItem
                          key={artwork.id}
                          component={RouterLink}
                          to={`/artwork/${artwork.id}`}
                          onClick={() => {
                            setSearchQuery('');
                            setSearchSuggestions([]);
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar
                              src={artwork.image_url || artwork.thumbnail}
                              sx={{ width: 40, height: 40 }}
                            >
                              <Palette />
                            </Avatar>
                            <Box>
                              <Typography variant="body2">{artwork.title || 'Untitled'}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                By {artwork.artist?.name || artwork.artist_first_name || 'Unknown Artist'}
                              </Typography>
                            </Box>
                          </Box>
                        </MenuItem>
                      ))}
                    </List>
                  </Paper>
                </Grow>
              )}
            </Popper>
          )}
        </Box>
        
        {/* Action Buttons */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {/* Theme Toggle */}
          <Tooltip title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}>
            <IconButton color="inherit" onClick={handleThemeToggle} size="small">
              {darkMode ? <LightMode /> : <DarkMode />}
            </IconButton>
          </Tooltip>
          
          {/* Wishlist */}
          <Tooltip title="Wishlist">
            <IconButton
              color="inherit"
              component={RouterLink}
              to="/wishlist"
              size="small"
              aria-label={`Wishlist with ${wishlistCount} items`}
            >
              <Badge badgeContent={wishlistCount} color="error" max={99}>
                <Favorite />
              </Badge>
            </IconButton>
          </Tooltip>
          
          {/* Cart */}
          <Tooltip title="Shopping Cart">
            <IconButton
              color="inherit"
              component={RouterLink}
              to="/cart"
              size="small"
              aria-label={`Cart with ${cartCount} items`}
            >
              <Badge badgeContent={cartCount} color="error" max={99}>
                <ShoppingCart />
              </Badge>
            </IconButton>
          </Tooltip>
          
          {/* My Account quick link */}
          {isAuthenticated && (
            <Button
              color="inherit"
              component={RouterLink}
              to="/profile"
              size="small"
              sx={{
                textTransform: 'none',
                ml: 1,
                '&:hover': { backgroundColor: alpha(theme.palette.common.white, 0.1) },
              }}
              startIcon={<AccountCircle />}
            >
              My Account
            </Button>
          )}

          {/* User Menu */}
          {isAuthenticated ? (
            <>
              <IconButton
                onClick={handleMenuOpen}
                size="small"
                sx={{
                  ml: 1,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.common.white, 0.1),
                  },
                }}
                aria-label="User menu"
              >
                <Avatar
                  src={user?.avatar || user?.profile_pic_url}
                  sx={{ width: 32, height: 32 }}
                >
                  {user?.name?.charAt(0) || user?.first_name?.charAt(0) || <AccountCircle />}
                </Avatar>
              </IconButton>
              
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                sx={{
                  '& .MuiPaper-root': {
                    minWidth: 200,
                    mt: 1.5,
                  },
                }}
              >
                <Box sx={{ px: 2, py: 1 }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {user?.name || `${user?.first_name} ${user?.last_name}`}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {user?.email}
                  </Typography>
                </Box>
                <Divider />
                {userMenuItems.map((item) => (
                  <MenuItem
                    key={item.label}
                    component={item.path ? RouterLink : 'div'}
                    to={item.path}
                    onClick={() => {
                      if (item.action) item.action();
                      handleMenuClose();
                    }}
                  >
                    <ListItemIcon>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.label} />
                  </MenuItem>
                ))}
              </Menu>
            </>
          ) : (
            <Button
              color="inherit"
              component={RouterLink}
              to="/login"
              startIcon={<AccountCircle />}
              sx={{
                ml: 1,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.common.white, 0.1),
                },
              }}
            >
              Login
            </Button>
          )}
          
          {/* Mobile Menu Button */}
          <IconButton
            color="inherit"
            onClick={handleMobileMenuToggle}
            sx={{ display: { xs: 'flex', md: 'none' }, ml: 1 }}
            aria-label="Open menu"
          >
            <MenuIcon />
          </IconButton>
        </Box>
      </Toolbar>
    </Container>
  );
  
  // Mobile search view
  const mobileSearchView = (
    <Toolbar>
      <form onSubmit={handleSearchSubmit} style={{ flexGrow: 1 }}>
        <SearchBar>
          <IconButton
            onClick={handleSearchToggle}
            sx={{ color: 'inherit', mr: 1 }}
            aria-label="Close search"
          >
            <ArrowDropDown />
          </IconButton>
          <StyledInputBase
            placeholder="Search..."
            value={searchQuery}
            onChange={handleSearchChange}
            fullWidth
            autoFocus
          />
          <IconButton type="submit" sx={{ color: 'inherit' }} aria-label="Search">
            <Search />
          </IconButton>
        </SearchBar>
      </form>
    </Toolbar>
  );
  
  return (
    <>
      <AppBar
        position="fixed"
        elevation={scrolled ? 4 : 0}
        sx={{
          backgroundColor: scrolled
            ? alpha(theme.palette.primary.main, 0.95)
            : theme.palette.primary.main,
          backdropFilter: scrolled ? 'blur(10px)' : 'none',
          transition: 'all 0.3s ease',
          zIndex: theme.zIndex.drawer + 1,
        }}
      >
        {searchOpen && isMobile ? mobileSearchView : desktopView}
      </AppBar>
      
      {/* Spacer for fixed AppBar */}
      <Toolbar />
      
      {/* Mobile Drawer */}
      {mobileDrawer}
      
      {/* Mobile Search Button */}
      {isMobile && !searchOpen && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            zIndex: theme.zIndex.speedDial,
          }}
        >
          <Tooltip title="Search">
            <IconButton
              onClick={handleSearchToggle}
              sx={{
                backgroundColor: theme.palette.primary.main,
                color: 'white',
                width: 56,
                height: 56,
                '&:hover': {
                  backgroundColor: theme.palette.primary.dark,
                },
                boxShadow: 3,
              }}
              aria-label="Open search"
            >
              <Search />
            </IconButton>
          </Tooltip>
        </Box>
      )}
    </>
  );
};

export default Header;