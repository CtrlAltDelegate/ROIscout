// Simple ROI Scout Server
require('dotenv').config();

const app = require('./src/app');
const port = process.env.PORT || 5000;

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
