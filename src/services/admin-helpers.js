const buildSearchQuery = (columns, searchTerm) => {
  const whereClauses = columns.map(c => `"${c.name}" LIKE ?`).join(' OR ');
  const params = columns.map(() => `%${searchTerm}%`);
  return { whereClauses, params };
};

module.exports = { buildSearchQuery };
