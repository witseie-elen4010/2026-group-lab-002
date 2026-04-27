const Database = require('better-sqlite3')
const path = require('path')

const DB_PATH = path.join(__dirname, '../../database/database.db')

describe('Consultations DB (3NF + Constraints + Relations)', () => {
  let db

  beforeAll(() => {
    db = new Database(DB_PATH)
    db.pragma('foreign_keys = ON')

    console.log('Database path being used:', DB_PATH)

    // Clean only consultation-related data
    db.exec(`
      DELETE FROM consultation_attendees;
      DELETE FROM consultations;
    `)
  })

  afterAll(() => {
    db.exec(`
      DELETE FROM consultation_attendees;
      DELETE FROM consultations;
    `)
    db.close()
  })

  test('rejects duplicate const_id', () => {
    const sql = `
      INSERT INTO consultations 
      (const_id, consultation_date, consultation_time, lecturer_id, venue)
      VALUES (?, '2026-04-26', '10:00', 'A000357', 'Venue 1')
    `

    db.prepare(sql).run('2026-04-26-00001')

    expect(() => {
      db.prepare(sql).run('2026-04-26-00001')
    }).toThrow(/UNIQUE constraint failed/)
  })

  test('rejects invalid consultation title (too short)', () => {
    expect(() => {
      db.prepare(`
        INSERT INTO consultations 
        (const_id, consultation_title, consultation_date, consultation_time, lecturer_id, venue)
        VALUES ('2026-04-26-00002', 'Hi', '2026-04-26', '10:00', 'A000357', 'Venue 1')
      `).run()
    }).toThrow(/CHECK constraint failed/)
  })

  test('rejects invalid date format', () => {
    expect(() => {
      db.prepare(`
        INSERT INTO consultations 
        (const_id, consultation_date, consultation_time, lecturer_id, venue)
        VALUES ('2026-04-26-00003', '26-04-2026', '10:00', 'A000357', 'Venue 1')
      `).run()
    }).toThrow(/CHECK constraint failed/)
  })

  test('rejects invalid lecturer_id (FK constraint)', () => {
    expect(() => {
      db.prepare(`
        INSERT INTO consultations 
        (const_id, consultation_date, consultation_time, lecturer_id, venue)
        VALUES ('2026-04-26-00004', '2026-04-26', '10:00', 'INVALID', 'Venue 1')
      `).run()
    }).toThrow(/FOREIGN KEY constraint failed/)
  })

  test('enforces duration_min constraint', () => {
    expect(() => {
      db.prepare(`
        INSERT INTO consultations 
        (const_id, consultation_date, consultation_time, lecturer_id, duration_min, venue)
        VALUES ('2026-04-26-00005', '2026-04-26', '10:00', 'A000357', 9999, 'Venue 1')
      `).run()
    }).toThrow(/CHECK constraint failed/)
  })

  test('allows valid consultation insert', () => {
    const result = db.prepare(`
      INSERT INTO consultations 
      (const_id, consultation_date, consultation_time, lecturer_id, venue)
      VALUES ('2026-04-26-VALID', '2026-04-26', '10:00', 'A000357', 'Venue 1')
    `).run()

    expect(result.changes).toBe(1)
  })

  test('allows consultation without organiser', () => {
    const result = db.prepare(`
      INSERT INTO consultations 
      (const_id, consultation_date, consultation_time, lecturer_id, venue)
      VALUES ('2026-04-26-NOORG', '2026-04-26', '11:00', 'A000357', 'Venue 1')
    `).run()

    expect(result.changes).toBe(1)
  })

  test('rejects invalid organiser (FK constraint)', () => {
    expect(() => {
      db.prepare(`
        INSERT INTO consultations 
        (const_id, consultation_date, consultation_time, lecturer_id, organiser, venue)
        VALUES ('2026-04-26-BADORG', '2026-04-26', '12:00', 'A000357', 9999999, 'Venue 1')
      `).run()
    }).toThrow(/FOREIGN KEY constraint failed/)
  })

  test('adds attendee to consultation (3NF join table)', () => {
    db.prepare(`
      INSERT INTO consultations 
      (const_id, consultation_date, consultation_time, lecturer_id, venue)
      VALUES ('2026-04-26-ATT', '2026-04-26', '13:00', 'A000357', 'Venue 1')
    `).run()

    const result = db.prepare(`
      INSERT INTO consultation_attendees (const_id, student_number)
      VALUES ('2026-04-26-ATT', 1234567)
    `).run()

    expect(result.changes).toBe(1)
  })

  test('rejects duplicate attendee (composite PK)', () => {
    expect(() => {
      db.prepare(`
        INSERT INTO consultation_attendees (const_id, student_number)
        VALUES ('2026-04-26-ATT', 1234567)
      `).run()
    }).toThrow(/UNIQUE constraint failed/)
  })

  test('rejects invalid student in attendees', () => {
    expect(() => {
      db.prepare(`
        INSERT INTO consultation_attendees (const_id, student_number)
        VALUES ('2026-04-26-ATT', 9999999)
      `).run()
    }).toThrow(/FOREIGN KEY constraint failed/)
  })

  test('cascade delete removes attendees', () => {
    db.prepare(`
      INSERT INTO consultations 
      (const_id, consultation_date, consultation_time, lecturer_id, venue)
      VALUES ('2026-04-26-CASCADE', '2026-04-26', '14:00', 'A000357', 'Venue 1')
    `).run()

    db.prepare(`
      INSERT INTO consultation_attendees (const_id, student_number)
      VALUES ('2026-04-26-CASCADE', 1234567)
    `).run()

    db.prepare(`
      DELETE FROM consultations WHERE const_id = '2026-04-26-CASCADE'
    `).run()

    const rows = db.prepare(`
      SELECT * FROM consultation_attendees WHERE const_id = '2026-04-26-CASCADE'
    `).all()

    expect(rows.length).toBe(0)
  })
})
