const fs = require('fs')
const path = require('path')

// Use an in-memory database for Jest test runs so tests are isolated
process.env.DB_PATH = process.env.DB_PATH || ':memory:'

const db = require('../database/db')

const schemaSQL = fs.readFileSync(path.join(__dirname, '../database/createSchema.sql'), 'utf8')
const seedSQL = fs.readFileSync(path.join(__dirname, '../database/seedVitalInfo.sql'), 'utf8')

db.exec(schemaSQL)
db.exec(seedSQL)
