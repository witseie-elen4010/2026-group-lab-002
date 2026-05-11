/* eslint-env jest */
const { showLecturerDashboard } = require('../../src/controllers/lecturer-dashboard-controller');

jest.mock('../../database/db', () => ({
  prepare: jest.fn()
}));

jest.mock('../../src/services/public-holidays-service', () => ({
  getSAPublicHolidays: jest.fn().mockResolvedValue([]),
}));

jest.mock('../../src/services/weather-service', () => ({
  getWitsWeather: jest.fn().mockResolvedValue({}),
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

  test('computes stats from Available slots only, ignoring Booked and Ongoing', async () => {
    const rows = [
      { consultation_date: '2026-05-01', consultation_time: '09:00', duration_min: 60, status: 'Available' },
      { consultation_date: '2026-05-01', consultation_time: '10:00', duration_min: 60, status: 'Booked' },
      { consultation_date: '2026-05-02', consultation_time: '09:00', duration_min: 120, status: 'Available' },
    ];
    db.prepare
      .mockReturnValueOnce({ all: jest.fn().mockReturnValue(rows) })
      .mockReturnValueOnce({ all: jest.fn().mockReturnValue([]) })
      .mockReturnValueOnce({ all: jest.fn().mockReturnValue([]) });

    const res = mockRes();
    await showLecturerDashboard(mockReq(), res);

    expect(res.render).toHaveBeenCalledWith('lecturer-dashboard', expect.objectContaining({
      stats: { daysAvailable: 2, hoursAvailable: 3, totalSlots: 2 },
    }));
  });

  test('returns zero stats when there are no Available slots', async () => {
    const rows = [
      { consultation_date: '2026-05-01', consultation_time: '09:00', duration_min: 60, status: 'Booked' },
    ];
    db.prepare
      .mockReturnValueOnce({ all: jest.fn().mockReturnValue(rows) })
      .mockReturnValueOnce({ all: jest.fn().mockReturnValue([]) })
      .mockReturnValueOnce({ all: jest.fn().mockReturnValue([]) });

    const res = mockRes();
    await showLecturerDashboard(mockReq(), res);

    expect(res.render).toHaveBeenCalledWith('lecturer-dashboard', expect.objectContaining({
      stats: { daysAvailable: 0, hoursAvailable: 0, totalSlots: 0 },
    }));
  });

  test('renders error view with empty data when the DB throws', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    db.prepare.mockReturnValue({
      all: jest.fn().mockImplementation(() => { throw new Error('DB failure'); })
    });

    const res = mockRes();
    await showLecturerDashboard(mockReq(), res);

    expect(res.render).toHaveBeenCalledWith('lecturer-dashboard', expect.objectContaining({
      upcomingConsultations: [],
      stats: { daysAvailable: 0, hoursAvailable: 0, totalSlots: 0 },
      error: 'Could not load dashboard data. Please try again.',
    }));
  });

  test('passes assignedCourses to the view when the lecturer has courses', async () => {
    const courses = [
      { course_code: 'ELEN4010', course_name: 'Software Dev', year_level: 4, dept_code: 'ELEN' },
      { course_code: 'ELEN3009', course_name: 'Signals', year_level: 3, dept_code: 'ELEN' },
    ];
    db.prepare
      .mockReturnValueOnce({ all: jest.fn().mockReturnValue([]) })
      .mockReturnValueOnce({ all: jest.fn().mockReturnValue([]) })
      .mockReturnValueOnce({ all: jest.fn().mockReturnValue(courses) });

    const res = mockRes();
    await showLecturerDashboard(mockReq(), res);

    expect(res.render).toHaveBeenCalledWith('lecturer-dashboard', expect.objectContaining({
      assignedCourses: courses,
    }));
  });

  test('passes assignedCourses as empty array when the lecturer has no courses', async () => {
    db.prepare
      .mockReturnValueOnce({ all: jest.fn().mockReturnValue([]) })
      .mockReturnValueOnce({ all: jest.fn().mockReturnValue([]) })
      .mockReturnValueOnce({ all: jest.fn().mockReturnValue([]) });

    const res = mockRes();
    await showLecturerDashboard(mockReq(), res);

    expect(res.render).toHaveBeenCalledWith('lecturer-dashboard', expect.objectContaining({
      assignedCourses: [],
    }));
  });

  test('calls the assigned-courses query with the correct staff_number from the session', async () => {
    const coursesQuery = jest.fn().mockReturnValue([]);
    db.prepare
      .mockReturnValueOnce({ all: jest.fn().mockReturnValue([]) })
      .mockReturnValueOnce({ all: jest.fn().mockReturnValue([]) })
      .mockReturnValueOnce({ all: coursesQuery });

    await showLecturerDashboard(mockReq(), mockRes());

    expect(coursesQuery).toHaveBeenCalledWith('A000356');
  });

  test('includes assignedCourses as empty array in the error render when the DB throws', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    db.prepare.mockReturnValue({
      all: jest.fn().mockImplementation(() => { throw new Error('DB failure'); })
    });

    const res = mockRes();
    await showLecturerDashboard(mockReq(), res);

    expect(res.render).toHaveBeenCalledWith('lecturer-dashboard', expect.objectContaining({
      assignedCourses: [],
    }));
  });
});
