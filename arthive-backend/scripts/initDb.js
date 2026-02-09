// scripts/initDb.js
const db = require('../config/db');

async function initializeDatabase() {
  try {
    console.log('🔄 Initializing database...');

    // Create users table
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        user_type VARCHAR(50) CHECK (user_type IN ('buyer', 'artist', 'admin')),
        profile_pic_url TEXT,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create categories table
    await db.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create artists table
    await db.query(`
      CREATE TABLE IF NOT EXISTS artists (
        id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        bio TEXT,
        website_url VARCHAR(255),
        social_media JSONB,
        verification_status VARCHAR(50) DEFAULT 'pending',
        total_artworks INTEGER DEFAULT 0,
        total_sales DECIMAL(10,2) DEFAULT 0
      );
    `);

    // Create artworks table
    await db.query(`
      CREATE TABLE IF NOT EXISTS artworks (
        id SERIAL PRIMARY KEY,
        artist_id INTEGER REFERENCES artists(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        category_id INTEGER REFERENCES categories(id),
        medium VARCHAR(100),
        dimensions VARCHAR(100),
        price DECIMAL(10,2) NOT NULL,
        image_url TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        ai_authenticity_score DECIMAL(3,2),
        ai_price_recommendation DECIMAL(10,2),
        view_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create cart table
    await db.query(`
      CREATE TABLE IF NOT EXISTS cart (
        id SERIAL PRIMARY KEY,
        buyer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        artwork_id INTEGER REFERENCES artworks(id) ON DELETE CASCADE,
        quantity INTEGER DEFAULT 1,
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(buyer_id, artwork_id)
      );
    `);

    // Create wishlist table
    await db.query(`
      CREATE TABLE IF NOT EXISTS wishlist (
        id SERIAL PRIMARY KEY,
        buyer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        artwork_id INTEGER REFERENCES artworks(id) ON DELETE CASCADE,
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(buyer_id, artwork_id)
      );
    `);

    // Create orders table
    await db.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        order_number VARCHAR(50) UNIQUE NOT NULL,
        buyer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        artist_id INTEGER REFERENCES artists(id) ON DELETE CASCADE,
        total_amount DECIMAL(10,2) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        shipping_address JSONB NOT NULL,
        payment_method VARCHAR(100),
        payment_status VARCHAR(50) DEFAULT 'pending',
        order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create order items table
    await db.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
        artwork_id INTEGER REFERENCES artworks(id),
        quantity INTEGER NOT NULL,
        price_at_purchase DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes
    await db.query('CREATE INDEX IF NOT EXISTS idx_artworks_artist_id ON artworks(artist_id)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_artworks_category_id ON artworks(category_id)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_cart_buyer_id ON cart(buyer_id)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_wishlist_buyer_id ON wishlist(buyer_id)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON orders(buyer_id)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_orders_order_date ON orders(order_date DESC)');

    // Insert sample categories
    const categories = [
      'Painting',
      'Digital Art',
      'Photography',
      'Sculpture'
    ];

    for (const category of categories) {
      await db.query(
        'INSERT INTO categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
        [category]
      );
    }

    console.log('✅ Database initialized successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

initializeDatabase();