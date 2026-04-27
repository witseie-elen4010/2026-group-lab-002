const { generateConstId, validateSlotFields } = require('../../src/services/availability-helpers');

describe('generateConstId()', () => {
  test('generates correct ID for first slot on a date', () => {
    const result = generateConstId('2026-05-01', 0);
    expect(result).toBe('2026-05-01-00001');
  });

  test('increments sequence correctly for subsequent slots', () => {
    const result = generateConstId('2026-05-01', 4);
    expect(result).toBe('2026-05-01-00005');
  });

  test('pads sequence to 5 digits', () => {
    const result = generateConstId('2026-05-01', 9);
    expect(result).toBe('2026-05-01-00010');
  });
});

describe('validateSlotFields()', () => {
  test('returns true when all fields are present', () => {
    const result = validateSlotFields({
      consultation_date: '2026-05-01',
      consultation_time: '09:00',
      venue: 'Room 1',
      duration_min: '30',
      max_number_of_students: '5'
    });
    expect(result).toBe(true);
  });

  test('returns false when consultation_date is missing', () => {
    const result = validateSlotFields({
      consultation_date: '',
      consultation_time: '09:00',
      venue: 'Room 1',
      duration_min: '30',
      max_number_of_students: '5'
    });
    expect(result).toBe(false);
  });

  test('returns false when venue is missing', () => {
    const result = validateSlotFields({
      consultation_date: '2026-05-01',
      consultation_time: '09:00',
      venue: '',
      duration_min: '30',
      max_number_of_students: '5'
    });
    expect(result).toBe(false);
  });
});
