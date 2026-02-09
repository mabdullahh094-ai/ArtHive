const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
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

// Debug middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl} - ${new Date().toISOString()}`);
  next();
});

// SIMPLE TEST ROUTE FIRST - before imports
app.get('/api/simple-test', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Simple test before imports',
    timestamp: new Date().toISOString()
  });
});

// Try to import routes (wrap in try-catch)
try {
  const authRoutes = require('./routes/auth.routes');
  app.use('/api/auth', authRoutes);
  console.log('✅ Auth routes loaded');
} catch (error) {
  console.log('⚠️  Auth routes failed:', error.message);
  app.use('/api/auth', (req, res) => res.json({ error: 'Auth routes not loaded' }));
}

try {
  const buyerRoutes = require('./routes/buyer.routes');
  app.use('/api/buyer', buyerRoutes);
  console.log('✅ Buyer routes loaded');
} catch (error) {
  console.log('⚠️  Buyer routes failed:', error.message);
  app.use('/api/buyer', (req, res) => res.json({ error: 'Buyer routes not loaded' }));
}

try {
  const artistRoutes = require('./routes/artist.routes');
  app.use('/api/artist', artistRoutes);
  console.log('✅ Artist routes loaded');
} catch (error) {
  console.log('⚠️  Artist routes failed:', error.message);
  app.use('/api/artist', (req, res) => res.json({ error: 'Artist routes not loaded' }));
}

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
app.get('/api/health', async (req, res) => {
  try {
    const db = require('./config/db');
    await db.query('SELECT 1');
    res.json({ 
      status: 'OK', 
      service: 'ArtHive API',
      database: 'Connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'ERROR', 
      service: 'ArtHive API',
      database: 'Disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

const PORT = config.port || 3001;
// Try different binding addresses
app.listen(PORT, '127.0.0.1', () => {
  console.log(`✅ Server running on http://127.0.0.1:${PORT}`);
  console.log(`✅ Test: http://127.0.0.1:${PORT}/api/test`);
  console.log(`✅ Simple test: http://127.0.0.1:${PORT}/api/simple-test`);
});