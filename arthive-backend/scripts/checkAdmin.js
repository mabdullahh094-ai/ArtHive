// Temporary script to check admin users
const db = require('../config/db');

async function checkAdminUsers() {
  try {
    console.log('\n🔍 Checking for admin users in database...\n');
    
    const result = await db.query(
      `SELECT id, email, user_type, status, created_at
       FROM users
       WHERE user_type = $1`,
      ['admin']
    );

    if (result.rows.length === 0) {
      console.log('❌ NO ADMIN USERS FOUND!');
      console.log('\n📝 You need to create an admin account first:');
      console.log('   node scripts/createAdmin.js admin@test.com Test@1234 Admin User\n');
    } else {
      console.log(`✅ Found ${result.rows.length} admin user(s):\n`);
      result.rows.forEach(user => {
        console.log(`   Email: ${user.email}`);
        console.log(`   Status: ${user.status}`);
        console.log(`   User Type: ${user.user_type}`);
        console.log(`   Created: ${user.created_at}`);
        console.log(`   ID: ${user.id}`);
        console.log('');
      });
      console.log('✅ Admin account exists. Use these credentials to login.\n');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database error:', error.message);
    console.log('\n💡 Make sure:');
    console.log('   1. PostgreSQL is running');
    console.log('   2. Database exists');
    console.log('   3. .env file has correct credentials\n');
    process.exit(1);
  }
}

checkAdminUsers();
