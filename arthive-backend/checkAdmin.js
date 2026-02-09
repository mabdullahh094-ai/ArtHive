const db = require('./config/db');
const bcrypt = require('bcryptjs');

(async () => {
  try {
    // Check if admin exists
    const result = await db.query(
      'SELECT id, email, user_type, status FROM users WHERE email = $1',
      ['admin@gmail.com']
    );
    
    if (result.rows.length > 0) {
      console.log('✅ Admin account exists:');
      console.log(JSON.stringify(result.rows[0], null, 2));
    } else {
      console.log('❌ Admin account NOT found. Creating it now...');
      
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('Admin@12345', salt);
      
      const insertResult = await db.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, user_type, status) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING id, email, first_name, last_name, user_type, status`,
        ['admin@gmail.com', passwordHash, 'Admin', 'User', 'admin', 'active']
      );
      
      console.log('✅ Admin account created:');
      console.log(JSON.stringify(insertResult.rows[0], null, 2));
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();
