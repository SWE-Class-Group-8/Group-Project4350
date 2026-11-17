const { Pool } = require('pg');

function createPool() {
  return new Pool({ connectionString: process.env.DATABASE_URL });
}

module.exports = { createPool };
