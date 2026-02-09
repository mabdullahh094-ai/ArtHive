const db = require('../config/db');
(async ()=>{
  try{
    const res = await db.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='artists'");
    console.log('Artists table columns:');
    res.rows.forEach(r=>console.log(`  ${r.column_name}: ${r.data_type}`));
    const rows = await db.query('SELECT * FROM artists LIMIT 10');
    console.log('\nSample artists:', rows.rows);
    process.exit(0);
  }catch(e){console.error(e.message);process.exit(1);} })();
