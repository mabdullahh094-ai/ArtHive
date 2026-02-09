const db = require('./config/db');
const bcrypt = require('bcryptjs');

(async () => {
  try {
    const email = 'admin@gmail.com';
    const passwordToTest = 'Admin@12345';

    const result = await db.query('SELECT id, email, password_hash, user_type, status FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      console.log('❌ No user found for', email);
      process.exit(0);
    }

    const user = result.rows[0];
    const isValid = await bcrypt.compare(passwordToTest, user.password_hash);

    console.log('User:', { id: user.id, email: user.email, user_type: user.user_type, status: user.status });
    console.log('Password matches?', isValid);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
