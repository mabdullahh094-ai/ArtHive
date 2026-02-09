const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const artistController = require("../controllers/artist.controller");
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer storage for artist uploads
const uploadsDir = path.join(__dirname, '..', 'uploads', 'artist_portfolio');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({ storage });

// Public routes (before auth middleware)
router.get("/", artistController.getAllArtists);

// Apply auth middleware to artist routes (protected)
router.use(auth.verifyToken);
router.use(auth.isArtist);

// Profile management routes
router.get("/profile", artistController.getProfile);
router.post("/complete-profile", artistController.completeProfile);

// Artwork management routes
router.post("/artworks", artistController.createArtwork);
router.get("/artworks", artistController.getArtistArtworks);
router.put("/artworks/:id", artistController.updateArtwork);
router.delete("/artworks/:id", artistController.deleteArtwork);

// Portfolio upload route (expecting fields: specialization (string), and optional certificate file)
// multipart/form-data with field name `images` (array of files) and optional `certificate` file
console.log('Registering route: POST /api/artist/portfolio');
router.post('/portfolio', upload.fields([{ name: 'images', maxCount: 20 }, { name: 'certificate', maxCount: 1 }]), artistController.uploadPortfolio);

// Order management routes
router.get("/orders", artistController.getArtistOrders);
router.put("/orders/:id", artistController.updateOrderStatus);

// Dashboard routes
router.get("/dashboard", artistController.getDashboardStats);

// Test route
router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Artist routes working!",
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;