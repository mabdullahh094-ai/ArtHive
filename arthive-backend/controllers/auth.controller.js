const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const emailService = require('../services/emailService');

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
        return res.status(400).json({ 
          success: false,
          message: 'User already exists' 
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

  // -------------------- GET PROFILE --------------------
  getProfile: async (req, res) => {
    try {
      const user = await db.query(
        `SELECT u.id, u.email, u.first_name, u.last_name, u.user_type, 
                u.profile_pic_url, u.status, u.created_at,
                a.bio, a.website_url, a.social_media, a.verification_status,
                a.total_artworks, a.total_sales
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
      const { first_name, last_name, profile_pic_url, bio, website_url, social_media } = req.body;
      const userId = req.user.id;

      const shouldNotifyAdmin = req.user.user_type === 'artist' && (bio || website_url || social_media);

      // Update users table
      const updatedUser = await db.query(
        `UPDATE users 
         SET first_name = COALESCE($1, first_name),
             last_name = COALESCE($2, last_name),
             profile_pic_url = COALESCE($3, profile_pic_url),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $4
         RETURNING id, email, first_name, last_name, user_type, profile_pic_url, status`,
        [first_name, last_name, profile_pic_url, userId]
      );

      // If user is artist and provided artist data, update artists table and push to pending review (unless already verified)
      if (req.user.user_type === 'artist' && (bio || website_url || social_media)) {
        await db.query(
          `UPDATE artists 
           SET bio = COALESCE($1, bio),
               website_url = COALESCE($2, website_url),
               social_media = COALESCE($3, social_media),
               verification_status = CASE WHEN verification_status != 'verified' THEN 'pending' ELSE verification_status END
           WHERE id = $4`,
          [
            bio,
            website_url,
            social_media ? JSON.stringify(social_media) : null,
            userId
          ]
        );
      }

      // Send admin notification email after submission
      if (shouldNotifyAdmin) {
        try {
          const artistRes = await db.query(
            'SELECT id, bio, website_url, social_media, verification_status FROM artists WHERE id = $1',
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