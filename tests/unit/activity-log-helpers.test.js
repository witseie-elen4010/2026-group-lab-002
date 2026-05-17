/* eslint-env jest */
const { getEventLabel, getCategory, getStatus, resolveActorFallback } = require('../../src/services/activity-log-helpers');

describe('getEventLabel', () => {
  test('maps known action names to readable labels', () => {
    expect(getEventLabel('USER_LOGIN')).toBe('Logged in');
    expect(getEventLabel('USER_LOGOUT')).toBe('Logged out');
    expect(getEventLabel('USER_SIGNUP')).toBe('Signed up');
    expect(getEventLabel('AUTH_FAILED_LOGIN')).toBe('Failed login attempt');
    expect(getEventLabel('CONSULT_CREATE')).toBe('Booked consultation');
    expect(getEventLabel('CONSULT_JOIN')).toBe('Joined consultation');
    expect(getEventLabel('CONSULT_LEAVE')).toBe('Left consultation');
    expect(getEventLabel('CONSULT_CANCEL_ORG')).toBe('Cancelled own consultation');
    expect(getEventLabel('CONSULT_CANCEL_LEC')).toBe('Lecturer cancelled consultation');
    expect(getEventLabel('AVAIL_CREATE')).toBe('Created availability');
    expect(getEventLabel('AVAIL_CANCEL')).toBe('Deleted availability');
    expect(getEventLabel('AVAIL_UPDATE')).toBe('Updated availability');
    expect(getEventLabel('PROFILE_COURSES_UPDATED')).toBe('Updated courses');
    expect(getEventLabel('ADMIN_LOGIN')).toBe('Admin logged in');
    expect(getEventLabel('ADMIN_USER_ADD')).toBe('Added record');
    expect(getEventLabel('ADMIN_USER_EDIT')).toBe('Edited record');
    expect(getEventLabel('ADMIN_USER_DELETE')).toBe('Deleted record');
  });

  test('returns the raw action name for unknown codes', () => {
    expect(getEventLabel('UNKNOWN_ACTION')).toBe('UNKNOWN_ACTION');
    expect(getEventLabel('')).toBe('');
  });
});

describe('getCategory', () => {
  test('maps auth actions to Auth', () => {
    expect(getCategory('USER_LOGIN')).toBe('Auth');
    expect(getCategory('USER_LOGOUT')).toBe('Auth');
    expect(getCategory('USER_SIGNUP')).toBe('Auth');
    expect(getCategory('AUTH_FAILED_LOGIN')).toBe('Auth');
    expect(getCategory('ADMIN_LOGIN')).toBe('Auth');
  });

  test('maps consultation booking actions to Booking', () => {
    expect(getCategory('CONSULT_CREATE')).toBe('Booking');
    expect(getCategory('CONSULT_JOIN')).toBe('Booking');
    expect(getCategory('CONSULT_LEAVE')).toBe('Booking');
  });

  test('maps cancellation actions to Cancellation', () => {
    expect(getCategory('CONSULT_CANCEL_ORG')).toBe('Cancellation');
    expect(getCategory('CONSULT_CANCEL_LEC')).toBe('Cancellation');
  });

  test('maps availability actions to Availability', () => {
    expect(getCategory('AVAIL_CREATE')).toBe('Availability');
    expect(getCategory('AVAIL_CANCEL')).toBe('Availability');
    expect(getCategory('AVAIL_UPDATE')).toBe('Availability');
  });

  test('maps admin CRUD actions to Admin', () => {
    expect(getCategory('ADMIN_USER_ADD')).toBe('Admin');
    expect(getCategory('ADMIN_USER_EDIT')).toBe('Admin');
    expect(getCategory('ADMIN_USER_DELETE')).toBe('Admin');
  });

  test('returns System for unknown action names', () => {
    expect(getCategory('UNKNOWN')).toBe('System');
    expect(getCategory('')).toBe('System');
  });
});

describe('getStatus', () => {
  test('returns Failed for AUTH_FAILED_LOGIN', () => {
    expect(getStatus('AUTH_FAILED_LOGIN')).toBe('Failed');
  });

  test('returns Cancelled for cancellation actions', () => {
    expect(getStatus('CONSULT_CANCEL_ORG')).toBe('Cancelled');
    expect(getStatus('CONSULT_CANCEL_LEC')).toBe('Cancelled');
  });

  test('returns Deleted for delete actions', () => {
    expect(getStatus('AVAIL_CANCEL')).toBe('Deleted');
    expect(getStatus('ADMIN_USER_DELETE')).toBe('Deleted');
  });

  test('returns Updated for update actions', () => {
    expect(getStatus('AVAIL_UPDATE')).toBe('Updated');
    expect(getStatus('ADMIN_USER_EDIT')).toBe('Updated');
  });

  test('returns Success for normal completed actions', () => {
    expect(getStatus('USER_LOGIN')).toBe('Success');
    expect(getStatus('CONSULT_CREATE')).toBe('Success');
    expect(getStatus('AVAIL_CREATE')).toBe('Success');
    expect(getStatus('ADMIN_USER_ADD')).toBe('Success');
  });
});

describe('resolveActorFallback', () => {
  test('returns Unknown Student when actor_role is Student', () => {
    expect(resolveActorFallback('2434427', 'Student')).toBe('Unknown Student');
  });

  test('returns Unknown Lecturer when actor_role is Lecturer', () => {
    expect(resolveActorFallback('A000356', 'Lecturer')).toBe('Unknown Lecturer');
  });

  test('returns Unknown Admin when actor_role is Admin', () => {
    expect(resolveActorFallback('ADMIN001', 'Admin')).toBe('Unknown Admin');
  });

  test('returns the userId when actor_role is Unknown', () => {
    expect(resolveActorFallback('A000356', 'Unknown')).toBe('A000356');
  });

  test('returns System when userId is falsy', () => {
    expect(resolveActorFallback(null, 'Unknown')).toBe('System');
    expect(resolveActorFallback('',   'Unknown')).toBe('System');
  });
});
