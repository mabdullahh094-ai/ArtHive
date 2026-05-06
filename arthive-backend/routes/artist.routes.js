const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const artistController = require("../controllers/artist.controller");
const priceRecommendationController = require("../controllers/priceRecommendation.controller");
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer storage for artist uploads
const uploadsDir = path.join(__dirname, '..', 'uploads', 'artist_portfolio');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Temp directory for image analysis
const tempDir = path.join(__dirname, '..', 'uploads', 'temp_predictions');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
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

// Temp storage for price prediction images
const tempStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, tempDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `prediction-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({ storage });
const uploadTemp = multer({ storage: tempStorage, limits: { fileSize: 10 * 1024 * 1024 } });

// Public routes (before auth middleware)
router.get("/", artistController.getAllArtists);
router.get("/prediction-info", priceRecommendationController.getPredictionInfo);

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

// Image Analysis route (for smart auto-fill)
router.post("/analyze-image", priceRecommendationController.analyzeImage);

// Price Recommendation routes
// Protected route - predict price for artwork (accepts image file upload)
router.post("/predict-price", uploadTemp.single('image'), priceRecommendationController.predictPrice);

// Order management routes
router.get("/orders", artistController.getArtistOrders);
router.get("/sold-paintings", artistController.getSoldPaintings);
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