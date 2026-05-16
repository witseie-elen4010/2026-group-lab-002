/* eslint-env jest */
const {
  computeBookableChunks,
  canBookInRange,
  colourForCourse,
  getNextNWeekdays,
  validateBookingRequest,
} = require('../../src/services/booking-helpers');

const makeWindow = (start, end, maxStudents = 5, maxBookingMin = 60) => ({
  start_time: start,
  end_time: end,
  max_number_of_students: maxStudents,
  max_booking_min: maxBookingMin,
  venue: 'Room 101',
});

const makeBooking = (start, durationMin, allowJoin = 1, attendeeCount = 1) => ({
  consultation_time: start,
  duration_min: durationMin,
  allow_join: allowJoin,
  attendee_count: attendeeCount,
});

describe('computeBookableChunks()', () => {
  test('returns whole window as one chunk when bookings list is empty', () => {
    const result = computeBookableChunks(makeWindow('14:00', '16:00'), []);
    expect(result).toEqual([{ start_time: '14:00', end_time: '16:00', max_students: 5 }]);
  });

  test('returns empty array when booking covers entire window', () => {
    const result = computeBookableChunks(makeWindow('14:00', '16:00'), [makeBooking('14:00', 120)]);
    expect(result).toEqual([]);
  });

  test('splits window into two chunks when booking is in the middle', () => {
    const result = computeBookableChunks(makeWindow('14:00', '16:00'), [makeBooking('14:30', 30)]);
    expect(result).toEqual([
      { start_time: '14:00', end_time: '14:30', max_students: 5 },
      { start_time: '15:00', end_time: '16:00', max_students: 5 },
    ]);
  });

  test('splits window into three chunks when two bookings are in the middle', () => {
    const bookings = [makeBooking('14:15', 15), makeBooking('14:45', 15)];
    const result = computeBookableChunks(makeWindow('14:00', '16:00'), bookings);
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ start_time: '14:00', end_time: '14:15', max_students: 5 });
    expect(result[1]).toEqual({ start_time: '14:30', end_time: '14:45', max_students: 5 });
    expect(result[2]).toEqual({ start_time: '15:00', end_time: '16:00', max_students: 5 });
  });

  test('booking at exact window start shrinks chunk from the left', () => {
    const result = computeBookableChunks(makeWindow('14:00', '16:00'), [makeBooking('14:00', 15)]);
    expect(result).toEqual([{ start_time: '14:15', end_time: '16:00', max_students: 5 }]);
  });

  test('booking at exact window end shrinks chunk from the right', () => {
    const result = computeBookableChunks(makeWindow('14:00', '16:00'), [makeBooking('15:45', 15)]);
    expect(result).toEqual([{ start_time: '14:00', end_time: '15:45', max_students: 5 }]);
  });
});

describe('canBookInRange()', () => {
  test('returns true when no bookings overlap the range', () => {
    const window = makeWindow('14:00', '16:00', 5);
    expect(canBookInRange(window, [], '14:00', '14:15')).toBe(true);
  });

  test('returns false when a non-joinable booking overlaps', () => {
    const window = makeWindow('14:00', '16:00', 5);
    const bookings = [makeBooking('14:00', 15, 0, 1)];
    expect(canBookInRange(window, bookings, '14:00', '14:15')).toBe(false);
  });

  test('returns false when max_number_of_students is reached via joinable bookings', () => {
    const window = makeWindow('14:00', '16:00', 1);
    const bookings = [makeBooking('14:00', 15, 1, 1)];
    expect(canBookInRange(window, bookings, '14:00', '14:15')).toBe(false);
  });

  test('returns true when joinable booking exists but is below capacity', () => {
    const window = makeWindow('14:00', '16:00', 3);
    const bookings = [makeBooking('14:00', 15, 1, 1)];
    expect(canBookInRange(window, bookings, '14:00', '14:15')).toBe(true);
  });

  test('returns true when overlapping booking is adjacent (no actual overlap)', () => {
    const window = makeWindow('14:00', '16:00', 5);
    const bookings = [makeBooking('14:15', 15, 0, 1)];
    expect(canBookInRange(window, bookings, '14:00', '14:15')).toBe(true);
  });

  test('returns false when total attendees across multiple joinable bookings reaches max', () => {
    const window = makeWindow('14:00', '16:00', 2);
    const bookings = [makeBooking('14:00', 15, 1, 1), makeBooking('14:05', 10, 1, 1)];
    expect(canBookInRange(window, bookings, '14:00', '14:15')).toBe(false);
  });
});

