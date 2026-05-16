const mockPrepare = jest.fn()

jest.mock('../../database/db', () => ({
  prepare: mockPrepare
}))

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashedPassword123')
}))

const { registerUser } = require('../../src/controllers/signup-controller')
jest.mock('../../src/services/logging-service', () => ({ logActivity: jest.fn().mockResolvedValue(true) }))

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
  test('rejects empty password', async () => {
    const req = mockReq({
      fullName: 'Test Student',
      number: '2468101',
      email: 'student@students.wits.ac.za',
      password: '',
      confirmPassword: ''
    })

    const res = mockRes()

    await registerUser(req, res)

    expect(res.render).toHaveBeenCalledWith(
      'sign-up', {
        message: null,
        // UPDATED: Matches the actual string in your controller code
        error: 'Registration error: Knock, knock! Who\'s there? Not your password, it seems. Please enter a password to continue.',
        redirectTo: null,
        fullName: req.body.fullName || '',
        number: req.body.number || '',
        email: req.body.email || ''
      })
  })

  // NEW: Added a test to verify your new password strength regex!
  test('rejects weak passwords missing uppercase or numbers', async () => {
    const req = mockReq({
      fullName: 'Test Student',
      number: '2468101',
      email: 'student@students.wits.ac.za',
      password: 'weakpassword',
      confirmPassword: 'weakpassword'
    })

    const res = mockRes()

    await registerUser(req, res)

    expect(res.render).toHaveBeenCalledWith(
      'sign-up',
      expect.objectContaining({
        error: 'Registration error: Password must be at least 8 characters long, contain one uppercase letter, and one number.'
      })
    )
  })

  test('rejects mismatched passwords', async () => {
    const req = mockReq({
      fullName: 'Test Student',
      number: '2468101',
      email: 'student@students.wits.ac.za',
      password: 'Password01',
      confirmPassword: 'Password02'
    })

    const res = mockRes()

    await registerUser(req, res)

    expect(res.render).toHaveBeenCalledWith(
      'sign-up',
      expect.objectContaining({
        error: 'Registration error: Passwords do not match.'
      })
    )
  })

  test('rejects invalid lecturer staff number', async () => {
    const req = mockReq({
      fullName: 'Test Lecturer',
      number: 'A123',
      email: 'lecturer@wits.ac.za',
      password: 'Password01',
      confirmPassword: 'Password01'
    })

    const res = mockRes()

    await registerUser(req, res)

    expect(res.render).toHaveBeenCalledWith(
      'sign-up',
      expect.objectContaining({
        error: 'Registration error: Staff numbers must start with A followed by 6 digits.'
      })
    )
  })

  test('rejects invalid student number', async () => {
    const req = mockReq({
      fullName: 'Test Student',
      number: '0123456',
      email: 'student@students.wits.ac.za',
      password: 'Password01',
      confirmPassword: 'Password01'
    })

    const res = mockRes()

    await registerUser(req, res)

    expect(res.render).toHaveBeenCalledWith(
      'sign-up',
      expect.objectContaining({
        error: 'Registration error: Student numbers must be 7 digits long and cannot start with 0. Numbers starting with 0 is outdated.'
      })
    )
  })

  test('rejects lecturer using student email', async () => {
    const req = mockReq({
      fullName: 'Test Lecturer',
      number: 'A000999',
      email: 'lecturer@students.wits.ac.za',
      password: 'Password01',
      confirmPassword: 'Password01'
    })

    const res = mockRes()

    await registerUser(req, res)

    expect(res.render).toHaveBeenCalledWith(
      'sign-up',
      expect.objectContaining({
        error: 'Registration error: Wrong email type: lecturers must use @wits.ac.za, not a student email.'
      })
    )
  })

  test('rejects invalid lecturer email domain', async () => {
    const req = mockReq({
      fullName: 'Test Lecturer',
      number: 'A000999',
      email: 'lecturer@gmail.com',
      password: 'Password01',
      confirmPassword: 'Password01'
    })

    const res = mockRes()

    await registerUser(req, res)

    expect(res.render).toHaveBeenCalledWith(
      'sign-up',
      expect.objectContaining({
        error: 'Registration error: Use Wits email address ending in @wits.ac.za.'
      })
    )
  })

  test('rejects student using lecturer email', async () => {
    const req = mockReq({
      fullName: 'Test Student',
      number: '2468101',
      email: 'student@wits.ac.za',
      password: 'Password01',
      confirmPassword: 'Password01'
    })

    const res = mockRes()

    await registerUser(req, res)

    expect(res.render).toHaveBeenCalledWith(
      'sign-up',
      expect.objectContaining({
        error: 'Registration error: Wrong email type: students must use @students.wits.ac.za, not a staff email.'
      })
    )
  })

  test('rejects invalid student email domain', async () => {
    const req = mockReq({
      fullName: 'Test Student',
      number: '2468101',
      email: 'student@gmail.com',
      password: 'Password01',
      confirmPassword: 'Password01'
    })

    const res = mockRes()

    await registerUser(req, res)

    expect(res.render).toHaveBeenCalledWith(
      'sign-up',
      expect.objectContaining({
        error: 'Registration error: Use Wits email address ending in @students.wits.ac.za.'
      })
    )
  })

  test('rejects duplicate lecturer staff number', async () => {
    mockPrepare.mockReturnValueOnce({
      get: jest.fn().mockReturnValue({ staff_number: 'A000999' })
    })

    const req = mockReq({
      fullName: 'Test Lecturer',
      number: 'A000999',
      email: 'lecturer@wits.ac.za',
      password: 'Password01',
      confirmPassword: 'Password01'
    })

    const res = mockRes()

    await registerUser(req, res)

    expect(res.render).toHaveBeenCalledWith(
      'sign-up',
      expect.objectContaining({
        error: 'Registration error: A user with this staff number already exists.'
      })
    )
  })

  test('rejects duplicate lecturer email', async () => {
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
      password: 'Password01',
      confirmPassword: 'Password01'
    })

    const res = mockRes()

    await registerUser(req, res)

    expect(res.render).toHaveBeenCalledWith(
      'sign-up',
      expect.objectContaining({
        error: 'Registration error: This email is already in use.'
      })
    )
  })

  test('rejects duplicate student number', async () => {
    mockPrepare.mockReturnValueOnce({
      get: jest.fn().mockReturnValue({ student_number: '2468101' })
    })

    const req = mockReq({
      fullName: 'Test Student',
      number: '2468101',
      email: 'student@students.wits.ac.za',
      password: 'Password01',
      confirmPassword: 'Password01'
    })

    const res = mockRes()

    await registerUser(req, res)

    expect(res.render).toHaveBeenCalledWith(
      'sign-up',
      expect.objectContaining({
        error: 'Registration error: A user with this student number already exists.'
      })
    )
  })

  test('rejects duplicate student email', async () => {
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
      password: 'Password01',
      confirmPassword: 'Password01'
    })

    const res = mockRes()

    await registerUser(req, res)

    expect(res.render).toHaveBeenCalledWith(
      'sign-up',
      expect.objectContaining({
        error: 'Registration error: This email is already in use.'
      })
    )
  })
})
