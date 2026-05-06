import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

const formatDateTime = (value) => {
  if (!value) return 'Not available';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not available';

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatDateOnly = (value) => {
  if (!value) return 'TBD';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'TBD';
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const normalizeOrder = (rawOrder) => {
  if (!rawOrder) return null;

  let shippingAddress = rawOrder.shipping_address || rawOrder.shippingAddress || null;
  if (typeof shippingAddress === 'string') {
    try {
      shippingAddress = JSON.parse(shippingAddress);
    } catch {
      // Keep original string when address is plain text.
    }
  }

  const items = Array.isArray(rawOrder.items)
    ? rawOrder.items.map((item) => {
        const price = Number(item.price ?? item.price_at_purchase ?? 0);
        const quantity = Number(item.quantity ?? 1);
        return {
          ...item,
          quantity,
          price,
          lineTotal: price * quantity,
        };
      })
    : [];

  const id = rawOrder.id ?? rawOrder.order_id ?? rawOrder.orderId ?? null;

  return {
    ...rawOrder,
    id,
    orderNumber: rawOrder.order_number || rawOrder.orderNumber || (id ? String(id) : null),
    status: String(rawOrder.status || 'completed').toUpperCase(),
    createdAt: rawOrder.created_at || rawOrder.createdAt || rawOrder.order_date || rawOrder.orderDate || null,
    totalAmount: Number(rawOrder.total_amount ?? rawOrder.totalAmount ?? rawOrder.total ?? 0),
    trackingNumber: rawOrder.tracking_number || rawOrder.trackingNumber || null,
    trackingStatus: rawOrder.tracking_status || rawOrder.trackingStatus || null,
    shippingCarrier: rawOrder.shipping_carrier || rawOrder.shippingCarrier || null,
    estimatedDelivery: rawOrder.estimated_delivery || rawOrder.estimatedDelivery || null,
    items,
    shippingAddress,
  };
};

const OrderConfirmationPage = () => {
  const { orderId } = useParams();
  const location = useLocation();
  const { user } = useAuth();
  const [order, setOrder] = useState(location.state?.order || null);
  const [loading, setLoading] = useState(!order);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const buyerId = user?.id || user?.userId || JSON.parse(localStorage.getItem('user') || 'null')?.id;

        if (!buyerId) {
          throw new Error('Missing buyer information');
        }

        const response = await fetch(
          `${API_BASE_URL}/payment/order/${orderId}?buyerId=${buyerId}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch order');
        }

        const data = await response.json();
        setOrder(data.order);
      } catch (err) {
        console.error('Error fetching order:', err);
        setError('Failed to load order details');
      } finally {
        setLoading(false);
      }
    };

    if (!order) {
      fetchOrder();
    }
  }, [orderId, order, user]);

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingSpinner}>Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.errorBox}>{error}</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div style={styles.container}>
        <div style={styles.errorBox}>Order not found</div>
      </div>
    );
  }

  const normalizedOrder = normalizeOrder(order);

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        {/* Success Message */}
        <div style={styles.successBox}>
          <div style={styles.checkmark}>✓</div>
          <h1 style={styles.title}>Order Confirmed!</h1>
          <p style={styles.subtitle}>
            Thank you for your purchase. Your order has been successfully placed.
          </p>
        </div>

        {/* Order Details */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Order Details</h2>
          <div style={styles.detailRow}>
            <span style={styles.label}>Order ID:</span>
            <span style={styles.value}>#{normalizedOrder.id || normalizedOrder.orderNumber || 'N/A'}</span>
          </div>
          <div style={styles.detailRow}>
            <span style={styles.label}>Order Date:</span>
            <span style={styles.value}>{formatDateTime(normalizedOrder.createdAt)}</span>
          </div>
          <div style={styles.detailRow}>
            <span style={styles.label}>Status:</span>
            <span style={{ ...styles.value, color: '#27ae60', fontWeight: '600' }}>
              {normalizedOrder.status}
            </span>
          </div>
        </div>

        {/* Tracking */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Tracking Details</h2>
          <div style={styles.trackingGrid}>
            <div style={styles.trackingCard}>
              <p style={styles.trackingLabel}>Tracking Number</p>
              <p style={styles.trackingValue}>{normalizedOrder.trackingNumber || 'Will be shared soon'}</p>
            </div>
            <div style={styles.trackingCard}>
              <p style={styles.trackingLabel}>Tracking Status</p>
              <p style={styles.trackingValue}>{normalizedOrder.trackingStatus || 'Processing'}</p>
            </div>
            <div style={styles.trackingCard}>
              <p style={styles.trackingLabel}>Shipping Carrier</p>
              <p style={styles.trackingValue}>{normalizedOrder.shippingCarrier || 'ArtHive Logistics'}</p>
            </div>
            <div style={styles.trackingCard}>
              <p style={styles.trackingLabel}>Estimated Delivery</p>
              <p style={styles.trackingValue}>{formatDateOnly(normalizedOrder.estimatedDelivery)}</p>
            </div>
          </div>
        </div>

        {/* Items */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Items Ordered</h2>
          {normalizedOrder.items.length > 0 ? (
            <>
              {normalizedOrder.items.map((item, index) => (
                <div key={index} style={styles.itemBox}>
                  {item.image_url && (
                    <img
                      src={item.image_url}
                      alt={item.title}
                      style={styles.itemImage}
                    />
                  )}
                  <div style={styles.itemDetails}>
                    <h3 style={styles.itemTitle}>{item.title}</h3>
                    <p style={styles.itemArtist}>
                      By {item.artist_first_name} {item.artist_last_name}
                    </p>
                    <p style={styles.itemMeta}>
                      Quantity: {item.quantity} × ${item.price.toFixed(2)}
                    </p>
                  </div>
                  <div style={styles.itemPrice}>
                    ${item.lineTotal.toFixed(2)}
                  </div>
                </div>
              ))}
              <div style={styles.divider}></div>
              <div style={styles.totalRow}>
                <span style={styles.totalLabel}>Total Amount:</span>
                <span style={styles.totalAmount}>
                  ${normalizedOrder.totalAmount.toFixed(2)}
                </span>
              </div>
            </>
          ) : (
            <>
              <p style={styles.emptyText}>No items in this order</p>
              <div style={styles.totalRow}>
                <span style={styles.totalLabel}>Total Amount:</span>
                <span style={styles.totalAmount}>${normalizedOrder.totalAmount.toFixed(2)}</span>
              </div>
            </>
          )}
        </div>

        {/* Shipping Address */}
        {normalizedOrder.shippingAddress && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Shipping Address</h2>
            <div style={styles.addressBox}>
              {typeof normalizedOrder.shippingAddress === 'string' ? (
                <p>{normalizedOrder.shippingAddress}</p>
              ) : (
                <>
                  <p style={styles.addressLine}>{normalizedOrder.shippingAddress.fullName}</p>
                  <p style={styles.addressLine}>{normalizedOrder.shippingAddress.address}</p>
                  <p style={styles.addressLine}>
                    {normalizedOrder.shippingAddress.city}, {normalizedOrder.shippingAddress.state}{' '}
                    {normalizedOrder.shippingAddress.zipCode}
                  </p>
                  <p style={styles.addressLine}>{normalizedOrder.shippingAddress.country}</p>
                </>
              )}
            </div>
          </div>
        )}

        {/* Next Steps */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>What's Next?</h2>
          <ul style={styles.stepsList}>
            <li style={styles.stepItem}>You'll receive an order confirmation email shortly</li>
            <li style={styles.stepItem}>We'll prepare your order and arrange shipping</li>
            <li style={styles.stepItem}>You'll receive tracking information via email</li>
            <li style={styles.stepItem}>Check your account for order updates</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div style={styles.actionsBox}>
          <RouterLink to="/" style={styles.primaryButton}>
            Continue Shopping
          </RouterLink>
          <RouterLink to="/my-orders" style={styles.secondaryButton}>
            View My Orders
          </RouterLink>
        </div>

        {/* Support */}
        <div style={styles.supportBox}>
          <p style={styles.supportText}>
            Have questions? <a href="/contact" style={styles.link}>Contact us</a> or visit
            our <a href="/faq" style={styles.link}>FAQ</a>
          </p>
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
  wrapper: {
    maxWidth: '800px',
    margin: '0 auto',
    backgroundColor: 'white',
    borderRadius: '14px',
    boxShadow: '0 14px 32px rgba(0, 0, 0, 0.08)',
    overflow: 'hidden',
  },
  successBox: {
    backgroundColor: '#f0fdf4',
    padding: '40px 20px',
    textAlign: 'center',
    borderBottom: '2px solid #dcfce7',
  },
  checkmark: {
    fontSize: '60px',
    color: '#27ae60',
    marginBottom: '15px',
  },
  title: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#27ae60',
    margin: '0 0 10px 0',
  },
  subtitle: {
    fontSize: '16px',
    color: '#666',
    margin: '0',
  },
  section: {
    padding: '25px',
    borderBottom: '1px solid #eee',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '15px',
    borderBottom: '2px solid #4f46e5',
    paddingBottom: '10px',
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '10px',
    marginBottom: '10px',
    borderBottom: '1px solid #f0f0f0',
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#666',
  },
  value: {
    fontSize: '14px',
    color: '#333',
  },
  trackingGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '12px',
  },
  trackingCard: {
    background: 'linear-gradient(160deg, #f8fbff, #f4f7ff)',
    border: '1px solid #dbe4ff',
    borderRadius: '10px',
    padding: '12px',
  },
  trackingLabel: {
    margin: '0 0 6px 0',
    fontSize: '12px',
    color: '#5b6478',
    fontWeight: '600',
  },
  trackingValue: {
    margin: 0,
    fontSize: '14px',
    color: '#1f2a44',
    fontWeight: '700',
    wordBreak: 'break-word',
  },
  itemBox: {
    display: 'flex',
    gap: '15px',
    paddingBottom: '15px',
    marginBottom: '15px',
    borderBottom: '1px solid #f0f0f0',
  },
  itemImage: {
    width: '80px',
    height: '80px',
    borderRadius: '4px',
    objectFit: 'cover',
  },
  itemDetails: {
    flex: 1,
  },
  itemTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#333',
    margin: '0 0 5px 0',
  },
  itemArtist: {
    fontSize: '13px',
    color: '#667eea',
    margin: '0 0 5px 0',
  },
  itemMeta: {
    fontSize: '13px',
    color: '#666',
    margin: '0',
  },
  itemPrice: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#667eea',
  },
  emptyText: {
    marginTop: '6px',
    color: '#6b7280',
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
  },
  totalLabel: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#666',
  },
  totalAmount: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#667eea',
  },
  addressBox: {
    backgroundColor: '#f9f9f9',
    padding: '15px',
    borderRadius: '4px',
    border: '1px solid #eee',
  },
  addressLine: {
    fontSize: '14px',
    color: '#555',
    margin: '5px 0',
  },
  stepsList: {
    textAlign: 'left',
    maxWidth: '100%',
    margin: '0',
    paddingLeft: '0',
    listStylePosition: 'inside',
    color: '#555',
    lineHeight: 1.7,
  },
  stepItem: {
    marginBottom: '6px',
    fontSize: '16px',
  },
  actionsBox: {
    padding: '25px',
    display: 'flex',
    gap: '15px',
    justifyContent: 'center',
    flexWrap: 'wrap',
    borderBottom: '1px solid #eee',
  },
  primaryButton: {
    padding: '12px 30px',
    fontSize: '16px',
    fontWeight: '600',
    color: 'white',
    backgroundColor: '#667eea',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
    textDecoration: 'none',
    display: 'inline-block',
  },
  secondaryButton: {
    padding: '12px 30px',
    fontSize: '16px',
    fontWeight: '600',
    color: '#667eea',
    backgroundColor: 'white',
    border: '2px solid #667eea',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'all 0.3s',
    textDecoration: 'none',
    display: 'inline-block',
  },
  supportBox: {
    padding: '25px',
    backgroundColor: '#f9f9f9',
    textAlign: 'center',
  },
  supportText: {
    fontSize: '14px',
    color: '#666',
    margin: '0',
  },
  link: {
    color: '#667eea',
    textDecoration: 'none',
    fontWeight: '600',
  },
  loadingSpinner: {
    textAlign: 'center',
    padding: '40px',
    fontSize: '18px',
    color: '#666',
  },
  errorBox: {
    backgroundColor: '#fee',
    border: '1px solid #fcc',
    borderRadius: '4px',
    color: '#c33',
    padding: '20px',
    textAlign: 'center',
  },
};

export default OrderConfirmationPage;
