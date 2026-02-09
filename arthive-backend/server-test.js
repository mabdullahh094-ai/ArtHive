const express = require('express');
const app = express();
const PORT = 3001;

// Minimal middleware
app.use((req, res, next) => {
  console.log('Test middleware reached');
  next();
});

// Simple test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Direct test', timestamp: new Date().toISOString() });
});

// Root route
app.get('/', (req, res) => {
  res.json({ status: 'OK', server: 'Test Express' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Test server on http://localhost:${PORT}`);
  console.log(`Also on http://127.0.0.1:${PORT}`);
});
