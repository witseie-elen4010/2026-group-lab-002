// Centralised database connection and always enables foreign key enforcement.
const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'database.db');

// 1. Create the connection once and reuse it across the app
const db = new Database(DB_PATH);

// 2. Turn on foreign keys for this connection
db.pragma('foreign_keys = ON');

// 3. Export the shared instance directly
module.exports = db;
