/* eslint-env jest */
jest.mock('../../database/db', () => ({ prepare: jest.fn() }))

const db = require('../../database/db')
const { showLecturerSettings } = require('../../src/controllers/lecturer-settings-controller')

const mockReq = (overrides = {}) => ({
  session: { userId: 'A000356', userName: 'Bruce Wayne', userRole: 'lecturer' },
  ...overrides
})
const mockRes = () => { const r = {}; r.render = jest.fn(); return r }

beforeEach(() => db.prepare.mockReset())

describe('showLecturerSettings', () => {
  test('renders with profile when DB returns a record', () => {
    const profile = { staff_number: 'A000356', name: 'Bruce Wayne', email: 'b@wits.ac.za', department: 'EIE', dept_code: 'EIE' }
    db.prepare.mockReturnValueOnce({ get: jest.fn().mockReturnValue(profile) })

    const res = mockRes()
    showLecturerSettings(mockReq(), res)

    expect(res.render).toHaveBeenCalledWith('lecturer-settings', expect.objectContaining({
      profile,
      error: null
    }))
  })

  test('renders with empty profile when DB returns nothing', () => {
    db.prepare.mockReturnValueOnce({ get: jest.fn().mockReturnValue(null) })

    const res = mockRes()
    showLecturerSettings(mockReq(), res)

    expect(res.render).toHaveBeenCalledWith('lecturer-settings', expect.objectContaining({
      profile: {},
      error: null
    }))
  })

  test('renders with error message when DB throws', () => {
    db.prepare.mockReturnValueOnce({ get: jest.fn().mockImplementation(() => { throw new Error('DB down') }) })

    const res = mockRes()
    showLecturerSettings(mockReq(), res)

    expect(res.render).toHaveBeenCalledWith('lecturer-settings', expect.objectContaining({
      error: 'Could not load profile. Please try again.'
    }))
  })
})
