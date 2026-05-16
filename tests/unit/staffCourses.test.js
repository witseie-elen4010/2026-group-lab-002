/* eslint-env jest */
const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')

const MIGRATION_SQL = fs.readFileSync(
  path.join(__dirname, '../../database/createSchema.sql'),
  'utf8'
)

describe('Staff course assignments', () => {
  let db

  beforeAll(() => {
    db = new Database(':memory:')
    db.pragma('foreign_keys = ON')
    db.exec(MIGRATION_SQL)

    db.prepare(`INSERT INTO departments VALUES ('EIE', 'School of EIE', 'Engineering')`).run()
    db.prepare(`INSERT INTO degrees VALUES ('BSCENGINFO', 'BSc Eng (Information)', 'EIE')`).run()
    db.prepare(`INSERT INTO staff (staff_number, name, email, department, dept_code, password) VALUES ('A000001', 'Dr Alpha', 'alpha@wits.ac.za', 'EIE', 'EIE', 'pw')`).run()
    db.prepare(`INSERT INTO staff (staff_number, name, email, department, dept_code, password) VALUES ('A000002', 'Dr Beta',  'beta@wits.ac.za',  'EIE', 'EIE', 'pw')`).run()
    db.prepare(`INSERT INTO courses VALUES ('ELEN4010', 'Software Development III', 4, 'EIE')`).run()
    db.prepare(`INSERT INTO courses VALUES ('ELEN3009', 'Digital Systems',           3, 'EIE')`).run()
    db.prepare(`INSERT INTO courses VALUES ('ELEN4020', 'Data Intensive Computing',  4, 'EIE')`).run()
    // A000001 teaches ELEN4010 + ELEN3009; A000002 teaches ELEN4010 only
    db.prepare(`INSERT INTO staff_courses VALUES ('A000001', 'ELEN4010')`).run()
    db.prepare(`INSERT INTO staff_courses VALUES ('A000001', 'ELEN3009')`).run()
    db.prepare(`INSERT INTO staff_courses VALUES ('A000002', 'ELEN4010')`).run()
  })

  afterAll(() => {
    db.close()
  })

  test('returns all courses taught by a lecturer', () => {
    const rows = db.prepare(`
      SELECT c.course_code
      FROM staff_courses sc
      JOIN courses c ON sc.course_code = c.course_code
      WHERE sc.staff_number = 'A000001'
      ORDER BY c.course_code
    `).all()
    expect(rows).toHaveLength(2)
    expect(rows[0].course_code).toBe('ELEN3009')
    expect(rows[1].course_code).toBe('ELEN4010')
  })

  test('returns all lecturers who teach a given course', () => {
    const rows = db.prepare(`
      SELECT s.staff_number
      FROM staff_courses sc
      JOIN staff s ON sc.staff_number = s.staff_number
      WHERE sc.course_code = 'ELEN4010'
      ORDER BY s.staff_number
    `).all()
    expect(rows).toHaveLength(2)
    expect(rows[0].staff_number).toBe('A000001')
    expect(rows[1].staff_number).toBe('A000002')
  })

  test('returns an empty list for a lecturer with no course assignments', () => {
    db.prepare(`INSERT INTO staff (staff_number, name, email, department, dept_code, password) VALUES ('A000003', 'Dr Gamma', 'gamma@wits.ac.za', 'EIE', 'EIE', 'pw')`).run()
    const rows = db.prepare(`SELECT * FROM staff_courses WHERE staff_number = 'A000003'`).all()
    expect(rows).toHaveLength(0)
  })

  test('returns an empty list for a course with no staff assigned', () => {
    const rows = db.prepare(`SELECT * FROM staff_courses WHERE course_code = 'ELEN4020'`).all()
    expect(rows).toHaveLength(0)
  })

  test('adding a second course increases the lecturer course count', () => {
    db.prepare(`INSERT INTO staff_courses VALUES ('A000002', 'ELEN3009')`).run()
    const rows = db.prepare(`SELECT * FROM staff_courses WHERE staff_number = 'A000002'`).all()
    expect(rows).toHaveLength(2)
  })

  test('removing a course assignment does not delete the course or the staff member', () => {
    db.prepare(`DELETE FROM staff_courses WHERE staff_number = 'A000002' AND course_code = 'ELEN3009'`).run()
    const staff = db.prepare(`SELECT * FROM staff WHERE staff_number = 'A000002'`).get()
    const course = db.prepare(`SELECT * FROM courses WHERE course_code = 'ELEN3009'`).get()
    expect(staff).toBeDefined()
    expect(course).toBeDefined()
  })
})
