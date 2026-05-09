const mockPrepare = jest.fn()

jest.mock('../../database/db', () => ({
  prepare: mockPrepare
}))

const { registerUser } = require('../../src/controllers/signup-controller')

const mockReq = (body = {}) => ({ body })

const mockRes = () => {
  const res = {}
  res.render = jest.fn()
  res.redirect = jest.fn()
  res.status = jest.fn().mockReturnValue({ send: jest.fn() })
  return res
}

beforeEach(() => {
  mockPrepare.mockReset()
})

describe('Sign Up error message validation', () => {
  test('rejects empty password', () => {
    const req = mockReq({
      fullName: 'Test Student',
      number: '2468101',
      email: 'student@students.wits.ac.za',
      password: '',
      confirmPassword: ''
    })

    const res = mockRes()

    registerUser(req, res)

    expect(res.render).toHaveBeenCalledWith(
      'sign-up', {
        message: null,
        error: 'Registration error: Bro, lock the door to this account with some kind of password. Bro, seriously.',
        redirectTo: null,
        fullName: req.body.fullName || '',
        number: req.body.number || '',
        email: req.body.email || ''
      })
  })

  test('rejects mismatched passwords', () => {
    const req = mockReq({
      fullName: 'Test Student',
      number: '2468101',
      email: 'student@students.wits.ac.za',
      password: 'pass1',
      confirmPassword: 'pass2'
    })

    const res = mockRes()

    registerUser(req, res)

    expect(res.render).toHaveBeenCalledWith(
      'sign-up',
      expect.objectContaining({
        error: 'Registration error: Passwords do not match.'
      })
    )
  })

  test('rejects invalid lecturer staff number', () => {
    const req = mockReq({
      fullName: 'Test Lecturer',
      number: 'A123',
      email: 'lecturer@wits.ac.za',
      password: 'pass',
      confirmPassword: 'pass'
    })

    const res = mockRes()

    registerUser(req, res)

    expect(res.render).toHaveBeenCalledWith(
      'sign-up',
      expect.objectContaining({
        error: 'Registration error: Staff numbers must start with A followed by 6 digits.'
      })
    )
  })

  test('rejects invalid student number', () => {
    const req = mockReq({
      fullName: 'Test Student',
      number: '0123456',
      email: 'student@students.wits.ac.za',
      password: 'pass',
      confirmPassword: 'pass'
    })

    const res = mockRes()

    registerUser(req, res)

    expect(res.render).toHaveBeenCalledWith(
      'sign-up',
      expect.objectContaining({
        error: 'Registration error: Student numbers must be 7 digits long and cannot start with 0. Numbers starting with 0 is outdated.'
      })
    )
  })

  test('rejects lecturer using student email', () => {
    const req = mockReq({
      fullName: 'Test Lecturer',
      number: 'A000999',
      email: 'lecturer@students.wits.ac.za',
      password: 'pass',
      confirmPassword: 'pass'
    })

    const res = mockRes()

    registerUser(req, res)

    expect(res.render).toHaveBeenCalledWith(
      'sign-up',
      expect.objectContaining({
        error: 'Registration error: Wrong email type: lecturers must use @wits.ac.za, not a student email.'
      })
    )
  })

  test('rejects invalid lecturer email domain', () => {
    const req = mockReq({
      fullName: 'Test Lecturer',
      number: 'A000999',
      email: 'lecturer@gmail.com',
      password: 'pass',
      confirmPassword: 'pass'
    })

    const res = mockRes()

    registerUser(req, res)

    expect(res.render).toHaveBeenCalledWith(
      'sign-up',
      expect.objectContaining({
        error: 'Registration error: Use Wits email address ending in @wits.ac.za.'
      })
    )
  })

  test('rejects student using lecturer email', () => {
    const req = mockReq({
      fullName: 'Test Student',
      number: '2468101',
      email: 'student@wits.ac.za',
      password: 'pass',
      confirmPassword: 'pass'
    })

    const res = mockRes()

    registerUser(req, res)

    expect(res.render).toHaveBeenCalledWith(
      'sign-up',
      expect.objectContaining({
        error: 'Registration error: Wrong email type: students must use @students.wits.ac.za, not a staff email.'
      })
    )
  })

  test('rejects invalid student email domain', () => {
    const req = mockReq({
      fullName: 'Test Student',
      number: '2468101',
      email: 'student@gmail.com',
      password: 'pass',
      confirmPassword: 'pass'
    })

    const res = mockRes()

    registerUser(req, res)

    expect(res.render).toHaveBeenCalledWith(
      'sign-up',
      expect.objectContaining({
        error: 'Registration error: Use Wits email address ending in @students.wits.ac.za.'
      })
    )
  })

  test('rejects duplicate lecturer staff number', () => {
    mockPrepare.mockReturnValueOnce({
      get: jest.fn().mockReturnValue({ staff_number: 'A000999' })
    })

    const req = mockReq({
      fullName: 'Test Lecturer',
      number: 'A000999',
      email: 'lecturer@wits.ac.za',
      password: 'pass',
      confirmPassword: 'pass'
    })

    const res = mockRes()

    registerUser(req, res)

    expect(res.render).toHaveBeenCalledWith(
      'sign-up',
      expect.objectContaining({
        error: 'Registration error: A user with this staff number already exists.'
      })
    )
  })

  test('rejects duplicate lecturer email', () => {
    mockPrepare
      .mockReturnValueOnce({
        get: jest.fn().mockReturnValue(undefined)
      })
      .mockReturnValueOnce({
        get: jest.fn().mockReturnValue({ email: 'lecturer@wits.ac.za' })
      })

    const req = mockReq({
      fullName: 'Test Lecturer',
      number: 'A000999',
      email: 'lecturer@wits.ac.za',
      password: 'pass',
      confirmPassword: 'pass'
    })

    const res = mockRes()

    registerUser(req, res)

    expect(res.render).toHaveBeenCalledWith(
      'sign-up',
      expect.objectContaining({
        error: 'Registration error: This email is already in use.'
      })
    )
  })

  test('rejects duplicate student number', () => {
    mockPrepare.mockReturnValueOnce({
      get: jest.fn().mockReturnValue({ student_number: '2468101' })
    })

    const req = mockReq({
      fullName: 'Test Student',
      number: '2468101',
      email: 'student@students.wits.ac.za',
      password: 'pass',
      confirmPassword: 'pass'
    })

    const res = mockRes()

    registerUser(req, res)

    expect(res.render).toHaveBeenCalledWith(
      'sign-up',
      expect.objectContaining({
        error: 'Registration error: A user with this student number already exists.'
      })
    )
  })

  test('rejects duplicate student email', () => {
    mockPrepare
      .mockReturnValueOnce({
        get: jest.fn().mockReturnValue(undefined)
      })
      .mockReturnValueOnce({
        get: jest.fn().mockReturnValue({ email: 'student@students.wits.ac.za' })
      })

    const req = mockReq({
      fullName: 'Test Student',
      number: '2468101',
      email: 'student@students.wits.ac.za',
      password: 'pass',
      confirmPassword: 'pass'
    })

    const res = mockRes()

    registerUser(req, res)

    expect(res.render).toHaveBeenCalledWith(
      'sign-up',
      expect.objectContaining({
        error: 'Registration error: This email is already in use.'
      })
    )
  })
})
