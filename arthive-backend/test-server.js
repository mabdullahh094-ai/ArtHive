const express = require('express');
const app = express();
app.get('/api/test', (req, res) => {
  res.json({ message: 'Test from 127.0.0.1', timestamp: new Date().toISOString() });
});
app.listen(3001, '127.0.0.1', () => {
  console.log('Server on http://127.0.0.1:3001');
});
