/* eslint-env jest */
const { showLecturerConsultations, cancelLecturerConsultation } = require('../../src/controllers/lecturer-consultations-controller');

jest.mock('../../database/db', () => ({ prepare: jest.fn() }));

const db = require('../../database/db');

const TODAY  = new Date().toISOString().split('T')[0];
const FUTURE = '2099-12-31';
const PAST   = '2000-01-01';

const mockReq = (overrides = {}) => ({
  session: { userId: 'A000356', userName: 'Clark Kent', userRole: 'lecturer' },
  query:  {},
  params: {},
  ...overrides,
});

const mockRes = () => {
  const res = {};
  res.render   = jest.fn();
  res.redirect = jest.fn();
  return res;
};

describe('showLecturerConsultations()', () => {
  beforeEach(() => db.prepare.mockReset());

  test('splits rows into upcoming, past and cancelled correctly', () => {
    const rows = [
      { const_id: 1, consultation_date: FUTURE, status: 'Available' },
      { const_id: 2, consultation_date: PAST,   status: 'Booked' },
      { const_id: 3, consultation_date: FUTURE, status: 'Cancelled' },
      { const_id: 4, consultation_date: PAST,   status: 'Cancelled' },
    ];
    db.prepare.mockReturnValueOnce({ all: jest.fn().mockReturnValue(rows) });

    const res = mockRes();
    showLecturerConsultations(mockReq(), res);

    expect(res.render).toHaveBeenCalledWith('lecturer-consultations', expect.objectContaining({
      upcoming:  [rows[0]],
      past:      [rows[1]],
      cancelled: [rows[2], rows[3]],
    }));
  });

  test('excludes cancelled consultations from the past list', () => {
    const rows = [
      { const_id: 1, consultation_date: PAST, status: 'Cancelled' },
    ];
    db.prepare.mockReturnValueOnce({ all: jest.fn().mockReturnValue(rows) });

    const res = mockRes();
    showLecturerConsultations(mockReq(), res);

    expect(res.render).toHaveBeenCalledWith('lecturer-consultations', expect.objectContaining({
      past: [],
    }));
  });

  test('passes error query param to view', () => {
    db.prepare.mockReturnValueOnce({ all: jest.fn().mockReturnValue([]) });
    const res = mockRes();
    showLecturerConsultations(mockReq({ query: { error: 'Something went wrong' } }), res);
    expect(res.render).toHaveBeenCalledWith('lecturer-consultations', expect.objectContaining({
      error: 'Something went wrong',
    }));
  });

  test('passes success query param to view', () => {
    db.prepare.mockReturnValueOnce({ all: jest.fn().mockReturnValue([]) });
    const res = mockRes();
    showLecturerConsultations(mockReq({ query: { success: 'Done' } }), res);
    expect(res.render).toHaveBeenCalledWith('lecturer-consultations', expect.objectContaining({
      success: 'Done',
    }));
  });

  test('renders error view with empty arrays when DB throws', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    db.prepare.mockReturnValueOnce({ all: jest.fn().mockImplementation(() => { throw new Error('DB down'); }) });
    const res = mockRes();
    showLecturerConsultations(mockReq(), res);
    expect(res.render).toHaveBeenCalledWith('lecturer-consultations', expect.objectContaining({
      rows: [], upcoming: [], past: [], cancelled: [],
      error: 'Could not load consultations. Please try again.',
    }));
  });
});

describe('cancelLecturerConsultation()', () => {
  beforeEach(() => db.prepare.mockReset());

  test('redirects with error when consultation is not found', () => {
    db.prepare.mockReturnValueOnce({ get: jest.fn().mockReturnValue(null) });
    const res = mockRes();
    cancelLecturerConsultation(mockReq({ params: { constId: '99' } }), res);
    expect(res.redirect).toHaveBeenCalledWith('/lecturer/consultations?error=Consultation+not+found');
  });

  test('redirects with error when consultation is already cancelled', () => {
    db.prepare.mockReturnValueOnce({ get: jest.fn().mockReturnValue({ const_id: 1, status: 'Cancelled', consultation_date: FUTURE }) });
    const res = mockRes();
    cancelLecturerConsultation(mockReq({ params: { constId: '1' } }), res);
    expect(res.redirect).toHaveBeenCalledWith('/lecturer/consultations?error=Consultation+is+already+cancelled');
  });

  test('redirects with error when consultation is in the past', () => {
    db.prepare.mockReturnValueOnce({ get: jest.fn().mockReturnValue({ const_id: 1, status: 'Booked', consultation_date: PAST }) });
    const res = mockRes();
    cancelLecturerConsultation(mockReq({ params: { constId: '1' } }), res);
    expect(res.redirect).toHaveBeenCalledWith('/lecturer/consultations?error=Cannot+cancel+a+past+consultation');
  });

  test('updates status to Cancelled and redirects with success', () => {
    db.prepare
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue({ const_id: 1, status: 'Available', consultation_date: FUTURE }) })
      .mockReturnValueOnce({ run: jest.fn() });
    const res = mockRes();
    cancelLecturerConsultation(mockReq({ params: { constId: '1' } }), res);
    expect(res.redirect).toHaveBeenCalledWith('/lecturer/consultations?success=Consultation+cancelled+successfully');
  });

  test('calls UPDATE with the correct constId', () => {
    const runMock = jest.fn();
    db.prepare
      .mockReturnValueOnce({ get: jest.fn().mockReturnValue({ const_id: 42, status: 'Booked', consultation_date: FUTURE }) })
      .mockReturnValueOnce({ run: runMock });
    cancelLecturerConsultation(mockReq({ params: { constId: '42' } }), mockRes());
    expect(runMock).toHaveBeenCalledWith('42');
  });

  test('redirects with error when DB throws', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    db.prepare.mockReturnValueOnce({ get: jest.fn().mockImplementation(() => { throw new Error('DB error'); }) });
    const res = mockRes();
    cancelLecturerConsultation(mockReq({ params: { constId: '1' } }), res);
    expect(res.redirect).toHaveBeenCalledWith('/lecturer/consultations?error=Could+not+cancel+consultation.+Please+try+again.');
  });
});
