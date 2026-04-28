# ADR-005: Session-Based Authentication and Stateless HTTP Management

**Date:** 2026-04-28  
**Status:** Accepted  
**Deciders:** Aditya Raghunandan, Thandeka Malasa, Suné Toerien

---

## Context

HTTP is a stateless protocol — each request arrives at the server with 
no memory of previous requests. KnockKnock.prof requires users (lecturers 
and students) to authenticate once and then have their identity preserved 
across multiple requests: viewing dashboards, setting availability, and 
booking consultations. We needed a mechanism to bridge this statelessness 
gap.

Two standard approaches exist:

**Client-side session state** — the server issues a signed token (e.g. 
JWT) containing the user's identity. The client stores it and sends it 
with every request. The server validates the token cryptographically 
without storing anything server-side.

**Server-side session state** — the server stores session data in memory 
(or a database) and issues the client only a random, opaque session ID 
as a cookie. On each request the server looks up the session by that ID.

---

## Decision

We adopted **server-side session state** using `express-session`.

On successful login, the server writes user identity into a server-held 
session object:

```js
req.session.userId   = staff.staff_number;
req.session.userName = staff.name;
req.session.userRole = 'lecturer';
```

The session is identified by a random ID stored in an `HttpOnly`, 
`SameSite=Strict` cookie with an 8-hour expiry. The browser sends this 
cookie automatically on every subsequent request. The server looks up 
the session by ID and attaches the session data to `req.session` before 
any route handler runs.

Access to protected routes is enforced by middleware:

```js
const requireAuth = (req, res, next) => {
  if (req.session && req.session.userId) return next();
  return res.redirect('/login');
};
```

Role enforcement is layered on top:

```js
const requireRole = (role) => (req, res, next) => {
  if (req.session && req.session.userRole === role) return next();
  return res.status(403).send('Forbidden');
};
```

Logout explicitly destroys the server-side session:

```js
req.session.destroy(() => res.redirect('/login'));
```

---

## Consequences

### Why server-side over client-side tokens

**Single server deployment.** KnockKnock.prof runs on a single Render 
instance. The main drawback of server-side sessions — that session data 
doesn't travel across multiple servers behind a load balancer — does not 
apply to us. The scalability argument for JWTs is not relevant at our 
scale.

**Simpler revocation.** Server-side sessions can be invalidated 
immediately by calling `session.destroy()`. With client-side tokens, a 
logged-out token remains valid until it expires unless a blocklist is 
maintained — unnecessary complexity for this project.

**Reduced client exposure.** The session cookie carries only a random 
opaque ID. No user data is stored in the browser. A stolen cookie is 
useless once the session is destroyed server-side.

### Security measures applied

`HttpOnly: true` — the session cookie is not accessible to JavaScript 
running in the browser. This blocks cookie theft via XSS attacks.

`SameSite: 'strict'` — the cookie is not sent on cross-site requests, 
which mitigates CSRF attacks where a malicious third-party site attempts 
to make authenticated requests on a user's behalf.

`maxAge: 8 hours` — sessions expire automatically, limiting the window 
of exposure if a session ID is somehow compromised.

### Known limitations and deferred decisions

Passwords are currently stored and compared in plain text. Hashing with 
`bcryptjs` (already listed as a dependency) is deferred to Sprint 3 and 
documented as a security story in the backlog. This is acceptable for 
Sprint 2 internal testing but must be resolved before final release.

The session secret (`'knockknock-secret-change-before-deploy'`) is 
hardcoded in `app.js`. Before deployment this must be moved to an 
environment variable. This will be addressed when Render environment 
variables are configured.

Some dashboard routes currently fall back to a hardcoded test user when 
no session exists, bypassing authentication. This will be resolved when 
student login is implemented in Sprint 3.

---

## Alternatives Considered

**JWT (JSON Web Tokens)** — rejected because revocation requires 
maintaining a blocklist, implementation complexity is higher, and the 
single-server deployment makes the statelessness benefit irrelevant.

**No authentication** — not viable. The brief explicitly requires 
password hashing and basic security practices for Good/Excellent ratings.