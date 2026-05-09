/* eslint-env jest */
const { showAdminDashboard, showTable, createRecord, updateRecord, deleteRecord } = require('../../src/controllers/admin-controller');

jest.mock('../../database/db', () => ({
  prepare: jest.fn()
}));

const db = require('../../database/db');

const mockReq = (overrides = {}) => ({
  session: { userId: 'ADMIN001', userName: 'System Admin' },
  params: {},
  query: {},
  body: {},
  ...overrides,
});

const mockRes = () => {
  const res = {};
  res.render = jest.fn();
  res.redirect = jest.fn();
  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

const TABLES = [{ name: 'admins' }, { name: 'courses' }, { name: 'departments' }];
const COLUMNS = [
  { cid: 0, name: 'admin_id', type: 'TEXT', notnull: 1, dflt_value: null, pk: 1 },
  { cid: 1, name: 'name',     type: 'TEXT', notnull: 1, dflt_value: null, pk: 0 },
];
const ROWS = [{ rowid: 1, admin_id: 'ADMIN001', name: 'System Admin' }];
const NO_FK = [];

beforeEach(() => db.prepare.mockReset());

describe('showAdminDashboard', () => {
  test('renders admin dashboard with list of tables and no active table', () => {
    db.prepare.mockReturnValueOnce({ all: jest.fn().mockReturnValue(TABLES) });

    const req = mockReq();
    const res = mockRes();

    showAdminDashboard(req, res);

    expect(res.render).toHaveBeenCalledWith('admin-dashboard', expect.objectContaining({
      tables: ['admins', 'courses', 'departments'],
      activeTable: null,
      columns: [],
      rows: [],
    }));
  });
});

describe('showTable', () => {
  test('renders table data for a valid table name', () => {
    db.prepare
      .mockReturnValueOnce({ all: jest.fn().mockReturnValue(TABLES) })   // getAllTables
      .mockReturnValueOnce({ all: jest.fn().mockReturnValue(COLUMNS) })  // getColumns
      .mockReturnValueOnce({ all: jest.fn().mockReturnValue(NO_FK) })    // getForeignKeys
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue({ count: 1 }) }) // COUNT
      .mockReturnValueOnce({ all: jest.fn().mockReturnValue(ROWS) });    // SELECT rows

    const req = mockReq({ params: { tableName: 'admins' }, query: {} });
    const res = mockRes();

    showTable(req, res);

    expect(res.render).toHaveBeenCalledWith('admin-dashboard', expect.objectContaining({
      activeTable: 'admins',
      columns: COLUMNS,
      rows: ROWS,
      page: 1,
      totalPages: 1,
      search: '',
    }));
  });

  test('filters rows using SQL LIKE when a search term is provided', () => {
    db.prepare
      .mockReturnValueOnce({ all: jest.fn().mockReturnValue(TABLES) })   // getAllTables
      .mockReturnValueOnce({ all: jest.fn().mockReturnValue(COLUMNS) })  // getColumns
      .mockReturnValueOnce({ all: jest.fn().mockReturnValue(NO_FK) })    // getForeignKeys
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue({ count: 1 }) }) // COUNT with LIKE
      .mockReturnValueOnce({ all: jest.fn().mockReturnValue(ROWS) });    // SELECT with LIKE

    const req = mockReq({ params: { tableName: 'admins' }, query: { search: 'Admin' } });
    const res = mockRes();

    showTable(req, res);

    expect(db.prepare).toHaveBeenCalledWith(expect.stringContaining('LIKE'));
    expect(res.render).toHaveBeenCalledWith('admin-dashboard', expect.objectContaining({
      search: 'Admin',
      activeTable: 'admins',
    }));
  });

  test('returns 404 when the table name is not in the whitelist', () => {
    db.prepare.mockReturnValueOnce({ all: jest.fn().mockReturnValue(TABLES) });

    const req = mockReq({ params: { tableName: 'nonexistent' }, query: {} });
    const res = mockRes();

    showTable(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith('Table not found');
  });
});

