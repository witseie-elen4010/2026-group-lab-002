// Pure helpers for availability extracted so we can unit test without hitting the database.
// These are not meant to be used outside of the availability controller, but are exported for testing purposes.

const generateConstId = (date, count) => {
  const sequence = String(count + 1).padStart(5, '0');
  return `${date}-${sequence}`;
};

const validateSlotFields = ({ consultation_date, consultation_time, venue, duration_min, max_number_of_students }) => {
  return !!(consultation_date && consultation_time && venue && duration_min && max_number_of_students);
};

module.exports = { generateConstId, validateSlotFields };
