const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const auth = require("../middleware/auth");
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const profilePicsDir = path.join(__dirname, '..', 'uploads', 'profile_pics');
if (!fs.existsSync(profilePicsDir)) {
  fs.mkdirSync(profilePicsDir, { recursive: true });
}

const profilePicStorage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, profilePicsDir);
  },
  filename: function (_req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `profile-${uniqueSuffix}${ext}`);
  },
});

const profilePicUpload = multer({ storage: profilePicStorage });

// -------------------- Public Routes --------------------
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);

// -------------------- Protected Routes --------------------
router.get("/profile", auth.verifyToken, authController.getProfile);
router.put("/profile", auth.verifyToken, profilePicUpload.single('profile_pic'), authController.updateProfile);

// -------------------- Test Route --------------------
router.get("/test", (req, res) => {
  res.json({ 
    success: true,
    message: "Auth routes working!",
    timestamp: new Date().toISOString()
  });
});

module.exports = router;