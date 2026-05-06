const db = require("../config/db");

let artworkGalleryColumnEnsured = false;
const ensureArtworkGalleryColumn = async () => {
  if (artworkGalleryColumnEnsured) {
    return;
  }
  await db.query(`
    ALTER TABLE artworks
    ADD COLUMN IF NOT EXISTS image_urls JSONB
  `);
  artworkGalleryColumnEnsured = true;
};

let artworkSubmissionSourceColumnEnsured = false;
const ensureArtworkSubmissionSourceColumn = async () => {
  if (artworkSubmissionSourceColumnEnsured) {
    return;
  }
  await db.query(`
    ALTER TABLE artworks
    ADD COLUMN IF NOT EXISTS submission_source VARCHAR(32) DEFAULT 'dashboard'
  `);
  artworkSubmissionSourceColumnEnsured = true;
};

const buyerController = {
  // Add this method FIRST
  getCategories: async (req, res) => {
    try {
      console.log("📦 Categories endpoint called");
      
      // Try to fetch from database first
      let categories;
      try {
        const result = await db.query(
          "SELECT id, name, slug, description, icon FROM categories WHERE status = 'active' ORDER BY name ASC"
        );
        categories = result.rows;
      } catch (dbError) {
        console.log("Database query failed, using mock data:", dbError.message);
        // Fallback to mock data if table doesn't exist or query fails
        categories = [
          {
            id: 1,
            name: 'Painting',
            slug: 'painting',
            description: 'Traditional and digital paintings',
            icon: '🎨'
          },
          {
            id: 2,
            name: 'Sculpture',
            slug: 'sculpture',
            description: '3D art forms',
            icon: '🗿'
          },
          {
            id: 3,
            name: 'Photography',
            slug: 'photography',
            description: 'Photographic artworks',
            icon: '📸'
          },
          {
            id: 4,
            name: 'Digital Art',
            slug: 'digital-art',
            description: 'Digital creations',
            icon: '💻'
          },
          {
            id: 5,
            name: 'Mixed Media',
            slug: 'mixed-media',
            description: 'Combination of different mediums',
            icon: '🖼️'
          },
          {
            id: 6,
            name: 'Drawing',
            slug: 'drawing',
            description: 'Pencil, ink, and charcoal works',
            icon: '✏️'
          },
          {
            id: 7,
            name: 'Printmaking',
            slug: 'printmaking',
            description: 'Etching, lithography, and screen printing',
            icon: '🖨️'
          },
          {
            id: 8,
            name: 'Textile Art',
            slug: 'textile-art',
            description: 'Fabric and fiber artworks',
            icon: '🧵'
          }
        ];
      }
      
      res.json({
        success: true,
        count: categories.length,
        data: categories,
        message: "Categories fetched successfully"
      });
      
    } catch (error) {
      console.error('Error in getCategories:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch categories',
        error: error.message
      });
    }
  },

  // Public: list artists for discovery
  getPublicArtists: async (req, res) => {
    try {
      const { limit = 6 } = req.query;
      const safeLimit = Math.min(parseInt(limit, 10) || 6, 50);

      const result = await db.query(
        `SELECT
            u.id,
            u.first_name,
            u.last_name,
            u.profile_pic_url,
            u.email,
            a.bio,
            a.verification_status,
            a.total_artworks,
            a.total_sales
         FROM users u
         JOIN artists a ON u.id = a.id
         WHERE u.user_type = 'artist'
           AND u.status = 'active'
           AND a.verification_status = 'verified'
         ORDER BY a.total_sales DESC NULLS LAST, a.total_artworks DESC NULLS LAST, u.created_at DESC
         LIMIT $1`,
        [safeLimit]
      );

      res.json({
        success: true,
        count: result.rows.length,
        data: result.rows,
      });
    } catch (error) {
      console.error('Error in getPublicArtists:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch artists',
      });
    }
  },

  // Public: get single artist details by ID
  getPublicArtistById: async (req, res) => {
    try {
      const { id } = req.params;

      const result = await db.query(
        `SELECT
            u.id,
            u.first_name,
            u.last_name,
            u.email,
            u.profile_pic_url,
            u.created_at,
            a.bio,
            a.city,
            a.country,
            a.contact_email,
            a.phone_number,
            a.website_url,
            a.social_media,
            a.specialization,
            a.verification_status,
            a.total_artworks,
            a.total_sales
         FROM users u
         JOIN artists a ON u.id = a.id
         WHERE u.id = $1
           AND u.user_type = 'artist'
           AND u.status = 'active'
           AND a.verification_status = 'verified'`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Artist not found',
        });
      }

      const artist = result.rows[0];
      if (artist.social_media && typeof artist.social_media === 'string') {
        try {
          artist.social_media = JSON.parse(artist.social_media);
        } catch (e) {
          artist.social_media = {};
        }
      }

      res.json({
        success: true,
        artist,
      });
    } catch (error) {
      console.error('Error in getPublicArtistById:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch artist details',
      });
    }
  },

  // Public: get approved artworks for a single artist
  getPublicArtistArtworks: async (req, res) => {
    try {
      await ensureArtworkSubmissionSourceColumn();
      const { id } = req.params;
      const { page = 1, limit = 24 } = req.query;
      const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

      const result = await db.query(
        `SELECT
            a.id,
            a.artist_id,
            a.title,
            a.description,
            a.price,
            a.image_url,
            a.medium,
            a.dimensions,
            a.created_at,
            COUNT(*) OVER() as total_count
         FROM artworks a
         WHERE a.artist_id = $1
           AND a.status = 'approved'
           AND COALESCE(a.submission_source, 'dashboard') = 'dashboard'
         ORDER BY a.created_at DESC
         LIMIT $2 OFFSET $3`,
        [id, parseInt(limit, 10), offset]
      );

      res.json({
        success: true,
        artworks: result.rows,
        pagination: {
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          total: result.rows[0]?.total_count || 0,
          totalPages: Math.ceil((result.rows[0]?.total_count || 0) / parseInt(limit, 10)),
        },
      });
    } catch (error) {
      console.error('Error in getPublicArtistArtworks:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch artist artworks',
      });
    }
  },

  // Public: homepage stat highlights
  getHomeStats: async (req, res) => {
    try {
      await ensureArtworkSubmissionSourceColumn();
      const artworkStats = await db.query(
        `SELECT COUNT(*)::int as curated_artworks
         FROM artworks
         WHERE status = 'approved'
           AND COALESCE(submission_source, 'dashboard') = 'dashboard'`
      );

      const artistStats = await db.query(
        `SELECT COUNT(*)::int as verified_artists
         FROM artists
         WHERE verification_status = 'verified'`
      );

      const collectorStats = await db.query(
        `SELECT COUNT(*)::int as monthly_collectors
         FROM users
         WHERE user_type = 'buyer'`
      );

      const countryStats = await db.query(
        `SELECT COUNT(DISTINCT TRIM(country))::int as countries_count
         FROM artists
         WHERE verification_status = 'verified'
           AND country IS NOT NULL
           AND TRIM(country) <> ''`
      );

      res.json({
        success: true,
        stats: {
          curated_artworks: artworkStats.rows[0]?.curated_artworks || 0,
          verified_artists: artistStats.rows[0]?.verified_artists || 0,
          monthly_collectors: collectorStats.rows[0]?.monthly_collectors || 0,
          countries_count: countryStats.rows[0]?.countries_count || 0,
        },
      });
    } catch (error) {
      console.error('Error in getHomeStats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch home stats',
      });
    }
  },

  // Get all artworks with pagination and filters
  getArtworks: async (req, res) => {
    try {
      await ensureArtworkGalleryColumn();
      await ensureArtworkSubmissionSourceColumn();
      const {
        page = 1,
        limit = 12,
        category,
        minPrice,
        maxPrice,
        medium,
        artist,
        search,
        sortBy = "created_at",
        sortOrder = "DESC"
      } = req.query;

      const offset = (page - 1) * limit;
      let query = `
        SELECT 
          a.*,
          COALESCE(a.image_urls, jsonb_build_array(a.image_url)) as image_urls,
          u.first_name as artist_first_name,
          u.last_name as artist_last_name,
          u.profile_pic_url as artist_profile_pic,
          ar.verification_status as artist_verification_status,
          c.name as category_name,
          COUNT(*) OVER() as total_count
        FROM artworks a
        JOIN artists ar ON a.artist_id = ar.id
        JOIN users u ON ar.id = u.id
        LEFT JOIN categories c ON a.category_id = c.id
        WHERE a.status = 'approved'
          AND COALESCE(a.submission_source, 'dashboard') = 'dashboard'
      `;

      const params = [];
      let paramIndex = 1;

      // Apply filters
      if (category) {
        query += ` AND c.name ILIKE $${paramIndex}`;
        params.push(`%${category}%`);
        paramIndex++;
      }

      if (minPrice) {
        query += ` AND a.price >= $${paramIndex}`;
        params.push(parseFloat(minPrice));
        paramIndex++;
      }

      if (maxPrice) {
        query += ` AND a.price <= $${paramIndex}`;
        params.push(parseFloat(maxPrice));
        paramIndex++;
      }

      if (medium) {
        query += ` AND a.medium ILIKE $${paramIndex}`;
        params.push(`%${medium}%`);
        paramIndex++;
      }

      if (artist) {
        query += ` AND (u.first_name ILIKE $${paramIndex} OR u.last_name ILIKE $${paramIndex})`;
        params.push(`%${artist}%`);
        paramIndex++;
      }

      if (search) {
        query += ` AND (
          a.title ILIKE $${paramIndex} 
          OR a.description ILIKE $${paramIndex}
          OR u.first_name ILIKE $${paramIndex}
          OR u.last_name ILIKE $${paramIndex}
        )`;
        params.push(`%${search}%`);
        paramIndex++;
      }

      // Apply sorting
      const validSortColumns = ["price", "created_at", "title", "view_count"];
      const sortColumn = validSortColumns.includes(sortBy) ? sortBy : "created_at";
      const order = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";
      
      query += ` ORDER BY a.${sortColumn} ${order}`;
      query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
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
      console.error("Get artworks error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch artworks"
      });
    }
  },

  // Get single artwork by ID
  getArtworkById: async (req, res) => {
    try {
      await ensureArtworkGalleryColumn();
      await ensureArtworkSubmissionSourceColumn();
      const { id } = req.params;

      const result = await db.query(
        `SELECT 
          a.*,
          COALESCE(a.image_urls, jsonb_build_array(a.image_url)) as image_urls,
          u.first_name as artist_first_name,
          u.last_name as artist_last_name,
          u.email as artist_email,
          u.profile_pic_url as artist_profile_pic,
          ar.bio as artist_bio,
          ar.website_url as artist_website,
          ar.social_media as artist_social_media,
          ar.verification_status as artist_verification_status,
          c.name as category_name,
          c.description as category_description
        FROM artworks a
        JOIN artists ar ON a.artist_id = ar.id
        JOIN users u ON ar.id = u.id
        LEFT JOIN categories c ON a.category_id = c.id
        WHERE a.id = $1
          AND a.status = 'approved'
          AND COALESCE(a.submission_source, 'dashboard') = 'dashboard'`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Artwork not found"
        });
      }

      // Increment view count for this specific artwork
      await db.query(
        "UPDATE artworks SET view_count = view_count + 1 WHERE id = $1",
        [id]
      ).catch(console.error);

      // Get similar artworks
      const similarArtworks = await db.query(
        `SELECT a.id, a.title, a.price, a.image_url,
          COALESCE(a.image_urls, jsonb_build_array(a.image_url)) as image_urls,
          a.artist_id,
                u.first_name as artist_first_name, 
                u.last_name as artist_last_name,
                ar.verification_status as artist_verification_status
         FROM artworks a
         JOIN artists ar ON a.artist_id = ar.id
         JOIN users u ON ar.id = u.id
         WHERE a.category_id = $1 
           AND a.id != $2 
           AND a.status = 'approved'
           AND COALESCE(a.submission_source, 'dashboard') = 'dashboard'
         ORDER BY RANDOM()
         LIMIT 4`,
        [result.rows[0].category_id, id]
      );

      // Parse JSON fields
      const artwork = result.rows[0];
      if (artwork.artist_social_media && typeof artwork.artist_social_media === 'string') {
        try {
          artwork.artist_social_media = JSON.parse(artwork.artist_social_media);
        } catch (e) {
          artwork.artist_social_media = {};
        }
      }

      res.json({
        success: true,
        artwork: artwork,
        similarArtworks: similarArtworks.rows
      });

    } catch (error) {
      console.error("Get artwork error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch artwork"
      });
    }
  },

  // Add item to cart
  addToCart: async (req, res) => {
    try {
      await ensureArtworkSubmissionSourceColumn();
      const { artworkId, quantity = 1 } = req.body;
      const buyerId = req.user.id;

      // Check if user is a buyer
      const normalizedUserType = String(req.user?.user_type || '').toLowerCase();
      if (!['buyer', 'user'].includes(normalizedUserType)) {
        return res.status(403).json({
          success: false,
          message: "Only buyers can add items to cart"
        });
      }

      // Check if artwork exists and is available
      const artwork = await db.query(
        `SELECT a.id, a.price, a.status, u.first_name, u.last_name
         FROM artworks a
         JOIN artists ar ON a.artist_id = ar.id
         JOIN users u ON ar.id = u.id
         WHERE a.id = $1
           AND COALESCE(a.submission_source, 'dashboard') = 'dashboard'`,
        [artworkId]
      );

      if (artwork.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Artwork not found"
        });
      }

      if (artwork.rows[0].status !== "approved") {
        return res.status(400).json({
          success: false,
          message: "Artwork is not available for purchase"
        });
      }

      // Check if already in cart
      const existingItem = await db.query(
        "SELECT id, quantity FROM cart WHERE buyer_id = $1 AND artwork_id = $2",
        [buyerId, artworkId]
      );

      let cartItem;
      if (existingItem.rows.length > 0) {
        // Update quantity
        const updated = await db.query(
          "UPDATE cart SET quantity = quantity + $1, added_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *",
          [quantity, existingItem.rows[0].id]
        );
        cartItem = updated.rows[0];
      } else {
        // Add to cart
        const newItem = await db.query(
          `INSERT INTO cart (buyer_id, artwork_id, quantity)
           VALUES ($1, $2, $3)
           RETURNING *`,
          [buyerId, artworkId, quantity]
        );
        cartItem = newItem.rows[0];
      }

      res.json({
        success: true,
        message: "Item added to cart",
        cartItem
      });

    } catch (error) {
      console.error("Add to cart error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to add item to cart"
      });
    }
  },

  // Get cart items
  getCart: async (req, res) => {
    try {
      const buyerId = req.user.id;

      const result = await db.query(
        `SELECT 
          c.id, c.artwork_id, c.quantity, c.added_at,
          a.title, a.price, a.image_url, a.artist_id,
          u.first_name as artist_first_name, 
          u.last_name as artist_last_name,
          ar.verification_status as artist_verification_status
        FROM cart c
        JOIN artworks a ON c.artwork_id = a.id
        JOIN artists ar ON a.artist_id = ar.id
        JOIN users u ON ar.id = u.id
        WHERE c.buyer_id = $1
        ORDER BY c.added_at DESC`,
        [buyerId]
      );

      // Calculate totals
      let subtotal = 0;
      const items = result.rows.map(item => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        return {
          ...item,
          item_total: parseFloat(itemTotal.toFixed(2))
        };
      });

      res.json({
        success: true,
        items,
        subtotal: parseFloat(subtotal.toFixed(2)),
        itemCount: items.reduce((total, item) => total + item.quantity, 0)
      });

    } catch (error) {
      console.error("Get cart error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch cart"
      });
    }
  },

  // Update cart item quantity
  updateCartItem: async (req, res) => {
    try {
      const { id } = req.params;
      const { quantity } = req.body;
      const buyerId = req.user.id;

      // Check if item belongs to buyer
      const item = await db.query(
        "SELECT * FROM cart WHERE id = $1 AND buyer_id = $2",
        [id, buyerId]
      );

      if (item.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Cart item not found"
        });
      }

      if (quantity <= 0) {
        // Remove item
        await db.query("DELETE FROM cart WHERE id = $1", [id]);
        return res.json({
          success: true,
          message: "Item removed from cart"
        });
      }

      const updated = await db.query(
        "UPDATE cart SET quantity = $1 WHERE id = $2 RETURNING *",
        [quantity, id]
      );

      res.json({
        success: true,
        message: "Cart updated",
        cartItem: updated.rows[0]
      });

    } catch (error) {
      console.error("Update cart error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update cart"
      });
    }
  },

  // Remove item from cart
  removeCartItem: async (req, res) => {
    try {
      const { id } = req.params;
      const buyerId = req.user.id;

      const result = await db.query(
        "DELETE FROM cart WHERE id = $1 AND buyer_id = $2 RETURNING id",
        [id, buyerId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Cart item not found"
        });
      }

      res.json({
        success: true,
        message: "Item removed from cart"
      });

    } catch (error) {
      console.error("Remove cart item error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to remove item from cart"
      });
    }
  },

  // Clear cart
  clearCart: async (req, res) => {
    try {
      const buyerId = req.user.id;

      await db.query("DELETE FROM cart WHERE buyer_id = $1", [buyerId]);

      res.json({
        success: true,
        message: "Cart cleared"
      });

    } catch (error) {
      console.error("Clear cart error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to clear cart"
      });
    }
  },

  // Add to wishlist
  addToWishlist: async (req, res) => {
    try {
      await ensureArtworkSubmissionSourceColumn();
      const { artworkId } = req.body;
      const buyerId = req.user.id;

      // Check if user is a buyer
      const normalizedUserType = String(req.user?.user_type || '').toLowerCase();
      if (!['buyer', 'user'].includes(normalizedUserType)) {
        return res.status(403).json({
          success: false,
          message: "Only buyers can add items to wishlist"
        });
      }

      // Check if artwork exists and is approved
      const artwork = await db.query(
        `SELECT a.id, a.title, u.first_name, u.last_name
         FROM artworks a
         JOIN artists ar ON a.artist_id = ar.id
         JOIN users u ON ar.id = u.id
         WHERE a.id = $1
           AND a.status = 'approved'
           AND COALESCE(a.submission_source, 'dashboard') = 'dashboard'`,
        [artworkId]
      );

      if (artwork.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Artwork not found or not approved"
        });
      }

      // Check if already in wishlist
      const existing = await db.query(
        "SELECT id FROM wishlist WHERE buyer_id = $1 AND artwork_id = $2",
        [buyerId, artworkId]
      );

      if (existing.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Already in wishlist"
        });
      }

      const newItem = await db.query(
        `INSERT INTO wishlist (buyer_id, artwork_id)
         VALUES ($1, $2)
         RETURNING *`,
        [buyerId, artworkId]
      );

      res.status(201).json({
        success: true,
        message: "Added to wishlist",
        wishlistItem: newItem.rows[0]
      });

    } catch (error) {
      console.error("Add to wishlist error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to add to wishlist"
      });
    }
  },

  // Get wishlist
  getWishlist: async (req, res) => {
    try {
      await ensureArtworkSubmissionSourceColumn();
      const buyerId = req.user.id;

      const result = await db.query(
        `SELECT 
          w.id, w.artwork_id, w.added_at,
          a.title, a.price, a.image_url, a.artist_id, a.medium, a.dimensions,
          u.first_name as artist_first_name, 
          u.last_name as artist_last_name,
          c.name as category_name
        FROM wishlist w
        JOIN artworks a ON w.artwork_id = a.id
        JOIN users u ON a.artist_id = u.id
        LEFT JOIN categories c ON a.category_id = c.id
        WHERE w.buyer_id = $1
          AND COALESCE(a.submission_source, 'dashboard') = 'dashboard'
        ORDER BY w.added_at DESC`,
        [buyerId]
      );

      res.json({
        success: true,
        items: result.rows
      });

    } catch (error) {
      console.error("Get wishlist error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch wishlist"
      });
    }
  },

  // Remove from wishlist
  removeFromWishlist: async (req, res) => {
    try {
      const { id } = req.params;
      const buyerId = req.user.id;

      const result = await db.query(
        "DELETE FROM wishlist WHERE id = $1 AND buyer_id = $2 RETURNING id",
        [id, buyerId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Wishlist item not found"
        });
      }

      res.json({
        success: true,
        message: "Removed from wishlist"
      });

    } catch (error) {
      console.error("Remove from wishlist error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to remove from wishlist"
      });
    }
  },

  // Create order from cart
  createOrder: async (req, res) => {
    try {
      await ensureArtworkSubmissionSourceColumn();
      const buyerId = req.user.id;
      const { shipping_address, payment_method } = req.body;

      if (!shipping_address || !payment_method) {
        return res.status(400).json({
          success: false,
          message: "Shipping address and payment method are required"
        });
      }

      // Get cart items
      const cartItems = await db.query(
        `SELECT c.artwork_id, c.quantity, a.price, a.artist_id
         FROM cart c
         JOIN artworks a ON c.artwork_id = a.id
         WHERE c.buyer_id = $1
           AND a.status = 'approved'
           AND COALESCE(a.submission_source, 'dashboard') = 'dashboard'`,
        [buyerId]
      );

      if (cartItems.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Cart is empty or contains unavailable items"
        });
      }

      // Calculate total and group by artist for orders
      const ordersByArtist = {};
      let grandTotal = 0;

      cartItems.rows.forEach(item => {
        const itemTotal = item.price * item.quantity;
        grandTotal += itemTotal;

        if (!ordersByArtist[item.artist_id]) {
          ordersByArtist[item.artist_id] = {
            items: [],
            total: 0
          };
        }
        ordersByArtist[item.artist_id].items.push(item);
        ordersByArtist[item.artist_id].total += itemTotal;
      });

      // Start transaction
      const client = await db.pool.connect();
      
      try {
        await client.query('BEGIN');

        // Create orders for each artist
        const orderIds = [];
        
        for (const [artistId, orderData] of Object.entries(ordersByArtist)) {
          const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          
          const orderResult = await client.query(
            `INSERT INTO orders (
              order_number, buyer_id, artist_id, total_amount, 
              status, shipping_address, payment_method, payment_status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id`,
            [
              orderNumber,
              buyerId,
              artistId,
              parseFloat(orderData.total.toFixed(2)),
              'pending',
              JSON.stringify(shipping_address),
              payment_method,
              'pending'
            ]
          );

          const orderId = orderResult.rows[0].id;
          orderIds.push(orderId);

          // Add order items
          for (const item of orderData.items) {
            await client.query(
              `INSERT INTO order_items (order_id, artwork_id, quantity, price, price_at_purchase)
               VALUES ($1, $2, $3, $4, $5)`,
              [orderId, item.artwork_id, item.quantity, item.price, item.price]
            );
          }
        }

        // Clear cart
        await client.query("DELETE FROM cart WHERE buyer_id = $1", [buyerId]);

        await client.query('COMMIT');

        res.status(201).json({
          success: true,
          message: "Order created successfully",
          data: {
            orderIds,
            grandTotal: parseFloat(grandTotal.toFixed(2))
          }
        });

      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }

    } catch (error) {
      console.error("Create order error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create order"
      });
    }
  },

  // Get buyer's orders
  getOrders: async (req, res) => {
    try {
      const buyerId = req.user.id;

      const orders = await db.query(
        `SELECT o.*, 
                u.first_name as artist_first_name,
                u.last_name as artist_last_name,
                u.profile_pic_url as artist_profile_pic,
                COUNT(oi.id) as item_count
         FROM orders o
         LEFT JOIN artists ar ON o.artist_id = ar.id
         LEFT JOIN users u ON ar.id = u.id
         LEFT JOIN order_items oi ON o.id = oi.order_id
         WHERE o.buyer_id = $1
         GROUP BY o.id, u.first_name, u.last_name, u.profile_pic_url
         ORDER BY o.order_date DESC`,
        [buyerId]
      );

      // Get order items for each order
      const ordersWithItems = await Promise.all(
        orders.rows.map(async (order) => {
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
        orders: ordersWithItems
      });

    } catch (error) {
      console.error("Get orders error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch orders"
      });
    }
  }
};

module.exports = buyerController;