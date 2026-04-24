require('dotenv').config();

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
  process.exit(1);
});

const app = require('./src/app');
const port = process.env.PORT || 5000;

async function start() {
  const server = app.listen(port, () => {
    console.log(`ROIscout API running on port ${port}`);
    console.log(`Health check: http://localhost:${port}/health`);
  });

  process.on('SIGTERM', () => {
    server.close(() => process.exit(0));
  });
}

start();
