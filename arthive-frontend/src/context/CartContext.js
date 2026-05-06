// src/context/CartContext.js
import React, { createContext, useState, useContext, useEffect, useCallback } from "react";
import { cartAPI, wishlistAPI } from "../services/api";
import { useAuth } from "./AuthContext";

const CartContext = createContext({});

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch cart data
  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) {
      // Don't fetch if user is not authenticated
      setCartItems([]);
      setWishlistItems([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Try to fetch cart from API
      try {
        const response = await cartAPI.getCart();
        
        // Check the actual response structure
        console.log('Cart API response:', response);
        
        // Extract items from different possible response structures
        let items = [];
        if (response.data && response.data.data && Array.isArray(response.data.data.items)) {
          // Structure: { data: { data: { items: [...] } } }
          items = response.data.data.items;
        } else if (response.data && Array.isArray(response.data.items)) {
          // Structure: { data: { items: [...] } }
          items = response.data.items;
        } else if (Array.isArray(response.data)) {
          // Structure: { data: [...] }
          items = response.data;
        } else if (Array.isArray(response.items)) {
          // Structure: { items: [...] }
          items = response.items;
        }
        
        setCartItems(items);
      } catch (cartError) {
        console.log('Cart API failed, using empty cart:', cartError);
        setCartItems([]);
      }

      // Try to fetch wishlist from API
      try {
        const response = await wishlistAPI.getWishlist();
        
        console.log('Wishlist API response:', response);
        
        // Extract items from response
        // Backend returns: { success: true, items: [...] }
        let items = [];
        if (response.data && Array.isArray(response.data.items)) {
          items = response.data.items;
        } else if (response.data && response.data.data && Array.isArray(response.data.data.items)) {
          items = response.data.data.items;
        } else if (Array.isArray(response.data)) {
          items = response.data;
        } else if (Array.isArray(response.items)) {
          items = response.items;
        }
        
        console.log('Extracted wishlist items:', items);
        
        // Normalize server items to UI shape
        const normalizedServer = items.map(i => {
          // Handle both snake_case (from backend) and camelCase (from other sources)
          const artistFirstName = i.artist_first_name || i.artistFirstName || '';
          const artistLastName = i.artist_last_name || i.artistLastName || '';
          const artistName = artistFirstName && artistLastName 
            ? `${artistFirstName} ${artistLastName}`.trim() 
            : i.artist?.name || i.artist || i.artistName || null;
          
          return {
            id: i.id || i.wishlistItemId,
            wishlistItemId: i.id || i.wishlistItemId,
            artworkId: i.artwork_id || i.artworkId,
            title: i.title || i.name || (i.artwork && i.artwork.title) || null,
            artist: artistName,
            artistId: i.artist_id || i.artist?.id || i.artistId || null,
            price: parseFloat(i.price || i.artwork?.price || 0),
            image: i.image_url || i.imageUrl || i.image || i.artwork?.imageUrl || null,
            imageUrl: i.image_url || i.imageUrl || i.image || i.artwork?.imageUrl || null,
            addedDate: i.added_at || i.addedAt || i.addedDate || null,
            category: i.category_name || i.category || null,
            medium: i.medium || null,
            dimensions: i.dimensions || null,
          };
        });

        console.log('Normalized wishlist items:', normalizedServer);

        // Use server data for authenticated users
        setWishlistItems(normalizedServer);
      } catch (wishlistError) {
        console.error('Wishlist API failed:', wishlistError);
        // On API failure, preserve existing state but it will be empty on fresh load
        // The items are still in the database, just couldn't fetch them
        setWishlistItems(prev => (Array.isArray(prev) ? prev : []));
      }
      
    } catch (err) {
      setError("Failed to load cart");
      console.error("Cart fetch error:", err);
      setCartItems([]);
      // Don't clear wishlist on error - items are in database
      // Keep current state instead of clearing
      setWishlistItems(prev => (Array.isArray(prev) ? prev : []));
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Initial fetch on mount (only when authenticated)
  useEffect(() => {
    console.log('CartContext: Auth state changed', { isAuthenticated, userId: user?.id });
    if (isAuthenticated && user?.id) {
      console.log('CartContext: Fetching wishlist for user:', user?.id);
      fetchCart();
    } else {
      console.log('CartContext: Not fetching - not authenticated or no user ID');
    }
  }, [isAuthenticated, user?.id, fetchCart]);

  // Clear cart/wishlist when logging out (runs immediately when isAuthenticated becomes false)
  useEffect(() => {
    if (!isAuthenticated) {
      setCartItems([]);
      setWishlistItems([]);
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Add item to cart (accepts artwork id or artwork object)
  const addToCart = async (artworkOrId, quantity = 1) => {
    if (!isAuthenticated || !["buyer", "user"].includes(user?.user_type)) {
      return {
        success: false,
        error: 'Only buyers can add items to cart',
      };
    }

    const artworkId = typeof artworkOrId === 'object' ? (artworkOrId.id || artworkOrId.artworkId) : artworkOrId;
    const artworkData = typeof artworkOrId === 'object' ? artworkOrId : null;

    // Optimistic UI: add temp cart item so user sees immediate feedback
    const tempId = `temp-cart-${artworkId}-${Date.now()}`;
    const optimisticItem = {
      id: tempId,
      cartItemId: tempId,
      artworkId,
      title: artworkData?.title || null,
      price: artworkData?.price || artworkData?.price || 0,
      imageUrl: artworkData?.image || artworkData?.imageUrl || null,
      quantity,
      addedAt: new Date().toISOString(),
    };

    setCartItems(prev => [optimisticItem, ...(Array.isArray(prev) ? prev : [])]);

    try {
      const response = await cartAPI.addToCart(artworkId, quantity);

      // Check response structure
      const success = response.data?.success || response.success;
      const message = response.data?.message || response.message;

      if (success) {
        // Refresh cart data to get authoritative IDs and quantities
        await fetchCart();
        return { success: true };
      }

      // Backend rejected - revert optimistic update
      setCartItems(prev => (Array.isArray(prev) ? prev.filter(i => i.id !== tempId) : []));
      return { success: false, error: message || 'Failed to add to cart' };
    } catch (err) {
      console.error('Add to cart error:', err);
      // Revert optimistic update on error
      setCartItems(prev => (Array.isArray(prev) ? prev.filter(i => i.id !== tempId) : []));
      return { success: false, error: err.message || 'Network error' };
    }
  };

  // Update cart item quantity
  const updateCartItem = async (cartItemId, quantity) => {
    try {
      const response = await cartAPI.updateCartItem(cartItemId, quantity);
      
      const success = response.data?.success || response.success;
      const message = response.data?.message || response.message;
      
      if (success) {
        await fetchCart();
        return { success: true };
      }
      return { success: false, error: message || 'Failed to update cart' };
    } catch (err) {
      console.error('Update cart item error:', err);
      return { success: false, error: err.message || 'Network error' };
    }
  };

  // Remove item from cart
  const removeFromCart = async (cartItemId) => {
    try {
      const response = await cartAPI.removeFromCart(cartItemId);
      
      const success = response.data?.success || response.success;
      const message = response.data?.message || response.message;
      
      if (success) {
        await fetchCart();
        return { success: true };
      }
      return { success: false, error: message || 'Failed to remove item' };
    } catch (err) {
      console.error('Remove from cart error:', err);
      return { success: false, error: err.message || 'Network error' };
    }
  };

  // Clear cart
  const clearCart = async () => {
    try {
      const response = await cartAPI.clearCart();
      
      const success = response.data?.success || response.success;
      const message = response.data?.message || response.message;
      
      if (success) {
        setCartItems([]);
        return { success: true };
      }
      return { success: false, error: message || 'Failed to clear cart' };
    } catch (err) {
      console.error('Clear cart error:', err);
      return { success: false, error: err.message || 'Network error' };
    }
  };


  // Add to wishlist (accepts either artworkId number or artwork object)
  const addToWishlist = async (artworkOrId) => {
    console.log('addToWishlist called with:', artworkOrId);
    const artworkId = typeof artworkOrId === 'object' ? artworkOrId.id || artworkOrId.artworkId : artworkOrId;
    const artworkData = typeof artworkOrId === 'object' ? artworkOrId : null;

    console.log('Adding artwork to wishlist:', { artworkId, artworkData, userId: user?.id });

    // Optimistic UI: add a temporary wishlist item so the user sees immediate feedback
    const tempId = `temp-${artworkId}-${Date.now()}`;
    const optimisticItem = {
      id: tempId,
      wishlistItemId: tempId,
      artworkId,
      title: artworkData?.title || null,
      price: artworkData?.price || null,
      imageUrl: artworkData?.image || artworkData?.imageUrl || artworkData?.image_url || null,
      image: artworkData?.image || artworkData?.imageUrl || artworkData?.image_url || null,
      artist: artworkData?.artist || artworkData?.artistName || null,
      category: artworkData?.category || artworkData?.category_name || null,
      medium: artworkData?.medium || null,
      dimensions: artworkData?.dimensions || null,
      addedAt: new Date().toISOString(),
    };

    setWishlistItems(prev => [optimisticItem, ...(Array.isArray(prev) ? prev : [])]);
    console.log('Optimistic item added to state');

    try {
      console.log('Calling API to add to wishlist...');
      const response = await wishlistAPI.addToWishlist(artworkId);
      console.log('API response:', response);
      const backendResponse = response.data;
      const success = backendResponse?.success;
      const message = (backendResponse?.message || '').toLowerCase();

      // Success path
      if (success) {
        console.log('Successfully added to wishlist, fetching updated list...');
        try {
          await fetchCart();
          console.log('Wishlist refreshed from server');
        } catch (e) {
          console.log('Wishlist add: fetchCart failed, keeping item in state', e);
        }
        return { success: true };
      }

      // Treat "already in wishlist" as success: keep optimistic, refresh from server
      if (message.includes('already')) {
        console.log('Item already in wishlist');
        try {
          await fetchCart();
        } catch (e) {
          console.log('Wishlist add already: fetchCart failed, keeping optimistic item', e);
        }
        return { success: true, already: true };
      }

      // Backend rejected for other reasons - revert optimistic update
      console.error('Backend rejected:', backendResponse?.message);
      setWishlistItems(prev => (Array.isArray(prev) ? prev.filter(i => i.id !== tempId) : []));
      return { success: false, error: backendResponse?.message || 'Failed to add to wishlist' };
    } catch (err) {
      console.error('Add to wishlist error:', err);
      console.error('Error response:', err.response);
      
      // Check for "already in wishlist" errors
      const status = err?.response?.status;
      const remoteMsg = err?.response?.data?.message?.toLowerCase() || '';
      if (status === 400 && remoteMsg.includes('already')) {
        console.log('Item already in wishlist (error path)');
        try {
          await fetchCart();
        } catch (e) {
          console.log('Wishlist add already (error path): fetchCart failed, keeping optimistic item', e);
        }
        return { success: true, already: true };
      }

      // For other errors, revert optimistic update
      setWishlistItems(prev => (Array.isArray(prev) ? prev.filter(i => i.id !== tempId) : []));
      return { success: false, error: err.message || 'Network error' };
    }
  };


  // Remove from wishlist
  // Accepts either a wishlist item id or an artworkId; if artworkId is provided, find the wishlist item id
  const removeFromWishlist = async (idOrArtworkId) => {
    // Optimistically remove from state first
    const itemToRemove = (wishlistItems || []).find(i => 
      i.artworkId === idOrArtworkId || i.id === idOrArtworkId || i.wishlistItemId === idOrArtworkId
    );
    
    if (itemToRemove) {
      setWishlistItems(prev => (Array.isArray(prev) ? prev.filter(i => i.id !== itemToRemove.id) : []));
    }

    try {
      let itemId = idOrArtworkId;

      // If passed an artworkId (number), resolve to wishlist item id
      if (typeof idOrArtworkId === 'number' && itemToRemove) {
        itemId = itemToRemove.wishlistItemId || itemToRemove.id;
      }

      if (!itemId) {
        return { success: false, error: 'Wishlist item id not found' };
      }

      // Don't process temp items here - they don't exist in database
      if (typeof itemId === 'string' && itemId.startsWith('temp-')) {
        return { success: true };
      }

      // Call API to delete from database
      const response = await wishlistAPI.removeFromWishlist(itemId);
      const success = response.data?.success || response.success;
      const message = response.data?.message || response.message;

      if (success) {
        return { success: true };
      }

      // If API fails, restore the item to state since it's still in database
      if (itemToRemove) {
        setWishlistItems(prev => [itemToRemove, ...(Array.isArray(prev) ? prev : [])]);
      }
      return { success: false, error: message || 'Failed to remove from wishlist' };
    } catch (err) {
      console.error('Remove from wishlist error:', err);
      // If API call fails, restore the item since it's still in database
      if (itemToRemove) {
        setWishlistItems(prev => [itemToRemove, ...(Array.isArray(prev) ? prev : [])]);
      }
      return { success: false, error: err.message || 'Network error' };
    }
  };

  // Calculate cart total - SAFE VERSION
  const cartTotal = Array.isArray(cartItems) ? cartItems.reduce((total, item) => {
    const price = item.price || item.artwork?.price || item.data?.price || 0;
    const quantity = item.quantity || 1;
    return total + (parseFloat(price) * quantity);
  }, 0) : 0;

  // Count items in cart - SAFE VERSION
  const cartCount = Array.isArray(cartItems) ? cartItems.reduce((count, item) => {
    return count + (item.quantity || 1);
  }, 0) : 0;

  // Count items in wishlist - SAFE VERSION
  const wishlistCount = Array.isArray(wishlistItems) ? wishlistItems.length : 0;

  return (
    <CartContext.Provider
      value={{
        cartItems: Array.isArray(cartItems) ? cartItems : [],
        wishlistItems: Array.isArray(wishlistItems) ? wishlistItems : [],
        loading,
        error,
        fetchCart,
        addToCart,
        updateCartItem,
        updateQuantity: updateCartItem,
        getCartTotal: () => cartTotal,
        removeFromCart,
        clearCart,
        addToWishlist,
        removeFromWishlist,
        cartTotal,
        cartCount,
        wishlistCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};