const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const db = require('../config/db');
const emailService = require('../services/emailService');

let ordersSchemaEnsured = false;
const generateOrderNumber = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `ORD-${timestamp}-${randomPart}`;
};

const generateTrackingNumber = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `TRK-${timestamp}-${randomPart}`;
};

let orderItemsSchemaEnsured = false;
const ensureOrderItemsSchema = async () => {
  if (orderItemsSchemaEnsured) {
    return;
  }

  await db.query(`
    ALTER TABLE order_items
    ADD COLUMN IF NOT EXISTS artist_id INTEGER
  `);

  await db.query(`
    ALTER TABLE order_items
    ADD COLUMN IF NOT EXISTS price DECIMAL(12, 2)
  `);

  await db.query(`
    ALTER TABLE order_items
    ADD COLUMN IF NOT EXISTS price_at_purchase DECIMAL(12, 2)
  `);

  await db.query(`
    UPDATE order_items oi
    SET artist_id = a.artist_id
    FROM artworks a
    WHERE oi.artist_id IS NULL
      AND oi.artwork_id = a.id
  `);

  await db.query(`
    UPDATE order_items oi
    SET price = a.price
    FROM artworks a
    WHERE oi.price IS NULL
      AND oi.artwork_id = a.id
  `);

  await db.query(`
    UPDATE order_items oi
    SET price_at_purchase = a.price
    FROM artworks a
    WHERE oi.price_at_purchase IS NULL
      AND oi.artwork_id = a.id
  `);

  await db.query(`
    ALTER TABLE order_items
    ALTER COLUMN artist_id SET NOT NULL
  `).catch(() => {});

  await db.query(`
    ALTER TABLE order_items
    ALTER COLUMN price SET NOT NULL
  `).catch(() => {});

  await db.query(`
    ALTER TABLE order_items
    ALTER COLUMN price_at_purchase SET NOT NULL
  `).catch(() => {});

  await db.query(`
    ALTER TABLE order_items
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  `);

  orderItemsSchemaEnsured = true;
};

const ensureOrdersSchema = async () => {
  if (ordersSchemaEnsured) {
    return;
  }

  await db.query(`
    ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS order_number VARCHAR(50)
  `);

  await db.query(`
    UPDATE orders
    SET order_number = COALESCE(order_number, CONCAT('ORD-', TO_CHAR(created_at, 'YYYYMMDD'), '-', id::text))
    WHERE order_number IS NULL
  `);

  await db.query(`
    ALTER TABLE orders
    ALTER COLUMN order_number SET DEFAULT CONCAT('ORD-', TO_CHAR(CURRENT_TIMESTAMP, 'YYYYMMDDHH24MISS'), '-', SUBSTRING(REPLACE(CAST(gen_random_uuid() AS TEXT), '-', ''), 1, 8))
  `).catch(async () => {
    await db.query(`
      ALTER TABLE orders
      ALTER COLUMN order_number SET DEFAULT CONCAT('ORD-', TO_CHAR(CURRENT_TIMESTAMP, 'YYYYMMDDHH24MISS'), '-', SUBSTRING(MD5(RANDOM()::TEXT), 1, 8))
    `);
  });

  await db.query(`
    ALTER TABLE orders
    ALTER COLUMN order_number SET NOT NULL
  `);

  await db.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS orders_order_number_key ON orders(order_number)
  `);

  await db.query(`
    ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS payment_intent_id VARCHAR(255) UNIQUE
  `);

  await db.query(`
    ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS shipping_address JSONB
  `);

  await db.query(`
    ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS billing_address JSONB
  `);

  await db.query(`
    ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(50)
  `);

  await db.query(`
    ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS tracking_status VARCHAR(50) DEFAULT 'processing'
  `);

  await db.query(`
    ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'paid'
  `);

  await db.query(`
    ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS shipping_carrier VARCHAR(100)
  `);

  await db.query(`
    ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS estimated_delivery DATE
  `);

  await db.query(`
    UPDATE orders
    SET tracking_number = COALESCE(tracking_number, CONCAT('TRK-', TO_CHAR(created_at, 'YYYYMMDD'), '-', id::text))
    WHERE tracking_number IS NULL
  `);

  await db.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS orders_tracking_number_key ON orders(tracking_number)
  `);

  await db.query(`
    ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  `);

  await db.query(`
    ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  `);

  ordersSchemaEnsured = true;
};

