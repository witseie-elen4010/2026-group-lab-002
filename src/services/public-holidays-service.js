const cache = {};

const getSAPublicHolidays = async (year) => {
  if (cache[year]) return cache[year];
  try {
    const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/ZA`);
    if (!res.ok) return [];
    const data = await res.json();
    const holidays = data.map(h => ({ date: h.date, localName: h.localName }));
    cache[year] = holidays;
    return holidays;
  } catch {
    return [];
  }
};

module.exports = { getSAPublicHolidays };
