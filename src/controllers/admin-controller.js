const db = require('../../database/db')
const { logActivity } = require('../services/logging-service')
const ActionTypes = require('../services/action-types')
const { FK_DISPLAY, getInputType, friendlyError, buildSearchQuery } = require('../services/admin-helpers')
const { logAdminAudit } = require('../services/admin-audit-service')

const PAGE_SIZE = 20
// tables the admin UI can view but not modify
const READ_ONLY_TABLES = ['admin_audit_log', 'activity_log', 'affected_records', 'actions', 'failed_login_log']

const getAllTables = () =>
  db.prepare('SELECT name FROM sqlite_master WHERE type=\'table\' ORDER BY name').all().map(r => r.name)

const getColumns = (tableName) =>
  db.prepare(`PRAGMA table_info("${tableName}")`).all()

const getForeignKeys = (tableName) =>
  db.prepare(`PRAGMA foreign_key_list("${tableName}")`).all()

const getForeignKeyOptions = (fkList) => {
  const options = {}
  fkList.forEach(fk => {
    if (!options[fk.from]) {
      const display = FK_DISPLAY[fk.table]
      if (display) {
        const [valCol, labelCol] = display
        const rows = db.prepare(`SELECT "${valCol}" as val, "${labelCol}" as label FROM "${fk.table}" ORDER BY 2`).all()
        options[fk.from] = rows.map(r => ({ value: r.val, label: `${r.val} — ${r.label}` }))
      } else {
        const rows = db.prepare(`SELECT "${fk.to}" as val FROM "${fk.table}" ORDER BY 1`).all()
        options[fk.from] = rows.map(r => ({ value: r.val, label: String(r.val) }))
      }
    }
  })
  return options
}

const getInputTypes = (columns) => {
  const types = {}
  columns.forEach(col => { types[col.name] = getInputType(col.name) })
  return types
}

const showAdminDashboard = (req, res) => {
  if (!req.session || !req.session.userId) {
    return res.redirect('/login');
  }
  const user = { id: req.session.userId, name: req.session.userName }
  const tables = getAllTables()
  const stats = {
    students: db.prepare('SELECT COUNT(*) as n FROM students').get().n,
    staff: db.prepare('SELECT COUNT(*) as n FROM staff').get().n,
    consultations: db.prepare('SELECT COUNT(*) as n FROM consultations').get().n,
    availability: db.prepare('SELECT COUNT(*) as n FROM lecturer_availability').get().n
  }
  res.render('admin-dashboard', {
    user,
    tables,
    stats,
    activeTable: null,
    isReadOnly: false,
    columns: [],
    rows: [],
    page: 1,
    totalPages: 1,
    totalRows: 0,
    search: '',
    fkOptions: {},
    inputTypes: {},
    error: null,
    success: null
  })
}

