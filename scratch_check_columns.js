const db = require('./arthive-backend/config/db.js');
db.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'orders'")
  .then(res => { console.log(res.rows); process.exit(0); })
  .catch(err => { console.error(err); process.exit(1); });
