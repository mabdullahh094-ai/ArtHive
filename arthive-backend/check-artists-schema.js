const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

pool.query(
  "SELECT column_name, data_type FROM information_schema.columns WHERE table_name='artists' ORDER BY ordinal_position"
).then(r => {
  console.log(r.rows);
  pool.end();
}).catch(e => {
  console.error(e);
  pool.end();
});
