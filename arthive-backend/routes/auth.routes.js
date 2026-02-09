const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const auth = require("../middleware/auth");

// -------------------- Public Routes --------------------
router.post("/register", authController.register);
router.post("/login", authController.login);

// -------------------- Protected Routes --------------------
router.get("/profile", auth.verifyToken, authController.getProfile);
router.put("/profile", auth.verifyToken, authController.updateProfile);

// -------------------- Test Route --------------------
router.get("/test", (req, res) => {
  res.json({ 
    success: true,
    message: "Auth routes working!",
    timestamp: new Date().toISOString()
  });
});

module.exports = router;