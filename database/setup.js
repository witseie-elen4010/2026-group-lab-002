const fs = require('fs');
const path = require('path');
const db = require('./db'); // Import shared database connection

console.log("Setting up the database...");

// 1. Read your SQL files
const schemaSQL = fs.readFileSync(path.join(__dirname, 'migration-001-student-schema.sql'), 'utf8');
const seedSQL = fs.readFileSync(path.join(__dirname, 'seed-001-degrees-and-courses.sql'), 'utf8');

// 2. Execute the SQL commands to build the tables and insert data
try {
    db.exec(schemaSQL);
    console.log(" Tables created successfully.");
    
    db.exec(seedSQL);
    console.log("Default data (seeds) inserted successfully.");
} catch (error) {
    console.error("Error setting up database:", error);
}

console.log("Database setup complete!");