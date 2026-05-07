import axios from 'axios';

const resolveApiBaseUrl = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  if (typeof window !== 'undefined') {
    const { hostname } = window.location;
    if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return '/api';
    }
  }

  return 'http://localhost:3001/api';
};

const PUBLIC_ROUTE_PATTERNS = [
  /^\/$/,
  /^\/login$/,
  /^\/register$/,
  /^\/forgot-password$/,
  /^\/reset-password$/,
  /^\/artists(?:\/.*)?$/,
  /^\/artworks(?:\/.*)?$/,
  /^\/artwork\/[^/]+$/,
  /^\/privacy$/,
  /^\/terms$/,
];

const isPublicAppRoute = (pathname = '/') => {
  return PUBLIC_ROUTE_PATTERNS.some((pattern) => pattern.test(pathname));
};

const clearStoredAuth = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.dispatchEvent(new Event('arthive:auth-cleared'));
};

// Create axios instance with default config
const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // Some AI/image endpoints can take longer than typical CRUD calls.
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      console.error('Request timeout:', error.config?.url || error.message);
      return Promise.reject(error);
    }

    // Handle specific error cases
    if (error.response) {
      const { status, data } = error.response;
      const currentPath = window.location.pathname;
      
      switch (status) {
        case 400:
          // Bad request - validation or malformed payload
          console.error('Bad request:', data?.message || error.message);
          break;
        case 409:
          // Conflict - commonly duplicate records like email already registered
          console.error('Conflict:', data?.message || error.message);
          break;
        case 401:
          // Unauthorized - clear stale auth, but only force login on protected pages.
          if (localStorage.getItem('token') || localStorage.getItem('user')) {
            clearStoredAuth();
          }

          if (!isPublicAppRoute(currentPath) && currentPath !== '/login') {
            window.location.replace('/login');
          }
          break;
        case 403:
          // Forbidden - show access denied message
          console.error('Access denied:', data.message);
          break;
        case 404:
          // Not found - show not found message
          console.error('Resource not found:', data.message);
          break;
        case 500:
          // Server error
          console.error('Server error:', data.message);
          break;
        default:
          console.error('API Error:', error.message);
      }
    } else if (error.request) {
      // Request was made but no response received
      console.error('No response received:', error.request);
    } else {
      // Something happened in setting up the request
      console.error('Request setup error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// API methods for different endpoints
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/auth/reset-password', { token, password }),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (userData) => {
    const isFormData = typeof FormData !== 'undefined' && userData instanceof FormData;
    return api.put('/auth/profile', userData, isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined);
  },
};

export const artworkAPI = {
  getAll: (params) => api.get('/artworks', { params }),
  getById: (id) => api.get(`/artworks/${id}`),
  create: (artworkData) => api.post('/artworks', artworkData),
  update: (id, artworkData) => api.put(`/artworks/${id}`, artworkData),
  delete: (id) => api.delete(`/artworks/${id}`),
  search: (query) => api.get(`/artworks/search?q=${query}`),
};

export const artistAPI = {
  get: (url, config) => api.get(url, config),
  post: (url, data, config) => api.post(url, data, config),
  put: (url, data, config) => api.put(url, data, config),
  delete: (url, config) => api.delete(url, config),
  getAll: (params) => api.get('/buyer/artists', { params }),
  getById: (id) => api.get(`/buyer/artists/${id}`),
  getArtworks: (artistId, params) => api.get(`/buyer/artists/${artistId}/artworks`, { params }),
  getArtistArtworks: () => api.get('/artist/artworks'),
  updateArtwork: (id, data) => api.put(`/artist/artworks/${id}`, data),
  deleteArtwork: (id) => api.delete(`/artist/artworks/${id}`),
  getOrders: (params) => api.get('/artist/orders', { params }),
  getSoldPaintings: (params) => api.get('/artist/sold-paintings', { params }),
  getDashboardStats: () => api.get('/artist/dashboard'),
  uploadPortfolio: (formData, config = {}) => api.post('/artist/portfolio', formData, { headers: { 'Content-Type': 'multipart/form-data' }, ...config }),
};

export const cartAPI = {
  getCart: () => api.get('/buyer/cart'),
  addToCart: (artworkId, quantity = 1) => api.post('/buyer/cart', { artworkId, quantity }),
  updateCartItem: (itemId, quantity) => api.put(`/buyer/cart/${itemId}`, { quantity }),
  removeFromCart: (itemId) => api.delete(`/buyer/cart/${itemId}`),
  clearCart: () => api.delete('/buyer/cart'),
};

export const wishlistAPI = {
  getWishlist: () => api.get('/buyer/wishlist'),
  addToWishlist: (artworkId) => api.post('/buyer/wishlist', { artworkId }),
  removeFromWishlist: (itemId) => api.delete(`/buyer/wishlist/${itemId}`),
  checkInWishlist: (artworkId) => api.get(`/buyer/wishlist/check/${artworkId}`),
};

export const orderAPI = {
  getAll: () => api.get('/buyer/orders'),
  getById: (id) => api.get(`/buyer/orders/${id}`),
  create: (orderData) => api.post('/buyer/orders', orderData),
  cancel: (id) => api.put(`/buyer/orders/${id}/cancel`),
};

export const buyerAPI = {
  getArtworks: (params) => api.get('/buyer/artworks', { params }),
  getArtworkById: (id) => api.get(`/buyer/artworks/${id}`),
  searchArtworks: (query, params = {}) => api.get('/buyer/artworks', { params: { search: query, ...params } }),
  getCategories: () => api.get('/buyer/categories'),
  getArtists: (params) => api.get('/buyer/artists', { params }),
  getHomeStats: () => api.get('/buyer/stats'),
};

export const adminAPI = {
  getPendingArtworks: (params) => api.get('/admin/artworks', { params }),
  updateArtworkStatus: (id, status) => api.put(`/admin/artworks/${id}`, { status }),
  getPendingArtists: (params) => api.get('/admin/artists', { params }),
  getArtistProfileDetails: (id) => api.get(`/admin/artists/${id}/profile`),
  updateArtistStatus: (id, verification_status) => api.put(`/admin/artists/${id}`, { verification_status }),
  getAllBuyers: (params) => api.get('/admin/buyers', { params }),
  getAllOrders: (params) => api.get('/admin/orders', { params }),
  getDashboardStats: () => api.get('/admin/stats'),
};

// Helper function to check if user is authenticated
export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  return !!(token && user);
};

// Helper function to get current user
export const getCurrentUser = () => {
  try {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
};

export default api;