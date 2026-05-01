# ADR-008: Introduce `lecturer_availability` table for recurring availability windows

## Status

Accepted — 2026-05-01

## Context

Story #9 ("Set availability") requires lecturers to declare when they are
generally available to run consultations. Story #37 deferred the schema
decision; ADR-006 noted it as follow-up work.

The existing `consultations` table cannot represent this concept cleanly:

- Every `consultations` row has a `consultation_date` — a specific calendar
  date. Availability is not tied to a date; it is a recurring weekly pattern
  (e.g. "every Monday, 09:00–12:00").
- Storing availability in `consultations` with a NULL `consultation_date`
  gives one column two different meanings depending on the row. This is a
  3NF violation: the table would no longer describe one fact type, and any
  query on `consultation_date` must also exclude the NULL rows added for
  availability.
- There is no field in `consultations` to express the maximum duration a
  student may book within an availability window. `duration_min` describes
  the length of one booked slot, not a cap the lecturer places on bookings
  within a window.

A separate table is required to represent the lecturer's weekly schedule
independently of any specific booking.

## Decision

Add a `lecturer_availability` table:

```sql
CREATE TABLE lecturer_availability (
  availability_id TEXT PRIMARY KEY,
  staff_number TEXT NOT NULL,
  day_of_week TEXT NOT NULL CHECK (day_of_week IN ('Mon','Tue','Wed','Thu','Fri')),
  
  start_time TEXT NOT NULL CHECK (start_time GLOB '[0-9][0-9]:[0-9][0-9]'),
  end_time TEXT NOT NULL CHECK (end_time GLOB '[0-9][0-9]:[0-9][0-9]'),
  
  max_booking_min INTEGER NOT NULL DEFAULT 60 CHECK (max_booking_min > 0 AND max_booking_min <= 480)  CHECK (end_time > start_time)

  max_number_of_students   INTEGER NOT NULL DEFAULT 1 CHECK (max_number_of_students > 0),
  venue                    TEXT NOT NULL CHECK(length(venue) >= 3),

  FOREIGN KEY (staff_number) REFERENCES staff(staff_number) ON DELETE CASCADE);
```

| Column | Purpose |
|---|---|
| `availability_id` | PK to table - An incremental number |
| `staff_number` | FK to the lecturer who owns this window |
| `day_of_week` | Recurring weekday - Mon–Fri only, enforced by constraint |
| `start_time` / `end_time` | Window bounds in HH:MM, consistent with `consultations.consultation_time` |
| `max_booking_min` | Maximum duration a student may request when booking within this window |
| `max_number_of_students` | Maximum number of students permitted per availability slot |
| `venue` | Location where the consultation will be held |

reference — those belong on `consultations` when an actual booking is made.

## Alternatives considered

**Store availability as rows in `consultations` with a NULL date.**
Rejected. `consultation_date NOT NULL` cannot be relaxed without weakening
integrity for real bookings. Even if it were, a single table would describe
two unrelated facts (a booked event vs. a recurring template), violating
3NF. Every query on `consultations` would need a discriminator filter to
exclude availability rows.

**Add `day_of_week` and `max_booking_min` columns to `staff`.**
Rejected. A lecturer can have multiple windows across different days and
times. Columns on `staff` limit each lecturer to one window and require
NULLs for lecturers with no availability set. A child table is the correct
pattern, consistent with `enrollments` and `staff_courses`.

**Derive availability from past consultation history.**
Rejected. Past consultations are a lagging indicator, not a declaration of
intent. Availability must be explicitly declared.

## Consequences

**Positive:**

- `consultations` remains a clean record of specific booked events with no
  NULL columns or dual-purpose rows.
- Availability windows are queryable by day, time, and lecturer with
  standard SQL.
- `max_booking_min` gives lecturers control over slot length without
  affecting consultation records.
- The Mon–Fri constraint enforces the business rule at the database level.
- Follows the same normalisation pattern as ADR-004 and ADR-006.

**Negative:**

- An additional table increases schema complexity.
- Creating a consultation from an availability window requires a join across
  two tables and copying time/lecturer data into a new `consultations` row.

## Follow-up work

- Implement `saveAvailability` and `deleteAvailability` in
  `availability-controller.js` (currently stubbed).
- Add UI for lecturers to manage their availability windows.
- Use availability windows to suggest time slots when a student initiates a
  booking.
