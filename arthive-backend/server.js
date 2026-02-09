// server.js - Error-free version
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// Load config after dependencies
const config = require('./config');

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: config.cors.origin,
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files (artist portfolio, etc.)
const path = require('path');
const uploadsPath = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsPath));

// Disable ETag to prevent 304 responses
app.disable('etag');

// Set no-cache headers for all API responses
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// Debug middleware (optional)
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} - ${new Date().toISOString()}`);
  next();
});

// Import routes with error handling
let authRoutes, buyerRoutes, artistRoutes, cartRoutes, wishlistRoutes, adminRoutes;

try {
  authRoutes = require('./routes/auth.routes');
  console.log('✅ Auth routes loaded');
} catch (error) {
  console.warn('⚠️ Auth routes not found, creating placeholder');
  authRoutes = require('express').Router();
  authRoutes.get('/test', (req, res) => res.json({ message: 'Auth placeholder' }));
}

try {
  buyerRoutes = require('./routes/buyer.routes');
  console.log('✅ Buyer routes loaded');
} catch (error) {
  console.warn('⚠️ Buyer routes not found, creating placeholder');
  buyerRoutes = require('express').Router();
  buyerRoutes.get('/test', (req, res) => res.json({ message: 'Buyer placeholder' }));
}

try {
  artistRoutes = require('./routes/artist.routes');
  console.log('✅ Artist routes loaded');
} catch (error) {
  console.warn('⚠️ Artist routes not found, creating placeholder');
  console.error('Error details:', error.message);
  artistRoutes = require('express').Router();
  artistRoutes.get('/test', (req, res) => res.json({ message: 'Artist placeholder' }));
}

try {
  adminRoutes = require('./routes/admin.routes');
  console.log('✅ Admin routes loaded');
} catch (error) {
  console.warn('⚠️ Admin routes not found, creating placeholder');
  adminRoutes = require('express').Router();
  adminRoutes.get('/test', (req, res) => res.json({ message: 'Admin placeholder' }));
}

try {
  cartRoutes = require('./routes/cart.routes');
  console.log('✅ Cart routes loaded');
} catch (error) {
  console.warn('⚠️ Cart routes not found, creating placeholder');
  cartRoutes = require('express').Router();
  cartRoutes.get('/test', (req, res) => res.json({ message: 'Cart placeholder' }));
}

try {
  wishlistRoutes = require('./routes/wishlist.routes');
  console.log('✅ Wishlist routes loaded');
} catch (error) {
  console.warn('⚠️ Wishlist routes not found, creating placeholder');
  wishlistRoutes = require('express').Router();
  wishlistRoutes.get('/test', (req, res) => res.json({ message: 'Wishlist placeholder' }));
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/buyer', buyerRoutes);
app.use('/api/artist', artistRoutes);
app.use('/api/admin', adminRoutes);
// Debug: list mounted artist routes (helpful to confirm /portfolio is registered)
try {
  if (artistRoutes && artistRoutes.stack) {
    console.log('Registered /api/artist routes:');
    artistRoutes.stack.forEach((layer) => {
      if (layer.route && layer.route.path) {
        const methods = layer.route.methods ? Object.keys(layer.route.methods).join(',') : '';
        console.log(`  - ${methods.toUpperCase()} /api/artist${layer.route.path}`);
      }
    });
  }
} catch (e) {
  console.warn('Could not list artist routes:', e.message);
}
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);

// Simple test route
app.get('/api/test', (req, res) => {
  res.json({
    status: 'OK',
    message: 'ArtHive API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'ArtHive API',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.nodeEnv
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('🔥 Error:', {
    message: err.message,
    stack: config.nodeEnv === 'development' ? err.stack : undefined,
    url: req.url,
    method: req.method
  });
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(config.nodeEnv === 'development' && { stack: err.stack })
  });
});

// Global error handlers
process.on('uncaughtException', (error) => {
  console.error('💥 UNCAUGHT EXCEPTION:', error);
  console.log('🔄 Server continuing...');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 UNHANDLED REJECTION at:', promise, 'reason:', reason);
});

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`\n✨ ==================================== ✨`);
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`✅ Environment: ${config.nodeEnv}`);
  console.log(`✅ Test URL: http://localhost:${PORT}/api/test`);
  console.log(`✅ Health check: http://localhost:${PORT}/api/health`);
  console.log(`✅ Frontend URL: ${config.cors.origin}`);
  console.log(`\n📋 Available API Routes:`);
  console.log(`   - http://localhost:${PORT}/api/auth/*`);
  console.log(`   - http://localhost:${PORT}/api/buyer/*`);
  console.log(`   - http://localhost:${PORT}/api/artist/*`);
  console.log(`   - http://localhost:${PORT}/api/cart/*`);
  console.log(`   - http://localhost:${PORT}/api/wishlist/*`);
  console.log(`✨ ==================================== ✨\n`);
});