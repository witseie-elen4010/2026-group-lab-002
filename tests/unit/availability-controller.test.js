/* eslint-env jest */
const { showAvailability, saveAvailability, deleteAvailability, updateAvailability } = require('../../src/controllers/availability-controller')

jest.mock('../../database/db', () => ({ prepare: jest.fn() }))

jest.mock('../../src/services/logging-service', () => ({
  logActivity: jest.fn().mockResolvedValue(true)
}))

const db = require('../../database/db')
const { logActivity } = require('../../src/services/logging-service')

const mockReq = (overrides = {}) => ({
  session: { userId: 'A000356', userName: 'Clark Kent', userRole: 'lecturer' },
  body: {},
  params: {},
  ...overrides
})

const mockRes = () => {
  const res = {}
  res.render = jest.fn()
  res.redirect = jest.fn()
  return res
}

const fakeSlots = [
  { availability_id: 1, staff_number: 'A000356', day_of_week: 'Mon', start_time: '09:00', end_time: '10:00', venue: 'Room 1', max_number_of_students: 1 }
]

beforeEach(() => {
  db.prepare.mockReset()
  logActivity.mockClear()
})

describe('showAvailability', () => {
  test('renders availability page with existing slots for the lecturer', () => {
    db.prepare.mockReturnValue({ all: jest.fn().mockReturnValue(fakeSlots) })

    const res = mockRes()
    showAvailability(mockReq(), res)

    expect(res.render).toHaveBeenCalledWith('availability', {
      user: { id: 'A000356', name: 'Clark Kent', role: 'lecturer' },
      availability: fakeSlots,
      error: null,
      success: null
    })
  })

  test('renders availability page with empty list when lecturer has no slots', () => {
    db.prepare.mockReturnValue({ all: jest.fn().mockReturnValue([]) })

    const res = mockRes()
    showAvailability(mockReq(), res)

    expect(res.render).toHaveBeenCalledWith('availability', expect.objectContaining({
      availability: []
    }))
  })
})

