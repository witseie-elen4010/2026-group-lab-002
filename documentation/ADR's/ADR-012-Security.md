# ADR-012: Security Decisions

**Status:** Accepted — Living Document  
**Date:** 2026-05-17  
**Relates to:** Epic #6 (Authenticate Securely)

This ADR acts as a running record of security decisions made across the project.
New entries are appended as security-relevant choices arise.

---

## Decision 1 — Login Error Messages (2026-05-15, revised 2026-05-16)

**Related to:** Issue #62

### Context

Story #62 originally specified distinct error messages for login failures ("No account found" vs "Incorrect password"). During initial implementation review this was flagged as a potential user enumeration risk. The first implementation used a generic message for all failures.

Following user research and team review, it was found that generic errors caused significant confusion for legitimate users — particularly students who mistype their student number and receive no guidance on which field is wrong. The UX cost was judged to outweigh the security benefit in this context, where student and staff numbers are not secret (they appear on ID cards and are shared openly within the university).

### Decision

The login endpoint returns specific messages distinguishing "account not found" from "incorrect password", prioritising user clarity and reducing failed legitimate logins. This is acceptable given that:

- Wits student numbers (7-digit integers) and staff numbers (`A######`) are semi-public within the university context — they appear on ID cards and are routinely shared.
- The information leaked ("this number is registered") is low-sensitivity in an academic setting.
- The compensating control in Decision 3 (failed-attempt lockout with one-time PIN) directly addresses the brute-force risk that enumeration would otherwise amplify.

### Consequences

- Legitimate users get actionable feedback when they mistype their ID vs their password.
- Account existence can technically be confirmed by probing — mitigated by the rate-limiting in Decision 3.
- This is a deliberate, documented trade-off, not an oversight.

---

<!-- Append new decisions below this line using the same structure -->

## Decision 2 — Email Verification Token Storage (2026-05-16)

**Related to:** Issue #50 (parent), Story #109

### Context

Email verification requires generating a one-time code and storing it temporarily against the user's account until they confirm their inbox. A naive implementation would store the raw 6-digit code in the database. If the database were exposed, an attacker could read unverified tokens and activate arbitrary accounts.

### Decision

The verification code is never stored in plaintext. On generation, the code is hashed with SHA-256 and only the hex digest is persisted in `verification_token`. On submission, the user's input is hashed identically and the digests are compared. The raw code exists only in memory during generation and in the email body in transit.

A 30-minute expiry (`token_expiry`) is enforced server-side. After successful verification, `verification_token` and `token_expiry` are set to NULL. Resend attempts are capped at 3 per account (`resend_count`) to limit code-farming.

The post-password-check placement of the `email_verified` guard preserves the generic error message policy from Decision 1 — an unverified account is only reachable after a correct password, so no account existence information is leaked.

### Consequences

- Token exposure from a database leak does not allow an attacker to verify accounts — the hash is useless without the original code.
- Expiry limits the window of a stolen code.
- Resend cap prevents abuse of the email sending endpoint.
- Accepted trade-off: SHA-256 is not a password hashing algorithm (no salt, fast to compute), but for a short-lived 6-digit code this is acceptable — the code's entropy is the binding constraint, not the hash strength.

---

<!-- Append new decisions below this line using the same structure -->

## Decision 3 — Failed Login Lockout with One-Time PIN (2026-05-16)

**Related to:** Decision 1 (compensating control for specific error messages)

### Context

With specific error messages now returned on login failure (Decision 1 revision), an attacker who confirms a valid account ID could attempt sustained brute-force attacks against that account's password. A compensating control is needed to rate-limit repeated failures against confirmed accounts.

### Decision

After 4 consecutive failed password attempts on a valid account:

