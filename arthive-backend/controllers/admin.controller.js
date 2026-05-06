const db = require("../config/db");
const jwt = require("jsonwebtoken");
const emailService = require("../services/emailService");

const ensureArtworkSubmissionSourceColumn = async () => {
  await db.query(`
    ALTER TABLE artworks
    ADD COLUMN IF NOT EXISTS submission_source VARCHAR(32) DEFAULT 'dashboard'
  `);
};

const syncArtistReviewArtworks = async (artistId, verificationStatus, client = db) => {
  const mappedStatus = verificationStatus === 'verified' ? 'approved' : 'rejected';

  await client.query(
    `UPDATE artworks
     SET status = $1,
         submission_source = 'portfolio_review'
     WHERE artist_id = $2
       AND status = 'pending'`,
    [mappedStatus, artistId]
  );
};

const adminController = {
  // Get pending artworks
  getPendingArtworks: async (req, res) => {
    try {
      const { page = 1, limit = 12 } = req.query;
      const offset = (page - 1) * limit;

      const result = await db.query(
        `SELECT 
           a.*,
           u.first_name as artist_first_name,
           u.last_name as artist_last_name,
           u.email as artist_email,
           COUNT(*) OVER() as total_count
         FROM artworks a
         JOIN users u ON a.artist_id = u.id
         WHERE a.status = 'pending'
         ORDER BY a.created_at DESC
         LIMIT $1 OFFSET $2`,
        [parseInt(limit), offset]
      );

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
      console.error("Get pending artworks error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch pending artworks"
      });
    }
  },

  // Approve or reject an artwork
  updateArtworkStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      // Validate status
      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Status must be 'approved' or 'rejected'"
        });
      }

      // Update artwork status
      const result = await db.query(
        `UPDATE artworks
         SET status = $1
         WHERE id = $2
         RETURNING *`,
        [status, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Artwork not found"
        });
      }

      res.json({
        success: true,
        message: `Artwork ${status} successfully`,
        artwork: result.rows[0]
      });
    } catch (error) {
      console.error("Update artwork status error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update artwork status"
      });
    }
  },

  // Get all pending artists
  getPendingArtists: async (req, res) => {
    try {
      const { page = 1, limit = 12 } = req.query;
      const offset = (page - 1) * limit;

      const result = await db.query(
        `SELECT 
           a.*,
           u.email,
           u.first_name,
           u.last_name,
           u.profile_pic_url,
           u.created_at as signup_date,
           COUNT(*) OVER() as total_count
         FROM artists a
         JOIN users u ON a.id = u.id
         WHERE a.verification_status = 'pending'
         ORDER BY u.created_at DESC
         LIMIT $1 OFFSET $2`,
        [parseInt(limit), offset]
      );

      res.json({
        success: true,
        artists: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: result.rows[0]?.total_count || 0,
          totalPages: Math.ceil((result.rows[0]?.total_count || 0) / limit)
        }
      });
    } catch (error) {
      console.error("Get pending artists error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch pending artists"
      });
    }
  },

  // Get full artist profile details for admin review
  getArtistProfileDetails: async (req, res) => {
    try {
      const { id } = req.params;

      const artistResult = await db.query(
        `SELECT
           a.*,
           u.email,
           u.first_name,
           u.last_name,
           u.profile_pic_url,
           u.created_at as signup_date
         FROM artists a
         JOIN users u ON a.id = u.id
         WHERE a.id = $1`,
        [id]
      );

      if (artistResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Artist not found'
        });
      }

      const artworksResult = await db.query(
        `SELECT id, title, description, image_url, price, status, created_at
         FROM artworks
         WHERE artist_id = $1
         ORDER BY created_at DESC
         LIMIT 50`,
        [id]
      );

      res.json({
        success: true,
        artist: artistResult.rows[0],
        artworks: artworksResult.rows
      });
    } catch (error) {
      console.error('Get artist profile details error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch artist profile details'
      });
    }
  },

  // Approve or reject an artist
  updateArtistStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { verification_status } = req.body;

      await ensureArtworkSubmissionSourceColumn();

      // Validate status
      if (!['verified', 'rejected'].includes(verification_status)) {
        return res.status(400).json({
          success: false,
          message: "verification_status must be 'verified' or 'rejected'"
        });
      }

      if (verification_status === 'verified') {
        const artworkCountResult = await db.query(
          `SELECT COUNT(*)::int AS submitted_artworks
           FROM artworks
           WHERE artist_id = $1`,
          [id]
        );

        const submittedArtworks = artworkCountResult.rows[0]?.submitted_artworks || 0;
        if (submittedArtworks < 4) {
          return res.status(400).json({
            success: false,
            message: 'Artist must submit at least 4 artworks before approval'
          });
        }
      }

      const client = await db.pool.connect();
      let result;

      try {
        await client.query('BEGIN');

        result = await client.query(
          `UPDATE artists
           SET verification_status = $1
           WHERE id = $2
           RETURNING *`,
          [verification_status, id]
        );

        if (result.rows.length === 0) {
          await client.query('ROLLBACK');
          return res.status(404).json({
            success: false,
            message: "Artist not found"
          });
        }

        await syncArtistReviewArtworks(id, verification_status, client);

        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }

      res.json({
        success: true,
        message: `Artist ${verification_status} successfully`,
        artist: result.rows[0]
      });
    } catch (error) {
      console.error("Update artist status error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update artist status"
      });
    }
  },

  // Get all buyers
  getAllBuyers: async (req, res) => {
    try {
      const { page = 1, limit = 50 } = req.query;
      const offset = (page - 1) * limit;

      const result = await db.query(
        `SELECT
           u.id,
           u.email,
           u.first_name,
           u.last_name,
           u.profile_pic_url,
           u.status,
           u.created_at,
           COUNT(DISTINCT o.id) as order_count,
           COUNT(*) OVER() as total_count
         FROM users u
         LEFT JOIN orders o ON u.id = o.buyer_id
         WHERE u.user_type = 'buyer'
         GROUP BY u.id
         ORDER BY u.created_at DESC
         LIMIT $1 OFFSET $2`,
        [parseInt(limit), offset]
      );

      res.json({
        success: true,
        buyers: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: result.rows[0]?.total_count || 0,
          totalPages: Math.ceil((result.rows[0]?.total_count || 0) / limit)
        }
      });
    } catch (error) {
      console.error("Get all buyers error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch buyers"
      });
    }
  },

  // Get all orders for admin with revenue summary
  getAllOrders: async (req, res) => {
    try {
      const { page = 1, limit = 50 } = req.query;
      const parsedPage = parseInt(page, 10);
      const parsedLimit = parseInt(limit, 10);
      const offset = (parsedPage - 1) * parsedLimit;

      const ordersResult = await db.query(
        `SELECT
           o.id,
           o.order_number,
           o.total_amount,
           o.status,
           o.created_at,
           o.tracking_number,
           u.first_name as buyer_first_name,
           u.last_name as buyer_last_name,
           u.email as buyer_email,
           COUNT(*) OVER() as total_count
         FROM orders o
         JOIN users u ON o.buyer_id = u.id
         ORDER BY o.created_at DESC
         LIMIT $1 OFFSET $2`,
        [parsedLimit, offset]
      );

      const revenueResult = await db.query(
        `SELECT
           COUNT(*) as total_orders,
           COUNT(*) FILTER (WHERE status = 'completed') as completed_orders,
           COALESCE(SUM(total_amount), 0) as gross_revenue,
           COALESCE(SUM(total_amount) FILTER (WHERE status = 'completed'), 0) as completed_revenue
         FROM orders`
      );

      const revenue = revenueResult.rows[0] || {};

      return res.json({
        success: true,
        orders: ordersResult.rows,
        revenue: {
          total_orders: parseInt(revenue.total_orders || 0, 10),
          completed_orders: parseInt(revenue.completed_orders || 0, 10),
          gross_revenue: parseFloat(revenue.gross_revenue || 0).toFixed(2),
          completed_revenue: parseFloat(revenue.completed_revenue || 0).toFixed(2),
        },
        pagination: {
          page: parsedPage,
          limit: parsedLimit,
          total: ordersResult.rows[0]?.total_count || 0,
          totalPages: Math.ceil((ordersResult.rows[0]?.total_count || 0) / parsedLimit)
        }
      });
    } catch (error) {
      console.error('Get all orders error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch orders'
      });
    }
  },

  // Get dashboard statistics
  getDashboardStats: async (req, res) => {
    try {
      // Get artwork stats
      const artworkStats = await db.query(
        `SELECT
           COUNT(*) as total_artworks,
           COUNT(*) FILTER (WHERE status = 'pending') as pending_artworks,
           COUNT(*) FILTER (WHERE status = 'approved') as approved_artworks,
           COUNT(*) FILTER (WHERE status = 'rejected') as rejected_artworks
         FROM artworks`
      );

      // Get artist stats
      const artistStats = await db.query(
        `SELECT
           COUNT(*) as total_artists,
           COUNT(*) FILTER (WHERE verification_status = 'pending') as pending_artists,
           COUNT(*) FILTER (WHERE verification_status = 'verified') as verified_artists
         FROM artists`
      );

      // Get buyer stats
      const buyerStats = await db.query(
        `SELECT COUNT(*) as total_buyers
         FROM users
         WHERE user_type = 'buyer'`
      );

      // Get revenue stats
      const revenueStats = await db.query(
        `SELECT COALESCE(SUM(total_amount), 0) as total_revenue
         FROM orders
         WHERE status = 'completed'`
      );

      res.json({
        success: true,
        stats: {
          total_artworks: parseInt(artworkStats.rows[0].total_artworks),
          pending_artworks: parseInt(artworkStats.rows[0].pending_artworks),
          approved_artworks: parseInt(artworkStats.rows[0].approved_artworks),
          rejected_artworks: parseInt(artworkStats.rows[0].rejected_artworks),
          total_artists: parseInt(artistStats.rows[0].total_artists),
          pending_artists: parseInt(artistStats.rows[0].pending_artists),
          verified_artists: parseInt(artistStats.rows[0].verified_artists),
          total_buyers: parseInt(buyerStats.rows[0].total_buyers),
          total_revenue: parseFloat(revenueStats.rows[0].total_revenue).toFixed(2)
        }
      });
    } catch (error) {
      console.error("Get dashboard stats error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch dashboard statistics"
      });
    }
  },

  // Approve artist via email link
  approveArtistViaEmail: async (req, res) => {
    try {
      const { token } = req.params;

      await ensureArtworkSubmissionSourceColumn();

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const { artistId, action } = decoded;

      if (action !== 'approve') {
        return res.status(400).send(`
          <!DOCTYPE html>
          <html><body style="font-family: Arial; padding: 40px; text-align: center;">
            <h1 style="color: #f44336;">❌ Invalid Action</h1>
            <p>This link is not valid for approval.</p>
          </body></html>
        `);
      }

      const client = await db.pool.connect();
      let result;

      try {
        await client.query('BEGIN');
        result = await client.query(
          `UPDATE artists SET verification_status = 'verified' WHERE id = $1 RETURNING *`,
          [artistId]
        );

        if (result.rows.length === 0) {
          await client.query('ROLLBACK');
          return res.status(404).send(`
          <!DOCTYPE html>
          <html><body style="font-family: Arial; padding: 40px; text-align: center;">
            <h1 style="color: #f44336;">❌ Artist Not Found</h1>
            <p>The artist could not be found in the database.</p>
          </body></html>
        `);
        }

        await syncArtistReviewArtworks(artistId, 'verified', client);
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }

      // Get artist details to send confirmation email
      const artistDetails = await db.query(
        `SELECT u.email, u.first_name, u.last_name FROM users u WHERE u.id = $1`,
        [artistId]
      );

      // Send confirmation email to artist
      if (artistDetails.rows.length > 0) {
        const artist = artistDetails.rows[0];
        await emailService.sendArtistApprovalEmail(artist, 'approved');
      }

      // Return success page
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; text-align: center; background: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            h1 { color: #4CAF50; }
            .icon { font-size: 60px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">✅</div>
            <h1>Artist Approved Successfully!</h1>
            <p>The artist has been verified and can now upload artworks.</p>
            <p>A confirmation email has been sent to the artist.</p>
          </div>
        </body>
        </html>
      `);

    } catch (error) {
      console.error("Approve artist via email error:", error);
      res.status(500).send(`
        <!DOCTYPE html>
        <html><body style="font-family: Arial; padding: 40px; text-align: center;">
          <h1 style="color: #f44336;">❌ Error</h1>
          <p>Failed to approve artist. ${error.message === 'jwt expired' ? 'This link has expired.' : 'Please try again later.'}</p>
        </body></html>
      `);
    }
  },

  // Reject artist via email link
  rejectArtistViaEmail: async (req, res) => {
    try {
      const { token } = req.params;

      await ensureArtworkSubmissionSourceColumn();

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const { artistId, action } = decoded;

      if (action !== 'reject') {
        return res.status(400).send(`
          <!DOCTYPE html>
          <html><body style="font-family: Arial; padding: 40px; text-align: center;">
            <h1 style="color: #f44336;">❌ Invalid Action</h1>
            <p>This link is not valid for rejection.</p>
          </body></html>
        `);
      }

      const client = await db.pool.connect();
      let result;

      try {
        await client.query('BEGIN');
        result = await client.query(
          `UPDATE artists SET verification_status = 'rejected' WHERE id = $1 RETURNING *`,
          [artistId]
        );

        if (result.rows.length === 0) {
          await client.query('ROLLBACK');
          return res.status(404).send(`
          <!DOCTYPE html>
          <html><body style="font-family: Arial; padding: 40px; text-align: center;">
            <h1 style="color: #f44336;">❌ Artist Not Found</h1>
            <p>The artist could not be found in the database.</p>
          </body></html>
        `);
        }

        await syncArtistReviewArtworks(artistId, 'rejected', client);
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }

      // Get artist details to send confirmation email
      const artistDetails = await db.query(
        `SELECT u.email, u.first_name, u.last_name FROM users u WHERE u.id = $1`,
        [artistId]
      );

      // Send confirmation email to artist
      if (artistDetails.rows.length > 0) {
        const artist = artistDetails.rows[0];
        await emailService.sendArtistApprovalEmail(artist, 'rejected');
      }

      // Return success page
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; text-align: center; background: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            h1 { color: #FF9800; }
            .icon { font-size: 60px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">⚠️</div>
            <h1>Artist Rejected</h1>
            <p>The artist application has been rejected.</p>
            <p>A notification email has been sent to the artist.</p>
          </div>
        </body>
        </html>
      `);

    } catch (error) {
      console.error("Reject artist via email error:", error);
      res.status(500).send(`
        <!DOCTYPE html>
        <html><body style="font-family: Arial; padding: 40px; text-align: center;">
          <h1 style="color: #f44336;">❌ Error</h1>
          <p>Failed to reject artist. ${error.message === 'jwt expired' ? 'This link has expired.' : 'Please try again later.'}</p>
        </body></html>
      `);
    }
  }
};

module.exports = adminController;
