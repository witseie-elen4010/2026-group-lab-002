// Unit tests for student schema constraints and FK enforcement
const openDatabase = require('../../database/db')

describe('Student schema constraints', () => {
  let db

  beforeAll(() => {
    db = openDatabase()
    db.prepare("INSERT OR IGNORE INTO degrees (degree_code, degree_name) VALUES ('BSCENGINFO', 'BSc Eng (Information)')").run()
    db.prepare("DELETE FROM enrollments WHERE course_code LIKE 'JEST%'").run()
    db.prepare("DELETE FROM students WHERE email LIKE '%jest-test%'").run()
    db.prepare("DELETE FROM courses WHERE course_code LIKE 'JEST%'").run()
    db.prepare("INSERT OR IGNORE INTO courses (course_code, course_name, year_level, degree_code) VALUES ('JEST3001', 'Jest Course Year 3', 3, 'BSCENGINFO')").run()
    db.prepare("INSERT OR IGNORE INTO courses (course_code, course_name, year_level, degree_code) VALUES ('JEST4001', 'Jest Course Year 4', 4, 'BSCENGINFO')").run()
  })

  afterAll(() => {
    db.prepare("DELETE FROM enrollments WHERE course_code LIKE 'JEST%'").run()
    db.prepare("DELETE FROM students WHERE email LIKE '%jest-test%'").run()
    db.prepare("DELETE FROM courses WHERE course_code LIKE 'JEST%'").run()
    db.close()
  })

  test('rejects a duplicate student_number', () => {
    db.prepare(`
      INSERT INTO students (student_number, name, email, password, degree_code)
      VALUES (10000001, 'Jest User One', 'jest-test-1@wits.ac.za', 'pw', 'BSCENGINFO')
    `).run()

    expect(() => {
      db.prepare(`
        INSERT INTO students (student_number, name, email, password, degree_code)
        VALUES (10000001, 'Jest User Two', 'jest-test-2@wits.ac.za', 'pw', 'BSCENGINFO')
      `).run()
    }).toThrow(/UNIQUE constraint failed/)
  })

  test('rejects a duplicate email', () => {
    expect(() => {
      db.prepare(`
        INSERT INTO students (student_number, name, email, password, degree_code)
        VALUES (10000002, 'Jest User Three', 'jest-test-1@wits.ac.za', 'pw', 'BSCENGINFO')
      `).run()
    }).toThrow(/UNIQUE constraint failed/)
  })

  test('rejects an enrollment referencing a nonexistent student', () => {
    expect(() => {
      db.prepare(`
        INSERT INTO enrollments (student_number, course_code)
        VALUES (99999999, 'JEST3001')
      `).run()
    }).toThrow(/FOREIGN KEY constraint failed/)
  })

  test('returns multiple year levels for a student enrolled across years', () => {
    db.prepare(`
      INSERT INTO students (student_number, name, email, password, degree_code)
      VALUES (10000003, 'Jest Multi Year', 'jest-test-3@wits.ac.za', 'pw', 'BSCENGINFO')
    `).run()

    db.prepare(`INSERT INTO enrollments (student_number, course_code) VALUES (10000003, 'JEST3001')`).run()
    db.prepare(`INSERT INTO enrollments (student_number, course_code) VALUES (10000003, 'JEST4001')`).run()

    const rows = db.prepare(`
      SELECT c.year_level
      FROM enrollments e
      JOIN courses c ON e.course_code = c.course_code
      WHERE e.student_number = 10000003
      ORDER BY c.year_level
    `).all()

    expect(rows).toHaveLength(2)
    expect(rows[0].year_level).toBe(3)
    expect(rows[1].year_level).toBe(4)
  })
})
