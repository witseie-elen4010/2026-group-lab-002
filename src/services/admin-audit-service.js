const db = require('../../database/db');

function logAdminAudit({ adminId, action, tableName, rowId, oldData = null, newData = null }) {
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