describe('colourForCourse()', () => {
  test('returns a non-empty string for any course code', () => {
    expect(colourForCourse('ELEN4010')).toBeTruthy();
  });

  test('returns the same colour for the same course code (deterministic)', () => {
    expect(colourForCourse('ELEN4010')).toBe(colourForCourse('ELEN4010'));
  });

  test('returns a value from the fixed palette (starts with #)', () => {
    expect(colourForCourse('ELEN3009')).toMatch(/^#[0-9a-f]{6}$/);
  });

  test('different course codes may produce different colours', () => {
    const colours = ['ELEN4010', 'MECN2026', 'CIVN3001', 'CHMT4000', 'MINN3015', 'ARPL2000', 'FEBE1000', 'ELEN3009']
      .map(colourForCourse);
    const unique = new Set(colours);
    expect(unique.size).toBeGreaterThan(1);
  });
});

describe('getNextNWeekdays()', () => {
  test('returns exactly 10 dates by default', () => {
    const days = getNextNWeekdays(new Date('2026-05-11T12:00:00Z'));
    expect(days).toHaveLength(10);
  });

  test('returns exactly N dates when N is specified', () => {
    const days = getNextNWeekdays(new Date('2026-05-11T12:00:00Z'), 5);
    expect(days).toHaveLength(5);
  });

  test('skips Saturdays and Sundays', () => {
    const days = getNextNWeekdays(new Date('2026-05-11T12:00:00Z'), 10);
    for (const d of days) {
      const dow = d.getUTCDay();
      expect(dow).not.toBe(0);
      expect(dow).not.toBe(6);
    }
  });

  test('starts on the given date if it is a weekday', () => {
    const start = new Date('2026-05-11T12:00:00Z');
    const days = getNextNWeekdays(start, 5);
    expect(days[0].toISOString().split('T')[0]).toBe('2026-05-11');
  });

  test('skips weekend and starts on next Monday when given a Saturday', () => {
    const sat = new Date('2026-05-09T12:00:00Z');
    const days = getNextNWeekdays(sat, 3);
    expect(days[0].toISOString().split('T')[0]).toBe('2026-05-11');
  });
});

describe('validateBookingRequest()', () => {
  const window = makeWindow('10:00', '12:00', 5, 60);
  const todayStr = '2026-05-11';

  test('returns valid for a legitimate future booking on a weekday in the window', () => {
    const result = validateBookingRequest({
      date: '2026-05-11',
      start_time: '10:00',
      duration_min: 30,
      window,
      bookingsOnDay: [],
      todayStr,
      currentTimeStr: '08:00',
    });
    expect(result.valid).toBe(true);
  });

  test('returns invalid when date is not in next 10 weekdays', () => {
    const result = validateBookingRequest({
      date: '2026-06-30',
      start_time: '10:00',
      duration_min: 30,
      window,
      bookingsOnDay: [],
      todayStr,
      currentTimeStr: '08:00',
    });
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/10 weekdays/);
  });

  test('returns invalid when booking extends beyond window end', () => {
    const result = validateBookingRequest({
      date: '2026-05-11',
      start_time: '11:45',
      duration_min: 30,
      window,
      bookingsOnDay: [],
      todayStr,
      currentTimeStr: '08:00',
    });
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/window/);
  });

  test('returns invalid when booking starts before window start', () => {
    const result = validateBookingRequest({
      date: '2026-05-11',
      start_time: '09:30',
      duration_min: 30,
      window,
      bookingsOnDay: [],
      todayStr,
      currentTimeStr: '08:00',
    });
    expect(result.valid).toBe(false);
  });

  test('returns invalid when start_time is in the past on today', () => {
    const result = validateBookingRequest({
      date: '2026-05-11',
      start_time: '10:00',
      duration_min: 30,
      window,
      bookingsOnDay: [],
      todayStr: '2026-05-11',
      currentTimeStr: '10:30',
    });
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/future/);
  });

  test('returns invalid when non-joinable booking overlaps', () => {
    const result = validateBookingRequest({
      date: '2026-05-11',
      start_time: '10:00',
      duration_min: 30,
      window,
      bookingsOnDay: [makeBooking('10:00', 30, 0, 1)],
      todayStr,
      currentTimeStr: '08:00',
    });
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/unavailable/);
  });

  test('returns valid on a future date regardless of currentTimeStr', () => {
    const result = validateBookingRequest({
      date: '2026-05-12',
      start_time: '10:00',
      duration_min: 30,
      window,
      bookingsOnDay: [],
      todayStr: '2026-05-11',
      currentTimeStr: '23:59',
    });
    expect(result.valid).toBe(true);
  });

  test('rejects when duration_min exceeds window.max_booking_min', () => {
    const result = validateBookingRequest({
      date: '2026-05-11',
      start_time: '10:00',
      duration_min: 90,
      window: makeWindow('10:00', '12:00', 5, 60),
      bookingsOnDay: [],
      todayStr,
      currentTimeStr: '08:00',
    });
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/maximum consultation duration/);
  });

  test('rejects when duration_min exceeds remaining chunk length', () => {
    const result = validateBookingRequest({
      date: '2026-05-11',
      start_time: '10:00',
      duration_min: 45,
      window: makeWindow('10:00', '12:00', 5, 60),
      bookingsOnDay: [makeBooking('10:30', 30, 0, 1)],
      todayStr,
      currentTimeStr: '08:00',
    });
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/available time/);
  });

  test('accepts when duration_min equals window.max_booking_min exactly', () => {
    const result = validateBookingRequest({
      date: '2026-05-11',
      start_time: '10:00',
      duration_min: 60,
      window: makeWindow('10:00', '12:00', 5, 60),
      bookingsOnDay: [],
      todayStr,
      currentTimeStr: '08:00',
    });
    expect(result.valid).toBe(true);
  });
});
