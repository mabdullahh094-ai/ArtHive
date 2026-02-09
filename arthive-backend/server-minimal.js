const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Basic middleware
app.use(cors());
app.use(express.json());

// Test route
app.get('/api', (req, res) => {
  res.json({ 
    message: 'ArtHive API',
    version: '1.0',
    status: 'running'
  });
});

// Database test route
app.get('/api/test-db', async (req, res) => {
  try {
    const { Pool } = require('pg');
    const pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'arthive',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
    });
    
    const result = await pool.query('SELECT NOW() as time');
    res.json({
      db: 'connected',
      time: result.rows[0].time,
      status: 'OK'
    });
    await pool.end();
  } catch (error) {
    res.status(500).json({
      db: 'error',
      error: error.message,
      status: 'FAILED'
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`✅ Test: http://localhost:${PORT}/api`);
  console.log(`✅ DB Test: http://localhost:${PORT}/api/test-db`);
});