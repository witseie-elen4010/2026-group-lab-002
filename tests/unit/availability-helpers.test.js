const { generateConstId, validateSlotFields, isBusinessHours, computeDuration, isOverlapping } = require('../../src/services/availability-helpers');

describe('generateConstId()', () => {
  test('generates correct ID for first slot on a date', () => {
    expect(generateConstId('2026-05-01', 0)).toBe('2026-05-01-00001');
  });

  test('increments sequence correctly for subsequent slots', () => {
    expect(generateConstId('2026-05-01', 4)).toBe('2026-05-01-00005');
  });

  test('pads sequence to 5 digits', () => {
    expect(generateConstId('2026-05-01', 9)).toBe('2026-05-01-00010');
  });
});

describe('validateSlotFields()', () => {
  test('returns true when all fields are present', () => {
    expect(validateSlotFields({
      day_of_week: 'Mon',
      start_time: '09:00',
      end_time: '10:00',
      venue: 'Room 1',
      max_number_of_students: '5',
      max_booking_min: '60'
    })).toBe(true);
  });

  test('returns false when day_of_week is missing', () => {
    expect(validateSlotFields({
      day_of_week: '',
      start_time: '09:00',
      end_time: '10:00',
      venue: 'Room 1',
      max_number_of_students: '5'
    })).toBe(false);
  });

  test('returns false when venue is missing', () => {
    expect(validateSlotFields({
      day_of_week: 'Mon',
      start_time: '09:00',
      end_time: '10:00',
      venue: '',
      max_number_of_students: '5'
    })).toBe(false);
  });

  test('returns false when start_time is missing', () => {
    expect(validateSlotFields({
      day_of_week: 'Mon',
      start_time: '',
      end_time: '10:00',
      venue: 'Room 1',
      max_number_of_students: '5'
    })).toBe(false);
  });
});

describe('isBusinessHours()', () => {
  test('returns true for slot within 08:00 and 18:00', () => {
    expect(isBusinessHours('09:00', '10:00')).toBe(true);
  });

  test('returns true for slot exactly at boundaries (08:00 to 18:00)', () => {
    expect(isBusinessHours('08:00', '18:00')).toBe(true);
  });

  test('returns false when start time is before 08:00', () => {
    expect(isBusinessHours('07:30', '09:00')).toBe(false);
  });

  test('returns false when end time is after 18:00', () => {
    expect(isBusinessHours('17:00', '18:30')).toBe(false);
  });

  test('returns false when end time is not after start time', () => {
    expect(isBusinessHours('10:00', '09:00')).toBe(false);
  });
});

describe('computeDuration()', () => {
  test('returns correct duration in minutes', () => {
    expect(computeDuration('09:00', '10:00')).toBe(60);
  });

  test('handles non-hour durations', () => {
    expect(computeDuration('09:15', '09:45')).toBe(30);
  });
});

describe('isOverlapping()', () => {
  const existingSlots = [
    { start_time: '09:00', end_time: '10:00' },
  ];

  test('returns false when new slot does not overlap', () => {
    expect(isOverlapping(existingSlots, '10:00', '11:00')).toBe(false);
  });

  test('returns true when new slot fully overlaps existing slot', () => {
    expect(isOverlapping(existingSlots, '09:00', '10:00')).toBe(true);
  });

  test('returns true when new slot partially overlaps at the start', () => {
    expect(isOverlapping(existingSlots, '08:30', '09:30')).toBe(true);
  });

  test('returns true when new slot partially overlaps at the end', () => {
    expect(isOverlapping(existingSlots, '09:30', '10:30')).toBe(true);
  });

  test('returns false when slots are adjacent (no overlap)', () => {
    expect(isOverlapping(existingSlots, '10:00', '11:00')).toBe(false);
  });

  test('returns false when there are no existing slots', () => {
    expect(isOverlapping([], '09:00', '10:00')).toBe(false);
  });
});
