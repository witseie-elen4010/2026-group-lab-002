/* eslint-env jest */
const { showAdminDashboard, showTable, createRecord, updateRecord, deleteRecord } = require('../../src/controllers/admin-controller')

jest.mock('../../database/db', () => ({
  prepare: jest.fn(),
  transaction: jest.fn()
}))
jest.mock('../../src/services/logging-service', () => ({ logActivity: jest.fn().mockResolvedValue(true) }))

const db = require('../../database/db')
const { logActivity } = require('../../src/services/logging-service')

const mockReq = (overrides = {}) => ({
  session: { userId: 'ADMIN001', userName: 'System Admin' },
  params: {},
  query: {},
  body: {},
  ...overrides
})

const mockRes = () => {
  const res = {}
  res.render = jest.fn()
  res.redirect = jest.fn()
  res.status = jest.fn().mockReturnValue(res)
  res.send = jest.fn().mockReturnValue(res)
  return res
}

const TABLES = [{ name: 'admins' }, { name: 'courses' }, { name: 'departments' }]
const COLUMNS = [
  { cid: 0, name: 'admin_id', type: 'TEXT', notnull: 1, dflt_value: null, pk: 1 },
  { cid: 1, name: 'name', type: 'TEXT', notnull: 1, dflt_value: null, pk: 0 }
]
const ROWS = [{ rowid: 1, admin_id: 'ADMIN001', name: 'System Admin' }]
const NO_FK = []

const setupSmartMock = (scenario = 'default') => {
  db.prepare.mockImplementation((query) => {
    const q = query ? query.toLowerCase() : ''

    const stmt = {
      all: jest.fn().mockReturnValue([]),
      get: jest.fn().mockReturnValue(null),
      run: jest.fn().mockReturnValue({ lastInsertRowid: 1, changes: 1 })
    }

    // Safely route data
    if (q.includes('sqlite_master')) {
      stmt.all.mockReturnValue(TABLES)
      stmt.get.mockReturnValue(TABLES[0])
    } else if (q.includes('pragma table_info')) {
      stmt.all.mockReturnValue(COLUMNS)
    } else if (q.includes('pragma foreign_key_list')) {
      stmt.all.mockReturnValue(NO_FK)
    } else if (q.includes('count(') || q.includes('count (*)')) {
      stmt.get.mockReturnValue({ count: 1 })
      stmt.all.mockReturnValue([{ count: 1 }])
    } else if (q.includes('last_insert_rowid')) {
      stmt.get.mockReturnValue({ id: 1, last_insert_rowid: 1 })
    } else if (q.includes('select')) {
      if ((scenario === 'insert-success' || scenario === 'insert-error') && q.includes('where')) {
        stmt.get.mockReturnValue(null)
        stmt.all.mockReturnValue([])
      } else {
        stmt.get.mockReturnValue(ROWS[0])
        stmt.all.mockReturnValue(ROWS)
      }
    }

    // Inject Errors
    if (scenario === 'insert-error' && q.includes('insert')) {
      stmt.run.mockImplementation(() => { throw new Error('UNIQUE constraint failed') })
    } else if (scenario === 'update-error' && q.includes('update')) {
      stmt.run.mockImplementation(() => { throw new Error('NOT NULL constraint failed') })
    } else if (scenario === 'delete-error' && q.includes('delete')) {
      stmt.run.mockImplementation(() => { throw new Error('FOREIGN KEY constraint failed') })
    }

    return stmt
  })
}

beforeEach(() => {
  db.prepare.mockReset()
  logActivity.mockClear()
  db.transaction.mockImplementation((fn) => (...args) => fn(...args))
  setupSmartMock('default')
})

describe('showAdminDashboard', () => {
  test('renders admin dashboard with list of tables and no active table', async () => {
    const req = mockReq()
    const res = mockRes()

    await showAdminDashboard(req, res)

    expect(res.render).toHaveBeenCalledWith('admin-dashboard', expect.objectContaining({
      tables: ['admins', 'courses', 'departments'],
      activeTable: null,
      columns: [],
      rows: []
    }))
  })
})

