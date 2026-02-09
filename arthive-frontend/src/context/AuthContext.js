import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        
        if (token && userData) {
          setUser(JSON.parse(userData));
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.error('Auth check error:', err);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Login function
  const login = useCallback(async (email, password) => {
    try {
      setError(null);
      setIsLoading(true);
      const { data } = await authAPI.login({ email, password });
      
      console.log('Login response data:', JSON.stringify(data, null, 2));
      
      if (data.token && data.user) {
        // Clear old user's cart/wishlist from localStorage
        localStorage.removeItem('arthive_local_wishlist');
        localStorage.removeItem('arthive_local_cart');
        
        console.log('Setting user in state:', JSON.stringify(data.user, null, 2));
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        setIsAuthenticated(true);
        return { success: true, user: data.user };
      }
      return { success: false, error: 'Invalid login response' };
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Login failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Register function
  const register = useCallback(async (userData) => {
    try {
      setError(null);
      setIsLoading(true);
      const { data } = await authAPI.register(userData);
      
      if (data.token && data.user) {
        // Clear old user's cart/wishlist from localStorage
        localStorage.removeItem('arthive_local_wishlist');
        localStorage.removeItem('arthive_local_cart');
        
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        setIsAuthenticated(true);
        return { success: true, user: data.user };
      }
      return { success: false, error: 'Invalid registration response' };
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Registration failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Logout function
  const logout = useCallback(() => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Clear cart/wishlist when logging out
      localStorage.removeItem('arthive_local_wishlist');
      localStorage.removeItem('arthive_local_cart');
      setUser(null);
      setIsAuthenticated(false);
      setError(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  }, []);

  // Update user profile
  const updateProfile = useCallback(async (updatedUserData) => {
    try {
      setError(null);
      setIsLoading(true);
      const { data } = await authAPI.updateProfile(updatedUserData);
      
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        return { success: true, user: data.user };
      }
      return { success: false, error: 'Invalid update response' };
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Profile update failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value = {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
