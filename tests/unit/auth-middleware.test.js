const { requireAuth, requireRole } = require('../../src/middleware/auth-middleware');

const mockReq = (overrides = {}) => ({
  session: {},
  ...overrides
});

const mockRes = () => {
  const res = {};
  res.redirect = jest.fn();
  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

describe('requireAuth', () => {
  test('calls next() when a valid session exists', () => {
    // Arrange
    const req = mockReq({ session: { userId: 'A000356' } });
    const res = mockRes();
    const next = jest.fn();

    // Act
    requireAuth(req, res, next);

    // Assert
    expect(next).toHaveBeenCalled();
    expect(res.redirect).not.toHaveBeenCalled();
  });

  test('redirects to /login when there is no session', () => {
    // Arrange
    const req = mockReq({ session: {} });
    const res = mockRes();
    const next = jest.fn();

    // Act
    requireAuth(req, res, next);

    // Assert
    expect(res.redirect).toHaveBeenCalledWith('/login');
    expect(next).not.toHaveBeenCalled();
  });
});

describe('requireRole', () => {
  test('calls next() when the session role matches the required role', () => {
    // Arrange
    const req = mockReq({ session: { userRole: 'lecturer' } });
    const res = mockRes();
    const next = jest.fn();

    // Act
    requireRole('lecturer')(req, res, next);

    // Assert
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test('returns 403 when the session role does not match', () => {
    // Arrange
    const req = mockReq({ session: { userRole: 'student' } });
    const res = mockRes();
    const next = jest.fn();

    // Act
    requireRole('lecturer')(req, res, next);

    // Assert
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.send).toHaveBeenCalledWith('Forbidden');
    expect(next).not.toHaveBeenCalled();
  });
});
