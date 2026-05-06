const jwt = require("jsonwebtoken");

const authMiddleware = {
  // Verify JWT token
  verifyToken: (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided."
      });
    }

    const token = authHeader.split(" ")[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      next();
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Token expired"
        });
      }
      return res.status(401).json({
        success: false,
        message: "Invalid token"
      });
    }
  },

  // Check if user is buyer
  isBuyer: (req, res, next) => {
    const normalizedUserType = String(req.user?.user_type || "").toLowerCase();
    if (!["buyer", "user"].includes(normalizedUserType)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Buyer only."
      });
    }
    next();
  },

  // Check if user is artist
  isArtist: (req, res, next) => {
    const normalizedUserType = String(req.user?.user_type || "").toLowerCase();
    if (normalizedUserType !== "artist") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Artist only."
      });
    }
    next();
  },

  // Check if user is admin
  isAdmin: (req, res, next) => {
    const normalizedUserType = String(req.user?.user_type || "").toLowerCase();
    if (normalizedUserType !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin only."
      });
    }
    next();
  }
};

module.exports = authMiddleware;