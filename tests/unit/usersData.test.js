const Database = require('better-sqlite3')
const path = require('path')

// Point to the actual database file
const DB_PATH = path.join(__dirname, '../../database/database.db')

describe('Users table constraints', () => {
  let db

  beforeAll(() => {
  db = new Database(DB_PATH)
  // Clean up any leftover data from previous test runs
  db.prepare("DELETE FROM users WHERE email LIKE '%jest-test%'").run()
})

  afterAll(() => {
    // Clean up any test data we inserted
    db.prepare("DELETE FROM users WHERE email LIKE '%jest-test%'").run()
    db.close()
  })

  test('rejects a duplicate student_staff_number', () => {
    db.prepare(`
      INSERT INTO users (student_staff_number, name, email, password, role)
      VALUES (10000001, 'Jest User One', 'jest-test-1@wits.ac.za', 'pw', 'student')
    `).run()

    expect(() => {
      db.prepare(`
        INSERT INTO users (student_staff_number, name, email, password, role)
        VALUES (10000001, 'Jest User Two', 'jest-test-2@wits.ac.za', 'pw', 'student')
      `).run()
    }).toThrow(/UNIQUE constraint failed/)
  })

  test('rejects a duplicate email', () => {
    expect(() => {
      db.prepare(`
        INSERT INTO users (student_staff_number, name, email, password, role)
        VALUES (10000002, 'Jest User Three', 'jest-test-1@wits.ac.za', 'pw', 'student')
      `).run()
    }).toThrow(/UNIQUE constraint failed/)
  })
})