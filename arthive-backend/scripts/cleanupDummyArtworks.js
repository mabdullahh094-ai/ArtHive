const db = require('../config/db');

async function cleanupDummyArtworks() {
  try {
    console.log('🧹 Cleaning dummy artworks...');

    const seededTitles = [
      'Abstract Dreams',
      'Urban Rhythm',
      'Serenity',
      'Color Burst',
      "Nature's Canvas",
      'Digital Dreams',
    ];

    const result = await db.query(
      `DELETE FROM artworks
       WHERE title = ANY($1::text[])
         AND image_url ILIKE '%images.unsplash.com%'
       RETURNING id, title`,
      [seededTitles]
    );

    console.log(`✅ Deleted ${result.rowCount} dummy artworks`);
    if (result.rowCount > 0) {
      result.rows.forEach((row) => {
        console.log(` - (${row.id}) ${row.title}`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to cleanup dummy artworks:', error.message);
    process.exit(1);
  }
}

cleanupDummyArtworks();
