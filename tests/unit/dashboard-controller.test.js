/* eslint-env jest */
const { showLecturerDashboard } = require('../../src/controllers/lecturer-dashboard-controller');

jest.mock('../../database/db', () => ({
  prepare: jest.fn()
}));

const db = require('../../database/db');

const mockReq = (overrides = {}) => ({
  session: { userId: 'A000356', userName: 'Clark Kent', userRole: 'lecturer' },
  query: {},
  ...overrides
});

const mockRes = () => {
  const res = {};
  res.render = jest.fn();
  return res;
};

describe('showLecturerDashboard()', () => {
  beforeEach(() => db.prepare.mockReset());

  test('computes stats from Available slots only, ignoring Booked and Ongoing', () => {
    const rows = [
      { consultation_date: '2026-05-01', consultation_time: '09:00', duration_min: 60, status: 'Available' },
      { consultation_date: '2026-05-01', consultation_time: '10:00', duration_min: 60, status: 'Booked' },
      { consultation_date: '2026-05-02', consultation_time: '09:00', duration_min: 120, status: 'Available' },
    ];
    db.prepare
      .mockReturnValueOnce({ all: jest.fn().mockReturnValue(rows) })
      .mockReturnValueOnce({ all: jest.fn().mockReturnValue([]) });

    const res = mockRes();
    showLecturerDashboard(mockReq(), res);

    expect(res.render).toHaveBeenCalledWith('lecturer-dashboard', expect.objectContaining({
      stats: { daysAvailable: 2, hoursAvailable: 3, totalSlots: 2 },
    }));
  });

  test('returns zero stats when there are no Available slots', () => {
    const rows = [
      { consultation_date: '2026-05-01', consultation_time: '09:00', duration_min: 60, status: 'Booked' },
    ];
    db.prepare
      .mockReturnValueOnce({ all: jest.fn().mockReturnValue(rows) })
      .mockReturnValueOnce({ all: jest.fn().mockReturnValue([]) });

    const res = mockRes();
    showLecturerDashboard(mockReq(), res);

    expect(res.render).toHaveBeenCalledWith('lecturer-dashboard', expect.objectContaining({
      stats: { daysAvailable: 0, hoursAvailable: 0, totalSlots: 0 },
    }));
  });

  test('renders error view with empty data when the DB throws', () => {
    db.prepare.mockReturnValue({
      all: jest.fn().mockImplementation(() => { throw new Error('DB failure'); })
    });

    const res = mockRes();
    showLecturerDashboard(mockReq(), res);

    expect(res.render).toHaveBeenCalledWith('lecturer-dashboard', expect.objectContaining({
      upcomingConsultations: [],
      stats: { daysAvailable: 0, hoursAvailable: 0, totalSlots: 0 },
      error: 'Could not load dashboard data. Please try again.',
    }));
  });
});
