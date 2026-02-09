const db = require('./config/db');

async function getArtists() {
  try {
    const result = await db.query('SELECT id, first_name, last_name FROM users');
    console.log('All users:');
    result.rows.forEach(r => console.log(`  ID ${r.id}: ${r.first_name} ${r.last_name}`));
    process.exit(0);
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}

getArtists();