const showTable = (req, res) => {
  const user = { id: req.session.userId, name: req.session.userName }
  const tables = getAllTables()
  const { tableName } = req.params

  if (!tables.includes(tableName)) return res.status(404).send('Table not found')

  const page = Math.max(1, parseInt(req.query.page) || 1)
  const offset = (page - 1) * PAGE_SIZE
  const search = (req.query.search || '').trim()
  const columns = getColumns(tableName)
  const fkOptions = getForeignKeyOptions(getForeignKeys(tableName))
  const inputTypes = getInputTypes(columns)

  let totalRows, rows
  if (tableName === 'consultations') {
    const consultFrom = `
      FROM consultations c
      LEFT JOIN staff     stf ON c.lecturer_id = stf.staff_number
      LEFT JOIN students  st  ON c.organiser   = st.student_number
    `
    const courseInfo = `(
      SELECT cr.course_code || ' — ' || cr.course_name
      FROM courses cr
      JOIN staff_courses sc ON sc.course_code = cr.course_code
      JOIN enrollments   e  ON e.course_code  = cr.course_code
      WHERE sc.staff_number = c.lecturer_id AND e.student_number = c.organiser
      LIMIT 1
    ) AS course_info`
    const select = `SELECT c.*, c.rowid, stf.name AS lecturer_name, st.name AS organiser_name, ${courseInfo}`
    if (search) {
      const like = `%${search}%`
      const searchWhere = `WHERE (c.consultation_title LIKE ? OR c.consultation_date LIKE ?
        OR c.lecturer_id LIKE ? OR CAST(c.organiser AS TEXT) LIKE ? OR c.status LIKE ?)`
      const sp = [like, like, like, like, like]
      totalRows = db.prepare(`SELECT COUNT(*) as count ${consultFrom} ${searchWhere}`).get(...sp).count
      rows = db.prepare(`${select} ${consultFrom} ${searchWhere} ORDER BY c.consultation_date DESC LIMIT ? OFFSET ?`).all(...sp, PAGE_SIZE, offset)
    } else {
      totalRows = db.prepare(`SELECT COUNT(*) as count FROM consultations`).get().count
      rows = db.prepare(`${select} ${consultFrom} ORDER BY c.consultation_date DESC LIMIT ? OFFSET ?`).all(PAGE_SIZE, offset)
    }
  } else if (search) {
    const { whereClauses, params } = buildSearchQuery(columns, search)
    totalRows = db.prepare(`SELECT COUNT(*) as count FROM "${tableName}" WHERE ${whereClauses}`).get(...params).count
    rows = db.prepare(`SELECT *, rowid as rowid FROM "${tableName}" WHERE ${whereClauses} LIMIT ? OFFSET ?`).all(...params, PAGE_SIZE, offset)
  } else {
    totalRows = db.prepare(`SELECT COUNT(*) as count FROM "${tableName}"`).get().count
    rows = db.prepare(`SELECT *, rowid as rowid FROM "${tableName}" LIMIT ? OFFSET ?`).all(PAGE_SIZE, offset)
  }

  const totalPages = Math.max(1, Math.ceil(totalRows / PAGE_SIZE))

  res.render('admin-dashboard', {
    user,
    tables,
    activeTable: tableName,
    isReadOnly: READ_ONLY_TABLES.includes(tableName),
    columns,
    rows,
    page,
    totalPages,
    totalRows,
    search,
    fkOptions,
    inputTypes,
    error: req.query.error || null,
    success: req.query.success || null
  })
}

const createRecord = async (req, res) => {
  const tables = getAllTables()
  const { tableName } = req.params
  if (!tables.includes(tableName)) return res.status(404).send('Table not found')
  if (READ_ONLY_TABLES.includes(tableName))
    return res.redirect(`/admin/table/${tableName}?error=This+table+is+read-only`)

  const columns = getColumns(tableName)
  const fields = columns.map(c => c.name)
  const values = fields.map(f => (req.body[f] !== '' && req.body[f] !== undefined) ? req.body[f] : null)
  const placeholders = fields.map(() => '?').join(', ')
  const fieldList = fields.map(f => `"${f}"`).join(', ')

  try {
    const result = db.prepare(`INSERT INTO "${tableName}" (${fieldList}) VALUES (${placeholders})`).run(...values)
    logAdminAudit({
      adminId: req.session.userId,
      action: 'INSERT',
      tableName,
      rowId: result.lastInsertRowid,
      newData: req.body
    })
    await logActivity(req.session.userId, ActionTypes.ADMIN_USER_ADD, [{ table: tableName, id: result.lastInsertRowid }])
    res.redirect(`/admin/table/${tableName}?success=Record+added`)
  } catch (err) {
    const fkOptions = getForeignKeyOptions(getForeignKeys(tableName))
    const inputTypes = getInputTypes(columns)
    const totalRows = db.prepare(`SELECT COUNT(*) as count FROM "${tableName}"`).get().count
    const totalPages = Math.max(1, Math.ceil(totalRows / PAGE_SIZE))
    const rows = db.prepare(`SELECT *, rowid as rowid FROM "${tableName}" LIMIT ?`).all(PAGE_SIZE)
    res.render('admin-dashboard', {
      user: { id: req.session.userId, name: req.session.userName },
      tables,
      activeTable: tableName,
      columns,
      rows,
      page: 1,
      totalPages,
      totalRows,
      search: '',
      fkOptions,
      inputTypes,
      error: friendlyError(err.message),
      success: null
    })
  }
}

