const db = require('../../database/db');
const { FK_DISPLAY, getInputType, friendlyError, buildSearchQuery } = require('../services/admin-helpers');

const PAGE_SIZE = 20;

const getAllTables = () =>
  db.prepare(`SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`).all().map(r => r.name);

const getColumns = (tableName) =>
  db.prepare(`PRAGMA table_info("${tableName}")`).all();

const getForeignKeys = (tableName) =>
  db.prepare(`PRAGMA foreign_key_list("${tableName}")`).all();

const getForeignKeyOptions = (fkList) => {
  const options = {};
  fkList.forEach(fk => {
    if (!options[fk.from]) {
      const display = FK_DISPLAY[fk.table];
      if (display) {
        const [valCol, labelCol] = display;
        const rows = db.prepare(`SELECT "${valCol}" as val, "${labelCol}" as label FROM "${fk.table}" ORDER BY 2`).all();
        options[fk.from] = rows.map(r => ({ value: r.val, label: `${r.val} — ${r.label}` }));
      } else {
        const rows = db.prepare(`SELECT "${fk.to}" as val FROM "${fk.table}" ORDER BY 1`).all();
        options[fk.from] = rows.map(r => ({ value: r.val, label: String(r.val) }));
      }
    }
  });
  return options;
};

const getInputTypes = (columns) => {
  const types = {};
  columns.forEach(col => { types[col.name] = getInputType(col.name); });
  return types;
};

const showAdminDashboard = (req, res) => {
  const user = { id: req.session.userId, name: req.session.userName };
  const tables = getAllTables();
  res.render('admin-dashboard', {
    user, tables,
    activeTable: null, columns: [], rows: [], page: 1, totalPages: 1, totalRows: 0, search: '',
    fkOptions: {}, inputTypes: {}, error: null, success: null,
  });
};

const showTable = (req, res) => {
  const user = { id: req.session.userId, name: req.session.userName };
  const tables = getAllTables();
  const { tableName } = req.params;

  if (!tables.includes(tableName)) return res.status(404).send('Table not found');

  const page = Math.max(1, parseInt(req.query.page) || 1);
  const offset = (page - 1) * PAGE_SIZE;
  const search = (req.query.search || '').trim();
  const columns = getColumns(tableName);
  const fkOptions = getForeignKeyOptions(getForeignKeys(tableName));
  const inputTypes = getInputTypes(columns);

  let totalRows, rows;
  if (search) {
    const { whereClauses, params } = buildSearchQuery(columns, search);
    totalRows = db.prepare(`SELECT COUNT(*) as count FROM "${tableName}" WHERE ${whereClauses}`).get(...params).count;
    rows = db.prepare(`SELECT *, rowid as rowid FROM "${tableName}" WHERE ${whereClauses} LIMIT ? OFFSET ?`).all(...params, PAGE_SIZE, offset);
  } else {
    totalRows = db.prepare(`SELECT COUNT(*) as count FROM "${tableName}"`).get().count;
    rows = db.prepare(`SELECT *, rowid as rowid FROM "${tableName}" LIMIT ? OFFSET ?`).all(PAGE_SIZE, offset);
  }

  const totalPages = Math.max(1, Math.ceil(totalRows / PAGE_SIZE));

  res.render('admin-dashboard', {
    user, tables,
    activeTable: tableName, columns, rows, page, totalPages, totalRows, search, fkOptions, inputTypes,
    error: req.query.error || null,
    success: req.query.success || null,
  });
};

const createRecord = (req, res) => {
  const tables = getAllTables();
  const { tableName } = req.params;
  if (!tables.includes(tableName)) return res.status(404).send('Table not found');

  const columns = getColumns(tableName);
  const fields = columns.map(c => c.name);
  const values = fields.map(f => (req.body[f] !== '' && req.body[f] !== undefined) ? req.body[f] : null);
  const placeholders = fields.map(() => '?').join(', ');
  const fieldList = fields.map(f => `"${f}"`).join(', ');

  try {
    db.prepare(`INSERT INTO "${tableName}" (${fieldList}) VALUES (${placeholders})`).run(...values);
    res.redirect(`/admin/table/${tableName}?success=Record+added`);
  } catch (err) {
    const fkOptions = getForeignKeyOptions(getForeignKeys(tableName));
    const inputTypes = getInputTypes(columns);
    const totalRows = db.prepare(`SELECT COUNT(*) as count FROM "${tableName}"`).get().count;
    const totalPages = Math.max(1, Math.ceil(totalRows / PAGE_SIZE));
    const rows = db.prepare(`SELECT *, rowid as rowid FROM "${tableName}" LIMIT ?`).all(PAGE_SIZE);
    res.render('admin-dashboard', {
      user: { id: req.session.userId, name: req.session.userName },
      tables, activeTable: tableName, columns, rows, page: 1, totalPages, totalRows, search: '',
      fkOptions, inputTypes, error: friendlyError(err.message), success: null,
    });
  }
};

const updateRecord = (req, res) => {
  const tables = getAllTables();
  const { tableName, rowId } = req.params;
  if (!tables.includes(tableName)) return res.status(404).send('Table not found');

  const columns = getColumns(tableName);
  const updatable = columns.filter(c => c.pk === 0);
  if (updatable.length === 0)
    return res.redirect(`/admin/table/${tableName}?error=This+table+has+no+editable+columns`);

  const setClauses = updatable.map(c => `"${c.name}" = ?`).join(', ');
  const values = [
    ...updatable.map(c => (req.body[c.name] !== '' && req.body[c.name] !== undefined) ? req.body[c.name] : null),
    rowId,
  ];

  try {
    db.prepare(`UPDATE "${tableName}" SET ${setClauses} WHERE rowid = ?`).run(...values);
    res.redirect(`/admin/table/${tableName}?success=Record+updated`);
  } catch (err) {
    res.redirect(`/admin/table/${tableName}?error=${encodeURIComponent(friendlyError(err.message))}`);
  }
};

const deleteRecord = (req, res) => {
  const tables = getAllTables();
  const { tableName, rowId } = req.params;
  if (!tables.includes(tableName)) return res.status(404).send('Table not found');
  if (tableName === 'admins') return res.redirect('/admin/table/admins?error=Admin+accounts+cannot+be+deleted');

  try {
    db.prepare(`DELETE FROM "${tableName}" WHERE rowid = ?`).run(rowId);
    res.redirect(`/admin/table/${tableName}?success=Record+deleted`);
  } catch (err) {
    res.redirect(`/admin/table/${tableName}?error=${encodeURIComponent(friendlyError(err.message))}`);
  }
};

module.exports = { showAdminDashboard, showTable, createRecord, updateRecord, deleteRecord };
