import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CardElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

const CheckoutPage = () => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const { cartItems: contextCartItems, loading: cartLoading, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();

  const [cartItems, setCartItems] = useState([]);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shippingInfo, setShippingInfo] = useState({
    fullName: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US',
  });
  const [billingInfo, setBillingInfo] = useState({
    fullName: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US',
  });
  const [sameAsBilling, setSameAsBilling] = useState(true);
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    if (Array.isArray(contextCartItems) && contextCartItems.length > 0) {
      setCartItems(contextCartItems);
    }
  }, [contextCartItems]);

  useEffect(() => {
    const total = cartItems.reduce((sum, item) => {
      const price = Number(item.price) || 0;
      const quantity = Number(item.quantity) || 0;
      return sum + price * quantity;
    }, 0);
    setTotalAmount(total);
  }, [cartItems]);

  const handleShippingChange = (e) => {
    const { name, value } = e.target;
    setShippingInfo((prev) => ({ ...prev, [name]: value }));
    if (sameAsBilling) {
      setBillingInfo((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleBillingChange = (e) => {
    const { name, value } = e.target;
    setBillingInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handleSameAsBillingChange = (e) => {
    const isChecked = e.target.checked;
    setSameAsBilling(isChecked);
    if (isChecked) {
      setBillingInfo({ ...shippingInfo });
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      setError('Stripe is not loaded');
      return;
    }

    if (cartLoading) {
      setError('Cart is still loading');
      return;
    }

    if (!cartItems.length) {
      setError('Your cart is empty');
      return;
    }

    if (totalAmount <= 0) {
      setError('Checkout is unavailable because your cart total is $0.00');
      return;
    }

    if (!email || !shippingInfo.fullName || !shippingInfo.address || !shippingInfo.city || !shippingInfo.state || !shippingInfo.zipCode) {
      setError('Please fill in all shipping information');
      return;
    }

    if (!sameAsBilling && (!billingInfo.fullName || !billingInfo.address || !billingInfo.city || !billingInfo.state || !billingInfo.zipCode)) {
      setError('Please fill in all billing information');
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError('Card form is not ready yet');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const buyerId = user?.id || JSON.parse(localStorage.getItem('user') || '{}')?.id;

      if (!isAuthenticated || !buyerId) {
        setError('Please log in again before checkout');
        return;
      }

      const intentResponse = await fetch(`${API_BASE_URL}/payment/create-payment-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyerId: parseInt(buyerId, 10),
          amount: totalAmount,
          cartItems,
          email,
        }),
      });

      if (!intentResponse.ok) {
        const errorData = await intentResponse.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to create payment intent');
      }

      const intentData = await intentResponse.json();
      const { clientSecret, paymentIntentId } = intentData;

      const { paymentIntent, error: stripeError } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: billingInfo.fullName,
            email,
            address: {
              line1: billingInfo.address,
              city: billingInfo.city,
              state: billingInfo.state,
              postal_code: billingInfo.zipCode,
              country: billingInfo.country,
            },
          },
        },
      });

      if (stripeError) {
        setError(stripeError.message);
        return;
      }

      if (paymentIntent.status !== 'succeeded') {
        setError(`Payment not completed: ${paymentIntent.status}`);
        return;
      }

      const confirmResponse = await fetch(`${API_BASE_URL}/payment/confirm-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentIntentId,
          buyerId: parseInt(buyerId, 10),
          cartItems,
          shippingAddress: shippingInfo,
          billingAddress: sameAsBilling ? shippingInfo : billingInfo,
        }),
      });

      if (!confirmResponse.ok) {
        const errorData = await confirmResponse.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to confirm payment');
      }

      const orderData = await confirmResponse.json();
      await clearCart();
      navigate(`/order-confirmation/${orderData.orderId}`, { state: { order: orderData } });
    } catch (err) {
      console.error('Payment error:', err);
      setError(err.message || 'Payment processing failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.pageWrapper}>
        <h1 style={styles.title}>Checkout</h1>

        <div style={styles.contentWrapper}>
          <div style={styles.column}>
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Order Summary</h2>
              {cartItems.length === 0 ? (
                <p>{cartLoading ? 'Loading cart...' : 'Your cart is empty'}</p>
              ) : (
                <>
                  {cartItems.map((item) => (
                    <div key={item.id || item.cartItemId || item.artworkId} style={styles.cartItem}>
                      <div style={styles.itemInfo}>
                        <h3 style={styles.itemTitle}>{item.title}</h3>
                        <p style={styles.itemMeta}>
                          Qty: {item.quantity} × ${Number(item.price || 0).toFixed(2)}
                        </p>
                      </div>
                      <p style={styles.itemPrice}>
                        ${((Number(item.price) || 0) * (Number(item.quantity) || 0)).toFixed(2)}
                      </p>
                    </div>
                  ))}
                  <div style={styles.divider} />
                  <div style={styles.totalRow}>
                    <span style={styles.totalLabel}>Total:</span>
                    <span style={styles.totalAmount}>${totalAmount.toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div style={styles.column}>
            <form onSubmit={handlePayment} style={styles.form}>
              {error && <div style={styles.error}>{error}</div>}

              <div style={styles.section}>
                <h2 style={styles.sectionTitle}>Contact Information</h2>
                <label style={styles.label}>
                  Email Address
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={styles.input}
                    placeholder="your@email.com"
                    required
                  />
                </label>
              </div>

              <div style={styles.section}>
                <h2 style={styles.sectionTitle}>Shipping Information</h2>
                <label style={styles.label}>
                  Full Name
                  <input type="text" name="fullName" value={shippingInfo.fullName} onChange={handleShippingChange} style={styles.input} required />
                </label>
                <label style={styles.label}>
                  Address
                  <input type="text" name="address" value={shippingInfo.address} onChange={handleShippingChange} style={styles.input} required />
                </label>
                <div style={styles.row}>
                  <label style={{ ...styles.label, flex: 1 }}>
                    City
                    <input type="text" name="city" value={shippingInfo.city} onChange={handleShippingChange} style={styles.input} required />
                  </label>
                  <label style={{ ...styles.label, flex: 1 }}>
                    State
                    <input type="text" name="state" value={shippingInfo.state} onChange={handleShippingChange} style={styles.input} required />
                  </label>
                </div>
                <label style={styles.label}>
                  ZIP Code
                  <input type="text" name="zipCode" value={shippingInfo.zipCode} onChange={handleShippingChange} style={styles.input} required />
                </label>
              </div>

              <div style={styles.section}>
                <label style={styles.checkbox}>
                  <input type="checkbox" checked={sameAsBilling} onChange={handleSameAsBillingChange} />
                  Same as shipping address
                </label>

                {!sameAsBilling && (
                  <>
                    <label style={styles.label}>
                      Full Name
                      <input type="text" name="fullName" value={billingInfo.fullName} onChange={handleBillingChange} style={styles.input} required />
                    </label>
                    <label style={styles.label}>
                      Address
                      <input type="text" name="address" value={billingInfo.address} onChange={handleBillingChange} style={styles.input} required />
                    </label>
                    <div style={styles.row}>
                      <label style={{ ...styles.label, flex: 1 }}>
                        City
                        <input type="text" name="city" value={billingInfo.city} onChange={handleBillingChange} style={styles.input} required />
                      </label>
                      <label style={{ ...styles.label, flex: 1 }}>
                        State
                        <input type="text" name="state" value={billingInfo.state} onChange={handleBillingChange} style={styles.input} required />
                      </label>
                    </div>
                    <label style={styles.label}>
                      ZIP Code
                      <input type="text" name="zipCode" value={billingInfo.zipCode} onChange={handleBillingChange} style={styles.input} required />
                    </label>
                  </>
                )}
              </div>

              <div style={styles.section}>
                <h2 style={styles.sectionTitle}>Payment Details</h2>
                <div style={styles.cardElement}>
                  <CardElement
                    options={{
                      style: {
                        base: {
                          fontSize: '16px',
                          color: '#424770',
                          '::placeholder': { color: '#aab7c4' },
                        },
                        invalid: { color: '#fa755a' },
                      },
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !stripe || !cartItems.length}
                style={{
                  ...styles.button,
                  opacity: loading || !stripe || !cartItems.length ? 0.6 : 1,
                  cursor: loading || !stripe || !cartItems.length ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? 'Processing...' : `Pay $${totalAmount.toFixed(2)}`}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    backgroundColor: '#f5f5f5',
    minHeight: '100vh',
    padding: '40px 20px',
  },
  pageWrapper: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  title: {
    fontSize: '32px',
    marginBottom: '30px',
    color: '#333',
    textAlign: 'center',
  },
  contentWrapper: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '30px',
  },
  column: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  section: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '15px',
    color: '#333',
    borderBottom: '2px solid #667eea',
    paddingBottom: '10px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  label: {
    display: 'flex',
    flexDirection: 'column',
    marginBottom: '15px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#555',
  },
  input: {
    marginTop: '8px',
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '15px',
  },
  checkbox: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '14px',
    color: '#555',
    cursor: 'pointer',
  },
  cardElement: {
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    backgroundColor: '#fafafa',
  },
  cartItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: '15px',
    marginBottom: '15px',
    borderBottom: '1px solid #eee',
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#333',
    margin: '0 0 5px 0',
  },
  itemMeta: {
    fontSize: '13px',
    color: '#666',
    margin: 0,
  },
  itemPrice: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#667eea',
    margin: 0,
  },
  divider: {
    height: '1px',
    backgroundColor: '#ddd',
    margin: '15px 0',
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '18px',
    fontWeight: '700',
    color: '#333',
  },
  totalLabel: {
    color: '#666',
  },
  totalAmount: {
    color: '#667eea',
  },
  button: {
    padding: '12px 20px',
    fontSize: '16px',
    fontWeight: '600',
    color: 'white',
    backgroundColor: '#667eea',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginTop: '10px',
  },
  error: {
    padding: '12px',
    backgroundColor: '#fee',
    border: '1px solid #fcc',
    borderRadius: '4px',
    color: '#c33',
    fontSize: '14px',
    marginBottom: '15px',
  },
};

export default CheckoutPage;
