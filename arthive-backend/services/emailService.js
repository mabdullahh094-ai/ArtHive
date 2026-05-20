const { createTransporter, ADMIN_EMAIL } = require('../config/email');
const jwt = require('jsonwebtoken');

const getFrontendBaseUrl = () => {
  return (
    process.env.FRONTEND_URL ||
    process.env.CLIENT_URL ||
    'https://art-hive.tech'
  );
};

const emailService = {
  /**
   * Send tracking details to buyer once order is placed.
   */
  sendOrderTrackingEmail: async (data) => {
    try {
      const transporter = createTransporter();
      const fullName = `${data.first_name || ''} ${data.last_name || ''}`.trim() || 'Buyer';
      const formattedOrderDate = data.orderDate ? new Date(data.orderDate).toLocaleString() : new Date().toLocaleString();
      const formattedEstimatedDelivery = data.estimatedDelivery
        ? new Date(data.estimatedDelivery).toLocaleDateString()
        : 'TBD';

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #1f6feb; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .track-box { background: #ffffff; border: 1px solid #dbeafe; border-radius: 8px; padding: 16px; margin: 16px 0; }
            .button-wrap { text-align: center; margin: 20px 0; }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background-color: #1f6feb;
              color: #ffffff !important;
              text-decoration: none;
              border-radius: 6px;
              font-weight: bold;
            }
            .note { font-size: 13px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>Your ArtHive Order Is Confirmed</h2>
            </div>

            <div class="content">
              <p>Hi ${fullName},</p>
              <p>Your order has been placed successfully. You can track it using the details below:</p>

              <div class="track-box">
                <p><strong>Order ID:</strong> #${data.orderId}</p>
                <p><strong>Order Date:</strong> ${formattedOrderDate}</p>
                <p><strong>Tracking Number:</strong> ${data.trackingNumber}</p>
                <p><strong>Carrier:</strong> ${data.shippingCarrier || 'ArtHive Logistics'}</p>
                <p><strong>Estimated Delivery:</strong> ${formattedEstimatedDelivery}</p>
              </div>

              <div class="button-wrap">
                <a class="button" href="${data.trackingUrl}">Track My Order</a>
              </div>

              <p>If the button does not work, open this link in your browser:</p>
              <p><a href="${data.trackingUrl}">${data.trackingUrl}</a></p>
              <p class="note">Keep your tracking number safe for future updates.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const textContent = `
Hi ${fullName},

Your order has been placed successfully.

Order ID: ${data.orderId}
Order Date: ${formattedOrderDate}
Tracking Number: ${data.trackingNumber}
Carrier: ${data.shippingCarrier || 'ArtHive Logistics'}
Estimated Delivery: ${formattedEstimatedDelivery}

Track your order here:
${data.trackingUrl}
      `;

      const info = await transporter.sendMail({
        from: `"ArtHive Orders" <${process.env.EMAIL_USER}>`,
        to: data.email,
        subject: `Your tracking number for Order #${data.orderId}`,
        text: textContent,
        html: htmlContent
      });

      console.log('Order tracking email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending order tracking email:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Send password reset email with secure reset link.
   * @param {Object} data
   * @param {string} data.email
   * @param {string} data.first_name
   * @param {string} data.last_name
   * @param {string} data.resetUrl
   */
  sendPasswordResetEmail: async (data) => {
    try {
      const transporter = createTransporter();
      const fullName = `${data.first_name || ''} ${data.last_name || ''}`.trim() || 'User';

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #1f6feb; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .button-wrap { text-align: center; margin: 25px 0; }
            .button {
              display: inline-block;
              padding: 12px 28px;
              background-color: #1f6feb;
              color: #ffffff !important;
              text-decoration: none;
              border-radius: 6px;
              font-weight: bold;
            }
            .note { font-size: 13px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>Reset Your ArtHive Password</h2>
            </div>
            <div class="content">
              <p>Hi ${fullName},</p>
              <p>We received a request to reset your password.</p>
              <div class="button-wrap">
                <a class="button" href="${data.resetUrl}">Reset Password</a>
              </div>
              <p>If the button does not work, open this link in your browser:</p>
              <p><a href="${data.resetUrl}">${data.resetUrl}</a></p>
              <p class="note">This link expires in 30 minutes. If you did not request this, you can safely ignore this email.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const textContent = `
Hi ${fullName},

We received a request to reset your ArtHive password.

Reset your password here:
${data.resetUrl}

This link expires in 30 minutes. If you did not request this, you can ignore this email.
      `;

      const info = await transporter.sendMail({
        from: `"ArtHive Support" <${process.env.EMAIL_USER}>`,
        to: data.email,
        subject: 'Reset your ArtHive password',
        text: textContent,
        html: htmlContent
      });

      console.log('Password reset email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending password reset email:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Send account creation confirmation email with login CTA.
   * @param {Object} userData - User information (email, first_name, last_name, user_type)
   */
  sendAccountCreatedEmail: async (userData) => {
    try {
      const transporter = createTransporter();

      const fullName = `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || 'User';
      const frontendBaseUrl = getFrontendBaseUrl();
      const loginUrl = `${frontendBaseUrl.replace(/\/$/, '')}/login`;
      const userTypeText = userData.user_type === 'artist' ? 'artist' : 'buyer';

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #1f6feb; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .button-wrap { text-align: center; margin: 25px 0; }
            .button {
              display: inline-block;
              padding: 12px 28px;
              background-color: #1f6feb;
              color: #ffffff !important;
              text-decoration: none;
              border-radius: 6px;
              font-weight: bold;
            }
            .footer { text-align: center; padding: 15px; color: #777; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>Your ArtHive Account Is Ready</h2>
            </div>

            <div class="content">
              <p>Hi ${fullName},</p>
              <p>Your ${userTypeText} account has been created successfully on ArtHive.</p>
              <p>You can now login and start using your account.</p>

              <div class="button-wrap">
                <a class="button" href="${loginUrl}">Login to ArtHive</a>
              </div>

              <p>If the button does not work, open this link in your browser:</p>
              <p><a href="${loginUrl}">${loginUrl}</a></p>
            </div>

            <div class="footer">
              <p>ArtHive Team</p>
              <p>${new Date().toLocaleString()}</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const textContent = `
Hi ${fullName},

Your ${userTypeText} account has been created successfully on ArtHive.
You can now login and start using your account.

Login here: ${loginUrl}

ArtHive Team
${new Date().toLocaleString()}
      `;

      const mailOptions = {
        from: `"ArtHive Admin" <${process.env.EMAIL_USER}>`,
        to: userData.email,
        subject: 'Your ArtHive account is created - Login now',
        text: textContent,
        html: htmlContent
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('Account created email sent:', info.messageId);

      return {
        success: true,
        messageId: info.messageId
      };
    } catch (error) {
      console.error('Error sending account created email:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Send artist profile completion notification to admin
   * @param {Object} artistData - Complete artist information
   * @param {Array} artworks - Array of uploaded artworks
   */
  sendArtistProfileNotification: async (artistData, artworks) => {
    try {
      const transporter = createTransporter();

      // Generate secure tokens for approve/reject (valid for 7 days)
      const approveToken = jwt.sign(
        { artistId: artistData.id, action: 'approve' },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      const rejectToken = jwt.sign(
        { artistId: artistData.id, action: 'reject' },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Backend URL
      const backendUrl = process.env.BACKEND_URL || 'https://art-hive.tech';
      const approveLink = `${backendUrl}/api/admin/approve-artist/${approveToken}`;
      const rejectLink = `${backendUrl}/api/admin/reject-artist/${rejectToken}`;

      // Format artist details for email
      const artistName = `${artistData.first_name} ${artistData.last_name}`;
      const artworksList = artworks.map((artwork, index) => 
        `${index + 1}. ${artwork.title}\n   Image: ${artwork.image_url}`
      ).join('\n\n');

      // Create email HTML content
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .section { margin-bottom: 20px; }
            .label { font-weight: bold; color: #555; }
            .value { margin-left: 10px; color: #333; }
            .artwork-list { background-color: white; padding: 15px; border-radius: 5px; }
            .footer { text-align: center; padding: 15px; color: #777; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>🎨 New Artist Profile Submission</h2>
            </div>
            
            <div class="content">
              <div class="section">
                <h3>Artist Information</h3>
                <p><span class="label">Name:</span> <span class="value">${artistName}</span></p>
                <p><span class="label">Email:</span> <span class="value">${artistData.email}</span></p>
                <p><span class="label">Artist ID:</span> <span class="value">${artistData.id}</span></p>
                ${artistData.bio ? `<p><span class="label">Bio:</span> <span class="value">${artistData.bio}</span></p>` : ''}
                ${artistData.specialization ? `<p><span class="label">Specialization:</span> <span class="value">${artistData.specialization}</span></p>` : ''}
                ${artistData.phone_number ? `<p><span class="label">Phone:</span> <span class="value">${artistData.phone_number}</span></p>` : ''}
                ${artistData.address ? `<p><span class="label">Address:</span> <span class="value">${artistData.address}</span></p>` : ''}
                ${artistData.website_url ? `<p><span class="label">Website:</span> <span class="value">${artistData.website_url}</span></p>` : ''}
                ${artistData.certificate_url ? `<p><span class="label">Certificate:</span> <span class="value">Uploaded</span></p>` : ''}
                <p><span class="label">Verification Status:</span> <span class="value">${artistData.verification_status || 'pending'}</span></p>
              </div>

              ${artistData.social_media ? `
              <div class="section">
                <h3>Social Media</h3>
                <p>${JSON.stringify(artistData.social_media, null, 2)}</p>
              </div>
              ` : ''}

              <div class="section">
                <h3>Portfolio Artworks (${artworks.length} items)</h3>
                <div class="artwork-list">
                  <pre>${artworksList}</pre>
                </div>
              </div>

              <div class="section">
                <p style="background-color: #fff3cd; padding: 10px; border-radius: 5px;">
                  <strong>Action Required:</strong> Please review and approve/reject this artist's profile.
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${approveLink}" style="display: inline-block; padding: 15px 40px; margin: 10px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
                    ✅ APPROVE ARTIST
                  </a>
                  <a href="${rejectLink}" style="display: inline-block; padding: 15px 40px; margin: 10px; background-color: #f44336; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
                    ❌ REJECT ARTIST
                  </a>
                </div>
                
                <p style="font-size: 12px; color: #777; text-align: center;">
                  Or copy and paste these links in your browser:<br>
                  Approve: ${approveLink}<br>
                  Reject: ${rejectLink}
                </p>
              </div>
            </div>

            <div class="footer">
              <p>ArtHive Admin Notification System</p>
              <p>Sent on ${new Date().toLocaleString()}</p>
            </div>
          </div>
        </body>
        </html>
      `;

      // Create plain text version
      const textContent = `
New Artist Profile Submission
==============================

Artist Information:
------------------
Name: ${artistName}
Email: ${artistData.email}
Artist ID: ${artistData.id}
${artistData.bio ? `Bio: ${artistData.bio}` : ''}
${artistData.specialization ? `Specialization: ${artistData.specialization}` : ''}
${artistData.phone_number ? `Phone: ${artistData.phone_number}` : ''}
${artistData.address ? `Address: ${artistData.address}` : ''}
${artistData.website_url ? `Website: ${artistData.website_url}` : ''}
${artistData.certificate_url ? `Certificate: Uploaded` : ''}
Verification Status: ${artistData.verification_status || 'pending'}

Portfolio Artworks (${artworks.length} items):
${artworksList}

Action Required: 
Click one of these links to approve or reject this artist:

✅ APPROVE: ${approveLink}

❌ REJECT: ${rejectLink}

---
ArtHive Admin Notification System
Sent on ${new Date().toLocaleString()}
      `;

      // Email options
      const mailOptions = {
        from: `"ArtHive Platform" <${process.env.EMAIL_USER}>`,
        to: ADMIN_EMAIL,
        subject: `🎨 New Artist Profile: ${artistName}`,
        text: textContent,
        html: htmlContent
      };

      // Send email
      const info = await transporter.sendMail(mailOptions);
      
      console.log('✅ Artist profile notification email sent to admin:', info.messageId);
      return {
        success: true,
        messageId: info.messageId
      };

    } catch (error) {
      console.error('❌ Error sending artist profile notification email:', error);
      // Don't throw error to avoid breaking the main flow
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Send approval/rejection confirmation email to artist
   * @param {Object} artistData - Artist information (email, first_name, last_name)
   * @param {String} status - 'approved' or 'rejected'
   */
  sendArtistApprovalEmail: async (artistData, status) => {
    try {
      const transporter = createTransporter();
      const artistName = `${artistData.first_name} ${artistData.last_name}`;
      const isApproved = status === 'approved';

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: ${isApproved ? '#4CAF50' : '#FF9800'}; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .footer { text-align: center; padding: 15px; color: #777; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>${isApproved ? '✅ Congratulations!' : '⚠️ Application Update'}</h2>
            </div>
            
            <div class="content">
              <p>Dear ${artistName},</p>
              
              ${isApproved ? `
                <p>Great news! Your artist profile has been <strong>approved</strong> by the admin.</p>
                <p>You can now:</p>
                <ul>
                  <li>Upload and manage your artworks</li>
                  <li>View your artist dashboard</li>
                  <li>Receive orders from buyers</li>
                </ul>
                <p>Login to your account to get started!</p>
              ` : `
                <p>Thank you for your interest in ArtHive. After careful review, we regret to inform you that your artist application has been <strong>not approved</strong> at this time.</p>
                <p>If you have questions or would like to reapply, please contact us.</p>
              `}
            </div>

            <div class="footer">
              <p>ArtHive Platform</p>
              <p>${new Date().toLocaleString()}</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const textContent = `
Dear ${artistName},

${isApproved ? 
  'Great news! Your artist profile has been approved by the admin.\n\nYou can now upload and manage your artworks, view your artist dashboard, and receive orders from buyers.\n\nLogin to your account to get started!' :
  'Thank you for your interest in ArtHive. After careful review, we regret to inform you that your artist application has not been approved at this time.\n\nIf you have questions or would like to reapply, please contact us.'
}

---
ArtHive Platform
${new Date().toLocaleString()}
      `;

      const mailOptions = {
        from: `"ArtHive Platform" <${process.env.EMAIL_USER}>`,
        to: artistData.email,
        subject: isApproved ? '✅ Your Artist Profile is Approved!' : '⚠️ Artist Application Update',
        text: textContent,
        html: htmlContent
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(`✅ Artist ${status} email sent:`, info.messageId);
      
      return {
        success: true,
        messageId: info.messageId
      };

    } catch (error) {
      console.error('❌ Error sending artist approval email:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
};

module.exports = emailService;
