const EVENT_LABELS = {
  USER_LOGIN:              'Logged in',
  USER_LOGOUT:             'Logged out',
  USER_SIGNUP:             'Signed up',
  USER_PASSWORD_CHANGE:    'Changed password',
  AUTH_FAILED_LOGIN:       'Failed login attempt',
  CONSULT_CREATE:          'Booked consultation',
  CONSULT_JOIN:            'Joined consultation',
  CONSULT_LEAVE:           'Left consultation',
  CONSULT_CANCEL_ORG:      'Cancelled own consultation',
  CONSULT_CANCEL_LEC:      'Lecturer cancelled consultation',
  AVAIL_CREATE:            'Created availability',
  AVAIL_CANCEL:            'Deleted availability',
  AVAIL_UPDATE:            'Updated availability',
  PROFILE_COURSES_UPDATED: 'Updated courses',
  ADMIN_LOGIN:             'Admin logged in',
  ADMIN_USER_ADD:          'Added record',
  ADMIN_USER_EDIT:         'Edited record',
  ADMIN_USER_DELETE:       'Deleted record',
};

const CATEGORIES = {
  USER_LOGIN:              'Auth',
  USER_LOGOUT:             'Auth',
  USER_SIGNUP:             'Auth',
  USER_PASSWORD_CHANGE:    'Auth',
  AUTH_FAILED_LOGIN:       'Auth',
  ADMIN_LOGIN:             'Auth',
  CONSULT_CREATE:          'Booking',
  CONSULT_JOIN:            'Booking',
  CONSULT_LEAVE:           'Booking',
  CONSULT_CANCEL_ORG:      'Cancellation',
  CONSULT_CANCEL_LEC:      'Cancellation',
  AVAIL_CREATE:            'Availability',
  AVAIL_CANCEL:            'Availability',
  AVAIL_UPDATE:            'Availability',
  PROFILE_COURSES_UPDATED: 'System',
  ADMIN_USER_ADD:          'Admin',
  ADMIN_USER_EDIT:         'Admin',
  ADMIN_USER_DELETE:       'Admin',
};

const STATUSES = {
  AUTH_FAILED_LOGIN:  'Failed',
  CONSULT_CANCEL_ORG: 'Cancelled',
  CONSULT_CANCEL_LEC: 'Cancelled',
  AVAIL_CANCEL:       'Deleted',
  ADMIN_USER_DELETE:  'Deleted',
  AVAIL_UPDATE:       'Updated',
  ADMIN_USER_EDIT:    'Updated',
};

const CATEGORY_ACTIONS = {
  Auth:         ['USER_LOGIN', 'USER_LOGOUT', 'USER_SIGNUP', 'USER_PASSWORD_CHANGE', 'AUTH_FAILED_LOGIN', 'ADMIN_LOGIN'],
  Booking:      ['CONSULT_CREATE', 'CONSULT_JOIN', 'CONSULT_LEAVE'],
  Cancellation: ['CONSULT_CANCEL_ORG', 'CONSULT_CANCEL_LEC'],
  Availability: ['AVAIL_CREATE', 'AVAIL_CANCEL', 'AVAIL_UPDATE'],
  Admin:        ['ADMIN_USER_ADD', 'ADMIN_USER_EDIT', 'ADMIN_USER_DELETE'],
  System:       ['PROFILE_COURSES_UPDATED'],
};

const getEventLabel = (actionName) => EVENT_LABELS[actionName] || actionName;
const getCategory   = (actionName) => CATEGORIES[actionName]  || 'System';
const getStatus     = (actionName) => STATUSES[actionName]    || 'Success';

const resolveActorFallback = (userId, actorRole) => {
  if (actorRole === 'Student')  return 'Unknown Student';
  if (actorRole === 'Lecturer') return 'Unknown Lecturer';
  if (actorRole === 'Admin')    return 'Unknown Admin';
  return userId || 'System';
};

module.exports = { getEventLabel, getCategory, getStatus, resolveActorFallback, CATEGORY_ACTIONS };
