/* eslint-env jest */
const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')

const MIGRATION_SQL = fs.readFileSync(
  path.join(__dirname, '../../database/createSchema.sql'),
  'utf8'
)

describe('Department schema constraints and relationships', () => {
  let db

  beforeAll(() => {
    db = new Database(':memory:')
    db.pragma('foreign_keys = ON')
    db.exec(MIGRATION_SQL)

    // FK targets reused across tests
    db.prepare(`INSERT INTO departments VALUES ('EIE', 'School of Electrical and Information Engineering', 'Engineering and the Built Environment')`).run()
    db.prepare(`INSERT INTO departments VALUES ('MIA', 'School of Mechanical, Industrial and Aeronautical Engineering', 'Engineering and the Built Environment')`).run()
    db.prepare(`INSERT INTO degrees VALUES ('BSCENGINFO', 'BSc Eng (Information)', 'EIE')`).run()
    db.prepare(`INSERT INTO students (student_number, name, email, password, degree_code) VALUES (1000001, 'Test Student', 'student@wits.ac.za', 'pw', 'BSCENGINFO')`).run()
    db.prepare(`INSERT INTO staff (staff_number, name, email, department, dept_code, password) VALUES ('A000001', 'Dr Alpha', 'alpha@wits.ac.za', 'EIE', 'EIE', 'pw')`).run()
    db.prepare(`INSERT INTO courses VALUES ('ELEN4010', 'Software Development III', 4, 'EIE')`).run()
    db.prepare(`INSERT INTO courses VALUES ('MECN4020', 'Systems Management and Integration', 4, 'MIA')`).run()
  })

  afterAll(() => {
    db.close()
  })

  // departments table
  test('stores a new department', () => {
    const result = db.prepare(`INSERT INTO departments VALUES ('CS', 'Computer Science', 'Science')`).run()
    expect(result.changes).toBe(1)
  })

  test('rejects a duplicate department code', () => {
    expect(() => {
      db.prepare(`INSERT INTO departments VALUES ('EIE', 'Duplicate', 'Engineering')`).run()
    }).toThrow(/UNIQUE constraint failed/)
  })

  test('rejects a department with no name', () => {
    expect(() => {
      db.prepare(`INSERT INTO departments (dept_code, dept_name, faculty_name) VALUES ('XX', NULL, 'Faculty')`).run()
    }).toThrow(/NOT NULL constraint failed/)
  })

  test('rejects a department with no faculty', () => {
    expect(() => {
      db.prepare(`INSERT INTO departments (dept_code, dept_name, faculty_name) VALUES ('YY', 'Dept Name', NULL)`).run()
    }).toThrow(/NOT NULL constraint failed/)
  })

  // degrees table — dept_code FK
  test('rejects a degree referencing a non-existent department', () => {
    expect(() => {
      db.prepare(`INSERT INTO degrees VALUES ('BSCFAKE', 'Fake Degree', 'NOTREAL')`).run()
    }).toThrow(/FOREIGN KEY constraint failed/)
  })

  test('accepts a degree whose department exists', () => {
    const result = db.prepare(`INSERT INTO degrees VALUES ('BSCENGMECH', 'BSc Eng (Mechanical)', 'MIA')`).run()
    expect(result.changes).toBe(1)
  })

  // courses table — dept_code replaces degree_code
  test('rejects a course referencing a non-existent department', () => {
    expect(() => {
      db.prepare(`INSERT INTO courses VALUES ('FAKE001', 'Fake Course', 3, 'NOTREAL')`).run()
    }).toThrow(/FOREIGN KEY constraint failed/)
  })

  test('rejects a duplicate course code', () => {
    expect(() => {
      db.prepare(`INSERT INTO courses VALUES ('ELEN4010', 'Duplicate', 4, 'EIE')`).run()
    }).toThrow(/UNIQUE constraint failed/)
  })

  test('accepts a course with a valid department', () => {
    const result = db.prepare(`INSERT INTO courses VALUES ('ELEN9999', 'Test Course', 4, 'EIE')`).run()
    expect(result.changes).toBe(1)
  })

  // staff_courses junction table
  test('records a course assignment for a staff member', () => {
    const result = db.prepare(`INSERT INTO staff_courses VALUES ('A000001', 'ELEN4010')`).run()
    expect(result.changes).toBe(1)
  })

  test('rejects a duplicate staff-course assignment', () => {
    expect(() => {
      db.prepare(`INSERT INTO staff_courses VALUES ('A000001', 'ELEN4010')`).run()
    }).toThrow(/UNIQUE constraint failed/)
  })

  test('rejects a staff_courses row with a non-existent staff member', () => {
    expect(() => {
      db.prepare(`INSERT INTO staff_courses VALUES ('NOTREAL', 'ELEN4010')`).run()
    }).toThrow(/FOREIGN KEY constraint failed/)
  })

  test('rejects a staff_courses row with a non-existent course', () => {
    expect(() => {
      db.prepare(`INSERT INTO staff_courses VALUES ('A000001', 'NOTREAL')`).run()
    }).toThrow(/FOREIGN KEY constraint failed/)
  })

  test('removes course assignments when a staff member is deleted', () => {
    db.prepare(`INSERT INTO staff (staff_number, name, email, department, dept_code, password) VALUES ('A000099', 'Temp Staff', 'temp@wits.ac.za', 'EIE', 'EIE', 'pw')`).run()
    db.prepare(`INSERT INTO staff_courses VALUES ('A000099', 'ELEN4010')`).run()
    db.prepare(`DELETE FROM staff WHERE staff_number = 'A000099'`).run()
    const rows = db.prepare(`SELECT * FROM staff_courses WHERE staff_number = 'A000099'`).all()
    expect(rows.length).toBe(0)
  })

  test('removes course assignments when a course is deleted', () => {
    db.prepare(`INSERT INTO courses VALUES ('TEMP001', 'Temp Course', 3, 'EIE')`).run()
    db.prepare(`INSERT INTO staff_courses VALUES ('A000001', 'TEMP001')`).run()
    db.prepare(`DELETE FROM courses WHERE course_code = 'TEMP001'`).run()
    const rows = db.prepare(`SELECT * FROM staff_courses WHERE course_code = 'TEMP001'`).all()
    expect(rows.length).toBe(0)
  })

  // cross-department enrollment
  test('allows a student from one department to enroll in a course from another', () => {
    const result = db.prepare(`INSERT INTO enrollments VALUES (1000001, 'MECN4020')`).run()
    expect(result.changes).toBe(1)
  })
})
