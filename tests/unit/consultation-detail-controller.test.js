/* eslint-env jest */
jest.mock('../../database/db', () => ({ prepare: jest.fn(), transaction: fn => fn }))
jest.mock('../../src/services/logging-service', () => ({ logActivity: jest.fn().mockResolvedValue(true) }))
jest.mock('../../src/services/consultation-join-service', () => ({ validateJoin: jest.fn() }))

const db = require('../../database/db')
const { validateJoin } = require('../../src/services/consultation-join-service')
const { cancelConsultation, leaveConsultation, joinConsultation } = require('../../src/controllers/consultation-detail-controller')

const mockReq = (overrides = {}) => ({
  session: { userId: 1234567, userName: 'Test Student', userRole: 'student' },
  params: { constId: '42' },
  query: {},
  ...overrides
})
const mockRes = () => {
  const r = {}
  r.render = jest.fn()
  r.redirect = jest.fn()
  r.status = jest.fn().mockReturnValue(r)
  return r
}

beforeEach(() => {
  db.prepare.mockReset()
  validateJoin.mockReset()
})

describe('cancelConsultation', () => {
  test('redirects to dashboard when consultation not found', async () => {
    db.prepare.mockReturnValueOnce({ get: jest.fn().mockReturnValue(null) })
    const res = mockRes()
    await cancelConsultation(mockReq(), res)
    expect(res.redirect).toHaveBeenCalledWith('/student/dashboard?error=Consultation+not+found')
  })

  test('redirects with error when user is not the organiser', async () => {
    db.prepare.mockReturnValueOnce({ get: jest.fn().mockReturnValue({ organiser: 9999999, status: 'Open' }) })
    const res = mockRes()
    await cancelConsultation(mockReq(), res)
    expect(res.redirect).toHaveBeenCalledWith('/consultations/42?error=Only+the+organiser+can+cancel+this+consultation')
  })

  test('redirects with error when consultation is already cancelled', async () => {
    db.prepare.mockReturnValueOnce({ get: jest.fn().mockReturnValue({ organiser: 1234567, status: 'Cancelled' }) })
    const res = mockRes()
    await cancelConsultation(mockReq(), res)
    expect(res.redirect).toHaveBeenCalledWith('/consultations/42?error=Consultation+is+already+cancelled')
  })

  test('blocks cancellation within 2 hours of start time', async () => {
    const soonDate = new Date(Date.now() + 30 * 60 * 1000)
    const soonDateStr = soonDate.toISOString().slice(0, 10)
    const soonTime = soonDate.toISOString().slice(11, 16)
    db.prepare.mockReturnValueOnce({ get: jest.fn().mockReturnValue({ organiser: 1234567, status: 'Open', consultation_date: soonDateStr, consultation_time: soonTime }) })
    const res = mockRes()
    await cancelConsultation(mockReq(), res)
    expect(res.redirect).toHaveBeenCalledWith('/consultations/42?error=Consultations+cannot+be+cancelled+within+2+hours+of+the+start+time')
  })

  test('cancels and redirects to dashboard on success', async () => {
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000)
    const futureDateStr = futureDate.toISOString().slice(0, 10)
    db.prepare
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue({ organiser: 1234567, status: 'Open', consultation_date: futureDateStr, consultation_time: '10:00' }) })
      .mockReturnValueOnce({ run: jest.fn() })
      .mockReturnValueOnce({ run: jest.fn() })
    const res = mockRes()
    await cancelConsultation(mockReq(), res)
    expect(res.redirect).toHaveBeenCalledWith('/student/dashboard?success=Consultation+cancelled+successfully')
  })
})

describe('leaveConsultation', () => {
  test('redirects to dashboard when consultation not found', async () => {
    db.prepare.mockReturnValueOnce({ get: jest.fn().mockReturnValue(null) })
    const res = mockRes()
    await leaveConsultation(mockReq(), res)
    expect(res.redirect).toHaveBeenCalledWith('/student/dashboard?error=Consultation+not+found')
  })

  test('redirects with error when user is the organiser', async () => {
    db.prepare.mockReturnValueOnce({ get: jest.fn().mockReturnValue({ organiser: 1234567 }) })
    const res = mockRes()
    await leaveConsultation(mockReq(), res)
    expect(res.redirect).toHaveBeenCalledWith('/consultations/42?error=Organisers+must+cancel+not+leave')
  })

  test('redirects with error when student is not an attendee', async () => {
    db.prepare
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue({ organiser: 9999999 }) })
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue(null) })
    const res = mockRes()
    await leaveConsultation(mockReq(), res)
    expect(res.redirect).toHaveBeenCalledWith('/consultations/42?error=You+are+not+attending+this+consultation')
  })

  test('removes attendee and redirects to dashboard on success', async () => {
    db.prepare
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue({ organiser: 9999999 }) })
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue({ student_number: 1234567 }) })
      .mockReturnValueOnce({ run: jest.fn() })
    const res = mockRes()
    await leaveConsultation(mockReq(), res)
    expect(res.redirect).toHaveBeenCalledWith('/student/dashboard?success=You+have+left+the+consultation')
  })
})

describe('joinConsultation', () => {
  test('redirects with error when student is not enrolled in the lecturer course', async () => {
    db.prepare
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue({ const_id: '42', lecturer_id: 'A000356' }) })
      .mockReturnValueOnce({ all: jest.fn().mockReturnValue([]) })
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue(null) })
    validateJoin.mockReturnValue({ valid: true })

    const res = mockRes()
    await joinConsultation(mockReq(), res)
    expect(res.redirect).toHaveBeenCalledWith('/student/dashboard?error=You+are+not+enrolled+in+a+course+taught+by+this+lecturer')
  })
})
