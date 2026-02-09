const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const adminController = require("../controllers/admin.controller");

// PUBLIC routes for email-based actions (must be before auth middleware)
router.get("/approve-artist/:token", adminController.approveArtistViaEmail);
router.get("/reject-artist/:token", adminController.rejectArtistViaEmail);

// All admin routes require authentication and admin role
router.use(auth.verifyToken);
router.use(auth.isAdmin);

// Artwork approval routes
router.get("/artworks", adminController.getPendingArtworks);
router.put("/artworks/:id", adminController.updateArtworkStatus);

// Artist approval routes
router.get("/artists", adminController.getPendingArtists);
router.put("/artists/:id", adminController.updateArtistStatus);

// Buyer management routes
router.get("/buyers", adminController.getAllBuyers);

// Dashboard statistics
router.get("/stats", adminController.getDashboardStats);

// Test route
router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Admin routes working!",
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
