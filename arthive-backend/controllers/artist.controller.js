const db = require("../config/db");
const emailService = require("../services/emailService");

const ensureArtistPortfolioColumns = async () => {
  await db.query(`
    ALTER TABLE artists
    ADD COLUMN IF NOT EXISTS specialization TEXT,
    ADD COLUMN IF NOT EXISTS certificate_url TEXT
  `);
};

const ensureArtworkGalleryColumn = async () => {
  await db.query(`
    ALTER TABLE artworks
    ADD COLUMN IF NOT EXISTS image_urls JSONB
  `);
};

const ensureArtworkSubmissionSourceColumn = async () => {
  await db.query(`
    ALTER TABLE artworks
    ADD COLUMN IF NOT EXISTS submission_source VARCHAR(32) DEFAULT 'dashboard'
  `);
};

const syncArtistArtworkCount = async (artistId) => {
  await db.query(
    `UPDATE artists
     SET total_artworks = (
       SELECT COUNT(*)::int FROM artworks WHERE artist_id = $1
     )
     WHERE id = $1`,
    [artistId]
  );
};

const ensureArtistRecord = async (artistId) => {
  const userResult = await db.query(
    `SELECT id FROM users WHERE id = $1 AND user_type = 'artist'`,
    [artistId]
  );

  if (userResult.rows.length === 0) {
    return false;
  }

  await db.query(
    `INSERT INTO artists (
      id,
      bio,
      website_url,
      social_media,
      verification_status,
      total_artworks,
      total_sales
    )
    VALUES ($1, '', '', '{}'::jsonb, 'pending', 0, 0)
    ON CONFLICT (id) DO NOTHING`,
    [artistId]
  );

  return true;
};

