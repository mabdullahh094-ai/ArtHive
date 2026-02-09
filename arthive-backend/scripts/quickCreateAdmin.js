// Quick admin account creation (non-interactive)
const db = require('../config/db');
const bcrypt = require('bcryptjs');

// Default admin credentials
const ADMIN_EMAIL = 'admin@gmail.com';
const ADMIN_PASSWORD = 'Admin@12345';
const FIRST_NAME = 'Admin';
const LAST_NAME = 'User';

async function createQuickAdmin() {
  try {
    console.log('\n🔐 Creating Admin Account...\n');

    // Check if admin already exists
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [ADMIN_EMAIL]
    );

    if (existingUser.rows.length > 0) {
      console.log('⚠️  Admin already exists with email:', ADMIN_EMAIL);
      console.log('\n✅ Use these credentials to login:');
      console.log(`   Email: ${ADMIN_EMAIL}`);
      console.log(`   Password: ${ADMIN_PASSWORD}\n`);
      process.exit(0);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, salt);

    // Insert admin user
    const result = await db.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, user_type, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, first_name, last_name, user_type, created_at`,
      [ADMIN_EMAIL, passwordHash, FIRST_NAME, LAST_NAME, 'admin', 'active']
    );

    console.log('✅ Admin account created successfully!\n');
    console.log('📋 Admin Details:');
    console.log(`   Email: ${result.rows[0].email}`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);
    console.log(`   Name: ${result.rows[0].first_name} ${result.rows[0].last_name}`);
    console.log(`   User Type: ${result.rows[0].user_type}`);
    console.log(`   Status: active`);
    console.log(`   Created: ${new Date(result.rows[0].created_at).toLocaleString()}`);
    console.log('\n🌐 Now you can login at:');
    console.log('   http://localhost:3000/login\n');
    console.log('📌 Login credentials:');
    console.log(`   Email: ${ADMIN_EMAIL}`);
    console.log(`   Password: ${ADMIN_PASSWORD}\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin account:', error.message);
    process.exit(1);
  }
}

createQuickAdmin();
