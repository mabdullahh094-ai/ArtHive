const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...\n');

    // 1. Create admin user
    console.log('👤 Creating admin user...');
    const adminEmail = 'admin@art-hive.tech';
    const adminPassword = 'ArtHive@Admin123';
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const adminCheck = await pool.query('SELECT id FROM users WHERE email = $1', [adminEmail]);
    if (adminCheck.rows.length === 0) {
      const adminResult = await pool.query(
        'INSERT INTO users (email, password_hash, user_type, status, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING id, email, user_type',
        [adminEmail, hashedPassword, 'admin', 'active']
      );
      console.log('   ✅ Admin user created:', adminResult.rows[0]);
    } else {
      console.log('   ℹ️  Admin user already exists');
    }

    // 2. Verify categories
    console.log('\n📂 Verifying categories...');
    const categories = [
      { name: 'Painting', description: 'Oil, acrylic, and watercolor paintings' },
      { name: 'Digital Art', description: 'Digital paintings, illustrations, and graphics' },
      { name: 'Photography', description: 'Professional and artistic photography' },
      { name: 'Sculpture', description: '3D sculptures and installations' },
      { name: 'Prints', description: 'Limited edition and numbered prints' },
      { name: 'Mixed Media', description: 'Combined art forms and experimental media' }
    ];

    for (const cat of categories) {
      const exists = await pool.query('SELECT id FROM categories WHERE name = $1', [cat.name]);
      if (exists.rows.length === 0) {
        const result = await pool.query(
          'INSERT INTO categories (name, description, created_at) VALUES ($1, $2, NOW()) RETURNING id, name',
          [cat.name, cat.description]
        );
        console.log('   ✅ Category created:', result.rows[0].name);
      } else {
        console.log('   ℹ️  Category exists:', cat.name);
      }
    }

    // 3. Create test artist
    console.log('\n🎨 Creating test artist...');
    const testArtistEmail = 'testartist@art-hive.tech';
    const artistCheck = await pool.query('SELECT u.id FROM users u LEFT JOIN artists a ON u.id = a.id WHERE u.email = $1', [testArtistEmail]);
    
    let artistUserId;
    if (artistCheck.rows.length === 0) {
      const artistHashedPassword = await bcrypt.hash('TestArtist@123', 10);
      const artistUserResult = await pool.query(
        'INSERT INTO users (email, password_hash, user_type, status, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING id',
        [testArtistEmail, artistHashedPassword, 'artist', 'active']
      );
      artistUserId = artistUserResult.rows[0].id;

      await pool.query(
        'INSERT INTO artists (id, bio, city, country, verification_status) VALUES ($1, $2, $3, $4, $5)',
        [artistUserId, 'Test artist for demo purposes', 'Test City', 'Test Country', 'verified']
      );
      console.log('   ✅ Test artist created (Email: testartist@art-hive.tech, Password: TestArtist@123)');
    } else {
      artistUserId = artistCheck.rows[0].id;
      
      // Verify artist profile exists
      const artistProfileCheck = await pool.query('SELECT id FROM artists WHERE id = $1', [artistUserId]);
      if (artistProfileCheck.rows.length === 0) {
        await pool.query(
          'INSERT INTO artists (id, bio, city, country, verification_status) VALUES ($1, $2, $3, $4, $5)',
          [artistUserId, 'Test artist for demo purposes', 'Test City', 'Test Country', 'verified']
        );
        console.log('   ✅ Test artist profile created');
      } else {
        console.log('   ℹ️  Test artist already exists');
      }
    }

    // 4. Create sample artworks
    console.log('\n🖼️  Creating sample artworks...');
    const paintingCat = await pool.query('SELECT id FROM categories WHERE name = $1', ['Painting']);
    const paintingCatId = paintingCat.rows[0]?.id;

    if (paintingCatId && artistUserId) {
      const sampleArtworks = [
        { title: 'Sunset Over Mountains', price: 1500, image: 'https://via.placeholder.com/500x500?text=Sunset' },
        { title: 'Abstract Dreams', price: 2000, image: 'https://via.placeholder.com/500x500?text=Abstract' },
        { title: 'Urban Landscape', price: 1200, image: 'https://via.placeholder.com/500x500?text=Urban' }
      ];

      for (const art of sampleArtworks) {
        const exists = await pool.query('SELECT id FROM artworks WHERE title = $1 AND artist_id = $2', [art.title, artistUserId]);
        if (exists.rows.length === 0) {
          const result = await pool.query(
            'INSERT INTO artworks (artist_id, title, category_id, price, image_url, created_at) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING id, title, price',
            [artistUserId, art.title, paintingCatId, art.price, art.image]
          );
          console.log(`   ✅ Artwork created: ${result.rows[0].title} ($${result.rows[0].price})`);
        } else {
          console.log(`   ℹ️  Artwork already exists: ${art.title}`);
        }
      }
    }

    console.log('\n✅ Database seeding complete!\n');
    console.log('📋 ADMIN CREDENTIALS:');
    console.log('   Email: admin@art-hive.tech');
    console.log('   Password: ArtHive@Admin123');
    console.log('\n📋 TEST ARTIST CREDENTIALS:');
    console.log('   Email: testartist@art-hive.tech');
    console.log('   Password: TestArtist@123');
    console.log('\n💡 Use these to test the application end-to-end\n');

    await pool.end();
  } catch (err) {
    console.error('❌ Seeding error:', err.message);
    console.error(err);
    await pool.end();
    process.exit(1);
  }
}

seedDatabase();
