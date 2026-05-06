// Email service for payment notifications
// Add this to your emailService.js

const nodemailer = require('nodemailer');
const db = require('../config/db');

const emailService = {
  // Send order confirmation email
  sendOrderConfirmation: async (order, buyer) => {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      });

      const orderItemsHTML = order.items
        .map(
          item => `
        <tr style="border-bottom: 1px solid #ddd;">
          <td style="padding: 10px;">${item.title}</td>
          <td style="padding: 10px; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px; text-align: right;">$${item.price.toFixed(2)}</td>
          <td style="padding: 10px; text-align: right;">$${(item.price * item.quantity).toFixed(2)}</td>
        </tr>
      `
        )
        .join('');

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #667eea; color: white; padding: 20px; text-align: center; }
            .section { margin: 20px 0; }
            .section-title { font-size: 16px; font-weight: bold; border-bottom: 2px solid #667eea; margin-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; }
            .total-row { font-weight: bold; font-size: 18px; }
            .footer { background: #f5f5f5; padding: 20px; text-align: center; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✓ Order Confirmed</h1>
              <p>Thank you for your purchase from ArtHive!</p>
            </div>

            <div class="section">
              <div class="section-title">Order Details</div>
              <p><strong>Order ID:</strong> #${order.id}</p>
              <p><strong>Order Date:</strong> ${new Date(order.created_at).toLocaleDateString()}</p>
              <p><strong>Status:</strong> ${order.status.toUpperCase()}</p>
            </div>

            <div class="section">
              <div class="section-title">Order Items</div>
              <table>
                <thead>
                  <tr style="background: #f5f5f5;">
                    <th style="padding: 10px; text-align: left;">Artwork</th>
                    <th style="padding: 10px; text-align: center;">Qty</th>
                    <th style="padding: 10px; text-align: right;">Price</th>
                    <th style="padding: 10px; text-align: right;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${orderItemsHTML}
                  <tr class="total-row">
                    <td colspan="3" style="padding: 10px; text-align: right;">Total Amount:</td>
                    <td style="padding: 10px; text-align: right; color: #667eea;">$${order.total_amount.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="section">
              <div class="section-title">Shipping Address</div>
              <p>
                ${order.shipping_address.fullName}<br>
                ${order.shipping_address.address}<br>
                ${order.shipping_address.city}, ${order.shipping_address.state} ${order.shipping_address.zipCode}<br>
                ${order.shipping_address.country}
              </p>
            </div>

            <div class="section">
              <div class="section-title">What's Next?</div>
              <ul>
                <li>Your order is being prepared for shipment</li>
                <li>You'll receive tracking information via email</li>
                <li>Check your account for order updates</li>
                <li>Have questions? <a href="https://arthive.com/contact">Contact us</a></li>
              </ul>
            </div>

            <div class="footer">
              <p>© 2025 ArtHive. All rights reserved.</p>
              <p>This is an automated email. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: buyer.email,
        subject: `Order Confirmed #${order.id} - ArtHive`,
        html: htmlContent
      };

      await transporter.sendMail(mailOptions);
      console.log('✅ Order confirmation email sent to:', buyer.email);

      return true;
    } catch (error) {
      console.error('❌ Error sending order confirmation email:', error);
      return false;
    }
  },

  // Send payment failed email
  sendPaymentFailedEmail: async (buyerEmail, amount, reason) => {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      });

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #ff6b6b; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .button { display: inline-block; padding: 10px 20px; background: #667eea; color: white; text-decoration: none; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ Payment Failed</h1>
            </div>
            <div class="content">
              <p>Hi,</p>
              <p>Your payment of <strong>$${amount.toFixed(2)}</strong> was unsuccessful.</p>
              <p><strong>Reason:</strong> ${reason}</p>
              <p>Please try again or contact our support team if you continue to experience issues.</p>
              <p style="margin-top: 20px;">
                <a href="https://arthive.com/checkout" class="button">Retry Payment</a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `;

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: buyerEmail,
        subject: 'Payment Failed - ArtHive',
        html: htmlContent
      };

      await transporter.sendMail(mailOptions);
      console.log('✅ Payment failed email sent to:', buyerEmail);

      return true;
    } catch (error) {
      console.error('❌ Error sending payment failed email:', error);
      return false;
    }
  },

  // Send shipment notification
  sendShipmentNotification: async (order, trackingNumber, shippingCarrier) => {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      });

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #27ae60; color: white; padding: 20px; text-align: center; }
            .tracking { background: #f5f5f5; padding: 15px; border-radius: 4px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📦 Your Order is On Its Way!</h1>
            </div>
            <div style="padding: 20px;">
              <p>Great news! Your order #${order.id} has been shipped.</p>
              <div class="tracking">
                <p><strong>Tracking Number:</strong> ${trackingNumber}</p>
                <p><strong>Carrier:</strong> ${shippingCarrier}</p>
                <p><a href="https://tracking.example.com/${trackingNumber}">Track Your Package</a></p>
              </div>
              <p>Your order will arrive shortly. Thank you for shopping with ArtHive!</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: order.email,
        subject: `Your Order #${order.id} is Shipped - ArtHive`,
        html: htmlContent
      };

      await transporter.sendMail(mailOptions);
      console.log('✅ Shipment notification email sent to:', order.email);

      return true;
    } catch (error) {
      console.error('❌ Error sending shipment email:', error);
      return false;
    }
  }
};

module.exports = emailService;
