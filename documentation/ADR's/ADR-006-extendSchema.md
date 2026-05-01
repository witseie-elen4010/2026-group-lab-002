# ADR-006: Extend schema to departments and staff_courses junction

## Status

Accepted — 2026-04-29

### Context

ADR-004 established a 3NF schema for student data and noted a deferral:

> "Courses belong to multiple degrees via a degree_courses junction.
> Deferred. For Sprint 1 we assume each course belongs to exactly one
> degree."

Two problems surfaced during Sprint 2:

1. The `courses` table had a `degree_code` FK, meaning a course that is
   taken by students across multiple degree programs (e.g. MECN4020
   Systems Management and Integration, taken by Mechanical, Industrial,
   Aeronautical, and Electrical/Information students) would need to be
   duplicated — one row per degree. This violates 1NF.

2. The `staff` table stored courses as a JSON text column (`courses TEXT`)
   — the same pattern explicitly rejected for students in ADR-004.

## Decision

**1. Introduce a `departments` table.**

Courses are owned by the school that runs them, not by a specific degree
program. A `departments` table is added with `dept_code`, `dept_name`, and
`faculty_name`. This reflects Wits's actual structure: the School of EIE
and the School of MIA both sit under the Faculty of Engineering and the
Built Environment.

**2. Move the FK on `courses` from `degrees` to `departments`.**

`courses.degree_code` is replaced with `courses.dept_code`. A course like
MECN4020 is owned by MIA school once. EIE students can still enroll in it
via the `enrollments` junction — the course ownership does not restrict
enrollment.

**3. Add `dept_code` FK to `degrees`.**

Degrees now reference the department that offers them. This preserves the
ability to ask "which degrees does EIE offer?" with a simple query.

**4. Add `dept_code` FK to `staff`.**

The existing free-text `department` column on `staff` gains a proper FK
reference to `departments`. The JSON `courses` column is removed entirely.

**5. Add `staff_courses` junction table.**

Replaces the JSON `courses` column on `staff`. Same pattern as
`enrollments` for students. A lecturer can teach multiple courses; a
course can be taught by multiple lecturers.

## Alternatives considered

**Keep `courses.degree_code` and duplicate cross-program courses.**
Rejected. MECN4020 is one course. Storing it four times to attach it to
four degrees violates 1NF and creates update anomalies — renaming the
course requires four updates.

**Add a `degree_courses` junction table instead of moving to departments.**
Considered. This would allow "ELEN4010 belongs to BScEng Information AND
BScEng Electrical" to be expressed explicitly. Rejected because degree
membership for a course is not something the application queries — only
enrollment (which student takes which course) matters. Adding a junction
for degree-course membership adds a table with no query payoff for this
application.

**Keep the JSON `courses` column on `staff`.**
Rejected for the same reasons as ADR-004 — not queryable, no referential
integrity, violates 1NF.

## Consequences

**Positive:**

- Cross-program courses (e.g. MECN4020) exist as a single row. No
  duplication.
- Staff course assignments are queryable and integrity-enforced.
- The schema now accurately reflects Wits's faculty → school → degree →
  course hierarchy without over-engineering a full faculty table.
- Resolves the deferral noted in ADR-004.

**Negative:**

- `createSchema.sql` is more complex — seven tables instead of five.
- Queries for "courses a student can take" no longer filter by
  `degree_code` on the course. Application code must use enrollments
  or present all courses in the relevant department.
- Existing seed data (`seed-001`) must be updated to match the new FK
  structure before `npm run setup` works.

**Follow-up work:**

- Update registration UI to show courses filtered by department
  (story #44).
- Revisit `lecturer_availability` normalization in a future ADR (story
  #37 deferred this).
