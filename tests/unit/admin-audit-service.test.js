/* eslint-env jest */
const { logAdminAudit } = require('../../src/services/admin-audit-service');

jest.mock('../../database/db', () => ({ prepare: jest.fn() }));

const db = require('../../database/db');

const mockRun = jest.fn();
beforeEach(() => {
  db.prepare.mockReset();
  mockRun.mockReset();
  db.prepare.mockReturnValue({ run: mockRun });
});

describe('logAdminAudit()', () => {
  test('calls db.prepare with an INSERT into admin_audit_log', () => {
    logAdminAudit({ adminId: 'ADMIN001', action: 'INSERT', tableName: 'students', rowId: 42 });

    expect(db.prepare).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO admin_audit_log'));
  });

  test('passes adminId, action, tableName, and stringified rowId to run()', () => {
    logAdminAudit({ adminId: 'ADMIN001', action: 'DELETE', tableName: 'courses', rowId: 7 });

    expect(mockRun).toHaveBeenCalledWith('ADMIN001', 'DELETE', 'courses', '7', null, null);
  });

  test('converts numeric rowId to a string', () => {
    logAdminAudit({ adminId: 'ADMIN001', action: 'UPDATE', tableName: 'staff', rowId: 99 });

    const [,,,rowId] = mockRun.mock.calls[0];
    expect(rowId).toBe('99');
  });

  test('serialises oldData as JSON when provided', () => {
    const oldData = { name: 'Old Name', email: 'old@wits.ac.za' };
    logAdminAudit({ adminId: 'ADMIN001', action: 'UPDATE', tableName: 'staff', rowId: 1, oldData });

    const [,,,,oldArg] = mockRun.mock.calls[0];
    expect(oldArg).toBe(JSON.stringify(oldData));
  });

  test('serialises newData as JSON when provided', () => {
    const newData = { name: 'New Name', email: 'new@wits.ac.za' };
    logAdminAudit({ adminId: 'ADMIN001', action: 'INSERT', tableName: 'staff', rowId: 1, newData });

    const [,,,, ,newArg] = mockRun.mock.calls[0];
    expect(newArg).toBe(JSON.stringify(newData));
  });

  test('passes null for oldData and newData when not provided', () => {
    logAdminAudit({ adminId: 'ADMIN001', action: 'INSERT', tableName: 'courses', rowId: 3 });

    const [,,,,oldArg, newArg] = mockRun.mock.calls[0];
    expect(oldArg).toBeNull();
    expect(newArg).toBeNull();
  });

  test('passes oldData as JSON and null for newData when only oldData is provided (DELETE case)', () => {
    const oldData = { dept_code: 'ENG', dept_name: 'Engineering' };
    logAdminAudit({ adminId: 'ADMIN001', action: 'DELETE', tableName: 'departments', rowId: 5, oldData });

    const [,,,,oldArg, newArg] = mockRun.mock.calls[0];
    expect(oldArg).toBe(JSON.stringify(oldData));
    expect(newArg).toBeNull();
  });

  test('throws if action is not INSERT, UPDATE, or DELETE', () => {
    expect(() => logAdminAudit({ adminId: 'ADMIN001', action: 'DROP', tableName: 'students', rowId: 1 }))
      .toThrow('invalid action');
  });
});
