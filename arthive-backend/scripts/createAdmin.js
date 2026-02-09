// scripts/createAdmin.js
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (prompt) => new Promise((resolve) => {
  rl.question(prompt, resolve);
});

async function createAdmin() {
  try {
    console.log('\n🔐 Admin Account Creation\n');

    // Check for command-line arguments
    let email, password, confirmPassword, firstName, lastName;

    if (process.argv.length >= 7) {
      // Command line mode: node createAdmin.js email password firstname lastname
      email = process.argv[2];
      password = process.argv[3];
      confirmPassword = process.argv[3]; // Auto-confirm
      firstName = process.argv[4];
      lastName = process.argv[5];
      console.log(`Creating admin: ${firstName} ${lastName} (${email})`);
    } else {
      // Interactive mode
      email = await question('Enter admin email: ');
      password = await question('Enter admin password: ');
      confirmPassword = await question('Confirm admin password: ');
      firstName = await question('Enter first name: ');
      lastName = await question('Enter last name: ');
    }

    // Validate inputs
    if (!email || !password || !firstName || !lastName) {
      console.log('❌ All fields are required');
      rl.close();
      return;
    }

    if (password !== confirmPassword) {
      console.log('❌ Passwords do not match');
      rl.close();
      return;
    }

    if (password.length < 8) {
      console.log('❌ Password must be at least 8 characters');
      rl.close();
      return;
    }

    // Check if admin already exists
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      console.log('❌ User with this email already exists');
      rl.close();
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert admin user
    const result = await db.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, user_type, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, first_name, last_name, user_type, created_at`,
      [email, passwordHash, firstName, lastName, 'admin', 'active']
    );

    console.log('\n✅ Admin account created successfully!\n');
    console.log('Admin Details:');
    console.log(`Email: ${result.rows[0].email}`);
    console.log(`Name: ${result.rows[0].first_name} ${result.rows[0].last_name}`);
    console.log(`User Type: ${result.rows[0].user_type}`);
    console.log(`Created: ${new Date(result.rows[0].created_at).toLocaleString()}`);
    console.log('\n📌 Login at: http://localhost:3000/login');
    console.log('📌 Then access admin dashboard at: http://localhost:3000/admin\n');

    rl.close();
  } catch (error) {
    console.error('❌ Error creating admin account:', error.message);
    rl.close();
    process.exit(1);
  }
}

createAdmin();
