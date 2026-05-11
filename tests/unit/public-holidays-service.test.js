/* eslint-env jest */
/*
 * Acceptance criteria covered:
 * - Public holidays returned by the API expose a `date` (YYYY-MM-DD) and `localName` property on each entry
 * - When the holidays API is unreachable the service returns [] and the caller never crashes
 * - The API is only contacted once per year — subsequent calls for the same year use the module-level cache
 */

describe('getSAPublicHolidays()', () => {
  let getSAPublicHolidays;

  beforeEach(() => {
    jest.resetModules();
    ({ getSAPublicHolidays } = require('../../src/services/public-holidays-service'));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('returns objects with date and localName when the API responds successfully', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { date: '2026-01-01', localName: "New Year's Day" },
        { date: '2026-03-21', localName: 'Human Rights Day' },
      ],
    });

    const result = await getSAPublicHolidays(2026);

    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ date: '2026-01-01', localName: "New Year's Day" });
    expect(result[1]).toMatchObject({ date: '2026-03-21', localName: 'Human Rights Day' });
  });

  test('returns an empty array when fetch throws a network error', async () => {
    jest.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network error'));

    const result = await getSAPublicHolidays(2026);

    expect(result).toEqual([]);
  });

  test('only calls fetch once across two sequential calls for the same year', async () => {
    const mockFetch = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => [{ date: '2026-01-01', localName: "New Year's Day" }],
    });

    await getSAPublicHolidays(2026);
    await getSAPublicHolidays(2026);

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
