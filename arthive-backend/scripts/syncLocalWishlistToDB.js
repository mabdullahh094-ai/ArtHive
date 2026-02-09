const db = require('../config/db');

// Usage: node syncLocalWishlistToDB.js "[1,2,3]" [buyerId]
// Example: node syncLocalWishlistToDB.js "[1,2]" 1

async function sync() {
  try {
    const arg = process.argv[2];
    const buyerId = parseInt(process.argv[3]) || 1;
    if (!arg) {
      console.error('Provide artwork IDs JSON array as first arg, e.g. "[1,2]"');
      process.exit(1);
    }
    let artworkIds;
    try {
      artworkIds = JSON.parse(arg);
    } catch (e) {
      console.error('Failed to parse artwork IDs JSON:', e.message);
      process.exit(1);
    }

    for (const artworkId of artworkIds) {
      // Check artwork exists and approved
      const artworkCheck = await db.query('SELECT id FROM artworks WHERE id = $1 AND status = $2', [artworkId, 'approved']);
      if (artworkCheck.rows.length === 0) {
        console.log(`Artwork ${artworkId} not found/approved - skipping`);
        continue;
      }

      // Check if already in wishlist
      const existing = await db.query('SELECT id FROM wishlist WHERE buyer_id = $1 AND artwork_id = $2', [buyerId, artworkId]);
      if (existing.rows.length > 0) {
        console.log(`Artwork ${artworkId} already in wishlist`);
        continue;
      }

      const res = await db.query('INSERT INTO wishlist (buyer_id, artwork_id) VALUES ($1,$2) RETURNING id', [buyerId, artworkId]);
      console.log(`Inserted wishlist item id=${res.rows[0].id} for artwork ${artworkId}`);
    }

    console.log('Sync complete');
    process.exit(0);
  } catch (e) {
    console.error('Sync error:', e.message);
    process.exit(1);
  }
}

sync();