1. The server generates a cryptographically random 6-digit PIN, hashes it with SHA-256, and stores the hash in `login_pin` on the user's row.
2. A security alert email is sent to the account's registered email address containing the raw PIN and a warning about the failed attempts.
3. The event is logged to `failed_login_log` with `pin_triggered = 1` for admin visibility.
4. On the next successful password entry, the user is redirected to `/login/pin` where they must enter the PIN before their session is established.
5. Correct PIN entry clears `login_pin` and resets `failed_attempts` to 0.

Each login failure (whether or not it triggers the lockout) is recorded in `failed_login_log`, giving administrators a real-time view of attack attempts under the Security → Failed Logins panel in the admin dashboard.

The PIN is stored hashed (SHA-256) for the same reason as verification tokens in Decision 2 — database exposure does not reveal the active PIN.

### Consequences

- Sustained brute-force attacks against a known account are blocked after 4 attempts; the attacker cannot proceed without also compromising the target's email inbox.
- Legitimate users who trigger the lockout (e.g., forgotten password) receive a clear email explaining what happened and how to regain access.
- Administrators see all failed attempts and lockout events without needing to inspect raw logs.
- Accepted trade-off: the lockout does not apply to admin accounts (which use a separate login path) and does not impose a time-based cooldown — once the PIN is issued, the account is unlocked as soon as the correct PIN is entered regardless of time elapsed.

---

<!-- Append new decisions below this line using the same structure -->

## Decision 4 — User Password Hashing and Storage (2026-05-17)

**Related to:** PR: Implement Secure Password Hashing & Strong Password Policies

### Context

The application previously stored user passwords in plaintext, a critical security vulnerability that would expose all user credentials in the event of a database breach. A modern, secure hashing mechanism was required to protect user passwords at rest. Additionally, a lack of password complexity requirements allowed users to create weak, easily guessable passwords.

### Decision

1. **Hashing Algorithm:** User passwords are now hashed using `bcryptjs`, an industry-standard implementation of the bcrypt algorithm. It was chosen over faster hashes (like SHA-256, used for tokens in Decision 2) because it is deliberately slow, includes an automatically generated salt per-password, and has a configurable work factor. This makes it highly resistant to brute-force, dictionary, and rainbow table attacks.

2. **Implementation:**
   - Passwords are hashed upon account creation for all user types (students, lecturers, admins).
   - Authentication is performed using `bcryptjs.compare()` to securely verify a submitted password against the stored hash without ever needing to decrypt the hash.
   - All seed data in the development database has been updated with pre-calculated bcrypt hashes to ensure test accounts remain accessible.

3. **Strong Password Policy:** A password strength policy is now enforced on the backend at signup. The policy requires passwords to contain:
   - A minimum of 8 characters.
   - At least one uppercase letter.
   - At least one number.
   - This is complemented by a real-time validation checklist on the frontend to improve user experience.

### Consequences

- **Massive Security Improvement:** A database breach will no longer expose user passwords. An attacker would only obtain the salted hashes, which are computationally expensive and impractical to crack on a large scale.
- **No Password Recovery:** Passwords are non-reversible. This means a "forgot password" feature must implement a secure *reset* flow (e.g., via email link) rather than retrieving the user's old password.
- **Improved Credential Strength:** The new policy prevents users from setting weak passwords, reducing the risk of account compromise through guessing or common password lists.
- **Minor Performance Impact:** A slight, acceptable performance overhead is introduced during signup and login due to bcrypt's computational cost. This is a necessary trade-off for robust security.
- **New Dependency:** The `bcryptjs` package is now a required dependency for the application to run.

---

<!-- Append new decisions below this line using the same structure -->

## Decision 5 — Forgot Password / Secure Password Reset (2026-05-16)

**Related to:** Decision 4 (bcrypt makes passwords non-retrievable)

### Context

Because passwords are now stored as bcrypt hashes (Decision 4), they cannot be retrieved or shown to users. A user who forgets their password has no way back in without a secure reset mechanism.

### Decision

A token-based email reset flow:

