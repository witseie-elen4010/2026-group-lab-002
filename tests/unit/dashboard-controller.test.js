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

  test('computes stats from lecturer_availability', async () => {
    db.prepare
      .mockReturnValueOnce({ all: jest.fn().mockReturnValue([]) })
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue({ daysAvailable: 2, hoursAvailable: 3 }) })
      .mockReturnValueOnce({ all: jest.fn().mockReturnValue([]) })
      .mockReturnValueOnce({ all: jest.fn().mockReturnValue([]) });

    const res = mockRes();
    await showLecturerDashboard(mockReq(), res);

    expect(res.render).toHaveBeenCalledWith('lecturer-dashboard', expect.objectContaining({
      stats: { daysAvailable: 2, hoursAvailable: 3 },
    }));
  });

  test('returns zero stats when lecturer_availability is empty', async () => {
    db.prepare
      .mockReturnValueOnce({ all: jest.fn().mockReturnValue([]) })
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue({ daysAvailable: 0, hoursAvailable: 0 }) })
      .mockReturnValueOnce({ all: jest.fn().mockReturnValue([]) })
      .mockReturnValueOnce({ all: jest.fn().mockReturnValue([]) });

    const res = mockRes();
    await showLecturerDashboard(mockReq(), res);

    expect(res.render).toHaveBeenCalledWith('lecturer-dashboard', expect.objectContaining({
      stats: { daysAvailable: 0, hoursAvailable: 0 },
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
      stats: { daysAvailable: 0, hoursAvailable: 0 },
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
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue({ daysAvailable: 0, hoursAvailable: 0 }) })
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
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue({ daysAvailable: 0, hoursAvailable: 0 }) })
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
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue({ daysAvailable: 0, hoursAvailable: 0 }) })
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
