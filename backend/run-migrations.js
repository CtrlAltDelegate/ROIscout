// Simple migration runner for Railway PostgreSQL
require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigrations() {
  console.log('🔗 Connecting to Railway PostgreSQL...');
  
  // Use Railway DATABASE_URL
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // Required for Railway
  });

  let client;
  try {
    client = await pool.connect();
    console.log('✅ Connected to database');

    // Test connection
    const result = await client.query('SELECT NOW()');
    console.log('📅 Database time:', result.rows[0].now);

    // Run migrations
    console.log('🚀 Running migrations...');
    const migrationsDir = path.join(__dirname, '../database/migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    for (const file of migrationFiles) {
      console.log(`📄 Running: ${file}`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      
      try {
        await client.query(sql);
        console.log(`✅ Completed: ${file}`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`⚠️  Skipped: ${file} (already exists)`);
        } else {
          throw error;
        }
      }
    }

    console.log('🎉 All migrations completed!');

    // Verify users table exists
    const tableCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'users'
    `);
    
    if (tableCheck.rows.length > 0) {
      console.log('✅ Users table exists');
    } else {
      console.log('❌ Users table not found');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('✅ Database setup complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Setup failed:', error.message);
      process.exit(1);
    });
}

module.exports = { runMigrations };
