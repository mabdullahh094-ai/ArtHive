const db = require('./config/db');

async function getSchema() {
  try {
    const result = await db.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'artworks'");
    console.log('Artworks table columns:');
    result.rows.forEach(r => console.log(`  ${r.column_name}: ${r.data_type}`));
    process.exit(0);
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}

getSchema();
