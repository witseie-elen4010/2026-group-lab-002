const db = require('../../database/db');

const VALID_ACTIONS = ['INSERT', 'UPDATE', 'DELETE']

function logAdminAudit({ adminId, action, tableName, rowId, oldData = null, newData = null }) {
  if (!VALID_ACTIONS.includes(action)) {
    throw new Error(`logAdminAudit: invalid action "${action}". Must be INSERT, UPDATE, or DELETE.`)
  }
  db.prepare(`
    INSERT INTO admin_audit_log (admin_id, action, table_name, row_id, old_data, new_data)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    adminId,
    action,
    tableName,
    String(rowId),
    oldData  ? JSON.stringify(oldData)  : null,
    newData  ? JSON.stringify(newData)  : null
  );
}

module.exports = { logAdminAudit };
