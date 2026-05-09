const validateJoin = (consultation, studentNumber, attendees) => {
  if (!consultation) {
    return { valid: false, reason: 'Consultation not found.' };
  }
  if (consultation.status !== 'Booked') {
    return { valid: false, reason: 'Only consultations with Booked status can be joined.' };
  }
  if (!consultation.allow_join) {
    return { valid: false, reason: 'This consultation does not allow joining.' };
  }
  if (attendees.length >= consultation.max_number_of_students) {
    return { valid: false, reason: 'This consultation is at full capacity.' };
  }
  if (attendees.some(a => a.student_number === studentNumber)) {
    return { valid: false, reason: 'You are already attending this consultation.' };
  }
  return { valid: true };
};

module.exports = { validateJoin };
