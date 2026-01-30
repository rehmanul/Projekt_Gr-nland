const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function runMigrations() {
  console.log('Running database migrations...');
  
  const files = fs.readdirSync(path.join(__dirname, 'migrations')).sort();
  
  for (const file of files) {
    if (file.endsWith('.sql')) {
      console.log(`Running ${file}...`);
      const sql = fs.readFileSync(path.join(__dirname, 'migrations', file), 'utf8');
      await pool.query(sql);
      console.log(`✓ ${file} completed`);
    }
  }
  
  console.log('All migrations completed successfully');
  await pool.end();
}

runMigrations().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
