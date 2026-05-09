const FK_DISPLAY = {
  students:    ['student_number', 'name'],
  staff:       ['staff_number', 'name'],
  courses:     ['course_code', 'course_name'],
  departments: ['dept_code', 'dept_name'],
  degrees:     ['degree_code', 'degree_name'],
};

const DAY_OPTIONS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

const getInputType = (colName) => {
  if (colName === 'day_of_week')                          return { type: 'select', options: DAY_OPTIONS };
  if (colName.includes('email'))                          return { type: 'email',  options: null };
  if (colName.includes('password'))                       return { type: 'password', options: null };
  if (colName.endsWith('_time'))                          return { type: 'time',   options: null };
  if (colName.endsWith('_date') || colName === 'consultation_date') return { type: 'date', options: null };
  return { type: 'text', options: null };
};

const friendlyError = (msg) => {
  if (msg.includes('FOREIGN KEY'))  return 'This value references a record that does not exist, or is still referenced by another record.';
  if (msg.includes('UNIQUE'))       return 'A record with this value already exists.';
  if (msg.includes('CHECK'))        return 'One of the values does not meet the required rules for this field.';
  if (msg.includes('NOT NULL'))     return 'A required field was left empty.';
  return msg;
};

const buildSearchQuery = (columns, searchTerm) => {
  const whereClauses = columns.map(c => `"${c.name}" LIKE ?`).join(' OR ');
  const params = columns.map(() => `%${searchTerm}%`);
  return { whereClauses, params };
};

module.exports = { FK_DISPLAY, getInputType, friendlyError, buildSearchQuery };
