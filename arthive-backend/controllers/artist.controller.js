const db = require("../config/db");
const emailService = require("../services/emailService");

const ensureArtistPortfolioColumns = async () => {
  await db.query(`
    ALTER TABLE artists
    ADD COLUMN IF NOT EXISTS specialization TEXT,
    ADD COLUMN IF NOT EXISTS certificate_url TEXT
  `);
};

const artistController = {
  // Create new artwork
  createArtwork: async (req, res) => {
    try {
      const artistId = req.user.id;
      
      const {
        title,
        description,
        category_id,
        medium,
        dimensions,
        price,
        image_url,
        ai_authenticity_score,
        ai_price_recommendation
      } = req.body;

      // Validate required fields
      if (!title || !price || !image_url) {
        return res.status(400).json({
          success: false,
          message: "Title, price, and image URL are required"
        });
      }

      // Verify artist exists
      const artistCheck = await db.query(
        "SELECT id FROM artists WHERE id = $1",
        [artistId]
      );

      if (artistCheck.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: "Artist profile not found"
        });
      }

      // Create artwork
      const newArtwork = await db.query(
        `INSERT INTO artworks (
          artist_id, title, description, category_id, medium,
          dimensions, price, image_url, ai_authenticity_score,
          ai_price_recommendation, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *`,
        [
          artistId,
          title,
          description || null,
          category_id || null,
          medium || null,
          dimensions || null,
          parseFloat(price),
          image_url,
          ai_authenticity_score || null,
          ai_price_recommendation || null,
          'pending'
        ]
      );

      // Update artist's total artworks count
      await db.query(
        "UPDATE artists SET total_artworks = total_artworks + 1 WHERE id = $1",
        [artistId]
      );

      res.status(201).json({
        success: true,
        message: "Artwork created successfully",
        artwork: newArtwork.rows[0]
      });

    } catch (error) {
      console.error("Create artwork error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create artwork"
      });
    }
  },

  // Get artist's artworks
  getArtistArtworks: async (req, res) => {
    try {
      const artistId = req.user.id;
      const { status, page = 1, limit = 12 } = req.query;
      const offset = (page - 1) * limit;

      let query = `
        SELECT a.*, c.name as category_name,
               COUNT(*) OVER() as total_count
        FROM artworks a
        LEFT JOIN categories c ON a.category_id = c.id
        WHERE a.artist_id = $1
      `;
      
      const params = [artistId];
      let paramIndex = 2;

      if (status) {
        query += ` AND a.status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      query += ` ORDER BY a.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(parseInt(limit), offset);

      const result = await db.query(query, params);

      res.json({
        success: true,
        artworks: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: result.rows[0]?.total_count || 0,
          totalPages: Math.ceil((result.rows[0]?.total_count || 0) / limit)
        }
      });

    } catch (error) {
      console.error("Get artist artworks error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch artworks"
      });
    }
  },

  // Update artwork
  updateArtwork: async (req, res) => {
    try {
      const artistId = req.user.id;
      const { id } = req.params;
      
      const {
        title,
        description,
        category_id,
        medium,
        dimensions,
        price,
        image_url,
        status
      } = req.body;

      // Check if artwork belongs to artist
      const artworkCheck = await db.query(
        "SELECT id FROM artworks WHERE id = $1 AND artist_id = $2",
        [id, artistId]
      );

      if (artworkCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Artwork not found or unauthorized"
        });
      }

      // Update artwork
      const updatedArtwork = await db.query(
        `UPDATE artworks SET
          title = COALESCE($1, title),
          description = COALESCE($2, description),
          category_id = COALESCE($3, category_id),
          medium = COALESCE($4, medium),
          dimensions = COALESCE($5, dimensions),
          price = COALESCE($6, price),
          image_url = COALESCE($7, image_url),
          status = COALESCE($8, status),
          updated_at = CURRENT_TIMESTAMP
         WHERE id = $9 AND artist_id = $10
         RETURNING *`,
        [
          title,
          description,
          category_id,
          medium,
          dimensions,
          price ? parseFloat(price) : null,
          image_url,
          status,
          id,
          artistId
        ]
      );

      res.json({
        success: true,
        message: "Artwork updated successfully",
        artwork: updatedArtwork.rows[0]
      });

    } catch (error) {
      console.error("Update artwork error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update artwork"
      });
    }
  },

  // Delete artwork
  deleteArtwork: async (req, res) => {
    try {
      const artistId = req.user.id;
      const { id } = req.params;

      // Check if artwork belongs to artist
      const artworkCheck = await db.query(
        "SELECT id FROM artworks WHERE id = $1 AND artist_id = $2",
        [id, artistId]
      );

      if (artworkCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Artwork not found or unauthorized"
        });
      }

      // Delete artwork
      await db.query(
        "DELETE FROM artworks WHERE id = $1 AND artist_id = $2",
        [id, artistId]
      );

      // Update artist's total artworks count
      await db.query(
        "UPDATE artists SET total_artworks = GREATEST(total_artworks - 1, 0) WHERE id = $1",
        [artistId]
      );

      res.json({
        success: true,
        message: "Artwork deleted successfully"
      });

    } catch (error) {
      console.error("Delete artwork error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete artwork"
      });
    }
  },

  // Get artist's sales and orders
  getArtistOrders: async (req, res) => {
    try {
      const artistId = req.user.id;
      const { status, page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      let query = `
        SELECT o.*,
               u.first_name as buyer_first_name,
               u.last_name as buyer_last_name,
               u.email as buyer_email,
               COUNT(*) OVER() as total_count
        FROM orders o
        JOIN users u ON o.buyer_id = u.id
        WHERE o.artist_id = $1
      `;
      
      const params = [artistId];
      let paramIndex = 2;

      if (status) {
        query += ` AND o.status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      query += ` ORDER BY o.order_date DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(parseInt(limit), offset);

      const result = await db.query(query, params);

      // Get order items for each order
      const ordersWithItems = await Promise.all(
        result.rows.map(async (order) => {
          const items = await db.query(
            `SELECT oi.*, a.title, a.image_url
             FROM order_items oi
             JOIN artworks a ON oi.artwork_id = a.id
             WHERE oi.order_id = $1`,
            [order.id]
          );

          // Parse shipping address
          let shippingAddress = {};
          try {
            shippingAddress = typeof order.shipping_address === 'string' 
              ? JSON.parse(order.shipping_address) 
              : order.shipping_address;
          } catch (e) {
            shippingAddress = {};
          }

          return {
            ...order,
            shipping_address: shippingAddress,
            items: items.rows
          };
        })
      );

      res.json({
        success: true,
        orders: ordersWithItems,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: result.rows[0]?.total_count || 0,
          totalPages: Math.ceil((result.rows[0]?.total_count || 0) / limit)
        }
      });

    } catch (error) {
      console.error("Get artist orders error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch orders"
      });
    }
  },

  // Update order status (for artist)
  updateOrderStatus: async (req, res) => {
    try {
      const artistId = req.user.id;
      const { id } = req.params;
      const { status, payment_status } = req.body;

      if (!status && !payment_status) {
        return res.status(400).json({
          success: false,
          message: "At least one field (status or payment_status) is required"
        });
      }

      // Check if order belongs to artist
      const orderCheck = await db.query(
        "SELECT id FROM orders WHERE id = $1 AND artist_id = $2",
        [id, artistId]
      );

      if (orderCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Order not found or unauthorized"
        });
      }

      // Update order
      const updatedOrder = await db.query(
        `UPDATE orders SET
          status = COALESCE($1, status),
          payment_status = COALESCE($2, payment_status),
          updated_at = CURRENT_TIMESTAMP
         WHERE id = $3 AND artist_id = $4
         RETURNING *`,
        [status, payment_status, id, artistId]
      );

      // If order is completed, update artist's total sales
      if (status === 'completed' && payment_status === 'paid') {
        const order = updatedOrder.rows[0];
        await db.query(
          "UPDATE artists SET total_sales = total_sales + $1 WHERE id = $2",
          [order.total_amount, artistId]
        );
      }

      res.json({
        success: true,
        message: "Order updated successfully",
        order: updatedOrder.rows[0]
      });

    } catch (error) {
      console.error("Update order status error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update order"
      });
    }
  },

  // Get artist dashboard stats
  getDashboardStats: async (req, res) => {
    try {
      const artistId = req.user.id;

      // Get artist info
      const artistInfo = await db.query(
        `SELECT u.first_name, u.last_name, u.email, u.profile_pic_url,
                a.bio, a.website_url, a.verification_status,
                a.total_artworks, a.total_sales
         FROM artists a
         JOIN users u ON a.id = u.id
         WHERE a.id = $1`,
        [artistId]
      );

      // Get artworks stats
      const artworksStats = await db.query(
        `SELECT 
           COUNT(*) as total_artworks,
           SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_artworks,
           SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_artworks,
           SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_artworks,
           COALESCE(SUM(view_count), 0) as total_views
         FROM artworks
         WHERE artist_id = $1`,
        [artistId]
      );

      // Get orders stats
      const ordersStats = await db.query(
        `SELECT 
           COUNT(*) as total_orders,
           SUM(CASE WHEN status = 'completed' AND payment_status = 'paid' THEN total_amount ELSE 0 END) as total_revenue,
           SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_orders,
           SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing_orders,
           SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_orders
         FROM orders
         WHERE artist_id = $1`,
        [artistId]
      );

      // Get recent orders
      const recentOrders = await db.query(
        `SELECT o.*, u.first_name, u.last_name
         FROM orders o
         JOIN users u ON o.buyer_id = u.id
         WHERE o.artist_id = $1
         ORDER BY o.order_date DESC
         LIMIT 5`,
        [artistId]
      );

      // Get popular artworks
      const popularArtworks = await db.query(
        `SELECT id, title, image_url, view_count, price
         FROM artworks
         WHERE artist_id = $1 AND status = 'approved'
         ORDER BY view_count DESC
         LIMIT 5`,
        [artistId]
      );

      const stats = {
        artist: artistInfo.rows[0],
        artworks: artworksStats.rows[0],
        orders: ordersStats.rows[0],
        recent_orders: recentOrders.rows,
        popular_artworks: popularArtworks.rows
      };

      // Parse JSON fields
      if (stats.artist.social_media && typeof stats.artist.social_media === 'string') {
        try {
          stats.artist.social_media = JSON.parse(stats.artist.social_media);
        } catch (e) {
          stats.artist.social_media = {};
        }
      }

      res.json({
        success: true,
        stats
      });

    } catch (error) {
      console.error("Get dashboard stats error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch dashboard stats"
      });
    }
  }
