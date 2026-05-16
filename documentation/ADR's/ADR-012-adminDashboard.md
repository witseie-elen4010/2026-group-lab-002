# ADR-012: Implement Metadata-Driven Admin Dashboard and System-Wide Activity Logging

## Status

Accepted — 2026-05-15

---

## Context

As the platform expands, system administrators require comprehensive CRUD (Create, Read, Update, Delete) access to core database entities such as:

- `students`
- `staff`
- `courses`
- `departments`
- `degrees`
- `lecturer_availability`
- `consultations`
- `staff_courses`
- `consultation_attendees`
- `enrollments`

Building bespoke controllers, validation logic, routes, and views for every individual table scales poorly and introduces substantial maintenance overhead. Every future schema modification would require repetitive updates throughout both frontend and backend layers, violating DRY (Don't Repeat Yourself) principles.

The existing schema already demonstrates increasing relational complexity through:

- many-to-many relationships (`staff_courses`, `enrollments`, `consultation_attendees`);
- cascading foreign key constraints;
- dynamic consultation booking logic;
- availability scheduling; and
- administrative functionality.

Additionally, administrators and standard users perform state-changing operations throughout the platform. This introduces security, accountability, and debugging concerns. The system therefore requires a robust, centralised audit trail capable of recording:

- who performed an action;
- what action was performed;
- when the action occurred; and
- which records were affected.

The audit system must support efficient relational queries for future debugging, moderation, and administrative review.

---

## Decision

We will implement a Metadata-Driven Admin Dashboard coupled with a Centralised Activity Logging Service.

---

## 1. Metadata-Driven Admin Dashboard

Instead of hardcoding CRUD interfaces for every table, the admin subsystem will dynamically inspect the SQLite schema at runtime using:

- `sqlite_master`
- `PRAGMA table_info(table_name)`
- `PRAGMA foreign_key_list(table_name)`

The dashboard will dynamically generate:

- table views;
- CRUD forms;
- column mappings;
- validation metadata; and
- foreign key dropdown relationships.

### Design Characteristics

- Newly created database tables automatically become manageable through the admin dashboard.
- Foreign key relationships dynamically populate dropdown menus using referenced data.
- Composite primary keys such as:
  - `enrollments(student_number, course_code)`
  - `staff_courses(staff_number, course_code)`
  - `consultation_attendees(const_id, student_number)`
  
  must be handled dynamically by the admin layer.

- The dashboard must correctly interpret:
  - `ON DELETE CASCADE`
  - `ON DELETE SET NULL`
  - CHECK constraints
  - UNIQUE constraints
  - default values

- Sensitive infrastructure tables will be excluded using a strict whitelist/blacklist mechanism.

### Protected Tables

The following tables will not be editable through the dynamic admin interface:

- `activity_log`
- `affected_records`
- `actions`

This prevents tampering with the audit trail itself.

---

## 2. Centralised Activity Logging Architecture

A dedicated audit subsystem will capture all state-changing operations performed within the platform.

The existing schema already includes the required relational logging structure:

```sql
CREATE TABLE actions (
    action_id INT PRIMARY KEY,
    action_name VARCHAR(100) NOT NULL,
    page_context VARCHAR(100) NOT NULL,
    description VARCHAR(255) NOT NULL
);

CREATE TABLE activity_log (
    log_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    action_id INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT log_action
        FOREIGN KEY (action_id)
        REFERENCES actions(action_id)
);

CREATE TABLE affected_records (
    log_id INT NOT NULL,
    table_affected VARCHAR(100) NOT NULL,
    record_id VARCHAR(50) NOT NULL,

    PRIMARY KEY (log_id, table_affected, record_id),

    CONSTRAINT affected_log
        FOREIGN KEY (log_id)
        REFERENCES activity_log(log_id)
        ON DELETE CASCADE
);
```

The schema also includes the following indexes:

```sql
CREATE INDEX idx_polymorphic_lookup
    ON affected_records(table_affected, record_id);

CREATE INDEX idx_user_history
    ON activity_log(user_id);
```

These indexes support efficient queries such as:

```sql
SELECT *
FROM affected_records
WHERE table_affected = 'staff'
AND record_id = 'A000356';
```

and:

```sql
SELECT *
FROM activity_log
WHERE user_id = 'A000356';
```

---

## 3. Logging Behaviour

Every state-changing operation will generate:

1. an `activity_log` entry describing the action; and
2. one or more `affected_records` rows identifying impacted database entities.

Examples include:

| Action | Affected Table |
|---|---|
| Consultation creation | `consultations` |
| Consultation attendee join | `consultation_attendees` |
| Lecturer availability update | `lecturer_availability` |
| Student registration | `students` |
| Staff-course assignment | `staff_courses` |
| Enrollment modification | `enrollments` |
| Admin updates | any managed entity |

The architecture supports one-to-many relationships between actions and affected records, allowing a single user operation to mutate multiple relational entities while maintaining full traceability.

---

## 4. Transactional Logging Service

A dedicated `logging-service` module will manage all audit logging operations.

The primary business operation and corresponding logging inserts will execute inside a single SQLite transaction using `better-sqlite3`.

### Design Principles

- Controllers remain focused on business logic.
- Logging logic is abstracted into a reusable service layer.
- Failed logging operations cannot partially commit application state.
- Audit entries remain synchronised with successful database mutations.
- Logging infrastructure remains reusable across all future modules.

### Example Flow

```js
db.transaction(() => {
    createConsultation();
    insertActivityLog();
    insertAffectedRecords();
})();
```

---

## 5. Standardised Action Dictionary

System actions will be standardised using the `actions` table.

Example seed data:

```sql
INSERT INTO actions(action_id, action_name, page_context, description)
VALUES
(1, 'CREATE_CONSULTATION', 'consultations', 'Created a consultation'),
(2, 'UPDATE_CONSULTATION', 'consultations', 'Updated a consultation'),
(3, 'DELETE_CONSULTATION', 'consultations', 'Deleted a consultation'),
(4, 'UPDATE_AVAILABILITY', 'lecturer_availability', 'Updated lecturer availability'),
(5, 'CREATE_USER', 'authentication', 'Created a new user account');
```

This prevents inconsistent action naming throughout the application.

---

## Alternatives Considered

### Hardcoded CRUD Controllers and Views Per Table

Rejected.

This approach introduces substantial technical debt and repetitive boilerplate implementation.

Every new table addition would require:

- routes;
- validation;
- frontend templates;
- controller logic; and
- database integration code.

Recent additions such as `lecturer_availability` demonstrate how rapidly this approach becomes unsustainable.

A metadata-driven approach eliminates this duplication entirely.

---

### Embed Logging Logic Directly Within Controllers

Rejected.

Embedding logging logic inside controllers tightly couples business logic and infrastructure concerns, violating the Single Responsibility Principle.

This also increases the risk of inconsistent logging behaviour across the application.

A dedicated service layer provides:

- cleaner controller implementations;
- reusable infrastructure;
- centralised error handling; and
- improved maintainability.

---

### Store Affected Records as JSON Within `activity_log`

Rejected.

Although SQLite supports JSON, relational queries against nested JSON structures are inefficient and difficult to index.

Example requirements include:

- "Show all actions affecting lecturer A000356"
- "Show all actions affecting consultation 145"
- "Show all actions performed by admin X"

Normalising affected entities into `affected_records` enables:

- indexed relational lookups;
- improved query performance;
- simpler SQL;
- relational integrity; and
- better scalability.

---

## Consequences

### Positive

#### Extreme Extensibility

New database tables automatically become manageable through the admin dashboard without requiring additional CRUD implementation.

#### Reduced Boilerplate

Dynamic schema inspection removes repetitive controller and frontend duplication.

#### Improved Maintainability

Schema changes automatically propagate into the admin interface.

#### Full Accountability

Every state-changing operation is linked to:

- a user;
- an action type;
- a timestamp; and
- affected relational records.

#### Improved Debugging

Historical mutations can be reconstructed during issue investigation.

#### Stronger Data Integrity

Transactional logging guarantees that logs only exist for successfully committed operations.

---

### Negative

#### Increased Testing Complexity

Dynamic schema inspection and transactional logging introduce additional complexity within unit and integration testing.

Tests must correctly mock:

- metadata queries;
- SQLite transactions;
- asynchronous logging behaviour; and
- relational inserts.

#### Expanded Security Surface Area

Because tables are dynamically exposed, whitelist and blacklist enforcement becomes security-critical.

Improper filtering could unintentionally expose protected infrastructure tables.

#### Additional Database Overhead

Every state-changing operation now produces additional relational inserts into:

- `activity_log`
- `affected_records`

This increases write complexity and storage requirements.

---

## Follow-Up Work

- Add integration tests for transactional logging.
- Add unit tests for metadata parsing and dynamic CRUD generation.
- ~~Prevent audit infrastructure tables from being editable through the dashboard.~~ **Done** — `activity_log`, `affected_records`, `actions`, and `admin_audit_log` added to `READ_ONLY_TABLES` in `admin-controller.js`.
- ~~Add pagination and filtering for large audit datasets.~~ **Done** — server-side pagination (20 rows/page), full-text search, and category filter chips on the Activity Log page.
- ~~Add administrator-facing audit review pages.~~ **Done** — see "Delivered: Unified Activity Log UI" below.
- ~~Add role-based access validation for admin-only functionality.~~ **Done** — `requireRole('admin')` guard on all `/admin/*` routes.
- Add rollback testing for failed transactional logging scenarios.
- Ensure composite primary key tables are correctly editable through the dynamic admin interface.

---

## Delivered: Unified Activity Log UI (2026-05-16)



### What Was Added

A dedicated page at `/admin/activity-log` was built on top of the existing logging schema. The raw `/admin/table/activity_log` route remains accessible for diagnostic use.

**New files:**
- `src/controllers/admin-activity-log-controller.js` — `showActivityLog` handler with JOIN query, category/search filtering, and server-side pagination.
- `src/services/activity-log-helpers.js` — maps `action_name` codes to readable event labels, category names, and status values. Single place to update when new action types are added.

**Controller query:** joins `activity_log`, `actions`, `affected_records`, `students`, `staff`, and `admins` to resolve actor name and role alongside each log entry. For `ADMIN_USER_ADD`, `ADMIN_USER_EDIT`, and `ADMIN_USER_DELETE` entries, the detail modal correlates the closest-timestamp row from `admin_audit_log` to show before/after change data without duplicating snapshot columns into `activity_log`.

**Admin sidebar:** the Security section now shows only the "Activity Log" link.

### Logging Gaps Fixed

Three `logActivity` calls were missing and were added:

| Location | Fix |
|---|---|
| `auth-controller.js` | Admin login was logged as `USER_LOGIN`. Changed to `ADMIN_LOGIN` so admin sessions are correctly attributed. |
| `lecturer-consultations-controller.js` | Lecturer-initiated cancellation had no log call. Added `CONSULT_CANCEL_LEC` with the affected consultation ID. |
| `availability-controller.js` | The new `updateAvailability` handler adds `AVAIL_UPDATE` with the affected availability slot ID. |

### `admin_audit_log` Added to Protected Tables

`admin_audit_log` (introduced in ADR-013) was added to `READ_ONLY_TABLES`. The original ADR-012 protected list (`activity_log`, `affected_records`, `actions`) did not include it.