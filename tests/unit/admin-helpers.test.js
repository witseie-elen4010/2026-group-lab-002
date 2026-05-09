/* eslint-env jest */
const { buildSearchQuery } = require('../../src/services/admin-helpers');

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
