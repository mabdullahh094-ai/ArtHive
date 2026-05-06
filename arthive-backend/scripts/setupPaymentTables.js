const db = require('../config/db');

async function createOrdersTables() {
  try {
    console.log('🔧 Setting up Orders tables...');

    // Create orders table
    await db.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        order_number VARCHAR(50) UNIQUE NOT NULL,
        buyer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        total_amount DECIMAL(12, 2) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled')),
        payment_intent_id VARCHAR(255) UNIQUE,
        shipping_address JSONB,
        billing_address JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_buyer_id FOREIGN KEY (buyer_id) REFERENCES users(id)
      )
    `);

    console.log('✅ orders table created/verified');

    // Create order_items table
    await db.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        artwork_id INTEGER NOT NULL REFERENCES artworks(id) ON DELETE CASCADE,
        artist_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        quantity INTEGER NOT NULL CHECK (quantity > 0),
        price DECIMAL(12, 2) NOT NULL,
        price_at_purchase DECIMAL(12, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_order_id FOREIGN KEY (order_id) REFERENCES orders(id),
        CONSTRAINT fk_artwork_id FOREIGN KEY (artwork_id) REFERENCES artworks(id),
        CONSTRAINT fk_artist_id FOREIGN KEY (artist_id) REFERENCES users(id)
      )
    `);

    console.log('✅ order_items table created/verified');

    await db.query(`
      ALTER TABLE order_items
      ADD COLUMN IF NOT EXISTS artist_id INTEGER
    `);

    await db.query(`
      ALTER TABLE order_items
      ADD COLUMN IF NOT EXISTS price DECIMAL(12, 2)
    `);

    await db.query(`
      ALTER TABLE order_items
      ADD COLUMN IF NOT EXISTS price_at_purchase DECIMAL(12, 2)
    `);

    await db.query(`
      UPDATE order_items oi
      SET artist_id = a.artist_id
      FROM artworks a
      WHERE oi.artist_id IS NULL
        AND oi.artwork_id = a.id
    `);

    await db.query(`
      UPDATE order_items oi
      SET price = a.price
      FROM artworks a
      WHERE oi.price IS NULL
        AND oi.artwork_id = a.id
    `);

    await db.query(`
      UPDATE order_items oi
      SET price_at_purchase = a.price
      FROM artworks a
      WHERE oi.price_at_purchase IS NULL
        AND oi.artwork_id = a.id
    `);

    await db.query(`
      ALTER TABLE order_items
      ALTER COLUMN artist_id SET NOT NULL
    `).catch(() => {});

    await db.query(`
      ALTER TABLE order_items
      ALTER COLUMN price SET NOT NULL
    `).catch(() => {});

    await db.query(`
      ALTER TABLE order_items
      ALTER COLUMN price_at_purchase SET NOT NULL
    `).catch(() => {});

    await db.query(`
      ALTER TABLE order_items
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    `);

    // Create payment_transactions table for additional tracking
    await db.query(`
      CREATE TABLE IF NOT EXISTS payment_transactions (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
        payment_intent_id VARCHAR(255) UNIQUE,
        stripe_charge_id VARCHAR(255),
        amount DECIMAL(12, 2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'USD',
        status VARCHAR(50) DEFAULT 'pending',
        transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        metadata JSONB,
        CONSTRAINT fk_order_payment FOREIGN KEY (order_id) REFERENCES orders(id)
      )
    `);

    console.log('✅ payment_transactions table created/verified');

    console.log('✅ All payment tables setup complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up tables:', error);
    process.exit(1);
  }
}

createOrdersTables();
