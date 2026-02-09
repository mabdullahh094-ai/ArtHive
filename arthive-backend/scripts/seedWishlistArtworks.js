// Script to seed mock artworks into the database for testing wishlist
const db = require('../config/db');

const mockArtworks = [
  {
    id: 1,
    title: 'Abstract Dreams',
    description: 'A vibrant exploration of color and form',
    price: 1200,
    imageUrl: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&auto=format&fit=crop',
    artistId: 1,
    categoryId: 1,
    medium: 'Oil on canvas',
    dimensions: '24" x 36"',
    status: 'approved'
  },
  {
    id: 2,
    title: 'Urban Rhythm',
    description: 'Capturing the pulse of city life',
    price: 850,
    imageUrl: 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=800&auto=format&fit=crop',
    artistId: 3,
    categoryId: 2,
    medium: 'Digital print',
    dimensions: '18" x 24"',
    status: 'approved'
  },
  {
    id: 3,
    title: 'Serenity',
    description: 'A peaceful marble sculpture',
    price: 2100,
    imageUrl: 'https://images.unsplash.com/photo-1543857778-c4a1a569e388?w=800&auto=format&fit=crop',
    artistId: 4,
    categoryId: 3,
    medium: 'Marble',
    dimensions: '15" x 10" x 8"',
    status: 'approved'
  },
  {
    id: 4,
    title: 'Color Burst',
    description: 'An explosive display of color',
    price: 950,
    imageUrl: 'https://images.unsplash.com/photo-1515405295579-ba7b45403062?w=800&auto=format&fit=crop',
    artistId: 5,
    categoryId: 1,
    medium: 'Acrylic',
    dimensions: '20" x 30"',
    status: 'approved'
  },
  {
    id: 5,
    title: 'Nature\'s Canvas',
    description: 'Inspired by the natural world',
    price: 1500,
    imageUrl: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&auto=format&fit=crop',
    artistId: 1,
    categoryId: 1,
    medium: 'Mixed media',
    dimensions: '30" x 40"',
    status: 'approved'
  },
  {
    id: 6,
    title: 'Digital Dreams',
    description: 'A modern take on classic themes',
    price: 700,
    imageUrl: 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=800&auto=format&fit=crop',
    artistId: 6,
    categoryId: 2,
    medium: 'Digital art',
    dimensions: '16" x 20"',
    status: 'approved'
  }
];

async function seedArtworks() {
  try {
    console.log('🌱 Starting to seed mock artworks...');

    for (const artwork of mockArtworks) {
      // Check if artwork already exists
      const existingCheck = await db.query(
        'SELECT id FROM artworks WHERE id = $1',
        [artwork.id]
      );

      if (existingCheck.rows.length > 0) {
        console.log(`⏭️  Artwork ${artwork.id} (${artwork.title}) already exists, skipping...`);
        continue;
      }

      // Insert artwork
      const result = await db.query(
        `INSERT INTO artworks (id, title, description, price, image_url, artist_id, category_id, medium, dimensions, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING id, title`,
        [
          artwork.id,
          artwork.title,
          artwork.description,
          artwork.price,
          artwork.imageUrl,
          artwork.artistId,
          artwork.categoryId,
          artwork.medium,
          artwork.dimensions,
          artwork.status
        ]
      );

      console.log(`✅ Added artwork: ${result.rows[0].title} (ID: ${result.rows[0].id})`);
    }

    console.log('✨ Seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding artworks:', error.message);
    process.exit(1);
  }
}

seedArtworks();