const paymentController = {
  // Create a payment intent
  createPaymentIntent: async (req, res) => {
    try {
      const { buyerId, amount, cartItems, email } = req.body;

      if (buyerId === undefined || buyerId === null || buyerId === '' || amount === undefined || amount === null || !cartItems || cartItems.length === 0 || !email) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: buyerId, amount, cartItems, email'
        });
      }

      if (Number(amount) <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Cart total must be greater than 0 to create a payment intent'
        });
      }

      await ensureOrdersSchema();
      await ensureOrderItemsSchema();

      // Amount should be in cents
      const amountInCents = Math.round(amount * 100);

      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: 'usd',
        metadata: {
          buyerId: String(buyerId),
          itemCount: String(cartItems.length),
          artworkIds: cartItems.map((item) => String(item.artwork_id || item.artworkId || item.id)).join(',')
        },
        receipt_email: email
      });

      res.json({
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      });
    } catch (error) {
      console.error('Payment Intent Error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // Confirm payment and create order
  confirmPayment: async (req, res) => {
    try {
      const { paymentIntentId, buyerId, cartItems, shippingAddress, billingAddress } = req.body;

      if (!paymentIntentId || !buyerId || !cartItems || cartItems.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields'
        });
      }

      // Retrieve payment intent to verify payment
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      await ensureOrdersSchema();
      await ensureOrderItemsSchema();

      if (paymentIntent.status !== 'succeeded') {
        return res.status(400).json({
          success: false,
          message: 'Payment was not completed successfully',
          paymentStatus: paymentIntent.status
        });
      }

      // Start database transaction
      const client = await db.pool.connect();
      let orderId;
      let orderDate;
      let trackingNumber;
      let buyerInfo;
      const shippingCarrier = 'ArtHive Logistics';
      const estimatedDelivery = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      try {
        await client.query('BEGIN');

        const buyerResult = await client.query(
          'SELECT id, email, first_name, last_name FROM users WHERE id = $1 LIMIT 1',
          [buyerId]
        );

        if (buyerResult.rows.length === 0) {
          throw new Error('Buyer not found');
        }

        buyerInfo = buyerResult.rows[0];

        // Calculate total from cart items
        let totalAmount = 0;
        const itemDetails = [];

        // Get artwork details for each cart item
        for (const item of cartItems) {
          const artworkResult = await client.query(
            'SELECT id, title, price, artist_id FROM artworks WHERE id = $1',
            [item.artwork_id]
          );

          if (artworkResult.rows.length === 0) {
            throw new Error(`Artwork not found: ${item.artwork_id}`);
          }

          const artwork = artworkResult.rows[0];
          const itemTotal = artwork.price * item.quantity;
          totalAmount += itemTotal;

          itemDetails.push({
            artwork_id: artwork.id,
            artist_id: artwork.artist_id,
            quantity: item.quantity,
            price: artwork.price,
            title: artwork.title
          });
        }

        // Create order
        trackingNumber = generateTrackingNumber();
        const orderResult = await client.query(
          `INSERT INTO orders (
             order_number,
             buyer_id,
             total_amount,
             status,
             payment_status,
             payment_intent_id,
             shipping_address,
             billing_address,
             tracking_number,
             tracking_status,
             shipping_carrier,
             estimated_delivery
           )
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
           RETURNING id, created_at`,
          [
            generateOrderNumber(),
            buyerId,
            totalAmount,
            'completed',
              'paid',
            paymentIntentId,
            JSON.stringify(shippingAddress),
            JSON.stringify(billingAddress),
            trackingNumber,
            'processing',
            shippingCarrier,
            estimatedDelivery
          ]
        );

        orderId = orderResult.rows[0].id;
        orderDate = orderResult.rows[0].created_at;

        // Create order items
        for (const item of itemDetails) {
          await client.query(
            `INSERT INTO order_items (order_id, artwork_id, artist_id, quantity, price, price_at_purchase)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [orderId, item.artwork_id, item.artist_id, item.quantity, item.price, item.price]
          );
        }

        // Clear user's cart
        await client.query(
          'DELETE FROM cart WHERE buyer_id = $1',
          [buyerId]
        );

        await client.query('COMMIT');

        const backendBaseUrl = (process.env.BACKEND_URL || 'http://localhost:3001').replace(/\/$/, '');
        const trackingUrl = `${backendBaseUrl}/api/payment/track/${encodeURIComponent(trackingNumber)}`;

        const emailResult = await emailService.sendOrderTrackingEmail({
          email: buyerInfo.email,
          first_name: buyerInfo.first_name,
          last_name: buyerInfo.last_name,
          orderId,
          orderDate,
          trackingNumber,
          shippingCarrier,
          estimatedDelivery,
          trackingUrl
        });

        res.json({
          success: true,
          message: 'Order created successfully',
          orderId: orderId,
          orderDate: orderDate,
          totalAmount: totalAmount,
          itemCount: cartItems.length,
          trackingNumber,
          trackingStatus: 'processing',
          shippingCarrier,
          estimatedDelivery,
          trackingUrl,
          trackingEmailSent: Boolean(emailResult?.success)
        });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Confirm Payment Error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // Get order by ID
  getOrder: async (req, res) => {
    try {
      const { orderId } = req.params;
      const { buyerId } = req.query;

      if (!orderId || !buyerId) {
        return res.status(400).json({
          success: false,
          message: 'Missing orderId or buyerId'
        });
      }

      const orderResult = await db.query(
        `SELECT o.*, u.email, u.first_name, u.last_name
         FROM orders o
         JOIN users u ON o.buyer_id = u.id
         WHERE o.id = $1 AND o.buyer_id = $2`,
        [orderId, buyerId]
      );

      if (orderResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      const order = orderResult.rows[0];

      // Get order items with artwork details
      const itemsResult = await db.query(
        `SELECT oi.*, a.title, a.image_url, u.first_name as artist_first_name, u.last_name as artist_last_name
         FROM order_items oi
         JOIN artworks a ON oi.artwork_id = a.id
         JOIN users u ON a.artist_id = u.id
         WHERE oi.order_id = $1`,
        [orderId]
      );

      order.items = itemsResult.rows;

      res.json({
        success: true,
        order
      });
    } catch (error) {
      console.error('Get Order Error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // Get buyer's orders
  getBuyerOrders: async (req, res) => {
    try {
      const { buyerId } = req.params;
      const { limit = 10, offset = 0 } = req.query;

      const ordersResult = await db.query(
        `SELECT id, total_amount, status, created_at, payment_intent_id, tracking_number, tracking_status, shipping_carrier, estimated_delivery
         FROM orders
         WHERE buyer_id = $1
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        [buyerId, limit, offset]
      );

      const countResult = await db.query(
        'SELECT COUNT(*) FROM orders WHERE buyer_id = $1',
        [buyerId]
      );

      res.json({
        success: true,
        orders: ordersResult.rows,
        totalCount: parseInt(countResult.rows[0].count)
      });
    } catch (error) {
      console.error('Get Buyer Orders Error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // Track order by tracking number
  getOrderTracking: async (req, res) => {
    try {
      const trackingNumber = String(req.params?.trackingNumber || '').trim();

      if (!trackingNumber) {
        return res.status(400).json({
          success: false,
          message: 'Tracking number is required'
        });
      }

      const trackingResult = await db.query(
        `SELECT o.id, o.order_number, o.status, o.tracking_number, o.tracking_status, o.shipping_carrier, o.estimated_delivery, o.created_at,
                u.first_name, u.last_name
         FROM orders o
         JOIN users u ON o.buyer_id = u.id
         WHERE o.tracking_number = $1
         LIMIT 1`,
        [trackingNumber]
      );

      if (trackingResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Tracking number not found'
        });
      }

      const order = trackingResult.rows[0];

      return res.json({
        success: true,
        tracking: {
          orderId: order.id,
          orderNumber: order.order_number,
          buyerName: `${order.first_name || ''} ${order.last_name || ''}`.trim(),
          status: order.status,
          trackingNumber: order.tracking_number,
          trackingStatus: order.tracking_status,
          shippingCarrier: order.shipping_carrier,
          estimatedDelivery: order.estimated_delivery,
          orderDate: order.created_at
        }
      });
    } catch (error) {
      console.error('Track Order Error:', error);
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // Webhook handler for Stripe events
  handleWebhook: async (req, res) => {
    try {
      const { data, type } = req.body;

      // Handle payment intent succeeded
      if (type === 'payment_intent.succeeded') {
        const paymentIntent = data.object;

        // Update order status if needed
        await db.query(
          'UPDATE orders SET status = $1 WHERE payment_intent_id = $2',
          ['confirmed', paymentIntent.id]
        );

        console.log('✅ Payment succeeded:', paymentIntent.id);
      }

      // Handle payment intent failed
      if (type === 'payment_intent.payment_failed') {
        const paymentIntent = data.object;

        // Update order status
        await db.query(
          'UPDATE orders SET status = $1 WHERE payment_intent_id = $2',
          ['failed', paymentIntent.id]
        );

        console.log('❌ Payment failed:', paymentIntent.id);
      }

      res.json({ received: true });
    } catch (error) {
      console.error('Webhook Error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // Get payment details
  getPaymentDetails: async (req, res) => {
    try {
      const { paymentIntentId } = req.params;

      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      res.json({
        success: true,
        payment: {
          id: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount / 100, // Convert from cents
          currency: paymentIntent.currency,
          created: new Date(paymentIntent.created * 1000),
          clientSecret: paymentIntent.client_secret
        }
      });
    } catch (error) {
      console.error('Get Payment Details Error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
};

module.exports = paymentController;
