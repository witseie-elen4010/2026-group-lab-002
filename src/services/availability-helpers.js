const generateConstId = (date, count) => {
  const sequence = String(count + 1).padStart(5, '0');
  return `${date}-${sequence}`;
};

const validateSlotFields = ({ consultation_date, consultation_time, consultation_end_time, venue, max_number_of_students }) => {
  return !!(consultation_date && consultation_time && consultation_end_time && venue && max_number_of_students);
};

const toMinutes = (timeStr) => {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

const isBusinessHours = (startTime, endTime) => {
  const start = toMinutes(startTime);
  const end = toMinutes(endTime);
  return start >= 8 * 60 && end <= 18 * 60 && start < end;
};

const computeDuration = (startTime, endTime) => {
  return toMinutes(endTime) - toMinutes(startTime);
};

const isOverlapping = (existingSlots, startTime, endTime) => {
  const newStart = toMinutes(startTime);
  const newEnd = toMinutes(endTime);
  return existingSlots.some(slot => {
    const existStart = toMinutes(slot.consultation_time);
    const existEnd = existStart + (slot.duration_min || 0);
    return newStart < existEnd && newEnd > existStart;
  });
};

module.exports = { generateConstId, validateSlotFields, isBusinessHours, computeDuration, isOverlapping };
