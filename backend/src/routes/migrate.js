const express = require('express');
const fs = require('fs');
const path = require('path');
const { query, pool } = require('../config/database');

const router = express.Router();

/**
 * Run database migrations
 * POST /migrate/run
 */
router.post('/run', async (req, res) => {
  let client;
  try {
    console.log('🚀 Starting database migrations...');
    
    client = await pool.connect();
    
    // Test connection
    const testResult = await client.query('SELECT NOW()');
    console.log('✅ Database connected at:', testResult.rows[0].now);

    // Get migration files
    const migrationsDir = path.join(__dirname, '../../../database/migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    console.log(`📁 Found ${migrationFiles.length} migration files`);

    const results = [];
    
    for (const file of migrationFiles) {
      console.log(`📄 Running migration: ${file}`);
      
      try {
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
        await client.query(sql);
        
        console.log(`✅ Completed: ${file}`);
        results.push({ file, status: 'completed' });
        
      } catch (error) {
        if (error.message.includes('already exists') || 
            error.message.includes('relation') && error.message.includes('already exists')) {
          console.log(`⚠️  Skipped: ${file} (already exists)`);
          results.push({ file, status: 'skipped', reason: 'already exists' });
        } else {
          console.error(`❌ Failed: ${file}`, error.message);
          results.push({ file, status: 'failed', error: error.message });
          throw error;
        }
      }
    }

    // Verify critical tables exist
    const tableCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'subscriptions')
      ORDER BY table_name
    `);
    
    const existingTables = tableCheck.rows.map(row => row.table_name);
    console.log('📋 Existing tables:', existingTables);

    console.log('🎉 Migration process completed!');

    res.json({
      success: true,
      message: 'Database migrations completed successfully',
      results,
      existingTables,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Migration failed:', error);
    res.status(500).json({
      success: false,
      error: 'Migration failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  } finally {
    if (client) client.release();
  }
});

/**
 * Check migration status
 * GET /migrate/status
 */
router.get('/status', async (req, res) => {
  try {
    // Check if critical tables exist
    const tableCheck = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'subscriptions', 'properties', 'saved_searches')
      ORDER BY table_name
    `);
    
    const existingTables = tableCheck.rows.map(row => row.table_name);
    const requiredTables = ['users', 'subscriptions'];
    const missingTables = requiredTables.filter(table => !existingTables.includes(table));
    
    const isReady = missingTables.length === 0;

    res.json({
      ready: isReady,
      existingTables,
      missingTables,
      message: isReady ? 'Database is ready' : 'Database needs migration',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Status check failed:', error);
    res.status(500).json({
      ready: false,
      error: 'Status check failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
