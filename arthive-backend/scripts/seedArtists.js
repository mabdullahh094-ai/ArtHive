const db = require('../config/db');

async function seed() {
  try {
    // Find existing users and create corresponding artist rows if missing
    const usersRes = await db.query('SELECT id FROM users');
    const userIds = usersRes.rows.map(r => r.id);
    console.log('Found user IDs:', userIds);

    for (const id of userIds) {
      const r = await db.query('SELECT id FROM artists WHERE id = $1', [id]);
      if (r.rows.length > 0) {
        console.log(`Artist ${id} exists, skipping`);
        continue;
      }
      await db.query('INSERT INTO artists (id, bio, website_url, social_media, verification_status, total_artworks, total_sales) VALUES ($1,$2,$3,$4,$5,$6,$7)', [id, '', '', '{}', 'verified', 0, 0]);
      console.log(`Inserted artist ${id}`);
    }
    console.log('Done');
    process.exit(0);
  } catch (e) {
    console.error('Error seeding artists:', e.message);
    process.exit(1);
  }
}

seed();
