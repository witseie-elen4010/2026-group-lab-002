/* eslint-env jest */
const { showAvailability, saveAvailability, deleteAvailability } = require('../../src/controllers/availability-controller');

jest.mock('../../database/db', () => ({ prepare: jest.fn() }));

const db = require('../../database/db');

const mockReq = (overrides = {}) => ({
  session: { userId: 'A000356', userName: 'Clark Kent', userRole: 'lecturer' },
  body: {},
  params: {},
  ...overrides
});

const mockRes = () => {
  const res = {};
  res.render   = jest.fn();
  res.redirect = jest.fn();
  return res;
};

const fakeSlots = [
  { availability_id: 1, staff_number: 'A000356', day_of_week: 'Mon', start_time: '09:00', end_time: '10:00', venue: 'Room 1', max_number_of_students: 1 }
];

beforeEach(() => db.prepare.mockReset());

describe('showAvailability', () => {
  test('renders availability page with existing slots for the lecturer', () => {
    db.prepare.mockReturnValue({ all: jest.fn().mockReturnValue(fakeSlots) });

    const res = mockRes();
    showAvailability(mockReq(), res);

    expect(res.render).toHaveBeenCalledWith('availability', {
      user: { id: 'A000356', name: 'Clark Kent', role: 'lecturer' },
      availability: fakeSlots,
      error: null,
      success: null
    });
  });

  test('renders availability page with empty list when lecturer has no slots', () => {
    db.prepare.mockReturnValue({ all: jest.fn().mockReturnValue([]) });

    const res = mockRes();
    showAvailability(mockReq(), res);

    expect(res.render).toHaveBeenCalledWith('availability', expect.objectContaining({
      availability: []
    }));
  });
});

describe('saveAvailability', () => {
  const validBody = {
    day_of_week: 'Mon', start_time: '09:00', end_time: '10:00',
    venue: 'Room 1', max_number_of_students: '1'
  };

  test('saves slot and renders success when all fields are valid and no overlap', () => {
    db.prepare
      .mockReturnValueOnce({ all: jest.fn().mockReturnValue([]) })  // overlap check
      .mockReturnValueOnce({ run: jest.fn() })                       // INSERT
      .mockReturnValueOnce({ all: jest.fn().mockReturnValue(fakeSlots) }); // getAvailability after save

    const req = mockReq({ body: validBody });
    const res = mockRes();
    saveAvailability(req, res);

    expect(res.render).toHaveBeenCalledWith('availability', expect.objectContaining({
      success: 'Availability slot saved.',
      error: null
    }));
  });

  test('saves slot with correct staff_number from session', () => {
    const runFn = jest.fn();
    db.prepare
      .mockReturnValueOnce({ all: jest.fn().mockReturnValue([]) })
      .mockReturnValueOnce({ run: runFn })
      .mockReturnValueOnce({ all: jest.fn().mockReturnValue([]) });

    saveAvailability(mockReq({ body: validBody }), mockRes());

    expect(runFn).toHaveBeenCalledWith('A000356', 'Mon', '09:00', '10:00', 'Room 1', 1);
  });

  test('renders error when required fields are missing', () => {
    db.prepare.mockReturnValue({ all: jest.fn().mockReturnValue([]) });

    const req = mockReq({ body: { day_of_week: '', start_time: '', end_time: '', venue: '', max_number_of_students: '' } });
    const res = mockRes();
    saveAvailability(req, res);

    expect(res.render).toHaveBeenCalledWith('availability', expect.objectContaining({
      error: 'All fields are required.',
      success: null
    }));
  });

  test('renders error when slot is outside business hours', () => {
    db.prepare.mockReturnValue({ all: jest.fn().mockReturnValue([]) });

    const req = mockReq({ body: { ...validBody, start_time: '07:00', end_time: '08:00' } });
    const res = mockRes();
    saveAvailability(req, res);

    expect(res.render).toHaveBeenCalledWith('availability', expect.objectContaining({
      error: expect.stringContaining('08:00 and 18:00'),
      success: null
    }));
  });

  test('renders error when new slot overlaps an existing slot', () => {
    const existingSlot = { start_time: '09:00', end_time: '10:00' };
    db.prepare
      .mockReturnValueOnce({ all: jest.fn().mockReturnValue([existingSlot]) })  // overlap check finds conflict
      .mockReturnValueOnce({ all: jest.fn().mockReturnValue([existingSlot]) }); // getAvailability for render

    const req = mockReq({ body: { ...validBody, start_time: '09:30', end_time: '10:30' } });
    const res = mockRes();
    saveAvailability(req, res);

    expect(res.render).toHaveBeenCalledWith('availability', expect.objectContaining({
      error: expect.stringContaining('overlaps'),
      success: null
    }));
  });
});

describe('deleteAvailability', () => {
  test('deletes slot by id and staff_number then renders success', () => {
    const runFn = jest.fn();
    db.prepare
      .mockReturnValueOnce({ run: runFn })
      .mockReturnValueOnce({ all: jest.fn().mockReturnValue([]) });

    const req = mockReq({ params: { id: '1' } });
    const res = mockRes();
    deleteAvailability(req, res);

    expect(runFn).toHaveBeenCalledWith('1', 'A000356');
    expect(res.render).toHaveBeenCalledWith('availability', expect.objectContaining({
      success: 'Slot deleted.',
      error: null
    }));
  });
});
