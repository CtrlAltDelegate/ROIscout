#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting ROI Scout development servers...\n');

// Start backend server
console.log('📊 Starting backend server...');
const backend = spawn('npm', ['run', 'dev'], {
  cwd: path.join(__dirname, '../backend'),
  stdio: 'inherit',
  shell: true
});

// Wait a moment then start frontend
setTimeout(() => {
  console.log('🌐 Starting frontend server...');
  const frontend = spawn('npm', ['start'], {
    cwd: path.join(__dirname, '../frontend'),
    stdio: 'inherit',
    shell: true
  });

  // Handle process cleanup
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down development servers...');
    backend.kill();
    frontend.kill();
    process.exit(0);
  });

  frontend.on('close', (code) => {
    console.log(`Frontend process exited with code ${code}`);
    backend.kill();
  });

}, 3000);

backend.on('close', (code) => {
  console.log(`Backend process exited with code ${code}`);
});

backend.on('error', (err) => {
  console.error('Failed to start backend:', err);
});