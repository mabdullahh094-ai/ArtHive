const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Helper function to get cart with artwork details
const getCartWithDetails = async (buyerId) => {
    const query = `
        SELECT 
            c.id as cart_item_id,
            c.buyer_id,
            c.artwork_id,
            c.quantity,
            c.added_at,
            a.title,
            a.description,
            a.price,
            a.image_url,
            a.artist_id,
            u.first_name as artist_first_name,
            u.last_name as artist_last_name,
            cat.name as category_name
        FROM cart c
        JOIN artworks a ON c.artwork_id = a.id
        JOIN users u ON a.artist_id = u.id
        LEFT JOIN categories cat ON a.category_id = cat.id
        WHERE c.buyer_id = $1 AND a.status = 'approved'
        ORDER BY c.added_at DESC
    `;
    
    const result = await db.query(query, [buyerId]);
    return result.rows;
};

// Get all cart items for the current user
router.get("/", async (req, res) => {
    try {
        // Explicitly set no-cache headers for this response
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        
        // TODO: Get buyerId from authentication middleware (req.user.id)
        // For now, use query parameter or default
        const buyerId = parseInt(req.query.buyerId) || 1; // Default to user ID 1 for testing
        
        const cartItems = await getCartWithDetails(buyerId);
        
        // Calculate totals
        let subtotal = 0;
        let itemCount = 0;
        
        cartItems.forEach(item => {
            subtotal += item.price * item.quantity;
            itemCount += item.quantity;
        });
        
        const shipping = subtotal > 1000 ? 0 : 50; // Free shipping over $1000
        const tax = subtotal * 0.1; // 10% tax
        const total = subtotal + shipping + tax;
        
        res.status(200).json({
            success: true,
            message: "Cart items fetched successfully",
            data: {
                buyerId,
                items: cartItems.map(item => ({
                    id: item.cart_item_id,
                    cartItemId: item.cart_item_id,
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
                    quantity: item.quantity,
                    addedAt: item.added_at,
                    subtotal: parseFloat(item.price) * item.quantity
                })),
                summary: {
                    subtotal: parseFloat(subtotal.toFixed(2)),
                    shipping: parseFloat(shipping.toFixed(2)),
                    tax: parseFloat(tax.toFixed(2)),
                    total: parseFloat(total.toFixed(2))
                },
                itemCount
            }
        });
    } catch (error) {
        console.error("Error fetching cart:", error);
        res.status(500).json({ 
            success: false, 
            message: "Failed to fetch cart items",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Add item to cart
router.post("/items", async (req, res) => {
    try {
        const { artworkId, quantity = 1 } = req.body;
        
        // TODO: Get buyerId from authentication
        const buyerId = parseInt(req.query.buyerId) || 1;

        if (!artworkId) {
            return res.status(400).json({
                success: false,
                message: "Artwork ID is required"
            });
        }

        // Validate quantity
        if (quantity < 1 || quantity > 10) {
            return res.status(400).json({
                success: false,
                message: "Quantity must be between 1 and 10"
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
            // Insert new
            cartItem = await db.query(
                `INSERT INTO cart (buyer_id, artwork_id, quantity) 
                 VALUES ($1, $2, $3) 
                 RETURNING *`,
                [buyerId, artworkId, quantity]
            );
        }

        const artwork = artworkCheck.rows[0];
        
        res.status(201).json({
            success: true,
            message: existingCartItem.rows.length > 0 ? 
                "Cart item quantity updated" : "Item added to cart successfully",
            data: {
                id: cartItem.rows[0].id,
                cartItemId: cartItem.rows[0].id,
                artworkId: artworkId,
                title: artwork.title,
                price: parseFloat(artwork.price),
                imageUrl: artwork.image_url,
                quantity: cartItem.rows[0].quantity,
                addedAt: cartItem.rows[0].added_at
            }
        });
    } catch (error) {
        console.error("Error adding to cart:", error);
        res.status(500).json({ 
            success: false, 
            message: "Failed to add item to cart",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Update item quantity
router.put("/items/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { quantity } = req.body;
        
        // TODO: Get buyerId from authentication
        const buyerId = parseInt(req.query.buyerId) || 1;

        if (!quantity || quantity < 0) {
            return res.status(400).json({
                success: false,
                message: "Valid quantity is required"
            });
        }

        // Check if cart item belongs to buyer
        const cartItemCheck = await db.query(
            'SELECT * FROM cart WHERE id = $1 AND buyer_id = $2',
            [id, buyerId]
        );

        if (cartItemCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Cart item not found"
            });
        }

        if (quantity === 0) {
            // Remove item
            await db.query('DELETE FROM cart WHERE id = $1', [id]);
            return res.json({
                success: true,
                message: "Item removed from cart",
                data: { removed: true, cartItemId: id }
            });
        }

        // Update quantity
        const updatedItem = await db.query(
            'UPDATE cart SET quantity = $1 WHERE id = $2 RETURNING *',
            [quantity, id]
        );

        // Get artwork details for response
        const artworkDetails = await db.query(
            `SELECT a.title, a.price, a.image_url 
             FROM artworks a 
             JOIN cart c ON c.artwork_id = a.id 
             WHERE c.id = $1`,
            [id]
        );

        res.status(200).json({
            success: true,
            message: "Cart item updated successfully",
            data: {
                id: updatedItem.rows[0].id,
                artworkId: updatedItem.rows[0].artwork_id,
                title: artworkDetails.rows[0]?.title || '',
                price: parseFloat(artworkDetails.rows[0]?.price || 0),
                imageUrl: artworkDetails.rows[0]?.image_url || '',
                quantity: updatedItem.rows[0].quantity,
                updatedAt: updatedItem.rows[0].added_at
            }
        });
    } catch (error) {
        console.error("Error updating cart item:", error);
        res.status(500).json({ 
            success: false, 
            message: "Failed to update cart item",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Remove item from cart
router.delete("/items/:id", async (req, res) => {
    try {
        const { id } = req.params;
        
        // TODO: Get buyerId from authentication
        const buyerId = parseInt(req.query.buyerId) || 1;

        // Check if cart item belongs to buyer
        const cartItemCheck = await db.query(
            'SELECT * FROM cart WHERE id = $1 AND buyer_id = $2',
            [id, buyerId]
        );

        if (cartItemCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Cart item not found"
            });
        }

        await db.query('DELETE FROM cart WHERE id = $1', [id]);

        res.status(200).json({
            success: true,
            message: "Item removed from cart successfully",
            data: { 
                cartItemId: id,
                removed: true,
                removedAt: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error("Error removing from cart:", error);
        res.status(500).json({ 
            success: false, 
            message: "Failed to remove item from cart",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Clear entire cart
router.delete("/clear", async (req, res) => {
    try {
        // TODO: Get buyerId from authentication
        const buyerId = parseInt(req.query.buyerId) || 1;
        
        // Get count before deletion for response
        const cartCount = await db.query(
            'SELECT COUNT(*) FROM cart WHERE buyer_id = $1',
            [buyerId]
        );
        
        await db.query('DELETE FROM cart WHERE buyer_id = $1', [buyerId]);

        res.status(200).json({
            success: true,
            message: "Cart cleared successfully",
            data: {
                buyerId,
                cleared: true,
                clearedAt: new Date().toISOString(),
                itemsRemoved: parseInt(cartCount.rows[0].count)
            }
        });
    } catch (error) {
        console.error("Error clearing cart:", error);
        res.status(500).json({ 
            success: false, 
            message: "Failed to clear cart",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get cart count (useful for frontend badge)
router.get("/count", async (req, res) => {
    try {
        // TODO: Get buyerId from authentication
        const buyerId = parseInt(req.query.buyerId) || 1;
        
        const result = await db.query(
            'SELECT COUNT(*) as item_count, COALESCE(SUM(quantity), 0) as total_quantity FROM cart WHERE buyer_id = $1',
            [buyerId]
        );

        res.status(200).json({
            success: true,
            data: {
                uniqueItems: parseInt(result.rows[0].item_count),
                totalQuantity: parseInt(result.rows[0].total_quantity)
            }
        });
    } catch (error) {
        console.error("Error getting cart count:", error);
        res.status(500).json({ 
            success: false, 
            message: "Failed to get cart count",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;