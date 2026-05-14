const db = require('../../database/db')

/**
 * Logs an activity to the database using better-sqlite3.
 * @param {string|number} userId - The ID of the student/lecturer/admin.
 * @param {number} actionId - The ID from ActionTypes.js.
 * @param {Array} affectedRecords - Array of objects: [{ table: 'TableName', id: 'RecordId' }]
 */
async function logActivity (userId, actionId, affectedRecords = []) {
  const insertLog = db.prepare(`
        INSERT INTO activityLog (user_id, action_id) 
        VALUES (?, ?)
    `)

  //   console.log('Logging Activity:', { userId, actionId, affectedRecords })

  const insertAffected = db.prepare(`
        INSERT INTO affectedRecords (log_id, table_affected, record_id) 
        VALUES (?, ?, ?)
    `)

  const executeLogTransaction = db.transaction((uId, aId, records) => {
    const logResult = insertLog.run(uId, aId)
    const newLogId = logResult.lastInsertRowid
    // const logID = db.prepare(`
    //     SELECT log_id FROM activityLog WHERE user_id = ? AND action_id = ?
    // `).get(uId, aId)

    // console.log('Insert Log SQL:', logID)

    if (records.length > 0) {
      for (const record of records) {
        insertAffected.run(newLogId, record.table, record.id)
      }
    }
  })

  try {
    executeLogTransaction((userId || 'unknown').toString(), actionId, affectedRecords)
    return true
  } catch (error) {
    console.error('Activity Logging Failed:', error)
    return false
  }
}

module.exports = { logActivity }
