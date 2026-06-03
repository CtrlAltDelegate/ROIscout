require('dotenv').config();

process.on('uncaughtException', (error) => {
  console.error('FATAL uncaughtException:', error.message);
  console.error(error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('FATAL unhandledRejection:', reason);
  process.exit(1);
});

let app;
try {
  app = require('./src/app');
} catch (err) {
  console.error('FATAL: could not load src/app:', err.message);
  console.error(err.stack);
  process.exit(1);
}

const port = process.env.PORT || 5000;

async function start() {
  try {
    const server = app.listen(port, '0.0.0.0', () => {
      console.log(`ROIscout API running on port ${port}`);
      console.log(`Health check: http://localhost:${port}/health`);
    });

    process.on('SIGTERM', () => {
      server.close(() => process.exit(0));
    });
  } catch (err) {
    console.error('FATAL: server failed to start:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

start().catch((err) => {
  console.error('FATAL async startup error:', err.message);
  console.error(err.stack);
  process.exit(1);
});
