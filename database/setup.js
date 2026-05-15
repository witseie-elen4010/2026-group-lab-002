// This script sets up the database by creating tables and inserting default data.

const fs = require('fs');
const path = require('path');
const db = require('./db'); // Import shared database connection

console.log("Setting up the database...");

// 1. Read your SQL files
const schemaSQL  = fs.readFileSync(path.join(__dirname, 'createSchema.sql'),   'utf8');
const seedSQL    = fs.readFileSync(path.join(__dirname, 'seedVitalInfo.sql'),   'utf8');
const demoSQL    = fs.readFileSync(path.join(__dirname, 'seedDemoData.sql'),    'utf8');

// 2. Execute the SQL commands to build the tables and insert data
try {
    db.exec(schemaSQL);
    console.log(" Tables created successfully.");

    db.exec(seedSQL);
    console.log("Default data (seeds) inserted successfully.");

    db.exec(demoSQL);
    console.log("Demo seed data inserted successfully.");
} catch (error) {
    console.error("Error setting up database:", error);
}

console.log("Database setup complete!");