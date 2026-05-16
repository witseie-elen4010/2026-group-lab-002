const toMin = (timeStr) => {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

const fromMin = (totalMin) => {
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

const PALETTE = [
  '#0d6efd',
  '#198754',
  '#dc3545',
  '#fd7e14',
  '#6f42c1',
  '#20c997',
  '#0dcaf0',
  '#d63384',
  '#ff5722',
  '#607d8b',
  '#795548',
  '#6610f2',
];

const computeBookableChunks = (window, bookingsOnDay) => {
  let chunks = [{ start: toMin(window.start_time), end: toMin(window.end_time) }];

  for (const booking of bookingsOnDay) {
    const bStart = toMin(booking.consultation_time);
    const bEnd = bStart + Number(booking.duration_min);
    const next = [];
    for (const chunk of chunks) {
      if (bEnd <= chunk.start || bStart >= chunk.end) {
        next.push(chunk);
      } else {
        if (bStart > chunk.start) next.push({ start: chunk.start, end: bStart });
        if (bEnd < chunk.end) next.push({ start: bEnd, end: chunk.end });
      }
    }
    chunks = next;
  }

  return chunks.map(c => ({
    start_time: fromMin(c.start),
    end_time: fromMin(c.end),
    max_students: window.max_number_of_students,
  }));
};

const canBookInRange = (window, bookingsOnDay, startTime, endTime) => {
  const rStart = toMin(startTime);
  const rEnd = toMin(endTime);

  const overlapping = bookingsOnDay.filter(b => {
    const bStart = toMin(b.consultation_time);
    const bEnd = bStart + Number(b.duration_min);
    return rStart < bEnd && rEnd > bStart;
  });

  if (overlapping.some(b => !b.allow_join)) return false;

  const totalAttendees = overlapping.reduce((sum, b) => sum + (b.attendee_count || 1), 0);
  return totalAttendees < window.max_number_of_students;
};

const colourForCourse = (courseCode) => {
  let hash = 0;
  for (let i = 0; i < courseCode.length; i++) {
    hash = (hash * 31 + courseCode.charCodeAt(i)) | 0;
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
};

const getNextNWeekdays = (startDate, n = 10) => {
  const days = [];
  const d = new Date(startDate);
  d.setUTCHours(12, 0, 0, 0);
  while (days.length < n) {
    const dow = d.getUTCDay();
    if (dow !== 0 && dow !== 6) {
      days.push(new Date(d));
    }
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return days;
};

const validateBookingRequest = ({ date, start_time, duration_min, window, bookingsOnDay, todayStr, currentTimeStr }) => {
  const weekdays = getNextNWeekdays(new Date(`${todayStr}T12:00:00Z`));
  const dateStrs = weekdays.map(d => d.toISOString().split('T')[0]);
  if (!dateStrs.includes(date)) {
    return { valid: false, reason: 'Date is not within the next 10 weekdays.' };
  }

  const bookingStart = toMin(start_time);
  const bookingEnd = bookingStart + Number(duration_min);
  const windowStart = toMin(window.start_time);
  const windowEnd = toMin(window.end_time);

  if (bookingStart < windowStart || bookingEnd > windowEnd) {
    return { valid: false, reason: 'Booking time does not fit within the availability window.' };
  }

  if (Number(duration_min) > window.max_booking_min) {
    return { valid: false, reason: `Booking duration exceeds the lecturer's maximum consultation duration of ${window.max_booking_min} minutes.` };
  }

  const chunks = computeBookableChunks(window, bookingsOnDay);
  const chunkForSlot = chunks.find(c => toMin(c.start_time) <= bookingStart && bookingStart < toMin(c.end_time));
  if (chunkForSlot && bookingEnd > toMin(chunkForSlot.end_time)) {
    return { valid: false, reason: 'Booking duration exceeds the available time in this slot.' };
  }

  if (date === todayStr && currentTimeStr) {
    if (bookingStart <= toMin(currentTimeStr)) {
      return { valid: false, reason: 'Booking start time must be in the future.' };
    }
  }

  if (!canBookInRange(window, bookingsOnDay, start_time, fromMin(bookingEnd))) {
    return { valid: false, reason: 'Time slot is unavailable due to existing bookings or full capacity.' };
  }

  return { valid: true };
};

module.exports = { computeBookableChunks, canBookInRange, colourForCourse, getNextNWeekdays, validateBookingRequest, PALETTE };
