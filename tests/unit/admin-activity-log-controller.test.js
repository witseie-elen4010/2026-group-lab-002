/* eslint-env jest */
jest.mock('../../database/db', () => ({ prepare: jest.fn() }))
jest.mock('../../src/services/activity-log-helpers', () => ({
  getEventLabel: jest.fn(name => name + '_label'),
  getCategory:   jest.fn(() => 'Auth'),
  getStatus:     jest.fn(() => 'Success'),
  resolveActorFallback: jest.fn(() => 'Unknown'),
  CATEGORY_ACTIONS: {
    Auth:  ['USER_LOGIN', 'AUTH_FAILED_LOGIN'],
    Admin: ['ADMIN_USER_ADD', 'ADMIN_USER_EDIT', 'ADMIN_USER_DELETE'],
  },
}))

const db = require('../../database/db')
const { showActivityLog, showFailedLogins, getFailedLoginCount } = require('../../src/controllers/admin-activity-log-controller')

const mockReq = (overrides = {}) => ({
  session: { userId: 'ADMIN001', userName: 'System Admin' },
  query: {},
  ...overrides,
})
const mockRes = () => { const r = {}; r.render = jest.fn(); r.redirect = jest.fn(); return r }

const fakeRow = {
  log_id: 1, user_id: '2345678', created_at: '2026-05-15 10:00:00',
  action_name: 'USER_LOGIN', page_context: '/login', description: 'User logged in',
  actor_name: 'Test Student', actor_role: 'Student', affected_summary: null,
}

const fakeAdminRow = {
  ...fakeRow, log_id: 2, action_name: 'ADMIN_USER_ADD', actor_role: 'Admin',
}

const fakeFailedRow = {
  ...fakeRow, log_id: 3, action_name: 'AUTH_FAILED_LOGIN',
}

const mockCount  = (n)    => ({ get: jest.fn().mockReturnValue({ count: n }) })
const mockGetN   = (n)    => ({ get: jest.fn().mockReturnValue({ n }) })
const mockRows   = (rows) => ({ all: jest.fn().mockReturnValue(rows) })
const mockAudit  = (data) => ({ get: jest.fn().mockReturnValue(data) })

beforeEach(() => db.prepare.mockReset())

// ── getFailedLoginCount ──────────────────────────────────────────────────────

describe('getFailedLoginCount', () => {
  test('returns count from DB', () => {
    db.prepare.mockReturnValueOnce(mockGetN(7))
    expect(getFailedLoginCount()).toBe(7)
  })

  test('returns 0 when there are no failed logins', () => {
    db.prepare.mockReturnValueOnce(mockGetN(0))
    expect(getFailedLoginCount()).toBe(0)
  })
})

// ── showActivityLog ──────────────────────────────────────────────────────────

