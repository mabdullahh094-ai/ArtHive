import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
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
    // Handle specific error cases
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          // Unauthorized - clear token and redirect to login
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
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
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (userData) => api.put('/auth/profile', userData),
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
  getAll: (params) => api.get('/buyer/artists', { params }),
  getById: (id) => api.get(`/artists/${id}`),
  getArtworks: (artistId) => api.get(`/artists/${artistId}/artworks`),
  getArtistArtworks: () => api.get('/artist/artworks'),
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
};

export const adminAPI = {
  getPendingArtworks: (params) => api.get('/admin/artworks', { params }),
  updateArtworkStatus: (id, status) => api.put(`/admin/artworks/${id}`, { status }),
  getPendingArtists: (params) => api.get('/admin/artists', { params }),
  updateArtistStatus: (id, verification_status) => api.put(`/admin/artists/${id}`, { verification_status }),
  getAllBuyers: (params) => api.get('/admin/buyers', { params }),
  getDashboardStats: () => api.get('/admin/stats'),
};

// Mock data for development (remove when connecting to real API)
export const mockData = {
  artworks: [
    {
      id: 1,
      title: 'Abstract Dreams',
      artist: 'Sarah Chen',
      artistId: 1,
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
    // Add more mock data as needed
  ],
  artists: [
    {
      id: 1,
      name: 'Sarah Chen',
      title: 'Abstract Expressionist',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&auto=format&fit=crop',
      bio: 'Contemporary artist exploring abstract forms and colors.',
      location: 'New York, USA',
      artworksCount: 42,
      followers: 1240,
      rating: 4.9,
      socialLinks: {
        website: 'https://sarahchen.art',
        instagram: '@sarahchenart',
      },
    },
    // Add more mock data as needed
  ],
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