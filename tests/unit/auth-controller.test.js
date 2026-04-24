const { showLogin, login, logout } = require('../../src/controllers/auth-controller');

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

describe('showLogin', () => {
  test('renders login page with no error when user is not logged in', () => {
    // Arrange
    const req = mockReq({ session: {} });
    const res = mockRes();

    // Act
    showLogin(req, res);

    // Assert
    expect(res.render).toHaveBeenCalledWith('login', { error: null });
  });

  test('redirects to lecturer dashboard if user already has a session', () => {
    // Arrange
    const req = mockReq({ session: { userId: 'A000356' } });
    const res = mockRes();

    // Act
    showLogin(req, res);

    // Assert
    expect(res.redirect).toHaveBeenCalledWith('/lecturer/dashboard');
  });
});

describe('login', () => {
  test('renders login with error when staff number is not found', () => {
    // Arrange
    db.prepare.mockReturnValue({ get: jest.fn().mockReturnValue(null) });
    const req = mockReq({ body: { staffNumber: 'UNKNOWN', password: 'any' } });
    const res = mockRes();

    // Act
    login(req, res);

    // Assert
    expect(res.render).toHaveBeenCalledWith('login', {
      error: 'Invalid credentials. Please try again.'
    });
  });

  test('renders login with error when password does not match', () => {
    // Arrange
    const fakeStaff = { staff_number: 'A000356', name: 'Clark Kent', password: 'pass' };
    db.prepare.mockReturnValue({ get: jest.fn().mockReturnValue(fakeStaff) });
    const req = mockReq({ body: { staffNumber: 'A000356', password: 'wrongpass' } });
    const res = mockRes();

    // Act
    login(req, res);

    // Assert
    expect(res.render).toHaveBeenCalledWith('login', {
      error: 'Invalid credentials. Please try again.'
    });
  });

  test('sets session and redirects to lecturer dashboard on valid credentials', () => {
    // Arrange
    const fakeStaff = { staff_number: 'A000356', name: 'Clark Kent', password: 'pass' };
    db.prepare.mockReturnValue({ get: jest.fn().mockReturnValue(fakeStaff) });
    const req = mockReq({ body: { staffNumber: 'A000356', password: 'pass' } });
    const res = mockRes();

    // Act
    login(req, res);

    // Assert
    expect(req.session.userId).toBe('A000356');
    expect(req.session.userName).toBe('Clark Kent');
    expect(req.session.userRole).toBe('lecturer');
    expect(res.redirect).toHaveBeenCalledWith('/lecturer/dashboard');
  });
});

describe('logout', () => {
  test('destroys session and redirects to login', () => {
    // Arrange
    const req = mockReq({
      session: { destroy: jest.fn((cb) => cb()) }
    });
    const res = mockRes();

    // Act
    logout(req, res);

    // Assert
    expect(req.session.destroy).toHaveBeenCalled();
    expect(res.redirect).toHaveBeenCalledWith('/login');
  });
});