describe('createRecord', () => {
  test('redirects to the table view on successful insert', () => {
    db.prepare
      .mockReturnValueOnce({ all: jest.fn().mockReturnValue(TABLES) })   // getAllTables
      .mockReturnValueOnce({ all: jest.fn().mockReturnValue(COLUMNS) })  // getColumns
      .mockReturnValueOnce({ run: jest.fn() });                          // INSERT

    const req = mockReq({
      params: { tableName: 'admins' },
      body: { admin_id: 'ADMIN002', name: 'New Admin' },
    });
    const res = mockRes();

    createRecord(req, res);

    expect(res.redirect).toHaveBeenCalledWith('/admin/table/admins?success=Record+added');
  });

  test('re-renders with friendly error message when the insert fails', () => {
    db.prepare
      .mockReturnValueOnce({ all: jest.fn().mockReturnValue(TABLES) })   // getAllTables
      .mockReturnValueOnce({ all: jest.fn().mockReturnValue(COLUMNS) })  // getColumns
      .mockReturnValueOnce({ run: jest.fn().mockImplementation(() => { throw new Error('UNIQUE constraint failed'); }) })
      .mockReturnValueOnce({ all: jest.fn().mockReturnValue(NO_FK) })    // getForeignKeys (error path)
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue({ count: 1 }) }) // COUNT
      .mockReturnValueOnce({ all: jest.fn().mockReturnValue(ROWS) });    // SELECT rows

    const req = mockReq({
      params: { tableName: 'admins' },
      body: { admin_id: 'ADMIN001', name: 'Duplicate' },
    });
    const res = mockRes();

    createRecord(req, res);

    expect(res.render).toHaveBeenCalledWith('admin-dashboard', expect.objectContaining({
      error: 'A record with this value already exists.',
      activeTable: 'admins',
    }));
  });
});

describe('updateRecord', () => {
  test('redirects to the table view on successful update', () => {
    db.prepare
      .mockReturnValueOnce({ all: jest.fn().mockReturnValue(TABLES) })   // getAllTables
      .mockReturnValueOnce({ all: jest.fn().mockReturnValue(COLUMNS) })  // getColumns
      .mockReturnValueOnce({ run: jest.fn() });                          // UPDATE

    const req = mockReq({
      params: { tableName: 'admins', rowId: '1' },
      body: { name: 'Updated Name' },
    });
    const res = mockRes();

    updateRecord(req, res);

    expect(res.redirect).toHaveBeenCalledWith('/admin/table/admins?success=Record+updated');
  });

  test('redirects with friendly error when the update fails', () => {
    db.prepare
      .mockReturnValueOnce({ all: jest.fn().mockReturnValue(TABLES) })   // getAllTables
      .mockReturnValueOnce({ all: jest.fn().mockReturnValue(COLUMNS) })  // getColumns
      .mockReturnValueOnce({ run: jest.fn().mockImplementation(() => { throw new Error('NOT NULL constraint failed'); }) });

    const req = mockReq({
      params: { tableName: 'admins', rowId: '1' },
      body: { name: '' },
    });
    const res = mockRes();

    updateRecord(req, res);

    expect(res.redirect).toHaveBeenCalledWith(
      '/admin/table/admins?error=' + encodeURIComponent('A required field was left empty.')
    );
  });
});

describe('deleteRecord', () => {
  test('redirects to the table view on successful delete', () => {
    db.prepare
      .mockReturnValueOnce({ all: jest.fn().mockReturnValue(TABLES) })   // getAllTables
      .mockReturnValueOnce({ run: jest.fn() });                          // DELETE

    const req = mockReq({ params: { tableName: 'courses', rowId: '1' } });
    const res = mockRes();

    deleteRecord(req, res);

    expect(res.redirect).toHaveBeenCalledWith('/admin/table/courses?success=Record+deleted');
  });

  test('blocks deletion of admin accounts', () => {
    db.prepare.mockReturnValueOnce({ all: jest.fn().mockReturnValue(TABLES) });

    const req = mockReq({ params: { tableName: 'admins', rowId: '1' } });
    const res = mockRes();

    deleteRecord(req, res);

    expect(res.redirect).toHaveBeenCalledWith('/admin/table/admins?error=Admin+accounts+cannot+be+deleted');
  });

  test('redirects with friendly error when a foreign key constraint prevents deletion', () => {
    db.prepare
      .mockReturnValueOnce({ all: jest.fn().mockReturnValue([{ name: 'departments' }]) })
      .mockReturnValueOnce({ run: jest.fn().mockImplementation(() => { throw new Error('FOREIGN KEY constraint failed'); }) });

    const req = mockReq({ params: { tableName: 'departments', rowId: '1' } });
    const res = mockRes();

    deleteRecord(req, res);

    expect(res.redirect).toHaveBeenCalledWith(
      '/admin/table/departments?error=' + encodeURIComponent('This value references a record that does not exist, or is still referenced by another record.')
    );
  });
});
