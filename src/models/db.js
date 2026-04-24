const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../database/database.db');
const db = new Database(dbPath);

// Export the database instance
module.exports = db;