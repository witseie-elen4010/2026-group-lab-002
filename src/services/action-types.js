const ActionTypes = Object.freeze({
  // Authentication & Security
  USER_LOGIN: 10,
  USER_LOGOUT: 11,
  USER_SIGNUP: 12,
  USER_PASSWORD_CHANGE: 13,
  AUTH_FAILED_LOGIN: 14,

  // Consultations
  CONSULT_CREATE: 100,
  CONSULT_JOIN: 101,
  CONSULT_LEAVE: 102,
  CONSULT_CANCEL_ORG: 200,
  CONSULT_CANCEL_LEC: 201,

  // Lecturer Availability
  AVAIL_CREATE: 300,
  AVAIL_CANCEL: 301,
  AVAIL_UPDATE: 302,

  // User Profile Management
  PROFILE_COURSES_UPDATED: 400,

  // Admin Actions
  ADMIN_LOGIN: 500,
  ADMIN_USER_ADD: 501,
  ADMIN_USER_EDIT: 502,
  ADMIN_USER_DELETE: 503
})

module.exports = ActionTypes
