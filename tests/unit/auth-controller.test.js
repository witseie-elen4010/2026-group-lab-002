/* eslint-env jest */
const { showLogin, login, logout } = require('../../src/controllers/auth-controller');

jest.mock('../../database/db', () => ({
  prepare: jest.fn()
}));

const db = require('../../database/db');

const mockReq = (overrides = {}) => ({
  session: {},
  body: {},
  query: {},
  ...overrides
});

const mockRes = () => {
  const res = {};
  res.render = jest.fn();
  res.redirect = jest.fn();
  return res;
};

beforeEach(() => db.prepare.mockReset());

describe('showLogin', () => {
  test('renders login page with no error or success when not logged in', () => {
    const req = mockReq({ session: {}, query: {} });
    const res = mockRes();

    showLogin(req, res);

    expect(res.render).toHaveBeenCalledWith('login', { error: null, success: null });
  });

  test('passes success query param through to the login view', () => {
    const req = mockReq({ session: {}, query: { success: 'Account created! Please log in.' } });
    const res = mockRes();

    showLogin(req, res);

    expect(res.render).toHaveBeenCalledWith('login', {
      error: null,
      success: 'Account created! Please log in.',
    });
  });

  test('redirects logged-in lecturer to lecturer dashboard', () => {
    const req = mockReq({ session: { userId: 'A000356', userRole: 'lecturer' } });
    const res = mockRes();

    showLogin(req, res);

    expect(res.redirect).toHaveBeenCalledWith('/lecturer/dashboard');
  });

  test('redirects logged-in student to student dashboard', () => {
    const req = mockReq({ session: { userId: 1234567, userRole: 'student' } });
    const res = mockRes();

    showLogin(req, res);

    expect(res.redirect).toHaveBeenCalledWith('/student/dashboard');
  });
});

describe('login', () => {
  const fakeStaff   = { staff_number: 'A000356', name: 'Clark Kent', password: 'pass' };
  const fakeStudent = { student_number: 1234567,  name: 'Aditya',     password: 'pass' };

  test('sets lecturer session and redirects to lecturer dashboard on valid staff credentials', () => {
    db.prepare.mockReturnValueOnce({ get: jest.fn().mockReturnValue(fakeStaff) });

    const req = mockReq({ body: { staffStudentNumber: 'A000356', password: 'pass' } });
    const res = mockRes();

    login(req, res);

    expect(req.session.userId).toBe('A000356');
    expect(req.session.userName).toBe('Clark Kent');
    expect(req.session.userRole).toBe('lecturer');
    expect(res.redirect).toHaveBeenCalledWith('/lecturer/dashboard?welcome=1');
  });

  test('sets student session and redirects to student dashboard on valid student credentials', () => {
    db.prepare
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue(null) })
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue(fakeStudent) });

    const req = mockReq({ body: { staffStudentNumber: '1234567', password: 'pass' } });
    const res = mockRes();

    login(req, res);

    expect(req.session.userId).toBe(1234567);
    expect(req.session.userName).toBe('Aditya');
    expect(req.session.userRole).toBe('student');
    expect(res.redirect).toHaveBeenCalledWith('/student/dashboard?welcome=1');
  });

  test('renders error when neither staff nor student matches', () => {
    db.prepare
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue(null) })
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue(null) });

    const req = mockReq({ body: { staffStudentNumber: 'UNKNOWN', password: 'any' } });
    const res = mockRes();

    login(req, res);

    expect(res.render).toHaveBeenCalledWith('login', {
      error: 'Invalid username or password.',
      success: null,
    });
  });

  test('renders error when staff is found but password does not match', () => {
    db.prepare
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue(fakeStaff) })
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue(null) });

    const req = mockReq({ body: { staffStudentNumber: 'A000356', password: 'wrongpass' } });
    const res = mockRes();

    login(req, res);

    expect(res.render).toHaveBeenCalledWith('login', {
      error: 'Invalid username or password.',
      success: null,
    });
  });
});

describe('logout', () => {
  test('destroys session and redirects to homepage', () => {
    const req = mockReq({
      session: { destroy: jest.fn((cb) => cb()) }
    });
    const res = mockRes();

    logout(req, res);

    expect(req.session.destroy).toHaveBeenCalled();
    expect(res.redirect).toHaveBeenCalledWith('/');
  });
});
