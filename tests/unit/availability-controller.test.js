const { showAvailability, saveAvailability } = require('../../src/controllers/availability-controller');

jest.mock('../../database/db', () => ({
  prepare: jest.fn()
}));

const db = require('../../database/db');

const mockReq = (overrides = {}) => ({
  session: {},
  body: {},
  ...overrides
});

const mockRes = () => {
  const res = {};
  res.render = jest.fn();
  res.redirect = jest.fn();
  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

describe('showAvailability', () => {
  test('renders availability page with existing slots for the lecturer', () => {
    // Arrange
    const fakeSlots = [
      { const_id: '2026-05-01-00001', consultation_date: '2026-05-01', consultation_time: '09:00', venue: 'Room 1' }
    ];
    db.prepare.mockReturnValue({ all: jest.fn().mockReturnValue(fakeSlots) });
    const req = mockReq({ session: { userId: 'A000356', userName: 'Clark Kent', userRole: 'lecturer' } });
    const res = mockRes();

    // Act
    showAvailability(req, res);

    // Assert
    expect(res.render).toHaveBeenCalledWith('availability', {
      user: { id: 'A000356', name: 'Clark Kent', role: 'lecturer' },
      availability: fakeSlots,
      error: null,
      success: null
    });
  });

  test('renders availability page with empty list when lecturer has no slots', () => {
    // Arrange
    db.prepare.mockReturnValue({ all: jest.fn().mockReturnValue([]) });
    const req = mockReq({ session: { userId: 'A000356', userName: 'Clark Kent', userRole: 'lecturer' } });
    const res = mockRes();

    // Act
    showAvailability(req, res);

    // Assert
    expect(res.render).toHaveBeenCalledWith('availability', {
      user: { id: 'A000356', name: 'Clark Kent', role: 'lecturer' },
      availability: [],
      error: null,
      success: null
    });
  });
});

describe('saveAvailability', () => {
  test('renders error when required fields are missing', () => {
    // Arrange
    db.prepare.mockReturnValue({ all: jest.fn().mockReturnValue([]) });
    const req = mockReq({
      session: { userId: 'A000356', userName: 'Clark Kent', userRole: 'lecturer' },
      body: { consultation_date: '2026-05-01', consultation_time: '', venue: '', duration_min: '', max_number_of_students: '' }
    });
    const res = mockRes();

    // Act
    saveAvailability(req, res);

    // Assert
    expect(res.render).toHaveBeenCalledWith('availability', expect.objectContaining({
      error: 'All fields are required.'
    }));
    expect(res.redirect).not.toHaveBeenCalled();
  });

  test('renders error when a slot already exists at the same date and time', () => {
    // Arrange
    const existingSlot = { const_id: '2026-05-01-00001' };
    db.prepare.mockReturnValue({
      all: jest.fn().mockReturnValue([]),
      get: jest.fn().mockReturnValue(existingSlot)
    });
    const req = mockReq({
      session: { userId: 'A000356', userName: 'Clark Kent', userRole: 'lecturer' },
      body: { consultation_date: '2026-05-01', consultation_time: '09:00', venue: 'Room 1', duration_min: '30', max_number_of_students: '1' }
    });
    const res = mockRes();

    // Act
    saveAvailability(req, res);

    // Assert
    expect(res.render).toHaveBeenCalledWith('availability', expect.objectContaining({
      error: 'A slot already exists for that date and time.'
    }));
    expect(res.redirect).not.toHaveBeenCalled();
  });

  test('inserts slot and redirects to dashboard on valid data', () => {
    // Arrange
    db.prepare.mockReturnValue({
      all: jest.fn().mockReturnValue([]),
      get: jest.fn()
        .mockReturnValueOnce(null)
        .mockReturnValueOnce({ total: 0 }),
      run: jest.fn()
    });
    const req = mockReq({
      session: { userId: 'A000356', userName: 'Clark Kent', userRole: 'lecturer' },
      body: { consultation_date: '2026-05-01', consultation_time: '09:00', venue: 'Room 1', duration_min: '30', max_number_of_students: '5' }
    });
    const res = mockRes();

    // Act
    saveAvailability(req, res);

    // Assert
    expect(res.redirect).toHaveBeenCalledWith('/lecturer/dashboard');
    expect(res.render).not.toHaveBeenCalled();
  });
});
