const db = require('../config/db');

async function check() {
  try {
    const res = await db.query('SELECT * FROM wishlist ORDER BY id');
    console.log('Wishlist rows:');
    console.table(res.rows);
    process.exit(0);
  } catch (e) {
    console.error('Error querying wishlist:', e.message);
    process.exit(1);
  }
}

check();
