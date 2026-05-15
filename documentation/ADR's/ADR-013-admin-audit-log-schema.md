# ADR-013: Admin Audit Log Table for Admin Write Operations

**Date:** 2026-05-15
**Status:** Accepted
**Relates to:** ADR-003, ADR-004, ADR-006

---

## Context

The admin dashboard provides direct CRUD access to every table in the database. Any INSERT, UPDATE, or DELETE executed by an admin takes effect immediately and permanently, with no confirmation step, no record of who made the change, and no way to recover data after a mistake.

A team discussion flagged the specific risk of an admin accidentally deleting a lecturer account or corrupting an enrolment record. Because better-sqlite3 executes synchronous writes with no soft-delete support, a mistaken delete is irreversible. There is also no way to audit what an admin did or when, which is a basic requirement for any system that manages user data.

User story #116 (Sprint 4) formalised these requirements: admin write operations must be recorded in a dedicated audit log, the log must be readable on the admin dashboard, and audit entries must not be deletable through the UI.

---

## Decision

Add a dedicated `admin_audit_log` table to the SQLite schema. Every successful admin INSERT, UPDATE, or DELETE is written to this table by `src/services/admin-audit-service.js` immediately after the operation completes.

The table schema is:

```sql
CREATE TABLE admin_audit_log (
  audit_id   INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_id   TEXT NOT NULL,
  action     TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  table_name TEXT NOT NULL,
  row_id     TEXT NOT NULL,
  old_data   TEXT,
  new_data   TEXT,
  timestamp  DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

The `old_data` and `new_data` columns store JSON snapshots of the record state before and after the operation. These are optional (`NULL` for inserts that have no prior state, or deletes that produce no new state) but are included because the user story specifically requires that mistakes be recoverable. A raw timestamp and row ID alone are not sufficient for recovery; the full record content is needed.

Two indexes are added:

```sql
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin
  ON admin_audit_log(admin_id);

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_table_row
  ON admin_audit_log(table_name, row_id);
```

The `admin_audit_log` table is added to `READ_ONLY_TABLES` in `admin-controller.js`. Any attempt to INSERT, UPDATE, or DELETE audit log rows through the admin UI is rejected with a clear error message. The table is accessible through the standard `/admin/table/admin_audit_log` route but renders without Add, Edit, or Delete buttons.

---

## Schema Management Approach

The `admin_audit_log` table was added directly to `createSchema.sql` rather than as a separate migration file. This is consistent with the pattern established across all previous schema changes in this project (ADR-004, ADR-006, ADR-008): the schema is rebuilt from scratch on each `npm run setup` invocation, and `createSchema.sql` is the single authoritative source of the complete table structure.

No migration tooling (such as Flyway or Knex migrations) has been adopted in this project. The team considered it in ADR-003 and deferred it as unnecessary overhead at the current scale and team size. Adding a separate migration file for this table would be inconsistent with every other schema addition made so far and would create a split between what `createSchema.sql` describes and what the running database actually contains.

The `admin_audit_log` table is also added to the `DROP TABLE IF EXISTS` block at the top of `createSchema.sql`, ensuring the rebuild is idempotent. Because the table has no foreign key references from other tables, drop order is not a concern.

---

## Why SQLite for Audit Data

Audit log entries are stored in the same SQLite database as application data rather than in a separate log store, log file, or external service. This decision is appropriate at the project's current scale for the following reasons:

- **Consistency with ADR-002 and ADR-003.** The project runs as a single Render instance with no external services. Introducing a separate log store (a file system log, a hosted logging service, or a second database) would add an external dependency inconsistent with the single-process, single-database architecture the team has deliberately maintained.
- **Queryability.** Storing audit entries in SQLite means they can be queried through the same admin dashboard table viewer that already exists. A flat log file or a separate service would require a dedicated query interface to be useful to an admin.
- **Transactional proximity.** SQLite's synchronous write model means audit entries are written in the same process as the admin operation. There is no network hop, no message queue, and no risk of the log entry being lost because a separate service was unreachable.
- **Scale appropriateness.** The admin user population for this application is very small (one to three users). Audit log write volume is negligible. The overhead of a dedicated logging infrastructure is not justified.

The main tradeoff is that the audit table will grow unboundedly in the same database file as application data. This is not a concern for the project's expected lifespan, but a retention policy should be added before any deployment where long-term log volume becomes a storage consideration.

---

## Why a Separate Table Rather Than Extending the Existing Schema

A broader system-wide activity logging system (`activityLog`, `affectedRecords`, `action-types.js`) is being developed in a parallel PR. That system logs events across multiple controllers: auth, availability, booking, and course management, and is designed for general observability.

This ADR deliberately keeps the admin audit log separate for the following reasons:

- The user story acceptance tests specify an `admin_audit_log` table by name. Using the shared `activityLog` table would satisfy the functional requirement but would not match the schema the story describes.
- Admin audit entries have different retention and access requirements from general activity logs. Admin entries must be read-only in the UI and must never be deletable. Conflating the two systems would require conditional logic throughout the shared logger.
- The scope of admin audit logging is narrower and more stable. A focused table is easier to reason about, easier to index appropriately, and easier to test in isolation.

---

## Alternatives Considered and Rejected

**Using the shared `activityLog` / `affectedRecords` tables from the parallel PR:** this would satisfy the functional requirement but couples this feature to a broader logging system that is still in development. The admin audit log has stricter read-only UI requirements that would complicate the shared system. Rejected in favour of a dedicated table scoped to admin operations.

**Soft deletes (adding a `deleted_at` column to each table):** this would allow recovery of deleted records without a separate log, but requires schema changes across every table and controller. It also does not capture UPDATE history, which is needed for the "recoverable if I make a mistake" requirement. Rejected as disproportionate to the scope of this user story.

**Application-level backup (SQLite `.backup()` before each admin write):** this would provide full database snapshots but creates unbounded disk usage with no structured query interface. There is no practical way to surface backup data in the admin dashboard. Rejected as operationally unworkable.

**Storing audit data in a separate file or external service:** inconsistent with ADR-002 (single Render instance, no external services) and ADR-003 (SQLite as the sole data store). Rejected.

---

## Consequences

**Positive:**
- Every admin write operation is permanently recorded with the admin ID, timestamp, affected table, row identifier, and full before/after record state.
- Mistakes are recoverable: an admin can read the `old_data` JSON from the audit log and manually restore a deleted or incorrectly updated record.
- Audit log entries cannot be tampered with or deleted through the admin UI, satisfying the read-only requirement from the user story.
- The implementation is self-contained and does not depend on any other in-progress feature.

**Negative / tradeoffs:**
- The `old_data` and `new_data` columns store serialised JSON, which is not queryable at the field level without parsing. If specific field-level search of audit history is needed in future, a more structured schema would be required.
- Audit log rows are written synchronously in the same request cycle as the admin operation. A failure in `logAdminAudit` (e.g., a schema mismatch after migration) would not roll back the admin operation; the write would succeed but go unlogged. This is acceptable at the current project scale but should be reviewed if audit completeness becomes a hard requirement.
- The table will grow unboundedly. There is currently no retention policy or archiving mechanism. For the project's expected lifespan and admin user count this is not a concern, but it should be addressed before any production deployment at scale.
