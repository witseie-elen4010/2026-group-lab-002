/* eslint-env jest */
const { parseAttendees, splitByDate } = require('../../src/services/dashboard-helpers');

describe('parseAttendees()', () => {
  test('returns attendeeCount of 0 for empty attendees', () => {
    const result = parseAttendees({ attendees: '[]' });
    expect(result.attendeeCount).toBe(0);
  });

  test('returns correct attendeeCount for populated array', () => {
    const result = parseAttendees({ attendees: '[1234567, 2345678, 3456789]' });
    expect(result.attendeeCount).toBe(3);
  });

  test('handles malformed JSON gracefully without throwing', () => {
    const result = parseAttendees({ attendees: 'not-valid-json' });
    expect(result.attendeeCount).toBe(0);
  });

  test('handles null attendees gracefully', () => {
    const result = parseAttendees({ attendees: null });
    expect(result.attendeeCount).toBe(0);
  });
});

describe('splitByDate()', () => {
  const rows = [
    { consultation_date: '2026-04-20', consultation_time: '10:00', title: 'past A' },
    { consultation_date: '2026-05-01', consultation_time: '14:00', title: 'future B' },
    { consultation_date: '2026-05-01', consultation_time: '09:00', title: 'future A' },
    { consultation_date: '2026-04-15', consultation_time: '11:00', title: 'past B' },
  ];

  test('splits upcoming and past consultations relative to today', () => {
    const { upcoming, past } = splitByDate(rows, '2026-04-25');
    expect(upcoming).toHaveLength(2);
    expect(past).toHaveLength(2);
  });

  test('sorts upcoming by date then time, soonest first', () => {
    const { upcoming } = splitByDate(rows, '2026-04-25');
    expect(upcoming[0].title).toBe('future A'); // 09:00 before 14:00
    expect(upcoming[1].title).toBe('future B');
  });

  test('sorts past by date descending (most recent first)', () => {
    const { past } = splitByDate(rows, '2026-04-25');
    expect(past[0].title).toBe('past A');  // 2026-04-20 > 2026-04-15
    expect(past[1].title).toBe('past B');
  });

  test('returns empty arrays when no rows match', () => {
    const { upcoming, past } = splitByDate([], '2026-04-25');
    expect(upcoming).toEqual([]);
    expect(past).toEqual([]);
  });
});