# ADR-005: Student data uses a 3NF relational schema (degrees, students, courses, enrollments)

## Status

Accepted — 2026-04-24

## Context

Sprint 1 requires a `student` table to support registration, login, and
eventually the consultation booking flow. During PR review on the initial
`users` table, several issues surfaced:

- The table was named `users` but only held students. Staff will have a
  separate table with slightly different columns.
- A `role` column was present but redundant — staff numbers start with `A`,
  student numbers do not, so the prefix already distinguishes them.
- Required fields were missing: `degree`, and the ability to represent a
  student's enrolled courses (which determine their year of study).
- An early proposal stored courses and years as JSON arrays in columns on
  the student row.

A student can be enrolled in courses across multiple year levels (e.g. a
4th year repeating a 3rd year subject), so any design must support
multi-year membership without special-casing.

## Decision

Model student data across four tables in 3rd Normal Form:

1. `degrees` — catalog of degrees offered (e.g. BSc Eng Information).
2. `students` — core identity (student number, name, email, password,
   degree reference). No role, no year, no course list.
3. `courses` — catalog of courses. Each course has a code, name, year
   level, and belongs to a degree.
4. `enrollments` — junction table bridging students to courses
   (many-to-many).

Year of study is not stored. It is derived from the year levels of the
courses a student is enrolled in. A student enrolled in both a 3rd year
and a 4th year course is in both years simultaneously, with no schema
change needed.

Foreign keys are defined on `students.degree_code`, `courses.degree_code`,
`enrollments.student_number`, and `enrollments.course_code`. Because SQLite
disables foreign key enforcement by default, every database connection
must execute `PRAGMA foreign_keys = ON` immediately after opening.

## Alternatives considered

**JSON arrays on the student row** (`courses TEXT`, `year_of_study TEXT`
holding JSON-encoded arrays). Rejected because:

- Violates 1st Normal Form (multiple values in one cell).
- Not queryable with standard SQL. "List students in ELEN4010" requires
  loading every row into application code and parsing JSON.
- No referential integrity. A typo in a course code is stored silently;
  a renamed course is not reflected in existing rows.
- Lecturer dashboards (consultations filtered by course) become
  JavaScript-side filtering instead of a database join.

**Single `year_of_study` column on the student row.** Rejected because it
cannot represent a student spanning two years without introducing an
awkward "optional second year" column, and it duplicates information
already implied by the student's enrollments.

**Separate `years_of_study` table.** Rejected because the year is fully
derivable from `enrollments` joined to `courses`. Storing it separately
creates a second source of truth that can drift out of sync with
enrollments.

**Courses belong to multiple degrees** via a `degree_courses` junction.
Deferred. For Sprint 1 we assume each course belongs to exactly one
degree. If cross-degree courses become necessary, a follow-up ADR will
introduce the junction table.

## Consequences

**Positive:**

- Schema is queryable with standard SQL joins.
- Referential integrity is enforced by the database, not by application
  code.
- Adding a new degree or course requires a single INSERT, not a schema
  change.
- The lecturer dashboard query ("consultations for my course") and the
  registration flow ("show courses for my degree") are both one join.
- Multi-year students are supported without any special handling.

**Negative:**

- Four tables instead of one. More CREATE TABLE statements, more files
  to understand on first read.
- Queries that need a student's full profile (degree name + course list)
  require joins across three or four tables.
- Every database connection must remember to enable foreign keys. This
  is encapsulated in the database module to prevent mistakes.

**Follow-up work:**

- Seed `degrees` with the degrees the application supports before any
  student can register.
- Seed `courses` with the course catalog for each seeded degree.
- Extend registration UI to fetch courses filtered by the student's
  chosen degree.
- Revisit cross-degree courses in a future ADR if required.