const updateRecord = async (req, res) => {
  const tables = getAllTables()
  const { tableName, rowId } = req.params
  if (!tables.includes(tableName)) return res.status(404).send('Table not found')
  if (READ_ONLY_TABLES.includes(tableName))
    return res.redirect(`/admin/table/${tableName}?error=This+table+is+read-only`)

  const columns = getColumns(tableName)
  const updatable = columns.filter(c => c.pk === 0)
  if (updatable.length === 0) { return res.redirect(`/admin/table/${tableName}?error=This+table+has+no+editable+columns`) }

  const existingRecord = db.prepare(`SELECT *, rowid FROM "${tableName}" WHERE rowid = ?`).get(rowId)
  if (!existingRecord)
    return res.redirect(`/admin/table/${tableName}?error=Record+not+found`)

  const setClauses = updatable.map(c => `"${c.name}" = ?`).join(', ')
  const values = [
    ...updatable.map(c => (req.body[c.name] !== '' && req.body[c.name] !== undefined) ? req.body[c.name] : null),
    rowId
  ]

  try {
    const result = db.prepare(`UPDATE "${tableName}" SET ${setClauses} WHERE rowid = ?`).run(...values)
    if (result.changes === 0)
      return res.redirect(`/admin/table/${tableName}?error=Record+not+found`)
    logAdminAudit({
      adminId: req.session.userId,
      action: 'UPDATE',
      tableName,
      rowId,
      oldData: existingRecord,
      newData: req.body
    })
    await logActivity(req.session.userId, ActionTypes.ADMIN_USER_EDIT, [{ table: tableName, id: rowId }])
    res.redirect(`/admin/table/${tableName}?success=Record+updated`)
  } catch (err) {
    res.redirect(`/admin/table/${tableName}?error=${encodeURIComponent(friendlyError(err.message))}`)
  }
}

const deleteRecord = async (req, res) => {
  const tables = getAllTables()
  const { tableName, rowId } = req.params
  if (!tables.includes(tableName)) return res.status(404).send('Table not found')
  if (tableName === 'admins') return res.redirect('/admin/table/admins?error=Admin+accounts+cannot+be+deleted')
  if (READ_ONLY_TABLES.includes(tableName))
    return res.redirect(`/admin/table/${tableName}?error=Audit+log+entries+cannot+be+deleted`)

  const existingRecord = db.prepare(`SELECT *, rowid FROM "${tableName}" WHERE rowid = ?`).get(rowId)
  if (!existingRecord)
    return res.redirect(`/admin/table/${tableName}?error=Record+not+found`)

  try {
    const result = db.prepare(`DELETE FROM "${tableName}" WHERE rowid = ?`).run(rowId)
    if (result.changes === 0)
      return res.redirect(`/admin/table/${tableName}?error=Record+not+found`)
    logAdminAudit({
      adminId: req.session.userId,
      action: 'DELETE',
      tableName,
      rowId,
      oldData: existingRecord
    })
    await logActivity(req.session.userId, ActionTypes.ADMIN_USER_DELETE, [{ table: tableName, id: rowId }])
    res.redirect(`/admin/table/${tableName}?success=Record+deleted`)
  } catch (err) {
    res.redirect(`/admin/table/${tableName}?error=${encodeURIComponent(friendlyError(err.message))}`)
  }
}

module.exports = { showAdminDashboard, showTable, createRecord, updateRecord, deleteRecord }
