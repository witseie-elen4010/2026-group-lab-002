# ADR-010: Consultation Discovery and Booking Flow

**Date:** 2026-05-09
**Status:** Accepted
**Issues:** #9, #47, #48, #89, #90, #91

---

## Context

Students need to discover when their lecturers are available, book a consultation slot within those windows, and optionally allow classmates to join the same session. This ADR documents the key decisions made when implementing the booking flow across issues #9, #47, #48, #89, #90, and #91.

---

## Decisions

### 1. Slot moulding rule (continuous window minus bookings)

When a student books a time range inside a lecturer's recurring availability window, that booked range is subtracted from the window. The remaining free time is presented as one or more contiguous "bookable chunks" to the next student.

**Example:** Window 14:00–16:00, booking at 14:00–14:15 → other students see one bookable chunk of 14:15–16:00.

This approach was chosen over a "fixed slot grid" (e.g., always 15-min slots) because it preserves flexibility: students can book any duration up to `max_booking_min` without the app dictating a predetermined grid. A grid would require the lecturer to configure slot sizes upfront and would waste time if no one books a particular slot.

**Implementation:** `computeBookableChunks(window, bookingsOnDay)` in `src/services/booking-helpers.js` performs this computation as a pure function, making it straightforward to unit test without database access.

### 2. Joinable consultation pattern (organiser opt-in)

When a student creates a consultation, they choose whether other students may join (checkbox, default = true). This `allow_join` flag is stored on the consultation row.

- If `allow_join = 1` and the consultation has not yet reached `max_number_of_students`, other enrolled students see a "Join" button on the dashboard calendar and on the booking page.
- If `allow_join = 0`, the slot is locked to the organiser only and shows as "Booked" to others.

**Why a dedicated column rather than a computed rule:** Alternatives considered included deriving joinability from the consultation status or from whether the organiser explicitly invited attendees. A computed rule would have required either a separate invitations table or an attendee-whitelist mechanism. Storing `allow_join` as a simple integer on the consultation row keeps the query simple (a single `allow_join = 1` filter) and makes the organiser's intent explicit and stable across status transitions.

### 3. Capacity is per-time-instant, not per-window

`max_number_of_students` on a `lecturer_availability` row defines how many students can occupy the window at any single point in time, not the total across the whole window. Two students booking non-overlapping 15-minute slots in the same window each occupy capacity only during their own slot. This is validated by `canBookInRange()` in `booking-helpers.js`, which counts overlapping attendees at booking time rather than counting all bookings in the day.

### 4. Discovery is course-first, not lecturer-first

Students navigate: Dashboard → course card → course detail page → availability grid → booking page. The alternative (student picks a lecturer directly) was rejected because students think in terms of which course they need help with, not which lecturer they want to see. Showing availability grouped by course also makes it natural to colour-code the calendar by course on the dashboard.

### 5. Duration is student-controlled with no overflow enforcement

The booking page offers a duration slider from 15 minutes up to `min(window.max_booking_min, chunk_length)`. Once the student submits a booking, the app validates that `start_time + duration_min` fits within the window but does not cap or warn if the student chooses an optimistic duration. Students must be given the authority to judge how long they need; the app should not second-guess this. The risk that a student underestimates consultation length and runs over into a neighbouring slot is acceptable: the availability window sets an outer boundary, and the lecturer can manage overruns in person.

### 6. Schema additions to `consultations`

Two columns were added (schema rebuilt via `npm run setup`; no migration required):

| Column | Type | Default | Purpose |
|---|---|---|---|
| `allow_join` | `INTEGER` | `1` | Organiser opt-in flag for joinability |
| `availability_id` | `INTEGER` (FK) | `NULL` | Links the consultation back to the recurring window, enabling efficient per-window queries |

A migration script was explicitly not written because the project rebuilds the database from `createSchema.sql` and `seedVitalInfo.sql` on every `npm run setup` call. Any developer pulling this branch must re-run `npm run setup`.

---

## Consequences

- Developers must run `npm run setup` after pulling this branch to pick up the schema changes.
- The `computeBookableChunks` and `canBookInRange` helpers are pure functions in `src/services/booking-helpers.js` — all overlap and capacity logic belongs there, not in controllers.
- Cancel and Leave flows are out of scope for this PR. The detail page renders the buttons but routes them to placeholder handlers that return an "not yet implemented" message. These are tracked as follow-up stories.
- The lecturer dashboard is untouched. All calendar and booking UI is on the student dashboard only.
