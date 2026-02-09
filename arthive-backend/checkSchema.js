const db = require('./config/db');

async function check() {
  try {
    const categories = await db.query('SELECT id, name FROM categories');
    console.log('Categories:', categories.rows);

    const artworks = await db.query('SELECT id, title, image_url, status FROM artworks LIMIT 5');
    console.log('\nArtworks:', artworks.rows);
    
    process.exit(0);
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}

check();
