const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgres://tsdbadmin:Princ3%4020561@om61u613bx.fbpbxhbuec.tsdb.cloud.timescale.com:33660/tsdb?sslmode=require',
  ssl: { rejectUnauthorized: false },
});

pool.query('SELECT NOW()')
  .then(res => {
    console.log('Connected!', res.rows);
    process.exit(0);
  })
  .catch(err => {
    console.error('Connection error:', err);
    process.exit(1);
  });
