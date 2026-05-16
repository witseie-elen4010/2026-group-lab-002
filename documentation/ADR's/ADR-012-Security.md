# ADR-012: Security Decisions

**Status:** Accepted — Living Document  
**Date:** 2026-05-15  
**Relates to:** Epic #6 (Authenticate Securely)

This ADR acts as a running record of security decisions made across the project.
New entries are appended as security-relevant choices arise.

---

## Decision 1 — Generic Login Error Message (2026-05-15)

**Related to:** Issue #62

### Context

Story #62 specified distinct error messages for login failures: "No account found with this email" vs "Incorrect password". During implementation review this was identified as a **user enumeration vulnerability**.

Returning different messages for "account not found" vs "wrong password" allows an attacker to silently determine whether any given student or staff number is registered — no successful authentication required. This is covered by the OWASP Authentication Cheat Sheet: *"Do not tell the user which part of the authentication data was incorrect."*

Specific risks for this application:
- **Student/staff number enumeration:** Wits student numbers (7-digit integers) and staff numbers (`A######`) follow predictable formats. An automated script could probe sequential values and build a confirmed list of registered users.
- **Credential stuffing amplification:** Knowing which IDs exist lets an attacker focus brute-force attempts only on confirmed accounts.
- **Privacy leak:** Confirming a student number is registered reveals that person uses this system, which may not be intended to be public.

### Decision

The login endpoint returns a single generic message for all authentication failures:

> **"Invalid username or password."**

This message is returned regardless of whether the identifier was not found or the password was incorrect. All other acceptance criteria from story #62 are satisfied: empty fields are caught by HTML5 `required` attributes, errors display immediately inline, no sensitive data is revealed, and the user stays on the login page.

### Consequences

- User enumeration is prevented; attackers cannot distinguish a missing account from a wrong password.
- Credential stuffing is harder without a way to confirm valid IDs.
- Legitimate users who mistype their ID cannot distinguish it from a wrong password — accepted trade-off standard to all secure login systems.

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
