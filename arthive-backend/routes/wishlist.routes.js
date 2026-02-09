const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Helper function to get wishlist with artwork details
const getWishlistWithDetails = async (buyerId) => {
    const query = `
        SELECT
            w.id as wishlist_item_id,
            w.buyer_id,
            w.artwork_id,
            w.added_at,
            a.title,
            a.description,
            a.price,
            a.image_url,
            a.artist_id,
            u.first_name as artist_first_name,
            u.last_name as artist_last_name,
            cat.name as category_name
        FROM wishlist w
        JOIN artworks a ON w.artwork_id = a.id
        JOIN users u ON a.artist_id = u.id
        LEFT JOIN categories cat ON a.category_id = cat.id
        WHERE w.buyer_id = $1 AND a.status = 'approved'
        ORDER BY w.added_at DESC
    `;
    
    const result = await db.query(query, [buyerId]);
    return result.rows;
};

// Get wishlist items
router.get("/", async (req, res) => {
    try {
        // Explicitly set no-cache headers for this response
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        
        // TODO: Get buyerId from authentication
        const buyerId = parseInt(req.query.buyerId) || 1;
        
        const wishlistItems = await getWishlistWithDetails(buyerId);
        
        // Calculate totals
        let totalValue = 0;
        let totalItems = wishlistItems.length;
        
        wishlistItems.forEach(item => {
            totalValue += parseFloat(item.price);
        });
        
        const averagePrice = totalItems > 0 ? totalValue / totalItems : 0;
        
        res.status(200).json({
            success: true,
            message: "Wishlist items fetched successfully",
            data: {
                buyerId,
                items: wishlistItems.map(item => ({
                    id: item.wishlist_item_id,
                    wishlistItemId: item.wishlist_item_id,
                    artworkId: item.artwork_id,
                    title: item.title,
                    description: item.description,
                    price: parseFloat(item.price),
                    imageUrl: item.image_url,
                    artist: {
                        id: item.artist_id,
                        name: `${item.artist_first_name} ${item.artist_last_name}`
                    },
                    category: item.category_name,
                    addedAt: item.added_at
                })),
                summary: {
                    totalItems,
                    totalValue: parseFloat(totalValue.toFixed(2)),
                    averagePrice: parseFloat(averagePrice.toFixed(2))
                }
            }
        });
    } catch (error) {
        console.error("Error fetching wishlist:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch wishlist items",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Add item to wishlist
router.post("/items", async (req, res) => {
    try {
        const { artworkId } = req.body;
        
        // TODO: Get buyerId from authentication
        const buyerId = parseInt(req.query.buyerId) || 1;

        if (!artworkId) {
            return res.status(400).json({
                success: false,
                message: "Artwork ID is required"
            });
        }

        // Check if artwork exists and is available
        const artworkCheck = await db.query(
            'SELECT id, title, price, image_url, status FROM artworks WHERE id = $1 AND status = $2',
            [artworkId, 'approved']
        );

        if (artworkCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Artwork not found or not available"
            });
        }

        // Check if already in wishlist
        const existingWishlistItem = await db.query(
            'SELECT id FROM wishlist WHERE buyer_id = $1 AND artwork_id = $2',
            [buyerId, artworkId]
        );

        if (existingWishlistItem.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Artwork is already in your wishlist"
            });
        }

        // Add to wishlist
        const wishlistItem = await db.query(
            `INSERT INTO wishlist (buyer_id, artwork_id)
             VALUES ($1, $2)
             RETURNING *`,
            [buyerId, artworkId]
        );

        const artwork = artworkCheck.rows[0];
        
        res.status(201).json({
            success: true,
            message: "Item added to wishlist successfully",
            data: {
                id: wishlistItem.rows[0].id,
                wishlistItemId: wishlistItem.rows[0].id,
                artworkId: artworkId,
                title: artwork.title,
                price: parseFloat(artwork.price),
                imageUrl: artwork.image_url,
                addedAt: wishlistItem.rows[0].added_at
            }
        });
    } catch (error) {
        console.error("Error adding to wishlist:", error);
        res.status(500).json({
            success: false,
            message: "Failed to add item to wishlist",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Remove item from wishlist
router.delete("/items/:id", async (req, res) => {
    try {
        const { id } = req.params;
        
        // TODO: Get buyerId from authentication
        const buyerId = parseInt(req.query.buyerId) || 1;

        // Check if wishlist item belongs to buyer
        const wishlistItemCheck = await db.query(
            'SELECT * FROM wishlist WHERE id = $1 AND buyer_id = $2',
            [id, buyerId]
        );

        if (wishlistItemCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Wishlist item not found"
            });
        }

        await db.query('DELETE FROM wishlist WHERE id = $1', [id]);

        res.status(200).json({
            success: true,
            message: "Item removed from wishlist successfully",
            data: {
                wishlistItemId: id,
                removed: true,
                removedAt: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error("Error removing from wishlist:", error);
        res.status(500).json({
            success: false,
            message: "Failed to remove item from wishlist",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Move item from wishlist to cart
router.post("/items/:id/move-to-cart", async (req, res) => {
    try {
        const { id } = req.params;
        const { quantity = 1 } = req.body;
        
        // TODO: Get buyerId from authentication
        const buyerId = parseInt(req.query.buyerId) || 1;

        // Get wishlist item details
        const wishlistItem = await db.query(
            `SELECT w.*, a.title, a.price, a.image_url
             FROM wishlist w
             JOIN artworks a ON w.artwork_id = a.id
             WHERE w.id = $1 AND w.buyer_id = $2`,
            [id, buyerId]
        );

        if (wishlistItem.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Wishlist item not found"
            });
        }

        const artworkId = wishlistItem.rows[0].artwork_id;

        // Check if already in cart
        const existingCartItem = await db.query(
            'SELECT id, quantity FROM cart WHERE buyer_id = $1 AND artwork_id = $2',
            [buyerId, artworkId]
        );

        let cartItem;
        
        if (existingCartItem.rows.length > 0) {
            // Update quantity
            const newQuantity = existingCartItem.rows[0].quantity + quantity;
            cartItem = await db.query(
                'UPDATE cart SET quantity = $1 WHERE id = $2 RETURNING *',
                [newQuantity, existingCartItem.rows[0].id]
            );
        } else {
            // Insert new cart item
            cartItem = await db.query(
                `INSERT INTO cart (buyer_id, artwork_id, quantity)
                 VALUES ($1, $2, $3)
                 RETURNING *`,
                [buyerId, artworkId, quantity]
            );
        }

        // Remove from wishlist
        await db.query('DELETE FROM wishlist WHERE id = $1', [id]);

        res.status(200).json({
            success: true,
            message: "Item moved to cart successfully",
            data: {
                wishlistItemId: id,
                cartItemId: cartItem.rows[0].id,
                moved: true,
                movedAt: new Date().toISOString(),
                quantity: cartItem.rows[0].quantity,
                artwork: {
                    id: artworkId,
                    title: wishlistItem.rows[0].title,
                    price: parseFloat(wishlistItem.rows[0].price),
                    imageUrl: wishlistItem.rows[0].image_url
                }
            }
        });
    } catch (error) {
        console.error("Error moving to cart:", error);
        res.status(500).json({
            success: false,
            message: "Failed to move item to cart",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Check if item is in wishlist
router.get("/check/:artworkId", async (req, res) => {
    try {
        const { artworkId } = req.params;
        
        // TODO: Get buyerId from authentication
        const buyerId = parseInt(req.query.buyerId) || 1;

        const result = await db.query(
            `SELECT w.id as wishlist_item_id, a.title, a.price
             FROM wishlist w
             JOIN artworks a ON w.artwork_id = a.id
             WHERE w.buyer_id = $1 AND w.artwork_id = $2`,
            [buyerId, artworkId]
        );

        const inWishlist = result.rows.length > 0;

        res.status(200).json({
            success: true,
            data: {
                artworkId,
                inWishlist,
                wishlistItemId: inWishlist ? result.rows[0].wishlist_item_id : null,
                artwork: inWishlist ? {
                    title: result.rows[0].title,
                    price: parseFloat(result.rows[0].price)
                } : null
            }
        });
    } catch (error) {
        console.error("Error checking wishlist:", error);
        res.status(500).json({
            success: false,
            message: "Failed to check wishlist status",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get wishlist count
router.get("/count", async (req, res) => {
    try {
        // TODO: Get buyerId from authentication
        const buyerId = parseInt(req.query.buyerId) || 1;
        
        const result = await db.query(
            'SELECT COUNT(*) as item_count FROM wishlist WHERE buyer_id = $1',
            [buyerId]
        );

        res.status(200).json({
            success: true,
            data: {
                count: parseInt(result.rows[0].item_count)
            }
        });
    } catch (error) {
        console.error("Error getting wishlist count:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get wishlist count",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;