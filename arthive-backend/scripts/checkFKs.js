const db = require('../config/db');
(async ()=>{
  try {
    const res = await db.query("SELECT conname, pg_get_constraintdef(c.oid) as def FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid WHERE t.relname = 'artworks' AND contype='f'");
    console.log(res.rows);
    process.exit(0);
  } catch(e){ console.error(e.message); process.exit(1);} })();