describe('saveAvailability', () => {
  const validBody = {
    day_of_week: 'Mon',
    start_time: '09:00',
    end_time: '10:00',
    venue: 'Room 1',
    max_number_of_students: '1',
    max_booking_min: '60'
  }

  test('saves slot and renders success when all fields are valid and no overlap', async () => {
    db.prepare
      .mockReturnValueOnce({ all: jest.fn().mockReturnValue([]) }) // overlap check
      .mockReturnValueOnce({ run: jest.fn().mockReturnValue({ lastInsertRowid: 1 }) }) // 4. RETURN FAKE ID
      .mockReturnValueOnce({ all: jest.fn().mockReturnValue(fakeSlots) }) // getAvailability after save

    const req = mockReq({ body: validBody })
    const res = mockRes()
    await saveAvailability(req, res)

    expect(res.render).toHaveBeenCalledWith('availability', expect.objectContaining({
      success: 'Availability slot saved.',
      error: null
    }))
  })

  test('saves slot with correct staff_number from session', async () => {
    const runFn = jest.fn().mockReturnValue({ lastInsertRowid: 1 })
    db.prepare
      .mockReturnValueOnce({ all: jest.fn().mockReturnValue([]) })
      .mockReturnValueOnce({ run: runFn })
      .mockReturnValueOnce({ all: jest.fn().mockReturnValue([]) })

    await saveAvailability(mockReq({ body: validBody }), mockRes())

    expect(runFn).toHaveBeenCalledWith('A000356', 'Mon', '09:00', '10:00', 'Room 1', 1, 60)
  })

  test('renders error when required fields are missing', async () => {
    db.prepare.mockReturnValue({ all: jest.fn().mockReturnValue([]) })

    const req = mockReq({ body: { day_of_week: '', start_time: '', end_time: '', venue: '', max_number_of_students: '' } })
    const res = mockRes()
    await saveAvailability(req, res)

    expect(res.render).toHaveBeenCalledWith('availability', expect.objectContaining({
      error: 'All fields are required.',
      success: null
    }))
  })

  test('renders error when slot is outside business hours', async () => {
    db.prepare.mockReturnValue({ all: jest.fn().mockReturnValue([]) })

    const req = mockReq({ body: { ...validBody, start_time: '07:00', end_time: '08:00' } })
    const res = mockRes()
    await saveAvailability(req, res)

    expect(res.render).toHaveBeenCalledWith('availability', expect.objectContaining({
      error: expect.stringContaining('08:00 and 18:00'),
      success: null
    }))
  })

  test('renders error when max_number_of_students exceeds 10', async () => {
    db.prepare.mockReturnValue({ all: jest.fn().mockReturnValue([]) })

    const req = mockReq({ body: { ...validBody, max_number_of_students: '11' } })
    const res = mockRes()
    await saveAvailability(req, res)

    expect(res.render).toHaveBeenCalledWith('availability', expect.objectContaining({
      error: 'Max students must be between 1 and 10.'
    }))
  })

  test('rejects slot where max_booking_min exceeds window duration', async () => {
    db.prepare.mockReturnValue({ all: jest.fn().mockReturnValue([]) })

    const req = mockReq({ body: { ...validBody, max_booking_min: '120' } }) // window is 09:00-10:00 = 60 min
    const res = mockRes()
    await saveAvailability(req, res)

    expect(res.render).toHaveBeenCalledWith('availability', expect.objectContaining({
      error: expect.stringContaining('cannot exceed window length'),
      success: null
    }))
  })

  test('renders error when new slot overlaps an existing slot', async () => {
    const existingSlot = { start_time: '09:00', end_time: '10:00' }
    db.prepare
      .mockReturnValueOnce({ all: jest.fn().mockReturnValue([existingSlot]) }) // overlap check finds conflict
      .mockReturnValueOnce({ all: jest.fn().mockReturnValue([existingSlot]) }) // getAvailability for render

    const req = mockReq({ body: { ...validBody, start_time: '09:30', end_time: '10:30' } })
    const res = mockRes()
    await saveAvailability(req, res)

    expect(res.render).toHaveBeenCalledWith('availability', expect.objectContaining({
      error: expect.stringContaining('overlaps'),
      success: null
    }))
  })
})

