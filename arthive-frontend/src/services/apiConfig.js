// API Configuration and constants
export const API_CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  TIMEOUT: 10000,
};

// API Endpoints (for reference/type safety)
export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    PROFILE: '/auth/profile',
    REFRESH: '/auth/refresh',
  },
  ARTWORKS: {
    LIST: '/buyer/artworks',
    DETAIL: (id) => `/buyer/artworks/${id}`,
  },
  CART: {
    GET: '/buyer/cart',
    ADD: '/buyer/cart',
    UPDATE: (id) => `/buyer/cart/${id}`,
    DELETE: (id) => `/buyer/cart/${id}`,
    CLEAR: '/buyer/cart/clear',
  },
  WISHLIST: {
    GET: '/buyer/wishlist',
    ADD: '/buyer/wishlist',
    DELETE: (id) => `/buyer/wishlist/${id}`,
    CHECK: (id) => `/buyer/wishlist/check/${id}`,
  },
};