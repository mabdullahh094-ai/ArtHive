// Frontend payment service for ArtHive

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

export const paymentService = {
  /**
   * Create a payment intent for Stripe
   */
  createPaymentIntent: async (buyerId, amount, cartItems, email) => {
    try {
      const response = await fetch(`${API_BASE_URL}/payment/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          buyerId,
          amount,
          cartItems,
          email
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create payment intent');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw error;
    }
  },

  /**
   * Confirm payment and create order
   */
  confirmPayment: async (paymentIntentId, buyerId, cartItems, shippingAddress, billingAddress) => {
    try {
      const response = await fetch(`${API_BASE_URL}/payment/confirm-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          paymentIntentId,
          buyerId,
          cartItems,
          shippingAddress,
          billingAddress
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to confirm payment');
      }

      return await response.json();
    } catch (error) {
      console.error('Error confirming payment:', error);
      throw error;
    }
  },

  /**
   * Get order details
   */
  getOrder: async (orderId, buyerId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/payment/order/${orderId}?buyerId=${buyerId}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch order');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching order:', error);
      throw error;
    }
  },

  /**
   * Get all orders for a buyer
   */
  getBuyerOrders: async (buyerId, limit = 10, offset = 0) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/payment/orders/buyer/${buyerId}?limit=${limit}&offset=${offset}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  },

  /**
   * Get payment details
   */
  getPaymentDetails: async (paymentIntentId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/payment/payment/${paymentIntentId}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch payment details');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching payment details:', error);
      throw error;
    }
  },

  /**
   * Format currency
   */
  formatCurrency: (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  },

  /**
   * Validate email
   */
  validateEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Validate address
   */
  validateAddress: (address) => {
    return (
      address.fullName &&
      address.address &&
      address.city &&
      address.state &&
      address.zipCode &&
      address.country
    );
  }
};

export default paymentService;