describe('showActivityLog', () => {
  test('renders activity log with rows on happy path', () => {
    db.prepare
      .mockReturnValueOnce(mockCount(1))       // COUNT
      .mockReturnValueOnce(mockRows([fakeRow])) // rows
      .mockReturnValueOnce(mockGetN(3))         // getFailedLoginCount

    const res = mockRes()
    showActivityLog(mockReq(), res)

    expect(res.render).toHaveBeenCalledWith('admin-activity-log', expect.objectContaining({
      pageTitle: 'Activity Log',
      totalRows: 1,
      showCategoryFilter: true,
      formAction: '/admin/activity-log',
    }))
    const [, { rows }] = res.render.mock.calls[0]
    expect(rows[0]).toMatchObject({ action_name: 'USER_LOGIN', old_data: null, new_data: null })
  })

  test('renders empty state when no rows exist', () => {
    db.prepare
      .mockReturnValueOnce(mockCount(0))
      .mockReturnValueOnce(mockRows([]))
      .mockReturnValueOnce(mockGetN(0))

    const res = mockRes()
    showActivityLog(mockReq(), res)

    const [, { rows, totalRows }] = res.render.mock.calls[0]
    expect(rows).toHaveLength(0)
    expect(totalRows).toBe(0)
  })

  test('fetches audit data for ADMIN_CRUD actions', () => {
    db.prepare
      .mockReturnValueOnce(mockCount(1))
      .mockReturnValueOnce(mockRows([fakeAdminRow]))
      .mockReturnValueOnce(mockAudit({ old_data: '{"name":"old"}', new_data: '{"name":"new"}' }))
      .mockReturnValueOnce(mockGetN(0))

    const res = mockRes()
    showActivityLog(mockReq(), res)

    const [, { rows }] = res.render.mock.calls[0]
    expect(rows[0].old_data).toBe('{"name":"old"}')
    expect(rows[0].new_data).toBe('{"name":"new"}')
  })

  test('leaves old_data null when no audit record found for ADMIN_CRUD action', () => {
    db.prepare
      .mockReturnValueOnce(mockCount(1))
      .mockReturnValueOnce(mockRows([fakeAdminRow]))
      .mockReturnValueOnce(mockAudit(null))
      .mockReturnValueOnce(mockGetN(0))

    const res = mockRes()
    showActivityLog(mockReq(), res)

    const [, { rows }] = res.render.mock.calls[0]
    expect(rows[0].old_data).toBeNull()
  })

  test('passes search term through to template', () => {
    db.prepare
      .mockReturnValueOnce(mockCount(0))
      .mockReturnValueOnce(mockRows([]))
      .mockReturnValueOnce(mockGetN(0))

    const res = mockRes()
    showActivityLog(mockReq({ query: { search: 'alice' } }), res)

    const [, { search }] = res.render.mock.calls[0]
    expect(search).toBe('alice')
  })

  test('passes category filter through to template', () => {
    db.prepare
      .mockReturnValueOnce(mockCount(0))
      .mockReturnValueOnce(mockRows([]))
      .mockReturnValueOnce(mockGetN(0))

    const res = mockRes()
    showActivityLog(mockReq({ query: { category: 'Auth' } }), res)

    const [, { categoryFilter }] = res.render.mock.calls[0]
    expect(categoryFilter).toBe('Auth')
  })

  test('renders error state when DB throws', () => {
    db.prepare.mockReturnValueOnce({ get: jest.fn().mockImplementation(() => { throw new Error('DB down') }) })
    db.prepare.mockReturnValueOnce(mockGetN(0))

    const res = mockRes()
    showActivityLog(mockReq(), res)

    const [, { rows, error }] = res.render.mock.calls[0]
    expect(rows).toHaveLength(0)
    expect(error).toMatch(/could not load/i)
  })
})

// ── showFailedLogins ─────────────────────────────────────────────────────────

describe('showFailedLogins', () => {
  test('renders failed logins page with correct title and rows', () => {
    db.prepare
      .mockReturnValueOnce(mockCount(2))
      .mockReturnValueOnce(mockRows([fakeFailedRow, fakeFailedRow]))

    const res = mockRes()
    showFailedLogins(mockReq(), res)

    expect(res.render).toHaveBeenCalledWith('admin-activity-log', expect.objectContaining({
      pageTitle: 'Failed Logins',
      totalRows: 2,
      showCategoryFilter: false,
      formAction: '/admin/failed-logins',
      failedLoginCount: 2,
    }))
  })

  test('renders empty state when no failed logins exist', () => {
    db.prepare
      .mockReturnValueOnce(mockCount(0))
      .mockReturnValueOnce(mockRows([]))

    const res = mockRes()
    showFailedLogins(mockReq(), res)

    const [, { rows, totalRows }] = res.render.mock.calls[0]
    expect(rows).toHaveLength(0)
    expect(totalRows).toBe(0)
  })

  test('passes search term through to template', () => {
    db.prepare
      .mockReturnValueOnce(mockCount(0))
      .mockReturnValueOnce(mockRows([]))

    const res = mockRes()
    showFailedLogins(mockReq({ query: { search: 'bob' } }), res)

    const [, { search }] = res.render.mock.calls[0]
    expect(search).toBe('bob')
  })

  test('rows have old_data and new_data set to null', () => {
    db.prepare
      .mockReturnValueOnce(mockCount(1))
      .mockReturnValueOnce(mockRows([fakeFailedRow]))

    const res = mockRes()
    showFailedLogins(mockReq(), res)

    const [, { rows }] = res.render.mock.calls[0]
    expect(rows[0].old_data).toBeNull()
    expect(rows[0].new_data).toBeNull()
  })

  test('renders error state when DB throws', () => {
    db.prepare.mockReturnValueOnce({ get: jest.fn().mockImplementation(() => { throw new Error('DB down') }) })
    db.prepare.mockReturnValueOnce(mockGetN(0))

    const res = mockRes()
    showFailedLogins(mockReq(), res)

    const [, { rows, error }] = res.render.mock.calls[0]
    expect(rows).toHaveLength(0)
    expect(error).toMatch(/could not load/i)
  })
})
