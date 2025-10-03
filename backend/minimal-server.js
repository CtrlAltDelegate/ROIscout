// Minimal ROI Scout Server - No external dependencies during startup
require('dotenv').config();

const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 5000;

// Basic middleware
app.use(cors());
app.use(express.json());

// Simple health check - no database required
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    message: 'Service is running'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'ROI Scout API',
    version: '1.0.0',
    health: '/health',
  });
});

// Load routes only after server starts
let authRoutes, migrateRoutes, testRoutes;
try {
  authRoutes = require('./src/routes/auth');
  app.use('/api/auth', authRoutes);
  console.log('✅ Auth routes loaded');
} catch (error) {
  console.log('⚠️ Auth routes failed to load:', error.message);
}

try {
  migrateRoutes = require('./src/routes/migrate');
  app.use('/api/migrate', migrateRoutes);
  console.log('✅ Migration routes loaded');
} catch (error) {
  console.log('⚠️ Migration routes failed to load:', error.message);
}

try {
  testRoutes = require('./src/routes/test-apis');
  app.use('/api/test', testRoutes);
  console.log('✅ API test routes loaded');
} catch (error) {
  console.log('⚠️ API test routes failed to load:', error.message);
}

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

// Auto-run migrations on startup (async, non-blocking)
async function checkAndRunMigrations() {
  try {
    console.log('🔍 Checking database migration status...');
    
    // Import migration function
    const { query } = require('./src/config/database');
    
    // Check if users table exists
    const tableCheck = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'users'
    `);
    
    if (tableCheck.rows.length === 0) {
      console.log('📋 Users table not found, running migrations...');
      
      // Import and run migrations
      const fs = require('fs');
      const path = require('path');
      const { pool } = require('./src/config/database');
      
      const client = await pool.connect();
      try {
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
        console.log('🎉 Auto-migration completed!');
      } finally {
        client.release();
      }
    } else {
      console.log('✅ Database tables already exist');
    }
  } catch (error) {
    console.log('⚠️ Auto-migration failed (non-critical):', error.message);
  }
}

// Start server
const server = app.listen(port, () => {
    console.log(`🚀 ROI Scout API running on port ${port}`);
    console.log(`📍 Health: http://localhost:${port}/health`);
    console.log(`🔐 Auth: http://localhost:${port}/api/auth`);
    console.log(`🔧 Migrate: http://localhost:${port}/api/migrate`);
    
    // Run migrations in background (non-blocking)
    setTimeout(checkAndRunMigrations, 2000);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('Process terminated');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    server.close(() => {
        console.log('Process terminated');
        process.exit(0);
    });
});
