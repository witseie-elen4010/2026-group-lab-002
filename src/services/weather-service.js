let cache = null;
let cacheTime = 0;
const TTL_MS = 4 * 60 * 60 * 1000;

function mapWMO(code, maxTemp) {
  let base;
  if (code <= 1)                                              base = { condition: 'sunny',  icon: '☀️',  message: 'Clear skies' };
  else if (code <= 3)                                         base = { condition: 'cloudy', icon: '⛅',  message: 'Partly cloudy' };
  else if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) base = { condition: 'rainy',  icon: '🌧️', message: 'Rain expected — bring an umbrella' };
  else if (code >= 95 && code <= 99)                          base = { condition: 'storm',  icon: '⛈️', message: 'Thunderstorms expected' };
  else if (code >= 71 && code <= 77)                          base = { condition: 'cold',   icon: '🧥',  message: 'Cold and grey' };
  else                                                        base = { condition: 'mild',   icon: '🌤️', message: 'Mild conditions' };

  const message = maxTemp <= 14 ? base.message + ' — quite chilly for Joburg' : base.message;
  return { condition: base.condition, icon: base.icon, maxTemp, message };
}

const getWitsWeather = async () => {
  const now = Date.now();
  if (cache && (now - cacheTime) < TTL_MS) return cache;
  try {
    const res = await fetch(
      'https://api.open-meteo.com/v1/forecast?latitude=-26.1892&longitude=28.0306&daily=weathercode,temperature_2m_max,precipitation_sum&timezone=Africa/Johannesburg&forecast_days=10'
    );
    if (!res.ok) return {};
    const data = await res.json();
    const { time, weathercode, temperature_2m_max } = data.daily;
    const map = {};
    for (let i = 0; i < time.length; i++) {
      map[time[i]] = mapWMO(weathercode[i], temperature_2m_max[i]);
    }
    cache = map;
    cacheTime = now;
    return map;
  } catch {
    return {};
  }
};

module.exports = { getWitsWeather };
