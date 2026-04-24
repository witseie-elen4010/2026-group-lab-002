// Centralised database connection — always enables foreign key enforcement.
const Database = require('better-sqlite3')
const path = require('path')

const DB_PATH = path.join(__dirname, 'database.db')

function openDatabase() {
  const db = new Database(DB_PATH)
  db.pragma('foreign_keys = ON')
  return db
}

module.exports = openDatabase
