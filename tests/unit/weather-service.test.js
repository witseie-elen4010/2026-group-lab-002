/* eslint-env jest */

describe('getWitsWeather()', () => {
  let getWitsWeather;

  const mockDailyResponse = (codes, temps, dates) => ({
    ok: true,
    json: async () => ({
      daily: {
        time: dates || ['2026-05-11'],
        weathercode: codes || [0],
        temperature_2m_max: temps || [24.5],
      },
    }),
  });

  beforeEach(() => {
    jest.resetModules();
    ({ getWitsWeather } = require('../../src/services/weather-service'));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('returns a map keyed by YYYY-MM-DD with condition, icon, maxTemp, message when API responds', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce(
      mockDailyResponse([0], [24.5], ['2026-05-11'])
    );

    const result = await getWitsWeather();

    expect(typeof result).toBe('object');
    expect(Object.keys(result).length).toBeGreaterThan(0);
    const entry = result['2026-05-11'];
    expect(entry).toMatchObject({
      condition: expect.any(String),
      icon: expect.any(String),
      maxTemp: expect.any(Number),
      message: expect.any(String),
    });
  });

  test('returns empty object when fetch throws', async () => {
    jest.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network error'));

    const result = await getWitsWeather();

    expect(result).toEqual({});
  });

  test('only calls fetch once across two sequential calls (cache hit)', async () => {
    const mockFetch = jest.spyOn(global, 'fetch').mockResolvedValue(
      mockDailyResponse([0], [24.5], ['2026-05-11'])
    );

    await getWitsWeather();
    await getWitsWeather();

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  test('WMO code 0 maps to condition sunny', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce(
      mockDailyResponse([0], [22], ['2026-05-11'])
    );

    const result = await getWitsWeather();

    expect(result['2026-05-11'].condition).toBe('sunny');
  });

  test('WMO code 61 maps to condition rainy', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce(
      mockDailyResponse([61], [18], ['2026-05-11'])
    );

    const result = await getWitsWeather();

    expect(result['2026-05-11'].condition).toBe('rainy');
  });

  test('WMO code 95 maps to condition storm', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce(
      mockDailyResponse([95], [20], ['2026-05-11'])
    );

    const result = await getWitsWeather();

    expect(result['2026-05-11'].condition).toBe('storm');
  });

  test('maxTemp 12 with WMO code 0 includes "chilly" in the message', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce(
      mockDailyResponse([0], [12], ['2026-05-11'])
    );

    const result = await getWitsWeather();

    expect(result['2026-05-11'].message).toContain('chilly');
  });
});
