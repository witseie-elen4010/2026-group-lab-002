const Database = require('better-sqlite3')
const path = require('path')

const DB_PATH = path.join(__dirname, '../../database/database.db')

describe('Consultations table constraints', () => {
  let db

  console.log('Database path being used:', DB_PATH)

  beforeAll(() => {
    db = new Database(DB_PATH)
    db.pragma('foreign_keys = ON')

    db.prepare("DELETE FROM consultations WHERE const_id LIKE '2026-04-26-%'").run()
  })

  afterAll(() => {
    db.prepare("DELETE FROM consultations WHERE const_id LIKE '2026-04-26-%'").run()
    db.close()
  })

  test('rejects a duplicate const_id', () => {
    const sql = `
      INSERT INTO consultations (const_id, consultation_date, consultation_time, lecturer_id, venue)
      VALUES (?, '2026-04-26', '10:00', 'A000357', 'Venue 1')
    `

    db.prepare(sql).run('2026-04-26-00001')

    expect(() => {
      db.prepare(sql).run('2026-04-26-00001')
    }).toThrow(/UNIQUE constraint failed/)
  })

  test('rejects consultation title that is too short', () => {
    expect(() => {
      db.prepare(`
        INSERT INTO consultations (const_id, consultation_title, consultation_date, consultation_time, lecturer_id, venue)
        VALUES ('2026-04-26-00002', 'Hi', '2026-04-26', '10:00', 'A000357', 'Venue 1')
      `).run()
    }).toThrow(/CHECK constraint failed/)
  })

  test('rejects invalid date format (GLOB constraint)', () => {
    expect(() => {
      db.prepare(`
        INSERT INTO consultations (const_id, consultation_date, consultation_time, lecturer_id, venue)
        VALUES ('2026-04-26-00003', '26-04-2026', '10:00', 'A000357', 'Venue 1')
      `).run()
    }).toThrow(/CHECK constraint failed/)
  })

  test('rejects invalid lecturer_id (Foreign Key constraint)', () => {
    expect(() => {
      db.prepare(`
        INSERT INTO consultations (const_id, consultation_date, consultation_time, lecturer_id, venue)
        VALUES ('2026-04-26-00004', '2026-04-26', '10:00', 'NON-EXISTENT-STAFF', 'Venue 1')
    `).run()
    }).toThrow(/FOREIGN KEY constraint failed/)
  })

  test('enforces duration_min range', () => {
    expect(() => {
      db.prepare(`
        INSERT INTO consultations (const_id, consultation_date, consultation_time, lecturer_id, duration_min, venue)
        VALUES ('2026-04-26-00005', '2026-04-26', '10:00', 'A000357', 9999, 'Venue 1')
    `).run()
    }).toThrow(/CHECK constraint failed/)
  })
})
