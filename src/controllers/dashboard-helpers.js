// Pure helpers for dashboard data extracted so we can unit test without hitting the database. 
// These are not meant to be used outside of the dashboard controllers, but they are exported for testing purposes.

const parseAttendees = (row) => {
  let list = [];
  try { list = JSON.parse(row.attendees || '[]'); } catch { /* leave empty */ }
  return { ...row, attendeeCount: list.length };
};

const splitByDate = (rows, todayStr) => {
  const upcoming = rows
    .filter(r => r.consultation_date >= todayStr)
    .sort((a, b) => {
      if (a.consultation_date !== b.consultation_date) {
        return a.consultation_date.localeCompare(b.consultation_date);
      }
      return a.consultation_time.localeCompare(b.consultation_time);
    });

  const past = rows
    .filter(r => r.consultation_date < todayStr)
    .sort((a, b) => {
      if (a.consultation_date !== b.consultation_date) {
        return b.consultation_date.localeCompare(a.consultation_date);
      }
      return b.consultation_time.localeCompare(a.consultation_time);
    });

  return { upcoming, past };
};

module.exports = { parseAttendees, splitByDate };