const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');

// Create payment intent
router.post('/create-payment-intent', paymentController.createPaymentIntent);

// Confirm payment and create order
router.post('/confirm-payment', paymentController.confirmPayment);

// Get order by ID
router.get('/order/:orderId', paymentController.getOrder);

// Get buyer's orders
router.get('/orders/buyer/:buyerId', paymentController.getBuyerOrders);

// Track order by tracking number
router.get('/track/:trackingNumber', paymentController.getOrderTracking);

// Get payment details
router.get('/payment/:paymentIntentId', paymentController.getPaymentDetails);

// Webhook handler (no auth required)
router.post('/webhook', paymentController.handleWebhook);

module.exports = router;
