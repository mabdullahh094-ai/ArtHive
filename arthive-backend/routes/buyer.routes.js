const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const buyerController = require("../controllers/buyer.controller");

// PUBLIC ROUTES (no authentication required)
router.get("/categories", buyerController.getCategories);
router.get("/artworks", buyerController.getArtworks);
router.get("/artworks/:id", buyerController.getArtworkById);
router.get("/artists", buyerController.getPublicArtists);
router.get("/artists/:id", buyerController.getPublicArtistById);
router.get("/artists/:id/artworks", buyerController.getPublicArtistArtworks);
router.get("/stats", buyerController.getHomeStats);

// Apply auth middleware to protected routes
router.use(auth.verifyToken);

// PROTECTED ROUTES (require authentication)
// Cart routes (buyer only)
router.get("/cart", auth.isBuyer, buyerController.getCart);
router.post("/cart", auth.isBuyer, buyerController.addToCart);
router.put("/cart/:id", auth.isBuyer, buyerController.updateCartItem);
router.delete("/cart/:id", auth.isBuyer, buyerController.removeCartItem);
router.delete("/cart", auth.isBuyer, buyerController.clearCart);

// Wishlist routes (accessible by both buyer and artist)
router.get("/wishlist", buyerController.getWishlist);
router.post("/wishlist", buyerController.addToWishlist);
router.delete("/wishlist/:id", buyerController.removeFromWishlist);

// Order routes (buyer only)
router.post("/orders", auth.isBuyer, buyerController.createOrder);
router.get("/orders", auth.isBuyer, buyerController.getOrders);

// Test route (protected)
router.get("/test", auth.isBuyer, (req, res) => {
  res.json({
    success: true,
    message: "Buyer routes working!",
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;