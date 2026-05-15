/* eslint-env jest */
const { logActivity } = require('../../src/services/logging-service')
const ActionTypes = require('../../src/services/action-types')
const db = require('../../database/db')

const mockInsertLogRun = jest.fn()
const mockInsertAffectedRun = jest.fn()

jest.mock('../../database/db', () => ({
  prepare: jest.fn(),
  transaction: jest.fn((callback) => (...args) => callback(...args))
}))

beforeEach(() => {
  jest.clearAllMocks()

  mockInsertLogRun.mockReturnValue({ lastInsertRowid: 99 })

  db.prepare.mockImplementation((query) => {
    const q = query.toLowerCase()
    if (q.includes('insert into activity_log')) return { run: mockInsertLogRun }
    if (q.includes('insert into affected_records')) return { run: mockInsertAffectedRun }
    return { run: jest.fn() }
  })
})

describe('Logging Service', () => {
  test('successfully logs an action WITH NO affected records (e.g. Login)', async () => {
    const result = await logActivity('A000356', ActionTypes.USER_LOGIN, [])
    expect(result).toBe(true)
    expect(mockInsertLogRun).toHaveBeenCalledWith('A000356', ActionTypes.USER_LOGIN)
    expect(mockInsertAffectedRun).not.toHaveBeenCalled()
  })

  test('successfully logs an action WITH affected records (e.g. Consultation Create)', async () => {
    const affected = [
      { table: 'consultations', id: 'CONST-123' },
      { table: 'lecturer_availability', id: 45 }
    ]
    const result = await logActivity('1234567', ActionTypes.CONSULT_CREATE, affected)
    expect(result).toBe(true)
    expect(mockInsertLogRun).toHaveBeenCalledWith('1234567', ActionTypes.CONSULT_CREATE)
    expect(mockInsertAffectedRun).toHaveBeenCalledTimes(2)
    expect(mockInsertAffectedRun).toHaveBeenCalledWith(99, 'consultations', 'CONST-123')
    expect(mockInsertAffectedRun).toHaveBeenCalledWith(99, 'lecturer_availability', 45)
  })

  test('defaults to "unknown" if the userId is missing', async () => {
    const result = await logActivity(null, ActionTypes.AUTH_FAILED_LOGIN, [])
    expect(result).toBe(true)
    expect(mockInsertLogRun).toHaveBeenCalledWith('unknown', ActionTypes.AUTH_FAILED_LOGIN)
  })

  test('catches errors gracefully and returns false if the database crashes', async () => {
    mockInsertLogRun.mockImplementationOnce(() => {
      throw new Error('SQLite crash simulated!')
    })
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    const result = await logActivity('A000356', ActionTypes.AVAIL_CREATE, [])

    expect(result).toBe(false)
    expect(consoleSpy).toHaveBeenCalledWith('Activity Logging Failed:', expect.any(Error))

    consoleSpy.mockRestore()
  })
})