1. User submits their email on `/forgot-password`.
2. If the email matches an account, the server generates a 32-byte cryptographically random token (`crypto.randomBytes`), stores its SHA-256 hash in a new `reset_token` column, and records a 1-hour expiry in `reset_token_expiry`. The raw token is emailed as a link to `/reset-password?token=<raw>&email=<email>`.
3. On visiting the link, the server hashes the token from the URL and compares it to the stored hash. If valid and unexpired, the user sees a password form.
4. On submission, the server re-validates the token, enforces the existing password policy (8+ chars, 1 uppercase, 1 number), bcrypt-hashes the new password, saves it, and clears the reset token. The user is redirected to login.

The response to step 1 is always "if an account exists, a link has been sent" — the email address is never confirmed or denied.

### Consequences

- Users can recover access without admin intervention.
- A database breach does not expose reset tokens (only SHA-256 hashes are stored).
- The 1-hour expiry and one-time-use token limit the window of a stolen link.
- Email addresses are not enumerable through this endpoint.

---

## Decision 6 — Server-Side Input Validation and Output Encoding (2026-05-17)

**Related to:** Epic #6 (Authenticate Securely), user story: input validation and XSS protection

### Context

The application accepts user-supplied input through signup, consultation booking, and lecturer availability forms. Client-side validation (HTML `maxlength`, `required`) improves user experience but cannot be trusted — users can bypass the browser and send requests directly to the server.

### Decision

User-controlled fields are validated on the server before any database write, using a shared `src/services/input-validation.js` helper:

- Consultation title: required, max 100 characters.
- Consultation description: optional, max 500 characters.
- Availability venue: required, max 100 characters.
- Signup full name: required, max 100 characters.

All user-supplied output is rendered through EJS escaped output (`<%= %>`). Unescaped output (`<%- %>`) is only used for server-constructed JSON payloads (schema metadata, course lists) that do not contain raw user input. Database access uses `better-sqlite3` prepared statements with bound parameters throughout — no string interpolation in SQL values.

### Consequences

- Stored XSS risk is reduced: script tags submitted in form fields are stored as plain text and rendered escaped, so they never execute in the browser.
- Oversized input is rejected with a clear message before reaching the database.
- SQL injection via prepared statements was already in place; this decision documents and confirms that coverage.
- Client-side `maxlength` attributes remain for UX but are no longer the sole enforcement point.

---

<!-- Append new decisions below this line using the same structure -->

## Decision 7 — Activity Log Query Index (2026-05-16)

**Related to:** Decision 6 (activity log infrastructure), PR review feedback

### Context

The `showActivityLog` and `showFailedLogins` views sort the `activity_log` table by `created_at DESC` and filter by `action_id` (via a JOIN to `actions`). As the log grows with every user action across the system, this sort becomes a full table scan — there was no index covering both the join column and the sort column.

A PR review comment flagged this after Decision 6 introduced the Failed Logins view, which filters by `action_name = 'AUTH_FAILED_LOGIN'` through the same JOIN path.

### Decision

A composite index was added to `createSchema.sql`:

```sql
CREATE INDEX idx_activity_log_action_created
    ON activity_log(action_id, created_at);
```

This covers the JOIN filter on `action_id` and the `ORDER BY created_at DESC` sort in a single index scan, avoiding a full table scan for both the general activity log and the failed-logins filtered view.

The existing `idx_user_history` index on `activity_log(user_id)` was retained — it serves a different access pattern (per-user history lookups) and is not redundant with this new index.

### Consequences

- The `ORDER BY created_at DESC` sort on both the Activity Log and Failed Logins pages is backed by an index and will remain efficient as log volume grows.
- No application code changes were required — the index is transparent to the query layer.
- Accepted trade-off: the index adds a small write overhead on every `INSERT` into `activity_log`. Given that log writes are infrequent relative to reads (every user action writes one row), this overhead is negligible.
