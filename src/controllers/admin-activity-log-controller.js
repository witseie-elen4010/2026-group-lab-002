const db = require('../../database/db');
const { getEventLabel, getCategory, getStatus, resolveActorFallback, CATEGORY_ACTIONS } = require('../services/activity-log-helpers');

const PAGE_SIZE = 20;
const ADMIN_CRUD_ACTIONS = new Set(['ADMIN_USER_ADD', 'ADMIN_USER_EDIT', 'ADMIN_USER_DELETE']);

const fetchAuditData = (userId, createdAt) =>
  db.prepare(`
    SELECT old_data, new_data FROM admin_audit_log
    WHERE admin_id = ?
    ORDER BY ABS(strftime('%s', timestamp) - strftime('%s', ?))
    LIMIT 1
  `).get(userId, createdAt);

const BASE_FROM = `
  FROM activity_log al
  JOIN actions a ON al.action_id = a.action_id
  LEFT JOIN students st  ON al.user_id = CAST(st.student_number AS TEXT)
  LEFT JOIN staff    stf ON al.user_id = stf.staff_number
  LEFT JOIN admins   adm ON al.user_id = adm.admin_id
  LEFT JOIN affected_records ar ON al.log_id = ar.log_id
`;

const buildWhere = (search, categoryFilter) => {
  const parts  = [];
  const params = [];

  if (search) {
    parts.push(`(
      COALESCE(st.name, stf.name, adm.name) LIKE ?
      OR al.user_id LIKE ?
      OR a.action_name LIKE ?
      OR a.page_context LIKE ?
    )`);
    const like = `%${search}%`;
    params.push(like, like, like, like);
  }

  if (categoryFilter && CATEGORY_ACTIONS[categoryFilter]) {
    const actions = CATEGORY_ACTIONS[categoryFilter];
    parts.push(`a.action_name IN (${actions.map(() => '?').join(',')})`);
    params.push(...actions);
  }

  return { where: parts.length ? `WHERE ${parts.join(' AND ')}` : '', params };
};

const showActivityLog = (req, res) => {
  const user           = { id: req.session.userId, name: req.session.userName };
  const page           = Math.max(1, parseInt(req.query.page) || 1);
  const offset         = (page - 1) * PAGE_SIZE;
  const search         = (req.query.search  || '').trim();
  const categoryFilter = (req.query.category || '').trim();

  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all().map(r => r.name);
  const { where, params } = buildWhere(search, categoryFilter);

  try {
    const totalRows = db.prepare(`
      SELECT COUNT(DISTINCT al.log_id) as count
      ${BASE_FROM}
      ${where}
    `).get(...params).count;

    const rows = db.prepare(`
      SELECT
        al.log_id,
        al.user_id,
        al.created_at,
        a.action_name,
        a.page_context,
        a.description,
        COALESCE(st.name, stf.name, adm.name) AS actor_name,
        CASE
          WHEN st.student_number IS NOT NULL THEN 'Student'
          WHEN stf.staff_number  IS NOT NULL THEN 'Lecturer'
          WHEN adm.admin_id      IS NOT NULL THEN 'Admin'
          ELSE 'Unknown'
        END AS actor_role,
        GROUP_CONCAT(ar.table_affected || ':' || ar.record_id, ' | ') AS affected_summary
      ${BASE_FROM}
      ${where}
      GROUP BY al.log_id
      ORDER BY al.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, PAGE_SIZE, offset);

    const enriched = rows.map(row => {
      const base = {
        ...row,
        eventLabel: getEventLabel(row.action_name),
        category:   getCategory(row.action_name),
        status:     getStatus(row.action_name),
        actorName:  row.actor_name || resolveActorFallback(row.user_id, row.actor_role),
        old_data:   null,
        new_data:   null,
      };
      if (ADMIN_CRUD_ACTIONS.has(row.action_name)) {
        const audit = fetchAuditData(row.user_id, row.created_at);
        if (audit) { base.old_data = audit.old_data; base.new_data = audit.new_data; }
      }
      return base;
    });

    res.render('admin-activity-log', {
      user,
      tables,
      rows: enriched,
      page,
      pageSize: PAGE_SIZE,
      totalPages: Math.max(1, Math.ceil(totalRows / PAGE_SIZE)),
      totalRows,
      search,
      categoryFilter,
      categories: Object.keys(CATEGORY_ACTIONS),
      error:   req.query.error   || null,
      success: req.query.success || null,
    });
  } catch (err) {
    console.error('showActivityLog error:', err);
    res.render('admin-activity-log', {
      user,
      tables,
      rows: [],
      page: 1,
      pageSize: PAGE_SIZE,
      totalPages: 1,
      totalRows: 0,
      search,
      categoryFilter,
      categories: Object.keys(CATEGORY_ACTIONS),
      error:   'Could not load activity log. Please try again.',
      success: null,
    });
  }
};

module.exports = { showActivityLog };