const artistController = {
  // Create new artwork
  createArtwork: async (req, res) => {
    try {
      const artistId = req.user.id;

      const artistRecordReady = await ensureArtistRecord(artistId);
      if (!artistRecordReady) {
        return res.status(403).json({
          success: false,
          message: "Access denied. Artist only."
        });
      }

      await ensureArtworkSubmissionSourceColumn();
      
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
        "SELECT id, verification_status FROM artists WHERE id = $1",
        [artistId]
      );

      if (artistCheck.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: "Artist profile not found"
        });
      }

      const artworkStatus = artistCheck.rows[0].verification_status === 'verified' ? 'approved' : 'pending';

      // Create artwork
      const newArtwork = await db.query(
        `INSERT INTO artworks (
          artist_id, title, description, category_id, medium,
          dimensions, price, image_url, ai_authenticity_score,
          ai_price_recommendation, status, submission_source
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
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
          artworkStatus,
          'dashboard'
        ]
      );

      // Keep denormalized count in sync with real artworks table.
      await syncArtistArtworkCount(artistId);

      res.status(201).json({
        success: true,
        message: artworkStatus === 'approved' ? "Artwork created and published successfully" : "Artwork created successfully",
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

      // Keep denormalized count in sync with real artworks table.
      await syncArtistArtworkCount(artistId);

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

  // Get sold paintings for the current artist
  getSoldPaintings: async (req, res) => {
    try {
      const artistId = req.user.id;
      const { page = 1, limit = 12 } = req.query;
      const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
      const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 12, 1), 50);
      const offset = (parsedPage - 1) * parsedLimit;

      const soldItemsResult = await db.query(
        `SELECT
           oi.id,
           oi.order_id,
           o.order_number,
           o.order_date,
           a.id as artwork_id,
           a.title,
           a.image_url,
           oi.quantity,
           oi.price_at_purchase,
           (oi.quantity * oi.price_at_purchase) as line_revenue,
           u.first_name as buyer_first_name,
           u.last_name as buyer_last_name,
           COUNT(*) OVER() as total_count
         FROM order_items oi
         JOIN orders o ON o.id = oi.order_id
         JOIN artworks a ON a.id = oi.artwork_id
         JOIN users u ON u.id = o.buyer_id
         WHERE a.artist_id = $1
           AND o.status = 'completed'
           AND COALESCE(o.payment_status, 'paid') = 'paid'
         ORDER BY o.order_date DESC NULLS LAST, oi.id DESC
         LIMIT $2 OFFSET $3`,
        [artistId, parsedLimit, offset]
      );

      const total = parseInt(soldItemsResult.rows[0]?.total_count || 0, 10);

      return res.json({
        success: true,
        sold_paintings: soldItemsResult.rows,
        pagination: {
          page: parsedPage,
          limit: parsedLimit,
          total,
          totalPages: Math.ceil(total / parsedLimit),
        },
      });
    } catch (error) {
      console.error('Get sold paintings error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch sold paintings',
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

      // Get orders stats (artist specific)
      const ordersStats = await db.query(
        `SELECT
           (SELECT COUNT(DISTINCT o.id)
            FROM orders o
            JOIN order_items oi ON o.id = oi.order_id
            JOIN artworks a ON oi.artwork_id = a.id
            WHERE a.artist_id = $1) as total_orders,
           (SELECT COALESCE(SUM(oi.price_at_purchase * oi.quantity), 0)
            FROM orders o
            JOIN order_items oi ON o.id = oi.order_id
            JOIN artworks a ON oi.artwork_id = a.id
            WHERE a.artist_id = $1
              AND o.status = 'completed'
              AND COALESCE(o.payment_status, 'paid') = 'paid') as total_revenue,
           (SELECT COUNT(DISTINCT o.id)
            FROM orders o
            JOIN order_items oi ON o.id = oi.order_id
            JOIN artworks a ON oi.artwork_id = a.id
            WHERE a.artist_id = $1
              AND o.status = 'pending') as pending_orders,
           (SELECT COUNT(DISTINCT o.id)
            FROM orders o
            JOIN order_items oi ON o.id = oi.order_id
            JOIN artworks a ON oi.artwork_id = a.id
            WHERE a.artist_id = $1
              AND o.status = 'processing') as processing_orders,
           (SELECT COUNT(DISTINCT o.id)
            FROM orders o
            JOIN order_items oi ON o.id = oi.order_id
            JOIN artworks a ON oi.artwork_id = a.id
            WHERE a.artist_id = $1
              AND o.status = 'completed') as completed_orders,
           (SELECT COALESCE(SUM(oi.quantity), 0)
            FROM orders o
            JOIN order_items oi ON o.id = oi.order_id
            JOIN artworks a ON oi.artwork_id = a.id
            WHERE a.artist_id = $1
              AND o.status = 'completed'
              AND COALESCE(o.payment_status, 'paid') = 'paid') as paintings_sold,
           (SELECT COALESCE(SUM(oi.price_at_purchase * oi.quantity), 0)
            FROM orders o
            JOIN order_items oi ON o.id = oi.order_id
            JOIN artworks a ON oi.artwork_id = a.id
            WHERE a.artist_id = $1
              AND o.status = 'completed'
              AND COALESCE(o.payment_status, 'paid') = 'paid'
              AND DATE_TRUNC('month', o.order_date) = DATE_TRUNC('month', CURRENT_DATE)) as monthly_revenue,
           (SELECT COALESCE(SUM(oi.quantity), 0)
            FROM orders o
            JOIN order_items oi ON o.id = oi.order_id
            JOIN artworks a ON oi.artwork_id = a.id
            WHERE a.artist_id = $1
              AND o.status = 'completed'
              AND COALESCE(o.payment_status, 'paid') = 'paid'
              AND DATE_TRUNC('month', o.order_date) = DATE_TRUNC('month', CURRENT_DATE)) as monthly_paintings_sold`,
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

      // Get recent sold artworks for this artist
      const recentSoldArtworks = await db.query(
        `SELECT
           oi.id,
           oi.order_id,
           o.order_number,
           o.order_date,
           a.id as artwork_id,
           a.title,
           a.image_url,
           oi.quantity,
           oi.price_at_purchase,
           (oi.quantity * oi.price_at_purchase) as line_revenue,
           u.first_name as buyer_first_name,
           u.last_name as buyer_last_name
         FROM order_items oi
         JOIN orders o ON o.id = oi.order_id
         JOIN artworks a ON a.id = oi.artwork_id
         JOIN users u ON u.id = o.buyer_id
         WHERE a.artist_id = $1
           AND o.status = 'completed'
           AND COALESCE(o.payment_status, 'paid') = 'paid'
         ORDER BY o.order_date DESC NULLS LAST, oi.id DESC
         LIMIT 10`,
        [artistId]
      );

      const stats = {
        artist: artistInfo.rows[0],
        artworks: artworksStats.rows[0],
        orders: ordersStats.rows[0],
        recent_orders: recentOrders.rows,
        popular_artworks: popularArtworks.rows,
        recent_sold_artworks: recentSoldArtworks.rows
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

      const artistRecordReady = await ensureArtistRecord(artistId);
      if (!artistRecordReady) {
        return res.status(403).json({ success: false, message: 'Access denied. Artist only.' });
      }

      await ensureArtistPortfolioColumns();
      await ensureArtworkGalleryColumn();
  await ensureArtworkSubmissionSourceColumn();

      // Ensure files were provided
      const images = (req.files && req.files.images) || [];
      const certificate = (req.files && req.files.certificate && req.files.certificate[0]) || null;
      const { specialization, submission_context } = req.body;
      const submissionSource = submission_context === 'dashboard' ? 'dashboard' : 'portfolio_review';

      // Ensure artist exists
      const artistCheck = await db.query('SELECT id, verification_status FROM artists WHERE id = $1', [artistId]);
      if (artistCheck.rows.length === 0) {
        return res.status(403).json({ success: false, message: 'Artist profile not found' });
      }

      const isVerifiedArtist = artistCheck.rows[0].verification_status === 'verified';
      const minImagesRequired = 1;

      if (!Array.isArray(images) || images.length < minImagesRequired) {
        return res.status(400).json({
          success: false,
          message: 'Please upload at least 1 artwork image.'
        });
      }

      const artworkStatus = isVerifiedArtist ? 'approved' : 'pending';

      const createdArtworks = [];
      const { title, description, category_id, medium, dimensions, price } = req.body;

      const trimmedTitle = title && String(title).trim()
        ? String(title).trim()
        : `Artwork ${new Date().toISOString().slice(0, 10)}`;

      const parsedPrice = Number.isNaN(parseFloat(price)) ? 0 : parseFloat(price);
      if (parsedPrice < 0) {
        return res.status(400).json({ success: false, message: 'Artwork price cannot be negative.' });
      }

      const imageUrls = images.map((file) => `/uploads/artist_portfolio/${file.filename}`);

      // Create one artwork row per uploaded image so admin and artist counts stay consistent.
      for (let i = 0; i < imageUrls.length; i += 1) {
        const imageUrl = imageUrls[i];
        const resolvedTitle = imageUrls.length > 1
          ? `${trimmedTitle} (${i + 1}/${imageUrls.length})`
          : trimmedTitle;

        const result = await db.query(
          `INSERT INTO artworks (
            artist_id, title, description, category_id, medium, dimensions,
            price, image_url, image_urls, status, submission_source, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10, $11, CURRENT_TIMESTAMP)
          RETURNING *`,
          [
            artistId,
            resolvedTitle,
            description && String(description).trim()
              ? String(description).trim()
              : (specialization && specialization.trim() ? specialization.trim() : null),
            category_id ? parseInt(category_id, 10) : null,
            medium && String(medium).trim() ? String(medium).trim() : null,
            dimensions && String(dimensions).trim() ? String(dimensions).trim() : null,
            parsedPrice,
            imageUrl,
            JSON.stringify([imageUrl]),
            artworkStatus,
            submissionSource,
          ]
        );
        createdArtworks.push(result.rows[0]);
      }

      // Keep denormalized count in sync with real artworks table.
      await syncArtistArtworkCount(artistId);

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
        message: isVerifiedArtist
          ? 'Artwork uploaded with all images and published successfully.'
          : 'Portfolio uploaded successfully. Your artwork is pending admin approval.',
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

      const artistRecordReady = await ensureArtistRecord(artistId);
      if (!artistRecordReady) {
        return res.status(403).json({
          success: false,
          message: "Access denied. Artist only."
        });
      }

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

      const artistRecordReady = await ensureArtistRecord(artistId);
      if (!artistRecordReady) {
        return res.status(403).json({
          success: false,
          message: "Access denied. Artist only."
        });
      }

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
