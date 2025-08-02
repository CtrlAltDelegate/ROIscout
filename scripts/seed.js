const fs = require('fs');
const path = require('path');
const { pool } = require('../src/config/database');

async function runSeeds() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Running database seeds...');
    
    const seedsDir = path.join(__dirname, '../database/seeds');
    const seedFiles = fs.readdirSync(seedsDir).sort();
    
    for (const file of seedFiles) {
      if (file.endsWith('.sql')) {
        console.log(`📄 Running seed: ${file}`);
        const seedSQL = fs.readFileSync(path.join(seedsDir, file), 'utf8');
        await client.query(seedSQL);
        console.log(`✅ Completed: ${file}`);
      }
    }
    
    console.log('🎉 All seeds completed successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run seeds if this script is called directly
if (require.main === module) {
  runSeeds()
    .then(() => {
      console.log('Database seeding complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { runSeeds };
