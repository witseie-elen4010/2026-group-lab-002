/* eslint-env jest */
const { showAvailability, saveAvailability, deleteAvailability } = require('../../src/controllers/availability-controller');

jest.mock('../../database/db', () => ({
  prepare: jest.fn()
}));

const db = require('../../database/db');

const mockReq = (overrides = {}) => ({
  session: { userId: 'A000356', userName: 'Clark Kent', userRole: 'lecturer' },
  body: {},
  params: {},
  ...overrides
});

const mockRes = () => {
  const res = {};
  res.render = jest.fn();
  res.redirect = jest.fn();
  return res;
};

describe('showAvailability', () => {
  beforeEach(() => db.prepare.mockReset());

  test('renders availability page with existing slots for the lecturer', () => {
    const fakeSlots = [
      { const_id: '2026-05-01-00001', consultation_date: '2026-05-01', consultation_time: '09:00', venue: 'Room 1' }
    ];
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
  beforeEach(() => db.prepare.mockReset());

  test('renders coming soon message without saving to the database', () => {
    db.prepare.mockReturnValue({ all: jest.fn().mockReturnValue([]) });
    const res = mockRes();

    saveAvailability(mockReq(), res);

    expect(res.render).toHaveBeenCalledWith('availability', expect.objectContaining({
      success: expect.stringContaining('coming soon'),
      error: null
    }));
    expect(res.redirect).not.toHaveBeenCalled();
  });
});

describe('deleteAvailability', () => {
  beforeEach(() => db.prepare.mockReset());

  test('renders coming soon message without deleting from the database', () => {
    db.prepare.mockReturnValue({ all: jest.fn().mockReturnValue([]) });
    const res = mockRes();

    deleteAvailability(mockReq({ params: { id: '2026-05-01-00001' } }), res);

    expect(res.render).toHaveBeenCalledWith('availability', expect.objectContaining({
      success: expect.stringContaining('coming soon'),
      error: null
    }));
    expect(res.redirect).not.toHaveBeenCalled();
  });
});
