/* eslint-env jest */
const { validateJoin } = require('../../src/services/consultation-join-service');

const makeConsultation = (overrides = {}) => ({
  const_id: 'TEST-001',
  status: 'Booked',
  allow_join: 1,
  max_number_of_students: 3,
  ...overrides,
});

describe('validateJoin()', () => {
  test('returns valid when all conditions are met', () => {
    const result = validateJoin(makeConsultation(), 9999999, []);
    expect(result.valid).toBe(true);
  });

  test('returns invalid when consultation is null', () => {
    const result = validateJoin(null, 9999999, []);
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/not found/i);
  });

  test('returns invalid when status is not Booked', () => {
    const result = validateJoin(makeConsultation({ status: 'Cancelled' }), 9999999, []);
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/Booked/);
  });

  test('returns invalid when allow_join is 0', () => {
    const result = validateJoin(makeConsultation({ allow_join: 0 }), 9999999, []);
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/does not allow joining/);
  });

  test('returns invalid when consultation is at full capacity', () => {
    const attendees = [
      { student_number: 1111111 },
      { student_number: 2222222 },
      { student_number: 3333333 },
    ];
    const result = validateJoin(makeConsultation({ max_number_of_students: 3 }), 9999999, attendees);
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/capacity/);
  });

  test('returns invalid when student is already an attendee', () => {
    const attendees = [{ student_number: 2434427 }];
    const result = validateJoin(makeConsultation(), 2434427, attendees);
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/already attending/);
  });

  test('returns valid when joinable and below capacity', () => {
    const attendees = [{ student_number: 1111111 }];
    const result = validateJoin(makeConsultation({ max_number_of_students: 3 }), 9999999, attendees);
    expect(result.valid).toBe(true);
  });
});
