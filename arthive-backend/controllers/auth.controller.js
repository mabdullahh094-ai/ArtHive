const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const os = require('os');
const db = require('../config/db');
const emailService = require('../services/emailService');

const getJwtBaseSecret = () => process.env.JWT_SECRET || 'dev-secret-change-me';
const getResetSecret = (passwordHash) => `${getJwtBaseSecret()}::${passwordHash}`;

const getLanIpv4 = () => {
  const interfaces = os.networkInterfaces();
  for (const iface of Object.values(interfaces)) {
    for (const net of iface || []) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return null;
};

const ensureArtistProfileColumns = async () => {
  await db.query(`
    ALTER TABLE artists
    ADD COLUMN IF NOT EXISTS city VARCHAR(100),
    ADD COLUMN IF NOT EXISTS country VARCHAR(100),
    ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255),
    ADD COLUMN IF NOT EXISTS address TEXT,
    ADD COLUMN IF NOT EXISTS phone_number VARCHAR(30)
  `);
};

const authController = {
  // -------------------- REGISTER --------------------
  register: async (req, res, next) => {
    let {
      email,
      password,
      first_name,
      last_name,
      user_type = 'buyer',
      bio,
      website_url,
      social_media
    } = req.body;

    // Trim whitespace from string fields
    email = email?.trim();
    password = password?.trim();
    first_name = first_name?.trim();
    last_name = last_name?.trim();

    try {
      console.log('📝 Registration attempt:', { email, first_name, last_name, user_type, hasPassword: !!password });

  // Log entire request body for debugging
  console.log('Full request body:', JSON.stringify(req.body, null, 2));
      if (!email || !password || !first_name || !last_name) {
        console.log('❌ Validation failed - missing fields:', {
          email: !!email,
          password: !!password,
          first_name: !!first_name,
          last_name: !!last_name
        });
        return res.status(400).json({
          success: false,
          message: 'All fields are required'
        });
      }

      // Validate user_type
      if (user_type && !['buyer', 'artist', 'admin'].includes(user_type)) {
        console.log('❌ Invalid user_type:', user_type);
        return res.status(400).json({
          success: false,
          message: 'Invalid user type. Must be buyer or artist'
        });
      }
      // Check if user already exists
      const existingUser = await db.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );

      if (existingUser.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'An account with this email already exists. Please login.'
        });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      // Start transaction
      const client = await db.pool.connect();
      
      try {
        await client.query('BEGIN');

        // Insert into users table
        const newUser = await client.query(
          `INSERT INTO users (email, password_hash, first_name, last_name, user_type, status)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id, email, first_name, last_name, user_type, created_at`,
          [email, passwordHash, first_name, last_name, user_type, 'active']
        );

        // If user is artist, insert into artists table
        if (user_type === 'artist') {
          console.log('🎨 Creating artist profile for user ID:', newUser.rows[0].id);
          await client.query(
            `INSERT INTO artists (id, bio, website_url, social_media, verification_status, total_artworks, total_sales)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
              newUser.rows[0].id,
              bio || '',
              website_url || '',
              social_media ? JSON.stringify(social_media) : '{}',
              'pending',
              0,
              0
            ]
          );
          console.log('✅ Artist profile created successfully');
        }

        await client.query('COMMIT');

        // Generate JWT token
        const token = jwt.sign(
          {
            id: newUser.rows[0].id,
            email: newUser.rows[0].email,
            user_type: newUser.rows[0].user_type,
          },
          process.env.JWT_SECRET,
          { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );

        // Send a welcome/login email after successful signup.
        await emailService.sendAccountCreatedEmail({
          email: newUser.rows[0].email,
          first_name: newUser.rows[0].first_name,
          last_name: newUser.rows[0].last_name,
          user_type: newUser.rows[0].user_type
        });

        res.status(201).json({
          success: true,
          message: 'Registration successful',
          token,
          user: newUser.rows[0],
        });

      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }

    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Registration failed',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // -------------------- LOGIN --------------------
  login: async (req, res, next) => {
    const { email, password } = req.body;

    try {
      const safeEmail = (email || '').trim();
      console.log('🔐 Login attempt:', { email: safeEmail });

      const user = await db.query(
        `SELECT u.id, u.email, u.password_hash, u.first_name, u.last_name,
                u.user_type, u.status, u.profile_pic_url,
                a.bio as artist_bio, a.verification_status as artist_verification_status,
                a.total_artworks, a.total_sales
         FROM users u
         LEFT JOIN artists a ON u.id = a.id
         WHERE u.email = $1`,
        [safeEmail]
      );

      if (user.rows.length === 0) {
        console.log('❌ Login failed: user not found for email', safeEmail);
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.rows[0].password_hash);
      if (!isValidPassword) {
        console.log('❌ Login failed: bad password for email', safeEmail);
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Check account status
      if (user.rows[0].status !== 'active') {
        return res.status(403).json({
          success: false,
          message: 'Account is not active'
        });
      }

      // Generate JWT token (fallback secret for local dev)
      const jwtSecret = process.env.JWT_SECRET || 'dev-secret-change-me';
      const token = jwt.sign(
        {
          id: user.rows[0].id,
          email: user.rows[0].email,
          user_type: user.rows[0].user_type,
        },
        jwtSecret,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );

      // Prepare user data for response
      const userData = {
        id: user.rows[0].id,
        email: user.rows[0].email,
        first_name: user.rows[0].first_name,
        last_name: user.rows[0].last_name,
        user_type: user.rows[0].user_type,
        profile_pic_url: user.rows[0].profile_pic_url,
        status: user.rows[0].status,
      };

      // Add artist-specific data if user is an artist
      if (user.rows[0].user_type === 'artist') {
        userData.artist = {
          bio: user.rows[0].artist_bio,
          verification_status: user.rows[0].artist_verification_status,
          total_artworks: user.rows[0].total_artworks,
          total_sales: user.rows[0].total_sales
        };
      }

      res.json({
        success: true,
        message: 'Login successful',
        token,
        user: userData,
      });

    } catch (error) {
      console.error('Login error:', error.message, error.stack);
      res.status(500).json({
        success: false,
        message: 'Login failed',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // -------------------- FORGOT PASSWORD --------------------
  forgotPassword: async (req, res) => {
    try {
      const email = String(req.body?.email || '').trim().toLowerCase();

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email is required'
        });
      }

      const userResult = await db.query(
        `SELECT id, email, first_name, last_name, password_hash
         FROM users
         WHERE email = $1
         LIMIT 1`,
        [email]
      );

      if (userResult.rows.length > 0) {
        const user = userResult.rows[0];
        const token = jwt.sign(
          {
            userId: user.id,
            email: user.email,
            purpose: 'password_reset'
          },
          getResetSecret(user.password_hash),
          { expiresIn: '30m' }
        );

        const requestHost = (req.get('host') || '').trim();
        const hostIsLocal = /localhost|127\.0\.0\.1/i.test(requestHost);
        const lanIp = getLanIpv4();
        const configuredBackendUrl = (process.env.BACKEND_URL || '').trim();

        const backendBaseUrl =
          (hostIsLocal && lanIp ? `http://${lanIp}:3001` : null) ||
          (requestHost ? `${req.protocol}://${requestHost}` : null) ||
          configuredBackendUrl ||
          'https://art-hive.tech';
        const resetUrl = `${backendBaseUrl.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(token)}`;

        const emailResult = await emailService.sendPasswordResetEmail({
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          resetUrl
        });

        if (!emailResult.success) {
          throw new Error(emailResult.error || 'Failed to send password reset email');
        }
      }

      // Return generic response to avoid exposing whether email exists.
      return res.json({
        success: true,
        message: 'If an account exists for this email, a password reset link has been sent.'
      });
    } catch (error) {
      console.error('Forgot password error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to process forgot password request'
      });
    }
  },

  // -------------------- RESET PASSWORD --------------------
  resetPassword: async (req, res) => {
    try {
      const token = String(req.body?.token || '').trim();
      const password = String(req.body?.password || '').trim();

      if (!token || !password) {
        return res.status(400).json({
          success: false,
          message: 'Token and new password are required'
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters long'
        });
      }

      const decodedUntrusted = jwt.decode(token);
      if (!decodedUntrusted?.userId || !decodedUntrusted?.email) {
        return res.status(400).json({
          success: false,
          message: 'Invalid reset token'
        });
      }

      const userResult = await db.query(
        `SELECT id, email, password_hash
         FROM users
         WHERE id = $1 AND email = $2
         LIMIT 1`,
        [decodedUntrusted.userId, decodedUntrusted.email]
      );

      if (userResult.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired reset token'
        });
      }

      const user = userResult.rows[0];

      let decodedVerified;
      try {
        decodedVerified = jwt.verify(token, getResetSecret(user.password_hash));
      } catch (verifyError) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired reset token'
        });
      }

      if (decodedVerified.purpose !== 'password_reset') {
        return res.status(400).json({
          success: false,
          message: 'Invalid reset token purpose'
        });
      }

      const isSameAsOldPassword = await bcrypt.compare(password, user.password_hash);
      if (isSameAsOldPassword) {
        return res.status(400).json({
          success: false,
          message: 'You have already used this password before. Please choose a different password.'
        });
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      await db.query(
        `UPDATE users
         SET password_hash = $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [passwordHash, user.id]
      );

      return res.json({
        success: true,
        message: 'Password reset successful. You can now login with your new password.'
      });
    } catch (error) {
      console.error('Reset password error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to reset password'
      });
    }
  },

  // -------------------- GET PROFILE --------------------
  getProfile: async (req, res) => {
    try {
      await ensureArtistProfileColumns();

      const user = await db.query(
        `SELECT u.id, u.email, u.first_name, u.last_name, u.user_type,
                u.profile_pic_url, u.status, u.created_at,
                a.bio, a.website_url, a.social_media, a.verification_status,
                a.city, a.country, a.contact_email, a.address, a.phone_number,
                (
                  SELECT COUNT(*)::int
                  FROM artworks aw
                  WHERE aw.artist_id = u.id
                ) as total_artworks,
                a.total_sales
         FROM users u
         LEFT JOIN artists a ON u.id = a.id
         WHERE u.id = $1`,
        [req.user.id]
      );

      if (user.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const userData = {
        id: user.rows[0].id,
        email: user.rows[0].email,
        first_name: user.rows[0].first_name,
        last_name: user.rows[0].last_name,
        user_type: user.rows[0].user_type,
        profile_pic_url: user.rows[0].profile_pic_url,
        status: user.rows[0].status,
        created_at: user.rows[0].created_at
      };

      // Add artist-specific data if user is an artist
      if (user.rows[0].user_type === 'artist') {
        userData.artist = {
          bio: user.rows[0].bio,
          website_url: user.rows[0].website_url,
          social_media: user.rows[0].social_media,
          city: user.rows[0].city,
          country: user.rows[0].country,
          contact_email: user.rows[0].contact_email,
          address: user.rows[0].address,
          phone_number: user.rows[0].phone_number,
          verification_status: user.rows[0].verification_status,
          total_artworks: user.rows[0].total_artworks,
          total_sales: user.rows[0].total_sales
        };
      }

      res.json({
        success: true,
        user: userData
      });

    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch profile'
      });
    }
  },

  // -------------------- UPDATE PROFILE --------------------
  updateProfile: async (req, res) => {
    try {
      await ensureArtistProfileColumns();

      const {
        first_name,
        last_name,
        profile_pic_url,
        bio,
        website_url,
        social_media,
        city,
        country,
        contact_email,
        address,
        phone_number
      } = req.body;
      const userId = req.user.id;
      const uploadedProfilePicUrl = req.file ? `/uploads/profile_pics/${req.file.filename}` : null;
      const resolvedProfilePicUrl = uploadedProfilePicUrl || profile_pic_url;

      const hasArtistProfileUpdate =
        bio !== undefined ||
        website_url !== undefined ||
        social_media !== undefined ||
        city !== undefined ||
        country !== undefined ||
        contact_email !== undefined ||
        address !== undefined ||
        phone_number !== undefined;
      const shouldNotifyAdmin = req.user.user_type === 'artist' && hasArtistProfileUpdate;

      // Update users table
      const updatedUser = await db.query(
        `UPDATE users 
         SET first_name = COALESCE($1, first_name),
             last_name = COALESCE($2, last_name),
             profile_pic_url = COALESCE($3, profile_pic_url),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $4
         RETURNING id, email, first_name, last_name, user_type, profile_pic_url, status`,
        [first_name, last_name, resolvedProfilePicUrl, userId]
      );

      // If user is artist and provided artist data, update artists table and push to pending review (unless already verified)
      if (req.user.user_type === 'artist' && hasArtistProfileUpdate) {
        await db.query(
          `UPDATE artists 
           SET bio = COALESCE($1, bio),
               website_url = COALESCE($2, website_url),
               social_media = COALESCE($3, social_media),
               city = COALESCE($4, city),
               country = COALESCE($5, country),
               contact_email = COALESCE($6, contact_email),
               address = COALESCE($7, address),
               phone_number = COALESCE($8, phone_number),
               verification_status = CASE WHEN verification_status != 'verified' THEN 'pending' ELSE verification_status END
           WHERE id = $9`,
          [
            bio,
            website_url,
            social_media ? JSON.stringify(social_media) : null,
            city,
            country,
            contact_email,
            address,
            phone_number,
            userId
          ]
        );
      }

      // Send admin notification email after submission
      if (shouldNotifyAdmin) {
        try {
          const artistRes = await db.query(
            `SELECT id, bio, website_url, social_media, city, country, contact_email, address, phone_number, verification_status
             FROM artists WHERE id = $1`,
            [userId]
          );

          const artistInfo = artistRes.rows[0];

          const artistData = {
            id: userId,
            email: updatedUser.rows[0].email,
            first_name: updatedUser.rows[0].first_name,
            last_name: updatedUser.rows[0].last_name,
            bio: artistInfo?.bio || bio,
            website_url: artistInfo?.website_url || website_url,
            social_media: artistInfo?.social_media || (social_media ? JSON.stringify(social_media) : null),
            city: artistInfo?.city || city,
            country: artistInfo?.country || country,
            contact_email: artistInfo?.contact_email || contact_email,
            address: artistInfo?.address || address,
            phone_number: artistInfo?.phone_number || phone_number,
            verification_status: artistInfo?.verification_status || 'pending'
          };

          await emailService.sendArtistProfileNotification(artistData, []);
        } catch (emailError) {
          console.error('❌ Admin notification email failed:', emailError.message);
        }
      }

      res.json({
        success: true,
        message: 'Profile updated successfully',
        user: updatedUser.rows[0]
      });

    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update profile'
      });
    }
  }
};

module.exports = authController;