,

  // Upload artist portfolio (multiple images) and create artwork entries
  uploadPortfolio: async (req, res) => {
    try {
      const artistId = req.user.id;

      await ensureArtistPortfolioColumns();

      // Ensure files were provided
      const images = (req.files && req.files.images) || [];
      const certificate = (req.files && req.files.certificate && req.files.certificate[0]) || null;
      const { specialization } = req.body;

      if (!Array.isArray(images) || images.length < 4) {
        return res.status(400).json({
          success: false,
          message: 'Please upload at least 4 portfolio images.'
        });
      }

      // Ensure artist exists
      const artistCheck = await db.query('SELECT id FROM artists WHERE id = $1', [artistId]);
      if (artistCheck.rows.length === 0) {
        return res.status(403).json({ success: false, message: 'Artist profile not found' });
      }

      // Create artworks for each uploaded image with status='pending'
      const createdArtworks = [];
      for (const file of images) {
        const imageUrl = `/uploads/artist_portfolio/${file.filename}`;
        const result = await db.query(
          `INSERT INTO artworks (
            artist_id, title, description, image_url, price, status, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
          RETURNING *`,
          [
            artistId,
            file.originalname || `Artwork_${Date.now()}`,
            specialization && specialization.trim() ? specialization.trim() : null,
            imageUrl,
            0,
            'pending'
          ]
        );
        createdArtworks.push(result.rows[0]);
      }

      // Update artist's total artworks count
      await db.query(
        'UPDATE artists SET total_artworks = total_artworks + $1 WHERE id = $2',
        [images.length, artistId]
      );

      // Update specialization
      if (typeof specialization === 'string' && specialization.trim().length > 0) {
        await db.query('UPDATE artists SET specialization = $1 WHERE id = $2', [specialization.trim(), artistId]);
      }

      // Handle certificate file if provided
      if (certificate) {
        const certRel = `/uploads/artist_portfolio/${certificate.filename}`;
        await db.query('UPDATE artists SET certificate_url = $1 WHERE id = $2', [certRel, artistId]);
      }

      // Fetch complete artist details for email notification
      const artistDetails = await db.query(
        `SELECT u.id, u.email, u.first_name, u.last_name,
                a.bio, a.specialization, a.website_url, a.social_media,
                a.certificate_url, a.verification_status
         FROM users u
         JOIN artists a ON u.id = a.id
         WHERE u.id = $1`,
        [artistId]
      );

      // Send email notification to admin
      if (artistDetails.rows.length > 0) {
        const artistData = artistDetails.rows[0];
        
        // Parse social_media if it's a string
        if (artistData.social_media && typeof artistData.social_media === 'string') {
          try {
            artistData.social_media = JSON.parse(artistData.social_media);
          } catch (e) {
            artistData.social_media = {};
          }
        }

        // Send email to admin with all artist details
        await emailService.sendArtistProfileNotification(artistData, createdArtworks);
      }

      res.status(201).json({
        success: true,
        message: 'Portfolio uploaded successfully. Your artworks are pending admin approval.',
        artworks: createdArtworks
      });

    } catch (error) {
      console.error('Upload portfolio error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload portfolio',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Get all artists (public endpoint)
  getAllArtists: async (req, res) => {
    try {
      const { page = 1, limit = 12, search } = req.query;
      const offset = (page - 1) * limit;

      let query = `
        SELECT id, user_id, bio, specialization, profile_image, 
               total_artworks, rating, verified, created_at,
               COUNT(*) OVER() as total_count
        FROM artists
        WHERE verified = true
      `;
      let params = [];

      if (search) {
        query += ` AND (specialization ILIKE $1 OR bio ILIKE $1)`;
        params.push(`%${search}%`);
      }

      query += ` ORDER BY rating DESC, total_artworks DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);

      const result = await db.query(query, params);

      const totalCount = result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0;
      const totalPages = Math.ceil(totalCount / limit);

      res.json({
        success: true,
        artists: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalCount,
          totalPages
        }
      });
    } catch (error) {
      console.error('Get all artists error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch artists'
      });
    }
  },

  // Complete and submit artist profile for admin approval
  completeProfile: async (req, res) => {
    try {
      const artistId = req.user.id;
      const { bio, specialization, website_url, social_media } = req.body;

      // Validate required fields
      if (!bio || !specialization) {
        return res.status(400).json({
          success: false,
          message: "Bio and specialization are required"
        });
      }

      // Update artist profile
      const updateQuery = `
        UPDATE artists 
        SET bio = $1, specialization = $2, website_url = $3, 
            social_media = $4, verification_status = 'pending_approval'
        WHERE id = $5
        RETURNING *
      `;

      const result = await db.query(updateQuery, [
        bio,
        specialization,
        website_url || null,
        social_media ? JSON.stringify(social_media) : null,
        artistId
      ]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Artist not found"
        });
      }

      const artist = result.rows[0];

      // Get artist's user info (first_name, last_name, email)
      const userQuery = `
        SELECT id, email, first_name, last_name 
        FROM users 
        WHERE id = $1
      `;
      const userResult = await db.query(userQuery, [artist.user_id]);
      
      if (userResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "User information not found"
        });
      }

      const userInfo = userResult.rows[0];
      const artistDataWithUser = {
        ...artist,
        ...userInfo
      };

      // Get artist's artworks for email
      const artworksQuery = `
        SELECT id, title, image_url, price 
        FROM artworks 
        WHERE artist_id = $1 
        LIMIT 5
      `;
      const artworksResult = await db.query(artworksQuery, [artistId]);
      const artworks = artworksResult.rows;

      // Send email notification to admin
      try {
        console.log('📧 Artist Profile Submission:');
        console.log('   Artist ID:', artist.id);
        console.log('   Artist Email:', userInfo.email);
        console.log('   Artist Name:', userInfo.first_name, userInfo.last_name);
        console.log('   Bio:', bio);
        console.log('   Specialization:', specialization);
        console.log('📧 Sending artist profile notification email...');
        
        const emailResult = await emailService.sendArtistProfileNotification(artistDataWithUser, artworks);
        
        console.log('✅ Email result:', emailResult);
        
        if (emailResult.success) {
          console.log('✅ Email sent successfully to admin');
        } else {
          console.log('⚠️ Email failed:', emailResult.error);
        }
      } catch (emailError) {
        console.error('❌ Email notification error:', emailError.message);
        console.error('❌ Full error:', emailError);
        // Don't fail the entire request if email fails
      }

      res.json({
        success: true,
        message: "Profile submitted successfully! Admin will review and approve soon.",
        artist: {
          id: artist.id,
          bio: artist.bio,
          specialization: artist.specialization,
          verification_status: artist.verification_status
        }
      });
    } catch (error) {
      console.error('Complete profile error:', error);
      res.status(500).json({
        success: false,
        message: "Failed to complete profile"
      });
    }
  },

  // Get artist profile for editing
  getProfile: async (req, res) => {
    try {
      const artistId = req.user.id;

      const query = `
        SELECT id, user_id, bio, specialization, profile_image, 
               website_url, social_media, verification_status, 
               total_artworks, rating, verified, created_at, updated_at
        FROM artists 
        WHERE id = $1
      `;

      const result = await db.query(query, [artistId]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Artist profile not found"
        });
      }

      res.json({
        success: true,
        profile: result.rows[0]
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch profile"
      });
    }
  }
};

module.exports = artistController;
