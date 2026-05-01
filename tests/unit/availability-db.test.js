const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')

const MIGRATION_SQL = fs.readFileSync(
  path.join(__dirname, '../../database/createSchema.sql'),
  'utf8'
)

const SEED_SQL = fs.readFileSync(
  path.join(__dirname, '../../database/seedVitalInfo.sql'),
  'utf8'
)

describe('Lecturer Availability Constraints', () => {
  let db

  beforeAll(() => {
    db = new Database(':memory:')

    db.pragma('foreign_keys = ON')

    db.exec(MIGRATION_SQL)

    db.exec(SEED_SQL)
  })

  afterAll(() => {
    db.close()
  })

  const insertAvailability = (values) => {
    return db.prepare(`
      INSERT INTO lecturer_availablity 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(...values)
  }

  test('should insert valid availability', () => {
    expect(() => {
      insertAvailability([
        'A000356-3',
        'A000356',
        'Fri',
        '09:00',
        '10:00',
        60,
        5,
        'Room 105'
      ])
    }).not.toThrow()
  })

  test('should reject invalid day_of_week', () => {
    expect(() => {
      insertAvailability([
        'A000356-4',
        'A000356',
        'Sunday',
        '09:00',
        '10:00',
        60,
        5,
        'Room 105'
      ])
    }).toThrow()
  })

  test('should reject invalid start_time format', () => {
    expect(() => {
      insertAvailability([
        'A000356-5',
        'A000356',
        'Mon',
        '9:00',
        '10:00',
        60,
        5,
        'Room 105'
      ])
    }).toThrow()
  })

  test('should reject invalid end_time format', () => {
    expect(() => {
      insertAvailability([
        'A000356-6',
        'A000356',
        'Mon',
        '09:00',
        '1000',
        60,
        5,
        'Room 105'
      ])
    }).toThrow()
  })

  test('should reject end_time before start_time', () => {
    expect(() => {
      insertAvailability([
        'A000356-7',
        'A000356',
        'Mon',
        '12:00',
        '10:00',
        60,
        5,
        'Room 105'
      ])
    }).toThrow()
  })

  test('should reject equal start and end time', () => {
    expect(() => {
      insertAvailability([
        'A000356-8',
        'A000356',
        'Mon',
        '10:00',
        '10:00',
        60,
        5,
        'Room 105'
      ])
    }).toThrow()
  })

  test('should reject max_booking_min <= 0', () => {
    expect(() => {
      insertAvailability([
        'A000356-9',
        'A000356',
        'Mon',
        '10:00',
        '11:00',
        0,
        5,
        'Room 105'
      ])
    }).toThrow()
  })

  test('should reject max_booking_min > 480', () => {
    expect(() => {
      insertAvailability([
        'A000356-10',
        'A000356',
        'Mon',
        '10:00',
        '11:00',
        500,
        5,
        'Room 105'
      ])
    }).toThrow()
  })

  test('should reject max_number_of_students <= 0', () => {
    expect(() => {
      insertAvailability([
        'A000356-11',
        'A000356',
        'Mon',
        '10:00',
        '11:00',
        60,
        0,
        'Room 105'
      ])
    }).toThrow()
  })

  test('should reject short venue name', () => {
    expect(() => {
      insertAvailability([
        'A000356-12',
        'A000356',
        'Mon',
        '10:00',
        '11:00',
        60,
        5,
        'R1'
      ])
    }).toThrow()
  })

  test('should reject duplicate availability_id', () => {
    expect(() => {
      insertAvailability([
        'A000356-1',
        'A000356',
        'Fri',
        '12:00',
        '13:00',
        60,
        5,
        'Room 106'
      ])
    }).toThrow()
  })

  test('should reject non-existent staff_number (FK constraint)', () => {
    expect(() => {
      insertAvailability([
        'A999999-1',
        'A999999',
        'Mon',
        '10:00',
        '11:00',
        60,
        5,
        'Room 105'
      ])
    }).toThrow()
  })
})
