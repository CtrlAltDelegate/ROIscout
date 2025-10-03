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

// Load auth routes only after server starts
let authRoutes;
try {
  authRoutes = require('./src/routes/auth');
  app.use('/api/auth', authRoutes);
  console.log('✅ Auth routes loaded');
} catch (error) {
  console.log('⚠️ Auth routes failed to load:', error.message);
}

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

// Start server
const server = app.listen(port, () => {
    console.log(`🚀 ROI Scout API running on port ${port}`);
    console.log(`📍 Health: http://localhost:${port}/health`);
    console.log(`🔐 Auth: http://localhost:${port}/api/auth`);
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
