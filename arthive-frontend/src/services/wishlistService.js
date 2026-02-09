// src/services/wishlistService.js
import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

export const wishlistService = {
  // Add artwork to wishlist
  addToWishlist: async (artworkId) => {
    try {
      const response = await axios.post(
        `${API_URL}/buyer/wishlist`,
        { artworkId },
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to add to wishlist' };
    }
  },

  // Get user's wishlist
  getWishlist: async () => {
    try {
      const response = await axios.get(
        `${API_URL}/buyer/wishlist`,
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch wishlist' };
    }
  },

  // Remove item from wishlist
  removeFromWishlist: async (wishlistItemId) => {
    try {
      const response = await axios.delete(
        `${API_URL}/buyer/wishlist/${wishlistItemId}`,
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to remove from wishlist' };
    }
  },

  // Check if artwork is in wishlist
  checkInWishlist: async (artworkId) => {
    try {
      const wishlist = await wishlistService.getWishlist();
      return wishlist.items?.some(item => item.artwork_id === parseInt(artworkId)) || false;
    } catch (error) {
      return false;
    }
  },

  // Get wishlist item ID for an artwork
  getWishlistItemId: async (artworkId) => {
    try {
      const wishlist = await wishlistService.getWishlist();
      const item = wishlist.items?.find(item => item.artwork_id === parseInt(artworkId));
      return item?.id || null;
    } catch (error) {
      return null;
    }
  }
};