describe('showTable', () => {
  test('renders table data for a valid table name', async () => {
    const req = mockReq({ params: { tableName: 'admins' }, query: {} })
    const res = mockRes()

    await showTable(req, res)

    expect(res.render).toHaveBeenCalledWith('admin-dashboard', expect.objectContaining({
      activeTable: 'admins',
      columns: COLUMNS,
      rows: ROWS,
      page: 1,
      totalPages: 1,
      search: ''
    }))
  })

  test('filters rows using SQL LIKE when a search term is provided', async () => {
    const req = mockReq({ params: { tableName: 'admins' }, query: { search: 'Admin' } })
    const res = mockRes()

    await showTable(req, res)

    expect(db.prepare).toHaveBeenCalledWith(expect.stringContaining('LIKE'))
    expect(res.render).toHaveBeenCalledWith('admin-dashboard', expect.objectContaining({
      search: 'Admin',
      activeTable: 'admins'
    }))
  })

  test('returns 404 when the table name is not in the whitelist', async () => {
    const req = mockReq({ params: { tableName: 'nonexistent' }, query: {} })
    const res = mockRes()

    await showTable(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.send).toHaveBeenCalledWith('Table not found')
  })
})

describe('createRecord', () => {
  test('redirects to the table view on successful insert', async () => {
    setupSmartMock('insert-success')

    const req = mockReq({
      params: { tableName: 'admins' },
      body: { admin_id: 'ADMIN002', name: 'New Admin' }
    })
    const res = mockRes()

    try {
      await createRecord(req, res)
    } catch (e) {
      console.error('🕵️ CONTROLLER CRASHED:', e) // This will print if it fails!
    }

    expect(res.redirect).toHaveBeenCalledWith('/admin/table/admins?success=Record+added')
  })

  test('re-renders with friendly error message when the insert fails', async () => {
    setupSmartMock('insert-error')

    const req = mockReq({
      params: { tableName: 'admins' },
      body: { admin_id: 'ADMIN001', name: 'Duplicate' }
    })
    const res = mockRes()

    await createRecord(req, res)

    expect(res.render).toHaveBeenCalledWith('admin-dashboard', expect.objectContaining({
      error: 'A record with this value already exists.',
      activeTable: 'admins'
    }))
  })
})

describe('updateRecord', () => {
  test('redirects to the table view on successful update', async () => {
    setupSmartMock('default')
    const req = mockReq({
      params: { tableName: 'admins', rowId: '1' },
      body: { name: 'Updated Name' }
    })
    const res = mockRes()

    await updateRecord(req, res)

    expect(res.redirect).toHaveBeenCalledWith('/admin/table/admins?success=Record+updated')
  })

  test('redirects with friendly error when the update fails', async () => {
    setupSmartMock('update-error')

    const req = mockReq({
      params: { tableName: 'admins', rowId: '1' },
      body: { name: '' }
    })
    const res = mockRes()

    await updateRecord(req, res)

    expect(res.redirect).toHaveBeenCalledWith(
      '/admin/table/admins?error=' + encodeURIComponent('A required field was left empty.')
    )
  })
})

describe('deleteRecord', () => {
  test('redirects to the table view on successful delete', async () => {
    setupSmartMock('default')
    const req = mockReq({ params: { tableName: 'courses', rowId: '1' } })
    const res = mockRes()

    await deleteRecord(req, res)

    expect(res.redirect).toHaveBeenCalledWith('/admin/table/courses?success=Record+deleted')
  })

  test('blocks deletion of admin accounts', async () => {
    setupSmartMock('default')
    const req = mockReq({ params: { tableName: 'admins', rowId: '1' } })
    const res = mockRes()

    await deleteRecord(req, res)

    expect(res.redirect).toHaveBeenCalledWith('/admin/table/admins?error=Admin+accounts+cannot+be+deleted')
  })

  test('redirects with friendly error when a foreign key constraint prevents deletion', async () => {
    setupSmartMock('delete-error')

    const req = mockReq({ params: { tableName: 'departments', rowId: '1' } })
    const res = mockRes()

    await deleteRecord(req, res)

    expect(res.redirect).toHaveBeenCalledWith(
      '/admin/table/departments?error=' + encodeURIComponent('This value references a record that does not exist, or is still referenced by another record.')
    )
  })
})
