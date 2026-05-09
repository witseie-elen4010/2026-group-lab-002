/* eslint-env jest */
const { buildSearchQuery, getInputType, friendlyError } = require('../../src/services/admin-helpers');

const COLUMNS = [
  { name: 'admin_id', pk: 1 },
  { name: 'name',     pk: 0 },
  { name: 'email',    pk: 0 },
];

describe('buildSearchQuery', () => {
  test('builds a LIKE clause for every column', () => {
    const { whereClauses } = buildSearchQuery(COLUMNS, 'test');
    expect(whereClauses).toBe('"admin_id" LIKE ? OR "name" LIKE ? OR "email" LIKE ?');
  });

  test('wraps the search term in % wildcards for each column', () => {
    const { params } = buildSearchQuery(COLUMNS, 'test');
    expect(params).toEqual(['%test%', '%test%', '%test%']);
  });

  test('produces one param entry per column', () => {
    const { params } = buildSearchQuery(COLUMNS, 'x');
    expect(params).toHaveLength(COLUMNS.length);
  });
});

describe('getInputType', () => {
  test('returns select with day options for day_of_week', () => {
    const result = getInputType('day_of_week');
    expect(result.type).toBe('select');
    expect(result.options).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  });

  test('returns email type for columns containing "email"', () => {
    expect(getInputType('email').type).toBe('email');
    expect(getInputType('staff_email').type).toBe('email');
  });

  test('returns password type for columns containing "password"', () => {
    expect(getInputType('password').type).toBe('password');
    expect(getInputType('hashed_password').type).toBe('password');
  });

  test('returns time type for columns ending with _time', () => {
    expect(getInputType('start_time').type).toBe('time');
    expect(getInputType('end_time').type).toBe('time');
  });

  test('returns date type for columns ending with _date or named consultation_date', () => {
    expect(getInputType('booking_date').type).toBe('date');
    expect(getInputType('consultation_date').type).toBe('date');
  });

  test('returns text type for unrecognised column names', () => {
    const result = getInputType('student_number');
    expect(result.type).toBe('text');
    expect(result.options).toBeNull();
  });
});

describe('friendlyError', () => {
  test('maps FOREIGN KEY error to a readable message', () => {
    const msg = friendlyError('FOREIGN KEY constraint failed');
    expect(msg).toMatch(/references a record/i);
  });

  test('maps UNIQUE error to a readable message', () => {
    const msg = friendlyError('UNIQUE constraint failed: students.student_number');
    expect(msg).toMatch(/already exists/i);
  });

  test('maps CHECK error to a readable message', () => {
    const msg = friendlyError('CHECK constraint failed: lecturer_availability');
    expect(msg).toMatch(/required rules/i);
  });

  test('maps NOT NULL error to a readable message', () => {
    const msg = friendlyError('NOT NULL constraint failed: staff.name');
    expect(msg).toMatch(/required field/i);
  });

  test('returns the original message when no pattern matches', () => {
    const raw = 'some unexpected database error';
    expect(friendlyError(raw)).toBe(raw);
  });
});