describe('updateAvailability', () => {
  const validBody = {
    day_of_week: 'Mon',
    start_time: '09:00',
    end_time: '10:00',
    venue: 'Room 2',
    max_number_of_students: '3',
    max_booking_min: '45'
  }
  const existingSlot = { availability_id: 1, staff_number: 'A000356', day_of_week: 'Mon', start_time: '09:00', end_time: '10:00' }

  test('updates slot and renders success when valid and no overlap with other slots', async () => {
    const runFn = jest.fn()
    db.prepare
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue(existingSlot) })  // slot ownership check
      .mockReturnValueOnce({ all: jest.fn().mockReturnValue([]) })             // other slots overlap check
      .mockReturnValueOnce({ run: runFn })                                     // UPDATE
      .mockReturnValueOnce({ all: jest.fn().mockReturnValue(fakeSlots) })      // getAvailability after update

    const req = mockReq({ params: { id: '1' }, body: validBody })
    const res = mockRes()
    await updateAvailability(req, res)

    expect(runFn).toHaveBeenCalledWith('Mon', '09:00', '10:00', 'Room 2', 3, 45, '1', 'A000356')
    expect(res.render).toHaveBeenCalledWith('availability', expect.objectContaining({
      success: 'Availability slot updated.',
      error: null
    }))
  })

  test('logs AVAIL_UPDATE with the correct slot id on success', async () => {
    db.prepare
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue(existingSlot) })
      .mockReturnValueOnce({ all: jest.fn().mockReturnValue([]) })
      .mockReturnValueOnce({ run: jest.fn() })
      .mockReturnValueOnce({ all: jest.fn().mockReturnValue([]) })

    await updateAvailability(mockReq({ params: { id: '1' }, body: validBody }), mockRes())

    expect(logActivity).toHaveBeenCalledWith('A000356', 302, [{ table: 'lecturer_availability', id: '1' }])
  })

  test('renders error when slot does not belong to the lecturer', async () => {
    db.prepare
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue(null) })           // slot not found
      .mockReturnValueOnce({ all: jest.fn().mockReturnValue([]) })             // getAvailability for render

    const req = mockReq({ params: { id: '99' }, body: validBody })
    const res = mockRes()
    await updateAvailability(req, res)

    expect(res.render).toHaveBeenCalledWith('availability', expect.objectContaining({
      error: 'Slot not found.'
    }))
    expect(logActivity).not.toHaveBeenCalled()
  })

  test('renders error when updated slot overlaps another slot', async () => {
    const conflicting = { start_time: '09:30', end_time: '10:30' }
    db.prepare
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue(existingSlot) })
      .mockReturnValueOnce({ all: jest.fn().mockReturnValue([conflicting]) })  // other slots have overlap
      .mockReturnValueOnce({ all: jest.fn().mockReturnValue([existingSlot]) }) // getAvailability for render

    const req = mockReq({ params: { id: '1' }, body: { ...validBody, start_time: '09:00', end_time: '10:00' } })
    const res = mockRes()
    await updateAvailability(req, res)

    expect(res.render).toHaveBeenCalledWith('availability', expect.objectContaining({
      error: expect.stringContaining('overlaps')
    }))
    expect(logActivity).not.toHaveBeenCalled()
  })

  test('renders error when required fields are missing', async () => {
    db.prepare.mockReturnValue({ all: jest.fn().mockReturnValue([]) })

    const req = mockReq({ params: { id: '1' }, body: { day_of_week: '', start_time: '', end_time: '', venue: '', max_number_of_students: '' } })
    const res = mockRes()
    await updateAvailability(req, res)

    expect(res.render).toHaveBeenCalledWith('availability', expect.objectContaining({
      error: 'All fields are required.'
    }))
    expect(logActivity).not.toHaveBeenCalled()
  })

  test('renders error when times are outside business hours', async () => {
    db.prepare.mockReturnValue({ all: jest.fn().mockReturnValue([]) })

    const req = mockReq({ params: { id: '1' }, body: { ...validBody, start_time: '06:00', end_time: '07:00' } })
    const res = mockRes()
    await updateAvailability(req, res)

    expect(res.render).toHaveBeenCalledWith('availability', expect.objectContaining({
      error: expect.stringContaining('08:00 and 18:00')
    }))
  })

  test('renders error when max students exceeds 10', async () => {
    db.prepare.mockReturnValue({ all: jest.fn().mockReturnValue([]) })

    const req = mockReq({ params: { id: '1' }, body: { ...validBody, max_number_of_students: '15' } })
    const res = mockRes()
    await updateAvailability(req, res)

    expect(res.render).toHaveBeenCalledWith('availability', expect.objectContaining({
      error: 'Max students must be between 1 and 10.'
    }))
  })

  test('rejects slot where max_booking_min exceeds window duration', async () => {
    db.prepare.mockReturnValue({ all: jest.fn().mockReturnValue([]) })

    const req = mockReq({ params: { id: '1' }, body: { ...validBody, max_booking_min: '120' } }) // window is 09:00-10:00 = 60 min
    const res = mockRes()
    await updateAvailability(req, res)

    expect(res.render).toHaveBeenCalledWith('availability', expect.objectContaining({
      error: expect.stringContaining('cannot exceed window length'),
      success: null
    }))
  })
})

describe('deleteAvailability', () => {
  test('deletes slot by id and staff_number then renders success', async () => {
    const runFn = jest.fn()
    db.prepare
      .mockReturnValueOnce({ run: runFn })
      .mockReturnValueOnce({ all: jest.fn().mockReturnValue([]) })

    const req = mockReq({ params: { id: '1' } })
    const res = mockRes()
    await deleteAvailability(req, res)

    expect(runFn).toHaveBeenCalledWith('1', 'A000356')
    expect(res.render).toHaveBeenCalledWith('availability', expect.objectContaining({
      success: 'Slot deleted.',
      error: null
    }))
  })
})
